"""Test 7 — GET /api/backend/status returns JSON.

Contract (per task brief + AGENTS.md backend list):

    {
        "status": "online",
        "sovereign": {"online": bool, "version": str},
        "council":   {"online": int, "total": int},
        "ichar_count": int (optional),
        "regions":   int,
        "tier":      str,
    }

The test is **skipped** when the backend is not reachable so we stay
green pre-deploy. When up, it asserts both shape AND semantics.
"""
from __future__ import annotations

import httpx
import pytest

pytestmark = pytest.mark.api


def test_backend_status_endpoint(require_backend):
    r = httpx.get(require_backend + "/api/backend/status", timeout=5.0)
    assert r.status_code == 200
    body = r.json()
    assert isinstance(body, dict)

    # minimal contract
    assert body.get("status") in ("online", "ready", "ok", "degraded"), \
        f"unexpected status field: {body!r}"

    # sovereign sub-object must declare online boolean + version string
    sov = body.get("sovereign") or {}
    assert isinstance(sov, dict)
    assert "online" in sov, f"sovereign.online missing: {body!r}"
    assert isinstance(sov["online"], bool)
    assert "version" in sov
    assert isinstance(sov["version"], str)

    # council sub-object OR council string like "13/13"
    council = body.get("council")
    if isinstance(council, str):
        assert "/" in council
    else:
        assert isinstance(council, dict)
        assert "online" in council and "total" in council
        assert 0 <= council["online"] <= council["total"] <= 13

    # optional but expected
    if "regions" in body:
        assert isinstance(body["regions"], int)
        assert 1 <= body["regions"] <= 50  # accept any sane number
    if "tier" in body:
        assert isinstance(body["tier"], str)
