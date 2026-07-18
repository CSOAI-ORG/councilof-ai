"""Tests for meok-sovereign-finance-mcp."""
import os, tempfile
_TEST = tempfile.mkdtemp(prefix="sov_fin_")
os.environ["SOV_FIN_KEY"] = _TEST + "/k.pem"
from meok_sovereign_finance_mcp import (
    finance_status, finance_route, finance_risk, finance_dora_audit, finance_council,
    FINANCE_HIVES, _FX,
)


def test_33_finance_hives():
    assert len(FINANCE_HIVES) == 33


def test_finance_status():
    r = finance_status()
    assert r["hive_count"] == 33
    assert r["total_aum_billion_usd"] > 0
    assert "USD" in r["currencies_supported"]
    assert "GBP" in r["currencies_supported"]


def test_finance_status_by_type():
    r = finance_status()
    assert "banking_capital" in r["by_type"]


def test_finance_route_basic():
    r = finance_route(1, 22, 1_000_000, "USD")  # London → Singapore
    assert r["source"] == "London"
    assert r["dest"] == "Singapore"
    assert r["amount_usd"] == 1_000_000
    assert r["amount_local"] == 1_000_000  # USD to USD is 1:1


def test_finance_route_eur():
    r = finance_route(1, 8, 1_000_000, "EUR")  # London → Paris
    assert r["amount_local"] == 920_000  # EUR at 0.92


def test_finance_route_unknown_source():
    r = finance_route(99, 1, 1000, "USD")
    assert "error" in r


def test_finance_route_unsupported_currency():
    r = finance_route(1, 22, 1000, "XYZ")
    assert "error" in r


def test_finance_risk_low():
    r = finance_risk(1, 22, 1000)  # small amount, Tier 1-3
    assert r["risk_level"] in ("low", "medium")


def test_finance_risk_high():
    r = finance_risk(33, 28, 2_000_000_000)  # Lagos → Cape Town, $2B
    assert r["risk_level"] == "high"
    assert r["risk_score"] >= 4


def test_finance_dora_audit_london():
    r = finance_dora_audit(1)
    assert r["hive"] == "London"
    assert r["dora_score"] == "5/5"
    assert r["dora_compliant"] is True


def test_finance_dora_audit_unknown():
    r = finance_dora_audit(99)
    assert "error" in r


def test_finance_council_small():
    r = finance_council("approve", 1000)
    assert r["bft_size"] == 1
    assert r["voters_count"] == 1


def test_finance_council_medium():
    r = finance_council("approve", 500_000)
    assert r["bft_size"] == 3


def test_finance_council_large():
    r = finance_council("approve", 5_000_000)
    assert r["bft_size"] == 5


def test_finance_council_huge():
    r = finance_council("approve", 50_000_000)
    assert r["bft_size"] == 7


def test_no_external_deps():
    import meok_sovereign_finance_mcp as m
    src = open(m.__file__).read()
    assert "import ollama" not in src
    assert "import requests" not in src


def test_signed_outputs():
    for r in [finance_status(), finance_route(1, 22, 1000, "USD"),
              finance_risk(1, 22, 1000), finance_dora_audit(1),
              finance_council("test", 1000)]:
        assert "kid" in r and "sig" in r and "ts" in r


def test_total_aum_consistency():
    r = finance_status()
    computed = sum(h["aum_b"] for h in FINANCE_HIVES)
    assert r["total_aum_billion_usd"] == computed


def test_fx_rates_present():
    assert _FX["USD"] == 1.0
    assert _FX["GBP"] < 1.0  # GBP cheaper than USD historically
    assert _FX["JPY"] > 100  # JPY weak vs USD


def test_dora_5_pillars():
    r = finance_dora_audit(1)
    assert len(r["dora_5_pillars"]) == 5
    for k in ["ICT_risk_management", "incident_reporting", "resilience_testing", "third_party_risk", "info_sharing"]:
        assert k in r["dora_5_pillars"]


def test_all_hives_have_score():
    for h in FINANCE_HIVES:
        assert "sovereign_score" in h
        assert h["sovereign_score"] > 0


def test_currencies_supported_at_london():
    r = finance_status()
    london = next(h for h in r["hives"] if h["name"] == "London")
    assert "GBP" in london["currencies"]
    assert "USD" in london["currencies"]
