#!/usr/bin/env python3
"""Tests for meek-digital-twin-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from meek_digital_twin_mcp.server import digital_twin_create, digital_twin_avatar, digital_twin_voice, digital_twin_personality, digital_twin_gamification

def test_digital_twin_create():
    r = digital_twin_create()
    assert r["user_name"] == "Nicholas"
    assert r["status"] == "CREATED"
    print(f"✅ test_create: twin_id={r['twin_id'][:25]}... for {r['user_name']}")

def test_digital_twin_avatar():
    r = digital_twin_avatar()
    assert "MetaHuman" in r["avatar_engine"]
    assert len(r["avatar_features"]) == 5
    print(f"✅ test_avatar: {r['avatar_engine']} with {len(r['avatar_features'])} features")

def test_digital_twin_voice():
    r = digital_twin_voice(language="en-GB")
    assert r["stt_engine"] == "Whisper (large-v3)"
    assert len(r["supported_languages"]) == 12
    print(f"✅ test_voice: {r['stt_engine']} + {len(r['supported_languages'])} languages")

def test_digital_twin_personality():
    r = digital_twin_personality()
    assert r["care_principles"]["safety"] == 0.97
    assert r["mindsets"] == 12
    print(f"✅ test_personality: 4 care principles + 12 mindsets + 33-hive BFT")

def test_digital_twin_gamification():
    r = digital_twin_gamification()
    assert r["xp_system"]["level"] == 1
    assert len(r["achievements"]) == 5
    print(f"✅ test_gamification: {len(r['achievements'])} achievements + leaderboard")

if __name__ == "__main__":
    test_digital_twin_create()
    test_digital_twin_avatar()
    test_digital_twin_voice()
    test_digital_twin_personality()
    test_digital_twin_gamification()
    print("\n🎉 ALL 5 TESTS PASSED — meek-digital-twin-mcp v1.0.0 is sovereign. The user is now an AI character.")