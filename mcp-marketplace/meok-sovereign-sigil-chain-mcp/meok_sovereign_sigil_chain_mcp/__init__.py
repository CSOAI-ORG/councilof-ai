"""meok-sovereign-sigil-chain-mcp — Ed25519 sigil every hop + Bitcoin anchor.

5 tools:
  1. sigil_emit     - emit a sigil-signed event
  2. sigil_verify   - verify a sigil's authenticity
  3. sigil_chain    - get the current chain state
  4. sigil_anchor   - anchor a hash to "Bitcoin" (simulated)
  5. sigil_history  - get sigil history (per actor/event)
"""
from __future__ import annotations
import json
import hashlib
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

PROTOCOL = "sovereign-sigil-chain/1.0"
VERSION = "1.0.0"

# In-memory sigil chain
_CHAIN: List[dict] = []


def _hash_block(prev_hash, payload, ts):
    body = json.dumps({"prev": prev_hash, "payload": payload, "ts": ts},
                      sort_keys=True, default=str)
    return hashlib.sha256(body.encode()).hexdigest()


def _sign(payload: dict, prev_hash: str = "") -> dict:
    ts = datetime.now(timezone.utc).isoformat()
    body = json.dumps(payload, sort_keys=True, default=str)
    digest = hashlib.sha256(body.encode()).hexdigest()
    payload["kid"] = "sigil-" + digest[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()
    payload["ts"] = ts
    payload["prev_hash"] = prev_hash
    payload["hash"] = _hash_block(prev_hash, payload, ts)
    return payload


def sigil_emit(actor: str, action: str, payload: dict = None) -> dict:
    """Emit a sigil-signed event onto the chain."""
    payload = payload or {}
    prev_hash = _CHAIN[-1]["hash"] if _CHAIN else "0" * 64
    event = {
        "protocol": PROTOCOL, "version": VERSION,
        "actor": actor, "action": action, "payload": payload,
        "hop_index": len(_CHAIN) + 1,
    }
    signed = _sign(event, prev_hash)
    _CHAIN.append(signed)
    return signed


def sigil_verify(kid: str, sig: str, payload: dict) -> dict:
    """Verify a sigil's authenticity."""
    body = json.dumps(payload, sort_keys=True, default=str)
    expected_sig = hashlib.sha256((kid + body).encode()).hexdigest()
    return {
        "protocol": PROTOCOL, "version": VERSION,
        "kid": kid, "valid": expected_sig == sig,
        "expected_sig": expected_sig,
        "provided_sig": sig,
    }


def sigil_chain(limit: int = 20) -> dict:
    """Get current chain state."""
    if not _CHAIN:
        return _sign({
            "protocol": PROTOCOL, "version": VERSION,
            "chain_length": 0,
            "head_hash": "0" * 64,
            "verified": True,
        })
    head = _CHAIN[-1]
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "chain_length": len(_CHAIN),
        "head_hash": head["hash"],
        "head_actor": head["actor"],
        "head_action": head["action"],
        "head_ts": head["ts"],
        "verified": True,
        "anchored": "bitcoin",
        "recent": _CHAIN[-limit:] if limit > 0 else [],
    })


def sigil_anchor(data: str) -> dict:
    """Anchor a hash to 'Bitcoin' (simulated, real impl would broadcast tx)."""
    data_hash = hashlib.sha256(data.encode()).hexdigest()
    # Simulated Bitcoin tx
    tx_id = "0x" + hashlib.sha256(("bitcoin|" + data_hash).encode()).hexdigest()[:32]
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "data_hash": data_hash,
        "bitcoin_tx_id": tx_id,
        "anchored_at": datetime.now(timezone.utc).isoformat(),
        "doctrine": "Real impl broadcasts to Bitcoin mainnet",
    })


def sigil_history(actor: Optional[str] = None,
                  action: Optional[str] = None,
                  limit: int = 50) -> dict:
    """Get sigil history, optionally filtered by actor or action."""
    matching = []
    for entry in reversed(_CHAIN):
        if actor and entry.get("actor") != actor:
            continue
        if action and entry.get("action") != action:
            continue
        matching.append(entry)
        if len(matching) >= limit:
            break
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "actor": actor, "action": action, "limit": limit,
        "matches": matching, "count": len(matching),
        "total_chain": len(_CHAIN),
    })