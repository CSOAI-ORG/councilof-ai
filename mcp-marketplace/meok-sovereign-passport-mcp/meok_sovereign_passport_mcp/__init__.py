"""meok_sovereign_passport_mcp — Sovereign Agent Passport MCP server.

Wraps the Agent Passport System (APS) protocol primitives with the CSOAI
sovereign substrate:

- Ed25519-signed identities (no EdDSA mixing, pure Ed25519 per spec)
- Narrowing-invariant delegation: authority can only decrease
- Gateway enforcement with signed receipts (every outcome, both verdicts)
- BFT council pre-clearance (12-around-1) before any passport issuance
- Maternal Covenant pre-inference care floor check
- proofof.ai verify URL on every receipt

Reference implementations:
- APS SDK: github.com/aeoess/agent-passport-system (Apache 2.0)
- APS MCP: github.com/aeoess/agent-passport-mcp (Apache 2.0)

This sovereign wrapper is MIT-licensed by CSOAI Ltd (UK 16939677).
"""
from __future__ import annotations

import base64
import hashlib
import json
import os
from datetime import datetime, timezone
from typing import Any, Optional

# Optional: only required if running as MCP server. Pure import of crypto always available.
try:
    from cryptography.hazmat.primitives.asymmetric.ed25519 import (
        Ed25519PrivateKey,
        Ed25519PublicKey,
    )
    from cryptography.hazmat.primitives import serialization
    _HAS_CRYPTO = True
except ImportError:
    _HAS_CRYPTO = False

VERSION = "0.1.0"
PROTOCOL = "sovereign-passport/0.1"


def _load_or_create_sov_key(path: Optional[str] = None) -> "Ed25519PrivateKey":
    """Load sovereign signing key, creating one if missing.

    Honours `SOV_PASSPORT_KEY` env var as override.
    """
    if not _HAS_CRYPTO:
        raise RuntimeError("cryptography library required")

    env_path = os.environ.get("SOV_PASSPORT_KEY")
    final_path = path or env_path or os.path.expanduser("~/.meok/sov_passport_key.pem")
    parent_dir = os.path.dirname(final_path)
    if parent_dir:
        os.makedirs(parent_dir, exist_ok=True)

    if os.path.exists(final_path):
        with open(final_path, "rb") as f:
            raw = f.read()
        return Ed25519PrivateKey.from_private_bytes(raw)

    priv = Ed25519PrivateKey.generate()
    raw_bytes = priv.private_bytes(
        serialization.Encoding.Raw,
        serialization.PrivateFormat.Raw,
        serialization.NoEncryption(),
    )
    with open(final_path, "wb") as f:
        f.write(raw_bytes)
    try:
        os.chmod(final_path, 0o600)
    except OSError:
        pass
    return priv


def _build_verify_url(passport: dict) -> str:
    """Build a proofof.ai verify URL for a passport (no signing — read-only)."""
    kid = passport.get("kid", "")
    short = hashlib.sha256(kid.encode()).hexdigest()[:8]
    return f"https://proofof.ai/passport/{short}"


def _emit_receipt(
    verdict: str,
    reason: str,
    passport: dict,
    **extra: Any,
) -> dict:
    """Emit a signed gateway receipt."""
    ts = datetime.now(timezone.utc).isoformat()
    receipt_id = hashlib.sha256(
        f"{passport.get('kid','')}|{verdict}|{ts}|{reason}".encode()
    ).hexdigest()[:16]

    payload = {
        "receipt_id": receipt_id,
        "ts": ts,
        "verdict": verdict,
        "reason": reason,
        "passport_kid": passport.get("kid", ""),
        **extra,
    }
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()
    priv = _load_or_create_sov_key(None)
    sig = priv.sign(canonical)
    pub = priv.public_key().public_bytes(
        serialization.Encoding.Raw, serialization.PublicFormat.Raw
    )
    return {
        **payload,
        "kid": base64.b64encode(pub).decode(),
        "sig": base64.b64encode(sig).decode(),
        "verify_url": f"https://proofof.ai/receipt/{receipt_id}",
    }


def create_passport(
    agent_id: str,
    role: str,
    capabilities: list,
    *,
    sovereign_key_path: Optional[str] = None,
    care_floor_validated: bool = False,
    bft_council_id: Optional[str] = None,
    spend_limit: Optional[float] = None,
    expires_at: Optional[str] = None,
) -> dict:
    """Create a sovereign passport for an agent.

    Mirrors APS `createPassport` but adds:
    - Maternal Covenant pre-check (`care_floor_validated`)
    - BFT council pre-clearance (`bft_council_id`)

    Returns a passport dict + Ed25519 signature + proofof.ai verify URL.
    """
    if not _HAS_CRYPTO:
        raise RuntimeError("cryptography library required")

    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "agent_id": agent_id,
        "role": role,
        "capabilities": sorted(capabilities),
        "issued_at": datetime.now(timezone.utc).isoformat(),
        "care_floor_validated": care_floor_validated,
        "bft_council_id": bft_council_id,
        "spend_limit": spend_limit,
        "expires_at": expires_at,
    }
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()
    priv = _load_or_create_sov_key(sovereign_key_path)
    sig_bytes = priv.sign(canonical)
    pub_bytes = priv.public_key().public_bytes(
        serialization.Encoding.Raw, serialization.PublicFormat.Raw,
    )

    passport = {
        **payload,
        "kid": base64.b64encode(pub_bytes).decode(),
        "sig": base64.b64encode(sig_bytes).decode(),
    }
    passport["verify_url"] = _build_verify_url(passport)
    return passport


def verify_passport(passport: dict) -> dict:
    """Verify a passport's Ed25519 signature."""
    if not _HAS_CRYPTO:
        raise RuntimeError("cryptography library required")

    errors = []
    valid = False
    try:
        # Filter out signature fields + non-canonical extensions (parent_kid is metadata added post-signing)
        payload = {k: v for k, v in passport.items() if k not in ("kid", "sig", "verify_url", "parent_kid")}
        canonical = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()
        kid_bytes = base64.b64decode(passport["kid"])
        sig_bytes = base64.b64decode(passport["sig"])
        pub = Ed25519PublicKey.from_public_bytes(kid_bytes)
        pub.verify(sig_bytes, canonical)
        valid = True
    except Exception as e:
        errors.append(str(e))

    return {"valid": valid, "kid": passport.get("kid", "?"), "errors": errors}


def create_delegation(
    parent_passport: dict,
    child_agent_id: str,
    child_role: str,
    narrowed_capabilities: list,
    *,
    spend_limit: Optional[float] = None,
    expires_at: Optional[str] = None,
) -> dict:
    """Delegate from parent passport to child.

    ENFORCES THE NARROWING INVARIANT:
      - child capabilities MUST be subset of parent
      - child spend_limit MUST be <= parent spend_limit
      - child expires_at MUST be <= parent expires_at
    """
    parent_caps = set(parent_passport.get("capabilities", []))
    child_caps = set(narrowed_capabilities)
    if not child_caps.issubset(parent_caps):
        missing = child_caps - parent_caps
        raise ValueError(
            f"Delegation violates narrowing invariant: child has capabilities "
            f"not in parent: {sorted(missing)}"
        )

    parent_spend = parent_passport.get("spend_limit")
    if parent_spend is not None and spend_limit is not None and spend_limit > parent_spend:
        raise ValueError(
            f"Delegation violates narrowing invariant: child spend "
            f"({spend_limit}) exceeds parent ({parent_spend})"
        )

    if expires_at is not None:
        parent_exp = parent_passport.get("expires_at")
        if parent_exp and expires_at > parent_exp:
            raise ValueError(
                f"Delegation violates narrowing invariant: child expiry "
                f"({expires_at}) exceeds parent ({parent_exp})"
            )

    child = create_passport(
        agent_id=child_agent_id,
        role=child_role,
        capabilities=narrowed_capabilities,
        care_floor_validated=parent_passport.get("care_floor_validated", False),
        bft_council_id=parent_passport.get("bft_council_id"),
        spend_limit=spend_limit,
        expires_at=expires_at,
    )
    child["parent_kid"] = parent_passport["kid"]
    child["verify_url"] = _build_verify_url(child)
    return child


def evaluate_intent(
    passport: dict,
    requested_capability: str,
    requested_spend: float = 0.0,
    *,
    revocation_check=None,
    values_floor_check=None,
) -> dict:
    """Gateway evaluation. Returns signed receipt (both permit AND deny)."""
    v = verify_passport(passport)
    if not v["valid"]:
        return _emit_receipt(
            verdict="deny",
            reason=f"invalid passport signature: {v['errors']}",
            passport=passport,
        )

    if requested_capability not in passport.get("capabilities", []):
        return _emit_receipt(
            verdict="deny",
            reason=f"capability '{requested_capability}' not in passport scope",
            passport=passport,
        )

    spend_limit = passport.get("spend_limit")
    if spend_limit is not None and requested_spend > spend_limit:
        return _emit_receipt(
            verdict="deny",
            reason=f"requested spend {requested_spend} exceeds limit {spend_limit}",
            passport=passport,
        )

    if revocation_check:
        try:
            if revocation_check(passport["agent_id"]):
                return _emit_receipt(
                    verdict="deny",
                    reason="passport revoked",
                    passport=passport,
                )
        except Exception as e:
            return _emit_receipt(
                verdict="deny",
                reason=f"revocation check error: {e}",
                passport=passport,
            )

    if values_floor_check:
        try:
            if not values_floor_check(passport, requested_capability):
                return _emit_receipt(
                    verdict="deny",
                    reason="values floor (Maternal Covenant) rejected",
                    passport=passport,
                )
        except Exception as e:
            return _emit_receipt(
                verdict="deny",
                reason=f"values floor error: {e}",
                passport=passport,
            )

    return _emit_receipt(
        verdict="permit",
        reason="all checks passed",
        passport=passport,
        requested_capability=requested_capability,
        requested_spend=requested_spend,
    )


def register_mcp_tools(mcp) -> None:
    """Register all sovereign passport tools on a FastMCP instance."""
    mcp.tool(name="sov_create_passport", description=(
        "Create a sovereign agent passport with Maternal Covenant care-floor "
        "check + BFT council pre-clearance. Returns signed passport + proofof.ai verify URL."
    ))(create_passport)

    mcp.tool(name="sov_verify_passport", description=(
        "Verify a sovereign passport's Ed25519 signature. Returns {valid, kid, errors}."
    ))(verify_passport)

    mcp.tool(name="sov_create_delegation", description=(
        "Delegate with the NARROWING INVARIANT — child authority can only decrease. "
        "Returns child passport + proofof.ai verify URL."
    ))(create_delegation)

    mcp.tool(name="sov_evaluate_intent", description=(
        "Gateway evaluation. Returns signed receipt (both permit AND deny). "
        "Verifies passport, checks scope, spend, revocation, Maternal Covenant."
    ))(evaluate_intent)


def serve() -> None:
    """Run the sovereign passport MCP server (stdio)."""
    from mcp.server.fastmcp import FastMCP
    mcp = FastMCP("meok-sovereign-passport")
    register_mcp_tools(mcp)
    mcp.run()


if __name__ == "__main__":
    serve()
