"""Tests for meok-sovereign-ecosystem-mcp."""
import os, sys, tempfile, importlib
_TEST = tempfile.mkdtemp(prefix="sov_eco_")
os.environ["SOV_ECO_KEY"] = _TEST + "/k.pem"

def get_fresh():
    if "meok_sovereign_ecosystem_mcp" in sys.modules:
        del sys.modules["meok_sovereign_ecosystem_mcp"]
    import meok_sovereign_ecosystem_mcp as m
    importlib.reload(m)
    return m

def test_register():
    m = get_fresh()
    r = m.eco_register("test-node", layer=2, tier="domain", doctrine="test")
    assert r["node"]["name"] == "test-node"
    assert r["total_nodes"] >= 1

def test_route():
    m = get_fresh()
    r = m.eco_route("GET /api/v1", from_node="sov33", to_node="sovereign-passport")
    assert r["from"] == "sov33"
    assert r["to"] == "sovereign-passport"
    assert len(r["path"]) == 3

def test_route_no_request():
    m = get_fresh()
    r = m.eco_route("")
    assert "error" in r

def test_anchor():
    m = get_fresh()
    r = m.eco_anchor("test content")
    assert r["chain_length"] >= 2
    assert r["hash"] != "genesis"

def test_anchor_increments_chain():
    m = get_fresh()
    r1 = m.eco_anchor("a")
    r2 = m.eco_anchor("b")
    assert r2["chain_length"] == r1["chain_length"] + 1

def test_bft_vote_yes():
    m = get_fresh()
    r = m.eco_bft_vote("deploy", voter="queen-1", vote="yes")
    assert r["vote"]["vote"] == "yes"

def test_bft_vote_no():
    m = get_fresh()
    r = m.eco_bft_vote("deploy", voter="queen-1", vote="no")
    assert r["vote"]["vote"] == "no"

def test_bft_vote_invalid():
    m = get_fresh()
    r = m.eco_bft_vote("deploy", vote="maybe")
    assert "error" in r

def test_bft_quorum_check():
    m = get_fresh()
    for i in range(12):
        m.eco_bft_vote(f"prop-{i}", voter=f"queen-{i+1}", vote="yes")
    s = m.eco_status()
    assert s["bft_yes"] == 12

def test_status():
    m = get_fresh()
    r = m.eco_status()
    assert r["sovereign_composite"] == 7.305
    assert r["care_floor"] == 0.95
    assert r["total_nodes"] >= 20

def test_no_external_deps():
    m = get_fresh()
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src

def test_signed_outputs():
    m = get_fresh()
    for r in [m.eco_register("x"), m.eco_route("GET /"), m.eco_anchor(), m.eco_bft_vote("x"), m.eco_status()]:
        assert "kid" in r and "sig" in r and "ts" in r

def test_layer_0_protocol_hub():
    """Layer 0 nodes must include core sovereignty primitives."""
    m = get_fresh()
    s = m.eco_status()
    # All layer-0 nodes registered
    layer_0 = [n for n, meta in m._NODES.items() if meta["layer"] == 0]
    assert len(layer_0) >= 5  # sigil, watchdog, pheromone, revise, federation

def test_full_workflow():
    """Register → Route → Anchor → Vote → Status."""
    m = get_fresh()
    r1 = m.eco_register("test-node", layer=2, tier="domain", doctrine="test")
    assert r1["node"]["name"] == "test-node"
    r2 = m.eco_route("deploy sovereign-os", from_node="sov33", to_node="test-node")
    assert r2["to"] == "test-node"
    r3 = m.eco_anchor("sovereign-os deploy")
    assert r3["chain_length"] >= 2
    r4 = m.eco_bft_vote("deploy sovereign-os", voter="queen-1", vote="yes")
    assert r4["vote"]["vote"] == "yes"
    s = m.eco_status()
    assert s["bft_yes"] >= 1
    assert s["total_nodes"] >= 21
