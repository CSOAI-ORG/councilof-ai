"""Tests for meok-sovereign-treasury-mcp."""
import os, sys, tempfile, importlib
_TEST = tempfile.mkdtemp(prefix="sov_treasury_")
os.environ["SOV_TREASURY_KEY"] = _TEST + "/k.pem"

def get_fresh():
    if "meok_sovereign_treasury_mcp" in sys.modules:
        del sys.modules["meok_sovereign_treasury_mcp"]
    import meok_sovereign_treasury_mcp as m
    importlib.reload(m)
    return m

def test_balance():
    m = get_fresh()
    r = m.treasury_balance()
    assert r["balance_gbp"] > 0

def test_payout():
    m = get_fresh()
    r = m.treasury_payout("citizen-1", "foundation")
    assert r["payout"]["amount_gbp"] == 300

def test_payout_no_citizen():
    m = get_fresh()
    r = m.treasury_payout("", "foundation")
    assert "error" in r

def test_payout_invalid_tier():
    m = get_fresh()
    r = m.treasury_payout("citizen-1", "bogus")
    assert "error" in r

def test_payout_all_tiers():
    m = get_fresh()
    for tier in ["foundation", "practitioner", "lead-auditor", "director"]:
        r = m.treasury_payout(f"citizen-{tier}", tier)
        assert r["payout"]["amount_gbp"] == {'foundation':300, 'practitioner':600, 'lead-auditor':900, 'director':1200}[tier]

def test_ledger():
    m = get_fresh()
    m.treasury_payout("c1", "foundation")
    r = m.treasury_ledger()
    assert r["total"] >= 1

def test_ledger_empty():
    m = get_fresh()
    r = m.treasury_ledger()
    assert r["total"] == 0

def test_audit():
    m = get_fresh()
    m.treasury_payout("c1", "foundation")
    r = m.treasury_audit()
    assert r["audit_passed"] is True
    assert r["total_paid"] == 300

def test_status():
    m = get_fresh()
    r = m.treasury_status()
    assert r["balance"] > 0
    assert "foundation" in r["ubi_tiers"]

def test_no_external_deps():
    m = get_fresh()
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src

def test_signed_outputs():
    m = get_fresh()
    m.treasury_payout("c1", "foundation")
    for r in [m.treasury_balance(), m.treasury_ledger(),
              m.treasury_audit(), m.treasury_status()]:
        assert "kid" in r and "sig" in r and "ts" in r

def test_full_workflow():
    """Balance → Payout → Ledger → Audit → Status."""
    m = get_fresh()
    r1 = m.treasury_balance()
    initial = r1["balance_gbp"]
    r2 = m.treasury_payout("c1", "lead-auditor")
    assert r2["payout"]["amount_gbp"] == 900
    r3 = m.treasury_ledger()
    assert r3["total"] >= 1
    r4 = m.treasury_audit()
    assert r4["audit_passed"] is True
    s = m.treasury_status()
    assert s["total_payouts"] >= 1

def test_4_ubi_tiers():
    m = get_fresh()
    assert set(m._UBI_TIERS.keys()) == {"foundation", "practitioner", "lead-auditor", "director"}
