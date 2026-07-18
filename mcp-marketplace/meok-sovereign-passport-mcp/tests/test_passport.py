"""Tests for meok-sovereign-passport-mcp."""
import os
import hashlib
import pytest

from meok_sovereign_passport_mcp import (
    VERSION, PROTOCOL,
    create_passport, verify_passport,
    create_delegation, evaluate_intent,
)


# Setup module-scoped key BEFORE pytest collects tests
import tempfile
_TEST_KEY_DIR = tempfile.mkdtemp(prefix="sov_passport_test_")
_TEST_KEY_PATH = os.path.join(_TEST_KEY_DIR, "sov_key.pem")
os.environ["SOV_PASSPORT_KEY"] = _TEST_KEY_PATH


def test_create_and_verify():
    p = create_passport(
        agent_id="agent-1",
        role="trader",
        capabilities=["payments", "refunds"],
        care_floor_validated=True,
        bft_council_id="council-12",
    )
    assert p["agent_id"] == "agent-1"
    assert p["role"] == "trader"
    assert p["capabilities"] == ["payments", "refunds"]
    assert p["care_floor_validated"] is True
    assert p["bft_council_id"] == "council-12"
    assert p["protocol"] == PROTOCOL
    assert p["version"] == VERSION
    assert "kid" in p and "sig" in p
    assert "verify_url" in p
    assert p["verify_url"].startswith("https://proofof.ai/passport/")

    v = verify_passport(p)
    assert v["valid"] is True
    assert v["errors"] == []


def test_tampered_passport_fails_verify():
    p = create_passport("agent-tamper", "trader", ["payments"])
    p["capabilities"] = ["payments", "admin"]
    v = verify_passport(p)
    assert v["valid"] is False
    assert len(v["errors"]) > 0


def test_narrowing_invariant_caps():
    parent = create_passport(
        "parent-1", "trader",
        ["payments", "refunds", "view-balance"],
        care_floor_validated=True, bft_council_id="c1",
    )
    child = create_delegation(
        parent, "child-1", "refunder",
        ["refunds"], spend_limit=100.0,
    )
    assert child["parent_kid"] == parent["kid"]
    assert child["spend_limit"] == 100.0
    v = verify_passport(child)
    assert v["valid"] is True


def test_narrowing_invariant_violated():
    parent = create_passport("parent-2", "trader", ["refunds"])
    with pytest.raises(ValueError, match="narrowing invariant"):
        create_delegation(
            parent, "child-bad", "attacker",
            ["refunds", "admin"],
        )


def test_narrowing_invariant_spend():
    parent = create_passport("parent-3", "trader", ["payments"], spend_limit=100.0)
    with pytest.raises(ValueError, match="narrowing invariant"):
        create_delegation(parent, "child-bad", "trader", ["payments"], spend_limit=500.0)


def test_evaluate_permits_valid():
    p = create_passport("agent-pay", "trader", ["payments"], care_floor_validated=True, spend_limit=100.0)
    r = evaluate_intent(p, "payments", requested_spend=50.0)
    assert r["verdict"] == "permit"
    assert "sig" in r
    assert r["verify_url"].startswith("https://proofof.ai/receipt/")


def test_evaluate_denies_spend_overrun():
    p = create_passport("agent-spend", "trader", ["payments"], spend_limit=100.0)
    r = evaluate_intent(p, "payments", requested_spend=500.0)
    assert r["verdict"] == "deny"
    assert "exceeds limit" in r["reason"]


def test_evaluate_denies_bad_signature():
    p = create_passport("agent-bad-sig", "trader", ["payments"])
    p["capabilities"] = ["admin"]  # tamper
    r = evaluate_intent(p, "admin", requested_spend=0.0)
    assert r["verdict"] == "deny"
    assert "invalid passport signature" in r["reason"]


def test_evaluate_revocation():
    p = create_passport("agent-revoke", "trader", ["payments"])
    def revoke(aid):
        return aid == "agent-revoke"
    r = evaluate_intent(p, "payments", revocation_check=revoke)
    assert r["verdict"] == "deny"
    assert "revoked" in r["reason"]


def test_evaluate_values_floor():
    p = create_passport("agent-floor", "trader", ["harmful-action"], care_floor_validated=True)
    def floor(passport, cap):
        return cap != "harmful-action"
    r = evaluate_intent(p, "harmful-action", values_floor_check=floor)
    assert r["verdict"] == "deny"
    assert "Maternal Covenant" in r["reason"]


def test_verify_url_format():
    p = create_passport("agent-url", "trader", ["x"])
    expected = hashlib.sha256(p["kid"].encode()).hexdigest()[:8]
    assert expected in p["verify_url"]
