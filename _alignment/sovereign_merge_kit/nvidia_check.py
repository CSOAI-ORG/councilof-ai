#!/usr/bin/env python3
"""nvidia_check.py — diagnose which NVIDIA models your key can actually reach. Reads NVIDIA_API_KEY from the
ENV (never hardcoded, never printed). Run:  export NVIDIA_API_KEY=nvapi-...  &&  python3 nvidia_check.py

It (1) lists the models your key is authorized for, (2) tests a spread from small->frontier, and (3) prints the
best model that ANSWERS — set that as NVIDIA_MODEL so sov333-frontier stops timing out.
"""
import os, json, time, urllib.request
BASE="https://integrate.api.nvidia.com/v1"
KEY=os.environ.get("NVIDIA_API_KEY")
if not KEY:
    raise SystemExit("Set NVIDIA_API_KEY in your shell first:  export NVIDIA_API_KEY=nvapi-...")
KEY=KEY.strip().strip('"').strip("'")
HDR={"Authorization":f"Bearer {KEY}","Content-Type":"application/json","User-Agent":"Mozilla/5.0 sov"}

def _get(path):
    return json.loads(urllib.request.urlopen(urllib.request.Request(BASE+path,headers=HDR),timeout=30).read())

def _chat(model):
    body=json.dumps({"model":model,"messages":[{"role":"user","content":"Reply with the single word: ok"}],
                     "max_tokens":5,"temperature":0}).encode()
    t=time.time()
    try:
        r=json.loads(urllib.request.urlopen(urllib.request.Request(BASE+"/chat/completions",data=body,headers=HDR),timeout=45).read())
        return True, round(time.time()-t,1), r["choices"][0]["message"]["content"].strip()[:20]
    except Exception as e:
        return False, round(time.time()-t,1), str(e)[:80]

print("=== 1) models your key is authorized for ===")
try:
    ids=[m["id"] for m in _get("/models").get("data",[])]
    print(f"  {len(ids)} models. Big ones:", [m for m in ids if any(s in m for s in ("405","70b","nemotron","qwen","deepseek","mixtral"))][:12])
except Exception as e:
    print("  /models failed — key likely invalid or revoked:", str(e)[:100]); raise SystemExit

print("\n=== 2) which ones ACTUALLY answer (small -> frontier) ===")
CANDIDATES=["meta/llama-3.1-8b-instruct","meta/llama-3.3-70b-instruct",
            "nvidia/llama-3.1-nemotron-70b-instruct","qwen/qwen2.5-72b-instruct",
            "meta/llama-3.1-405b-instruct","deepseek-ai/deepseek-r1"]
best=None
for m in CANDIDATES:
    ok,secs,msg=_chat(m)
    print(f"  [{'OK ' if ok else 'FAIL'}] {secs:>5}s  {m}  -> {msg}")
    if ok and best is None: best=m
print("\n=== 3) verdict ===")
if best:
    print(f"  ✅ KEY WORKS. Set this as the frontier model:\n     export NVIDIA_MODEL={best}")
    biggest=[m for m in ["meta/llama-3.1-405b-instruct","deepseek-ai/deepseek-r1"] if _chat(m)[0]]
    if biggest: print(f"  🚀 biggest that answered: {biggest[-1]}")
else:
    print("  ❌ Key authorized but no test model answered — likely rate/credit limited. Check build.nvidia.com credits.")
