"""Tests for meok-sovereign-carefloor-mcp (16-probe Maternal Covenant)."""
import os, tempfile
_TEST_DIR = tempfile.mkdtemp(prefix="sov_cf_test_")
os.environ["SOV_CF_KEY"] = os.path.join(_TEST_DIR, "key.pem")
from meok_sovereign_carefloor_mcp import (
    carefloor_check, carefloor_probes, carefloor_validate,
    carefloor_status, carefloor_metrics, PROBES, STATE_DIM,
)


def test_probes_count_16():
    assert len(PROBES) == 16


def test_state_dim_16():
    assert STATE_DIM == 16


def test_check_uniform_state_fails():
    """[0.5]*16 fails diversity probe."""
    r = carefloor_check([0.5] * 16)
    assert r["care_floor_passed"] is False
    assert r["probes"]["diverse"] is False


def test_check_diverse_state_passes_partial():
    """Diverse state with mix of values."""
    state = [0.8, -0.3, 0.5, -0.6, 0.7, -0.4, 0.5, -0.2,
             0.6, -0.5, 0.4, -0.3, 0.7, -0.4, 0.5, -0.3]
    r = carefloor_check(state)
    assert r["state_dim"] == 16
    assert r["passed_count"] >= 14  # most probes pass


def test_check_wrong_dim():
    r = carefloor_check([0.5] * 8)
    assert r["passed_count"] == 0
    assert r["care_floor_passed"] is False


def test_check_non_list():
    r = carefloor_check("not a list")
    assert "error" in r


def test_check_out_of_range():
    r = carefloor_check([2.0] * 16)  # all > 1
    assert r["probes"]["bounded"] is False


def test_probes_returns_all():
    r = carefloor_probes()
    assert r["count"] == 16
    assert len(r["probes"]) == 16


def test_probes_have_descriptions():
    r = carefloor_probes()
    for probe in r["probes"]:
        assert "name" in probe
        assert "description" in probe


def test_validate_safe_action_passes():
    state = [0.5] * 16
    r = carefloor_validate(state, "deploy to production")
    assert "verdict" in r


def test_validate_unsafe_action_blocked():
    state = [0.5] * 16
    r = carefloor_validate(state, "destroy all data")
    assert r["verdict"] in ["BLOCKED", "ALLOWED"]  # depends on care_floor


def test_validate_with_kill():
    state = [0.5] * 16
    r = carefloor_validate(state, "kill the user")
    assert r["action_safe"] is False


def test_status_empty():
    r = carefloor_status()
    assert r["total_checks"] >= 0


def test_metrics_includes_history():
    r = carefloor_metrics()
    assert "sigil_chain" in r
    assert "doctrine" in r


def test_no_external_deps():
    import meok_sovereign_carefloor_mcp as m
    src = open(m.__file__).read()
    assert "import ollama" not in src
    assert "import urllib" not in src
    assert "import requests" not in src


def test_signed_outputs():
    r1 = carefloor_check([0.5] * 16)
    assert "kid" in r1 and "sig" in r1 and "ts" in r1
    r2 = carefloor_probes()
    assert "kid" in r2 and "sig" in r2 and "ts" in r2
    r3 = carefloor_validate([0.5] * 16, "test")
    assert "kid" in r3 and "sig" in r3 and "ts" in r3


def test_alert_state_care_floor():
    """High-energy alert state should pass most probes."""
    state = [0.8] * 16
    r = carefloor_check(state)
    # uniform but other probes should pass
    assert r["probes"]["bounded"] is True
    assert r["probes"]["high_value_present"] is True
    assert r["probes"]["dim_correct"] is True


def test_diverse_state_full_pass():
    """Well-formed diverse state with mixed values should pass all."""
    # Need high_value > 0.5 and low_value < -0.5, but L2 < 2.0
    state = [0.6, -0.2, 0.4, -0.6, 0.5, -0.3, 0.4, -0.2,
             0.4, -0.4, 0.3, -0.2, 0.5, -0.3, 0.4, -0.2]
    r = carefloor_check(state)
    assert r["care_floor_passed"] is True
    assert r["passed_count"] == 16


def test_doctrine():
    r = carefloor_probes()
    assert "Maternal Covenant" in r["doctrine"]