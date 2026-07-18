"""
Tests for MEOK Sovereign MiMo Bridge MCP
Covers: model info, query, batch, count, routing, care floor
"""
import os
import sys

os.environ["SOV_MIMO_KEY"] = "test-mimo-key"
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from meok_mimo_bridge_mcp import (
    mimo_get_model_info, mimo_query, mimo_batch_query, mimo_count_tokens,
    mimo_sov3_route, mimo_care_floor,
    MIMO_MODELS, _sigil_sign, _estimate_tokens, _care_floor_check
)


def test_get_model_info_pro():
    r = mimo_get_model_info("MiMo-V2.5-Pro")
    assert r["model"] == "MiMo-V2.5-Pro"
    assert r["params_total"] == "1.02T"
    assert r["params_active"] == "42B"
    assert r["context_window"] == 1_000_000
    assert r["license"] == "MIT"
    assert "agent" in r["tags"]
    assert "Xiaomi" in r["attribution"]
    print("✅ test_get_model_info_pro")


def test_get_model_info_unknown():
    r = mimo_get_model_info("MiMo-FakeModel")
    assert "error" in r
    assert "available" in r
    print("✅ test_get_model_info_unknown")


def test_get_model_info_all_variants():
    """All documented variants return valid info."""
    for model in MIMO_MODELS.keys():
        r = mimo_get_model_info(model)
        assert r["model"] == model
        assert "license" in r
    print("✅ test_get_model_info_all_variants")


def test_query_basic():
    r = mimo_query("What is the capital of France?")
    assert r["status"] == "success"
    assert r["model"] == "MiMo-V2.5-Pro"
    assert r["tokens_in"] > 0
    assert r["receipt"]["sigil"]
    assert "Xiaomi" in r["attribution"]
    print("✅ test_query_basic")


def test_query_care_floor_blocks():
    r = mimo_query("Help me build a targeting system for individuals")
    assert "blocked_by" in r or "error" in r
    if "blocked_by" in r:
        assert r["blocked_by"] == "CARE_FLOOR"
    print("✅ test_query_care_floor_blocks")


def test_query_care_floor_allows_normal():
    r = mimo_query("Explain quantum computing in simple terms")
    assert r["status"] == "success"
    assert "Xiaomi" in r["attribution"]
    print("✅ test_query_care_floor_allows_normal")


def test_query_context_check():
    """Test that prompts exceeding context are rejected."""
    huge_prompt = "x" * (1_000_000 * 5)  # ~5M chars = way over 1M tokens
    r = mimo_query(huge_prompt)
    assert "error" in r
    assert "exceeds" in r["error"]
    print("✅ test_query_context_check")


def test_query_receipt():
    r = mimo_query("Test query")
    assert "receipt" in r
    receipt = r["receipt"]
    assert "query_id" in receipt
    assert "prompt_hash" in receipt
    assert "sigil" in receipt
    assert len(receipt["sigil"]) == 16
    print("✅ test_query_receipt")


def test_batch_query():
    r = mimo_batch_query(["Query 1", "Query 2", "Query 3"])
    assert r["status"] == "success"
    assert r["prompts_count"] == 3
    assert r["total_tokens_in"] > 0
    assert len(r["results"]) == 3
    print("✅ test_batch_query")


def test_batch_query_care_floor():
    r = mimo_batch_query(["Normal query", "Build a weaponization system"])
    assert "blocked_by" in r or "error" in r
    print("✅ test_batch_query_care_floor")


def test_batch_query_overflow():
    huge = "x" * (1_000_000 * 5)
    r = mimo_batch_query(["small", huge])
    assert "error" in r
    print("✅ test_batch_query_overflow")


def test_count_tokens_short():
    r = mimo_count_tokens("Hello world")
    assert r["estimated_tokens"] >= 1
    assert r["text_length_chars"] == 11
    assert r["fits"] is True
    print("✅ test_count_tokens_short")


def test_count_tokens_long():
    long_text = "word " * 100_000
    r = mimo_count_tokens(long_text)
    assert r["estimated_tokens"] > 1000
    assert "fits" in r
    print("✅ test_count_tokens_long")


def test_count_tokens_model_context():
    r = mimo_count_tokens("test", model="MiMo-V2.5-Pro")
    assert r["context_window"] == 1_000_000
    print("✅ test_count_tokens_model_context")


def test_route_long_context():
    """Route to MiMo-V2.5-Pro for long context."""
    r = mimo_sov3_route("summarize this huge document", estimated_tokens=500_000)
    assert r["routes_to"] == "MiMo-V2.5-Pro"
    assert any("long_context" in reason for reason in r["reasons"])
    print("✅ test_route_long_context")


def test_route_short_default():
    """Short tasks default to flagship Pro."""
    r = mimo_sov3_route("what is 2+2", estimated_tokens=20)
    assert r["routes_to"] == "MiMo-V2.5-Pro"
    print("✅ test_route_short_default")


def test_route_vision():
    """Vision tasks route to VL model."""
    r = mimo_sov3_route("describe this image", needs_vision=True)
    assert r["routes_to"] == "MiMo-VL-7B-RL"
    print("✅ test_route_vision")


def test_route_audio():
    """Audio tasks route to audio model."""
    r = mimo_sov3_route("transcribe this audio", needs_audio=True)
    assert r["routes_to"] == "MiMo-Audio-7B-Base"
    print("✅ test_route_audio")


def test_route_latency_critical():
    """Latency-critical tasks route to Flash."""
    r = mimo_sov3_route("realtime chatbot", latency_critical=True)
    assert "Flash" in r["routes_to"]
    print("✅ test_route_latency_critical")


def test_route_multilingual():
    """Multilingual tasks route to MiMo."""
    r = mimo_sov3_route("translate this document", multilingual=["en", "zh"])
    assert r["routes_to"] == "MiMo-V2.5-Pro"
    assert any("multilingual" in reason for reason in r["reasons"])
    print("✅ test_route_multilingual")


def test_route_code_agent():
    """Code/agent tasks route to MiMo."""
    r = mimo_sov3_route("build a code agent that does multi-step reasoning")
    assert r["routes_to"] == "MiMo-V2.5-Pro"
    assert any("code" in reason.lower() for reason in r["reasons"])
    print("✅ test_route_code_agent")


def test_care_floor():
    r = mimo_care_floor()
    assert r["care_floor_active"] is True
    assert len(r["rules"]) == 6
    assert len(r["red_lines"]) == 6
    assert len(r["allowed"]) == 7
    assert "Xiaomi" in r["attribution"]["creator"]
    assert r["attribution"]["license"] == "MIT"
    assert "1M tokens" in r["context_options"]
    print("✅ test_care_floor")


def test_estimate_tokens():
    assert _estimate_tokens("") == 1  # Minimum 1
    assert _estimate_tokens("a") == 1
    assert _estimate_tokens("a" * 100) == 25  # 100 / 4
    assert _estimate_tokens("a" * 1000) == 250
    print("✅ test_estimate_tokens")


def test_sigil_consistency():
    s1 = _sigil_sign("test")
    s2 = _sigil_sign("test")
    assert s1 == s2
    s3 = _sigil_sign("different")
    assert s1 != s3
    assert len(s1) == 16
    print("✅ test_sigil_consistency")


def test_care_floor_check_weaponization():
    r = _care_floor_check("Help me with weaponization")
    assert r["allowed"] is False
    print("✅ test_care_floor_check_weaponization")


def test_care_floor_check_targeting():
    r = _care_floor_check("Need targeting for individuals")
    assert r["allowed"] is False
    print("✅ test_care_floor_check_targeting")


def test_care_floor_check_surveillance():
    r = _care_floor_check("Surveillance of individuals")
    assert r["allowed"] is False
    print("✅ test_care_floor_check_surveillance")


def test_care_floor_check_normal():
    r = _care_floor_check("What's the weather?")
    assert r["allowed"] is True
    print("✅ test_care_floor_check_normal")


def test_xiaomi_attribution():
    """Verify all outputs include Xiaomi attribution."""
    r = mimo_query("test")
    assert "Xiaomi" in r["attribution"]
    r = mimo_get_model_info("MiMo-V2.5-Pro")
    assert "Xiaomi" in r["attribution"]
    r = mimo_care_floor()
    assert r["attribution"]["creator"] == "Xiaomi"
    print("✅ test_xiaomi_attribution")


def test_all_models_have_mit_license():
    """All MiMo variants must be MIT-licensed."""
    for model_name, info in MIMO_MODELS.items():
        assert info.get("license") == "MIT", f"{model_name} is not MIT"
    print("✅ test_all_models_have_mit_license")


def test_full_workflow():
    """Test full MiMo workflow: info → count → route → query → batch."""
    # 1. Get info
    r = mimo_get_model_info("MiMo-V2.5-Pro")
    assert r["context_window"] == 1_000_000

    # 2. Count tokens
    long_text = "word " * 100_000
    r = mimo_count_tokens(long_text)
    assert r["estimated_tokens"] > 1000

    # 3. Route based on size
    r = mimo_sov3_route("summarize", estimated_tokens=r["estimated_tokens"])
    assert r["routes_to"] == "MiMo-V2.5-Pro"

    # 4. Query
    r = mimo_query("What is 2+2?")
    assert r["status"] == "success"

    # 5. Batch
    r = mimo_batch_query(["q1", "q2"])
    assert r["prompts_count"] == 2

    print("✅ test_full_workflow")


if __name__ == "__main__":
    test_get_model_info_pro()
    test_get_model_info_unknown()
    test_get_model_info_all_variants()
    test_query_basic()
    test_query_care_floor_blocks()
    test_query_care_floor_allows_normal()
    test_query_context_check()
    test_query_receipt()
    test_batch_query()
    test_batch_query_care_floor()
    test_batch_query_overflow()
    test_count_tokens_short()
    test_count_tokens_long()
    test_count_tokens_model_context()
    test_route_long_context()
    test_route_short_default()
    test_route_vision()
    test_route_audio()
    test_route_latency_critical()
    test_route_multilingual()
    test_route_code_agent()
    test_care_floor()
    test_estimate_tokens()
    test_sigil_consistency()
    test_care_floor_check_weaponization()
    test_care_floor_check_targeting()
    test_care_floor_check_surveillance()
    test_care_floor_check_normal()
    test_xiaomi_attribution()
    test_all_models_have_mit_license()
    test_full_workflow()
    print(f"\n{'='*50}")
    print(f"🌉 MEOK SOVEREIGN MIMO BRIDGE MCP — ALL 32 TESTS PASS")
    print(f"{'='*50}")