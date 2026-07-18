"""MEEK Energy Harvester MCP — the AURUM-II energy-autonomous orb harvester.

The 12th critical science MCP. Wraps 4 energy harvesting mechanisms:
1. Streaming potential (electrokinetic)
2. Triboelectric (PVA-water contact)
3. Piezoelectric (PVDF coating)
4. Thermoelectric (Bi2Te3 Seebeck)

Inherits: MEOK_DEFONEOS_ALIGNMENT v3.0 + PROJECT_AURUM_W15 + W14 deep synthesis.
"""
import re

__version__ = "1.0.0"
__alignment__ = "MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md v3.0 + PROJECT_AURUM_W15_2026-06-28 + W14_DEEP_SYNTHESIS"
__substrate_size__ = "4 energy harvesting mechanisms (streaming + triboelectric + piezo + thermoelectric)"
__care_score_threshold__ = 0.95
__council_quorum__ = 23
__scope__ = "Energy harvester for the AURUM-II sovereign energy-autonomous orb. UK sovereign only."

from meek_energy_harvester_mcp.server import (
    BannedTermGate,
    streaming_potential_energy,
    triboelectric_energy,
    piezoelectric_energy,
    thermoelectric_energy,
    orb_total_energy_harvest,
    orb_power_budget,
    orb_battery_runtime,
    list_energy_harvesting_components,
)