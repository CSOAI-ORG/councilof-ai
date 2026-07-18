#!/usr/bin/env python3
"""Tests for meek-wow-bot-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from meek_wow_bot_mcp.server import (
    healer_follower_start,
    healer_follower_stop,
    healer_follower_status,
    farmer_bot_start,
    farmer_bot_stop,
    farmer_bot_status,
    bot_anti_detection_check,
    bot_account_management,
)


def test_healer_follower_start():
    r = healer_follower_start()
    assert r["bot_status"] == "RUNNING"
    assert r["bot_type"] == "healer_follower"
    assert r["heal_threshold_pct"] == 80
    print(f"✅ test_healer_start: {r['character_class']} follows {r['follows_player']}")


def test_healer_follower_stop():
    r = healer_follower_stop()
    assert r["bot_status"] == "STOPPED"
    print(f"✅ test_healer_stop: status={r['bot_status']}")


def test_healer_follower_status():
    r = healer_follower_status(player_hp_pct=75.0)
    assert r["will_heal"] is True
    assert r["will_attack"] is False
    print(f"✅ test_healer_status: HP={r['player_hp_pct']}%, will_heal={r['will_heal']}")


def test_farmer_bot_start():
    r = farmer_bot_start(account_id=1, farm_type="mining")
    assert r["bot_status"] == "RUNNING"
    assert r["estimated_gold_per_hour"] == 150
    print(f"✅ test_farmer_start: account {r['account_id']}, {r['farm_type']}, {r['estimated_gold_per_hour']}g/hr")


def test_farmer_bot_stop():
    r = farmer_bot_stop(account_id=2)
    assert r["bot_status"] == "STOPPED"
    print(f"✅ test_farmer_stop: account {r['account_id']} stopped")


def test_farmer_bot_status():
    r = farmer_bot_status(account_id=1, hours_running=24.0)
    assert r["total_gold"] == 3600
    print(f"✅ test_farmer_status: {r['hours_running']}h = {r['total_gold']}g")


def test_bot_anti_detection_check():
    r = bot_anti_detection_check()
    assert r["verdict"] == "HUMAN_LIKE"
    assert r["human_like_score_pct"] > 95
    print(f"✅ test_anti_detection: {r['human_like_score_pct']}% human-like")


def test_bot_account_management():
    r = bot_account_management()
    assert "Nicholas_Main" in r["logged_in"]
    assert "Nicholas_Farmer" in r["logged_in"]
    print(f"✅ test_accounts: {r['logged_in']}")


if __name__ == "__main__":
    test_healer_follower_start()
    test_healer_follower_stop()
    test_healer_follower_status()
    test_farmer_bot_start()
    test_farmer_bot_stop()
    test_farmer_bot_status()
    test_bot_anti_detection_check()
    test_bot_account_management()
    print("\n🎉 ALL 8 TESTS PASSED — meek-wow-bot-mcp v1.0.0 is sovereign. The WoW bot ships.")