#!/usr/bin/env python3
"""Kaggle -> connector envelope (public/schema/connector-envelope-v0.json). Issue #2391.

Two real inputs, both read from bytes, no network:

1. A Kaggle fleet lock (default public/fleet/KAGGLE.lock.json, committed in #1757). It is a
   queue read off the Kaggle Models list API: every row UNMEASURED, n_measured 0. Each row
   becomes an INDEXED envelope. A lock carries no measurement artifact, so a row that claims
   anything above UNMEASURED becomes UNCHECKABLE with an error, never MEASURED.

2. A harvested kernel output directory from gpu-offload/kaggle-community-cells
   (kaggle_community_cells_report.json + the unsigned-*.json cards it lists). Each honest
   unsigned card becomes a QUARANTINED envelope: bytes hashed, value left inside the hashed
   card, awaiting the existing land -> sign path. Card honesty is judged by
   scripts/land_mill_cards.py reject_reason, not a second copy of that rule.

Never signs, roots, uploads, or writes the board. observed_at comes from the input, never
now(), so replaying the adapter over the same bytes yields identical envelopes and keys.

    python3 scripts/adapters/kaggle_envelopes.py [--lock PATH] [--harvest DIR] [--out FILE.jsonl]
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import re
import sys
from pathlib import Path
from typing import Any

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(HERE.parent))

from adapters.connector_envelope import (  # noqa: E402
    SCHEMA,
    canonical_bytes,
    idempotency_key,
    sha256_hex,
    validate,
)

PRODUCER = "scripts/adapters/kaggle_envelopes.py"
LOCK_REL = "public/fleet/KAGGLE.lock.json"
LOCK_CONNECTOR = "kaggle-models-list"
LOCK_SOURCE_URL = "https://www.kaggle.com/api/v1/models/list"
HARVEST_CONNECTOR = "kaggle-community-cells"
HARVEST_SOURCE_URL = "https://www.kaggle.com/code/nicktempleman/csoai-kaggle-community-cells"
HARVEST_REPORT = "kaggle_community_cells_report.json"
KAGGLE_ROUTE = "kaggle-community"
PUBLIC_ORIGIN = "https://councilof.ai/"
UTC_Z = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$")
UTC_OFFSET = re.compile(r"^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?)\+00:00$")


def producer_revision() -> str:
    """Content digest of this file: reproducible from the tree, no git needed."""
    return "sha256:" + sha256_hex(Path(__file__).read_bytes())


def _utc(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    if UTC_Z.match(value):
        return value
    m = UTC_OFFSET.match(value)
    return f"{m.group(1)}Z" if m else None


def _artifact(raw: bytes | None, rel: str, pointer: str | None = None) -> dict[str, Any]:
    art: dict[str, Any] = {
        "sha256": sha256_hex(raw) if raw is not None else None,
        "bytes": len(raw) if raw is not None else None,
        "path": rel,
    }
    if rel.startswith("public/"):
        art["url"] = PUBLIC_ORIGIN + rel[len("public/"):]
    if pointer is not None:
        art["pointer"] = pointer
    return art


def _envelope(
    *,
    connector: str,
    source_url: str,
    subject: dict[str, Any],
    artifact: dict[str, Any],
    observed_at: str,
    state: str,
    error: dict[str, str] | None,
    revision: str,
) -> dict[str, Any]:
    source = {"connector": connector, "url": source_url}
    return {
        "schema": SCHEMA,
        "source": source,
        "subject": subject,
        "measurement_kind": "model-comparison",
        "artifact": artifact,
        "observed_at": observed_at,
        "license": "UNCHECKABLE",
        "provenance": {"producer": PRODUCER, "producer_revision": revision},
        "lifecycle_state": state,
        "measurement": None,
        "error": error,
        "idempotency_key": idempotency_key(source, subject, "model-comparison", artifact["sha256"]),
        "writes_board": False,
    }


class InputRefused(ValueError):
    """The input as a whole cannot be read honestly; no envelopes are emitted for it."""


def envelopes_from_lock(raw: bytes, rel: str = LOCK_REL, revision: str | None = None) -> list[dict[str, Any]]:
    revision = revision or producer_revision()
    try:
        lock = json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, ValueError) as e:
        raise InputRefused(f"{rel}: not JSON ({e})") from e
    if not isinstance(lock, dict) or lock.get("kind") != "csoai.fleet-lock/0.1" or lock.get("fleet") != "KAGGLE":
        raise InputRefused(f"{rel}: not a csoai.fleet-lock/0.1 KAGGLE lock")
    observed_at = _utc(lock.get("queue_as_of")) or _utc(lock.get("as_of"))
    if observed_at is None:
        raise InputRefused(f"{rel}: no UTC as_of; observed_at is never invented")
    models = lock.get("models")
    if not isinstance(models, list) or not models:
        raise InputRefused(f"{rel}: no models (empty is not an index)")

    out: list[dict[str, Any]] = []
    for i, row in enumerate(models):
        pointer = f"/models/{i}"
        ref = (row.get("ref") or row.get("slug")) if isinstance(row, dict) else None
        status = str(row.get("status") or "UNMEASURED").upper() if isinstance(row, dict) else ""
        error = None
        state = "INDEXED"
        if not isinstance(ref, str) or not ref:
            subject = {"kind": "model", "id": f"kaggle:{rel}#{pointer}", "revision": None}
            state = "UNCHECKABLE"
            error = {"code": "ROW_WITHOUT_REF", "detail": "lock row has no ref/slug; the subject cannot be named"}
        else:
            subject = {
                "kind": "model",
                "id": f"kaggle:{ref}",
                "revision": None,
                "url": row.get("url") if str(row.get("url") or "").startswith("https://")
                else f"https://www.kaggle.com/models/{ref}",
            }
            if status != "UNMEASURED":
                state = "UNCHECKABLE"
                error = {
                    "code": "LOCK_ROW_CLAIMS_MEASUREMENT",
                    "detail": f"lock row status {status!r}; a fleet lock is a queue and carries no measurement artifact",
                }
        out.append(_envelope(
            connector=LOCK_CONNECTOR, source_url=LOCK_SOURCE_URL, subject=subject,
            artifact=_artifact(raw, rel, pointer), observed_at=observed_at,
            state=state, error=error, revision=revision,
        ))
    return out


def _reject_reason():
    spec = importlib.util.spec_from_file_location("land_mill_cards", ROOT / "scripts" / "land_mill_cards.py")
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.reject_reason


def envelopes_from_harvest(harvest_dir: Path, rel_prefix: str, revision: str | None = None) -> list[dict[str, Any]]:
    """A `kaggle kernels output` directory -> one envelope per card the report lists."""
    revision = revision or producer_revision()
    report_path = harvest_dir / HARVEST_REPORT
    try:
        report = json.loads(report_path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as e:
        raise InputRefused(f"{report_path}: unreadable report ({e})") from e
    if not isinstance(report, dict) or report.get("kind") != "csoai.kaggle-community-cells/0.1":
        raise InputRefused(f"{report_path}: not a csoai.kaggle-community-cells/0.1 report")
    observed_at = _utc(report.get("generated_at"))
    if observed_at is None:
        raise InputRefused(f"{report_path}: generated_at is not UTC; observed_at is never invented")
    names = report.get("cards")
    if not isinstance(names, list):
        raise InputRefused(f"{report_path}: cards is not a list")

    reject_reason = _reject_reason()
    out: list[dict[str, Any]] = []
    for name in sorted(str(n) for n in names):
        rel = f"{rel_prefix.rstrip('/')}/{name}"
        path = harvest_dir / name
        if "/" in name or not name.startswith("unsigned-") or not name.endswith(".json"):
            subject = {"kind": "model", "id": f"kaggle-community:{name}", "revision": None}
            out.append(_envelope(
                connector=HARVEST_CONNECTOR, source_url=HARVEST_SOURCE_URL, subject=subject,
                artifact=_artifact(None, rel), observed_at=observed_at, state="UNCHECKABLE",
                error={"code": "CARD_NAME_REFUSED", "detail": "report lists a name that is not an unsigned-*.json file"},
                revision=revision,
            ))
            continue
        try:
            raw = path.read_bytes()
        except OSError:
            raw = None
        wrap: Any = None
        if raw is not None:
            try:
                wrap = json.loads(raw.decode("utf-8"))
            except (UnicodeDecodeError, ValueError):
                wrap = None
        body = wrap.get("body") if isinstance(wrap, dict) else None
        model = body.get("model") if isinstance(body, dict) else None
        subject = {
            "kind": "model",
            "id": f"kaggle-community:{model}" if isinstance(model, str) and model else f"kaggle-community:{name}",
            "revision": None,
        }
        if raw is None:
            state, error = "UNCHECKABLE", {"code": "CARD_MISSING", "detail": "report lists a card the harvest does not contain"}
        elif not isinstance(wrap, dict):
            state, error = "QUARANTINED", {"code": "CARD_NOT_JSON", "detail": "card bytes are not a JSON object"}
        elif (reason := reject_reason(wrap)) is not None:
            state, error = "QUARANTINED", {"code": "CARD_REJECTED", "detail": reason}
        elif body.get("route") != KAGGLE_ROUTE:
            state, error = "QUARANTINED", {"code": "NOT_KAGGLE_ROUTE", "detail": f"route {body.get('route')!r} is not {KAGGLE_ROUTE!r}"}
        else:
            state, error = "QUARANTINED", None
        if isinstance(body, dict) and isinstance(body.get("axis"), str) and error is None:
            subject["id"] += f"#{body['axis']}"
        out.append(_envelope(
            connector=HARVEST_CONNECTOR, source_url=HARVEST_SOURCE_URL, subject=subject,
            artifact=_artifact(raw, rel), observed_at=observed_at, state=state, error=error,
            revision=revision,
        ))
    return out


def to_jsonl(envelopes: list[dict[str, Any]]) -> bytes:
    return b"".join(canonical_bytes(e) + b"\n" for e in envelopes)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--lock", default=None, help=f"fleet lock path (default {LOCK_REL} unless --harvest is given)")
    ap.add_argument("--harvest", default=None, help="kaggle kernels output directory")
    ap.add_argument("--out", default=None, help="write JSONL here instead of stdout")
    args = ap.parse_args(argv)

    envelopes: list[dict[str, Any]] = []
    try:
        if args.lock or not args.harvest:
            lock_path = Path(args.lock) if args.lock else ROOT / LOCK_REL
            try:
                rel = lock_path.resolve().relative_to(ROOT).as_posix()
            except ValueError:
                rel = lock_path.name
            envelopes += envelopes_from_lock(lock_path.read_bytes(), rel)
        if args.harvest:
            hdir = Path(args.harvest)
            envelopes += envelopes_from_harvest(hdir, f"kaggle-harvest/{hdir.name}")
    except (OSError, InputRefused) as e:
        print(f"REFUSED: {e}", file=sys.stderr)
        return 2

    bad = [(i, p) for i, e in enumerate(envelopes) for p in validate(e)]
    for i, p in bad:
        print(f"INVALID [{i}]: {p}", file=sys.stderr)
    if bad:
        return 1
    data = to_jsonl(envelopes)
    if args.out:
        Path(args.out).write_bytes(data)
    else:
        sys.stdout.buffer.write(data)
    counts: dict[str, int] = {}
    for e in envelopes:
        counts[e["lifecycle_state"]] = counts.get(e["lifecycle_state"], 0) + 1
    print(f"{len(envelopes)} envelopes {json.dumps(counts, sort_keys=True)} sha256={hashlib.sha256(data).hexdigest()}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
