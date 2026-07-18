"""
SOV3 Stripe Checkout Integration
CSOAI Ltd UK 16939677 · MIT License · 30 June 2026

Full Stripe Checkout integration for 4-tier pricing:
- Citizen $0 (open source, no Stripe needed)
- Citizen+ $9/month
- Pro $29/month
- Enterprise $99/seat/month

Plus Pay-As-You-Go and bulk packs.

Usage:
    from sov3_stripe import SOV3Stripe
    stripe = SOV3Stripe(api_key=STRIPE_SECRET)
    session = stripe.create_checkout_session(plan="pro", user_email=user.email)
    return RedirectResponse(url=session.url)
"""

import os
import stripe
from typing import Dict, Any, Optional
from datetime import datetime, timezone

# === Stripe Config ===
STRIPE_API_KEY = os.environ.get("STRIPE_SECRET_KEY", "sk_test_...")
STRIPE_PUBLISHABLE_KEY = os.environ.get("STRIPE_PUBLISHABLE_KEY", "pk_test_...")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "whsec_...")

stripe.api_key = STRIPE_API_KEY

# === Sovereign Constants ===
CARE_FLOOR = 0.95
CROWN_LINEAGE = "1795-2026"
SOV3_LICENSE = "MIT"

# === Pricing Tiers (matches /pro/ page) ===
TIERS = {
    "citizen": {
        "name": "Citizen",
        "price_monthly": 0,
        "price_annual": 0,
        "stripe_price_id": None,  # Free
        "queries_included": None,  # Unlimited (self-hosted)
        "sla": None,
    },
    "citizen-plus": {
        "name": "Citizen+",
        "price_monthly": 9,
        "price_annual": 7.20,  # 20% off
        "stripe_price_id_monthly": "price_citizen_plus_monthly",
        "stripe_price_id_annual": "price_citizen_plus_annual",
        "queries_included": 100_000,
        "sla": "99.5%",
    },
    "pro": {
        "name": "Pro",
        "price_monthly": 29,
        "price_annual": 23.20,  # 20% off
        "stripe_price_id_monthly": "price_pro_monthly",
        "stripe_price_id_annual": "price_pro_annual",
        "queries_included": 500_000,
        "sla": "99.9%",
    },
    "enterprise": {
        "name": "Enterprise",
        "price_monthly": 99,
        "price_annual": 79.20,  # 20% off
        "stripe_price_id_monthly": "price_enterprise_monthly",
        "stripe_price_id_annual": "price_enterprise_annual",
        "queries_included": None,  # Unlimited
        "sla": "99.99%",
    },
}

# === Bulk Packs (one-time purchases) ===
BULK_PACKS = {
    "pack-10k": {"name": "10,000 queries", "queries": 10_000, "price_cents": 40_000},  # $400
    "pack-50k": {"name": "50,000 queries", "queries": 50_000, "price_cents": 175_000},  # $1,750
    "pack-100k": {"name": "100,000 queries", "queries": 100_000, "price_cents": 300_000},  # $3,000
    "pack-1m": {"name": "1,000,000 queries", "queries": 1_000_000, "price_cents": 2_500_000},  # $25,000 (contact sales)
}

# === Discount Codes ===
DISCOUNT_CODES = {
    "NONPROFIT50": 50,  # 50% off for non-profits
    "EDUCATION75": 75,  # 75% off for education
    "LAUNCH20": 20,  # 20% off launch day
    "EARLYBIRD25": 25,  # 25% off early birds
    "FORK10": 10,  # 10% off fork community
}


class SOV3Stripe:
    """SOV3 Stripe checkout + subscription manager."""

    def __init__(self, api_key: str = STRIPE_API_KEY, webhook_secret: str = STRIPE_WEBHOOK_SECRET):
        self.api_key = api_key
        self.webhook_secret = webhook_secret
        stripe.api_key = api_key

    def get_tier(self, plan: str) -> Dict:
        return TIERS.get(plan)

    def get_bulk_pack(self, pack_id: str) -> Optional[Dict]:
        return BULK_PACKS.get(pack_id)

    def create_checkout_session(
        self,
        plan: str,
        user_email: str,
        success_url: str = "https://csoai.org/pro/success",
        cancel_url: str = "https://csoai.org/pro/",
        interval: str = "month",
        discount_code: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create a Stripe Checkout session for a subscription tier.

        Args:
            plan: One of "citizen-plus", "pro", "enterprise"
            user_email: Citizen's email (for receipt + customer)
            success_url: Where to redirect after successful payment
            cancel_url: Where to redirect if user cancels
            interval: "month" or "year"
            discount_code: Optional discount code

        Returns:
            Stripe checkout session dict with `id` and `url`
        """
        tier = TIERS.get(plan)
        if not tier or tier["price_monthly"] == 0:
            raise ValueError(f"Cannot create checkout for free plan: {plan}")

        price_id = (
            tier["stripe_price_id_annual"] if interval == "year"
            else tier["stripe_price_id_monthly"]
        )

        # Apply discount if provided
        discounts = []
        if discount_code and discount_code in DISCOUNT_CODES:
            coupon = stripe.Coupon.create(
                percent_off=DISCOUNT_CODES[discount_code],
                duration="forever",
                name=f"SOV3 {discount_code}",
            )
            discounts.append({"coupon": coupon.id})

        # Create checkout session
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price": price_id,
                "quantity": 1,
            }],
            mode="subscription",
            customer_email=user_email,
            success_url=success_url + "?session_id={CHECKOUT_SESSION_ID}",
            cancel_url=cancel_url,
            discounts=discounts,
            metadata={
                "plan": plan,
                "interval": interval,
                "crown_lineage": CROWN_LINEAGE,
                "sovereign_composite": "7.305",
                "care_floor": str(CARE_FLOOR),
                "license": SOV3_LICENSE,
                "data_residency": "UK",
            },
            subscription_data={
                "metadata": {
                    "plan": plan,
                    "crown_lineage": CROWN_LINEAGE,
                    "care_floor": str(CARE_FLOOR),
                },
            },
        )

        return {
            "id": session.id,
            "url": session.url,
            "plan": plan,
            "interval": interval,
            "price_cents": int(tier[f"price_{interval}ly"] * 100),
        }

    def create_bulk_pack_checkout(
        self,
        pack_id: str,
        user_email: str,
        success_url: str = "https://csoai.org/pro/success",
        cancel_url: str = "https://csoai.org/pro/",
    ) -> Dict[str, Any]:
        """Create a one-time payment session for a bulk query pack."""
        pack = BULK_PACKS.get(pack_id)
        if not pack:
            raise ValueError(f"Unknown pack: {pack_id}")

        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "unit_amount": pack["price_cents"],
                    "product_data": {
                        "name": pack["name"],
                        "description": f"Pay-as-you-go bulk pack: {pack['queries']:,} sovereign queries. Never expires.",
                    },
                },
                "quantity": 1,
            }],
            mode="payment",
            customer_email=user_email,
            success_url=success_url + "?session_id={CHECKOUT_SESSION_ID}&pack=" + pack_id,
            cancel_url=cancel_url,
            metadata={
                "pack_id": pack_id,
                "queries": pack["queries"],
                "crown_lineage": CROWN_LINEAGE,
                "type": "bulk_pack",
            },
        )

        return {
            "id": session.id,
            "url": session.url,
            "pack_id": pack_id,
            "queries": pack["queries"],
            "price_cents": pack["price_cents"],
        }

    def create_payg_invoice(self, plan: str, user_email: str, queries: int) -> Dict[str, Any]:
        """Generate an invoice for Pay-As-You-Go overage."""
        tier = TIERS.get(plan)
        if not tier:
            raise ValueError(f"Unknown plan: {plan}")

        # PAYG rates
        payg_rates = {
            "citizen-plus": 0.05,  # $0.05/query
            "pro": 0.04,            # $0.04/query (20% off)
            "enterprise": 0.03,    # $0.03/query (volume)
        }
        rate = payg_rates.get(plan, 0.05)
        total = queries * rate

        # Create one-time invoice
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "unit_amount": int(total * 100),
                    "product_data": {
                        "name": f"PAYG Overage — {plan}",
                        "description": f"{queries:,} additional sovereign queries at ${rate}/query",
                    },
                },
                "quantity": 1,
            }],
            mode="payment",
            customer_email=user_email,
            success_url="https://csoai.org/pro/success?session_id={CHECKOUT_SESSION_ID}&type=payg",
            cancel_url="https://csoai.org/pro/",
            metadata={
                "plan": plan,
                "queries": queries,
                "rate": rate,
                "type": "payg",
            },
        )

        return {
            "id": session.id,
            "url": session.url,
            "plan": plan,
            "queries": queries,
            "rate": rate,
            "total_cents": int(total * 100),
        }

    def handle_webhook(self, payload: bytes, sig_header: str) -> Dict[str, Any]:
        """Handle Stripe webhook events."""
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, self.webhook_secret
            )
        except ValueError:
            raise ValueError("Invalid payload")
        except stripe.error.SignatureVerificationError:
            raise ValueError("Invalid signature")

        # Handle events
        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            return {
                "type": "checkout.session.completed",
                "session_id": session["id"],
                "customer_email": session.get("customer_email"),
                "plan": session["metadata"].get("plan"),
                "pack_id": session["metadata"].get("pack_id"),
                "queries": session["metadata"].get("queries"),
            }

        elif event["type"] == "customer.subscription.created":
            subscription = event["data"]["object"]
            return {
                "type": "customer.subscription.created",
                "subscription_id": subscription["id"],
                "customer": subscription["customer"],
                "plan": subscription["metadata"].get("plan"),
            }

        elif event["type"] == "customer.subscription.deleted":
            subscription = event["data"]["object"]
            return {
                "type": "customer.subscription.deleted",
                "subscription_id": subscription["id"],
            }

        elif event["type"] == "invoice.payment_succeeded":
            invoice = event["data"]["object"]
            return {
                "type": "invoice.payment_succeeded",
                "invoice_id": invoice["id"],
                "amount_paid": invoice["amount_paid"],
            }

        return {"type": event["type"], "received": True}

    def create_customer_portal_session(self, customer_id: str, return_url: str = "https://csoai.org/pro/") -> Dict[str, str]:
        """Create a Stripe Customer Portal session for self-service billing management."""
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=return_url,
        )
        return {
            "id": session.id,
            "url": session.url,
        }

    def get_subscription(self, subscription_id: str) -> Dict[str, Any]:
        """Get current subscription details."""
        sub = stripe.Subscription.retrieve(subscription_id)
        return {
            "id": sub.id,
            "status": sub.status,
            "current_period_end": sub.current_period_end,
            "cancel_at_period_end": sub.cancel_at_period_end,
            "plan": sub.metadata.get("plan"),
        }


# === FastAPI Routes (call from main app) ===
def register_stripe_routes(app):
    """Register all Stripe-related FastAPI routes."""
    from fastapi import Request, HTTPException, Depends
    from fastapi.responses import JSONResponse, RedirectResponse

    stripe_client = SOV3Stripe()

    @app.post("/api/stripe/create-checkout")
    async def create_checkout(request: Request):
        """Create Stripe checkout session for subscription."""
        body = await request.json()
        plan = body.get("plan")
        user_email = body.get("email")
        interval = body.get("interval", "month")
        discount_code = body.get("discount_code")

        if not plan or not user_email:
            raise HTTPException(400, "plan and email required")

        try:
            session = stripe_client.create_checkout_session(
                plan=plan,
                user_email=user_email,
                interval=interval,
                discount_code=discount_code,
            )
            return JSONResponse(session)
        except Exception as e:
            raise HTTPException(500, str(e))

    @app.post("/api/stripe/create-bulk-pack")
    async def create_bulk_pack(request: Request):
        """Create Stripe checkout for bulk query pack."""
        body = await request.json()
        pack_id = body.get("pack_id")
        user_email = body.get("email")

        if not pack_id or not user_email:
            raise HTTPException(400, "pack_id and email required")

        try:
            session = stripe_client.create_bulk_pack_checkout(pack_id, user_email)
            return JSONResponse(session)
        except Exception as e:
            raise HTTPException(500, str(e))

    @app.post("/api/stripe/webhook")
    async def stripe_webhook(request: Request):
        """Handle Stripe webhook events."""
        payload = await request.body()
        sig_header = request.headers.get("stripe-signature")

        try:
            result = stripe_client.handle_webhook(payload, sig_header)
            return JSONResponse(result)
        except ValueError as e:
            raise HTTPException(400, str(e))

    @app.post("/api/stripe/customer-portal")
    async def customer_portal(request: Request):
        """Get customer portal URL for billing management."""
        body = await request.json()
        customer_id = body.get("customer_id")
        if not customer_id:
            raise HTTPException(400, "customer_id required")
        try:
            session = stripe_client.create_customer_portal_session(customer_id)
            return JSONResponse(session)
        except Exception as e:
            raise HTTPException(500, str(e))


# === Sovereign SIGIL on every Stripe transaction ===
def emit_sovereign_sigil(stripe_event: Dict) -> str:
    """Emit a sovereign SIGIL for every Stripe transaction."""
    import hashlib
    timestamp = datetime.now(timezone.utc).isoformat()
    content = f"{stripe_event.get('type', 'unknown')}|{stripe_event.get('customer_email', 'unknown')}|{timestamp}"
    digest = hashlib.sha256(content.encode()).hexdigest()[:16]
    return f"C|sov3_stripe|{stripe_event.get('type')}|{digest}|{timestamp}"