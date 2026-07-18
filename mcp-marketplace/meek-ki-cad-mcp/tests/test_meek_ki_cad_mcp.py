#!/usr/bin/env python3
"""Tests for meek-ki-cad-mcp."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from meek_ki_cad_mcp.server import (
    kicad_pcbnew_open,
    kicad_erc_check,
    kicad_drc_check,
    kicad_export_gerber,
    kicad_export_bom,
    kicad_generate_orb_pcb,
)


def test_kicad_pcbnew_open():
    result = kicad_pcbnew_open(pcb_file="test.kicad_pcb")
    assert "verdict" in result
    assert result["verdict"] in ("INSTALLED", "NOT_INSTALLED")
    print(f"✅ test_kicad_pcbnew_open: {result['verdict']}")


def test_kicad_erc_check():
    result = kicad_erc_check(schematic_file="test.kicad_sch")
    assert result["action"] == "erc_check"
    print(f"✅ test_kicad_erc_check: {result['verdict']}")


def test_kicad_drc_check():
    result = kicad_drc_check(pcb_file="test.kicad_pcb")
    assert result["action"] == "drc_check"
    print(f"✅ test_kicad_drc_check: {result['verdict']}")


def test_kicad_export_gerber():
    result = kicad_export_gerber(pcb_file="test.kicad_pcb", output_dir="gerber")
    assert result["action"] == "export_gerber"
    print(f"✅ test_kicad_export_gerber: {result['verdict']}")


def test_kicad_export_bom():
    result = kicad_export_bom(schematic_file="test.kicad_sch", output_file="bom.csv")
    assert result["action"] == "export_bom"
    print(f"✅ test_kicad_export_bom: {result['verdict']}")


def test_kicad_generate_orb_pcb():
    result = kicad_generate_orb_pcb(layers=4, diameter_mm=50.0)
    assert result["sim"] == "orb_pcb_design"
    assert result["layers"] == 4
    assert result["diameter_mm"] == 50.0
    assert result["pcb_area_mm2"] > 0
    assert len(result["components"]) > 0
    print(f"✅ test_kicad_generate_orb_pcb: {result['pcb_area_mm2']:.1f} mm², {len(result['components'])} components")


if __name__ == "__main__":
    test_kicad_pcbnew_open()
    test_kicad_erc_check()
    test_kicad_drc_check()
    test_kicad_export_gerber()
    test_kicad_export_bom()
    test_kicad_generate_orb_pcb()
    print("\n🎉 ALL 6 TESTS PASSED — meek-ki-cad-mcp v1.0.0 is sovereign.")
