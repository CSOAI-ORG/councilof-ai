"""Tests for meok-sovereign-ue5-bridge-mcp (UE5 SovTown bridge)."""
import os, tempfile
_TEST_DIR = tempfile.mkdtemp(prefix="sov_ue5_test_")
os.environ["SOV_UE5_KEY"] = os.path.join(_TEST_DIR, "key.pem")
import meok_sovereign_ue5_bridge_mcp as ue5_mod
from meok_sovereign_ue5_bridge_mcp import (
    ue5_engine_status, ue5_avatar_list, ue5_hive_spawn,
    ue5_iot_beacon, ue5_mcp_bridge,
    UE5_CONSTANTS, AVATARS, HIVES, BEACONS,
)


def reset_state():
    ue5_mod.BEACONS.clear()


def test_engine_status_1640_lines():
    r = ue5_engine_status()
    assert r["engine_total_lines_cpp"] == 1640
    assert r["engine_files"] == 10
    assert r["engine_modules"] == ["Core", "Avatar", "Hives", "IoT", "MCP"]


def test_engine_version():
    r = ue5_engine_status()
    assert r["renderer"] == "UE5.7"
    assert r["substrate"] == "MEOK OS"


def test_12_avatars():
    r = ue5_avatar_list()
    assert r["count"] == 12


def test_avatars_match_12_generals():
    """Each avatar name should match one of the 12 Generals."""
    avatar_names = {a["name"] for a in AVATARS}
    expected = {"Dragon", "Scribe", "Argus", "Shield", "Builder", "Abacus",
                "Lex", "Scale", "Crow", "Gear", "Voice", "Owl"}
    assert avatar_names == expected


def test_avatar_size_reasonable():
    for a in AVATARS:
        assert 10.0 <= a["size_mb"] <= 15.0


def test_33_hives():
    r = ue5_hive_spawn(1)  # Just to trigger constants load
    assert len(HIVES) == 33


def test_hive_spawn_valid():
    r = ue5_hive_spawn(hive_id=1, avatar_id=12)  # London + Owl (avatar 12)
    assert r["hive"] == "London"
    assert r["avatar"] == "Owl"
    assert r["location"] == "UK"


def test_hive_spawn_invalid_hive():
    r = ue5_hive_spawn(hive_id=99)
    assert "error" in r


def test_hive_spawn_invalid_avatar():
    r = ue5_hive_spawn(hive_id=1, avatar_id=99)
    assert "error" in r


def test_hive_spawn_all_33():
    """Spawn hives 1-33 to verify all entries are valid."""
    for h in range(1, 34):
        r = ue5_hive_spawn(h, avatar_id=1)
        assert "hive" in r


def test_iot_beacon_basic():
    reset_state()
    r = ue5_iot_beacon(ph=7.4, do_mgL=8.0, temp_c=22.0)
    assert r["ph"] == 7.4
    assert r["do_mgL"] == 8.0
    assert r["temp_c"] == 22.0


def test_iot_beacon_persists():
    reset_state()
    ue5_iot_beacon(ph=7.5)
    ue5_iot_beacon(ph=7.6)
    assert len(BEACONS) == 2


def test_mcp_bridge():
    r = ue5_mcp_bridge("audit_eu_ai_act", {"code": "test"})
    assert r["tool_name"] == "audit_eu_ai_act"
    assert "bridge" in r


def test_no_external_deps():
    import meok_sovereign_ue5_bridge_mcp as m
    src = open(m.__file__).read()
    assert "import ollama" not in src
    assert "import urllib" not in src
    assert "import requests" not in src


def test_signed_outputs():
    reset_state()
    r1 = ue5_engine_status()
    assert "kid" in r1 and "sig" in r1 and "ts" in r1
    r2 = ue5_avatar_list()
    assert "kid" in r2 and "sig" in r2 and "ts" in r2
    r3 = ue5_hive_spawn(1)
    assert "kid" in r3 and "sig" in r3 and "ts" in r3
    r4 = ue5_iot_beacon()
    assert "kid" in r4 and "sig" in r4 and "ts" in r4
    r5 = ue5_mcp_bridge("test")
    assert "kid" in r5 and "sig" in r5 and "ts" in r5


def test_absorbed_1640_lines():
    """The MCP absorbs the 1640 lines of UE5 C++."""
    r = ue5_engine_status()
    assert r["absorbed_lines_cpp"] == 1640


def test_5_cpp_modules():
    """All 5 UE5 C++ modules are represented."""
    r = ue5_engine_status()
    assert set(r["engine_modules"]) == {"Core", "Avatar", "Hives", "IoT", "MCP"}


def test_full_lifecycle():
    """Spawn → beacon → bridge."""
    reset_state()
    spawn = ue5_hive_spawn(1, avatar_id=12)  # London + Dragon
    assert spawn["actor_id"] != ""
    beacon = ue5_iot_beacon(hive_id=1)
    assert beacon["hive_id"] == 1
    bridge = ue5_mcp_bridge("audit_eu_ai_act", {"hive": "London"})
    assert "audit" in bridge["tool_name"]