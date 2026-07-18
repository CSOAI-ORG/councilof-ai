#!/usr/bin/env python3
"""
auto-disclose-watcher.py — openpatent.ai · vault watcher daemon.

Background daemon that watches `vault/disclosures/` (and optionally any
list of vault roots) for newly-arrived disclosure JSONs, and auto-files
each one through the patentmcp audit chain. The watcher is idempotent:
a file's (path, mtime, sha256) triple is recorded once, and re-runs
skip already-anchored disclosures.

Design goals
------------
  * ZERO human-in-the-loop for the chain-of-custody step. The chain
    grows as soon as a disclosure lands in the vault.
  * Safe to run via systemd, launchd, cron, or `nohup`. Restarts are
    cheap: state lives in `.openpatent/watcher-state.json`.
  * Logs to stdout AND to `/tmp/openpatent-watcher.log`. Log lines are
    single-line JSON so they can be tailed / piped / alerted.
  * Posts each disclosure to the local patentmcp service at
    http://127.0.0.1:3210/disclose for the canonical 6-layer hash +
    audit-chain entry. If the service is down, the watcher still
    appends to `var/audit-chain.jsonl` directly (defense-in-depth:
    the audit chain never depends on a single live service).

Vault contract
--------------
A disclosure JSON has at minimum:
  {
    "id": "disc-xxxxxxxxxxxx",          # required
    "did": "did:opatent:...",           # optional but recommended
    "owner_email": "user@example.com",  # optional
    "use_case": "...",                  # optional
    "filed_at": "2026-06-17T..."        # optional
  }

Missing fields are filled in by the watcher before anchoring.

Usage
-----
  # Foreground (one sweep, then exit) — useful for cron
  python3 scripts/auto-disclose-watcher.py --once

  # Background daemon (default 30s interval)
  python3 scripts/auto-disclose-watcher.py

  # Faster sweep + log to file
  python3 scripts/auto-disclose-watcher.py --interval 5s --log-file /var/log/openpatent/watcher.log

  # Watch a custom vault root
  python3 scripts/auto-disclose-watcher.py --vault-dir /opt/openpatent-hive/vault/disclosures

  # Skip the network probe (audit-chain append-only mode)
  python3 scripts/auto-disclose-watcher.py --no-network

The hive remembers. The dragon knows. The sovereign companion never forgets.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import signal
import socket
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional


# ─── Configuration ───────────────────────────────────────────────────────────

DEFAULT_VAULT = Path("/Users/nicholas/clawd/openpatent-hive/vault/disclosures")
DEFAULT_AUDIT_LOG = Path("/Users/nicholas/clawd/openpatent-hive/var/audit-chain.jsonl")
DEFAULT_STATE = Path("/Users/nicholas/clawd/openpatent-hive/.openpatent/watcher-state.json")
DEFAULT_LOG = Path("/tmp/openpatent-watcher.log")
DEFAULT_INTERVAL = 30.0  # seconds
DEFAULT_API_URL = "http://127.0.0.1:3210"


# ─── Logging ─────────────────────────────────────────────────────────────────

def _log(msg: dict, log_file: Optional[Path] = None) -> None:
    line = json.dumps({"ts": datetime.now(timezone.utc).isoformat(timespec="seconds"), **msg}, separators=(",", ":"))
    print(line, flush=True)
    if log_file:
        try:
            log_file.parent.mkdir(parents=True, exist_ok=True)
            with open(log_file, "a") as f:
                f.write(line + "\n")
        except OSError:
            pass


# ─── State ───────────────────────────────────────────────────────────────────

def load_state(path: Path) -> dict:
    if not path.exists():
        return {"anchored": {}, "last_sweep": None}
    try:
        return json.loads(path.read_text())
    except (OSError, json.JSONDecodeError):
        return {"anchored": {}, "last_sweep": None}


def save_state(path: Path, state: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(state, indent=2, sort_keys=True))
    tmp.replace(path)


# ─── Disclosure processing ───────────────────────────────────────────────────

@dataclass
class Disclosure:
    path: Path
    mtime: float
    size: int
    sha256: str

    @property
    def key(self) -> str:
        return f"{self.path}:{self.mtime}:{self.sha256}"


def fingerprint(path: Path) -> Optional[Disclosure]:
    """Compute (mtime, size, sha256) for one vault file."""
    try:
        st = path.stat()
    except OSError:
        return None
    if not path.is_file():
        return None
    try:
        h = hashlib.sha256()
        with open(path, "rb") as f:
            for chunk in iter(lambda: f.read(65536), b""):
                h.update(chunk)
    except OSError:
        return None
    return Disclosure(path=path, mtime=st.st_mtime, size=st.st_size, sha256=h.hexdigest())


def load_disclosure(path: Path) -> dict:
    """Read a disclosure JSON, tolerating partial / missing fields."""
    try:
        raw = json.loads(path.read_text())
    except (OSError, json.JSONDecodeError):
        raw = {}
    raw.setdefault("id", f"disc-{path.stem[:12]}")
    raw.setdefault("did", "did:opatent:auto-watcher")
    raw.setdefault("owner_email", "auto-watcher@openpatent.ai")
    raw.setdefault("use_case", path.stem)
    raw.setdefault("filed_at", datetime.now(timezone.utc).isoformat())
    return raw


# ─── Anchoring ───────────────────────────────────────────────────────────────

def post_to_patentmcp(payload: dict, api_url: str, timeout: float = 4.0) -> tuple[bool, str]:
    """POST a disclosure to the local patentmcp service. Returns (ok, detail)."""
    body = json.dumps(payload).encode()
    req = urllib.request.Request(
        f"{api_url.rstrip('/')}/disclose",
        data=body,
        headers={"content-type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            text = r.read(512).decode("utf-8", "ignore")
            return (200 <= r.status < 300), f"HTTP {r.status} {text[:80]}"
    except urllib.error.HTTPError as e:
        return False, f"HTTP {e.code} {e.reason}"
    except (urllib.error.URLError, socket.timeout, TimeoutError, OSError) as e:
        return False, f"NETERR {type(e).__name__}"


def append_audit_chain(audit_log: Path, event: dict) -> tuple[bool, int]:
    """Append one event to the audit chain. Returns (ok, new_line_count)."""
    audit_log.parent.mkdir(parents=True, exist_ok=True)
    line = json.dumps(event, separators=(",", ":"))
    try:
        with open(audit_log, "a") as f:
            f.write(line + "\n")
        count = sum(1 for _ in open(audit_log))
        return True, count
    except OSError as e:
        return False, 0


def anchor_one(disc: Disclosure, audit_log: Path, api_url: str, do_network: bool) -> dict:
    """Anchor a single disclosure. Returns the audit-chain event."""
    payload = load_disclosure(disc.path)
    event: dict = {
        "ts": datetime.now(timezone.utc).isoformat(timespec="microseconds"),
        "event": "AUTO_DISCLOSURE_ANCHORED",
        "disclosure_id": payload.get("id"),
        "did": payload.get("did"),
        "owner_email": payload.get("owner_email"),
        "use_case": payload.get("use_case"),
        "source_path": str(disc.path),
        "sha256": disc.sha256,
        "size_bytes": disc.size,
        "by": "auto-disclose-watcher.py",
    }

    # 1. Try the local patentmcp service (canonical 6-layer path)
    if do_network:
        ok, detail = post_to_patentmcp(payload, api_url)
        event["patentmcp_live"] = ok
        event["patentmcp_detail"] = detail
    else:
        event["patentmcp_live"] = None
        event["patentmcp_detail"] = "skipped (--no-network)"

    # 2. ALWAYS append to the audit chain (defense-in-depth — chain never depends on a live service)
    ok, count = append_audit_chain(audit_log, event)
    event["audit_chain_appended"] = ok
    event["audit_chain_size"] = count

    return event


# ─── Sweep ───────────────────────────────────────────────────────────────────

def sweep(vault: Path, audit_log: Path, state: dict, api_url: str, do_network: bool) -> list[dict]:
    """Walk the vault once, anchor any new disclosures. Returns the list of new events."""
    if not vault.exists():
        return []
    new_events: list[dict] = []
    anchored = state.setdefault("anchored", {})
    for path in sorted(vault.iterdir()):
        if not path.is_file():
            continue
        if path.suffix.lower() != ".json":
            continue
        disc = fingerprint(path)
        if not disc:
            continue
        if disc.key in anchored:
            continue
        event = anchor_one(disc, audit_log, api_url, do_network)
        anchored[disc.key] = event["ts"]
        new_events.append(event)
    state["last_sweep"] = datetime.now(timezone.utc).isoformat()
    return new_events


# ─── Signal handling ─────────────────────────────────────────────────────────

_stop = False


def _on_signal(signum, _frame):
    global _stop
    _stop = True


# ─── Main ────────────────────────────────────────────────────────────────────

def main() -> int:
    p = argparse.ArgumentParser(description="Auto-disclose watcher for the openpatent.ai vault.")
    p.add_argument("--vault-dir", type=Path, default=DEFAULT_VAULT, help="vault root to watch")
    p.add_argument("--audit-log", type=Path, default=DEFAULT_AUDIT_LOG, help="audit chain path")
    p.add_argument("--state", type=Path, default=DEFAULT_STATE, help="state file (idempotency)")
    p.add_argument("--log-file", type=Path, default=DEFAULT_LOG, help="log file (also written to stdout)")
    p.add_argument("--interval", type=float, default=DEFAULT_INTERVAL, help="sweep interval (seconds)")
    p.add_argument("--api-url", default=DEFAULT_API_URL, help="patentmcp base URL")
    p.add_argument("--no-network", action="store_true", help="skip the live patentmcp POST; audit-chain only")
    p.add_argument("--once", action="store_true", help="single sweep, then exit (cron-friendly)")
    p.add_argument("--quiet", action="store_true", help="only log new anchors (skip heartbeat)")
    args = p.parse_args()

    signal.signal(signal.SIGINT, _on_signal)
    signal.signal(signal.SIGTERM, _on_signal)

    log_file: Optional[Path] = args.log_file
    if not log_file or str(log_file) in ("", "-"):
        log_file = None

    _log({"msg": "watcher.starting", "vault": str(args.vault_dir), "interval_s": args.interval}, log_file)
    state = load_state(args.state)
    anchored_at_start = len(state.get("anchored", {}))

    sweeps = 0
    new_total = 0
    while not _stop:
        sweeps += 1
        new_events = sweep(args.vault_dir, args.audit_log, state, args.api_url, not args.no_network)
        if new_events:
            save_state(args.state, state)
            new_total += len(new_events)
            for ev in new_events:
                _log({
                    "msg": "watcher.anchored",
                    "disclosure_id": ev["disclosure_id"],
                    "sha256": ev["sha256"][:16],
                    "patentmcp_live": ev["patentmcp_live"],
                    "patentmcp_detail": ev["patentmcp_detail"],
                    "audit_chain_size": ev["audit_chain_size"],
                }, log_file)
        elif not args.quiet and sweeps % 10 == 0:
            _log({"msg": "watcher.heartbeat", "sweeps": sweeps, "anchored_total": len(state["anchored"])}, log_file)

        if args.once:
            break
        if _stop:
            break
        # Sleep in 1-second slices so SIGTERM stops us within ~1s.
        slept = 0.0
        while slept < args.interval and not _stop:
            time.sleep(min(1.0, args.interval - slept))
            slept += 1.0

    save_state(args.state, state)
    _log({
        "msg": "watcher.stopped",
        "sweeps": sweeps,
        "new_anchored_this_session": new_total,
        "anchored_at_start": anchored_at_start,
        "anchored_total": len(state["anchored"]),
    }, log_file)
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        sys.exit(0)
