"""Tests for the FULL MEOK WORLD site (100+ pages).

The meok.ai site has 100+ pages. Per Nick's "its has 100s your m4
do the fucking work said at starrt" — the build script generates
126 pages (77 from build_full_site + 49 from build_everything).
"""
import re
import sys
import subprocess
from pathlib import Path

ROOT = Path("/Users/nicholas/clawd/csoai-os/meok-home")
PAGES_DIR = ROOT / "pages"


def test_pages_exist():
    """All 126+ pages must exist."""
    pages = list(PAGES_DIR.glob("*.html"))
    assert len(pages) >= 100, f"only {len(pages)} pages built (need 100+)"
    print(f"  Pages built: {len(pages)}")


def test_every_page_has_topbar():
    """Every page must use the shared topbar."""
    for p in PAGES_DIR.glob("*.html"):
        text = p.read_text()
        assert 'class="topbar"' in text, f"{p.name} missing topbar"
        # All 8 nav items
        for nav in ["Home", "OS", "Council", "MCPs", "Temples", "Research", "Blog", "About"]:
            assert f">{nav}</a>" in text, f"{p.name} missing nav {nav}"


def test_every_page_has_footer():
    """Every page must use the shared footer."""
    for p in PAGES_DIR.glob("*.html"):
        text = p.read_text()
        assert 'class="footer"' in text, f"{p.name} missing footer"
        assert "16939677" in text, f"{p.name} missing UK Companies House"


def test_every_page_has_status_bar():
    """Every page must have the live status bar."""
    for p in PAGES_DIR.glob("*.html"):
        text = p.read_text()
        assert 'class="status-bar"' in text, f"{p.name} missing status bar"
        assert "SOV3" in text


def test_every_page_has_polling():
    """Every page must have the live backend polling JS."""
    for p in PAGES_DIR.glob("*.html"):
        text = p.read_text()
        assert "pollStatus" in text, f"{p.name} missing pollStatus"
        assert "/api/backend/status" in text


def test_every_page_has_hero():
    """Every page must have a hero section."""
    for p in PAGES_DIR.glob("*.html"):
        text = p.read_text()
        assert 'class="hero"' in text, f"{p.name} missing hero"
        assert "<h1>" in text, f"{p.name} missing h1"


def test_every_page_has_cta():
    """Every page should have a CTA box."""
    for p in PAGES_DIR.glob("*.html"):
        text = p.read_text()
        # CTA may be the cta-box class or buttons
        assert ("cta-box" in text) or ("btn-primary" in text), f"{p.name} missing CTA"


def test_every_page_no_placeholders():
    """No Lorem ipsum, TODO, FIXME."""
    for p in PAGES_DIR.glob("*.html"):
        text = p.read_text()
        for bad in ["Lorem ipsum", "TODO:", "FIXME", "placeholder text"]:
            assert bad not in text, f"{p.name} has placeholder: {bad}"


def test_every_page_metadata():
    """Standard metadata on every page."""
    for p in PAGES_DIR.glob("*.html"):
        text = p.read_text()
        assert 'name="description"' in text, f"{p.name} missing description"
        assert 'og:title' in text, f"{p.name} missing og:title"
        assert 'twitter:card' in text, f"{p.name} missing twitter card"


def test_universe_pages_present():
    """All 7 Universe pages present."""
    for slug in ["universe", "town", "dome", "go", "ar", "family", "pioneer"]:
        assert (PAGES_DIR / f"{slug}.html").exists(), f"universe page {slug} missing"


def test_os_pages_present():
    """All 7 OS sub-pages present."""
    for slug in ["os", "os_any-llm", "os_consciousness", "os_sovereign", "os_sovereign-display", "os_memory", "os_dreams"]:
        assert (PAGES_DIR / f"{slug}.html").exists(), f"os page {slug} missing"


def test_characters_pages_present():
    """All 7 character sub-pages + 1 characters hub + 1 king = 9 present."""
    for slug in ["characters_aria", "characters_gabriel", "characters_luna", "characters_marcus",
                 "characters_sage", "characters_scout", "characters_shanti", "characters_king"]:
        assert (PAGES_DIR / f"{slug}.html").exists(), f"character page {slug} missing"


def test_work_pages_present():
    """All 4 work sub-pages + 1 ralph."""
    for slug in ["work", "work_orion", "work_riri", "work_hourman", "ralph"]:
        assert (PAGES_DIR / f"{slug}.html").exists(), f"work page {slug} missing"


def test_gaming_pages_present():
    """All 5 gaming sub-pages + 1 gaming hub."""
    for slug in ["gaming", "gaming_strategy", "gaming_post-game", "gaming_live-copilot", "gaming_platforms", "gaming_predator-stop"]:
        assert (PAGES_DIR / f"{slug}.html").exists(), f"gaming page {slug} missing"


def test_guardian_pages_present():
    """All 4 guardian sub-pages + 1 guardian hub."""
    for slug in ["guardian", "guardian_children", "guardian_elderly", "guardian_scam-stop", "guardian_personal"]:
        assert (PAGES_DIR / f"{slug}.html").exists(), f"guardian page {slug} missing"


def test_mcp_empire_pages_present():
    """All MCP/empire sub-pages present."""
    for slug in ["mcp-stack", "marketplace", "anthropic-registry", "councilof", "cobol", "apps",
                 "apps_apps", "labs", "civilizations", "maternal-covenant", "birth"]:
        assert (PAGES_DIR / f"{slug}.html").exists(), f"empire page {slug} missing"


def test_compliance_pages_present():
    """All compliance sub-pages + hub."""
    for slug in ["compliance", "ai-act", "eu-ai-act-countdown", "governance",
                 "compliance_gdpr", "compliance_dora", "compliance_nis2", "compliance_cra",
                 "compliance_nist-ai", "compliance_iso-42001", "compliance_eo-14110", "compliance_uk-ai"]:
        assert (PAGES_DIR / f"{slug}.html").exists(), f"compliance page {slug} missing"


def test_company_pages_present():
    """All company sub-pages present."""
    for slug in ["about", "pricing", "features", "how-it-works", "faq", "press", "roadmap",
                 "research", "research_governance-by-design", "blog", "open-source", "product",
                 "start", "waitlist", "login", "contact", "ai-os", "ai-os_story"]:
        assert (PAGES_DIR / f"{slug}.html").exists(), f"company page {slug} missing"


def test_legal_pages_present():
    """All legal sub-pages present."""
    for slug in ["privacy", "terms", "cookies", "accessibility", "sitemap"]:
        assert (PAGES_DIR / f"{slug}.html").exists(), f"legal page {slug} missing"


def test_temples_pages_present():
    """All 11 temple sub-pages present."""
    for slug in ["temples_eu", "temples_uk", "temples_us", "temples_ca", "temples_cn",
                 "temples_jp", "temples_sg", "temples_un", "temples_iso", "temples_ieee", "temples_csoai"]:
        assert (PAGES_DIR / f"{slug}.html").exists(), f"temple page {slug} missing"


def test_queens_pages_present():
    """All 12 queen sub-pages present."""
    for slug in ["queens_strategy", "queens_care", "queens_compliance", "queens_finance",
                 "queens_domain", "queens_arcana", "queens_brain", "queens_proactive",
                 "queens_bridge", "queens_distribution", "queens_council", "queens_watch"]:
        assert (PAGES_DIR / f"{slug}.html").exists(), f"queen page {slug} missing"


def test_defoneos_pages_present():
    """All 19 defoneos pages present."""
    for slug in ["defoneos", "defoneos_cyber", "defoneos_drones", "defoneos_bft", "defoneos_deploy",
                 "defoneos_partners", "defoneos_roadmap-v2", "defoneos_demo", "defoneos_freetak",
                 "defoneos_sensor-layer", "defoneos_civil-services", "defoneos_jsp936",
                 "defoneos_jsp440", "defoneos_counterdrone", "defoneos_compliance",
                 "defoneos_tak", "defoneos_ospd", "defoneos_isd", "defoneos_medevac"]:
        assert (PAGES_DIR / f"{slug}.html").exists(), f"defoneos page {slug} missing"


def test_every_page_minimum_size():
    """Every page must be at least 18KB of content."""
    for p in PAGES_DIR.glob("*.html"):
        assert p.stat().st_size > 18000, f"{p.name} too small ({p.stat().st_size} bytes)"


def test_external_resources_minimal():
    """Only fonts + MEOK domain as external resources."""
    for p in PAGES_DIR.glob("*.html"):
        text = p.read_text()
        # Skip CSP content (it lists allowed domains inline)
        text = re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]*>', '', text)
        urls = re.findall(r"https?://[^\s\"'<>)]+", text)
        domains = set()
        for url in urls:
            m = re.match(r"https?://([^/]+)", url)
            if m: domains.add(m.group(1))
        allowed = {"fonts.googleapis.com", "fonts.gstatic.com", "meok.ai",
                   "csoai.org", "csoai-static-deploy2.vercel.app",
                   "csoai-v2-app.vercel.app", "councilof.ai", "proofof.ai",
                   "cobol-bridge.ai", "github.com", "www.cobolbridge.ai",
                   "ipapi.co", "127.0.0.1:8000", "127.0.0.1:3101"}  # local backend + SOV3
        unexpected = domains - allowed
        assert not unexpected, f"{p.name} has unexpected domains: {unexpected}"


def test_every_page_active_nav():
    """Each page highlights the right nav item."""
    for p in PAGES_DIR.glob("*.html"):
        text = p.read_text()
        # At least one nav item should have class="active"
        assert 'class="active">' in text, f"{p.name} has no active nav"


if __name__ == "__main__":
    sys.exit(subprocess.call([sys.executable, "-m", "pytest", __file__, "-v"]))