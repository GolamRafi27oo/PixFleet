import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { WorkspaceState } from "@/hooks/use-workspace";
export function SavePresetDialog({
  saving,
  setSaveOpen,
  saveError,
  presetName,
  setPresetName,
  savePreset,
}: Pick<
  WorkspaceState,
  | "saving"
  | "setSaveOpen"
  | "saveError"
  | "presetName"
  | "setPresetName"
  | "savePreset"
>) {
  return (
    <Modal
      title="Save your workflow"
      dismissDisabled={saving}
      onClose={() => {
        if (!saving) setSaveOpen(false);
      }}
    >
      <p className="text-[12px] text-[color:var(--text-secondary,_#64756a)] [margin:14px_0_25px] leading-[1.8]">
        Keep these settings ready for your next project.
      </p>
      {saveError && (
        <p
          className="bg-[var(--warning-surface,_#fff8ef)] [border:1px_solid_var(--border-strong,_#ebd6b6)] text-[color:var(--warning-text,_#946b37)] rounded-[7px] p-3.5 mt-4 text-[10px] [&_>_div]:flex [&_>_div]:justify-between [&_>_div]:items-center [&_ul]:pl-4.5 [&_ul]:max-h-37.5 [&_ul]:overflow-auto [&_ul]:leading-[1.8] [&_ul]:mb-0"
          role="alert"
        >
          {saveError}
        </p>
      )}
      <label
        className="block text-[10px] text-[color:var(--text-secondary,_#64756a)] mb-2 [&_span]:text-[color:var(--text-secondary,_#64756a)] [&_span]:ml-1 [&_span]:text-[10px]"
        htmlFor="preset-name"
      >
        Preset name
      </label>
      <input
        id="preset-name"
        className="w-full [border:1px_solid_var(--border-strong,_#e1e7e2)] rounded-[6px] py-[11px] px-2.5 text-[color:var(--text-secondary,_#4d6756)] bg-[var(--surface-soft,_#fcfdfa)] text-[10px] [&::placeholder]:text-[color:var(--text-secondary,_#b0b9b2)]"
        maxLength={80}
        placeholder="e.g. Acme client website"
        value={presetName}
        onChange={(e) => setPresetName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && presetName.trim() && !saving) savePreset();
        }}
      />
      <div className="flex justify-end gap-2.5 mt-6.5">
        <Button
          type="button"
          variant="secondary"
          className="text-[12px]"
          disabled={saving}
          onClick={() => setSaveOpen(false)}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          className="text-[12px]"
          disabled={!presetName.trim() || saving}
          onClick={savePreset}
        >
          <Save size={16} />
          {saving ? "Saving…" : "Save preset"}
        </Button>
      </div>
    </Modal>
  );
}
