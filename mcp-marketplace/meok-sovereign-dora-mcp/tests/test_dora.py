"""Tests for meok-sovereign-dora-mcp."""
import os, tempfile
_TEST_DIR = tempfile.mkdtemp(prefix="sov_dora_test_")
os.environ["SOV_DORA_KEY"] = os.path.join(_TEST_DIR, "key.pem")
from meok_sovereign_dora_mcp import (
    sov_dora_audit, sov_dora_classify, sov_dora_incident,
    sov_dora_resilience, sov_dora_register, DORA_PILLARS, VERSION, PROTOCOL,
)


def test_dora_audit_sovereign():
    scores = {pid: 10 for pid in DORA_PILLARS}
    r = sov_dora_audit("CSOAI", scores)
    assert r["overall_score"] == 10
    assert r["compliance_level"] == "sovereign"
    assert len(r["scores"]) == 5
    assert len(r["gaps"]) == 0


def test_dora_audit_exposed():
    scores = {pid: 2 for pid in DORA_PILLARS}
    r = sov_dora_audit("Test", scores)
    assert r["compliance_level"] == "non_compliant"
    assert len(r["gaps"]) == 5


def test_dora_classify_ctpp_credit():
    r = sov_dora_classify("HSBC UK", employees=100000, is_credit_institution=True)
    assert r["is_ctpp"] is True


def test_dora_classify_non_ctpp():
    r = sov_dora_classify("small_firm", employees=5, is_credit_institution=True)
    assert r["is_ctpp"] is False


def test_dora_classify_insurance():
    r = sov_dora_classify("Munich Re", employees=30000, is_insurance=True)
    assert r["is_ctpp"] is True


def test_dora_incident_critical():
    r = sov_dora_incident("Ransomware encrypts all customer data, full data_loss", affected_users=100000)
    assert r["severity"] == "critical"
    assert r["reporting_deadlines"]["initial"] == "4 hours"


def test_dora_incident_low():
    r = sov_dora_incident("Minor performance degradation")
    assert r["severity"] == "low"


def test_dora_incident_high():
    r = sov_dora_incident("Service outage affecting 20000 users", affected_users=20000, duration_hours=30)
    assert r["severity"] == "high"


def test_dora_resilience_sovereign():
    results = {t: {"passed": True, "last_run": "2026-06-15"} for t in ["vulnerability_assessment", "penetration_testing", "stress_testing", "red_team", "scenario_testing"]}
    r = sov_dora_resilience(results)
    assert r["resilience_level"] == "sovereign"
    assert r["overall_score"] == 10


def test_dora_resilience_exposed():
    results = {t: {"passed": False} for t in ["vulnerability_assessment", "penetration_testing", "stress_testing", "red_team", "scenario_testing"]}
    r = sov_dora_resilience(results)
    assert r["resilience_level"] == "exposed"


def test_dora_register_valid_lei():
    r = sov_dora_register("HSBC UK", "20HU8550TFCT4RW2P530")
    assert r["lei"] == "20HU8550TFCT4RW2P530"
    assert r["register_id"]


def test_dora_register_invalid_lei():
    r = sov_dora_register("Test", "SHORT-LEI")
    assert "error" in r


def test_all_signed():
    r = sov_dora_audit("test", {pid: 8 for pid in DORA_PILLARS})
    assert "kid" in r and "sig" in r
