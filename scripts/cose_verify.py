#!/usr/bin/env python3
"""cose_verify.py — free, client-side verifier for dual-issued card COSE_Sign1 wraps.

    python3 scripts/cose_verify.py <file.cose | file.cose.hex | sidecar.json> \
        [--fetch-did] [--expected-kid KID] [--expected-pubkey X_B64URL]

WHY THIS FILE EXISTS. Counting COSE envelopes is not verifying them. This is the
councilof-ai-native port of the estate's reference verifier (cibola harness
scitt_verify.py), extended for the dual-issue layout: the kid minted by
scripts/cose_wrap.py is the RFC 9679 thumbprint of the signing key, so resolution
runs thumbprint -> did:web identity against the published key set, and a legacy
did-string kid is also accepted for continuity with older envelopes. No network by
default: the four published did:web:csoai.org identities are embedded, because a
verifier that must phone the issuer to check the issuer's signature verifies
nothing. --fetch-did refreshes the set from https://csoai.org/.well-known/did.json
and falls back to the embedded table, saying so, when the network fails.

WHAT A VERDICT MEANS — read this before reading the exit code.
  VALID        the Ed25519 signature verifies over the RFC 9052 Sig_structure AND
               the signing key is pinned to a published did:web:csoai.org identity
               (reported) or to a caller-supplied expected key.
  INVALID      the envelope is malformed, the alg is not Ed25519 (-19), the kid does
               not match an explicit expectation, or the signature does not verify.
  UNCHECKABLE  self-consistent only: no pinned key is resolvable, so the most that
               could be shown is internal integrity — which is NOT shown here either
               when no key is available at all. Never collapsed into pass/fail.

A verified COSE proves THE KEY SIGNED THESE EXACT BYTES. It is not certification,
not endorsement, not conformity, and it does not vouch for the payload's claims.
Register: measurement, never certification.

Exit codes: 0 VALID, 1 INVALID, 2 UNCHECKABLE.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import sys
import urllib.request
from pathlib import Path
from typing import Any

ALG_LABEL = 1
KID_LABEL = 4
ALG_ED25519 = -19

DID_URL = "https://csoai.org/.well-known/did.json"
UA = "csoai-cose-verify/1 (+https://councilof.ai)"

# Embedded trust root — mirrors public/.well-known/did.json. No network by default.
PUBLISHED_IDENTITIES = {
    "did:web:csoai.org#card-attestation-1": "1MsOqhbV9Qv3Yzo2qjT-CaVeEkuTFt7Sq9sSK7nDfjg",
    "did:web:csoai.org#estate-chain-1": "M0cuAmhx2yDNvZnnbEdTLr_PhLN6vtWyYNrjWJ31aW0",
    "did:web:csoai.org#site-release-1": "03g9l-dVNGVEAVVWQrJU9aLtkYTN3uARd52P7DEq-8g",
    "did:web:csoai.org#board-attestation-1": "k2fPWb6ctyu8l5at8FYgHsHFit_qoT-DssW3VNbCAXA",
}

EXIT_VALID = 0
EXIT_INVALID = 1
EXIT_UNCHECKABLE = 2

REGISTER = (
    "a verified COSE_Sign1 proves the key signed these exact bytes; it is NOT "
    "certification, endorsement, or conformity — measurement, never certification"
)


def canonical_bytes(obj: Any) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def b64url_nopad(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def b64url_decode(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def jwk_thumbprint_b64url(x_b64url: str) -> str:
    """RFC 9679 thumbprint (sha256) of an Ed25519 OKP JWK given its base64url x."""
    jwk = {"crv": "Ed25519", "kty": "OKP", "x": x_b64url}
    return b64url_nopad(hashlib.sha256(canonical_bytes(jwk)).digest())


def thumbprint_index(identities: dict[str, str]) -> dict[str, str]:
    """thumbprint -> did:web id, for the thumbprint-carrying kid minted by cose_wrap.py."""
    return {jwk_thumbprint_b64url(x): did for did, x in identities.items()}


def fetch_identities() -> tuple[dict[str, str], str]:
    """Refresh the pin set from the live DID document; fall back to embedded, saying so."""
    req = urllib.request.Request(DID_URL, headers={"User-Agent": UA, "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            doc = json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        return dict(PUBLISHED_IDENTITIES), f"embedded (fetch of {DID_URL} failed: {type(e).__name__}; using the embedded table)"
    out: dict[str, str] = {}
    for vm in doc.get("verificationMethod", []):
        jwk = vm.get("publicKeyJwk") or {}
        if vm.get("id") and jwk.get("kty") == "OKP" and jwk.get("crv") == "Ed25519" and jwk.get("x"):
            out[vm["id"]] = jwk["x"]
    if not out:
        return dict(PUBLISHED_IDENTITIES), "embedded (live did.json carried no Ed25519 OKP keys; using the embedded table)"
    return out, f"live ({DID_URL}, {len(out)} Ed25519 identities)"


def decode_cose_sign1(envelope: bytes) -> dict:
    """Decode a CBOR COSE_Sign1 envelope (tag 18, or a bare 4-element array in the wild).

    Returns raw byte strings plus the decoded header maps. Raises ValueError on anything
    that is not a well-formed COSE_Sign1 — decode failure is INVALID, never skipped.
    """
    import cbor2

    try:
        obj = cbor2.loads(envelope)
    except Exception as e:
        raise ValueError(f"not CBOR: {e}")
    if isinstance(obj, cbor2.CBORTag) and obj.tag == 18:
        arr = obj.value
    elif isinstance(obj, (list, tuple)):
        # Untagged arrays exist in the wild; accept them for reading, never mint them.
        # (cbor2 >=7 decodes CBOR arrays to tuple; older versions decode to list.)
        arr = obj
    else:
        raise ValueError("not a COSE_Sign1 envelope (expected CBOR tag 18 around a 4-element array)")
    if len(arr) != 4:
        raise ValueError(f"COSE_Sign1 must have 4 elements, got {len(arr)}")
    protected, unprotected, payload, signature = arr
    if not isinstance(protected, bytes) or not isinstance(payload, bytes) or not isinstance(signature, bytes):
        raise ValueError("COSE_Sign1 protected/payload/signature must be byte strings")
    if isinstance(unprotected, bytes):
        # The estate's reference verifier carries the unprotected header as its
        # serialised bstr form; cose_wrap.py mints it that way for continuity.
        try:
            unp_map = cbor2.loads(unprotected) if unprotected else {}
        except Exception as e:
            raise ValueError(f"unprotected header bstr does not decode: {e}")
    elif isinstance(unprotected, dict):
        unp_map = unprotected  # strict RFC 9052 form — accepted on read
    else:
        raise ValueError("COSE_Sign1 unprotected header must be a map or its serialised bstr")
    if not isinstance(unp_map, dict):
        raise ValueError("unprotected header must decode to a map")
    try:
        prot_map = cbor2.loads(protected) if protected else {}
    except Exception as e:
        raise ValueError(f"protected header not CBOR map: {e}")
    if not isinstance(prot_map, dict):
        raise ValueError("protected header must decode to a map")
    return {
        "protected": protected,
        "protected_map": prot_map,
        "unprotected_map": unp_map,
        "payload": payload,
        "signature": signature,
    }


def sig_structure(protected: bytes, payload: bytes, external_aad: bytes = b"") -> bytes:
    """RFC 9052 §4.4 — the bytes Ed25519 actually signs. The context string is load-bearing."""
    import cbor2

    return cbor2.dumps(["Signature1", protected, external_aad, payload])


def resolve_key(kid: Any, identities: dict[str, str]) -> tuple[bytes | None, str | None, str]:
    """Map an envelope kid to (pubkey_raw, pinned_did, how).

    kid may be the RFC 9679 thumbprint minted by cose_wrap.py, or a legacy did-string
    matching the published set. Anything else resolves to nothing — which is
    UNCHECKABLE, not INVALID: an unknown signer is not evidence of forgery.
    """
    if not isinstance(kid, str) or not kid:
        return None, None, "kid absent or not a text string"
    by_thumb = thumbprint_index(identities)
    if kid in by_thumb:
        did = by_thumb[kid]
        return b64url_decode(identities[did]), did, "thumbprint-kid resolved via published did:web set"
    if kid in identities:
        return b64url_decode(identities[kid]), kid, "legacy did-string kid matched the published set"
    return None, None, f"kid {kid!r} is not a published identity (thumbprint or did-string)"


def verify_envelope(
    envelope: bytes,
    *,
    identities: dict[str, str] | None = None,
    expected_kid: str | None = None,
    expected_pubkey: bytes | None = None,
) -> dict:
    """Verify ONE COSE_Sign1 wrap. Returns a verdict dict with a three-state `verdict`."""
    identities = identities if identities is not None else dict(PUBLISHED_IDENTITIES)
    try:
        d = decode_cose_sign1(envelope)
    except ValueError as e:
        return {"verdict": "INVALID", "reason": f"malformed envelope: {e}", "register": REGISTER}

    prot_map = d["protected_map"]
    alg = prot_map.get(ALG_LABEL)
    kid = prot_map.get(KID_LABEL) or d["unprotected_map"].get(KID_LABEL)
    if alg != ALG_ED25519:
        return {
            "verdict": "INVALID",
            "reason": f"unsupported alg {alg!r} — only Ed25519 (-19) is supported; refusing to guess",
            "alg": alg,
            "kid": kid,
            "register": REGISTER,
        }
    if expected_kid is not None and kid != expected_kid:
        return {
            "verdict": "INVALID",
            "reason": f"kid mismatch (envelope {kid!r}, expected {expected_kid!r})",
            "alg": alg,
            "kid": kid,
            "register": REGISTER,
        }

    if expected_pubkey is not None:
        pub, pinned, how = expected_pubkey, expected_kid or kid, "caller-pinned expected pubkey"
    else:
        pub, pinned, how = resolve_key(kid, identities)
    if pub is None:
        return {
            "verdict": "UNCHECKABLE",
            "reason": (
                f"self-consistent only: {how}. No pinned key is resolvable, so nothing "
                "cryptographic can be shown here — pass --expected-pubkey/--expected-kid "
                "or check the pin set. This is not a pass and not a fail."
            ),
            "alg": alg,
            "kid": kid,
            "pinned_to": None,
            "register": REGISTER,
        }

    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

    try:
        Ed25519PublicKey.from_public_bytes(pub).verify(d["signature"], sig_structure(d["protected"], d["payload"]))
    except Exception:
        return {
            "verdict": "INVALID",
            "reason": "Ed25519 signature does not verify over the RFC 9052 Sig_structure (tampered or wrong key)",
            "alg": alg,
            "kid": kid,
            "pinned_to": pinned,
            "register": REGISTER,
        }
    return {
        "verdict": "VALID",
        "reason": f"signature verifies and the key is pinned ({how})",
        "alg": alg,
        "kid": kid,
        "pinned_to": pinned,
        "payload_len": len(d["payload"]),
        "payload_sha256": hashlib.sha256(d["payload"]).hexdigest(),
        "pubkey_thumbprint": jwk_thumbprint_b64url(b64url_nopad(pub)),
        "sig_structure_verified": True,
        "register": REGISTER,
    }


def load_input(path: Path) -> tuple[bytes, dict | None]:
    """Read a wrap from raw .cose bytes, a .hex file, or a sidecar .json (cose_b64 field)."""
    name = path.name.lower()
    if name.endswith(".hex"):
        return bytes.fromhex(path.read_text(encoding="utf-8").strip()), None
    if name.endswith(".json"):
        doc = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(doc, dict) or not isinstance(doc.get("cose_b64"), str):
            raise SystemExit(f"{path}: JSON input must be a sidecar carrying cose_b64")
        return base64.b64decode(doc["cose_b64"]), doc
    return path.read_bytes(), None


def main() -> int:
    ap = argparse.ArgumentParser(description="Verify a dual-issued card COSE_Sign1 wrap (free, client-side)")
    ap.add_argument("input", type=Path, help=".cose file, .cose.hex file, or sidecar .json")
    ap.add_argument("--fetch-did", action="store_true", help=f"refresh the pin set from {DID_URL} (falls back to embedded)")
    ap.add_argument("--expected-kid", help="require the envelope kid to equal this")
    ap.add_argument(
        "--expected-pubkey",
        help="base64url x of the expected Ed25519 public key — pins verification to a caller-supplied key",
    )
    args = ap.parse_args()

    if args.fetch_did:
        identities, source = fetch_identities()
    else:
        identities, source = dict(PUBLISHED_IDENTITIES), f"embedded ({len(PUBLISHED_IDENTITIES)} identities; no network)"
    print(f"pin set: {source}")

    expected_pubkey = b64url_decode(args.expected_pubkey) if args.expected_pubkey else None
    envelope, sidecar = load_input(args.input)
    verdict = verify_envelope(
        envelope,
        identities=identities,
        expected_kid=args.expected_kid,
        expected_pubkey=expected_pubkey,
    )
    if sidecar is not None and isinstance(sidecar.get("card_sha256"), str):
        verdict["sidecar_card_sha256"] = sidecar["card_sha256"]
        if sidecar.get("test_key"):
            verdict["sidecar_test_key"] = True

    print(json.dumps(verdict, indent=2, ensure_ascii=False))
    return {
        "VALID": EXIT_VALID,
        "INVALID": EXIT_INVALID,
        "UNCHECKABLE": EXIT_UNCHECKABLE,
    }[verdict["verdict"]]


if __name__ == "__main__":
    sys.exit(main())
