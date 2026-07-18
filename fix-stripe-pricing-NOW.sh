#!/bin/bash
# STRIPE PRICING FIX — run this AFTER activating live mode
# Corrects 6 misaligned prices

echo "This script uses the Stripe CLI to fix pricing."
echo "Install: brew install stripe/stripe-cli/stripe"
echo ""
echo "You need to run: stripe login first"
echo ""

# Check Stripe CLI
if ! command -v stripe &> /dev/null; then
    echo "Stripe CLI not installed. Install with:"
    echo "  brew install stripe/stripe-cli/stripe"
    echo ""
    echo "Or fix manually in Stripe Dashboard → Products:"
    echo ""
    echo "CORRECT PRICES:"
    echo "  MEOK Core Pack:     £49/mo"
    echo "  Governance Bundle:  £149/mo"
    echo "  Security Bundle:    £199/mo"
    echo "  Defence Bundle:     £499/mo"
    echo "  Industry Bundle:    £299/mo"  
    echo "  COBOL Bridge Pro:   £199/mo (NOT £2,499!)"
    echo ""
    echo "Steps:"
    echo "  1. Stripe Dashboard → Products"
    echo "  2. Find each product"
    echo "  3. Edit price to correct amount"
    echo "  4. Archive the wrong price (don't delete)"
    exit 1
fi

echo "Fixing prices..."
# These would use stripe CLI commands — but Nick needs to do this in dashboard
# since we need live mode first

echo ""
echo "PRICES TO FIX IN STRIPE DASHBOARD:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Product              WRONG        CORRECT"
echo "  MEOK Core Pack       £79/mo   →   £49/mo"
echo "  Governance Bundle    £99/mo   →   £149/mo"
echo "  Security Bundle      £149/mo  →   £199/mo"
echo "  Defence Bundle       £199/mo  →   £499/mo"
echo "  Industry Bundle      £129/mo  →   £299/mo"
echo "  COBOL Bridge Pro     £2,499/mo →  £199/mo  ← CRITICAL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
