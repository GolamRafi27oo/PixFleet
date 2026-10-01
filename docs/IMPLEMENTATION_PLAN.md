# Implementation plan

1. Write architecture decisions, threat model and release gates before application code.
2. Scaffold Next.js, TypeScript, Tailwind, pnpm and Tauri with static assets and restrictive capabilities.
3. Build and test a reusable Rust image pipeline: validation, orientation, naming, responsive resizing, WebP/AVIF output, HTML and manifest.
4. Connect native import/export dialogs, thumbnails, progress, cancellation and local preset persistence.
5. Build an accessible workspace with batch list, selection, editable export settings, presets and export summary.
6. Verify frontend build, lint, type checks and native tests; inspect the interface visually.
7. Add cross-platform CI and packaging, user/developer docs, and record remaining release gates accurately.

Implementation status: all seven steps have been carried out. The native macOS UI permission limitation and unexecuted Windows/Linux checks are explicitly recorded in `VALIDATION.md`; public-release gates remain open.
