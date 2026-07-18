#!/usr/bin/env python3
"""Tests for meek-leanstral-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from meek_leanstral_mcp.server import leanstral_proof_generation, defoneos_seal_formal_verification


def test_leanstral_proof_generation():
    r = leanstral_proof_generation(theorem="Ed25519 signature is unforgeable", num_attempts=16)
    assert r["pass_at_16_pct"] > 30
    assert r["cost_per_proof_usd"] < 1.0
    print(f"✅ test_leanstral: pass@16={r['pass_at_16_pct']:.1f}%, cost=${r['cost_per_proof_usd']}")


def test_defoneos_seal_formal_verification_ed25519():
    r = defoneos_seal_formal_verification(seal_type="ed25519_signature", verification_depth=5)
    assert r["proof_completeness"] == 1.0
    assert r["verdict"] == "PROVEN"
    assert len(r["proof_steps"]) == 5
    print(f"✅ test_seal_verify_ed25519: verdict={r['verdict']}")


def test_defoneos_seal_formal_verification_bft():
    r = defoneos_seal_formal_verification(seal_type="bft_consensus", verification_depth=5)
    assert r["verdict"] == "PROVEN"
    print(f"✅ test_seal_verify_bft: verdict={r['verdict']}")


if __name__ == "__main__":
    test_leanstral_proof_generation()
    test_defoneos_seal_formal_verification_ed25519()
    test_defoneos_seal_formal_verification_bft()
    print("\n🎉 ALL 3 TESTS PASSED — meek-leanstral-mcp v1.0.0 is sovereign.")