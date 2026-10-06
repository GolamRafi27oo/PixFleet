import { type Format, isOutputFormat } from "./formats";

export type { Format } from "./formats";
export type Preset = {
  id: string;
  name: string;
  formats: Format[];
  quality: number;
  widths: number[];
  prefix: string;
};
export type Asset = {
  id: string;
  name: string;
  width: number;
  height: number;
  bytes: number;
  thumbnail: string;
};
export type ImportResult = { images: Asset[]; errors: string[] };
export type Progress = { completed: number; total: number; filename: string };
export type ExportResult = {
  directory: string;
  files: number;
  images: number;
  inputBytes: number;
  outputBytes: number;
  errors: string[];
  cancelled: boolean;
};
export const PRESETS: Preset[] = [
  {
    id: "website",
    name: "Website essentials",
    formats: ["webp"],
    quality: 80,
    widths: [640, 1024, 1920],
    prefix: "",
  },
  {
    id: "portfolio",
    name: "High-quality portfolio",
    formats: ["webp", "avif"],
    quality: 90,
    widths: [640, 1280, 2400],
    prefix: "",
  },
  {
    id: "store",
    name: "Online store",
    formats: ["webp"],
    quality: 82,
    widths: [400, 800, 1200],
    prefix: "product",
  },
];
export function bytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}
export function validatePreset(preset: Preset): string | null {
  if (!preset.name.trim() || preset.name.length > 80)
    return "Give your preset a name of 1–80 characters.";
  if (
    !preset.formats.length ||
    preset.formats.some((f) => !isOutputFormat(f)) ||
    new Set(preset.formats).size !== preset.formats.length
  )
    return "Choose at least one output format, without duplicates.";
  if (
    !Number.isInteger(preset.quality) ||
    preset.quality < 1 ||
    preset.quality > 100
  )
    return "Quality must be between 1 and 100.";
  if (
    !preset.widths.length ||
    preset.widths.length > 6 ||
    preset.widths.some((w) => !Number.isInteger(w) || w < 16 || w > 8192)
  )
    return "Choose 1–6 widths between 16 and 8192 pixels.";
  if (new Set(preset.widths).size !== preset.widths.length)
    return "Output widths must be unique.";
  if (preset.prefix.length > 40)
    return "Keep the filename prefix under 41 characters.";
  return null;
}
