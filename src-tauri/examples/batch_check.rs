//! Reproducible synthetic batch smoke check. Writes only to the supplied directory.
//! cargo run --release --example batch_check --manifest-path src-tauri/Cargo.toml -- /tmp/pixfleet-qa
use image::{ImageBuffer, Rgb};
use pixfleet_lib::engine::{self, Preset, Source};
use std::{fs, path::PathBuf, sync::atomic::AtomicBool, time::Instant};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let root = PathBuf::from(
        std::env::args()
            .nth(1)
            .ok_or("Supply a QA output directory")?,
    );
    if root.exists() {
        return Err("Use a new directory to protect existing files".into());
    }
    fs::create_dir_all(root.join("originals"))?;
    let mut sources = Vec::new();
    for index in 0..50 {
        let name = format!("Client Photo {index:02}.jpg");
        let path = root.join("originals").join(&name);
        let image = ImageBuffer::from_fn(1280, 800, |x, y| {
            Rgb([
                ((x / 5 + index * 13) % 256) as u8,
                ((y / 3 + index * 7) % 256) as u8,
                (((x + y) / 8 + index * 17) % 256) as u8,
            ])
        });
        image.save(&path)?;
        sources.push(Source { path, name });
    }
    let preset = Preset {
        id: "qa".into(),
        name: "50-image smoke check".into(),
        formats: vec!["webp".into(), "avif".into()],
        quality: 80,
        widths: vec![640, 1024, 1920],
        prefix: "client".into(),
    };
    let start = Instant::now();
    let result = engine::export(&sources, &preset, &root, &AtomicBool::new(false), |p| {
        if p.completed % 10 == 0 {
            eprintln!("{} / {} images", p.completed, p.total);
        }
    })?;
    assert_eq!(result.images, 50);
    assert_eq!(result.files, 300);
    assert!(result.errors.is_empty());
    println!(
        "{}",
        serde_json::json!({ "images": result.images, "outputs": result.files, "inputBytes": result.input_bytes, "outputBytes": result.output_bytes, "seconds": start.elapsed().as_secs_f32(), "directory": result.directory })
    );
    Ok(())
}
