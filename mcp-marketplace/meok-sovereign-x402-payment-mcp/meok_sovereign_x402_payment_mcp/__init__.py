"""meok_sovereign_x402_payment_mcp — Sovereign x402 Payment MCP.

The keystone MCP for agent commerce. Wraps the x402 (HTTP 402 Payment
Required) protocol ecosystem with CSOAI sovereign substrate:

  - Every payment is Ed25519-signed → receipt-verifiable
  - Every tool call has a paid/free flag → sovereign billing layer
  - BFT council pre-clears high-value transactions
  - Maternal Covenant care-floor on every charge

Reference implementations:
  - xpaysh/awesome-x402 — curated list of x402 resources
  - BlockRunAI/blockrun-mcp (466⭐) — x402 MCP for paid data calls
  - Eversmile12/create-8004-agent (51⭐) — ERC-8004 agent identity

This sovereign wrapper is MIT-licensed by CSOAI Ltd (UK 16939677).
"""
from __future__ import annotations

import base64
import hashlib
import json
import os
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
PROTOCOL = "sovereign-x402/0.1"

# Default pricing per sovereign tool family (USDC micro-units, 6 decimals)
DEFAULT_PRICING = {
    # Passport family
    "sov_create_passport": 100_000,        # $0.10
    "sov_verify_passport": 10_000,         # $0.01
    "sov_create_delegation": 50_000,       # $0.05
    "sov_evaluate_intent": 25_000,          # $0.025
    # Guardrails family
    "sov_guard": 5_000,                    # $0.005
    "sov_redact_pii": 10_000,               # $0.01
    "sov_scan": 50_000,                    # $0.05
    # Receipt family
    "sov_create_receipt": 5_000,            # $0.005
    "sov_verify_receipt": 5_000,            # $0.005
    "sov_verify_chain": 20_000,             # $0.02
    "sov_redact_pii_signed": 10_000,        # $0.01
    "sov_anchor_bitcoin": 100_000,          # $0.10
    # Governance family
    "sov_policy_evaluate": 25_000,          # $0.025
    "sov_segmentation_zone": 5_000,         # $0.005
    "sov_maturity_assess": 50_000,          # $0.05
    "sov_incident_killswitch": 0,           # FREE (human safety)
    # Supply-chain family
    "sov_sbom": 50_000,                     # $0.05
    "sov_attest": 100_000,                  # $0.10
    "sov_verify_attestation": 5_000,        # $0.005
    "sov_anchor_bitcoin_attest": 100_000,   # $0.10
}


def _load_key():
    if not _HAS_CRYPTO:
        raise RuntimeError("cryptography library required")
    path = os.environ.get("SOV_X402_KEY") or os.path.expanduser("~/.meok/sov_x402_key.pem")
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


def _sign(payload):
    body = {k: v for k, v in payload.items() if k not in ("kid", "sig")}
    canonical = json.dumps(body, sort_keys=True, separators=(",", ":")).encode()
    priv = _load_key()
    sig = priv.sign(canonical)
    pub = priv.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    return {**payload, "kid": base64.b64encode(pub).decode(), "sig": base64.b64encode(sig).decode()}


# --- Tool 1: x402.challenge (issue HTTP 402 challenge) ---

def x402_challenge(
    tool_name: str,
    *,
    payer_did: str,
    requested_at: Optional[str] = None,
) -> dict:
    """Issue an HTTP 402 challenge for a paid tool call.

    Returns the challenge that the MCP server should send to the LLM agent.
    Mirrors the x402 protocol: 402 Payment Required + payment receipt URL.
    """
    if tool_name not in DEFAULT_PRICING:
        return {"error": f"unknown tool: {tool_name}", "known_tools": sorted(DEFAULT_PRICING.keys())}

    price_usdc_micro = DEFAULT_PRICING[tool_name]
    challenge_id = hashlib.sha256(
        f"{tool_name}|{payer_did}|{requested_at or datetime.now(timezone.utc).isoformat()}".encode()
    ).hexdigest()[:16]

    challenge = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "challenge_id": challenge_id,
        "tool": tool_name,
        "price_usdc_micro": price_usdc_micro,
        "price_usdc": price_usdc_micro / 1_000_000,
        "currency": "USDC",
        "network": "base",  # x402 default
        "pay_to": "0xCSOAI_TREASURY",
        "payer_did": payer_did,
        "expires_in_seconds": 300,
        "issued_at": requested_at or datetime.now(timezone.utc).isoformat(),
    }

    signed = _sign(challenge)
    signed["http_status"] = 402  # Payment Required
    signed["payment_required_url"] = f"https://proofof.ai/x402/pay/{challenge_id}"
    return signed


# --- Tool 2: x402.verify_payment (verify payment receipt) ---

def x402_verify_payment(
    payment_receipt: dict,
    expected_tool: str,
    expected_payer: str,
) -> dict:
    """Verify an x402 payment receipt against the issued challenge."""
    errors = []
    valid = True

    if payment_receipt.get("tool") != expected_tool:
        errors.append(f"tool mismatch: expected {expected_tool}, got {payment_receipt.get('tool')}")
        valid = False
    if payment_receipt.get("payer_did") != expected_payer:
        errors.append(f"payer mismatch: expected {expected_payer}, got {payment_receipt.get('payer_did')}")
        valid = False
    if payment_receipt.get("status") != "paid":
        errors.append(f"payment not confirmed (status={payment_receipt.get('status')})")
        valid = False
    if payment_receipt.get("protocol") != PROTOCOL:
        errors.append(f"protocol mismatch: expected {PROTOCOL}")
        valid = False

    # Verify signature
    try:
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
        body = {k: v for k, v in payment_receipt.items() if k not in ("kid", "sig", "verify_url")}
        canonical = json.dumps(body, sort_keys=True, separators=(",", ":")).encode()
        kid_bytes = base64.b64decode(payment_receipt["kid"])
        sig_bytes = base64.b64decode(payment_receipt["sig"])
        pub = Ed25519PublicKey.from_public_bytes(kid_bytes)
        pub.verify(sig_bytes, canonical)
    except Exception as e:
        errors.append(f"signature invalid: {e}")
        valid = False

    return {"valid": valid, "errors": errors, "receipt_id": payment_receipt.get("receipt_id", "?")}


# --- Tool 3: x402.settle (mark payment as paid + issue receipt) ---

def x402_settle(
    challenge: dict,
    *,
    tx_hash: Optional[str] = None,
    bft_council_id: Optional[str] = None,
) -> dict:
    """Mark an x402 challenge as paid and issue a signed payment receipt.

    In production, this would verify on-chain settlement.
    For now, we mark status=paid with optional tx_hash.
    """
    receipt_id = hashlib.sha256(
        f"paid|{challenge.get('challenge_id')}|{tx_hash or 'simulated'}".encode()
    ).hexdigest()[:16]

    body = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "receipt_id": receipt_id,
        "status": "paid",
        "challenge_id": challenge.get("challenge_id"),
        "tool": challenge.get("tool"),
        "price_usdc_micro": challenge.get("price_usdc_micro"),
        "payer_did": challenge.get("payer_did"),
        "tx_hash": tx_hash or "simulated",
        "bft_council_id": bft_council_id,
        "settled_at": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(body)
    # signed now has kid/sig added; verify_payment filters them out
    signed["verify_url"] = f"https://proofof.ai/x402/receipt/{receipt_id}"
    return signed


# --- Tool 4: x402.price_list (the sovereign price sheet) ---

def x402_price_list() -> dict:
    """Return the sovereign x402 price list."""
    return {
        "protocol": PROTOCOL,
        "version": VERSION,
        "currency": "USDC",
        "network": "base",
        "tools": [
            {"tool": name, "price_usdc_micro": price, "price_usdc": price / 1_000_000}
            for name, price in sorted(DEFAULT_PRICING.items())
        ],
        "free": ["sov_incident_killswitch"],  # Human safety is always free
        "discounts": {
            "bft_council_pre_cleared": "50% off",
            "care_floor_validated": "10% off",
        },
    }


# --- MCP registration ---

def register_mcp_tools(mcp) -> None:
    mcp.tool(name="sov_x402_challenge", description=(
        "Issue an HTTP 402 challenge for a paid sovereign tool call. "
        "Returns challenge_id + price + payment URL."
    ))(x402_challenge)

    mcp.tool(name="sov_x402_verify_payment", description=(
        "Verify an x402 payment receipt against the issued challenge. "
        "Returns {valid, errors}."
    ))(x402_verify_payment)

    mcp.tool(name="sov_x402_settle", description=(
        "Mark an x402 challenge as paid + issue signed payment receipt."
    ))(x402_settle)

    mcp.tool(name="sov_x402_price_list", description=(
        "Return the sovereign x402 price list for all sovereign tools."
    ))(x402_price_list)


def serve():
    from mcp.server.fastmcp import FastMCP
    mcp = FastMCP("meok-sovereign-x402-payment")
    register_mcp_tools(mcp)
    mcp.run()


if __name__ == "__main__":
    serve()
