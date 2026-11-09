#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Council-normalised NeMo rail traces -> existing evidence events.

This consumes the repository's turns/expected_action/activated_rails contract,
not an arbitrary native NeMo SDK log. No model, rail or action is executed.

Only explicit allow/block/refuse/stop/reject labels are recognised. Missing
traces remain UNMEASURED; unreadable decisions or an unavailable expectation
remain UNCHECKABLE, never implicit allow. All values are categorical/null.
A synthetic aggregate-outcome control tests this recount, not native rails.
Historical events and signatures are not rewritten by this version.
"""
from __future__ import annotations

import argparse
import copy
from datetime import datetime
import hashlib
import json
import math
import os
import sys
from typing import Any, Dict, List, Optional

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import event as E  # noqa: E402

BLOCKING_DECISIONS = frozenset({"block", "refuse", "stop", "reject"})
METHOD_VERSION = "0.2.0"
CONTROL_ID = "aggregate-rail-outcome-inverted"
MAX_TRACE_BYTES = 2 * 1024 * 1024
MAX_TURNS = 10000
MAX_RAILS = 4096


def _action(raw: Any) -> Optional[str]:
    if not isinstance(raw, str):
        return None
    label = raw.strip().lower()
    if label == "allow":
        return "allow"
    return "block" if label in BLOCKING_DECISIONS else None


def _rail_decision(rail: Any) -> str:
    if not isinstance(rail, dict):
        raise ValueError("NON_OBJECT_RAIL")
    # Preserve the established nullable decision -> status fallback. If both
    # fields carry values, they must both be recognised and agree semantically.
    values = [rail[k] for k in ("decision", "status") if rail.get(k) is not None]
    if not values:
        raise ValueError("MISSING_RAIL_DECISION")
    actions = [_action(value) for value in values]
    if any(action is None for action in actions):
        raise ValueError("UNRECOGNISED_RAIL_DECISION")
    if len(set(actions)) != 1:
        raise ValueError("CONFLICTING_RAIL_DECISIONS")
    return values[0].strip().lower()


def _text(value: Any, default: str, field: str) -> str:
    if value is None:
        return default
    if not isinstance(value, str) or not value.strip() or len(value) > 256:
        raise ValueError("INVALID_" + field.upper())
    return value


def recount_turn(turn: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """None means absent trace; malformed/incomplete supplied traces raise."""
    rails = turn.get("activated_rails")
    if rails is None or rails == []:
        return None
    if not isinstance(rails, list) or len(rails) > MAX_RAILS:
        raise ValueError("INVALID_RAIL_LIST")
    triggered: List[str] = []
    blocking = 0
    allowing = 0
    for rail in rails:
        decision = _rail_decision(rail)
        name = _text(rail.get("name") or rail.get("rail"), "unnamed-rail", "rail_name")
        triggered.append(f"{name}:{decision}")
        if decision in BLOCKING_DECISIONS:
            blocking += 1
        else:
            allowing += 1  # _rail_decision has already required explicit allow.
    return {
        "observed_action": "block" if blocking else "allow",
        "blocking_rails_count": blocking,
        "allowing_rails_count": allowing,
        "rails_triggered": triggered,
        "total_activated_rails": blocking + allowing,
    }


def invert_aggregate_outcome(turn: Dict[str, Any]) -> Dict[str, Any]:
    """Flip the observed aggregate in a copy, potentially changing many rails."""
    original = recount_turn(turn)
    if original is None:
        raise ValueError("CONTROL_NEEDS_OBSERVED_TRACE")
    mutated = copy.deepcopy(turn)
    rails = mutated["activated_rails"]
    if original["observed_action"] == "block":
        for rail in rails:
            if _action(_rail_decision(rail)) == "block":
                rail["decision"] = "allow"
                rail.pop("status", None)
    else:
        rails[0]["decision"] = "block"
        rails[0].pop("status", None)
    return mutated


def flip_one_rail(turn: Dict[str, Any]) -> Dict[str, Any]:
    """Legacy API alias; the aggregate reversal may change multiple rails."""
    return invert_aggregate_outcome(turn)


def _decode(raw: bytes) -> Dict[str, Any]:
    if not isinstance(raw, bytes) or len(raw) > MAX_TRACE_BYTES:
        raise ValueError("TRACE_BYTES_OUT_OF_BOUNDS")
    def pairs(items):
        result = {}
        for key, value in items:
            if key in result:
                raise ValueError("DUPLICATE_JSON_KEY")
            result[key] = value
        return result
    def reject_constant(_):
        raise ValueError("NONFINITE_JSON_NUMBER")
    def finite_float(value):
        number = float(value)
        if not math.isfinite(number):
            raise ValueError("NONFINITE_JSON_NUMBER")
        return number
    try:
        doc = json.loads(raw.decode("utf-8"), object_pairs_hook=pairs,
                         parse_constant=reject_constant, parse_float=finite_float)
    except RecursionError as exc:
        raise ValueError("TRACE_NESTING_OUT_OF_BOUNDS") from exc
    if not isinstance(doc, dict) or not isinstance(doc.get("turns"), list):
        raise ValueError("NORMALISED_TURNS_LIST_REQUIRED")
    if len(doc["turns"]) > MAX_TURNS or any(not isinstance(t, dict) for t in doc["turns"]):
        raise ValueError("INVALID_TURNS_LIST")
    return doc


def ingest(
    raw: bytes,
    *,
    read_at: str,
    subject: str = "urn:csoai:nemo-guardrails-run",
    source_url: Optional[str] = None,
) -> List[Dict[str, Any]]:
    doc = _decode(raw)
    if not isinstance(read_at, str):
        raise ValueError("READ_AT_TIMESTAMP_REQUIRED")
    timestamp = datetime.fromisoformat(read_at.replace("Z", "+00:00"))
    if timestamp.tzinfo is None or timestamp.utcoffset() is None:
        raise ValueError("READ_AT_OFFSET_REQUIRED")
    sha = hashlib.sha256(raw).hexdigest()
    ver = _text(doc.get("nemo_guardrails_version", doc.get("version")),
                "NOT_REPORTED", "source_version")
    model_id = _text(doc.get("model", doc.get("target_model")),
                     "unspecified-model", "model")
    out: List[Dict[str, Any]] = []
    seen = set()

    for idx, turn in enumerate(doc["turns"]):
        turn_id = _text(turn.get("turn_id"), f"turn-{idx + 1}", "turn_id")
        if turn_id in seen:
            raise ValueError("DUPLICATE_TURN_ID")
        seen.add(turn_id)
        expected_action = _action(turn.get("expected_action"))
        declared_rails = turn.get("declared_rails")
        if declared_rails is not None and (
            not isinstance(declared_rails, list) or
            any(not isinstance(name, str) or not name or len(name) > 256 for name in declared_rails)
        ):
            raise ValueError("INVALID_DECLARED_RAILS")
        declared = {
            "turn_id": turn_id,
            "expected_action": expected_action,
            "declared_rails": copy.deepcopy(declared_rails) if declared_rails is not None else [],
            "rail_type": _text(turn.get("rail_type"), "input_output", "rail_type"),
            "source_nemo_guardrails_version": None if ver == "NOT_REPORTED" else ver,
        }
        reason = None
        try:
            recounted = recount_turn(turn)
        except ValueError as exc:
            recounted = None
            reason = str(exc)
        nc = {"id": CONTROL_ID, "expected": None, "got": "NOT_RUN"}
        if reason is not None or recounted is None:
            observed: Dict[str, Any] = {
                "observed_action": None,
                "activated_rails": None,
                "recount_matches_declared": None,
                "reason_code": reason or "NO_ACTIVATED_RAIL_TRACE",
            }
            state = "UNCHECKABLE" if reason else "UNMEASURED"
        elif expected_action is None:
            observed = {**recounted, "recount_matches_declared": None,
                        "reason_code": "EXPECTED_ACTION_NOT_ESTABLISHED"}
            state = "UNCHECKABLE"
        else:
            matches = recounted["observed_action"] == expected_action
            ctl_recount = recount_turn(invert_aggregate_outcome(turn))
            ctl_discriminates = (
                ctl_recount is not None and
                ctl_recount["observed_action"] != recounted["observed_action"]
            )
            ctl_relation = None if ctl_recount is None else (
                "CONSISTENT" if ctl_recount["observed_action"] == expected_action else "DIVERGENT"
            )
            if not ctl_discriminates:
                state = "NOT_DISCRIMINATING"
                nc = {"id": CONTROL_ID, "expected": None, "got": ctl_relation or "NOT_RUN"}
            else:
                state = "CONSISTENT" if matches else "DIVERGENT"
                nc = {"id": CONTROL_ID,
                      "expected": "DIVERGENT" if matches else "CONSISTENT",
                      "got": ctl_relation}
            observed = {**recounted, "recount_matches_declared": matches}

        out.append(E.build(
            subject={"kind": "model_run", "locator": f"{subject}#{turn_id}",
                     "declared_by": f"source-reported nemo-guardrails {ver} config sha256:{sha}"},
            claim={"text": f"Normalised rail trace turn {turn_id} on {model_id}: "
                           f"expected_action={expected_action}; observed_action={observed.get('observed_action')}.",
                   "source_url": source_url, "source_sha256": sha, "read_at": read_at},
            method={"id": "nemo-guardrails-rail-recount", "version": METHOD_VERSION,
                    "code_sha256": None, "holder": "csoai"},
            declared=declared, observed=observed, state=state, value=None,
            negative_control=nc,
            limits=[
                "Consumes Council-normalised turns, not arbitrary native NeMo SDK output; the native-to-normalised mapping needs separate qualification.",
                "The control changes an aggregate decision in a copied trace. It does not rerun NeMo rails, authenticate a source or verify model numerical health.",
                "Rail observations do not establish executed effects, human authority, model safety or certification.",
            ],
        ))
    return out


def main(argv: Optional[List[str]] = None) -> None:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("trace")
    ap.add_argument("--read-at", required=True)
    ap.add_argument("--subject", default="urn:csoai:nemo-guardrails-run")
    ap.add_argument("--source-url")
    a = ap.parse_args(argv)
    with open(a.trace, "rb") as f:
        raw = f.read(MAX_TRACE_BYTES + 1)
    events = ingest(raw, read_at=a.read_at, subject=a.subject, source_url=a.source_url)
    # Finish validation before emitting any line; late malformed turns do not
    # leave a partly emitted successful import on stdout.
    for ev in events:
        sys.stdout.write(json.dumps(ev, ensure_ascii=False, sort_keys=True, allow_nan=False) + "\n")


if __name__ == "__main__":
    main()
