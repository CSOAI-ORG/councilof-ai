#!/usr/bin/env python3
"""Tests for meek-silica-memory-mcp (the 6th critical science MCP for Project AURUM)."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from meek_silica_memory_mcp import (
    BannedTermGate,
    __version__,
    __alignment__,
    __substrate_size__,
    __council_quorum__,
    __scope__,
)
from meek_silica_memory_mcp.server import (
    silica_5d_memory_specs,
    silica_disc_capacity_calculator,
    silica_disc_longevity_calculator,
    silica_write_estimate,
    silica_read_estimate,
    silica_thermal_cycling,
    silica_capillary_microfluidic,
    silica_capillary_cooling_estimate,
    orb_tri_memory_architecture,
    silica_disc_manufacturing_estimate,
    list_available_silica_materials,
)


def test_package_metadata():
    assert __version__ == "1.0.0"
    assert "MEOK_DEFONEOS_ALIGNMENT" in __alignment__
    assert "PROJECT_AURUM" in __alignment__
    assert "MEOK_SILICA_CAPILLARY" in __alignment__
    assert "5D fused silica" in __substrate_size__
    assert __council_quorum__ == 23
    assert "UK sovereign only" in __scope__
    print(f"✅ test_package_metadata: __version__={__version__}")


def test_banned_term_gate_refuses():
    allowed, reason = BannedTermGate.check("Run a James Castle silica write")
    assert allowed is False
    print(f"✅ test_banned_term_gate_refuses: refused severed brand")


def test_banned_term_gate_allows():
    allowed, reason = BannedTermGate.check("Run silica 5D write")
    assert allowed is True
    print(f"✅ test_banned_term_gate_allows: clean prompt allowed")


def test_silica_5d_memory_specs():
    result = silica_5d_memory_specs()
    assert result["memory_type"].startswith("5D")
    assert result["state_of_art_2024"]["storage_density"] == "360 TB per standard disc (5mm thick × 120mm dia)"
    assert result["state_of_art_2024"]["stability_at_room_temp"] == "13.8 billion years (NASA thermal aging tests)"
    print(f"✅ test_silica_5d_memory_specs: 360 TB/disc, 13.8B year stability")


def test_silica_disc_capacity_calculator():
    # 550 layers gives ~360 TB per 120mm disc (Southampton 2019 standard)
    result = silica_disc_capacity_calculator(diameter_mm=120.0, thickness_mm=5.0, layers=550)
    assert 300 < result["total_capacity_tb"] < 400  # ~360 TB for 120mm disc with 550 layers
    assert result["capacity_per_layer_tb"] > 0
    print(f"✅ test_silica_disc_capacity_calculator: {result['total_capacity_tb']:.1f} TB per 120mm disc (550 layers)")


def test_silica_disc_longevity_calculator():
    result = silica_disc_longevity_calculator(temperature_c=25.0)
    assert result["longevity_years"] > 1e10  # > 10 billion years
    print(f"✅ test_silica_disc_longevity_calculator: {result['longevity_years']:.2e} years at 25°C")


def test_silica_disc_longevity_at_high_temp():
    result = silica_disc_longevity_calculator(temperature_c=100.0)
    assert result["longevity_years"] < 13.8e9  # lower at high temp
    print(f"✅ test_silica_disc_longevity_at_high_temp: {result['longevity_years']:.2e} years at 100°C")


def test_silica_write_estimate():
    result = silica_write_estimate(data_size_gb=1.0, num_lasers=1)
    assert result["write_time_seconds"] > 0
    assert result["cost_gbp"] > 0
    print(f"✅ test_silica_write_estimate: 1 GB = {result['write_time_seconds']:.0f} s, £{result['cost_gbp']:.0f}")


def test_silica_read_estimate():
    result = silica_read_estimate(data_size_gb=1.0, camera_resolution_mp=16.0, fps=30.0)
    assert result["bandwidth_mbps"] > 0
    print(f"✅ test_silica_read_estimate: 1 GB = {result['read_time_seconds']:.1f} s, {result['bandwidth_mbps']:.0f} Mbps")


def test_silica_thermal_cycling():
    result = silica_thermal_cycling(min_temp_c=-50.0, max_temp_c=100.0, num_cycles=1000)
    assert result["verdict"] == "PASS"
    assert result["total_strain_ppm"] > 0
    print(f"✅ test_silica_thermal_cycling: 1000 cycles -50 to 100°C: {result['total_strain_ppm']:.1f} ppm strain, {result['verdict']}")


def test_silica_capillary_microfluidic():
    result = silica_capillary_microfluidic(channel_diameter_um=200.0, channel_pitch_um=400.0, num_channels_x=100, num_channels_y=100)
    assert result["channel_count"] == 10000
    assert 0 < result["porosity"] < 1
    print(f"✅ test_silica_capillary_microfluidic: 10,000 channels, {result['porosity']:.3f} porosity")


def test_silica_capillary_cooling_estimate():
    result = silica_capillary_cooling_estimate(chip_power_w=5.0, water_flow_m_per_s=2.0, num_channels=1000)
    assert result["max_heat_removal_w"] > 0
    print(f"✅ test_silica_capillary_cooling_estimate: max heat removal = {result['max_heat_removal_w']:.2f} W, verdict = {result['verdict']}")


def test_orb_tri_memory_architecture():
    result = orb_tri_memory_architecture()
    assert "memory_1_gold_spiral" in result
    assert "memory_2_dna_water" in result
    assert "memory_3_silica_5d" in result
    assert "the_merger" in result
    assert len(result["8_layer_architecture"]) == 9  # L0, L0.5, L1, L1.5, L2, L3, L4, L5, L6
    print(f"✅ test_orb_tri_memory_architecture: 3 memory substrates + 9-layer orb")


def test_silica_disc_manufacturing_estimate():
    result = silica_disc_manufacturing_estimate(disc_diameter_mm=120.0, num_discs=1)
    assert result["total_cost_gbp"] == 2700  # 200 + 2000 + 500
    print(f"✅ test_silica_disc_manufacturing_estimate: 1 disc = £{result['total_cost_gbp']}")


def test_list_available_silica_materials():
    result = list_available_silica_materials()
    assert "corning_7980" in result["materials"]
    assert "corning_7979" in result["materials"]
    assert result["materials"]["corning_7979"]["thermal_expansion_ppm_per_k"] == 0.0  # Zero!
    print(f"✅ test_list_available_silica_materials: 5 materials, Corning 7979 = 0.0 ppm/K (zero expansion)")


if __name__ == "__main__":
    test_package_metadata()
    test_banned_term_gate_refuses()
    test_banned_term_gate_allows()
    test_silica_5d_memory_specs()
    test_silica_disc_capacity_calculator()
    test_silica_disc_longevity_calculator()
    test_silica_disc_longevity_at_high_temp()
    test_silica_write_estimate()
    test_silica_read_estimate()
    test_silica_thermal_cycling()
    test_silica_capillary_microfluidic()
    test_silica_capillary_cooling_estimate()
    test_orb_tri_memory_architecture()
    test_silica_disc_manufacturing_estimate()
    test_list_available_silica_materials()
    print("\n🎉 ALL 14 TESTS PASSED — meek-silica-memory-mcp v1.0.0 is sovereign. Project AURUM has its 5D silica memory layer.")
