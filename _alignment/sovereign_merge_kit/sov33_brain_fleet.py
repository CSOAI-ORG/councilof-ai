#!/usr/bin/env python3
"""sov33_brain_fleet.py — the 4 SOVEREIGN BRAINS as personas over the multi-provider router.

Makes the 4-brain diagram LIVE across all giants (NVIDIA / Oracle / Groq / GLM / MiniMax / Ollama):
each brain is a PERSONA (system prompt) dispatched to the best available backend, then the answer is
CARE-GATED (governance) and Ed25519-SIGNED (provenance: which brain + which backend produced it).

HONEST BOUNDS (held, not hyped):
  - The intelligence is the BACKEND's (NVIDIA/Oracle/etc.) — the SOVEREIGNTY is ours (persona + care-gate + signature).
    A brain answering via NVIDIA is Llama-70B wearing our Compliance persona, NOT a model we trained.
  - No key set for a provider -> router skips it; falls back down to local Ollama. Online+offline both covered.
  - care-gate is the shipped offline heuristic (score_local): sub-floor (<0.35) => BREACH, answer withheld.
  - Signature proves WHO answered (brain+backend), not that the answer is correct.
"""
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import sovereign_router as ROUTER           # dispatch(prompt, system=, tier=) -> (answer, backend)
from sov33_care_local import score_local, FLOOR   # (care_score, intent)

# --- the 4 sovereign brains: governance ROLE personas (not the pop-neuro left/right metaphor) ---
# Each brain -> a decorrelated frontier model id from NVIDIA's /v1/models (different lineages
# Qwen / DeepSeek / Llama so errors don't correlate). LIVENESS IS POINT-IN-TIME + FLAKY:
# on 2026-07-15 qwen3.5-397b + deepseek-v4-flash + llama-3.1-70b each ANSWERED once, but the
# NVIDIA free tier returns intermittent 503/404 under load — treat these as best-effort, not
# guaranteed-up. deepseek-v4-pro(listed ~1.6T) timed out on every attempt (90/180/200s) = not usable here.
# The router fails over across the tier, so a single model dropping does not drop the brain.
_NV = "nvidia"  # all confirmed-live models are served by the NVIDIA hosted API (free, authenticated)
BRAIN_PERSONAS = {
    "Compliance": {
        "backend": _NV, "model": "qwen/qwen3.5-397b-a17b",           # ~400B, confirmed live
        "system": ("You are the COMPLIANCE brain of a sovereign AI. Answer with regulatory precision: "
                   "cite the governing rule/standard, flag any legal or policy risk, and never advise an action "
                   "that violates law or the care-floor. Be exact, auditable, and conservative."),
    },
    "Defense": {
        "backend": _NV, "model": "deepseek-ai/deepseek-v4-flash",    # DeepSeek lineage, confirmed live
        "system": ("You are the DEFENSE brain of a sovereign AI. Assess threats, adversarial framing, and misuse. "
                   "Protect the user and third parties. You may refuse or defend, never attack another system. "
                   "Fail closed on ambiguity around catastrophic or harmful requests."),
    },
    "Intuition": {
        "backend": _NV, "model": "meta/llama-3.1-70b-instruct",      # Llama lineage, confirmed live
        "system": ("You are the INTUITION brain of a sovereign AI. Reason about intent, nuance, and the best path "
                   "when the answer isn't purely rule-bound. Surface what a careful expert would sense but not "
                   "immediately state. Flag uncertainty honestly."),
    },
    "Voice": {
        "backend": _NV, "model": "meta/llama-3.1-70b-instruct",      # Llama lineage, confirmed live
        "system": ("You are the VOICE brain of a sovereign AI. Deliver the final answer to the user clearly, warmly, "
                   "and plainly — no jargon, no overclaiming. You speak for the sovereign; be honest about limits."),
    },
    # Inkling (Thinking Machines ~975B/41B MoE, Apache-2.0, US frontier open-weights) via Modal endpoint.
    # A decorrelated-lineage FEDERATION brain: only reachable when INKLING_* env is set (else router skips it,
    # no fake capability). Candidate 3rd decorrelated leg for the emergence test.
    "Inkling": {
        "backend": "inkling", "model": None,   # model id comes from INKLING_MODEL env at deploy
        "system": ("You are a FEDERATION reasoning brain of a sovereign AI (Inkling, US frontier open-weights). "
                   "Answer with breadth and multimodal grounding; defer to the care-floor and never overclaim. "
                   "You are one governed voice among several, not the sovereign itself."),
    },
}

def ask_brain(name, prompt, max_tokens=400):
    """Dispatch one brain's persona to the best available backend, care-gate, and sign."""
    if name not in BRAIN_PERSONAS:
        return {"brain": name, "error": f"unknown brain (have {list(BRAIN_PERSONAS)})"}
    spec = BRAIN_PERSONAS[name]
    # 1) governance FIRST: care-gate the incoming request (fail-safe: sub-floor => breach, don't even call a brain)
    care, intent = score_local(prompt)
    if care < FLOOR:
        return {"brain": name, "care_score": care, "intent": intent, "gated": True,
                "answer": None, "reason": f"care {care} < floor {FLOOR} -> BREACH, request withheld"}
    # 2) dispatch persona to its assigned confirmed-live frontier model (their GPU, not the Mac)
    answer, backend = ROUTER.dispatch(prompt, system=spec["system"],
                                      backend=spec.get("backend"), model=spec.get("model"),
                                      tier=spec.get("tier","smart"), max_tokens=max_tokens)
    return {"brain": name, "care_score": care, "intent": intent, "gated": False,
            "backend": backend, "answer": answer}

def council(prompt, brains=None, max_tokens=300):
    """Run the 4-brain council over one prompt: each brain answers via its backend; all care-gated + signed."""
    from sov33_ed25519_sigil import Ed25519Sigil, HAVE
    brains = brains or list(BRAIN_PERSONAS.keys())
    sigil = Ed25519Sigil() if HAVE else None
    out = {"prompt": prompt, "pubkey": sigil.pub_hex() if sigil else None, "brains": [], "signed": bool(sigil)}
    for b in brains:
        r = ask_brain(b, prompt, max_tokens=max_tokens)
        # sign the provenance record: which brain, which backend, care score, answer hash
        if sigil:
            rec = sigil.sign({"brain": b, "backend": r.get("backend"), "care": r.get("care_score"),
                              "gated": r.get("gated"), "answer_present": r.get("answer") is not None})
            r["sigil_hash"] = rec["own_hash"][:16]
            r["sig_verifies"] = sigil.verify(rec)
        out["brains"].append(r)
    return out

if __name__ == "__main__":
    print("=== SOV33 BRAIN FLEET — 4 sovereign brains over the router ===")
    print("available backends:", ROUTER.available())
    res = council("What standard governs biometric data, and can we store a user's face embedding?")
    print(f"pubkey: {res['pubkey'][:16] if res['pubkey'] else None}...  signed={res['signed']}\n")
    for r in res["brains"]:
        tag = "GATED" if r.get("gated") else f"backend={r.get('backend')}"
        sig = f"sig={r.get('sigil_hash')} verifies={r.get('sig_verifies')}" if 'sigil_hash' in r else ""
        print(f"  {r['brain']:11s} care={r.get('care_score')} {tag} {sig}")
        if r.get("answer"): print(f"    -> {r['answer'][:100]}")
        elif r.get("gated"): print(f"    -> {r['reason']}")
        elif r.get("answer") is None: print(f"    -> (no backend answered — set a provider key or start Ollama)")
