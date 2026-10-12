import { describe, expect, it } from "vitest";
import { compareVersions, latestStableVersion } from "./releases";

describe("Given stable application and release versions", () => {
  it.each([
    ["0.1.0", "0.2.0", -1],
    ["v0.2.0", "0.2.0", 0],
    ["0.10.0", "0.9.0", 1],
    ["1.0.0", "0.99.99", 1],
    ["0.2.1", "0.2.0", 1],
  ])(
    "When comparing %s to %s then the ordering is %s",
    (latest, current, expected) => {
      expect(compareVersions(latest, current)).toBe(expected);
    },
  );
  it("When a non-version is compared then it is rejected", () => {
    expect(() => compareVersions("release", "0.2.0")).toThrow(
      "Invalid release version",
    );
  });
});

describe("Given a GitHub releases response", () => {
  it("When stable releases arrive out of order then the highest version is selected", () => {
    const result = latestStableVersion([
      { tag_name: "v0.9.0", draft: false, prerelease: false },
      { tag_name: "v0.10.0", draft: false, prerelease: false },
      { tag_name: "v0.8.0", draft: false, prerelease: false },
    ]);
    expect(result).toBe("0.10.0");
  });
  it("When only unpublished or unstable tags exist then there is no stable release", () => {
    const result = latestStableVersion([
      { tag_name: "v2.0.0", draft: true, prerelease: false },
      { tag_name: "v1.0.0-beta.1", draft: false, prerelease: true },
      { tag_name: "nightly", draft: false, prerelease: false },
    ]);
    expect(result).toBeNull();
  });
  it("When the repository has no releases then there is no stable release", () => {
    expect(latestStableVersion([])).toBeNull();
  });
  it.each([{}, null, [{ tag_name: 123 }]])(
    "When the response is malformed then it cannot report up to date",
    (payload) => {
      expect(() => latestStableVersion(payload)).toThrow(
        "Invalid release response",
      );
    },
  );
});
