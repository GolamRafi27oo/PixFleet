# Using PixFleet

1. Open the desktop app and choose **Add images** or **Add folder**. You can drag files or folders into the window. Folder imports include subfolders but skip symlinks and unsupported extensions. Duplicate files already in the workspace are skipped.
2. Check the images you want to export. Remove unwanted images with the row's remove button; this never deletes originals.
3. Choose a preset. Set one or both formats, quality and up to six widths. Small images are never enlarged. Two widths larger than the original produce one output at the original width.
4. Optionally add a filename prefix. Names become lowercase portable slugs with a batch sequence and actual width. For example, `Client Hero.jpg` becomes `client-hero-001-640w.webp`.
5. Select **Export assets** and choose a destination. A new unique folder is created; earlier exports and source files are preserved.
6. Copy the HTML or open `images.html`. Keep format folders alongside your snippet's reference location. Describe meaningful images with alt text, adapt `sizes` to your site's CSS, and remove lazy loading for the primary above-the-fold image.

Use **Save as a new preset** to store your settings on this device. Manage saved presets in **My presets**. Presets live in the operating system's application data directory under PixFleet's application identifier. They do not store source image paths.

## Troubleshooting

- **No files added:** only JPEG, PNG and static WebP are supported. Already-imported files are ignored. Use smaller folders if you reach 500 images or the folder entry scan limit.
- **Image rejected:** check the message for corruption, animation, 100 MB file limit, 40 megapixel limit or 16,000-pixel dimension limit.
- **Export takes time:** AVIF encoding is CPU-intensive. Try WebP, fewer widths, or a smaller batch. Cancel waits for the current encode to finish, then removes incomplete output.
- **Some images fail:** successful files still export; the summary and manifest list the failures. If every image fails, no final output folder is published.
- **Colors differ:** this version discards ICC profiles. Convert wide-gamut images to sRGB in a color-managed editor first.
- **Output is larger:** multiple sizes and formats increase total bytes; tiny or already-compressed sources may also grow. The export dialog shows measured totals rather than an estimated savings promise.
- **Saved presets are damaged:** the app reports the preset file location and disables saving for that session. Close the app, back up that file, then repair or rename it and restart. Do not delete the only copy of important presets.
- **An export was force-quit:** check the chosen destination for a hidden `.pixfleet-*` folder. Once PixFleet is closed, you may remove that incomplete staging folder.
