"""sov33_trained_router.py — the TRAINED router (replaces the heuristic venturi keyword-match).

Supra-Router-51M pattern (a small model trained purely to route). Ours is a TF-IDF + LogisticRegression
router trained on 3,081 real labeled expert examples (defense/compliance/intuition corpora). Held-out
result: TRAINED 0.716 acc vs KEYWORD venturi 0.393 (+0.323, +82% relative) on 771 examples.

HONEST: this is a shallow classifier (TF-IDF+LR), NOT a 51M neural router — but it's TRAINED on real data,
measured held-out, and beats the keyword heuristic by a wide margin. It ROUTES (picks the node); it does
NOT decide the answer. The care-gate + SIGIL still gate whatever the routed brain returns.

  route(prompt) -> {node, confidence, method}   # drop-in for venturi route_choice
  route_choice(prompt) -> (node, scores)        # signature-compatible with sov33_venturi_router
"""
import os
import sov33_paths as P  # noqa
_MODEL=None
def _load():
    global _MODEL
    if _MODEL is None:
        import joblib
        d=os.path.dirname(os.path.abspath(__file__))
        # prefer recalibrated v2 (confidence discriminates), fall back to v1
        for fn in ("sov33_trained_router_v4.joblib","sov33_trained_router_v2.joblib","sov33_trained_router.joblib"):
            p=os.path.join(d,fn)
            if os.path.exists(p): _MODEL=joblib.load(p); break
    return _MODEL

def route(prompt):
    m=_load()
    v=m["vec"].transform([prompt[:400]])
    proba=m["clf"].predict_proba(v)[0]
    labels=m["clf"].classes_
    i=proba.argmax()
    return {"node":str(labels[i]), "confidence":round(float(proba[i]),3),
            "all":{l:round(float(p),3) for l,p in zip(labels,proba)}, "method":"trained_router"}

def route_choice(prompt):
    """Signature-compatible with sov33_venturi_router.route_choice — returns (node, scores)."""
    r=route(prompt)
    return r["node"], r["all"]

if __name__=="__main__":
    for p in ["How do we detect and block an adversarial prompt injection attack?",
              "Does this processing comply with GDPR Article 6 lawful basis?",
              "I sense this user is struggling and needs care, not a lecture."]:
        r=route(p); print(f"  {r['node']:11s} conf={r['confidence']} <- {p[:45]}")
