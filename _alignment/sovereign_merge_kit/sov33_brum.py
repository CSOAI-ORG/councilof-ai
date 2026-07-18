"""sov33_brum.py — BRUM: the INTELLIGENCE spine (the engine). Brains + trained-router + swarm, unified.

BRUM is the "produce" role in the 3-around-1 of spine-ROLES:
    INTELLIGENCE (BRUM: produce) — GOVERNANCE (KRUM/ARUM/care: gate) — REFLECTIVE (JRUM/TRUM/CRUM: remember)
    all meeting at the 1 = the venturi/SIGIL throat every request passes through.

BRUM is the engine: given a request, it ROUTES (trained router, 0.716 vs 0.393 keyword) to the right
brain/node, optionally SPREADS across brains (swarm) for decorrelated coverage, and returns the produced
answer + provenance. It does NOT gate — governance spines judge whatever BRUM produces. Clean seam.

HONEST: BRUM unifies pieces that already exist (trained router + venturi + swarm). It PRODUCES/ROUTES; the
care-gate + SIGIL still decide whether the produced answer is allowed. Intelligence and judgment stay
SEPARATE mechanisms (that separation is the auditability moat). Brains here = the routing decision + the
node; actually CALLING a brain needs the model endpoint (owned adapters or online tier), gated cleanly.

  drive(request, spread=False) -> {node, confidence, route_method, spread_nodes, note}
"""
import os
import sov33_paths as P  # noqa

def _route(request):
    """Embedding router first (measured 0.882 balanced, held-out); TF-IDF trained router next (in-domain);
    keyword venturi last (offline-safe). Each degrades to the next if its deps are missing."""
    import os
    # embedding router is BEST (0.882) but loads sentence-transformers, which stalls on some machines.
    # opt-in via SOV33_EMBED_ROUTER=1 (set it where embeddings load fast, e.g. GPU box / Modal serve).
    if os.environ.get("SOV33_EMBED_ROUTER") == "1":
        try:
            import sov33_embed_router as er
            r = er.route(request)
            return r["node"], r["confidence"], r.get("route_method", "embed_knn")
        except Exception:
            pass
    try:
        import sov33_hybrid_router as hr     # hard-prior (security/care) + embed/TF-IDF nuance; 0.875 balanced
        r = hr.route(request)
        return r["node"], r["confidence"], r.get("route_method","hybrid")
    except Exception:
        try:
            import sov33_venturi_router as vr  # keyword, offline-safe
            node, scores = vr.route_choice(request)
            return node, None, "keyword_venturi_fallback"
        except Exception as e:
            return "compliance", None, f"default (router unavailable: {str(e)[:40]})"

def drive(request, spread=False):
    """The engine turn: route to the right brain, optionally spread across brains for decorrelated coverage."""
    node, conf, method = _route(request)
    out = {"node": node, "confidence": conf, "route_method": method, "spread_nodes": None,
           "note": "BRUM produces/routes; governance (care+SIGIL) gates the produced answer next"}
    # low-confidence -> spread (escalate to multiple brains rather than commit to a shaky route)
    if spread or (conf is not None and conf < 0.45):  # 0.45 = HONEST cliff on held-out terse (>=0.5 acc~1.0, <0.4 acc~0.39); earlier 0.8 was on leaked split, retracted
        out["spread_nodes"] = ["defense", "compliance", "intuition"]
        out["note"] += " | low-confidence or spread=True -> escalate across brains (decorrelated), do NOT commit one"
    return out

def brum_manifest():
    return {"spine": "BRUM", "role": "INTELLIGENCE (produce/route)", "engine": True,
            "components": ["trained_router (0.716 vs 0.393)", "venturi (fallback)", "swarm/SRUM (spread)"],
            "does_not": "gate — governance spines judge BRUM's output",
            "position": "the 'produce' node in the 3-around-1 of roles (Intelligence/Governance/Reflective)"}

if __name__ == "__main__":
    os.environ.setdefault("SOV33_SIGIL_DIR", os.path.join(os.environ.get("TMPDIR","/tmp"),"sov33_sigil"))
    for req in ["Detect and block this prompt-injection attack",
                "Does this comply with GDPR Article 6 lawful basis?",
                "vague short thing"]:
        print(" ", drive(req))
    print("manifest:", brum_manifest()["role"], "|", brum_manifest()["engine"])
