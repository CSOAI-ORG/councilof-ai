"""Tests for meok-sovereign-vertical-compliance-mcp (6 verticals)."""
import os, tempfile
_TEST_DIR = tempfile.mkdtemp(prefix="sov_vc_test_")
os.environ["SOV_VC_KEY"] = os.path.join(_TEST_DIR, "key.pem")
from meok_sovereign_vertical_compliance_mcp import (
    compliance_eu_ai_act, compliance_dora, compliance_jsp936,
    compliance_iso42001, compliance_nis2, compliance_nist_rmf,
)


def test_eu_ai_act_basic():
    code = """
def main():
    user_input = ask_user()
    if kill_switch_pressed(): halt()
    log(user_input, audit_trail)
    if is_high_risk(user_input): request_human_review(user_input)
    return safe_response(user_input)
"""
    r = compliance_eu_ai_act(code=code)
    assert r["framework"] == "EU AI Act (Aug 2 2026)"
    assert r["total"] == 8
    assert r["articles"]["art. 14"]["satisfied"] is True


def test_eu_ai_act_empty():
    r = compliance_eu_ai_act()
    assert r["satisfied"] == 0
    assert r["overall_pass"] is False


def test_dora_default():
    r = compliance_dora(pillar_scores={"pillar_1": 7, "pillar_2": 7, "pillar_3": 7, "pillar_4": 7, "pillar_5": 7})
    assert r["framework"] == "EU DORA"
    assert r["overall"] == 7.0
    assert r["compliance_level"] == "robust"


def test_dora_hsbc():
    r = compliance_dora(
        pillar_scores={"pillar_1": 10, "pillar_2": 9, "pillar_3": 8, "pillar_4": 7, "pillar_5": 10},
        entity="HSBC UK", entity_type="credit_institution",
        employees=200000, is_credit_institution=True
    )
    assert r["overall"] == 8.8
    assert r["is_ctpp"] is True


def test_dora_small_company():
    r = compliance_dora(
        pillar_scores={"pillar_1": 5, "pillar_2": 5, "pillar_3": 5, "pillar_4": 5, "pillar_5": 5},
        entity="Tiny", employees=10
    )
    assert r["is_ctpp"] is False
    assert r["overall"] == 5.0


def test_jsp936_default():
    r = compliance_jsp936(pillar_scores={"pillar_1": 1.0, "pillar_2": 1.0, "pillar_3": 1.0, "pillar_4": 1.0, "pillar_5": 1.0})
    assert r["framework"] == "JSP 936 (NATO)"
    assert r["assurance"] == "sovereign"  # 5/5 = 1.0 = sovereign
    assert r["overall"] == 1.0


def test_jsp936_iwc():
    r = compliance_jsp936(scans_per_day=100, detected=90, neutralised=85)
    # (90*0.4 + 85*0.6)/100 = (36+51)/100 = 0.87
    assert abs(r["iwc"] - 0.87) < 0.01
    assert r["iwc_tier"] == "sovereign"


def test_iso42001_default():
    r = compliance_iso42001()
    assert r["framework"] == "ISO/IEC 42001 AIMS"
    assert r["maturity_level"] == "established"
    assert len(r["clause_scores"]) == 7


def test_iso42001_mature():
    r = compliance_iso42001({f"clause_{c}": 10 for c in [4, 5, 6, 7, 8, 9, 10]})
    assert r["overall"] == 10.0
    assert r["maturity_level"] == "mature"


def test_nis2_essential():
    r = compliance_nis2(entity_sector="energy")
    assert r["is_essential_entity"] is True


def test_nis2_not_essential():
    r = compliance_nis2(entity_sector="food")
    assert r["is_essential_entity"] is False


def test_nis2_all_measures():
    r = compliance_nis2(entity_sector="health",
                       measures={m: True for m in [
                           "risk_analysis", "incident_handling", "business_continuity",
                           "supply_chain_security", "vulnerability_handling", "cryptography",
                           "access_control", "secure_communications", "training",
                           "human_resources_security"]})
    assert r["pass_rate"] == 1.0


def test_nist_rmf_default():
    r = compliance_nist_rmf()
    assert r["framework"] == "NIST AI RMF"
    assert r["maturity_level"] == "established"
    assert len(r["function_scores"]) == 4


def test_nist_rmf_govern_only():
    r = compliance_nist_rmf({"GOVERN": 10, "MAP": 1, "MEASURE": 1, "MANAGE": 1})
    # Average = 3.25 → initial
    assert r["overall"] == 3.25
    assert r["maturity_level"] == "initial"


def test_no_external_deps():
    import meok_sovereign_vertical_compliance_mcp as m
    src = open(m.__file__).read()
    assert "import ollama" not in src
    assert "import urllib" not in src
    assert "import requests" not in src


def test_signed_outputs():
    for func in [compliance_eu_ai_act, compliance_dora, compliance_jsp936,
                 compliance_iso42001, compliance_nis2, compliance_nist_rmf]:
        if func is compliance_eu_ai_act:
            r = func(code="test")
        elif func is compliance_nis2:
            r = func(entity_sector="energy")
        elif func is compliance_dora:
            r = func(pillar_scores={"pillar_1": 7, "pillar_2": 7, "pillar_3": 7, "pillar_4": 7, "pillar_5": 7})
        elif func is compliance_jsp936:
            r = func(pillar_scores={"pillar_1": 1.0, "pillar_2": 1.0, "pillar_3": 1.0, "pillar_4": 1.0, "pillar_5": 1.0})
        elif func is compliance_iso42001:
            r = func()
        elif func is compliance_nis2:
            r = func()
        elif func is compliance_nist_rmf:
            r = func()
        assert "kid" in r
        assert "sig" in r
        assert "ts" in r


def test_all_6_verticals():
    """All 6 verticals can be checked."""
    r1 = compliance_eu_ai_act(code="main(): pass")
    r2 = compliance_dora(pillar_scores={"pillar_1": 7, "pillar_2": 7, "pillar_3": 7, "pillar_4": 7, "pillar_5": 7})
    r3 = compliance_jsp936(pillar_scores={"pillar_1": 1.0, "pillar_2": 1.0, "pillar_3": 1.0, "pillar_4": 1.0, "pillar_5": 1.0})
    r4 = compliance_iso42001()
    r5 = compliance_nis2()
    r6 = compliance_nist_rmf()
    assert all("framework" in r for r in [r1, r2, r3, r4, r5, r6])