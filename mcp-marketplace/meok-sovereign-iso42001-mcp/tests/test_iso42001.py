"""Tests for meok-sovereign-iso42001-mcp."""
import os, tempfile
_TEST_DIR = tempfile.mkdtemp(prefix="sov_iso_test_")
os.environ["SOV_ISO_KEY"] = os.path.join(_TEST_DIR, "key.pem")
from meok_sovereign_iso42001_mcp import (
    sov_isms_audit, sov_soa_generate, sov_risk_assess,
    sov_internal_audit, sov_isms_status, ISO42001_CONTROLS, VERSION, PROTOCOL,
)


def test_isms_audit_optimised():
    scores = {}
    for cinfo in ISO42001_CONTROLS.values():
        for c in cinfo["controls"]:
            scores[c] = 10
    r = sov_isms_audit("CSOAI", scores)
    assert r["maturity_level"] == "optimised"
    assert r["overall_score"] == 10


def test_isms_audit_initial():
    scores = {}
    for cinfo in ISO42001_CONTROLS.values():
        for c in cinfo["controls"]:
            scores[c] = 1
    r = sov_isms_audit("Test", scores)
    assert r["maturity_level"] == "initial"


def test_soa_generate():
    controls = {cid: "applicable" for cid in ISO42001_CONTROLS}
    r = sov_soa_generate("CSOAI", controls)
    assert r["applicable_count"] == len(ISO42001_CONTROLS)
    assert r["not_applicable_count"] == 0


def test_soa_generate_with_justification():
    controls = {cid: "applicable" for cid in ISO42001_CONTROLS}
    controls["A.10"] = "not_applicable"
    justification = {"A.10": "not relevant to our use cases"}
    r = sov_soa_generate("CSOAI", controls, justification=justification)
    assert r["not_applicable_count"] == 1


def test_risk_assess_critical():
    r = sov_risk_assess("critical AI system", likelihood=5, impact=5)
    assert r["level"] == "critical"
    assert r["score"] == 25
    assert r["treatment"] == "immediate_mitigation"


def test_risk_assess_low():
    r = sov_risk_assess("low risk", likelihood=1, impact=2)
    assert r["level"] == "low"
    assert r["treatment"] == "monitor"


def test_internal_audit_plan():
    r = sov_internal_audit("CSOAI", "2026-Q3")
    assert r["plan"]["clause_count"] >= 30
    assert r["plan"]["duration_days"] == 5


def test_isms_status():
    r = sov_isms_status()
    assert r["clause_count"] >= 30
    assert "ISO/IEC 42001" in r["standard"]


def test_all_signed():
    r = sov_isms_audit("test", {c: 8 for cinfo in ISO42001_CONTROLS.values() for c in cinfo["controls"]})
    assert "kid" in r and "sig" in r
