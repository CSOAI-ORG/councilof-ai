"""Tests for meok-sovereign-hive-mcp."""
import os, tempfile
_TEST = tempfile.mkdtemp(prefix="sov_hive_")
os.environ["SOV_HIVE_KEY"] = _TEST + "/k.pem"
from meok_sovereign_hive_mcp import (
    hive_get, hive_list, hive_status, hive_route, hive_tier,
    HIVES, _SERVICES,
)


def test_33_hives():
    assert len(HIVES) == 33


def test_4_tiers():
    tiers = set(h["tier"] for h in HIVES)
    assert tiers == {"inner", "middle", "outer", "frontier"}


def test_12_generals():
    """12 unique generals are the lead of the 33 hives."""
    gens = set(h["gen"] for h in HIVES)
    assert len(gens) == 11  # 11 generals on hives (Dragon is sovereign CSOAI sun)


def test_hive_get_by_id():
    r = hive_get(hive_id=1)
    assert r["hive"]["name"] == "London"


def test_hive_get_by_name():
    r = hive_get(name="Tokyo")
    assert r["hive"]["country"] == "JP"


def test_hive_get_not_found():
    r = hive_get(name="Atlantis")
    assert "error" in r


def test_hive_get_no_args():
    r = hive_get()
    assert "error" in r


def test_hive_get_has_status():
    r = hive_get(name="London")
    assert r["status"] == "online"
    assert "sovereign_composite" in r


def test_hive_list():
    r = hive_list()
    assert r["total"] == 33


def test_hive_list_by_tier():
    r = hive_list()
    assert len(r["by_tier"]["inner"]) == 6
    assert len(r["by_tier"]["middle"]) == 12
    assert len(r["by_tier"]["outer"]) == 9
    assert len(r["by_tier"]["frontier"]) == 6


def test_hive_status_all_online():
    r = hive_status()
    assert r["online"] == 33
    assert r["degraded"] == 0
    assert r["offline"] == 0


def test_hive_route_london_to_tokyo():
    r = hive_route(1, 21)
    assert r["distance_km"] > 9000  # London-Tokyo is ~9500 km
    assert r["from"]["name"] == "London"
    assert r["to"]["name"] == "Tokyo"


def test_hive_route_short():
    r = hive_route(1, 2)  # London to Cambridge (~80km)
    assert r["distance_km"] < 200


def test_hive_route_invalid():
    r = hive_route(1, 99)
    assert "error" in r


def test_hive_route_strength():
    """Same general = 0.85, same tier = 0.55, otherwise 0.35."""
    r1 = hive_route(1, 2)  # London, Cambridge - both inner
    assert r1["integration_strength"] == 0.55  # same tier
    r2 = hive_route(1, 19)  # London, NY - different tier/general
    assert r2["integration_strength"] == 0.35


def test_hive_tier_inner():
    r = hive_tier("inner")
    assert r["count"] == 6
    assert r["hives"][0]["tier"] == "inner"


def test_hive_tier_middle():
    r = hive_tier("middle")
    assert r["count"] == 12


def test_hive_tier_outer():
    r = hive_tier("outer")
    assert r["count"] == 9


def test_hive_tier_frontier():
    r = hive_tier("frontier")
    assert r["count"] == 6


def test_hive_tier_invalid():
    r = hive_tier("core")
    assert "error" in r


def test_no_external_deps():
    import meok_sovereign_hive_mcp as m
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src


def test_signed_outputs():
    for r in [hive_list(), hive_get(name="London"), hive_status(),
              hive_route(1, 21), hive_tier("inner")]:
        assert "kid" in r and "sig" in r and "ts" in r


def test_all_hives_have_required_fields():
    for h in HIVES:
        assert "id" in h
        assert "name" in h
        assert "lat" in h
        assert "lng" in h
        assert "tier" in h
        assert "gen" in h
        assert "country" in h


def test_country_distribution():
    """Distribution of countries."""
    countries = set(h["country"] for h in HIVES)
    assert len(countries) >= 20


def test_london_coordinates():
    """London is at the canonical coordinates."""
    london = next(h for h in HIVES if h["name"] == "London")
    assert abs(london["lat"] - 51.5074) < 0.01
    assert abs(london["lng"] - (-0.1278)) < 0.01


def test_services_list_non_empty():
    assert len(_SERVICES) > 0


def test_full_workflow():
    """List → Get → Status → Route → Tier."""
    l = hive_list()
    assert l["total"] == 33
    g = hive_get(name="Tokyo")
    assert g["hive"]["name"] == "Tokyo"
    s = hive_status()
    assert s["online"] == 33
    r = hive_route(1, 21)
    assert r["distance_km"] > 9000
    t = hive_tier("inner")
    assert t["count"] == 6
