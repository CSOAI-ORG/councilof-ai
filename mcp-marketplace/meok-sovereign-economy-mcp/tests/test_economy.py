"""Tests for meok-sovereign-economy-mcp (x402 invoices + payments)."""
import os, tempfile
_TEST_DIR = tempfile.mkdtemp(prefix="sov_eco_test_")
os.environ["SOV_ECO_KEY"] = os.path.join(_TEST_DIR, "key.pem")
import meok_sovereign_economy_mcp as e_mod
from meok_sovereign_economy_mcp import (
    economy_invoice, economy_pay, economy_receipt,
    economy_balance, economy_status,
    SERVICES, TIER_PRICING,
)


def reset_state():
    e_mod._INVOICES.clear()
    e_mod._RECEIPTS.clear()
    e_mod._BALANCE = 10000.0


def test_15_services():
    assert len(SERVICES) == 15


def test_4_tiers():
    assert len(TIER_PRICING) == 4
    assert "free" in TIER_PRICING
    assert "pro" in TIER_PRICING
    assert "governance" in TIER_PRICING
    assert "enterprise" in TIER_PRICING


def test_invoice_basic():
    reset_state()
    r = economy_invoice("passport", quantity=1)
    assert r["status"] == "PENDING"
    assert r["service"] == "passport"
    assert r["amount_usd"] > 0


def test_invoice_invalid_service():
    r = economy_invoice("unknown_service")
    assert "error" in r


def test_invoice_invalid_quantity():
    r = economy_invoice("passport", quantity=0)
    assert "error" in r


def test_invoice_invalid_tier():
    r = economy_invoice("passport", tier="unknown")
    assert "error" in r


def test_invoice_quantity_pricing():
    """Quantity affects price."""
    reset_state()
    r1 = economy_invoice("passport", quantity=1)
    r2 = economy_invoice("passport", quantity=10)
    assert r2["amount_usd"] > r1["amount_usd"]


def test_invoice_tier_pricing():
    """Tier affects price (governance > pro > free)."""
    reset_state()
    r_free = economy_invoice("passport", tier="free")
    r_pro = economy_invoice("passport", tier="pro")
    r_gov = economy_invoice("passport", tier="governance")
    assert r_free["amount_usd"] < r_pro["amount_usd"] < r_gov["amount_usd"]


def test_pay_basic():
    reset_state()
    inv = economy_invoice("passport")
    iid = inv["invoice_id"]
    r = economy_pay(iid)
    assert r["paid"] is True
    assert r["amount_usd"] > 0
    assert "receipt_id" in r


def test_pay_insufficient_balance():
    reset_state()
    e_mod._BALANCE = 0.01
    inv = economy_invoice("passport", quantity=100)
    r = economy_pay(inv["invoice_id"])
    assert "error" in r


def test_pay_already_paid():
    reset_state()
    inv = economy_invoice("passport")
    iid = inv["invoice_id"]
    economy_pay(iid)
    r = economy_pay(iid)
    assert "error" in r


def test_pay_unknown_invoice():
    r = economy_pay("nonexistent")
    assert "error" in r


def test_receipt_exists():
    reset_state()
    inv = economy_invoice("passport")
    iid = inv["invoice_id"]
    p = economy_pay(iid)
    r = economy_receipt(p["receipt_id"])
    assert r["invoice_id"] == iid
    assert r["amount_usd"] > 0


def test_receipt_unknown():
    r = economy_receipt("nonexistent")
    assert "error" in r


def test_balance_summary():
    reset_state()
    r = economy_balance()
    assert r["balance_usd"] == 10000.0


def test_balance_decreases_on_pay():
    reset_state()
    inv = economy_invoice("passport", quantity=10)
    initial = e_mod._BALANCE
    economy_pay(inv["invoice_id"])
    assert e_mod._BALANCE < initial


def test_status_summary():
    reset_state()
    inv = economy_invoice("passport")
    economy_pay(inv["invoice_id"])
    r = economy_status()
    assert r["service_count"] == 15
    assert r["tier_count"] == 4
    assert r["receipt_count"] == 1


def test_no_external_deps():
    import meok_sovereign_economy_mcp as m
    src = open(m.__file__).read()
    assert "import ollama" not in src
    assert "import urllib" not in src
    assert "import requests" not in src


def test_signed_outputs():
    reset_state()
    r1 = economy_invoice("passport")
    assert "kid" in r1 and "sig" in r1 and "ts" in r1
    r2 = economy_pay(r1["invoice_id"])
    assert "kid" in r2 and "sig" in r2 and "ts" in r2
    r3 = economy_receipt(r2["receipt_id"])
    assert "kid" in r3 and "sig" in r3 and "ts" in r3
    r4 = economy_balance()
    assert "kid" in r4 and "sig" in r4 and "ts" in r4
    r5 = economy_status()
    assert "kid" in r5 and "sig" in r5 and "ts" in r5


def test_full_lifecycle():
    """Invoice → pay → receipt."""
    reset_state()
    inv = economy_invoice("audit", quantity=5, tier="pro", customer="HSBC")
    iid = inv["invoice_id"]
    assert inv["status"] == "PENDING"
    p = economy_pay(iid, payment_method="x402")
    assert p["paid"] is True
    r = economy_receipt(p["receipt_id"])
    assert r["customer"] == "HSBC"
    assert r["payment_method"] == "x402"