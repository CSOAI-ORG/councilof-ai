#!/usr/bin/env python3
"""Tests for meek-3d-print-toolchain-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from meek_3d_print_toolchain_mcp.server import (
    generate_stl,
    slice_for_qidi,
    generate_gcode,
    estimate_print_time,
    qidi_print_job,
)


def test_generate_stl():
    r = generate_stl(component="orb_bladder", material="PVA")
    assert "openscad" in r["openscad_cmd"]
    assert r["stl_file"] == "orb_bladder.stl"
    print(f"✅ test_generate_stl: {r['openscad_cmd']}")


def test_slice_for_qidi():
    r = slice_for_qidi(stl_file="orb_bladder.stl", material="PVA")
    assert "prusa-slicer" in r["prusaslicer_cmd"]
    assert r["gcode_file"] == "orb_bladder.gcode"
    print(f"✅ test_slice: {r['gcode_file']}")


def test_generate_gcode():
    r = generate_gcode(stl_file="orb_bladder.stl", material="PVA")
    assert r["gcode_file"] == "orb_bladder.gcode"
    print(f"✅ test_generate_gcode: {r['estimated_gcode_size_mb']} MB")


def test_estimate_print_time():
    r = estimate_print_time(stl_file="orb_bladder.stl", material="PVA", infill_pct=20)
    assert r["estimated_print_time_s"] > 0
    assert r["material_mass_g"] > 0
    print(f"✅ test_estimate: {r['estimated_print_time_hours']:.2f}h, {r['material_mass_g']:.1f}g")


def test_qidi_print_job():
    r = qidi_print_job(gcode_file="orb_bladder.gcode", qidi_ip="192.168.50.21", qidi_port=7125)
    assert r["print_status"] == "QUEUED"
    assert "192.168.50.21" in r["curl_cmd"]
    print(f"✅ test_qidi_job: {r['print_status']}, ip={r['qidi_ip']}")


if __name__ == "__main__":
    test_generate_stl()
    test_slice_for_qidi()
    test_generate_gcode()
    test_estimate_print_time()
    test_qidi_print_job()
    print("\n🎉 ALL 5 TESTS PASSED — meek-3d-print-toolchain-mcp v1.0.0 is sovereign. The QIDI Max4 is ready.")