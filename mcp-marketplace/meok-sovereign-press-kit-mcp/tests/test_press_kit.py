"""Tests for meok-sovereign-press-kit-mcp."""
import os, sys, tempfile, importlib
_TEST = tempfile.mkdtemp(prefix="sov_press_")
os.environ["SOV_PRESS_KEY"] = _TEST + "/k.pem"

def get_fresh():
    if "meok_sovereign_press_kit_mcp" in sys.modules:
        del sys.modules["meok_sovereign_press_kit_mcp"]
    import meok_sovereign_press_kit_mcp as m
    importlib.reload(m)
    return m

def test_release():
    m = get_fresh()
    r = m.press_release()
    assert "release" in r

def test_release_custom_headline():
    m = get_fresh()
    r = m.press_release("Breaking: Sovereign AI launches today")
    assert r["release"]["headline"] == "Breaking: Sovereign AI launches today"

def test_fact_sheet():
    m = get_fresh()
    r = m.press_fact_sheet()
    assert "fact_sheet" in r
    assert r["fact_sheet"]["company_house"] == "UK Companies House 16939677"

def test_briefing():
    m = get_fresh()
    r = m.press_briefing("media")
    assert "briefing" in r
    assert "key_talking_points" in r["briefing"]

def test_briefing_investors():
    m = get_fresh()
    r = m.press_briefing("investors")
    assert r["audience"] == "investors"

def test_quote_founder():
    m = get_fresh()
    r = m.press_quote("founder")
    assert "persona" in r
    assert "The dragon ships" in r["quote"]

def test_quote_architect():
    m = get_fresh()
    r = m.press_quote("sovereign-architect")
    assert "127 MCPs" in r["quote"]

def test_quote_bft():
    m = get_fresh()
    r = m.press_quote("bft-spokesperson")
    assert "33-agent" in r["quote"]

def test_quote_unknown():
    m = get_fresh()
    r = m.press_quote("unknown")
    assert "The dragon ships" in r["quote"]  # Default

def test_status():
    m = get_fresh()
    r = m.press_status()
    assert "personas_available" in r

def test_no_external_deps():
    m = get_fresh()
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src

def test_signed_outputs():
    m = get_fresh()
    for r in [m.press_release(), m.press_fact_sheet(),
              m.press_briefing(), m.press_quote("founder"), m.press_status()]:
        assert "kid" in r and "sig" in r and "ts" in r

def test_full_workflow():
    """Release → Fact sheet → Briefing → Quote → Status."""
    m = get_fresh()
    r1 = m.press_release()
    assert "release_id" in r1["release"]
    r2 = m.press_fact_sheet()
    assert r2["fact_sheet"]["sheet_id"].startswith("fact-")
    r3 = m.press_briefing("media")
    assert r3["audience"] == "media"
    r4 = m.press_quote("founder")
    assert "The dragon ships" in r4["quote"]
    s = m.press_status()
    assert s["press_releases"] >= 1
    assert s["fact_sheets"] >= 1

def test_3_personas():
    m = get_fresh()
    assert len(m.PERSONAS) == 3
