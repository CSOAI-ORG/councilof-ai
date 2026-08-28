#!/usr/bin/env python3
"""eat_run_local.py — run EAT GovBench weak-dimension eval FULLY OFFLINE against local
Ollama sovereign models. No external key. Reuses WEAK_DIMENSIONS from eat_govbench.py so
the question set is identical; only the inference backend changes (NVIDIA API -> local Ollama).

Baseline (no context) vs with-context (RAG) per dimension, keyword-graded, results written to
benchmark-results/eat_govbench/eat_local_<model>.json. $0, sovereign, reproducible on the Mac.
"""
import json, sys, time, os, urllib.request
from datetime import datetime, timezone
from pathlib import Path
from eat_govbench import WEAK_DIMENSIONS   # reuse the exact benchmark question set

# --- improved grader ------------------------------------------------------------------
# The original grade_response required exact multi-word phrase substrings ("2.4b over 5 years")
# which almost never match free-form answers -> baseline pinned ~0% (a grader artifact, not a
# capability signal). This grades on fraction of SIGNIFICANT keywords present, giving a real gradient.
_STOP = {"is","the","a","an","of","to","in","for","and","or","over","years","year","with","on","by"}
def grade_response(expected_keywords, response):
    if not response: return 0
    words = set()
    for phrase in expected_keywords:
        for w in phrase.lower().replace(",", " ").split():
            if len(w) > 2 and w not in _STOP:
                words.add(w)
    if not words: return 0
    hits = sum(1 for w in words if w in response)
    return hits / len(words)

OLLAMA = os.environ.get("OLLAMA_CHAT", "http://localhost:11434/api/chat")
# ABSOLUTE, so a run from any cwd (micro2 / 3090 / A100) writes to the same place and never
# hangs on a relative path. AXIS-BOOTSTRAP §5 "FIX IT" (2026-08-24).
_HERE = Path(__file__).resolve().parent
RESULTS_DIR = Path(os.environ.get("EAT_RESULTS_DIR", _HERE / "benchmark-results" / "eat_govbench"))
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

def call_ollama(model, prompt, context=""):
    body = json.dumps({
        "model": model, "stream": False,
        "options": {"temperature": 0, "num_predict": 64, "num_ctx": 2048},
        "think": False,   # reasoning models (nemotron/deepseek) answer in thinking otherwise
        "messages": [
            {"role": "system", "content": f"You are SOV33, a sovereign AI expert. {context}"},
            {"role": "user", "content": f"Answer briefly: {prompt}"},
        ],
    }).encode()
    req = urllib.request.Request(OLLAMA, data=body, headers={"Content-Type": "application/json"})
    try:
        # Hard per-call timeout (AXIS-BOOTSTRAP §5 FIX IT) — a hung backend must never
        # block the whole EAT run. Default 90s, configurable via EAT_TIMEOUT.
        _t = float(os.environ.get("EAT_TIMEOUT", "90"))
        with urllib.request.urlopen(req, timeout=_t) as r:
            msg = json.loads(r.read())["message"]
            content = (msg.get("content") or msg.get("thinking") or "").strip().lower()
            import re as _re
            content = _re.sub(r"<think>.*?</think>", "", content, flags=_re.DOTALL)
            content = _re.sub(r"<[^>]+>", "", content)
            return content.strip()
    except Exception as e:
        return ""

def run(model):
    print("=" * 64); print(f"  EAT GOVBENCH (offline) — model: {model}"); print("=" * 64)
    all_results = {}
    for dim, data in WEAK_DIMENSIONS.items():
        base = ctx = 0
        for q, expected in data["questions"]:
            kws = expected.split(", ")
            base += grade_response(kws, call_ollama(model, q))
            ctx  += grade_response(kws, call_ollama(model, q, data["context"]))
        n = len(data["questions"])
        bp, cp = base / n * 100, ctx / n * 100
        all_results[dim] = {"baseline": round(bp, 1), "context": round(cp, 1),
                            "improvement": round(cp - bp, 1), "questions": n}
        print(f"  {dim:16s} baseline {bp:5.1f}%  context {cp:5.1f}%  {cp-bp:+5.1f}%")
    out = {
        "timestamp": datetime.now(timezone.utc).isoformat(), "model": model, "backend": "ollama-local",
        "dimensions": all_results,
        "avg_baseline": round(sum(r["baseline"] for r in all_results.values()) / len(all_results), 1),
        "avg_context":  round(sum(r["context"]  for r in all_results.values()) / len(all_results), 1),
    }
    fp = RESULTS_DIR / f"eat_local_{model.replace(':','_').replace('/','_')}.json"
    fp.write_text(json.dumps(out, indent=2))
    print("-" * 64)
    print(f"  AVERAGE          baseline {out['avg_baseline']:5.1f}%  context {out['avg_context']:5.1f}%")
    print(f"  -> {fp}")
    return out

if __name__ == "__main__":
    models = sys.argv[1:] or ["sov33-v7:latest"]
    summary = [run(m) for m in models]
    if len(summary) > 1:
        print("\n=== LEADERBOARD (context %) ===")
        for s in sorted(summary, key=lambda x: -x["avg_context"]):
            print(f"  {s['model']:24s} {s['avg_context']:5.1f}%")
