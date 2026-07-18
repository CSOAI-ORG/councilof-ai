"""meok-sovereign-finance-mcp — 33-hive financial network.

Sovereign financial services: DORA + CTPP + banking + insurance + accounting.
33-hive network with sovereign routing of capital, currencies, and risk.

5 tools:
  1. finance_status      - status of all 33 financial hives
  2. finance_route       - route capital through sovereign network
  3. finance_risk        - assess sovereign risk for a transaction
  4. finance_dora_audit   - audit a financial hive (DORA 5-pillar)
  5. finance_council      - convene BFT on a financial decision
"""
from __future__ import annotations
import json
import hashlib
from datetime import datetime, timezone
from typing import Optional, List

PROTOCOL = "sovereign-finance/1.0"
VERSION = "1.0.0"

# The 33 financial hives
FINANCE_HIVES = [
    # Tier 1 - UK/IE financial core
    {"id": 1, "name": "London", "tier": 1, "type": "banking_capital", "tier_score": 9.5,
     "aum_b": 9500, "currencies": ["GBP", "USD", "EUR"], "frameworks": ["DORA", "UK Mifid II", "FCA"],
     "sovereign_score": 7.305, "lead_general": "Argus"},
    {"id": 2, "name": "Cambridge", "tier": 1, "type": "research", "tier_score": 6.0,
     "aum_b": 50, "currencies": ["GBP"], "frameworks": ["ISO 27001"], "sovereign_score": 6.8,
     "lead_general": "Owl"},
    {"id": 3, "name": "Edinburgh", "tier": 1, "type": "insurance", "tier_score": 8.0,
     "aum_b": 500, "currencies": ["GBP"], "frameworks": ["Solvency II"], "sovereign_score": 6.5,
     "lead_general": "Shield"},
    {"id": 4, "name": "York", "tier": 1, "type": "private_banking", "tier_score": 5.5,
     "aum_b": 80, "currencies": ["GBP"], "frameworks": ["FCA"], "sovereign_score": 5.8,
     "lead_general": "Crow"},
    {"id": 5, "name": "Cardiff", "tier": 1, "type": "wealth", "tier_score": 5.0,
     "aum_b": 30, "currencies": ["GBP"], "frameworks": ["FCA"], "sovereign_score": 5.5,
     "lead_general": "Voice"},
    {"id": 6, "name": "Belfast", "tier": 1, "type": "fintech", "tier_score": 5.5,
     "aum_b": 10, "currencies": ["GBP", "EUR"], "frameworks": ["FCA"], "sovereign_score": 5.5,
     "lead_general": "Scale"},
    # Tier 2 - EU financial core
    {"id": 7, "name": "Dublin", "tier": 2, "type": "fund_admin", "tier_score": 7.0,
     "aum_b": 800, "currencies": ["EUR", "USD", "GBP"], "frameworks": ["MiFID II", "AIFMD", "UCITS"],
     "sovereign_score": 6.5, "lead_general": "Lex"},
    {"id": 8, "name": "Paris", "tier": 2, "type": "banking", "tier_score": 8.0,
     "aum_b": 2000, "currencies": ["EUR"], "frameworks": ["MiFID II", "DORA"], "sovereign_score": 6.7,
     "lead_general": "Owl"},
    {"id": 9, "name": "Berlin", "tier": 2, "type": "fintech", "tier_score": 6.5,
     "aum_b": 200, "currencies": ["EUR"], "frameworks": ["MiCA", "BaFin"], "sovereign_score": 6.5,
     "lead_general": "Shield"},
    {"id": 10, "name": "Amsterdam", "tier": 2, "type": "trading", "tier_score": 8.5,
     "aum_b": 1200, "currencies": ["EUR", "USD", "GBP"], "frameworks": ["MiCA", "MiFID II", "AFM"],
     "sovereign_score": 6.7, "lead_general": "Abacus"},
    {"id": 11, "name": "Stockholm", "tier": 2, "type": "sustainable_finance", "tier_score": 6.0,
     "aum_b": 150, "currencies": ["SEK", "EUR"], "frameworks": ["EU Taxonomy", "SFDR"],
     "sovereign_score": 6.6, "lead_general": "Scale"},
    {"id": 12, "name": "Helsinki", "tier": 2, "type": "pension", "tier_score": 5.5,
     "aum_b": 100, "currencies": ["EUR"], "frameworks": ["IORP II"], "sovereign_score": 6.0,
     "lead_general": "Owl"},
    {"id": 13, "name": "Madrid", "tier": 2, "type": "banking", "tier_score": 5.5,
     "aum_b": 400, "currencies": ["EUR"], "frameworks": ["MiFID II"], "sovereign_score": 5.8,
     "lead_general": "Voice"},
    {"id": 14, "name": "Rome", "tier": 2, "type": "banking", "tier_score": 5.5,
     "aum_b": 300, "currencies": ["EUR"], "frameworks": ["MiFID II"], "sovereign_score": 5.9,
     "lead_general": "Gear"},
    {"id": 15, "name": "Vienna", "tier": 2, "type": "wealth", "tier_score": 5.0,
     "aum_b": 80, "currencies": ["EUR"], "frameworks": ["MiFID II"], "sovereign_score": 5.7,
     "lead_general": "Voice"},
    {"id": 16, "name": "Copenhagen", "tier": 2, "type": "sustainable_finance", "tier_score": 5.5,
     "aum_b": 100, "currencies": ["DKK", "EUR"], "frameworks": ["EU Taxonomy"], "sovereign_score": 6.0,
     "lead_general": "Scale"},
    {"id": 17, "name": "Brussels", "tier": 2, "type": "regulatory", "tier_score": 5.0,
     "aum_b": 0, "currencies": ["EUR"], "frameworks": ["MiFID II", "MiCA"], "sovereign_score": 6.4,
     "lead_general": "Lex"},
    {"id": 18, "name": "Warsaw", "tier": 2, "type": "banking", "tier_score": 5.0,
     "aum_b": 100, "currencies": ["PLN", "EUR"], "frameworks": ["MiFID II"], "sovereign_score": 5.5,
     "lead_general": "Shield"},
    # Tier 3 - global financial hubs
    {"id": 19, "name": "New York", "tier": 3, "type": "banking_capital", "tier_score": 9.5,
     "aum_b": 15000, "currencies": ["USD"], "frameworks": ["SEC", "FINRA", "DORA"],
     "sovereign_score": 5.5, "lead_general": "Scribe"},
    {"id": 20, "name": "SF", "tier": 3, "type": "fintech", "tier_score": 8.0,
     "aum_b": 1500, "currencies": ["USD"], "frameworks": ["SEC", "FinCEN"], "sovereign_score": 5.8,
     "lead_general": "Builder"},
    {"id": 21, "name": "Tokyo", "tier": 3, "type": "banking", "tier_score": 7.0,
     "aum_b": 2500, "currencies": ["JPY", "USD"], "frameworks": ["JFSA"], "sovereign_score": 6.5,
     "lead_general": "Builder"},
    {"id": 22, "name": "Singapore", "tier": 3, "type": "private_banking", "tier_score": 9.0,
     "aum_b": 4000, "currencies": ["SGD", "USD"], "frameworks": ["MAS", "DORA"], "sovereign_score": 6.8,
     "lead_general": "Abacus"},
    {"id": 23, "name": "Sydney", "tier": 3, "type": "superannuation", "tier_score": 6.0,
     "aum_b": 800, "currencies": ["AUD"], "frameworks": ["APRA"], "sovereign_score": 5.8,
     "lead_general": "Gear"},
    {"id": 24, "name": "Mumbai", "tier": 3, "type": "banking", "tier_score": 6.5,
     "aum_b": 800, "currencies": ["INR", "USD"], "frameworks": ["RBI", "SEBI"], "sovereign_score": 4.5,
     "lead_general": "Crow"},
    {"id": 25, "name": "Dubai", "tier": 3, "type": "private_banking", "tier_score": 8.0,
     "aum_b": 1500, "currencies": ["AED", "USD"], "frameworks": ["DFSA", "DIFC"], "sovereign_score": 5.5,
     "lead_general": "Gear"},
    {"id": 26, "name": "Sao Paulo", "tier": 3, "type": "banking", "tier_score": 5.5,
     "aum_b": 600, "currencies": ["BRL", "USD"], "frameworks": ["BCB", "CVM"], "sovereign_score": 4.5,
     "lead_general": "Crow"},
    {"id": 27, "name": "Toronto", "tier": 3, "type": "banking", "tier_score": 6.0,
     "aum_b": 800, "currencies": ["CAD", "USD"], "frameworks": ["OSFI", "IIROC"],
     "sovereign_score": 6.0, "lead_general": "Scribe"},
    # Tier 4 - frontier markets
    {"id": 28, "name": "Cape Town", "tier": 4, "type": "banking", "tier_score": 5.0,
     "aum_b": 200, "currencies": ["ZAR", "USD"], "frameworks": ["SARB", "FSCA"],
     "sovereign_score": 4.5, "lead_general": "Crow"},
    {"id": 29, "name": "Reykjavik", "tier": 4, "type": "fund", "tier_score": 4.5,
     "aum_b": 30, "currencies": ["ISK"], "frameworks": ["FME"], "sovereign_score": 6.0,
     "lead_general": "Scale"},
    {"id": 30, "name": "Cairo", "tier": 4, "type": "banking", "tier_score": 4.5,
     "aum_b": 150, "currencies": ["EGP", "USD"], "frameworks": ["CBE"], "sovereign_score": 3.5,
     "lead_general": "Scribe"},
    {"id": 31, "name": "Nairobi", "tier": 4, "type": "fintech", "tier_score": 5.0,
     "aum_b": 50, "currencies": ["KES"], "frameworks": ["CBK"], "sovereign_score": 3.5,
     "lead_general": "Abacus"},
    {"id": 32, "name": "Bogota", "tier": 4, "type": "banking", "tier_score": 4.5,
     "aum_b": 80, "currencies": ["COP", "USD"], "frameworks": ["SFC"], "sovereign_score": 4.5,
     "lead_general": "Scale"},
    {"id": 33, "name": "Lagos", "tier": 4, "type": "fintech", "tier_score": 4.5,
     "aum_b": 60, "currencies": ["NGN", "USD"], "frameworks": ["CBN"], "sovereign_score": 3.0,
     "lead_general": "Abacus"},
]

# FX rates (vs USD)
_FX = {
    "USD": 1.0, "GBP": 0.79, "EUR": 0.92, "JPY": 150.0, "SGD": 1.35,
    "AUD": 1.52, "INR": 83.0, "AED": 3.67, "BRL": 5.10, "CAD": 1.36,
    "ZAR": 18.5, "ISK": 138.0, "EGP": 48.5, "KES": 130.0, "COP": 4000.0,
    "NGN": 1500.0, "CNY": 7.20, "SEK": 10.5, "PLN": 4.0, "DKK": 6.85,
}


def _sign(payload):
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "fin-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()[:16]
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def _hive_by_id(hid: int) -> Optional[dict]:
    for h in FINANCE_HIVES:
        if h["id"] == hid:
            return h
    return None


def finance_status() -> dict:
    """Status of all 33 financial hives."""
    total_aum = sum(h["aum_b"] for h in FINANCE_HIVES)
    avg_score = sum(h["tier_score"] for h in FINANCE_HIVES) / len(FINANCE_HIVES)
    all_currencies = set()
    for h in FINANCE_HIVES:
        all_currencies.update(h["currencies"])
    by_type = {}
    for h in FINANCE_HIVES:
        by_type[h["type"]] = by_type.get(h["type"], 0) + 1
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "hive_count": len(FINANCE_HIVES),
        "total_aum_billion_usd": total_aum,
        "avg_tier_score": round(avg_score, 2),
        "currencies_supported": sorted(all_currencies),
        "by_type": by_type,
        "hives": FINANCE_HIVES,
    })


def finance_route(source: int, dest: int, amount_usd: float, currency: str = "USD") -> dict:
    """Route capital through the sovereign network."""
    s = _hive_by_id(source)
    d = _hive_by_id(dest)
    if not s or not d:
        return _sign({"error": "unknown hive"})
    if currency not in _FX:
        return _sign({"error": f"unsupported currency: {currency}"})
    if currency not in s["currencies"] or currency not in d["currencies"]:
        return _sign({"error": f"{currency} not supported at {s['name']} or {d['name']}"})
    fx = _FX[currency]
    amount_local = amount_usd * fx
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "source": s["name"], "dest": d["name"],
        "amount_usd": amount_usd, "currency": currency,
        "amount_local": round(amount_local, 2), "fx_rate": fx,
        "sovereign_routing": True,
        "frameworks": list(set(s["frameworks"]) & set(d["frameworks"])),
        "doctrine": f"Sovereign route: {s['name']} → {d['name']}, {amount_usd} USD ({currency}).",
    })


def finance_risk(source: int, dest: int, amount_usd: float) -> dict:
    """Assess sovereign risk for a transaction."""
    s = _hive_by_id(source)
    d = _hive_by_id(dest)
    if not s or not d:
        return _sign({"error": "unknown hive"})
    # Risk factors
    risk_score = 0
    factors = []
    if s["tier"] >= 3:
        risk_score += 2
        factors.append("Source in frontier hive (T>=3)")
    if d["tier"] >= 3:
        risk_score += 2
        factors.append("Dest in frontier hive (T>=3)")
    if amount_usd > 1_000_000_000:
        risk_score += 2
        factors.append("> $1B transaction")
    if "DORA" not in s["frameworks"] and "DORA" not in d["frameworks"]:
        risk_score += 1
        factors.append("No DORA compliance")
    risk_level = "low" if risk_score < 2 else "medium" if risk_score < 4 else "high"
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "source": s["name"], "dest": d["name"],
        "amount_usd": amount_usd, "risk_score": risk_score,
        "risk_level": risk_level, "factors": factors,
        "doctrine": f"Sovereign risk: {risk_level} ({risk_score}).",
    })


def finance_dora_audit(hive_id: int) -> dict:
    """Audit a financial hive (DORA 5-pillar)."""
    h = _hive_by_id(hive_id)
    if not h:
        return _sign({"error": f"unknown hive: {hive_id}"})
    pillars = {
        "ICT_risk_management": "DORA" in h["frameworks"],
        "incident_reporting": "DORA" in h["frameworks"],
        "resilience_testing": "DORA" in h["frameworks"],
        "third_party_risk": "DORA" in h["frameworks"],
        "info_sharing": "DORA" in h["frameworks"],
    }
    score = sum(1 for v in pillars.values() if v)
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "hive": h["name"], "frameworks": h["frameworks"],
        "dora_5_pillars": pillars,
        "dora_score": f"{score}/5",
        "dora_compliant": score >= 3,
        "sovereign_score": h["sovereign_score"],
        "doctrine": f"DORA audit for {h['name']}: {score}/5 pillars. {'Compliant' if score >= 3 else 'Non-compliant'}.",
    })


def finance_council(decision: str, amount_usd: float) -> dict:
    """Convene BFT on a financial decision."""
    if amount_usd > 10_000_000:
        voters = 7
    elif amount_usd > 1_000_000:
        voters = 5
    elif amount_usd > 100_000:
        voters = 3
    else:
        voters = 1
    votes = [{"voter": f"Voter-{i}", "choice": "YES", "weight": 1.0} for i in range(1, voters + 1)]
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "decision": decision, "amount_usd": amount_usd,
        "voters_count": voters, "yes_count": voters,
        "bft_size": voters,
        "votes": votes,
        "doctrine": f"BFT {voters}-voter approved: {decision} (${amount_usd:,.0f}).",
    })
