# RaaS PROCEDURES — Request → Measure → Sign → Anchor → Deliver → Ledger

Derived from the live estate at 2026-09-05T16:05Z. Every stage names its owner,
its KPI, and the exact endpoint a stranger can re-run. Each stage is a bounded,
re-runnable procedure — never a conformity opinion.

## Stage 1 — REQUEST
- Owner: Buyer (any agent). KPI: request answered with 402 + header until funded.
- Entry door: `POST /api/<sku>` (x402 v2, exact, eip155:8453).
- Public index: `https://councilof.ai/.well-known/x402.json` (200; probe-audited — 0 silent 404s).

## Stage 2 — MEASURE
- Owner: Measurement engine. KPI: % of claimed cells measured on the board.
- Board: `https://councilof.ai/api/gspc` — totals derived at read time
  (axes/measured/unmeasured, model fleets, fact runs).
- Rule of record: a count is NULL, never 0, when there is no source
  (`null_rule` in `https://councilof.ai/api/revenue` contract); absent ≠ zero.

## Stage 3 — SIGN
- Owner: Signature service. KPI: 100% of published cards verify offline under the
  reference JS verifier.
- Reference verifier: `https://councilof.ai/signed/verify-card.mjs` — node run
  (16:00Z mirror: 10/10 VALID, exit 0).
- Meaning of "signed": Ed25519 under `did:web:csoai.org#card-attestation-1`.
  A SHA256 in a signature field is a lie.

## Stage 4 — ANCHOR
- Owner: Anchor service. KPI: inclusion proofs present for every published root.
- Public root: `https://councilof.ai/api/root` (permissionless GET; 200 at probe).
- Rekor: `https://rekor.sigstore.dev` (200 at probe). OTS calendars: a.pool /
  b.pool / btc calendars answered at the 2026-09-05 ceremony (4 receipts, 684 bytes).

## Stage 5 — DELIVER
- Owner: x402 door. KPI: non-empty artefact per funding; verify stays free forever.
- Each SKU doc (docs/product/): buyer receives (file list, schema, size), the free
  preview (non-empty), the 402 door path, the verify path, the ledger it feeds.
- Prices live only at the 402 — never on /products or /pricing (price-gate:
  0 price-like strings measured on both).

## Stage 6 — LEDGER
- Owner: Ledger. KPI: corrections public with ids; roots advance honestly.
- Corrections: `https://councilof.ai/api/corrections` (200; 9 published at the
  2026-09-05 checkpoint; 0 hidden failures in the audit).
- One Number: the sole distinct non-self payer recorded; railMode reads
  `railMode(env)` (functions/api/revenue.ts) — live claims only when configured.

## Whole-line proof
`public/interop/live-audit-2026-09-05.json` (well-known 301/301, interop 371/372)
+ `x402-ref-audit-2026-09-05.json` (16 refs) — the line is re-runnable today.
First paying partner onboarding (24 h): request → measure → sign → anchor →
deliver → ledger, exactly the bytes above.
