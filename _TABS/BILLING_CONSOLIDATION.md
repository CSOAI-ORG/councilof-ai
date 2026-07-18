# Billing Consolidation — one ladder, one backend (Decision #4)

> CSOAI lane. The "one funnel not 50 Stripe links" fix. Live account: **MEOK AI LTD**
> (`acct_1TLlEKQvIueK5Xpb`, GBP, balance £0). Authored 2026-06-07.

## Live state (audited via Stripe MCP — note: MCP can't paginate, dashboard needed for full link list)

**10 active products, all now with `default_price` set ✅ (this session):**

| Product | Price | Type |
|---------|-------|------|
| MEOK ONE Pro `prod_UdBfCGtXhbi69B` | **£9/mo** `price_1TdvHh…` | recurring ⭐ only subscription |
| NIS2 BSI Self-Serve | £99 | one-time |
| NIS2 BSI Done-For-You | £499 | one-time |
| EU AI Act Art50 Watermarking Kit | £999 | one-time |
| DORA Belgium Rapid Response | £999 | one-time |
| Compliance Audit-Prep Bundle | £4,950 | one-time |
| Smoke Test | £1 | one-time |
| PAYG £10 / £50 / £200 top-ups | £10/£50/£200 | one-time |

## Done this session (safe, reversible, no charge)
- **Set `default_price` on all 10 products.** Previously every product had `default_price: null`, forcing every Buy button / checkout to hardcode a throwaway price or link — the sprawl's root cause. Now a product resolves to its price; `meok-stripe-acp-checkout-mcp` and all skins (openmoe.ai, meok.ai) can reference the stable product id.

## Canonical ladder — DECIDED + BUILT 2026-06-07 (Nick: keep £9 + add Team £99)

| Tier | Product | Price | default_price |
|------|---------|-------|---------------|
| Free | — (no Stripe) | £0 | — |
| **Pro** | `prod_UdBfCGtXhbi69B` MEOK ONE Pro | **£9/mo** `price_1TdvHh…` | ✅ |
| **Team** | `prod_Ueyf62wJ4gPeCZ` MEOK ONE Team (**created this session**) | **£99/mo** `price_1TfeiJQvIueK5Xpb8WqLVMWe` | ✅ |

One-time compliance services + PAYG keep their own default-price products (served by the ACP MCP). This is the canonical ladder; surfaces reference these product/price ids, not throwaway links.

## ✅ Canonical payment links — CREATED 2026-06-07 (use THESE everywhere)
| Tier | Link | promo codes |
|------|------|-------------|
| **Pro £9/mo** | `https://buy.stripe.com/28E8wR2G0dQS5g92Yg8k91n` (`plink_1TffZQQvIueK5Xpb68DDEYYc`) | ✅ on (LAUNCH50 works) |
| **Team £99/mo** | `https://buy.stripe.com/4gM9AV80kcMO23X0Q88k91o` (`plink_1TffZRQvIueK5XpboDeinpeA`) | ✅ on |

(Created via the Stripe MCP's dedicated `create_payment_link` tool — the generic `stripe_api_execute` can't encode `line_items` arrays.) **All consumer Pro/Team CTAs across every surface should point at exactly these two URLs.**

## Old-link retirement — NOT safe to do from here (dashboard task)
The Stripe MCP **can't enumerate** payment_links (both `limit` and `starting_after` are ignored — `limit:3` returns 11). Worse, **other tabs/processes are actively minting links** (saw `plink_1TffWn/WV/W7` created minutes ago). Deactivating blind would (a) risk killing the real product links (DORA/NIS2/etc. checkouts), (b) fight concurrent writers. **Do retirement from the Stripe dashboard:** filter to links NOT in {the 2 canonical + the legit product links}, cross-ref against page usage, deactivate orphans. Non-blocking — the canonical links work today.

## The target (once ladder confirmed)
ONE auth + ONE recurring ladder; openmoe.ai + meok.ai are skins that tag `funnel` source only; one-time compliance services stay as productised default-price items the ACP MCP serves; PAYG unchanged. Kill per-product throwaway links — reference products.
