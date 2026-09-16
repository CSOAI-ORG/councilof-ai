#!/usr/bin/env python3
"""The ONE local Ed25519 signing primitive for the estate.

Factored out of scripts/publish_public_root.py (2026-09-16) so that a second
signer (scripts/sign_mill_cards.py --key-env) cannot drift from the first: the
canonical form, the key loader and the signature encoding live here and are
imported, never re-typed. publish_public_root.py re-exports these names, so every
module that already imported them from there still gets the same bytes.

What is here, and only this:
  canonical_bytes(obj)   sorted keys, no whitespace, ensure_ascii=False, UTF-8
  key_present(env)       a non-empty PKCS8 base64 value sits in that env var
  load_key(env)          that value -> Ed25519 private key (None if absent);
                         any other key type is refused, never coerced
  sign_bytes(key, raw)   Ed25519 signature over raw, lowercase hex
  public_key_raw(key)    32 raw public-key bytes
  did_document(...)      a did:web document carrying that key as a JWK, for
                         offline verification (throwaway keys in tests)
  generate_throwaway_key()  a fresh key + its PKCS8 base64, for tests only

What is deliberately NOT here: any default key path, any file read, any print of
key material, any network. A key reaches this module through the environment
variable the caller names, and nothing else. Doctrine: signing attests bytes;
it never decides MEASURED, and it never certifies.
"""
from __future__ import annotations

import base64
import json
import os
from typing import Any

DEFAULT_KEY_ENV = "BOARD_SIGN_KEY_PKCS8_B64"


def canonical_bytes(obj: Any) -> bytes:
    """The estate's Python canonical form (publish_public_root.py, sign_financial_runs.py)."""
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def key_present(env: str = DEFAULT_KEY_ENV) -> bool:
    return bool(os.environ.get(env, "").strip())


def load_key(env: str = DEFAULT_KEY_ENV):
    """Ed25519 private key from base64(PKCS8 DER) in ``env``, or None when absent.

    A present-but-unusable value raises rather than returning None: silent
    'no key' on a typo is how a signer reports UNSIGNED for a key that was there.
    """
    raw = os.environ.get(env, "").strip()
    if not raw:
        return None
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
    from cryptography.hazmat.primitives.serialization import load_der_private_key

    try:
        der = base64.b64decode(raw, validate=True)
    except Exception as exc:  # noqa: BLE001 — never echo the value
        raise ValueError(f"{env}: not valid base64") from exc
    key = load_der_private_key(der, password=None)
    if not isinstance(key, Ed25519PrivateKey):
        raise ValueError(f"{env}: not an Ed25519 key ({type(key).__name__})")
    return key


def sign_bytes(key, raw: bytes) -> str:
    return key.sign(raw).hex()


def public_key_raw(key) -> bytes:
    from cryptography.hazmat.primitives import serialization

    return key.public_key().public_bytes(
        encoding=serialization.Encoding.Raw, format=serialization.PublicFormat.Raw
    )


def _b64url(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def did_document(pub_raw: bytes, did: str = "did:web:example.test", kid: str = "board-attestation-1") -> dict:
    """A did:web document whose ``#kid`` verification method carries ``pub_raw``.

    Shape matches https://csoai.org/.well-known/did.json closely enough for
    harness/gspc-top100/verify_card.did_pubkey_bytes and scripts/verify_signed.py
    to resolve the key offline (both match on the ``#fragment``).
    """
    vm_id = f"{did}#{kid}"
    return {
        "@context": ["https://www.w3.org/ns/did/v1", "https://w3id.org/security/suites/jws-2020/v1"],
        "id": did,
        "verificationMethod": [
            {
                "id": vm_id,
                "type": "JsonWebKey2020",
                "controller": did,
                "publicKeyJwk": {"kty": "OKP", "crv": "Ed25519", "x": _b64url(pub_raw), "kid": kid},
            }
        ],
        "assertionMethod": [vm_id],
    }


def generate_throwaway_key():
    """(Ed25519PrivateKey, pkcs8_base64). Tests and dry runs only — never persisted here."""
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

    key = Ed25519PrivateKey.generate()
    der = key.private_bytes(
        encoding=serialization.Encoding.DER,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    return key, base64.b64encode(der).decode("ascii")
