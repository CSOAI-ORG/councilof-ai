"""meok_sovereign_memory_mcp — Sovereign Memory MCP.

5 tools for sovereign long-term memory:
  1. sov_memory_store - store a memory episode
  2. sov_memory_recall - recall by query (hybrid retrieval)
  3. sov_memory_link - link two memories (knowledge graph edge)
  4. sov_memory_decay - apply Ebbinghaus temporal decay
  5. sov_memory_snapshot - signed snapshot of entire memory graph
"""
from __future__ import annotations

import base64
import hashlib
import json
import math
import os
import time
from collections import defaultdict
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
PROTOCOL = "sovereign-memory/0.1"

# In-memory store (replace with cognee/memvid backend for production)
_EPISODES: dict = {}        # episode_id → memory dict
_GRAPH: dict = defaultdict(set)  # memory_id → set of linked memory_ids
_TOKENS_PER_EPISODE = 256  # recall budget


def _load_key():
    if not _HAS_CRYPTO:
        raise RuntimeError("cryptography library required")
    path = os.environ.get("SOV_MEMORY_KEY") or os.path.expanduser("~/.meok/sov_memory_key.pem")
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


def sov_memory_store(
    content: str,
    *,
    agent_id: str = "sovereign",
    tags: Optional[list] = None,
    emotion: str = "neutral",
    importance: float = 0.5,
) -> dict:
    """Store a memory episode (cognee-style)."""
    episode_id = hashlib.sha256(
        f"{content[:200]}|{agent_id}|{time.time()}".encode()
    ).hexdigest()[:16]
    tokens = content.split()  # simple word tokenizer
    summary = " ".join(tokens[:20])

    episode = {
        "episode_id": episode_id,
        "agent_id": agent_id,
        "content": content,
        "summary": summary,
        "tokens": tokens,
        "tags": tags or [],
        "emotion": emotion,
        "importance": max(0.0, min(1.0, importance)),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "ts": time.time(),
        "linked_to": [],
    }
    _EPISODES[episode_id] = episode

    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "episode_id": episode_id,
        "agent_id": agent_id,
        "summary": summary,
        "tags": episode["tags"],
        "emotion": emotion,
        "importance": episode["importance"],
        "created_at": episode["created_at"],
    }
    signed = _sign(payload)
    signed["verify_url"] = f"https://proofof.ai/memory/{episode_id}"
    return signed


def sov_memory_recall(query: str, *, limit: int = 5, agent_filter: Optional[str] = None) -> dict:
    """Hybrid retrieval: lexical + recency + importance scoring (memvid-style)."""
    query_tokens = set(query.lower().split())
    scored = []
    for eid, ep in _EPISODES.items():
        if agent_filter and ep["agent_id"] != agent_filter:
            continue
        # Lexical overlap
        ep_tokens = set(t.lower() for t in ep["tokens"])
        overlap = len(query_tokens & ep_tokens)
        if overlap == 0:
            continue
        # Recency decay (Ebbinghaus-style)
        age_hours = (time.time() - ep["ts"]) / 3600
        recency = math.exp(-age_hours / 168)  # 1 week half-life
        # Final score
        score = overlap * ep["importance"] * recency
        scored.append((score, ep))

    scored.sort(key=lambda x: -x[0])
    results = scored[:limit]

    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "query": query,
        "limit": limit,
        "result_count": len(results),
        "results": [{"episode_id": ep["episode_id"], "summary": ep["summary"],
                     "score": round(s, 4), "tags": ep["tags"], "agent_id": ep["agent_id"],
                     "created_at": ep["created_at"]} for s, ep in results],
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = "https://proofof.ai/memory/recall"
    return signed


def sov_memory_link(episode_id_a: str, episode_id_b: str, *, link_type: str = "related") -> dict:
    """Link two memories (knowledge graph edge)."""
    if episode_id_a not in _EPISODES:
        return {"error": f"unknown episode: {episode_id_a}"}
    if episode_id_b not in _EPISODES:
        return {"error": f"unknown episode: {episode_id_b}"}

    _GRAPH[episode_id_a].add(episode_id_b)
    _GRAPH[episode_id_b].add(episode_id_a)
    _EPISODES[episode_id_a]["linked_to"].append(episode_id_b)
    _EPISODES[episode_id_b]["linked_to"].append(episode_id_a)

    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "link": {"from": episode_id_a, "to": episode_id_b, "type": link_type},
        "graph_size": sum(len(s) for s in _GRAPH.values()) // 2,
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = f"https://proofof.ai/memory/link/{episode_id_a}-{episode_id_b}"
    return signed


def sov_memory_decay(*, half_life_hours: float = 168) -> dict:
    """Apply Ebbinghaus temporal decay to all memories (returns adjusted scores)."""
    decay_count = 0
    for ep in _EPISODES.values():
        age_hours = (time.time() - ep["ts"]) / 3600
        new_score = math.exp(-age_hours / half_life_hours)
        ep["decay_score"] = new_score
        decay_count += 1

    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "decay_count": decay_count,
        "half_life_hours": half_life_hours,
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = "https://proofof.ai/memory/decay"
    return signed


def sov_memory_snapshot() -> dict:
    """Signed snapshot of the entire memory graph."""
    edges = []
    for src, targets in _GRAPH.items():
        for tgt in targets:
            if src < tgt:  # dedupe
                edges.append({"from": src, "to": tgt})

    snapshot_id = hashlib.sha256(
        json.dumps({"episodes": list(_EPISODES.keys()), "edges": edges}, sort_keys=True).encode()
    ).hexdigest()[:16]

    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "snapshot_id": snapshot_id,
        "episode_count": len(_EPISODES),
        "edge_count": len(edges),
        "graph": {
            "episodes": [{"id": ep["episode_id"], "summary": ep["summary"],
                          "agent_id": ep["agent_id"], "tags": ep["tags"]}
                         for ep in _EPISODES.values()],
            "edges": edges,
        },
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = f"https://proofof.ai/memory/snapshot/{snapshot_id}"
    return signed


def register_mcp_tools(mcp):
    mcp.tool(name="sov_memory_store", description="Store a sovereign memory episode.")(sov_memory_store)
    mcp.tool(name="sov_memory_recall", description="Recall memories by query (hybrid retrieval).")(sov_memory_recall)
    mcp.tool(name="sov_memory_link", description="Link two memories (knowledge graph edge).")(sov_memory_link)
    mcp.tool(name="sov_memory_decay", description="Apply Ebbinghaus temporal decay to all memories.")(sov_memory_decay)
    mcp.tool(name="sov_memory_snapshot", description="Signed snapshot of entire memory graph.")(sov_memory_snapshot)


def serve():
    from mcp.server.fastmcp import FastMCP
    mcp = FastMCP("meok-sovereign-memory")
    register_mcp_tools(mcp)
    mcp.run()


if __name__ == "__main__":
    serve()
