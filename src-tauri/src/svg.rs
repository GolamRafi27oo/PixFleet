use image::{DynamicImage, RgbaImage};
use resvg::{tiny_skia, usvg};
use std::sync::{Arc, OnceLock};

/// Rasterize a static SVG at its intrinsic size, using the same limits as photos.
pub fn decode(bytes: &[u8]) -> Result<DynamicImage, String> {
    let text = std::str::from_utf8(bytes).map_err(|_| "SVG must use UTF-8 encoding")?;
    let document = usvg::roxmltree::Document::parse_with_options(
        text,
        usvg::roxmltree::ParsingOptions {
            nodes_limit: 1_000_000,
            ..Default::default()
        },
    )
    .map_err(|e| format!("Invalid SVG: {e}"))?;
    let root = document.root_element();
    if root.tag_name().name() != "svg"
        || root.tag_name().namespace() != Some("http://www.w3.org/2000/svg")
    {
        return Err("Invalid SVG: expected an SVG root element and namespace".into());
    }
    for node in document.descendants().filter(|node| node.is_element()) {
        if matches!(
            node.tag_name().name(),
            "script" | "foreignObject" | "animate" | "animateMotion" | "animateTransform" | "set"
        ) {
            return Err("SVG scripts, animation and foreignObject content are not supported; export a static SVG with text converted to paths".into());
        }
        // Prevent silently dropping linked artwork or reading arbitrary local files.
        for attribute in node.attributes() {
            if attribute.name() == "href" && !attribute.value().starts_with('#') {
                return Err("SVG linked or embedded images are not supported; convert the artwork to vector paths before importing".into());
            }
        }
    }
    static FONTS: OnceLock<Arc<usvg::fontdb::Database>> = OnceLock::new();
    let fonts = FONTS.get_or_init(|| {
        let mut fonts = usvg::fontdb::Database::new();
        fonts.load_system_fonts();
        Arc::new(fonts)
    });
    let options = usvg::Options {
        fontdb: fonts.clone(),
        // Never let the renderer load files or nested image documents.
        image_href_resolver: usvg::ImageHrefResolver {
            resolve_data: Box::new(|_, _, _| None),
            resolve_string: Box::new(|_, _| None),
        },
        ..Default::default()
    };
    let tree =
        usvg::Tree::from_xmltree(&document, &options).map_err(|e| format!("Invalid SVG: {e}"))?;
    let size = tree.size().to_int_size();
    let (width, height) = (size.width(), size.height());
    if width > 16000 || height > 16000 || u64::from(width) * u64::from(height) > 40_000_000 {
        return Err("SVG exceeds the 16,000 pixel dimension or 40 megapixel limit".into());
    }
    let mut pixmap = tiny_skia::Pixmap::new(width, height).ok_or("Unable to allocate SVG image")?;
    resvg::render(
        &tree,
        tiny_skia::Transform::identity(),
        &mut pixmap.as_mut(),
    );
    // tiny-skia uses premultiplied alpha; image encoders expect straight RGBA.
    let mut rgba = Vec::with_capacity(pixmap.data().len());
    for pixel in pixmap.pixels() {
        let pixel = pixel.demultiply();
        rgba.extend_from_slice(&[pixel.red(), pixel.green(), pixel.blue(), pixel.alpha()]);
    }
    RgbaImage::from_raw(width, height, rgba)
        .map(DynamicImage::ImageRgba8)
        .ok_or_else(|| "Unable to create SVG image".into())
}
