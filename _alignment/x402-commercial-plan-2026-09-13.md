# x402 Paid Artefacts — Commercial Plan

**Date:** 2026-09-13
**Owner:** nicholas@csoai.org
**Status:** Launch-ready

## What we sell (the doctrine)

Signed evidence. Verification is always free, offline-capable, against our public Merkle root. Payment mints no MEASURED cell — a paid attestation issuance is a receipt for already-signed measurement cards on file, not a new measurement.

**We never sell:** a score, rank, grade, certificate, conformity determination, or private data.

## Pricing (8 paid artefacts)

| Resource | Amount | Use case | Free preview |
|----------|--------|----------|--------------|
| Issuance (per card) | $0.01 | One signed card receipt for a named subject | yes |
| Proof bundle | $0.02 | Inclusion proof for a batch of leaves | 1 leaf free |
| RWA evidence (XRPL) | $0.05 | Per-asset XRPL evidence card | yes |
| Provider diff | $0.05 | Round-over-round provider drift | yes |
| Evidence bundle (OSCAL) | $0.10 | Per-obligation EU AI Act/DORA/CRA | yes |
| Art. 50 marking | $0.10 | Per-URL EU AI Act marking evidence | yes |
| Receipts batch | $0.25 | Per-batch historical evidence | yes |
| Data feed (Eunomia) | $0.50 | Per-feed signed enforcement data | yes |

**Volume:** >$100/month → bundle deal. Contact nicholas@csoai.org.

## Target customers

### Tier 1: Stablecoin issuers ($0.01-0.05 each, recurring)
- Circle (USDC)
- Ripple (RLUSD)
- Stargate, Moneybyte (XLSd), Stripe (Bridge)

Why they pay: every listing review, every quarterly report, every exchange listing needs a third-party signed measurement.

### Tier 2: Exchanges and wallets ($0.01-0.25 each, very high volume)
- Coinbase, Kraken, Bitstamp, Crypto.com
- MetaMask Institutional, Ledger, Trezor, Phantom

Why they pay: per-asset listing reviews, per-transaction risk scoring, per-portfolio attestation.

### Tier 3: Regulators ($0.10 each, episodic)
- EU AI Office, ESMA (MiCA), FCA, Bank of England

Why they pay: EU AI Act Article 50 evidence bundles, OSCAL 1.1.0 compliance dossiers.

### Tier 4: AI providers and agent protocols ($0.01-0.10 each, high volume)
- OpenAI, Anthropic, Mistral, Meta AI
- x402 Foundation, MCP Registry, A2A WG

Why they pay: trust receipts for the agent economy, ERC-8004 registry entries.

## Revenue projections (12-month)

### Conservative (5 conversions/month, 100 paid artefacts each)
- 5 customers × 100 artefacts × $0.10 average = $50/month
- 12 months × $50 = **$600**

### Realistic (25 conversions/month, 200 artefacts each, 4 enterprise deals)
- 25 × 200 × $0.10 = $500/month
- 4 × $100 (enterprise) = $400/month
- 12 months × ($500 + $400) = **$10,800**

### Optimistic (1 enterprise deal at $1K/month + 100 self-serve)
- 1 × $1,000 + 100 × $5 = $1,500/month
- 12 months × $1,500 = **$18,000**

The realistic scenario ($900/month, $10.8K/year) is achievable with 25 buyers. That's 25 issuer/wallet/exchange/protocol contracts — achievable in 6 months with the outreach templates ready.

## Launch plan

### Day 0 (now): Assets ready
- ✅ Pricing page at /pricing (live after deploy)
- ✅ Buyer guide at /x402-buyer-guide (live after deploy)
- ✅ x402 catalog at /.well-known/x402.json (live)
- ✅ Outreach templates at /Users/nicholas/clawd/_alignment/outreach-templates-2026-09-13.md

### Day 1-7: Outreach wave 1 — Tier 2 (exchanges/wallets)
Why exchanges first: high volume, low-touch, recurring needs.
Send: MetaMask Institutional, Coinbase Listings, Kraken, Bitstamp, Crypto.com.

### Day 8-14: Outreach wave 2 — Tier 1 (issuers)
Why issuers second: lower volume, higher value, longer sales cycles.
Send: Circle, Ripple (RLUSD), Moneybyte (XLSd), Stripe.

### Day 15-30: Outreach wave 3 — Tier 3 + 4 (regulators, protocols)
Why last: episodic buys, relationship-driven.
Send: EU AI Office, x402 Foundation, MCP Registry, Anthropic, Mistral.

### Day 30-90: Track conversions, iterate pricing
- Track via /api/revenue (already live)
- Adjust amounts based on actual conversion rate
- Add volume tiers based on actual buyers

### Day 90: First enterprise deal target
- $100/month minimum contract
- Pre-anchored receipts for known buyers

## Why this works

1. **x402 is live** — facilitator configured, signing key configured, 1 external payer proved.
2. **Free tier drives discovery** — all 425 stablecoins, 22 axes, 264 signed cards free.
3. **Verification stays free** — buyers trust the rail because sign-off isn't gated.
4. **Free previews on every paid artefact** — buyers see exactly what they're paying for.
5. **Doctrine is defensible** — "never a grade, rank, or certificate" makes regulators comfortable.
6. **x402 protocol is the network effect** — every x402-capable agent wallet can pay without integration.
7. **IETF drafts in review** — 3 drafts on SCITT framing, agent-log tampering, A2A delegation. Standards-body credibility.

## What could go wrong

| Risk | Mitigation |
|------|------------|
| No one converts | Free tier stays free — no cost. Outreach waves add coverage. |
| Prices too high | $0.01/card is already 10x cost. Can drop to $0.001. |
| Prices too low | Volume beats margin. Track conversion rate. |
| x402 protocol fails | Verification still works. Can pivot to Stripe-backed paywall. |
| Competitor enters | Doctrine + IETF drafts + 264 signed cards = moat. |

## Files ready

- `~/clawd/wt-eat-20260911/public/pricing.html` — pushed, awaiting deploy
- `~/clawd/wt-eat-20260911/public/x402-buyer-guide.html` — pushed, awaiting deploy
- `~/clawd/_alignment/x402-buyer-guide-2026-09-13.md` — reference doc
- `~/clawd/_alignment/outreach-templates-2026-09-13.md` — email templates + contact list
- `~/clawd/_alignment/npm-support-ticket-csgaglobal-transfer.md` — pending
- PR #2155 on CSOAI-ORG/councilof-ai — pushed

## Next action

Merge PR #2155, deploy, then send outreach wave 1 (Tier 2 exchanges/wallets).
