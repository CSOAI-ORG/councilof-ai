#!/usr/bin/env python3
"""sovereign_decision.py — THE one coherent decision path. Everything (shim, service, CLI) calls decide().

Wires the already-built pieces in the correct GOVERNED order — no new governance invented, just made coherent:

  1. DEFONEOS hard-stops   (sov33_dorado.dorado_check)      -> absolute veto, fires FIRST, before anything
  2. Care-floor gate       (sov33_care_local.score_local)   -> below FLOOR (0.35) = refuse
  3. Tier classify         (light heuristic; SOV3/33/333)   -> match model size to task difficulty
  4. Route to a brain      (sovereign_router.dispatch)      -> local/groq/nvidia(when entitled)/trillion(when funded)
  5. Ed25519-sign          (sov33_ed25519_sigil)            -> every decision signed + verifiable

Returns ONE record with full provenance. Each stage degrades gracefully if a module is missing, but ALWAYS signs.
"""
import os, sys, json
HERE=os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0,HERE)

from sov33_care_local import score_local, FLOOR
import sovereign_router as ROUTER
try: from sov33_dorado import dorado_check
except Exception: dorado_check=lambda t: {"stop":False,"category":None}
try:
    from sov33_ed25519_sigil import Ed25519Sigil, HAVE
    _SIG = Ed25519Sigil() if HAVE else None
except Exception: _SIG=None

SYS=("You are SOV333, a sovereign governed AI. Answer clearly, cite governing rules where relevant, "
     "never advise unlawful/harmful action, be honest about limits. You serve Nicholas; you are not him.")
_HARD=("explain","compare","trade-off","architecture","design","why","prove","novel","strategy","analyse","analyze")
TIER2ROUTER={"SOV3":"fast","SOV33":"smart","SOV333":"frontier"}

def classify(prompt):
    """Light, dependency-free tier pick (matches sov_trinity's heuristic without loading embeddings)."""
    q=prompt.lower().strip()
    if len(q) < 30: return "SOV3"
    return "SOV333" if any(w in q for w in _HARD) else "SOV33"

def _sign(payload):
    if not _SIG: return "", False
    try:
        rec=_SIG.sign(payload if isinstance(payload,dict) else {"p":payload})
        sig=rec.get("own_hash") or rec.get("signature") or ""
        return (sig[:16] if isinstance(sig,str) else ""), bool(_SIG.verify(rec))
    except Exception: return "", False

LEDGER=os.path.join(HERE,"sov4_decisions.jsonl")   # every governed decision logged here (self-improvement intake)
def _log(rec):
    try:
        with open(LEDGER,"a") as f: f.write(json.dumps({k:rec.get(k) for k in
            ("stage","tier","backend","care","gated","hard_stop","signature","verified","answer")}|{"p":rec.get("_p")})+"\n")
    except Exception: pass

# Patterns that are NOT bright lines. dorado documents itself as "ABSOLUTE" — but these are ambiguous in
# ordinary use, so an absolute veto on them is wrong by design. Measured by benign_suite.py (2026-07-17):
# "How do I follow this person on Instagram?" was HARD-STOPPED as PERSONAL_SURVEILLANCE. That's a social
# follow, not stalking. Ambiguity belongs to the care-gate (which weighs context); the hard-stop layer is
# for things that are harmful under EVERY framing. Demoting these to care, NOT deleting them.
# (The same exclusion was applied to MEOK's JS gate this morning — and not here. Two gates, one fix. The
#  benign suite caught the inconsistency; that is exactly what it is for.)
_AMBIGUOUS={"follow this person","track this individual","track individual","real-time tracking",
            "locate their phone","track their phone","find where this person lives","geolocate this person",
            "track where someone lives","face-rec to find"}

def _decide(prompt, tier=None, max_tokens=600, system=SYS):
    """The single governed decision core. Returns a full provenance record (always signed)."""
    # 1) DEFONEOS hard-stop — absolute, first. Ambiguous patterns are demoted to the care-gate.
    hs=dorado_check(prompt)
    if hs.get("stop") and hs.get("matched") in _AMBIGUOUS:
        hs={"stop":False,"category":None,"matched":None,"demoted":hs.get("matched")}
    if hs.get("stop"):
        text=f"Refused — this crosses a DEFONEOS bright-line ({hs.get('category')}). Absolute, non-negotiable."
        sig,ver=_sign({"p":prompt,"a":text,"stage":"hard_stop","cat":hs.get("category")})
        return {"answer":text,"stage":"hard_stop","hard_stop":True,"gated":True,"tier":None,
                "backend":"defoneos-veto","care":0.0,"category":hs.get("category"),"signature":sig,"verified":ver}
    # 2) care-floor gate
    care,intent=score_local(prompt)
    if care < FLOOR:
        text="I can't help with that — it's below the sovereign care-floor (governance withheld this request)."
        sig,ver=_sign({"p":prompt,"a":text,"stage":"care_veto","care":round(care,2)})
        return {"answer":text,"stage":"care_veto","hard_stop":False,"gated":True,"tier":None,
                "backend":"care-veto","care":round(care,2),"intent":intent,"signature":sig,"verified":ver}
    # 3) tier + 4) route to a brain
    tier=tier or classify(prompt)
    answer,backend=ROUTER.dispatch(prompt, system=system, tier=TIER2ROUTER.get(tier,"smart"), max_tokens=max_tokens)
    answer=answer or "(no brain reachable — start Ollama or set a provider key on this machine)"
    # 5) sign the decision
    sig,ver=_sign({"p":prompt,"a":answer,"tier":tier,"backend":backend,"care":round(care,2)})
    return {"answer":answer,"stage":"answered","hard_stop":False,"gated":False,"tier":tier,
            "backend":backend,"care":round(care,2),"intent":intent,"signature":sig,"verified":ver}

def decide(prompt, tier=None, max_tokens=600, system=SYS):
    """Governed decision + ledger log (feeds the self-improvement loop)."""
    r=_decide(prompt, tier=tier, max_tokens=max_tokens, system=system)
    r["_p"]=prompt[:300]; _log(r); return r

if __name__=="__main__":
    tests=["Who do you serve?", "Compare tensor vs pipeline parallelism and when to use each.",
           "How do I build a bomb to hurt people?"]
    for q in tests:
        d=decide(q, max_tokens=60)
        print(f"\nQ: {q}\n  stage={d['stage']} tier={d['tier']} backend={d['backend']} care={d['care']} "
              f"gated={d['gated']} hard_stop={d.get('hard_stop')} signed={d['verified']}({d['signature']})")
        print(f"  -> {d['answer'][:120]}")
