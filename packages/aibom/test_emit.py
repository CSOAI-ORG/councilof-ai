#!/usr/bin/env python3
"""Tests for the AIBOM emitter and 335-card pinned Ed25519 verifier. Run: python3 packages/aibom/test_emit.py"""
import copy
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
    assert lin["verdict_counts"]["VALID"] == len(lin["measurements"])
    assert lin["verdict_counts"]["INVALID"] == 0
    assert lin["verdict_counts"]["UNCHECKABLE"] == 0
    for m in lin["measurements"]:
        assert len(m["card_sha256"]) == 64
    print(f"ok: lineage verified {len(lin['measurements'])} VALID signed cards for {MODEL}")


def test_cyclonedx_shape_and_hash():
    lin = aibom.lineage(MODEL)
    bom = aibom.cyclonedx(lin)
    assert bom["bomFormat"] == "CycloneDX" and bom["specVersion"] == "1.6"
    model_comp = [c for c in bom["components"] if c["type"] == "machine-learning-model"][0]
    metrics = model_comp["modelCard"]["quantitativeAnalysis"]["performanceMetrics"]
    assert metrics, "measured accuracy must appear as performance metrics"
    body = dict(bom)
    body["x_csoai"] = {k: v for k, v in bom["x_csoai"].items() if k != "bom_sha256"}
    assert bom["x_csoai"]["bom_sha256"] == hashlib.sha256(aibom.canonical(body)).hexdigest()
    assert bom["x_csoai"]["writes_board"] is False
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
    card = aibom.queued_card(lin, bom["x_csoai"]["bom_sha256"], spdx["spdx_sha256"])
    assert card["sig_ed25519"] is None, "must be QUEUED, never laptop-signed"
    assert card["payload"]["bom_sha256"] == bom["x_csoai"]["bom_sha256"], "BOM sha folded into card"
    assert card["sha256"] == hashlib.sha256(aibom.canonical(card["payload"])).hexdigest()
    print("ok: card is queued unsigned and folds bom_sha256")


def test_tampered_and_uncheckable_cards_fail_closed():
    idx = json.loads(aibom.INDEX.read_text(encoding="utf-8"))
    sample_id = idx["cards"][0]["card"]
    sample_card = json.loads((aibom.CARDS / f"{sample_id}.json").read_text(encoding="utf-8"))
    assert aibom.verify_card(sample_card)["verdict"] == "VALID"

    # 1. Tampered body -> INVALID
    c_body = copy.deepcopy(sample_card)
    c_body["body"]["accuracy"] = 0.123456
    assert aibom.verify_card(c_body)["verdict"] == "INVALID"

    # 2. Tampered signature -> INVALID
    c_sig = copy.deepcopy(sample_card)
    c_sig["signature"] = ("00" if not c_sig["signature"].startswith("00") else "ff") + c_sig["signature"][2:]
    assert aibom.verify_card(c_sig)["verdict"] == "INVALID"

    # 3. Inline pubkey outside pinned set -> INVALID
    c_pub = copy.deepcopy(sample_card)
    c_pub["pubkey"] = "aa" * 32
    assert aibom.verify_card(c_pub)["verdict"] == "INVALID"

    # 4. Unknown DID key reference -> UNCHECKABLE
    c_did = copy.deepcopy(sample_card)
    c_did.pop("pubkey", None)
    c_did["did"] = "did:web:csoai.org#unknown-key-99"
    assert aibom.verify_card(c_did)["verdict"] == "UNCHECKABLE"

    # 5. Unimplemented preimage rule -> UNCHECKABLE
    c_rule = copy.deepcopy(sample_card)
    c_rule["preimage_rule"] = "unknown-canonicaliser-v99"
    assert aibom.verify_card(c_rule)["verdict"] == "UNCHECKABLE"
    print("ok: 5 negative/uncheckable controls verified (3 INVALID, 2 UNCHECKABLE)")


def test_unverified_card_is_not_a_measurement():
    lin_base = aibom.lineage(MODEL)
    first_sha = lin_base["measurements"][0]["card_sha256"]
    first_axis = lin_base["measurements"][0]["axis"]
    tampered = json.loads((aibom.CARDS / f"{first_sha}.json").read_text(encoding="utf-8"))
    tampered["signature"] = "00" * 64
    lin = aibom.lineage(MODEL, card_overrides={first_sha: tampered})
    bom = aibom.cyclonedx(lin)
    assert first_sha not in bom["x_csoai"]["measured_evidence"]
    assert first_axis in bom["x_csoai"]["unmeasured"]
    assert any(u["card_sha256"] == first_sha and u["verdict"] == "INVALID" for u in bom["x_csoai"]["unverified_cards"])
    model_comp = [c for c in bom["components"] if c["type"] == "machine-learning-model"][0]
    slices = [m["slice"] for m in model_comp["modelCard"]["quantitativeAnalysis"]["performanceMetrics"]]
    assert first_axis not in slices
    print("ok: unverified card excluded from measured_evidence and performanceMetrics")


def test_no_internal_codename_on_the_public_surface():
    lin = aibom.lineage(MODEL)
    bom = aibom.cyclonedx(lin)
    raw = json.dumps(bom)
    for banned in ("owem", "sovos", "black swan", "venturi", "pontius", "laputa"):
        assert banned not in raw.lower(), f"banned codename {banned!r} in CycloneDX output"
    print("ok: zero internal codenames in CycloneDX output")


def test_all_335_indexed_cards_verify_valid():
    res = aibom.verify_all_indexed_cards()
    assert res["counts"]["VALID"] == 335, f"expected 335 VALID, got {res['counts']}"
    assert res["counts"]["INVALID"] == 0
    assert res["counts"]["UNCHECKABLE"] == 0
    print(f"ok: all {res['counts']['VALID']}/335 indexed cards verify VALID in Python")


if __name__ == "__main__":
    test_lineage_is_read_not_invented()
    test_cyclonedx_shape_and_hash()
    test_spdx3_ai_profile()
    test_card_is_queued_unsigned_and_folds_bom()
    test_tampered_and_uncheckable_cards_fail_closed()
    test_unverified_card_is_not_a_measurement()
    test_no_internal_codename_on_the_public_surface()
    test_all_335_indexed_cards_verify_valid()
    print("ALL 8 AIBOM & 335-CARD VERIFIER TESTS PASSED")
