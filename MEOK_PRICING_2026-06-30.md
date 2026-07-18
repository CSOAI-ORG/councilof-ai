# 💎 MEOK Pricing — consumer OS line (2026-06-30)

Two distinct product lines. Don't conflate them.

## A) MEOK OS — consumer / prosumer (THIS page: os.meok.ai/pricing.html)
Market anchor: ChatGPT Plus, Claude Pro, Gemini AI Pro, Perplexity Pro, Copilot Pro all sit at **~$20/mo (~£16–17)**, closed, and *they own your data*. MEOK's wedge: **cheaper, open-source-first, your data stays yours, + PAYG flexibility** almost none of them offer.

| Tier | Price | What | Why this price |
|---|---|---|---|
| **Free** | £0 | Full OS + Sovereign on **open-source models** (gpt-oss-120b/Llama — already live), data on-device, community SOV Space, council, voice, emergence character | Genuinely free because it runs OSS models we already wired. More generous than competitors' throttled free tiers — this is the acquisition hook + the "own your data, free, safe" promise. |
| **Pro** | **£12.99/mo** or **£129/yr** (2 mo free) | Premium model stack (Claude/GPT auto-routed), full 13-queen council, deep memory, all SOV Space tools, VRM/RPM character skins, priority compute | **Undercuts the £16–17 standard** by ~20% — same value, half the data-surrender. Annual = 17% off, standard SaaS. |
| **PAYG** | £0 + metered | No sub; top-up credits, premium models at **cost + ~20%** (OpenRouter-style), transparent per-call | Differentiator — few consumer AIs offer true PAYG. Captures occasional/bursty users who won't subscribe. Margin in the markup. |

## B) CSOAI / developer / enterprise governance (EXISTING — M2's live lane, do not duplicate)
Free self-host → **Starter £29/mo → Pro £79/mo → A2A Substrate £499/mo → Defence £4,990/mo**, + x402 metered £0.0001/call. This is the B2B governance/MCP product, already priced + on live Stripe. The consumer page footer links here for teams/devs.

## Stripe — go-live plan (OWNER / M2, NOT done here)
⚠️ `STRIPE_SECRET_KEY` is **`sk_live`** + revenue is M2's lane → I did **not** create products or wire live checkout. To go live (test mode first):
1. In **Stripe test mode**, create products + prices: `meok-pro-monthly` (£12.99), `meok-pro-annual` (£129), `meok-payg` (metered usage price). Capture the `price_…` ids.
2. Add a `/api/checkout` serverless that creates a Stripe Checkout Session for the chosen price (server-side, uses the secret key from env, never the client).
3. Point `pricing.html` `go(plan)` at `/api/checkout?price=…` instead of the placeholder alert.
4. Test end-to-end with a Stripe test card → flip to live.
5. PAYG = Stripe **metered billing** (usage records per premium call) — mirror the existing x402 metered pattern from the B2B line.

## Honest status
- ✅ Pricing page **live** (os.meok.ai/pricing.html), market-correct, monthly/annual toggle, Free CTA works (enters OS).
- ⏳ Pro/PAYG CTAs show a placeholder ("checkout being wired test-mode first") — **live charging is the owner/M2 step** (live key + financial-action rule). Nothing charges anyone yet.
- The two product lines are reconciled: consumer (this) vs governance (M2's existing). The page footer cross-links.
