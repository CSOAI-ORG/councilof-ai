"""Tests for meok-sovereign-minting-mcp."""
import os, sys, tempfile, importlib
_TEST = tempfile.mkdtemp(prefix="sov_mnt_")
os.environ["SOV_MNT_KEY"] = _TEST + "/k.pem"

def get_fresh():
    if "meok_sovereign_minting_mcp" in sys.modules:
        del sys.modules["meok_sovereign_minting_mcp"]
    import meok_sovereign_minting_mcp as m
    importlib.reload(m)
    return m

def test_cert_basic():
    m = get_fresh()
    r = m.mint_certificate("alice", "gold", "Sovereign citizen")
    assert r["certificate"]["entity"] == "alice"
    assert r["total_certificates"] == 1

def test_cert_no_entity():
    m = get_fresh()
    r = m.mint_certificate("")
    assert "error" in r

def test_cert_increments():
    m = get_fresh()
    m.mint_certificate("a")
    m.mint_certificate("b")
    m.mint_certificate("c")
    s = m.mint_status()
    assert s["total_certificates"] == 3

def test_cert_tiers():
    m = get_fresh()
    for tier in ["bronze", "silver", "gold", "platinum", "sovereign"]:
        r = m.mint_certificate(f"entity-{tier}", tier)
        assert r["certificate"]["tier"] == tier

def test_citation_basic():
    m = get_fresh()
    r = m.mint_citation("alice", "Built sovereign MCP", weight=2.5)
    assert r["citation"]["entity"] == "alice"
    assert r["citation"]["weight"] == 2.5

def test_citation_no_entity():
    m = get_fresh()
    r = m.mint_citation("")
    assert "error" in r

def test_citation_increments():
    m = get_fresh()
    m.mint_citation("a", "x")
    m.mint_citation("b", "y")
    s = m.mint_status()
    assert s["total_citations"] == 2

def test_list_basic():
    m = get_fresh()
    m.mint_certificate("a", "gold")
    m.mint_citation("b", "x")
    r = m.mint_list()
    assert r["total_certificates"] == 1
    assert r["total_citations"] == 1

def test_list_filter_entity():
    m = get_fresh()
    m.mint_certificate("alice", "gold")
    m.mint_certificate("bob", "silver")
    r = m.mint_list(entity="alice")
    assert r["total_certificates"] == 1

def test_verify_basic():
    m = get_fresh()
    r = m.mint_certificate("alice", "gold")
    cert_id = r["certificate"]["cert_id"]
    v = m.mint_verify(cert_id)
    assert v["verified"] is True

def test_verify_unknown():
    m = get_fresh()
    r = m.mint_verify("nope")
    assert "error" in r

def test_verify_no_id():
    m = get_fresh()
    r = m.mint_verify("")
    assert "error" in r

def test_status():
    m = get_fresh()
    r = m.mint_status()
    assert "bronze" in r["tiers"]
    assert "sovereign" in r["tiers"]
    assert r["issuer"] == "CSOAI Ltd (UK 16939677)"

def test_no_external_deps():
    m = get_fresh()
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src

def test_signed_outputs():
    m = get_fresh()
    for r in [m.mint_certificate("x"), m.mint_citation("x", "y"),
              m.mint_list(), m.mint_verify("x"), m.mint_status()]:
        assert "kid" in r and "sig" in r and "ts" in r

def test_full_workflow():
    """Cert → Citation → List → Verify → Status."""
    m = get_fresh()
    r1 = m.mint_certificate("alice", "gold", "Built sovereign MCP")
    assert r1["total_certificates"] == 1
    r2 = m.mint_citation("alice", "wrote sovereign_substrate", weight=5.0)
    assert r2["total_citations"] == 1
    r3 = m.mint_list(entity="alice")
    assert r3["total_certificates"] == 1
    assert r3["total_citations"] == 1
    r4 = m.mint_verify(r1["certificate"]["cert_id"])
    assert r4["verified"] is True
    s = m.mint_status()
    assert s["total_certificates"] == 1
    assert s["total_citations"] == 1
