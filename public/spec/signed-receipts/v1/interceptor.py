"""signed-receipts/v1 — reference interceptor (framework-agnostic core).

Attach: receipt = issue_receipt(signer, task_id, subject_card, claims)
        task.metadata["signed-receipts/v1"] = receipt
Verify: ok, reason = verify_receipt(receipt, resolve_did=fetch_did_document)
        result, reason = verify_receipt_result(receipt, resolve_did=...)

Only dependency: cryptography. Canonicalisation: RFC 8785 (JCS) — full
implementation (UTF-16 key sort, ES6 number serialisation, string escaping;
astral chars as raw UTF-8, as ECMAScript JSON.stringify emits them — corrected
2026-09-28, see _esc_str). Verification: recompute content_id,
resolve kid -> DID doc -> exact public-key match (with revocation support per
SPEC §5 append-only rotation), check Ed25519.

Three results, never two (corrected 2026-09-28):
  VALID            integrity holds AND the kid resolved to a DID document that
                   lists exactly the signing key, unrevoked.
  INVALID          malformed, content_id mismatch, bad signature, or the DID
                   document resolved and does not list the key (or revokes it).
  UNVERIFIABLE_KEY integrity holds against the key the receipt carries, but
                   the kid could not be resolved, so authorship is unknown.
Before 2026-09-28 verify_receipt returned (True, "VALID (integrity) ...")
when no resolver was given. A self-signed receipt carrying an attacker's own
key passed that check: the defect IETF SCITT architecture issue #462 cites.
verify_receipt keeps its (bool, str) shape; the bool is now True only for VALID.

Register: a receipt is evidence of what was claimed and when — never a
certification, endorsement, or conformity mark.
"""

from __future__ import annotations

import hashlib
import json
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
    """RFC 8785 string escaping (ECMAScript JSON.stringify semantics): \b \t \n \f \r
    short forms, \\uXXXX for other control chars and for lone surrogates, and
    every other character — astral ones included — emitted as itself (UTF-8).

    Corrected 2026-09-28: this used to escape astral chars as a \\uD83D\\uDE00
    surrogate pair. JSON.stringify("\U0001F600") is the raw character, so any
    receipt carrying an emoji or other astral char canonicalised to different
    bytes here than in every RFC 8785 implementation, and cross-verification
    failed. Conformance vector valid-jcs-edge covers it."""
    out: list[str] = []
    for ch in s:
        if ch in _ESC_SHORT:
            out.append(_ESC_SHORT[ch])
            continue
        cp = ord(ch)
        if cp < 0x20 or 0xD800 <= cp <= 0xDFFF:
            out.append("\\u%04x" % cp)
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
    # ES6 Number.prototype.toString semantics: shortest round-trip, no -0.
    # Corrected 2026-09-28: this used Python's repr() thresholds, so 1e-05 came out
    # "1e-5" (ECMAScript: "0.00001") and 1e16 "1e+16" (ECMAScript: "10000000000000000").
    if n != n or n in (float("inf"), float("-inf")):
        raise ValueError("non-finite number is not JSON")
    if n == 0:
        return "0"  # also covers -0.0
    return _es_float(n)


def _es_float(n: float) -> str:
    """ECMAScript Number::toString for a finite, non-zero float (RFC 8785 section 3.2.2.3)."""
    from decimal import Decimal

    sign, digs, exp = Decimal(repr(abs(n))).as_tuple()
    d = "".join(map(str, digs)).rstrip("0") or "0"
    exp += len(digs) - len(d) if len(d) < len(digs) else 0
    k = len(d)
    e = k + exp  # value = 0.d * 10^e
    out: str
    if k <= e <= 21:
        out = d + "0" * (e - k)
    elif 0 < e <= 21:
        out = d[:e] + "." + d[e:]
    elif -6 < e <= 0:
        out = "0." + "0" * (-e) + d
    else:
        x = e - 1
        out = (d if k == 1 else d[0] + "." + d[1:]) + "e" + ("+" if x > 0 else "-") + str(abs(x))
    return ("-" if n < 0 else "") + out


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


VALID = "VALID"
INVALID = "INVALID"
UNVERIFIABLE_KEY = "UNVERIFIABLE_KEY"
RESULTS = (VALID, INVALID, UNVERIFIABLE_KEY)


def verify_receipt_result(
    receipt: dict,
    resolve_did: Callable[[str], dict | None] | None = None,
) -> tuple[str, str]:
    """Return (result, reason); result is one of VALID, INVALID, UNVERIFIABLE_KEY.

    Integrity (content_id + Ed25519 over the JCS body) is checked first; a
    receipt that fails it is INVALID whether or not its key resolves.
    resolve_did(did) -> DID document dict (e.g. fetched from
    https://<host>/.well-known/did.json), or None / an exception when the
    document cannot be obtained. No resolver, or a failed resolution, gives
    UNVERIFIABLE_KEY — never VALID. Never raises.
    """
    try:
        if not isinstance(receipt, dict) or not isinstance(receipt.get("signature"), dict):
            return INVALID, "malformed: no signature object"
        env = receipt["signature"]
        if env.get("alg") != "Ed25519":
            return INVALID, f"unsupported alg {env.get('alg')!r} (this verifier checks Ed25519)"
        kid = env.get("kid")
        if not isinstance(kid, str) or "#" not in kid or not kid.startswith("did:"):
            return INVALID, f"malformed: kid {kid!r} is not a DID URL"
        body = {k: v for k, v in receipt.items() if k != "signature"}
        unsigned = {k: v for k, v in body.items() if k != "content_id"}
        if body.get("content_id") != _sha256(_canon(unsigned)):
            return INVALID, "content_id mismatch"
        pub_raw = bytes.fromhex(env["signer_public_key"])
        Ed25519PublicKey.from_public_bytes(pub_raw).verify(bytes.fromhex(env["sig"]), _canon(body))
    except Exception as e:  # noqa: BLE001
        return INVALID, f"{type(e).__name__}: {e}".strip()

    did = kid.split("#")[0]
    if resolve_did is None:
        return UNVERIFIABLE_KEY, f"signature matches the key the receipt carries, but kid {kid} was not resolved (no resolver): authorship unverified"
    try:
        doc = resolve_did(did)
    except Exception as e:  # noqa: BLE001
        return UNVERIFIABLE_KEY, f"DID document for {did} could not be resolved ({type(e).__name__}: {e}): authorship unverified"
    if not isinstance(doc, dict):
        return UNVERIFIABLE_KEY, f"DID document for {did} could not be resolved: authorship unverified"

    try:
        pub_hex = pub_raw.hex()
        for vm_id, entry in _vm_keys(doc):
            vm_hex = entry.get("hex")
            if vm_hex == pub_hex or (entry.get("key") and entry["key"] == pub_raw):
                if entry["revoked"]:
                    return INVALID, f"signature valid but key REVOKED in DID doc ({vm_id})"
                return VALID, f"key matches published DID doc for {did} ({vm_id})"
    except Exception as e:  # noqa: BLE001
        return INVALID, f"DID document for {did} is malformed ({type(e).__name__}: {e})"
    return INVALID, f"signature valid but key NOT in DID doc for {did}"


def verify_receipt(
    receipt: dict,
    resolve_did: Callable[[str], dict | None] | None = None,
) -> tuple[bool, str]:
    """(ok, reason). ok is True only for VALID; reason starts with the result code.

    Kept for callers of the (bool, str) shape. Use verify_receipt_result() to
    tell INVALID from UNVERIFIABLE_KEY without parsing the reason.
    """
    result, reason = verify_receipt_result(receipt, resolve_did)
    return result == VALID, f"{result} — {reason}"


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
