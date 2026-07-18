"""Tests for meok-sovereign-hive-pheromone-mcp."""
import os, tempfile
_TEST = tempfile.mkdtemp(prefix="sov_pher_")
os.environ["SOV_PHER_KEY"] = _TEST + "/k.pem"
from meok_sovereign_hive_pheromone_mcp import (
    pheromone_emit, pheromone_trace, pheromone_dorado, pheromone_hieroglyph, pheromone_status,
    _PHEROMONES, PHEROMONE_NETWORK, HIEROGLYPH_ONTOLOGY, DORADO_ROUTES,
)


def reset():
    _PHEROMONES.clear()


def test_3_pheromone_network():
    """Sigil-Horus-Sirius."""
    assert len(PHEROMONE_NETWORK) == 3
    assert "Sigil" in PHEROMONE_NETWORK
    assert "Horus" in PHEROMONE_NETWORK
    assert "Sirius" in PHEROMONE_NETWORK


def test_22_hieroglyphs():
    assert len(HIEROGLYPH_ONTOLOGY) == 22


def test_10_dorado_routes():
    assert len(DORADO_ROUTES) == 10


def test_pheromone_emit_basic():
    reset()
    r = pheromone_emit("London", "trust")
    assert r["pheromone"]["hive"] == "London"
    assert r["pheromone"]["signal"] == "trust"
    assert r["pheromone"]["strength"] == 1.0


def test_pheromone_emit_strength_clamp():
    reset()
    r = pheromone_emit("London", "x", strength=5.0)
    assert r["pheromone"]["strength"] == 1.0  # clamped


def test_pheromone_emit_strength_low():
    reset()
    r = pheromone_emit("London", "x", strength=-1.0)
    assert r["pheromone"]["strength"] == 0.0  # clamped


def test_pheromone_emit_source():
    reset()
    r = pheromone_emit("Tokyo", "alert", source="humanoid")
    assert r["pheromone"]["source"] == "humanoid"


def test_pheromone_emit_missing_args():
    reset()
    r = pheromone_emit("", "x")
    assert "error" in r
    r = pheromone_emit("London", "")
    assert "error" in r


def test_pheromone_emit_accumulates():
    reset()
    pheromone_emit("London", "a")
    pheromone_emit("London", "b")
    pheromone_emit("Tokyo", "c")
    assert len(_PHEROMONES) == 3


def test_pheromone_trace_direct():
    r = pheromone_trace("London", "New York")
    assert r["from"] == "London"
    assert r["to"] == "New York"
    assert "New York" in r["path"]


def test_pheromone_trace_reverse():
    r = pheromone_trace("New York", "London")
    assert r["east_west"] == "WEST"
    assert "London" in r["path"]


def test_pheromone_trace_unknown():
    """Unknown path should still return a route (default via London)."""
    r = pheromone_trace("Mars", "Pluto")
    assert len(r["path"]) >= 2  # At least from → to
    assert "path" in r


def test_pheromone_trace_missing_args():
    r = pheromone_trace("", "Tokyo")
    assert "error" in r
    r = pheromone_trace("London", "")
    assert "error" in r


def test_pheromone_dorado_list():
    r = pheromone_dorado()
    assert r["total"] == 10


def test_pheromone_dorado_uk_us():
    r = pheromone_dorado("UK→US")
    assert r["route"]["east_west"] == "WEST"
    assert r["key"] == "UK→US"


def test_pheromone_dorado_uk_as():
    r = pheromone_dorado("UK→AS")
    assert r["route"]["east_west"] == "EAST"


def test_pheromone_dorado_unknown():
    r = pheromone_dorado("FAKE→ROUTE")
    assert "error" in r


def test_pheromone_hieroglyph_no_arg():
    r = pheromone_hieroglyph()
    assert r["total"] == 22


def test_pheromone_hieroglyph_aleph():
    r = pheromone_hieroglyph("Aleph")
    assert r["hieroglyph"]["letter"] == "Aleph"
    assert r["hieroglyph"]["signal"] == "sovereign"


def test_pheromone_hieroglyph_tav():
    r = pheromone_hieroglyph("Tav")
    assert r["hieroglyph"]["letter"] == "Tav"
    assert r["hieroglyph"]["signal"] == "pqc"


def test_pheromone_hieroglyph_invalid():
    r = pheromone_hieroglyph("XYZ")
    assert "error" in r


def test_pheromone_status():
    reset()
    r = pheromone_status()
    assert r["hives"] == 33
    assert r["crown_lineage"] == "1795-2026"
    assert r["active_pheromones"] == 0
    assert r["total_dorado_routes"] == 10
    assert r["hieroglyphs"] == 22


def test_no_external_deps():
    import meok_sovereign_hive_pheromone_mcp as m
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src


def test_signed_outputs():
    reset()
    for r in [pheromone_emit("London", "x"), pheromone_trace("London", "Tokyo"),
              pheromone_dorado(), pheromone_hieroglyph(), pheromone_status()]:
        assert "kid" in r and "sig" in r and "ts" in r


def test_pheromone_network_roles():
    """Each network node has a role + symbol + color + purpose."""
    for name, info in PHEROMONE_NETWORK.items():
        assert "role" in info
        assert "symbol" in info
        assert "color" in info
        assert "purpose" in info


def test_dorado_routes_have_east_west():
    for key, route in DORADO_ROUTES.items():
        assert "east_west" in route
        assert route["east_west"] in ("EAST", "WEST")


def test_hieroglyph_ontology_has_letter_and_signal():
    for h in HIEROGLYPH_ONTOLOGY:
        assert "letter" in h
        assert "arcana" in h
        assert "signal" in h
        assert "color" in h


def test_full_workflow():
    """Emit → Trace → DORADO → Hieroglyph → Status."""
    reset()
    e = pheromone_emit("London", "trust", source="human")
    assert e["pheromone"]["pheromone_id"].startswith("pher-")
    t = pheromone_trace("London", "Tokyo")
    assert len(t["path"]) >= 2
    d = pheromone_dorado("UK→JP")
    assert d["route"]["east_west"] == "EAST"
    h = pheromone_hieroglyph("Aleph")
    assert h["hieroglyph"]["letter"] == "Aleph"
    s = pheromone_status()
    assert s["active_pheromones"] >= 1
