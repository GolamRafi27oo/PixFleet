# Using PixFleet

1. Open the desktop app and choose **Add images** or **Add folder**. You can drag files or folders into the window. Folder imports include subfolders but skip symlinks and unsupported extensions. Duplicate files already in the workspace are skipped.
2. Check the images you want to export. Remove unwanted images with the row's remove button; this never deletes originals.
3. Choose a preset. Set one or both formats, quality and up to six widths. Small images are never enlarged. Two widths larger than the original produce one output at the original width.
4. Export names default to `pixfleet` with a batch sequence and actual width, for example `pixfleet-001-640w.webp`. A custom filename prefix replaces `pixfleet`; the original filename is not included in exported image names.
5. Select **Export assets** and choose a destination. A new unique folder is created; earlier exports and source files are preserved.
6. Use the exported images in the format folders. Exports contain image files only; no HTML, manifest or README files are generated.

Use **Save as a new preset** to store your settings on this device. Manage saved presets in **My presets**. Presets live in the operating system's application data directory under PixFleet's application identifier. They do not store source image paths.

## Troubleshooting

- **No files added:** JPEG, PNG, static WebP, static SVG and HEIC/HEIF photos are supported. Already-imported files are ignored. Use smaller folders if you reach 500 images or the folder entry scan limit.
- **Image rejected:** check the message for corruption, animation, 100 MB file limit, 40 megapixel limit or 16,000-pixel dimension limit.
- **SVG import:** use a static UTF-8 SVG with a width/height or viewBox. The canvas size is the maximum export size. Convert text to paths for consistent fonts. Linked or embedded images, scripts, animation, HTML foreignObject content and XML DTDs are not supported; simplify these in your SVG editor before importing.
- **Export takes time:** AVIF encoding is CPU-intensive. Try WebP, fewer widths, or a smaller batch. Cancel waits for the current encode to finish, then removes incomplete output.
- **Some images fail:** successful files still export; the export summary lists the failures. If every image fails, no final output folder is published.
- **Colors differ:** this version discards ICC profiles. Convert wide-gamut images to sRGB in a color-managed editor first.
- **Output is larger:** multiple sizes and formats increase total bytes; tiny or already-compressed sources may also grow. The export dialog shows measured totals rather than an estimated savings promise.
- **Saved presets are damaged:** the app reports the preset file location and disables saving for that session. Close the app, back up that file, then repair or rename it and restart. Do not delete the only copy of important presets.
- **An export was force-quit:** check the chosen destination for a hidden `.pixfleet-*` folder. Once PixFleet is closed, you may remove that incomplete staging folder.

## Additional export formats

PNG exports are lossless and preserve alpha; the quality slider does not affect PNG. JPEG exports use the quality setting and composite transparent pixels onto white. HEIC exports use the quality setting and can be opened in compatible photo applications. Choose JPEG, PNG, WebP or AVIF for websites. HEIC imports use the primary image and apply container orientation; depth maps and additional images are not imported.
