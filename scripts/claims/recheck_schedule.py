#!/usr/bin/env python3
"""Bounded offline advice over the existing claim-reactions projection.

This module executes no checks and writes no evidence events or canonical state.
Cost and priority are caller policy, not calibrated value-of-information estimates.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
from fractions import Fraction
import hashlib
import json
import os
from pathlib import Path
import re
import stat
import sys

REACTION_SCHEMA = "csoai.claim-reactions/0.1"
REACTIONS = {"NO_CHANGE", "RECHECK_REQUIRED", "SOURCE_RETRY_REQUIRED", "DELIVERY_RECEIPT", "BASELINE_ONLY"}
AUTHORITY = "NONE: offline advice; no check, source access, event, correction, signing or publication is executed"
MAX_CLAIMS, MAX_REACTIONS, MAX_EDGES = 2_000, 20_000, 20_000
MAX_INPUT_BYTES = 4 * 1024 * 1024


def integer(value, name, low=0, high=10**12):
    if type(value) is not int or not low <= value <= high:
        raise ValueError(f"{name} must be an integer in [{low}, {high}]")
    return value


def instant(value, name):
    if not isinstance(value, str) or not value.endswith("Z"):
        raise ValueError(f"{name} must be a UTC timestamp ending in Z")
    try:
        result = datetime.fromisoformat(value[:-1] + "+00:00")
    except ValueError as exc:
        raise ValueError(f"invalid {name}") from exc
    if "T" not in value or result.tzinfo != timezone.utc:
        raise ValueError(f"invalid {name}")
    return result


def nonempty(value, name):
    if not isinstance(value, str) or not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._/-]{0,127}", value):
        raise ValueError(f"{name} must be a bounded identifier")
    return value


def source_key(item):
    subject = item.get("subject_sealed_id")
    if not isinstance(subject, str) or not re.fullmatch(r"(?:[0-9a-f]{16}|[0-9a-f]{64})", subject):
        raise ValueError("unsupported sealed identifier format; expected lowercase 16 or 64 hex")
    return (subject,
            nonempty(item.get("claim_ref"), "claim_ref"))


def read_json_bytes(raw):
    """Reject duplicate JSON object keys instead of silently accepting the last."""
    def pairs(items):
        result = {}
        for key, value in items:
            if key in result:
                raise ValueError("duplicate JSON key")
            result[key] = value
        return result
    return json.loads(raw, object_pairs_hook=pairs,
                      parse_constant=lambda value: (_ for _ in ()).throw(ValueError(f"invalid JSON constant: {value}")))


def read_regular_file(path):
    """Bound reads and refuse symlinks, devices, FIFOs and directories."""
    descriptor = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
    with os.fdopen(descriptor, "rb") as stream:
        info = os.fstat(stream.fileno())
        if not stat.S_ISREG(info.st_mode) or info.st_size > MAX_INPUT_BYTES:
            raise ValueError("input must be a regular file within the byte limit")
        raw = stream.read(MAX_INPUT_BYTES + 1)
        if len(raw) > MAX_INPUT_BYTES:
            raise ValueError("input exceeds byte limit")
        return raw


def _projection_rows(projection, as_of):
    if not isinstance(projection, dict) or projection.get("schema") != REACTION_SCHEMA:
        raise ValueError("expected existing csoai.claim-reactions/0.1 projection")
    if projection.get("source_verification") != "VERIFIES":
        raise ValueError("source verification missing or failed; no schedule produced")
    if projection.get("since_exclusive") != -1:
        raise ValueError("a complete projection (since_exclusive=-1) is required")
    rows = projection.get("reactions")
    if not isinstance(rows, list) or len(rows) > MAX_REACTIONS:
        raise ValueError("reactions must be a bounded list")
    unique = {}
    for row in rows:
        if not isinstance(row, dict):
            raise ValueError("reaction must be an object")
        seq = integer(row.get("event_seq"), "event_seq")
        if row.get("reaction_state") not in REACTIONS:
            raise ValueError("unknown reaction_state")
        if row.get("observed_at") is not None and instant(row["observed_at"], "observed_at") > as_of:
            raise ValueError("reaction observed_at is later than as_of")
        if row.get("receipt_state") not in (None, "DELIVERY_RECEIPT"):
            raise ValueError("unsupported receipt_state")
        counter = row.get("counter_reaction")
        if not isinstance(counter, dict) or type(counter.get("required")) is not bool:
            raise ValueError("counter_reaction.required must be boolean")
        if counter["required"] != (row["reaction_state"] in ("RECHECK_REQUIRED", "SOURCE_RETRY_REQUIRED")):
            raise ValueError("counter-reaction classification mismatch")
        if seq in unique and row != unique[seq]:
            raise ValueError("conflicting duplicate event_seq")
        unique[seq] = row
    if sorted(unique) != list(range(len(unique))):
        raise ValueError("complete projection must contain contiguous event_seq from zero")
    by_state = {}
    for row in unique.values():
        by_state[row["reaction_state"]] = by_state.get(row["reaction_state"], 0) + 1
    if (not isinstance(projection.get("by_state"), dict)
            or any(type(value) is not int for value in projection["by_state"].values())
            or type(projection.get("n_events")) is not int or projection["n_events"] != len(unique)
            or projection.get("by_state") != by_state
            or type(projection.get("n_counter_reaction_required")) is not int
            or projection["n_counter_reaction_required"] != sum(row["counter_reaction"]["required"] for row in unique.values())):
        raise ValueError("projection summary does not match reaction rows")
    grouped = {}
    for seq in sorted(unique):
        row = unique[seq]
        # Baseline and subject-wide receipts do not invent claim-level work.
        if row.get("subject_sealed_id") and row.get("claim_ref") not in (None, "*"):
            # No free-text reasons, checks, arbitrary extra fields or source contents are echoed.
            grouped.setdefault(source_key(row), []).append({
                "event_seq": seq, "observed_at": row.get("observed_at"),
                "reaction_state": row["reaction_state"], "receipt_state": row.get("receipt_state"),
                "counter_reaction_required": row["counter_reaction"]["required"],
            })
    return grouped, len(rows) - len(unique)


def _dependency_count(root, edges, cap):
    visited, pending = {root}, [root]
    count, scanned = 0, 0
    while pending:
        for child in edges.get(pending.pop(), ()):
            scanned += 1
            if scanned > max(1, cap * 8):
                return count, True
            if child in visited:
                continue
            visited.add(child)
            count += 1
            if count > cap:
                return cap, True
            pending.append(child)
    return count, False


def build_schedule(projection, policy, as_of):
    now = instant(as_of, "as_of")
    grouped, duplicate_rows = _projection_rows(projection, now)
    if not isinstance(policy, dict):
        raise ValueError("policy must be an object")
    budget = integer(policy.get("budget_units"), "budget_units")
    max_items = integer(policy.get("max_items", MAX_CLAIMS), "max_items", high=MAX_CLAIMS)
    explore_slots = integer(policy.get("exploration_slots", 1), "exploration_slots", high=MAX_CLAIMS)
    max_wait = integer(policy.get("max_wait_seconds", 604800), "max_wait_seconds", low=1)
    dep_cap = integer(policy.get("max_dependency_count", 32), "max_dependency_count", high=128)
    allowed = policy.get("allowed_provider_ids")
    if not isinstance(allowed, list) or len(allowed) > MAX_CLAIMS:
        raise ValueError("allowed_provider_ids must be an explicit list")
    allowed = {nonempty(value, "allowed provider") for value in allowed}
    graph = policy.get("dependencies", [])
    if not isinstance(graph, list) or len(graph) > MAX_EDGES:
        raise ValueError("dependencies must be a bounded list")
    edges = {}
    for edge in graph:
        if not isinstance(edge, list) or len(edge) != 2:
            raise ValueError("dependency must be [parent, child]")
        parent, child = (nonempty(value, "dependency node") for value in edge)
        edges.setdefault(parent, set()).add(child)
    edges = {parent: tuple(sorted(children)) for parent, children in edges.items()}
    claims = policy.get("claims")
    if not isinstance(claims, list) or len(claims) > MAX_CLAIMS:
        raise ValueError("claims must be a bounded list")
    unique, duplicate_claims = {}, 0
    for claim in claims:
        if not isinstance(claim, dict):
            raise ValueError("claim policy must be an object")
        key = source_key(claim)
        if key in unique:
            if claim != unique[key]:
                raise ValueError("conflicting duplicate claim policy")
            duplicate_claims += 1
        unique[key] = claim

    items, scores = [], {}
    for key in sorted(unique):
        claim = unique[key]
        method = nonempty(claim.get("method_version"), "method_version")
        provider = nonempty(claim.get("provider_id"), "provider_id")
        cost = integer(claim.get("estimated_cost_units"), "estimated_cost_units", low=1)
        max_age = integer(claim.get("max_age_seconds"), "max_age_seconds", low=1)
        impact = integer(claim.get("impact_weight", 1), "impact_weight", low=1, high=100)
        if type(claim.get("known_stale", False)) is not bool:
            raise ValueError("known_stale must be boolean")
        if type(claim.get("dependency_graph_complete", False)) is not bool:
            raise ValueError("dependency_graph_complete must be boolean")
        last = instant(claim["last_success_at"], "last_success_at") if claim.get("last_success_at") else None
        first = instant(claim["first_pending_at"], "first_pending_at") if claim.get("first_pending_at") else None
        deadline = instant(claim["deadline_at"], "deadline_at") if claim.get("deadline_at") else None
        retry = instant(claim["retry_at"], "retry_at") if claim.get("retry_at") else None
        if (last and last > now) or (first and first > now):
            raise ValueError("success/pending timestamps cannot be later than as_of")
        reactions = grouped.get(key, [])
        pending_recheck = any(row["reaction_state"] == "RECHECK_REQUIRED" for row in reactions)
        source_retry = any(row["reaction_state"] == "SOURCE_RETRY_REQUIRED" for row in reactions)
        age = int((now - last).total_seconds()) if last else None
        wait = int((now - first).total_seconds()) if first else 0
        stale = claim.get("known_stale", False) or pending_recheck or (age is not None and age >= max_age)
        freshness = "STALE" if stale else ("UNKNOWN" if source_retry or last is None else "NOT_DUE")
        deadline_due = bool(deadline and deadline <= now)
        wait_due = bool(first and wait >= max_wait)
        mandatory = pending_recheck or deadline_due or wait_due
        action = "SOURCE_RETRY" if source_retry else ("RECHECK" if pending_recheck else "PERIODIC_RECHECK")
        block = None
        if not reactions:
            block = "MISSING_REACTION_EVIDENCE"
        elif any(row["observed_at"] is None for row in reactions):
            block = "MISSING_OBSERVATION_TIME"
        elif provider not in allowed:
            block = "PROVIDER_NOT_ALLOWED"
        elif source_retry and retry is None:
            block = "MISSING_RETRY_AT"
        elif source_retry and retry > now:
            block = "RETRY_BACKOFF"
        elif not mandatory and not stale and freshness != "UNKNOWN":
            block = "NOT_DUE"
        root = nonempty(claim.get("dependency_root", key[1]), "dependency_root")
        count, truncated = _dependency_count(root, edges, dep_cap)
        score = Fraction(min(age or 0, 4 * max_age), max_age) * impact * (1 + count) / cost
        scores[key] = score
        item = {
            "work_key": {"subject_sealed_id": key[0], "claim_ref": key[1], "method_version": method},
            "provider_id": provider, "estimated_cost_units": cost,
            "action": action, "freshness_state": freshness, "mandatory": mandatory,
            "deadline_due": deadline_due, "wait_limit_due": wait_due,
            "age_seconds": age, "waiting_seconds": wait,
            "deadline_at": claim.get("deadline_at"),
            "known_affected_dependency_count": count,
            "dependency_count_capped": truncated,
            "dependency_graph_complete": claim.get("dependency_graph_complete", False) and not truncated,
            "ordering_score": {"numerator": score.numerator, "denominator": score.denominator},
            "decision": "DEFERRED", "decision_reason": block or "BUDGET_OR_ITEM_LIMIT",
            "reactions": reactions,
        }
        items.append(item)

    remaining, selected = budget, []
    eligible = [i for i in items if i["decision_reason"] == "BUDGET_OR_ITEM_LIMIT"]
    def key_of(item):
        return (item["work_key"]["subject_sealed_id"], item["work_key"]["claim_ref"])
    def choose(candidates, reason, limit=MAX_CLAIMS):
        nonlocal remaining
        count = 0
        for item in candidates:
            if count >= limit or len(selected) >= max_items:
                break
            if item["decision"] == "SELECTED" or item["estimated_cost_units"] > remaining:
                continue
            item["decision"], item["decision_reason"] = "SELECTED", reason
            remaining -= item["estimated_cost_units"]
            selected.append(item)
            count += 1
    mandatory = sorted((i for i in eligible if i["mandatory"]),
                       key=lambda i: (not i["deadline_due"], instant(i["deadline_at"], "deadline_at") if i["deadline_at"] else datetime.max.replace(tzinfo=timezone.utc), -i["waiting_seconds"], -scores[key_of(i)], key_of(i)))
    choose(mandatory, "MANDATORY")
    unknown = sorted((i for i in eligible if not i["mandatory"] and i["freshness_state"] == "UNKNOWN"),
                     key=lambda i: (-i["waiting_seconds"], key_of(i)))
    choose(unknown, "EXPLORATION", explore_slots)
    due = sorted((i for i in eligible if i["freshness_state"] != "UNKNOWN"),
                 key=lambda i: (-scores[key_of(i)], -i["waiting_seconds"], key_of(i)))
    choose(due, "DUE_PRIORITY")
    # Unused exploration capacity is usable by other unknown work without a promise of capacity.
    choose(unknown, "EXPLORATION_SPARE_CAPACITY")
    missed = [i for i in items if i["mandatory"] and i["decision"] != "SELECTED"]
    for item in mandatory:
        if item["decision"] != "SELECTED":
            item["decision_reason"] = "UNFUNDED_MANDATORY"
    return {
        "kind": "bounded_claim_recheck_advice", "version": 1, "as_of": as_of,
        "source_schema": REACTION_SCHEMA,
        "source_verification_basis": "UPSTREAM_ASSERTION_ONLY; this scheduler does not authenticate the feed or signed head",
        "authority_state": AUTHORITY,
        "rights_and_permissions": "NOT_ASSESSED: provider allowlist is scheduling policy, not source reuse approval",
        "budget_units": budget, "spent_cost_units": budget - remaining,
        "remaining_cost_units": remaining, "max_items": max_items,
        "selected_order": [i["work_key"] for i in selected],
        "n_unmet_mandatory": len(missed),
        "unfunded_ready_mandatory_cost_units": sum(i["estimated_cost_units"] for i in missed if i["decision_reason"] == "UNFUNDED_MANDATORY"),
        "n_due_deadlines_not_selected": sum(i["deadline_due"] and i["decision"] != "SELECTED" for i in items),
        "duplicate_reaction_rows_collapsed": duplicate_rows,
        "duplicate_claim_policies_collapsed": duplicate_claims,
        "items": items,
        "limits": ["Selection is advice, not execution or a successful check.",
                   "No selection or receipt changes freshness or establishes claim truth.",
                   "Costs, impact weights, deadlines and dependencies are caller policy, not calibrated VOI or money.",
                   "Historical recheck and retry triggers remain pending; no resolution is inferred from a later receipt or NO_CHANGE row.",
                   "Exploration and wait promotion cannot guarantee service under insufficient budget, backoff or provider restrictions."],
    }


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("projection", type=Path)
    parser.add_argument("policy", type=Path)
    parser.add_argument("--as-of", required=True, help="explicit UTC timestamp ending in Z")
    parser.add_argument("--projection-sha256", help="optional caller-pinned exact projection byte digest; not a signature")
    args = parser.parse_args(argv)
    try:
        raw = read_regular_file(args.projection)
        digest = hashlib.sha256(raw).hexdigest()
        if args.projection_sha256 and args.projection_sha256 != digest:
            raise ValueError("projection digest mismatch")
        result = build_schedule(read_json_bytes(raw), read_json_bytes(read_regular_file(args.policy)), args.as_of)
        result["projection_bytes_sha256"] = digest
        print(json.dumps(result, indent=2, sort_keys=True, allow_nan=False))
        return 0
    except (ValueError, TypeError, KeyError, OSError, RecursionError) as exc:
        reason = ("cannot read bounded regular input file" if isinstance(exc, OSError)
                  else "input nesting exceeds parser limit" if isinstance(exc, RecursionError) else str(exc))
        print(json.dumps({"status": "REJECTED", "authority_state": AUTHORITY, "reason": reason}))
        return 2


if __name__ == "__main__":
    sys.exit(main())
