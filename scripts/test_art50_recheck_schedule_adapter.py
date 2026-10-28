#!/usr/bin/env python3
"""art50_recheck_schedule adapter test — plain python, no network.

Fixtures are written into a temp dir; the adapter is a pure file reader.
Checks: leaf shape, canonical payload cap, ABSENT on missing file, INVALID
(never raise) on malformed input, the forbidden-word doctrine regex (zero
hits), and the schedule's own contract with its pinned input — including the
case where the pinned census bytes have changed under the schedule.

Run:  python3 scripts/test_art50_recheck_schedule_adapter.py   (or pytest, if installed)
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
from adapters import art50_recheck_schedule  # noqa: E402

FORBIDDEN = re.compile(
    r"\b(oracle|risk|risky|safe|unsafe|compliant|non-compliant|rating|ratings)\b|(?<!UN)MEASURED",
    re.I,
)
# A schedule of readings, never a conformity opinion: no verdict vocabulary.
VERDICT = re.compile(
    r"\b(conformity|conforms|conform|nonconformity|verdict|grade|graded|grading|certified|certificate|pass|fail)\b",
    re.I,
)

SCHEMA = {
    "schema": "csoai.art50-recheck-schedule/0.1",
    "release_id": "art50-recheck-schedule-2026-10",
    "generated_at": "2026-10-26T03:40:00Z",
    "law": {"regulation_applies_from": "2026-08-02", "pre_existing_systems_until": "2026-12-02"},
    "inputs": {
        "census_release_id": "art50-census-2026-09",
        "census_path": "public/interop/art50-census-2026-09/census.json",
        "census_sha256": "a" * 64,
    },
    "points": [
        {"id": "p1", "due": "2026-10-30", "note": "a note", "why": "the long reason"},
        {"id": "p2", "due": "2026-12-02", "note": "another note", "recurs": "quarterly"},
    ],
    "triggers": [{"id": "t1", "rule": "a rule"}],
    "limitations": ["a limitation"],
}


def _write(root: Path, schedule: dict, census_bytes: bytes = b"{}") -> None:
    sdir = root / "public" / "interop" / "art50-recheck-schedule-2026-10"
    sdir.mkdir(parents=True, exist_ok=True)
    (sdir / "schedule.json").write_text(json.dumps(schedule), encoding="utf-8")
    cdir = root / "public" / "interop" / "art50-census-2026-09"
    cdir.mkdir(parents=True, exist_ok=True)
    (cdir / "census.json").write_bytes(census_bytes)


def _collect(root: Path) -> dict:
    return art50_recheck_schedule.collect(root)


def test_absent_when_the_schedule_file_is_missing():
    with tempfile.TemporaryDirectory() as d:
        out = _collect(Path(d))
        assert out["leaves"] == []
        assert out["sidecar"]["status"] == "ABSENT"


def test_leaf_shape_and_payload_cap():
    import hashlib
    with tempfile.TemporaryDirectory() as d:
        root = Path(d)
        _write(root, SCHEMA)
        out = _collect(root)
        assert out["sidecar"]["status"] == "PROBED", out["sidecar"]
        assert len(out["leaves"]) == 1
        leaf = out["leaves"][0]
        assert leaf["surface"] == "public.notice"
        assert leaf["subject"] and leaf["as_of"]
        assert all(u.startswith("https://") for u in leaf["source_urls"])
        assert leaf["tags"] and "art50" in leaf["tags"]
        canon = json.dumps(leaf["payload"], sort_keys=True, separators=(",", ":"),
                           ensure_ascii=False).encode("utf-8")
        assert len(canon) <= 3072, len(canon)
        assert out["sidecar"]["payload_bytes"] == len(canon)


def test_invalid_on_malformed_input_and_never_raises():
    for bad in ({"schema": "wrong/1.0"}, {"schema": SCHEMA["schema"]},
                dict(SCHEMA, points=[]), dict(SCHEMA, points=[{"id": "x"}]),
                dict(SCHEMA, points=[{"id": "x", "due": "not-a-date", "note": "n"}]),
                dict(SCHEMA, triggers=[]), dict(SCHEMA, limitations=[])):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            _write(root, bad)
            out = _collect(root)
            assert out["leaves"] == [], bad
            assert out["sidecar"]["status"] == "INVALID", (bad, out["sidecar"])


def test_a_malformed_pinned_digest_is_invalid():
    with tempfile.TemporaryDirectory() as d:
        root = Path(d)
        bad = json.loads(json.dumps(SCHEMA))
        bad["inputs"]["census_sha256"] = "not-a-digest"
        _write(root, bad)
        out = _collect(root)
        assert out["leaves"] == []
        assert out["sidecar"]["status"] == "INVALID"
        assert "digest" in out["sidecar"]["reason"]


def test_the_pinned_census_must_exist():
    with tempfile.TemporaryDirectory() as d:
        root = Path(d)
        sdir = root / "public" / "interop" / "art50-recheck-schedule-2026-10"
        sdir.mkdir(parents=True, exist_ok=True)
        (sdir / "schedule.json").write_text(json.dumps(SCHEMA), encoding="utf-8")
        out = _collect(root)
        assert out["leaves"] == []
        assert out["sidecar"]["status"] == "INVALID"


def test_inputs_changed_when_the_census_bytes_move_under_the_schedule():
    """The schedule is a schedule FOR a particular input."""
    import hashlib
    with tempfile.TemporaryDirectory() as d:
        root = Path(d)
        census_bytes = b'{"generators": []}'
        sched = json.loads(json.dumps(SCHEMA))
        sched["inputs"]["census_sha256"] = hashlib.sha256(census_bytes).hexdigest()
        _write(root, sched, census_bytes)
        out = _collect(root)
        assert out["sidecar"]["status"] == "PROBED", out["sidecar"]
        assert out["sidecar"]["inputs_changed"] is False
        assert out["leaves"][0]["payload"]["inputs"]["inputs_changed"] is False

        # Now move the census bytes.
        _write(root, sched, b'{"generators": [{"name": "x"}]}')
        out = _collect(root)
        assert out["sidecar"]["status"] == "PROBED"
        assert out["sidecar"]["inputs_changed"] is True
        assert out["leaves"][0]["payload"]["inputs"]["inputs_changed"] is True


def test_no_forbidden_and_no_verdict_words():
    with tempfile.TemporaryDirectory() as d:
        root = Path(d)
        _write(root, SCHEMA)
        out = _collect(root)
        blob = json.dumps(out["leaves"][0], ensure_ascii=False)
        for m in FORBIDDEN.finditer(blob):
            raise AssertionError(f"forbidden word {m.group(0)!r} in the leaf")
        for m in VERDICT.finditer(blob):
            raise AssertionError(f"verdict word {m.group(0)!r} in the leaf")


def test_the_leaf_says_it_is_not_a_compliance_calendar():
    with tempfile.TemporaryDirectory() as d:
        root = Path(d)
        _write(root, SCHEMA)
        out = _collect(root)
        payload = out["leaves"][0]["payload"]
        assert payload["not_a_compliance_calendar"] is True
        assert payload["first_reading_taken"] is False
        assert payload["status"] == "PROBED"


if __name__ == "__main__":
    for name, fn in sorted(list(globals().items())):
        if name.startswith("test_") and callable(fn):
            fn()
            print(f"ok  {name}")
    print("all art50_recheck_schedule adapter tests passed")
