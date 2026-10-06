import {
  ArrowRight,
  CircleHelp,
  Coffee,
  Images,
  Layers3,
  LockKeyhole,
  Settings2,
  SlidersHorizontal,
} from "lucide-react";
import type { WorkspaceState } from "@/hooks/use-workspace";
import { APP_VERSION } from "@/lib/app-info";
import { NavigationButton } from "./ui/navigation-button";

export function Sidebar({
  view,
  setView,
  assets,
}: Pick<WorkspaceState, "view" | "setView" | "assets">) {
  return (
    <aside className="w-53.5 shrink-0 bg-[var(--sidebar)] [border-right:1px_solid_var(--border-strong,_#e3eae4)] flex flex-col [padding:32px_18px_18px] fixed [inset:0_auto_0_0] max-[1120px]:w-45.5 max-[1120px]:pl-3 max-[1120px]:pr-3 max-[900px]:w-18 max-[900px]:items-center max-[900px]:py-[23px] max-[900px]:px-2">
      <button
        type="button"
        className="flex items-center text-[26px] tracking-[-1.3px] font-[750] [margin:0_10px_52px] max-[1120px]:text-[23px] max-[1120px]:ml-1.5 max-[900px]:text-[0px] max-[900px]:[margin:0_0_38px]"
        onClick={() => setView("workspace")}
        aria-label="PixFleet home"
      >
        <span className="grid place-items-center bg-[var(--green)] text-[color:var(--on-accent,_#fff)] w-8.5 h-9 rounded-[10px] mr-2.5 [transform:rotate(-5deg)] max-[900px]:m-0">
          <Layers3 size={23} strokeWidth={2.5} />
        </span>
        PixFleet
        <span className="text-[color:var(--green)] max-[900px]:hidden">.</span>
      </button>
      <div className="text-[10px] tracking-[1.8px] text-[color:var(--text-secondary,_#64756a)] font-bold [margin:0_14px_14px] max-[900px]:hidden">
        YOUR STUDIO
      </div>
      <nav aria-label="Main navigation">
        <NavigationButton
          aria-current={view === "workspace" ? "page" : undefined}
          onClick={() => setView("workspace")}
        >
          <Images size={19} /> Workspace{" "}
          <span className="ml-auto text-[10px] bg-[var(--surface-soft,_#f6faf6)] [border:1px_solid_var(--border-strong,_#d1e2d4)] py-0.5 px-1.5 rounded-[5px] max-[900px]:hidden">
            {assets.length}
          </span>
        </NavigationButton>
        <NavigationButton
          aria-current={view === "presets" ? "page" : undefined}
          onClick={() => setView("presets")}
        >
          <SlidersHorizontal size={19} /> My presets{" "}
          <span className="w-[5px] h-[5px] rounded-full bg-[var(--green,_#a3b1a6)] ml-auto max-[900px]:hidden" />
        </NavigationButton>
        <NavigationButton
          aria-current={view === "settings" ? "page" : undefined}
          onClick={() => setView("settings")}
        >
          <Settings2 size={19} /> Settings
        </NavigationButton>
      </nav>
      <div className="py-[19px] px-[13px] mt-auto max-[900px]:hidden">
        <div className="text-[color:var(--text-secondary,_#6a977a)] mb-[13px]">
          <LockKeyhole size={18} />
        </div>
        <strong className="text-[11px] font-semibold">
          Your files. Your computer.
        </strong>
        <p className="text-[10px] text-[color:var(--text-secondary,_#64756a)] leading-[1.85] [margin:9px_0_14px]">
          Everything happens locally.
          <br />
          Your images never leave this device.
        </p>
        <span className="flex items-center gap-[5px] text-[10px] text-[color:var(--text-secondary,_#6b9779)]">
          <i className="w-1 h-1 bg-[var(--green,_#6b9779)] rounded-full" /> 100%
          offline by design
        </span>
      </div>
      <div className="pt-[15px] [&_button:first-child]:text-[11px] [&_button:first-child_svg:last-child]:ml-auto max-[900px]:[&_button:first-child_svg:last-child]:hidden max-[900px]:[&_button:first-child]:text-[0px] max-[900px]:mt-auto">
        <NavigationButton
          aria-current={view === "guide" ? "page" : undefined}
          onClick={() => setView("guide")}
        >
          <CircleHelp size={18} /> Quick guide <ArrowRight size={15} />
        </NavigationButton>
        <button
          type="button"
          className="flex items-center gap-2.5 w-full min-h-12.5 mt-3.5 py-2.5 px-3 text-left text-[color:#000] cursor-pointer rounded-[7px] bg-[#ffdd00] [&:hover]:bg-[#ffe52e] [&:active]:[transform:translateY(1px)] [&_svg]:shrink-0 [&_svg]:text-[color:#111] max-[900px]:[&_span:first-of-type]:hidden max-[900px]:[&_span:last-child]:hidden max-[900px]:w-11.5 max-[900px]:min-h-11.5 max-[900px]:justify-center max-[900px]:mt-3.5 max-[900px]:p-2 max-[900px]:[border-width:3px] max-[900px]:rounded-[14px]"
          aria-label="Support independent development"
          onClick={() => {
            document.querySelector<HTMLElement>(".sk-widget-btn")?.click();
          }}
        >
          <Coffee size={19} strokeWidth={2.4} aria-hidden="true" />
          <span className="flex-1 min-w-0 text-[color:#111] text-[13px] font-bold leading-[1.15] whitespace-nowrap">
            Support dev
          </span>
          <span className="text-[color:#607bca] text-[12px] font-medium ml-auto whitespace-nowrap">
            v{APP_VERSION}
          </span>
        </button>
      </div>
    </aside>
  );
}
