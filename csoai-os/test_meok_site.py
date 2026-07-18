"""Tests for the full MEOK WORLD site (17 pages)."""
import re
import sys
import subprocess
from pathlib import Path

ROOT = Path("/Users/nicholas/clawd/csoai-os/meok-home")
PAGES_DIR = ROOT / "pages"
TEMPLATE = ROOT / "_template.html"
STYLES = ROOT / "_styles.css"
INDEX = ROOT / "index.html"

EXPECTED_PAGES = [
    "os", "council", "mcp", "temples", "research", "blog", "about",
    "pricing", "roadmap", "press", "features", "compliance",
    "characters", "guardian", "gaming", "work", "governance",
]


def test_all_17_pages_exist():
    """All 17 expected pages must exist."""
    for slug in EXPECTED_PAGES:
        p = PAGES_DIR / f"{slug}.html"
        assert p.exists(), f"missing page {slug}.html"
        assert p.stat().st_size > 20000, f"{slug}.html too small ({p.stat().st_size} bytes)"


def test_template_and_styles_exist():
    assert TEMPLATE.exists()
    assert STYLES.exists()
    assert STYLES.stat().st_size > 5000


def test_home_exists():
    assert INDEX.exists()
    assert INDEX.stat().st_size > 30000


def test_every_page_has_topbar():
    """Every page must use the shared topbar (class='topbar')."""
    for slug in EXPECTED_PAGES:
        p = (PAGES_DIR / f"{slug}.html").read_text()
        assert 'class="topbar"' in p, f"{slug} missing topbar"
        assert 'class="topbar-inner"' in p, f"{slug} missing topbar-inner"
        # Logo
        assert "MEOK" in p
        assert ".WORLD" in p
        # All 8 nav items
        for nav in ["Home", "OS", "Council", "MCPs", "Temples", "Research", "Blog", "About"]:
            assert f">{nav}</a>" in p, f"{slug} missing nav {nav}"


def test_every_page_has_footer():
    """Every page must use the shared footer."""
    for slug in EXPECTED_PAGES:
        p = (PAGES_DIR / f"{slug}.html").read_text()
        assert 'class="footer"' in p, f"{slug} missing footer"
        assert "16939677" in p, f"{slug} missing UK Companies House"
        assert "England" in p, f"{slug} missing England"
        # 5 columns
        for col in ["Universe", "OS", "Company", "Portfolio"]:
            assert f"<h4>{col}</h4>" in p, f"{slug} missing column {col}"


def test_every_page_has_status_bar():
    """Every page must have the live status bar at the bottom."""
    for slug in EXPECTED_PAGES:
        p = (PAGES_DIR / f"{slug}.html").read_text()
        assert 'class="status-bar"' in p, f"{slug} missing status bar"
        assert "SOV3" in p
        assert "BFT" in p


def test_every_page_has_polling_js():
    """Every page must have the live backend polling JS."""
    for slug in EXPECTED_PAGES:
        p = (PAGES_DIR / f"{slug}.html").read_text()
        assert "pollStatus" in p, f"{slug} missing pollStatus"
        assert "/api/backend/status" in p, f"{slug} missing API endpoint"
        assert "setInterval" in p, f"{slug} missing setInterval"


def test_every_page_metadata():
    """Every page must have the standard metadata + title + description."""
    for slug in EXPECTED_PAGES:
        p = (PAGES_DIR / f"{slug}.html").read_text()
        assert 'name="description"' in p, f"{slug} missing description"
        assert 'og:title' in p, f"{slug} missing og:title"
        assert 'twitter:card' in p, f"{slug} missing twitter card"
        assert 'name="theme-color"' in p, f"{slug} missing theme-color"
        assert "MEOK WORLD" in p, f"{slug} missing MEOK WORLD in title"
        assert 'href="/manifest.webmanifest"' in p, f"{slug} missing PWA manifest"


def test_every_page_has_hero():
    """Every page must have a hero section."""
    for slug in EXPECTED_PAGES:
        p = (PAGES_DIR / f"{slug}.html").read_text()
        assert 'class="hero"' in p, f"{slug} missing hero section"
        assert "hero-tag" in p, f"{slug} missing hero-tag"
        assert "<h1>" in p, f"{slug} missing h1"


def test_every_page_has_cta_box():
    """Every page should have a CTA box linking to the OS / i-character."""
    for slug in EXPECTED_PAGES:
        p = (PAGES_DIR / f"{slug}.html").read_text()
        assert "cta-box" in p, f"{slug} missing CTA box"
        # Must link to either the OS or i-character
        assert ("v2-temple-os.html" in p) or ("v2-signup-wizard.html" in p), \
            f"{slug} CTA box must link to OS or i-character"


def test_every_page_responsive():
    """Every page must have responsive breakpoints."""
    for slug in EXPECTED_PAGES:
        p = (PAGES_DIR / f"{slug}.html").read_text()
        # Styles are inlined via _styles.css
        assert "@media" in p, f"{slug} missing media queries"


def test_council_page_has_13_queens():
    p = (PAGES_DIR / "council.html").read_text()
    for q in ["Sovereign King", "Sophia Care", "Aurelian", "Justitia", "Asteria",
              "Dominion", "Aleph", "Brain", "Proactive", "Bridge", "Distribution",
              "Council", "Watch"]:
        assert q in p, f"council page missing {q}"
    # 2 VETO
    assert "VETO" in p
    assert "veto-badge" in p


def test_temples_page_has_11_temples():
    p = (PAGES_DIR / "temples.html").read_text()
    for code in ["EU", "UK", "US", "CA", "CN", "JP", "SG", "UN", "ISO", "IEEE", "CSOAI"]:
        assert f">{code}</span>" in p, f"temples page missing {code}"


def test_mcp_page_has_218_count():
    p = (PAGES_DIR / "mcp.html").read_text()
    assert "218" in p
    assert "MCPs" in p
    # 8 categories
    for cat in ["EU AI Act", "SIGIL", "Cascade", "Bridges", "Gaming", "Compliance", "Governance", "Agent"]:
        assert cat in p, f"mcp page missing category {cat}"


def test_compliance_page_has_eu_ai_act():
    p = (PAGES_DIR / "compliance.html").read_text()
    assert "EU AI Act" in p
    assert "T-37" in p or "T-37 days" in p
    assert "GDPR" in p
    assert "DORA" in p
    assert "NIS2" in p
    assert "NIST" in p
    assert "ISO 42001" in p


def test_pricing_page_has_3_tiers():
    p = (PAGES_DIR / "pricing.html").read_text()
    for tier in ["Explorer", "Pro", "Family"]:
        assert tier in p, f"pricing missing tier {tier}"
    for price in ["£0", "£9.99", "£29"]:
        assert price in p, f"pricing missing price {price}"


def test_characters_page_has_13_queens():
    p = (PAGES_DIR / "characters.html").read_text()
    # 13 names
    for n in ["Sovereign King", "Sophia Care", "Aurelian", "Justitia", "Asteria",
              "Dominion", "Aleph", "Brain", "Proactive", "Bridge", "Distribution",
              "Council", "Watch"]:
        assert n in p, f"characters missing {n}"


def test_governance_page_has_4_layers():
    p = (PAGES_DIR / "governance.html").read_text()
    for layer in ["Identity", "Execution", "Compliance", "Council"]:
        assert layer in p, f"governance missing layer {layer}"


def test_about_page_has_company_house():
    p = (PAGES_DIR / "about.html").read_text()
    assert "16939677" in p
    assert "Nicholas Templeman" in p
    assert "SOV3" in p


def test_roadmap_page_has_quarters():
    p = (PAGES_DIR / "roadmap.html").read_text()
    for q in ["Q2 2026", "Q3 2026", "Q4 2026"]:
        assert q in p, f"roadmap missing {q}"


def test_press_page_has_assets():
    p = (PAGES_DIR / "press.html").read_text()
    assert "press" in p.lower()
    # Logo, ZIP, screenshots
    assert "logo" in p.lower() or "brand" in p.lower()


def test_every_page_minimum_content_size():
    """Every page must be at least 20KB of meaningful content (not just shell)."""
    for slug in EXPECTED_PAGES:
        size = (PAGES_DIR / f"{slug}.html").stat().st_size
        assert size > 20000, f"{slug} is {size} bytes (too small, likely empty)"


def test_external_resources_minimal():
    """Only allow fonts + MEOK domain as external resources."""
    for slug in EXPECTED_PAGES:
        p = (PAGES_DIR / f"{slug}.html").read_text()
        urls = re.findall(r"https?://[^\s\"'<>)]+", p)
        domains = set()
        for url in urls:
            m = re.match(r"https?://([^/]+)", url)
            if m: domains.add(m.group(1))
        allowed = {"fonts.googleapis.com", "fonts.gstatic.com", "meok.ai",
                   "csoai.org", "proofof.ai", "github.com", "www.cobolbridge.ai", "www.w3.org"}
        unexpected = domains - allowed
        assert not unexpected, f"{slug} has unexpected domains: {unexpected}"


def test_every_page_no_placeholders():
    """No Lorem ipsum, TODO, FIXME."""
    bads_found = []
    for slug in EXPECTED_PAGES:
        p = (PAGES_DIR / f"{slug}.html").read_text()
        for bad in ["Lorem ipsum", "TODO:", "FIXME", "placeholder text"]:
            if bad in p:
                bads_found.append(f"{slug} has: {bad}")
    assert not bads_found, f"placeholders found: {bads_found[:3]}"


def test_every_page_uses_correct_active_nav():
    """Each page must highlight the right nav item."""
    nav_map = {
        "os": "OS", "council": "COUNCIL", "mcp": "MCP", "temples": "TEMPLES",
        "research": "RESEARCH", "blog": "BLOG", "about": "ABOUT",
    }
    for slug, nav in nav_map.items():
        p = (PAGES_DIR / f"{slug}.html").read_text()
        labels = {"OS": "OS", "COUNCIL": "Council", "MCP": "MCPs", "TEMPLES": "Temples",
                  "RESEARCH": "Research", "BLOG": "Blog", "ABOUT": "About"}
        label = labels[nav]
        assert f'class="active">{label}</a>' in p, f"{slug} should have {label} active"


if __name__ == "__main__":
    sys.exit(subprocess.call([sys.executable, "-m", "pytest", __file__, "-v"]))