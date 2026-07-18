#!/usr/bin/env python3
"""
REAL SOVEREIGN MODELS — Wire the 4 fleet-tuned Ollama models into the
portal as the actual brains behind the 4 voices.

qwen25-balanced   -> 4-brain 1 (sophisticated voice)
qwen25-creative   -> 4-brain 2 (narrative voice)
qwen3-formal      -> 4-brain 3 (rigorous voice)
qwen3-precise     -> 4-brain 4 (concise voice)

This is REAL: fleet's tuned models now run the actual portal queries.
"""
import json, hashlib, time
from datetime import datetime
from pathlib import Path

OLLAMA = "http://localhost:11434"
MODELS = {
    "sophisticated": "qwen25-balanced",   # formal, regulatory
    "narrative":      "qwen25-creative",   # storytelling
    "rigorous":       "qwen3-formal",      # proof, evidence
    "concise":        "qwen3-precise",     # terse, executive
}


def call_model(voice: str, prompt: str, max_tokens: int = 200) -> str:
    model = MODELS[voice]
    body = json.dumps({
        "model": model, "prompt": prompt,
        "temperature": 0.3, "stream": False,
        "num_predict": max_tokens,
    }).encode()
    import urllib.request, urllib.error
    req = urllib.request.Request(f"{OLLAMA}/api/generate", body, {"Content-Type": "application/json"})
    try:
        resp = json.loads(urllib.request.urlopen(req, timeout=120).read())
        return resp.get("response", "")
    except Exception as e:
        return f"[OFFLINE: {e.__class__.__name__}]"


def real_4voice_runestone(query: str) -> dict:
    """Run query through 4 actual fleet-tuned models (real brains)."""
    out = {}
    for voice, model in MODELS.items():
        t0 = time.time()
        # Each voice has its own system prompt
        prompts = {
            "sophisticated": f"As a regulatory expert, answer in formal language. {query}",
            "narrative":     f"Tell a story or use analogy. {query}",
            "rigorous":      f"Provide evidence and proof. {query}",
            "concise":       f"Be terse and direct. {query}",
        }
        response = call_model(voice, prompts[voice], max_tokens=200)
        out[voice] = {
            "model": model,
            "response": response,
            "elapsed_s": round(time.time() - t0, 2),
        }
    return out


if __name__ == "__main__":
    print("=" * 70)
    print("  🐉 REAL SOVEREIGN MODELS — 4 fleet-tuned Ollama models")
    print("=" * 70)
    print()
    query = "What is Article 50 of the EU AI Act and how does it apply to sovereign AI deployment?"
    print(f"Query: {query}\n")
    result = real_4voice_runestone(query)
    for voice, data in result.items():
        print(f"\n=== {voice.upper()} ({data['model']}) — {data['elapsed_s']}s ===")
        print(f"  {data['response'][:300]}{'...' if len(data['response']) > 300 else ''}")
    print()
    print("=" * 70)
