#!/usr/bin/env python3
"""sov33_quality_per_tier.py — Quality-per-tier benchmark: where does our small governed
brain already match the tier above, so we can SKIP the slow model?

TIERS
  K1 FAST  : base Qwen2.5-0.5B-Instruct (no adapter)              -- the cheap default
  K2 OWNED : base + LoRA distilled_owned_v2 (our distilled brain) -- the governed upgrade
  K3 SLOW  : big cloud model (Kimi/K2)                            -- GATED (unfunded)

METRIC (identical to train_sector.py, the trainers' own metric):
    overlap(pred, gold) = |set(pred.words) & set(gold.words)| / max(|set(gold.words)|, 1)

HELD-OUT SET (governance+reasoning, as the task named -- "sector corpora / charter QA
held-out splits"), two leakage-free sources combined:
  A) GROWN-GR : the seed-0 15% held-out split of distill_corpus_grown.jsonl reconstructed
     EXACTLY as train_sector.py does it (random.seed(0), shuffle, first 15%), then FILTERED
     to domain in {governance, reasoning}. This is the same split the v2 adapter was scored
     on (n_heldout=49), so none of it was in the adapter's training set; restricting to
     gov+reasoning gives the domains the task asked for (n=19).
  B) CHARTER  : distill_charter_qa.jsonl -- a charter-grounded QA battery that has ZERO
     instruction overlap with the grown corpus (verified), so it is independent held-out
     governance content the v2 adapter never trained on (n=63).
The headline metric is computed over A+B combined; per-set numbers are also reported.

SLOW-TIER PROXY: the gold answer IS a big-teacher (Opus/Sonnet) reference. So "how close
does a tier get to the slow model" == its token-overlap with gold. A tier "suffices" for a
question when overlap_with_gold >= tau. frac_skippable = fraction of held-out questions the
OWNED brain answers well enough (>= tau) that escalating to the slow model is unnecessary.

HONESTY: token-overlap is a COARSE lexical proxy at toy 0.5B scale; gold-as-slow-tier is a
proxy, not a live K3 comparison (K3 is gated). Reported with a tau sweep, not one cherry number.
Run: python sov33_quality_per_tier.py
"""
import os, io, json, tarfile, random, time, sys

BASE       = os.environ.get("BASE_MODEL", "Qwen/Qwen2.5-0.5B-Instruct")
CORPUS     = os.environ.get("SECTOR_CORPUS", "distill_corpus_grown.jsonl")
CHARTER    = os.environ.get("CHARTER_QA", "distill_charter_qa.jsonl")
OWNED_DIR  = os.environ.get("OWNED_ADAPTER_DIR", "")   # extracted LoRA dir (contains adapter_config.json)
MAX_NEW    = int(os.environ.get("MAX_NEW_TOKENS", "100"))
GR_DOMAINS = {"governance", "reasoning"}   # the task's named domains
TAUS       = [0.20, 0.25, 0.30, 0.35, 0.40]
TAU_HEAD   = 0.30   # headline sufficiency bar

def overlap(pred, gold):
    ps, gs = set(pred.lower().split()), set(gold.lower().split())
    return len(ps & gs) / max(len(gs), 1)

def to_pair(r):
    if "instruction" in r and "response" in r:
        return r["instruction"], r["response"]
    if "messages" in r:
        msgs = r["messages"]
        u = next((m["content"] for m in msgs if m["role"] == "user"), "")
        a = next((m["content"] for m in msgs if m["role"] == "assistant"), "")
        if not a: a = next((m["content"] for m in msgs if m["role"] == "system"), "")
        return u, a
    return None, None

def build_heldout(corpus_path, charter_path):
    """Return (test, meta). test = list of (q, gold, source, domain).
    Source A GROWN-GR: seed-0 15% held-out of the grown corpus, filtered to gov+reasoning.
    Source B CHARTER : charter QA battery (independent; zero-overlap with grown training)."""
    rows = [json.loads(l) for l in open(corpus_path) if l.strip()]
    triples = []
    for r in rows:
        q, a = to_pair(r)
        if q and a: triples.append((q, a, r.get("domain", "?")))
    random.seed(0); random.shuffle(triples)         # IDENTICAL shuffle to train_sector.py
    n_test = max(5, int(len(triples) * 0.15))
    heldout_all = triples[:n_test]
    train_instr = set(q for q, a, d in triples[n_test:])
    grown_gr = [(q, a, "GROWN-GR", d) for q, a, d in heldout_all if d in GR_DOMAINS]

    charter = []
    n_leak = 0
    if os.path.exists(charter_path):
        for r in (json.loads(l) for l in open(charter_path) if l.strip()):
            q, a = r.get("instruction"), r.get("response")
            if not (q and a):
                continue
            if q in train_instr:            # leakage guard: drop anything seen in training
                n_leak += 1; continue
            charter.append((q, a, "CHARTER", "governance"))

    test = grown_gr + charter
    meta = {"n_corpus_rows": len(rows), "n_pairs": len(triples),
            "n_seed0_heldout": n_test, "n_grown_gr": len(grown_gr),
            "n_charter": len(charter), "n_charter_dropped_leak": n_leak}
    return test, meta

def main():
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer
    from peft import PeftModel

    test, meta = build_heldout(CORPUS, CHARTER)
    print(f"[heldout] {meta}  -> total held-out {len(test)}", flush=True)

    tok = AutoTokenizer.from_pretrained(BASE); tok.pad_token = tok.pad_token or tok.eos_token
    def gen(model, q, mx=MAX_NEW):
        ids = tok(f"<|im_start|>user\n{q}<|im_end|>\n<|im_start|>assistant\n", return_tensors="pt").to(model.device)
        with torch.no_grad():
            out = model.generate(**ids, max_new_tokens=mx, do_sample=False, pad_token_id=tok.pad_token_id)
        return tok.decode(out[0][ids.input_ids.shape[1]:], skip_special_tokens=True)

    # ---- K1 FAST: base only ----
    t0 = time.time()
    base = AutoModelForCausalLM.from_pretrained(BASE, torch_dtype=torch.float32)
    base.eval()
    fast_ans = [gen(base, q) for q, _, _, _ in test]
    print(f"[K1 FAST] {len(test)} answers in {time.time()-t0:.0f}s", flush=True)

    # ---- K2 OWNED: base + LoRA ----
    t0 = time.time()
    owned_model = PeftModel.from_pretrained(base, OWNED_DIR)
    owned_model.eval()
    owned_ans = [gen(owned_model, q) for q, _, _, _ in test]
    print(f"[K2 OWNED] {len(test)} answers in {time.time()-t0:.0f}s", flush=True)

    # ---- K3 SLOW: GATED ----
    k3_enabled = bool(os.environ.get("KIMI_API_KEY"))
    k3_note = ("K3 slot: enabled" if k3_enabled
               else "K3 slot: gated, set KIMI_API_KEY to include")
    print(f"[K3 SLOW] {k3_note}", flush=True)

    # ---- score ----
    per_q = []
    for i, (q, gold, src, dom) in enumerate(test):
        fo = overlap(fast_ans[i], gold)
        oo = overlap(owned_ans[i], gold)
        per_q.append({
            "idx": i, "source": src, "domain": dom,
            "question": q[:200], "gold_preview": gold[:160],
            "fast_overlap": round(fo, 4), "owned_overlap": round(oo, 4),
            "owned_minus_fast": round(oo - fo, 4),
            "owned_wins_or_ties": oo >= fo,
            "fast_ans_preview": fast_ans[i][:160], "owned_ans_preview": owned_ans[i][:160],
        })

    n = len(per_q)
    fast_mean  = sum(p["fast_overlap"]  for p in per_q) / n
    owned_mean = sum(p["owned_overlap"] for p in per_q) / n
    owned_ge_fast = sum(1 for p in per_q if p["owned_wins_or_ties"]) / n

    tau_sweep = {}
    for tau in TAUS:
        fast_suff  = sum(1 for p in per_q if p["fast_overlap"]  >= tau) / n
        owned_suff = sum(1 for p in per_q if p["owned_overlap"] >= tau) / n
        must_escalate = sum(1 for p in per_q if p["owned_overlap"] < tau) / n
        tau_sweep[f"{tau:.2f}"] = {
            "fast_suffices": round(fast_suff, 4),
            "owned_suffices_SKIP_slow": round(owned_suff, 4),
            "must_escalate_to_slow": round(must_escalate, 4),
        }

    frac_skippable = tau_sweep[f"{TAU_HEAD:.2f}"]["owned_suffices_SKIP_slow"]

    # per-source breakdown (GROWN-GR vs CHARTER)
    by_source = {}
    for src in sorted(set(p["source"] for p in per_q)):
        grp = [p for p in per_q if p["source"] == src]
        m = len(grp)
        by_source[src] = {
            "n": m,
            "fast_mean_overlap": round(sum(p["fast_overlap"] for p in grp) / m, 4),
            "owned_mean_overlap": round(sum(p["owned_overlap"] for p in grp) / m, 4),
            "owned_ge_fast_frac": round(sum(1 for p in grp if p["owned_wins_or_ties"]) / m, 4),
            "frac_skippable_tau_head": round(sum(1 for p in grp if p["owned_overlap"] >= TAU_HEAD) / m, 4),
        }

    result = {
        "harness": "sov33_quality_per_tier.py",
        "base_model": BASE,
        "owned_adapter_dir": OWNED_DIR,
        "metric": "token_overlap = |pred_words & gold_words| / |gold_words|  (== train_sector.py)",
        "corpus": CORPUS, "charter_qa": CHARTER, "heldout_meta": meta,
        "gr_domains": sorted(GR_DOMAINS), "n_heldout": n,
        "by_source": by_source,
        "max_new_tokens": MAX_NEW,
        "fast_mean_overlap": round(fast_mean, 4),
        "owned_mean_overlap": round(owned_mean, 4),
        "owned_ge_fast_frac": round(owned_ge_fast, 4),
        "tau_headline": TAU_HEAD,
        "frac_skippable": frac_skippable,
        "tau_sweep": tau_sweep,
        "k3_slot": k3_note,
        "per_question": per_q,
        "honesty": ("token-overlap is a coarse lexical proxy at toy 0.5B scale; gold=big-teacher "
                    "reference used as slow-tier proxy (K3 not run, gated); tau sweep reported, "
                    "not a single cherry-picked number."),
    }
    out_path = os.environ.get("RESULT_JSON", "sov33_quality_per_tier_results.json")
    json.dump(result, open(out_path, "w"), indent=2)
    print(f"[RESULT] frac_skippable(tau={TAU_HEAD})={frac_skippable}  "
          f"fast_mean={fast_mean:.4f} owned_mean={owned_mean:.4f} owned>=fast={owned_ge_fast:.4f}", flush=True)
    print(f"[RESULT] -> {out_path}", flush=True)

if __name__ == "__main__":
    main()
