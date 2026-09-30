#!/usr/bin/env python3
import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = ROOT / "public/spec/claim-maintenance/market-signals-2026-09-30.json"
DEFAULT_OUTPUT = ROOT / "public/spec/claim-maintenance/reaction-index.json"

ALLOWED = {
    "ADJACENT_VALIDATES_DEMAND",
    "INTEGRATION_CANDIDATE",
    "RESEARCH_VALIDATES_PRIMITIVES",
    "ADJACENT_RUNTIME_COMPLEMENT",
    "CATEGORY_COLLISION",
}
RESPONSES = {
    "ADJACENT_VALIDATES_DEMAND": "Do not pivot. Track vocabulary and buyer expectations; preserve the claim-level dependency/correction distinction.",
    "INTEGRATION_CANDIDATE": "Evaluate as an adapter or witness rail. Do not collapse its trust claim into Claim Maintenance.",
    "RESEARCH_VALIDATES_PRIMITIVES": "Compare methods and cite useful primitives. Keep CSOAI measurements independently reproducible.",
    "ADJACENT_RUNTIME_COMPLEMENT": "Treat as a Layer O runtime complement, not a Claim Maintenance substitute.",
    "CATEGORY_COLLISION": "Open a bounded category comparison immediately: definition, first publication, schema, correction semantics, dependency graph and public implementation.",
}
COUNTER_COMPARE_FIELDS = [
    "category_definition",
    "first_publication_record",
    "machine_schema",
    "correction_and_supersession_semantics",
    "dependency_graph_semantics",
    "runnable_public_implementation",
]
CLAIM_CEILING_RULE = (
    "Never promote a claim or effect state beyond the strongest producing boundary supported by observed evidence. "
    "Identity, authorization, payment, settlement, delivery, execution and acceptance remain distinct until each is evidenced."
)
LAYER_O_ROUTE_POLICY = {
    "IDENTITY_ATTESTATION": "Bind runtime/workload identity as an input to evidence, never as proof that an action was correct.",
    "STATUS_REVOCATION": "Use external status/revocation semantics to propagate supersession or withdrawal state without rewriting prior evidence.",
    "DEPENDENCY_GRAPH": "Translate statement/object relationships into SovSpace dependency edges and bounded re-verification triggers.",
    "TRANSPARENCY_WITNESS": "Use as an independent registration/timestamp/witness rail; keep witnessing separate from measurement correctness.",
    "ATTESTATION_ENVELOPE": "Wrap or translate portable evidence using a standard statement/predicate envelope without changing claim semantics.",
    "OBSERVABILITY": "Ingest traces/events as source evidence for reaction and replay; telemetry alone is not a finding.",
    "POLICY_RUNTIME": "Apply as a pre/post-execution runtime guard in Layer O; keep policy decisions separate from Claim Maintenance states.",
    "PROTOCOL_ADAPTER": "Expose or consume the capability through MCP/A2A/x402 without treating protocol reachability as measurement.",
    "EVIDENCE_INPUT": "Treat as a bounded public evidence source or market signal pending a more specific adapter.",
}
def layer_o_route(signal: dict) -> str:
    caps = set(signal.get("capabilities", []))
    if caps & {"workload_identity", "node_attestation", "workload_attestation", "x509_svid", "jwt_svid"}:
        return "IDENTITY_ATTESTATION"
    if caps & {"privacy_preserving_status", "credential_revocation_and_suspension", "status_list_versioning"}:
        return "STATUS_REVOCATION"
    if caps & {"statement_relationship_vocabulary", "protected_object_binding", "statement_graph_manifest"}:
        return "DEPENDENCY_GRAPH"
    if caps & {"signed_continuity_statement", "append_only_transparency_registration", "recovery_receipt", "rfc3161_timestamp", "onchain_root_anchor"}:
        return "TRANSPARENCY_WITNESS"
    if caps & {"subject_digest_binding", "typed_predicates", "simple_verification_result", "reference_predicate", "attestation_bundle"}:
        return "ATTESTATION_ENVELOPE"
    if caps & {"agent_observability", "genai_telemetry", "runtime_traces"}:
        return "OBSERVABILITY"
    if caps & {"policy_enforcement", "deterministic_policy_enforcement", "inline_policy_enforcement", "claim_ceiling", "producing_boundary_analysis", "control_topology"}:
        return "POLICY_RUNTIME"
    if caps & {"hosted_mcp", "mcp_a2a_gateway", "x402_marketplace", "a2a_registry_api", "task_conformance_probe", "agent_card_schema_validation"}:
        return "PROTOCOL_ADAPTER"
    return "EVIDENCE_INPUT"
def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

def classify(signal: dict) -> str:
    caps = set(signal.get("capabilities", []))
    overlap = set(signal.get("overlap", []))
    name = str(signal.get("name", "")).strip().lower()
    if signal.get("category_phrase_use") is True or "claim maintenance" in name or {"verbatim_public_claim_capture", "scheduled_reread", "bounded_reverification"} <= caps:
        return "CATEGORY_COLLISION"
    if signal.get("kind") == "standard" and overlap:
        return "INTEGRATION_CANDIDATE"
    if signal.get("kind") == "research":
        return "RESEARCH_VALIDATES_PRIMITIVES"
    if signal.get("kind") == "commercial":
        return "ADJACENT_VALIDATES_DEMAND"
    if signal.get("kind") == "open_source" and (
        "policy_enforcement" in caps or "deterministic_policy_enforcement" in caps
    ):
        return "ADJACENT_RUNTIME_COMPLEMENT"
    if signal.get("kind") == "open_source" and overlap:
        return "INTEGRATION_CANDIDATE"
    return "ADJACENT_RUNTIME_COMPLEMENT"

def existing(path: str) -> dict:
    p = ROOT / path
    return {
        "path": "/" + path.replace("public/", ""),
        "exists": p.is_file(),
        "sha256": sha256(p) if p.is_file() else None,
    }
def build(source: dict) -> dict:
    dims = list(source["category_dimensions"])
    dimset = set(dims)
    ids = set()
    rows = []
    covered = set()
    for signal in source["signals"]:
        sid = signal["id"]
        if sid in ids:
            raise ValueError(f"duplicate signal id: {sid}")
        ids.add(sid)
        overlap = set(signal.get("overlap", []))
        unknown = overlap - dimset
        if unknown:
            raise ValueError(f"{sid}: unknown category dimensions {sorted(unknown)}")
        reaction = classify(signal)
        if reaction not in ALLOWED:
            raise ValueError(f"{sid}: unsupported reaction {reaction}")
        hint = signal.get("reaction_hint")
        if hint and hint != reaction:
            raise ValueError(f"{sid}: reaction_hint {hint} != computed {reaction}")
        covered |= overlap
        route = layer_o_route(signal)
        route_hint = signal.get("layer_o_route_hint")
        if route_hint and route_hint != route:
            raise ValueError(f"{sid}: layer_o_route_hint {route_hint} != computed {route}")
        row = {
            **signal,
            "reaction": reaction,
            "response": RESPONSES[reaction],
            "layer_o_route": route,
            "layer_o_route_policy": LAYER_O_ROUTE_POLICY[route],
            "overlap_count": len(overlap),
            "overlap_fraction": f"{len(overlap)}/{len(dims)}",
            "unmatched_claim_maintenance_dimensions": [d for d in dims if d not in overlap],
        }
        if reaction == "CATEGORY_COLLISION":
            row["counter_evidence_packet"] = {
                "schema": "csoai.claim-maintenance-counter-evidence/0.1",
                "purpose": "Bounded public-artifact comparison; not a legal-rights, misconduct, endorsement or equivalence finding.",
                "compare_fields": COUNTER_COMPARE_FIELDS,
                "external_source": signal.get("url"),
                "csoai_priority_record": "/spec/claim-maintenance/priority.json",
                "csoai_priority_snapshots": "/spec/claim-maintenance/priority-snapshots/index.json",
                "csoai_priority_root": "/spec/claim-maintenance/priority-root.json",
                "csoai_spec": "/spec/claim-maintenance/v0.2/",
                "csoai_schema": "/spec/claim-maintenance/v0.2/schema/claim-artifact-v0.2.schema.json",
                "csoai_reference_implementation": "/spec/claim-maintenance/v0.2/reference/claim-capture.mjs",
                "csoai_corrections": "/api/corrections",
                "acceptance_rule": "Compare public artifacts field by field, preserve unknowns, and do not infer legal rights or intent from phrase use or technical overlap.",
            }
        rows.append(row)

    max_overlap = max((row["overlap_count"] for row in rows), default=0)
    closest = [
        {"id": row["id"], "name": row["name"], "overlap_count": row["overlap_count"], "overlap": row.get("overlap", [])}
        for row in rows if row["overlap_count"] == max_overlap
    ]
    full_stack = [row["id"] for row in rows if row["overlap_count"] == len(dims)]
    route_counts = {}
    for row in rows:
        route_counts[row["layer_o_route"]] = route_counts.get(row["layer_o_route"], 0) + 1
    collision_rows = [row for row in rows if row["reaction"] == "CATEGORY_COLLISION"]

    snapshot_date = str(source.get("observed_at") or "undated").split("T", 1)[0]
    ownership = {
        "spec_index": existing("public/spec/claim-maintenance/index.json"),
        "spec_v0_2": existing("public/spec/claim-maintenance/v0.2/spec.json"),
        "schema_v0_2": existing("public/spec/claim-maintenance/v0.2/schema/claim-artifact-v0.2.schema.json"),
        "reference_v0_2": existing("public/spec/claim-maintenance/v0.2/reference/claim-capture.mjs"),
        "public_register": existing("public/spec/claim-maintenance/register.json"),
        "own_claims_register": existing("public/claims-register.json"),
        "corrections_feed": existing("public/interop/corrections-feed.json"),
        "root_history": existing("public/receipts/root-history.json"),
        "anchor_posture": existing("public/.well-known/anchor-posture.json"),
        "priority_record": {
            "path": "/spec/claim-maintenance/priority.json",
            "exists": (ROOT / "public/spec/claim-maintenance/priority.json").is_file(),
            "hash_intentionally_omitted": "Avoid circular dependency: historical priority.json hashes the reaction index from its own publication epoch; the reaction index references that witnessed record by path/state only.",
        },
        "priority_snapshot_index": {
            "path": "/spec/claim-maintenance/priority-snapshots/index.json",
            "exists": (ROOT / "public/spec/claim-maintenance/priority-snapshots/index.json").is_file(),
            "hash_intentionally_omitted": "Avoid circular dependency: the snapshot index records reaction hashes, so the reaction index references it by path/state only.",
        },
        "root_witness_latest": existing("public/interop/root-witness-latest.json"),
    }
    return {
        "schema": "csoai.claim-maintenance-reaction-index/0.1",
        "as_of": source["observed_at"],
        "source_snapshot": {
            "path": "/spec/claim-maintenance/market-signals-2026-09-30.json",
            "sha256": hashlib.sha256(
                json.dumps(source, sort_keys=True, separators=(",", ":")).encode()
            ).hexdigest(),
            "claim_boundary": source["claim_boundary"],
        },
        "category": {
            "name": "Claim Maintenance",
            "legal_ownership_claim": "NONE — the words have prior public uses; this index asserts contribution history and implementation scope, not trademark ownership.",
            "position": "CSOAI public-claim maintenance profile: independent third-party public-source observation + declared-versus-observed measurement + explicit failure states + supersession/corrections + signed/rooted/witnessed artifacts + dependent delivery.",
            "direct_name_collision_count_in_snapshot": len(collision_rows),
            "direct_name_collision_limit": "Phrase or category collision does not establish technical equivalence, legal ownership, infringement, endorsement or trademark status.",
            "dimensions": dims,
            "dimension_count": len(dims),
            "covered_by_any_adjacent_signal": [d for d in dims if d in covered],
            "dimensions_not_seen_anywhere_in_snapshot": [d for d in dims if d not in covered],
            "unmatched_in_adjacent_snapshot": [d for d in dims if d not in covered],
            "max_single_signal_overlap_count": max_overlap,
            "max_single_signal_overlap_fraction": f"{max_overlap}/{len(dims)}",
            "closest_single_signals": closest,
            "full_stack_collision_count": len(full_stack),
            "full_stack_collision_ids": full_stack,
            "bounded_synthesis": "Primitive overlap is broad across the market. The differentiation claim is the integrated combination and independent measurement role; no single reviewed signal is treated as equivalent unless it spans the full declared dimension set.",
        },
        "ownership_evidence": ownership,
        "priority_records": source.get("csoai_priority_records", []),
        "signals": rows,
        "reaction_policy": RESPONSES,
        "claim_ceiling": {
            "rule": CLAIM_CEILING_RULE,
            "layer_o_route": "POLICY_RUNTIME",
            "state": "POLICY_INPUT",
            "source_signal_ids": [row["id"] for row in rows if "claim_ceiling" in row.get("capabilities", []) or "control_topology" in row.get("capabilities", [])],
            "boundary": "A policy input constrains state promotion; it is not itself a measurement or finding.",
        },
        "counter_engine": {
            "schema": "csoai.claim-maintenance-counter-engine/0.1",
            "trigger": "CATEGORY_COLLISION",
            "packet_count": len(collision_rows),
            "compare_fields": COUNTER_COMPARE_FIELDS,
            "signal_ids": [row["id"] for row in collision_rows],
            "rule": "Emit a bounded public-artifact comparison packet for every category collision; preserve unknowns and keep legal-rights or intent conclusions outside this technical engine.",
        },
        "layer_o_routing": {
            "counts": dict(sorted(route_counts.items())),
            "policy": LAYER_O_ROUTE_POLICY,
            "meaning": "A deterministic adapter destination for each observed signal. Routing says where to evaluate or ingest a primitive; it is not an adoption, equivalence, endorsement, correctness, or measurement claim.",
        },
        "next_actions": [
            "Keep the category definition versioned and citable; never rewrite historical versions.",
            "Publish corrections to CSOAI's own claims as prominently as third-party claim changes.",
            "Bind signed artifacts to independent timestamp/transparency receipts without calling a pending stamp anchored.",
            "Treat runtime policy, agent observability and content provenance as Layer O inputs/adapters, not category substitutes.",
            "Trigger a bounded comparison only when a source directly implements the claim-maintenance dimensions or uses the category name.",
        ],
    }

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", default=str(DEFAULT_INPUT))
    ap.add_argument("--output", default=str(DEFAULT_OUTPUT))
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()
    source = json.loads(Path(args.input).read_text())
    result = build(source)
    rendered = json.dumps(result, indent=2, sort_keys=True) + "\n"
    out = Path(args.output)
    if args.check:
        if not out.exists() or out.read_text() != rendered:
            print("FAIL reaction-index drift")
            return 1
        print(
            "PASS reaction-index",
            f"signals={len(result['signals'])}",
            f"direct_collision={result['category']['direct_name_collision_count_in_snapshot']}",
            f"unmatched={len(result['category']['unmatched_in_adjacent_snapshot'])}",
        )
        return 0
    out.write_text(rendered)
    print(
        "wrote",
        out,
        f"signals={len(result['signals'])}",
        f"direct_collision={result['category']['direct_name_collision_count_in_snapshot']}",
    )
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
