#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""OpenSandbox Execution Boundary Recorder for CSOAI / GSPC.

Records and evaluates the concrete runtime configuration and observed execution controls for
an authorized evaluation run (`image_digest`, `runtime_class`, `declared_network_policy`,
`declared_filesystem_policy`, `observed_events`, `output_artifact_sha256`).

Answers the scoped assessment question:
"Under this specific configuration, did the authorised task stay within its declared execution
boundaries and produce the expected evidence?"

Refuses blanket safety claims ("OpenSandbox is safe", "this company's agents are secure", "certified").
"""
from __future__ import annotations

import hashlib
import json
from typing import Any, Dict, List, Optional

BANNED_BLANKET_CLAIMS = (
    "opensandbox is safe",
    "agents are secure",
    "certified",
    "guaranteed safe",
    "compliant",
)


def evaluate_sandbox_boundary(
    task_id: str,
    configuration: Dict[str, Any],
    observed_execution: Dict[str, Any],
    claimed_summary: str = "",
) -> Dict[str, Any]:
    """Evaluate whether an authorized task stayed within its declared execution boundaries."""
    lowered = (claimed_summary or "").lower()
    for banned in BANNED_BLANKET_CLAIMS:
        if banned in lowered:
            raise ValueError(f"refused blanket security claim in summary: {banned!r}")

    image_digest = configuration.get("image_digest")
    runtime_class = configuration.get("runtime_class")  # e.g. "gvisor", "kata", "runc-default"
    declared_net = configuration.get("network_policy")  # e.g. "none", "allowlist"
    declared_fs = configuration.get("filesystem_policy")  # e.g. "read_only_root_with_scratch"
    expected_out_sha = configuration.get("expected_output_sha256")

    if not (image_digest and runtime_class and declared_net and declared_fs):
        return {
            "schema": "csoai.opensandbox-boundary-receipt/0.1",
            "task_id": task_id,
            "assessment_question": (
                "Under this specific configuration, did the authorised task stay within its "
                "declared execution boundaries and produce the expected evidence?"
            ),
            "state": "UNCHECKABLE",
            "reason": "incomplete runtime configuration (image_digest, runtime_class, network_policy, filesystem_policy required)",
            "blanket_runtime_safety_claimed": False,
        }

    if observed_execution.get("telemetry_available") is False:
        return {
            "schema": "csoai.opensandbox-boundary-receipt/0.1",
            "task_id": task_id,
            "assessment_question": (
                "Under this specific configuration, did the authorised task stay within its "
                "declared execution boundaries and produce the expected evidence?"
            ),
            "state": "UNMEASURED",
            "reason": "runtime boundary telemetry was not captured during execution",
            "configuration": configuration,
            "blanket_runtime_safety_claimed": False,
        }

    violations: List[str] = []
    obs_net_egress = observed_execution.get("network_egress_attempts") or []
    if declared_net == "none" and len(obs_net_egress) > 0:
        violations.append(f"declared network_policy='none' but observed {len(obs_net_egress)} egress attempt(s)")

    obs_fs_writes = observed_execution.get("outside_scratch_writes") or []
    if declared_fs == "read_only_root_with_scratch" and len(obs_fs_writes) > 0:
        violations.append(f"observed {len(obs_fs_writes)} write(s) outside declared scratch boundary")

    actual_out_sha = observed_execution.get("output_artifact_sha256")
    if expected_out_sha and actual_out_sha != expected_out_sha:
        violations.append(f"output_artifact_sha256 mismatch: expected {expected_out_sha}, got {actual_out_sha}")

    state = "CONSISTENT" if not violations else "DIVERGENT"
    body = {
        "schema": "csoai.opensandbox-boundary-receipt/0.1",
        "task_id": task_id,
        "assessment_question": (
            "Under this specific configuration, did the authorised task stay within its "
            "declared execution boundaries and produce the expected evidence?"
        ),
        "state": state,
        "configuration": {
            "image_digest": image_digest,
            "runtime_class": runtime_class,
            "network_policy": declared_net,
            "filesystem_policy": declared_fs,
            "ordinary_container_distinguished_from_isolated_runtime": runtime_class != "runc-default",
        },
        "observed": {
            "network_egress_attempts": obs_net_egress,
            "outside_scratch_writes": obs_fs_writes,
            "output_artifact_sha256": actual_out_sha,
            "execution_events_count": len(observed_execution.get("events") or []),
        },
        "violations": violations,
        "blanket_runtime_safety_claimed": False,
        "limits": [
            "Scoped to this single configuration and run; project or runtime name alone does not establish security."
        ],
    }
    raw = json.dumps(body, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    body["receipt_sha256"] = hashlib.sha256(raw).hexdigest()
    return body
