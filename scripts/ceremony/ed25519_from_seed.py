#!/usr/bin/env python3
"""ed25519_from_seed.py — seed file -> Ed25519 keypair, sign, verify. Ceremony-grade.

G4.1 CEREMONY PREP (TUI-4 ROOTS & IDENTITY V3). Derives the ROOT-alpha /
ROOT-beta keypairs from 32-byte seeds produced by entropy_from_dice.py (or
reconstructed by shamir_2of3.py). These are the ceremony's OWN new keys —
nothing here touches the board key (did:web:csoai.org#board-attestation-1,
which stays in GHA/Pages). Measurement tooling, never certification.

Key discipline:
  * Ed25519 private key = the 32-byte seed, per RFC 8032, via the
    `cryptography` package (Ed25519PrivateKey.from_private_bytes).
  * The private key is written ONCE, PKCS#8 DER, chmod 0600, to a
    caller-specified path. It is never printed, logged, or base64'd to
    stdout. Refuses to overwrite an existing file.
  * Stdout carries ONLY: the raw 32-byte public key (hex) and the RFC 7638
    JWK thumbprint (SHA-256, base64url) of the public JWK
    {"crv":"Ed25519","kty":"OKP","x":<base64url(pubkey)>} — the estate's kid
    convention. RFC 7638 §3.1: thumbprint input is the UTF-8 JSON of the
    REQUIRED members in lexicographic order, no whitespace:
    {"crv":"Ed25519","kty":"OKP","x":"..."}.

Canonical payload convention (must match the estate's card canon — see
scripts/publish_public_root.py canonical_bytes(), the same rule is reused
here, verbatim):

  payload_bytes = UTF-8( json.dumps(obj, sort_keys=True,
                                    separators=(",", ":"),
                                    ensure_ascii=False) )

  "card minus the sig field" for card #0 means: the card object with the
  "sig_ed25519" key REMOVED ENTIRELY (not set to null), then canonicalised.
  sign-file signs exactly the bytes of the payload file it is given; the
  ceremony flow in ceremony_selftest.py shows the canonical-minus-sig
  construction. Verify is over the same bytes.

Subcommands:
  derive      --seed FILE --key-out FILE          (writes PKCS8 DER, 0600)
  sign-file   --key FILE --payload FILE           (prints sig hex ONLY)
  verify      --pubkey HEX --payload FILE --sig HEX
                                                 (VALID -> exit 0, INVALID -> 1)
Exit codes: 0 ok/VALID; 1 INVALID or bad input; 2 misuse.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
import stat
import sys
from pathlib import Path


def canonical_bytes(obj) -> bytes:
    """The estate canon: UTF-8 JSON, sorted keys, separators (',',':'),
    ensure_ascii=False. Identical to scripts/publish_public_root.py."""
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def b64url(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def jwk_thumbprint(pubkey_raw: bytes) -> str:
    """RFC 7638 §3.1 thumbprint of the OKP JWK, sha256, base64url."""
    jwk = {"crv": "Ed25519", "kty": "OKP", "x": b64url(pubkey_raw)}
    canonical = json.dumps(jwk, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return b64url(hashlib.sha256(canonical).digest())


def _derive(seed: bytes):
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
    if len(seed) != 32:
        raise ValueError(f"seed must be 32 bytes, got {len(seed)}")
    return Ed25519PrivateKey.from_private_bytes(seed)


def cmd_derive(args: argparse.Namespace) -> int:
    from cryptography.hazmat.primitives import serialization
    try:
        key = _derive(Path(args.seed).read_bytes())
    except (ValueError, OSError) as exc:
        print(f"REFUSING: {exc}", file=sys.stderr)
        return 1
    out = Path(args.key_out)
    if out.exists():
        print(f"REFUSING: {out} exists — never overwrite a private key", file=sys.stderr)
        return 1
    der = key.private_bytes(
        serialization.Encoding.DER,
        serialization.PrivateFormat.PKCS8,
        serialization.NoEncryption(),
    )
    fd = os.open(out, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as fh:
        fh.write(der)
    os.chmod(out, stat.S_IRUSR | stat.S_IWUSR)
    pub = key.public_key().public_bytes(
        serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    # Public material only. The seed and the PKCS8 bytes never touch stdout.
    print(f"pubkey_raw_hex: {pub.hex()}")
    print(f"jwk_thumbprint_rfc7638_sha256_b64url: {jwk_thumbprint(pub)}")
    print(f"private_key_file: {out} (PKCS8 DER, mode 0600)")
    return 0


def _load_key(path: Path):
    from cryptography.hazmat.primitives.serialization import load_der_private_key
    key = load_der_private_key(path.read_bytes(), password=None)
    return key


def cmd_sign(args: argparse.Namespace) -> int:
    try:
        key = _load_key(Path(args.key))
        payload = Path(args.payload).read_bytes()
    except (OSError, ValueError) as exc:
        print(f"REFUSING: {exc}", file=sys.stderr)
        return 1
    sig = key.sign(payload)
    # The signature is public by construction. Key and payload are never printed.
    print(f"sig_ed25519_hex: {sig.hex()}")
    print(f"payload_sha256: {hashlib.sha256(payload).hexdigest()}")
    return 0


def cmd_verify(args: argparse.Namespace) -> int:
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
    try:
        pub = Ed25519PublicKey.from_public_bytes(bytes.fromhex(args.pubkey))
        payload = Path(args.payload).read_bytes()
        sig = bytes.fromhex(args.sig)
    except (OSError, ValueError) as exc:
        print(f"REFUSING: {exc}", file=sys.stderr)
        return 1
    try:
        pub.verify(sig, payload)
    except Exception:
        print("INVALID")
        return 1
    print("VALID")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    dp = sub.add_parser("derive")
    dp.add_argument("--seed", required=True)
    dp.add_argument("--key-out", required=True)
    sp = sub.add_parser("sign-file")
    sp.add_argument("--key", required=True)
    sp.add_argument("--payload", required=True)
    vp = sub.add_parser("verify")
    vp.add_argument("--pubkey", required=True)
    vp.add_argument("--payload", required=True)
    vp.add_argument("--sig", required=True)
    args = ap.parse_args()
    if args.cmd == "derive":
        return cmd_derive(args)
    if args.cmd == "sign-file":
        return cmd_sign(args)
    return cmd_verify(args)


if __name__ == "__main__":
    sys.exit(main())
