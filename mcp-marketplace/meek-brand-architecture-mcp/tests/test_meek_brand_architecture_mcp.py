#!/usr/bin/env python3
"""Tests for meek-brand-architecture-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from meek_brand_architecture_mcp.server import (
    brand_layers,
    sov3_defense_os,
    sov3_public_substrate,
    csoai_certification,
    combined_revenue_forecast,
)


def test_brand_layers():
    r = brand_layers()
    assert r["total_layers"] == 3
    assert r["total_mcps"] == 36
    assert r["total_tests"] == 270
    print(f"✅ test_brand_layers: 3 layers, 36 MCPs, 270 tests")


def test_sov3_defense_os():
    r = sov3_defense_os()
    assert "SOV3³" in r["brand"]
    assert r["domain"] == "defoneos.com"
    print(f"✅ test_sov3_defense: {r['brand']} = {r['domain']}")


def test_sov3_public_substrate():
    r = sov3_public_substrate()
    assert r["brand"] == "SOV3"
    assert r["domain"] == "meok.ai"
    print(f"✅ test_sov3_public: {r['brand']} = {r['domain']}")


def test_csoai_certification():
    r = csoai_certification()
    assert "CSOAI" in r["brand"]
    assert r["domain"] == "csoai.org"
    print(f"✅ test_csoai: {r['brand']} = {r['domain']}")


def test_combined_revenue_forecast():
    r = combined_revenue_forecast()
    assert r["grand_total_arr_gbp"] > 0
    print(f"✅ test_revenue: {r['verdict']}")


if __name__ == "__main__":
    test_brand_layers()
    test_sov3_defense_os()
    test_sov3_public_substrate()
    test_csoai_certification()
    test_combined_revenue_forecast()
    print("\n🎉 ALL 5 TESTS PASSED — meek-brand-architecture-mcp v1.0.0 is sovereign. The 3-layer empire.")