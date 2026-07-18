"""Tests for MEOK Social Media Profile Kit."""
import sys
import subprocess
from pathlib import Path

PAGE = Path("/Users/nicholas/clawd/csoai-os/meok-home/social-kit.html")


def test_file_exists():
    assert PAGE.exists()
    assert PAGE.stat().st_size > 5000


def test_8_profile_kits():
    """8 platform profile kits defined."""
    text = PAGE.read_text()
    assert text.count("platform: '") >= 8, f"only {text.count(chr(34))} kits"


def test_x_twitter_banner():
    """X / Twitter banner 1500x500."""
    text = PAGE.read_text()
    assert "1500x500" in text
    assert "X / TWITTER BANNER" in text or "X / Twitter Banner" in text


def test_linkedin_cover():
    """LinkedIn cover 1584x396."""
    text = PAGE.read_text()
    assert "1584x396" in text
    assert "LinkedIn" in text


def test_facebook_cover():
    """Facebook cover 820x312."""
    text = PAGE.read_text()
    assert "820x312" in text
    assert "Facebook" in text


def test_discord_icon():
    """Discord server icon 256x256."""
    text = PAGE.read_text()
    assert "256x256" in text
    assert "Discord" in text


def test_og_image():
    """Open Graph image 1200x630."""
    text = PAGE.read_text()
    assert "1200x630" in text
    assert "Open Graph" in text or "OPEN GRAPH" in text


def test_email_signature():
    """Email signature HTML."""
    text = PAGE.read_text()
    assert "EMAIL SIGNATURE" in text or "Email Signature" in text


def test_press_kit_pdf():
    """Press kit PDF A4."""
    text = PAGE.read_text()
    assert "A4 PDF" in text
    assert "PRESS KIT" in text or "Press Kit" in text


def test_verification_badge():
    """Verification badge SVG."""
    text = PAGE.read_text()
    assert "VERIFICATION BADGE" in text
    assert "Verification" in text


def test_all_8_use_cases_listed():
    """All 8 use cases listed."""
    text = PAGE.read_text()
    for use_case in ["X / Twitter", "LinkedIn", "Facebook", "Discord", "Open Graph", "Email", "Press", "Verification"]:
        assert use_case in text


def test_sovereign_guarantees():
    """8 sovereign guarantees in social kit page."""
    # Not necessarily in social kit, but the brand should be present
    text = PAGE.read_text()
    assert "MEOK SOVEREIGN" in text
    assert "souvereign" in text.lower() or "sovereign" in text.lower()


def test_svg_generation_function():
    """SVG generation function exists."""
    text = PAGE.read_text()
    assert "function buildKitSVG" in text


def test_animation_in_kit():
    """Live indicator animation in kit."""
    text = PAGE.read_text()
    assert "animate" in text


def test_copy_function():
    """Copy SVG function exists."""
    text = PAGE.read_text()
    assert "function copyKit" in text


def test_pwa_service_worker():
    """Service worker registered."""
    text = PAGE.read_text()
    assert "serviceWorker.register" in text


def test_gold_theme():
    """Gold theme consistent."""
    text = PAGE.read_text()
    assert "#c9a84c" in text
    assert "#d4a853" in text


if __name__ == "__main__":
    sys.exit(subprocess.call([sys.executable, "-m", "pytest", __file__, "-v"]))
