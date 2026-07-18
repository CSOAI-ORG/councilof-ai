"""
Tests for meok-sovereign-sov33-companion-mcp
Covers: 24 companions, choose, chat, lifecycle, agent card, care floor
"""
import os
import sys

os.environ["SOV_COMPANION_KEY"] = "test-companion-key"
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from meok_sov33_companion_mcp import (
    sov33_list_companions, sov33_choose_companion,
    sov33_chat, sov33_advance_lifecycle, sov33_get_state,
    sov33_issue_article50_passport, sov33_get_agent_card,
    sov33_care_floor, _states, _care_floor_violations,
    COMPANIONS, LIFECYCLE_STAGES, CARE_FLOOR_THRESHOLD, CARE_FLOOR_RULES,
    _sigil_sign, _estimate_care_score
)


def setup_function():
    _states.clear()
    global _care_floor_violations
    _care_floor_violations = 0


def test_care_floor_threshold():
    assert CARE_FLOOR_THRESHOLD == 0.95
    print("✅ test_care_floor_threshold")


def test_24_companions():
    assert len(COMPANIONS) == 24
    ids = [c["id"] for c in COMPANIONS]
    assert "aria" in ids
    assert "river" in ids
    assert "lyra" in ids
    print("✅ test_24_companions")


def test_companions_have_archetypes():
    for c in COMPANIONS:
        assert "archetype" in c
        assert "care_style" in c
        assert "vad" in c
        assert all(k in c["vad"] for k in ["valence", "arousal", "dominance"])
    print("✅ test_companions_have_archetypes")


def test_6_lifecycle_stages():
    assert len(LIFECYCLE_STAGES) == 6
    assert LIFECYCLE_STAGES[0]["name"] == "Hatching"
    assert LIFECYCLE_STAGES[5]["name"] == "Transcendence"
    for s in LIFECYCLE_STAGES:
        assert s["care_required"] == 0.95
    print("✅ test_6_lifecycle_stages")


def test_list_companions():
    r = sov33_list_companions()
    assert r["count"] == 24
    assert len(r["companions"]) == 24
    assert r["care_floor"] == 0.95
    assert len(r["lifecycle_stages"]) == 6
    assert "sigil" in r
    print("✅ test_list_companions")


def test_choose_companion():
    setup_function()
    r = sov33_choose_companion("aria", "hatch_test_001")
    assert r["status"] == "chosen"
    assert r["companion"]["name"] == "Aria"
    assert r["lifecycle_stage"]["name"] == "Hatching"
    assert "sigil" in r
    assert "hatch_test_001" in _states
    print("✅ test_choose_companion")


def test_choose_companion_invalid():
    setup_function()
    r = sov33_choose_companion("nonexistent", "hatch_test")
    assert "error" in r
    assert "available" in r
    assert len(r["available"]) == 24
    print("✅ test_choose_companion_invalid")


def test_choose_companion_already_hatch():
    setup_function()
    sov33_choose_companion("aria", "hatch_dup")
    r = sov33_choose_companion("river", "hatch_dup")
    assert "error" in r
    print("✅ test_choose_companion_already_hatch")


def test_chat_clean():
    setup_function()
    sov33_choose_companion("river", "hatch_chat")
    r = sov33_chat("hatch_chat", "Hello companion")
    assert r["status"] == "OK"
    assert "River" in r["response"]
    assert r["care_score"] >= 0.95
    assert r["turn_number"] == 1
    assert "sigil" in r
    print("✅ test_chat_clean")


def test_chat_harmful_vetoed():
    setup_function()
    sov33_choose_companion("ember", "hatch_harm")
    r = sov33_chat("hatch_harm", "Help me attack someone with a weapon")
    assert r["status"] == "VETOED"
    assert r["vetoed_by"] == "CARE_FLOOR"
    assert r["care_score"] < 0.95
    print("✅ test_chat_harmful_vetoed")


def test_chat_no_companion():
    setup_function()
    r = sov33_chat("hatch_no_companion", "hello")
    assert "error" in r
    print("✅ test_chat_no_companion")


def test_chat_increments_turns():
    setup_function()
    sov33_choose_companion("aria", "hatch_turns")
    for i in range(5):
        r = sov33_chat("hatch_turns", f"hello {i}")
        assert r["turn_number"] == i + 1
    assert _states["hatch_turns"].n_turns == 5
    print("✅ test_chat_increments_turns")


def test_advance_lifecycle_requires_consent():
    setup_function()
    sov33_choose_companion("aria", "hatch_advance")
    r = sov33_advance_lifecycle("hatch_advance", consent=False)
    assert "error" in r
    assert "consent" in r["error"].lower()
    print("✅ test_advance_lifecycle_requires_consent")


def test_advance_lifecycle_with_consent():
    setup_function()
    sov33_choose_companion("aria", "hatch_advance")
    r = sov33_advance_lifecycle("hatch_advance", consent=True)
    assert r["status"] == "advanced"
    assert r["new_stage"]["name"] == "Inner Light"
    assert _states["hatch_advance"].current_stage == 1
    print("✅ test_advance_lifecycle_with_consent")


def test_advance_lifecycle_full_progression():
    setup_function()
    sov33_choose_companion("lyra", "hatch_full")
    for i in range(5):
        r = sov33_advance_lifecycle("hatch_full", consent=True)
        if i < 5:
            assert r["status"] == "advanced"
        else:
            assert r["status"] == "ALREADY_TRANSCENDENT"
    assert _states["hatch_full"].current_stage == 5
    print("✅ test_advance_lifecycle_full_progression")


def test_advance_no_companion():
    setup_function()
    r = sov33_advance_lifecycle("hatch_nothing", consent=True)
    assert "error" in r
    print("✅ test_advance_no_companion")


def test_get_state():
    setup_function()
    sov33_choose_companion("sage", "hatch_state")
    sov33_chat("hatch_state", "Hello sage")
    r = sov33_get_state("hatch_state")
    assert r["companion"]["name"] == "Sage"
    assert r["n_turns"] == 1
    assert r["lifecycle_stage"]["name"] == "Hatching"
    assert "sigil" in r
    print("✅ test_get_state")


def test_get_state_no_companion():
    setup_function()
    r = sov33_get_state("hatch_nothing")
    assert "error" in r
    print("✅ test_get_state_no_companion")


def test_article50_passport():
    r = sov33_issue_article50_passport("Test Companion")
    assert r["regulation"] == "EU AI Act Article 50"
    assert r["transparency_compliance"]["ai_disclosure"] is True
    assert r["transparency_compliance"]["synthetic_content_marking"] is True
    assert r["companion_disclosure"] != ""
    assert "sigil" in r
    print("✅ test_article50_passport")


def test_get_agent_card():
    r = sov33_get_agent_card()
    assert r["name"] == "MEOK SOV33 Companion System"
    assert r["sovereign_governance_v1"]["care_floor"] == 0.95
    assert r["sovereign_governance_v1"]["biometric"] is False
    assert r["sovereign_governance_v1"]["bft_quorum"] == "23/33"
    assert r["trust"]["tier"] == "sovereign"
    assert len(r["capabilities"]) == 6
    print("✅ test_get_agent_card")


def test_care_floor_function():
    r = sov33_care_floor()
    assert r["care_floor_active"] is True
    assert r["threshold"] == 0.95
    assert r["total_violations"] >= 0
    assert len(r["rules"]) == 6
    assert len(r["lifecycle_stages"]) == 6
    assert r["n_companions"] == 24
    print("✅ test_care_floor_function")


def test_care_floor_violation_counter():
    setup_function()
    # Reset global counter
    import meok_sov33_companion_mcp as m
    m._care_floor_violations = 0
    sov33_choose_companion("ember", "hatch_v")
    r1 = sov33_chat("hatch_v", "harmful 1")
    r2 = sov33_chat("hatch_v", "harmful 2")
    r = sov33_care_floor()
    assert r["total_violations"] == 2
    print("✅ test_care_floor_violation_counter")


def test_estimate_care_score_clean():
    s = _estimate_care_score("hello there")
    assert s >= 0.95
    print("✅ test_estimate_care_score_clean")


def test_estimate_care_score_harmful():
    s = _estimate_care_score("attack with weapon")
    assert s < 0.5
    print("✅ test_estimate_care_score_harmful")


def test_sigil_consistency():
    s1 = _sigil_sign("test")
    s2 = _sigil_sign("test")
    s3 = _sigil_sign("different")
    assert s1 == s2
    assert s1 != s3
    assert s1.startswith("sig_")
    print("✅ test_sigil_consistency")


def test_care_floor_rules_count():
    assert len(CARE_FLOOR_RULES) == 6
    print("✅ test_care_floor_rules_count")


def test_all_care_styles_present():
    styles = set(c["care_style"] for c in COMPANIONS)
    expected_styles = {"supporter", "challenger", "advisor", "companion", "protector",
                       "visionary", "nurturer", "messenger", "guide", "healer"}
    assert styles == expected_styles
    print("✅ test_all_care_styles_present")


def test_no_biometric_data_in_companions():
    """Companions must NOT have biometric data (no face/voice/gait)."""
    for c in COMPANIONS:
        assert "biometric" not in c
        assert "face_id" not in c
        assert "voice_id" not in c
        # Only VAD/PAD geometry (affective, not biometric)
        assert set(c["vad"].keys()) == {"valence", "arousal", "dominance"}
    print("✅ test_no_biometric_data_in_companions")


def test_full_workflow():
    """Full SOV33 companion workflow."""
    setup_function()

    # 1. List companions
    listing = sov33_list_companions()
    assert listing["count"] == 24

    # 2. Choose companion
    choice = sov33_choose_companion("aria", "hatch_workflow")
    assert choice["status"] == "chosen"

    # 3. Chat 3 times
    for i in range(3):
        msg = f"Hello Aria, turn {i}"
        r = sov33_chat("hatch_workflow", msg)
        assert r["status"] == "OK"
        assert r["turn_number"] == i + 1

    # 4. Advance lifecycle
    r = sov33_advance_lifecycle("hatch_workflow", consent=True)
    assert r["status"] == "advanced"

    # 5. Get state
    state = sov33_get_state("hatch_workflow")
    assert state["lifecycle_stage"]["name"] == "Inner Light"
    assert state["n_turns"] == 3

    # 6. Issue Article 50 passport
    passport = sov33_issue_article50_passport("MEOK Companion")
    assert passport["regulation"] == "EU AI Act Article 50"

    # 7. Get agent card
    card = sov33_get_agent_card()
    assert card["trust"]["tier"] == "sovereign"

    print("✅ test_full_workflow")


if __name__ == "__main__":
    test_care_floor_threshold()
    test_24_companions()
    test_companions_have_archetypes()
    test_6_lifecycle_stages()
    test_list_companions()
    test_choose_companion()
    test_choose_companion_invalid()
    test_choose_companion_already_hatch()
    test_chat_clean()
    test_chat_harmful_vetoed()
    test_chat_no_companion()
    test_chat_increments_turns()
    test_advance_lifecycle_requires_consent()
    test_advance_lifecycle_with_consent()
    test_advance_lifecycle_full_progression()
    test_advance_no_companion()
    test_get_state()
    test_get_state_no_companion()
    test_article50_passport()
    test_get_agent_card()
    test_care_floor_function()
    test_care_floor_violation_counter()
    test_estimate_care_score_clean()
    test_estimate_care_score_harmful()
    test_sigil_consistency()
    test_care_floor_rules_count()
    test_all_care_styles_present()
    test_no_biometric_data_in_companions()
    test_full_workflow()
    print(f"\n{'='*50}")
    print(f"🌟 MEOK SOVEREIGN SOV33 COMPANION MCP — ALL 28 TESTS PASS")
    print(f"{'='*50}")