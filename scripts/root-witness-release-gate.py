#!/usr/bin/env python3
"""Fail-closed release gate for the one public root and every public OTS proof.

This gate is deliberately non-mutating. Historical roots and proof files are
evidence, even when they expose an incident; they are reported, never deleted or
rewritten here. A production release is blocked until invalid public artifacts
are moved to an explicit non-served quarantine and a fresh exact-byte witness
set is produced by the authorised workflow.

Checks:
  * root schema identity, required fields, leaf count and Merkle root;
  * Ed25519 signature under the pinned local did:web key;
  * sidecar and pointer bind the exact root bytes, count, Merkle and as_of;
  * a completed Rekor rail has a local snapshot whose logIndex, signature and
    preimage digest match the signed envelope;
  * every public .ots is a parseable OpenTimestamps proof and its digest matches
    locally available target bytes named by an adjacent file or witness sidecar;
  * archive OTS references resolve to files that passed the checks above.

No network. No private key. Measurement, not certification.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import re
import sys
from pathlib import Path
from typing import Any

REPO = Path(__file__).resolve().parents[1]
PUBLIC = REPO / "public"
INTEROP = PUBLIC / "interop"
ROOT_PATH = PUBLIC / "root.json"
SIDECAR_PATH = INTEROP / "root-witness-latest.json"
POINTER_PATH = INTEROP / "root-witness-pointer.json"
DID_PATH = PUBLIC / ".well-known" / "did.json"
BOARD_DID = "did:web:csoai.org#board-attestation-1"
PREIMAGE_FIELDS = ("kind", "schema", "as_of", "merkle_root", "card_count", "did_intended")
HEX64 = re.compile(r"^[0-9a-f]{64}$")
HEX128 = re.compile(r"^[0-9a-f]{128}$")


def load_json(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError("top-level JSON is not an object")
    return value


def canonical_bytes(value: Any) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def merkle_root(leaves: list[str]) -> str:
    level = [bytes.fromhex(value) for value in leaves]
    if not level:
        return sha256(b"")
    while len(level) > 1:
        nxt: list[bytes] = []
        for index in range(0, len(level), 2):
            left = level[index]
            right = level[index + 1] if index + 1 < len(level) else left
            nxt.append(hashlib.sha256(left + right).digest())
        level = nxt
    return level[0].hex()


def preimage(root: dict[str, Any]) -> bytes:
    return canonical_bytes({field: root[field] for field in PREIMAGE_FIELDS})


def add(errors: list[str], condition: bool, message: str) -> None:
    if not condition:
        errors.append(message)


def schema_path(root: dict[str, Any]) -> Path | None:
    schema = root.get("schema")
    if not isinstance(schema, str):
        return None
    name = schema.rsplit("/", 1)[-1]
    if not re.fullmatch(r"public-root-v\d+\.json", name):
        return None
    return PUBLIC / "schema" / name


def validate_root(errors: list[str]) -> tuple[dict[str, Any], bytes, str, bytes] | None:
    try:
        raw = ROOT_PATH.read_bytes()
        root = load_json(ROOT_PATH)
    except Exception as exc:
        errors.append(f"root unreadable: {type(exc).__name__}: {exc}")
        return None

    for field in PREIMAGE_FIELDS:
        add(errors, field in root, f"root missing signed preimage field: {field}")
    if any(field not in root for field in PREIMAGE_FIELDS):
        return None

    declared_schema_path = schema_path(root)
    add(errors, declared_schema_path is not None, f"root schema URL is not a supported local public-root schema: {root.get('schema')!r}")
    if declared_schema_path is not None:
        add(errors, declared_schema_path.is_file(), f"declared root schema is missing: {declared_schema_path.relative_to(REPO)}")
        if declared_schema_path.is_file():
            try:
                schema = load_json(declared_schema_path)
                required = schema.get("required") if isinstance(schema.get("required"), list) else []
                for field in required:
                    add(errors, field in root, f"root violates {declared_schema_path.name}: missing {field}")
                kind_const = ((schema.get("properties") or {}).get("kind") or {}).get("const")
                schema_const = ((schema.get("properties") or {}).get("schema") or {}).get("const")
                add(errors, root.get("kind") == kind_const, f"root kind {root.get('kind')!r} does not match declared schema const {kind_const!r}")
                add(errors, root.get("schema") == schema_const, f"root schema field does not match {declared_schema_path.name} const")
            except Exception as exc:
                errors.append(f"declared root schema unreadable: {type(exc).__name__}: {exc}")

    leaves = root.get("card_sha256")
    if not isinstance(leaves, list) or not all(isinstance(item, str) and HEX64.fullmatch(item) for item in leaves):
        errors.append("root card_sha256 is not a list of 64-hex leaf digests")
        leaves = []
    add(errors, isinstance(root.get("card_count"), int), "root card_count is not an integer")
    if isinstance(root.get("card_count"), int):
        add(errors, root["card_count"] == len(leaves), f"root card_count {root['card_count']} != {len(leaves)} card_sha256 entries")
    if isinstance(root.get("merkle_root"), str) and HEX64.fullmatch(root["merkle_root"]):
        add(errors, merkle_root(leaves) == root["merkle_root"], "root Merkle recomputation does not match merkle_root")
    else:
        errors.append("root merkle_root is not 64 lowercase hex")

    signed = preimage(root)
    signature_hex = root.get("sig_ed25519")
    add(errors, isinstance(signature_hex, str) and bool(HEX128.fullmatch(signature_hex)), "root sig_ed25519 is not a 64-byte hex signature")
    add(errors, root.get("did_intended") == BOARD_DID, f"root did_intended is not {BOARD_DID}")
    if isinstance(signature_hex, str) and HEX128.fullmatch(signature_hex) and root.get("did_intended") == BOARD_DID:
        try:
            did = load_json(DID_PATH)
            methods = did.get("verificationMethod") if isinstance(did.get("verificationMethod"), list) else []
            method = next(item for item in methods if isinstance(item, dict) and item.get("id") == BOARD_DID)
            key_x = method["publicKeyJwk"]["x"]
            public_key = base64.urlsafe_b64decode(key_x + "=" * (-len(key_x) % 4))
            from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

            Ed25519PublicKey.from_public_bytes(public_key).verify(bytes.fromhex(signature_hex), signed)
        except Exception as exc:
            errors.append(f"root Ed25519 signature does not verify under the pinned DID key: {type(exc).__name__}: {exc}")

    return root, raw, sha256(raw), signed


def exact_artifact_issues(artifact: Any, root: dict[str, Any], raw: bytes, root_sha: str, label: str) -> list[str]:
    if not isinstance(artifact, dict):
        return [f"{label} artifact is absent"]
    expected = {
        "sha256": root_sha,
        "bytes": len(raw),
        "merkle_root": root.get("merkle_root"),
        "card_count": root.get("card_count"),
        "as_of": root.get("as_of"),
    }
    return [f"{label} {field} does not bind current root ({artifact.get(field)!r} != {value!r})" for field, value in expected.items() if artifact.get(field) != value]


def local_entry_path(value: Any) -> Path | None:
    if not isinstance(value, str) or not value:
        return None
    if value.startswith("https://councilof.ai/"):
        return PUBLIC / value.removeprefix("https://councilof.ai/")
    candidate = REPO / value
    return candidate if candidate.is_relative_to(REPO) else None


def validate_current_witness(
    errors: list[str], root: dict[str, Any], raw: bytes, root_sha: str, signed: bytes
) -> dict[str, Any] | None:
    try:
        sidecar = load_json(SIDECAR_PATH)
    except Exception as exc:
        errors.append(f"current witness sidecar unreadable: {type(exc).__name__}: {exc}")
        return None
    sidecar_issues = exact_artifact_issues(sidecar.get("artifact"), root, raw, root_sha, "sidecar")
    errors.extend(sidecar_issues)

    # A stale sidecar is historical evidence for older bytes. Do not accuse its
    # old signature or transparency entry of being malformed by comparing them
    # to today's root; attribution stops at the exact-byte mismatch. Only inspect
    # the deeper rails after the artifact binding itself is exact.
    signature = sidecar.get("signature") if isinstance(sidecar.get("signature"), dict) else {}
    if not sidecar_issues:
        add(errors, signature.get("did") == BOARD_DID, "sidecar signature DID is not the pinned board DID")
        add(errors, signature.get("preimage_sha256") == sha256(signed), "sidecar preimage_sha256 does not match the signed six-field envelope")
        add(errors, signature.get("preimage_bytes") == len(signed), "sidecar preimage_bytes does not match the signed envelope")
        add(errors, signature.get("verified_against_did_json") is True, "sidecar does not record a successful DID signature verification")

    try:
        pointer = load_json(POINTER_PATH)
        pointer_issues = exact_artifact_issues(pointer.get("live_root"), root, raw, root_sha, "pointer live_root")
        errors.extend(pointer_issues)
        drift = pointer.get("drift") if isinstance(pointer.get("drift"), dict) else {}
        if pointer_issues:
            add(errors, drift.get("status") != "MATCH", "pointer incorrectly declares MATCH while its live_root fields are stale")
        else:
            add(errors, drift.get("status") == "MATCH", "pointer drift status is not MATCH for current root")
            add(errors, drift.get("match_sha256") is True, "pointer does not match current root sha256")
            add(errors, drift.get("match_merkle_root") is True, "pointer does not match current root Merkle root")
            add(errors, drift.get("live_root_sha256") == root_sha, "pointer drift live_root_sha256 is stale")
            add(errors, drift.get("live_root_merkle_root") == root.get("merkle_root"), "pointer drift live_root_merkle_root is stale")
    except Exception as exc:
        errors.append(f"current witness pointer unreadable: {type(exc).__name__}: {exc}")

    witnesses = sidecar.get("witnesses") if isinstance(sidecar.get("witnesses"), dict) else {}
    rekor = witnesses.get("rekor") if isinstance(witnesses.get("rekor"), dict) else {}
    if not sidecar_issues and str(rekor.get("status", "")).upper() in {"WITNESSED", "INCLUDED"}:
        entry_path = local_entry_path(rekor.get("entry_file"))
        add(errors, isinstance(rekor.get("logIndex"), int), "completed Rekor witness has no integer logIndex")
        add(errors, entry_path is not None and entry_path.is_file(), "completed Rekor witness has no committed local entry snapshot")
        if entry_path is not None and entry_path.is_file():
            try:
                snapshot = load_json(entry_path)
                uuid = rekor.get("uuid")
                entry = snapshot.get(uuid) if isinstance(uuid, str) else None
                if not isinstance(entry, dict) and len(snapshot) == 1:
                    entry = next(iter(snapshot.values()))
                add(errors, isinstance(entry, dict), "Rekor snapshot does not contain the sidecar UUID")
                if isinstance(entry, dict):
                    add(errors, entry.get("logIndex") == rekor.get("logIndex"), "Rekor snapshot logIndex differs from sidecar")
                    decoded = json.loads(base64.b64decode(entry["body"]).decode("utf-8"))
                    spec = decoded.get("spec") if isinstance(decoded.get("spec"), dict) else {}
                    recorded_hash = (((spec.get("data") or {}).get("hash") or {}).get("value"))
                    recorded_sig = ((spec.get("signature") or {}).get("content"))
                    add(errors, recorded_hash == sha256(signed), "Rekor snapshot does not bind the signed envelope preimage hash")
                    add(errors, isinstance(recorded_sig, str) and base64.b64decode(recorded_sig) == bytes.fromhex(root["sig_ed25519"]), "Rekor snapshot signature differs from root sig_ed25519")
            except Exception as exc:
                errors.append(f"Rekor snapshot cannot be verified: {type(exc).__name__}: {exc}")
    return sidecar


def witness_ots_targets() -> dict[str, str]:
    """Map proof paths to target digests declared by immutable witness sidecars."""
    targets: dict[str, str] = {}
    for path in sorted(INTEROP.glob("root-witness-*.json")):
        try:
            doc = load_json(path)
        except Exception:
            continue
        artifact = doc.get("artifact") if isinstance(doc.get("artifact"), dict) else {}
        digest = artifact.get("sha256")
        if not isinstance(digest, str) or not HEX64.fullmatch(digest):
            continue
        witnesses = doc.get("witnesses") if isinstance(doc.get("witnesses"), dict) else {}
        # The first witness schema called this rail `opentimestamps`; later
        # sidecars shortened it to `ots`. Historical bytes remain readable.
        ots_value = witnesses.get("ots", witnesses.get("opentimestamps"))
        ots = ots_value if isinstance(ots_value, dict) else {}
        proof_path = ots.get("path") or ots.get("proof_path")
        if isinstance(proof_path, str):
            targets[proof_path.replace("\\", "/")] = digest
    return targets


def validate_ots(errors: list[str]) -> set[str]:
    try:
        from opentimestamps.core.serialize import StreamDeserializationContext
        from opentimestamps.core.timestamp import DetachedTimestampFile
    except Exception as exc:
        errors.append(f"OpenTimestamps parser unavailable: {type(exc).__name__}: {exc}; install opentimestamps-client")
        return set()

    declared_targets = witness_ots_targets()
    valid: set[str] = set()
    for proof in sorted(PUBLIC.rglob("*.ots")):
        relative = proof.relative_to(REPO).as_posix()
        try:
            with proof.open("rb") as handle:
                detached = DetachedTimestampFile.deserialize(StreamDeserializationContext(handle))
            digest = bytes(detached.timestamp.msg).hex()
        except Exception as exc:
            errors.append(f"invalid public .ots (not an OpenTimestamps proof): {relative}: {type(exc).__name__}")
            continue

        adjacent = Path(str(proof)[: -len(".ots")])
        target_digest: str | None = None
        target_label: str | None = None
        if adjacent.is_file():
            target_digest = sha256(adjacent.read_bytes())
            target_label = adjacent.relative_to(REPO).as_posix()
        elif relative in declared_targets:
            target_digest = declared_targets[relative]
            target_label = "witness sidecar artifact.sha256"

        if target_digest is None:
            errors.append(f"public .ots has no locally recoverable target bytes or exact sidecar binding: {relative}")
            continue
        if digest != target_digest:
            errors.append(f"public .ots digest mismatch: {relative} proves {digest}, target {target_label} hashes to {target_digest}")
            continue
        valid.add(relative)
    return valid


def iter_objects(value: Any):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from iter_objects(child)
    elif isinstance(value, list):
        for child in value:
            yield from iter_objects(child)


def validate_archive_references(errors: list[str], valid_ots: set[str]) -> None:
    archive = PUBLIC / "archive"
    if not archive.is_dir():
        errors.append("public/archive is missing")
        return
    broken_references: dict[str, set[str]] = {}
    for path in sorted(archive.rglob("*")):
        if path.suffix not in {".json", ".jsonl"}:
            continue
        try:
            values = [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()] if path.suffix == ".jsonl" else [load_json(path)]
        except Exception as exc:
            errors.append(f"archive document unreadable: {path.relative_to(REPO)}: {type(exc).__name__}")
            continue
        for value in values:
            for obj in iter_objects(value):
                reference = obj.get("ots_path")
                if not isinstance(reference, str) or not reference:
                    continue
                normalized = reference.removeprefix("https://councilof.ai/")
                if normalized.startswith("interop/"):
                    normalized = "public/" + normalized
                if normalized not in valid_ots:
                    broken_references.setdefault(reference, set()).add(path.relative_to(REPO).as_posix())
    for reference, documents in sorted(broken_references.items()):
        sample = ", ".join(sorted(documents)[:3])
        suffix = "" if len(documents) <= 3 else f", … ({len(documents)} documents total)"
        errors.append(f"archive references missing or invalid OTS proof {reference}: {sample}{suffix}")


def run_selftest() -> int:
    assert sha256(canonical_bytes({"b": 2, "a": 1})) == "43258cff783fe7036d8a43033f830adfc60ec037382473548ac742b888292777"
    leaf = "00" * 32
    assert merkle_root([leaf]) == leaf
    pair = hashlib.sha256(bytes.fromhex(leaf) + bytes.fromhex(leaf)).hexdigest()
    assert merkle_root([leaf, leaf]) == pair
    fake = {field: field for field in PREIMAGE_FIELDS}
    assert list(json.loads(preimage(fake)).keys()) == sorted(PREIMAGE_FIELDS)
    mismatches = exact_artifact_issues(
        {"sha256": "old", "bytes": 1, "merkle_root": "m", "card_count": 1, "as_of": "t"},
        {"merkle_root": "m", "card_count": 1, "as_of": "t"},
        b"new",
        sha256(b"new"),
        "fixture",
    )
    assert len(mismatches) == 2
    print("root-witness-release-gate selftest: PASS")
    return 0


def run_gate() -> int:
    errors: list[str] = []
    validated = validate_root(errors)
    if validated is not None:
        root, raw, root_sha, signed = validated
        validate_current_witness(errors, root, raw, root_sha, signed)
    valid_ots = validate_ots(errors)
    validate_archive_references(errors, valid_ots)

    # Stable output: the gate is also an audit artifact in CI logs.
    unique = list(dict.fromkeys(errors))
    if unique:
        print(f"root-witness-release-gate: BLOCKED ({len(unique)} issue{'s' if len(unique) != 1 else ''})", file=sys.stderr)
        for issue in unique:
            print(f"- {issue}", file=sys.stderr)
        print(
            "Resolution: preserve historical incident files, remove them from the served release tree, then publish and independently verify one fresh schema-valid signed root plus its exact-byte sidecar, Rekor snapshot and OTS proof.",
            file=sys.stderr,
        )
        return 1
    print("root-witness-release-gate: PASS")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--selftest", action="store_true")
    args = parser.parse_args()
    return run_selftest() if args.selftest else run_gate()


if __name__ == "__main__":
    sys.exit(main())
