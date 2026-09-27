"""signed-receipts/v1 — reference interceptor (framework-agnostic core).

Attach: receipt = issue_receipt(signer, task_id, subject_card, claims)
        task.metadata["signed-receipts/v1"] = receipt
Verify: ok, reason = verify_receipt(receipt, resolve_did=fetch_did_document)

Only dependency: cryptography. Canonicalisation: RFC 8785 (JCS) — full
implementation (UTF-16 key sort, ES6 number serialisation, string escaping,
surrogate-pair escaping for astral chars). Verification: recompute content_id,
resolve kid -> DID doc -> exact public-key match (with revocation support per
SPEC §5 append-only rotation), check Ed25519.

Register: a receipt is evidence of what was claimed and when — never a
certification, endorsement, or conformity mark.
"""

from __future__ import annotations

import hashlib
import json
import re
import time
from typing import Any, Callable

from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
    Ed25519PublicKey,
)

SCHEMA = "a2a.signed-receipt/0.1"
EXT_URI = "https://councilof.ai/a2a/extensions/signed-receipts/v1"
REGISTER = (
    "Evidence of what was claimed and when by the issuer. Not a certification, "
    "endorsement, or conformity mark."
)

# ---------------------------------------------------------------- RFC 8785 (JCS)

_ESC_SHORT = {
    '"': '\\"',
    "\\": "\\\\",
    "\b": "\\b",
    "\t": "\\t",
    "\n": "\\n",
    "\f": "\\f",
    "\r": "\\r",
}

_EXP_RE = re.compile(r"^([0-9.-]+)[eE]([+-]?)([0-9]+)$")


def _utf16_units(s: str) -> list[int]:
    """Code units as ES6 UTF-16 sees them (astral chars -> surrogate pair)."""
    out: list[int] = []
    for ch in s:
        cp = ord(ch)
        if cp > 0xFFFF:
            cp -= 0x10000
            out.append(0xD800 + (cp >> 10))
            out.append(0xDC00 + (cp & 0x3FF))
        else:
            out.append(cp)
    return out


def _esc_str(s: str) -> str:
    """RFC 8785 string escaping: \b \t \n \f \r short forms, \\uXXXX for other
    control chars, surrogate pairs for astral chars (ECMAScript
    JSON.stringify semantics — matches the IETF JCS interop suite)."""
    out: list[str] = []
    for ch in s:
        if ch in _ESC_SHORT:
            out.append(_ESC_SHORT[ch])
            continue
        cp = ord(ch)
        if cp < 0x20:
            out.append("\\u%04x" % cp)
        elif cp > 0xFFFF:
            cp -= 0x10000
            out.append("\\u%04x\\u%04x" % (0xD800 + (cp >> 10), 0xDC00 + (cp & 0x3FF)))
        else:
            out.append(ch)
    return "".join(out)


def _num(n: float | int) -> str:
    if isinstance(n, bool):
        raise TypeError("bool is not a JSON number")
    if isinstance(n, int):
        if abs(n) > 2**53:
            raise ValueError(f"integer {n} exceeds JCS safe integer domain (|n| <= 2^53)")
        return str(n)
    # ES6 Number.prototype.toString semantics: shortest round-trip, no -0,
    # exponent with sign and no leading zeros.
    if n == 0:
        return "0"  # also covers -0.0
    s = repr(n)
    m = _EXP_RE.match(s)
    if m:
        mant, sign, exp = m.groups()
        return f"{mant}e{sign}{int(exp)}"
    return s


def _canon(obj: Any) -> bytes:
    """RFC 8785 (JCS) canonical serialisation."""
    if obj is None:
        return b"null"
    if obj is True:
        return b"true"
    if obj is False:
        return b"false"
    if isinstance(obj, str):
        return b'"' + _esc_str(obj).encode("utf-8") + b'"'
    if isinstance(obj, (int, float)):
        return _num(obj).encode("ascii")
    if isinstance(obj, list):
        return b"[" + b",".join(_canon(v) for v in obj) + b"]"
    if isinstance(obj, dict):
        items = sorted(
            ((k, v) for k, v in obj.items()),
            key=lambda kv: _utf16_units(kv[0]),
        )
        return (
            b"{"
            + b",".join(
                b'"' + _esc_str(k).encode("utf-8") + b'":' + _canon(v)
                for k, v in items
            )
            + b"}"
        )
    raise TypeError(f"cannot canonicalise {type(obj).__name__}")


# ------------------------------------------------------------- multibase decode

_B58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
_B58_INDEX = {c: i for i, c in enumerate(_B58_ALPHABET)}


def _b58_decode(s: str) -> bytes:
    num = 0
    for ch in s:
        num = num * 58 + _B58_INDEX[ch]
    out = num.to_bytes((num.bit_length() + 7) // 8, "big") if num else b""
    pad = 0
    for ch in s:
        if ch == "1":
            pad += 1
        else:
            break
    return b"\x00" * pad + out


def _multibase_decode(s: str) -> bytes:
    """Decode common multibase prefixes; returns raw bytes or raises."""
    if s.startswith("z"):  # base58btc
        return _b58_decode(s[1:])
    if s.startswith("f"):  # base16 (lower)
        return bytes.fromhex(s[1:])
    if s.startswith("F"):  # base16 (upper)
        return bytes.fromhex(s[1:].lower())
    if s.startswith("u"):  # base64url
        import base64

        return base64.urlsafe_b64decode(s[1:] + "=" * (-len(s[1:]) % 4))
    raise ValueError(f"unsupported multibase prefix: {s[:1]}")


# ------------------------------------------------------------------- receipts

def issue_receipt(
    key: Ed25519PrivateKey,
    kid: str,
    issuer_did: str,
    task_id: str,
    subject_card: str,
    claims: list[dict],
) -> dict:
    payload = {
        "schema": SCHEMA,
        "issuer": issuer_did,
        "subject_card": subject_card,
        "task_id": task_id,
        "claims": claims,
        "register": REGISTER,
        "issued_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    payload["content_id"] = _sha256(_canon({k: v for k, v in payload.items() if k != "content_id"}))
    sig = key.sign(_canon(payload))
    pub = key.public_key().public_bytes_raw().hex()
    return {**payload, "signature": {"alg": "Ed25519", "kid": kid, "signer_public_key": pub, "sig": sig.hex()}}


def _sha256(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def _vm_keys(doc: dict) -> list[tuple[str, dict]]:
    """Return [(vm_id, {"hex": ...|"key": bytes, "revoked": bool})] for a DID doc."""
    out: list[tuple[str, dict]] = []
    for vm in doc.get("verificationMethod", []):
        entry: dict = {"revoked": bool(vm.get("revoked", False))}
        if vm.get("publicKeyHex"):
            entry["hex"] = vm["publicKeyHex"].lower()
        elif vm.get("publicKeyMultibase"):
            entry["key"] = _multibase_decode(vm["publicKeyMultibase"])
        elif vm.get("publicKeyJwk"):
            jwk = vm["publicKeyJwk"]
            if jwk.get("kty") == "OKP" and jwk.get("crv") == "Ed25519" and jwk.get("x"):
                import base64

                entry["key"] = base64.urlsafe_b64decode(jwk["x"] + "=" * (-len(jwk["x"]) % 4))
        out.append((vm.get("id", ""), entry))
    return out


def verify_receipt(
    receipt: dict,
    resolve_did: Callable[[str], dict] | None = None,
) -> tuple[bool, str]:
    """Offline integrity always; identity + revocation too when resolve_did given.

    resolve_did(did) -> DID document dict (e.g. fetched from
    https://<host>/.well-known/did.json). Never raises.
    """
    try:
        env = receipt["signature"]
        body = {k: v for k, v in receipt.items() if k != "signature"}
        unsigned = {k: v for k, v in body.items() if k != "content_id"}
        if body.get("content_id") != _sha256(_canon(unsigned)):
            return False, "content_id mismatch"
        pub_raw = bytes.fromhex(env["signer_public_key"])
        Ed25519PublicKey.from_public_bytes(pub_raw).verify(bytes.fromhex(env["sig"]), _canon(body))
        if resolve_did is None:
            return True, f"VALID (integrity) — kid {env.get('kid')} not resolved"
        did = env.get("kid", "").split("#")[0]
        doc = resolve_did(did)
        pub_hex = pub_raw.hex()
        matched_id = None
        for vm_id, entry in _vm_keys(doc):
            vm_hex = entry.get("hex")
            if vm_hex == pub_hex or (entry.get("key") and entry["key"] == pub_raw):
                matched_id = vm_id
                if entry["revoked"]:
                    return False, f"signature valid but key REVOKED in DID doc ({vm_id})"
                break
        if matched_id is None:
            return False, f"signature valid but key NOT in DID doc for {did}"
        return True, f"VALID — key matches published DID doc for {did} ({matched_id})"
    except Exception as e:  # noqa: BLE001
        return False, f"INVALID — {type(e).__name__}: {e}"


# ---------------------------------------------------------------------- tests

def _rfc8785_vector() -> bool:
    """RFC 8785 Appendix A canonicalisation vector."""
    doc = {
        "numbers": [333333333.33333329, 1e30, 4.50, 2e-3, 0.000000000000000000000000001],
        "string": "\u20ac$\u000f\u000aA'\u0042\u0022\u005c\\\"/",
        "literals": [None, True, False],
    }
    expect = (
        '{"literals":[null,true,false],"numbers":[333333333.3333333,1e+30,4.5,0.002,1e-27],'
        '"string":"€$\\u000f\\nA\'B\\"\\\\\\\\\\"/"}'
    )
    return _canon(doc).decode("utf-8") == expect


def _revoked_did(did: str) -> dict:
    return {
        "id": did,
        "verificationMethod": [
            {
                "id": did + "#keys-1",
                "type": "JsonWebKey2020",
                "controller": did,
                "publicKeyMultibase": "z6Mkexamplenotreal0000000000000000",
                "revoked": True,
            }
        ],
    }


if __name__ == "__main__":
    key = Ed25519PrivateKey.generate()
    r = issue_receipt(
        key,
        "did:web:councilof.ai#eval-test",
        "did:web:councilof.ai",
        "task-1",
        "https://example.org/.well-known/agent-card.json",
        [{"type": "measurement", "detail": "demo", "evidence_sha256": "ab" * 32}],
    )
    print("roundtrip:", verify_receipt(r))
    r2 = json.loads(json.dumps(r))
    r2["task_id"] = "task-2"
    print("tamper:   ", verify_receipt(r2))

    # Identity resolution: exact key match against a DID doc we control.
    pub = key.public_key().public_bytes_raw().hex()
    good_did = {
        "id": "did:web:councilof.ai",
        "verificationMethod": [
            {"id": "did:web:councilof.ai#keys-1", "type": "JsonWebKey2020", "controller": "did:web:councilof.ai", "publicKeyHex": pub},
            {"id": "did:web:councilof.ai#keys-2", "type": "JsonWebKey2020", "controller": "did:web:councilof.ai", "publicKeyHex": "ab" * 32},
        ],
    }
    print("identity: ", verify_receipt(r, resolve_did=lambda _: good_did))

    # Substring false-positive guard: doc has a key whose hex CONTAINS ours.
    evil_did = {
        "id": "did:web:evil.example",
        "verificationMethod": [
            {"id": "did:web:evil.example#k", "type": "JsonWebKey2020", "controller": "did:web:evil.example", "publicKeyHex": "00" + pub + "00"},
        ],
    }
    print("substr-guard:", verify_receipt(r, resolve_did=lambda _: evil_did))

    # Revocation guard: same key, marked revoked -> rejected.
    revoked_did = {
        "id": "did:web:councilof.ai",
        "verificationMethod": [
            {"id": "did:web:councilof.ai#keys-1", "type": "JsonWebKey2020", "controller": "did:web:councilof.ai", "publicKeyHex": pub, "revoked": True},
        ],
    }
    print("revoked:   ", verify_receipt(r, resolve_did=lambda _: revoked_did))

    # RFC 8785 canonicalisation vector.
    print("rfc8785:   ", _rfc8785_vector())
