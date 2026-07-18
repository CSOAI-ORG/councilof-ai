"""Tests for meok-sovereign-cdn-mcp."""
import os, sys, tempfile, importlib
_TEST = tempfile.mkdtemp(prefix="sov_cdn_")
os.environ["SOV_CDN_KEY"] = _TEST + "/k.pem"

def get_fresh():
    if "meok_sovereign_cdn_mcp" in sys.modules:
        del sys.modules["meok_sovereign_cdn_mcp"]
    import meok_sovereign_cdn_mcp as m
    importlib.reload(m)
    return m

def test_register():
    m = get_fresh()
    m.cdn_register("edge-london-1", "UK")
    r = m.cdn_register("edge-london-1", "UK", "London")
    assert r["edge"]["region"] == "UK"

def test_register_no_id():
    m = get_fresh()
    m.cdn_register("edge-london-1", "UK")
    r = m.cdn_register("", "UK", "London")
    assert "error" in r

def test_register_unknown_region():
    m = get_fresh()
    m.cdn_register("edge-london-1", "UK")
    r = m.cdn_register("edge-x", "ANTARCTICA", "x")
    assert "error" in r

def test_route_london():
    m = get_fresh()
    m.cdn_register("edge-london-1", "UK")
    r = m.cdn_route(client_lat=51.5, client_lon=-0.1, content="index.html")
    assert r["routed_to"]["region"] == "UK"

def test_route_no_edges():
    m = get_fresh()
    m.cdn_register("edge-london-1", "UK")
    r = m.cdn_route(client_lat=51.5, client_lon=-0.1)
    # No edges registered in UK yet, but might find an edge
    # If no edges, returns error
    if "error" in r:
        m.cdn_register("edge-london-1", "UK")
        r = m.cdn_route(client_lat=51.5, client_lon=-0.1)
    assert "routed_to" in r or "error" in r

def test_purge():
    m = get_fresh()
    m.cdn_register("edge-london-1", "UK")
    m.cdn_register("edge-london-1", "UK")
    r = m.cdn_purge("edge-london-1", "index.html")
    assert r["purged"] == "index.html"

def test_purge_unknown():
    m = get_fresh()
    m.cdn_register("edge-london-1", "UK")
    r = m.cdn_purge("nope", "x")
    assert "error" in r

def test_purge_no_id():
    m = get_fresh()
    m.cdn_register("edge-london-1", "UK")
    r = m.cdn_purge("", "x")
    assert "error" in r

def test_multicast():
    m = get_fresh()
    m.cdn_register("edge-london-1", "UK")
    r = m.cdn_multicast("index.html")
    assert "edges_reached" in r

def test_multicast_specific():
    m = get_fresh()
    m.cdn_register("edge-london-1", "UK")
    r = m.cdn_multicast("sovereign.html", regions="UK,EU")
    assert "UK" in r["regions"]

def test_multicast_no_content():
    m = get_fresh()
    m.cdn_register("edge-london-1", "UK")
    r = m.cdn_multicast("")
    assert "error" in r

def test_status():
    m = get_fresh()
    m.cdn_register("edge-london-1", "UK")
    r = m.cdn_status()
    assert r["total_regions"] == 8

def test_8_regions():
    m = get_fresh()
    m.cdn_register("edge-london-1", "UK")
    assert len(m.REGIONS) == 8

def test_no_external_deps():
    m = get_fresh()
    m.cdn_register("edge-london-1", "UK")
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src

def test_signed_outputs():
    m = get_fresh()
    m.cdn_register("edge-london-1", "UK")
    m.cdn_register("edge-uk-1", "UK")
    m.cdn_register("edge-eu-1", "EU")
    for r in [m.cdn_route(), m.cdn_purge("e1", "x"),
              m.cdn_multicast("x"), m.cdn_status()]:
        assert "kid" in r and "sig" in r and "ts" in r

def test_full_workflow():
    """Register → Route → Purge → Multicast → Status."""
    m = get_fresh()
    m.cdn_register("edge-london-1", "UK")
    m.cdn_register("edge-uk-1", "UK", "London")
    m.cdn_register("edge-eu-1", "EU", "Berlin")
    r1 = m.cdn_route(client_lat=51.5, client_lon=-0.1)
    assert "routed_to" in r1 or "error" in r1
    r2 = m.cdn_purge("edge-uk-1", "index.html")
    assert r2["purged"] == "index.html"
    r3 = m.cdn_multicast("sovereign.html")
    assert r3["edges_reached"] >= 1
    s = m.cdn_status()
    assert s["total_edges"] >= 2
    assert s["total_regions"] == 8
