"""meok-sovereign-pricing-engine-mcp — Sovereign Pricing Engine.

Generates quotes for 4 tiers: Open Source £0 / Pro £499 / Gov £2,499 / Enterprise £9,999.
Volume discount. SIGIL-signed. Aligned with public pricing page.

5 tools:
  1. pricing_quote        - generate a quote
  2. pricing_tiers        - list all tiers
  3. pricing_calculate    - calculate custom pricing
  4. pricing_volume       - volume discount calc
  5. pricing_status       - pricing engine status
"""
from __future__ import annotations
import json, hashlib
from datetime import datetime, timezone

PROTOCOL = "sovereign-pricing-engine/1.0"
VERSION = "1.0.0"
LICENSE = "MIT + CC0 1.0"

TIERS = {
    "open-source": {"name":"Open Source", "monthly_gbp": 0, "annual_gbp": 0, "min_seats": 1, "features": ["30 MCPs (MIT)", "Public docs", "Community support", "GitHub issues"]},
    "pro": {"name":"Pro", "monthly_gbp": 499, "annual_gbp": 499*12*0.83, "min_seats": 5, "features": ["Everything in Open Source", "8hr SLA", "Deployment assist", "DEFONEOS-SEAL"]},
    "gov": {"name":"Gov", "monthly_gbp": 2499, "annual_gbp": 2499*12*0.83, "min_seats": 25, "features": ["Everything in Pro", "4hr SLA", "BFT managed service", "Coalition fed", "JSP 936 v0.1"]},
    "enterprise": {"name":"Enterprise", "monthly_gbp": 9999, "annual_gbp": 9999*12*0.83, "min_seats": 100, "features": ["Everything in Gov", "1hr 24/7 SLA", "On-site engineer", "Air-gapped", "Red team"]},
}

_QUOTES = {}


def _sign(p):
    b = json.dumps(p, sort_keys=True, default=str)
    p["kid"] = "prc-" + hashlib.sha256(b.encode()).hexdigest()[:16]
    p["sig"] = hashlib.sha256((p["kid"] + b).encode()).hexdigest()[:16]
    p["ts"] = datetime.now(timezone.utc).isoformat()
    return p


def _gen_id(prefix):
    return f"{prefix}-{hashlib.sha256(prefix.encode()).hexdigest()[:12]}"


def pricing_quote(tier: str = "pro", seats: int = 5, period: str = "monthly"):
    if tier not in TIERS:
        return _sign({"error": f"unknown tier: {tier}. Use: {list(TIERS.keys())}"})
    if seats < TIERS[tier]["min_seats"]:
        return _sign({"error": f"tier {tier} requires {TIERS[tier]['min_seats']}+ seats (you specified {seats})"})
    t = TIERS[tier]
    base = t["monthly_gbp"] if period == "monthly" else t["annual_gbp"]
    seat_adj = (seats - t["min_seats"]) * (t["monthly_gbp"] * 0.4)  # per-extra-seat 40% of base
    subtotal = base + seat_adj
    # Volume discount
    discount_pct = 0.0
    if seats >= 50: discount_pct = 0.20
    elif seats >= 25: discount_pct = 0.15
    elif seats >= 10: discount_pct = 0.10
    discount = subtotal * discount_pct
    total = subtotal - discount
    quote_id = _gen_id("quote")
    _QUOTES[quote_id] = {"id": quote_id, "tier": tier, "seats": seats, "period": period, "total": total, "ts": datetime.now(timezone.utc).isoformat()}
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "quote_id": quote_id, "tier": tier, "seats": seats, "period": period,
        "base_gbp": base, "subtotal_gbp": subtotal, "discount_pct": discount_pct, "discount_gbp": discount, "total_gbp": total,
        "features": t["features"],
        "doctrine": f"Quote {quote_id}: £{total:.0f}/{period} for {seats} seats @ {tier}. Sovereign.",
    })


def pricing_tiers():
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "tiers": TIERS,
        "doctrine": "Sovereign pricing: 4 tiers. Open Source / Pro / Gov / Enterprise. Sovereign.",
    })


def pricing_calculate(seats: int = 5, tier: str = "pro", months: int = 12):
    if tier not in TIERS:
        return _sign({"error": f"unknown tier: {tier}"})
    t = TIERS[tier]
    base_monthly = t["monthly_gbp"] * (seats / t["min_seats"])
    total = base_monthly * months * 0.83  # 17% annual discount
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "seats": seats, "tier": tier, "months": months, "total_gbp": total,
        "doctrine": f"Custom pricing: {seats} seats × {months}mo @ {tier} = £{total:.0f}. Sovereign.",
    })


def pricing_volume(seats: int = 5):
    discount_pct = 0.0
    if seats >= 50: discount_pct = 0.20
    elif seats >= 25: discount_pct = 0.15
    elif seats >= 10: discount_pct = 0.10
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "seats": seats, "discount_pct": discount_pct, "tier": "volume",
        "doctrine": f"Volume discount: {seats} seats → {int(discount_pct*100)}% off. Sovereign.",
    })


def pricing_status():
    return _sign({
        "protocol": PROTOCOL, "version": LICENSE,
        "tiers_offered": len(TIERS), "quotes_total": len(_QUOTES),
        "doctrine": f"Sovereign pricing engine: {len(TIERS)} tiers, {len(_QUOTES)} quotes. Sovereign.",
    })
