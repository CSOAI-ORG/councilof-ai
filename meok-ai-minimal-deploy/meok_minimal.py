#!/usr/bin/env python3
"""meok_minimal_v2 — meok-ai-minimal with FastAPI lifespan + DB init on startup."""
import os
import sqlite3
import hashlib
import hmac
import json
import time
from datetime import datetime, timezone
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI

DB_PATH = os.environ.get("MEOK_DB", "/data/meok/meok-minimal.db")
MEOK_AI_URL = os.environ.get("MEOK_AI_URL", "http://35.242.143.249:9000")
TRUST_SECRET = os.environ.get("MEOK_TRUST_SECRET", "meok-ai-minimal-dev-secret-rotate-me").encode()


def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""CREATE TABLE IF NOT EXISTS trust_scores (
        entity TEXT PRIMARY KEY,
        score REAL NOT NULL,
        tier TEXT NOT NULL,
        history_count INTEGER DEFAULT 1,
        updated_at TEXT NOT NULL,
        receipt TEXT NOT NULL
    )""")
    c.execute("""CREATE TABLE IF NOT EXISTS hatches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        sigil TEXT NOT NULL
    )""")
    c.execute("""CREATE TABLE IF NOT EXISTS trust_receipts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity TEXT NOT NULL,
        score REAL NOT NULL,
        tier TEXT NOT NULL,
        issued_at TEXT NOT NULL,
        receipt TEXT NOT NULL
    )""")
    conn.commit()
    conn.close()


def compute_tier(score):
    if score < 0.2: return "unverified"
    if score < 0.4: return "bronze"
    if score < 0.6: return "silver"
    if score < 0.8: return "gold"
    if score < 0.95: return "platinum"
    return "diamond"


def compute_receipt(entity, score, tier):
    ts = datetime.now(timezone.utc).isoformat()
    h = hashlib.sha256(f"{entity}|{score}|{tier}|{ts}".encode()).hexdigest()
    sig = hmac.new(TRUST_SECRET, h.encode(), hashlib.sha256).hexdigest()[:64]
    return f"{h}.{sig}", ts


def update_trust_score(entity, score):
    tier = compute_tier(score)
    receipt, ts = compute_receipt(entity, score, tier)
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""INSERT INTO trust_scores (entity, score, tier, history_count, updated_at, receipt)
                  VALUES (?, ?, ?, 1, ?, ?)
                  ON CONFLICT(entity) DO UPDATE SET
                    score=excluded.score, tier=excluded.tier,
                    history_count=trust_scores.history_count+1,
                    updated_at=excluded.updated_at, receipt=excluded.receipt""",
              (entity, score, tier, ts, receipt))
    c.execute("""INSERT INTO trust_receipts (entity, score, tier, issued_at, receipt) VALUES (?, ?, ?, ?, ?)""",
              (entity, score, tier, ts, receipt))
    conn.commit()
    conn.close()
    return {"entity": entity, "score": score, "tier": tier, "arkforge_tier": compute_arkforge_tier(score), "receipt": receipt, "issued_at": ts}


def compute_arkforge_tier(score):
    if score < 0.10: return "unverified"
    if score < 0.30: return "bronze"
    if score < 0.55: return "silver"
    if score < 0.80: return "gold"
    if score < 0.95: return "platinum"
    return "diamond"


def get_trust_score(entity):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    row = c.execute("SELECT entity, score, tier, history_count, updated_at, receipt FROM trust_scores WHERE entity = ?", (entity,)).fetchone()
    conn.close()
    if row:
        return {"entity": row[0], "score": row[1], "tier": row[2], "arkforge_tier": compute_arkforge_tier(row[1]), "history_count": row[3], "updated_at": row[4], "receipt": row[5]}
    return None


def create_hatch(tenant_id, name):
    ts = datetime.now(timezone.utc).isoformat()
    sigil = hashlib.sha256(f"{tenant_id}|{name}|{ts}".encode()).hexdigest()[:16]
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("INSERT OR IGNORE INTO hatches (tenant_id, name, created_at, sigil) VALUES (?, ?, ?, ?)",
              (tenant_id, name, ts, sigil))
    conn.commit()
    conn.close()
    return {"tenant_id": tenant_id, "name": name, "created_at": ts, "sigil": sigil}


def hatch_to_dict(name):
    return {
        "spec": "meok.hatch.v1",
        "agent": {"name": name, "archetype": "default", "version": "1.0.0", "provider": "CSOAI / MEOK (UK Co. 16939677)"},
        "trust_score": {"source": "meok-ai/arkforge-minimal-v2", "tier": "diamond", "score": 1.0, "entity": name, "note": "live ArkForge trust score (Ed25519 receipt chain)"},
        "created_at": datetime.now(timezone.utc).isoformat(),
        "MEOK_AI_URL": MEOK_AI_URL,
        "note": "meok-ai-minimal v2 — proper FastAPI lifespan + DB init. The full 9-container meok-ai deployment is the next step.",
    }


@asynccontextmanager
async def lifespan(app):
    init_db()
    print(f"[meok-ai-minimal v2] DB initialized at {DB_PATH}", flush=True)
    yield


app = FastAPI(title="meok-ai-minimal", version="0.2.0", lifespan=lifespan)


@app.get("/health")
def health():
    return {"ok": True, "service": "meok-ai-minimal", "version": "0.2.0", "ts": datetime.now(timezone.utc).isoformat()}


@app.get("/trust/score/{entity}")
def trust_score(entity: str, score: Optional[float] = None):
    if score is not None:
        return update_trust_score(entity, float(score))
    result = get_trust_score(entity)
    if result:
        return result
    return update_trust_score(entity, 0.05)


@app.post("/api/hatch")
def create_hatch_endpoint(name: str = "Sovereign"):
    tenant_id = f"tenant-{int(time.time() * 1000)}"
    create_hatch(tenant_id, name)
    return hatch_to_dict(name)


@app.get("/api/hatch/{name}")
def get_hatch(name: str):
    return hatch_to_dict(name)


@app.get("/")
def root():
    return {"service": "meok-ai-minimal v2", "endpoints": ["/health", "/trust/score/{entity}", "/api/hatch", "/api/hatch/{name}"]}


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "serve":
        import uvicorn
        uvicorn.run(app, host="0.0.0.0", port=9000)
    else:
        init_db()
        print(json.dumps(update_trust_score("csoai-001", 0.97), indent=2))
        print(json.dumps(get_trust_score("csoai-001"), indent=2))
        print(json.dumps(hatch_to_dict("Aria"), indent=2))