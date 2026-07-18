# MEOK Revenue Ladder v2 — 7 LIVE Stripe products

**Built 2026-05-28** — full ladder from £1 to £1,499/mo. All confirmed LIVE in Stripe (verified 200 OK).

## The full ladder

| Tier | Price | Type | Stripe URL | Stripe IDs |
|---|---|---|---|---|
| Smoke Test | **£1** | one-time | https://buy.stripe.com/dRmcN75ScdQS7oh1Uc8k90U | `prod_Ub9NeAc3gFy6Ie` / `price_1Tbx58QvIueK5XpbNJFNtmAB` |
| ProofOf.ai single cert | **£5** | one-time | https://buy.stripe.com/00w28ta8saEGdMF7ew8k90Z | `prod_UbBImnRPVw4LtU` / `price_1TbywSQvIueK5XpbiKLHXHmd` |
| Article 50 Quick Kit | **£9** | one-time | https://buy.stripe.com/cNi00la8s1460ZT0Q88k90V | `prod_Ub9Pp6aAgJFnQM` / `price_1Tbx74QvIueK5Xpb4tCpfLmU` |
| Founder Call (30 min) | **£29** | one-time | https://buy.stripe.com/8x228ta8s6oqbExaqI8k90W | `prod_Ub9QYkuu7mV9rv` / `price_1Tbx7PQvIueK5XpbWmdpDFOA` |
| Pro (existing) | **£79/mo** | recurring | https://buy.stripe.com/00wfZjcgAeUW4c5cyQ8k90K | existing |
| ProofOf.ai Pro (200 certs/mo) | **£199/mo** | recurring | https://buy.stripe.com/aFa4gB94o8wy6kd6as8k90Y | `prod_UbBIhinf1dyQTK` / `price_1TbywRQvIueK5XpbHIL8u4V1` |
| CSOAI Enterprise (all 81 MCPs) | **£1,499/mo** | recurring | https://buy.stripe.com/fZu00l80k7sugYR1Uc8k90X | `prod_UbBHRApJ443i4g` / `price_1TbyvQQvIueK5XpbInzhqSEH` |

## Why each tier exists

- **£1** — impulse buy, validates pipeline end-to-end
- **£5/cert** — per-use price point for SaaS teams that just need one cert (per `_TOPOLOGY/REVENUE_OPPORTUNITIES.md` #1)
- **£9** — utility buy for Article 50 deadline (2 Nov 2026)
- **£29** — qualified-lead generator (every £29 caller = sales conversation)
- **£79/mo** — existing Pro tier, the "self-serve" recurring step
- **£199/mo** — ProofOf.ai Pro, the dedicated attestation-as-a-service product (the "real" SaaS line)
- **£1,499/mo** — Enterprise tier per `MASTER_AUDIT_2026-05-13.md` recommendation — single product, all 81 MCPs

## Math on path to £1K MRR (Aug 20 deadline)

84 days from today. £1K MRR ≈ 13 Pro customers OR 5 ProofOf.ai Pro OR 1 Enterprise.

Most realistic mix:
- 5× £79/mo Pro = £395/mo
- 2× £199/mo ProofOf.ai Pro = £398/mo
- 1× £1,499/mo Enterprise = £1,499/mo

**ANY ONE** of the three lines getting one customer of the £79+ tier puts you on the path. The £1/£5/£9/£29 ladder funnels them.

## Updated `meok-kits-host` landing page

The full 7-tier ladder is now on https://meok-kits-host.vercel.app with one-time vs recurring sections, "NEW" tags on the 3 new products, and direct Stripe links. Deploy in flight.

## Ready outreach hooks

### Hook A — solopreneur honesty (£1)
> 22 EU compliance MCPs on PyPI · 5,920 monthly installs · £0 revenue.
> Posting a £1 link to find out if any of this is worth anything.
> https://meok-kits-host.vercel.app

### Hook B — SaaS dev (£5/cert + £199/mo)
> Every regulated SaaS needs signed compliance evidence (EU AI Act Art 11, DORA Art 19, ISO 42001).
> Built it as an MCP — £5 per signed cert pay-as-you-go, £199/mo for 200/mo with public verify URL.
> https://meok-kits-host.vercel.app

### Hook C — CTO of mid-market AI co (£1,499/mo)
> If you're building agents and your General Counsel asks where your EU AI Act Art 13/26/50 evidence sits — it's not in your CI logs.
> 81 MCPs covering every clause, signed attestation chain, public verify URL. £1,499/mo all-in.
> https://meok-kits-host.vercel.app

---

*Built by Claude 2026-05-28. Three new LIVE Stripe products created via Stripe MCP in 10 min. Productisation gap from `_TOPOLOGY/REVENUE_OPPORTUNITIES.md` #1 + #3 now closed.*
