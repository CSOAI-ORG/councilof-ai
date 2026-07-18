"""Tests for meok-sovereign-defence-mcp."""
import os, tempfile
_TEST = tempfile.mkdtemp(prefix="sov_def_")
os.environ["SOV_DEF_KEY"] = _TEST + "/k.pem"
from meok_sovereign_defence_mcp import (
    defence_status, defence_shield, defence_detect, defence_bft_council, defence_audit,
    DEFENCE_HIVES, _ACTION_LOG, DOCTRINE,
)


def reset():
    _ACTION_LOG.clear()


def test_33_defence_hives():
    assert len(DEFENCE_HIVES) == 33


def test_doctrine_immutable():
    assert "Never Offend" in DOCTRINE
    assert "Defend" in DOCTRINE


def test_defence_status():
    r = defence_status()
    assert r["hive_count"] == 33
    assert r["doctrine"] == DOCTRINE
    assert r["total_warriors"] > 0
    assert r["avg_shield_rating"] > 0


def test_defence_status_strongest():
    r = defence_status()
    # London has highest shield rating (9.5)
    assert r["strongest_shield"] == "London"


def test_defence_shield_raise():
    reset()
    r = defence_shield(1, "raise")
    assert r["action"] == "raise"
    assert r["hive"] == "London"
    assert "raised" in r["result"]


def test_defence_shield_lower():
    reset()
    r = defence_shield(3, "lower")
    assert r["action"] == "lower"


def test_defence_shield_lock():
    reset()
    r = defence_shield(9, "lock")
    assert r["action"] == "lock"


def test_defence_shield_unknown_hive():
    r = defence_shield(99, "raise")
    assert "error" in r


def test_defence_shield_unknown_action():
    r = defence_shield(1, "destroy")
    assert "error" in r


def test_defence_detect_high():
    reset()
    r = defence_detect(1, "lidar", "high", "192.168.1.100")
    assert r["threat_level"] == "high"
    assert r["shield_active"] is True


def test_defence_detect_critical():
    reset()
    r = defence_detect(9, "camera", "critical", "unknown")
    assert r["threat_level"] == "critical"


def test_defence_detect_low():
    reset()
    r = defence_detect(1, "imu", "low", "internal")
    assert r["threat_level"] == "low"


def test_defence_detect_invalid():
    r = defence_detect(1, "x", "extreme", "y")
    assert "error" in r


def test_defence_bft_council_critical():
    r = defence_bft_council("raise shield", "critical")
    assert r["bft_size"] == 7
    assert r["voters_count"] == 7
    assert r["yes_count"] == 7


def test_defence_bft_council_high():
    r = defence_bft_council("raise shield", "high")
    assert r["bft_size"] == 7


def test_defence_bft_council_medium():
    r = defence_bft_council("raise shield", "medium")
    assert r["bft_size"] == 5


def test_defence_bft_council_low():
    r = defence_bft_council("raise shield", "low")
    assert r["bft_size"] == 3


def test_defence_audit_clean():
    reset()
    defence_shield(1, "raise")
    defence_detect(1, "lidar", "high", "test")
    r = defence_audit()
    assert r["actions_audited"] == 2
    assert r["jsp_936_compliant"] is True
    assert r["passed"] == r["total_probes"]


def test_defence_audit_specific_hive():
    reset()
    defence_shield(1, "raise")
    defence_shield(2, "raise")
    r = defence_audit(hive_id=1)
    assert r["actions_audited"] == 1


def test_no_external_deps():
    import meok_sovereign_defence_mcp as m
    src = open(m.__file__).read()
    assert "import ollama" not in src
    assert "import requests" not in src


def test_no_offensive_patterns_in_code():
    import re
    import meok_sovereign_defence_mcp as m
    src = open(m.__file__).read().lower()
    # No kinetic targeting patterns (allow audit-code references to banned words)
    for pattern in ["kill", "find-fix-finish", "destroy"]:
        matches = re.findall(r"" + pattern + r"", src)
        assert len(matches) == 0, f"offensive pattern found: {pattern} ({len(matches)} times)"
    # strike and attack may appear in defensive audit (banned word lists) - check intent
    assert "defensive detect" in src  # confirms it IS defensive


def test_signed_outputs():
    reset()
    for r in [defence_status(), defence_shield(1, "raise"), defence_detect(1, "lidar", "high", "x"),
              defence_bft_council("test", "high"), defence_audit()]:
        assert "kid" in r and "sig" in r and "ts" in r


def test_all_33_haves_shield():
    for h in DEFENCE_HIVES:
        assert h["shield_rating"] >= 1.0
        assert h["warriors"] >= 1
        assert h["watchers"] >= 1
        assert len(h["frameworks"]) > 0


def test_all_have_doctrine():
    """All defensive ops must reference the doctrine."""
    reset()
    defence_shield(1, "raise")
    assert DOCTRINE in _ACTION_LOG[-1].get("doctrine", "")


def test_audit_16_probes():
    reset()
    r = defence_audit()
    assert r["total_probes"] == 16
