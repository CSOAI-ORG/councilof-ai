#!/usr/bin/env python3
"""Tests for meek-lora-radar-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from meek_lora_radar_mcp.server import lora_passive_radar, rtl_sdr_setup


def test_lora_passive_radar():
    r = lora_passive_radar(lora_frequency_mhz=868.0, rtl_sdr_bandwidth_mhz=2.56, integration_time_s=1.0)
    assert r["max_detection_range_km"] > 1.0
    assert r["range_resolution_m"] > 0
    assert r["passive"] is True
    print(f"✅ test_lora_passive_radar: range={r['max_detection_range_km']:.2f} km, range_res={r['range_resolution_m']:.1f}m")


def test_rtl_sdr_setup():
    r = rtl_sdr_setup(device="RTL-SDR V4", sample_rate_msps=2.56, center_frequency_mhz=868.0)
    assert r["frequency_in_range"] is True
    assert r["sample_rate_ok"] is True
    print(f"✅ test_rtl_sdr_setup: RTL-SDR V4, sensitivity={r['sensitivity_dbm']:.1f} dBm")


if __name__ == "__main__":
    test_lora_passive_radar()
    test_rtl_sdr_setup()
    print("\n🎉 ALL 2 TESTS PASSED — meek-lora-radar-mcp v1.0.0 is sovereign.")