"""Tests for meok-sovereign-search-mcp."""
import os, sys, tempfile, importlib
_TEST = tempfile.mkdtemp(prefix="sov_search_")
os.environ["SOV_SEARCH_KEY"] = _TEST + "/k.pem"

def get_fresh():
    if "meok_sovereign_search_mcp" in sys.modules:
        del sys.modules["meok_sovereign_search_mcp"]
    import meok_sovereign_search_mcp as m
    importlib.reload(m)
    return m

def test_query():
    m = get_fresh()
    r = m.search_query("sovereign")
    assert r["total"] > 0

def test_query_no_results():
    m = get_fresh()
    r = m.search_query("xyzabc123notfound")
    assert r["total"] == 0

def test_query_no_query():
    m = get_fresh()
    r = m.search_query("")
    assert "error" in r

def test_query_specific():
    m = get_fresh()
    r = m.search_query("ed25519")
    assert r["total"] >= 1

def test_semantic():
    m = get_fresh()
    r = m.search_semantic("sovereign signing")
    assert r["total"] > 0

def test_semantic_no_query():
    m = get_fresh()
    r = m.search_semantic("")
    assert "error" in r

def test_index():
    m = get_fresh()
    r = m.search_index("test-doc", "Test Doc", "This is a sovereign document about AI.", "Layer 1", "test,sovereign")
    assert r["doc_id"] == "test-doc"

def test_index_no_doc_id():
    m = get_fresh()
    r = m.search_index("", "Title", "Body", "Layer 1", "")
    assert "error" in r

def test_index_no_body():
    m = get_fresh()
    r = m.search_index("x", "Title", "", "Layer 1", "")
    assert "error" in r

def test_index_then_search():
    m = get_fresh()
    m.search_index("special-doc", "Special", "Quantum-resistant cryptography with ML-DSA-65.", "Layer 1", "quantum,pqc")
    r = m.search_query("quantum-resistant")
    assert r["total"] >= 1

def test_list():
    m = get_fresh()
    r = m.search_list()
    assert r["total"] >= 25

def test_list_kind():
    m = get_fresh()
    r = m.search_list(kind="Layer 0")
    assert all(d["kind"] == "Layer 0" for d in r["documents"])

def test_status():
    m = get_fresh()
    r = m.search_status()
    assert r["total_documents"] >= 25
    assert r["total_unique_words"] > 0

def test_no_external_deps():
    m = get_fresh()
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src

def test_signed_outputs():
    m = get_fresh()
    for r in [m.search_query("sovereign"), m.search_semantic("sovereign"),
              m.search_list(), m.search_status()]:
        assert "kid" in r and "sig" in r and "ts" in r

def test_full_workflow():
    """Index → Query → Semantic → List → Status."""
    m = get_fresh()
    r1 = m.search_index("workflow-doc", "Workflow", "Test sovereign workflow.", "Layer 1", "test")
    assert r1["doc_id"] == "workflow-doc"
    r2 = m.search_query("workflow")
    assert r2["total"] >= 1
    r3 = m.search_semantic("workflow")
    assert r3["total"] >= 1
    r4 = m.search_list()
    assert r4["total"] >= 25
    s = m.search_status()
    assert s["total_documents"] >= 25
