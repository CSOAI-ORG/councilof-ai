#!/usr/bin/env python3
"""
Create HVP (High-Value Professional) tier products for top 5 MCPs.
These include signed attestation certificates for auditor submissions.

Usage:
  STRIPE_SECRET_KEY=sk_live_... python3 create_hvp_tiers.py

Creates:
  - eu-ai-act-compliance HVP: £62.41/mo (auditor-signed certs)
  - dora-compliance HVP: £62.41/mo
  - dora-nis2-crosswalk HVP: £62.41/mo
  - ai-bom HVP: £62.41/mo
  - mdr-medical-device HVP: £62.41/mo
  - cobol-bridge HVP: £999 one-shot (full audit)
"""

import os
import sys

try:
    import stripe
except ImportError:
    os.system("pip3 install stripe")
    import stripe

STRIPE_KEY = os.environ.get("STRIPE_SECRET_KEY")
if not STRIPE_KEY:
    print("ERROR: Set STRIPE_SECRET_KEY environment variable")
    sys.exit(1)

stripe.api_key = STRIPE_KEY

HVP_PRODUCTS = [
    {
        "name": "EU AI Act Compliance — HVP",
        "description": "EU AI Act compliance with auditor-trusted signed attestation certificates. Includes Article 10-50 coverage, compliance report with cryptographic signatures, and public verify URL for regulator submissions.",
        "price": 6241,
        "interval": "month",
        "tier": "hvp",
        "mcp": "eu-ai-act-compliance",
        "features": "Signed attestation certificates for auditor submission, Article 10-50 full coverage, compliance report with HMAC signatures, public proofof.ai verify URL, priority support"
    },
    {
        "name": "DORA Compliance — HVP",
        "description": "DORA compliance with auditor-trusted signed attestation certificates for Article 21 ICT third-party risk. Includes IICT/ICT classification, contract template gap analysis, and regulator-ready signed evidence.",
        "price": 6241,
        "interval": "month",
        "tier": "hvp",
        "mcp": "dora-compliance",
        "features": "Signed attestation certificates for regulator submission, Article 21 ICT third-party risk coverage, IICT/ICT classification, signed compliance evidence"
    },
    {
        "name": "DORA-NIS2 Crosswalk — HVP",
        "description": "Dual DORA + NIS2 compliance with auditor-trusted signed certificates. Covers both frameworks simultaneously, saving 50% time vs separate tools.",
        "price": 6241,
        "interval": "month",
        "tier": "hvp",
        "mcp": "dora-nis2-crosswalk",
        "features": "Signed dual-framework attestation, DORA Article 21 + NIS2 Article 21 coverage, signed compliance report, public verify URL"
    },
    {
        "name": "AI-BOM — HVP",
        "description": "AI Bill of Materials with auditor-trusted signed CycloneDX 1.7 AI-BOM. Includes training data provenance, cryptographic signatures, and public verify URL for supply-chain disclosures.",
        "price": 6241,
        "interval": "month",
        "tier": "hvp",
        "mcp": "ai-bom",
        "features": "Signed CycloneDX 1.7 AI-BOM with training data provenance, HMAC-SHA256 signatures, public proofof.ai verify URL, CBOM for CRA Annex IV"
    },
    {
        "name": "MDR Medical Device — HVP",
        "description": "MDR Article 5 conformity assessment with auditor-trusted signed certificates. Includes technical documentation, clinical evaluation, and signed attestation for Notified Body submissions.",
        "price": 6241,
        "interval": "month",
        "tier": "hvp",
        "mcp": "mdr-medical-device",
        "features": "Signed MDR Article 5 attestation, conformity assessment workflow, clinical evaluation summary, signed technical documentation, Notified Body-ready"
    },
    {
        "name": "COBOL Bridge — Full Audit",
        "description": "Complete COBOL codebase modernization feasibility report. On-site analysis, complexity scoring, Year-2038 detection, CICS candidates, and board-ready executive summary.",
        "price": 99900,
        "interval": "one_time",
        "tier": "enterprise",
        "mcp": "cobol-bridge",
        "features": "Full codebase scan, modernization candidates ranked by value, Year-2038/date handling issues, CICS-to-modern candidates, executive summary, board presentation deck"
    },
]


def create_hvp_product(prod_config):
    name = prod_config["name"]
    desc = prod_config["description"]
    price = prod_config["price"]
    interval = prod_config["interval"]
    tier = prod_config["tier"]
    mcp = prod_config["mcp"]
    features = prod_config["features"]

    existing = stripe.Product.list(limit=100)
    for prod in existing.data:
        if prod.name == name:
            print(f"  ⏭️  Product '{name}' already exists")
            return None

    product = stripe.Product.create(
        name=name,
        description=desc,
        metadata={"tier": tier, "mcp": mcp}
    )
    print(f"  ✅ Created: {name} ({product.id})")

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
    print(f"  ✅ Price: £{price/100:.2f}/{interval} ({price_obj.id})")

    payment_link = stripe.PaymentLink.create(
        line_items=[{"price": price_obj.id, "quantity": 1}],
        metadata={"tier": tier, "mcp": mcp, "features": features}
    )
    print(f"  🔗 {payment_link.url}")
    return {"product": product, "price": price_obj, "payment_link": payment_link}


def main():
    mode = "LIVE" if STRIPE_KEY.startswith("sk_live") else "TEST"
    print(f"\n{'='*60}")
    print(f"MEOK AI Labs — HVP Tier Creator ({mode})")
    print(f"{'='*60}\n")

    results = []
    for prod in HVP_PRODUCTS:
        print(f"[HVP] {prod['name']}")
        r = create_hvp_product(prod)
        if r:
            results.append(r)
        print()

    print(f"\n{'='*60}")
    print(f"DONE — {len(results)} HVP products created")
    print(f"{'='*60}")
    for r in results:
        print(f"  {r['product']['name']}: {r['payment_link']['url']}")


if __name__ == "__main__":
    main()