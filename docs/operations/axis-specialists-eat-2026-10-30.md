# Axis specialist EAT — 30 October 2026

Council of AI — Council for the Safety of Artificial Intelligence

## Result and scope

The specialist audit now labels a well-formed evidence URL or digest as `DECLARED`, separately from a verified structural `PASS`. Malformed declarations produce findings. Findings take precedence over an unmeasured-gap label. The pane says that proposals require human review, checks summary totals against the actual checks, and refuses malformed or mismatched responses.

This is a tested candidate repair of the deterministic audit and its interface. It does not establish verified source bytes, measured improvement, completed human review, autonomous evolution, or a deployed release.

The generator correction and its 15 regression cases recover the relevant work from closed, unmerged PR #3607 at `f21d4fab87ded0f10eb24ff103f2023c26d9f1ff`. The UI adds stricter structural checks and 11 boundary cases. Only these changes and their 35 unsigned generated JSON outputs were carried forward; the earlier branch's unrelated history was not included.

## Evidence from M4

| Check | Before repair | Candidate |
| --- | --- | --- |
| Existing API/A2A/pane tests plus generator regressions | 56 passed, 10 failed | 66 passed |
| New response-boundary cases | 1 passed, 10 failed | 11 passed |
| Combined focused suite | 20 reproduced failures across the two baseline runs | 77 passed, 5 files |
| Generator consistency | — | 33 specialists, 35 files current |
| Generator self-test | — | Identity, required fields, human gates, unmeasured promotion, duplicate registry and autonomous apply controls passed |
| Component TypeScript check | — | Passed |
| Actual browser component + production stylesheet + actual GET handler | — | 10 scenarios passed; all 33 axes rendered their own audit |
| Browser errors / write requests | — | 0 / 0 |
| Desktop / mobile | — | 1280px / 390px; screenshots inspected, mobile CSS and overflow asserted |

The browser suite covers honest declarations, all-axis selection, unmeasured gaps, corrupted totals, cross-axis responses, unknown check states, HTTP 503 and retry, late prior-axis responses, mobile layout, and absence of writes. It runs on loopback; it is not a test of the deployed dashboard shell.

Baseline source: `cc3a69c19747710e95bd24b827c8659584d96bfd`. Subsequent master `1ad5cfcb4b6df3885c5c6d025f8c2aa6e2fc669f` changed unrelated site-presence and root-proof work; the specialist generator, pane, handler and generated artifacts were identical.

The captured board stays unchanged. All 33 human gates remain HOLD, all 66 proposals remain unapplied, declared clusters remain unprovisioned, and domain-specific negative controls remain SPECIFIED_NOT_RUN. Browser regression tests do not relabel those domain controls as executed.

## Reproduce

```sh
node scripts/axis-specialists.mjs --check
node scripts/axis-specialists.mjs --selftest
node node_modules/vitest/vitest.mjs run scripts/axis-specialists.evidence.test.mjs client/src/components/gspc/CouncilAxisSpecialistPane.test.ts client/src/components/gspc/CouncilAxisSpecialistPane.boundary.test.ts functions/api/axis-specialists.test.ts functions/api/a2a.axis-specialist.test.ts
node node_modules/typescript/bin/tsc --noEmit --target ES2022 --module ESNext --moduleResolution Bundler --jsx react-jsx --resolveJsonModule --esModuleInterop --skipLibCheck client/src/components/gspc/CouncilAxisSpecialistPane.tsx
CHROME_PATH="/path/to/chrome" EAT_BROWSER_OUTPUT="/path/to/results" node scripts/axis-specialists.browser.mjs
```

The browser command also works without CHROME_PATH when Playwright Chromium is installed. The output directory receives JSON results and desktop/mobile screenshots. No inference provider or external page is contacted by this test.

## Completion sequence

1. **Done in this candidate:** reproduce the failures, repair the generator and reader, regenerate unsigned outputs, and test the actual browser behaviour.
2. **Release checks:** pass protected GitHub checks for the combined tree and integrate through the repository's normal merge process. Production deploy is GHA on master only.
3. **Served verification:** after deployment, check the public specialist API and dashboard for the new declaration totals, retry/failure states and unchanged HOLD. A candidate browser pass is insufficient to close this step.
4. **Separate ongoing work:** compose the human-review and authority candidates with the release-owner workstream, complete real operator enrollment, and resolve provider authorization through their existing owners. This repair does not mark those workstreams complete.

GSPC supplies the measurement boundary. This MEOK component supplies deterministic checks and bounded recommendations. Actual improvement requires a repeatable cycle: propose, test against fixed criteria, retain evidence, obtain the required authority decision, apply the authorized change, and remeasure. The present patch strengthens the checking and evidence stages.

## Follow-through: all-axis charter and review journey

The existing specialist flow now joins all 33 source axes to the frozen operational charter and the existing human-review console. The reviewed cross-reference list lives in `council-os/axis-specialists/charter-map.json`; the generator verifies the actual charter bytes and version, exact axis membership and valid article references before producing the same 35 unsigned specialist artifacts. It does not alter the charter, snapshot, measurements, domain controls or admission rules.

For every axis, the pane exposes mapped article titles, required evidence fields, the current measurement endpoint, the matching competency briefing and the correction route. The captured 28 October audit is visibly distinguished from the current record. The browser recomputes both audit-body and source-row digests and requires the generated application's exact audit pin. Altered content or mixed application/API versions fail closed and ask for a reload. This verifies content against the application build; it is not a signature or a verification of the underlying evidence claims.

A reader can explicitly select one existing proposal, acknowledge that its identifiers will be public, and send it through the existing `/api/hitl/challenge` handler. The request binds axis, proposal, audit digest, charter version/digest, source-row digest and snapshot. It carries no editable private note or credential. The returned challenge must match that exact request and verify under the existing challenge-id rule before the existing `HitlConsole` receives it. Stored, stateless and unconfirmed outcomes remain distinct. Concurrent clicks and in-session repeats of an uncertain submission are blocked; writes are never retried automatically. This is an in-session duplicate guard, not server-side idempotency across browser sessions.

The shared human-review store module explicitly imports its Cloudflare KV type. The all-axis handler integration test lives beside the server handler, while client contract tests remain in the client tree. This lets the browser reuse the same challenge contract without pulling a worker entrypoint into the browser TypeScript project. No runtime behaviour or TypeScript gate threshold changes.

The human console retains its existing competency, operator, storage and receipt controls. A successful challenge submission is not a decision or execution authority. The code does not appoint 33 reviewers, provision clusters, sign evidence or promote any of the ten unmeasured axes. Protected production release and genuine human acceptance remain separate.

### Executed plan and acceptance

1. Reconcile the existing 33 definitions, current charter bytes and parallel delivery records: complete. The cross-reference is non-normative and does not claim legal equivalence.
2. Extend the existing generator, API payloads and pane: complete. All 33 mappings and review paths are generated; all 66 proposals remain recommendation-only.
3. Connect the existing human-review handler and console: complete in local acceptance. The handler integration test submits a bound request for every axis using disposable fixture storage, without a decision or external effect.
4. Test failure, recovery and narrow screens: 101 focused tests and 16 browser scenarios passed on M4. Browser tests use the actual pane, production styles and actual specialist/HITL handlers with a captured board and fixture storage. They cover all 33 selections, forged content, late responses, explicit submission, double-click protection, stateless storage, failed writes and response mismatch. The embedded journey fits 320px; desktop and 390px paths also pass. These are automated local checks, not representative-human or deployed-site acceptance.
5. Protect the journey on future changes: the existing `pr-gates.yml` now runs generator consistency and this browser journey after its existing Chromium preparation, and retains the JSON result. The blanket unit stage also covers the new contract tests. The PR checks must pass on the exact combined tree before release.
6. Close measurement admission separately: accepted methods, qualifying measurements, missing private serving material and genuine independent/human review remain open. Existing evidence work is in PR #3645, charter federation in PR #3646 and the public working-group tracker in PR #3641. These are linked workstreams, not an assertion that those candidates are merged or deployed.

Charter bytes retained: `3dcf79a7526785324ef15deaa40adabc5e77fbc99c4ebd089309d948c3c3e32e` (version 0.1.0). Browser acceptance and selected tested-source hashes: [axis-charter-journey-2026-10-30.json](axis-charter-journey-2026-10-30.json).

```sh
node scripts/axis-specialists.mjs --check
node scripts/axis-specialists.mjs --selftest
node node_modules/vitest/vitest.mjs run scripts/axis-specialists.charter.test.mjs scripts/axis-specialists.evidence.test.mjs client/src/lib/axisSpecialistReview.test.ts functions/api/axis-specialist-handoff.test.ts client/src/components/gspc/CouncilAxisSpecialistPane.test.ts client/src/components/gspc/CouncilAxisSpecialistPane.boundary.test.ts functions/api/axis-specialists.test.ts functions/api/a2a.axis-specialist.test.ts
EAT_BROWSER_OUTPUT=/absolute/private/results node scripts/axis-specialists.browser.mjs
```
