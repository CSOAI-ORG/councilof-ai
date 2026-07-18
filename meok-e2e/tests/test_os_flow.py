"""Test 2 — OS flow: open the temple OS page, verify 11 temples, click EU.

The TEMPLES array in ``v2-temple-os.html`` (verified 2026-06-29) contains:

    EU, UK, US, CA, CN, JP, SG, UN, ISO, IEEE, CSOAI

= **11 temples**. They are rendered into ``#globe`` by ``renderTemples()``
which runs on load. Each temple element has ``class="temple <region>"`` and
an attribute ``data-code="<CODE>"``. Clicking calls ``openTemple(t)`` which
populates ``#templeOverlay`` with regulations + workflow nodes.
"""
from __future__ import annotations

import pytest

pytestmark = pytest.mark.ui

OS_PATH = "/csoai-os/v2-temple-os.html"

EXPECTED_TEMPLES = ["EU", "UK", "US", "CA", "CN", "JP", "SG", "UN", "ISO", "IEEE", "CSOAI"]


@pytest.fixture()
def os_page(page, base_url):
    page.goto(base_url + OS_PATH, wait_until="domcontentloaded")
    # wait for renderTemples() to finish (11 nodes attached to #globe)
    page.wait_for_function(
        f"document.querySelectorAll('#globe .temple').length === {len(EXPECTED_TEMPLES)}",
        timeout=15_000,
    )
    return page


def test_11_temples_rendered_on_globe(os_page):
    """All 11 temple divs must be present after page load."""
    temples = os_page.locator("#globe .temple")
    assert temples.count() == 11, f"expected 11 temples, got {temples.count()}"
    codes = [os_page.locator(f'#globe .temple[data-code="{c}"]').count() for c in EXPECTED_TEMPLES]
    assert all(c == 1 for c in codes), f"missing temples; counts={dict(zip(EXPECTED_TEMPLES, codes))}"
    # every temple is positioned somewhere on the globe (left/top > 0)
    positions = os_page.evaluate(
        "Array.from(document.querySelectorAll('#globe .temple')).map(e => ({l: e.style.left, t: e.style.top}))"
    )
    assert all(p["l"] and p["t"] for p in positions), f"temples without coords: {positions}"


def test_eu_temple_click_opens_regulations(os_page):
    """Clicking the EU temple must populate the overlay with EU AI Act data."""
    os_page.click('#globe .temple[data-code="EU"]')
    os_page.wait_for_selector("#templeOverlay.open", timeout=5_000)
    title = os_page.locator("#overlayTitle").text_content() or ""
    region = os_page.locator("#overlayRegion").text_content() or ""
    assert "European Union" in title or "EU" in title, f"unexpected title: {title!r}"
    assert "(EU)" in region

    # The overlay body must mention at least the EU AI Act regulation
    body_text = os_page.locator("#overlayBody").text_content() or ""
    assert "EU AI Act" in body_text, f"EU AI Act not in overlay: {body_text[:200]!r}"
    # And regulations should show with the .reg-item class
    n_reg = os_page.locator("#overlayBody .reg-item").count()
    assert n_reg >= 1, f"expected ≥1 .reg-item, got {n_reg}"
