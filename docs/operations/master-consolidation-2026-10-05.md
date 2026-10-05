# Master product consolidation — 2026-10-05

Base: 02a16ca8ee2bbf589626eda58fa572308e997cdd (confirmed against GitHub master).

This source candidate recovers useful changes from the retained worktrees without replacing the newer master release. It does not claim deployment, new revenue, package publication or completion of a customer job.

## Recovered into this candidate

| Source | Disposition |
| --- | --- |
| 3573d4181 / duplicate f527dbbd1 | One copy of the evidence-bound revenue observation/report loop; no scheduler or outreach installed. |
| cfee115018 | Canonical owned redirects are distinguished from broken discovery. |
| ff27ffd9a | Coverage counts stay scoped to their artifact units. Tests derive expectations from the committed artifacts. |
| 744c53e05 | Mobile replies open the conversation drawer while a tool pane is active. |
| 7d8f9d9de | Product workflow endpoint and native dashboard pane, adapted to the current seven-section navigation and current worker endpoint. Source reads time out, malformed/error bodies fail closed, counters remain nullable, and repeat wallets never become customer claims. |
| 6a63b5c7e | Evidence-signal producer, traction page and links; current membership records retained. Old generated llms files and new private programme claims were not imported. |
| 391117aa8 | Structured wrapper measurement time and explicit unknown freshness in the API and wallet extension source. The local extension build regenerated its manifest digest; no package publication. |

Capability and OpenAPI artifacts are regenerated from the current declaration with the new read-only endpoint. Existing signed/timestamped evidence bytes are retained.

## Current master retained

The extension manifest scan already contains 71f2ce2b7. Extension-public 8ed293745 and repeat-payer 7e725a69c are ancestors of master. Current verifier code contains bounded recovery and adds withdrawal checks beyond 912ec4a8d. Current measurement-time and Layer 0 code supersedes d1af7a6e5; its seal boundary and distribution scripts already match. The MCP release candidate 6b6ecc43d is retained in history: it changes package version and older server code, so it is not used to replace the newer master server implementation.

## Preserved for separate reconciliation

All source refs and observed unfinished worktree changes are retained in the migration archive. The following are deliberately not represented as merged:

- Large divergent release branches: coverage-converged, coverage-feed-current, live-production-reconcile, flywheel-refresh, flywheel-refresh-release, layer0-guarded, layer0-release-docs, product-flow-current, product-on-release-owner, surface-convergence, unified-release and unified-release-current. Their historical release artifacts and generated snapshots need individual producer/release review; cherry-picking hundreds of old commits would restore superseded evidence and interfaces.
- The evidence-foundations course/older AG-UI integration in 7f135c1e2 and withdrawal-dependent indexing in f956ca720 need a focused reconciliation with today's learning and claim-maintenance code.
- 97dc0c301 and the membership-record part of 6a63b5c7e carry programme/participation assertions requiring their specific evidence records. The existing ledger is kept authoritative.
- 84d0bce98 changes fresh-compute SKU/discovery semantics; retain for an isolated payment-contract review. The active source worktree is preserved.
- f806f0a8b release-repository discovery needs repair before adoption: testing only the exit status of git rev-parse --is-bare-repository accepts a non-bare repository whose output is false.
- Old canonical counts, release bundles and source pins are retained as history rather than reapplied as current facts.

## Validation

- 106 focused Vitest tests passed (workflow, coverage, navigation, traction, momentum, wrapper and extension manifest).
- 32 revenue-loop Python tests passed.
- Wallet extension build, 11 Jest tests and its TypeScript check passed.
- Repository TypeScript ratchet passed at the existing 144 errors across 58 files; a clean global typecheck is not claimed.
- Client build passed, including capability, OpenAPI, source evidence, redirects, size and lazy-chunk checks. Full production prerender/deploy/readback gates remain the release lane's responsibility.
- No production deploy, paid invocation, outreach or scheduler activation was performed.

DEPLOY-LOCK.md reserves production writes to the Mac/CI release lane. This candidate is supplied through a PR to master.
