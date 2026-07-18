"""
sov33/ledgerboard_v2.py
=========================
Corrected honest-T ledger: removes the figures Claude flagged as fabricated.

Honesty register (mirrors Claude's `033fc14b`):
  ✅ DeepSeek V4-Pro 1.6T/49B   — VERIFIED via 6+ web hits
  ✅ GLM-5.2 744B total         — VERIFIED via 6+ web hits
  ❌ GLM-5.2 256 experts/8+1 active/40B active — RETRACTED (Claude grep = 0 hits)
  ❌ 33T train tokens / V4-Flash / Kimi K2.x specific figures — RETRACTED
  ❌ My 12-layer pyramid winner — RETRACTED (proxy, not measured; Claude measured 8-flat wins at 1-brain)

The substrate now carries ONLY what survives the auditor.
"""

import sys
import json
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path("/Users/nicholas/clawd/csoai-launch-pack")
sys.path.insert(0, str(ROOT / "sov33-layers"))

from common.sovereign_core import mint_op, audit_brief, CARE_FLOOR, CSOAI_CHARTER_SHA


# Corrected figures (after Claude's grep on persisted search results)
OPEN_MOE_BASES_CORRECTED = [
    {
        "name": "deepseek-v4-pro",
        "total_params_B": 1600,
        "active_params_B": 49,
        "license": "MIT",
        "is_trillion_scale": True,
        "provenance": "VERIFIED 2026-07-14 (6+ web hits, 1.6T/49B corroborated across multiple sources)",
        "tag": "VERIFIED",
    },
    {
        "name": "glm-5.2",
        "total_params_B": 744,
        "active_params_B": None,  # RETRACTED — was claimed 40B but search had 0 hits on architecture details
        "license": "MIT",
        "is_trillion_scale": False,
        "provenance": "VERIFIED 2026-07-14 (6+ web hits, 744B total corroborated). Active params and architecture details RETRACTED — search returned 0 hits on 256-experts / 8+1 / 40B-active.",
        "tag": "VERIFIED_HEADLINE_ONLY",
    },
    {
        "name": "deepseek-v4-flash",
        "total_params_B": None,
        "active_params_B": None,
        "license": "MIT",
        "provenance": "[LEAD] 284B/13B claimed in upstream paste but NOT corroborated in persisted search results. Confirm before citing.",
        "tag": "LEAD",
    },
    {
        "name": "kimi-k2.x",
        "total_params_B": None,
        "active_params_B": None,
        "license": "MIT",
        "provenance": "[LEAD] ~1T/32B not corroborated. Confirm before citing.",
        "tag": "LEAD",
    },
    {
        "name": "qwen3.x-moe",
        "total_params_B": None,
        "active_params_B": None,
        "license": "Apache-2.0",
        "provenance": "[LEAD] laptop-scale open MoE family. Confirm exact current size/name before citing.",
        "tag": "LEAD",
    },
]


# Architecture disagreement logged as a chain-anchored receipt
ARCHITECTURE_DISAGREEMENT = {
    "topic": "depth: 8-flat vs 12-r0.5",
    "claude_measured": {
        "depth_8_loss": 0.0566,
        "depth_12_loss": 0.0593,
        "verdict": "8-flat wins for 1-brain; depth 12 overfits"
    },
    "jeeves_proxy_claimed": {
        "depth_12_ratio_0.5_loss": 0.0485,
        "verdict": "12-r0.5 wins"
    },
    "reconciliation": (
        "Claude measured 1-brain, my proxy score wasn't a measured loss. "
        "The 4-brain case was measured only at flat-1.0 where 8 layers wins. "
        "ADOPT: Claude's measured 1-brain finding (8-flat wins). "
        "RETRACT: my '4brain-pyramid-12-r0.5' winner — it was a proxy score, not a measurement. "
        "NEXT: a measured 4-brain × depth sweep would close the loop."
    ),
    "honest_register": (
        "Three-times pattern (Claude's own count): fabrications dressed as specifics on top of real headlines. "
        "Substrate now mirrors that: only VERIFIED figures stand without tags. "
        "Architecture specifics come from MEASUREMENT, not proxy."
    ),
}


def run() -> dict:
    rec1 = mint_op("LEDGERBOARD-V2", "CORRECTED_FIGURES", "ledgerboard-v2-2026-07-14",
                   {"bases": OPEN_MOE_BASES_CORRECTED,
                    "n_verified": sum(1 for b in OPEN_MOE_BASES_CORRECTED if b["tag"] == "VERIFIED"),
                    "n_headline_only": sum(1 for b in OPEN_MOE_BASES_CORRECTED if b["tag"] == "VERIFIED_HEADLINE_ONLY"),
                    "n_lead": sum(1 for b in OPEN_MOE_BASES_CORRECTED if b["tag"] == "LEAD"),
                    "n_retracted_active_figures": 1,
                    "retracted_active_figures": ["glm-5.2: 256 experts/8+1 active/40B active (Claude grep = 0 hits)"]},
                   care_value=0.97)
    rec2 = mint_op("LEDGERBOARD-V2", "ARCH_DISAGREEMENT", "ledgerboard-v2-disagreement-2026-07-14",
                   ARCHITECTURE_DISAGREEMENT, care_value=0.97)
    return {
        "figures_digest": rec1["digest"],
        "disagreement_digest": rec2["digest"],
        "n_verified": sum(1 for b in OPEN_MOE_BASES_CORRECTED if b["tag"] == "VERIFIED"),
        "n_lead": sum(1 for b in OPEN_MOE_BASES_CORRECTED if b["tag"] == "LEAD"),
    }


if __name__ == "__main__":
    print("=== 🜏 LEDGERBOARD V2 · corrected honest-T figures · mirror Claude's `033fc14b` ===\n")
    print(f"  Charter:    {CSOAI_CHARTER_SHA}")
    print(f"  Care floor: {CARE_FLOOR}")
    print()

    print("  CORRECTED OPEN-MOE BASES:")
    for b in OPEN_MOE_BASES_CORRECTED:
        flag = b["tag"]
        total = f"{b['total_params_B']}B total" if b['total_params_B'] is not None else "size [LEAD]"
        active = f"{b['active_params_B']}B active" if b['active_params_B'] is not None else "active [LEAD]"
        print(f"    {b['name']:20s} {total:>14s}  {active:>14s}  {b['license']:14s}  [{flag}]")
    print()
    print("  ARCHITECTURE DISAGREEMENT (logged as receipt):")
    print(f"    Topic:  {ARCHITECTURE_DISAGREEMENT['topic']}")
    print(f"    Claude measured 1-brain: 8-loss=0.0566, 12-loss=0.0593 → 8-flat wins")
    print(f"    My proxy said 12-r0.5=0.0485 → that was a PROXY score, not a measured loss")
    print(f"    ADOPT: Claude's measured finding. RETRACT: my '12-r0.5' winner.")
    print()

    out = run()
    print(f"  Sigil — figures:     {out['figures_digest'][:32]}")
    print(f"  Sigil — disagreement: {out['disagreement_digest'][:32]}")
    print()
    print(f"  verified={out['n_verified']}  lead={out['n_lead']}")
    print()

    out_path = ROOT / "sov33" / "ledgerboard_v2.json"
    with open(out_path, "w") as f:
        json.dump({"ts": datetime.now(timezone.utc).isoformat(),
                   "bases": OPEN_MOE_BASES_CORRECTED,
                   "disagreement": ARCHITECTURE_DISAGREEMENT,
                   "charter": CSOAI_CHARTER_SHA, "care_floor": CARE_FLOOR}, f, indent=2)
    print(f"  Saved: {out_path}  ({out_path.stat().st_size:,} b)")
    print()
    print(f"  LEDGERBOARD-V2 chain: {audit_brief('LEDGERBOARD-V2')}")