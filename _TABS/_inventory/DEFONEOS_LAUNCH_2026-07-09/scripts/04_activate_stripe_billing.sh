#!/bin/bash
# W44 Day 4 — ACTIVATE STRIPE BILLING
# This is the REAL script that will actually create Stripe products + prices + payment links.

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Validate stripe CLI is installed
if ! command -v stripe >/dev/null 2>&1; then
    echo "ERROR: stripe CLI not installed"
    echo "Install: brew install stripe/stripe-cli/stripe"
    echo "OR: docker run --rm -it stripe/stripe-cli:latest"
    exit 1
fi

# Validate STRIPE_API_KEY
if [ -z "$STRIPE_API_KEY" ]; then
    echo "ERROR: STRIPE_API_KEY not set"
    echo "Get from https://dashboard.stripe.com/apikeys"
    echo "  export STRIPE_API_KEY=<stripe-live-key-from-dashboard>"
    exit 1
fi

echo "=== CREATING STRIPE PRODUCTS ==="
echo ""

# Use the 7 pricing tiers from meek-defoneos-pricing-mcp
declare -a PRODUCTS=(
    "MIT|Open-source|free|0"
    "meok_consumer|Personal|recurring|49900"
    "csoai_pilot|90-day pilot|one-time|2500000"
    "csoai_enterprise|Annual enterprise|recurring|50000000"
    "defoneos_wedge|UK MOD|recurring|100000000"
    "per_transaction_toll|Per-transaction|usage_based|500"
    "humanoids_l7|Per-humanoid robot|recurring|50000"
)

for product in "${PRODUCTS[@]}"; do
    IFS='|' read -r name desc type amount <<< "$product"
    case "$type" in
        free)
            stripe products create --name "$name" --description "$desc" --api-key="$STRIPE_API_KEY" 2>&1 | tail -3 ;;
        one-time|recurring)
            amount_cents=$amount
            stripe prices create --unit-amount "$amount_cents" --currency gbp --product "prod_$name" --"$type" --api-key="$STRIPE_API_KEY" 2>&1 | tail -3 ;;
    esac
    echo ""
done

echo "=== CREATING PAYMENT LINKS ==="
stripe payment-links create --line-items '[{"price":"price_meok_consumer","quantity":1}]' --api-key="$STRIPE_API_KEY" 2>&1 | tail -5
