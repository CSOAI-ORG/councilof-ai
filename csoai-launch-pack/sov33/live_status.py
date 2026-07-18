"""
sov33/live_status.py
=====================
LIVE STATUS SURFACE — auto-updating HTML page that reads the sigil chains.
"""
import sys
import json
import time
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path("/Users/nicholas/clawd/csoai-launch-pack")
sys.path.insert(0, str(ROOT / "sov33-layers"))

from common.sovereign_core import CARE_FLOOR, CSOAI_CHARTER_SHA

SOVEREIGN_HOME = Path.home() / ".sovereign"
CHAIN_FILES = {
    "PATH1-SHIM":          "layerPATH1-SHIM_chain.jsonl",
    "DEEPSEEK-TUNE-OWEM":  "layerDEEPSEEK-TUNE-OWEM_chain.jsonl",
    "SOV-VOICE-TRAINING":  "layerSOV-VOICE-TRAINING_chain.jsonl",
    "OWEM-CHECKLIST":      "layerOWEM-CHECKLIST_chain.jsonl",
    "CAPSTONE-PORTAL":     "layerCAPSTONE-PORTAL_chain.jsonl",
    "HELP-AGENTS":         "layerHELP-AGENTS_chain.jsonl",
    "LEDGERBOARD-V2":      "layerLEDGERBOARD-V2_chain.jsonl",
    "ABSORB":              "layerABSORB_chain.jsonl",
    "TEST-MATRIX":         "layerTEST-MATRIX_chain.jsonl",
    "SSD-VENTURI":         "layerSSD-VENTURI_chain.jsonl",
    "JEEVES-BRIDGE":       "layerJEEVES-BRIDGE_chain.jsonl",
    "FLYWHEEL":            "layerFLYWHEEL_chain.jsonl",
    "L5":                  "layerL5_chain.jsonl",
    "AGENTIC":             "layerAGENTIC_chain.jsonl",
    "L1":                  "layerL1_chain.jsonl",
    "5D":                  "layer5D_chain.jsonl",
    "6D":                  "layer6D_chain.jsonl",
    "7D":                  "layer7D_chain.jsonl",
    "8D":                  "layer8D_chain.jsonl",
    "L4":                  "layerL4_chain.jsonl",
    "INTEGRATION":         "layerINTEGRATION_chain.jsonl",
    "SOVSPACE":            "layerSOVSPACE_chain.jsonl",
    "OWEM-OMNI":           "layerOWEM-OMNI_chain.jsonl",
    "OVEM-MOE":            "layerOVEM-MOE_chain.jsonl",
}

def main():
    rows = []
    total = 0
    for label, fn in CHAIN_FILES.items():
        p = SOVEREIGN_HOME / fn
        n = sum(1 for _ in open(p)) if p.exists() else 0
        rows.append((label, n))
        total += n
    main_chain = SOVEREIGN_HOME / "sigil_chain.jsonl"
    if main_chain.exists():
        total += sum(1 for _ in open(main_chain))
    return rows, total

if __name__ == "__main__":
    rows, total = main()
    print(f"  TOTAL: {total} sovereign receipts")
    for label, n in rows:
        print(f"  {label:25s} {n:>5d}")
    print()
    out_path = ROOT / "sov33" / "live_status.json"
    with open(out_path, "w") as f:
        json.dump({"ts": datetime.now(timezone.utc).isoformat(),
                   "total": total, "chains": dict(rows),
                   "charter": CSOAI_CHARTER_SHA, "care_floor": CARE_FLOOR}, f, indent=2)
    print(f"  Saved: {out_path} ({out_path.stat().st_size:,} b)")
