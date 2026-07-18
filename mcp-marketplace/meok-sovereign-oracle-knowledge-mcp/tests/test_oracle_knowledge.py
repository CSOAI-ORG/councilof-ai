"""Tests for meok-sovereign-oracle-knowledge-mcp."""
import os, sys, tempfile, importlib
_TEST = tempfile.mkdtemp(prefix="sov_oracle_")
os.environ["SOV_ORACLE_KEY"] = _TEST + "/k.pem"

def get_fresh():
    if "meok_sovereign_oracle_knowledge_mcp" in sys.modules:
        del sys.modules["meok_sovereign_oracle_knowledge_mcp"]
    import meok_sovereign_oracle_knowledge_mcp as m
    importlib.reload(m)
    return m

def test_query():
    m = get_fresh()
    r = m.oracle_query("sovereign AI")
    assert "relevant_charters" in r

def test_query_no_query():
    m = get_fresh()
    r = m.oracle_query("")
    assert "error" in r

def test_crosswalk():
    m = get_fresh()
    r = m.oracle_crosswalk("csoai-charter", "EU AI Act")
    assert "charter" in r

def test_crosswalk_no_charter():
    m = get_fresh()
    r = m.oracle_crosswalk("", "EU AI Act")
    assert "error" in r

def test_crosswalk_no_framework():
    m = get_fresh()
    r = m.oracle_crosswalk("csoai-charter", "")
    assert "error" in r

def test_explain():
    m = get_fresh()
    r = m.oracle_explain("Charter Article 0")
    assert "summary" in r

def test_explain_no_topic():
    m = get_fresh()
    r = m.oracle_explain("")
    assert "error" in r

def test_search():
    m = get_fresh()
    r = m.oracle_search("sovereign")
    assert "results" in r

def test_search_no_term():
    m = get_fresh()
    r = m.oracle_search("")
    assert "error" in r

def test_status():
    m = get_fresh()
    r = m.oracle_status()
    assert r["total_charters"] >= 41
    assert r["total_crosswalks"] >= 9000

def test_no_external_deps():
    m = get_fresh()
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src

def test_signed_outputs():
    m = get_fresh()
    for r in [m.oracle_query("test"), m.oracle_crosswalk("c", "f"),
              m.oracle_explain("t"), m.oracle_search("s"), m.oracle_status()]:
        assert "kid" in r and "sig" in r and "ts" in r

def test_full_workflow():
    """Query → Crosswalk → Explain → Search → Status."""
    m = get_fresh()
    r1 = m.oracle_query("charter")
    assert r1["crosswalks"] >= 0
    r2 = m.oracle_crosswalk("csoai-charter", "EU AI Act")
    assert r2["articles_mapped"] >= 1
    r3 = m.oracle_explain("Charter Article 0")
    assert "summary" in r3
    r4 = m.oracle_search("sovereign")
    assert "results" in r4
    s = m.oracle_status()
    assert s["total_crosswalks"] >= 9000

def test_41_charters():
    m = get_fresh()
    assert len(m.CHARTERS) >= 41

def test_crosswalks_9676():
    m = get_fresh()
    assert len(m.CHARTERS) * len(m.FRAMEWORKS) >= 9676
