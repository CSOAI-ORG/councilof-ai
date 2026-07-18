"""
Model benchmark + capability survey.
Measures speed, quality, token efficiency.
"""
import json, urllib.request, time
from statistics import mean, stdev

OLLAMA_LOCAL = "http://localhost:11434"
M2 = "http://192.168.50.176:11434"

def get_models(url):
    try:
        r = json.loads(urllib.request.urlopen(f"{url}/api/tags", timeout=5).read())
        return [(m["name"], m.get("size", 0) / 1e9) for m in r.get("models", [])]
    except: return []

def bench(url, model, prompt, runs=3, max_tokens=64):
    """Benchmark one model: speed + quality."""
    times = []
    outputs = []
    for _ in range(runs):
        body = json.dumps({"model": model, "prompt": prompt,
                           "temperature": 0.5, "stream": False,
                           "num_predict": max_tokens}).encode()
        try:
            t0 = time.time()
            r = json.loads(urllib.request.urlopen(
                urllib.request.Request(f"{url}/api/generate", body,
                                       {"Content-Type": "application/json"}),
                timeout=30).read())
            elapsed = time.time() - t0
            out = r.get("response", "")
            tok_s = r.get("eval_count", 0) / elapsed if elapsed > 0 else 0
            times.append(elapsed)
            outputs.append((out, len(out) if isinstance(out, str) else 0, tok_s))
        except Exception:
            return None
    return {
        "model": model, "runs": runs,
        "avg_time_s": round(mean(times), 2),
        "stdev_s": round(stdev(times) if len(times) > 1 else 0, 2),
        "avg_output_chars": round(mean([len(o[1]) for o in outputs]), 0),
        "avg_tok_s": round(mean([o[2] for o in outputs]), 1),
        "samples": [o[0][:60] for o in outputs],
    }


if __name__ == "__main__":
    import sys

    print("=== MODEL INVENTORY ===\n")

    for name, url in [("MAC", OLLAMA_LOCAL), ("M2", M2)]:
        models = get_models(url)
        if models:
            print(f"{name} Ollama ({len(models)} models):")
            for m, size in models:
                print(f"  {m}: {size:.1f}GB")
            print()

    # Benchmark all available models with the same prompt
    print("=== BENCHMARK ===")
    prompt = """Article 50 of the EU AI Act requires transparency for AI-generated content.
Provide a 2-sentence summary. Cite specific Articles."""

    for name, url in [("LOCAL", OLLAMA_LOCAL), ("M2", M2)]:
        models = get_models(url)
        # Skip embedding models + already-tested
        for model, _ in models:
            if any(x in model for x in ["embed", "moondream"]):
                continue
            print(f"\n[{name}] {model}:")
            r = bench(url, model, prompt, runs=2, max_tokens=64)
            if r:
                print(f"  Time: {r['avg_time_s']}s ±{r['stdev_s']}s")
                print(f"  Output: {r['avg_output_chars']} chars")
                print(f"  Speed: {r['avg_tok_s']} tok/s")
                if r['samples']:
                    print(f"  Sample: {r['samples'][0]}")
            else:
                print("  (offline)")
