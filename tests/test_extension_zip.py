"""The downloadable extension zip must be the extension folder's bytes, rebuilt deterministically."""
import importlib.util
import json
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("bez", ROOT / "scripts" / "build-extension-zip.py")
bez = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bez)


def test_zip_named_from_manifest_version_and_committed():
    v = json.loads((ROOT / "extensions/chrome-gspc-verify/manifest.json").read_text())["version"]
    assert bez.out_path().name == f"gspc-verify-{v}.zip"
    assert bez.out_path().exists(), "run python3 scripts/build-extension-zip.py"


def test_committed_zip_matches_a_rebuild():
    assert bez.out_path().read_bytes() == bez.build_bytes()


def test_zip_is_loadable_and_carries_no_tests():
    with zipfile.ZipFile(bez.out_path()) as z:
        names = z.namelist()
        assert "manifest.json" in names
        assert json.loads(z.read("manifest.json"))["manifest_version"] == 3
        assert not any(n.split("/")[0] in {"test", "fixtures", "scripts"} for n in names)
        for n in names:
            assert z.read(n) == (bez.EXT / n).read_bytes()


def test_readme_download_step_names_the_current_zip():
    readme = (bez.EXT / "README.md").read_text()
    assert f"https://councilof.ai/downloads/{bez.out_path().name}" in readme
