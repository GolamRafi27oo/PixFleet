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
# vcpkg-rs 0.2.15 (used by libheif-sys on Windows) only searches
# VCPKG_ROOT/installed; it does not support VCPKG_INSTALLED_ROOT.
install = vcpkg / "installed"
subprocess.run([
    str(vcpkg / ("vcpkg.exe" if system == "Windows" else "vcpkg")),
    "install", f"--triplet={triplet}",
    f"--x-manifest-root={root / 'src-tauri'}", f"--x-install-root={install}",
    "--disable-metrics",
], check=True, cwd=root)
required_paths = [
    install / "vcpkg" / "updates",
    install / triplet / "include" / "libheif" / "heif.h",
    install / triplet / "lib",
]
for path in required_paths:
    if not path.exists():
        raise RuntimeError(f"Native codec installation is incomplete: missing {path}")
database = install / "vcpkg"
if not (database / "status").is_file() and not any((database / "updates").iterdir()):
    raise RuntimeError(f"Native codec installation has no package status records: {database}")
values = {
    "VCPKG_ROOT": str(vcpkg),
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
