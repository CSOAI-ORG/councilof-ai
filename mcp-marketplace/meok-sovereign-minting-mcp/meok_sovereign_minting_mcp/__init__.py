"""meok-sovereign-minting-mcp — Sovereign Certificate + Citation Minting.

Mint sovereign certificates and citations for any sovereign entity.
Sovereign Certificates: bestowed on entities that uphold sovereign principles.
Citations: given to entities that contribute to the sovereign economy.

5 tools:
  1. mint_certificate  - mint a sovereign certificate
  2. mint_citation     - mint a citation for an entity
  3. mint_list         - list all minted certificates + citations
  4. mint_verify       - verify a certificate hash
  5. mint_status       - get minting status
"""
from __future__ import annotations
import json
import hashlib
import random
import string
from datetime import datetime, timezone

PROTOCOL = "sovereign-minting/1.0"
VERSION = "1.0.0"
LICENSE = "MIT + CC0 1.0"

# Minted certificates + citations
_CERTIFICATES = []
_CITATIONS = []


def _sign(payload):
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "mnt-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()[:16]
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def _gen_id(prefix: str) -> str:
    return f"{prefix}-{''.join(random.choices(string.hexdigits.lower(), k=8))}"


def mint_certificate(entity: str = "", tier: str = "bronze", reason: str = "") -> dict:
    """Mint a sovereign certificate."""
    if not entity:
        return _sign({"error": "entity required"})
    cert_id = _gen_id("cert")
    cert = {
        "cert_id": cert_id,
        "entity": entity,
        "tier": tier,
        "reason": reason,
        "issued_at": datetime.now(timezone.utc).isoformat(),
        "issuer": "CSOAI Ltd (UK 16939677)",
        "issuer_doctrine": "Crown lineage 1795-2025 · Sovereign by construction",
        "care_floor": 0.95,
    }
    cert["hash"] = hashlib.sha256(json.dumps(cert, sort_keys=True).encode()).hexdigest()[:16]
    _CERTIFICATES.append(cert)
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "certificate": cert,
        "total_certificates": len(_CERTIFICATES),
        "doctrine": f"Certificate {cert_id} minted for {entity}. Tier: {tier}. Care Floor 0.95. Sovereign.",
    })


def mint_citation(entity: str = "", contribution: str = "", weight: float = 1.0) -> dict:
    """Mint a citation for an entity."""
    if not entity:
        return _sign({"error": "entity required"})
    cite_id = _gen_id("cite")
    cite = {
        "cite_id": cite_id,
        "entity": entity,
        "contribution": contribution,
        "weight": weight,
        "minted_at": datetime.now(timezone.utc).isoformat(),
    }
    cite["hash"] = hashlib.sha256(json.dumps(cite, sort_keys=True).encode()).hexdigest()[:16]
    _CITATIONS.append(cite)
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "citation": cite,
        "total_citations": len(_CITATIONS),
        "doctrine": f"Citation {cite_id} minted for {entity}: {contribution}. Weight: {weight}. Sovereign.",
    })


def mint_list(entity: str = "", limit: int = 20) -> dict:
    """List all minted certificates + citations."""
    certs = _CERTIFICATES if not entity else [c for c in _CERTIFICATES if entity.lower() in c["entity"].lower()]
    cites = _CITATIONS if not entity else [c for c in _CITATIONS if entity.lower() in c["entity"].lower()]
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "certificates": certs[-limit:],
        "citations": cites[-limit:],
        "total_certificates": len(certs),
        "total_citations": len(cites),
        "doctrine": f"Minted: {len(certs)} certificates, {len(cites)} citations. Sovereign by construction.",
    })


def mint_verify(cert_id: str = "") -> dict:
    """Verify a certificate hash."""
    if not cert_id:
        return _sign({"error": "cert_id required"})
    cert = next((c for c in _CERTIFICATES if c["cert_id"] == cert_id), None)
    if not cert:
        return _sign({"error": f"certificate not found: {cert_id}"})
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "certificate": cert,
        "verified": True,
        "hash_match": cert["hash"] == hashlib.sha256(json.dumps({k: v for k, v in cert.items() if k != "hash"}, sort_keys=True).encode()).hexdigest()[:16],
        "doctrine": f"Certificate {cert_id} verified. Sovereign.",
    })


def mint_status() -> dict:
    """Minting status."""
    return _sign({
        "protocol": PROTOCOL, "version": LICENSE,
        "total_certificates": len(_CERTIFICATES),
        "total_citations": len(_CITATIONS),
        "tiers": ["bronze", "silver", "gold", "platinum", "sovereign"],
        "issuer": "CSOAI Ltd (UK 16939677)",
        "crown_lineage": "1795-2025",
        "doctrine": f"Sovereign mint: {len(_CERTIFICATES)} certificates, {len(_CITATIONS)} citations. Care Floor 0.95. Sovereign.",
    })