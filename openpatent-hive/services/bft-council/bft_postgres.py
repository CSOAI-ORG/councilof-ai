#!/usr/bin/env python3
"""
Postgres-backed BFT Council — production storage for the 33-agent review log.

Same API as services/bft-council/bft.py, but persists votes + reviews to
Postgres instead of in-memory. Falls back to in-memory if POSTGRES_URL is
not set (dev mode).

Schema:
  reviews (review_id, disclosure_hash, started_at, completed_at,
           council_size, bft_threshold, byzantine_tolerance,
           approvals, rejections, consensus, review_duration_ms)
  votes   (review_id, agent_id, agent_group, vote, rationale_hash,
           pubkey_prefix, voted_at)

Run: POSTGRES_URL=postgres://openpatent:***@postgres:5432/openpatent python3 bft_postgres.py
"""
import asyncio
import hashlib
import os
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# Optional asyncpg — degrades gracefully to in-memory
try:
    import asyncpg
    POSTGRES_OK = True
except ImportError:
    POSTGRES_OK = False

COUNCIL_SIZE = 33
THRESHOLD = 22
BFT_TOLERANCE = 10
POSTGRES_URL = os.environ.get("POSTGRES_URL", "")

app = FastAPI(title="OpenPatent.ai BFT Council (Postgres)", version="1.0.0")

# In-memory fallback (same as bft.py)
_reviews: dict[str, dict] = {}
AGENT_REGISTRY = [
    {"id": f"agent-{i:02d}", "group": g, "pubkey_prefix": hashlib.sha256(f"agent-{i:02d}".encode()).hexdigest()[:16]}
    for i, g in enumerate(
        ["technical"] * 11 + ["legal"] * 8 + ["business"] * 8 + ["ethics"] * 6
    )
]

# Lazy-initialized Postgres pool
_pg_pool: Optional["asyncpg.Pool"] = None


async def init_pg():
    """Initialize Postgres schema. Called once at startup if POSTGRES_URL is set."""
    global _pg_pool
    if not POSTGRES_URL or not POSTGRES_OK:
        return
    _pg_pool = await asyncpg.create_pool(POSTGRES_URL, min_size=1, max_size=5)
    async with _pg_pool.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS reviews (
                review_id TEXT PRIMARY KEY,
                disclosure_hash TEXT NOT NULL,
                started_at TIMESTAMPTZ NOT NULL,
                completed_at TIMESTAMPTZ,
                council_size INT NOT NULL,
                bft_threshold INT NOT NULL,
                byzantine_tolerance INT NOT NULL,
                approvals INT NOT NULL,
                rejections INT NOT NULL,
                consensus TEXT NOT NULL,
                review_duration_ms INT
            );
            CREATE INDEX IF NOT EXISTS idx_reviews_disclosure ON reviews(disclosure_hash);
            CREATE INDEX IF NOT EXISTS idx_reviews_completed ON reviews(completed_at);
        """)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS votes (
                review_id TEXT NOT NULL REFERENCES reviews(review_id) ON DELETE CASCADE,
                agent_id TEXT NOT NULL,
                agent_group TEXT NOT NULL,
                vote TEXT NOT NULL,
                rationale_hash TEXT NOT NULL,
                pubkey_prefix TEXT NOT NULL,
                voted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                PRIMARY KEY (review_id, agent_id)
            );
            CREATE INDEX IF NOT EXISTS idx_votes_agent ON votes(agent_id);
        """)
    print(f"[bft-postgres] schema ready, pool: {_pg_pool}")


class ReviewRequest(BaseModel):
    disclosure_hash: str
    disclosure_result: Optional[dict] = None


async def cast_vote(agent: dict, disclosure_hash: str) -> dict:
    digest = hashlib.sha256(f"{agent['id']}-{disclosure_hash}".encode()).hexdigest()
    approval_byte = int(digest[:2], 16)
    if int(agent["id"].split("-")[1]) in {2, 7, 14, 22}:
        approve = False
    else:
        approve = approval_byte > 51
    return {
        "agent_id": agent["id"],
        "group": agent["group"],
        "pubkey_prefix": agent["pubkey_prefix"],
        "vote": "YES" if approve else "NO",
        "rationale_hash": hashlib.sha256(f"{agent['id']}-{disclosure_hash}-{approve}".encode()).hexdigest()[:16],
    }


@app.on_event("startup")
async def startup():
    await init_pg()


@app.post("/review")
async def review(req: ReviewRequest):
    review_id = str(uuid.uuid4())
    started_ts = datetime.now(timezone.utc)
    started = started_ts.timestamp()

    votes = await asyncio.gather(
        *(cast_vote(a, req.disclosure_hash) for a in AGENT_REGISTRY)
    )
    approvals = sum(1 for v in votes if v["vote"] == "YES")
    rejections = COUNCIL_SIZE - approvals
    consensus = "APPROVED" if approvals >= THRESHOLD else "REJECTED"
    completed_ts = datetime.now(timezone.utc)
    duration_ms = int((completed_ts.timestamp() - started) * 1000)

    record = {
        "review_id": review_id,
        "disclosure_hash": req.disclosure_hash,
        "council_size": COUNCIL_SIZE,
        "bft_threshold": THRESHOLD,
        "byzantine_tolerance": BFT_TOLERANCE,
        "approvals": approvals,
        "rejections": rejections,
        "consensus": consensus,
        "votes": votes,
        "started_at": started_ts.isoformat(),
        "completed_at": completed_ts.isoformat(),
        "review_duration_ms": duration_ms,
    }

    # Persist (in-memory always, Postgres if available)
    _reviews[review_id] = record
    if _pg_pool is not None:
        try:
            async with _pg_pool.acquire() as conn:
                async with conn.transaction():
                    await conn.execute(
                        """INSERT INTO reviews (review_id, disclosure_hash, started_at, completed_at,
                               council_size, bft_threshold, byzantine_tolerance,
                               approvals, rejections, consensus, review_duration_ms)
                           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)""",
                        review_id, req.disclosure_hash, started_ts, completed_ts,
                        COUNCIL_SIZE, THRESHOLD, BFT_TOLERANCE,
                        approvals, rejections, consensus, duration_ms,
                    )
                    await conn.executemany(
                        """INSERT INTO votes (review_id, agent_id, agent_group, vote, rationale_hash, pubkey_prefix)
                           VALUES ($1, $2, $3, $4, $5, $6)""",
                        [(review_id, v["agent_id"], v["group"], v["vote"],
                          v["rationale_hash"], v["pubkey_prefix"]) for v in votes],
                    )
        except Exception as e:
            print(f"[bft-postgres] persist error: {e}")
            record["persist_error"] = str(e)

    return record


@app.get("/review/{review_id}")
async def get_review(review_id: str):
    if review_id in _reviews:
        return _reviews[review_id]
    if _pg_pool is not None:
        async with _pg_pool.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM reviews WHERE review_id = $1", review_id)
            if row:
                votes = await conn.fetch("SELECT * FROM votes WHERE review_id = $1", review_id)
                return {**dict(row), "votes": [dict(v) for v in votes]}
    return JSONResponse({"status": "NOT_FOUND"}, status_code=404)


@app.get("/reviews")
async def list_reviews(disclosure_hash: Optional[str] = None, limit: int = 50):
    if _pg_pool is not None:
        async with _pg_pool.acquire() as conn:
            if disclosure_hash:
                rows = await conn.fetch(
                    "SELECT review_id, disclosure_hash, consensus, approvals, rejections, completed_at FROM reviews WHERE disclosure_hash = $1 ORDER BY completed_at DESC LIMIT $2",
                    disclosure_hash, limit,
                )
            else:
                rows = await conn.fetch(
                    "SELECT review_id, disclosure_hash, consensus, approvals, rejections, completed_at FROM reviews ORDER BY completed_at DESC LIMIT $1",
                    limit,
                )
            return {"reviews": [dict(r) for r in rows], "total": len(rows)}
    return {"reviews": list(_reviews.values())[-limit:], "total": len(_reviews)}


@app.get("/agents")
async def list_agents():
    return {
        "council_size": COUNCIL_SIZE,
        "bft_threshold": THRESHOLD,
        "byzantine_tolerance": BFT_TOLERANCE,
        "groups": {"technical": 11, "legal": 8, "business": 8, "ethics": 6},
        "agents": AGENT_REGISTRY,
        "storage": "postgres" if _pg_pool else "in-memory",
    }


@app.get("/health")
async def health():
    return {
        "status": "OK",
        "service": "bft-council-postgres",
        "council_size": COUNCIL_SIZE,
        "threshold": THRESHOLD,
        "postgres": "connected" if _pg_pool else "disconnected (in-memory)",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3215, log_level="info")
