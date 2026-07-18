"""Tests for Council Personality Engine — the next-level inner feature."""
import sys
import subprocess
from pathlib import Path

ROOT = Path("/Users/nicholas/clawd/csoai-os")
CP = ROOT / "council_personality.py"


def test_file_exists():
    assert CP.exists()
    assert CP.stat().st_size > 10000


def test_13_queens():
    """All 13 queens + King must be defined."""
    from council_personality import QUEEN_PERSONALITIES
    expected = [
        "queen-king", "queen-strategy", "queen-care", "queen-compliance",
        "queen-finance", "queen-domain", "queen-arcana", "queen-brain",
        "queen-proactive", "queen-bridge", "queen-distribution",
        "queen-council", "queen-watch",
    ]
    for q in expected:
        assert q in QUEEN_PERSONALITIES, f"missing {q}"


def test_2_veto_queens():
    """Sophia Care + Watch must be VETO queens."""
    from council_personality import QUEEN_PERSONALITIES
    assert QUEEN_PERSONALITIES["queen-care"].veto is True
    assert QUEEN_PERSONALITIES["queen-watch"].veto is True
    assert QUEEN_PERSONALITIES["queen-king"].veto is False


def test_all_22_arcanas():
    """All 22 Major Arcana lenses must be defined."""
    from council_personality import ARCANA_LENSES
    assert len(ARCANA_LENSES) == 22
    for i in range(22):
        assert i in ARCANA_LENSES, f"missing arcana {i}"


def test_synthesize_works():
    """Synthesize must work for any queen + arcana combo."""
    from council_personality import synthesize_personality
    for queen in ["queen-arcana", "queen-care", "queen-king"]:
        for arcana in [0, 21, 11, 16]:
            p = synthesize_personality(queen, arcana)
            assert p["queen"]
            assert p["arcana_lens"] == arcana
            assert 0 <= p["personality"]["openness"] <= 1
            assert 0 <= p["personality"]["conscientiousness"] <= 1
            assert 0 <= p["personality"]["extraversion"] <= 1
            assert 0 <= p["personality"]["agreeableness"] <= 1
            assert 0 <= p["personality"]["neuroticism"] <= 1


def test_speak_works():
    """speak() must produce a quote from the queen's voice."""
    from council_personality import speak
    result = speak("queen-care", 17, "harm prevention")
    assert "Sophia Care" in result
    assert "harm" in result.lower() or "care" in result.lower()
    # Non-existent queen
    result_none = speak("queen-nonexistent", 0, "anything")
    assert "silent" in result_none.lower() or "unknown" in result_none.lower()


def test_get_queen():
    """get_queen returns the queen profile or None."""
    from council_personality import get_queen
    q = get_queen("queen-king")
    assert q.name == "Sovereign King"
    assert q.emoji == "👑"
    assert q.color == "#c9a84c"
    assert get_queen("nonexistent") is None


def test_get_arcana():
    """get_arcana returns the lens description or None."""
    from council_personality import get_arcana
    assert "Fool" in get_arcana(0)
    assert "World" in get_arcana(21)
    assert get_arcana(99) is None


def test_long_form_quotes():
    """Every queen must have a meaningful long_form bio."""
    from council_personality import QUEEN_PERSONALITIES
    for q_id, q in QUEEN_PERSONALITIES.items():
        assert len(q.long_form) > 50, f"{q_id} long_form too short"


def test_personality_bounds():
    """All personality scores must be in [0, 1]."""
    from council_personality import QUEEN_PERSONALITIES, synthesize_personality
    for q_id, q in QUEEN_PERSONALITIES.items():
        for trait, score in q.personality.as_dict().items():
            assert 0 <= score <= 1, f"{q_id}.{trait} = {score} out of bounds"
    # Also check synthesized (the personality section is still a dict here for backward compat)
    for queen in ["queen-king", "queen-arcana", "queen-watch"]:
        for arcana in [0, 11, 21]:
            p = synthesize_personality(queen, arcana)
            assert p["synthesized"] is True
            for trait, score in p["personality"].items():
                assert 0 <= score <= 1, f"synth {queen}/{arcana}.{trait} = {score}"


if __name__ == "__main__":
    sys.exit(subprocess.call([sys.executable, "-m", "pytest", __file__, "-v"]))
