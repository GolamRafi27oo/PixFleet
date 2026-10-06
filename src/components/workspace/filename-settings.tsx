import { Check, Save } from "lucide-react";

import type { WorkspaceState } from "@/hooks/use-workspace";
import { PRESETS } from "@/lib/model";
export function FilenameSettings({
  preset,
  change,
  settingsHealthy,
  validation,
  setPresetName,
  setSaveError,
  setSaveOpen,
}: Pick<
  WorkspaceState,
  | "preset"
  | "change"
  | "settingsHealthy"
  | "validation"
  | "setPresetName"
  | "setSaveError"
  | "setSaveOpen"
>) {
  return (
    <section className="[border-bottom:0] py-[21px] px-0 pb-3.5 max-[720px]:[grid-column:1_/_-1]">
      <div className="flex gap-2 items-center mb-3.5 [&_h3]:text-[11px] [&_h3]:font-semibold">
        <span className="text-[10px] w-4 h-4 grid place-items-center rounded-full [border:1px_solid_var(--border-strong,_#e2e9e3)] text-[color:var(--text-secondary,_#8b9e8e)] bg-[var(--surface-soft,_#f8faf7)]">
          3
        </span>
        <h3>The finishing touches</h3>
      </div>
      <label
        htmlFor="prefix"
        className="block text-[10px] text-[color:var(--text-secondary,_#64756a)] mb-2"
      >
        Filename prefix{" "}
        <span className="text-[color:var(--text-secondary,_#64756a)] ml-1 text-[10px]">
          optional
        </span>
      </label>
      <input
        className="w-full [border:1px_solid_var(--border-strong,_#e1e7e2)] rounded-[6px] py-[11px] px-2.5 text-[color:var(--text-secondary,_#4d6756)] bg-[var(--surface-soft,_#fcfdfa)] text-[10px] [&::placeholder]:text-[color:var(--text-secondary,_#b0b9b2)]"
        id="prefix"
        maxLength={40}
        value={preset.prefix}
        placeholder="pixfleet"
        aria-describedby="filename-hint"
        onChange={(e) => change({ prefix: e.target.value })}
      />
      <p
        id="filename-hint"
        className="mt-2 text-[10px] text-[color:var(--text-secondary)]"
      >
        Defaults to pixfleet-001-640w.webp. A custom prefix replaces pixfleet.
      </p>
      <div className="flex flex-col gap-[9px] mt-[17px] [&_svg]:text-[color:var(--text-secondary,_#5d966f)]">
        <span className="flex gap-[7px] items-center text-[10px] text-[color:var(--text-secondary,_#64756a)]">
          <Check size={13} /> Strip location & camera metadata
        </span>
        <span className="flex gap-[7px] items-center text-[10px] text-[color:var(--text-secondary,_#64756a)]">
          <Check size={13} /> Organize into format folders
        </span>
        <span className="flex gap-[7px] items-center text-[10px] text-[color:var(--text-secondary,_#64756a)]">
          <Check size={13} /> Export image files only
        </span>
      </div>
      <button
        type="button"
        className="w-full flex items-center justify-center gap-[7px] mt-5 text-[10px] text-[color:var(--text-secondary,_#7c9582)] p-[7px]! [&:hover]:text-[color:var(--green)] [&:hover]:bg-[var(--surface-soft,_#f3f8f3)] [&:hover]:rounded-[4px]"
        disabled={!settingsHealthy || !!validation}
        onClick={() => {
          setPresetName(preset.name === PRESETS[0].name ? "" : preset.name);
          setSaveError(null);
          setSaveOpen(true);
        }}
      >
        <Save size={14} /> Save as a new preset
      </button>
    </section>
  );
}
