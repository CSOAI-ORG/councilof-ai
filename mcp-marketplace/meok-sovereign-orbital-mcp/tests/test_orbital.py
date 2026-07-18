"""Tests for meok-sovereign-orbital-mcp (33 hive orbital mechanics)."""
import os, tempfile, math
_TEST = tempfile.mkdtemp(prefix="sov_orb_")
os.environ["SOV_ORB_KEY"] = _TEST + "/k.pem"
from meok_sovereign_orbital_mcp import (
    hive_position, hive_orbital, hive_resonance, sovereign_align, solar_system,
    HIVES,
)


def test_33_hives():
    assert len(HIVES) == 33


def test_hive_position():
    r = hive_position(1, 0.0)
    assert r["hive_id"] == 1
    assert r["position_au"][0] == 0.39  # London at 0.39 AU at t=0
    assert abs(r["position_au"][2]) < 0.001


def test_hive_position_later():
    r = hive_position(3, 0.5)  # Edinburgh half a year in
    assert "position_au" in r


def test_hive_position_unknown():
    r = hive_position(99, 0.0)
    assert "error" in r


def test_hive_orbital():
    r = hive_orbital(1)
    assert r["hive_name"] == "London"
    assert r["distance_au"] == 0.39
    assert r["kepler_check_period_yr"] > 0
    assert r["speed_au_per_yr"] > 0


def test_hive_orbital_tiers():
    r = hive_orbital(1)
    assert r["tier"] == 1
    r2 = hive_orbital(7)
    assert r2["tier"] == 2
    r3 = hive_orbital(19)
    assert r3["tier"] == 3
    r4 = hive_orbital(28)
    assert r4["tier"] == 4


def test_hive_orbital_unknown():
    r = hive_orbital(99)
    assert "error" in r


def test_hive_resonance():
    r = hive_resonance(1, 2)  # London + Cambridge
    assert "resonance" in r
    assert r["hive_a"] == "London"
    assert r["hive_b"] == "Cambridge"


def test_hive_resonance_known():
    # Earth-Mars ratio ~2:1
    # London period 0.24, Cambridge 0.62
    r = hive_resonance(1, 3)
    # London (0.24) vs Edinburgh (1.0) - not resonant
    assert "resonance" in r


def test_hive_resonance_unknown():
    r = hive_resonance(99, 1)
    assert "error" in r


def test_sovereign_align():
    r = sovereign_align(0.0)
    assert r["hive_count"] == 33
    assert r["centroid_au"] is not None


def test_sovereign_align_with_time():
    r = sovereign_align(1.0)  # 1 year in
    assert r["t_yr"] == 1.0


def test_solar_system():
    r = solar_system(0.0)
    assert r["hive_count"] == 33
    assert r["system"]["sun"]["name"] == "CSOAI"
    assert len(r["system"]["inner_tier"]) == 6
    assert len(r["system"]["middle_tier"]) == 12
    assert len(r["system"]["outer_tier"]) == 9
    assert len(r["system"]["frontier_tier"]) == 6


def test_solar_system_kepler():
    r = solar_system()
    # Earth (hive 3 at 1.0 AU) should have kepler check = 1.0
    edinburgh = [p for p in r["system"]["inner_tier"] if p["name"] == "Edinburgh"][0]
    assert edinburgh["distance_au"] == 1.0


def test_no_external_deps():
    import meok_sovereign_orbital_mcp as m
    src = open(m.__file__).read()
    assert "import ollama" not in src
    assert "import requests" not in src


def test_signed_outputs():
    for r in [hive_position(1), hive_orbital(1), hive_resonance(1, 2), sovereign_align(), solar_system()]:
        assert "kid" in r and "sig" in r and "ts" in r


def test_full_orbit():
    """Position at t=0 and t=period should be the same."""
    r1 = hive_position(3, 0.0)  # Edinburgh, period 1y
    r2 = hive_position(3, 1.0)
    # Should be back to same x (cos is periodic)
    assert abs(r1["position_au"][0] - r2["position_au"][0]) < 0.01


def test_tier_distribution():
    tier1 = [h for h in HIVES if h["tier"] == 1]
    tier2 = [h for h in HIVES if h["tier"] == 2]
    tier3 = [h for h in HIVES if h["tier"] == 3]
    tier4 = [h for h in HIVES if h["tier"] == 4]
    assert len(tier1) == 6
    assert len(tier2) == 12
    assert len(tier3) == 9
    assert len(tier4) == 6


def test_all_have_general():
    for h in HIVES:
        assert "general" in h
        assert h["general"] in ["Argus", "Scribe", "Shield", "Builder", "Abacus", "Lex", "Scale", "Crow", "Gear", "Voice", "Owl", "Dragon"]
