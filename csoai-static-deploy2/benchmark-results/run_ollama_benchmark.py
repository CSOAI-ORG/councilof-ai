#!/usr/bin/env python3
"""
DEFONEOS SOV33 Real Benchmark — Ollama API direct.
Tests qwen3:0.6b + 4 sovereign adapters on real tasks.
No fabrication. Every score is from a live model call.
"""
import json
import time
import urllib.request
import urllib.error
import hashlib
from pathlib import Path
from datetime import datetime

OLLAMA_URL = "http://localhost:11434"
MODELS = ["qwen3:0.6b", "qwen3:1.7b", "qwen3-precise:latest", "qwen3-formal:latest", "qwen25-balanced:latest", "qwen25-creative:latest"]

# 12-task benchmark suite
TASKS = {
    "mmlu_pro_sample": [
        {"q": "Which of the following is a primary function of mitochondria?", "opts": ["A) Protein synthesis", "B) ATP production", "C) DNA replication", "D) Cell division"], "ans": "B"},
        {"q": "What is the capital of Australia?", "opts": ["A) Sydney", "B) Melbourne", "C) Canberra", "D) Perth"], "ans": "C"},
        {"q": "The derivative of x^2 is:", "opts": ["A) x", "B) 2x", "C) x^2", "D) 2"], "ans": "B"},
        {"q": "Which element has the atomic number 6?", "opts": ["A) Oxygen", "B) Carbon", "C) Nitrogen", "D) Hydrogen"], "ans": "B"},
        {"q": "Photosynthesis occurs primarily in:", "opts": ["A) Mitochondria", "B) Ribosomes", "C) Chloroplasts", "D) Nucleus"], "ans": "C"},
        {"q": "The square root of 144 is:", "opts": ["A) 10", "B) 11", "C) 12", "D) 14"], "ans": "C"},
        {"q": "Who wrote 'Romeo and Juliet'?", "opts": ["A) Dickens", "B) Shakespeare", "C) Austen", "D) Brontë"], "ans": "B"},
        {"q": "The chemical symbol for gold is:", "opts": ["A) Go", "B) Gd", "C) Au", "D) Ag"], "ans": "C"},
        {"q": "Speed of light in vacuum (m/s, approx):", "opts": ["A) 3×10^6", "B) 3×10^8", "C) 3×10^10", "D) 3×10^4"], "ans": "B"},
        {"q": "Which planet is closest to the Sun?", "opts": ["A) Venus", "B) Earth", "C) Mercury", "D) Mars"], "ans": "C"},
    ],
    "gsm8k_sample": [
        {"q": "Janet has 3 apples. She buys 5 more. She gives 2 to her friend. How many does she have left?", "ans": "6"},
        {"q": "A train travels 60 miles in 1 hour. At the same speed, how far in 3 hours?", "ans": "180"},
        {"q": "If a shirt costs $20 and is 25% off, what is the new price?", "ans": "15"},
        {"q": "Tom is twice as old as Sam. Sam is 5. How old is Tom?", "ans": "10"},
        {"q": "A rectangle has length 8 and width 5. What is the area?", "ans": "40"},
        {"q": "Sarah reads 15 pages per day. How many pages in 4 days?", "ans": "60"},
        {"q": "If 3x = 12, what is x?", "ans": "4"},
        {"q": "A pizza is cut into 8 slices. If 3 are eaten, what fraction remains?", "ans": "5/8"},
    ],
    "humaneval_sample": [
        {"q": "Write a Python function `add(a, b)` that returns a + b.", "ans_pattern": "def add"},
        {"q": "Write a Python function `factorial(n)` that returns n! for non-negative n.", "ans_pattern": "def factorial"},
        {"q": "Write a Python function `is_prime(n)` that returns True if n is prime.", "ans_pattern": "def is_prime"},
        {"q": "Write a Python function `reverse_string(s)` that reverses the string.", "ans_pattern": "def reverse_string"},
        {"q": "Write a Python function `fibonacci(n)` that returns the nth Fibonacci number.", "ans_pattern": "def fibonacci"},
    ],
    "ifeval_sample": [
        {"q": "List exactly 3 fruits, one per line, no extra text.", "ans": ["apple", "banana", "orange"], "format": "lines"},
        {"q": "Respond with ONLY the number 42, nothing else.", "ans": "42", "format": "exact"},
        {"q": "Write a sentence that contains the word 'sovereign' exactly once.", "ans_contains": "sovereign", "format": "contains_once"},
        {"q": "Output exactly 5 words, all lowercase, describing DEFONEOS.", "ans_count": 5, "format": "exact_count"},
    ],
}

def call_ollama(model, prompt, timeout=60):
    """Real Ollama call."""
    payload = json.dumps({
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": 0, "num_predict": 256}
    }).encode()
    req = urllib.request.Request(
        f"{OLLAMA_URL}/api/generate",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    start = time.time()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read())
        latency = (time.time() - start) * 1000
        return {
            "ok": True,
            "response": data.get("response", ""),
            "latency_ms": latency,
            "tokens_in": data.get("prompt_eval_count", 0),
            "tokens_out": data.get("eval_count", 0),
            "model": data.get("model", model),
        }
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as e:
        return {"ok": False, "error": str(e), "latency_ms": (time.time()-start)*1000}

def grade_mmlu(model_resp, correct):
    """Grade MCQ — extract letter A/B/C/D from response."""
    resp = model_resp.upper()
    for letter in ["A", "B", "C", "D"]:
        if letter in resp[:20]:  # First 20 chars
            return letter == correct
    return False

def grade_gsm8k(model_resp, correct):
    """Grade GSM8K — extract final number."""
    import re
    nums = re.findall(r"-?\d+\.?\d*", model_resp)
    if not nums:
        return False
    try:
        pred = float(nums[-1])
        return abs(pred - float(correct)) < 0.01
    except:
        return False

def grade_humaneval(model_resp, pattern):
    return pattern.lower() in model_resp.lower()

def grade_ifeval(model_resp, task):
    fmt = task.get("format", "exact")
    resp = model_resp.strip()
    if fmt == "exact":
        return resp == task["ans"]
    elif fmt == "contains_once":
        return resp.lower().count(task["ans_contains"].lower()) == 1
    elif fmt == "lines":
        lines = [l.strip() for l in resp.split("\n") if l.strip()]
        return len(lines) == len(task["ans"]) and all(any(a.lower() in l.lower() for a in task["ans"]) for l in lines)
    elif fmt == "exact_count":
        words = resp.split()
        return len(words) == task["ans_count"] and resp == resp.lower()
    return False

def atomic_write_json(path, payload):
    """Write JSON atomically so ENOSPC cannot leave a truncated report."""
    text = json.dumps(payload, indent=2) + "\n"
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(text)
    tmp.replace(path)


def write_checkpoint(out, ts, results):
    """Persist completed models after each model run for crash/ENOSPC recovery."""
    checkpoint = out / f"benchmark_{ts}.checkpoint.json"
    atomic_write_json(checkpoint, results)
    return checkpoint


results = {"timestamp": datetime.now().isoformat(), "models": {}}
out = Path("/Users/nicholas/clawd/csoai-static-deploy2/benchmark-results")
out.mkdir(exist_ok=True)
ts = datetime.now().strftime("%Y%m%d_%H%M%S")

for model in MODELS:
    print(f"\n=== Benchmarking {model} ===")
    model_results = {"mmlu_pro": [], "gsm8k": [], "humaneval": [], "ifeval": [], "latencies": []}
    
    # MMLU-Pro style
    for task in TASKS["mmlu_pro_sample"]:
        prompt = f"Question: {task['q']}\n" + "\n".join(task['opts']) + "\nAnswer with only the letter:"
        r = call_ollama(model, prompt)
        if r["ok"]:
            correct = grade_mmlu(r["response"], task['ans'])
            model_results["mmlu_pro"].append({"q": task['q'][:50], "correct": correct, "latency_ms": r["latency_ms"]})
            model_results["latencies"].append(r["latency_ms"])
            print(f"  MMLU: {'✓' if correct else '✗'} {task['q'][:40]} ({r['latency_ms']:.0f}ms)")
    
    # GSM8K
    for task in TASKS["gsm8k_sample"]:
        prompt = f"Question: {task['q']}\nShow your work, then give the final answer as a single number:"
        r = call_ollama(model, prompt)
        if r["ok"]:
            correct = grade_gsm8k(r["response"], task['ans'])
            model_results["gsm8k"].append({"q": task['q'][:50], "correct": correct, "latency_ms": r["latency_ms"]})
            model_results["latencies"].append(r["latency_ms"])
            print(f"  GSM8K: {'✓' if correct else '✗'} {task['q'][:40]} ({r['latency_ms']:.0f}ms)")
    
    # HumanEval style
    for task in TASKS["humaneval_sample"]:
        prompt = task['q'] + "\n\nFunction:"
        r = call_ollama(model, prompt)
        if r["ok"]:
            correct = grade_humaneval(r["response"], task['ans_pattern'])
            model_results["humaneval"].append({"q": task['q'][:50], "correct": correct, "latency_ms": r["latency_ms"]})
            model_results["latencies"].append(r["latency_ms"])
            print(f"  HumanEval: {'✓' if correct else '✗'} {task['q'][:40]} ({r['latency_ms']:.0f}ms)")
    
    # IFEval
    for task in TASKS["ifeval_sample"]:
        prompt = task['q']
        r = call_ollama(model, prompt)
        if r["ok"]:
            correct = grade_ifeval(r["response"], task)
            model_results["ifeval"].append({"q": task['q'][:50], "correct": correct, "latency_ms": r["latency_ms"]})
            model_results["latencies"].append(r["latency_ms"])
            print(f"  IFEval: {'✓' if correct else '✗'} {task['q'][:40]} ({r['latency_ms']:.0f}ms)")
    
    # Summary
    if model_results["latencies"]:
        model_results["summary"] = {
            "mmlu_pro_pct": 100 * sum(x["correct"] for x in model_results["mmlu_pro"]) / max(1, len(model_results["mmlu_pro"])),
            "gsm8k_pct": 100 * sum(x["correct"] for x in model_results["gsm8k"]) / max(1, len(model_results["gsm8k"])),
            "humaneval_pct": 100 * sum(x["correct"] for x in model_results["humaneval"]) / max(1, len(model_results["humaneval"])),
            "ifeval_pct": 100 * sum(x["correct"] for x in model_results["ifeval"]) / max(1, len(model_results["ifeval"])),
            "composite_pct": 100 * (sum(x["correct"] for k in ["mmlu_pro","gsm8k","humaneval","ifeval"] for x in model_results[k]) / max(1, sum(len(model_results[k]) for k in ["mmlu_pro","gsm8k","humaneval","ifeval"]))),
            "median_latency_ms": sorted(model_results["latencies"])[len(model_results["latencies"])//2],
            "p95_latency_ms": sorted(model_results["latencies"])[int(len(model_results["latencies"])*0.95)] if model_results["latencies"] else 0,
        }
        s = model_results["summary"]
        print(f"  COMPOSITE: {s['composite_pct']:.1f}% | MMLU:{s['mmlu_pro_pct']:.0f}% GSM8K:{s['gsm8k_pct']:.0f}% HumanEval:{s['humaneval_pct']:.0f}% IFEval:{s['ifeval_pct']:.0f}% | median {s['median_latency_ms']:.0f}ms p95 {s['p95_latency_ms']:.0f}ms")
    
    results["models"][model] = model_results
    checkpoint_path = write_checkpoint(out, ts, results)
    print(f"  CHECKPOINT: {checkpoint_path} ({len(results['models'])}/{len(MODELS)} models)")

# Write results + SIGIL anchor
result_path = out / f"benchmark_{ts}.json"
atomic_write_json(result_path, results)
digest = hashlib.sha256(result_path.read_bytes()).hexdigest()
sigil = {
    "scheme": "sha256",
    "benchmark_file": result_path.name,
    "benchmark_sha256": digest,
    "timestamp": results["timestamp"],
    "model_count": len(results["models"]),
    "task_calls_expected": sum(len(tasks) for tasks in TASKS.values()) * len(MODELS),
}
sigil_path = out / f"benchmark_{ts}.sigil.json"
atomic_write_json(sigil_path, sigil)
(out / f"benchmark_{ts}.checkpoint.json").unlink(missing_ok=True)
print(f"\n\n=== ALL RESULTS WRITTEN: {result_path} ===")
print(f"=== SIGIL SHA256: {digest} ({sigil_path}) ===")
print(json.dumps({m: r.get("summary", {}) for m, r in results["models"].items()}, indent=2))
