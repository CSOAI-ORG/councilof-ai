# Public evidence journey review — 8 November 2026

## Scope and release state

User-directed public-site review. Lane: `jail-public-evidence-current-archive-20261108`. Write scope: `client/src/pages/JailFolder.tsx`, the adjacent `jailEvidence.ts` reader and `JailFolder.test.tsx`, and this review record. No canonical board, signed artifact, archive, authority control, deployment workflow or production service is changed.

Source base: `2998e55473f2fefc66b934e66ffe94b6114048d6`. Tested implementation: `2cc7de6e5d40e439e7aa52ae94e7b199f19bc564`. This branch is a review candidate, not a production release. The existing release owner and required repository checks remain controlling.

The public lane registry was checked for `JailFolder`, `jailEvidence`, `jail-index.json` and the axis-page generator. No matching jail-page claim was found. The axis-page generator already has an `axis-index-truth-20261025` claim, so it was not edited. This scope is recorded here and in the pull request; the shared central lane registry was not rewritten.

## Bounded public audit

Between 04:07:10 and 04:07:18 UTC, an outside observer made 70 public HTML route checks: the homepage and 69 unique same-origin links discovered on it, including query variants. The audit used GET, a 1 MiB response limit, a 10-second request timeout and at most three concurrent requests. It inspected status, title, H1, canonical, description and selected stale wording. It did not submit forms, purchase anything, run a model or exercise private controls.

This was not an exhaustive site crawl or a browser interaction/accessibility certification. No-slash routes returning HTTP 308 were recorded as redirects, not counted as broken links; their destinations were not all followed by the audit client.

| Finding | Evidence | Disposition |
|---|---|---|
| Jail page presents an archived separation label as current | `/gspc/jail/` said TIE, while `/api/gspc` declares the jail row UNTESTED and explains the changed separation basis | Corrected in this branch by reading the existing shared board feed and separating the dated archive |
| Jail archive fetch failures remain displayed as Loading | Original component catches failure by setting its single data state back to null | Explicit error/retry state, response validation, 64 KiB read bound and 8-second abort added |
| Archive-to-verification journey needs a direct path | Original list exposed card JSON only | Per-card verifier links use the existing `verifyCardHref` helper; original JSON links remain |
| Axis-directory coverage/count needs reconciliation | Direct HTML check showed `All 32 GSPC axes`; the homepage/current board showed 34 | Existing generator lane retained; this observation does not establish missing measurement records |
| Duplicate title elements on traction page | A separate bounded HTML read confirmed two identical `Operation and external use` title elements | Recorded for metadata-owner follow-up; not patched by this lane |
| Companion page metadata/heading structure merits review | `/native-panel/` had no canonical or description and two H1 elements in the inspected HTML | Review candidate only; interactive companion/control scope untouched |

No occurrence of the previously flagged gap-as-product slogan was found in the inspected responses. This is a scoped observation, not an estate-wide absence claim.

## Implemented behaviour

- Neutral page title and description: no hard-coded current verdict or measurement count.
- One current-board view using the existing shared `useGspcBoard` feed; no second board poller and no fallback to archived numbers.
- A failed board refresh with retained data is explicit; the retained values are not presented as current.
- Scope, separation basis and a published measurement date are exposed when supplied. A fetch time is never invented as a measurement date. Unknown values stay unknown; legitimate zero accuracy remains zero.
- A separately dated archived-index section, without rewriting its historical TIE label or presenting it as the current verdict.
- Strict archive schema/calendar/link checks; exact card-ID/path binding; duplicate and excessive lists rejected. Error and loading are distinct. Retry, abort cleanup, a byte limit and timeout prevent the previous indefinite loading state.
- Source/corrections links remain available on failures. Long card identifiers wrap, and verification links have descriptive accessible names.

## Verification actually performed

At 04:25:21 UTC, the three committed source/test files were read at the exact tested revision and transpiled with TypeScript 5.9.3. The committed test bodies ran in a bounded, in-memory Node assert adapter using React and React DOM 19.2.1 server rendering: **23 passed, 0 failed, 87 assertions**.

This was not the Vitest CLI, a full repository build, a hydrated browser test or a full accessibility audit. The normal CI command for these committed cases is `npm test -- client/src/pages/JailFolder.test.tsx`. Full repository checks and a deployed browser readback remain required before release.

Coverage includes current versus archived verdicts, retained-data failures, loading and missing-current states, retry presentation, source links during failures, scope/limitations, card-verifier links, empty archive scope, duplicate/malformed rows, missing/zero/invalid numbers, unmeasured states, missing measurement time, archive non-mutation, invalid schema/dates/URLs, HTTP errors, malformed JSON, oversized bodies and aborted requests.

The real archived index parsed successfully with **8 card references**. All eight links were accepted by the existing `resolveCardParam` implementation and resolved to their exact card paths. A separate public GET of one generated verifier URL returned HTTP 200; that HTTP check does not certify successful cryptographic verification.

The archive Git blob remains `e17b814306f1ec0e3db73609b01a9b372446acb5`, byte-identical to the original. No signed card or timestamp proof was edited.

Implementation SHA-256 values at the tested revision:

- `client/src/pages/jailEvidence.ts`: `c63610894f64de1008c52033d5bade25dd3b8480882d747f22a7046e07526a82`
- `client/src/pages/JailFolder.tsx`: `59c60e6bb55e93048f4b4aeae0464317056df3b1d632d79a479a39982092fe58`
- `client/src/pages/JailFolder.test.tsx`: `755bf78a782fb7cdd4b05afd2948b77b5a9600bf4154d4e0d61607c67abace5a`

## Release acceptance

Run the existing required checks without weakening them. Preview the jail page at narrow and wide viewport sizes; exercise successful reads, archive failure/retry and board refresh failure. Verify that current and historical labels remain distinct. Publish only through the existing approved release route, then read back the deployed title, current-board view and a card-verifier journey. A branch commit or passing fixture is not proof that production changed.
