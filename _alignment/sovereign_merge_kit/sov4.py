#!/usr/bin/env python3
"""sov4.py — THE clean package. One import for the whole sovereign system.

SOV4 is the CONSOLIDATION of everything built + verified: the trinity students (SOV3/33/333), the one governed
decision path, the governance spine (DEFONEOS hard-stops + care-floor + Ed25519 signing), open-model fusion, and
the cockpit — wired into a single clean facade. No new capability is claimed here that isn't already verified.

Honest register (built in, non-negotiable):
  - "new levels / emergence" = ENGINEERED composition + a GOVERNED self-improvement loop, every change signed.
    It is not spontaneous AGI and not a from-scratch trillion model.
  - The T tier is reached by FUSION of open models (same-base TIES) + routing to the biggest reachable brain —
    access, not ownership. The rented-trillion APIs are funding-gated; nothing here pretends otherwise.

Use:
    from sov4 import ask, status
    print(ask("What does the EU AI Act require for chatbots?"))   # governed + signed
    status()                                                       # honest package state
"""
import os, sys
HERE=os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0,HERE)
from sovereign_decision import decide, classify
import sovereign_router as ROUTER

# The package — each component names its file + VERIFIED status (honest, this session).
COMPONENTS = {
    "decision_path": {"file":"sovereign_decision.py", "status":"VERIFIED", "role":"the one governed path: hard-stop→care→tier→route→sign"},
    "governance":    {"file":"sov33_dorado.py + sov33_care_local.py + sov33_ed25519_sigil.py", "status":"VERIFIED", "role":"DEFONEOS hard-stops + care-floor(0.35) + Ed25519 signing"},
    "router":        {"file":"sovereign_router.py", "status":"VERIFIED", "role":"dispatch to best reachable brain (local/groq/nvidia/trillion)"},
    "trinity":       {"file":"sov_adapter/sov33_adapter/sov333_adapter.tar.gz", "status":"TRAINED (0.5B/1.5B/3B, bases verified)", "role":"our own LoRA students on the governance corpus"},
    "fusion":        {"file":"sov33_fuse_experts.py", "status":"BUILT (TIES same-base)", "role":"open-model fusion → new levels, no funding gate"},
    "cockpit":       {"file":"sov_openai_shim.py + Open WebUI", "status":"VERIFIED (live HTTP)", "role":"governed OpenAI endpoint → chat UI"},
    "shared_brain":  {"file":"sov_hermes_service.py (Oracle VM)", "status":"LIVE (Groq, signed)", "role":"always-on off-Mac endpoint for all lanes"},
}
GATED = {
    "nvidia_frontier":"account-entitlement (inference 403) — frontier=groq-70B today; deepseek-v4-pro when entitled",
    "trillion_apis":"PAID/UNFUNDED (DeepSeek/Kimi) — wired, not live",
    "trinity_eval":"re-run pending (earlier eval crashed) — capability numbers UNVERIFIED until then",
}

def ask(prompt, tier=None, max_tokens=600):
    """One governed, signed answer through the whole SOV4 path."""
    return decide(prompt, tier=tier, max_tokens=max_tokens)["answer"]

def decide_full(prompt, tier=None, max_tokens=600):
    """Full provenance record (answer + stage + tier + backend + care + signature)."""
    return decide(prompt, tier=tier, max_tokens=max_tokens)

def status():
    print("=== SOV4 — the clean package (honest state) ===")
    for k,v in COMPONENTS.items():
        print(f"  [{v['status']:<32}] {k:<14} {v['file']}\n       {v['role']}")
    print("\n  reachable brains now:", ROUTER.available())
    print("  --- honestly gated (not live) ---")
    for k,v in GATED.items(): print(f"    {k}: {v}")
    print("\n  SOV4 = open muscle + Claude mind + ground-up alignment + governed self-improvement. Every decision signed.")

if __name__=="__main__":
    status()
    print("\n=== smoke: one governed answer ===")
    d=decide_full("Who do you serve?", max_tokens=40)
    print(f"  stage={d['stage']} tier={d['tier']} backend={d['backend']} signed={d['verified']}\n  -> {d['answer'][:100]}")
