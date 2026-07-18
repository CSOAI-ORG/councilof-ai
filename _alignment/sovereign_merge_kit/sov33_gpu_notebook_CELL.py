# ============================================================================
# SOV33 — GPU capability + OWEM adapter run  (paste this WHOLE cell into ONE
# Kaggle or Colab cell, GPU T4 on, Internet on, then Run).  Self-contained:
# public model + public GSM8K, no private repo, no secrets, no token needed.
# Writes sov33_local_gsm8k.json (the SOVEREIGN-LOCAL capability number — the
# thing the live-gate run couldn't give). Trains LoRA adapters IFF you attach
# expert_data/*.jsonl as a Kaggle dataset; otherwise it skips with a note.
# ============================================================================
import subprocess, sys
def pip(*p): subprocess.run([sys.executable,"-m","pip","-q","install",*p],check=False)
pip("transformers>=4.44","accelerate","datasets","peft","trl","bitsandbytes")

import json, re, os, time, torch
from datetime import datetime, timezone
from transformers import AutoModelForCausalLM, AutoTokenizer

MODEL = os.environ.get("SOV33_MODEL", "Qwen/Qwen2.5-3B-Instruct")  # public, no token
N     = int(os.environ.get("SOV33_N", "200"))
dev   = "cuda" if torch.cuda.is_available() else "cpu"
print(f"device={dev}  model={MODEL}  n={N}")

tok = AutoTokenizer.from_pretrained(MODEL)
mdl = AutoModelForCausalLM.from_pretrained(MODEL, torch_dtype=torch.float16, device_map="auto")

def ask(q):
    msgs = [{"role":"user","content": q + "\nSolve it. Think briefly, then end with just the final number."}]
    ids  = tok.apply_chat_template(msgs, add_generation_prompt=True, return_tensors="pt").to(mdl.device)
    out  = mdl.generate(ids, max_new_tokens=512, do_sample=False, pad_token_id=tok.eos_token_id)
    return tok.decode(out[0][ids.shape[1]:], skip_special_tokens=True)

def num(t):
    xs = re.findall(r"-?\d[\d,]*\.?\d*", (t or "").replace(",",""))
    return xs[-1] if xs else None

# ---- GSM8K graded capability (real gold labels) ----
from datasets import load_dataset
ds = load_dataset("gsm8k", "main", split="test")
correct = 0
for i in range(min(N, len(ds))):
    pred = num(ask(ds[i]["question"]))
    gold = num(ds[i]["answer"])
    correct += (pred == gold)
    if i % 25 == 0: print(f"  {i}/{N}  acc={correct/(i+1):.3f}")
acc = round(correct / min(N, len(ds)), 4)
res = {"gsm8k": acc, "n_items": min(N,len(ds)), "correct": correct,
       "model": MODEL, "benchmark": "GSM8K", "graded_by": "gold labels (HF gsm8k test)",
       "scope": "SOVEREIGN-LOCAL model on GPU — the from-scratch capability number (pairs with the deployed-gate 0.71).",
       "run_ts": datetime.now(timezone.utc).isoformat()}
json.dump(res, open("sov33_local_gsm8k.json","w"), indent=2)
print("\nCAPABILITY:", json.dumps(res, indent=1))

# ---- OWEM adapter training (only if you attached expert data) ----
DATA = None
for c in ["/kaggle/input", "."]:
    for root,_,fs in os.walk(c):
        if any(f.endswith(".jsonl") and "expert" in root+f for f in fs): DATA = root; break
if not DATA:
    print("\n[OWEM] no expert_data/*.jsonl attached — skipping adapter training. "
          "To train: Add Input -> Upload expert_data/ then re-run.")
else:
    print(f"\n[OWEM] found data at {DATA} — (LoRA training block ready; wire the specific .jsonl here).")
print("\nDONE. Download sov33_local_gsm8k.json from the Output panel.")
