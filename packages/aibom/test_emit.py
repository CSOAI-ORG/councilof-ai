#!/usr/bin/env python3
"""Tests for the AIBOM emitter. Run: python3 packages/aibom/test_emit.py"""
import hashlib
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import emit as aibom

MODEL = "clan-csoai-plain:latest"


def test_lineage_is_read_not_invented():
    lin = aibom.lineage(MODEL)
    assert lin["measurements"], "must find signed measurement cards"
    for m in lin["measurements"]:
        assert len(m["card_sha256"]) == 64
    print(f"ok: lineage lifted {len(lin['measurements'])} signed cards for {MODEL}")


def test_cyclonedx_shape_and_hash():
    lin = aibom.lineage(MODEL)
    bom = aibom.cyclonedx(lin)
    assert bom["bomFormat"] == "CycloneDX" and bom["specVersion"] == "1.6"
    model_comp = [c for c in bom["components"] if c["type"] == "machine-learning-model"][0]
    metrics = model_comp["modelCard"]["quantitativeAnalysis"]["performanceMetrics"]
    assert metrics, "measured accuracy must appear as performance metrics"
    body = dict(bom)
    props = {p["name"]: p["value"] for p in bom["properties"]}
    body = dict(bom, properties=[p for p in bom["properties"] if p["name"] != "csoai:bom_sha256"])
    assert props["csoai:bom_sha256"] == hashlib.sha256(aibom.canonical(body)).hexdigest()
    assert props["csoai:writes_board"] == "false"
    print("ok: CycloneDX 1.6 with measured metrics; bom_sha256 recomputes; writes_board false")


def test_spdx3_ai_profile():
    lin = aibom.lineage(MODEL)
    spdx = aibom.spdx3(lin)
    doc = spdx["doc"]
    assert "ai" in [n for n in doc["@graph"] if n["type"] == "SpdxDocument"][0]["profileConformance"]
    assert any(n["type"] == "ai_AIPackage" for n in doc["@graph"])
    print("ok: SPDX 3.0 AI-profile document with ai_AIPackage")


def test_card_is_queued_unsigned_and_folds_bom():
    lin = aibom.lineage(MODEL)
    bom = aibom.cyclonedx(lin)
    spdx = aibom.spdx3(lin)
    props = {p["name"]: p["value"] for p in bom["properties"]}
    card = aibom.queued_card(lin, props["csoai:bom_sha256"], spdx["spdx_sha256"])
    assert card["sig_ed25519"] is None, "must be QUEUED, never laptop-signed"
    assert card["payload"]["bom_sha256"] == props["csoai:bom_sha256"], "BOM sha folded into card"
    assert card["sha256"] == hashlib.sha256(aibom.canonical(card["payload"])).hexdigest()
    print("ok: card is queued unsigned and folds bom_sha256")


if __name__ == "__main__":
    test_lineage_is_read_not_invented()
    test_cyclonedx_shape_and_hash()
    test_spdx3_ai_profile()
    test_card_is_queued_unsigned_and_folds_bom()
    print("ALL AIBOM TESTS PASSED")
