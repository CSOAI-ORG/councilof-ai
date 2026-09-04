#!/usr/bin/env python3
"""Fail-closed candidate/live gate for the one public root and every public OTS proof.

This gate is deliberately non-mutating. Historical roots and proof files are
evidence, even when they expose an incident; they are reported, never deleted or
rewritten here. A production release is blocked until invalid public artifacts
are moved to an explicit non-served quarantine and a fresh exact-byte witness
set is produced by the authorised workflow.

Both phases check:
  * root schema identity, required fields, leaf count and Merkle root;
  * Ed25519 signature under the pinned local did:web key;
  * sidecar and pointer bind the exact candidate bytes, count, Merkle and as_of;
  * the current root has a completed Rekor rail with a local snapshot whose logIndex, signature and
    preimage digest match the signed envelope;
  * the current root has a parseable exact-byte OTS stamp (a pending calendar
    stamp is accepted as stamped, never described as Bitcoin-anchored);
  * every public .ots is a parseable OpenTimestamps proof and its digest matches
    locally available target bytes named by an adjacent file or witness sidecar;
  * archive OTS references resolve to files that passed the checks above;
  * pointer drift is an internally consistent, timestamped MATCH, DRIFTED or
    UNCHECKABLE observation. Candidate publication does not require the old live
    root to match the new candidate, but an UNCHECKABLE observation is recordable,
    not promotable.

The release check additionally reauthenticates a confirmed Bitcoin header against
two independent live sources; a pending proof needs no such query. The live phase
also fetches the apex root and requires an exact MATCH. Neither phase uses a
private key. Measurement, not certification.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import re
import struct
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

REPO = Path(__file__).resolve().parents[1]
DEFAULT_PUBLIC = REPO / "public"
PUBLIC = DEFAULT_PUBLIC
INTEROP = PUBLIC / "interop"
ROOT_PATH = PUBLIC / "root.json"
SIDECAR_PATH = INTEROP / "root-witness-latest.json"
POINTER_PATH = INTEROP / "root-witness-pointer.json"
DID_PATH = PUBLIC / ".well-known" / "did.json"
BOARD_DID = "did:web:csoai.org#board-attestation-1"
LIVE_ROOT_URL = "https://councilof.ai/root.json"
# Rekor's current P-256 log key, fetched from the official public-key endpoint
# and pinned by its DER sha256/logID below. A local snapshot is not authenticated
# merely because it contains a signedEntryTimestamp-shaped string.
REKOR_PUBLIC_KEY_PEM = b"""-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE2G2Y+2tabdTV5BcGiBIx0a9fAFwr
kBbmLSGtks4L3qX6yYY0zufBnhC8Ur/iy55GhWP/9A/bY2LhC30M9+RYtw==
-----END PUBLIC KEY-----
"""
REKOR_LOG_ID = "c0d23d6ad406973f9559f3ba2d1ca01f84147d8ffc5b8445c224f98b9591801d"
PREIMAGE_FIELDS = ("kind", "schema", "as_of", "merkle_root", "card_count", "did_intended")
HEX64 = re.compile(r"^[0-9a-f]{64}$")
HEX128 = re.compile(r"^[0-9a-f]{128}$")
UTC_RFC3339 = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$")


def configure_public_dir(path: Path) -> None:
    """Point all release checks at source public/ or the built dist/client tree."""
    global PUBLIC, INTEROP, ROOT_PATH, SIDECAR_PATH, POINTER_PATH, DID_PATH
    PUBLIC = path.resolve()
    INTEROP = PUBLIC / "interop"
    ROOT_PATH = PUBLIC / "root.json"
    SIDECAR_PATH = INTEROP / "root-witness-latest.json"
    POINTER_PATH = INTEROP / "root-witness-pointer.json"
    DID_PATH = PUBLIC / ".well-known" / "did.json"


def path_label(path: Path) -> str:
    try:
        return path.relative_to(REPO).as_posix()
    except ValueError:
        return str(path)


def canonical_public_path(path: Path) -> str:
    return "public/" + path.relative_to(PUBLIC).as_posix()


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


def json_schema_value_issues(value: Any, spec: dict[str, Any], label: str) -> list[str]:
    """Validate the security-relevant JSON Schema subset used by public-root."""
    issues: list[str] = []
    expected_types = spec.get("type")
    if isinstance(expected_types, str):
        expected_types = [expected_types]
    if isinstance(expected_types, list):
        matches = {
            "string": isinstance(value, str),
            "integer": type(value) is int,
            "array": isinstance(value, list),
            "null": value is None,
            "object": isinstance(value, dict),
            "boolean": type(value) is bool,
        }
        if not any(matches.get(kind, False) for kind in expected_types):
            issues.append(f"{label} has wrong JSON type; expected {expected_types!r}")
            return issues
    if "const" in spec and value != spec["const"]:
        issues.append(f"{label} does not match schema const")
    if isinstance(value, str) and isinstance(spec.get("pattern"), str):
        if re.fullmatch(spec["pattern"], value) is None:
            issues.append(f"{label} does not match schema pattern")
    if type(value) is int and isinstance(spec.get("minimum"), int) and value < spec["minimum"]:
        issues.append(f"{label} is below schema minimum")
    if isinstance(value, list) and isinstance(spec.get("items"), dict):
        for index, item in enumerate(value):
            issues.extend(json_schema_value_issues(item, spec["items"], f"{label}[{index}]"))
    return issues


def canonical_card_digest(card: dict[str, Any]) -> str:
    body = {key: value for key, value in card.items() if key not in {"sha256", "sig_ed25519"}}
    return sha256(canonical_bytes(body))


def fold_inclusion_proof(leaf: str, index: int, siblings: list[str]) -> str:
    current = bytes.fromhex(leaf)
    position = index
    for sibling_hex in siblings:
        sibling = bytes.fromhex(sibling_hex)
        current = hashlib.sha256(current + sibling if position % 2 == 0 else sibling + current).digest()
        position //= 2
    return current.hex()


def validate_root_card_wrappers(errors: list[str], leaves: list[str], expected_root: str) -> None:
    """Bind every root leaf to the collision-safe public/cards wrapper bytes."""
    cards_dir = PUBLIC / "cards"
    for expected_index, leaf in enumerate(leaves):
        wrapper_path = cards_dir / f"{leaf[:16]}.json"
        proof_path = PUBLIC / "proofs" / f"{leaf[:16]}.json"
        if not wrapper_path.is_file():
            errors.append(f"public-root leaf has no public card wrapper: {leaf}")
            continue
        try:
            wrapper = load_json(wrapper_path)
            card = wrapper.get("card")
            if not isinstance(card, dict):
                errors.append(f"public card wrapper has no card object: {path_label(wrapper_path)}")
                continue
            add(errors, card.get("sha256") == leaf, f"public card wrapper declares the wrong leaf digest: {path_label(wrapper_path)}")
            add(errors, canonical_card_digest(card) == leaf, f"public card canonical digest does not match root leaf: {path_label(wrapper_path)}")
            proof = load_json(proof_path)
            siblings = proof.get("proof")
            wrapper_siblings = wrapper.get("proof")
            proof_valid = isinstance(siblings, list) and all(
                isinstance(value, str) and HEX64.fullmatch(value) for value in siblings
            )
            add(errors, proof.get("sha256") == leaf, f"public inclusion proof names the wrong leaf: {path_label(proof_path)}")
            add(errors, type(proof.get("index")) is int and proof.get("index") == expected_index, f"public inclusion proof has the wrong index: {path_label(proof_path)}")
            add(errors, proof.get("merkle_root") == expected_root, f"public inclusion proof names the wrong root: {path_label(proof_path)}")
            add(errors, proof_valid, f"public inclusion proof has malformed siblings: {path_label(proof_path)}")
            add(errors, wrapper_siblings == siblings, f"card wrapper and public inclusion proof disagree: {path_label(wrapper_path)}")
            if proof_valid:
                add(errors, fold_inclusion_proof(leaf, expected_index, siblings) == expected_root, f"public inclusion proof does not fold to the current root: {path_label(proof_path)}")
        except Exception as exc:
            errors.append(f"public card wrapper unreadable: {path_label(wrapper_path)}: {type(exc).__name__}: {exc}")


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
        add(errors, declared_schema_path.is_file(), f"declared root schema is missing: {path_label(declared_schema_path)}")
        if declared_schema_path.is_file():
            try:
                schema = load_json(declared_schema_path)
                required = schema.get("required") if isinstance(schema.get("required"), list) else []
                for field in required:
                    add(errors, field in root, f"root violates {declared_schema_path.name}: missing {field}")
                properties = schema.get("properties") if isinstance(schema.get("properties"), dict) else {}
                for field, value in root.items():
                    spec = properties.get(field)
                    if isinstance(spec, dict):
                        errors.extend(json_schema_value_issues(value, spec, f"root.{field}"))
            except Exception as exc:
                errors.append(f"declared root schema unreadable: {type(exc).__name__}: {exc}")

    leaves = root.get("card_sha256")
    if not isinstance(leaves, list) or not all(isinstance(item, str) and HEX64.fullmatch(item) for item in leaves):
        errors.append("root card_sha256 is not a list of 64-hex leaf digests")
        leaves = []
    add(errors, type(root.get("card_count")) is int, "root card_count is not an integer")
    if type(root.get("card_count")) is int:
        add(errors, root["card_count"] == len(leaves), f"root card_count {root['card_count']} != {len(leaves)} card_sha256 entries")
    add(errors, len(set(leaves)) == len(leaves), "root card_sha256 contains duplicate leaves")
    add(errors, valid_checked_at(root.get("as_of")), "root as_of is not a valid UTC RFC 3339 timestamp")
    if isinstance(root.get("merkle_root"), str) and HEX64.fullmatch(root["merkle_root"]):
        add(errors, merkle_root(leaves) == root["merkle_root"], "root Merkle recomputation does not match merkle_root")
    else:
        errors.append("root merkle_root is not 64 lowercase hex")
    if leaves and isinstance(root.get("merkle_root"), str) and HEX64.fullmatch(root["merkle_root"]):
        validate_root_card_wrappers(errors, leaves, root["merkle_root"])

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
        candidate = (PUBLIC / value.removeprefix("https://councilof.ai/")).resolve()
    elif value.startswith("public/"):
        candidate = (PUBLIC / value.removeprefix("public/")).resolve()
    else:
        candidate = (REPO / value).resolve()
    return candidate if candidate.is_relative_to(PUBLIC) else None


def valid_checked_at(value: Any) -> bool:
    """Require a real UTC RFC 3339 instant, with limited clock-skew tolerance."""
    if not isinstance(value, str) or not UTC_RFC3339.fullmatch(value):
        return False
    try:
        observed = datetime.strptime(value, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
    except ValueError:
        return False
    return observed <= datetime.now(timezone.utc) + timedelta(minutes=5)


def parse_utc(value: Any) -> datetime | None:
    if not isinstance(value, str) or not UTC_RFC3339.fullmatch(value):
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def validate_drift_record(
    errors: list[str],
    drift: Any,
    root: dict[str, Any],
    raw: bytes,
    root_sha: str,
    *,
    label: str,
    checked_against: str = LIVE_ROOT_URL,
    require_match: bool = False,
    require_observation: bool = False,
) -> None:
    """Validate a real three-state comparison without turning absence into MATCH."""
    if not isinstance(drift, dict):
        errors.append(f"{label} is absent")
        return

    status = drift.get("status")
    add(errors, status in {"MATCH", "DRIFTED", "UNCHECKABLE"}, f"{label} has invalid status {status!r}")
    add(errors, valid_checked_at(drift.get("checked_at")), f"{label} checked_at is not a valid UTC RFC 3339 timestamp")
    add(errors, drift.get("checked_against") == checked_against, f"{label} checked_against is not {checked_against}")
    add(errors, drift.get("witness_artifact_sha256") == root_sha, f"{label} witness sha256 does not bind the candidate root")
    add(
        errors,
        drift.get("witness_artifact_merkle_root") == root.get("merkle_root"),
        f"{label} witness Merkle root does not bind the candidate root",
    )
    add(errors, isinstance(drift.get("reason"), str) and bool(drift.get("reason")), f"{label} has no reason")

    if status == "UNCHECKABLE":
        for field in (
            "live_root_sha256",
            "live_root_merkle_root",
            "live_root_bytes",
            "match_sha256",
            "match_merkle_root",
        ):
            add(errors, field not in drift or drift.get(field) is None, f"{label} UNCHECKABLE record fabricates {field}")
        if require_observation:
            errors.append(f"{label} is UNCHECKABLE; release promotion requires a real live observation")
        if require_match:
            errors.append(f"{label} must be MATCH in live phase, got UNCHECKABLE")
        return

    live_sha = drift.get("live_root_sha256")
    live_merkle = drift.get("live_root_merkle_root")
    live_bytes = drift.get("live_root_bytes")
    match_sha = drift.get("match_sha256")
    match_merkle = drift.get("match_merkle_root")
    add(errors, isinstance(live_sha, str) and bool(HEX64.fullmatch(live_sha)), f"{label} has no valid live_root_sha256")
    add(
        errors,
        live_merkle is None or (isinstance(live_merkle, str) and bool(HEX64.fullmatch(live_merkle))),
        f"{label} has an invalid live_root_merkle_root",
    )
    add(errors, isinstance(live_bytes, int) and not isinstance(live_bytes, bool) and live_bytes >= 0, f"{label} has no valid live_root_bytes")
    add(errors, isinstance(match_sha, bool), f"{label} match_sha256 is not boolean")
    add(errors, isinstance(match_merkle, bool), f"{label} match_merkle_root is not boolean")
    if isinstance(live_sha, str) and HEX64.fullmatch(live_sha) and isinstance(match_sha, bool):
        add(errors, match_sha == (live_sha == root_sha), f"{label} match_sha256 contradicts the recorded digests")
    if (live_merkle is None or isinstance(live_merkle, str)) and isinstance(match_merkle, bool):
        add(errors, match_merkle == (live_merkle == root.get("merkle_root")), f"{label} match_merkle_root contradicts the recorded roots")

    exact_match = (
        live_sha == root_sha
        and live_merkle == root.get("merkle_root")
        and live_bytes == len(raw)
        and match_sha is True
        and match_merkle is True
    )
    if status == "MATCH":
        add(errors, exact_match, f"{label} declares MATCH without an exact byte and Merkle match")
    elif status == "DRIFTED":
        add(errors, not exact_match and (match_sha is False or match_merkle is False), f"{label} declares DRIFTED without a recorded mismatch")
    if require_match and status != "MATCH":
        errors.append(f"{label} must be MATCH in live phase, got {status}")


def validate_current_witness(
    errors: list[str], root: dict[str, Any], raw: bytes, root_sha: str, signed: bytes, *, require_observation: bool
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
        validate_drift_record(
            errors,
            drift,
            root,
            raw,
            root_sha,
            label="pointer drift",
            require_observation=require_observation,
        )
    except Exception as exc:
        errors.append(f"current witness pointer unreadable: {type(exc).__name__}: {exc}")

    witnesses = sidecar.get("witnesses") if isinstance(sidecar.get("witnesses"), dict) else {}
    rekor = witnesses.get("rekor") if isinstance(witnesses.get("rekor"), dict) else {}
    if not sidecar_issues:
        add(
            errors,
            str(rekor.get("status", "")).upper() in {"WITNESSED", "INCLUDED"},
            "current root has no completed Rekor witness",
        )
    if not sidecar_issues and str(rekor.get("status", "")).upper() in {"WITNESSED", "INCLUDED"}:
        entry_path = local_entry_path(rekor.get("entry_file"))
        add(errors, isinstance(rekor.get("logIndex"), int), "completed Rekor witness has no integer logIndex")
        add(errors, entry_path is not None and entry_path.is_file(), "completed Rekor witness has no committed local entry snapshot")
        if entry_path is not None and entry_path.is_file():
            try:
                snapshot = load_json(entry_path)
                uuid = rekor.get("uuid")
                entry = snapshot.get(uuid) if isinstance(uuid, str) else None
                # Single-entry fallback is only for a legacy sidecar that did
                # not name a UUID. A wrong named UUID must fail closed.
                if uuid is None and not isinstance(entry, dict) and len(snapshot) == 1:
                    entry = next(iter(snapshot.values()))
                add(errors, isinstance(entry, dict), "Rekor snapshot does not contain the sidecar UUID")
                if isinstance(entry, dict):
                    add(errors, entry.get("logIndex") == rekor.get("logIndex"), "Rekor snapshot logIndex differs from sidecar")
                    add(errors, entry.get("logID") == rekor.get("logID"), "Rekor snapshot logID differs from sidecar")
                    add(errors, entry.get("integratedTime") == rekor.get("integratedTime"), "Rekor snapshot integratedTime differs from sidecar")
                    decoded = json.loads(base64.b64decode(entry["body"]).decode("utf-8"))
                    spec = decoded.get("spec") if isinstance(decoded.get("spec"), dict) else {}
                    recorded_hash = (((spec.get("data") or {}).get("hash") or {}).get("value"))
                    recorded_sig = ((spec.get("signature") or {}).get("content"))
                    add(errors, recorded_hash == sha256(signed), "Rekor snapshot does not bind the signed envelope preimage hash")
                    add(errors, isinstance(recorded_sig, str) and base64.b64decode(recorded_sig) == bytes.fromhex(root["sig_ed25519"]), "Rekor snapshot signature differs from root sig_ed25519")
                    validate_rekor_set(errors, entry)
            except Exception as exc:
                errors.append(f"Rekor snapshot cannot be verified: {type(exc).__name__}: {exc}")
    return sidecar


def validate_rekor_set(errors: list[str], entry: dict[str, Any]) -> None:
    """Authenticate a Rekor snapshot with its SET and the pinned Rekor log key."""
    try:
        from cryptography.hazmat.primitives import hashes, serialization
        from cryptography.hazmat.primitives.asymmetric import ec

        verification = entry.get("verification") if isinstance(entry.get("verification"), dict) else {}
        encoded_set = verification.get("signedEntryTimestamp")
        add(errors, isinstance(encoded_set, str), "Rekor snapshot has no signedEntryTimestamp")
        if not isinstance(encoded_set, str):
            return
        key = serialization.load_pem_public_key(REKOR_PUBLIC_KEY_PEM)
        key_der = key.public_bytes(
            serialization.Encoding.DER,
            serialization.PublicFormat.SubjectPublicKeyInfo,
        )
        add(errors, sha256(key_der) == REKOR_LOG_ID, "pinned Rekor key does not derive the expected logID")
        add(errors, entry.get("logID") == REKOR_LOG_ID, "Rekor entry logID is not the pinned log")
        payload_fields = ("body", "integratedTime", "logID", "logIndex")
        add(errors, all(field in entry for field in payload_fields), "Rekor entry is missing SET payload fields")
        if not all(field in entry for field in payload_fields):
            return
        payload = canonical_bytes({field: entry[field] for field in payload_fields})
        key.verify(base64.b64decode(encoded_set, validate=True), payload, ec.ECDSA(hashes.SHA256()))
    except Exception as exc:
        errors.append(f"Rekor signedEntryTimestamp does not authenticate under the pinned log key: {type(exc).__name__}: {exc}")


def fetch_text(url: str, timeout_seconds: int = 15) -> str:
    import urllib.request

    request = urllib.request.Request(url, headers={"User-Agent": "csoai-root-release-gate/1.0"})
    with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
        return response.read(1024).decode("ascii").strip().lower()


def reauthenticate_bitcoin_header(
    errors: list[str],
    header: dict[str, Any],
    *,
    fetcher: Any = fetch_text,
) -> None:
    """Require two independent live APIs to return the exact recorded header."""
    block_hash = header.get("block_hash")
    header_hex = header.get("hex")
    height = header.get("height")
    if not isinstance(block_hash, str) or not HEX64.fullmatch(block_hash):
        errors.append("Bitcoin header has no valid block hash for live reauthentication")
        return
    if not isinstance(header_hex, str) or not re.fullmatch(r"[0-9a-f]{160}", header_hex):
        errors.append("Bitcoin header has no valid bytes for live reauthentication")
        return
    if type(height) is not int or height < 0:
        errors.append("Bitcoin header has no valid attested height for live reauthentication")
        return
    height_urls = (
        f"https://blockstream.info/api/block-height/{height}",
        f"https://mempool.space/api/block-height/{height}",
    )
    height_hashes: list[str] = []
    for url in height_urls:
        try:
            height_hashes.append(fetcher(url))
        except Exception as exc:
            errors.append(f"Bitcoin height source could not be queried ({url}): {type(exc).__name__}: {exc}")
    if len(height_hashes) != len(height_urls):
        return
    if not all(value == block_hash for value in height_hashes):
        errors.append("independent Bitcoin height sources do not map the attested height to the recorded block hash")
        return
    header_urls = (
        f"https://blockstream.info/api/block/{block_hash}/header",
        f"https://mempool.space/api/block/{block_hash}/header",
    )
    observed: list[str] = []
    for url in header_urls:
        try:
            observed.append(fetcher(url))
        except Exception as exc:
            errors.append(f"Bitcoin header source could not be queried ({url}): {type(exc).__name__}: {exc}")
    if len(observed) == len(header_urls):
        add(errors, all(value == header_hex for value in observed), "independent Bitcoin header sources did not both return the recorded header bytes")


def public_ots_reference(value: Any) -> str | None:
    """Normalize a same-site proof reference to its repo-relative public path."""
    if not isinstance(value, str) or not value:
        return None
    normalized = value.removeprefix("https://councilof.ai/")
    if normalized.startswith("interop/"):
        normalized = "public/" + normalized
    if not normalized.startswith("public/interop/") or not normalized.endswith(".ots"):
        return None
    return normalized


def ots_proof_facts(path: Path) -> tuple[str, list[tuple[bytes, Any]], int]:
    """Return the detached digest, Bitcoin attestations, and pending count.

    This is deliberately derived from proof bytes.  A sidecar status is never an
    input to this function, so stale prose cannot promote or demote the proof.
    """
    from opentimestamps.core.notary import BitcoinBlockHeaderAttestation, PendingAttestation
    from opentimestamps.core.serialize import StreamDeserializationContext
    from opentimestamps.core.timestamp import DetachedTimestampFile

    with path.open("rb") as handle:
        detached = DetachedTimestampFile.deserialize(StreamDeserializationContext(handle))
    bitcoin: list[tuple[bytes, Any]] = []
    pending = 0
    for message, attestation in detached.timestamp.all_attestations():
        if isinstance(attestation, BitcoinBlockHeaderAttestation):
            bitcoin.append((bytes(message), attestation))
        elif isinstance(attestation, PendingAttestation):
            pending += 1
    return bytes(detached.timestamp.msg).hex(), bitcoin, pending


def proof_derived_status(bitcoin_count: int, pending_count: int) -> str:
    if bitcoin_count:
        return "CONFIRMED_BITCOIN"
    if pending_count:
        return "STAMPED_PENDING_BITCOIN"
    return "NO_ATTESTATION"


def validate_corpus_scope(errors: list[str], sidecar: dict[str, Any], root: dict[str, Any], root_sha: str) -> None:
    """Keep the permissionless root and separately indexed signed cards distinct."""
    scope = sidecar.get("corpus_scope") if isinstance(sidecar.get("corpus_scope"), dict) else {}
    try:
        index = load_json(PUBLIC / "signed" / "card_index.json")
        cards = index.get("cards") if isinstance(index.get("cards"), list) else []
        card_ids = {
            row.get("card")
            for row in cards
            if isinstance(row, dict) and isinstance(row.get("card"), str) and HEX64.fullmatch(row["card"])
        }
    except Exception as exc:
        errors.append(f"signed-card index unreadable: {type(exc).__name__}: {exc}")
        return
    root_ids = set(root.get("card_sha256") or [])
    overlap = root_ids & card_ids
    expected = {
        "relationship": "SEPARATE_CORPORA",
        "public_root_count": len(root_ids),
        "public_root_sha256": root_sha,
        "signed_card_count": len(cards),
        "signed_card_id_overlap": len(overlap),
        "ots_covers": "PUBLIC_ROOT_BYTES_ONLY",
    }
    for field, value in expected.items():
        add(errors, scope.get(field) == value, f"corpus_scope {field} disagrees with artifacts ({scope.get(field)!r} != {value!r})")
    add(errors, not overlap, f"root/card corpus distinction changed: {len(overlap)} signed-card id(s) now overlap root leaves")


def validate_current_ots(
    errors: list[str],
    sidecar: dict[str, Any],
    valid_ots: set[str],
    root: dict[str, Any],
    root_sha: str,
    *,
    authenticate_external: bool = False,
) -> None:
    witnesses = sidecar.get("witnesses") if isinstance(sidecar.get("witnesses"), dict) else {}
    value = witnesses.get("ots", witnesses.get("opentimestamps"))
    ots = value if isinstance(value, dict) else {}
    status = str(ots.get("status", "")).upper()
    reference = public_ots_reference(ots.get("path") or ots.get("proof_path"))
    add(errors, reference is not None, "current root OTS witness has no public proof path")
    if reference is not None:
        add(errors, reference in valid_ots, f"current root OTS proof is missing, invalid, or digest-mismatched: {reference}")
        proof = PUBLIC / reference.removeprefix("public/")
        if proof.is_file():
            try:
                digest, bitcoin, pending = ots_proof_facts(proof)
                derived = proof_derived_status(len(bitcoin), pending)
                add(
                    errors,
                    derived in {"STAMPED_PENDING_BITCOIN", "CONFIRMED_BITCOIN"},
                    "current OTS proof carries neither a pending calendar attestation nor a Bitcoin confirmation",
                )
                add(errors, digest == root_sha, f"current OTS detached digest {digest} != root bytes {root_sha}")
                add(errors, status == derived, f"current OTS metadata status {status!r} != proof-derived {derived!r}")
                add(errors, ots.get("proof_sha256") == sha256(proof.read_bytes()), "current OTS metadata proof_sha256 disagrees with proof bytes")
                add(errors, ots.get("subject_sha256") == root_sha, "current OTS metadata subject_sha256 disagrees with root bytes")
                add(errors, ots.get("scope") == "PUBLIC_ROOT_BYTES_ONLY", "current OTS metadata does not limit its scope to the public-root bytes")

                derived_heights = sorted({attestation.height for _, attestation in bitcoin})
                add(errors, ots.get("bitcoin_blocks") == derived_heights, f"current OTS bitcoin_blocks disagrees with proof bytes ({ots.get('bitcoin_blocks')!r} != {derived_heights!r})")
                header = ots.get("bitcoin_header") if isinstance(ots.get("bitcoin_header"), dict) else {}
                proof_observed_at = ots.get("observed_at") or header.get("verified_at")
                add(errors, valid_checked_at(proof_observed_at), "current OTS proof observation time is not a valid UTC RFC 3339 timestamp")
                if bitcoin:
                    header_hex = header.get("hex")
                    add(errors, isinstance(header_hex, str) and bool(re.fullmatch(r"[0-9a-f]{160}", header_hex)), "confirmed OTS metadata has no 80-byte Bitcoin header")
                    if isinstance(header_hex, str) and re.fullmatch(r"[0-9a-f]{160}", header_hex):
                        header_bytes = bytes.fromhex(header_hex)
                        block_hash = hashlib.sha256(hashlib.sha256(header_bytes).digest()).digest()[::-1].hex()
                        block_time = struct.unpack("<I", header_bytes[68:72])[0]
                        block_time_text = datetime.fromtimestamp(block_time, timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
                        add(errors, header.get("height") in derived_heights, "Bitcoin header height is not attested by the OTS proof")
                        add(errors, header.get("block_hash") == block_hash, "Bitcoin header block_hash does not match its bytes")
                        add(errors, header.get("header_sha256") == sha256(header_bytes), "Bitcoin header sha256 does not match its bytes")
                        add(errors, header.get("block_time_unix") == block_time, "Bitcoin header time does not match its bytes")
                        add(errors, header.get("block_time") == block_time_text, "Bitcoin header UTC time does not match its bytes")
                        matches = [message == header_bytes[36:68] for message, attestation in bitcoin if attestation.height == header.get("height")]
                        add(errors, bool(matches) and all(matches), "Bitcoin header Merkle root does not satisfy the OTS attestation")
                        sources = header.get("sources") if isinstance(header.get("sources"), list) else []
                        expected_hash = header.get("block_hash")
                        add(errors, header.get("source_agreement") == "BLOCKSTREAM_MEMPOOL_BYTE_IDENTICAL", "Bitcoin confirmation does not record two-source byte agreement")
                        add(errors, sources == [
                            f"https://blockstream.info/api/block/{expected_hash}/header",
                            f"https://mempool.space/api/block/{expected_hash}/header",
                        ], "Bitcoin header source URLs do not name the recorded block on Blockstream and mempool.space")
                        if authenticate_external:
                            reauthenticate_bitcoin_header(errors, header)
                        block_at = parse_utc(block_time_text)
                        observed_at = parse_utc(header.get("verified_at"))
                        sidecar_at = parse_utc(sidecar.get("as_of"))
                        add(errors, observed_at is not None, "Bitcoin confirmation verified_at is not a UTC RFC 3339 timestamp")
                        add(errors, sidecar_at is not None, "confirmed witness sidecar as_of is not a UTC RFC 3339 timestamp")
                        if block_at and observed_at and sidecar_at:
                            add(errors, observed_at >= block_at, "Bitcoin confirmation was reportedly observed before the attested block time")
                            add(errors, sidecar_at >= observed_at, "witness sidecar as_of predates its confirmed OTS observation")
                else:
                    add(errors, not header, "pending OTS metadata must not carry a Bitcoin header")
            except Exception as exc:
                errors.append(f"current root OTS proof facts cannot be derived: {type(exc).__name__}: {exc}")

    validate_corpus_scope(errors, sidecar, root, root_sha)
    try:
        pointer = load_json(POINTER_PATH)
        pointer_witnesses = pointer.get("witnesses") if isinstance(pointer.get("witnesses"), dict) else {}
        header = ots.get("bitcoin_header") if isinstance(ots.get("bitcoin_header"), dict) else {}
        proof_observed_at = ots.get("observed_at") or header.get("verified_at")
        add(errors, pointer_witnesses.get("ots") == status, "pointer OTS status disagrees with proof-derived current status")
        add(errors, pointer.get("witness_status_observed_at") == proof_observed_at, "pointer OTS observation time disagrees with current witness metadata")
    except Exception as exc:
        errors.append(f"current witness pointer status cannot be checked: {type(exc).__name__}: {exc}")


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
        relative = canonical_public_path(proof)
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
            target_label = canonical_public_path(adjacent)
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
            errors.append(f"archive document unreadable: {path_label(path)}: {type(exc).__name__}")
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
                    broken_references.setdefault(reference, set()).add(path_label(path))
    for reference, documents in sorted(broken_references.items()):
        sample = ", ".join(sorted(documents)[:3])
        suffix = "" if len(documents) <= 3 else f", … ({len(documents)} documents total)"
        errors.append(f"archive references missing or invalid OTS proof {reference}: {sample}{suffix}")


def verification_guide_issues(text: str) -> list[str]:
    """Reject stale verification instructions that would overstate current proof state."""
    issues: list[str] = []
    forbidden = {
        "Anchor 4 of 4": "obsolete four-anchor claim",
        "anchored four ways": "obsolete four-anchor claim",
        "| 3 | RFC-3161 TSA |": "unsupported TSA rail",
        "root-728e8c5e": "obsolete 50-leaf root proof",
        "Public-root unsigned": "obsolete unsigned-root heading",
        "sig_ed25519 is null": "obsolete unsigned-root instruction",
    }
    for phrase, label in forbidden.items():
        if phrase.lower() in text.lower():
            issues.append(f"verification guide contains {label}: {phrase!r}")
    required = {
        "/interop/root-witness-latest.json": "current witness sidecar lookup",
        "STAMPED_PENDING_BITCOIN": "pending OTS distinction",
        "CONFIRMED_BITCOIN": "confirmed OTS distinction",
        "Signed public-root catalogue": "signed-root verification section",
        "separate corpora": "root/card corpus boundary",
    }
    for phrase, label in required.items():
        if phrase.lower() not in text.lower():
            issues.append(f"verification guide is missing {label}: {phrase!r}")
    return issues


def root_verification_guide_issues(text: str) -> list[str]:
    issues: list[str] = []
    for phrase in (
        "root-a44af078",
        "965487",
        "drift.status: MATCH",
        "current sidecar derives `CONFIRMED_BITCOIN`",
    ):
        if phrase.lower() in text.lower():
            issues.append(f"root verification guide hardcodes historical current-state material: {phrase!r}")
    for phrase in (
        "/interop/root-witness-latest.json",
        "STAMPED_PENDING_BITCOIN",
        "CONFIRMED_BITCOIN",
        "exact response bytes",
        "timestamped comparison",
        "separate corpora",
    ):
        if phrase.lower() not in text.lower():
            issues.append(f"root verification guide is missing dynamic verification boundary: {phrase!r}")
    return issues


def validate_public_verification_guide(errors: list[str]) -> None:
    guides = (
        (PUBLIC / "signed" / "HOW-TO-VERIFY.md", verification_guide_issues),
        (PUBLIC / "signed" / "HOW-TO-VERIFY-ROOT.md", root_verification_guide_issues),
    )
    for guide, validator in guides:
        try:
            errors.extend(validator(guide.read_text(encoding="utf-8")))
        except Exception as exc:
            errors.append(f"public verification guide unreadable ({guide.name}): {type(exc).__name__}: {exc}")


def run_selftest() -> int:
    assert sha256(canonical_bytes({"b": 2, "a": 1})) == "43258cff783fe7036d8a43033f830adfc60ec037382473548ac742b888292777"
    leaf = "00" * 32
    assert merkle_root([leaf]) == leaf
    pair = hashlib.sha256(bytes.fromhex(leaf) + bytes.fromhex(leaf)).hexdigest()
    assert merkle_root([leaf, leaf]) == pair
    assert fold_inclusion_proof(leaf, 0, [leaf]) == pair
    fake = {field: field for field in PREIMAGE_FIELDS}
    assert list(json.loads(preimage(fake)).keys()) == sorted(PREIMAGE_FIELDS)
    assert json_schema_value_issues(True, {"type": "integer"}, "fixture.count")
    assert json_schema_value_issues(1, {"type": "integer", "minimum": 0}, "fixture.count") == []
    fixture_card = {"subject": "fixture", "payload": {"value": 1}, "sha256": "ignored", "sig_ed25519": "ignored"}
    assert canonical_card_digest(fixture_card) == sha256(canonical_bytes({"subject": "fixture", "payload": {"value": 1}}))
    mismatches = exact_artifact_issues(
        {"sha256": "old", "bytes": 1, "merkle_root": "m", "card_count": 1, "as_of": "t"},
        {"merkle_root": "m", "card_count": 1, "as_of": "t"},
        b"new",
        sha256(b"new"),
        "fixture",
    )
    assert len(mismatches) == 2
    assert public_ots_reference("public/interop/root-deadbeef.json.ots") == "public/interop/root-deadbeef.json.ots"
    assert public_ots_reference("https://councilof.ai/interop/root-deadbeef.json.ots") == "public/interop/root-deadbeef.json.ots"
    assert public_ots_reference("https://example.invalid/root.ots") is None
    assert proof_derived_status(1, 4) == "CONFIRMED_BITCOIN"
    assert proof_derived_status(0, 4) == "STAMPED_PENDING_BITCOIN"
    assert proof_derived_status(0, 0) == "NO_ATTESTATION"
    current_root = load_json(DEFAULT_PUBLIC / "root.json")
    current_sidecar = load_json(DEFAULT_PUBLIC / "interop" / "root-witness-latest.json")
    current_witnesses = current_sidecar.get("witnesses") if isinstance(current_sidecar.get("witnesses"), dict) else {}
    current_ots_value = current_witnesses.get("ots", current_witnesses.get("opentimestamps"))
    current_ots = current_ots_value if isinstance(current_ots_value, dict) else {}
    current_ref = public_ots_reference(current_ots.get("path") or current_ots.get("proof_path"))
    current_proof = (
        DEFAULT_PUBLIC / current_ref.removeprefix("public/")
        if current_ref is not None
        else DEFAULT_PUBLIC / "interop" / "missing-current-proof.ots"
    )
    if current_ref is not None and current_proof.is_file():
        digest, bitcoin, pending = ots_proof_facts(current_proof)
        current_sha = sha256((DEFAULT_PUBLIC / "root.json").read_bytes())
        assert digest == current_sha
        assert proof_derived_status(len(bitcoin), pending) == str(current_ots.get("status", "")).upper()
        truth_errors: list[str] = []
        validate_current_ots(truth_errors, current_sidecar, {current_ref}, current_root, current_sha)
        assert truth_errors == [], truth_errors
        lying_sidecar = json.loads(json.dumps(current_sidecar))
        actual_status = proof_derived_status(len(bitcoin), pending)
        lying_sidecar["witnesses"]["ots"]["status"] = (
            "CONFIRMED_BITCOIN" if actual_status != "CONFIRMED_BITCOIN" else "STAMPED_PENDING_BITCOIN"
        )
        lie_errors: list[str] = []
        validate_current_ots(lie_errors, lying_sidecar, {current_ref}, current_root, current_sha)
        assert any("proof-derived" in issue for issue in lie_errors), lie_errors
        lying_sidecar = json.loads(json.dumps(current_sidecar))
        lying_sidecar["corpus_scope"]["signed_card_count"] += 1
        scope_errors: list[str] = []
        validate_current_ots(scope_errors, lying_sidecar, {current_ref}, current_root, current_sha)
        assert any("signed_card_count disagrees" in issue for issue in scope_errors), scope_errors

    current_rekor = (
        current_sidecar.get("witnesses", {}).get("rekor", {})
        if isinstance(current_sidecar.get("witnesses"), dict)
        else {}
    )
    current_rekor_path = local_entry_path(current_rekor.get("entry_file"))
    if current_rekor_path is not None and current_rekor_path.is_file():
        rekor_snapshot = load_json(current_rekor_path)
        rekor_entry = rekor_snapshot.get(current_rekor.get("uuid"))
        if not isinstance(rekor_entry, dict) and len(rekor_snapshot) == 1:
            rekor_entry = next(iter(rekor_snapshot.values()))
        assert isinstance(rekor_entry, dict)
        rekor_errors: list[str] = []
        validate_rekor_set(rekor_errors, rekor_entry)
        assert rekor_errors == [], rekor_errors
        rekor_lie = json.loads(json.dumps(rekor_entry))
        rekor_lie["logIndex"] += 1
        rekor_lie_errors: list[str] = []
        validate_rekor_set(rekor_lie_errors, rekor_lie)
        assert any("does not authenticate" in issue for issue in rekor_lie_errors), rekor_lie_errors

    # A newly submitted, parseable calendar proof is a normal release state.
    # It must pass as STAMPED_PENDING_BITCOIN without fabricating a Bitcoin
    # header.  This fixture exercises the writer and gate together: before this
    # regression, the writer timestamped the pending observation but the gate
    # compared it only with bitcoin_header.verified_at (necessarily absent), so
    # every honest next-root release was blocked until a Bitcoin confirmation.
    import tempfile
    from opentimestamps.core.notary import PendingAttestation, UnknownAttestation
    from opentimestamps.core.op import OpSHA256
    from opentimestamps.core.serialize import StreamSerializationContext
    from opentimestamps.core.timestamp import DetachedTimestampFile, Timestamp
    from witness_public_root import ots_status_from_proof

    with tempfile.TemporaryDirectory(dir=REPO) as directory:
        fixture_repo = Path(directory)
        fixture_public = fixture_repo / "public"
        fixture_interop = fixture_public / "interop"
        fixture_signed = fixture_public / "signed"
        fixture_interop.mkdir(parents=True)
        fixture_signed.mkdir(parents=True)
        pending_subject = fixture_public / "root.json"
        pending_raw = b"pending-root-fixture"
        pending_subject.write_bytes(pending_raw)
        pending_sha = sha256(pending_raw)
        pending_proof = fixture_interop / "root-pending.json.ots"
        pending_timestamp = Timestamp(bytes.fromhex(pending_sha))
        pending_timestamp.attestations.add(PendingAttestation("https://calendar.example.test"))
        with pending_proof.open("wb") as handle:
            DetachedTimestampFile(OpSHA256(), pending_timestamp).serialize(StreamSerializationContext(handle))

        pending_observed_at = "2026-09-04T12:00:00Z"
        pending_ots = ots_status_from_proof(
            pending_subject,
            pending_proof,
            root_dir=fixture_repo,
            public_dir=fixture_public,
            observed_at=pending_observed_at,
        )
        assert pending_ots["status"] == "STAMPED_PENDING_BITCOIN"
        assert pending_ots["bitcoin_blocks"] == []
        assert "bitcoin_header" not in pending_ots
        pending_root = {"card_sha256": [], "merkle_root": sha256(b""), "card_count": 0}
        pending_sidecar = {
            "as_of": pending_observed_at,
            "corpus_scope": {
                "relationship": "SEPARATE_CORPORA",
                "public_root_count": 0,
                "public_root_sha256": pending_sha,
                "signed_card_count": 0,
                "signed_card_id_overlap": 0,
                "ots_covers": "PUBLIC_ROOT_BYTES_ONLY",
            },
            "witnesses": {"ots": pending_ots},
        }
        (fixture_signed / "card_index.json").write_text('{"cards":[]}\n')
        (fixture_interop / "root-witness-pointer.json").write_text(json.dumps({
            "witness_status_observed_at": pending_observed_at,
            "witnesses": {"ots": "STAMPED_PENDING_BITCOIN"},
        }))
        configure_public_dir(fixture_public)
        pending_errors: list[str] = []
        pending_ref = "public/interop/root-pending.json.ots"
        validate_current_ots(pending_errors, pending_sidecar, {pending_ref}, pending_root, pending_sha)
        assert pending_errors == [], pending_errors

        # A syntactically valid detached timestamp with no recognised pending or
        # Bitcoin attestation is not releasable. (The library refuses to
        # serialize a literally empty tree, so an unknown no-op attestation is
        # the closest parseable adversarial envelope.) Presence alone earns no state.
        empty_proof = fixture_interop / "root-empty.json.ots"
        empty_timestamp = Timestamp(bytes.fromhex(pending_sha))
        empty_timestamp.attestations.add(UnknownAttestation(b"emptytag", b""))
        with empty_proof.open("wb") as handle:
            DetachedTimestampFile(OpSHA256(), empty_timestamp).serialize(
                StreamSerializationContext(handle)
            )
        empty_ots = ots_status_from_proof(
            pending_subject,
            empty_proof,
            root_dir=fixture_repo,
            public_dir=fixture_public,
            observed_at=pending_observed_at,
        )
        assert empty_ots["status"] == "NO_ATTESTATION"
        empty_sidecar = json.loads(json.dumps(pending_sidecar))
        empty_sidecar["witnesses"]["ots"] = empty_ots
        (fixture_interop / "root-witness-pointer.json").write_text(json.dumps({
            "witness_status_observed_at": pending_observed_at,
            "witnesses": {"ots": "NO_ATTESTATION"},
        }))
        empty_errors: list[str] = []
        empty_ref = "public/interop/root-empty.json.ots"
        validate_current_ots(empty_errors, empty_sidecar, {empty_ref}, pending_root, pending_sha)
        assert any("neither a pending calendar" in issue for issue in empty_errors), empty_errors
        configure_public_dir(DEFAULT_PUBLIC)

    fixture_root = {"merkle_root": "11" * 32}
    fixture_raw = b"candidate"
    fixture_sha = sha256(fixture_raw)
    match = {
        "status": "MATCH",
        "checked_at": "2026-09-04T12:00:00Z",
        "checked_against": LIVE_ROOT_URL,
        "witness_artifact_sha256": fixture_sha,
        "live_root_sha256": fixture_sha,
        "witness_artifact_merkle_root": fixture_root["merkle_root"],
        "live_root_merkle_root": fixture_root["merkle_root"],
        "live_root_bytes": len(fixture_raw),
        "match_sha256": True,
        "match_merkle_root": True,
        "reason": "exact fixture match",
    }
    drifted = match | {
        "status": "DRIFTED",
        "live_root_sha256": "22" * 32,
        "live_root_merkle_root": "33" * 32,
        "live_root_bytes": 9,
        "match_sha256": False,
        "match_merkle_root": False,
        "reason": "fixture differs",
    }
    uncheckable = {
        "status": "UNCHECKABLE",
        "checked_at": "2026-09-04T12:00:00Z",
        "checked_against": LIVE_ROOT_URL,
        "witness_artifact_sha256": fixture_sha,
        "witness_artifact_merkle_root": fixture_root["merkle_root"],
        "reason": "fixture endpoint unavailable",
    }
    for candidate_state in (match, drifted, uncheckable):
        drift_errors: list[str] = []
        validate_drift_record(
            drift_errors,
            candidate_state,
            fixture_root,
            fixture_raw,
            fixture_sha,
            label="candidate fixture",
        )
        assert drift_errors == [], drift_errors
    uncheckable_release_errors: list[str] = []
    validate_drift_record(
        uncheckable_release_errors,
        uncheckable,
        fixture_root,
        fixture_raw,
        fixture_sha,
        label="candidate fixture",
        require_observation=True,
    )
    assert any("requires a real live observation" in issue for issue in uncheckable_release_errors)

    for nonmatch_state in (drifted, uncheckable):
        live_errors: list[str] = []
        validate_drift_record(
            live_errors,
            nonmatch_state,
            fixture_root,
            fixture_raw,
            fixture_sha,
            label="live fixture",
            require_match=True,
        )
        assert any("must be MATCH" in issue for issue in live_errors)
    lying_match = match | {"live_root_sha256": "44" * 32}
    lying_errors: list[str] = []
    validate_drift_record(
        lying_errors,
        lying_match,
        fixture_root,
        fixture_raw,
        fixture_sha,
        label="lying fixture",
    )
    assert any("contradicts" in issue or "without an exact" in issue for issue in lying_errors)
    wrong_size_errors: list[str] = []
    validate_drift_record(
        wrong_size_errors,
        match | {"live_root_bytes": len(fixture_raw) + 1},
        fixture_root,
        fixture_raw,
        fixture_sha,
        label="wrong-size fixture",
    )
    assert any("without an exact" in issue for issue in wrong_size_errors)

    configure_public_dir(REPO / "dist" / "client")
    assert local_entry_path("public/interop/rekor-root-deadbeef.json") == PUBLIC / "interop" / "rekor-root-deadbeef.json"
    assert local_entry_path("public/../../scripts/secret.json") is None
    assert local_entry_path("https://councilof.ai/../../scripts/secret.json") is None
    assert canonical_public_path(PUBLIC / "interop" / "root-deadbeef.json.ots") == "public/interop/root-deadbeef.json.ots"
    configure_public_dir(DEFAULT_PUBLIC)
    assert valid_checked_at("2026-09-04T12:00:00Z")
    assert not valid_checked_at("not-a-timestamp")
    assert not valid_checked_at("2999-01-01T00:00:00Z")
    bitcoin_fixture = {
        "block_hash": "11" * 32,
        "hex": "22" * 80,
        "height": 123,
    }
    bitcoin_errors: list[str] = []
    reauthenticate_bitcoin_header(
        bitcoin_errors,
        bitcoin_fixture,
        fetcher=lambda url: "11" * 32 if "/block-height/" in url else "22" * 80,
    )
    assert bitcoin_errors == [], bitcoin_errors
    bitcoin_lie_errors: list[str] = []
    reauthenticate_bitcoin_header(
        bitcoin_lie_errors,
        bitcoin_fixture,
        fetcher=lambda url: (
            "11" * 32
            if "/block-height/" in url
            else "33" * 80 if "mempool.space" in url else "22" * 80
        ),
    )
    assert any("did not both return" in issue for issue in bitcoin_lie_errors), bitcoin_lie_errors
    wrong_height_errors: list[str] = []
    reauthenticate_bitcoin_header(
        wrong_height_errors,
        bitcoin_fixture,
        fetcher=lambda url: (
            "44" * 32
            if "/block-height/" in url and "mempool.space" in url
            else "11" * 32 if "/block-height/" in url else "22" * 80
        ),
    )
    assert any("do not map the attested height" in issue for issue in wrong_height_errors), wrong_height_errors
    assert verification_guide_issues("Anchor 4 of 4; RFC-3161 TSA; root-728e8c5e")
    assert verification_guide_issues(
        "/interop/root-witness-latest.json STAMPED_PENDING_BITCOIN "
        "CONFIRMED_BITCOIN Signed public-root catalogue separate corpora"
    ) == []
    assert root_verification_guide_issues("root-a44af078")
    assert root_verification_guide_issues(
        "/interop/root-witness-latest.json STAMPED_PENDING_BITCOIN CONFIRMED_BITCOIN "
        "exact response bytes timestamped comparison separate corpora"
    ) == []
    print("root-witness-release-gate selftest: PASS")
    return 0


def run_gate(
    *,
    phase: str,
    public_dir: Path,
    live_url: str = LIVE_ROOT_URL,
    live_timeout_seconds: int = 30,
) -> int:
    configure_public_dir(public_dir)
    errors: list[str] = []
    validated = validate_root(errors)
    sidecar: dict[str, Any] | None = None
    if validated is not None:
        root, raw, root_sha, signed = validated
        sidecar = validate_current_witness(
            errors,
            root,
            raw,
            root_sha,
            signed,
            require_observation=True,
        )
    valid_ots = validate_ots(errors)
    if validated is not None and sidecar is not None:
        root, raw, root_sha, _ = validated
        if not exact_artifact_issues(sidecar.get("artifact"), root, raw, root_sha, "sidecar"):
            validate_current_ots(
                errors,
                sidecar,
                valid_ots,
                root,
                root_sha,
                authenticate_external=True,
            )
    validate_archive_references(errors, valid_ots)
    validate_public_verification_guide(errors)

    if phase == "live" and validated is not None:
        root, raw, root_sha, _ = validated
        try:
            from witness_public_root import compute_drift

            live_drift = compute_drift(root_sha, root["merkle_root"], live_url, timeout_seconds=live_timeout_seconds)
            validate_drift_record(
                errors,
                live_drift,
                root,
                raw,
                root_sha,
                label="fresh live drift",
                checked_against=live_url,
                require_match=True,
            )
        except Exception as exc:
            errors.append(f"fresh live drift check failed: {type(exc).__name__}: {exc}")

    # Stable output: the gate is also an audit artifact in CI logs.
    unique = list(dict.fromkeys(errors))
    if unique:
        print(f"root-witness-release-gate ({phase}): BLOCKED ({len(unique)} issue{'s' if len(unique) != 1 else ''})", file=sys.stderr)
        for issue in unique:
            print(f"- {issue}", file=sys.stderr)
        print(
            "Resolution: preserve historical incident files, remove them from the served release tree, then publish and independently verify one fresh schema-valid signed root plus its exact-byte sidecar, Rekor snapshot and OTS proof.",
            file=sys.stderr,
        )
        return 1
    print(f"root-witness-release-gate ({phase}): PASS")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--selftest", action="store_true")
    parser.add_argument("--phase", choices=("candidate", "live"), default="live")
    parser.add_argument("--public-dir", type=Path, default=DEFAULT_PUBLIC)
    parser.add_argument("--live-url", default=LIVE_ROOT_URL)
    parser.add_argument("--live-timeout-seconds", type=int, default=30)
    args = parser.parse_args()
    if args.selftest:
        return run_selftest()
    if args.live_timeout_seconds < 1 or args.live_timeout_seconds > 120:
        parser.error("--live-timeout-seconds must be between 1 and 120")
    return run_gate(
        phase=args.phase,
        public_dir=args.public_dir,
        live_url=args.live_url,
        live_timeout_seconds=args.live_timeout_seconds,
    )


if __name__ == "__main__":
    sys.exit(main())
