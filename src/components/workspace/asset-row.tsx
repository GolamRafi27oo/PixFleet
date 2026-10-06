import { X } from "lucide-react";
import Image from "next/image";

import { type Asset, bytes } from "@/lib/model";

export function AssetRow({
  asset,
  selected,
  busy,
  onToggle,
  onRemove,
}: {
  asset: Asset;
  selected: boolean;
  busy: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      className="grid grid-cols-[minmax(130px,_1fr)_90px_64px_20px] gap-2.5 items-center py-[11px] px-3.5 [border-top:1px_solid_var(--border-strong,_#f0f3ef)] pt-3 pb-3 [&[data-selected=true]]:bg-[var(--surface-soft,_#fdfffc)] max-[1120px]:grid-cols-[minmax(100px,_1fr)_65px_50px_15px] max-[1120px]:gap-1.5 max-[1120px]:pl-2.5 max-[1120px]:pr-2.5"
      data-selected={selected}
    >
      <label className="flex gap-3 items-center min-w-0 [&_img]:rounded-[5px] [&_img]:object-cover [&_img]:bg-[var(--surface-soft,_#f3f6f0)] [&_img]:shrink-0 [&_small_>_span]:text-[color:var(--text-secondary,_#8caa94)] [&_small_>_span]:ml-[3px] max-[1120px]:gap-2 max-[1120px]:[&_img]:w-9 max-[1120px]:[&_img]:h-9 max-[1120px]:[&_small_span]:hidden">
        <input
          type="checkbox"
          aria-label={`Select ${asset.name}`}
          checked={selected}
          disabled={!!busy}
          onChange={() => onToggle()}
        />
        <Image
          unoptimized
          src={asset.thumbnail}
          alt=""
          width={52}
          height={44}
        />
        <span className="min-w-0">
          <strong
            className="text-[11px] font-medium block whitespace-nowrap overflow-hidden text-ellipsis"
            title={asset.name}
          >
            {asset.name}
          </strong>
          <small className="block text-[10px] text-[color:var(--text-secondary,_#a0aba2)] mt-1.5">
            {asset.name.split(".").pop()?.toUpperCase()}{" "}
            <span>• Ready to export</span>
          </small>
        </span>
      </label>
      <span className="text-[10px] text-[color:var(--text-secondary,_#64756a)] max-[1120px]:text-[10px]">
        {asset.width} × {asset.height}
      </span>
      <span className="text-[10px] text-[color:var(--text-secondary,_#64756a)]">
        {bytes(asset.bytes)}
      </span>
      <button
        type="button"
        className="text-[color:var(--text-secondary,_#aab5ad)] p-0"
        title={`Remove ${asset.name}`}
        aria-label={`Remove ${asset.name}`}
        disabled={!!busy}
        onClick={() => onRemove()}
      >
        <X size={15} />
      </button>
    </div>
  );
}
