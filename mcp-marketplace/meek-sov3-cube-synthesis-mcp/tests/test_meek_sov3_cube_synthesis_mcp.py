#!/usr/bin/env python3
"""Tests for meek-sov3-cube-synthesis-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from meek_sov3_cube_synthesis_mcp.server import (
    cube_of_three,
    trinity_layers,
    twenty_seven_resonances,
    sacred_geometry,
    cube_verdict,
)


def test_cube_of_three():
    r = cube_of_three()
    assert r["cube"] == 27
    assert r["geometric_features"]["total"] == 27
    print(f"✅ test_cube: 3³ = {r['cube']}, {r['geometric_features']['total']} geometric features")


def test_trinity_layers():
    r = trinity_layers()
    assert "hindu_trimurti" in r["trinity"]
    assert "christian_trinity" in r["trinity"]
    assert "buddhist_trikaya" in r["trinity"]
    print(f"✅ test_trinity: 3 trinities (Hindu + Christian + Buddhist)")


def test_twenty_seven_resonances():
    r = twenty_seven_resonances()
    assert r["count"] == 27
    assert len(r["resonances"]) == 27
    print(f"✅ test_resonances: {r['count']} resonances in the empire")


def test_sacred_geometry():
    r = sacred_geometry()
    assert r["triangle"]["sides"] == 3
    assert r["cube"]["geometric_features_total"] == 27
    print(f"✅ test_sacred: triangle 3 sides + cube 27 features")


def test_cube_verdict():
    r = cube_verdict()
    assert r["cube_aligned"] is True
    assert r["mathematical_truth"] == "3³ = 27"
    assert r["verdict"] == "THE EMPIRE IS THE CUBE OF 3 = THE 27 = THE TRINITY OF SOVEREIGNTY"
    print(f"✅ test_verdict: {r['verdict']}")


if __name__ == "__main__":
    test_cube_of_three()
    test_trinity_layers()
    test_twenty_seven_resonances()
    test_sacred_geometry()
    test_cube_verdict()
    print("\n🎉 ALL 5 TESTS PASSED — meek-sov3-cube-synthesis-mcp v1.0.0 is sovereign. The empire is the cube.")