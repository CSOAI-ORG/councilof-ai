# Revenue Ladder — 2026-05-28 (built today)

Three new low-friction price points designed for social-share buy-now flow.
All LIVE in Stripe. All return 200 OK. All independent of the meok.ai build.

## The ladder

| Tier | Price | Product | Link |
|---|---|---|---|
| Smoke Test | **£1** | MEOK Smoke Test — Compliance Demo (signed sample report + PDF) | https://buy.stripe.com/dRmcN75ScdQS7oh1Uc8k90U |
| Quick Kit | **£9** | Article 50 Quick Kit (PDF + JSON-LD + uvx script for Synthesia/HeyGen/Runway class) | https://buy.stripe.com/cNi00la8s1460ZT0Q88k90V |
| Founder Call | **£29** | 30-min 1-on-1 with Nicholas — EU AI Act / DORA / NIS2 / CRA | https://buy.stripe.com/8x228ta8s6oqbExaqI8k90W |

## Why this ladder

1. **£1 = curiosity buy.** Anyone scrolling Twitter can hit this without thinking.
2. **£9 = utility buy.** Cheaper than a coffee in London. They get an actual artifact.
3. **£29 = relationship buy.** They want to talk. That's a sales call with a hot lead.

The ladder is **mutually reinforcing**: if someone buys £1 and likes the experience, the upsell email pushes £9. If they buy £9 and have questions, £29 closes them. If they buy £29 and we click, £499/mo Substrate is on the table.

## Stripe IDs (for ops)

- £1 → `prod_Ub9NeAc3gFy6Ie` / `price_1Tbx58QvIueK5XpbNJFNtmAB` / `plink_1Tbx5EQvIueK5XpbQfqp7NeN`
- £9 → `prod_Ub9Pp6aAgJFnQM` / `price_1Tbx74QvIueK5Xpb4tCpfLmU` / `plink_1Tbx79QvIueK5XpbQI46XY7Y`
- £29 → `prod_Ub9QYkuu7mV9rv` / `price_1Tbx7PQvIueK5XpbWmdpDFOA` / `plink_1Tbx7VQvIueK5XpbBgOtJ1Tg`

All LIVE (Stripe `livemode: true`) · all return 200 · all hit acct_1TLlEKQvIueK5Xpb.

## Tweet sequence (Nick can fire today)

### Tweet 1 — Honest founder, £1 link

```
22 EU compliance MCPs on PyPI · 79 in the Anthropic Registry · 5,920 monthly installs · £0 revenue.

Putting up a £1 smoke-test link to find out if any of this is worth anything.

https://buy.stripe.com/dRmcN75ScdQS7oh1Uc8k90U

Refundable. Promise.
```

### Tweet 2 — Article 50 deadline urgency, £9 link

```
EU AI Act Article 50 — 2 Nov 2026 cliff.

Every AI-generated video shown to EU users needs C2PA + the new EU-Icon spec (Code of Practice 2nd draft, Jan 2026).

If you're Synthesia/HeyGen/Runway/Pika-shaped: £9 implementation guide.

https://buy.stripe.com/cNi00la8s1460ZT0Q88k90V
```

### Tweet 3 — Founder availability, £29 link

```
30-min founder call · £29 · I'll tell you exactly where your AI stack sits on EU AI Act / DORA / NIS2 / CRA.

I built 79 MCPs covering it. I won't sell you anything you don't need.

https://buy.stripe.com/8x228ta8s6oqbExaqI8k90W
```

### LinkedIn / cold-email variants

Same hooks, fewer line breaks, add: "I'm a UK solo founder (CSOAI LTD, Companies House 16939677). Reply with one question and I'll answer in 24h."

## Fulfilment (once a buyer hits)

**£1 smoke-test:**
- Stripe webhook → email signed sample MCP-Hardening report + Article 50 PDF
- Upsell link to £9 + £29 in receipt

**£9 quick kit:**
- Stripe webhook → email PDF + JSON-LD + `uvx meok-eu-aigc-icon-mcp` install script
- Receipt: "Want me to walk through your specific pipeline? £29 below."

**£29 founder call:**
- Stripe webhook → email Cal.com booking link
- Receipt: "Block 30 min, we talk, no script."

## Pre-fulfilment fallback

If the webhook hasn't fired by the time a buyer expects something, Nick can manually reply from `nicholas@meok.ai` within 1 hour. We have less than 100 buyers this week — manual is fine.

## What this unblocks

- Validates the ENTIRE Stripe + webhook + receipt chain end-to-end
- Generates social proof ("I just bought MEOK!" tweets)
- Cash flow even if it's small
- Lead list of paying customers we can upsell

## What it does NOT depend on

- meok.ai build succeeding (these links work standalone)
- DNS fixes
- Newsletter signup
- LinkedIn recovery
- Gmail MCP reconnection

This is the most-honest, lowest-friction, highest-immediacy revenue path available right now.

---

*Built 2026-05-28 06:48 UK time · MEOK AI Labs · Nicholas Templeman*
