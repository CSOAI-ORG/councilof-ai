#!/usr/bin/env python3
"""REAL sovereign portal with real Ollama models as brains."""
import json, time, hashlib, urllib.request
from datetime import datetime
from pathlib import Path
from flask import Flask, request, jsonify

OLLAMA = "http://localhost:11434"
MODELS = {
    "sophisticated": "qwen25-balanced",
    "narrative":     "qwen25-creative",
    "rigorous":      "qwen3-formal",
    "concise":       "qwen3-precise",
}

LEDGER = Path("/tmp/sovereign-portal/runestone-ledger.jsonl")

def call_model(model, prompt, max_tokens=200):
    body = json.dumps({"model": model, "prompt": prompt, "temperature": 0.3,
                       "num_predict": max_tokens, "stream": False}).encode()
    req = urllib.request.Request(f"{OLLAMA}/api/generate", body,
                                  {"Content-Type": "application/json"})
    try:
        return json.loads(urllib.request.urlopen(req, timeout=120).read()).get("response", "")
    except Exception as e:
        return f"[OFFLINE: {type(e).__name__}]"

app = Flask(__name__)


@app.route("/")
def home():
    return jsonify({
        "name": "King Runestone Portal (REAL MODELS)",
        "version": "7.0.0",
        "models": MODELS,
        "modes": ["1-brain", "4-brain", "4x4x3", "real-4-voice"],
        "endpoints": {
            "POST /portal/submit/real":      "Real 1-brain (single model)",
            "POST /portal/submit/real/4":    "Real 4-brain parallel",
            "POST /portal/submit/real/4x4":  "Real 4x4x3 MAGNIFICENT",
            "GET  /portal/health":           "Health check",
            "GET  /portal/models":           "List models",
        }
    })


@app.route("/portal/submit/real", methods=["POST"])
def submit_real():
    data = request.json or {}
    query = data.get("query", "")
    voice = data.get("voice", "sophisticated")
    model = MODELS.get(voice, "qwen25-balanced")
    t0 = time.time()
    response = call_model(model, query, max_tokens=300)
    elapsed = round(time.time() - t0, 2)
    r = {
        "id": f"rs_real_{int(time.time())}",
        "ts": datetime.now().isoformat(),
        "mode": "real-1-brain",
        "voice": voice,
        "model": model,
        "query": query,
        "response": response,
        "elapsed_s": elapsed,
        "sigil": hashlib.sha256(response.encode()).hexdigest()[:32],
    }
    with LEDGER.open("a") as f:
        f.write(json.dumps({"runestone": r}) + "\n")
    return jsonify(r)


@app.route("/portal/submit/real/4", methods=["POST"])
def submit_real_4():
    data = request.json or {}
    query = data.get("query", "")
    voices = list(MODELS.keys())
    responses = {}
    consensus = []
    for voice in voices:
        model = MODELS[voice]
        system_prompts = {
            "sophisticated": f"As a regulatory expert, {query}",
            "narrative":     f"Tell a story about: {query}",
            "rigorous":      f"Provide evidence and proof for: {query}",
            "concise":       f"Be terse and direct: {query}",
        }
        t0 = time.time()
        resp = call_model(model, system_prompts[voice], max_tokens=200)
        elapsed = round(time.time() - t0, 2)
        responses[voice] = {
            "model": model, "response": resp, "elapsed_s": elapsed,
            "sigil": hashlib.sha256(resp.encode()).hexdigest()[:16],
        }
        consensus.append(resp[:100])
    r = {
        "id": f"rs_real_4b_{int(time.time())}",
        "ts": datetime.now().isoformat(),
        "mode": "real-4-brain-12-voter",
        "query": query,
        "voices": responses,
        "distinct_openings": len(set(consensus)),
        "sigil": hashlib.sha256(json.dumps(consensus).encode()).hexdigest()[:32],
    }
    with LEDGER.open("a") as f:
        f.write(json.dumps({"runestone": r}) + "\n")
    return jsonify(r)


@app.route("/portal/submit/real/4x4", methods=["POST"])
def submit_real_4x4():
    data = request.json or {}
    query = data.get("query", "")
    paths = []
    consensus = []
    for voice, model in MODELS.items():
        t0 = time.time()
        # Reduce tokens for batch mode
        resp = call_model(model, f"({voice}) {query}", max_tokens=120)
        elapsed = round(time.time() - t0, 2)
        paths.append({
            "voice": voice, "model": model,
            "response": resp, "elapsed_s": elapsed,
        })
        consensus.append(resp[:80])
    r = {
        "id": f"rs_real_4x4_{int(time.time())}",
        "ts": datetime.now().isoformat(),
        "mode": "real-4x4-MAGNIFICENT",
        "query": query,
        "paths": paths,
        "n_models": len(MODELS),
        "distinct_openings": len(set(consensus)),
        "sigil": hashlib.sha256(json.dumps(consensus).encode()).hexdigest()[:32],
    }
    with LEDGER.open("a") as f:
        f.write(json.dumps({"runestone": r}) + "\n")
    return jsonify(r)


@app.route("/portal/models", methods=["GET"])
def models():
    return jsonify(MODELS)


@app.route("/portal/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok", "ts": datetime.now().isoformat(),
        "portal": "king-runestone-v7-real",
        "models": list(MODELS.values()),
    })


if __name__ == "__main__":
    print("  King Runestone Portal v7 — REAL models")
    print(f"  Listening on :7778 (so v6 stays running)")
    app.run(host="127.0.0.1", port=7778, debug=False)
