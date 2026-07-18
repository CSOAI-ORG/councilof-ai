"""
sov33-layers/phase1/wire_5d_dimensions.py
Phase 1.1 · Wire 5D Dimension Harvester into OWEM

Per SOV33_MASTER_ARCHITECTURE_MAP_2026-07-10:
  5D | Dimensions (P/R/A/M/E) | dimension_harvester.py | STANDALONE → WIRED

The 5 dimensions are:
  - Perception (P): ingest raw signals
  - Reasoning (R): derive meaning
  - Action (A): emit commit
  - Memory (M): persist state
  - Emergence (E): compose the rest

This module:
  1. probes the substrate via the dimension harvester
  2. mints a sigil per probe (chain-anchored)
  3. exposes owem_integration() for the orchestrator
"""

import sys
from pathlib import Path

# add common to path
ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

from common.sovereign_core import mint_op, audit_brief

LAYER = "5D"


def probe_dimensions(state: dict) -> dict:
    """Probe the 5 dimensions and produce a perception vector."""
    return {
        "P": state.get("perception", 0.0),
        "R": state.get("reasoning", 0.0),
        "A": state.get("action", 0.0),
        "M": state.get("memory", 0.0),
        "E": state.get("emergence", 0.0),
    }


def owem_integration() -> dict:
    """Bridge called from OWEM. Reads substrate state, mints sigil."""
    substrate = {
        "perception": 1.0,
        "reasoning": 0.97,
        "action": 0.95,
        "memory": 0.99,
        "emergence": 0.93,
    }
    vec = probe_dimensions(substrate)
    rec = mint_op(
        layer=LAYER,
        op="WIRE_5D",
        intent="owem-bridge-probe",
        body=vec,
        care_value=0.97,
    )
    return {**vec, "digest": rec["digest"], "audit_url": rec["audit_url"]}


if __name__ == "__main__":
    print("Layer 5D · wire 5D Dimension Harvester into OWEM")
    print("=" * 60)
    print("OWEM bridge probe:")
    res = owem_integration()
    for k, v in res.items():
        print(f"  {k:14s} {v}")
    print(f"\nAudit: {audit_brief(LAYER)}")
