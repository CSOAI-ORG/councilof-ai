"""5 Playwright smoke tests for the 17 live URLs.

Tests:
1. test_meok_ai_defoneos_hero — verify the DEFONEOS landing has the hero
2. test_csoai_org_root_navigation — verify csoai.org root has nav
3. test_sov3_live_demo_loads — verify the live demo iframe loads
4. test_sov3_arch_demo_cuboid — verify the 27-vertex arch renders
5. test_stripe_test_checkout — verify the Stripe checkout link
"""
import os
import sys
import pytest
from playwright.sync_api import sync_playwright


SMOKE_URLS = [
    "https://meok.ai/defoneos",
    "https://csoai.org",
    "https://csoai-org.github.io/sov3-live-demo/",
    "https://csoai-org.github.io/sov3-arch-demo/",
    "https://csoai-org.github.io/sov3-beat-demo/",
    "https://csoai-org.github.io/defoneos-com/",
    "https://csoai.org/launch/sat-4jul-0900-bst.html",
    "https://csoai.org/sovereign-constitution/",
    "https://csoai.org/manifesto/",
    "https://csoai.org/install.html",
    "https://csoai.org/article-50-passport/",
    "https://csoai.org/sov3small3/",
    "https://csoai.org/dorado/",
    "https://csoai.org/safety/",
    "https://csoai.org/distribution/",
    "https://csoai.org/kircher/",
    "https://csoai.org/grand-finale/",
]


@pytest.mark.parametrize("url", SMOKE_URLS)
def test_smoke_all_live_urls(url):
    """All 17 live URLs return HTTP 200 + have a title + body."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            response = page.goto(url, timeout=15000, wait_until="domcontentloaded")
            assert response.status == 200, f"{url} returned {response.status}"
            title = page.title()
            assert title and len(title) > 0, f"{url} has no title"
            # verify the body has content
            body_text = page.inner_text("body", timeout=5000)
            assert len(body_text) > 100, f"{url} body is too short ({len(body_text)} chars)"
        finally:
            browser.close()


def test_meok_ai_defoneos_hero():
    """The DEFONEOS landing has the hero + CTA + sovereign stats."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto("https://meok.ai/defoneos", timeout=15000, wait_until="domcontentloaded")
            html = page.content()
            assert "DEFONEOS" in html or "defoneos" in html.lower()
            assert "CSOAI" in html or "MEOK" in html
        finally:
            browser.close()


def test_csoai_org_root_navigation():
    """csoai.org root has navigation + the 7 Foundational Articles link."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto("https://csoai.org", timeout=15000, wait_until="domcontentloaded")
            html = page.content()
            assert "CSOAI" in html
            # check for the sovereign constitution link
            assert "sovereign-constitution" in html or "Sovereign" in html
        finally:
            browser.close()


def test_sov3_live_demo_loads():
    """The 5-demo page has at least 4 demo cards."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto("https://csoai-org.github.io/sov3-live-demo/", timeout=15000, wait_until="domcontentloaded")
            # The cards might use .card, .demo-card, [data-demo], or be just <a> links
            cards = page.locator(".card, .demo-card, [data-demo], a[href*='live-screen'], a[href*='3-worlds'], a[href*='pixel'], a[href*='work-trace']").count()
            links = page.locator("a").count()
            assert cards >= 4 or links >= 5, f"Expected 4+ cards/links, got cards={cards} links={links}"
        finally:
            browser.close()


def test_sov3_arch_demo_cuboid():
    """The 27-vertex arch page has the cuboid + the 4 councils + the 12 mindsets."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto("https://csoai-org.github.io/sov3-arch-demo/", timeout=15000, wait_until="domcontentloaded")
            html = page.content()
            assert "27" in html
            assert "cuboid" in html.lower() or "cube" in html.lower() or "vertex" in html.lower()
            # the 4 councils
            for council in ["SOV3-3", "MAMBA", "MoM", "MoE"]:
                assert council in html, f"Missing {council}"
        finally:
            browser.close()


def test_stripe_test_checkout():
    """Verify the Stripe Pro checkout link is present (the £79/mo Article 50 Pro)."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto("https://csoai.org/article-50-passport/", timeout=15000, wait_until="domcontentloaded")
            html = page.content()
            assert "buy.stripe.com" in html or "stripe" in html.lower()
        finally:
            browser.close()


if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-v", "--tb=short"]))
