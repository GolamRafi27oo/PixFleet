import { ArrowRight, Check, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

import type { WorkspaceState } from "@/hooks/use-workspace";
import { bytes } from "@/lib/model";
export function ExportResultDialog({
  result,
  setResult,
}: Pick<WorkspaceState, "result" | "setResult">) {
  if (!result) return null;
  return (
    <Modal title="Your assets are ready." onClose={() => setResult(null)}>
      <div className="bg-[var(--surface-accent,_#eaf5e7)] text-[color:var(--text-secondary,_#5b9970)] rounded-full w-14.5 h-14.5 grid place-items-center mt-6">
        <Check size={28} />
      </div>
      <p className="text-[12px] text-[color:var(--text-secondary,_#64756a)] [margin:14px_0_25px] leading-[1.8]">
        {result.images} images became {result.files} exported assets.
      </p>
      <div className="flex items-center justify-between gap-7.5 bg-[var(--surface-soft,_#f5f8f2)] p-5.5 rounded-[8px] text-[color:var(--text-secondary,_#658b70)]">
        <div>
          <small className="block text-[10px] mb-2 text-[color:var(--text-secondary,_#8ba18e)]">
            Originals
          </small>
          <strong className="text-[24px] tracking-[-0.8px] font-medium">
            {bytes(result.inputBytes)}
          </strong>
        </div>
        <ArrowRight size={20} />
        <div>
          <small className="block text-[10px] mb-2 text-[color:var(--text-secondary,_#8ba18e)]">
            All output sizes
          </small>
          <strong className="text-[24px] tracking-[-0.8px] font-medium">
            {bytes(result.outputBytes)}
          </strong>
        </div>
      </div>
      <p className="flex gap-[9px] text-[10px] text-[color:var(--text-secondary,_#839b87)] leading-[1.8] my-5 mx-0 break-all [&_svg]:shrink-0 [&_svg]:mt-0.5">
        <Folder size={17} />
        <span>{result.directory}</span>
      </p>
      {result.errors.length > 0 && (
        <div className="bg-[var(--warning-surface,_#fff8ef)] [border:1px_solid_var(--border-strong,_#ebd6b6)] text-[color:var(--warning-text,_#946b37)] rounded-[7px] p-3.5 mt-4 text-[10px] [&_>_div]:flex [&_>_div]:justify-between [&_>_div]:items-center">
          <strong>{result.errors.length} images skipped</strong>
          <ul className="pl-4.5 max-h-37.5 overflow-auto leading-[1.8] mb-0">
            {result.errors.map((e, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: Export errors are an immutable snapshot with possible duplicates.
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex justify-end gap-2.5 mt-6.5">
        <Button
          type="button"
          variant="secondary"
          className="text-[12px]"
          onClick={() => setResult(null)}
        >
          Done
        </Button>
      </div>
    </Modal>
  );
}
