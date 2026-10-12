use image::{
    codecs::{avif::AvifEncoder, jpeg::JpegEncoder, png::PngEncoder},
    imageops::FilterType,
    DynamicImage, ImageDecoder, ImageEncoder, ImageReader, Limits,
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
    #[serde(default)]
    pub allow_upscaling: bool,
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
            || self.formats.len() > 5
            || self
                .formats
                .iter()
                .any(|f| !matches!(f.as_str(), "webp" | "avif" | "png" | "jpeg" | "heic"))
            || self.formats.iter().collect::<BTreeSet<_>>().len() != self.formats.len()
        {
            return Err("Choose unique WebP, AVIF, PNG, JPEG or HEIC formats".into());
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

pub fn effective_widths(widths: &[u32], original: u32, allow_upscaling: bool) -> Vec<u32> {
    widths
        .iter()
        .map(|w| {
            if allow_upscaling {
                *w
            } else {
                (*w).min(original)
            }
        })
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
    if path
        .extension()
        .is_some_and(|ext| ext.eq_ignore_ascii_case("svg"))
    {
        return crate::svg::decode(&bytes).map(|image| (image, size));
    }
    if crate::heic::is_heic(&bytes) {
        return crate::heic::decode(&bytes).map(|image| (image, size));
    }
    let mut reader = ImageReader::new(Cursor::new(bytes))
        .with_guessed_format()
        .map_err(|e| e.to_string())?;
    if !matches!(
        reader.format(),
        Some(image::ImageFormat::Jpeg | image::ImageFormat::Png | image::ImageFormat::WebP)
    ) {
        return Err("Supported inputs: JPEG, PNG, static WebP, HEIC/HEIF and static SVG".into());
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
    match format {
        "webp" => {
            let encoded = webp::Encoder::from_rgba(rgba.as_raw(), rgba.width(), rgba.height())
                .encode(quality as f32);
            file.write_all(&encoded).map_err(|e| e.to_string())?;
        }
        "avif" => AvifEncoder::new_with_speed_quality(&mut file, 7, quality)
            .write_image(
                rgba.as_raw(),
                rgba.width(),
                rgba.height(),
                image::ExtendedColorType::Rgba8,
            )
            .map_err(|e| e.to_string())?,
        "png" => PngEncoder::new(&mut file)
            .write_image(
                rgba.as_raw(),
                rgba.width(),
                rgba.height(),
                image::ExtendedColorType::Rgba8,
            )
            .map_err(|e| e.to_string())?,
        "jpeg" => {
            // JPEG has no alpha channel. Composite onto white instead of dropping alpha.
            let rgb = image::RgbImage::from_fn(rgba.width(), rgba.height(), |x, y| {
                let pixel = rgba.get_pixel(x, y);
                let alpha = u32::from(pixel[3]);
                image::Rgb([0, 1, 2].map(|c| {
                    ((u32::from(pixel[c]) * alpha + 255 * (255 - alpha) + 127) / 255) as u8
                }))
            });
            JpegEncoder::new_with_quality(&mut file, quality)
                .encode(
                    rgb.as_raw(),
                    rgb.width(),
                    rgb.height(),
                    image::ExtendedColorType::Rgb8,
                )
                .map_err(|e| e.to_string())?;
        }
        "heic" => file
            .write_all(&crate::heic::encode(&rgba, quality)?)
            .map_err(|e| e.to_string())?,
        _ => return Err("Unsupported output format".into()),
    }
    file.flush().map_err(|e| e.to_string())?;
    file.get_ref().sync_all().map_err(|e| e.to_string())?;
    file.get_ref()
        .metadata()
        .map(|m| m.len())
        .map_err(|e| e.to_string())
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
        let prefix = if preset.prefix.trim().is_empty() {
            "pixfleet".to_owned()
        } else {
            slug(&preset.prefix)
        };
        let basename = format!("{prefix}-{:03}", index + 1);
        let mut written = Vec::new();
        let attempt = (|| -> Result<(u64, u64, usize), String> {
            let (image, input_bytes) = decode(&source.path)?;
            let mut output_bytes = 0;
            let mut files = 0;
            for width in effective_widths(&preset.widths, image.width(), preset.allow_upscaling) {
                let height = ((u64::from(image.height()) * u64::from(width)
                    + u64::from(image.width()) / 2)
                    / u64::from(image.width()))
                .max(1) as u32;
                if width > 16000
                    || height > 16000
                    || u64::from(width) * u64::from(height) > MAX_PIXELS
                {
                    return Err("Requested output exceeds 16,000 pixels per dimension or 40 megapixels. Choose a smaller width.".into());
                }
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
                    output_bytes += bytes;
                    files += 1;
                }
            }
            Ok((input_bytes, output_bytes, files))
        })();
        match attempt {
            Ok((input_bytes, output_bytes, files)) => {
                result.input_bytes += input_bytes;
                result.output_bytes += output_bytes;
                result.files += files;
                result.images += 1;
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
    if result.images == 0 {
        return Err(format!("No images exported. {}", result.errors.join("; ")));
    }
    let output = destination.join(format!("pixfleet-{}", uuid::Uuid::new_v4()));
    fs::rename(stage.path(), &output).map_err(|e| e.to_string())?;
    result.directory = output.to_string_lossy().into_owned();
    Ok(result)
}
