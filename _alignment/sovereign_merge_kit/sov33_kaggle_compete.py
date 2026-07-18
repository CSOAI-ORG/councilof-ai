#!/usr/bin/env python3
"""sov33_kaggle_compete.py — the Kaggle competition harness for SOV33 (runs on Kaggle's free 30hr/wk T4).

WHAT IT IS: a governed reasoning-cascade harness that runs SOV33's small->large escalation on a benchmark,
grades against gold labels, and writes sov33_live_gsm8k.json in the schema sov33_ingest_kaggle_result.py reads
(so the graded number auto-wires into sov333_canonical.json on the Mac). This is the POC + awareness play:
a PUBLIC, gold-graded score, not our own scorecard.

HONEST SCOPE: this measures the CASCADE (speculative draft->verify + BFT early-exit), scored by someone else's
gold labels. It is capability measurement, NOT training. To also TRAIN, capture the graded traces -> distillation
dataset (sov33_distill_harness) on the same T4. Both in one Kaggle session, within the free 30hr/wk budget.

WHICH COMPETITIONS FIT (match SOV33 = governed reasoning cascade; do NOT enter all):
  FIT: math/reasoning (GSM8K-style), LLM science-exam, LLM classification finetuning, ARC paper-track (write-up).
  NOT-FIT: training-method contests (predictive-coding/forward-forward), pure-vision, agent-commerce infra.
  IP LINE: Pokémon-hosted contest is their sanctioned event (ok to study), but keep our own character IP out.
"""
import os, json, re, time
from datetime import datetime, timezone

# ---- config: swap MODEL for whatever the free GPU has pulled (Kaggle can pull open weights) ----
DRAFT_MODEL  = os.environ.get("SOV33_DRAFT_MODEL",  "qwen2.5:3b")     # small/reflex tier
VERIFY_MODEL = os.environ.get("SOV33_VERIFY_MODEL", "qwen2.5:7b")     # heavy/verify tier (escalate only)
N_ITEMS      = int(os.environ.get("SOV33_N_ITEMS", "200"))            # start small; scale to full set
OUT          = os.environ.get("SOV33_RESULT", "sov33_live_gsm8k.json")

def extract_answer(text):
    """GSM8K gold answers are after '####'; model answers = last number in the response."""
    nums = re.findall(r"-?\d[\d,]*\.?\d*", (text or "").replace(",", ""))
    return nums[-1] if nums else None

def run_cascade(question, call_model):
    """Speculative cascade: draft answers; if draft is confident+numeric, ship (early-exit);
    else escalate to verify model. This is the honest 10/90 — most items exit at draft."""
    draft = call_model(DRAFT_MODEL, question)
    da = extract_answer(draft)
    # BFT early-exit heuristic: a clean numeric draft ships; ambiguous escalates
    if da is not None and len(da) <= 6:
        return da, "draft", draft
    verify = call_model(VERIFY_MODEL, question + "\nThink step by step, end with the number.")
    return extract_answer(verify), "verify", verify

def grade(dataset, call_model):
    correct = escalated = 0
    for i, ex in enumerate(dataset[:N_ITEMS]):
        pred, tier, _ = run_cascade(ex["question"], call_model)
        gold = extract_answer(ex["answer"])
        if pred == gold: correct += 1
        if tier == "verify": escalated += 1
        if i % 25 == 0: print(f"  {i}/{min(N_ITEMS,len(dataset))} acc={correct/(i+1):.3f} esc={escalated/(i+1):.2f}")
    n = min(N_ITEMS, len(dataset))
    result = {
        "gsm8k": round(correct / n, 4), "n_items": n, "correct": correct,
        "config": f"cascade {DRAFT_MODEL}->{VERIFY_MODEL} (Kaggle T4)",
        "escalation_rate": round(escalated / n, 3),
        "benchmark": "GSM8K", "graded_by": "gold labels (public test set)",
        "run_ts": datetime.now(timezone.utc).isoformat(),
    }
    json.dump(result, open(OUT, "w"), indent=2)
    print(f"\nWROTE {OUT}: GSM8K={result['gsm8k']} on n={n}, escalation={result['escalation_rate']}")
    return result

# ---- Kaggle cell would define call_model via ollama/transformers on the T4, load GSM8K, then: ----
# from datasets import load_dataset
# ds = [{"question":x["question"],"answer":x["answer"]} for x in load_dataset("gsm8k","main")["test"]]
# grade(ds, call_model)
if __name__ == "__main__":
    # offline smoke-test with a stub model (proves the harness + schema; real run uses a GPU model)
    def stub(model, q): return "The answer is 42"
    demo = [{"question":"2+2?","answer":"#### 4"},{"question":"x","answer":"#### 42"}]
    print("SMOKE-TEST (stub model, proves harness+schema writes correctly):")
    grade(demo, stub)
