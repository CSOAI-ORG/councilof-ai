#!/usr/bin/env python3
"""
SOV3 SOVEREIGN FINE-TUNER — Modal GPU Edition
================================================
Fine-tunes Qwen3-8B on sovereign data using FREE T4 GPU credits on Modal.

Cost: ~$1-3 per training run (T4 @ ~$0.000164/sec)
Free credit: $30/month = ~10+ training runs FREE

The speedway:
1. Start from Qwen3-8B (already pre-trained on trillions of tokens)
2. Load sovereign training data (from our 50GB organic corpus)
3. LoRA fine-tune (only updates 0.1% of weights — fits on T4 16GB)
4. Export quantized GGUF for Ollama deployment
5. Deploy to our substrate

Usage:
  pip install modal
  modal setup   # authenticate (browser)
  modal run sov3_modal_finetune.py

  # Or for inference only (no training):
  modal run sov3_modal_finetune.py --inference --prompt "What is sovereign AI?"
"""

import modal
import json
import os
from pathlib import Path

# ─── MODAL APP ────────────────────────────────────────────────────
app = modal.App("sov3-sovereign-finetuner")

# Container image with ML deps
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("git", "build-essential", "cmake")
    .pip_install(
        "torch==2.4.0",
        "transformers==4.44.0",
        "datasets==2.21.0",
        "peft==0.12.0",          # LoRA
        "trl==0.9.6",            # SFT trainer
        "accelerate==0.33.0",
        "bitsandbytes==0.43.3",  # 4-bit quantization
        "sentencepiece",
        "protobuf",
    )
)

# Persistent volume for model cache (avoids re-downloading 4GB model each run)
model_volume = modal.Volume.from_name("sov3-models", create_if_missing=True)
data_volume = modal.Volume.from_name("sov3-data", create_if_missing=True)


# ═══════════════════════════════════════════════════════════════════
#  TRAINING (runs on Modal T4 GPU — costs ~$1-3 per run)
# ═══════════════════════════════════════════════════════════════════

@app.function(
    gpu="T4",                           # FREE tier: T4 16GB
    image=image,
    volumes={"/models": model_volume, "/data": data_volume},
    timeout=7200,                       # 2 hour max
    memory=16384,                       # 16GB RAM
)
def train_sovereign(
    base_model: str = "Qwen/Qwen2.5-7B-Instruct",
    dataset_path: str = "/data/sov3_training.jsonl",
    output_name: str = "sov3-sovereign-v1",
    epochs: int = 3,
    lora_r: int = 16,
):
    """
    LoRA fine-tune a base model on sovereign data.
    
    LoRA = Low-Rank Adaptation: only trains a small adapter (~50MB)
    instead of the full model. Fits 7B model on 16GB T4 GPU.
    """
    import torch
    from transformers import (
        AutoModelForCausalLM, AutoTokenizer,
        TrainingArguments, DataCollatorForLanguageModeling,
    )
    from peft import LoraConfig, get_peft_model, TaskType
    from datasets import Dataset
    import json

    print(f"🜏 SOV3 SOVEREIGN FINE-TUNER")
    print(f"   Base model: {base_model}")
    print(f"   Dataset: {dataset_path}")
    print(f"   Output: {output_name}")
    print(f"   GPU: {torch.cuda.get_device_name(0)}")
    print(f"   GPU Memory: {torch.cuda.get_device_properties(0).total_mem / 1e9:.1f} GB")
    print()

    # 1. Load tokenizer + model in 4-bit (fits 7B on 16GB T4)
    print("📥 Loading base model (4-bit quantized)...")
    tokenizer = AutoTokenizer.from_pretrained(base_model)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    model = AutoModelForCausalLM.from_pretrained(
        base_model,
        load_in_4bit=True,               # 4-bit = ~4GB instead of 14GB
        device_map="auto",
        torch_dtype=torch.float16,
    )
    model.gradient_checkpointing_enable()  # Save VRAM at cost of speed

    # 2. Apply LoRA (only train adapter weights)
    print("🔧 Applying LoRA adapter...")
    lora_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=lora_r,
        lora_alpha=lora_r * 2,
        lora_dropout=0.05,
        bias="none",
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],  # Attention layers
    )
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()

    # 3. Load training data
    print("📊 Loading sovereign training data...")
    examples = []
    if os.path.exists(dataset_path):
        with open(dataset_path) as f:
            for line in f:
                examples.append(json.loads(line))
    else:
        # Built-in sovereign seed data if no dataset uploaded
        print(f"   [WARN] {dataset_path} not found, using seed data")
        examples = [
            {"text": "Sovereign AI means the model, data, and infrastructure are owned and controlled by the user, not a third party."},
            {"text": "BFT consensus requires 2/3 of voters to agree before a decision is enacted. This prevents single-point-of-failure attacks."},
            {"text": "Ed25519 signatures provide cryptographic proof of authorship. Every sovereign action is signed and verifiable offline."},
            {"text": "The EU AI Act Article 50 requires AI-generated content to be watermarked and traceable to its source."},
            {"text": "An organic world model learns from data through a state-space model (Mamba-2) that compresses history into a fixed-size vector."},
        ]

    dataset = Dataset.from_list(examples)

    def tokenize_fn(examples):
        return tokenizer(
            examples["text"],
            truncation=True,
            max_length=512,
            padding="max_length",
        )

    tokenized = dataset.map(tokenize_fn, batched=True)

    # 4. Train
    print(f"\n🚀 Training {epochs} epochs on {len(examples)} examples...")
    training_args = TrainingArguments(
        output_dir=f"/models/{output_name}",
        num_train_epochs=epochs,
        per_device_train_batch_size=2,    # Small batch for T4
        gradient_accumulation_steps=4,    # Effective batch = 8
        learning_rate=3e-4,
        logging_steps=10,
        save_strategy="epoch",
        warmup_ratio=0.1,
        fp16=True,                        # Half precision for speed
        report_to="none",
    )

    from trl import SFTTrainer

    trainer = SFTTrainer(
        model=model,
        args=training_args,
        train_dataset=tokenized,
        peft_config=lora_config,
    )

    train_result = trainer.train()
    metrics = train_result.metrics

    # 5. Save LoRA adapter
    output_dir = f"/models/{output_name}"
    model.save_pretrained(output_dir)
    tokenizer.save_pretrained(output_dir)
    model_volume.commit()

    print(f"\n✅ Training complete!")
    print(f"   Loss: {metrics.get('train_loss', 'N/A')}")
    print(f"   Model saved to: {output_dir}")
    print(f"   Adapter size: ~{lora_r * 0.05:.0f}MB")

    return {
        "status": "trained",
        "model": output_name,
        "base_model": base_model,
        "loss": metrics.get("train_loss"),
        "examples": len(examples),
        "epochs": epochs,
        "gpu": torch.cuda.get_device_name(0),
    }


# ═══════════════════════════════════════════════════════════════════
#  INFERENCE (runs on Modal GPU — pay per second)
# ═══════════════════════════════════════════════════════════════════

@app.cls(
    gpu="T4",
    image=image,
    volumes={"/models": model_volume},
    container_idle_timeout=300,          # Keep warm 5 min
    min_containers=0,                    # Scale to zero when idle
)
class SovereignModel:
    """Deployed inference endpoint for the fine-tuned model."""

    @modal.enter()
    def setup(self):
        """Load model once when container starts."""
        import torch
        from transformers import AutoModelForCausalLM, AutoTokenizer
        from peft import PeftModel

        base_model = "Qwen/Qwen2.5-7B-Instruct"
        adapter_path = "/models/sov3-sovereign-v1"

        self.tokenizer = AutoTokenizer.from_pretrained(base_model)
        self.model = AutoModelForCausalLM.from_pretrained(
            base_model,
            load_in_4bit=True,
            device_map="auto",
            torch_dtype=torch.float16,
        )
        if os.path.exists(adapter_path):
            self.model = PeftModel.from_pretrained(self.model, adapter_path)
        self.model.eval()

    @modal.method()
    def generate(self, prompt: str, max_tokens: int = 200) -> dict:
        """Generate text from the fine-tuned model."""
        import torch

        inputs = self.tokenizer(prompt, return_tensors="pt").to(self.model.device)
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=max_tokens,
                temperature=0.7,
                do_sample=True,
                pad_token_id=self.tokenizer.pad_token_id,
            )
        text = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        return {"prompt": prompt, "response": text[len(prompt):].strip()}


# ═══════════════════════════════════════════════════════════════════
#  COST ESTIMATOR
# ═══════════════════════════════════════════════════════════════════

@app.function()
def estimate_costs():
    """Real cost estimates for sovereign fine-tuning."""
    costs = {
        "T4 GPU": {"per_hour": 0.164, "vram": "16GB", "free_credit_min": "$30/mo"},
        "A10G GPU": {"per_hour": 1.10, "vram": "24GB"},
        "A100 GPU": {"per_hour": 3.40, "vram": "40-80GB"},
    }

    print("💰 SOV3 FINE-TUNING COST ESTIMATES")
    print("=" * 55)

    for gpu, info in costs.items():
        # Qwen3-8B LoRA: ~2-4 hours on T4, faster on bigger GPUs
        hours_t4 = 3.0
        cost = hours_t4 * info["per_hour"]
        free_runs = 30.0 / cost if cost > 0 else float("inf")
        print(f"\n  {gpu} ({info['vram']})")
        print(f"    Rate: ${info['per_hour']:.3f}/hour")
        print(f"    3-hour fine-tune: ${cost:.2f}")
        print(f"    Free monthly runs: {free_runs:.0f}")
        if "free_credit_min" in info:
            print(f"    {info['free_credit_min']} = {free_runs:.0f} training runs")

    print(f"\n{'='*55}")
    print(f"  RECOMMENDATION: T4 GPU + LoRA")
    print(f"  Cost per sovereign model: ~$0.50-1.00")
    print(f"  Free monthly quota: ~30-60 runs")
    print(f"{'='*55}")

    return costs


# ═══════════════════════════════════════════════════════════════════
#  DATA PREPARATION (runs locally, uploads to Modal volume)
# ═══════════════════════════════════════════════════════════════════

@app.function(image=image, volumes={"/data": data_volume})
def upload_training_data(examples_jsonl: str):
    """Upload sovereign training data to Modal persistent volume."""
    path = "/data/sov3_training.jsonl"
    with open(path, "w") as f:
        f.write(examples_jsonl)
    data_volume.commit()
    
    lines = examples_jsonl.strip().split("\n")
    print(f"✅ Uploaded {len(lines)} training examples to {path}")
    return {"uploaded": len(lines), "path": path}


# ═══════════════════════════════════════════════════════════════════
#  LOCAL ENTRYPOINTS
# ═══════════════════════════════════════════════════════════════════

@app.local_entrypoint()
def main(
    mode: str = "estimate",
    base_model: str = "Qwen/Qwen2.5-7B-Instruct",
    epochs: int = 3,
    dataset_local: str = "./sov3_training_data.jsonl",
):
    """Main entrypoint. Modes: estimate, train."""
    if mode == "estimate":
        estimate_costs.remote()
    elif mode == "train":
        # Upload training data from local file
        dataset_path = os.path.join(os.path.dirname(__file__) or ".", dataset_local)
        if os.path.exists(dataset_path):
            with open(dataset_path) as f:
                data = f.read()
            print(f"📤 Uploading {len(data)} bytes of training data...")
            upload_result = upload_training_data.remote(data)
            dataset_remote = upload_result["path"]
        else:
            print(f"⚠️  Dataset {dataset_path} not found, using built-in seed data")
            dataset_remote = "/data/sov3_training.jsonl"

        result = train_sovereign.remote(
            base_model=base_model,
            dataset_path=dataset_remote,
            epochs=epochs,
        )
        print(f"\n🎉 {json.dumps(result, indent=2)}")
    elif mode == "inference":
        result = SovereignModel().generate.remote(
            "What is sovereign AI governance?"
        )
        print(json.dumps(result, indent=2))
    else:
        print(f"Unknown mode: {mode}. Use 'estimate', 'train', or 'inference'.")
