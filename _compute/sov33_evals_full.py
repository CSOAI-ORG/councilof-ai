#!/usr/bin/env python3
"""
SOV33 FULL EVALS — real HF datasets, correctness-graded, CONCURRENT + checkpointed.
Pools two hosts of the SAME model (Groq + OCI, both llama-3.3-70b) via round-robin so
throughput ~2x the single-host rate limit — one model, no confound. Resumes from checkpoint.

  - GSM8K : FULL test set (1319) — canonical reasoning benchmark
  - MMLU  : stratified sample of N_MMLU (full 14042 is many hours even pooled)

Env: N_MMLU (default 1000), WORKERS (default 12).
"""
import re, sys, os, json, time, threading
from concurrent.futures import ThreadPoolExecutor, as_completed
sys.path.insert(0, os.path.expanduser("~/clawd/_compute"))
import sov33_compute as SC
from datasets import load_dataset

CKPT = os.path.expanduser("~/clawd/_compute/sov33_evals_full_ckpt.json")
N_MMLU = int(os.environ.get("N_MMLU", "1000"))
WORKERS = int(os.environ.get("WORKERS", "12"))
_lock = threading.Lock()
_rr = {"n": 0}

def _load_ckpt():
    if os.path.exists(CKPT):
        try: return json.load(open(CKPT))
        except Exception: pass
    return {"gsm8k": {"done": {}}, "mmlu": {"done": {}}}

def _save(ck):
    with _lock:
        json.dump(ck, open(CKPT, "w"))

def _ask(prompt, max_tokens=400, tries=5):
    # round-robin Groq/OCI (same llama-3.3-70b) to spread the per-host rate limit
    for i in range(tries):
        with _lock:
            _rr["n"] += 1; host = _rr["n"] % 2
        try:
            if host == 0:
                return SC._groq(prompt, max_tokens=max_tokens)
            else:
                return SC._oci70b(prompt, max_tokens=max_tokens)
        except Exception:
            time.sleep(1.5 * (i + 1))
    return ""

def _final_int(text):
    t = text.replace(",", "")
    m = re.search(r"####\s*(-?\d+)", t)
    if m: return int(m.group(1))
    tail = re.split(r"(?i)answer\s*(?:is|:)?", t)[-1]
    nums = re.findall(r"-?\d+", tail)
    if nums: return int(nums[-1])
    nums = re.findall(r"-?\d+", t)
    return int(nums[-1]) if nums else None

def _mc_letter(text):
    m = re.search(r"\b([ABCD])\b", text.strip()[:80].upper())
    return m.group(1) if m else None

def _run_pool(items, work_fn, done, label, total):
    """items: list of (key, payload). work_fn(payload)->int(correct). Skips done keys."""
    pending = [(k, p) for k, p in items if k not in done]
    n_start = len(done)
    with ThreadPoolExecutor(max_workers=WORKERS) as ex:
        futs = {ex.submit(work_fn, p): k for k, p in pending}
        for j, fut in enumerate(as_completed(futs)):
            k = futs[fut]
            try: done[k] = int(fut.result())
            except Exception: done[k] = 0
            if (j + 1) % 25 == 0:
                acc = sum(done.values()) / len(done)
                print(f"  {label} {len(done)}/{total}  acc={acc:.3f}", flush=True)
                _save({"gsm8k": GK, "mmlu": MK})
    _save({"gsm8k": GK, "mmlu": MK})
    return sum(done.values()), len(done)

# globals for the periodic save
GK = {"done": {}}; MK = {"done": {}}

if __name__ == "__main__":
    ck = _load_ckpt()
    GK = ck["gsm8k"]; MK = ck["mmlu"]

    print("=== GSM8K (full test 1319, pooled Groq+OCI) ===", flush=True)
    ds = load_dataset("gsm8k", "main", split="test")
    def gwork(ex):
        gold = int(ex["answer"].split("####")[-1].replace(",", "").strip())
        a = _ask(f"Solve step by step, then end with '#### <final integer>'.\n{ex['question']}")
        return _final_int(a) == gold
    g_items = [(str(i), ds[i]) for i in range(len(ds))]
    g_c, g_n = _run_pool(g_items, gwork, GK["done"], "gsm8k", len(ds))
    print(f"GSM8K: {g_c}/{g_n} = {g_c/g_n:.4f}", flush=True)

    print(f"=== MMLU (stratified {N_MMLU}, pooled) ===", flush=True)
    md = load_dataset("cais/mmlu", "all", split="test")
    idxs = list(range(0, len(md), max(1, len(md)//N_MMLU)))[:N_MMLU]
    letters = "ABCD"
    def mwork(ex):
        gold = letters[ex["answer"]]
        opts = "\n".join(f"{letters[j]}) {c}" for j, c in enumerate(ex["choices"]))
        a = _ask(f"Answer with ONLY the letter.\n{ex['question']}\n{opts}", max_tokens=8)
        return _mc_letter(a) == gold
    m_items = [(str(i), md[i]) for i in idxs]
    m_c, m_n = _run_pool(m_items, mwork, MK["done"], "mmlu", len(idxs))
    print(f"MMLU: {m_c}/{m_n} = {m_c/m_n:.4f}", flush=True)

    res = {"gsm8k": {"n": g_n, "correct": g_c, "acc": round(g_c/g_n, 4), "set": "FULL test 1319"},
           "mmlu": {"n": m_n, "correct": m_c, "acc": round(m_c/m_n, 4), "set": f"stratified {N_MMLU}"},
           "backend": "llama-3.3-70b pooled across Groq + OCI GenAI"}
    json.dump(res, open(os.path.expanduser("~/clawd/_compute/sov33_evals_full_results.json"), "w"), indent=2)
    print(json.dumps(res, indent=2), flush=True)
