"""Test 9 — POST /api/cascade/route_query returns tier + cost.

The 4-tier cascade is::

    sov3 (King)        $0.10 / call     T4
    queen (council)    $0.04            T3
    small (3B)         $0.005           T2
    tiny (1B)          $0.001           T1

Contract::

    POST /api/cascade/route_query
    Body: {query: str}
    → 200 {tier: "T1"|"T2"|"T3"|"T4", cost_usd: float, ...}
"""
from __future__ import annotations

import httpx
import pytest

pytestmark = pytest.mark.api


def test_route_query_simple(require_backend):
    r = httpx.post(
        require_backend + "/api/cascade/route_query",
        json={"query": "What is the EU AI Act?"},
        timeout=5.0,
    )
    assert r.status_code == 200, f"got {r.status_code}: {r.text[:200]}"
    body = r.json()
    assert "tier" in body
    assert body["tier"] in ("T1", "T2", "T3", "T4"), f"unexpected tier: {body!r}"
    assert "cost" in body or "cost_usd" in body
    cost = body.get("cost", body.get("cost_usd"))
    assert isinstance(cost, (int, float)) and cost >= 0, f"cost invalid: {body!r}"
    assert cost <= 0.20, f"cost out of band: {cost}"


def test_route_query_complex_routes_to_higher_tier(require_backend):
    """A 'complex' sovereign-level query should land in T3 or T4."""
    r = httpx.post(
        require_backend + "/api/cascade/route_query",
        json={"query": "Compare EU AI Act Article 12 with NIST AI RMF for an enterprise compliance roadmap."},
        timeout=5.0,
    )
    assert r.status_code == 200
    body = r.json()
    assert body.get("tier") in ("T2", "T3", "T4"), f"unexpected tier for complex query: {body!r}"
