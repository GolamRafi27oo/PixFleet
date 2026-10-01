# Security and privacy boundaries

PixFleet contains no runtime HTTP client, upload feature, analytics or remote fonts. The packaged webview uses a restrictive CSP. Its Tauri capability includes core window/events only; there is no arbitrary shell or filesystem plugin exposed to JavaScript.

Native commands accept user-selected image paths for imports. Import decodes only JPEG, PNG and WebP after inspecting actual bytes. Exports use session IDs resolved in a Rust registry and a native destination picker. No frontend-provided relative filename is used for writing. An embedded frontend compromise could call the image import command for a known local image path; the threat boundary is a trusted packaged UI, not a sandbox for untrusted web pages. Never load remote pages into the app window.

Compressed reads are bounded to 100 MB, dimensions to 16,000 pixels per axis, pixels to 40 million, decoder allocations to 256 MB, and workspace entries to 500. Encoding and resize buffers add to decoder memory, so this is not a strict total-process memory cap. Source images process sequentially. Folder traversal skips symlinks and caps scanned entries. Source paths exist only in process memory.

Fresh pixel encoding strips source EXIF, GPS, XMP and ICC data. Orientation is applied before encoding. Export manifests include original filenames, dimensions and byte counts; filenames can themselves contain identifying information, so review those before sharing an export.

Temporary output directories are owned by the export job. Normal failure and cancellation use RAII cleanup. A crash/power loss can leave staging files. Completed export folders are never overwritten. This is a local user utility, not a defense against another process with the same OS user's permissions changing input/output paths.

Preset writes use a synced temporary file and atomic replacement. Corruption is surfaced to the user; the UI disables saving instead of discarding broken settings. No secrets are persisted. Future license signing keys must remain outside the client; only public verification keys belong in the app.

Before release: audit dependency advisories, test malformed inputs and disk failures on each target, and sign distributed installers. Report security issues privately to the product owner; configure a real security contact before public distribution.
