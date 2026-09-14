"""Deterministic connector envelope shared by HF, Kaggle, and GitHub mirrors.

The envelope transports reviewed public artifacts. It never grants a mirror
authority to create, sign, or promote a measurement.
"""
from __future__ import annotations

import hashlib
import json
import re
from datetime import datetime
from typing import Any, Iterable

SCHEMA = "csoai.mirror-connector-envelope/1.0"
AUTHORITY = "https://councilof.ai"
MIRROR_ROLE = "consumer"
PLATFORMS = frozenset({"councilofai", "github", "huggingface", "kaggle"})
LIFECYCLE_STATES = frozenset({"reviewed", "published", "withdrawn", "error"})
SHA256_RE = re.compile(r"^[0-9a-f]{64}$")


class EnvelopeError(ValueError):
    """Raised when an envelope would weaken provenance or lifecycle truth."""


def canonical_bytes(value: Any) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")


def sha256_bytes(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def _iso8601_utc(value: str) -> bool:
    if not isinstance(value, str) or not value.endswith("Z"):
        return False
    try:
        datetime.fromisoformat(value[:-1] + "+00:00")
    except ValueError:
        return False
    return True


def build_envelope(
    *,
    source_platform: str,
    source_uri: str,
    source_revision: str,
    subject_kind: str,
    subject_id: str,
    measurement_kind: str,
    artifact_uri: str,
    artifact_payload: bytes,
    artifact_media_type: str,
    timestamp: str,
    license_id: str,
    provenance_uri: str,
    lifecycle_state: str,
    error: dict[str, Any] | None = None,
) -> dict[str, Any]:
    core: dict[str, Any] = {
        "schema": SCHEMA,
        "source": {
            "platform": source_platform,
            "uri": source_uri,
            "revision": source_revision,
        },
        "subject": {"kind": subject_kind, "id": subject_id},
        "measurement_kind": measurement_kind,
        "artifact": {
            "uri": artifact_uri,
            "sha256": sha256_bytes(artifact_payload),
            "bytes": len(artifact_payload),
            "media_type": artifact_media_type,
        },
        "timestamp": timestamp,
        "license_provenance": {
            "license": license_id,
            "provenance_uri": provenance_uri,
        },
        "lifecycle": {"state": lifecycle_state},
        "error": error,
        "authority": {"uri": AUTHORITY, "role": "canonical-review-authority"},
        "mirror_role": MIRROR_ROLE,
    }
    core["envelope_id"] = sha256_bytes(canonical_bytes(core))
    validate_envelope(core)
    return core


def validate_envelope(envelope: dict[str, Any], artifact_payload: bytes | None = None) -> None:
    if not isinstance(envelope, dict) or envelope.get("schema") != SCHEMA:
        raise EnvelopeError("unsupported connector envelope schema")
    source = envelope.get("source")
    if not isinstance(source, dict) or source.get("platform") not in PLATFORMS:
        raise EnvelopeError("source.platform is missing or unsupported")
    for field in ("uri", "revision"):
        if not isinstance(source.get(field), str) or not source[field].strip():
            raise EnvelopeError(f"source.{field} is required")
    subject = envelope.get("subject")
    if not isinstance(subject, dict) or not all(isinstance(subject.get(k), str) and subject[k] for k in ("kind", "id")):
        raise EnvelopeError("subject.kind and subject.id are required")
    if not isinstance(envelope.get("measurement_kind"), str) or not envelope["measurement_kind"]:
        raise EnvelopeError("measurement_kind is required")
    artifact = envelope.get("artifact")
    if not isinstance(artifact, dict) or not SHA256_RE.fullmatch(str(artifact.get("sha256", ""))):
        raise EnvelopeError("artifact.sha256 must be a lowercase SHA-256 digest")
    if not isinstance(artifact.get("bytes"), int) or artifact["bytes"] < 0:
        raise EnvelopeError("artifact.bytes must be a non-negative integer")
    for field in ("uri", "media_type"):
        if not isinstance(artifact.get(field), str) or not artifact[field]:
            raise EnvelopeError(f"artifact.{field} is required")
    if not _iso8601_utc(envelope.get("timestamp")):
        raise EnvelopeError("timestamp must be an ISO-8601 UTC value ending in Z")
    lp = envelope.get("license_provenance")
    if not isinstance(lp, dict) or not all(isinstance(lp.get(k), str) and lp[k] for k in ("license", "provenance_uri")):
        raise EnvelopeError("license and provenance_uri are required")
    lifecycle = envelope.get("lifecycle")
    state = lifecycle.get("state") if isinstance(lifecycle, dict) else None
    if state not in LIFECYCLE_STATES:
        raise EnvelopeError("unsupported lifecycle state")
    error = envelope.get("error")
    if state == "error":
        if not isinstance(error, dict) or not all(isinstance(error.get(k), str) and error[k] for k in ("code", "message")):
            raise EnvelopeError("error lifecycle requires code and message")
        if not isinstance(error.get("retryable"), bool):
            raise EnvelopeError("error.retryable must be boolean")
    elif error is not None:
        raise EnvelopeError("error must be null outside the error lifecycle")
    if envelope.get("authority") != {"uri": AUTHORITY, "role": "canonical-review-authority"}:
        raise EnvelopeError("mirror cannot replace the canonical review authority")
    if envelope.get("mirror_role") != MIRROR_ROLE:
        raise EnvelopeError("mirror_role must remain consumer")
    envelope_id = envelope.get("envelope_id")
    without_id = {k: v for k, v in envelope.items() if k != "envelope_id"}
    if envelope_id != sha256_bytes(canonical_bytes(without_id)):
        raise EnvelopeError("envelope_id does not match canonical envelope bytes")
    if artifact_payload is not None:
        if artifact["bytes"] != len(artifact_payload) or artifact["sha256"] != sha256_bytes(artifact_payload):
            raise EnvelopeError("artifact bytes do not match the declared digest")


def parse_jsonl(payload: bytes) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for number, line in enumerate(payload.decode("utf-8").splitlines(), 1):
        if not line.strip():
            continue
        try:
            row = json.loads(line)
        except json.JSONDecodeError as exc:
            raise EnvelopeError(f"line {number} is not JSON") from exc
        validate_envelope(row)
        rows.append(row)
    if not rows:
        raise EnvelopeError("reviewed stream is empty")
    return rows


def encode_jsonl(rows: Iterable[dict[str, Any]]) -> bytes:
    materialized = sorted(rows, key=lambda row: row["envelope_id"])
    for row in materialized:
        validate_envelope(row)
    return ("\n".join(canonical_bytes(row).decode("ascii") for row in materialized) + "\n").encode("ascii")

