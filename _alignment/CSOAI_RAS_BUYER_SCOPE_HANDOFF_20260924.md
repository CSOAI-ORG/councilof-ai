# CSOAI request-attestation buyer scope: release handoff

Observed 2026-09-24T22:47:03Z. This is a focused source repair, **not a public deployment**.

## Public reproduction

- `GET https://councilof.ai/api/request-attestation?subject=qwen2.5:0.5b` returned HTTP 402. Its free `csoai.preview.signed_cards_on_file` reported **16** and pointed to `/signed/card-matrix.json` dated `2026-08-19T09:24:39.174226+00:00`.
- In the served matrix, **8** rows have model ID `qwen2.5:0.5b`. The other **8** belong to `qwen2.5:0.5b-instruct`. The buyer's named subject would therefore receive a reserve containing sibling-model references if paid through the existing substring filter.
- Served matrix: `https://councilof.ai/signed/card-matrix.json`, 335 rows at readback; local readback SHA-256 `73208c8d9259e2f170039ac6fb89fc467766456611b9cd2f782e46533febde46`. This hash identifies the downloaded readback, not a signed or anchored receipt.
- The public revenue endpoint reported one non-self, nonzero payer and 20,000 atomic USDC (0.02 USDC); it does not establish a repeat buyer. No payment or test transaction was made during this repair.

## Source repair

- Isolated worktree: `/Users/nicholas/clawd/wt-codex-ras-scope-20260924`
- Branch: `codex/ras-exact-subject-20260924`, based on `origin/master` `ce6b053f756df81ebf84ae7f9b029b87d5a35bd6`
- Commit: `041edda6348fc2c9fafd2b45e0404ee189b4a272`
- `reserveFor` now includes only rows whose model ID equals the requested subject case-insensitively, retaining optional exact axis filtering. The response labels the match rule and says the preview does not reverify card signatures. Its `free_preview` URL preserves the actual subject and axis. Buyer descriptions and quickstart use the same scope language.
- The offer description stays within the endpoint's 500-character limit; a focused test caught the first draft being clipped in the middle of a sentence and the final copy passed.

## Verification and release gate

`vitest run functions/api/metered-endpoints.test.ts functions/api/commission-description.test.ts` passed **15/15**; the wider focused invocation reported **18/18** passing. `git diff --check` passed. The regression fixture includes a nearby `-instruct` model and asserts that it is absent from both free preview and the synthetic paid receipt. All paid-path tests use synthetic facilitator responses; no wallet or external settlement was used.

Current public production includes newer queue and interop preview logic than this branch's `origin/master` base. Apply the **focused matching, preview and wording changes** to the guarded publisher's current source, run its current tests/build gates, then verify the served 402 and exact reserve count. Do **not** deploy this older branch as a whole or publish through direct Wrangler: that could replace newer public evidence and code. Expected post-release readback for the same request is 8 exact model references, with the sibling model absent and the complete scoped `free_preview` URL present.
