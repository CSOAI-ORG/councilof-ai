#!/usr/bin/env python3
"""sov33_brain_ollama.py — wire the cascade L4 to a REAL local model via Ollama. MEOK-SOV3 2026-07-10.

HONEST state (from `ollama list` 2026-07-10): only qwen2.5:3b (1.9GB) is pulled on the Mac.
So RIGHT-NOW:
  - LEFT  (conscious/small)  = qwen2.5:3b  ✅ real, runs locally
  - RIGHT (subconscious/big) = qwen2.5:3b  ⚠️ SAME model until a larger one is pulled
    (pull a big one later:  ollama pull qwen3:30b-a3b   — needs disk + the 192GB-class box or Oracle ARM)
This module makes L4 call the real model. No stub. It degrades honestly if ollama is unreachable.
"""
import json, urllib.request

OLLAMA = "http://localhost:11434/api/generate"
LEFT_MODEL  = "qwen2.5:3b"     # verified pulled
RIGHT_MODEL = "qwen2.5:3b"     # TODO: swap to a larger pulled model when available

def _call_ollama(model: str, prompt: str, timeout: int = 60) -> dict:
    body = json.dumps({"model": model, "prompt": prompt, "stream": False}).encode()
    req = urllib.request.Request(OLLAMA, data=body, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            data = json.loads(r.read().decode())
        return {"ok": True, "model": model, "text": data.get("response", ""),
                "eval_count": data.get("eval_count"), "total_ms": data.get("total_duration", 0)//1_000_000}
    except Exception as e:
        # honest degrade — never fake a response
        return {"ok": False, "model": model, "error": f"{type(e).__name__}: {e}",
                "text": "[brain unreachable — ollama not running or model not pulled]"}

def think(lane: str, prompt: str) -> dict:
    """L4 brain call. lane = 'left_conscious_small' | 'right_subconscious_large'."""
    model = RIGHT_MODEL if lane.startswith("right") else LEFT_MODEL
    return _call_ollama(model, prompt)

if __name__ == "__main__":
    print("=== SOV33 L4 BRAIN — live ollama test (qwen2.5:3b) ===")
    for lane, q in [("left_conscious_small", "In one sentence: what is the EU AI Act care floor?"),
                    ("right_subconscious_large", "Reason step by step: why must an Annex III high-risk system satisfy both Article 9 and Article 14?")]:
        r = think(lane, q)
        status = "✅ REAL" if r["ok"] else "⚠️ DEGRADE"
        print(f"\n[{status}] lane={lane} model={r['model']}")
        print(f"  {r['text'][:220]}")
        if r["ok"]:
            print(f"  (tokens={r.get('eval_count')}, {r.get('total_ms')}ms)")
