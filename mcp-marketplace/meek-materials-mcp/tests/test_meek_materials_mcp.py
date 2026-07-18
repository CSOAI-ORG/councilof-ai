#!/usr/bin/env python3
"""Tests for meek-materials-mcp."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from meek_materials_mcp.server import (
    gold_spiral_materials,
    dna_storage_density,
    run_ase_atomistic,
    materials_project_lookup,
)


def test_gold_spiral_materials():
    result = gold_spiral_materials(spiral_pitch_um=5.0, wire_width_um=0.5, substrate="sapphire")
    assert result["material"] == "gold (99.999% pure)"
    assert result["spiral_resistance_ohm"] > 0
    assert "thermal_conductivity_w_m_k" in result["substrate_properties"]
    print(f"✅ test_gold_spiral_materials: gold R={result['spiral_resistance_ohm']:.2f} Ω")


def test_dna_storage_density():
    result = dna_storage_density(electrode_diameter_um=100, electrode_spacing_um=200, bits_per_dna_strand=100)
    assert result["density_per_cm2"] == 1e7
    assert result["density_bits_per_cm2"] == 1e9  # 10^7 * 100
    assert result["density_bits_per_mm3"] > 0
    print(f"✅ test_dna_storage_density: {result['density_bits_per_cm2']:.0e} bits/cm²")


def test_run_ase_atomistic():
    result = run_ase_atomistic(element="Au", crystal="fcc", lattice_constant_a=4.08)
    assert result["element"] == "Au"
    assert result["coordination_number"] == 12
    assert result["atomic_volume_angstrom3"] > 0
    print(f"✅ test_run_ase_atomistic: Au fcc vol={result['atomic_volume_angstrom3']:.2f} Å³")


def test_materials_project_lookup():
    result = materials_project_lookup(material_id="mp-81")
    assert "engine" in result
    assert "material_id" in result
    print(f"✅ test_materials_project_lookup: {result['engine']}")


if __name__ == "__main__":
    test_gold_spiral_materials()
    test_dna_storage_density()
    test_run_ase_atomistic()
    test_materials_project_lookup()
    print("\n🎉 ALL 4 TESTS PASSED — meek-materials-mcp v1.0.0 is sovereign.")
