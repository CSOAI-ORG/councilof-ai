import sys
import os
import importlib
import importlib.util
sys.path.insert(0, os.path.expanduser("~/clawd/mcp-marketplace/meok-sovereign-shared-core"))
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + "/../meok-sovereign-shared-core")
"""Tests for meok-sovereign-meshtastic-mcp."""
import os

MODULE_PATH = os.path.join(os.path.dirname(__file__), "..", "sovereign_mesh.py")
spec = importlib.util.spec_from_file_location("sovereign_mesh", MODULE_PATH)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

mesh_list_nodes = mod.mesh_list_nodes
mesh_list_channels = mod.mesh_list_channels
mesh_send_message = mod.mesh_send_message
mesh_share_gps = mod.mesh_share_gps
mesh_telemetry = mod.mesh_telemetry
mesh_care_floor = mod.mesh_care_floor
mesh_status = mod.mesh_status
mesh_emit_sigil = mod.mesh_emit_sigil
VERSION = mod.VERSION
TOOLS = mod.TOOLS


def test_version():
    assert VERSION == "1.0.0"


def test_tools_count():
    assert len(TOOLS) == 8


def test_list_nodes():
    r = mesh_list_nodes()
    assert r["count"] >= 4
    assert "t-beam" in r["nodes"]


def test_list_channels():
    r = mesh_list_channels()
    assert "farm-ops" in r["channels"]


def test_send_encrypted():
    r = mesh_send_message("farm-ops", "node-1", "node-2", "check pond")
    assert r["encrypted"] is True
    assert r["delivered_offline"] is True


def test_send_public():
    r = mesh_send_message("public", "node-1", "node-2", "hello")
    assert r["encrypted"] is False


def test_send_invalid_channel():
    r = mesh_send_message("invalid", "a", "b")
    assert "error" in r


def test_share_gps():
    r = mesh_share_gps("node-1", 51.5, -0.1)
    assert r["encrypted"] is True


def test_telemetry():
    r = mesh_telemetry("node-1", 22.5, 85, -75)
    assert r["battery_pct"] == 85


def test_care_floor_approved():
    r = mesh_care_floor("send message")
    assert r["approved"] is True


def test_care_floor_banned():
    r = mesh_care_floor("jam the network")
    assert r["approved"] is False


def test_status():
    r = mesh_status()
    assert r["cellular_required"] is False
    assert r["internet_required"] is False
    assert r["central_server"] is False


def test_emit_sigil():
    r = mesh_emit_sigil("msg-1")
    assert len(r["digest"]) == 16



if __name__ == "__main__":
    test_version()
    print("PASS: test_version")
    test_tools_count()
    print("PASS: test_tools_count")
    test_list_nodes()
    print("PASS: test_list_nodes")
    test_list_channels()
    print("PASS: test_list_channels")
    test_send_encrypted()
    print("PASS: test_send_encrypted")
    test_send_public()
    print("PASS: test_send_public")
    test_send_invalid_channel()
    print("PASS: test_send_invalid_channel")
    test_share_gps()
    print("PASS: test_share_gps")
    test_telemetry()
    print("PASS: test_telemetry")
    test_care_floor_approved()
    print("PASS: test_care_floor_approved")
    test_care_floor_banned()
    print("PASS: test_care_floor_banned")
    test_status()
    print("PASS: test_status")
    test_emit_sigil()
    print("PASS: test_emit_sigil")
    print("\n" + str(13) + " tests complete")


