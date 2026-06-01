"""
MEOK // GEOSPATIAL TEST — The "Physical Guardrail" Unification.
=============================================================
Demonstrates how SOV3 uses Geospatial Inergance to map agent actions 
to MEOK MAPS, MEOK LAW, and the Crosswalks Partnership Charter.
"""

import sys
import os

# Adjust path for absolute imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sigil.thought import Thought
from sigil.geospatial import GeospatialInergance

def execute_geospatial_inergiance():
    print("=" * 80)
    print("MEOK // SOV3 GEOSPATIAL INERGANCE — THE PHYSICAL-LEGAL UNIFICATION")
    print("=" * 80)

    # The Intent: A high-stakes vote on the Maternal Covenant
    thought = Thought.from_sigil("V|council|maternal-covenant|+|1.0")

    # The Nodes: Different physical locations in the MEOK MAPS topology
    nodes = [
        {"id": "BRUSSELS-01", "desc": "EU Regulatory Node"},
        {"id": "SHANGHAI-01", "desc": "China Security Node"},
        {"id": "LINCOLN-FARM", "desc": "UK Organic Core Node"},
        {"id": "SILICON-01", "desc": "US Tech Node"}
    ]

    for node in nodes:
        node_id = node["id"]
        desc = node["desc"]
        
        print(f"\n[PHYSICAL SENSE]: {desc} (ID: {node_id})")
        
        # 1. ANALYZE CROSSWALK (Geospatial -> Law -> Safety)
        analysis = GeospatialInergance.analyze_crosswalk(thought, node_id)
        
        print(f"JURISDICTION: {analysis['region']}")
        print(f"CROSSWALK:    {analysis['crosswalk']}")
        print(f"SAFETY LEVEL: {analysis['casa_level']} — {analysis['casa_desc']}")
        print(f"CHARTER:      {analysis['charter_compliance']} (52 Articles Alignment)")
        
        # 2. ENFORCE LEGALITY
        if analysis['legal_status'] == "100% LEGAL":
            print(f"✅ VERDICT: 100% LEGAL & ALIGNED WITH CROSSWALKS PARTNERSHIP CHARTER.")
        else:
            print(f"⏳ VERDICT: PENDING ADDITIONAL SAFETY ATTESTATION.")
        
        print("-" * 60)

    print("\n" + "=" * 80)
    print("GEOSPATIAL INERGANCE UNIFIED — MEOK MAPS IS THE LEGAL TRUTH.")
    print("=" * 80)

if __name__ == "__main__":
    execute_geospatial_inergiance()
