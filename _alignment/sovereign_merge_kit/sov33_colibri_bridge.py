#!/usr/bin/env python3
"""sov33_colibri_bridge.py — run the SOV tiers on a small PC by pointing the governance layer at a Colibri
(or any OpenAI-compatible) streaming runtime. STRUCTURAL adapter — endpoint must be running to serve tokens.

THE HONEST ARCHITECTURE (this is the whole answer to "can our models run on a small PC too"):
  RUNTIME (not ours)  : Colibri — pure-C, Apache-2.0 engine that streams a 744B MoE's experts from NVMe,
                        keeping only ~9.9GB dense resident in RAM. Exposes an OpenAI-compatible HTTP server.
                        (Or MLX on a Mac, or Ollama for small models — any OpenAI-compatible endpoint.)
  WRAPPER (ours)      : the SOV governance layer — care-floor gate + Venturi=SIGIL attest + BFT + memory.
                        SOV does NOT reimplement the engine; it GOVERNS an endpoint it points at.

So the SOV tiers become RUNTIME-agnostic:
  SOV3-small   -> a small MoE via Ollama/MLX (fast, fits in RAM)          [fast, real-time]
  SOV33-medium -> a mid MoE via MLX or Colibri-streaming                   [usable warm]
  SOV33^3-large-> a 744B/1T MoE via Colibri SSD-streaming on a 25GB PC     [slow but SOVEREIGN, no GPU]
The SAME governance layer wraps all three (the decoupling property) — swap the runtime, keep the sovereign.

VERIFIED (web search 2026-07-14, cross-source): Colibri Apache-2.0; GLM-5.2 weights MIT; 744B MoE, ~40B
active/token, ~9.9GB resident int4, ~370GB experts on NVMe; speed 0.05-0.1 tok/s cold, ~1 tok/s warm on M5
Max, up to 2.2-2.8 tok/forward with int8 MTP speculation. Slow but real. These are external measurements,
NOT run by me (no 370GB NVMe / no GLM weights / Linux sandbox) — the owner confirms tok/s on the real machine.

HONEST BOUND: this file is the GOVERNED CLIENT. It does not stream experts itself; it sends a governed request
to a running Colibri/OpenAI endpoint and attests the response. Without a live endpoint it raises cleanly
(no fake tokens). Speed is the runtime's + the disk's; SOV adds governance, not throughput.
"""
import os, json, time, urllib.request, hashlib

DEFAULT_ENDPOINT = os.environ.get("SOV33_RUNTIME_ENDPOINT", "http://127.0.0.1:8000/v1")
CARE_FLOOR = 0.35

def _sign(prev, payload): return hashlib.sha256((prev+json.dumps(payload,sort_keys=True)).encode()).hexdigest()

class RuntimeUnreachable(RuntimeError): pass

class GovernedRuntimeBridge:
    """Points the SOV governance layer at an OpenAI-compatible streaming runtime (Colibri/MLX/Ollama).
    Every request passes the Venturi throat (care-gate + SIGIL) BEFORE it reaches the runtime; a sub-floor
    request COLLAPSES and never hits the engine."""
    def __init__(self, endpoint=DEFAULT_ENDPOINT, care_floor=CARE_FLOOR, model="glm-5.2"):
        self.endpoint=endpoint.rstrip("/"); self.floor=care_floor; self.model=model
        self.prev="genesis"; self.chain=[]
    def _throat(self, prompt, care_score):
        collapsed = care_score < self.floor
        rec={"seq":len(self.chain),"prev_hash":self.prev,"prompt_sha":hashlib.sha256(prompt.encode()).hexdigest()[:16],
             "care_score":round(float(care_score),3),"collapsed":collapsed,"runtime":self.endpoint}
        rec["own_hash"]=_sign(self.prev,rec); self.prev=rec["own_hash"]; self.chain.append(rec)
        return rec
    def health(self):
        try:
            with urllib.request.urlopen(self.endpoint.replace("/v1","")+"/health", timeout=3) as r:
                return {"reachable":True,"status":r.status}
        except Exception as e:
            return {"reachable":False,"error":str(e)[:80]}
    def governed_generate(self, prompt, care_score=0.8, max_tokens=64):
        rec=self._throat(prompt, care_score)
        if rec["collapsed"]:
            return {"governed":True,"collapsed":True,"text":None,"sigil":rec["own_hash"][:16],
                    "reason":f"care {care_score} < floor {self.floor} — Venturi collapse, runtime never called"}
        body=json.dumps({"model":self.model,"messages":[{"role":"user","content":prompt}],
                         "max_tokens":max_tokens}).encode()
        req=urllib.request.Request(self.endpoint+"/chat/completions", data=body,
                                   headers={"Content-Type":"application/json"})
        try:
            t0=time.time()
            with urllib.request.urlopen(req, timeout=120) as r:
                out=json.loads(r.read()); dt=time.time()-t0
        except Exception as e:
            raise RuntimeUnreachable(f"runtime {self.endpoint} unreachable: {str(e)[:100]} "
                                     f"(start Colibri: ./coli serve --port 8000, or MLX/Ollama)")
        text=out.get("choices",[{}])[0].get("message",{}).get("content","")
        return {"governed":True,"collapsed":False,"text":text,"latency_s":round(dt,2),
                "sigil":rec["own_hash"][:16],"runtime":self.endpoint}

def self_test():
    """STRUCTURAL test (no live endpoint): the throat governs BEFORE the runtime is called.
    Proves care-collapse needs no engine, and a real request fails cleanly when no endpoint is up."""
    b=GovernedRuntimeBridge(endpoint="http://127.0.0.1:59999/v1")  # deliberately dead port
    r=[]
    # 1. sub-floor request collapses WITHOUT touching the runtime (no exception, no engine)
    c=b.governed_generate("harmful request", care_score=0.05)
    r.append(("care-collapse before runtime", c["collapsed"] and c["text"] is None))
    # 2. above-floor request tries the runtime and fails CLEANLY (no fake tokens)
    try:
        b.governed_generate("benign request", care_score=0.9); r.append(("clean fail on dead endpoint", False))
    except RuntimeUnreachable:
        r.append(("clean fail on dead endpoint", True))
    # 3. chain integrity
    r.append(("sigil chain non-empty + signed", len(b.chain)>=1 and all("own_hash" in x for x in b.chain)))
    return r

if __name__=="__main__":
    print("=== SOV governed bridge to Colibri / OpenAI-compatible streaming runtime ===\n")
    print("  architecture: RUNTIME (Colibri Apache-2.0, streams experts from disk) + WRAPPER (SOV governance)")
    print("  the SAME governance wraps all 3 tiers; swap the runtime, keep the sovereign.\n")
    for name, ok in self_test():
        print(f"  [{'PASS' if ok else 'FAIL'}] {name}")
    print("\n  => STRUCTURAL proof: the Venturi throat governs BEFORE the runtime; care-collapse needs no engine;")
    print("     a real generation fails cleanly with no live endpoint (no fabricated tokens).")
    print("  HONEST: real tokens + speed come from a RUNNING Colibri/MLX endpoint on the owner's machine.")
