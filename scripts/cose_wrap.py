#!/usr/bin/env python3
"""cose_wrap.py — dual-issue every board card as COSE_Sign1 (CBOR tag 18).

WHY THIS FILE EXISTS. A card today exists only as canonical JSON signed with a raw
Ed25519 signature over a compact envelope — a stranger needs our canonicalisation
rules AND our envelope layout AND did.json before they can check anything. That is a
verification story only we can read. COSE_Sign1 (RFC 9052, profiled by RFC 9943) is
the shape the rest of the supply-chain world verifies with stock tooling, so each
card gets a SECOND issuance — same card id, same canonical payload bytes, one more
envelope — under public/cards-cose/. The JSON card stays canonical truth; the .cose
is its dual. Nothing here replaces the JSON card, the merkle leaf, or the root.

WHY A FRESH IMPLEMENTATION. scripts/badger/csoai-cose-wrap.py is QUARANTINED
(2026-09-04): it built a Sig_structure with no "Signature1" context string and
reused a card signature over different bytes, so its envelopes were self-consistent-
looking but were not COSE_Sign1. Nothing from it is reused. This file builds the
Sig_structure with cbor2 exactly per RFC 9052 §4.4:

    Sig_structure = cbor(["Signature1", protected_bstr, external_aad=b"", payload])

and signs THOSE bytes with Ed25519. The accompanying scripts/cose_verify.py
reconstructs the same structure from the envelope bytes and is exercised against
tampered vectors in CI, so "the generator and the checker share a bug" is covered
by an independent decode path, not by faith.

kid IS THE RFC 9679 THUMBPRINT. Per draft-csoai-scitt-measurement-card-00 the kid
carries the sha256 JWK thumbprint of the signing key's public half, not a resolvable
URL. A verifier that already trusts did.json resolves thumbprint -> did:web id with
no network; a verifier that does not can still check self-consistency. Legacy
did-string kids are accepted by the verifier for continuity, never minted here.

DETERMINISM. Ed25519 is deterministic and the protected header map is built with
integer keys ascending (1 alg, 3 content type, 4 kid), so the same card wrapped with
the same key produces byte-identical .cose output. That property is tested
(scripts/cose_wrap_selftest.py) because dual-issue that is not reproducible cannot
be audited.

FAIL-CLOSED. BOARD_SIGN_KEY_PKCS8_B64 absent -> exit 3, nothing written, same rule
as publish_public_root.py. The key is read from the environment inside this process
and is never printed, logged, or written to any artifact. --test-key generates an
EPHEMERAL Ed25519 key in memory for local/CI exercise; every artifact it produces is
marked "test_key": true, "pinned_to": null so a test wrap can never present a
production identity.

DOWNGRADE GUARD. A stale wrap must never clobber a fresh one. If the target .cose
exists and its embedded payload differs from the current card's canonical bytes, the
card file must be strictly newer than the .cose or the wrap is refused. Same spirit
as anchored_write: richer/newer state wins, never the other way round.

Register: measurement, never certification. A COSE wrap is a signed byte envelope
attesting that a key signed these exact bytes. UNMEASURED stays empty. Nothing here
is a conformity mark, an endorsement, or a certificate.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
import sys
from pathlib import Path
from typing import Any

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
CARDS_DIR = ROOT / "public" / "cards"
COSE_DIR = ROOT / "public" / "cards-cose"

# COSE header labels (RFC 9052 §3.1)
ALG_LABEL = 1
CONTENT_TYPE_LABEL = 3
KID_LABEL = 4
ALG_ED25519 = -19
CONTENT_TYPE = "application/vnd.csoai.measurement-card+json"
SIDECAR_SCHEMA = "https://councilof.ai/schema/card-cose-v0.json"
REGISTER_NOTE = "measurement, never certification"

# The published did:web:csoai.org Ed25519 identities (x = base64url), mirrored from
# public/.well-known/did.json so the wrapper can say WHICH identity it is wrapping
# under without network. The verifier owns the same table; keep them in step.
PUBLISHED_IDENTITIES = {
    "did:web:csoai.org#card-attestation-1": "1MsOqhbV9Qv3Yzo2qjT-CaVeEkuTFt7Sq9sSK7nDfjg",
    "did:web:csoai.org#estate-chain-1": "M0cuAmhx2yDNvZnnbEdTLr_PhLN6vtWyYNrjWJ31aW0",
    "did:web:csoai.org#site-release-1": "03g9l-dVNGVEAVVWQrJU9aLtkYTN3uARd52P7DEq-8g",
    "did:web:csoai.org#board-attestation-1": "k2fPWb6ctyu8l5at8FYgHsHFit_qoT-DssW3VNbCAXA",
}

EXIT_OK = 0
EXIT_BAD = 1
EXIT_REFUSED = 2
EXIT_MISSING_KEY = 3


def canonical_bytes(obj: Any) -> bytes:
    """The repo's one canonical form. Never a second one."""
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def b64url_nopad(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def jwk_thumbprint(pubkey_raw: bytes) -> str:
    """RFC 9679 JWK thumbprint (sha256) of an Ed25519 OKP public key, base64url no pad.

    The thumbprint canonical member order (crv, kty, x) is REQUIRED by RFC 9679 §3.1 —
    it is lexicographic, which sort_keys=True gives, and the separators must be the
    minimal (",", ":"). A thumbprint computed over any other serialisation is a
    different identifier and resolves to nothing.
    """
    x = b64url_nopad(pubkey_raw)
    jwk = {"crv": "Ed25519", "kty": "OKP", "x": x}
    return b64url_nopad(hashlib.sha256(canonical_bytes(jwk)).digest())


def key_present() -> bool:
    return bool(os.environ.get("BOARD_SIGN_KEY_PKCS8_B64", "").strip())


def load_key():
    """Publisher pattern: PKCS8 DER base64 from the environment, or None. Never printed."""
    raw = os.environ.get("BOARD_SIGN_KEY_PKCS8_B64", "").strip()
    if not raw:
        return None
    try:
        from cryptography.hazmat.primitives.serialization import load_der_private_key
    except ImportError:
        print("cryptography not installed; cannot sign", file=sys.stderr)
        return None
    der = base64.b64decode(raw)
    return load_der_private_key(der, password=None)


def pubkey_raw_of(private_key) -> bytes:
    from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat

    return private_key.public_key().public_bytes(Encoding.Raw, PublicFormat.Raw)


def pinned_identity(pubkey_raw: bytes) -> str | None:
    """Which published identity this public key IS, or None. Honest, never assumed."""
    x = b64url_nopad(pubkey_raw)
    for did, published_x in PUBLISHED_IDENTITIES.items():
        if published_x == x:
            return did
    return None


def build_cose(payload: bytes, private_key, kid: str):
    """Build one COSE_Sign1 envelope (CBOR tag 18). Returns (envelope_bytes, protected_bstr).

    The protected header map is constructed with integer keys ascending so cbor2 emits
    them in canonical map order — this is what makes dual-issue byte-reproducible.
    The unprotected header is the empty map, carried as its serialised bstr form for
    continuity with the estate's existing verifier (cibola harness scitt_verify.py);
    it is semantically the empty header map either way.
    """
    import cbor2

    protected_map = {ALG_LABEL: ALG_ED25519, CONTENT_TYPE_LABEL: CONTENT_TYPE, KID_LABEL: kid}
    protected = cbor2.dumps(protected_map)
    unprotected = cbor2.dumps({})
    # RFC 9052 §4.4 — the context string is load-bearing. Omitting "Signature1" is the
    # exact fault that quarantined the previous generator: the bytes signed must be the
    # Sig_structure, not the payload and not a hand-rolled lookalike.
    sig_structure = cbor2.dumps(["Signature1", protected, b"", payload])
    signature = private_key.sign(sig_structure)
    envelope = cbor2.dumps(cbor2.CBORTag(18, [protected, unprotected, payload, signature]))
    return envelope, protected


def decode_payload_from_cose(envelope: bytes) -> bytes | None:
    """Pull the payload bstr out of an existing wrap — for the downgrade guard only."""
    import cbor2

    try:
        obj = cbor2.loads(envelope)
        arr = obj.value if isinstance(obj, cbor2.CBORTag) and obj.tag == 18 else obj
        # cbor2 >=7 decodes CBOR arrays to tuple; older versions decode to list.
        if isinstance(arr, (list, tuple)) and len(arr) == 4 and isinstance(arr[2], bytes):
            return arr[2]
    except Exception:
        pass
    return None


def wrap_card_file(
    card_path: Path,
    private_key,
    kid: str,
    *,
    test_key: bool,
    pinned_to: str | None,
    out_dir: Path = COSE_DIR,
    dry_run: bool = False,
) -> dict:
    """Dual-issue one card file. Returns a per-card report; raises SystemExit on refusal."""
    wrapped = json.loads(card_path.read_text(encoding="utf-8"))
    card = wrapped.get("card") if isinstance(wrapped, dict) else None
    if not isinstance(card, dict) or not isinstance(card.get("sha256"), str):
        raise SystemExit(f"REFUSING: {card_path} does not carry a card object with sha256")
    # The payload is the FULL card object, sha256 and sig_ed25519 fields included: the
    # COSE envelope dual-issues the signed JSON card as-is, so the card id is unchanged
    # and the payload itself carries it. Do not strip fields here — that would re-open
    # the gap where attested bytes and presented bytes were different objects.
    payload = canonical_bytes(card)
    envelope, _protected = build_cose(payload, private_key, kid)

    sha16 = card_path.stem
    cose_path = out_dir / f"{sha16}.cose"
    sidecar_path = out_dir / f"{sha16}.json"

    # Downgrade guard: a stale wrap must never clobber a fresh one.
    if cose_path.exists():
        existing_payload = decode_payload_from_cose(cose_path.read_bytes())
        if existing_payload is not None and existing_payload != payload:
            if card_path.stat().st_mtime <= cose_path.stat().st_mtime:
                raise SystemExit(
                    f"REFUSING to overwrite {cose_path}: its payload differs from the current "
                    f"card and the card file is not newer. A stale wrap must not clobber a fresh one."
                )
            print(f"re-wrap: card is newer than existing wrap for {sha16}")
        # identical payload -> deterministic rebuild is byte-identical; writing is a no-op

    sidecar = {
        "schema": SIDECAR_SCHEMA,
        "card_sha256": card["sha256"],
        # sha256 of the canonical payload bytes — recorded as itself, nothing else.
        # It is NOT claimed to equal card_sha256: card_sha256 excludes the sha256 and
        # sig_ed25519 fields by the card-v1 digest rule; the payload carries them.
        "payload_sha256": sha256_hex(payload),
        "cose_b64": base64.b64encode(envelope).decode(),
        "kid": kid,
        "alg": ALG_ED25519,
        "dual_of": f"public/cards/{sha16}.json",
        "note": REGISTER_NOTE,
        "test_key": bool(test_key),
        "pinned_to": pinned_to,
    }
    report = {
        "card": str(card_path.relative_to(ROOT)) if card_path.is_relative_to(ROOT) else str(card_path),
        "sha16": sha16,
        "payload_sha256": sidecar["payload_sha256"],
        "cose_bytes": len(envelope),
        "kid": kid,
        "written": not dry_run,
    }
    if dry_run:
        return report
    out_dir.mkdir(parents=True, exist_ok=True)
    cose_path.write_bytes(envelope)
    sidecar_path.write_text(json.dumps(sidecar, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return report


def main() -> int:
    ap = argparse.ArgumentParser(description="Dual-issue board cards as COSE_Sign1 (tag 18)")
    ap.add_argument("cards", nargs="*", type=Path, help="paths to public/cards/{sha16}.json files")
    ap.add_argument("--all", action="store_true", help=f"walk {CARDS_DIR.relative_to(ROOT)}")
    ap.add_argument("--dry-run", action="store_true", help="compute everything; write nothing")
    ap.add_argument(
        "--test-key",
        action="store_true",
        help="generate an EPHEMERAL Ed25519 key in memory; every output is marked test_key",
    )
    args = ap.parse_args()

    paths: list[Path] = list(args.cards)
    if args.all:
        paths.extend(sorted(CARDS_DIR.glob("*.json")))
    if not paths:
        print("no card files given (pass paths or --all)", file=sys.stderr)
        return EXIT_BAD

    # Never print the secret. Presence only.
    print(f"BOARD_SIGN_KEY_PKCS8_B64: {'present' if key_present() else 'absent'}", flush=True)

    test_key = bool(args.test_key)
    if test_key:
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

        key = Ed25519PrivateKey.generate()
        print("TEST KEY: ephemeral Ed25519 generated in memory; outputs are marked test_key", flush=True)
    else:
        key = load_key()
        if key is None:
            print(
                "HALT-ON-MISSING-KEY: BOARD_SIGN_KEY_PKCS8_B64 absent or unloadable; "
                "fail closed (pass --test-key for a marked ephemeral key)",
                file=sys.stderr,
            )
            return EXIT_MISSING_KEY

    pub = pubkey_raw_of(key)
    kid = jwk_thumbprint(pub)
    if test_key:
        pinned_to = None
    else:
        pinned_to = pinned_identity(pub)
        if pinned_to is None:
            # Not a halt: keys rotate, and the thumbprint kid still identifies the key
            # exactly. But say it loudly — a wrap whose key pins to no published identity
            # will verify UNCHECKABLE for strangers, and silence about that would read
            # as a production wrap.
            print(
                "WARNING: signing key matches NO published did:web:csoai.org identity; "
                "wraps will be UNCHECKABLE for pinned verifiers",
                file=sys.stderr,
            )
    print(f"kid (RFC 9679 thumbprint): {kid}  pinned_to: {pinned_to}", flush=True)

    reports = [
        wrap_card_file(p, key, kid, test_key=test_key, pinned_to=pinned_to, dry_run=args.dry_run)
        for p in paths
    ]
    print(
        json.dumps(
            {
                "dry_run": bool(args.dry_run),
                "test_key": test_key,
                "kid": kid,
                "pinned_to": pinned_to,
                "wrapped": len(reports),
                "out_dir": str(COSE_DIR.relative_to(ROOT)),
                "note": REGISTER_NOTE,
            },
            sort_keys=True,
            ensure_ascii=False,
        )
    )
    return EXIT_OK


if __name__ == "__main__":
    sys.exit(main())
