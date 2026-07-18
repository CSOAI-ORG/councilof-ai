"""Tests for the i-character (digital twin) creation system."""
import sys
import os
import json
import pytest
from pathlib import Path

sys.path.insert(0, os.path.dirname(__file__))

from ichar import (
    QUEEN_ARCHETYPES, ARCANA_LENSES,
    create_ichar, get_ichar, get_ichars_for_user, evolve_ichar,
    absorb_into_csoai_hive,
    get_geo_from_ip, signup_user,
    ICHARS_PATH,
)


@pytest.fixture(autouse=True)
def clean_ichars_file():
    """Reset the JSONL file before each test."""
    if ICHARS_PATH.exists():
        ICHARS_PATH.unlink()
    ICHARS_PATH.touch()
    yield
    if ICHARS_PATH.exists():
        ICHARS_PATH.unlink()


# ─── Queen archetype tests ───

def test_13_queen_archetypes():
    """The system must have all 13 archetypes (12 queens + 1 king)."""
    assert len(QUEEN_ARCHETYPES) == 13
    # Spot check the king + 2 veto queens
    assert "queen-king" in QUEEN_ARCHETYPES
    assert "queen-care" in QUEEN_ARCHETYPES
    assert "queen-watch" in QUEEN_ARCHETYPES


def test_queen_archetype_fields():
    """Each queen must have name, archetype, motto, color, traits, best_for."""
    required = {"name", "archetype", "motto", "color", "personality_traits", "best_for"}
    for slug, queen in QUEEN_ARCHETYPES.items():
        missing = required - set(queen.keys())
        assert not missing, f"{slug} missing {missing}"
        assert len(queen["personality_traits"]) >= 3
        assert queen["motto"]


def test_22_arcana_lenses():
    """All 22 Major Arcana must be present (0-21)."""
    assert len(ARCANA_LENSES) == 22
    for i in range(22):
        assert i in ARCANA_LENSES


# ─── i-character creation tests ───

def test_create_ichar_minimal():
    """Minimal create with just required fields."""
    r = create_ichar(
        user_id="u1",
        name="Test User",
        queen_model="queen-king",
        arcana_lens=0,
    )
    assert "ichar_id" in r
    assert r["ichar_id"].startswith("ich-")
    assert r["user_id"] == "u1"
    assert r["name"] == "Test User"
    assert r["queen_model"] == "queen-king"
    assert r["arcana_lens"]["number"] == 0
    assert r["arcana_lens"]["name"] == "The Fool"
    assert r["sigil_hash"]
    assert len(r["sigil_hash"]) == 16


def test_create_ichar_with_initial_message():
    """i-character can have a custom initial message."""
    r = create_ichar(
        user_id="u2",
        name="Nick",
        queen_model="queen-strategy",
        arcana_lens=4,
        initial_message="The empire has chosen.",
    )
    assert r["initial_message"] == "The empire has chosen."
    assert r["queen_model"] == "queen-strategy"
    assert r["arcana_lens"]["name"] == "The Emperor"


def test_create_ichar_rejects_invalid_queen():
    r = create_ichar("u3", "X", "queen-bogus", 0)
    assert r["error"] == "invalid_queen_model"
    assert "queen-king" in r["valid"]


def test_create_ichar_rejects_invalid_arcana():
    r = create_ichar("u3", "X", "queen-king", 99)
    assert r["error"] == "invalid_arcana_lens"


def test_create_ichar_rejects_empty_name():
    r = create_ichar("u4", "", "queen-king", 0)
    assert r["error"] == "empty_name"
    r2 = create_ichar("u5", "   ", "queen-king", 0)
    assert r2["error"] == "empty_name"


def test_create_ichar_persists_to_file():
    """Created i-characters are written to the JSONL file."""
    create_ichar("u6", "Persist Test", "queen-care", 5)
    assert ICHARS_PATH.exists()
    lines = ICHARS_PATH.read_text().strip().split("\n")
    assert len(lines) == 1
    parsed = json.loads(lines[0])
    assert parsed["user_id"] == "u6"


def test_get_ichar_retrieves():
    """get_ichar should return the same data that was created."""
    created = create_ichar("u7", "Get Test", "queen-arcana", 0)
    fetched = get_ichar(created["ichar_id"])
    assert fetched["ichar_id"] == created["ichar_id"]
    assert fetched["name"] == "Get Test"


def test_get_ichar_not_found():
    r = get_ichar("ich-nonexistent")
    assert r["error"] == "not_found"


def test_get_ichars_for_user():
    """A user can have multiple i-characters."""
    create_ichar("u8", "Work Nick", "queen-king", 21)
    create_ichar("u8", "Personal Nick", "queen-arcana", 0)
    ichars = get_ichars_for_user("u8")
    assert len(ichars) == 2
    names = {i["name"] for i in ichars}
    assert names == {"Work Nick", "Personal Nick"}


def test_evolve_ichar_increments_counter():
    """evolve_ichar should increment the interactions counter."""
    created = create_ichar("u9", "E", "queen-watch", 16)
    assert created["interactions"] == 0
    evolved = evolve_ichar(created["ichar_id"], "hello")
    assert evolved["interactions"] == 1
    evolved2 = evolve_ichar(created["ichar_id"], "world")
    assert evolved2["interactions"] == 2


def test_absorb_into_csoai_hive():
    """Absorbing an i-character should mark it as a persistent SOV3 agent."""
    created = create_ichar("u10", "Absorbable", "queen-bridge", 6)
    absorbed = absorb_into_csoai_hive(created["ichar_id"], "meok-master")
    assert "absorbed_into" in absorbed
    assert absorbed["absorbed_into"]["hive_vm"] == "meok-master"
    assert absorbed["absorbed_into"]["status"] == "persistent_sov3_agent"
    assert "absorbed_at" in absorbed["absorbed_into"]


# ─── Geo / IP detection tests ───

def test_geo_localhost_is_uk():
    """Localhost should resolve to UK (mocked)."""
    g = get_geo_from_ip("127.0.0.1")
    assert g["code"] == "UK"
    assert g["region"] == "eu"
    assert g["name"] == "United Kingdom"
    assert g["flag"] == "🇬🇧"


def test_geo_google_dns_is_us():
    """Google DNS (8.8.8.8) should resolve to US."""
    g = get_geo_from_ip("8.8.8.8")
    assert g["code"] == "US"
    assert g["region"] == "us"


def test_geo_meok_backend():
    """The meok-backend GCP VM IP should resolve to UK."""
    g = get_geo_from_ip("35.242.143.249")
    assert g["code"] == "UK"


def test_geo_unknown_ip_defaults_to_uk():
    """Unknown IPs default to UK (in production: real IP API call)."""
    g = get_geo_from_ip("1.2.3.4")
    assert g["code"] == "UK"


def test_geo_includes_xy_for_globe():
    """The geo result must include x/y coords (for globe placement)."""
    g = get_geo_from_ip("127.0.0.1")
    assert "x" in g
    assert "y" in g
    assert 0 <= g["x"] <= 100
    assert 0 <= g["y"] <= 100


# ─── Full signup flow tests ───

def test_signup_full_flow():
    """The full signup: detect IP + create i-character + return bundle."""
    r = signup_user(
        user_id="nick-001",
        email="nick@meok.ai",
        name="Sovereign Nick",
        queen_model="queen-king",
        arcana_lens=21,
        detected_ip="127.0.0.1",
    )
    assert r["user_id"] == "nick-001"
    assert r["email"] == "nick@meok.ai"
    assert r["region"]["code"] == "UK"
    assert r["ichar"]["name"] == "Sovereign Nick"
    assert r["ichar"]["queen_model"] == "queen-king"
    assert r["ichar"]["arcana_lens"]["name"] == "The World"
    assert len(r["next_steps"]) >= 4


def test_signup_rejects_invalid_queen():
    """A bad queen model in signup should return the error."""
    r = signup_user(
        user_id="bad", email="x@x.com", name="X",
        queen_model="queen-bogus", arcana_lens=0,
    )
    assert "error" in r


if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-v"]))