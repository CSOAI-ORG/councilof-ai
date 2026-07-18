#!/usr/bin/env python3
"""Tests for meek-consolidation-absorption-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from meek_consolidation_absorption_mcp.server import csoai_hive_gcp_vm, consolidation_status, absorption_plan, csoai_hive_index, post_consolidation_absorption_status

def test_csoai_hive_gcp_vm():
    r = csoai_hive_gcp_vm()
    assert r["vm_ip"] == "35.242.143.249"
    assert len(r["all_5_services_running"]) == 5
    print(f"✅ test_csoai_vm: {r['vm_ip']} ({r['vm_region']}) with 5 services running")

def test_consolidation_status():
    r = consolidation_status()
    assert r["phase"] == "READY"
    assert len(r["what_consolidates"]) == 13
    print(f"✅ test_consolidation: {r['phase']} with {len(r['what_consolidates'])} items to consolidate")

def test_absorption_plan():
    r = absorption_plan()
    assert len(r["how"]) == 5
    print(f"✅ test_absorption: 5 steps, {len(r['what_absorbs_into_csoai_hive'])} items")

def test_csoai_hive_index():
    r = csoai_hive_index()
    assert r["count"] == 22
    assert r["hive_url"] == "csoai.org"
    print(f"✅ test_hive_index: {r['count']} subsystems in the CSOAI hive")

def test_post_consolidation_absorption_status():
    r = post_consolidation_absorption_status()
    assert r["status"] == "READY"
    assert len(r["what_is_ready"]) == 10
    print(f"✅ test_post_consolidation: {r['status']} with {len(r['what_user_can_do_now'])} user actions")

if __name__ == "__main__":
    test_csoai_hive_gcp_vm()
    test_consolidation_status()
    test_absorption_plan()
    test_csoai_hive_index()
    test_post_consolidation_absorption_status()
    print("\n🎉 ALL 5 TESTS PASSED — meek-consolidation-absorption-mcp v1.0.0 is sovereign. CSOAI hive consolidated.")