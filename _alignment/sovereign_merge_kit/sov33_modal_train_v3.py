"""Train brain v5 with 300 steps on MIXED identity + EU AI Act data.
Target: 80%+ citation accuracy."""
import os, sys, json, time, hashlib
os.environ.pop('PYTHONPATH', None)
import modal

app = modal.App("sov33-identity-train-v5")
brain_volume = modal.Volume.from_name("sov33-brain-output", create_if_missing=True)

image = modal.Image.debian_slim(python_version="3.11").pip_install(
    "torch==2.13.0",
    "transformers==5.12.1",
    "peft>=0.18.0",
    "accelerate>=1.6.0",
    "safetensors>=0.5.0",
)

@app.function(
    image=image,
    gpu="T4",
    timeout=900,
    cpu=4,
    memory=8192,
    volumes={"/brain": brain_volume},
)
def train_v5(jsonl_content: str, steps: int = 300):
    import torch
    from transformers import AutoTokenizer, AutoModelForCausalLM
    from peft import LoraConfig, get_peft_model, TaskType
    import hashlib, re
    from pathlib import Path
    
    print("=" * 70)
    print(f"SOV33 v5 TRAINING — {steps} steps on Modal T4 (CUDA, no MPS)")
    print(f"Data: identity + EU AI Act verbatim = 164 pairs")
    print("=" * 70)
    
    samples = [json.loads(line) for line in jsonl_content.splitlines() if line.strip()]
    print(f"[1] Loaded {len(samples)} pairs")
    
    tokenizer = AutoTokenizer.from_pretrained('Qwen/Qwen3-0.6B', trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    
    model = AutoModelForCausalLM.from_pretrained(
        'Qwen/Qwen3-0.6B', torch_dtype=torch.float32, trust_remote_code=True,
    ).to('cuda')
    
    lora_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=32, lora_alpha=64, lora_dropout=0.05,
        target_modules=['q_proj', 'k_proj', 'v_proj', 'o_proj'],
        bias='none',
    )
    model = get_peft_model(model, lora_config)
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"[2] LoRA rank=32, {trainable:,} trainable")
    
    optimizer = torch.optim.AdamW(
        [p for p in model.parameters() if p.requires_grad], lr=3e-4,
    )
    
    model.train()
    losses = []
    batch_size = 4
    t0 = time.time()
    
    print(f"[3] Training {steps} steps × batch={batch_size}...")
    for step in range(steps):
        batch = samples[step % len(samples):(step % len(samples)) + batch_size]
        if len(batch) < batch_size:
            batch = batch + samples[:batch_size - len(batch)]
        
        # Use 'messages' format if present (ChatML)
        prompts = []
        for s in batch:
            if 'messages' in s:
                msgs = s['messages']
                prompt = "\n".join(f"{m['role'].upper()}: {m['content']}" for m in msgs)
                prompts.append(prompt)
            else:
                prompts.append(f"Q: {s.get('prompt', '')}\nA: {s.get('response', '')}")
        
        inputs = tokenizer(prompts, return_tensors='pt', padding=True,
                          truncation=True, max_length=384).to('cuda')
        outputs = model(**inputs, labels=inputs['input_ids'])
        loss = outputs.loss
        
        if torch.isnan(loss) or torch.isinf(loss):
            optimizer.zero_grad()
            continue
        
        optimizer.zero_grad()
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        optimizer.step()
        loss_val = loss.detach().item()
        losses.append(loss_val)
        
        if step % 30 == 0 or step == steps - 1:
            elapsed = time.time() - t0
            eta = (elapsed / max(step + 1, 1)) * (steps - step - 1)
            print(f"  step {step:3d}/{steps}: loss={loss_val:.4f} ({elapsed:.0f}s, ETA {eta:.0f}s)")
        
        if (step + 1) % 50 == 0:
            torch.cuda.empty_cache()
    
    # Save
    out_dir = Path("/brain/qwen3-sov-brain-v5-300steps")
    out_dir.mkdir(exist_ok=True)
    model.save_pretrained(str(out_dir))
    tokenizer.save_pretrained(str(out_dir))
    brain_volume.commit()
    
    elapsed = time.time() - t0
    reduction = 100 * (losses[0] - losses[-1]) / losses[0] if losses[0] > 0 else 0
    sigil = hashlib.sha256(f"v5:{losses[0]:.4f}:{losses[-1]:.4f}:{elapsed:.1f}".encode()).hexdigest()[:16]
    
    print(f"\n{'='*70}")
    print(f"DONE — v5 saved to Volume")
    print(f"  Loss: {losses[0]:.4f} → {losses[-1]:.4f} ({reduction:.1f}%)")
    print(f"  Time: {elapsed:.1f}s")
    print(f"  SIGIL: {sigil}")
    print(f"{'='*70}")
    
    return {
        'initial_loss': losses[0], 'final_loss': losses[-1],
        'reduction_pct': reduction, 'duration_s': elapsed,
        'steps': steps, 'sigil': sigil, 'name': 'brain_v5',
    }


@app.local_entrypoint()
def main():
    data_path = "/tmp/sovereign_train_combined.jsonl"
    if not os.path.exists(data_path):
        sys.exit(1)
    with open(data_path) as f:
        jsonl_content = f.read()
    print(f"Training data: {len(jsonl_content)/1024:.1f} KB")
    with modal.enable_output():
        result = train_v5.remote(jsonl_content, 300)
    print(f"\nResult: {json.dumps(result, indent=2)}")
