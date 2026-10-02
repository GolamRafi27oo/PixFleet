# Verification record

Verified on 2 October 2026 on Apple Silicon macOS. A configured CI job is not evidence of a successful platform run.

## Passed

- `pnpm check`: strict TypeScript, Biome lint/import/format checks with no warnings, 8 Vitest tests and Next.js production static export.
- `pnpm format:check` and `cargo fmt --check`.
- `cargo clippy --offline --all-targets -- -D warnings`.
- `cargo test --offline`: 14 native integration tests with real WebP and AVIF encoders. Coverage includes output signatures, alpha, aspect ratio, duplicate effective widths, EXIF rotation, removal of EXIF/XMP, portable filenames, original preservation, cancellation after output was written, partial failures, all-failure cleanup, corrupt inputs, animation headers and oversized files.
- Optimized Apple Silicon `PixFleet.app` bundle, approximately 7.6 MiB. This is a local development artifact, not an Apple-notarized release.
- Final Apple Silicon DMG installer: `src-tauri/target/release/bundle/dmg/PixFleet_0.1.0_aarch64.dmg`, 3,723,229 bytes (3.55 MiB), with an adjacent SHA-256 checksum file. The DMG includes the application; the bundler removes the intermediate standalone `.app` when building only the DMG target.
- Browser UI inspection at desktop and narrow widths: navigation, built-in preset selection, invalid width validation, preset dialog and session preset saving. Empty export remains disabled. Desktop export action stays visible while settings scroll. Screenshot: `docs/screenshots/workspace.jpg`.
- `pnpm audit --prod`: 0 reported production dependency advisories at verification time. This does not include a RustSec audit.

## 50-image batch smoke check

The checked-in `src-tauri/examples/batch_check.rs` generated 50 synthetic JPEGs at 1280 × 800 and exported WebP and AVIF at widths 640, 1024 and 1920 (the latter clamped to 1280).

| Measurement                   | Result       |
| ----------------------------- | ------------ |
| Successfully processed images | 50           |
| Output image files            | 300          |
| Failures                      | 0            |
| Input bytes                   | 2,586,251    |
| Total output bytes            | 2,056,828    |
| Elapsed export time           | 67.1 seconds |

All 300 manifest paths, actual byte counts, filename uniqueness and no-upscale dimensions were independently checked. A browser successfully decoded representative AVIF and WebP files at 640 × 400. macOS `sips` crashed while inspecting AVIF, so the independent decoder check used the browser instead. This is a synthetic correctness/load check, not a benchmark for real client photography or other computers.

Reproduce with a new output directory:

```sh
cargo run --release --example batch_check --manifest-path src-tauri/Cargo.toml -- /tmp/pixfleet-qa-new
```

## Pending platform checks

- Native macOS dialog, drag/drop, clipboard and restart-persistence UI checks: Computer Use was unavailable because its macOS permissions were not granted. The Rust processing engine was verified separately; the browser preview does not exercise native IPC.
- Windows and Linux CI packaging and clean-machine installation; Intel macOS build and runtime.
- Real-photo visual quality, wide-gamut behavior, sustained peak memory on low-memory machines, disk-full errors, and assistive-technology testing.
- RustSec dependency audit before a public release.

## Local toolchain note

Node 24 and pnpm 10.22 were already installed. Verification used an isolated Rust 1.99 toolchain in `/tmp` without changing shell profiles. For this session only, native commands can use:

```sh
export RUSTUP_HOME=/tmp/pixfleet-rustup
export CARGO_HOME=/tmp/pixfleet-cargo
export PATH="$CARGO_HOME/bin:$PATH"
pnpm desktop
```

Install a persistent stable Rust toolchain using the official Rust installer for ongoing development. End users of the built app do not need Node, pnpm or Rust.

## Release limitations

Apple/Windows signing credentials, notarization, checkout and real license enforcement are not configured. Windows/Linux installers and Intel macOS support must be verified on their own runners and hardware before claiming tested support. Wide-gamut color management is outside this version.
