"""Tests for meok-sovereign-readme-mcp."""
import os, sys, tempfile, importlib
_TEST = tempfile.mkdtemp(prefix="sov_rdm_")
os.environ["SOV_RDM_KEY"] = _TEST + "/k.pem"

def get_fresh():
    if "meok_sovereign_readme_mcp" in sys.modules:
        del sys.modules["meok_sovereign_readme_mcp"]
    import meok_sovereign_readme_mcp as m
    importlib.reload(m)
    return m

def test_generate_basic():
    m = get_fresh()
    r = m.readme_generate("meok-sovereign-test-mcp", "Test MCP", tool_count=5, layer=2, category="domain", test_count=10)
    assert "meok-sovereign-test-mcp" in r["readme"]
    assert r["size_bytes"] > 0

def test_generate_short_name():
    m = get_fresh()
    r = m.readme_generate("meok-sovereign-passport-mcp")
    assert "sovereign_passport" in r["readme"]

def test_template():
    m = get_fresh()
    r = m.readme_template()
    assert "sovereign" in r["template"].lower()
    assert r["size_bytes"] > 100

def test_validate_passing():
    m = get_fresh()
    readme = m.readme_generate("meok-sovereign-test-mcp", "Test", tool_count=5, layer=2, test_count=10)["readme"]
    r = m.readme_validate(readme)
    assert r["total"] == 9
    assert r["passed"] >= 7  # most checks should pass

def test_validate_empty():
    m = get_fresh()
    r = m.readme_validate("")
    assert "error" in r

def test_validate_failing():
    m = get_fresh()
    r = m.readme_validate("# Title\nA README without sovereign principles")
    assert r["passed"] < r["total"]

def test_badge_basic():
    m = get_fresh()
    r = m.readme_badge("meok-sovereign-test-mcp")
    assert len(r["badges"]) == 7
    assert any("Sovereign" in b for b in r["badges"])

def test_status():
    m = get_fresh()
    r = m.readme_status()
    assert r["supported_mcps"] == 99

def test_no_external_deps():
    m = get_fresh()
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src

def test_signed_outputs():
    m = get_fresh()
    for r in [m.readme_generate("test"), m.readme_template(),
              m.readme_validate("# sovereign test"), m.readme_badge("test"),
              m.readme_status()]:
        assert "kid" in r and "sig" in r and "ts" in r

def test_full_workflow():
    m = get_fresh()
    t = m.readme_template()
    assert t["size_bytes"] > 100
    r = m.readme_generate("meok-sovereign-wallet-mcp", "Sovereign wallet", tool_count=5, layer=1, test_count=18)
    assert "wallet" in r["readme"]
    v = m.readme_validate(r["readme"])
    assert v["passed"] >= 7
    b = m.readme_badge("meok-sovereign-wallet-mcp")
    assert len(b["badges"]) == 7
