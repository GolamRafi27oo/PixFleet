use image::{DynamicImage, RgbaImage};
use libheif_rs::{
    Channel, ColorSpace, CompressionFormat, EncoderQuality, HeifContext, Image, LibHeif, RgbChroma,
};

// Only inspect the bounded ftyp box; never classify by the filename extension.
pub fn is_heic(bytes: &[u8]) -> bool {
    if bytes.len() < 16 || &bytes[4..8] != b"ftyp" {
        return false;
    }
    let size = u32::from_be_bytes(bytes[0..4].try_into().unwrap()) as usize;
    if size < 16 || size > bytes.len() || size > 4096 {
        return false;
    }
    let brands: Vec<_> = std::iter::once(&bytes[8..12])
        .chain(
            bytes[16..size]
                .as_chunks::<4>()
                .0
                .iter()
                .map(|brand| brand.as_slice()),
        )
        .collect();
    if brands
        .iter()
        .any(|brand| matches!(*brand, b"avif" | b"avis"))
    {
        return false;
    }
    brands.iter().any(|brand| {
        matches!(
            *brand,
            b"heic" | b"heix" | b"hevc" | b"hevx" | b"mif1" | b"msf1"
        )
    })
}

pub fn decode(bytes: &[u8]) -> Result<DynamicImage, String> {
    let lib = LibHeif::new();
    let mut context = HeifContext::new().map_err(|e| e.to_string())?;
    let mut limits = context.security_limits();
    limits.set_max_image_size_pixels(40_000_000);
    limits.set_max_memory_block_size(256 * 1024 * 1024);
    limits.set_max_total_memory(512 * 1024 * 1024);
    context
        .set_security_limits(&limits)
        .map_err(|e| e.to_string())?;
    context.set_max_decoding_threads(1);
    context.read_bytes(bytes).map_err(|e| e.to_string())?;
    if context.has_sequence() {
        return Err("HEIC image sequences are not supported; choose a still image".into());
    }
    // Collections (such as depth-enabled camera photos) use the primary image.
    let handle = context.primary_image_handle().map_err(|e| e.to_string())?;
    check_dimensions(handle.width(), handle.height())?;
    // libheif applies the container's rotation, crop, and mirror transformations.
    let decoded = lib
        .decode(&handle, ColorSpace::Rgb(RgbChroma::Rgba), None)
        .map_err(|e| e.to_string())?;
    let (width, height) = (decoded.width(), decoded.height());
    check_dimensions(width, height)?;
    let planes = decoded.planes();
    let plane = planes
        .interleaved
        .ok_or("HEIC decoder returned no pixels")?;
    let row_bytes = width as usize * 4;
    if plane.stride < row_bytes || plane.data.len() < plane.stride * height as usize {
        return Err("HEIC decoder returned an invalid pixel layout".into());
    }
    let mut pixels = Vec::with_capacity(row_bytes * height as usize);
    for row in plane.data.chunks(plane.stride).take(height as usize) {
        pixels.extend_from_slice(&row[..row_bytes]);
    }
    let rgba = RgbaImage::from_raw(width, height, pixels).ok_or("Invalid HEIC dimensions")?;
    Ok(DynamicImage::ImageRgba8(rgba))
}

pub fn encode(rgba: &RgbaImage, quality: u8) -> Result<Vec<u8>, String> {
    let lib = LibHeif::new();
    let mut context = HeifContext::new().map_err(|e| e.to_string())?;
    let mut encoder = lib
        .encoder_for_format(CompressionFormat::Hevc)
        .map_err(|e| format!("HEIC encoder unavailable: {e}"))?;
    encoder
        .set_quality(EncoderQuality::Lossy(quality))
        .map_err(|e| e.to_string())?;
    let (width, height) = rgba.dimensions();
    let mut image =
        Image::new(width, height, ColorSpace::Rgb(RgbChroma::Rgba)).map_err(|e| e.to_string())?;
    image
        .create_plane(Channel::Interleaved, width, height, 8)
        .map_err(|e| e.to_string())?;
    let planes = image.planes_mut();
    let plane = planes
        .interleaved
        .ok_or("HEIC encoder returned no pixel plane")?;
    let row_bytes = width as usize * 4;
    for (source, destination) in rgba
        .as_raw()
        .chunks_exact(row_bytes)
        .zip(plane.data.chunks_mut(plane.stride))
    {
        destination[..row_bytes].copy_from_slice(source);
    }
    // Create a fresh container: no source EXIF, GPS, thumbnails, or XMP is copied.
    context
        .encode_image(&image, &mut encoder, None)
        .map_err(|e| e.to_string())?;
    context.write_to_bytes().map_err(|e| e.to_string())
}

fn check_dimensions(width: u32, height: u32) -> Result<(), String> {
    if width == 0
        || height == 0
        || width > 16000
        || height > 16000
        || u64::from(width) * u64::from(height) > 40_000_000
    {
        return Err("Image exceeds the 40 megapixel or 16000 pixel dimension limit".into());
    }
    Ok(())
}
