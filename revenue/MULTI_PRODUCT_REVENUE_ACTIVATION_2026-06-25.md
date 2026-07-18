# 💰 MULTI-PRODUCT REVENUE ACTIVATION — fire-order (M4+Cowork, 2026-06-25, T-9)
Consolidates Cowork's drafts/briefs + `revenue/PRICING_SOURCE_OF_TRUTH.md` + live browser checks into one plan to get **many products** flowing the moment the meter is on. M4 can't charge/send — this removes every friction *up to* that gate.

## 🔴 THE KEYSTONE: one pricing decision, propagated once (Nick — 5 min)
**Pro/mo is quoted 4 different ways across 4 surfaces — this kills every click-through.**
| Surface | Pro/mo | Source |
|---|---|---|
| **proofof.ai/pricing (LIVE, verified 25 Jun)** | **£99** | the site a buyer actually sees |
| revenue/PRICING_SOURCE_OF_TRUTH.md (ratified 21 May) | £79 | "overrides all other pricing" |
| 12_REVENUE_NOW + GRC pack (outreach) | £199 | the emails |
| gateway PRICING.md | $29–49/user | a different model entirely |
**→ Decision (Nick): pick ONE.** Recommended = **keep LIVE £99** (least work: site already shows it; just align source-of-truth + the 2 outreach drafts to £99). Then propagate to: proofof site · source-of-truth · 12_REVENUE_NOW · GRC pack · meok.ai · llms.txt. **Until this is one number, do not send.**

## 🐞 Live bugs blocking checkout (must fix before sends land)
1. proofof.ai Pro CTA → **mis-wired shared Stripe link** `buy.stripe.com/…cgAdQS0ZT1Uc8k91t` (Cowork) — wire a *distinct* link.
2. proofof.ai still says **HMAC** (canon = Ed25519).
3. proofof hero countdown **"108 days" is wrong** (~38 days to 2 Aug) — frozen/stale.
4. **Leaked Stripe `sk_live_` key** un-rolled — provisioning untrustworthy until rolled.

## 📦 The portfolio — what's sellable, per product (fire in this order)
| # | Product / SKU | Price (ratify) | Checkout | Send-ready asset | Blocker | Owner |
|---|---|---|---|---|---|---|
| 1 | **NIS2 £499 rapid-response** (NL 30-Jun / DE overdue) | £499 | proofof | ✅ Draft A (freshened) | meter + send | Nick |
| 2 | **GRC white-label pilot** (3 firms) | £5k assess / rev-share | reply-path (no checkout) | ✅ GRC_OUTREACH_PACK + Draft B | meter + send | Nick |
| 3 | **48h Assessment £4,950** | £4,950 | proofof | ✅ in 12_REVENUE_NOW | meter + send | Nick |
| 4 | **OneOS 7-org cross-sell** | assessment | warm reply | ✅ Draft C | meter + send | Nick |
| 5 | **Pro subscription** | £99 (ratify) | proofof | site | price-fix + mis-wire | M4/lane |
| 6 | **MCP packs** (Core £49 · Gov £149 · Sec £199 · Industry £299 · Defence £499) | per source-of-truth | gateway/Stripe | PRICING_SOURCE_OF_TRUTH | propagate + live checkout | lane |
| 7 | **Watchdog Certification** (Y1 50%) | assessment ladder | csoai-dashboard | — | fulfilment verify | lane |
| 8 | **Verticals** (haulage/muckaway/planthire/grabhire/optimobile) | per-vertical | hive sites | ✅ Cowork cowork-briefs | DNS + deploy | M2/lane |

## 🔁 Two purchase axes — the ecosystem (both BUILT)
Every product is consumable two ways (gateway PRICING.md "two orthogonal axes" — this IS the easy-product-ecosystem packaging):
1. **Subscription (Stripe, £/mo)** — per-MCP £29/£99 · packs Core £49 → Defence £499 · one-offs (NIS2 £499, Assessment £4,950). For humans / dashboards / ongoing monitoring.
2. **PAYG (x402 / USDC per-call, $0.01–$10)** — agent-to-agent / low-volume; **"1000–10000× cheaper"** than legacy GRC (they don't sell per-call at all). **Built** in the gateway (`meok_x402.py`, `/x402` endpoint, USDC/Coinbase CDP).

**State of the two axes:**
- Subscription → Stripe Live (Nick) + **£99 ratified ✅** + proofof Pro mis-wire to fix.
- PAYG → x402 engine **built**; ⚠️ **`councilof.ai/payg` = 404 (confirmed live 25 Jun) BUT the page source EXISTS at `clawd/council-ai-storefront/payg.html` → it's UNDEPLOYED, not missing.** Deploy that file to restore consumer PAYG (dark >9 days). x402 rail also needs Coinbase CDP live (owner).

→ **The ecosystem packaging is done at the model level (subscribe OR pay-per-call, any product).** The gaps are all activation: deploy `/payg`, turn on the x402 rail, flip Stripe Live. Nothing to *build*.

## ▶️ The unlock sequence (what actually makes £ flow)
1. **Nick ratify Pro price** (5 min) → 2. **propagate to all surfaces** (M4/M2 once decided) → 3. **roll Stripe key + wire `hello@meok.ai`** (Nick, 40 min) → 4. **fix proofof mis-wire + countdown** (lane) → 5. **SEND** NIS2 (today, 5-day deadline) → white-label → assessment → OneOS. Then packs + verticals follow.

**M4 has staged everything left of step 3.** Steps 1 & 3 are Nick's; 2 & 4 fire the instant the price is chosen. The first £ is one decision + 40 minutes away — not a build.
