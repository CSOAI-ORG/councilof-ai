"""
meok-sovereign-aiact-passport — Crown Jewel #1 of the CSOAI trust stack.

A Model Context Protocol (MCP) server that wraps the live CSOAI `/api/assess`
endpoint as installable tools a DPO can drop into Claude Desktop, Cursor,
or any MCP-aware agent. Issues Ed25519-signed compliance passports for AI
systems against EU AI Act Article 6 risk tiers and Annex IV technical
documentation.

Honesty register
----------------
This package issues **assurance attestations** of declared posture —
not legal certifications. EU AI Act Art 50 compliance requires
competent-authority evaluation (not yet constituted). The signed
receipts we produce are the verifiable artifact layer of the trust
stack; the legal determination sits with the regulator.

We sign evidence. We do not certify intent.
"""

from sovereign_aiact_passport.passport_client import PassportClient
from sovereign_aiact_passport.error_map import (
    SovereignPassportError,
    NetworkError,
    ValidationError,
    VerificationError,
)
from sovereign_aiact_passport.classify import classify_use_case, RISK_TIERS
from sovereign_aiact_passport.annex_iv import generate_annex_iv, ANNEX_IV_TEMPLATE

__version__ = "0.1.0"
__all__ = [
    "PassportClient",
    "SovereignPassportError",
    "NetworkError",
    "ValidationError",
    "VerificationError",
    "classify_use_case",
    "RISK_TIERS",
    "generate_annex_iv",
    "ANNEX_IV_TEMPLATE",
    "__version__",
]
