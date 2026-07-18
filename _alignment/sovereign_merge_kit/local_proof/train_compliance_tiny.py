#!/usr/bin/env python3
"""SOV33 compliance expert — REAL LoRA fine-tune, tiny base, CPU, unbuffered. Proves pipeline."""
import sys, json, time, glob
def log(m): print(m, flush=True)
import torch
from datasets import load_dataset
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import LoraConfig, get_peft_model
from trl import SFTTrainer, SFTConfig

BASE="HuggingFaceTB/SmolLM2-135M-Instruct"   # 135M — weights ~270MB, feasible on this CPU/RAM
DATA="/Users/nicholas/clawd/_alignment/sovereign_merge_kit/expert_data/compliance.jsonl"
OUT="/Users/nicholas/clawd/_alignment/sovereign_merge_kit/local_proof/charter-1-compliance"

log(f"🜏 [1/4] download+load base {BASE}"); t0=time.time()
tok=AutoTokenizer.from_pretrained(BASE)
log(f"   tokenizer ok ({time.time()-t0:.0f}s), downloading weights...")
model=AutoModelForCausalLM.from_pretrained(BASE, torch_dtype=torch.float32)
log(f"   model loaded in {time.time()-t0:.0f}s, params={sum(p.numel() for p in model.parameters())/1e6:.0f}M")

log("🜏 [2/4] attach LoRA")
lora=LoraConfig(r=8, lora_alpha=16, lora_dropout=0.05, bias="none", task_type="CAUSAL_LM",
                target_modules=["q_proj","v_proj"])
model=get_peft_model(model, lora); model.print_trainable_parameters()

log("🜏 [3/4] load 801 real compliance examples, use 60 for CPU proof")
ds=load_dataset("json", data_files=DATA, split="train").select(range(60))
ds=ds.map(lambda ex:{"text": tok.apply_chat_template(ex["messages"], tokenize=False, add_generation_prompt=False)})
log(f"   formatted {len(ds)} examples")

log("🜏 [4/4] TRAIN 1 epoch CPU"); t0=time.time()
cfg=SFTConfig(output_dir=OUT, num_train_epochs=1, per_device_train_batch_size=1,
              gradient_accumulation_steps=4, learning_rate=2e-4, bf16=False, fp16=False,
              logging_steps=3, save_strategy="no", max_length=512, report_to=[])
SFTTrainer(model=model, args=cfg, train_dataset=ds).train()
log(f"   trained in {time.time()-t0:.0f}s")
model=model.merge_and_unload(); model.save_pretrained(OUT); tok.save_pretrained(OUT)
log("✅ PROVEN — saved to "+OUT)
log("   files: "+str([f.split('/')[-1] for f in glob.glob(OUT+'/*')]))
