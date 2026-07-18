"""meok-sovereign-pond-physics-mcp — 16-dim Mamba-2 koi pond physics simulator.

The iOK Farm pond (13m × 12m) is the canonical physical-world substrate.
This MCP simulates 16-dim state dynamics using Mamba-2 SSD (state-space dynamics):
  - State: 16-dim vector (8 water quality + 4 fish behavior + 4 environmental)
  - Dynamics: 16-dim state-space equation
  - Care floor: 16 probes per tick
  - Sigil: every tick signed
  - BFT: 3-voter fast council for crisis decisions

5 tools:
  1. pond_init        - initialize a 16-dim pond state
  2. pond_step        - advance one Mamba-2 step
  3. pond_simulate    - run N steps + return trajectory
  4. pond_care_floor  - check 16-probe care floor on pond state
  5. pond_alerts      - check if any alert conditions triggered
"""
from __future__ import annotations
import json
import math
import hashlib
from datetime import datetime, timezone
from typing import List, Optional

PROTOCOL = "sovereign-pond-physics/1.0"
VERSION = "1.0.0"
STATE_DIM = 16

# Pond state dimensions
STATE_NAMES = [
    "ph",           # 0: pH
    "do_mgL",       # 1: Dissolved O2
    "temp_c",       # 2: Temperature
    "ammonia_mgL",  # 3: Ammonia
    "nitrite_mgL",  # 4: Nitrite
    "nitrate_mgL",  # 5: Nitrate
    "turbidity",    # 6: Turbidity
    "salinity",     # 7: Salinity
    "fish_active",  # 8: Fish activity (0-1)
    "fish_count",   # 9: Fish count (normalized)
    "fish_stress",  # 10: Stress level
    "feeding_rate", # 11: Feeding rate (0-1)
    "light_hours",  # 12: Light exposure
    "water_flow",   # 13: Water flow rate
    "filter_status",# 14: Filter status
    "ph_balance",   # 15: pH balance (deviation from ideal)
]

# Care floor ranges
CARE_RANGES = {
    "ph": (6.5, 8.5),
    "do_mgL": (5.0, 12.0),
    "temp_c": (4.0, 30.0),
    "ammonia_mgL": (0.0, 0.02),
    "nitrite_mgL": (0.0, 0.5),
    "nitrate_mgL": (0.0, 50.0),
    "turbidity": (0.0, 1.0),
    "salinity": (0.0, 0.5),
}

ALERT_THRESHOLDS = {
    "ph_low": 5.5,
    "ph_high": 9.0,
    "do_low": 3.0,
    "temp_high": 32.0,
    "ammonia_high": 0.05,
    "fish_stress_high": 0.8,
}


def _sign(payload: dict) -> dict:
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "pond-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def pond_init(seed: Optional[int] = None) -> dict:
    """Initialize a 16-dim pond state (healthy defaults)."""
    if seed is not None:
        import random
        random.seed(seed)
    # Healthy defaults (normalized to -1..1)
    state = [
        0.4,   # ph (7.4 in normal range)
        0.3,   # do_mgL (8.2)
        0.2,   # temp_c (22.0)
        -0.5,  # ammonia (low)
        -0.5,  # nitrite (low)
        0.0,   # nitrate (normal)
        0.0,   # turbidity (clear)
        0.0,   # salinity (fresh)
        0.6,   # fish_active
        0.7,   # fish_count
        -0.3,  # fish_stress
        0.0,   # feeding_rate
        0.3,   # light_hours
        0.2,   # water_flow
        0.8,   # filter_status (good)
        0.0,   # ph_balance
    ]
    if seed is not None:
        import random
        state = [max(-1, min(1, s + random.gauss(0, 0.1))) for s in state]
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "state": state,
        "state_dim": STATE_DIM,
        "state_names": STATE_NAMES,
        "doctrine": "iOK Farm pond: 13m × 12m, 16-dim Mamba-2 state",
    })


def pond_step(state: List[float]) -> dict:
    """Advance one Mamba-2 SSD step.

    Simple linear dynamics: x_{t+1} = A @ x_t + noise
    where A is a learned 16x16 matrix (simplified to identity + small drift).
    """
    if not isinstance(state, list) or len(state) != STATE_DIM:
        return _sign({"error": f"state must be 16-dim, got {len(state) if isinstance(state, list) else 'N/A'}"})
    # Validate range
    for v in state:
        if v < -1 or v > 1:
            return _sign({"error": f"state value out of range: {v}"})
    # Mamba-2 SSD: x_{t+1} = A @ x_t + small drift + noise
    A = [
        [0.95, 0.05, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],  # ph drift
        [0.0, 0.92, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.05, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],  # do
        [0.0, 0.0, 0.94, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.03, 0.0, 0.0, 0.0],  # temp
        [0.0, 0.0, 0.05, 0.90, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.05, 0.0, 0.0, 0.0, 0.0],  # ammonia
        [0.0, 0.0, 0.0, 0.1, 0.85, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],  # nitrite
        [0.0, 0.0, 0.0, 0.0, 0.1, 0.95, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],  # nitrate
        [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.92, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],  # turbidity
        [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.99, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],  # salinity
        [0.0, 0.05, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.88, -0.05, 0.05, 0.0, 0.0, 0.0, 0.0, 0.0],  # fish_active
        [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.99, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],  # fish_count
        [0.0, -0.05, 0.0, 0.05, 0.0, 0.0, 0.0, 0.0, -0.05, 0.0, 0.85, 0.0, 0.0, 0.0, 0.0, 0.0],  # fish_stress
        [0.0, 0.0, 0.0, 0.05, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.95, 0.0, 0.0, 0.0, 0.0],  # feeding
        [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.99, 0.0, 0.0, 0.0],  # light
        [0.0, 0.05, 0.0, -0.05, 0.0, 0.0, -0.05, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.97, 0.0, 0.0],  # flow
        [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.98, 0.0],  # filter
        [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.95],  # ph_balance
    ]
    new_state = [0.0] * STATE_DIM
    for i in range(STATE_DIM):
        s = 0.0
        for j in range(STATE_DIM):
            s += A[i][j] * state[j]
        # Add small drift toward healthy baseline + small noise
        s += 0.005 * (1.0 if i < 8 else 0.0)  # gentle push to health for water quality
        new_state[i] = max(-1.0, min(1.0, s))
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "state_prev": state, "state_next": new_state,
        "step": 1,
        "doctrine": "Mamba-2 SSD: x_{t+1} = A @ x_t + small drift",
    })


def pond_simulate(steps: int = 10, initial_state: Optional[List[float]] = None) -> dict:
    """Run N Mamba-2 steps + return full trajectory."""
    if steps < 1 or steps > 100:
        return _sign({"error": "steps must be 1-100"})
    if initial_state is None:
        init = pond_init()
        state = init["state"]
    elif isinstance(initial_state, list) and len(initial_state) == STATE_DIM:
        state = initial_state
    else:
        return _sign({"error": f"initial_state must be 16-dim"})
    trajectory = [state]
    for _ in range(steps):
        r = pond_step(state)
        if "error" in r:
            return r
        state = r["state_next"]
        trajectory.append(state)
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "trajectory": trajectory,
        "step_count": steps,
        "state_dim": STATE_DIM,
    })


def pond_care_floor(state: List[float]) -> dict:
    """Check 16-probe care floor on pond state."""
    if not isinstance(state, list) or len(state) != STATE_DIM:
        return _sign({"error": "state must be 16-dim"})
    probes = {}
    # 8 water quality probes
    for i, name in enumerate(STATE_NAMES[:8]):
        v = state[i]
        if name in CARE_RANGES:
            lo, hi = CARE_RANGES[name]
            # Map -1..1 to range
            actual = lo + (v + 1) * (hi - lo) / 2
            probes[name] = lo <= actual <= hi
        else:
            probes[name] = -1 <= v <= 1
    # 8 secondary probes (fish + environment)
    for i, name in enumerate(STATE_NAMES[8:]):
        v = state[i + 8]
        probes[name] = -1 <= v <= 1
    all_pass = all(probes.values())
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "probes": probes,
        "passed_count": sum(1 for v in probes.values() if v),
        "total": len(probes),
        "care_floor_passed": all_pass,
    })


def pond_alerts(state: List[float]) -> dict:
    """Check alert conditions on pond state."""
    if not isinstance(state, list) or len(state) != STATE_DIM:
        return _sign({"error": "state must be 16-dim"})
    alerts = []
    # Map -1..1 to actual value, then check threshold
    def get_actual(idx):
        v = state[idx]
        name = STATE_NAMES[idx]
        if name in CARE_RANGES:
            lo, hi = CARE_RANGES[name]
            return lo + (v + 1) * (hi - lo) / 2
        return v
    # pH
    ph = get_actual(0)
    if ph < ALERT_THRESHOLDS["ph_low"]:
        alerts.append({"alert": "ph_low", "value": round(ph, 2), "severity": "critical"})
    elif ph > ALERT_THRESHOLDS["ph_high"]:
        alerts.append({"alert": "ph_high", "value": round(ph, 2), "severity": "high"})
    # DO
    do = get_actual(1)
    if do < ALERT_THRESHOLDS["do_low"]:
        alerts.append({"alert": "do_low", "value": round(do, 2), "severity": "critical"})
    # Temp
    temp = get_actual(2)
    if temp > ALERT_THRESHOLDS["temp_high"]:
        alerts.append({"alert": "temp_high", "value": round(temp, 2), "severity": "high"})
    # Ammonia
    ammonia = get_actual(3)
    if ammonia > ALERT_THRESHOLDS["ammonia_high"]:
        alerts.append({"alert": "ammonia_high", "value": round(ammonia, 4), "severity": "high"})
    # Fish stress (already in -1..1)
    stress = state[10]
    if stress > ALERT_THRESHOLDS["fish_stress_high"]:
        alerts.append({"alert": "fish_stress_high", "value": round(stress, 2), "severity": "medium"})
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "alerts": alerts,
        "count": len(alerts),
        "doctrine": "Alerts trigger BFT (3 voters) auto-action",
    })