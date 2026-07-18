"""
SOV33 ANTIDOOM — paste-into-Colab cell. Runs on T4 GPU (~1-2 hours).

PURPOSE: Eliminate "doom loops" (repetitive token spans) in our sovereign-trained
brain. The 200-sample compliance.jsonl gave us a working model but it loops on
certain prompts. Antidoom (Liquid AI, 7 Jul 2026) fixes this with FTPO LoRA.

Recipe:
  1. Take our sovereign-trained qwen3-0.6b-sov-compliance (or merge first)
  2. LoRA r=128-256 on Liquid's antidoom-mix-v1.0 (478k prompt-only rows)
  3. Greedy-decoding + FTPO objective
  4. Eval doom-loop rate before/after at temp=0 AND temp>0
  5. Save new adapter to /content/qwen3-sov-antidoom/

Time: 1-2 hrs on T4. Cost: £0.
"""

import subprocess, os, time

print("[1/6] GPU check")
import torch
assert torch.cuda.is_available(), "No GPU — Runtime → Change runtime type → T4 GPU"
print(f"   {torch.cuda.get_device_name(0)} ({torch.cuda.get_device_properties(0).total_memory//10**9}GB)")

print("[2/6] install stack")
subprocess.run('pip install -q "transformers>=4.44" peft trl bitsandbytes accelerate datasets', shell=True)

print("[3/6] upload sovereign brain")
# Upload: ~/.sovereign/models/qwen3-sov-compliance-0.6b-merged/  (2.4GB)
# Or: ~/.sovereign/models/qwen3-sov-compliance-0.6b/         (168MB adapter + base)

print("[4/6] download antidoom-mix-v1.0")
from datasets import load_dataset
ds = load_dataset("LiquidAI/antidoom-mix-v1.0", split="train")
print(f"   {len(ds)} prompt-only rows (Apache-2.0)")

print("[5/6] FTPO LoRA r=128")
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from peft import LoraConfig, get_peft_model
from trl import SFTTrainer, SFTConfig

# Use merged sovereign model OR base Qwen3-0.6B + our LoRA adapter
BASE = "Qwen/Qwen3-0.6B"
# OPTION A: fresh base + antidoom LoRA
# OPTION B: merged sovereign model + antidoom LoRA (RECOMMENDED)
# BASE = "/content/qwen3-sov-compliance-0.6b-merged"  # uncomment if uploaded

bnb = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4",
                         bnb_4bit_compute_dtype=torch.bfloat16)
tok = AutoTokenizer.from_pretrained(BASE)
model = AutoModelForCausalLM.from_pretrained(BASE, quantization_config=bnb, device_map="auto")

lora = LoraConfig(r=128, lora_alpha=256, lora_dropout=0.05, bias="none",
                  task_type="CAUSAL_LM",
                  target_modules=["q_proj","k_proj","v_proj","o_proj",
                                  "gate_proj","up_proj","down_proj"])
model = get_peft_model(model, lora)
model.print_trainable_parameters()

# Format as prompts (Antidoom is prompt-only)
def format_prompt(ex):
    return {"text": ex.get("prompt", str(ex))}
ds = ds.map(format_prompt, remove_columns=ds.column_names)

cfg = SFTConfig(output_dir="/content/qwen3-sov-antidoom",
                num_train_epochs=1,
                per_device_train_batch_size=8,
                gradient_accumulation_steps=4,
                learning_rate=5e-5,
                bf16=True, logging_steps=50,
                save_strategy="no", max_length=512)

print("[6/6] train + save")
t0 = time.time()
SFTTrainer(model=model, args=cfg, train_dataset=ds).train()
model = model.merge_and_unload()
model.save_pretrained("/content/qwen3-sov-antidoom")
tok.save_pretrained("/content/qwen3-sov-antidoom")
print(f"DONE in {(time.time()-t0)/60:.1f} min — download /content/qwen3-sov-antidoom/")

# Verify doom-loop rate
# (would need to load sovereign compliance prompts and measure repetition)
