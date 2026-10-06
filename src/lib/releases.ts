export const RELEASES_URL =
  "https://api.github.com/repos/GolamRafi27oo/PixFleet-releases/releases?per_page=20";

/** Compare stable release versions numerically, including optional v prefixes. */
export function compareVersions(left: string, right: string): number {
  const parse = (version: string) => {
    const match = /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(version);
    if (!match) throw new Error("Invalid release version");
    return match.slice(1).map(BigInt);
  };
  const a = parse(left);
  const b = parse(right);
  for (let index = 0; index < a.length; index++) {
    if (a[index] > b[index]) return 1;
    if (a[index] < b[index]) return -1;
  }
  return 0;
}

/** Ignore drafts, prereleases, and tags that are not stable semantic versions. */
export function latestStableVersion(payload: unknown): string | null {
  if (!Array.isArray(payload)) throw new Error("Invalid release response");
  let latest: string | null = null;
  for (const release of payload) {
    if (
      !release ||
      typeof release !== "object" ||
      typeof release.tag_name !== "string" ||
      typeof release.draft !== "boolean" ||
      typeof release.prerelease !== "boolean"
    ) {
      throw new Error("Invalid release response");
    }
    if (release.draft || release.prerelease) continue;
    const version = release.tag_name.replace(/^v/, "");
    if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)) continue;
    if (latest === null || compareVersions(version, latest) > 0)
      latest = version;
  }
  return latest;
}
