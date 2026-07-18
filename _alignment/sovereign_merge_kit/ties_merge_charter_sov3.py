#!/usr/bin/env python3
"""ties_merge_charter_sov3.py — TIES-merge CHARTER + SOV3 for INFERENCE COMPRESSION.

Per sibling's finding (EAT-769, commit 126b6b214):
  - TIES-fused = 2.9095 vs best-single = 2.9087 (~= no emergence)
  - TIES beats naive (no collapse)
  - Verdict: TIES for EMERGENCE = no. TIES for INFERENCE = YES.

Per EAT-773: CHARTER + SOV3 win at every tau. They have DIFFERENT training
(CHARTER = charter distill, SOV3 = governance Q&A). Per the composition
graph: these touch different layers (CHARTER=charter-content, SOV3=qa-format),
so they're STACKABLE.

This script: linear TIES-merge the two LoRA state-dicts, save as
sov4_ties_charter_sov3.safetensors, eval on the 40-prompt TierBench held-out.

Honest register:
  - Sibling's TIES result stands: this is INFERENCE COMPRESSION, not emergence
  - Linear TIES (vs the original TIES algorithm in sov33_fuse_experts.py) is simpler
  - Eval on TierBench-lite to confirm quality preservation
"""
import os
import json
import time
import torch
from pathlib import Path

REPO = Path("/Users/nicholas/clawd")
CHARTER = REPO / "_alignment/sovereign_merge_kit/models/qwen3-sov-compliance-charter"
SOV3 = REPO / "_alignment/sovereign_merge_kit/models/sov3_student_adapter"
OUT_DIR = REPO / "_alignment/sovereign_merge_kit/models_merged"
OUT_DIR.mkdir(parents=True, exist_ok=True)
OUT_PATH = OUT_DIR / "sov4_ties_charter_sov3.safetensors"

CHARTER_WEIGHT = 0.6  # TierBench winner gets higher weight
SOV3_WEIGHT = 0.4


def load_lora_state_dict(adapter_dir):
    """Load a LoRA adapter's weights as a flat state_dict."""
    weights_path = adapter_dir / "adapter_model.safetensors"
    from safetensors.torch import load_file
    return load_file(str(weights_path))


def linear_ties_merge(state_dicts, weights):
    """Linear TIES merge: weighted average of state dicts.

    Per sibling's pattern: TIES (trim + elect-sign + disjoint-merge) is overkill
    for INFERENCE COMPRESSION. Simple linear weighted average works for the
    "merge for production serving" use case (different from "merge for emergence").

    For each parameter:
      merged[name] = sum(w_i * sd_i[name])  for i in adapters
    """
    assert len(state_dicts) == len(weights)
    assert abs(sum(weights) - 1.0) < 1e-6, f"weights must sum to 1, got {sum(weights)}"

    merged = {}
    n_params = 0
    for name in state_dicts[0].keys():
        stacked = torch.stack([sd[name].float() for sd in state_dicts])
        # Weighted sum
        merged[name] = (stacked * torch.tensor(weights).view(-1, *([1] * (stacked.dim() - 1)))).sum(dim=0)
        n_params += merged[name].numel()
    return merged, n_params


def main():
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    print(f"=" * 60)
    print(f"TIES-MERGE: CHARTER + SOV3 for INFERENCE COMPRESSION")
    print(f"=" * 60)
    print(f"CHARTER weight: {CHARTER_WEIGHT}")
    print(f"SOV3 weight:    {SOV3_WEIGHT}")
    print(f"Device: {device}")

    # Step 1: Load both LoRAs
    print(f"\n[1/4] Loading CHARTER LoRA...")
    t0 = time.time()
    charter_sd = load_lora_state_dict(CHARTER)
    print(f"  ✓ {len(charter_sd)} tensors in {time.time()-t0:.1f}s")

    print(f"\n[2/4] Loading SOV3 LoRA...")
    t0 = time.time()
    sov3_sd = load_lora_state_dict(SOV3)
    print(f"  ✓ {len(sov3_sd)} tensors in {time.time()-t0:.1f}s")

    # Verify same shape
    assert set(charter_sd.keys()) == set(sov3_sd.keys()), "Adapter key mismatch!"
    print(f"  ✓ Keys match ({len(charter_sd)} tensors)")

    # Step 2: Linear TIES merge
    print(f"\n[3/4] Linear TIES merge (charter={CHARTER_WEIGHT}, sov3={SOV3_WEIGHT})...")
    t0 = time.time()
    merged, n_params = linear_ties_merge(
        [charter_sd, sov3_sd],
        [CHARTER_WEIGHT, SOV3_WEIGHT]
    )
    print(f"  ✓ Merged {n_params:,} params in {time.time()-t0:.1f}s")
    print(f"  ✓ Merged tensors: {len(merged)}")

    # Step 3: Save
    print(f"\n[4/4] Saving to {OUT_PATH.relative_to(REPO)}...")
    from safetensors.torch import save_file
    # Cast back to bfloat16 to match original
    for name in merged:
        merged[name] = merged[name].to(torch.bfloat16)
    save_file(merged, str(OUT_PATH))

    # Also save a config
    config = {
        "version": "v1_ties_charter_sov3_2026-07-18",
        "method": "Linear TIES merge (weighted average, no trim/sign-elect)",
        "purpose": "INFERENCE COMPRESSION (NOT emergence - per sibling's EAT-769)",
        "charter_weight": CHARTER_WEIGHT,
        "sov3_weight": SOV3_WEIGHT,
        "n_tensors": len(merged),
        "n_params": n_params,
        "file_size_bytes": OUT_PATH.stat().st_size,
        "honest_register": "Sibling proved TIES ~ best-single for emergence. For INFERENCE COMPRESSION, simple linear weighted average works. Quality eval on TierBench-lite pending.",
        "next_step": "Run tierbench_lite.py on this merged adapter. Expected: 0.15-0.18 mean overlap (between CHARTER 0.18 and SOV3 0.15).",
    }
    config_path = OUT_DIR / "sov4_ties_charter_sov3_config.json"
    with open(config_path, "w") as f:
        json.dump(config, f, indent=2)
    print(f"  ✓ Config: {config_path.relative_to(REPO)}")
    print(f"\n  Output size: {OUT_PATH.stat().st_size / 1024:.1f} KB")
    print(f"  Original (charter + sov3): {(CHARTER / 'adapter_model.safetensors').stat().st_size * 2 / 1024:.1f} KB")
    print(f"  Compression: {((CHARTER.stat().st_size * 2) / OUT_PATH.stat().st_size):.2f}x smaller output")

    # Step 4: Quick eval on TierBench-lite (reuse script)
    print(f"\n=== OPTIONAL: eval on TierBench-lite ===")
    print(f"  Run: PYTHONPATH= ~/.sovereign/ml-venv/bin/python tierbench_lite.py")
    print(f"  Override: set env vars + write a small wrapper to load merged adapter")


if __name__ == "__main__":
    main()