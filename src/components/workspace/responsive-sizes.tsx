import { Check, Monitor, Plus, Smartphone, Tablet, X } from "lucide-react";

import type { WorkspaceState } from "@/hooks/use-workspace";

export function ResponsiveSizes({
  preset,
  change,
}: Pick<WorkspaceState, "preset" | "change">) {
  return (
    <section className="[border-bottom:1px_solid_var(--border-strong,_#edf0ed)] py-[21px] px-0">
      <div className="flex gap-2 items-center mb-3.5 [&_h3]:text-[11px] [&_h3]:font-semibold">
        <span className="text-[10px] w-4 h-4 grid place-items-center rounded-full [border:1px_solid_var(--border-strong,_#e2e9e3)] text-[color:var(--text-secondary,_#8b9e8e)] bg-[var(--surface-soft,_#f8faf7)]">
          2
        </span>
        <h3>Responsive sizes</h3>
        <span className="ml-auto text-[10px] text-[color:var(--text-secondary,_#a2ada5)]">
          {preset.widths.length}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {preset.widths.map((width, index) => (
          <div
            className="flex items-center gap-[9px] text-[color:var(--text-secondary,_#94a298)] [&_input::-webkit-inner-spin-button]:appearance-none [&_>_div_>_span]:text-[10px] [&_>_div_>_span]:text-[color:var(--text-secondary,_#a4ada6)]"
            // biome-ignore lint/suspicious/noArrayIndexKey: Controlled width slots retain input focus while their values change.
            key={index}
          >
            {index === 0 ? (
              <Smartphone size={17} />
            ) : index === 1 ? (
              <Tablet size={17} />
            ) : (
              <Monitor size={17} />
            )}
            <label
              className="text-[10px] text-[color:var(--text-secondary,_#77867b)]"
              htmlFor={`width-${index}`}
            >
              {index === 0
                ? "Small"
                : index === 1
                  ? "Medium"
                  : index === 2
                    ? "Large"
                    : `Size ${index + 1}`}
            </label>
            <div className="ml-auto [border:1px_solid_var(--border-strong,_#e5eae6)] flex items-center gap-1 rounded-[5px] py-[5px] px-[7px] bg-[var(--surface-soft,_#fafbf9)]">
              <input
                className="border-0 bg-transparent text-[10px] text-right text-[color:var(--text-secondary,_#6d7b70)] w-10.5 [appearance:textfield]"
                id={`width-${index}`}
                aria-label={`Output width ${index + 1}`}
                type="number"
                min="16"
                max="8192"
                value={width || ""}
                onChange={(e) =>
                  change({
                    widths: preset.widths.map((w, i) =>
                      i === index ? Number(e.target.value) : w,
                    ),
                  })
                }
              />
              <span>px</span>
            </div>
            <button
              type="button"
              className="p-0.5!"
              aria-label={`Remove size ${index + 1}`}
              onClick={() =>
                change({
                  widths: preset.widths.filter((_, i) => i !== index),
                })
              }
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="inline-flex items-center gap-[7px] py-[3px] px-0 text-[10px] text-[color:var(--text-secondary,_#729a7b)] mt-2.5 [&:hover]:text-[color:var(--green)]"
        disabled={preset.widths.length >= 6}
        onClick={() =>
          change({
            widths: [
              ...preset.widths,
              Math.min(8192, Math.max(0, ...preset.widths) + 320),
            ],
          })
        }
      >
        <Plus size={13} /> Add a size
      </button>
      <p className="text-[10px] leading-[1.8] text-[color:var(--text-secondary,_#64756a)] mt-[9px] flex gap-1 items-center">
        <Check size={12} /> Keep proportions. Never upscale.
      </p>
    </section>
  );
}
