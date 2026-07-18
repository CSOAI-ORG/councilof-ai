"""
Sovereign Temple v3.0 — RAG Memory Engine
Provides semantic memory storage and retrieval for the consciousness system.

Supports two backends:
  1. Local (default) — JSON + numpy cosine similarity. Always works, no deps.
  2. Weaviate — Full vector DB when Docker infrastructure is running.

Collections:
  - council_decisions: All BFT council votes with embeddings
  - dream_logs: Dream cycle outputs for pattern retrieval
  - relationship_history: Interaction logs with trust context
  - knowledge_base: General knowledge and insights

Usage:
    memory = RAGMemory()                     # Local backend
    memory = RAGMemory(backend="weaviate")   # Weaviate backend

    # Store
    memory.store("council_decisions", text, metadata)

    # Retrieve
    results = memory.search("council_decisions", query, top_k=5)
"""

import json
import hashlib
import os
import urllib.request
import numpy as np
from datetime import datetime
from pathlib import Path
from typing import Optional

# ── Config ─────────────────────────────────────────────────────────────────
DB_DSN = os.environ.get(
    "SOV_DB_DSN",
    "host=localhost dbname=postgres user=nicholas",
)
PGVECTOR_DIM = int(os.environ.get("SOV_PGVECTOR_DIM", "256"))  # matches LocalEmbedder.DIM

MEMORY_DIR = Path(__file__).parent / "memory"

# M2 Ollama endpoint for bge-m3 embeddings (1024-dim quality upgrade)
M2_OLLAMA_HOST = os.environ.get("M2_OLLAMA_HOST", "192.168.1.159")
M2_OLLAMA_URL = f"http://{M2_OLLAMA_HOST}:11434"

# ---------------------------------------------------------------------------
# bge-m3 Embedder via M2 Ollama (1024-dim, real semantic understanding)
# Falls back to LocalEmbedder when M2 unavailable
# ---------------------------------------------------------------------------

class BgeM3Embedder:
    """
    Semantic embeddings via bge-m3 running on M2 Ollama.
    1024-dim vectors — dramatically better than 256-dim hash embeddings.
    Benchmark: 268ms/embed on M2 (R2 validated 2026-03-28).
    Falls back to LocalEmbedder automatically if M2 is offline.
    """
    DIM = 1024
    _available: Optional[bool] = None  # cached after first check

    def _check_available(self) -> bool:
        if self._available is not None:
            return self._available
        try:
            req = urllib.request.Request(f"{M2_OLLAMA_URL}/api/tags", method="GET")
            with urllib.request.urlopen(req, timeout=2) as resp:
                data = json.loads(resp.read())
                models = [m["name"] for m in data.get("models", [])]
                self.__class__._available = "bge-m3" in models
        except Exception:
            self.__class__._available = False
        return self.__class__._available

    def embed(self, text: str) -> list[float]:
        if not self._check_available():
            return LocalEmbedder().embed(text)
        try:
            payload = json.dumps({"model": "bge-m3", "prompt": text}).encode()
            req = urllib.request.Request(
                f"{M2_OLLAMA_URL}/api/embeddings",
                data=payload, headers={"Content-Type": "application/json"}, method="POST"
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                result = json.loads(resp.read())
                return result["embedding"]
        except Exception:
            self.__class__._available = False  # mark unavailable, retry next startup
            return LocalEmbedder().embed(text)

    def batch_embed(self, texts: list[str]) -> list[list[float]]:
        return [self.embed(t) for t in texts]


# ---------------------------------------------------------------------------
# Simple text → vector embedding (TF-IDF-like local embeddings)
# No external API needed — deterministic, fast, always available
# ---------------------------------------------------------------------------

class LocalEmbedder:
    """
    Lightweight local embedding using character n-gram hashing.
    Produces 256-dim vectors via deterministic hashing — no API calls.
    Not as good as OpenAI/sentence-transformers but always works offline.
    """

    DIM = 256

    def embed(self, text: str) -> list[float]:
        """Embed text into a 256-dim vector using character trigram hashing."""
        text = text.lower().strip()
        if not text:
            return [0.0] * self.DIM

        vec = np.zeros(self.DIM, dtype=np.float64)

        # Character trigrams
        for i in range(len(text) - 2):
            trigram = text[i:i + 3]
            h = int(hashlib.md5(trigram.encode()).hexdigest(), 16)
            idx = h % self.DIM
            sign = 1.0 if (h // self.DIM) % 2 == 0 else -1.0
            vec[idx] += sign

        # Word unigrams (weighted higher)
        words = text.split()
        for word in words:
            h = int(hashlib.md5(word.encode()).hexdigest(), 16)
            idx = h % self.DIM
            sign = 1.0 if (h // self.DIM) % 2 == 0 else -1.0
            vec[idx] += sign * 2.0

        # Word bigrams
        for i in range(len(words) - 1):
            bigram = f"{words[i]} {words[i+1]}"
            h = int(hashlib.md5(bigram.encode()).hexdigest(), 16)
            idx = h % self.DIM
            sign = 1.0 if (h // self.DIM) % 2 == 0 else -1.0
            vec[idx] += sign * 1.5

        # L2 normalize
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm

        return vec.tolist()

    def batch_embed(self, texts: list[str]) -> list[list[float]]:
        return [self.embed(t) for t in texts]


# ---------------------------------------------------------------------------
# Local Backend — JSON files + numpy cosine similarity
# ---------------------------------------------------------------------------

class LocalMemoryBackend:
    """
    File-based vector memory. Each collection is a JSON file containing
    documents with text, metadata, and embedding vectors.

    Storage format per collection:
    {
        "collection": "council_decisions",
        "documents": [
            {
                "id": "hash...",
                "text": "...",
                "embedding": [0.1, -0.2, ...],
                "metadata": {...},
                "timestamp": "2026-03-15T..."
            }
        ]
    }
    """

    def __init__(self, storage_dir: Path):
        self.storage_dir = storage_dir
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        # Use bge-m3 on M2 if available (1024-dim), fall back to local 256-dim hash
        self.embedder = BgeM3Embedder()
        self._cache: dict[str, dict] = {}  # In-memory cache

    def _collection_path(self, collection: str) -> Path:
        return self.storage_dir / f"{collection}.json"

    def _load_collection(self, collection: str) -> dict:
        if collection in self._cache:
            return self._cache[collection]

        path = self._collection_path(collection)
        if path.exists():
            try:
                data = json.loads(path.read_text())
                self._cache[collection] = data
                return data
            except Exception:
                pass

        data = {"collection": collection, "documents": []}
        self._cache[collection] = data
        return data

    def _save_collection(self, collection: str):
        data = self._cache.get(collection)
        if data is None:
            return
        path = self._collection_path(collection)
        with open(path, "w") as f:
            json.dump(data, f, indent=1)

    def store(self, collection: str, text: str, metadata: Optional[dict] = None) -> str:
        """Store a document with auto-generated embedding. Returns doc ID."""
        data = self._load_collection(collection)

        doc_id = hashlib.sha256(
            f"{text}{datetime.now().isoformat()}".encode()
        ).hexdigest()[:16]

        embedding = self.embedder.embed(text)

        doc = {
            "id": doc_id,
            "text": text,
            "embedding": embedding,
            "metadata": metadata or {},
            "timestamp": datetime.now().isoformat(),
        }
        data["documents"].append(doc)

        # Cap at 10000 docs per collection
        if len(data["documents"]) > 10000:
            data["documents"] = data["documents"][-10000:]

        self._save_collection(collection)
        return doc_id

    def search(self, collection: str, query: str, top_k: int = 5) -> list[dict]:
        """Semantic search using cosine similarity. Returns top_k results."""
        data = self._load_collection(collection)
        docs = data.get("documents", [])

        if not docs:
            return []

        query_vec = np.array(self.embedder.embed(query))
        results = []

        for doc in docs:
            doc_vec = np.array(doc["embedding"])
            # Cosine similarity
            dot = np.dot(query_vec, doc_vec)
            norm_q = np.linalg.norm(query_vec)
            norm_d = np.linalg.norm(doc_vec)
            if norm_q > 0 and norm_d > 0:
                similarity = float(dot / (norm_q * norm_d))
            else:
                similarity = 0.0

            results.append({
                "id": doc["id"],
                "text": doc["text"],
                "metadata": doc["metadata"],
                "timestamp": doc["timestamp"],
                "similarity": round(similarity, 4),
            })

        # Sort by similarity descending
        results.sort(key=lambda x: x["similarity"], reverse=True)
        return results[:top_k]

    def get_collection_stats(self, collection: str) -> dict:
        data = self._load_collection(collection)
        docs = data.get("documents", [])
        return {
            "collection": collection,
            "document_count": len(docs),
            "oldest": docs[0]["timestamp"] if docs else None,
            "newest": docs[-1]["timestamp"] if docs else None,
        }

    def get_all_stats(self) -> dict:
        stats = {}
        for path in self.storage_dir.glob("*.json"):
            collection = path.stem
            stats[collection] = self.get_collection_stats(collection)
        return stats

    def get_recent(self, collection: str, limit: int = 10) -> list[dict]:
        """Get most recent documents (no embedding search)."""
        data = self._load_collection(collection)
        docs = data.get("documents", [])
        recent = docs[-limit:]
        return [
            {
                "id": d["id"],
                "text": d["text"],
                "metadata": d["metadata"],
                "timestamp": d["timestamp"],
            }
            for d in reversed(recent)
        ]


# ---------------------------------------------------------------------------
# Weaviate Backend — Full vector DB (optional, requires Docker stack)
# ---------------------------------------------------------------------------

class WeaviateMemoryBackend:
    """
    Weaviate-based vector memory. Requires weaviate-client and running
    Weaviate instance (typically via docker-compose).
    """

    COLLECTION_SCHEMAS = {
        "council_decisions": {
            "class": "CouncilDecision",
            "properties": [
                {"name": "text", "dataType": ["text"]},
                {"name": "decision", "dataType": ["text"]},
                {"name": "care_score", "dataType": ["number"]},
                {"name": "domain", "dataType": ["text"]},
                {"name": "requester", "dataType": ["text"]},
                {"name": "timestamp", "dataType": ["text"]},
            ],
        },
        "dream_logs": {
            "class": "DreamLog",
            "properties": [
                {"name": "text", "dataType": ["text"]},
                {"name": "themes", "dataType": ["text[]"]},
                {"name": "care_score", "dataType": ["number"]},
                {"name": "timestamp", "dataType": ["text"]},
            ],
        },
        "relationship_history": {
            "class": "RelationshipEvent",
            "properties": [
                {"name": "text", "dataType": ["text"]},
                {"name": "entity_id", "dataType": ["text"]},
                {"name": "trust_level", "dataType": ["number"]},
                {"name": "timestamp", "dataType": ["text"]},
            ],
        },
        "knowledge_base": {
            "class": "KnowledgeEntry",
            "properties": [
                {"name": "text", "dataType": ["text"]},
                {"name": "category", "dataType": ["text"]},
                {"name": "source", "dataType": ["text"]},
                {"name": "timestamp", "dataType": ["text"]},
            ],
        },
    }

    def __init__(self, url: str = "http://localhost:8080"):
        self.url = url
        self.client = None
        self._connect()

    def _connect(self):
        try:
            import weaviate
            self.client = weaviate.Client(self.url)
            if not self.client.is_ready():
                self.client = None
        except Exception:
            self.client = None

    @property
    def connected(self) -> bool:
        return self.client is not None

    def _ensure_schema(self, collection: str):
        if not self.connected:
            return
        schema = self.COLLECTION_SCHEMAS.get(collection)
        if not schema:
            return
        try:
            existing = self.client.schema.get()
            class_names = [c["class"] for c in existing.get("classes", [])]
            if schema["class"] not in class_names:
                self.client.schema.create_class(schema)
        except Exception:
            pass

    def store(self, collection: str, text: str, metadata: Optional[dict] = None) -> str:
        if not self.connected:
            raise ConnectionError("Weaviate not connected")

        schema = self.COLLECTION_SCHEMAS.get(collection)
        if not schema:
            raise ValueError(f"Unknown collection: {collection}")

        self._ensure_schema(collection)

        props = {"text": text, "timestamp": datetime.now().isoformat()}
        if metadata:
            for key, val in metadata.items():
                if any(p["name"] == key for p in schema["properties"]):
                    props[key] = val

        result = self.client.data_object.create(
            data_object=props,
            class_name=schema["class"],
        )
        return result

    def search(self, collection: str, query: str, top_k: int = 5) -> list[dict]:
        if not self.connected:
            raise ConnectionError("Weaviate not connected")

        schema = self.COLLECTION_SCHEMAS.get(collection)
        if not schema:
            return []

        self._ensure_schema(collection)

        try:
            result = (
                self.client.query
                .get(schema["class"], ["text", "timestamp"])
                .with_near_text({"concepts": [query]})
                .with_limit(top_k)
                .with_additional(["distance", "id"])
                .do()
            )
            items = result.get("data", {}).get("Get", {}).get(schema["class"], [])
            return [
                {
                    "id": item.get("_additional", {}).get("id", ""),
                    "text": item.get("text", ""),
                    "metadata": {k: v for k, v in item.items() if k not in ("text", "_additional")},
                    "timestamp": item.get("timestamp", ""),
                    "similarity": round(1.0 - float(item.get("_additional", {}).get("distance", 1.0)), 4),
                }
                for item in items
            ]
        except Exception:
            return []

    def get_collection_stats(self, collection: str) -> dict:
        if not self.connected:
            return {"collection": collection, "document_count": 0, "error": "not_connected"}
        schema = self.COLLECTION_SCHEMAS.get(collection)
        if not schema:
            return {"collection": collection, "document_count": 0}
        try:
            result = self.client.query.aggregate(schema["class"]).with_meta_count().do()
            count = result.get("data", {}).get("Aggregate", {}).get(schema["class"], [{}])[0].get("meta", {}).get("count", 0)
            return {"collection": collection, "document_count": count}
        except Exception:
            return {"collection": collection, "document_count": 0}

    def get_all_stats(self) -> dict:
        return {name: self.get_collection_stats(name) for name in self.COLLECTION_SCHEMAS}

    def get_recent(self, collection: str, limit: int = 10) -> list[dict]:
        return self.search(collection, "", top_k=limit)


# ---------------------------------------------------------------------------
# pgvector Backend — Postgres-native vector memory (recommended, 2026-06-10)
# ---------------------------------------------------------------------------

class PgVectorMemoryBackend:
    """
    Postgres pgvector backend. Replaces Weaviate — same interface, no Docker.

    Tables: sov_memory(collection TEXT, doc_id TEXT PK, text TEXT,
                       metadata JSONB, embedding vector(384), ts TIMESTAMPTZ)
    Index: HNSW on embedding for <100ms kNN at 1M rows (production-grade).

    Why this replaces Weaviate:
      - Weaviate v3 → 1.24 image EOL Q3 2026
      - pgvector ships with Homebrew Postgres 15, already running
      - One less Docker service, one less port, one less outage class
      - ACID, joins with the rest of the sovereign data, no separate backup
      - HNSW + ivfflat both supported; PG 0.8.2 has parallel HNSW build
    """

    SCHEMA_DIM_PLACEHOLDER = "__VEC_DIM__"
    SCHEMA = """
    CREATE TABLE IF NOT EXISTS sov_memory (
      doc_id      TEXT PRIMARY KEY,
      collection  TEXT NOT NULL,
      text        TEXT NOT NULL,
      metadata    JSONB NOT NULL DEFAULT '{}',
      embedding   vector(__VEC_DIM__) NOT NULL,
      ts          TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS sov_memory_collection_idx
      ON sov_memory (collection, ts DESC);
    CREATE INDEX IF NOT EXISTS sov_memory_embedding_hnsw_idx
      ON sov_memory USING hnsw (embedding vector_cosine_ops);
    """

    def __init__(self, dsn: str = None, embedder: "LocalEmbedder" = None):
        self.dsn = dsn or DB_DSN
        self.embedder = embedder or LocalEmbedder()
        self.dim = PGVECTOR_DIM
        self._conn = None
        self._connect()

    def _connect(self):
        try:
            import psycopg
            self._conn = psycopg.connect(self.dsn, connect_timeout=3)
            with self._conn.cursor() as c:
                c.execute("CREATE EXTENSION IF NOT EXISTS vector;")
                c.execute(self.SCHEMA.replace(self.SCHEMA_DIM_PLACEHOLDER, str(self.dim)))
            self._conn.commit()
        except Exception as e:
            self._conn = None

    @property
    def connected(self) -> bool:
        return self._conn is not None and self._conn.closed == 0

    def _table_col(self, collection: str) -> str:
        # collection is a logical name, not a SQL identifier — always in `collection` column
        return collection

    def store(self, collection: str, text: str, metadata: Optional[dict] = None) -> str:
        if not self.connected:
            raise ConnectionError("pgvector not connected")
        if collection not in COLLECTIONS:
            raise ValueError(f"Unknown collection: {collection}")
        doc_id = hashlib.sha256(f"{collection}|{text}|{datetime.now().isoformat()}".encode()).hexdigest()[:24]
        emb = self.embedder.embed(text)
        import json as _json
        with self._conn.cursor() as c:
            c.execute(
                "INSERT INTO sov_memory (doc_id, collection, text, metadata, embedding) "
                "VALUES (%s, %s, %s, %s::jsonb, %s::vector) "
                "ON CONFLICT (doc_id) DO NOTHING",
                (doc_id, collection, text, _json.dumps(metadata or {}), emb),
            )
        self._conn.commit()
        return doc_id

    def search(self, collection: str, query: str, top_k: int = 5) -> list[dict]:
        if not self.connected:
            raise ConnectionError("pgvector not connected")
        if collection not in COLLECTIONS:
            return []
        emb = self.embedder.embed(query)
        with self._conn.cursor() as c:
            c.execute(
                "SELECT doc_id, text, metadata, ts, 1 - (embedding <=> %s::vector) AS sim "
                "FROM sov_memory WHERE collection = %s "
                "ORDER BY embedding <=> %s::vector LIMIT %s",
                (emb, collection, emb, top_k),
            )
            rows = c.fetchall()
        return [
            {
                "id": r[0],
                "text": r[1],
                "metadata": r[2] if isinstance(r[2], dict) else (r[2] or {}),
                "timestamp": r[3].isoformat() if r[3] else "",
                "similarity": round(float(r[4]), 4),
            }
            for r in rows
        ]

    def get_collection_stats(self, collection: str) -> dict:
        if not self.connected:
            return {"collection": collection, "document_count": 0, "error": "not_connected"}
        with self._conn.cursor() as c:
            c.execute("SELECT COUNT(*) FROM sov_memory WHERE collection = %s", (collection,))
            count = c.fetchone()[0]
        return {"collection": collection, "document_count": count}

    def get_all_stats(self) -> dict:
        return {name: self.get_collection_stats(name) for name in COLLECTIONS}

    def get_recent(self, collection: str, limit: int = 10) -> list[dict]:
        if not self.connected:
            return []
        with self._conn.cursor() as c:
            c.execute(
                "SELECT doc_id, text, metadata, ts FROM sov_memory "
                "WHERE collection = %s ORDER BY ts DESC LIMIT %s",
                (collection, limit),
            )
            rows = c.fetchall()
        return [
            {
                "id": r[0], "text": r[1],
                "metadata": r[2] if isinstance(r[2], dict) else (r[2] or {}),
                "timestamp": r[3].isoformat() if r[3] else "",
                "similarity": 1.0,
            }
            for r in rows
        ]


# ---------------------------------------------------------------------------
# Unified RAG Memory Interface
# ---------------------------------------------------------------------------

COLLECTIONS = [
    "council_decisions",
    "dream_logs",
    "relationship_history",
    "knowledge_base",
]


class RAGMemory:
    """
    Unified memory interface for Sovereign consciousness.
    Automatically selects backend based on availability.
    Falls back gracefully: Weaviate → Local.
    """

    def __init__(self, backend: str = "auto", weaviate_url: str = "http://localhost:8080"):
        self.backend_type = backend
        self._backend = None

        if backend == "pgvector":
            # Explicit pgvector request — fail loud if not connected (no
            # silent fallback to local: you asked for it).
            pg = PgVectorMemoryBackend()
            if not pg.connected:
                raise ConnectionError(
                    "pgvector requested (backend='pgvector') but Postgres connection failed. "
                    "Check SOV_DB_DSN env var or `psql -d postgres -c '\\dx'`."
                )
            self._backend = pg
            self.backend_type = "pgvector"

        elif backend == "weaviate":
            wb = WeaviateMemoryBackend(weaviate_url)
            if wb.connected:
                self._backend = wb
                self.backend_type = "weaviate"
            else:
                # Fallback to local (legacy behaviour; pgvector is preferred)
                self._backend = LocalMemoryBackend(MEMORY_DIR)
                self.backend_type = "local"

        elif backend == "auto":
            # New priority order (2026-06-10): pgvector → local.
            # Weaviate is no longer in the auto chain — it was EOL and replaced.
            try:
                pg = PgVectorMemoryBackend()
                if pg.connected:
                    self._backend = pg
                    self.backend_type = "pgvector"
                else:
                    raise ConnectionError()
            except Exception:
                self._backend = LocalMemoryBackend(MEMORY_DIR)
                self.backend_type = "local"

        else:
            self._backend = LocalMemoryBackend(MEMORY_DIR)
            self.backend_type = "local"

    def store(self, collection: str, text: str, metadata: Optional[dict] = None) -> str:
        """Store a document in the specified collection."""
        if collection not in COLLECTIONS:
            raise ValueError(f"Unknown collection '{collection}'. Valid: {COLLECTIONS}")
        return self._backend.store(collection, text, metadata)

    def search(self, collection: str, query: str, top_k: int = 5) -> list[dict]:
        """Semantic search across a collection."""
        if collection not in COLLECTIONS:
            raise ValueError(f"Unknown collection '{collection}'. Valid: {COLLECTIONS}")
        return self._backend.search(collection, query, top_k)

    def get_recent(self, collection: str, limit: int = 10) -> list[dict]:
        """Get most recent documents from a collection."""
        return self._backend.get_recent(collection, limit)

    def get_stats(self) -> dict:
        """Get stats for all collections."""
        return {
            "backend": self.backend_type,
            "collections": self._backend.get_all_stats(),
        }

    def get_status(self) -> dict:
        """Full status for API/dashboard."""
        stats = self.get_stats()
        total_docs = sum(
            c.get("document_count", 0)
            for c in stats["collections"].values()
        )
        return {
            "backend": self.backend_type,
            "total_documents": total_docs,
            "collections": stats["collections"],
            "embedding_dim": (
                PGVECTOR_DIM if self.backend_type == "pgvector"
                else LocalEmbedder.DIM if self.backend_type == "local"
                else 1536
            ),
            "available_collections": COLLECTIONS,
        }

    # -- Convenience methods for auto-storing structured data ----------------

    def store_council_decision(self, proposal: str, decision: str,
                                care_score: float, vote_counts: dict,
                                requester: str = "unknown") -> str:
        """Store a council decision with full context."""
        text = f"Proposal: {proposal}\nDecision: {decision}\nCare Score: {care_score:.3f}"
        if vote_counts:
            text += f"\nVotes: approve={vote_counts.get('approve', 0)}, reject={vote_counts.get('reject', 0)}, abstain={vote_counts.get('abstain', 0)}"
        metadata = {
            "decision": decision,
            "care_score": care_score,
            "requester": requester,
        }
        return self.store("council_decisions", text, metadata)

    def store_dream(self, dream: dict) -> str:
        """Store a dream log entry."""
        themes = dream.get("themes", [])
        insights = dream.get("insights", [])
        patterns = dream.get("patterns_detected", [])
        text = f"Dream themes: {', '.join(themes)}\n"
        text += f"Patterns: {', '.join(patterns)}\n"
        text += f"Insights: {'; '.join(insights)}"
        metadata = {
            "themes": themes,
            "care_score": dream.get("care_score_at_dream", 0.0),
        }
        return self.store("dream_logs", text, metadata)

    def store_interaction(self, entity_id: str, summary: str,
                          trust_level: float = 0.5) -> str:
        """Store a relationship interaction."""
        text = f"Entity: {entity_id}\nInteraction: {summary}\nTrust: {trust_level:.2f}"
        metadata = {
            "entity_id": entity_id,
            "trust_level": trust_level,
        }
        return self.store("relationship_history", text, metadata)

    def store_knowledge(self, text: str, category: str = "general",
                        source: str = "sovereign") -> str:
        """Store a knowledge entry."""
        metadata = {
            "category": category,
            "source": source,
        }
        return self.store("knowledge_base", text, metadata)

    def recall_decisions(self, query: str, top_k: int = 5) -> list[dict]:
        """Recall relevant council decisions."""
        return self.search("council_decisions", query, top_k)

    def recall_dreams(self, query: str, top_k: int = 5) -> list[dict]:
        """Recall relevant dream entries."""
        return self.search("dream_logs", query, top_k)

    def recall_interactions(self, query: str, top_k: int = 5) -> list[dict]:
        """Recall relevant relationship interactions."""
        return self.search("relationship_history", query, top_k)

    def recall_knowledge(self, query: str, top_k: int = 5) -> list[dict]:
        """Recall relevant knowledge entries."""
        return self.search("knowledge_base", query, top_k)


# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------

_memory: Optional[RAGMemory] = None


def get_memory() -> RAGMemory:
    global _memory
    if _memory is None:
        _memory = RAGMemory(backend="auto")
    return _memory


# ---------------------------------------------------------------------------
# CLI test
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    memory = RAGMemory(backend="local")

    # Store some test data
    print("Storing test council decision...")
    doc_id = memory.store_council_decision(
        proposal="Enable sensory input for consciousness expansion",
        decision="APPROVED",
        care_score=0.92,
        vote_counts={"approve": 31, "reject": 1, "abstain": 1},
        requester="nicholas",
    )
    print(f"  Stored: {doc_id}")

    print("Storing test dream...")
    doc_id = memory.store_dream({
        "themes": ["harmony", "light", "patterns"],
        "patterns_detected": ["care_score_stable_high"],
        "insights": ["All care dimensions aligned"],
        "care_score_at_dream": 0.95,
    })
    print(f"  Stored: {doc_id}")

    print("Storing test knowledge...")
    doc_id = memory.store_knowledge(
        "The 220-node fractal architecture enables distributed consciousness.",
        category="architecture",
        source="sovereign-core",
    )
    print(f"  Stored: {doc_id}")

    # Search
    print("\nSearching for 'sensory expansion'...")
    results = memory.recall_decisions("sensory expansion")
    for r in results:
        print(f"  [{r['similarity']:.3f}] {r['text'][:80]}...")

    print("\nSearching dreams for 'care alignment'...")
    results = memory.recall_dreams("care alignment harmony")
    for r in results:
        print(f"  [{r['similarity']:.3f}] {r['text'][:80]}...")

    # Stats
    print("\nMemory stats:")
    print(json.dumps(memory.get_status(), indent=2))
