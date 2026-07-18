"""Tests for meok-sovereign-compliance-passport-mcp (12-framework crosswalk)."""
import os, tempfile
_TEST_DIR = tempfile.mkdtemp(prefix="sov_pass_test_")
os.environ["SOV_PASS_KEY"] = os.path.join(_TEST_DIR, "key.pem")
from meok_sovereign_compliance_passport_mcp import (
    passport_issue, passport_get, passport_update, passport_verify, passport_crosswalk,
    FRAMEWORKS, CROSSWALKS,
)


def test_12_frameworks():
    assert len(FRAMEWORKS) == 12


def test_15_crosswalks():
    """15 controls, each satisfying 3-8 frameworks."""
    assert len(CROSSWALKS) == 15
    for c in CROSSWALKS:
        assert c["satisfies"] >= 1


def test_issue_basic():
    r = passport_issue("HSBC UK", sector="banking", region="UK")
    assert r["organization"] == "HSBC UK"
    assert r["sector"] == "banking"
    assert r["region"] == "UK"
    assert r["framework_count"] == 12
    assert r["status"] == "ACTIVE"


def test_issue_with_filtered_frameworks():
    r = passport_issue("HSBC", frameworks_to_audit=[1, 2, 4])  # AI Act + DORA + GDPR
    assert r["framework_count"] == 3


def test_get_existing():
    r1 = passport_issue("HSBC", sector="banking", region="UK")
    pid = r1["passport_id"]
    r2 = passport_get(pid)
    assert r2["organization"] == "HSBC"


def test_get_unknown():
    r = passport_get("nonexistent")
    assert "error" in r


def test_update_score():
    r1 = passport_issue("HSBC")
    pid = r1["passport_id"]
    r2 = passport_update(pid, 1, 8)  # EU AI Act score 8
    assert r2["frameworks"][1]["score"] == 8
    assert r2["frameworks"][1]["status"] == "CERTIFIED"


def test_update_score_clamp():
    """Score clamped to 0-10."""
    r1 = passport_issue("HSBC")
    pid = r1["passport_id"]
    r2 = passport_update(pid, 1, 15)  # Should clamp to 10
    assert r2["frameworks"][1]["score"] == 10
    r3 = passport_update(pid, 1, -5)  # Should clamp to 0
    assert r3["frameworks"][1]["score"] == 0


def test_update_unknown_passport():
    r = passport_update("nonexistent", 1, 5)
    assert "error" in r


def test_update_unknown_framework():
    r1 = passport_issue("HSBC")
    r = passport_update(r1["passport_id"], 99, 5)
    assert "error" in r


def test_verify_valid_passport():
    r1 = passport_issue("HSBC")
    pid = r1["passport_id"]
    r2 = passport_verify(pid)
    assert r2["valid"] is True


def test_verify_unknown():
    r = passport_verify("nonexistent")
    assert "error" in r


def test_crosswalk_all():
    r = passport_crosswalk()
    assert r["control_count"] == 15
    assert r["max_satisfies"] >= 5


def test_crosswalk_specific():
    r = passport_crosswalk("audit_logging")
    assert r["control"] == "audit_logging"
    assert "audit_logging" in [c["control"] for c in r["crosswalks"]]


def test_crosswalk_unknown():
    r = passport_crosswalk("nonexistent")
    assert "error" in r


def test_audit_logging_satisfies_most():
    """Per the crosswalk: audit_logging satisfies 8 frameworks (most)."""
    cw = next(c for c in CROSSWALKS if c["control"] == "audit_logging")
    assert cw["satisfies"] == 8


def test_no_external_deps():
    import meok_sovereign_compliance_passport_mcp as m
    src = open(m.__file__).read()
    assert "import ollama" not in src
    assert "import urllib" not in src
    assert "import requests" not in src


def test_signed_outputs():
    r1 = passport_issue("HSBC")
    assert "kid" in r1 and "sig" in r1 and "ts" in r1
    r2 = passport_get(r1["passport_id"])
    assert "kid" in r2 and "sig" in r2 and "ts" in r2
    r3 = passport_update(r1["passport_id"], 1, 8)
    assert "kid" in r3 and "sig" in r3 and "ts" in r3
    r4 = passport_verify(r1["passport_id"])
    assert "kid" in r4 and "sig" in r4 and "ts" in r4
    r5 = passport_crosswalk()
    assert "kid" in r5 and "sig" in r5 and "ts" in r5


def test_12_frameworks_have_unique_ids():
    ids = [f["id"] for f in FRAMEWORKS]
    assert len(ids) == len(set(ids))