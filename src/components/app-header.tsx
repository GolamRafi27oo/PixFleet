import type { WorkspaceState } from "@/hooks/use-workspace";

export function AppHeader({
  view,
  desktop,
}: Pick<WorkspaceState, "view" | "desktop">) {
  return (
    <header className="h-[77px] shrink-0 [border-bottom:1px_solid_var(--border)] flex items-center justify-between py-0 px-9 bg-[var(--surface,_#fff)] text-[11px] max-[1120px]:py-0 max-[1120px]:px-6 max-[720px]:h-15.5 max-[720px]:py-0 max-[720px]:px-5 max-[720px]:gap-3 max-[720px]:px-3">
      <div className="max-[720px]:text-[10px]">
        <span className="text-[color:var(--text-secondary,_#64756a)]">
          Your studio
        </span>
        <span className="text-[color:var(--text-secondary,_#c4cbc7)] py-0 px-[15px] max-[720px]:px-[7px]">
          /
        </span>
        <strong className="font-medium">
          {view === "workspace"
            ? "Workspace"
            : view === "presets"
              ? "My presets"
              : view === "guide"
                ? "Quick guide"
                : "Settings"}
        </strong>
      </div>
      <div className="flex items-center gap-5 max-[720px]:text-[10px]">
        <div className="flex items-center gap-[7px] text-[color:var(--text-secondary,_#64756a)] text-[10px] max-[720px]:text-[10px] max-[720px]:hidden">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--green,_#69a67f)] shadow-[0_0_0_3px_var(--surface-soft,_#f1f7f2)]" />
          {desktop ? "Processing on your device" : "Desktop interface preview"}
        </div>
      </div>
    </header>
  );
}
