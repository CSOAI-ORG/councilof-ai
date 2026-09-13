#!/usr/bin/env python3
"""art50_census adapter test — plain python, no network.

Fixtures are written into a temp dir; the adapter is a pure file reader.
Checks: leaf shape, canonical payload cap, ABSENT on missing file, INVALID (never
raise) on malformed input, and the forbidden-word doctrine regex (zero hits).

Run:  python3 scripts/test_art50_census_adapter.py   (or pytest, if installed)
"""
from __future__ import annotations

import json
import re
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(ROOT / "scripts"))
from adapters import art50_census  # noqa: E402

FORBIDDEN = re.compile(
    r"\b(oracle|risk|risky|safe|unsafe|compliant|non-compliant|rating|ratings)\b|(?<!UN)MEASURED",
    re.I,
)
# Census, never a conformity opinion: no EU-Article verdict vocabulary.
VERDICT = re.compile(
    r"\b(conformity|conforms|conform|nonconformity|verdict|grade|graded|grading|certified|certificate|pass|fail)\b",
    re.I,
)


def _fixture_census() -> dict:
    def entry(stated, detectable):
        return {"stated": stated, "detectable": detectable, "source": None}

    return {
        "schema": "csoai.art50-marking-census/0.1",
        "generated_at": "2026-09-12T00:00:00Z",
        "doctrine": "stated ≠ detectable; both recorded; UNMEASURED never zero-filled",
        "generators": [
            {
                "name": "FixtureGen",
                "scope": "text",
                "marking": {
                    "c2pa_manifest": entry(True, "UNMEASURED"),
                    "iptc_or_metadata_marking": entry(None, "UNMEASURED"),
                    "invisible_watermark": entry(True, "UNMEASURED"),
                    "visible_or_disclosure_marking": entry(None, "UNMEASURED"),
                },
                "sources": [],
                "unmeasured": ["C2PA probe on samples"],
            },
            {
                "name": "Midjourney",
                "scope": "image",
                "marking": {
                    "c2pa_manifest": entry(None, "UNMEASURED"),
                    "iptc_or_metadata_marking": entry(None, "UNMEASURED"),
                    "invisible_watermark": entry(None, "UNMEASURED"),
                    "visible_or_disclosure_marking": entry(None, "UNMEASURED"),
                },
                "sources": [],
                "gate": "sample generation requires owner account — owner gate",
                "unmeasured": ["sample generation (owner account required)"],
            },
        ],
    }


def _write_fixture(root: Path, census: dict) -> Path:
    path = root / art50_census.REL
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(census, ensure_ascii=False, indent=2))
    return path


def _forbidden_in(obj) -> list[str]:
    blob = json.dumps(obj, ensure_ascii=False)
    hits = {m.group(0) for m in FORBIDDEN.finditer(blob)}
    hits |= {m.group(0) for m in VERDICT.finditer(blob)}
    return sorted(hits)


def test_leaf_shape_and_cap() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        _write_fixture(root, _fixture_census())
        out = art50_census.collect(root)
        assert len(out["leaves"]) == 1, out
        assert out["sidecar"]["status"] == "PROBED", out
        leaf = out["leaves"][0]
        assert leaf["surface"] == "public.notice"
        payload = leaf["payload"]
        assert payload["kind"] == "csoai.art50-marking-census/0.1"
        assert payload["status"] == "PROBED"
        assert payload["release_id"] == "art50-census-2026-09"
        assert payload["n_generators"] == 2
        assert payload["midjourney_gate"] is True
        assert payload["endpoint"] == "/interop/art50-census-2026-09/endpoint.json"
        compact = {row["name"]: row["stack"] for row in payload["per_generator_compact"]}
        assert compact["FixtureGen"] == "C2PA?/meta—/wm?/vis—", compact
        assert compact["Midjourney"] == "C2PA—/meta—/wm—/vis—", compact
        blob = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
        assert len(blob) <= 3072, len(blob)
        assert _forbidden_in(out) == [], _forbidden_in(out)


def test_absent_is_not_a_failure() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        out = art50_census.collect(Path(tmp))
        assert out == {"leaves": [], "sidecar": {"status": "ABSENT", "path": str(art50_census.REL)}}, out
        assert _forbidden_in(out) == []


def test_never_raises_on_garbage() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        path = root / art50_census.REL
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(b"\x00\xff not json at all")
        out = art50_census.collect(root)
        assert out["leaves"] == []
        assert out["sidecar"]["status"] == "INVALID"
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        _write_fixture(root, {"schema": "wrong", "generators": "nope"})
        out = art50_census.collect(root)
        assert out["leaves"] == []
        assert out["sidecar"]["status"] == "INVALID"
    # A repo root that is a file, not a directory: still no raise.
    with tempfile.TemporaryDirectory() as tmp:
        weird = Path(tmp) / "not-a-dir"
        weird.write_text("x")
        out = art50_census.collect(weird)
        assert out["leaves"] == []
        assert out["sidecar"]["status"] in {"ABSENT", "INVALID"}


def test_slot_glyphs_cover_detectable_true_and_false() -> None:
    census = _fixture_census()
    marking = census["generators"][0]["marking"]
    marking["c2pa_manifest"] = {"stated": True, "detectable": True, "source": None}
    marking["iptc_or_metadata_marking"] = {"stated": True, "detectable": False, "source": None}
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        _write_fixture(root, census)
        out = art50_census.collect(root)
        compact = {r["name"]: r["stack"] for r in out["leaves"][0]["payload"]["per_generator_compact"]}
        assert compact["FixtureGen"] == "C2PA✓/meta✗/wm?/vis—", compact
        assert _forbidden_in(out) == []


def test_shipped_census_file_collects_and_stays_clean() -> None:
    shipped = ROOT / art50_census.REL
    if not shipped.is_file():
        return  # worktree without the pack: nothing to check
    out = art50_census.collect(ROOT)
    assert len(out["leaves"]) == 1, out
    payload = out["leaves"][0]["payload"]
    names = [r["name"] for r in payload["per_generator_compact"]]
    assert names == ["Anthropic", "OpenAI", "Google", "Midjourney"], names
    assert payload["n_generators"] == 4
    assert payload["midjourney_gate"] is True
    blob = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    assert len(blob) <= 3072, len(blob)
    assert _forbidden_in(out) == [], _forbidden_in(out)


def test_source_version_digest_fails_closed() -> None:
    census = _fixture_census()
    census["schema"] = "csoai.art50-marking-census/0.2"
    census["generators"][0]["source_version"] = {
        "posture_card": "evidence/card.json",
        "sha256": "0" * 64,
    }
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        evidence = root / "evidence/card.json"
        evidence.parent.mkdir(parents=True)
        evidence.write_text("{}")
        _write_fixture(root, census)
        out = art50_census.collect(root)
        assert out["leaves"] == []
        assert out["sidecar"] == {"status": "INVALID", "reason": "source_version digest mismatch"}


if __name__ == "__main__":
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    for fn in tests:
        fn()
        print(f"ok {fn.__name__}")
    print(f"{len(tests)} tests passed")
