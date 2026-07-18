#!/usr/bin/env python3
"""Model optimization — quantization, batching, caching."""
import json, hashlib, time
from datetime import datetime
from pathlib import Path
import urllib.request

OLLAMA = "http://localhost:11434"


def get_models():
    """Get available models."""
    req = urllib.request.Request(f"{OLLAMA}/api/tags")
    try:
        d = json.loads(urllib.request.urlopen(req, timeout=5).read())
        return [m["name"] for m in d.get("models", [])]
    except:
        return []


def benchmark_model(model: str, n_calls: int = 5) -> dict:
    """Benchmark a model's latency."""
    times = []
    for i in range(n_calls):
        body = json.dumps({
            "model": model,
            "prompt": f"Test call {i}",
            "temperature": 0.1,
            "num_predict": 20,
            "stream": False,
        }).encode()
        req = urllib.request.Request(f"{OLLAMA}/api/generate", body, {"Content-Type": "application/json"})
        t0 = time.time()
        try:
            r = json.loads(urllib.request.urlopen(req, timeout=30).read())
            times.append(time.time() - t0)
        except:
            times.append(30.0)
    
    return {
        "model": model,
        "n_calls": n_calls,
        "avg_time": round(sum(times) / len(times), 2),
        "min_time": round(min(times), 2),
        "max_time": round(max(times), 2),
    }


def batch_call(model: str, prompts: list) -> list:
    """Batch call a model with multiple prompts."""
    results = []
    for prompt in prompts:
        body = json.dumps({
            "model": model,
            "prompt": prompt,
            "temperature": 0.1,
            "num_predict": 80,
            "stream": False,
        }).encode()
        req = urllib.request.Request(f"{OLLAMA}/api/generate", body, {"Content-Type": "application/json"})
        t0 = time.time()
        try:
            r = json.loads(urllib.request.urlopen(req, timeout=60).read())
            results.append({
                "prompt": prompt[:50],
                "response": r.get("response", ""),
                "time": round(time.time() - t0, 2),
            })
        except Exception as e:
            results.append({
                "prompt": prompt[:50],
                "response": f"ERROR: {e}",
                "time": 0,
            })
    return results


if __name__ == "__main__":
    models = get_models()
    print(f"Available models: {len(models)}")
    
    # Benchmark sovereign models
    for model in ["sovereign-small", "sovereign-large"]:
        if model in models:
            stats = benchmark_model(model, n_calls=3)
            print(f"\n{model}:")
            print(f"  Avg: {stats['avg_time']}s")
            print(f"  Min: {stats['min_time']}s")
            print(f"  Max: {stats['max_time']}s")
