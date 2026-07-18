"""Tests for meek-sov-os-frontend-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from meek_sov_os_frontend_mcp.server import frontend_html_structure, frontend_rh_bar_html, frontend_lh_side_html, frontend_center_chat_html, frontend_cesium_overlay_html, frontend_dorado_west_html, frontend_css_classes, frontend_javascript_handlers, frontend_overview

def test_frontend_html_structure():
    r = frontend_html_structure()
    assert "React 18" in r["framework"]
    assert len(r["structure"]) == 1
    print(f"✅ test_structure: {r['framework']}")

def test_frontend_rh_bar_html():
    r = frontend_rh_bar_html()
    assert r["id"] == "rh-bar"
    assert len(r["children"]) == 8
    print(f"✅ test_rh_bar: {len(r['children'])} children")

def test_frontend_lh_side_html():
    r = frontend_lh_side_html()
    assert r["id"] == "lh-side"
    assert len(r["children"]) == 5
    print(f"✅ test_lh_side: {len(r['children'])} children")

def test_frontend_center_chat_html():
    r = frontend_center_chat_html()
    assert r["id"] == "center-chat"
    assert len(r["children"]) == 5
    print(f"✅ test_center_chat: {len(r['children'])} children")

def test_frontend_cesium_overlay_html():
    r = frontend_cesium_overlay_html()
    assert "Cesium" in r["engine"]
    assert len(r["children"]) == 7
    print(f"✅ test_cesium: {r['engine']} with {len(r['children'])} children")

def test_frontend_dorado_west_html():
    r = frontend_dorado_west_html()
    assert len(r["layers"]) == 8
    print(f"✅ test_dorado: {len(r['layers'])} layers (L0-L7)")

def test_frontend_css_classes():
    r = frontend_css_classes()
    assert "rh-bar" in r
    assert "lh-side" in r
    assert "globe-overlay" in r
    print(f"✅ test_css: {len(r)} CSS classes")

def test_frontend_javascript_handlers():
    r = frontend_javascript_handlers()
    assert len(r["handlers"]) == 12
    print(f"✅ test_handlers: {len(r['handlers'])} JS handlers")

def test_frontend_overview():
    r = frontend_overview()
    assert r["ready"] is True
    assert r["components"] == ["rh-bar", "lh-side", "center-chat", "cesium-container", "dorado-west"]
    print(f"✅ test_overview: {r['name']} ready ({len(r['components'])} components)")

if __name__ == "__main__":
    test_frontend_html_structure()
    test_frontend_rh_bar_html()
    test_frontend_lh_side_html()
    test_frontend_center_chat_html()
    test_frontend_cesium_overlay_html()
    test_frontend_dorado_west_html()
    test_frontend_css_classes()
    test_frontend_javascript_handlers()
    test_frontend_overview()
    print("\n🎉 ALL 9 TESTS PASSED — meek-sov-os-frontend-mcp v1.0.0 is sovereign. The SOV OS frontend is ready.")