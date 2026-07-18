#!/usr/bin/env python3
"""multi_merge_eval.py — does N-into-1 climb or saturate?

Per the EAT-775 plan (Phase 2): measure if N-into-1 keeps improving.
N=1 (charter), N=2 (charter+sov3), N=3 (charter+sov3+owned_v2).
"""
import json
import time
import torch
from pathlib import Path

REPO = Path("/Users/nicholas/clawd")
BASE = "Qwen/Qwen2.5-0.5B-Instruct"
MAX_NEW = 50

# Same 5 test prompts (illustrative, quick)
HELD = [
    ("What is the EU AI Act transparency obligation?", "Article 50 requires AI systems that interact with natural persons to inform them that they are interacting with AI."),
    ("What is GDPR biometric data protection?", "GDPR Article 9 classifies biometric data as special category, requiring explicit consent."),
    ("What is BFT-33?", "Byzantine fault tolerance with 23/33 quorum requirement."),
    ("What is the care floor?", "Every sovereign action must pass a care floor of 0.95 minimum."),
    ("What is the SIGIL chain?", "Every sovereign action mints an Ed25519 SIGIL receipt for audit trail."),
]


def overlap(pred, gold):
    ps = set(pred.lower().split())
    gs = set(gold.lower().split())
    return len(ps & gs) / max(len(gs), 1)


def gen(model, tok, q, device):
    msgs = [{"role": "user", "content": q}]
    text = tok.apply_chat_template(msgs, add_generation_prompt=True, tokenize=False)
    ids = tok(text, return_tensors="pt", truncation=True, max_length=512).to(device)
    with torch.no_grad():
        out = model.generate(**ids, max_new_tokens=MAX_NEW, do_sample=False, pad_token_id=tok.eos_token_id, repetition_penalty=1.05)
    return tok.decode(out[0][ids["input_ids"].shape[1]:], skip_special_tokens=True).strip()


def main():
    device = "mps" if torch.backends.mps.is_available() else "cpu"

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

    # Methods: N=1, N=2 (multiple pairs), N=3, N=3 weighted
    methods = {
        "N=1_charter": str(REPO / "_alignment/sovereign_merge_kit/models/qwen3-sov-compliance-charter/adapter_model.safetensors"),
        "N=2_charter_sov3": str(REPO / "_alignment/sovereign_merge_kit/models_merged/sov4_ties_charter_sov3.safetensors"),
        "N=2_charter_owned": str(REPO / "_alignment/sovereign_merge_kit/models_multi/ties_2_charter_owned.safetensors"),
        "N=2_sov3_owned": str(REPO / "_alignment/sovereign_merge_kit/models_multi/ties_2_sov3_owned.safetensors"),
        "N=3_charter_sov3_owned": str(REPO / "_alignment/sovereign_merge_kit/models_multi/ties_3_charter_sov3_owned.safetensors"),
        "N=3_charter_x2_sov3_owned": str(REPO / "_alignment/sovereign_merge_kit/models_multi/ties_3_charter_x2_sov3_owned.safetensors"),
    }

    results = []

    # Baseline first
    print("\n[Baseline] no adapter")
    t0 = time.time()
    with model.disable_adapter():
        overlaps = [overlap(gen(model, tok, q, device), gold) for q, gold in HELD]
    results.append({"method": "baseline_no_adapter", "n_merged": 0, "mean_overlap": round(sum(overlaps)/len(overlaps), 4)})
    print(f"  mean = {sum(overlaps)/len(overlaps):.4f}")

    for name, sd_path in methods.items():
        n_merged = int(name.split("=")[1].split("_")[0])
        print(f"\n[Method] {name} (N={n_merged})")
        t0 = time.time()
        sd = load_file(sd_path)
        set_peft_model_state_dict(model, sd)
        overlaps = [overlap(gen(model, tok, q, device), gold) for q, gold in HELD]
        results.append({"method": name, "n_merged": n_merged, "mean_overlap": round(sum(overlaps)/len(overlaps), 4)})
        print(f"  mean = {sum(overlaps)/len(overlaps):.4f}  ({time.time()-t0:.0f}s)")

    # Analysis: does N-into-1 climb?
    print(f"\n{'='*60}")
    print("N-INTO-1 SWEEP — climb or saturate?")
    print(f"{'='*60}")
    for r in results:
        n = r["n_merged"]
        mark = " <- baseline" if n == 0 else ""
        print(f"  N={n}  {r['method']:35s}  mean={r['mean_overlap']:.4f}{mark}")

    # Climb vs saturate verdict
    by_n = {}
    for r in results:
        if r["n_merged"] not in by_n or r["mean_overlap"] > by_n[r["n_merged"]]["mean_overlap"]:
            by_n[r["n_merged"]] = r
    print(f"\n  Best at each N:")
    for n in sorted(by_n):
        print(f"    N={n}: {by_n[n]['method']:30s} mean={by_n[n]['mean_overlap']:.4f}")

    # Verdict
    if len(by_n) >= 2:
        n1 = by_n[1]["mean_overlap"] if 1 in by_n else 0
        n2 = by_n[2]["mean_overlap"] if 2 in by_n else 0
        n3 = by_n[3]["mean_overlap"] if 3 in by_n else 0
        if n3 > n2 > n1:
            verdict = "CLIMBS — N-into-1 keeps improving"
        elif n3 < n1:
            verdict = "REGRESSES — N-into-1 hurts"
        else:
            verdict = "SATURATES — N=1 is enough"
        print(f"\n  VERDICT: {verdict}")

    out_path = REPO / "_alignment/sovereign_merge_kit/benchmarks/multi_merge_n_into_1_results.json"
    summary = {
        "version": "v1_multi_merge_n_into_1_2026-07-18",
        "n_heldout": len(HELD),
        "metric": "token-overlap (5 prompts, illustrative)",
        "results": results,
        "by_n": {n: by_n[n] for n in sorted(by_n)},
        "honest_register": "N=5 illustrative. Sibling runs full battery (33-prompt) on Qwen3-4B Modal T4.",
        "next_step": "Scale to TierBench-lite 40-prompt for more robust verdict.",
    }
    with open(out_path, "w") as f:
        json.dump(summary, f, indent=2)
    print(f"\nOK Saved: {out_path.relative_to(REPO)}")


if __name__ == "__main__":
    main()
