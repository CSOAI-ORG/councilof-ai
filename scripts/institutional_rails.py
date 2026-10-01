#!/usr/bin/env python3
"""Deterministic institutional-financial-rail evidence ledger builder.

Source is curated, primary-source evidence in data/institutional-rails.
Output is read-only public evidence. This script never fetches, deploys, signs,
anchors, schedules, pays, trades, or contacts a third party.
"""
from __future__ import annotations

import argparse
import copy
import hashlib
import json
import re
import sys
from collections import Counter
from datetime import datetime
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "data/institutional-rails/rails.json"
SOURCE_EVENTS = ROOT / "data/institutional-rails/events.source.jsonl"
CODE_PLANE_BASELINE = ROOT / "data/institutional-rails/code-plane-baseline-2026-10-01.json"
WATCH_UNIVERSE = ROOT / "data/institutional-rails/watch-universe.json"
OUT = ROOT / "public/interop/institutional-rails/v0.1"
SPEC = ROOT / "public/spec/institutional-rails/v0.1"

STATES = [
    "DISCOVERED",
    "PROPOSED",
    "CODED",
    "MERGED_RELEASED",
    "CONFIGURED",
    "DEPLOYED",
    "LIVE",
    "TRANSACTED",
    "SETTLED",
    "FINAL",
]
STATE_RANK = {state: i for i, state in enumerate(STATES)}
STATE_DOC = {
    "DISCOVERED": "Named in the bounded catalogue. Nothing else is inferred.",
    "PROPOSED": "A proposal, consultation, announced integration, or stated intent exists.",
    "CODED": "Relevant implementation code exists. Merge, release, deployment and use remain separate.",
    "MERGED_RELEASED": "Canonical code was merged or a release was published. Deployment is not inferred.",
    "CONFIGURED": "Named network, contract, participant or launch configuration is evidenced.",
    "DEPLOYED": "Infrastructure is evidenced in the target environment. General availability is not inferred.",
    "LIVE": "The rail or product is evidenced as available for use. Transaction activity is not inferred.",
    "TRANSACTED": "At least one transaction is evidenced. Settlement is not inferred.",
    "SETTLED": "Settlement completion is evidenced for the bounded event. Legal finality is not inferred.",
    "FINAL": "A legal or operational finality basis is evidenced for the bounded event.",
}
CHANGE_TYPES = {
    "STATE_ADVANCE",
    "EVIDENCE_ADDED",
    "BLOCKER_CHANGED",
    "CORRECTION",
    "SCOPE_CHANGE",
    "DEADLINE",
}
EVENT_STATUSES = {"OBSERVED", "SCHEDULED"}
PRECISIONS = {"instant", "day", "month", "quarter", "year"}
REQUIRED_EVIDENCE = {
    "PROPOSED": ("proposal_evidence",),
    "CODED": ("code_evidence",),
    "MERGED_RELEASED": ("release_evidence",),
    "CONFIGURED": ("configuration_evidence",),
    "DEPLOYED": ("deployment_evidence",),
    "LIVE": ("live_evidence",),
    "TRANSACTED": ("transaction",),
    "SETTLED": ("transaction", "settlement"),
    "FINAL": ("transaction", "settlement", "finality"),
}

SOURCE_KIND_PLANES = {
    "canonical_protocol_repository_commit": "CODE_CONFIG_RELEASE",
    "canonical_repository_commit": "CODE_CONFIG_RELEASE",
    "canonical_runtime_config_repository": "CODE_CONFIG_RELEASE",
    "canonical_software_release": "CODE_CONFIG_RELEASE",
    "canonical_token_registry": "CODE_CONFIG_RELEASE",
    "official_changelog": "CODE_CONFIG_RELEASE",
    "canonical_public_repository_issue": "PUBLIC_PROJECT_TRACKER",
    "official_consultation": "REGULATORY_GOVERNMENT",
    "official_exemptive_order": "REGULATORY_GOVERNMENT",
    "official_government_release": "REGULATORY_GOVERNMENT",
    "official_regulatory_filing": "REGULATORY_GOVERNMENT",
    "official_news": "INSTITUTIONAL_ANNOUNCEMENT",
    "official_press_release": "INSTITUTIONAL_ANNOUNCEMENT",
    "official_project_page": "INSTITUTIONAL_ANNOUNCEMENT",
}

def canonical_json(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)

def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()

def sha256_text(value: str) -> str:
    return sha256_bytes(value.encode("utf-8"))

def parse_exact_instant(value: Any) -> datetime | None:
    if not isinstance(value, str) or "T" not in value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    return parsed if parsed.tzinfo is not None else None

def exact_delay_seconds(start: Any, end: Any) -> int | None:
    left = parse_exact_instant(start)
    right = parse_exact_instant(end)
    if left is None or right is None:
        return None
    return int((right - left).total_seconds())

def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))

def load_jsonl(path: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for n, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        if not line.strip():
            continue
        try:
            row = json.loads(line)
        except json.JSONDecodeError as exc:
            raise ValueError(f"{path}:{n}: invalid JSON: {exc}") from exc
        if not isinstance(row, dict):
            raise ValueError(f"{path}:{n}: row must be an object")
        rows.append(row)
    return rows

def fail(message: str) -> None:
    raise ValueError(message)

def require_string(obj: dict[str, Any], key: str, where: str) -> str:
    value = obj.get(key)
    if not isinstance(value, str) or not value.strip():
        fail(f"{where}: {key} must be a non-empty string")
    return value

def validate_catalog(catalog: dict[str, Any]) -> dict[str, dict[str, Any]]:
    if catalog.get("schema") != "csoai.institutional-rail-catalog/0.1":
        fail("catalog: unexpected schema")
    rails = catalog.get("rails")
    if not isinstance(rails, list) or not rails:
        fail("catalog: rails must be a non-empty array")
    by_id: dict[str, dict[str, Any]] = {}
    for i, rail in enumerate(rails):
        where = f"catalog.rails[{i}]"
        if not isinstance(rail, dict):
            fail(f"{where}: must be an object")
        rid = require_string(rail, "id", where)
        if rid in by_id:
            fail(f"{where}: duplicate id {rid}")
        if rail.get("initial_state") != "DISCOVERED":
            fail(f"{where}: initial_state must be DISCOVERED")
        by_id[rid] = rail
    for rid, rail in by_id.items():
        for dep in rail.get("dependencies", []):
            if dep not in by_id:
                fail(f"catalog rail {rid}: unknown dependency {dep}")
            if dep == rid:
                fail(f"catalog rail {rid}: self-dependency")
    return by_id

def dedup_key(event: dict[str, Any]) -> str:
    source = event.get("canonical_source") or {}
    canonical_event = event.get("canonical_event") or {}
    basis = {
        "url": source.get("url"),
        "title": canonical_event.get("title"),
        "event_at": event.get("event_at"),
        "revision": canonical_event.get("revision"),
    }
    return sha256_text(canonical_json(basis))

def validate_event(
    event: dict[str, Any],
    index: int,
    rails: dict[str, dict[str, Any]],
    current: dict[str, str],
    seen_source_ids: set[str],
    seen_dedup: set[str],
    known_event_ids: set[str],
) -> tuple[str, str]:
    where = f"events[{index}]"
    source_id = require_string(event, "source_event_id", where)
    if source_id in seen_source_ids:
        fail(f"{where}: duplicate source_event_id {source_id}")
    seen_source_ids.add(source_id)

    rail_id = require_string(event, "rail_id", where)
    if rail_id not in rails:
        fail(f"{where}: unknown rail_id {rail_id}")
    for related in event.get("related_rail_ids", []):
        if related not in rails:
            fail(f"{where}: unknown related rail {related}")

    prior = require_string(event, "prior_state", where)
    new = require_string(event, "new_state", where)
    if prior not in STATE_RANK or new not in STATE_RANK:
        fail(f"{where}: unknown state transition {prior}->{new}")

    change_type = require_string(event, "change_type", where)
    if change_type not in CHANGE_TYPES:
        fail(f"{where}: unknown change_type {change_type}")
    status = require_string(event, "event_status", where)
    if status not in EVENT_STATUSES:
        fail(f"{where}: event_status must be one of {sorted(EVENT_STATUSES)}")
    precision = require_string(event, "event_time_precision", where)
    if precision not in PRECISIONS:
        fail(f"{where}: unsupported event_time_precision {precision}")

    require_string(event, "event_at", where)
    require_string(event, "observed_at", where)
    require_string(event, "material_change_type", where)
    source = event.get("canonical_source")
    if not isinstance(source, dict):
        fail(f"{where}: canonical_source must be an object")
    require_string(source, "publisher", f"{where}.canonical_source")
    source_kind = require_string(source, "kind", f"{where}.canonical_source")
    if source_kind not in SOURCE_KIND_PLANES:
        fail(f"{where}: unsupported canonical source kind {source_kind}")
    url = require_string(source, "url", f"{where}.canonical_source")
    if not url.startswith("https://"):
        fail(f"{where}: canonical source must be https")
    canonical_event = event.get("canonical_event")
    if not isinstance(canonical_event, dict):
        fail(f"{where}: canonical_event must be an object")
    require_string(canonical_event, "title", f"{where}.canonical_event")

    key = dedup_key(event)
    if key in seen_dedup:
        fail(f"{where}: canonical source/event duplicate {key}")
    seen_dedup.add(key)

    expected_prior = current[rail_id]
    if change_type == "CORRECTION":
        corrects = require_string(event, "corrects_event_id", where)
        if corrects not in known_event_ids:
            fail(f"{where}: correction references unknown event {corrects}")
    else:
        if prior != expected_prior:
            fail(f"{where}: prior_state {prior} does not match current {expected_prior} for {rail_id}")
        if STATE_RANK[new] < STATE_RANK[prior]:
            fail(f"{where}: state regression requires CORRECTION")

    if status == "SCHEDULED" and new != prior:
        fail(f"{where}: scheduled events cannot advance state")

    for evidence_field in REQUIRED_EVIDENCE.get(new, ()):
        if not isinstance(event.get(evidence_field), dict):
            fail(f"{where}: {new} requires object field {evidence_field}")

    finality = event.get("finality")
    if new == "FINAL":
        if not isinstance(finality, dict) or finality.get("state") in {None, "UNMEASURED"}:
            fail(f"{where}: FINAL requires measured finality, not UNMEASURED")

    regulatory = event.get("regulatory")
    if regulatory is not None:
        if not isinstance(regulatory, dict):
            fail(f"{where}: regulatory must be an object when present")
        for field in ("authority", "action_type", "status", "subject", "effective_date"):
            require_string(regulatory, field, f"{where}.regulatory")

    if event.get("market_effect") != "UNMEASURED":
        effect = event.get("market_effect")
        if not isinstance(effect, dict) or not effect.get("evidence"):
            fail(f"{where}: market_effect must be UNMEASURED or carry evidence")

    does_not_prove = event.get("does_not_prove")
    if not isinstance(does_not_prove, list) or not does_not_prove:
        fail(f"{where}: does_not_prove must be a non-empty array")

    return key, rail_id

def node_id(kind: str, label: str) -> str:
    return f"{kind}:{sha256_text(label.strip().lower())[:16]}"

def render(
    catalog: dict[str, Any],
    source_events: list[dict[str, Any]],
    producer_sha: str,
    code_plane_baseline: dict[str, Any] | None = None,
    watch_universe: dict[str, Any] | None = None,
) -> dict[str, bytes]:
    rails = validate_catalog(catalog)
    if code_plane_baseline is None:
        code_plane_baseline = load_json(CODE_PLANE_BASELINE)
    if watch_universe is None:
        watch_universe = load_json(WATCH_UNIVERSE)

    if code_plane_baseline.get("schema") != "csoai.institutional-code-plane-observation/0.1":
        fail("code-plane baseline: unsupported schema")
    execution = code_plane_baseline.get("execution")
    if not isinstance(execution, dict) or execution.get("automatic_promotion") is not False:
        fail("code-plane baseline: automatic promotion must be false")
    if execution.get("writes_canonical_rail_ledger") is not False:
        fail("code-plane baseline: canonical rail ledger writes must be false")
    for n, source in enumerate(code_plane_baseline.get("sources", [])):
        if source.get("promotion_state") != "REVIEW_REQUIRED" or source.get("automatic_promotion") is not False:
            fail(f"code-plane baseline source[{n}]: must remain REVIEW_REQUIRED with automatic_promotion=false")
        for rid in source.get("rail_ids", []):
            if rid not in rails:
                fail(f"code-plane baseline source[{n}]: unknown rail_id {rid}")

    if watch_universe.get("schema") != "csoai.institutional-rails-watch-universe/0.1":
        fail("watch universe: unsupported schema")
    seen_target_ids: set[str] = set()
    for n, target in enumerate(watch_universe.get("targets", [])):
        tid = require_string(target, "id", f"watch_universe.targets[{n}]")
        if tid in seen_target_ids:
            fail(f"watch universe: duplicate target id {tid}")
        seen_target_ids.add(tid)
        expected = target.get("expected_rail_ids")
        if not isinstance(expected, list) or not expected:
            fail(f"watch_universe.targets[{n}]: expected_rail_ids must be a non-empty array")

    current = {rid: str(rail["initial_state"]) for rid, rail in rails.items()}
    last_event: dict[str, dict[str, Any]] = {}
    seen_source_ids: set[str] = set()
    seen_dedup: set[str] = set()
    known_event_ids: set[str] = set()
    lines: list[str] = []
    projected: list[dict[str, Any]] = []
    prev_sha: str | None = None

    for seq, source_event in enumerate(source_events):
        event = copy.deepcopy(source_event)
        key, rail_id = validate_event(
            event, seq, rails, current, seen_source_ids, seen_dedup, known_event_ids
        )
        event_id = f"ire-{key[:20]}"
        event["schema"] = "csoai.institutional-rail-event/0.1"
        event["seq"] = seq
        event["event_id"] = event_id
        event["dedup_key"] = key
        event["prev_sha256"] = prev_sha
        event.setdefault(
            "acceptance",
            {
                "state": "UNMEASURED",
                "detail": "Settlement, finality, reachability or availability do not establish delivery or receiving-party acceptance.",
            },
        )
        line = canonical_json(event)
        prev_sha = sha256_text(line)
        lines.append(line + "\n")
        projected.append(event)
        known_event_ids.add(event_id)
        current[rail_id] = str(event["new_state"])
        last_event[rail_id] = event

    feed = "".join(lines).encode("utf-8")
    observed = [str(e["observed_at"]) for e in projected]
    as_of = max(observed) if observed else str(catalog.get("as_of") or "")

    state_counts = Counter(current.values())
    direct_events_by_rail: dict[str, list[dict[str, Any]]] = {rid: [] for rid in rails}
    related_events_by_rail: dict[str, list[dict[str, Any]]] = {rid: [] for rid in rails}
    for admitted in projected:
        direct_events_by_rail[admitted["rail_id"]].append(admitted)
        for related in admitted.get("related_rail_ids", []):
            related_events_by_rail[related].append(admitted)

    snapshot_rows = []
    for rid in sorted(rails):
        rail = copy.deepcopy(rails[rid])
        event = last_event.get(rid)
        direct_events = direct_events_by_rail[rid]
        related_events = related_events_by_rail[rid]
        evidence_presence = {
            "direct_events": len(direct_events),
            "related_events": len(related_events),
            "direct_regulatory_actions": sum(1 for row in direct_events if isinstance(row.get("regulatory"), dict)),
            "direct_transaction_events": sum(1 for row in direct_events if isinstance(row.get("transaction"), dict)),
            "direct_settlement_events": sum(1 for row in direct_events if isinstance(row.get("settlement"), dict)),
            "direct_events_without_state_advance": sum(1 for row in direct_events if row.get("prior_state") == row.get("new_state")),
            "latest_direct_event_id": direct_events[-1]["event_id"] if direct_events else None,
            "latest_related_event_id": related_events[-1]["event_id"] if related_events else None,
            "rule": "Evidence presence is not maturity. Related evidence never advances this rail's state, and direct regulatory evidence may leave operational maturity at DISCOVERED.",
        }
        rail.update(
            {
                "current_state": current[rid],
                "state_rank": STATE_RANK[current[rid]],
                "as_of": event.get("observed_at") if event else catalog.get("as_of"),
                "last_event_id": event.get("event_id") if event else None,
                "last_event_at": event.get("event_at") if event else None,
                "blockers": event.get("blockers", []) if event else [],
                "next_tripwire": event.get("next_tripwire") if event else None,
                "settlement_boundary": event.get("settlement_boundary") if event else None,
                "finality": event.get("finality") if event else None,
                "acceptance": event.get("acceptance") if event else {"state": "UNMEASURED"},
                "evidence_presence": evidence_presence,
                "does_not_prove": event.get("does_not_prove", ["catalogue inclusion is not deployment"]) if event else ["catalogue inclusion is not deployment"],
            }
        )
        snapshot_rows.append(rail)

    snapshot = {
        "schema": "csoai.institutional-rails-snapshot/0.1",
        "as_of": as_of,
        "authority_for": "current evidence state of the bounded institutional-financial-rail catalogue",
        "event_feed": "/interop/institutional-rails/v0.1/events.jsonl",
        "state_model": {
            "ordered_states": STATES,
            "semantics": STATE_DOC,
            "acceptance_is_orthogonal": True,
            "rule": "A higher state is never inferred from a lower state. Settlement does not prove legal finality or delivery acceptance.",
        },
        "counts": {
            "rails": len(snapshot_rows),
            "events": len(projected),
            "by_state": {state: state_counts.get(state, 0) for state in STATES},
        },
        "rails": snapshot_rows,
    }

    reverse_dependencies: dict[str, set[str]] = {rid: set() for rid in rails}
    for dependent_id, rail in rails.items():
        for dependency_id in rail.get("dependencies", []):
            reverse_dependencies[dependency_id].add(dependent_id)

    def dependent_closure(rail_id: str) -> list[str]:
        seen: set[str] = set()
        stack = list(sorted(reverse_dependencies.get(rail_id, set()), reverse=True))
        while stack:
            candidate = stack.pop()
            if candidate in seen:
                continue
            seen.add(candidate)
            stack.extend(sorted(reverse_dependencies.get(candidate, set()), reverse=True))
        return sorted(seen)

    nodes: dict[str, dict[str, Any]] = {}
    edges: list[dict[str, Any]] = []
    edge_seen: set[tuple[str, str, str, str | None]] = set()

    def add_node(nid: str, kind: str, label: str, **extra: Any) -> None:
        nodes.setdefault(nid, {"id": nid, "kind": kind, "label": label, **extra})

    def add_edge(source: str, relation: str, target: str, event_id: str | None = None) -> None:
        key = (source, relation, target, event_id)
        if key in edge_seen:
            return
        edge_seen.add(key)
        row: dict[str, Any] = {"source": source, "relation": relation, "target": target}
        if event_id:
            row["event_id"] = event_id
        edges.append(row)

    for rid, rail in rails.items():
        rn = f"rail:{rid}"
        add_node(rn, "rail", str(rail["name"]), state=current[rid])
        owner = str(rail.get("owner") or "")
        if owner:
            oid = node_id("institution", owner)
            add_node(oid, "institution", owner)
            add_edge(oid, "OWNS_OR_STEWARDS", rn)
        for dep in rail.get("dependencies", []):
            add_edge(rn, "DEPENDS_ON", f"rail:{dep}")

    impacts: list[dict[str, Any]] = []
    by_subject: dict[str, list[dict[str, Any]]] = {}
    by_claim: dict[str, list[dict[str, Any]]] = {}

    for event in projected:
        eid = str(event["event_id"])
        en = f"event:{eid}"
        add_node(en, "event", str(event["canonical_event"]["title"]), event_at=event["event_at"])
        add_edge(en, "CHANGES", f"rail:{event['rail_id']}", eid)
        for related in event.get("related_rail_ids", []):
            add_edge(en, "RELATES_TO", f"rail:{related}", eid)
        for party in event.get("counterparties", []):
            pid = node_id("institution", str(party))
            add_node(pid, "institution", str(party))
            add_edge(pid, "PARTICIPATES_IN", en, eid)
        for network in event.get("networks", []):
            nid = node_id("network", str(network))
            add_node(nid, "network", str(network))
            add_edge(en, "USES_NETWORK", nid, eid)
        for asset in event.get("assets", []):
            aid = node_id("asset", str(asset))
            add_node(aid, "asset", str(asset))
            add_edge(en, "USES_ASSET", aid, eid)

        subjects = [str(x) for x in event.get("maintained_subjects", [])]
        claim_impacts = event.get("claim_impacts", [])
        direct_dependent_rail_ids = sorted(reverse_dependencies.get(event["rail_id"], set()))
        potential_dependent_rail_ids = dependent_closure(event["rail_id"])
        if subjects or claim_impacts or event.get("reverify_scope") or potential_dependent_rail_ids:
            impact = {
                "event_id": eid,
                "rail_id": event["rail_id"],
                "maintained_subjects": subjects,
                "claim_impacts": claim_impacts,
                "reverify_scope": event.get("reverify_scope", []),
                "direct_dependent_rail_ids": direct_dependent_rail_ids,
                "potential_dependent_rail_ids": potential_dependent_rail_ids,
                "dependency_propagation": "REVERIFY_ONLY",
                "relationship": "REVERIFICATION_SCOPE_ONLY",
                "authority_boundary": "This index proposes what Claim Maintenance and dependent rails may need to re-check. Dependency propagation never changes a rail state, creates a correction, or schedules work.",
            }
            impacts.append(impact)
            for dependent_rail_id in potential_dependent_rail_ids:
                add_edge(en, "MAY_REQUIRE_RAIL_REVERIFY", f"rail:{dependent_rail_id}", eid)
            for subject in subjects:
                by_subject.setdefault(subject, []).append(impact)
                sid = node_id("maintained_subject", subject)
                add_node(sid, "maintained_subject", subject)
                add_edge(en, "MAY_REQUIRE_REVERIFY", sid, eid)
            for claim in claim_impacts:
                if not isinstance(claim, dict) or not claim.get("claim_id"):
                    fail(f"event {eid}: claim_impacts rows require claim_id")
                claim_id = str(claim["claim_id"])
                by_claim.setdefault(claim_id, []).append(impact)
                cid = f"claim:{claim_id}"
                add_node(cid, "claim", claim_id)
                add_edge(en, "MAY_REQUIRE_REVERIFY", cid, eid)

    graph = {
        "schema": "csoai.institutional-rails-graph/0.1",
        "as_of": as_of,
        "authority_boundary": "Dependency graph only. Edge presence is not adoption, settlement, finality or endorsement unless the named event establishes that state.",
        "nodes": sorted(nodes.values(), key=lambda x: x["id"]),
        "edges": sorted(edges, key=lambda x: (x["source"], x["relation"], x["target"], x.get("event_id", ""))),
    }
    impact = {
        "schema": "csoai.institutional-rails-claim-impact/0.1",
        "as_of": as_of,
        "claim_authority": "/api/claims/register",
        "event_authority": "/api/institutional-rails-events",
        "rule": "Impact rows are re-verification hints only. Claim Maintenance remains the only authority for claim state; dependency propagation can name rails to re-check but never mutates their operational state.",
        "impacts": impacts,
        "by_subject": by_subject,
        "by_claim": by_claim,
    }
    source_rows = []
    for event in projected:
        source_kind = event["canonical_source"]["kind"]
        source_rows.append(
            {
                "event_id": event["event_id"],
                "rail_id": event["rail_id"],
                "related_rail_ids": event.get("related_rail_ids", []),
                "event_at": event["event_at"],
                "published_at": event.get("published_at"),
                "observed_at": event["observed_at"],
                "prior_state": event["prior_state"],
                "new_state": event["new_state"],
                "change_type": event["change_type"],
                "material_change_type": event["material_change_type"],
                "canonical_source": event["canonical_source"],
                "canonical_event": event["canonical_event"],
                "source_kind": source_kind,
                "source_plane": SOURCE_KIND_PLANES[source_kind],
                "source_role": "PRIMARY_CANONICAL",
                "dedup_key": event["dedup_key"],
                "classification_rule": "Source plane is descriptive provenance taxonomy only; it is not a source-quality score, ranking, endorsement or proof of the event claim.",
            }
        )
    source_plane_counts = Counter(row["source_plane"] for row in source_rows)
    sources = {
        "schema": "csoai.institutional-rails-sources/0.2",
        "as_of": as_of,
        "rule": "One row per canonical event discovery. Different implications of one source event are not duplicated. Source planes classify provenance type only; they do not rank source quality.",
        "source_planes": {
            "CODE_CONFIG_RELEASE": "Canonical code, runtime configuration, token registry, release or changelog evidence.",
            "PUBLIC_PROJECT_TRACKER": "Canonical public project issue/tracker evidence; issue presence is not release or deployment.",
            "REGULATORY_GOVERNMENT": "Official regulator or government filing, order, consultation or release.",
            "INSTITUTIONAL_ANNOUNCEMENT": "Official project, institution or market-infrastructure announcement/page.",
        },
        "counts": {
            "sources": len(source_rows),
            "by_plane": dict(sorted(source_plane_counts.items())),
        },
        "sources": source_rows,
    }

    settlement_rows = []
    for event in projected:
        if not any(
            key in event
            for key in ("transaction", "settlement", "finality", "settlement_boundary", "interoperability_boundary")
        ):
            continue
        settlement_rows.append(
            {
                "event_id": event["event_id"],
                "rail_id": event["rail_id"],
                "event_at": event["event_at"],
                "observed_at": event["observed_at"],
                "new_state": event["new_state"],
                "canonical_source": event["canonical_source"],
                "canonical_event": event["canonical_event"],
                "transaction": event.get("transaction"),
                "settlement": event.get("settlement"),
                "settlement_boundary": event.get("settlement_boundary"),
                "interoperability_boundary": event.get("interoperability_boundary"),
                "finality": event.get("finality"),
                "acceptance": event.get("acceptance"),
                "market_effect": event.get("market_effect", "UNMEASURED"),
                "does_not_prove": event.get("does_not_prove", []),
            }
        )
    settlements = {
        "schema": "csoai.institutional-rails-settlements/0.1",
        "as_of": as_of,
        "authority": "/api/institutional-rails-events",
        "rule": "A transaction is not settlement; settlement is not legal finality; settlement or finality is not delivery acceptance. Rows preserve those boundaries exactly as admitted.",
        "rows": settlement_rows,
        "counts": {
            "rows": len(settlement_rows),
            "with_transaction": sum(1 for row in settlement_rows if row.get("transaction")),
            "with_settlement": sum(1 for row in settlement_rows if row.get("settlement")),
            "with_measured_finality": sum(
                1
                for row in settlement_rows
                if isinstance(row.get("finality"), dict)
                and row["finality"].get("state") not in {None, "UNMEASURED"}
            ),
        },
    }

    regulatory_actions = []
    for event in projected:
        regulatory = event.get("regulatory")
        if not isinstance(regulatory, dict):
            continue
        regulatory_actions.append(
            {
                "event_id": event["event_id"],
                "rail_id": event["rail_id"],
                "event_at": event["event_at"],
                "observed_at": event["observed_at"],
                "canonical_source": event["canonical_source"],
                "canonical_event": event["canonical_event"],
                "regulatory": regulatory,
                "operational_state_before": event["prior_state"],
                "operational_state_after": event["new_state"],
                "operational_state_changed": event["prior_state"] != event["new_state"],
                "next_tripwire": event.get("next_tripwire"),
                "does_not_prove": event.get("does_not_prove", []),
            }
        )
    regulatory_rails = [
        {
            "rail_id": rid,
            "name": rail["name"],
            "owner": rail["owner"],
            "class": rail["class"],
            "current_operational_state": current[rid],
            "last_event_id": last_event.get(rid, {}).get("event_id"),
        }
        for rid, rail in sorted(rails.items())
        if "regulation" in str(rail.get("class", "")).lower()
        or str(rail.get("class", "")).lower().startswith("regulatory")
    ]
    regulatory_view = {
        "schema": "csoai.institutional-rails-regulatory/0.1",
        "as_of": as_of,
        "authority": "/api/institutional-rails-events",
        "rule": "Regulatory action is orthogonal to operational maturity. Registration, exemption, approval, consultation or enforcement never implies deployment or transaction activity.",
        "actions": regulatory_actions,
        "regulatory_rails": regulatory_rails,
        "counts": {
            "actions": len(regulatory_actions),
            "regulatory_rails": len(regulatory_rails),
        },
    }

    history_by_rail: dict[str, list[dict[str, Any]]] = {rid: [] for rid in rails}
    related_history_by_rail: dict[str, list[dict[str, Any]]] = {rid: [] for rid in rails}
    for event in projected:
        row = {
            "seq": event["seq"],
            "event_id": event["event_id"],
            "event_status": event["event_status"],
            "event_at": event["event_at"],
            "event_time_precision": event["event_time_precision"],
            "published_at": event.get("published_at"),
            "observed_at": event["observed_at"],
            "prior_state": event["prior_state"],
            "new_state": event["new_state"],
            "change_type": event["change_type"],
            "material_change_type": event["material_change_type"],
            "canonical_source": event["canonical_source"],
            "canonical_event": event["canonical_event"],
            "blockers": event.get("blockers", []),
            "next_tripwire": event.get("next_tripwire"),
            "corrects_event_id": event.get("corrects_event_id"),
            "market_effect": event.get("market_effect", "UNMEASURED"),
            "does_not_prove": event.get("does_not_prove", []),
        }
        history_by_rail[event["rail_id"]].append(row)
        for related_rail_id in event.get("related_rail_ids", []):
            related_history_by_rail[related_rail_id].append(
                {
                    **row,
                    "primary_rail_id": event["rail_id"],
                    "relationship": "RELATED_EVIDENCE_ONLY",
                }
            )
    history = {
        "schema": "csoai.institutional-rails-history/0.1",
        "as_of": as_of,
        "authority": "/api/institutional-rails-events",
        "rule": "Direct history can advance only the named rail when the admitted event does so. Related history is evidence context only and never advances the related rail.",
        "rails": [
            {
                "rail_id": rid,
                "name": rails[rid]["name"],
                "current_state": current[rid],
                "direct_events": history_by_rail[rid],
                "related_events": related_history_by_rail[rid],
            }
            for rid in sorted(rails)
        ],
    }

    participants: dict[str, dict[str, Any]] = {}

    def participant(label: str) -> dict[str, Any]:
        key = label.strip().lower()
        row = participants.setdefault(
            key,
            {
                "name": label,
                "owned_or_stewarded_rail_ids": set(),
                "event_ids": set(),
                "rail_ids": set(),
                "roles": set(),
            },
        )
        return row

    for rid, rail in rails.items():
        owner = str(rail.get("owner") or "").strip()
        if owner:
            row = participant(owner)
            row["owned_or_stewarded_rail_ids"].add(rid)
            row["rail_ids"].add(rid)
            row["roles"].add("OWNER_OR_STEWARD")
    for event in projected:
        for party in event.get("counterparties", []):
            row = participant(str(party))
            row["event_ids"].add(event["event_id"])
            row["rail_ids"].add(event["rail_id"])
            row["roles"].add("EVENT_PARTICIPANT")
            for related_rail_id in event.get("related_rail_ids", []):
                row["rail_ids"].add(related_rail_id)

    participant_rows = []
    for row in participants.values():
        participant_rows.append(
            {
                "name": row["name"],
                "owned_or_stewarded_rail_ids": sorted(row["owned_or_stewarded_rail_ids"]),
                "event_ids": sorted(row["event_ids"]),
                "rail_ids": sorted(row["rail_ids"]),
                "roles": sorted(row["roles"]),
            }
        )
    participant_rows.sort(key=lambda row: row["name"].lower())
    participant_view = {
        "schema": "csoai.institutional-rails-participants/0.1",
        "as_of": as_of,
        "authority": "/api/institutional-rails-events + /api/institutional-rails",
        "rule": "Participant presence records only named ownership/stewardship or participation in admitted events. It is not endorsement, adoption, contractual privity or production usage unless the event itself establishes that fact.",
        "participants": participant_rows,
        "counts": {
            "participants": len(participant_rows),
            "with_event_participation": sum(1 for row in participant_rows if row["event_ids"]),
            "with_owned_or_stewarded_rails": sum(1 for row in participant_rows if row["owned_or_stewarded_rail_ids"]),
        },
    }

    gap_rows = []
    snapshot_by_id = {row["id"]: row for row in snapshot_rows}
    for rid in sorted(rails):
        current_state = current[rid]
        rank = STATE_RANK[current_state]
        next_state = STATES[rank + 1] if rank + 1 < len(STATES) else None
        row = snapshot_by_id[rid]
        gap_rows.append(
            {
                "rail_id": rid,
                "name": rails[rid]["name"],
                "current_state": current_state,
                "current_state_rank": rank,
                "next_constitutional_state": next_state,
                "default_next_evidence_fields": list(REQUIRED_EVIDENCE.get(next_state, ())) if next_state else [],
                "explicit_blockers": row.get("blockers", []),
                "next_tripwire": row.get("next_tripwire"),
                "evidence_presence": row.get("evidence_presence"),
                "direct_dependent_rail_ids": sorted(reverse_dependencies.get(rid, set())),
                "potential_dependent_rail_ids": dependent_closure(rid),
                "complete_under_state_model": next_state is None,
                "rule": "The next constitutional state is a descriptive boundary, not a forecast or required sequence. Direct evidence may establish a higher state without fabricating intermediate evidence.",
            }
        )
    gaps = {
        "schema": "csoai.institutional-rails-gaps/0.1",
        "as_of": as_of,
        "authority": "/api/institutional-rails + /api/institutional-rails-events",
        "rule": "Gap rows name the next state boundary and explicit blockers/tripwires. They do not predict that the next state will occur, require sequential progression, or schedule any work.",
        "rows": gap_rows,
        "counts": {
            "rails": len(gap_rows),
            "with_explicit_blockers": sum(1 for row in gap_rows if row["explicit_blockers"]),
            "with_tripwire": sum(1 for row in gap_rows if row["next_tripwire"]),
            "at_final_state": sum(1 for row in gap_rows if row["complete_under_state_model"]),
        },
    }

    freshness_rows = []
    for event in projected:
        event_delay = exact_delay_seconds(event["event_at"], event["observed_at"])
        publication_delay = exact_delay_seconds(event.get("published_at"), event["observed_at"])
        freshness_rows.append(
            {
                "event_id": event["event_id"],
                "rail_id": event["rail_id"],
                "event_at": event["event_at"],
                "event_time_precision": event["event_time_precision"],
                "published_at": event.get("published_at"),
                "observed_at": event["observed_at"],
                "event_to_observation_delay_seconds": event_delay,
                "publication_to_observation_delay_seconds": publication_delay,
                "event_delay_measurement": "EXACT" if event_delay is not None else "UNCOMPUTED_COARSE_EVENT_TIME",
                "publication_delay_measurement": "EXACT" if publication_delay is not None else "UNCOMPUTED_COARSE_OR_ABSENT_PUBLICATION_TIME",
                "rule": "Delay is source/event observation lag only. It is not causal lead-lag, a market reaction, source freshness at request time, or evidence that an event was first discovered by CSOAI.",
            }
        )
    exact_event_delays = [
        row["event_to_observation_delay_seconds"]
        for row in freshness_rows
        if row["event_to_observation_delay_seconds"] is not None
    ]
    freshness = {
        "schema": "csoai.institutional-rails-freshness/0.1",
        "as_of": as_of,
        "authority": "/api/institutional-rails-events",
        "rule": "Only fully timestamped instants receive an exact delay. Day/month/quarter/year precision is never converted into a fake hour-level lag.",
        "rows": freshness_rows,
        "counts": {
            "events": len(freshness_rows),
            "exact_event_delay": len(exact_event_delays),
            "coarse_event_time_uncomputed": sum(
                1 for row in freshness_rows if row["event_to_observation_delay_seconds"] is None
            ),
            "exact_publication_delay": sum(
                1 for row in freshness_rows if row["publication_to_observation_delay_seconds"] is not None
            ),
        },
        "exact_event_delay_summary_seconds": {
            "minimum": min(exact_event_delays) if exact_event_delays else None,
            "maximum": max(exact_event_delays) if exact_event_delays else None,
        },
    }

    scheduled_rows = []
    for event in projected:
        if event["event_status"] != "SCHEDULED":
            continue
        seconds_until = exact_delay_seconds(as_of, event["event_at"])
        if seconds_until is None:
            relation = "COARSE_TIME_UNCOMPUTED"
            within_window = None
        elif 86400 <= seconds_until <= 259200:
            relation = "WITHIN_24_72H_AS_OF"
            within_window = True
        elif seconds_until < 0:
            relation = "PAST_DUE_AS_OF"
            within_window = False
        else:
            relation = "FUTURE_OUTSIDE_24_72H_AS_OF"
            within_window = False
        scheduled_rows.append(
            {
                "event_id": event["event_id"],
                "rail_id": event["rail_id"],
                "event_at": event["event_at"],
                "event_time_precision": event["event_time_precision"],
                "observed_at": event["observed_at"],
                "canonical_event": event["canonical_event"],
                "canonical_source": event["canonical_source"],
                "change_type": event["change_type"],
                "material_change_type": event["material_change_type"],
                "prior_state": event["prior_state"],
                "new_state": event["new_state"],
                "seconds_until_event_as_of": seconds_until,
                "window_measurement": "EXACT" if seconds_until is not None else "UNCOMPUTED_COARSE_EVENT_TIME",
                "temporal_relation_as_of": relation,
                "within_24_72h_as_of": within_window,
                "market_effect": event.get("market_effect", "UNMEASURED"),
                "rule": "Scheduled evidence cannot advance rail state and does not imply the event will occur or produce a market effect.",
            }
        )
    schedule = {
        "schema": "csoai.institutional-rails-schedule/0.1",
        "as_of": as_of,
        "authority": "/api/institutional-rails-events",
        "rule": "The 24-72 hour window is measured only from committed exact timestamps relative to ledger as_of, never from request time. Coarse dates remain uncomputed.",
        "rows": scheduled_rows,
        "counts": {
            "scheduled_events": len(scheduled_rows),
            "exact_window": sum(1 for row in scheduled_rows if row["window_measurement"] == "EXACT"),
            "within_24_72h_as_of": sum(1 for row in scheduled_rows if row["within_24_72h_as_of"] is True),
            "coarse_time_uncomputed": sum(1 for row in scheduled_rows if row["within_24_72h_as_of"] is None),
        },
    }

    event_by_id = {event["event_id"]: event for event in projected}
    question_rows = []
    for gap in gap_rows:
        tripwire = gap.get("next_tripwire")
        if isinstance(tripwire, dict):
            basis_event_id = snapshot_by_id[gap["rail_id"]].get("last_event_id")
            basis_event = event_by_id.get(basis_event_id) if basis_event_id else None
            basis_observed_at = basis_event.get("observed_at") if basis_event else snapshot_by_id[gap["rail_id"]].get("as_of")
            qkey = sha256_text(canonical_json(["TRIPWIRE_CONFIRMATION", gap["rail_id"], basis_event_id, tripwire]))
            question_rows.append(
                {
                    "question_id": f"irq-{qkey[:20]}",
                    "question_class": "TRIPWIRE_CONFIRMATION",
                    "status": "OPEN_RESEARCH_QUESTION",
                    "rail_id": gap["rail_id"],
                    "basis_event_id": basis_event_id,
                    "basis_observed_at": basis_observed_at,
                    "dependent_rail_id": None,
                    "question": f"Has new primary-source evidence satisfied the {tripwire.get('kind', 'named')} tripwire for {gap['rail_id']} since the basis observation?",
                    "evidence_condition": tripwire,
                    "market_effect": "UNMEASURED",
                    "relationship": "EVIDENCE_CONFIRMATION_ONLY",
                    "authority_boundary": "This is an answerable research question, not a forecast, alert, task assignment, scheduler or state transition.",
                }
            )
    for impact_row in impacts:
        basis_event = event_by_id.get(impact_row["event_id"])
        for dependent_rail_id in impact_row.get("potential_dependent_rail_ids", []):
            qkey = sha256_text(
                canonical_json(
                    [
                        "DEPENDENCY_REVERIFICATION",
                        impact_row["event_id"],
                        impact_row["rail_id"],
                        dependent_rail_id,
                    ]
                )
            )
            question_rows.append(
                {
                    "question_id": f"irq-{qkey[:20]}",
                    "question_class": "DEPENDENCY_REVERIFICATION",
                    "status": "OPEN_RESEARCH_QUESTION",
                    "rail_id": impact_row["rail_id"],
                    "basis_event_id": impact_row["event_id"],
                    "basis_observed_at": basis_event.get("observed_at") if basis_event else None,
                    "dependent_rail_id": dependent_rail_id,
                    "question": f"Has {dependent_rail_id} acquired new direct evidence since the basis event on {impact_row['rail_id']} that changes what must be re-verified?",
                    "evidence_condition": {
                        "kind": "new_direct_evidence_after_basis_observation",
                        "detail": "A newly admitted direct event on the dependent rail; related evidence alone does not advance maturity.",
                    },
                    "market_effect": "UNMEASURED",
                    "relationship": "NON_CAUSAL_REVERIFICATION_ONLY",
                    "authority_boundary": "Dependency order does not prove causation. This question asks only whether new direct evidence changes the bounded re-verification scope.",
                }
            )
    question_rows.sort(key=lambda row: (row["question_class"], row["rail_id"], row.get("dependent_rail_id") or "", row["question_id"]))
    questions = {
        "schema": "csoai.institutional-rails-questions/0.1",
        "as_of": as_of,
        "authority": "/api/institutional-rails-events + /api/institutional-rails-gaps + /api/institutional-rails-impact",
        "rule": "Questions are derived research prompts only. They carry no probability, market prediction, causal inference, notification state or execution instruction.",
        "rows": question_rows,
        "counts": {
            "questions": len(question_rows),
            "tripwire_confirmation": sum(1 for row in question_rows if row["question_class"] == "TRIPWIRE_CONFIRMATION"),
            "dependency_reverification": sum(1 for row in question_rows if row["question_class"] == "DEPENDENCY_REVERIFICATION"),
        },
    }

    materiality_rows = []
    for event in projected:
        bases = []
        if event["prior_state"] != event["new_state"]:
            bases.append("STATE_CHANGED")
        if event["change_type"] == "BLOCKER_CHANGED":
            bases.append("BLOCKER_CHANGED")
        if event["change_type"] == "CORRECTION":
            bases.append("CORRECTION")
        if event["change_type"] == "DEADLINE":
            bases.append("DEADLINE")
        if event["change_type"] == "SCOPE_CHANGE":
            bases.append("SCOPE_CHANGED")
        if isinstance(event.get("regulatory"), dict):
            bases.append("REGULATORY_EVIDENCE")
        if isinstance(event.get("transaction"), dict):
            bases.append("TRANSACTION_EVIDENCE")
        if isinstance(event.get("settlement"), dict):
            bases.append("SETTLEMENT_EVIDENCE")
        if (
            isinstance(event.get("finality"), dict)
            and event["finality"].get("state") not in {None, "UNMEASURED"}
        ):
            bases.append("FINALITY_EVIDENCE")
        if event.get("next_tripwire"):
            bases.append("EXPLICIT_TRIPWIRE")
        if not bases:
            bases.append("SUPPORTING_EVIDENCE_ONLY")

        review_required = any(
            basis != "SUPPORTING_EVIDENCE_ONLY"
            for basis in bases
        )
        materiality_rows.append(
            {
                "event_id": event["event_id"],
                "rail_id": event["rail_id"],
                "event_at": event["event_at"],
                "observed_at": event["observed_at"],
                "change_type": event["change_type"],
                "material_change_type": event["material_change_type"],
                "prior_state": event["prior_state"],
                "new_state": event["new_state"],
                "materiality_basis": bases,
                "materiality_review_required": review_required,
                "near_term_thesis_effect": "UNMEASURED",
                "notification_decision": "NOT_MADE",
                "market_effect": event.get("market_effect", "UNMEASURED"),
                "realert_key": event["event_id"],
                "realert_rule": "The same event_id is not a new discovery. Re-alert requires a new admitted event, a correction, changed blocker, or newly actionable deadline evidence.",
                "authority_boundary": "This row decides only whether bounded materiality review is warranted. It does not decide that the thesis changed, that a market effect exists, or that a notification should be sent.",
            }
        )
    materiality = {
        "schema": "csoai.institutional-rails-materiality/0.1",
        "as_of": as_of,
        "authority": "/api/institutional-rails-events",
        "rule": "Materiality review eligibility is deterministic; thesis effect and notification remain undecided. No row is itself an alert.",
        "rows": materiality_rows,
        "counts": {
            "events": len(materiality_rows),
            "review_required": sum(1 for row in materiality_rows if row["materiality_review_required"]),
            "supporting_evidence_only": sum(1 for row in materiality_rows if not row["materiality_review_required"]),
            "notification_decisions_made": sum(1 for row in materiality_rows if row["notification_decision"] != "NOT_MADE"),
        },
    }

    code_plane_view = copy.deepcopy(code_plane_baseline)
    code_plane_view["counts"] = {
        "sources": len(code_plane_view.get("sources", [])),
        "changes": len(code_plane_view.get("changes", [])),
        "failures": len(code_plane_view.get("failures", [])),
        "review_required_sources": sum(
            1 for row in code_plane_view.get("sources", [])
            if row.get("promotion_state") == "REVIEW_REQUIRED"
        ),
    }
    code_plane_view["authority_boundary"] = (
        "This is a committed manual code-plane observation. It performs no request-time fetch, "
        "cannot write the canonical rail ledger, and every source remains REVIEW_REQUIRED."
    )

    coverage_rows = []
    for target in watch_universe["targets"]:
        expected = list(target["expected_rail_ids"])
        present = [rid for rid in expected if rid in snapshot_by_id]
        missing = [rid for rid in expected if rid not in snapshot_by_id]
        if not missing:
            coverage_state = "COMPLETE"
        elif not present:
            coverage_state = "MISSING"
        else:
            coverage_state = "PARTIAL"
        coverage_rows.append(
            {
                "target_id": target["id"],
                "label": target["label"],
                "scope": target["scope"],
                "expected_rail_ids": expected,
                "present_rail_ids": present,
                "missing_rail_ids": missing,
                "coverage": coverage_state,
                "current_states": {
                    rid: snapshot_by_id[rid]["current_state"]
                    for rid in present
                },
                "direct_events": sum(
                    snapshot_by_id[rid]["evidence_presence"]["direct_events"]
                    for rid in present
                ),
                "related_events": sum(
                    snapshot_by_id[rid]["evidence_presence"]["related_events"]
                    for rid in present
                ),
                "rule": "Catalogue/event coverage only. Presence does not prove deployment, live use, transaction activity, settlement, finality or global completeness.",
            }
        )
    coverage = {
        "schema": "csoai.institutional-rails-coverage/0.1",
        "as_of": as_of,
        "universe_as_of": watch_universe.get("as_of"),
        "rule": watch_universe.get("rule"),
        "rows": coverage_rows,
        "counts": {
            "targets": len(coverage_rows),
            "core_targets": sum(1 for row in coverage_rows if row["scope"] == "core"),
            "adjacent_targets": sum(1 for row in coverage_rows if row["scope"] == "adjacent"),
            "complete": sum(1 for row in coverage_rows if row["coverage"] == "COMPLETE"),
            "partial": sum(1 for row in coverage_rows if row["coverage"] == "PARTIAL"),
            "missing": sum(1 for row in coverage_rows if row["coverage"] == "MISSING"),
        },
    }

    history_by_rail = {row["rail_id"]: row for row in history["rails"]}
    gap_by_rail = {row["rail_id"]: row for row in gaps["rows"]}
    review_rows = []
    for rail in snapshot_rows:
        rid = rail["id"]
        direct_sources = [row for row in sources["sources"] if row["rail_id"] == rid]
        related_sources = [row for row in sources["sources"] if rid in row.get("related_rail_ids", [])]
        rail_freshness = [row for row in freshness_rows if row["rail_id"] == rid]
        rail_schedule = [row for row in scheduled_rows if row["rail_id"] == rid]
        rail_questions = [
            row for row in question_rows
            if row["rail_id"] == rid or row.get("dependent_rail_id") == rid
        ]
        rail_materiality = [row for row in materiality_rows if row["rail_id"] == rid]
        rail_regulatory = [row for row in regulatory_actions if row["rail_id"] == rid]
        rail_settlements = [row for row in settlement_rows if row["rail_id"] == rid]
        rail_participants = [
            row for row in participant_rows
            if rid in row.get("rail_ids", []) or rid in row.get("owned_or_stewarded_rail_ids", [])
        ]
        rail_code_sources = [
            row for row in code_plane_view.get("sources", [])
            if rid in row.get("rail_ids", [])
        ]
        rail_code_changes = [
            row for row in code_plane_view.get("changes", [])
            if rid in row.get("rail_ids", [])
        ]
        rail_coverage_targets = [
            row for row in coverage_rows
            if rid in row.get("expected_rail_ids", [])
        ]
        thesis_states = sorted({row["near_term_thesis_effect"] for row in rail_materiality})
        notification_states = sorted({row["notification_decision"] for row in rail_materiality})
        review_rows.append(
            {
                "rail_id": rid,
                "name": rail["name"],
                "as_of": rail["as_of"],
                "current_state": rail["current_state"],
                "snapshot": rail,
                "history": history_by_rail[rid],
                "provenance": {
                    "direct_sources": direct_sources,
                    "related_sources": related_sources,
                    "rule": "Related provenance is context only and cannot advance this rail's state.",
                },
                "settlement_rows": rail_settlements,
                "regulatory_actions": rail_regulatory,
                "participants": rail_participants,
                "code_plane": {
                    "sources": rail_code_sources,
                    "changes": rail_code_changes,
                    "rule": "Code-plane rows remain REVIEW_REQUIRED and cannot promote rail state without a separately admitted canonical event.",
                },
                "coverage_targets": rail_coverage_targets,
                "gap": gap_by_rail[rid],
                "freshness_rows": rail_freshness,
                "scheduled_rows": rail_schedule,
                "questions": rail_questions,
                "materiality_rows": rail_materiality,
                "review_summary": {
                    "direct_events": len(history_by_rail[rid]["direct_events"]),
                    "related_events": len(history_by_rail[rid]["related_events"]),
                    "direct_sources": len(direct_sources),
                    "related_sources": len(related_sources),
                    "direct_source_planes": dict(sorted(Counter(row["source_plane"] for row in direct_sources).items())),
                    "related_source_planes": dict(sorted(Counter(row["source_plane"] for row in related_sources).items())),
                    "code_plane_sources": len(rail_code_sources),
                    "code_plane_changes": len(rail_code_changes),
                    "watch_targets": len(rail_coverage_targets),
                    "explicit_blockers": len(gap_by_rail[rid]["explicit_blockers"]),
                    "open_questions": len(rail_questions),
                    "scheduled_events": len(rail_schedule),
                    "scheduled_24_72h_as_of": sum(1 for row in rail_schedule if row["within_24_72h_as_of"] is True),
                    "materiality_reviews": sum(1 for row in rail_materiality if row["materiality_review_required"]),
                    "near_term_thesis_effect_states": thesis_states or ["UNMEASURED"],
                    "notification_decision_states": notification_states or ["NOT_MADE"],
                },
                "authority_boundary": "This packet is a deterministic join over existing authorities. It creates no new event, state, causal claim, alert, task, schedule, signature or anchor.",
            }
        )
    review = {
        "schema": "csoai.institutional-rails-review/0.1",
        "as_of": as_of,
        "authority": "join-only: snapshot + history + sources + settlements + regulatory + participants + code-plane + coverage + gaps + freshness + schedule + questions + materiality",
        "rule": "Review packets consolidate already-admitted evidence. Source endpoints remain authoritative and the packet cannot promote state or decide notification.",
        "rows": review_rows,
        "counts": {
            "rails": len(review_rows),
            "with_open_questions": sum(1 for row in review_rows if row["review_summary"]["open_questions"] > 0),
            "with_explicit_blockers": sum(1 for row in review_rows if row["review_summary"]["explicit_blockers"] > 0),
            "with_scheduled_24_72h_as_of": sum(1 for row in review_rows if row["review_summary"]["scheduled_24_72h_as_of"] > 0),
        },
    }

    spec = {
        "schema": "csoai.institutional-rail-state-model/0.1",
        "name": "Institutional Financial Rail Evidence State Model",
        "version": "0.1",
        "states": [{"state": s, "rank": STATE_RANK[s], "meaning": STATE_DOC[s]} for s in STATES],
        "change_types": sorted(CHANGE_TYPES),
        "event_statuses": sorted(EVENT_STATUSES),
        "orthogonal_states": {
            "acceptance": ["UNMEASURED", "OBSERVED", "NOT_APPLICABLE"],
            "regulatory_action": "Registration, exemption, approval, consultation, order or enforcement is recorded independently from operational maturity.",
            "market_effect": "UNMEASURED unless separately evidenced; no price or market reaction is implied by a rail transition.",
        },
        "hard_boundaries": [
            "reachability is not subject measurement",
            "proposal is not deployment",
            "merge or release is not deployment",
            "deployment is not live use",
            "live use is not a transaction",
            "transaction is not settlement",
            "settlement is not legal finality",
            "settlement or finality is not proof of delivery or acceptance",
        ],
    }

    derived_docs = {
        "snapshot": (OUT / "snapshot.json", snapshot),
        "graph": (OUT / "graph.json", graph),
        "impact": (OUT / "impact.json", impact),
        "sources": (OUT / "sources.json", sources),
        "settlements": (OUT / "settlements.json", settlements),
        "regulatory": (OUT / "regulatory.json", regulatory_view),
        "history": (OUT / "history.json", history),
        "participants": (OUT / "participants.json", participant_view),
        "gaps": (OUT / "gaps.json", gaps),
        "freshness": (OUT / "freshness.json", freshness),
        "schedule": (OUT / "schedule.json", schedule),
        "questions": (OUT / "questions.json", questions),
        "materiality": (OUT / "materiality.json", materiality),
        "code_plane": (OUT / "code-plane.json", code_plane_view),
        "coverage": (OUT / "coverage.json", coverage),
        "review": (OUT / "review.json", review),
        "state_model": (SPEC / "index.json", spec),
    }
    derived_bytes = {
        name: (json.dumps(doc, indent=2, sort_keys=True) + "\n").encode()
        for name, (_path, doc) in derived_docs.items()
    }

    feed_sha = sha256_bytes(feed)
    source_events_bytes = SOURCE_EVENTS.read_bytes() if SOURCE_EVENTS.exists() else b""
    catalog_bytes = CATALOG.read_bytes() if CATALOG.exists() else b""
    code_plane_bytes = CODE_PLANE_BASELINE.read_bytes() if CODE_PLANE_BASELINE.exists() else b""
    watch_universe_bytes = WATCH_UNIVERSE.read_bytes() if WATCH_UNIVERSE.exists() else b""
    manifest = {
        "schema": "csoai.institutional-rail-ledger-head/0.1",
        "as_of": as_of,
        "status": "UNSIGNED_CANDIDATE",
        "feed": {
            "path": "/interop/institutional-rails/v0.1/events.jsonl",
            "n_lines": len(projected),
            "bytes": len(feed),
            "bytes_sha256": feed_sha,
            "head_line_sha256": prev_sha,
            "first_observed_at": min(observed) if observed else None,
            "last_observed_at": max(observed) if observed else None,
        },
        "artifacts": {
            name: {
                "path": "/" + str(path.relative_to(ROOT / "public")),
                "bytes": len(derived_bytes[name]),
                "bytes_sha256": sha256_bytes(derived_bytes[name]),
            }
            for name, (path, _doc) in sorted(derived_docs.items())
        },
        "source": {
            "catalog": {"path": "data/institutional-rails/rails.json", "sha256": sha256_bytes(catalog_bytes)},
            "events": {"path": "data/institutional-rails/events.source.jsonl", "sha256": sha256_bytes(source_events_bytes)},
            "code_plane_baseline": {
                "path": "data/institutional-rails/code-plane-baseline-2026-10-01.json",
                "sha256": sha256_bytes(code_plane_bytes),
                "role": "manual read-only code-before-news companion; REVIEW_REQUIRED only",
            },
            "watch_universe": {
                "path": "data/institutional-rails/watch-universe.json",
                "sha256": sha256_bytes(watch_universe_bytes),
                "role": "bounded scope declaration; not a global completeness claim",
            },
        },
        "producer": {"path": "scripts/institutional_rails.py", "sha256": producer_sha},
        "rules": {
            "append_only": "Once generated, existing events.jsonl bytes must remain an exact prefix. Corrections append; they do not rewrite.",
            "dedup": "One canonical source event maps to one ledger discovery. Different implications are represented on that event, not as duplicate discoveries.",
            "derived_artifacts": "Every listed derived artifact is exact-byte bound into this unsigned manifest. Verification of that binding is not a signature, anchor, public readback or proof of subject truth.",
            "freshness": "observed_at comes from the source event. API request time is never substituted.",
            "scheduled": "Scheduled events cannot advance state.",
            "evidence": "Proposal, code, release, configuration, deployment, live use, transaction, settlement and finality are separate states.",
            "acceptance": "Delivery or receiving-party acceptance is orthogonal and never inferred from settlement or finality.",
            "execution": "read_only; no deployment, signing, anchoring, trade, payment, outreach or scheduler is performed by this ledger.",
        },
    }

    outputs = {
        OUT / "events.jsonl": feed,
        OUT / "manifest.json": (json.dumps(manifest, indent=2, sort_keys=True) + "\n").encode(),
    }
    outputs.update({
        path: derived_bytes[name]
        for name, (path, _doc) in derived_docs.items()
    })
    return outputs

def assert_append_only(path: Path, candidate: bytes) -> None:
    if not path.exists():
        return
    old = path.read_bytes()
    if not candidate.startswith(old):
        fail(f"{path}: existing public ledger is not an exact prefix; append a correction or version the schema")

def write_outputs(outputs: dict[Path, bytes], check: bool) -> int:
    drift: list[str] = []
    for path, body in outputs.items():
        if check:
            if not path.exists() or path.read_bytes() != body:
                drift.append(str(path.relative_to(ROOT)))
            continue
        if path.name == "events.jsonl":
            assert_append_only(path, body)
        path.parent.mkdir(parents=True, exist_ok=True)
        if not path.exists() or path.read_bytes() != body:
            path.write_bytes(body)
            print(f"wrote {path.relative_to(ROOT)}")
    if drift:
        for item in drift:
            print(f"DRIFT {item}", file=sys.stderr)
        return 1
    return 0

def build(check: bool = False) -> int:
    catalog = load_json(CATALOG)
    events = load_jsonl(SOURCE_EVENTS)
    producer_sha = sha256_bytes(Path(__file__).read_bytes())
    outputs = render(catalog, events, producer_sha)
    return write_outputs(outputs, check)

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    try:
        return build(check=args.check)
    except ValueError as exc:
        print(f"institutional-rails: {exc}", file=sys.stderr)
        return 2

if __name__ == "__main__":
    raise SystemExit(main())
