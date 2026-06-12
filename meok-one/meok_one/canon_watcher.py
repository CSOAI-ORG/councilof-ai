"""
canon_watcher.py — Watches ~/hive-staging/*/stack.yml for mtime changes and logs them.

Why: The §1 MEOK canonical facts block was injected into all 28 stack.yml files on
2026-06-12. load_hive() re-reads from disk on every call (no cache), so the queens
see the new canon immediately on next route. This watcher provides:
  - a tamper-evident audit log of every change (who/what/when)
  - a /api/king/canon_status endpoint to inspect last-seen mtimes
  - SIGIL-style hash chain so the audit itself is auditable

Background thread started by server.py at boot. No external deps (stdlib only).
"""
from __future__ import annotations

import hashlib
import json
import os
import threading
import time
from datetime import datetime, timezone
from pathlib import Path

_HIVE_ROOT = Path.home() / "hive-staging"
_AUDIT_LOG = Path.home() / "meok-king" / "canon_audit.log"
_AUDIT_JSONL = Path.home() / "meok-king" / "canon_audit.jsonl"

# mtimes keyed by hive_dir path. Rebuilt on first scan.
_state_lock = threading.Lock()
_last_mtimes: dict[str, float] = {}
_last_event_hash: str = "0" * 64  # genesis for the hash chain
_audit_running = False


def _hash_event(prev_hash: str, event: dict) -> str:
    """SHA256 chain — each event includes the prev event's hash."""
    payload = json.dumps({"prev": prev_hash, **event}, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(payload.encode()).hexdigest()


def _scan_once() -> list[dict]:
    """Scan all hive stack.yml files; return list of change events (empty if none)."""
    global _last_mtimes, _last_event_hash
    events = []
    with _state_lock:
        # First scan? just record current state, no events
        if not _last_mtimes:
            for d in sorted(_HIVE_ROOT.glob("*-hive")):
                stack = d / "stack.yml"
                if stack.exists():
                    _last_mtimes[str(d)] = stack.stat().st_mtime
            return []
        # Compare mtimes
        current = {}
        for d in sorted(_HIVE_ROOT.glob("*-hive")):
            stack = d / "stack.yml"
            if not stack.exists():
                continue
            mtime = stack.stat().st_mtime
            current[str(d)] = mtime
            old = _last_mtimes.get(str(d))
            if old is not None and mtime > old:
                events.append({
                    "hive": d.name,
                    "event": "stack_yml_modified",
                    "old_mtime": old,
                    "new_mtime": mtime,
                    "ts": datetime.now(timezone.utc).isoformat(),
                })
        # Detect deletions
        for path in list(_last_mtimes.keys()):
            if path not in current:
                events.append({
                    "hive": Path(path).name,
                    "event": "stack_yml_removed",
                    "ts": datetime.now(timezone.utc).isoformat(),
                })
        # Hash-chain the events
        for ev in events:
            ev["prev_hash"] = _last_event_hash
            ev["hash"] = _hash_event(_last_event_hash, ev)
            _last_event_hash = ev["hash"]
        # Update state
        _last_mtimes = current
    return events


def _write_audit(events: list[dict]) -> None:
    """Append events to human-readable log + machine-readable jsonl."""
    if not events:
        return
    _AUDIT_LOG.parent.mkdir(parents=True, exist_ok=True)
    with open(_AUDIT_LOG, "a") as f:
        for ev in events:
            f.write(f"[{ev['ts']}] {ev['hive']}: {ev['event']}  hash={ev['hash'][:16]}\n")
    with open(_AUDIT_JSONL, "a") as f:
        for ev in events:
            f.write(json.dumps(ev) + "\n")


def canon_status() -> dict:
    """Snapshot of watcher state — exposed via /api/king/canon_status."""
    with _state_lock:
        return {
            "hive_root": str(_HIVE_ROOT),
            "hives_known": len(_last_mtimes),
            "last_chain_hash": _last_event_hash,
            "audit_log": str(_AUDIT_LOG),
            "audit_jsonl": str(_AUDIT_JSONL),
            "running": _audit_running,
        }


def _watcher_loop(interval_sec: float = 5.0) -> None:
    """Background thread: scan every N seconds, log changes."""
    global _audit_running
    _audit_running = True
    # First scan seeds the state
    _scan_once()
    try:
        while True:
            time.sleep(interval_sec)
            try:
                evs = _scan_once()
                if evs:
                    _write_audit(evs)
            except Exception as e:
                # Never let the watcher kill itself; just log to stderr.
                print(f"[canon_watcher] scan error: {e}", flush=True)
    finally:
        _audit_running = False


_started = False
_start_lock = threading.Lock()


def start(interval_sec: float = 5.0) -> None:
    """Idempotent — safe to call multiple times."""
    global _started
    with _start_lock:
        if _started:
            return
        t = threading.Thread(target=_watcher_loop, args=(interval_sec,),
                             name="canon-watcher", daemon=True)
        t.start()
        _started = True
