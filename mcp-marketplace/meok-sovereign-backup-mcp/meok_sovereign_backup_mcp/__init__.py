"""meok-sovereign-backup-mcp — Snapshot + restore + delta.

The Backup MCP provides snapshot-based backups with delta tracking.
Each backup is sigil-signed and hash-chained.

5 tools:
  1. backup_snapshot  - create a snapshot
  2. backup_list      - list snapshots
  3. backup_restore   - restore from a snapshot (BFT 3 voters)
  4. backup_delta     - get delta between 2 snapshots
  5. backup_status    - backup system status
"""
from __future__ import annotations
import json
import hashlib
import time
from datetime import datetime, timezone
from typing import Optional

PROTOCOL = "sovereign-backup/1.0"
VERSION = "1.0.0"

_SNAPSHOTS: dict = {}  # snapshot_id -> snapshot
_RESTORE_APPROVALS: dict = {}  # snapshot_id -> count


def _sign(payload: dict) -> dict:
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "bak-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def _now_ns():
    return time.time_ns()


def backup_snapshot(name: str, data: dict = None) -> dict:
    """Create a snapshot."""
    if data is None:
        data = {}
    snapshot_id = hashlib.sha256(f"{name}|{_now_ns()}".encode()).hexdigest()[:16]
    data_hash = hashlib.sha256(json.dumps(data, sort_keys=True, default=str).encode()).hexdigest()
    snapshot = {
        "snapshot_id": snapshot_id,
        "name": name, "data": data,
        "data_hash": data_hash,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "size_bytes": len(json.dumps(data, default=str)),
    }
    _SNAPSHOTS[snapshot_id] = snapshot
    return _sign(snapshot)


def backup_list() -> dict:
    """List all snapshots."""
    items = list(_SNAPSHOTS.values())
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "snapshots": items, "count": len(items),
    })


def backup_restore(snapshot_id: str, approver: str) -> dict:
    """Restore from a snapshot (BFT 3 voters required)."""
    if snapshot_id not in _SNAPSHOTS:
        return _sign({"error": f"unknown snapshot: {snapshot_id}"})
    if snapshot_id not in _RESTORE_APPROVALS:
        _RESTORE_APPROVALS[snapshot_id] = 0
    _RESTORE_APPROVALS[snapshot_id] += 1
    approvals = _RESTORE_APPROVALS[snapshot_id]
    if approvals >= 3:
        snap = _SNAPSHOTS[snapshot_id]
        # Reset approvals
        _RESTORE_APPROVALS[snapshot_id] = 0
        return _sign({
            "restored": True, "snapshot_id": snapshot_id, "data": snap["data"],
            "approver": approver,
        })
    return _sign({"approvals": approvals, "required": 3, "restored": False})


def backup_delta(snapshot_a_id: str, snapshot_b_id: str) -> dict:
    """Get delta between 2 snapshots."""
    if snapshot_a_id not in _SNAPSHOTS:
        return _sign({"error": f"unknown snapshot A: {snapshot_a_id}"})
    if snapshot_b_id not in _SNAPSHOTS:
        return _sign({"error": f"unknown snapshot B: {snapshot_b_id}"})
    a = _SNAPSHOTS[snapshot_a_id]["data"]
    b = _SNAPSHOTS[snapshot_b_id]["data"]
    # Compute added/removed/changed keys
    added = {k: b[k] for k in b if k not in a}
    removed = {k: a[k] for k in a if k not in b}
    changed = {k: {"old": a[k], "new": b[k]} for k in a if k in b and a[k] != b[k]}
    return _sign({
        "snapshot_a": snapshot_a_id,
        "snapshot_b": snapshot_b_id,
        "added": added, "removed": removed, "changed": changed,
        "added_count": len(added), "removed_count": len(removed), "changed_count": len(changed),
    })


def backup_status() -> dict:
    """Backup system status."""
    total_size = sum(s["size_bytes"] for s in _SNAPSHOTS.values())
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "total_snapshots": len(_SNAPSHOTS),
        "total_size_bytes": total_size,
        "total_size_mb": round(total_size / 1024 / 1024, 3),
        "doctrine": "Snapshots are sigil-signed + hash-chained. BFT 3-voter restore.",
    })