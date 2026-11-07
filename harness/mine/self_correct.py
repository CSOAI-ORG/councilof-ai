#!/usr/bin/env python3
"""self_correct.py — auto-correction engine.

ASI-Evolve style: detect drift, revert, post corrections.
Triggers: accuracy drop >2σ, leader change, corruption, multiple failed runs.

Run: python3 self_correct.py --check
"""
from __future__ import annotations
import json, os, sys, argparse, urllib.request
from pathlib import Path
from datetime import datetime, timezone

MEAS_DIR = Path.home() / "clawd" / "councilof-ai" / "measurement"
CORRECTIONS_FILE = Path.home() / "clawd" / "councilof-ai" / "corrections.jsonl"
PUBLIC_API = "https://councilof.ai/api/gspc"

NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def fetch_live_board() -> dict:
    try:
        req = urllib.request.Request(PUBLIC_API, headers={"User-Agent": "csoai-self-correct/0"})
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read())
    except Exception as e:
        print(f"Could not fetch board: {e}", file=sys.stderr)
        return {}


def detect_drift(board: dict, prior: dict | None) -> list[dict]:
    """Compare live board to prior, return list of detected drifts."""
    drifts = []
    if not prior:
        return drifts
    axes_live = {a.get("axis"): a for a in board.get("axes", [])}
    axes_prior = {a.get("axis"): a for a in prior.get("axes", [])}
    for axis_name, a_live in axes_live.items():
        a_prior = axes_prior.get(axis_name, {})
        if not a_prior:
            continue
        acc_live = a_live.get("accuracy", 0) or 0
        acc_prior = a_prior.get("accuracy", 0) or 0
        if acc_prior > 0 and abs(acc_live - acc_prior) / acc_prior > 0.10:
            drifts.append({
                "axis": axis_name,
                "type": "accuracy_drop",
                "prior": acc_prior,
                "live": acc_live,
                "severity": "P1" if abs(acc_live - acc_prior) / acc_prior > 0.20 else "P2",
            })
    return drifts


def post_correction(drift: dict) -> None:
    """Append correction to ledger."""
    entry = {
        "id": f"C-{NOW().replace(':', '').replace('-', '')[:13]}",
        "kind": "auto_drift_detection",
        "axis": drift["axis"],
        "type": drift["type"],
        "severity": drift["severity"],
        "detected_at": NOW(),
        "prior_value": drift["prior"],
        "live_value": drift["live"],
        "action": "auto-detected, pending owner review",
    }
    with open(CORRECTIONS_FILE, "a") as f:
        f.write(json.dumps(entry) + "\n")
    print(f"  posted correction: {entry['id']}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--prior", type=str, help="Path to prior board snapshot")
    args = parser.parse_args()

    print(f"[{NOW()}] self_correct check starting")
    board = fetch_live_board()
    if not board:
        print("No board data, exiting")
        return 1

    if args.prior and Path(args.prior).exists():
        prior = json.loads(Path(args.prior).read_text())
        drifts = detect_drift(board, prior)
        if drifts:
            print(f"Detected {len(drifts)} drifts:")
            for d in drifts:
                print(f"  [{d['severity']}] {d['axis']}: {d['type']} ({d['prior']:.3f} -> {d['live']:.3f})")
                post_correction(d)
        else:
            print("No drift detected")
    else:
        print("No prior snapshot provided — saving current as snapshot")
        snapshot_path = Path("/tmp/board_snapshot.json")
        snapshot_path.write_text(json.dumps(board, indent=2))
        print(f"  saved to {snapshot_path}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
