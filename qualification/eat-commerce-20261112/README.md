# GPAI report-to-preview continuation — 12 November 2026

## Actual scope

This contribution repairs the missing human-readable connection between the existing GPAI product page and the existing Article 53 evidence-bundle preview. It is not a new SKU, payment implementation, fresh measurement, legal-policy change or new scheduler. The existing paid-delivery work and invoice owner remain separate.

The baseline page linked to generic commission terms at `/dashboard?tab=measured`; no subject-filtered evidence-bundle preview appeared on the product page. The exact baseline is `0663a4395fc331b904804169b47a427c3a712d3d`. A separate TinyFish public-browser run (`7030ab1b-1c36-4aea-a7d0-de5a95a2bf51`) corroborated the missing page-level preview. Its other statements about API fields, prices and unrelated services were not adopted as evidence; the source and actual API responses controlled this repair.

## Implemented buyer journey

The page now mounts a read-only preview for its existing Article 53 selection. The buyer explicitly requests either the whole obligation selection or a public model/provider text filter. Typing does not send a request. The UI explains that the API performs a substring match rather than exact model identity.

Actual matching counts, corpus date, record dates and mapping-review information are rendered from a validated response. Up to five record examples link to their exact published card paths. The raw preview, free verifier and existing invoice enquiry remain accessible. A positive selection links to its exact current x402 terms; it does not connect a wallet or pay. Empty selections show recovery options and no purchase link. Failed retrieval remains unknown, not zero.

The parser rejects changed origin, route, obligation, subject, duplicated query parameters, unexpected payment/invoice parameters, malformed counts and mismatched record identities. Preview reads are anonymous GETs, bounded to 128 KiB, without redirects or automatic retries. A ten-second deadline clears readiness even if the transport ignores cancellation. Editing the subject immediately removes previous results and terms; late responses cannot restore them. Unmount aborts the current read.

No wallet API, model provider, local/session storage, signing operation, customer correspondence or server-side payment route was introduced. Prices remain in the current challenge, not static page copy. Source legal/enforcement content was not changed.

## Executed qualification

- **59 focused parser, transport, React DOM and page-integration tests passed**, zero failures or skips. They include stale-response races, malformed/malicious destinations, empty/unavailable distinction, cancellation and timeout recovery. These tests run under the repository's unchanged Vitest configuration.
- **44 actual Chrome browser assertions passed** at 1440 × 1000 and 390 × 844, using the real compiled candidate, the currently served site CSS and retained public API response bytes. The two journeys made exactly ten explicit preview GETs and no payment or write request. No page runtime error or document-level horizontal overflow was observed.
- **Strict TypeScript checking passed** for the candidate page, component, parser and unchanged buying dependency.
- The existing **brand gate passed** on both rendered candidate pages. This is a scoped rendered check, not a claim that the entire repository or production deployment passed.
- The final reader parsed the retained real whole-selection response and rejected an altered terms origin in an independently executed negative control.

The free API reads at 01:28:51–01:28:52 UTC returned 269 records for the whole selection, 35 for the public Anthropic filter, and zero for a deliberately nonexistent public test filter. All retained the corpus date **7 November 2026 at 20:54:37 UTC**. These are selection counts from existing records, not newly measured models, verified signatures, current daily coverage or customer transactions.

Initial source testing found two page-render failures because the test omitted Wouter's server-side router context; the corrected test supplies the actual SSR path. No production behavior or failing assertion was removed to hide that harness error. The initial dependency installation failed in npm's resolver; the isolated test installation subsequently completed without lifecycle scripts. No project-wide dependency or lockfile was changed.

## External directory changes completed

Using the unchanged merged #4220 helper, five explicitly selected existing 402 Index records were corrected at 01:18:49–01:19:01 UTC: named-subject commission, wrapped-asset changes, wrapped-asset parity, historical card batch and machine-readable marking evidence. Each preserved its identity and existing descriptive metadata, received HTTP 201, then returned HTTP 200 with matching description and active status. A later public readback confirmed all five.

One remaining historical feed alias was deliberately excluded from the manifest-only helper. Separate reads proved that its exact URL permanently redirects (HTTP 308) to the canonical signed-data-feed resource currently in the manifest. A separately recorded, exact-identity correction at 01:32:29 UTC removed its expired promotion and clearly described it as a legacy alias, not a new product. A later public readback confirmed its active corrected record. The helper's manifest rule was not weakened or supplied a fabricated row.

The subsequent completed scoped index read contained no owned descriptions still carrying the expired 11 October offer. This observation concerns a mutable directory query at its recorded time, not an enduring global absence claim.

**Unresolved:** separate cached numeric directory prices still showed 0.01 in the inspected records. This pass sent no price field and does not claim price synchronization or verified directory ownership. Current service challenges remain authoritative. No new revenue, paid delivery or customer identity was established.

## Reproduction and release

Focused tests, within the canonical repository:

```sh
npx vitest run client/src/lib/gpaiEvidencePreview.test.ts \
  client/src/components/GpaiEvidencePreview.test.tsx \
  client/src/pages/GpaiEvidencePack.preview.test.tsx
```

`qualification.json` pins the final source hashes, actual environment and test scopes. `browser-acceptance.json` records every browser assertion and permitted request. `live-preview/capture.json` identifies the exact public inputs and observation times. `preview-event.json` reuses the unchanged `csoai.evidence-event/0.1` contract, passed its canonical validator and JSON Schema, remains unsigned and grants no execution authority.

The local browser preview is not a full site build or a production deployment. The code remains subject to the existing repository checks, review, merge owner and GitHub Actions release. No direct Cloudflare deployment, held-PR merge or new host scheduler was performed. A real externally authorized paid order and useful delivered result remain separate commercial acceptance evidence.
