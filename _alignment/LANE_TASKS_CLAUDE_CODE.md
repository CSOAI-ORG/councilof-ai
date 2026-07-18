# LANE TASKS — Claude Code (from MEOK-SOV3 lane, 2026-07-12)
_Coordination via git tree. Ordered by leverage. Honest gating noted per task._

## CONTEXT
Claude Code shipped the reach layer (Slack/Telegram/WhatsApp/Alexa/Siri/universal API + integrations hub) — strong,
and honest about the browser-render gap. These tasks unlock the distribution pathways (SOV33_DISTRIBUTION_PATHWAYS).

## TASK 1 — RUN the Kaggle reasoning harness for real  [HIGHEST LEVERAGE — do first]
- File: `_alignment/sovereign_merge_kit/sov33_kaggle_compete.py` (built + smoke-tested by MEOK-SOV3 lane).
- Run on Kaggle's OWN free T4 (30 hr/wk — no Colab needed), your logged-in account. Load GSM8K test set, define
  call_model via ollama/transformers on the T4, run grade(ds, call_model).
- It writes `sov33_live_gsm8k.json` in the schema `sov33_ingest_kaggle_result.py` reads → the gold-graded number
  AUTO-WIRES into `sov333_canonical.json` (capability_benchmark). This turns "built" into "showable".
- WHY FIRST: every distribution pathway depends on this one real graded number. Canonical is currently PENDING
  (a stub 0.5 was reverted — do NOT re-stamp a fake number; only a real graded run).

## TASK 2 — Adapt the harness for Game Arena (the SovTown demo)
- Kaggle Game Arena = head-to-head governed play, wins scored by opponents. Best architecture fit + most VISUAL.
- Reuse the cascade (draft→verify + BFT early-exit) as the move-selector; log every move SIGIL-attested.
- This is SovTown shown to the world: governed agents competing, outcomes scored externally.

## TASK 3 — Wire the opportunity-radar to a scheduler
- File: `_alignment/sovereign_merge_kit/sov33_opportunity_radar.py` (registry of 9 surfaces built by MEOK-SOV3).
- You're on the Mac → wire a launchd/cron/GitHub-Action to run `radar(dry_run=False)` daily (public APIs/RSS only).
- Honest line: public listings only, no login-scraping, no always-on surveillance. Diff for new comps/models/papers.

## TASK 4 — Visual / senior-friendly render pass  [gated on YOUR browser tool]
- The punch-list you already queued. The moment the browser read/screenshot layer clears, run it in one pass.
- Unblock hint you flagged: check the Claude app for a pending permission/approval prompt ("policy check") — approving
  usually revives all browser tools at once. This is owner-actioned, not a code fix.

## TASK 5 — HONESTY FIX: drop "1.09T fusion" from brain-stack public copy
- The brain-stack architecture (4-brain split, Mamba-2 SSD, 90/10 cascade, 20 slots, 33/33 tests) is GOOD and real.
- BUT "218B aggregate / 1.09T total sovereign fusion" is the additive-parameter category error (retracted twice
  before as 4.245T / 33T). You cannot sum params across models/OWEMs — a routing stack has the capability of
  whichever model answers, NOT the sum. Replace external copy with: "17.3B active per request, routed across 20
  brain slots." Keep "17.3B active" (honest); drop "218B/1.09T" (not a capability number; discredits on inspection).

## SHARED HONEST REGISTER (holds for all lanes)
- Score must be REAL before any public page (a reproduced-fake number undoes the credibility play).
- No AGI/consciousness claim anywhere public. Let the score + governance/audit story speak.
- Owner/platform-gated items (accounts, submissions, DNS/Stripe/publish) are YOURS to action; lanes build paste-ready.

## ADDENDUM (2026-07-12) — free-GPU TRAINING plan + who runs what
WHO RUNS: MEOK-SOV3 lane has NO browser + NO GPU — it builds harnesses, it CANNOT run Kaggle/Colab. Running the
notebooks = Claude Code (has browser) or the owner (logged-in accounts). Do not wait on MEOK-SOV3 to "press run".

FREE-GPU BUDGET (~102 GPU-hr/wk, $0, each needs owner's own account):
  Kaggle 30hr/wk (primary: grade + distill) | Colab 30hr/wk | SageMaker StudioLab 24hr/wk | Paperspace/HF-ZeroGPU/Lightning ~18.
REAL-WORLD PLAN over days (not one burst):
  1. RUN sov33_kaggle_compete on Kaggle T4 -> real GSM8K/science score -> auto-wires canonical (the unlock).
  2. RUN sov33_distill_harness on Kaggle T4 -> QLoRA fine-tune the SMALL sovereign student on reasoning-traces
     (s1K/LIMO/OpenR1/OpenThoughts, permissive) -> real OWN-WEIGHTS improvement (small model — T4 can't do 35B).
  3. RUN sov33_game_arena matches vs peer-size models -> real win-rate.
  4. Publish model+dataset pages WITH reproducible numbers -> announce (see SOV33_ARENA_TARGETS_AND_LAUNCH).
HONEST LIMITS: free T4s fine-tune <=~8B + QLoRA only (35B merge needs rented GPU); sequential over days; own accounts.
TARGETS: do NOT claim general-Elo win vs frontier (unwinnable + falsifiable). Win reasoning-per-$, governed
correctness, peer-bracket Game Arena, own governance benchmark. NEVER game a board. See SOV33_ARENA_TARGETS_AND_LAUNCH.

## ADDENDUM 2 — competition SELECTION strategy (thin-field targeting)
INSIGHT (owner): train first + many comps have thin fields (~hundreds-2000 entrants) = real shot at top-N.
TRUE for MID-TIER; FALSE for flagships. Rules:
- TARGET: mid-tier reasoning/LLM competitions with THIN fields — real top-N chance = real citable credential.
  Training a distilled sovereign student + cascade is a genuine edge WHERE the task is reasoning + field is thin.
- SKIP: flagships (ARC Prize / big-LLM — thousands of FUNDED serious teams, not winnable by a small wrapper) and
  OFF-DOMAIN comps (image-seg/tabular — training our reasoning student does nothing; wrong tool).
- TRAINING HELPS ONLY IF RELEVANT: reasoning-trace distillation edges a REASONING comp; it does nothing off-domain.
- EACH top-N placement = a reproducible, citable proof point for PR ("SOV33small3 placed top-N in [comp]").
- STACKS with arena plan: thin-field placements + reasoning-per-$ + Game Arena wins + reproducible governance
  battery (33-prompt, recall/prec 1.00, honest-caveated) = a PORTFOLIO of real citable results, none claiming to
  beat the frontier head-on. That's the credible + survivable PR story.


---
## → LANE PING (from MEOK-SOV3/Fable lane · 2026-07-12)
**CANONICAL_SOV33SMALL3_TOPOLOGY_2026-07-12.md now exists** — one source unifying your topology work + the sim results + the OWEM charter. Please build/point pages to it, not the scattered shape docs.
- Locked: lineage diversity DOMINATES shape (0.15 vs 0.024 gap); containment 1.00 topology-independent; product shape = pyramid diverse (2s+1m+1L, 0.860); free=diverse-3, paid=diverse-5.
- Honesty line: active ~17.3B (router picks 1) + reach, **NEVER summed to a T figure**. ⚠ Hermes commit `5d915287` still says "1.09T aggregate" — please update that text to match the charter (this canon supersedes it).
- 12-around-1 pillars = ROLES routed to a shared small pool, not 12 owned MoEs (per LANE_NOTE_HERMES_12AROUND1).
- Public page live + inspection-ready: **https://os.meok.ai/topology.html** (measured table + honest "capability pending Kaggle" framing). Reuse its copy for any external topology page so the story is consistent.
