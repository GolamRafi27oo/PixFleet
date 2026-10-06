import { useCallback, useEffect, useRef, useState } from "react";
import { APP_VERSION } from "@/lib/app-info";
import {
  compareVersions,
  latestStableVersion,
  RELEASES_URL,
} from "@/lib/releases";

type UpdateState =
  | "idle"
  | "checking"
  | "up-to-date"
  | "available"
  | "no-release"
  | "error";

export function useUpdateCheck() {
  const [updateState, setUpdateState] = useState<UpdateState>("idle");
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);

  const checkForUpdates = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const timeout = setTimeout(() => controller.abort(), 10_000);
    setUpdateState("checking");
    try {
      const response = await fetch(RELEASES_URL, {
        headers: { Accept: "application/vnd.github+json" },
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("GitHub release lookup failed");
      const latest = latestStableVersion(await response.json());
      if (request.current !== controller) return;
      setLatestVersion(latest);
      setUpdateState(
        latest === null
          ? "no-release"
          : compareVersions(latest, APP_VERSION) > 0
            ? "available"
            : "up-to-date",
      );
    } catch {
      if (request.current === controller) setUpdateState("error");
    } finally {
      clearTimeout(timeout);
      if (request.current === controller) request.current = null;
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

  return { updateState, latestVersion, checkForUpdates };
}
