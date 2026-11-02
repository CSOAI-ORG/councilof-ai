#!/usr/bin/env python3
"""signing_queue.py — ASI-Evolve: tracks signing backlog.

Counts unsigned cards, estimates signing cost, prioritizes.
"""
from __future__ import annotations
import json, os, sys
from pathlib import Path
from datetime import datetime, timezone

NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
MEAS_DIR = Path.home() / "clawd" / "councilof-ai" / "measurement"
STATE = Path("/tmp/signing_queue_state.json")

def load_state():
    if STATE.exists():
        return json.loads(STATE.read_text())
    return {"runs": 0, "unsigned_total": 0, "signed_total": 0, "by_kind": {}, "by_subject": {}, "priority_queue": []}

def save_state(s):
    STATE.write_text(json.dumps(s, indent=2))

def write_card(subject, kind, metrics):
    body = {
        "schema": "gspc.measurement-card/0.1",
        "kind": kind,
        "subject": subject,
        "measured_at": NOW(),
        "metrics": metrics,
        "honest_sentence": f"ASI-Evolve signing queue: {metrics.get('unsigned_total', 0)} unsigned, {metrics.get('signed_total', 0)} signed.",
        "measurement_not_certification": True,
        "permissionless": True,
        "auto_churn": True,
    }
    fname = MEAS_DIR / f"signing-queue-{NOW().replace(':', '').replace('-', '')[:13]}.json"
    fname.write_text(json.dumps(body, indent=2))
    return fname

def main():
    state = load_state()
    state["runs"] += 1
    unsigned = 0
    signed = 0
    by_kind = {}
    by_subject_prefix = {}
    for fname in os.listdir(MEAS_DIR):
        if not fname.endswith(".json") or fname.startswith("signing-queue-"):
            continue
        try:
            with open(os.path.join(MEAS_DIR, fname)) as f:
                card = json.load(f)
            sig = card.get("signature")
            kind = card.get("kind", "unknown")
            if sig is None or sig == "null":
                unsigned += 1
                by_kind[kind] = by_kind.get(kind, 0) + 1
                subject = card.get("subject", "")
                prefix = subject.split("-")[0] if subject else "unknown"
                by_subject_prefix[prefix] = by_subject_prefix.get(prefix, 0) + 1
            else:
                signed += 1
        except Exception:
            pass
    state["unsigned_total"] = unsigned
    state["signed_total"] = signed
    state["by_kind"] = by_kind
    state["by_subject"] = by_subject_prefix
    state["priority_queue"] = sorted(by_kind.items(), key=lambda x: -x[1])[:10]
    save_state(state)
    write_card(
        f"signing-queue-{NOW().replace(':', '').replace('-', '')[:13]}",
        "measurement.signing.queue",
        {
            "unsigned_total": unsigned,
            "signed_total": signed,
            "by_kind": by_kind,
            "by_subject_prefix": by_subject_prefix,
            "top_10_unsigned_kinds": state["priority_queue"],
            "miner_version": "asi-evolve-2",
            "note": "Signing backlog audit. M4 does not sign (owner-controlled). GHA signing chains fire every 2h.",
        },
    )
    print(f"[{NOW()}] signing_queue done: {unsigned} unsigned, {signed} signed, top kinds: {state['priority_queue'][:5]}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
