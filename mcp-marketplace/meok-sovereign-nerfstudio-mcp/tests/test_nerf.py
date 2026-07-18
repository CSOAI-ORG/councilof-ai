import sys
import os
import importlib
import importlib.util
sys.path.insert(0, os.path.expanduser("~/clawd/mcp-marketplace/meok-sovereign-shared-core"))
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + "/../meok-sovereign-shared-core")
"""Tests for meok-sovereign-nerfstudio-mcp."""
import os

MODULE_PATH = os.path.join(os.path.dirname(__file__), "..", "sovereign_nerf.py")
spec = importlib.util.spec_from_file_location("sovereign_nerf", MODULE_PATH)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

nerf_list_models = mod.nerf_list_models
nerf_scan_request = mod.nerf_scan_request
nerf_farm_zones = mod.nerf_farm_zones
nerf_export_gltf = mod.nerf_export_gltf
nerf_full_twin_status = mod.nerf_full_twin_status
nerf_emit_sigil = mod.nerf_emit_sigil
nerf_status = mod.nerf_status
VERSION = mod.VERSION
TOOLS = mod.TOOLS


def test_version():
    assert VERSION == "1.0.0"


def test_tools_count():
    assert len(TOOLS) == 7


def test_list_models():
    r = nerf_list_models()
    assert r["count"] >= 4
    assert "nerfacto" in r["models"]


def test_scan_request():
    r = nerf_scan_request("koi-pond-13m", "nerfacto", 100)
    assert r["local_training"] is True
    assert r["cloud_rendering"] is False
    assert len(r["scan_id"]) == 16


def test_scan_invalid_model():
    r = nerf_scan_request("zone", "invalid_model")
    assert "error" in r


def test_farm_zones():
    r = nerf_farm_zones()
    assert r["count"] >= 8
    assert "koi-pond-13m" in r["zones"]


def test_export_gltf():
    r = nerf_export_gltf("scan-123", "high")
    assert r["format"] == "glTF 2.0"
    assert r["target_engine"] == "Unreal Engine 5.8"


def test_full_twin_status():
    r = nerf_full_twin_status()
    assert r["ai_navigable"] is True
    assert r["mcp_integrated"] is True
    assert "19,000 sqft" in r["property"]


def test_emit_sigil():
    r = nerf_emit_sigil("scan-123")
    assert len(r["digest"]) == 16


def test_status():
    r = nerf_status()
    assert r["local_training"] is True
    assert r["ue5_export"] is True
    assert r["uk_soil"] is True



if __name__ == "__main__":
    test_version()
    print("PASS: test_version")
    test_tools_count()
    print("PASS: test_tools_count")
    test_list_models()
    print("PASS: test_list_models")
    test_scan_request()
    print("PASS: test_scan_request")
    test_scan_invalid_model()
    print("PASS: test_scan_invalid_model")
    test_farm_zones()
    print("PASS: test_farm_zones")
    test_export_gltf()
    print("PASS: test_export_gltf")
    test_full_twin_status()
    print("PASS: test_full_twin_status")
    test_emit_sigil()
    print("PASS: test_emit_sigil")
    test_status()
    print("PASS: test_status")
    print("\n" + str(10) + " tests complete")


