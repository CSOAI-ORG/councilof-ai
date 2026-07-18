#!/usr/bin/env python3
"""
tab2_m2_lan.py — FREE GPU Connector Tab 2
Sovereign runtime: SOV33_large (qwen3:30b-a3b)
Host: M2 LAN MacBook via SSH tunnel — Ollama at 192.168.50.176:11434
Tier: Tier 1 (Free / LAN) — tethered to home LAN via SSH local-forward
Pre-req: ssh -L 11434:localhost:11434 m2-lan (or route already mapped)
"""
import json
import time
import hashlib
import urllib.request
import urllib.error

HOST = "http://192.168.50.176:11434"
MODEL = "qwen3:30b-a3b"  # SOV33_large
TAB_ID = "tab2_m2_lan"


def _sigil(payload: str) -> str:
    return hashlib.sha256(f"{TAB_ID}|{payload}".encode("utf-8")).hexdigest()


def connect() -> dict:
    try:
        with urllib.request.urlopen(f"{HOST}/api/version", timeout=4) as r:
            ver = json.loads(r.read().decode("utf-8"))
        with urllib.request.urlopen(f"{HOST}/api/tags", timeout=4) as r:
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
    body = json.dumps({
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": 0.6, "num_predict": 512},
    }).encode("utf-8")
    req = urllib.request.Request(
        f"{HOST}/api/generate",
        data=body,
        headers={"Content-Type": "application/json"},
    )
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            resp = json.loads(r.read().decode("utf-8"))
        elapsed_ms = int((time.time() - t0) * 1000)
        response_text = resp.get("response", "")
        sigil = _sigil(f"{prompt}|{response_text}")
        return {
            "ok": True,
            "tab": TAB_ID,
            "host": HOST,
            "model": model,
            "tier": "1_lan",
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
        result = run_inference("What is the SOV3 substrate in 1 sentence?")
        print("\n--- run_inference ---")
        print(json.dumps(result, indent=2))
    else:
        print("\n[!] M2 LAN Ollama unreachable at", HOST)
        print("    Hint: ssh -L 11434:localhost:11434 m2-lan  (or set up tunnel first)")
