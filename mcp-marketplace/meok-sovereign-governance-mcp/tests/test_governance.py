"""Tests for meok-sovereign-governance-mcp."""
import os, tempfile

_TEST_DIR = tempfile.mkdtemp(prefix="sov_gov_test_")
os.environ["SOV_GOVERNANCE_KEY"] = os.path.join(_TEST_DIR, "key.pem")

from meok_sovereign_governance_mcp import (
    policy_evaluate, segmentation_zone, maturity_assess, incident_killswitch,
    MaturityLevel, LEVEL_SCOPE, VERSION, PROTOCOL,
)


def test_intern_can_read():
    r = policy_evaluate("agent-1", "get_user", "/users/me", agent_level="intern")
    assert r["verdict"] == "allow"
    assert "kid" in r and "sig" in r
    assert r["verify_url"].startswith("https://proofof.ai/governance/")


def test_intern_cannot_act():
    r = policy_evaluate("agent-1", "delete_user", "/users/me", agent_level="intern")
    assert r["verdict"] == "escalate"  # INTERN can only observe/report


def test_junior_can_recommend():
    r = policy_evaluate("agent-1", "suggest_plan", "/api", agent_level="junior")
    assert r["verdict"] == "allow"


def test_junior_cannot_act():
    r = policy_evaluate("agent-1", "send_email", "/api", agent_level="junior")
    assert r["verdict"] == "deny"


def test_senior_can_act():
    r = policy_evaluate("agent-1", "send_email", "/api", agent_level="senior", care_floor_validated=True)
    assert r["verdict"] == "allow"


def test_senior_sensitive_requires_care_floor():
    r = policy_evaluate("agent-1", "delete_record", "/api", agent_level="senior", care_floor_validated=False)
    assert r["verdict"] == "deny"
    assert "Maternal Covenant" in r["reason"]


def test_principal_can_delegate():
    r = policy_evaluate("agent-1", "spawn_subagent", "/api", agent_level="principal", bft_council_id="c1")
    assert r["verdict"] == "allow"


def test_principal_override_requires_bft():
    r = policy_evaluate("agent-1", "bypass_safety", "/api", agent_level="principal", bft_council_id=None)
    assert r["verdict"] == "escalate"
    assert "BFT council" in r["reason"]


def test_unknown_level_denied():
    r = policy_evaluate("agent-1", "get_user", "/api", agent_level="ceo")
    assert r["verdict"] == "deny"


def test_segmentation_in_zone():
    r = segmentation_zone("agent-1", "/users/me", ["/users/*", "/admin/*"])
    assert r["verdict"] == "allow"


def test_segmentation_wildcard():
    r = segmentation_zone("agent-1", "/users/123/profile", ["/users/*"])
    assert r["verdict"] == "allow"


def test_segmentation_out_of_zone():
    r = segmentation_zone("agent-1", "/admin/secrets", ["/users/*"])
    assert r["verdict"] == "deny"


def test_maturity_assess_intern_passes():
    r = maturity_assess("agent-1", "intern")
    assert r["verdict"] == "allow"


def test_maturity_assess_junior_requires_100_actions():
    r = maturity_assess("agent-1", "junior", successful_actions=50, bft_council_approved=True)
    assert r["verdict"] == "deny"
    assert "successful_actions" in r["reason"]


def test_maturity_assess_junior_passes():
    r = maturity_assess("agent-1", "junior", successful_actions=100, incidents_total=0, bft_council_approved=True)
    assert r["verdict"] == "allow"


def test_maturity_assess_senior_requires_care_floor():
    r = maturity_assess("agent-1", "senior",
                         successful_actions=1000, incidents_total=0,
                         care_floor_passed=90, care_floor_total=100, bft_council_approved=True)
    assert r["verdict"] == "deny"
    assert "care_floor_ratio" in r["reason"]


def test_maturity_assess_principal_high_bar():
    r = maturity_assess("agent-1", "principal",
                         successful_actions=5000, incidents_total=2,
                         care_floor_passed=98, care_floor_total=100, bft_council_approved=True)
    assert r["verdict"] == "deny"


def test_maturity_assess_principal_passes():
    r = maturity_assess("agent-1", "principal",
                         successful_actions=15000, incidents_total=0,
                         care_floor_passed=995, care_floor_total=1000, bft_council_approved=True)
    assert r["verdict"] == "allow"


def test_killswitch_blocks():
    r = incident_killswitch("agent-bad", "Produced harmful output", "critical")
    assert r["status"] == "killed"
    assert r["all_actions_blocked"] is True
    assert r["agent_id"] == "agent-bad"


def test_decisions_signed():
    r = policy_evaluate("agent-1", "get_x", "/y", agent_level="intern")
    assert r["protocol"] == PROTOCOL
    assert r["version"] == VERSION
    assert "kid" in r and "sig" in r
