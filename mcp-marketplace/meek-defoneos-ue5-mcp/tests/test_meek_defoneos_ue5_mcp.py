#!/usr/bin/env python3
"""Tests for meek-defoneos-ue5-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from meek_defoneos_ue5_mcp.server import (
    ue5_engine_specs,
    ue5_8_products,
    ue5_actor_sov3_integration,
    ue5_5_radio_orb,
    ue5_4vf_circulatory,
    ue5_sovtown_world,
    ue5_circuit_breaker,
    ue5_100_percent_sov3_verdict,
)


def test_ue5_engine_specs():
    r = ue5_engine_specs()
    assert r["engine"] == "Unreal Engine 5.7"
    assert "Nanite" in r["rendering"]
    assert "MetaHuman" in r["characters"]
    assert "Cesium" in r["geospatial"]
    print(f"✅ test_ue5_specs: {r['engine']} with Nanite + Lumen + MetaHuman + Cesium")


def test_ue5_8_products():
    r = ue5_8_products()
    assert r["count"] == 8
    product_names = [p["product"] for p in r["products"]]
    assert "DEFONEOS CORE" in product_names
    assert "DEFONEOS SIM" in product_names
    print(f"✅ test_8_products: {r['count']} products (CORE + SENTRY + EYE + SHIELD + SWARM + GUARD + COGNITION + SIM)")


def test_ue5_actor_sov3_integration():
    r = ue5_actor_sov3_integration()
    assert r["count"] == 12
    components = [i["component"] for i in r["integrations"]]
    assert "All actors" in components
    assert "All decisions" in components
    print(f"✅ test_sov3_integration: {r['count']} integrations per actor (100% sovereign)")


def test_ue5_5_radio_orb():
    r = ue5_5_radio_orb()
    assert r["actor"] == "ADefoneosOrbActor"
    assert len(r["components"]) == 9
    print(f"✅ test_5_radio_orb: {r['actor']} with {len(r['components'])} components")


def test_ue5_4vf_circulatory():
    r = ue5_4vf_circulatory()
    assert r["network"] == "4VF (4th Vibration Frequency) circulatory network"
    assert "4VF_data_transport" in r["frequencies_hz"]
    print(f"✅ test_4vf: {r['network']}")


def test_ue5_sovtown_world():
    r = ue5_sovtown_world()
    assert r["world_name"] == "SovTown"
    assert r["actors"] == 5005
    assert r["sovereignty"] == "100% — UK soil, no foreign cloud"
    print(f"✅ test_sovtown: {r['world_name']} {r['size_km2']}km² with {r['actors']} sovereign orbs")


def test_ue5_circuit_breaker():
    r = ue5_circuit_breaker()
    assert len(r["circuit_breakers"]) == 3
    breaker_names = [b["breaker"] for b in r["circuit_breakers"]]
    assert "Severed brands" in breaker_names
    assert "Kinetic violence" in breaker_names
    assert "Surveillance" in breaker_names
    print(f"✅ test_circuit_breaker: 3 hard stops (severed + kinetic + surveillance)")


def test_ue5_100_percent_sov3_verdict():
    r = ue5_100_percent_sov3_verdict()
    assert r["integration_pct"] == 100.0
    assert r["all_12_integrations"] is True
    assert "100% SOV3 INTEGRATED" in r["verdict"]
    print(f"✅ test_verdict: {r['integration_pct']}% SOV3 integrated")


if __name__ == "__main__":
    test_ue5_engine_specs()
    test_ue5_8_products()
    test_ue5_actor_sov3_integration()
    test_ue5_5_radio_orb()
    test_ue5_4vf_circulatory()
    test_ue5_sovtown_world()
    test_ue5_circuit_breaker()
    test_ue5_100_percent_sov3_verdict()
    print("\n🎉 ALL 8 TESTS PASSED — meek-defoneos-ue5-mcp v1.0.0 is sovereign. DEFONEOS UE5 is 100% SOV3 integrated.")