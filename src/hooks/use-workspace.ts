import { listen } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessage, type View } from "@/lib/app-info";
import {
  type Asset,
  type ExportResult,
  type ImportResult,
  PRESETS,
  type Preset,
  type Progress,
  validatePreset,
} from "@/lib/model";
import { native } from "@/lib/native";

import { useUpdateCheck } from "./use-update-check";
export function useWorkspace() {
  const [view, setView] = useState<View>("workspace");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preset, setPreset] = useState<Preset>({ ...PRESETS[0] });
  const [custom, setCustom] = useState<Preset[]>([]);
  const [desktop, setDesktop] = useState(false);
  const [busy, setBusy] = useState<"import" | "export" | "remove" | null>(null);
  const busyRef = useRef(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [issues, setIssues] = useState<string[]>([]);
  const [result, setResult] = useState<ExportResult | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [settingsHealthy, setSettingsHealthy] = useState(true);
  const {
    updateState,
    latestVersion,
    releaseUrl,
    updateProgress,
    updateError,
    checkForUpdates,
    installUpdate,
  } = useUpdateCheck();
  const allPresets = [...PRESETS, ...custom];
  const selectedAssets = assets.filter((a) => selected.has(a.id));
  const totalBytes = selectedAssets.reduce((total, a) => total + a.bytes, 0);
  const outputs = selectedAssets.reduce(
    (total, a) =>
      total +
      new Set(
        preset.widths.map((w) =>
          preset.allowUpscaling ? w : Math.min(w, a.width),
        ),
      ).size *
        preset.formats.length,
    0,
  );
  const validation = validatePreset(preset);

  const acceptImport = useCallback((response: ImportResult) => {
    setAssets((current) => [
      ...current,
      ...response.images.filter((a) => !current.some((b) => b.id === a.id)),
    ]);
    setSelected(
      (current) => new Set([...current, ...response.images.map((a) => a.id)]),
    );
    setIssues(response.errors);
    setNotice(
      response.images.length
        ? `${response.images.length} image${response.images.length === 1 ? "" : "s"} added to your workspace.`
        : response.errors.length
          ? "Some images could not be added."
          : "No new images added. Duplicates and unsupported files are skipped.",
    );
  }, []);

  useEffect(() => {
    if (!native.available()) return;
    let disposed = false;
    const unlisten: (() => void)[] = [];
    const register = (cleanup: () => void) =>
      disposed ? cleanup() : unlisten.push(cleanup);
    // Native availability is resolved after hydration; the static preview stays usable.
    Promise.resolve().then(() => {
      if (!disposed) {
        setDesktop(true);
        setSettingsHealthy(false);
      }
    });
    native
      .presets()
      .then((p) => {
        if (!disposed) {
          setCustom(p);
          setSettingsHealthy(true);
        }
      })
      .catch((e) => {
        if (!disposed) {
          setIssues([errorMessage(e)]);
          setSettingsHealthy(false);
        }
      });
    listen<Progress>("export-progress", (event) => setProgress(event.payload))
      .then(register)
      .catch((e) => setIssues([errorMessage(e)]));
    getCurrentWebviewWindow()
      .onDragDropEvent((event) => {
        if (event.payload.type === "over" || event.payload.type === "enter")
          setDragging(true);
        else setDragging(false);
        if (event.payload.type !== "drop" || busyRef.current) return;
        busyRef.current = true;
        setBusy("import");
        native
          .importPaths(event.payload.paths)
          .then(acceptImport)
          .catch((e) => setIssues([errorMessage(e)]))
          .finally(() => {
            busyRef.current = false;
            setBusy(null);
          });
      })
      .then(register)
      .catch((e) => setIssues([errorMessage(e)]));
    return () => {
      disposed = true;
      unlisten.forEach((fn) => {
        fn();
      });
    };
  }, [acceptImport]);

  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(null), 7000);
    return () => clearTimeout(timeout);
  }, [notice]);

  const importImages = async (folder: boolean) => {
    if (!desktop) {
      setNotice(
        "Open the PixFleet desktop app to choose local images. This browser view previews the interface.",
      );
      return;
    }
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy("import");
    setIssues([]);
    try {
      acceptImport(await native.import(folder));
    } catch (e) {
      setIssues([errorMessage(e)]);
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  };

  const remove = async (ids: string[]) => {
    if (busyRef.current || !ids.length) return;
    busyRef.current = true;
    setBusy("remove");
    try {
      await native.remove(ids);
      setAssets((current) => current.filter((a) => !ids.includes(a.id)));
      setSelected(
        (current) => new Set([...current].filter((id) => !ids.includes(id))),
      );
    } catch (e) {
      setIssues([errorMessage(e)]);
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  };

  const exportImages = async () => {
    if (!desktop || validation || !selected.size || busyRef.current) return;
    busyRef.current = true;
    setBusy("export");
    setProgress(null);
    setCancelling(false);
    setIssues([]);
    setResult(null);
    try {
      const response = await native.export(
        selectedAssets.map((a) => a.id),
        preset,
      );
      if (response?.cancelled)
        setNotice(
          "Export cancelled. Incomplete output was removed; your originals are safe.",
        );
      else if (response) {
        setResult(response);
      }
    } catch (e) {
      setIssues([errorMessage(e)]);
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  };

  const savePreset = async () => {
    if (savingRef.current || !settingsHealthy || busyRef.current) return;
    setSaveError(null);
    const saved = {
      ...preset,
      id: crypto.randomUUID(),
      name: presetName.trim(),
    };
    const error = validatePreset(saved);
    if (error) {
      setSaveError(error);
      return;
    }
    savingRef.current = true;
    setSaving(true);
    try {
      if (desktop) await native.savePresets([...custom, saved]);
      setCustom((current) => [...current, saved]);
      setPreset(saved);
      setSaveOpen(false);
      setNotice(
        desktop
          ? "Preset saved on this device."
          : "Preset added for this preview session. Desktop presets are saved on your device.",
      );
    } catch (e) {
      setSaveError(errorMessage(e));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const deletePreset = async (id: string) => {
    if (savingRef.current || !settingsHealthy || busyRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      const next = custom.filter((p) => p.id !== id);
      if (desktop) await native.savePresets(next);
      setCustom(next);
      if (preset.id === id) setPreset({ ...PRESETS[0] });
    } catch (e) {
      setIssues([errorMessage(e)]);
      setNotice(`Could not delete preset: ${errorMessage(e)}`);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const change = (value: Partial<Preset>) =>
    setPreset((p) => ({ ...p, ...value }));
  const toggleSelected = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return {
    view,
    setView,
    assets,
    selected,
    setSelected,
    preset,
    setPreset,
    desktop,
    busy,
    progress,
    cancelling,
    setCancelling,
    dragging,
    notice,
    setNotice,
    issues,
    setIssues,
    result,
    setResult,
    saveOpen,
    setSaveOpen,
    presetName,
    setPresetName,
    saving,
    saveError,
    setSaveError,
    settingsHealthy,
    updateState,
    latestVersion,
    releaseUrl,
    updateProgress,
    updateError,
    allPresets,
    totalBytes,
    outputs,
    validation,
    checkForUpdates,
    installUpdate,
    importImages,
    remove,
    exportImages,
    savePreset,
    deletePreset,
    change,
    toggleSelected,
  };
}
export type WorkspaceState = ReturnType<typeof useWorkspace>;
