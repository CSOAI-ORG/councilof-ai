#!/usr/bin/env python3
"""
Stripe Product + Payment Link Creator — MEOK AI Labs
Creates all products and payment links in Stripe.

Usage:
  1. Switch Stripe to LIVE mode in dashboard
  2. Get LIVE secret key from ~/.secrets/stripe_live.env
  3. Run: STRIPE_SECRET_KEY=sk_live_... python3 create_stripe_products.py

Creates:
  - 6 MEOK subscription tiers
  - 3 COBOL Bridge tiers
  - 3 ProofOf.ai tiers
  - 5 one-time products
  - Payment links for all products
"""

import os
import sys

try:
    import stripe
except ImportError:
    print("Installing stripe...")
    os.system("pip3 install stripe")
    import stripe

# === CONFIGURATION ===
STRIPE_KEY = os.environ.get("STRIPE_SECRET_KEY")
if not STRIPE_KEY:
    print("ERROR: Set STRIPE_SECRET_KEY environment variable")
    print("Usage: STRIPE_SECRET_KEY=sk_live_... python3 create_stripe_products.py")
    sys.exit(1)

stripe.api_key = STRIPE_KEY

# === PRODUCTS ===
products = [
    # MEOK AI Labs Subscriptions
    {
        "name": "MEOK Core",
        "description": "EU AI Act compliance essentials for small businesses",
        "price": 4900,  # £49.00 in pence
        "interval": "month",
        "category": "meok",
        "features": ["AI Use Policy template", "Data Processing Record", "Privacy Notice update", "Quarterly attestation"]
    },
    {
        "name": "MEOK Governance",
        "description": "Full governance suite for mid-market businesses",
        "price": 14900,  # £149.00
        "interval": "month",
        "category": "meok",
        "features": ["Everything in Core", "AI Risk Assessment", "Staff Training Log", "Monthly compliance review", "Priority support"]
    },
    {
        "name": "MEOK Security",
        "description": "Security-focused compliance for regulated industries",
        "price": 19900,  # £199.00
        "interval": "month",
        "category": "meok",
        "features": ["Everything in Governance", "Security audit templates", "Incident response plan", "DORA compliance module", "Weekly monitoring"]
    },
    {
        "name": "MEOK Industry",
        "description": "Industry-specific compliance with custom modules",
        "price": 29900,  # £299.00
        "interval": "month",
        "category": "meok",
        "features": ["Everything in Security", "Industry-specific templates", "Custom attestation rules", "Dedicated compliance officer", "SLA guarantee"]
    },
    {
        "name": "MEOK Defence",
        "description": "Enterprise-grade compliance for defence and critical infrastructure",
        "price": 49900,  # £499.00
        "interval": "month",
        "category": "meok",
        "features": ["Everything in Industry", "Military-grade encryption", "On-premise deployment option", "24/7 support", "Custom integrations", "Audit trail export"]
    },
    {
        "name": "MEOK Care Home Pack",
        "description": "Compliance pack specifically for independent care homes",
        "price": 15000,  # £150.00
        "interval": "month",
        "category": "meok",
        "features": ["AI Use Policy (care home specific)", "GDPR Article 9 Privacy Notice", "Staff AI Training Log", "Quarterly attestation", "30-min quarterly consult"]
    },

    # COBOL Bridge Subscriptions
    {
        "name": "COBOL Bridge Pro",
        "description": "AI-assisted COBOL-to-modern-language translation",
        "price": 19900,  # £199.00
        "interval": "month",
        "category": "cobol",
        "features": ["COBOL code analysis", "Translation suggestions", "Copybook parser", "JCL scanner", "Email support"]
    },
    {
        "name": "COBOL Bridge Enterprise",
        "description": "Enterprise COBOL modernization with dedicated support",
        "price": 199900,  # £1,999.00
        "interval": "month",
        "category": "cobol",
        "features": ["Everything in Pro", "Full codebase migration", "CICS bridge", "VSAM mapper", "Dedicated engineer", "SLA guarantee"]
    },
    {
        "name": "COBOL DORA Assessment",
        "description": "DORA compliance assessment for financial institutions with COBOL systems",
        "price": 1500000,  # £15,000.00
        "interval": "one_time",
        "category": "cobol",
        "features": ["Full DORA assessment", "COBOL system audit", "Remediation roadmap", "Executive report", "Board presentation"]
    },

    # ProofOf.ai Subscriptions
    {
        "name": "ProofOf.ai Pro",
        "description": "Public verification surface for compliance attestations",
        "price": 9900,  # £99.00
        "interval": "month",
        "category": "proofof",
        "features": ["Verification page", "HMAC-signed certificates", "Public verification URL", "Audit trail", "Email support"]
    },
    {
        "name": "ProofOf.ai Enterprise",
        "description": "Enterprise verification with custom branding and API access",
        "price": 49900,  # £499.00
        "interval": "month",
        "category": "proofof",
        "features": ["Everything in Pro", "Custom branding", "API access", "Bulk verification", "Dedicated support", "SLA guarantee"]
    },
    {
        "name": "ProofOf.ai Per-Certificate",
        "description": "Individual certificate verification",
        "price": 500,  # £5.00
        "interval": "one_time",
        "category": "proofof",
        "features": ["Single certificate verification", "Public verification URL", "HMAC-signed", "Downloadable PDF"]
    },

    # One-time products
    {
        "name": "EU AI Act Toolkit",
        "description": "Complete EU AI Act compliance toolkit — templates, checklists, and guidance",
        "price": 19900,  # £199.00
        "interval": "one_time",
        "category": "onetime",
        "features": ["15+ templates", "Compliance checklist", "Risk assessment guide", "Documentation templates", "Lifetime updates"]
    },
    {
        "name": "48-Hour Compliance Assessment",
        "description": "Comprehensive AI compliance assessment delivered in 48 hours",
        "price": 500000,  # £5,000.00
        "interval": "one_time",
        "category": "onetime",
        "features": ["Full AI inventory", "Risk classification", "Gap analysis", "Remediation roadmap", "Executive summary", "Board-ready report"]
    },
    {
        "name": "Asimov V8 CAD Pack",
        "description": "WOLF gear 3D-printable CAD files and assembly instructions",
        "price": 2900,  # £29.00
        "interval": "one_time",
        "category": "onetime",
        "features": ["CAD files (STL + STEP)", "Assembly instructions", "BOM", "Material specifications", "Print settings"]
    },
    {
        "name": "COBOL Bridge Analysis",
        "description": "One-time COBOL codebase analysis and modernization feasibility report",
        "price": 2000000,  # £20,000.00
        "interval": "one_time",
        "category": "onetime",
        "features": ["Full codebase scan", "Complexity analysis", "Migration cost estimate", "Timeline projection", "Risk assessment", "Executive report"]
    },
    {
        "name": "Founder Consulting Day",
        "description": "Full day of AI compliance consulting with Nicholas Templeman",
        "price": 95000,  # £950.00
        "interval": "one_time",
        "category": "onetime",
        "features": ["8-hour consulting session", "AI compliance review", "Custom recommendations", "Follow-up email summary", "30-day email support"]
    }
]


def create_product(prod_config):
    """Create a Stripe product + price + payment link."""
    name = prod_config["name"]
    desc = prod_config["description"]
    price = prod_config["price"]
    interval = prod_config["interval"]
    category = prod_config["category"]
    features = prod_config["features"]

    # Check if product already exists
    existing = stripe.Product.list(limit=100)
    for prod in existing.data:
        if prod.name == name:
            print(f"  ⏭️  Product '{name}' already exists, skipping")
            return prod

    # Create product
    product = stripe.Product.create(
        name=name,
        description=desc,
        metadata={"category": category}
    )
    print(f"  ✅ Created product: {name} ({product.id})")

    # Create price
    if interval == "one_time":
        price_obj = stripe.Price.create(
            product=product.id,
            unit_amount=price,
            currency="gbp",
        )
    else:
        price_obj = stripe.Price.create(
            product=product.id,
            unit_amount=price,
            currency="gbp",
            recurring={"interval": interval},
        )
    print(f"  ✅ Created price: £{price/100:.2f} ({price_obj.id})")

    # Create payment link
    payment_link = stripe.PaymentLink.create(
        line_items=[{"price": price_obj.id, "quantity": 1}],
        metadata={
            "product_name": name,
            "category": category,
            "features": ", ".join(features)
        }
    )
    print(f"  🔗 Payment link: {payment_link.url}")

    return {
        "product": product,
        "price": price_obj,
        "payment_link": payment_link
    }


def main():
    print("=" * 60)
    print("MEOK AI Labs — Stripe Product Creator")
    print("=" * 60)
    print(f"Mode: {'LIVE' if STRIPE_KEY.startswith('sk_live') else 'TEST'}")
    print(f"Products to create: {len(products)}")
    print()

    results = []
    for i, prod in enumerate(products, 1):
        print(f"[{i}/{len(products)}] {prod['name']}")
        result = create_product(prod)
        results.append(result)
        print()

    # Summary
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    for r in results:
        if isinstance(r, dict) and "payment_link" in r:
            pl = r["payment_link"]
            print(f"{r['product']['name']}: {pl.url}")
        elif hasattr(r, 'id'):
            print(f"{r.get('name', 'Existing')}: already exists")

    print()
    print(f"Total: {len(results)} products created/skipped")
    print()
    print("⚠️  IMPORTANT: If this was TEST mode, switch Stripe to LIVE")
    print("   then re-run with STRIPE_SECRET_KEY=sk_live_...")


if __name__ == "__main__":
    main()
