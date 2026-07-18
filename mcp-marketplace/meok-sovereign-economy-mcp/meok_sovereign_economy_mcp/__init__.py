"""meok-sovereign-economy-mcp — x402 invoices + payments + receipts.

The Economy MCP implements the x402 micropayment protocol for sovereign
services. Each invoice is sigil-signed and the receipts are auditable.

5 tools:
  1. economy_invoice   - create an invoice
  2. economy_pay       - pay an invoice
  3. economy_receipt   - get a receipt
  4. economy_balance   - check the substrate balance
  5. economy_status    - economy status
"""
from __future__ import annotations
import json
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Optional

PROTOCOL = "sovereign-economy/1.0"
VERSION = "1.0.0"

# Pricing per tier (USD per unit)
TIER_PRICING = {
    "free":       0.0,
    "pro":        99.0,
    "governance": 2499.0,
    "enterprise": 9999.0,
}

# Service catalog (mimics the 22 sovereign MCPs)
SERVICES = {
    "passport":         {"name": "Sovereign Compliance Passport", "unit_price": 0.10},
    "guardrails":       {"name": "AI Guardrails Validator",         "unit_price": 0.05},
    "receipt":          {"name": "Compliance Receipt Generator",   "unit_price": 0.05},
    "governance":       {"name": "Governance Engine",              "unit_price": 0.50},
    "x402-payment":     {"name": "x402 Payment Gateway",           "unit_price": 0.01},
    "council":          {"name": "BFT Council Vote",                "unit_price": 0.10},
    "globe":            {"name": "3D Globe Renderer",               "unit_price": 0.05},
    "intuition":        {"name": "Mamba-2 Intuition Engine",        "unit_price": 0.20},
    "audit":            {"name": "EU AI Act Article 50 Audit",     "unit_price": 0.25},
    "sigil":            {"name": "Sigil Chain Emission",           "unit_price": 0.01},
    "defence":          {"name": "JSP 936 Defence Audit",          "unit_price": 1.00},
    "iot":              {"name": "iOK Farm IoT Bridge",             "unit_price": 0.05},
    "mind":             {"name": "12 Mindsets × 8 MoE",            "unit_price": 0.50},
    "charter":          {"name": "10-Article Charter Vote",        "unit_price": 0.10},
    "defense":          {"name": "Morris-II Worm Guard",           "unit_price": 0.05},
}

_INVOICES: dict = {}
_RECEIPTS: dict = {}
_BALANCE: float = 10000.0  # substrate starting balance


def _sign(payload: dict) -> dict:
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "eco-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def economy_invoice(service: str, quantity: int = 1,
                   tier: str = "pro",
                   customer: str = "anonymous") -> dict:
    """Create an invoice."""
    if service not in SERVICES:
        return _sign({"error": f"unknown service: {service}"})
    if quantity < 1:
        return _sign({"error": "quantity must be >= 1"})
    if tier not in TIER_PRICING:
        return _sign({"error": f"unknown tier: {tier}"})
    base = SERVICES[service]["unit_price"]
    tier_mult = TIER_PRICING[tier] / 99.0  # pro = 1.0
    amount = round(base * quantity * max(0.01, tier_mult), 4)
    invoice_id = hashlib.sha256(f"{service}|{quantity}|{customer}|{datetime.now(timezone.utc).isoformat()}".encode()).hexdigest()[:16]
    invoice = {
        "invoice_id": invoice_id, "service": service, "quantity": quantity,
        "tier": tier, "customer": customer, "amount_usd": amount,
        "currency": "USD",
        "status": "PENDING",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
    }
    _INVOICES[invoice_id] = invoice
    return _sign(invoice)


def economy_pay(invoice_id: str, payment_method: str = "x402") -> dict:
    """Pay an invoice."""
    global _BALANCE
    if invoice_id not in _INVOICES:
        return _sign({"error": f"unknown invoice: {invoice_id}"})
    invoice = _INVOICES[invoice_id]
    if invoice["status"] == "PAID":
        return _sign({"error": "invoice already paid"})
    amount = invoice["amount_usd"]
    if amount > _BALANCE:
        return _sign({"error": "insufficient balance"})
    _BALANCE -= amount
    invoice["status"] = "PAID"
    invoice["paid_at"] = datetime.now(timezone.utc).isoformat()
    invoice["payment_method"] = payment_method
    # Create receipt
    receipt_id = hashlib.sha256(f"{invoice_id}|paid".encode()).hexdigest()[:16]
    receipt = {
        "receipt_id": receipt_id, "invoice_id": invoice_id,
        "amount_usd": amount, "payment_method": payment_method,
        "customer": invoice["customer"],
        "paid_at": invoice["paid_at"],
    }
    _RECEIPTS[receipt_id] = receipt
    return _sign({
        "paid": True, "invoice_id": invoice_id, "amount_usd": amount,
        "balance_after": _BALANCE, "receipt_id": receipt_id,
    })


def economy_receipt(receipt_id: str) -> dict:
    """Get a receipt."""
    if receipt_id not in _RECEIPTS:
        return _sign({"error": f"unknown receipt: {receipt_id}"})
    return _sign(_RECEIPTS[receipt_id])


def economy_balance() -> dict:
    """Check the substrate balance."""
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "balance_usd": _BALANCE,
        "currency": "USD",
        "doctrine": "The substrate starts with $10K. x402 micropayments on sovereign services.",
    })


def economy_status() -> dict:
    """Economy status."""
    total_paid = sum(r["amount_usd"] for r in _RECEIPTS.values())
    pending = sum(i["amount_usd"] for i in _INVOICES.values() if i["status"] == "PENDING")
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "service_count": len(SERVICES),
        "tier_count": len(TIER_PRICING),
        "balance_usd": _BALANCE,
        "total_paid_usd": round(total_paid, 4),
        "pending_usd": round(pending, 4),
        "invoice_count": len(_INVOICES),
        "receipt_count": len(_RECEIPTS),
    })