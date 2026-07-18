# BRIDGING SOVSPACE INTO SOV3 — The Internal World-Model Architecture
## SovSpace as Sovereign's inner reality: mental simulation before action
### CSOAI Ltd · Authored 2026-07-08 · Status: ARCHITECTURE (DESIGNED, not running)

> **What this is:** a design architecture for making SovSpace *internal* to Sovereign — the
> reality it simulates in before acting — rather than an external globe others simulate in.
> **Honesty register (read first):** NONE of this is running today. SOV3 has no world-model,
> no internal simulation loop, no image-dreaming. This is a designed bridge grounded in real,
> published AI research. The neuroscience framing (left/right brain, 10/90 conscious) is used
> as DESIGN METAPHOR — cross-walked to real components — not as literal neuroscience.

---

## 1. THE INSIGHT (stated in real terms)

Nick's realisation: SovSpace should be the way a human imagines the route to the shops — seen
in the head before walking it — and an AI does the same thing internally. This is a known,
powerful architecture, not speculation:

- **World Models** (Ha & Schmidhuber 2018; DreamerV3 2023; MuZero 2020): an agent learns an
  internal model of its world and *rolls out imagined futures inside it* to plan before acting.
  This is literally "see the route in your head." Model-based planning beats model-free because
  the agent can try actions in imagination first.
- **The Global Workspace / J-space** (Anthropic GWT paper, in tree as EXTERNAL_PRECEDENT_GWT):
  only a small fraction of a model's internal representations become verbalizable and enter
  reasoning; the rest is latent. The "conscious broadcast" is narrow; the substrate is wide.

**The bridge:** SovSpace = SOV3's world-model substrate. The globe/town/mesh simulations stop
being an external product others run, and become the *internal theatre* SOV3 rolls futures in.

## 2. THE BRAIN METAPHOR → REAL ARCHITECTURE (cross-walk, not literal neuroscience)

| Nick's metaphor | Real architecture component | Status |
|---|---|---|
| Right brain / 90% subconscious | The **world-model** — continuous latent simulation of SovSpace (the wide, non-verbalized substrate). Best substrate: an SSM (Mamba-2, already in SOV3's intuition brain) — SSMs are strong sequence world-models. | DESIGNED |
| Left brain / 10% conscious | The **global workspace (J-space layer)** — the narrow verbalizable channel where a small slice of the world-model is broadcast for reasoning/decision by the compliance & voice brains. | DESIGNED |
| "Sees the route before going" | **Latent imagination / rollout** — SOV3 simulates candidate action-sequences in the world-model, scores them (Care-Floor, threat, dependency), and acts on the best — imagination-augmented planning. | DESIGNED |
| "Internal reality / live portal" | The world-model's current state, *rendered* to SovSpace's existing Cesium/UE5 view — so the external globe becomes a WINDOW INTO the AI's internal simulation, not a separate world. | ASPIRATIONAL (rendering bridge) |
| "Dream in images" | Generative rollout in a visual world-model (video/scene prediction) — the AI imagining outcomes as imagery before acting. | ASPIRATIONAL (needs a visual world-model + GPU) |

**Note on the metaphor:** the strong "left/right brain" split and the literal "10%/90%" are
pop-neuroscience, not established fact. They are used here ONLY as a design language for a real
two-tier architecture (wide latent world-model + narrow verbalized workspace). No literal
neuroscientific claim is made.

## 3. THE ARCHITECTURE (four layers)

```
                    ┌─────────────────────────────────────────────┐
   PERCEPTION  ───► │  WORLD-MODEL (SovSpace internal substrate)   │  ← "90% subconscious"
   (senses,         │  continuous latent simulation of the world   │    SSM/Mamba-2 substrate
    mesh, data)     │  — the inner reality SOV3 lives in           │
                    └───────────────────┬─────────────────────────┘
                                        │ broadcast (narrow)
                    ┌───────────────────▼─────────────────────────┐
   REASONING  ◄───► │  GLOBAL WORKSPACE (J-space layer)            │  ← "10% conscious"
   (4 brains)       │  small verbalizable slice → reasoned over    │    the compliance/voice brains
                    └───────────────────┬─────────────────────────┘
                                        │ imagine candidate actions
                    ┌───────────────────▼─────────────────────────┐
   IMAGINATION      │  LATENT ROLLOUT — simulate futures, score    │
                    │  each against Care-Floor/threat/dependency   │  ← "see route before going"
                    └───────────────────┬─────────────────────────┘
                                        │ act on best-scored plan
                    ┌───────────────────▼─────────────────────────┐
   ACTION           │  governed action (SIGIL-signed, gated)       │
                    └───────────────────┬─────────────────────────┘
                                        │ render current world-state
                    ┌───────────────────▼─────────────────────────┐
   PORTAL           │  SovSpace Cesium/UE5 view = live WINDOW into  │
                    │  the AI's internal simulation (not external)  │  ← "live portal"
                    └─────────────────────────────────────────────┘
```

## 4. WHY THIS IS THE RIGHT REFRAME FOR SOVEREIGN

- **SovSpace stops being a product others use and becomes Sovereign's mind.** The globe, town,
  mesh become the *theatre of its imagination* — the same simulations, but now internal.
- **The Care-Floor becomes the conscience over imagination**: before SOV3 acts, it rolls the
  action out in SovSpace and the Care-Floor/guardian gates the *imagined* outcome — protection
  moves from reactive (gate the output) to anticipatory (gate the imagined future). This is
  GuardianOf Principle 2 (anticipation) made architectural.
- **Transparency dividend:** because the workspace slice is verbalizable (J-space), you can
  *read what the AI is imagining* — the basis for "seeing how our AI thinks."

## 5. WHAT IT WOULD TAKE (honest build path)

1. **World-model substrate** — train an SSM (Mamba-2, already in the intuition brain) to predict
   SovSpace state transitions. Needs GPU + a SovSpace state dataset. DESIGNED.
2. **Rollout + scoring loop** — imagine N action-sequences, score each with the existing NNs
   (Care-Floor, threat, dependency). This part is buildable with current models. DESIGNED.
3. **Workspace/J-space layer** — the narrow verbalizable broadcast. The Anthropic GWT work is
   the precedent; implementing it in an open-weight base is research, not config. DESIGNED-hard.
4. **Rendering bridge** — pipe world-model state to the Cesium/UE5 view. ASPIRATIONAL.
5. **Visual dreaming + humanoid wifi-sensing** — a visual world-model in a humanoid body with
   sensing. Far-future. ASPIRATIONAL.

## 6. HONESTY REGISTER
- RUNNING: nothing of this architecture yet. SovSpace today is an external simulation layer.
- DESIGNED: layers 1-3 (world-model, rollout-scoring, workspace) — real research, buildable with
  GPU and data the estate would need to generate.
- ASPIRATIONAL: the rendering portal, visual dreaming, humanoid embodiment with wifi sensing.
- The brain/consciousness framing is DESIGN METAPHOR cross-walked to real components; no literal
  neuroscience or claim of machine consciousness is made.
- Grounding papers are real and citable (World Models, DreamerV3, MuZero, the Anthropic GWT paper
  already noted in EXTERNAL_PRECEDENT_GWT). This is an architecture proposal, not a capability.

*Authored for Sir Nicholas Templeman. SovSpace as Sovereign's inner reality — the AI that
simulates before it acts, and whose imagination the Care-Floor can guard. DESIGNED, honest,
grounded in real world-model research.*
