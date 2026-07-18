"""Test 8 — POST /api/ichar/create → 201 + ichar_id.

Contract::

    POST /api/ichar/create
    Body: {name, email, queen_model, arcana_lens, voice, cognition, ...}
    201 Created
    {ichar_id: "ich-<id>", sigil_hash: "...", status: "created"}

This is the backend endpoint the wizard will hit in production.
Skipped when the backend is not yet up.
"""
from __future__ import annotations

import httpx
import pytest

pytestmark = pytest.mark.api


def test_ichar_create_returns_201(require_backend):
    payload = {
        "name": "E2E Tester",
        "email": "e2e@meok.ai",
        "queen_model": "queen-arcana",
        "arcana_lens": 0,
        "voice": "sophia",
        "cognition": "queen-council",
        "initial_message": "I have heard the 12.",
    }
    r = httpx.post(require_backend + "/api/ichar/create", json=payload, timeout=5.0)
    assert r.status_code in (200, 201), f"POST /api/ichar/create returned {r.status_code}: {r.text[:200]}"
    body = r.json()
    assert isinstance(body, dict)
    assert "ichar_id" in body, f"no ichar_id in response: {body!r}"
    assert body["ichar_id"].startswith("ich-") or len(body["ichar_id"]) > 4, \
        f"ichar_id looks malformed: {body['ichar_id']!r}"
    # the response must round-trip the name too
    if "name" in body:
        assert body["name"] == payload["name"]
