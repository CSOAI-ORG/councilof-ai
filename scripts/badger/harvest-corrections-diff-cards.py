#!/usr/bin/env python3
"""harvest-corrections-diff-cards.py — corrections before/after cards.

Lane-doable: reads /api/corrections, emits one card per correction
entry. Each correction is a public witness of change — exactly the kind
of signed atom a regulator wants when verifying a board's history.

Usage:
  ./harvest-corrections-diff-cards.py            # all 39 entries
  ./harvest-corrections-diff-cards.py --dry-run
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
QUEUE = HERE / "_queue" / "corrections-diff"
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


def card(entry: dict) -> dict:
    now = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    cid = entry.get("id", "?")
    return {
        "schema": SCHEMA,
        "kind": "gspc.measurement-card",
        "version": 1,
        "issuer": DID,
        "as_of": now,
        "subject": {
            "kind": "correction",
            "id": cid,
            "date": entry.get("date"),
        },
        "scope": {
            "kind": "corrections-ledger-entry",
            "as_of": entry.get("date"),
        },
        "measurement": {
            "status": "DISCOVERED",
            "severity": entry.get("severity", "note"),
            "what_was_wrong": (entry.get("what_was_wrong") or "")[:200],
        },
        "links": {
            "corrections_ledger": "https://councilof.ai/api/corrections",
            "live_board": "https://councilof.ai/api/gspc",
            "verify": "https://councilof.ai/gspc-verify",
        },
        "notes": [
            f"Auto-derived by harvest-corrections-diff-cards.py at {now}",
            f"Correction entry {cid} from the public corrections ledger.",
            "Every correction is a public witness — measurement, not certification.",
        ],
    }


def main():
    ap = argparse.ArgumentParser(description="Corrections diff harvester.")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    print(f"=== CORRECTIONS DIFF HARVEST ===")

    cl = curl_json("https://councilof.ai/api/corrections")
    if not cl or not isinstance(cl, dict):
        print("  UNREACHABLE — /api/corrections didn't return JSON")
        return 1

    entries = cl.get("corrections", [])
    print(f"  found: {len(entries)} correction entries")
    if not entries:
        return 0

    QUEUE.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    path = QUEUE / f"corrections-{stamp}.jsonl"
    n_written = 0
    n_oversized = 0

    if args.dry_run:
        print(f"(dry-run) {len(entries)} cards would be written")
        return 0

    with open(path, "w") as f:
        for entry in entries:
            body = card(entry)
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
