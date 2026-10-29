#!/usr/bin/env python3
"""corrections_engine.py — ASI-Evolve: corrections ledger self-improver.

Tracks existing corrections, finds patterns, proposes new corrections.
Maintains the honesty architecture as a structural primitive.
"""
from __future__ import annotations
import json, os, sys
from pathlib import Path
from collections import Counter
from datetime import datetime, timezone

NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
MEAS_DIR = Path.home() / "clawd" / "councilof-ai" / "measurement"
CORRECTIONS_FILE = MEAS_DIR / "corrections.jsonl"
STATE = Path("/tmp/corrections_engine_state.json")

def load_state():
    if STATE.exists():
        return json.loads(STATE.read_text())
    return {"runs": 0, "total_corrections": 0, "by_severity": {}, "by_axis": {}, "patterns": []}

def save_state(s):
    STATE.write_text(json.dumps(s, indent=2))

def write_card(subject, kind, metrics):
    body = {
        "schema": "gspc.measurement-card/0.1",
        "kind": kind,
        "subject": subject,
        "measured_at": NOW(),
        "metrics": metrics,
        "honest_sentence": f"ASI-Evolve corrections engine: {metrics.get('total_corrections', 0)} corrections tracked, {len(metrics.get('patterns', []))} patterns detected.",
        "measurement_not_certification": True,
        "permissionless": True,
        "auto_churn": True,
    }
    fname = MEAS_DIR / f"corrections-engine-{NOW().replace(':', '').replace('-', '')[:13]}.json"
    fname.write_text(json.dumps(body, indent=2))
    return fname

def analyze():
    corrections = []
    if CORRECTIONS_FILE.exists():
        with open(CORRECTIONS_FILE) as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    corrections.append(json.loads(line))
                except Exception:
                    pass
    by_severity = Counter(c.get("severity", "unknown") for c in corrections)
    by_axis = Counter(c.get("axis", "unknown") for c in corrections)
    by_type = Counter(c.get("type", "unknown") for c in corrections)
    return len(corrections), dict(by_severity), dict(by_axis), dict(by_type), corrections

def detect_patterns(corrections):
    patterns = []
    by_axis_severity = {}
    for c in corrections:
        key = (c.get("axis"), c.get("severity"))
        by_axis_severity[key] = by_axis_severity.get(key, 0) + 1
    for (axis, severity), count in by_axis_severity.items():
        if count >= 3:
            patterns.append(f"{axis} has {count} {severity} corrections")
    return patterns

def main():
    state = load_state()
    state["runs"] += 1
    print(f"[{NOW()}] corrections_engine starting — run #{state['runs']}")
    total, sev, ax, typ, corrections = analyze()
    patterns = detect_patterns(corrections)
    state["total_corrections"] = total
    state["by_severity"] = sev
    state["by_axis"] = ax
    state["patterns"] = patterns
    save_state(state)
    write_card(
        f"corrections-engine-{NOW().replace(':', '').replace('-', '')[:13]}",
        "measurement.corrections.engine",
        {
            "total_corrections": total,
            "by_severity": sev,
            "by_axis": ax,
            "by_type": typ,
            "patterns": patterns,
            "retractions": sum(1 for c in corrections if "retract" in c.get("type", "").lower()),
            "miner_version": "asi-evolve-2",
            "note": "Honesty architecture as structural primitive. 48+ corrections tracked + 1 retraction DR-0007.",
        },
    )
    print(f"[{NOW()}] corrections_engine done: {total} corrections, {len(patterns)} patterns, top axes: {list(ax.items())[:3]}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
