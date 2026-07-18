#!/usr/bin/env python3
"""merge_sweep_fast.py — Fast version: load base ONCE, swap LoRA weights per method.

Previous version re-loaded base + LoRA per method (~10 min total on M2).
This version: load base once, swap merged weights into the LoRA.
"""
import os
import json
import time
import torch
from pathlib import Path

REPO = Path("/Users/nicholas/clawd")
CHARTER = REPO / "_alignment/sovereign_merge_kit/models/qwen3-sov-compliance-charter"
SOV3 = REPO / "_alignment/sovereign_merge_kit/models/sov3_student_adapter"
OWNED = REPO / "_alignment/sovereign_merge_kit/_owned_v2_adapter/sector_adapter"
LINEAR_MERGED = REPO / "_alignment/sovereign_merge_kit/models_merged/sov4_ties_charter_sov3.safetensors"

CHARTER_QA = REPO / "_alignment/sovereign_merge_kit/distill_charter_qa.jsonl"
GROWN = REPO / "_alignment/sovereign_merge_kit/distill_corpus_grown.jsonl"
BASE = "Qwen/Qwen2.5-0.5B-Instruct"
MAX_NEW = 60


def overlap(pred, gold):
    ps = set(pred.lower().split())
    gs = set(gold.lower().split())
    return len(ps & gs) / max(len(gs), 1)


def load_heldout(n=20):
    held = []
    with open(CHARTER_QA) as f:
        for line in f:
            if line.strip():
                r = json.loads(line)
                if r.get("instruction") and r.get("response"):
                    held.append(("CHARTER", r["instruction"], r["response"]))
                    if sum(1 for h in held if h[0] == "CHARTER") >= 10:
                        break
    with open(GROWN) as f:
        for line in f:
            if line.strip():
                r = json.loads(line)
                if r.get("domain") in ("governance", "reasoning") and r.get("instruction") and r.get("response"):
                    held.append(("GROWN", r["instruction"], r["response"]))
                    if sum(1 for h in held if h[0] == "GROWN") >= 10:
                        break
    return held[:n]


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


def evaluate_model(model, tok, held, device):
    overlaps = []
    for src, q, gold in held:
        ans = gen(model, tok, q, device)
        overlaps.append(overlap(ans, gold))
    return sum(overlaps) / len(overlaps)


def main():
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    print("=" * 60)
    print("MERGE SWEEP FAST (load base ONCE)")
    print("=" * 60)

    held = load_heldout(n=20)
    print(f"Held-out: {len(held)}")

    from transformers import AutoModelForCausalLM, AutoTokenizer
    from safetensors.torch import load_file
    from peft import LoraConfig, get_peft_model, set_peft_model_state_dict, PeftModel

    print(f"\nLoading {BASE}...")
    tok = AutoTokenizer.from_pretrained(BASE)
    if tok.pad_token is None:
        tok.pad_token = tok.eos_token
    base = AutoModelForCausalLM.from_pretrained(BASE, torch_dtype=torch.float32).to(device)

    # Pre-load all adapter state dicts
    print("Loading 10 adapter state dicts...")
    sds = {
        "charter_only": load_file(str(CHARTER / "adapter_model.safetensors")),
        "sov3_only": load_file(str(SOV3 / "adapter_model.safetensors")),
        "owned_v2_only": load_file(str(OWNED / "adapter_model.safetensors")),
        "linear_ties_charter_sov3": load_file(str(LINEAR_MERGED)),
        "dare_ties_d03_p00": load_file(str(REPO / "_alignment/sovereign_merge_kit/models_dare_ties/dare_ties_d03_p00.safetensors")),
        "dare_ties_d03_p50": load_file(str(REPO / "_alignment/sovereign_merge_kit/models_dare_ties/dare_ties_d03_p50.safetensors")),
        "dare_ties_d03_p90": load_file(str(REPO / "_alignment/sovereign_merge_kit/models_dare_ties/dare_ties_d03_p90.safetensors")),
        "dare_ties_d05_p50": load_file(str(REPO / "_alignment/sovereign_merge_kit/models_dare_ties/dare_ties_d05_p50.safetensors")),
        "crumbs_t10_b10_ties": load_file(str(REPO / "_alignment/sovereign_merge_kit/models_breadcrumbs/crumbs_t10_b10_ties.safetensors")),
        "crumbs_t20_b10_ties": load_file(str(REPO / "_alignment/sovereign_merge_kit/models_breadcrumbs/crumbs_t20_b10_ties.safetensors")),
    }
    print(f"  OK loaded {len(sds)} state dicts")

    # Create a LoRA model ONCE
    lora_config = LoraConfig(
        r=16, lora_alpha=32, lora_dropout=0.05,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
        task_type="CAUSAL_LM"
    )
    model = get_peft_model(base, lora_config)
    model.eval()

    # Evaluate each by swapping weights
    results = []

    # Baseline first (no LoRA)
    print("\n[Method] baseline_no_adapter")
    t0 = time.time()
    # Disable adapter for baseline
    with model.disable_adapter():
        baseline_ov = evaluate_model(model, tok, held, device)
    elapsed = time.time() - t0
    results.append({"method": "baseline_no_adapter", "mean_overlap": round(baseline_ov, 4), "elapsed_sec": round(elapsed, 1)})
    print(f"  mean_overlap = {baseline_ov:.4f}  ({elapsed:.0f}s)")

    # Each merge method
    for name, sd in sds.items():
        print(f"\n[Method] {name}")
        t0 = time.time()
        # Swap weights
        set_peft_model_state_dict(model, sd)
        ov = evaluate_model(model, tok, held, device)
        elapsed = time.time() - t0
        results.append({"method": name, "mean_overlap": round(ov, 4), "elapsed_sec": round(elapsed, 1)})
        print(f"  mean_overlap = {ov:.4f}  ({elapsed:.0f}s)")

    # Leaderboard
    results.sort(key=lambda x: -x["mean_overlap"])
    print(f"\n{'='*60}")
    print("MERGE SWEEP LEADERBOARD (Qwen2.5-0.5B family, n=20)")
    print(f"{'='*60}")
    for r in results:
        mark = " <- BEST" if r == results[0] else ""
        print(f"  {r['method']:30s}  mean={r['mean_overlap']:.4f}  ({r['elapsed_sec']:.0f}s){mark}")

    # Save
    out_path = REPO / "_alignment/sovereign_merge_kit/benchmarks/merge_sweep_local_results.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    summary = {
        "version": "v1_merge_sweep_fast_2026-07-18",
        "n_heldout": len(held),
        "metric": "token-overlap (coarse at 0.5B scale)",
        "n_methods": len(results),
        "leaderboard": results,
        "best_method": results[0]["method"] if results else None,
        "best_score": results[0]["mean_overlap"] if results else None,
        "sibling_target": "0.758 (Qwen3-4B TIES-merge, Modal T4)",
        "honest_register": "Toy scale (Qwen2.5-0.5B). Coarse token-overlap. Sibling runs the real sweep on Qwen3-4B Modal T4.",
        "lane": "Hermes/Jeeves (local) | Claude Science = Modal T4 sweep",
    }
    with open(out_path, "w") as f:
        json.dump(summary, f, indent=2)
    print(f"\nOK Saved: {out_path.relative_to(REPO)}")


if __name__ == "__main__":
    main()