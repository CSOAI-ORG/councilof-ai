"""MEOK DEFONEOS Geospatial Intelligence — sovereign UK defence-AI geo-intel surface.

The 16th MCP in the DEFONEOS fleet. The GEOSPATIAL compartment per
`MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md` v2.0 + the new
`MEOK_DEFONEOS_GEOSPATIAL_2026-06-28.md` amendment.

This package wraps 3 underlying MCPs into a single sovereign UK defence-AI
geospatial intelligence surface:
  - gods-eye-geospatial-mcp (Copernicus Sentinel-1/2/3/5p + OSM + Overture + OS UK + INSPIRE + DEFRA)
  - care-membrane-mcp (4-dimension care ethics + 16 probes, NO targeting patterns)
  - meok-governance-engine-mcp (full governance audit + sovereignty check)

Plus the BannedTermGate (refuses severed brands) + the DEFONEOS BFT audit chain
(sovereign procurement-grade, 33-agent council quorum, AUKUS Pillar 2 compatible).

BFT council approval required for any forward-facing use:
  meok.ai/defoneos  |  csoai.org/defoneos
"""
import re

from meok_defoneos_geospatial_intel_mcp.server import (
    BannedTermGate,
    BANNED_TERMS,
    KINETIC_BLOCK_PATTERNS,
    SURVEILLANCE_BLOCK_PATTERNS,
    sovereign_geoint_situational_query,
    sovereignty_supply_chain_audit,
    care_membrane_validate,
    dstl_sapient_evaluate,
    meok_defoneos_geo_audit,
    uk_aoi_data_provenance,
)

__version__ = "1.0.0"
__alignment__ = "MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md v2.0 + MEOK_DEFONEOS_GEOSPATIAL_2026-06-28.md"
__council_quorum__ = 23
__care_score_threshold__ = 0.95

# Blocked operational patterns (the geospatial care-membrane extension)
# Beyond the standard BannedTermGate, the geospatial MCP refuses:
#   1. Kinetic targeting patterns (strike package, find-fix-finish, target elimination, lethal)
#   2. Personal surveillance patterns (track individual, follow person, locate <name>)
#   3. Weapons-grade targeting (bounty, hit list, kill list, assassination)
# These are the kinematic + surveillance extensions of the BannedTermGate.
# The care-membrane wraps all queries and refuses BEFORE any API call.
KINETIC_BLOCK_PATTERNS = re.compile(
    r"\b(strike package|find-fix-finish|target elimination|kill order|"
    r"bounty|hit list|kill list|assassination|lethal strike|"
    r"kinetic target|kinetic option)\b",
    re.IGNORECASE,
)
SURVEILLANCE_BLOCK_PATTERNS = re.compile(
    r"\b(track individual|follow person|locate <name>|track <name>|"
    r"surveil <name>|find <name> location|locate phone|track phone|"
    r"identify person|recognise face|face-rec)\b",
    re.IGNORECASE,
)
