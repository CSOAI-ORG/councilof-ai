# CSOAI Data Licence — interim public offer (DRAFT)

> **STATUS: LICENCE-DRAFT-NOT-LEGAL-ADVICE — OWNER REVIEW REQUIRED BEFORE PUBLICATION OR USE.**
> This draft was prepared by an agent lane for owner review. It is not legal advice, no lawyer has
> reviewed it, and nothing in it has been offered or accepted. Every commercial term below is an
> owner decision. Do not sign, invoice, or rely on this text until the owner (and where the owner
> wishes, UK counsel) has approved it. Remove this banner only on owner approval.

**One-pager · CSOAI Ltd (UK Companies House 16939677) · draft 2026-10-09**

## Marking line (to appear on every licensed surface and redistribution)

> © CSOAI Ltd. Databases: sui generis database right (Copyright and Rights in Databases Regulations 1997) and/or contract. Verification free; commercial redistribution under licence.

## What is being licensed

The **GSPC measurement corpus**: a substantial, independently assembled database of AI-behaviour
measurements — content-addressed measurement cards under a signed Merkle root, per-axis longitudinal
records, correction history, and the feeds that carry them. Extraction and re-utilisation of the
corpus (or a substantial part of it) is reserved to CSOAI Ltd under the UK implementation of the
sui generis database right, and/or governed by contract where the right does not apply.

CSOAI sells **measurement artifacts and re-measurement — never certification**. No licence grants a
grade, a rank, a certificate of conformity, or a place on the board.

## The free verification layer — free forever

These stay free, unconditional, and unpaywalled, for anyone, in perpetuity:

| Surface | What it proves |
|---|---|
| `https://councilof.ai/gspc-verify`, `/api/verify`, `/api/receipts/verify` | recompute a card/record and check the Ed25519 signature |
| `https://councilof.ai/root.json`, `/api/proof?sha=<64-hex>` | Merkle inclusion of one leaf in the current public root |
| `https://councilof.ai/verifier/` tooling | offline verification without trusting CSOAI |

A verifier never needs a licence: you may always check our work and publish that you checked it.

## The paid layer — under this written data licence

Licensed to the licensee (an **entity**, or a natural person acting in trade), tiered by
**usage**, NOT by seats, users, or viewers:

| Grant | Covers | Tiering |
|---|---|---|
| **Bulk corpus** | extraction of the full or sliced signed corpus (cards, roots, inclusion proofs) | by volume of extraction and redistribution |
| **Correction history** | the append-only correction/caveat ledger of the corpus over time | by window served |
| **Timely feed** | the signed periodic feeds (provider-diff, receipts batches, population slices) | by cadence and redistribution scope |

- **No seats.** One entity, unlimited internal users, tier set by usage (volume, redistribution,
  cadence). Audit is by usage records, not headcount.
- **Redistribution** of licensed extracts (commercial republication, derived databases, API resale)
  requires the redistribution tier and carries the marking line above.
- **Derived data** produced by the licensee from licensed extracts is the licensee's, provided the
  marking line and the correction-history provenance travel with any public release.
- **Corrections**: CSOAI appends, never silently edits. Licensees receiving a timely feed receive
  corrections on the same feed.
- **Verification rights**: unlimited and free (see above), whatever the tier.
- **Term/termination, liability, governing law**: [OWNER/COUNSEL TO COMPLETE — deliberately left
  blank in this draft]. Nothing is implied.

## Pricing

Deliberately not in this document. Price POINTS with their basis live in `PRICES.json`; per-call
agent-rail amounts live only inside each route's 402 challenge. Enterprise/invoice terms are an
owner decision (see docs/ENTERPRISE_DATA_LICENSE_2026-08-24.md for the corpus description and the
enquiry path).

## Relationship to the per-call x402 rail

A per-call x402 purchase (a single artifact) is a **licence of one artifact for the buyer's use**,
with free verification. Bulk, redistribution, and feed access are licensed only under this
document. The two never contradict: what you buy per call is an artifact, not the database.

---
*Measurement, never certification. Verification free; commercial redistribution under licence.*
