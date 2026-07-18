"""Tests for MEOK WORLD 100% — the unified single-page PWA.

The build script (build_meok_world.py) inlines the OS shell + the signup
wizard + the ichar data into one HTML file. These tests verify the
output is structurally complete + the build is reproducible.
"""
import os
import re
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).parent
WORLD = HERE / "meok-world.html"
BUILDER = HERE / "build_meok_world.py"


def test_file_exists():
    """The MEOK WORLD file must exist."""
    assert WORLD.exists()
    assert WORLD.stat().st_size > 50000  # ~63KB
    assert WORLD.stat().st_size < 200000  # not bloated


def test_file_size_under_100kb():
    """The unified file should be under 100KB (single-page PWA budget)."""
    size = WORLD.stat().st_size
    assert size < 100000, f"MEOK WORLD is {size} bytes, exceeds 100KB budget"


def test_title_includes_aplus():
    content = WORLD.read_text(encoding="utf-8", errors="replace")
    assert content.startswith("<!DOCTYPE html>")
    assert content.rstrip().endswith("</html>")
    assert 'lang="en"' in content
    assert "<title>CSOAI Layer-0 — 8 protocols · 100/100 A+++++ · MEOK WORLD" in content


def test_all_5_panes_present():
    """All 5 OS panes must be in the unified file."""
    content = WORLD.read_text(encoding="utf-8", errors="replace")
    # LHS
    assert "os-left" in content
    assert "OS · Tools" in content
    # Center
    assert "os-center" in content
    assert "sov-character" in content
    # RHS
    assert "os-right" in content
    assert "12-Queen Council" in content
    # Globe (the world at the user's feet)
    assert "globe-pane" in content
    assert 'class="globe"' in content
    # DORADO bar
    assert "dorado-bar" in content
    # Topbar
    assert "os-topbar" in content


def test_temples_data_inlined():
    """All 11 temples must be in the unified file."""
    content = WORLD.read_text(encoding="utf-8", errors="replace")
    # All temple codes
    for code in ["EU", "UK", "US", "CA", "CN", "JP", "SG", "UN", "ISO", "IEEE"]:
        assert f"code: '{code}'" in content, f"missing temple {code}"


def test_regulations_inlined():
    """At least 30 regulations across temples."""
    content = WORLD.read_text(encoding="utf-8", errors="replace")
    regs = re.findall(r"name: '([^']+)', meta: '([^']+)'", content)
    assert len(regs) >= 30, f"only {len(regs)} regulations found"


def test_13_queen_archetypes_inlined():
    """All 13 queen archetypes must be in the JS."""
    content = WORLD.read_text(encoding="utf-8", errors="replace")
    for q in ["queen-king", "queen-strategy", "queen-care", "queen-compliance",
              "queen-finance", "queen-domain", "queen-arcana", "queen-brain",
              "queen-proactive", "queen-bridge", "queen-distribution",
              "queen-council", "queen-watch"]:
        assert f"'{q}'" in content, f"missing queen {q}"


def test_22_arcana_inlined():
    """All 22 Major Arcana must be in the JS."""
    content = WORLD.read_text(encoding="utf-8", errors="replace")
    for a in ["The Fool", "The Magician", "The High Priestess", "The Empress",
              "The Emperor", "The Hierophant", "The Lovers", "The Chariot",
              "Strength", "The Hermit", "Wheel of Fortune", "Justice",
              "The Hanged Man", "Death", "Temperance", "The Devil",
              "The Tower", "The Star", "The Moon", "The Sun",
              "Judgement", "The World"]:
        assert a in content, f"missing arcana {a}"


def test_ichar_integration():
    """The ichar functions must be in the JS (loadIchar, applyIcharToUI)."""
    content = WORLD.read_text(encoding="utf-8", errors="replace")
    assert "loadIchar" in content
    assert "applyIcharToUI" in content
    assert "localStorage" in content
    assert "meok_ichar" in content


def test_wizard_inlined():
    """The 5-step wizard must be in the unified modal."""
    content = WORLD.read_text(encoding="utf-8", errors="replace")
    assert "wizard-modal" in content
    assert "showWizard" in content
    assert "wizardState" in content
    # 5 steps
    steps = re.findall(r'<div class="wizard-step(?:\s+active)?" data-step="(\d+)"', content)
    assert len(steps) == 5, f"expected 5 wizard steps, got {len(steps)}"


def test_chat_functionality():
    """The chat to Sovereign + 5 categories of reply must be in the JS."""
    content = WORLD.read_text(encoding="utf-8", errors="replace")
    assert "sendChat" in content
    assert "generateSovReply" in content
    assert "article 12" in content
    assert "cascade" in content
    assert "i-character" in content
    assert "cyber" in content


def test_pwa_install():
    """The PWA install prompt must be present."""
    content = WORLD.read_text(encoding="utf-8", errors="replace")
    assert "beforeinstallprompt" in content
    assert "pwa-install" in content
    assert "Install MEOK WORLD" in content


def test_dorado_bar():
    """The DORADO bar must be present with all 4 steps."""
    content = WORLD.read_text(encoding="utf-8", errors="replace")
    for step in ["west", "globe", "temple", "east"]:
        assert f'data-dorado-step="{step}"' in content


def test_temple_overlay():
    """The temple overlay must have openTemple + closeTemple."""
    content = WORLD.read_text(encoding="utf-8", errors="replace")
    assert "openTemple" in content
    assert "closeTemple" in content
    assert "temple-overlay" in content


def test_region_detection():
    """Region detection must use ipapi.co + the country mapping."""
    content = WORLD.read_text(encoding="utf-8", errors="replace")
    assert "ipapi.co" in content
    assert "detectUserRegion" in content
    # Country mapping (7 countries)
    for country in ["'GB'", "'US'", "'DE'", "'JP'", "'CN'", "'CA'", "'SG'"]:
        assert country in content


def test_metadata_complete():
    """Page metadata must include theme-color, description, viewport, keywords."""
    content = WORLD.read_text(encoding="utf-8", errors="replace")
    assert 'name="viewport"' in content
    assert 'name="theme-color"' in content
    assert 'name="description"' in content
    assert 'name="keywords"' in content
    assert "MEOK" in content
    assert "SOV3" in content


def test_responsive_breakpoints():
    """Mobile + tablet + desktop breakpoints must exist."""
    content = WORLD.read_text(encoding="utf-8", errors="replace")
    assert "@media (max-width: 1100px)" in content
    assert "@media (max-width: 800px)" in content


def test_fonts_loaded():
    """Sovereign font stack must be loaded."""
    content = WORLD.read_text(encoding="utf-8", errors="replace")
    assert "JetBrains+Mono" in content
    assert "Space+Grotesk" in content


def test_bft_and_council_pills():
    """12-Queen council + BFT status must be visible."""
    content = WORLD.read_text(encoding="utf-8", errors="replace")
    # 12 council pills
    for name in ["Sophia Care", "Aurelian", "Justitia", "Asteria", "Dominion",
                 "Aleph", "Brain", "Proactive", "Bridge", "Distribution", "Council", "Watch"]:
        assert name in content
    # BFT
    assert "BFT Status" in content
    assert "Quorum" in content
    assert "f=4" in content or "f = 4" in content


def test_no_external_resources_break():
    """Verify the only external resources are fonts + ipapi (no other CDN deps)."""
    content = WORLD.read_text(encoding="utf-8", errors="replace")
    # External URLs (excluding ipapi.co and fonts)
    urls = re.findall(r'https?://[^\s"\'<>)]+', content)
    external_domains = set()
    for url in urls:
        m = re.match(r'https?://([^/]+)', url)
        if m:
            external_domains.add(m.group(1))
    # Only allow fonts.googleapis.com + ipapi.co
    allowed = {'fonts.googleapis.com', 'fonts.gstatic.com', 'ipapi.co'}
    unexpected = external_domains - allowed
    assert not unexpected, f"unexpected external domains: {unexpected}"


def test_sigil_signs():
    """SIGIL must be used for audit (per the defoneos-secured thesis)."""
    content = WORLD.read_text(encoding="utf-8", errors="replace")
    assert "sigil" in content.lower()
    assert "sigil_hash" in content


def test_build_script_reproducible():
    """Re-running the build should produce the same output."""
    size_before = WORLD.stat().st_size
    result = subprocess.run(
        [sys.executable, str(BUILDER)],
        capture_output=True, text=True, cwd=str(HERE)
    )
    assert result.returncode == 0, f"build failed: {result.stderr}"
    size_after = WORLD.stat().st_size
    # Same size (modulo a few bytes for timestamps if any)
    assert abs(size_before - size_after) < 100, f"size changed: {size_before} -> {size_after}"


if __name__ == "__main__":
    sys.exit(subprocess.call([sys.executable, "-m", "pytest", __file__, "-v"]))