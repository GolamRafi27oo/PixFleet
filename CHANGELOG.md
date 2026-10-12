# Changelog

## 0.2.3

- Add an optional Allow upscaling setting, saved with presets, to enlarge images to the requested widths while preserving proportions.

- Add a local macOS packaging helper to bundle HEIC libraries and repair ad-hoc signing for development builds that fail at launch.

## 0.2.2

- Publish signed updater artifacts for permission-based in-app downloads and installation.
- Add SVG import and conversion support across the existing output formats.
- Fix clipped focus outlines in the export settings panel.

## 0.2.1

- Add signed, permission-based in-app updates. PixFleet can check the Tauri update manifest, download a verified update, and install it after the user chooses **Download and install**.
- Generate signed updater artifacts in release builds using the configured Tauri signing key.
- Import static SVG artwork through the file picker, folders and drag/drop, and convert it locally to all existing output formats. Preserve transparency and report unsupported SVG content.

- Fix clipped focus outlines in the export settings panel.

## 0.2.0

- Check published updates in `GolamRafi27oo/PixFleet`.
- Export image files only; remove generated HTML, JSON manifests, README files and the HTML-copy interface.

- Default exported filenames to `pixfleet-001-640w` instead of including the source filename; custom prefixes replace `pixfleet`.
- Add PNG, JPEG and HEIC exports, HEIC/HEIF photo imports, format-specific transparency handling.

- Split the frontend into one component per file, with focused workspace, preset, settings, navigation, and dialog components.
- Move application state and native event coordination into hooks. Keep the Next.js route as a small server entry point.
- Replace application-specific CSS classes with Tailwind utilities and reusable controls. Retain theme tokens, global accessibility defaults, and necessary third-party widget overrides.
- Preserve system, light, and dark appearance; improve narrow-screen export settings and navigation.
- Compare stable release versions numerically, validate release responses, and cancel superseded or timed-out update requests.
- Guard concurrent image removal and preset writes; prevent dismissing a preset dialog during a save.
- Synchronize frontend and desktop versions at 0.2.0.
