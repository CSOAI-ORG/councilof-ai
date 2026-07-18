# Stripe Pricing Pivot — execute via Stripe API

**Why pivot:** the deep research surfaced two pricing diamonds:
1. **Empty bracket between £29 Starter and £1,499 Enterprise** → add a £499/yr "Indie/Bootstrapped" tier
2. **Germany NIS2 panic mode** (~18K non-compliant entities post 6 March deadline) → split the existing £499 NIS2 product into a £49 self-serve impulse tier + £999 done-for-you panic tier

**How to execute:** the script below uses your live Stripe CLI / API. Source your live key from `~/.secrets/stripe_live.env` first.

---

## Bash script — run with care

```bash
#!/bin/bash
set -e

# === Source live Stripe key ===
source ~/.secrets/stripe_live.env  # exports STRIPE_LIVE_KEY

# Sanity check
if [[ -z "$STRIPE_LIVE_KEY" ]]; then
  echo "[FAIL] STRIPE_LIVE_KEY not set"
  exit 1
fi
if [[ ! "$STRIPE_LIVE_KEY" =~ ^sk_live_ ]]; then
  echo "[FAIL] STRIPE_LIVE_KEY does not look like a live key"
  exit 1
fi

# === New Tier 1: Indie / Bootstrapped (£499/yr = £41.58/mo equivalent) ===
echo "=== Creating Indie / Bootstrapped tier (£499/yr) ==="

INDIE_PROD=$(curl -s https://api.stripe.com/v1/products \
  -u "$STRIPE_LIVE_KEY:" \
  -d "name=MEOK Indie / Bootstrapped" \
  -d "description=For solo founders and bootstrapped teams. Full MCP fleet + signed attestations + your own HMAC signing key + email support. Annual billing only. Cancel anytime." \
  -d "metadata[tier]=indie" \
  -d "metadata[fits]=solo-founders,bootstrapped-saas,under-20-employees" \
  -d "url=https://meok.ai/pricing" \
  --json | jq -r '.id')

echo "  Product ID: $INDIE_PROD"

INDIE_PRICE=$(curl -s https://api.stripe.com/v1/prices \
  -u "$STRIPE_LIVE_KEY:" \
  -d "product=$INDIE_PROD" \
  -d "currency=gbp" \
  -d "unit_amount=49900" \
  -d "recurring[interval]=year" \
  -d "nickname=Indie / Bootstrapped Annual" \
  --json | jq -r '.id')

echo "  Price ID: $INDIE_PRICE"

INDIE_LINK=$(curl -s https://api.stripe.com/v1/payment_links \
  -u "$STRIPE_LIVE_KEY:" \
  -d "line_items[0][price]=$INDIE_PRICE" \
  -d "line_items[0][quantity]=1" \
  -d "after_completion[type]=redirect" \
  -d "after_completion[redirect][url]=https://meok.ai/thanks" \
  --json | jq -r '.url')

echo "  Payment link: $INDIE_LINK"


# === New Tier 2: NIS2 DE Self-Serve (£49 one-time) ===
echo ""
echo "=== Creating NIS2 DE Self-Serve (£49 one-time) ==="

NIS2_SELF_PROD=$(curl -s https://api.stripe.com/v1/products \
  -u "$STRIPE_LIVE_KEY:" \
  -d "name=Germany NIS2 BSI Register — Self-Serve" \
  -d "description=Step-by-step NIS2 BSI register guide for German Mittelstand. Section 30/32 timelines, KRITIS classification, Elster-cert walkthrough. Self-serve, no human handover. Includes meok-nis2-de-register MCP for your AI agent. Most teams complete in 30 minutes." \
  -d "metadata[tier]=nis2-self-serve" \
  -d "metadata[regulation]=germany-nis2-umsucg" \
  -d "url=https://meok.ai/nis2-de" \
  --json | jq -r '.id')

NIS2_SELF_PRICE=$(curl -s https://api.stripe.com/v1/prices \
  -u "$STRIPE_LIVE_KEY:" \
  -d "product=$NIS2_SELF_PROD" \
  -d "currency=gbp" \
  -d "unit_amount=4900" \
  -d "nickname=NIS2 DE Self-Serve One-Time" \
  --json | jq -r '.id')

NIS2_SELF_LINK=$(curl -s https://api.stripe.com/v1/payment_links \
  -u "$STRIPE_LIVE_KEY:" \
  -d "line_items[0][price]=$NIS2_SELF_PRICE" \
  -d "line_items[0][quantity]=1" \
  -d "after_completion[type]=redirect" \
  -d "after_completion[redirect][url]=https://meok.ai/nis2-de/thanks" \
  --json | jq -r '.url')

echo "  Product: $NIS2_SELF_PROD"
echo "  Price: $NIS2_SELF_PRICE"
echo "  Payment link: $NIS2_SELF_LINK"


# === New Tier 3: NIS2 DE Done-For-You (£999 one-time) ===
echo ""
echo "=== Creating NIS2 DE Done-For-You (£999 one-time, panic-buy tier) ==="

NIS2_DFY_PROD=$(curl -s https://api.stripe.com/v1/products \
  -u "$STRIPE_LIVE_KEY:" \
  -d "name=Germany NIS2 BSI Register — Done-For-You" \
  -d "description=For Mittelstand firms that missed the 6 March 2026 deadline and need to register THIS WEEK. We handle: BSI portal walkthrough, Elster cert setup support, complete the Section 30/32 register on your behalf, deliver signed compliance attestation. Email + Zoom support. 7-day turnaround." \
  -d "metadata[tier]=nis2-done-for-you" \
  -d "metadata[regulation]=germany-nis2-umsucg" \
  -d "metadata[turnaround]=7-days" \
  -d "url=https://meok.ai/nis2-de/done-for-you" \
  --json | jq -r '.id')

NIS2_DFY_PRICE=$(curl -s https://api.stripe.com/v1/prices \
  -u "$STRIPE_LIVE_KEY:" \
  -d "product=$NIS2_DFY_PROD" \
  -d "currency=gbp" \
  -d "unit_amount=99900" \
  -d "nickname=NIS2 DE Done-For-You One-Time" \
  --json | jq -r '.id')

NIS2_DFY_LINK=$(curl -s https://api.stripe.com/v1/payment_links \
  -u "$STRIPE_LIVE_KEY:" \
  -d "line_items[0][price]=$NIS2_DFY_PRICE" \
  -d "line_items[0][quantity]=1" \
  -d "after_completion[type]=redirect" \
  -d "after_completion[redirect][url]=https://meok.ai/nis2-de/thanks" \
  --json | jq -r '.url')

echo "  Product: $NIS2_DFY_PROD"
echo "  Price: $NIS2_DFY_PRICE"
echo "  Payment link: $NIS2_DFY_LINK"


# === Output for Nick ===
echo ""
echo "=========================================="
echo "NEW PAYMENT LINKS (add to landing pages):"
echo "=========================================="
echo "Indie / Bootstrapped (£499/yr):  $INDIE_LINK"
echo "NIS2 DE Self-Serve (£49):       $NIS2_SELF_LINK"
echo "NIS2 DE Done-For-You (£999):    $NIS2_DFY_LINK"
echo ""
echo "Save these into LIVE-PAYMENT-LINKS.md"
```

---

## Updated 6-tier ladder

| Tier | Price | Frequency | Audience | Stripe Link |
|---|---|---|---|---|
| **Free** | £0 | forever | Solo devs trying it | n/a |
| **Starter** | £29 | /mo | Side projects, learning | (existing) |
| **Indie / Bootstrapped** | **£499** | **/yr (≈£41/mo)** | **Solo founders, bootstrapped SaaS** | NEW |
| **NIS2 DE Self-Serve** | **£49** | **one-time** | **German Mittelstand DIY-ers** | NEW |
| **NIS2 DE Done-For-You** | **£999** | **one-time** | **Late-deadline panic buys** | NEW |
| **Pro** | £79 | /mo | Org-wide signing keys | (existing) |
| **Enterprise** | £1,499 | /mo | Multi-BU, SLA | (existing) |
| **Bespoke** | from £5K | /mo | Self-hosted attestation | (existing) |

## Why these tiers work

**£499/yr Indie:**
- 20× cheaper than Drata starter ($7.5K)
- 6× cheaper than Vanta starter (~$10K)
- Pays for itself if it saves the buyer 5 hours of consultant time
- Annual billing reduces churn risk for solo founders cash-flow-wise
- No credit-card-required gate (let them download the OSS first, upgrade when they want signing keys)

**£49 NIS2 Self-Serve:**
- Impulse buy for panicked Mittelstand
- Includes the MCP + walkthrough doc + 90 days of email support
- Even at 100 sales/mo (achievable post-deadline panic), that's £4,900/mo
- Real friction barrier: needs a German-language landing page (next build)

**£999 NIS2 Done-For-You:**
- Panic-buy tier for the 18K non-compliant entities
- Manual concierge service: 1 video call + complete the register on their behalf
- 1 sale/week = £4K/mo
- Realistic ceiling: 5-10/mo at peak panic = £5-10K/mo
- Capped by your time — once you're at 4-5/mo, raise to £1,499 to ration

## Promotion pages to update

After running the script, update these files with the new links:

1. `/Users/nicholas/clawd/meok/ui/src/app/pricing/page.tsx` — main pricing page
2. `/Users/nicholas/clawd/meok-labs-engine/LIVE-PAYMENT-LINKS.md` — canonical link list
3. `/Users/nicholas/clawd/meok/ui/src/app/home-page-client.tsx` — homepage CTAs
4. README.md of `meok-nis2-de-register-mcp` repo — add NIS2 panic-tier links

## Risk + abort criteria

- If Stripe live mode requires KYC re-verification (you've increased product complexity), pause and complete that first
- If any of the 3 new payment links return 4xx on first test purchase, deactivate the link until fixed
- Price experimentation is fine; keep ALL 3 new tiers for at least 30 days before changing — too much churn confuses customers

## Roll-back

If any tier underperforms (zero sales in 60 days):
1. Deactivate the Stripe price (don't delete — preserves order history)
2. Remove from landing pages
3. Document the experiment in a `/Users/nicholas/clawd/revenue/PRICING_EXPERIMENTS.md` log so future-you doesn't repeat

## Test purchases (recommended before launch)

Use Stripe test mode keys (separate from live) to validate all 3 payment flows end-to-end before flipping to production.
