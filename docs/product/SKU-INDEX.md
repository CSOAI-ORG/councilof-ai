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
| provider_diff_feed | Provider document diff feed | /api/provider-diff (feed) |
| receipts_batch | Receipts batch — historical measurement leaves | /api/receipts-batch |

## The door's resource set (8, /.well-known/x402.json)
evidence-bundle · eu-ai-act-pack · swift-bank-pack · xrpl-asset-evidence ·
signed-data-feed · provider-diff-feed · receipts-batch · commission-card

## Docs (per SKU, docs/product/OFFER-<sku>.md — carry on #1363)
evidence-bundle ✅ derivable · eu-ai-act-pack ✅ · swift-bank-pack ✅ ·
xrpl-asset-evidence ✅ · signed-data-feed ✅ · provider-diff-feed ✅ ·
receipts-batch ⚠️ needs the owner's PayAI/Rekor key (honestly staged) ·
commission-card ✅ DELIVERABLE, ⚠️ NOT ADVERTISED — corrected 2026-09-06. Two axes, not one:
the door is live and delivers on settlement; it is not advertised because its free preview is the
402 challenge rather than sampleable content, which is a standing marketing rule in
scripts/badger/generate-h1-product-docs.py and it stands. What was wrong was writing the second as
the first. This line read
"⚠️ NOT DELIVERABLE (no signed-card commissions on demand)" and was wrong. The
verdict came from probing /api/request-attestation with NO subject, while the
door's own bazaar extension declares `subject` a REQUIRED input. With a subject
that has cards the FREE preview returns the signed cards, their hashes, their
URLs and corpus_as_of; the door states its own deliverable as "one card-v0 leaf,
surface ras.commission". It re-serves existing signed cards and never invents a
score — which is a description of the product, not a reason it cannot be served.
art50-marking-evidence ✅ door live (returns a structured "uncheckable" for a URL
that does not resolve, which is the door working)

## Vocabulary map — dataset `offer_sku` ↔ door ↔ doc

The published dataset csoai/x402-bazaar-conformance carries an `offer_sku` per
conformant host. Those ids are NOT the doc filenames, and two of them resolve to
a differently-named doc, so a reader going from the dataset to an offer hits
nothing. This table is the join. The offer pages themselves are produced by
scripts/badger/generate-partner-offer-docs.py — do not hand-edit their fact tables.

| `offer_sku` (dataset) | hosts | door | doc |
|---|---|---|---|
| provider-diff-feed | 97 | /api/feeds/provider-diff | OFFER-provider-diff-feed.md |
| request-attestation | 95 | /api/request-attestation | OFFER-commission-card.md |
| rwa-evidence | 63 | /api/rwa/evidence | OFFER-xrpl-asset-evidence.md |
| evidence-bundle | 13 | /api/evidence-bundle | OFFER-evidence-bundle.md |
| art50-marking-evidence | 8 | /api/art50/marking-evidence | PENDING — needs docs/product/art50-marking-evidence.md first; the door is live and the producer emits the offer page as soon as that source doc exists |
| (no offer_sku) | — | /api/eunomia-data | OFFER-signed-data-feed.md |
| (no offer_sku) | — | /api/receipts/batch | OFFER-receipts-batch.md |

Host counts are the offer column's own distribution at as_of 2026-09-05T17:39:01Z
(394 conformant, 276 mapped, 118 UNMAPPED) and are not typed here — re-derive with
`jq` over snapshots/conformance-with-offers-<date>.jsonl.

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
