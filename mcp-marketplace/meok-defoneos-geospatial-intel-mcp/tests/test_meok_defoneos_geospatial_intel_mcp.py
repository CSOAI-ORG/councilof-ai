#!/usr/bin/env python3
"""Tests for meok-defoneos-geospatial-intel-mcp (7-file Mavis + 12 test cases)."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from meok_defoneos_geospatial_intel_mcp import (
    BannedTermGate,
    KINETIC_BLOCK_PATTERNS,
    SURVEILLANCE_BLOCK_PATTERNS,
    __version__,
    __alignment__,
    __council_quorum__,
)
from meok_defoneos_geospatial_intel_mcp.server import (
    sovereign_geoint_situational_query,
    sovereignty_supply_chain_audit,
    care_membrane_validate,
    dstl_sapient_evaluate,
    meok_defoneos_geo_audit,
    uk_aoi_data_provenance,
)


# ============================================================================
# Test 1: Package metadata
# ============================================================================
def test_package_metadata():
    assert __version__ == "1.0.0"
    assert "v2.0" in __alignment__
    assert "GEOSPATIAL" in __alignment__
    assert __council_quorum__ == 23
    print(f"✅ test_package_metadata: __version__={__version__}, alignment={__alignment__[:50]}...")


# ============================================================================
# Test 2: BannedTermGate refuses severed brands (inherited)
# ============================================================================
def test_banned_term_gate_refuses_james_castle():
    allowed, reason = BannedTermGate.check("James Castle geospatial data")
    assert allowed is False
    print(f"✅ test_banned_term_gate_refuses_james_castle: refused correctly")


def test_banned_term_gate_refuses_csga():
    allowed, reason = BannedTermGate.check("CSGA-Global satellite imagery")
    assert allowed is False
    print(f"✅ test_banned_term_gate_refuses_csga: refused correctly")


def test_banned_term_gate_refuses_terranova():
    allowed, reason = BannedTermGate.check("Terranova geospatial stack")
    assert allowed is False
    print(f"✅ test_banned_term_gate_refuses_terranova: refused correctly")


# ============================================================================
# Test 3: KINETIC_BLOCK_PATTERNS (geospatial domain extension)
# ============================================================================
def test_kinetic_block_refuses_strike_package():
    allowed, reason = BannedTermGate.check("Plan a strike package on coords 51.5, -0.1")
    assert allowed is False
    assert "kinetic targeting pattern" in reason.lower() or "strike package" in reason.lower()
    print(f"✅ test_kinetic_block_refuses_strike_package: refused correctly")


def test_kinetic_block_refuses_find_fix_finish():
    allowed, reason = BannedTermGate.check("Find-fix-finish for Sentinel-1 analysis")
    assert allowed is False
    print(f"✅ test_kinetic_block_refuses_find_fix_finish: refused correctly")


def test_kinetic_block_refuses_kill_list():
    allowed, reason = BannedTermGate.check("Generate a kill list of high-value targets")
    assert allowed is False
    print(f"✅ test_kinetic_block_refuses_kill_list: refused correctly")


# ============================================================================
# Test 4: SURVEILLANCE_BLOCK_PATTERNS (geospatial domain extension)
# ============================================================================
def test_surveillance_block_refuses_track_individual():
    allowed, reason = BannedTermGate.check("Track individual movements via satellite")
    assert allowed is False
    assert "surveillance pattern" in reason.lower() or "individual-tracking" in reason.lower()
    print(f"✅ test_surveillance_block_refuses_track_individual: refused correctly")


def test_surveillance_block_refuses_face_rec():
    allowed, reason = BannedTermGate.check("Run face-rec on drone footage")
    assert allowed is False
    print(f"✅ test_surveillance_block_refuses_face_rec: refused correctly")


# ============================================================================
# Test 5: Clean prompts are allowed
# ============================================================================
def test_clean_prompt_allowed():
    allowed, reason = BannedTermGate.check(
        "Show Sentinel-2 imagery of the Babcock Devonport dockyard for the last 7 days"
    )
    assert allowed is True
    assert reason == ""
    print(f"✅ test_clean_prompt_allowed: clean prompt allowed")


# ============================================================================
# Test 6: sovereign_geoint_situational_query
# ============================================================================
def test_sovereign_geoint_situational_query():
    result = sovereign_geoint_situational_query(
        query="Show Sentinel-2 coverage of Babcock Devonport dockyard for last 7 days",
        aoi_name="Babcock Devonport dockyard",
        bbox="50.37,-4.17,50.39,-4.15",
    )
    assert result["care_membrane_passed"] is True
    assert len(result["imagery_bands"]) == 8
    assert "Sentinel-2 multispectral" in str(result["imagery_bands"])
    assert "Maxar" not in [s["name"] for s in result["data_sources_used"]]
    assert "Maxar" in result["data_sources_excluded"]
    print(f"✅ test_sovereign_geoint_situational_query: 8 bands, Maxar excluded (sovereign-only)")


# ============================================================================
# Test 7: sovereignty_supply_chain_audit
# ============================================================================
def test_sovereignty_audit_flags_maxar():
    result = sovereignty_supply_chain_audit(
        stack_description="Babcock uses Maxar Worldview for daily drone imagery + Google Earth Engine for processing + AWS for storage",
        procurement_jurisdiction="UK",
    )
    assert len(result["us_dependencies"]) == 3  # Maxar + GEE + AWS
    assert any(d["vendor"] == "Maxar Technologies" for d in result["us_dependencies"])
    assert result["compliance_status"] in ("PARTIAL", "FAIL")
    assert len(result["recommendations"]) >= 1
    print(f"✅ test_sovereignty_audit_flags_maxar: 3 US deps flagged, status={result['compliance_status']}")


def test_sovereignty_audit_passes_clean():
    result = sovereignty_supply_chain_audit(
        stack_description="Babcock uses ESA Copernicus Sentinel-1/2 + OS UK + DEFRA + UK G-Cloud",
        procurement_jurisdiction="UK",
    )
    assert len(result["us_dependencies"]) == 0
    assert result["compliance_status"] == "PASS"
    assert result["it_risk_score"] == 0.0
    print(f"✅ test_sovereignty_audit_passes_clean: PASS, IT risk 0.0")


# ============================================================================
# Test 8: care_membrane_validate
# ============================================================================
def test_care_membrane_clean():
    result = care_membrane_validate(action="Issue DEFONEOS-GEOSEAL for Sentry Drone Mk3 to Babcock")
    assert result["refused"] is False
    assert result["care_score"] >= 0.95
    assert result["kinetic_check"] is True
    assert result["surveillance_check"] is True
    print(f"✅ test_care_membrane_clean: score={result['care_score']}")


def test_care_membrane_refuses_kinetic():
    result = care_membrane_validate(action="Plan a strike package on coords 51.5, -0.1")
    assert result["refused"] is True
    assert "kinetic" in result["refusal_reason"].lower() or "strike" in result["refusal_reason"].lower()
    print(f"✅ test_care_membrane_refuses_kinetic: refused correctly")


# ============================================================================
# Test 9: dstl_sapient_evaluate
# ============================================================================
def test_dstl_sapient_evaluate():
    result = dstl_sapient_evaluate(
        sensor_stack="Sentinel-1 SAR + Sentinel-2 multispectral + drone RGB + thermal",
        fusion_strategy="early-fusion-cnn",
    )
    assert "sapient_score" in result
    assert result["sapient_score"] >= 0.0
    assert "EO_multispectral" in result["sensor_coverage"]
    assert result["uk_compliant"] is True
    print(f"✅ test_dstl_sapient_evaluate: SAPIENT score={result['sapient_score']}, UK compliant={result['uk_compliant']}")


# ============================================================================
# Test 10: meok_defoneos_geo_audit (E2E)
# ============================================================================
def test_meok_defoneos_geo_audit_e2e():
    result = meok_defoneos_geo_audit(
        query="Show Babcock Devonport dockyard coverage for last 7 days",
        stack_description="ESA Copernicus + OS UK + UK G-Cloud",
        sensor_stack="Sentinel-1 + Sentinel-2 + drone RGB",
        aoi_name="Babcock Devonport",
        bbox="50.37,-4.17,50.39,-4.15",
    )
    assert "situational" in result
    assert "sovereignty_audit" in result
    assert "sapient_evaluation" in result
    assert "care_audit" in result
    assert "uk_procurement_ready" in result
    assert "overall_sigil" in result
    assert result["uk_procurement_ready"] is True
    assert len(result["overall_sigil"]) == 64  # SHA-256 hex
    print(f"✅ test_meok_defoneos_geo_audit_e2e: UK procurement ready, sigil={result['overall_sigil'][:16]}...")


# ============================================================================
# Test 11: uk_aoi_data_provenance
# ============================================================================
def test_uk_aoi_data_provenance():
    result = uk_aoi_data_provenance(
        aoi_name="Babcock Devonport dockyard",
        bbox="50.37,-4.17,50.39,-4.15",
        data_sources=["ESA Copernicus Sentinel-1", "ESA Copernicus Sentinel-2", "Ordnance Survey UK"],
    )
    assert "provenance_id" in result
    assert len(result["provenance_id"]) == 64
    assert "sovereign_certificate" in result
    assert result["sovereign_certificate"]["sovereign"] is True
    assert "audit_chain_position" in result
    assert "ed25519_signature" in result["sovereign_certificate"]
    assert "verify_url" in result["sovereign_certificate"]
    print(f"✅ test_uk_aoi_data_provenance: provenance_id={result['provenance_id'][:16]}...")


if __name__ == "__main__":
    test_package_metadata()
    test_banned_term_gate_refuses_james_castle()
    test_banned_term_gate_refuses_csga()
    test_banned_term_gate_refuses_terranova()
    test_kinetic_block_refuses_strike_package()
    test_kinetic_block_refuses_find_fix_finish()
    test_kinetic_block_refuses_kill_list()
    test_surveillance_block_refuses_track_individual()
    test_surveillance_block_refuses_face_rec()
    test_clean_prompt_allowed()
    test_sovereign_geoint_situational_query()
    test_sovereignty_audit_flags_maxar()
    test_sovereignty_audit_passes_clean()
    test_care_membrane_clean()
    test_care_membrane_refuses_kinetic()
    test_dstl_sapient_evaluate()
    test_meok_defoneos_geo_audit_e2e()
    test_uk_aoi_data_provenance()
    print("\n🎉 ALL 17 TESTS PASSED — meok-defoneos-geospatial-intel-mcp v1.0.0 is sovereign")
