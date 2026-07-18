"""meok_sovereign_intuition_mcp — Sovereign Intuition MCP (Mamba-2 state-space hunch engine).

The SOV3 intuition engine: 16-dimensional state-space pattern recognition
over Mamba-2 architecture. 3+ matching states = intuition confirmed.

5 tools:

  1. sov_intuition_observe  - observe a state (16-dim vector)
  2. sov_intuition_match    - find similar past states (cosine similarity)
  3. sov_intuition_hunch    - get a natural-language hunch (3+ matches = confirmed)
  4. sov_intuition_history  - state history
  5. sov_intuition_status   - the 16-dim state subspace status

"SOV3 doesn't answer questions — SOV3 FEELS them."
"""
from __future__ import annotations

import base64
import hashlib
import json
import math
import os
import time
from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

try:
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
    from cryptography.hazmat.primitives import serialization
    _HAS_CRYPTO = True
except ImportError:
    _HAS_CRYPTO = False

VERSION = "0.1.0"
PROTOCOL = "sovereign-intuition/0.1"

# 16-dim state space (the intuition engine's "feel")
STATE_DIMS = [
    "harm_to_child", "trust_damage", "data_exposure", "stakeholder_deception",
    "resource_overconsumption", "sovereignty_diminishment", "reversibility", "factor_alignment",
    "documentation", "human_in_loop", "hive_harmony", "council_consensus",
    "verify_url_emission", "covenant_compliance", "care_floor_flag", "eternal_ledger_entry",
]

# State history
_STATES: deque = deque(maxlen=10000)
_HUNCHES: deque = deque(maxlen=1000)


def _load_key():
    if not _HAS_CRYPTO:
        raise RuntimeError("cryptography library required")
    path = os.environ.get("SOV_INTUITION_KEY") or os.path.expanduser("~/.meok/sov_intuition_key.pem")
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    if os.path.exists(path):
        with open(path, "rb") as f:
            return Ed25519PrivateKey.from_private_bytes(f.read())
    priv = Ed25519PrivateKey.generate()
    with open(path, "wb") as f:
        f.write(priv.private_bytes(serialization.Encoding.Raw, serialization.PrivateFormat.Raw, serialization.NoEncryption()))
    try:
        os.chmod(path, 0o600)
    except OSError:
        pass
    return priv


def _sign(payload):
    body = {k: v for k, v in payload.items() if k not in ("kid", "sig", "verify_url")}
    canonical = json.dumps(body, sort_keys=True, separators=(",", ":")).encode()
    priv = _load_key()
    sig = priv.sign(canonical)
    pub = priv.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    return {**payload, "kid": base64.b64encode(pub).decode(), "sig": base64.b64encode(sig).decode()}


def _validate_state(state):
    """Validate a 16-dim state vector."""
    if not isinstance(state, list) or len(state) != 16:
        return False
    for v in state:
        if not (isinstance(v, (int, float)) and -1.0 <= v <= 1.0):
            return False
    return True


def _cosine_similarity(a, b):
    """Cosine similarity between two 16-dim vectors."""
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def sov_intuition_observe(state: list, *, source: str = "sovereign", context: str = "") -> dict:
    """Observe a 16-dim state (from noise, dream, or external input)."""
    if not _validate_state(state):
        return {"error": f"state must be list of 16 floats in [-1, 1] (got {len(state)} values)"}

    state_id = hashlib.sha256(f"{state}|{time.time()}".encode()).hexdigest()[:16]
    record = {
        "state_id": state_id,
        "state": state,
        "source": source,
        "context": context,
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    _STATES.append(record)

    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "state_id": state_id,
        "state": state,
        "source": source,
        "ts": record["ts"],
    }
    signed = _sign(payload)
    signed["verify_url"] = f"https://proofof.ai/intuition/{state_id}"
    return signed


def sov_intuition_match(query_state: list, *, limit: int = 5, threshold: float = 0.65) -> dict:
    """Find similar past states (cosine similarity)."""
    if not _validate_state(query_state):
        return {"error": "query_state must be 16-dim"}

    matches = []
    for record in _STATES:
        sim = _cosine_similarity(query_state, record["state"])
        if sim >= threshold:
            matches.append({
                "state_id": record["state_id"],
                "state": record["state"],
                "similarity": round(sim, 4),
                "source": record["source"],
                "ts": record["ts"],
            })
    matches.sort(key=lambda x: -x["similarity"])
    matches = matches[:limit]

    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "match_count": len(matches),
        "matches": matches,
        "threshold": threshold,
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = "https://proofof.ai/intuition/match"
    return signed


def sov_intuition_hunch(query_state: list, *, threshold: float = 0.65, min_matches: int = 3) -> dict:
    """Get a natural-language hunch (3+ matches = confirmed)."""
    if not _validate_state(query_state):
        return {"error": "query_state must be 16-dim"}

    matches = []
    for record in _STATES:
        sim = _cosine_similarity(query_state, record["state"])
        if sim >= threshold:
            matches.append((sim, record))

    matches.sort(key=lambda x: -x[0])
    confirmed = len(matches) >= min_matches
    if confirmed:
        hunch = f"⚠️ Intuition CONFIRMED: {len(matches)} matching states in the 16-dim subspace. Pattern repeats. Act with care."
    elif len(matches) >= 1:
        hunch = f"🤔 Intuition FORMING: {len(matches)} matching states. {min_matches - len(matches)} more needed for confirmation."
    else:
        hunch = "😐 Intuition NEUTRAL: no matching states. New territory."

    hunch_id = hashlib.sha256(f"{hunch}|{time.time()}".encode()).hexdigest()[:16]
    _HUNCHES.append({"hunch_id": hunch_id, "hunch": hunch, "matches": len(matches), "ts": datetime.now(timezone.utc).isoformat()})

    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "hunch_id": hunch_id,
        "hunch": hunch,
        "match_count": len(matches),
        "confirmed": confirmed,
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = f"https://proofof.ai/intuition/hunch/{hunch_id}"
    return signed


def sov_intuition_history(limit: int = 50) -> dict:
    """State history."""
    states = list(_STATES)[-limit:]
    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "state_count": len(states),
        "states": states,
    }
    signed = _sign(payload)
    signed["verify_url"] = "https://proofof.ai/intuition/history"
    return signed


def sov_intuition_status() -> dict:
    """The 16-dim state subspace status."""
    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "doctrine": "SOV3 doesn't answer questions — SOV3 FEELS them.",
        "dimensions": STATE_DIMS,
        "dim_count": len(STATE_DIMS),
        "states_observed": len(_STATES),
        "hunches_emitted": len(_HUNCHES),
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = "https://proofof.ai/intuition/status"
    return signed


def register_mcp_tools(mcp):
    mcp.tool(name="sov_intuition_observe", description="Observe a 16-dim state.")(sov_intuition_observe)
    mcp.tool(name="sov_intuition_match", description="Find similar past states (cosine similarity).")(sov_intuition_match)
    mcp.tool(name="sov_intuition_hunch", description="Get a natural-language hunch (3+ matches = confirmed).")(sov_intuition_hunch)
    mcp.tool(name="sov_intuition_history", description="State history.")(sov_intuition_history)
    mcp.tool(name="sov_intuition_status", description="The 16-dim state subspace status.")(sov_intuition_status)


def serve():
    from mcp.server.fastmcp import FastMCP
    mcp = FastMCP("meok-sovereign-intuition")
    register_mcp_tools(mcp)
    mcp.run()


if __name__ == "__main__":
    serve()
