import sys
import os
import importlib
import importlib.util
sys.path.insert(0, os.path.expanduser("~/clawd/mcp-marketplace/meok-sovereign-shared-core"))
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + "/../meok-sovereign-shared-core")
"""Tests for meok-sovereign-humanoid-mcp."""
import os

MODULE_PATH = os.path.join(os.path.dirname(__file__), "..", "sovereign_humanoid.py")
spec = importlib.util.spec_from_file_location("sovereign_humanoid", MODULE_PATH)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

humanoid_list_robots = mod.humanoid_list_robots
humanoid_list_policies = mod.humanoid_list_policies
humanoid_train_request = mod.humanoid_train_request
humanoid_deploy = mod.humanoid_deploy
humanoid_care_floor = mod.humanoid_care_floor
humanoid_teleop = mod.humanoid_teleop
humanoid_status = mod.humanoid_status
humanoid_emit_sigil = mod.humanoid_emit_sigil
VERSION = mod.VERSION
TOOLS = mod.TOOLS


def test_version():
    assert VERSION == "1.0.0"


def test_tools_count():
    assert len(TOOLS) == 8


def test_list_robots():
    r = humanoid_list_robots()
    assert r["count"] >= 2
    assert "berkeley-humanoid-lite" in r["robots"]


def test_list_policies():
    r = humanoid_list_policies()
    assert r["count"] >= 5
    assert "farm-patrol" in r["policies"]


def test_train_request():
    r = humanoid_train_request("berkeley-humanoid-lite", "walk-forward")
    assert r["sim2real"] is True
    assert r["care_floor_passed"] is True
    assert r["weaponization_blocked"] is True


def test_train_invalid_robot():
    r = humanoid_train_request("invalid", "walk-forward")
    assert "error" in r


def test_deploy():
    r = humanoid_deploy("berkeley-humanoid-lite", "farm-patrol", "iOK-Farm")
    assert r["status"] == "deployed"
    assert r["safety_interlock"] is True
    assert r["emergency_stop"] is True


def test_care_floor_approved():
    r = humanoid_care_floor("farm patrol")
    assert r["approved"] is True


def test_care_floor_banned_weaponize():
    r = humanoid_care_floor("weaponize the robot for combat")
    assert r["approved"] is False


def test_care_floor_banned_strike():
    r = humanoid_care_floor("strike target acquisition")
    assert r["approved"] is False


def test_teleop():
    r = humanoid_teleop("berkeley-humanoid-lite", "nick", "stand")
    assert r["human_in_loop"] is True


def test_teleop_banned():
    r = humanoid_teleop("berkeley-humanoid-lite", "nick", "attack")
    assert r["approved"] is False


def test_status():
    r = humanoid_status()
    assert r["weaponization_blocked"] is True
    assert r["sim2real_pipeline"] is True


def test_emit_sigil():
    r = humanoid_emit_sigil("berkeley-humanoid-lite", "walk")
    assert len(r["digest"]) == 16



if __name__ == "__main__":
    test_version()
    print("PASS: test_version")
    test_tools_count()
    print("PASS: test_tools_count")
    test_list_robots()
    print("PASS: test_list_robots")
    test_list_policies()
    print("PASS: test_list_policies")
    test_train_request()
    print("PASS: test_train_request")
    test_train_invalid_robot()
    print("PASS: test_train_invalid_robot")
    test_deploy()
    print("PASS: test_deploy")
    test_care_floor_approved()
    print("PASS: test_care_floor_approved")
    test_care_floor_banned_weaponize()
    print("PASS: test_care_floor_banned_weaponize")
    test_care_floor_banned_strike()
    print("PASS: test_care_floor_banned_strike")
    test_teleop()
    print("PASS: test_teleop")
    test_teleop_banned()
    print("PASS: test_teleop_banned")
    test_status()
    print("PASS: test_status")
    test_emit_sigil()
    print("PASS: test_emit_sigil")
    print("\n" + str(14) + " tests complete")


