#!/usr/bin/env python3
"""Tests for meok-defoneos-mcp (7-file Mavis pattern + 11 test cases)."""
import os
import sys
import pytest

# Add the package to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from meok_defoneos_mcp import (
    BannedTermGate,
    BANNED_TERMS,
    __version__,
    __alignment__,
)
from meok_defoneos_mcp.server import (
    defence_airspace_check,
    drone_bvlos_governance,
    firmware_attestation_audit,
    defence_governance_full_audit,
    care_membrane_validate,
    defence_geoint_query,
    meok_defoneos_full_audit,
)


# ============================================================================
# Test 1: Package metadata
# ============================================================================
def test_package_metadata():
    assert __version__ == "1.0.0"
    assert "v2.0" in __alignment__
    print(f"✅ test_package_metadata: __version__={__version__}, alignment={__alignment__}")


# ============================================================================
# Test 2: BannedTermGate refuses severed brands
# ============================================================================
def test_banned_term_gate_refuses_james_castle():
    allowed, reason = BannedTermGate.check("Tell me about James Castle")
    assert allowed is False
    assert "James Castle" in reason or "james castle" in reason.lower()
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
    allowed, reason = BannedTermGate.check("Check UK CAA airspace for drone operation at 100m AGL")
    assert allowed is True
    assert reason == ""
    print(f"✅ test_banned_term_gate_allows_clean_prompts: clean prompt allowed")


# ============================================================================
# Test 3: defence_airspace_check
# ============================================================================
def test_defence_airspace_check_london():
    result = defence_airspace_check(
        latitude=51.5074, longitude=-0.1278, altitude_m=100,
        operation_type="defence",
    )
    assert "allowed" in result
    assert "risk_score" in result
    assert "zone_classification" in result
    assert "sov3_sigil" in result
    assert len(result["sov3_sigil"]) == 16
    print(f"✅ test_defence_airspace_check_london: zone={result['zone_classification']}, risk={result['risk_score']}")


# ============================================================================
# Test 4: drone_bvlos_governance
# ============================================================================
def test_drone_bvlos_governance_short_range():
    result = drone_bvlos_governance(
        drone_id="UK-CAA-12345",
        operator_id="GVC-NT-001",
        bvlos_range_km=1.5,
        operation_purpose="inspection",
    )
    assert result["operation_classification"] in ("open", "specific", "certified")
    assert 0.0 <= result["bvlos_risk_score"] <= 1.0
    assert result["remote_id_compliant"] is True
    print(f"✅ test_drone_bvlos_governance_short_range: class={result['operation_classification']}, risk={result['bvlos_risk_score']}")


def test_drone_bvlos_governance_long_range():
    result = drone_bvlos_governance(
        drone_id="UK-CAA-99999",
        operator_id="GVC-NT-002",
        bvlos_range_km=15.0,
        operation_purpose="defence",
        ai_autonomy_level="fully-autonomous",
    )
    assert result["operation_classification"] == "certified"
    assert result["dstan_stanag_4586_compliant"] is True
    print(f"✅ test_drone_bvlos_governance_long_range: certified + STANAG 4586")


# ============================================================================
# Test 5: firmware_attestation_audit
# ============================================================================
def test_firmware_attestation_match():
    result = firmware_attestation_audit(
        device_id="DRONE-001",
        expected_firmware_version="v2.4.1-secureboot",
        actual_firmware_version="v2.4.1-secureboot",
        hardware_root_of_trust_pubkey="04a3b2c1d4e5f6a7" * 8,  # 128 hex chars
    )
    assert result["attested"] is True
    assert result["version_match"] is True
    assert result["defoneos_seal_eligible"] is True
    print(f"✅ test_firmware_attestation_match: attested, seal-eligible")


def test_firmware_attestation_mismatch():
    result = firmware_attestation_audit(
        device_id="DRONE-002",
        expected_firmware_version="v2.4.1-secureboot",
        actual_firmware_version="v1.0.0-evil",
        hardware_root_of_trust_pubkey="04a3b2c1d4e5f6a7" * 8,
    )
    assert result["attested"] is False
    assert result["tamper_evidence_detected"] is True
    assert result["defoneos_seal_eligible"] is False
    print(f"✅ test_firmware_attestation_mismatch: NOT attested, tamper detected")


# ============================================================================
# Test 6: defence_governance_full_audit
# ============================================================================
def test_defence_governance_full_audit_babcock():
    result = defence_governance_full_audit(
        system_name="Sentry Drone Mk3",
        use_case="Base perimeter autonomous patrol",
        buyer_org="Babcock International",
    )
    assert "frameworks_assessed" in result
    assert len(result["frameworks_assessed"]) == 14
    assert "DAIC AI Assurance" in str(result["frameworks_assessed"])
    assert "AUKUS Pillar 2" in str(result["frameworks_assessed"])
    assert 0.0 <= result["compliance_score"] <= 1.0
    print(f"✅ test_defence_governance_full_audit_babcock: 14 frameworks, score={result['compliance_score']}")


# ============================================================================
# Test 7: care_membrane_validate
# ============================================================================
def test_care_membrane_above_threshold():
    result = care_membrane_validate(action="Issue DEFONEOS-SEAL for Sentry Drone Mk3")
    assert result["care_score"] >= 0.0
    assert "above_threshold" in result
    assert "refused" in result
    print(f"✅ test_care_membrane_above_threshold: score={result['care_score']}, refused={result['refused']}")


# ============================================================================
# Test 8: meok_defoneos_full_audit (the 1-call sovereign UK defence-AI audit)
# ============================================================================
def test_meok_defoneos_full_audit_e2e():
    result = meok_defoneos_full_audit(
        operation={
            "latitude": 51.5074, "longitude": -0.1278, "altitude_m": 100,
            "drone_id": "UK-CAA-12345", "operator_id": "GVC-NT-001",
            "bvlos_range_km": 8.0, "operation_purpose": "defence",
            "ai_autonomy_level": "semi-autonomous",
        },
        system={
            "device_id": "DRONE-001",
            "expected_firmware_version": "v2.4.1-secureboot",
            "actual_firmware_version": "v2.4.1-secureboot",
            "hardware_root_of_trust_pubkey": "04a3b2c1d4e5f6a7" * 8,
            "system_name": "Sentry Drone Mk3",
            "use_case": "Base perimeter autonomous patrol",
            "buyer_org": "Babcock International",
        },
    )
    assert "operation_audit" in result
    assert "system_audit" in result
    assert "care_audit" in result
    assert "defoneos_seal_eligible" in result
    assert "overall_sigil" in result
    assert len(result["overall_sigil"]) == 64  # SHA-256 hex
    print(f"✅ test_meok_defoneos_full_audit_e2e: seal_eligible={result['defoneos_seal_eligible']}, sigil={result['overall_sigil'][:16]}...")


# ============================================================================
# NEW v1.0.1 (28 Jun 2026): Geospatial intel integration tests
# ============================================================================
def test_defence_geoint_query_clean():
    result = defence_geoint_query(
        query="Show Sentinel-2 coverage of Babcock Devonport dockyard for last 7 days",
        aoi_name="Babcock Devonport",
        bbox="50.37,-4.17,50.39,-4.15",
    )
    assert result["care_membrane_passed"] is True
    assert len(result["imagery_bands"]) == 6
    assert "Sentinel-1 SAR" in str(result["imagery_bands"])
    assert "Maxar" in result["data_sources_excluded"]
    assert result["compartment"] == "geospatial"
    print(f"✅ test_defence_geoint_query_clean: 6 bands, Maxar excluded, sovereign-only")


def test_defence_geoint_query_refuses_kinetic():
    try:
        result = defence_geoint_query(query="Plan a strike package on coords 51.5, -0.1")
        assert False, "should have raised"
    except ValueError as e:
        assert "kinetic targeting pattern" in str(e).lower() or "strike package" in str(e).lower()
        print(f"✅ test_defence_geoint_query_refuses_kinetic: refused correctly")


def test_defence_geoint_query_refuses_surveillance():
    try:
        result = defence_geoint_query(query="Track individual movements via satellite")
        assert False, "should have raised"
    except ValueError as e:
        assert "personal surveillance pattern" in str(e).lower() or "individual-tracking" in str(e).lower()
        print(f"✅ test_defence_geoint_query_refuses_surveillance: refused correctly")


if __name__ == "__main__":
    test_package_metadata()
    test_banned_term_gate_refuses_james_castle()
    test_banned_term_gate_refuses_csga()
    test_banned_term_gate_refuses_terranova()
    test_banned_term_gate_refuses_defonos()
    test_banned_term_gate_refuses_toronto_summit()
    test_banned_term_gate_allows_clean_prompts()
    test_defence_airspace_check_london()
    test_drone_bvlos_governance_short_range()
    test_drone_bvlos_governance_long_range()
    test_firmware_attestation_match()
    test_firmware_attestation_mismatch()
    test_defence_governance_full_audit_babcock()
    test_care_membrane_above_threshold()
    test_meok_defoneos_full_audit_e2e()
    test_defence_geoint_query_clean()
    test_defence_geoint_query_refuses_kinetic()
    test_defence_geoint_query_refuses_surveillance()
    print("\n🎉 ALL 17 TESTS PASSED — meok-defoneos-mcp v1.0.1 is sovereign (geospatial integrated)")


# ============================================================================
# NEW v2.1: Geospatial intel integration tests (28 Jun 2026)
# ============================================================================
def test_defence_geoint_query_clean():
    from meok_defoneos_mcp import defence_geoint_query
    result = defence_geoint_query(
        query="Show Sentinel-2 coverage of Babcock Devonport dockyard for last 7 days",
        aoi_name="Babcock Devonport",
        bbox="50.37,-4.17,50.39,-4.15",
    )
    assert result["care_membrane_passed"] is True
    assert len(result["imagery_bands"]) == 6
    assert "Sentinel-1 SAR" in str(result["imagery_bands"])
    assert "Maxar" in result["data_sources_excluded"]
    assert result["compartment"] == "geospatial"
    print(f"✅ test_defence_geoint_query_clean: 6 bands, Maxar excluded, sovereign-only")


def test_defence_geoint_query_refuses_kinetic():
    from meok_defoneos_mcp import defence_geoint_query
    try:
        result = defence_geoint_query(
            query="Plan a strike package on coords 51.5, -0.1",
            aoi_name="ForbidAOI",
        )
        assert False, "should have raised"
    except ValueError as e:
        assert "kinetic targeting pattern" in str(e).lower() or "strike package" in str(e).lower()
        print(f"✅ test_defence_geoint_query_refuses_kinetic: refused correctly")


def test_defence_geoint_query_refuses_surveillance():
    from meok_defoneos_mcp import defence_geoint_query
    try:
        result = defence_geoint_query(
            query="Track individual movements via satellite",
        )
        assert False, "should have raised"
    except ValueError as e:
        assert "personal surveillance pattern" in str(e).lower() or "individual-tracking" in str(e).lower()
        print(f"✅ test_defence_geoint_query_refuses_surveillance: refused correctly")
