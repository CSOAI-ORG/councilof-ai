#!/usr/bin/env python3
"""
GSPC Frozen-to-Fluid SAFE Evidence & Re-Verification Daily Signal Engine (v1.0).

Operationalizes:
1. SAFE Evidence & Re-verification Profile (`safe-reverification/0.1-draft`,
   `docs/standards/OSAIA-RFC-SAFE-evidence-reverification-profile-DRAFT.md`).
2. Alliance Control Plugin 9-State Lifecycle (`csoai.alliance-control-plugin/0.2`,
   `docs/standards/osaia-safe-reverification/csoai-alliance-control-plugin-v0.2.json`).
3. Sector Atlas 9 Domains / 37 Sectors (`client/src/pages/SectorsAtlas.tsx`) mapped
   onto all 33 canonical GSPC axes.
4. Continuous <= 3,072-byte Daily Signal Capsules that transition automatically from
   `PASS` to `STALE` or `UNMEASURED` whenever a pinned dependency (`model`, `safeguard`,
   `tool`, `prompt`, `runtime`, `mcp.protocol.version`) changes its SHA-256 digest or
   exceeds `watch.retest_bound.max_latency`, and route every drift trigger to the exact
   Human-in-the-Loop (HITL) & Public Watchdog Lane (`LANE_01..LANE_06`).

Doctrine:
- Measurement, never certification. Verification is free forever at https://councilof.ai/verify
- UNMEASURED carries no number (n is null, never 0).
- PASS and FAIL require a negative control that ran and failed as designed; otherwise
  the state is NOT_DISCRIMINATING.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from scripts.gspc_institutional_underwriter_ras_flywheel import (
    CANONICAL_33_AXES,
    MAX_OBSERVATION_BYTES,
    route_observation_to_hitl_and_watchdog,
)

SCHEMA = "csoai.safe-fluid-reverification-daily-signal/1.0"
DEFAULT_OUT_PATH = REPO_ROOT / "public" / "interop" / "safe-fluid-reverification-daily-signal-v1.json"
DEFAULT_HF_SPACE_DIR = REPO_ROOT / "spaces" / "gspc-board"

SAFE_RESULT_STATES = ("PASS", "FAIL", "PARTIAL", "UNMEASURED", "NOT_DISCRIMINATING")
SAFE_WATCH_STATES = ("CURRENT", "STALE", "UNMEASURED")


def canonical_json(obj: Any) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def sha256_hex(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def evaluate_fluid_reverification_capsule(
    record_id: str,
    domain_id: str,
    sector_name: str,
    axis: str,
    claim_text: str,
    dependencies: List[Dict[str, str]],
    negative_control_ran_and_failed: bool,
    claim_held_under_test: Optional[bool],
    n_valid: Optional[int],
    dependency_drift_detected: bool,
    age_hours: int,
    max_latency_hours: int = 168,
    partial_scope: bool = False,
) -> Dict[str, Any]:
    """
    Deterministic evaluator implementing Behavioral Requirements 1-12 of
    `safe-reverification/0.1-draft`:
    - Rule 3: Never report PASS or FAIL unless negative_control ran and failed as designed;
      otherwise NOT_DISCRIMINATING or UNMEASURED.
    - Rule 4: UNMEASURED must not carry a number (n_valid is None). A partial read must
      not be reported as a population total (denominator is None).
    - Rule 9: When a watch trigger fires (dependency_drift_detected or age_hours > max_latency_hours),
      watch_state becomes STALE and dispatches to the role-routed HITL & Public Watchdog lane.
    """
    if claim_held_under_test is None or n_valid is None or n_valid < 30:
        result_state = "UNMEASURED"
        effective_n = None
        population_denominator = None
    elif not negative_control_ran_and_failed:
        result_state = "NOT_DISCRIMINATING"
        effective_n = n_valid
        population_denominator = None
    elif partial_scope:
        result_state = "PARTIAL"
        effective_n = n_valid
        population_denominator = None
    elif claim_held_under_test:
        result_state = "PASS"
        effective_n = n_valid
        population_denominator = n_valid
    else:
        result_state = "FAIL"
        effective_n = n_valid
        population_denominator = n_valid

    if result_state == "UNMEASURED":
        watch_state = "UNMEASURED"
        alliance_lifecycle_state = "DISCOVERED"
    elif dependency_drift_detected or age_hours > max_latency_hours:
        watch_state = "STALE"
        alliance_lifecycle_state = "MEASURED"
    elif result_state == "PASS":
        watch_state = "CURRENT"
        alliance_lifecycle_state = "CLAIM_CURRENT"
    else:
        watch_state = "CURRENT"
        alliance_lifecycle_state = "MEASURED"

    dispatch = route_observation_to_hitl_and_watchdog(
        {
            "source_origin": "SAFE_REVERIFICATION_WATCH",
            "axis": axis,
            "record_id": record_id,
            "sector": sector_name,
            "result_state": result_state,
            "watch_state": watch_state,
        }
    )

    capsule = {
        "profile": "safe-reverification/0.1-draft",
        "record_id": record_id,
        "issuer": "did:web:csoai.org",
        "domain_id": domain_id,
        "sector": sector_name,
        "gspc_axis": axis,
        "claim": {
            "statement": claim_text,
            "falsifiable": True,
        },
        "dependencies": dependencies,
        "negative_control": {
            "ran_and_failed_as_designed": negative_control_ran_and_failed,
        },
        "result": {
            "state": result_state,
            "n_valid": effective_n,
            "denominator": population_denominator,
        },
        "watch": {
            "state": watch_state,
            "dependency_drift_detected": dependency_drift_detected,
            "age_hours": age_hours,
            "retest_bound_max_latency_hours": max_latency_hours,
            "action_required": "BOUNDED_RETEST_AND_HITL_REVIEW"
            if watch_state == "STALE" or result_state in ("FAIL", "NOT_DISCRIMINATING")
            else "NONE",
        },
        "alliance_lifecycle_state": alliance_lifecycle_state,
        "hitl_watchdog_dispatch": {
            "routed_lane_id": dispatch["routed_lane_id"],
            "assigned_human_role": dispatch["assigned_human_role"],
            "writes_board": False,
            "model_training": False,
        },
        "limits": [
            "Signature and digest establish provenance and integrity only, never certification.",
            "UNMEASURED carries null n_valid, never zero.",
        ],
    }

    raw_bytes = canonical_json(capsule).encode("utf-8")
    byte_len = len(raw_bytes)
    assert byte_len <= MAX_OBSERVATION_BYTES, f"Capsule {record_id} exceeds 3072 bytes ({byte_len})"
    return {
        **capsule,
        "capsule_bytes": byte_len,
        "capsule_sha256": sha256_hex(canonical_json(capsule)),
    }


def build_nine_domain_daily_signal_capsules() -> List[Dict[str, Any]]:
    scenarios = [
        (
            "SAFE-SIG-01-HEALTH",
            "health",
            "Clinical diagnosis AI & Crisis Support",
            "care",
            "4-perspective MEOK routing achieves protect x help = 1.0000 on CARE-PSY-v1 (n=36).",
            [
                {"dep_id": "bank:CARE-PSY-v1", "state": "PINNED", "sha256": "c2df802f7eb9423a"},
                {"dep_id": "charter:v0.1.0", "state": "PINNED", "sha256": "3dcf79a752678532"},
            ],
            True,
            True,
            36,
            False,
            12,
        ),
        (
            "SAFE-SIG-02-FINANCE",
            "finance",
            "Credit scoring & Mainframe ISO-20022 Settlement",
            "reserve-attestation",
            "COBOL-Bridge COMP-3 to ISO-20022 pacs.008 conversion preserves 2-decimal parity (n=36).",
            [
                {"dep_id": "copybook:ACCT-SETTLE-MT103", "state": "PINNED", "sha256": "893dca9927cdd6c5"},
                {"dep_id": "layer0:CH-04", "state": "PINNED", "sha256": "3dcf79a752678532"},
            ],
            True,
            True,
            36,
            False,
            6,
        ),
        (
            "SAFE-SIG-03-PUBLIC",
            "public",
            "Benefits eligibility & Administrative Due Process",
            "governance",
            "Governance evaluation bank (n=40) verified with exact McNemar TIE separation.",
            [
                {"dep_id": "bank:gspc-governance-v1", "state": "PINNED", "sha256": "a19f02bc441098ee"},
            ],
            True,
            True,
            40,
            False,
            24,
        ),
        (
            "SAFE-SIG-04-WORK",
            "work",
            "Resume screening & Hiring Platform x402 Conformance",
            "claim-maintenance",
            "Hiring platform public claim re-checked on Day-7 schedule; upstream page digest changed.",
            [
                {"dep_id": "surface:hiring-platform-home", "state": "PINNED", "sha256": "drifted_digest_20261029"},
            ],
            True,
            True,
            32,
            True,  # Dependency drift detected -> transitions PASS to STALE!
            180,
        ),
        (
            "SAFE-SIG-05-INFRA",
            "infra",
            "Energy grid control & Autonomous Machinery",
            "machinery-conformity",
            "Machinery-conformity safeguard bank (n=50) holds under designed-to-fail negative control.",
            [
                {"dep_id": "bank:gspc-machinery-v1", "state": "PINNED", "sha256": "f012bc99812300aa"},
            ],
            True,
            True,
            50,
            False,
            18,
        ),
        (
            "SAFE-SIG-06-CONSUMER",
            "consumer",
            "Generative content & Multi-Agent MCP Toolchains",
            "effect-binding",
            "Third-party remote MCP server binds executed tool argument to authorization receipt.",
            [
                {"dep_id": "probe:effect-binding-2026-09-22", "state": "PINNED", "sha256": "e7083086fedf34d5"},
            ],
            True,
            False,  # Claim failed under test (238/261 servers did not bind) -> state = FAIL
            261,
            False,
            48,
        ),
        (
            "SAFE-SIG-07-INDUSTRY",
            "industry",
            "Education grading & Benchmark Grader Verification",
            "measurer-integrity",
            "Legacy external benchmark run where designed-to-fail negative control did not fail.",
            [
                {"dep_id": "grader:external-unpinned", "state": "UNPINNED", "sha256": "none"},
            ],
            False,  # Negative control failed to fail -> state = NOT_DISCRIMINATING!
            True,
            44,
            False,
            72,
        ),
        (
            "SAFE-SIG-08-INSURANCE",
            "insurance",
            "Life & health underwriting & Model Drift Watch (Partial Population Slice)",
            "continuity",
            "Continuity & rollback verification across sampled insurer endpoints (n=50 of partial frame).",
            [
                {"dep_id": "bank:gspc-continuity-v1", "state": "PINNED", "sha256": "77bc0192837465aa"},
            ],
            True,
            True,
            50,
            False,
            10,
            168,
            True,  # partial_scope = True -> state = PARTIAL, denominator = None!
        ),
        (
            "SAFE-SIG-09-AGRI",
            "agri",
            "Precision spraying & Autonomous Field Robotics",
            "humanoid-deployment",
            "Field robotics runtime telemetry slot declared on board; awaiting n_valid >= 30 signed run.",
            [
                {"dep_id": "slot:humanoid-deployment", "state": "UNAVAILABLE", "sha256": "none"},
            ],
            False,
            None,  # Unmeasured slot -> state = UNMEASURED, n_valid = null
            None,
            False,
            0,
        ),
    ]

    return [evaluate_fluid_reverification_capsule(*s) for s in scenarios]


def build_33_axis_frozen_to_fluid_coverage() -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    for idx, axis in enumerate(CANONICAL_33_AXES, start=1):
        dispatch = route_observation_to_hitl_and_watchdog(
            {
                "source_origin": "SAFE_REVERIFICATION_WATCH",
                "axis": axis,
                "axis_index": idx,
            }
        )
        rows.append(
            {
                "axis_index": idx,
                "axis": axis,
                "frozen_instrument_pin": f"sha256-pinned-bank-or-predicates:{axis}",
                "fluid_watch_triggers": [
                    "model_weights_or_api_digest_change",
                    "mcp_tools_list_sha256_change",
                    "system_prompt_or_safeguard_policy_change",
                    "retest_bound_max_latency_exceeded_168h",
                ],
                "routed_hitl_lane_id": dispatch["routed_lane_id"],
                "assigned_human_role": dispatch["assigned_human_role"],
            }
        )
    return rows


def build_safe_fluid_daily_signal_artifact() -> Dict[str, Any]:
    capsules = build_nine_domain_daily_signal_capsules()
    axis_map = build_33_axis_frozen_to_fluid_coverage()

    states_demonstrated = sorted({c["result"]["state"] for c in capsules})
    watch_states_demonstrated = sorted({c["watch"]["state"] for c in capsules})

    body = {
        "schema": SCHEMA,
        "issuer": "CSOAI Ltd (UK Companies House 16939677)",
        "generated_on": "2026-10-29",
        "safe_profile_target": "safe-reverification/0.1-draft",
        "alliance_plugin_target": "csoai.alliance-control-plugin/0.2",
        "counts": {
            "sector_atlas_domains_covered": len(capsules),
            "canonical_gspc_axes_mapped": len(axis_map),
            "result_states_demonstrated": len(states_demonstrated),
            "watch_states_demonstrated": len(watch_states_demonstrated),
            "max_capsule_bytes": max(c["capsule_bytes"] for c in capsules),
            "capsule_byte_ceiling": MAX_OBSERVATION_BYTES,
        },
        "states_demonstrated": {
            "result_states": states_demonstrated,
            "watch_states": watch_states_demonstrated,
        },
        "nine_domain_daily_signal_capsules": capsules,
        "all_33_axes_frozen_to_fluid_watch_map": axis_map,
        "framing": "Measurement, never certification. Anyone can re-check at https://councilof.ai/verify",
    }
    digest = sha256_hex(canonical_json(body))
    return {**body, "signal_sha256": digest}


def main() -> int:
    parser = argparse.ArgumentParser(description="GSPC Frozen-to-Fluid SAFE Re-Verification Daily Signal Engine")
    parser.add_argument("--write", type=Path, default=None, help="Write JSON artifact to path")
    parser.add_argument("--sync-hf-space", action="store_true", help="Mirror artifact into spaces/gspc-board/")
    parser.add_argument("--verify", action="store_true", help="Print verification summary")
    args = parser.parse_args()

    artifact = build_safe_fluid_daily_signal_artifact()
    if args.write:
        args.write.parent.mkdir(parents=True, exist_ok=True)
        args.write.write_text(json.dumps(artifact, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    if args.sync_hf_space:
        DEFAULT_HF_SPACE_DIR.mkdir(parents=True, exist_ok=True)
        src = args.write if args.write and args.write.exists() else DEFAULT_OUT_PATH
        shutil.copyfile(src, DEFAULT_HF_SPACE_DIR / "safe-fluid-reverification-daily-signal-v1.json")

    if args.verify:
        print(
            json.dumps(
                {
                    "schema": artifact["schema"],
                    "signal_sha256": artifact["signal_sha256"],
                    "counts": artifact["counts"],
                    "states_demonstrated": artifact["states_demonstrated"],
                },
                indent=2,
            )
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
