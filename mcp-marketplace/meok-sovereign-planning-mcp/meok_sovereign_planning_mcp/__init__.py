"""meok-sovereign-planning-mcp — SOV3 Planning + Goals + History.

The 5th core MCP for the full AI OS:
  1. sov_plan_create    - create a multi-step plan
  2. sov_plan_step      - mark a step done + propose next
  3. sov_goal_set       - set a goal with care-floor + sovereign scoring
  4. sov_goal_progress  - track progress + emit sigil
  5. sov_history_search - search the sovereign history (sigil-anchored)

Used by the 12 Generals + the meok-os full AI OS.
"""
from __future__ import annotations
import json
import hashlib
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pathlib import Path

PROTOCOL = "sovereign-planning/1.0"
VERSION = "1.0.0"
HISTORY_PATH = Path("/Users/nicholas/clawd/sov_competition/history.jsonl")
HISTORY_PATH.parent.mkdir(parents=True, exist_ok=True)
# Load existing history if present
if HISTORY_PATH.exists():
    _HISTORY = [json.loads(l) for l in open(HISTORY_PATH) if l.strip()]
else:
    _HISTORY = []
_PLANS = {}
_GOALS = {}


def _sign(payload: dict) -> dict:
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "planning-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def sov_plan_create(title: str, steps: List[str], *, care_floor_impact: bool = False) -> dict:
    """Create a multi-step plan. If care_floor_impact=True, BFT approval required."""
    plan_id = hashlib.sha256(f"{title}|{time.time()}".encode()).hexdigest()[:16]
    plan = {
        "plan_id": plan_id,
        "title": title,
        "steps": [{"idx": i, "text": s, "done": False} for i, s in enumerate(steps)],
        "care_floor_impact": care_floor_impact,
        "status": "PENDING_BFT" if care_floor_impact else "APPROVED",
    }
    _PLANS[plan_id] = plan
    _HISTORY.append({"type": "plan_create", "plan_id": plan_id, "title": title})
    _persist_history()
    return _sign({**plan, "step_count": len(steps)})


def sov_plan_step(plan_id: str, step_idx: int, *, done: bool = True,
                  next_proposal: Optional[str] = None) -> dict:
    """Mark a step done + propose the next."""
    if plan_id not in _PLANS:
        return _sign({"error": f"unknown plan: {plan_id}"})
    plan = _PLANS[plan_id]
    if step_idx < 0 or step_idx >= len(plan["steps"]):
        return _sign({"error": f"step_idx out of range: {step_idx}"})
    plan["steps"][step_idx]["done"] = done
    plan["steps"][step_idx]["completed_at"] = datetime.now(timezone.utc).isoformat()
    # Check if all done
    all_done = all(s["done"] for s in plan["steps"])
    if all_done:
        plan["status"] = "COMPLETED"
    # Find next undone step
    next_step = None
    for s in plan["steps"]:
        if not s["done"]:
            next_step = {"idx": s["idx"], "text": s["text"]}
            break
    _HISTORY.append({"type": "plan_step", "plan_id": plan_id, "step_idx": step_idx, "done": done})
    _persist_history()
    return _sign({
        "plan_id": plan_id,
        "step_idx": step_idx,
        "done": done,
        "next_step": next_step,
        "next_proposal": next_proposal,
        "plan_status": plan["status"],
    })


def sov_goal_set(goal: str, *, care_floor_weight: float = 0.5,
                sovereign_weight: float = 0.3) -> dict:
    """Set a goal with care-floor + sovereign scoring weights."""
    goal_id = hashlib.sha256(f"{goal}|{time.time()}".encode()).hexdigest()[:16]
    g = {
        "goal_id": goal_id,
        "goal": goal,
        "care_floor_weight": care_floor_weight,
        "sovereign_weight": sovereign_weight,
        "progress": 0.0,
        "status": "ACTIVE",
    }
    _GOALS[goal_id] = g
    _HISTORY.append({"type": "goal_set", "goal_id": goal_id, "goal": goal})
    _persist_history()
    return _sign(g)


def sov_goal_progress(goal_id: str, progress: float = None, *, delta: float = 0.1,
                     note: str = "") -> dict:
    """Track progress on a goal. emit sigil event."""
    if goal_id not in _GOALS:
        return _sign({"error": f"unknown goal: {goal_id}"})
    g = _GOALS[goal_id]
    if progress is not None:
        g["progress"] = min(1.0, max(0.0, progress))
    else:
        g["progress"] = min(1.0, g["progress"] + delta)
    if g["progress"] >= 1.0:
        g["status"] = "COMPLETED"
    g["last_update"] = datetime.now(timezone.utc).isoformat()
    _HISTORY.append({"type": "goal_progress", "goal_id": goal_id,
                    "progress": g["progress"], "note": note})
    _persist_history()
    return _sign({
        "goal_id": goal_id,
        "progress": g["progress"],
        "status": g["status"],
        "note": note,
        "care_floor_score": g["care_floor_weight"] * g["progress"],
        "sovereign_score": g["sovereign_weight"] * g["progress"],
    })


def sov_history_search(query: str = "", *, limit: int = 20,
                      event_type: Optional[str] = None) -> dict:
    """Search the sovereign history. Returns matching events."""
    matching = []
    for h in reversed(_HISTORY):
        if event_type and h.get("type") != event_type:
            continue
        if query:
            haystack = json.dumps(h, default=str).lower()
            if query.lower() not in haystack:
                continue
        matching.append(h)
        if len(matching) >= limit:
            break
    return _sign({
        "query": query,
        "event_type": event_type,
        "limit": limit,
        "matches": matching,
        "match_count": len(matching),
        "total_history": len(_HISTORY),
    })


def _persist_history():
    """Persist history to disk (JSONL)."""
    with open(HISTORY_PATH, "w") as f:
        for h in _HISTORY:
            f.write(json.dumps(h) + "\n")