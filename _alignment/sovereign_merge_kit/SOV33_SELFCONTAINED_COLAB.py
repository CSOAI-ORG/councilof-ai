# ═══════════════════════════════════════════════════════════════════════════
# 🜏 SOV33 — SELF-CONTAINED PROOF CELL  (paste into ONE Colab cell, Run)
# No GitHub clone needed (repo is private). You upload ONE file: compliance.jsonl
# Runtime → Change runtime type → T4 GPU first.  ~£0, ~1-2 hrs.
# ═══════════════════════════════════════════════════════════════════════════
import subprocess, os, torch

print("🜏 [1/5] GPU check")
assert torch.cuda.is_available(), "No GPU — Runtime → Change runtime type → T4 GPU, rerun."
print("   ✓", torch.cuda.get_device_name(0))

print("🜏 [2/5] install stack (~2 min)")
subprocess.run('pip install -q "transformers>=4.44" peft trl bitsandbytes accelerate datasets', shell=True)

print("🜏 [3/5] upload your compliance.jsonl (click Choose Files when prompted)")
if not os.path.exists("compliance.jsonl"):
    from google.colab import files
    up = files.upload()   # pick compliance.jsonl from your Mac
print("   examples:", sum(1 for _ in open("compliance.jsonl")))

print("🜏 [4/5] fine-tune COMPLIANCE expert — Qwen3.6-4B QLoRA, 2 epochs")
from datasets import load_dataset
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from peft import LoraConfig, get_peft_model
from trl import SFTTrainer, SFTConfig

BASE="Qwen/Qwen3.6-4B"; OUT="charter-1-compliance"
bnb=BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4", bnb_4bit_compute_dtype=torch.bfloat16)
tok=AutoTokenizer.from_pretrained(BASE)
model=AutoModelForCausalLM.from_pretrained(BASE, quantization_config=bnb, device_map="auto")
lora=LoraConfig(r=16, lora_alpha=32, lora_dropout=0.05, bias="none", task_type="CAUSAL_LM",
                target_modules=["q_proj","k_proj","v_proj","o_proj","gate_proj","up_proj","down_proj"])
model=get_peft_model(model, lora)
ds=load_dataset("json", data_files="compliance.jsonl", split="train")
ds=ds.map(lambda ex:{"text": tok.apply_chat_template(ex["messages"], tokenize=False, add_generation_prompt=False)})
cfg=SFTConfig(output_dir=OUT, num_train_epochs=2, per_device_train_batch_size=2,
              gradient_accumulation_steps=4, learning_rate=2e-4, bf16=True,
              logging_steps=10, save_strategy="epoch", max_length=2048)
SFTTrainer(model=model, args=cfg, train_dataset=ds).train()
model=model.merge_and_unload(); model.save_pretrained(OUT); tok.save_pretrained(OUT)

print("🜏 [5/5] ✅ PROVEN — SOV33 compliance expert trained + saved to", OUT)
print("   The pipeline works. Repeat for defense/intuition/voice, then merge.")
