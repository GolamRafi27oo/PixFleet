use image::{ImageBuffer, Rgba};
use pixfleet_lib::engine::{self, Preset, Source};
use std::{
    fs,
    path::Path,
    sync::atomic::{AtomicBool, Ordering},
};

#[test]
fn given_path_like_names_when_slugged_then_they_are_portable() {
    assert_eq!(engine::slug("../../Client \"Hero\".PNG"), "client-hero-png");
    assert_eq!(engine::slug("你好"), "image");
    assert!(!engine::slug("CON").contains('/'));
}

#[test]
fn given_small_original_when_resizing_then_no_upscale_or_duplicate_outputs() {
    assert_eq!(
        engine::effective_widths(&[640, 1024, 1920], 800),
        vec![640, 800]
    );
}

#[test]
fn given_transparent_png_when_exported_then_only_real_webp_and_avif_files_exist() {
    let folder = tempfile::tempdir().unwrap();
    let source = fixture(folder.path(), "ChatGPT Image Aug 12.png");
    let original = fs::read(&source.path).unwrap();
    let result = engine::export(
        std::slice::from_ref(&source),
        &preset(),
        folder.path(),
        &AtomicBool::new(false),
        |_| {},
    )
    .unwrap();
    let root = Path::new(&result.directory);
    let webp = fs::read(root.join("webp/pixfleet-001-32w.webp")).unwrap();
    let avif = fs::read(root.join("avif/pixfleet-001-32w.avif")).unwrap();
    let decoded = image::load_from_memory(&webp).unwrap().to_rgba8();
    assert_eq!(&webp[0..4], b"RIFF");
    assert_eq!(&webp[8..12], b"WEBP");
    assert!(avif.windows(4).any(|w| w == b"avif"));
    assert_eq!(decoded.dimensions(), (32, 16));
    assert_eq!(decoded.get_pixel(0, 0)[3], 0);
    assert_eq!(result.files, 4);
    assert_eq!(result.images, 1);
    assert_eq!(fs::read(source.path).unwrap(), original);
    assert_image_only_export(root, 4);
}

#[test]
fn given_cancelled_job_when_exporting_then_no_output_is_left() {
    let input = tempfile::tempdir().unwrap();
    let destination = tempfile::tempdir().unwrap();
    let result = engine::export(
        &[fixture(input.path(), "image.png")],
        &preset(),
        destination.path(),
        &AtomicBool::new(true),
        |_| {},
    )
    .unwrap();
    assert!(result.cancelled);
    assert_eq!(fs::read_dir(destination.path()).unwrap().count(), 0);
}

#[test]
fn given_running_job_when_cancelled_after_progress_then_staging_is_removed() {
    let input = tempfile::tempdir().unwrap();
    let destination = tempfile::tempdir().unwrap();
    let cancelled = AtomicBool::new(false);
    let result = engine::export(
        &[fixture(input.path(), "image.png")],
        &preset(),
        destination.path(),
        &cancelled,
        |p| {
            if p.completed == 1 {
                cancelled.store(true, Ordering::Relaxed);
            }
        },
    )
    .unwrap();
    assert!(result.cancelled);
    assert_eq!(fs::read_dir(destination.path()).unwrap().count(), 0);
}

#[test]
fn given_missing_source_when_exporting_a_batch_then_valid_images_still_ship() {
    let input = tempfile::tempdir().unwrap();
    let destination = tempfile::tempdir().unwrap();
    let sources = [
        Source {
            name: "missing.png".into(),
            path: input.path().join("missing.png"),
        },
        fixture(input.path(), "good.png"),
    ];
    let result = engine::export(
        &sources,
        &preset(),
        destination.path(),
        &AtomicBool::new(false),
        |_| {},
    )
    .unwrap();
    assert_eq!(result.images, 1);
    assert_eq!(result.errors.len(), 1);
    assert!(Path::new(&result.directory)
        .join("webp/pixfleet-002-32w.webp")
        .exists());
}

#[test]
fn given_existing_export_when_exported_again_then_original_output_is_unchanged() {
    let input = tempfile::tempdir().unwrap();
    let destination = tempfile::tempdir().unwrap();
    let sources = [fixture(input.path(), "image.png")];
    let first = engine::export(
        &sources,
        &preset(),
        destination.path(),
        &AtomicBool::new(false),
        |_| {},
    )
    .unwrap();
    let second = engine::export(
        &sources,
        &preset(),
        destination.path(),
        &AtomicBool::new(false),
        |_| {},
    )
    .unwrap();
    assert_ne!(first.directory, second.directory);
    assert!(Path::new(&first.directory)
        .join("webp/pixfleet-001-32w.webp")
        .exists());
    assert_eq!(fs::read_dir(destination.path()).unwrap().count(), 2);
}

#[test]
fn given_rotated_jpeg_with_exif_when_exported_then_orientation_is_applied_and_metadata_removed() {
    let input = tempfile::tempdir().unwrap();
    let path = input.path().join("rotated.jpg");
    ImageBuffer::from_pixel(64, 32, image::Rgb([120u8, 180, 80]))
        .save(&path)
        .unwrap();
    let bytes = fs::read(&path).unwrap();
    // Little-endian EXIF IFD containing orientation 6 (90 degrees clockwise).
    let exif: &[u8] = b"Exif\0\0II\x2a\0\x08\0\0\0\x01\0\x12\x01\x03\0\x01\0\0\0\x06\0\0\0\0\0\0\0";
    let mut tagged = vec![0xff, 0xd8, 0xff, 0xe1];
    tagged.extend_from_slice(&((exif.len() + 2) as u16).to_be_bytes());
    tagged.extend_from_slice(exif);
    tagged.extend_from_slice(&bytes[2..]);
    fs::write(&path, tagged).unwrap();
    let (decoded, _) = engine::decode(&path).unwrap();
    let result = engine::export(
        &[Source {
            path,
            name: "rotated.jpg".into(),
        }],
        &preset(),
        input.path(),
        &AtomicBool::new(false),
        |_| {},
    )
    .unwrap();
    let webp = fs::read(Path::new(&result.directory).join("webp/pixfleet-001-32w.webp")).unwrap();
    assert_eq!((decoded.width(), decoded.height()), (32, 64));
    assert!(!webp
        .windows(4)
        .any(|w| w == b"EXIF" || w == b"Exif" || w == b"XMP "));
}

#[test]
fn given_invalid_preset_when_exporting_then_nothing_is_written() {
    let destination = tempfile::tempdir().unwrap();
    let mut invalid = preset();
    invalid.widths = vec![0];
    let result = engine::export(
        &[],
        &invalid,
        destination.path(),
        &AtomicBool::new(false),
        |_| {},
    );
    assert!(result.is_err());
    assert_eq!(fs::read_dir(destination.path()).unwrap().count(), 0);
}

#[test]
fn given_corrupt_image_when_decoding_then_it_is_rejected() {
    let folder = tempfile::tempdir().unwrap();
    let path = folder.path().join("broken.jpg");
    fs::write(&path, b"not an image").unwrap();
    assert!(engine::decode(&path).is_err());
}

#[test]
fn given_oversize_input_when_decoding_then_file_limit_is_enforced() {
    let folder = tempfile::tempdir().unwrap();
    let path = folder.path().join("huge.jpg");
    fs::File::create(&path)
        .unwrap()
        .set_len(100 * 1024 * 1024 + 1)
        .unwrap();
    assert!(engine::decode(&path).unwrap_err().contains("100 MB"));
}

#[test]
fn given_animated_png_header_when_decoding_then_animation_is_rejected() {
    let folder = tempfile::tempdir().unwrap();
    let path = folder.path().join("animated.png");
    fs::write(&path, b"\x89PNG\r\n\x1a\n\0\0\0\0acTL\0\0\0\0").unwrap();
    assert!(engine::decode(&path).unwrap_err().contains("Animated"));
}

#[test]
fn given_only_missing_sources_when_exporting_then_no_final_folder_is_created() {
    let destination = tempfile::tempdir().unwrap();
    let result = engine::export(
        &[Source {
            path: destination.path().join("missing.jpg"),
            name: "missing.jpg".into(),
        }],
        &preset(),
        destination.path(),
        &AtomicBool::new(false),
        |_| {},
    );
    assert!(result.err().unwrap().contains("No images exported"));
    assert_eq!(fs::read_dir(destination.path()).unwrap().count(), 0);
}

#[test]
fn given_transparent_source_when_exported_as_png_jpeg_heic_then_codecs_and_alpha_are_correct() {
    let folder = tempfile::tempdir().unwrap();
    let source = fixture(folder.path(), "photo.png");
    let mut settings = preset();
    settings.formats = vec!["png".into(), "jpeg".into(), "heic".into()];
    settings.widths = vec![64];
    let result = engine::export(
        &[source],
        &settings,
        folder.path(),
        &AtomicBool::new(false),
        |_| {},
    )
    .unwrap();
    let output = Path::new(&result.directory);
    let png = fs::read(output.join("png/pixfleet-001-64w.png")).unwrap();
    let jpeg = fs::read(output.join("jpeg/pixfleet-001-64w.jpeg")).unwrap();
    let heic_path = output.join("heic/pixfleet-001-64w.heic");
    let heic = fs::read(&heic_path).unwrap();
    let decoded_png = image::load_from_memory(&png).unwrap().to_rgba8();
    let decoded_jpeg = image::load_from_memory(&jpeg).unwrap().to_rgb8();
    let (decoded_heic, _) = engine::decode(&heic_path).unwrap();

    assert_eq!(&png[..8], b"\x89PNG\r\n\x1a\n");
    assert_eq!(&jpeg[..3], &[0xff, 0xd8, 0xff]);
    assert_eq!(&heic[4..8], b"ftyp");
    assert_eq!(decoded_png.get_pixel(0, 0)[3], 0);
    assert!(decoded_jpeg
        .get_pixel(0, 0)
        .0
        .iter()
        .all(|channel| *channel > 245));
    assert_eq!((decoded_heic.width(), decoded_heic.height()), (64, 32));
    assert_eq!(decoded_heic.to_rgba8().get_pixel(0, 0)[3], 0);
    assert_eq!(result.files, 3);
    assert_image_only_export(output, 3);
}

#[test]
fn given_heic_only_export_when_exporting_then_only_the_image_is_written() {
    let folder = tempfile::tempdir().unwrap();
    let mut settings = preset();
    settings.formats = vec!["heic".into()];
    settings.widths = vec![32];
    let result = engine::export(
        &[fixture(folder.path(), "photo.png")],
        &settings,
        folder.path(),
        &AtomicBool::new(false),
        |_| {},
    )
    .unwrap();

    assert_eq!(result.files, 1);
    assert_image_only_export(Path::new(&result.directory), 1);
}

#[test]
fn given_heic_source_when_exporting_then_it_can_be_resized_to_web_formats() {
    let folder = tempfile::tempdir().unwrap();
    let mut settings = preset();
    settings.formats = vec!["heic".into()];
    settings.widths = vec![64];
    let original = engine::export(
        &[fixture(folder.path(), "photo.png")],
        &settings,
        folder.path(),
        &AtomicBool::new(false),
        |_| {},
    )
    .unwrap();
    let path = Path::new(&original.directory).join("heic/pixfleet-001-64w.heic");
    let before = fs::read(&path).unwrap();
    settings.formats = vec!["png".into(), "jpeg".into(), "webp".into()];
    settings.widths = vec![32];
    let result = engine::export(
        &[Source {
            path: path.clone(),
            name: "converted".into(),
        }],
        &settings,
        folder.path(),
        &AtomicBool::new(false),
        |_| {},
    )
    .unwrap();
    let decoded =
        image::open(Path::new(&result.directory).join("png/pixfleet-001-32w.png")).unwrap();

    assert_eq!(result.files, 3);
    assert!(result.errors.is_empty());
    assert_eq!((decoded.width(), decoded.height()), (32, 16));
    assert_eq!(fs::read(path).unwrap(), before);
}

#[test]
fn given_all_output_formats_when_validating_then_the_preset_is_accepted() {
    let mut settings = preset();
    settings.formats = vec![
        "webp".into(),
        "avif".into(),
        "png".into(),
        "jpeg".into(),
        "heic".into(),
    ];
    assert!(settings.validate().is_ok());
}

#[test]
fn given_duplicate_output_formats_when_validating_then_the_preset_is_rejected() {
    let mut settings = preset();
    settings.formats = vec!["png".into(), "png".into()];
    assert!(settings.validate().is_err());
}

#[test]
fn given_corrupt_heic_when_decoding_then_it_is_rejected_without_panicking() {
    let folder = tempfile::tempdir().unwrap();
    let path = folder.path().join("broken.heic");
    fs::write(&path, b"\0\0\0\x14ftypheic\0\0\0\0mif1").unwrap();
    assert!(engine::decode(&path).is_err());
}

fn preset() -> Preset {
    Preset {
        id: "test".into(),
        name: "Test".into(),
        formats: vec!["webp".into(), "avif".into()],
        quality: 80,
        widths: vec![32, 64, 128],
        prefix: String::new(),
    }
}
fn fixture(folder: &Path, name: &str) -> Source {
    let path = folder.join(name);
    ImageBuffer::from_fn(64, 32, |x, _y| {
        if x < 32 {
            Rgba([0u8, 0, 0, 0])
        } else {
            Rgba([80u8, 140, 100, 255])
        }
    })
    .save(&path)
    .unwrap();
    Source {
        path,
        name: name.into(),
    }
}

fn assert_image_only_export(root: &Path, expected_files: usize) {
    let mut files = 0;
    for entry in fs::read_dir(root).unwrap() {
        let entry = entry.unwrap();
        assert!(
            entry.file_type().unwrap().is_dir(),
            "Unexpected export sidecar: {:?}",
            entry.path()
        );
        for image in fs::read_dir(entry.path()).unwrap() {
            let image = image.unwrap();
            assert!(image.file_type().unwrap().is_file());
            assert!(matches!(
                image.path().extension().and_then(|s| s.to_str()),
                Some("webp" | "avif" | "png" | "jpeg" | "heic")
            ));
            files += 1;
        }
    }
    assert_eq!(files, expected_files);
}
