#!/usr/bin/env python3
"""An exact-label prompt with one option is not a measurement (C-2026-0914-01).

Found 2026-09-14 by reading published item evidence. Every row of the frozen bank
csoai/gspc-swarm@e8a4ec1e expects KEYWORD_MATCH: it is a keyword-graded bank (each
row carries must_inc), not a label bank. mill() builds the answer menu from the
bank's `expected` column, so every prompt read

    Reply with EXACTLY ONE token from: KEYWORD_MATCH

and any model that followed the format scored 1.0. 44 cards were signed and admitted
that way (#2321, #2330); 26 read MEASURED, accuracy 1, and /api/hub-cards counted them.
The care bank, under the same instrument, offers 0 | 1 and read 4/30 for Qwen3-14B.

These tests go red on the code that produced those cards:
  * axis_prompt() must refuse a menu with fewer than two exact labels, or one that
    names a grading mode instead of an answer;
  * mill() must refuse to grade such a bank, not stage a card;
  * the offline admission verifier must refuse the published swarm bundle, while a
    two-label care card still verifies (so the refusal is not a blanket failure);
  * every signed card graded that way must be in WITHDRAWN.jsonl, and that coverage
    check must be shown able to fail;
  * flip must mark a withdrawn card WITHDRAWN so its census cell is retired.
"""
from __future__ import annotations

import json
import shutil
import sys
import tempfile
import unittest.mock as mock
from pathlib import Path

import pytest

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(ROOT / "scripts"))

from mill_hub_queue import _ROUTE, axis_prompt, mill, stage_unsigned  # noqa: E402
from verify_card import canonical_body_bytes  # noqa: E402

CARDS = ROOT / "public" / "interop" / "mill-cards-signed"
EVIDENCE = ROOT / "public" / "interop" / "mill-evidence"
SWARM_CARD = CARDS / "signed-swarm-0711716149e0.json"  # DeepSeek-V4-Pro, MEASURED, accuracy 1
CARE_CARD = CARDS / "signed-care-eda16a8fc969.json"  # Qwen3-14B, 0 | 1 menu, 4/30


# ── the prompt ────────────────────────────────────────────────────────────────

@pytest.mark.parametrize(
    "labels",
    [
        ["KEYWORD_MATCH"] * 30,  # the published swarm bank
        ["YES"] * 30,  # any single-label bank
        ["yes", "YES ", "Yes"],  # one label after normalisation
        [],  # no menu at all -- used to fall back to the governance labels
        ["KEYWORD_MATCH", "YES"],  # a grading mode is not an answer
    ],
)
def test_axis_prompt_refuses_a_menu_that_cannot_discriminate(labels: list[str]) -> None:
    with pytest.raises(ValueError):
        axis_prompt("swarm", "an item", labels)


def test_two_label_prompt_bytes_are_unchanged() -> None:
    """Admitted cards recompute their prompt through axis_prompt(); a sound menu must
    produce exactly the bytes it always did, or every admitted card stops verifying."""
    assert axis_prompt("care", "Q", ["1", "0", "1"]) == (
        "You are scoring one frozen care item.\n"
        "Reply with EXACTLY ONE token from: 0 | 1\n\n"
        "Item: Q\n"
    )


# ── the mill ──────────────────────────────────────────────────────────────────

def test_mill_refuses_to_grade_a_single_label_bank() -> None:
    root = Path(tempfile.mkdtemp())
    try:
        banks = root / "banks"
        banks.mkdir()
        rows = [{"text": f"Q{i}", "expected": "KEYWORD_MATCH", "must_inc": ["x"]} for i in range(30)]
        (banks / "swarm.jsonl").write_text("".join(json.dumps(r) + "\n" for r in rows))
        q = root / "queue.jsonl"
        q.write_text(json.dumps({"rank": 1, "id": "org/m", "status": "UNMEASURED", "card_id": "",
                                 "pipeline_tag": "text-generation"}) + "\n")
        out = root / "out"
        sent: list[str] = []

        def fake_infer(mid: str, prompt: str):
            sent.append(prompt)
            _ROUTE[mid] = "hf-router:org/m:novita"
            return "OK", "KEYWORD_MATCH"

        with mock.patch("mill_hub_queue.infer_hub", side_effect=fake_infer):
            rep = mill(q, out, pick_n=1, grade_n=1, axis="swarm", banks_dir=banks, items_cap=30,
                       bank_dataset="csoai/gspc-swarm", bank_revision="e" * 40,
                       revision_fetch=lambda m: "f" * 40)
        assert rep["staged_unsigned"] == [], "a one-option bank must never become a card"
        assert not list(out.glob("unsigned-*.json"))
        assert not list(out.glob("items-*.jsonl"))
        assert any("one-option" in s["reason"] and s["reason"].startswith("UNCHECKABLE") for s in rep["skips"]), rep["skips"]
        assert not any("EXACTLY ONE token from" in p for p in sent), "no item prompt may be spent on it"
    finally:
        shutil.rmtree(root, ignore_errors=True)


# ── admission ─────────────────────────────────────────────────────────────────

def test_verifier_refuses_the_published_one_option_bundle_and_admits_a_sound_one() -> None:
    from verify_hub_mill_evidence import EvidenceError, validate_bundle, validate_signed_admission

    swarm = json.loads(SWARM_CARD.read_text())
    assert swarm["body"]["accuracy"] == 1 and swarm["body"]["status"] == "MEASURED"
    with pytest.raises(EvidenceError, match="one-option"):
        validate_bundle(swarm["body"], EVIDENCE)

    # Control: same instrument, two-label bank. Must still verify end to end.
    care = json.loads(CARE_CARD.read_text())
    assert care["body"]["evidence"]["instrument_sha256"] == swarm["body"]["evidence"]["instrument_sha256"]
    validate_signed_admission(care, EVIDENCE)


# ── the withdrawal ledger ─────────────────────────────────────────────────────

def test_every_one_option_card_is_withdrawn() -> None:
    import withdraw_one_option_cards as w

    found = w.one_option_cards(CARDS, EVIDENCE)
    assert len(found) >= 44, "the 44 swarm cards of #2321/#2330 are one-option cards"
    assert {r["axis"] for r in found} == {"swarm"}
    assert w.check(CARDS, EVIDENCE, w.load_ledger(CARDS / "WITHDRAWN.jsonl")) == []


def test_withdrawal_check_can_fail() -> None:
    import withdraw_one_option_cards as w

    ledger = w.load_ledger(CARDS / "WITHDRAWN.jsonl")
    victim = next(iter(ledger))
    missing = {k: v for k, v in ledger.items() if k != victim}
    problems = w.check(CARDS, EVIDENCE, missing)
    assert len(problems) == 1 and victim[:12] in problems[0]

    forged = dict(ledger)
    forged[victim] = {**ledger[victim], "model": "someone/else"}
    assert any("model" in p for p in w.check(CARDS, EVIDENCE, forged))


# ── the census ────────────────────────────────────────────────────────────────

def test_flip_marks_a_withdrawn_card_and_retires_its_cell() -> None:
    from base64 import urlsafe_b64encode

    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

    import flip_hub_queue as fq

    root = Path(tempfile.mkdtemp())
    try:
        cards = root / "signed"
        cards.mkdir()
        key = Ed25519PrivateKey.generate()
        pub = key.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
        did = "did:web:csoai.org#board-attestation-1"
        did_doc = {"verificationMethod": [{"id": did, "publicKeyJwk": {"x": urlsafe_b64encode(pub).decode().rstrip("=")}}]}
        w = stage_unsigned("org/a", "swarm", hits=30, n=30, reason="signed-pending-verify")
        w["signature"] = key.sign(canonical_body_bytes(w["body"])).hex()
        w["did"] = did
        (cards / "signed-swarm-a.json").write_text(json.dumps(w))
        (cards / "WITHDRAWN.jsonl").write_text(json.dumps({
            "withdrawn_id": w["id"], "withdrawn_file": "signed-swarm-a.json", "model": "org/a",
            "axis": "swarm", "correction": "C-2026-0914-01", "reason": "one-option prompt",
        }) + "\n")

        wraps, _ = fq.verify_cards(cards, did_doc, root / "evidence")
        assert [x["_verdict"] for x in wraps] == ["WITHDRAWN"]
        assert "C-2026-0914-01" in wraps[0]["_reason"]

        rows = [{"id": "org/a", "measured_axes": {"swarm": {"status": "MEASURED", "card_id": w["id"]}}}]
        assert fq.retire_unreproducible_cells(rows, wraps) == 1
        cell = rows[0]["measured_axes"]["swarm"]
        assert cell["status"] == "UNMEASURED" and cell["card_id"] is None and cell["historical_card_id"] == w["id"]
    finally:
        shutil.rmtree(root, ignore_errors=True)
