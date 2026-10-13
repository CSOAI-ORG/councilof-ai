# Buyer journey map — 2026-10-13

The conversion path a stranger walks on councilof.ai: **read → door → pay → receipt.**
This is the shared map other lanes extend. It names routes and doors only — it decides
nothing about a product and restates no door's terms.

**Honest note first: amounts live in the 402 challenge only.** No amount, price or tier is
published on any page (the estate revenue contract); the live 402 challenge returned by a
door is the authoritative price. Payment mints no new measurement and buys no score, grade
or certificate. Measurement, never certification. Counts on any surface are pointers.

## 1 · READ — the sales surface

| Route | Page | Path to a door |
| --- | --- | --- |
| `/services` | Services (reads `/.well-known/x402.json` at run time) | IS the door catalogue — every card is a door, with its free preview where one is published |
| `/pay-all` | Pay every door | every door in the manifest, settled one by one from a wallet |
| `/pay` | Pay for evidence (buyer page) | `/.well-known/x402.json` + `/x402-buyer-guide.html` |
| `/x402-buyer-guide.html` | Buyer guide | `/.well-known/x402.json`, `/api/gspc` |
| `/assess` | Get measured | → `/services` (added 2026-10-13) |
| `/measure` | Request measurement | → `/services` (added 2026-10-13) |
| `/payg` | Pay-per-call agent rail | → `/services` (added 2026-10-13) |
| `/quickstart` | Quickstart | nav link → `/services` |

## 2 · DOOR — the buyable doors

- 31 live x402 resources, enumerated only in `/.well-known/x402.json`. Nothing about a door
  is retyped on a page; the catalogue reads the manifest when the page loads.
- Where a door publishes `free_preview`, read it before paying. "No free preview is
  published for this door" is stated as such — never implied.
- Human invoices (Article 50 pack, evidence bundle, provider-diff feed) are enquiries by
  email, not checkout: `/contact/?arm=invoice&product=…`. The site stores nothing when asked.

## 3 · PAY — settle at the 402

- Wallet pay-per-call (x402) at the door itself. The door's 402 challenge carries the
  amount; that challenge, not any page, is the price a buyer sees and signs.
- Machine routes: the doors an agent calls are the same 31, listed at `GET /api/x402`.

## 4 · RECEIPT — what the buyer keeps

- Settlement receipts: `/dashboard?tab=mine`; receipt batches: `/api/receipts/batch` (itself
  a door). Historical receipt batches and their buyer verification steps are documented in
  the receipts buyer guide.
- Verify anything published free at `/gspc-verify` — no account, no payment. Verification
  is free, always.

## Gaps other lanes can extend (2026-10-13)

- `/pay` and `/x402-buyer-guide.html` are touched by open PRs (2928, 3034) and were left
  alone here; once those land, add the `/services` catalogue link there too.
- `/tools` links `/api/gspc` and `/quickstart` but no buyable door; it also carries the
  deliberate negation "GSPC certified" (there is none) which the brand gate's banned-word
  scan flags — the cross-link there waits for that wording to be settled.
- `/start` (OnboardOS) is touched by open PR 2994 — same cross-link is owed there.
- A stranger landing on any single benchmark page (e.g. `/machbench.html`) still has no
  door path; that belongs to the pages' own lanes.
