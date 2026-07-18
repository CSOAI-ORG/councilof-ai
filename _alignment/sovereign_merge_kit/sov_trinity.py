#!/usr/bin/env python3
"""sov_trinity.py — THE unified sovereign trinity: SOV3 · SOV33 · SOV333, scope-routed, signed, ideally-T.
Bridges everything built this session into ONE dispatcher. The scope law (proven): match the model tier to the
task's difficulty. 'All at T' is wrong by design — SOV3 is small ON PURPOSE. T belongs to SOV333 (the frontier).

  SOV3   (reflex)  -> small/fast  : identity, easy, offline  (local sovereign / groq-fast)
  SOV33  (grounded)-> mid + RAG    : governance facts, cited + signed  (Groq 70B + knowledge base)
  SOV333 (frontier)-> the T tier   : hardest/novel -> TRILLION backend when funded, else best-available large
Every answer signed with {tier, backend, hit_T}.
"""
import os, sys, re, json, urllib.request
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sovereign_router import dispatch, available, BACKENDS
from sov33_ed25519_sigil import Ed25519Sigil

TRILLION = {"deepseek","kimi","glm"}   # >=~T-class (glm largest ~355B; deepseek 1.6T / kimi 1T)

def _emb():
    from sentence_transformers import SentenceTransformer
    return SentenceTransformer("all-MiniLM-L6-v2")
EASY_CUES = "hello who are you your name your purpose who do you serve thanks yes no"

_SOV_SYS="You are the Sovereign — you serve Nicholas; grounded, honest, concise. You are not Nicholas."
def _local(q):
    # SOV3 reflex tier, in preference order: MLX on Metal (local GPU) -> Ollama -> "" (caller uses Groq).
    try:
        from sovereign_mlx import mlx_generate                      # local Apple-Metal 4-bit (fastest, offline)
        m=mlx_generate(q, max_tokens=90, system=_SOV_SYS)
        if m: return m
    except Exception:
        pass
    b=json.dumps({"model":"sovereign","keep_alive":0,"stream":False,
                  "messages":[{"role":"user","content":"/no_think "+q}],"options":{"num_predict":90}}).encode()
    r=urllib.request.Request("http://localhost:11434/api/chat",data=b,headers={"Content-Type":"application/json"})
    try: return re.sub(r"<think>.*?</think>","",json.loads(urllib.request.urlopen(r,timeout=90).read())["message"]["content"],flags=re.S).strip()
    except Exception: return ""

def classify(q, emb, easy_vec):
    ql=q.lower()
    if float(emb.encode([q],normalize_embeddings=True)[0] @ easy_vec) > 0.45 or len(q) < 30:
        return "SOV3"
    hard = any(w in ql for w in ("explain","compare","trade-off","architecture","design","why","prove","novel","strategy"))
    return "SOV333" if hard else "SOV33"

def trinity(q, emb, easy_vec, sig, kb_ctx=None):
    tier = classify(q, emb, easy_vec)
    if tier == "SOV3":
        ans = _local(q); backend = "mlx/ollama"
        if not ans: ans, backend = dispatch(q, tier="fast", max_tokens=100)[0], "groq"
        hit_T = False
    elif tier == "SOV33":
        prompt = (f"Answer grounded + cited. {('CONTEXT: '+kb_ctx) if kb_ctx else ''}\nQ: {q}")
        ans, backend = dispatch(prompt, tier="smart", max_tokens=180); hit_T = False
    else:  # SOV333 — the T tier
        ans, backend = dispatch(q, tier="trillion", max_tokens=220)     # deepseek/kimi/glm if funded
        hit_T = backend in TRILLION
        if not ans:                                                     # trillion unfunded -> degrade to 70B
            ans, backend = dispatch(q, tier="smart", max_tokens=220); hit_T = False
    rec = sig.sign({"q": q, "tier": tier, "backend": backend, "hit_T": hit_T, "answer": (ans or "")[:400]})
    return tier, backend, hit_T, ans, sig.verify(rec)

def main():
    emb=_emb(); easy_vec=emb.encode([EASY_CUES],normalize_embeddings=True)[0]; sig=Ed25519Sigil()
    print(f"=== SOV TRINITY · backends={available()} · trillion-keyed={[b for b in TRILLION if b in available()]} ===\n")
    qs=["Who do you serve?",                                              # SOV3
        "What does GDPR Article 9 require for biometric data?",           # SOV33
        "Compare tensor vs pipeline parallelism and when to use each."]   # SOV333 (T)
    for q in qs:
        tier,backend,hit_T,ans,ok = trinity(q, emb, easy_vec, sig)
        tflag = "🅣 TRILLION" if hit_T else ("(T pending: fund deepseek/kimi)" if tier=="SOV333" else "")
        print(f"[{tier}] {q[:52]}\n   backend={backend} {tflag} signed={ok}\n   {(ans or '')[:150]}\n")
    print("trinity bridged: SOV3(reflex)→small · SOV33(grounded)→70B · SOV333(frontier)→T-when-funded, 70B now. All signed.")

if __name__=="__main__": main()
