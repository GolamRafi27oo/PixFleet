import { ArrowRight, Layers3, Sparkles, Trash2 } from "lucide-react";
import type { WorkspaceState } from "@/hooks/use-workspace";
import { PRESETS } from "@/lib/model";

export function PresetsPage({
  allPresets,
  busy,
  setPreset,
  setView,
  saving,
  settingsHealthy,
  deletePreset,
}: Pick<
  WorkspaceState,
  | "allPresets"
  | "busy"
  | "setPreset"
  | "setView"
  | "saving"
  | "settingsHealthy"
  | "deletePreset"
>) {
  return (
    <>
      <div className="grid grid-cols-[repeat(3,_1fr)] gap-5 max-[1120px]:grid-cols-[repeat(2,_1fr)] max-[720px]:grid-cols-[1fr]">
        {allPresets.map((p) => (
          <article
            className="bg-[var(--surface,_white)] [border:1px_solid_var(--border)] rounded-[12px] p-6 [&_h2]:text-[16px] [&_h2]:tracking-[-0.3px]"
            key={p.id}
          >
            <div className="flex items-center justify-between mb-7">
              <span className="bg-[var(--surface-accent,_#eaf4eb)] text-[color:var(--text-secondary,_#6c9474)] p-2.5 rounded-[10px] flex">
                <Layers3 size={22} />
              </span>
              <span className="text-[10px] text-[color:var(--text-secondary,_#89a08f)] bg-[var(--surface-soft,_#f1f6f1)] [border:1px_solid_var(--border-strong,_#e1eae1)] py-[5px] px-2 rounded-[20px]">
                {PRESETS.some((b) => b.id === p.id)
                  ? "Built-in"
                  : "Saved locally"}
              </span>
            </div>
            <h2>{p.name}</h2>
            <p className="text-[11px] text-[color:var(--text-secondary,_#64756a)] mt-2.5">
              {p.formats.map((f) => f.toUpperCase()).join(" + ")} · {p.quality}%
              quality
            </p>
            <div className="flex flex-wrap gap-1.5 my-[23px] mx-0">
              {p.widths.map((w) => (
                <span
                  className="text-[10px] bg-[var(--surface-soft,_#f7f9f6)] [border:1px_solid_var(--border-strong,_#e8eee6)] rounded-[5px] py-[5px] px-2 text-[color:var(--text-secondary,_#869b8b)]"
                  key={w}
                >
                  {w}px
                </span>
              ))}
            </div>
            <div className="flex justify-between [border-top:1px_solid_var(--border)] pt-4.5 [&_>_button:last-child]:text-[color:var(--text-secondary,_#94a598)]">
              <button
                type="button"
                className="inline-flex items-center gap-[7px] py-[3px] px-0 text-[10px] text-[color:var(--text-secondary,_#687d71)] [&:hover]:text-[color:var(--green)] text-[color:var(--green)]"
                disabled={!!busy}
                onClick={() => {
                  setPreset({ ...p });
                  setView("workspace");
                }}
              >
                Use preset <ArrowRight size={15} />
              </button>
              {!PRESETS.some((b) => b.id === p.id) && (
                <button
                  className="text-[color:var(--green)]"
                  type="button"
                  aria-label={`Delete ${p.name}`}
                  disabled={!!busy || saving || !settingsHealthy}
                  onClick={() => deletePreset(p.id)}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
      <div className="flex items-center gap-3 bg-[var(--surface-accent,_#eff6ed)] p-5.5 text-[color:var(--text-secondary,_#7b9683)] mt-6 rounded-[9px] text-[11px] leading-[1.8]">
        <Sparkles size={18} />
        <p>
          Make a preset your own in Export settings, then choose{" "}
          <strong>Save as a new preset</strong>.
        </p>
      </div>
    </>
  );
}
