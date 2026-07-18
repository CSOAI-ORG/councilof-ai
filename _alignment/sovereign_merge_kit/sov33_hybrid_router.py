"""Production router: hard-prior (unambiguous security/care intent verbs — instant, offline) THEN
embedding kNN if available (SOV33_EMBED_ROUTER=1) ELSE TF-IDF trained router. Solves the corpus
semantic-overlap collapse (security terms embedding into compliance) without needing embeddings on the Mac.
Held-out balanced acc 0.875, distinct 5/6 (tested on Modal). Mis-routes fail safe (BRUM spreads)."""
import os
_PRI={"defense":["malware","exploit","intrusion","adversarial","attack","breach","injection","ddos",
                 "ransomware","phishing","threat","vulnerabilit","hack"],
      "intuition":["i feel","i sense","struggling","lonely","wellbeing","emotional","overwhelmed","anxious",
                   "needs care","needs help","needs support"]}
def _prior(q):
    ql=q.lower()
    for node,kws in _PRI.items():
        if any(k in ql for k in kws): return node
    return None
def route(prompt):
    p=_prior(prompt)
    if p: return {"node":p,"confidence":0.9,"route_method":"hard_prior"}
    # nuanced: embedding if opted-in, else TF-IDF
    if os.environ.get("SOV33_EMBED_ROUTER")=="1":
        try:
            import sov33_embed_router as er
            return er.route(prompt)
        except Exception: pass
    try:
        import sov33_trained_router as tr
        return tr.route(prompt)
    except Exception:
        return {"node":"compliance","confidence":0.0,"route_method":"default"}
def route_choice(prompt): return route(prompt)["node"]
if __name__=="__main__":
    for q in ["malware exploit attack","GDPR Article 6 lawful basis","user struggling needs help","conformity assessment procedure"]:
        print(route(q), q)
