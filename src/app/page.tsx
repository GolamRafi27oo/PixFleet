"use client";

import { listen } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCheck,
  ChevronDown,
  CircleHelp,
  Code2,
  Coffee,
  Copy,
  Folder,
  FolderOpen,
  ImagePlus,
  Images,
  Layers3,
  LoaderCircle,
  LockKeyhole,
  Monitor,
  Plus,
  Save,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Tablet,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  type Asset,
  bytes,
  type ExportResult,
  type ImportResult,
  PRESETS,
  type Preset,
  type Progress,
  validatePreset,
} from "@/lib/model";
import { native } from "@/lib/native";

type View = "workspace" | "presets" | "guide" | "settings";
const APP_VERSION = "0.1.0";
const RELEASES_URL =
  "https://api.github.com/repos/GolamRafi27oo/PixFleet/releases/latest";
const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

export default function Home() {
  const [view, setView] = useState<View>("workspace");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preset, setPreset] = useState<Preset>({ ...PRESETS[0] });
  const [custom, setCustom] = useState<Preset[]>([]);
  const [desktop, setDesktop] = useState(false);
  const [busy, setBusy] = useState<"import" | "export" | null>(null);
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
  const [saveError, setSaveError] = useState<string | null>(null);
  const [settingsHealthy, setSettingsHealthy] = useState(true);
  const [updateState, setUpdateState] = useState<
    "idle" | "checking" | "up-to-date" | "available" | "error"
  >("idle");
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const allPresets = [...PRESETS, ...custom];
  const selectedAssets = assets.filter((a) => selected.has(a.id));
  const totalBytes = selectedAssets.reduce((total, a) => total + a.bytes, 0);
  const outputs = selectedAssets.reduce(
    (total, a) =>
      total +
      new Set(preset.widths.map((w) => Math.min(w, a.width))).size *
        preset.formats.length,
    0,
  );
  const validation = validatePreset(preset);

  const checkForUpdates = useCallback(async () => {
    setUpdateState("checking");
    try {
      const response = await fetch(RELEASES_URL, {
        headers: { Accept: "application/vnd.github+json" },
      });
      if (!response.ok) throw new Error("GitHub release lookup failed");
      const release = (await response.json()) as {
        tag_name?: string;
        html_url?: string;
      };
      const latest = release.tag_name?.replace(/^v/, "");
      setLatestVersion(latest ?? null);
      setUpdateState(
        latest && latest !== APP_VERSION ? "available" : "up-to-date",
      );
    } catch {
      setUpdateState("error");
    }
  }, []);

  useEffect(() => {
    // Check silently on startup; the Settings page exposes the result and a manual retry.
    void checkForUpdates();
  }, [checkForUpdates]);

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
      if (!disposed) setDesktop(true);
    });
    native
      .presets()
      .then((p) => {
        if (!disposed) setCustom(p);
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
    try {
      await native.remove(ids);
      setAssets((current) => current.filter((a) => !ids.includes(a.id)));
      setSelected(
        (current) => new Set([...current].filter((id) => !ids.includes(id))),
      );
    } catch (e) {
      setIssues([errorMessage(e)]);
    }
  };

  const exportImages = async () => {
    if (validation || !selected.size || busyRef.current) return;
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
        setCopied(false);
      }
    } catch (e) {
      setIssues([errorMessage(e)]);
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  };

  const savePreset = async () => {
    if (saving) return;
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
      setSaving(false);
    }
  };

  const deletePreset = async (id: string) => {
    if (saving) return;
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

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button
          type="button"
          className="brand"
          onClick={() => setView("workspace")}
          aria-label="PixFleet home"
        >
          <span className="brand-symbol">
            <Layers3 size={23} strokeWidth={2.5} />
          </span>
          PixFleet<span className="brand-dot">.</span>
        </button>
        <div className="space-label">YOUR STUDIO</div>
        <nav aria-label="Main navigation">
          <button
            type="button"
            className={`nav-item ${view === "workspace" ? "active" : ""}`}
            onClick={() => setView("workspace")}
          >
            <Images size={19} /> Workspace{" "}
            <span className="nav-count">{assets.length}</span>
          </button>
          <button
            type="button"
            className={`nav-item ${view === "presets" ? "active" : ""}`}
            onClick={() => setView("presets")}
          >
            <SlidersHorizontal size={19} /> My presets{" "}
            <span className="tiny-dot" />
          </button>
          <button
            type="button"
            className={`nav-item ${view === "settings" ? "active" : ""}`}
            onClick={() => setView("settings")}
          >
            <Settings2 size={19} /> Settings
          </button>
        </nav>
        <div className="sidebar-note">
          <div className="note-icon">
            <LockKeyhole size={18} />
          </div>
          <strong>Your files. Your computer.</strong>
          <p>
            Everything happens locally.
            <br />
            Your images never leave this device.
          </p>
          <span>
            <i /> 100% offline by design
          </span>
        </div>
        <div className="sidebar-bottom">
          <button
            type="button"
            className={`nav-item ${view === "guide" ? "active" : ""}`}
            onClick={() => setView("guide")}
          >
            <CircleHelp size={18} /> Quick guide <ArrowRight size={15} />
          </button>
          <button
            type="button"
            className="edition-support"
            aria-label="Support independent development"
            onClick={() => {
              document.querySelector<HTMLElement>(".sk-widget-btn")?.click();
            }}
          >
            <Coffee size={19} strokeWidth={2.4} aria-hidden="true" />
            <span className="support-label">Support dev</span>
            <span className="version">v0.1</span>
          </button>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div>
            <span className="breadcrumb">Your studio</span>
            <span className="crumb-slash">/</span>
            <strong>
              {view === "workspace"
                ? "Workspace"
                : view === "presets"
                  ? "My presets"
                  : view === "guide"
                    ? "Quick guide"
                    : "Settings"}
            </strong>
          </div>
          <div className="topbar-actions">
            <div className="local-badge">
              <span className="status-dot" />
              {desktop
                ? "Processing on your device"
                : "Desktop interface preview"}
            </div>
          </div>
        </header>

        {view === "workspace" ? (
          <main className="workspace">
            <section className="batch-panel">
              <div className="page-heading">
                <div className="eyebrow">LESS PREP. MORE CREATING.</div>
                <h1>
                  Good things come in batches<span>.</span>
                </h1>
                <p>From a folder of images to a website-ready collection.</p>
              </div>
              <div className="batch-toolbar">
                <h2>
                  Your images <span>{assets.length}</span>
                </h2>
                <div>
                  <button
                    type="button"
                    className="text-button"
                    disabled={!!busy}
                    onClick={() => importImages(true)}
                  >
                    <FolderOpen size={16} /> Add folder
                  </button>
                  <button
                    type="button"
                    className="button secondary compact"
                    disabled={!!busy}
                    onClick={() => importImages(false)}
                  >
                    <Plus size={16} /> Add images
                  </button>
                </div>
              </div>

              {assets.length === 0 ? (
                <div className={`dropzone ${dragging ? "dragging" : ""}`}>
                  <div className="image-stack" aria-hidden="true">
                    <div className="picture-card card-back">
                      <div className="abstract-scene scene-peach" />
                    </div>
                    <div className="picture-card card-middle">
                      <div className="abstract-scene scene-lilac" />
                    </div>
                    <div className="picture-card card-front">
                      <div className="abstract-scene scene-green">
                        <span className="sun" />
                        <span className="mountain mountain-back" />
                        <span className="mountain mountain-front" />
                      </div>
                      <span className="picture-lines" />
                    </div>
                    <span className="stack-badge">
                      <Plus size={19} />
                    </span>
                    <span className="spark spark-one">✦</span>
                    <span className="spark spark-two">✦</span>
                  </div>
                  <h3>
                    {busy === "import"
                      ? "Getting your images ready…"
                      : dragging
                        ? "Drop them right here"
                        : "Drop your images here"}
                  </h3>
                  <p>
                    A whole folder or a few favorites. We’ll take it from here.
                  </p>
                  <button
                    type="button"
                    className="button primary"
                    onClick={() => importImages(false)}
                    disabled={!!busy}
                  >
                    {busy === "import" ? (
                      <LoaderCircle className="spin" size={17} />
                    ) : (
                      <Plus size={18} />
                    )}{" "}
                    Choose images
                  </button>
                  <div className="supported">
                    JPG, PNG, WEBP <span>·</span> Up to 500 images per batch
                  </div>
                </div>
              ) : (
                <div className={`asset-list ${dragging ? "dragging" : ""}`}>
                  <div className="list-header">
                    <label>
                      <input
                        type="checkbox"
                        aria-label="Select all images"
                        checked={selected.size === assets.length}
                        onChange={() =>
                          setSelected(
                            selected.size === assets.length
                              ? new Set()
                              : new Set(assets.map((a) => a.id)),
                          )
                        }
                        disabled={!!busy}
                      />
                      <span>{selected.size} selected</span>
                    </label>
                    <span>DIMENSIONS</span>
                    <span>SIZE</span>
                    <button
                      type="button"
                      aria-label="Remove selected images"
                      title="Remove selected images"
                      disabled={!!busy || !selected.size}
                      onClick={() => remove([...selected])}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {assets.map((asset) => (
                    <div
                      className={`asset-row ${selected.has(asset.id) ? "is-selected" : ""}`}
                      key={asset.id}
                    >
                      <label className="asset-name">
                        <input
                          type="checkbox"
                          aria-label={`Select ${asset.name}`}
                          checked={selected.has(asset.id)}
                          disabled={!!busy}
                          onChange={() => toggleSelected(asset.id)}
                        />
                        <Image
                          unoptimized
                          src={asset.thumbnail}
                          alt=""
                          width={52}
                          height={44}
                        />
                        <span>
                          <strong title={asset.name}>{asset.name}</strong>
                          <small>
                            {asset.name.split(".").pop()?.toUpperCase()}{" "}
                            <span>• Ready to export</span>
                          </small>
                        </span>
                      </label>
                      <span className="dimensions">
                        {asset.width} × {asset.height}
                      </span>
                      <span className="file-size">{bytes(asset.bytes)}</span>
                      <button
                        type="button"
                        className="remove-image"
                        title={`Remove ${asset.name}`}
                        aria-label={`Remove ${asset.name}`}
                        disabled={!!busy}
                        onClick={() => remove([asset.id])}
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="add-more"
                    disabled={!!busy}
                    onClick={() => importImages(false)}
                  >
                    {busy === "import" ? (
                      <LoaderCircle size={16} className="spin" />
                    ) : (
                      <ImagePlus size={16} />
                    )}{" "}
                    Add more images, or drop them here
                  </button>
                </div>
              )}

              {issues.length > 0 && (
                <div className="issues" role="alert">
                  <div>
                    <strong>A few things need attention</strong>
                    <button
                      type="button"
                      aria-label="Dismiss errors"
                      onClick={() => setIssues([])}
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <ul>
                    {issues.map((issue, i) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: Immutable error snapshots may contain repeated messages.
                      <li key={i}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {busy === "export" && (
                <section className="progress-card" aria-live="polite">
                  <div>
                    <LoaderCircle size={18} className="spin" />
                    <strong>
                      {cancelling
                        ? "Finishing the current output…"
                        : progress
                          ? `Preparing ${progress.completed} of ${progress.total} images`
                          : "Choose an export folder…"}
                    </strong>
                    <button
                      type="button"
                      className="text-button"
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
                    value={progress?.completed ?? 0}
                    max={progress?.total ?? selected.size}
                  />
                  <small>
                    {progress?.filename ??
                      "Your originals stay exactly as they are."}
                  </small>
                </section>
              )}

              <div className="workflow-caption">
                <span />A LITTLE LESS BUSYWORK
                <span />
              </div>
              <div className="benefit-grid">
                <Benefit
                  icon={<Zap size={19} />}
                  title="Lighter. Faster."
                  text="Modern formats that keep your site moving."
                />
                <Benefit
                  icon={<Monitor size={19} />}
                  title="Every screen, covered."
                  text="Responsive sizes, in one tidy export."
                />
                <Benefit
                  icon={<Code2 size={19} />}
                  title="Ready to ship."
                  text="Clean filenames and HTML included."
                />
              </div>
              <div className="batch-footer">
                <ShieldCheck size={15} />
                <span>
                  Originals stay untouched. Location metadata gets removed.
                </span>
                <span className="shortcut-hint">Made for your workflow</span>
              </div>
            </section>

            <aside className="settings-panel" aria-label="Export settings">
              <div className="settings-title">
                <h2>
                  <Settings2 size={18} /> Export settings
                </h2>
                <span className="step-badge">01 — 03</span>
              </div>
              <fieldset disabled={!!busy}>
                <section className="setting-section preset-section">
                  <label htmlFor="preset" className="field-label">
                    START WITH A PRESET
                  </label>
                  <div className="select-wrap">
                    <Layers3 size={17} />
                    <select
                      id="preset"
                      value={preset.id}
                      onChange={(e) => {
                        const p = allPresets.find(
                          (p) => p.id === e.target.value,
                        );
                        if (p) setPreset({ ...p });
                      }}
                    >
                      {allPresets.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={15} />
                  </div>
                  <p className="field-hint">
                    A good starting point. Make it yours below.
                  </p>
                </section>
                <section className="setting-section">
                  <div className="section-label">
                    <span className="section-number">1</span>
                    <h3>Format & quality</h3>
                  </div>
                  <div className="format-options">
                    {(["webp", "avif"] as const).map((format) => (
                      <button
                        type="button"
                        key={format}
                        className={`format-card ${preset.formats.includes(format) ? "chosen" : ""}`}
                        aria-pressed={preset.formats.includes(format)}
                        onClick={() =>
                          change({
                            formats: preset.formats.includes(format)
                              ? preset.formats.filter((f) => f !== format)
                              : [...preset.formats, format],
                          })
                        }
                      >
                        <span>
                          <strong>{format.toUpperCase()}</strong>
                          <span className="format-check">
                            {preset.formats.includes(format) && (
                              <Check size={11} />
                            )}
                          </span>
                        </span>
                        <small>
                          {format === "webp"
                            ? "The all-rounder"
                            : "Smaller, slower"}
                        </small>
                      </button>
                    ))}
                  </div>
                  <div className="quality-label">
                    <label htmlFor="quality">Quality</label>
                    <output htmlFor="quality">
                      {preset.quality}
                      <span>%</span>
                    </output>
                  </div>
                  <input
                    id="quality"
                    type="range"
                    min="1"
                    max="100"
                    value={preset.quality}
                    onChange={(e) =>
                      change({ quality: Number(e.target.value) })
                    }
                  />
                  <div className="range-labels">
                    <span>Smaller files</span>
                    <span>More detail</span>
                  </div>
                </section>
                <section className="setting-section">
                  <div className="section-label">
                    <span className="section-number">2</span>
                    <h3>Responsive sizes</h3>
                    <span className="count-label">{preset.widths.length}</span>
                  </div>
                  <div className="size-list">
                    {preset.widths.map((width, index) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: Controlled width slots retain input focus while their values change.
                      <div className="size-row" key={index}>
                        {index === 0 ? (
                          <Smartphone size={17} />
                        ) : index === 1 ? (
                          <Tablet size={17} />
                        ) : (
                          <Monitor size={17} />
                        )}
                        <label htmlFor={`width-${index}`}>
                          {index === 0
                            ? "Small"
                            : index === 1
                              ? "Medium"
                              : index === 2
                                ? "Large"
                                : `Size ${index + 1}`}
                        </label>
                        <div>
                          <input
                            id={`width-${index}`}
                            aria-label={`Output width ${index + 1}`}
                            type="number"
                            min="16"
                            max="8192"
                            value={width || ""}
                            onChange={(e) =>
                              change({
                                widths: preset.widths.map((w, i) =>
                                  i === index ? Number(e.target.value) : w,
                                ),
                              })
                            }
                          />
                          <span>px</span>
                        </div>
                        <button
                          type="button"
                          className="width-remove"
                          aria-label={`Remove size ${index + 1}`}
                          onClick={() =>
                            change({
                              widths: preset.widths.filter(
                                (_, i) => i !== index,
                              ),
                            })
                          }
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="text-button add-size"
                    disabled={preset.widths.length >= 6}
                    onClick={() =>
                      change({
                        widths: [
                          ...preset.widths,
                          Math.min(8192, Math.max(0, ...preset.widths) + 320),
                        ],
                      })
                    }
                  >
                    <Plus size={13} /> Add a size
                  </button>
                  <p className="field-hint">
                    <Check size={12} /> Keep proportions. Never upscale.
                  </p>
                </section>
                <section className="setting-section naming-section">
                  <div className="section-label">
                    <span className="section-number">3</span>
                    <h3>The finishing touches</h3>
                  </div>
                  <label htmlFor="prefix" className="input-label">
                    Filename prefix <span>optional</span>
                  </label>
                  <input
                    className="text-input"
                    id="prefix"
                    maxLength={40}
                    value={preset.prefix}
                    placeholder="e.g. summer-collection"
                    onChange={(e) => change({ prefix: e.target.value })}
                  />
                  <div className="included">
                    <span>
                      <Check size={13} /> Strip location & camera metadata
                    </span>
                    <span>
                      <Check size={13} /> Organize into format folders
                    </span>
                    <span>
                      <Check size={13} /> Generate responsive HTML
                    </span>
                  </div>
                  <button
                    type="button"
                    className="save-preset"
                    disabled={!settingsHealthy || !!validation}
                    onClick={() => {
                      setPresetName(
                        preset.name === PRESETS[0].name ? "" : preset.name,
                      );
                      setSaveError(null);
                      setSaveOpen(true);
                    }}
                  >
                    <Save size={14} /> Save as a new preset
                  </button>
                </section>
              </fieldset>
              <div className="export-action">
                {validation && (
                  <p className="validation" role="alert">
                    {validation}
                  </p>
                )}
                <div className="export-tally">
                  <span>
                    {selected.size} images{" "}
                    <span className="muted">· {bytes(totalBytes)}</span>
                  </span>
                  <strong>{outputs} outputs</strong>
                </div>
                <button
                  type="button"
                  className="button primary export-button"
                  disabled={!!busy || !selected.size || !!validation}
                  onClick={exportImages}
                >
                  {busy === "export" ? (
                    <LoaderCircle size={17} className="spin" />
                  ) : (
                    <ArrowDownToLine size={17} />
                  )}{" "}
                  {busy === "export"
                    ? "Preparing your assets…"
                    : "Export assets"}
                  <ArrowRight size={17} />
                </button>
                <p>You choose where they go. We handle the rest.</p>
              </div>
            </aside>
          </main>
        ) : (
          <main className="secondary-page">
            {view !== "settings" && (
              <>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setView("workspace")}
                >
                  <ArrowLeft size={16} /> Back to workspace
                </button>
                <div className="page-heading">
                  <div className="eyebrow">
                    {view === "presets"
                      ? "YOUR WORKFLOW, ON REPEAT"
                      : "A SMALL GUIDE TO LIGHTER WEBSITES"}
                  </div>
                  <h1>
                    {view === "presets"
                      ? "Set it once. Ship it often."
                      : "From folder to finished."}
                  </h1>
                  <p>
                    {view === "presets"
                      ? "Reliable starting points for every kind of project."
                      : "Three steps. Everything stays on your computer."}
                  </p>
                </div>
              </>
            )}
            {view === "settings" ? (
              <section className="settings-page">
                <div className="page-heading">
                  <div className="eyebrow">PIXfleet PREFERENCES</div>
                  <h1>Settings</h1>
                  <p>Appearance, updates, and ways to help improve PixFleet.</p>
                </div>
                <div className="settings-card">
                  <div className="settings-card-copy">
                    <h2>Appearance</h2>
                    <p>
                      Choose how PixFleet looks. System follows your device.
                    </p>
                  </div>
                  <ThemeToggle />
                </div>
                <div className="settings-card">
                  <div className="settings-card-copy">
                    <h2>Updates</h2>
                    <p>
                      {updateState === "available"
                        ? `Version ${latestVersion} is available on GitHub.`
                        : updateState === "up-to-date"
                          ? "You are running the latest version."
                          : updateState === "error"
                            ? "Could not check GitHub releases right now."
                            : "Check GitHub for the latest PixFleet release."}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="button secondary"
                    onClick={checkForUpdates}
                    disabled={updateState === "checking"}
                  >
                    {updateState === "checking"
                      ? "Checking…"
                      : "Check for updates"}
                  </button>
                </div>
                <div className="settings-card">
                  <div className="settings-card-copy">
                    <h2>Feedback</h2>
                    <p>Tell us what would make your image workflow better.</p>
                  </div>
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => setFeedbackOpen(true)}
                  >
                    Send feedback
                  </button>
                </div>
              </section>
            ) : view === "presets" ? (
              <>
                <div className="preset-grid">
                  {allPresets.map((p) => (
                    <article className="preset-tile" key={p.id}>
                      <div className="preset-tile-top">
                        <span className="preset-icon">
                          <Layers3 size={22} />
                        </span>
                        <span className="pill">
                          {PRESETS.some((b) => b.id === p.id)
                            ? "Built-in"
                            : "Saved locally"}
                        </span>
                      </div>
                      <h2>{p.name}</h2>
                      <p>
                        {p.formats.map((f) => f.toUpperCase()).join(" + ")} ·{" "}
                        {p.quality}% quality
                      </p>
                      <div className="width-chips">
                        {p.widths.map((w) => (
                          <span key={w}>{w}px</span>
                        ))}
                      </div>
                      <div className="preset-tile-bottom">
                        <button
                          type="button"
                          className="text-button"
                          disabled={!!busy}
                          onClick={() => {
                            setPreset({ ...p });
                            setView("workspace");
                          }}
                        >
                          Use preset <ArrowRight size={15} />
                        </button>
                        {!PRESETS.some((b) => b.id === p.id) && (
                          <button
                            type="button"
                            aria-label={`Delete ${p.name}`}
                            disabled={!!busy || saving || !settingsHealthy}
                            onClick={() => deletePreset(p.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
                <div className="tip">
                  <Sparkles size={18} />
                  <p>
                    Make a preset your own in Export settings, then choose{" "}
                    <strong>Save as a new preset</strong>.
                  </p>
                </div>
              </>
            ) : (
              <div className="guide-content">
                <article>
                  <span>01</span>
                  <div>
                    <h2>Bring your images</h2>
                    <p>
                      Choose files, add a folder (including subfolders), or drag
                      images into the desktop window. JPEG, PNG and static WebP
                      are supported. Each image can be up to 100 MB and 40
                      megapixels, with up to 500 images in a batch.
                    </p>
                  </div>
                </article>
                <article>
                  <span>02</span>
                  <div>
                    <h2>Make it fit your project</h2>
                    <p>
                      Pick a preset, choose WebP or AVIF, and adjust quality and
                      widths. Images keep their proportions and are never
                      enlarged. AVIF takes longer to encode; WebP is a good
                      everyday choice. Both formats preserve transparency.
                    </p>
                  </div>
                </article>
                <article>
                  <span>03</span>
                  <div>
                    <h2>Export. Copy. Ship.</h2>
                    <p>
                      Choose a destination. PixFleet creates a new folder
                      containing your images, an HTML file, and a manifest. Add
                      descriptive alt text and adjust the HTML sizes attribute
                      to match your site. For hero images, replace lazy loading
                      with eager loading.
                    </p>
                  </div>
                </article>
                <div className="guide-callout">
                  <ShieldCheck size={24} />
                  <div>
                    <h3>A few useful details</h3>
                    <p>
                      Originals stay untouched. Re-encoding removes source
                      metadata and applies photo orientation. Exports may be
                      larger when you generate multiple sizes. Use sRGB
                      originals for predictable colors; wide-gamut profiles are
                      not preserved. Animation, SVG, HEIC, RAW and AVIF inputs
                      are not supported in this version.
                    </p>
                    <p>
                      Cancel safely between outputs. An active encoder finishes
                      before cancellation; incomplete batch files are then
                      removed.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </main>
        )}
      </div>

      {notice && (
        <div className="toast" role="status">
          <CheckCheck size={18} />
          <span>{notice}</span>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => setNotice(null)}
          >
            <X size={15} />
          </button>
        </div>
      )}
      {saveOpen && (
        <Modal
          title="Save your workflow"
          onClose={() => {
            if (!saving) setSaveOpen(false);
          }}
        >
          <p className="modal-description">
            Keep these settings ready for your next project.
          </p>
          {saveError && (
            <p className="issues" role="alert">
              {saveError}
            </p>
          )}
          <label className="input-label" htmlFor="preset-name">
            Preset name
          </label>
          <input
            id="preset-name"
            className="text-input"
            maxLength={80}
            placeholder="e.g. Acme client website"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && presetName.trim() && !saving)
                savePreset();
            }}
          />
          <div className="modal-actions">
            <button
              type="button"
              className="button secondary"
              disabled={saving}
              onClick={() => setSaveOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="button primary"
              disabled={!presetName.trim() || saving}
              onClick={savePreset}
            >
              <Save size={16} />
              {saving ? "Saving…" : "Save preset"}
            </button>
          </div>
        </Modal>
      )}
      {feedbackOpen && (
        <Modal title="Share feedback" onClose={() => setFeedbackOpen(false)}>
          <p className="modal-description">
            Your feedback helps shape the next PixFleet release.
          </p>
          <label className="input-label" htmlFor="feedback-message">
            What should we improve?
          </label>
          <textarea
            id="feedback-message"
            className="text-input feedback-input"
            placeholder="Tell us what would make PixFleet better…"
            rows={6}
          />
          <div className="modal-actions">
            <button
              type="button"
              className="button secondary"
              onClick={() => setFeedbackOpen(false)}
            >
              Close
            </button>
            <button
              type="button"
              className="button primary"
              onClick={() =>
                window.open(
                  "https://github.com/GolamRafi27oo/PixFleet/issues/new",
                  "_blank",
                  "noopener,noreferrer",
                )
              }
            >
              Open GitHub feedback
            </button>
          </div>
        </Modal>
      )}
      {result && (
        <Modal title="Your assets are ready." onClose={() => setResult(null)}>
          <div className="success-mark">
            <Check size={28} />
          </div>
          <p className="modal-description">
            {result.images} images became {result.files} website-ready assets.
          </p>
          <div className="result-stats">
            <div>
              <small>Originals</small>
              <strong>{bytes(result.inputBytes)}</strong>
            </div>
            <ArrowRight size={20} />
            <div>
              <small>All output sizes</small>
              <strong>{bytes(result.outputBytes)}</strong>
            </div>
          </div>
          <p className="output-path">
            <Folder size={17} />
            <span>{result.directory}</span>
          </p>
          {result.errors.length > 0 && (
            <div className="issues">
              <strong>{result.errors.length} images skipped</strong>
              <ul>
                {result.errors.map((e, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: Export errors are an immutable snapshot with possible duplicates.
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}
          <details className="snippet">
            <summary>
              <Code2 size={16} /> Responsive HTML <ChevronDown size={15} />
            </summary>
            <pre>{result.html}</pre>
          </details>
          <p className="field-hint">
            Also saved as images.html. Add alt text and adjust sizes for your
            layout.
          </p>
          <div className="modal-actions">
            <button
              type="button"
              className="button secondary"
              onClick={() => setResult(null)}
            >
              Done
            </button>
            <button
              type="button"
              className="button primary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(result.html);
                  setCopied(true);
                } catch {
                  setNotice(
                    "Clipboard unavailable. Open images.html in your export folder to copy the snippets.",
                  );
                }
              }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}{" "}
              {copied ? "Copied!" : "Copy HTML"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Benefit({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <article className="benefit">
      <span>{icon}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    dialog?.querySelector("input")?.focus();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="modal-heading">
        <h2>{title}</h2>
        <button type="button" aria-label="Close dialog" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
