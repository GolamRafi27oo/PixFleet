import { LoaderCircle } from "lucide-react";
import type { WorkspaceState } from "@/hooks/use-workspace";
import { errorMessage } from "@/lib/app-info";
import { native } from "@/lib/native";

export function ExportProgress({
  cancelling,
  progress,
  selected,
  setCancelling,
  setIssues,
}: Pick<
  WorkspaceState,
  "cancelling" | "progress" | "selected" | "setCancelling" | "setIssues"
>) {
  return (
    <section
      className="mt-4 p-4.5 [border:1px_solid_var(--border-strong,_#cbded0)] rounded-[8px] bg-[var(--surface-accent,_#eff6ef)]"
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        <LoaderCircle size={18} className="animate-spin" />
        <strong className="text-[11px]">
          {cancelling
            ? "Finishing the current output…"
            : progress
              ? `Preparing ${progress.completed} of ${progress.total} images`
              : "Choose an export folder…"}
        </strong>
        <button
          type="button"
          className="inline-flex items-center gap-[7px] py-[3px] px-0 text-[10px] text-[color:var(--text-secondary,_#687d71)] [&:hover]:text-[color:var(--green)] ml-auto"
          disabled={cancelling}
          onClick={async () => {
            try {
              await native.cancel();
              setCancelling(true);
            } catch (e) {
              setIssues([errorMessage(e)]);
            }
          }}
        >
          Cancel
        </button>
      </div>
      <progress
        className="w-full h-[5px] [accent-color:var(--green)] mt-[15px]"
        value={progress?.completed ?? 0}
        max={progress?.total ?? selected.size}
      />
      <small className="block text-[color:var(--text-secondary,_#89a28e)] text-[10px] mt-[7px]">
        {progress?.filename ?? "Your originals stay exactly as they are."}
      </small>
    </section>
  );
}
