#!/usr/bin/env python3
"""
tab1_m4_local.py — FREE GPU Connector Tab 1
Sovereign runtime: SOV33_small (qwen3:0.6b)
Host: Local M4 Apple Silicon — Ollama at localhost:11434
Tier: Tier 0 (Free / Edge) — always-on local inference
"""
import json
import time
import hashlib
import urllib.request
import urllib.error

HOST = "http://localhost:11434"
MODEL = "qwen3:0.6b"  # SOV33_small
TAB_ID = "tab1_m4_local"


def _sigil(payload: str) -> str:
    """SHA-256 SIGIL receipt for the inference call."""
    return hashlib.sha256(f"{TAB_ID}|{payload}".encode("utf-8")).hexdigest()


def connect() -> dict:
    """Ping local Ollama server."""
    try:
        with urllib.request.urlopen(f"{HOST}/api/version", timeout=3) as r:
            ver = json.loads(r.read().decode("utf-8"))
        with urllib.request.urlopen(f"{HOST}/api/tags", timeout=3) as r:
            tags = json.loads(r.read().decode("utf-8"))
        models = [m.get("name") for m in tags.get("models", [])]
        return {
            "ok": True,
            "host": HOST,
            "version": ver.get("version"),
            "models_available": models,
            "model_required": MODEL,
            "model_loaded": MODEL in models,
        }
    except (urllib.error.URLError, TimeoutError, ConnectionError) as e:
        return {"ok": False, "host": HOST, "error": str(e)}


def run_inference(prompt: str, model: str = MODEL) -> dict:
    """Run inference on local Ollama. Returns response + SIGIL."""
    body = json.dumps({
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": 0.7, "num_predict": 256},
    }).encode("utf-8")
    req = urllib.request.Request(
        f"{HOST}/api/generate",
        data=body,
        headers={"Content-Type": "application/json"},
    )
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            resp = json.loads(r.read().decode("utf-8"))
        elapsed_ms = int((time.time() - t0) * 1000)
        response_text = resp.get("response", "")
        sigil = _sigil(f"{prompt}|{response_text}")
        return {
            "ok": True,
            "tab": TAB_ID,
            "host": HOST,
            "model": model,
            "tier": "0_edge",
            "prompt": prompt,
            "response": response_text.strip(),
            "elapsed_ms": elapsed_ms,
            "eval_count": resp.get("eval_count"),
            "sigil": sigil,
        }
    except (urllib.error.URLError, TimeoutError, ConnectionError) as e:
        return {
            "ok": False,
            "tab": TAB_ID,
            "host": HOST,
            "model": model,
            "error": str(e),
            "sigil": _sigil(f"ERROR|{prompt}|{e}"),
        }


if __name__ == "__main__":
    print(f"=== {TAB_ID} ===")
    ping = connect()
    print(json.dumps(ping, indent=2))
    if ping.get("ok"):
        result = run_inference("Say 'SOV33 small online' in 6 words or fewer.")
        print("\n--- run_inference ---")
        print(json.dumps(result, indent=2))
    else:
        print("\n[!] Ollama unreachable at", HOST)
