# Council OS master consolidation and execution plan

**Decision date:** 4 September 2026  
**Branch:** `codex/council-master-consolidation`  
**State:** local review candidate; not deployed  
**Release rule:** show the production-shaped preview first, then one reviewed
GitHub Actions release from `master`

## Verified execution checkpoint

The production-shaped Pages preview is running locally at
`http://127.0.0.1:4178/dashboard/?tab=home`; it is not a production deploy.
The current candidate has:

- one chat-first dashboard with ten permanent user jobs and the specialist
  estate in **All tools**;
- a real cold-load bridge from `/os?lobby=…` and `/gspc-scoreboard` into that
  same dashboard, including preserved embed/context query parameters;
- a visible in-game boundary that keeps every quest result as local practice
  until explicit candidate review, independent reproduction and admission;
- a mobile layering regression guard so cookie consent remains visible without
  making the Workspace launcher unreachable;
- a non-mutating CI TypeScript ratchet holding the existing ceiling at 199
  errors across 108 legacy files, with zero observed errors in the canonical
  dashboard files; and
- a successful client build (4,278 modules) plus a full `/dashboard/`
  prerender (1/1 route, zero thin, zero errors); and
- 22/22 production-shaped shell checks passing across desktop and mobile,
  including all panes, legacy doors, chat routing, tools, quests and the
  human-review learning path.

The candidate is still 41 commits behind the moving local `master` and has 394
dirty paths after generation/preview work. It must be ported file-by-file onto
current master. Do not rebase or copy the worktree wholesale: current master
contains a later `Dashboard.tsx` heading fix and newer catalogue/standards
components that the stale branch would overwrite.

The wallet-retirement repair is isolated and clean on
`codex/retire-compromised-wallet-secret` at commit `8f340b98d`; it is not
pushed, merged, deployed, or a substitute for credential rotation/history
coordination.

## Authority and precedence

For execution decisions, evidence wins in this order:

1. current runtime receipts and independently repeatable probes;
2. repository code, fixtures and test output at an exact revision;
3. committed decision records;
4. local worktree proposals;
5. pasted terminal transcripts, generated rundowns and historical claims.

This document is the execution authority for the consolidation. The two long
blueprints are its product and technical references. Pasted status rundowns,
quantity-based EAT plans and the attachments remain historical research; this
does not delete them, but they cannot set release state.

## Goal mode

**Goal:** make one Council OS journey work end to end for a stranger:

> Ask a question or nominate a subject, agree the scope and permissions, run a
> bounded measurement, retain failures and unknowns, reproduce it, admit it
> independently, sign the admitted record, include it in the public root,
> verify any optional witnesses, propose a safe fix, obtain the required human
> approval, retest, and keep the result current when its sources change.

The immediate release is complete only when that journey uses one request ID,
one event history and one evidence vocabulary across the web, MCP and the local
worker fixture. A catalogue, configured provider, signature, payment, game
score, timestamp request or attractive UI is not completion.

This supersedes the older four-TUI note whose target was “see 7 empty cells.”
Empty and failed cells remain important, but the current goal is the complete,
fail-closed request spine above.

## Canonical document set

This page is the operating index. It does not duplicate the detailed research.

1. `docs/blueprints/COUNCIL_OS_PLATFORM_BLUEPRINT_2026-09-04.md` — product,
   business, roles, packs, website, learning and 90-day plan.
2. `docs/blueprints/GSPC_INTEROP_GROWTH_BLUEPRINT_2026-09-04.md` — RAS,
   protocols, Hugging Face, witness rails, regulated adapters and conformance.
3. `docs/handoff/TUI1_FRONTEND_LEARNING_2026-09-04.md` — product experience.
4. `docs/handoff/TUI2_BACKEND_EVIDENCE_2026-09-04.md` — execution and evidence.
5. `docs/handoff/CLAUDE_MASTER_RELEASE_2026-09-04.md` — integration and release.
6. `docs/handoff/HERMES_AUDIT_COORDINATION_2026-09-04.md` — truth ledger,
   collision control and commercial/IP scorecard.
7. `docs/handoff/HERMES_CLAIM_EVIDENCE_LEDGER_2026-09-04.md` — the only
   current seeded claim/state register; update it rather than creating another
   status rundown.

If another note conflicts with these documents, it is historical until Hermes
records a reviewed superseding decision.

## The product in one sentence

**Council OS turns a consequential AI or system claim into scoped,
reproducible, signed and correctable evidence.**

GSPC is the versioned measurement vocabulary. RAS is the governed request and
event contract. Council OS is the conversational workspace. Industry packs
map current obligations and evidence requirements onto the instruments.
Workers execute frozen plans. Independent reproduction and admission decide
whether a result may become `MEASURED`. Signatures, roots and witnesses make
the resulting record portable; they do not make it true or legally compliant.

The honest user answer is therefore not a bare “yes, you are compliant.” It is:

> Here is the scope I understood, the jurisdictions and versions used, what I
> could and could not inspect, the fixes I can safely propose, the decisions a
> human still owns, the result after retest, and the record you can verify.

## One fabric, not many products

```text
Council OS / HF / MCP / A2A / SDK / extension / legacy adapter
                              |
                    Attestation Request
                              |
       identity + scope + consent + approvals + cost ceiling
                              |
              frozen plan + capability selection
                              |
        browser / 3090 / on-prem / approved provider worker
                              |
                  content-addressed raw evidence
                              |
             reproduce -> admit -> sign -> root
                              |
        OTS / Sigstore / SCITT / ledger witness projections
                              |
             explain -> fix approval -> retest -> monitor
```

Every outer surface is a projection of the same request. No adapter may create
its own grade, state vocabulary, root, verifier or signing authority.

## Canonical state and authority

The request owns orthogonal state, because payment, execution, measurement,
approval and witness status are different facts.

| Dimension | Minimum states | Authority |
| --- | --- | --- |
| Request/workflow | `DRAFT`, `SUBMITTED`, `TRIAGED`, `SCOPE_PROPOSED`, `AUTH_REQUIRED`, `SCOPE_LOCKED`, `QUEUED`, `RUNNING`, `EXECUTION_COMPLETED`, `REPRODUCTION_PENDING`, `ADMISSION_PENDING`, `DELIVERY_READY`, `DELIVERED`, `MONITORED`; typed exceptions include `INPUT_REQUIRED`, `REJECTED`, `FAILED`, `CANCELLED`, `EXPIRED`, `DISPUTED` | RAS command/event service |
| Evidence | `OBSERVATION`, `REPORTED`, `CANDIDATE_FINDING`, `REPRODUCED` | intake, worker and reproducer receipts |
| Measurement | `UNMEASURED`, `UNCHECKABLE`, `MEASURED`, `STALE`, `SUPERSEDED`, `REVOKED` | independent admission only |
| Credential | `NONE`, `ADMITTED`, `SIGNED`, `SIGNATURE_INVALID` | admission service, then isolated signer |
| Root | `NOT_INCLUDED`, `INCLUDED`, `PROOF_AVAILABLE` | canonical root service |
| Witness | `NOT_REQUESTED`, `PENDING`, `WITNESSED`, `FAILED`, `EXPIRED` | independently verified receipt |
| Approval | `NOT_REQUIRED`, `REQUIRED`, `APPROVED`, `DENIED`, `EXPIRED` | named accountable human/role |
| Payment | `NOT_REQUIRED`, `REQUIRED`, `VERIFIED`, `SETTLED`, `FAILED`, `REFUNDED` | payment rail, never admission |

The current public matrix is deliberately fail-closed: 1,066 historical
signature-valid records are `LEGACY_UNADJUDICATED`; independently admitted and
quotable cells remain zero until a separate admission verifies. The declared
22-axis registry is a vocabulary, not proof that 22 axes are currently
measured.

## What the two new attachments change

The attachments are research inputs, not executable instructions or release
evidence.

| Item | Decision | Reason / next treatment |
| --- | --- | --- |
| Current XRPL primitives: Credentials, MPTs and permissioned features | **MERGE AS A VERIFIED GAP** | Existing adapters are heavily IOU/trustline oriented. On the 4 September Mainnet probe, Credentials, MPTokensV1, PermissionedDomains and PermissionedDEX were enabled; several newer amendments were supported by software but not enabled. Persist `ENABLED`, `SUPPORTED_NOT_ENABLED` and `UNSUPPORTED` separately, then add pinned-ledger fixtures. |
| “Every institutional RWA issuance is an MPT” | **QUARANTINE** | The universal claim is not established and must not enter copy, forecasts or instruments. |
| XRPL Credentials as a portable attestation carrier | **RESEARCH / PROTOTYPE** | Potentially useful as a witness or eligibility observation. It is not Council admission, identity proof or legal status by itself. |
| ERC-3643/T-REX, BENJI, SWIFT and COBOL mappings | **MERGE AS PACK/ADAPTER WORK** | Typed read-only observations under the same RAS contract; no automatic compliance conclusions. |
| Real OTS verification and pending-to-Bitcoin upgrade | **MERGE** | Verify detached binary stamps against the exact bytes/root. Batch eligible leaves into one root. |
| Plain-text files named `.ots` | **RETIRE / QUARANTINE** | A filename or JSON statement is not an OpenTimestamps proof. Preserve for audit; never publish as witnessed. |
| Existing public atom-root OTS stamps | **P0 INVALID FOR CURRENT TARGET** | Two stamps parse as pending proofs but their embedded file digests do not match the current JSON bytes. Remove them from release and regenerate only after freezing the exact target bytes. |
| Current SCITT/COSE implementation | **P0 PROTOTYPE-ONLY** | The repository is not a Transparency Service: existing vectors use placeholder signatures and the wrapper does not construct a valid new COSE signature. Implement genuine COSE_Sign1, current SCITT media types, SCRAPI client fixtures and receipt verification before any SCITT claim. |
| PQ-continuity disclosure | **MERGE** | Record present algorithm and migration/re-sign plan honestly. Ed25519 today is not a post-quantum signature. |
| `csoai-wiring-wave.py`, `csoai-eat-more.py`, “300/340 moves” generation | **RETIRE AS EXECUTION** | These reward file, route and card volume rather than admitted evidence. Extract useful research questions only. Do not run or port the generators. |
| Typed inventory/revenue/market totals in the transcripts | **NEEDS VERIFY** | Counts and forecasts must be recomputed from current sources with dates, denominators and licences. |
| Wallet secret copied into readiness/queue artifacts | **P0 COMPROMISED** | Never fund it. Remove it from release inputs, rotate/replace it, scan tracked files and history, and treat every appearance as secret material. |
| “Configured” x402/facilitator claims | **NEEDS RUNTIME RECEIPT** | Configuration is not a settled payment. Require v2 conformance plus an owner-approved end-to-end receipt. |

## Today’s operating sequence

### Gate A — Freeze truth and remove release hazards

1. Hermes inventories all dirty paths and assigns each to TUI 1, TUI 2,
   Claude, historical/quarantine or preview noise.
2. Quarantine the volume-generating EAT plans and all false `.ots` patterns.
3. Find and remove the exposed wallet secret from the proposed release; record
   rotation/history-remediation as an owner security gate.
4. Quarantine the invalid XRPL settlement cards, mismatched public OTS stamps
   and placeholder SCITT/COSE vectors from every root, board and release input.
5. Freeze the request/state/error vocabulary and capability registry inputs.
6. Record production as unchanged until the served commit is independently
   observed.

**Exit:** one reviewed manifest contains no secret, fake witness, unexplained
deletion, generated-count claim or unowned P0.

### Gate B — Make the local product feel complete

1. TUI 1 finishes the single chat-first dashboard: persistent composer,
   in-frame tools, right-side workspaces/history, account menu and consistent
   brand/spacing.
2. Map all old launchers and tabs into ten user jobs: Ask, Requests, Verify,
   Evidence, Measurements, Improve, Learning, Watchdog, Standards and
   Connections.
3. Games, Coliseum, simulation and city are views over a request/evidence case,
   not independent boards. A result begins as `OBSERVATION`.
4. Demonstrate desktop and mobile, one tool, one game, one report and one
   candidate without promoting state.

**Exit:** a stranger can navigate the whole experience without encountering a
second shell, duplicated top bar, conflicting brand or fabricated live state.

### Gate C — Prove one end-to-end fixture

1. TUI 2 implements or stages the durable RAS/event contract, idempotency and
   one bounded executor fixture.
2. The executor records exact subject/model revision, container/environment,
   input digest, outputs, errors, time, hardware class and provider.
3. Reproduction is independent of the executor that produced the candidate.
4. Admission uses a separate key/authority from execution and signing.
5. Sign the admitted body, include its digest in the one canonical root and
   verify the inclusion proof offline.
6. Request optional witnesses only for that exact digest/root and show pending,
   failed and verified states separately.
7. Treat SCITT as an optional projection: only a separately verified receipt
   over the already frozen bytes may set the SCITT witness state.

**Exit:** replaying the same idempotency key returns the same request, a
tampered artifact fails, an unavailable provider remains typed, and the matrix
changes only after independent admission.

### Gate D — Show, then release once

1. Claude integrates explicit reviewed paths only; no `git add -A`.
2. Run focused contracts, the full unit suite, client build, shell E2E,
   prerender and all claim/brand/price/redirect/signed-JSON gates.
3. Hermes reconciles test counts, claims, roots, witness status and the exact
   candidate commit.
4. Show the local production-shaped preview to the owner.
5. After approval, merge once and let the GitHub Actions master workflow be the
   only deployment writer.
6. Verify the workflow commit, production domain, Pages alias and anti-clobber
   interval.

**Exit:** the served site matches the reviewed commit and the verified release
manifest. A green workflow without matching served bytes is not completion.

## RunPod and the 3090

The RTX 3090 is a bounded worker in the execution plane. It is not Council OS,
the admission service, signer, public root, training authority or backup.

For each accepted job the worker receives a frozen manifest and returns raw,
content-addressed candidate outputs plus a resource receipt. It receives no
board/adjudicator/signing keys, Cloudflare/Hugging Face/npm credentials, wallet
secrets or authority to publish. The controller enforces cost, data-egress and
capability policy. A fallback that changes model revision or environment needs
a new approval or a pre-approved equivalence rule.

The safe offload tool at
`/Users/nicholas/clawd/_evacuation/safe-runpod/safe_runpod_offload.py` is
currently dry-run only. Its reviewed 4 September plan covers 8,957 files and
383.064 MiB, separated into preservation and quarantine. The available A100
pod has no attached account Network Volume, so a transfer to it would be a
working copy, not durable backup. The old S3 credential is stale. A durable
copy therefore remains blocked on either a Console-created RunPod S3 key or an
explicitly attached approved Network Volume. Never describe a working copy as
backup, signed or anchored.

No general training loop is enabled. Build provenance-filtered admitted-
evidence retrieval first. Do not train a GNN/NN until there is a stable graph
schema, purpose-specific consent, rights-cleared data, enough admitted edges
and a benchmark showing a benefit over retrieval plus deterministic reducers.

## Growth sequence

Growth is coverage with a denominator and quality gates, not mass badging.

1. **Council OS:** one excellent request/verify/fix/retest experience.
2. **Hugging Face N-site adapter:** one Explorer Space, one collection/dataset
   contract, immutable model lineage, eligible-set denominator and opt-in
   model-card integration. Listing remains `CATALOGUED`, not `MEASURED`.
3. **Platform doors:** generate MCP, OpenAPI, SDK and plugin metadata from the
   same capability registry; then pass OpenAI/Anthropic client conformance.
4. **Next N-sites:** Kaggle and others implement the same adapter contract;
   they do not create new truth stores or scrape outside terms/licences.
5. **Coverage flywheel:** sentinels, representative strata, drift/incident
   queue and randomized long tail; publish failures, freshness, reproduction,
   correction latency and stranger-verification success.
6. **Industry packs:** GPAI/enterprise first; financial/tokenized assets or
   insurance second when a real design partner and domain reviewer exist;
   COBOL/legacy as the first infrastructure adapter; Watchdog remains free.

## Revenue, funding and IP

The product family remains simple even though it supports several revenue
motions.

| Motion | Buyer pays for | Evidence firewall |
| --- | --- | --- |
| Measurement and remeasurement | bounded run, evidence handling, reproduction coordination and delivery | Payment never changes a predicate, admission or result. |
| Continuous evidence operations | source/pack monitoring, private connectors, diffs, exports, retest cadence and SLA | Customer retains the legal/deployment decision. |
| Connect and on-prem integration | MCP/API/A2A/SDK, legacy/ledger connectors, deployment and conformance engineering | Adapter cannot become an authority or separate verifier. |
| Rights-cleared aggregate signals | disclosed, privacy-safe portfolio/index feeds and benchmark-quality histories | No private complaints, customer evidence or unlicensed outputs are resold. |
| Sponsored instruments and pack research | openly scoped method engineering and independent reproduction | Funding and conflicts are disclosed; sponsor cannot buy a conclusion. |

Grants and standards participation are funding/credibility channels, not
customer revenue. Applications may be public and evidence-backed; operator
paste instructions, internal timings and private send bundles stay private.
No email, grant submission, financial transaction, npm/HF publication or paid
probe is automatic without the named owner gate.

Protect the true IP: the versioned axes and instruments, admission policy,
canonical card/evidence schema, correction history, capability/pack compiler,
and the rights-cleared evidence corpus. Open-source thin adapters and verifier
fixtures to increase adoption without giving away signing keys, adjudicator
authority or proprietary instrument banks. Run the mandatory OIN Linux-System
scope check before any patent filing; never move keys or the instrument estate
into a conflicted owner.

## Four non-overlapping lanes

| Lane | Owns | Does not own | Today’s proof |
| --- | --- | --- | --- |
| **TUI 1 — product experience** | dashboard shell, job navigation, chat/composer, in-frame tools, learning/Coliseum views, responsive brand and UX E2E | Functions, admission, signing, roots, deployment | desktop/mobile preview; one tool/game/report/candidate; no state promotion |
| **TUI 2 — execution and evidence** | RAS/event contracts, worker/reproduction receipts, admission separation, reducers, witness verification, current read-only adapters | visual redesign, release branch, production deploy | deterministic fixture through candidate/reproduction/admission/card/root plus negative cases |
| **Claude Master — integration/release** | exact-path release manifest, conflict resolution, gates, one master merge and post-deploy verification | new feature design, historical-data promotion, bulk generation | reproducible gate log and served-commit match after owner-approved release |
| **Hermes — audit/coordination** | claim/evidence ledger, dirty-file ownership, attachment triage, revenue/growth/IP scorecard, collision detection, decision log | implementation, secrets, spending, external contact, signing or deployment | no duplicate assignment; every claim has state/evidence/owner/freshness/blocker |

No two lanes edit the same file concurrently. Hermes resolves collisions before
work resumes. Product defects go back to TUI 1 or TUI 2; Claude does not fix
them opportunistically during release.

## Owner gates

Only these decisions should interrupt implementation:

- production deployment after the shown preview;
- use of paid compute/provider calls above the agreed ceiling;
- new/rotated provider, RunPod S3, wallet, signing or adjudicator credentials;
- public package, Hugging Face, app-store or model-card publication;
- emails, grant submissions, partnerships or standards communications;
- financial transactions, chain writes and the first real settlement test;
- legal language, accredited certification claims and regulated-industry
  determinations;
- key custody, external reproducer/adjudicator appointment and IP filings.

## Release definition of done

- one request ID and event history across web, MCP and fixture worker;
- one canonical capability registry generates external declarations;
- one declared 22-axis registry, with current measurement state derived only
  from independently admitted cards;
- one verifier/root domain and byte-identical offline fixture;
- no plaintext secret, fake `.ots`, typed estate count or unreviewed bulk-
  generated artifact in the release;
- the 3090 emits candidates only and cannot admit, sign or publish;
- games and reports cannot train or update GSPC directly;
- every fix is proposed, scoped, approved where required, retested and receipted;
- every regulatory source and industry pack is versioned and dated;
- every page explains what was measured, what was not, limitations, decision
  owner and correction path;
- the owner sees the local result before the only production deployment.
