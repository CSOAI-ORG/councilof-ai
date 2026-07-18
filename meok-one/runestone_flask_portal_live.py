#!/usr/bin/env python3
"""LIVE King Runestone Portal v8 - real models, real sigils, real audit."""
import json, time, hashlib, urllib.request, threading
from datetime import datetime
from pathlib import Path
import sys

sys.path.insert(0, "/Users/nicholas/clawd/meok-one")
from runestone_live import live_query, get_models

from flask import Flask, request, jsonify

app = Flask(__name__)
LEDGER = Path("/tmp/sovereign-portal/runestone-ledger.jsonl")


@app.route("/")
def home():
    return jsonify({
        "name": "King Runestone Portal v8 (LIVE)",
        "version": "8.0.0",
        "models": get_models(),
        "endpoints": {
            "POST /portal/live":        "Live sovereign query (auto voice)",
            "POST /portal/live/voice":  "Live sovereign query with specific voice",
            "POST /portal/live/4":      "Live 4-voice parallel",
            "GET  /portal/models":      "List available models",
            "GET  /portal/health":      "Health check",
        }
    })


@app.route("/portal/live", methods=["POST"])
def live():
    data = request.json or {}
    query = data.get("query", "")
    if not query: return jsonify({"error": "Missing 'query'"}), 400
    voice = data.get("voice", "rigorous")
    r = live_query(query, voice)
    # Log
    if LEDGER.parent.exists():
        with LEDGER.open("a") as f:
            f.write(json.dumps({"runestone": r}) + "\n")
    return jsonify(r)


@app.route("/portal/live/voice", methods=["POST"])
def live_voice():
    data = request.json or {}
    query = data.get("query", "")
    if not query: return jsonify({"error": "Missing 'query'"}), 400
    voice = data.get("voice", "rigorous")
    if voice not in {"sophisticated","rigorous","concise","narrative"}:
        return jsonify({"error": f"Invalid voice: {voice}"}), 400
    r = live_query(query, voice)
    return jsonify(r)


@app.route("/portal/live/4", methods=["POST"])
def live_4():
    """All 4 voices in parallel — REAL models, real sigils."""
    data = request.json or {}
    query = data.get("query", "")
    if not query: return jsonify({"error": "Missing 'query'"}), 400

    voices = ["sophisticated", "rigorous", "concise", "narrative"]
    results = {}

    def worker(v):
        results[v] = live_query(query, v)

    threads = []
    t0 = time.time()
    for v in voices:
        th = threading.Thread(target=worker, args=(v,))
        th.start()
        threads.append(th)
    for th in threads: th.join()
    elapsed = round(time.time() - t0, 2)

    # Build runestone with all 4 sigils
    sigils = [results[v]["sigil"] for v in voices]
    combined_sigil = hashlib.sha256("|".join(sigils).encode()).hexdigest()[:32]

    r = {
        "id": f"rs_live4_{int(time.time())}",
        "ts": datetime.now().isoformat(),
        "query": query,
        "mode": "live-4-voice-parallel",
        "voices": {v: {
            "response": results[v]["response"],
            "model": results[v]["model"],
            "elapsed_s": results[v]["elapsed_s"],
            "verification": results[v]["verification"],
            "sigil": results[v]["sigil"][:16],
        } for v in voices},
        "combined_sigil": combined_sigil,
        "elapsed_s": elapsed,
        "verification": {
            "all_passed": all(results[v]["verification"]["passed"] for v in voices),
            "avg_score": round(sum(results[v]["verification"]["score"] for v in voices) / len(voices), 3),
        }
    }

    if LEDGER.parent.exists():
        with LEDGER.open("a") as f:
            f.write(json.dumps({"runestone": r}) + "\n")

    return jsonify(r)


@app.route("/portal/models", methods=["GET"])
def models():
    return jsonify({"models": get_models()})


@app.route("/portal/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok", "ts": datetime.now().isoformat(),
        "portal": "king-runestone-v8-LIVE",
        "models": get_models(),
        "verifier": "L6_keystone",
    })


if __name__ == "__main__":
    print("=" * 70)
    print("  🐉 KING RUNESTONE PORTAL v8 — LIVE REAL MODELS")
    print("  Listening on :7779 (so older portals stay running)")
    print("=" * 70)
    app.run(host="127.0.0.1", port=7779, debug=False)
