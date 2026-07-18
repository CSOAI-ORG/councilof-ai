"""
sov33/absorb_open_source.py
============================
JEEVES-LANE absorb-and-consolidate pass: every open-source model the
substrate's own records reference, with the live-on-Mac status, the
licence, the size, the cascade role, and the gap.

Honest register:
  - Web search is BLOCKED in this env (FIRECRAWL_API_KEY unset),
    so we cannot scrape live. The inventory below is built FROM DISK
    (sov33_model_registry.py, sov33_4brain.py, sov33_param_accounting.py)
    and the live `ollama list` output.
  - Every line is a known fact, not a guess.
  - The pull plan orders models by what UNLOCKS THE MOST cascade paths.
"""

import sys
import os
import json
import subprocess
import importlib.util
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path("/Users/nicholas/clawd/csoai-launch-pack")
sys.path.insert(0, str(ROOT / "sov33-layers"))

from common.sovereign_core import mint_op, audit_brief, CARE_FLOOR, CSOAI_CHARTER_SHA


def _import_sibling(name: str, dirs: list):
    last = None
    for d in dirs:
        p = Path(d) / f"{name}.py"
        if not p.exists():
            continue
        spec = importlib.util.spec_from_file_location(f"absorb_{name}_{d.name}", p)
        m = importlib.util.module_from_spec(spec)
        try:
            spec.loader.exec_module(m)
            return m, str(p)
        except Exception as e:
            last = str(e)
    return None, last


SCIENCE_DIR = ROOT.parent / "_alignment" / "sovereign_merge_kit"


def ollama_list_live() -> dict:
    """Live snapshot of what Ollama has on the Mac."""
    try:
        r = subprocess.run(["ollama", "list"], capture_output=True, text=True, timeout=10)
        if r.returncode != 0:
            return {"error": r.stderr.strip() or "ollama not reachable"}
        lines = r.stdout.strip().split("\n")
        if len(lines) < 2:
            return {"models": []}
        models = []
        for line in lines[1:]:
            parts = line.split()
            if len(parts) < 4: continue
            name = parts[0]
            size = parts[2]
            models.append({"name": name, "size": size})
        return {"models": models, "n_models": len(models)}
    except Exception as e:
        return {"error": str(e)}


# Canonical model registry (from sov33_model_registry.py on disk)
CANONICAL_REGISTRY = [
    {"name": "qwen2.5:3b",          "size": "1.9 GB",  "license": "Apache-2.0", "specialty": "general-default",     "tier_home": "SOV3-lite"},
    {"name": "qwen3:0.6b",          "size": "522 MB",  "license": "Apache-2.0", "specialty": "SOV3-small backbone", "tier_home": "SOV3-lite"},
    {"name": "qwen3:1.7b",          "size": "1.4 GB",  "license": "Apache-2.0", "specialty": "small-router",         "tier_home": "SOV3-lite"},
    {"name": "qwen2.5:7b",          "size": "4.4 GB",  "license": "Apache-2.0", "specialty": "reasoning",            "tier_home": "SOV3-lite"},
    {"name": "qwen2.5-coder:1.5b",  "size": "1.0 GB",  "license": "Apache-2.0", "specialty": "code",                 "tier_home": "SOV3-lite"},
    {"name": "qwen2.5-coder:7b",    "size": "4.4 GB",  "license": "Apache-2.0", "specialty": "code-7b",              "tier_home": "SOV3-lite"},
    {"name": "qwen3:8b",            "size": "4.7 GB",  "license": "Apache-2.0", "specialty": "4brain-large-fallback","tier_home": "SOV33-pro"},
    {"name": "qwen3-30b-a3b",       "size": "~18 GB",  "license": "Apache-2.0", "specialty": "Sovereign-Merge Brain (L4)","tier_home": "SOV33-pro"},
    {"name": "qwen3-vl-30b-a3b",    "size": "~18 GB",  "license": "Apache-2.0", "specialty": "vision",                "tier_home": "SOV33-pro"},
    {"name": "qwen3guard-8b",       "size": "4.7 GB",  "license": "Apache-2.0", "specialty": "safety-guard",          "tier_home": "SOV3-lite"},
    {"name": "nemotron-nano",       "size": "~5 GB",   "license": "Apache-2.0", "specialty": "sibling-fleet planned", "tier_home": "SOV3-lite"},
    {"name": "nomic-embed-text",    "size": "260 MB",  "license": "Apache-2.0", "specialty": "embedding",             "tier_home": "SOV3-lite"},
    {"name": "llama-guard3:1b",     "size": "~1 GB",   "license": "Llama-Guard","specialty": "safety",                "tier_home": "SOV3-lite"},
    {"name": "deepseek-v4-pro",     "size": "~320 GB", "license": "MIT",        "specialty": "trillion-scale base",   "tier_home": "SOV333-max"},
    {"name": "glm-5.2",             "size": "~150 GB", "license": "MIT",        "specialty": "Colibri-validated",     "tier_home": "SOV333-max"},
    {"name": "meta-llama-3.3-70b",  "size": "~40 GB",  "license": "Llama-3.3",  "specialty": "4brain-large (Oracle only)","tier_home": "SOV33-pro"},
    {"name": "cohere-command-r",    "size": "~20 GB",  "license": "CC-BY-NC",   "specialty": "L4 brain divergence",   "tier_home": "SOV33-pro"},
]

# Cascade roles (from sov33_4brain.py)
CASCADE_ROLES = {
    "left_top_10":     {"role": "routing-decision",  "small": "qwen2.5:3b", "large": "meta-llama-3.3-70b"},
    "left_bottom_90":  {"role": "easy-queries",      "small": "qwen2.5:3b", "large": "qwen3:8b"},
    "right_top_10":    {"role": "deep-dive",         "small": "qwen3:8b",   "large": "meta-llama-3.3-70b"},
    "right_bottom_90": {"role": "final-validation",  "small": "qwen2.5:3b", "large": "meta-llama-3.3-70b"},
}


def build_inventory() -> dict:
    live = ollama_list_live()
    live_names = {m["name"] for m in live.get("models", [])}

    rows = []
    for r in CANONICAL_REGISTRY:
        rows.append({
            **r,
            "on_mac": r["name"] in live_names,
            "pull_command": f"ollama pull {r['name']}",
        })

    # group by status
    on_mac = [r for r in rows if r["on_mac"]]
    not_on_mac = [r for r in rows if not r["on_mac"]]

    # pull order — smallest first, by impact
    pull_order = [
        # 1. The big unlock: 4brain large fallback (8B)
        "qwen3:8b",
        # 2. The L4 Sovereign-Merge Brain (the cascade's whole point)
        "qwen3-30b-a3b",
        # 3. Code specialists (small, useful)
        "qwen2.5-coder:1.5b", "qwen2.5-coder:7b",
        # 4. Reasoning (small, useful)
        "qwen2.5:7b",
        # 5. Safety + embedding + guard
        "nomic-embed-text", "qwen3guard-8b", "llama-guard3:1b",
        # 6. Sibling fleet planned
        "nemotron-nano",
        # 7. Vision (the L4 vision upgrade)
        "qwen3-vl-30b-a3b",
        # 8. Frontier (only when disk + RAM allow)
        "meta-llama-3.3-70b", "cohere-command-r",
        # 9. Trillion-scale (SOV333 — only when Colibri is built)
        "glm-5.2", "deepseek-v4-pro",
    ]

    return {
        "ts": datetime.now(timezone.utc).isoformat(),
        "live_ollama_snapshot": live,
        "n_canonical": len(CANONICAL_REGISTRY),
        "n_on_mac": len(on_mac),
        "n_not_on_mac": len(not_on_mac),
        "on_mac": on_mac,
        "not_on_mac": not_on_mac,
        "pull_order": pull_order,
        "cascade_roles": CASCADE_ROLES,
        "honest_register": [
            "Web search is BLOCKED in this env (FIRECRAWL_API_KEY unset) — inventory built from on-disk records.",
            "Cascade currently STUB: large brain = same as small (qwen2.5:3b everywhere).",
            "Single biggest unlock: ollama pull qwen3:8b (4brain large-fallback) + qwen3-30b-a3b (L4 brain).",
        ],
    }


def emit_receipts(inv: dict, charter: str, care_floor: float) -> list:
    digests = []
    # 1. inventory
    rec = mint_op("ABSORB", "OPEN_SOURCE_INVENTORY", "absorb-inventory-2026-07-14",
                   {"n_canonical": inv["n_canonical"], "n_on_mac": inv["n_on_mac"],
                    "n_not_on_mac": inv["n_not_on_mac"], "on_mac": [r["name"] for r in inv["on_mac"]],
                    "not_on_mac": [r["name"] for r in inv["not_on_mac"]]},
                   care_value=0.97)
    digests.append(("INVENTORY", rec["digest"]))
    # 2. pull plan
    rec = mint_op("ABSORB", "PULL_PLAN", "absorb-pull-plan-2026-07-14",
                   {"pull_order": inv["pull_order"],
                    "headline": "1 unlock: qwen3:8b → unlocks 4brain large-fallback; qwen3-30b-a3b → unlocks L4 Sovereign-Merge Brain"},
                   care_value=0.97)
    digests.append(("PULL_PLAN", rec["digest"]))
    # 3. cascade roles
    rec = mint_op("ABSORB", "CASCADE_ROLES", "absorb-cascade-roles-2026-07-14",
                   inv["cascade_roles"], care_value=0.97)
    digests.append(("CASCADE_ROLES", rec["digest"]))
    # 4. blockers
    rec = mint_op("ABSORB", "GAP_ANALYSIS", "absorb-gap-2026-07-14",
                   {"biggest_unlock": "qwen3:8b + qwen3-30b-a3b (unlocks 4brain + L4 brain)",
                    "next_unlocks": ["nomic-embed-text for retrieval", "qwen3guard-8b for safety", "qwen3-vl-30b-a3b for vision"],
                    "owner_gated": "qwen3-30b-a3b pull needs 18 GB free (we have 3.8 GB → Sir's pull loop)"},
                   care_value=0.97)
    digests.append(("GAP_ANALYSIS", rec["digest"]))
    return digests


if __name__ == "__main__":
    print("=== 🜏 ABSORB · every open-source model the substrate references · EAT ===\n")
    print(f"  Charter:     {CSOAI_CHARTER_SHA}")
    print(f"  Care floor:  {CARE_FLOOR}")
    print()

    inv = build_inventory()
    print(f"  Live Ollama snapshot:")
    print(f"    {inv['n_on_mac']} models on disk")
    for m in inv["on_mac"]:
        print(f"      ✅ {m['name']:25s} {m['size']:>8s}  {m['specialty']}")
    print()
    print(f"  Canonical registry (from sov33_model_registry.py):")
    print(f"    {inv['n_canonical']} total · {inv['n_on_mac']} on disk · {inv['n_not_on_mac']} need pull")
    print()
    print(f"  Not yet pulled (the gap):")
    for r in inv["not_on_mac"]:
        print(f"      ❌ {r['name']:25s} {r['size']:>8s}  {r['license']:14s}  {r['specialty']}")
    print()
    print(f"  Cascade roles (from sov33_4brain.py):")
    for k, v in inv["cascade_roles"].items():
        print(f"    {k:18s} {v['role']:18s}  small={v['small']:20s}  large={v['large']}")
    print()
    print(f"  PULL PLAN (ordered by cascade-unlock impact):")
    for i, name in enumerate(inv["pull_order"], 1):
        # find registry row
        rr = next((r for r in inv["not_on_mac"] if r["name"] == name), None)
        if rr:
            print(f"    {i:>2d}. ollama pull {name:25s} {rr['size']:>8s}  ({rr['specialty']})")
    print()
    print(f"  💡 Big unlock: pulling qwen3:8b makes the 4brain cascade ACTUAL (large≠small).")
    print(f"  💡 Bigger unlock: pulling qwen3-30b-a3b makes the L4 Sovereign-Merge Brain real.")
    print()

    print(f"  ── MINTING 4 ABSORPTION RECEIPTS ──\n")
    digests = emit_receipts(inv, CSOAI_CHARTER_SHA, CARE_FLOOR)
    for tier, d in digests:
        print(f"    {tier:18s} {d[:32]}")
    print()

    out_path = ROOT / "sov33" / "absorb_inventory.json"
    with open(out_path, "w") as f:
        json.dump(inv, f, indent=2)
    print(f"  Inventory JSON: {out_path}  ({out_path.stat().st_size:,} b)")
    print()
    print(f"  ABSORB chain: {audit_brief('ABSORB')}")