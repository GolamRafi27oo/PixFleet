import { Check } from "lucide-react";
import type { WorkspaceState } from "@/hooks/use-workspace";
import { OUTPUT_FORMATS } from "@/lib/formats";

export function FormatSettings({
  preset,
  change,
}: Pick<WorkspaceState, "preset" | "change">) {
  return (
    <section className="[border-bottom:1px_solid_var(--border-strong,_#edf0ed)] py-[21px] px-0">
      <div className="flex gap-2 items-center mb-3.5 [&_h3]:text-[11px] [&_h3]:font-semibold">
        <span className="text-[10px] w-4 h-4 grid place-items-center rounded-full [border:1px_solid_var(--border-strong,_#e2e9e3)] text-[color:var(--text-secondary,_#8b9e8e)] bg-[var(--surface-soft,_#f8faf7)]">
          1
        </span>
        <h3>Format & quality</h3>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {OUTPUT_FORMATS.map(({ value: format, label, description }) => (
          <button
            type="button"
            key={format}
            className="[border:1px_solid_var(--border-strong,_#e3e8e4)] rounded-[6px] flex-1 text-left [padding:11px_10px_10px] bg-[var(--surface,_#fff)] [&[aria-pressed=true]]:border-[var(--border-strong,_#78a88c)] [&[aria-pressed=true]]:bg-[var(--surface-accent,_#f1f7f2)] [&[aria-pressed=true]]:shadow-[0_0_0_1px_#78a88c15]"
            aria-pressed={preset.formats.includes(format)}
            onClick={() =>
              change({
                formats: preset.formats.includes(format)
                  ? preset.formats.filter((f) => f !== format)
                  : [...preset.formats, format],
              })
            }
          >
            <span className="flex items-center justify-between">
              <strong className="text-[10px] font-[650]">{label}</strong>
              <span
                className="w-[13px] h-[13px] [border:1px_solid_var(--border-strong,_#dce4df)] grid place-items-center rounded-full text-[color:var(--on-accent,_white)] [&[data-selected=true]]:bg-[var(--green)] [&[data-selected=true]]:border-[var(--green)]"
                data-selected={preset.formats.includes(format)}
              >
                {preset.formats.includes(format) && <Check size={11} />}
              </span>
            </span>
            <small className="text-[10px] text-[color:var(--text-secondary,_#64756a)] block mt-[7px]">
              {description}
            </small>
          </button>
        ))}
      </div>
      <div className="flex justify-between items-center mt-[17px] mb-[5px] text-[10px] text-[color:var(--text-secondary,_#6c7e72)] [&_output_span]:text-[10px] [&_output_span]:text-[color:var(--text-secondary,_#98a29b)] [&_output_span]:ml-0.5">
        <label htmlFor="quality">Quality</label>
        <output
          className="py-1 px-1.5 [border:1px_solid_var(--border-strong,_#e5eae6)] rounded-[4px] bg-[var(--surface-soft,_#fbfcfa)] text-[color:var(--text-secondary,_#617c68)] text-[10px]"
          htmlFor="quality"
        >
          {preset.quality}
          <span>%</span>
        </output>
      </div>
      <input
        id="quality"
        type="range"
        className="w-full [accent-color:var(--green)] h-1 my-2.5 mx-0"
        min="1"
        max="100"
        disabled={preset.formats.length === 1 && preset.formats[0] === "png"}
        value={preset.quality}
        onChange={(e) => change({ quality: Number(e.target.value) })}
      />
      <div className="flex justify-between text-[10px] text-[color:var(--text-secondary,_#64756a)] mt-[3px]">
        <span>Smaller files</span>
        <span>More detail</span>
      </div>
      {preset.formats.includes("png") && (
        <p className="mt-3 text-[10px] leading-relaxed text-[var(--text-secondary,#64756a)]">
          PNG is lossless; the quality slider does not affect PNG output.
        </p>
      )}
      {preset.formats.includes("jpeg") && (
        <p className="mt-3 text-[10px] leading-relaxed text-[var(--text-secondary,#64756a)]">
          JPEG uses a white background for transparent areas.
        </p>
      )}
      {preset.formats.includes("heic") && (
        <p className="mt-3 text-[10px] leading-relaxed text-[var(--text-secondary,#64756a)]">
          HEIC is for compatible photo apps. Choose WebP, AVIF, PNG or JPEG for
          websites.
        </p>
      )}
    </section>
  );
}
