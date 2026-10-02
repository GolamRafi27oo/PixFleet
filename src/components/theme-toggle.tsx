"use client";

import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { readTheme, THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

const options = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
] as const;

function syncNativeTheme(theme: Theme) {
  if (!isTauri()) return;
  // null restores native OS appearance tracking, including the macOS title bar.
  void getCurrentWindow()
    .setTheme(theme === "system" ? null : theme)
    .catch((error: unknown) => {
      console.error("Could not update native window appearance", error);
    });
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const initial = readTheme(document.documentElement.dataset.theme);
    setTheme(initial);
    syncNativeTheme(initial);
    const sync = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY && event.key !== null) return;
      const next = readTheme(event.newValue);
      document.documentElement.dataset.theme = next;
      setTheme(next);
      syncNativeTheme(next);
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const selectTheme = (next: Theme) => {
    document.documentElement.dataset.theme = next;
    setTheme(next);
    syncNativeTheme(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // The choice still applies for this session when storage is unavailable.
    }
  };

  return (
    <fieldset className="theme-toggle" aria-label="Appearance">
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          aria-label={`${label} theme`}
          aria-pressed={theme === value}
          title={
            value === "system" ? "Use system appearance" : `${label} theme`
          }
          onClick={() => selectTheme(value)}
        >
          <Icon size={14} aria-hidden="true" />
          <span>{label}</span>
        </button>
      ))}
    </fieldset>
  );
}
