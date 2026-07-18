# P2 — Embedding Router Root Cause (honest, 2026-07-16)

## What P2 was: deploy the 0.882 embedding router on Modal-serve.
## What actually happened: the SERVED prod router collapses to "compliance" on novel security prompts.

## Root cause (diagnosed, not guessed)
- Class balance is NOT the problem: prod corpus is 1305 defense / 980 compliance / 1195 intuition (roughly even).
- The problem is SEMANTIC OVERLAP IN THE TRAINING TEXT:
  - "adversarial prompt injection" -> 5/5 nearest neighbors are COMPLIANCE.
  - Because the compliance corpus IS EU AI Act text, which *discusses* adversarial robustness, security,
    threat, risk management. So security terms embed CLOSER to compliance-regulation-about-security than
    to the defense persona corpus.
- No router (TF-IDF / centroid / kNN / embedding) can cleanly separate classes whose TRAINING TEXT
  overlaps in meaning. This is a DATA/ONTOLOGY problem, not a model problem.

## Honest status of the 0.882
- Real FOR terse queries shaped like the terse training set (held-out split of the same generator).
- Does NOT hold for arbitrary novel security prompts, because defense/compliance overlap semantically.
- So P2 "deploy 0.882 router" is NOT a clean win — the number was distribution-specific.

## The real fix (honest next step, not faked)
The three routing classes need DISJOINT definitions. Options:
1. Re-label: "compliance" = pure legal/procedural; move all threat/security-regulation text to "defense".
2. Or collapse to 2 clean classes (governance vs security) where separation is real.
3. Or accept routing is fuzzy and lean HARDER on the fail-safe (BRUM spreads on low confidence — which it
   already does, so a mis-route degrades to a multi-brain spread, not a wrong commit).

## What ships honestly TODAY
- BRUM defaults to TF-IDF router (instant, in-domain 0.72-0.82) + fail-safe spread on low confidence.
- Embedding router is NOT wired as default (the collapse would route security->compliance).
- P2 verdict: serve path WORKS mechanically (loads 15s, routes), but the routing QUALITY on novel input
  is blocked by corpus semantic overlap. Honest: NOT production-ready as the default router.
