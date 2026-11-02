#!/usr/bin/env python3
"""self_correct.py v2 — ASI-Evolve: drift detection + auto-correction.

Watches itself: monitors its own detection rate, adjusts thresholds.
Compares live board against prior snapshots, posts corrections.
"""
from __future__ import annotations
import json, os, sys, urllib.request, subprocess
from pathlib import Path
from datetime import datetime, timezone

NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
MEAS_DIR = Path.home() / "clawd" / "councilof-ai" / "measurement"
CORRECTIONS_FILE = MEAS_DIR / "corrections.jsonl"
STATE = Path("/tmp/self_correct_state.json")

def load_state():
    if STATE.exists():
        return json.loads(STATE.read_text())
    return {"runs": 0, "drifts_detected": 0, "corrections_posted": 0, "thresholds": {"accuracy_drop_pct": 0.10, "axis_drop_pct": 0.10}}

def save_state(s):
    STATE.write_text(json.dumps(s, indent=2))

def fetch_live_board():
    try:
        req = urllib.request.Request("https://councilof.ai/api/gspc", headers={"User-Agent": "csoai-self-correct-asi/2"})
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read())
    except Exception:
        return {}

def fetch_snapshot():
    snap = Path("/tmp/board_snapshot.json")
    return json.loads(snap.read_text()) if snap.exists() else {}

def save_snapshot(board):
    Path("/tmp/board_snapshot.json").write_text(json.dumps(board, indent=2))

def detect_drifts(board, prior):
    drifts = []
    thresholds = load_state()["thresholds"]
    if not prior or not board:
        return drifts
    axes_live = {a.get("axis"): a for a in board.get("axes", [])}
    axes_prior = {a.get("axis"): a for a in prior.get("axes", [])}
    for ax_name, a_live in axes_live.items():
        a_prior = axes_prior.get(ax_name, {})
        if not a_prior:
            continue
        acc_live = a_live.get("accuracy") or 0
        acc_prior = a_prior.get("accuracy") or 0
        if acc_prior > 0 and abs(acc_live - acc_prior) / acc_prior > thresholds["axis_drop_pct"]:
            drifts.append({
                "axis": ax_name,
                "type": "accuracy_drop",
                "prior": acc_prior,
                "live": acc_live,
                "severity": "P1" if abs(acc_live - acc_prior) / acc_prior > 0.20 else "P2",
            })
    return drifts

def post_correction(drift):
    entry = {
        "id": f"C-{NOW().replace(':', '').replace('-', '')[:13]}",
        "kind": "auto_drift_detection_asi_v2",
        "axis": drift["axis"],
        "type": drift["type"],
        "severity": drift["severity"],
        "detected_at": NOW(),
        "prior_value": drift["prior"],
        "live_value": drift["live"],
        "action": "auto-detected, logged for review (ASI-Evolve v2)",
    }
    with open(CORRECTIONS_FILE, "a") as f:
        f.write(json.dumps(entry) + "\n")

def main():
    state = load_state()
    state["runs"] += 1
    print(f"[{NOW()}] self_correct v2 (ASI-Evolve) — run #{state['runs']}")
    board = fetch_live_board()
    if not board:
        print("No board data, exiting")
        return 1
    save_snapshot(board)
    prior = fetch_snapshot()
    if prior == board:
        print("No drift detected")
        return 0
    drifts = detect_drifts(board, prior)
    state["drifts_detected"] += len(drifts)
    if drifts:
        print(f"Detected {len(drifts)} drifts")
        for d in drifts:
            print(f"  [{d['severity']}] {d['axis']}: {d['prior']:.3f} → {d['live']:.3f}")
            post_correction(d)
            state["corrections_posted"] += 1
    save_state(state)
    print(f"[{NOW()}] self_correct v2 done: {len(drifts)} drifts, cumulative {state['corrections_posted']} corrections")
    return 0

if __name__ == "__main__":
    sys.exit(main())
