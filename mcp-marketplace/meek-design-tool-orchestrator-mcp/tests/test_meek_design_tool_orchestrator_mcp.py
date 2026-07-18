#!/usr/bin/env python3
"""Tests for meek-design-tool-orchestrator-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from meek_design_tool_orchestrator_mcp.server import (
    find_cad_tool,
    find_3d_print_tool,
    find_pcb_tool,
    find_github_repos,
    generate_design_toolchain,
)


def test_find_cad_tool():
    r = find_cad_tool(component="orb_bladder", complexity="medium")
    assert r["recommended_tool"] in ("freecad", "openscad", "blender", "solvespace", "cadquery", "build123d")
    print(f"✅ test_find_cad: {r['recommended_tool']} for {r['component']}")


def test_find_3d_print_tool():
    r = find_3d_print_tool(material="PVA", printer="QIDI_Max4")
    assert r["recommended_tool"] in ("prusaslicer", "superslicer", "orcaslicer", "cura", "kirimoto")
    print(f"✅ test_find_slicer: {r['recommended_tool']} for {r['material']}")


def test_find_pcb_tool():
    r = find_pcb_tool(board_complexity="simple_2_layer")
    assert r["recommended_tool"] in ("kicad", "horizon_eda", "fritzing", "magic")
    print(f"✅ test_find_pcb: {r['recommended_tool']} for {r['board_complexity']}")


def test_find_github_repos():
    r = find_github_repos(domain="humanoid")
    assert r["total_repos"] > 0
    print(f"✅ test_find_repos: {r['total_repos']} repos for {r['domain']}")


def test_generate_design_toolchain():
    r = generate_design_toolchain(project="sovereign_orb")
    assert r["total_cost_gbp"] == 0
    assert "FreeCAD" in r["cad"]["tool"]
    assert "PrusaSlicer" in r["slicer"]["tool"]
    print(f"✅ test_toolchain: {r['cad']['tool']} + {r['slicer']['tool']} + {r['eda']['tool']}, $0 cost")


if __name__ == "__main__":
    test_find_cad_tool()
    test_find_3d_print_tool()
    test_find_pcb_tool()
    test_find_github_repos()
    test_generate_design_toolchain()
    print("\n🎉 ALL 5 TESTS PASSED — meek-design-tool-orchestrator-mcp v1.0.0 is sovereign.")