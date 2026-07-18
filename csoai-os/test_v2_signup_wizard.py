"""Tests for v2-signup-wizard.html — the i-character creation wizard."""
import re
import sys
import subprocess
from pathlib import Path

PAGE_PATH = Path("/Users/nicholas/clawd/csoai-os/v2-signup-wizard.html")


def test_file_exists():
    assert PAGE_PATH.exists()
    assert PAGE_PATH.stat().st_size > 20000


def test_html_structure():
    content = PAGE_PATH.read_text()
    assert content.startswith("<!DOCTYPE html>")
    assert content.rstrip().endswith("</html>")


def test_5_wizard_steps():
    """The wizard must have exactly 5 steps."""
    content = PAGE_PATH.read_text()
    steps = re.findall(r'<div class="wizard-step(?:\s+active)?" data-step="(\d+)"', content)
    assert len(steps) == 5, f"expected 5 steps, got {len(steps)}"
    assert steps == ["0", "1", "2", "3", "4"]


def test_5_progress_dots():
    content = PAGE_PATH.read_text()
    dots = re.findall(r'<div class="step(?:\s+active)?" data-step="(\d+)"', content)
    assert len(dots) == 5


def test_13_queen_archetypes_in_js():
    content = PAGE_PATH.read_text()
    # All 13 queens + king must be in the QUEEN_ARCHETYPES object
    queens = [
        "queen-king", "queen-strategy", "queen-care", "queen-compliance",
        "queen-finance", "queen-domain", "queen-arcana", "queen-brain",
        "queen-proactive", "queen-bridge", "queen-distribution",
        "queen-council", "queen-watch",
    ]
    for q in queens:
        assert f"'{q}'" in content or f'"{q}"' in content, f"missing {q}"


def test_22_arcana_lenses_in_js():
    content = PAGE_PATH.read_text()
    arcana_names = [
        "The Fool", "The Magician", "The High Priestess", "The Empress",
        "The Emperor", "The Hierophant", "The Lovers", "The Chariot",
        "Strength", "The Hermit", "Wheel of Fortune", "Justice",
        "The Hanged Man", "Death", "Temperance", "The Devil",
        "The Tower", "The Star", "The Moon", "The Sun",
        "Judgement", "The World",
    ]
    for a in arcana_names:
        assert a in content, f"missing arcana {a}"


def test_region_detection_call():
    content = PAGE_PATH.read_text()
    assert "detectRegion" in content
    assert "ipapi.co" in content


def test_create_ichar_function():
    content = PAGE_PATH.read_text()
    assert "createIchar" in content
    assert "meok_ichar" in content
    assert "localStorage" in content


def test_voice_and_cognition_options():
    content = PAGE_PATH.read_text()
    assert 'value="warm"' in content
    assert 'value="direct"' in content
    assert 'value="scholarly"' in content
    assert 'value="playful"' in content
    assert 'value="fast"' in content
    assert 'value="deep"' in content
    assert 'value="balanced"' in content


def test_navigation_buttons():
    content = PAGE_PATH.read_text()
    assert 'id="btnBack"' in content
    assert 'id="btnNext"' in content
    assert "step(-1)" in content
    assert "step(1)" in content


def test_country_mapping():
    """The country-to-temple mapping must include UK, US, EU, JP, CN, CA, SG."""
    content = PAGE_PATH.read_text()
    for country in ["'GB'", "'US'", "'DE'", "'JP'", "'CN'", "'CA'", "'SG'"]:
        assert country in content, f"missing country {country}"


def test_form_validation():
    """The form must validate name + email (required fields)."""
    content = PAGE_PATH.read_text()
    assert "icharName" in content
    assert "icharEmail" in content
    assert "trim()" in content


def test_sigil_hash_storage():
    """The wizard must compute + display a SIGIL hash."""
    content = PAGE_PATH.read_text()
    assert "sigil_hash" in content
    assert "sigil:" in content


def test_confirmation_card():
    content = PAGE_PATH.read_text()
    assert "ichar-card" in content
    assert "id=\"cardName\"" in content
    assert "id=\"cardArchetype\"" in content
    assert "id=\"cardMotto\"" in content
    assert "id=\"cardSigil\"" in content


def test_link_to_temple_os():
    """After creation, the user must be linked to the temple OS."""
    content = PAGE_PATH.read_text()
    assert "v2-temple-os.html" in content


if __name__ == "__main__":
    sys.exit(subprocess.call([sys.executable, "-m", "pytest", __file__, "-v"]))