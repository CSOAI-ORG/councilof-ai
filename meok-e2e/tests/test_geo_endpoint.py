"""Test 11 — GET /api/geo returns UK/GB as the default region.

The backend must default to United Kingdom / GB when no IP is supplied.

Contract::

    GET /api/geo          → 200 {country: "GB", country_name: "United Kingdom", code: "UK", ...}
    GET /api/geo?ip=...   → 200 {country: <2-letter>, ...}
"""
from __future__ import annotations

import httpx
import pytest

pytestmark = pytest.mark.api


def test_geo_default_is_uk(require_backend):
    r = httpx.get(require_backend + "/api/geo", timeout=5.0)
    assert r.status_code == 200, f"got {r.status_code}: {r.text[:200]}"
    body = r.json()
    assert isinstance(body, dict)
    country = (body.get("country") or body.get("country_code") or "").upper()
    assert country == "GB", f"expected default country=GB, got {country!r}"


def test_geo_accepts_ip_param(require_backend):
    r = httpx.get(require_backend + "/api/geo", params={"ip": "8.8.8.8"}, timeout=5.0)
    assert r.status_code == 200
    body = r.json()
    # 8.8.8.8 is Google DNS in the US
    country = (body.get("country") or body.get("country_code") or "").upper()
    assert country == "US", f"expected US for 8.8.8.8, got {country!r} / {body!r}"
