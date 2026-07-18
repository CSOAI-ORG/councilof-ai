"""Tests for meok-sovereign-certificate-mcp."""
import os, sys, tempfile, importlib
_TEST = tempfile.mkdtemp(prefix="sov_cert_")
os.environ["SOV_CERT_KEY"] = _TEST + "/k.pem"

def get_fresh():
    if "meok_sovereign_certificate_mcp" in sys.modules:
        del sys.modules["meok_sovereign_certificate_mcp"]
    import meok_sovereign_certificate_mcp as m
    importlib.reload(m)
    return m

def test_mint():
    m = get_fresh()
    r = m.cert_mint("Alice", "bronze", 0)
    assert "cert" in r
    assert r["cert"]["tier"] == "bronze"

def test_mint_no_entity():
    m = get_fresh()
    r = m.cert_mint("", "bronze", 0)
    assert "error" in r

def test_mint_invalid_tier():
    m = get_fresh()
    r = m.cert_mint("Alice", "bogus", 0)
    assert "error" in r

def test_mint_score_too_low():
    m = get_fresh()
    r = m.cert_mint("Alice", "sovereign", 50)  # Sovereign needs 95
    assert "error" in r

def test_mint_all_tiers():
    m = get_fresh()
    for tier, min_score in [("bronze",0),("silver",50),("gold",75),("platinum",90),("sovereign",95)]:
        r = m.cert_mint(f"Alice-{tier}", tier, min_score)
        assert "cert" in r

def test_verify():
    m = get_fresh()
    mint = m.cert_mint("Alice", "gold", 75)
    cid = mint["cert"]["cert_id"]
    r = m.cert_verify(cid)
    assert r["valid"] is True

def test_verify_no_id():
    m = get_fresh()
    r = m.cert_verify("")
    assert "error" in r

def test_verify_unknown():
    m = get_fresh()
    r = m.cert_verify("nope")
    assert "error" in r

def test_verify_revoked():
    m = get_fresh()
    mint = m.cert_mint("Alice", "gold", 75)
    cid = mint["cert"]["cert_id"]
    m.cert_revoke(cid, "test")
    r = m.cert_verify(cid)
    assert r["valid"] is False

def test_list():
    m = get_fresh()
    m.cert_mint("Alice", "bronze", 0)
    r = m.cert_list()
    assert r["total"] >= 1

def test_list_by_entity():
    m = get_fresh()
    m.cert_mint("Alice", "bronze", 0)
    m.cert_mint("Bob", "bronze", 0)
    r = m.cert_list(entity="Alice")
    assert all(c["entity"] == "Alice" for c in r["certs"])

def test_revoke():
    m = get_fresh()
    mint = m.cert_mint("Alice", "gold", 75)
    cid = mint["cert"]["cert_id"]
    r = m.cert_revoke(cid, "compromised")
    assert r["revoked"] is True

def test_revoke_no_id():
    m = get_fresh()
    r = m.cert_revoke("", "reason")
    assert "error" in r

def test_revoke_unknown():
    m = get_fresh()
    r = m.cert_revoke("nope", "reason")
    assert "error" in r

def test_status():
    m = get_fresh()
    r = m.cert_status()
    assert "tiers" in r
    assert "sovereign" in r["tiers"]

def test_no_external_deps():
    m = get_fresh()
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src

def test_signed_outputs():
    m = get_fresh()
    for r in [m.cert_mint("a", "bronze", 0), m.cert_list(), m.cert_status()]:
        assert "kid" in r and "sig" in r and "ts" in r

def test_full_workflow():
    """Mint → Verify → List → Revoke → Status."""
    m = get_fresh()
    r1 = m.cert_mint("Alice", "sovereign", 95)
    cid = r1["cert"]["cert_id"]
    r2 = m.cert_verify(cid)
    assert r2["valid"] is True
    assert r2["ots_anchored"] is True
    r3 = m.cert_list()
    assert r3["total"] >= 1
    r4 = m.cert_revoke(cid, "test")
    assert r4["revoked"] is True
    s = m.cert_status()
    assert s["total_certs"] >= 1

def test_5_tiers():
    m = get_fresh()
    assert set(m.TIERS.keys()) == {"bronze", "silver", "gold", "platinum", "sovereign"}
