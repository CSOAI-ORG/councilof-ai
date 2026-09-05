#!/usr/bin/env python3
"""Build a consented learning corpus from independently admitted evidence.

This script deliberately does *not* crawl ``_queue``.  Its only input is the
direct children of ``_queue/training-admitted``.  Every JSONL row must be an
explicit ``csoai.training-eligibility/0.1`` record that:

* grants model-training consent for the named purpose;
* binds provenance and licence metadata to the exact atom bytes; and
* carries an ``ADMITTED_VERIFIED`` measurement admission whose Ed25519
  signature verifies under the separately pinned adjudicator key.

Game observations, incident reports, harvested atoms and prior learning
corpora therefore remain ineligible unless an upstream human/measurement
workflow creates this separate, signed eligibility record.  No eligible rows
means no output file is created.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

HERE = Path(__file__).resolve().parent
QUEUE = HERE / "_queue"
TRAINING_INPUT = QUEUE / "training-admitted"
OUT = HERE / "_queue" / "learn"
MAX_ATOM_BYTES = 3072
MAX_RECORD_BYTES = 8192

TRAINING_SCHEMA = "csoai.training-eligibility/0.1"
TRAINING_PURPOSE = "csoai-model-training"
ADMITTED_STATE = "ADMITTED_VERIFIED"

TRAINING_FIELDS = {
    "schema",
    "atom",
    "consent",
    "provenance",
    "evidence_state",
    "admission",
}
CONSENT_FIELDS = {"model_training", "purpose", "granted_by", "granted_at"}
PROVENANCE_FIELDS = {
    "source_uri",
    "source_sha256",
    "producer_id",
    "license_id",
    "license_uri",
}

# Reuse the board pipeline's exact, independently pinned admission verifier.
# This imports no private keys and performs no signing or filesystem writes.
sys.path.insert(0, str(HERE.parent))
from sign_mill_cards import (  # noqa: E402
    AdmissionError,
    load_adjudicator_config,
    validate_admission,
    valid_rfc3339,
)


class EligibilityError(ValueError):
    """A row is not explicitly eligible for model training."""


def canonical_bytes(value: Any) -> bytes:
    return json.dumps(
        value,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    ).encode("utf-8")


def sha256_hex(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def nonempty_text(value: Any, field: str, limit: int = 2048) -> str:
    if not isinstance(value, str) or not value.strip() or len(value) > limit:
        raise EligibilityError(f"{field} must be a non-empty string of at most {limit} characters")
    if "\n" in value or "\r" in value:
        raise EligibilityError(f"{field} must not contain line breaks")
    return value


def validate_training_record(
    record: Any,
    configured_kid: str,
    configured_public_key: bytes,
) -> dict[str, Any]:
    """Return the record only after every consent, rights and admission gate.

    The exact-field checks are intentional.  A future schema revision must be
    reviewed instead of being silently accepted by an old learner.
    """
    if not isinstance(record, dict) or set(record) != TRAINING_FIELDS:
        raise EligibilityError(f"record must contain exactly {sorted(TRAINING_FIELDS)}")
    if record.get("schema") != TRAINING_SCHEMA:
        raise EligibilityError(f"record schema must be {TRAINING_SCHEMA}")
    if record.get("evidence_state") != ADMITTED_STATE:
        raise EligibilityError(f"evidence_state must be {ADMITTED_STATE}")

    atom = record.get("atom")
    if not isinstance(atom, dict) or not atom:
        raise EligibilityError("atom must be a non-empty object")
    atom_bytes = canonical_bytes(atom)
    if len(atom_bytes) > MAX_ATOM_BYTES:
        raise EligibilityError(f"canonical atom exceeds {MAX_ATOM_BYTES} bytes")
    atom_sha256 = sha256_hex(atom_bytes)

    consent = record.get("consent")
    if not isinstance(consent, dict) or set(consent) != CONSENT_FIELDS:
        raise EligibilityError(f"consent must contain exactly {sorted(CONSENT_FIELDS)}")
    if consent.get("model_training") is not True:
        raise EligibilityError("consent.model_training must be exactly true")
    if consent.get("purpose") != TRAINING_PURPOSE:
        raise EligibilityError(f"consent.purpose must be {TRAINING_PURPOSE}")
    nonempty_text(consent.get("granted_by"), "consent.granted_by", 256)
    if not valid_rfc3339(consent.get("granted_at")):
        raise EligibilityError("consent.granted_at must be RFC3339 with an explicit timezone")

    provenance = record.get("provenance")
    if not isinstance(provenance, dict) or set(provenance) != PROVENANCE_FIELDS:
        raise EligibilityError(f"provenance must contain exactly {sorted(PROVENANCE_FIELDS)}")
    nonempty_text(provenance.get("source_uri"), "provenance.source_uri")
    producer_id = nonempty_text(provenance.get("producer_id"), "provenance.producer_id", 256)
    nonempty_text(provenance.get("license_id"), "provenance.license_id", 256)
    nonempty_text(provenance.get("license_uri"), "provenance.license_uri")
    if provenance.get("source_sha256") != atom_sha256:
        raise EligibilityError("provenance.source_sha256 does not bind the canonical atom")

    try:
        admission = validate_admission(
            record.get("admission"),
            atom_sha256,
            configured_kid,
            configured_public_key,
        )
    except AdmissionError as exc:
        raise EligibilityError(f"measurement admission rejected: {exc}") from exc
    if admission["adjudicator"]["kid"] == producer_id:
        raise EligibilityError("measurement adjudicator must be independent from the data producer")
    return record


def input_files(source_root: Path) -> list[Path]:
    """Return only direct JSONL children; never recurse into queues or outputs."""
    if not source_root.is_dir():
        return []
    return sorted(
        path
        for path in source_root.iterdir()
        if path.is_file()
        and not path.is_symlink()
        and path.suffix == ".jsonl"
        and not path.name.startswith("_")
    )


def learn_record(eligible: dict[str, Any]) -> dict[str, Any]:
    """Convert an already-validated eligibility record into one corpus row."""
    atom = eligible["atom"]
    subject = atom.get("subject", {})
    scope = atom.get("scope", {})
    measurement = atom.get("measurement", {})
    axis = scope.get("axis", "unknown")
    kind = scope.get("kind", "unknown")
    subj_kind = subject.get("kind", "unknown")
    subj_source = subject.get("source", "unknown")
    status = measurement.get("status", "DISCOVERED")

    prompt = (
        f"CSOAI: did you measure {subj_source} ({subj_kind}) "
        f"on the {axis} axis ({kind})?"
    )
    response = (
        f"Status: {status}. "
        f"Evidence: {json.dumps(measurement.get('evidence', {}), separators=(',', ':'))[:300]} "
        f"Source: {measurement.get('source_url', 'unknown')}. "
        f"As of {atom.get('as_of', 'unknown')}. "
        f"Issuer: {atom.get('issuer', 'unknown')}."
    )
    provenance = eligible["provenance"]
    consent = eligible["consent"]
    admission = eligible["admission"]
    return {
        "prompt": prompt,
        "response": response,
        "axis": axis,
        "kind": kind,
        "subj_kind": subj_kind,
        "subj_source": subj_source,
        "status": status,
        "as_of": atom.get("as_of"),
        "training_eligibility": {
            "schema": eligible["schema"],
            "model_training": True,
            "purpose": consent["purpose"],
            "granted_by": consent["granted_by"],
            "granted_at": consent["granted_at"],
            "source_uri": provenance["source_uri"],
            "source_sha256": provenance["source_sha256"],
            "license_id": provenance["license_id"],
            "license_uri": provenance["license_uri"],
            "evidence_state": eligible["evidence_state"],
            "admission_schema": admission["schema"],
            "adjudicator_kid": admission["adjudicator"]["kid"],
            "admitted_at": admission["admitted_at"],
        },
    }


def main():
    ap = argparse.ArgumentParser(description="Build the learning corpus.")
    ap.add_argument("--limit", type=int, default=10000)
    args = ap.parse_args()

    print("================================================================")
    print("  CSOAI — LEARNING CORPUS BUILDER")
    print("================================================================")
    print()

    if args.limit <= 0:
        print("  REFUSED: --limit must be a positive integer", file=sys.stderr)
        return 1

    expected_input = QUEUE / "training-admitted"
    if TRAINING_INPUT.is_symlink() or TRAINING_INPUT.resolve() != expected_input.resolve():
        print(
            "  REFUSED: training input must be the dedicated non-recursive training-admitted root",
            file=sys.stderr,
        )
        return 1

    files = input_files(TRAINING_INPUT)
    if not files:
        print("  no direct training-admitted JSONL inputs; no corpus written")
        return 0

    try:
        configured_kid, configured_public_key = load_adjudicator_config()
    except AdmissionError as exc:
        print(f"  REFUSED: {exc}", file=sys.stderr)
        return 1

    stats = {}
    rows: list[dict[str, Any]] = []
    rejected = 0

    for jsonl in files:
        kind = jsonl.stem
        stats[kind] = 0
        with open(jsonl, encoding="utf-8") as src:
            for line_number, line in enumerate(src, start=1):
                line = line.strip()
                if not line:
                    continue
                if len(line.encode("utf-8")) > MAX_RECORD_BYTES:
                    rejected += 1
                    print(
                        f"  rejected {jsonl.name}:{line_number}: "
                        f"record exceeds {MAX_RECORD_BYTES} bytes",
                        file=sys.stderr,
                    )
                    continue
                try:
                    candidate = json.loads(line)
                    eligible = validate_training_record(
                        candidate,
                        configured_kid,
                        configured_public_key,
                    )
                except (json.JSONDecodeError, EligibilityError) as exc:
                    rejected += 1
                    print(
                        f"  rejected {jsonl.name}:{line_number}: {exc}",
                        file=sys.stderr,
                    )
                    continue
                rows.append(learn_record(eligible))
                stats[kind] += 1
                if len(rows) >= args.limit:
                    break
        if len(rows) >= args.limit:
            break

    total = len(rows)
    if not rows:
        print(f"  zero eligible records ({rejected} rejected); no corpus written")
        return 0

    OUT.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    out_path = OUT / f"learn-corpus-{stamp}.jsonl"
    with open(out_path, "x", encoding="utf-8") as dst:
        for row in rows:
            dst.write(json.dumps(row, separators=(",", ":"), ensure_ascii=False) + "\n")

    print(f"  wrote {total} training pairs")
    print(f"  rejected {rejected} ineligible records")
    print(f"  by kind:")
    for k, n in sorted(stats.items()):
        print(f"    {k:<28} {n}")
    print()
    print(f"  corpus: {out_path}")
    print()
    print("  Next: separately review this consented corpus before any training job")
    return 0


if __name__ == "__main__":
    sys.exit(main())
