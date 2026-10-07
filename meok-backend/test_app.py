"""
MEOK OS Backend — pytest test suite.

Hits every endpoint in app.py. Uses TestClient with a temporary
SQLite + sigil chain so the tests don't touch the real on-disk store.

Run:  pytest -q
"""

from __future__ import annotations

import os
import sys
import tempfile
from pathlib import Path

# Use temp paths before importing the app so its module-level init
# picks them up.
_tmp = tempfile.mkdtemp(prefix="meok-backend-tests-")
os.environ["MEOK_ICHARS_DB"] = str(Path(_tmp) / "ichars.db")
os.environ["MEOK_USERS_DB"] = str(Path(_tmp) / "users.db")
os.environ["MEOK_SIGIL_LOG"] = str(Path(_tmp) / "sigil_chain.jsonl")

# Make app.py importable.
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import pytest
from fastapi.testclient import TestClient

import app as app_module
from app import app


@pytest.fixture()
def client():
    return TestClient(app)


# --------------------------------------------------------------------------- #
# 1. /api/backend/status
# --------------------------------------------------------------------------- #
def test_backend_status_shape(client):
    r = client.get("/api/backend/status")
    assert r.status_code == 200
    data = r.json()
    expected = {
        "healthy", "sov3_version", "hive", "council", "bft_quorum",
        "last_sigil", "big_braim", "mcps", "dorado", "x402",
        "eu_ai_act", "ichar",
    }
    assert expected <= set(data.keys())
    assert data["healthy"] is True
    assert data["sov3_version"] == "v2.0.0"
    assert data["hive"] == "34/34"
    assert data["council"] == "13/13"
    assert data["bft_quorum"] == "9/13"
    assert data["big_braim"] == "1.39 TB"
    assert data["mcps"] == 218
    assert data["dorado"] == "west <-> east"
    assert data["x402"] == "ready"
    assert data["eu_ai_act"] == "T-37"
    assert data["ichar"] == "ready"
    assert isinstance(data["last_sigil"], str)
    assert len(data["last_sigil"]) >= 4


# --------------------------------------------------------------------------- #
# 2-6. ichars
# --------------------------------------------------------------------------- #
def test_ichar_create_get_evolve_absorb_user_list(client):
    # create
    body = {
        "user_id": "usr-test-001",
        "name": "Tester Twin",
        "queen_model": "marcus",
        "arcana_lens": 0,
        "voice": "warm",
        "cognition": "balanced",
        "initial_message": "I am the tester twin.",
    }
    r = client.post("/api/ichar/create", json=body)
    assert r.status_code == 200, r.text
    created = r.json()
    assert "ichar_id" in created
    assert "sigil_hash" in created
    ichar_id = created["ichar_id"]

    # get
    r = client.get(f"/api/ichar/{ichar_id}")
    assert r.status_code == 200
    g = r.json()
    assert g["ichar_id"] == ichar_id
    assert g["user_id"] == "usr-test-001"
    assert g["name"] == "Tester Twin"
    assert g["queen_model"] == "marcus"
    assert g["arcana_lens"] == 0
    assert g["interactions"] == 0
    # extra fields are flattened in
    assert g["archetype"] == "Strategist"
    assert "motto" in g

    # evolve
    r = client.post(
        f"/api/ichar/{ichar_id}/evolve", json={"message": "Hello there."}
    )
    assert r.status_code == 200
    e = r.json()
    assert e["interactions"] == 1

    # absorb
    r = client.post(
        f"/api/ichar/{ichar_id}/absorb",
        json={"hive_gcp_vm": "meok-backend-vm-7"},
    )
    assert r.status_code == 200
    a = r.json()
    assert a["absorbed"] is True
    assert a["absorbed_hive"] == "meok-backend-vm-7"

    # list for user
    r = client.get("/api/ichar/user/usr-test-001")
    assert r.status_code == 200
    ulist = r.json()
    assert ulist["count"] >= 1
    assert any(i["ichar_id"] == ichar_id for i in ulist["ichars"])


def test_ichar_get_404(client):
    r = client.get("/api/ichar/ich-doesnotexist")
    assert r.status_code == 404
    assert "not found" in str(r.json()).lower()


# --------------------------------------------------------------------------- #
# 6b. /api/ichar/{ichar_id}/avatar — SVG avatar endpoint
# --------------------------------------------------------------------------- #
def test_avatar_returns_svg_for_existing_ichar(client):
    """Create an ichar then fetch its avatar SVG."""
    body = {
        "user_id": "usr-avatar-001",
        "name": "Ava Test",
        "queen_model": "marcus",      # resolves to Strategist (#2a5a3a, ♟️)
        "arcana_lens": 7,
    }
    r = client.post("/api/ichar/create", json=body)
    assert r.status_code == 200, r.text
    ichar_id = r.json()["ichar_id"]

    r = client.get(f"/api/ichar/{ichar_id}/avatar")
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("image/svg+xml")
    svg = r.content.decode("utf-8")
    # XML namespace + spec'd viewBox
    assert svg.startswith("<svg")
    assert 'xmlns="http://www.w3.org/2000/svg"' in svg
    assert 'viewBox="0 0 200 300"' in svg
    assert 'preserveAspectRatio="xMidYMid meet"' in svg
    # Golden core gradient present
    assert "#ffd700" in svg
    # The Strategist archetype color is dark green (#2a5a3a)
    assert "#2a5a3a" in svg.lower() or "#2A5A3A" in svg
    # Strategist glyph = chess pawn (♟)
    assert "♟" in svg
    # Name label is XML-escaped (no < > & in text node)
    assert "Ava Test" in svg
    # a11y: role + aria-label
    assert 'role="img"' in svg
    assert "aria-label" in svg
    # Cache + identity headers
    assert "immutable" in r.headers["cache-control"].lower()
    assert r.headers["x-ichar-id"] == ichar_id
    assert r.headers["x-ichar-archetype"] == "Strategist"


def test_avatar_404_returns_placeholder_svg(client):
    """Unknown ichar returns a 404 SVG placeholder so the front-end never blanks."""
    r = client.get("/api/ichar/ich-does-not-exist/avatar")
    assert r.status_code == 404
    assert r.headers["content-type"].startswith("image/svg+xml")
    svg = r.content.decode("utf-8")
    assert svg.startswith("<svg")
    assert 'viewBox="0 0 200 300"' in svg
    assert "not found" in svg.lower()


def test_avatar_size_param_scales(client):
    """?size=512 produces width=512, height=768 (200×300 ratio preserved)."""
    body = {
        "user_id": "usr-avatar-002",
        "name": "Scale",
        "queen_model": "athena",      # sage
        "arcana_lens": 0,
    }
    r = client.post("/api/ichar/create", json=body)
    ichar_id = r.json()["ichar_id"]

    r = client.get(f"/api/ichar/{ichar_id}/avatar?size=512")
    assert r.status_code == 200
    svg = r.content.decode("utf-8")
    assert 'width="512"' in svg
    assert 'height="768"' in svg          # 512 × 300/200
    assert r.headers["x-ichar-archetype"] == "Sage"
    assert "🦉" in svg                    # sage emoji


def test_avatar_size_clamped_above_max(client):
    """Sizes >1024 are clamped to 1024 (defends against render-bomb DoS)."""
    body = {
        "user_id": "usr-avatar-003",
        "name": "Clamp",
        "queen_model": "hildegard",     # companion
        "arcana_lens": 0,
    }
    r = client.post("/api/ichar/create", json=body)
    ichar_id = r.json()["ichar_id"]

    r = client.get(f"/api/ichar/{ichar_id}/avatar?size=99999")
    assert r.status_code == 200
    svg = r.content.decode("utf-8")
    assert 'width="1024"' in svg
    assert 'height="1536"' in svg


def test_avatar_size_clamped_below_min(client):
    """Sizes <32 are clamped to 32."""
    body = {
        "user_id": "usr-avatar-004",
        "name": "Tiny",
        "queen_model": "wangari",        # guardian
        "arcana_lens": 0,
    }
    r = client.post("/api/ichar/create", json=body)
    ichar_id = r.json()["ichar_id"]

    r = client.get(f"/api/ichar/{ichar_id}/avatar?size=1")
    assert r.status_code == 200
    svg = r.content.decode("utf-8")
    assert 'width="32"' in svg
    assert 'height="48"' in svg           # 32 × 300/200


def test_avatar_size_invalid_uses_default(client):
    """Garbage ?size= values fall back to 256 (no 500)."""
    body = {
        "user_id": "usr-avatar-005",
        "name": "Default",
        "queen_model": "leonardo",       # creator
        "arcana_lens": 0,
    }
    r = client.post("/api/ichar/create", json=body)
    ichar_id = r.json()["ichar_id"]

    r = client.get(f"/api/ichar/{ichar_id}/avatar?size=abc")
    assert r.status_code == 200
    svg = r.content.decode("utf-8")
    assert 'width="256"' in svg
    assert 'height="384"' in svg          # 256 × 300/200
    assert r.headers["x-ichar-archetype"] == "Creator"


def test_avatar_emoji_per_archetype(client):
    """Each archetype picks its correct emoji glyph (the 7 spec'd ones)."""
    mapping = [
        ("marcus", "Strategist", "♟"),    # queen_model → resolved archetype → emoji
        ("athena", "Sage", "🦉"),
        ("scout",  "Scout", "🧭"),
    ]
    for queen, archetype, emoji in mapping:
        body = {
            "user_id": f"usr-{queen}",
            "name": f"x-{queen}",
            "queen_model": queen,
            "arcana_lens": 0,
        }
        r = client.post("/api/ichar/create", json=body)
        assert r.status_code == 200, r.text
        ichar_id = r.json()["ichar_id"]
        r = client.get(f"/api/ichar/{ichar_id}/avatar")
        assert r.status_code == 200
        svg = r.content.decode("utf-8")
        assert r.headers["x-ichar-archetype"] == archetype
        assert emoji in svg, f"missing {emoji} for {archetype}"


def test_avatar_archetype_colors_present(client):
    """Every archetype color appears in the SVG (egg shell + stroke)."""
    body = {
        "user_id": "usr-color-001",
        "name": "Color Test",
        "queen_model": "scout",          # scout → coral #d47a5a
        "arcana_lens": 0,
    }
    r = client.post("/api/ichar/create", json=body)
    assert r.status_code == 200, r.text
    ichar_id = r.json()["ichar_id"]
    r = client.get(f"/api/ichar/{ichar_id}/avatar")
    assert r.status_code == 200
    svg = r.content.decode("utf-8")
    assert r.headers["x-ichar-archetype"] == "Scout"
    assert "#d47a5a" in svg.lower()
    assert "🧭" in svg


def test_avatar_safe_against_xss_in_name(client):
    """XSS attempt in name is XML-escaped (not rendered as markup)."""
    body = {
        "user_id": "usr-xss-001",
        "name": "<script>alert(1)</script>",
        "queen_model": "hatshepsut",    # sage
        "arcana_lens": 0,
    }
    r = client.post("/api/ichar/create", json=body)
    ichar_id = r.json()["ichar_id"]
    r = client.get(f"/api/ichar/{ichar_id}/avatar")
    svg = r.content.decode("utf-8")
    assert "<script>" not in svg
    assert "&lt;script&gt;" in svg


def test_avatar_logs_to_sigil_chain(client):
    """Fetching the avatar emits a SIGIL entry ('V' op)."""
    body = {
        "user_id": "usr-sigil-001",
        "name": "Sigil",
        "queen_model": "rumi",           # companion
        "arcana_lens": 0,
    }
    r = client.post("/api/ichar/create", json=body)
    ichar_id = r.json()["ichar_id"]

    chain_before = client.get("/api/sigl/chain").json()["length"]
    client.get(f"/api/ichar/{ichar_id}/avatar")
    chain_after = client.get("/api/sigl/chain").json()["length"]
    assert chain_after > chain_before


def test_ichar_create_invalid_queen(client):
    r = client.post(
        "/api/ichar/create",
        json={
            "user_id": "u1", "name": "x", "queen_model": "no-such-queen",
            "arcana_lens": 0,
        },
    )
    assert r.status_code == 400


def test_ichar_create_invalid_arcana(client):
    r = client.post(
        "/api/ichar/create",
        json={
            "user_id": "u1", "name": "x", "queen_model": "marcus",
            "arcana_lens": 99,
        },
    )
    assert r.status_code == 422  # pydantic validation


# --------------------------------------------------------------------------- #
# 7. /api/geo
# --------------------------------------------------------------------------- #
def test_geo_localhost_is_uk(client):
    r = client.get("/api/geo")
    assert r.status_code == 200
    g = r.json()
    assert g["country_code"] == "GB"
    assert g["country"] == "GB"  # changed to 2-letter per e2e test contract
    assert g["country_full"] == "United Kingdom"
    assert g["country_name"] == "United Kingdom"
    assert g["city"] == "London"
    assert g["eu"] is False
    assert g["sovereign_region"] == "UK"


# --------------------------------------------------------------------------- #
# 8. /api/cascade/route_query
# --------------------------------------------------------------------------- #
def test_cascade_tier1_short_query(client):
    r = client.post(
        "/api/cascade/route_query",
        json={"query": "hi", "config": {}, "task_type": "chat"},
    )
    assert r.status_code == 200
    c = r.json()
    assert c["tier_num"] == 1
    assert "tier_name" in c
    assert "model" in c
    assert 0.0 <= c["confidence"] <= 1.0
    assert c["cost_usd"] >= 0
    assert "sigil_hash" in c
    assert c["response"]


def test_cascade_tier3_code(client):
    r = client.post(
        "/api/cascade/route_query",
        json={"query": "x" * 700, "config": {}, "task_type": "code"},
    )
    assert r.status_code == 200
    assert r.json()["tier_num"] == 3


def test_cascade_tier4_audit(client):
    r = client.post(
        "/api/cascade/route_query",
        json={"query": "x" * 2000, "config": {}, "task_type": "audit"},
    )
    assert r.status_code == 200
    assert r.json()["tier_num"] == 4


def test_cascade_force_tier(client):
    r = client.post(
        "/api/cascade/route_query",
        json={"query": "tiny", "config": {"force_tier": 2}, "task_type": "chat"},
    )
    assert r.status_code == 200
    assert r.json()["tier_num"] == 2


# --------------------------------------------------------------------------- #
# 9. /api/sigil/verify
# --------------------------------------------------------------------------- #
def test_sigil_verify_known_and_unknown(client):
    # first pull a known hash from /api/sigl/chain
    r = client.get("/api/sigl/chain")
    assert r.status_code == 200
    entries = r.json()["entries"]
    assert entries
    known = entries[0]["hash"]

    r = client.post("/api/sigil/verify", json={"hash": known})
    assert r.status_code == 200
    v = r.json()
    assert v["verified"] is True
    assert v["block"]["hash"] == known

    r = client.post("/api/sigil/verify", json={"hash": "deadbeef0000"})
    assert r.status_code == 200
    assert r.json()["verified"] is False


# --------------------------------------------------------------------------- #
# 10-11. auth
# --------------------------------------------------------------------------- #
def test_auth_signup_login_flow(client):
    email = "Tester@MEOK.AI"
    pw = "sovereign-2026"
    r = client.post(
        "/api/auth/signup",
        json={"email": email, "password": pw, "name": "Tester"},
    )
    assert r.status_code == 200, r.text
    s = r.json()
    assert s["user_id"].startswith("usr-")
    assert s["email"] == email.lower()
    assert s["token"]
    user_id = s["user_id"]

    r = client.post(
        "/api/auth/login", json={"email": email, "password": pw}
    )
    assert r.status_code == 200
    l = r.json()
    assert l["user_id"] == user_id
    assert l["token"]


def test_auth_signup_duplicate_returns_409(client):
    body = {"email": "dup@meok.ai", "password": "abcdef"}
    r1 = client.post("/api/auth/signup", json=body)
    assert r1.status_code == 200
    r2 = client.post("/api/auth/signup", json=body)
    assert r2.status_code == 409


def test_auth_login_wrong_password(client):
    client.post(
        "/api/auth/signup",
        json={"email": "wrong@meok.ai", "password": "goodpass"},
    )
    r = client.post(
        "/api/auth/login",
        json={"email": "wrong@meok.ai", "password": "badpass"},
    )
    assert r.status_code == 401


def test_auth_signup_invalid_email(client):
    r = client.post(
        "/api/auth/signup",
        json={"email": "noatsign", "password": "goodpass"},
    )
    assert r.status_code == 400


def test_auth_signup_short_password(client):
    r = client.post(
        "/api/auth/signup",
        json={"email": "x@x.com", "password": "abc"},
    )
    assert r.status_code == 400


# --------------------------------------------------------------------------- #
# 12. /api/council/{queen_id}
# --------------------------------------------------------------------------- #
def test_council_known_and_unknown(client):
    for qid in ("marcus", "scout", "athena"):
        r = client.get(f"/api/council/{qid}")
        assert r.status_code == 200
        c = r.json()
        assert c["council_size"] == 13
        assert c["bft_quorum"] == 9
        assert c["queen"]["queen_id"] == qid
    r = client.get("/api/council/who-dat")
    assert r.status_code == 404


# --------------------------------------------------------------------------- #
# 13-14. temples
# --------------------------------------------------------------------------- #
def test_temples_list(client):
    r = client.get("/api/temples")
    assert r.status_code == 200
    t = r.json()
    assert t["count"] == 11
    codes = {x["code"] for x in t["temples"]}
    assert "UK" in codes and "EU" in codes and "US" in codes


def test_temple_get(client):
    r = client.get("/api/temple/uk")
    assert r.status_code == 200
    assert r.json()["code"] == "UK"
    r = client.get("/api/temple/zz")
    assert r.status_code == 404


# --------------------------------------------------------------------------- #
# 15. mcp list
# --------------------------------------------------------------------------- #
def test_mcp_list_count_and_shape(client):
    r = client.get("/api/mcp/list")
    assert r.status_code == 200
    d = r.json()
    assert d["count"] == 218
    sample = d["mcps"][0]
    assert {"name", "domain", "version", "tools", "transport", "sigil"} <= set(sample.keys())


# --------------------------------------------------------------------------- #
# 16. sigil chain
# --------------------------------------------------------------------------- #
def test_sigl_chain_shape(client):
    r = client.get("/api/sigl/chain")
    assert r.status_code == 200
    d = r.json()
    assert d["length"] >= 10
    assert len(d["entries"]) == 10
    for e in d["entries"]:
        assert {"op", "ts", "nonce", "prev", "hash", "fields"} <= set(e.keys())


# --------------------------------------------------------------------------- #
# 17-18. sov3 tools + invoke
# --------------------------------------------------------------------------- #
def test_sov3_tools_count(client):
    r = client.get("/api/sov3/tools")
    assert r.status_code == 200
    d = r.json()
    assert d["count"] == 222
    assert len(d["tools"]) == 222


def test_sov3_invoke_known_and_unknown(client):
    r = client.post(
        "/api/sov3/invoke",
        json={"tool": "sov_route_query", "args": {"q": "hi"}},
    )
    assert r.status_code == 200
    inv = r.json()
    assert inv["tool"] == "sov_route_query"
    assert inv["ok"] is True
    assert inv["sigil_hash"]

    r = client.post(
        "/api/sov3/invoke",
        json={"tool": "no_such_tool", "args": {}},
    )
    assert r.status_code == 404


# --------------------------------------------------------------------------- #
# 19. news
# --------------------------------------------------------------------------- #
def test_news_count(client):
    r = client.get("/api/news")
    assert r.status_code == 200
    d = r.json()
    assert d["count"] == 6
    assert all({"id", "ts", "headline", "category", "priority"} <= set(n.keys())
               for n in d["items"])


# --------------------------------------------------------------------------- #
# 20. temple-os bundle
# --------------------------------------------------------------------------- #
def test_temple_os_bundle(client):
    r = client.get("/api/temple-os/bundle")
    assert r.status_code == 200
    b = r.json()
    assert b["status"]["healthy"] is True
    assert b["mcp_count"] == 218
    assert b["sov3_tool_count"] == 222
    assert len(b["temples"]) == 11
    assert len(b["queens"]) == 26
    assert len(b["arcana"]) == 22
    assert b["news"]["count"] == 6
    assert b["sigil_length"] >= 10


# --------------------------------------------------------------------------- #
# CORS / health
# --------------------------------------------------------------------------- #
def test_cors_preflight(client):
    r = client.options(
        "/api/backend/status",
        headers={
            "Origin": "https://meok.ai",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert r.status_code in (200, 204)
    assert r.headers.get("access-control-allow-origin") in ("*", "https://meok.ai")


def test_healthz(client):
    r = client.get("/api/healthz")
    assert r.status_code == 200
    assert r.json()["ok"] is True
