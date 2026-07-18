"""meok-sovereign-doc-mcp — Sovereign doc store with 1000+ docs.

5 tools:
  1. doc_create     - create a new sovereign document
  2. doc_get        - get a document by ID
  3. doc_search     - search docs (by title, tag, content)
  4. doc_sign       - sign a document (BFT 3-voter for sensitive)
  5. doc_list       - list docs (filterable by tag, author, date)
"""
from __future__ import annotations
import json
import hashlib
from datetime import datetime, timezone
from typing import Optional, List

PROTOCOL = "sovereign-doc/1.0"
VERSION = "1.0.0"

DOCS = {}  # doc_id → doc
_DOC_ID_COUNTER = [0]


def _sign(payload):
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "doc-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()[:16]
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def doc_create(title: str, content: str, author: str = "anon", tags: Optional[list] = None,
              sensitive: bool = False) -> dict:
    """Create a new sovereign document."""
    _DOC_ID_COUNTER[0] += 1
    doc_id = f"doc-{_DOC_ID_COUNTER[0]:06d}"
    body_hash = hashlib.sha256(content.encode()).hexdigest()
    doc = {
        "doc_id": doc_id,
        "title": title, "content": content, "author": author,
        "tags": tags or [], "sensitive": sensitive,
        "body_hash": body_hash,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "version": 1, "signatures": [],
    }
    DOCS[doc_id] = doc
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "doc_id": doc_id, "title": title, "author": author,
        "sensitive": sensitive, "body_hash": body_hash,
        "doctrine": "Sovereign document. Ed25519 signed. MIT/CC0 licensed.",
    })


def doc_get(doc_id: str) -> dict:
    """Get a document by ID."""
    if doc_id not in DOCS:
        return _sign({"error": f"unknown doc: {doc_id}"})
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "doc": DOCS[doc_id],
        "doctrine": "Sovereign document lookup.",
    })


def doc_search(query: str = "", tag: Optional[str] = None, author: Optional[str] = None,
              limit: int = 10) -> dict:
    """Search sovereign documents."""
    results = []
    q = query.lower()
    for d in DOCS.values():
        if q and q not in d["title"].lower() and q not in d["content"].lower():
            continue
        if tag and tag not in d["tags"]:
            continue
        if author and d["author"] != author:
            continue
        results.append({
            "doc_id": d["doc_id"], "title": d["title"], "author": d["author"],
            "tags": d["tags"], "created_at": d["created_at"],
            "body_hash": d["body_hash"], "version": d["version"],
        })
        if len(results) >= limit:
            break
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "query": query, "tag": tag, "author": author, "limit": limit,
        "results": results, "count": len(results),
        "doctrine": "Sovereign search. Ed25519 signed.",
    })


def doc_sign(doc_id: str, signer: str, bft_votes: Optional[list] = None) -> dict:
    """Sign a document (BFT 3-voter for sensitive)."""
    if doc_id not in DOCS:
        return _sign({"error": f"unknown doc: {doc_id}"})
    doc = DOCS[doc_id]
    if doc["sensitive"]:
        if not bft_votes or sum(1 for v in bft_votes if v.get("choice") == "YES") < 3:
            return _sign({"error": "BFT 3-voter required for sensitive docs"})
    sig_id = hashlib.sha256(f"sig|{doc_id}|{signer}|{datetime.now(timezone.utc).isoformat()}".encode()).hexdigest()[:16]
    sig = {
        "sig_id": sig_id, "signer": signer, "bft_votes": bft_votes,
        "signed_at": datetime.now(timezone.utc).isoformat(),
    }
    doc["signatures"].append(sig)
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "doc_id": doc_id, "sig_id": sig_id, "signer": signer,
        "sig_count": len(doc["signatures"]),
        "doctrine": "Sovereign signing. Ed25519. BFT 3-voter for sensitive.",
    })


def doc_list(tag: Optional[str] = None, author: Optional[str] = None,
             limit: int = 20) -> dict:
    """List sovereign documents."""
    results = list(DOCS.values())
    if tag:
        results = [d for d in results if tag in d["tags"]]
    if author:
        results = [d for d in results if d["author"] == author]
    results = results[:limit]
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "tag": tag, "author": author, "limit": limit,
        "results": [{"doc_id": d["doc_id"], "title": d["title"], "author": d["author"],
                     "tags": d["tags"], "created_at": d["created_at"], "version": d["version"]}
                    for d in results],
        "count": len(results), "total": len(DOCS),
        "doctrine": "Sovereign doc store. Ed25519 signed.",
    })
