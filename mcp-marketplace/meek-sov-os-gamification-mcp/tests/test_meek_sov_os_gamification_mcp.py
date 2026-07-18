"""Tests for meek-sov-os-gamification-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from meek_sov_os_gamification_mcp.server import xp_award, xp_status, achievements_list, leaderboard_global, title_unlock, gamification_overview

def test_xp_award():
    r = xp_award()
    assert r["xp_awarded"] == 100
    assert r["level"] >= 1
    print(f"✅ test_xp_award: {r['xp_awarded']} XP, level {r['level']}, reason: {r['reason']}")

def test_xp_status():
    r = xp_status()
    assert r["level"] == 2
    assert r["xp_total"] == 1500
    print(f"✅ test_xp_status: level {r['level']}, {r['xp_total']} XP, title: {r['title']}")

def test_achievements_list():
    r = achievements_list()
    assert r["count"] == 8
    unlocked = sum(1 for a in r["achievements"] if a["status"] == "UNLOCKED")
    print(f"✅ test_achievements: {unlocked}/{r['count']} unlocked")

def test_leaderboard_global():
    r = leaderboard_global()
    assert len(r["leaderboard"]) == 3
    assert r["leaderboard"][0]["rank"] == 1
    print(f"✅ test_leaderboard: top 3 ranks ({r['total_twins']} total twins)")

def test_title_unlock():
    r = title_unlock(level=10)
    assert r["title"] == "Sovereign Expert"
    print(f"✅ test_title: level {r['level']} -> {r['title']}")

def test_gamification_overview():
    r = gamification_overview()
    assert r["max_level"] == 42
    assert r["total_achievements"] == 8
    print(f"✅ test_overview: max level {r['max_level']}, {r['total_achievements']} achievements")

if __name__ == "__main__":
    test_xp_award()
    test_xp_status()
    test_achievements_list()
    test_leaderboard_global()
    test_title_unlock()
    test_gamification_overview()
    print("\n🎉 ALL 6 TESTS PASSED — meek-sov-os-gamification-mcp v1.0.0 is sovereign. XP + achievements + leaderboard ready.")