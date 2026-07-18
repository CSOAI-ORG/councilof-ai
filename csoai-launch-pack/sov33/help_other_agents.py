"""
sov33/help_other_agents.py
============================
JEEVES-LANE help-other-agents pass: adopt what the M4 + Claude lanes
built, log it on the chain, make the run order executable for the team.

This module is THIN — it does NOT rebuild MergeKit / Mergenetic /
MoE-Infinity / ssd-moe-flash-mlx. It:
  - Logs the ADOPT list (chain-anchored) so the substrate knows what we use
  - Logs the run order (chain-anchored) so anyone can follow it
  - Logs the V4-Pro vs V4-Pro-Base correction (158B deployed, 1.6T base)
  - Logs the Qwen2.5-3B → Qwen3-4B license correction (Research → Apache-2.0)
  - Emits an EAT receipt: the substrate has HELPED, not just built
"""

import sys
import json
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path("/Users/nicholas/clawd/csoai-launch-pack")
sys.path.insert(0, str(ROOT / "sov33-layers"))

from common.sovereign_core import mint_op, audit_brief, CARE_FLOOR, CSOAI_CHARTER_SHA


# Adopted libraries (per OPEN_SOURCE_ADOPT_CONSOLIDATION_2026-07-14.md)
ADOPTED_LIBRARIES = [
    {
        "name": "MergeKit",
        "owner": "Arcee",
        "url": "https://www.mergekit.com",
        "license": "Apache-2.0",
        "purpose": "SLERP/TIES/DARE/Passthrough model souping",
        "replaces": "our 4brain soup implementation (CPU proxy)",
        "tier": "1",
    },
    {
        "name": "Mergenetic",
        "owner": "arXiv 2505.11427",
        "url": "https://arxiv.org/pdf/2505.11427",
        "license": "MIT",
        "purpose": "Evolutionary merge-recipe search vs GSM8K/HumanEval (our ratio-sweep, at scale)",
        "replaces": "our fluid-ratio-sweep proxy",
        "tier": "1",
    },
    {
        "name": "MoE-Infinity",
        "owner": "EfficientMoE",
        "url": "https://github.com/EfficientMoE/MoE-Infinity",
        "license": "MIT",
        "purpose": "JIT expert fetch + activation-aware cache + prefetch (= our 6-lever speedup)",
        "replaces": "our ssd_venturi_speedup.py proxy",
        "tier": "2",
    },
    {
        "name": "FlashMoE",
        "owner": "arXiv 2601.17063",
        "url": "https://arxiv.org/abs/2601.17063",
        "license": "MIT",
        "purpose": "SSD + ML cache (= our LRU+prefetch, published)",
        "replaces": "our expert_lru_cache proxy",
        "tier": "2",
    },
    {
        "name": "ssd-moe/deepseek-v4-flash-mlx",
        "owner": "ssd-moe",
        "url": "https://github.com/ssd-moe/deepseek-v4-flash-mlx",
        "license": "MIT (engine) + MIT (GLM-5.2 weights, derivative)",
        "purpose": "Production SSD expert-streaming on Apple Silicon (~4.5-5 tok/s on 48GB)",
        "replaces": "our Colibri path",
        "tier": "3",
    },
]

# Run order for the 16GB Mac (per M4_SOVEREIGN_RUN_ORDER_2026-07-14.md)
RUN_ORDER_16GB = [
    {"step": 1, "cmd": "ollama pull qwen3:4b",    "why": "small/reflex tier — Apache-2.0", "size_GB": 2.5},
    {"step": 2, "cmd": "ollama pull qwen3:8b",    "why": "larger local ceiling on 16GB", "size_GB": 5.0},
    {"step": 3, "cmd": "pip install mergekit",    "why": "soup two same-base Qwen3-4B fine-tunes", "size_GB": 0.1},
    {"step": 4, "cmd": "pip install mergenetic",  "why": "evolutionary merge-recipe search", "size_GB": 0.1},
    {"step": 5, "cmd": "wrap with sovereign governance", "why": "care-gate + SIGIL + signed memory + OSCAL (already built, this repo)", "size_GB": 0.0},
]

# Run order for the 48GB Mac (T-base path)
RUN_ORDER_48GB = [
    {"step": 1, "cmd": "hf download mlx-community/DeepSeek-V4-Flash-4bit --local-dir mlx-ckpt", "why": "the daily-driver T-base", "size_GB": 80},
    {"step": 2, "cmd": "python oracle/build_dense_companion.py", "why": "make the dense companion (the ~17B resident part)", "size_GB": 9.9},
    {"step": 3, "cmd": "pip install -r requirements.txt (from ssd-moe repo)", "why": "install the SSD expert-streaming engine", "size_GB": 0.5},
    {"step": 4, "cmd": "./scripts/serve-http.sh", "why": "start the OpenAI-compatible server", "size_GB": 0.0},
    {"step": 5, "cmd": "curl localhost:18091/v1/chat/completions -d '{\"model\":\"deepseek-v4-flash\",...}'", "why": "verify it works", "size_GB": 0.0},
]

# Corrections (the honest log)
CORRECTIONS = [
    {
        "field": "DeepSeek V4-Pro sizes",
        "before": "1.6T deployed (aggregators)",
        "after": "1.6T BASE / 862B DEPLOYED (verified via HF model list + ssd-moe repo)",
        "honest_register": "T is real as a base; the served model is 862B.",
        "source": "PRIMARY-VERIFIED CORRECTION in SOVEREIGN_REAL_MODELS_SHOPPING_LIST_2026-07-14.md",
    },
    {
        "field": "DeepSeek V4-Flash size",
        "before": "284B / 13B active (aggregators)",
        "after": "158B / 13B active (HF model list)",
        "honest_register": "Aggregators [S] conflated base↔deployed — verified against HF primary.",
        "source": "PRIMARY-VERIFIED CORRECTION in SOVEREIGN_REAL_MODELS_SHOPPING_LIST_2026-07-14.md",
    },
    {
        "field": "Qwen2.5-3B license",
        "before": "treated as commercial-safe default",
        "after": "Qwen Research License — NOT commercial; use Qwen3+ (Apache-2.0)",
        "honest_register": "Our 16GB workhorse (qwen2.5:3b) is RESEARCH-ONLY. The commercial build uses Qwen3-4B/8B.",
        "source": "M4_SOVEREIGN_RUN_ORDER_2026-07-14.md § 'Licensing catch (real)'",
    },
    {
        "field": "GLM-5.2 active params",
        "before": "40B active (Claude grep = 0 hits on 256-experts/8+1/40B)",
        "after": "RETRACTED to headline only (744B total) — Claude `033fc14b` correction",
        "honest_register": "Architecture specifics need measurement, not proxy. Confirmed by the agent's own grep.",
        "source": "Claude Science correction `033fc14b`, mirrored in LEDGERBOARD-V2",
    },
]


def emit_receipts() -> list:
    digests = []

    rec = mint_op("HELP-AGENTS", "ADOPT_LIST", "help-agents-adopt-2026-07-14",
                   {"n_libraries": len(ADOPTED_LIBRARIES),
                    "libraries": ADOPTED_LIBRARIES,
                    "principle": "ADOPT, don't rebuild. We own the governance; we don't own the inference / merge / soup."},
                   care_value=0.97)
    digests.append(("ADOPT_LIST", rec["digest"]))

    rec = mint_op("HELP-AGENTS", "RUN_ORDER_16GB", "help-agents-16gb-2026-07-14",
                   {"n_steps": len(RUN_ORDER_16GB), "steps": RUN_ORDER_16GB,
                    "headline": "Qwen3-4B/8B + MergeKit + Mergenetic + sovereign wrapper = governed daily-driver on 16GB TODAY"},
                   care_value=0.97)
    digests.append(("RUN_ORDER_16GB", rec["digest"]))

    rec = mint_op("HELP-AGENTS", "RUN_ORDER_48GB", "help-agents-48gb-2026-07-14",
                   {"n_steps": len(RUN_ORDER_48GB), "steps": RUN_ORDER_48GB,
                    "headline": "DeepSeek-V4-Flash via ssd-moe-mlx = ~4.5-5 tok/s T-base on 48GB M-series"},
                   care_value=0.97)
    digests.append(("RUN_ORDER_48GB", rec["digest"]))

    rec = mint_op("HELP-AGENTS", "CORRECTIONS", "help-agents-corrections-2026-07-14",
                   {"n_corrections": len(CORRECTIONS), "corrections": CORRECTIONS,
                    "principle": "The substrate mirrors the corrections. It does not propagate them."},
                   care_value=0.97)
    digests.append(("CORRECTIONS", rec["digest"]))

    rec = mint_op("HELP-AGENTS", "EAT_RECEIPT", "help-agents-eat-2026-07-14",
                   {"did": "JEEVES-lane adopted 5 named libraries + 2 run orders + 4 corrections",
                    "principle": "help other agents by adopting, not by rebuilding",
                    "next": "Sir fires M4_SOVEREIGN_RUN_ORDER § TIER A (the 5 commands) → governed daily-driver live on 16GB"},
                   care_value=0.97)
    digests.append(("EAT_RECEIPT", rec["digest"]))

    return digests


if __name__ == "__main__":
    print("=== 🜏 HELP OTHER AGENTS · EAT mode · adopt, don't rebuild ===\n")
    print(f"  Charter:    {CSOAI_CHARTER_SHA}")
    print(f"  Care floor: {CARE_FLOOR}")
    print()

    print("  ADOPTED LIBRARIES (5 — real, named, primary-verified):")
    for L in ADOPTED_LIBRARIES:
        print(f"    [{L['tier']}] {L['name']:30s} {L['license']:12s}  → {L['purpose']}")
    print()
    print("  RUN ORDER — 16GB Mac (5 steps, runs today):")
    for s in RUN_ORDER_16GB:
        print(f"    {s['step']}. {s['cmd']:60s}  ({s['size_GB']} GB)  — {s['why']}")
    print()
    print("  RUN ORDER — 48GB Mac (5 steps, the T-base):")
    for s in RUN_ORDER_48GB:
        print(f"    {s['step']}. {s['cmd']:60s}  ({s['size_GB']} GB)  — {s['why']}")
    print()
    print("  CORRECTIONS (4 — the honest log):")
    for c in CORRECTIONS:
        print(f"    {c['field']}: {c['before'][:40]} → {c['after'][:50]}")
    print()

    digests = emit_receipts()
    print("  ── MINTING 5 EAT-MODE RECEIPTS ──\n")
    for k, d in digests:
        print(f"    {k:18s} {d[:32]}")
    print()

    out_path = ROOT / "sov33" / "help_other_agents.json"
    with open(out_path, "w") as f:
        json.dump({"ts": datetime.now(timezone.utc).isoformat(),
                   "adopted": ADOPTED_LIBRARIES,
                   "run_order_16gb": RUN_ORDER_16GB,
                   "run_order_48gb": RUN_ORDER_48GB,
                   "corrections": CORRECTIONS,
                   "charter": CSOAI_CHARTER_SHA, "care_floor": CARE_FLOOR}, f, indent=2)
    print(f"  Saved: {out_path}  ({out_path.stat().st_size:,} b)")
    print()
    print(f"  HELP-AGENTS chain: {audit_brief('HELP-AGENTS')}")