import {
  ArrowDownToLine,
  ArrowRight,
  LoaderCircle,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WorkspaceState } from "@/hooks/use-workspace";
import { bytes } from "@/lib/model";
import { FilenameSettings } from "./filename-settings";
import { FormatSettings } from "./format-settings";
import { PresetSelector } from "./preset-selector";
import { ResponsiveSizes } from "./responsive-sizes";

export function ExportSettings({
  busy,
  preset,
  allPresets,
  setPreset,
  change,
  settingsHealthy,
  validation,
  setPresetName,
  setSaveError,
  setSaveOpen,
  selected,
  totalBytes,
  outputs,
  exportImages,
}: Pick<
  WorkspaceState,
  | "busy"
  | "preset"
  | "allPresets"
  | "setPreset"
  | "change"
  | "settingsHealthy"
  | "validation"
  | "setPresetName"
  | "setSaveError"
  | "setSaveOpen"
  | "selected"
  | "totalBytes"
  | "outputs"
  | "exportImages"
>) {
  return (
    <aside
      className="bg-[var(--surface,_#fff)] [border-left:1px_solid_var(--border)] flex min-w-0 flex-col [padding:25px_22px_20px] min-h-0 min-[1500px]:p-7.5 max-[1120px]:pl-4.5 max-[1120px]:pr-4.5 max-[720px]:shrink-0 max-[720px]:overflow-visible max-[720px]:[border-left:0] max-[720px]:[border-top:1px_solid_var(--border)] max-[720px]:p-6"
      aria-label="Export settings"
    >
      <div className="flex items-center justify-between pb-[23px] [&_h2]:text-[12px] [&_h2]:font-semibold [&_h2]:flex [&_h2]:gap-2 [&_h2]:items-center [&_h2_svg]:text-[color:var(--text-secondary,_#718879)]">
        <h2>
          <Settings2 size={18} /> Export settings
        </h2>
        <span className="text-[10px] tracking-[0.8px] text-[color:var(--text-secondary,_#a1aaa4)]">
          01 — 03
        </span>
      </div>
      <fieldset
        // Keep the 2px focus outline + 4px offset inside the scroll viewport.
        className="border-0 p-1.5 -m-1.5 min-w-0 min-h-0 overflow-y-auto [scrollbar-width:thin] flex-1 max-[720px]:overflow-visible max-[720px]:grid max-[720px]:grid-cols-2 max-[520px]:grid-cols-1 max-[720px]:gap-x-[25px]"
        disabled={!!busy}
      >
        <PresetSelector
          preset={preset}
          allPresets={allPresets}
          setPreset={setPreset}
        />
        <FormatSettings preset={preset} change={change} />
        <ResponsiveSizes preset={preset} change={change} />
        <FilenameSettings
          preset={preset}
          change={change}
          settingsHealthy={settingsHealthy}
          validation={validation}
          setPresetName={setPresetName}
          setSaveError={setSaveError}
          setSaveOpen={setSaveOpen}
        />
      </fieldset>
      <div className="mt-auto [border-top:1px_solid_var(--border)] pt-[17px] shrink-0 max-[720px]:mt-[15px]">
        {validation && (
          <p
            className="text-[10px]! text-left! text-[color:var(--warning-text,_#ae6747)]! [margin:0_0_12px]! text-[10px] text-center text-[color:var(--text-secondary,_#64756a)] mt-2.5"
            role="alert"
          >
            {validation}
          </p>
        )}
        <div className="flex justify-between text-[10px] mb-[13px] text-[color:var(--text-secondary,_#64756a)]">
          <span>
            {selected.size} images{" "}
            <span className="text-[color:var(--text-secondary,_#64756a)]">
              · {bytes(totalBytes)}
            </span>
          </span>
          <strong className="text-[10px] font-medium text-[color:var(--text-secondary,_#6b8572)]">
            {outputs} outputs
          </strong>
        </div>
        <Button
          type="button"
          variant="primary"
          className="min-h-[41px] w-full [&_svg:last-child]:ml-auto [&:disabled]:[opacity:1] [&:disabled]:bg-[var(--disabled-surface,_#b3cbbc)] [&:disabled]:text-[color:var(--text-secondary,_#f6fbf7)] [&:disabled]:shadow-none"
          disabled={!!busy || !selected.size || !!validation}
          onClick={exportImages}
        >
          {busy === "export" ? (
            <LoaderCircle size={17} className="animate-spin" />
          ) : (
            <ArrowDownToLine size={17} />
          )}{" "}
          {busy === "export" ? "Preparing your assets…" : "Export assets"}
          <ArrowRight size={17} />
        </Button>
        <p className="text-[10px] text-center text-[color:var(--text-secondary,_#64756a)] mt-2.5">
          You choose where they go. We handle the rest.
        </p>
      </div>
    </aside>
  );
}
