"""MEEK Simulation MCP — multi-physics simulation (FEM, CFD, EM).

The 19th MEOK MCP. Wraps OpenFOAM (CFD), MEEP (electromagnetic FDTD),
Basilisk (microfluidic VOF), FreeFEM (FEM), CalculiX (FEM) for the
Project AURUM capillary + DNA-orb sim.

Inherits: MEOK_DEFONEOS_ALIGNMENT v2.1 + PROJECT_AURUM_W10_2026-06-28.
"""
import re

__version__ = "1.0.0"
__alignment__ = "MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md v3.0 + PROJECT_AURUM_W10_2026-06-28"
__substrate_size__ = "5 open-source sim engines (OpenFOAM + MEEP + Basilisk + FreeFEM + CalculiX)"
__care_score_threshold__ = 0.95
__council_quorum__ = 23
__scope__ = "Multi-physics sim for Project AURUM (capillary cooling + DNA-orb + gold-spiral). UK sovereign only."

from meek_simulation_mcp.server import (
    BannedTermGate,
    openfoam_cfd,
    meep_fdtd,
    basilisk_microfluidic,
    freefem_fem,
    calculix_fem,
    run_heat_pipe_cooling_sim,
    run_dry_dna_synthesis_sim,
    run_gold_spiral_optics_sim,
    run_orb_thermal_routing_sim,
    list_available_engines,
)
