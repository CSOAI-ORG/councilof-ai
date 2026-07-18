#!/usr/bin/env python3
"""
sov33_phase29.py — Phase 29: Sovereign brain ACTUAL training on MPS.

Uses Qwen3-0.6B (the one we have) with rank=32 LoRA on sovereign corpus.
The 1.7B path is in SOV33_KAGGLE_PHASE27.py for T4 GPU.
"""
import os, sys, json, time
os.environ.pop('PYTHONPATH', None)
sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit')

import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import LoraConfig, get_peft_model, TaskType
from pathlib import Path


def train_sovereign_brain():
    """Train sovereign brain with rank=32 on Qwen3-0.6B."""
    base_path = 'Qwen/Qwen3-0.6B'
    corpus_path = '/Users/nicholas/clawd/_alignment/sovereign_merge_kit/sov_owem_data/sov33_large_world_corpus.jsonl'
    
    samples = []
    with open(corpus_path) as f:
        for line in f:
            if line.strip():
                s = json.loads(line)
                if s.get('prompt') and s.get('response'):
                    samples.append(s)
    samples = samples[:200]
    
    print(f"Training sovereign brain on {len(samples)} samples (rank=32)")
    
    tokenizer = AutoTokenizer.from_pretrained(base_path, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    
    model = AutoModelForCausalLM.from_pretrained(base_path, torch_dtype=torch.float32, trust_remote_code=True)
    device = torch.device('mps' if torch.backends.mps.is_available() else 'cpu')
    model = model.to(device)
    
    lora_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=32,  # Bigger rank for better learning
        lora_alpha=64,
        lora_dropout=0.05,
        target_modules=['q_proj', 'k_proj', 'v_proj', 'o_proj'],
        bias='none',
    )
    model = get_peft_model(model, lora_config)
    
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in model.parameters())
    print(f"  Params: {trainable:,} trainable / {total:,} total ({100*trainable/total:.2f}%)")
    
    optimizer = torch.optim.AdamW(
        [p for p in model.parameters() if p.requires_grad],
        lr=2e-4,
    )
    
    model.train()
    losses = []
    t0 = time.time()
    
    max_steps = 50
    batch_size = 2
    
    for step in range(max_steps):
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
        
        if step % 10 == 0 or step == max_steps - 1:
            print(f"  step {step:3d}: loss={loss.item():.4f}")
    
    # Save
    out_dir = Path.home() / '.sovereign' / 'models' / 'qwen3-sov-brain-0.6b'
    out_dir.mkdir(exist_ok=True)
    model.save_pretrained(str(out_dir))
    tokenizer.save_pretrained(str(out_dir))
    
    elapsed = time.time() - t0
    reduction = 100 * (losses[0] - losses[-1]) / losses[0] if losses[0] > 0 else 0
    print(f"\n✓ Sovereign brain trained in {elapsed:.1f}s")
    print(f"  Loss: {losses[0]:.3f} → {losses[-1]:.3f} ({reduction:.1f}% reduction)")
    print(f"  Saved to {out_dir}")
    
    return {
        'base_model': base_path,
        'samples': len(samples),
        'steps': max_steps,
        'rank': 32,
        'initial_loss': losses[0],
        'final_loss': losses[-1],
        'reduction_pct': reduction,
        'duration_s': elapsed,
        'trainable_params': trainable,
        'total_params': total,
        'saved_to': str(out_dir),
    }


if __name__ == '__main__':
    result = train_sovereign_brain()
    out = Path('/Users/nicholas/clawd/_alignment/sovereign_merge_kit/benchmarks/phase29_result_2026-07-13.json')
    out.write_text(json.dumps(result, indent=2))
    print(f"\nSaved to {out}")
