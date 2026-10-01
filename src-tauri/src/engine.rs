use image::{
    codecs::avif::AvifEncoder, imageops::FilterType, DynamicImage, ImageDecoder, ImageEncoder,
    ImageReader, Limits,
};
use serde::{Deserialize, Serialize};
use std::{
    collections::BTreeSet,
    fs,
    io::{BufWriter, Cursor, Write},
    path::{Path, PathBuf},
    sync::atomic::{AtomicBool, Ordering},
};

pub const MAX_FILES: usize = 500;
const MAX_BYTES: u64 = 100 * 1024 * 1024;
const MAX_PIXELS: u64 = 40_000_000;

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Preset {
    pub id: String,
    pub name: String,
    pub formats: Vec<String>,
    pub quality: u8,
    pub widths: Vec<u32>,
    pub prefix: String,
}

impl Preset {
    pub fn validate(&self) -> Result<(), String> {
        if self.name.trim().is_empty()
            || self.name.encode_utf16().count() > 80
            || self.id.is_empty()
            || self.id.len() > 100
        {
            return Err("Invalid preset name or ID".into());
        }
        if self.quality == 0 || self.quality > 100 {
            return Err("Quality must be 1–100".into());
        }
        if self.formats.is_empty()
            || self.formats.len() > 2
            || self.formats.iter().any(|f| f != "webp" && f != "avif")
            || self.formats.iter().collect::<BTreeSet<_>>().len() != self.formats.len()
        {
            return Err("Choose unique WebP and/or AVIF formats".into());
        }
        if self.widths.is_empty()
            || self.widths.len() > 6
            || self.widths.iter().any(|w| !(16..=8192).contains(w))
            || self.widths.iter().collect::<BTreeSet<_>>().len() != self.widths.len()
        {
            return Err("Choose 1–6 unique widths between 16 and 8192".into());
        }
        if self.prefix.encode_utf16().count() > 40 {
            return Err("Filename prefix is too long".into());
        }
        Ok(())
    }
}

#[derive(Clone)]
pub struct Source {
    pub path: PathBuf,
    pub name: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Variant {
    pub path: String,
    pub format: String,
    pub width: u32,
    pub height: u32,
    pub bytes: u64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportedImage {
    pub name: String,
    pub input_bytes: u64,
    pub variants: Vec<Variant>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Progress {
    pub completed: usize,
    pub total: usize,
    pub filename: String,
}

#[derive(Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportResult {
    pub directory: String,
    pub files: usize,
    pub images: usize,
    pub input_bytes: u64,
    pub output_bytes: u64,
    pub errors: Vec<String>,
    pub html: String,
    pub cancelled: bool,
}

pub fn slug(value: &str) -> String {
    let mut result = String::new();
    for c in value.chars() {
        if c.is_ascii_alphanumeric() {
            result.push(c.to_ascii_lowercase());
        } else if !result.is_empty() && !result.ends_with('-') {
            result.push('-');
        }
        if result.len() >= 64 {
            break;
        }
    }
    let result = result.trim_matches('-');
    if result.is_empty() {
        "image".into()
    } else {
        result.into()
    }
}

pub fn effective_widths(widths: &[u32], original: u32) -> Vec<u32> {
    widths
        .iter()
        .map(|w| (*w).min(original))
        .collect::<BTreeSet<_>>()
        .into_iter()
        .collect()
}

fn animated(bytes: &[u8]) -> bool {
    if bytes.starts_with(b"\x89PNG\r\n\x1a\n") {
        let mut pos = 8;
        while pos + 12 <= bytes.len() {
            let size = u32::from_be_bytes(bytes[pos..pos + 4].try_into().unwrap()) as usize;
            if &bytes[pos + 4..pos + 8] == b"acTL" {
                return true;
            }
            match pos.checked_add(size).and_then(|v| v.checked_add(12)) {
                Some(next) => pos = next,
                None => break,
            }
        }
    } else if bytes.starts_with(b"RIFF") {
        let mut pos = 12;
        while pos + 8 <= bytes.len() {
            if &bytes[pos..pos + 4] == b"ANIM" {
                return true;
            }
            let size = u32::from_le_bytes(bytes[pos + 4..pos + 8].try_into().unwrap()) as usize;
            match pos
                .checked_add(size)
                .and_then(|v| v.checked_add(8 + size % 2))
            {
                Some(next) => pos = next,
                None => break,
            }
        }
    }
    false
}

pub fn decode(path: &Path) -> Result<(DynamicImage, u64), String> {
    let metadata = fs::metadata(path).map_err(|e| e.to_string())?;
    if !metadata.is_file() || metadata.len() > MAX_BYTES {
        return Err("Not a file, or exceeds the 100 MB input limit".into());
    }
    // Read through a bounded handle in case the file grows after metadata inspection.
    use std::io::Read;
    let mut bytes = Vec::new();
    fs::File::open(path)
        .map_err(|e| e.to_string())?
        .take(MAX_BYTES + 1)
        .read_to_end(&mut bytes)
        .map_err(|e| e.to_string())?;
    if bytes.len() as u64 > MAX_BYTES {
        return Err("Input exceeds 100 MB".into());
    }
    if animated(&bytes) {
        return Err("Animated images are not supported; choose a still image".into());
    }
    let size = bytes.len() as u64;
    let mut reader = ImageReader::new(Cursor::new(bytes))
        .with_guessed_format()
        .map_err(|e| e.to_string())?;
    if !matches!(
        reader.format(),
        Some(image::ImageFormat::Jpeg | image::ImageFormat::Png | image::ImageFormat::WebP)
    ) {
        return Err("Supported inputs: JPEG, PNG and static WebP".into());
    }
    let mut limits = Limits::default();
    limits.max_image_width = Some(16000);
    limits.max_image_height = Some(16000);
    limits.max_alloc = Some(256 * 1024 * 1024);
    reader.limits(limits);
    let mut decoder = reader.into_decoder().map_err(|e| e.to_string())?;
    let (w, h) = decoder.dimensions();
    if w == 0 || h == 0 || u64::from(w) * u64::from(h) > MAX_PIXELS {
        return Err("Image exceeds the 40 megapixel limit".into());
    }
    let orientation = decoder.orientation().map_err(|e| e.to_string())?;
    let mut image = DynamicImage::from_decoder(decoder).map_err(|e| e.to_string())?;
    image.apply_orientation(orientation);
    Ok((image, size))
}

fn encode(image: &DynamicImage, format: &str, quality: u8, path: &Path) -> Result<u64, String> {
    let rgba = image.to_rgba8();
    let mut file = BufWriter::new(
        fs::OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(path)
            .map_err(|e| e.to_string())?,
    );
    if format == "webp" {
        let encoded = webp::Encoder::from_rgba(rgba.as_raw(), rgba.width(), rgba.height())
            .encode(quality as f32);
        file.write_all(&encoded).map_err(|e| e.to_string())?;
    } else {
        AvifEncoder::new_with_speed_quality(&mut file, 7, quality)
            .write_image(
                rgba.as_raw(),
                rgba.width(),
                rgba.height(),
                image::ExtendedColorType::Rgba8,
            )
            .map_err(|e| e.to_string())?;
    }
    file.flush().map_err(|e| e.to_string())?;
    file.get_ref().sync_all().map_err(|e| e.to_string())?;
    file.get_ref()
        .metadata()
        .map(|m| m.len())
        .map_err(|e| e.to_string())
}

pub fn escape_html(value: &str) -> String {
    value
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#39;")
}

pub fn snippets(images: &[ExportedImage]) -> String {
    let mut html = String::from("<!-- Replace empty alt text with a meaningful description for non-decorative images. -->\n");
    for image in images {
        html.push_str("<picture>\n");
        for format in ["avif", "webp"] {
            let variants: Vec<_> = image
                .variants
                .iter()
                .filter(|v| v.format == format)
                .collect();
            if !variants.is_empty() {
                let set = variants
                    .iter()
                    .map(|v| format!("{} {}w", escape_html(&v.path), v.width))
                    .collect::<Vec<_>>()
                    .join(", ");
                html.push_str(&format!("  <source type=\"image/{format}\" srcset=\"{set}\" sizes=\"(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1920px\">\n"));
            }
        }
        if let Some(fallback) = image
            .variants
            .iter()
            .filter(|v| v.format == "webp")
            .max_by_key(|v| v.width)
            .or_else(|| image.variants.iter().max_by_key(|v| v.width))
        {
            html.push_str(&format!("  <img src=\"{}\" width=\"{}\" height=\"{}\" alt=\"\" loading=\"lazy\" decoding=\"async\">\n", escape_html(&fallback.path), fallback.width, fallback.height));
        }
        html.push_str("</picture>\n\n");
    }
    html
}

pub fn export(
    sources: &[Source],
    preset: &Preset,
    destination: &Path,
    cancelled: &AtomicBool,
    progress: impl Fn(Progress),
) -> Result<ExportResult, String> {
    preset.validate()?;
    if sources.is_empty() || sources.len() > MAX_FILES {
        return Err("Select 1–500 images".into());
    }
    let stage = tempfile::Builder::new()
        .prefix(".pixfleet-")
        .tempdir_in(destination)
        .map_err(|e| e.to_string())?;
    let mut result = ExportResult::default();
    let mut completed = Vec::new();
    for (index, source) in sources.iter().enumerate() {
        if cancelled.load(Ordering::Relaxed) {
            return Ok(ExportResult {
                cancelled: true,
                ..Default::default()
            });
        }
        progress(Progress {
            completed: index,
            total: sources.len(),
            filename: source.name.clone(),
        });
        let stem = Path::new(&source.name)
            .file_stem()
            .unwrap_or_default()
            .to_string_lossy();
        let prefix = if preset.prefix.trim().is_empty() {
            String::new()
        } else {
            format!("{}-", slug(&preset.prefix))
        };
        let basename = format!("{prefix}{}-{:03}", slug(&stem), index + 1);
        let mut written = Vec::new();
        let attempt = (|| -> Result<ExportedImage, String> {
            let (image, input_bytes) = decode(&source.path)?;
            let mut variants = Vec::new();
            for width in effective_widths(&preset.widths, image.width()) {
                let height = ((u64::from(image.height()) * u64::from(width)
                    + u64::from(image.width()) / 2)
                    / u64::from(image.width()))
                .max(1) as u32;
                let resized = image.resize_exact(width, height, FilterType::Lanczos3);
                for format in &preset.formats {
                    if cancelled.load(Ordering::Relaxed) {
                        return Err("Cancelled".into());
                    }
                    fs::create_dir_all(stage.path().join(format)).map_err(|e| e.to_string())?;
                    let relative = format!("{format}/{basename}-{width}w.{format}");
                    let path = stage.path().join(&relative);
                    written.push(path.clone());
                    let bytes = encode(&resized, format, preset.quality, &path)?;
                    variants.push(Variant {
                        path: relative,
                        format: format.clone(),
                        width,
                        height,
                        bytes,
                    });
                }
            }
            Ok(ExportedImage {
                name: source.name.clone(),
                input_bytes,
                variants,
            })
        })();
        match attempt {
            Ok(image) => {
                result.input_bytes += image.input_bytes;
                result.output_bytes += image.variants.iter().map(|v| v.bytes).sum::<u64>();
                result.files += image.variants.len();
                completed.push(image);
            }
            Err(error) => {
                for path in written {
                    if let Err(e) = fs::remove_file(path) {
                        if e.kind() != std::io::ErrorKind::NotFound {
                            return Err(format!("Could not clean incomplete output: {e}"));
                        }
                    }
                }
                result.errors.push(format!("{}: {}", source.name, error));
            }
        }
        progress(Progress {
            completed: index + 1,
            total: sources.len(),
            filename: source.name.clone(),
        });
    }
    if cancelled.load(Ordering::Relaxed) {
        return Ok(ExportResult {
            cancelled: true,
            ..Default::default()
        });
    }
    if completed.is_empty() {
        return Err(format!("No images exported. {}", result.errors.join("; ")));
    }
    result.images = completed.len();
    result.html = snippets(&completed);
    fs::write(stage.path().join("images.html"), &result.html).map_err(|e| e.to_string())?;
    let manifest = serde_json::json!({ "schemaVersion": 1, "preset": preset, "images": completed, "errors": result.errors });
    fs::write(
        stage.path().join("manifest.json"),
        serde_json::to_vec_pretty(&manifest).map_err(|e| e.to_string())?,
    )
    .map_err(|e| e.to_string())?;
    fs::write(stage.path().join("README.txt"), "PixFleet export\n\nKeep the format folders beside images.html. Adjust sizes to match your CSS layout and add descriptive alt text. Use eager loading for above-the-fold hero images. AVIF-only exports have no WebP fallback. Source metadata is removed; verify color on wide-gamut originals.\n").map_err(|e| e.to_string())?;
    let output = destination.join(format!("pixfleet-{}", uuid::Uuid::new_v4()));
    fs::rename(stage.path(), &output).map_err(|e| e.to_string())?;
    result.directory = output.to_string_lossy().into_owned();
    Ok(result)
}
