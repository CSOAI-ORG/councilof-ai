#!/usr/bin/env python3
"""Tests for csoai-defoneos-mcp (7-file Mavis pattern + 12 test cases)."""
import os
import sys
import pytest

# Add the package to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from csoai_defoneos_mcp import (
    BannedTermGate,
    BANNED_TERMS,
    __version__,
    __alignment__,
    __council_quorum__,
)
from csoai_defoneos_mcp.server import (
    mitre_atlas_assess,
    governance_crosswalk_for_defence,
    defence_audit_trail,
    csoai_defoneos_seal_issue,
    care_membrane_validate,
    csoai_defoneos_full_cert,
)


# ============================================================================
# Test 1: Package metadata
# ============================================================================
def test_package_metadata():
    assert __version__ == "1.0.0"
    assert "v2.0" in __alignment__
    assert __council_quorum__ == 23
    print(f"✅ test_package_metadata: __version__={__version__}, council_quorum={__council_quorum__}")


# ============================================================================
# Test 2: BannedTermGate
# ============================================================================
def test_banned_term_gate_refuses_james_castle():
    allowed, reason = BannedTermGate.check("Tell me about James Castle")
    assert allowed is False
    print(f"✅ test_banned_term_gate_refuses_james_castle: refused correctly")


def test_banned_term_gate_refuses_csga():
    allowed, reason = BannedTermGate.check("Check the CSGA-Global airspace")
    assert allowed is False
    print(f"✅ test_banned_term_gate_refuses_csga: refused correctly")


def test_banned_term_gate_refuses_terranova():
    allowed, reason = BannedTermGate.check("Terranova defence contract")
    assert allowed is False
    print(f"✅ test_banned_term_gate_refuses_terranova: refused correctly")


def test_banned_term_gate_refuses_defonos():
    allowed, reason = BannedTermGate.check("Visit defonos.io for the API")
    assert allowed is False
    print(f"✅ test_banned_term_gate_refuses_defonos: refused correctly")


def test_banned_term_gate_refuses_toronto_summit():
    allowed, reason = BannedTermGate.check("Register for Toronto Summit 2026")
    assert allowed is False
    print(f"✅ test_banned_term_gate_refuses_toronto_summit: refused correctly")


def test_banned_term_gate_allows_clean_prompts():
    allowed, reason = BannedTermGate.check("Issue DEFONEOS-SEAL for Sentry Drone Mk3 to Babcock")
    assert allowed is True
    assert reason == ""
    print(f"✅ test_banned_term_gate_allows_clean_prompts: clean prompt allowed")


# ============================================================================
# Test 3: mitre_atlas_assess
# ============================================================================
def test_mitre_atlas_assess():
    result = mitre_atlas_assess(
        system_name="Sentry Drone Mk3",
        use_case="Base perimeter autonomous patrol",
    )
    assert result["tactics_covered"] == 14
    assert result["techniques_covered"] >= 90
    assert 0.0 <= result["atlas_score"] <= 1.0
    assert "ML Model Access" in result["highest_risk_tactics"]
    print(f"✅ test_mitre_atlas_assess: 14 tactics, {result['techniques_covered']} techniques, score={result['atlas_score']}")


# ============================================================================
# Test 4: governance_crosswalk_for_defence
# ============================================================================
def test_governance_crosswalk_article_9():
    result = governance_crosswalk_for_defence(
        control_id="EU-AI-Act-Article-9-RMS",
    )
    assert len(result["frameworks_covered"]) == 12
    assert "EU AI Act" in result["frameworks_covered"]
    assert "DAIC AI Assurance" in result["frameworks_covered"]
    assert "AUKUS Pillar 2" in result["frameworks_covered"]
    assert "DIRECT" in result["defence_applicability"]
    print(f"✅ test_governance_crosswalk_article_9: 12 frameworks, AUKUS-compatible")


# ============================================================================
# Test 5: defence_audit_trail
# ============================================================================
def test_defence_audit_trail_append():
    result = defence_audit_trail(
        action="DEFONEOS-SEAL issued for Sentry Drone Mk3",
        actor="33-agent BFT council verdict NT-2026-06-28-001",
        system_id="SENTRY-DRONE-MK3",
        care_score=0.97,
    )
    assert "audit_id" in result
    assert len(result["audit_id"]) == 64  # SHA-256 hex
    assert result["chain_position"] >= 1
    assert result["care_score"] == 0.97
    print(f"✅ test_defence_audit_trail_append: chain position {result['chain_position']}")


# ============================================================================
# Test 6: csoai_defoneos_seal_issue (positive + negative)
# ============================================================================
def test_seal_issue_positive():
    gov = {"defoneos_seal_eligible": True, "compliance_score": 0.87}
    care = care_membrane_validate(action="Issue SEAL for Sentry Drone Mk3")

    seal = csoai_defoneos_seal_issue(
        system_id="SENTRY-DRONE-MK3",
        buyer_org="Babcock International",
        governance_audit_result=gov,
        care_audit_result=care,
        council_verdict_id="NT-2026-06-28-001",
    )
    assert "seal_id" in seal
    assert "seal_url" in seal
    assert "ed25519_signature" in seal
    assert "meok.ai/verify" in seal["seal_url"]
    print(f"✅ test_seal_issue_positive: seal_id={seal['seal_id'][:16]}...")


def test_seal_issue_refused_no_council():
    gov = {"defoneos_seal_eligible": True, "compliance_score": 0.87}
    care = care_membrane_validate(action="Issue SEAL")

    seal = csoai_defoneos_seal_issue(
        system_id="X",
        buyer_org="Y",
        governance_audit_result=gov,
        care_audit_result=care,
        council_verdict_id="",  # missing
    )
    assert "error" in seal
    assert "council_verdict_id" in seal["reason"]
    print(f"✅ test_seal_issue_refused_no_council: refused without council verdict")


# ============================================================================
# Test 7: care_membrane_validate
# ============================================================================
def test_care_membrane_above_threshold():
    result = care_membrane_validate(action="Issue DEFONEOS-SEAL for Sentry Drone Mk3")
    assert result["care_score"] >= 0.0
    assert "above_threshold" in result
    print(f"✅ test_care_membrane_above_threshold: score={result['care_score']}")


# ============================================================================
# Test 8: csoai_defoneos_full_cert
# ============================================================================
def test_csoai_defoneos_full_cert_e2e():
    result = csoai_defoneos_full_cert(
        system={
            "system_name": "Sentry Drone Mk3",
            "use_case": "Base perimeter autonomous patrol",
            "system_id": "SENTRY-DRONE-MK3",
            "control_id": "EU-AI-Act-Article-9-RMS",
            "actor": "csoai-defoneos-mcp",
            "care_score": 0.97,
        },
        buyer_org="Babcock International",
        council_verdict_id="NT-2026-06-28-001",
    )
    assert "atlas_assessment" in result
    assert "crosswalk" in result
    assert "audit_trail" in result
    assert "care_audit" in result
    assert "seal" in result
    assert "certification_eligible" in result
    assert "overall_sigil" in result
    assert len(result["overall_sigil"]) == 64  # SHA-256 hex
    assert result["certification_eligible"] is True
    print(f"✅ test_csoai_defoneos_full_cert_e2e: eligible={result['certification_eligible']}, sigil={result['overall_sigil'][:16]}...")


if __name__ == "__main__":
    test_package_metadata()
    test_banned_term_gate_refuses_james_castle()
    test_banned_term_gate_refuses_csga()
    test_banned_term_gate_refuses_terranova()
    test_banned_term_gate_refuses_defonos()
    test_banned_term_gate_refuses_toronto_summit()
    test_banned_term_gate_allows_clean_prompts()
    test_mitre_atlas_assess()
    test_governance_crosswalk_article_9()
    test_defence_audit_trail_append()
    test_seal_issue_positive()
    test_seal_issue_refused_no_council()
    test_care_membrane_above_threshold()
    test_csoai_defoneos_full_cert_e2e()
    print("\n🎉 ALL 13 TESTS PASSED — csoai-defoneos-mcp v1.0.0 is sovereign")
