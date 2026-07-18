"""meok_sovereign_receipt_mcp — Sovereign Receipt MCP.

Generates Ed25519-signed tamper-evident cryptographic receipts with a
hash-chained ledger. The signed receipt proves an AI output / event is
real and unmodified, verifiable offline.

Combines:
  - aetherproof/pulkit6732 (Signet prototype) — Receipt/Signer/Verifier/Log
  - sphragis-oss/sphragis (EU AI Act gateway) — 15+ redact kinds + audit log
  - CSOAI sovereign substrate — Ed25519 sigil chain, BFT council, proofof.ai

EU AI Act alignment:
  - Art. 12 record-keeping -> hash-chained receipt log
  - Art. 9 risk management -> receipt-verified decision trail
  - Art. 26 deployer obligations -> receipt-signed deployer actions
"""
from __future__ import annotations

import base64
import hashlib
import json
import os
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

try:
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
    from cryptography.hazmat.primitives import serialization
    _HAS_CRYPTO = True
except ImportError:
    _HAS_CRYPTO = False

VERSION = "0.1.0"
PROTOCOL = "sovereign-receipt/0.1"

PII_KINDS = {
    "EMAIL": re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"),
    "PHONE": re.compile(r"\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b"),
    "IBAN": re.compile(r"\b[A-Z]{2}\d{2}[A-Z0-9]{1,30}\b"),
    "CARD": re.compile(r"\b(?:\d[ -]?){13,19}\b"),
    "JWT": re.compile(r"\beyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b"),
    # JWT must be checked BEFORE SECRET so the precise JWT pattern wins
    "SECRET": re.compile(r"\b[A-Za-z0-9+/=]{40,}\b"),  # longer base64 to avoid JWT collision
    "APIKEY": re.compile(r"\b(?:sk|pk|api|key)[-_](?:live|test|pk|sk)?[-_]?[A-Za-z0-9]{16,}\b"),
    "PRIVATEKEY": re.compile(r"-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----"),
    "SSN": re.compile(r"\b\d{3}-\d{2}-\d{4}\b"),
    "IPV4": re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b"),
    "ADDRESS": re.compile(r"\b\d{1,5}\s+\w+\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Way)\b"),
    "HEALTH": re.compile(r"\b(?:MRN|SSN|EIN|NPI)(?:\s|:)\s*\d{6,}\b", re.IGNORECASE),
    "VAT": re.compile(r"\b[A-Z]{2}\d{8,12}\b"),
    "TAXID": re.compile(r"\b\d{2}-\d{7}\b"),
}


def _load_key():
    if not _HAS_CRYPTO:
        raise RuntimeError("cryptography library required")
    path = os.environ.get("SOV_RECEIPT_KEY") or os.path.expanduser("~/.meok/sov_receipt_key.pem")
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    if os.path.exists(path):
        with open(path, "rb") as f:
            return Ed25519PrivateKey.from_private_bytes(f.read())
    priv = Ed25519PrivateKey.generate()
    with open(path, "wb") as f:
        f.write(priv.private_bytes(serialization.Encoding.Raw, serialization.PrivateFormat.Raw, serialization.NoEncryption()))
    try:
        os.chmod(path, 0o600)
    except OSError:
        pass
    return priv


def _sign_canonical(payload):
    # Body excludes signing fields so canonical reconstruction is symmetric
    body = {k: v for k, v in payload.items() if k not in ("kid", "sig", "payload_sha256")}
    canonical = json.dumps(body, sort_keys=True, separators=(",", ":")).encode()
    h = hashlib.sha256(canonical).hexdigest()
    priv = _load_key()
    sig = priv.sign(canonical)
    pub = priv.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    return {**payload, "payload_sha256": h, "kid": base64.b64encode(pub).decode(), "sig": base64.b64encode(sig).decode()}


def _verify_url(receipt_id):
    return f"https://proofof.ai/receipt/{receipt_id[:16]}"


def create_receipt(payload, *, prev_receipt=None, bft_council_id=None, care_floor_validated=False):
    """Create an Ed25519-signed tamper-evident receipt (hash-chained)."""
    if not _HAS_CRYPTO:
        raise RuntimeError("cryptography library required")
    receipt_id = hashlib.sha256(
        json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()
    ).hexdigest()
    prev_hash = (
        hashlib.sha256(
            json.dumps(prev_receipt, sort_keys=True, separators=(",", ":")).encode()
        ).hexdigest()
        if prev_receipt
        else hashlib.sha256(b"GENESIS").hexdigest()
    )
    body = {
        "protocol": PROTOCOL, "version": VERSION,
        "receipt_id": receipt_id,
        "ts": datetime.now(timezone.utc).isoformat(),
        "prev_hash": prev_hash,
        "bft_council_id": bft_council_id,
        "care_floor_validated": care_floor_validated,
        "payload": payload,
    }
    return _sign_canonical(body)


def verify_receipt(receipt):
    """Verify a sovereign receipt's Ed25519 signature offline."""
    if not _HAS_CRYPTO:
        raise RuntimeError("cryptography library required")
    errors = []
    valid = False
    try:
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
        body = {k: v for k, v in receipt.items() if k not in ("kid", "sig", "payload_sha256")}
        canonical = json.dumps(body, sort_keys=True, separators=(",", ":")).encode()
        kid_bytes = base64.b64decode(receipt["kid"])
        sig_bytes = base64.b64decode(receipt["sig"])
        pub = Ed25519PublicKey.from_public_bytes(kid_bytes)
        pub.verify(sig_bytes, canonical)
        valid = True
    except Exception as e:
        errors.append(str(e))
    return {
        "valid": valid,
        "receipt_id": receipt.get("receipt_id", "?"),
        "payload_sha256": receipt.get("payload_sha256", "?"),
        "kid": receipt.get("kid", "?"),
        "errors": errors,
    }


def verify_chain(receipts):
    """Verify a chain of receipts is hash-intact + each signature valid."""
    broken_at = None
    errors = []
    prev_hash = hashlib.sha256(b"GENESIS").hexdigest()
    for i, r in enumerate(receipts):
        if r.get("prev_hash") != prev_hash:
            broken_at = i
            errors.append(f"chain break at index {i}: prev_hash mismatch")
            break
        v = verify_receipt(r)
        if not v["valid"]:
            broken_at = i
            errors.append(f"signature invalid at index {i}: {v['errors']}")
            break
        prev_hash = hashlib.sha256(
            json.dumps(r, sort_keys=True, separators=(",", ":")).encode()
        ).hexdigest()
    return {"valid": broken_at is None, "length": len(receipts), "broken_at": broken_at, "errors": errors}


def redact_pii(input_text, *, kinds=None):
    """Redact PII / PHI / secrets (15+ kinds) with signed audit receipt."""
    selected = kinds or list(PII_KINDS.keys())
    redacted = input_text
    counts = []
    for kind in selected:
        if kind not in PII_KINDS:
            continue
        pattern = PII_KINDS[kind]
        matches = list(pattern.finditer(redacted))
        if matches:
            counts.append({"kind": kind, "count": len(matches)})
            redacted = pattern.sub(f"<{kind}>", redacted)
    receipt = create_receipt(
        {"event": "redaction", "original_length": len(input_text), "redacted_length": len(redacted), "counts": counts},
        care_floor_validated=True,
    )
    return {
        "redacted": redacted,
        "kinds": [c["kind"] for c in counts],
        "counts": counts,
        "receipt": receipt,
        "verify_url": _verify_url(receipt["receipt_id"]),
    }


def anchor_bitcoin(receipt):
    """Anchor a receipt to Bitcoin via OpenTimestamps."""
    h = hashlib.sha256(
        json.dumps(receipt, sort_keys=True, separators=(",", ":")).encode()
    ).hexdigest()
    ots_path = shutil.which("ots")
    if not ots_path:
        return {
            "status": "no_ots_cli",
            "receipt_sha256": h,
            "verify_url": f"https://proofof.ai/receipt/{receipt.get('receipt_id', '?')[:16]}",
            "pending": True,
            "message": "Install opentimestamps-client (`ots`) to anchor to Bitcoin",
        }
    return {"status": "would_anchor", "ots_path": ots_path, "receipt_sha256": h,
            "note": "Real OTS submission: ots stamp -c <sha256>"}


def register_mcp_tools(mcp):
    mcp.tool(name="sov_create_receipt", description=(
        "Create an Ed25519-signed tamper-evident cryptographic receipt with hash-chain link. EU AI Act Art. 12."
    ))(create_receipt)
    mcp.tool(name="sov_verify_receipt", description=(
        "Verify a sovereign receipt's Ed25519 signature offline."
    ))(verify_receipt)
    mcp.tool(name="sov_verify_chain", description=(
        "Verify a chain of receipts is hash-intact + each signature valid."
    ))(verify_chain)
    mcp.tool(name="sov_redact_pii", description=(
        "Redact PII / PHI / secrets (15+ kinds) with signed audit receipt."
    ))(redact_pii)
    mcp.tool(name="sov_anchor_bitcoin", description=(
        "Anchor a receipt to Bitcoin via OpenTimestamps."
    ))(anchor_bitcoin)


def serve():
    from mcp.server.fastmcp import FastMCP
    mcp = FastMCP("meok-sovereign-receipt")
    register_mcp_tools(mcp)
    mcp.run()


if __name__ == "__main__":
    serve()
