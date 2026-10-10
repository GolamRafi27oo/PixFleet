# Release process

## Before a release

- Run `pnpm check`, `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings` and `cargo test` (Cargo commands use `--manifest-path src-tauri/Cargo.toml`). Commit both lockfiles.
- Run the included CI matrix on macOS, Windows and Ubuntu. Install the resulting artifacts on clean target machines, including offline launches.
- Manually test import dialog, folder recursion, drag/drop, mixed good/bad inputs, EXIF-rotated photos, transparency, cancellation, full disk, read-only destinations, Unicode and long paths, preset restart persistence, keyboard navigation, screen readers and window resizing.
- Confirm output quality on a real 50-image client batch. Measure time and peak memory on low-memory systems. Verify AVIF output in independent browsers/viewers.
- Review the [known limits](../README.md#important-boundaries), privacy claims and codec licenses. Make limitations visible in release notes.

## Platform distribution

The workflow produces artifacts without a verified publisher signature. macOS apps use ad-hoc signing (`bundle.macOS.signingIdentity: "-"`) without Apple credentials; other platforms remain unsigned. The existing artifact names retain the `unsigned` suffix. The workflow does not publish a release or upload customer files.

For macOS releases without an Apple Developer account, include the [downloaded-build installation instructions](../README.md#opening-a-downloaded-macos-build) in the release notes. Ad-hoc signing does not provide notarization or bypass Gatekeeper. Rebuild and upload the new DMG after changing signing settings; existing downloads are unchanged. Before distribution, verify the app copied from the DMG with `codesign --verify --deep --strict --verbose=2 "/Applications/PixFleet.app"`, and test the browser-downloaded DMG on a clean Mac. Signature verification alone does not confirm Gatekeeper acceptance.

- **macOS:** sign with your Apple Developer certificate and notarize. Provide signing/notarization credentials through protected CI secrets following [Tauri's macOS signing documentation](https://v2.tauri.app/distribute/sign/macos/). Build and verify Apple Silicon and Intel artifacts before advertising both architectures.
- **Windows:** sign NSIS/MSI installers using your code-signing certificate and follow [Tauri's Windows distribution guidance](https://v2.tauri.app/distribute/windows-installer/). Verify the WebView2 installation story on a clean system; an entirely offline installer needs a deliberate WebView2 bundling policy.
- **Linux:** test AppImage, deb and rpm on supported distributions. WebKitGTK and system library versions vary; publish an explicit supported distribution list.

Version values must match in `package.json`, `src-tauri/Cargo.toml` and `src-tauri/tauri.conf.json`. Use immutable signed release artifacts and publish checksums. Automatic updates are intentionally absent until there is a trusted, signed update channel.

## Release checks

The app checks public GitHub releases in [GolamRafi27oo/PixFleet](https://github.com/GolamRafi27oo/PixFleet/releases), on startup and through Settings → Check for updates. Publish stable semantic-version tags such as `v0.2.1` there; drafts, prereleases and non-version tags are ignored. The source repository remote is independent of the release repository. Checking for a release does not download or install it.

Sparkle is deferred until a hosted appcast and an Ed25519 public signing key are available. A future macOS integration must bundle the Sparkle framework, configure the feed and public key, and publish signed update archives. Keep the private signing key outside the application and source repository. See [Sparkle setup](https://sparkle-project.org/documentation/) and [publishing updates](https://sparkle-project.org/documentation/publishing/). GitHub release checks remain the current behavior on every platform.

## Commercial launch

Select the checkout provider and seller identity, final pricing, support policy and refund terms. Implement offline signature-verified licenses using a public verification key; private keys stay with your issuing service. A local boolean is not licensing. Decide how license delivery, device changes and revoked/expired licenses behave while offline before enforcing tiers. Existing purchased versions should keep working under the promised model.

Run the proposed demand test with 10 freelancers/agencies and aim for three paid early-access customers. Keep the application database-free; checkout and optional license issuance can be external services.

## HEIC codec builds

Codec packages are installed into `.vcpkg/installed`. Keep this layout: the `vcpkg` Rust helper 0.2.15 used by `libheif-sys` on Windows ignores `VCPKG_INSTALLED_ROOT` and reads only `VCPKG_ROOT/installed`. The setup script verifies the package database and libheif headers before exporting build settings.

HEIC requires libheif 1.23.1+ plus an HEVC decoder and encoder. Development on macOS can use `brew install libheif pkgconf`; that build depends on the local Homebrew libraries and must not be distributed as a portable installer.

CI checks out vcpkg revision `0bc1a55f422ceb190877234b3ba88c372f04c485` (libheif 1.23.5), then runs `python scripts/prepare-native-codecs.py` to build the codec libraries statically for each runner. `src-tauri/vcpkg.json` selects libheif's HEVC feature, including libde265 and x265. The script exports Cargo/pkg-config settings through `GITHUB_ENV`. For a local release build, clone that same vcpkg revision into `.vcpkg`, run the script, and apply its printed environment values before building. Verify the resulting installer on a machine without Homebrew/vcpkg.

The added native dependencies have distribution obligations: libheif and libde265 use LGPL licenses; vcpkg's HEVC encoder feature uses GPL-licensed x265. Before publishing installers, resolve the project's distribution/license model and include the required notices and corresponding source/relinking materials, or use appropriately licensed alternative codecs. This change does not license PixFleet under a new license or publish binaries. See the upstream [libheif license](https://github.com/strukturag/libheif#license) and [vcpkg HEVC feature](https://github.com/microsoft/vcpkg/blob/master/ports/libheif/vcpkg.json).
