import { LoaderCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

import type { WorkspaceState } from "@/hooks/use-workspace";

export function EmptyBatch({
  dragging,
  busy,
  importImages,
}: Pick<WorkspaceState, "dragging" | "busy" | "importImages">) {
  return (
    <div
      className="[border:1.5px_dashed_var(--border-strong,_#cddfd1)] rounded-[11px] [background:linear-gradient(_140deg,_var(--surface,_#fff),_var(--surface-soft,_#f3f8f4)_)] min-h-[349px] flex flex-col items-center justify-center [padding:26px_18px_29px] [&[data-dragging=true]]:[outline:3px_solid_var(--green)] [&[data-dragging=true]]:bg-[var(--surface-soft,_#eaf4ed)] [&_h3]:text-[19px] [&_h3]:font-[550] [&_h3]:tracking-[-0.4px] min-[1500px]:min-h-105 max-[720px]:min-h-82.5"
      data-dragging={dragging}
    >
      <div
        className="w-43.5 h-32.5 relative [margin:0_0_16px]"
        aria-hidden="true"
      >
        <div className="absolute w-[81px] h-24.5 [border:1px_solid_#e1e6e0] bg-[#fcfaf5] rounded-[7px] p-1.5 shadow-[0_7px_11px_#3046320b] top-[19px] left-5 [transform:rotate(-19deg)]">
          <div className="h-17 rounded-[3px] relative overflow-hidden [background:linear-gradient(135deg,_#eedbc4,_#f6e9d9)]" />
        </div>
        <div className="absolute w-[81px] h-24.5 [border:1px_solid_#e1e6e0] bg-[#fff] rounded-[7px] p-1.5 shadow-[0_7px_11px_#3046320b] top-3 left-19 [transform:rotate(17deg)]">
          <div className="h-17 rounded-[3px] relative overflow-hidden [background:linear-gradient(150deg,_#e8e7f1,_#d6d7e5)]" />
        </div>
        <div className="absolute w-[81px] h-24.5 [border:1px_solid_#e1e6e0] bg-[#fff] rounded-[7px] p-1.5 shadow-[0_7px_11px_#3046320b] top-5.5 left-[51px] [transform:rotate(-3deg)]">
          <div className="h-17 rounded-[3px] relative overflow-hidden bg-[#dcebdc]">
            <span className="absolute right-[13px] top-[13px] w-3 h-3 bg-[#f9fcdd] rounded-full" />
            <span className="absolute [transform:rotate(45deg)] rounded-[6px] bg-[#afc9ad] w-[65px] h-[65px] left-7 top-[35px]" />
            <span className="absolute [transform:rotate(45deg)] rounded-[6px] bg-[#71977b] w-[59px] h-[59px] top-[39px] left-[-4px]" />
          </div>
          <span className="block bg-[#e4eae1] w-7.5 h-[3px] rounded-[2px] mt-2 shadow-[17px_0_0_#f0f3ec]" />
        </div>
        <span className="absolute right-4.5 bottom-[3px] bg-[var(--green)] text-[color:var(--on-accent,_#fff)] grid place-items-center w-[29px] h-[29px] [border:3px_solid_var(--border-strong,_#f6f9f5)] rounded-full shadow-[0_4px_8px_#244b1c14]">
          <Plus size={19} />
        </span>
        <span className="absolute text-[color:#93b698] text-[17px] top-0.5 left-[23px]">
          ✦
        </span>
        <span className="absolute text-[color:#93b698] text-[12px] bottom-[9px] left-[15px]">
          ✦
        </span>
      </div>
      <h3>
        {busy === "import"
          ? "Getting your images ready…"
          : dragging
            ? "Drop them right here"
            : "Drop your images here"}
      </h3>
      <p className="text-[10px] text-[color:var(--text-secondary,_#64756a)] [margin:10px_0_20px] max-[900px]:text-center max-[900px]:leading-[1.8]">
        A whole folder or a few favorites. We’ll take it from here.
      </p>
      <Button
        type="button"
        variant="primary"
        className="min-h-9.5"
        onClick={() => importImages(false)}
        disabled={!!busy}
      >
        {busy === "import" ? (
          <LoaderCircle className="animate-spin" size={17} />
        ) : (
          <Plus size={18} />
        )}{" "}
        Choose images
      </Button>
      <div className="text-[10px] tracking-[0.6px] text-[color:var(--text-secondary,_#64756a)] mt-4.5">
        JPG, PNG, WEBP, HEIC, SVG <span className="py-0 px-[7px]">·</span> Up to
        500 images per batch
      </div>
    </div>
  );
}
