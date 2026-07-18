# OLM — Organic Learning Model · Spec v0.2
*Drafted 2026-06-07 by the MEOK ONE tab, per Nick's decision (INBOX). Until this spec is accepted, OLM is **"planned"**, not shipped (honesty rule). Canonical home for this doc once accepted: the `meok-ai` repo README.*

## One-line
**OLM is the learning layer that makes a MEOK character become *yours* — it learns from your real conversations, under the care membrane, and the weights stay on hardware you control.** ("The AI that learns you, becomes you, and stays yours forever.")

## What it is NOT (kills the hype)
- Not a new foundation model. OLM does **not** pretrain an LLM.
- Not cloud-harvested. Your data is **not** training a shared global model by default.
- Not magic consciousness. It's a concrete, inspectable loop: log → score → adapt → evaluate → roll back if worse.

## The cluster that already exists (this is why OLM is "planned", not "vapor")
| Piece | Repo | Role in OLM |
|---|---|---|
| Vision / product shell | `meok-ai` 🔒 | The promise + the user-facing "your AI" framing |
| Organic agent engine | `meok-agent-zero` 🔒 | Care-gated Agent Zero fork — the runtime that "grows & learns with you" |
| **Live learning loop (ICRL)** | **`meok/sovereign-temple/icrl_self_improvement.py`** (173 lines, BUILT) | In-context RL: care-ranked few-shot examples shape the next reply. NO retraining. The real "becomes you" mechanism today. |
| Heavier weight-training path | `meok-neural-learning` | FUTURE. Logs interactions → trains small NNs/adapters. NOT the live loop — don't conflate with ICRL. |
| Cognition substrate | `consciousness-engine-mcp`, `creativity-engine-mcp` | Reflection / dream / novelty signals that feed reward |
| Retrain harness | SOV3 neural retrain + `openmoe-bft` | Nightly retrain + BFT-gated "did it actually improve?" tournament |

OLM = **naming + wiring these five into one named product**, not building from scratch.

## How it learns (the loop, concretely)
1. **Log** — every MEOK ONE conversation turn is recorded with consent (SIGIL hash-chained, [[reference_sov3_state_layers]]), tagged by character + care signals.
2. **Score** — reward = care-membrane validity × engagement × novelty (consciousness/creativity engines supply the last two). Harmful/uncared turns get **negative** reward — the membrane is a hard gate, not a suggestion.
3. **Adapt — two tiers; the LIVE one is in-context, NOT weight-training (corrected from v0.1):**
   - **Tier 1 · ICRL (live, BUILT):** high-care responses become "learn from these" few-shot examples; low-care become "avoid these"; both injected into the system prompt. The model improves by seeing its own past successes/failures IN CONTEXT — instant, reversible, no GPU. `compute_care_reward()` is the Maternal Covenant as the reward. (`icrl_self_improvement.py`.)
   - **Tier 2 · nightly neural retrain (BUILT — SOV3, 6 NNs, rollback-disciplined):** slower consolidation of the buffer into the small NNs.
   - **Tier 3 · weight adapters (FUTURE — `meok-neural-learning`):** the heavier LoRA-scale path. Not today's mechanism.
4. **Evaluate** — `openmoe-bft` self-improvement tournament + SOV3 retrain gate: a new adapter ships only if a Byzantine-quorum of judges says it beat the incumbent. (Precedent: relationship_evolution_nn was **rolled back** when it regressed — [[sov3_retrain_log]]. That rollback discipline IS the product's credibility.)
5. **Persist where the user controls it** — adapters stored locally / on the user's chosen node (Mac sovereign, their VM, or device). "Stays yours."

## Where it lives
- **Engine:** `meok-neural-learning` (mechanism) + `meok-agent-zero` (runtime) + SOV3 retrain (harness).
- **Surface:** MEOK ONE `/os` — a character that visibly "remembers" and evolves (ties into the existing Tamagotchi hatch→sovereign stages: bond = accumulated learning).
- **Boundary:** OLM never crosses the care membrane (Maternal Covenant). No learning from harm; no covert persona drift.

## What's missing before "shipped" (corrected to the real architecture)
- [ ] **Milestone #1 (revised — now achievable):** wire the existing `ICRLBuffer` into the MEOK ONE chat path so each character accumulates a PER-USER, care-ranked example set that shapes its next replies. Engine exists (173 lines, live); the gap is the wire to `/os` chat + per-user persistence. *(NOT "train an adapter" — v0.1 had that wrong; ICRL is in-context.)*
- [ ] Care-reward sign verified end-to-end (a harmful turn actually scores < 0 and becomes an "avoid" example, not a "learn-from").
- [ ] Per-user buffer isolation — one child's ICRL set never leaks into another profile's context.
- [ ] User-visible "what your AI has learned" view + export/delete control ("stays yours" must be literally true — GDPR + the promise).

## Honest status line (use this externally)
> "OLM is MEOK's on-your-hardware learning layer — built from our neural-learning module, care-gated Agent Zero runtime, and a Byzantine-gated retrain loop. Today it's wired and in trials; the end-to-end personal-adapter loop is the next milestone."
