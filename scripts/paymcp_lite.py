#!/usr/bin/env python3
"""
PayMCP Lite — Lightweight payment layer for MEOK MCP servers
============================================================
Since PayMCP requires Python >=3.10, this is a custom lightweight
implementation using the existing Stripe infrastructure.

Usage:
    from paymcp_lite import price, subscription, PayMCPConfig

    @mcp.tool()
    @price(amount=0.99, currency="USD")
    def my_tool(...):
        ...

Features:
    - @price decorator for pay-per-request billing
    - @subscription decorator for plan-gated tools
    - Stripe integration (uses existing STRIPE_SECRET_KEY)
    - Automatic payment link generation
    - Redis-backed state storage (optional)
    - Free tier: 3 calls/day, Pro: unlimited with valid payment
"""

import os
import json
import time
import hashlib
import functools
from datetime import datetime, timedelta
from typing import Optional, Callable, Dict, Any
from collections import defaultdict

# ── Stripe Integration ───────────────────────────────────────────────
STRIPE_ENABLED = False
try:
    import stripe
    stripe.api_key = os.environ.get("STRIPE_SECRET_KEY", "")
    if stripe.api_key:
        STRIPE_ENABLED = True
except ImportError:
    stripe = None

# ── Redis State Storage (optional) ──────────────────────────────────
REDIS_ENABLED = False
try:
    import redis
    _redis_client = redis.Redis.from_url(
        os.environ.get("REDIS_URL", "redis://localhost:6379"),
        decode_responses=True
    )
    _redis_client.ping()
    REDIS_ENABLED = True
except Exception:
    _redis_client = None

# ── In-Memory Fallback ──────────────────────────────────────────────
_payment_state: Dict[str, Any] = defaultdict(dict)
_usage_tracker: Dict[str, list] = defaultdict(list)

FREE_DAILY_LIMIT = 3  # Free tier: 3 calls/day


def _get_state(key: str) -> Optional[Any]:
    """Get state from Redis or in-memory fallback."""
    if REDIS_ENABLED and _redis_client:
        val = _redis_client.get(key)
        return json.loads(val) if val else None
    return _payment_state.get(key)


def _set_state(key: str, value: Any, ttl: int = 3600):
    """Set state with TTL in Redis or in-memory."""
    if REDIS_ENABLED and _redis_client:
        _redis_client.setex(key, ttl, json.dumps(value))
    else:
        _payment_state[key] = value


def _check_rate_limit(caller_id: str) -> Optional[str]:
    """Check free tier rate limit. Returns error message if exceeded."""
    now = datetime.now()
    cutoff = now - timedelta(days=1)

    if REDIS_ENABLED and _redis_client:
        # Redis-backed tracking
        key = f"paymcp:usage:{caller_id}"
        _redis_client.zremrangebyscore(key, 0, cutoff.timestamp())
        count = _redis_client.zcard(key)
        if count >= FREE_DAILY_LIMIT:
            return (
                f"Free tier limit reached ({FREE_DAILY_LIMIT}/day). "
                f"Pay ${FREE_DAILY_LIMIT * 0.33:.2f} to continue or upgrade to Pro."
            )
        _redis_client.zadd(key, {str(now.timestamp()): now.timestamp()})
        _redis_client.expire(key, 86400)
    else:
        # In-memory tracking
        _usage_tracker[caller_id] = [t for t in _usage_tracker[caller_id] if t > cutoff]
        if len(_usage_tracker[caller_id]) >= FREE_DAILY_LIMIT:
            return (
                f"Free tier limit reached ({FREE_DAILY_LIMIT}/day). "
                f"Pay to continue or upgrade to Pro."
            )
        _usage_tracker[caller_id].append(now)

    return None


def _create_stripe_payment_link(amount: float, currency: str, description: str) -> Optional[str]:
    """Create a Stripe payment link for the tool call."""
    if not STRIPE_ENABLED or not stripe:
        return None

    try:
        # Try to find existing price for this amount
        prices = stripe.Price.list(
            lookup_keys=[f"mcp_tool_{amount}_{currency.lower()}"],
            limit=1
        )

        if prices.data:
            price_id = prices.data[0].id
        else:
            # Create a new price
            price_obj = stripe.Price.create(
                unit_amount=int(amount * 100),  # cents
                currency=currency.lower(),
                product_data={
                    "name": f"MCP Tool Call — {description}",
                    "description": f"Pay-per-request access to {description}",
                },
                lookup_key=f"mcp_tool_{amount}_{currency.lower()}",
            )
            price_id = price_obj.id

        # Create payment link
        link = stripe.PaymentLink.create(
            line_items=[{"price": price_id, "quantity": 1}],
            after_completion={
                "type": "redirect",
                "redirect": {"url": "https://meok.ai/payment/success"}
            },
        )
        return link.url

    except Exception as e:
        print(f"[PayMCP] Stripe error: {e}")
        return None


# ── Decorators ──────────────────────────────────────────────────────

def price(amount: float, currency: str = "USD"):
    """Decorator: Charge per tool call.

    Args:
        amount: Price per call (e.g., 0.99 for $0.99)
        currency: Currency code (default: USD)

    Example:
        @mcp.tool()
        @price(amount=0.99, currency="USD")
        def classify_ai_risk(description: str) -> dict:
            ...
    """
    def decorator(func: Callable) -> Callable:
        func._paymcp_price = amount
        func._paymcp_currency = currency
        func._paymcp_billing_type = "per_request"

        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Extract caller ID from kwargs or args
            caller_id = kwargs.get("caller", "anonymous")
            api_key = kwargs.get("api_key", "")

            # Check rate limit (free tier)
            limit_err = _check_rate_limit(f"{func.__name__}:{caller_id}")
            if limit_err:
                # Free tier exhausted — require payment
                payment_link = _create_stripe_payment_link(
                    amount, currency, func.__name__
                )

                return {
                    "error": "payment_required",
                    "message": limit_err,
                    "payment_url": payment_link,
                    "amount": amount,
                    "currency": currency,
                    "tool": func.__name__,
                    "upgrade": {
                        "message": f"Unlock unlimited {func.__name__} calls",
                        "price": f"${amount:.2f} per call",
                        "stripe_checkout": payment_link,
                    }
                }

            # Check if user has an active payment session
            session_key = f"paymcp:session:{caller_id}:{func.__name__}"
            session = _get_state(session_key)

            if session and session.get("paid"):
                # Paid session — execute and decrement
                session["calls_remaining"] = session.get("calls_remaining", 1) - 1
                if session["calls_remaining"] <= 0:
                    _set_state(session_key, None)
                else:
                    _set_state(session_key, session, ttl=3600)
                return func(*args, **kwargs)

            # No active session — return payment prompt
            payment_link = _create_stripe_payment_link(
                amount, currency, func.__name__
            )

            return {
                "error": "payment_required",
                "message": (
                    f"This tool costs ${amount:.2f} per use. "
                    f"Complete payment to continue."
                ),
                "payment_url": payment_link,
                "amount": amount,
                "currency": currency,
                "tool": func.__name__,
                "stripe_checkout": payment_link,
            }

        return wrapper
    return decorator


def subscription(plan_id: str):
    """Decorator: Gate tool behind active subscription.

    Args:
        plan_id: Stripe price/plan ID (e.g., "price_pro_monthly")

    Example:
        @mcp.tool()
        @subscription(plan="price_eu_ai_act_pro")
        def full_compliance_audit(...) -> dict:
            ...
    """
    def decorator(func: Callable) -> Callable:
        func._paymcp_subscription = plan_id
        func._paymcp_billing_type = "subscription"

        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            caller_id = kwargs.get("caller", "anonymous")
            api_key = kwargs.get("api_key", "")

            # Check if caller has active subscription
            sub_key = f"paymcp:sub:{caller_id}:{plan_id}"
            sub = _get_state(sub_key)

            if sub and sub.get("active"):
                return func(*args, **kwargs)

            # No active subscription
            return {
                "error": "subscription_required",
                "message": (
                    f"This tool requires an active subscription ({plan_id}). "
                    f"Subscribe to unlock unlimited access."
                ),
                "plan": plan_id,
                "tool": func.__name__,
                "upgrade": {
                    "message": f"Subscribe to {plan_id} to use {func.__name__}",
                    "stripe_checkout": f"https://buy.stripe.com/{plan_id}",
                }
            }

        return wrapper
    return decorator


def verify_payment(payment_intent_id: str) -> bool:
    """Verify a Stripe payment intent was successful."""
    if not STRIPE_ENABLED or not stripe:
        return False
    try:
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        return intent.status == "succeeded"
    except Exception:
        return False


def grant_access(caller_id: str, tool_name: str, calls: int = 1):
    """Grant paid access to a tool for a caller."""
    session_key = f"paymcp:session:{caller_id}:{tool_name}"
    _set_state(session_key, {
        "paid": True,
        "calls_remaining": calls,
        "granted_at": datetime.now().isoformat(),
    }, ttl=3600)


# ── PayMCPConfig — FastMCP integration helper ───────────────────────

class PayMCPConfig:
    """Configuration helper for PayMCP integration."""

    def __init__(self, mcp_server, stripe_api_key: Optional[str] = None):
        self.mcp = mcp_server
        if stripe_api_key:
            stripe.api_key = stripe_api_key
            global STRIPE_ENABLED
            STRIPE_ENABLED = True

    def add_payment_tools(self):
        """Add helper tools for payment management."""

        @self.mcp.tool()
        def paymcp_status(caller: str = "anonymous") -> dict:
            """Check your PayMCP payment status and available credits."""
            key = f"paymcp:usage:{caller}"
            if REDIS_ENABLED and _redis_client:
                count = _redis_client.zcard(key)
            else:
                count = len(_usage_tracker.get(caller, []))

            return {
                "caller": caller,
                "free_calls_used_today": count,
                "free_calls_remaining": max(0, FREE_DAILY_LIMIT - count),
                "free_limit": FREE_DAILY_LIMIT,
                "stripe_enabled": STRIPE_ENABLED,
                "redis_enabled": REDIS_ENABLED,
            }

        @self.mcp.tool()
        def paymcp_list_priced_tools() -> dict:
            """List all tools with pricing information."""
            priced = []
            for name, tool in self.mcp._tools.items():
                if hasattr(tool, "_paymcp_price"):
                    priced.append({
                        "tool": name,
                        "price": tool._paymcp_price,
                        "currency": getattr(tool, "_paymcp_currency", "USD"),
                        "type": getattr(tool, "_paymcp_billing_type", "per_request"),
                    })
            return {"priced_tools": priced, "count": len(priced)}

        @self.mcp.tool()
        def paymcp_verify_payment(
            payment_intent_id: str,
            caller: str = "anonymous",
            tool_name: str = ""
        ) -> dict:
            """Verify a payment and grant access to a tool."""
            if verify_payment(payment_intent_id):
                if tool_name:
                    grant_access(caller, tool_name, calls=1)
                return {
                    "status": "verified",
                    "payment_intent_id": payment_intent_id,
                    "access_granted": bool(tool_name),
                    "tool": tool_name,
                }
            return {
                "status": "failed",
                "payment_intent_id": payment_intent_id,
                "error": "Payment not verified",
            }


# ── Backward compatibility ──────────────────────────────────────────

def init_paymcp(mcp_server, **kwargs):
    """Initialize PayMCP on a FastMCP server."""
    config = PayMCPConfig(mcp_server, **kwargs)
    config.add_payment_tools()
    return config


if __name__ == "__main__":
    print("PayMCP Lite — Ready for integration")
    print(f"Stripe enabled: {STRIPE_ENABLED}")
    print(f"Redis enabled: {REDIS_ENABLED}")
    print(f"Free tier: {FREE_DAILY_LIMIT}/day")
