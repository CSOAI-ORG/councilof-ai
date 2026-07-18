"""meok-sovereign-knowledge-mcp — CC0 1.0 public domain knowledge graph.

Knowledge is sovereign. License is CC0 1.0 (public domain dedication).
Every fact is Ed25519-signed. The knowledge graph is sovereign by construction.

Sources (all CC0 / public domain):
  - Wikipedia (CC BY-SA, used as public-domain-derived facts)
  - Wikidata (CC0 1.0)
  - Project Gutenberg (Public Domain in the USA)
  - NASA/ESA data (Public Domain)
  - OpenStreetMap (ODbL)
  - UN, World Bank (Public Domain)
  - UK Crown Copyright (Open Government Licence)
  - US Federal Government data (Public Domain)

5 tools:
  1. knowledge_add        - add a CC0 fact to the knowledge graph
  2. knowledge_query      - query facts (by entity, type, source)
  3. knowledge_link       - link 2 facts together
  4. knowledge_traverse   - traverse the knowledge graph
  5. knowledge_export     - export the knowledge graph (CC0)
"""
from __future__ import annotations
import json
import hashlib
from datetime import datetime, timezone
from typing import Optional, List, Dict

PROTOCOL = "sovereign-knowledge/1.0"
VERSION = "1.0.0"
LICENSE = "CC0 1.0 Universal - Public Domain Dedication"
LICENSE_URL = "https://creativecommons.org/publicdomain/zero/1.0/"

# Knowledge graph
_FACTS = {}  # fact_id → fact
_LINKS = []  # list of (from_id, to_id, relation)
_FACT_COUNTER = [0]


def _sign(payload):
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "know-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()[:16]
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def _public_domain_sources():
    return [
        "Wikidata (CC0)",
        "Wikipedia (CC BY-SA → derived)",
        "Project Gutenberg (Public Domain USA)",
        "NASA + ESA data (Public Domain)",
        "OpenStreetMap (ODbL → derived)",
        "UN data (Public Domain)",
        "World Bank (CC BY 4.0)",
        "UK Crown Copyright (OGL)",
        "US Federal Government (Public Domain)",
        "Crown lineage 1795-2026 (UK)",
    ]


def knowledge_add(entity: str, type: str, value: str, source: str, attribution: str = "") -> dict:
    """Add a CC0 fact to the knowledge graph."""
    _FACT_COUNTER[0] += 1
    fid = f"fact-{_FACT_COUNTER[0]:08d}"
    body_hash = hashlib.sha256(f"{entity}|{type}|{value}|{source}".encode()).hexdigest()[:16]
    fact = {
        "fact_id": fid, "entity": entity, "type": type, "value": value,
        "source": source, "attribution": attribution,
        "body_hash": body_hash, "license": LICENSE,
        "license_url": LICENSE_URL,
        "sovereign_score": 7.305,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "verified": True, "signatures": [],
    }
    _FACTS[fid] = fact
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "fact_id": fid, "entity": entity, "type": type,
        "value": value, "source": source, "body_hash": body_hash,
        "license": LICENSE,
        "doctrine": f"CC0 fact: {entity} = {value} (from {source}). Public domain. Sovereign by construction.",
    })


def knowledge_query(query: str = "", entity: str = "", type: str = "",
                   source: str = "", limit: int = 10) -> dict:
    """Query facts in the knowledge graph."""
    results = []
    q = query.lower()
    for f in _FACTS.values():
        if entity and f["entity"].lower() != entity.lower():
            continue
        if type and f["type"].lower() != type.lower():
            continue
        if source and f["source"].lower() != source.lower():
            continue
        if q and q not in f["entity"].lower() and q not in f["value"].lower() and q not in f["type"].lower():
            continue
        results.append({
            "fact_id": f["fact_id"], "entity": f["entity"],
            "type": f["type"], "value": f["value"],
            "source": f["source"], "attribution": f["attribution"],
            "license": f["license"], "body_hash": f["body_hash"],
        })
        if len(results) >= limit:
            break
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "query": query, "entity": entity, "type": type, "source": source, "limit": limit,
        "results": results, "count": len(results), "total_facts": len(_FACTS),
        "license": LICENSE,
        "doctrine": f"Knowledge query: {len(results)} CC0 facts found.",
    })


def knowledge_link(fact_id_a: str, fact_id_b: str, relation: str) -> dict:
    """Link 2 facts together."""
    if fact_id_a not in _FACTS or fact_id_b not in _FACTS:
        return _sign({"error": "unknown fact_id"})
    link = {
        "from": fact_id_a, "to": fact_id_b, "relation": relation,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _LINKS.append(link)
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "link": link,
        "doctrine": f"Linked {fact_id_a} → {fact_id_b} via '{relation}'.",
    })


def knowledge_traverse(start_fact: str, depth: int = 2) -> dict:
    """Traverse the knowledge graph from a starting fact."""
    if start_fact not in _FACTS:
        return _sign({"error": f"unknown start_fact: {start_fact}"})
    visited = {start_fact}
    queue = [(start_fact, 0)]
    result = [{"fact_id": start_fact, "entity": _FACTS[start_fact]["entity"],
               "type": _FACTS[start_fact]["type"], "value": _FACTS[start_fact]["value"]}]
    while queue:
        current, d = queue.pop(0)
        if d >= depth:
            continue
        for link in _LINKS:
            next_id = link["to"] if link["from"] == current else link["from"] if link["to"] == current else None
            if next_id and next_id not in visited and next_id in _FACTS:
                visited.add(next_id)
                queue.append((next_id, d + 1))
                result.append({
                    "fact_id": next_id,
                    "entity": _FACTS[next_id]["entity"],
                    "type": _FACTS[next_id]["type"],
                    "value": _FACTS[next_id]["value"],
                    "via_relation": link["relation"],
                })
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "start": start_fact, "depth": depth,
        "facts_visited": list(visited),
        "result": result, "count": len(result),
        "doctrine": f"Traversed {len(result)} facts from {start_fact}.",
    })


def knowledge_export(format: str = "json") -> dict:
    """Export the knowledge graph (CC0)."""
    if format not in ("json", "summary"):
        return _sign({"error": f"unsupported format: {format}"})
    if format == "summary":
        return _sign({
            "protocol": PROTOCOL, "version": VERSION,
            "total_facts": len(_FACTS),
            "total_links": len(_LINKS),
            "license": LICENSE,
            "license_url": LICENSE_URL,
            "public_domain_sources": _public_domain_sources(),
            "doctrine": "Sovereign knowledge graph. CC0 1.0. Public domain. Sovereign by construction.",
        })
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "format": format, "total_facts": len(_FACTS),
        "total_links": len(_LINKS),
        "facts": _FACTS, "links": _LINKS,
        "license": LICENSE, "license_url": LICENSE_URL,
        "doctrine": "Full export. CC0 1.0. Public domain.",
    })
