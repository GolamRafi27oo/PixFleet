import { check, type Update } from "@tauri-apps/plugin-updater";
import { useCallback, useEffect, useRef, useState } from "react";
import { APP_VERSION } from "@/lib/app-info";
import {
  compareVersions,
  latestStableRelease,
  latestStableVersion,
  RELEASES_PAGE,
  RELEASES_URL,
} from "@/lib/releases";

type UpdateState =
  | "idle"
  | "checking"
  | "up-to-date"
  | "available"
  | "no-release"
  | "error";
type UpdateProgress = "idle" | "downloading" | "installing" | "installed";

export function useUpdateCheck() {
  const [updateState, setUpdateState] = useState<UpdateState>("idle");
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [releaseUrl, setReleaseUrl] = useState(RELEASES_PAGE);
  const [updateProgress, setUpdateProgress] = useState<UpdateProgress>("idle");
  const [updateError, setUpdateError] = useState<string | null>(null);
  const pendingUpdate = useRef<Update | null>(null);
  const request = useRef<AbortController | null>(null);

  const checkForUpdates = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const timeout = setTimeout(() => controller.abort(), 10_000);
    setUpdateState("checking");
    setUpdateError(null);
    try {
      try {
        const nativeUpdate = await check();
        if (nativeUpdate) {
          pendingUpdate.current?.close();
          pendingUpdate.current = nativeUpdate;
          setLatestVersion(nativeUpdate.version);
          const url = nativeUpdate.rawJson.html_url;
          setReleaseUrl(typeof url === "string" ? url : RELEASES_PAGE);
          setUpdateState("available");
          return;
        }
      } catch {
        // Browser previews do not expose the native updater; use the public API below.
      }
      const response = await fetch(RELEASES_URL, {
        headers: { Accept: "application/vnd.github+json" },
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("GitHub release lookup failed");
      const payload = await response.json();
      const release = latestStableRelease(payload);
      const latest = release?.version ?? latestStableVersion(payload);
      if (request.current !== controller) return;
      setLatestVersion(latest);
      setReleaseUrl(release?.url ?? RELEASES_PAGE);
      setUpdateState(
        latest === null
          ? "no-release"
          : compareVersions(latest, APP_VERSION) > 0
            ? "available"
            : "up-to-date",
      );
    } catch (error) {
      if (request.current === controller) {
        setUpdateError(
          error instanceof Error ? error.message : "Update check failed",
        );
        setUpdateState("error");
      }
    } finally {
      clearTimeout(timeout);
      if (request.current === controller) request.current = null;
    }
  }, []);

  const installUpdate = useCallback(async () => {
    if (!pendingUpdate.current) return;
    setUpdateError(null);
    setUpdateProgress("downloading");
    try {
      await pendingUpdate.current.downloadAndInstall((event) => {
        if (event.event === "Finished") setUpdateProgress("installing");
      });
      setUpdateProgress("installed");
    } catch (error) {
      setUpdateProgress("idle");
      setUpdateError(
        error instanceof Error ? error.message : "Update installation failed",
      );
    }
  }, []);

  useEffect(() => {
    void checkForUpdates();
    return () => {
      const controller = request.current;
      request.current = null;
      controller?.abort();
    };
  }, [checkForUpdates]);

  return {
    updateState,
    latestVersion,
    releaseUrl,
    updateProgress,
    updateError,
    checkForUpdates,
    installUpdate,
  };
}
