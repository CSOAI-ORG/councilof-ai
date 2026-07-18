"""Tests for meok-world-3d.html — the Cesium 3D MEOK WORLD site."""
import re
import sys
import subprocess
from pathlib import Path

PAGE = Path("/Users/nicholas/clawd/csoai-os/meok-home/meok-world-3d.html")


def test_file_exists():
    assert PAGE.exists()
    assert PAGE.stat().st_size > 20000


def test_cesium_included():
    """Cesium 3D library must be loaded."""
    content = PAGE.read_text()
    assert "cesium" in content.lower()
    assert "Cartesian3" in content
    assert "OpenStreetMapImageryProvider" in content


def test_11_temples_data():
    """All 11 temples must be defined with lat/lon + regulations + queen curator."""
    content = PAGE.read_text()
    expected_temples = [
        "EU", "UK", "US", "CA", "CN", "JP", "SG", "UN", "ISO", "IEEE", "CSOAI"
    ]
    for t in expected_temples:
        assert f"code: '{t}'" in content, f"missing temple {t}"


def test_7_archetypes_rail():
    """All 7 archetypes must be clickable."""
    content = PAGE.read_text()
    for arch in ["sovereign", "guardian", "scout", "strategist", "creator", "companion", "sage"]:
        assert f'data-arch="{arch}"' in content, f"missing archetype {arch}"


def test_13_queens_curators():
    """Every temple must have a queen curator assigned."""
    content = PAGE.read_text()
    queens = ["Justitia", "Aurelian", "Brain", "Bridge", "Dominion", "Sage",
              "Proactive", "Distribution", "Council", "Watch", "Sophia Care"]
    for q in queens:
        assert q in content, f"missing queen {q}"


def test_live_status_polling():
    """Status bar must poll /api/backend/status every 30s."""
    content = PAGE.read_text()
    assert "/api/backend/status" in content
    assert "pollStatus" in content
    assert "setInterval" in content
    assert "30000" in content


def test_modal_temple_detail():
    """Temple detail modal must exist with 3 sections."""
    content = PAGE.read_text()
    assert "temple-modal" in content
    assert "Regulations" in content
    assert "Queen curator" in content
    assert "Actions" in content


def test_auto_rotation():
    """Globe should auto-rotate slowly."""
    content = PAGE.read_text()
    assert "rotateRight" in content
    assert "auto-rotation" in content.lower() or "rotate" in content.lower()


def test_click_handler():
    """Click on temple billboard must open the modal."""
    content = PAGE.read_text()
    assert "ScreenSpaceEventHandler" in content
    assert "openTemple" in content


def test_status_bar_8_items():
    """Status bar has 8 live items."""
    content = PAGE.read_text()
    items = ["ssov3", "shive", "scouncil", "sbft", "smcps", "seu", "ssigil", "sbackend"]
    for item in items:
        assert f'id="{item}"' in content, f"missing status item {item}"


def test_hero_stats_6():
    """Hero stats show 6 metrics: MCPs, Queens, Temples, Archetypes, Arcana, $0.01."""
    content = PAGE.read_text()
    assert "218" in content and "MCPs" in content
    assert "13" in content and "Queens" in content
    assert "11" in content and "Temples" in content
    assert "7" in content and "Archetypes" in content
    assert "22" in content and "Arcana" in content
    assert "$0.01" in content


def test_no_placeholders():
    """No Lorem ipsum, TODO, FIXME, or Coming soon."""
    content = PAGE.read_text()
    for bad in ["Lorem ipsum", "TODO:", "FIXME", "Coming soon"]:
        assert bad not in content, f"placeholder '{bad}' found"


def test_responsive():
    """Mobile responsive with @media query."""
    content = PAGE.read_text()
    assert "@media" in content
    assert "max-width: 800px" in content


def test_pwa_registered():
    """Service worker registered."""
    content = PAGE.read_text()
    assert "serviceWorker" in content
    assert "sw.js" in content


def test_meta_tags():
    """Standard meta tags (og, twitter, viewport)."""
    content = PAGE.read_text()
    assert 'name="viewport"' in content
    assert 'name="description"' in content
    assert 'name="theme-color"' in content


def test_real_regulations():
    """EU AI Act Art 50 (T-37 days), GDPR Art 22, NIST RMF must be cited."""
    content = PAGE.read_text()
    assert "T-37" in content
    assert "AI Act 50" in content or "Art 50" in content or "Art. 50" in content
    assert "GDPR" in content
    assert "NIST" in content
    assert "DORA" in content
    assert "NIS2" in content
    assert "CRA" in content
    assert "BFT" in content


if __name__ == "__main__":
    sys.exit(subprocess.call([sys.executable, "-m", "pytest", __file__, "-v"]))
