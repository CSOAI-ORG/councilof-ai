"""Tests for meek-defoneos-backup-restore-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from meek_defoneos_backup_restore_mcp.server import backup_create, backup_list, backup_restore, backup_metrics, backup_overview

def test_backup_create():
    r = backup_create()
    assert r["status"] == "READY"
    assert r["size_gb"] == 49
    print(f"✅ test_create: {r['backup_id'][:20]}... ({r['size_gb']} GB)")

def test_backup_list():
    r = backup_list()
    assert r["count"] >= 2
    print(f"✅ test_list: {r['count']} backups, {r['total_size_gb']} GB total")

def test_backup_restore():
    r = backup_restore()
    assert r["approval_required"] is True
    print(f"✅ test_restore: {r['backup_id']} (approval_required={r['approval_required']})")

def test_backup_metrics():
    r = backup_metrics()
    assert r["rto_minutes"] <= 60
    assert r["rpo_minutes"] <= 120
    print(f"✅ test_metrics: RTO={r['rto_minutes']}min, RPO={r['rpo_minutes']}min")

def test_backup_overview():
    r = backup_overview()
    assert r["total_backups"] >= 2
    print(f"✅ test_overview: {r['total_backups']} backups, {r['total_size_gb']} GB")

if __name__ == "__main__":
    test_backup_create()
    test_backup_list()
    test_backup_restore()
    test_backup_metrics()
    test_backup_overview()
    print("\n🎉 ALL 5 TESTS PASSED — meek-defoneos-backup-restore-mcp v1.0.0 is sovereign. Backup/restore live.")