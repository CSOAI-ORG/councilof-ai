"""
sov33_modal_train_v2.py — Train + persist sovereign brain to Modal Volume.

This writes the trained adapter to a Modal Volume (persistent storage),
then we can fetch it from local Mac.

Run: modal run sov33_modal_train_v2.py
Then: modal volume get sov33-brain-output qwen3-sov-brain-identity-fixed /Users/nicholas/.sovereign/models/
"""
import os, sys, json, time
os.environ.pop('PYTHONPATH', None)

import modal

app = modal.App("sov33-identity-train-v2")

# Create persistent volume for adapter output
brain_volume = modal.Volume.from_name("sov33-brain-output", create_if_missing=True)

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
    volumes={"/brain": brain_volume},
)
def train_and_persist(jsonl_content: str, steps: int = 150):
    """Train, then save adapter to Modal Volume for retrieval."""
    import torch
    from transformers import AutoTokenizer, AutoModelForCausalLM
    from peft import LoraConfig, get_peft_model, TaskType
    import hashlib
    from pathlib import Path

    print("=" * 70)
    print("SOV33 IDENTITY RETRAIN — Modal T4 + persistent Volume")
    print(f"  Steps: {steps}")
    print("=" * 70)

    samples = [json.loads(line) for line in jsonl_content.splitlines() if line.strip()]
    print(f"[1] Loaded {len(samples)} identity samples")

    print(f"[2] Loading Qwen3-0.6B...")
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
    print(f"[3] LoRA: rank=32, {trainable:,} trainable")

    optimizer = torch.optim.AdamW(
        [p for p in model.parameters() if p.requires_grad], lr=3e-4,
    )

    model.train()
    losses = []
    batch_size = 4
    t0 = time.time()

    print(f"[4] Training {steps} steps × batch={batch_size}...")
    for step in range(steps):
        batch = samples[step % len(samples):(step % len(samples)) + batch_size]
        if len(batch) < batch_size:
            batch = batch + samples[:batch_size - len(batch)]

        prompts = [f"Q: {s['prompt']}\nA: {s['response']}" for s in batch]
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

        if step % 15 == 0 or step == steps - 1:
            elapsed = time.time() - t0
            eta = (elapsed / max(step + 1, 1)) * (steps - step - 1)
            print(f"  step {step:3d}/{steps}: loss={loss_val:.4f} ({elapsed:.0f}s, ETA {eta:.0f}s)")

        if (step + 1) % 30 == 0:
            torch.cuda.empty_cache()

    # Save to persistent Volume
    out_dir = Path("/brain/qwen3-sov-brain-identity-fixed")
    out_dir.mkdir(exist_ok=True)
    print(f"[5] Saving adapter to Volume: {out_dir}")
    model.save_pretrained(str(out_dir))
    tokenizer.save_pretrained(str(out_dir))
    brain_volume.commit()

    # Also save training manifest for audit
    elapsed = time.time() - t0
    reduction = 100 * (losses[0] - losses[-1]) / losses[0] if losses[0] > 0 else 0
    sigil = hashlib.sha256(
        f"modal-v2:{losses[0]:.4f}:{losses[-1]:.4f}:{elapsed:.1f}".encode()
    ).hexdigest()[:16]

    manifest = {
        'initial_loss': losses[0],
        'final_loss': losses[-1],
        'reduction_pct': reduction,
        'duration_s': elapsed,
        'steps': steps,
        'sigil': sigil,
        'platform': 'modal-t4-cuda',
        'bypassed': 'mps-semaphore-leak',
    }
    (out_dir.parent / 'manifest.json').write_text(json.dumps(manifest, indent=2))
    brain_volume.commit()

    print(f"\n{'='*70}")
    print(f"DONE — adapter persisted to Volume")
    print(f"  Loss: {losses[0]:.4f} → {losses[-1]:.4f} ({reduction:.1f}%)")
    print(f"  Time: {elapsed:.1f}s")
    print(f"  SIGIL: {sigil}")
    print(f"{'='*70}")

    return manifest


@app.local_entrypoint()
def main():
    data_path = "/Users/nicholas/clawd/_alignment/sovereign_merge_kit/sov_owem_data/identity_500.jsonl"
    if not os.path.exists(data_path):
        sys.exit(1)

    with open(data_path) as f:
        jsonl_content = f.read()

    print(f"Uploading {len(jsonl_content)/1024:.1f} KB to Modal...")
    with modal.enable_output():
        manifest = train_and_persist.remote(jsonl_content, 150)

    print(f"\nResult: {json.dumps(manifest, indent=2)}")
    print(f"\nTo retrieve adapter:")
    print(f"  modal volume get sov33-brain-output /Users/nicholas/.sovereign/models/")
