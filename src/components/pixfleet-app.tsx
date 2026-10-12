"use client";

import { ArrowLeft } from "lucide-react";
import { PageHeading } from "@/components/ui/page-heading";
import { useWorkspace } from "@/hooks/use-workspace";
import { AppHeader } from "./app-header";
import { GuidePage } from "./guide-page";
import { PresetsPage } from "./presets/presets-page";
import { SavePresetDialog } from "./presets/save-preset-dialog";
import { SettingsPage } from "./settings/settings-page";
import { Sidebar } from "./sidebar";
import { Notification } from "./ui/notification";
import { BatchPanel } from "./workspace/batch-panel";
import { ExportResultDialog } from "./workspace/export-result-dialog";
import { ExportSettings } from "./workspace/export-settings";
export function PixFleetApp() {
  const state = useWorkspace();
  const { view, setView } = state;
  return (
    <div className="min-h-screen flex">
      <Sidebar view={view} setView={setView} assets={state.assets} />
      <div className="ml-53.5 flex-1 min-w-0 h-screen flex flex-col overflow-hidden max-[1120px]:ml-45.5 max-[900px]:ml-18">
        <AppHeader view={view} desktop={state.desktop} />
        {view === "workspace" ? (
          <main className="grid grid-cols-[minmax(0,_1fr)_309px] flex-1 min-h-0 overflow-hidden min-[1500px]:grid-cols-[minmax(0,_1fr)_345px] max-[1120px]:grid-cols-[minmax(0,_1fr)_285px] max-[900px]:grid-cols-[minmax(0,_1fr)_280px] max-[720px]:flex max-[720px]:flex-col max-[720px]:overflow-y-auto">
            <BatchPanel {...state} />
            <ExportSettings {...state} />
          </main>
        ) : (
          <main
            className="py-[35px] px-10 max-w-300 overflow-y-auto [&[data-settings=true]]:max-w-[none] max-[720px]:py-[25px] max-[720px]:px-5"
            data-settings={view === "settings"}
          >
            {view !== "settings" && (
              <>
                <button
                  type="button"
                  className="inline-flex items-center gap-[7px] py-[3px] px-0 text-[10px] text-[color:var(--text-secondary,_#687d71)] [&:hover]:text-[color:var(--green)]"
                  onClick={() => setView("workspace")}
                >
                  <ArrowLeft size={16} /> Back to workspace
                </button>
                <PageHeading
                  eyebrow={
                    <>
                      {" "}
                      {view === "presets"
                        ? "YOUR WORKFLOW, ON REPEAT"
                        : "A SMALL GUIDE TO LIGHTER WEBSITES"}{" "}
                    </>
                  }
                  title={
                    <>
                      {" "}
                      {view === "presets"
                        ? "Set it once. Ship it often."
                        : "From folder to finished."}{" "}
                    </>
                  }
                  description={
                    <>
                      {" "}
                      {view === "presets"
                        ? "Reliable starting points for every kind of project."
                        : "Three steps. Everything stays on your computer."}{" "}
                    </>
                  }
                  className="my-[35px]"
                />
              </>
            )}
            {view === "settings" ? (
              <SettingsPage
                updateState={state.updateState}
                latestVersion={state.latestVersion}
                releaseUrl={state.releaseUrl}
                updateProgress={state.updateProgress}
                updateError={state.updateError}
                checkForUpdates={state.checkForUpdates}
                installUpdate={state.installUpdate}
              />
            ) : view === "presets" ? (
              <PresetsPage
                allPresets={state.allPresets}
                busy={state.busy}
                setPreset={state.setPreset}
                setView={setView}
                saving={state.saving}
                settingsHealthy={state.settingsHealthy}
                deletePreset={state.deletePreset}
              />
            ) : (
              <GuidePage />
            )}
          </main>
        )}
      </div>
      {state.notice && (
        <Notification notice={state.notice} setNotice={state.setNotice} />
      )}
      {state.saveOpen && (
        <SavePresetDialog
          saving={state.saving}
          setSaveOpen={state.setSaveOpen}
          saveError={state.saveError}
          presetName={state.presetName}
          setPresetName={state.setPresetName}
          savePreset={state.savePreset}
        />
      )}
      {state.result && (
        <ExportResultDialog result={state.result} setResult={state.setResult} />
      )}
    </div>
  );
}
