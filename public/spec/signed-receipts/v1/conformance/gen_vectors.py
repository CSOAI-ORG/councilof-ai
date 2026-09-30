"""Regenerate vectors.json for signed-receipts/v1 (Ed25519 core cases + FractalAI interop section).

    python3 gen_vectors.py [--fractalai-vectors path/to/a2a-receipt-ml-dsa-65.json] > vectors.json

Deterministic: every key comes from a published test seed, every timestamp is fixed. The seeds
are TEST KEYS, published so anyone can regenerate these bytes; they sign nothing else.
Needs `cryptography` and ../interceptor.py (for its RFC 8785 canonicaliser).
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
import sys

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import interceptor as ref  # noqa: E402

ISSUER = "did:web:issuer.example"
KID = ISSUER + "#key-1"
ISSUED_AT = "2026-09-28T00:00:00Z"
CARD = "https://issuer.example/.well-known/agent-card.json"


def seed_key(label: str) -> tuple[Ed25519PrivateKey, str]:
    seed = hashlib.sha256(("csoai signed-receipts/v1 conformance test key: " + label).encode()).digest()
    return Ed25519PrivateKey.from_private_bytes(seed), seed.hex()


ISSUER_KEY, ISSUER_SEED = seed_key("issuer")
ATTACKER_KEY, ATTACKER_SEED = seed_key("attacker")


def pub_hex(k: Ed25519PrivateKey) -> str:
    return k.public_key().public_bytes_raw().hex()


def b58(raw: bytes) -> str:
    alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
    num = int.from_bytes(raw, "big")
    s = ""
    while num:
        num, rem = divmod(num, 58)
        s = alphabet[rem] + s
    return "1" * (len(raw) - len(raw.lstrip(b"\x00"))) + s


def did_doc(vm_extra: dict, did: str = ISSUER, vm_id: str = KID) -> dict:
    return {
        "@context": ["https://www.w3.org/ns/did/v1"],
        "id": did,
        "verificationMethod": [{"id": vm_id, "type": "JsonWebKey2020", "controller": did, **vm_extra}],
    }


def payload(task_id: str = "task-001", claims: list | None = None, issuer: str = ISSUER) -> dict:
    return {
        "schema": ref.SCHEMA,
        "issuer": issuer,
        "subject_card": CARD,
        "task_id": task_id,
        "claims": claims
        if claims is not None
        else [{"type": "measurement", "detail": "demo", "evidence_sha256": hashlib.sha256(b"evidence").hexdigest()}],
        "register": ref.REGISTER,
        "issued_at": ISSUED_AT,
    }


def sign(p: dict, key: Ed25519PrivateKey, kid: str = KID, canon=ref._canon) -> dict:
    body = dict(p)
    body["content_id"] = hashlib.sha256(canon({k: v for k, v in body.items() if k != "content_id"})).hexdigest()
    sig = key.sign(canon(body))
    return {**body, "signature": {"alg": "Ed25519", "kid": kid, "signer_public_key": pub_hex(key), "sig": sig.hex()}}


def copy(o):
    return json.loads(json.dumps(o))


def core_cases() -> list[dict]:
    good_doc = {ISSUER: did_doc({"publicKeyHex": pub_hex(ISSUER_KEY)})}
    genuine = sign(payload(), ISSUER_KEY)
    cases: list[dict] = []

    def add(cid, what, receipt, docs, expected, reason_code):
        cases.append({"id": cid, "what": what, "receipt": receipt, "did_documents": docs,
                      "expected": expected, "reason_code": reason_code})

    add("valid-publickeyhex", "Genuine receipt; the issuer DID document lists the key as publicKeyHex.",
        genuine, good_doc, "VALID", "KEY_RESOLVED")
    raw = ISSUER_KEY.public_key().public_bytes_raw()
    add("valid-publickeymultibase", "Same receipt; the DID document lists the key as base58btc publicKeyMultibase.",
        genuine, {ISSUER: did_doc({"publicKeyMultibase": "z" + b58(raw)})}, "VALID", "KEY_RESOLVED")
    jwk_x = base64.urlsafe_b64encode(raw).rstrip(b"=").decode()
    add("valid-publickeyjwk", "Same receipt; the DID document lists the key as an OKP/Ed25519 publicKeyJwk.",
        genuine, {ISSUER: did_doc({"publicKeyJwk": {"kty": "OKP", "crv": "Ed25519", "x": jwk_x}})}, "VALID", "KEY_RESOLVED")

    # RFC 8785 edge: keys whose UTF-16 order differs from code-point order (U+FB01 vs U+1F600),
    # non-ASCII strings, a float and an exponent. A verifier that sorts by code point, escapes
    # non-ASCII, or prints 1e+30 as 1e30 recomputes different bytes and gets INVALID.
    edge = payload(task_id="task-jcs", claims=[{
        "type": "measurement", "detail": "café € \U0001F600",
        "evidence_sha256": hashlib.sha256(b"jcs").hexdigest(),
        "ﬁ": "fi-ligature key", "\U0001F600": "astral key",
        "score": 0.5, "big": 1e30, "count": 3,
    }])
    add("valid-jcs-edge", "Genuine receipt whose claims exercise RFC 8785: UTF-16 key order (U+1F600 sorts before U+FB01), non-ASCII text, 0.5 and 1e+30.",
        sign(edge, ISSUER_KEY), good_doc, "VALID", "KEY_RESOLVED")

    t = copy(genuine)
    t["task_id"] = "task-002"
    add("tampered-payload", "task_id edited after signing; content_id and signature left as issued.",
        t, good_doc, "INVALID", "CONTENT_ID_MISMATCH")

    t2 = copy(genuine)
    t2["claims"][0]["detail"] = "forged detail"
    t2["content_id"] = hashlib.sha256(ref._canon({k: v for k, v in t2.items() if k not in ("content_id", "signature")})).hexdigest()
    add("tampered-payload-content-id-recomputed", "claims edited and content_id recomputed to match; the signature is the original. Checking content_id alone is not enough.",
        t2, good_doc, "INVALID", "BAD_SIGNATURE")

    t3 = copy(genuine)
    sig = bytearray(bytes.fromhex(t3["signature"]["sig"]))
    sig[0] ^= 0x01
    t3["signature"]["sig"] = sig.hex()
    add("tampered-signature", "One bit of the signature flipped.", t3, good_doc, "INVALID", "BAD_SIGNATURE")

    forged = sign(payload(), ATTACKER_KEY)
    add("different-key-forgery", "An attacker's own key signs a self-consistent receipt naming the issuer's kid and carrying the attacker's public key. The issuer's DID document lists the real key.",
        forged, good_doc, "INVALID", "KEY_NOT_IN_DID_DOCUMENT")

    add("unresolvable-key", "Genuine receipt, but the issuer's DID document cannot be obtained (the resolver has no document for this DID: host down, 404, offline). The signature checks against the key the receipt carries; whose key it is, is unknown. SCITT architecture issue #462.",
        genuine, {}, "UNVERIFIABLE_KEY", "DID_UNRESOLVABLE")
    add("unresolvable-key-forgery", "The different-key forgery above, with the DID document unobtainable. Self-consistent, so integrity passes; it must still never be VALID.",
        forged, {}, "UNVERIFIABLE_KEY", "DID_UNRESOLVABLE")
    other_kid = "did:example:unsupported#key-1"
    add("unresolvable-key-unsupported-method", "Genuine signature under a kid whose DID method the verifier cannot resolve (did:example).",
        sign(payload(), ISSUER_KEY, kid=other_kid), {ISSUER: did_doc({"publicKeyHex": pub_hex(ISSUER_KEY)})}, "UNVERIFIABLE_KEY", "DID_UNRESOLVABLE")
    add("tampered-and-unresolvable", "Tampered payload and an unobtainable DID document. Integrity is checked first, so this is INVALID, not UNVERIFIABLE_KEY.",
        t, {}, "INVALID", "CONTENT_ID_MISMATCH")

    add("key-substring-match", "The DID document lists a key whose hex CONTAINS the signing key (00 + key + 00). Keys match exactly or not at all.",
        genuine, {ISSUER: did_doc({"publicKeyHex": "00" + pub_hex(ISSUER_KEY) + "00"})}, "INVALID", "KEY_NOT_IN_DID_DOCUMENT")
    add("revoked-key", "The DID document lists the signing key with \"revoked\": true (SPEC section 5, append-only rotation).",
        genuine, {ISSUER: did_doc({"publicKeyHex": pub_hex(ISSUER_KEY), "revoked": True})}, "INVALID", "KEY_REVOKED")

    def insertion_order(o) -> bytes:
        return json.dumps(o, ensure_ascii=False, separators=(",", ":")).encode()

    def pretty_sorted(o) -> bytes:
        return json.dumps(o, sort_keys=True).encode()

    add("wrong-canonicalisation-key-order", "content_id and signature computed over insertion-order JSON (schema, issuer, subject_card, ...) instead of RFC 8785 sorted keys.",
        sign(payload(), ISSUER_KEY, canon=insertion_order), good_doc, "INVALID", "CONTENT_ID_MISMATCH")
    add("wrong-canonicalisation-whitespace", "content_id and signature computed over sorted-key JSON with \", \" and \": \" separators (Python json.dumps default) instead of RFC 8785.",
        sign(payload(), ISSUER_KEY, canon=pretty_sorted), good_doc, "INVALID", "CONTENT_ID_MISMATCH")

    m = copy(genuine)
    del m["signature"]
    add("malformed-no-signature", "The signature object is missing.", m, good_doc, "INVALID", "MALFORMED")
    return cases


def interop_cases(path: str | None) -> dict | None:
    if not path:
        return None
    raw = open(path, "rb").read()
    v = json.loads(raw)
    trusted = [v["trusted_public_key"]]
    return {
        "source": {
            "package": "@fractalai/pqc-agent-receipts-conformance",
            "version": "0.3.1",
            "file": "vectors/a2a-receipt-ml-dsa-65.json",
            "file_sha256": hashlib.sha256(raw).hexdigest(),
            "npm": "https://www.npmjs.com/package/@fractalai/pqc-agent-receipts-conformance",
            "license": "Apache-2.0 (https://www.apache.org/licenses/LICENSE-2.0)",
            "credit": "Receipts, keys and signatures are FractalAI's, copied unmodified. The expected results are CSOAI's mapping of that suite's own four assertions (authentic, fail-closed, tamper rejected, forgery rejected) onto the three result codes.",
        },
        "profile": v["profile"],
        "alg": "ML-DSA-65 (FIPS 204)",
        "key_encoding": "base64 (signer_public_key and sig), where the Ed25519 core uses hex",
        "trust_model": "trusted_public_keys: a receipt is VALID only when its signer_public_key is in this list. An empty list stands for an unresolvable key.",
        "cases": [
            {"id": "fractalai-mldsa65-valid", "what": "Genuine ML-DSA-65 receipt; the issuer key is trusted.",
             "receipt": v["valid"]["receipt"], "trusted_public_keys": trusted, "expected": "VALID", "reason_code": "KEY_RESOLVED"},
            {"id": "fractalai-mldsa65-no-trusted-key", "what": "The same genuine receipt with no trusted key: FractalAI's fail-closed assertion.",
             "receipt": v["valid"]["receipt"], "trusted_public_keys": [], "expected": "UNVERIFIABLE_KEY", "reason_code": "DID_UNRESOLVABLE"},
            {"id": "fractalai-mldsa65-tampered", "what": v["tampered"].get("_why", "tampered"),
             "receipt": v["tampered"]["receipt"], "trusted_public_keys": trusted, "expected": "INVALID", "reason_code": "CONTENT_ID_MISMATCH"},
            {"id": "fractalai-mldsa65-forged", "what": v["forged"].get("_why", "different-key forgery"),
             "receipt": v["forged"]["receipt"], "trusted_public_keys": trusted, "expected": "INVALID", "reason_code": "KEY_NOT_IN_DID_DOCUMENT"},
        ],
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--fractalai-vectors")
    a = ap.parse_args()
    out = {
        "schema": "csoai.signed-receipts-conformance/1",
        "spec": "https://councilof.ai/spec/signed-receipts/",
        "extension_uri": ref.EXT_URI,
        "receipt_schema": ref.SCHEMA,
        "generated": ISSUED_AT[:10],
        "license": "Apache-2.0",
        "what_pass_means": "PASS means an implementation's result for a case matches the expected result in this file. It is not a certification, an endorsement or a conformity mark.",
        "results": {
            "VALID": "content_id equals sha256(JCS(receipt minus content_id and signature)); the Ed25519 signature over JCS(receipt minus signature) verifies under signature.signer_public_key; and the DID in signature.kid resolves to a document listing exactly that key, not revoked.",
            "INVALID": "Malformed, content_id mismatch, bad signature, or the DID document resolved and does not list the key, or marks it revoked. Integrity is checked first: a receipt that fails it is INVALID even if its key is also unresolvable.",
            "UNVERIFIABLE_KEY": "Integrity holds against the key the receipt carries, but the DID in signature.kid could not be resolved (no resolver, unsupported method, network failure). Authorship is unknown. Never report this as VALID (IETF SCITT architecture issue #462).",
        },
        "resolution_fixture": "did_documents maps a DID (signature.kid up to '#') to its DID document. A DID absent from the map is unresolvable. Implementations must resolve only through this map, never the network.",
        "reason_codes_informative": ["KEY_RESOLVED", "CONTENT_ID_MISMATCH", "BAD_SIGNATURE", "KEY_NOT_IN_DID_DOCUMENT", "KEY_REVOKED", "DID_UNRESOLVABLE", "MALFORMED"],
        "not_covered": [
            "Time validity: SPEC draft 0.2 defines issued_at only, with no validity window, so there are no expired or not-yet-valid cases.",
            "Issuer binding: SPEC draft 0.2 does not require the issuer field to equal the DID in signature.kid, so no case tests it. A later draft should.",
        ],
        "test_keys": {
            "note": "Deterministic TEST keys (seed = sha256(\"csoai signed-receipts/v1 conformance test key: \" + label)). They sign nothing but these vectors.",
            "issuer": {"did": ISSUER, "kid": KID, "ed25519_seed_hex": ISSUER_SEED, "public_key_hex": pub_hex(ISSUER_KEY)},
            "attacker": {"ed25519_seed_hex": ATTACKER_SEED, "public_key_hex": pub_hex(ATTACKER_KEY)},
        },
        "candidate_output_format": {"results": {"<case id>": "VALID | INVALID | UNVERIFIABLE_KEY"}},
        "cases": core_cases(),
    }
    inter = interop_cases(a.fractalai_vectors)
    if inter:
        out["interop"] = inter
    sys.stdout.write(json.dumps(out, indent=2, ensure_ascii=False) + "\n")


if __name__ == "__main__":
    main()
