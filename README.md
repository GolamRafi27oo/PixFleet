# PixFleet

A local image preparation workspace for macOS, Windows and Linux. Built with **Next.js, React, TypeScript, Tailwind CSS, pnpm and Tauri 2**.

![PixFleet workspace](docs/screenshots/workspace.jpg)

Import a folder, choose a preset, and export compressed WebP/AVIF images at multiple widths, portable filenames, organized format folders, metadata-free images, responsive HTML and a JSON manifest. No uploads, account, application server, telemetry or hosted database.

## Start developing

Requirements: Node.js 24, pnpm 10.22, current stable Rust, and the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for your OS.

```sh
pnpm install --frozen-lockfile
pnpm desktop
```

macOS needs Xcode command line tools. Windows needs the MSVC C++ build tools and WebView2. Linux needs WebKitGTK 4.1 and distribution build libraries; see the CI workflow for Ubuntu 24.04 packages.

`pnpm dev` runs the interface preview at http://127.0.0.1:3000. Image processing, native dialogs and durable presets require the desktop app. The preview never uploads files or pretends to process them.

## Verify and package

```sh
pnpm check
cargo fmt --manifest-path src-tauri/Cargo.toml --check
cargo clippy --manifest-path src-tauri/Cargo.toml --locked --all-targets -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml --locked
pnpm desktop:build
```

Installers are written to `src-tauri/target/release/bundle`. Build on each target OS; the included GitHub Actions workflow checks and packages all three. Artifacts are unsigned development builds until signing credentials are supplied. Webpack is explicitly selected for predictable static builds in environments that restrict Turbopack worker ports.

## Supported workflow

- JPEG, PNG and static WebP input; transparent WebP and AVIF output.
- File/folder picker and native drag/drop, recursive folder import, duplicate suppression.
- Up to 500 images per workspace, 100 MB per file, 40 megapixels and 16,000 pixels per dimension.
- 1–6 output widths, no upscaling, preserved aspect ratio, duplicate effective widths removed.
- Built-in and locally saved presets, adjustable quality and filename prefix.
- EXIF orientation applied before source metadata is discarded.
- Progress, cancellation between outputs, partial failure reporting, fresh output folder per export.
- Ready-to-copy HTML plus `images.html`, `manifest.json` and export instructions.

The early-access edition has all features available. The 500-image limit is a resource guard, not a Free/Pro restriction. There is no payment processing or license enforcement yet.

## Output example

```text
pixfleet-<unique-id>/
  webp/client-hero-001-640w.webp
  webp/client-hero-001-1024w.webp
  avif/client-hero-001-640w.avif
  avif/client-hero-001-1024w.avif
  images.html
  manifest.json
  README.txt
```

Originals remain untouched. Total export size may exceed input size because you are creating multiple derivatives. Add alt text, adapt `sizes` to your layout and use eager loading for hero images before publishing snippets.

## Important boundaries

Use sRGB originals for predictable colors. ICC/wide-gamut profiles are not preserved or color-managed. Animation, HEIC, SVG, RAW and AVIF inputs are rejected or omitted by folder import. Export cancellation waits for an active encode to finish. Closing or force-quitting during export may leave a hidden `.pixfleet-*` staging folder in the chosen destination; it can be removed after confirming no export is running.

This repository is an implemented early-access application, not a signed commercial release. Cross-platform source and CI are included; actual platform verification is recorded in [validation](docs/VALIDATION.md), never inferred from configuration alone.

## Documentation

- [Architecture and self-review](docs/ARCHITECTURE.md)
- [Implementation plan](docs/IMPLEMENTATION_PLAN.md)
- [User guide](docs/USER_GUIDE.md)
- [Security boundaries](docs/SECURITY.md)
- [Release checklist](docs/RELEASING.md)
- [Verification record](docs/VALIDATION.md)
