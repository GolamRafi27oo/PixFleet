import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import type { WorkspaceState } from "@/hooks/use-workspace";
import { AssetRow } from "./asset-row";

export function AssetList({
  dragging,
  selected,
  assets,
  setSelected,
  busy,
  remove,
  toggleSelected,
  importImages,
}: Pick<
  WorkspaceState,
  | "dragging"
  | "selected"
  | "assets"
  | "setSelected"
  | "busy"
  | "remove"
  | "toggleSelected"
  | "importImages"
>) {
  return (
    <div
      className="[&[data-dragging=true]]:[outline:3px_solid_var(--green)] [&[data-dragging=true]]:bg-[var(--surface-soft,_#eaf4ed)] [border:1px_solid_var(--border)] rounded-[9px] bg-[var(--surface,_#fff)] overflow-hidden"
      data-dragging={dragging}
    >
      <div className="grid grid-cols-[minmax(130px,_1fr)_90px_64px_20px] gap-2.5 items-center py-[11px] px-3.5 bg-[var(--surface-soft,_#f4f7f4)] text-[color:var(--text-secondary,_#93a097)] text-[10px] tracking-[0.6px] max-[1120px]:grid-cols-[minmax(100px,_1fr)_65px_50px_15px] max-[1120px]:gap-1.5 max-[1120px]:pl-2.5 max-[1120px]:pr-2.5">
        <label className="flex items-center gap-3 tracking-[0] text-[10px]">
          <input
            type="checkbox"
            aria-label="Select all images"
            checked={selected.size === assets.length}
            onChange={() =>
              setSelected(
                selected.size === assets.length
                  ? new Set()
                  : new Set(assets.map((a) => a.id)),
              )
            }
            disabled={!!busy}
          />
          <span>{selected.size} selected</span>
        </label>
        <span>DIMENSIONS</span>
        <span>SIZE</span>
        <button
          className="p-0"
          type="button"
          aria-label="Remove selected images"
          title="Remove selected images"
          disabled={!!busy || !selected.size}
          onClick={() => remove([...selected])}
        >
          <Trash2 size={16} />
        </button>
      </div>
      {assets.map((asset) => (
        <AssetRow
          key={asset.id}
          asset={asset}
          selected={selected.has(asset.id)}
          busy={!!busy}
          onToggle={() => toggleSelected(asset.id)}
          onRemove={() => void remove([asset.id])}
        />
      ))}
      <button
        type="button"
        className="flex gap-2 justify-center items-center w-full p-4.5! [border-top:1px_dashed_var(--border-strong,_#e5ece4)] text-[10px] text-[color:var(--text-secondary,_#89a48f)]"
        disabled={!!busy}
        onClick={() => importImages(false)}
      >
        {busy === "import" ? (
          <LoaderCircle size={16} className="animate-spin" />
        ) : (
          <ImagePlus size={16} />
        )}{" "}
        Add more images, or drop them here
      </button>
    </div>
  );
}
