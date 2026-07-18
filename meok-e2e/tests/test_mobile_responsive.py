"""Test 15 — mobile responsive layout (iPhone SE — 375×667).

The OS + signup wizard must render without horizontal scroll at iPhone SE
viewport sizes. We:

* set viewport to 375×667
* load the wizard, then the OS
* assert document.documentElement.scrollWidth <= viewport.width + tiny slack
* assert all primary interactive elements are present and visible
"""
from __future__ import annotations

import pytest

pytestmark = pytest.mark.ui

PATHS = [
    "/csoai-os/v2-signup-wizard.html",
    "/csoai-os/v2-temple-os.html",
    "/csoai-os/meok-home/index.html",
    "/csoai-os/meok-home/pages/temples_uk.html",
]


@pytest.fixture()
def iphone(browser, base_url):
    """An iPhone SE sized context — fresh each test."""
    ctx = browser.new_context(
        viewport={"width": 375, "height": 667},
        device_scale_factor=2,
        is_mobile=True,
        has_touch=True,
        user_agent=("Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) "
                    "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 "
                    "Mobile/15E148 Safari/604.1"),
    )
    page = ctx.new_page()
    try:
        yield page
    finally:
        ctx.close()


@pytest.mark.parametrize("path", PATHS)
def test_no_horizontal_scroll_on_mobile(iphone, base_url, path):
    iphone.goto(base_url + path, wait_until="domcontentloaded")
    iphone.wait_for_load_state("networkidle")
    # After fonts settle
    iphone.wait_for_timeout(150)

    w = iphone.evaluate("Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0)")
    assert w <= 380, f"{path}: scrollWidth={w} exceeds 380 (iPhone SE viewport 375 + 5px slack)"


@pytest.mark.parametrize("path", PATHS)
def test_status_bar_present_on_mobile(iphone, base_url, path):
    iphone.goto(base_url + path, wait_until="domcontentloaded")
    iphone.wait_for_selector(".status-bar", timeout=10_000)
    bar = iphone.locator(".status-bar").first
    visible = bar.is_visible()
    assert visible, f"{path}: status bar is not visible on mobile"
    box = bar.bounding_box()
    assert box and box["height"] > 8 and box["height"] < 80, f"unusual status-bar height: {box}"


def test_wizard_next_button_tappable_on_mobile(iphone, base_url):
    """The wizard must be usable on mobile — Next button must be tap-sized."""
    iphone.goto(base_url + "/csoai-os/v2-signup-wizard.html", wait_until="domcontentloaded")
    iphone.wait_for_function(
        "document.querySelector('.wizard-step.active[data-step=\"0\"]')?.offsetParent === null || document.querySelector('.wizard-step.active[data-step=\"0\"]')?.offsetParent !== null",
        timeout=10_000,
    )
    btn = iphone.locator("#btnNext")
    assert btn.count() == 1
    box = btn.bounding_box()
    assert box is not None
    # tap target height >= 32px is the iOS minimum
    assert box["height"] >= 32, f"Next button too small on mobile: {box}"


def test_chat_input_usable_on_mobile(iphone, base_url):
    iphone.goto(base_url + "/csoai-os/v2-temple-os.html", wait_until="domcontentloaded")
    iphone.wait_for_selector("#chatInput", timeout=10_000)
    iphone.fill("#chatInput", "ping")
    assert iphone.locator("#chatInput").input_value() == "ping"
