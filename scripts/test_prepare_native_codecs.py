"""Check codec setup paths without downloading or compiling third-party code."""

import os
from pathlib import Path
import runpy
import shutil
import tempfile
import unittest
from unittest.mock import patch


class GivenCodecBuild(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / "project with spaces"
        script = self.root / "scripts" / "prepare-native-codecs.py"
        script.parent.mkdir(parents=True)
        shutil.copyfile(Path(__file__).with_name(script.name), script)
        self.script = script
        self.env_file = self.root / "github-env"
        self.env = {
            "GITHUB_ENV": str(self.env_file),
            "RUNNER_TEMP": str(self.root / "runner-temp"),
        }

    def test_when_installing_on_each_platform_then_consumers_find_the_packages(self):
        for system, machine, triplet in [
            ("Windows", "AMD64", "x64-windows-static-md"),
            ("Linux", "x86_64", "x64-linux"),
            ("Darwin", "arm64", "arm64-osx"),
            ("Darwin", "x86_64", "x64-osx"),
        ]:
            with self.subTest(system=system, machine=machine):
                with patch.dict(os.environ, self.env, clear=True), \
                     patch("platform.system", return_value=system), \
                     patch("platform.machine", return_value=machine), \
                     patch("subprocess.run", side_effect=install_fixture):
                    runpy.run_path(str(self.script), run_name="__main__")
                values = dict(line.split("=", 1) for line in self.env_file.read_text().splitlines())
                # vcpkg-rs 0.2.15's actual consumer layout, independent of --x-install-root.
                installed = Path(values["VCPKG_ROOT"]) / "installed"

                self.assertTrue((installed / "vcpkg" / "status").is_file())
                self.assertTrue((installed / "vcpkg" / "updates").is_dir())
                self.assertTrue((installed / triplet / "include" / "libheif" / "heif.h").is_file())
                self.assertEqual(values["VCPKGRS_TRIPLET"], triplet)
                self.assertEqual(Path(values["PKG_CONFIG_PATH"]), installed / triplet / "lib" / "pkgconfig")
                self.assertEqual(values["SYSTEM_DEPS_LIBHEIF_LINK"], "static")

    def test_when_install_reports_success_without_files_then_setup_fails_before_exporting_env(self):
        with patch.dict(os.environ, self.env, clear=True), \
             patch("platform.system", return_value="Windows"), \
             patch("subprocess.run"):
            with self.assertRaisesRegex(RuntimeError, "Native codec installation is incomplete"):
                runpy.run_path(str(self.script), run_name="__main__")

        self.assertFalse(self.env_file.exists())


def install_fixture(command, **_kwargs):
    if "install" not in command:
        return
    install = Path(next(arg.split("=", 1)[1] for arg in command if arg.startswith("--x-install-root=")))
    triplet = next(arg.split("=", 1)[1] for arg in command if arg.startswith("--triplet="))
    (install / "vcpkg" / "updates").mkdir(parents=True, exist_ok=True)
    (install / "vcpkg" / "status").write_text("fixture status")
    header = install / triplet / "include" / "libheif" / "heif.h"
    header.parent.mkdir(parents=True, exist_ok=True)
    header.touch()
    (install / triplet / "lib" / "pkgconfig").mkdir(parents=True, exist_ok=True)


if __name__ == "__main__":
    unittest.main()
