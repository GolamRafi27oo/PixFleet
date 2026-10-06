"""Build the pinned vcpkg HEIC dependency for self-contained desktop CI builds."""

import os
import platform
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[1]
system = platform.system()
triplet = {
    "Windows": "x64-windows-static-md",
    "Linux": "x64-linux",
    "Darwin": "arm64-osx" if platform.machine() == "arm64" else "x64-osx",
}[system]
vcpkg = root / ".vcpkg"
bootstrap = vcpkg / ("bootstrap-vcpkg.bat" if system == "Windows" else "bootstrap-vcpkg.sh")
subprocess.run([str(bootstrap), "-disableMetrics"], check=True, cwd=vcpkg)
install = Path(os.environ.get("RUNNER_TEMP", str(root / ".native"))) / "pixfleet-codecs"
subprocess.run([
    str(vcpkg / ("vcpkg.exe" if system == "Windows" else "vcpkg")),
    "install", f"--triplet={triplet}",
    f"--x-manifest-root={root / 'src-tauri'}", f"--x-install-root={install}",
    "--disable-metrics",
], check=True, cwd=root)
values = {
    "VCPKG_ROOT": str(vcpkg),
    "VCPKG_INSTALLED_ROOT": str(install),
    "VCPKGRS_TRIPLET": triplet,
    "PKG_CONFIG_PATH": str(install / triplet / "lib" / "pkgconfig"),
    "SYSTEM_DEPS_LIBHEIF_LINK": "static",
}
if "GITHUB_ENV" in os.environ:
    with open(os.environ["GITHUB_ENV"], "a", encoding="utf-8") as target:
        for key, value in values.items():
            target.write(f"{key}={value}\n")
else:
    for key, value in values.items():
        print(f"{key}={value}")
