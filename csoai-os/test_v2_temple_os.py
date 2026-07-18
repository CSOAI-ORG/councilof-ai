"""Tests for MEOK OS v2 — the temple-on-globe single-pane OS.

Validates the HTML/JS structurally (parses, contains required elements,
temple data integrity, etc.) since the page is a single-file web app.
"""
import re
import json
from pathlib import Path

PAGE_PATH = Path("/Users/nicholas/clawd/csoai-os/v2-temple-os.html")


def test_file_exists():
    assert PAGE_PATH.exists()
    assert PAGE_PATH.stat().st_size > 30000  # the page is ~1360 lines


def test_html_structure():
    """The page must have a valid HTML5 structure."""
    content = PAGE_PATH.read_text()
    assert content.startswith("<!DOCTYPE html>")
    assert content.rstrip().endswith("</html>")
    assert "<html lang=" in content
    assert "<head>" in content
    assert "<body>" in content


def test_required_panes():
    """The page must have LHS, center, RHS panes (the OS shell)."""
    content = PAGE_PATH.read_text()
    assert "os-left" in content
    assert "os-center" in content
    assert "os-right" in content
    assert "os-topbar" in content
    assert "os-input" in content
    assert "globe-pane" in content
    assert "dorado-bar" in content
    assert "temple-overlay" in content


def test_sovereign_character():
    """The center must have a sovereign character element."""
    content = PAGE_PATH.read_text()
    assert "sov-character" in content
    assert "Sovereign here" in content
    assert "sov-greeting" in content
    assert "sov-suggestions" in content


def test_council_pills():
    """The RHS must show the 12-Queen council + the 2 veto queens."""
    content = PAGE_PATH.read_text()
    council_names = [
        "Sophia Care", "Aurelian", "Justitia", "Asteria", "Dominion",
        "Aleph", "Brain", "Proactive", "Bridge", "Distribution", "Council", "Watch"
    ]
    for name in council_names:
        assert (name in content), f"missing {name} council pill"
    assert "veto" in content
    assert "Sophia" in content
    assert "Watch" in content

def test_temples_data():
    """The TEMPLES array must include the 5+ major regions."""
    content = PAGE_PATH.read_text()
    # Find all temple codes
    temple_codes = re.findall(r"\{ code: '([^']+)', name: '([^']+)'", content)
    assert len(temple_codes) >= 5, f"only {len(temple_codes)} temples found"
    # Required temples
    required = ["EU", "UK", "US", "CN", "UN"]
    for r in required:
        assert any(c == r for c, _ in temple_codes), f"missing {r} temple"


def test_regulations_data():
    """At least 30 regulations catalogued across temples."""
    content = PAGE_PATH.read_text()
    # Find all regulation entries
    regs = re.findall(r"name: '([^']+)', meta: '([^']+)'", content)
    assert len(regs) >= 30, f"only {len(regs)} regulations found"


def test_workflows_data():
    """At least the EU and US temples must have workflows."""
    content = PAGE_PATH.read_text()
    assert "art9" in content  # EU workflow node
    assert "nist" in content.lower()  # US workflow node
    assert "workflow-node" in content
    assert "workflow-arrow" in content


def test_dorado_bar_west_to_east():
    """The DORADO bar must have 4 steps: west, globe, temple, east."""
    content = PAGE_PATH.read_text()
    for step in ["west", "globe", "temple", "east"]:
        assert f'data-dorado-step="{step}"' in content
    # "west" starts active
    assert 'class="dorado-step active" data-dorado-step="west"' in content or \
           "west\" class=\"dorado-step active" in content


def test_user_marker_logic():
    """The JS must include IP-based user marker placement."""
    content = PAGE_PATH.read_text()
    assert "detectUserRegion" in content
    assert "user-marker" in content
    assert "userRegion" in content


def test_sov_suggestions_present():
    """The chat must have 5+ suggestions to onboard new users."""
    content = PAGE_PATH.read_text()
    suggestions = re.findall(r"sov-suggestion.*?>([^<]+)</div>", content)
    assert len(suggestions) >= 5, f"only {len(suggestions)} suggestions"


def test_pwa_install_prompt():
    """PWA install prompt must be present (iOS/Windows/Android)."""
    content = PAGE_PATH.read_text()
    assert "pwa-install" in content
    assert "Install MEOK OS as an app" in content
    assert "beforeinstallprompt" in content


def test_temple_overlay_open_close():
    """The temple overlay must have open + close + escape key handlers."""
    content = PAGE_PATH.read_text()
    assert "openTemple" in content
    assert "closeTemple" in content
    assert "key === 'Escape'" in content


def test_sovereign_chat_reply_handler():
    """The chat must have a generateSovReply function with all 5 categories."""
    content = PAGE_PATH.read_text()
    assert "generateSovReply" in content
    for category in ["article 12", "cascade", "region", "i-character", "cyber"]:
        assert category in content or category.replace("-", "") in content


def test_responsive_breakpoints():
    """The page must have responsive breakpoints for mobile/TUI."""
    content = PAGE_PATH.read_text()
    assert "@media (max-width: 1100px)" in content
    assert "@media (max-width: 800px)" in content


def test_fonts_loaded():
    """JetBrains Mono + Space Grotesk must be loaded (the sovereign font stack)."""
    content = PAGE_PATH.read_text()
    assert "JetBrains+Mono" in content
    assert "Space+Grotesk" in content


def test_metadata_complete():
    """Page metadata must include theme-color, description, viewport."""
    content = PAGE_PATH.read_text()
    assert 'name="viewport"' in content
    assert 'name="theme-color"' in content
    assert 'name="description"' in content
    assert "Regulation Temples" in content


def test_link_to_signup_wizard():
    """The OS should link to the signup wizard for new users."""
    content = PAGE_PATH.read_text()
    assert "v2-signup-wizard.html" in content


def test_ichar_integration():
    """The OS must read meok_ichar from localStorage + apply it to the UI."""
    content = PAGE_PATH.read_text()
    assert "loadIchar" in content
    assert "meok_ichar" in content
    assert "applyIcharToUI" in content
    assert "localStorage" in content
    # Must use all 13 queen emojis
    queen_emojis = {
        "queen-king": "👑", "queen-strategy": "♑", "queen-care": "💗",
        "queen-compliance": "⚖", "queen-finance": "⭐", "queen-domain": "🛞",
        "queen-arcana": "✨", "queen-brain": "🧠", "queen-proactive": "⚡",
        "queen-bridge": "🌉", "queen-distribution": "☀️", "queen-council": "🦁",
        "queen-watch": "🗼",
    }
    for q, e in queen_emojis.items():
        assert q in content, f"missing {q} in ichar integration"
        assert e in content, f"missing emoji {e} for {q}"


def test_ichar_personalizes_greeting():
    """The ichar's name must replace the generic greeting."""
    content = PAGE_PATH.read_text()
    # The boot function should use ichar.name in the greeting
    assert "ichar.name" in content
    assert "Welcome," in content


def test_no_ichar_shows_signup_link():
    """If no ichar, the OS should link to the signup wizard."""
    content = PAGE_PATH.read_text()
    # The boot must check for ichar + show signup link if missing
    assert "v2-signup-wizard.html" in content
    assert "Create your i-character" in content or "create_ichar" in content.lower()


def test_ichar_in_breadcrumbs():
    """The ichar name must appear in the topbar breadcrumbs."""
    content = PAGE_PATH.read_text()
    # The breadcrumb area gets ichar.name appended
    assert "ichar.name" in content
    # And in the apply function, we update the breadcrumb innerHTML
    assert "bc.innerHTML" in content or "breadcrumbs" in content


if __name__ == "__main__":
    import sys
    import subprocess
    sys.exit(subprocess.call([sys.executable, "-m", "pytest", __file__, "-v"]))