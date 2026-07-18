# Revenue rails — FIXED 2026-06-07 (critical continuity)

## THE £0 ROOT CAUSE (found + fixed)
Every payment link shipped in the 300+ MCPs and all websites pointed to an
**old/other Stripe account** (URL family `…8k90x`). The live account had **0 payment
intents ever**. Customers' clicks never reached it.

## Canonical Stripe (LIVE account — use ONLY these)
- Account: **MEOK AI LTD** `acct_1TLlEKQvIueK5Xpb` (livemode)
- **Compliance Pro £79/mo** — product `prod_UeyPEb58exuL3I` · price `price_1TfeSQQvIueK5XpbIqoWxqhc`
  · **link `https://buy.stripe.com/aFa7sNcgAdQS0ZT1Uc8k91t`** (HTTP 200, this is THE upgrade link)
- **LAUNCH50** coupon `MIoZIRM1` (50% off, 6 mo) — promo *code* still needs adding in dashboard (MCP tool API-skew)
- Existing catalog: PAYG £10/£50/£200, NIS2-DE £499/£99, DORA-BE £999, Audit-Prep £4,950, Watermark £999, Smoke £1, MEOK ONE Pro £9/mo
- Missing: Enterprise £1,499 (website advertises it — create if wanted)

## What was repointed
- MCP fleet: 1,547 links / 642 files → the Pro link (pushed to GitHub, 313 repos; republishing to PyPI)
- Web: 231 links / 66 files (meok/ui, proofof-site, csoai-org, council-ai-storefront, attestation-api) → Pro link

## Engines built (in meok-attestation-api, ship on next deploy)
- `POST /signup` — email → free key + creates a Stripe Customer (lead capture). "Stripe is the DB."
- `POST /verify` — server-side metering via Vercel KV (env KV_REST_API_URL/TOKEN), fail-open, free 200/day → upgrade
- `public/get-key.html` — signup funnel page
- proofof.ai/scorecard — 341 rating pages + 11 "Best-X" category GEO pages + llms-full.txt

## Running jobs (2026-06-07)
- Full-fleet republish (propagate Pro link + mcp-name to PyPI)
- Watcher → register the ~105 remaining packages in the Anthropic registry after republish (drive `mcp-publisher login github` via Chrome, then `register_gap.sh`)
- proofof.ai auto-restore (retries deploy until Vercel 100/day limit resets) → ships scorecard + /signup + /verify + web repoint

## USER GATES (only Nick can do)
1. Vercel → Storage → create KV → activates metering enforcement (env auto-set)
2. Stripe dashboard → add LAUNCH50 promotion code
3. Stripe dashboard → verify PAYG webhook → `…/payg/webhook`
4. Reconnect Gmail (nurture)

## Deeper (optional)
- Metering client adoption: update auth_middleware → call `/verify` (fail-open) + republish → the cap bites
- Attestation signed outputs (trust moat) · Web tier-CTA exact pricing (Enterprise £1,499)

## Service-tier links (created 2026-06-07, real account)
- NIS2-DE £499: https://buy.stripe.com/00waEZ3K48wydMF6as8k91k (nis2-de-kit page)
- DORA-BE £999: https://buy.stripe.com/cNi9AV80k3cecIBbuM8k91l (dora-belgium page)
- Audit-Prep £4,950: https://buy.stripe.com/eVq6oJ3K49AC0ZTaqI8k91m (audit-prep-bundle page)
- Still blanket→Pro / TODO: article-50 watermarking (£999 exists, no dedicated link yet) · Enterprise £1,499 (no product — confirm /mo vs one-time before creating)
