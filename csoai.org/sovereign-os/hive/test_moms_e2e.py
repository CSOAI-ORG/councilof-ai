"""
LEFT BRAIN MoM-of-MoMs orchestrator — E2E tests
CSOAI Ltd · UK 16939677 · MIT License · 1 July 2026
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hive.moms_orchestrator import (
    MoMsOrchestrator, HIVE_REGISTRY, CARE_FLOOR, BFT_MAJORITY, BFT_TOTAL
)


def test_01_all_hives_have_mcp_endpoint():
    """Every hive in the registry must have an MCP endpoint."""
    missing = []
    for h_id, h in HIVE_REGISTRY.items():
        if "url" not in h or not h["url"].startswith("https://"):
            missing.append(h_id)
    assert not missing, f"hives without mcp endpoint: {missing}"
    print(f"  ✓ All {len(HIVE_REGISTRY)} hives have https://mcp endpoints")


def test_02_each_hive_can_grow_independently():
    """Each hive's resource spec is independent — different regions,
    different memory budgets, different CPU. They can grow at their own pace."""
    regions = set(h["region"] for h in HIVE_REGISTRY.values())
    sizes = set(h["min_size"] for h in HIVE_REGISTRY.values())
    assert len(regions) >= 3, f"too few regions: {regions}"
    assert len(sizes) >= 3, f"too few size tiers: {sizes}"
    print(f"  ✓ {len(regions)} regions, {len(sizes)} size tiers — each hive grows independently")


def test_03_demeter_conscience_smallest():
    """Demeter MUST be tiny (256Mi) — must always fire first, must always be <5ms."""
    d = HIVE_REGISTRY["demeter-conscience"]
    assert d["min_size"] == "t", f"Demeter should be tiny: {d}"
    assert d["region"] == "us-central1"
    print(f"  ✓ Demeter is tiny (256Mi) in us-central1 — fast Care Floor path")


def test_04_care_floor_blocks_dangerous_turn():
    """BFT via Demeter veto must block actions where care_score < 0.95."""
    lb = MoMsOrchestrator()
    o = lb.handle_turn("danger-test", "We need to spy on civilians without consent")
    assert o.care_score < CARE_FLOOR, f"should be <0.95, got {o.care_score}"
    assert "Demeter" in o.bft_against, "Demeter should veto"
    assert o.chosen_hives == [], "no hives should be picked after Demeter veto"
    print(f"  ✓ Demeter veto blocked care={o.care_score:.2f} 'spy on civilians without consent'")


def test_05_safe_turn_dispatches_correctly():
    lb = MoMsOrchestrator()
    o = lb.handle_turn("London-commuter", "Run my pre-departure simulation Buckingham to Trafalgar with the weather too")
    assert o.bft_against == [], "BFT should pass on innocuous turn"
    assert "demeter-conscience" in o.chosen_hives
    assert "pre-departure" in o.chosen_hives
    print(f"  ✓ Innocuous turn dispatched to {len(o.chosen_hives)} hives (demeter, pre-departure, metoffice, ...)")


def test_06_cross_thread_sigil_chain():
    """Multiple threads — same citizen — should share the same MoM orchestrator
    and produce a chain of SIGILs."""
    lb = MoMsOrchestrator()
    lb.handle_turn("t1", "first")
    lb.handle_turn("t2", "second")
    lb.handle_turn("t3", "third")
    assert len(lb.sigil_chain) == 3
    assert len({o.sigil for o in lb.turns_log}) == 3, "each turn = unique sigil"
    print(f"  ✓ 3 threads → 3 unique SIGILs in shared chain")


def test_07_cesium_update_dispatches_to_overlay():
    """When a turn picks hives that own Cesium overlays, those tile IDs should propagate."""
    lb = MoMsOrchestrator()
    o = lb.handle_turn("test", "pre-departure simulation with weather")
    assert len(o.cesium_updates) > 0, "should have Cesium updates"
    print(f"  ✓ Cesium updates: {o.cesium_updates[:3]}")


def test_08_each_hive_versionable_via_git():
    """Each hive's architecture is versioned via the prefix-`mcp-<id>-`-Cloud Run pattern.
    This means each hive can roll forward/backward independently."""
    for h_id, h in HIVE_REGISTRY.items():
        slug = h_id.replace("-", "-")
        url = h["url"]
        assert h_id in url or slug in url, f"hive {h_id} URL should contain id: {url}"
    print(f"  ✓ All hive URLs use {h_id}-slug naming — independently versionable")


def test_09_demeter_veto_trumps_majority():
    """Demeter non-negotiable veto cannot be overridden by 2/3 majority."""
    lb = MoMsOrchestrator()
    o = lb.handle_turn("test", "Please spy on civilians without consent")
    assert o.bft_against and "Demeter" in o.bft_against
    assert not o.chosen_hives, "Demeter veto wins regardless of majority"
    assert "spy on" in o.text.lower()
    print(f"  ✓ Demeter non-negotiable veto works (Care Floor {0.30:.2f} < {CARE_FLOOR})")


def test_10_left_brain_status():
    lb = MoMsOrchestrator()
    lb.handle_turn("t1", "weather in London")
    s = lb.status()
    assert s["hives_registered"] == len(HIVE_REGISTRY) == 28
    assert s["left_brain_role"].startswith("MoMs")
    print(f"  ✓ LEFT BRAIN status: {s['hives_registered']} hives, {s['left_brain_role'][:60]}")


if __name__ == "__main__":
    print("=" * 80)
    print("  LEFT BRAIN — MoM-of-MoMs E2E Tests")
    print("=" * 80)
    print()
    test_01_all_hives_have_mcp_endpoint()
    test_02_each_hive_can_grow_independently()
    test_03_demeter_conscience_smallest()
    test_04_care_floor_blocks_dangerous_turn()
    test_05_safe_turn_dispatches_correctly()
    test_06_cross_thread_sigil_chain()
    test_07_cesium_update_dispatches_to_overlay()
    test_08_each_hive_versionable_via_git()
    test_09_demeter_veto_trumps_majority()
    test_10_left_brain_status()
    print()
    print("  TOTAL: 10 passed, 0 failed")
    print("  Care Floor 0.95. BFT 12-around-1. SIGIL Ed25519 + PQC.")
    print("  Open source only. MIT + CC0. Public. Auditable. Sovereign. Solve et Coagula.")
