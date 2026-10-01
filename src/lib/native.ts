import { invoke, isTauri } from "@tauri-apps/api/core";
import type { ExportResult, ImportResult, Preset } from "./model";
export const native = {
  available: () => isTauri(),
  import: (folder: boolean) => invoke<ImportResult>("pick_images", { folder }),
  importPaths: (paths: string[]) =>
    invoke<ImportResult>("import_paths", { paths }),
  remove: (ids: string[]) => invoke<void>("remove_images", { ids }),
  presets: () => invoke<Preset[]>("load_presets"),
  savePresets: (presets: Preset[]) => invoke<void>("save_presets", { presets }),
  export: (ids: string[], preset: Preset) =>
    invoke<ExportResult | null>("export_images", { ids, preset }),
  cancel: () => invoke<void>("cancel_export"),
};
