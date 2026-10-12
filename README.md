# PixFleet

A local image preparation workspace for macOS, Windows and Linux. The current release is **0.2.3**. Built with **Next.js, React, TypeScript, Tailwind CSS, pnpm and Tauri 2**.

![PixFleet workspace](docs/screenshots/workspace.jpg)

Import a folder, choose a preset, and export WebP, AVIF, PNG, JPEG or HEIC images at multiple widths, portable filenames, organized format folders, metadata-free images. No uploads, account, application server, telemetry or hosted database.

## Set up the project

Install Git, **Node.js 24**, **pnpm 10.22.0**, and **current stable Rust** using [rustup](https://rustup.rs/). Rust's `cargo` command must be available in your terminal. Follow the platform prerequisites below before building.

```sh
npm install --global pnpm@10.22.0
git clone git@github.com:GolamRafi27oo/PixFleet.git
cd PixFleet
pnpm install --frozen-lockfile
```

If you already have the project, open a terminal in its root folder (the folder containing `package.json`). Run every build command below from that folder. The first build needs internet access to download dependencies and packaging tools; the installed app processes images offline.

## Build installers for macOS, Windows and Linux

**Build each installer on its matching operating system:** macOS on a Mac, Windows on Windows, and Linux on Linux. `pnpm desktop:build` builds all configured installer formats for the **current OS**, not all three operating systems at once. To build all three without owning three machines, use the [GitHub Actions workflow](#build-all-three-platforms-with-github-actions).

The commands below build the CPU architecture of the current Rust host toolchain by default. For example, an Apple Silicon Mac produces an ARM64 build; an Intel Mac produces an x64 build. Build and test each architecture you plan to distribute.

### macOS

1. Install Xcode Command Line Tools, if they are not already installed:

   ```sh
   xcode-select --install
   ```

2. Make sure Cargo is available in your shell. If you are using the isolated Rust toolchain used for PixFleet validation, configure it for the current terminal session:

   ```sh
   export RUSTUP_HOME=/tmp/pixfleet-rustup
   export CARGO_HOME=/tmp/pixfleet-cargo
   export PATH="$CARGO_HOME/bin:$PATH"
   ```

   A regular Rust installation from [rustup](https://rustup.rs/) works too; in that case, skip these exports.

3. Complete the project setup above, then build both the application and disk-image installer:

   ```sh
   pnpm tauri build --bundles app,dmg
   ```

   To build only the DMG installer:

   ```sh
   pnpm tauri build --bundles dmg
   ```

4. Find the results relative to the project root:

   ```text
   src-tauri/target/release/bundle/macos/PixFleet.app
   src-tauri/target/release/bundle/dmg/PixFleet_0.2.3_aarch64.dmg
   ```

   The DMG filename above is an Apple Silicon example for version `0.2.3`. Intel builds use `x64` in the filename, and the version changes with the app version.

Open the `.dmg` and drag **PixFleet** into **Applications**, or run the `.app` directly. To create only the app, use `pnpm tauri build --bundles app`. To create only the installer, use `pnpm tauri build --bundles dmg`; a DMG-only build may remove the intermediate `.app` after packaging.

macOS builds use free ad-hoc signing, including builds from GitHub Actions. No Apple account or signing secrets are required. These builds are not Apple-notarized, so downloaded copies still require manual approval. For installation without this extra approval, configure Developer ID signing and notarization. See [Tauri's macOS signing guide](https://v2.tauri.app/distribute/sign/macos/).

#### Opening a downloaded macOS build

1. Open the DMG and drag **PixFleet** into **Applications**.
2. Try opening PixFleet. If macOS blocks it, open **System Settings → Privacy & Security** and select **Open Anyway**, if available, then confirm.
3. If your trusted PixFleet download still shows “damaged and can't be opened”, remove quarantine from only the installed app, then try opening it again:

   ```sh
   xattr -dr com.apple.quarantine "/Applications/PixFleet.app"
   ```

Only use this command for a build you trust. It does not repair corrupted files or an invalid signature. If opening still fails, check the signature with `codesign --verify --deep --strict --verbose=2 "/Applications/PixFleet.app"` and report the output. Do not disable Gatekeeper globally.

### Windows

1. Install **Visual Studio Build Tools** with the **Desktop development with C++** workload and a Windows SDK. Install the **Microsoft Edge WebView2 Runtime** if it is missing. Use Rust's **MSVC** toolchain, rather than GNU.
2. Open PowerShell in the project root after completing project setup:

   ```powershell
   pnpm tauri build --bundles nsis,msi
   ```

3. Find the installer files:

   ```text
   src-tauri\target\release\bundle\nsis\*-setup.exe
   src-tauri\target\release\bundle\msi\*.msi
   ```

   For a version `0.2.3` x64 build with the default installer language, expected filenames are `PixFleet_0.2.3_x64-setup.exe` and `PixFleet_0.2.3_x64_en-US.msi`. Use the paths printed at the end of your build as the source of truth.

Run either installer to install PixFleet. For only the EXE installer, use `pnpm tauri build --bundles nsis`. The raw executable at `src-tauri\target\release\pixfleet.exe` is not an installer and still needs WebView2 on the destination machine.

MSI packaging requires the Windows VBScript optional feature. If WiX reports `failed to run light.exe`, check that feature or build the NSIS installer instead. Windows signing is not configured. The default installer may download WebView2 if needed; a fully offline installation requires a separate WebView2 bundling configuration. See the official [Windows prerequisites](https://v2.tauri.app/start/prerequisites/#windows) and [Windows installer guide](https://v2.tauri.app/distribute/windows-installer/).

### Linux — Ubuntu 24.04 build example

1. Install the native dependencies used by this project's Ubuntu CI runner:

   ```sh
   sudo apt-get update
   sudo apt-get install -y libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev librsvg2-dev libayatana-appindicator3-dev patchelf
   ```

2. Complete project setup, then build the Linux packages:

   ```sh
   pnpm tauri build --bundles deb,rpm,appimage
   ```

3. Find the results:

   ```text
   src-tauri/target/release/bundle/deb/*.deb
   src-tauri/target/release/bundle/rpm/*.rpm
   src-tauri/target/release/bundle/appimage/*.AppImage
   ```

Choose the package for your distribution: `.deb` for Debian/Ubuntu, `.rpm` for RPM-based distributions, or `.AppImage` for distributions compatible with that build. Package filenames include the version and architecture; the build prints each exact output path. To build just one format, use, for example, `pnpm tauri build --bundles deb`.

To try the AppImage from the project root:

```sh
chmod +x src-tauri/target/release/bundle/appimage/*.AppImage
./src-tauri/target/release/bundle/appimage/*.AppImage
```

Use the exact filename instead of `*` if the folder contains multiple versions. Linux builds depend on system library versions; an Ubuntu 24.04 build is not a promise of compatibility with every older distribution. The raw executable is `src-tauri/target/release/pixfleet`. See [Linux prerequisites for other distributions](https://v2.tauri.app/start/prerequisites/#linux) and [AppImage compatibility guidance](https://v2.tauri.app/distribute/appimage/).

### Build output path reference

All paths below are **relative to the PixFleet project root**. `*` means the generated filename, not a literal filename to create.

| Platform | Artifact       | Default output path                                   |
| -------- | -------------- | ----------------------------------------------------- |
| macOS    | Application    | `src-tauri/target/release/bundle/macos/PixFleet.app`  |
| macOS    | DMG installer  | `src-tauri/target/release/bundle/dmg/*.dmg`           |
| Windows  | EXE installer  | `src-tauri/target/release/bundle/nsis/*-setup.exe`    |
| Windows  | MSI installer  | `src-tauri/target/release/bundle/msi/*.msi`           |
| Linux    | Debian package | `src-tauri/target/release/bundle/deb/*.deb`           |
| Linux    | RPM package    | `src-tauri/target/release/bundle/rpm/*.rpm`           |
| Linux    | AppImage       | `src-tauri/target/release/bundle/appimage/*.AppImage` |

These paths assume the default Cargo target directory and no explicit `--target` argument. With `--target <target-triple>`, outputs move under `src-tauri/target/<target-triple>/release/bundle/`. With `--debug`, replace `release` with `debug`. A custom `CARGO_TARGET_DIR` also changes the base directory.

**`pnpm build` alone only creates the Next.js frontend in `out/`; it does not create a desktop app or installer.** The Tauri build commands above automatically run that frontend build before compiling and packaging the desktop app.

### Build all three platforms with GitHub Actions

The checked-in [CI workflow](.github/workflows/ci.yml) uses separate macOS, Windows and Ubuntu runners. It runs on pushes and pull requests, and can also be started manually:

1. Open the repository's **Actions** tab.
2. Select **Verify and package PixFleet**, then **Run workflow** on the desired branch.
3. Wait for the desktop jobs to finish successfully.
4. Open that workflow run and download the ZIP files from **Artifacts**:

   ```text
   pixfleet-macOS-unsigned
   pixfleet-Windows-unsigned
   pixfleet-Linux-unsigned
   ```

Extract the ZIP for the desired platform to find its installer files. These are workflow artifacts for pull requests, branch pushes and manual runs. Each runner builds its host architecture; this workflow does not produce every CPU architecture. The artifact names retain the `unsigned` suffix to indicate that they have no verified publisher signature; macOS apps are ad-hoc signed but not notarized. A version tag such as `v0.2.3` additionally publishes signed updater artifacts and `latest.json` to the configured release repository when the required GitHub Actions secrets are present. See [RELEASING.md](docs/RELEASING.md) for the signing setup. Platform verification status is recorded in [VALIDATION.md](docs/VALIDATION.md).

## Start developing

After installing dependencies and the prerequisites for your OS:

```sh
pnpm desktop
```

`pnpm dev` runs the interface preview at http://127.0.0.1:3000. Image processing, native dialogs and durable presets require the desktop app. The preview never uploads files or pretends to process them.

## Verify before packaging

[Biome](https://biomejs.dev/guides/getting-started/) handles linting, import organization and formatting for JavaScript, TypeScript, JSX, JSON and CSS. It replaces ESLint and Prettier; Tauri's native Rust code continues to use `cargo fmt` and Clippy.

```sh
pnpm lint          # Check lint rules, imports and formatting; fail on warnings
pnpm lint:fix      # Apply safe lint fixes, organize imports and format
pnpm format        # Format supported files without applying lint fixes
pnpm format:check  # Check formatting without changing files
```

Configuration lives in `biome.json`, with React/Next.js rules and Tailwind CSS parsing enabled. Generated files and build outputs are excluded. Markdown, YAML, Rust and TOML are not formatted by this Biome setup. The global stylesheet keeps its existing component ordering and deliberate `!important` overrides through two file-scoped rule exceptions. Inline comments explain the few positional React keys that preserve editable input focus or identify immutable error snapshots.

Run the full verification and packaging sequence:

```sh
pnpm check
cargo fmt --manifest-path src-tauri/Cargo.toml --check
cargo clippy --manifest-path src-tauri/Cargo.toml --locked --all-targets -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml --locked
pnpm desktop:build
```

Webpack is explicitly selected for predictable static builds in environments that restrict Turbopack worker ports. Installer signing and release checks are described in [RELEASING.md](docs/RELEASING.md).

The existing GitHub Actions workflow runs `pnpm check`, so Biome checks also run in CI before the frontend build.

## Supported workflow

- JPEG, PNG, static WebP, static SVG and HEIC/HEIF input; WebP, AVIF, PNG, JPEG and HEIC output. PNG is lossless; JPEG composites transparency onto white.
- File/folder picker and native drag/drop, recursive folder import, duplicate suppression.
- Up to 500 images per workspace, 100 MB per file, 40 megapixels and 16,000 pixels per dimension.
- 1–6 output widths, optional **Allow upscaling**, preserved aspect ratio, duplicate effective widths removed. Upscaling is off by default and saved with custom presets. Outputs are limited to 40 megapixels and 16,000 pixels per dimension.
- Built-in and locally saved presets, adjustable quality and filename prefix.
- System, Light and Dark appearance choices in the header, including the native window appearance. System is the default and follows OS appearance changes; your choice is saved locally on this device.
- EXIF orientation applied before source metadata is discarded.
- Progress, cancellation between outputs, partial failure reporting, fresh output folder per export.
- Image-only exports organized into format folders.

The early-access edition has all features available. The 500-image limit is a resource guard, not a Free/Pro restriction. There is no payment processing or license enforcement yet.

### Updates

PixFleet checks stable GitHub releases on startup and from **Settings → Check for updates**. When a newer signed version is available, Settings asks for permission before downloading and installing it. The Tauri updater verifies the artifact against PixFleet's embedded public key, then replaces the installed version; Windows completes the update through its installer, while macOS and Linux require a restart after installation. Release publishing must include the signed platform artifacts and `latest.json` manifest described in [docs/RELEASING.md](docs/RELEASING.md).

## Output example

```text
pixfleet-<unique-id>/
  webp/pixfleet-001-640w.webp
  webp/pixfleet-001-1024w.webp
  avif/pixfleet-001-640w.avif
  avif/pixfleet-001-1024w.avif
```

Originals remain untouched. Total export size may exceed input size because you are creating multiple derivatives.

## Important boundaries

Use sRGB originals for predictable colors. ICC/wide-gamut profiles are not preserved or color-managed. Animation, RAW and AVIF inputs are rejected or omitted by folder import. Export cancellation waits for an active encode to finish. Closing or force-quitting during export may leave a hidden `.pixfleet-*` staging folder in the chosen destination; it can be removed after confirming no export is running.

This repository is an implemented early-access application, not a signed commercial release. Cross-platform source and CI are included; actual platform verification is recorded in [validation](docs/VALIDATION.md), never inferred from configuration alone.

## Documentation

- [Architecture and self-review](docs/ARCHITECTURE.md)
- [Implementation plan](docs/IMPLEMENTATION_PLAN.md)
- [User guide](docs/USER_GUIDE.md)
- [Security boundaries](docs/SECURITY.md)
- [Release checklist](docs/RELEASING.md)
- [Verification record](docs/VALIDATION.md)

### HEIC native build dependency

HEIC import/export uses libheif 1.23.1+ with an HEVC decoder and encoder. For macOS development install `brew install libheif pkgconf`. Release CI uses the pinned vcpkg checkout and `scripts/prepare-native-codecs.py` to link codecs statically; see [release instructions](docs/RELEASING.md#heic-codec-builds). Choose WebP, AVIF, PNG or JPEG for website use. HEIF collections import their primary image, and image sequences are rejected.

### Build error after moving or copying the project

If Tauri reports `failed to read plugin permissions` and the missing path points to the project's previous location, Cargo is reusing generated build files with stale absolute paths. Clear the release cache from the current project root, then repeat your build:

```sh
cargo clean --manifest-path src-tauri/Cargo.toml --release
pnpm desktop:build
```

This removes generated release outputs, including previous installers, and rebuilds them. For the same error during `pnpm desktop`, omit `--release` from the clean command. Do not copy `src-tauri/target/` when moving the project; it is already excluded from Git.

### SVG input

Static SVG files can be selected, dropped or imported from folders and converted to any output format. They are rasterized locally at their intrinsic width/height (or viewBox size), then follow the same upscaling setting as photos. Upscaling enlarges the rasterized image; it does not re-render the vector artwork. Set a larger canvas in your SVG editor if you need larger exports. Transparency is preserved in alpha-capable formats; JPEG uses white.

Text uses installed system fonts and may differ between computers; convert text to paths for consistent results. Linked or embedded images, scripts, animation, HTML foreignObject content, and XML DTDs are rejected with an import error. Convert those elements to vector paths before importing. SVGZ is not supported. No external SVG resources are loaded.

### Local macOS launch crash involving libheif

A local Homebrew build can fail at launch with a `libheif.1.dylib` library-validation error. For local testing, build an app without updater artifacts, then embed its codec libraries:

```sh
pnpm tauri build --bundles app --config '{"bundle":{"createUpdaterArtifacts":false}}'
python3 scripts/bundle-local-macos-libs.py src-tauri/target/release/bundle/macos/PixFleet.app
open src-tauri/target/release/bundle/macos/PixFleet.app
```

The helper copies the native libraries into the app, rewrites their paths, and applies ad-hoc signing without hardened runtime for this local build. It leaves Homebrew libraries and system security settings unchanged. Use this repaired `.app` for local testing only: any installer or updater archive created before repair still contains the old binary. Release CI uses statically linked codecs; follow the release checklist for distribution and notarization.
