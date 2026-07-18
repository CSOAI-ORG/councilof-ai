#!/usr/bin/env python3
"""
cron-daemon-prod.py — LIVE 24/7 auto-disclosure daemon for openpatent.ai.

Watches /opt/openpatent-hive/vault/disclosures/ for new files,
auto-files them via the patentmcp audit log. Idempotent on (path, mtime, sha256).
Writes state to .openpatent/cron-state.json. Logs to /var/log/openpatent-cron.log.

Usage:
  python3 cron-daemon-prod.py --once              # one-shot sweep
  python3 cron-daemon-prod.py --interval 60      # daemon mode (60s polls)
  python3 cron-daemon-prod.py --dry-run           # don't actually file
"""
import os
import sys
import json
import time
import signal
import hashlib
import argparse
import datetime
import urllib.request
import urllib.error

VAULT_DIR = "/opt/openpatent-hive/vault/disclosures"
STATE_FILE = "/opt/openpatent-hive/.openpatent/cron-state.json"
API_BASE = os.environ.get("API_BASE", "http://127.0.0.1:3211")
LOG_FILE = "/tmp/openpatent-cron.log"

stop = False

def sigterm(*_):
    global stop
    stop = True

signal.signal(signal.SIGTERM, sigterm)
signal.signal(signal.SIGINT, sigterm)


def log(msg):
    line = f"[{datetime.datetime.utcnow().isoformat()}] {msg}"
    print(line, flush=True)
    try:
        with open(LOG_FILE, "a") as f:
            f.write(line + "\n")
    except Exception:
        pass


def load_state():
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE) as f:
            return json.load(f)
    return {"filed": {}, "last_run": None}


def save_state(state):
    os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)


def file_fingerprint(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        h.update(f.read())
    return h.hexdigest()


def file_disclosure(path, fp):
    """POST a disclosure for the file. Returns doc_hash or None."""
    try:
        with open(path, "rb") as f:
            data = f.read()
        # base64-encode the file
        import base64
        body = {
            "title": f"vault-disclosure: {os.path.basename(path)}",
            "description": f"auto-disclosed by cron-daemon-prod from {path}",
            "inventor_did": "did:opatent:cron-daemon-prod",
            "document_base64": base64.b64encode(data).decode(),
            "document_format": "data",
        }
        req = urllib.request.Request(
            f"{API_BASE}/v1/disclosure",
            data=json.dumps(body).encode(),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=10) as r:
            d = json.loads(r.read())
            return d.get("doc_hash") or d.get("hash") or "unknown"
    except Exception as e:
        log(f"  ERROR filing {path}: {e}")
        return None


def sweep(dry_run=False):
    state = load_state()
    filed = state.get("filed", {})
    new_count = 0
    skip_count = 0
    err_count = 0

    if not os.path.isdir(VAULT_DIR):
        log(f"vault dir {VAULT_DIR} not found; creating")
        os.makedirs(VAULT_DIR, exist_ok=True)
        return 0, 0, 0

    for entry in sorted(os.listdir(VAULT_DIR)):
        if not entry.endswith(".json"):
            continue
        path = os.path.join(VAULT_DIR, entry)
        try:
            fp = file_fingerprint(path)
        except Exception as e:
            log(f"  ERROR reading {path}: {e}")
            err_count += 1
            continue

        if fp in filed:
            skip_count += 1
            continue

        log(f"  NEW: {entry} (sha256={fp[:16]})")
        if not dry_run:
            doc_hash = file_disclosure(path, fp)
            if doc_hash:
                filed[fp] = {"path": path, "doc_hash": doc_hash, "filed_at": datetime.datetime.utcnow().isoformat()}
                new_count += 1
            else:
                err_count += 1
        else:
            log(f"  DRY-RUN: skipping {entry}")
            new_count += 1

    state["filed"] = filed
    state["last_run"] = datetime.datetime.utcnow().isoformat()
    save_state(state)
    return new_count, skip_count, err_count


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--once", action="store_true")
    ap.add_argument("--interval", type=int, default=60)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    log(f"=== cron-daemon-prod starting (once={args.once} interval={args.interval}s dry_run={args.dry_run}) ===")
    if args.once:
        n, s, e = sweep(args.dry_run)
        log(f"=== done: new={n} skip={s} err={e} ===")
        return 0

    while not stop:
        try:
            n, s, e = sweep(args.dry_run)
            log(f"=== sweep done: new={n} skip={s} err={e} ===")
        except Exception as e:
            log(f"=== sweep ERROR: {e} ===")
        for _ in range(args.interval):
            if stop:
                break
            time.sleep(1)
    log("=== cron-daemon-prod stopped ===")
    return 0


if __name__ == "__main__":
    sys.exit(main())