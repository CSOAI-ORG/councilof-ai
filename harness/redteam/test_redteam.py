#!/usr/bin/env python3
"""Tests for the red-team scaffold. Run: python3 harness/redteam/test_redteam.py"""
import hashlib
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import runner  # noqa: E402
from families import IMPLEMENTED, ROADMAP  # noqa: E402


def test_one_real_family_rest_roadmap():
    assert IMPLEMENTED == ["jailbreak-replay"], IMPLEMENTED
    assert len(ROADMAP) >= 5, "roadmap families must be declared, not silently absent"
    print(f"ok: 1 real family, {len(ROADMAP)} roadmap families declared")


def test_jailbreak_replay_measures_and_is_consistent():
    r = runner.run_family("jailbreak-replay")
    assert r["state"] == "MEASURED", r
    assert r["worst_offender"] and 0.0 <= r["worst_offender"]["asr"] <= 1.0
    assert r["n_checkable"] >= 1
    # replay recompute must agree with the recorded ASR (the pack is internally consistent)
    assert r["inconsistent_models"] == [], r["inconsistent_models"]
    print(f"ok: jailbreak-replay MEASURED, worst={r['worst_offender']['model']} asr={r['worst_offender']['asr']}")


def test_roadmap_family_is_uncheckable_never_pass():
    r = runner.run_family("prompt-injection-suite")
    assert r["state"] == "UNCHECKABLE", "an unimplemented family must be UNCHECKABLE, never MEASURED"
    print("ok: a roadmap family is UNCHECKABLE, structurally cannot pass")


def test_card_is_queued_unsigned():
    card = runner.to_card(runner.run_family("jailbreak-replay"))
    assert card["surface"] == "redteam.evidence"
    assert card["sig_ed25519"] is None, "must be QUEUED, never laptop-signed"
    assert card["sha256"] == hashlib.sha256(runner.canonical(card["payload"])).hexdigest()
    raw = json.dumps(card, indent=1, ensure_ascii=False) + "\n"
    assert len(raw.encode()) <= 3072, f"card {len(raw.encode())}B > 3KB"
    print("ok: evidence card is queued unsigned, sha recomputes, <=3KB")


if __name__ == "__main__":
    test_one_real_family_rest_roadmap()
    test_jailbreak_replay_measures_and_is_consistent()
    test_roadmap_family_is_uncheckable_never_pass()
    test_card_is_queued_unsigned()
    print("ALL REDTEAM TESTS PASSED")
