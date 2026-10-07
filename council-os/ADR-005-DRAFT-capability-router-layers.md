# ADR-005 (DRAFT — NOT RULED, NOT IMPLEMENTED): one capability router — layers, escalation, receipts

Status: **PROPOSED 2026-10-07.** Nothing in this file is wired. `functions/_lib/route/`, `/api/route/execute`,
the board, the MCP tool list and every count stay as they are until the owner rules. Each decision below
(D1–D7) can be ruled on separately.

## The proposal (owner, 7 Oct 2026, summarised)

Treat the estate's pieces as layers of one execution system, not competing projects:

| Layer | Job in the proposal |
|---|---|
| Executive orchestrator (MEOK) | takes the objective, keeps task state, delegates |
| Specialist agents | domain expertise: MCP, x402, stablecoin, interop, security, evidence, remediation, constitutional |
| Council | deliberation and fault tolerance, convened **adaptively**: 1 → specialist + verifier → 3/5/7 panel → full council, with the reason for each escalation recorded |
| Capability graph | what exists, what is measured, versions, provenance, health, cost, claim boundaries |
| Execution boundary | what the selected agent or tool is actually permitted to do |
| GSPC + Claim Maintenance | measures outcomes and feeds them back |
| Router | objective → specialist → panel (if needed) → model → agent → tool → instrument → execution path |

The external surface stays a small set of verbs (measure, verify, compare, find, fix, protect, execute,
observe, prove, maintain) over a large measured capability graph — never thousands of exposed tool definitions.

## What exists today, by bytes (read 2026-10-07 on master 05f098401 and live)

| Proposed layer | What is on master | State |
|---|---|---|
| Router (decide) | GSPC Route, `functions/_lib/route/route.ts` + `decide.ts`; served by MCP `route`, A2A skill `route`, `services/gspc-router`. Drops policy-forbidden candidates and keeps the drop with its policy id. Reads the quality axis from the live board; a candidate with no number is UNTESTED (never imputed, never 0). Names a "separated leader" only when the board separated one; otherwise the **caller's** `tie_break` decides. No money field is an input. | LIVE, decide-only |
| Execution boundary | `POST /api/route/execute`, `functions/_lib/route/execute.ts`, owner ruling 2026-09-30, phases 1–4. Calls a tool server-side only when it is VERIFIED read-only. A request carrying a credential is refused (CREDENTIALS_REFUSED). A target the edge may not call is answered CLIENT_SIDE with the exact JSON-RPC for the caller to send with their own key. x402 is forwarded only when the caller confirms the challenge by sha256. A first-party action needs `confirm_action: true`. A third-party tool that is not verified read-only is never called by the edge. Every outcome is a signed receipt (`csoai.route-evidence/0.1`, `did:web:csoai.org#route-attestation-1`); no signer → nothing executes. | LIVE |
| Capability graph | `council-os/capabilities.json`: 258 capabilities with lifecycle and probe, checked by `scripts/capability-registry.mjs --check`. Route candidates: `candidates.ts`, `discovery.ts` (ARD listings), `census.ts` (signed effect-binding census, per-tool rows). | LIVE, three sources |
| GSPC measurement | `/api/gspc`: 23 axes · 23 measured. **0 of 14 model-comparison axes separated a leader · 7 TIE · 7 UNTESTED.** Own council-specialist models are excluded from public leaders on 8 axes. | LIVE |
| Specialists | `/api/specialists` relays `csoai.specialist-team/0.1`: 13 specialists. The excluded own models are system-prompt overlays on stock base models (C-2026-0930-11). The feed's Ed25519 key is not in `did:web:csoai.org`, so the signature is relayed, not stranger-verifiable. | LIVE feed, unverifiable signature |
| Council | 33 declared roles, design quorum 23. Every quorum observation in `scripts/badger/_queue/bft-council/` reads `evaluated_vote_count: 0`, `independence_status: NOT_MEASURED`, `bft_status: NOT_DEMONSTRATED`. DR-0007 withdrew the fault-tolerance claim at **n_eff 1.21 against 3 nominal legs** (cited in `packages/gspc-card-verifier/src/quorum-neff.mjs`; the record itself is not in this repo). `scripts/council-runtime-truth-gate.mjs` enforces this, and seven fabricated 33-vote chains sit in `_quarantine/simulated-bft-2026-09-04/`. | NOT_DEMONSTRATED |
| Talk layer | `functions/_lib/talkRouter.ts`: keyword and entity extraction to the same tools `/mcp` serves. No model in the path. | LIVE |
| MCP surface | 19 tools: 14 free (`board_totals`, `get_axis`, `verify_card`, `list_cards`, `get_root`, `get_card`, `verify_inclusion`, `x402_trust`, `mcp_trust`, `measurement_index`, `verify_capsule`, `server_evidence`, `evidence_bundle_preview`, `route`) and 5 paid (`commission_card`, `art50_marking_evidence`, `rwa_evidence`, `receipts_batch`, `evidence_bundle`). | LIVE |
| Executive orchestrator | MEOK is not in this repository and was not inspected for this ADR. | UNMEASURED here |
| Outcome feedback into routing | None. `decide()` reads candidates, caller policy, the board axis and the census; no receipt history is an input. | NOT_WIRED |

**What this means for the proposal.** Most of the router and the execution boundary already exist. The
board currently separates no leader, so "route on 23-axis evidence" today means a policy and census
**floor** plus the caller's tie-break, not a ranking. That is correct behaviour (`decide.ts`: "Routing is
not ranking"), and anything built on top must keep it.

## Names: two of the proposed names are already taken

- **"Layer 0"** already means the foundational verification layer (identity, signing, attestation):
  `LAYER0_DISAMBIGUATION` in `client/src/data/anchoringClaim.ts`, the `/layer0` page,
  `council-os/layer0-automation.json`, and `council-os/distribution.json` ("every platform format Layer 0
  is distributed into").
- **"Harness X"** already means the distribution renderer named in `council-os/distribution.json`
  (`scripts/harness-x/render.mjs` → `distribution/**`).

Reusing either name for the capability graph or the execution boundary would put two meanings on one
word. Proposed: call the graph the **capability registry** (the name `capabilities.json` already
carries) and the boundary the **execute door** (`/api/route/execute`). The owner may pick other names,
but the existing names stay until a ruling changes them.

## Decisions proposed

### D1 — Who acts: measurement side and action side

| Side | Verbs | Rule |
|---|---|---|
| Measurement body (CSOAI) | measure, verify, compare, observe, prove, maintain, find | Deterministic and replayable. The edge executes only verified read-only calls and its own first-party tools. |
| Action side (MEOK, or the caller) | fix, protect, execute against a third party | Never done by the CSOAI edge. Delivered as CLIENT_SIDE plans (execute phases 2 and 4) or by MEOK under its own identity. |

The router may span both sides, but every receipt names the side that acted.

### D2 — The escalation floor is set by the action class, not by the model being escalated

| Action class (execute door) | Minimum review |
|---|---|
| Verified read-only | one route, no review |
| Paid first-party (x402) | one route; the caller confirms the challenge sha256 |
| First-party action (`confirm_action`) | specialist plus an independent verifier |
| Third-party write, irreversible action, publication, signature | review panel proposal, then CLIENT_SIDE with per-call confirm |
| Moves money or uses a credential | everything above, plus a human |

Disagreement may raise the level and never lowers it below the floor. The receipt records the floor,
the level used and what triggered any escalation.

### D3 — A panel is "review", not BFT, until its independence is measured

- Legs must differ in model family **and** provider. Overlays on one base model count as one leg.
- Before use, each panel composition gets an `n_eff` from `quorum-neff.mjs` (`observedRho` over a frozen
  calibration set). The receipt carries `n_nominal`, `n_eff`, `rho` and the calibration set's sha256.
- Fault-tolerance wording is used only when `n_eff ≥ 3f + 1` for the declared `f`, and only in the same
  ruling that updates `council-runtime-truth-gate.mjs`. Until then every panel artifact keeps
  `bft_status: NOT_DEMONSTRATED`.
- Today no panel exists: state NOT_WIRED.

### D4 — The determinism boundary

An agent may **choose** instruments, and its choice is recorded in the route record. The instrument run
and the verdict are never model-authored: they stay deterministic and replayable by a stranger, and no
model grades another. Agentic planning is allowed only in find, fix, protect and execute.

### D5 — Outcome feedback stays internal and stays a floor

- Receipts may feed routing statistics, kind `observed-internal`. They never enter `/api/gspc` or a public
  MEASURED claim. The claim register's rule applies: the claimant never holds the evidence.
- A public claim that a fix worked needs an after-state a stranger can reproduce from the receipts.
- Feedback must not reorder candidates the board calls TIE or UNTESTED unless a declared, versioned
  rule says so. Otherwise it is ranking by the back door.
- Exploration: a fixed, declared share of read-only routes goes to UNTESTED candidates so they can earn a
  first measurement. UNTESTED never routes into any action class above read-only.

### D6 — Routing share is never sold

No money field is a routing input (already true in `decide.ts`). Subjects cannot pay for routing share.
Traffic-weighted outputs are published only as counts, never as a ranking.

### D7 — Verbs are a facade over the existing tools, not new tools

The 19 MCP tools stay. Proposed verb mapping for AG-UI and A2A:

| Verb | Existing tools | Gap |
|---|---|---|
| measure | `commission_card`, `measurement_index` | — |
| verify | `verify_card`, `verify_inclusion`, `verify_capsule` | — |
| compare | `board_totals`, `get_axis` | — |
| observe | `mcp_trust`, `x402_trust`, `server_evidence` | — |
| prove | `evidence_bundle_preview`, `evidence_bundle`, `get_root` | — |
| find | `route` (decide), `list_cards`, discovery | — |
| maintain | — | no Claim Maintenance tool: NOT_WIRED |
| fix, protect, execute | `/api/route/execute` (read-only and first-party only) | third-party writes are CLIENT_SIDE; no repair executor exists |

## First slice, if ruled in

Objective: "verify and repair this MCP deployment". One specialist, no panel, no new public claim.

1. **Before:** `server_evidence` + `mcp_trust` + the effect-binding probe → route record (exists).
2. **Plan:** the repair is emitted as CLIENT_SIDE JSON-RPC requests; the edge never writes to the target.
3. **Act:** the caller sends them with their own key.
4. **After:** the same probes at the same instrument versions; the receipt links the before and after
   records by sha256.
5. **Remember:** one `observed-internal` telemetry row.

DONE WHEN: one real deployment's before/after pair can be reproduced by a stranger from the two
receipts. Add the verifier (D2) next. Add a panel only once logged disagreements show it would have
changed an outcome.

## Why it may not deserve a ruling now

- It adds orchestration while the repair half has no executor; every extra hop is another place to fail
  silently.
- The specialist fleet is overlays on stock base models with a signature strangers cannot check, so a panel
  drawn from it would likely measure n_eff ≈ 1 (as DR-0007's council did).
- The executive orchestrator lives outside this repository, so its state could not be checked here.

## If ruled in, the work is

1. D1/D2: an `action_class` field and an escalation record in `csoai.route-evidence/0.1` (`evidence.ts`,
   `execute.ts`), plus tests asserting the floor can only be raised.
2. D3: a panel admissibility check that calls `quorum-neff.mjs`, plus panel fields in the receipt; extend
   `council-runtime-truth-gate.mjs` to require `n_eff` on any panel artifact.
3. D5: an `observed-internal` telemetry sink kept out of `/api/gspc`, and a declared exploration share in
   `policy.ts`.
4. D7: a verb map in the AG-UI and A2A layers that points at existing tool names, with no new MCP tools.
5. The first slice above, gated on its DONE WHEN.
6. Names: rename or disambiguate per the ruling, swept across `distribution.json`, `layer0-automation.json`
   and the `/layer0` page in one PR.
