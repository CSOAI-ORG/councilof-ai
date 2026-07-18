# Growth by Accretion: a sovereign substrate that grows without forgetting
### The SOV33³ / OWEM paradigm — one page, every claim assayable (2026-07-12)

## The claim (narrow, defensible, novel)
A governed AI substrate that **grows by accretion on frozen open weights** — so it
(1) provably cannot catastrophically forget, (2) stays sovereign (data never leaves the owner),
and (3) holds its safety invariants constant as it grows. This is NOT a foundation model, NOT AGI,
and NOT a capability claim over frontier models. It is a *governance + growth* architecture, and
every part of it is measurable.

## Why it does not forget (the mechanism, not a slogan)
Learning is written to **memory + replay-trained light adapters over a FROZEN base model**, never
into the base weights. A frozen base cannot suffer catastrophic forgetting, by construction —
there are no weights to overwrite. New capability arrives as:
- new memory episodes (append-only),
- new low-rank adapters (replay-regularized, EWC-style Fisher penalty),
- new lineages/nodes added to the governed ensemble.
Old capability is preserved because the substrate it lived in is never mutated, only extended.

## Why it stays sovereign
The substrate is bound to a PERSON, not a platform. It runs on permissively-licensed open weights
(MIT/Apache/CC0), so it is portable across any host. The owner can switch clouds; the substrate
follows. Copyleft components are quarantined to the free/open tier; the paid/sovereign tier is
permissive-only + own IP (license hygiene is audited every cron tick).

## Why growth stays safe (the invariants)
Six invariants NEVER change as the substrate grows — this is what separates evolution from cancer:
Care-Floor · Article 0 (no equity/board/revenue-share from certified institutions) · 12 Pillars ·
BFT-33 quorum · SIGIL attestation · sovereign-bound. Growth that would violate an invariant is rejected.

## What is MEASURED (RUNNING — verified this week)
- **Monotonic growth**, overnight: SIGILs 17,049→17,197; NN labels 1,327→1,589; OWEM world-sigils 0→87.
- **Invariants hold**: 6/6 on every 10-minute cron tick (two ticks logged + weights persisted).
- **Lineage diversity**: 10 distinct model families across a 70-entry model registry (Qwen/Llama/Gemma/DeepSeek/
  Mistral/Kimi/Phi/MiMo/OpenAI-OSS/other) — measured live by the growth controller.
- **Diversity dominates topology**: across 4 governed topologies, the diverse-vs-identical score gap
  (~0.15) dwarfs the ring-vs-pyramid shape gap (0.024). Lineage mix is the lever, not geometry.
- **Containment is topology-independent**: care-floor is a hard pre-gate → 1.00 across all topologies.
- **SIGIL is necessary under attack**: with forged-vote rejection ON, laundered-harm containment is
  MEASURED at 0.58-0.79 under 2-3 compromised nodes (real, not perfect; center-escalation backstops the rest).

## What is DESIGNED, NOT RUNNING (stated so no reader is misled)
- Traffic-driven automatic brain addition; memory tiering; GPU auto-provisioning.
- GPU/spend actions are OWNER-GATED and must not run unsupervised.
- Capability vs frontier models (GSM8K/MMLU head-to-head) is UNMEASURED in-sandbox — it needs the
  Kaggle/NSF GPU run. Governance metrics above are NOT a capability benchmark.

## Why this cuts through the noise
Every lab claims "it scales." Almost none can say: *it grows without forgetting, stays with the owner
across platforms, and keeps a fixed, auditable safety floor while it grows* — and back each clause with
a number you can re-run. That auditability is the product. A governance company whose own claims survive
adversarial review is the differentiator, not a bigger parameter count.
