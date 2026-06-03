#!/usr/bin/env bash
# Create the 3 PAYG top-up Payment Links (£10 / £50 / £200) on Stripe.
# Idempotent: existing products with the same name are skipped.
# Usage:
#   export STRIPE_SECRET_KEY=sk_live_...
#   bash tools/create_payg_stripe_products.sh
#
# Prints the 3 buy.stripe.com URLs at the end — paste into council-ai-storefront/payg.html

set -euo pipefail

: "${STRIPE_SECRET_KEY:?STRIPE_SECRET_KEY env var required (sk_live_...)}"

API="https://api.stripe.com/v1"
CURL=(curl -s -u "$STRIPE_SECRET_KEY:")

create_product_and_link () {
  local name="$1" amount_pence="$2" description="$3" calls_count="$4"
  echo "--- $name ($amount_pence pence) ---"

  # 1) Find existing product by name (idempotency)
  local existing_id
  existing_id=$("${CURL[@]}" "$API/products?limit=100" \
    | python3 -c "
import sys, json
data = json.load(sys.stdin).get('data', [])
for p in data:
    if p.get('name') == '$name' and p.get('active'):
        print(p['id']); break
" || true)

  local product_id
  if [ -n "${existing_id:-}" ]; then
    product_id="$existing_id"
    echo "  product exists: $product_id"
  else
    product_id=$("${CURL[@]}" "$API/products" \
      -d "name=$name" \
      -d "description=$description" \
      -d "tax_code=txcd_10000000" \
      -d "metadata[product_line]=meok_payg" \
      -d "metadata[calls_included]=$calls_count" \
      | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")
    echo "  product created: $product_id"
  fi

  # 2) Find existing price
  local existing_price
  existing_price=$("${CURL[@]}" "$API/prices?product=$product_id&active=true&limit=10" \
    | python3 -c "
import sys, json
data = json.load(sys.stdin).get('data', [])
for p in data:
    if p.get('unit_amount') == $amount_pence and p.get('currency') == 'gbp':
        print(p['id']); break
" || true)

  local price_id
  if [ -n "${existing_price:-}" ]; then
    price_id="$existing_price"
    echo "  price exists: $price_id"
  else
    price_id=$("${CURL[@]}" "$API/prices" \
      -d "product=$product_id" \
      -d "currency=gbp" \
      -d "unit_amount=$amount_pence" \
      | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")
    echo "  price created: $price_id"
  fi

  # 3) Payment Link
  local link
  link=$("${CURL[@]}" "$API/payment_links" \
    -d "line_items[0][price]=$price_id" \
    -d "line_items[0][quantity]=1" \
    -d "after_completion[type]=redirect" \
    -d "after_completion[redirect][url]=https://councilof.ai/payg?topup=success&amount=$amount_pence" \
    -d "metadata[product_line]=meok_payg" \
    -d "metadata[calls_included]=$calls_count" \
    -d "allow_promotion_codes=true" \
    -d "billing_address_collection=auto" \
    -d "automatic_tax[enabled]=true" \
    | python3 -c "import json,sys; print(json.load(sys.stdin)['url'])")
  echo "  payment_link: $link"
  echo "$link" > "/tmp/payg_link_${amount_pence}.txt"
}

# Run for all three tiers.
create_product_and_link \
  "MEOK PAYG — £10 top-up (200 calls)" 1000 \
  "Pay-per-call balance top-up. £0.05/call across 7 MEOK compliance MCPs (EU AI Act, DORA, NIS2, CRA, CSRD, GDPR, ISO 42001). MEOK_PAYG_KEY emailed within 1 working day." \
  200

create_product_and_link \
  "MEOK PAYG — £50 top-up (1,000 calls)" 5000 \
  "Pay-per-call balance top-up. £0.05/call across 7 MEOK compliance MCPs. Most popular tier. MEOK_PAYG_KEY emailed within 1 working day." \
  1000

create_product_and_link \
  "MEOK PAYG — £200 top-up (4,000 calls)" 20000 \
  "Pay-per-call balance top-up. £0.05/call across 7 MEOK compliance MCPs. Bulk top-up for fleet deployments. MEOK_PAYG_KEY emailed within 1 working day." \
  4000

echo
echo "===================================="
echo "Done. Three Payment Links created:"
echo "===================================="
for amt in 1000 5000 20000; do
  url=$(cat "/tmp/payg_link_${amt}.txt")
  printf "  £%d → %s\n" $((amt / 100)) "$url"
done
echo
echo "Next step: paste these URLs into council-ai-storefront/payg.html"
echo "(replace the three mailto:nicholas@meok.ai buttons)"
