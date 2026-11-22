# Public evidence journeys and workspace navigation — 12 November 2026

Status: tested source candidate; not a deployment or full-platform acceptance.

## Scope

The live browser audit reproduced a collapsed desktop sidebar. A published-board question answered, while a normal question about using Council of AI returned a no-tool-match fallback. The audit did not independently establish shared conversation state across header Ask, bottom composer and the floating chat control. Those chat and MEOK acceptance tests remain outstanding.

This change adds a prominent Public Watchdog section to the actual root page, six homepage anchors, Academy/practice/human-review journeys, native disclosures and FAQs whose JSON-LD is generated from the same visible text. Existing board, HomeMine report band, external-use evidence, developers and updates are retained. It opens desktop navigation by default, preserves the closed mobile default and prevents an initially visible desktop sidebar from stealing focus.

Watchdog is a public evidence-reading journey, not a staffed incident-response service. Practice does not grant authority, certify competence, change the public benchmark or prove model training. No incident data, personal information, case decisions, scores, signed records, provider credentials, paid calls or production permissions are changed. No contact mailbox or registered legal identity is invented.

## Executed validation

At 2026-11-12 01:27 UTC, Vitest 4.1.11 executed the two new test files with an isolated configuration: automatic JSX, the repository client alias, one worker and no file parallelism. Result: **2 files, 19 tests passed**, duration 10.47 seconds. The source transformations in the release packet are the same transformations applied to the pinned source for that run; the protected repository build and full test suite remain separate required checks.

Reproduce the bounded suite from an installed repository:

```sh
npx vitest run --config vitest.public-journey.config.ts
```

The suite covers rendered Watchdog/learning destinations, no public incident form, practice/authority boundaries, visible FAQ/structured-data equality, existing homepage-band preservation, six real anchors, initial desktop/mobile navigation, explicit-open focus, scoped Escape handling, responsive transitions and listener cleanup.

Not performed by this receipt: full production build, deployed mobile/desktop visual acceptance, all-page link audit, genuine MEOK inference, cross-entry conversation persistence, authenticated company storage, paid x402 fulfilment, new model measurement or staffing acceptance. A schema-valid FAQ does not promise search-engine or AI-answer inclusion.

## Coordination and release

Input source: `0663a4395fc331b904804169b47a427c3a712d3d`. The subsequent master `002a232ba5b01b08f5f8b0755e4d2136620e84f6` changed only three evidence-fabric research-cycle files, not this territory. HomeMine/report owners #4238 and #4219 are preserved. The shared control note is additive; no worker, reviewer or deployment authority is invented.

Release through the existing protected PR and master deployment pipeline. Before calling this live, verify the deployed revision, the Watchdog anchor and destinations, default-open desktop navigation, closed mobile drawer, keyboard behaviour, responsive wrapping and unchanged report/evidence surfaces. Keep chat unification and MEOK inference as separate acceptance items.

## Original source digests

These digests identify the original `f06e77ba09438c1192f72475c5f1f6a7ad29f523` candidate bytes, before the review fixes below; they are not signatures or correctness proofs.

- `client/src/pages/HomeVerify.tsx`: `cffab38817bd070eca9ca0137cac1b48c1e3ab7a7c70558569bc455d1eefc67f`
- `client/src/components/home/HomeHero.tsx`: `f8f6fc46907da65d7c6fbb1125f17d832c085864a17206e7af65d4fdc46d3c8b`
- `client/src/components/home/HomePublicJourney.tsx`: `87b08687a3bd1b037f421d1434261152df402e3771b3b1cdd20abf67586eb832`
- `client/src/components/home/HomePublicJourney.test.tsx`: `8a98c761054ab21a858448c9da95144af4d825068d2d4eea73d7c4a9bd3709f2`
- `client/src/styles/home-public-journey.css`: `3d400eb24074cda738e5c35d6daf57f5300335e22d9e035c7968c17c9a2f0cc9`
- `client/src/components/DashboardLayout.tsx`: `976a70921c7a72d2fe0ece704af9de5814daacdf368175f69bd5c03005f61713`
- `client/src/components/lobby/useWorkspaceNavigation.ts`: `552f8f6969dd2ff5455fb5da0223d8067bcb8c9ad22090cc03732aa0efd31ba8`
- `client/src/components/lobby/useWorkspaceNavigation.test.tsx`: `d55577ab5b04ad6b1fcc3835c5aa3afc24a53bacc8bee42cdfb8115b1a2b2586`
- `vitest.public-journey.config.ts`: `ae82e6541dbbaaaf59db39ef8438ffaf2e4544b6b7813931b4ef14d9ad0272ee`

## Review fixes and integration check — 12 November, 01:42 UTC

Independent source review and a live browser visit found that the first claims action used the legacy `?tab=watchdog` route, which opens Corrections. It now opens `/watchdog/`, the existing claims picker. The research-library and corrections actions retain their distinct destinations.

The previously omitted existing homepage test reproduced a real integration failure: its mounted-source inventory did not include the new component that owns the Watchdog and learning anchors. The inventory now includes that component, with the assertion preserved. The focused configuration now runs that existing test file too. The unchanged repository Vitest configuration executed all three affected files on M4: **43 tests passed, no failures or skips**. The focused configuration also passed the same 43 tests.

The existing shell browser tests now assert the requested desktop-open/mobile-closed default, including after reload, while retaining toggle, navigation, Escape, focus and overflow checks. Account-menu access no longer unconditionally tries to open an already visible desktop menu. These updated browser checks still require the protected build and a real browser run; this source receipt does not claim that they have passed.

### Reviewed source digests

- `client/src/components/home/HomePublicJourney.tsx`: `2803642aec821f6221ff66191052237935b7e6e0f3b03d3bbc13341f53f5d46e`
- `client/src/components/home/HomePublicJourney.test.tsx`: `b8de1550b58b1792dd79d882259364e610370e6f9d79f220fc7d1e532d679290`
- `client/src/pages/HomeVerify.test.ts`: `408f97102e5ee1a611ca6c38f5aadbf7941b0651ce8e8333a0907590de7ef428`
- `e2e/tests/dashboard-shell.spec.ts`: `d6500240ed95fb09bfe45b115cf34a446dc49bedc56c3904108824a6a236c0f7`
- `vitest.public-journey.config.ts`: `98194ca7a843c6d51ac2dccc8d45fcd777df68e21842b65f8a22d0a8ab092c1a`

## Concurrent protected CI correction retained

The concurrent branch commit `5c9622f3d6bfe249eae1bd94b5f9cb3c367a6542` fixed the test-only `Element.focus` error with `querySelector<HTMLAnchorElement>` and recorded the original ratchet failure. That exact typing correction is retained. No TypeScript baseline or production behaviour was relaxed. The original 19-test result above remains historical, with the broader qualification recorded separately.

## Consolidated Ask qualification

The shared Ask router now handles first-use Council, MEOK H.I.M., Watchdog, Academy and getting-started questions with clearly labelled guidance and existing page links. An incident-reporting question receives an explicit no-intake answer; no case or recipient is invented. Concrete model, endpoint, card, measurement and payment rules retain their precedence. The lowercase pronoun “him” is not treated as H.I.M.

At 2026-11-12 01:48 UTC, the unchanged repository Vitest configuration executed **124 tests across six files**, with no failure or skip. The TypeScript ratchet passed at its unchanged baseline of 142 existing errors across 56 files; this is not a claim that the whole repository is type-error free. Full release gates, the final deployed revision and live browser acceptance remain separate checks.
