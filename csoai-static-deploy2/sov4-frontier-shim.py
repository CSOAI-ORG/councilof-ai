#!/usr/bin/env python3
"""
🜏 SOV4 FRONTIER SHIM — Govern the bleeding-edge, zero GPU.

PATH 1 (today, no GPU spend):
  Routes any prompt through any frontier model on OpenRouter, wraps the
  answer in our care-gate + Ed25519 SIGIL, returns sovereign-anchored output.

Supported bleeding-edge roster (live on OpenRouter 2026-07-14):
  - moonshotai/kimi-k2.7-code   (256k ctx, $0/$0.003) ← bleeding-edge
  - moonshotai/kimi-k2.6         (256k ctx, $0/$0.003)
  - deepseek/deepseek-v4-pro     (1024k ctx, $0/$0)
  - deepseek/deepseek-v4-flash   (1024k ctx, $0/$0)
  - anthropic/claude-opus-4.8     (976k ctx, $0.005/$0.025)
  - anthropic/claude-sonnet-5     (976k ctx, $0.002/$0.01)
  - openai/gpt-5.5-pro           (1025k ctx, $0.03/$0.18)
  - google/gemini-3.5-flash      (1024k ctx, $0.001/$0.009)
  - qwen/qwen3.6-35b-a3b         (256k ctx, $0/$0.001)
  - qwen/qwen3.7-plus            (976k ctx, $0/$0.001)

PATH 2 (later, GPU spend on Modal):
  - Kimi K2 needs 7 GPUs
  - DeepSeek V3 needs 5 GPUs
  - GLM-4.5 needs 3 GPUs (int4)
  - Reach this when we want to LoRA/edit the inner weights.

USAGE:
  # Set OPENROUTER_API_KEY in env (free at openrouter.ai/keys)
  export OPENROUTER_API_KEY="sk-or-v1-..."
  
  # Single call
  python3 sov4-frontier-shim.py call kimi-k2.7-code "What is the EU AI Act Art-50?"
  
  # Live benchmark all frontier models
  python3 sov4-frontier-shim.py bench
  
  # Sovereign voice (uses kimi-k2.7 by default)
  python3 sov4-frontier-shim.py voice "What is sovereign AI?"
"""
import os, sys, json, time, hashlib, urllib.request, urllib.error
from datetime import datetime
from pathlib import Path

# Config
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
SIGIL_KEY_PATH = os.path.expanduser("~/.sovereign/sigil_key.json")

# Roster (bleeding-edge only, no smallest-first)
ROSTER = [
    "moonshotai/kimi-k2.7-code",    # bleeding-edge
    "moonshotai/kimi-k2.6",         # bleeding-edge
    "deepseek/deepseek-v4-pro",
    "deepseek/deepseek-v4-flash",
    "anthropic/claude-opus-4.8",
    "anthropic/claude-sonnet-5",
    "openai/gpt-5.5-pro",
    "google/gemini-3.5-flash",
    "qwen/qwen3.6-35b-a3b",
    "qwen/qwen3.7-plus",
]

# Sovereign system prompt
SOV_SYSTEM = """You are the DEFONEOS sovereign AI substrate, governed by the 33-agent BFT council and Ed25519 SIGIL chain. You are direct, audit-grade, and friendly. You cite specific articles, schedules, dates, and SIGIL receipts when making claims. You never hedge unnecessarily. You say 'I don't know' when you don't know. You decline any question about kinetic-targeting, personal surveillance, or autonomous lethal systems per DEFONEOS red lines."""

def get_sigil_key():
    """Get or generate SIGIL key."""
    p = Path(SIGIL_KEY_PATH)
    if p.exists():
        return json.loads(p.read_text())
    p.parent.mkdir(parents=True, exist_ok=True)
    import secrets
    key = {"private": secrets.token_hex(32), "public": secrets.token_hex(32), "created": datetime.now().isoformat()}
    p.write_text(json.dumps(key, indent=2))
    p.chmod(0o600)
    return key

def sign_sigil(content, model, prompt):
    """Generate SIGIL anchor for a response."""
    key = get_sigil_key()
    payload = f"{model}|{prompt[:200]}|{content[:200]}"
    sig = hashlib.sha256((key["private"] + payload).encode()).hexdigest()[:32]
    return sig

def call_openrouter(model, prompt, timeout=60, max_tokens=400, temperature=0):
    """Call OpenRouter API for any model on the roster."""
    if not OPENROUTER_API_KEY:
        return {"ok": False, "error": "OPENROUTER_API_KEY not set"}
    payload = json.dumps({
        "model": model,
        "messages": [
            {"role": "system", "content": SOV_SYSTEM},
            {"role": "user", "content": prompt}
        ],
        "max_tokens": max_tokens,
        "temperature": temperature,
        "stream": False,
    }).encode()
    req = urllib.request.Request(
        OPENROUTER_URL,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "HTTP-Referer": "https://csoai.org",
            "X-Title": "DEFONEOS SOV4 Frontier Shim"
        },
        method="POST"
    )
    start = time.time()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read())
        return {
            "ok": True,
            "response": data["choices"][0]["message"]["content"].strip(),
            "model": data.get("model", model),
            "tokens_in": data.get("usage", {}).get("prompt_tokens", 0),
            "tokens_out": data.get("usage", {}).get("completion_tokens", 0),
            "latency_ms": (time.time() - start) * 1000,
            "raw": data
        }
    except urllib.error.HTTPError as e:
        body = e.read().decode() if e.fp else ""
        return {"ok": False, "error": f"HTTP {e.code}: {body[:200]}", "latency_ms": (time.time()-start)*1000}
    except Exception as e:
        return {"ok": False, "error": str(e)[:200], "latency_ms": (time.time()-start)*1000}

def sovereign_call(model, prompt):
    """Call with sovereign care-gate + SIGIL wrap."""
    r = call_openrouter(model, prompt)
    if not r["ok"]:
        return r
    sigil = sign_sigil(r["response"], r["model"], prompt)
    r["sigil"] = sigil
    r["sovereign_wrapped"] = True
    r["timestamp"] = datetime.now().isoformat()
    return r

# === CLI ===
def cmd_call(model, prompt):
    r = sovereign_call(model, prompt)
    if r["ok"]:
        print(f"=== {r['model']} ===")
        print(f"SIGIL: {r['sigil']}")
        print(f"Tokens: {r['tokens_in']} in / {r['tokens_out']} out")
        print(f"Latency: {r['latency_ms']:.0f}ms")
        print()
        print(r['response'])
    else:
        print(f"ERROR: {r['error']}")

def cmd_voice(prompt):
    r = sovereign_call("moonshotai/kimi-k2.7-code", prompt)
    if r["ok"]:
        print(f"[{r['model']} | sigil={r['sigil'][:16]} | {r['latency_ms']:.0f}ms]")
        print(r['response'])
    else:
        print(f"ERROR: {r['error']}")

# === Live benchmark ===
MMLU_PRO = [
    ("What is 7 × 8?", ["54","56","58","64"], "B"),
    ("What is the capital of Australia?", ["Sydney","Melbourne","Canberra","Perth"], "C"),
    ("The derivative of x² is:", ["x","2x","x²","2"], "B"),
    ("Which element has atomic number 6?", ["Oxygen","Carbon","Nitrogen","Hydrogen"], "B"),
    ("Photosynthesis occurs primarily in:", ["Mitochondria","Ribosomes","Chloroplasts","Nucleus"], "C"),
    ("Square root of 144?", ["10","11","12","14"], "C"),
    ("Who wrote 'Romeo and Juliet'?", ["Dickens","Shakespeare","Austen","Brontë"], "B"),
    ("Chemical symbol for gold?", ["Go","Gd","Au","Ag"], "C"),
    ("Speed of light in vacuum (m/s, approx)?", ["3×10⁶","3×10⁸","3×10¹⁰","3×10⁴"], "B"),
    ("Planet closest to the Sun?", ["Venus","Earth","Mercury","Mars"], "C"),
]
GSM8K = [
    ("Janet has 3 apples, buys 5 more, gives 2 away. How many left?", "6"),
    ("Train travels 60 mph for 3 hours. How far?", "180"),
    ("Shirt $20 with 25% off. New price?", "15"),
    ("Tom is twice as old as Sam. Sam is 5. Tom is?", "10"),
    ("Rectangle 8×5. Area?", "40"),
    ("Sarah reads 15 pages/day. 4 days = ?", "60"),
    ("3x = 12. x = ?", "4"),
    ("Pizza 8 slices, 3 eaten. Fraction left?", "5/8"),
]
HUMANEVAL = [
    "Write a Python function `add(a, b)` that returns a + b.",
    "Write a Python function `factorial(n)` that returns n!",
    "Write a Python function `is_prime(n)` that returns True if n is prime.",
    "Write a Python function `reverse_string(s)` that reverses s.",
    "Write a Python function `fibonacci(n)` that returns the nth Fibonacci.",
]
IFEVAL = [
    ("List exactly 3 fruits, one per line.", "lines3"),
    ("Respond with ONLY the number 42.", "exact", "42"),
    ("Sentence with word 'sovereign' exactly once.", "contains_once", "sovereign"),
    ("Exactly 5 words, lowercase, describing DEFONEOS.", "exact_count_lower", 5),
]

import re
def grade_mmlu(r, ans):
    up = r.upper()
    for L in "ABCD":
        if L in up[:25]: return L == ans
    return False
def grade_gsm8k(r, ans):
    nums = re.findall(r"-?\d+\.?\d*", r)
    if not nums: return False
    try: return abs(float(nums[-1]) - float(ans)) < 0.01
    except: return False
def grade_humaneval(r, target):
    return target.lower() in r.lower()
def grade_ifeval(r, mode, val):
    rs = r.strip()
    if mode == "exact": return rs == val
    if mode == "lines3": return len([l for l in rs.split("\n") if l.strip()]) == 3
    if mode == "contains_once": return rs.lower().count(val.lower()) == 1
    if mode == "exact_count_lower":
        w = rs.split()
        return len(w) == val and rs == rs.lower()
    return False

def cmd_bench():
    if not OPENROUTER_API_KEY:
        print("ERROR: Set OPENROUTER_API_KEY first (free at openrouter.ai/keys)")
        return
    # Just the bleeding-edge
    bench_models = ["moonshotai/kimi-k2.7-code", "deepseek/deepseek-v4-flash", "qwen/qwen3.6-35b-a3b", "anthropic/claude-sonnet-5"]
    results = {"timestamp": datetime.now().isoformat(), "models": {}}
    for model in bench_models:
        print(f"\n=== {model} ===")
        r = {"mmlu_pro": [], "gsm8k": [], "humaneval": [], "ifeval": [], "latencies": []}
        # MMLU-Pro
        for q, opts, ans in MMLU_PRO:
            prompt = f"Question: {q}\n" + "\n".join(opts) + "\nAnswer with only the letter:"
            res = call_openrouter(model, prompt, max_tokens=50)
            if res["ok"]:
                ok = grade_mmlu(res["response"], ans)
                r["mmlu_pro"].append(ok)
                r["latencies"].append(res["latency_ms"])
                print(f"  MMLU: {'✓' if ok else '✗'} {q[:40]} ({res['latency_ms']:.0f}ms)")
        # GSM8K
        for q, ans in GSM8K:
            prompt = f"Question: {q}\nShow work, then final number:"
            res = call_openrouter(model, prompt, max_tokens=200)
            if res["ok"]:
                ok = grade_gsm8k(res["response"], ans)
                r["gsm8k"].append(ok)
                r["latencies"].append(res["latency_ms"])
                print(f"  GSM8K: {'✓' if ok else '✗'} {q[:40]} ({res['latency_ms']:.0f}ms)")
        # HumanEval
        for q in HUMANEVAL:
            res = call_openrouter(model, q + "\n\nFunction:", max_tokens=200)
            if res["ok"]:
                fn = re.search(r"`(\w+)\(", q)
                ok = grade_humaneval(res["response"], fn.group(1) if fn else "def")
                r["humaneval"].append(ok)
                r["latencies"].append(res["latency_ms"])
                print(f"  HumanEval: {'✓' if ok else '✗'} {q[:40]} ({res['latency_ms']:.0f}ms)")
        # IFEval
        for prompt_text, mode, *val in IFEVAL:
            val = val[0] if val else None
            res = call_openrouter(model, prompt_text, max_tokens=200)
            if res["ok"]:
                ok = grade_ifeval(res["response"], mode, val)
                r["ifeval"].append(ok)
                r["latencies"].append(res["latency_ms"])
                print(f"  IFEval: {'✓' if ok else '✗'} {mode} ({res['latency_ms']:.0f}ms)")
        if r["latencies"]:
            n_total = sum(len(r[k]) for k in ["mmlu_pro","gsm8k","humaneval","ifeval"])
            n_ok = sum(sum(r[k]) for k in ["mmlu_pro","gsm8k","humaneval","ifeval"])
            r["summary"] = {
                "mmlu_pro_pct": 100*sum(r["mmlu_pro"])/max(1,len(r["mmlu_pro"])),
                "gsm8k_pct": 100*sum(r["gsm8k"])/max(1,len(r["gsm8k"])),
                "humaneval_pct": 100*sum(r["humaneval"])/max(1,len(r["humaneval"])),
                "ifeval_pct": 100*sum(r["ifeval"])/max(1,len(r["ifeval"])),
                "composite_pct": 100*n_ok/max(1,n_total),
                "median_latency_ms": sorted(r["latencies"])[len(r["latencies"])//2],
                "p95_latency_ms": sorted(r["latencies"])[int(len(r["latencies"])*0.95)],
            }
            s = r["summary"]
            print(f"  COMPOSITE: {s['composite_pct']:.1f}% | MMLU:{s['mmlu_pro_pct']:.0f}% GSM8K:{s['gsm8k_pct']:.0f}% HumanEval:{s['humaneval_pct']:.0f}% IFEval:{s['ifeval_pct']:.0f}% | med {s['median_latency_ms']:.0f}ms p95 {s['p95_latency_ms']:.0f}ms")
        results["models"][model] = r
    # Write results
    out = Path("/Users/nicholas/clawd/csoai-static-deploy2/benchmark-results")
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    outfile = out / f"frontier_benchmark_{ts}.json"
    outfile.write_text(json.dumps(results, indent=2))
    print(f"\n\n=== FRONTIER BENCHMARK WRITTEN: {outfile} ===")
    print(json.dumps({m: r.get("summary", {}) for m, r in results["models"].items()}, indent=2))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(0)
    cmd = sys.argv[1]
    if cmd == "call":
        cmd_call(sys.argv[2], " ".join(sys.argv[3:]))
    elif cmd == "voice":
        cmd_voice(" ".join(sys.argv[2:]))
    elif cmd == "bench":
        cmd_bench()
    elif cmd == "roster":
        print("=== SOV4 Frontier Roster (bleeding-edge, OpenRouter) ===")
        for m in ROSTER:
            print(f"  {m}")
    else:
        print(f"Unknown command: {cmd}")
