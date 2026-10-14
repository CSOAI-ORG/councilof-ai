#!/usr/bin/env python3
"""data/v1 feed written by publish_public_root.py: byte-copies, add-only CHANGELOG, null DOI."""
from __future__ import annotations

import hashlib
import json
import shutil
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import publish_public_root as ppr  # noqa: E402


def _tree(tmp: Path) -> Path:
    for _, rel in ppr.DATA_V1_SOURCES:
        src = ROOT / rel
        if src.exists():
            (tmp / rel).parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(src, tmp / rel)
    return tmp


def test_snapshot_is_byte_copy_and_idempotent(tmp_path: Path) -> None:
    base = _tree(tmp_path)
    e = ppr.write_data_v1_snapshot(base)
    assert e is not None
    snap = base / "public/data/v1/snapshots" / e["version"]
    man = json.loads((snap / "manifest.json").read_text())
    for f in man["files"]:
        b = (snap / f["name"]).read_bytes()
        assert b == (ROOT / f["source"]).read_bytes()
        assert hashlib.sha256(b).hexdigest() == f["sha256"]
    cit = json.loads((snap / "citation.json").read_text())
    assert cit["doi"] is None and cit["merkle_root"] == e["merkle_root"]
    assert "certif" not in cit["preferred_citation"].lower()
    latest = json.loads((base / "public/data/v1/latest.json").read_text())
    assert latest["version"] == e["version"]
    assert ppr.write_data_v1_snapshot(base) is None  # same root -> no new entry


def test_new_root_appends_and_never_rewrites(tmp_path: Path) -> None:
    base = _tree(tmp_path)
    first = ppr.write_data_v1_snapshot(base)
    rp = base / "public/root.json"
    r = json.loads(rp.read_text())
    r["merkle_root"] = "00" * 32
    r["card_count"] += 1
    rp.write_text(json.dumps(r, indent=2) + "\n")
    second = ppr.write_data_v1_snapshot(base)
    assert second["version"] == first["version"] + ".2"
    assert second["card_count_delta"] == 1
    cl = json.loads((base / "public/data/v1/CHANGELOG.json").read_text())["entries"]
    assert cl[0] == first and cl[1] == second


def test_append_only_guard_rejects_rewrite_and_removal() -> None:
    a = [{"version": "x", "merkle_root": "aa"}]
    ppr.assert_changelog_append_only(a, a + [{"version": "y"}])
    with pytest.raises(ValueError):
        ppr.assert_changelog_append_only(a, [{"version": "x", "merkle_root": "bb"}])
    with pytest.raises(ValueError):
        ppr.assert_changelog_append_only(a, [])


def test_never_snapshots_signed_index() -> None:
    assert not any(rel.startswith("public/signed/") for _, rel in ppr.DATA_V1_SOURCES)


def test_no_bare_directory_urls(tmp_path: Path) -> None:
    """scripts/link-gate.mjs fails a directory URL with no index file; publish files only."""
    import re
    base = _tree(tmp_path)
    ppr.write_data_v1_snapshot(base)
    for f in (base / "public/data/v1").rglob("*.json"):
        if f.parent.name == "2026-10-13" and f.name not in ("manifest.json", "citation.json"):
            continue  # byte-copies of sources, not authored here
        for u in re.findall(r"https://councilof\.ai/data/v1[^\"\s)]*", f.read_text()):
            assert not u.endswith("/"), (f, u)
