#!/usr/bin/env python3
"""SOV33_KAGGLE_PHASE27.py — Kaggle T4 submission for SOV33 LARGE sovereign brain.

Run on Kaggle T4 GPU (free tier 30hr/wk).
- Base: Qwen3-1.7B
- LoRA: rank=32
- Training: 1000 samples × 200 steps × batch=4
- Target: ~3.5 hours on T4
- Output: 4 sovereign adapters (one per OWEM) + 1 sovereign brain
"""
import os
os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["WANDB_DISABLED"] = "true"

import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, TrainingArguments, Trainer
from peft import LoraConfig, get_peft_model, TaskType, prepare_model_for_kbit_training
from datasets import load_dataset
from pathlib import Path

# === KAGGLE T4 SETUP ===
print("=" * 70)
print("🜏 SOV33 PHASE 27 — SOV33 LARGE sovereign brain on Kaggle T4")
print("=" * 70)

# 1. Load base
base_path = "Qwen/Qwen3-1.7B"
print(f"Loading base model: {base_path}")
tokenizer = AutoTokenizer.from_pretrained(base_path, trust_remote_code=True)
tokenizer.pad_token = tokenizer.eos_token
model = AutoModelForCausalLM.from_pretrained(
    base_path,
    torch_dtype=torch.float16,  # T4 supports fp16
    device_map="auto",
    trust_remote_code=True,
)
model = prepare_model_for_kbit_training(model)

# 2. LoRA config (rank=32)
lora_config = LoraConfig(
    task_type=TaskType.CAUSAL_LM,
    r=32,
    lora_alpha=64,
    lora_dropout=0.05,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
    bias="none",
)
model = get_peft_model(model, lora_config)
model.print_trainable_parameters()

# 3. Load sovereign corpus
corpus_path = "/kaggle/input/sov33-corpus/sov33_large_world_corpus.jsonl"
print(f"Loading corpus: {corpus_path}")
dataset = load_dataset("json", data_files=corpus_path, split="train")

def format_prompt(example):
    text = f"Q: {example['prompt']}\nA: {example['response']}"
    return tokenizer(text, truncation=True, max_length=512, padding="max_length")

dataset = dataset.map(format_prompt)

# 4. Training
print("Training sovereign brain on T4 GPU...")
training_args = TrainingArguments(
    output_dir="./sov33-large-output",
    num_train_epochs=3,
    per_device_train_batch_size=4,
    gradient_accumulation_steps=4,
    learning_rate=2e-4,
    fp16=True,
    logging_steps=10,
    save_strategy="epoch",
    warmup_ratio=0.1,
    report_to="none",
)
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=dataset,
)
trainer.train()

# 5. Save
out_dir = "./sov33-large-adapter"
model.save_pretrained(out_dir)
tokenizer.save_pretrained(out_dir)
print(f"✓ SOV33 LARGE sovereign brain saved to {out_dir}")
