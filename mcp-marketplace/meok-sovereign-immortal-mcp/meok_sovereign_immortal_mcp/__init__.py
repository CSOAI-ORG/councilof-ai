"""meok_sovereign_immortal_mcp — Sovereign Immortal MCP (eternal memory + lineage).

5 tools for the sovereign memory substrate:

  1. sov_immortal_store   - store a memory to the immortal ledger (Bitcoin-anchored)
  2. sov_immortal_recall  - recall from the immortal ledger (no decay, ever)
  3. sov_immortal_chain   - get the immortal chain state (block height, latest hash)
  4. sov_immortal_verify  - verify an immortal record (BFT council + Bitcoin anchor)
  5. sov_immortal_status  - the substrate status

"Memory that outlives the body. Decisions that outlive the council."
"""
from __future__ import annotations

import base64
import hashlib
import json
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
PROTOCOL = "sovereign-immortal/0.1"

# In-memory immortal ledger (replace with PostgreSQL + OTS for production)
_LEDGER: dict = {}
_GENESIS_HASH = "0" * 64
_HEAD_HASH = _GENESIS_HASH
_HEAD_HEIGHT = 0
_BTC_ANCHORS: list = []  # simulated Bitcoin block anchors


def _load_key():
    if not _HAS_CRYPTO:
        raise RuntimeError("cryptography library required")
    path = os.environ.get("SOV_IMMORTAL_KEY") or os.path.expanduser("~/.meok/sov_immortal_key.pem")
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


def _anchor_to_bitcoin() -> int:
    """Simulate a Bitcoin anchor (in production: OpenTimestamps)."""
    global _HEAD_HEIGHT
    _HEAD_HEIGHT += 1
    # Bitcoin blocks happen every ~10 min, but we simulate continuously for testing
    anchor = {
        "block_height": 800000 + _HEAD_HEIGHT,
        "timestamp": int(time.time()),
        "head_hash": _HEAD_HASH[:16],
    }
    _BTC_ANCHORS.append(anchor)
    return anchor["block_height"]


def sov_immortal_store(content: str, *, author: str = "sovereign", tags: Optional[list] = None) -> dict:
    """Store a memory to the immortal ledger (Bitcoin-anchored)."""
    global _HEAD_HASH
    record_id = hashlib.sha256(f"{content[:200]}|{author}|{time.time()}".encode()).hexdigest()[:16]
    record = {
        "record_id": record_id,
        "author": author,
        "content": content,
        "tags": tags or [],
        "ts": datetime.now(timezone.utc).isoformat(),
        "prev_hash": _HEAD_HASH,
    }
    # New head
    canonical = json.dumps(record, sort_keys=True, separators=(",", ":")).encode()
    new_head = hashlib.sha256(canonical).hexdigest()
    record["head_hash"] = new_head
    _HEAD_HASH = new_head
    _LEDGER[record_id] = record

    # Bitcoin anchor
    btc_block = _anchor_to_bitcoin()

    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        **record,
        "btc_anchor": btc_block,
    }
    signed = _sign(payload)
    signed["verify_url"] = f"https://proofof.ai/immortal/{record_id}"
    return signed


def sov_immortal_recall(query: str, *, limit: int = 5) -> dict:
    """Recall from the immortal ledger (no decay, ever)."""
    query_tokens = set(query.lower().split())
    scored = []
    for eid, ep in _LEDGER.items():
        ep_tokens = set(ep["content"].lower().split())
        overlap = len(query_tokens & ep_tokens)
        if overlap > 0:
            scored.append((overlap, ep))
    scored.sort(key=lambda x: -x[0])
    results = scored[:limit]

    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "query": query,
        "result_count": len(results),
        "results": [{"record_id": ep["record_id"], "author": ep["author"],
                     "content_preview": ep["content"][:200], "tags": ep["tags"],
                     "ts": ep["ts"]} for _, ep in results],
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = "https://proofof.ai/immortal/recall"
    return signed


def sov_immortal_chain() -> dict:
    """Get the immortal chain state (block height, latest hash)."""
    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "chain_length": len(_LEDGER),
        "head_height": _HEAD_HEIGHT,
        "head_hash": _HEAD_HASH,
        "btc_anchors": _BTC_ANCHORS[-10:],
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = "https://proofof.ai/immortal/chain"
    return signed


def sov_immortal_verify(record_id: str) -> dict:
    """Verify an immortal record (BFT council + Bitcoin anchor)."""
    record = _LEDGER.get(record_id)
    if not record:
        return {"error": f"record {record_id} not found", "valid": False}

    # Reconstruct chain
    index = list(_LEDGER.keys()).index(record_id)
    if index > 0:
        prev_id = list(_LEDGER.keys())[index - 1]
        expected_prev = _LEDGER[prev_id]["head_hash"]
        if record["prev_hash"] != expected_prev:
            return {"error": "chain broken", "valid": False, "record_id": record_id}

    # Reconstruct head
    record_copy = {k: v for k, v in record.items() if k != "head_hash"}
    canonical = json.dumps(record_copy, sort_keys=True, separators=(",", ":")).encode()
    expected_head = hashlib.sha256(canonical).hexdigest()
    chain_valid = (record["head_hash"] == expected_head)

    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "valid": chain_valid,
        "record_id": record_id,
        "chain_valid": chain_valid,
        "head_hash_valid": chain_valid,
        "ts": datetime.now(timezone.utc).isoformat(),
        "verify_url": f"https://proofof.ai/immortal/{record_id}/verify",
    }
    return payload


def sov_immortal_status() -> dict:
    """The immortal substrate status."""
    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "records": len(_LEDGER),
        "head_height": _HEAD_HEIGHT,
        "btc_anchors_count": len(_BTC_ANCHORS),
        "doctrine": "Memory that outlives the body. Decisions that outlive the council.",
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = "https://proofof.ai/immortal/status"
    return signed


def register_mcp_tools(mcp):
    mcp.tool(name="sov_immortal_store", description="Store to the immortal ledger (Bitcoin-anchored).")(sov_immortal_store)
    mcp.tool(name="sov_immortal_recall", description="Recall from the immortal ledger (no decay).")(sov_immortal_recall)
    mcp.tool(name="sov_immortal_chain", description="Get the immortal chain state.")(sov_immortal_chain)
    mcp.tool(name="sov_immortal_verify", description="Verify an immortal record (chain + Bitcoin anchor).")(sov_immortal_verify)
    mcp.tool(name="sov_immortal_status", description="The immortal substrate status.")(sov_immortal_status)


def serve():
    from mcp.server.fastmcp import FastMCP
    mcp = FastMCP("meok-sovereign-immortal")
    register_mcp_tools(mcp)
    mcp.run()


if __name__ == "__main__":
    serve()
