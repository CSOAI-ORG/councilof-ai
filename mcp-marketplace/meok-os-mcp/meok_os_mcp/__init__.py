"""MEOK OS — the UK sovereign defence AI meta-orchestrator (the DEFONEOS dominion).

The DEFONEOS dominion meta-orchestrator MCP for the 7-layer Global Dome
(15 DEFONEOS MCPs across 7 layers). UK sovereign only. NOT for global /
consumer / non-defence use.

7 LAYERS (DEFONEOS DOMINION):
  L0: UK Physical base (iokfarm.co.uk — 6.5-acre UK farm)
  L1: UK SOV3 infrastructure (47 agents, 115 tools, 341 MCPs, 33-agent BFT)
  L2: DEFONEOS-SEAL (33-agent BFT-signed credentials)
  L3: DEFONEOS Audit Chain (Ed25519-signed on UK soil)
  L4: UK Compliance Pack (DAIC + AUKUS Pillar 2 + DSTL SAPIENT + EU AI Act
      + NIST AI RMF + MITRE ATLAS + OWASP LLM + ISO 42001)
  L5: UK Government MCP Pack (UK MOD + GCHQ + NCSC + DAIC + Dstl + DASA)
  L6: DEFONEOS Defence Fleet (15 defence-AI MCPs: airspace + drone BVLOS
      + firmware + governance + care + geospatial + council + DEFONEOS-SEAL)
  L7: UK MOD-issued humanoid safety envelope (NOT for kinetic actions)

THE UK-ONLY SCOPE:
  - For UK MOD (the buyer)
  - For UK defence primes (Babcock, BAE, QinetiQ, Thales UK, Leonardo UK)
  - For AUKUS Pillar 2 (AU + UK + US interoperability)
  - For UK MOD-issued humanoids at AUKUS ranges (Woomera, Pendine, Suffield)
  - NOT for: consumer use, non-defence use, non-UK sovereigns

Authority: MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md v3.0
Inherits: the original DEFONEOS Global Dome spec
"""
import re

from meok_os_mcp.server import (
    GLOBAL_DOME_LAYERS,
    BANNED_TERMS,
    KINETIC_BLOCK_PATTERNS,
    SURVEILLANCE_BLOCK_PATTERNS,
    BannedTermGate,
    os_discover,
    os_route,
    os_run_humanoid_safety_check,
    os_audit,
    os_sign,
    os_verify,
    os_consult_council,
    os_industry_pack,
    os_data_provenance,
    os_sovereign_handoff,
)

__version__ = "1.0.2"
__alignment__ = "MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md v3.0 (UK sovereign only)"
__substrate_size__ = "15 DEFONEOS MCPs across 7 layers (UK sovereign only)"
__care_score_threshold__ = 0.95
__council_quorum__ = 23
__scope__ = "UK MOD + AUKUS Pillar 2 + DAIC procurement-grade. UK sovereign only. NOT for global / consumer / non-defence."