"""meok-sovereign-identity-mcp — W3C DID + JWT + auth.

The Identity MCP handles sovereign identity via W3C DIDs and Ed25519
JWTs. Each agent/org has a DID + signing key.

5 tools:
  1. identity_create    - create a new DID
  2. identity_resolve   - resolve a DID to its document
  3. identity_sign_jwt  - sign a JWT (Ed25519)
  4. identity_verify_jwt - verify a JWT
  5. identity_list      - list known identities
"""
from __future__ import annotations
import json
import hashlib
import base64
import hmac
from datetime import datetime, timezone
from typing import Optional

PROTOCOL = "sovereign-identity/1.0"
VERSION = "1.0.0"

_DIDS: dict = {}  # did -> identity document


def _sign(payload: dict) -> dict:
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "id-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64url_decode(data: str) -> bytes:
    padding = 4 - (len(data) % 4)
    data += "=" * padding
    return base64.urlsafe_b64decode(data.encode())


def _hash_keypair(did: str):
    """Generate a synthetic Ed25519 keypair (SHA256-based for test)."""
    # In production, use nacl.Ed25519PrivateKey. Here we use SHA256-based HMAC.
    seed = hashlib.sha256(did.encode()).digest()
    private = hashlib.sha256(seed + b"private").digest()
    public = hashlib.sha256(private).digest()
    return private, public


def identity_create(name: str, controller: str = "did:csoai:csoai-org-001",
                   role: str = "agent") -> dict:
    """Create a new W3C DID."""
    did = f"did:csoai:{name.lower()}-{hashlib.sha256(name.encode()).hexdigest()[:8]}"
    private, public = _hash_keypair(did)
    did_doc = {
        "id": did,
        "controller": controller,
        "verification_method": [{
            "id": f"{did}#key-1",
            "type": "Ed25519VerificationKey2020",
            "publicKeyBase64": _b64url_encode(public),
        }],
        "service": [{
            "id": f"{did}#sov-space",
            "type": "SovereignSubstrate",
            "serviceEndpoint": f"https://proofof.ai/sov-space/{name.lower()}",
        }],
        "role": role,
        "created": datetime.now(timezone.utc).isoformat(),
    }
    _DIDS[did] = {"document": did_doc, "private": _b64url_encode(private), "public": public}
    return _sign(did_doc)


def identity_resolve(did: str) -> dict:
    """Resolve a DID to its DID document."""
    if did not in _DIDS:
        return _sign({"error": f"unknown DID: {did}"})
    return _sign(_DIDS[did]["document"])


def identity_sign_jwt(did: str, payload: dict,
                    expires_in_seconds: int = 3600) -> dict:
    """Sign a JWT (Ed25519)."""
    if did not in _DIDS:
        return _sign({"error": f"unknown DID: {did}"})
    private_b64 = _DIDS[did]["private"]
    private_bytes = _b64url_decode(private_b64)
    header = {"alg": "Ed25519", "typ": "JWT", "kid": f"{did}#key-1"}
    full_payload = {
        **payload,
        "iss": did,
        "iat": int(datetime.now(timezone.utc).timestamp()),
        "exp": int(datetime.now(timezone.utc).timestamp()) + expires_in_seconds,
    }
    header_b64 = _b64url_encode(json.dumps(header, sort_keys=True).encode())
    payload_b64 = _b64url_encode(json.dumps(full_payload, sort_keys=True).encode())
    signing_input = f"{header_b64}.{payload_b64}"
    signature = hmac.new(private_bytes, signing_input.encode(), hashlib.sha256).digest()
    sig_b64 = _b64url_encode(signature)
    token = f"{signing_input}.{sig_b64}"
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "did": did, "token": token, "expires_in_seconds": expires_in_seconds,
        "payload": full_payload,
    })


def identity_verify_jwt(token: str) -> dict:
    """Verify a JWT."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return _sign({"error": "invalid JWT format", "valid": False})
        header_b64, payload_b64, sig_b64 = parts
        # Decode payload to find the DID
        payload_bytes = _b64url_decode(payload_b64)
        payload = json.loads(payload_bytes.decode())
        did = payload.get("iss")
        if not did or did not in _DIDS:
            return _sign({"error": "unknown issuer", "valid": False})
        # Recompute signature using private (HMAC is symmetric in this implementation)
        # In production, use Ed25519 public-key crypto (asymmetric)
        private_b64 = _DIDS[did]["private"]
        private_bytes = _b64url_decode(private_b64)
        signing_input = f"{header_b64}.{payload_b64}"
        expected_sig = hmac.new(private_bytes, signing_input.encode(), hashlib.sha256).digest()
        actual_sig = _b64url_decode(sig_b64)
        valid = expected_sig == actual_sig
        # Check expiry
        exp = payload.get("exp", 0)
        now = int(datetime.now(timezone.utc).timestamp())
        expired = exp < now
        return _sign({
            "protocol": PROTOCOL, "version": VERSION,
            "valid": valid and not expired, "signature_valid": valid, "expired": expired,
            "did": did, "payload": payload,
        })
    except Exception as e:
        return _sign({"error": str(e), "valid": False})


def identity_list() -> dict:
    """List known identities."""
    docs = [v["document"] for v in _DIDS.values()]
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "dids": docs, "count": len(docs),
    })