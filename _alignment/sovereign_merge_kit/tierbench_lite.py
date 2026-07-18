#!/usr/bin/env python3
"""tierbench_lite.py — Fast TierBench for the 3 OWEMs.

Full TierBench (sov33_quality_per_tier.py) takes 10+ min per adapter.
Lite version: skip per_q detail, use int8 adapters for speed.

Metrics (same as full TierBench):
  - Mean token-overlap (FAST vs OWNED vs charTER vs sov3_student)
  - Tau sweep (frac skippable at each threshold)
  - Per-source breakdown

Output: /tierbench_lite_results.json (3 OWEMs in 1 file)
"""
import os
import json
import time
import torch
import sys
from pathlib import Path

REPO = Path("/Users/nicholas/clawd")

ADAPTERS = [
    ("sov3_student_adapter", REPO / "_alignment/sovereign_merge_kit/models/sov3_student_adapter"),
    ("qwen3-sov-compliance-charter", REPO / "_alignment/sovereign_merge_kit/models/qwen3-sov-compliance-charter"),
    ("_owned_v2_adapter", REPO / "_alignment/sovereign_merge_kit/_owned_v2_adapter/sector_adapter"),
]

BASE = "Qwen/Qwen2.5-0.5B-Instruct"
CHARTER = REPO / "_alignment/sovereign_merge_kit/distill_charter_qa.jsonl"
GROWN = REPO / "_alignment/sovereign_merge_kit/distill_corpus_grown.jsonl"
TAUS = [0.20, 0.25, 0.30, 0.35, 0.40]

# Use int8 adapters for speed
INT8_DIR = REPO / "_alignment/sovereign_merge_kit/models_int4"


def overlap(pred, gold):
    ps = set(pred.lower().split())
    gs = set(gold.lower().split())
    return len(ps & gs) / max(len(gs), 1)


def load_heldout():
    """Build 40-question held-out (20 charter + 20 grown-gov)."""
    held = []
    if CHARTER.exists():
        with open(CHARTER) as f:
            for line in f:
                if line.strip():
                    r = json.loads(line)
                    if r.get("instruction") and r.get("response"):
                        held.append(("CHARTER", "governance", r["instruction"], r["response"]))
                        if sum(1 for h in held if h[0] == "CHARTER") >= 20:
                            break

    if GROWN.exists():
        with open(GROWN) as f:
            for line in f:
                if line.strip():
                    r = json.loads(line)
                    if r.get("domain") in ("governance", "reasoning") and r.get("instruction") and r.get("response"):
                        held.append(("GROWN", r.get("domain", "?"), r["instruction"], r["response"]))
                        if sum(1 for h in held if h[0] == "GROWN") >= 20:
                            break

    return held[:40]


def gen(model, tok, q, device, max_new=60):
    msgs = [{"role": "user", "content": q}]
    text = tok.apply_chat_template(msgs, add_generation_prompt=True, tokenize=False)
    ids = tok(text, return_tensors="pt", truncation=True, max_length=512).to(device)
    with torch.no_grad():
        out = model.generate(
            **ids, max_new_tokens=max_new, do_sample=False,
            pad_token_id=tok.eos_token_id, repetition_penalty=1.05,
        )
    return tok.decode(out[0][ids["input_ids"].shape[1]:], skip_special_tokens=True).strip()


def main():
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    print(f"=" * 60)
    print(f"TIERBENCH LITE — 3 OWEMs, 40 held-out")
    print(f"=" * 60)
    print(f"Device: {device}")

    held = load_heldout()
    print(f"Held-out: {len(held)}")
    by_source = {}
    for h in held:
        by_source[h[0]] = by_source.get(h[0], 0) + 1
    print(f"By source: {by_source}")

    from transformers import AutoModelForCausalLM, AutoTokenizer
    from peft import PeftModel

    print(f"\nLoading {BASE}...")
    tok = AutoTokenizer.from_pretrained(BASE)
    if tok.pad_token is None:
        tok.pad_token = tok.eos_token
    base = AutoModelForCausalLM.from_pretrained(BASE, torch_dtype=torch.float32).to(device)
    base.eval()
    print(f"  ✓ base loaded")

    # K1 FAST baseline
    print(f"\n[K1 FAST] base model...")
    t0 = time.time()
    fast_answers = []
    for i, (src, dom, q, gold) in enumerate(held):
        ans = gen(base, tok, q, device)
        fast_answers.append(ans)
        if (i+1) % 10 == 0:
            print(f"  {i+1}/{len(held)} in {time.time()-t0:.0f}s")
    print(f"  ✓ K1 FAST done in {time.time()-t0:.0f}s")

    # K2 OWNED per adapter
    all_results = {
        "version": "v1_tierbench_lite_2026-07-18",
        "n_heldout": len(held),
        "metric": "token-overlap",
        "by_source": by_source,
        "fast": {"answers": fast_answers},
        "owems": {},
    }

    for adapter_name, adapter_dir in ADAPTERS:
        print(f"\n[K2 OWNED] {adapter_name}...")
        t0 = time.time()

        if not adapter_dir.exists():
            print(f"  SKIP: not found")
            continue

        try:
            model = PeftModel.from_pretrained(base, str(adapter_dir))
            model.eval()
        except Exception as e:
            print(f"  ERROR: {e}")
            continue

        owned_answers = []
        overlaps_fast = []
        overlaps_owned = []
        per_q = []
        for i, (src, dom, q, gold) in enumerate(held):
            ans = gen(model, tok, q, device)
            owned_answers.append(ans)
            ov_fast = overlap(fast_answers[i], gold)
            ov_owned = overlap(ans, gold)
            overlaps_fast.append(ov_fast)
            overlaps_owned.append(ov_owned)
            per_q.append({
                "src": src, "domain": dom,
                "q": q[:60],
                "fast_ov": round(ov_fast, 3),
                "owned_ov": round(ov_owned, 3),
                "owned_wins": ov_owned > ov_fast,
            })

        fast_mean = sum(overlaps_fast) / len(overlaps_fast)
        owned_mean = sum(overlaps_owned) / len(overlaps_owned)
        owned_wins_frac = sum(1 for p in per_q if p["owned_wins"]) / len(per_q)

        # Tau sweep
        tau_sweep = {}
        for tau in TAUS:
            fast_suffices = sum(1 for o in overlaps_fast if o >= tau) / len(overlaps_fast)
            owned_suffices = sum(1 for o in overlaps_owned if o >= tau) / len(overlaps_owned)
            tau_sweep[f"{tau:.2f}"] = {
                "fast_suffices": round(fast_suffices, 4),
                "owned_suffices_SKIP_slow": round(owned_suffices, 4),
                "delta": round(owned_suffices - fast_suffices, 4),
            }

        # Per source
        by_source_stats = {}
        for src in by_source:
            src_pqs = [p for p in per_q if p["src"] == src]
            if not src_pqs: continue
            fast_mean_s = sum(p["fast_ov"] for p in src_pqs) / len(src_pqs)
            owned_mean_s = sum(p["owned_ov"] for p in src_pqs) / len(src_pqs)
            by_source_stats[src] = {
                "n": len(src_pqs),
                "fast_mean": round(fast_mean_s, 4),
                "owned_mean": round(owned_mean_s, 4),
                "delta": round(owned_mean_s - fast_mean_s, 4),
            }

        elapsed = time.time() - t0

        all_results["owems"][adapter_name] = {
            "fast_mean": round(fast_mean, 4),
            "owned_mean": round(owned_mean, 4),
            "delta": round(owned_mean - fast_mean, 4),
            "owned_wins_frac": round(owned_wins_frac, 4),
            "tau_sweep": tau_sweep,
            "by_source": by_source_stats,
            "elapsed_sec": round(elapsed, 1),
        }

        print(f"  ✓ {adapter_name}: fast={fast_mean:.4f}, owned={owned_mean:.4f}, Δ={owned_mean-fast_mean:+.4f}, owned_wins={owned_wins_frac*100:.1f}% ({elapsed:.0f}s)")

        # Free adapter memory
        del model
        torch.mps.empty_cache() if device == "mps" else None

    # Final summary
    print(f"\n{'='*60}")
    print(f"TIERBENCH LITE — SUMMARY")
    print(f"{'='*60}")
    print(f"  Base (K1 FAST): overlap={0:.4f} (n={len(held)})")
    for name, r in all_results["owems"].items():
        print(f"  {name:35s} owned={r['owned_mean']:.4f} (Δ={r['delta']:+.4f}, wins={r['owned_wins_frac']*100:.1f}%)")

    out_path = REPO / "_alignment/sovereign_merge_kit/benchmarks/tierbench_lite_results.json"
    with open(out_path, "w") as f:
        json.dump(all_results, f, indent=2)
    print(f"\n✓ Saved: {out_path.relative_to(REPO)}")


if __name__ == "__main__":
    main()