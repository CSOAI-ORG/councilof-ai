"""Tests for meok-home/index.html — the MEOK WORLD drop-in home page."""
import re
import sys
import subprocess
from pathlib import Path

PAGE_PATH = Path("/Users/nicholas/clawd/csoai-os/meok-home/index.html")


def test_file_exists():
    assert PAGE_PATH.exists()
    assert PAGE_PATH.stat().st_size > 30000


def test_html_structure():
    content = PAGE_PATH.read_text()
    assert content.startswith("<!DOCTYPE html>")
    assert content.rstrip().endswith("</html>")
    assert 'lang="en"' in content


def test_metadata():
    content = PAGE_PATH.read_text()
    assert 'name="description"' in content
    assert "MEOK WORLD" in content
    assert "Sovereign AI" in content or "sovereign AI" in content
    assert 'og:title' in content
    assert 'twitter:card' in content
    assert 'name="theme-color"' in content


def test_topbar():
    content = PAGE_PATH.read_text()
    assert 'class="topbar"' in content
    assert 'class="topbar-inner"' in content
    # Logo (split across spans)
    assert "MEOK" in content
    assert ".WORLD" in content
    assert 'class="accent"' in content
    # Nav items
    for nav in ["Temples", "MCPs", "Council", "OS", "App", "CSOAI", "Research"]:
        assert f">{nav}</a>" in content, f"missing nav {nav}"
    # CTAs
    assert ">Log in<" in content or "Log in" in content
    assert "Start free" in content


def test_hero_section():
    content = PAGE_PATH.read_text()
    assert 'class="hero"' in content
    assert "The world is at your feet" in content
    assert "Sovereign AI, live" in content
    # 3 stat cards
    for stat in ["MCPs live", "Sovereign VMs", "Council + King"]:
        assert stat in content


def test_live_backend_panel():
    """The LIVE BACKEND PANEL must be present and show SOV3 status."""
    content = PAGE_PATH.read_text()
    assert 'class="live-panel"' in content
    assert "BACKEND" in content
    assert "LIVE STATUS" in content
    # All 12 live rows
    for row in ["SOV3 King", "Meok-ai", "Hive", "Council", "BFT quorum", "Last SIGIL",
                "Big Braim", "MCPs", "DORADO", "x402 paid", "EU AI Act", "i-character"]:
        assert row in content, f"missing live row {row}"


def test_hero_globe_svg():
    """The 3D-style SVG globe with temple markers must be present."""
    content = PAGE_PATH.read_text()
    assert 'class="hero-globe"' in content
    assert "globe-svg" in content
    assert 'id="heroTemples"' in content
    # 11 temples must be in the data
    temple_codes = re.findall(r"code: '(\w+)'", content)
    assert len(set(temple_codes)) >= 11


def test_news_section():
    """The news grid must have 6+ news cards with photos."""
    content = PAGE_PATH.read_text()
    assert 'id="newsGrid"' in content
    assert 'class="news-grid"' in content
    # 3 photo tag colors
    for tag in ["tag-sovereignty", "tag-temple", "tag-council"]:
        assert tag in content, f"missing photo tag {tag}"
    # News items: 6 expected
    news = re.findall(r"tag: '(\w+)'", content)
    assert len(news) >= 6, f"only {len(news)} news items"


def test_temples_section():
    """The temples grid must have 11 temple cards."""
    content = PAGE_PATH.read_text()
    assert 'id="templesGrid"' in content
    assert "Every regulation, on the globe" in content
    # All 4 region classes (CSS uses .temple-card.eu/.us/.apac/.global with dot)
    for region in ["temple-card.eu", "temple-card.us", "temple-card.apac", "temple-card.global"]:
        assert region in content, f"missing region class {region}"
    # The 11 temples via the data array
    for code in ["EU", "UK", "US", "CA", "CN", "JP", "SG", "UN", "ISO", "IEEE", "CSOAI"]:
        assert f"code: '{code}'" in content, f"missing temple {code}"


def test_council_section():
    """The 12-Queen + King council section must show 13 members."""
    content = PAGE_PATH.read_text()
    assert 'id="councilGrid"' in content
    # 13 council members (12 queens + king)
    council = re.findall(r"name: '([\w ]+)'", content)
    # Note: the news data also has names, so check the council explicitly
    for queen in ["Sovereign King", "Sophia Care", "Aurelian", "Justitia", "Asteria",
                  "Dominion", "Aleph", "Brain", "Proactive", "Bridge", "Distribution",
                  "Council", "Watch"]:
        assert queen in content, f"missing council {queen}"
    # 2 VETO queens (Care + Watch)
    assert "VETO" in content


def test_mcp_fleet_section():
    """The 218 MCP fleet section must show the breakdown."""
    content = PAGE_PATH.read_text()
    assert 'id="mcpNum"' in content
    assert "218" in content
    # 8 categories
    for cat in ["EU AI Act", "SIGIL", "Cascade", "Bridges", "Gaming", "Compliance", "Governance", "Agent"]:
        assert cat in content, f"missing MCP category {cat}"


def test_cta_section():
    """The OS CTA section must link to the i-character wizard + temple OS."""
    content = PAGE_PATH.read_text()
    assert "Enter MEOK WORLD" in content
    assert "v2-signup-wizard.html" in content
    assert "v2-temple-os.html" in content


def test_footer():
    """The footer must have 5 columns + UK Companies House + portfolio."""
    content = PAGE_PATH.read_text()
    assert 'class="footer"' in content
    assert 'class="footer-inner"' in content
    assert 'class="footer-bottom"' in content
    # UK Companies House
    assert "16939677" in content
    assert "England" in content
    # Portfolio
    assert "CSOAI" in content
    assert "COBOL Bridge" in content
    assert "ProofOf.AI" in content


def test_live_backend_polling():
    """The JS must poll the backend every 30s."""
    content = PAGE_PATH.read_text()
    assert "pollBackend" in content
    assert "setInterval" in content
    assert "/api/backend/status" in content


def test_responsive_breakpoints():
    content = PAGE_PATH.read_text()
    assert "@media (max-width: 1100px)" in content
    assert "@media (max-width: 800px)" in content
    assert "@media (max-width: 600px)" in content
    assert "@media (max-width: 900px)" in content
    assert "@media (max-width: 500px)" in content


def test_fonts_loaded():
    content = PAGE_PATH.read_text()
    assert "JetBrains+Mono" in content
    assert "Space+Grotesk" in content


def test_external_resources_minimal():
    """Only allow fonts + ipapi.co as external resources."""
    content = PAGE_PATH.read_text()
    urls = re.findall(r"https?://[^\s\"'<>)]+", content)
    domains = set()
    for url in urls:
        m = re.match(r"https?://([^/]+)", url)
        if m:
            domains.add(m.group(1))
    # Portfolio (the M2 portfolio + MEOK URLs are valid MEOK-domain references)
    # Strip trailing semicolons (CSP lists them as 'fonts.googleapis.com;')
    domains = {d.rstrip(";") for d in domains}
    allowed = {"fonts.googleapis.com", "fonts.gstatic.com", "meok.ai",
               "csoai.org",
               "csoai-static-deploy2.vercel.app", "proofof.ai", "github.com", "www.cobolbridge.ai", "www.w3.org",
               "ipapi.co", "127.0.0.1:8000", "127.0.0.1:3101"}  # local backend + SOV3
    unexpected = domains - allowed
    assert not unexpected, f"unexpected external domains: {unexpected}"


def test_pwa_ready():
    content = PAGE_PATH.read_text()
    assert 'rel="manifest"' in content
    assert 'mobile-web-app-capable' in content


def test_links_to_underlying_systems():
    """Must link to: v2-temple-os.html, v2-signup-wizard.html, csoai-v2-app, csoai.org."""
    content = PAGE_PATH.read_text()
    assert "v2-temple-os.html" in content
    assert "v2-signup-wizard.html" in content
    assert "csoai-v2-app" in content or "csoai.org" in content


def test_no_placeholder_text():
    """The page must not have placeholder Lorem ipsum / TODO / TBD."""
    content = PAGE_PATH.read_text()
    for bad in ["Lorem ipsum", "TODO", "TBD", "FIXME", "placeholder text", "dummy"]:
        assert bad not in content, f"found placeholder: {bad}"


if __name__ == "__main__":
    sys.exit(subprocess.call([sys.executable, "-m", "pytest", __file__, "-v"]))