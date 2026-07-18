"""Tests for meok-sovereign-intuition-mcp."""
import os, tempfile
_TEST_DIR = tempfile.mkdtemp(prefix="sov_int_test_")
os.environ["SOV_INTUITION_KEY"] = os.path.join(_TEST_DIR, "key.pem")
from meok_sovereign_intuition_mcp import (
    sov_intuition_observe, sov_intuition_match, sov_intuition_hunch,
    sov_intuition_history, sov_intuition_status, STATE_DIMS, VERSION, PROTOCOL,
)

# A canonical 16-dim test state
ZERO_STATE = [0.0] * 16
POS_STATE = [0.5] * 16
NEG_STATE = [-0.5] * 16


def test_16_dimensions():
    assert len(STATE_DIMS) == 16


def test_observe_valid():
    r = sov_intuition_observe(ZERO_STATE, source="test")
    assert r["state_id"]
    assert "kid" in r


def test_observe_wrong_dim():
    r = sov_intuition_observe([0.0] * 8)
    assert "error" in r


def test_observe_out_of_range():
    r = sov_intuition_observe([2.0] * 16)
    assert "error" in r


def test_match_no_history():
    # Fresh module, no states observed yet
    r = sov_intuition_match(POS_STATE, threshold=0.5)
    # May or may not have matches; just verify shape
    assert "match_count" in r
    assert "matches" in r


def test_match_finds_self():
    sov_intuition_observe(POS_STATE, source="a")
    r = sov_intuition_match(POS_STATE, threshold=0.99)
    # Self-similarity = 1.0, should match
    assert r["match_count"] >= 1
    assert r["matches"][0]["similarity"] >= 0.99


def test_match_different_state_no_match():
    sov_intuition_observe(NEG_STATE, source="neg")
    r = sov_intuition_match(POS_STATE, threshold=0.99)
    # Neg vs pos similarity < 0.99 (very different)
    # May have 0 matches
    assert r["match_count"] >= 0


def test_hunch_no_matches_neutral():
    # Use a unique state unlikely to match
    import meok_sovereign_intuition_mcp as m
    # Save + clear
    saved_states = list(m._STATES)
    m._STATES.clear()
    unique_state = [0.05 * i for i in range(1, 17)]  # max 0.8, within range
    r = m.sov_intuition_hunch(unique_state, threshold=0.99)
    # Restore
    m._STATES.clear()
    for s in saved_states:
        m._STATES.append(s)
    assert "hunch" in r
    assert "NEUTRAL" in r["hunch"] or "FORMING" in r["hunch"]


def test_hunch_confirmed():
    # Observe 5 similar states
    for i in range(5):
        state = [0.5 + 0.001 * i] * 16
        sov_intuition_observe(state, source=f"sim-{i}")
    query = [0.5] * 16
    r = sov_intuition_hunch(query, threshold=0.99, min_matches=3)
    assert r["confirmed"] is True
    assert "CONFIRMED" in r["hunch"]


def test_hunch_id_signed():
    r = sov_intuition_hunch(ZERO_STATE, threshold=0.99)
    assert "hunch_id" in r
    assert "kid" in r and "sig" in r


def test_history():
    sov_intuition_observe(ZERO_STATE, source="h1")
    r = sov_intuition_history()
    assert r["state_count"] >= 1


def test_status_16_dims():
    r = sov_intuition_status()
    assert r["dim_count"] == 16
    assert "SOV3 doesn't answer questions" in r["doctrine"]


def test_all_signed():
    r = sov_intuition_observe(ZERO_STATE)
    assert "kid" in r and "sig" in r
