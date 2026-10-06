import packageInfo from "../../package.json";

export const APP_VERSION = packageInfo.version;
export type View = "workspace" | "presets" | "guide" | "settings";
export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);
