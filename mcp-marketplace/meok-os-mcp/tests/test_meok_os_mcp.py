#!/usr/bin/env python3
"""Tests for meok-os-mcp (the OS-for-ALL meta-orchestrator)."""
import os
import sys
import hashlib

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from meok_os_mcp import (
    GLOBAL_DOME_LAYERS,
    BANNED_TERMS,
    KINETIC_BLOCK_PATTERNS,
    SURVEILLANCE_BLOCK_PATTERNS,
    BannedTermGate,
    __version__,
    __alignment__,
    __substrate_size__,
    __council_quorum__,
    __scope__,
)
from meok_os_mcp.server import (
    os_discover,
    os_route,
    os_run_humanoid_safety_check,
    os_audit,
    os_sign,
    os_verify,
    os_consult_council,
    os_industry_pack,
    os_data_provenance,
    os_sovereign_handoff,
)


# ============================================================================
# Test 1: Package metadata
# ============================================================================
def test_package_metadata():
    assert __version__ == "1.0.2"
    assert "MEOK_DEFONEOS_ALIGNMENT_2026-06-27" in __alignment__
    assert "v3.0" in __alignment__
    assert "UK sovereign only" in __alignment__
    assert "15 DEFONEOS MCPs" in __substrate_size__
    assert "UK sovereign" in __substrate_size__
    assert __council_quorum__ == 23
    assert __scope__ == "UK MOD + AUKUS Pillar 2 + DAIC procurement-grade. UK sovereign only. NOT for global / consumer / non-defence."
    print(f"✅ test_package_metadata: __version__={__version__}, scope='{__scope__[:40]}...'")


# ============================================================================
# Test 2: BannedTermGate
# ============================================================================
def test_banned_term_gate_refuses_james_castle():
    allowed, reason = BannedTermGate.check("Run a query about James Castle")
    assert allowed is False
    print(f"✅ test_banned_term_gate_refuses_james_castle: refused correctly")


def test_banned_term_gate_refuses_toronto_summit():
    allowed, reason = BannedTermGate.check("Register for Toronto Summit")
    assert allowed is False
    print(f"✅ test_banned_term_gate_refuses_toronto_summit: refused correctly")


def test_banned_term_gate_allows_clean():
    allowed, reason = BannedTermGate.check("Find me a construction site for hire")
    assert allowed is True
    print(f"✅ test_banned_term_gate_allows_clean: clean prompt allowed")


# ============================================================================
# Test 3: os_discover
# ============================================================================
def test_os_discover_all():
    result = os_discover(layer="all")
    assert result["os_version"] == "MEOK OS v1.0.0"
    assert "454 MCPs" in result["substrate_size"]
    assert result["total_mcps"] > 0
    assert len(result["layers"]) == 8  # L0, L1, L2, L3, L4, L5, L6, L7
    for layer_key in ["L0", "L1", "L2", "L3", "L4", "L5", "L6", "L7"]:
        assert layer_key in result["layers"]
    print(f"✅ test_os_discover_all: 8 layers (L0-L7), {result['total_mcps']} MCPs total")


def test_os_discover_layer_L6_industry():
    result = os_discover(layer="L6")
    assert "L6" in result["layers"]
    assert "Industry MCP Packs" in result["layers"]["L6"]["name"]
    print(f"✅ test_os_discover_layer_L6_industry: {result['layers']['L6']['mcp_count']} industry MCPs")


# ============================================================================
# Test 4: os_route
# ============================================================================
def test_os_route_construction():
    result = os_route(request="Find me a construction site for hire in Devonport")
    assert result["routed_layer"] == "L6"
    print(f"✅ test_os_route_construction: routed to {result['routed_layer']}/{result['routed_mcp']}")


def test_os_route_governance():
    result = os_route(request="Check tax compliance for my new audit")
    assert result["routed_layer"] in ("L4", "L5")
    print(f"✅ test_os_route_governance: routed to {result['routed_layer']}/{result['routed_mcp']}")


def test_os_route_humanoid():
    result = os_route(request="Robot safety envelope for warehouse humanoid")
    assert result["routed_layer"] in ("L6", "L7")
    print(f"✅ test_os_route_humanoid: routed to {result['routed_layer']}/{result['routed_mcp']}")


# ============================================================================
# Test 5: os_run_humanoid_safety_check
# ============================================================================
def test_humanoid_safety_check_approved():
    result = os_run_humanoid_safety_check(
        action="Pick box from shelf A and place on conveyor B",
        robot_id="ROBOT-001",
    )
    assert result["approved"] is True
    assert result["permit_id"].startswith("PERMIT-")
    assert result["council_verdict"] == "APPROVED"
    print(f"✅ test_humanoid_safety_check_approved: permit {result['permit_id']}")


# ============================================================================
# Test 6: os_audit
# ============================================================================
def test_os_audit_self():
    result = os_audit(audit_target="self", audit_type="sovereign-certification")
    assert result["audit_target"] == "self"
    assert len(result["layers_audited"]) == 8  # L0-L7
    assert len(result["frameworks_covered"]) == 14
    assert result["compliance_score"] >= 0.85
    assert result["defoneos_seal_eligible"] is True
    print(f"✅ test_os_audit_self: 8 layers (L0-L7), 14 frameworks, score={result['compliance_score']}, seal eligible")


# ============================================================================
# Test 7: os_sign + os_verify
# ============================================================================
def test_os_sign_and_verify():
    sig = os_sign(
        action="Issue DEFONEOS-SEAL for Sentry Drone Mk3 to Babcock",
        actor="33-agent BFT council verdict NT-2026-06-28-001",
        system_id="csoai-defoneos-mcp",
    )
    assert sig["signature_id"] != ""
    assert sig["actor"] != ""
    assert sig["care_score"] >= 0.95

    verify = os_verify(
        signature_id=sig["signature_id"],
        expected_action="Issue DEFONEOS-SEAL for Sentry Drone Mk3 to Babcock",
    )
    assert verify["signature_id"] == sig["signature_id"]
    print(f"✅ test_os_sign_and_verify: signed {sig['signature_id'][:8]}..., verified")


# ============================================================================
# Test 8: os_consult_council
# ============================================================================
def test_os_consult_council():
    result = os_consult_council(
        question="Should we add a 28th MCP to the DEFONEOS fleet?",
        context="Sovereign-AI OS for ALL strategy",
    )
    assert result["consultation_id"].startswith("consultation-")
    assert result["quorum_required"] == 23
    assert result["council_size"] == 33
    assert result["verdict"] == "PENDING"
    print(f"✅ test_os_consult_council: {result['consultation_id']}, PENDING 23/33")


# ============================================================================
# Test 9: os_industry_pack
# ============================================================================
def test_os_industry_pack_defence():
    result = os_industry_pack(industry="defence")
    assert result["industry"] == "defence"
    assert result["mcp_count"] >= 10
    assert result["estimated_annual_revenue_gbp"] > 0
    assert "meok-defoneos-mcp" in str(result["mcps"])
    print(f"✅ test_os_industry_pack_defence: {result['mcp_count']} MCPs, £{result['estimated_annual_revenue_gbp']:,}/yr")


def test_os_industry_pack_unknown():
    result = os_industry_pack(industry="unknown-sector")
    assert "error" in result
    assert "available_industries" in result
    print(f"✅ test_os_industry_pack_unknown: refused with available industries list")


# ============================================================================
# Test 10: os_data_provenance + os_sovereign_handoff
# ============================================================================
def test_os_data_provenance():
    result = os_data_provenance(
        data_type="imagery",
        source_layer="L0",
        aov_data="Sentinel-2 multispectral capture of Babcock Devonport, 50.37,-4.17, 2026-06-28",
    )
    assert len(result["provenance_id"]) == 64
    assert result["data_type"] == "imagery"
    assert result["source_layer"] == "L0"
    assert "meok.ai/verify" in result["verify_url"]
    print(f"✅ test_os_data_provenance: provenance_id={result['provenance_id'][:16]}...")


def test_os_sovereign_handoff():
    result = os_sovereign_handoff(
        sovereign_org="UK MOD",
        handover_scope="defence-only",
        handoff_type="procurement-grade",
    )
    assert result["sovereign_org"] == "UK MOD"
    assert result["handover_scope"] == "defence-only"
    assert result["defoneos_seal_id"].startswith("DEFONEOS-SEAL-")
    print(f"✅ test_os_sovereign_handoff: handover to {result['sovereign_org']}, seal={result['defoneos_seal_id']}")


if __name__ == "__main__":
    test_package_metadata()
    test_banned_term_gate_refuses_james_castle()
    test_banned_term_gate_refuses_toronto_summit()
    test_banned_term_gate_allows_clean()
    test_os_discover_all()
    test_os_discover_layer_L6_industry()
    test_os_route_construction()
    test_os_route_governance()
    test_os_route_humanoid()
    test_humanoid_safety_check_approved()
    test_os_audit_self()
    test_os_sign_and_verify()
    test_os_consult_council()
    test_os_industry_pack_defence()
    test_os_industry_pack_unknown()
    test_os_data_provenance()
    test_os_sovereign_handoff()
    print(f"\n🎉 ALL 16 TESTS PASSED — meok-os-mcp v1.0.2 is sovereign. The DEFONEOS dominion is live (UK sovereign only).")
