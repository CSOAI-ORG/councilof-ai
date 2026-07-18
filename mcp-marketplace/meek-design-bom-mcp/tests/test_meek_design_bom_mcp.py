#!/usr/bin/env python3
"""Tests for meek-design-bom-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from meek_design_bom_mcp.server import (
    generate_orb_bom,
    generate_spine_bom,
    generate_humanoid_bom,
    estimate_cost,
    find_suppliers,
)


def test_generate_orb_bom():
    r = generate_orb_bom()
    assert r["total_components"] == 20
    assert r["prototype_cost_gbp"] > 100
    print(f"✅ test_orb_bom: {r['total_components']} components, £{r['prototype_cost_gbp']:.0f} prototype")


def test_generate_spine_bom():
    r = generate_spine_bom()
    assert r["prototype_cost_gbp"] > 1000
    print(f"✅ test_spine_bom: £{r['prototype_cost_gbp']} prototype")


def test_generate_humanoid_bom():
    r = generate_humanoid_bom(num_muscle_orbs=5000, num_sensor_orbs=4, num_brain_orbs=1)
    assert r["total_orbs"] == 5005
    print(f"✅ test_humanoid_bom: {r['total_orbs']} orbs, £{r['total_prototype_cost_gbp']:,.0f} prototype, £{r['total_mass_production_cost_gbp']:,.0f} mass production")


def test_estimate_cost():
    r = estimate_cost(num_orbs=5005, prototype=True)
    assert r["total_cost_gbp"] > 900000
    print(f"✅ test_estimate: {r['num_orbs']} orbs, £{r['total_cost_gbp']:,.0f}")


def test_find_suppliers():
    r = find_suppliers(component_category="all")
    assert len(r["uk_suppliers"]) > 0
    assert len(r["eu_suppliers"]) > 0
    assert len(r["us_suppliers"]) > 0
    print(f"✅ test_suppliers: {len(r['uk_suppliers'])} UK + {len(r['eu_suppliers'])} EU + {len(r['us_suppliers'])} US")


if __name__ == "__main__":
    test_generate_orb_bom()
    test_generate_spine_bom()
    test_generate_humanoid_bom()
    test_estimate_cost()
    test_find_suppliers()
    print("\n🎉 ALL 5 TESTS PASSED — meek-design-bom-mcp v1.0.0 is sovereign. The full BOM is ready.")