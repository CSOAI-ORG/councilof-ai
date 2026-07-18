"""meok-sovereign-wisdom-mcp — Sovereign Wisdom Economy + Leaderboard.

The wisdom economy: citizens earn wisdom points for sovereign actions.
Transfer, leaderboard, awards, gifting.

5 tools:
  1. wisdom_award    - award wisdom points to a citizen
  2. wisdom_transfer - transfer wisdom between citizens
  3. wisdom_leaderboard - get top 20 wisdom holders
  4. wisdom_balance  - get a citizen's wisdom balance
  5. wisdom_stats    - global wisdom stats
"""
from __future__ import annotations
import json
import hashlib
import random
from datetime import datetime, timezone

PROTOCOL = "sovereign-wisdom/1.0"
VERSION = "1.0.0"
LICENSE = "MIT + CC0 1.0"

# State
_BALANCES = {}
_TX_HISTORY = []
_AWARDS = []

# 5 award actions + point values
AWARD_ACTIONS = {
    "fork_doctrine": 100,
    "care_floor_validated": 50,
    "bft_council_ratified": 75,
    "sigil_emitted": 5,
    "hive_online": 25,
    "ml_model_trained": 200,
    "article50_passport_issued": 30,
    "knowledge_added_cc0": 10,
    "page_published": 20,
    "test_passed": 1,
}


def _sign(payload):
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "wisd-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()[:16]
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def wisdom_award(user_id: str, action: str, points: int = 0, reason: str = "") -> dict:
    """Award wisdom points to a citizen."""
    if not user_id:
        return _sign({"error": "user_id required"})
    if action not in AWARD_ACTIONS and points == 0:
        return _sign({"error": f"unknown action: {action}. Use one of {list(AWARD_ACTIONS.keys())} or specify points"})
    pts = points if points > 0 else AWARD_ACTIONS[action]
    _BALANCES.setdefault(user_id, 0)
    _BALANCES[user_id] += pts
    _AWARDS.append({"user_id": user_id, "action": action, "points": pts, "reason": reason, "ts": datetime.now(timezone.utc).isoformat()})
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "user_id": user_id, "action": action, "points": pts,
        "balance": _BALANCES[user_id],
        "reason": reason,
        "doctrine": f"Awarded {pts} wisdom points to {user_id} for {action}.",
    })


def wisdom_transfer(from_user: str, to_user: str, points: int, reason: str = "") -> dict:
    """Transfer wisdom between citizens."""
    if not from_user or not to_user or points <= 0:
        return _sign({"error": "from_user, to_user, points (>0) required"})
    if _BALANCES.get(from_user, 0) < points:
        return _sign({"error": f"insufficient balance: {from_user} has {_BALANCES.get(from_user, 0)}"})
    _BALANCES[from_user] -= points
    _BALANCES.setdefault(to_user, 0)
    _BALANCES[to_user] += points
    tx_id = f"tx-{hashlib.sha256(f'{from_user}{to_user}{datetime.now().isoformat()}'.encode()).hexdigest()[:12]}"
    _TX_HISTORY.append({"tx_id": tx_id, "from": from_user, "to": to_user, "points": points, "reason": reason, "ts": datetime.now(timezone.utc).isoformat()})
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "tx_id": tx_id, "from": from_user, "to": to_user, "points": points,
        "from_balance": _BALANCES[from_user],
        "to_balance": _BALANCES[to_user],
        "reason": reason,
        "doctrine": f"Sovereign wisdom transfer: {from_user} → {to_user} ({points} pts).",
    })


def wisdom_leaderboard(limit: int = 20) -> dict:
    """Get top 20 wisdom holders."""
    sorted_users = sorted(_BALANCES.items(), key=lambda x: -x[1])
    top = [{"rank": i + 1, "user_id": u, "balance": b} for i, (u, b) in enumerate(sorted_users[:limit])]
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "leaderboard": top,
        "total_users": len(_BALANCES),
        "doctrine": f"Sovereign wisdom leaderboard (top {limit}).",
    })


def wisdom_balance(user_id: str) -> dict:
    """Get a citizen's wisdom balance."""
    if not user_id:
        return _sign({"error": "user_id required"})
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "user_id": user_id,
        "balance": _BALANCES.get(user_id, 0),
        "transactions": [tx for tx in _TX_HISTORY if tx["from"] == user_id or tx["to"] == user_id],
        "awards": [a for a in _AWARDS if a["user_id"] == user_id],
        "doctrine": f"Sovereign wisdom balance for {user_id}.",
    })


def wisdom_stats() -> dict:
    """Global wisdom stats."""
    total_points = sum(_BALANCES.values())
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "total_users": len(_BALANCES),
        "total_points": total_points,
        "total_transfers": len(_TX_HISTORY),
        "total_awards": len(_AWARDS),
        "award_actions": AWARD_ACTIONS,
        "doctrine": f"Sovereign wisdom economy: {total_points} points across {len(_BALANCES)} citizens.",
    })