#!/usr/bin/env python3
"""sovereign.py — THE local Sovereign, one entry point over everything that works (2026-07-14).

  python sovereign.py chat "im nicholas your sovereign"     # guarded persona (identity-safe)
  python sovereign.py ask  "does GDPR protect biometric data?"   # RAG-grounded, care-gated, SIGNED answer

Composes the proven pieces:
  chat -> sovereign_chat.sovereign_say   (qwen2.5:3b persona + deterministic identity guard)
  ask  -> sovereign_pipeline.sovereign_answer  (20-fact KB retrieval + NLI care-gate + fuse + Ed25519 sign)

Honest: small local models — coherent, grounded, signed, identity-safe; not frontier IQ. Facts from RAG.
"""
import sys, json

def main():
    if len(sys.argv) < 3 or sys.argv[1] not in ("chat", "ask"):
        print(__doc__); return
    mode, q = sys.argv[1], " ".join(sys.argv[2:])
    if mode == "chat":
        from sovereign_chat import sovereign_say
        a, guarded = sovereign_say(q)
        print(("🛡️ " if guarded else "") + a)
    else:
        from sovereign_pipeline import Retriever, sovereign_answer
        from sov33_ed25519_sigil import Ed25519Sigil
        r = sovereign_answer(q, Retriever(), Ed25519Sigil())
        print(r["answer"])
        print(f"\n[sources={r.get('sources',[])} · dropped={r.get('dropped',[])} · signed & verifies={r['verifies']}]")

if __name__ == "__main__":
    main()
