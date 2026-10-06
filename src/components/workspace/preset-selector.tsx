import { ChevronDown, Layers3 } from "lucide-react";

import type { WorkspaceState } from "@/hooks/use-workspace";

export function PresetSelector({
  preset,
  allPresets,
  setPreset,
}: Pick<WorkspaceState, "preset" | "allPresets" | "setPreset">) {
  return (
    <section className="[border-bottom:1px_solid_var(--border-strong,_#edf0ed)] py-[21px] px-0 pt-0 pb-5 max-[720px]:[grid-column:1_/_-1]">
      <label
        htmlFor="preset"
        className="text-[10px] font-bold tracking-[1.3px] text-[color:var(--text-secondary,_#8d9c92)] block mb-2.5"
      >
        START WITH A PRESET
      </label>
      <div className="flex items-center [border:1px_solid_var(--border-strong,_#dfe7e1)] rounded-[6px] py-0 px-2.5 gap-[9px] h-[39px] bg-[var(--surface-soft,_#f8faf8)] text-[color:var(--text-secondary,_#698976)]">
        <Layers3 size={17} />
        <select
          className="appearance-none border-0 flex-1 bg-transparent min-w-0 text-[10px] text-[color:var(--text-secondary,_#3c5a45)] cursor-pointer h-full"
          id="preset"
          value={preset.id}
          onChange={(e) => {
            const p = allPresets.find((p) => p.id === e.target.value);
            if (p) setPreset({ ...p });
          }}
        >
          {allPresets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <ChevronDown size={15} />
      </div>
      <p className="text-[10px] leading-[1.8] text-[color:var(--text-secondary,_#64756a)] mt-[9px] flex gap-1 items-center">
        A good starting point. Make it yours below.
      </p>
    </section>
  );
}
