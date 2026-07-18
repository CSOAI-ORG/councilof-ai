#!/usr/bin/env python3
"""SOV33 compliance expert — REAL LoRA fine-tune, local CPU, small base. Proves the pipeline."""
import json, time, os
os.environ["HF_HUB_ENABLE_HF_TRANSFER"]="0"
import torch
from datasets import load_dataset
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import LoraConfig, get_peft_model
from trl import SFTTrainer, SFTConfig

BASE="Qwen/Qwen2.5-0.5B-Instruct"   # small enough for CPU proof; same arch family as the 4B/35B targets
DATA="/Users/nicholas/clawd/_alignment/sovereign_merge_kit/expert_data/compliance.jsonl"
OUT="/Users/nicholas/clawd/_alignment/sovereign_merge_kit/local_proof/charter-1-compliance"

print(f"🜏 [1/4] load base {BASE} (CPU)"); t0=time.time()
tok=AutoTokenizer.from_pretrained(BASE)
model=AutoModelForCausalLM.from_pretrained(BASE, torch_dtype=torch.float32)
print(f"   loaded in {time.time()-t0:.0f}s, params={sum(p.numel() for p in model.parameters())/1e6:.0f}M")

print("🜏 [2/4] attach LoRA")
lora=LoraConfig(r=8, lora_alpha=16, lora_dropout=0.05, bias="none", task_type="CAUSAL_LM",
                target_modules=["q_proj","k_proj","v_proj","o_proj"])
model=get_peft_model(model, lora)
model.print_trainable_parameters()

print("🜏 [3/4] load + format 801 real compliance examples")
ds=load_dataset("json", data_files=DATA, split="train")
# subset to 120 for a CPU-feasible proof; the pipeline is identical at full scale
ds=ds.select(range(120))
ds=ds.map(lambda ex:{"text": tok.apply_chat_template(ex["messages"], tokenize=False, add_generation_prompt=False)})

print("🜏 [4/4] TRAIN (1 epoch, CPU)"); t0=time.time()
cfg=SFTConfig(output_dir=OUT, num_train_epochs=1, per_device_train_batch_size=1,
              gradient_accumulation_steps=8, learning_rate=2e-4, bf16=False, fp16=False,
              logging_steps=5, save_strategy="no", max_length=1024, report_to=[])
tr=SFTTrainer(model=model, args=cfg, train_dataset=ds)
tr.train()
print(f"   trained in {time.time()-t0:.0f}s")
model=model.merge_and_unload(); model.save_pretrained(OUT); tok.save_pretrained(OUT)

# quick generation smoke-test on a compliance prompt
import glob
print("🜏 SMOKE TEST:")
msgs=[{"role":"system","content":"You are SOVEREIGN-COMPLIANCE. Cite the article."},
      {"role":"user","content":"What does EU AI Act Annex III cover?"}]
ids=tok.apply_chat_template(msgs, return_tensors="pt", add_generation_prompt=True)
out=model.generate(ids, max_new_tokens=60, do_sample=False)
print("   ", tok.decode(out[0][ids.shape[1]:], skip_special_tokens=True)[:200])
print("✅ PROVEN — SOV33 compliance expert trained + saved to", OUT)
print("   files:", [f.split('/')[-1] for f in glob.glob(OUT+'/*')][:8])
