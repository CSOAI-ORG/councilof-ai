# £1 SMOKE-TEST PAYMENT LINK — created 2026-05-28

## The link (paste this anywhere)

**https://buy.stripe.com/dRmcN75ScdQS7oh1Uc8k90U**

- Price: **£1** (one-time)
- Product: `MEOK Smoke Test — £1 Compliance Demo`
- Currency: GBP
- Mode: LIVE (verified — Stripe MCP confirmed `livemode: true`)
- Stripe IDs: `prod_Ub9NeAc3gFy6Ie` · `price_1Tbx58QvIueK5XpbNJFNtmAB` · `plink_1Tbx5EQvIueK5XpbQfqp7NeN`

## Why a £1 link

1. **Lowest-friction conversion test ever.** £1 buy is impulse-easy.
2. **Validates end-to-end pipeline.** If money flows: Stripe → webhook → receipt → fulfilment all work. We then know the £29/£79/£499 paths work too.
3. **Refundable + tiny stakes.** Even 1 charge proves the pipeline. 10 charges = £10 — and 10 buyers we can upsell.
4. **Social-share friendly.** Drop in a tweet/LinkedIn DM with one of these hooks below.

## Tweet/LinkedIn hooks (pick one + paste)

### Hook 1 — Compliance audience
```
Built 79 EU compliance MCPs (EU AI Act, DORA, NIS2, CRA, GDPR). Want a £1 sample report? https://buy.stripe.com/dRmcN75ScdQS7oh1Uc8k90U — refundable if it's not useful, but it tells you exactly where your stack stands before the 2 Nov Article 50 deadline.
```

### Hook 2 — MCP devs / Claude users
```
If you ship MCP servers: I built a £1 security report for your server.json. OWASP LLM Top 10 + 5 MCP-specific risks (tool spoofing, plain-HTTP resources, ungated destructive verbs). Get yours: https://buy.stripe.com/dRmcN75ScdQS7oh1Uc8k90U
```

### Hook 3 — Founder tone
```
I'm a solo UK founder. 22 MCPs on PyPI. £0 in revenue so far. Posting a £1 smoke-test link to find out if any of this is worth anything: https://buy.stripe.com/dRmcN75ScdQS7oh1Uc8k90U
```

### Hook 4 — Brutal honesty
```
Spent 5 weeks shipping 79 EU compliance MCPs. Hit £0 in MRR. Putting up a £1 link to literally find out if this is just shouting into the void. https://buy.stripe.com/dRmcN75ScdQS7oh1Uc8k90U
```

## Fulfilment plan (once first buyer hits)

1. Stripe webhook fires → /api/webhooks/stripe (already wired)
2. Send a Resend email with:
   - Sample MCP-Hardening JSON report (signed)
   - EU AI Act Article 50 PDF (2 Nov 2026 deadline tracker)
   - One-click upgrade to £29/mo Starter (we have that link too)
3. Reply: thank-you note from Nick with offer to chat

## Next steps if it works

| Outcome | Action |
|---|---|
| Zero buyers in 24h | Hook is the problem. Try Hook 3 or Hook 4 (raw founder tone). |
| 1-5 buyers | Validate the upsell email gets opened. Add to follow-up sequence. |
| 6+ buyers | Distribution loop is working — double the post frequency. |
| Refund requests | Read the message field carefully. The "why" tells us the gap. |

## Verify it works

```bash
curl -L "https://buy.stripe.com/dRmcN75ScdQS7oh1Uc8k90U" -o /dev/null -w '%{http_code}\n'
# Should return 200
```

Confirmed working at 2026-05-28 ~06:46 UK time.
