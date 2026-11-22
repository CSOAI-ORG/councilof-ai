#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Project a run onto every registered provision without minting a legal verdict.

Reuses csoai.evidence-event/0.1. This is an offline, unsigned routing projection,
not a grader, source fetcher, authority service, decision store or signer.
"""
import argparse
from collections import Counter
from datetime import datetime
import hashlib
import json
from pathlib import Path
import re

import event

VERSION = "0.1.0"
HEX = re.compile(r"^[0-9a-f]{64}$")
EVENT_ID = re.compile(r"^sha256:[0-9a-f]{64}$")
SOURCE_KINDS = {"ai-single", "ai-council", "human-unassisted", "human-assisted"}
EVIDENCE_KINDS = {"observed-live", "frozen-replay", "synthetic-simulation"}
CONFIG_TEXT = ("model_id", "model_revision", "serving_path")
CONFIG_DIGESTS = ("model_sha256", "harness_sha256", "prompt_sha256", "dataset_sha256",
                  "tools_sha256", "plugins_sha256", "mcp_sha256", "skills_sha256",
                  "permissions_policy_sha256", "runtime_sha256")


def require(ok, message):
    if not ok:
        raise ValueError(message)


def text(value):
    return isinstance(value, str) and bool(value.strip())


def is_hex(value):
    return isinstance(value, str) and bool(HEX.fullmatch(value))


def is_event_id(value):
    return isinstance(value, str) and bool(EVENT_ID.fullmatch(value))


def digest(value):
    return event.sha256_hex(event.jcs(value))


def timestamp(value):
    require(text(value), "timestamp required")
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ValueError("invalid timestamp") from exc
    require(parsed.tzinfo is not None, "timestamp must have timezone")
    return parsed


def unique_object(pairs):
    out = {}
    for key, value in pairs:
        require(key not in out, "duplicate JSON key: " + key)
        out[key] = value
    return out


def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"), object_pairs_hook=unique_object)


def registry_rows(manifest, extensions=()):
    anchors = manifest.get("anchors")
    require(isinstance(anchors, dict) and anchors, "nonempty anchors required")
    require(type(manifest.get("provisions")) is int and manifest["provisions"] == len(anchors),
            "provision count disagrees with anchors")
    require(text(manifest.get("normaliser_version")), "normaliser version required")
    h = hashlib.sha256()
    rows = []
    for provision_id, sha in sorted(anchors.items()):
        require(re.fullmatch(r"\d{5}[RL]\d{4}:-?\d+", provision_id) is not None,
                "invalid frozen provision id")
        require(isinstance(sha, str) and HEX.fullmatch(sha), "invalid provision digest")
        h.update(provision_id.encode()); h.update(sha.encode())
        instrument, clause = provision_id.split(":")
        rows.append({"id": provision_id, "instrument_id": instrument,
                     "instrument_version": "frozen:" + manifest.get("corpus_root", ""),
                     "clause_locator": clause, "jurisdiction": "EU",
                     "source_sha256": sha,
                     "source_state": "HASH_MANIFEST_VERIFIED_SOURCE_BYTES_UNRESOLVED"})
    require(h.hexdigest() == manifest.get("corpus_root"), "frozen corpus root mismatch")
    ids = set(anchors)
    identities = {(r["instrument_id"], r["instrument_version"], r["clause_locator"]) for r in rows}
    for row in extensions:
        require(isinstance(row, dict), "extension must be object")
        for field in ("id", "instrument_id", "instrument_version", "clause_locator", "jurisdiction",
                      "source_url", "licence_provenance", "reviewer_ref", "review_event_id"):
            require(text(row.get(field)), "extension missing " + field)
        require(row["source_url"].startswith("https://"), "extension needs primary HTTPS source")
        require(is_hex(row.get("source_sha256")), "extension source digest required")
        require(is_event_id(row["review_event_id"]), "extension review event id required")
        key = (row["instrument_id"], row["instrument_version"], row["clause_locator"])
        require(row["id"] not in ids and key not in identities, "duplicate obligation identity")
        ids.add(row["id"]); identities.add(key)
        rows.append({**row, "source_state": "REVIEW_RECORD_SUPPLIED_SOURCE_BYTES_NOT_VERIFIED"})
    return sorted(rows, key=lambda r: r["id"])


def validate_run(run):
    require(isinstance(run, dict), "run must be object")
    require(text(run.get("run_id")), "run_id required")
    timestamp(run.get("observed_at"))
    require(run.get("source_kind") in SOURCE_KINDS, "unknown source kind")
    require(run.get("evidence_kind") in EVIDENCE_KINDS, "unknown evidence kind")
    config = run.get("configuration")
    require(isinstance(config, dict), "configuration required")
    for field in CONFIG_TEXT:
        require(text(config.get(field)), "configuration missing " + field)
    for field in CONFIG_DIGESTS:
        if field == "model_sha256" and config.get(field) is None:
            require("model_sha256" in config and text(config.get("model_digest_unavailable_reason")),
                    "null model digest needs an explicit unavailability reason")
            continue
        require(is_hex(config.get(field)), "configuration digest missing: " + field)
    require(run.get("configuration_sha256") == digest(config), "configuration digest mismatch")
    context = run.get("context")
    require(isinstance(context, dict), "context required")
    require(text(context.get("use_case")), "use_case required; use UNKNOWN explicitly when unknown")
    for field in ("jurisdictions", "actor_roles"):
        require(isinstance(context.get(field), list) and all(text(x) for x in context[field]),
                "context needs " + field + " list (empty means unknown)")
        require(len(set(context[field])) == len(context[field]), "duplicate context " + field)
    if run["source_kind"] == "human-unassisted":
        require(run.get("assistance") == "none", "unassisted human must declare no assistance")
    elif run["source_kind"] == "human-assisted":
        require(text(run.get("assistance")) and run["assistance"] != "none", "human assistance must be described")
    return digest(context)


def validate_source_event(source, run, context_sha):
    if source is None:
        return None
    event.check_renderable(source)
    expected = {"run_id": run["run_id"], "configuration_sha256": run["configuration_sha256"],
                "context_sha256": context_sha, "source_kind": run["source_kind"],
                "evidence_kind": run["evidence_kind"], "observed_at": run["observed_at"]}
    observed = source.get("observed")
    require(isinstance(observed, dict), "source event has no run binding")
    for key, value in expected.items():
        require(observed.get(key) == value, "source event binding mismatch: " + key)
    # Structural/content-identity validation is not signer authentication or legal evidence validation.
    return {"event_id": source["event_id"], "state": source["state"],
            "integrity_check": "CANONICAL_EVENT_ID_ONLY", "signature_check": "NOT_PERFORMED"}


def index_mappings(mappings, rows):
    require(isinstance(mappings, list), "mappings must be list")
    available = {r["id"] for r in rows}
    indexed = {}
    for mapping in mappings:
        require(isinstance(mapping, dict), "mapping must be object")
        identity = mapping.get("obligation_id")
        require(identity in available, "mapping names unregistered obligation")
        require(identity not in indexed, "duplicate mapping disposition")
        indexed[identity] = mapping
    return indexed


def mapping_disposition(mapping, row, run, context_sha, registry_sha):
    if mapping is None:
        return "UNKNOWN", "UNMAPPED", "No explicit mapping record supplied", None
    review = mapping.get("review", {})
    if not isinstance(review, dict) or review.get("status") != "REVIEWED":
        return "UNKNOWN", "UNREVIEWED_POINTER", "Mapping has no reviewed record", None
    for field in ("reviewer_ref", "reason", "source_version"):
        require(text(review.get(field)), "review missing " + field)
    require(is_event_id(review.get("event_id")), "review event reference required")
    require(review.get("source_version") == row["instrument_version"], "review source version mismatch")
    require(review.get("source_sha256") == row["source_sha256"], "review source digest mismatch")
    require(mapping.get("registry_sha256") == registry_sha, "mapping registry mismatch")
    require(mapping.get("configuration_sha256") == run["configuration_sha256"], "mapping configuration mismatch")
    require(mapping.get("context_sha256") == context_sha, "mapping context mismatch")
    start, end = timestamp(review.get("valid_from")), timestamp(review.get("valid_until"))
    require(start < end, "review validity interval invalid")
    if not start <= timestamp(run["observed_at"]) < end:
        return "UNKNOWN", "STALE_POINTER", "Review record outside validity period", review["event_id"]
    applicability = mapping.get("applicability")
    require(applicability in {"APPLICABLE", "NOT_APPLICABLE", "UNKNOWN"}, "invalid applicability")
    require(mapping.get("relation") in {"partial", "related", "equivalent", "disjoint"}, "mapping relation required")
    # These are supplied declarations, not verified reviewer identity or a legal decision.
    return applicability, "REVIEW_RECORD_SUPPLIED", review["reason"], review["event_id"]


def project(manifest, run, *, extensions=(), mappings=None, source_event=None):
    context_sha = validate_run(run)
    rows = registry_rows(manifest, extensions)
    registry_sha = digest(rows)
    mapped = index_mappings([] if mappings is None else mappings, rows)
    source_ref = validate_source_event(source_event, run, context_sha)
    code_sha = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    events = []
    for row in rows:
        applicability, capability, reason, review_ref = mapping_disposition(
            mapped.get(row["id"]), row, run, context_sha, registry_sha)
        observed = {"run_id": run["run_id"], "observed_at": run["observed_at"],
                    "configuration_sha256": run["configuration_sha256"], "context_sha256": context_sha,
                    "source_kind": run["source_kind"], "evidence_kind": run["evidence_kind"],
                    "applicability": applicability, "mapping_state": capability,
                    "applicability_basis": "SUPPLIED_REVIEW_RECORD_NOT_AUTHENTICATED" if review_ref else "UNKNOWN",
                    "reason": reason, "review_event_id": review_ref,
                    "source_event": source_ref, "assessment": "NOT_RUN",
                    "observed_live_record_supplied": run["evidence_kind"] == "observed-live" and source_ref is not None}
        limits = ["Routing is not an obligation test or a legal determination.",
                  "Source hashes and mapping pointers do not establish current source text, applicability or satisfaction.",
                  "Review references are supplied records; reviewer identity, authority and signature were not authenticated.",
                  "No signature, timestamp proof, payment, execution or model inference is performed.",
                  "Simulation and replay remain separate from observed-live evidence."]
        if run["configuration"]["model_sha256"] is None:
            limits.append("Exact model-byte identity is unavailable; identical weights across runs are not established.")
        events.append(event.build(
            subject={"kind": "model_run", "locator": run["run_id"]},
            claim={"text": "A registered provision has a routing disposition for this run."},
            method={"id": "regulation-projection", "version": VERSION, "holder": "csoai", "code_sha256": code_sha},
            declared={"registry_sha256": registry_sha, "obligation": row,
                      "mapping_sha256": digest(mapped[row["id"]]) if row["id"] in mapped else None},
            observed=observed, state="UNMEASURED", value=None,
            limits=limits
        ))
    return {"method": "regulation-projection/" + VERSION, "registry_sha256": registry_sha,
            "input_manifest_content_sha256": digest(manifest),
            "manifest_anchored_at_declared": manifest.get("anchored_at"),
            "run_id": run["run_id"], "configuration_sha256": run["configuration_sha256"],
            "context_sha256": context_sha,
            "counts": {"instruments": len({r["instrument_id"] for r in rows}),
                       "instrument_versions": len({(r["instrument_id"], r["instrument_version"]) for r in rows}),
                       "registered_provisions": len(rows), "routing_dispositions": len(events),
                       "supplied_mapping_records": len(mapped), "obligation_checks_executed": 0,
                       "legal_outcomes_established": 0},
            "mapping_states": dict(sorted(Counter(e["observed"]["mapping_state"] for e in events).items())),
            "events": events}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--run", required=True)
    parser.add_argument("--extensions")
    parser.add_argument("--mappings")
    parser.add_argument("--source-event")
    parser.add_argument("--out", required=True, help="New output file; existing bytes are never overwritten")
    args = parser.parse_args()
    result = project(read_json(args.manifest), read_json(args.run),
                     extensions=read_json(args.extensions) if args.extensions else (),
                     mappings=read_json(args.mappings) if args.mappings else [],
                     source_event=read_json(args.source_event) if args.source_event else None)
    result["input_file_sha256"] = {
        key: hashlib.sha256(Path(value).read_bytes()).hexdigest()
        for key, value in {"manifest": args.manifest, "run": args.run,
                           "extensions": args.extensions, "mappings": args.mappings,
                           "source_event": args.source_event}.items() if value is not None}
    with open(args.out, "x", encoding="utf-8") as stream:
        stream.write(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(result["counts"], sort_keys=True))


if __name__ == "__main__":
    main()
