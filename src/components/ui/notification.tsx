import { CheckCheck, X } from "lucide-react";

import type { WorkspaceState } from "@/hooks/use-workspace";

export function Notification({
  notice,
  setNotice,
}: Pick<WorkspaceState, "notice" | "setNotice">) {
  return (
    <div
      className="fixed bottom-6 left-[50%] [transform:translateX(-50%)] bg-[var(--toast-surface,_#254d3e)] text-[color:var(--on-accent,_#fff)] flex items-center gap-[11px] rounded-[9px] shadow-[0_8px_35px_#153e2b25] py-4 px-5 max-w-162.5 w-[max-content] text-[12px] [z-index:10] leading-[1.6] [&_svg]:shrink-0 max-[720px]:max-w-[calc(100vw_-_28px)] max-[720px]:text-[11px]"
      role="status"
    >
      <CheckCheck size={18} />
      <span>{notice}</span>
      <button
        className="flex ml-2 text-[color:var(--on-accent,_#a4c7ad)]"
        type="button"
        aria-label="Dismiss notification"
        onClick={() => setNotice(null)}
      >
        <X size={15} />
      </button>
    </div>
  );
}
