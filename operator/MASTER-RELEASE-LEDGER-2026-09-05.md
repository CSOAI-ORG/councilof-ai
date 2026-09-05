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

## Current release candidate

Branch: `codex/council-os-e2e-local`

Preview: `http://127.0.0.1:51026/dashboard?tab=home`

Local commits, in order:

1. `233d763c4` — one workspace shell, stale-chunk recovery, bounded chat continuity, concise MCP results, PWA foundation, and operator handoffs.
2. `dddd7cd3d` — canonical route-truth gate and withdrawal of dead industry destinations from the surfaced catalogue.
3. `2224942a1` — one MCP capability contract across runtime, well-known discovery, plugin metadata, and client copy.
4. `6c9fe2385` — signed, unsigned, and missing GSPC run evidence labelled separately and fail-closed.
5. `3fa0bf83a` — one scroll/spacing/heading contract, no nested workspace in framed pages, plus truthful web-app/MCP/extension install doors.
6. `d0efe80ea` — grounded definition of `MEASURED` and an executable runtime-truth gate.
7. `f039b2c3d` — records the verified candidate and remaining runtime gates.
8. `85fc8d15c` — legacy `/os` redirect expectations aligned with the canonical dashboard.
9. `5f6d952fa` — restores `/pricing-free` and aligns paid evidence/signature descriptions across UI, APIs, x402, MCP and the capability registry.

The weekend continuation adds a finite AG-UI board observation directly to chat,
with dated session retention, explicit refresh, bounded reads and retryable failure.

These changes are committed locally only. They are not merged, pushed, or deployed.

Verified on this candidate:

- The complete Vitest suite passes: 159 files / 976 tests, including 13 adversarial stream-reader tests and four new routing/retention tests. A direct Vite production build passes. Desktop (1440 px) and mobile (390 px) streamed-chat journeys pass. The broad repository TypeScript baseline remains red, with no diagnostics in files changed by this checkpoint.
- Route truth passes across 487 routes, 39 active navigation entries, 575 exact redirects, and 90 withdrawn routes.
- Eleven canonical workspace destinations return HTTP 200, render content, produce no page errors, and have no horizontal overflow at desktop width.
- The home workspace has no horizontal overflow at 390 px mobile width.
- Signed-card verification loads cleanly once the tracked signed corpus is materialised in the sparse preview checkout.

## Product blockers, ordered

### Completed locally — release and surface truth

- Clean non-iCloud preview now runs from the release-candidate branch; old preview ports are not sign-off sources.
- Known stale-chunk failures receive one bounded reload and a specific recovery state rather than a blank page.
- Route and capability parity now fail closed in automated gates.
- Dashboard, supporting pages, Settings framing, tool installation, and GSPC evidence use one shared shell and state grammar.

### P0 — action fabric

- Chat currently handles grounded answers, read-only MCP calls, and navigation.
- Guarded verbs correctly stop at review; they do not execute fixes.
- `/api/fabric` reports execution disabled; A2A key/route are absent, AG-UI health is unavailable, and A2UI is unbound.
- Implement one bounded, approval-based RAS journey with durable task state before claiming agentic remediation.

### P1 — learning, games, and simulation

- Council Space is the only live game surface.
- Current arena battles, quests, city/town, and training states are prototypes or frozen/local experiences.
- Implement them as views over one case/evidence graph; do not create separate truth systems.

### P1 — protocol execution and distribution

- MCP discovery is aligned and the eleven declared tools are surfaced from the canonical contract.
- The website has an installable-web-app contract and a network-honest service worker. The install prompt still depends on a production HTTPS/browser eligibility check; no native App Store wrapper exists.
- The Chrome extension remains developer/load-unpacked and Hugging-Face-only; there is no Chrome Web Store release.
- Central chat consumes the finite AG-UI board projection and renders its dated structured observation. General provider-run streaming and consent remain unbound. A2A is discovery-only, A2UI has no renderer, action storage is non-durable staging, and the latest receipt feed is unpublished.
- The precise eleven executable gates are in `operator/audits/COUNCIL-OS-RUNTIME-TRUTH-GATE-2026-09-05.md`.

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

- Exact-SHA local preview is visually approved by the owner.
- Route/capability registry gates pass.
- Stale-tab, chat restore, MCP summary, responsive, keyboard, failure-state, and catalogue destination tests pass.
- One RAS journey completes locally with explicit approval and candidate receipt.
- Every visible capability is LIVE, READ_ONLY, PREVIEW, UNAVAILABLE, or OWNER_GATED—never implied.
- No BFT, certification, compliance, OTS-confirmed, signing, or revenue claim exceeds the evidence.
