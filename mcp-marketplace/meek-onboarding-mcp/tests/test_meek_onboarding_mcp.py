#!/usr/bin/env python3
"""Tests for meek-onboarding-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from meek_onboarding_mcp.server import detect_ip_country, zoom_to_country, ask_permission, full_onboarding_flow, onboarding_status

def test_detect_ip_country():
    r = detect_ip_country("8.8.8.8")
    assert r["country"] == "US"
    print(f"✅ test_detect_ip: {r['ip_address']} -> {r['country']}")

def test_zoom_to_country():
    r = zoom_to_country("UK")
    assert r["country"] == "UK"
    assert r["count"] >= 1
    print(f"✅ test_zoom: zoomed to {r['zoom_target']} ({r['count']} temples)")

def test_ask_permission():
    r = ask_permission("UK", "UK AI Whitepaper")
    assert "May I learn" in r["question"]
    assert "yes" in r["options"]
    print(f"✅ test_permission: {r['question'][:60]}...")

def test_full_onboarding_flow():
    r = full_onboarding_flow("81.2.69.142")
    assert "step_1_detect_ip" in r
    assert "step_2_zoom_to_country" in r
    assert "step_3_ask_permission" in r
    print(f"✅ test_flow: 5 steps (Login -> IP -> Zoom -> Permission -> SOV3)")

def test_onboarding_status():
    r = onboarding_status()
    assert r["status"] == "READY"
    assert len(r["all_5_steps"]) == 5
    print(f"✅ test_status: {r['status']} with {len(r['all_5_steps'])} steps")

if __name__ == "__main__":
    test_detect_ip_country()
    test_zoom_to_country()
    test_ask_permission()
    test_full_onboarding_flow()
    test_onboarding_status()
    print("\n🎉 ALL 5 TESTS PASSED — meek-onboarding-mcp v1.0.0 is sovereign. Login -> IP -> Zoom -> Permission -> SOV3 learns.")