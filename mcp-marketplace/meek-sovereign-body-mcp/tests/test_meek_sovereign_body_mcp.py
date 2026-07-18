#!/usr/bin/env python3
"""Tests for meek-sovereign-body-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from meek_sovereign_body_mcp.server import (
    sigil_sign_muscle_command,
    sigil_verify_muscle_command,
    bft_council_posture_decision,
    sovereign_body_status,
)


def test_sigil_sign_muscle_command():
    r = sigil_sign_muscle_command(orb_id="muscle_001", muscle_group="right_biceps", target_force_n=100.0)
    assert r["signature"] is not None
    assert len(r["signature"]) > 50
    print(f"✅ test_sigil_sign: signed, signature_len={len(r['signature'])}")


def test_sigil_verify_muscle_command():
    sign_result = sigil_sign_muscle_command(orb_id="muscle_002", muscle_group="left_quad", target_force_n=200.0)
    verify_result = sigil_verify_muscle_command(
        orb_id="muscle_002", muscle_group="left_quad", target_force_n=200.0,
        timestamp_ms=sign_result["timestamp_ms"], signature=sign_result["signature"],
    )
    assert verify_result["is_valid"] is True
    assert verify_result["verdict"] == "VERIFIED"
    print(f"✅ test_sigil_verify: VERIFIED")


def test_bft_council_posture_decision():
    r = bft_council_posture_decision(posture_name="stand_up", votes_for=25, votes_against=5)
    assert r["verdict"] == "APPROVED"
    print(f"✅ test_bft_council: {r['verdict']} ({r['consensus_pct']*100:.1f}% consensus)")


def test_sovereign_body_status():
    r = sovereign_body_status(num_muscle_orbs=5000, energy_harvested_mw=201.61)
    assert r["sovereign"] is True
    assert r["total_orbs"] == 5005
    print(f"✅ test_sovereign_body: {r['total_orbs']} orbs, {r['body_mass_kg']:.1f} kg, {r['sigil_signatures_per_hour']:,} sigils/hr")


if __name__ == "__main__":
    test_sigil_sign_muscle_command()
    test_sigil_verify_muscle_command()
    test_bft_council_posture_decision()
    test_sovereign_body_status()
    print("\n🎉 ALL 4 TESTS PASSED — meek-sovereign-body-mcp v1.0.0 is sovereign.")