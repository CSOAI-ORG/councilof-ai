#!/usr/bin/env python3
"""Build/check the Claim Maintenance reaction index from the signed public event feed.

The index describes reactions to evidence states. It does not score, rank, certify,
accuse, infer intent, or broaden a claim beyond the source event.
"""
from __future__ import annotations
import argparse, hashlib, json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DIR = ROOT / "public/claims/events/v0.1"
DEFAULT_OUT = ROOT / "public/spec/claim-maintenance/reaction-index.json"
CONFIRMED = {"CONFIRMED"}
NO_TRIGGER_KINDS = {"source_not_reachable_this_run"}

def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def line_sha(line: bytes) -> str:
    return sha256(line)

def read_feed(path: Path) -> tuple[bytes, list[dict], list[bytes]]:
    raw = path.read_bytes()
    lines = [x for x in raw.splitlines() if x.strip()]
    return raw, [json.loads(x) for x in lines], lines

def verify_feed(head: dict, raw: bytes, events: list[dict], lines: list[bytes]) -> None:
    feed = head["feed"]
    if sha256(raw) != feed["bytes_sha256"]:
        raise ValueError("feed bytes do not match signed head")
    if len(events) != feed["n_lines"]:
        raise ValueError("feed line count does not match head")
    if events:
        if events[-1].get("seq") != feed["head_seq"]:
            raise ValueError("head seq mismatch")
        if line_sha(lines[-1]) != feed["head_line_sha256"]:
            raise ValueError("head line digest mismatch")
        prev = None
        for i, (ev, b) in enumerate(zip(events, lines)):
            if ev.get("seq") != i:
                raise ValueError(f"non-contiguous seq at {i}")
            if ev.get("prev_sha256") != prev:
                raise ValueError(f"chain mismatch at {i}")
            prev = line_sha(b)

def reaction_for(ev: dict) -> tuple[str, str]:
    kind = ev.get("kind")
    change = ev.get("change_state")
    if kind in NO_TRIGGER_KINDS:
        return "OBSERVE_ONLY", "A source/read failure is not evidence that the claim changed."
    if change in CONFIRMED:
        return "NO_REMEASUREMENT", "Pinned observation reproduced; retain history and schedule the next bounded read."
    if change:
        return "BOUNDED_REMEASUREMENT", "A non-confirmed change state requires bounded remeasurement or owner review before any correction."
    if ev.get("checks_all_pass") is False:
        return "OWNER_REVIEW", "One or more declared checks did not reproduce; preserve the event and review the bounded measurement."
    return "OBSERVE_ONLY", "Observation contributes to the append-only evidence history without promoting a claim state."

def public_subject(ev: dict) -> dict:
    if ev.get("disclosure") == "DISCLOSED":
        return {"disclosure": "DISCLOSED", "subject": ev.get("subject")}
    return {"disclosure": "SEALED", "subject_sealed_id": ev.get("subject_sealed_id")}

def build(events_dir: Path) -> dict:
    head = json.loads((events_dir / "head.json").read_text())
    raw, events, lines = read_feed(events_dir / "events.jsonl")
    verify_feed(head, raw, events, lines)

    actions = Counter()
    changes = Counter()
    objects = Counter()
    packets = []
    for ev in events:
        action, reason = reaction_for(ev)
        actions[action] += 1
        if ev.get("change_state"):
            changes[str(ev["change_state"])] += 1
        if ev.get("object_state"):
            objects[str(ev["object_state"])] += 1
        if action in {"BOUNDED_REMEASUREMENT", "OWNER_REVIEW"}:
            packets.append({
                "schema": "csoai.claim-maintenance-counter-evidence/0.2",
                "event_seq": ev.get("seq"),
                "event_at": ev.get("at"),
                "claim": ev.get("claim"),
                "subject": public_subject(ev),
                "action": action,
                "reason": reason,
                "source": ev.get("source"),
                "acceptance_rule": "Re-read the bounded source/measurement, preserve unknowns, and do not infer falsity, misconduct, legal rights, or intent from a change event.",
            })

    return {
        "schema": "csoai.claim-maintenance-reaction-index/0.2",
        "as_of": head["as_of"],
        "source": {
            "head": "/claims/events/v0.1/head.json",
            "feed": "/claims/events/v0.1/events.jsonl",
            "feed_bytes_sha256": head["feed"]["bytes_sha256"],
            "head_seq": head["feed"]["head_seq"],
            "n_lines": head["feed"]["n_lines"],
            "head_signature": "/claims/events/v0.1/head.signed.json",
        },
        "privacy": {
            "rule": head["rules"]["disclosure"],
            "sealed_subjects_remain_sealed": True,
        },
        "counts": {
            "actions": dict(sorted(actions.items())),
            "change_states": dict(sorted(changes.items())),
            "object_states": dict(sorted(objects.items())),
            "counter_evidence_packets": len(packets),
        },

        "counter_evidence_packets": packets,
        "reaction_policy": {
            "CONFIRMED": "NO_REMEASUREMENT",
            "NON_CONFIRMED_CHANGE": "BOUNDED_REMEASUREMENT",
            "FAILED_CHECK": "OWNER_REVIEW",
            "SOURCE_READ_FAILURE": "OBSERVE_ONLY",
            "OTHER_OBSERVATION": "OBSERVE_ONLY",
        },
        "claim_ceiling": "Observation, identity, payment, settlement, delivery, execution, acceptance, and correction remain distinct states; no state is promoted without evidence from its producing boundary.",
        "not": [
            "not a score or ranking",
            "not certification or compliance status",
            "not a finding of falsity or misconduct",
            "not a legal-rights or trademark determination",
        ],
    }

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--events-dir", type=Path, default=DEFAULT_DIR)
    ap.add_argument("--output", type=Path, default=DEFAULT_OUT)
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()
    doc = build(args.events_dir)
    rendered = json.dumps(doc, indent=2, sort_keys=True) + "\n"
    if args.check:
        if not args.output.exists() or args.output.read_text() != rendered:
            print("FAIL claim-maintenance reaction drift")
            return 1
        print(f"PASS claim-maintenance reaction lines={doc['source']['n_lines']} packets={doc['counts']['counter_evidence_packets']}")
        return 0
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(rendered)
    print(f"wrote {args.output}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
