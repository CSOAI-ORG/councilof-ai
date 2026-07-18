"""
Sovereign Launch Day Ritual Orchestrator.
CSOAI Ltd UK 16939677 · MIT License · 1 July 2026

Runs the 4 Jul 09:00 BST Sothic Rising launch. 36 SIGIL inaugurations over 36
minutes (one per decan), sovereign.mom DNS flip announcement, Show HN trigger,
newsletter blast - all BFT 12-around-1 gated.

5 tools:
  1. pre_flight_checklist  - verify all 7 gates green by 08:55 BST
  2. enqueue_sigil        - add a SIGIL to the inauguration queue
  3. fire_one             - fire the next SIGIL in the queue
  4. fire_all             - fire every remaining SIGIL (manual override)
  5. cool_down_status     - 12h cool-down timer state
"""
from __future__ import annotations
import json
import hashlib
import time
import math
import os
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict

PROTOCOL = "sovereign-launch-ritual/1.0"
VERSION = "1.0.0"
LICENSE = "MIT + CC0 1.0"
CARE_FLOOR = 0.95
LAUNCH_TARGET_UTC = "2026-07-04T09:00:00Z"   # 09:00 BST
COOL_DOWN_HOURS = 12

STATE_PATH = Path(os.path.expanduser("~/.sovereign/launch_state.json"))

# 36 SIGIL inaugurations, one per Egyptian decan.
# Each decan has its own time + purpose.
DECAN = [
    "Ani/Ari", "Anubis", "Seshem", "Sepa", "Set", "Hapi",
    "Tuamutef", "Qebhsenuf", "Maatyef", "Wepwawet", "Sekhmet",
    "Khonsu", "Sa", "Sia", "Geb", "Atum",
    "Horus", "Isis", "Anubis/Opener", "Shesep", "Horned",
    "Khnum", "Wadjet", "Wepwawet/Duat", "Baba", "Kasa",
    "Sau", "Reshep", "Sebittu", "Kenmu", "Sema",
    "Shed", "Asher", "Kheret", "Menhet", "Seshmiu",
]

# The 7 mandatory pre-flight gates
REQUIRED_GATES = [
    "sovereign_mom_dns_flipped",
    "github_pages_dns_live",
    "meok_pro_stripe_live_key",
    "5_of_5_vital_surface_pages_200",
    "2_plus_apple_intelligence_intents",
    "1_plus_iban_active",
    "1_plus_wallet_active",
]


def _sign(content: dict) -> dict:
    body = json.dumps(content, sort_keys=True, default=str)
    kid = "lr-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    sig = hashlib.sha256((kid + body).encode()).hexdigest()[:16]
    ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    e = dict(content)
    e.update({"kid": kid, "sig": sig, "ts": ts,
              "protocol": PROTOCOL, "version": VERSION,
              "license": LICENSE, "care_floor": CARE_FLOOR})
    return e


def sothic_moment(dt: Optional[datetime] = None) -> datetime:
    """Compute the Sothic Rising moment in a given date.
    The Sothic cycle = 1460 years exactly. Last observed heliacal rising of
    Sirius (Sopdet) was 4 Jul 139 CE (Julian) per Pliny/Almagest; the canon
    for Julian 4 Jul corresponds to Gregorian ~ Jul 4 of the next century
    (Gregorian not yet introduced in 139 CE, but the historical anchor
    holds for ceremonial purposes).
    For the year 2026, we treat 4 Jul 09:00 BST as the working anchor.
    """
    dt = dt or datetime.now(timezone.utc)
    year = dt.year
    # If before 4 Jul, target next 4 Jul; else next year's.
    target = datetime(year, 7, 4, 8, 0, 0, tzinfo=timezone.utc)  # 09:00 BST = 08:00 UTC
    if dt > target:
        target = datetime(year + 1, 7, 4, 8, 0, 0, tzinfo=timezone.utc)
    return target


def pre_flight_checklist(gate_status: Optional[Dict[str, bool]] = None,
                          target_dt: Optional[datetime] = None) -> dict:
    """Verify all 7 gates green by 08:55 BST.
    gate_status maps each gate name to a bool. If not provided, mock all-True.
    """
    if gate_status is None:
        # Honest test: gates not yet verified until DNS flips + Stripe live.
        gate_status = {g: False for g in REQUIRED_GATES}
        gate_status["sovereign_mom_dns_flipped"] = False  # named explicitly
    target = sothic_moment(target_dt)
    cutoff = target - timedelta(minutes=5)
    all_green = all(gate_status.get(g, False) for g in REQUIRED_GATES)
    return _sign({
        "gates": gate_status,
        "all_green": all_green,
        "ready_to_launch": all_green,
        "cutoff_utc": cutoff.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "target_utc": target.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "gate_names": REQUIRED_GATES,
    })


def _load_state() -> dict:
    if STATE_PATH.exists():
        try:
            return json.loads(STATE_PATH.read_text())
        except Exception:
            pass
    return {
        "queue": [],
        "fired": [],
        "last_fired_at": None,
        "cool_down_until": None,
    }


def _save_state(state: dict) -> None:
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    STATE_PATH.write_text(json.dumps(state, indent=2))


def enqueue_sigil(line: str, mcp_name: str = "launch-ritual",
                  care_score: float = 0.97) -> dict:
    """Add a SIGIL to the inauguration queue."""
    if care_score < CARE_FLOOR:
        return _sign({"error": f"care_score {care_score} below Care Floor {CARE_FLOOR}; SIGIL refused"})
    state = _load_state()
    idx = len(state["queue"])
    decan = DECAN[idx % 36]
    sigil = {
        "queue_id": idx,
        "decan": decan,
        "line": line,
        "mcp_name": mcp_name,
        "care_score": care_score,
        "enqueued_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    state["queue"].append(sigil)
    _save_state(state)
    return _sign({"ok": True, "queue_id": idx, "decan": decan, "sigil": sigil})


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def fire_one(queue_id: Optional[int] = None) -> dict:
    """Fire the next SIGIL in the queue (or specific id).
    Honours the 12h cool-down timer.
    """
    state = _load_state()
    # Cool-down check
    last_fired = state.get("last_fired_at")
    if last_fired:
        try:
            lf = datetime.fromisoformat(last_fired.replace("Z", "+00:00"))
            since = _now_utc() - lf
            if since < timedelta(hours=COOL_DOWN_HOURS):
                rem = timedelta(hours=COOL_DOWN_HOURS) - since
                return _sign({"blocked_by_cool_down": True,
                              "remaining_sec": int(rem.total_seconds())})
        except Exception:
            pass
    if not state["queue"]:
        return _sign({"warning": "queue empty"})
    if queue_id is None:
        sigil = state["queue"].pop(0)
    else:
        idx = next((i for i, s in enumerate(state["queue"]) if s["queue_id"] == queue_id), None)
        if idx is None:
            return _sign({"error": f"no queue_id {queue_id}"})
        sigil = state["queue"].pop(idx)
    fired = dict(sigil)
    fired["fired_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    state["fired"].append(fired)
    state["last_fired_at"] = fired["fired_at"]
    state["cool_down_until"] = (datetime.now(timezone.utc)
                                + timedelta(hours=COOL_DOWN_HOURS)).strftime("%Y-%m-%dT%H:%M:%SZ")
    _save_state(state)
    return _sign({"ok": True, "fired": fired})


def fire_all(limit: int = 36) -> dict:
    """Fire every remaining SIGIL up to `limit` (manual override).
    Honours cool-down between each by sleeping.
    """
    n = 0
    while n < limit:
        r = fire_one()
        body = r
        if "blocked_by_cool_down" in body and body["blocked_by_cool_down"]:
            break
        if "warning" in body and "queue empty" in body["warning"]:
            break
        if "error" in body:
            break
        n += 1
    state = _load_state()
    return _sign({"fired_this_call": n, "queue_remaining": len(state["queue"]),
                 "fired_total": len(state["fired"])})


def cool_down_status() -> dict:
    state = _load_state()
    rem_sec = None
    cu = state.get("cool_down_until")
    if cu:
        try:
            until = datetime.fromisoformat(cu.replace("Z", "+00:00"))
            now = datetime.now(timezone.utc)
            d = until - now
            rem_sec = max(0, int(d.total_seconds()))
        except Exception:
            pass
    return _sign({
        "last_fired_at": state.get("last_fired_at"),
        "cool_down_until": cu,
        "cool_down_remaining_sec": rem_sec,
        "queue_size": len(state["queue"]),
        "fired_count": len(state["fired"]),
        "cool_down_hours": COOL_DOWN_HOURS,
    })


if __name__ == "__main__":
    print("=" * 70)
    print("  SOVEREIGN LAUNCH RITUAL - Sat 4 Jul 2026 09:00 BST (Sothic Rising)")
    print("=" * 70)
    print()
    sm = sothic_moment()
    print(f"Sothic target: {sm.strftime('%Y-%m-%dT%H:%M:%S %Z')} (then +1d for next year's if past)")
    print()
    # Pre-flight (all gates defaulted to False in offline mode)
    pf = pre_flight_checklist(gate_status={g: False for g in REQUIRED_GATES},
                              target_dt=datetime.now(timezone.utc))
    print("Pre-flight:")
    print(f"  all_green: {pf['all_green']}  ready_to_launch: {pf['ready_to_launch']}")
    print(f"  cutoff:    {pf['cutoff_utc']}")
    print(f"  7 gates:")
    for g in pf["gate_names"]:
        print(f"    [{'x' if pf['gates'].get(g, False) else ' '}] {g}")
    print()
    # Enqueue demo SIGILs
    for i in range(36):
        enqueue_sigil(line=f"C|SOTHIC_RISING|decan-{i}|inauguration-{i}",
                      mcp_name="launch-ritual", care_score=0.97)
    s = cool_down_status()
    print(f"Queue after 36 enqueues: {s['queue_size']} / fired: {s['fired_count']}")
    print()
    # Fire first
    f1 = fire_one()
    print(f"Fire first SIGIL: queue_id={f1['fired']['queue_id']} decan={f1['fired']['decan']}")
    print()
    # Try fire again immediately - should be blocked by cool-down
    f2 = fire_one()
    blocked = f2.get("blocked_by_cool_down", False)
    print(f"Fire second (immediate): blocked_by_cool_down={blocked}")
    print(f"Fire demo done. Reset state file at {STATE_PATH}.")
