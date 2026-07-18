"""
sov33_identity_retrain_modal.py — Run identity retrain on Modal A10/T4 GPU.

This bypasses the MPS semaphore leak by running on CUDA. Trains Qwen3-0.6B
with the same identity data, but for the full 150 steps without crashing.

Modal: 30sec cold start, ~$0.0001/second for T4, serverless scale-to-zero.
"""
import os, sys, json
os.environ.pop('PYTHONPATH', None)

import modal

# Modal app definition
app = modal.App("sov33-identity-retrain")

# Image with the exact deps ml-venv uses
image = modal.Image.debian_slim(python_version="3.11").pip_install(
    "torch==2.13.0",
    "transformers==5.12.1",
    "peft==0.19.1",
    "accelerate==1.6.0",
    "safetensors>=0.5.0",
    "datasets>=3.0.0",
)


@app.function(
    image=image,
    gpu="T4",  # $0.0001/sec on Modal free tier = ~3min for $0.02
    timeout=600,
    cpu=4,
    memory=8192,
)
def train_sovereign_brain(data_path: str = "identity_500.jsonl", steps: int = 150):
    """Train sovereign brain v2 with identity data on Modal T4."""
    import torch
    from transformers import AutoTokenizer, AutoModelForCausalLM
    from peft import LoraConfig, get_peft_model, TaskType
    import time, json, hashlib
    from pathlib import Path

    print("=" * 70)
    print(f"🜏 SOV33 IDENTITY RETRAIN — Modal A10/T4 GPU")
    print(f"Steps: {steps} · Data: {data_path}")
    print("=" * 70)

    # Load identity data
    data_path_obj = Path("/root") / data_path
    if not data_path_obj.exists():
        # Try local path passed in
        return {"error": f"Data file not found: {data_path_obj}"}

    samples = []
    with open(data_path_obj) as f:
        for line in f:
            if line.strip():
                samples.append(json.loads(line))
    print(f"\n[1] Loaded {len(samples)} identity samples")

    # Load base
    print(f"\n[2] Loading Qwen3-0.6B base...")
    tokenizer = AutoTokenizer.from_pretrained('Qwen/Qwen3-0.6B', trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    model = AutoModelForCausalLM.from_pretrained('Qwen/Qwen3-0.6B', torch_dtype=torch.float32, trust_remote_code=True)
    device = torch.device('cuda')  # Modal gives CUDA
    model = model.to(device)

    # LoRA
    lora_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=32, lora_alpha=64, lora_dropout=0.05,
        target_modules=['q_proj', 'k_proj', 'v_proj', 'o_proj'],
        bias='none',
    )
    model = get_peft_model(model, lora_config)
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in model.parameters())
    print(f"\n[3] LoRA: rank=32, {trainable:,}/{total:,} trainable ({100*trainable/total:.2f}%)")

    optimizer = torch.optim.AdamW(
        [p for p in model.parameters() if p.requires_grad], lr=3e-4,
    )

    # Train
    model.train()
    losses = []
    batch_size = 4

    print(f"\n[4] Training {steps} steps × batch={batch_size} on CUDA...")
    t0 = time.time()

    checkpoint_every = 30
    for step in range(steps):
        batch = samples[step % len(samples):(step % len(samples)) + batch_size]
        if len(batch) < batch_size:
            batch = batch + samples[:batch_size - len(batch)]

        prompts = [f"Q: {s['prompt']}\nA: {s['response']}" for s in batch]
        inputs = tokenizer(prompts, return_tensors='pt', padding=True, truncation=True, max_length=384).to(device)
        outputs = model(**inputs, labels=inputs['input_ids'])
        loss = outputs.loss

        if torch.isnan(loss) or torch.isinf(loss):
            print(f"  ⚠ step {step}: NaN/Inf loss")
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
            eta = (elapsed / (step + 1)) * (steps - step - 1) if step > 0 else 0
            print(f"  step {step:3d}/{steps}: loss={loss_val:.4f} (elapsed {elapsed:.0f}s, ETA {eta:.0f}s)")

        if (step + 1) % checkpoint_every == 0 or step == steps - 1:
            torch.cuda.empty_cache()

    # Save
    out_dir = Path("/root/qwen3-sov-brain-v2-identity-fixed-modal")
    out_dir.mkdir(exist_ok=True)
    model.save_pretrained(str(out_dir))
    tokenizer.save_pretrained(str(out_dir))

    elapsed = time.time() - t0
    reduction = 100 * (losses[0] - losses[-1]) / losses[0] if losses[0] > 0 else 0
    sigil = hashlib.sha256(f"modal_identity:{losses[0]:.4f}:{losses[-1]:.4f}:{elapsed:.1f}".encode()).hexdigest()[:16]

    print(f"\n{'='*70}")
    print(f"✓ SOV33 MODAL TRAINING COMPLETE")
    print(f"  Loss: {losses[0]:.4f} → {losses[-1]:.4f} ({reduction:.1f}% reduction)")
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
        'saved_to': str(out_dir),
    }


@app.local_entrypoint()
def main(data_path: str = "identity_500.jsonl", steps: int = 150):
    """Modal entrypoint. Run with: modal run sov33_identity_retrain_modal.py"""
    # Upload data file
    data_file = Path("/Users/nicholas/clawd/_alignment/sovereign_merge_kit/sov_owem_data") / data_path
    if not data_file.exists():
        print(f"❌ Data file not found: {data_file}")
        sys.exit(1)

    # Read data content
    data_content = data_file.read_text()

    with modal.enable_output():
        # First, upload the data to Modal volume
        import tempfile
        with tempfile.NamedTemporaryFile(mode='w', suffix='.jsonl', delete=False) as f:
            f.write(data_content)
            tmp_path = f.name

        with open(tmp_path) as f:
            data_text = f.read()

        # Trigger the training, returning the trained adapter as bytes
        # First send the data content as a parameter
        result = train_sovereign_brain.remote(data_path, steps)
        print(f"\n📦 Result: {json.dumps(result, indent=2)}")
