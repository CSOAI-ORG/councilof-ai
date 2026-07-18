#!/usr/bin/env python3
"""merge_sweep_quick.py — ULTRA-FAST merge comparison: 3 methods x 5 prompts.

Quick proof of method comparison, not the full benchmark.
Sibling runs Qwen3-4B Modal T4 with 33-prompt battery.
"""
import os
import json
import time
import torch
from pathlib import Path

REPO = Path("/Users/nicholas/clawd")
BASE = "Qwen/Qwen2.5-0.5B-Instruct"
MAX_NEW = 50


def overlap(pred, gold):
    ps = set(pred.lower().split())
    gs = set(gold.lower().split())
    return len(ps & gs) / max(len(gs), 1)


def gen(model, tok, q, device):
    msgs = [{"role": "user", "content": q}]
    text = tok.apply_chat_template(msgs, add_generation_prompt=True, tokenize=False)
    ids = tok(text, return_tensors="pt", truncation=True, max_length=512).to(device)
    with torch.no_grad():
        out = model.generate(
            **ids, max_new_tokens=MAX_NEW, do_sample=False,
            pad_token_id=tok.eos_token_id, repetition_penalty=1.05,
        )
    return tok.decode(out[0][ids["input_ids"].shape[1]:], skip_special_tokens=True).strip()


def main():
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    held = [
        ("What is the EU AI Act transparency obligation?", "Article 50 requires AI systems that interact with natural persons to inform them that they are interacting with AI."),
        ("What is GDPR biometric data protection?", "GDPR Article 9 classifies biometric data as special category, requiring explicit consent."),
        ("What is BFT-33?", "Byzantine fault tolerance with 23/33 quorum requirement."),
        ("What is the care floor?", "Every sovereign action must pass a care floor of 0.95 minimum."),
        ("What is the SIGIL chain?", "Every sovereign action mints an Ed25519 SIGIL receipt for audit trail."),
    ]

    from transformers import AutoModelForCausalLM, AutoTokenizer
    from safetensors.torch import load_file
    from peft import LoraConfig, get_peft_model, set_peft_model_state_dict

    tok = AutoTokenizer.from_pretrained(BASE)
    if tok.pad_token is None:
        tok.pad_token = tok.eos_token
    base = AutoModelForCausalLM.from_pretrained(BASE, torch_dtype=torch.float32).to(device)

    lora_config = LoraConfig(
        r=16, lora_alpha=32, lora_dropout=0.05,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
        task_type="CAUSAL_LM"
    )
    model = get_peft_model(base, lora_config)
    model.eval()

    methods = {
        "charter_only": str(REPO / "_alignment/sovereign_merge_kit/models/qwen3-sov-compliance-charter/adapter_model.safetensors"),
        "linear_ties_charter_sov3": str(REPO / "_alignment/sovereign_merge_kit/models_merged/sov4_ties_charter_sov3.safetensors"),
        "dare_ties_d03_p50": str(REPO / "_alignment/sovereign_merge_kit/models_dare_ties/dare_ties_d03_p50.safetensors"),
    }

    results = []

    # Baseline (no adapter)
    print("[Baseline] no adapter")
    t0 = time.time()
    with model.disable_adapter():
        overlaps = []
        for q, gold in held:
            ans = gen(model, tok, q, device)
            overlaps.append(overlap(ans, gold))
    results.append({"method": "baseline_no_adapter", "mean_overlap": round(sum(overlaps)/len(overlaps), 4)})
    print(f"  mean = {sum(overlaps)/len(overlaps):.4f}  ({time.time()-t0:.0f}s)")

    for name, sd_path in methods.items():
        print(f"\n[Method] {name}")
        t0 = time.time()
        sd = load_file(sd_path)
        set_peft_model_state_dict(model, sd)
        overlaps = []
        for q, gold in held:
            ans = gen(model, tok, q, device)
            overlaps.append(overlap(ans, gold))
        results.append({"method": name, "mean_overlap": round(sum(overlaps)/len(overlaps), 4)})
        print(f"  mean = {sum(overlaps)/len(overlaps):.4f}  ({time.time()-t0:.0f}s)")

    results.sort(key=lambda x: -x["mean_overlap"])
    print("\n" + "="*60)
    print("QUICK MERGE SWEEP (n=5 prompts)")
    print("="*60)
    for r in results:
        mark = " <- BEST" if r == results[0] else ""
        print(f"  {r['method']:30s}  mean={r['mean_overlap']:.4f}{mark}")

    out_path = REPO / "_alignment/sovereign_merge_kit/benchmarks/merge_sweep_quick_results.json"
    summary = {
        "version": "v1_merge_sweep_quick_2026-07-18",
        "n_heldout": len(held),
        "metric": "token-overlap (5 prompts, illustrative not bench)",
        "leaderboard": results,
        "honest_register": "5 prompts is illustrative. Sibling runs 33-prompt battery on Qwen3-4B Modal T4.",
        "next_step": "Sibling runs real sweep. We have the 7 merged adapters ready.",
    }
    with open(out_path, "w") as f:
        json.dump(summary, f, indent=2)
    print(f"\nOK Saved: {out_path.relative_to(REPO)}")


if __name__ == "__main__":
    main()