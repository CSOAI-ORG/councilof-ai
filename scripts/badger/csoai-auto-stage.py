#!/usr/bin/env python3
"""csoai-auto-stage.py — the auto-staging layer.

Lane-doable: every 15 minutes, walk all 12+ queue directories, dedupe
by sha256, build a single _state.json manifest that tracks every atom
in the queue, and their MEASURED OTS state — anchored / pending / unreadable /
absent, never a count of stamps requested. Writes to
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
                # NOT .get(state, 0): that silently invents a bucket for an
                # unexpected state while only four keys are published, so atoms
                # would vanish from the totals with nothing going red. A wrong key
                # turning a guard into a rubber stamp is the same shape as the
                # Path.exists() count this replaced. Unknown state is a hard error.
                if ots_state not in ots_state_counts:
                    raise SystemExit(
                        f"attestation_state returned unknown state {ots_state!r} for "
                        f"{ots_path}. Refusing to publish a total that does not account "
                        f"for it."
                    )
                ots_state_counts[ots_state] += 1

    # The four published OTS fields must account for every atom, or the totals
    # understate silently. Proven here rather than assumed.
    if sum(ots_state_counts.values()) != total:
        raise SystemExit(
            f"OTS state counts sum to {sum(ots_state_counts.values())} but {total} atoms "
            f"were counted. The published totals would not account for every atom."
        )

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
            # Per-atom counts above are literal: almost no atom carries its own
            # proof. But the atom root commits to the WHOLE queue under a single
            # stamp, so an atom with no .ots of its own can still be anchored by
            # inclusion. Reporting only the per-atom figure understates the truth
            # as badly as the old Path.exists() counter overstated it.
            "atom_root": _atom_root_state(),
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



def _atom_root_state() -> dict:
    """What the whole-queue commitment carries, measured — never assumed.

    An atom is anchored either by its own proof or by inclusion in this root.
    Only "bitcoin" here means the queue is anchored.
    """
    import glob as _g
    roots = sorted(_g.glob("public/interop/atom-root-*.json"))
    if not roots:
        return {"state": "absent", "note": "no atom root built"}
    latest = Path(roots[-1])
    ots = Path(str(latest) + ".ots")
    body = json.loads(latest.read_text())
    st = attestation_state(ots.read_bytes() if ots.exists() else None)
    return {
        "root_file": latest.name,
        "n_leaves": body.get("n_leaves"),
        "merkle_root": body.get("merkle_root"),
        "state": st["state"],
        "block_height": st.get("block_height"),
        "covers": ("anchored by inclusion" if st["state"] == "bitcoin"
                   else "stamped, NOT yet anchored"),
    }


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
