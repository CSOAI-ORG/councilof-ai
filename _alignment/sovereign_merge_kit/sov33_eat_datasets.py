#!/usr/bin/env python3
"""sov33_eat_datasets.py — EAT free, open, COMMERCIAL-SAFE training data to grow the Sovereign student.

Honest design:
  - Only datasets whose license permits commercial use are included (Apache / MIT / CC-BY / CC-BY-SA).
    Non-commercial sets (alpaca CC-BY-NC, no_robots CC-BY-NC, etc.) are DELIBERATELY EXCLUDED — a commercial
    Sovereign product can't train on NC data. Each entry is license-tagged; verify on the model card if unsure.
  - Runs where there's DISK + a bit of RAM: the Oracle VM (42GB), Colab, or Modal — NOT the 2GB-free Mac.
    Uses streaming so it works on low-RAM hosts; caps rows per set so it stays small and fast.
  - Output = one unified instruction/response jsonl, deduped, ready for sov33_gpu_fire.py (QLoRA).

Usage (on a host with disk):  pip install datasets && python3 sov33_eat_datasets.py --per 2000
"""
import os, json, argparse, hashlib

# (hf_id, config, split, license, commercial_ok, mapper-name). Only commercial_ok=True are eaten.
SOURCES = [
    ("Open-Orca/OpenOrca",            None,        "train", "MIT",        True,  "orca"),
    ("databricks/databricks-dolly-15k", None,      "train", "CC-BY-SA-3.0", True, "dolly"),
    ("OpenAssistant/oasst1",          None,        "train", "Apache-2.0", True,  "oasst"),
    ("coastalcph/lex_glue",           "eurlex",    "train", "CC-BY (mostly; verify)", True, "lexglue"),
    # excluded on purpose (non-commercial): tatsu-lab/alpaca (CC-BY-NC), HuggingFaceH4/no_robots (CC-BY-NC)
]

def _q(ex, keys):
    for k in keys:
        v = ex.get(k)
        if isinstance(v, str) and v.strip(): return v.strip()
    return ""

def orca(ex):    return _q(ex,["question","system_prompt"]), _q(ex,["response"])
def dolly(ex):   return (_q(ex,["instruction"]) + (("\n"+ex["context"]) if ex.get("context") else "")), _q(ex,["response"])
def oasst(ex):   return (_q(ex,["text"]) if ex.get("role")=="prompter" else ""), ""   # oasst needs pairing; keep prompts only as seeds
def lexglue(ex): return f"Classify this EU legal text: {_q(ex,['text'])[:1500]}", str(ex.get("labels") or ex.get("label") or "")
MAP = {"orca":orca,"dolly":dolly,"oasst":oasst,"lexglue":lexglue}

def eat(per_source=2000, out="expert_data/eaten_open.jsonl"):
    try:
        from datasets import load_dataset
    except Exception:
        print("pip install datasets  (run on the VM/Colab, not the Mac)"); return
    os.makedirs(os.path.dirname(out), exist_ok=True)
    seen=set(); n=0
    with open(out,"w") as f:
        for hf_id, cfg, split, lic, ok, mname in SOURCES:
            if not ok:
                print(f"skip (non-commercial): {hf_id}"); continue
            print(f"eating {hf_id} [{lic}] ...", end=" ", flush=True)
            got=0
            try:
                ds = load_dataset(hf_id, cfg, split=split, streaming=True)
                for ex in ds:
                    instr, resp = MAP[mname](ex)
                    if not instr or not resp: continue
                    key=hashlib.sha1(instr.lower()[:120].encode()).hexdigest()
                    if key in seen: continue
                    seen.add(key); f.write(json.dumps({"instruction":instr[:2000],"response":resp[:2000],"_src":hf_id,"_license":lic})+"\n")
                    got+=1; n+=1
                    if got>=per_source: break
                print(f"{got} rows")
            except Exception as e:
                print(f"skipped ({str(e)[:60]})")
    print(f"\n✅ ate {n} commercial-safe rows -> {out}")
    print("next: merge with sovereign_distilled.jsonl and run sov33_gpu_fire.py (QLoRA) on a free GPU")

if __name__=="__main__":
    ap=argparse.ArgumentParser(); ap.add_argument("--per",type=int,default=2000); ap.add_argument("--out",default="expert_data/eaten_open.jsonl")
    a=ap.parse_args(); eat(a.per, a.out)
