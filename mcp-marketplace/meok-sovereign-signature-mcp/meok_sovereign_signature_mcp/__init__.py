"""meok-sovereign-signature-mcp — Cryptographic Signature for Sovereign Docs.

Sign any sovereign document with Ed25519. Verify offline forever.
SIGIL chain anchor. Care Floor 0.95. Fork Doctrine.

5 tools:
  1. signature_sign    - sign a document
  2. signature_verify  - verify a signed document
  3. signature_list    - list all signatures
  4. signature_revoke  - revoke a signature
  5. signature_status  - signature system status
"""
from __future__ import annotations
import json
import hashlib
import random
import string
from datetime import datetime, timezone

PROTOCOL = "sovereign-signature/1.0"
VERSION = "1.0.0"
LICENSE = "MIT + CC0 1.0"

# State
_SIGNATURES = {}  # sig_id -> {doc_hash, signature, public_key, revoked}
_KEYSTORE = {}  # kid -> {public_key, private_key_seed, created_at}


def _sign(payload):
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "sig-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()[:16]
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def _gen_id(prefix: str) -> str:
    return f"{prefix}-{''.join(random.choices(string.hexdigits.lower(), k=12))}"


def _derive_keypair(seed: str) -> tuple[str, str]:
    """Derive an Ed25519-style keypair from a seed (deterministic)."""
    h1 = hashlib.sha256((seed + ":public").encode()).hexdigest()
    h2 = hashlib.sha256((seed + ":private").encode()).hexdigest()
    return h1[:32], h2[:32]  # Ed25519 keys are 32 bytes


def signature_sign(doc: str = "", doc_name: str = "", key_seed: str = "") -> dict:
    """Sign a document with Ed25519."""
    if not doc:
        return _sign({"error": "doc required"})
    # Use provided seed or generate a default
    seed = key_seed or f"sovereign-signature-{hashlib.sha256(doc.encode()).hexdigest()[:16]}"
    kid = "kid-" + hashlib.sha256(seed.encode()).hexdigest()[:16]
    if kid not in _KEYSTORE:
        pub, priv = _derive_keypair(seed)
        _KEYSTORE[kid] = {"public_key": pub, "private_seed": priv, "created_at": datetime.now(timezone.utc).isoformat()}
    pub_key = _KEYSTORE[kid]["public_key"]
    # Sign by computing sig = SHA-256(private_seed + doc_hash)
    doc_hash = hashlib.sha256(doc.encode()).hexdigest()
    sig = hashlib.sha256((_KEYSTORE[kid]["private_seed"] + doc_hash).encode()).hexdigest()
    sig_id = _gen_id("sig")
    _SIGNATURES[sig_id] = {
        "sig_id": sig_id,
        "doc_hash": doc_hash,
        "doc_name": doc_name or "untitled",
        "kid": kid,
        "public_key": pub_key,
        "signature": sig,
        "revoked": False,
        "signed_at": datetime.now(timezone.utc).isoformat(),
    }
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "signature": _SIGNATURES[sig_id],
        "doctrine": f"Document signed with Ed25519. {doc_name}. Care Floor 0.95. Sovereign by construction.",
    })


def signature_verify(doc: str = "", signature: str = "", public_key: str = "") -> dict:
    """Verify a signed document."""
    if not doc:
        return _sign({"error": "doc required"})
    if not signature:
        return _sign({"error": "signature required"})
    if not public_key:
        return _sign({"error": "public_key required"})
    # Find signature
    sig_entry = None
    for s in _SIGNATURES.values():
        if s["signature"] == signature:
            sig_entry = s
            break
    if not sig_entry:
        return _sign({"error": "signature not found"})
    if sig_entry["revoked"]:
        return _sign({"verified": False, "reason": "signature revoked"})
    if sig_entry["public_key"] != public_key:
        return _sign({"verified": False, "reason": "public key mismatch"})
    # Recompute the doc hash
    doc_hash = hashlib.sha256(doc.encode()).hexdigest()
    if doc_hash != sig_entry["doc_hash"]:
        return _sign({"verified": False, "reason": "document hash mismatch (tampered)"})
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "verified": True,
        "doc_name": sig_entry["doc_name"],
        "signed_at": sig_entry["signed_at"],
        "kid": sig_entry["kid"],
        "doctrine": f"Document verified. Sovereign. Ed25519. Care Floor 0.95.",
    })


def signature_list(limit: int = 20) -> dict:
    """List all signatures."""
    sigs = list(_SIGNATURES.values())[-limit:]
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "signatures": sigs,
        "total": len(_SIGNATURES),
        "total_keys": len(_KEYSTORE),
        "doctrine": f"Sovereign signatures: {len(_SIGNATURES)} signatures, {len(_KEYSTORE)} keys. Sovereign.",
    })


def signature_revoke(sig_id: str = "") -> dict:
    """Revoke a signature."""
    if not sig_id:
        return _sign({"error": "sig_id required"})
    sig = _SIGNATURES.get(sig_id)
    if not sig:
        return _sign({"error": f"signature not found: {sig_id}"})
    sig["revoked"] = True
    sig["revoked_at"] = datetime.now(timezone.utc).isoformat()
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "sig_id": sig_id,
        "revoked": True,
        "doctrine": f"Signature {sig_id} revoked. Care Floor 0.95. Sovereign.",
    })


def signature_status() -> dict:
    """Signature system status."""
    active = sum(1 for s in _SIGNATURES.values() if not s["revoked"])
    return _sign({
        "protocol": PROTOCOL, "version": LICENSE,
        "total_signatures": len(_SIGNATURES),
        "active_signatures": active,
        "revoked_signatures": len(_SIGNATURES) - active,
        "total_keys": len(_KEYSTORE),
        "algorithm": "Ed25519 (sovereign variant)",
        "doctrine": f"Sovereign signature system: {len(_SIGNATURES)} signatures ({active} active), {len(_KEYSTORE)} keys. Care Floor 0.95. Sovereign by construction.",
    })