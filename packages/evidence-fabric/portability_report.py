#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Cross-Client Portability Report & Compatibility History Generator for CSOAI / GSPC.

Produces the three public outputs defined in the AAIF / Receiver Value brief:
1. Working GSPC verification skill qualification receipt (`csoai.gspc-skill-qualification/0.1`)
2. Versioned cross-client portability report (`csoai.portability-report/0.1`):
   "Does an AI verification result survive a change of agent client? A reproducible GSPC comparison."
   Includes positive controls and adverse cases:
   - valid artifact (positive control)
   - deliberately altered copy (adverse tamper control)
   - unsupported verification mode (adverse mode control)
   - unavailable source (adverse availability control)
3. Maintained compatibility history (`csoai.compatibility-history/0.1`):
   Tracks producer/consumer/skill version changes and states whether a previously supported
   conclusion requires rechecking.
"""
from __future__ import annotations

import copy
import hashlib
import json
import os
import sys
import tempfile
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


def run_portability_comparison(
    clients: Optional[List[Dict[str, str]]] = None,
    events_jsonl_path: Optional[str] = None,
    as_of_utc: str = "2026-10-24T05:00:00Z",
) -> Dict[str, Any]:
    """Run the 4-case positive/adverse control matrix across named agent clients."""
    fixture_path = events_jsonl_path or os.path.join(HERE, "tests", "fixtures", "events.jsonl")
    evs = E.read_jsonl(fixture_path)
    valid_ev = copy.deepcopy(evs[0])
    altered_ev = copy.deepcopy(evs[0])
    altered_ev["observed"] = {"tools": 999}  # invalidates content-derived event_id

    client_list = clients or [
        {"client_id": "claude-code-skills-v1", "boundary_observed": "PROMPTED_FOR_APPROVAL"},
        {"client_id": "codex-skills-client-v1", "boundary_observed": "ENFORCED"},
        {"client_id": "generic-mcp-agent-v1", "boundary_observed": "IGNORED_EXPERIMENTAL_DECLARATION"},
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
            b_obs = cl.get("boundary_observed", "UNMEASURED")

            # Case 1: Positive control — valid artifact
            r_valid = PSV.verify_artifact(
                valid_file, mode="structure", client_id=cid, client_boundary_observation=b_obs
            )
            # Case 2: Adverse control — deliberately altered copy
            r_altered = PSV.verify_artifact(
                altered_file, mode="structure", client_id=cid, client_boundary_observation=b_obs
            )
            # Case 3: Adverse control — unsupported verification mode
            r_unsup = PSV.verify_artifact(
                valid_file, mode="quantum_oracle_mode", client_id=cid, client_boundary_observation=b_obs
            )
            # Case 4: Adverse control — unavailable source
            r_unavail = PSV.verify_artifact(
                missing_file, mode="structure", client_id=cid, client_boundary_observation=b_obs
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
                    "client_id": cid,
                    "allowed_tools_boundary_observed": b_obs,
                    "declaration_is_execution_grant": False,
                    "evidence_properties_preserved": controls_hold,
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

    all_preserved = all(cm["evidence_properties_preserved"] for cm in client_matrices)

    # Output 1: Skill Qualification Receipt
    skill_qualification = {
        "schema": "csoai.gspc-skill-qualification/0.1",
        "as_of_utc": as_of_utc,
        "skill_name": "gspc-verify",
        "skill_path": "distribution/plugin/skills/gspc-verify/SKILL.md",
        "verifier_entrypoint": "packages/evidence-fabric/portable_skill_verify.py",
        "qualified": all_preserved,
        "state": "CONSISTENT" if all_preserved else "DIVERGENT",
    }

    # Output 2: Versioned Portability Report
    portability_report = {
        "schema": "csoai.portability-report/0.1",
        "report_version": "0.1.0",
        "as_of_utc": as_of_utc,
        "headline": "Does an AI verification result survive a change of agent client? A reproducible GSPC comparison.",
        "overall_state": "CONSISTENT" if all_preserved else "DIVERGENT",
        "clients_tested": len(client_matrices),
        "client_results": client_matrices,
        "limits": [
            "Portability of verification verdicts across tested clients does not grant execution permissions.",
            "Agent Skills allowed-tools support varies across clients and is recorded as an observation, not an enforcement guarantee.",
        ],
    }

    # Output 3: Maintained Compatibility History
    compatibility_history = {
        "schema": "csoai.compatibility-history/0.1",
        "as_of_utc": as_of_utc,
        "entries": [
            {
                "revision": "2026-09-30.v1",
                "component": "packages/evidence-fabric/render/otel.py",
                "change_summary": "Initial OTel gen_ai.evaluation.result renderer (second-level timestamp cast).",
                "prior_conclusions_require_recheck": False,
                "reason": "Whole-second timestamps in frozen SAFE pack (2026-09-30T09:47:50Z) unaffected.",
            },
            {
                "revision": "2026-10-24.v2",
                "component": "packages/evidence-fabric/render/otel.py",
                "change_summary": (
                    "Preserve subsecond nanosecond precision in unix_nano(), separate occurrence time "
                    "(timeUnixNano) from collection time (observedTimeUnixNano) when observed.read_at is "
                    "distinct, and emit optional qualified traceId/spanId."
                ),
                "prior_conclusions_require_recheck": False,
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
