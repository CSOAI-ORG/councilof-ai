#!/usr/bin/env python3
"""sovereign_nvidia.py — optional BIG-BRAIN via NVIDIA's free hosted API (build.nvidia.com), no local GPU.
The API key is read from the environment variable NVIDIA_API_KEY that YOU set (in your shell or the Claude
Science credential store). This code NEVER prints/logs the key; it only forwards it to NVIDIA's official
OpenAI-compatible endpoint. If the key isn't set, functions return None and the Sovereign falls back to local.

Set (in YOUR shell, not shared, not in chat):   export NVIDIA_API_KEY=nvapi-....
Optional:  export NVIDIA_MODEL="meta/llama-3.1-70b-instruct"   NVIDIA_BASE="https://integrate.api.nvidia.com/v1"
"""
import os, json, urllib.request

BASE  = os.environ.get("NVIDIA_BASE",  "https://integrate.api.nvidia.com/v1")
MODEL = os.environ.get("NVIDIA_MODEL", "meta/llama-3.1-70b-instruct")

def available():
    return bool(os.environ.get("NVIDIA_API_KEY"))

def nvidia_chat(prompt, system=None, max_tokens=400, temperature=0.2):
    key = os.environ.get("NVIDIA_API_KEY")
    if not key:
        return None                      # not configured -> caller falls back to local Sovereign
    msgs = ([{"role": "system", "content": system}] if system else []) + [{"role": "user", "content": prompt}]
    body = json.dumps({"model": MODEL, "messages": msgs, "temperature": temperature,
                       "max_tokens": max_tokens, "stream": False}).encode()
    req = urllib.request.Request(f"{BASE}/chat/completions", data=body,
                                 headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"})
    try:
        r = json.loads(urllib.request.urlopen(req, timeout=90).read())
        return r["choices"][0]["message"]["content"].strip()
    except Exception as e:
        return f"[nvidia error: {type(e).__name__}]"   # never leak the key in errors

if __name__ == "__main__":
    if not available():
        print("NVIDIA_API_KEY not set. Set it in your shell (never in chat), then re-run:")
        print("  export NVIDIA_API_KEY=nvapi-...   # from build.nvidia.com")
        print(f"  model={MODEL}  base={BASE}")
    else:
        print(f"NVIDIA configured (model={MODEL}). Test call:")
        print(nvidia_chat("In one sentence, what is a signed sovereign AI decision?"))
