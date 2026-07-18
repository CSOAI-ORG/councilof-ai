"""Payments router — Stripe Checkout integration."""

import os

import stripe
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/payments", tags=["payments"])

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")

# Price mapping — these should match your Stripe dashboard
PRICES = {
    "sovereign-pro": {"name": "Sovereign Pro", "amount": 999, "currency": "gbp"},  # £9.99
    "core-bundle": {"name": "MEOK Core Pack", "amount": 4900, "currency": "gbp"},  # £49
    "governance-bundle": {"name": "CSOAI Governance Suite", "amount": 19900, "currency": "gbp"},  # £199
}


class CheckoutRequest(BaseModel):
    price_id: str  # one of the keys above
    customer_email: str
    success_url: str = "http://localhost:3000/checkout/success"
    cancel_url: str = "http://localhost:3000/checkout/cancel"


class CheckoutResponse(BaseModel):
    session_id: str
    checkout_url: str


@router.post("/checkout/session", response_model=CheckoutResponse)
async def create_checkout_session(req: CheckoutRequest):
    if not stripe.api_key:
        raise HTTPException(status_code=503, detail="Stripe not configured")

    price = PRICES.get(req.price_id)
    if not price:
        raise HTTPException(status_code=400, detail=f"Unknown price_id: {req.price_id}")

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": price["currency"],
                    "product_data": {"name": price["name"]},
                    "unit_amount": price["amount"],
                    "recurring": {"interval": "month"},
                },
                "quantity": 1,
            }],
            mode="subscription",
            success_url=req.success_url + "?session_id={CHECKOUT_SESSION_ID}",
            cancel_url=req.cancel_url,
            customer_email=req.customer_email,
        )
        return CheckoutResponse(session_id=session.id, checkout_url=session.url)
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/checkout/session/{session_id}")
async def get_checkout_session(session_id: str):
    if not stripe.api_key:
        raise HTTPException(status_code=503, detail="Stripe not configured")
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        return {
            "status": session.status,
            "payment_status": session.payment_status,
            "customer_email": session.customer_email,
            "subscription": session.subscription,
        }
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))
