"""MEEK Silica Memory MCP — the 5D fused silica memory layer for Project AURUM.

The 6th critical science MCP. Wraps the 5D fused silica memory concept
(femtosecond laser writing, 360 TB per disc, 13.8B year stability) +
the silica-capillary merger architecture.

Inherits: MEOK_DEFONEOS_ALIGNMENT v3.0 + PROJECT_AURUM_W10_2026-06-28 +
MEOK_SCIENCE_TOOLS_W11_2026-06-28 + MEOK_SILICA_CAPILLARY_W12_2026-06-28.
"""
import re

__version__ = "1.0.0"
__alignment__ = "MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md v3.0 + PROJECT_AURUM_W10 + MEOK_SILICA_CAPILLARY_W12"
__substrate_size__ = "5D fused silica memory (Corning 7980) + capillary-etched microfluidic plate"
__care_score_threshold__ = 0.95
__council_quorum__ = 23
__scope__ = "5D silica memory + silica-capillary hybrid substrate. UK sovereign only."

from meek_silica_memory_mcp.server import (
    BannedTermGate,
    silica_5d_memory_specs,
    silica_thermal_cycling,
    silica_capillary_microfluidic,
    silica_disc_capacity_calculator,
    silica_disc_longevity_calculator,
    silica_capillary_cooling_estimate,
    silica_write_estimate,
    silica_read_estimate,
    orb_tri_memory_architecture,
    silica_disc_manufacturing_estimate,
    list_available_silica_materials,
)
