export const OUTPUT_FORMATS = [
  { value: "webp", label: "WebP", description: "The all-rounder" },
  { value: "avif", label: "AVIF", description: "Smaller, slower" },
  { value: "png", label: "PNG", description: "Lossless, transparent" },
  { value: "jpeg", label: "JPEG", description: "Widely compatible" },
  { value: "heic", label: "HEIC", description: "High-efficiency photo" },
] as const;

export type Format = (typeof OUTPUT_FORMATS)[number]["value"];

export function isOutputFormat(value: string): value is Format {
  return OUTPUT_FORMATS.some((format) => format.value === value);
}
