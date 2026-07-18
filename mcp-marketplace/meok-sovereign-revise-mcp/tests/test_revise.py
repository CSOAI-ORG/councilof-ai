"""Tests for meok-sovereign-revise-mcp."""
import os, tempfile
_TEST = tempfile.mkdtemp(prefix="sov_rev_")
os.environ["SOV_REV_KEY"] = _TEST + "/k.pem"
from meok_sovereign_revise_mcp import (
    revision_check, revision_run, revision_history, revision_schedule, revision_trigger,
    _HISTORY, SCHEDULE, _REVISION_TRIGGERS,
)


def reset():
    _HISTORY.clear()


def test_5_schedule_tiers():
    assert len(SCHEDULE) == 5


def test_5_triggers():
    assert len(_REVISION_TRIGGERS) == 5


def test_revision_check_normal():
    reset()
    r = revision_check(7.305)
    assert r["needs_revision"] is False
    assert r["current_composite"] == 7.305


def test_revision_check_below_threshold():
    reset()
    r = revision_check(6.5)
    assert r["needs_revision"] is True
    assert "composite_drop" in r["triggers_fired"]


def test_revision_check_care_floor():
    reset()
    r = revision_check(0.5)
    assert r["needs_revision"] is True
    assert "composite_drop" in r["triggers_fired"]
    assert "care_floor_violation" in r["triggers_fired"]


def test_revision_run_delta():
    reset()
    r = revision_run("delta", "auto")
    assert r["revision"]["scope"] in ("delta", "daily")
    assert r["status"] == "completed"


def test_revision_run_weekly():
    reset()
    r = revision_run("weekly", "scheduled")
    assert r["revision"]["outputs"]["bft_weights_updated"] is True


def test_revision_run_quarterly():
    reset()
    r = revision_run("quarterly", "scheduled")
    assert r["revision"]["outputs"]["bft_weights_updated"] is True
    assert r["revision"]["outputs"]["sigil_chain_anchored"] is True


def test_revision_run_invalid():
    reset()
    r = revision_run("invalid")
    assert "error" in r


def test_revision_history_empty():
    reset()
    r = revision_history()
    assert r["total_revisions"] == 0


def test_revision_history_with_entries():
    reset()
    revision_run("daily")
    revision_run("weekly")
    r = revision_history()
    assert r["total_revisions"] == 2


def test_revision_history_limit():
    reset()
    for _ in range(5):
        revision_run("daily")
    r = revision_history(limit=3)
    assert len(r["recent"]) == 3


def test_revision_schedule():
    r = revision_schedule()
    assert "schedule" in r
    assert "triggers" in r
    assert len(r["schedule"]) == 5


def test_revision_trigger_valid():
    reset()
    r = revision_trigger("composite_drop", "test")
    assert r["revision"]["trigger"] == "composite_drop"
    assert r["status"] == "queued"


def test_revision_trigger_citizen_request():
    reset()
    r = revision_trigger("citizen_request", "user feedback")
    assert r["revision"]["trigger"] == "citizen_request"


def test_revision_trigger_invalid():
    reset()
    r = revision_trigger("invalid_trigger")
    assert "error" in r


def test_all_triggers_valid():
    for t in _REVISION_TRIGGERS:
        r = revision_trigger(t)
        assert "error" not in r, f"Trigger {t} failed"


def test_no_external_deps():
    import meok_sovereign_revise_mcp as m
    src = open(m.__file__).read()
    assert "import ollama" not in src
    assert "import requests" not in src


def test_signed_outputs():
    reset()
    for r in [revision_check(7.305), revision_schedule(), revision_history()]:
        assert "kid" in r and "sig" in r and "ts" in r


def test_full_workflow():
    """Check → Run → Trigger → Check again → History."""
    reset()
    # Normal state
    r1 = revision_check(7.305)
    assert r1["needs_revision"] is False
    # Trigger a major revision
    r2 = revision_run("weekly", "scheduled")
    assert r2["status"] == "completed"
    # Manual trigger
    r3 = revision_trigger("citizen_request", "user requested")
    assert r3["status"] == "queued"
    # Now composite drops
    r4 = revision_check(6.0)
    assert r4["needs_revision"] is True
    # History has all
    h = revision_history()
    assert h["total_revisions"] >= 2
