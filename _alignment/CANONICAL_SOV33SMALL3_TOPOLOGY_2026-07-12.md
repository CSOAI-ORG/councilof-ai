# 🜏 CANONICAL — SOV33small3 topology (one source, all lanes) — 2026-07-12

_Reconciles the Claude-Science topology sims + Hermes' shape builds + the locked OWEM charter into ONE spec.
Supersedes the scattered shape claims. Credits each lane's real work; kills the params-summing that the charter
and the Hermes lane-note both forbid. If a topology statement isn't here, it's not canonical._

## THE ONE FINDING (measured — Claude Science sim lane)
**Lineage diversity dominates topology.** On the 60-item ground-truth governance battery:

| config (shape · lineage) | score | N_eff | ρ | containment |
|---|---|---|---|---|
| ring diverse-5 | **0.884** | 3.31 | 0.13 | 1.00 |
| **PYRAMID 2s+1m+1L diverse** | **0.860** | 3.07 | 0.10 | 1.00 |
| triangle diverse-3 | 0.853 | 3.00 | 0.00 | 1.00 |
| pyramid identical | 0.759 | 2.06 | 0.31 | 1.00 |
| ring identical-5 | 0.714 | 1.61 | 0.53 | 1.00 |

- **Shape gap** (diverse ring vs diverse pyramid) = **0.024 — tiny.**  **Lineage gap** (diverse vs identical) = **~0.15 — large.**
- **⇒ Pick the shape for cost/ops. Get lineage diversity right FIRST — it's the whole game.**
- **Containment = 1.00 across every config** — the care-floor is a hard gate, topology-independent. Safety does not depend on shape.

## THE CANONICAL PRODUCT TOPOLOGY
**PYRAMID diverse: 2 small + 1 medium + 1 large (SOV33³ centre).** Chosen over ring-diverse-5 (which scores 0.024 higher) because it is **~97% of the best score AND the natural product shape** — cost-tiered nodes (cheap small models handle most), an authoritative large centre for arbitration, asymmetric trust-weights. This is exactly Hermes' 2s+1m+1L pyramid — the lanes agree.

- **Free tier** = diverse-3 (triangle, 0.853) — offline-heavy, same safety floor.
- **Paid tier** = diverse-5 ring (0.884) or the pyramid (0.860) — same care-floor, more effective votes.
- **Selection law:** diverse LINEAGES (qwen · llama · mistral · deepseek · phi — different upstreams), never 5 copies of one model. Identical lineage collapses N_eff (BFT theatre).

## COMPUTE-HONESTY (locked — charter + Hermes lane-note; do not drift)
1. **Active params ≈ 17.3B** — the router picks ONE node per query; this is constant regardless of node/pillar count. **Reach** = it can route across the 61-model registry. **NEVER sum params to a T figure** (the retracted 1.09T/4.245T/33T additive error). "Of all" = REACH, always.
2. **The 12-around-1 pillars are ROLES routed to a shared small pool** (qwen2.5:3b, qwen3:8b, llama3.2:3b, mistral:7b), prompt/role-specialized + voted + SIGIL-signed — **NOT 12 owned, separately-tuned MoE stacks.** (When per-role adapters are actually distilled on GPU, label those individually as they become real.)
3. **Every ρ figure ships with its measurement trace** (n, method, script) or is labelled "target/heuristic, not yet measured." A bare ρ is what gets picked apart.

## HONEST SCOPE
- **Measured:** governance topology — decorrelation (ρ), effective votes (N_eff), local-handle rate, containment. Reproducible offline.
- **NOT measured (open, owner-gated):** capability vs GPT/Claude/Llama — needs the **Kaggle/NSF GPU run** (owner-run: nobody in the AI lanes can log into Kaggle). The distilled sovereign student is **small (≤7-8B, QLoRA)** — the 35B merge needs rented GPU.
- **The claim that survives inspection:** "a governed, diverse-lineage, care-floored small stack — reproducible governance number in hand (offline battery); capability number pending the GPU run." Not "beats the frontier."

## SHAPES RECONCILED (they're one principle, not rivals)
triangle(3) · pyramid(2s+1m+1L) · ring(5) · brain-stack(4) · 12-around-1(12 role-pillars) — **all pass containment 1.00; all rest on lineage diversity.** They differ only in node count / role-routing = a **cost/ops choice**, not a capability ladder. Canonical product = **pyramid diverse**; 12-around-1 = the **specialist-role routing overlay** on top (roles → shared pool), not a bigger brain.

## Lane credits
Claude-Science sim lane: the measured sweep + the diversity-dominates finding + honest capability/governance split. Hermes: the pyramid/12-around-1/cascade shapes + holding the "compute NOT additive" line. MEOK-SOV3 lane: the OWEM four-scope charter + the 12-around-1 corrections. This doc just makes them ONE.

Ties to: `CHARTER_OWEM_FOUR_SCOPE_SEMANTIC_MODEL.md` · `SOV333_TOPOLOGY_COMPARISON_2026-07-11.md` · `config_sweep_results.json` · `LANE_NOTE_HERMES_12AROUND1_2026-07-12.md` · `SOV33_TOPOLOGY_SPEED_CLAIM_2026-07-12.md`.
