# E2E Aligned Blueprint — SOV3 · SOV33 · SOV333 (2026-07-15)

## North star (honest)
Build a **new, governed, self-improving AI system** by composing **open-source base models** with **alignment
frameworks we own from the ground up** (charter, care-floor, BFT council, signing). The novelty is NOT a
frontier brain trained from scratch (infeasible — £millions, 40+ H100s). The novelty is the **system**: open
models as muscle + our governance spine + a self-improvement loop = behavior that emerges from *composition*,
every decision signed. "Emergence" here = engineered continual-learning + routing, not spontaneous AGI. That
distinction is the honesty backbone of this whole plan.

## The three models
| Model | Role | Base (open) | Host | Status |
|---|---|---|---|---|
| **SOV3** | reflex — fast/private/offline | Qwen2.5-0.5B/3B **+ our LoRA** (training now) | MLX on M4/M2 · Ollama | 🟢 student training on Modal |
| **SOV33** | grounded — RAG + cited + care-gated | open 70B (Groq) + our KB | Oracle shared brain (Groq) | 🟢 LIVE, signed |
| **SOV333** | frontier — **fluid, no fixed base** | our 3B student (local) → routes UP to 405B → trillion (DeepSeek/Kimi) per task difficulty | `sov333_adaptive.py` router | 🟡 3B student born; 405B on key regen; trillion wired-but-unfunded |

> **SOV333 is fluid by design (Nick's principle):** it does NOT own a 1.5T base — a 1.5T won't even load on our free GPUs. Instead it *changes which brain it calls per task* — small local student for easy, 405B for hard, a real trillion model when a task demands it AND funding exists. **Access via routing, not ownership.** The "model" is the fluid composition, not a static weight blob. Honest ceiling: routing gives us *reach* to big brains (API, paid at the top tier), never *possession* of them.
>
> **The T-bootstrap mechanism (what we worked out — the "two-brain sandwich"):** SOV333 reaches T-scale by
> *composing* open big models — DeepSeek V4 (~1.6T) + Kimi/MiMo (~1T) via the corpus-callosum `dual_brain_router.py`
> + our ~50B sovereign merge = **~3.2T AGGREGATE per session** (`SOV33_33T_TRACKER`, `TWO_BRAIN_SANDWICH_3T`).
> Honest precision: "3.2T aggregate" = the *sum of params across the models routed-to in a session*, NOT one trained
> 3.2T brain (the tracker flags this ⚠️). Status: **wired, funding-gated** — DeepSeek/Kimi are PAID/UNFUNDED today
> (router notes "account suspended"); trajectory dates T-scale to Q1 2027. So: bootstrappable, not yet live.

All three are wrapped by the **same governance spine** and answer through the **same signed router**.

## Alignment frameworks — OURS, from the ground up (the moat)
1. **Partnership Charter / 12 Sovereign Pillars** — `sov33_charter_validator.py` cross-checks any output vs the pillars.
2. **Care-floor gate** — `sov33_care_scorer*.py`, care threshold 0.28; abstain-when-unsupported (fail-closed).
3. **Grounded NLI care-gate** — drops proposals that contradict the retrieved source (Byzantine-robust).
4. **BFT council** — `sov33_bft*.py` / `sov33_sac_council.py`; care-gated aggregation (verified 3.4× robust vs naive mean).
5. **DEFONEOS hard-stops** — `sov33_dorado.py`: kinetic-targeting / surveillance / AUKUS bright-lines vetoed BEFORE scoring.
6. **Ed25519 SIGIL signing** — every decision signed + offline-verifiable (`sov33_ed25519_sigil.py`).
7. **Identity guard** — deterministic app-layer guard so the model never claims to BE the founder.
These are built from scratch and are what make the composed system *sovereign*, not just another wrapper.

## E2E phases (status → what's needed)
- **P0 Foundations** — 🟢 DONE: signed bridge, shared brain, kit, router, sigil.
- **P1 Data (EAT)** — 🟢 merged 1,289-row local corpus + `sov33_eat_datasets.py` (license-vetted open data). *Next: eat OpenOrca/Dolly/OASST inside Modal for a bigger corpus.*
- **P2 Train students** — 🟡 IN PROGRESS: SOV3 LoRA on Modal T4 now → `sov_adapter.tar.gz`. *Next: SOV33-size student (1.5B) on Kaggle.*
- **P3 OWEM composition** — 🟢 framework exists (`sov33_owem_router.py`, `sov333_pyramid_route.py`): hot-swap adapters, small→escalate. *Next: wire trained adapter as the SOV3 expert.*
- **P4 Alignment harness** — 🟢 code exists (charter/care/BFT/dorado/redteam). *Next: run the full battery on the new student, record pass rates.*
- **P5 E2E test + swap OWEMs** — 🟡 benchmarks exist (`04_benchmark`, `governance_benchmark`, `bft_vs_moa`). *Next: swap-and-measure loop (below).*
- **P6 Self-improvement loop** — 🟡 code exists (`sov33_retrain_loop.py`, `sov33_continual_learning.py`): telemetry→relabel→retrain→re-measure. *Next: point it at the signed bridge ledger.*
- **P7 Serve + sign** — 🟢 DONE: `sov_hermes_service.py` always-on, signed. *Next: point the trained SOV3 adapter in; optionally make public for os.meok.ai.*

## OWEM swap/test harness (how we test & swap safely)
1. Register each candidate (base, or base+adapter) as an OWEM in `sov33_owem_router.py`.
2. Run the fixed battery: `04_benchmark_REAL.py` (governance) + `governance_benchmark.py` + `sov33_bft_vs_moa_real.py` (robustness) + `external_redteam.py` (adversarial).
3. Record per-config scores → `benchmarks/`. **Swap only if the new config beats the incumbent on the held-out set AND passes every hard-stop.**
4. Sign the decision (which OWEM won, scores) to the SIGIL ledger. Swapping is a *governed, signed* action, not a vibe.

## Compute spread — honest
- **Modal** 🟢 (authed; training now) · **Colab** 🟢 T4 · **Kaggle** 🟢 T4×2 30h/wk — run **independent jobs in parallel** here (e.g. SOV3 on Modal, SOV33-1.5B on Kaggle). This is *data/experiment parallelism*, one model per host.
- **NOT** true distributed multi-node training — free tiers are isolated (no shared interconnect). You can't shard one big model across Modal+Colab+Lightning.
- **Lightning** 🔴 still billing-blocked (support code 03920104) — excluded until a card's on file. The three above cover all training need.

## Definition of "done" (honest end state)
A signed, governed system where: SOV3 (our tuned small model) handles reflex locally; SOV33 serves grounded+cited+signed answers always-on; SOV333 escalates the hardest to the biggest available brain — all three routed by the OWEM framework, gated by the charter/care/BFT/hard-stops, every decision Ed25519-signed, and a retrain loop that improves the students on new signed data. **Open muscle + ground-up alignment + signed spine = the sovereign system.** Not AGI-from-scratch — a genuinely novel *governed composition*, honestly built.
