"""
PatentMCP: Decentralized Invention Disclosure System
MCP-Mediated, Blockchain-Anchored, HMAC-Signed Prior Art Engine

Built on CSOAI/MEOK's existing infrastructure:
- blockchain-ai-mcp (Bitcoin anchoring)
- blockchain-verification-mcp (on-chain provenance)
- agent-audit-logger-mcp (hash-chained audit logs)
- agent-content-watermark-mcp (C2PA credentials)
- Ed25519 signing infrastructure
- HMAC attestation via verify.meok.ai
- x402 micropayments

This package creates a 6-layer cryptographic proof of invention
that is patentable, verifiable, and economically viable.

Usage:
    from patentmcp import PatentMCP
    
    pm = PatentMCP()
    result = pm.disclose_invention(
        title="Hash-Chained Audit Logs for A2A",
        description="...",
        inventor_did="did:key:z6Mk...",
        document_bytes=b"...",
        disclosure_type="full"
    )
    # Returns attestation URL, Bitcoin tx, C2PA credential, etc.
"""

__version__ = "1.0.0"
__author__ = "CSOAI/MEOK"
__license__ = "MIT"

from .core import PatentMCP
from .crypto import CryptoEngine
from .blockchain import BlockchainAnchor
from .c2pa import C2PACredentialBuilder
from .registry import PriorArtRegistry
from .verify import VerificationEngine

__all__ = [
    "PatentMCP",
    "CryptoEngine",
    "BlockchainAnchor",
    "C2PACredentialBuilder",
    "PriorArtRegistry",
    "VerificationEngine",
]
