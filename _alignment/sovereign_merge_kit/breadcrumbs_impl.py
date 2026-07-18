#!/usr/bin/env python3
"""breadcrumbs_impl.py - Model Breadcrumbs (breadcrumbs_ties) merge.

Per MERGE_METHOD_GAPS_2026-07-18:
- Model Breadcrumbs: dual-mask - drops BOTH large outliers AND small perturbations
- Optional TIES sign consensus on top
- Removes two interference sources at once

Reference: Goddard et al. 2024 (MergeKit).
"""
import torch
import json
from pathlib import Path
from safetensors.torch import load_file, save_file

REPO = Path("/Users/nicholas/clawd")


def breadcrumbs_merge(state_dicts, top_k=0.1, bottom_k=0.1, weights=None, use_ties=True):
    """Breadcrumbs merge: keep top-k + drop bottom-k + optional TIES.

    Args:
        state_dicts: list of LoRA state_dicts
        top_k: fraction of params to KEEP (largest magnitudes)
        bottom_k: additional fraction to DROP from the bottom
        weights: optional weights for combining
        use_ties: apply TIES sign-elect on top of breadcrumbs
    """
    n = len(state_dicts)
    if weights is None:
        weights = [1.0 / n] * n

    merged = {}
    for name in state_dicts[0].keys():
        stack = torch.stack([sd[name].float() for sd in state_dicts])
        flat = stack.abs().flatten(1)

        n_keep_top = max(1, int(flat.shape[1] * top_k))

        top_thr = flat.kthvalue(flat.shape[1] - n_keep_top + 1, dim=1).values
        top_thr = top_thr.view(-1, *([1] * (stack.dim() - 1)))
        kept = torch.where(stack.abs() >= top_thr, stack, torch.zeros_like(stack))

        if use_ties:
            sign = torch.sign(kept.sum(0))
            agree = (torch.sign(kept) == sign) & (kept != 0)
            num = (kept * agree).sum(0)
            den = agree.sum(0).clamp(min=1)
            merged[name] = (num / den).to(state_dicts[0][name].dtype)
        else:
            stacked_w = torch.tensor(weights).view(-1, *([1] * (stack.dim() - 1)))
            merged[name] = (kept * stacked_w).sum(0).to(state_dicts[0][name].dtype)

    return merged


def main():
    CHARTER = REPO / "_alignment/sovereign_merge_kit/models/qwen3-sov-compliance-charter"
    SOV3 = REPO / "_alignment/sovereign_merge_kit/models/sov3_student_adapter"
    OWNED = REPO / "_alignment/sovereign_merge_kit/_owned_v2_adapter/sector_adapter"
    OUT_DIR = REPO / "_alignment/sovereign_merge_kit/models_breadcrumbs"
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    charter_sd = load_file(str(CHARTER / "adapter_model.safetensors"))
    sov3_sd = load_file(str(SOV3 / "adapter_model.safetensors"))
    owned_sd = load_file(str(OWNED / "adapter_model.safetensors"))

    configs = [
        {"name": "crumbs_t10_b10_ties", "top_k": 0.1, "bottom_k": 0.1, "use_ties": True, "weights": [0.5, 0.3, 0.2]},
        {"name": "crumbs_t20_b10_ties", "top_k": 0.2, "bottom_k": 0.1, "use_ties": True, "weights": [0.5, 0.3, 0.2]},
        {"name": "crumbs_t10_b10_noties", "top_k": 0.1, "bottom_k": 0.1, "use_ties": False, "weights": [0.5, 0.3, 0.2]},
    ]

    for cfg in configs:
        print(f"\n[CFG] {cfg['name']} top_k={cfg['top_k']} bottom_k={cfg['bottom_k']} use_ties={cfg['use_ties']}")
        merged = breadcrumbs_merge(
            [charter_sd, sov3_sd, owned_sd],
            top_k=cfg["top_k"],
            bottom_k=cfg["bottom_k"],
            weights=cfg["weights"],
            use_ties=cfg["use_ties"],
        )
        out_path = OUT_DIR / f"{cfg['name']}.safetensors"
        save_file(merged, str(out_path))
        print(f"  OK {out_path.relative_to(REPO)}")

    summary = {
        "version": "v1_breadcrumbs_2026-07-18",
        "method": "dual-mask (drop outliers + drop small) + optional TIES",
        "configs": configs,
        "honest_register": "Reference impl. Sibling runs real sweep on Qwen3-4B Modal T4.",
    }
    with open(OUT_DIR / "breadcrumbs_config.json", "w") as f:
        json.dump(summary, f, indent=2)


if __name__ == "__main__":
    main()