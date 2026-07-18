"""Tests for meok-sovereign-launch-sequencer-mcp."""
import os, sys, tempfile, importlib
_TEST = tempfile.mkdtemp(prefix="sov_launch_")
os.environ["SOV_LAUNCH_KEY"] = _TEST + "/k.pem"

def get_fresh():
    if "meok_sovereign_launch_sequencer_mcp" in sys.modules:
        del sys.modules["meok_sovereign_launch_sequencer_mcp"]
    import meok_sovereign_launch_sequencer_mcp as m
    importlib.reload(m)
    return m

def test_countdown():
    m = get_fresh()
    r = m.launch_countdown()
    assert "t_minus" in r or "T+" in r["t_minus"]

def test_countdown_format():
    m = get_fresh()
    r = m.launch_countdown()
    assert "phase" in r
    assert r["target"] == "2026-07-04T09:00:00+01:00"

def test_milestone():
    m = get_fresh()
    r = m.launch_milestone("Test milestone")
    assert "milestone" in r

def test_milestone_no_title():
    m = get_fresh()
    r = m.launch_milestone("")
    assert "error" in r

def test_milestone_with_status():
    m = get_fresh()
    r = m.launch_milestone("Test", "in_progress")
    assert r["milestone"]["status"] == "in_progress"

def test_checklist():
    m = get_fresh()
    r = m.launch_checklist()
    assert r["passing"] >= 12
    assert r["all_passed"] is True

def test_checklist_go():
    m = get_fresh()
    r = m.launch_checklist()
    assert r["go_for_launch"] is True

def test_sequence_all():
    m = get_fresh()
    r = m.launch_sequence("all")
    assert len(r["sequence"]) == 10

def test_sequence_step():
    m = get_fresh()
    r = m.launch_sequence("5")
    assert len(r["sequence"]) == 1
    assert r["sequence"][0]["step"] == 5

def test_sequence_invalid():
    m = get_fresh()
    r = m.launch_sequence("abc")
    assert "error" in r

def test_sequence_out_of_range():
    m = get_fresh()
    r = m.launch_sequence("99")
    assert "error" in r

def test_status():
    m = get_fresh()
    r = m.launch_status()
    assert r["target"] == "2026-07-04T09:00:00+01:00"

def test_no_external_deps():
    m = get_fresh()
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src

def test_signed_outputs():
    m = get_fresh()
    for r in [m.launch_countdown(), m.launch_milestone("x"),
              m.launch_checklist(), m.launch_sequence("all"), m.launch_status()]:
        assert "kid" in r and "sig" in r and "ts" in r

def test_full_workflow():
    """Countdown → Milestone → Checklist → Sequence → Status."""
    m = get_fresh()
    r1 = m.launch_countdown()
    assert "t_minus" in r1
    r2 = m.launch_milestone("Pre-launch complete")
    assert r2["total_milestones"] == 1
    r3 = m.launch_checklist()
    assert r3["go_for_launch"] is True
    r4 = m.launch_sequence("all")
    assert len(r4["sequence"]) == 10
    s = m.launch_status()
    assert s["milestones_logged"] == 1

def test_12_checklist_items():
    m = get_fresh()
    assert len(m.CHECKLIST) == 12
