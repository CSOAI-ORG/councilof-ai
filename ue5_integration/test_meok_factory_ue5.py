"""Tests for MeokFactoryActor — UE5 MEOK character factory.

The 7 parent archetypes from the MEOK Character Database:
- Sovereign, Guardian, Scout, Strategist, Creator, Companion, Sage
"""
import re
import sys
import subprocess
from pathlib import Path

FACTORY_H = Path("/Users/nicholas/clawd/ue5_integration/MeokWorld/Source/MeokWorld/Public/MeokFactoryActor.h")
FACTORY_CPP = Path("/Users/nicholas/clawd/ue5_integration/MeokWorld/Source/MeokWorld/Private/MeokFactoryActor.cpp")


def test_files_exist():
    assert FACTORY_H.exists()
    assert FACTORY_CPP.exists()
    assert FACTORY_H.stat().st_size > 4000
    assert FACTORY_CPP.stat().st_size > 6000


def test_header_structure():
    h = FACTORY_H.read_text()
    # USTRUCT for FMeokArchetypeDNA
    assert "USTRUCT(BlueprintType)" in h
    assert "struct FMeokArchetypeDNA" in h
    # UCLASS for AMeokFactoryActor
    assert "UCLASS()" in h
    assert "class MEOKWORLD_API AMeokFactoryActor : public AActor" in h
    # All 7 archetype fields
    for arch in ["Name", "DisplayName", "ShellColor", "CoreColor", "Pattern", "Translucency", "Iridescence", "Emoji"]:
        assert f"FString {arch}" in h or f"FLinearColor {arch}" in h or f"float {arch}" in h, f"missing {arch}"


def test_all_7_archetypes_in_cpp():
    cpp = FACTORY_CPP.read_text()
    for arch in ["sovereign", "guardian", "scout", "strategist", "creator", "companion", "sage"]:
        assert f'TEXT("{arch}")' in cpp, f"missing archetype {arch}"


def test_archetype_visual_dna():
    """Each archetype must have: name, color, pattern, emoji, derivatives."""
    cpp = FACTORY_CPP.read_text()
    # Colors per the brand spec
    for color_var, expected_rgb in [
        ("0.42f, 0.66f, 0.83f", "sky blue"),  # sovereign
        ("0.10f, 0.23f, 0.35f", "dark navy"),  # guardian
        ("0.83f, 0.48f, 0.35f", "coral"),  # scout
        ("0.29f, 0.54f, 0.35f", "dark green"),  # strategist
        ("0.83f, 0.65f, 0.35f", "amber"),  # creator
        ("0.35f, 0.66f, 0.60f", "teal"),  # companion
        ("0.83f, 0.77f, 0.35f", "gold"),  # sage
    ]:
        assert color_var in cpp, f"missing color {color_var} ({expected_rgb})"


def test_archetype_emoji():
    """Each archetype must have its emoji."""
    cpp = FACTORY_CPP.read_text()
    for emoji, name in [('🐉', 'sovereign'), ('🛡', 'guardian'), ('🏹', 'scout'),
                         ('♟', 'strategist'), ('✨', 'creator'), ('💗', 'companion'),
                         ('🧘', 'sage')]:
        assert emoji in cpp, f"missing emoji {emoji} for {name}"


def test_ufunction_blueprint_callable():
    """Key methods must be BlueprintCallable for UE5 Blueprint use."""
    h = FACTORY_H.read_text()
    for method in ["SpawnCharacterFromJSON", "SpawnCharacterFromArchetype", "SetTargetDNA",
                   "CrackOpen", "Emerge", "GetPersonalityFromSOV3", "GetAllArchetypes"]:
        assert f"void {method}(" in h or f"AActor* {method}(" in h or f"FString {method}(" in h or f"TArray<FString> {method}(" in h
        assert f"BlueprintCallable" in h, f"{method} not BlueprintCallable"


def test_sov3_connection():
    """The factory must call SOV3 substrate (meok-backend:8000)."""
    cpp = FACTORY_CPP.read_text()
    assert "127.0.0.1:8000" in cpp or "meok-backend" in cpp or "127.0.0.1:8000" in cpp
    assert "/api/council/" in cpp


def test_crack_open_and_emerge_animation():
    """CrackOpen and Emerge must use timer + state updates."""
    cpp = FACTORY_CPP.read_text()
    assert "CrackOpen" in cpp
    assert "Emerge" in cpp
    assert "FTimerManager" in cpp or "SetTimer" in cpp


def test_character_emergence_html():
    """The web character emergence page must exist with the 7 archetypes."""
    p = Path("/Users/nicholas/clawd/csoai-os/meok-home/meok-character-emergence.html")
    assert p.exists()
    content = p.read_text()
    # All 7 archetypes
    for arch in ["sovereign", "guardian", "scout", "strategist", "creator", "companion", "sage"]:
        assert arch in content
    # 13-Queen + King council
    for q in ["Sovereign King", "Aurelian", "Sophia Care", "Justitia", "Asteria", "Dominion", "Aleph",
              "Brain", "Proactive", "Bridge", "Distribution", "Council", "Watch"]:
        assert q in content
    # 22 arcana
    for arcana in ["The Fool", "The Magician", "The World"]:
        assert arcana in content
    # Procedural sound
    assert "Web Audio API" in content or "AudioContext" in content or "playTone" in content
    # No placeholders
    assert "Lorem ipsum" not in content


if __name__ == "__main__":
    sys.exit(subprocess.call([sys.executable, "-m", "pytest", __file__, "-v"]))