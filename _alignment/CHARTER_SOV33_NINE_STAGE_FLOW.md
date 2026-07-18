# 🜏 CHARTER — THE SOV33 NINE-STAGE GOVERNED FLOW
## Canonical operating cycle for King SOV33 and BINDING on every layer, hive, and agent

**Status:** CANONICAL · **Scope:** King SOV33 + all hives + all layers + all sub-agents
**Amendment:** requires BFT quorum + human (Nick) signature (per Charter Article 0 governance)
**Honesty register (binding):** every stage below is tagged RUNNING (verified on disk) /
NEW (designed, not yet built) / PARTIAL (exists but incomplete). No stage may be reported
as RUNNING until it is verified with output shown. This charter itself obeys the flow it defines.

---

## ARTICLE I — THE NINE STAGES (every task, every hive, every layer)

| # | Stage | What it does | Status |
|---|-------|--------------|--------|
| 1 | **LEARN**   | Ground from disk / memory / live data BEFORE acting. No action from cold. | NEW — needs memory layer wired |
| 2 | **CHECK-EXISTING** | Audit what is already built; never rebuild what exists. | NEW — the "check existing" rule |
| 3 | **PLAN**    | Decompose the task into subtasks. | RUNNING — PDCA general 1 |
| 4 | **DO**      | Execute (brain / swarm does the work). | RUNNING — PDCA general 2 |
| 5 | **ACT**     | Apply / commit the result. | RUNNING — PDCA general 3 |
| 6 | **CHECK-VERIFY** | Cross-lineage check output (defer-to-escalate; catch correlated errors). | RUNNING — sov33_escalate, ρ-measured |
| 7 | **AUDIT**   | Trace every claim; catch overclaims; separate RUNNING/DESIGNED/STUB. | PARTIAL — the verification discipline, not yet a coded stage |
| 8 | **IMPROVE** | Log what passed/failed; tighten the loop; propose (never self-commit) changes. | RUNNING — PDCA general 5 |
| 9 | **BRAND/VISUAL + QUALITY** | Presentation + the CALIBRATED quality guarantee (conformal veto), BFT-gated. | PARTIAL — conformal veto RUNNING; brand/visual NEW |

---

## ARTICLE II — BFT ON EVERY STAGE (the honest rule)

Each stage MAY be BFT-voted, BUT — per the MEASURED finding (ρ=0.76 between Cohere & Meta lineages,
SOV33_COUNCIL_CORRELATION_FINDING) — **a BFT vote only adds fault tolerance when the voters are
DECORRELATED.** Therefore, binding on all hives:

1. BFT at a stage MUST use CROSS-LINEAGE checkers (e.g. Meta-Llama checked by Cohere or Kimi or
   AgentDoG), never same-family voters. Same-lineage voting is THEATRE and is forbidden as a
   correctness guarantee.
2. On checker DISAGREEMENT: **escalate (defer-to-resample / stronger brain / human / abstain).
   NEVER average correlated votes.**
3. Each hive MUST log its pairwise error-correlation ρ and report it. ρ≥0.7 = theatre; ρ<0.4 = real.
4. BFT still governs LIVENESS (a brain being down) and quorum for AMENDMENTS regardless of ρ.

---

## ARTICLE II-B — YEARS→DAYS and DRUM are NOT stages (placement, set in stone)

Two things are frequently mistaken for stages. They are NOT. Their correct placement:

- **YEARS→DAYS = the execution MODE of stages 3-4 (PLAN→DO).** When PLAN decomposes a task,
  Years→Days fans the independent subtasks across N hives IN PARALLEL rather than serially,
  then CHECK-VERIFY (stage 6) reconciles. It compresses WALL-CLOCK time by parallelism; it does
  NOT add a stage and does NOT add capability. Status: orchestrator RUNNING (sov33_orchestrator).
- **DRUM = the CLOCK beneath all 9 stages (L0 heartbeat, 1 Hz firefly).** Every stage ticks on DRUM.
  DRUM is a WRAPPER (Article III), not a step: its phase-veto can halt the loop if the substrate
  destabilises (mist_12 < 0.95). Status: RUNNING (drum/drum_heartbeat.py).

Also placed (built-but-unwired, target for wiring):
- **MEMORY** → makes stage 1 (LEARN) real; without it LEARN is a stub. #1 wiring gap.
- **SWARM (OpenManus/Kimi)** → the governed muscle inside stage 4 (DO).
- **MASTER-NET / quantum-inspired gating** → a routing option in stage 6 (CHECK-VERIFY) / brain tier.

---

## ARTICLE III — WHAT WRAPS ALL NINE STAGES (non-negotiable)

Every stage, on every hive, is bound by the standing gates — these fire and cannot be bypassed:
- **HORUS** (intrusion defense, outermost, per-session lockdown) — RUNNING
- **DEFONEOS HARD-STOPS** (severed brands, kinetic targeting, personal surveillance) — RUNNING. NOTE: on disk 'DORADO' is the separate ZK-SNARK sovereignty-proof tool; the hard-stops module is NOT DORADO — do not conflate.
- **CARE-FLOOR** (calibrated conformal veto, Pr[allow ∧ harm] ≤ α) — RUNNING (in-sample proven; needs larger calib set)
- **SIGIL** (Ed25519 hash-chained provenance on every hop) — RUNNING
- **DRUM** (L0 1 Hz heartbeat; phase-veto halts the loop on instability) — RUNNING
- **Article 0** (fee-for-service only; no equity/board/revenue-share from certified institutions) — BINDING

---

## ARTICLE IV — HONEST SCOPE (what this flow does and does NOT do)

- It makes work TRACEABLE, GATED, and QUALITY-CHECKED. It does NOT add intelligence — all reasoning
  comes from the base brains; the flow is judgment and governance, not capability.
- Parallelism across hives multiplies THROUGHPUT (Years→Days), not capability. Parameter counts across
  stacked brains DO NOT add — a mesh routing between a 3B and a 70B is NOT a 4T model.
- Stages 1, 2, and the brand half of 9 are NEW (not yet built). This charter sets the target; the
  framework doc tracks build status honestly.

---

## ARTICLE IV — THE TWO FLANKS (canonical stack, honest tags)

SOV33 is wrapped by two flanks that the gates enforce per-request. Left flank GOVERNS, right flank DEFENDS.

```
              FLYWHEEL LAYER  (compounding self-improvement; wraps all — SPINNING, compounding data-gated)
  ┌───────────────────────────────────────────────────────────────────────┐
  │  CSOAI GOVERNANCE (LEFT FLANK — the law)                                │
  │    charters (~120 numbered, sovereign-charters/) ......... RUNNING(docs)│
  │    OSCAL package (Ed25519-signed, verifiable) ............ RUNNING       │
  │    compliance passport + cyber/FedRAMP crosswalks ........ RUNNING(docs) │
  │  = the rulebook the gates enforce (standards authority, not per-req)    │
  ├───────────────────────────────────────────────────────────────────────┤
  │  GATES (per-request enforcement):                                       │
  │    HORUS(per-session) → DEFONEOS DEFENCE → Care-Floor(conformal)        │
  │                        → SIGIL → DRUM(L0 clock)                         │
  │                                                                         │
  │  DEFONEOS DEFENCE (RIGHT FLANK — the shield)                            │
  │    hard-stops (kinetic/surveillance/severed brands) ...... RUNNING       │
  │    guardian kill-switch (own-actuators, human-gated) ..... RUNNING(reserve)│
  │    active/offensive defence .............................. FROZEN (EAT) │
  │  = refuse + protect ONLY; never attack. Gov-contract-scoped.           │
  ├───────────────────────────────────────────────────────────────────────┤
  │  9 GOVERNED STAGES (LEARN…BRAND/QUALITY)                                │
  ├───────────────────────────────────────────────────────────────────────┤
  │  NN LAYER (7 planets — learned judgment)                                │
  │    load 7/7 · score-live 0/7 (3 strong need feature-path, 4 weak       │
  │    data-gated) · reliability-weighted · learning half of flywheel      │
  ├───────────────────────────────────────────────────────────────────────┤
  │  BRAIN LAYER (Oracle 70B / Groq gpt-oss-120b / Kimi / Mamba-pending)    │
  └───────────────────────────────────────────────────────────────────────┘
```

**Binding rules:**
- CSOAI = law (governance authority); DEFONEOS = shield (defence). Both wrap the brains; the gates enforce both per-request.
- DEFONEOS defence means REFUSE + PROTECT, never ATTACK. Governance grants the right to defend, not authority to strike.
- The EAT Directive freezes SOVEREIGN-DEFENSE: only ASSURANCE/GOVERNANCE/CYBER + protective hard-stops fire; active/offensive defence stays FROZEN.
- Honest tags are binding: RUNNING (verified), RUNNING(docs) (real files, not a live engine), FROZEN (held by directive), data-gated (needs accumulated data).
