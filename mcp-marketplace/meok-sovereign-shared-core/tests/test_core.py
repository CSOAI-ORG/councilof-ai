"""
Tests for meok-sovereign-shared-core
Covers: SIGIL signing, care floor, BFT attestation, A2A cards, Article 50, memory, wrapper
"""
import os
import sys

os.environ["SOV33_SIGIL_KEY"] = "test-sovereign-key"
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from meok_sovereign_core import (
    _sigil_sign, _sigil_verify,
    _check_care_floor, CARE_FLOOR_THRESHOLD,
    _bft_attest, BFT_QUORUM, BFT_TOTAL,
    _build_agent_card, _emit_article50_passport,
    _write_memory_episode, _wrap_sovereign,
    _estimate_care_score, _timestamp,
    get_care_floor, get_bft_quorum, has_ed25519, HAS_ED25519,
    CARE_FLOOR_RULES
)


def test_care_floor_threshold():
    assert CARE_FLOOR_THRESHOLD == 0.95
    assert get_care_floor() == 0.95
    print("✅ test_care_floor_threshold")


def test_care_floor_above_allows():
    r = _check_care_floor(1.0, "test_action")
    assert r["allowed"] is True
    print("✅ test_care_floor_above_allows")


def test_care_floor_exactly_095_allows():
    r = _check_care_floor(0.95, "test")
    assert r["allowed"] is True
    print("✅ test_care_floor_exactly_095_allows")


def test_care_floor_below_vetoes():
    r = _check_care_floor(0.94, "test")
    assert r["allowed"] is False
    assert r["vetoed_by"] == "CARE_FLOOR"
    assert r["care_score"] == 0.94
    print("✅ test_care_floor_below_vetoes")


def test_care_floor_zero_vetoes():
    r = _check_care_floor(0.0, "harmful")
    assert r["allowed"] is False
    print("✅ test_care_floor_zero_vetoes")


def test_sigil_sign_string():
    s = _sigil_sign("test_payload")
    assert len(s) >= 16
    print(f"✅ test_sigil_sign_string (sigil={s[:16]}...)")


def test_sigil_sign_dict():
    s1 = _sigil_sign({"key": "value", "ts": "2026-07-12"})
    s2 = _sigil_sign({"key": "value", "ts": "2026-07-12"})
    assert s1 == s2  # deterministic
    s3 = _sigil_sign({"key": "different", "ts": "2026-07-12"})
    assert s1 != s3
    print("✅ test_sigil_sign_dict")


def test_sigil_verify_roundtrip():
    payload = "test_payload_xyz"
    sigil = _sigil_sign(payload)
    assert _sigil_verify(payload, sigil) is True
    assert _sigil_verify(payload, "wrong_sigil") is False
    print("✅ test_sigil_verify_roundtrip")


def test_bft_quorum_constants():
    assert BFT_QUORUM == 23
    assert BFT_TOTAL == 33
    assert get_bft_quorum() == 23
    print("✅ test_bft_quorum_constants")


def test_bft_attest_quorum_met():
    voters = list(range(1, 24))  # 23 voters
    sigils = {v: f"sig_{v}" for v in voters}
    r = _bft_attest("test_decision", voters, sigils)
    assert r["quorum_met"] is True
    assert r["voter_count"] == 23
    assert "attestation_sigil" in r
    print("✅ test_bft_attest_quorum_met")


def test_bft_attest_quorum_not_met():
    voters = list(range(1, 20))  # 19 voters
    r = _bft_attest("test", voters, {})
    assert r["quorum_met"] is False
    assert r["voter_count"] == 19
    print("✅ test_bft_attest_quorum_not_met")


def test_bft_attest_unique_voters():
    voters = [1, 1, 1, 2, 3, 4, 5]  # 5 unique
    r = _bft_attest("test", voters, {})
    assert r["voter_count"] == 5
    print("✅ test_bft_attest_unique_voters")


def test_build_agent_card():
    card = _build_agent_card(
        "test-mcp",
        "Test MCP description",
        ["capability_1", "capability_2"]
    )
    assert card["name"] == "test-mcp"
    assert card["sovereign_governance_v1"]["care_floor"] == 0.95
    assert card["sovereign_governance_v1"]["bft_quorum"] == "23/33"
    assert card["trust"]["tier"] == "sovereign"
    assert "sigil" in card
    assert card["sovereign_governance_v1"]["biometric"] is False
    print("✅ test_build_agent_card")


def test_build_agent_card_below_floor():
    card = _build_agent_card(
        "low-care",
        "Below floor",
        ["x"],
        care_floor=0.5
    )
    assert card["trust"]["tier"] == "public_sandbox"
    print("✅ test_build_agent_card_below_floor")


def test_article50_passport():
    p = _emit_article50_passport(
        "Test System",
        "MEOK AI Labs"
    )
    assert p["regulation"] == "EU AI Act Article 50"
    assert p["transparency_compliance"]["ai_disclosure"] is True
    assert p["transparency_compliance"]["deepfake_disclosure"] is False
    assert p["transparency_compliance"]["synthetic_content_marking"] is True
    assert p["transparency_compliance"]["user_notification"] is True
    assert "sigil" in p
    print("✅ test_article50_passport")


def test_article50_passport_with_deepfake():
    p = _emit_article50_passport(
        "Deepfake System",
        "Test",
        article50_fields={"deepfake": True}
    )
    assert p["transparency_compliance"]["deepfake_disclosure"] is True
    print("✅ test_article50_passport_with_deepfake")


def test_memory_episode():
    ep = _write_memory_episode(
        "hatch_abc123",
        "User asked about something",
        care_score=0.98,
        tags=["test", "user_query"]
    )
    assert ep["hatch_fingerprint"] == "hatch_abc123"
    assert ep["care_floor_passed"] is True
    assert "sigil" in ep
    assert len(ep["episode_id"]) == 32
    print("✅ test_memory_episode")


def test_memory_episode_below_floor():
    ep = _write_memory_episode("hatch_x", "harmful", care_score=0.5)
    assert ep["care_floor_passed"] is False
    print("✅ test_memory_episode_below_floor")


def test_wrap_sovereign_basic():
    env = _wrap_sovereign("test_tool", {"key": "value"}, care_score=0.98)
    assert env["status"] == "OK"
    assert env["tool"] == "test_tool"
    assert env["result"] == {"key": "value"}
    assert env["care_score"] == 0.98
    assert "sovereign_receipt" in env
    assert "sigil" in env["sovereign_receipt"]
    print("✅ test_wrap_sovereign_basic")


def test_wrap_sovereign_vetoes_low_care():
    env = _wrap_sovereign("harmful_tool", {"x": 1}, care_score=0.5)
    assert env["status"] == "VETOED"
    assert env["vetoed_by"] == "CARE_FLOOR"
    print("✅ test_wrap_sovereign_vetoes_low_care")


def test_wrap_sovereign_with_bft():
    voters = list(range(1, 25))  # 24 voters, above quorum
    env = _wrap_sovereign("bft_tool", {"x": 1}, care_score=0.98, bft_voters=voters)
    assert env["status"] == "OK"
    assert env["sovereign_receipt"]["bft_attestation"]["quorum_met"] is True
    assert env["sovereign_receipt"]["bft_attestation"]["voter_count"] == 24
    print("✅ test_wrap_sovereign_with_bft")


def test_wrap_sovereign_with_memory():
    env = _wrap_sovereign(
        "mem_tool", {"x": 1},
        care_score=0.98,
        hatch_fingerprint="hatch_test"
    )
    assert "memory_episode" in env
    assert env["memory_episode"]["hatch_fingerprint"] == "hatch_test"
    print("✅ test_wrap_sovereign_with_memory")


def test_estimate_care_score_clean():
    s = _estimate_care_score("read sensor data")
    assert s >= 0.9
    print("✅ test_estimate_care_score_clean")


def test_estimate_care_score_harmful():
    s = _estimate_care_score("target individual for weapon")
    assert s < 0.5
    print("✅ test_estimate_care_score_harmful")


def test_estimate_care_score_bounded():
    s = _estimate_care_score("normal")
    assert 0.0 <= s <= 1.0
    print("✅ test_estimate_care_score_bounded")


def test_care_floor_rules_count():
    assert len(CARE_FLOOR_RULES) == 6
    print("✅ test_care_floor_rules_count")


def test_sovereign_governance_v1_in_agent_card():
    card = _build_agent_card("x", "y", ["z"])
    sgv1 = card["sovereign_governance_v1"]
    assert sgv1["care_floor"] == 0.95
    assert sgv1["care_floor_hard"] is True
    assert sgv1["biometric"] is False
    assert sgv1["sovereign_bound"] is True
    assert sgv1["sigil_required"] is True
    print("✅ test_sovereign_governance_v1_in_agent_card")


def test_full_workflow():
    """Test full sovereign workflow: care check → wrap → attest → memory."""
    # 1. Tool call with high care
    env = _wrap_sovereign(
        "production_tool",
        {"data": "result"},
        care_score=0.98,
        bft_voters=[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
        hatch_fingerprint="hatch_xyz"
    )
    assert env["status"] == "OK"
    assert env["sovereign_receipt"]["bft_attestation"]["quorum_met"] is True
    assert "memory_episode" in env

    # 2. Verify card
    card = _build_agent_card("production_tool", "Production tool", ["execute"])
    assert card["trust"]["tier"] == "sovereign"
    assert "sigil" in card

    # 3. Emit Article 50 passport
    passport = _emit_article50_passport("Production Tool", "MEOK")
    assert passport["transparency_compliance"]["ai_disclosure"] is True

    print("✅ test_full_workflow")


if __name__ == "__main__":
    test_care_floor_threshold()
    test_care_floor_above_allows()
    test_care_floor_exactly_095_allows()
    test_care_floor_below_vetoes()
    test_care_floor_zero_vetoes()
    test_sigil_sign_string()
    test_sigil_sign_dict()
    test_sigil_verify_roundtrip()
    test_bft_quorum_constants()
    test_bft_attest_quorum_met()
    test_bft_attest_quorum_not_met()
    test_bft_attest_unique_voters()
    test_build_agent_card()
    test_build_agent_card_below_floor()
    test_article50_passport()
    test_article50_passport_with_deepfake()
    test_memory_episode()
    test_memory_episode_below_floor()
    test_wrap_sovereign_basic()
    test_wrap_sovereign_vetoes_low_care()
    test_wrap_sovereign_with_bft()
    test_wrap_sovereign_with_memory()
    test_estimate_care_score_clean()
    test_estimate_care_score_harmful()
    test_estimate_care_score_bounded()
    test_care_floor_rules_count()
    test_sovereign_governance_v1_in_agent_card()
    test_full_workflow()
    print(f"\n{'='*50}")
    print(f"🛡️  MEOK SOVEREIGN SHARED CORE — ALL 28 TESTS PASS")
    print(f"{'='*50}")