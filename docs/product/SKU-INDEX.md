# SKU INDEX — one vocabulary (door ↔ catalog ↔ docs)

Derived 2026-09-05T16:45Z from live probes. The catalog (`/api/x402`) is the
single live line; the door lists resources; the docs describe each offer.
Where a surface cannot deliver, that is stated — never advertised.

## The live catalog (6 tiers, /api/x402)
| id | name | resource (door) |
|---|---|---|
| issuance | Commission a signed card (request-attestation) | /api/request-attestation |
| evidence_bundle | Evidence bundle mapped to an obligation | /api/evidence-bundle |
| data_feed | Signed data feed (assembly + cadence) | /api/eunomia-data |
| rwa_evidence | XRPL asset evidence card (per request) | /api/rwa/evidence |
| provider_diff_feed | Provider document diff feed | /api/feeds/provider-diff?history=1 |
| receipts_batch | Receipts batch — historical measurement leaves | /api/receipts/batch?from=<iso>&to=<iso> |

## The door's resource set (8, /.well-known/x402.json)
evidence-bundle · eu-ai-act-pack · swift-bank-pack · xrpl-asset-evidence ·
signed-data-feed · provider-diff-feed · receipts-batch · commission-card

## Docs (per SKU, docs/product/OFFER-<sku>.md — carry on #1363)
evidence-bundle ✅ derivable · eu-ai-act-pack ✅ · swift-bank-pack ✅ ·
xrpl-asset-evidence ✅ · signed-data-feed ✅ · provider-diff-feed ✅ ·
receipts-batch ⚠️ needs the owner's PayAI/Rekor key (honestly staged) ·
commission-card ⚠️ NOT DELIVERABLE (no signed-card commissions on demand —
stated, not advertised)

## Reconciliation rules (the one-vocabulary contract)
1. The catalog is the live line: 6 tiers, resources probe-verified.
2. A door resource without a catalog tier = legacy/honestly-quarantined (see
   /api/witness lifecycle).
3. A doc without a door = staged (marked STAGED-UNSIGNED/NOT-DELIVERABLE).
4. Live prices only at the 402 — never in docs, pages or indexes.
5. Any row added must name its proof (probe command) in the doc.

## Live truth (16:55Z)
- /pricing-free answers **200 but is WITHDRAWN under evidence review** (estate guard: 'This legacy page is temporarily withdrawn… until each claim has a source, scope, date, and evidence state'). Its wiring test remains the estate contract; the BUYER rail is /pricing (workspace, 'A grade is never sold') and /api/x402 (metered link in the governor's master, correct).
- /pricing-free references inside this index are therefore flagged WITHDRAWN-UNDER-REVIEW, never 'advertised'.

## The free door
- /api/free-door — GET, 402 route priced at zero (settles, charges nothing). It is a LIVE door, not a withdrawn one (per the door's own resources note).

## Manifest rule (applied 18:05)
Every path in this index is probe-verified at write time (200/402/400). Two shortened paths (provider_diff_feed, receipts_batch) previously drifted from the catalog and were corrected on 2026-09-05T18:05Z against the live catalog resources. Re-verify any new row with `curl -w %{http_code}`.
