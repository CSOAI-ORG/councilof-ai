"""Tests for meok-sovereign-wisdom-mcp."""
import os, tempfile
_TEST = tempfile.mkdtemp(prefix="sov_wisd_")
os.environ["SOV_WISD_KEY"] = _TEST + "/k.pem"
from meok_sovereign_wisdom_mcp import (
    wisdom_award, wisdom_transfer, wisdom_leaderboard, wisdom_balance, wisdom_stats,
    _BALANCES, _TX_HISTORY, _AWARDS, AWARD_ACTIONS,
)


def reset():
    _BALANCES.clear()
    _TX_HISTORY.clear()
    _AWARDS.clear()


def test_10_award_actions():
    assert len(AWARD_ACTIONS) == 10


def test_award_basic():
    reset()
    r = wisdom_award("alice", "sigil_emitted")
    assert r["points"] == 5
    assert r["balance"] == 5


def test_award_unknown_with_points():
    reset()
    r = wisdom_award("alice", "custom_action", points=42)
    assert r["points"] == 42


def test_award_unknown_no_points():
    reset()
    r = wisdom_award("alice", "totally_fake_action")
    assert "error" in r


def test_award_empty_user():
    reset()
    r = wisdom_award("", "sigil_emitted")
    assert "error" in r


def test_award_multiple_users():
    reset()
    wisdom_award("alice", "sigil_emitted")
    wisdom_award("bob", "sigil_emitted")
    wisdom_award("alice", "page_published")
    assert _BALANCES["alice"] == 25
    assert _BALANCES["bob"] == 5


def test_transfer_basic():
    reset()
    wisdom_award("alice", "ml_model_trained")  # 200 pts
    r = wisdom_transfer("alice", "bob", 50, "thank you")
    assert r["from_balance"] == 150
    assert r["to_balance"] == 50


def test_transfer_insufficient():
    reset()
    wisdom_award("alice", "sigil_emitted")  # 5 pts
    r = wisdom_transfer("alice", "bob", 100)
    assert "error" in r


def test_transfer_invalid_args():
    reset()
    r = wisdom_transfer("", "bob", 50)
    assert "error" in r
    r = wisdom_transfer("alice", "", 50)
    assert "error" in r
    r = wisdom_transfer("alice", "bob", -10)
    assert "error" in r


def test_transfer_creates_tx():
    reset()
    wisdom_award("alice", "sigil_emitted")
    wisdom_transfer("alice", "bob", 5)
    assert len(_TX_HISTORY) == 1


def test_leaderboard_empty():
    reset()
    r = wisdom_leaderboard()
    assert r["total_users"] == 0


def test_leaderboard_with_users():
    reset()
    wisdom_award("alice", "ml_model_trained")
    wisdom_award("bob", "sigil_emitted")
    wisdom_award("carol", "page_published")
    r = wisdom_leaderboard()
    assert r["leaderboard"][0]["user_id"] == "alice"
    assert r["leaderboard"][0]["balance"] == 200
    assert r["leaderboard"][0]["rank"] == 1


def test_leaderboard_limit():
    reset()
    for i in range(30):
        wisdom_award(f"user{i}", "sigil_emitted")
    r = wisdom_leaderboard(limit=10)
    assert len(r["leaderboard"]) == 10


def test_balance_basic():
    reset()
    wisdom_award("alice", "sigil_emitted")
    r = wisdom_balance("alice")
    assert r["balance"] == 5


def test_balance_empty_user():
    reset()
    r = wisdom_balance("alice")
    assert r["balance"] == 0


def test_balance_empty_input():
    reset()
    r = wisdom_balance("")
    assert "error" in r


def test_balance_includes_history():
    reset()
    wisdom_award("alice", "sigil_emitted")
    wisdom_transfer("alice", "bob", 5)
    r = wisdom_balance("alice")
    assert len(r["transactions"]) == 1
    assert len(r["awards"]) == 1


def test_stats_empty():
    reset()
    r = wisdom_stats()
    assert r["total_users"] == 0
    assert r["total_points"] == 0


def test_stats_with_data():
    reset()
    wisdom_award("alice", "ml_model_trained")
    wisdom_award("bob", "page_published")
    r = wisdom_stats()
    assert r["total_users"] == 2
    assert r["total_points"] == 220


def test_no_external_deps():
    import meok_sovereign_wisdom_mcp as m
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src


def test_signed_outputs():
    reset()
    wisdom_award("alice", "sigil_emitted")
    for r in [wisdom_leaderboard(), wisdom_balance("alice"), wisdom_stats()]:
        assert "kid" in r and "sig" in r and "ts" in r


def test_award_action_points():
    """Each action has the canonical point value."""
    assert AWARD_ACTIONS["sigil_emitted"] == 5
    assert AWARD_ACTIONS["ml_model_trained"] == 200
    assert AWARD_ACTIONS["fork_doctrine"] == 100


def test_full_workflow():
    """Award → Award → Transfer → Balance → Leaderboard → Stats."""
    reset()
    a1 = wisdom_award("alice", "ml_model_trained", reason="trained sovereign model")
    assert a1["balance"] == 200
    a2 = wisdom_award("bob", "sigil_emitted")
    assert a2["balance"] == 5
    t = wisdom_transfer("alice", "bob", 50, "thanks for the sigil")
    assert t["from_balance"] == 150
    assert t["to_balance"] == 55
    b = wisdom_balance("alice")
    assert b["balance"] == 150
    lb = wisdom_leaderboard()
    assert lb["leaderboard"][0]["user_id"] == "alice"
    s = wisdom_stats()
    assert s["total_transfers"] == 1
    assert s["total_awards"] == 2
    assert s["total_points"] == 205
