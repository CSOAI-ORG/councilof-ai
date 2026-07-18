"""Tests for meok-sovereign-physical-mcp (JARVIS + McKibben + LeKiwi)."""
import os, tempfile
_TEST = tempfile.mkdtemp(prefix="sov_phys_")
os.environ["SOV_PHYS_KEY"] = _TEST + "/k.pem"
from meok_sovereign_physical_mcp import (
    jarvis_status, jarvis_command, jarvis_simulate,
    mckibben_actuate, lekiwi_navigate,
    _JARVIS_STATE, _MCKIBBEN, _LEKIWI, _JARVIS_LOG,
)


def reset():
    _JARVIS_LOG.clear()
    _JARVIS_STATE["pose"] = "standby"
    _JARVIS_STATE["position"] = [0.0, 0.0, 0.0]
    _JARVIS_STATE["joints"] = {"shoulder_l": 0.0, "shoulder_r": 0.0, "elbow_l": 0.0, "elbow_r": 0.0, "hip_l": 0.0, "hip_r": 0.0, "knee_l": 0.0, "knee_r": 0.0}
    _MCKIBBEN["pressures"] = [0.0, 0.0, 0.0, 0.0, 0.0]
    _LEKIWI["position"] = [0.0, 0.0, 0.0]
    _LEKIWI["path"] = []


def test_jarvis_status():
    reset()
    s = jarvis_status()
    assert s["name"] == "JARVIS"
    assert s["state"]["battery_pct"] > 0
    assert "battery_pct" in s["state"]


def test_jarvis_command_stand():
    reset()
    r = jarvis_command("stand", simulate=True)
    assert r["new_pose"] == "stand"
    assert r["simulated"] is True


def test_jarvis_command_walk():
    reset()
    r = jarvis_command("walk", {"distance": 2.5})
    assert "Walked 2.5m" in r["result"]
    assert _JARVIS_STATE["position"][0] == 2.5


def test_jarvis_command_move_arm():
    reset()
    r = jarvis_command("move_arm", {"joint": "shoulder_l", "angle": 45.0})
    assert "shoulder_l" in r["result"]
    assert _JARVIS_STATE["joints"]["shoulder_l"] == 45.0


def test_jarvis_command_grasp():
    reset()
    r = jarvis_command("grasp", {"object": "koi_fish"})
    assert "koi_fish" in r["result"]


def test_jarvis_command_speak():
    reset()
    r = jarvis_command("speak", {"text": "The dragon ships!"})
    assert "Speaking" in r["result"]


def test_jarvis_command_squat():
    reset()
    r = jarvis_command("squat")
    assert _JARVIS_STATE["pose"] == "squat"


def test_jarvis_command_unknown():
    reset()
    r = jarvis_command("fly_to_mars")
    assert "Unknown" in r["result"]


def test_jarvis_simulate_alias():
    reset()
    r = jarvis_simulate("stand")
    assert r["simulated"] is True


def test_mckibben_actuate_valid():
    reset()
    r = mckibben_actuate("left_arm_air", 100.0)
    assert r["pressure_kpa"] == 100.0
    assert _MCKIBBEN["pressures"][2] == 100.0


def test_mckibben_actuate_invalid_actuator():
    reset()
    r = mckibben_actuate("nonexistent", 50.0)
    assert "error" in r


def test_mckibben_actuate_invalid_pressure():
    reset()
    r = mckibben_actuate("left_arm_air", 300.0)
    assert "error" in r


def test_mckibben_actuate_invalid_duration():
    reset()
    r = mckibben_actuate("left_arm_air", 50.0, duration_s=120)
    assert "error" in r


def test_lekiwi_navigate():
    reset()
    r = lekiwi_navigate(10.0, 5.0)
    assert r["distance_m"] > 11
    assert _LEKIWI["position"][0] == 10.0


def test_lekiwi_invalid_speed():
    reset()
    r = lekiwi_navigate(5, 5, speed_mps=5.0)
    assert "error" in r


def test_no_external_deps():
    import meok_sovereign_physical_mcp as m
    src = open(m.__file__).read()
    assert "import ollama" not in src
    assert "import requests" not in src


def test_signed_outputs():
    reset()
    for r in [jarvis_status(), jarvis_command("stand"), mckibben_actuate("left_arm_air", 50), lekiwi_navigate(5, 5)]:
        assert "kid" in r and "sig" in r and "ts" in r


def test_full_lifecycle():
    """Status → walk → move arm → grasp → mckibben → lekiwi."""
    reset()
    s = jarvis_status()
    assert s["state"]["battery_pct"] > 0
    jarvis_command("stand")
    jarvis_command("walk", {"distance": 3.0})
    jarvis_command("move_arm", {"joint": "shoulder_r", "angle": 90})
    jarvis_command("grasp", {"object": "koi_fish"})
    jarvis_command("speak", {"text": "Hello Nick"})
    mckibben_actuate("left_arm_air", 80)
    mckibben_actuate("gripper_air", 50)
    lekiwi_navigate(5, 5)
    lekiwi_navigate(0, 0)
    assert _JARVIS_STATE["position"][0] == 3.0
    assert len(_JARVIS_LOG) == 5
    assert _MCKIBBEN["pressures"][2] == 80
