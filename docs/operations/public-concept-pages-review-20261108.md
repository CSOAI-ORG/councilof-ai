# Public concept-page review — 8 November 2026

Status: source candidate for protected review. No production deployment, signature, new measurement, human acceptance or search-ranking gain is established.

## Existing work first

The referee changes #4021 and #4029 were already merged when read on 8 November; they were not recreated. This continuation fixes the existing game-concept page generator at source. The baseline inspected was `c373e475c0dac2389f157f4d561a5f3c90fea78b`.

## Live public read scope

A bounded sitemap sweep ran from 2026-11-08T04:16:57.905709Z to 04:17:56.102008Z. The captured sitemap contained 537 entries. Five `/api/` resources were excluded from this sweep; all 532 remaining resources returned HTTP 200. This includes non-HTML machine resources and historical evidence copies, not 532 completed application journeys. Requests were public GETs, with three workers, eight-second request timeouts, one-MiB response limits and a 150-second total budget. There were no form submissions, private account reads, paid invocations or browser actions against production.

- Sitemap SHA-256: `6a28f49fba33713b081eb84383e4a16d17d51a4c9ff0380283f46e9454b27b91`.
- Returned metadata-array bytes: 126,050; SHA-256 `bbfe1e00236c2e5e9a8bcece4e1ed48a6d75e3ac3351b3ca36a783e3f1640ac8`.
- The complete result was returned by the observer; this document retains its summary and selected findings, not a second full archive of the raw array.
- Preliminary metadata flags: title count 17, description count 55, canonical count 38, multiple robots 34, H1 count 9 and duplicate element IDs 1. These categories overlap and are NOT a verified defect total. The broad parser also sees SVG titles; repeated equivalent robots directives and app headings need contextual review. It did not include X-Robots-Tag in those counts.

An earlier redirect-following read of `/os/` did not complete. Direct hop checks then established `/os` → `/dashboard?tab=home` → `/dashboard/?tab=home` → HTTP 200. It is not a confirmed outage. New concept-page links use the already served `/dashboard/` target rather than adding these hops.

## Reproduced generator defect

The generator emitted `index, follow` and omitted a description. Its eight committed outputs had separate manually inserted `noindex` directives and descriptions. That left contradictory directives in the published concept pages and meant regeneration would reintroduce the indexable state. The live `/games-charter` read confirmed both directives.

The fix derives all metadata from the existing generator and preserves the current scope: these are concepts, not playable games, signed-card issuers or live measurements. The following exact filenames are regenerated: council-town, tournament, judge, incident, civic, swarm, games-charter and games-compliance.

Changes:
- Exactly one `noindex, follow` directive and one generated description per page.
- Preserve each existing canonical concept address and the existing non-operating disclosures.
- Direct directory-form links to `/dashboard/` and `/gspc-verify/`.
- Darker green text/button colour, a visible keyboard-focus outline, readable line height, long-word wrapping, border-box layout and a minimum 44px CTA height.
- Anchor the default output root to the script, not the caller's working directory.
- Add a read-only `--check`; exact drift fails rather than rewriting silently.
- Preflight the complete eight-page output set. Refuse page/directory symlinks, non-regular output paths and existing or dangling `.html.ots` companions before writes. Unrelated signed/evidence files are untouched. This preflight is not an atomic transaction or a sandbox against a malicious concurrent filesystem writer.

## Actual qualification

24 offline Python test methods passed. They cover all eight metadata outputs, deterministic generation, no-write drift checks, explicit-root CLI operation, protected/symlink output refusal, unrelated signed-fixture preservation, existing-scope wording and contrast/focus rules. One test method proves two deliberately weakened metadata outputs fail the intended assertions; those nested controls are not two additional test methods.

Chromium 144.0.7559.96 rendered the exact generated HTML at 390px and 1280px widths: 16 page/viewport cases passed. The checks cover no horizontal overflow, visible keyboard focus and CTA height. Network requests were blocked, and no live dashboard or signed-in workflow was exercised. Desktop/mobile screenshots were retained in the private review package. This is not a WCAG-conformance claim or a complete end-user acceptance test.

Two standard Vitest cases in `scripts/game-concept-pages.test.ts` invoke the Python suite and verify that the committed outputs exactly match the generator. They use the existing test discovery; no workflow or scheduler is added. Hosted qualification must be read at the final PR head and is not inferred from these local results.

At 2026-11-08T04:29:19.021911Z, unauthenticated readback from immutable commit `18428097fcdfec6d6f774ba52ec7e4b4d962d93d` matched the tested Git blobs for all eleven source/output/test files. The generator is blob `d05a2fa7a96fabb811aa449e72982cb21920bfb4`, SHA-256 `e19d6a6fdbceb67edbbe093cbeb1227d42be08dc91108352eb22e5d4225d9c76`. The Python suite is blob `6242a16352df193088770834d7963d2e57637797`; the Vitest bridge is blob `1111683fe57eaab7bdb59dda67ee04500e2dc94c`.

## Other observed issues remain with their producers

The sweep found duplicate title/description candidates on several prerendered routes, missing canonical links on the charter and leaderboard surfaces, and historical third-party error captures listed in the sitemap. None is patched by hand here.

In particular, `public/_headers` already applies `noindex, nofollow` and a sandbox CSP to `/interop/:report/mirrors/*`, while the sitemap producer deliberately retains some mirror paths. The sitemap/headers owners should reconcile that policy. Do not rewrite or delete captured third-party errors to make a metadata checker pass: their exact bytes are evidence. The two retained error bodies observed in the sitemap include:

- `/interop/xrpl-impersonation-2026-09/mirrors/audd-xrp-ledger-toml-probe`: 146 bytes, SHA-256 `55f7d9e99b8e2d4e0e193b2f0275501e6d9c1ebd29cadbea6a0da48a8587e3e0`.
- `/interop/xrpl-impersonation-2026-09/mirrors/straitsx-xrp-ledger-toml-404`: 88 bytes, SHA-256 `62b6eec5bc825126a7b9734e03ff00c9dc7899f3f07111746bf583d193b44dd0`.

HTTP 200 means the retained resource was served; it does not turn an archived 404 body into a current origin outage or a useful search landing page.

## Release and ownership

Source publication is not live deployment. The existing owner must review the exact diff, complete protected CI and merge/release through the normal master/GitHub Actions path, then read back the eight served pages and their destination links. No direct Pages write, protected merge, source signing, charter amendment, score change, host scheduler, paid call, model inference, upstream reply or live-case action occurred. No other owner's acknowledgement is claimed by this handoff.
