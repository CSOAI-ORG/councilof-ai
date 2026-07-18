"""Tests for MEOK Avatar Connector."""
import sys
import subprocess
from pathlib import Path

sys.path.insert(0, "/Users/nicholas/clawd/csoai-os")
from meok_avatar_connector import (
    import_avatar, share_to_platform, MEOKAvatar,
    SUPPORTED_SOURCES, MEOK_ARCHETYPE_VISUALS, ARCANA_LENSES,
    ARCHETYPE_QUEEN_MAP, CARE_DIMENSIONS, SOCIAL_PLATFORMS,
)


def test_10_supported_sources():
    """All 10 source platforms must be supported."""
    expected = [
        "apple_memoji", "apple_persona", "bitmoji", "ready_player_me",
        "meta_avatar", "vrchat", "roblox", "rec_room", "apple_spatial", "meta_horizon"
    ]
    for src in expected:
        assert src in SUPPORTED_SOURCES, f"missing source {src}"


def test_7_archetypes():
    """All 7 archetypes must be defined."""
    expected = ["sovereign", "guardian", "scout", "strategist", "creator", "companion", "sage"]
    for a in expected:
        assert a in MEOK_ARCHETYPE_VISUALS, f"missing archetype {a}"
        assert "emoji" in MEOK_ARCHETYPE_VISUALS[a]
        assert "color" in MEOK_ARCHETYPE_VISUALS[a]
        assert "pattern" in MEOK_ARCHETYPE_VISUALS[a]


def test_22_arcanas():
    """All 22 Major Arcana must be defined."""
    assert len(ARCANA_LENSES) == 22
    assert ARCANA_LENSES[0] == "The Fool"
    assert ARCANA_LENSES[21] == "The World"


def test_6_care_dimensions():
    """Maternal Covenant: 6 care dimensions."""
    assert len(CARE_DIMENSIONS) == 6
    for d in ["safety", "honesty", "privacy", "fairness", "growth", "consent"]:
        assert d in CARE_DIMENSIONS


def test_8_social_platforms():
    """All 8 social platforms must be supported."""
    expected = ["apple", "meta", "x", "linkedin", "snapchat", "tiktok", "discord", "telegram"]
    for p in expected:
        assert p in SOCIAL_PLATFORMS, f"missing platform {p}"
        assert "oauth" in SOCIAL_PLATFORMS[p]
        assert "share_endpoint" in SOCIAL_PLATFORMS[p]


def test_archetype_to_queen_mapping():
    """Each archetype maps to a queen."""
    assert ARCHETYPE_QUEEN_MAP["sovereign"] == "queen-king"
    assert ARCHETYPE_QUEEN_MAP["guardian"] == "queen-watch"  # VETO
    assert ARCHETYPE_QUEEN_MAP["companion"] == "queen-care"  # VETO


def test_import_apple_memoji():
    """Import an Apple Memoji avatar."""
    avatar = import_avatar("apple_memoji", {"name": "Sarah", "emoji": "👑", "id": "mem-123"})
    assert avatar.name == "Sarah"
    assert avatar.source_platform == "apple_memoji"
    assert avatar.archetype == "sovereign"  # crown detected
    assert avatar.queen_id == "queen-king"
    assert avatar.ichar_id.startswith("ich-")
    assert len(avatar.sigil_hash) == 16


def test_import_apple_persona():
    """Import an Apple Vision Pro Persona."""
    avatar = import_avatar("apple_persona", {"name": "James", "emoji": "💗", "kindness": 0.9}, archetype="companion")
    assert avatar.source_platform == "apple_persona"
    assert avatar.archetype == "companion"  # 💗 → companion
    assert avatar.queen_id == "queen-care"  # VETO Care
    assert avatar.arcana_lens == 17  # The Star


def test_import_bitmoji():
    """Import a Bitmoji avatar."""
    avatar = import_avatar("bitmoji", {"name": "Alex", "emoji": "🛡", "reliability": 0.7}, archetype="guardian")
    assert avatar.source_platform == "bitmoji"
    assert avatar.archetype == "guardian"  # 🛡
    assert avatar.queen_id == "queen-watch"  # VETO Watch


def test_import_ready_player_me():
    """Import a Ready Player Me avatar."""
    avatar = import_avatar("ready_player_me", {"name": "Maya", "emoji": "✨", "creativity": 0.95}, archetype="creator")
    assert avatar.source_platform == "ready_player_me"
    assert avatar.queen_id == "queen-arcana"  # creator → arcana queen


def test_import_meta_avatar():
    """Import a Meta Avatar."""
    avatar = import_avatar("meta_avatar", {"name": "Carlos", "emoji": "♟"})
    assert avatar.source_platform == "meta_avatar"


def test_import_vrchat():
    """Import a VRChat avatar (.vrm/.glb/.fbx)."""
    avatar = import_avatar("vrchat", {"name": "Yuki", "vroid_id": "vr-001"})
    assert avatar.source_platform == "vrchat"
    assert avatar.ichar_id.startswith("ich-")


def test_import_roblox():
    """Import a Roblox avatar."""
    avatar = import_avatar("roblox", {"name": "Zara", "id": "rb-001"})
    assert avatar.source_platform == "roblox"


def test_import_rec_room():
    """Import a Rec Room avatar."""
    avatar = import_avatar("rec_room", {"name": "Theo", "head": "rr-001"})
    assert avatar.source_platform == "rec_room"


def test_import_apple_spatial():
    """Import an Apple Spatial Persona (visionOS 2.0+)."""
    avatar = import_avatar("apple_spatial", {"name": "Mira", "spatial_id": "sp-001"})
    assert avatar.source_platform == "apple_spatial"


def test_import_meta_horizon():
    """Import a Meta Horizon Avatar."""
    avatar = import_avatar("meta_horizon", {"name": "Riku", "worlds": ["horizon-home"]})
    assert avatar.source_platform == "meta_horizon"


def test_avatar_has_sovereign_guarantees():
    """Every MEOK avatar must have 8 sovereign guarantees."""
    avatar = import_avatar("apple_memoji", {"name": "Test"})
    assert len(avatar.sovereign_guarantees) == 8
    for guarantee in ["Defoneos-secured", "SIGIL-signed", "Maternal Covenant",
                       "BFT council", "4-tier cascade", "Care before code",
                       "No foreign surveillance", "100% you"]:
        assert any(guarantee in g for g in avatar.sovereign_guarantees), f"missing {guarantee}"


def test_avatar_exportable_to_sims():
    """Every MEOK avatar must be exportable to other sims."""
    avatar = import_avatar("apple_memoji", {"name": "Test"})
    assert len(avatar.exportable_to) >= 5
    assert "VRChat" in str(avatar.exportable_to)
    assert "Roblox" in str(avatar.exportable_to)


def test_avatar_to_dict():
    """MEOKAvatar must serialize to dict + JSON."""
    avatar = import_avatar("apple_memoji", {"name": "Test", "emoji": "👑"})
    d = avatar.to_dict()
    assert d["name"] == "Test"
    assert d["archetype"] == "sovereign"
    import json as j
    j_str = avatar.to_json()
    parsed = j.loads(j_str)
    assert parsed["name"] == "Test"


def test_avatar_ocean_personality():
    """OCEAN personality must be in [0, 1] for all 5 traits."""
    avatar = import_avatar("bitmoji", {"name": "Test", "creativity": 0.8, "reliability": 0.9, "social": 0.7})
    for trait, score in avatar.ocean.items():
        assert 0 <= score <= 1, f"{trait}={score} out of bounds"


def test_share_to_x():
    """Share MEOK avatar to X / Twitter."""
    avatar = import_avatar("apple_memoji", {"name": "Sarah", "emoji": "👑"})
    share = share_to_platform(avatar, "x")
    assert share["platform"] == "X / Twitter"
    assert share["avatar_id"] == avatar.ichar_id
    assert "twitter-share" in share["share_endpoint"]


def test_share_to_linkedin():
    """Share MEOK avatar to LinkedIn."""
    avatar = import_avatar("ready_player_me", {"name": "Maya"})
    share = share_to_platform(avatar, "linkedin")
    assert share["platform"] == "LinkedIn"
    assert "linkedin-share" in share["share_endpoint"]


def test_share_to_apple():
    """Share MEOK avatar to Apple ID (Sign in with Apple)."""
    avatar = import_avatar("apple_persona", {"name": "James"})
    share = share_to_platform(avatar, "apple")
    assert share["platform"] == "Apple ID"
    assert "Sign in with Apple" in share["oauth"]


def test_share_to_meta():
    """Share MEOK avatar to Meta (Facebook)."""
    avatar = import_avatar("meta_avatar", {"name": "Carlos"})
    share = share_to_platform(avatar, "meta")
    assert share["platform"] == "Meta"
    assert "Facebook Login" in share["oauth"]


def test_share_to_unknown_platform():
    """Share to unknown platform returns error."""
    avatar = import_avatar("apple_memoji", {"name": "Test"})
    share = share_to_platform(avatar, "myspace")
    assert "error" in share


def test_sigil_hash_unique():
    """Each avatar gets a unique SIGIL hash."""
    a1 = import_avatar("apple_memoji", {"name": "Alice"})
    a2 = import_avatar("apple_memoji", {"name": "Bob"})
    assert a1.sigil_hash != a2.sigil_hash


def test_arcana_creative_detection():
    """Creative avatars get the Lovers arcana (6)."""
    avatar = import_avatar("ready_player_me", {"name": "Creative", "creativity": 0.95})
    assert avatar.arcana_lens == 6


def test_arcana_smart_detection():
    """Smart avatars get the Emperor arcana (4)."""
    avatar = import_avatar("bitmoji", {"name": "Smart", "smart": 0.9, "leader": 0.9})
    assert avatar.arcana_lens == 4


def test_arcana_kindness_detection():
    """Kind avatars get the Star arcana (17)."""
    avatar = import_avatar("apple_persona", {"name": "Kind", "kindness": 0.95})
    assert avatar.arcana_lens == 17


if __name__ == "__main__":
    sys.exit(subprocess.call([sys.executable, "-m", "pytest", __file__, "-v"]))
