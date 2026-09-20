#!/usr/bin/env python3
"""Universal CSOAI measurement-cohort builder.

Any adapter may emit rows. This module does not decide what the rows mean; it
binds the exact bytes, population/disposition counts, and row-level observations
into one deterministic manifest plus a compact signable body.

The compact body is intentionally <3KB so the Pages board signer can sign one
cohort containing thousands of rows. Every row remains independently
recomputable from the manifest's ordered leaf list.
"""
from __future__ import annotations
import hashlib, json
from pathlib import Path
from typing import Any

SCHEMA = "csoai.measurement-cohort/1"
CARD_SCHEMA = "https://councilof.ai/schema/card-v0.json"
DID = "did:web:csoai.org#board-attestation-1"

def canonical_bytes(obj: Any) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")

def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())

def merkle_root(leaves: list[str]) -> str:
    """Estate tree rule: raw 32-byte leaf digests; duplicate odd tail."""
    if not leaves:
        return sha256_bytes(b"")
    level = [bytes.fromhex(x) for x in leaves]
    while len(level) > 1:
        nxt: list[bytes] = []
        for i in range(0, len(level), 2):
            left = level[i]
            right = level[i + 1] if i + 1 < len(level) else left
            nxt.append(hashlib.sha256(left + right).digest())
        level = nxt
    return level[0].hex()

def _rows_from_json(path: Path, pointer: str | None) -> list[Any]:
    obj = json.loads(path.read_text(encoding="utf-8"))
    cur: Any = obj
    if pointer:
        for part in pointer.split("."):
            if not isinstance(cur, dict) or part not in cur:
                raise ValueError(f"{path}: pointer {pointer!r} not found at {part!r}")
            cur = cur[part]
    if not isinstance(cur, list):
        raise ValueError(f"{path}: selected row population is not a list")
    return cur

def build(spec: dict[str, Any], root: Path) -> tuple[dict[str, Any], dict[str, Any]]:
    required = ("cohort_id", "subject_kind", "as_of", "status", "evidence")
    missing = [k for k in required if not spec.get(k)]
    if missing:
        raise ValueError(f"missing required fields: {missing}")
    if not isinstance(spec["evidence"], list) or not spec["evidence"]:
        raise ValueError("evidence must be a non-empty list")
    unmeasured = spec.get("unmeasured", [])
    if not isinstance(unmeasured, list):
        raise ValueError("unmeasured must be a list")

    evidence: list[dict[str, Any]] = []
    atomic: list[dict[str, Any]] = []
    child_cohorts: list[dict[str, Any]] = []
    for entry in spec["evidence"]:
        if not isinstance(entry, dict) or not entry.get("path"):
            raise ValueError("each evidence entry requires path")
        rel = str(entry["path"])
        p = (root / rel).resolve()
        try:
            p.relative_to(root.resolve())
        except ValueError as e:
            raise ValueError(f"evidence path escapes repository: {rel}") from e
        if not p.is_file():
            raise ValueError(f"evidence file missing: {rel}")
        raw = p.read_bytes()
        file_rec: dict[str, Any] = {
            "path": rel,
            "sha256": sha256_bytes(raw),
            "bytes": len(raw),
        }
        if entry.get("role"):
            file_rec["role"] = str(entry["role"])
        if entry.get("cohort_manifest") or entry.get("role") == "cohort_manifest":
            child = json.loads(raw.decode("utf-8"))
            claimed = child.get("manifest_sha256") if isinstance(child, dict) else None
            if not isinstance(claimed, str) or len(claimed) != 64:
                raise ValueError(f"{rel}: cohort manifest missing manifest_sha256")
            core = dict(child); core.pop("manifest_sha256", None)
            recomputed = sha256_bytes(canonical_bytes(core))
            if recomputed != claimed:
                raise ValueError(f"{rel}: cohort manifest digest mismatch")
            child_cohorts.append({
                "path": rel,
                "cohort_id": child.get("cohort_id"),
                "manifest_sha256": claimed,
                "atomic_count": child.get("atomic_count"),
                "atomic_merkle_root": child.get("atomic_merkle_root"),
            })
        rows_pointer = entry.get("rows_pointer")
        if rows_pointer is not None:
            file_rec["rows_pointer"] = str(rows_pointer) if rows_pointer else ""
            rows = _rows_from_json(p, str(rows_pointer) if rows_pointer else None)
            file_rec["rows"] = len(rows)
            for i, row in enumerate(rows):
                digest = sha256_bytes(canonical_bytes(row))
                row_id = None
                if isinstance(row, dict):
                    for key in ("subject_id", "id", "symbol", "address", "contract", "name"):
                        if row.get(key) is not None:
                            row_id = str(row[key]); break
                atomic.append({
                    "evidence_path": rel,
                    "rows_pointer": file_rec.get("rows_pointer", ""),
                    "row_index": i,
                    "row_id": row_id,
                    "sha256": digest,
                })
        evidence.append(file_rec)

    leaf_digests = [x["sha256"] for x in atomic]
    child_digests = [x["manifest_sha256"] for x in child_cohorts]
    manifest_core: dict[str, Any] = {
        "schema": SCHEMA,
        "cohort_id": str(spec["cohort_id"]),
        "subject_kind": str(spec["subject_kind"]),
        "as_of": str(spec["as_of"]),
        "status": str(spec["status"]),
        "method": spec.get("method"),
        "population": spec.get("population", {}),
        "dispositions": spec.get("dispositions", {}),
        "unmeasured": sorted({str(x) for x in unmeasured}),
        "evidence": evidence,
        "atomic_observations": atomic,
        "atomic_count": len(atomic),
        "atomic_merkle_root": merkle_root(leaf_digests),
        "child_cohorts": child_cohorts,
        "child_cohort_count": len(child_cohorts),
        "child_cohort_merkle_root": merkle_root(child_digests),
        "merkle_rule": "sha256(raw_32_byte_left || raw_32_byte_right); duplicate odd tail",
        "measurement_not_certification": True,
    }
    manifest_sha = sha256_bytes(canonical_bytes(manifest_core))
    manifest = {**manifest_core, "manifest_sha256": manifest_sha}

    compact: dict[str, Any] = {
        "schema": CARD_SCHEMA,
        "model": str(spec["cohort_id"]),
        "axis": str(spec.get("axis") or spec["subject_kind"]),
        "as_of": str(spec["as_of"]),
        "status": str(spec["status"]),
        "n": int(spec.get("n", len(atomic))),
        "measurement": {
            "atomic_count": len(atomic),
            "atomic_merkle_root": manifest_core["atomic_merkle_root"],
            "manifest_sha256": manifest_sha,
            "child_cohort_count": len(child_cohorts),
            "child_cohort_merkle_root": manifest_core["child_cohort_merkle_root"],
        },
        "population": spec.get("population", {}),
        "dispositions": spec.get("dispositions", {}),
        "unmeasured": sorted({str(x) for x in unmeasured}),
        "signature_state": "STAGED_UNSIGNED",
        "measurement_not_certification": True,
        "writes_gspc_board": bool(spec.get("writes_gspc_board", False)),
    }
    if len(canonical_bytes(compact)) > 3072:
        raise ValueError("compact signing body exceeds 3072-byte signer cap")
    return manifest, compact
