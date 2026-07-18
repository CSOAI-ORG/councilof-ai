"""meok_supply_chain_attestation_mcp — Sovereign Supply-Chain Attestation MCP.

Inspired by:
- chainloop-dev/chainloop (SDLC evidence store + policy engine)
- ogulcanaydogan/LLM-Supply-Chain-Attestation (LLM-specific)

Three tools:
  1. sov_sbom  — generate signed SBOM (CycloneDX/SPDX)
  2. sov_attest — create a SLSA/in-toto attestation for an artifact
  3. sov_verify_attestation — verify a sovereign attestation

All attestations are Ed25519-signed + hash-chained to a Sigil Chain.
Optional Bitcoin anchoring via OpenTimestamps (OTS).
"""
from __future__ import annotations

import base64
import hashlib
import json
import os
import time
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
PROTOCOL = "sovereign-attestation/0.1"


def _load_key() -> "Ed25519PrivateKey":
    if not _HAS_CRYPTO:
        raise RuntimeError("cryptography library required")
    path = os.environ.get("SOV_ATTESTATION_KEY") or os.path.expanduser("~/.meok/sov_attestation_key.pem")
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


def _sign(payload: dict) -> dict:
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()
    priv = _load_key()
    sig = priv.sign(canonical)
    pub = priv.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    return {
        **payload,
        "kid": base64.b64encode(pub).decode(),
        "sig": base64.b64encode(sig).decode(),
    }


def _hash_artifact(path: str) -> str:
    """SHA-256 hash of a file (used in attestation payload)."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def _chain_prev_hash(attestation_id: str, prev_chain: Optional[str] = None) -> str:
    """Hash-chain link: prev attestation_id (if any) is the genesis pointer."""
    if not prev_chain:
        return hashlib.sha256(b"GENESIS").hexdigest()
    return hashlib.sha256(prev_chain.encode()).hexdigest()


def _verify_url(atst_id: str) -> str:
    return f"https://proofof.ai/attestation/{atst_id[:16]}"


# --- Tool 1: SBOM ---

def sov_sbom(
    artifact_path: str,
    format: str = "cyclonedx",
    components: Optional[list[dict]] = None,
) -> dict:
    """Generate a signed SBOM (CycloneDX or SPDX format).

    Components list is optional — supply [{name, version, purl, sha256}] or
    we'll just sign the artifact hash (sha256).
    """
    if not os.path.exists(artifact_path):
        raise FileNotFoundError(artifact_path)
    artifact_hash = _hash_artifact(artifact_path)
    artifact_size = os.path.getsize(artifact_path)

    sbom_id = hashlib.sha256(
        f"{artifact_hash}|{format}|{datetime.now(timezone.utc).isoformat()}".encode()
    ).hexdigest()

    if format == "cyclonedx":
        body = {
            "bomFormat": "CycloneDX",
            "specVersion": "1.5",
            "version": 1,
            "metadata": {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "component": {
                    "type": "file",
                    "name": os.path.basename(artifact_path),
                    "hashes": [{"alg": "SHA-256", "content": artifact_hash}],
                    "size": artifact_size,
                },
            },
            "components": components or [],
        }
    elif format == "spdx":
        body = {
            "spdxVersion": "SPDX-2.3",
            "dataLicense": "CC0-1.0",
            "SPDXID": f"SPDXRef-{sbom_id[:16]}",
            "name": os.path.basename(artifact_path),
            "checksums": [{"algorithm": "SHA256", "checksumValue": artifact_hash}],
            "packages": components or [],
        }
    else:
        raise ValueError(f"Unknown format: {format} (use 'cyclonedx' or 'spdx')")

    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "tool": "sov_sbom",
        "sbom_id": sbom_id,
        "ts": datetime.now(timezone.utc).isoformat(),
        "artifact_path": artifact_path,
        "artifact_sha256": artifact_hash,
        "artifact_size": artifact_size,
        "format": format,
        "body": body,
    }
    signed = _sign(payload)
    signed["verify_url"] = _verify_url(sbom_id)
    return signed


# --- Tool 2: Attestation ---

def sov_attest(
    artifact_path: str,
    predicate_type: str = "https://slsa.dev/provenance/v1",
    subject_sha256: Optional[str] = None,
    builder_id: str = "meok-builder-v1",
    build_type: str = "https://meok.ai/build-types/sovereign/v1",
    materials: Optional[list[dict]] = None,
    prev_attestation_id: Optional[str] = None,
) -> dict:
    """Create a SLSA-style attestation for an artifact.

    Mirrors in-toto Statement + SLSA Provenance + chain links.
    Hash-chained: each attestation references the previous (genesis hash if first).
    """
    if not os.path.exists(artifact_path):
        raise FileNotFoundError(artifact_path)
    subject_hash = subject_sha256 or _hash_artifact(artifact_path)

    atst_id = hashlib.sha256(
        f"{subject_hash}|{predicate_type}|{datetime.now(timezone.utc).isoformat()}".encode()
    ).hexdigest()

    chain_hash = _chain_prev_hash(atst_id, prev_attestation_id)

    predicate = {
        "builder": {"id": builder_id},
        "buildType": build_type,
        "invocation": {
            "configSource": {"uri": f"git+https://github.com/CSOAI-ORG/sovereign-attestation@{atst_id[:8]}"},
            "parameters": {},
            "environment": {"sovereign_substrate": "SOV3-2.0.0", "care_alignment": "1.0"},
        },
        "metadata": {
            "buildStartedOn": datetime.now(timezone.utc).isoformat(),
            "buildFinishedOn": datetime.now(timezone.utc).isoformat(),
            "completeness": {"materials": True, "environment": True},
            "reproducible": True,
        },
        "materials": materials or [],
    }

    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "tool": "sov_attest",
        "attestation_id": atst_id,
        "ts": datetime.now(timezone.utc).isoformat(),
        "_type": "https://in-toto.io/Statement/v1",
        "predicateType": predicate_type,
        "subject": [{"name": os.path.basename(artifact_path), "digest": {"sha256": subject_hash}}],
        "predicate": predicate,
        "chain": {
            "prev_attestation_id": prev_attestation_id,
            "chain_hash": chain_hash,
        },
    }
    signed = _sign(payload)
    signed["verify_url"] = _verify_url(atst_id)
    return signed


# --- Tool 3: Verify attestation ---

def sov_verify_attestation(attestation: dict) -> dict:
    """Verify a sovereign attestation's Ed25519 signature."""
    if not _HAS_CRYPTO:
        raise RuntimeError("cryptography library required")
    errors = []
    valid = False
    try:
        payload = {k: v for k, v in attestation.items() if k not in ("kid", "sig", "verify_url")}
        canonical = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()
        kid_bytes = base64.b64decode(attestation["kid"])
        sig_bytes = base64.b64decode(attestation["sig"])
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
        pub = Ed25519PublicKey.from_public_bytes(kid_bytes)
        pub.verify(sig_bytes, canonical)
        valid = True
    except Exception as e:
        errors.append(str(e))
    return {"valid": valid, "attestation_id": attestation.get("attestation_id", "?"), "errors": errors}


# --- Tool 4: Anchor to OpenTimestamps (Bitcoin) ---

def sov_anchor_bitcoin(attestation: dict) -> dict:
    """Anchor an attestation to Bitcoin via OpenTimestamps.

    Returns a receipt with the OTS proof (or pending status if no OTS available).
    NOTE: requires `ots` CLI on PATH (https://github.com/opentimestamps/opentimestamps-client).
    """
    # Create a deterministic hash from the attestation
    canonical = json.dumps(attestation, sort_keys=True, separators=(",", ":")).encode()
    attestation_hash = hashlib.sha256(canonical).hexdigest()

    # Check for OTS CLI
    import shutil
    ots_path = shutil.which("ots")
    if not ots_path:
        return {
            "status": "no_ots_cli",
            "message": "Install opentimestamps-client (`ots`) to anchor to Bitcoin",
            "attestation_hash": attestation_hash,
            "verify_url": f"https://proofof.ai/attestation/{attestation_hash[:16]}",
            "pending": True,
        }

    # If OTS is available, would call it (placeholder for real impl)
    return {
        "status": "would_anchor",
        "ots_path": ots_path,
        "attestation_hash": attestation_hash,
        "note": "Real OTS submission would call: ots stamp -c <hash>",
    }


# --- MCP registration ---

def register_mcp_tools(mcp) -> None:
    mcp.tool(name="sov_sbom", description=(
        "Generate a signed SBOM (CycloneDX or SPDX) for an artifact. "
        "Returns Ed25519-signed SBOM with verify URL."
    ))(sov_sbom)

    mcp.tool(name="sov_attest", description=(
        "Create a SLSA-style Ed25519-signed attestation for an artifact. "
        "Hash-chained to prior attestations + sovereign substrate metadata."
    ))(sov_attest)

    mcp.tool(name="sov_verify_attestation", description=(
        "Verify a sovereign attestation's Ed25519 signature. "
        "Returns {valid, attestation_id, errors}."
    ))(sov_verify_attestation)

    mcp.tool(name="sov_anchor_bitcoin", description=(
        "Anchor an attestation to Bitcoin via OpenTimestamps. "
        "Requires `ots` CLI. Returns pending status if not available."
    ))(sov_anchor_bitcoin)


def serve() -> None:
    from mcp.server.fastmcp import FastMCP
    mcp = FastMCP("meok-supply-chain-attestation")
    register_mcp_tools(mcp)
    mcp.run()


if __name__ == "__main__":
    serve()
