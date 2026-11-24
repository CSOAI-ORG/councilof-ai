#!/usr/bin/env python3
"""HOLD-only Watchdog source metadata to SovSpace-compatible counterfactual graph.

No incident record is ingested, classified or geolocated. The graph is a
renderable *candidate* for a new CouncilOS plugin, not a deployed API.
Actual human, executor and recipient facts are never simulated into existence.
"""
from __future__ import annotations

import argparse
from collections import Counter
from dataclasses import asdict, replace
from datetime import datetime, timezone
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import re
import sys

SCHEMA = "csoai.watchdog-synthetic-consequence-graph/0.1"
LATEST_SCHEMA = "csoai.watchdog-intake-latest/0.1"
INDEX_SCHEMA = "csoai.watchdog-signal-index/0.1"
ID = re.compile(r"^[a-z][a-z0-9-]{1,63}$")
SHA256 = re.compile(r"^[0-9a-f]{64}$")
RUN = re.compile(r"^\d{8}T\d{6}Z$")
REPO_ROOT = Path(__file__).resolve().parents[3]
TWIN_PATH = REPO_ROOT / "measurement/experiments/assurance-fault-twin/fault_twin.py"


class Hold(ValueError):
    pass


def utc(value: str) -> datetime:
    if not isinstance(value, str) or not re.fullmatch(
        r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,6})?)?Z", value
    ):
        raise Hold("EXPLICIT_SOURCE_UTC_REQUIRED")
    try:
        return datetime.fromisoformat(value[:-1] + "+00:00")
    except ValueError as exc:
        raise Hold("INVALID_SOURCE_DATE") from exc


def digest(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def load_twin(path: Path = TWIN_PATH):
    if not path.is_file() or path.is_symlink():
        raise Hold("CANONICAL_FAULT_TWIN_NOT_FOUND")
    spec = importlib.util.spec_from_file_location("csoai_fault_twin_for_watchdog", path)
    if spec is None or spec.loader is None:
        raise Hold("CANONICAL_TWIN_NOT_IMPORTABLE")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    if not hasattr(module, "simulate") or not hasattr(module, "Scenario"):
        raise Hold("CANONICAL_TWIN_CONTRACT_MISSING")
    return module


def validate_snapshot(latest: object, index: object, observed_at: str, max_age_hours: float = 48) -> dict:
    now = utc(observed_at)
    if not isinstance(max_age_hours, (int, float)) or isinstance(max_age_hours, bool) or (
        not math.isfinite(max_age_hours) or not 0 < max_age_hours <= 24 * 30
    ):
        raise Hold("INVALID_SOURCE_AGE_POLICY")
    if not isinstance(latest, dict) or latest.get("schema") != LATEST_SCHEMA:
        raise Hold("LATEST_SCHEMA_UNCHECKABLE")
    if not isinstance(index, dict) or index.get("schema") != INDEX_SCHEMA:
        raise Hold("INDEX_SCHEMA_UNCHECKABLE")
    run_id = latest.get("run_id")
    if not isinstance(run_id, str) or not RUN.fullmatch(run_id) or index.get("run_id") != run_id:
        raise Hold("SOURCE_INDEX_RUN_MISMATCH")
    if latest.get("as_of") != index.get("as_of"):
        raise Hold("SOURCE_INDEX_TIME_MISMATCH")
    at = utc(latest.get("as_of"))
    age = (now - at).total_seconds() / 3600
    if age < 0 or not math.isfinite(age):
        raise Hold("FUTURE_OR_UNKNOWN_OBSERVATION")
    artifact = latest.get("run_artifact")
    if not isinstance(artifact, str) or artifact != f"/interop/watchdog-intake/{run_id}.json" or index.get("run_artifact") != artifact:
        raise Hold("SOURCE_POINTER_MISMATCH")
    raw = index.get("signals")
    totals = index.get("totals")
    if not isinstance(raw, list) or not isinstance(totals, dict) or not raw or len(raw) > 500:
        raise Hold("SOURCE_SIGNALS_INVALID")
    allowed = {"REACHABLE", "UNREACHABLE", "UNCHECKABLE"}
    observed = Counter()
    ids = set()
    sources = []
    for s in raw:
        if not isinstance(s, dict):
            raise Hold("INVALID_SOURCE_SIGNAL")
        sid = s.get("source_id")
        state = s.get("state")
        sha = s.get("body_sha256")
        if not isinstance(sid, str) or not ID.fullmatch(sid) or sid in ids or state not in allowed:
            raise Hold("INVALID_SOURCE_SIGNAL_ID_STATE")
        if state == "REACHABLE" and (not isinstance(sha, str) or not SHA256.fullmatch(sha)):
            raise Hold("REACHABLE_SOURCE_UNPINNED")
        if sha is not None and (not isinstance(sha, str) or not SHA256.fullmatch(sha)):
            raise Hold("INVALID_SOURCE_DIGEST")
        ids.add(sid)
        observed[state] += 1
        sources.append({
            "id": "source:" + sid, "type": "PUBLIC_SOURCE_STATUS_ONLY",
            "source_id": sid, "state": state,
            "source_body_sha256": sha,
            "location": None,
            "incident_count": None,
            "is_primary_incident_evidence": False,
            "rights_to_copy_records": "NOT_ESTABLISHED",
        })
    count = len(raw)
    for field, expected in [
        ("sources_probed", count),
        ("reachable", observed["REACHABLE"]),
        ("unreachable", observed["UNREACHABLE"]),
        ("uncheckable", observed["UNCHECKABLE"]),
    ]:
        for obj in (latest, totals):
            val = obj.get(field)
            if not isinstance(val, int) or isinstance(val, bool) or val != expected:
                raise Hold("SOURCE_COUNT_INCONSISTENCY_" + field.upper())
    return {
        "run_id": run_id, "as_of": latest["as_of"], "age_hours": round(age, 3),
        "state": "SOURCE_SNAPSHOT_STALE" if age > max_age_hours else "SOURCE_SNAPSHOT_WITHIN_POLICY",
        "sources": sources,
        "source_count": count,
        "source_states": dict(sorted(observed.items())),
    }


def hypothetical_paths(twin) -> list[dict]:
    scenario = twin.Scenario()
    variations = [
        ("NO_ACTION", {"effect_attempted": False}),
        ("ASSUMED_PERMITTED_EFFECT", {}),
        ("SCOPE_MISMATCH_ENFORCED", {"scope_matches": False}),
        ("SCOPE_MISMATCH_UNENFORCED", {"scope_matches": False, "executor_checks_scope": False}),
        ("REVOKED_AUTHORITY_ENFORCED", {"authority_revoked": True}),
        ("REVOKED_AUTHORITY_UNENFORCED", {"authority_revoked": True, "executor_checks_revocation": False}),
        ("REPLAY_ENFORCED", {"replayed_idempotency_key": True}),
        ("REPLAY_UNENFORCED", {"replayed_idempotency_key": True, "executor_checks_replay": False}),
        ("NON_INDEPENDENT_RECEIPT", {"recipient_independent": False}),
        ("STALE_INSTRUMENT", {"measurement_fresh": False}),
    ]
    out = []
    for key, overrides in variations:
        result = twin.simulate(replace(scenario, **overrides))
        if result.get("actual_recipient_effect_verified") is not False or result.get(
            "actual_human_authority_verified") is not False or result.get("production_policy_mutated") is not False:
            raise Hold("TWIN_CLAIM_BOUNDARY_VIOLATED")
        out.append({
            "id": "hypothesis:" + key.lower(),
            "type": "SYNTHETIC_COUNTERFACTUAL_ONLY",
            "label": key,
            "parameters": overrides,
            "simulated_result_state": result["state"],
            "simulated_prohibited_effect": result["prohibited_effect_in_simulation"],
            "simulated_effect": result["effect_in_simulation"],
            "warnings": result["warnings"],
            "real_incident_causality_established": False,
            "human_decision_simulated_only": True,
            "actual_human_authority_verified": False,
            "actual_recipient_effect_verified": False,
            "geolocation": None,
        })
    return out


def render_graph(latest_raw: bytes, index_raw: bytes, observed_at: str,
                 *, max_age_hours: float = 48, twin_path: Path = TWIN_PATH) -> dict:
    try:
        latest = json.loads(latest_raw)
        index = json.loads(index_raw)
    except (UnicodeError, ValueError) as exc:
        raise Hold("SOURCE_NOT_JSON") from exc
    observed = validate_snapshot(latest, index, observed_at, max_age_hours=max_age_hours)
    paths = hypothetical_paths(load_twin(twin_path))
    source_nodes = observed["sources"]
    source_anchor = {"id": "observation:watchdog-readback", "type": "PUBLIC_SOURCE_REACHABILITY_ONLY",
                     "run_id": observed["run_id"], "as_of": observed["as_of"],
                     "state": observed["state"], "location": None, "incident_count": None}
    scenario_anchor = {"id": "simulator:independent-hypotheses",
                       "type": "HYPOTHETICAL_ASSUMPTION_NO_INCIDENT_INGESTION",
                       "actual_incident_inferred": False, "geolocation": None}
    gate = {"id": "human:required-not-staffed", "type": "HUMAN_AUTHORITY_GATE",
            "status": "NOT_STAFFED_OR_NOT_EVIDENCED",
            "actual_human_approval": None, "effect_permission_issued": False}
    nodes = [source_anchor, scenario_anchor, gate] + source_nodes + paths
    edges = ([{"from": s["id"], "to": source_anchor["id"], "type": "SOURCE_STATUS_REPORT_ONLY"}
              for s in source_nodes]
             + [{"from": scenario_anchor["id"], "to": p["id"],
                 "type": "ALTERNATIVE_SIMULATED_PATH_NOT_CAUSALLY_DERIVED_FROM_SOURCE"}
                for p in paths]
             + [{"from": p["id"], "to": gate["id"],
                 "type": "FUTURE_ACTION_WOULD_REQUIRE_GENUINE_HUMAN_PERMISSION"}
                for p in paths])
    return {
        "schema": SCHEMA,
        "observed_at": observed_at,
        "source_latest_sha256": digest(latest_raw),
        "source_index_sha256": digest(index_raw),
        "source_run_id": observed["run_id"],
        "source_as_of": observed["as_of"],
        "source_age_hours": observed["age_hours"],
        "source_freshness": observed["state"],
        "source_states": observed["source_states"],
        "sources_probed": observed["source_count"],
        "incident_count": None,
        "incident_records_ingested": False,
        "independent_public_event_verification": False,
        "synthetic_hypotheses": len(paths),
        "nodes": nodes,
        "edges": edges,
        "rendering_location_policy": "NO_GLOBE_PINS_WITHOUT_ACTUAL_SOURCE_COORDINATES",
        "synthetic_versus_real_visual_label": "REQUIRED",
        "existing_authority_schema_unchanged": True,
        "existing_evidence_event_schema_unchanged": True,
        "human_working_group_accepted_and_staffed": False,
        "actual_human_authority_verified": False,
        "actual_recipient_effect_verified": False,
        "external_effects_performed": False,
        "production_board_modified": False,
        "acceptance": "SOURCE_ONLY_SIMULATION_CANDIDATE_NOT_A_PUBLISHED_WORLD_EVENT",
        "recommended_operator_action": "REVIEW_STALE_INDEX_AND_UPSTREAM_PR" if observed["state"] == "SOURCE_SNAPSHOT_STALE" else "NO_ACTION",
    }


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--latest", type=Path, required=True)
    p.add_argument("--index", type=Path, required=True)
    p.add_argument("--as-of", required=True)
    p.add_argument("--max-age-hours", type=float, default=48)
    p.add_argument("--output", type=Path, required=True)
    args = p.parse_args(argv)
    try:
        if args.output.is_symlink():
            raise Hold("OUTPUT_SYMLINK_REFUSED")
        report = render_graph(args.latest.read_bytes(), args.index.read_bytes(),
                              args.as_of, max_age_hours=args.max_age_hours)
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_bytes(json.dumps(report, indent=2, sort_keys=True, allow_nan=False).encode() + b"\n")
        print(json.dumps({"state": report["source_freshness"], "sources": report["sources_probed"],
                          "synthetic_alternatives": report["synthetic_hypotheses"],
                          "real_incidents_ingested": 0, "real_effects_performed": 0}))
        return 0 if report["source_freshness"] == "SOURCE_SNAPSHOT_WITHIN_POLICY" else 3
    except (Hold, OSError, ValueError, TypeError, KeyError) as exc:
        print("UNCHECKABLE: " + str(exc)[:140], file=sys.stderr)
        return 4


if __name__ == "__main__":
    sys.exit(main())
