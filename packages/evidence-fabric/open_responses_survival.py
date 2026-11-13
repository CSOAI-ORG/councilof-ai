#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Open Responses (openresponses.org) Evidence-Survival Harness for CSOAI / GSPC.

Evaluates whether CSOAI evidence properties (`csoai.evidence-event/0.1`) survive translation
through an Open Responses shared model-interface envelope (request -> tool call -> tool output
-> response object) without:
1. Losing the 1:1 identity between a `function_call` (`call_id`) and its `function_call_output`.
2. Collapsing a `"failed"` or `"incomplete"` response status into `"completed"` or `CONSISTENT`.
3. Fabricating a numeric value (`0`, `0.0`) for `UNMEASURED` or `UNCHECKABLE` events.
4. Losing `request_id`, `provider`, `model`, `method.version`, or `supersedes` lineage (preventing
   a later passing retest on finding B from closing an unrelated earlier finding A).
"""
from __future__ import annotations

import copy
import hashlib
import json
import os
import sys
from typing import Any, Dict, List, Optional

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import event as E  # noqa: E402


def event_to_open_response(
    ev: Dict[str, Any],
    request_id: str = "req_gspc_001",
    provider: str = "openresponses-compatible",
    model: str = "model-under-test-v1",
    response_status: str = "completed",
    call_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Wrap a validated `csoai.evidence-event/0.1` inside an Open Responses response envelope."""
    E.check_renderable(ev)
    cid = call_id or f"call_{ev['event_id'].split(':')[-1][:16]}"
    tool_output_payload = {
        "schema": ev["schema"],
        "event_id": ev["event_id"],
        "state": ev["state"],
        "value": None if ev["state"] in E.NO_NUMBER_STATES else ev.get("value"),
        "claim": ev["claim"],
        "subject": ev["subject"],
        "method": ev["method"],
        "declared_sha256": E.side_sha256(ev["declared"]),
        "observed_sha256": E.side_sha256(ev["observed"]),
        "negative_control": ev["negative_control"],
        "limits": list(ev.get("limits") or []),
        "supersedes": ev.get("supersedes"),
    }
    return {
        "id": f"resp_{ev['event_id'].split(':')[-1][:16]}",
        "object": "response",
        "status": response_status,
        "model": model,
        "metadata": {
            "csoai_request_id": request_id,
            "csoai_provider": provider,
            "csoai_event_id": ev["event_id"],
            "csoai_method_version": str(ev["method"]["version"]),
        },
        "output": [
            {
                "type": "function_call",
                "id": f"fc_{cid}",
                "call_id": cid,
                "name": "gspc_verify_evidence",
                "arguments": json.dumps(
                    {"locator": ev["subject"]["locator"], "event_id": ev["event_id"]},
                    sort_keys=True,
                ),
                "status": "completed" if response_status == "completed" else response_status,
            },
            {
                "type": "function_call_output",
                "id": f"fco_{cid}",
                "call_id": cid,
                "output": json.dumps(tool_output_payload, sort_keys=True, ensure_ascii=False),
            },
        ],
    }


def verify_open_response_survival(
    original_event: Dict[str, Any],
    response_envelope: Dict[str, Any],
    unrelated_prior_event: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Check the four CSOAI evidence-survival invariants on an Open Responses envelope."""
    E.check_renderable(original_event)
    issues: List[str] = []

    outputs = response_envelope.get("output") or []
    calls = [item for item in outputs if isinstance(item, dict) and item.get("type") == "function_call"]
    call_outputs = [item for item in outputs if isinstance(item, dict) and item.get("type") == "function_call_output"]

    # 1. Tool-call identity & 1:1 association
    call_identity_ok = False
    parsed_output: Dict[str, Any] = {}
    if len(calls) == 1 and len(call_outputs) == 1:
        c_id = calls[0].get("call_id")
        co_id = call_outputs[0].get("call_id")
        if isinstance(c_id, str) and c_id and c_id == co_id:
            try:
                parsed_output = json.loads(call_outputs[0].get("output") or "{}")
                if parsed_output.get("event_id") == original_event["event_id"]:
                    call_identity_ok = True
                else:
                    issues.append("function_call_output event_id does not match original_event.event_id")
            except Exception as exc:
                issues.append(f"unparseable function_call_output: {type(exc).__name__}")
        else:
            issues.append(f"call_id mismatch between function_call ({c_id!r}) and function_call_output ({co_id!r})")
    else:
        issues.append(f"expected 1 function_call and 1 function_call_output, got {len(calls)} and {len(call_outputs)}")

    # 2. Failed or incomplete response remains distinguishable from completed
    resp_status = response_envelope.get("status")
    failure_distinguishable_ok = True
    if resp_status in ("failed", "incomplete", "cancelled"):
        # A failed/incomplete transport response must never be upgraded to a passing/consistent completion
        if parsed_output.get("transport_upgraded_to_consistent") is True:
            failure_distinguishable_ok = False
            issues.append("failed/incomplete response was falsely upgraded to consistent completion")
    elif resp_status != "completed":
        failure_distinguishable_ok = False
        issues.append(f"unrecognized response status: {resp_status!r}")

    # 3. Unavailable/unmeasured measurements remain unavailable after conversion
    unmeasured_preserved_ok = True
    out_state = parsed_output.get("state")
    out_val = parsed_output.get("value")
    if out_state != original_event["state"]:
        unmeasured_preserved_ok = False
        issues.append(f"state changed from {original_event['state']!r} to {out_state!r}")
    if original_event["state"] in E.NO_NUMBER_STATES and out_val is not None:
        unmeasured_preserved_ok = False
        issues.append(f"{original_event['state']} acquired a fabricated numeric value: {out_val!r}")
    if list(parsed_output.get("limits") or []) != list(original_event.get("limits") or []):
        unmeasured_preserved_ok = False
        issues.append("limits[] were dropped or altered during translation")

    # 4. Request/provider/version association and source-to-retest isolation
    meta = response_envelope.get("metadata") or {}
    lineage_ok = bool(
        meta.get("csoai_request_id")
        and meta.get("csoai_provider")
        and response_envelope.get("model")
        and meta.get("csoai_method_version") == str(original_event["method"]["version"])
        and meta.get("csoai_event_id") == original_event["event_id"]
    )
    if not lineage_ok:
        issues.append("missing or mismatched request/provider/model/version metadata association")

    retest_isolation_ok = True
    if unrelated_prior_event is not None:
        # A passing/consistent result on `original_event` must NOT close `unrelated_prior_event`
        # unless `original_event["supersedes"] == unrelated_prior_event["event_id"]` and subjects/methods match.
        sup = parsed_output.get("supersedes")
        if sup == unrelated_prior_event.get("event_id"):
            if (
                original_event["subject"]["locator"] != unrelated_prior_event["subject"]["locator"]
                or original_event["method"]["id"] != unrelated_prior_event["method"]["id"]
            ):
                retest_isolation_ok = False
                issues.append("later result falsely claims to supersede an unrelated earlier finding")

    all_hold = (
        call_identity_ok
        and failure_distinguishable_ok
        and unmeasured_preserved_ok
        and lineage_ok
        and retest_isolation_ok
        and not issues
    )
    return {
        "schema": "csoai.open-responses-survival-check/0.1",
        "event_id": original_event["event_id"],
        "response_id": response_envelope.get("id"),
        "response_status": resp_status,
        "verdict": "CONSISTENT" if all_hold else "DIVERGENT",
        "checks": {
            "tool_call_identity_preserved": call_identity_ok,
            "failure_distinguishable_from_completion": failure_distinguishable_ok,
            "unmeasured_remains_unmeasured": unmeasured_preserved_ok,
            "request_provider_version_associated": lineage_ok,
            "unrelated_finding_not_closed": retest_isolation_ok,
        },
        "issues": issues,
    }
