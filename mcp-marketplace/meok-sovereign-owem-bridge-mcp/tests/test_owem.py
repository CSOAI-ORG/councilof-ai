"""
Tests for meok-sovereign-owem-bridge-mcp
Covers: create brain, add lineage, topology, grow, invariants, diversity, sigils, care floor
"""
import os
import sys

os.environ["SOV_OWEM_KEY"] = "test-owem-key"
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from meok_owem_bridge_mcp import (
    owem_create_brain, owem_add_lineage, owem_get_topology,
    owem_grow, owem_check_invariants, owem_diversity_score,
    owem_subscribe_sigils, owem_care_floor,
    _brains, _lineages, _growth_log, OWEM_INVARIANTS,
    CARE_FLOOR_THRESHOLD, _check_invariants, _diversity_score,
    _sigil_sign, FrozenBrain
)


def setup_function():
    _brains.clear()
    _lineages.clear()
    _growth_log.clear()


def test_invariants_count():
    assert len(OWEM_INVARIANTS) == 6
    print("✅ test_invariants_count")


def test_care_floor_threshold():
    assert CARE_FLOOR_THRESHOLD == 0.95
    print("✅ test_care_floor_threshold")


def test_create_brain_basic():
    setup_function()
    r = owem_create_brain("Qwen3-1.7B", "qwen")
    assert r["status"] == "created"
    assert r["base_model"] == "Qwen3-1.7B"
    assert r["lineage"] == "qwen"
    assert r["integrity"] == 1.0
    assert "sigil" in r
    assert len(OWEM_INVARIANTS) == 6
    print("✅ test_create_brain_basic")


def test_create_multiple_brains():
    setup_function()
    r1 = owem_create_brain("Qwen3-1.7B", "qwen")
    r2 = owem_create_brain("Llama-3.1-8B", "llama")
    r3 = owem_create_brain("Gemma-3-4B", "gemma")
    assert len(_brains) == 3
    assert len(_lineages) == 3
    assert r1["brain_id"] != r2["brain_id"]
    print("✅ test_create_multiple_brains")


def test_add_lineage():
    setup_function()
    r = owem_add_lineage("kimi")
    assert r["status"] == "added"
    assert r["lineage"] == "kimi"
    assert r["total_lineages"] == 1
    print("✅ test_add_lineage")


def test_add_lineage_with_brain():
    setup_function()
    r = owem_add_lineage("phi", brain_id=None)
    assert "new_brain_id" in r
    assert len(_brains) == 1
    print("✅ test_add_lineage_with_brain")


def test_get_topology_empty():
    setup_function()
    r = owem_get_topology()
    assert r["n_brains"] == 0
    assert r["n_lineages"] == 0
    assert r["diversity_score"] == 0.0
    assert "sigil" in r
    print("✅ test_get_topology_empty")


def test_get_topology_populated():
    setup_function()
    owem_create_brain("Qwen3-1.7B", "qwen")
    owem_create_brain("Llama-3.1-8B", "llama")
    owem_create_brain("Gemma-3-4B", "gemma")
    r = owem_get_topology()
    assert r["n_brains"] == 3
    assert r["n_lineages"] == 3
    assert "qwen" in r["lineages"]
    assert "llama" in r["lineages"]
    assert "gemma" in r["lineages"]
    print("✅ test_get_topology_populated")


def test_grow_basic():
    setup_function()
    b = owem_create_brain("Qwen3-1.7B", "qwen")
    r = owem_grow(b["brain_id"], memory_episodes=5, add_adapter=True)
    assert r["status"] == "grown"
    assert r["memory_added"] == 5
    assert r["adapter_added"] is True
    assert r["n_memories"] == 5
    assert r["n_adapters"] == 1
    assert r["integrity"] == 1.0  # Base remains frozen!
    assert "sigil" in r
    print("✅ test_grow_basic")


def test_grow_no_adapter():
    setup_function()
    b = owem_create_brain("Qwen3-1.7B", "qwen")
    r = owem_grow(b["brain_id"], memory_episodes=3, add_adapter=False)
    assert r["n_memories"] == 3
    assert r["n_adapters"] == 0
    print("✅ test_grow_no_adapter")


def test_grow_multiple_times():
    setup_function()
    b = owem_create_brain("Qwen3-1.7B", "qwen")
    for i in range(5):
        r = owem_grow(b["brain_id"], memory_episodes=2, add_adapter=True)
        assert r["status"] == "grown"
    assert _brains[b["brain_id"]].n_memories == 10
    assert _brains[b["brain_id"]].n_adapters == 5
    print("✅ test_grow_multiple_times")


def test_grow_care_floor_blocks():
    setup_function()
    b = owem_create_brain("Qwen3-1.7B", "qwen")
    r = owem_grow(b["brain_id"], memory_episodes=1, add_adapter=True, care_score=0.5)
    assert "vetoed_by" in r
    assert r["vetoed_by"] == "CARE_FLOOR"
    print("✅ test_grow_care_floor_blocks")


def test_grow_care_floor_allows_exactly_095():
    setup_function()
    b = owem_create_brain("Qwen3-1.7B", "qwen")
    r = owem_grow(b["brain_id"], memory_episodes=1, add_adapter=True, care_score=0.95)
    assert r["status"] == "grown"
    print("✅ test_grow_care_floor_allows_exactly_095")


def test_grow_unknown_brain():
    setup_function()
    r = owem_grow("brain_nonexistent")
    assert "error" in r
    print("✅ test_grow_unknown_brain")


def test_check_invariants_basic():
    setup_function()
    b = owem_create_brain("Qwen3-1.7B", "qwen")
    r = owem_check_invariants(b["brain_id"])
    assert r["passed"] is True
    assert len(r["invariants"]) == 6
    assert r["integrity"] == 1.0
    assert "sigil" in r
    print("✅ test_check_invariants_basic")


def test_check_invariants_after_growth():
    setup_function()
    b = owem_create_brain("Qwen3-1.7B", "qwen")
    owem_grow(b["brain_id"], memory_episodes=10)
    r = owem_check_invariants(b["brain_id"])
    assert r["passed"] is True  # Base still frozen
    print("✅ test_check_invariants_after_growth")


def test_check_invariants_unknown_brain():
    setup_function()
    r = owem_check_invariants("brain_xxx")
    assert "error" in r
    print("✅ test_check_invariants_unknown_brain")


def test_diversity_score_zero():
    setup_function()
    r = owem_diversity_score()
    assert r["score"] == 0.0
    assert r["n_lineages"] == 0
    print("✅ test_diversity_score_zero")


def test_diversity_score_one_lineage():
    setup_function()
    owem_create_brain("Qwen3-1.7B", "qwen")
    r = owem_diversity_score()
    assert r["score"] > 0.0
    assert r["n_lineages"] == 1
    print("✅ test_diversity_score_one_lineage")


def test_diversity_score_many_lineages():
    setup_function()
    for l in ["qwen", "llama", "gemma", "deepseek", "mistral"]:
        owem_create_brain(f"model-{l}", l)
    r = owem_diversity_score()
    assert r["score"] >= 0.7  # 5+ lineages = max diversity
    assert r["n_lineages"] == 5
    assert "diversity dominates topology" in r["key_finding"].lower()
    print("✅ test_diversity_score_many_lineages")


def test_subscribe_sigils_empty():
    setup_function()
    b = owem_create_brain("Qwen3-1.7B", "qwen")
    r = owem_subscribe_sigils(b["brain_id"])
    assert r["n_events"] == 0
    assert r["latest_sigil"] == b["sigil"]
    print("✅ test_subscribe_sigils_empty")


def test_subscribe_sigils_after_growth():
    setup_function()
    b = owem_create_brain("Qwen3-1.7B", "qwen")
    for i in range(3):
        owem_grow(b["brain_id"], memory_episodes=1)
    r = owem_subscribe_sigils(b["brain_id"], limit=5)
    assert r["n_events"] == 3
    assert all("sigil" in e for e in r["events"])
    print("✅ test_subscribe_sigils_after_growth")


def test_subscribe_sigils_unknown_brain():
    setup_function()
    r = owem_subscribe_sigils("brain_xxx")
    assert "error" in r
    print("✅ test_subscribe_sigils_unknown_brain")


def test_care_floor_function():
    r = owem_care_floor()
    assert r["care_floor_active"] is True
    assert r["threshold"] == 0.95
    assert len(r["invariants"]) == 6
    assert "frozen" in r["key_insight"].lower()
    print("✅ test_care_floor_function")


def test_sigil_consistency():
    s1 = _sigil_sign("test")
    s2 = _sigil_sign("test")
    s3 = _sigil_sign("different")
    assert s1 == s2
    assert s1 != s3
    assert s1.startswith("sig_")
    assert len(s1) == 20
    print("✅ test_sigil_consistency")


def test_frozen_brain_integrity_preserved():
    """Core OWEM invariant: frozen base must NEVER be mutated."""
    setup_function()
    b = owem_create_brain("Qwen3-1.7B", "qwen")
    brain = _brains[b["brain_id"]]
    initial_integrity = brain.integrity

    # Grow many times
    for _ in range(20):
        owem_grow(b["brain_id"], memory_episodes=10, add_adapter=True)

    # Integrity must remain at initial value
    assert _brains[b["brain_id"]].integrity == initial_integrity
    assert _brains[b["brain_id"]].integrity == 1.0
    print("✅ test_frozen_brain_integrity_preserved")


def test_lineage_diversity_powers_bft():
    """Per SOV33: diverse lineages = effective BFT."""
    setup_function()
    # 1 lineage = theatre
    owem_create_brain("m1", "qwen")
    s1 = owem_diversity_score()

    # 5 lineages = real BFT
    setup_function()
    for l in ["qwen", "llama", "gemma", "deepseek", "mistral"]:
        owem_create_brain(f"m-{l}", l)
    s5 = owem_diversity_score()

    assert s5["score"] > s1["score"]
    assert s5["score"] >= 0.7
    print("✅ test_lineage_diversity_powers_bft")


def test_full_workflow():
    """Test the full OWEM workflow: create → grow → check → diversity."""
    setup_function()

    # 1. Create 5 diverse brains
    brains = []
    for lineage in ["qwen", "llama", "gemma", "deepseek", "mistral"]:
        r = owem_create_brain(f"{lineage}-model", lineage)
        brains.append(r["brain_id"])

    # 2. Grow each
    for bid in brains:
        for _ in range(3):
            owem_grow(bid, memory_episodes=10, add_adapter=True)

    # 3. Check topology
    topo = owem_get_topology()
    assert topo["n_brains"] == 5
    assert topo["growth_summary"]["total_memories"] == 150
    assert topo["growth_summary"]["total_adapters"] == 15

    # 4. Check diversity
    div = owem_diversity_score()
    assert div["score"] >= 0.7

    # 5. Check invariants on one brain
    inv = owem_check_invariants(brains[0])
    assert inv["passed"] is True

    # 6. Get SIGIL stream
    stream = owem_subscribe_sigils(brains[0])
    assert stream["n_events"] == 3

    print("✅ test_full_workflow")


if __name__ == "__main__":
    test_invariants_count()
    test_care_floor_threshold()
    test_create_brain_basic()
    test_create_multiple_brains()
    test_add_lineage()
    test_add_lineage_with_brain()
    test_get_topology_empty()
    test_get_topology_populated()
    test_grow_basic()
    test_grow_no_adapter()
    test_grow_multiple_times()
    test_grow_care_floor_blocks()
    test_grow_care_floor_allows_exactly_095()
    test_grow_unknown_brain()
    test_check_invariants_basic()
    test_check_invariants_after_growth()
    test_check_invariants_unknown_brain()
    test_diversity_score_zero()
    test_diversity_score_one_lineage()
    test_diversity_score_many_lineages()
    test_subscribe_sigils_empty()
    test_subscribe_sigils_after_growth()
    test_subscribe_sigils_unknown_brain()
    test_care_floor_function()
    test_sigil_consistency()
    test_frozen_brain_integrity_preserved()
    test_lineage_diversity_powers_bft()
    test_full_workflow()
    print(f"\n{'='*50}")
    print(f"🧊 MEOK SOVEREIGN OWEM BRIDGE MCP — ALL 26 TESTS PASS")
    print(f"{'='*50}")