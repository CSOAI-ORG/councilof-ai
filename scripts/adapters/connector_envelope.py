#!/usr/bin/env python3
"""Reference validator for the connector envelope (public/schema/connector-envelope-v0.json).

Zero dependencies. Checks the schema's structure plus the one rule a JSON Schema engine
cannot: idempotency_key must equal the recomputed sha256 over
[source, subject, measurement_kind, artifact.sha256].

It never promotes a state, signs, roots or writes anything. CLI fails closed: exit 1 on
any invalid envelope, exit 2 on unreadable input, exit 0 only when every envelope passed.

    python3 scripts/adapters/connector_envelope.py FILE.json|FILE.jsonl [...]
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path
from typing import Any

SCHEMA = "csoai.connector-envelope/0.1"
SCHEMA_PATH = Path("public/schema/connector-envelope-v0.json")

LIFECYCLE_STATES = frozenset(
    {"INDEXED", "PROBED", "MEASURED", "UNMEASURED", "UNCHECKABLE", "QUARANTINED", "SIGNED", "ROOTED"}
)
MEASUREMENT_KINDS = frozenset({"model-comparison", "deterministic-facts", "declared-slot"})
# States that claim bytes were obtained and hashed.
HASH_REQUIRED_STATES = frozenset({"PROBED", "MEASURED", "SIGNED", "ROOTED"})
# States that may carry a measured value.
MEASURED_STATES = frozenset({"MEASURED", "SIGNED", "ROOTED"})
# States an error envelope may take.
ERROR_STATES = frozenset({"UNMEASURED", "UNCHECKABLE", "QUARANTINED"})

REQUIRED = (
    "schema", "source", "subject", "measurement_kind", "artifact", "observed_at", "license",
    "provenance", "lifecycle_state", "measurement", "error", "idempotency_key", "writes_board",
)
SOURCE_KEYS = {"connector", "url"}
SUBJECT_KEYS = {"kind", "id", "revision", "url"}
ARTIFACT_KEYS = {"sha256", "bytes", "url", "path", "pointer"}
PROVENANCE_KEYS = {"producer", "producer_revision"}
MEASUREMENT_KEYS = {"value", "n", "unit"}
ERROR_KEYS = {"code", "detail"}

HEX64 = re.compile(r"^[0-9a-f]{64}$")
KEY_RE = re.compile(r"^sha256:[0-9a-f]{64}$")
CONNECTOR_RE = re.compile(r"^[a-z0-9][a-z0-9.-]{0,63}$")
SUBJECT_KIND_RE = re.compile(r"^[a-z0-9][a-z0-9-]{0,31}$")
UTC_RE = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$")
REVISION_RE = re.compile(r"^(sha256:[0-9a-f]{64}|[0-9a-f]{40}|UNCHECKABLE)$")
ERROR_CODE_RE = re.compile(r"^[A-Z][A-Z0-9_]{1,63}$")
POINTER_RE = re.compile(r"^(/[^/]*)*$")


def canonical_bytes(obj: Any) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def idempotency_key(source: dict, subject: dict, measurement_kind: str, artifact_sha256: str | None) -> str:
    return "sha256:" + sha256_hex(canonical_bytes([source, subject, measurement_kind, artifact_sha256]))


def _is_str(v: Any) -> bool:
    return isinstance(v, str)


def _is_int(v: Any) -> bool:
    return isinstance(v, int) and not isinstance(v, bool)


def _extra(obj: dict, allowed: set[str], where: str) -> list[str]:
    return [f"{where}: unknown field {k!r}" for k in sorted(set(obj) - allowed)]


def validate(env: Any) -> list[str]:
    """Every rule the envelope breaks. An empty list is the only pass."""
    if not isinstance(env, dict):
        return ["envelope: not a JSON object"]
    errs: list[str] = []
    for k in REQUIRED:
        if k not in env:
            errs.append(f"missing field {k!r}")
    errs += _extra(env, set(REQUIRED), "envelope")
    if errs:
        return errs

    if env["schema"] != SCHEMA:
        errs.append(f"schema: expected {SCHEMA!r}")
    if env["writes_board"] is not False:
        errs.append("writes_board: must be false")

    src = env["source"]
    if not isinstance(src, dict):
        errs.append("source: not an object")
    else:
        errs += _extra(src, SOURCE_KEYS, "source")
        if not (_is_str(src.get("connector")) and CONNECTOR_RE.match(src["connector"])):
            errs.append("source.connector: missing or malformed")
        if not (_is_str(src.get("url")) and src["url"].startswith("https://")):
            errs.append("source.url: must be an https URL")

    sub = env["subject"]
    if not isinstance(sub, dict):
        errs.append("subject: not an object")
    else:
        errs += _extra(sub, SUBJECT_KEYS, "subject")
        if not (_is_str(sub.get("kind")) and SUBJECT_KIND_RE.match(sub["kind"])):
            errs.append("subject.kind: missing or malformed")
        if not (_is_str(sub.get("id")) and 1 <= len(sub["id"]) <= 512):
            errs.append("subject.id: missing or malformed")
        if "revision" not in sub or not (sub["revision"] is None or _is_str(sub["revision"])):
            errs.append("subject.revision: required; string or null")
        if "url" in sub and not (_is_str(sub["url"]) and sub["url"].startswith("https://")):
            errs.append("subject.url: must be an https URL")

    if env["measurement_kind"] not in MEASUREMENT_KINDS:
        errs.append(f"measurement_kind: unknown {env['measurement_kind']!r}")

    state = env["lifecycle_state"]
    if state not in LIFECYCLE_STATES:
        errs.append(f"lifecycle_state: unknown {state!r}")

    art = env["artifact"]
    art_sha: Any = None
    if not isinstance(art, dict):
        errs.append("artifact: not an object")
    else:
        errs += _extra(art, ARTIFACT_KEYS, "artifact")
        if "sha256" not in art:
            errs.append("artifact.sha256: required (null only when no bytes were obtained)")
        art_sha = art.get("sha256")
        if art_sha is not None and not (_is_str(art_sha) and HEX64.match(art_sha)):
            errs.append("artifact.sha256: must be 64 lowercase hex or null")
        if "bytes" not in art or not (art["bytes"] is None or (_is_int(art["bytes"]) and art["bytes"] >= 0)):
            errs.append("artifact.bytes: required; non-negative integer or null")
        if "url" not in art and "path" not in art:
            errs.append("artifact: needs url or path")
        if "url" in art and not (_is_str(art["url"]) and art["url"].startswith("https://")):
            errs.append("artifact.url: must be an https URL")
        if "path" in art and not (_is_str(art["path"]) and art["path"] and not art["path"].startswith("/")):
            errs.append("artifact.path: must be a repo-relative path")
        if "pointer" in art and not (_is_str(art["pointer"]) and POINTER_RE.match(art["pointer"])):
            errs.append("artifact.pointer: must be a JSON Pointer")
        if state in HASH_REQUIRED_STATES and art_sha is None:
            errs.append(f"artifact.sha256: {state} requires an artifact hash")

    if not (_is_str(env["observed_at"]) and UTC_RE.match(env["observed_at"])):
        errs.append("observed_at: must be UTC ISO-8601 ending in Z")
    if not (_is_str(env["license"]) and env["license"]):
        errs.append("license: non-empty string (UNCHECKABLE when unpublished)")

    prov = env["provenance"]
    if not isinstance(prov, dict):
        errs.append("provenance: not an object")
    else:
        errs += _extra(prov, PROVENANCE_KEYS, "provenance")
        if not (_is_str(prov.get("producer")) and prov["producer"]):
            errs.append("provenance.producer: required")
        if not (_is_str(prov.get("producer_revision")) and REVISION_RE.match(prov["producer_revision"])):
            errs.append("provenance.producer_revision: sha256:<hex>, a 40-hex commit, or UNCHECKABLE")

    meas = env["measurement"]
    err = env["error"]
    if meas is not None:
        if not isinstance(meas, dict):
            errs.append("measurement: object or null")
        else:
            errs += _extra(meas, MEASUREMENT_KEYS, "measurement")
            v = meas.get("value")
            if "value" not in meas or v is None or not isinstance(v, (int, float, str, bool)):
                errs.append("measurement.value: required scalar")
            if "n" in meas and not (_is_int(meas["n"]) and meas["n"] >= 1):
                errs.append("measurement.n: positive integer")
            if "unit" in meas and not _is_str(meas["unit"]):
                errs.append("measurement.unit: string")
    if err is not None:
        if not isinstance(err, dict):
            errs.append("error: object or null")
        else:
            errs += _extra(err, ERROR_KEYS, "error")
            if not (_is_str(err.get("code")) and ERROR_CODE_RE.match(err["code"])):
                errs.append("error.code: UPPER_SNAKE code required")
            if not _is_str(err.get("detail")):
                errs.append("error.detail: string required")
        if meas is not None:
            errs.append("error envelope carries a measurement value")
        if state not in ERROR_STATES:
            errs.append(f"error: an error envelope cannot be {state}")
    if state in MEASURED_STATES and meas is None:
        errs.append(f"measurement: {state} requires a measurement value")
    if state not in MEASURED_STATES and meas is not None:
        errs.append(f"measurement: {state} must not carry a measurement value")

    key = env["idempotency_key"]
    if not (_is_str(key) and KEY_RE.match(key)):
        errs.append("idempotency_key: must be sha256:<64 hex>")
    elif isinstance(src, dict) and isinstance(sub, dict) and isinstance(art, dict):
        expected = idempotency_key(src, sub, env["measurement_kind"], art_sha)
        if key != expected:
            errs.append("idempotency_key: does not match sha256 over [source, subject, measurement_kind, artifact.sha256]")
    return errs


def _load(path: Path) -> list[Any]:
    text = path.read_text(encoding="utf-8")
    if path.suffix == ".jsonl":
        return [json.loads(line) for line in text.splitlines() if line.strip()]
    doc = json.loads(text)
    return doc if isinstance(doc, list) else [doc]


def main(argv: list[str]) -> int:
    if not argv:
        print(__doc__.strip().splitlines()[-1].strip(), file=sys.stderr)
        return 2
    bad = total = 0
    for name in argv:
        try:
            envs = _load(Path(name))
        except (OSError, ValueError) as e:
            print(f"UNREADABLE {name}: {e}", file=sys.stderr)
            return 2
        if not envs:
            print(f"UNREADABLE {name}: no envelopes (empty is not a pass)", file=sys.stderr)
            return 2
        for i, env in enumerate(envs):
            total += 1
            problems = validate(env)
            if problems:
                bad += 1
                for p in problems:
                    print(f"INVALID {name}[{i}]: {p}")
    print(f"{total - bad}/{total} envelopes valid")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
