#!/usr/bin/env python3
"""Tests for meek-sov-space-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from meek_sov_space_mcp.server import sov_space_layout, sov_space_sov3_character, sov_space_saas_tools, sov_space_workflows, sov_space_dorado_west, sov_space_status

def test_sov_space_layout():
    r = sov_space_layout()
    assert "left_hand_side" in r and "right_hand_bar" in r and "center_chat" in r
    print(f"✅ test_layout: R H bar + L H side + center chat + DORADO")

def test_sov_space_sov3_character():
    r = sov_space_sov3_character()
    assert r["character"] == "SOV3"
    assert "33-hive BFT" in r["bft_council"]
    assert len(r["mindsets"]) == 12
    print(f"✅ test_sov3: {r['character']} + {len(r['mindsets'])} mindsets + 33-hive BFT")

def test_sov_space_saas_tools():
    r = sov_space_saas_tools()
    assert r["count"] == 9
    print(f"✅ test_saas: {r['count']} SaaS tools on L H side")

def test_sov_space_workflows():
    r = sov_space_workflows()
    assert r["count"] == 5
    print(f"✅ test_workflows: {r['count']} workflows (W-sprint + PDCA + BFT + Traibgle + Quantum)")

def test_sov_space_dorado_west():
    r = sov_space_dorado_west()
    assert "EAST → WEST" in r["flow"]
    assert r["layers"] == 8
    print(f"✅ test_dorado: {r['flow']} click-through, {r['layers']} layers")

def test_sov_space_status():
    r = sov_space_status()
    assert r["status"] == "LIVE"
    assert r["rh_bar_connected"] is True
    assert r["all_7_layers_connected"] is True
    print(f"✅ test_status: {r['verdict']}")

if __name__ == "__main__":
    test_sov_space_layout()
    test_sov_space_sov3_character()
    test_sov_space_saas_tools()
    test_sov_space_workflows()
    test_sov_space_dorado_west()
    test_sov_space_status()
    print("\n🎉 ALL 6 TESTS PASSED — meek-sov-space-mcp v1.0.0 is sovereign. SOV SPACE is built.")