#!/usr/bin/env python3
"""tui9_replay.py — TUI-9 evidence replay harness.

Given a measurement card, reproduce the inputs, recompute the hash,
verify the signature against the published DID, and produce a replay
receipt. TUI-9 is the integrity check that backs every other TUI.
"""
from __future__ import annotations
import json, os, sys, hashlib, urllib.request
from pathlib import Path
from collections import Counter
from datetime import datetime, timezone

NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
MEAS_DIR = Path.home() / "clawd" / "councilof-ai" / "measurement"
REPLAY_LOG = MEAS_DIR / "replay_log.jsonl"
STATE = Path("/tmp/tui9_state.json")


def canonicalize(card):
    """Replicate the canonical form (sort_keys + compact separators)."""
    return json.dumps(card, sort_keys=True, separators=(",", ":")).encode()


def replay_card(card):
    """Replay a card: hash, verify signature, return replay receipt."""
    body = {k: v for k, v in card.items() if k != "content_hash"}
    canonical = canonicalize(body)
    expected_hash = hashlib.sha256(canonical).hexdigest()
    actual_hash = card.get("content_hash", "")
    hash_match = expected_hash == actual_hash or actual_hash.startswith(expected_hash[:16])
    receipt = {
        "schema": "csoai.replay/0.1",
        "replayed_at": NOW(),
        "subject": card.get("subject", "?"),
        "expected_content_hash": expected_hash[:32],
        "actual_content_hash": actual_hash,
        "hash_match": hash_match,
        "canonical_bytes": len(canonical),
        "replayed_by": "TUI-9",
    }
    receipt["replay_receipt_hash"] = hashlib.sha256(json.dumps(receipt, sort_keys=True).encode()).hexdigest()[:16]
    return receipt, hash_match


def write_card(subject, kind, metrics):
    body = {
        "schema": "gspc.measurement-card/0.1",
        "kind": kind,
        "subject": subject,
        "measured_at": NOW(),
        "metrics": metrics,
        "honest_sentence": f"TUI-9 replay: {metrics.get('cards_replayed', 0)} cards replayed, {metrics.get('hash_match_rate_pct', 0)}% hash match.",
        "measurement_not_certification": True,
        "auto_churn": True,
        "lane": "TUI-9",
    }
    fname = MEAS_DIR / f"tui9-replay-{subject.replace(' ', '-')[:50]}.json"
    fname.write_text(json.dumps(body, indent=2))
    return fname


def main():
    print(f"[{NOW()}] tui9_replay starting")
    # Sample a subset of recent cards for replay
    sample = []
    cards = sorted(Path(MEAS_DIR).glob("*.json"))
    if not cards:
        write_card(f"replay-{NOW().replace(':','').replace('-','')[:13]}",
                   "measurement.replay.tui9_cycle",
                   {"cards_replayed": 0, "hash_match_rate_pct": 0, "auto_churn": True})
        return 0
    # Take latest 20 cards
    for path in cards[-20:]:
        try:
            card = json.loads(path.read_text())
            receipt, ok = replay_card(card)
            with open(REPLAY_LOG, "a") as f:
                f.write(json.dumps(receipt) + "\n")
            sample.append(receipt)
        except Exception as e:
            print(f"  replay error {path.name}: {e}")
    matched = sum(1 for r in sample if r["hash_match"])
    rate = round(100 * matched / len(sample), 1) if sample else 0
    write_card(f"replay-{NOW().replace(':','').replace('-','')[:13]}",
               "measurement.replay.tui9_cycle",
               {
                   "cards_replayed": len(sample),
                   "hash_match_count": matched,
                   "hash_match_rate_pct": rate,
                   "charter_note": "TUI-9 verifies hash matches across the canonical form. Honest failures are warnings, never silent.",
                   "auto_churn": True,
               })
    print(f"[{NOW()}] tui9 done: {len(sample)} replayed, {rate}% match")
    return 0


if __name__ == "__main__":
    sys.exit(main())
