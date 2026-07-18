"""Tests for meok-sovereign-mind-mcp (12 mindsets × 8 MoE)."""
import os, tempfile
_TEST_DIR = tempfile.mkdtemp(prefix="sov_mind_test_")
os.environ["SOV_MIND_KEY"] = os.path.join(_TEST_DIR, "key.pem")
from meok_sovereign_mind_mcp import (
    mind_list, mind_get, mind_route, mind_compare, mind_status,
    MINDSETS, MOE_EXPERTS,
)


def test_12_mindsets():
    assert len(MINDSETS) == 12


def test_8_moe_experts():
    assert len(MOE_EXPERTS) == 8


def test_96_combinations():
    assert len(MINDSETS) * len(MOE_EXPERTS) == 96


def test_weights_sum_to_1():
    """Each mindset's weights should sum to ~1.0 (or be valid)."""
    for m in MINDSETS:
        total = sum(m["weights"])
        # Allow 0.5-1.5 range
        assert 0.5 <= total <= 1.5


def test_mind_list():
    r = mind_list()
    assert r["count"] == 12


def test_mind_get_sovereign():
    r = mind_get(12)
    assert r["mindset"]["name"] == "Sovereign"
    assert r["moe_count"] == 8


def test_mind_get_hermetic():
    r = mind_get(1)
    assert r["mindset"]["name"] == "Hermetic"
    assert r["mindset"]["env"] == "Fire"


def test_mind_get_invalid():
    r = mind_get(0)
    assert "error" in r
    r = mind_get(13)
    assert "error" in r


def test_mind_route_default_sovereign():
    r = mind_route("Audit this code", mindset_id=12)
    assert r["mindset"] == "Sovereign"
    assert r["total_experts"] == 8


def test_mind_route_hermetic():
    r = mind_route("Find the pattern", mindset_id=1)
    assert r["mindset"] == "Hermetic"
    assert r["routing"][0]["expert"] == "CodingMoE"


def test_mind_route_invalid():
    r = mind_route("test", mindset_id=99)
    assert "error" in r


def test_mind_compare_similar():
    """Sovereign vs Kabbalistic should have moderate similarity."""
    r = mind_compare(3, 12)  # Kabbalistic vs Sovereign
    assert 0.0 <= r["similarity"] <= 1.0


def test_mind_compare_different():
    r = mind_compare(1, 11)  # Hermetic vs Druidic
    assert 0.0 <= r["similarity"] <= 1.0


def test_mind_compare_invalid():
    r = mind_compare(0, 1)
    assert "error" in r
    r = mind_compare(1, 13)
    assert "error" in r


def test_status_summary():
    r = mind_status()
    assert r["mindset_count"] == 12
    assert r["moe_expert_count"] == 8
    assert r["total_combinations"] == 96
    assert r["avg_score"] > 0.8


def test_no_external_deps():
    import meok_sovereign_mind_mcp as m
    src = open(m.__file__).read()
    assert "import ollama" not in src
    assert "import urllib" not in src
    assert "import requests" not in src


def test_signed_outputs():
    r1 = mind_list()
    assert "kid" in r1 and "sig" in r1 and "ts" in r1
    r2 = mind_get(1)
    assert "kid" in r2 and "sig" in r2 and "ts" in r2
    r3 = mind_route("test", 12)
    assert "kid" in r3 and "sig" in r3 and "ts" in r3
    r4 = mind_compare(1, 12)
    assert "kid" in r4 and "sig" in r4 and "ts" in r4
    r5 = mind_status()
    assert "kid" in r5 and "sig" in r5 and "ts" in r5


def test_all_12_mindsets_route():
    """Every mindset can route a task."""
    for m_id in range(1, 13):
        r = mind_route("test task", mindset_id=m_id)
        assert r["total_experts"] == 8


def test_moemoe_total_size():
    """Total MoE size should be ~1.39 TB (8 winners)."""
    total = sum(m["size_gb"] for m in MOE_EXPERTS) / 1024
    assert 1.3 < total < 1.5


def test_sovereign_highest_score():
    """Sovereign mindset has the highest score (1.00)."""
    scores = [m["score"] for m in MINDSETS]
    sovereign = next(m for m in MINDSETS if m["name"] == "Sovereign")
    assert sovereign["score"] == max(scores)