"""
Sovereign Observability Dashboard — Prometheus-style metrics
CSOAI Ltd · UK 16939677 · MIT License · 1 July 2026

Real metrics from the sovereign substrate. Honest Prometheus-style:
  - care_floor_value (latest care score, last 60s rolling window)
  - bft_pass_rate (last 60s ratio of passes)
  - sigil_chain_rate (SIGILs / minute, last 60s)
  - qps_per_endpoint (calls/minute per Mcp endpoint, last 60s)
  - latency_p50_p95_p99 (last 1000 calls)
  - error_rate (last 60s)
  - care_floor_witness_count (cumulative)
  - reports_submitted (Watchdog reports cumulative)

5 MCP-style tools:
  1. obs_observe - record a single metric point (time series)
  2. obs_quantile - get p50/p95/p99 for latency
  3. obs_summary - get all metrics as Prometheus-style text
  4. obs_health - get the current health snapshot
  5. obs_feed - get the last N raw events (live feed)
"""
from __future__ import annotations
import json
import time
import bisect
import hashlib
import math
import hmac
from collections import deque
from pathlib import Path
from typing import Optional, List, Dict, Deque

PROTOCOL = "sovereign-obs/1.0"
VERSION = "1.0.0"
LICENSE = "MIT + CC0 1.0"
CARE_FLOOR = 0.95

# Rolling time windows
WINDOW_60S = 60
WINDOW_1K = 1000

# Internal state (in-memory, persistent on save)
_state = {
    "care_history": deque(maxlen=WINDOW_60S * 4),       # 1 sample/sec rolling 60s
    "bft_pass_history": deque(maxlen=WINDOW_60S * 4),
    "bft_fail_history": deque(maxlen=WINDOW_60S * 4),
    "sigil_history": deque(maxlen=WINDOW_60S * 4),
    "calls_by_endpoint": {},  # endpoint -> deque(timestamps)
    "latencies": deque(maxlen=WINDOW_1K),
    "error_history": deque(maxlen=WINDOW_60S * 4),
    "care_floor_witness_cum": 0,
    "reports_submitted_cum": 0,
    "start_time": time.time(),
}


def _now() -> float:
    return time.time()


def _sign(payload: dict) -> dict:
    body = json.dumps(payload, sort_keys=True, default=str)
    kid = "obs-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    sig = hashlib.sha256((kid + body).encode()).hexdigest()[:16]
    ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    # Build envelope WITHOUT overwriting payload fields
    envelope = dict(payload)  # preserve all user-supplied keys
    envelope["kid"] = kid
    envelope["sig"] = sig
    envelope["ts"] = ts
    envelope["protocol"] = PROTOCOL
    envelope["version"] = VERSION
    envelope["license"] = LICENSE
    envelope["care_floor"] = CARE_FLOOR
    return envelope


def _prune(buf: Deque, window_sec: int = WINDOW_60S) -> None:
    cutoff = _now() - window_sec
    while buf and buf[0][0] < cutoff:
        buf.popleft()


def _percentile(values: List[float], p: float) -> float:
    if not values:
        return 0.0
    values = sorted(values)
    k = (len(values) - 1) * p / 100
    f = math.floor(k)
    c = math.ceil(k)
    if f == c:
        return values[int(k)]
    return values[f] * (c - k) + values[c] * (k - f)


def _last_60s(buf: Deque) -> int:
    _prune(buf)
    return sum(1 for ts, *_ in buf if ts > _now() - WINDOW_60S)


def _last_60s_rate(buf: Deque) -> float:
    """Returns value/min for a 60s window."""
    n = _last_60s(buf)
    return n * (60.0 / WINDOW_60S)


def obs_observe(metric: str, value: float = 1.0,
                endpoint: Optional[str] = None,
                ts: Optional[float] = None) -> dict:
    """Record a single observation."""
    t = ts or _now()
    if metric == "care_floor":
        _state["care_history"].append((t, value))
        if value >= CARE_FLOOR:
            _state["care_floor_witness_cum"] += 1
    elif metric == "bft_pass":
        _state["bft_pass_history"].append((t, value))
    elif metric == "bft_fail":
        _state["bft_fail_history"].append((t, value))
    elif metric == "sigil":
        _state["sigil_history"].append((t, value))
    elif metric == "call":
        if endpoint:
            _state["calls_by_endpoint"].setdefault(endpoint, deque(maxlen=10_000)).append(t)
    elif metric == "latency_ms":
        _state["latencies"].append((t, value))
    elif metric == "error":
        _state["error_history"].append((t, value))
    elif metric == "watchdog_report":
        _state["reports_submitted_cum"] += 1
    else:
        return _sign({"error": f"unknown metric: {metric}"})
    return _sign({"ok": True, "metric": metric, "value": value,
                 "endpoint": endpoint, "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())})


def _qps_per_endpoint(window_sec: int = WINDOW_60S) -> Dict[str, float]:
    now = _now()
    out = {}
    for ep, buf in _state["calls_by_endpoint"].items():
        n = sum(1 for ts in buf if ts > now - window_sec)
        out[ep] = round(n * (60.0 / window_sec), 3)
    return out


def obs_quantile(window_sec: int = WINDOW_60S) -> dict:
    """Get p50/p95/p99 latency for the last window."""
    cutoff = _now() - window_sec
    lat = [v for t, v in _state["latencies"] if t > cutoff]
    return _sign({
        "window_sec": window_sec,
        "count": len(lat),
        "p50_ms": round(_percentile(lat, 50), 3),
        "p95_ms": round(_percentile(lat, 95), 3),
        "p99_ms": round(_percentile(lat, 99), 3),
    })


def obs_summary(window_sec: int = WINDOW_60S) -> dict:
    """Prometheus-style summary of all metrics."""
    cf = [v for t, v in _state["care_history"] if t > _now() - window_sec]
    bp = _last_60s(_state["bft_pass_history"])
    bf = _last_60s(_state["bft_fail_history"])
    return _sign({
        "window_sec": window_sec,
        "care_floor_value": round(_percentile(cf, 50), 3) if cf else 0,
        "care_floor_min": min(cf) if cf else 0,
        "care_floor_max": max(cf) if cf else 0,
        "care_floor_witness_cum": _state["care_floor_witness_cum"],
        "bft_pass_rate": round(bp / max(1, bp + bf), 4),
        "bft_passes_60s": bp,
        "bft_fails_60s": bf,
        "sigil_chain_rate_per_min": round(_last_60s_rate(_state["sigil_history"]), 3),
        "qps_per_endpoint_per_min": _qps_per_endpoint(window_sec),
        "latency": obs_quantile(window_sec),
        "error_rate_60s": _last_60s(_state["error_history"]),
        "reports_submitted_cum": _state["reports_submitted_cum"],
        "uptime_sec": round(_now() - _state["start_time"], 3),
    })


def obs_health() -> dict:
    """Current health snapshot."""
    s = obs_summary()
    sub_observe = s.get("care_floor_value", 0)
    bft_pass = s.get("bft_pass_rate", 0)
    sigil_rate = s.get("sigil_chain_rate_per_min", 0)
    err = s.get("error_rate_60s", 0)
    p99 = (s.get("latency") or {}).get("p99_ms", 0)
    status = (
        "GREEN" if (sub_observe >= CARE_FLOOR and bft_pass >= 0.95
                    and err == 0) else
        "YELLOW" if (sub_observe >= CARE_FLOOR and bft_pass >= 0.5) else
        "RED"
    )
    return _sign({
        "status": status,
        "care_floor_value": sub_observe,
        "bft_pass_rate": bft_pass,
        "sigil_chain_rate_per_min": sigil_rate,
        "error_rate_60s": err,
        "latency_p99_ms": p99,
    })


def obs_feed(n: int = 50) -> dict:
    """Live feed of the last N raw events from all 3 ring buffers."""
    events = []
    now = _now()
    for t, v in list(_state["care_history"])[-n:]:
        events.append({"ts": time.strftime("%Y-%m-%dT%H:%M:%S", time.localtime(t)),
                       "metric": "care_floor", "value": v})
    for t, v in list(_state["sigil_history"])[-n:]:
        events.append({"ts": time.strftime("%Y-%m-%dT%H:%M:%S", time.localtime(t)),
                       "metric": "sigil", "value": v})
    for t, v in list(_state["bft_pass_history"])[-n:]:
        events.append({"ts": time.strftime("%Y-%m-%dT%H:%M:%S", time.localtime(t)),
                       "metric": "bft_pass"})
    for t, v in list(_state["bft_fail_history"])[-n:]:
        events.append({"ts": time.strftime("%Y-%m-%dT%H:%M:%S", time.localtime(t)),
                       "metric": "bft_fail"})
    for t, v in list(_state["latencies"])[-n:]:
        events.append({"ts": time.strftime("%Y-%m-%dT%H:%M:%S", time.localtime(t)),
                       "metric": "latency_ms", "value": v})
    events.sort(key=lambda e: e["ts"], reverse=True)
    return _sign({"events": events[:n], "count": len(events)})


if __name__ == "__main__":
    print("=" * 70)
    print("  SOVEREIGN OBSERVABILITY DASHBOARD — Prometheus-style")
    print("=" * 70)
    print()
    # Inject some honest artificial data
    import random
    random.seed(42)
    for i in range(60):
        cf = 0.95 + random.uniform(-0.005, 0.005)
        obs_observe("care_floor", cf)
        if i % 3 == 0:
            obs_observe("bft_pass")
        if i % 7 == 0 and random.random() > 0.7:
            obs_observe("bft_fail")
        obs_observe("sigil", 1.0)
        obs_observe("call", endpoint="/api/watchdog/report", ts=_now() - 60 + i)
        obs_observe("call", endpoint="/api/sovereign/sigil", ts=_now() - 60 + i)
        obs_observe("latency_ms", random.uniform(10, 80))
        if i % 11 == 0:
            obs_observe("error", 1.0)
        if i % 13 == 0:
            obs_observe("watchdog_report")
    print("=== HEALTH ===")
    print(json.dumps(obs_health(), indent=2))
    print()
    print("=== SUMMARY ===")
    print(json.dumps(obs_summary(), indent=2))
    print()
    print("=== LATENCY ===")
    print(json.dumps(obs_quantile(), indent=2))
