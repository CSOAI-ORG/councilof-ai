"""Tests for meok-sovereign-avatar-mcp."""
import os, tempfile

_TEST_DIR = tempfile.mkdtemp(prefix="sov_avatar_test_")
os.environ["SOV_AVATAR_KEY"] = os.path.join(_TEST_DIR, "key.pem")

from meok_sovereign_avatar_mcp import (
    sov_avatar_say, sov_avatar_listen, sov_avatar_gaze,
    sov_avatar_state, sov_avatar_mood, _AVATAR_STATE,
    VERSION, PROTOCOL,
)


def test_say_basic():
    r = sov_avatar_say("Welcome to the sovereign substrate.")
    assert r["protocol"] == PROTOCOL
    assert r["text"] == "Welcome to the sovereign substrate."
    assert r["lip_sync"] is True
    assert r["tts"] == "kokoro"
    assert r["duration_estimate_sec"] > 0
    assert "kid" in r and "sig" in r


def test_say_with_mood():
    r = sov_avatar_say("Compliance check complete.", mood="happy")
    assert r["mood"] == "happy"
    # Verify state updated
    assert _AVATAR_STATE["is_speaking"] is True
    assert _AVATAR_STATE["mood"] == "happy"


def test_listen():
    # Create a fake audio file
    import tempfile
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        f.write(b"RIFF" + b"\x00" * 100)  # fake WAV header
        audio_path = f.name
    r = sov_avatar_listen(audio_path)
    assert r["stt_model"] == "whisper-base-en"
    assert r["engine"] == "whisper.cpp"
    assert "kid" in r


def test_listen_missing_file():
    r = sov_avatar_listen("/nonexistent/path.wav")
    assert "error" in r


def test_gaze():
    r = sov_avatar_gaze(0.5, -0.3)
    assert r["gaze_target"] == {"x": 0.5, "y": -0.3}


def test_gaze_invalid_coords():
    r = sov_avatar_gaze(5.0, 0)
    assert "error" in r


def test_state():
    sov_avatar_say("test", mood="speaking")
    r = sov_avatar_state()
    assert r["avatar"]["is_speaking"] is True
    assert r["avatar"]["mood"] == "speaking"


def test_mood_change():
    sov_avatar_mood("idle")
    r = sov_avatar_mood("alert")
    assert r["old_mood"] == "idle"
    assert r["new_mood"] == "alert"


def test_mood_invalid():
    r = sov_avatar_mood("hyperactive")
    assert "error" in r


def test_all_signed():
    r = sov_avatar_say("signed test")
    assert "kid" in r and "sig" in r
    assert r["verify_url"]
