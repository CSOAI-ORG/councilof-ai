#!/usr/bin/env python3
"""
openpatent.ai auto-publisher cron daemon.

Walks a vault directory (default: /Users/nicholas/clawd) for new
.md / .py / .txt / .json / .yaml files modified in the last N hours,
batch-discloses them to the hive via POST /v1/disclosure (tier=starter, $29),
and persists idempotent state in .openpatent/state.json.

Every disclosure produces a daily log line in /tmp/openpatent-cron.log.

The daemon is IDEMPOTENT: re-running on the same vault within the same
window will skip files whose (path, mtime, sha256) triple is already
recorded as DISCLOSED. It is safe to run via systemd timer, cron, or
manually with --once / --dry-run.

Usage:
  python3 scripts/cron-daemon.py --once               # single sweep, exit
  python3 scripts/cron-daemon.py --interval 6h        # loop, run every 6h
  python3 scripts/cron-daemon.py --vault-dir /foo     # override $WATCH_DIR
  python3 scripts/cron-daemon.py --dry-run            # show what would happen
  python3 scripts/cron-daemon.py --api-url http://hive:3211

The 6-hour tick is the heartbeat of the sovereign companion — every six
hours, the hive remembers what was forged.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
import re
import signal
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# ─── Configuration ──────────────────────────────────────────────────────────

DEFAULT_VAULT = "/Users/nicholas/clawd"
DEFAULT_API_URL = "http://127.0.0.1:3211"
DEFAULT_INTERVAL = "6h"
DEFAULT_TIER = "starter"
DEFAULT_FEE_USD = 29  # starter tier = $29
STATE_DIR = Path(".openpatent")
STATE_FILE = STATE_DIR / "state.json"
LOG_FILE = Path("/tmp/openpatent-cron.log")
EXTENSIONS = {".md", ".py", ".txt", ".json", ".yaml", ".yml"}

# Skip these noise directories when walking the vault.
SKIP_DIRS = {
    ".git", ".venv", "venv", "node_modules", "__pycache__",
    ".pytest_cache", ".mypy_cache", ".tox", "dist", "build",
    ".next", ".openpatent", "patentmcp_data", "_ingest",
    ".DS_Store",
}

# Skip dotfile-prefixed files (e.g. .env, .gitignore) — these are config, not inventions.
SKIP_DOTFILES = True

# How many files to disclose in a single batch request.
BATCH_MAX = 25

# Inventor DID used for the daemon (the sovereign companion itself).
DAEMON_INVENTOR_DID = "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK"

# ─── Logging ───────────────────────────────────────────────────────────────


def _log(msg: str, *, also_print: bool = True) -> None:
    """Write one timestamped line to the daily log file and optionally stdout."""
    try:
        LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
        ts = datetime.now(timezone.utc).isoformat(timespec="seconds")
        with LOG_FILE.open("a", encoding="utf-8") as fh:
            fh.write(f"{ts}  {msg}\n")
    except OSError:
        # Logging must never crash the daemon.
        pass
    if also_print:
        print(msg, flush=True)


# ─── Interval parsing ──────────────────────────────────────────────────────


_INTERVAL_RE = re.compile(r"^\s*(\d+)\s*([smhd])\s*$", re.IGNORECASE)


def parse_interval(s: str) -> int:
    """Parse '6h' / '30m' / '1d' / '90s' into seconds."""
    m = _INTERVAL_RE.match(s)
    if not m:
        raise ValueError(f"Invalid interval: {s!r}  (use e.g. 6h, 30m, 1d, 90s)")
    n, unit = int(m.group(1)), m.group(2).lower()
    return n * {"s": 1, "m": 60, "h": 3600, "d": 86400}[unit]


# ─── State management (idempotency core) ───────────────────────────────────


def _read_state(path: Path) -> dict[str, Any]:
    """Load .openpatent/state.json. Empty dict if missing/corrupt."""
    if not path.exists():
        return {"version": 1, "disclosed": {}, "last_run": None, "last_run_count": 0}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {"version": 1, "disclosed": {}, "last_run": None, "last_run_count": 0}


def _write_state(path: Path, state: dict[str, Any]) -> None:
    """Persist state.json atomically (tmp + rename)."""
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(state, indent=2, sort_keys=True), encoding="utf-8")
    tmp.replace(path)


def _file_identity(p: Path) -> str:
    """Stable, content-aware identity key for a file.

    Combines absolute path, mtime, and sha256 — re-disclosure after
    content change is therefore permitted (we re-disclose new versions
    under a new key, leaving the old record intact for audit trail).
    """
    try:
        st = p.stat()
    except OSError:
        return ""
    try:
        h = hashlib.sha256()
        with p.open("rb") as fh:
            for chunk in iter(lambda: fh.read(65536), b""):
                h.update(chunk)
        sha = h.hexdigest()
    except OSError:
        return ""
    return f"{p.resolve()}::{int(st.st_mtime)}::{sha}"


# ─── Vault walk ────────────────────────────────────────────────────────────


def walk_vault(vault: Path, since_ts: float) -> list[Path]:
    """Return vault files modified after `since_ts` and matching EXTENSIONS."""
    found: list[Path] = []
    if not vault.exists():
        return found
    for root, dirs, files in os.walk(vault):
        # Prune noise dirs in place so os.walk skips them.
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS and not d.startswith(".") or d in {"openpatent-hive"}]
        for name in files:
            if SKIP_DOTFILES and name.startswith("."):
                continue
            ext = Path(name).suffix.lower()
            if ext not in EXTENSIONS:
                continue
            p = Path(root) / name
            try:
                if p.stat().st_mtime >= since_ts:
                    found.append(p)
            except OSError:
                continue
    return sorted(found)


# ─── Disclosure API ────────────────────────────────────────────────────────


def _http_post(url: str, body: dict[str, Any], timeout: float = 30.0) -> tuple[int, str]:
    """POST JSON. Returns (status, body_text). Never raises on HTTP errors."""
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", errors="replace")
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        return 0, f"transport-error: {e}"


def disclose_one(api_url: str, file_path: Path, tier: str = DEFAULT_TIER) -> dict[str, Any]:
    """POST a single /v1/disclosure for `file_path`. Returns parsed response."""
    try:
        text = file_path.read_text(encoding="utf-8", errors="replace")
    except OSError as e:
        return {"status": "ERROR", "error": f"read-failed: {e}"}
    body = {
        "title": f"[cron] {file_path.name}",
        "description": (
            f"Auto-disclosed by openpatent-cron-daemon.\n"
            f"Source file: {file_path}\n"
            f"Vault: {file_path.parent}\n"
            f"Tier: {tier} (${DEFAULT_FEE_USD} per the openpatent.ai 5-tier schedule)"
        ),
        "inventor_did": DAEMON_INVENTOR_DID,
        "document_base64": base64.b64encode(text.encode("utf-8", errors="replace")).decode("ascii"),
        "document_format": file_path.suffix.lstrip(".") or "txt",
        "classification": "G06N3/00",
        "tier": tier,
        "metadata": {
            "source": "cron-daemon",
            "absolute_path": str(file_path.resolve()),
            "vault": str(file_path.parent.resolve()),
        },
    }
    status, body_text = _http_post(f"{api_url.rstrip('/')}/v1/disclosure", body)
    try:
        parsed = json.loads(body_text)
    except json.JSONDecodeError:
        parsed = {"raw": body_text}
    parsed["_http_status"] = status
    return parsed


def disclose_batch(api_url: str, files: list[Path], tier: str = DEFAULT_TIER) -> list[dict[str, Any]]:
    """Disclose a list of files. We do them one-by-one for granular auditability
    (the hive's /v1/disclosure endpoint accepts single disclosures; a true
    /v1/disclosure/batch endpoint can be added later)."""
    return [disclose_one(api_url, f, tier=tier) for f in files]


# ─── Main sweep ────────────────────────────────────────────────────────────


def run_once(args: argparse.Namespace) -> int:
    """One full sweep. Returns process exit code."""
    vault = Path(args.vault_dir).expanduser().resolve()
    api_url = args.api_url
    state_path = Path(args.state_file).expanduser().resolve()

    state = _read_state(state_path)
    disclosed: dict[str, Any] = state.get("disclosed", {})

    interval_s = parse_interval(args.interval)
    since_ts = time.time() - interval_s
    since_human = datetime.fromtimestamp(since_ts, tz=timezone.utc).isoformat(timespec="seconds")

    _log(f"─ sweep begin  vault={vault}  api={api_url}  interval={args.interval}  since={since_human}")

    candidates = walk_vault(vault, since_ts)
    _log(f"  candidate files (mtime ≥ {since_human}): {len(candidates)}")

    # Idempotency: skip files whose identity is already recorded as DISCLOSED.
    to_disclose: list[Path] = []
    skipped = 0
    for p in candidates:
        ident = _file_identity(p)
        if not ident:
            continue
        rec = disclosed.get(ident)
        if rec and rec.get("status") == "DISCLOSED":
            skipped += 1
            continue
        to_disclose.append(p)

    if skipped:
        _log(f"  idempotent skip: {skipped} file(s) already disclosed (unchanged since last sweep)")

    if not to_disclose:
        _log("  nothing to disclose this sweep")
        state["last_run"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
        state["last_run_count"] = 0
        _write_state(state_path, state)
        _log("─ sweep end  (idle)\n")
        return 0

    if args.dry_run:
        _log(f"  [dry-run] would disclose {len(to_disclose)} file(s):")
        for p in to_disclose:
            _log(f"    • {p}")
        state["last_run"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
        state["last_run_count"] = 0  # dry-run never changes the count
        _write_state(state_path, state)
        _log("─ sweep end  (dry-run)\n")
        return 0

    # Process in chunks of BATCH_MAX.
    success = 0
    fail = 0
    for chunk_start in range(0, len(to_disclose), BATCH_MAX):
        chunk = to_disclose[chunk_start : chunk_start + BATCH_MAX]
        _log(f"  processing batch [{chunk_start + 1}–{chunk_start + len(chunk)}] of {len(to_disclose)}")
        results = disclose_batch(api_url, chunk, tier=args.tier)
        for path, resp in zip(chunk, results):
            ident = _file_identity(path)
            status_code = resp.get("_http_status", 0)
            inner_status = resp.get("status", "UNKNOWN")
            doc_hash = resp.get("document_hash", "")
            tx = resp.get("bitcoin_transaction", "")
            record: dict[str, Any] = {
                "path": str(path.resolve()),
                "mtime": int(path.stat().st_mtime),
                "sha256": ident.split("::")[-1] if ident else "",
                "disclosed_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                "tier": args.tier,
                "fee_usd": DEFAULT_FEE_USD,
                "status": inner_status,
                "http_status": status_code,
                "document_hash": doc_hash,
                "bitcoin_tx": tx,
                "attestation_url": resp.get("attestation_url", ""),
                "chain_index": resp.get("chain_index"),
            }
            if status_code == 200 and inner_status == "DISCLOSED":
                success += 1
                _log(f"    ✓ DISCLOSED  {path.name}  hash={doc_hash[:24] or 'n/a'}…  tx={(tx or 'n/a')[:24]}…")
            else:
                fail += 1
                _log(f"    ✗ FAILED     {path.name}  http={status_code}  body={json.dumps(resp)[:200]}")
            if ident:
                disclosed[ident] = record

    state["disclosed"] = disclosed
    state["last_run"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    state["last_run_count"] = success
    state["last_run_fail"] = fail
    _write_state(state_path, state)

    _log(f"  summary: success={success}  fail={fail}  skipped={skipped}  total_state_records={len(disclosed)}")
    _log("─ sweep end\n")
    return 0 if fail == 0 else 2


# ─── Loop / signal handling ────────────────────────────────────────────────


_RUNNING = True


def _on_signal(signum: int, _frame: Any) -> None:
    global _RUNNING
    _RUNNING = False
    _log(f"  received signal {signum} — will exit after current sweep")


def main() -> int:
    p = argparse.ArgumentParser(
        description="openpatent.ai auto-publisher cron daemon (idempotent)",
    )
    p.add_argument(
        "--vault-dir",
        default=os.environ.get("WATCH_DIR", DEFAULT_VAULT),
        help=f"Directory to watch for new files (default: $WATCH_DIR or {DEFAULT_VAULT})",
    )
    p.add_argument(
        "--api-url",
        default=os.environ.get("OPENPATENT_API_URL", DEFAULT_API_URL),
        help=f"Base URL of the openpatent.ai api-gateway (default: {DEFAULT_API_URL})",
    )
    p.add_argument(
        "--interval",
        default=os.environ.get("OPENPATENT_INTERVAL", DEFAULT_INTERVAL),
        help=f"Sweep interval; e.g. 6h, 30m, 1d, 90s (default: {DEFAULT_INTERVAL})",
    )
    p.add_argument(
        "--state-file",
        default=os.environ.get("OPENPATENT_STATE", str(Path.cwd() / STATE_DIR / "state.json")),
        help="Path to the idempotency state JSON file",
    )
    p.add_argument(
        "--tier",
        default=os.environ.get("OPENPATENT_TIER", DEFAULT_TIER),
        help=f"Disclosure tier (default: {DEFAULT_TIER}, $${DEFAULT_FEE_USD})",
    )
    p.add_argument(
        "--once",
        action="store_true",
        help="Run a single sweep and exit (default if --interval is not used in a loop)",
    )
    p.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be disclosed but make no API calls and no state changes",
    )
    args = p.parse_args()

    signal.signal(signal.SIGTERM, _on_signal)
    signal.signal(signal.SIGINT, _on_signal)

    # If --once, run a single sweep and return.
    if args.once:
        return run_once(args)

    # Otherwise loop on --interval. systemd-friendly (sigs TERM cleanly).
    interval_s = parse_interval(args.interval)
    _log(f"openpatent-cron-daemon starting  interval={args.interval} ({interval_s}s)  vault={args.vault_dir}  api={args.api_url}")
    while _RUNNING:
        try:
            run_once(args)
        except Exception as e:  # pragma: no cover — never let the daemon die
            _log(f"  sweep raised exception: {e!r}")
        # Sleep in 1-second ticks so SIGTERM is responsive.
        for _ in range(interval_s):
            if not _RUNNING:
                break
            time.sleep(1)
    _log("openpatent-cron-daemon exiting cleanly")
    return 0


if __name__ == "__main__":
    sys.exit(main())
