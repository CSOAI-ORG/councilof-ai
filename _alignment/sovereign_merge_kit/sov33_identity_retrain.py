#!/usr/bin/env python3
"""
sov33_identity_retrain.py — THE FIX.

Sir Nicholas showed the model was hedging, confusing identities, being generic.
Root cause: training data had NO identity framing. Model didn't know:
1. It is SOV33 (not Nicholas)
2. Nicholas is the founder (a human)
3. How to talk (sovereign, direct, no hedge, no emoji spam)

This retrains the sovereign brain with 500 IDENTITY-CORRECT samples.
"""
import os, sys, json, time, hashlib
os.environ.pop('PYTHONPATH', None)
sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit')

import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import LoraConfig, get_peft_model, TaskType
from pathlib import Path
from datetime import datetime, timezone


def load_identity_data():
    """Load the identity-correct training data."""
    identity_path = Path('/Users/nicholas/clawd/_alignment/sovereign_merge_kit/sov_owem_data/identity_500.jsonl')
    if not identity_path.exists():
        raise FileNotFoundError(f"Identity data not found at {identity_path}")
    
    samples = []
    with open(identity_path) as f:
        for line in f:
            if line.strip():
                samples.append(json.loads(line))
    return samples


def retrain_sovereign_brain():
    """Retrain sovereign brain with identity-correct data."""
    
    print("=" * 70)
    print("🜏 SOV33 IDENTITY RETRAIN — THE FIX")
    print("Root cause: training data lacked identity framing")
    print("Fix: 500 identity-correct samples + sovereign brain retrain")
    print("=" * 70)
    
    samples = load_identity_data()
    print(f"\n[1] Loaded {len(samples)} identity-correct samples")
    
    # Also mix in domain samples (compliance, defense, etc.) so it doesn't forget
    domain_samples = []
    for owem in ['compliance', 'defense', 'intuition', 'voice']:
        p = Path(f'/Users/nicholas/clawd/_alignment/sovereign_merge_kit/sov_owem_data/{owem}_200_fixed.jsonl')
        if p.exists():
            with open(p) as f:
                for line in f:
                    if line.strip():
                        s = json.loads(line)
                        if 'messages' in s:
                            msgs = s['messages']
                            u = next((m['content'] for m in msgs if m.get('role') == 'user'), '')
                            a = next((m['content'] for m in msgs if m.get('role') == 'assistant'), '')
                            if u and a:
                                domain_samples.append({'prompt': u, 'response': a})
                        elif s.get('prompt') and s.get('response'):
                            domain_samples.append(s)
    
    # Mix: 60% identity, 40% domain (identity takes priority)
    random.shuffle(domain_samples)
    domain_mix = domain_samples[:200]  # 200 domain
    identity_mix = samples[:300]  # 300 identity (60%)
    
    all_samples = identity_mix + domain_mix
    random.shuffle(all_samples)
    
    print(f"[2] Mixed: {len(identity_mix)} identity + {len(domain_mix)} domain = {len(all_samples)} total")
    
    # Load model
    print(f"\n[3] Loading Qwen3-0.6B base model...")
    tokenizer = AutoTokenizer.from_pretrained('Qwen/Qwen3-0.6B', trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    
    model = AutoModelForCausalLM.from_pretrained('Qwen/Qwen3-0.6B', torch_dtype=torch.float32, trust_remote_code=True)
    device = torch.device('mps' if torch.backends.mps.is_available() else 'cpu')
    model = model.to(device)
    
    # LoRA config — rank=32, all attention projections
    lora_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=32,
        lora_alpha=64,
        lora_dropout=0.05,
        target_modules=['q_proj', 'k_proj', 'v_proj', 'o_proj'],
        bias='none',
    )
    model = get_peft_model(model, lora_config)
    
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in model.parameters())
    print(f"[4] LoRA: rank=32, {trainable:,} / {total:,} trainable ({100*trainable/total:.2f}%)")
    
    optimizer = torch.optim.AdamW(
        [p for p in model.parameters() if p.requires_grad], lr=3e-4,
    )
    
    model.train()
    losses = []
    batch_size = 4
    max_steps = 150  # 150 steps for deeper learning

    print(f"\n[5] Training {max_steps} steps × batch={batch_size}...")
    t0 = time.time()

    checkpoint_every = 30
    for step in range(max_steps):
        batch = all_samples[step % len(all_samples):(step % len(all_samples)) + batch_size]
        if len(batch) < batch_size:
            batch = batch + all_samples[:batch_size - len(batch)]

        prompts = [f"Q: {s['prompt']}\nA: {s['response']}" for s in batch]
        inputs = tokenizer(prompts, return_tensors='pt', padding=True, truncation=True, max_length=384).to(device)
        outputs = model(**inputs, labels=inputs['input_ids'])
        loss = outputs.loss
        # NaN guard — skip step if loss explodes
        if torch.isnan(loss) or torch.isinf(loss):
            print(f"  ⚠ step {step}: loss is NaN/Inf, skipping optimizer step")
            optimizer.zero_grad()
            continue
        optimizer.zero_grad()
        loss.backward()
        # Gradient clipping for stability
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        optimizer.step()
        # Use detached scalar to avoid memory leak
        loss_val = loss.detach().item()
        losses.append(loss_val)

        # Save CHECKPOINT every N steps (early so we don't lose work)
        # out_dir is defined later, so build the path inline
        if (step + 1) % checkpoint_every == 0 or step == max_steps - 1:
            ckpt_dir = Path.home() / '.sovereign' / 'models' / f'qwen3-sov-brain-v2-identity-fixed-step{step+1}'
            ckpt_dir.mkdir(parents=True, exist_ok=True)
            try:
                model.save_pretrained(str(ckpt_dir))
                tokenizer.save_pretrained(str(ckpt_dir))
                print(f"  📍 checkpoint saved at step {step+1}: {ckpt_dir}")
            except Exception as e:
                print(f"  ⚠ checkpoint failed at step {step+1}: {e}")
            if torch.backends.mps.is_available():
                torch.mps.empty_cache()
        
        if step % 15 == 0 or step == max_steps - 1:
            elapsed = time.time() - t0
            eta = (elapsed / (step + 1)) * (max_steps - step - 1) if step > 0 else 0
            print(f"  step {step:3d}/{max_steps}: loss={loss.item():.4f} (elapsed {elapsed:.0f}s, ETA {eta:.0f}s)")
    
    # Save
    out_dir = Path.home() / '.sovereign' / 'models' / 'qwen3-sov-brain-v2-identity-fixed'
    out_dir.mkdir(exist_ok=True)
    model.save_pretrained(str(out_dir))
    tokenizer.save_pretrained(str(out_dir))
    
    elapsed = time.time() - t0
    reduction = 100 * (losses[0] - losses[-1]) / losses[0] if losses[0] > 0 else 0
    
    # SIGIL
    sigil_payload = f"identity_fix:{losses[0]:.4f}:{losses[-1]:.4f}:{elapsed:.1f}"
    sigil = hashlib.sha256(sigil_payload.encode()).hexdigest()[:16]
    
    print(f"\n{'='*70}")
    print(f"✓ SOV33 IDENTITY RETRAIN COMPLETE")
    print(f"{'='*70}")
    print(f"  Loss: {losses[0]:.4f} → {losses[-1]:.4f} ({reduction:.1f}% reduction)")
    print(f"  Time: {elapsed:.1f}s")
    print(f"  Saved: {out_dir}")
    print(f"  SIGIL: {sigil}")
    
    # Save manifest
    manifest = {
        'ts_iso': datetime.now(timezone.utc).isoformat(),
        'name': 'SOV33 Identity Fix Retrain',
        'base_model': 'Qwen3-0.6B',
        'lora_rank': 32,
        'trainable_params': trainable,
        'total_params': total,
        'identity_samples': len(identity_mix),
        'domain_samples': len(domain_mix),
        'total_samples': len(all_samples),
        'steps': max_steps,
        'initial_loss': losses[0],
        'final_loss': losses[-1],
        'reduction_pct': reduction,
        'duration_s': elapsed,
        'saved_to': str(out_dir),
        'sigil': sigil,
        'fix_description': 'Model was hedging and confusing identities. Fixed by adding 300 identity-correct samples (who is SOV33, who is Nicholas, anti-sycophancy) + 200 domain samples. 60/40 identity/domain mix.',
    }
    
    manifest_path = Path('/Users/nicholas/clawd/_alignment/sovereign_merge_kit/benchmarks/identity_retrain_2026-07-15.json')
    manifest_path.write_text(json.dumps(manifest, indent=2))
    print(f"  Manifest: {manifest_path}")
    
    return manifest


if __name__ == '__main__':
    import random
    random.seed(42)
    retrain_sovereign_brain()
