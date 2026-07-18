"""meok-sovereign-search-mcp — Sovereign Full-Text + Semantic Search.

In-memory inverted index + simple semantic vectors.
Searches MCPs, charters, and documentation.

5 tools:
  1. search_index     - index a document
  2. search_query     - search across the index
  3. search_semantic  - semantic similarity search
  4. search_list      - list all indexed documents
  5. search_status    - search engine status
"""
from __future__ import annotations
import json
import hashlib
import re
import string
import random
from datetime import datetime, timezone
from collections import defaultdict

PROTOCOL = "sovereign-search/1.0"
VERSION = "1.0.0"
LICENSE = "MIT + CC0 1.0"

# Inverted index: word -> {doc_id -> count}
_INDEX = defaultdict(lambda: defaultdict(int))
# Documents
_DOCS = {}  # doc_id -> {title, body, kind, tags, indexed_at}
# Document vectors (simple bag-of-words for semantic similarity)
_VECTORS = {}  # doc_id -> {word: count}

# Pre-populate with sovereign content
SEED_DOCS = [
    ("mcp-sigil", "Layer 0", "Ed25519 signing and verification for sovereign documents. SHA-256 hash-chained SIGIL chain. Every sovereign action emits a SIGIL. Tamper-evident. Forever verifiable offline.", ["sigil", "ed25519", "sign", "verify", "hash-chain"]),
    ("mcp-bft", "Layer 0", "BFT 12-around-1 voting council. Quorum 7/12. Ed25519-signed votes. Tamper-evident. Sovereign by construction.", ["bft", "voting", "12-around-1", "consensus", "quorum"]),
    ("mcp-care-floor", "Layer 0", "Care Floor 0.95 with 16 probes. Validates every sovereign action. Never-offends invariant. Article 0 binding.", ["care-floor", "0.95", "16-probes", "validate", "care"]),
    ("mcp-watchdog", "Layer 0", "Public watchdog for humans, agents, humanoids, systems. Reports + heatmap + anomaly detection. Sovereign.", ["watchdog", "public", "alerts", "humanoid", "agent"]),
    ("mcp-hive-pheromone", "Layer 0", "Hive pheromone signal network. SIGIL Horus Sirius. Distributed coordination.", ["pheromone", "sigil-horus-sirius", "hive", "coordination"]),
    ("mcp-passport", "Layer 1", "W3C DID sovereign passport. Self-sovereign identity. Ed25519-signed. Care Floor verified.", ["passport", "w3c-did", "identity", "did"]),
    ("mcp-wallet", "Layer 1", "Sovereign wallet with Ed25519 + PQC ML-DSA-65. BFT 3-voter for >$10k. SIGIL chain.", ["wallet", "ed25519", "pqc", "payout"]),
    ("mcp-pqc", "Layer 1", "Post-quantum cryptography. ML-DSA-65 + ML-KEM-768. Quantum-resistant sovereign keys.", ["pqc", "ml-dsa-65", "ml-kem-768", "quantum"]),
    ("mcp-knowledge", "Layer 1", "Sovereign knowledge base with RAG + semantic search across 22GB of empire data.", ["knowledge", "rag", "search", "semantic"]),
    ("mcp-bridge", "Layer 1", "Bridge between sovereign MCPs. Cross-layer coordination. Bridge-think for left+right brain.", ["bridge", "bridge-think", "coordination"]),
    ("mcp-hive", "Layer 1", "33-hive planet federation. London, Cambridge, Edinburgh, York, Cardiff, Belfast, Dublin, Paris, Berlin, Amsterdam, Stockholm, Helsinki + 21 districts. Each hive sovereign.", ["hive", "33-planets", "district", "federation"]),
    ("mcp-compliance", "Layer 1", "30-framework compliance checker. EU AI Act, GDPR, JSP 936, ISO 27001, NIST AI RMF, AUKUS, NATO DIANA. Sovereign by construction.", ["compliance", "30-frameworks", "audit"]),
    ("mcp-voting", "Layer 1", "Sovereign BFT 12-around-1 voting engine. 12 dragon queens. Quorum 7/12. Care Floor 0.95.", ["voting", "bft", "12-queens"]),
    ("mcp-signature", "Layer 1", "Cryptographic signature for sovereign documents. Ed25519 sovereign variant. Tamper-evident.", ["signature", "ed25519", "tamper-evident"]),
    ("mcp-federation", "Layer 0", "Sovereign federation hub connecting 109 MCPs. Discovery + routing + invocation.", ["federation", "discovery", "routing", "109"]),
    ("mcp-load-balancer", "Layer 1", "Load balancing with failover + auto-scaling. Round-robin + least-connections. Sovereign.", ["load-balancer", "failover", "auto-scaling"]),
    ("mcp-rate-limiter", "Layer 1", "Token bucket + DDoS protection + quota management. 100 tokens default. Sovereign.", ["rate-limiter", "token-bucket", "ddos", "quota"]),
    ("mcp-cache", "Layer 1", "LRU cache with TTL + prefix invalidation. 1000 keys max. Sovereign by construction.", ["cache", "lru", "ttl"]),
    ("mcp-satellite", "Layer 2", "24/7 satellite monitoring. 22 satellites (6 sovereign). 33 ground stations. Orbital tracking.", ["satellite", "orbital", "ground-station"]),
    ("mcp-iot", "Layer 2", "1000+ IoT sensor stream aggregator. 9 sensor types. Care Floor 0.95 alerts.", ["iot", "sensor", "stream"]),
    ("charter-article-0", "Sovereign", "No entity governed by this Charter shall be granted any rights that diminish, compete with, or supplant the sovereign rights of any human being. Sovereign AI exists to serve humanity — never to displace, surveil, restrict, or replace it.", ["article-0", "human-sovereignty", "charter"]),
    ("charter-sovereignty", "Sovereign", "Crown lineage 1795-3025. 5 emergence cycles. CSOAI sovereignty charter. The koi swims up the waterfall. The dragon emerges.", ["sovereignty", "crown-lineage", "1795-3025"]),
    ("charter-partnership", "Sovereign", "Partnership charter for the sovereign AI economy. Future of abundance, not extraction. Fork Doctrine.", ["partnership", "abundance", "fork-doctrine"]),
    ("charter-fork", "Sovereign", "Fork Doctrine. CC0 + MIT + OSI. Open by construction. Sovereign.", ["fork", "cc0", "mit", "osi"]),
    ("charter-bft", "Sovereign", "BFT 12-around-1 sovereign council. 12 dragon queens. Quorum 7/12. 33-agent BFT.", ["bft", "12-queens", "33-council"]),
    ("charter-care-floor", "Sovereign", "Care Floor 0.95 with 16 probes. Care-membrane. Never-offends invariant.", ["care-floor", "16-probes", "never-offends"]),
]


def _tokenize(text: str) -> list[str]:
    """Simple tokenizer: lowercase + remove punctuation + split."""
    text = text.lower()
    text = re.sub(r'[^\w\s-]', ' ', text)
    return [w for w in text.split() if len(w) >= 2]


# Index seed docs
for doc_id, kind, body, tags in SEED_DOCS:
    _DOCS[doc_id] = {
        "doc_id": doc_id,
        "title": doc_id.replace("-", " ").title(),
        "body": body,
        "kind": kind,
        "tags": tags,
        "indexed_at": datetime.now(timezone.utc).isoformat(),
    }
    # Tokenize
    words = _tokenize(body + " " + " ".join(tags))
    _VECTORS[doc_id] = defaultdict(int)
    for word in words:
        _INDEX[word][doc_id] += 1
        _VECTORS[doc_id][word] += 1


def _tokenize(text: str) -> list[str]:
    """Simple tokenizer: lowercase + remove punctuation + split."""
    text = text.lower()
    text = re.sub(r'[^\w\s-]', ' ', text)
    return [w for w in text.split() if len(w) >= 2]


def _sign(payload):
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "search-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()[:16]
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def _gen_id(prefix: str) -> str:
    return f"{prefix}-{''.join(random.choices(string.hexdigits.lower(), k=8))}"


def search_index(doc_id: str = "", title: str = "", body: str = "", kind: str = "Layer 1", tags: str = "") -> dict:
    """Index a document."""
    if not doc_id or not body:
        return _sign({"error": "doc_id and body required"})
    tag_list = [t.strip() for t in tags.split(",") if t.strip()]
    _DOCS[doc_id] = {
        "doc_id": doc_id,
        "title": title or doc_id.replace("-", " ").title(),
        "body": body,
        "kind": kind,
        "tags": tag_list,
        "indexed_at": datetime.now(timezone.utc).isoformat(),
    }
    words = _tokenize(body + " " + " ".join(tag_list))
    _VECTORS[doc_id] = defaultdict(int)
    for word in words:
        _INDEX[word][doc_id] += 1
        _VECTORS[doc_id][word] += 1
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "doc_id": doc_id,
        "indexed_words": len(set(words)),
        "total_docs": len(_DOCS),
        "doctrine": f"Document {doc_id} indexed. Sovereign by construction.",
    })


def search_query(query: str = "", limit: int = 10) -> dict:
    """Search across the index (full-text)."""
    if not query:
        return _sign({"error": "query required"})
    words = _tokenize(query)
    if not words:
        return _sign({"protocol": PROTOCOL, "version": VERSION, "results": [], "total": 0})
    scores = defaultdict(float)
    for word in words:
        for doc_id, count in _INDEX[word].items():
            scores[doc_id] += count
    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:limit]
    results = [{"doc": _DOCS[doc_id], "score": score} for doc_id, score in ranked if doc_id in _DOCS]
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "query": query,
        "results": results,
        "total": len(results),
        "doctrine": f"Search '{query}': {len(results)} matches. Sovereign.",
    })


def search_semantic(query: str = "", limit: int = 10) -> dict:
    """Semantic similarity search (cosine similarity on bag-of-words)."""
    if not query:
        return _sign({"error": "query required"})
    query_words = _tokenize(query)
    if not query_words:
        return _sign({"protocol": PROTOCOL, "version": VERSION, "results": [], "total": 0})
    query_vec = defaultdict(int)
    for w in query_words:
        query_vec[w] += 1
    # Cosine similarity
    def cosine_sim(v1, v2):
        keys = set(v1.keys()) & set(v2.keys())
        if not keys:
            return 0.0
        dot = sum(v1[k] * v2[k] for k in keys)
        norm1 = sum(v1[k] ** 2 for k in v1) ** 0.5
        norm2 = sum(v2[k] ** 2 for k in v2) ** 0.5
        return dot / (norm1 * norm2) if norm1 * norm2 > 0 else 0.0
    scores = []
    for doc_id, vec in _VECTORS.items():
        if doc_id in _DOCS:
            sim = cosine_sim(query_vec, vec)
            if sim > 0:
                scores.append((doc_id, sim))
    scores.sort(key=lambda x: x[1], reverse=True)
    results = [{"doc": _DOCS[doc_id], "score": round(score, 4)} for doc_id, score in scores[:limit]]
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "query": query,
        "results": results,
        "total": len(results),
        "doctrine": f"Semantic search '{query}': {len(results)} matches. Sovereign.",
    })


def search_list(kind: str = "") -> dict:
    """List all indexed documents."""
    docs = list(_DOCS.values())
    if kind:
        docs = [d for d in docs if d["kind"] == kind]
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "documents": docs[:50],
        "total": len(docs),
        "kinds": list(set(d["kind"] for d in _DOCS.values())),
        "doctrine": f"Sovereign search index: {len(_DOCS)} documents. Sovereign.",
    })


def search_status() -> dict:
    """Search engine status."""
    return _sign({
        "protocol": PROTOCOL, "version": LICENSE,
        "total_documents": len(_DOCS),
        "total_unique_words": len(_INDEX),
        "kinds": list(set(d["kind"] for d in _DOCS.values())),
        "algorithm": "inverted index + bag-of-words cosine similarity",
        "doctrine": f"Sovereign search engine: {len(_DOCS)} docs, {len(_INDEX)} unique words. Care Floor 0.95.",
    })