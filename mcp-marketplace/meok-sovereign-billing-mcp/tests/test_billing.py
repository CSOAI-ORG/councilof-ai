"""Tests for meok-sovereign-billing-mcp (multi-tenant billing)."""
import meok_sovereign_billing_mcp as b_mod
from meok_sovereign_billing_mcp import (
    usage_record, invoice_generate, plan_upgrade,
    plan_downgrade, billing_status,
)


def reset_state():
    b_mod._USAGE.clear()
    b_mod._INVOICES.clear()
    b_mod._PLANS.clear()


def test_usage_record_basic():
    reset_state()
    r = usage_record("acme", "api_calls", 1000)
    assert r["recorded"] is True
    assert r["tenant_id"] == "acme"
    assert r["quantity"] == 1000


def test_usage_record_empty_tenant():
    r = usage_record("", "api_calls", 1)
    assert "error" in r


def test_usage_record_negative_quantity():
    r = usage_record("acme", "api_calls", -1)
    assert "error" in r


def test_usage_record_empty_metric():
    r = usage_record("acme", "", 1)
    assert "error" in r


def test_invoice_usd():
    reset_state()
    plan_upgrade("acme", "pro")
    usage_record("acme", "api_calls", 100000)
    inv = invoice_generate("acme", currency="USD")
    assert inv["currency"] == "USD"
    assert inv["amount"] > 0
    assert "invoice_id" in inv


def test_invoice_eur():
    reset_state()
    plan_upgrade("acme", "business")
    inv = invoice_generate("acme", currency="EUR")
    assert inv["currency"] == "EUR"
    assert inv["fx_rate"] == 0.92


def test_invoice_gbp():
    reset_state()
    inv = invoice_generate("acme", currency="GBP")
    assert inv["currency"] == "GBP"
    assert inv["fx_rate"] == 0.79


def test_invoice_jpy():
    reset_state()
    inv = invoice_generate("acme", currency="JPY")
    assert inv["currency"] == "JPY"
    assert inv["fx_rate"] == 156.0


def test_invoice_cny():
    reset_state()
    inv = invoice_generate("acme", currency="CNY")
    assert inv["currency"] == "CNY"
    assert inv["fx_rate"] == 7.25


def test_invoice_unsupported_currency():
    r = invoice_generate("acme", currency="BTC")
    assert "error" in r


def test_invoice_includes_usage():
    reset_state()
    plan_upgrade("acme", "pro")
    usage_record("acme", "api_calls", 50000)
    inv = invoice_generate("acme")
    assert inv["usage_records"] == 1


def test_plan_upgrade():
    reset_state()
    r = plan_upgrade("acme", "starter")
    assert r["upgraded"] is True
    assert r["from_plan"] == "free"
    assert r["to_plan"] == "starter"


def test_plan_upgrade_invalid():
    r = plan_upgrade("acme", "nope")
    assert "error" in r


def test_plan_upgrade_wrong_direction():
    reset_state()
    plan_upgrade("acme", "pro")
    r = plan_upgrade("acme", "free")
    assert "error" in r
    assert "hint" in r


def test_plan_downgrade():
    reset_state()
    plan_upgrade("acme", "enterprise")
    r = plan_downgrade("acme", "business")
    assert r["downgraded"] is True
    assert r["from_plan"] == "enterprise"
    assert r["to_plan"] == "business"


def test_plan_downgrade_wrong_direction():
    reset_state()
    r = plan_downgrade("acme", "pro")
    assert "error" in r


def test_billing_status_tenant():
    reset_state()
    plan_upgrade("acme", "pro")
    usage_record("acme", "api_calls", 100)
    r = billing_status("acme")
    assert r["scope"] == "tenant"
    assert r["plan"] == "pro"
    assert "USD" in r["currency_supported"]


def test_billing_status_global():
    reset_state()
    plan_upgrade("t1", "starter")
    plan_upgrade("t2", "pro")
    r = billing_status()
    assert r["scope"] == "global"
    assert r["total_tenants"] == 2
    assert "starter" in r["by_plan"]


def test_no_external_deps():
    src = open(b_mod.__file__).read()
    assert "import ollama" not in src
    assert "import urllib" not in src
    assert "import requests" not in src


def test_signed_outputs():
    reset_state()
    plan_upgrade("acme", "pro")
    usage_record("acme", "x", 1)
    inv = invoice_generate("acme")
    for r in [
        usage_record("acme", "x", 1),
        inv,
        plan_upgrade("acme", "business"),
        plan_downgrade("acme", "starter"),
        billing_status(),
    ]:
        assert "kid" in r and "sig" in r and "ts" in r


def test_full_lifecycle():
    """Upgrade → usage → invoice → downgrade → status."""
    reset_state()
    plan_upgrade("acme", "starter")
    usage_record("acme", "api_calls", 10000)
    usage_record("acme", "storage", 50)
    inv = invoice_generate("acme", currency="EUR")
    assert inv["amount"] > 0
    plan_downgrade("acme", "free")
    status = billing_status("acme")
    assert status["plan"] == "free"