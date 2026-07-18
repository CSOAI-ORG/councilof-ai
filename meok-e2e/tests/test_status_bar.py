"""Test 6 — status bar.

The ``.status-bar`` element at the top of every page is populated by
``pollStatus()`` which fetches ``/api/backend/status`` every 10s. We stub the
endpoint so we can assert *contractually what should be there* instead of
waiting on a real backend:

* a green-light pill reading "SOV3" + "online"
* "13/13 council" or similar — the whole 12-Queen + King council
"""
from __future__ import annotations

import json

import pytest

pytestmark = pytest.mark.ui


@pytest.fixture()
def stub_backend_status(page):
    def handler(route):
        route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps({
                "status": "online",
                "sovereign": {"online": True, "version": "SOV3-3.0.0"},
                "council": {"online": 13, "total": 13},
                "ichar_count": 12_345,
                "regions": 11,
                "tier": "T4-king",
            }),
        )

    page.route("**/api/backend/status", handler)
    return handler


def test_status_bar_shows_sov3_online(page, base_url, stub_backend_status):
    page.goto(base_url + "/csoai-os/v2-temple-os.html", wait_until="domcontentloaded")
    # pollStatus must have populated .status-bar after network round-trip
    page.wait_for_function(
        "document.querySelector('.status-bar')?.textContent?.includes('SOV3')",
        timeout=10_000,
    )
    bar = page.locator(".status-bar").first
    text = (bar.text_content() or "").lower()
    assert "sov3" in text, f"SOV3 not in status bar: {text!r}"
    assert "online" in text, f"online not in status bar: {text!r}"


def test_status_bar_shows_council_count(page, base_url, stub_backend_status):
    page.goto(base_url + "/csoai-os/v2-temple-os.html", wait_until="domcontentloaded")
    page.wait_for_function(
        "document.querySelector('.status-bar')?.textContent?.match(/(\\d+)\\/13/)",
        timeout=10_000,
    )
    text = (page.locator(".status-bar").first.text_content() or "")
    # The stub returns 13/13, but the contract says ANY number over total 13 is acceptable
    # as long as the "/" + "13" pattern appears.
    import re
    assert re.search(r"\d+\s*/\s*13", text), f"no N/13 council pattern in: {text!r}"


def test_status_bar_on_home(page, base_url, stub_backend_status):
    """Same bar must render on the home index page."""
    page.goto(base_url + "/csoai-os/meok-home/index.html", wait_until="domcontentloaded")
    page.wait_for_function(
        "document.querySelector('.status-bar')?.textContent?.length > 4",
        timeout=10_000,
    )
    bar = page.locator(".status-bar").first
    text = bar.text_content() or ""
    assert "SOV3" in text, f"SOV3 not in home status bar: {text!r}"
    assert "/" in text, "expected a fraction display (council count)"
