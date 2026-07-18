"""
stripe_links.py — placeholder checkout links for the 5 tiers.

Replace these with real Stripe Payment Links once STRIPE_SECRET_KEY is set.
Format: https://buy.stripe.com/openpatent-{tier}
"""
# 5 tiers, 5 Stripe payment links (placeholder)
STRIPE_LINKS = {
    "starter":   "https://buy.stripe.com/openpatent-starter-29",
    "defensive": "https://buy.stripe.com/openpatent-defensive-149",
    "full":      "https://buy.stripe.com/openpatent-full-999",
    "premium":   "https://buy.stripe.com/openpatent-premium-2499",
    "enterprise": "https://buy.stripe.com/openpatent-enterprise-4999",
}

TIER_INFO = {
    "starter":   {"name": "Starter",   "price": 29,    "period": "one-time",  "features": ["1 disclosure", "Bitcoin-anchored proof", "email receipt"]},
    "defensive": {"name": "Defensive", "price": 149,   "period": "one-time",  "features": ["10 disclosures", "Bitcoin-anchored proof", "court-admissible cert"]},
    "full":      {"name": "Full",      "price": 999,   "period": "one-time",  "features": ["100 disclosures", "5-jurisdiction crosswalk", "AI claim drafting"]},
    "premium":   {"name": "Premium",   "price": 2499,  "period": "one-time",  "features": ["1000 disclosures", "33-agent BFT review", "investor pack"]},
    "enterprise":{"name": "Enterprise","price": 4999,  "period": "monthly",   "features": ["unlimited disclosures", "white-label", "SLA", "sovereign deployment"]},
}


def get_checkout_url(tier: str, white_label: str = "") -> dict:
    """Return the checkout URL + tier info for a given tier."""
    tier = (tier or "").lower()
    if tier not in STRIPE_LINKS:
        return {"ok": False, "error": f"unknown tier: {tier}"}
    url = STRIPE_LINKS[tier]
    if white_label:
        url = f"{url}?client_reference_id={white_label}"
    return {"ok": True, "tier": tier, "checkout_url": url, "info": TIER_INFO[tier]}
