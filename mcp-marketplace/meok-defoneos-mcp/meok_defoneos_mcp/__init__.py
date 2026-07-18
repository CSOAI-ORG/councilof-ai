"""MEOK DEFONEOS — sovereign UK defence-AI governance surface.

The 28th hive in the meok.ai mesh. The BUILDS compartment per
`MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md` v2.0.

This package wraps 4 underlying MCPs into a single sovereign UK defence-AI
governance surface:
  - airspace-monitor-mcp (CAA airspace + NOTAMs + no-fly zones)
  - drone-airspace-governance-mcp (BVLOS risk + Remote ID + autonomous decision gov)
  - firmware-attestation-mcp (hardware root-of-trust + secure boot)
  - meok-governance-engine-mcp (full governance audit in 1 call)

Plus the care-membrane for ethical validation. Plus the BannedTermGate for
severed-brand enforcement.

BFT council approval required for any forward-facing use:
  meok.ai/defoneos  |  csoai.org/defoneos
"""

__version__ = "1.0.0"
__alignment__ = "MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md v2.0"
__care_score_threshold__ = 0.95

from meok_defoneos_mcp.server import mcp, main, BannedTermGate, BANNED_TERMS, defence_geoint_query

__all__ = [
    "mcp",
    "main",
    "BannedTermGate",
    "BANNED_TERMS",
    "defence_geoint_query",
    "__version__",
    "__alignment__",
    "__care_score_threshold__",
]
