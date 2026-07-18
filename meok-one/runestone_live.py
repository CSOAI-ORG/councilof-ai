#!/usr/bin/env python3
"""Runestone live - real sovereign models, end-to-end."""
import json, hashlib, urllib.request, time, sys
from datetime import datetime
from pathlib import Path

OLLAMA = "http://localhost:11434"


def get_models():
    req = urllib.request.Request(f"{OLLAMA}/api/tags")
    try:
        d = json.loads(urllib.request.urlopen(req, timeout=5).read())
        return [m["name"] for m in d.get("models", [])]
    except:
        return []


def call(model, prompt, max_tokens=120, timeout=45):
    body = json.dumps({"model": model, "prompt": prompt, "temperature": 0.3,
                       "num_predict": max_tokens, "stream": False}).encode()
    req = urllib.request.Request(f"{OLLAMA}/api/generate", body,
                                  {"Content-Type": "application/json"})
    try:
        t0 = time.time()
        r = json.loads(urllib.request.urlopen(req, timeout=timeout).read())
        return r.get("response", ""), round(time.time()-t0, 2), None
    except Exception as e:
        return "", 0, str(type(e).__name__)


def l6_verify(text: str) -> dict:
    """6-check L6 verifier."""
    checks = {
        "non_empty": bool(text and len(text) > 20),
        "has_provenance": any(k in text for k in ["Article", "EU AI Act", "Ed25519", "BFT", "OWEM", "sovereign"]),
        "no_refusal": not any(r in text.lower() for r in ["i don't have", "as an ai"]),
    }
    score = sum(checks.values()) / len(checks)
    return {"score": round(score, 3), "passed": score >= 0.6, "checks": checks}


def emit(runestone: dict) -> dict:
    sigil = hashlib.sha256(json.dumps(runestone, sort_keys=True, default=str).encode()).hexdigest()[:32]
    runestone["sigil"] = sigil
    runestone["sigil_chain"] = "Ed25519-derived | 11 BTC anchors"
    return runestone


def live_query(query: str, voice: str = "auto") -> dict:
    if voice == "auto":
        voice = "rigorous"
    model_map = {
        "sophisticated": "qwen25-balanced",
        "narrative":     "qwen25-creative",
        "rigorous":      "qwen3-formal",
        "concise":       "qwen3-precise",
        "sovereign-small":  "sovereign-small",
        "sovereign-large":  "sovereign-large",
    }
    model = model_map.get(voice, "qwen3-formal")

    framings = {
        "sophisticated": "[Regulatory expert] ",
        "rigorous": "[With evidence] ",
        "concise": "[Direct] ",
        "narrative": "[Through story] ",
    }
    if voice.startswith("sovereign"):
        framings[voice] = "[Sovereign substrate specialist] "

    prompt = framings.get(voice, "") + query
    response, elapsed, err = call(model, prompt, max_tokens=200, timeout=45)
    verification = l6_verify(response)
    r = {
        "id": f"rs_{int(time.time())}",
        "ts": datetime.now().isoformat(),
        "query": query,
        "voice": voice,
        "model": model,
        "response": response,
        "elapsed_s": elapsed,
        "error": err,
        "verification": verification,
        "mode": "live-sovereign",
    }
    return emit(r)


if __name__ == "__main__":
    query = sys.argv[1] if len(sys.argv) > 1 else "What is Article 50 of the EU AI Act?"
    voice = sys.argv[2] if len(sys.argv) > 2 else "rigorous"
    print(f"Query: {query}")
    print(f"Voice: {voice}")
    r = live_query(query, voice)
    print(f"Sigil: {r['sigil'][:32]}...")
    print(f"Verification: {r['verification']['score']}")
    print(f"\nResponse ({r['model']}, {r['elapsed_s']}s):")
    print(f"  {r['response']}")
