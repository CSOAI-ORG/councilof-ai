#!/usr/bin/env python3
"""sov4_cost_router.py — the cost-effective 3-around-1 allocator.
SOV4 routes each query to the CHEAPEST tier that can handle it, via difficulty.
Tier 1 (local/free) handles easy; tier 2 (mid) medium; tier 3 (flagship API) only hard.
Measures blended cost so 'cost-effective' is a NUMBER, not a claim."""
import os, sys, json
HERE=os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0,HERE)

# tiers: (name, where, $/M-tokens) — prices are TYPICAL-RANGE ESTIMATES (not live-fetched), flagged.
TIERS = {
 "local":    {"model":"Qwen3.6-35B (MLX/Mac)",      "usd_per_mtok":0.0,  "note":"free — your hardware"},
 "mid":      {"model":"DeepSeek-V4-Flash (158B)",    "usd_per_mtok":0.5,  "note":"cheap API / 1-GPU"},
 "flagship": {"model":"DeepSeek-V4-Pro/Kimi/GLM",    "usd_per_mtok":2.0,  "note":"API, hard only"},
}

def difficulty(prompt):
    """Real difficulty signal (reuse cascade router if present, else a keyword heuristic)."""
    try:
        import sov33_cascade_router as C
        return float(C.CascadeRouter().difficulty(prompt)) if hasattr(C,'CascadeRouter') else _heur(prompt)
    except Exception:
        return _heur(prompt)

def _heur(p):
    p=p.lower(); hard=("prove","derive","multi-step","reconcile","cross-reference","analyze the interaction","trade-off","step by step")
    med=("explain","compare","summarize","which article","assess","evaluate")
    if any(h in p for h in hard): return 0.85
    if any(m in p for m in med): return 0.5
    return 0.2

def route(prompt):
    d=difficulty(prompt)
    tier = "flagship" if d>=0.7 else ("mid" if d>=0.4 else "local")
    return tier, d

def run_batch(prompts, tokens_each=500):
    counts={t:0 for t in TIERS}; cost=0.0; rows=[]
    for p in prompts:
        t,d=route(p); counts[t]+=1
        c=TIERS[t]["usd_per_mtok"]*(tokens_each/1e6); cost+=c
        rows.append({"q":p[:38],"difficulty":round(d,2),"tier":t,"model":TIERS[t]["model"]})
    n=len(prompts); mtok=n*tokens_each/1e6
    blended = cost/mtok if mtok else 0
    return {"n":n,"tier_counts":counts,"total_usd":round(cost,4),
            "blended_usd_per_mtok":round(blended,3),
            "vs_all_flagship_usd":round(TIERS["flagship"]["usd_per_mtok"]*mtok,4),
            "savings_x": round(TIERS["flagship"]["usd_per_mtok"]/max(blended,0.001),1),
            "rows":rows}

if __name__=="__main__":
    batch=[
     "What is the EU AI Act?",                                    # easy->local
     "Summarize GDPR Article 9.",                                 # med->mid
     "Which article covers chatbot transparency?",                # med->mid
     "Prove step by step how Articles 9 and 10 interact for a high-risk system", # hard->flagship
     "Reconcile the transparency duties across Art.13 and Art.50 for a deployer", # hard->flagship
     "What year did the AI Act pass?",                            # easy->local
     "Explain conformity assessment.",                            # med->mid
     "List prohibited practices.",                                # easy->local
    ]
    r=run_batch(batch)
    print(json.dumps({k:v for k,v in r.items() if k!="rows"}, indent=2))
    print("\nrouting:")
    for row in r["rows"]: print(f"  d={row['difficulty']:.2f} [{row['tier']:8}] {row['q']}")
