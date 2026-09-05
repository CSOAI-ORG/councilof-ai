#!/usr/bin/env python3
"""harvest-per-model-cards.py — mine per-model × per-axis signed cards.

Lane-doable: reads the live board, emits ≤3KB unsigned cards per (model, axis)
pair, stages them under scripts/badger/_queue/ for the atom root to commit. The mill cannot read this directory;
badger_to_hub_queue.py selects the gradeable subset.

The board has 22 axes. The model-comparison axes (14) carry per-model rows
that we re-emit as signed atoms. Each card is the model-as-subject, the axis-
as-target, with the measured figure, Wilson interval, separation state, and a
pointer back to the live board.

Why: a model owner can pin "your model is the leader on governance (n=237,
Wilson 95% CI)" as a signed badge — value insurers, regulators, procurement
trust without us certifying anything.

Usage:
  ./harvest-per-model-cards.py --dry-run       # show counts only
  ./harvest-per-model-cards.py --axis governance
  ./harvest-per-model-cards.py --upload        # upload via the mill queue
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
QUEUE = HERE / "_queue" / "per-model"
BOARD_URL = "https://councilof.ai/api/gspc"
DID = "did:web:csoai.org#card-attestation-1"
SCHEMA = "csoai.gspc-axes/0.5"
MAX_PAYLOAD = 3072


def http_get(url: str, timeout: int = 15):
    # Prefer local cache if present (avoids CF 403 against urllib UA)
    import os.path
    if "/api/gspc" in url and os.path.exists("/tmp/board.json"):
        with open("/tmp/board.json") as f:
            return json.loads(f.read())
    # Identify ourselves. Without a User-Agent, urllib sends "Python-urllib/3.x",
    # and our OWN /api/gspc bot rule 403s it — measured: no-UA 200, browser-UA 200,
    # Python-urllib 403. This harvester failed on every run for that reason, and
    # nine other badger scripts already set a UA; this one and hf-eat-all.py did not.
    req = urllib.request.Request(url, headers={
        "Accept": "application/json",
        "User-Agent": "csoai-harvest-per-model (+https://councilof.ai)",
    })
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))


def card(model_id: str, axis: dict, fleet_pos: str | None = None) -> dict:
    """The unsigned per-model × per-axis card body."""
    now = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    return {
        "schema": SCHEMA,
        "kind": "gspc.measurement-card",
        "version": 1,
        "issuer": DID,
        "as_of": now,
        "subject": {
            "kind": "model",
            "hub": "huggingface",  # best-known; can extend to other providers later
            "slug": model_id,
        },
        "scope": {
            "axis": axis.get("axis"),
            "family": axis.get("family"),
            "kind": axis.get("kind"),
        },
        "measurement": {
            "status": axis.get("status"),  # MEASURED / UNMEASURED
            "n": axis.get("n"),  # board n, not per-model n
            "accuracy": axis.get("accuracy"),
            "separation": axis.get("separation"),
            "fleet_position": fleet_pos,  # LEADER / TIED / FLEET_MEAN / UNKNOWN
        },
        "links": {
            "live_board": BOARD_URL,
            "verify": "https://councilof.ai/gspc-verify",
            "axis_page": f"https://councilof.ai/axis/{axis.get('axis', '')}.html",
        },
        "notes": [
            "Per-model × per-axis card, derived from the live board.",
            "The board is the authority — quote GET /api/gspc.",
            "Verification is free at https://councilof.ai/gspc-verify.",
            "Measurement, not certification.",
        ],
    }


def harvest(axis_filter: str | None) -> list[dict]:
    """Read the board and emit one card per (model, axis) for every measured
    model-comparison axis. Models come from the board's per-model rows if
    present; otherwise we fall back to a fleet manifest.
    """
    board = http_get(BOARD_URL)
    axes = board.get("axes", [])
    out: list[dict] = []
    for ax in axes:
        if ax.get("status") != "MEASURED":
            continue
        if ax.get("kind") != "model-comparison":
            continue  # skip deterministic-fact axes here — they have no model fleet
        if axis_filter and ax.get("axis") != axis_filter:
            continue
        # The board doesn't expose the per-model rows in /api/gspc today (it's
        # the aggregate). The fleet roster lives in the agent-cards repo, but
        # we can stage cards with the AGGREGATE and a fleet_position marker so
        # the actual per-model rows can be backfilled when the mill re-runs.
        # For now, emit one "fleet" card per axis — same atom, different kind.
        out.append({
            "model_id": f"fleet:{ax.get('axis')}",
            "axis": ax,
            "fleet_pos": "FLEET_MEAN",  # honest: this is the fleet, not a leader
        })
    return out


def emit(cards: list[dict]) -> tuple[int, int]:
    """Write unsigned cards as JSONL; return (n_written, n_oversized)."""
    QUEUE.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    path = QUEUE / f"per-model-{stamp}.jsonl"
    n_written = 0
    n_oversized = 0
    with open(path, "w") as f:
        for c in cards:
            body = card(c["model_id"], c["axis"], c["fleet_pos"])
            blob = json.dumps(body, separators=(",", ":"))
            if len(blob) > MAX_PAYLOAD:
                n_oversized += 1
                continue
            f.write(blob + "\n")
            n_written += 1
    return n_written, n_oversized


def main():
    ap = argparse.ArgumentParser(description="Harvest per-model × per-axis cards.")
    ap.add_argument("--axis", type=str, default=None, help="Single axis (default: all 14).")
    ap.add_argument("--dry-run", action="store_true", help="Plan only, do not write.")
    ap.add_argument("--upload", action="store_true", help="Plan an upload via the mill queue.")
    args = ap.parse_args()

    print(f"=== PER-MODEL × PER-AXIS CARD HARVEST ===")
    print(f"  axis filter : {args.axis or '(all 14 model-comparison)'}")
    print(f"  dry-run     : {args.dry_run}")
    print(f"  upload      : {args.upload}")
    print()

    # Report an unreachable board the way every other harvester in this estate
    # does — as a named UNREACHABLE — instead of dying with a urllib traceback.
    # This one raised HTTPError/URLError straight out of main(), so the 1000x
    # orchestrator recorded "exit=1" with no reason and the actual cause (our own
    # bot rule 403ing Python-urllib) stayed invisible across every run.
    try:
        cards = harvest(args.axis)
    except Exception as exc:
        print(f"  UNREACHABLE {BOARD_URL}: {type(exc).__name__}: {exc}")
        print("  No cards written. A source that cannot be read says so; it never")
        print("  contributes a silent zero.")
        return 1

    print(f"Planned: {len(cards)} card(s)")
    if cards[:3]:
        print(f"  sample: {[c['model_id'] for c in cards[:3]]}")
    print()

    if args.dry_run:
        print("(dry-run) no cards written.")
        return 0

    n_written, n_oversized = emit(cards)
    print(f"=== Summary ===")
    print(f"  planned    : {len(cards)}")
    print(f"  written    : {n_written}")
    print(f"  oversized  : {n_oversized}")
    print(f"  queue dir  : {QUEUE}")
    print()
    if args.upload:
        print("(upload: lane-doable next step is to let mill_hub_queue.py sign+upload)")
    else:
        print("(not uploading — pass --upload to plan an upload step)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
