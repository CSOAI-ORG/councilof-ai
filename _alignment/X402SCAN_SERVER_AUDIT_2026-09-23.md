# x402scan Council of AI listing: live readback and one bounded update

Checked 2026-09-23 06:09 UTC. This is an index/discovery receipt, not buyer use, payment, endorsement, or verification of a delivered artifact.

## Public evidence

| Surface | Readback |
| --- | --- |
| [Existing x402scan server](https://www.x402scan.com/server/9b8bcb34-6c9f-45d6-b881-9a6afe7bf6b5) | 90 indexed operations before this audit: 10 x402 v2 and 80 unprotected API operations. The old rows' `lastUpdated` values are 2026-09-14 10:27:22–10:27:28 UTC. |
| [Current CSOAI x402 manifest](https://councilof.ai/.well-known/x402.json) | 21 declared GET resources. The index had only the original 10 path families. In particular, the newer `/api/pop/*` family and `/api/wrapper/changes` were absent. Exact URL comparison also differs because the manifest carries required query examples while the index stores path URLs. |
| [Current CSOAI OpenAPI](https://councilof.ai/openapi.json) | 127 paths, 21 paid path families, 41 operations carrying `x-payment-info` (21 GET, 20 POST). The [x402scan discovery implementation](https://github.com/Merit-Systems/x402scan/blob/main/docs/DISCOVERY.md#L13-L19) reads `/openapi.json` first; submitting only `/.well-known/x402.json` would not force that manifest to be its source. |
| [Current GSPC board](https://councilof.ai/api/gspc) | `totals.lid`: `23 axes measured · 14 model fleets · 0 separated leaders · 3 public leader scores · 9 fact runs · TIE is TIE · not a certificate.` The ten cached v2 index rows include the older `22 axes measured · 14 model fleets · 3 public leader scores · 8 fact runs · TIE is TIE · not a certificate.` in their captured response metadata. |
| Canonical repository `origin/master` | `public/openapi.json` has 113 paths and 10 doors; the served OpenAPI has 127 and 21. A release from older source could regress discovery. No source PR or deployment was attempted from this audit. |

## Anonymous route sample

All requests were unpaid, unauthenticated, and made without a payment signature. POST probes used either an unsupported A2A method or empty verification input, so no transaction, subscription, or paid job was requested.

| Listed operation | HTTP | `PAYMENT-REQUIRED` | Finding |
| --- | ---: | --- | --- |
| GET `/api/a2a` | 200 | absent | Live public contract, though its index description starts `POST /api/a2a`. |
| POST `/api/a2a` | 200 | absent | JSON-RPC method-not-found response for a deliberately unsupported method. |
| GET `/api/free-door` | 402 | present | Live zero-amount x402 door. |
| GET `/api/eunomia-data` | 200 | absent | Bare path is a free preview. The paid signed feed requires `feed=1`; the index's stored Bazaar input example has that query. |
| GET `/api/proof` | 400 | absent | Bare path requires a leaf SHA or `bundle=1`; the index's stored Bazaar input example has `bundle=1`. |
| GET `/api/request-attestation` | 402 | present | Live challenge; stored input example has `subject`. |
| GET `/api/rwa/evidence` | 402 | present | Live challenge. |
| GET `/api/receipts/batch` | 402 | present | Live challenge. |
| GET `/api/wrapper` | 402 | present | Live challenge. |
| GET `/api/gspc` | 200 | absent | Live free board. |
| POST `/api/verify` | 200 | absent | `UNCHECKABLE` for empty synthetic input; verifier is live. |

No sampled operation returned 404. The concrete buyer problem is stale and incomplete discovery, plus a bare paid-path click that can produce a free preview or validation error without the query shown deeper in metadata.

## Action performed and exact readback

The x402scan [public single-URL registration path](https://github.com/Merit-Systems/x402scan/blob/main/apps/scan/src/trpc/routers/public/resources.ts#L135-L182) checks the endpoint against the origin's OpenAPI and probes its live 402. I submitted the already-live `https://councilof.ai/api/pop/stablecoins` once, with no wallet, funds, or new server. The response was `success: true`, existing `originId: 9b8bcb34-6c9f-45d6-b881-9a6afe7bf6b5`, new resource ID `998a3842-0bb1-4210-b638-0a5dee3867e5`, `x402Version: 2`, `lastUpdated: 2026-09-23T06:08:00.769Z`. Anonymous readback of the same server page at 06:09:43 UTC showed **91** rows, including that exact resource ID and one accepted payment scheme. The single-URL path stored an empty `method` field after reporting a POST probe; the manifest declares GET. This is a registry metadata defect, so I did not repeat single-URL registration for the other ten missing doors.

The x402scan [origin-wide refresh code](https://github.com/Merit-Systems/x402scan/blob/main/apps/scan/src/lib/discovery/register-origin.ts#L104-L115) is method-aware and uses upserts, but its current read-only discovery check sees 176 operations: 41 paid, 96 unprotected, and 39 unclassified. It also deprecates old rows absent from a successful batch. Running that broad mutation before reconciling OpenAPI methods with the 21-GET manifest could publish extra POST offers and change the existing listing unexpectedly. It was not run. No source or production files were changed by this audit.
