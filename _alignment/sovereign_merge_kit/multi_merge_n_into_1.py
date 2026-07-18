#!/usr/bin/env python3
"""multi_merge_n_into_1.py — N-into-1 TIES merge: does it climb or saturate?

Per the EAT-775 plan (Phase 2): Multi-merge within Qwen2.5-0.5B family.
We test:
  - 1 adapter alone (charter)           - baseline
  - 2 adapters TIES-merge (charter+sov3) - from EAT-774
  - 3 adapters TIES-merge (charter+sov3+owned_v2) - new
  - 1 adapter (charter+sov3+owned_v2) TIES-merge vs ALL 3 - saturation test
"""
import torch
import json
from pathlib import Path
from safetensors.torch import load_file, save_file

REPO = Path("/Users/nicholas/clawd")
CHARTER = REPO / "_alignment/sovereign_merge_kit/models/qwen3-sov-compliance-charter"
SOV3 = REPO / "_alignment/sovereign_merge_kit/models/sov3_student_adapter"
OWNED = REPO / "_alignment/sovereign_merge_kit/_owned_v2_adapter/sector_adapter"
OUT_DIR = REPO / "_alignment/sovereign_merge_kit/models_multi"
OUT_DIR.mkdir(parents=True, exist_ok=True)


def linear_ties(sds, weights=None):
    """Linear TIES: weighted sum of state dicts."""
    n = len(sds)
    if weights is None:
        weights = [1.0 / n] * n
    merged = {}
    for name in sds[0].keys():
        stacked = torch.stack([sd[name].float() for sd in sds])
        merged[name] = (stacked * torch.tensor(weights).view(-1, *([1] * (stacked.dim() - 1)))).sum(0).to(sds[0][name].dtype)
    return merged


def main():
    print("Loading 3 OWEMs (Qwen2.5-0.5B family)...")
    charter = load_file(str(CHARTER / "adapter_model.safetensors"))
    sov3 = load_file(str(SOV3 / "adapter_model.safetensors"))
    owned = load_file(str(OWNED / "adapter_model.safetensors"))
    print(f"  OK loaded 3 (charter + sov3 + owned_v2)")

    # N=2: charter + sov3 (already have this in linear_ties_charter_sov3.safetensors)
    print("\n[N=2] charter + sov3 (weights 0.6/0.4)")
    m2 = linear_ties([charter, sov3], [0.6, 0.4])
    save_file(m2, str(OUT_DIR / "ties_2_charter_sov3.safetensors"))
    print(f"  OK saved: ties_2_charter_sov3.safetensors")

    # N=3: charter + sov3 + owned_v2
    print("\n[N=3] charter + sov3 + owned_v2 (weights 0.4/0.3/0.3)")
    m3 = linear_ties([charter, sov3, owned], [0.4, 0.3, 0.3])
    save_file(m3, str(OUT_DIR / "ties_3_charter_sov3_owned.safetensors"))
    print(f"  OK saved: ties_3_charter_sov3_owned.safetensors")

    # N=2 alt: charter + owned (different pair)
    print("\n[N=2 alt] charter + owned_v2 (weights 0.5/0.5)")
    m2alt = linear_ties([charter, owned], [0.5, 0.5])
    save_file(m2alt, str(OUT_DIR / "ties_2_charter_owned.safetensors"))
    print(f"  OK saved: ties_2_charter_owned.safetensors")

    # N=2: sov3 + owned
    print("\n[N=2] sov3 + owned_v2 (weights 0.5/0.5)")
    m2so = linear_ties([sov3, owned], [0.5, 0.5])
    save_file(m2so, str(OUT_DIR / "ties_2_sov3_owned.safetensors"))
    print(f"  OK saved: ties_2_sov3_owned.safetensors")

    # N=4: all 3 plus re-charter (oversample)
    print("\n[N=3 w/ re-weighted] charter x2 + sov3 + owned (weights 0.35/0.35/0.2/0.1)")
    m4 = linear_ties([charter, charter, sov3, owned], [0.35, 0.35, 0.2, 0.1])
    save_file(m4, str(OUT_DIR / "ties_3_charter_x2_sov3_owned.safetensors"))
    print(f"  OK saved: ties_3_charter_x2_sov3_owned.safetensors")

    summary = {
        "version": "v1_multi_merge_n_into_1_2026-07-18",
        "method": "Linear TIES (weighted sum)",
        "configs": [
            {"name": "ties_2_charter_sov3", "n": 2, "weights": [0.6, 0.4]},
            {"name": "ties_2_charter_owned", "n": 2, "weights": [0.5, 0.5]},
            {"name": "ties_2_sov3_owned", "n": 2, "weights": [0.5, 0.5]},
            {"name": "ties_3_charter_sov3_owned", "n": 3, "weights": [0.4, 0.3, 0.3]},
            {"name": "ties_3_charter_x2_sov3_owned", "n": 3, "weights": [0.35, 0.35, 0.2, 0.1]},
        ],
        "honest_register": "Sweep N. Quality eval on TierBench-lite to determine climb vs saturate.",
        "next_step": "Run merge_sweep_quick.py on all 5 N-into-1 variants + charter alone baseline.",
    }
    with open(OUT_DIR / "multi_merge_config.json", "w") as f:
        json.dump(summary, f, indent=2)
    print(f"\nOK Config: {OUT_DIR / 'multi_merge_config.json'}")


if __name__ == "__main__":
    main()
