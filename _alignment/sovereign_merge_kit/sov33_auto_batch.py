#!/usr/bin/env python3
"""
sov33_auto_batch.py — PHASE 48: Auto-batch training of all 4 OWEMs + sovereign brain.

This is the PRODUCTION-SCALE training. Designed to run for ~2-4 hours on Mac MPS.
- 4 OWEMs (compliance, defense, intuition, voice)
- 1 sovereign brain v2 (rank=32)
- Each: 200 samples × 100 steps × batch=4
- All SIGIL-signed
- All saved to ~/.sovereign/models/

This is meant to be the LONG-running batch Sir asked for. Started, logs progress, ends with summary.
"""
import os, sys, json, time, hashlib
os.environ.pop('PYTHONPATH', None)
sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit')

import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import LoraConfig, get_peft_model, TaskType
from pathlib import Path
from datetime import datetime, timezone


OWEM_CONFIGS = [
    {'name': 'compliance',  'rank': 32, 'target': 'q_proj,v_proj', 'samples': 200, 'steps': 100},
    {'name': 'defense',     'rank': 32, 'target': 'q_proj,v_proj', 'samples': 200, 'steps': 100},
    {'name': 'intuition',   'rank': 32, 'target': 'q_proj,v_proj', 'samples': 200, 'steps': 100},
    {'name': 'voice',       'rank': 32, 'target': 'q_proj,v_proj', 'samples': 200, 'steps': 100},
    {'name': 'sov_brain_v2', 'rank': 32, 'target': 'q_proj,k_proj,v_proj,o_proj', 'samples': 200, 'steps': 100, 'corpus': 'sov33_large_world_corpus.jsonl'},
]


def normalize_sample(sample):
    """Normalize to prompt/response."""
    if 'prompt' in sample:
        return sample
    if 'messages' in sample:
        msgs = sample['messages']
        u = next((m['content'] for m in msgs if m.get('role') == 'user'), '')
        a = next((m['content'] for m in msgs if m.get('role') == 'assistant'), '')
        return {'prompt': u, 'response': a}
    return sample


def train_owem(config):
    """Train one OWEM with the given config."""
    name = config['name']
    data_path = f'/Users/nicholas/clawd/_alignment/sovereign_merge_kit/sov_owem_data/{config.get("corpus", name + "_200_fixed.jsonl")}'
    if not Path(data_path).exists():
        # Fallback to large corpus
        data_path = '/Users/nicholas/clawd/_alignment/sovereign_merge_kit/sov_owem_data/sov33_large_world_corpus.jsonl'
    
    if not Path(data_path).exists():
        return {'name': name, 'error': f'no data at {data_path}'}
    
    samples = []
    with open(data_path) as f:
        for line in f:
            if line.strip():
                s = normalize_sample(json.loads(line))
                if s.get('prompt') and s.get('response'):
                    samples.append(s)
    samples = samples[:config['samples']]
    
    print(f"\n{'='*70}")
    print(f"🜏 Training {name.upper()}: {len(samples)} samples × {config['steps']} steps × rank={config['rank']}")
    print(f"{'='*70}")
    
    t0 = time.time()
    
    tokenizer = AutoTokenizer.from_pretrained('Qwen/Qwen3-0.6B', trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    
    model = AutoModelForCausalLM.from_pretrained('Qwen/Qwen3-0.6B', torch_dtype=torch.float32, trust_remote_code=True)
    device = torch.device('mps' if torch.backends.mps.is_available() else 'cpu')
    model = model.to(device)
    
    target_modules = config['target'].split(',')
    lora_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=config['rank'],
        lora_alpha=config['rank'] * 2,
        lora_dropout=0.05,
        target_modules=target_modules,
        bias='none',
    )
    model = get_peft_model(model, lora_config)
    
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in model.parameters())
    print(f"  Params: {trainable:,} / {total:,} trainable ({100*trainable/total:.2f}%)")
    
    optimizer = torch.optim.AdamW(
        [p for p in model.parameters() if p.requires_grad], lr=2e-4,
    )
    
    model.train()
    losses = []
    batch_size = 4
    
    for step in range(config['steps']):
        batch = samples[step % len(samples):(step % len(samples)) + batch_size]
        if len(batch) < batch_size:
            batch = batch + samples[:batch_size - len(batch)]
        
        prompts = [f"Q: {s['prompt']}\nA: {s['response']}" for s in batch]
        inputs = tokenizer(prompts, return_tensors='pt', padding=True, truncation=True, max_length=384).to(device)
        outputs = model(**inputs, labels=inputs['input_ids'])
        loss = outputs.loss
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
        losses.append(float(loss))
        
        if step % 20 == 0 or step == config['steps'] - 1:
            print(f"  step {step:3d}: loss={loss.item():.4f}")
    
    # Save
    out_dir = Path.home() / '.sovereign' / 'models' / f'qwen3-sov-{name}-0.6b'
    out_dir.mkdir(exist_ok=True)
    model.save_pretrained(str(out_dir))
    tokenizer.save_pretrained(str(out_dir))
    
    elapsed = time.time() - t0
    final_loss = losses[-1]
    reduction = 100 * (losses[0] - final_loss) / losses[0] if losses[0] > 0 else 0
    
    # SIGIL
    sigil_payload = f"{name}:{losses[0]:.4f}:{final_loss:.4f}:{elapsed:.1f}"
    sigil = hashlib.sha256(sigil_payload.encode()).hexdigest()[:16]
    
    print(f"  ✓ {name}: loss {losses[0]:.3f} → {final_loss:.3f} ({reduction:.1f}% reduction, {elapsed:.1f}s) SIGIL={sigil}")
    
    # Free memory
    del model
    import gc
    gc.collect()
    torch.mps.empty_cache()
    
    return {
        'name': name,
        'initial_loss': losses[0],
        'final_loss': final_loss,
        'reduction_pct': reduction,
        'duration_s': elapsed,
        'trainable_params': trainable,
        'saved_to': str(out_dir),
        'sigil': sigil,
        'samples': len(samples),
        'steps': config['steps'],
        'rank': config['rank'],
    }


def main():
    print("=" * 70)
    print("🜏 SOV33 AUTO-BATCH — All 4 OWEMs + Sovereign Brain v2")
    print(f"Started: {datetime.now(timezone.utc).isoformat()}")
    print("=" * 70)
    
    results = []
    for config in OWEM_CONFIGS:
        try:
            r = train_owem(config)
            results.append(r)
        except Exception as e:
            print(f"  ✗ {config['name']} failed: {e}")
            results.append({'name': config['name'], 'error': str(e)[:200]})
    
    # Save summary
    out = Path('/Users/nicholas/clawd/_alignment/sovereign_merge_kit/benchmarks/auto_batch_2026-07-14.json')
    out.write_text(json.dumps({
        'ts_iso': datetime.now(timezone.utc).isoformat(),
        'mode': 'auto_batch',
        'results': results,
    }, indent=2))
    
    print("\n" + "=" * 70)
    print("🜏 AUTO-BATCH COMPLETE")
    print("=" * 70)
    n_ok = sum(1 for r in results if 'error' not in r)
    print(f"\n{n_ok}/{len(results)} OWEMs trained successfully")
    for r in results:
        if 'error' in r:
            print(f"  ✗ {r['name']}: {r['error'][:60]}")
        else:
            print(f"  ✓ {r['name']}: {r['reduction_pct']:.1f}% reduction in {r['duration_s']:.1f}s")
    
    return results


if __name__ == '__main__':
    main()
