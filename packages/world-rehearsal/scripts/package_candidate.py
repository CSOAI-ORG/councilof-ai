#!/usr/bin/env python3
"""Reproducible source ZIP with explicit sibling dependency; no stores or secrets."""
import argparse
import hashlib
import json
from pathlib import Path
import sys
import zipfile

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from check_upstreams import check
sys.path.insert(0, str(ROOT))
from rehearsal import VERSION


def package(output):
    check()
    source = [ROOT / name for name in ("LICENSE", "NOTICE", "README.md", "INTEGRATION.md", "UPSTREAMS.json", "QUALIFICATION.json", "main.py")]
    for folder, extensions in (("rehearsal", {".py"}), ("static", {".js", ".css", ".html"}),
                               ("scripts", {".py"}), ("tests", {".py", ".cjs"})):
        source.extend(p for p in (ROOT / folder).glob("*") if p.is_file() and p.suffix in extensions)
    manifest = json.loads((ROOT / "UPSTREAMS.json").read_text())
    source.extend(ROOT / p for p in manifest["files"])
    source.extend(ROOT.parent / "evidence-fabric" / name for name in (
        "event.py", "LICENSE", "schema/evidence-event-0.1.schema.json"))
    source.append(REPO / ".github/workflows/world-rehearsal-candidate.yml")
    for file in source:
        if not file.is_file():
            raise ValueError("Required source missing: " + str(file))
    entries = {file.relative_to(REPO).as_posix(): file.read_bytes() for file in sorted(set(source))}
    entries["SOURCE-MANIFEST.json"] = (json.dumps({
        "schema": "csoai.candidate-source/0.1", "package_version": VERSION,
        "base_commit": "ff0fbe8f3ad8aca4d02aa66d41e709b573ca091a",
        "state": "LOCAL_CANDIDATE", "deployed": False,
        "files": {p: hashlib.sha256(data).hexdigest() for p, data in entries.items()}
    }, indent=2) + "\n").encode()
    # Refuse overwriting an existing archive. Fixed timestamps yield reproducible bytes.
    with zipfile.ZipFile(output, "x", compression=zipfile.ZIP_DEFLATED) as archive:
        for name, data in sorted(entries.items()):
            info = zipfile.ZipInfo(name, date_time=(2026, 11, 8, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, data)
    print(json.dumps({"state": "SOURCE_PACKAGED", "files": len(entries),
                      "bytes": output.stat().st_size,
                      "sha256": hashlib.sha256(output.read_bytes()).hexdigest()}))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    package(parser.parse_args().output)
