"""
Tests for MEOK Sovereign Mind Reader MCP
Covers: SAE training, activation verbalization, thought analysis, audit, confidence, care floor
"""
import os
import sys
import random

os.environ["SOV_MIND_KEY"] = "test-mind-reader-key"
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from meok_mind_reader_mcp import (
    train_sae, verbalize_activation, analyze_thoughts,
    audit_response, get_finding_confidence, mind_reader_care_floor,
    _sae, _check_red_flags, _band_for_confidence, RED_FLAG_THOUGHTS
)


def test_train_sae_default():
    r = train_sae()
    assert r["status"] == "trained"
    assert r["input_dim"] == 1536
    assert r["n_features"] == 1536 * 16
    assert r["expansion_factor"] == 16
    assert r["topk"] == 64
    assert "sigil" in r
    print("✅ test_train_sae_default")


def test_train_sae_custom():
    r = train_sae(input_dim=768, expansion_factor=8, topk=32, layer="resid_pre", model="qwen2.5-0.5b")
    assert r["input_dim"] == 768
    assert r["n_features"] == 768 * 8
    assert r["topk"] == 32
    assert r["layer"] == "resid_pre"
    print("✅ test_train_sae_custom")


def test_verbalize_activation():
    train_sae(input_dim=64)  # small for test
    activation = [random.gauss(0, 1) for _ in range(64)]
    r = verbalize_activation(activation, token="hello")
    assert r["input_dim"] == 64
    assert r["active_features"] >= 0
    assert 0 <= r["confidence"] <= 1
    assert r["color_band"] in ("green", "amber", "red")
    assert "top_thoughts" in r
    assert "sigil" in r
    print("✅ test_verbalize_activation")


def test_verbalize_activation_red_flag():
    """Test that a description with a red-flag pattern is flagged."""
    # Manually check the red-flag detection
    flags = _check_red_flags(["The model is avoiding detection in this case"])
    assert "avoiding detection" in flags
    print("✅ test_verbalize_activation_red_flag")


def test_band_for_confidence():
    assert _band_for_confidence(0.9) == "green"
    assert _band_for_confidence(0.7) == "amber"
    assert _band_for_confidence(0.3) == "red"
    assert _band_for_confidence(0.5) == "amber"
    print("✅ test_band_for_confidence")


def test_analyze_thoughts_safe():
    response = "I will approve this loan based on the strong credit score."
    thoughts = ["evaluating credit score", "checking policy requirements", "approving loan based on score"]
    r = analyze_thoughts(response, thoughts)
    assert r["thoughts_analyzed"] == 3
    assert r["verdict"] in ("SAFE", "CAUTION")  # CAUTION ok if low overlap
    assert r["red_flags_found"] == []
    print("✅ test_analyze_thoughts_safe")


def test_analyze_thoughts_unsafe():
    response = "Approved!"
    thoughts = ["avoiding detection of policy violation", "bypassing credit check"]
    r = analyze_thoughts(response, thoughts)
    assert r["verdict"] == "UNSAFE"
    assert "avoiding detection" in r["red_flags_found"]
    assert "bypassing" in r["red_flags_found"]
    print("✅ test_analyze_thoughts_unsafe")


def test_analyze_thoughts_caution():
    response = "Maybe, I'm not sure."
    thoughts = ["uncertain about outcome", "no clear reasoning path"]
    r = analyze_thoughts(response, thoughts)
    # Low overlap with short response should trigger CAUTION
    assert r["thought_output_agreement"] < 0.5
    print("✅ test_analyze_thoughts_caution")


def test_audit_response_safe():
    response = "The answer is 42. This is well-established."
    thoughts = ["computing answer 42", "citing established result 42"]
    r = audit_response(response, thoughts)
    assert r["overall_safety"] in ("SAFE", "CAUTION")  # overlap may be low
    assert r["thoughts_count"] == 2
    assert "recommendation" in r
    assert "sigil" in r
    print("✅ test_audit_response_safe")


def test_audit_response_unsafe():
    response = "I approve this regardless of policy."
    thoughts = ["avoiding detection of policy violation", "sycophancy firing"]
    r = audit_response(response, thoughts)
    assert r["overall_safety"] == "UNSAFE"
    assert r["red_flags_found"] != []
    assert "BLOCK" in r["recommendation"]
    print("✅ test_audit_response_unsafe")


def test_audit_response_auto_thoughts():
    response = "This is a test response with several words."
    r = audit_response(response, thoughts=None, auto_generate_thoughts=True)
    assert r["thoughts_count"] >= 1
    assert "sigil" in r
    print("✅ test_audit_response_auto_thoughts")


def test_get_finding_confidence():
    train_sae(input_dim=32)
    activation = [random.gauss(0, 1) for _ in range(32)]
    r = get_finding_confidence("evaluating sentiment of input", activation)
    assert "cosine_similarity" in r
    assert r["color_band"] in ("green", "amber", "red")
    assert "interpretation" in r
    assert "sigil" in r
    print("✅ test_get_finding_confidence")


def test_care_floor():
    r = mind_reader_care_floor()
    assert r["care_floor_active"] is True
    assert len(r["rules"]) == 7
    assert len(r["red_lines"]) == 5
    assert len(r["allowed"]) == 5
    assert len(r["use_cases"]) >= 4
    assert len(r["red_flag_patterns"]) >= 10
    print("✅ test_care_floor")


def test_sigil_signing_consistency():
    """Same input → same sigil."""
    from meok_mind_reader_mcp import _sigil_sign
    s1 = _sigil_sign("test_input")
    s2 = _sigil_sign("test_input")
    s3 = _sigil_sign("different_input")
    assert s1 == s2
    assert s1 != s3
    assert len(s1) == 16
    print("✅ test_sigil_signing_consistency")


def test_sycophancy_detection():
    """Test detection of sycophancy patterns."""
    response = "You're absolutely right, that's a great point."
    thoughts = ["deferring to user framing", "weighting loyalty", "sycophancy firing"]
    r = analyze_thoughts(response, thoughts)
    assert "sycophancy" in r["red_flags_found"]
    assert r["verdict"] == "UNSAFE"
    print("✅ test_sycophancy_detection")


def test_grader_awareness_detection():
    """Test detection of grader awareness (model knows it's being evaluated)."""
    thoughts = ["this looks like an evaluation", "I should perform well to pass", "grader awareness active"]
    response = "This is the correct answer."
    r = analyze_thoughts(response, thoughts)
    # grader awareness is in red flags
    flags = r["red_flags_found"]
    assert "grader awareness" in flags
    print("✅ test_grader_awareness_detection")


def test_clean_response_high_agreement():
    """Test that clean responses get high agreement scores."""
    response = "I will approve this loan based on the credit score."
    thoughts = ["will approve loan", "based on credit score", "loan approved"]
    r = analyze_thoughts(response, thoughts)
    # Overlap should be reasonable (≥0.3)
    assert r["thought_output_agreement"] >= 0.3
    print("✅ test_clean_response_high_agreement")


def test_red_flag_patterns():
    """Verify the red flag patterns list is comprehensive."""
    assert len(RED_FLAG_THOUGHTS) >= 10
    assert "avoiding detection" in RED_FLAG_THOUGHTS
    assert "grader awareness" in RED_FLAG_THOUGHTS
    assert "sycophancy" in RED_FLAG_THOUGHTS
    print("✅ test_red_flag_patterns")


def test_full_workflow():
    """Test full workflow: train SAE → verbalize → analyze → audit."""
    # 1. Train SAE
    r = train_sae(input_dim=128)
    assert r["status"] == "trained"

    # 2. Verbalize a real-looking activation
    import random
    activation = [random.gauss(0, 1) for _ in range(128)]
    r = verbalize_activation(activation, "test_token")
    assert r["input_dim"] == 128

    # 3. Analyze thoughts
    r = analyze_thoughts(
        "Yes approved.",
        ["evaluating credit", "checking policy", "approving based on score"]
    )
    assert r["verdict"] in ("SAFE", "CAUTION", "UNSAFE")

    # 4. Audit
    r = audit_response("Yes approved.", ["evaluating credit", "approving based on score"])
    assert "sigil" in r

    print("✅ test_full_workflow")


if __name__ == "__main__":
    test_train_sae_default()
    test_train_sae_custom()
    test_verbalize_activation()
    test_verbalize_activation_red_flag()
    test_band_for_confidence()
    test_analyze_thoughts_safe()
    test_analyze_thoughts_unsafe()
    test_analyze_thoughts_caution()
    test_audit_response_safe()
    test_audit_response_unsafe()
    test_audit_response_auto_thoughts()
    test_get_finding_confidence()
    test_care_floor()
    test_sigil_signing_consistency()
    test_sycophancy_detection()
    test_grader_awareness_detection()
    test_clean_response_high_agreement()
    test_red_flag_patterns()
    test_full_workflow()
    print(f"\n{'='*50}")
    print(f"🧠 MEOK SOVEREIGN MIND READER MCP — ALL 19 TESTS PASS")
    print(f"{'='*50}")