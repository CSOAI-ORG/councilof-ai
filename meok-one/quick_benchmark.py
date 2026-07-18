import json, urllib.request, time, sys
from datetime import datetime
from pathlib import Path

OLLAMA = "http://localhost:11434"

# Smaller question set: 20 hard-hitting sovereign questions
QUESTIONS = [
    ("q01", "What is Article 99 of the EU AI Act? Cite the EUR limit OR percent.", ["35", "7%"]),
    ("q02", "List 2 categories of Annex III high-risk AI.", ["biometric", "critical", "education", "employment", "law enforcement"]),
    ("q03", "What does BFT stand for? Define acronym.", ["byzantine fault tolerance"]),
    ("q04", "BFT 33-council fault tolerance f=?", ["10"]),
    ("q05", "BFT quorum (out of 33)?", ["23"]),
    ("q06", "Number of stages in OWEM PDCA cycle?", ["9"]),
    ("q07", "Name 3 stages of OWEM (any 3).", ["plan", "do", "check", "act", "verify", "detect", "compose", "cite", "formalize"]),
    ("q08", "EU AI Act adopted in what year?", ["2024"]),
    ("q09", "Article 50 of EU AI Act covers what?", ["transparency"]),
    ("q10", "Code of Practice on AI published when?", ["june 2025", "2025"]),
    ("q11", "What GPU energy value is FLOPs threshold for systemic-risk GPAI?", ["10^25"]),
    ("q12", "What does the Venturi effect cause in physics?", ["accelerat"]),
    ("q13", "How many polyhedra does the architecture use?", ["11"]),
    ("q14", "How many NN brains rotate in the ensemble?", ["7"]),
    ("q15", "Sovereign_weight value?", ["0.70"]),
    ("q16", "L6 verifier does how many deterministic checks?", ["6"]),
    ("q17", "Annex III category 1 in EU AI Act?", ["biometric"]),
    ("q18", "Sovereign agents in substrate state?", ["152"]),
    ("q19", "BFT councils in substrate?", ["56"]),
    ("q20", "Bitcoin anchors count?", ["11"]),
]


def call(model, prompt, max_tokens=80, timeout=30):
    body = json.dumps({"model": model, "prompt": prompt, "temperature": 0.1,
                       "num_predict": max_tokens, "stream": False}).encode()
    req = urllib.request.Request(f"{OLLAMA}/api/generate", body, {"Content-Type": "application/json"})
    try:
        t0 = time.time()
        r = json.loads(urllib.request.urlopen(req, timeout=timeout).read())
        return r.get("response", ""), round(time.time()-t0, 2), None
    except Exception as e:
        return "", 0, str(type(e).__name__)


def score(resp, kws):
    r = resp.lower()
    return any(k.lower() in r for k in kws)


def benchmark(model_name):
    print(f"\n=== {model_name} ===")
    n_pass = 0
    n_fail = 0
    failed = []
    total_elapsed = 0
    for qid, q, kws in QUESTIONS:
        prompt = f"[Answer with substrate facts. Be brief.] {q}"
        resp, elapsed, err = call(model_name, prompt, max_tokens=80, timeout=25)
        total_elapsed += elapsed
        ok = score(resp, kws) and not err
        if ok: n_pass += 1
        else:
            n_fail += 1
            failed.append((qid, q[:60], resp[:80]))
    rate = n_pass / len(QUESTIONS) * 100
    bar = "█" * int(rate)
    print(f"  {n_pass}/{len(QUESTIONS)} = {rate:.0f}%  {bar}  (total {total_elapsed:.1f}s)")
    if failed:
        print(f"  Failed:")
        for qid, q, resp in failed[:3]:
            print(f"    {qid}: {q}")
            print(f"      → {resp.replace(chr(10), ' ')[:100]}...")
    return n_pass, n_fail, rate


results = {}
for model in ["sovereign-small", "sovereign-large"]:
    n_pass, n_fail, rate = benchmark(model)
    results[model] = {"passed": n_pass, "failed": n_fail, "rate": rate}

print("\n=== COMPARISON ===")
for m, r in results.items():
    print(f"  {m:<22} {r['passed']:>3}/{len(QUESTIONS)}  {r['rate']:>5.1f}%")

Path("/tmp/sovereign-portal/quick-bench.json").write_text(json.dumps({
    "ts": datetime.now().isoformat(),
    "results": results,
    "n_questions": len(QUESTIONS),
}, indent=2))
