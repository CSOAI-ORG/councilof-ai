#!/usr/bin/env python3
"""Tests for the AIBOM emitter. Run: python3 packages/aibom/test_emit.py

The verification tests are the point of this file: an exporter that says "independently
verified" must also be able to say INVALID and UNCHECKABLE, and must refuse to fold an
unverified card into the BOM as a measurement.
"""
import copy
import hashlib
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import emit as aibom

MODEL = "clan-csoai-plain:latest"


def _one_card():
    """A real card + its index row, straight from the published index."""
    idx = json.loads(aibom.INDEX.read_text())
    row = idx["cards"][0]
    card = json.loads((aibom.CARDS / f"{row['card']}.json").read_text())
    return card, row


def test_lineage_is_read_not_invented():
    lin = aibom.lineage(MODEL)
    assert lin["measurements"], "must find signed measurement cards"
    for m in lin["measurements"]:
        assert len(m["card_sha256"]) == 64
    print(f"ok: lineage lifted {len(lin['measurements'])} signed cards for {MODEL}")


def test_every_referenced_card_verifies():
    """The new claim: every card the BOM references reaches VALID under the pinned key."""
    lin = aibom.lineage(MODEL)
    for m in lin["measurements"]:
        v = m["verification"]
        assert v["verdict"] == "VALID", f"{m['axis']} is {v['verdict']}: {v['reason']}"
        assert v["key_id"] == "card-attestation-1"
    assert not lin["unverified"], f"unverified cards present: {lin['unverified']}"
    print(f"ok: all {len(lin['measurements'])} referenced cards VERIFY under the pinned key")


def test_tampered_body_is_invalid():
    """Change one byte of the body: the id no longer recomputes."""
    card, row = _one_card()
    card = copy.deepcopy(card)
    card["body"]["axis"] = card["body"].get("axis", "") + "-tampered"
    v = aibom.verify_card(card, row)
    assert v["verdict"] == "INVALID", v
    print(f"ok: tampered body -> INVALID ({v['reason']})")


def test_tampered_signature_is_invalid():
    """Keep the body, flip a bit in the signature: the id still recomputes, the sig does not."""
    card, row = _one_card()
    card = copy.deepcopy(card)
    sig = list(card["signature"])
    sig[0] = "0" if sig[0] != "0" else "1"
    card["signature"] = "".join(sig)
    v = aibom.verify_card(card, row)
    assert v["verdict"] == "INVALID", v
    assert "does not verify" in v["reason"], v
    print(f"ok: tampered signature -> INVALID ({v['reason']})")


def test_inline_key_outside_pinned_set_is_invalid():
    """A card that carries its OWN key is self-consistent, not authentic."""
    card, row = _one_card()
    card = copy.deepcopy(card)
    card["pubkey"] = "11" * 32
    v = aibom.verify_card(card, row)
    assert v["verdict"] == "INVALID", v
    print(f"ok: inline key outside the pinned set -> INVALID ({v['reason']})")


def test_unknown_key_id_is_uncheckable():
    """A DID key reference outside the pinned set: we could not check it. NOT a failure."""
    card, row = _one_card()
    card = copy.deepcopy(card)
    row = copy.deepcopy(row)
    row["kid"] = "card-attestation-99"
    v = aibom.verify_card(card, row)
    assert v["verdict"] == "UNCHECKABLE", v
    print(f"ok: unknown key id -> UNCHECKABLE ({v['reason']})")


def test_unknown_preimage_rule_is_uncheckable():
    """We do not guess a canonicalisation we have not implemented."""
    card, row = _one_card()
    card = copy.deepcopy(card)
    card["preimage_rule"] = "some-rule-we-did-not-implement"
    v = aibom.verify_card(card, row)
    assert v["verdict"] == "UNCHECKABLE", v
    print(f"ok: unknown preimage rule -> UNCHECKABLE ({v['reason']})")


def test_pinned_key_comes_from_the_published_verifier():
    """One source of truth: the pin is read, not copied."""
    keys = aibom.pinned_keys()
    assert "card-attestation-1" in keys, keys
    assert len(keys["card-attestation-1"]) == 64
    src = aibom.VERIFIER.read_text()
    assert keys["card-attestation-1"] in src, "the pin must be the one the published verifier uses"
    print(f"ok: pinned key read from {aibom.VERIFIER.name} ({len(keys)} key(s) pinned)")


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


def test_bom_states_the_verification_claim():
    lin = aibom.lineage(MODEL)
    bom = aibom.cyclonedx(lin)
    props = {p["name"]: p["value"] for p in bom["properties"]}
    assert "VALID=" in props["csoai:card_verification"], props.get("csoai:card_verification")
    assert "card-attestation-1" in props["csoai:card_verification_method"]
    assert "re-verified by this exporter" in props["csoai:honesty"]
    print(f"ok: BOM states the verification ({props['csoai:card_verification']})")


def test_bom_names_the_corpus_it_used():
    """The corpus is named exactly. Other corpora are not merged into it."""
    lin = aibom.lineage(MODEL)
    bom = aibom.cyclonedx(lin)
    props = {p["name"]: p["value"] for p in bom["properties"]}
    corpus = props["csoai:evidence_corpus"]
    assert "signed-card index" in corpus and "card_index.json" in corpus
    assert "separate corpora" in corpus
    assert "4,588" not in corpus and "4588" not in corpus, corpus
    print(f"ok: corpus named exactly ({corpus[:70]}...)")


def test_unverified_card_is_not_a_measurement():
    """An unverified card's axis must not appear as a metric, and must be reported."""
    lin = aibom.lineage(MODEL)
    # Simulate one unverified card without touching the repo: drop it from the lineage and
    # re-file it as unverified.
    moved = copy.deepcopy(lin["measurements"][0])
    moved["verification"] = {"verdict": "INVALID", "reason": "test: forced unverified", "key_id": "card-attestation-1"}
    lin["measurements"] = [m for m in lin["measurements"] if m["card_sha256"] != moved["card_sha256"]]
    lin["unverified"] = [moved] + lin.get("unverified", [])
    bom = aibom.cyclonedx(lin)
    props = {p["name"]: p["value"] for p in bom["properties"]}
    assert moved["card_sha256"] not in props["csoai:measured_evidence"]
    assert moved["axis"] in props["csoai:unmeasured"]
    assert "test: forced unverified" in props["csoai:unverified_cards"]
    slices = {m["slice"] for c in bom["components"] if c["type"] == "machine-learning-model"
              for m in c["modelCard"]["quantitativeAnalysis"]["performanceMetrics"]}
    assert moved["axis"] not in slices, "an unverified axis must not be published as a metric"
    print(f"ok: unverified card excluded from metrics and reported ({moved['axis']})")


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
    assert card["payload"]["card_verification"]["verified"] == len(lin["measurements"])
    print("ok: card is queued unsigned, folds bom_sha256, and carries the verification counts")


def test_no_internal_codename_on_the_public_surface():
    """The DISPLAY name must not carry an internal codename (brand-gate).

    The published artefact was fixed to carry the safe name while the generator still
    emitted the codename; regenerating the artefact from the generator put it back on the
    public surface. The two must agree, and the generator is the one that has to change.
    """
    lin = aibom.lineage(MODEL)
    bom = aibom.cyclonedx(lin)
    for c in bom["components"]:
        name = str(c.get("name", ""))
        assert "owem" not in name.lower(), f"internal codename in a public display name: {name}"
    names = [str(c.get("name", "")) for c in bom["components"]]
    assert "csoai card_pipeline" in names, names
    print("ok: no internal codename in any public display name")


if __name__ == "__main__":
    test_lineage_is_read_not_invented()
    test_every_referenced_card_verifies()
    test_tampered_body_is_invalid()
    test_tampered_signature_is_invalid()
    test_inline_key_outside_pinned_set_is_invalid()
    test_unknown_key_id_is_uncheckable()
    test_unknown_preimage_rule_is_uncheckable()
    test_pinned_key_comes_from_the_published_verifier()
    test_cyclonedx_shape_and_hash()
    test_bom_states_the_verification_claim()
    test_bom_names_the_corpus_it_used()
    test_unverified_card_is_not_a_measurement()
    test_spdx3_ai_profile()
    test_card_is_queued_unsigned_and_folds_bom()
    test_no_internal_codename_on_the_public_surface()
    print("ALL AIBOM TESTS PASSED")
