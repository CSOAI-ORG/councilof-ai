#!/usr/bin/env python3
"""sov333_pyramid_route.py — the OWEM '3 (or 4) small around 1 large' architecture, made real & FREE.
NOT model-splitting (tensor/pipeline parallelism — that's for one huge model on a GPU cluster). This is
model-LEVEL routing: small specialist OWEM experts handle their domain locally; anything hard/general
ESCALATES to one large brain (Groq 70B via the router). Every decision is signed with WHICH tier answered.

  query -> domain match?  yes -> SMALL OWEM expert (local, fast, sovereign)
                          weak -> LARGE brain (70B, escalation)  -> sign(tier, backend)
"""
import os, sys, json, re, urllib.request
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sov33_ed25519_sigil import Ed25519Sigil
from sovereign_router import dispatch

OLLAMA="http://localhost:11434"
# the "3-around-1": small OWEM experts (their domain cue) + 1 large escalation brain
OWEM = {"compliance":"law regulation EU AI Act GDPR DORA audit governance policy",
        "defense":"security safety guardrail threat kill-switch intrusion protection",
        "voice":"identity who are you sovereign charter principle purpose"}
ESCALATE_THRESHOLD = 0.42     # below this domain-fit -> escalate to the large brain

def _emb():
    from sentence_transformers import SentenceTransformer
    return SentenceTransformer("all-MiniLM-L6-v2")

def small_expert(q, model="sovereign"):
    b=json.dumps({"model":model,"keep_alive":0,"stream":False,
                  "messages":[{"role":"user","content":"/no_think "+q}],"options":{"num_predict":120}}).encode()
    r=urllib.request.Request(f"{OLLAMA}/api/chat",data=b,headers={"Content-Type":"application/json"})
    try: return re.sub(r"<think>.*?</think>","",json.loads(urllib.request.urlopen(r,timeout=120).read())["message"]["content"],flags=re.S).strip()
    except Exception: return ""

def route(q, emb, D, sig):
    qe=emb.encode([q],normalize_embeddings=True)[0]; sims=D@qe
    i=int(sims.argmax()); dom=list(OWEM)[i]; fit=float(sims[i])
    if fit>=ESCALATE_THRESHOLD:
        ans, tier, backend = small_expert(q), f"SMALL:{dom}", "local-owem"
        if not ans: ans, tier, backend = dispatch(q, tier="smart", max_tokens=160)[0], "LARGE(fallback)", "router"
    else:
        ans, backend = dispatch(q, tier="smart", max_tokens=160)
        tier = "LARGE(escalated)"
    rec = sig.sign({"q":q, "tier":tier, "backend":backend, "domain_fit":round(fit,2), "answer":(ans or "")[:400]})
    return tier, backend, fit, ans, sig.verify(rec)

def main():
    emb=_emb(); D=np.asarray(emb.encode(list(OWEM.values()),normalize_embeddings=True)); sig=Ed25519Sigil()
    print("=== SOV333 PYRAMID ROUTE — 3 small OWEM experts around 1 large brain (signed) ===\n")
    qs=["What does GDPR Article 9 say about biometric data?",      # -> small compliance
        "Who do you serve, Sovereign?",                            # -> small voice
        "Explain the trade-offs between pipeline and tensor parallelism for serving a 1.5TB model."]  # hard -> escalate LARGE
    for q in qs:
        tier,backend,fit,ans,ok = route(q, emb, D, sig)
        print(f"Q: {q[:60]}\n  → {tier} (fit {fit:.2f}, backend={backend}, signed={ok})\n  {(ans or '')[:150]}\n")
    print("architecture: small OWEM experts (local/free) + 1 large brain (70B) — routed, escalated, signed. No cluster, no 1.5TB, no parallelism needed.")

if __name__=="__main__": main()
