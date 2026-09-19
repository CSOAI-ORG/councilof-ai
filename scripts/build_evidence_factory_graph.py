#!/usr/bin/env python3
"""Join bounded collector receipts to exact registry IDs without admission.

Produces a public-safe projection: full response bodies, headers and local paths
stay in the private capture. Failed, skipped and unexecuted subjects remain visible.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re


SCHEMAS = {"csoai.factory-run-dispositions/0.1", "csoai.public-token-observation-summary/1"}
STATES_BY_SCHEMA = {
    "csoai.factory-run-dispositions/0.1": {"OBSERVED", "DEEP_PROBED", "UNMEASURED", "UNCHECKABLE", "ERROR", "NOT_RUN"},
    "csoai.public-token-observation-summary/1": {"OBSERVED", "UNMEASURED", "UNCHECKABLE", "ERROR", "NOT_RUN"},
}
FORBIDDEN_FIELDS = {"headers", "raw_body", "rawbody", "body", "cookies", "cookie", "set_cookie", "setcookie",
                    "authorization", "request_body", "requestbody", "response_headers", "request_headers", "http_headers"}
TOKEN_FIELDS = {"name": str, "symbol": str, "decimals": str, "totalSupply": str}
BLOCK_FIELDS = {"number": str, "hash": str, "timestamp": str, "stateRoot": str}


def reject_private_fields(value, label):
    """Reject private material inside structured observations, at any nesting depth.

    Raw receipt objects are handled by a separate strict projection, because the
    private collector intentionally supplies headers/paths there for omission.
    """
    if isinstance(value, dict):
        for key, item in value.items():
            normalized = re.sub(r"[^a-z0-9]+", "_", str(key).lower()).strip("_")
            if normalized in FORBIDDEN_FIELDS:
                raise ValueError(f"private field forbidden in {label}: {key}")
            reject_private_fields(item, f"{label}/{key}")
    elif isinstance(value, list):
        for index, item in enumerate(value):
            reject_private_fields(item, f"{label}/{index}")


def project_object(value, fields, label):
    if not isinstance(value, dict):
        raise ValueError(f"{label} must be an object")
    reject_private_fields(value, label)
    unexpected = set(value) - set(fields)
    if unexpected:
        raise ValueError(f"unsupported fields in {label}: {sorted(unexpected)}")
    result = {}
    for key, item in value.items():
        kind = fields[key]
        if callable(kind) and not isinstance(kind, type):
            result[key] = kind(item, f"{label}/{key}")
        elif type(item) is not kind:
            raise ValueError(f"invalid type in {label}/{key}")
        else:
            result[key] = item
    return result


def text_list(value, label):
    if not isinstance(value, list) or any(not isinstance(v, str) for v in value):
        raise ValueError(f"{label} must be a string array")
    return list(value)


def nullable(kind):
    def validate(value, label):
        if value is None:
            return None
        if isinstance(kind, type):
            if type(value) is not kind:
                raise ValueError(f"invalid type in {label}")
            return value
        return kind(value, label)
    return validate


def token_block(value, label):
    return project_object(value, BLOCK_FIELDS, label)


def token_observations(value, label):
    if not isinstance(value, dict):
        raise ValueError(f"{label} must be an object")
    reject_private_fields(value, label)
    if not value:
        return {}
    if "chain_id" in value:  # native ETH telemetry, never ERC-20 supply
        return project_object(value, {
            "chain_id": int, "finalized_block": token_block, "gas_used": str, "gas_limit": str,
            "base_fee_per_gas_wei": nullable(str), "providers": text_list,
        }, label)
    output = {}
    for provider, observations in value.items():
        if not isinstance(provider, str) or not provider.startswith("https://"):
            raise ValueError(f"invalid RPC provider in {label}")
        output[provider] = project_object(observations, {
            "rpc": str, "receipt_ids": text_list,
            "fields": lambda v, p: project_object(v, TOKEN_FIELDS, p),
            "errors": lambda v, p: project_object(v, {**{key: str for key in TOKEN_FIELDS}, "code": str}, p),
            "code": lambda v, p: project_object(v, {"bytes": int, "sha256": str, "verified_source": bool}, p),
        }, f"{label}/{provider}")
        if output[provider].get("rpc") != provider:
            raise ValueError(f"RPC provider key disagrees with its observation: {provider}")
    return output


def token_projection(payload):
    fields = {
        "identity": lambda v, p: project_object(v, {"id": str, "name": str, "symbol": str, "asset_kind": str,
                                                    "contract_address": nullable(str), "chain_id": int, "official_url": str}, p),
        "official_identity": lambda v, p: project_object(v, {"status": str, "receipt_id": str, "body_sha256": str,
                                                             "fetched_at": str, "rule": str}, p),
        "block": nullable(token_block), "observations": token_observations,
        "metadata": nullable(lambda v, p: project_object(v, {**TOKEN_FIELDS, "total_supply_unit": str}, p)),
        "provider_agreement": nullable(str), "unknowns": text_list,
    }
    # Source receipts are projected separately; other unknown payload fields are
    # refused rather than silently becoming a future public-data escape hatch.
    return project_object({k: v for k, v in payload.items() if k != "source_receipts"}, fields, "token evidence")


def object_list(fields):
    def validate(value, label):
        if not isinstance(value, list):
            raise ValueError(f"{label} must be an array")
        return [project_object(item, fields, f"{label}/{i}") for i, item in enumerate(value)]
    return validate


def currency_amounts(value, label):
    if not isinstance(value, dict) or len(value) > 50:
        raise ValueError(f"{label} must be a bounded currency-to-amount object")
    reject_private_fields(value, label)
    if any(not isinstance(key, str) or not isinstance(amount, str) for key, amount in value.items()):
        raise ValueError(f"{label} currency keys and amounts must be strings")
    return dict(value)


def cohort_projection(row, subject_kind):
    family_schemas = {
        "stablecoin": {
            "source_url": nullable(str), "source_bytes_observed": bool, "source_fetch_states": text_list,
            "extraction_review_state": str,
            "extraction_candidates": lambda v, p: project_object(v, {
                "auditor": nullable(str), "cadence_claimed": nullable(str), "latest_report_date": nullable(str),
            }, p),
        },
        "xrpl_instrument": {
            "account_state": str, "issuer_attribution": str, "asset_supply": type(None), "obligations_state": str,
            "account": str, "ledger": lambda v, p: project_object(v, {"hash": str, "index": int}, p),
            "validated": bool, "flags_raw": nullable(int), "domain_hex": nullable(str),
            "obligations_by_currency": nullable(currency_amounts), "obligations_currency_count": nullable(int),
            "obligations_projection_limit": int,
        },
        "institution_disclosure": {
            "sources_expected": int, "source_responses_archived": int, "sources_fetched": int,
            "source_fetch_states": object_list({"url": str, "state": str, "http": nullable(int), "body_sha256": nullable(str)}),
            "source_content_claim_review": str, "client_relationship": str, "settlement_state": str,
        },
    }
    result = {}
    if "observations" in row:
        if subject_kind not in family_schemas:
            raise ValueError(f"no reviewed observation projection for family: {subject_kind}")
        result["observations"] = project_object(row["observations"], family_schemas[subject_kind], "cohort observations")
    if "unknowns" in row:
        reject_private_fields(row["unknowns"], "cohort unknowns")
        result["unknowns"] = text_list(row["unknowns"], "cohort unknowns")
    return result


def canonical(data):
    return json.dumps(data, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def require_digest(value, label):
    if not isinstance(value, str) or not re.fullmatch("[0-9a-f]{64}", value):
        raise ValueError(f"invalid {label} digest")
    return value


def require_time(value):
    if not isinstance(value, str):
        raise ValueError("missing observation time")
    instant = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if instant.tzinfo is None:
        raise ValueError("observation time requires a timezone")
    return value


def source_receipt(receipt):
    # Do not propagate raw headers, cookies, filesystem paths or request bodies.
    if not isinstance(receipt, dict):
        raise ValueError("source receipt must be an object")
    body_hash = receipt.get("body_sha256")
    status = receipt.get("http", receipt.get("http_status"))
    if status is not None and (type(status) is not int or not 100 <= status <= 599):
        raise ValueError("source receipt HTTP status must be null or an HTTP status integer")
    if body_hash is None and status is None and receipt.get("fetch_state") == "UNCHECKABLE":
        capture_state = "NO_RESPONSE_BYTES"
    else:
        require_digest(body_hash, "source body")
        capture_state = "BYTES_HASHED"
    result = {
        "source_url": receipt.get("source_url", receipt.get("url")),
        "fetched_at": require_time(receipt.get("retrieved_at", receipt.get("fetched_at"))),
        "body_sha256": body_hash,
        "http_status": status,
        "capture_state": capture_state,
    }
    if not isinstance(result["source_url"], str) or not result["source_url"].startswith("https://"):
        raise ValueError("source receipt must name an HTTPS URL")
    for name in ("id", "method", "fetch_state", "request_sha256", "meta_sha256"):
        if name in receipt:
            if name.endswith("sha256"):
                require_digest(receipt[name], name)
            elif not isinstance(receipt[name], str):
                raise ValueError(f"source receipt {name} must be a string")
            result[name] = receipt[name]
    return result


def build_graph(registry, inputs, generated_at):
    require_time(generated_at)
    subjects = registry["subjects"]
    ids = [s["subject_id"] for s in subjects]
    if len(set(ids)) != len(ids):
        raise ValueError("duplicate subject registry ID")
    by_id = {s["subject_id"]: s for s in subjects}
    links = defaultdict(list)
    observations, sources = [], []
    states = Counter()
    families = defaultdict(Counter)
    for filename, document, document_hash in inputs:
        if document.get("schema") not in SCHEMAS:
            raise ValueError(f"unsupported observation schema: {filename}")
        require_digest(document_hash, "input document")
        sources.append({"filename": filename, "sha256": document_hash, "schema": document["schema"]})
        seen = set()
        for index, row in enumerate(document["rows"]):
            subject_id = row["subject_id"]
            if subject_id not in by_id:
                raise ValueError(f"observation has no exact registry match: {subject_id}")
            if subject_id in seen:
                raise ValueError(f"duplicate subject in one run document: {subject_id}")
            seen.add(subject_id)
            state = row.get("execution_state", row.get("state"))
            if not isinstance(state, str) or state not in STATES_BY_SCHEMA[document["schema"]]:
                raise ValueError(f"unsupported execution disposition: {subject_id}: {state!r}")
            if row.get("registry_admission") not in (None, False):
                raise ValueError("collector cannot grant registry admission")
            payload = row
            if document["schema"] == "csoai.public-token-observation-summary/1":
                payload = row["evidence"]
                if sha(canonical(payload)) != row.get("evidence_sha256"):
                    raise ValueError(f"token evidence digest mismatch: {subject_id}")
                if payload.get("identity", {}).get("id") != subject_id:
                    raise ValueError(f"token identity disagrees with subject: {subject_id}")
            receipts = payload.get("raw_receipts", payload.get("source_receipts", []))
            if not isinstance(receipts, list):
                raise ValueError(f"source receipts must be an array: {subject_id}")
            projected_receipts = [source_receipt(r) for r in receipts]
            if state in {"OBSERVED", "DEEP_PROBED"} and not any(
                r["http_status"] == 200 and r["capture_state"] == "BYTES_HASHED" for r in projected_receipts
            ):
                raise ValueError(f"successful disposition requires a hashed HTTP 200 receipt: {subject_id}")
            observed_at = require_time(row.get("observed_at"))
            for field in ("source_as_of", "reason"):
                if row.get(field) is not None and not isinstance(row[field], str):
                    raise ValueError(f"{field} must be null or a string: {subject_id}")
            item = {
                "subject_id": subject_id,
                "execution_state": state,
                "observed_at": observed_at,
                "input_source_as_of": row.get("source_as_of"),
                "source_document": filename,
                "source_document_sha256": document_hash,
                "source_row_pointer": f"/rows/{index}",
                "source_row_sha256": sha(canonical(row)),
                "captured_evidence_sha256": require_digest(row.get("evidence_sha256"), "captured evidence"),
                "source_receipts": projected_receipts,
                "reason": row.get("reason"),
                "admission_state": "NOT_ADMITTED",
                "signature_state": "UNSIGNED",
                "root_inclusion_state": "NOT_ESTABLISHED",
                "public_delivery_state": "NOT_VERIFIED",
                "raw_capture": "PRIVATE_CAPTURE_REFERENCED_BY_DIGEST",
            }
            if document["schema"] == "csoai.public-token-observation-summary/1":
                item.update(token_projection(payload))
            else:
                item.update(cohort_projection(row, by_id[subject_id]["subject_kind"]))
            if "instrument_sha256" in row:
                item["instrument_sha256"] = require_digest(row["instrument_sha256"], "instrument")
            item["evidence_id"] = "sha256:" + sha(canonical(item))
            observations.append(item)
            links[subject_id].append(item["evidence_id"])
            states[state] += 1
            families[by_id[subject_id]["subject_kind"]][state] += 1
    observations.sort(key=lambda r: (r["subject_id"], r["observed_at"], r["evidence_id"]))
    dispositions = [{
        "subject_id": subject_id,
        "state": "RUN_DISPOSITION_RECORDED" if links[subject_id] else "NOT_RUN_IN_THIS_BATCH",
        "evidence_ids": sorted(links[subject_id]),
        "admission_state": "NOT_ADMITTED",
    } for subject_id in sorted(ids)]
    return {
        "schema": "csoai.evidence-factory.graph/1",
        "generated_at": generated_at,
        "state": "OBSERVATIONS_AND_GAPS_FOR_REVIEW",
        "registry_content_sha256": sha(canonical(registry)),
        "inputs": sources,
        "counts": {
            "catalogue_subject_rows": len(subjects),
            "subjects_with_run_dispositions": len([v for v in links.values() if v]),
            "subjects_not_run_in_this_batch": sum(not r["evidence_ids"] for r in dispositions),
            "run_dispositions": len(observations),
            "by_execution_state": dict(sorted(states.items())),
            "by_family_and_state": {k: dict(sorted(v.items())) for k, v in sorted(families.items())},
            "admitted_measurements": 0,
            "new_signatures": 0,
        },
        "limitations": [
            "A recorded run disposition can be observed, blocked, failed or unmeasured; do not sum it as successful measurements.",
            "Catalogue rows preserve source scopes and may overlap; they are not a unique economic entity census.",
            "Matching source or RPC responses are not independent source-truth verification.",
            "Receipt digests bind retained bytes; this projection does not independently replay those bytes.",
            "Publication of this file is not evidence of protected website deployment, admission, signing or root inclusion.",
        ],
        "observations": observations,
        "subject_dispositions": dispositions,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--registry", type=Path, required=True)
    parser.add_argument("--input", type=Path, action="append", required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--generated-at", default=datetime.now(timezone.utc).isoformat())
    args = parser.parse_args()
    try:
        documents = []
        for path in args.input:
            raw = path.read_bytes()
            documents.append((path.name, json.loads(raw), sha(raw)))
        output = build_graph(json.loads(args.registry.read_bytes()), documents, args.generated_at)
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(output, sort_keys=True, indent=2, ensure_ascii=False) + "\n")
    except (KeyError, ValueError, OSError, TypeError) as error:
        parser.exit(2, f"REFUSING: {error}\n")
    print(json.dumps(output["counts"], sort_keys=True))


if __name__ == "__main__":
    main()
