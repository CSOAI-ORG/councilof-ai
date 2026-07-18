"""meok-sovereign-billing-mcp — Multi-tenant billing engine.

The Billing MCP provides usage tracking, invoice generation, plan upgrades
and downgrades, and billing status across multi-tenant subscriptions.
Currencies: USD, EUR, GBP, JPY, CNY. Every operation is sigil-signed.

5 tools:
  1. usage_record     - record metered usage for a tenant
  2. invoice_generate - generate an invoice from usage
  3. plan_upgrade     - upgrade a tenant's plan
  4. plan_downgrade   - downgrade a tenant's plan
  5. billing_status   - current billing status across tenants
"""
from __future__ import annotations
import json
import hashlib
from datetime import datetime, timezone

PROTOCOL = "sovereign-billing/1.0"
VERSION = "1.0.0"

_USAGE: dict = {}        # tenant_id -> [usage records]
_INVOICES: dict = {}     # invoice_id -> invoice
_PLANS: dict = {}        # tenant_id -> plan_id

# Plan catalog
_PLAN_CATALOG = {
    "free":       {"name": "Free",       "monthly_usd": 0,    "metered_rate": 0.00,  "tier": 0},
    "starter":    {"name": "Starter",    "monthly_usd": 29,   "metered_rate": 0.001, "tier": 1},
    "pro":        {"name": "Pro",        "monthly_usd": 99,   "metered_rate": 0.0008,"tier": 2},
    "business":   {"name": "Business",   "monthly_usd": 499,  "metered_rate": 0.0005,"tier": 3},
    "enterprise": {"name": "Enterprise", "monthly_usd": 4999, "metered_rate": 0.0002,"tier": 4},
}

# Currency exchange rates (vs USD; cached snapshot)
_FX_RATES = {
    "USD": 1.0,
    "EUR": 0.92,
    "GBP": 0.79,
    "JPY": 156.0,
    "CNY": 7.25,
}

# Valid plan transitions
_PLAN_TIER = {p: data["tier"] for p, data in _PLAN_CATALOG.items()}


def _sign(payload: dict) -> dict:
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "bil-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def _convert(amount_usd: float, currency: str) -> tuple:
    """Convert USD to target currency, return (amount, rate)."""
    if currency not in _FX_RATES:
        return None, None
    rate = _FX_RATES[currency]
    return round(amount_usd * rate, 4), rate


def usage_record(tenant_id: str, metric: str, quantity: float,
                 unit: str = "calls") -> dict:
    """Record metered usage for a tenant."""
    if not tenant_id:
        return _sign({"error": "tenant_id required"})
    if not metric:
        return _sign({"error": "metric required"})
    if quantity < 0:
        return _sign({"error": "quantity must be >= 0"})

    record = {
        "tenant_id": tenant_id,
        "metric": metric,
        "quantity": quantity,
        "unit": unit,
        "recorded_at": datetime.now(timezone.utc).isoformat(),
    }
    if tenant_id not in _USAGE:
        _USAGE[tenant_id] = []
    _USAGE[tenant_id].append(record)
    return _sign({
        "recorded": True,
        "tenant_id": tenant_id,
        "metric": metric,
        "quantity": quantity,
        "total_records": len(_USAGE[tenant_id]),
    })


def invoice_generate(tenant_id: str, currency: str = "USD",
                     period_start: str = None, period_end: str = None) -> dict:
    """Generate an invoice from accumulated usage."""
    if currency not in _FX_RATES:
        return _sign({"error": f"unsupported currency: {currency}"})

    plan_id = _PLANS.get(tenant_id, "free")
    plan = _PLAN_CATALOG[plan_id]
    base_usd = plan["monthly_usd"]

    records = _USAGE.get(tenant_id, [])
    usage_usd = sum(r["quantity"] * plan["metered_rate"] for r in records)
    subtotal_usd = base_usd + usage_usd

    amount, rate = _convert(subtotal_usd, currency)
    invoice_id = hashlib.sha256(
        f"{tenant_id}|{subtotal_usd}|{datetime.now(timezone.utc).isoformat()}".encode()
    ).hexdigest()[:16]

    invoice = {
        "invoice_id": invoice_id,
        "tenant_id": tenant_id,
        "currency": currency,
        "fx_rate": rate,
        "plan_id": plan_id,
        "plan_name": plan["name"],
        "base_usd": base_usd,
        "usage_usd": round(usage_usd, 4),
        "subtotal_usd": round(subtotal_usd, 4),
        "amount": amount,
        "usage_records": len(records),
        "period_start": period_start,
        "period_end": period_end,
        "issued_at": datetime.now(timezone.utc).isoformat(),
        "status": "open",
    }
    _INVOICES[invoice_id] = invoice

    return _sign(invoice)


def plan_upgrade(tenant_id: str, target_plan: str) -> dict:
    """Upgrade a tenant's plan (only allow upgrades to higher tiers)."""
    if target_plan not in _PLAN_CATALOG:
        return _sign({"error": f"unknown plan: {target_plan}"})

    current = _PLANS.get(tenant_id, "free")
    current_tier = _PLAN_TIER[current]
    target_tier = _PLAN_TIER[target_plan]

    if target_tier <= current_tier:
        return _sign({
            "error": f"plan_upgrade requires target tier > current tier ({current}->{target_plan})",
            "hint": "use plan_downgrade instead",
        })

    _PLANS[tenant_id] = target_plan
    return _sign({
        "upgraded": True,
        "tenant_id": tenant_id,
        "from_plan": current,
        "to_plan": target_plan,
        "new_tier": target_tier,
    })


def plan_downgrade(tenant_id: str, target_plan: str,
                   effective: str = "end_of_period") -> dict:
    """Downgrade a tenant's plan (only allow downgrades to lower tiers)."""
    if target_plan not in _PLAN_CATALOG:
        return _sign({"error": f"unknown plan: {target_plan}"})

    current = _PLANS.get(tenant_id, "free")
    current_tier = _PLAN_TIER[current]
    target_tier = _PLAN_TIER[target_plan]

    if target_tier >= current_tier:
        return _sign({
            "error": f"plan_downgrade requires target tier < current tier ({current}->{target_plan})",
            "hint": "use plan_upgrade instead",
        })

    _PLANS[tenant_id] = target_plan
    return _sign({
        "downgraded": True,
        "tenant_id": tenant_id,
        "from_plan": current,
        "to_plan": target_plan,
        "new_tier": target_tier,
        "effective": effective,
    })


def billing_status(tenant_id: str = None) -> dict:
    """Current billing status across tenants (or single tenant)."""
    if tenant_id:
        records = _USAGE.get(tenant_id, [])
        plan_id = _PLANS.get(tenant_id, "free")
        plan = _PLAN_CATALOG[plan_id]
        usage_usd = sum(r["quantity"] * plan["metered_rate"] for r in records)
        return _sign({
            "scope": "tenant",
            "tenant_id": tenant_id,
            "plan": plan_id,
            "monthly_usd": plan["monthly_usd"],
            "usage_records": len(records),
            "current_usage_usd": round(usage_usd, 4),
            "currency_supported": list(_FX_RATES.keys()),
        })

    tenants = set(list(_USAGE.keys()) + list(_PLANS.keys()))
    by_plan = {}
    for tid in tenants:
        p = _PLANS.get(tid, "free")
        by_plan[p] = by_plan.get(p, 0) + 1

    return _sign({
        "scope": "global",
        "total_tenants": len(tenants),
        "total_usage_records": sum(len(v) for v in _USAGE.values()),
        "total_invoices": len(_INVOICES),
        "by_plan": by_plan,
        "currencies": list(_FX_RATES.keys()),
        "protocol": PROTOCOL,
        "version": VERSION,
    })