"""Tests for meok-sovereign-vrm-mcp."""
import os, tempfile
_TEST_DIR = tempfile.mkdtemp(prefix="sov_vrm_test_")
os.environ["SOV_VRM_KEY"] = os.path.join(_TEST_DIR, "key.pem")
import meok_sovereign_vrm_mcp as m
from meok_sovereign_vrm_mcp import (
    spawn_avatar, speak, gesture, save_pose, render,
    GENERALS, _AVATARS,
)


def reset_state():
    _AVATARS.clear()


def test_12_generals():
    assert len(GENERALS) == 12


def test_general_dragon():
    dragon = GENERALS[-1]
    assert dragon["name"] == "Dragon"
    assert dragon["role"] == "sovereign"


def test_all_unique_voices():
    voices = {g["voice"] for g in GENERALS}
    assert len(voices) == 12


def test_spawn_avatar_valid():
    reset_state()
    r = spawn_avatar(12, position=[1.0, 2.0, 3.0])
    assert r["general"]["name"] == "Dragon"
    assert r["position"] == [1.0, 2.0, 3.0]


def test_spawn_avatar_invalid():
    r = spawn_avatar(0)
    assert "error" in r


def test_speak():
    reset_state()
    avatar = spawn_avatar(1)
    sid = avatar["spawn_id"]
    r = speak(sid, "Watch. Report. Protect.")
    assert r["general"] == "Argus"


def test_speak_invalid_spawn():
    r = speak("nonexistent", "Hello")
    assert "error" in r


def test_gesture_valid():
    reset_state()
    avatar = spawn_avatar(1)
    sid = avatar["spawn_id"]
    r = gesture(sid, "wave")
    assert r["gesture"] == "wave"


def test_gesture_invalid_type():
    reset_state()
    avatar = spawn_avatar(1)
    sid = avatar["spawn_id"]
    r = gesture(sid, "Backflip")
    assert "error" in r


def test_save_pose():
    reset_state()
    avatar = spawn_avatar(1)
    sid = avatar["spawn_id"]
    r = save_pose(sid)
    assert "pose_id" in r


def test_render():
    reset_state()
    avatar = spawn_avatar(1)
    sid = avatar["spawn_id"]
    r = render(sid)
    assert r["engine"] == "UE5.7"
    assert r["asset_loaded"] is True


def test_no_external_deps():
    src = open(m.__file__).read()
    assert "import ollama" not in src
    assert "import requests" not in src


def test_signed_outputs():
    reset_state()
    avatar = spawn_avatar(1)
    sid = avatar["spawn_id"]
    for r in [speak(sid, "Hi"), gesture(sid, "wave"), save_pose(sid), render(sid)]:
        assert "kid" in r and "sig" in r and "ts" in r


def test_full_lifecycle():
    reset_state()
    avatar = spawn_avatar(12, position=[5, 5, 0])
    sid = avatar["spawn_id"]
    assert speak(sid, "The dragon runs itself.")["duration_s"] > 0
    assert gesture(sid, "bow")["gesture"] == "bow"
    assert render(sid)["asset_loaded"] is True
