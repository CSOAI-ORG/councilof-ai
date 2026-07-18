"""
OpenPatent.ai PAYG pricing tiers.
Canonical 49/149/999/2499 GBP pricing (per FACTS_PROPAGATION).
Local USD pricing displayed to users.
"""
# 5-tier PAYG model (USD display, GBP billing for UK customers)
PRICING_TIERS = {
    "free": {
        "price_usd": 0,
        "price_gbp": 0,
        "label": "Free / Self-Hosted",
        "tagline": "Open source forever. Run it on your own machine.",
        "crypto_layers": ["sha3_512", "hmac", "ed25519"],
        "deliverables": [
            "Self-hosted PatentMCP (MIT)",
            "Unlimited local disclosures",
            "Local audit chain",
            "Community Discord support",
        ],
        "anchor": "Local hash-chain only",
        "fees": {"per_disclosure": 0.0, "currency": "USD"},
    },
    "starter": {
        "price_usd": 29,
        "price_gbp": 29,
        "label": "Starter",
        "tagline": "Public attestation, no blockchain anchor. $29 / £29 per disclosure.",
        "crypto_layers": ["sha3_512", "hmac", "ed25519", "c2pa"],
        "deliverables": [
            "All Free deliverables",
            "Public attestation page at verify.openpatent.ai",
            "C2PA Content Credential",
            "Registry entry (1-year verification)",
            "Downloadable proof package",
        ],
        "anchor": "C2PA signed, public verification",
        "fees": {"per_disclosure": 29.0, "currency": "USD"},
    },
    "defensive": {
        "price_usd": 149,
        "price_gbp": 149,
        "label": "Defensive",
        "tagline": "$10 insurance against AI idea theft. Now $149 — Bitcoin-anchored.",
        "crypto_layers": ["sha3_512", "hmac", "ed25519", "c2pa", "bitcoin_ots", "polygon"],
        "deliverables": [
            "All Starter deliverables",
            "Bitcoin OpenTimestamps anchor (immutable, court-admissible)",
            "Polygon secondary anchor (sub-2-second confirmation)",
            "Priority support",
        ],
        "anchor": "Bitcoin + Polygon dual-anchor",
        "fees": {"per_disclosure": 149.0, "currency": "USD"},
    },
    "full": {
        "price_usd": 999,
        "price_gbp": 999,
        "label": "Full",
        "tagline": "Investor-grade IP assets. 5-jurisdiction crosswalk + AI-assisted claims.",
        "crypto_layers": ["sha3_512", "hmac", "ed25519", "c2pa", "bitcoin_ots", "polygon", "bft_council"],
        "deliverables": [
            "All Defensive deliverables",
            "5-jurisdiction crosswalk (US/EU/UK/CN/JP)",
            "AI-assisted patent claim drafting (OpenPatent fork)",
            "Hash-chained audit certificate",
            "Expedited Bitcoin confirmation (<30 min)",
        ],
        "anchor": "Bitcoin + Polygon + BFT Council attestation",
        "fees": {"per_disclosure": 999.0, "currency": "USD"},
    },
    "premium": {
        "price_usd": 2499,
        "price_gbp": 2499,
        "label": "Premium",
        "tagline": "33-agent BFT council review. The strongest prior art in existence.",
        "crypto_layers": [
            "sha3_512", "hmac", "ed25519", "c2pa", "bitcoin_ots", "polygon", "bft_council", "ipfs",
        ],
        "deliverables": [
            "All Full deliverables",
            "33-agent BFT Council review (22/33 threshold)",
            "Per-agent Ed25519 attestations",
            "IPFS document pinning",
            "Defensive publication to IP.com Prior Art Database",
            "6-year verification retention",
            "White-glove onboarding",
        ],
        "anchor": "Bitcoin + Polygon + BFT + IPFS",
        "fees": {"per_disclosure": 2499.0, "currency": "USD"},
    },
    "enterprise": {
        "price_usd": 4999,  # per month
        "price_gbp": 4999,
        "label": "Enterprise",
        "tagline": "Unlimited disclosures, REST API, white-label, 99.9% SLA. $4,999/mo.",
        "crypto_layers": ["all"],
        "deliverables": [
            "Unlimited disclosures across all tiers",
            "REST API + webhooks",
            "White-label attestation pages (your-domain.openpatent.ai)",
            "Team management (10 seats, expandable)",
            "99.9% SLA + dedicated support",
            "On-prem deployment option",
        ],
        "anchor": "All anchors + dedicated infrastructure",
        "fees": {"per_month": 4999.0, "currency": "USD"},
    },
}

PAID_TIERS = {"starter", "defensive", "full", "premium", "enterprise"}

# x402 micropayment protocol splits (per master plan §5.2.2)
X402_REVENUE_SPLIT = {
    "operations_treasury": 0.60,  # 60% → openpatent ops
    "infrastructure_pool": 0.25,  # 25% → hermes/SOV3 infrastructure
    "bft_council_reward": 0.15,   # 15% → 33 council agents by participation
}
