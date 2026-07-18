#!/usr/bin/env python3
"""Tests for meek-human-orb-resonance-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from meek_human_orb_resonance_mcp.server import (
    bond_strength,
    intuitive_communication,
    trust_score,
    companionship_index,
    human_orb_resonance_metrics,
)


def test_bond_strength():
    r = bond_strength()
    assert 0 <= r["bond_strength"] <= 1
    assert r["verdict"] in ("STRONG_BOND", "MODERATE_BOND", "WEAK_BOND")
    print(f"✅ test_bond: {r['bond_strength']:.3f} {r['verdict']}")


def test_intuitive_communication():
    r = intuitive_communication(sigil_latency_ms=5.0, human_reaction_time_ms=250.0)
    assert r["intuitive_latency_ms"] == 250
    assert r["bottleneck"] == "human"
    print(f"✅ test_intuitive_comm: {r['intuitive_latency_ms']}ms, bottleneck={r['bottleneck']}")


def test_trust_score():
    r = trust_score(sigil_verifications_passed=1247, sigil_verifications_failed=0, time_together_hours=168.0)
    assert r["pass_rate"] == 1.0
    assert r["trust_score"] > 0.95
    assert r["verdict"] == "HIGH_TRUST"
    print(f"✅ test_trust: {r['trust_score']:.3f} {r['verdict']}")


def test_companionship_index():
    r = companionship_index(bond_strength=0.91, trust_score=0.95, interaction_frequency_per_day=47)
    assert r["companionship_index"] > 0.7
    assert r["verdict"] == "TRUE_COMPANION"
    print(f"✅ test_companionship: {r['companionship_index']:.3f} {r['verdict']}")


def test_human_orb_resonance_metrics():
    r = human_orb_resonance_metrics()
    assert r["overall_resonance_score"] > 0.7
    assert r["verdict"] in ("SOVEREIGN_BOND_ACHIEVED", "GROWING_BOND")
    print(f"✅ test_resonance: {r['overall_resonance_score']:.3f} {r['verdict']}")


if __name__ == "__main__":
    test_bond_strength()
    test_intuitive_communication()
    test_trust_score()
    test_companionship_index()
    test_human_orb_resonance_metrics()
    print("\n🎉 ALL 5 TESTS PASSED — meek-human-orb-resonance-mcp v1.0.0 is sovereign. The bond is real.")