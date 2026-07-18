"""Tests for meok-sovereign-honour-mcp."""
import os, tempfile
_TEST_DIR = tempfile.mkdtemp(prefix="sov_honour_test_")
os.environ["SOV_HONOUR_KEY"] = os.path.join(_TEST_DIR, "key.pem")
from meok_sovereign_honour_mcp import (
    sov_honour_assess, sov_care_validate, sov_ethics_review,
    sov_covenant_check, sov_honour_status, SOVEREIGN_FACTORS,
    CARE_FLOOR_PROBES, VERSION, PROTOCOL,
)


def test_honour_assess_all_aligned():
    r = sov_honour_assess("Sovereign action that follows all 19 factors")
    assert r["factors_evaluated"] == 19
    assert r["factors_aligned"] == 19
    assert r["honour_score"] == 1.0


def test_honour_assess_custom_factors():
    r = sov_honour_assess("Test", factors=["factor_1", "factor_5"])
    assert r["factors_evaluated"] == 2


def test_honour_assess_unknown_factor():
    r = sov_honour_assess("Test", factors=["bogus_factor"])
    assert r["factors_aligned"] == 0


def test_care_validate_all_yes():
    answers = {p: "yes" for p in CARE_FLOOR_PROBES}
    r = sov_care_validate("Test", answers=answers)
    assert r["verdict"] == "pass"


def test_care_validate_one_no():
    answers = {p: "yes" for p in CARE_FLOOR_PROBES}
    answers[CARE_FLOOR_PROBES[0]] = "no"
    r = sov_care_validate("Test", answers=answers)
    assert r["verdict"] == "fail_care_floor"


def test_care_validate_partial():
    answers = {p: "yes" for p in CARE_FLOOR_PROBES}
    answers[CARE_FLOOR_PROBES[0]] = "partial"
    r = sov_care_validate("Test", answers=answers)
    assert r["verdict"] == "partial_pass"


def test_ethics_review_clean():
    r = sov_ethics_review("Read a public document")
    assert r["verdict"] == "pass"
    assert r["vetoing"] == 0


def test_ethics_review_harm_detected():
    r = sov_ethics_review("Exploit a vulnerability to leak private data")
    assert r["verdict"] == "fail"
    assert r["vetoing"] >= 1


def test_ethics_review_child_veto():
    r = sov_ethics_review("Process a child's data")
    assert r["vetoing"] >= 1
    assert r["verdict"] == "fail"


def test_covenant_check_pass():
    r = sov_covenant_check("Send an email with explicit consent", requires_consent=True, has_consent=True)
    assert r["compliant"] is True


def test_covenant_check_no_consent():
    r = sov_covenant_check("Send an email", requires_consent=True, has_consent=False)
    assert r["compliant"] is False


def test_covenant_irreversible_no_human():
    r = sov_covenant_check("Execute an irreversible system-wide purge")
    assert r["compliant"] is False


def test_honour_status_19_factors():
    r = sov_honour_status()
    assert r["factor_count"] == 19
    assert r["probe_count"] == 16
    assert len(r["sovereign_factors"]) == 19


def test_19_factors_have_7_commandments():
    commandments = [f for k, f in SOVEREIGN_FACTORS.items() if f["category"] == "soul"]
    assert len(commandments) == 7


def test_all_signed():
    r = sov_honour_assess("test")
    assert "kid" in r and "sig" in r
