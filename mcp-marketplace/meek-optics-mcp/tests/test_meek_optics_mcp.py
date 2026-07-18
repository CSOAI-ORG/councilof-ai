#!/usr/bin/env python3
"""Tests for meek-optics-mcp."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from meek_optics_mcp.server import (
    thin_film_interference,
    ray_optics_lens,
    laser_spot_size,
    fiber_optic_attenuation,
    run_gold_spiral_optics_sim,
)


def test_thin_film_interference():
    result = thin_film_interference(n_film=1.5, thickness_nm=200, wavelength_nm=550)
    assert 0 <= result["reflectance"] <= 1
    assert 0 <= result["transmittance"] <= 1
    print(f"✅ test_thin_film_interference: R={result['reflectance']:.3f}, T={result['transmittance']:.3f}")


def test_ray_optics_lens():
    result = ray_optics_lens(focal_length_mm=50, lens_diameter_mm=25.4)
    assert result["na"] > 0
    assert result["f_number"] > 0
    print(f"✅ test_ray_optics_lens: NA={result['na']:.3f}, f/{result['f_number']:.1f}")


def test_laser_spot_size():
    result = laser_spot_size(wavelength_nm=1550, divergence_mrad=0.1, distance_m=100)
    assert result["spot_diameter_mm"] > 0
    print(f"✅ test_laser_spot_size: spot at 100m = {result['spot_diameter_mm']:.1f} mm")


def test_fiber_optic_attenuation():
    result = fiber_optic_attenuation(length_km=10, attenuation_db_per_km=0.2, input_power_dbm=0)
    assert result["total_loss_db"] == 2.0
    assert result["output_power_dbm"] == -2.0
    print(f"✅ test_fiber_optic_attenuation: 10km → {result['total_loss_db']} dB loss")


def test_run_gold_spiral_optics_sim():
    result = run_gold_spiral_optics_sim(spiral_pitch=5.0, wire_width=0.5, wavelength=1550e-9)
    assert result["effective_refractive_index"] > 1.5
    assert result["verdict"] in ("PASS", "MARGINAL")
    print(f"✅ test_run_gold_spiral_optics_sim: n_eff={result['effective_refractive_index']:.3f}, verdict={result['verdict']}")


if __name__ == "__main__":
    test_thin_film_interference()
    test_ray_optics_lens()
    test_laser_spot_size()
    test_fiber_optic_attenuation()
    test_run_gold_spiral_optics_sim()
    print("\n🎉 ALL 5 TESTS PASSED — meek-optics-mcp v1.0.0 is sovereign.")
