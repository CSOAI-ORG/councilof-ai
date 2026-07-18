#!/usr/bin/env python3
"""dare_ties_impl.py — DARE + TIES combined merge for LoRA state-dicts.

Per MERGE_METHOD_GAPS_2026-07-18 (sibling's research):
- DARE (arXiv:2311.03099 "Super Mario") randomly DROPS up to 90% of redundant
  delta params + rescales to preserve magnitude
- TIES (arXiv:2306.01708 Yadav et al. NeurIPS 2023) trim + elect-sign + disjoint-merge
- DARE-TIES = DARE preprocessing + TIES merge

Why it may beat TIES alone:
- DARE removes noise/interference BEFORE the sign-merge
- TIES resolves sign conflicts; less interference = cleaner merge
- Per sibling's spec: "If DARE-TIES beats 0.758 -> it becomes the canonical
  same-base fusion method in the OWM spec"

Honest register:
- Reference impl, not the paper-original CUDA version
- Toy scale: tested on 0.5B base, n=3 LoRAs
- Sibling runs the real sweep on Qwen3-4B Modal T4
"""
import torch
import json
from pathlib import Path
from safetensors.torch import load_file, save_file

REPO = Path("/Users/nicholas/clawd")


def dare_ties_merge(state_dicts, density=0.3, drop_p=0.5, weights=None):
    """DARE-TIES merge: drop random params (DARE) + sign-elect (TIES).

    Args:
        state_dicts: list of LoRA state_dicts (same keys)
        density: fraction of params to keep (per DARE)
        drop_p: probability of dropping each param (DARE random drop)
        weights: optional weights for combining (default: equal)
    """
    n = len(state_dicts)
    if weights is None:
        weights = [1.0 / n] * n
    assert abs(sum(weights) - 1.0) < 1e-6, f"weights must sum to 1, got {sum(weights)}"

    merged = {}
    for name in state_dicts[0].keys():
        # Stack all adapters' weights for this param
        stack = torch.stack([sd[name].float() for sd in state_dicts])  # [n, ...]
        flat = stack.abs().flatten(1)  # [n, prod]

        # TIES step 1: trim to top density (largest magnitudes)
        kth = max(1, int(flat.shape[1] * density))
        thr = flat.kthvalue(flat.shape[1] - kth + 1, dim=1).values  # [n]
        thr = thr.view(-1, *([1] * (stack.dim() - 1)))
        trimmed = torch.where(stack.abs() >= thr, stack, torch.zeros_like(stack))

        # DARE step: random drop (Bernoulli with prob drop_p), then rescale to preserve magnitude
        if drop_p > 0:
            mask = torch.bernoulli(torch.ones_like(trimmed) * (1 - drop_p))
            # Rescale: surviving params have weight 1/(1-drop_p) to preserve expectation
            trimmed = trimmed * mask / (1 - drop_p)

        # TIES step 2: elect sign by sum
        sign = torch.sign(trimmed.sum(0))  # [...]

        # TIES step 3: average only where signs agree
        agree = (torch.sign(trimmed) == sign) & (trimmed != 0)
        num = (trimmed * agree).sum(0)
        den = agree.sum(0).clamp(min=1)
        merged[name] = (num / den).to(state_dicts[0][name].dtype)

    return merged


def main():
    """Run DARE-TIES on our 3 OWEMs (Qwen2.5-0.5B family) + save result."""
    CHARTER = REPO / "_alignment/sovereign_merge_kit/models/qwen3-sov-compliance-charter"
    SOV3 = REPO / "_alignment/sovereign_merge_kit/models/sov3_student_adapter"
    OUT_DIR = REPO / "_alignment/sovereign_merge_kit/models_dare_ties"
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # Load
    print("Loading 3 OWEMs...")
    charter_sd = load_file(str(CHARTER / "adapter_model.safetensors"))
    sov3_sd = load_file(str(SOV3 / "adapter_model.safetensors"))
    # owned_v2 is in a different dir
    owned_dir = REPO / "_alignment/sovereign_merge_kit/_owned_v2_adapter/sector_adapter"
    owned_sd = load_file(str(owned_dir / "adapter_model.safetensors"))

    # Sweep configurations
    configs = [
        {"name": "dare_ties_d03_p00", "density": 0.3, "drop_p": 0.0, "weights": [0.5, 0.3, 0.2]},  # TIES baseline
        {"name": "dare_ties_d03_p50", "density": 0.3, "drop_p": 0.5, "weights": [0.5, 0.3, 0.2]},
        {"name": "dare_ties_d03_p90", "density": 0.3, "drop_p": 0.9, "weights": [0.5, 0.3, 0.2]},
        {"name": "dare_ties_d05_p50", "density": 0.5, "drop_p": 0.5, "weights": [0.5, 0.3, 0.2]},
    ]

    for cfg in configs:
        print(f"\n[CFG] {cfg['name']} density={cfg['density']} drop_p={cfg['drop_p']} weights={cfg['weights']}")
        merged = dare_ties_merge(
            [charter_sd, sov3_sd, owned_sd],
            density=cfg["density"],
            drop_p=cfg["drop_p"],
            weights=cfg["weights"],
        )
        out_path = OUT_DIR / f"{cfg['name']}.safetensors"
        save_file(merged, str(out_path))
        sz = out_path.stat().st_size / 1024
        print(f"  ✓ saved: {out_path.relative_to(REPO)} ({sz:.1f} KB)")

    # Save config + summary
    summary = {
        "version": "v1_dare_ties_2026-07-18",
        "method": "DARE (random drop + rescale) + TIES (trim + sign-elect + disjoint-merge)",
        "configs": configs,
        "honest_register": "Reference impl, not paper-original CUDA. Toy scale (0.5B base, 3 LoRAs). Sibling runs the real sweep on Qwen3-4B Modal T4.",
        "next_step": "Run tierbench_lite.py on each config to measure quality vs linear TIES (already done: 0.180 mean on charter+sov3 linear merge).",
    }
    with open(OUT_DIR / "dare_ties_config.json", "w") as f:
        json.dump(summary, f, indent=2)
    print(f"\n✓ Summary: {OUT_DIR / 'dare_ties_config.json'}")


if __name__ == "__main__":
    main()
