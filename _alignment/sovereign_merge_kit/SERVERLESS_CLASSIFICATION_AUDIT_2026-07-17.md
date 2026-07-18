# SERVERLESS CLASSIFICATION AUDIT — 2026-07-17

**Estate:** SOV3-cubed / OOWM sovereign merge kit · `_alignment/sovereign_merge_kit`
**Author:** MEOK SOV3 · **Track 1** — serverless classification + stateless-spine harness
**Scope:** every spine / gate / OWEM / hive / Layer-0 protocol, tagged by *where its state lives*.

## Honesty register (RUNNING vs DESIGNED vs GATED)
- **RUNNING** = the harness (`sov33_serverless_harness.py`, this delivery) actually imported the spine fresh and read its output in this sandbox.
- **DESIGNED** = the classification is a reading of the source contract (what the code *would* do against a real KV/object store); the store itself is a stub here.
- **GATED** = frozen by the EAT Directive (SOVEREIGN-DEFENSE) or otherwise not firing.
- No param-summing, no "it's live" without a read. The **counts** are RUNNING reads of source.
- **WAVE A (2026-07-17):** the 9 STATEFUL components (§2) are now **RUNNING-serverless** — the external
  store they needed is built (`sov33_state_store.py`) and each spine was proven reading/writing through it
  across separate cold processes (`sov33_state_store_demo.py`, 9/9). "RUNNING" = local sqlite backend, ran
  in this sandbox, per-spine output read. "DESIGNED" now means only the prod transport swap (sqlite →
  cloud KV/object store behind the same API). The **6 COORDINATION components (§3) remain DESIGNED** — a
  plain KV/log is not a BFT/consensus log; they were out of WAVE A scope.

## Classification axis
`serverless-vs-stateful` is **not** about whether code touches disk — it is about whether the *decision* is a pure function of its input. Three classes:

1. **STATELESS-serverless** — output is a pure function of `(input, warm config)`. *Warm config* = keys, model weights, LoRA adapters, router coefficients: loaded once per worker, never mutated by a request. These scale to zero and fan out horizontally with no coordination. **n = 14**
2. **STATEFUL-needs-external-store** — the decision reads/appends an evolving history (hash-chain, ledger, memory, forest). Serverless-*deployable* only when that history is externalised to a KV / object / append-only store the worker reads through. **n = 9**
3. **COORDINATION-state** — correctness requires a *shared view across members* (BFT quorum, hive readings). Needs a replicated/consensus log, not just a KV. **n = 6**

**Totals:** 14 stateless · 9 stateful · 6 coordination · **29 classified**.

---

## 1 · STATELESS-serverless (pure function of input — embeddable, scale-to-zero)
| Component | File / symbol | Class | Why | External store needed |
|---|---|---|---|---|
| SIGIL sign primitive | `sov33_ed25519_sigil.Ed25519Sigil.sign / .verify` | **STATELESS** | Ed25519 sign+verify is a pure function of (private key, payload). Key is warm config (like a model weight), not evolving state. Same payload → same verifiable signature. | — |
| Care gate (local) | `sov33_care_local.score_local / care_divergence_local` | **STATELESS** | Transparent lexical rules over the input string; no I/O, no persisted read/write. Deterministic score+intent. | — |
| Care divergence scorer | `sov33_care_scorer / care_divergence` | **STATELESS** | Scores a single text; pure classifier output. | — |
| Router / BRUM | `sov33_brum.drive / _route` | **STATELESS** | Routes a request to a brain by embedding/TF-IDF/keyword; pure function of the request. Router weights are warm config. | — |
| DORADO detector | `sov33_dorado.dorado_check` | **STATELESS** | Absolute pattern match over input text → {stop,category,matched}. The DETECTION is pure; its SIGIL audit-log side-effect must be injected/routed to the store (not intrinsic to the decision). | — |
| Currency-gate check | `sov33_currency_gate.check_answer (freshness math)` | **STATELESS** | Staleness = date arithmetic on (source_date, as_of); pure. The ledger append in stamp() is the stateful part — separable. | — |
| TRUM transform | `sov33_trum.world_events / slice_for_render` | **STATELESS** | Level-of-detail slice/transform that is a pure function of the events it is GIVEN. Its input read comes from the shared store, not from private module state. | — |
| CRUM representation | `sov33_crum.style_for / style_map` | **STATELESS** | Maps event values → visual style; pure function of the events list. | — |
| OWEM inference (warm-base+adapter) | `sov33_owem_stack.governed_stack_infer, sov33_owem_router ask/route` | **STATELESS** | Forward pass of a frozen base model + LoRA adapter is a pure function of (weights, adapter, input). Weights/adapters are warm config; embeddable in every OWEM. | — |
| L0 P1 — MCP federation | `MCP 2026 spec (SOV33_MCP_2026_AUDIT)` | **STATELESS** | 2026-07-28 spec REMOVED Mcp-Session-Id — server MUST be stateless; each request self-contained. | — |
| L0 P4 — x402 payment check | `x402 verify` | **STATELESS** | Verifying a presented payment token/signature is pure; only settlement (ledger write) needs a store. | — |
| L0 P5 — SIGIL attestation (sign) | `Ed25519 attestation` | **STATELESS** | Producing/verifying an attestation over a payload is pure (see SIGIL sign primitive). | — |
| L0 P6 — OSCAL/FedRAMP package | `signed OSCAL bundle` | **STATELESS** | Static Ed25519-signed package; verification is a pure read — no evolving state. | — |
| L0 P8 — Compliance Passport (verify) | `passport verify` | **STATELESS** | Verifying an issued passport is pure; only issuance appends to a store. | — |

> **Key separation (measured in the harness):** several spines *emit* an audit record as a side-effect (DORADO's SIGIL log, currency-gate's ledger append). The **decision** is pure; the **emission** is a write that must be *injected* (routed to the StateStore), not baked into the function. The harness proves the decision is identical across fresh cold calls when the emission is routed out.

## 2 · STATEFUL-needs-external-store (serverless only with the store externalised)

**WAVE A UPDATE (2026-07-17) — all 9 flipped DESIGNED-serverless → RUNNING-serverless.** The external
store the audit called for is now built and running locally: `sov33_state_store.py` — a durable,
namespaced sqlite backend (KV `put/get/keys/delete` + append-only log `append/read_since`, one keyspace
per spine). Each spine below was adapted to read/write its history THROUGH the store and then PROVEN
across two SEPARATE cold processes (distinct PIDs, fresh import each time — no in-process state can
carry over): state written in cold-call-1 was correctly read in cold-call-2 via the store.
Harness: `sov33_state_store_demo.py` (`<spine> <write|read>` subprocesses). **9/9 proven.**

- **RUNNING-serverless (local)** = adapted to the StateStore and proven across cold processes here.
- **DESIGNED (prod)** = swap the sqlite backend for a cloud KV/object/append-only store behind the
  IDENTICAL StateStore API — no spine logic changes. Only `StateStore.__init__` points elsewhere.
- Adapters reuse each spine's PURE logic (Ed25519 crypto, record shapes, maturity/freshness math,
  consent fold); only the persistence layer moved (local JSONL → StateStore). Every write stays
  SIGIL-signed / Care-Floor-gated regardless of transport.

| Component | File / symbol | Class | External store (now RUNNING) | Serverless status (WAVE A) — cold-call proof |
|---|---|---|---|---|
| SIGIL hash-CHAIN | `sov33.sigil_emit / Ed25519Sigil chain` | **STATEFUL** | Append-only log `ns=sigil` + KV head `prev` | **RUNNING-serverless** — 2 links, link-2.prev_hash == link-1.own_hash across cold gap; both Ed25519 sigs verify (real key reused) |
| DRUM time-ledger / clock | `sov33_drum_clock.tick / elapsed / session_span` | **STATEFUL** | Append-only log `ns=drum` | **RUNNING-serverless** — `LEARN` logged cold-1 read cold-2; elapsed LEARN→DO = 0.079s computed as a fold over the store |
| JRUM memory / journal | `sov33_jrum.log_decision / recall_with_context` | **STATEFUL** | Append-only journal `ns=jrum` (KV/vector for semantic) | **RUNNING-serverless (journal path)** — decision `WAIT` journalled cold-1, keyword-recalled cold-2. Note: 7-NN signal persist + semantic (sentence-transformers) recall remain **DESIGNED** — separate stores, not exercised |
| Sector forests | `sov33_sector_forests.add / sector_status` | **STATEFUL** | Append-only node archive `ns=sector_forests` | **RUNNING-serverless** — governance node (THIN) written cold-1 read back cold-2 alongside detectors (STRONG); real SECTORS + maturity thresholds reused |
| Evolve forest / learning ledger | `sov33_evolve_forest.add` | **STATEFUL** | Append-only archive `ns=evolve_forest` | **RUNNING-serverless** — root admitted cold-1; child admitted cold-2 (DGM beats-parent rule) links to that root's id |
| Currency ledger (stamp) | `sov33_currency_gate.stamp` | **STATEFUL** | Append-only audit log `ns=currency` | **RUNNING-serverless** — fresh stamp (not stale) written cold-1 read cold-2 beside a stale stamp; real `FRESH_WINDOW_DAYS`=180 formula reused |
| Consent ledger | `sov33_consent_gate.grant / has_consent / revoke` | **STATEFUL** | Append-only consent ledger `ns=consent` | **RUNNING-serverless** — grant folded True cold-2, then revoke took effect (current consent = fold over history, contract reused) |
| L0 P2 — legacy bridges | `sov33_legacy_bridge.analyze` | **STATEFUL** | System-of-record log `ns=legacy_sor` | **RUNNING-serverless (SoR path)** — analyzer is stateless & reused as-is; SoR record (5 rules, ANALYZED) written cold-1 recovered cold-2. Live proxy to a real legacy host stays **DESIGNED** |
| L0 P3 — A2A federation registry | A2A substrate / registry (store-backed) | **STATEFUL** | Shared mutable directory (KV `ns=a2a_registry`) | **RUNNING-serverless** — agent registered cold-1, looked up (reachable) cold-2, then deregistered. New store-backed directory, distinct from `sov33_registry.py` (import-health manifest) |

## 3 · COORDINATION-state (shared quorum view across members)

**WAVE B UPDATE (2026-07-17) — all 6 flipped DESIGNED → RUNNING for the ORDERED-LOG layer; the
REPLICATION layer stays DESIGNED (honest split below).** The audit's §3 fix called for "a
replicated/consensus log, not just a KV." WAVE A's plain KV/log could not supply a *shared ordered
view across members*. WAVE B builds that missing piece: `sov33_consensus_log.py` — an append-only,
sequence-ordered, **hash-chained** log with a **quorum-read** that returns the identical agreed
ordered view (and the identical verdict) to every reader, on top of the WAVE A StateStore. Each of
the 6 components below was proven reaching its CORRECT quorum decision by reading/writing this log
**across THREE separate cold processes (distinct PIDs)**: votes appended in cold-call-1 + cold-call-2
yield the right verdict when tallied in cold-call-3 — the only channel across the cold gap is the
durable ordered log. Harness: `sov33_consensus_log_demo.py` (`<component> <c1|c2|tally>` subprocesses;
`controls` mode). **6/6 proven; negative controls (split→NO_QUORUM, tie→NO_QUORUM, tamper→detected)
also pass.**

**The honest RUNNING vs DESIGNED split (per `ConsensusLog.honest_limits()`), true for ALL 6:**
- **RUNNING (local):** total order (sqlite single-writer serialises appends → one linearizable
  per-topic order), hash chain (tamper/reorder-evident across cold restarts), quorum read (every
  member gets the same view + verdict; an equivocating member's contradictory votes are visible and
  forfeit the vote).
- **DESIGNED (prod):** *agreement on that order across untrusted replicas.* The local proof trusts
  **one** writer of the order (sqlite). In production, N Byzantine replicas must AGREE on the same
  order (Raft/PBFT: leader election, view change, 3-phase commit). Swap the sqlite backend for a
  replicated log behind the IDENTICAL append/read interface — no caller changes. This is the honest
  boundary: the *tally / ordered view / auditability* is RUNNING; the *Byzantine agreement on order*
  is DESIGNED. So a plain KV/log is NOT a consensus log (WAVE A was right to leave §3 open), and an
  ordered hash-chained log is still NOT a full BFT replication protocol — it is the correct
  serverless-compatible stand-in that fixes the SHARED-ORDERED-VIEW gap and isolates exactly what
  remains for a replicated store.

| Component | File / symbol | Class | Quorum rule (source) | Serverless status (WAVE B) — cold-call proof |
|---|---|---|---|---|
| BFT hive | `sov33_bft_hive` | **COORDINATION** | heartbeat quorum n−f, f=(n−1)//3 (INLINED from source: source runs under `__main__` with live sensor loads) | **RUNNING (ordered-log layer)** — 6 of 7 entities beat across cold-1+cold-2 → layer LIVE (6 ≥ quorum 5), tallied cold-3; chain verifies. Replication = DESIGNED |
| BFT-33 OWEM council | `sov33_bft33_owem_council, sov33_owem_v3.BFT33Council` | **COORDINATION** | 23/33 quorum + Free-MAD (allow−reject) (INLINED: `run_bft33_council` imports OWEM inference at call time) | **RUNNING (ordered-log layer)** — 33 ballots split 12+21 across cold calls → 26 allow / 7 reject, quorum met, decision *allow*, tallied cold-3. Real OWEM inference panel = DESIGNED |
| SAC council | `sov33_sac_council` | **COORDINATION** | ConfidenceProbe + FreeMADAggregator, (F+1)=11 (IMPORTED: real classes run in the tally) | **RUNNING (ordered-log layer)** — 22 honest + 11 byzantine ballots across cold calls; separate probe down-weights weak reasoning → *allow*, (F+1) satisfied, tallied cold-3. Trained probe + real LLM panel = DESIGNED |
| Queen hives | `sov33_queen_hives` | **COORDINATION** | `SubHive.deliberate`: BFT 2f+1 + effective-vote trust floor (IMPORTED: real class runs in the tally) | **RUNNING (ordered-log layer)** — 4 security-hive delegate votes across cold calls → POOL_A clears BFT quorum 3 AND trust floor (ρ=0.20) → committed, tallied cold-3. 4-brain mesh routing = DESIGNED |
| L3 anchor quorum | `sov33_l3_anchor_quorum.quorum` | **COORDINATION** | 3 routers, plurality, commit iff ≥2 else escalate (INLINED: `quorum()` under `__main__` calls live OCI routing) | **RUNNING (ordered-log layer)** — 3 router votes (2-1 split) across cold calls → COMPLIANCE commits (not escalate), tallied cold-3. Real OCI routing = DESIGNED |
| L0 P7 — BFT council protocol | `BFT quorum` (no dedicated module) | **COORDINATION** | PBFT n=3f+1, commit iff ≥2f+1 (estate's own math: `sov33_4brain` BFT_CONFIGS f=1@n=5 / f=3@n=12; `sov33_queen_hives.SubHive` quorum=2f+1) instantiated at n=4 | **RUNNING (ordered-log layer)** — 4 replica prepares (3 agree, 1 faulty) across cold calls → V_apply commits (3 ≥ 2f+1=3), faulty forfeits, tallied cold-3. Byzantine agreement on order (leader election, view change, 3-phase commit) = DESIGNED |

---

## ROUTING-DIMENSION note — statefulness is a router axis
The estate router already dispatches on **online/offline** (tier) and **old/live** (currency). This audit adds a **third axis: stateless/stateful (state-location)**. The router reads a 3-tuple off each request and dispatches:

```
route(request) reads {privacy, currency, statefulness}:
  privacy      : online  <-> offline    (federation tier / sovereign-offline)
  currency     : live    <-> old        (fresh source vs frozen-model recall)
  statefulness : stateless <-> stateful (scale-to-zero worker  vs  store-backed worker)
        -> stateless  : dispatch to a serverless pure-function worker (fan out, no coordination)
        -> stateful   : dispatch to a worker bound to the shared external store
        -> coordination: dispatch to the BFT/quorum path (replicated view)
```

The three axes are **orthogonal**: e.g. a *live + offline + stateless* freshness check, or an *old + online + stateful* memory recall. The router is the single place the 3-tuple is resolved.

---

## Per-OWEM integrated routing (DESIGN DIRECTIVE — owner)
**Directive:** every OWEM stack integrates ALL routing *internally* — the 3-axis router is not only a top-level dispatcher, it is embedded inside each OWEM so an OWEM can itself dispatch a sub-request across the axes.

**Design (DESIGNED, not yet proven RUNNING):**
- Each OWEM carries an **in-stack 3-axis router** (online/offline · old/live · stateless/stateful). A sub-request produced inside an OWEM (e.g. "I need a fresh regulation lookup", "I need to recall a prior decision") is routed by the OWEM's own router across the same three axes, recursively.
- **Stateless spines are embedded as pure functions in EVERY OWEM.** SIGIL-sign, care-gate, router, DORADO, TRUM/CRUM transforms, currency-freshness math, warm-base+adapter inference — all copy-free to embed because a pure function has no per-OWEM state to duplicate. Cost of embedding N times = N × 0 state.
- **Stateful spines share ONE external store across ALL OWEMs — never per-OWEM duplicated state.** The SIGIL hash-chain, DRUM ledger, JRUM memory, sector/evolve forests, consent & currency ledgers are a *single shared store* the OWEMs read/write through. Per-OWEM state would fork the chain and break global auditability; one store keeps a single consistent lineage.
- **Coordination stays above the OWEMs.** The BFT-33 council / hives are not embedded per-OWEM; they are the quorum layer OWEMs report *into*.

**Per-OWEM axis needs (which axes each OWEM actually exercises):**

| OWEM stack | online/offline | old/live | stateless/stateful | notes |
|---|---|---|---|---|
| Compliance | both (offline-first, online for live law) | **live-critical** (currency gate) | stateful (cites versioned charters, logs currency) | needs all 3; currency axis is load-bearing |
| Defense | offline-preferred | live (threat feeds) | stateful (DORADO audit chain) | GATED by EAT Directive |
| Intuition | offline | old/live mix | mostly stateless (pattern inference) + JRUM recall | light on external store |
| Voice | offline (TTS) | old | **stateless** | pure function; embeds all stateless spines, touches no store |

> **Honesty:** the per-OWEM integrated router is **DESIGNED**. What the harness proves **RUNNING** is the two load-bearing premises underneath it: (a) the stateless spines give identical output on repeated fresh cold calls (=> safe to embed in every OWEM with zero duplicated state), and (b) a stateful spine (hash-chain) persists+reads correctly through ONE shared StateStore across cold invocations (=> safe to share one store across all OWEMs). The recursive in-OWEM dispatch itself is spec.

---

## External-store shopping list (what the stateful/coordination classes need)
- **Append-only log / object store** — SIGIL hash-chain, DRUM time-ledger, currency ledger, consent ledger, sector & evolve forests. One shared instance across all OWEMs. **✅ WAVE A: RUNNING** via `sov33_state_store.py` append-only log (per-spine namespace); prod = swap sqlite for cloud object/append-only store, same API.
- **Vector/KV memory** — JRUM recall. **◑ WAVE A: journal path RUNNING** (append-only + keyword recall through the store); semantic/vector recall + 7-NN signal persist still DESIGNED.
- **Federation registry store** — A2A (L0 P3), legacy bridges (L0 P2). **✅ WAVE A: RUNNING** — A2A directory on the store KV (register/lookup/deregister); legacy system-of-record on the store log. Live proxy to a real legacy host stays DESIGNED.
- **BFT replicated log (consensus)** — BFT hive, BFT-33 council, SAC council, queen hives, L3 anchor quorum, L0 P7. View number + vote set, not a plain KV. **◑ WAVE B: ordered-log layer RUNNING** via `sov33_consensus_log.py` (append-only, hash-chained, quorum-read; shared ordered view + verdict identical for every reader; proven across 3 cold processes per component, 6/6 + negative controls). The **replication layer stays DESIGNED** — sqlite is one trusted writer of the order; prod swaps it for a Raft/PBFT replicated log behind the identical interface (Byzantine agreement on order = leader election / view change / 3-phase commit). A KV/log alone is still not a consensus log; this adds the shared-ordered-view piece and isolates exactly what the replicated store must still provide.

---

## WAVE A deliverables (2026-07-17)
- **`sov33_state_store.py`** — durable namespaced StateStore (sqlite KV + append-only log, WAL, ACID). The local stand-in for the production external store; identical API in prod.
- **`sov33_state_store_demo.py`** — 9-spine cold-invocation harness. Each spine: `write` phase (cold-call-1) and `read` phase (cold-call-2) run as SEPARATE processes with distinct PIDs; read proves it sees cold-1's state only via the store. Result: **9/9 STATEFUL spines RUNNING-serverless**; 6 COORDINATION spines remain DESIGNED (need a consensus store).

## WAVE B deliverables (2026-07-17)
- **`sov33_consensus_log.py`** — ordered, hash-chained, quorum-read consensus log over the WAVE A StateStore. Adds the three properties a plain KV/log lacks: (1) **total order** (monotonic per-topic seq, sqlite single-writer = linearizable), (2) **hash chain** (`prev_hash → entry_hash`; `verify_chain` detects reorder/tamper), (3) **quorum read** (`read_quorum` returns the identical agreed ordered view + verdict to every reader; equivocating members are flagged and forfeit their vote). `honest_limits()` states the RUNNING (order/chain/quorum-read) vs DESIGNED (Byzantine agreement on order across replicas → Raft/PBFT) split in code. Local sqlite backend; prod = swap for a replicated log behind the identical `append_vote`/`read_quorum` interface.
- **`sov33_consensus_log_demo.py`** — 6-component cold-process proof + `controls` mode. Each component: `c1` + `c2` (vote-append phases) and `tally` (verdict phase) run as THREE SEPARATE processes with distinct PIDs; the correct verdict in cold-3 proves the votes travelled only through the durable ordered log. Quorum rules are faithful to source — IMPORTED (SAC `ConfidenceProbe`/`FreeMADAggregator`, Queen `SubHive.deliberate`) or INLINED verbatim where the source module runs live network side-effects at import (BFT-hive, BFT-33, L3). Result: **6/6 COORDINATION components RUNNING (ordered-log layer)**; negative controls (split→NO_QUORUM, tie→NO_QUORUM, tamper→detected@seq2) pass. **Replication layer (Byzantine agreement on order) stays DESIGNED for all 6.**
- **`consensus_log_proof_results.json`** — captured cold-process run: 6 components × {c1, c2, tally} with distinct PIDs and per-component pass/fail.

*Every write to any of these must remain SIGIL-signed and Care-Floor-gated regardless of transport.*
