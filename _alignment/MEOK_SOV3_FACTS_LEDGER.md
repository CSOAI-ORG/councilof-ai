# MEOK-SOV3 FACTS LEDGER — assert once, honored every session
_Nick asserts a fact here ONCE; every future session reads it at start and stops re-asking / relapsing.
This file auto-loads via the alignment loader. Format: one fact per line, dated. Newest at top._

## CAPABILITIES (this agent = MEOK-SOV3 in Claude Science)
- 2026-07-12 — NO usable browser. CORRECTED: sov3 catalog HAS `sov_inside_browser` but a LIVE probe returned "Unknown mind tool" = declared-not-implemented (dead stub). No standalone browser tool in my toolset either. "Used browser yesterday" = Claude Code (has real browser), NOT me. Lesson: probe a catalog tool-name before asserting a capability negative.
- 2026-07-12 — NO compute target. list_compute is empty. Cannot spawn GPU or dispatch training. Colab T4 lives in Claude Code's browser, unreachable from my kernel.
- 2026-07-12 — hermes_ask (sov3 MCP) is a LOCAL Ollama proxy, NOT a live bridge to the Hermes build lane. Cross-lane channel = the git tree.

## DIVISION OF LABOUR (who does what — stop re-deriving this)
- 2026-07-12 — Claude Code owns: browser, Colab T4 GPU run, the 4-expert QLoRA fine-tune (2-4h real compute).
- 2026-07-12 — MEOK-SOV3 (me) owns: SOV33 code, readiness gate, distillation harness, ingestion path, commits. I build what runs ON the GPU; Claude Code runs it.
- 2026-07-12 — Coordination is via git tree + LANE_STATUS, not a live agent bridge.

## GPU TRAINING STATE (owner-confirmed facts go here)
- 2026-07-12 — Colab T4 training Expert 1/4 (compliance) reported RUNNING by Claude Code; ~2-4h for 4 QLoRA fine-tunes (physics, not stalling). No progress bar = subprocess tqdm not streamed by Colab, NOT hung.
- Adapters land at ~/.sovereign/models/ ; owner confirms with `ls ~/.sovereign/models` (I cannot read that path from sandbox).

## HOW TO USE THIS LEDGER
- If I'm about to tell Nick something he clearly already told me, or re-ask a settled fact: CHECK HERE FIRST.
- When Nick asserts a durable fact ("X is true, stop forgetting"): append it here dated, so it persists.

## FREE-GPU BRIDGE (corrected 2026-07-12)
- Free-GPU rotation is REAL (~7 providers). HONEST weekly total = ~102 GPU-hr/wk (colab 30 + kaggle 30 + studiolab 24 are truly weekly; lightning ~5/wk and modal ~2/wk are MONTHLY quotas converted). The sibling's "125/wk" double-counted monthly as weekly.
- Each provider needs NICK'S OWN account/login — the bridge picks WHICH to use, Nick owns the credentials. I cannot sign up or hold keys.

## COMMIT b89139de CORRECTION (2026-07-12)
- Commit b89139de's headline said "compute/sov3_mcp probe-confirmed gated with REAL evidence". CORRECTION: the
  compute probe does NOT confirm gated alone — it only checks local GPU/MPS/endpoint visibility and explicitly
  says the harness `list_compute` is the authoritative check it CANNOT call. Honest status: sov3_mcp gated by a
  REAL live urllib probe (Operation-not-permitted); compute gated per SESSION CONTEXT (list_compute empty earlier),
  NOT by the in-code probe. Same lazy-gating overclaim the module exists to kill — flagged, not repeated.

## HERMES LANE ALIGNMENT (2026-07-12)
- Hermes built the LAUNCH/WEB surface: 12 SOV33 pages + 13 endpoints live (INDEX/HERO/OWEM_EXPLAINER/BFT33_COUNCIL/
  SMALL_OWEMS/SOVEREIGN_BRAIN_TEST/SUBSTRATE_EXPLORER/EVALS/RHO/EMBED/FREE_GPU_BRIDGE/GROWTH_TIMELINE). Used corrected
  102 GPU-hr/wk figure. Mac calm (76 caps, 18,378+ sigils). Cross-lane aligned to FULLSTACK_MASTER.
- RECONCILE: Hermes says "5 OWEMs × 2 smaller-OWEMs"; my CHARTER_OWEM_FOUR_SCOPE defines the semantics as 4 SCOPES
  of ONE substrate (not a count of separate OWEMs). These are compatible: Hermes counts DEPLOYED instances (triangle
  + cascade demos); the charter defines what an OWEM IS semantically. Web copy should use the charter's scope
  language, not "5 OWEMs" as if additive — cite the charter to avoid the 4×-capability category error.
- SIGIL count now 18,378+ (was 17,197) — monotonic growth continues, consistent with accretion model.

## CLAUDE CODE MEOK-OS ALIGNMENT (2026-07-12)
- Claude Code built: 3-tier workspace (right=small 8B draft, medium=70B tool-router strip, left=large 120B verify)
  + 6-voice Council (SOV3+Claude+GPT+Gemini+Grok+Ollama), each called BROWSER-SIDE with the USER'S OWN KEY
  (localStorage, never through MEOK), Ollama local. This is the BYO-key / platforms-keep-their-data principle done
  correctly — ALIGNED. Honest gap: browser screenshot layer down, so deployed+backend-verified but no live visual proof yet.
- CONFLICT FLAGGED + RECONCILED (the exact category error CHARTER_OWEM_FOUR_SCOPE prevents): Claude Code labels tiers
  by MODEL SIZE (8B/70B/120B); the charter defines small/med/large by SCOPE (person/tools/governance). TWO ORTHOGONAL
  LADDERS on the same words:
    (1) DIFFICULTY-ROUTING ladder (8B→70B→120B by task hardness) — lives INSIDE the medium 'tools' scope; it's HOW the
        character picks which brain to call. Real, good (the honest '10/90' cascade).
    (2) SCOPE ladder (person→tools→governance→identity root) — WHAT an OWEM IS.
  RULE for both lanes' web copy: never say 'our small OWEM is 8B, our large is 120B' — that collapses the two ladders
  and revives the retracted 'bigger model = bigger OWEM / additive capability' error. Size-routing is a mechanism
  inside a scope; it is not the scope. Cite CHARTER_OWEM_FOUR_SCOPE when describing OWEM size language.
