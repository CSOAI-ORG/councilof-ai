"""Tests for meok-sovereign-12-mindsets-mcp."""
import os, tempfile
_TEST = tempfile.mkdtemp(prefix="sov_mind_")
os.environ["SOV_MIND_KEY"] = _TEST + "/k.pem"
from meok_sovereign_12_mindsets_mcp import (
    mindset_list, mindset_think, moe_route, sovereign_combine, brain_score,
    MINDSETS, MOE_EXPERTS,
)


def test_12_mindsets():
    assert len(MINDSETS) == 12


def test_8_experts():
    assert len(MOE_EXPERTS) == 8


def test_mindset_list():
    r = mindset_list()
    assert r["count"] == 12
    assert "Crown" in [m["name"] for m in r["mindsets"]]
    assert "Dragon" in [m["name"] for m in r["mindsets"]]


def test_mindset_tiers():
    r = mindset_list()
    assert "foundational" in r["tiers"]
    assert "decision" in r["tiers"]
    assert "cognitive" in r["tiers"]
    assert "structural" in r["tiers"]
    assert "cultural" in r["tiers"]


def test_mindset_think_by_id():
    r = mindset_think(1, "What is sovereign?")
    assert r["mindset"] == "Crown"
    assert "1795" in r["thought"]


def test_mindset_think_by_name():
    r = mindset_think("Defensive", "Test")
    assert r["mindset"] == "Defensive"


def test_mindset_think_unknown():
    r = mindset_think(99, "test")
    assert "error" in r


def test_moe_route_code():
    r = moe_route("Write a Python function")
    assert r["top3"][0][0] in ["Code", "Reason", "Compliance", "Defence", "Sigil", "World", "Care", "Memory"]


def test_moe_route_compliance():
    r = moe_route("GDPR audit")
    assert r["top3"][0][0] == "Compliance"


def test_moe_route_defence():
    r = moe_route("JSP 936 NATO")
    assert r["top3"][0][0] in ["Defence", "Compliance"]


def test_moe_route_general():
    r = moe_route("Hello world")
    assert sum(r["weights"].values()) > 0.99


def test_sovereign_combine():
    r = sovereign_combine(1, "Code")
    assert r["combination_id"] == 1
    assert r["mindset"] == "Crown"
    assert r["expert"] == "Code"


def test_sovereign_combine_96():
    r = sovereign_combine(12, 8)
    assert r["combination_id"] == 96


def test_sovereign_combine_unknown_mindset():
    r = sovereign_combine(99, "Code")
    assert "error" in r


def test_sovereign_combine_unknown_expert():
    r = sovereign_combine(1, "NoExpert")
    assert "error" in r


def test_brain_score():
    r = brain_score("What is sovereign?", 12, "Care")
    assert r["sovereign_brain_score"] > 7.0
    assert r["sovereign_brain_score"] <= 10.0


def test_brain_score_default():
    r = brain_score("Test query")
    assert r["mindset"] == "Dragon"
    assert r["expert"] == "Care"


def test_brain_score_care_floor():
    r = brain_score("Test")
    assert r["care_floor"] == 0.95
    assert r["bft_council_size"] == 7


def test_brain_score_unknown():
    r = brain_score("test", 99, "Care")
    assert "error" in r


def test_no_external_deps():
    import meok_sovereign_12_mindsets_mcp as m
    src = open(m.__file__).read()
    assert "import ollama" not in src
    assert "import requests" not in src


def test_signed_outputs():
    for r in [mindset_list(), mindset_think(1, "test"), moe_route("test"),
              sovereign_combine(1, "Code"), brain_score("test")]:
        assert "kid" in r and "sig" in r and "ts" in r


def test_96_combinations():
    """Total combinations = 12 × 8 = 96."""
    for mid in range(1, 13):
        for eid in range(1, 9):
            r = sovereign_combine(mid, MOE_EXPERTS[eid-1]["name"])
            assert r["combination_id"] == (mid - 1) * 8 + eid


def test_mindset_colors():
    for m in MINDSETS:
        assert m["color"].startswith("#")


def test_moe_default_weights():
    total = sum(e["weight_default"] for e in MOE_EXPERTS)
    assert 0.9 < total < 1.1
