#!/usr/bin/env python3
"""sov33_clean_merge.py — Merge ONLY rank-16 224-key adapters (clean signal)."""
import os, sys, json, time, hashlib
os.environ.pop('PYTHONPATH', None)
from pathlib import Path
from datetime import datetime, timezone
import torch
import torch.nn.functional as F

def load_lora(path):
    from safetensors.torch import load_file
    return load_file(str(Path(path) / 'adapter_model.safetensors'))

def common_keys(adapters):
    ks = [set(a.keys()) for a in adapters]
    return sorted(ks[0].intersection(*ks[1:]))

def linear_merge(adapters, weights=None):
    if weights is None: weights = [1.0/len(adapters)]*len(adapters)
    keys = common_keys(adapters)
    merged = {}
    for k in keys:
        t = torch.stack([a[k].float()*w for a,w in zip(adapters,weights)])
        merged[k] = torch.nan_to_num(t.sum(dim=0), nan=0.0)
    return merged

def ties_merge(adapters, density=0.5, weights=None):
    if weights is None: weights = [1.0/len(adapters)]*len(adapters)
    keys = common_keys(adapters)
    merged = {}
    for k in keys:
        stacked = torch.stack([a[k].float()*w for a,w in zip(adapters,weights)])
        k_keep = max(1, int(stacked[0].numel()*density))
        mags = stacked.abs().mean(dim=0)
        if mags.numel() > k_keep:
            thresh = torch.topk(mags.flatten(), k_keep).values[-1]
            mask = mags >= thresh
            stacked = stacked * mask.float()
        sign_sum = stacked.sign().sum(dim=0)
        elected = sign_sum.sign()
        agree = (stacked.sign() == elected.unsqueeze(0)) & (stacked != 0)
        count = agree.sum(dim=0).clamp(min=1)
        merged[k] = torch.nan_to_num((stacked*agree.float()).sum(dim=0)/count, nan=0.0)
    return merged

def dare_ties_merge(adapters, drop_rate=0.9, weights=None):
    if weights is None: weights = [1.0/len(adapters)]*len(adapters)
    keys = common_keys(adapters)
    merged = {}
    torch.manual_seed(42)
    for k in keys:
        pruned = []
        for a,w in zip(adapters,weights):
            t = a[k].float()*w
            mask = (torch.rand_like(t) > drop_rate).float()
            t = t * mask / (1-drop_rate)
            pruned.append(t)
        stacked = torch.stack(pruned)
        sign_sum = stacked.sign().sum(dim=0)
        elected = sign_sum.sign()
        agree = (stacked.sign() == elected.unsqueeze(0)) & (stacked != 0)
        count = agree.sum(dim=0).clamp(min=1)
        merged[k] = torch.nan_to_num((stacked*agree.float()).sum(dim=0)/count, nan=0.0)
    return merged

def save(weights, ref_dir, out_dir):
    from safetensors.torch import save_file
    import shutil
    out_dir = Path(out_dir); out_dir.mkdir(parents=True, exist_ok=True)
    save_file({k: torch.nan_to_num(v, nan=0.0).to(torch.bfloat16) for k,v in weights.items()},
              str(out_dir/'adapter_model.safetensors'))
    for f in ['adapter_config.json','tokenizer.json','tokenizer_config.json']:
        src = Path(ref_dir)/f
        if src.exists(): shutil.copy2(str(src), str(out_dir/f))
    return out_dir

def main():
    print("="*60)
    print("SOV33 CLEAN MERGE — rank-16, 224-key adapters only")
    print("="*60)
    md = Path.home()/'.sovereign'/'models'
    
    adapters = {}
    for d in sorted(md.iterdir()):
        st = d/'adapter_model.safetensors'
        if not st.exists() or 'merged' in d.name: continue
        w = load_lora(d)
        rank = w[list(w.keys())[0]].shape[0]
        n_keys = len(w)
        if rank == 16 and n_keys == 224:
            adapters[d.name] = w
            print(f"  + {d.name}: rank={rank}, keys={n_keys}")
        else:
            print(f"  - {d.name}: rank={rank}, keys={n_keys} (skip)")
    
    print(f"\nMerging {len(adapters)} compatible adapters...")
    al = list(adapters.values())
    names = list(adapters.keys())
    
    # Weighted: compliance is the moat
    weights = []
    for n in names:
        if 'compliance' in n: weights.append(0.25)
        elif 'defense' in n: weights.append(0.20)
        elif 'brain' in n: weights.append(0.15)
        elif 'voice' in n: weights.append(0.15)
        elif 'intuition' in n: weights.append(0.15)
        else: weights.append(0.10)
    s = sum(weights); weights = [w/s for w in weights]
    
    print(f"  Weights: {dict(zip(names, [round(w,3) for w in weights]))}")
    
    results = {}
    for method_name, func, kwargs in [
        ("linear", linear_merge, {"weights": weights}),
        ("ties", ties_merge, {"density": 0.5, "weights": weights}),
        ("dare_ties", dare_ties_merge, {"drop_rate": 0.9, "weights": weights}),
    ]:
        t0 = time.time()
        print(f"\n[{method_name}]...")
        merged = func(al, **kwargs)
        out = save(merged, md/names[0], md/f"sov33-merged-{method_name}")
        n_params = sum(v.numel() for v in merged.values())
        has_nan = any(torch.isnan(v).any().item() for v in merged.values())
        print(f"  saved {n_params:,} params, nan={has_nan}, {time.time()-t0:.1f}s")
        results[method_name] = {"params": n_params, "nan": has_nan, "path": str(out)}
    
    sigil = hashlib.sha256(f"clean_merge:{len(al)}:{time.time():.0f}".encode()).hexdigest()[:16]
    manifest = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "adapters": names,
        "weights": dict(zip(names, weights)),
        "results": results,
        "sigil": sigil,
    }
    (md/"sov33_clean_merge_manifest.json").write_text(json.dumps(manifest, indent=2))
    print(f"\n{'='*60}")
    print(f"DONE. SIGIL: {sigil}")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
