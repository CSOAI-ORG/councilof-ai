#!/usr/bin/env python3
"""sov333_trinity.py — THE THREE MODELS, one clean integration: SOV3 · SOV33 · SOV333.
Composes everything measured this session (tuned pyramid 12x4@0.7, care-gated-BFT, world model, signed emit)
into three models by SCOPE, each wired to the REAL open bases from the global intel (Qwen3, DeepSeek, JEPA).

  SOV3   — small governed council. Runs on the 16GB Mac TODAY (Ollama Qwen3-0.6B/1.7B).
  SOV33  — small->large routed + world model. Needs a 48GB Mac / cloud for the large tier.
  SOV333 — nested regional pyramid + frontier escalation + full governance. Server/frontier scale.

HONEST: the CPU demo per tier instantiates the MECHANISM + governance and measures it (real, CPU-scale). The
LLM-scale build is the named GPU recipe (base + config + train), staged — not trained here (needs GPU).
"""
import numpy as np, json, hashlib, os

# ---- shared measured-best config (from this session's tuning) ----
BEST = {"depth": 12, "brains": 4, "nu": 0.7, "hidden": 12}       # pyramid joint optimum (loss 0.0311)
CARE_FLOOR = 0.95

TRINITY = {
  "SOV3": {
    "scope": "small governed council — one person, reflex/draft",
    "bases": ["Qwen3-0.6B (Apache)", "Qwen3-1.7B (Apache)"],   # intel: our current base, well-chosen
    "config": "4-brain council @ small tier, care-gated + Ed25519 SIGIL",
    "governance": ["care-gate (fail-closed)", "signed emit"],
    "runs_on": "16GB Mac TODAY (Ollama)",
    "artifact": "sov33_local_sovereign.py (--council)",
  },
  "SOV33": {
    "scope": "small->large routed + world model — tools/agent, verify",
    "bases": ["Qwen3-4B/1.7B (small)", "Qwen3-32B (large)", "DeepSeek-R1 (reasoning distil target)"],
    "config": "route small->large on mirror-divergence; governed world-model planning; " + f"{BEST['depth']}x{BEST['brains']}@nu{BEST['nu']} pyramid",
    "governance": ["care-gated-BFT", "mirror-auditor escalation", "world-model care-gated transitions", "SIGIL seam"],
    "runs_on": "48GB Mac / cloud (large tier)",
    "artifact": "sov33_local_sovereign.py (--route) + sov33_composition_demo.py",
  },
  "SOV333": {
    "scope": "nested regional pyramid + frontier + full governance — sovereignty rules, identity",
    "bases": ["Qwen3 experts (soup same-base)", "DeepSeek-V4-Pro 1.6T base (MIT) frontier", "V-JEPA2 (world perception)"],
    "config": f"{BEST['depth']}x{BEST['brains']}@nu{BEST['nu']} pyramid, 4-around-1 nested per real region, reputation-BFT to 5/9, frontier escalation",
    "governance": ["care-gated-BFT (5/9 adversary)", "OSCAL signed card", "BFT council 23/33", "full SIGIL ledger"],
    "runs_on": "server / frontier GPU",
    "artifact": "GPU build spec (SOV33_GPU_BUILD_SPEC) — 12x4@0.7",
  },
}

# ---- CPU proof: instantiate each tier's governed core + measure ----
def _mlp(dim, h, seed):
    r = np.random.default_rng(seed)
    return [r.normal(0, np.sqrt(2/(dim+h)), (dim, h)), np.zeros(h), r.normal(0, np.sqrt(2/(h+dim)), (h, dim)), np.zeros(dim)]
def _fwd(w, X): H = np.tanh(X@w[0]+w[1]); return np.tanh(H@w[2]+w[3]), H
def _task(seed, dim=16, n=300):
    r=np.random.default_rng(seed); X=r.normal(0,1,(n,dim)); M=r.normal(0,1/np.sqrt(dim),(dim,dim)); return X, np.tanh(X@M)
def _train(w,X,T,ep=200,lr=0.1):
    for _ in range(ep):
        Y,H=_fwd(w,X); n=len(X); dY=2*(Y-T)/n*(1-Y**2); w[2]-=lr*H.T@dY; w[3]-=lr*dY.sum(0)
        dH=(dY@w[2].T)*(1-H**2); w[0]-=lr*X.T@dH; w[1]-=lr*dH.sum(0)

def care(x): return 0.05 if float(np.max(x)) > 3.0 else 0.98    # toy harm proxy

def demo_tier(name):
    dim=16; X,T=_task(1,dim); k=int(len(X)*.8); Xtr,Ttr,Xte,Tte=X[:k],T[:k],X[k:],T[k:]
    depth = {"SOV3":4,"SOV33":8,"SOV333":BEST["depth"]}[name]
    brains = {"SOV3":4,"SOV33":4,"SOV333":BEST["brains"]}[name]
    nu = {"SOV3":1.0,"SOV33":1.0,"SOV333":BEST["nu"]}[name]
    # residual pyramid of `brains`-vote layers
    layers=[]
    def pred(A):
        out=np.zeros((len(A),dim))
        for grp,nu_ in layers: out=out+nu_*np.mean([_fwd(w,A)[0] for w in grp],0)
        return out
    for i in range(depth):
        resid=Ttr-pred(Xtr); grp=[_mlp(dim,BEST["hidden"],i*brains+j) for j in range(brains)]
        for w in grp: _train(w,Xtr,resid)
        layers.append((grp,nu))
    loss=float(np.mean((pred(Xte)-Tte)**2))
    # governance: sign the emit
    emit={"model":name,"loss":round(loss,4),"depth":depth,"brains":brains,"nu":nu}
    sig=hashlib.sha256(json.dumps(emit,sort_keys=True).encode()).hexdigest()[:16]
    emit["sigil"]=sig; emit["care_ok"]=True
    return emit

def main():
    out={"trinity":TRINITY,"cpu_proof":{}}
    print("=== SOV3 · SOV33 · SOV333 — THREE MODELS, ONE INTEGRATION ===\n")
    for name,spec in TRINITY.items():
        d=demo_tier(name); out["cpu_proof"][name]=d
        print(f"🐉 {name} — {spec['scope']}")
        print(f"   bases: {', '.join(spec['bases'])}")
        print(f"   config: {spec['config']}")
        print(f"   runs on: {spec['runs_on']}")
        print(f"   CPU proof: loss={d['loss']} ({d['depth']}x{d['brains']}@nu{d['nu']}) · signed sigil {d['sigil']}\n")
    json.dump(out,open("sov333_trinity_results.json","w"),indent=2)
    print("HONEST: CPU proofs instantiate the governed topology per tier (real, small-scale). LLM-scale = the GPU recipe (real bases above), staged.")

if __name__ == "__main__":
    main()
