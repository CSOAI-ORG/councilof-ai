#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Local fixture/profile simulation for the existing CSOAI portability outputs.

Every profile uses the same local verifier and envelope functions. This program
does not launch an agent client or observe its permissions. The four controls
(valid artifact, altered copy, unsupported mode, unavailable source) qualify
only this local fixture run, never host compatibility or an execution boundary.
Existing schema identifiers and evidence-event/supersedes contracts are retained.
"""
from __future__ import annotations

import copy
import hashlib
import json
import os
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import event as E  # noqa: E402
import open_responses_survival as ORS  # noqa: E402
import portable_skill_verify as PSV  # noqa: E402


def _canon_sha256(obj: Any) -> str:
    raw = json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def _now_utc() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def run_portability_comparison(
    clients: Optional[List[Dict[str, Any]]] = None,
    events_jsonl_path: Optional[str] = None,
    as_of_utc: Optional[str] = None,
) -> Dict[str, Any]:
    """Run four local controls under profile labels; no actual client is tested.

    The clients argument is retained for fixture profiles. Its ids, permission
    strings and other supplied claims are declarations only; no profile field
    is accepted as a host execution or boundary receipt. A supplied as_of_utc
    is a declared fixture timestamp, never a client observation.
    """
    fixture_path = events_jsonl_path or os.path.join(HERE, "tests", "fixtures", "events.jsonl")
    evs = E.read_jsonl(fixture_path)
    valid_ev = copy.deepcopy(evs[0])
    altered_ev = copy.deepcopy(evs[0])
    altered_ev["observed"] = {"tools": 999}  # invalidates content-derived event_id

    client_list = clients if clients is not None else [
        {"client_id": "claude-code-skills-v1"},
        {"client_id": "codex-skills-client-v1"},
        {"client_id": "generic-mcp-agent-v1"},
    ]

    with tempfile.TemporaryDirectory() as tmpdir:
        valid_file = os.path.join(tmpdir, "valid_event.json")
        altered_file = os.path.join(tmpdir, "altered_event.json")
        missing_file = os.path.join(tmpdir, "does_not_exist.json")
        Path(valid_file).write_text(json.dumps(valid_ev, sort_keys=True), encoding="utf-8")
        Path(altered_file).write_text(json.dumps(altered_ev, sort_keys=True), encoding="utf-8")

        client_matrices: List[Dict[str, Any]] = []
        for cl in client_list:
            cid = cl["client_id"]
            # Preserve a caller label only as a declaration. These controls do
            # not observe any host or enforce its experimental tool declaration.
            declared_boundary = cl.get("boundary_observed")

            # Case 1: Positive control — valid artifact
            r_valid = PSV.verify_artifact(
                valid_file, mode="structure", client_id="local-fixture-runner", client_boundary_observation="UNMEASURED"
            )
            # Case 2: Adverse control — deliberately altered copy
            r_altered = PSV.verify_artifact(
                altered_file, mode="structure", client_id="local-fixture-runner", client_boundary_observation="UNMEASURED"
            )
            # Case 3: Adverse control — unsupported verification mode
            r_unsup = PSV.verify_artifact(
                valid_file, mode="quantum_oracle_mode", client_id="local-fixture-runner", client_boundary_observation="UNMEASURED"
            )
            # Case 4: Adverse control — unavailable source
            r_unavail = PSV.verify_artifact(
                missing_file, mode="structure", client_id="local-fixture-runner", client_boundary_observation="UNMEASURED"
            )

            # Open Responses round-trip check for valid_ev and unmeasured evs[3]
            or_valid = ORS.verify_open_response_survival(
                valid_ev, ORS.event_to_open_response(valid_ev, provider=cid)
            )
            or_unmeasured = ORS.verify_open_response_survival(
                evs[3], ORS.event_to_open_response(evs[3], provider=cid)
            )

            controls_hold = (
                r_valid["verdict_state"] == "STRUCTURE_VALID"
                and r_valid["preserved_states"] == ["CONSISTENT"]
                and r_valid["preserved_limits"] == valid_ev["limits"]
                and r_altered["verdict_state"] == "INVALID"
                and r_unsup["verdict_state"] == "UNCHECKABLE"
                and r_unavail["verdict_state"] == "UNCHECKABLE"
                and or_valid["verdict"] == "CONSISTENT"
                and or_unmeasured["verdict"] == "CONSISTENT"
            )

            client_matrices.append(
                {
                    "fixture_profile_id": cid,
                    "execution_scope": "LOCAL_FIXTURE_SIMULATION",
                    "declared_boundary_observation": declared_boundary,
                    "client_execution_state": "UNMEASURED",
                    "client_execution_receipt": None,
                    "allowed_tools_boundary_observed": None,
                    "allowed_tools_boundary_receipt": None,
                    "declaration_is_execution_grant": False,
                    "local_evidence_properties_preserved": controls_hold,
                    "controls": {
                        "positive_valid_artifact": {
                            "expected": "STRUCTURE_VALID",
                            "got": r_valid["verdict_state"],
                            "artifact_sha256": r_valid["artifact"]["sha256"],
                            "preserved_limits": r_valid["preserved_limits"],
                        },
                        "adverse_altered_copy": {
                            "expected": "INVALID",
                            "got": r_altered["verdict_state"],
                        },
                        "adverse_unsupported_mode": {
                            "expected": "UNCHECKABLE",
                            "got": r_unsup["verdict_state"],
                        },
                        "adverse_unavailable_source": {
                            "expected": "UNCHECKABLE",
                            "got": r_unavail["verdict_state"],
                        },
                        "open_responses_survival": {
                            "consistent_event": or_valid["verdict"],
                            "unmeasured_event": or_unmeasured["verdict"],
                        },
                    },
                }
            )

    all_preserved = all(cm["local_evidence_properties_preserved"] for cm in client_matrices)
    fixture_state = (
        "UNMEASURED" if not client_matrices
        else "CONSISTENT" if all_preserved else "DIVERGENT"
    )
    # The clock identifies completion of this local run. No observed client
    # timestamp is available; a supplied fixture date cannot manufacture it.
    timestamp_scope = {
        "as_of_utc": None,
        "generated_at_utc": _now_utc(),
        "declared_fixture_as_of_utc": as_of_utc,
        "execution_scope": "LOCAL_FIXTURE_SIMULATION",
    }

    # Output 1: Skill Qualification Receipt
    skill_qualification = {
        "schema": "csoai.gspc-skill-qualification/0.1",
        **timestamp_scope,
        "skill_name": "gspc-verify",
        "skill_path": "distribution/plugin/skills/gspc-verify/SKILL.md",
        "verifier_entrypoint": "packages/evidence-fabric/portable_skill_verify.py",
        "qualified": None,
        "state": "UNMEASURED",
        "local_fixture_state": fixture_state,
        "client_execution_receipt": None,
        "limits": ["Local fixture controls do not qualify a host client or its permission boundary."],
    }

    # Output 2: Versioned Portability Report
    portability_report = {
        "schema": "csoai.portability-report/0.1",
        "report_version": "0.1.0",
        **timestamp_scope,
        "headline": "Local fixture/profile simulation; actual cross-client execution is UNMEASURED.",
        "overall_state": "UNMEASURED",
        "clients_tested": None,
        "client_results": None,
        "local_fixture_state": fixture_state,
        "fixture_profiles_tested": len(client_matrices),
        "fixture_profile_results": client_matrices,
        "limits": [
            "Profiles repeat the same local verifier and envelope functions; no agent client is launched.",
            "Profile ids and permission/approval labels are declarations, not observed execution evidence.",
            "Actual client execution, tool-boundary observations and their receipts are unavailable.",
            "Passing local controls do not grant permissions or close an unrelated retained finding.",
        ],
    }

    # Output 3: Maintained Compatibility History
    compatibility_history = {
        "schema": "csoai.compatibility-history/0.1",
        **timestamp_scope,
        "client_retest_state": "UNMEASURED",
        "client_retest_receipt": None,
        "entries": [
            {
                "revision": "2026-09-30.v1",
                "component": "packages/evidence-fabric/render/otel.py",
                "change_summary": "Initial OTel gen_ai.evaluation.result renderer (second-level timestamp cast).",
                "prior_conclusions_require_recheck": None,
                "reason": (
                    "Frozen whole-second fixture timestamps are unaffected; "
                    "no downstream client recheck receipt is retained."
                ),
            },
            {
                "revision": "2026-10-24.v2",
                "component": "packages/evidence-fabric/render/otel.py",
                "change_summary": (
                    "Preserve subsecond nanosecond precision in unix_nano(), separate occurrence time "
                    "(timeUnixNano) from collection time (observedTimeUnixNano) when observed.read_at is "
                    "distinct, and emit optional qualified traceId/spanId."
                ),
                "prior_conclusions_require_recheck": None,
                "subsecond_ordering_recheck_needed_if": (
                    "Only if a downstream consumer relied on subsecond ordering across distinct events "
                    "recorded within the same second under the v1 integer-second cast."
                ),
            },
        ],
    }

    bundle = {
        "skill_qualification": skill_qualification,
        "portability_report": portability_report,
        "compatibility_history": compatibility_history,
    }
    bundle["bundle_sha256"] = _canon_sha256(bundle)
    return bundle


if __name__ == "__main__":
    sys.stdout.write(json.dumps(run_portability_comparison(), ensure_ascii=False, sort_keys=True, indent=2) + "\n")
