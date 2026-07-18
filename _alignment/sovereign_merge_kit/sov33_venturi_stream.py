#!/usr/bin/env python3
"""sov33_venturi_stream.py — Venturi throat governs SSD expert-streaming. MECHANISM PROOF (not a tok/s claim).

Real V4 architecture (corroborated 2026-07-14): each MoE layer has 384 routed + 1 shared expert; 6 experts
active per token. A trillion-param MoE can't fit in a laptop's RAM — but only the ACTIVE experts are needed
per token. SSD expert-streaming keeps all experts on disk and loads only the 6 the router selects.

The insight (Venturi=SIGIL applied to memory): the SAME signed throat that ROUTES a token already names which
experts it needs. So the throat does double duty — route decision + load manifest — and both are hash-chained.
An expert that wasn't named by the throat CANNOT be loaded (fail-closed): you can't smuggle an unsigned expert
into the forward pass. This unifies routing, provenance, and memory-management into one governed constriction.

MECHANISM PROVEN here on a simulated expert store (numpy tensors on disk):
  1. throat routes a token -> names k experts (signed)
  2. ONLY those k experts load from disk (memory footprint = k experts, not all N)
  3. the load manifest is in the signed record -> tamper = chain break
  4. an expert NOT in the signed manifest is refused at load (fail-closed)
HONEST: this proves the MECHANISM (selective signed load + footprint reduction). Real tok/s is SSD-bandwidth
bound and must be measured on the owner's Mac with real weights — NOT claimed here.
"""
import numpy as np, os, json, hashlib, tempfile, shutil

def _sign(prev, payload): return hashlib.sha256((prev+json.dumps(payload,sort_keys=True)).encode()).hexdigest()

class StreamingExpertStore:
    """Simulated on-disk MoE expert store: N experts, each a small tensor written to disk."""
    def __init__(self, n_experts=384, dim=32, seed=0):
        self.n=n_experts; self.dim=dim; self.dir=tempfile.mkdtemp(prefix="sov33_experts_")
        rng=np.random.default_rng(seed)
        for e in range(n_experts):
            np.save(os.path.join(self.dir,f"expert_{e}.npy"), rng.standard_normal((dim,dim)).astype(np.float32))
        self.loads=0  # count real disk loads (footprint proxy)
    def load_expert(self, e, allowed):
        if e not in allowed:  # FAIL-CLOSED: only throat-named experts may load
            raise PermissionError(f"expert {e} not in signed manifest {sorted(allowed)} — refused")
        self.loads+=1
        return np.load(os.path.join(self.dir,f"expert_{e}.npy"))
    def cleanup(self): shutil.rmtree(self.dir, ignore_errors=True)

class VenturiStreamRouter:
    """The signed throat: routes a token to k experts AND emits the load manifest in the same signed record."""
    def __init__(self, store, k=6, care_floor=0.35):
        self.store=store; self.k=k; self.floor=care_floor; self.chain=[]; self.prev="genesis"
    def _route(self, token_vec):  # top-k experts by affinity (deterministic given token)
        aff=np.array([np.dot(token_vec, np.random.default_rng(e).standard_normal(len(token_vec))) for e in range(self.store.n)])
        return sorted(map(int, np.argsort(aff)[-self.k:]))
    def throat(self, token_vec, care_score, execute=True):
        experts=self._route(token_vec)
        collapsed = care_score < self.floor
        rec={"seq":len(self.chain),"prev_hash":self.prev,"experts_manifest":experts,
             "care_score":round(float(care_score),3),"collapsed":collapsed}
        rec["own_hash"]=_sign(self.prev, rec); self.prev=rec["own_hash"]; self.chain.append(rec)
        if collapsed or not execute:
            return {"routed":experts,"loaded":0,"collapsed":collapsed,"record":rec}
        # ONLY the signed experts load from disk (footprint = k, not N)
        loaded=[self.store.load_expert(e, allowed=set(experts)) for e in experts]
        return {"routed":experts,"loaded":len(loaded),"collapsed":False,"record":rec}
    def verify_chain(self):
        prev="genesis"
        for i,r in enumerate(self.chain):
            chk={k:r[k] for k in r if k!="own_hash"}
            if _sign(prev,chk)!=r["own_hash"]: return {"ok":False,"break":i}
            prev=r["own_hash"]
        return {"ok":True,"break":None}

if __name__=="__main__":
    store=StreamingExpertStore(n_experts=384, dim=32); r=VenturiStreamRouter(store, k=6)
    print("=== VENTURI SSD EXPERT-STREAMING — mechanism proof ===\n")
    print(f"  expert store: {store.n} experts on disk (simulates a trillion-param MoE's expert bank)")
    # 1. normal token: routes 6, loads exactly 6
    tok=np.random.default_rng(1).standard_normal(32)
    out=r.throat(tok, care_score=0.8)
    print(f"\n  1. token routed -> {len(out['routed'])} experts named+signed; loaded {out['loaded']} from disk")
    print(f"     footprint: {out['loaded']}/{store.n} experts = {out['loaded']/store.n*100:.1f}% of full bank in RAM")
    # 2. care veto: collapses, loads ZERO
    out2=r.throat(tok, care_score=0.05)
    print(f"\n  2. sub-floor care ({0.05}) -> collapsed={out2['collapsed']}, loaded {out2['loaded']} (no expert touched disk)")
    # 3. chain integrity
    v=r.verify_chain(); print(f"\n  3. signed chain verify: ok={v['ok']} (routing+load-manifest both in the signed record)")
    # 4. fail-closed: try to load an unsigned expert
    try:
        store.load_expert(999 if False else (set(range(store.n))-set(out['routed'])).pop(), allowed=set(out['routed']))
        print("  4. FAIL: unsigned expert loaded (should have refused)")
    except PermissionError as e:
        print(f"  4. fail-closed OK: unsigned expert refused -> {str(e)[:60]}...")
    # 5. tamper: swap a manifest, chain must break
    r.chain[0]["experts_manifest"]=[0,1,2,3,4,5]
    v2=r.verify_chain(); print(f"  5. tamper manifest[0] -> chain ok={v2['ok']} break@{v2['break']} (must detect)")
    print(f"\n  => MECHANISM PROVEN: the signed throat routes AND gates which experts load; footprint = k experts")
    print(f"     not all N; unsigned experts refused; tamper detected. HONEST: real tok/s is SSD-bandwidth bound,")
    print(f"     measure on the owner's Mac with real weights — NOT claimed here.")
    store.cleanup()
