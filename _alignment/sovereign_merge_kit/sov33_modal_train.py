"""
sov33_modal_train.py — Push identity retrain to Modal GPU (bypasses MPS leak).

MPS dies at step 45/150 with semaphore leak. Modal T4 has CUDA, runs full 150 steps.

Run: modal run sov33_modal_train.py
"""
import os, sys, json, time
os.environ.pop('PYTHONPATH', None)

import modal

app = modal.App("sov33-identity-retrain")

# Modal image with the right deps
train_image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "torch==2.13.0",
        "transformers==5.12.1",
        "peft>=0.18.0",
        "accelerate>=1.6.0",
        "safetensors>=0.5.0",
    )
)

@app.function(
    image=train_image,
    gpu="T4",
    timeout=900,
    cpu=4,
    memory=8192,
)
def train_identity_brain(jsonl_content: str, steps: int = 150):
    """Train sovereign brain with identity data. Returns SIGIL + loss stats."""
    import torch
    from transformers import AutoTokenizer, AutoModelForCausalLM
    from peft import LoraConfig, get_peft_model, TaskType
    import hashlib
    from pathlib import Path

    print("=" * 70)
    print("SOV33 IDENTITY RETRAIN — Modal T4 (CUDA, no MPS)")
    print(f"  Steps: {steps}")
    print("=" * 70)

    # Parse JSONL
    samples = [json.loads(line) for line in jsonl_content.splitlines() if line.strip()]
    print(f"[1] Loaded {len(samples)} identity samples")

    # Load model on CUDA
    print(f"[2] Loading Qwen3-0.6B...")
    tokenizer = AutoTokenizer.from_pretrained('Qwen/Qwen3-0.6B', trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    model = AutoModelForCausalLM.from_pretrained(
        'Qwen/Qwen3-0.6B', torch_dtype=torch.float32, trust_remote_code=True,
    ).to('cuda')

    # LoRA config
    lora_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=32, lora_alpha=64, lora_dropout=0.05,
        target_modules=['q_proj', 'k_proj', 'v_proj', 'o_proj'],
        bias='none',
    )
    model = get_peft_model(model, lora_config)
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in model.parameters())
    print(f"[3] LoRA: rank=32, {trainable:,}/{total:,} trainable ({100*trainable/total:.2f}%)")

    optimizer = torch.optim.AdamW(
        [p for p in model.parameters() if p.requires_grad], lr=3e-4,
    )

    # Train
    model.train()
    losses = []
    batch_size = 4
    t0 = time.time()

    print(f"[4] Training {steps} steps × batch={batch_size} on T4...")
    for step in range(steps):
        batch = samples[step % len(samples):(step % len(samples)) + batch_size]
        if len(batch) < batch_size:
            batch = batch + samples[:batch_size - len(batch)]

        prompts = [f"Q: {s['prompt']}\nA: {s['response']}" for s in batch]
        # FIX: use .to('cuda') not .cuda()
        inputs = tokenizer(prompts, return_tensors='pt', padding=True,
                          truncation=True, max_length=384).to('cuda')
        outputs = model(**inputs, labels=inputs['input_ids'])
        loss = outputs.loss

        if torch.isnan(loss) or torch.isinf(loss):
            print(f"  step {step}: NaN/Inf, skipping")
            optimizer.zero_grad()
            continue

        optimizer.zero_grad()
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        optimizer.step()
        loss_val = loss.detach().item()
        losses.append(loss_val)

        if step % 15 == 0 or step == steps - 1:
            elapsed = time.time() - t0
            eta = (elapsed / max(step + 1, 1)) * (steps - step - 1)
            print(f"  step {step:3d}/{steps}: loss={loss_val:.4f} ({elapsed:.0f}s, ETA {eta:.0f}s)")

        if (step + 1) % 30 == 0:
            torch.cuda.empty_cache()

    # Save
    out_dir = Path("/root/qwen3-sov-brain-identity-fixed")
    out_dir.mkdir(exist_ok=True)
    model.save_pretrained(str(out_dir))
    tokenizer.save_pretrained(str(out_dir))

    elapsed = time.time() - t0
    reduction = 100 * (losses[0] - losses[-1]) / losses[0] if losses[0] > 0 else 0
    sigil = hashlib.sha256(
        f"modal:{losses[0]:.4f}:{losses[-1]:.4f}:{elapsed:.1f}".encode()
    ).hexdigest()[:16]

    print(f"\n{'='*70}")
    print(f"Modal training DONE")
    print(f"  Loss: {losses[0]:.4f} → {losses[-1]:.4f} ({reduction:.1f}% drop)")
    print(f"  Time: {elapsed:.1f}s")
    print(f"  SIGIL: {sigil}")
    print(f"{'='*70}")

    return {
        'initial_loss': losses[0],
        'final_loss': losses[-1],
        'reduction_pct': reduction,
        'duration_s': elapsed,
        'steps': steps,
        'sigil': sigil,
    }


@app.local_entrypoint()
def main():
    """Read local identity data and trigger Modal training."""
    data_path = "/Users/nicholas/clawd/_alignment/sovereign_merge_kit/sov_owem_data/identity_500.jsonl"

    if not os.path.exists(data_path):
        print(f"Data not found: {data_path}")
        sys.exit(1)

    with open(data_path) as f:
        jsonl_content = f.read()

    print(f"Uploading {len(jsonl_content)/1024:.1f} KB to Modal...")
    print(f"Triggering identity retrain on T4 GPU...")

    with modal.enable_output():
        result = train_identity_brain.remote(jsonl_content, 150)

    print(f"\nResult: {json.dumps(result, indent=2)}")
    print(f"\nTo retrieve adapter: scp/rsync from Modal container")
