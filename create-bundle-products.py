#!/usr/bin/env python3
"""
CREATE ENTERPRISE BUNDLE PRODUCTS IN STRIPE
Creates the 4 bundled compliance packages as Stripe Products with prices.

Usage:
   export STRIPE_SECRET_KEY=sk_test_...   # or sk_live_...
   python3 create-bundle-products.py
"""

import stripe
import os
import sys

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")
if not stripe.api_key:
    print("Set STRIPE_SECRET_KEY")
    sys.exit(1)

mode = "LIVE" if "live" in stripe.api_key else "TEST"
print(f"Stripe mode: {mode}")

BUNDLES = [
    {
        "id": "meok-governance-bundle",
        "name": "Governance Bundle",
        "description": "20+ MCP servers covering EU AI Act, ISO 42001, ISO 27001, NIST RMF, GDPR, CSRD, UK AI Bill. Full regulatory coverage for enterprises. Signed attestation evidence. From MEOK AI Labs.",
        "price_gbp": 149,
        "price_usd": 190,
        "metadata": {
            "type": "bundle",
            "mcp_count": "20+",
            "regulations": "EU AI Act, ISO 42001, ISO 27001, NIST RMF, GDPR, CSRD, UK AI Bill",
            "category": "governance"
        }
    },
    {
        "id": "meok-security-bundle",
        "name": "Security Bundle",
        "description": "20+ MCP servers covering CRA, NIS2, SOC 2, HIPAA, PCI-DSS, OWASP, prompt injection firewall, threat detection, vulnerability scanning. Complete security posture for enterprises. From MEOK AI Labs.",
        "price_gbp": 199,
        "price_usd": 255,
        "metadata": {
            "type": "bundle",
            "mcp_count": "20+",
            "regulations": "CRA, NIS2, SOC 2, HIPAA, PCI-DSS, OWASP",
            "category": "security"
        }
    },
    {
        "id": "meok-industry-bundle",
        "name": "Industry Bundle",
        "description": "25+ MCP servers for regulated industries: healthcare AI governance, financial services (DORA + Basel), insurance (Solvency II), govtech, aviation, agriculture robotics. Sector-specific compliance tooling. From MEOK AI Labs.",
        "price_gbp": 299,
        "price_usd": 380,
        "metadata": {
            "type": "bundle",
            "mcp_count": "25+",
            "regulations": "DORA, Solvency II, Basel III, healthcare AI, govtech, aviation",
            "category": "industry"
        }
    },
    {
        "id": "meok-defence-bundle",
        "name": "Defence Bundle",
        "description": "30+ MCP servers: full EU AI Act + DORA + NIS2 + CRA + ISO 42001/27001 + threat detection + prompt injection firewall + attestation verification. Maximum coverage. Priority support. From MEOK AI Labs.",
        "price_gbp": 499,
        "price_usd": 635,
        "metadata": {
            "type": "bundle",
            "mcp_count": "30+",
            "regulations": "All EU AI Act, DORA, NIS2, CRA, ISO 42001, ISO 27001, SOC 2, HIPAA, PCI-DSS",
            "category": "defence"
        }
    },
]

def create_bundle(bundle):
    try:
        product = stripe.Product.create(
            id=bundle["id"],
            name=bundle["name"],
            description=bundle["description"][:1024],
            metadata=bundle["metadata"],
            statement_descriptor=bundle["name"][:22].upper(),
            tax_code="txcd_10000000",
        )

        price_monthly_gbp = stripe.Price.create(
            product=product.id,
            unit_amount=bundle["price_gbp"] * 100,
            currency="gbp",
            recurring={"interval": "month"},
            nickname=f"{bundle['name']} - Monthly GBP",
        )

        price_annual_gbp = stripe.Price.create(
            product=product.id,
            unit_amount=bundle["price_gbp"] * 10 * 100,  # 10x monthly = annual with ~17% discount
            currency="gbp",
            recurring={"interval": "year"},
            nickname=f"{bundle['name']} - Annual GBP",
        )

        price_monthly_usd = stripe.Price.create(
            product=product.id,
            unit_amount=bundle["price_usd"] * 100,
            currency="usd",
            recurring={"interval": "month"},
            nickname=f"{bundle['name']} - Monthly USD",
        )

        price_annual_usd = stripe.Price.create(
            product=product.id,
            unit_amount=bundle["price_usd"] * 10 * 100,
            currency="usd",
            recurring={"interval": "year"},
            nickname=f"{bundle['name']} - Annual USD",
        )

        print(f"  {bundle['name']}")
        print(f"    Product: {product.id}")
        print(f"    GBP mo:  £{bundle['price_gbp']}/mo  ({price_monthly_gbp.id})")
        print(f"    GBP yr:  £{bundle['price_gbp']*10}/yr ({price_annual_gbp.id})")
        print(f"    USD mo:  ${bundle['price_usd']}/mo  ({price_monthly_usd.id})")
        print(f"    USD yr:  ${bundle['price_usd']*10}/yr ({price_annual_usd.id})")
        return True

    except stripe.error.StripeError as e:
        if "already exists" in str(e):
            print(f"  {bundle['name']} — already exists, updating prices...")
            return update_bundle_prices(bundle)
        print(f"  {bundle['name']}: {e}")
        return False

def update_bundle_prices(bundle):
    """Update prices for existing bundle (products immutable, create new prices)"""
    try:
        price_monthly_gbp = stripe.Price.create(
            product=bundle["id"],
            unit_amount=bundle["price_gbp"] * 100,
            currency="gbp",
            recurring={"interval": "month"},
            nickname=f"{bundle['name']} - Monthly GBP",
        )
        price_annual_gbp = stripe.Price.create(
            product=bundle["id"],
            unit_amount=bundle["price_gbp"] * 10 * 100,
            currency="gbp",
            recurring={"interval": "year"},
            nickname=f"{bundle['name']} - Annual GBP",
        )
        print(f"  {bundle['name']} — new prices created")
        print(f"    GBP mo: £{bundle['price_gbp']}/mo ({price_monthly_gbp.id})")
        print(f"    GBP yr: £{bundle['price_gbp']*10}/yr ({price_annual_gbp.id})")
        return True
    except Exception as e:
        print(f"  {bundle['name']} price update: {e}")
        return False

def main():
    print(f"Creating 4 enterprise bundles in {mode} mode...")
    print()

    created = 0
    failed = 0

    for bundle in BUNDLES:
        if create_bundle(bundle):
            created += 1
        else:
            failed += 1
        print()

    print(f"Created: {created}  Failed: {failed}")

    if created == 4:
        print()
        print("Next: Create payment links for each bundle:")
        for b in BUNDLES:
            print(f"  https://dashboard.stripe.com/products/{b['id']}")

if __name__ == "__main__":
    main()
