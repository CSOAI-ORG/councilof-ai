"""Tests for meek-defoneos-pricing-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from meek_defoneos_pricing_mcp.server import pricing_tiers, pricing_get, pricing_year_3_forecast, pricing_competitor_comparison, pricing_overview

def test_pricing_tiers():
    r = pricing_tiers()
    assert r["count"] == 7
    print(f"✅ test_tiers: {r['count']} pricing tiers")

def test_pricing_get():
    r = pricing_get(tier=1)
    assert "Open-source MIT" in r["name"]
    print(f"✅ test_get: tier 1 = {r['name']}")

def test_pricing_year_3_forecast():
    r = pricing_year_3_forecast()
    assert r["year_3_forecast_gbp"] == 76200000
    assert r["year"] == 3
    print(f"✅ test_forecast: £{r['year_3_forecast_gbp']} Year 3 ARR")

def test_pricing_competitor_comparison():
    r = pricing_competitor_comparison()
    assert len(r["competitors"]) == 5
    print(f"✅ test_competitors: {len(r['competitors'])} competitors (Palantir + Salesforce + Snowflake + AWS + DEFONEOS)")

def test_pricing_overview():
    r = pricing_overview()
    assert r["tiers"] == 7
    print(f"✅ test_overview: {r['name']} ({r['year_3_arr_forecast_gbp']} Year 3 ARR)")

if __name__ == "__main__":
    test_pricing_tiers()
    test_pricing_get()
    test_pricing_year_3_forecast()
    test_pricing_competitor_comparison()
    test_pricing_overview()
    print("\n🎉 ALL 5 TESTS PASSED — meek-defoneos-pricing-mcp v1.0.0 is sovereign. 7 pricing tiers ready.")