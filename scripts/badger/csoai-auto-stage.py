#!/usr/bin/env python3
"""csoai-auto-stage.py — the auto-staging layer.

Lane-doable: every 15 minutes, walk all 12+ queue directories, dedupe
by sha256, build a single _state.json manifest that tracks every atom
in the queue (and which have been OTS-anchored). Writes to
scripts/badger/_state.json which the dashboard reads.

Reads:
  scripts/badger/_queue/**/*.jsonl

Writes:
  scripts/badger/_state.json
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from ots_stamp import attestation_state  # noqa: E402
QUEUE = HERE / "_queue"
STATE = HERE / "_state.json"
DID = "did:web:csoai.org#card-attestation-1"

# Maximum payload size (must match the mill)
MAX_PAYLOAD = 3072


def canonical(obj: dict) -> bytes:
    def rec(v):
        if isinstance(v, list):
            return [rec(x) for x in v]
        if isinstance(v, dict):
            return {k: rec(v[k]) for k in sorted(v.keys())}
        return v
    return json.dumps(rec(obj), separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def sha256_hex(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def stage():
    """Walk all queue files, dedupe by sha256, write the state."""
    if not QUEUE.exists():
        QUEUE.mkdir(parents=True, exist_ok=True)

    by_kind = {}
    by_source = {}
    seen_sha = set()
    total = 0
    # Counted by MEASURED attestation state, never by file existence. A variable
    # named ots_anchored that incremented on Path.exists() is where "700+ already
    # OTS-anchored to Bitcoin" came from: it counted pending stamps and even the
    # 12 files that parse as nothing at all.
    ots_state_counts = {"bitcoin": 0, "pending": 0, "unreadable": 0, "absent": 0}
    oversized = 0

    for jsonl in sorted(QUEUE.glob("**/*.jsonl")):
        # Skip the state files (they aren't atoms)
        if jsonl.name.startswith("_state") or "/_state" in str(jsonl):
            continue
        kind = jsonl.parent.name
        if kind.startswith("_"):
            continue
        with open(jsonl) as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    atom = json.loads(line)
                except Exception:
                    continue
                if len(line) > MAX_PAYLOAD:
                    oversized += 1
                    continue
                blob = canonical(atom)
                digest = sha256_hex(blob)
                if digest in seen_sha:
                    continue
                seen_sha.add(digest)

                subject = atom.get("subject", {})
                source = subject.get("source") or subject.get("kind") or "unknown"
                ots_path = jsonl.parent / f"{digest[:16]}.ots"
                ots_state = attestation_state(
                    ots_path.read_bytes() if ots_path.exists() else None
                )["state"]

                by_kind[kind] = by_kind.get(kind, 0) + 1
                by_source[source] = by_source.get(source, 0) + 1
                total += 1
                ots_state_counts[ots_state] = ots_state_counts.get(ots_state, 0) + 1

    now = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    state = {
        "kind": "csoai.queue-state",
        "issuer": DID,
        "as_of": now,
        "totals": {
            "atoms_in_queue": total,
            "by_kind": dict(sorted(by_kind.items())),
            "by_source": dict(sorted(by_source.items())),
            # Only ots.bitcoin may be described as anchored. The other three are
            # explicitly named so no caller can mistake a stamp for a proof.
            "ots_anchored": ots_state_counts["bitcoin"],
            "ots_pending_not_anchored": ots_state_counts["pending"],
            "ots_unreadable": ots_state_counts["unreadable"],
            "ots_absent": ots_state_counts["absent"],
            "oversized_excluded": oversized,
            "dedup_factor": f"{(total / max(1, total + oversized)):.4f}",
        },
        "mill_status": {
            "queue_clear": total == 0,
            "ready_to_sign": total > 0,
            "mill_door": "POST /api/board-sign (GitHub OIDC only)",
        },
        "next_actions": [
            "Operator triggers board-sign (or it runs on the deploy cadence).",
            "OTS runs daily via com.csoai.anchor-daily.",
            "1000x loop runs every 15 min via com.csoai.1000x-master.",
        ],
    }
    STATE.write_text(json.dumps(state, indent=2, sort_keys=True))
    return state


def main():
    ap = argparse.ArgumentParser(description="Auto-stage the queue.")
    ap.add_argument("--quiet", action="store_true")
    args = ap.parse_args()

    print("================================================================")
    print("  CSOAI — AUTO-STAGE")
    print("================================================================")
    print()
    state = stage()
    t = state["totals"]
    print(f"  atoms in queue: {t['atoms_in_queue']}")
    print(f"  ots ANCHORED (Bitcoin block): {t['ots_anchored']}")
    print(f"  ots pending (not a proof)   : {t['ots_pending_not_anchored']}")
    print(f"  ots unreadable (not a stamp): {t['ots_unreadable']}")
    print(f"  ots absent                  : {t['ots_absent']}")
    print(f"  oversized:      {t['oversized_excluded']}")
    print()
    print(f"  by kind:")
    for kind, n in sorted(t["by_kind"].items()):
        print(f"    {kind:<28} {n}")
    print()
    print(f"  state: {STATE.relative_to(HERE.parent.parent)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
