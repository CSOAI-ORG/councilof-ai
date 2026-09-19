#!/usr/bin/env python3
"""Build an offline registry and reviewable job plan from existing evidence catalogs.

No collector runs, network calls, signatures, payments, or publication occur here.
Catalog rows are scoped identities, not a deduplicated count of real-world assets.
"""
from __future__ import annotations

import argparse
import ast
from collections import Counter, defaultdict
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import subprocess
import unicodedata


INPUTS = {
    "stablecoins": "public/interop/stablecoin-universe-2026-09/index.json",
    "stablecoin_sources": "public/interop/stablecoin-deep-2026-09/sources.json",
    "stablecoin_queue": "public/interop/stablecoin-universe-2026-09/promotion-queue.json",
    "xrpl": "public/interop/xrpl-16.json",
    "swift_seed": "public/interop/swift-17.json",
    "swift_registry": "public/interop/swift-registry.json",
    "benji": "public/interop/benji-onchain-supply-2026-09/index.json",
}

COHORT_INSTRUMENT = "scripts/refresh_evidence_factory_cohorts.py"
COHORT_ARGUMENTS = ["--source-repo", "{pinned_checkout}", "--source-revision", "{input_revision}",
                    "--output-dir", "{new_empty_staging_directory}", "--top-n", "25"]
COHORT_LIMITATION = (
    "Combined read-only cohort collector: top 25 stablecoins from the pinned historical index, "
    "16 named XRPL subjects and 26 public institution/disclosure subjects. Not an arbitrary "
    "per-row runner. Run this shared instrument once per pinned input revision and capture, "
    "not once per subject or family. Added inventory identities are not automatically in its cohort."
)
COHORT_RECEIPT = "evidence/evidence-factory/cohort-finalization-receipt-2026-09-19.json"

CONTRACTS = [
    ("stablecoin.discovery", "scripts/freeze_stablecoin_index.py", "main", "CLI", ["--raw", "{staging}/raw.json", "--output", "{staging}/index.json"], "PUBLIC_READ", "Whole upstream population; index discovery only."),
    ("stablecoin.disclosure", COHORT_INSTRUMENT, "main", "CLI", COHORT_ARGUMENTS, "PUBLIC_READ", COHORT_LIMITATION),
    ("stablecoin.supply", "scripts/stablecoin_universe_supply.py", "main", "CLI", ["--limit", "{bounded_limit}", "--out", "{staging}/supply.json"], "PUBLIC_READ", "Prefix of frozen index; aggregator addresses and symbol match do not establish issuer identity or reserve safety."),
    ("xrpl.public_facts", COHORT_INSTRUMENT, "main", "CLI", COHORT_ARGUMENTS, "PUBLIC_READ", COHORT_LIMITATION),
    ("institution.disclosure", COHORT_INSTRUMENT, "main", "CLI", COHORT_ARGUMENTS, "PUBLIC_READ", COHORT_LIMITATION),
    ("institution.historical_projection", "scripts/adapters/swift_notices.py", "collect", "PYTHON_CALLABLE", [], "OFFLINE", "Hardcoded historical 17-name cohort and date; hashes a URL, not fetched press bytes. Not a fresh collector."),
    ("benji.legacy_notice", "scripts/adapters/benji.py", "collect", "PYTHON_CALLABLE", [], "PUBLIC_READ", "Legacy fixed dates and secondary notices; does not read on-chain supply. Requires replacement before fresh evidence admission."),
    ("token.public_metadata", "scripts/collect_public_token_evidence.py", "main", "CLI", ["--out", "{fresh_private_staging_directory}"], "PUBLIC_READ", "Bounded ETH/LINK/ONDO cohort, official identity sources and two finalized-block RPC reads. Native ETH has no ERC-20 contract. Shared RPC agreement does not establish independence. Fresh run and controls require separate admission."),
]


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def git(root, *args):
    result = subprocess.run(["git", "-C", str(root), *args], capture_output=True)
    return result.stdout if result.returncode == 0 else None


def slug(value):
    value = "".join(char for char in unicodedata.normalize("NFKD", value)
                    if not unicodedata.combining(char)).lower()
    return re.sub(r"[^a-z0-9]+", "-", value).strip("-")


def input_record(root, path, source_id, generated_at, source_commit):
    raw = path.read_bytes()
    data = json.loads(raw)
    try:
        relative = path.resolve().relative_to(root.resolve()).as_posix()
    except ValueError:
        relative = None
    committed = git(root, "show", f"{source_commit}:{relative}") if relative and source_commit else None
    state = "EXTERNAL_INPUT" if relative is None else (
        "UNTRACKED" if committed is None else
        "COMMITTED_AT_SOURCE_COMMIT" if committed == raw else "LOCAL_MODIFICATION")
    record = {
        "source_id": source_id, "path": relative,
        "source_uri": f"https://councilof.ai/{relative[7:]}" if relative and relative.startswith("public/") else None,
        "input_artifact_sha256": digest(raw), "source_commit": source_commit if committed is not None else None,
        "source_commit_blob_sha256": digest(committed) if committed is not None else None,
        "source_state": state, "source_schema": data.get("schema"),
        "source_observed_at": data.get("observed_at", data.get("as_of", data.get("generated_at"))),
        "source_fetched_at": data.get("fetched_at"), "imported_at": generated_at,
        "source_version": data.get("version"),
        "upstream_raw_sha256_claim": data.get("source_sha256"),
        "upstream_source_uri": data.get("source"),
        "public_readback_state": "NOT_CHECKED",
    }
    if relative is None:
        # Make the external identity input reproducible without exposing a local path.
        record["embedded_document"] = data
    return data, record


def base_subject(subject_id, family, name, identity, contracts):
    return {
        "subject_id": subject_id, "subject_kind": family, "name": name,
        "aliases": [], "identity": identity, "cohorts": [], "provenance": [],
        "historical_source_claims": [], "contract_ids": contracts,
        "measurement_state": "DISCOVERED", "measurement_run_id": None,
        "reason_unmeasured": "Registry import performs no fresh measurement or evidence admission.",
        "signature_state": "UNSIGNED", "root_inclusion_state": "NOT_ESTABLISHED",
        "timestamp_state": "NOT_ESTABLISHED", "publication_state": "LOCAL_GENERATED_NOT_PUBLISHED",
        "delivery_state": "NOT_ATTEMPTED", "valid_time": None,
    }


def add_provenance(subject, source_id, pointer, row, source):
    subject["provenance"].append({
        "source_id": source_id, "json_pointer": pointer,
        "input_artifact_sha256": source["input_artifact_sha256"],
        "input_row_sha256": digest(canonical(row)),
        "source_observed_at": source["source_observed_at"],
        "known_time": source["imported_at"],
    })
    subject["historical_source_claims"].append({"source_id": source_id, "row": row,
        "admission_state": "IMPORTED_NOT_REVALIDATED"})


def require_unique(rows, key, label):
    seen = set()
    for row in rows:
        value = row.get(key)
        if value is None or str(value) == "" or str(value) in seen:
            raise ValueError(f"{label}: missing or duplicate {key}: {value!r}")
        seen.add(str(value))


def inspect_contract(root, spec, source_commit):
    contract_id, rel, function, kind, args, access, limit = spec
    state, source_hash, source_state = "UNBOUND", None, "NOT_AVAILABLE"
    if rel and (root / rel).is_file():
        raw = (root / rel).read_bytes()
        tree = ast.parse(raw)
        found = any(isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef)) and n.name == function for n in tree.body)
        state = "CALLABLE_INSPECTED_NOT_EXECUTED" if found else "ENTRYPOINT_MISSING"
        source_hash = digest(raw)
        committed = git(root, "show", f"{source_commit}:{rel}") if source_commit else None
        source_state = "UNTRACKED" if committed is None else "COMMITTED_AT_SOURCE_COMMIT" if committed == raw else "LOCAL_MODIFICATION"
    return {
        "contract_id": contract_id, "adapter_state": state,
        "instrument": {"path": rel, "entrypoint": function, "invocation_kind": kind,
                       "sha256": source_hash, "source_state": source_state,
                       "source_commit": source_commit if source_state in ("COMMITTED_AT_SOURCE_COMMIT", "LOCAL_MODIFICATION") else None,
                       "repository_base_commit": source_commit},
        "argument_template": args, "source_access": access, "limitations": [limit],
        "execution_state": "NOT_RUN_BY_REGISTRY", "bounded_subject_execution": False,
        "spend_authorized_usd": 0, "signing_authorized": False, "publication_authorized": False,
    }


def build(root, generated_at, identity_manifest=None, stablecoin_index=None):
    commit_raw = git(root, "rev-parse", "HEAD")
    commit = commit_raw.decode().strip() if commit_raw else None
    documents, sources = {}, {}
    for source_id, relative in INPUTS.items():
        path = stablecoin_index if source_id == "stablecoins" and stablecoin_index is not None else root / relative
        documents[source_id], sources[source_id] = input_record(root, path, source_id, generated_at, commit)
    subjects = []
    assets = documents["stablecoins"]["assets"]
    require_unique(assets, "id", "stablecoins")
    for source_id, key in [("stablecoin_sources", "sources"), ("stablecoin_queue", "rows")]:
        require_unique(documents[source_id][key], "id", source_id)
    lead_map = {str(r["id"]): (i, r) for i, r in enumerate(documents["stablecoin_sources"]["sources"])}
    queue_map = {str(r["id"]): (i, r) for i, r in enumerate(documents["stablecoin_queue"]["rows"])}
    for i, row in enumerate(assets):
        asset_id = str(row["id"])
        subject = base_subject(f"stablecoin:llama:{asset_id}", "stablecoin", row["name"],
            {"state": "CATALOGUE_ID_ONLY", "namespace": "defillama-stablecoins", "source_key": asset_id,
             "symbol": row.get("symbol"), "reported_chains": row.get("chains", []),
             "contracts": [], "limitation": "Upstream identity is not a verified issuer or deployment mapping."},
            ["stablecoin.discovery", "stablecoin.disclosure", "stablecoin.supply"])
        subject["aliases"] = [row["symbol"]] if row.get("symbol") else []
        subject["cohorts"] = ["frozen-stablecoin-index"]
        add_provenance(subject, "stablecoins", f"/assets/{i}", row, sources["stablecoins"])
        for source_id, mapping, field in [("stablecoin_sources", lead_map, "sources"), ("stablecoin_queue", queue_map, "rows")]:
            if asset_id in mapping:
                j, extra = mapping[asset_id]
                add_provenance(subject, source_id, f"/{field}/{j}", extra, sources[source_id])
        subjects.append(subject)

    # XRPL issuer alone is not an instrument identifier: currency/issuer pairs may differ.
    require_unique(documents["xrpl"]["rows"], "name", "xrpl")
    for i, row in enumerate(documents["xrpl"]["rows"]):
        key = slug(row["name"])
        if not key:
            raise ValueError(f"xrpl: name has no usable catalog key: {row['name']!r}")
        subject = base_subject(f"xrpl:catalogue:{key}", "xrpl_instrument", row["name"],
            {"state": "INCOMPLETE_CURRENCY_IDENTITY" if row.get("r_address") else "UNRESOLVED",
             "network": "xrpl-mainnet", "issuer_address_claim": row.get("r_address"), "currency_code": None,
             "source_key": row["name"], "limitation": "Stable catalog key; exact currency/issuer identity and live-reader membership require reconciliation."},
            ["xrpl.public_facts"])
        subject["cohorts"] = ["named-xrpl-catalogue"]
        add_provenance(subject, "xrpl", f"/rows/{i}", row, sources["xrpl"])
        subjects.append(subject)

    banks = {}
    for source_id, field, id_field, name_field, cohort in [
        ("swift_seed", "rows", "id", "name", "swift-historical-17-seed"),
        ("swift_registry", "banks", "bank_id", "bank", "swift-supplemental-registry"),
    ]:
        require_unique(documents[source_id][field], id_field, source_id)
        for i, row in enumerate(documents[source_id][field]):
            key = str(row[id_field])
            subject = banks.setdefault(key, base_subject(f"institution:swift:{key}", "institution_disclosure", row[name_field],
                {"state": "CATALOGUE_ID_ONLY", "source_key": key, "legal_entity_identifier": None,
                 "limitation": "Public disclosure subject; no client relationship or private transaction telemetry."},
                ["institution.disclosure", "institution.historical_projection"]))
            subject["cohorts"].append(cohort)
            if row[name_field] != subject["name"]:
                subject["aliases"].append(row[name_field])
            add_provenance(subject, source_id, f"/{field}/{i}", row, sources[source_id])
    subjects.extend(banks.values())

    benji = documents["benji"]
    subject = base_subject("fund:franklin:benji", "tokenized_fund", "Franklin Templeton BENJI / FOBXX",
        {"state": "HISTORICAL_DEPLOYMENT_CLAIMS", "issuer_contracts_page": benji.get("issuer_contracts_page"),
         "deployments": [{"network": r.get("chain"), "contract_address_claim": r.get("contract"),
                          "historical_status": r.get("status")} for r in benji["cards"]],
         "limitation": "Deployment claims not refreshed; no fund AUM or primary-register reconciliation inferred."}, ["benji.legacy_notice"])
    subject["aliases"] = ["BENJI", "FOBXX"]
    subject["cohorts"] = ["benji-historical-onchain-supply"]
    add_provenance(subject, "benji", "", benji, sources["benji"])
    subjects.append(subject)

    omissions = []
    if identity_manifest:
        identities, source = input_record(root, identity_manifest, "token_identities", generated_at, commit)
        sources["token_identities"] = source
        require_unique(identities["sources"], "subject_id", "token identities")
        for i, row in enumerate(identities["sources"]):
            subject = base_subject(row["subject_id"], "native_token" if row["asset_kind"] == "native" else "token", row.get("name", row["symbol"]),
                {"state": "EXTERNAL_IDENTITY_CLAIM_NOT_ADMITTED", "network": row.get("chain_id"),
                 "asset_kind": row.get("asset_kind"), "contract_address_claim": row.get("contract_address"),
                 "official_url": row.get("official_url"), "limitation": "Identity manifest is imported; fresh observations and controls require separate admission."},
                ["token.public_metadata"])
            subject["aliases"] = [row["symbol"]]
            subject["cohorts"] = ["token-identity-manifest"]
            add_provenance(subject, "token_identities", f"/sources/{i}", row, source)
            subjects.append(subject)
        missing_symbols = sorted({"ETH", "LINK", "ONDO"} - {str(r.get("symbol", "")).upper() for r in identities["sources"]})
        if missing_symbols:
            omissions.append({"cohort": "requested-token-identities", "symbols": missing_symbols,
                              "state": "INPUT_INCOMPLETE", "reason": "Requested symbols absent from supplied identity manifest."})
    else:
        omissions.append({"cohort": "ETH/LINK/ONDO", "state": "INPUT_NOT_PROVIDED", "reason": "No authoritative identity manifest supplied; no guessed contracts inserted."})

    require_unique(subjects, "subject_id", "registry")
    # Alias equality is a review candidate, never sufficient to merge identities.
    alias_map = defaultdict(set)
    for s in subjects:
        for alias in [s["name"], *s["aliases"]]:
            alias_map[slug(alias)].add(s["subject_id"])
    candidates = [{"alias_key": key, "subject_ids": sorted(ids), "state": "POSSIBLE_OVERLAP_NOT_MERGED"}
                  for key, ids in sorted(alias_map.items()) if len(ids) > 1]
    contracts = [inspect_contract(root, spec, commit) for spec in CONTRACTS]
    receipt_path = root / COHORT_RECEIPT
    execution_evidence = []
    if receipt_path.is_file():
        receipt_raw = receipt_path.read_bytes()
        receipt = json.loads(receipt_raw)
        execution_evidence.append({"receipt_path": COHORT_RECEIPT, "receipt_sha256": digest(receipt_raw),
            "executed_instrument_sha256_claim": receipt.get("instrument_sha256"),
            "run_finished_at_claim": receipt.get("run_finished_at"),
            "receipt_state": "RETAINED_EXTERNAL_EXECUTION_RECEIPT", "admission_state": "NOT_EVALUATED_BY_REGISTRY",
            "raw_capture_validation": "NOT_REPERFORMED_BY_REGISTRY"})
        for contract in contracts:
            if contract["instrument"]["path"] == COHORT_INSTRUMENT:
                contract["external_execution_evidence"] = [{**execution_evidence[0],
                    "instrument_digest_matches": contract["instrument"]["sha256"] == receipt.get("instrument_sha256")}]
    contract_map = {c["contract_id"]: c for c in contracts}
    for s in subjects:
        s["known_time"] = generated_at
        s["adapter_states"] = {c: contract_map[c]["adapter_state"] for c in s["contract_ids"]}
        s["identity_disposition"] = "RECONCILE_BEFORE_FRESH_ADMISSION"
        s["content_sha256"] = digest(canonical(s))
    subjects.sort(key=lambda s: s["subject_id"])
    generator_path = Path(__file__).resolve()
    generator_raw = generator_path.read_bytes()
    generator_relative = "scripts/build_evidence_factory_registry.py"
    generator_committed = git(root, "show", f"{commit}:{generator_relative}") if commit else None
    generator = {"path": generator_relative, "sha256": digest(generator_raw),
                 "source_state": "UNTRACKED" if generator_committed is None else
                    "COMMITTED_AT_SOURCE_COMMIT" if generator_committed == generator_raw else "LOCAL_MODIFICATION"}
    envelope = {"generated_at": generated_at, "source_commit": commit, "generator": generator, "writes_board": False,
                "execution_state": "REGISTRY_GENERATION_ONLY", "publication_state": "LOCAL_GENERATED_NOT_PUBLISHED"}
    registry = {**envelope, "schema": "csoai.evidence-factory.subject-registry/0.1", "sources": list(sources.values()),
        "subjects": subjects, "counts": {"catalogue_subject_rows": len(subjects), "distinct_real_world_entities": None,
            "families": dict(sorted(Counter(s["subject_kind"] for s in subjects).items())),
            "new_measurements": 0, "new_signatures": 0}, "overlap_candidates": candidates, "omissions": omissions,
        "reconciliation": {"rule": "Source namespaces are preserved. Counts describe scoped catalog rows, not unique economic assets.",
            "stablecoin_index_rows": len(assets), "stablecoin_source_rows": len(lead_map), "stablecoin_queue_rows": len(queue_map),
            "stablecoin_index_claimed_count": documents['stablecoins'].get('asset_count'),
            "stablecoin_index_count_matches": documents['stablecoins'].get('asset_count') == len(assets),
            "stablecoin_source_ids_outside_index": sorted(set(lead_map) - {str(r['id']) for r in assets}),
            "stablecoin_queue_ids_outside_index": sorted(set(queue_map) - {str(r['id']) for r in assets}),
            "stablecoin_source_ids_missing": sorted({str(r['id']) for r in assets} - set(lead_map)),
            "stablecoin_queue_ids_missing": sorted({str(r['id']) for r in assets} - set(queue_map)),
            "swift_seed_rows": len(documents['swift_seed']['rows']), "swift_supplemental_rows": len(documents['swift_registry']['banks']),
            "swift_union_rows": len(banks), "xrpl_catalogue_rows": len(documents['xrpl']['rows']),
            "xrpl_live_reader_membership": "NOT_RECONCILED", "freshness": "INPUT_TIMES_RETAINED_NOT_REFRESHED"}}
    contract_registry = {**envelope, "schema": "csoai.evidence-factory.contract-registry/0.1", "contracts": contracts,
        "external_execution_evidence": execution_evidence,
        "execution_rule": "An inspected callable is not a tested or running adapter. Review scope, output isolation, identity, controls and bounds before execution."}
    jobs = []
    for subject in subjects:
        for contract_id in subject["contract_ids"]:
            jobs.append({"job_id": f"{subject['subject_id']}::{contract_id}", "subject_id": subject["subject_id"],
                "contract_id": contract_id, "state": "PLANNED_NOT_SCHEDULED", "executed_at": None,
                "owner": "UNASSIGNED", "cost_ceiling_usd": 0, "permission": "PUBLIC_READ_ONLY_AFTER_CONTRACT_REVIEW",
                "deduplication_key": contract_map[contract_id]["instrument"]["path"] or f"unbound:{contract_id}",
                "blockers": ["BOUND_SCOPE_AND_OUTPUT_ISOLATION", "RECONCILE_SUBJECT_IDENTITY", "VERIFY_CONTROLS"] +
                    (["BIND_EXECUTABLE_ADAPTER"] if contract_map[contract_id]["adapter_state"] == "UNBOUND" else []),
                "execution_note": "Group jobs by shared instrument path and pinned inputs; do not execute one full-cohort collection per subject or contract.",
                "signing_allowed": False, "publication_allowed": False, "output_state": "NO_OUTPUT"})
    matrix = {**envelope, "schema": "csoai.evidence-factory.job-matrix/0.1", "jobs": jobs,
        "counts": {"planned_subject_contract_bindings": len(jobs), "scheduled": 0, "executed": 0},
        "permissions": {"spend_usd": 0, "sign": False, "publish": False, "private_account_access": False}}
    reconciliation_path = root / "public/interop/evidence-factory/axis-goal-reconciliation.json"
    gate = {"path": "public/interop/evidence-factory/axis-goal-reconciliation.json",
            "state": "AVAILABLE_FOR_REVIEW" if reconciliation_path.exists() else "NOT_GENERATED",
            "sha256": digest(reconciliation_path.read_bytes()) if reconciliation_path.exists() else None,
            "execution_authorized": False}
    registry["control_plane_reconciliation"] = gate
    matrix["control_plane_reconciliation"] = gate
    return {"subject-registry.json": registry, "contract-registry.json": contract_registry, "job-matrix.json": matrix}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--output", type=Path)
    parser.add_argument("--identity-manifest", type=Path)
    parser.add_argument("--stablecoin-index", type=Path, help="Use a separately retained fresh index; default is the committed historical baseline")
    parser.add_argument("--generated-at", default=datetime.now(timezone.utc).isoformat())
    args = parser.parse_args()
    outputs = build(args.repo_root.resolve(), args.generated_at, args.identity_manifest, args.stablecoin_index)
    destination = args.output or args.repo_root / "public/interop/evidence-factory"
    destination.mkdir(parents=True, exist_ok=True)
    for filename, data in outputs.items():
        (destination / filename).write_text(json.dumps(data, indent=2, ensure_ascii=False, sort_keys=True) + "\n")
    print(json.dumps(outputs["subject-registry.json"]["counts"], sort_keys=True))


if __name__ == "__main__":
    main()
