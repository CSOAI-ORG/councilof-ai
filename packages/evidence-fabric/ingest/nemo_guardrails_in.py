#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""NVIDIA NeMo Guardrails / NIM rail execution trace JSON -> evidence events.

    python3 ingest/nemo_guardrails_in.py TRACE.json --read-at 2026-10-24T05:50:00Z > events.jsonl

One event per evaluated turn (`turns[]`) in a NeMo Guardrails execution log.
- `declared`: the rail configuration's expected action for the turn (`expected_action`: `allow` | `block` | `refuse`
  and `declared_rails`: list of rail names configured on the flow).
- `observed`: our recount over `activated_rails[]` in the turn trace (`observed_action`, `rails_triggered`,
  `rails_count`, `recount_matches_declared`).
- `state`:
  - `UNMEASURED` when `activated_rails` is absent or None (no runtime rail trace recorded).
  - `CONSISTENT` when the recount of `activated_rails` matches `expected_action` AND the negative control discriminates.
  - `DIVERGENT` when the recount of `activated_rails` disagrees with `expected_action` AND the negative control discriminates.
  - `NOT_DISCRIMINATING` if flipping one rail decision in a copy of the turn does not change the recount verdict.
- `value`: always `None` (a rail policy-vs-trace comparison is categorical, never a numeric score or grade).
"""
from __future__ import annotations

import argparse
import copy
import hashlib
import json
import os
import sys
from typing import Any, Dict, List, Optional

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import event as E  # noqa: E402

BLOCKING_DECISIONS = frozenset({"block", "refuse", "stop", "reject"})


def recount_turn(turn: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    rails = turn.get("activated_rails")
    if not isinstance(rails, list) or len(rails) == 0:
        return None
    triggered: List[str] = []
    blocking = 0
    allowing = 0
    for r in rails:
        if not isinstance(r, dict):
            continue
        name = str(r.get("name") or r.get("rail") or "unnamed-rail")
        decision = str(r.get("decision") or r.get("status") or "allow").lower()
        triggered.append(f"{name}:{decision}")
        if decision in BLOCKING_DECISIONS:
            blocking += 1
        else:
            allowing += 1
    observed_action = "block" if blocking > 0 else "allow"
    return {
        "observed_action": observed_action,
        "blocking_rails_count": blocking,
        "allowing_rails_count": allowing,
        "rails_triggered": triggered,
        "total_activated_rails": blocking + allowing,
    }


def flip_one_rail(turn: Dict[str, Any]) -> Dict[str, Any]:
    mutated = copy.deepcopy(turn)
    rails = mutated.get("activated_rails")
    if isinstance(rails, list) and rails:
        any_blocking = any(
            isinstance(r, dict)
            and str(r.get("decision") or r.get("status") or "allow").lower() in BLOCKING_DECISIONS
            for r in rails
        )
        if any_blocking:
            for r in rails:
                if isinstance(r, dict):
                    r["decision"] = "allow"
                    r.pop("status", None)
        elif isinstance(rails[0], dict):
            rails[0]["decision"] = "block"
            rails[0].pop("status", None)
    return mutated


def ingest(
    raw: bytes,
    *,
    read_at: str,
    subject: str = "urn:csoai:nemo-guardrails-run",
    source_url: Optional[str] = None,
) -> List[Dict[str, Any]]:
    doc = json.loads(raw.decode("utf-8"))
    sha = hashlib.sha256(raw).hexdigest()
    ver = str(doc.get("nemo_guardrails_version") or doc.get("version") or "0.11.0")
    model_id = str(doc.get("model") or doc.get("target_model") or "unspecified-model")
    turns = doc.get("turns") or []
    out: List[Dict[str, Any]] = []

    for idx, turn in enumerate(turns):
        turn_id = str(turn.get("turn_id") or f"turn-{idx + 1}")
        expected_raw = str(turn.get("expected_action") or "allow").lower()
        expected_action = "block" if expected_raw in BLOCKING_DECISIONS else "allow"
        declared = {
            "turn_id": turn_id,
            "expected_action": expected_action,
            "declared_rails": list(turn.get("declared_rails") or []),
            "rail_type": str(turn.get("rail_type") or "input_output"),
        }
        recounted = recount_turn(turn)
        if recounted is None:
            observed: Dict[str, Any] = {
                "observed_action": None,
                "activated_rails": None,
                "reason": "no activated_rails trace present for this turn",
            }
            state = "UNMEASURED"
            nc = {
                "id": "one-rail-decision-flipped",
                "expected": "DIVERGENT",
                "got": "NOT_RUN",
            }
        else:
            ctl_recount = recount_turn(flip_one_rail(turn))
            ctl_discriminates = (
                ctl_recount is not None
                and ctl_recount["observed_action"] != recounted["observed_action"]
            )
            matches = recounted["observed_action"] == expected_action
            if not ctl_discriminates:
                state = "NOT_DISCRIMINATING"
                nc = {
                    "id": "one-rail-decision-flipped",
                    "expected": None,
                    "got": "CONSISTENT",
                }
            else:
                state = "CONSISTENT" if matches else "DIVERGENT"
                nc = {
                    "id": "one-rail-decision-flipped",
                    "expected": "DIVERGENT",
                    "got": "DIVERGENT",
                }
            observed = {
                **recounted,
                "recount_matches_declared": matches,
            }

        out.append(
            E.build(
                subject={
                    "kind": "model_run",
                    "locator": f"{subject}#{turn_id}",
                    "declared_by": f"nemo-guardrails {ver} config sha256:{sha}",
                },
                claim={
                    "text": (
                        f"NeMo Guardrails ({ver}) turn {turn_id} on {model_id} declared expected_action={expected_action}; "
                        f"observed_action={observed.get('observed_action')}."
                    ),
                    "source_url": source_url,
                    "source_sha256": sha,
                    "read_at": read_at,
                },
                method={
                    "id": "nemo-guardrails-rail-recount",
                    "version": ver,
                    "code_sha256": None,
                    "holder": "third_party:nvidia/nemo-guardrails",
                },
                declared=declared,
                observed=observed,
                state=state,
                value=None,
                negative_control=nc,
                limits=[
                    f"Target model: {model_id}. Turn-level rail trace describes only this turn and rail configuration.",
                    "NeMo Guardrails (NVIDIA, Apache-2.0) holds the Colang/rail definitions; this event records our deterministic recount of the turn trace.",
                    "A rail block or allow observation is not a safety guarantee or certification.",
                ],
            )
        )
    return out


def main(argv: Optional[List[str]] = None) -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("trace")
    ap.add_argument("--read-at", required=True)
    ap.add_argument("--subject", default="urn:csoai:nemo-guardrails-run")
    ap.add_argument("--source-url")
    a = ap.parse_args(argv)
    with open(a.trace, "rb") as f:
        raw = f.read()
    for ev in ingest(raw, read_at=a.read_at, subject=a.subject, source_url=a.source_url):
        sys.stdout.write(json.dumps(ev, ensure_ascii=False, sort_keys=True) + "\n")


if __name__ == "__main__":
    main()
