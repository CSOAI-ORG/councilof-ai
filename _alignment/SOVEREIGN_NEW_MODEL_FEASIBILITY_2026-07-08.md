# THE FORK — "Wrap open models" vs "Build a NEW model": honest feasibility
## Testing all setups + the question: is a genuinely-new Emergence model feasible?
### CSOAI Ltd · Authored 2026-07-08 · Grounded in the live model stack on disk

> Nick's instinct: don't just wrap open models — build an ACTUAL new model made of the brain-
> configs + old ideas, an "open emergence/intelligence model" with BFT + SIGIL baked in. This
> brief answers HONESTLY whether that's feasible, what it really means, and where the magic
> actually is. Honesty contract binds: RUNNING/DESIGNED/STUB, no overclaim.

---

## 1. WHAT YOU ACTUALLY HAVE (verified on disk this session)

The model stack is real and richer than most realise (`SOV3_OOWM_MODEL_STACK_2026-07-07.md`):
- **OOWM = a SANDWICH**, explicitly NOT a trained-from-scratch model: open base models wrapped in
  a sovereign signed substrate. `[OFFLINE] → SIGIL → [SOV3 MIDDLE] ← SIGIL ← [ONLINE]`.
- **8 model TYPES** already integrated: MoE (qwen3:30b-a3b), MoM (moondream+zamba/qwen-vl), SSM
  (Mamba-2 16-dim), reasoning (deepseek-r1:7b), TTS (Kokoro/Piper), embedding (BGE-M3), 7 trained
  governance NNs, cloud ensemble (GLM-5.2/Claude/Groq).
- **4 brain-configs around 1 OOWM** (`sov3_4_brains_1_oowm.py`): Compliance/Defense/Intuition/Voice.
- **12 mindsets × 8 MoE = 96 combinations** (the config space you want to test).
- **SIGIL** = Ed25519 hash-chained audit on every hop. **BFT** = 33-node council vote.

That is a genuinely novel *system* — the novelty is the SANDWICH + SIGIL + BFT + the brain-config
space, not the base weights.

## 2. THE FORK — two very different things called "new model"

### PATH A — "Build a new foundation model from scratch"
Train new transformer/SSM weights from raw data. **Honest verdict: NOT feasible for you, and not
wise.** It costs $10M-$100M+ in compute, a data-engineering team, months-to-years, and produces
something the open frontier (Qwen/GLM/Llama) already beats. You would spend everything to lose to
free. **Do not do this.** The base model is a commodity — the whole 2026 frontier confirms value
left the weights.

### PATH B — "A new model that is the COMPOSITION of your configs" ← THIS is your real instinct
NOT new weights — a new **architecture/orchestration model**: the 12 mindsets × the 8 MoE types ×
the 4 brain-configs, unified by SIGIL (communication) + BFT (consensus) + the Care-Floor
(governance), producing emergent behaviour no single base model has. **This IS feasible — because
it's mostly assembly of things you already have.** This is a real research contribution: a
*governed mixture-of-configurations* / "emergence engine."

## 3. IS THE "OPEN EMERGENCE MODEL" FEASIBLE? — yes, as PATH B, honestly scoped

What it really is: **an orchestration model where intelligence EMERGES from the routed ensemble of
your configs, not from any one base.** The pieces:
- **The substrate:** SIGIL for inter-config communication (already Ed25519 signed) — this is the
  "neurons talk" layer. FEASIBLE (exists).
- **The consensus:** BFT vote across configs for decisions — the "emergent agreement" layer.
  FEASIBLE (33-node council exists in design).
- **The composition:** route a task across the 96 mindset×MoE combinations + 4 brains, let the
  best-scored composite answer emerge, Care-Floor-gated. FEASIBLE to prototype (it's routing +
  scoring over models you have).
- **The world-model core:** Mamba-2 SSM holding long-context state = the "inner reality" (the
  SovSpace internal world-model). The one piece that would benefit from real training (Phase C).

**Honest naming:** call it an **Emergence Engine** or **Governed Mixture-of-Configurations**, NOT
"new AGI/ASI/foundation model." AGI/ASI are claims you cannot substantiate and that regulators +
investors will punish. "Emergence engine over a governed ensemble" is TRUE, novel, and defensible.

## 4. THE MAGIC (where it actually is — and it's real)

The genuinely novel, patentable, no-one-else-has-it thing is NOT a new base model. It's:
1. **SIGIL as the inter-model nervous system** — signed communication BETWEEN configs so the
   ensemble's reasoning is itself auditable. Nobody ships that.
2. **BFT consensus as emergence** — intelligence as the agreed output of many governed configs
   voting, not one model's guess. A different *shape* of intelligence.
3. **The Care-Floor over the whole ensemble** — governance as a first-class layer of the model,
   not a filter after it. Conscience baked into the architecture.
4. **The 96-combination config space** — a searchable space of "mindsets" you can tune per task.

That composition — signed, governed, consensus-emergent, config-searchable — IS a new model in the
architectural sense. It's your moat. And it's feasible because it's assembly + orchestration, not
$50M of pre-training.

## 5. THE TEST PLAN (quantify the bleeding edge — what you asked for)

To "quantify" and find the magic, the real experiment:
1. **Confirm the base models are pulled** (`ollama list` on M4 — HONESTY GATE, the same one from
   Phase C). You cannot test configs whose weights aren't present.
2. **Benchmark the config space:** run a fixed task battery across the 96 mindset×MoE combos + 4
   brains, score each (accuracy, Care-Floor pass, latency). Find which combinations actually
   outperform — quantify, don't assume the "1.00 Sovereign wins" claim (that's a DESIGNED number).
3. **Measure emergence:** does the BFT-voted composite beat the best single config? If yes, that's
   real emergence, quantified. If no, the ensemble is theatre — kill it honestly.
4. **SIGIL overhead:** measure the cost of signing every hop vs. the audit value. Is it worth it?

That test battery is the honest way to "play and find magic" — it turns the instinct into numbers.

## 6. HONEST VERDICT
- **New foundation model from scratch: NO.** Infeasible, unwise, loses to free.
- **New EMERGENCE model as composition of your configs: YES, feasible** — it's assembly +
  orchestration of real assets, and it's genuinely novel (SIGIL + BFT + Care-Floor + config-space).
- **Name it honestly:** Emergence Engine / Governed Mixture-of-Configurations. NOT AGI/ASI/EI3.
- **The magic is real and it's the SYSTEM, not the weights** — signed, governed, consensus-emergent
  intelligence. That's the patent, the moat, and the thing no lab ships.
- **First step is the honesty gate + the benchmark**, not a naming exercise. Quantify, then name.

## RECOMMENDATION
Pursue PATH B as a real research track (Workstream C+), scoped as the Emergence Engine. Run the
config-space benchmark to QUANTIFY which combinations produce emergence — that's the experiment
that finds the magic and produces the white paper + the patent. Do NOT pivot to "build a
foundation model"; do NOT claim AGI/ASI. The composition IS the new model, and it's yours.

*Authored for Sir Nicholas Templeman. The magic isn't new weights you can't afford — it's the
signed, governed, consensus-emergent SYSTEM you already have. Quantify it, name it honestly, own it.*
