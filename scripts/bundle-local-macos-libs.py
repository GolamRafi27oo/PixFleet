"""Embed Homebrew dylibs in a local .app and re-sign it before local testing.

Use on a newly built local app, before creating any archive or installer.
Release CI uses statically linked codecs instead.
"""

import argparse
import platform
import shutil
import subprocess
from pathlib import Path


def run(*args):
    return subprocess.check_output(args, text=True).strip()


def dependencies(binary):
    return [line.strip().split(" (compatibility", 1)[0]
            for line in run("otool", "-L", str(binary)).splitlines()[1:]]


def is_system(path):
    return path.startswith(("/usr/lib/", "/System/Library/"))


def bundle(app):
    binary = app / "Contents/MacOS/pixfleet"
    frameworks = app / "Contents/Frameworks"
    if not binary.is_file():
        raise RuntimeError(f"PixFleet executable not found: {binary}")
    # Discover everything before modifying the app. Never change Homebrew files.
    libraries = {}
    queue = [binary]
    while queue:
        source = queue.pop()
        for dependency in dependencies(source):
            if is_system(dependency):
                continue
            if dependency.startswith("@executable_path/../Frameworks/"):
                continue
            path = Path(dependency)
            if not path.is_absolute() or path.suffix != ".dylib" or not path.is_file():
                raise RuntimeError(f"Unsupported or missing library: {dependency}")
            if dependency in libraries:
                continue
            if any(p.name == path.name and p.resolve() != path.resolve() for p in libraries.values()):
                raise RuntimeError(f"Conflicting library name: {path.name}")
            libraries[dependency] = path
            queue.append(path)
    frameworks.mkdir(parents=True, exist_ok=True)
    for source in libraries.values():
        shutil.copy2(source, frameworks / source.name)
    targets = [binary] + sorted(frameworks.glob("*.dylib"))
    for target in targets:
        for dependency in dependencies(target):
            if dependency in libraries:
                replacement = f"@executable_path/../Frameworks/{libraries[dependency].name}"
                run("install_name_tool", "-change", dependency, replacement, str(target))
        if target != binary:
            run("install_name_tool", "-id", f"@executable_path/../Frameworks/{target.name}", str(target))
            run("codesign", "--force", "--sign", "-", str(target))
    # Local ad-hoc builds have no Apple Team ID for hardened library validation.
    # This changes only this app; release signing remains configured separately.
    run("codesign", "--force", "--sign", "-", "--options", "0", str(binary))
    run("codesign", "--force", "--sign", "-", "--options", "0", str(app))
    run("codesign", "--verify", "--deep", "--strict", str(app))
    for target in targets:
        for dependency in dependencies(target):
            if dependency.startswith("@executable_path/../Frameworks/") and not (frameworks / Path(dependency).name).is_file():
                raise RuntimeError(f"Missing bundled library: {dependency}")
            if not is_system(dependency) and not dependency.startswith("@executable_path/../Frameworks/"):
                raise RuntimeError(f"External dependency remains: {dependency}")
    print(f"Verified app with {len(libraries)} bundled libraries: {app}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("app", type=Path)
    args = parser.parse_args()
    if platform.system() != "Darwin":
        parser.error("This helper requires macOS")
    bundle(args.app.resolve())
