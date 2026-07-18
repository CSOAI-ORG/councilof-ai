"""
sov3_small_world.py — SOV3 SMALL World Model.

Merges the 4 sovereign OWEM LoRA adapters into ONE unified small world model
on Qwen3-0.6B base. This is the "SOV3" tier — small, fast, runs on Mac.

Input: 4 LoRA adapters (compliance, defense, intuition, voice)
Output: ONE merged model at ~/.sovereign/models/sov3-small-world/

Method: weighted average of adapter weights
  - compliance gets higher weight (it's the moat)
  - others equal
"""

import os
import json
import time
import shutil
import hashlib
from pathlib import Path
from datetime import datetime, timezone

# Force correct tokenizers version BEFORE importing transformers
os.environ.pop('PYTHONPATH', None)

import torch
import sys
sys.path.insert(0, '/Users/nicholas/.sovereign/ml-venv/lib/python3.11/site-packages')
sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit')

from safetensors.torch import load_file, save_file
import numpy as np

# 4 OWEM adapters
ADAPTERS = {
    'compliance': '/Users/nicholas/.sovereign/models/qwen3-sov-compliance-0.6b/adapter_model.safetensors',
    'defense':    '/Users/nicholas/.sovereign/models/qwen3-sov-defense-0.6b/adapter_model.safetensors',
    'intuition':  '/Users/nicholas/.sovereign/models/qwen3-sov-intuition-0.6b/adapter_model.safetensors',
    'voice':      '/Users/nicholas/.sovereign/models/qwen3-sov-voice-0.6b/adapter_model.safetensors',
}

# Weights (compliance is moat)
WEIGHTS = {
    'compliance': 0.40,
    'defense':    0.20,
    'intuition':  0.20,
    'voice':      0.20,
}

OUTPUT_DIR = Path('/Users/nicholas/.sovereign/models/sov3-small-world')
SIGIL_FILE = Path('/Users/nicholas/.sovereign/sov3_small_world.sigil.jsonl')


def sigil_emit(hop: dict) -> str:
    SIGIL_FILE.parent.mkdir(parents=True, exist_ok=True)
    chain = []
    if SIGIL_FILE.exists():
        for line in SIGIL_FILE.read_text().splitlines():
            if line.strip():
                try:
                    chain.append(json.loads(line))
                except Exception:
                    pass
    prev = chain[-1]['digest'] if chain else '0' * 16
    payload = {**hop, 'prev_hash': prev, 'ts': datetime.now(timezone.utc).isoformat()}
    digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()[:16]
    with SIGIL_FILE.open('a') as f:
        f.write(json.dumps({**payload, 'digest': digest}) + '\n')
    return digest


def merge_adapters():
    """Weighted average merge of 4 OWEM adapters → SOV3 small."""
    print("=" * 60)
    print("SOV3 SMALL World Model — Merge 4 OWEM Adapters")
    print("=" * 60)
    
    # Load all adapter tensors
    print("\n[1] Loading 4 adapter weights...")
    adapter_tensors = {}
    for name, path in ADAPTERS.items():
        if not Path(path).exists():
            print(f"  ✗ Missing: {path}")
            continue
        print(f"  Loading {name} ({Path(path).stat().st_size/1e6:.1f}MB)...")
        adapter_tensors[name] = load_file(path)
        sigil_emit({'hop': 'SOV3_LOAD_ADAPTER', 'name': name, 'path': path,
                    'n_tensors': len(adapter_tensors[name])})
    
    if not adapter_tensors:
        print("✗ No adapters found!")
        return
    
    # Get common keys (all should have same structure since same base + same rank)
    common_keys = set.intersection(*[set(t.keys()) for t in adapter_tensors.values()])
    print(f"\n  Common tensor keys: {len(common_keys)}")
    
    # Weighted average
    print("\n[2] Computing weighted average...")
    weights_used = {k: WEIGHTS[k] for k in adapter_tensors}
    weight_sum = sum(weights_used.values())
    weights_norm = {k: v/weight_sum for k, v in weights_used.items()}
    print(f"  Weights: {weights_norm}")
    
    merged = {}
    for key in common_keys:
        stacked = torch.stack([adapter_tensors[name][key].float() * weights_norm[name]
                               for name in adapter_tensors])
        merged[key] = stacked.sum(dim=0).to(adapter_tensors[list(adapter_tensors.keys())[0]][key].dtype)
    
    sigil_emit({'hop': 'SOV3_MERGE_COMPUTE', 'method': 'weighted_average',
                'weights': weights_norm, 'n_tensors': len(merged)})
    
    # Save merged adapter
    print(f"\n[3] Saving merged adapter to {OUTPUT_DIR}...")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Copy adapter_config.json from one source
    src_config = Path(ADAPTERS['compliance']).parent / 'adapter_config.json'
    if src_config.exists():
        shutil.copy(src_config, OUTPUT_DIR / 'adapter_config.json')
    
    # Copy tokenizer files from compliance adapter (they're the same)
    for f in ['tokenizer.json', 'tokenizer_config.json', 'chat_template.jinja']:
        src = Path(ADAPTERS['compliance']).parent / f
        if src.exists():
            shutil.copy(src, OUTPUT_DIR / f)
    
    # Save merged weights
    save_file(merged, str(OUTPUT_DIR / 'adapter_model.safetensors'))
    
    # Write README
    total_size = sum(t.numel() * t.element_size() for t in merged.values())
    readme = f"""# SOV3 SMALL World Model

SOV3 = Small Open World model (the 0.6B tier).

## Architecture
- Base: Qwen3-0.6B
- LoRA: rank=16, alpha=16, all-linear
- Merged from 4 sovereign OWEM adapters via weighted average

## Weights
{json.dumps(weights_norm, indent=2)}

## Merge Method
weighted_average of LoRA adapter weights

## Stats
- Total tensor bytes: {total_size/1e6:.1f}MB
- N tensor keys: {len(merged)}
- Common keys: {len(common_keys)}
- Source adapters: {list(adapter_tensors.keys())}
- Created: {datetime.now(timezone.utc).isoformat()}
- SIGIL chain: {SIGIL_FILE}

## Lineage
SOV3 small ← Qwen3-0.6B + (compliance×0.40 + defense×0.20 + intuition×0.20 + voice×0.20)
"""
    (OUTPUT_DIR / 'README.md').write_text(readme)
    
    sigil_emit({'hop': 'SOV3_MERGE_SAVE', 'output': str(OUTPUT_DIR),
                'n_tensors': len(merged), 'total_bytes': total_size})
    
    print(f"\n  ✓ Saved {len(merged)} tensors ({total_size/1e6:.1f}MB) to {OUTPUT_DIR}")
    print(f"  ✓ SIGIL chain: {SIGIL_FILE}")
    
    # Test inference
    print(f"\n[4] Sanity test...")
    sample = list(merged.keys())[0]
    print(f"  Sample tensor {sample}: shape={merged[sample].shape}, dtype={merged[sample].dtype}")
    print(f"  Range: [{merged[sample].min():.4f}, {merged[sample].max():.4f}]")
    print(f"  Mean: {merged[sample].mean():.4f}, Std: {merged[sample].std():.4f}")
    
    return OUTPUT_DIR


if __name__ == "__main__":
    out = merge_adapters()
    print("\n" + "=" * 60)
    print(f"✓ SOV3 SMALL World Model saved to {out}")
    print("=" * 60)
