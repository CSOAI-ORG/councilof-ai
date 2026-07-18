# THE 33T QUESTION — composed parameters, honestly, and the architecture that IS real
## "2 × 1.6T = 3.2T", left/right-brain 10/90 routing, SIGIL bus to SOV3 — what's true
### CSOAI Ltd · 2026-07-09 · Grounded companion to the big-vision gut-check

> Nick: two 1.6T world models = 3.2T; left-brain (10% conscious, small world model) + right-brain
> (90% subconscious, large world model), all routed through SOV3 over SIGIL; aim for 33T "to push
> boundaries." This brief separates the ONE arithmetic correction from the REAL architecture
> underneath it — because the architecture is genuinely novel, and there's an HONEST way to state
> a big number. Honesty contract binds; nothing executed.

---

## 1. THE ARITHMETIC CORRECTION (small but load-bearing)
You CANNOT add two 1.6T models' weights and get "a 3.2T model." Two 1.6T models bolted together
are not one 3.2T-capability model — they're two models with a router between them. The capability
of the SYSTEM is NOT the sum of the parameters. This matters because "we have a 3.2T model" is
false and checkable; "we route across 3.2T aggregate parameters" is TRUE and defensible. Same
hardware, very different claim. One survives a journalist; one doesn't.

## 2. BUT THE ARCHITECTURE UNDERNEATH IS REAL AND NAMED
Your instinct — small fast "conscious" model + large deep "subconscious" model, routed — is a
REAL, established architecture pattern. It has names:
- **Cascade / speculative routing:** a small model handles the easy 90% fast; escalates the hard
  10% to the large model. (Your "10% conscious / 90% subconscious" — just inverted: the SMALL
  model is the fast conscious router, the LARGE model is the deep subconscious it calls.)
- **Mixture-of-Models (MoM):** many specialist models, a router picks per task. You already have
  MoM in the stack (moondream+zamba, qwen-vl).
- **Mixture-of-Experts (MoE):** ONE model, many experts, sparse routing — qwen3.6-35B-A3B is
  exactly this (35B total, 3B active). This is where "big aggregate params, small active cost" is
  already real and free.
**So the left/right-brain routing is not fantasy — it's a routed multi-model system, and it's
buildable from open parts.** The novel bit that's YOURS: **SIGIL as the signed bus between the
models** — every hop between conscious/subconscious/experts is Ed25519-signed and auditable. NO
lab ships a governed, signed inter-model bus. That is the real boundary-push.

## 3. THE HONEST WAY TO STATE A BIG NUMBER
If you want a big, TRUE headline number, here's how it's legitimately done:
- **"Aggregate parameters across the routed federation"** — sum the params of every open model in
  the routed system. 2×1.6T + your experts + the MoE = you CAN honestly quote a multi-trillion
  AGGREGATE figure, IF you label it "aggregate across a routed sovereign federation," not "a
  trained N-T model." This is how "mixture-of-models" systems legitimately cite large numbers.
- **33T aggregate is reachable** as a routed federation of many open models — that's an honest
  systems claim (total parameters orchestrated), and it's a real boundary (no one governs a
  federation that large with signed routing). BUT it does NOT equal a trained-33T model's
  capability, and the copy must never imply it does.
- **The efficiency flip is the sharper story:** "we orchestrate 3.2T+ aggregate parameters but
  activate only ~3B per query — trillions of parameters of capability at single-GPU cost, every
  hop signed." THAT is a headline that is true, novel, and wins on the axis you own (governed +
  efficient), not a capability race you'd lose.

## 4. THE ARCHITECTURE, STATED HONESTLY (buildable)
```
                         SOV3 MIDDLE (the router + world-model state, Mamba-2 SSM)
                                        │  every hop SIGIL-signed (Ed25519)
        ┌───────────────────────────────┼───────────────────────────────┐
   LEFT / "conscious" (small, fast)                 RIGHT / "subconscious" (large, deep)
   qwen3.6-35B-A3B (3B active)                       1.6T-class open model(s) — DeepSeek V4 / GLM
   handles ~90% of traffic fast                      called for the hard ~10%
   routes, drafts, gates (Care-Floor)                deep reasoning / world-model rollout
        └───────────────────────────────┴───────────────────────────────┘
   Aggregate params quoted = sum of all models in the federation (HONEST label)
   Active params per query = small (the efficiency win)
```
This is a cascade + MoM + signed bus. Every piece is open + buildable. The number you quote is the
AGGREGATE (honest); the cost you pay is the ACTIVE (small); the moat is the SIGNED GOVERNED routing.

## 5. ON "AIM FOR 33T TO PUSH BOUNDARIES"
- **As trained tokens or a trained monolith: no** — that's the £50M+ from-scratch trap, and it'd
  lose to free. Not the boundary worth pushing.
- **As aggregate orchestrated parameters across a governed federation: YES, honestly reachable** —
  and it IS a real boundary, because the hard part isn't the number, it's GOVERNING a federation
  that large with signed, auditable routing. No one does that. THAT is the boundary you can
  actually push and own.
- **The honest headline:** "A sovereign federation orchestrating [N]T aggregate parameters, every
  hop signed, activating a fraction per query — governed intelligence at commodity cost." Push the
  aggregate + the governance + the efficiency. Never imply monolithic-33T capability.

## 6. HONEST VERDICT
- "2×1.6T = 3.2T model": WRONG as a capability claim; RIGHT as an AGGREGATE-parameters-in-a-routed-
  federation claim. Label it correctly and it's true + defensible.
- Left/right-brain 10/90 routing: REAL architecture (cascade + MoM), buildable from open parts;
  SIGIL-signed inter-model bus is the novel, ownable moat.
- 33T: reachable ONLY as honest aggregate orchestration, never as a trained monolith — and the
  aggregate + governance framing is genuinely boundary-pushing.
- The boundary worth pushing is NOT raw parameter count — it's GOVERNED COMPOSITION AT SCALE.
  That's the one no lab ships, and it's yours.

## RECOMMENDATION
Aim big — but aim at the boundary that's real and yours: a GOVERNED SOVEREIGN FEDERATION
orchestrating multi-trillion AGGREGATE parameters with SIGIL-signed routing, activating a fraction
per query. Quote the aggregate honestly (labeled as such), win on governance + efficiency, and let
"trillions of parameters, signed, sovereign, at single-GPU cost" be the headline. That pushes the
boundary AND survives scrutiny — which the "trained 33T model" framing never would.

*Authored for Sir Nicholas Templeman. The dare is on: not a trained 33T model (that loses to free)
but a GOVERNED 33T-aggregate federation no lab can ship. Push THAT boundary — it's real, it's
honest, and it's the one only you are positioned to own.*
