import { beforeEach, describe, expect, it } from "vitest";
import { bytes, PRESETS, type Preset, validatePreset } from "./model";

describe("Given a website export preset", () => {
  let preset: Preset;
  beforeEach(() => {
    preset = structuredClone(PRESETS[0]);
  });
  it("When all output formats are deselected then export is rejected", () => {
    preset.formats = [];
    expect(validatePreset(preset)).toBe("Choose at least one output format.");
  });
  it("When responsive widths repeat then export is rejected", () => {
    preset.widths = [640, 640];
    expect(validatePreset(preset)).toBe("Output widths must be unique.");
  });
  it("When a width is empty then export is rejected", () => {
    preset.widths = [0];
    expect(validatePreset(preset)).toContain("16 and 8192");
  });
  it("When a width contains a fraction then export is rejected", () => {
    preset.widths = [640.5];
    expect(validatePreset(preset)).not.toBeNull();
  });
  it("When quality exceeds the codec range then export is rejected", () => {
    preset.quality = 101;
    expect(validatePreset(preset)).toContain("1 and 100");
  });
  it("When valid settings are submitted then export is allowed", () => {
    expect(validatePreset(preset)).toBeNull();
  });
});

describe("Given measured file sizes", () => {
  it("When the selection is empty then the summary shows zero bytes", () => {
    expect(bytes(0)).toBe("0 B");
  });
  it("When files exceed one megabyte then the summary uses MB", () => {
    expect(bytes(1572864)).toBe("1.5 MB");
  });
});
