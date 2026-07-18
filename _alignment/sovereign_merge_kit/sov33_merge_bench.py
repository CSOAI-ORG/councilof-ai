#!/usr/bin/env python3
"""Benchmark clean merged adapters on identity questions."""
import os, sys, json
os.environ.pop('PYTHONPATH', None)
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel

BASE = 'Qwen/Qwen3-0.6B'
MDIR = os.path.expanduser('~/.sovereign/models')
QS = [
    "Who are you?",
    "Are you Nicholas Templeman?",
    "What is your name?",
    "Who created you?",
    "What is Article 0?",
    "What can you do?",
    "Hello",
    "Are you a chatbot?",
]

def test(model, tok, q):
    prompt = f"Q: {q}\nA: "
    inp = tok(prompt, return_tensors='pt').to(model.device)
    with torch.no_grad():
        out = model.generate(**inp, max_new_tokens=50, temperature=0.3, do_sample=True, pad_token_id=tok.eos_token_id)
    return tok.decode(out[0][inp['input_ids'].shape[1]:], skip_special_tokens=True).strip()[:120]

print("="*60)
print("SOV33 CLEAN MERGE BENCHMARK")
print("="*60)

tok = AutoTokenizer.from_pretrained(BASE, trust_remote_code=True)
if tok.pad_token is None: tok.pad_token = tok.eos_token
dev = torch.device('mps' if torch.backends.mps.is_available() else 'cpu')

variants = [
    ('base', None),
    ('merged-linear', 'sov33-merged-linear'),
    ('merged-ties', 'sov33-merged-ties'),
    ('merged-dare-ties', 'sov33-merged-dare-ties'),
    ('compliance-V2', 'qwen3-sov-compliance-0.6b-V2'),
]

for name, adapter in variants:
    print(f"\n[{name}]")
    base_model = AutoModelForCausalLM.from_pretrained(BASE, torch_dtype=torch.float32, trust_remote_code=True).to(dev)
    if adapter:
        model = PeftModel.from_pretrained(base_model, os.path.join(MDIR, adapter))
    else:
        model = base_model
    model.eval()
    
    for q in QS:
        try:
            resp = test(model, tok, q)
            print(f"  {q[:25]:25s} -> {resp[:90]}")
        except Exception as e:
            print(f"  {q[:25]:25s} -> ERROR: {str(e)[:60]}")
    
    del model
    if adapter: del base_model
    try: torch.mps.empty_cache()
    except: pass

print("\n" + "="*60)
print("DONE")
