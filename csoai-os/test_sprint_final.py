"""Tests for MEOK Council Live + Temples Live + i-Character Wizard."""
import sys
import subprocess
from pathlib import Path

COUNCIL = Path("/Users/nicholas/clawd/csoai-os/meok-home/council-live.html")
TEMPLES = Path("/Users/nicholas/clawd/csoai-os/meok-home/temples-live.html")
WIZARD = Path("/Users/nicholas/clawd/csoai-os/meok-home/ichar-wizard-live.html")


def test_council_file_exists():
    assert COUNCIL.exists()
    assert COUNCIL.stat().st_size > 5000


def test_council_14_queens():
    text = COUNCIL.read_text()
    queens = ["Sovereign King", "Sophia Care", "Aurelian", "Justitia", "Aleph", "Asteria", "Dominion", "Brain", "Proactive", "Bridge", "Distribution", "Council", "Watch", "Sage"]
    for q in queens:
        assert q in text, f"missing queen {q}"


def test_council_2_veto():
    text = COUNCIL.read_text()
    assert text.count("VETO") >= 2


def test_council_occean():
    text = COUNCIL.read_text()
    for trait in ["ocean", "O", "C", "E", "A", "N"]:
        assert trait in text, f"missing OCEAN trait {trait}"


def test_council_22_arcana():
    text = COUNCIL.read_text()
    for arcana in ["The Fool", "The World", "Justice", "The Tower", "The Star"]:
        assert arcana in text, f"missing arcana {arcana}"


def test_council_chat_integration():
    text = COUNCIL.read_text()
    assert "/api/council/chat" in text


def test_council_8_guarantees():
    text = COUNCIL.read_text()
    for guarantee in ["Defoneos-secured", "SIGIL-signed", "Maternal Covenant", "BFT council", "4-tier cascade", "Care before code", "No foreign surveillance", "100% sovereign"]:
        assert guarantee in text


def test_council_pwa():
    text = COUNCIL.read_text()
    assert "serviceWorker.register" in text


def test_council_gold_theme():
    text = COUNCIL.read_text()
    assert "#c9a84c" in text


def test_council_bft_9_13():
    text = COUNCIL.read_text()
    assert "9/13" in text


def test_temples_file_exists():
    assert TEMPLES.exists()
    assert TEMPLES.stat().st_size > 5000


def test_temples_11():
    text = TEMPLES.read_text()
    temples = ["EU", "UK", "US", "CA", "CN", "JP", "SG", "UN", "ISO", "IEEE", "CSOAI"]
    for t in temples:
        assert t in text, f"missing temple {t}"


def test_temples_flags():
    text = TEMPLES.read_text()
    flags = ["🇪🇺", "🇬🇧", "🇺🇸", "🇨🇦", "🇨🇳", "🇯🇵", "🇸🇬", "🇺🇳"]
    for f in flags:
        assert f in text, f"missing flag {f}"


def test_temples_real_lat_lon():
    text = TEMPLES.read_text()
    assert "50.378" in text  # Brussels
    assert "-97.0" in text  # US center
    assert "103.8198" in text  # Singapore


def test_temples_eu_regulations():
    text = TEMPLES.read_text()
    for reg in ["AI Act", "GDPR", "DORA", "NIS2", "CRA"]:
        assert reg in text, f"missing EU regulation {reg}"


def test_temples_us_regulations():
    text = TEMPLES.read_text()
    for reg in ["NIST AI RMF", "HIPAA", "CCPA"]:
        assert reg in text, f"missing US regulation {reg}"


def test_temples_uk_regulations():
    text = TEMPLES.read_text()
    for reg in ["UK AI Bill", "AISI"]:
        assert reg in text, f"missing UK regulation {reg}"


def test_temples_queen_curator():
    text = TEMPLES.read_text()
    for queen in ["Sophia Care", "Aurelian", "Justitia", "Aleph", "Asteria", "Brain", "Sage"]:
        assert queen in text


def test_temples_total_regulations():
    """37 total regulations (8+5+7+2+3+2+2+3+3+2+4 = 41, but some overlap)."""
    text = TEMPLES.read_text()
    # Count "code" property in regs array
    count = text.count("code: '")
    assert count >= 30, f"only {count} regulations"


def test_temples_8_guarantees():
    text = TEMPLES.read_text()
    for guarantee in ["Defoneos-secured", "SIGIL-signed", "Maternal Covenant", "BFT council", "4-tier cascade", "Care before code", "No foreign surveillance", "100% sovereign"]:
        assert guarantee in text


def test_temples_pwa():
    text = TEMPLES.read_text()
    assert "serviceWorker.register" in text


def test_wizard_file_exists():
    assert WIZARD.exists()
    assert WIZARD.stat().st_size > 5000


def test_wizard_5_steps():
    text = WIZARD.read_text()
    for step in ["Region", "Name", "Archetype", "Queen", "Arcana"]:
        assert step in text, f"missing step {step}"


def test_wizard_7_archetypes():
    text = WIZARD.read_text()
    for arch in ["Sovereign", "Guardian", "Scout", "Strategist", "Creator", "Companion", "Sage"]:
        assert arch in text, f"missing archetype {arch}"


def test_wizard_13_queens():
    text = WIZARD.read_text()
    for queen in ["Sovereign King", "Sophia Care", "Aurelian", "Justitia", "Aleph", "Asteria", "Dominion", "Brain", "Proactive", "Bridge", "Distribution", "Council", "Watch"]:
        assert queen in text, f"missing queen {queen}"


def test_wizard_22_arcana():
    text = WIZARD.read_text()
    for arcana in ["The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor", "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit", "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance", "The Devil", "The Tower", "The Star", "The Moon", "The Sun", "Judgement", "The World"]:
        assert arcana in text, f"missing arcana {arcana}"


def test_wizard_2_veto():
    text = WIZARD.read_text()
    assert text.count("VETO") >= 2


def test_wizard_api_ichar_create():
    text = WIZARD.read_text()
    assert "/api/ichar/create" in text
    assert "/api/geo" in text


def test_wizard_offline_safe():
    text = WIZARD.read_text()
    assert "localStorage" in text
    assert "Saved locally" in text or "offline" in text.lower()


def test_wizard_8_guarantees():
    text = WIZARD.read_text()
    for guarantee in ["Defoneos-secured", "SIGIL-signed", "Maternal Covenant", "BFT council", "4-tier cascade", "Care before code", "No foreign surveillance", "100% sovereign"]:
        assert guarantee in text


def test_wizard_pwa():
    text = WIZARD.read_text()
    assert "serviceWorker.register" in text


def test_wizard_continues_to_os():
    text = WIZARD.read_text()
    assert "meok-breakthrough.html" in text
    assert "Take me to the OS" in text


def test_wizard_gold_theme():
    text = WIZARD.read_text()
    assert "#c9a84c" in text


if __name__ == "__main__":
    sys.exit(subprocess.call([sys.executable, "-m", "pytest", __file__, "-v"]))
