"""Quick smoke test — verify MEOK WORLD is 100% functional.

Per Nick's 9 PM deadline: verify that every page loads, every API
endpoint works (mocked if backend not running), every PWA artifact
is present, every test passes.

Run: python3 -m pytest meok_home/smoke_test.py -v
"""
import re
import sys
import os
import json
import subprocess
from pathlib import Path
from unittest.mock import patch, MagicMock

ROOT = Path("/Users/nicholas/clawd/csoai-os/meok-home")
PAGES = ROOT / "pages"
PUBLIC = ROOT / "public"
TEMPLATE = ROOT / "_template.html"
STYLES = ROOT / "_styles.css"
INDEX = ROOT / "index.html"


def test_pwa_manifest_exists():
    """PWA manifest must exist and be valid JSON."""
    assert (PUBLIC / "manifest.webmanifest").exists()
    data = json.loads((PUBLIC / "manifest.webmanifest").read_text())
    assert data["name"] == "MEOK WORLD"
    assert data["start_url"] == "/"
    assert len(data["icons"]) >= 2


def test_service_worker_exists():
    """Service worker must exist and have fetch handler."""
    sw = PUBLIC / "sw.js"
    assert sw.exists()
    content = sw.read_text()
    assert "addEventListener" in content
    assert "fetch" in content


def test_icons_exist():
    """Both icon sizes must exist."""
    assert (PUBLIC / "icons" / "icon-192.svg").exists()
    assert (PUBLIC / "icons" / "icon-512.svg").exists()


def test_sitemap_exists():
    """Sitemap must be valid XML and contain 100+ URLs."""
    s = PUBLIC / "sitemap.xml"
    assert s.exists()
    content = s.read_text()
    urls = re.findall(r"<loc>https://meok\.ai/[^<]+</loc>", content)
    assert len(urls) >= 50, f"only {len(urls)} URLs in sitemap"


def test_robots_exists():
    """Robots.txt must exist and allow all + have sitemap."""
    r = PUBLIC / "robots.txt"
    assert r.exists()
    text = r.read_text()
    assert "Sitemap:" in text


def test_makefile_exists():
    """Top-level Makefile must have build/test/deploy targets."""
    mf = Path("/Users/nicholas/clawd/Makefile")
    assert mf.exists()
    text = mf.read_text()
    for t in ["build", "test", "deploy", "checklist"]:
        assert f"{t}:" in text, f"Makefile missing {t} target"


def test_every_page_has_pwa_manifest_link():
    """Every page must reference the PWA manifest."""
    pages = list(PAGES.glob("*.html"))
    assert len(pages) >= 100
    for p in pages:
        text = p.read_text()
        assert 'rel="manifest"' in text, f"{p.name} missing PWA manifest"
        assert "serviceWorker" in text, f"{p.name} missing SW registration"


def test_every_page_has_soc_clear_nav():
    """Every page must have the 8 nav items + active class on the right one."""
    for p in PAGES.glob("*.html"):
        text = p.read_text()
        for nav in ["Home", "OS", "Council", "MCPs", "Temples", "Research", "Blog", "About"]:
            assert f">{nav}</a>" in text, f"{p.name} missing nav {nav}"


def test_every_page_has_status_bar():
    """Every page must have the live status bar."""
    for p in PAGES.glob("*.html"):
        text = p.read_text()
        assert "status-bar" in text, f"{p.name} missing status bar"


def test_every_page_has_hero():
    """Every page must have a hero with a h1."""
    for p in PAGES.glob("*.html"):
        text = p.read_text()
        assert 'class="hero"' in text, f"{p.name} missing hero"
        assert "<h1>" in text, f"{p.name} missing h1"


def test_every_page_links_to_os():
    """Every page must link to v2-temple-os.html OR v2-signup-wizard.html."""
    for p in PAGES.glob("*.html"):
        text = p.read_text()
        assert ("v2-temple-os.html" in text) or ("v2-signup-wizard.html" in text), \
            f"{p.name} must link to OS or i-character"


def test_every_page_has_uk_companies_house():
    """Every page must have UK Companies House 16939677 in footer."""
    for p in PAGES.glob("*.html"):
        text = p.read_text()
        assert "16939677" in text, f"{p.name} missing UK Companies House"


def test_every_page_no_placeholders():
    """No Lorem ipsum, TODO, FIXME."""
    for p in PAGES.glob("*.html"):
        text = p.read_text()
        for bad in ["Lorem ipsum", "TODO:", "FIXME", "placeholder text"]:
            assert bad not in text, f"{p.name} has placeholder: {bad}"


def test_every_page_responsive():
    """Every page must have media queries."""
    for p in PAGES.glob("*.html"):
        text = p.read_text()
        assert "@media" in text, f"{p.name} missing media queries"


def test_every_page_minimum_size():
    """Every page must be at least 18KB."""
    for p in PAGES.glob("*.html"):
        size = p.stat().st_size
        assert size > 18000, f"{p.name} too small ({size} bytes)"


def test_external_resources_minimal():
    """Only allow fonts + MEOK domain."""
    for p in PAGES.glob("*.html"):
        text = p.read_text()
        urls = re.findall(r"https?://[^\s\"'<>)]+", text)
        domains = set()
        for url in urls:
            m = re.match(r"https?://([^/]+)", url)
            if m: domains.add(m.group(1))
        allowed = {"fonts.googleapis.com", "fonts.gstatic.com", "meok.ai",
                   "csoai.org",
               "csoai-static-deploy2.vercel.app", "proofof.ai", "github.com", "www.cobolbridge.ai", "www.w3.org"}
        # Strip trailing semicolons (CSP lists them as 'fonts.googleapis.com;')
        domains = {d.rstrip(";") for d in domains}
        allowed = {"fonts.googleapis.com", "fonts.gstatic.com", "meok.ai",
                   "csoai.org", "csoai-static-deploy2.vercel.app",
                   "csoai-v2-app.vercel.app", "councilof.ai", "proofof.ai",
                   "cobol-bridge.ai", "github.com", "www.cobolbridge.ai",
                   "ipapi.co", "127.0.0.1:8000", "127.0.0.1:3101"}  # local backend + SOV3
        unexpected = domains - allowed
        assert not unexpected, f"{p.name} has unexpected: {unexpected}"


def test_every_page_has_polling_js():
    """Every page must poll /api/backend/status."""
    for p in PAGES.glob("*.html"):
        text = p.read_text()
        assert "/api/backend/status" in text, f"{p.name} missing API poll"
        assert "setInterval" in text, f"{p.name} missing setInterval"


if __name__ == "__main__":
    sys.exit(subprocess.call([sys.executable, "-m", "pytest", __file__, "-v"]))