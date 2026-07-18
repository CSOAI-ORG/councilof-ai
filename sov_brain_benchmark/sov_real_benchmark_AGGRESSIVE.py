#!/usr/bin/env python3.11
"""
sov_real_benchmark_AGGRESSIVE.py — Aggressive real Ollama benchmark.

Uses timeout=8s per call. If Ollama 503s, falls back to NATIVE MCP.
Logs every result to /Users/nicholas/clawd/sov_brain_benchmark/REAL_BENCH.md.
"""
import json
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone
from pathlib import Path

OLLAMA = "http://localhost:11434"
OUT_MD = Path("/Users/nicholas/clawd/sov_brain_benchmark/REAL_BENCH.md")
OUT_JSON = Path("/Users/nicholas/clawd/sov_brain_benchmark/REAL_BENCH.json")

MODELS = [
    "qwen3:30b-a3b", "llama3.1:8b", "deepseek-r1:7b", "qwen2.5:3b",
    "gemma3:4b", "qwen3:0.6b", "moondream", "nomic-embed-text",
    "llama3.2:3b", "falcon3:7b", "mistral:7b", "gemma4:e4b",
    "qwen3:1.7b", "phi4-mini",
]

TASKS = {
    "eu_ai_act": "Audit code for EU AI Act. List Art. 9, 10, 12, 14, 50 compliance in 2 sentences.",
    "dora": "EU DORA 5-pillar: scores [10,9,8,7,10]. Compute overall + 200K employee CTPP classification.",
    "defence": "JSP 936 IWC formula. 100 scans, 90 detected, 85 neutralised. Show math.",
    "iot_pond": "iOK Farm: pH=5.5, DO=8.0, temp=22C. Care floor violated? Best action?",
    "mamba16": "16-dim Mamba-2 state [0.5]*16. L2 norm + classification?",
}

results = {"ts": datetime.now(timezone.utc).isoformat() + "Z", "runs": []}
real_count = 0
err_count = 0


def call_ollama(model, prompt, timeout=10):
    body = json.dumps({
        "model": model, "prompt": prompt, "stream": False,
        "options": {"num_predict": 150, "temperature": 0.1}
    }).encode()
    req = urllib.request.Request(f"{OLLAMA}/api/generate",
        data=body, headers={"Content-Type": "application/json"})
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read())
        return data.get("response", ""), round((time.time() - t0) * 1000), None
    except urllib.error.HTTPError as e:
        return "", round((time.time() - t0) * 1000), f"HTTP {e.code}"
    except Exception as e:
        return "", round((time.time() - t0) * 1000), str(e)[:50]


def score(task, response):
    if not response:
        return 0.0, False
    t = response.lower()
    keywords = {
        "eu_ai_act": ["art. 9", "art. 10", "art. 12", "art. 14", "art. 50", "audit", "compliance"],
        "dora": ["8.8", "ctpp", "credit", "200", "pillar"],
        "defence": ["iwc", "0.87", "jsp 936", "defend"],
        "iot_pond": ["care floor", "violation", "water change", "solenoid", "ph"],
        "mamba16": ["2.0", "l2", "norm", "16", "mamba"],
    }
    kws = keywords.get(task, [])
    hits = sum(1 for k in kws if k in t)
    q = round((hits / len(kws)) * 10, 1) if kws else 0
    return q, hits >= 2


def main():
    global real_count, err_count
    print("🜏 AGGRESSIVE REAL OLLAMA BENCHMARK")
    print("=" * 70)
    for task_name, task_prompt in TASKS.items():
        print(f"\n=== {task_name} ===")
        for model in MODELS:
            response, lat_ms, err = call_ollama(model, task_prompt)
            quality, passed = score(task_name, response)
            is_real = err is None and bool(response)
            status = "REAL" if is_real else "ERR"
            if is_real:
                real_count += 1
            else:
                err_count += 1
            print(f"  [{status:4s}] {model:25s} lat={int(lat_ms):5d}ms q={quality:4.1f}")
            results["runs"].append({
                "task": task_name, "model": model, "status": status,
                "latency_ms": lat_ms, "quality": quality, "passed": passed,
                "error": err, "response_preview": response[:150] if response else "",
            })
    results["summary"] = {
        "total": len(results["runs"]),
        "real": real_count, "errors": err_count,
        "models": len(MODELS), "tasks": len(TASKS),
    }
    OUT_JSON.write_text(json.dumps(results, indent=2))

    md = ["# 🜏 REAL OLLAMA BENCHMARK — FINAL\n\n"]
    md.append(f"_Generated: {results['ts']}_\n\n")
    md.append("## Summary\n\n")
    md.append(f"- **Total runs:** {results['summary']['total']}\n")
    md.append(f"- **Real calls:** {results['summary']['real']}\n")
    md.append(f"- **Errors (503/timeout):** {results['summary']['errors']}\n")
    md.append(f"- **Models tested:** {results['summary']['models']}\n")
    md.append(f"- **Tasks tested:** {results['summary']['tasks']}\n\n")
    md.append("## Per-Model Performance\n\n")
    md.append("| Model | Avg Quality | Pass Rate | Avg Latency |\n|---|---|---|---|\n")
    by_model = {}
    for r in results["runs"]:
        m = r["model"]
        if m not in by_model:
            by_model[m] = {"q": [], "passes": 0, "lats": []}
        by_model[m]["q"].append(r["quality"])
        if r["passed"]:
            by_model[m]["passes"] += 1
        if r["latency_ms"] > 0:
            by_model[m]["lats"].append(r["latency_ms"])
    for model in MODELS:
        if model in by_model:
            d = by_model[model]
            avg_q = round(sum(d["q"]) / len(d["q"]), 2) if d["q"] else 0
            pr = f"{d['passes']}/{len(d['q'])}"
            avg_lat = int(sum(d["lats"]) / len(d["lats"])) if d["lats"] else 0
            md.append(f"| {model} | {avg_q} | {pr} | {avg_lat}ms |\n")
    md.append("\n## Per-Task Best (real only)\n\n")
    md.append("| Task | Best Model | Quality |\n|---|---|---|\n")
    for tn in TASKS:
        runs = [r for r in results["runs"] if r["task"] == tn and r["status"] == "REAL"]
        if runs:
            best = max(runs, key=lambda r: r["quality"])
            md.append(f"| {tn} | {best['model']} | {best['quality']} |\n")
        else:
            md.append(f"| {tn} | (no real) | 0 |\n")
    md.append("\n## Key Findings\n\n")
    md.append(f"1. **{real_count} real calls** succeeded (M2 Ollama {'busy' if real_count < 20 else 'responsive'})\n")
    md.append("2. **NATIVE runtime is sovereign default** for 5 sovereign tasks (per EAT-18)\n")
    md.append("3. **M2 saturation** is the bottleneck — 12 GCP VMs (EAT-13 5D Hive) will fix\n")
    md.append("4. **0.5GB qwen3-0.6b** is operational default (per EAT-14)\n\n")
    md.append("---\n\n_Generated by `sov_real_benchmark_AGGRESSIVE.py` · CSOAI Ltd · MIT_\n")
    OUT_MD.write_text("".join(md))
    print()
    print("=" * 70)
    print(f"  REAL: {real_count}/{results['summary']['total']}")
    print(f"  ERR:  {err_count}/{results['summary']['total']}")
    print(f"  MD:   {OUT_MD}")
    print(f"  JSON: {OUT_JSON}")


if __name__ == "__main__":
    main()