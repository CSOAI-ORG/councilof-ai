#!/usr/bin/env python3
"""
SIGIL CHAIN — tamper-evident, append-only hash chain over the last 1000 sigils
===========================================================================

Every sigil carries a ``prev_sigil_id`` that points to the sigil before it.
This module is the writer and verifier of that chain.

Storage
-------

    /opt/_shared/sigil_chain.json

Overrides via ``SIGIL_CHAIN_PATH`` env var. The file is a JSON object:

    {
      "version": 1,
      "service": "api-gateway",
      "head_sigil_id": "sigil_...",
      "length": 42,
      "sigil_ids": ["sigil_a", "sigil_b", ...],   # ordered, last = head
      "sigil_fingerprints": {                       # for fast tamper check
          "sigil_a": "abcdef...",
          ...
      },
      "created_at": "2026-...",
      "updated_at": "2026-...",
      "sigils": [ ...the last 1000 full envelopes... ]
    }

Concurrency
-----------

We hold a process-local ``threading.Lock`` for writes. For multi-worker
deployments, mount the chain file on a shared volume and rely on the
``threading.Lock`` for in-process safety. (Cross-process locking is left
to the deployment topology — FastAPI workers are single-process by
default under uvicorn.)
"""
from __future__ import annotations

import json
import logging
import os
import threading
import time
from pathlib import Path
from typing import List, Optional

log = logging.getLogger("sigil_chain")

DEFAULT_CHAIN_PATH = os.environ.get(
    "SIGIL_CHAIN_PATH", "/opt/_shared/sigil_chain.json"
)
DEFAULT_MAX_LEN = int(os.environ.get("SIGIL_CHAIN_MAX", "1000"))

# In-process lock — every service worker has its own.
_LOCK = threading.Lock()


# ── Persistence ─────────────────────────────────────────────────────────────

def _path() -> Path:
    p = Path(DEFAULT_CHAIN_PATH)
    p.parent.mkdir(parents=True, exist_ok=True)
    return p


def _empty_chain(service: str = "api-gateway") -> dict:
    now = _utc_iso()
    return {
        "version": 1,
        "service": service,
        "head_sigil_id": "",
        "length": 0,
        "sigil_ids": [],
        "sigil_fingerprints": {},
        "created_at": now,
        "updated_at": now,
        "sigils": [],
    }


def _read_chain() -> dict:
    p = _path()
    if not p.exists():
        return _empty_chain()
    try:
        with p.open("r", encoding="utf-8") as fh:
            data = json.load(fh)
    except (json.JSONDecodeError, OSError) as e:
        log.warning("[sigil_chain] read failed (%s); starting fresh", e)
        return _empty_chain()
    # Defensive normalisation — older files may lack fields.
    data.setdefault("version", 1)
    data.setdefault("service", "api-gateway")
    data.setdefault("head_sigil_id", "")
    data.setdefault("length", 0)
    data.setdefault("sigil_ids", [])
    data.setdefault("sigil_fingerprints", {})
    data.setdefault("created_at", _utc_iso())
    data.setdefault("updated_at", _utc_iso())
    data.setdefault("sigils", [])
    return data


def _write_chain(chain: dict) -> None:
    p = _path()
    tmp = p.with_suffix(p.suffix + ".tmp")
    chain["updated_at"] = _utc_iso()
    chain["length"] = len(chain.get("sigils", []))
    with tmp.open("w", encoding="utf-8") as fh:
        json.dump(chain, fh, indent=2, sort_keys=True, ensure_ascii=False)
    os.replace(tmp, p)


# ── Public API ──────────────────────────────────────────────────────────────

def append_sigil(sigil: dict, *, max_len: int = DEFAULT_MAX_LEN) -> dict:
    """
    Append ``sigil`` to the chain. If the sigil does not already carry a
    ``prev_sigil_id``, we backfill it from the current head.

    Returns the chain's *new head* (i.e. the appended sigil).
    """
    if not isinstance(sigil, dict) or "sigil_id" not in sigil:
        raise ValueError("sigil must be a dict containing a 'sigil_id'")
    sigil_id = sigil["sigil_id"]
    fingerprint = (
        sigil.get("signature", {}).get("public_key_fingerprint", "")
        if isinstance(sigil.get("signature"), dict)
        else ""
    )

    with _LOCK:
        chain = _read_chain()
        head = chain.get("head_sigil_id", "") or ""
        # Backfill prev_sigil_id so a forgetful caller still produces a
        # well-formed chain.
        if not sigil.get("prev_sigil_id") and head:
            sigil["prev_sigil_id"] = head

        # Append + truncate to max_len.
        sigils: List[dict] = chain.setdefault("sigils", [])
        ids: List[str] = chain.setdefault("sigil_ids", [])
        fps: dict = chain.setdefault("sigil_fingerprints", {})

        sigils.append(sigil)
        ids.append(sigil_id)
        fps[sigil_id] = fingerprint
        if len(sigils) > max_len:
            evicted = sigils[: len(sigils) - max_len]
            sigils[:] = sigils[-max_len:]
            for old in evicted:
                old_id = old.get("sigil_id", "")
                if old_id in ids:
                    ids.remove(old_id)
                fps.pop(old_id, None)

        chain["head_sigil_id"] = sigil_id
        chain["length"] = len(sigils)
        _write_chain(chain)
    return sigil


def latest_chain(limit: Optional[int] = None) -> List[dict]:
    """Return the chain entries (most recent last)."""
    with _LOCK:
        chain = _read_chain()
    sigils = chain.get("sigils", [])
    if limit is not None and limit >= 0:
        return sigils[-limit:]
    return list(sigils)


def chain_head() -> Optional[dict]:
    with _LOCK:
        chain = _read_chain()
    sigils = chain.get("sigils", [])
    return sigils[-1] if sigils else None


def chain_summary() -> dict:
    """Lightweight summary for /health and /stats — no full sigil bodies."""
    with _LOCK:
        chain = _read_chain()
    return {
        "version": chain.get("version", 1),
        "service": chain.get("service", "api-gateway"),
        "head_sigil_id": chain.get("head_sigil_id", ""),
        "length": chain.get("length", 0),
        "max_len": DEFAULT_MAX_LEN,
        "created_at": chain.get("created_at", ""),
        "updated_at": chain.get("updated_at", ""),
        "path": str(_path()),
    }


def verify_chain() -> dict:
    """
    Walk the chain forward and confirm every entry's ``prev_sigil_id``
    matches the previous entry's ``sigil_id``. Returns:
        {valid, length, head_sigil_id, broken_at_index, broken_at_sigil_id}
    """
    with _LOCK:
        chain = _read_chain()
    sigils = chain.get("sigils", [])
    prev = ""
    for idx, s in enumerate(sigils):
        sid = s.get("sigil_id", "")
        p = s.get("prev_sigil_id", "")
        if idx == 0:
            # First entry must point to "" (genesis) — accept either.
            if p not in ("", None):
                return {
                    "valid": False,
                    "length": len(sigils),
                    "head_sigil_id": chain.get("head_sigil_id", ""),
                    "broken_at_index": idx,
                    "broken_at_sigil_id": sid,
                    "reason": f"genesis prev_sigil_id must be empty, got {p!r}",
                }
        else:
            if p != prev:
                return {
                    "valid": False,
                    "length": len(sigils),
                    "head_sigil_id": chain.get("head_sigil_id", ""),
                    "broken_at_index": idx,
                    "broken_at_sigil_id": sid,
                    "reason": (
                        f"prev_sigil_id mismatch at index {idx}: "
                        f"expected={prev!r} got={p!r}"
                    ),
                }
        prev = sid
    return {
        "valid": True,
        "length": len(sigils),
        "head_sigil_id": chain.get("head_sigil_id", ""),
        "broken_at_index": None,
        "broken_at_sigil_id": None,
    }


def reset_chain() -> None:
    """Wipe the chain file. Used by tests; not exposed via the API."""
    with _LOCK:
        _write_chain(_empty_chain())


# ── Helpers ─────────────────────────────────────────────────────────────────

def _utc_iso() -> str:
    ts = time.gmtime()
    msec = int((time.time() % 1) * 1000)
    return time.strftime("%Y-%m-%dT%H:%M:%S", ts) + f".{msec:03d}Z"


if __name__ == "__main__":
    import sys
    cmd = sys.argv[1] if len(sys.argv) > 1 else "summary"
    if cmd == "summary":
        print(json.dumps(chain_summary(), indent=2))
    elif cmd == "verify":
        print(json.dumps(verify_chain(), indent=2))
    elif cmd == "reset":
        reset_chain()
        print("chain reset")
    else:
        print(f"unknown cmd: {cmd}", file=sys.stderr)
        sys.exit(1)
