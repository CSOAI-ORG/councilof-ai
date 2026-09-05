# Council OS master release ledger — 2026-09-05

## Release objective

One branded, chat-first operating surface in which a person or agent can scope a case, inspect evidence, call governed tools, propose a safe fix, approve it where required, re-test it, and receive a scoped evidence receipt. Website, plugin, extension, app, MCP, A2A, AG-UI/A2UI, and API are front doors to the same capability and evidence contracts.

## Verified baseline

- Canonical remote snapshot at audit time: `2bf948504db36502825871c258741c25dbf7e5bc`.
- Deployment run `33934320792`: successful, including 814/814 launcher alignment and release gates.
- Production `board_totals`: RUNTIME_OBSERVED on 2026-09-05; 22 declared slots, 22 measured, 0 unmeasured. The returned evidence retains its own state and is not a certification.
- RunPod 3090 verified scope: 70/70 inference jobs, 5 models × 14 model axes, producing unsigned UNMEASURED candidates only.
- The three compared council legs were perfectly correlated (`n_eff=1.00`); BFT is not established.

## Preview truth

- `:4176` and `:4181` are old divergent worktree builds, not current remote master.
- Visual approval must use a clean preview built from the exact release candidate SHA.
- Main checkout is behind remote and heavily dirty; it is not an acceptable release source.

## Current release-candidate fixes on `codex/council-os-e2e-qa`

1. Stale deployed chunks: detect known dynamic-import/chunk failures, reload the current route once per missing asset, guard against loops, and show a specific recovery state if reload cannot heal it.
2. Chat continuity: bounded, schema-checked sessionStorage restores threads after reload; no transcript server; visible Clear history control.
3. MCP usability: structured `board_totals` becomes a concise truthful summary; the full raw MCP response remains available under disclosure.

These changes are local only. They are not merged or deployed.

## Product blockers, ordered

### P0 — release truth

- Build a clean exact-SHA preview and retire stale preview ports from sign-off.
- Add stale-chunk recovery E2E coverage across a simulated deployment.

### P0 — action fabric

- Chat currently handles grounded answers, read-only MCP calls, and navigation.
- Guarded verbs correctly stop at review; they do not execute fixes.
- `/api/fabric` reports execution disabled; A2A key/route are absent, AG-UI health is unavailable, and A2UI is unbound.
- Implement one bounded, approval-based RAS journey with durable task state before claiming agentic remediation.

### P1 — route and catalogue truth

- React route table contains duplicate ownership for `/challenge` and `/badges`.
- Edge redirects and React ownership diverge for `/globe`, `/plugin`, and `/enterprise`.
- Ten PRIMARY library entries currently resolve to review/withdrawn notices.
- Sixteen industry cards are surfaced while their dynamic destinations are withdrawn.
- Create one canonical route registry and fail CI whenever a surfaced item has no working destination.

### P1 — learning, games, and simulation

- Council Space is the only live game surface.
- Current arena battles, quests, city/town, and training states are prototypes or frozen/local experiences.
- Implement them as views over one case/evidence graph; do not create separate truth systems.

### P1 — plugin, extension, app, and protocol truth

- Live MCP advertises 11 tools; plugin metadata, README, and other surfaces advertise conflicting counts.
- Verifier semantics differ between extension, site, and MCP.
- Chrome extension is developer/unpacked and Hugging-Face-only.
- Current web manifest is not evidence of a real offline/installable app; no service worker/native wrapper was found.
- A2A/AG-UI/A2UI/provider states must come from one runtime capability registry with explicit unavailable states.

## Canonical RAS lifecycle

`scope → collect → measure → explain → propose fix → approve → execute safely → retest → attest → monitor → reopen/revoke`

Signatures and timestamps prove the scoped evidence/result. They do not make the repair and they do not confer legal certification.

## Owner gates

- production merge/deploy
- any external email, post, submission, or partnership contact
- npm, marketplace, extension-store, or dataset publication
- estate signing-key use or re-signing
- enabling autonomous schedules/OIDC signing
- wallet funding, payment, or financial transaction
- account/OAuth/admin changes

## Exit criteria for the next release

- Exact-SHA local preview is visually approved.
- Route/capability registry gates pass.
- Stale-tab, chat restore, MCP summary, responsive, keyboard, failure-state, and catalogue destination tests pass.
- One RAS journey completes locally with explicit approval and candidate receipt.
- Every visible capability is LIVE, READ_ONLY, PREVIEW, UNAVAILABLE, or OWNER_GATED—never implied.
- No BFT, certification, compliance, OTS-confirmed, signing, or revenue claim exceeds the evidence.
