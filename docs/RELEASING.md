# Release process

## Before a release

- Run `pnpm check`, `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings` and `cargo test` (Cargo commands use `--manifest-path src-tauri/Cargo.toml`). Commit both lockfiles.
- Run the included CI matrix on macOS, Windows and Ubuntu. Install the resulting artifacts on clean target machines, including offline launches.
- Manually test import dialog, folder recursion, drag/drop, mixed good/bad inputs, EXIF-rotated photos, transparency, cancellation, full disk, read-only destinations, Unicode and long paths, preset restart persistence, keyboard navigation, screen readers and window resizing.
- Confirm output quality on a real 50-image client batch. Measure time and peak memory on low-memory systems. Verify AVIF output in independent browsers/viewers.
- Review the [known limits](../README.md#important-boundaries), privacy claims and codec licenses. Make limitations visible in release notes.

## Platform distribution

The workflow produces unsigned artifacts. It does not publish a release or upload customer files.

- **macOS:** sign with your Apple Developer certificate and notarize. Provide signing/notarization credentials through protected CI secrets following [Tauri's macOS signing documentation](https://v2.tauri.app/distribute/sign/macos/). Build and verify Apple Silicon and Intel artifacts before advertising both architectures.
- **Windows:** sign NSIS/MSI installers using your code-signing certificate and follow [Tauri's Windows distribution guidance](https://v2.tauri.app/distribute/windows-installer/). Verify the WebView2 installation story on a clean system; an entirely offline installer needs a deliberate WebView2 bundling policy.
- **Linux:** test AppImage, deb and rpm on supported distributions. WebKitGTK and system library versions vary; publish an explicit supported distribution list.

Version values must match in `package.json`, `src-tauri/Cargo.toml` and `src-tauri/tauri.conf.json`. Use immutable signed release artifacts and publish checksums. Automatic updates are intentionally absent until there is a trusted, signed update channel.

## Commercial launch

Select the checkout provider and seller identity, final pricing, support policy and refund terms. Implement offline signature-verified licenses using a public verification key; private keys stay with your issuing service. A local boolean is not licensing. Decide how license delivery, device changes and revoked/expired licenses behave while offline before enforcing tiers. Existing purchased versions should keep working under the promised model.

Run the proposed demand test with 10 freelancers/agencies and aim for three paid early-access customers. Keep the application database-free; checkout and optional license issuance can be external services.
