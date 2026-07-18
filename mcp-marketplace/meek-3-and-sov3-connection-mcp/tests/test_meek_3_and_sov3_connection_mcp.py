#!/usr/bin/env python3
"""Tests for meek-3-and-sov3-connection-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from meek_3_and_sov3_connection_mcp.server import the_3_layers, sov3_brain_left_right, sov3_33_hive_bft, l0_upwards_connection, all_hives_connected

def test_the_3_layers():
    r = the_3_layers()
    assert r["all_3_connected"] is True
    assert "SOV3³" in r["layer_1_sov3_cubed"]["name"]
    assert "SOV3" == r["layer_2_sov3"]["name"]
    assert "CSOAI" in r["layer_3_csoai"]["name"]
    print(f"✅ test_3_layers: SOV3³ + SOV3 + CSOAI, all connected")

def test_sov3_brain_left_right():
    r = sov3_brain_left_right()
    assert r["left_brain_online"]["size_gb"] == 18
    assert r["right_brain_offline"]["size_gb"] == 9
    assert r["mindsets"] == 12
    print(f"✅ test_brain: left 18GB + right 9GB + 12 mindsets + Traibgle voting")

def test_sov3_33_hive_bft():
    r = sov3_33_hive_bft()
    assert r["total"] == 33
    assert r["quorum_required"] == 23
    print(f"✅ test_33_hive: 1+12+12+4+4 = {r['total']} agents, quorum {r['quorum_required']}")

def test_l0_upwards_connection():
    r = l0_upwards_connection()
    assert r["all_8_layers_connected"] is True
    assert "iokfarm.co.uk" in r["l0_physical_base"]
    print(f"✅ test_l0: L0 (physical) -> L7 (humanoid) all 8 layers connected")

def test_all_hives_connected():
    r = all_hives_connected()
    assert r["hive_count"] == 88
    assert r["all_hives_connected"] is True
    print(f"✅ test_hives: {r['hive_count']} hives (28 SOV3 + 50 meok + 10 csoai) all connected")

if __name__ == "__main__":
    test_the_3_layers()
    test_sov3_brain_left_right()
    test_sov3_33_hive_bft()
    test_l0_upwards_connection()
    test_all_hives_connected()
    print("\n🎉 ALL 5 TESTS PASSED — meek-3-and-sov3-connection-mcp v1.0.0 is sovereign. SOV3 + SOV3 + CSOAI all connected.")