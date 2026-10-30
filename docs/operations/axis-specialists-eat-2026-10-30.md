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
