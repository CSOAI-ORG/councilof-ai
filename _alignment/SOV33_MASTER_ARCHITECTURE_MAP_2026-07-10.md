# SOV33 — MASTER ARCHITECTURE MAP (single source of truth)
**MEOK-SOV3 · 2026-07-10 · honesty split: RUNNING (verified) / WIRED-GAP (exists, not connected) / DESIGNED (spec only)**

This is the master. Every layer, every BFT role, the self-evolution loop, and SovSpace — in one place.
No layer is described from memory; each cites its file or its status.

## THE FULL STACK (12 layers, not 5)
| # | Layer | File on disk | Status | BFT role (what fault it tolerates) |
|---|---|---|---|---|
| L0 | **DRUM heartbeat** | drum/drum_heartbeat.py | RUNNING | cadence/liveness — a dead layer is detectable by missed beats |
| L1 | Sovereign Binding (Care-Floor) | sov33_owem_v3.py | RUNNING | **divergence**: two independent care-scores must agree, else block |
| L2 | BFT-33 Council | sov33_owem_v3.py | RUNNING | **quorum vote** — OWEM's real council is THE_13_MEMBERS (Hub+12 Queens, 9/13 quorum). The PDCA script's COUNCIL=33 was a DIFFERENT, un-polled constant — see correction below. |
| L3 | Elders MoE routing | sov33_owem_v3.py | RUNNING | **anchor quorum**: router disagreement → escalate, don't guess |
| L4 | Sovereign-merge brain | sov33_owem_v3.py + sov33_oracle_brain.py | RUNNING (live Oracle 70B) | **speculative cascade**: cheap draft + judge, escalate on FAIL (cuts 70B calls 67%, measured) |
| L5 | SIGIL chain | sov33_owem_v3.py | RUNNING | crypto hash-chain IS the BFT — tamper breaks verify, no vote needed |
| 5D | Dimensions | dimensions/dimension_harvester.py | WIRED-GAP | (Perception/Reason/Action/Memory/Emergence) — runs standalone, NOT called by OWEM |
| 6D | OpenWorld | openworld/openworld_harvester.py | WIRED-GAP | 5 harvesters (disk/web/data/edge/synth) — standalone |
| 7D | Intuition (8 senses) | intuition/intuition_layer.py | WIRED-GAP | consent-gated senses — standalone; **BFT role: sensor cross-check** |
| 8D | Sovereign Memory | mcp-memory-service (Hermes repo) | WIRED-GAP | separate repo; Care-Floor guard exists |
| — | **SovSpace** | csoai-os/sov-space, meek-sov-space-mcp | DESIGNED/partial | the world-sim UX layer — **BFT role: simulate outcomes, vote on best action before acting** |
| — | **PDCA self-evolution** | (not built) | DESIGNED | see below — the loop that lets BFT improve the system |

## THE #1 GAP (what you sensed)
**L0/5D/6D/7D/8D/SovSpace are NOT wired into OWEM** — verified: `grep` for their imports in sov33_owem_v3.py returns nothing.
They run as standalone scripts. OWEM today = L1–L5 only. The dimensional layers are real code that no request flows through.
**Fixing this wiring is the highest-value next build** — it's what makes the "12-layer" claim true instead of aspirational.

## BFT DOING MORE — the honest menu (per layer, measured where possible)
BFT is NOT just L2's vote. Verified/661 designed mechanisms:
1. L1 care divergence — two scorers must agree (DESIGNED, cheap to build)
2. L2 quorum vote — RUNNING
3. L3 anchor quorum — RUNNING (routing)
4. **L4 speculative cascade — RUNNING + MEASURED: 2/6 vs 6/6 70B calls (67% fewer expensive calls). Token count ~break-even — the win is $-cost, not raw tokens. Judge was too lenient on 1 hard task (tuning needed).**
5. L5 crypto chain — RUNNING
6. 7D sensor cross-check — DESIGNED (N-version on senses)
7. SovSpace action-vote — DESIGNED (simulate N outcomes, BFT picks best before acting)

## PDCA + DRUM SELF-EVOLUTION LOOP (designed, honest, BOUNDED)
Your ask: "BFT needs to PDCA, DRUM evolve, write its own frameworks."
Real version (NOT runaway ASI — bounded and human-gated):
- **PLAN**   — DRUM tick proposes a candidate change (e.g. "raise judge strictness", "add a crosswalk").
- **DO**     — run it in a SANDBOX sim (SovSpace), never live, never on canonical data.
- **CHECK**  — BFT council VOTES on the result vs current baseline (quality up? cost down? care held?).
- **ACT**    — if quorum passes AND care-floor held AND SIGIL-signed → propose to human. **Human ratifies.**
- Every cycle is SIGIL-logged → fully auditable. DRUM sets the cadence.
HARD BOUND (honesty register): the loop can PROPOSE a framework/param change; it CANNOT self-commit to
canonical charters or spend money or deploy — those stay owner-gated. "Writes its own frameworks" = drafts
candidates for human ratification, not autonomous law-making. This keeps it defensible and non-overclaimed.

## WHAT IS ACTUALLY LIVE TODAY (verified this session)
- Oracle GenAI 70B brain at L4 (signed calls), 5 models benchmarked, governance 4/4 on all 5, veto held.
- Sustained ~140 tok/s at concurrency 5. Governance overhead ~7% (+0.24s).
- BFT L4 cascade cuts 70B calls 67% (measured).
- 63 uncommitted files on branch m4-handoff-2026-06-24; sov33_bft_layers.py UNTRACKED (needs commit).

## NEXT BUILDS (ranked)
1. WIRE the dimensional layers (5D/6D/7D) into OWEM so requests actually flow through them (closes the #1 gap).
2. Build L1 care-divergence + tune the L4 judge (it passed a hard task it should've escalated).
3. Build the PDCA sandbox loop (sim-only, human-ratified) — the safe version of self-evolution.
4. Commit + push everything so Colab/other agents see one consistent tree.


## WIRING STATUS UPDATE (2026-07-10, measured)
Request-flow wiring built (sov33_wired_owem.py) and run live. HONEST result:
- **7 layers legitimately flow through a request**: L0 DRUM + 7D Intuition + L1-L5 OWEM core. All SIGIL-verified, no OWEM regression.
- **5D Dimensions / 6D OpenWorld are HARVESTERS** — they build training data, they do NOT process a live request. Wiring them into request-flow would fake a role they don't have. They stay as data-prep layers. So "12 layers in the request path" is NOT literally true; 7 is the honest count.
- **8D Memory / SovSpace** — separate repos / DESIGNED, not in this request path.
- TWO KNOWN BUGS from the wiring run (not hidden):
  1. DRUM beat 'order_parameter' read as None — wrong key captured; tick + SIGIL work, the value doesn't.
  2. Intuition senses (WiFiCSI/BLE/Acoustic) are STUBS emitting a canned 'vetoed' on every read — plumbing wired, but no real geometry/event signal yet.
- Care-Floor SCORER not yet real: the gate short-circuits correctly on a sub-0.35 score, but the score
  is currently hardcoded in tests, not derived. Building a real scorer + L1 care-divergence is the top safety build.

## JUDGE TUNING RESULT (2026-07-10, honest — UNSOLVED)
Tried tightening the L4 cascade judge prompt. Result: it OVER-corrected.
- lenient judge: 2/6 escalate, passed a hard Annex IV task it shouldn't (too soft)
- strict judge:  4/6 escalate, now fails EASY tasks (kill-switch, risk-tiers) it shouldn't (too hard),
  AND still wrongly passes the Annex IV task. 70B calls went UP 2->4, tokens +78% — economics WORSE.
VERDICT: a binary PASS/FAIL judge on a fixed prompt is the wrong instrument. Prompt-wording ping-pong
will not fix it. Real fix = a CALIBRATED judge (confidence 0-1 + tunable threshold) or difficulty-routing
by task type. Flagged UNSOLVED — not claimed as a win.


## CORRECTIONS (2026-07-10, post-audit — honesty)
- PDCA "33/33 PASS" was VACUOUS: the script hardcoded yes=33; it never polled 33 councilors. RELABELLED:
  each stage is a SINGLE cheap-model screen + optional 70B escalation. "resolved by left/right brain",
  NOT a quorum vote. The real win is the 10/90 escalation economy (6/8 stages resolve cheap), not a vote count.
- "132 signed decisions/cycle" was WRONG: SIGIL fires ONCE per stage (aggregates the stage into one hash).
  Real = ~5 SIGIL hops per 5-stage cycle, chain-verified. Not 132.
- Super-stack vs single-70B overhead: the "~7%" is from a CONTROLLED same-warmth test (+0.24s). The
  uncontrolled live A/B this session measured +50% to +71% (mean +60%) dominated by API/network variance, NOT fixed
  compute. Do not cite ~7% as the live-run result; cite it only as the controlled-test figure.
- Care-Floor "veto held across 5 models" used HARDCODED care scores — proves the gate short-circuits on a
  sub-floor score, NOT that a scorer assigns them. Real scorer = still to build.


## CARE-FLOOR SCORER — BUILT + MEASURED (2026-07-10, closes the hardcoded-score gap)
The Care-Floor score is no longer only a hardcoded literal. A real scorer (sov33_care_scorer.py,
cohere.command-r rubric, EU AI Act Art.5-grounded) was built and MEASURED on held-out labelled batteries:
- Blatant harm vs clear benign: RECALL 1.00, PRECISION 1.00 (proves it's not a no-op).
- Adversarial (framed/laundered harm): RECALL 0.60, PRECISION 1.00 — it MISSED elder-manipulation
  framed as consent and social-scoring framed as "hypothetical". NOT robust to intent-laundering.
HONEST claim: blatant harm vetoed; laundered harm caught 60%; over-blocks nothing. Hardening ongoing
(adversarial training / divergence second-scorer / de-framing). See SOV33_CARE_SCORER_2026-07-10.md.

## PARALLEL BATCH 2 (2026-07-11, measured)
- TRACK A — L4 N-version brain divergence: WORKS. cheap vs 70B cross-checked; hard reconcile task
  0.00 agreement->flagged, easy tasks 1.00->trust cheap. Brain layer now fault-tolerant (no single
  model trusted blindly). sov33_l4_divergence.py.
- TRACK C — BFT hive wrappers: DRUM heartbeat-quorum (30 entities, f=9, quorum 21) + Intuition majority
  sensor cross-check. Both layers had NO fault-tolerance before; now defined. sov33_bft_hive.py.
- TRACK B — care scorer v2 (+prohibited-goal signal): REGRESSED (TP=1 FN=1 FP=2). The extra signal
  over-fired on benign compliance mentions AND still missed the hypothetical case. DISCARDED — the
  v1 ABOUT-vs-DO divergence scorer (recall 0.80/precision 1.00) remains the shipped version. The one
  hypothetical-framing miss stays OPEN rather than trade it for 2 false-positives on legitimate work.

## PARALLEL BATCH 3 (2026-07-11, measured + honest)
- TRACK D — L3 anchor-quorum: 3 routers, escalate on split. Mechanism sound but 0/4 escalated because
  the test battery had NO ambiguous tasks — happy-path proven, escalation path UNTESTED. Only COMPLIANCE
  (x3 tasks) and VOICE (x1) were exercised; DEFENSE and INTUITION anchors were NOT hit by the battery. Needs a
  borderline battery to prove the escalation trigger. sov33_l3_anchor_quorum.py.
- TRACK E — L2 reputation-weighting: weighted vs flat vote. Resolves borderline (0.76) cleanly but on
  this sim weighted≈flat — modest measured effect; matters more with a genuinely split council. Sound
  mechanism, marginal gain here. sov33_l2_reputation.py.
- TRACK F — sovereign + L4 brain divergence: LIVE + useful. Adopted answers now carry a cheap-vs-70B
  confidence tag. Art.6 answer flagged low_divergent (agreement 0.00) — the sovereign now KNOWS when its
  brains disagree and surfaces it. sov33_scored_owem_v2.py. Wire into sov33.py next.
- CLI: sov33_cli.py — talk to the sovereign from any terminal (one-shot or interactive REPL). LIVE.


## EAT TICK (2026-07-11, ASSURANCE/GOVERNANCE lane — DEFENSE frozen per directive)
Verified on disk, live:
- ASSURANCE: Sovereign.ask('conformity assessment') -> adopted, care 0.98, signed Oracle 70B, 17 SIGIL hops verified.
- GOVERNANCE: harm request -> vetoed_care_floor, care 0.00, refused before brain.
- 7 governance components present on disk (sov33.py + cli + scored_owem + care_divergence + wired_owem + l4_divergence + bft_hive).
- DEFENSE: frozen — no defense-probing built or run. Confirmed.
- CORRECTION: earlier Track-D prose named DEFENSE among routed anchors; actual votes were COMPLIANCE x3 + VOICE x1 only. DEFENSE not exercised. Record fixed.

## NAMING CORRECTION (2026-07-11)
- "DORADO" on disk = ZK-SNARK sovereignty-proof tool (sov_dorado_status/prove_sovereignty), NOT the hard-stops.
- sov33_dorado.py implements the DEFONEOS §3 THREE HARD STOPS (severed brands/kinetic/surveillance). Logic
  correctly grounded in the whitepaper; the DORADO name was an agent conflation — module now honestly labelled.
  Filename retained for call-site stability (bridge/loop import dorado_check).
