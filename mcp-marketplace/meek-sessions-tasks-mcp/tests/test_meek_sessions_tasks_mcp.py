#!/usr/bin/env python3
"""Tests for meek-sessions-tasks-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from meek_sessions_tasks_mcp.server import session_create, session_list_sessions, task_create, task_list_tasks, sessions_tasks_metrics

def test_session_create():
    r = session_create()
    assert r["status"] == "ACTIVE"
    assert r["session_id"].startswith("session_")
    print(f"✅ test_session_create: {r['session_id'][:20]}... ({r['session_type']})")

def test_session_list_sessions():
    r = session_list_sessions()
    assert r["count"] == 3
    print(f"✅ test_list_sessions: {r['count']} active sessions")

def test_task_create():
    r = task_create(task_name="Test task", priority="low")
    assert r["status"] == "TODO"
    print(f"✅ test_task_create: {r['task_id'][:20]}... ({r['priority']})")

def test_task_list_tasks():
    r = task_list_tasks(status="all")
    assert r["count"] >= 2
    print(f"✅ test_list_tasks: {r['count']} tasks (status={r['status_filter']})")

def test_sessions_tasks_metrics():
    r = sessions_tasks_metrics()
    assert r["total_sessions"] == 3
    assert r["active_sessions"] == 2
    print(f"✅ test_metrics: {r['total_sessions']} sessions + {r['total_tasks']} tasks")

if __name__ == "__main__":
    test_session_create()
    test_session_list_sessions()
    test_task_create()
    test_task_list_tasks()
    test_sessions_tasks_metrics()
    print("\n🎉 ALL 5 TESTS PASSED — meek-sessions-tasks-mcp v1.0.0 is sovereign. The L H side has sessions + tasks.")