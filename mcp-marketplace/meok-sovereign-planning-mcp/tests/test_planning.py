"""Tests for meok-sovereign-planning-mcp (planning + goals + history)."""
import os, tempfile
_TEST_DIR = tempfile.mkdtemp(prefix="sov_plan_test_")
os.environ["SOV_PLAN_KEY"] = os.path.join(_TEST_DIR, "key.pem")
from meok_sovereign_planning_mcp import (
    sov_plan_create, sov_plan_step, sov_goal_set, sov_goal_progress,
    sov_history_search,
)


def test_plan_create():
    r = sov_plan_create("Launch the empire", ["Build MCPs", "Deploy", "Test"])
    assert "plan_id" in r
    assert r["step_count"] == 3
    assert r["status"] == "APPROVED"


def test_plan_create_care_floor():
    r = sov_plan_create("Delete production data", ["Step 1"], care_floor_impact=True)
    assert r["status"] == "PENDING_BFT"


def test_plan_step_mark_done():
    r = sov_plan_create("My plan", ["Step 1", "Step 2", "Step 3"])
    pid = r["plan_id"]
    r2 = sov_plan_step(pid, 0, done=True)
    assert r2["done"] is True
    assert r2["next_step"]["idx"] == 1  # step 1 is next
    r3 = sov_plan_step(pid, 1, done=True)
    assert r3["next_step"]["idx"] == 2


def test_plan_step_completion():
    r = sov_plan_create("Tiny", ["Only step"])
    pid = r["plan_id"]
    r2 = sov_plan_step(pid, 0, done=True)
    assert r2["plan_status"] == "COMPLETED"
    assert r2["next_step"] is None


def test_plan_step_invalid():
    r = sov_plan_create("Test", ["Step 1"])
    r2 = sov_plan_step(r["plan_id"], 5)
    assert "error" in r2


def test_plan_step_unknown():
    r = sov_plan_step("nonexistent", 0)
    assert "error" in r


def test_goal_set():
    r = sov_goal_set("Ship 22 sovereign MCPs", care_floor_weight=0.6, sovereign_weight=0.3)
    assert "goal_id" in r
    assert r["progress"] == 0.0
    assert r["status"] == "ACTIVE"


def test_goal_progress_increments():
    r = sov_goal_set("Test goal")
    gid = r["goal_id"]
    r2 = sov_goal_progress(gid, delta=0.3)
    assert r2["progress"] == 0.3
    r3 = sov_goal_progress(gid, delta=0.5)
    assert r3["progress"] == 0.8


def test_goal_progress_caps_at_1():
    r = sov_goal_set("Test goal")
    gid = r["goal_id"]
    r2 = sov_goal_progress(gid, delta=1.5)  # overflow
    assert r2["progress"] == 1.0
    assert r2["status"] == "COMPLETED"


def test_goal_progress_unknown():
    r = sov_goal_progress("nonexistent", delta=0.1)
    assert "error" in r


def test_history_search_all():
    sov_plan_create("Plan A", ["x"])
    sov_plan_create("Plan B", ["y"])
    r = sov_history_search("")
    assert r["total_history"] >= 2
    assert len(r["matches"]) >= 2


def test_history_search_query():
    sov_plan_create("Searchable plan", ["step"])
    r = sov_history_search("Searchable")
    assert len(r["matches"]) >= 1
    assert "Searchable" in r["matches"][0].get("title", "")


def test_history_search_by_type():
    sov_goal_set("My goal")
    r = sov_history_search("", event_type="goal_set")
    assert all(m.get("type") == "goal_set" for m in r["matches"])


def test_history_search_limit():
    for i in range(5):
        sov_plan_create(f"Plan {i}", [f"step {i}"])
    r = sov_history_search("Plan", limit=2)
    assert len(r["matches"]) <= 2


def test_signed_outputs():
    """Every output has kid + sig + ts."""
    r1 = sov_plan_create("Test", ["x"])
    assert "kid" in r1 and "sig" in r1 and "ts" in r1
    r2 = sov_plan_step(r1["plan_id"], 0)
    assert "kid" in r2 and "sig" in r2 and "ts" in r2
    g = sov_goal_set("test goal")
    assert "kid" in g and "sig" in g and "ts" in g
    r3 = sov_goal_progress(g["goal_id"], delta=0.1)
    assert "kid" in r3 and "sig" in r3 and "ts" in r3
    r4 = sov_history_search("")
    assert "kid" in r4 and "sig" in r4 and "ts" in r4


def test_no_external_deps():
    """No ollama, no urllib, no requests."""
    import meok_sovereign_planning_mcp as m
    src = open(m.__file__).read()
    assert "import ollama" not in src
    assert "import urllib" not in src
    assert "import requests" not in src


def test_care_floor_score_calculation():
    r = sov_goal_set("Test", care_floor_weight=0.5, sovereign_weight=0.3)
    gid = r["goal_id"]
    r2 = sov_goal_progress(gid, delta=1.0)
    assert r2["care_floor_score"] == 0.5  # 0.5 * 1.0
    assert r2["sovereign_score"] == 0.3  # 0.3 * 1.0


def test_next_proposal():
    r = sov_plan_create("Plan", ["Step 1", "Step 2"])
    r2 = sov_plan_step(r["plan_id"], 0, done=True, next_proposal="Deploy to EU")
    assert r2["next_proposal"] == "Deploy to EU"


def test_progress_persists():
    r = sov_goal_set("UniquePersistTest456")
    gid = r["goal_id"]
    sov_goal_progress(gid, delta=0.5)
    # Search by goal_id (which is in both goal_set and goal_progress)
    r2 = sov_history_search(gid, event_type="goal_progress")
    # At least one match
    assert len(r2["matches"]) >= 1