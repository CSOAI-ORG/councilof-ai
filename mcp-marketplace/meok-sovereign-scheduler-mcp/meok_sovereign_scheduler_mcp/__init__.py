"""meok-sovereign-scheduler-mcp — Cron + interval + once + sigil every tick.

The scheduler manages timed tasks across the sovereign substrate. Each
job is sigil-signed and tracked in a tick history.

5 tools:
  1. scheduler_register  - register a cron-like job
  2. scheduler_tick      - simulate a tick (execute due jobs)
  3. scheduler_list      - list registered jobs
  4. scheduler_cancel    - cancel a job
  5. scheduler_history   - tick history
"""
from __future__ import annotations
import json
import hashlib
import time
from datetime import datetime, timezone
from typing import Optional

PROTOCOL = "sovereign-scheduler/1.0"
VERSION = "1.0.0"

_JOBS: dict = {}      # job_id -> job
_HISTORY: list = []   # tick history


def _sign(payload: dict) -> dict:
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "sched-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def _now_ns():
    return time.time_ns()


def scheduler_register(name: str, interval_seconds: int = 60,
                      action: str = "tick", mode: str = "interval") -> dict:
    """Register a scheduled job. Mode: 'interval' or 'once' or 'cron'."""
    if interval_seconds < 1:
        return _sign({"error": "interval_seconds must be >= 1"})
    job_id = hashlib.sha256(f"{name}|{_now_ns()}".encode()).hexdigest()[:16]
    job = {
        "job_id": job_id, "name": name, "action": action, "mode": mode,
        "interval_seconds": interval_seconds,
        "last_run": None, "next_run": datetime.now(timezone.utc).isoformat(),
        "run_count": 0, "registered_at": datetime.now(timezone.utc).isoformat(),
        "active": True,
    }
    _JOBS[job_id] = job
    return _sign(job)


def scheduler_tick(simulate: bool = True) -> dict:
    """Simulate a tick (execute due jobs). Returns executed jobs."""
    now = datetime.now(timezone.utc)
    executed = []
    for job in _JOBS.values():
        if not job["active"]:
            continue
        if job["next_run"] is None or now >= datetime.fromisoformat(job["next_run"]):
            # Execute
            job["last_run"] = now.isoformat()
            job["run_count"] += 1
            if job["mode"] == "once":
                job["active"] = False
            else:
                # Schedule next run
                next_dt = datetime.fromisoformat(job["next_run"]) if job["next_run"] else now
                from datetime import timedelta
                next_dt = next_dt + timedelta(seconds=job["interval_seconds"])
                job["next_run"] = next_dt.isoformat()
            executed.append({"job_id": job["job_id"], "name": job["name"], "action": job["action"]})
    tick = {
        "tick_id": hashlib.sha256(f"{now.isoformat()}".encode()).hexdigest()[:16],
        "ts": now.isoformat(),
        "executed": executed,
        "executed_count": len(executed),
    }
    signed = _sign(tick)
    _HISTORY.append(signed)
    return signed


def scheduler_list(active_only: bool = False) -> dict:
    """List registered jobs."""
    jobs = list(_JOBS.values())
    if active_only:
        jobs = [j for j in jobs if j["active"]]
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "jobs": jobs, "count": len(jobs),
    })


def scheduler_cancel(job_id: str) -> dict:
    """Cancel a job."""
    if job_id not in _JOBS:
        return _sign({"error": f"unknown job: {job_id}"})
    _JOBS[job_id]["active"] = False
    _JOBS[job_id]["cancelled_at"] = datetime.now(timezone.utc).isoformat()
    return _sign(_JOBS[job_id])


def scheduler_history(limit: int = 50) -> dict:
    """Tick history."""
    matching = _HISTORY[-limit:]
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "ticks": matching, "count": len(matching),
    })