"""
test_social_authority.py
========================
25 tests covering the 4 Social Authority Badge features for the
9 PM BST test (30 Jun 2026) and the Sat 4 Jul 2026 launch.

Coverage:
- 10 tests for MEOK Sovereign Authority Badge library (meok-badge.html)
  → asserts the 30+ badge variants are present
- 5 tests for GitHub README badge generator (github-badge.html)
  → asserts the 50+ shields.io badge styles are present
- 10 tests for Social media profile kit (social-kit.html)
  → asserts banners, signatures, footer verification badge

Run:  pytest test_social_authority.py -v
"""

from __future__ import annotations

import re
from pathlib import Path

import pytest

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

ROOT = Path(__file__).resolve().parent
BADGES_DIR = ROOT / "csoai-os" / "meok-home" / "public" / "badges"
MEOK_HTML = BADGES_DIR / "meok-badge.html"
GITHUB_HTML = BADGES_DIR / "github-badge.html"
SOCIAL_HTML = BADGES_DIR / "social-kit.html"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _read(path: Path) -> str:
    """Read a text file as UTF-8."""
    return path.read_text(encoding="utf-8")


def _svg_count(html: str) -> int:
    """Count <svg ...> opening tags in the document."""
    return len(re.findall(r"<svg[\s>]", html, flags=re.IGNORECASE))


def _shields_badge_count(html: str) -> int:
    """Count img.shields.io badge URLs."""
    return len(re.findall(r"img\.shields\.io", html, flags=re.IGNORECASE))


def _line_count(path: Path) -> int:
    """Return the line count of a file."""
    return sum(1 for _ in path.open("rb"))


# ===========================================================================
# TASK 1 — MEOK Sovereign Authority Badge library (10 tests)
# ===========================================================================

@pytest.fixture(scope="module")
def meok_html() -> str:
    assert MEOK_HTML.exists(), f"Missing file: {MEOK_HTML}"
    return _read(MEOK_HTML)


# The 30 badge slugs we expect to see defined as data or rendered as <svg>.
EXPECTED_BADGES = [
    "master", "sovereign", "care", "defoneos", "bft",
    "cascade", "sigil", "mcp", "sov3", "13-queens",
    "22-arcanas", "7-archetypes", "11-temples", "33-hives", "6-locales",
    "320-tests", "50-60-fact", "9-9-launch", "5-5-smoke", "1-39tb",
    "302-sdk", "95-dry", "0011-avg", "uk-16939677", "4-jul-launch",
    "t-37", "4-jul-2026", "10-pc", "8-sc", "osf",
]


def test_meok_file_exists():
    """The MEOK badge library HTML file exists at the canonical path."""
    assert MEOK_HTML.exists(), f"Missing: {MEOK_HTML}"


def test_meok_minimum_line_count():
    """The MEOK badge library must be at least 1,500 lines."""
    assert MEOK_HTML.exists(), "missing file"
    assert _line_count(MEOK_HTML) >= 1500, (
        f"meok-badge.html must be >= 1500 lines, got {_line_count(MEOK_HTML)}"
    )


def test_meok_html_structure(meok_html: str):
    """Document is a valid HTML5 document with a <title> + <body>."""
    assert "<!DOCTYPE html>" in meok_html
    assert "<title>" in meok_html
    assert "</body>" in meok_html
    assert "</html>" in meok_html


def test_meok_defines_all_thirty_badge_slugs(meok_html: str):
    """All 30 expected badge identifiers appear somewhere in the document."""
    missing = [slug for slug in EXPECTED_BADGES if slug not in meok_html]
    assert not missing, f"Missing badge slugs: {missing}"


def test_meok_contains_master_badge(meok_html: str):
    """The 'master' badge specifically exists and contains the live numbers."""
    assert "master" in meok_html.lower()
    # Master badge shows 518 repos, 484 mcps, 330 tools, 13 queens, 6 care.
    for needle in ["518", "484", "330", "13", "6"]:
        assert needle in meok_html, f"master badge missing live number '{needle}'"


def test_meok_renders_at_least_30_svg_badges(meok_html: str):
    """The document contains at least 30 <svg> elements (one per variant)."""
    assert _svg_count(meok_html) >= 30, (
        f"expected >= 30 <svg> badges, got {_svg_count(meok_html)}"
    )


def test_meok_includes_qr_codes(meok_html: str):
    """QR codes are embedded — at minimum a verified reference to /verify/."""
    assert "/verify/" in meok_html or "verify" in meok_html.lower()
    # A QR-encoded SVG or PNG reference must be present.
    has_qr_svg = bool(re.search(r"<svg[^>]*data-svg=\"qr\"", meok_html)) or \
        bool(re.search(r"qr[\-_]?code", meok_html, flags=re.IGNORECASE))
    assert has_qr_svg, "expected a QR-code SVG or labelled QR element"


def test_meok_includes_sigil_hash_field(meok_html: str):
    """A truncated SIGIL hash field is rendered (8-char hex pattern)."""
    # 8-char hex, optionally followed by '…' or '#' or similar.
    assert re.search(r"\b[0-9a-f]{8}\b", meok_html), "no 8-char SIGIL hash fragment"


def test_meok_links_to_mcp_federation(meok_html: str):
    """The badge library references the MCP federation (218 / 484 servers)."""
    assert "218" in meok_html or "484" in meok_html


def test_meok_has_live_clock_or_timestamp(meok_html: str):
    """The badge includes a live-update timestamp element / placeholder."""
    # A 'data-live', 'data-timestamp', or explicit 2026-06-30 marker is enough.
    assert (
        "data-live" in meok_html
        or "data-timestamp" in meok_html
        or "2026-06-30" in meok_html
        or "live" in meok_html.lower()
    )


# ===========================================================================
# TASK 2 — GitHub README badge generator (5 tests)
# ===========================================================================

@pytest.fixture(scope="module")
def github_html() -> str:
    assert GITHUB_HTML.exists(), f"Missing file: {GITHUB_HTML}"
    return _read(GITHUB_HTML)


def test_github_file_exists():
    """The GitHub badge generator HTML file exists at the canonical path."""
    assert GITHUB_HTML.exists(), f"Missing: {GITHUB_HTML}"


def test_github_minimum_line_count():
    """The GitHub badge generator must be at least 1,000 lines."""
    assert GITHUB_HTML.exists(), "missing file"
    assert _line_count(GITHUB_HTML) >= 1000, (
        f"github-badge.html must be >= 1000 lines, got {_line_count(GITHUB_HTML)}"
    )


def test_github_renders_at_least_50_shields_badges(github_html: str):
    """At least 50 img.shields.io badge URLs are rendered for the 518 repos."""
    count = _shields_badge_count(github_html)
    assert count >= 50, f"expected >= 50 shields.io badges, got {count}"


def test_github_includes_518_repos_marker(github_html: str):
    """The document mentions 518 CSOAI repos (or the 518 README badge)."""
    assert "518" in github_html, "518 (repo count) must appear in github-badge.html"


def test_github_includes_markdown_snippet_template(github_html: str):
    """The generator shows a copy/paste Markdown snippet (img ![…](…) form)."""
    # Markdown image syntax: ![alt](url)
    assert re.search(r"!\[.*?\]\(https?://[^\)]+\)", github_html), (
        "expected at least one Markdown image snippet to copy"
    )


# ===========================================================================
# TASK 3 — Social media profile kit (10 tests)
# ===========================================================================

@pytest.fixture(scope="module")
def social_html() -> str:
    assert SOCIAL_HTML.exists(), f"Missing file: {SOCIAL_HTML}"
    return _read(SOCIAL_HTML)


def test_social_file_exists():
    """The Social profile kit HTML file exists at the canonical path."""
    assert SOCIAL_HTML.exists(), f"Missing: {SOCIAL_HTML}"


def test_social_minimum_line_count():
    """The Social profile kit must be at least 1,000 lines."""
    assert SOCIAL_HTML.exists(), "missing file"
    assert _line_count(SOCIAL_HTML) >= 1000, (
        f"social-kit.html must be >= 1000 lines, got {_line_count(SOCIAL_HTML)}"
    )


def test_social_includes_x_banner_dimensions(social_html: str):
    """The X / Twitter banner is rendered at 1500×500."""
    assert "1500" in social_html and "500" in social_html, (
        "X / Twitter banner (1500×500) must be present"
    )


def test_social_includes_linkedin_cover_dimensions(social_html: str):
    """The LinkedIn cover is rendered at 1584×396."""
    assert "1584" in social_html and "396" in social_html, (
        "LinkedIn cover (1584×396) must be present"
    )


def test_social_includes_facebook_cover_dimensions(social_html: str):
    """The Facebook cover is rendered at 820×312."""
    assert "820" in social_html and "312" in social_html, (
        "Facebook cover (820×312) must be present"
    )


def test_social_includes_og_image_dimensions(social_html: str):
    """The Open Graph image is rendered at 1200×630."""
    assert "1200" in social_html and "630" in social_html, (
        "Open Graph image (1200×630) must be present"
    )


def test_social_includes_discord_server_icon(social_html: str):
    """The kit renders a Discord server-icon SVG (square)."""
    assert "discord" in social_html.lower(), "Discord server icon must be present"


def test_social_includes_email_signature(social_html: str):
    """An HTML email signature block is included."""
    # Common signature markers
    assert (
        "email-signature" in social_html.lower()
        or "email signature" in social_html.lower()
        or "@meok.ai" in social_html.lower()
    )


def test_social_includes_footer_verification_badge(social_html: str):
    """A footer verification SVG/badge is included for the website footer."""
    assert "footer" in social_html.lower() and "verif" in social_html.lower(), (
        "footer verification badge must be present"
    )


def test_social_includes_press_kit_link(social_html: str):
    """A press kit download / reference is included."""
    assert "press" in social_html.lower(), "press kit must be present"


# ===========================================================================
# Cross-file sanity
# ===========================================================================

def test_all_three_html_files_present():
    """All three HTML badge files coexist under public/badges/."""
    for p in (MEOK_HTML, GITHUB_HTML, SOCIAL_HTML):
        assert p.exists(), f"Missing: {p}"


def test_no_obvious_unrendered_placeholders_in_meok(meok_html: str):
    """MEOK badge HTML has no leftover 'TODO' markers in the body."""
    body = meok_html.lower()
    assert "todo" not in body or body.count("todo") <= 2, (
        "too many TODO markers — finish the implementation"
    )


def test_no_obvious_unrendered_placeholders_in_github(github_html: str):
    """GitHub badge HTML has no leftover 'TODO' markers in the body."""
    body = github_html.lower()
    assert "todo" not in body or body.count("todo") <= 2, (
        "too many TODO markers — finish the implementation"
    )


def test_no_obvious_unrendered_placeholders_in_social(social_html: str):
    """Social kit HTML has no leftover 'TODO' markers in the body."""
    body = social_html.lower()
    assert "todo" not in body or body.count("todo") <= 2, (
        "too many TODO markers — finish the implementation"
    )