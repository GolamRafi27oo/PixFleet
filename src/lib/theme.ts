export type Theme = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "pixfleet.theme";

export function readTheme(value: string | null | undefined): Theme {
  return value === "light" || value === "dark" ? value : "system";
}

// Static, trusted code runs before paint. CSS resolves System without JavaScript
// and keeps following OS changes while an explicit choice overrides them.
export const THEME_INIT_SCRIPT = `(()=>{try{const t=localStorage.getItem("${THEME_STORAGE_KEY}");document.documentElement.dataset.theme=t==="light"||t==="dark"?t:"system"}catch{}})()`;
