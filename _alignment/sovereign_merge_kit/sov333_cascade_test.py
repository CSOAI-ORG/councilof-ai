#!/usr/bin/env python3
"""sov333_cascade_test.py — TEST the 90/10 small/large cascade: run mixed queries, measure what fraction the
small (local) tier handles vs what escalates to the large (70B) brain, and time each. Tunes toward a target
split (e.g. 90% small / 10% large) by adjusting the escalation threshold. This quantifies the cost/latency win.

Honest: 'left/right brain' = route analytical vs creative to two DIFFERENT large backends (needs 2 keyed) — with
one large (Groq) today it's one brain. This test measures the SMALL-vs-LARGE cascade, which is the real lever now.
"""
import os, sys, json, re, time, urllib.request
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sovereign_router import dispatch, available

def _emb():
    from sentence_transformers import SentenceTransformer
    return SentenceTransformer("all-MiniLM-L6-v2")
OWEM_CUES = ["law regulation GDPR DORA EU AI Act audit compliance policy",
             "security safety guardrail threat protection defense",
             "identity who are you sovereign purpose principle voice"]

def small(q):
    b=json.dumps({"model":"sovereign","keep_alive":0,"stream":False,
                  "messages":[{"role":"user","content":"/no_think "+q}],"options":{"num_predict":90}}).encode()
    r=urllib.request.Request("http://localhost:11434/api/chat",data=b,headers={"Content-Type":"application/json"})
    try: return re.sub(r"<think>.*?</think>","",json.loads(urllib.request.urlopen(r,timeout=90).read())["message"]["content"],flags=re.S).strip()
    except Exception: return ""

def run(queries, threshold):
    emb=_emb(); D=np.asarray(emb.encode(OWEM_CUES,normalize_embeddings=True))
    rows=[]
    for q in queries:
        fit=float((D@emb.encode([q],normalize_embeddings=True)[0]).max())
        t0=time.time()
        if fit>=threshold:
            a=small(q); tier="small"
            if not a: a=dispatch(q,tier="smart",max_tokens=120)[0]; tier="large(fallback)"
        else:
            a=dispatch(q,tier="smart",max_tokens=120)[0]; tier="large"
        rows.append((q,tier,round(fit,2),round(time.time()-t0,1)))
    return rows

def main():
    # mixed batch: identity/domain (should stay small) + facts/hard (should escalate)
    queries=[
        "Who do you serve?","What is your purpose?","Are you Nicholas?",                    # identity -> small
        "What does GDPR Article 9 require?","What is DORA?","What is NIS2?",                 # facts -> large
        "Explain tensor vs pipeline parallelism.","Summarise the EU AI Act GPAI duties.",    # hard -> large
        "What guardrails must a sovereign AI enforce?","Who is your founder?",               # mixed
    ]
    print(f"=== SOV333 CASCADE TEST · backends={available()} · {len(queries)} queries ===\n")
    for thr in (0.30, 0.45, 0.60):
        rows=run(queries, thr)
        n_small=sum(1 for _,t,_,_ in rows if t=="small"); n=len(rows)
        avg_small=np.mean([d for _,t,_,d in rows if t=="small"] or [0]); avg_large=np.mean([d for _,t,_,d in rows if t!="small"] or [0])
        print(f"threshold={thr}:  small {n_small}/{n} ({100*n_small//n}%)  large {n-n_small}/{n} ({100*(n-n_small)//n}%)  | latency small~{avg_small:.1f}s large~{avg_large:.1f}s")
    print("\n→ tune threshold to hit your target split (higher threshold = more escalation to large).")
    print("→ 90/10 = most queries served by the free local small tier, only the hard 10% pay the large-brain call.")

if __name__=="__main__": main()
