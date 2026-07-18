#!/usr/bin/env python3
"""sov33_large_full_v2.py — SOV33 LARGE sovereign brain training.

Trains a 1.7B sovereign brain with rank=32 LoRA on the merged sovereign corpus.
"""
import os, sys, json, time
os.environ.pop('PYTHONPATH', None)
sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit')

import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import LoraConfig, get_peft_model, TaskType
from pathlib import Path

def train_large_sovereign():
    """Train 1.7B sovereign brain with LoRA rank=32."""
    base_path = 'Qwen/Qwen3-1.7B'
    corpus_path = '/Users/nicholas/clawd/_alignment/sovereign_merge_kit/sov_owem_data/sov33_large_world_corpus.jsonl'
    
    samples = []
    with open(corpus_path) as f:
        for line in f:
            if line.strip():
                samples.append(json.loads(line))
    
    samples = samples[:1000]  # Cap at 1000 for production
    
    print(f"Training LARGE sovereign brain on {len(samples)} samples")
    
    tokenizer = AutoTokenizer.from_pretrained(base_path, trust_remote_code=True)
    model = AutoModelForCausalLM.from_pretrained(base_path, torch_dtype=torch.float32, trust_remote_code=True)
    device = torch.device('mps' if torch.backends.mps.is_available() else 'cuda' if torch.cuda.is_available() else 'cpu')
    model = model.to(device)
    
    lora_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=32,
        lora_alpha=64,
        lora_dropout=0.05,
        target_modules=['q_proj', 'k_proj', 'v_proj', 'o_proj'],
        bias='none',
    )
    model = get_peft_model(model, lora_config)
    
    optimizer = torch.optim.AdamW(
        [p for p in model.parameters() if p.requires_grad],
        lr=2e-4,
    )
    
    model.train()
    losses = []
    t0 = time.time()
    
    max_steps = 200
    batch_size = 4
    
    for step in range(max_steps):
        batch = samples[step % len(samples):(step % len(samples)) + batch_size]
        if len(batch) < batch_size:
            batch = batch + samples[:batch_size - len(batch)]
        
        prompts = [f"Q: {s['prompt']}\nA: {s['response']}" for s in batch]
        inputs = tokenizer(prompts, return_tensors='pt', padding=True, truncation=True, max_length=512).to(device)
        outputs = model(**inputs, labels=inputs['input_ids'])
        loss = outputs.loss
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
        losses.append(float(loss))
        
        if step % 20 == 0 or step == max_steps - 1:
            print(f"  step {step:3d}: loss={loss.item():.4f}")
    
    # Save
    out_dir = Path.home() / '.sovereign' / 'models' / 'qwen3-sov-large-1.7b'
    model.save_pretrained(str(out_dir))
    tokenizer.save_pretrained(str(out_dir))
    
    final_loss = losses[-1]
    print(f"✓ SOV33 LARGE: loss {losses[0]:.3f} → {final_loss:.3f} ({100*(losses[0]-final_loss)/losses[0]:.1f}% reduction, {time.time()-t0:.1f}s)")
    return {
        'base': base_path,
        'samples': len(samples),
        'steps': max_steps,
        'rank': 32,
        'initial_loss': losses[0],
        'final_loss': final_loss,
        'reduction_pct': 100*(losses[0]-final_loss)/losses[0],
        'duration_s': time.time() - t0,
    }

if __name__ == '__main__':
    train_large_sovereign()
