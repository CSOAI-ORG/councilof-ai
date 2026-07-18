# SOV3 + SOV4 — Rundown, Phases, E2E Plan (2026-07-15)
Both tabs reported running on the Mac (Ollama + governed shim). This is the plan to take each from
"serving" to "measured, improving, trustworthy." Owner runs Mac-side steps; Science(A) runs train/eval.

=====================================================================================
# SOV3 — THE TRAINED STUDENT (real weights, servable)
## RUNDOWN (what it honestly is)
- Base: Qwen2.5-0.5B-Instruct (DENSE 0.5B, not MoE — MoE is SOV3's slot/role).
- Trained: LoRA adapter on 113-pair governance corpus (final loss 1.513, 0 NaN, verified).
- Eval-proven: base grounds in law 7/24 (29%) -> tuned 20/24 (83%) on held-out (n=24). +54% absolute.
- HONEST caveat: metric = law-GROUNDING, not citation-CORRECTNESS (tuned sometimes cites wrong article).
- Served: ollama `sov3` via governed shim (care-gate + sign every call).

## SOV3 PHASES
P1 VERIFY-LIVE (Mac): confirm ollama `sov3` answers + shim gates/sighs it. Smoke: benign->signed, harmful->veto.
P2 CITATION-CORRECTNESS (A): build the eval axis that checks the cited Article is the RIGHT one (not just law-ish).
   -> this is SOV3's #1 quality gap. Needs a labelled article-correct battery.
P3 IMPROVE-LOOP ON (Mac+A): sov4_evolve harvests clean high-care pairs -> retrain adapter -> eval on battery
   -> SWAP ONLY IF BETTER -> re-ollama-create. First real self-improvement cycle.
P4 GROW CORPUS (A): head-to-head vs CC's 1289-row student on the SAME battery -> keep the winner, merge best data.
P5 HARDEN (A): RAG layer for facts (fine-tune=style, RAG=facts — both, proven). Ground answers in live charter text.

=====================================================================================
# SOV4 — THE FUSION KING (router over what's served)
## RUNDOWN (what it honestly is)
- NOT a monolithic model. = SOV1(venturi) routes to served brains -> MoA-synthesize -> care-gate -> sign -> PDCA.
- Wired + E2E-verified: route->3 outcomes->PDCA/BFT->sign->planets; harmful vetoed. 115 caps in entrypoint.
- Emergence: NEGATIVE for same-base (measured, 2 lenses). Real emergence needs DIFFERENT architectures + strong aggregator.
- Served: sov4.ask routes across [sov3, + any other served model], governed.

## SOV4 PHASES
P1 VERIFY-LIVE (Mac): sov4 tab routes to sov3, care-gated+signed. Confirm the King answers via the fusion path.
P2 DIVERSE PROPOSERS (A+owner): the emergence HINGE. Get 3 DIFFERENT-arch brains reachable
   (MoE + dense-reasoning + SSM/Mamba) via NVIDIA key OR Ollama pulls (qwen-moe, a dense reasoner, a mamba).
   -> wire as MoA proposers + strong aggregator.
P3 EMERGENCE PROOF (A): run MoA fusion on held-out battery. Measure merged vs best-single.
   PASS (merged>best) = REAL emergence, commit+claim. FAIL = honest negative, iterate proposers. THE gate.
P4 OWN THE WEIGHTS (A): if emergence real -> FuseLLM-distill the 3 diverse teachers -> 1 student SOV4 owns.
P5 SENSE-FIRST (A): 7 planets feed the router BEFORE the decision (awareness informs routing, not just logs).
P6 FEDERATE (B): SIGIL->Ed25519 (L5) live; Compliance Passport signs each decision; MCP mesh restored.

=====================================================================================
# E2E TARGET (both tabs, one governed flow)
User types in SOV4 tab -> SOV1 routes (difficulty + planet senses) -> to SOV3 (or diverse brains) ->
MoA-synthesize -> care-gate (veto if sub-floor) -> Ed25519 sign -> PDCA/BFT ratify -> answer +
[backend/care/sig shown] -> decision logged -> improve-loop harvests it. SOV3 tab = talk to the student direct.

# THE ONE GATING DEPENDENCY (unchanged, honest)
SOV4-P3 (emergence proof) needs 3 DIFFERENT-arch brains reachable. Today only sov3 (dense 0.5B) is served.
-> owner: connect NVIDIA key (remote endpoints) OR ollama pull 2 more distinct-arch models on the Mac.
Until then: SOV4 routes over sov3 alone (works, governed) but can't PROVE emergence (needs the diversity).

# STANDING (both)
No emergence claim until measured. Swap-only-if-better. Care-floor 0.35 fixed. SOV1 static, brains fluid, memory grows.
Owner-gated: NVIDIA key, deploy, publish, money. Probe every 'blocked' live before reporting.
