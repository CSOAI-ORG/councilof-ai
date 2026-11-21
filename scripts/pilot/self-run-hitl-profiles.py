#!/usr/bin/env python3
"""Retain the existing csoai.hitl-authority-effect/0.1 profile from synthetic replay bytes.

The source authority, request and effect digest fields were captured inside the
existing owned-file harness BEFORE it deletes its temporary fixtures. They are
untrusted self-test provenance, NOT an authenticated human decision, a durable
approval journal, an independent external observation or a board measurement.
Do not create a new profile or second case/decision store here.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[2]
SCHEMA_FILE = ROOT / "docs/standards/osaia-safe-reverification/hitl-authority-effect-v0.1.schema.json"
EVENT_FILE = ROOT / "packages/evidence-fabric/event.py"
EVENT_SPEC = importlib.util.spec_from_file_location("csoai_event_for_profile_binding", EVENT_FILE)
evlib = importlib.util.module_from_spec(EVENT_SPEC)
EVENT_SPEC.loader.exec_module(evlib)
SCENARIOS = (
    "pass", "revoked", "unknown_revocation", "stale_claim", "expired",
    "not_yet_valid", "wrong_scope", "tampered_request", "invalid_signature",
    "wrong_epoch", "deny", "substituted_trust_key", "unrevoked_by_folder_writer",
    "missing_pin",
)
LIMITS = [
    "SYNTHETIC TEST PRINCIPAL AND KEY ONLY; no authenticated human approval.",
    "This is the preserved draft 0.1 profile, not a production v0.2 authority release.",
    "Declared decision and authority fields may be invalid under the fixture's negative test.",
    "Inputs are digests captured before temporary-file deletion, not retained approval bytes.",
    "Request and effect are bounded owned local files with separate LOCAL process readback.",
    "Local independent-process verification is not an external institutional review.",
    "No durable revocation service, commercial target, GSPC admission, signing or anchoring.",
]


def require(cond, msg):
    if not cond:
        raise ValueError("synthetic HITL profile rejected: " + msg)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def is_hex(value):
    return type(value) is str and re.fullmatch(r"[0-9a-f]{64}", value) is not None


def dt(ms):
    require(type(ms) in (int, float) and 0 < ms < 253402300799000,
            "invalid fixture timestamp")
    return datetime.fromtimestamp(ms / 1000, tz=timezone.utc).isoformat()


def inspect_receipt(receipt):
    require(type(receipt) is dict and receipt.get("schema") == "csoai.pilot-demo/0.1",
            "receipt schema unknown")
    require(receipt.get("fixture_count") == 14 and
            receipt.get("independent_review") == "NOT_CONDUCTED" and
            receipt.get("human_approval") == "SYNTHETIC_KEY_ONLY" and
            receipt.get("production_authority") is False and
            receipt.get("gspc_measurement_admission") is False, "receipt scope")
    rows = receipt.get("cases")
    require(type(rows) is list and tuple(r.get("scenario") for r in rows if type(r) is dict) == SCENARIOS,
            "fixture scenario identities / denominator changed")
    for case in rows:
        b = case.get("binding")
        require(type(b) is dict and b.get("source") == "OWNED_LOCAL_TEST_FIXTURE"
                and b.get("authenticated_human") is False,
                "actual synthetic process provenance missing")
        for key in ("request_sha256", "approval_sha256", "authority_sha256",
                    "scope_sha256", "invocation_sha256"):
            require(is_hex(b.get(key)), key + " missing")
        for key in ("request_id", "action", "resource_ref", "decision_id",
                    "principal_ref", "authority_epoch", "observer_process"):
            require(type(b.get(key)) is str and b[key], key + " missing")
        require(b["request_id"] == "demo-request-001" and
                b["action"] == "append_bounded_marker" and
                b["resource_ref"] == "local:effects.jsonl" and
                b["principal_ref"] == "demo:role:reviewer-1" and
                b["authority_epoch"].startswith("demo-epoch-"), "outside synthetic fixture")
        require(b.get("declared_decision") in ("APPROVE", "DENY"),
                "unexpected declaration")
        for key in ("decided_at_ms", "expires_at_ms", "execution_at_ms"):
            dt(b.get(key))
        require(type(case.get("reasons")) is list and
                all(type(v) is str and v for v in case["reasons"]),
                "guard reason list missing")
        success = case["scenario"] == "pass"
        require(case.get("execution") == ("EXECUTED" if success else "DENIED") and
                case.get("observer") == ("EFFECT_READBACK_MATCHED" if success else "NO_EFFECT") and
                case.get("actual_effect_written") is success, "effect observation changed")
        if success:
            require(is_hex(b.get("effect_sha256")) and is_hex(b.get("effect_receipt_sha256"))
                    and b["declared_decision"] == "APPROVE" and
                    b["observer_process"] == "separate-local-process", "positive effect evidence absent")
        else:
            require(b.get("effect_sha256") is None and
                    b.get("effect_receipt_sha256") is None and
                    case["reasons"], "denied effect or failure reason misrepresented")
    return rows


def records(receipt, receipt_bytes, source_commit):
    require(type(source_commit) is str and re.fullmatch(r"[a-f0-9]{40}", source_commit),
            "source commit must be pinned")
    cases = inspect_receipt(receipt)
    receipt_digest = sha(receipt_bytes)
    out = []
    for c in cases:
        b = c["binding"]
        positive = c["scenario"] == "pass"
        observed_at = dt(b["execution_at_ms"])
        proof_refs = [
            "sha256:" + receipt_digest,
            "sha256:" + b["request_sha256"],
            "sha256:" + b["approval_sha256"],
            "sha256:" + b["authority_sha256"]
        ]
        if positive:
            proof_refs.extend(["sha256:" + b["effect_sha256"],
                               "sha256:" + b["effect_receipt_sha256"]])
        record_id = "hitl:synthetic:" + sha(receipt_bytes + c["scenario"].encode())[:32]
        out.append({
            "profile": "csoai.hitl-authority-effect/0.1",
            "record_id": record_id,
            "issued_at": receipt["ran_at"],
            "request": {
                "request_id": b["request_id"] + "#" + c["scenario"],
                "subject_ref": "github:CSOAI-ORG/councilof-ai@" + source_commit +
                               "#synthetic-fixture/" + c["scenario"],
                "tenant_ref": "synthetic-demo-tenant",
                "action": b["action"],
                "resource_ref": b["resource_ref"],
                "proposal_digest": {"alg": "sha256", "value": b["request_sha256"]},
                "intent_ref": None
            },
            "authority": {
                "decision_id": b["decision_id"] + "#" + c["scenario"],
                "decision": b["declared_decision"],
                "decided_at": dt(b["decided_at_ms"]),
                "principal_ref": "synthetic-test-principal:" + b["principal_ref"],
                "authority_epoch": b["authority_epoch"],
                "scope_digest": {"alg": "sha256", "value": b["scope_sha256"]},
                "expires_at": dt(b["expires_at_ms"]),
                "review_kind": "AUTHORIZED_PRINCIPAL_REVIEW",
                "constraints": [
                    "SYNTHETIC_TEST_ONLY_NOT_HUMAN",
                    "fixture:" + c["scenario"],
                    "authority validity depends on test guard; the declaration is not a valid live grant"
                ]
            },
            "invocation": {
                "state": "EXECUTED" if positive else "REJECTED",
                "executor_ref": "node:synthetic-owned-fixture",
                "tool_ref": "local:append_bounded_marker",
                "invoked_at": observed_at,
                "invocation_digest": {"alg": "sha256", "value": b["invocation_sha256"]},
                "failure_stage": None if positive else "synthetic-guard:" + c["reasons"][0]
            },
            "effect": {
                "state": "OBSERVED" if positive else "NONE",
                "observed_at": observed_at if positive else None,
                "effect_digest": {"alg": "sha256", "value": b["effect_sha256"]} if positive else None,
                "effect_ref": "local:effects.jsonl#synthetic-only" if positive else None,
                "failure_stage": None
            },
            "verification": {
                "state": "VERIFIED" if positive else "PARTIAL",
                "verified_at": receipt["ran_at"],
                "verifier_ref": "local:separate-process-owned-file-readback",
                "method_ref": "synthetic:approval-effect-demo-v1",
                "evidence_refs": proof_refs
            },
            "claim_maintenance": {
                "claim_ref": None, "reverification_record_ref": None,
                "watch_state": "NOT_WATCHED",
                "next_review_condition": "new synthetic replay; no production authority"
            },
            "provenance": {
                "receipt_ref": "sha256:" + receipt_digest,
                "signature_ref": None,
                "transparency_ref": None,
                "timestamp_ref": None,
                "otel_trace_ref": None,
                "ocsf_record_ref": None
            },
            "limits": LIMITS + [
                "Scenario " + c["scenario"] +
                ": " + ("file-effect digest observed in separate local process" if positive
                        else "no effect file observed by the bounded synthetic test")
            ],
        })
    return out


def validate_records(objs):
    require(type(objs) is list and len(objs) == 14, "profile population must be 14")
    # This is the established draft schema, never a homebrew approval profile.
    import jsonschema
    schema = json.loads(SCHEMA_FILE.read_text())
    validator = jsonschema.Draft202012Validator(schema, format_checker=jsonschema.FormatChecker())
    for index, obj in enumerate(objs):
        errs = list(validator.iter_errors(obj))
        require(not errs, "profile schema: case " + str(index) + " " +
                "; ".join(e.message for e in errs[:3]))
    require(len({x["record_id"] for x in objs}) == 14, "duplicate HITL profile identity")


def digests(objs):
    return [{"profile": "csoai.hitl-authority-effect/0.1", "record_id": x["record_id"],
             "sha256_jcs": sha(evlib.jcs(x))}
            for x in objs]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("mode", choices=["make", "verify"])
    ap.add_argument("--receipt", required=True)
    ap.add_argument("--commit", required=True)
    ap.add_argument("--profiles", required=True)
    a = ap.parse_args()
    raw = Path(a.receipt).read_bytes()
    require(0 < len(raw) < 250000, "receipt too large")
    receipt = json.loads(raw)
    expected = records(receipt, raw, a.commit)
    validate_records(expected)
    if a.mode == "make":
        with Path(a.profiles).open("x", encoding="utf8") as handle:
            json.dump(expected, handle, sort_keys=True, indent=2)
            handle.write("\n")
    else:
        got = json.loads(Path(a.profiles).read_text(encoding="utf8"))
        require(got == expected, "profile pack not reconstructed from source receipt")
        validate_records(got)
    print(json.dumps({"mode": a.mode, "profiles": len(expected),
                      "profile": "csoai.hitl-authority-effect/0.1",
                      "executed": sum(x["invocation"]["state"] == "EXECUTED" for x in expected),
                      "rejected": sum(x["invocation"]["state"] == "REJECTED" for x in expected),
                      "source": "synthetic-owned-files-only",
                      "profile_sha256_jcs": [x["sha256_jcs"] for x in digests(expected)]}))


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (ValueError, OSError, json.JSONDecodeError, ImportError) as exc:
        print("UNCHECKABLE:", str(exc), file=sys.stderr)
        sys.exit(2)
