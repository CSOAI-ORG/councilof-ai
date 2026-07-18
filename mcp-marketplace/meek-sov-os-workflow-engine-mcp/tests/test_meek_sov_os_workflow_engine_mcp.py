"""Tests for meek-sov-os-workflow-engine-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from meek_sov_os_workflow_engine_mcp.server import workflow_list, workflow_run, workflow_status, workflow_pause, workflow_resume, workflow_cancel, workflow_history, workflow_overview

def test_workflow_list():
    r = workflow_list()
    assert r["count"] == 12
    print(f"✅ test_list: {r['count']} workflows")

def test_workflow_run():
    r = workflow_run()
    assert r["status"] == "RUNNING"
    print(f"✅ test_run: {r['workflow_id']} running")

def test_workflow_status():
    r = workflow_status()
    assert r["status"] == "RUNNING"
    assert r["current_step"] == 2
    print(f"✅ test_status: step {r['current_step']}/{r['total_steps']} ({r['progress_pct']}%)")

def test_workflow_pause():
    r = workflow_pause()
    assert r["status"] == "PAUSED"
    print(f"✅ test_pause: {r['workflow_id']} paused")

def test_workflow_resume():
    r = workflow_resume()
    assert r["status"] == "RUNNING"
    print(f"✅ test_resume: {r['workflow_id']} resumed")

def test_workflow_cancel():
    r = workflow_cancel()
    assert r["status"] == "CANCELLED"
    print(f"✅ test_cancel: {r['workflow_id']} cancelled")

def test_workflow_history():
    r = workflow_history()
    assert r["total_executions"] == 3
    print(f"✅ test_history: {r['total_executions']} executions")

def test_workflow_overview():
    r = workflow_overview()
    assert r["total_workflows"] == 12
    print(f"✅ test_overview: {r['total_workflows']} workflows in the engine")

if __name__ == "__main__":
    test_workflow_list()
    test_workflow_run()
    test_workflow_status()
    test_workflow_pause()
    test_workflow_resume()
    test_workflow_cancel()
    test_workflow_history()
    test_workflow_overview()
    print("\n🎉 ALL 8 TESTS PASSED — meek-sov-os-workflow-engine-mcp v1.0.0 is sovereign. 12 workflows can run the world.")