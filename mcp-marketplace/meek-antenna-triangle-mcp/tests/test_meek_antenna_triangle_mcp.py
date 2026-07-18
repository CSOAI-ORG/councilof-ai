#!/usr/bin/env python3
"""Tests for meek-antenna-triangle-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from meek_antenna_triangle_mcp.server import (
    antenna_triangle_geometry,
    three_antennae,
    sovereign_centroid,
    triangle_relationships,
    antenna_verdict,
)


def test_antenna_triangle_geometry():
    r = antenna_triangle_geometry()
    assert r["shape"] == "triangle"
    assert r["centroid"]["x"] == 0 and r["centroid"]["y"] == 0
    assert len(r["vertices"]) == 3
    print(f"✅ test_geometry: triangle with centroid at (0,0), area={r['area']:.3f}")


def test_three_antennae():
    r = three_antennae()
    assert r["total_antennae"] == 3
    assert len(r["antennae"]) == 3
    print(f"✅ test_antennae: 3 antennae (DEF ONE OS + MEOK + CSOAI)")


def test_sovereign_centroid():
    r = sovereign_centroid()
    assert r["x"] == 0 and r["y"] == 0
    assert r["position"] == "centroid of the triangle (the equilibrium)"
    print(f"✅ test_centroid: sovereign at (0,0), distance={r['distance_from_each_vertex']}")


def test_triangle_relationships():
    r = triangle_relationships()
    assert r["total_edges"] == 3
    assert r["total_vertices"] == 3
    print(f"✅ test_relationships: {r['total_edges']} edges + {r['total_vertices']} vertices = 7 points")


def test_antenna_verdict():
    r = antenna_verdict()
    assert r["triangle_aligned"] is True
    assert r["antennae_count"] == 3
    print(f"✅ test_verdict: {r['verdict']}")


if __name__ == "__main__":
    test_antenna_triangle_geometry()
    test_three_antennae()
    test_sovereign_centroid()
    test_triangle_relationships()
    test_antenna_verdict()
    print("\n🎉 ALL 5 TESTS PASSED — meek-antenna-triangle-mcp v1.0.0 is sovereign. The antenna is the triangle.")