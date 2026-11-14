#!/usr/bin/env python3
"""perf_monitor.py — ASI-Evolve: tracks harness performance.

Measures execution time of each harness, finds slow ones, proposes
optimizations. ASI-Evolve style: self-monitors, adjusts its own frequency.
"""
from __future__ import annotations
import json, os, sys, subprocess, time
from pathlib import Path
from datetime import datetime, timezone

NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
MEAS_DIR = Path.home() / "clawd" / "councilof-ai" / "measurement"
STATE = Path("/tmp/perf_monitor_state.json")

HARNESSES = [
    "card_miner_asi.py",
    "evolve_banks_asi.py",
    "self_correct_asi.py",
    "watchdog_asi_v2.py",
    "meta_improve.py",
    "a2a_mcp_harness_asi.py",
    "eth_x402_harness_asi.py",
    "skill_installer.py",
    "discovery_learner.py",
    "signing_queue.py",
    "corrections_engine.py",
    "auto_publish_asi.py",
    "cost_controller.py",
]

HARNESS_DIR = "/Users/nicholas/clawd/councilof-ai-work/harness/mine"

def load_state():
    if STATE.exists():
        return json.loads(STATE.read_text())
    return {"runs": 0, "timings": {}, "slow_threshold_seconds": 30}

def save_state(s):
    STATE.write_text(json.dumps(s, indent=2))

def time_harness(script):
    path = os.path.join(HARNESS_DIR, script)
    if not os.path.exists(path):
        return None, None
    try:
        start = time.time()
        result = subprocess.run(['python3', path], capture_output=True, text=True, timeout=60)
        elapsed = time.time() - start
        return elapsed, "ok" if result.returncode == 0 else f"error:{result.returncode}"
    except subprocess.TimeoutExpired:
        return 60.0, "timeout"
    except Exception as e:
        return None, str(e)

def write_card(subject, kind, metrics):
    body = {
        "schema": "gspc.measurement-card/0.1",
        "kind": kind,
        "subject": subject,
        "measured_at": NOW(),
        "metrics": metrics,
        "honest_sentence": f"ASI-Evolve perf monitor: {metrics.get('harnesses_tested', 0)} harnesses tested, {metrics.get('slow_count', 0)} slow.",
        "measurement_not_certification": True,
        "permissionless": True,
        "auto_churn": True,
    }
    fname = MEAS_DIR / f"perf-{subject.replace('/', '-').replace(':', '-').replace('.', '-')[:60]}.json"
    fname.write_text(json.dumps(body, indent=2))
    return fname

def main():
    state = load_state()
    state["runs"] += 1
    print(f"[{NOW()}] perf_monitor starting — run #{state['runs']}")
    timings = {}
    slow = []
    for script in HARNESSES:
        elapsed, status = time_harness(script)
        if elapsed is not None:
            timings[script] = {"elapsed_seconds": round(elapsed, 2), "status": status}
            if elapsed > state.get("slow_threshold_seconds", 30):
                slow.append(script)
            print(f"  {script[:30]:30} {elapsed:6.2f}s {status}")
    state["timings"] = timings
    save_state(state)
    write_card(
        f"perf-{NOW().replace(':', '').replace('-', '')[:13]}",
        "measurement.perf.timings",
        {
            "harnesses_tested": len(timings),
            "slow_count": len(slow),
            "slow_harnesses": slow,
            "timings": timings,
            "threshold_seconds": state.get("slow_threshold_seconds", 30),
            "miner_version": "asi-evolve-2",
            "note": "Harness execution time tracking. Slow = >30s. ASI-Evolve self-monitors.",
        },
    )
    print(f"[{NOW()}] perf_monitor done: {len(timings)} tested, {len(slow)} slow")
    return 0

if __name__ == "__main__":
    sys.exit(main())
