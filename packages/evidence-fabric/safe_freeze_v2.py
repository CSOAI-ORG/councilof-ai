# SPDX-License-Identifier: Apache-2.0
"""Version 2 external signature consumer for the retained SAFE freeze.
Reads public bytes only. Does not edit the pack, execute its code, resolve a DID,
or establish issuer authentication, admission, anchoring or claim truth.
"""
import argparse
import base64
import hashlib
import json
import re
from pathlib import Path

VERSION = "2"
LEGACY_SIGNER = "did:web:csoai.org#board-attestation-1 via POST /api/board-sign (pod caller token)"
SUPPORTED_SIGNERS = {LEGACY_SIGNER: "did:web:csoai.org#board-attestation-1"}
CANONICAL = "JSON, keys sorted, no whitespace, UTF-8, non-ASCII unescaped"


def _unique_object(pairs):
    obj = {}
    for key, value in pairs:
        if key in obj:
            raise ValueError("duplicate JSON object key")
        obj[key] = value
    return obj


def _json(raw):
    return json.loads(raw, object_pairs_hook=_unique_object,
                      parse_constant=lambda value: (_ for _ in ()).throw(ValueError("non-finite JSON number")))


def _canon(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False, allow_nan=False).encode()


def _sha(raw):
    return hashlib.sha256(raw).hexdigest()


def check_signature(freeze_raw, signed_raw=None, did_raw=None):
    """(True|False|None, reason). True is supplied-key consistency, never issuer authentication."""
    if signed_raw is None:
        return None, "NOT_PRESENT (signature not supplied)"
    if did_raw is None:
        return None, "NOT_PRESENT (DID document not supplied)"
    try:
        signed, freeze, did = _json(signed_raw), _json(freeze_raw), _json(did_raw)
        if not all(isinstance(obj, dict) for obj in (signed, freeze, did)):
            return False, "signature inputs must be JSON objects"
        pay, sg = signed.get("payload"), signed.get("signature")
        if not isinstance(pay, dict) or not isinstance(sg, dict):
            return False, "missing payload or signature object"
        if signed.get("schema") != "csoai.signed-run/0.1" or pay.get("schema") != "csoai.signed-artifact/0.1":
            return False, "unsupported signed family"
        if freeze.get("schema") != "csoai.safe-evidence-pack/0.1":
            return False, "unsupported SAFE freeze family"
        if _sha(_canon(pay)) != sg.get("payload_sha256"):
            return False, "payload digest differs"
        artifact = pay.get("artifact")
        if not isinstance(artifact, dict) or artifact.get("sha256") != _sha(freeze_raw):
            return False, "signature does not cover FREEZE.json bytes"
        kid = SUPPORTED_SIGNERS.get(pay.get("signer")) if isinstance(pay.get("signer"), str) else None
        if kid is None or sg.get("did") != kid:
            return False, "full signature method differs from the supported signed signer"
        issuer = kid.split("#", 1)[0]
        if did.get("id") != issuer:
            return False, "DID document identity differs from the signed signer"
        if sg.get("alg") != "Ed25519" or sg.get("canonical") != CANONICAL:
            return False, "unsupported signature algorithm or canonicalization"
        methods = did.get("verificationMethod")
        if not isinstance(methods, list) or any(not isinstance(m, dict) for m in methods):
            return False, "verification methods are malformed"
        selected = [m for m in methods if m.get("id") == kid]
        if len(selected) != 1:
            return False, "full verification method is missing or ambiguous"
        method = selected[0]
        if method.get("controller") != issuer or method.get("type") != "JsonWebKey2020":
            return False, "unsupported method controller or key representation"
        assertions = did.get("assertionMethod")
        # This retained family uses full-ID string references, not embedded methods.
        if not isinstance(assertions, list) or any(not isinstance(a, str) for a in assertions) or assertions.count(kid) != 1:
            return False, "selected method is not uniquely authorized for assertion"
        jwk = method.get("publicKeyJwk")
        if not isinstance(jwk, dict) or jwk.get("kty") != "OKP" or jwk.get("crv") != "Ed25519":
            return False, "selected key is not an Ed25519 public JWK"
        if "d" in jwk or ("use" in jwk and jwk["use"] != "sig"):
            return False, "public verification key has unsupported private or use metadata"
        if "alg" in jwk and jwk["alg"] not in ("EdDSA", "Ed25519"):
            return False, "unsupported public key algorithm declaration"
        x = jwk.get("x")
        sig = sg.get("sig_ed25519")
        if not isinstance(x, str) or not re.fullmatch(r"[A-Za-z0-9_-]{43}", x):
            return False, "public key encoding is invalid"
        if not isinstance(sig, str) or not re.fullmatch(r"[0-9a-fA-F]{128}", sig):
            return False, "signature encoding is invalid"
        raw_key = base64.b64decode(x + "=", altchars=b"-_", validate=True)
        if len(raw_key) != 32:
            return False, "public key length is invalid"
    except (ValueError, TypeError, KeyError, UnicodeError, RecursionError) as ex:
        return False, "malformed signature input: " + type(ex).__name__
    try:
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
    except ImportError:
        return None, "UNCHECKABLE (cryptography not available)"
    try:
        Ed25519PublicKey.from_public_bytes(raw_key).verify(bytes.fromhex(sig), _canon(pay))
    except Exception:
        return False, "Ed25519 signature does not verify"
    return True, "SELF_CONSISTENT_UNAUTHENTICATED_KEY (signature covers the freeze under the supplied DID key)"


def _optional_bytes(path):
    if path is None:
        return None
    try:
        return Path(path).read_bytes()
    except FileNotFoundError:
        return None


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("freeze")
    parser.add_argument("--signed")
    parser.add_argument("--did")
    args = parser.parse_args(argv)
    try:
        freeze = Path(args.freeze).read_bytes()
        signed = _optional_bytes(args.signed)
        did = _optional_bytes(args.did)
    except OSError as ex:
        print(json.dumps({"signature_valid": None, "issuer_authenticated": None,
                          "reason": "input unavailable: " + type(ex).__name__}))
        return 2
    ok, reason = check_signature(freeze, signed, did)
    print(json.dumps({"verifier_version": VERSION, "signature_valid": ok,
                      "issuer_authenticated": None, "reason": reason,
                      "scope": "SAFE freeze signature only; no sums, schema, derivation, OTS or admission check"}))
    return 0 if ok is True else 1 if ok is False else 3


if __name__ == "__main__":
    raise SystemExit(main())
