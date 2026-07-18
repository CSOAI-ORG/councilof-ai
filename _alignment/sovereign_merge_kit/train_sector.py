#!/usr/bin/env python3
"""train_sector.py — generalized per-sector LoRA trainer for the fan-out wave.
Handles BOTH schemas: instruction/response AND messages (chat). Reads $SECTOR_CORPUS, trains LoRA on
Qwen2.5-0.5B, measures before/after held-out token-overlap, saves adapter + result JSON. Fired via submit_job.
"""
import os, json, torch, random
from transformers import AutoTokenizer, AutoModelForCausalLM, TrainingArguments, Trainer, DataCollatorForLanguageModeling
from datasets import Dataset
from peft import LoraConfig, get_peft_model

BASE = os.environ.get("BASE_MODEL", "Qwen/Qwen2.5-0.5B-Instruct")
CORPUS = os.environ.get("SECTOR_CORPUS", "corpus.jsonl")
SECTOR = os.environ.get("SECTOR_NAME", "sector")

rows = [json.loads(l) for l in open(CORPUS) if l.strip()]
def to_pair(r):
    if "instruction" in r and "response" in r:
        return r["instruction"], r["response"]
    if "messages" in r:
        msgs = r["messages"]; u = next((m["content"] for m in msgs if m["role"]=="user"), "")
        a = next((m["content"] for m in msgs if m["role"]=="assistant"), "")
        if not a: a = next((m["content"] for m in msgs if m["role"]=="system"), "")
        return u, a
    return None, None
pairs = [(q,a) for q,a in (to_pair(r) for r in rows) if q and a]
random.seed(0); random.shuffle(pairs)
n_test = max(5, int(len(pairs)*0.15)); test = pairs[:n_test]; train = pairs[n_test:]
print(f"[{SECTOR}] corpus {len(rows)} -> pairs {len(pairs)} -> train {len(train)} / held-out {len(test)}", flush=True)

tok = AutoTokenizer.from_pretrained(BASE); tok.pad_token = tok.pad_token or tok.eos_token
def fmt(q,a): return f"<|im_start|>user\n{q}<|im_end|>\n<|im_start|>assistant\n{a}<|im_end|>"
def gen(model,q,mx=120):
    ids=tok(f"<|im_start|>user\n{q}<|im_end|>\n<|im_start|>assistant\n",return_tensors="pt").to(model.device)
    out=model.generate(**ids,max_new_tokens=mx,do_sample=False,pad_token_id=tok.pad_token_id)
    return tok.decode(out[0][ids.input_ids.shape[1]:],skip_special_tokens=True)
def overlap(p,g):
    ps,gs=set(p.lower().split()),set(g.lower().split())
    return len(ps&gs)/max(len(gs),1)

base=AutoModelForCausalLM.from_pretrained(BASE,torch_dtype=torch.float16,device_map="auto")
before=sum(overlap(gen(base,q),a) for q,a in test)/len(test)
print(f"[{SECTOR}] BEFORE held-out overlap: {before:.4f}",flush=True)

model=get_peft_model(base,LoraConfig(r=16,lora_alpha=32,lora_dropout=0.05,task_type="CAUSAL_LM",
      target_modules=["q_proj","k_proj","v_proj","o_proj","gate_proj","up_proj","down_proj"]))
ds=Dataset.from_dict({"text":[fmt(q,a) for q,a in train]})
def tk(b): return tok(b["text"],truncation=True,max_length=512,padding="max_length")
ds=ds.map(tk,batched=True,remove_columns=["text"])
Trainer(model=model,args=TrainingArguments("out_tmp",per_device_train_batch_size=4,gradient_accumulation_steps=2,
        num_train_epochs=3,learning_rate=2e-4,fp16=True,logging_steps=10,save_strategy="no",report_to=[]),
        train_dataset=ds,data_collator=DataCollatorForLanguageModeling(tok,mlm=False)).train()
after=sum(overlap(gen(model,q),a) for q,a in test)/len(test)
print(f"[{SECTOR}] AFTER held-out overlap: {after:.4f}",flush=True)
os.makedirs("out",exist_ok=True)
model.save_pretrained(f"out/{SECTOR}_adapter")
res={"sector":SECTOR,"base":BASE,"n_train":len(train),"n_heldout":len(test),
     "before_overlap":round(before,4),"after_overlap":round(after,4),
     "gain":round(after-before,4),"verdict":"GO" if after>before else "NO-GO"}
json.dump(res,open(f"out/{SECTOR}_result.json","w"),indent=2)
print(f"[{SECTOR}] RESULT {json.dumps(res)}",flush=True)
