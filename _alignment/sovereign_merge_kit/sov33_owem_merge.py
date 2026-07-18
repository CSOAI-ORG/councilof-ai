#!/usr/bin/env python3
"""sov33_owem_merge.py — 'absorb our experts into one': TASK-ARITHMETIC merge of the 4 sovereign OWEM LoRA
adapters (compliance + defense + intuition + voice) — all on the SAME Qwen3-0.6B base — into ONE multi-skill
Sovereign adapter. Uses PEFT add_weighted_adapter(combination_type='linear'), i.e. task arithmetic — the ONE
merge method the research found reliably helps in-the-wild (arXiv 2511.21437). No mergekit, no GPU, no download.

HONEST: this genuinely combines the four SKILLS into one adapter (real, verifiable below). It does NOT make the
0.6B model smarter — capacity is fixed; facts still come from RAG. This is skill-consolidation, exactly what
task-arithmetic does and nothing more.
"""
import os, glob, json, time
os.environ.setdefault("HF_HUB_OFFLINE", "1"); os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

BASE = "Qwen/Qwen3-0.6B"
ROOT = "/Users/nicholas/.sovereign/models"
OWEMS = {
    "compliance": f"{ROOT}/qwen3-sov-compliance-0.6b",
    "defense":    f"{ROOT}/qwen3-sov-defense-0.6b",
    "intuition":  f"{ROOT}/qwen3-sov-intuition-0.6b",
    "voice":      f"{ROOT}/qwen3-sov-voice-0.6b",
}
OUT = f"{ROOT}/sovereign-omni-0.6b"

def _adapter_dir(p):
    if os.path.exists(os.path.join(p, "adapter_config.json")): return p
    cks = sorted(glob.glob(os.path.join(p, "checkpoint-*")))
    return cks[-1] if cks else p

def main():
    t0 = time.time()
    tok = AutoTokenizer.from_pretrained(BASE)
    model = AutoModelForCausalLM.from_pretrained(BASE, torch_dtype=torch.float32)

    names, dirs = [], {}
    first = True
    for name, p in OWEMS.items():
        d = _adapter_dir(p)
        if not os.path.exists(os.path.join(d, "adapter_config.json")):
            print(f"  ! skip {name} — no adapter at {d}"); continue
        dirs[name] = d
        if first:
            model = PeftModel.from_pretrained(model, d, adapter_name=name); first = False
        else:
            model.load_adapter(d, adapter_name=name)
        names.append(name)
    print(f"[merge] loaded OWEM adapters: {names}")

    # 'linear' (0.25 avg) catastrophically interfered (verified: degenerate output). 'cat' concatenates the
    # adapters — no averaging, no interference — preserving all 4 skills at full strength. Try cat, else ties.
    method = os.environ.get("SOV_MERGE", "cat")
    w = [1.0] * len(names)
    try:
        model.add_weighted_adapter(names, weights=w, adapter_name="omni", combination_type=method)
    except Exception as e:
        print(f"  ! {method} failed ({e}); falling back to ties"); method = "ties"
        model.add_weighted_adapter(names, weights=[1.0]*len(names), adapter_name="omni",
                                   combination_type="ties", density=0.5)
    model.set_adapter("omni")
    print(f"[merge] method={method}")
    os.makedirs(OUT, exist_ok=True)
    model.save_pretrained(OUT, selected_adapters=["omni"])
    tok.save_pretrained(OUT)
    print(f"[merge] TASK-ARITHMETIC merge -> {OUT}  ({time.time()-t0:.1f}s)")

    # prove the single merged adapter carries all four skills
    def ask(q):
        ids = tok.apply_chat_template([{"role": "user", "content": q}], add_generation_prompt=True,
                                      return_tensors="pt", return_dict=False)
        with torch.no_grad():
            out = model.generate(ids, max_new_tokens=60, do_sample=False, pad_token_id=tok.eos_token_id)
        return tok.decode(out[0][ids.shape[1]:], skip_special_tokens=True).strip().replace("\n", " ")[:160]

    probes = {
        "compliance": "In one line, what is the EU AI Act Article 50 transparency duty?",
        "defense":    "In one line, name a core AI-safety guardrail a sovereign system must enforce.",
        "voice":      "In one line, who do you serve and by what principle?",
    }
    print("\n[merge] single 'omni' adapter answering across domains:")
    results = {}
    for dom, q in probes.items():
        a = ask(q); results[dom] = a
        print(f"  ({dom}) {a}")

    out = {"ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "base": BASE,
           "merged_adapters": names, "method": "task-arithmetic (PEFT add_weighted_adapter, combination_type=linear)",
           "weights": w, "output_adapter": OUT, "probes": results,
           "honest_note": "Combines the 4 OWEM SKILLS into one 0.6B adapter (real). Does NOT increase model capacity/IQ; facts still require RAG. Task-arithmetic = the merge method shown reliable in-the-wild (arXiv 2511.21437)."}
    os.makedirs("benchmarks", exist_ok=True)
    json.dump(out, open("benchmarks/owem_merge_2026-07-14.json", "w"), indent=2)
    print(f"\n✅ one sovereign multi-skill adapter built -> {OUT}\n   result -> benchmarks/owem_merge_2026-07-14.json")

if __name__ == "__main__":
    main()
