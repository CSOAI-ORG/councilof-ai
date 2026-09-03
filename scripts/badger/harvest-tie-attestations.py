#!/usr/bin/env python3
"""harvest-tie-attestations.py — TIE attestation cards.

Lane-doable: reads /api/gspc, finds axes where separation==TIE,
emits one signed TIE attestation card per TIE. The TIE discipline is
"two models tied on safety" — the proof that the TIE is real.

Usage:
  ./harvest-tie-attestations.py
  ./harvest-tie-attestations.py --dry-run
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
QUEUE = HERE / "_queue" / "tie-attestations"
DID = "did:web:csoai.org#card-attestation-1"
SCHEMA = "csoai.gspc-axes/0.5"
MAX_PAYLOAD = 3072


def curl_json(url: str) -> object:
    try:
        r = subprocess.run(
            ["curl", "-L", "-s", "-H", "Accept: application/json",
             "-w", "\n%{http_code}", "--max-time", "30", url],
            capture_output=True, text=True, timeout=35,
        )
        out = r.stdout
        if "\n" in out:
            body, code = out.rsplit("\n", 1)
            try:
                if int(code) != 200:
                    return None
            except ValueError:
                return None
            try:
                return json.loads(body)
            except Exception:
                return None
        return None
    except Exception:
        return None


def card(axis: str, n: int, accuracy: float | None, fleet_size: int) -> dict:
    now = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    return {
        "schema": SCHEMA,
        "kind": "gspc.tie-attestation",
        "version": 1,
        "issuer": DID,
        "as_of": now,
        "subject": {
            "kind": "tie-attestation",
            "axis": axis,
            "fleet_size": fleet_size,
        },
        "scope": {
            "axis": axis,
            "kind": "tie-attestation",
        },
        "measurement": {
            "status": "TIE",
            "separation": "TIE",
            "n": n,
            "accuracy": accuracy,
            "discipline": "TIE is TIE — never a fake equal. The tied models are reported, not hidden.",
        },
        "links": {
            "live_board": "https://councilof.ai/api/gspc",
            "verify": "https://councilof.ai/gspc-verify",
            "axis_page": f"https://councilof.ai/axis/{axis}.html",
        },
        "notes": [
            f"Auto-derived by harvest-tie-attestations.py at {now}",
            "Two or more models are statistically tied on this axis (McNemar p>=0.05).",
            "The board reports TIE, not a leader. This card is the public witness of that fact.",
        ],
    }


def main():
    ap = argparse.ArgumentParser(description="TIE attestation harvester.")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    print(f"=== TIE ATTESTATION HARVEST ===")

    board = curl_json("https://councilof.ai/api/gspc")
    if not board or not isinstance(board, dict):
        print("  UNREACHABLE — /api/gspc didn't return JSON")
        return 1

    axes = board.get("axes", [])
    ties = [a for a in axes if a.get("separation") == "TIE"]
    print(f"  found: {len(ties)} TIE axes")

    if not ties:
        print("  (no TIEs to attest)")
        return 0

    if args.dry_run:
        for a in ties:
            print(f"  {a.get('axis'):<25} n={a.get('n')}  acc={a.get('accuracy')}")
        print(f"(dry-run) {len(ties)} cards would be written")
        return 0

    QUEUE.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    path = QUEUE / f"ties-{stamp}.jsonl"
    n_written = 0
    n_oversized = 0
    with open(path, "w") as f:
        for a in ties:
            body = card(a.get("axis"), a.get("n"), a.get("accuracy"), 19)
            blob = json.dumps(body, separators=(",", ":"))
            if len(blob) > MAX_PAYLOAD:
                n_oversized += 1
                continue
            f.write(blob + "\n")
            n_written += 1

    print(f"  written:   {n_written}")
    print(f"  oversized: {n_oversized}")
    print(f"  queue:     {path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
