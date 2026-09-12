#!/usr/bin/env python3
"""Atomically finalize, sign, and verify root genesis card #0.

This command is the only supported real-ceremony path from the template to a
publishable card. It derives ROOT-alpha's public identity from the private key,
validates ROOT-beta's supplied public identity, requires a matching independent
Shamir cross-check record, signs the canonical card-minus-signature, verifies
the signature from the embedded public key, and only then creates the output.

No partial or unsigned destination file is ever created. The destination must
not already exist. This tool creates no keys and sends no network requests.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import stat
import sys
import tempfile
from datetime import datetime
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import ed25519_from_seed  # noqa: E402

SCHEMA = "csoai.root-genesis/0.1"
HEX32 = re.compile(r"^[0-9a-f]{64}$")
HEX64 = re.compile(r"^[0-9a-f]{128}$")


def _strip_notes(value):
    if isinstance(value, dict):
        return {k: _strip_notes(v) for k, v in value.items() if not k.startswith("note_")}
    if isinstance(value, list):
        return [_strip_notes(v) for v in value]
    return value


def _contains_null(value) -> bool:
    if value is None:
        return True
    if isinstance(value, dict):
        return any(_contains_null(v) for v in value.values())
    if isinstance(value, list):
        return any(_contains_null(v) for v in value)
    return False


def _contains_note_key(value) -> bool:
    if isinstance(value, dict):
        return any(k.startswith("note_") or _contains_note_key(v) for k, v in value.items())
    if isinstance(value, list):
        return any(_contains_note_key(v) for v in value)
    return False


def _parse_utc(value: str) -> None:
    if not value.endswith("Z"):
        raise ValueError("created_at must be an ISO-8601 UTC value ending in Z")
    datetime.fromisoformat(value[:-1] + "+00:00")


def _public_bytes(key) -> bytes:
    from cryptography.hazmat.primitives import serialization
    return key.public_key().public_bytes(
        serialization.Encoding.Raw, serialization.PublicFormat.Raw
    )


def _private_seed_bytes(key) -> bytes:
    from cryptography.hazmat.primitives import serialization
    return key.private_bytes(
        serialization.Encoding.Raw,
        serialization.PrivateFormat.Raw,
        serialization.NoEncryption(),
    )


def validate_crosscheck(record: dict, root_alpha_seed_sha256: str) -> None:
    tool = record.get("independent_tool") or {}
    if record.get("kind") != "csoai.shamir-independent-crosscheck/1":
        raise ValueError("wrong independent Shamir cross-check record kind")
    if record.get("status") != "PASS":
        raise ValueError("independent Shamir cross-check did not PASS")
    _parse_utc(record.get("checked_at", ""))
    if record.get("secret_sha256") != root_alpha_seed_sha256:
        raise ValueError("independent Shamir cross-check is for a different ROOT-alpha seed")
    if record.get("scheme") != "shamir-gf256-0x11b/v1":
        raise ValueError("independent Shamir cross-check scheme mismatch")
    indices = record.get("share_indices") or []
    if len(indices) != 2 or len(set(indices)) != 2 or any(i not in (1, 2, 3) for i in indices):
        raise ValueError("independent Shamir cross-check must bind exactly two distinct shares")
    if not isinstance(tool.get("name"), str) or not tool["name"].strip():
        raise ValueError("independent Shamir checker name/version is missing")
    if not isinstance(tool.get("sha256"), str) or not HEX32.fullmatch(tool["sha256"]):
        raise ValueError("independent Shamir checker SHA-256 is missing or malformed")


def validate_card(card: dict, require_signature: bool = True) -> tuple[bytes, bytes]:
    if card.get("schema") != SCHEMA or card.get("kind") != SCHEMA:
        raise ValueError("genesis schema/kind mismatch")
    if card.get("card_number") != 0 or "prev" not in card or card["prev"] is not None:
        raise ValueError("genesis must be card_number 0 with explicit prev:null")
    if _contains_note_key(card):
        raise ValueError("helper note_* fields must not be published")
    _parse_utc(card.get("created_at", ""))
    if _contains_null({k: v for k, v in card.items() if k != "prev"}):
        raise ValueError("genesis contains an unfilled null")

    alpha_hex = (card.get("root_alpha") or {}).get("pubkey_raw_hex", "")
    beta_hex = (card.get("root_beta") or {}).get("pubkey_raw_hex", "")
    if not HEX32.fullmatch(alpha_hex) or not HEX32.fullmatch(beta_hex):
        raise ValueError("ROOT-alpha and ROOT-beta public keys must be 32-byte lowercase hex")
    alpha = bytes.fromhex(alpha_hex)
    beta = bytes.fromhex(beta_hex)
    if alpha == beta:
        raise ValueError("ROOT-alpha and ROOT-beta public keys must differ")
    if card["root_alpha"].get("jwk_thumbprint_rfc7638_sha256_b64url") != ed25519_from_seed.jwk_thumbprint(alpha):
        raise ValueError("ROOT-alpha JWK thumbprint does not bind its public key")
    if card["root_beta"].get("jwk_thumbprint_rfc7638_sha256_b64url") != ed25519_from_seed.jwk_thumbprint(beta):
        raise ValueError("ROOT-beta JWK thumbprint does not bind its public key")
    custody = card["root_alpha"].get("custody") or {}
    if custody.get("threshold") != 2 or custody.get("shares") != 3:
        raise ValueError("ROOT-alpha custody must remain 2-of-3")

    unsigned = dict(card)
    sig_hex = unsigned.pop("sig_ed25519", None)
    preimage = ed25519_from_seed.canonical_bytes(unsigned)
    if require_signature:
        if not isinstance(sig_hex, str) or not HEX64.fullmatch(sig_hex):
            raise ValueError("sig_ed25519 must be a 64-byte lowercase hex signature")
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
        Ed25519PublicKey.from_public_bytes(alpha).verify(bytes.fromhex(sig_hex), preimage)
    return alpha, preimage


def _atomic_create(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        raise FileExistsError(f"{path} exists — refusing to replace a genesis record")
    fd, tmp_name = tempfile.mkstemp(prefix=f".{path.name}.", dir=path.parent)
    tmp = Path(tmp_name)
    linked = False
    try:
        os.fchmod(fd, 0o600)
        with os.fdopen(fd, "wb") as fh:
            fh.write(data)
            fh.flush()
            os.fsync(fh.fileno())
        # Hard-link creation is atomic and fails if another process created the
        # destination after the existence check. The temporary inode is removed
        # only after the complete verified bytes are linked.
        os.link(tmp, path)
        linked = True
        os.chmod(path, stat.S_IRUSR | stat.S_IWUSR | stat.S_IRGRP | stat.S_IROTH)
        dir_fd = os.open(path.parent, os.O_RDONLY)
        try:
            os.fsync(dir_fd)
        finally:
            os.close(dir_fd)
    except Exception:
        if linked:
            try:
                path.unlink()
            except OSError:
                pass
        raise
    finally:
        try:
            tmp.unlink()
        except FileNotFoundError:
            pass


def cmd_finalize(args: argparse.Namespace) -> int:
    try:
        from cryptography.hazmat.primitives.serialization import load_der_private_key
        key = load_der_private_key(Path(args.root_alpha_key).read_bytes(), password=None)
        alpha_pub = _public_bytes(key)
        alpha_seed_sha = hashlib.sha256(_private_seed_bytes(key)).hexdigest()
        beta_pub = bytes.fromhex(args.root_beta_pubkey)
        if len(beta_pub) != 32:
            raise ValueError("ROOT-beta public key must be exactly 32 bytes")
        crosscheck = json.loads(Path(args.shamir_crosscheck_record).read_text(encoding="utf-8"))
        validate_crosscheck(crosscheck, alpha_seed_sha)

        card = _strip_notes(json.loads(Path(args.template).read_text(encoding="utf-8")))
        card["created_at"] = args.created_at
        card["root_alpha"]["pubkey_raw_hex"] = alpha_pub.hex()
        card["root_alpha"]["jwk_thumbprint_rfc7638_sha256_b64url"] = ed25519_from_seed.jwk_thumbprint(alpha_pub)
        card["root_beta"]["pubkey_raw_hex"] = beta_pub.hex()
        card["root_beta"]["jwk_thumbprint_rfc7638_sha256_b64url"] = ed25519_from_seed.jwk_thumbprint(beta_pub)
        card.pop("sig_ed25519", None)
        _, preimage = validate_card(card, require_signature=False)
        card["sig_ed25519"] = key.sign(preimage).hex()
        # Mandatory independent verification from the public bytes embedded in
        # the final card before any destination path exists.
        _, verified_preimage = validate_card(card, require_signature=True)
        if verified_preimage != preimage:
            raise ValueError("canonical preimage changed during finalization")
        encoded = json.dumps(card, sort_keys=True, indent=1, ensure_ascii=False).encode("utf-8") + b"\n"
        _atomic_create(Path(args.out), encoded)
    except Exception as exc:
        print(f"REFUSING: {type(exc).__name__}: {exc}", file=sys.stderr)
        return 2
    print("genesis_finalize: VALID")
    print(f"card_file: {args.out}")
    print(f"card_sha256: {hashlib.sha256(encoded).hexdigest()}")
    print(f"preimage_sha256: {hashlib.sha256(preimage).hexdigest()}")
    print(f"root_alpha_pubkey: {alpha_pub.hex()}")
    return 0


def cmd_verify(args: argparse.Namespace) -> int:
    try:
        raw = Path(args.card).read_bytes()
        card = json.loads(raw)
        _, preimage = validate_card(card, require_signature=True)
    except Exception as exc:
        print(f"INVALID: {type(exc).__name__}: {exc}", file=sys.stderr)
        return 1
    print("VALID")
    print(f"card_sha256: {hashlib.sha256(raw).hexdigest()}")
    print(f"preimage_sha256: {hashlib.sha256(preimage).hexdigest()}")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    fp = sub.add_parser("finalize")
    fp.add_argument("--template", required=True)
    fp.add_argument("--root-alpha-key", required=True)
    fp.add_argument("--root-beta-pubkey", required=True)
    fp.add_argument("--created-at", required=True)
    fp.add_argument("--shamir-crosscheck-record", required=True)
    fp.add_argument("--out", required=True)
    vp = sub.add_parser("verify")
    vp.add_argument("--card", required=True)
    args = ap.parse_args()
    return cmd_finalize(args) if args.cmd == "finalize" else cmd_verify(args)


if __name__ == "__main__":
    sys.exit(main())
