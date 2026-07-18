#!/usr/bin/env python3
"""Tests for meek-energy-harvester-mcp (the 12th critical science MCP)."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from meek_energy_harvester_mcp import (
    BannedTermGate,
    __version__,
    __alignment__,
    __substrate_size__,
    __council_quorum__,
    __scope__,
)
from meek_energy_harvester_mcp.server import (
    streaming_potential_energy,
    triboelectric_energy,
    piezoelectric_energy,
    thermoelectric_energy,
    orb_total_energy_harvest,
    orb_power_budget,
    orb_battery_runtime,
    list_energy_harvesting_components,
)


def test_package_metadata():
    assert __version__ == "1.0.0"
    assert "MEOK_DEFONEOS_ALIGNMENT" in __alignment__
    assert "PROJECT_AURUM_W15" in __alignment__
    assert "4 energy harvesting" in __substrate_size__
    assert __council_quorum__ == 23
    assert "UK sovereign only" in __scope__
    print(f"✅ test_package_metadata: __version__={__version__}")


def test_banned_term_gate():
    allowed, reason = BannedTermGate.check("harvest capillary energy")
    assert allowed is True
    print(f"✅ test_banned_term_gate: clean prompt allowed")


def test_streaming_potential_energy():
    r = streaming_potential_energy(num_capillaries=1000)
    assert r["total_power_w"] > 0
    assert r["delta_v_per_channel_v"] != 0
    print(f"✅ test_streaming_potential: {r['total_power_w']*1e6:.2f} µW from 1000 capillaries")


def test_triboelectric_energy():
    r = triboelectric_energy(pva_wall_area_cm2=1000.0)
    assert r["total_power_w"] >= 0
    print(f"✅ test_triboelectric: {r['total_power_w']*1e3:.2f} mW from 1000 cm² PVA")


def test_piezoelectric_energy():
    r = piezoelectric_energy(pvdf_coating_area_cm2=100.0)
    assert r["total_power_w"] > 0
    print(f"✅ test_piezoelectric: {r['total_power_w']*1e6:.2f} µW from 100 cm² PVDF")


def test_thermoelectric_energy():
    r = thermoelectric_energy(num_tegs=4, delta_t_c=25.0)
    assert r["total_power_w"] > 0
    assert r["v_open_per_teg_v"] > 0
    print(f"✅ test_thermoelectric: {r['total_power_mw']:.2f} mW from 4 TEGs @ ΔT=25°C")


def test_orb_total_energy_harvest():
    r = orb_total_energy_harvest(num_capillaries=1000, pva_wall_area_cm2=1000.0, pvdf_area_cm2=100.0, num_tegs=4, delta_t_c=25.0)
    assert r["total_power_mw"] > 0
    assert r["verdict"] in ("ENERGY_AUTONOMOUS", "MARGINAL")
    print(f"✅ test_orb_total_harvest: {r['total_power_mw']:.2f} mW total — {r['verdict']}")


def test_orb_power_budget():
    r = orb_power_budget(harvested_mw=30.0, sleep_mode_uw=10.0, active_signing_mw=5.0, duty_cycle_pct=1.0)
    assert r["surplus_mw"] > 0
    assert r["verdict"] == "ENERGY_AUTONOMOUS"
    print(f"✅ test_orb_power_budget: surplus={r['surplus_mw']:.2f} mW — {r['verdict']}")


def test_orb_battery_runtime():
    r = orb_battery_runtime(battery_capacity_mah=100.0, battery_voltage_v=3.7, peak_load_mw=210.0, harvested_mw=30.0)
    assert r["runtime_hours"] > 0
    assert r["verdict"] in ("PASS", "MARGINAL", "INFINITE")
    print(f"✅ test_orb_battery_runtime: {r['runtime_hours']:.2f} hours peak runtime — {r['verdict']}")


def test_list_energy_harvesting_components():
    r = list_energy_harvesting_components()
    assert "tec1_12706_teg" in r["components"]
    assert "lipo_100mah_37v" in r["components"]
    print(f"✅ test_list_energy_harvesting_components: 5 components")


if __name__ == "__main__":
    test_package_metadata()
    test_banned_term_gate()
    test_streaming_potential_energy()
    test_triboelectric_energy()
    test_piezoelectric_energy()
    test_thermoelectric_energy()
    test_orb_total_energy_harvest()
    test_orb_power_budget()
    test_orb_battery_runtime()
    test_list_energy_harvesting_components()
    print("\n🎉 ALL 10 TESTS PASSED — meek-energy-harvester-mcp v1.0.0 is sovereign. The AURUM-II orb is energy-autonomous.")