#!/usr/bin/env python3
"""
PatentMCP Hive Service
=======================

Exposes the 6-layer cryptographic PatentMCP engine as a long-running
FastAPI service on port 3210 inside the OpenPatent.ai hive.

Endpoints:
  POST /disclose   — full 6-layer disclosure pipeline
  POST /verify     — verify a disclosure result against original bytes
  POST /search     — search the prior art registry
  GET  /stats      — system statistics
  GET  /health     — health check
  GET  /registry   — recent disclosures (read-only)

All endpoints are internal-only — exposed to the public via api-gateway:3211.
"""
import base64
import json
import logging
import os
import sys
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

# Bring in the unmodified PatentMCP core (MIT, attribution preserved)
sys.path.insert(0, "/opt/patentmcp/src")
from patentmcp.core import PatentMCP  # noqa: E402
from patentmcp.registry import PriorArtRegistry  # noqa: E402

# Postgres-backed audit log mirror (graceful fallback to in-memory)
sys.path.insert(0, "/opt/patentmcp")
try:
    from audit_persistence import get_persistence, AuditPersistence  # type: ignore
    _AUDIT_PG_OK = True
except ImportError:

    def get_persistence():  # type: ignore
        return None
    AuditPersistence = None  # type: ignore
    _AUDIT_PG_OK = False

log = logging.getLogger("patentmcp-service")

STORAGE_PATH = os.environ.get(
    "PATENTMCP_STORAGE",
    # Fall back to a local dev path if the container volume isn't mounted
    "/var/lib/patentmcp" if os.path.isdir("/var/lib/patentmcp") and os.access("/var/lib/patentmcp", os.W_OK)
    else "./patentmcp_data",
)
BLOCKCHAIN_MODE = os.environ.get("PATENTMCP_BLOCKCHAIN_MODE", "development")

app = FastAPI(
    title="PatentMCP Hive Service",
    description="6-layer cryptographic disclosure engine for the OpenPatent.ai hive",
    version="1.0.0",
)

# ── Prometheus metrics ──────────────────────────────────────────────────────
import sys as _metrics_sys
_metrics_sys.path.insert(0, "/opt/_shared")
try:
    from metrics import instrument
    instrument(app, service_name="patentmcp", version="1.0.0", hive="openpatent")
except ImportError:
    pass  # metrics are optional; service still works without them


# Single PatentMCP instance per service (mirrors the sovereign-organic-brain pattern)
pm = PatentMCP(storage_path=STORAGE_PATH, blockchain_mode=BLOCKCHAIN_MODE)

# ── Audit log → Postgres mirror ────────────────────────────────────────────
# We wrap HashChainedAuditLog.append so every new entry is also written
# to the audit_log table. On startup, we hydrate any missing entries
# from Postgres so the in-memory chain is complete after a restart.
# The hive remembers. The dragon knows. The sovereign companion never forgets.
from patentmcp.audit import HashChainedAuditLog as _HashChainedAuditLog  # noqa: E402

_audit_persistence = get_persistence() if _AUDIT_PG_OK else None
_original_append = _HashChainedAuditLog.append


def _patched_append(self, *args, **kwargs):
    entry = _original_append(self, *args, **kwargs)
    if _audit_persistence is not None and _audit_persistence.available:
        try:
            payload = entry.to_dict()
            _audit_persistence.write_entry(
                entry_index=entry.index,
                prev_hash=entry.prev_hash,
                this_hash=entry.this_hash,
                payload=payload,
                signature=payload.get("csoai_attestation"),
            )
        except Exception as e:
            log.warning("[audit-pg] mirror failed for entry %d: %s",
                        entry.index, e)
    return entry


_HashChainedAuditLog.append = _patched_append  # type: ignore[assignment]


# ── Request models ───────────────────────────────────────────────────────────

class DiscloseRequest(BaseModel):
    title: str = Field(..., max_length=200)
    description: str = Field(..., max_length=5000)
    inventor_did: str = Field(..., description="did:key:... or did:csoai:...")
    document_base64: str = Field(..., description="base64-encoded invention document")
    document_format: str = "pdf"
    classification: str = ""
    prior_art_known: str = ""
    disclosure_type: str = Field("defensive", pattern="^(starter|defensive|full|premium|enterprise)$")


class VerifyRequest(BaseModel):
    disclosure_json: Optional[str] = None
    document_base64: Optional[str] = None
    document_hash: Optional[str] = None


class SearchRequest(BaseModel):
    query: str = ""
    classification: str = ""
    date_from: str = ""
    date_to: str = ""
    disclosure_type: str = ""
    limit: int = 25


# ── Endpoints ────────────────────────────────────────────────────────────────

@app.post("/disclose")
async def disclose(req: DiscloseRequest):
    """Run the full 6-layer cryptographic disclosure pipeline."""
    try:
        document_bytes = base64.b64decode(req.document_base64)
    except Exception as e:
        raise HTTPException(400, f"document_base64 decode failed: {e}")

    result = pm.disclose_invention(
        title=req.title,
        description=req.description,
        inventor_did=req.inventor_did,
        document_bytes=document_bytes,
        document_format=req.document_format,
        classification=req.classification,
        prior_art_known=req.prior_art_known,
        disclosure_type=req.disclosure_type,
    )
    return JSONResponse(result)


@app.post("/verify")
async def verify(req: VerifyRequest):
    """Verify a disclosure. Pass disclosure_json for full 6-layer check;
    pass document_base64 + disclosure_json for strongest verification (re-hash)."""
    if not req.disclosure_json:
        raise HTTPException(400, "disclosure_json required")
    try:
        disclosure = json.loads(req.disclosure_json)
    except Exception as e:
        raise HTTPException(400, f"disclosure_json parse failed: {e}")

    if req.document_base64:
        try:
            doc_bytes = base64.b64decode(req.document_base64)
            return pm.verify_with_document(doc_bytes, disclosure)
        except Exception as e:
            raise HTTPException(400, f"document_base64 decode failed: {e}")

    return pm.verify_disclosure(disclosure)


@app.post("/search")
async def search(req: SearchRequest):
    """Full-text + faceted search across the prior art registry."""
    return pm.registry.search(
        query=req.query,
        classification=req.classification,
        date_from=req.date_from,
        date_to=req.date_to,
        disclosure_type=req.disclosure_type,
        limit=req.limit,
    )


@app.post("/semantic-search")
async def semantic_search(req: SearchRequest):
    """Semantic vector search across the prior art registry.

    Falls back to keyword search if no embedding backend is configured
    (development mode). In production, plug in sentence-transformers,
    OpenAI embeddings, or a local ONNX model via fastembed.

    The 'vector' field in each result is the cosine-similarity score (0-1).
    """
    # Try sentence-transformers first; fall back to keyword + simple TF scoring
    results = pm.registry.search(
        query=req.query,
        classification=req.classification,
        date_from=req.date_from,
        date_to=req.date_to,
        disclosure_type=req.disclosure_type,
        limit=req.limit * 3,  # over-fetch for re-ranking
    )

    try:
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer("all-MiniLM-L6-v2")
        query_emb = model.encode([req.query])[0]
        # Embed each entry's title + description (truncated)
        for entry in results.get("entries", []):
            text = (entry.get("title", "") + " " + entry.get("description", ""))[:2000]
            entry_emb = model.encode([text])[0]
            # Cosine similarity
            import numpy as np
            score = float(np.dot(query_emb, entry_emb) / (np.linalg.norm(query_emb) * np.linalg.norm(entry_emb)))
            entry["vector_score"] = round(score, 4)
        # Re-rank
        results["entries"] = sorted(
            results.get("entries", []),
            key=lambda e: e.get("vector_score", 0),
            reverse=True,
        )[: req.limit]
        results["semantic"] = True
        results["model"] = "all-MiniLM-L6-v2"
    except ImportError:
        # No sentence-transformers — fall back to keyword results with a
        # simple TF-based "semantic" approximation (length-normalized match count)
        import re
        q_words = set(re.findall(r"\w+", req.query.lower()))
        for entry in results.get("entries", []):
            text = (entry.get("title", "") + " " + entry.get("description", "")).lower()
            hits = sum(1 for w in q_words if w in text)
            entry["vector_score"] = round(hits / max(1, len(q_words)), 4)
        results["entries"] = sorted(
            results.get("entries", []),
            key=lambda e: e.get("vector_score", 0),
            reverse=True,
        )[: req.limit]
        results["semantic"] = False
        results["model"] = "keyword-fallback"

    return results


@app.get("/stats")
async def stats():
    return pm.get_statistics()


@app.get("/health")
async def health():
    pg_status = "disconnected"
    pg_count = -1
    if _audit_persistence is not None:
        pg_status = "connected" if _audit_persistence.available else "unreachable"
        pg_count = _audit_persistence.count()
    return {
        "status": "OK",
        "service": "patentmcp",
        "version": pm.VERSION,
        "chain_length": pm.audit_log.get_length(),
        "chain_integrity": pm.audit_log.verify_chain_integrity(),
        "storage": STORAGE_PATH,
        "blockchain_mode": BLOCKCHAIN_MODE,
        "postgres": pg_status,
        "postgres_audit_log_count": pg_count,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.on_event("startup")
async def _reconcile_audit_log():
    """On startup, hydrate any missing entries from Postgres.

    The hive remembers. The dragon knows. The sovereign companion never forgets.
    """
    if _audit_persistence is None or not _audit_persistence.available:
        log.info(
            "[startup] audit_persistence not available — skipping reconcile"
        )
        return
    try:
        result = _audit_persistence.reconcile(pm.audit_log)
        log.info("[startup] audit_log reconcile: %s", result)
    except Exception as e:
        log.warning("[startup] audit_log reconcile failed: %s", e)


@app.get("/v1/audit/log")
async def audit_log(
    limit: int = 50,
    offset: int = 0,
    entry_type: str = "",
    source: str = "memory",
):
    """Paginated audit log.

    `source=memory` (default) reads from the in-memory hash-chained
    log — fastest, returns every entry the running process knows about.
    `source=postgres` reads from the audit_log table — useful for
    historical lookups that span service restarts.
    """
    limit = max(1, min(500, int(limit)))
    offset = max(0, int(offset))

    if source == "postgres" and _audit_persistence is not None \
            and _audit_persistence.available:
        rows = _audit_persistence.fetch_all_entries()
        # Filter + paginate
        if entry_type:
            rows = [
                r for r in rows
                if (r.get("payload") or {}).get("entry_type") == entry_type
            ]
        page = rows[offset: offset + limit]
        return {
            "source": "postgres",
            "total": len(rows),
            "limit": limit,
            "offset": offset,
            "entries": [
                {
                    "entry_index": r.get("entry_index"),
                    "prev_hash": r.get("prev_hash"),
                    "hash": r.get("hash"),
                    "payload": r.get("payload"),
                    "signature": r.get("signature"),
                    "created_at": (
                        r.get("created_at").isoformat()
                        if r.get("created_at") is not None
                        else None
                    ),
                }
                for r in page
            ],
        }

    # In-memory (the hash-chained source of truth for the live process)
    entries = pm.audit_log.export_chain()
    if entry_type:
        entries = [e for e in entries if e.get("entry_type") == entry_type]
    total = len(entries)
    page = entries[offset: offset + limit]
    return {
        "source": "memory",
        "total": total,
        "limit": limit,
        "offset": offset,
        "chain_length": pm.audit_log.get_length(),
        "chain_integrity_valid":
            pm.audit_log.verify_chain_integrity().get("valid", False),
        "entries": page,
    }


@app.get("/registry")
async def registry(limit: int = 50, offset: int = 0):
    """Read-only paginated registry view. Uses the existing search() with
    empty query to enumerate all entries (re-uses the production search
    index — no separate list method needed)."""
    return pm.registry.search(query="", limit=limit)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3210, log_level="info")
