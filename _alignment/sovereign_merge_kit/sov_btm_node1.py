#!/usr/bin/env python3
"""Branch-Train-Merge Node 1: train 3 decorrelated Qwen experts (defense/compliance/intuition),
then TIES-merge into ONE emergence model. All same base (Qwen2.5-0.5B) so they merge cleanly.
Writes merged adapter + per-expert adapters to ./out/. Runs on Modal A100."""
import os, json, torch, gc
from datasets import Dataset
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import LoraConfig, get_peft_model, PeftModel
from trl import SFTConfig, SFTTrainer

BASE="Qwen/Qwen2.5-0.5B-Instruct"
EXPERTS=["defense","compliance","intuition"]
tok=AutoTokenizer.from_pretrained(BASE)
if tok.pad_token is None: tok.pad_token=tok.eos_token

def load_rows(name):
    rows=[]
    for l in open(f"{name}.jsonl"):
        try:
            msgs=json.loads(l)["messages"]
            rows.append({"text": tok.apply_chat_template(msgs, tokenize=False)})
        except Exception: pass
    return rows

def train_expert(name):
    rows=load_rows(name); print(f"[btm] {name}: {len(rows)} rows", flush=True)
    ds=Dataset.from_list(rows)
    model=AutoModelForCausalLM.from_pretrained(BASE, torch_dtype=torch.bfloat16, device_map="auto")
    lora=LoraConfig(r=16, lora_alpha=32, lora_dropout=0.05, task_type="CAUSAL_LM",
        target_modules=["q_proj","k_proj","v_proj","o_proj","gate_proj","up_proj","down_proj"])
    cfg=SFTConfig(output_dir=f"./out/expert_{name}", num_train_epochs=2, per_device_train_batch_size=2,
        gradient_accumulation_steps=4, learning_rate=2e-4, logging_steps=20, save_strategy="no",
        bf16=True, report_to=[], dataset_text_field="text")
    tr=SFTTrainer(model=model, train_dataset=ds, peft_config=lora, args=cfg)
    res=tr.train(); tr.save_model(f"./out/expert_{name}")
    loss=res.training_loss; print(f"[btm] {name} DONE loss={loss:.4f}", flush=True)
    del model, tr; gc.collect(); torch.cuda.empty_cache()
    return loss

# 1) BRANCH+TRAIN the 3 experts
losses={n: train_expert(n) for n in EXPERTS}

# 2) TIES-MERGE: average the 3 LoRA adapters (sign-agree + magnitude) into one
import safetensors.torch as st
adapters={n: st.load_file(f"./out/expert_{n}/adapter_model.safetensors") for n in EXPERTS}
keys=set.intersection(*[set(a.keys()) for a in adapters.values()])
merged={}
for k in keys:
    stack=torch.stack([adapters[n][k].float() for n in EXPERTS])  # [3, ...]
    # TIES: keep sign-majority, average the agreeing ones
    sign=torch.sign(stack.sum(0))
    agree=(torch.sign(stack)==sign).float()
    num=(stack*agree).sum(0); den=agree.sum(0).clamp(min=1)
    merged[k]=(num/den).to(torch.bfloat16)
os.makedirs("./out/emergence_node1", exist_ok=True)
st.save_file(merged, "./out/emergence_node1/adapter_model.safetensors")
# copy an adapter_config from one expert (same shape)
import shutil; shutil.copy(f"./out/expert_{EXPERTS[0]}/adapter_config.json","./out/emergence_node1/adapter_config.json")
nan=sum(int(torch.isnan(v).any()) for v in merged.values())
json.dump({"experts":losses,"merged_tensors":len(merged),"nan_tensors":nan,"method":"TIES"},
          open("./out/btm_node1_result.json","w"), indent=2)
print(f"[btm] MERGED node1: {len(merged)} tensors, {nan} NaN, method=TIES", flush=True)
print(f"[btm] expert losses: {losses}", flush=True)
