"""Tests for meok-sovereign-coordination-mcp (cross-General tasks)."""
import os, tempfile
_TEST_DIR = tempfile.mkdtemp(prefix="sov_coord_test_")
os.environ["SOV_COORD_KEY"] = os.path.join(_TEST_DIR, "key.pem")
from meok_sovereign_coordination_mcp import (
    coord_create_task, coord_assign, coord_status, coord_list, coord_complete,
    TASKS, GENERALS,
)


def reset_tasks():
    TASKS.clear()


def test_create_task_basic():
    reset_tasks()
    r = coord_create_task("Deploy sovereign-globe-mcp", "Ship to PyPI")
    assert r["status"] == "PENDING"
    assert r["title"] == "Deploy sovereign-globe-mcp"
    assert r["care_floor_impact"] is False


def test_create_task_care_floor():
    reset_tasks()
    r = coord_create_task("Lower care floor", "Change 6.5 to 6.0", care_floor_impact=True)
    assert r["care_floor_impact"] is True


def test_create_task_bft_mode():
    reset_tasks()
    r = coord_create_task("Charter amendment", "Modify Art. 7", bft_mode="secure")
    assert r["bft_mode"] == "secure"


def test_assign_valid():
    reset_tasks()
    r = coord_create_task("Test", "Test")
    pid = r["task_id"]
    r2 = coord_assign(pid, ["dragon", "scribe"])
    assert "dragon" in r2["assignees"]
    assert "scribe" in r2["assignees"]
    assert r2["status"] == "ASSIGNED"


def test_assign_unknown_general():
    reset_tasks()
    r = coord_create_task("Test", "Test")
    pid = r["task_id"]
    r2 = coord_assign(pid, ["hacker"])
    assert "error" in r2


def test_assign_unknown_task():
    r = coord_assign("nonexistent", ["dragon"])
    assert "error" in r


def test_status_existing():
    reset_tasks()
    r = coord_create_task("Test", "Test")
    r2 = coord_status(r["task_id"])
    assert r2["title"] == "Test"


def test_status_unknown():
    r = coord_status("nonexistent")
    assert "error" in r


def test_list_all():
    reset_tasks()
    coord_create_task("T1", "D1")
    coord_create_task("T2", "D2")
    r = coord_list()
    assert r["count"] == 2


def test_list_filtered_by_status():
    reset_tasks()
    t1 = coord_create_task("T1", "D1")
    t2 = coord_create_task("T2", "D2")
    coord_complete(t1["task_id"])
    r = coord_list(status="COMPLETED")
    assert r["count"] == 1


def test_list_filtered_by_assignee():
    reset_tasks()
    t = coord_create_task("T1", "D1")
    coord_assign(t["task_id"], ["dragon"])
    r = coord_list(assignee="dragon")
    assert r["count"] == 1


def test_complete():
    reset_tasks()
    r = coord_create_task("T", "D")
    pid = r["task_id"]
    r2 = coord_complete(pid)
    assert r2["status"] == "COMPLETED"
    assert r2["completed_at"] is not None


def test_complete_unknown():
    r = coord_complete("nonexistent")
    assert "error" in r


def test_12_generals():
    assert len(GENERALS) == 12
    assert "dragon" in GENERALS
    assert "scribe" in GENERALS


def test_no_external_deps():
    import meok_sovereign_coordination_mcp as m
    src = open(m.__file__).read()
    assert "import ollama" not in src
    assert "import urllib" not in src
    assert "import requests" not in src


def test_signed_outputs():
    reset_tasks()
    r1 = coord_create_task("T", "D")
    assert "kid" in r1 and "sig" in r1 and "ts" in r1
    pid = r1["task_id"]
    r2 = coord_assign(pid, ["dragon"])
    assert "kid" in r2 and "sig" in r2 and "ts" in r2
    r3 = coord_status(pid)
    assert "kid" in r3 and "sig" in r3 and "ts" in r3
    r4 = coord_list()
    assert "kid" in r4 and "sig" in r4 and "ts" in r4
    r5 = coord_complete(pid)
    assert "kid" in r5 and "sig" in r5 and "ts" in r5


def test_full_lifecycle():
    """Create → assign → status → complete."""
    reset_tasks()
    r = coord_create_task("Lifecycle test", "Test the full flow", care_floor_impact=True)
    pid = r["task_id"]
    assert r["status"] == "PENDING"
    r2 = coord_assign(pid, ["dragon", "scribe", "owl"])
    assert r2["status"] == "ASSIGNED"
    assert len(r2["assignees"]) == 3
    r3 = coord_status(pid)
    assert r3["status"] == "ASSIGNED"
    r4 = coord_complete(pid)
    assert r4["status"] == "COMPLETED"