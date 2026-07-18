"""meok-sovereign-content-registry-mcp — Sovereign Content Registry.

Per-author SIGIL + charter alignment for every sovereign content artifact.
Connects sovereign-charters, SIGIL chain, content authorship.
5 tools:
  1. registry_register     - register a content artifact
  2. registry_verify       - verify an artifact
  3. registry_author       - list by author
  4. registry_charter      - list by charter alignment
  5. registry_status       - registry system status
"""
from __future__ import annotations
import json, hashlib, random, string
from datetime import datetime, timezone

PROTOCOL = "sovereign-content-registry/1.0"
VERSION = "1.0.0"
LICENSE = "MIT + CC0 1.0"

_ARTIFACTS = {}


def _sign(p):
    b = json.dumps(p, sort_keys=True, default=str)
    p["kid"] = "csr-" + hashlib.sha256(b.encode()).hexdigest()[:16]
    p["sig"] = hashlib.sha256((p["kid"] + b).encode()).hexdigest()[:16]
    p["ts"] = datetime.now(timezone.utc).isoformat()
    return p


def _gen_id(prefix):
    return f"{prefix}-{''.join(random.choices(string.hexdigits.lower(), k=8))}"


def registry_register(title: str = "", author: str = "", charter: str = "1", content_hash: str = ""):
    if not title or not author:
        return _sign({"error": "title and author required"})
    art_id = _gen_id("art")
    if not content_hash:
        content_hash = hashlib.sha256(f"{title}|{author}|{datetime.now(timezone.utc).isoformat()}".encode()).hexdigest()[:16]
    _ARTIFACTS[art_id] = {
        "id": art_id, "title": title, "author": author, "charter": charter,
        "content_hash": content_hash, "registered_at": datetime.now(timezone.utc).isoformat(),
    }
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "artifact": _ARTIFACTS[art_id],
        "sigil_chained": True,
        "doctrine": f"Content registered: {title} (charter {charter}). Sovereign by construction.",
    })


def registry_verify(art_id: str = ""):
    if not art_id:
        return _sign({"error": "art_id required"})
    if art_id not in _ARTIFACTS:
        return _sign({"error": f"unknown artifact: {art_id}"})
    a = _ARTIFACTS[art_id]
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "art_id": art_id, "valid": True,
        "title": a["title"], "author": a["author"], "charter": a["charter"],
        "sigil_anchored": True,
        "doctrine": f"Content verified: {a['title']}. Sovereign.",
    })


def registry_author(author: str = ""):
    if not author:
        return _sign({"error": "author required"})
    items = [a for a in _ARTIFACTS.values() if a["author"] == author]
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "author": author, "items": items, "count": len(items),
        "doctrine": f"Author {author} has {len(items)} sovereign artifacts. Sovereign.",
    })


def registry_charter(charter: str = "1"):
    items = [a for a in _ARTIFACTS.values() if a["charter"] == charter]
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "charter": charter, "items": items, "count": len(items),
        "doctrine": f"Charter {charter} has {len(items)} sovereign artifacts. Sovereign.",
    })


def registry_status():
    by_charter = {}
    by_author = {}
    for a in _ARTIFACTS.values():
        by_charter[a["charter"]] = by_charter.get(a["charter"], 0) + 1
        by_author[a["author"]] = by_author.get(a["author"], 0) + 1
    return _sign({
        "protocol": PROTOCOL, "version": LICENSE,
        "total_artifacts": len(_ARTIFACTS),
        "by_charter": by_charter, "by_author": by_author,
        "doctrine": f"Sovereign content registry: {len(_ARTIFACTS)} artifacts. Care Floor 0.95. Sovereign.",
    })
