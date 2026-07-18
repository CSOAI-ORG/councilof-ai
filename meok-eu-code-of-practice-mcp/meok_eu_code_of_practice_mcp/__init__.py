"""meok-eu-code-of-practice-mcp

MCP server that produces EU Code of Practice (draft 2, June 2026) compliant
two-layer attestation manifests combining C2PA Content Credentials (Layer 1)
and watermarking (Layer 2) per EU AI Act Article 50(2).
"""

from .server import (
    main,
    mark_content,
    verify_attestation,
    detect_ai_content,
    compliance_check,
    MCP_VERSION,
    CODE_OF_PRACTICE_VERSION,
    SIGNING_KEY,
    VERIFY_URL_TEMPLATE,
)

__version__ = MCP_VERSION
__all__ = [
    "main",
    "mark_content",
    "verify_attestation",
    "detect_ai_content",
    "compliance_check",
    "MCP_VERSION",
    "CODE_OF_PRACTICE_VERSION",
    "SIGNING_KEY",
    "VERIFY_URL_TEMPLATE",
]
