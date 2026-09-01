#!/usr/bin/env python3
"""Shared helpers for the ASI AUTO-EAT loop.

Keyless, stdlib-only (urllib) so it runs on the sink pod (python3, no pip).
Honesty rules are ABSOLUTE here:
  - three states everywhere (LIVE / PLACEHOLDER|HELD / DEAD|UNREACHABLE),
  - never invent a number,
  - nothing here signs anything (no keys on the pod, and board-sign is
    OIDC + workflow-allowlist gated regardless),
  - DISCOVERED and UNMEASURED are first-class and never silently upgraded.

Paths (all under the repo, so git is the durable state on the feed branch):
  public/interop/auto-eat/queue.jsonl                 frozen, append-only
  public/interop/auto-eat/probed.json                 probed id set (dedupe)
  public/interop/auto-eat/cards-compact.json          {surface: payload}
  public/interop/auto-eat/card-<slug>-unsigned.json   atoms (sig_ed25519=null)
  public/interop/auto-eat/status.json                 machine-readable status row
  scripts/auto-eat/STATUS.md                           human status surface
"""
from __future__ import annotations

import json
import os
import subprocess
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

UA = "csoai-auto-eat/0.1 (+https://councilof.ai)"


def repo_root() -> Path:
    try:
        top = subprocess.check_output(
            ["git", "rev-parse", "--show-toplevel"],
            cwd=str(Path(__file__).resolve().parent),
            stderr=subprocess.DEVNULL,
        )
        return Path(top.decode().strip())
    except Exception:
        # scripts/auto-eat/common.py -> parents[2] == repo root
        return Path(__file__).resolve().parents[2]


ROOT = repo_root()
INTEROP = ROOT / "public" / "interop"
FEED = INTEROP / "auto-eat"
QUEUE = FEED / "queue.jsonl"
PROBED = FEED / "probed.json"
COMPACT = FEED / "cards-compact.json"
STATUS_JSON = FEED / "status.json"
STATUS_MD = ROOT / "scripts" / "auto-eat" / "STATUS.md"
LEDGER_COMPACT = INTEROP / "ledger-cards-compact.json"

MAX_PAYLOAD_BYTES = 3072  # same 3KB gate as sign_ledger_cards.py


def utcnow() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def http_get(url: str, timeout: int = 15, headers: dict | None = None):
    """Return (status:int, body:bytes|None). Never raises for HTTP errors.

    status < 0 means the request did not complete (UNREACHABLE / UNCHECKABLE).
    """
    h = {"User-Agent": UA, "Accept": "application/json"}
    if headers:
        h.update(headers)
    req = urllib.request.Request(url, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        try:
            body = e.read()
        except Exception:
            body = None
        return e.code, body
    except Exception:
        return -1, None


def http_post_json(url: str, obj: dict, timeout: int = 15):
    """POST JSON, return (status:int, parsed:dict|None). Never raises."""
    data = json.dumps(obj).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"User-Agent": UA, "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, None
    except Exception:
        return -1, None


def load_queue() -> list[dict]:
    if not QUEUE.exists():
        return []
    rows = []
    for line in QUEUE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            rows.append(json.loads(line))
        except Exception:
            continue
    return rows


def queue_keys(rows: list[dict]) -> set[str]:
    return {f"{r.get('kind')}:{r.get('id')}" for r in rows}


def carded_ids() -> set[str]:
    """Best-effort dedupe against ids already named in the human ledger cards
    (e.g. erc8004.callable live_examples) so the loop never re-discovers them."""
    seen: set[str] = set()
    if not LEDGER_COMPACT.exists():
        return seen

    def walk(v):
        if isinstance(v, dict):
            for x in v.values():
                walk(x)
        elif isinstance(v, list):
            for x in v:
                walk(x)
        elif isinstance(v, str):
            tok = v.split()[0] if v.split() else v
            if tok:
                seen.add(tok)

    try:
        walk(json.loads(LEDGER_COMPACT.read_text(encoding="utf-8")))
    except Exception:
        pass
    return seen


def append_queue(rows: list[dict]) -> None:
    FEED.mkdir(parents=True, exist_ok=True)
    with QUEUE.open("a", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False, sort_keys=True) + "\n")


def load_probed() -> set[str]:
    if PROBED.exists():
        try:
            return set(json.loads(PROBED.read_text(encoding="utf-8")))
        except Exception:
            return set()
    return set()


def save_probed(s: set[str]) -> None:
    FEED.mkdir(parents=True, exist_ok=True)
    PROBED.write_text(json.dumps(sorted(s), ensure_ascii=False, indent=0) + "\n", encoding="utf-8")


def slug(surface: str) -> str:
    return surface.replace(".", "-").replace("/", "-")


def load_compact() -> dict:
    if COMPACT.exists():
        try:
            return json.loads(COMPACT.read_text(encoding="utf-8"))
        except Exception:
            return {}
    return {}


def canonical_bytes(obj: dict) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def write_atom(surface: str, subject: str, source_urls: list[str], payload: dict, unmeasured: list[str]) -> tuple[bool, str]:
    """Write an unsigned card-v0 atom + fold surface into cards-compact.json.

    Returns (ok, msg). Enforces the 3KB gate; HELD (not written) if over.
    sig_ed25519 is ALWAYS null here — this path is structurally unable to sign.
    """
    raw = canonical_bytes(payload)
    if len(raw) > MAX_PAYLOAD_BYTES:
        return False, f"HELD {surface} {len(raw)}B > {MAX_PAYLOAD_BYTES}B"
    atom = {
        "schema": "https://councilof.ai/schema/card-v0.json",
        "surface": surface,
        "subject": subject,
        "as_of": payload.get("as_of") or utcnow(),
        "source_urls": source_urls,
        "payload": payload,
        "sig_ed25519": None,
        "state": "queued",
        "unmeasured": unmeasured,
    }
    FEED.mkdir(parents=True, exist_ok=True)
    (FEED / f"card-{slug(surface)}-unsigned.json").write_text(
        json.dumps(atom, indent=1, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    compact = load_compact()
    compact[surface] = payload
    COMPACT.write_text(json.dumps(compact, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    return True, f"OK {surface} {len(raw)}B"
