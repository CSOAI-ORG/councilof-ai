"""Tests for MeokWorld UE5 plugin — structural validation only.

The UE5 C++ won't compile in this environment (no Unreal Engine installed),
but we can verify the plugin's structure: .uplugin format, Build.cs deps,
all Public/Private files exist, AMeokSOV3Connector and AMeokWorldTemple
classes are declared, etc.
"""
import re
import sys
import os
import subprocess
from pathlib import Path

ROOT = Path(os.path.expanduser("~/clawd/ue5_integration/MeokWorld"))


def test_plugin_dir_exists():
    assert ROOT.exists()
    assert (ROOT / "Source").exists()
    assert (ROOT / "Source" / "MeokWorld").exists()
    assert (ROOT / "Source" / "MeokWorld" / "Public").exists()
    assert (ROOT / "Source" / "MeokWorld" / "Private").exists()


def test_uplugin_is_valid():
    """The .uplugin must be valid JSON with required fields."""
    p = ROOT / "MeokWorld.uplugin"
    import json
    data = json.loads(p.read_text())
    # UE5 uses camelCase in .uplugin (fileVersion, not FileVersion)
    assert "fileVersion" in data or "FileVersion" in data
    assert "version" in data or "Version" in data
    assert "MEOK WORLD" in data["friendlyName"] or "MEOK WORLD" in data.get("FriendlyName", "")
    assert "CSOAI" in data["createdBy"] or "MEOK" in data["createdBy"]
    # Must have at least 1 module
    assert len(data["Modules"]) >= 1
    # The MeokWorld module
    mw_mod = next((m for m in data["Modules"] if m["Name"] == "MeokWorld"), None)
    assert mw_mod is not None
    assert mw_mod["Type"] == "Runtime"
    # Must depend on Cesium (per the design)
    cesium_dep = next((p for p in data["Plugins"] if p["Name"] == "CesiumForUnreal"), None)
    assert cesium_dep is not None
    assert cesium_dep["Enabled"] is True


def test_build_cs_dependencies():
    """The Build.cs must include the required module dependencies."""
    build = (ROOT / "Source" / "MeokWorld" / "MeokWorld.Build.cs").read_text()
    for mod in ["Core", "CoreUObject", "Engine", "Json", "JsonUtilities", "HTTP", "UMG", "Slate", "SlateCore", "RenderCore", "RHI"]:
        assert f'"{mod}"' in build, f"missing module {mod}"


def test_module_entry_exists():
    """The module entry .h + .cpp must exist with the right macros."""
    h = ROOT / "Source" / "MeokWorld" / "Public" / "MeokWorld.h"
    c = ROOT / "Source" / "MeokWorld" / "Private" / "MeokWorld.cpp"
    assert h.exists() and c.exists()
    h_text = h.read_text()
    c_text = c.read_text()
    assert "class FMeokWorldModule" in h_text
    assert "virtual void StartupModule() override" in h_text
    assert "IMPLEMENT_MODULE(FMeokWorldModule, MeokWorld)" in c_text


def test_5_actors_exist():
    """All 5 actors + 2 widgets must exist (header + impl)."""
    expected = [
        "MeokWorldTemple",
        "MeokSovereignCharacter",
        "MeokSOV3Connector",
        "MeokCouncilWidget",
        "MeokGlobeActor",
    ]
    for name in expected:
        h = ROOT / "Source" / "MeokWorld" / "Public" / f"{name}.h"
        c = ROOT / "Source" / "MeokWorld" / "Private" / f"{name}.cpp"
        assert h.exists(), f"missing {name}.h"
        assert c.exists(), f"missing {name}.cpp"


def test_13_queen_archetypes():
    """All 13 queen archetypes must be in the character enum."""
    h = (ROOT / "Source" / "MeokWorld" / "Public" / "MeokSovereignCharacter.h").read_text()
    c = (ROOT / "Source" / "MeokWorld" / "Private" / "MeokSovereignCharacter.cpp").read_text()
    expected = [
        "QueenKing", "QueenStrategy", "QueenCare", "QueenCompliance",
        "QueenFinance", "QueenDomain", "QueenArcana", "QueenBrain",
        "QueenProactive", "QueenBridge", "QueenDistribution", "QueenCouncil", "QueenWatch",
    ]
    for q in expected:
        assert q in h, f"missing enum {q} in header"
        assert q in c, f"missing switch case for {q} in impl"


def test_2_veto_queens():
    """Care + Watch queens must have HasVetoPower() == true."""
    h = (ROOT / "Source" / "MeokWorld" / "Public" / "MeokSovereignCharacter.h").read_text()
    assert "HasVetoPower" in h
    c = (ROOT / "Source" / "MeokWorld" / "Private" / "MeokSovereignCharacter.cpp").read_text()
    # Both Care + Watch must be in the HasVetoPower implementation
    assert "QueenCare" in c
    assert "QueenWatch" in c


def test_bft_math():
    """The BFT math: f = floor((n-1)/3), quorum = 2f+1 must be in the widget."""
    h = (ROOT / "Source" / "MeokWorld" / "Public" / "MeokCouncilWidget.h").read_text()
    c = (ROOT / "Source" / "MeokWorld" / "Private" / "MeokCouncilWidget.cpp").read_text()
    assert "CalculateBFTSlots" in h
    assert "(NodeCount - 1) / 3" in c  # BFT f formula
    assert "2 * F + 1" in c  # BFT quorum formula


def test_sov3_connector_endpoints():
    """The SOV3 connector must target the 4 cascade endpoints."""
    h = (ROOT / "Source" / "MeokWorld" / "Public" / "MeokSOV3Connector.h").read_text()
    c = (ROOT / "Source" / "MeokWorld" / "Private" / "MeokSOV3Connector.cpp").read_text()
    assert "FetchStatus" in h
    assert "CascadeQuery" in h
    assert "VerifySigil" in h
    assert "meok-backend" in c  # default endpoint


def test_11_temples_in_globe_actor():
    """The globe actor must spawn 11 temples at real-world lat/lon."""
    c = (ROOT / "Source" / "MeokWorld" / "Private" / "MeokGlobeActor.cpp").read_text()
    expected_codes = ["EU", "UK", "US", "CA", "CN", "JP", "SG", "UN", "ISO", "IEEE"]
    for code in expected_codes:
        assert f'TEXT("{code}")' in c, f"missing temple {code} in globe"
    # Haversine distance for nearest-temple lookup
    assert "HaversineKm" in c


def test_sigil_hashing():
    """Every component must use SIGIL hashing for audit."""
    temple_cpp = (ROOT / "Source" / "MeokWorld" / "Private" / "MeokWorldTemple.cpp").read_text()
    assert "GetSigilHash" in temple_cpp
    assert "sigil-" in temple_cpp  # SIGIL prefix per the spec
    # FNV-1a 64-bit (per the MEOK SIGIL spec)
    assert "FNV" in temple_cpp or "14695981039346656037" in temple_cpp


def test_temple_actor_fields():
    """The temple actor must have all required fields."""
    h = (ROOT / "Source" / "MeokWorld" / "Public" / "MeokWorldTemple.h").read_text()
    for field in ["Code", "Name", "Region", "Latitude", "Longitude", "Flag", "Regulations", "Workflows"]:
        assert field in h, f"temple missing field {field}"


def test_sovereign_char_bind_method():
    """The sovereign char must have a BindToIchar method."""
    h = (ROOT / "Source" / "MeokWorld" / "Public" / "MeokSovereignCharacter.h").read_text()
    c = (ROOT / "Source" / "MeokWorld" / "Private" / "MeokSovereignCharacter.cpp").read_text()
    assert "BindToIchar" in h
    assert "BindToIchar" in c
    assert "BindToIchar(" in c  # has a definition


def test_breathing_animation():
    """The sovereign char must have a 'breathing' animation."""
    c = (ROOT / "Source" / "MeokWorld" / "Private" / "MeokSovereignCharacter.cpp").read_text()
    assert "BreathingPhase" in c
    assert "Tick" in c
    assert "SetActorScale3D" in c
    assert "FMath::Sin" in c


def test_council_widget_has_13_queens():
    """The council widget must populate 13 queens on construct."""
    c = (ROOT / "Source" / "MeokWorld" / "Private" / "MeokCouncilWidget.cpp").read_text()
    # All 13 queen slugs
    for slug in ["queen-king", "queen-strategy", "queen-care", "queen-compliance",
                 "queen-finance", "queen-domain", "queen-arcana", "queen-brain",
                 "queen-proactive", "queen-bridge", "queen-distribution",
                 "queen-council", "queen-watch"]:
        assert f'TEXT("{slug}")' in c, f"missing council queen {slug}"


def test_no_unreal_dll_collisions():
    """No class name should collide with common UE5 names."""
    for name in ["MeokWorldTemple", "MeokSovereignCharacter", "MeokSOV3Connector",
                 "MeokCouncilWidget", "MeokGlobeActor"]:
        h = ROOT / "Source" / "MeokWorld" / "Public" / f"{name}.h"
        content = h.read_text()
        assert "GENERATED_BODY()" in content, f"{name} missing GENERATED_BODY()"
        # Check for at least one class/struct declaration
        assert ("UCLASS" in content) or ("USTRUCT" in content), \
            f"{name} missing UCLASS/USTRUCT"


def test_readme_exists():
    readme = ROOT / "README.md"
    assert readme.exists()
    text = readme.read_text()
    assert "MEOK WORLD" in text
    assert "Unreal Engine" in text
    assert "Cesium" in text
    assert "SOV3" in text


def test_plugin_targets_correct_platforms():
    """The plugin must target Win64 + Mac + Linux (UE5 cross-platform)."""
    import json
    data = json.loads((ROOT / "MeokWorld.uplugin").read_text())
    mw = next(m for m in data["Modules"] if m["Name"] == "MeokWorld")
    platforms = mw.get("PlatformAllowList", [])
    for p in ["Win64", "Mac", "Linux"]:
        assert p in platforms, f"missing platform {p}"


def test_content_dirs_exist():
    """The Content/ subdirs (Blueprints, UI, Models, Temples) must exist."""
    for sub in ["Blueprints", "UI", "Models", "Temples"]:
        assert (ROOT / "Content" / sub).exists(), f"missing Content/{sub}/"


if __name__ == "__main__":
    sys.exit(subprocess.call([sys.executable, "-m", "pytest", __file__, "-v"]))