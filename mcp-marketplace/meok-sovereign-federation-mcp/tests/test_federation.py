"""Tests for meok-sovereign-federation-mcp."""
import os, sys, tempfile, importlib
_TEST = tempfile.mkdtemp(prefix="sov_fed_")
os.environ["SOV_FED_KEY"] = _TEST + "/k.pem"

def get_fresh():
    if "meok_sovereign_federation_mcp" in sys.modules:
        del sys.modules["meok_sovereign_federation_mcp"]
    import meok_sovereign_federation_mcp as m
    importlib.reload(m)
    return m

def test_register():
    m = get_fresh()
    r = m.federation_register("mcp-test", "Layer 2", "test,capability")
    assert r["mcp"]["name"] == "mcp-test"

def test_register_no_name():
    m = get_fresh()
    r = m.federation_register("", "Layer 2", "")
    assert "error" in r

def test_discover():
    m = get_fresh()
    r = m.federation_discover("vote")
    assert r["total_matches"] >= 1

def test_discover_no_capability():
    m = get_fresh()
    r = m.federation_discover("")
    assert "error" in r

def test_discover_layer_filter():
    m = get_fresh()
    r = m.federation_discover("vote", layer="Layer 0")
    assert all(m["layer"] == "Layer 0" for m in r["matches"])

def test_route():
    m = get_fresh()
    r = m.federation_route("vote")
    assert "routed_to" in r

def test_route_no_capability():
    m = get_fresh()
    r = m.federation_route("")
    assert "error" in r

def test_route_no_match():
    m = get_fresh()
    r = m.federation_route("totally-unknown-capability-xyz")
    assert "error" in r

def test_invoke():
    m = get_fresh()
    r = m.federation_invoke("mcp-sigil", "sign", "doc=hello")
    assert r["mcp"] == "mcp-sigil"

def test_invoke_no_mcp():
    m = get_fresh()
    r = m.federation_invoke("", "tool")
    assert "error" in r

def test_invoke_unknown_mcp():
    m = get_fresh()
    r = m.federation_invoke("mcp-nope", "tool")
    assert "error" in r

def test_status():
    m = get_fresh()
    r = m.federation_status()
    assert r["total_mcps"] > 100
    assert "Layer 0" in r["by_layer"]

def test_no_external_deps():
    m = get_fresh()
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src

def test_signed_outputs():
    m = get_fresh()
    for r in [m.federation_register("x"), m.federation_discover("vote"),
              m.federation_route("vote"), m.federation_invoke("mcp-sigil", "sign"),
              m.federation_status()]:
        assert "kid" in r and "sig" in r and "ts" in r

def test_full_workflow():
    """Register → Discover → Route → Invoke → Status."""
    m = get_fresh()
    r1 = m.federation_register("mcp-new", "Layer 2", "new-feature")
    assert r1["mcp"]["name"] == "mcp-new"
    r2 = m.federation_discover("new-feature")
    assert r2["total_matches"] >= 1
    r3 = m.federation_route("new-feature")
    assert "routed_to" in r3
    r4 = m.federation_invoke("mcp-new", "new-tool")
    assert r4["mcp"] == "mcp-new"
    s = m.federation_status()
    assert s["total_mcps"] > 100

def test_100_mcps():
    """Federation should have 100+ MCPs pre-loaded."""
    m = get_fresh()
    assert len(m._REGISTRY) >= 100

def test_3_layers():
    m = get_fresh()
    s = m.federation_status()
    assert "Layer 0" in s["by_layer"]
    assert "Layer 1" in s["by_layer"]
    assert "Layer 2" in s["by_layer"]
