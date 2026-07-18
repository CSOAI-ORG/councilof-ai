#!/usr/bin/env python3
"""Tests for meek-dorado-west-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from meek_dorado_west_mcp.server import dorado_west_east_west_flow, dorado_heavy_ontology, dorado_ai_governance, dorado_layers, dorado_status

def test_dorado_west_east_west_flow():
    r = dorado_west_east_west_flow()
    assert r["direction"] == "EAST → WEST"
    assert len(r["layers"]) == 8
    print(f"✅ test_flow: {r['direction']} click-through, {len(r['layers'])} layers")

def test_dorado_heavy_ontology():
    r = dorado_heavy_ontology()
    assert r["count"] == 11
    print(f"✅ test_ontology: {r['count']} heavy ontology methods")

def test_dorado_ai_governance():
    r = dorado_ai_governance()
    assert "painter" in r["painter"]
    assert len(r["frameworks_applied"]) == 6
    print(f"✅ test_governance: {r['painter'][:50]}... + {len(r['frameworks_applied'])} frameworks")

def test_dorado_layers():
    r = dorado_layers()
    assert len(r["layers"]) == 8
    print(f"✅ test_layers: 8 layers (L0-L7)")

def test_dorado_status():
    r = dorado_status()
    assert r["click_through"] is True
    assert r["all_7_layers_connected"] is True
    print(f"✅ test_status: {r['verdict'][:60]}...")

if __name__ == "__main__":
    test_dorado_west_east_west_flow()
    test_dorado_heavy_ontology()
    test_dorado_ai_governance()
    test_dorado_layers()
    test_dorado_status()
    print("\n🎉 ALL 5 TESTS PASSED — meek-dorado-west-mcp v1.0.0 is sovereign. DORADO WEST is built.")