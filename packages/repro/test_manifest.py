#!/usr/bin/env python3
"""Tests for the repro manifest. Run: python3 packages/repro/test_manifest.py"""
import hashlib
import json
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import manifest as repro


def test_absent_fields_are_uncheckable():
    m = repro.build({})
    assert m["n_uncheckable"] == 5
    for f in repro.FIELDS:
        assert m["fields"][f] == "UNCHECKABLE"
    print("ok: with no inputs, all five fields are UNCHECKABLE (never invented)")


def test_sha_recomputes_and_is_referenceable():
    m = repro.build({"seed": "1234", "harness_version": "owem@0.1"})
    body = {k: m[k] for k in m if k != "repro_manifest_sha256"}
    want = hashlib.sha256(repro.canonical(body)).hexdigest()
    assert m["repro_manifest_sha256"] == want
    assert repro.card_field(m) == {"repro_manifest_sha256": want}
    assert m["n_uncheckable"] == 3
    print("ok: repro_manifest_sha256 recomputes; card_field references it")


def test_reads_from_card_and_flags_win():
    card = {
        "id": "c" * 64,
        "payload": {"otel_trace_hash": "d" * 64, "dataset_hash": "e" * 64, "seed": "from-card"},
    }
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as fh:
        json.dump(card, fh)
        path = fh.name
    values = repro._from_card(path)
    assert values["trace_hash"] == "d" * 64
    assert values["dataset_hash"] == "e" * 64
    assert values["reproduces_card_sha256"] == "c" * 64
    m = repro.build(values)
    assert m["fields"]["trace_hash"] == "d" * 64
    assert m["fields"]["grader_version"] == "UNCHECKABLE"  # not in the card
    print("ok: fields lift from a card; missing ones stay UNCHECKABLE")


if __name__ == "__main__":
    test_absent_fields_are_uncheckable()
    test_sha_recomputes_and_is_referenceable()
    test_reads_from_card_and_flags_win()
    print("ALL REPRO TESTS PASSED")
