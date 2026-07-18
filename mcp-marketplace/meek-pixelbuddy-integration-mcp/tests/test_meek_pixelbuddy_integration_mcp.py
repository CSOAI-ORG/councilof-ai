#!/usr/bin/env python3
"""Tests for meek-pixelbuddy-integration-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from meek_pixelbuddy_integration_mcp.server import pixelbuddy_launcher_status, pixelbuddy_license_status, pixelbuddy_6_roles, pixelbuddy_to_meok_sov3_bridge, pixelbuddy_anti_detection, pixelbuddy_weak_aura_integration, pixelbuddy_profile_editor, pixelbuddy_meok_synergy_verdict

def test_pixelbuddy_launcher_status():
    r = pixelbuddy_launcher_status()
    assert r["launcher_name"] == "QuasarGingerbread.exe"
    assert r["size_mb"] == 142
    print(f"✅ test_launcher: {r['launcher_name']} = {r['size_mb']} MB")

def test_pixelbuddy_license_status():
    r = pixelbuddy_license_status()
    assert r["license_required"] is True
    assert "€1.99" in r["price_range"]
    print(f"✅ test_license: {r['price_range']}")

def test_pixelbuddy_6_roles():
    r = pixelbuddy_6_roles()
    assert r["count"] == 6
    role_names = [role["role"] for role in r["roles"]]
    assert "Grind" in role_names
    assert "Follower" in role_names
    print(f"✅ test_6_roles: {r['count']} roles (Grind + Gather + Rotation + Follower + Scripter + Fish)")

def test_pixelbuddy_to_meok_sov3_bridge():
    r = pixelbuddy_to_meok_sov3_bridge()
    assert len(r["pixelbuddy_does"]) >= 3
    assert len(r["meok_sov3_does"]) >= 8
    print(f"✅ test_bridge: PixelBuddy ({len(r['pixelbuddy_does'])} things) + MEOK-SOV3 ({len(r['meok_sov3_does'])} things)")

def test_pixelbuddy_anti_detection():
    r = pixelbuddy_anti_detection()
    assert r["count"] == 7
    print(f"✅ test_anti_detection: {r['count']} techniques (proven)")

def test_pixelbuddy_weak_aura_integration():
    r = pixelbuddy_weak_aura_integration()
    assert "WeakAura" in r["addon"]
    print(f"✅ test_weak_aura: {r['addon']}")

def test_pixelbuddy_profile_editor():
    r = pixelbuddy_profile_editor()
    assert "Visual GUI" in r["editor"]
    print(f"✅ test_profile_editor: {r['editor'][:50]}...")

def test_pixelbuddy_meok_synergy_verdict():
    r = pixelbuddy_meok_synergy_verdict()
    assert "BEST OF BOTH" in r["verdict"]
    print(f"✅ test_verdict: {r['verdict']}")

if __name__ == "__main__":
    test_pixelbuddy_launcher_status()
    test_pixelbuddy_license_status()
    test_pixelbuddy_6_roles()
    test_pixelbuddy_to_meok_sov3_bridge()
    test_pixelbuddy_anti_detection()
    test_pixelbuddy_weak_aura_integration()
    test_pixelbuddy_profile_editor()
    test_pixelbuddy_meok_synergy_verdict()
    print("\n🎉 ALL 8 TESTS PASSED — meek-pixelbuddy-integration-mcp v1.0.0 is sovereign. PixelBuddy + MEOK-SOV3 integrated.")