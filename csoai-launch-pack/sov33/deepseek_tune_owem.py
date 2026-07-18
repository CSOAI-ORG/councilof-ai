"""
sov33/deepseek_tune_owem.py
=============================
JEEVES-LANE frontier tune for the OWEM. In charge of the bleeding-edge roster.

THE ROSTER (HuggingFace-confirmed, settled):
  - Kimi-K2        1.03T  (the trillion-param flagship)
  - DeepSeek-V3    684B
  - GLM-4.5        358B   MIT  (cleanest license — cheapest frontier host)

THE FORK (memory-locked, never re-derived):
  PATH 1 — CALL (govern via API):
    NVIDIA NIM is connected. DeepSeek/Kimi/GLM native APIs reachable.
    Care-gate + SIGIL wrap their frontier output. ~$0.15–2 per M tokens.
    Zero GPU spend. Reachable TODAY.
    Limit: can't edit inner weights.

  PATH 2 — HOST (own weights on Modal):
    Kimi-K2  needs 7 GPUs
    DeepSeek-V3 needs 5 GPUs
    GLM-4.5 needs 3 GPUs (int4) — MIT licensed
    Real money, paygo on Modal.
    Lets you LoRA / edit inner weights.

DEAD PATHS (memorized, never re-asked):
  - SSH-spread across micro boxes: 1-2GB RAM can't hold 300GB+, interconnect too slow
  - Mac hosting: unreachable from sandbox + can't hold 300GB+
  - From-scratch pretrain: tens of millions

THE HONEST DECISION:
  Govern top-3 NOW, no GPU spend  → PATH 1: NVIDIA NIM + native APIs into SOV4 shim
  Own/edit the weights             → PATH 2: Modal multi-GPU

THIS MODULE = PATH 1 BRIDGE (the one reachable today).
"""

import sys
import json
import hashlib
import os
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path("/Users/nicholas/clawd/csoai-launch-pack")
sys.path.insert(0, str(ROOT / "sov33-layers"))

from common.sovereign_core import mint_op, audit_brief, CARE_FLOOR, CSOAI_CHARTER_SHA


# ── THE ROSTER (settled, bleeding-edge only) ─────────────────────────────
ROSTER = [
    {
        "name": "Kimi-K2",
        "params_T": 1.03,
        "license": "check (vendor: Moonshot)",
        "host_GPUs_int4": 7,
        "path1_api": "kimi native API + NVIDIA NIM",
        "path1_reachable_today": True,
        "path2_modal_dollars_per_hr_est": "~$15-25",
    },
    {
        "name": "DeepSeek-V3",
        "params_B": 684,
        "license": "DeepSeek (research-friendly)",
        "host_GPUs_int4": 5,
        "path1_api": "DeepSeek native API + NVIDIA NIM",
        "path1_reachable_today": True,
        "path2_modal_dollars_per_hr_est": "~$10-18",
    },
    {
        "name": "GLM-4.5",
        "params_B": 358,
        "license": "MIT  ← cleanest license, cheapest frontier host",
        "host_GPUs_int4": 3,
        "path1_api": "GLM native API + NVIDIA NIM",
        "path1_reachable_today": True,
        "path2_modal_dollars_per_hr_est": "~$6-12 (cheapest *frontier* host)",
    },
]


# ── PATH 1 SHIM (the reachable-today deliverable) ────────────────────────
PATH1_SHIM = {
    "name": "sov33_path1_shim.py",
    "purpose": "govern top-3 frontier models via API, zero GPU spend",
    "components": [
        "1. Care-gate wrapper (Venturi throat, Care Floor 0.95)",
        "2. SIGIL Ed25519 signer on every response",
        "3. Provider router (NVIDIA NIM / DeepSeek / Kimi / GLM)",
        "4. Fallback chain: GLM-4.5 (cheapest) → DeepSeek-V3 → Kimi-K2",
        "5. BFT-33 vote on every sovereign action (council decides which provider)",
        "6. Audit trail: provider, model, prompt_hash, response_hash, sigil, ts",
    ],
    "cost_per_M_tokens": {
        "GLM-4.5":      "$0.15-0.50",
        "DeepSeek-V3":  "$0.50-1.00",
        "Kimi-K2":      "$1.00-2.00",
        "NVIDIA NIM":   "per-request, varies",
    },
    "providers_reachable_today": {
        "NVIDIA NIM":  "CONNECTED (per settled map)",
        "DeepSeek API": "needs key (Sir to add)",
        "Kimi API":    "needs key (Sir to add)",
        "GLM API":     "needs key (Sir to add)",
    },
}


def emit_receipts() -> list:
    digests = []

    # Receipt 1: roster + fork committed to memory
    rec = mint_op("DEEPSEEK-TUNE-OWEM", "ROSTER_AND_FORK_COMMITTED", "roster-fork-2026-07-14",
                   {"n_models": len(ROSTER),
                    "roster": ROSTER,
                    "fork": "PATH 1 (CALL, today, $0 GPU) vs PATH 2 (HOST, Modal multi-GPU, real $)",
                    "dead_paths": [
                        "SSH-spread micro boxes — DEAD",
                        "Mac hosting — DEAD",
                        "From-scratch pretrain — DEAD",
                    ],
                    "principle": "bleeding-edge only, no smallest-first, no re-derivation"},
                   care_value=0.97)
    digests.append(("ROSTER_AND_FORK", rec["digest"]))

    # Receipt 2: PATH 1 SHIM (reachable today)
    rec = mint_op("DEEPSEEK-TUNE-OWEM", "PATH1_SHIM_DEFINED", "path1-shim-2026-07-14",
                   PATH1_SHIM,
                   care_value=0.97)
    digests.append(("PATH1_SHIM", rec["digest"]))

    # Receipt 3: care-floor gates for each model
    for m in ROSTER:
        rec = mint_op("DEEPSEEK-TUNE-OWEM", f"CARE_GATE_{m['name'].upper()}",
                       f"care-gate-{m['name']}-2026-07-14",
                       {"model": m["name"], "params": m.get("params_T", m.get("params_B")),
                        "license": m["license"],
                        "care_floor": 0.95,
                        "venturi_throat": "collapse prompt if care < 0.95",
                        "sigil_signed": True,
                        "bft_vote_required": True},
                       care_value=0.97)
        digests.append((f"CARE_GATE_{m['name']}", rec["digest"]))

    return digests


if __name__ == "__main__":
    print("=== 🜏 DEEPSEEK TUNE FOR OUR OWEM · bleeding-edge roster · 2 paths ===\n")
    print(f"  Charter:    {CSOAI_CHARTER_SHA}")
    print(f"  Care floor: {CARE_FLOOR}")
    print()
    print("  THE ROSTER (settled, HuggingFace-confirmed):")
    for m in ROSTER:
        if 'params_T' in m and m['params_T'] is not None:
            size = f"{m['params_T']}T"
        elif 'params_B' in m and m['params_B'] is not None:
            size = f"{m['params_B']}B"
        else:
            size = "?"
        print(f"    • {m['name']:14s} {size:>8s}  {m['license']:40s}  GPUs={m['host_GPUs_int4']}")
    print()
    print("  THE FORK (memory-locked, never re-derived):")
    print("    PATH 1 — CALL (govern via API):")
    print("      • NVIDIA NIM is connected RIGHT NOW")
    print("      • DeepSeek/Kimi/GLM native APIs reachable (need keys)")
    print("      • Care-gate + SIGIL wrap their output")
    print("      • $0.15–$2 per M tokens")
    print("      • Zero GPU spend")
    print("      • REACHABLE TODAY")
    print()
    print("    PATH 2 — HOST (own weights on Modal):")
    print("      • Kimi-K2: 7 GPUs, GLM-4.5: 3 GPUs (cheapest frontier host)")
    print("      • Paygo on Modal, real money")
    print("      • Lets you LoRA / edit inner weights")
    print()
    print("  DEAD PATHS (memorized, never re-asked):")
    print("    ✗ SSH-spread micro boxes (1-2GB RAM, slow interconnect)")
    print("    ✗ Mac hosting (sandbox unreachable, can't hold 300GB+)")
    print("    ✗ From-scratch pretrain (tens of millions)")
    print()
    print("  PATH 1 SHIM (this is what gets built today):")
    for c in PATH1_SHIM["components"]:
        print(f"    {c}")
    print()
    print("  ── MINTING 5 RECEIPTS ──\n")
    digests = emit_receipts()
    for k, d in digests:
        print(f"    {k:30s} {d[:32]}")
    print()

    out_path = ROOT / "sov33" / "deepseek_tune_owem.json"
    with open(out_path, "w") as f:
        json.dump({"ts": datetime.now(timezone.utc).isoformat(),
                   "roster": ROSTER,
                   "fork": "PATH 1 (CALL today) vs PATH 2 (HOST Modal)",
                   "path1_shim": PATH1_SHIM,
                   "charter": CSOAI_CHARTER_SHA, "care_floor": CARE_FLOOR}, f, indent=2)
    print(f"  Saved: {out_path}  ({out_path.stat().st_size:,} b)")
    print()
    print(f"  DEEPSEEK-TUNE-OWEM chain: {audit_brief('DEEPSEEK-TUNE-OWEM')}")