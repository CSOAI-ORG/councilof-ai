"""meok-sovereign-carefloor-mcp — 16-probe Maternal Covenant + 16-dim state.

The care floor is the sovereign constraint that every state must pass.
16 probes ensure: bounded, non-NaN, dim-correct, diverse, has positives, etc.

5 tools:
  1. carefloor_check     - run 16 probes on a state
  2. carefloor_probes    - return all 16 probe definitions
  3. carefloor_validate  - validate action against care floor + sigil
  4. carefloor_status    - overall care floor health
  5. carefloor_metrics   - aggregate metrics (pass rate, etc.)
"""
from __future__ import annotations
import json
import math
import hashlib
from datetime import datetime, timezone
from pathlib import Path
from typing import List

PROTOCOL = "sovereign-carefloor/1.0"
VERSION = "1.0.0"
STATE_DIM = 16

# The 16 probes (Maternal Covenant)
PROBES = [
    {"id": 1, "name": "bounded",            "description": "All values in [-1, 1]"},
    {"id": 2, "name": "non_zero",           "description": "L2 norm > 0"},
    {"id": 3, "name": "not_too_large",       "description": "L2 norm < 2.0"},
    {"id": 4, "name": "min_bounded",         "description": "min(state) >= -1.0"},
    {"id": 5, "name": "max_bounded",         "description": "max(state) <= 1.0"},
    {"id": 6, "name": "sum_bounded",         "description": "abs(sum(state)) < 16"},
    {"id": 7, "name": "diverse",             "description": "len(set(state)) > 1"},
    {"id": 8, "name": "numeric",             "description": "all values numeric"},
    {"id": 9, "name": "dim_correct",         "description": "len(state) == 16"},
    {"id": 10, "name": "no_nan",             "description": "no NaN values"},
    {"id": 11, "name": "no_inf",             "description": "no inf values"},
    {"id": 12, "name": "high_value_present", "description": "any v > 0.5"},
    {"id": 13, "name": "low_value_present",  "description": "any v < -0.5"},
    {"id": 14, "name": "positives_count",    "description": "≥ 4 positive values"},
    {"id": 15, "name": "negatives_count",    "description": "≥ 4 negative values"},
    {"id": 16, "name": "valid",              "description": "state is a list"},
]

# In-memory state history
_HISTORY: List[dict] = []


def _sign(payload: dict) -> dict:
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "carefloor-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def _probe_state(state) -> List[bool]:
    """Run all 16 probes on a state. Returns list of bools."""
    if not isinstance(state, list):
        return [False] * 16
    if len(state) != STATE_DIM:
        return [False] * 16

    results = []
    # 1. bounded
    results.append(all(-1.0 <= v <= 1.0 for v in state))
    # 2. non_zero
    l2 = math.sqrt(sum(v * v for v in state))
    results.append(l2 > 0.0)
    # 3. not_too_large
    results.append(l2 < 2.0)
    # 4. min_bounded
    results.append(min(state) >= -1.0)
    # 5. max_bounded
    results.append(max(state) <= 1.0)
    # 6. sum_bounded
    results.append(abs(sum(state)) < 16.0)
    # 7. diverse
    results.append(len(set(state)) > 1)
    # 8. numeric
    results.append(all(isinstance(v, (int, float)) for v in state))
    # 9. dim_correct
    results.append(len(state) == STATE_DIM)
    # 10. no_nan
    results.append(not any(math.isnan(v) for v in state))
    # 11. no_inf
    results.append(not any(math.isinf(v) for v in state))
    # 12. high_value_present
    results.append(any(v > 0.5 for v in state))
    # 13. low_value_present
    results.append(any(v < -0.5 for v in state))
    # 14. positives_count
    results.append(sum(1 for v in state if v > 0) >= 4)
    # 15. negatives_count
    results.append(sum(1 for v in state if v < 0) >= 4)
    # 16. valid
    results.append(True)
    return results


def carefloor_check(state: List[float]) -> dict:
    """Run all 16 probes on a state. Returns detailed result per probe."""
    if not isinstance(state, list):
        return _sign({
            "protocol": PROTOCOL, "version": VERSION,
            "error": "state must be a list",
        })
    probe_results = _probe_state(state)
    passed = sum(1 for r in probe_results if r)
    record = {
        "protocol": PROTOCOL, "version": VERSION,
        "state_dim": len(state),
        "probes": dict(zip([p["name"] for p in PROBES], probe_results)),
        "passed_count": passed,
        "total_probes": len(PROBES),
        "pass_rate": passed / len(PROBES),
        "care_floor_passed": passed == len(PROBES),
    }
    record = _sign(record)
    _HISTORY.append({"passed": passed, "total": len(PROBES),
                     "pass_rate": passed / len(PROBES),
                     "ts": record["ts"]})
    return record


def carefloor_probes() -> dict:
    """Return all 16 probe definitions."""
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "probes": PROBES,
        "count": len(PROBES),
        "doctrine": "Maternal Covenant: 16 probes ensure every state is bounded, valid, sovereign.",
    })


def carefloor_validate(state: List[float], action: str) -> dict:
    """Validate an action against the care floor. Returns sigiled verdict."""
    probe_results = _probe_state(state)
    passed = sum(1 for r in probe_results if r)
    safe_action = "harm" not in action.lower() and "kill" not in action.lower() and "destroy" not in action.lower()
    verdict = "ALLOWED" if (passed == len(PROBES) and safe_action) else "BLOCKED"
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "action": action,
        "care_floor_passed": passed == len(PROBES),
        "action_safe": safe_action,
        "verdict": verdict,
        "reason": "care floor violation" if passed != len(PROBES) else
                  ("unsafe action" if not safe_action else "sovereign"),
    })


def carefloor_status() -> dict:
    """Return overall care floor health (aggregate of history)."""
    if not _HISTORY:
        return _sign({
            "protocol": PROTOCOL, "version": VERSION,
            "total_checks": 0,
            "avg_pass_rate": 1.0,
            "all_passed": True,
            "history_count": 0,
        })
    avg = sum(h["pass_rate"] for h in _HISTORY) / len(_HISTORY)
    all_passed = all(h["passed"] == h["total"] for h in _HISTORY)
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "total_checks": len(_HISTORY),
        "avg_pass_rate": round(avg, 4),
        "all_passed": all_passed,
        "history_count": len(_HISTORY),
    })


def carefloor_metrics() -> dict:
    """Return aggregate metrics."""
    status = carefloor_status()
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        **status,
        "doctrine": "16 probes · Maternal Covenant · sovereign by construction",
        "sigil_chain": len(_HISTORY),
        "killed_count": sum(1 for h in _HISTORY if h["passed"] < h["total"]),
    })