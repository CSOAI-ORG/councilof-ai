"""MEEK Hybrid Roadmap MCP — the MOD vs BUILD decision orchestrator.

The 21st MEOK MCP. Wraps the hybrid strategy: MOD existing open source first,
BUILD only the unique capillary differentiators. The 80/20 rule for the
sovereign capillary humanoid.

Inherits: MEOK_DEFONEOS_ALIGNMENT v3.0 + W16 capillary humanoid + W17 hybrid roadmap.
"""
import re

__version__ = "1.0.0"
__alignment__ = "MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md v3.0 + W16 + W17_HYBRID_ROADMAP"
__substrate_size__ = "12 MOD paths + 5 BUILD paths + 25 candidate MOD repos + 20-week timeline"
__care_score_threshold__ = 0.95
__council_quorum__ = 23
__scope__ = "Hybrid roadmap orchestrator (MOD vs BUILD). UK sovereign only."

from meek_hybrid_roadmap_mcp.server import (
    BannedTermGate,
    mod_or_build_decision,
    estimate_mod_time,
    list_mod_targets,
    list_build_targets,
    generate_timeline,
)