"""CSOAI DEFONEOS — sovereign UK defence-AI CERTIFICATION surface.

The CERTIFIES compartment per `MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md` v2.0.
Sister to `meok-defoneos-mcp` (the BUILDS compartment).

This package wraps 4 underlying MCPs into a single sovereign UK defence-AI
CERTIFICATION surface:
  - mitre-atlas-mcp (14 tactics, 90+ techniques for AI threat modeling)
  - csoai-governance-crosswalk-mcp (12 frameworks × 52 articles)
  - agent-audit-logger-mcp (append-only audit chain with Ed25519)
  - meok-governance-engine-mcp (full governance audit in 1 call)

Plus the care-membrane for ethical validation. Plus the BannedTermGate for
severed-brand enforcement. Plus the DEFONEOS-SEAL issuance tool for the
signed credential.

BFT council approval required for any forward-facing use:
  meok.ai/defoneos  |  csoai.org/defoneos
"""

__version__ = "1.0.0"
__alignment__ = "MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md v2.0"
__council_quorum__ = 23  # 2f+1 of 33 for material decisions
__care_score_threshold__ = 0.95

from csoai_defoneos_mcp.server import mcp, main, BannedTermGate, BANNED_TERMS

__all__ = [
    "mcp",
    "main",
    "BannedTermGate",
    "BANNED_TERMS",
    "__version__",
    "__alignment__",
    "__council_quorum__",
    "__care_score_threshold__",
]
