"""Sovereign observability E2E tests."""
import sys
import os
import time
import json
from collections import deque
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from observability_dashboard import (
    obs_observe, obs_summary, obs_health, obs_quantile, obs_feed,
    _state, CARE_FLOOR,
)


def _reset():
    import observability_dashboard as mod
    for k in list(mod._state.keys()):
        if isinstance(mod._state[k], deque):
            mod._state[k].clear()
        elif isinstance(mod._state[k], dict):
            mod._state[k].clear()
        else:
            mod._state[k] = 0
    mod._state["start_time"] = time.time()


def test_01_observe_records_metric():
    _reset()
    r = obs_observe("care_floor", 0.96)
    assert r["ok"]
    assert len(_state["care_history"]) == 1
    print("  v obs_observe records care_floor (1 entry in deque)")


def test_02_care_floor_witness_count():
    _reset()
    for v in [0.95, 0.96, 0.94, 0.97]:  # 3 above floor
        obs_observe("care_floor", v)
    assert _state["care_floor_witness_cum"] == 3
    print(f"  v care_floor_witness_cum = 3 (samples >= 0.95 only)")


def test_03_bft_pass_rate():
    _reset()
    for _ in range(9):
        obs_observe("bft_pass")
    for _ in range(1):
        obs_observe("bft_fail")
    s = obs_summary()
    assert abs(s["bft_pass_rate"] - 0.9) < 0.01, s["bft_pass_rate"]
    assert s["bft_passes_60s"] == 9
    assert s["bft_fails_60s"] == 1
    print(f"  v BFT pass rate = {s['bft_pass_rate']:.3f} (9/10)")


def test_04_sigil_chain_rate():
    _reset()
    for _ in range(10):
        obs_observe("sigil", 1.0, ts=time.time() - 30)  # last 30s
    s = obs_summary()
    assert s["sigil_chain_rate_per_min"] > 0
    print(f"  v Sigil rate = {s['sigil_chain_rate_per_min']:.2f}/min")


def test_05_qps_per_endpoint():
    _reset()
    now = time.time()
    for _ in range(5):
        obs_observe("call", endpoint="/api/watchdog/report", ts=now - 5)
    s = obs_summary()
    assert "/api/watchdog/report" in s["qps_per_endpoint_per_min"]
    print(f"  v QPS /api/watchdog/report = {s['qps_per_endpoint_per_min']['/api/watchdog/report']:.2f}/min")


def test_06_latency_percentiles():
    _reset()
    for ms in range(10, 110):  # 100 samples, 10..109
        obs_observe("latency_ms", float(ms), ts=time.time())
    q = obs_quantile()
    # p50 = median of [10..109] = (10+109)/2 = 59.5
    # p95 = 95th percentile of 100 samples = 9.5 in from top = 105
    # p99 = 99th percentile = 108.01
    assert 55 <= q["p50_ms"] <= 65, f"p50 expected near 59.5, got {q['p50_ms']}"
    assert 95 <= q["p95_ms"] <= 110, f"p95 expected near 105, got {q['p95_ms']}"
    assert 100 <= q["p99_ms"] <= 110, f"p99 expected near 108, got {q['p99_ms']}"
    assert q["count"] == 100
    print(f"  v Latency p50={q['p50_ms']:.1f} p95={q['p95_ms']:.1f} p99={q['p99_ms']:.1f}")


def test_07_error_rate_counted():
    import observability_dashboard as mod
    _reset()
    for _ in range(3):
        obs_observe("error", 1.0)
    s = obs_summary()
    assert s["error_rate_60s"] == 3
    print(f"  v error_rate_60s = {s['error_rate_60s']}")


def test_08_reports_submitted_cumulative():
    _reset()
    for _ in range(5):
        obs_observe("watchdog_report")
    assert _state["reports_submitted_cum"] == 5
    print("  v reports_submitted_cum = 5")


def test_09_health_status_logic():
    _reset()
    obs_observe("care_floor", 0.96)
    obs_observe("bft_pass")
    obs_observe("bft_pass")
    h = obs_health()
    assert h["status"] in ("GREEN", "YELLOW", "RED")
    assert h["care_floor_value"] > 0
    print(f"  v Health = {h['status']} (care={h['care_floor_value']}, bft_pass={h['bft_pass_rate']})")


def test_10_license_open():
    h = obs_health()
    assert "MIT" in h["license"] and "CC0" in h["license"]
    print(f"  v License {h['license']}")


if __name__ == "__main__":
    print("=" * 70)
    print("  Sovereign Observability E2E Tests")
    print("=" * 70)
    print()
    test_01_observe_records_metric()
    test_02_care_floor_witness_count()
    test_03_bft_pass_rate()
    test_04_sigil_chain_rate()
    test_05_qps_per_endpoint()
    test_06_latency_percentiles()
    test_07_error_rate_counted()
    test_08_reports_submitted_cumulative()
    test_09_health_status_logic()
    test_10_license_open()
    print()
    print("TOTAL: 10 passed, 0 failed")
    print("Care Floor 0.95. BFT 12-around-1. SIGIL Ed25519 + PQC.")
