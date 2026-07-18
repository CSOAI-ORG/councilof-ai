"""Tests for UE5 3D absorption: MeokCharacter3D + MeokTownBuilder + FactoryActor upgrade.

This test suite verifies that the OLD agentshire glTF/GLB/FBX models in
meok-one/reference/agentshire/town-frontend/dist/assets/models/ are now
absorbed into the MASTER UE5 pipeline as first-class citizens.

The UE5 C++ won't compile in this environment (no Unreal Engine installed),
but we can verify the source structure + the absorption contract:
  1. MeokCharacter3D.h/.cpp exist with 300+ lines and 13-queen registry
  2. MeokTownBuilder.h/.cpp exist with 200+ lines and 11 temple grid
  3. MeokFactoryActor has been updated to use MeokCharacter3D
  4. The agentshire glTF/GLB library exists (source of truth)
  5. The 13 queen ids match the MEOK canon
  6. The 11 temple codes match the MEOK canon
  7. Each queen has a real glTF model path (no longer procedural-only)
  8. The town has buildings + characters + props + stage-deco
  9. The build.cs has the AssetManager module for async load
 10. The end-to-end: factory + registry + town + glTF files form a complete loop
"""
import os
import re
import sys
import subprocess
from pathlib import Path

ROOT = Path("/Users/nicholas/clawd/ue5_integration/MeokWorld")
MODELS = Path("/Users/nicholas/clawd/meok-one/reference/agentshire/town-frontend/dist/assets/models")

CHAR_H = ROOT / "Source/MeokWorld/Public/MeokCharacter3D.h"
CHAR_CPP = ROOT / "Source/MeokWorld/Private/MeokCharacter3D.cpp"
TOWN_H = ROOT / "Source/MeokWorld/Public/MeokTownBuilder.h"
TOWN_CPP = ROOT / "Source/MeokWorld/Private/MeokTownBuilder.cpp"
FACT_H = ROOT / "Source/MeokWorld/Public/MeokFactoryActor.h"
FACT_CPP = ROOT / "Source/MeokWorld/Private/MeokFactoryActor.cpp"
BUILD_CS = ROOT / "Source/MeokWorld/MeokWorld.Build.cs"


# ── 1. File structure ───────────────────────────────────────────────────
def test_files_exist():
    for p in [CHAR_H, CHAR_CPP, TOWN_H, TOWN_CPP]:
        assert p.exists(), f"missing {p}"


# ── 2. MeokCharacter3D has 300+ lines total ────────────────────────────
def test_meok_character_3d_is_300_lines():
    h_lines = len(CHAR_H.read_text().splitlines())
    cpp_lines = len(CHAR_CPP.read_text().splitlines())
    total = h_lines + cpp_lines
    assert total >= 300, f"only {total} lines ({h_lines}h + {cpp_lines}cpp), need 300+"


# ── 3. MeokTownBuilder has 200+ lines total ────────────────────────────
def test_meok_town_builder_is_200_lines():
    h_lines = len(TOWN_H.read_text().splitlines())
    cpp_lines = len(TOWN_CPP.read_text().splitlines())
    total = h_lines + cpp_lines
    assert total >= 200, f"only {total} lines ({h_lines}h + {cpp_lines}cpp), need 200+"


# ── 4. 13-queen archetype registry is complete ─────────────────────────
def test_13_queen_archetype_registry():
    # The 13 queen ids live in the .cpp file (BuildDefaultArchetypes).
    # The .h file only references them via TMap and methods, so we test cpp.
    c = CHAR_CPP.read_text()
    expected = [
        "queen-king", "queen-strategy", "queen-care", "queen-compliance",
        "queen-finance", "queen-domain", "queen-arcana", "queen-brain",
        "queen-proactive", "queen-bridge", "queen-distribution",
        "queen-council", "queen-watch",
    ]
    for q in expected:
        assert q in c, f"missing queen id {q} in cpp"


# ── 5. Each queen has a real glTF/GLB model path ───────────────────────
def test_every_queen_has_a_model_path():
    c = CHAR_CPP.read_text()
    # We Push() 13 queens; each gets a path like "characters/character-X.glb"
    glb_refs = re.findall(r'characters/character-[a-z]+-[a-z]\.glb', c)
    assert len(glb_refs) >= 13, f"only {len(glb_refs)} model paths in registry, need 13"


# ── 6. The agentshire glTF/GLB library actually exists on disk ─────────
def test_agentshire_models_exist():
    assert MODELS.exists(), f"missing {MODELS}"
    for sub in ["characters", "buildings", "furniture", "props", "stage-deco"]:
        d = MODELS / sub
        assert d.exists(), f"missing {d}"
        # at least 3 files in each
        files = list(d.glob("*.glb")) + list(d.glob("*.gltf"))
        assert len(files) >= 3, f"only {len(files)} models in {d}"


# ── 7. The 11 temple codes are present in the TownBuilder ──────────────
def test_11_temples_in_town_builder():
    c = TOWN_CPP.read_text()
    expected = ["EU", "UK", "US", "CA", "CN", "JP", "SG", "UN", "ISO", "IEEE", "BR"]
    for code in expected:
        assert code in c, f"missing temple code {code} in town builder"


# ── 8. The 3x3 grid + outer ring is implemented ────────────────────────
def test_3x3_grid_layout():
    c = TOWN_CPP.read_text()
    assert "Rows = 3" in c or "Rows = 3" in TOWN_H.read_text()
    assert "Cols = 3" in c or "Cols = 3" in TOWN_H.read_text()
    assert "GetGridPositions" in c
    # The 9 inner + 2 outer = 11 positions
    assert "RingR" in c


# ── 9. MeokFactoryActor has been updated to use the new registry ───────
def test_factory_uses_character_registry():
    h = FACT_H.read_text()
    c = FACT_CPP.read_text()
    # New component
    assert "UMeokCharacter3D" in h or "MeokCharacter3D" in h
    assert "CharacterRegistry" in h
    assert "CharacterRegistry" in c
    # New methods
    assert "SpawnIcharWithMesh" in c
    assert "RunEmergeSequence" in c
    assert "GetLoadedCharacterCount" in c
    # Include
    assert "MeokCharacter3D.h" in c


# ── 10. Build.cs has the AssetManager module (for FStreamableManager) ───
def test_build_cs_has_asset_manager():
    b = BUILD_CS.read_text()
    assert "AssetManager" in b, "Build.cs missing AssetManager module for async glTF load"


# ── 11. End-to-end: queens ↔ glTF files match ───────────────────────────
def test_e2e_queen_models_exist_on_disk():
    """For each queen with a model path in the registry, the .glb exists."""
    if not CHAR_CPP.exists():
        return
    c = CHAR_CPP.read_text()
    # Extract: "characters/character-X-Y.glb"
    refs = set(re.findall(r'characters/character-[a-z]+-[a-z]\.glb', c))
    for ref in refs:
        path = MODELS / ref
        assert path.exists(), f"queen model not on disk: {path}"


# ── 12. End-to-end: town builder temples ↔ buildings exist on disk ──────
def test_e2e_temple_buildings_exist():
    if not TOWN_CPP.exists():
        return
    c = TOWN_CPP.read_text()
    # Match "buildings/building_X.gltf" OR "buildings/building_X_withoutBase.gltf"
    refs = set(re.findall(r'buildings/building_[A-H](?:_withoutBase)?\.gltf', c))
    for ref in refs:
        path = MODELS / ref
        assert path.exists(), f"temple building not on disk: {path}"


if __name__ == "__main__":
    sys.exit(subprocess.call([sys.executable, "-m", "pytest", __file__, "-v"]))
