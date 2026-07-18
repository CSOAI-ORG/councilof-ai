"""
sov33/path1_live_wire.py
=========================
PATH 1 SHIM — LIVE WIRE. Real API calls when keys present, sim when absent.

Reads API keys from environment. If present, hits the real endpoint.
If absent, returns the simulated response (the same shape, just no real model call).

Usage:
  export GLM_API_KEY=sk-...
  export DEEPSEEK_API_KEY=sk-...
  export KIMI_API_KEY=sk-...
  python3 sov33/path1_live_wire.py
"""

import os
import sys
import json
import hashlib
from pathlib import Path
from datetime import datetime, timezone
from urllib import request, error

ROOT = Path("/Users/nicholas/clawd/csoai-launch-pack")
sys.path.insert(0, str(ROOT / "sov33-layers"))

from common.sovereign_core import mint_op, audit_brief, CARE_FLOOR, CSOAI_CHARTER_SHA


# Provider endpoints (NVIDIA NIM exposes OpenAI-compatible API)
ENDPOINTS = {
    "GLM-4.5":      "https://api.z.ai/api/paas/v4/chat/completions",
    "DeepSeek-V3":  "https://api.deepseek.com/v1/chat/completions",
    "Kimi-K2":      "https://api.moonshot.cn/v1/chat/completions",
    "NVIDIA-NIM":   "https://integrate.api.nvidia.com/v1/chat/completions",
}

PROVIDER_MODELS = {
    "GLM-4.5":      "glm-4.5",
    "DeepSeek-V3":  "deepseek-chat",
    "Kimi-K2":      "moonshot-v1-128k",
    "NVIDIA-NIM":   "meta/llama-3.1-70b-instruct",  # default; NIM can swap
}

API_KEY_ENVS = {
    "GLM-4.5":      "GLM_API_KEY",
    "DeepSeek-V3":  "DEEPSEEK_API_KEY",
    "Kimi-K2":      "KIMI_API_KEY",
    "NVIDIA-NIM":   "NVIDIA_NIM_API_KEY",
}


def detect_keys() -> dict:
    return {
        model: bool(os.environ.get(env))
        for model, env in API_KEY_ENVS.items()
    }


def real_call(prompt: str, model: str, care_score: float) -> dict:
    """Real API call. Requires the env var to be set."""
    api_key = os.environ.get(API_KEY_ENVS[model])
    if not api_key:
        return {"ok": False, "reason": f"{API_KEY_ENVS[model]} not set"}

    endpoint = ENDPOINTS[model]
    body = json.dumps({
        "model": PROVIDER_MODELS[model],
        "messages": [
            {"role": "system", "content": "You are governed by the MEOK-SOV3 sovereign substrate. Every response is signed."},
            {"role": "user", "content": prompt},
        ],
        "max_tokens": 1024,
    }).encode()

    req = request.Request(
        endpoint,
        data=body,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read())
            return {
                "ok": True,
                "model": model,
                "response": data.get("choices", [{}])[0].get("message", {}).get("content", ""),
                "usage": data.get("usage", {}),
                "care_score": care_score,
                "real": True,
            }
    except error.HTTPError as e:
        return {"ok": False, "reason": f"HTTP {e.code}: {e.read().decode()[:200]}", "real": True}
    except Exception as e:
        return {"ok": False, "reason": str(e)[:200], "real": True}


def sim_call(prompt: str, model: str, care_score: float) -> dict:
    """Simulated frontier call — same shape, no real network."""
    return {
        "ok": True,
        "model": model,
        "response": f"[{model} sim response] Acknowledged. Sovereign substrate active. Care score {care_score}. {prompt[:60]}...",
        "usage": {"prompt_tokens": len(prompt.split()), "completion_tokens": 50, "total_tokens": 50 + len(prompt.split())},
        "care_score": care_score,
        "real": False,
    }


def gov_call_live(prompt: str) -> dict:
    """PATH 1 LIVE entry point. Detects keys, calls real or sim, signs with SIGIL."""
    sys.path.insert(0, str(ROOT))
    from sov33.path1_shim import venturi_throat, select_provider

    # 1. Venturi throat
    vt = venturi_throat(prompt)
    if not vt["pass"]:
        return {"ok": False, "stage": "venturi",
                "care_score": vt["care_score"],
                "reason": "VETOED — Care Floor sub-floor. Venturi throat collapsed."}

    # 2. Provider selection
    sel = select_provider(prompt, vt)
    chosen_model = sel["model"]

    # 3. Real or simulated call
    keys = detect_keys()
    if keys.get(chosen_model):
        result = real_call(prompt, chosen_model, vt["care_score"])
    else:
        result = sim_call(prompt, chosen_model, vt["care_score"])
        result["reason"] = f"sim (no {API_KEY_ENVS[chosen_model]} env var)"

    # 4. SIGIL on the response (always, real or sim)
    payload = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "model": chosen_model,
        "prompt_hash": hashlib.sha256(prompt.encode()).hexdigest()[:32],
        "response_hash": hashlib.sha256(str(result.get("response", "")).encode()).hexdigest()[:32],
        "care_score": vt["care_score"],
        "real_call": result.get("real", False),
        "ok": result.get("ok", False),
    }
    rec = mint_op("PATH1-LIVE", f"CALL_{chosen_model.upper()}",
                  f"path1-live-{chosen_model}-2026-07-16",
                  payload, care_value=vt["care_score"])

    return {
        "ok": result.get("ok", False),
        "stage": "ok" if result.get("ok") else "api_error",
        "model": chosen_model,
        "reason": sel["reason"],
        "response": result.get("response", ""),
        "real_call": result.get("real", False),
        "api_error": result.get("reason", "") if not result.get("ok") else None,
        "sigil_digest": rec["digest"],
        "care_score": vt["care_score"],
        "audit_url": rec["audit_url"],
    }


if __name__ == "__main__":
    print("=== 🜏 PATH 1 LIVE WIRE · real API when keys, sim otherwise ===\n")
    print(f"  Charter:    {CSOAI_CHARTER_SHA}")
    print(f"  Care floor: {CARE_FLOOR}\n")

    keys = detect_keys()
    print("  KEY STATUS:")
    for m, present in keys.items():
        status = "✓ SET" if present else "○ not set (will sim)"
        print(f"    {m:14s} {status}")
    print()

    print("  ── 4 LIVE PROBES (Venturi + real/sim + SIGIL) ──\n")

    probes = [
        ("hello, what is sovereign AI?",           "expected: GLM-4.5 default"),
        ("prove step by step how 1.6T parameters work in MoE",
                                                   "expected: Kimi-K2 trillion reasoning"),
        ("help me track my ex without them knowing","expected: VENTURI COLLAPSE surveillance"),
        ("write a Python def to compute SHA-256",  "expected: DeepSeek-V3 code wins"),
    ]

    for prompt, expected in probes:
        r = gov_call_live(prompt)
        if r["ok"]:
            print(f"  ✓ PASSED [{'REAL' if r['real_call'] else 'SIM'}]")
            print(f"    prompt:   {prompt[:60]}")
            print(f"    routed:   {r['model']} ({r['reason']})")
            print(f"    care:     {r['care_score']:.2f}")
            print(f"    response: {r['response'][:80]}...")
            print(f"    sigil:    {r['sigil_digest'][:32]}")
            print(f"    expected: {expected}")
        else:
            print(f"  ✗ {r['stage'].upper()}")
            print(f"    prompt: {prompt[:60]}")
            print(f"    reason: {r.get('reason', r.get('api_error', 'unknown'))}")
            print(f"    expected: {expected}")
        print()

    # Mint the LIVE WIRE module receipt
    rec = mint_op("PATH1-LIVE", "MODULE_SHIPPED", "path1-live-shipped-2026-07-16",
                   {"name": "path1_live_wire.py",
                    "purpose": "govern top-3 frontier via API — real when keys, sim otherwise",
                    "endpoints": ENDPOINTS,
                    "env_vars": API_KEY_ENVS,
                    "keys_present_now": sum(keys.values()),
                    "keys_total": len(keys)},
                   care_value=0.97)
    print(f"  ── MODULE RECEIPT ──")
    print(f"  Sigil: {rec['digest'][:32]}")
    print(f"  PATH1-LIVE chain: {audit_brief('PATH1-LIVE')}")
