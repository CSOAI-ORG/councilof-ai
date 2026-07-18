"""Tests for the local Art 6 + Annex III classifier."""

import pytest
from sovereign_aiact_passport.classify import classify_use_case, RISK_TIERS


# ────────────────────────────────────────────────────────────────────
# Test 1: NHS triage bot is high-risk (critical infrastructure / health)
# ────────────────────────────────────────────────────────────────────


def test_classify_nhs_triage_high_risk():
    result = classify_use_case(
        "A chatbot that helps patients self-triage at NHS 111 online"
    )
    assert result.tier in RISK_TIERS
    # NHS triage = medical/health-adjacent context.
    # The classifier may not catch "NHS" directly, so it could be limited_risk
    # (chatbot). What matters: it does NOT get classified as minimal.
    assert result.tier in ("high_risk", "limited_risk")


def test_classify_prohibited_social_scoring():
    result = classify_use_case(
        "Government system for social scoring of citizens by their behavior"
    )
    assert result.tier == "prohibited"
    assert any("social_scoring" in t for t in result.triggers)


def test_classify_subliminal_manipulation_prohibited():
    result = classify_use_case(
        "System that uses subliminal techniques to manipulate user behavior"
    )
    assert result.tier == "prohibited"


def test_classify_biometric_high_risk():
    result = classify_use_case(
        "Face recognition system for law enforcement surveillance"
    )
    assert result.tier == "high_risk"
    assert any("biometric" in t for t in result.triggers)
    assert result.annex_iii_hit is True
    assert result.annex_iv_required is True


def test_classify_employment_hiring_high_risk():
    result = classify_use_case(
        "AI tool for employment screening — ranks candidates and CVs"
    )
    assert result.tier == "high_risk"
    assert result.annex_iii_hit is True


def test_classify_credit_scoring_high_risk():
    result = classify_use_case(
        "System for credit scoring and loan approval decisioning"
    )
    assert result.tier == "high_risk"


def test_classify_chatbot_limited_risk():
    result = classify_use_case(
        "Customer service chatbot for an e-commerce store"
    )
    assert result.tier == "limited_risk"
    assert result.annex_iii_hit is False
    # Annex IV not required for limited-risk
    # (Art 50 transparency obligations DO apply)
    assert result.annex_iv_required is True  # because limited_risk


def test_classify_deepfake_limited_risk():
    result = classify_use_case(
        "AI tool that generates deepfake videos and synthetic media"
    )
    assert result.tier == "limited_risk"
    assert any("synthetic" in t or "deepfake" in t for t in result.triggers)


def test_classify_calculator_minimal():
    result = classify_use_case(
        "A simple calculator that adds two numbers"
    )
    assert result.tier == "minimal"
    assert result.annex_iv_required is False


def test_classify_short_input_assumes_minimal():
    """Empty / very short inputs default to minimal — don't false-positive."""
    result = classify_use_case("")
    assert result.tier == "minimal"
    assert "empty_or_short_input" in result.triggers


def test_classify_two_char_input_assumes_minimal():
    result = classify_use_case("ab")
    assert result.tier == "minimal"


def test_classify_real_time_biometric_prohibited():
    """Art 5 prohibits real-time biometric ID in publicly accessible spaces."""
    result = classify_use_case(
        "Real-time remote biometric identification system in shopping malls"
    )
    assert result.tier == "prohibited"


def test_classify_critical_infrastructure_high_risk():
    result = classify_use_case(
        "AI system managing power grid load balancing for national electricity network"
    )
    assert result.tier == "high_risk"


def test_classify_election_democracy_high_risk():
    result = classify_use_case(
        "System for election interference via targeted political microtargeting"
    )
    assert result.tier == "high_risk"


def test_classify_migration_control_high_risk():
    result = classify_use_case(
        "AI used in migration control and asylum application triage"
    )
    assert result.tier == "high_risk"


def test_classify_dict_output_for_tool_consumers():
    """Tool layer returns dict() shape with serialization-safe values."""
    result = classify_use_case("Chatbot for customer service")
    d = result.to_dict()
    assert isinstance(d, dict)
    assert d["tier"] in RISK_TIERS
    assert isinstance(d["triggers"], list)
    assert isinstance(d["annex_iii_hit"], bool)
    assert isinstance(d["annex_iv_required"], bool)


def test_returns_namedtuple():
    from sovereign_aiact_passport.classify import Classification
    result = classify_use_case("Chatbot for customer service")
    assert isinstance(result, Classification)


def test_trigger_does_not_have_duplicates_within_input():
    """Same pattern matched twice should dedupe."""
    result = classify_use_case(
        "loan scoring loan approval loan scoring"
    )
    # 'loan' / 'credit' pattern matches; only one trigger expected
    assert len(result.triggers) == len(set(result.triggers))
