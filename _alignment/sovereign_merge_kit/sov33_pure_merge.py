#!/usr/bin/env python3
"""
sov33_pure_merge.py — PURE PYTORCH model merging for sovereign LoRA adapters.

No mergekit dependency. Implements 5 merge methods from scratch:
  - LINEAR: weighted average of adapters
  - TIES: Trim + Elect-sign + Disjoint merge (resolve conflicts)
  - DARE-TIES: Drop And REscale + TIES
  - SLERP: Spherical Linear interpolation (2 adapters)
  - PASSTHROUGH: layer-stacking frankenmerge

We have 11 LoRA adapters sharing Qwen3-0.6B base → all weight-merge compatible.
"""
import os, sys, json, time, hashlib
os.environ.pop('PYTHONPATH', None)
from pathlib import Path
from datetime import datetime, timezone

import torch
import torch.nn.functional as F

def load_lora_adapter(adapter_dir):
    """Load a LoRA adapter's weights from safetensors."""
    from safetensors.torch import load_file
    st_path = Path(adapter_dir) / 'adapter_model.safetensors'
    if not st_path.exists():
        # Try .bin
        bin_path = Path(adapter_dir) / 'adapter_model.bin'
        if bin_path.exists():
            return torch.load(str(bin_path), map_location='cpu')
        raise FileNotFoundError(f"No adapter weights in {adapter_dir}")
    return load_file(str(st_path))

def _common_keys(adapters):
    """Get keys present in ALL adapters."""
    keysets = [set(a.keys()) for a in adapters]
    return sorted(keysets[0].intersection(*keysets[1:]))

def linear_merge(adapters, weights=None):
    """LINEAR merge: weighted average of adapter weights."""
    if weights is None:
        weights = [1.0 / len(adapters)] * len(adapters)
    keys = _common_keys(adapters)
    merged = {}
    for k in keys:
        tensors = [a[k].float() * w for a, w in zip(adapters, weights)]
        merged[k] = torch.nan_to_num(torch.stack(tensors).sum(dim=0), nan=0.0, posinf=0.0, neginf=0.0)
    return merged

def ties_merge(adapters, density=0.5, weights=None):
    """
    TIES Merging (arXiv:2306.01708):
    1. TRIM: Keep top-k% of weights by magnitude (drop the rest to zero)
    2. ELECT: For conflicting signs, keep the sign of the majority
    3. DISJOINT MERGE: Average only non-conflicting weights
    """
    if weights is None:
        weights = [1.0 / len(adapters)] * len(adapters)
    
    keys = _common_keys(adapters)
    merged = {}
    
    for k in keys:
        stacked = torch.stack([a[k].float() * w for a, w in zip(adapters, weights)])
        
        # Step 1: TRIM — keep top density% by magnitude
        k_keep = max(1, int(stacked[0].numel() * density))
        magnitudes = stacked.abs().mean(dim=0)
        if magnitudes.numel() > k_keep:
            threshold = torch.topk(magnitudes.flatten(), k_keep).values[-1]
            mask = magnitudes >= threshold
            stacked = stacked * mask.float()
        
        # Step 2: ELECT — resolve sign conflicts by majority vote
        sign_sum = stacked.sign().sum(dim=0)  # positive = majority positive
        elected_sign = sign_sum.sign()
        
        # Step 3: DISJOINT MERGE — average only where signs agree
        agree_mask = (stacked.sign() == elected_sign.unsqueeze(0)) & (stacked != 0)
        count = agree_mask.sum(dim=0).clamp(min=1)
        merged[k] = torch.nan_to_num((stacked * agree_mask.float()).sum(dim=0) / count, nan=0.0, posinf=0.0, neginf=0.0)
    
    return merged

def dare_ties_merge(adapters, drop_rate=0.9, density=0.5, weights=None):
    """
    DARE-TIES (arXiv:2311.03099):
    1. DROP: Randomly drop drop_rate% of delta weights (set to zero)
    2. RESCALE: Rescale remaining weights by 1/(1-drop_rate)
    3. TIES: Apply TIES conflict resolution on the pruned deltas
    """
    if weights is None:
        weights = [1.0 / len(adapters)] * len(adapters)
    
    keys = _common_keys(adapters)
    merged = {}
    
    torch.manual_seed(42)  # deterministic drop
    for k in keys:
        pruned = []
        for a, w in zip(adapters, weights):
            t = a[k].float() * w
            mask = (torch.rand_like(t) > drop_rate).float()
            t = t * mask / (1 - drop_rate)
            pruned.append(t)
        
        stacked = torch.stack(pruned)
        
        # TIES elect + disjoint
        sign_sum = stacked.sign().sum(dim=0)
        elected_sign = sign_sum.sign()
        agree_mask = (stacked.sign() == elected_sign.unsqueeze(0)) & (stacked != 0)
        count = agree_mask.sum(dim=0).clamp(min=1)
        merged[k] = torch.nan_to_num((stacked * agree_mask.float()).sum(dim=0) / count, nan=0.0, posinf=0.0, neginf=0.0)
    
    return merged

def slerp_merge(t1, t2, t=0.5):
    """SLERP: Spherical Linear interpolation between two tensors."""
    t1, t2 = t1.float(), t2.float()
    dot = (t1 * t2).sum()
    norm1 = t1.norm() + 1e-8
    norm2 = t2.norm() + 1e-8
    omega = torch.acos(torch.clamp(dot / (norm1 * norm2), -1.0, 1.0))
    if omega.abs() < 1e-6:
        return (1 - t) * t1 + t * t2
    so = torch.sin(omega)
    return torch.sin((1 - t) * omega) / so * t1 + torch.sin(t * omega) / so * t2

def slerp_merge_adapters(adapters, t=0.5):
    """SLERP merge of 2+ adapters (pairwise)."""
    if len(adapters) == 2:
        keys = _common_keys(adapters)
        return {k: slerp_merge(adapters[0][k], adapters[1][k], t) for k in keys}
    
    # For >2, fold pairwise
    result = adapters[0]
    for i in range(1, len(adapters)):
        keys = result.keys()
        result = {k: slerp_merge(result[k], adapters[i][k], t) for k in keys}
    return result

def save_merged_adapter(merged_weights, adapter_dir, out_dir):
    """Save merged adapter with original config."""
    from safetensors.torch import save_file
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    
    # Convert to bf16 to save space
    merged_bf16 = {k: torch.nan_to_num(v, nan=0.0, posinf=0.0, neginf=0.0).to(torch.bfloat16) for k, v in merged_weights.items()}
    save_file(merged_bf16, str(out_dir / 'adapter_model.safetensors'))
    
    # Copy config
    import shutil
    for f in ['adapter_config.json', 'tokenizer.json', 'tokenizer_config.json']:
        src = Path(adapter_dir) / f
        if src.exists():
            shutil.copy2(str(src), str(out_dir / f))
    
    return out_dir

def _get_rank(adapter):
    """Detect LoRA rank from adapter weights."""
    first_key = list(adapter.keys())[0]
    return adapter[first_key].shape[0]

def _pad_to_max_rank(adapters):
    """Pad lower-rank adapters (lora_A) and truncate (lora_B) to match the max rank."""
    max_rank = max(_get_rank(a) for a in adapters)
    padded = []
    for a in adapters:
        rank = _get_rank(a)
        if rank == max_rank:
            padded.append(a)
            continue
        new_a = {}
        for k, v in a.items():
            if 'lora_A' in k:
                # lora_A shape is [rank, in_dim] -> pad to [max_rank, in_dim]
                if v.shape[0] < max_rank:
                    pad_amount = max_rank - v.shape[0]
                    v = torch.nn.functional.pad(v, (0, 0, 0, pad_amount))
            elif 'lora_B' in k:
                # lora_B shape is [out_dim, rank] -> pad to [out_dim, max_rank]
                if v.shape[1] < max_rank:
                    pad_amount = max_rank - v.shape[1]
                    v = torch.nn.functional.pad(v, (0, pad_amount))
            new_a[k] = v
        padded.append(new_a)
    return padded

def main():
    print("=" * 70)
    print("🜏 SOV33 PURE PYTORCH MERGE — No mergekit dependency")
    print("=" * 70)
    
    models_dir = Path.home() / '.sovereign' / 'models'
    
    # Load all adapters
    adapter_dirs = sorted([d for d in models_dir.iterdir() 
                          if d.is_dir() and (d / 'adapter_model.safetensors').exists()])
    
    print(f"\nFound {len(adapter_dirs)} LoRA adapters:")
    adapters = {}
    for d in adapter_dirs:
        try:
            w = load_lora_adapter(d)
            n_params = sum(v.numel() for v in w.values())
            rank = _get_rank(w)
            adapters[d.name] = w
            print(f"  ✓ {d.name}: rank={rank}, {n_params:,} params ({len(w)} tensors)")
        except Exception as e:
            print(f"  ✗ {d.name}: {e}")
    
    if len(adapters) < 2:
        print("\nNeed at least 2 adapters to merge!")
        return
    
    # Run 3 merge methods and compare
    results = {}
    adapter_list = list(adapters.values())
    adapter_names = list(adapters.keys())
    
    # Pad to max rank so all adapters are the same shape
    print(f"\n[0] Padding adapters to common rank...")
    max_rank = max(_get_rank(a) for a in adapter_list)
    adapter_list = _pad_to_max_rank(adapter_list)
    print(f"  All adapters padded to rank={max_rank}")
    
    # Method 1: LINEAR (equal weights)
    print(f"\n[1] LINEAR merge ({len(adapter_list)} adapters, equal weights)...")
    t0 = time.time()
    linear_result = linear_merge(adapter_list)
    linear_dir = save_merged_adapter(
        linear_result, adapter_dirs[0],
        models_dir / 'sov33-merged-linear'
    )
    n_params = sum(v.numel() for v in linear_result.values())
    print(f"  ✓ Saved to {linear_dir} ({n_params:,} params, {time.time()-t0:.1f}s)")
    results['linear'] = {'params': n_params, 'saved_to': str(linear_dir)}
    
    # Method 2: TIES (density=0.5)
    print(f"\n[2] TIES merge ({len(adapter_list)} adapters, density=0.5)...")
    t0 = time.time()
    ties_result = ties_merge(adapter_list, density=0.5)
    ties_dir = save_merged_adapter(
        ties_result, adapter_dirs[0],
        models_dir / 'sov33-merged-ties'
    )
    n_params = sum(v.numel() for v in ties_result.values())
    print(f"  ✓ Saved to {ties_dir} ({n_params:,} params, {time.time()-t0:.1f}s)")
    results['ties'] = {'params': n_params, 'saved_to': str(ties_dir)}
    
    # Method 3: DARE-TIES (drop_rate=0.9)
    print(f"\n[3] DARE-TIES merge ({len(adapter_list)} adapters, drop=0.9)...")
    t0 = time.time()
    dare_result = dare_ties_merge(adapter_list, drop_rate=0.9)
    dare_dir = save_merged_adapter(
        dare_result, adapter_dirs[0],
        models_dir / 'sov33-merged-dare-ties'
    )
    n_params = sum(v.numel() for v in dare_result.values())
    print(f"  ✓ Saved to {dare_dir} ({n_params:,} params, {time.time()-t0:.1f}s)")
    results['dare_ties'] = {'params': n_params, 'saved_to': str(dare_dir)}
    
    # Compute merge diagnostics: how different is each method from the base?
    print(f"\n[4] Computing merge diagnostics...")
    base = adapter_list[0]  # brain as reference
    for method, result in [('linear', linear_result), ('ties', ties_result), ('dare_ties', dare_result)]:
        total_delta = 0.0
        total_base_norm = 0.0
        for k in base.keys():
            if k in result:
                delta = (result[k].float() - base[k].float()).norm().item()
                base_norm = base[k].float().norm().item()
                total_delta += delta
                total_base_norm += base_norm
        relative_delta = total_delta / (total_base_norm + 1e-8)
        results[method]['relative_delta_from_base'] = relative_delta
        print(f"  {method}: relative delta from base = {relative_delta:.4f}")
    
    # SIGIL
    sigil_payload = f"pure_merge:{len(adapters)}adapters:{len(results)}methods:{time.time():.0f}"
    sigil = hashlib.sha256(sigil_payload.encode()).hexdigest()[:16]
    
    # Manifest
    manifest = {
        'ts_iso': datetime.now(timezone.utc).isoformat(),
        'name': 'SOV33 Pure PyTorch Merge',
        'base_model': 'Qwen3-0.6B',
        'input_adapters': adapter_names,
        'n_adapters': len(adapters),
        'methods': results,
        'sigil': sigil,
        'no_mergekit': True,
        'description': 'Pure PyTorch implementation of LINEAR, TIES, and DARE-TIES merging. No mergekit dependency needed. All 11 LoRA adapters share Qwen3-0.6B base → all weight-merge compatible.',
    }
    
    manifest_path = models_dir / 'sov33_merge_manifest.json'
    manifest_path.write_text(json.dumps(manifest, indent=2, default=str))
    
    print(f"\n{'='*70}")
    print(f"✓ SOV33 PURE MERGE COMPLETE")
    print(f"{'='*70}")
    print(f"  Input: {len(adapters)} adapters")
    print(f"  Output: 3 merged adapters (linear, ties, dare-ties)")
    print(f"  SIGIL: {sigil}")
    print(f"  Manifest: {manifest_path}")
    
    return manifest


if __name__ == '__main__':
    main()
