"""Tests for meok-sovereign-telemetry-mcp."""
import os, tempfile
_TEST_DIR = tempfile.mkdtemp(prefix="sov_tele_test_")
os.environ["SOV_TELE_KEY"] = os.path.join(_TEST_DIR, "key.pem")
from meok_sovereign_telemetry_mcp import (
    telemetry_emit, telemetry_get_recent, telemetry_care_floor,
    telemetry_bft, telemetry_sigil,
)
from meok_sovereign_telemetry_mcp import _LOG
import meok_sovereign_telemetry_mcp as t_mod


def reset_log():
    _LOG.clear()


def test_emit_basic():
    reset_log()
    r = telemetry_emit("test", "argus", {"x": 1})
    assert r["event_type"] == "test"
    assert r["actor"] == "argus"
    assert "kid" in r


def test_get_recent_all():
    reset_log()
    for i in range(5):
        telemetry_emit("test", f"actor_{i}")
    r = telemetry_get_recent(limit=10)
    assert r["count"] == 5


def test_get_recent_filtered_by_type():
    reset_log()
    telemetry_emit("care_floor_check", "argus")
    telemetry_emit("bft_vote", "dragon")
    r = telemetry_get_recent(event_type="care_floor_check")
    assert r["count"] == 1
    assert r["matches"][0]["event_type"] == "care_floor_check"


def test_get_recent_filtered_by_actor():
    reset_log()
    telemetry_emit("test", "dragon")
    telemetry_emit("test", "scribe")
    r = telemetry_get_recent(actor="dragon")
    assert r["count"] == 1
    assert r["matches"][0]["actor"] == "dragon"


def test_care_floor_filter():
    reset_log()
    telemetry_emit("care_floor_check", "argus", {"probes_passed": 16})
    telemetry_emit("bft_vote", "dragon")
    r = telemetry_care_floor()
    assert r["count"] == 1


def test_bft_filter():
    reset_log()
    telemetry_emit("bft_propose", "dragon", {"title": "Test"})
    telemetry_emit("bft_vote", "scribe", {"vote": "for"})
    telemetry_emit("care_floor_check", "argus")
    r = telemetry_bft()
    assert r["count"] == 2


def test_sigil_summary():
    reset_log()
    telemetry_emit("sigil_emit", "argus")
    telemetry_emit("sigil_verify", "scribe")
    telemetry_emit("test", "dragon")
    r = telemetry_sigil()
    assert r["sigil_count"] == 2
    assert r["total_events"] == 3


def test_sigil_empty():
    reset_log()
    r = telemetry_sigil()
    assert r["sigil_count"] == 0
    assert r["recent_sigil"] is None


def test_no_external_deps():
    import meok_sovereign_telemetry_mcp as m
    src = open(m.__file__).read()
    assert "import ollama" not in src
    assert "import urllib" not in src
    assert "import requests" not in src


def test_signed_outputs():
    reset_log()
    r1 = telemetry_emit("test", "argus")
    assert "kid" in r1 and "sig" in r1 and "ts" in r1
    r2 = telemetry_get_recent()
    assert "kid" in r2 and "sig" in r2 and "ts" in r2
    r3 = telemetry_care_floor()
    assert "kid" in r3 and "sig" in r3 and "ts" in r3
    r4 = telemetry_bft()
    assert "kid" in r4 and "sig" in r4 and "ts" in r4
    r5 = telemetry_sigil()
    assert "kid" in r5 and "sig" in r5 and "ts" in r5


def test_emit_complex_payload():
    reset_log()
    r = telemetry_emit("care_floor_check", "argus",
                      {"probes": {"bounded": True, "diverse": True},
                       "state": [0.5, 0.6, 0.7, 0.8, 0.9, 0.4, 0.3, 0.2, -0.1, -0.2, -0.3, -0.4, -0.5, -0.6, -0.7, -0.8]})
    assert r["payload"]["probes"]["bounded"] is True


def test_persistence():
    """Test that events are persisted to disk."""
    reset_log()
    telemetry_emit("test_persist", "argus", {"x": 1})
    assert t_mod.LOG_PATH.exists()
    # File should have at least one line
    with open(t_mod.LOG_PATH) as f:
        lines = f.readlines()
    assert len(lines) >= 1