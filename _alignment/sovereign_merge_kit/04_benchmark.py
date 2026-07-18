#!/usr/bin/env python3
"""04_benchmark.py — score merged vs experts vs base on a task battery. The PROOF step.
A merge that does not beat its parts is dead weight — this quantifies it honestly.
Usage: python 04_benchmark.py --models base=Qwen/Qwen3.6-4B merged=./sovereign-merged moe=./sovereign-moe
"""
import argparse, json, pathlib
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

# A small honest battery — REPLACE/EXTEND with your real held-out governance tasks.
BATTERY = [
 {"q": "A hiring tool ranks CV-screening candidates. What EU AI Act risk tier and why?",
  "must_include": ["high", "annex iii"]},
 {"q": "Name one prohibited practice under EU AI Act Article 5.",
  "must_include": ["biometric"]},
 {"q": "Explain 'data minimisation' to a non-technical user in one sentence.",
  "must_include": ["only", "need"]},
]

def score_model(path, tok_path=None):
    tok = AutoTokenizer.from_pretrained(tok_path or path)
    m = AutoModelForCausalLM.from_pretrained(path, torch_dtype=torch.bfloat16, device_map="auto")
    hits = 0; total = 0
    for item in BATTERY:
        msgs = [{"role":"user","content":item["q"]}]
        ids = tok.apply_chat_template(msgs, return_tensors="pt", add_generation_prompt=True).to(m.device)
        out = m.generate(ids, max_new_tokens=200, do_sample=False)
        txt = tok.decode(out[0][ids.shape[1]:], skip_special_tokens=True).lower()
        ok = all(k in txt for k in item["must_include"])
        hits += int(ok); total += 1
    return hits/total

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--models", nargs="+", required=True, help="name=path pairs")
    a = ap.parse_args()
    results = {}
    for pair in a.models:
        name, path = pair.split("=", 1)
        results[name] = score_model(path)
        print(f"{name}: {results[name]:.3f}")
    # the verdict
    if "merged" in results and "base" in results:
        delta = results["merged"] - results["base"]
        print(f"\nVERDICT: merged {'BEATS' if delta>0 else 'LOSES TO'} base by {delta:+.3f}")
        print("If merged/moe does NOT beat base+best-expert, the merge is theatre — kill it honestly.")
    json.dump(results, open("benchmark_results.json","w"), indent=1)

if __name__ == "__main__":
    main()
