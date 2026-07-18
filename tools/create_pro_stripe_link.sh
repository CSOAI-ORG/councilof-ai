#!/usr/bin/env bash
# Create the "MEOK ONE Pro" £9/mo Stripe payment link in your LIVE account, then print the URL.
# Creating a payment link moves NO money — it's a product customers use to subscribe.
#
# Give it live access ONE of two ways, then run it:
#   A)  stripe login        # opens browser, pick your LIVE account, ~20s
#       ./tools/create_pro_stripe_link.sh
#   B)  STRIPE_API_KEY=sk_live_xxxxx ./tools/create_pro_stripe_link.sh
#
# Then send Claude the printed URL (or set it yourself):
#   ssh meok-backend 'sudo systemctl edit meok-one'  → Environment=MEOK_PRO_CHECKOUT_URL=<url>  → restart
set -euo pipefail
AK=(); [ -n "${STRIPE_API_KEY:-}" ] && AK=(--api-key "$STRIPE_API_KEY")
jget(){ python3 -c "import sys,json;print(json.load(sys.stdin)['$1'])"; }

echo "→ creating product…"
PROD=$(stripe products create "${AK[@]}" \
  -d name="MEOK ONE Pro" \
  -d "description=All 27 characters · full cross-device memory · signed attestation on export · governed by SOV3" \
  | jget id)
echo "  product: $PROD"

echo "→ creating £9/mo price…"
PRICE=$(stripe prices create "${AK[@]}" \
  -d product="$PROD" -d unit_amount=900 -d currency=gbp -d "recurring[interval]=month" \
  | jget id)
echo "  price: $PRICE"

echo "→ creating payment link…"
LINK=$(stripe payment_links create "${AK[@]}" \
  -d "line_items[0][price]=$PRICE" -d "line_items[0][quantity]=1" \
  -d "after_completion[type]=redirect" \
  -d "after_completion[redirect][url]=https://meok.ai/os" \
  | jget url)

echo ""
echo "==================================================================="
echo "  MEOK ONE Pro (£9/mo) payment link:"
echo "  $LINK"
echo "==================================================================="
echo "  Next: set MEOK_PRO_CHECKOUT_URL=$LINK on the VM (or send it to Claude)."
