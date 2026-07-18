#!/usr/bin/env python3
"""Tests for meek-sacred-geometry-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from meek_sacred_geometry_mcp.server import (
    tetrahedron_connector,
    octahedron_connector,
    icosahedron_connector,
    traibgle_voting,
    five_radio_per_vertex,
    synergy_verdict,
)


def test_tetrahedron_connector():
    r = tetrahedron_connector(edge_mm=5.0)
    assert r["vertices"] == 4
    assert r["faces"] == 4
    assert r["edges"] == 6
    assert r["radios_per_orb"] == 20
    print(f"✅ test_tetrahedron: 4 vertices, 4 faces, 20 radios")


def test_octahedron_connector():
    r = octahedron_connector(edge_mm=5.0)
    assert r["vertices"] == 6
    assert r["faces"] == 8
    assert r["edges"] == 12
    assert r["radios_per_orb"] == 30
    print(f"✅ test_octahedron: 6 vertices, 8 faces, 30 radios")


def test_icosahedron_connector():
    r = icosahedron_connector(edge_mm=5.0)
    assert r["vertices"] == 12
    assert r["faces"] == 20
    assert r["edges"] == 30
    assert r["radios_per_orb"] == 60
    print(f"✅ test_icosahedron: 12 vertices, 20 faces, 60 radios")


def test_traibgle_voting():
    r = traibgle_voting(good_voters=12, bad_voters=4, neutral_voters=8)
    assert r["geometry"] == "traibgle"
    assert "GOOD" in r["axes"][0]
    # Good=12, Bad=4, Neutral=8
    # Traibgle = (12 - 4) / 37 = 0.216
    assert 0.2 < r["traibgle_score"] < 0.3
    assert r["verdict"] == "PENDING"
    print(f"✅ test_traibgle: score={r['traibgle_score']:.3f}, verdict={r['verdict']}")


def test_five_radio_per_vertex():
    r = five_radio_per_vertex(num_vertices=4)
    assert r["radios_per_vertex"] == 5
    assert r["total_radios"] == 20
    assert r["total_cost_per_orb_gbp"] == 60
    print(f"✅ test_radios: 5 radios × 4 vertices = {r['total_radios']} radios, £{r['total_cost_per_orb_gbp']}")


def test_synergy_verdict():
    r = synergy_verdict()
    assert r["sacred_geometry_aligned"] is True
    assert r["traibgle_voting_aligned"] is True
    print(f"✅ test_synergy: {r['verdict']}")


if __name__ == "__main__":
    test_tetrahedron_connector()
    test_octahedron_connector()
    test_icosahedron_connector()
    test_traibgle_voting()
    test_five_radio_per_vertex()
    test_synergy_verdict()
    print("\n🎉 ALL 6 TESTS PASSED — meek-sacred-geometry-mcp v1.0.0 is sovereign. The inner sovereign architecture is sacred geometry aligned.")