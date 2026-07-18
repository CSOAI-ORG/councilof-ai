#!/usr/bin/env python3
"""
SOV33 COMPUTE ROUTER — one entry point to every working compute backend in the estate,
so any agent (or SOV33 itself) gets inference/training bandwidth without re-discovering it.

Backends, in speed/quality order (all VERIFIED working 2026-07-11):
  1. groq     — Groq llama-3.3-70b-versatile (FASTEST, free key)          (default, remote)
  2. oci70b   — OCI GenAI meta.llama-3.3-70b-instruct, signed via ~/.oci  (best sovereignty, remote)
  3. ollama   — local gemma4:e4b / qwen2.5:3b                             (private, on-device, free)
  4. mps      — local Apple M4 GPU via torch                             (training/probing, not chat)

Usage:
  from sov33_compute import infer, census
  infer("hello")                         # -> str (default groq→oci→ollama fallback)
  infer("hello", prefer="oci70b")        # force sovereign path
  census()                               # -> dict of what's live
CLI:
  python sov33_compute.py "your prompt"          # auto-routes
  python sov33_compute.py --census               # print live backends
"""
import os, sys, json, subprocess, urllib.request

def _load_keys():
    """Source inference keys from the sovereign-temple .env if not already in env."""
    if os.environ.get("GROQ_API_KEY"): return
    envf = os.path.expanduser("~/clawd/sovereign-temple/.env")
    if os.path.exists(envf):
        for line in open(envf):
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                k, _, v = line.partition("=")
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
_load_keys()

def _openai_compat(url, key, model, prompt, max_tokens, temp):
    body = json.dumps({"model": model, "messages": [{"role": "user", "content": prompt}],
                       "max_tokens": max_tokens, "temperature": temp}).encode()
    req = urllib.request.Request(url, data=body, method="POST",
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)["choices"][0]["message"]["content"].strip()

# Groq model ladder — ALL on the one existing key (verified 2026-07-11), no new backends:
GROQ_TIERS = {
    "fast":   "llama-3.3-70b-versatile",   # default — sub-second 70B
    "heavy":  "openai/gpt-oss-120b",       # 120B open-weight for hard problems
    "reason": "qwen/qwen3-32b",            # visible-reasoning (thinking) model
    "cheap":  "llama-3.1-8b-instant",      # tiny/fast for bulk
}

def _groq(prompt, max_tokens=512, temp=0.3, tier="fast", model=None):
    k = os.environ.get("GROQ_API_KEY")
    if not k: raise RuntimeError("no GROQ_API_KEY")
    mdl = model or GROQ_TIERS.get(tier, GROQ_TIERS["fast"])
    return _openai_compat("https://api.groq.com/openai/v1/chat/completions", k,
                          mdl, prompt, max_tokens, temp)

OCI_ENDPOINT = "https://inference.generativeai.uk-london-1.oci.oraclecloud.com"
OCI_MODEL = "meta.llama-3.3-70b-instruct"
OCI_PY = os.path.expanduser("~/clawd/_oci/venv/bin/python")

def _oci70b(prompt, max_tokens=512, temp=0.3, **_):
    """Call OCI GenAI 70B via the durable oci venv (isolated so its SDK deps don't leak)."""
    script = f'''
import oci,sys,json
cfg=oci.config.from_file(); ten=cfg["tenancy"]
from oci.generative_ai_inference import GenerativeAiInferenceClient
from oci.generative_ai_inference.models import ChatDetails,GenericChatRequest,Message,TextContent,OnDemandServingMode
c=GenerativeAiInferenceClient(cfg, service_endpoint={OCI_ENDPOINT!r})
req=GenericChatRequest(messages=[Message(role="USER",content=[TextContent(text=sys.stdin.read())])],max_tokens={max_tokens},temperature={temp})
det=ChatDetails(compartment_id=ten,serving_mode=OnDemandServingMode(model_id={OCI_MODEL!r}),chat_request=req)
print(c.chat(det).data.chat_response.choices[0].message.content[0].text)
'''
    p = subprocess.run([OCI_PY, "-c", script], input=prompt, capture_output=True, text=True, timeout=120)
    if p.returncode != 0:
        raise RuntimeError(p.stderr.strip()[:200])
    return p.stdout.strip()

def _ollama(prompt, model="qwen2.5:3b"):
    p = subprocess.run(["ollama", "run", model, prompt], capture_output=True, text=True, timeout=180)
    if p.returncode != 0:
        raise RuntimeError(p.stderr.strip()[:200])
    return p.stdout.strip()

def infer(prompt, prefer="groq", **kw):
    """Route a prompt to the best available backend, falling back gracefully."""
    chains = {
        "groq":   [_groq, _oci70b, _ollama],
        "oci70b": [_oci70b, _groq, _ollama],
        "ollama": [_ollama, _groq, _oci70b],
    }
    order = chains.get(prefer, chains["groq"])
    errs = []
    for fn in order:
        try:
            return fn(prompt, **({} if fn is _ollama else kw))
        except Exception as e:
            errs.append(f"{fn.__name__}: {e}")
    raise RuntimeError("all backends failed: " + " | ".join(errs))

def census():
    """Probe which backends are live right now."""
    out = {}
    # groq
    try:
        r = _groq("Reply with: ok", max_tokens=5)
        out["groq"] = {"live": True, "model": "llama-3.3-70b-versatile", "reply": r[:40]}
    except Exception as e:
        out["groq"] = {"live": False, "err": str(e)[:80]}
    # oci
    try:
        r = _oci70b("Reply with: ok", max_tokens=5)
        out["oci70b"] = {"live": True, "model": OCI_MODEL, "reply": r[:40]}
    except Exception as e:
        out["oci70b"] = {"live": False, "err": str(e)[:80]}
    # ollama
    try:
        m = subprocess.run(["ollama", "list"], capture_output=True, text=True, timeout=10).stdout
        models = [l.split()[0] for l in m.splitlines()[1:] if l.strip()]
        out["ollama"] = {"live": bool(models), "models": models}
    except Exception as e:
        out["ollama"] = {"live": False, "err": str(e)[:80]}
    # mps
    try:
        import torch
        out["mps"] = {"live": torch.backends.mps.is_available(), "torch": torch.__version__}
    except Exception as e:
        out["mps"] = {"live": False, "err": str(e)[:80]}
    return out

if __name__ == "__main__":
    if "--census" in sys.argv:
        print(json.dumps(census(), indent=2))
    elif len(sys.argv) > 1:
        print(infer(sys.argv[1]))
    else:
        print(__doc__)
