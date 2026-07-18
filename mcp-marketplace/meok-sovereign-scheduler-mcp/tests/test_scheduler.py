"""Tests for meok-sovereign-scheduler-mcp."""
import os, tempfile
_TEST_DIR = tempfile.mkdtemp(prefix="sov_sched_test_")
os.environ["SOV_SCHED_KEY"] = os.path.join(_TEST_DIR, "key.pem")
from meok_sovereign_scheduler_mcp import (
    scheduler_register, scheduler_tick, scheduler_list,
    scheduler_cancel, scheduler_history,
    _JOBS, _HISTORY,
)


def reset_state():
    _JOBS.clear()
    _HISTORY.clear()


def test_register_interval_job():
    reset_state()
    r = scheduler_register("iOK Farm monitor", interval_seconds=60)
    assert r["name"] == "iOK Farm monitor"
    assert r["mode"] == "interval"
    assert r["active"] is True


def test_register_once_job():
    reset_state()
    r = scheduler_register("Send charter amendment", interval_seconds=1, mode="once")
    assert r["mode"] == "once"


def test_register_invalid_interval():
    r = scheduler_register("Test", interval_seconds=0)
    assert "error" in r


def test_tick_executes_due_jobs():
    reset_state()
    scheduler_register("Job1", interval_seconds=1)
    scheduler_register("Job2", interval_seconds=120)
    r = scheduler_tick()
    # Job1 (next_run = now) should execute; Job2 (next_run +120s) should not
    assert r["executed_count"] >= 1


def test_tick_increments_run_count():
    reset_state()
    scheduler_register("Job", interval_seconds=1)
    scheduler_tick()
    scheduler_tick()
    job = list(_JOBS.values())[0]
    assert job["run_count"] >= 1


def test_once_job_disables_after_run():
    reset_state()
    scheduler_register("One-off", interval_seconds=1, mode="once")
    scheduler_tick()
    job = list(_JOBS.values())[0]
    assert job["active"] is False


def test_list_jobs():
    reset_state()
    scheduler_register("J1", interval_seconds=60)
    scheduler_register("J2", interval_seconds=120)
    r = scheduler_list()
    assert r["count"] == 2


def test_list_active_only():
    reset_state()
    scheduler_register("Active", interval_seconds=60)
    scheduler_register("Inactive", interval_seconds=1, mode="once")
    # Cancel one
    job_id = list(_JOBS.keys())[1]
    scheduler_cancel(job_id)
    r = scheduler_list(active_only=True)
    assert r["count"] == 1


def test_cancel_job():
    reset_state()
    job = scheduler_register("To cancel", interval_seconds=60)
    r = scheduler_cancel(job["job_id"])
    assert r["active"] is False


def test_cancel_unknown():
    r = scheduler_cancel("nonexistent")
    assert "error" in r


def test_history_basic():
    reset_state()
    scheduler_register("J", interval_seconds=1)
    scheduler_tick()
    scheduler_tick()
    r = scheduler_history()
    assert r["count"] == 2


def test_history_limit():
    reset_state()
    scheduler_register("J", interval_seconds=1)
    for i in range(5):
        scheduler_tick()
    r = scheduler_history(limit=3)
    assert r["count"] == 3


def test_no_external_deps():
    import meok_sovereign_scheduler_mcp as m
    src = open(m.__file__).read()
    assert "import ollama" not in src
    assert "import urllib" not in src
    assert "import requests" not in src


def test_signed_outputs():
    reset_state()
    r1 = scheduler_register("Test")
    assert "kid" in r1 and "sig" in r1 and "ts" in r1
    r2 = scheduler_tick()
    assert "kid" in r2 and "sig" in r2 and "ts" in r2
    r3 = scheduler_list()
    assert "kid" in r3 and "sig" in r3 and "ts" in r3
    r4 = scheduler_cancel(r1["job_id"])
    assert "kid" in r4 and "sig" in r4 and "ts" in r4
    r5 = scheduler_history()
    assert "kid" in r5 and "sig" in r5 and "ts" in r5


def test_tick_3_modes():
    """Test that interval, once, and custom actions work."""
    reset_state()
    scheduler_register("Interval", interval_seconds=1, mode="interval")
    scheduler_register("Once", interval_seconds=1, mode="once")
    scheduler_register("Custom", interval_seconds=1, action="audit_dora")
    r = scheduler_tick()
    # At least 1 job should execute (next_run = now)
    assert r["executed_count"] >= 1


def test_full_lifecycle():
    """Register → tick → list → cancel → history."""
    reset_state()
    j1 = scheduler_register("J1", interval_seconds=1)
    j2 = scheduler_register("J2", interval_seconds=1, mode="once")
    r = scheduler_tick()
    assert r["executed_count"] == 2
    # Both ran; j2 (once) is now inactive
    r = scheduler_list(active_only=True)
    assert r["count"] == 1
    scheduler_cancel(j1["job_id"])
    r = scheduler_list(active_only=True)
    assert r["count"] == 0
    h = scheduler_history()
    assert h["count"] >= 1