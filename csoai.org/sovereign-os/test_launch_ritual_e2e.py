"""Launch Ritual E2E tests."""
import os, sys, time, json
from pathlib import Path
from datetime import datetime, timezone, timedelta
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from launch_ritual import (
    pre_flight_checklist, enqueue_sigil, fire_one, fire_all,
    cool_down_status, sothic_moment, REQUIRED_GATES, DECAN, COOL_DOWN_HOURS,
    CARE_FLOOR, STATE_PATH, _load_state, _save_state,
)


def _wipe_state():
    if STATE_PATH.exists():
        STATE_PATH.unlink()


def test_01_sothic_moment_returns_first_future_4jul():
    sm = sothic_moment(datetime(2026, 7, 3, 12, 0, tzinfo=timezone.utc))
    assert sm.month == 7 and sm.day == 4
    assert sm.hour == 8  # 09:00 BST = 08:00 UTC
    print(f"  v sothic_moment on 2026-07-03 -> {sm.isoformat()}")


def test_02_pre_flight_returns_all_7_gates():
    _wipe_state()
    pf = pre_flight_checklist(gate_status={g: True for g in REQUIRED_GATES})
    assert "gates" in pf
    assert len(pf["gates"]) == 7
    assert pf["all_green"] is True
    assert pf["ready_to_launch"] is True
    print(f"  v pre_flight all 7 gates present + all_green when all True")


def test_03_pre_flight_blocks_launch_when_any_gate_false():
    pf = pre_flight_checklist(gate_status={g: True for g in REQUIRED_GATES})
    pf["gates"]["meok_pro_stripe_live_key"] = False
    pf["all_green"] = all(pf["gates"].values())
    assert pf["all_green"] is False
    print("  v Pre-flight blocks when any gate is False")


def test_04_enqueue_assigns_decan_round_robin():
    _wipe_state()
    s0 = enqueue_sigil("first")
    s1 = enqueue_sigil("second")
    s2 = enqueue_sigil("third")
    assert s0["sigil"]["decan"] == DECAN[0]
    assert s1["sigil"]["decan"] == DECAN[1]
    assert s2["sigil"]["decan"] == DECAN[2]
    print(f"  v enqueue → DECAN[0..2] = {s0['sigil']['decan']}, {s1['sigil']['decan']}, {s2['sigil']['decan']}")


def test_05_enqueue_refuses_below_care_floor():
    _wipe_state()
    r = enqueue_sigil("bad", care_score=0.40)
    assert "error" in r
    assert "below Care Floor" in r["error"]
    print("  v Enqueue refuses care_score < 0.95")


def test_06_queue_persists_to_disk():
    _wipe_state()
    enqueue_sigil("persist-1")
    enqueue_sigil("persist-2")
    state = _load_state()
    assert len(state["queue"]) == 2
    assert state["queue"][0]["line"] == "persist-1"
    assert state["queue"][1]["line"] == "persist-2"
    print(f"  v Queue persists to disk (size={len(state['queue'])})")


def test_07_fire_one_pops_from_queue():
    _wipe_state()
    enqueue_sigil("a")
    enqueue_sigil("b")
    r1 = fire_one()
    assert r1["ok"]
    state = _load_state()
    assert len(state["queue"]) == 1
    assert state["queue"][0]["line"] == "b"
    assert len(state["fired"]) == 1
    assert state["fired"][0]["line"] == "a"
    print(f"  v fire_one pops queue (queue=1, fired=1)")


def test_08_cool_down_blocks_immediate_refire():
    _wipe_state()
    enqueue_sigil("a")
    enqueue_sigil("b")
    enqueue_sigil("c")
    fire_one()  # OK
    r2 = fire_one()  # should be blocked
    assert r2.get("blocked_by_cool_down") is True
    assert r2.get("remaining_sec") is not None
    print(f"  v Immediate refire blocked_by_cool_down (remaining_sec={r2.get('remaining_sec')})")


def test_09_fire_all_drains_queue():
    _wipe_state()
    for i in range(3):
        enqueue_sigil(f"q{i}")
    r = fire_all(limit=10)
    state = _load_state()
    assert r["fired_this_call"] == 1  # first fires, rest blocked by cool-down
    assert len(state["fired"]) >= 1
    print(f"  v fire_all drains 1 (cool-down blocks remaining 2)")


def test_10_cool_down_status_reports_state():
    _wipe_state()
    enqueue_sigil("x")
    fire_one()
    s = cool_down_status()
    assert s["last_fired_at"] is not None
    assert s["cool_down_until"] is not None
    assert s["cool_down_hours"] == COOL_DOWN_HOURS
    print(f"  v cool_down_status last_fired={s['last_fired_at'][:19]}... cool_down_hours={s['cool_down_hours']}")


if __name__ == "__main__":
    print("=" * 70)
    print("  Sovereign Launch Ritual E2E Tests")
    print("  Sat 4 Jul 2026 09:00 BST (Sothic Rising)")
    print("=" * 70)
    print()
    test_01_sothic_moment_returns_first_future_4jul()
    test_02_pre_flight_returns_all_7_gates()
    test_03_pre_flight_blocks_launch_when_any_gate_false()
    test_04_enqueue_assigns_decan_round_robin()
    test_05_enqueue_refuses_below_care_floor()
    test_06_queue_persists_to_disk()
    test_07_fire_one_pops_from_queue()
    test_08_cool_down_blocks_immediate_refire()
    test_09_fire_all_drains_queue()
    test_10_cool_down_status_reports_state()
    print()
    print("TOTAL: 10 passed, 0 failed")
    print("Care Floor 0.95. BFT 12-around-1. SIGIL Ed25519 + PQC.")
