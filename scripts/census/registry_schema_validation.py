#!/usr/bin/env python3
"""Schema-validation stage for registry census records.

WHY THIS EXISTS
---------------
An upstream registry serving a record is one fact. That record being well-formed
against its own declared schema is a *different* fact. MCP Registry issue #1546
(opened 19 Aug 2026) is the worked example: the registry serves
``ai.alpic.test/test-mcp-server@0.0.1`` at HTTP 200 with ``"repository": {}``,
while the 2025-09-29 schema that record itself declares says
``Repository.required = ["url", "source"]``.

If a census records "it was in the registry" in a field that readers take to mean
"it is well-formed", the census launders somebody else's defect into our evidence.
So: PRESENCE NEVER CONFERS VALIDITY. This stage runs AFTER collection, never
mutates the collected bytes, and writes its verdict BESIDE them.

STATES (never collapsed into one another)
-----------------------------------------
source_state:
  SOURCE_ACCEPTED     the upstream served these bytes. That is all it means.

schema_state:
  SCHEMA_VALID        validates against the schema the record ITSELF declares
  SCHEMA_INVALID      does not validate; ``violations`` names each one
  SCHEMA_UNDECLARED   the record names no schema. NOT a failure and NOT a pass.
  SCHEMA_UNFETCHABLE  a schema was declared but could not be retrieved/used.
                      Never a silent pass.
  RECORD_UNPARSEABLE  the served bytes are not JSON at all, so no schema can be
                      declared by them. Kept separate from UNDECLARED, which
                      presupposes a readable record.

Structural JSON parse success is NOT schema validity and never sets SCHEMA_VALID.

OFFLINE
-------
Schemas resolve through an on-disk cache (``schema-cache/``) keyed by
sha256(schema_url). With ``allow_network=False`` — the default, and what the test
suite uses — a cache miss is SCHEMA_UNFETCHABLE rather than a network call.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable, Sequence

import jsonschema

SOURCE_ACCEPTED = "SOURCE_ACCEPTED"

SCHEMA_VALID = "SCHEMA_VALID"
SCHEMA_INVALID = "SCHEMA_INVALID"
SCHEMA_UNDECLARED = "SCHEMA_UNDECLARED"
SCHEMA_UNFETCHABLE = "SCHEMA_UNFETCHABLE"
RECORD_UNPARSEABLE = "RECORD_UNPARSEABLE"

SCHEMA_STATES = (
    SCHEMA_VALID,
    SCHEMA_INVALID,
    SCHEMA_UNDECLARED,
    SCHEMA_UNFETCHABLE,
    RECORD_UNPARSEABLE,
)

DEFAULT_CACHE_DIR = Path(__file__).with_name("schema-cache")
CACHE_INDEX_NAME = "index.json"

# A record is third-party data. Its "$schema" is a URL chosen by whoever
# published it, so resolution is deliberately narrow: https only.
ALLOWED_SCHEMA_SCHEMES = ("https",)


def _utcnow() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# --------------------------------------------------------------------------
# schema resolution
# --------------------------------------------------------------------------


@dataclass(frozen=True)
class SchemaResolution:
    """Outcome of trying to obtain the schema a record declares."""

    state: str  # SCHEMA_UNDECLARED | SCHEMA_UNFETCHABLE | "" (resolved)
    schema_url: str | None = None
    schema: dict[str, Any] | None = None
    schema_sha256: str | None = None
    source: str | None = None  # "cache" | "network"
    reason: str | None = None

    @property
    def resolved(self) -> bool:
        return self.schema is not None


class SchemaResolver:
    """Resolves declared schema URLs through an on-disk cache.

    ``allow_network`` defaults to False so that importing this module can never
    cause a network call by accident. The sampling driver opts in explicitly.
    """

    def __init__(
        self,
        cache_dir: Path | str = DEFAULT_CACHE_DIR,
        allow_network: bool = False,
        timeout: float = 30.0,
    ) -> None:
        self.cache_dir = Path(cache_dir)
        self.allow_network = allow_network
        self.timeout = timeout
        self._memo: dict[str, SchemaResolution] = {}
        self._index = self._load_index()

    # -- cache plumbing ----------------------------------------------------

    @property
    def _index_path(self) -> Path:
        return self.cache_dir / CACHE_INDEX_NAME

    def _load_index(self) -> dict[str, Any]:
        try:
            return json.loads(self._index_path.read_text())
        except (OSError, ValueError):
            return {"schemas": {}}

    def _write_index(self) -> None:
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self._index_path.write_text(
            json.dumps(self._index, indent=2, sort_keys=True) + "\n"
        )

    @staticmethod
    def cache_key(schema_url: str) -> str:
        return hashlib.sha256(schema_url.encode("utf-8")).hexdigest()

    def _read_cached(self, schema_url: str) -> tuple[bytes, str] | None:
        entry = (self._index.get("schemas") or {}).get(schema_url)
        name = entry.get("file") if isinstance(entry, dict) else None
        if not name:
            name = self.cache_key(schema_url) + ".json"
        path = self.cache_dir / name
        try:
            raw = path.read_bytes()
        except OSError:
            return None
        return raw, hashlib.sha256(raw).hexdigest()

    def _store(self, schema_url: str, raw: bytes) -> str:
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        name = self.cache_key(schema_url) + ".json"
        (self.cache_dir / name).write_bytes(raw)
        digest = hashlib.sha256(raw).hexdigest()
        self._index.setdefault("schemas", {})[schema_url] = {
            "file": name,
            "sha256": digest,
            "bytes": len(raw),
            "fetched_at": _utcnow(),
        }
        self._write_index()
        return digest

    # -- resolution --------------------------------------------------------

    def resolve(self, schema_url: str | None) -> SchemaResolution:
        if schema_url is None or not str(schema_url).strip():
            return SchemaResolution(
                state=SCHEMA_UNDECLARED,
                reason="record declares no $schema",
            )
        schema_url = str(schema_url).strip()
        if schema_url in self._memo:
            return self._memo[schema_url]
        result = self._resolve_uncached(schema_url)
        self._memo[schema_url] = result
        return result

    def _resolve_uncached(self, schema_url: str) -> SchemaResolution:
        scheme = urllib.parse.urlparse(schema_url).scheme.lower()
        if scheme not in ALLOWED_SCHEMA_SCHEMES:
            return SchemaResolution(
                state=SCHEMA_UNFETCHABLE,
                schema_url=schema_url,
                reason=f"declared $schema scheme {scheme or '<none>'!r} is not permitted "
                f"(allowed: {', '.join(ALLOWED_SCHEMA_SCHEMES)})",
            )

        cached = self._read_cached(schema_url)
        source = "cache"
        if cached is None:
            if not self.allow_network:
                return SchemaResolution(
                    state=SCHEMA_UNFETCHABLE,
                    schema_url=schema_url,
                    reason="schema not in offline cache and network is disabled",
                )
            try:
                req = urllib.request.Request(
                    schema_url, headers={"User-Agent": "csoai-registry-census/1"}
                )
                with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                    raw = resp.read()
            except (urllib.error.URLError, OSError, ValueError) as exc:
                return SchemaResolution(
                    state=SCHEMA_UNFETCHABLE,
                    schema_url=schema_url,
                    reason=f"fetch failed: {type(exc).__name__}: {exc}",
                )
            digest = self._store(schema_url, raw)
            cached = (raw, digest)
            source = "network"

        raw, digest = cached
        try:
            schema = json.loads(raw)
        except ValueError as exc:
            return SchemaResolution(
                state=SCHEMA_UNFETCHABLE,
                schema_url=schema_url,
                schema_sha256=digest,
                source=source,
                reason=f"retrieved bytes are not JSON: {exc}",
            )
        if not isinstance(schema, dict):
            return SchemaResolution(
                state=SCHEMA_UNFETCHABLE,
                schema_url=schema_url,
                schema_sha256=digest,
                source=source,
                reason="retrieved JSON is not a schema object",
            )
        try:
            validator_cls = jsonschema.validators.validator_for(schema)
            validator_cls.check_schema(schema)
        except Exception as exc:  # noqa: BLE001 - any schema defect is unusable
            return SchemaResolution(
                state=SCHEMA_UNFETCHABLE,
                schema_url=schema_url,
                schema_sha256=digest,
                source=source,
                reason=f"retrieved document is not a usable JSON Schema: "
                f"{type(exc).__name__}: {exc}",
            )
        return SchemaResolution(
            state="",
            schema_url=schema_url,
            schema=schema,
            schema_sha256=digest,
            source=source,
        )


# --------------------------------------------------------------------------
# verdicts
# --------------------------------------------------------------------------


@dataclass(frozen=True)
class Violation:
    path: str
    message: str
    validator: str

    def to_dict(self) -> dict[str, str]:
        return {"path": self.path, "message": self.message, "validator": self.validator}


@dataclass(frozen=True)
class Verdict:
    """Sits BESIDE the collected record. Never replaces or edits it."""

    source_state: str
    schema_state: str
    record_sha256: str
    record_identity: dict[str, Any] = field(default_factory=dict)
    schema_url: str | None = None
    schema_sha256: str | None = None
    schema_source: str | None = None
    violations: tuple[Violation, ...] = ()
    note: str | None = None
    validated_at: str = field(default_factory=_utcnow)

    def to_dict(self) -> dict[str, Any]:
        return {
            "source_state": self.source_state,
            "schema_state": self.schema_state,
            "record_sha256": self.record_sha256,
            "record_identity": self.record_identity,
            "schema_url": self.schema_url,
            "schema_sha256": self.schema_sha256,
            "schema_source": self.schema_source,
            "violations": [v.to_dict() for v in self.violations],
            "note": self.note,
            "validated_at": self.validated_at,
        }


def _pointer(error: jsonschema.ValidationError) -> str:
    parts = ["$"]
    for token in error.absolute_path:
        parts.append(f"[{token}]" if isinstance(token, int) else f".{token}")
    return "".join(parts)


def _identity(server: Any) -> dict[str, Any]:
    if not isinstance(server, dict):
        return {}
    out = {}
    for key in ("name", "version"):
        value = server.get(key)
        if isinstance(value, (str, int, float)):
            out[key] = value
    return out


def validate_record_bytes(
    raw: bytes | str,
    resolver: SchemaResolver,
    envelope: bool | None = None,
) -> Verdict:
    """Validate served bytes without touching them.

    ``raw`` is exactly what the upstream served. Nothing here writes back to it.

    ``envelope``: registry list responses wrap the server detail as
    ``{"server": {...}, "_meta": {...}}``. None auto-detects; True/False force it.
    The envelope is never rewritten — we only choose which subtree the declared
    schema is meant to describe.
    """
    if isinstance(raw, str):
        raw_bytes = raw.encode("utf-8")
    else:
        raw_bytes = raw
    digest = hashlib.sha256(raw_bytes).hexdigest()

    try:
        parsed = json.loads(raw_bytes)
    except ValueError as exc:
        return Verdict(
            source_state=SOURCE_ACCEPTED,
            schema_state=RECORD_UNPARSEABLE,
            record_sha256=digest,
            note=f"served bytes are not JSON: {exc}",
        )

    # Structural parse succeeded. That is NOT validity — keep going.
    if envelope is None:
        envelope = isinstance(parsed, dict) and isinstance(parsed.get("server"), dict)
    server = parsed.get("server") if (envelope and isinstance(parsed, dict)) else parsed

    identity = _identity(server)
    declared = server.get("$schema") if isinstance(server, dict) else None

    resolution = resolver.resolve(declared)
    if not resolution.resolved:
        return Verdict(
            source_state=SOURCE_ACCEPTED,
            schema_state=resolution.state,
            record_sha256=digest,
            record_identity=identity,
            schema_url=resolution.schema_url,
            schema_sha256=resolution.schema_sha256,
            schema_source=resolution.source,
            note=resolution.reason,
        )

    validator_cls = jsonschema.validators.validator_for(resolution.schema)
    validator = validator_cls(resolution.schema)
    errors = sorted(validator.iter_errors(server), key=lambda e: list(e.absolute_path))
    violations = tuple(
        Violation(path=_pointer(e), message=e.message, validator=str(e.validator))
        for e in errors
    )

    return Verdict(
        source_state=SOURCE_ACCEPTED,
        schema_state=SCHEMA_INVALID if violations else SCHEMA_VALID,
        record_sha256=digest,
        record_identity=identity,
        schema_url=resolution.schema_url,
        schema_sha256=resolution.schema_sha256,
        schema_source=resolution.source,
        violations=violations,
    )


def validate_collected(
    records: Iterable[bytes | str],
    resolver: SchemaResolver | None = None,
) -> list[Verdict]:
    resolver = resolver or SchemaResolver()
    return [validate_record_bytes(r, resolver) for r in records]


def distribution(verdicts: Sequence[Verdict]) -> dict[str, int]:
    """Every state is reported, including the zeroes. A state absent from a
    distribution table reads as 'not measured'; a zero reads as 'measured, none'."""
    counts = {state: 0 for state in SCHEMA_STATES}
    for v in verdicts:
        counts[v.schema_state] = counts.get(v.schema_state, 0) + 1
    return counts


def main(argv: Sequence[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("paths", nargs="+", help="JSON files holding served record bytes")
    ap.add_argument("--cache-dir", default=str(DEFAULT_CACHE_DIR))
    ap.add_argument("--allow-network", action="store_true")
    args = ap.parse_args(argv)

    resolver = SchemaResolver(args.cache_dir, allow_network=args.allow_network)
    verdicts = []
    for p in args.paths:
        verdict = validate_record_bytes(Path(p).read_bytes(), resolver)
        verdicts.append(verdict)
        print(json.dumps({"path": p, **verdict.to_dict()}, indent=2, sort_keys=True))
    print(json.dumps({"distribution": distribution(verdicts)}, sort_keys=True))
    return 0


if __name__ == "__main__":
    sys.exit(main())
