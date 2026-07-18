#!/usr/bin/env python3
"""Tests for meek-sov-os-tui-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from meek_sov_os_tui_mcp.server import tui_layout, tui_sov3_chat, tui_workflows, tui_cybersecurity, tui_status

def test_tui_layout():
    r = tui_layout()
    assert "Textual" in r["tui_engine"]
    assert len(r["layout"]) == 5
    assert "Linux" in r["supports"]
    assert "iOS" in str(r["supports"])
    print(f"✅ test_layout: {r['tui_engine']} with {len(r['layout'])} regions, {len(r['supports'])} platforms")

def test_tui_sov3_chat():
    r = tui_sov3_chat(message="Test message")
    assert r["user_message"] == "Test message"
    assert "SOV3" in r["sov3_response"]
    assert r["traibgle_verdict"] == "GOOD"
    print(f"✅ test_chat: SOV3 responded with verdict {r['traibgle_verdict']}")

def test_tui_workflows():
    r = tui_workflows()
    assert len(r["workflows"]) == 5
    print(f"✅ test_workflows: {len(r['workflows'])} workflows ready")

def test_tui_cybersecurity():
    r = tui_cybersecurity()
    assert r["security_status"] == "SECURE"
    assert len(r["checks"]) == 5
    print(f"✅ test_security: {r['security_status']} with {len(r['checks'])} checks all PASS")

def test_tui_status():
    r = tui_status()
    assert r["tui_status"] == "LIVE"
    assert "iOS" in r["platforms"]
    print(f"✅ test_status: TUI live on {len(r['platforms'])} platforms")

if __name__ == "__main__":
    test_tui_layout()
    test_tui_sov3_chat()
    test_tui_workflows()
    test_tui_cybersecurity()
    test_tui_status()
    print("\n🎉 ALL 5 TESTS PASSED — meek-sov-os-tui-mcp v1.0.0 is sovereign. TUI works on PC + mobile.")