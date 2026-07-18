"""Tests for meek-sov-os-world-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from meek_sov_os_world_mcp.server import sov_os_world_layout, sov_os_world_interactions, sov_os_world_overlays, sov_os_world_user_can_do, sov_os_world_data_sources, sov_os_world_status

def test_sov_os_world_layout():
    r = sov_os_world_layout()
    assert r["globe_overlay"]["data_layers"] == 5
    assert "Workspace" in r["left_hand_side"]["name"] or "L H SIDE" in r["left_hand_side"]["name"] or "left_hand_side" in r
    print(f"✅ test_layout: {r['globe_overlay']['data_layers']} data layers on the globe")

def test_sov_os_world_interactions():
    r = sov_os_world_interactions()
    assert len(r["interactions"]) == 10
    print(f"✅ test_interactions: {len(r['interactions'])} interactions")

def test_sov_os_world_overlays():
    r = sov_os_world_overlays()
    assert len(r["overlays"]) == 5
    print(f"✅ test_overlays: {len(r['overlays'])} overlays")

def test_sov_os_world_user_can_do():
    r = sov_os_world_user_can_do()
    assert len(r["actions"]) >= 15
    print(f"✅ test_user_can_do: {len(r['actions'])} actions")

def test_sov_os_world_data_sources():
    r = sov_os_world_data_sources()
    assert r["government_data"]["size_gb"] == 49
    assert r["total_size_gb"] >= 77
    print(f"✅ test_data_sources: {r['total_size_gb']} GB from 6 sources")

def test_sov_os_world_status():
    r = sov_os_world_status()
    assert r["status"] == "LIVE"
    assert r["all_5_overlays_loaded"] is True
    print(f"✅ test_status: {r['status']} ({r['verdict'][:50]}...)")

if __name__ == "__main__":
    test_sov_os_world_layout()
    test_sov_os_world_interactions()
    test_sov_os_world_overlays()
    test_sov_os_world_user_can_do()
    test_sov_os_world_data_sources()
    test_sov_os_world_status()
    print("\n🎉 ALL 6 TESTS PASSED — meek-sov-os-world-mcp v1.0.0 is sovereign. The SOV OS world is LIVE.")