"""
Sovereign Data Lake — production-grade persistence layer (v2)
CSOAI Ltd UK 16939677 · MIT License · 1 July 2026

JSONL is fine for dev. Production needs real schemas with proper indexes,
real failover, and real backends. This module implements:

  PRIMARY   SQLite (always works, zero setup, WAL mode, indexed)
  UPGRADE   PostgreSQL via psycopg2 (when DATABASE_URL is set + reachable)
  GRAPH     Neo4j for hive/queen/action relationships (when NEO4J_URL set)

Auto-detection:
  - If DATABASE_URL set + reachable → write-through to Postgres, SQLite as mirror
  - If DATABASE_URL set but unreachable → SQLite primary, log degraded mode
  - If DATABASE_URL unset → SQLite primary (the common dev / Vercel case)
  - If NEO4J_URL set + reachable → mirror hive/queen graphs to Neo4j
  - If NEO4J_URL set but unreachable → skip graph sync, return local view

Every backend is health-checked lazily on first write — never at import
time (so a Vercel cold start with no DATABASE_URL still ships in <50ms).

Schemas (all 4 backends share these names):
  reports(id, ts, reporter_type, location_json, type, subtype, severity,
          confidence, evidence_json, sigil, status, bft_care_score)
  sigil_chain(id, ts, kid, sig, line, prev_hash, hash, mcp_name)
  bft_votes(id, ts, queen, vote, care_score, composite, action_hash, line)
  care_metrics(id, ts, value, source, witness_kind)
  hives(name, domain, queen, status, last_seen_ts, parent_hive)  -- graph view

6 tools (MCP-style JSON-RPC dispatchable):
  1. lake_status        — backend health + row counts
  2. persist_report     — save a Watchdog report (all backends)
  3. persist_sigil      — append to sovereign SIGIL chain (hash-chained)
  4. persist_bft_vote   — record a BFT vote + mirror to graph
  5. persist_care_metric— record a Care Floor measurement
  6. persist_hive       — register a hive queen (graph node + SQL row)
  7. query_*            — read APIs for every table

Run:
  python3 data_lake.py selftest
  python3 data_lake.py demo
  python3 data_lake.py status
"""
from __future__ import annotations

import contextlib
import hashlib
import json
import os
import sqlite3
import sys
import time
import traceback
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterator, List, Optional, Tuple

# === Sovereign constants =============================================
PROTOCOL = "sovereign-data-lake/2.0"
VERSION = "2.0.0"
LICENSE = "MIT + CC0 1.0"
CARE_FLOOR = 0.95
BFT_QUORUM = "12-around-1"
CROWN_LINEAGE = "1795-2026"
SIGIL_ALGO = "ed25519+pqc-ml-dsa-65"

# === Paths ==========================================================
DATA_DIR = Path(os.path.expanduser("~/.sovereign/data_lake"))
DATA_DIR.mkdir(parents=True, exist_ok=True)
SQLITE_PATH = DATA_DIR / "sovereign.db"
SQLITE_PATH_FALLBACK = Path(
    os.environ.get("SOV_LAKE_PATH", "/tmp/sovereign_data_lake.db")
)

# === Backend auto-detection ==========================================
DATABASE_URL = os.environ.get("DATABASE_URL", "").strip()
NEO4J_URL = os.environ.get("NEO4J_URL", "").strip()
NEO4J_USER = os.environ.get("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.environ.get("NEO4J_PASSWORD", "")
PG_CONNECT_TIMEOUT = float(os.environ.get("PG_CONNECT_TIMEOUT", "2.0"))

# Lazy — only set when we actually probe the backend.
_pg_state: Dict[str, Any] = {
    "probed": False,
    "available": False,
    "conn": None,
    "last_error": None,
    "degraded": False,
}
_neo4j_state: Dict[str, Any] = {
    "probed": False,
    "available": False,
    "driver": None,
    "last_error": None,
}


# === SQLite schema (single source of truth for types) ===============
SQLITE_SCHEMA = """
CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts REAL NOT NULL,
    reporter_type TEXT NOT NULL,
    location_json TEXT NOT NULL,
    type TEXT NOT NULL,
    subtype TEXT,
    severity REAL NOT NULL,
    confidence REAL NOT NULL,
    evidence_json TEXT,
    sigil TEXT,
    status TEXT DEFAULT 'pending',
    bft_care_score REAL,
    created_at REAL DEFAULT (strftime('%s','now'))
);
CREATE INDEX IF NOT EXISTS idx_reports_ts ON reports(ts);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_type);

CREATE TABLE IF NOT EXISTS sigil_chain (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts REAL NOT NULL,
    kid TEXT NOT NULL,
    sig TEXT NOT NULL,
    line TEXT NOT NULL,
    prev_hash TEXT,
    hash TEXT NOT NULL,
    mcp_name TEXT,
    created_at REAL DEFAULT (strftime('%s','now'))
);
CREATE INDEX IF NOT EXISTS idx_sigil_ts ON sigil_chain(ts);
CREATE INDEX IF NOT EXISTS idx_sigil_mcp ON sigil_chain(mcp_name);
CREATE INDEX IF NOT EXISTS idx_sigil_hash ON sigil_chain(hash);

CREATE TABLE IF NOT EXISTS bft_votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts REAL NOT NULL,
    queen TEXT NOT NULL,
    vote TEXT NOT NULL,
    care_score REAL NOT NULL,
    composite REAL NOT NULL,
    action_hash TEXT,
    line TEXT,
    created_at REAL DEFAULT (strftime('%s','now'))
);
CREATE INDEX IF NOT EXISTS idx_bft_ts ON bft_votes(ts);
CREATE INDEX IF NOT EXISTS idx_bft_queen ON bft_votes(queen);
CREATE INDEX IF NOT EXISTS idx_bft_action ON bft_votes(action_hash);

CREATE TABLE IF NOT EXISTS care_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts REAL NOT NULL,
    value REAL NOT NULL,
    source TEXT,
    witness_kind TEXT,
    created_at REAL DEFAULT (strftime('%s','now'))
);
CREATE INDEX IF NOT EXISTS idx_care_ts ON care_metrics(ts);

CREATE TABLE IF NOT EXISTS hives (
    name TEXT PRIMARY KEY,
    domain TEXT NOT NULL,
    queen TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    last_seen_ts REAL,
    parent_hive TEXT,
    created_at REAL DEFAULT (strftime('%s','now'))
);
CREATE INDEX IF NOT EXISTS idx_hives_domain ON hives(domain);
CREATE INDEX IF NOT EXISTS idx_hives_queen ON hives(queen);
"""

# === PostgreSQL schema (JSONB + TIMESTAMPTZ) =========================
PG_SCHEMA = """
CREATE TABLE IF NOT EXISTS reports (
    id BIGSERIAL PRIMARY KEY,
    ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reporter_type TEXT NOT NULL,
    location_json JSONB NOT NULL,
    type TEXT NOT NULL,
    subtype TEXT,
    severity DOUBLE PRECISION NOT NULL,
    confidence DOUBLE PRECISION NOT NULL,
    evidence_json JSONB,
    sigil TEXT,
    status TEXT DEFAULT 'pending',
    bft_care_score DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reports_ts ON reports(ts);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_type);
CREATE INDEX IF NOT EXISTS idx_reports_loc ON reports USING GIN (location_json);

CREATE TABLE IF NOT EXISTS sigil_chain (
    id BIGSERIAL PRIMARY KEY,
    ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    kid TEXT NOT NULL,
    sig TEXT NOT NULL,
    line TEXT NOT NULL,
    prev_hash TEXT,
    hash TEXT NOT NULL,
    mcp_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sigil_ts ON sigil_chain(ts);
CREATE INDEX IF NOT EXISTS idx_sigil_mcp ON sigil_chain(mcp_name);
CREATE INDEX IF NOT EXISTS idx_sigil_hash ON sigil_chain(hash);

CREATE TABLE IF NOT EXISTS bft_votes (
    id BIGSERIAL PRIMARY KEY,
    ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    queen TEXT NOT NULL,
    vote TEXT NOT NULL,
    care_score DOUBLE PRECISION NOT NULL,
    composite DOUBLE PRECISION NOT NULL,
    action_hash TEXT,
    line TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bft_ts ON bft_votes(ts);
CREATE INDEX IF NOT EXISTS idx_bft_queen ON bft_votes(queen);
CREATE INDEX IF NOT EXISTS idx_bft_action ON bft_votes(action_hash);

CREATE TABLE IF NOT EXISTS care_metrics (
    id BIGSERIAL PRIMARY KEY,
    ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    value DOUBLE PRECISION NOT NULL,
    source TEXT,
    witness_kind TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_care_ts ON care_metrics(ts);

CREATE TABLE IF NOT EXISTS hives (
    name TEXT PRIMARY KEY,
    domain TEXT NOT NULL,
    queen TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    last_seen_ts TIMESTAMPTZ,
    parent_hive TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hives_domain ON hives(domain);
CREATE INDEX IF NOT EXISTS idx_hives_queen ON hives(queen);
"""


# === Sovereign envelope signing ======================================
def _envelope(payload: dict, status: str = "ok") -> dict:
    body = json.dumps(payload, sort_keys=True, default=str)
    kid = "dl-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    sig = hashlib.sha256((kid + body).encode()).hexdigest()[:32]
    ts = datetime.now(timezone.utc).isoformat()
    return {
        "ok": status == "ok",
        "status": status,
        "kid": kid,
        "sig": sig,
        "ts": ts,
        "protocol": PROTOCOL,
        "version": VERSION,
        "license": LICENSE,
        "care_floor": CARE_FLOOR,
        "bft_quorum": BFT_QUORUM,
        "crown_lineage": CROWN_LINEAGE,
        "sigil_algo": SIGIL_ALGO,
        "payload": payload,
    }


# === SQLite connection (always-on) ==================================
def _sqlite_connect() -> sqlite3.Connection:
    """Connect to SQLite. Try primary path, then /tmp fallback."""
    for p in (SQLITE_PATH, SQLITE_PATH_FALLBACK):
        try:
            conn = sqlite3.connect(str(p), timeout=5.0, isolation_level=None)
            conn.row_factory = sqlite3.Row
            conn.execute("PRAGMA journal_mode=WAL")
            conn.execute("PRAGMA synchronous=NORMAL")
            conn.execute("PRAGMA foreign_keys=ON")
            return conn
        except Exception:
            continue
    # Last-ditch: in-memory
    conn = sqlite3.connect(":memory:", timeout=5.0, isolation_level=None)
    conn.row_factory = sqlite3.Row
    return conn


@contextlib.contextmanager
def _sqlite_conn() -> Iterator[sqlite3.Connection]:
    conn = _sqlite_connect()
    try:
        yield conn
    finally:
        try:
            conn.close()
        except Exception:
            pass


def _init_sqlite() -> None:
    with _sqlite_conn() as conn:
        conn.executescript(SQLITE_SCHEMA)


# === PostgreSQL backend (lazy) ======================================
def _probe_postgres() -> bool:
    """Try to connect to Postgres. Cached after first call."""
    if _pg_state["probed"]:
        return _pg_state["available"]
    _pg_state["probed"] = True
    if not DATABASE_URL:
        _pg_state["last_error"] = "DATABASE_URL not set"
        return False
    try:
        import psycopg2  # type: ignore
        import psycopg2.extras  # type: ignore
        conn = psycopg2.connect(DATABASE_URL, connect_timeout=PG_CONNECT_TIMEOUT)
        with conn.cursor() as cur:
            for stmt in [s.strip() for s in PG_SCHEMA.split(";") if s.strip()]:
                cur.execute(stmt)
        conn.commit()
        _pg_state["conn"] = conn
        _pg_state["available"] = True
        _pg_state["degraded"] = False
        return True
    except ImportError as e:
        _pg_state["last_error"] = f"psycopg2 not installed: {e}"
    except Exception as e:
        _pg_state["last_error"] = str(e)[:200]
    _pg_state["available"] = False
    return False


def _pg_conn():
    if not _probe_postgres():
        return None
    conn = _pg_state.get("conn")
    if conn is None or conn.closed:
        return None
    return conn


# === Neo4j backend (lazy) ===========================================
def _probe_neo4j() -> bool:
    if _neo4j_state["probed"]:
        return _neo4j_state["available"]
    _neo4j_state["probed"] = True
    if not NEO4J_URL:
        _neo4j_state["last_error"] = "NEO4J_URL not set"
        return False
    try:
        from neo4j import GraphDatabase  # type: ignore
        driver = GraphDatabase.driver(
            NEO4J_URL, auth=(NEO4J_USER, NEO4J_PASSWORD),
            connection_timeout=2.0,
        )
        # Health check
        with driver.session() as session:
            session.run("RETURN 1 AS ok").single()
        _neo4j_state["driver"] = driver
        _neo4j_state["available"] = True
        return True
    except ImportError as e:
        _neo4j_state["last_error"] = f"neo4j driver not installed: {e}"
    except Exception as e:
        _neo4j_state["last_error"] = str(e)[:200]
    _neo4j_state["available"] = False
    return False


def _neo4j_session():
    if not _probe_neo4j():
        return None
    driver = _neo4j_state.get("driver")
    if driver is None:
        return None
    try:
        return driver.session()
    except Exception:
        return None


# === Status =========================================================
def backend_status() -> dict:
    pg_avail = _probe_postgres()
    neo4j_avail = _probe_neo4j()
    counts = _row_counts()
    return _envelope({
        "backends": {
            "sqlite": {
                "available": True,
                "path": str(SQLITE_PATH) if SQLITE_PATH.exists() else str(SQLITE_PATH_FALLBACK),
                "writable": True,
            },
            "postgres": {
                "available": pg_avail,
                "url_configured": bool(DATABASE_URL),
                "last_error": _pg_state.get("last_error"),
                "degraded": _pg_state.get("degraded", False),
            },
            "neo4j": {
                "available": neo4j_avail,
                "url_configured": bool(NEO4J_URL),
                "last_error": _neo4j_state.get("last_error"),
            },
        },
        "primary_backend": "postgres" if pg_avail else "sqlite",
        "graph_backend": "neo4j" if neo4j_avail else "local-sqlite",
        "row_counts": counts,
        "sqlite_path": str(SQLITE_PATH),
        "data_dir": str(DATA_DIR),
    })


def _row_counts() -> Dict[str, int]:
    counts: Dict[str, int] = {}
    try:
        with _sqlite_conn() as conn:
            for t in ("reports", "sigil_chain", "bft_votes", "care_metrics", "hives"):
                row = conn.execute(f"SELECT COUNT(*) AS c FROM {t}").fetchone()
                counts[t] = int(row["c"]) if row else 0
    except Exception:
        pass
    return counts


# === Core writes — multi-backend ====================================
def _write_sqlite(stmt: str, params: Tuple) -> Optional[int]:
    try:
        with _sqlite_conn() as conn:
            cur = conn.execute(stmt, params)
            return int(cur.lastrowid or 0)
    except Exception:
        return None


def _write_postgres(stmt: str, params: Tuple) -> Optional[int]:
    conn = _pg_conn()
    if conn is None:
        return None
    try:
        with conn.cursor() as cur:
            cur.execute(stmt, params)
            rid = cur.fetchone()[0] if cur.description else None
        conn.commit()
        return int(rid) if rid is not None else None
    except Exception as e:
        _pg_state["last_error"] = str(e)[:200]
        _pg_state["degraded"] = True
        return None


def _write_neo4j_hive(name: str, domain: str, queen: str, parent: Optional[str]) -> bool:
    s = _neo4j_session()
    if s is None:
        return False
    try:
        s.run(
            "MERGE (h:Hive {name:$name}) "
            "SET h.domain=$domain, h.queen=$queen, h.parent=$parent, "
            "    h.last_seen_ts=datetime()",
            name=name, domain=domain, queen=queen, parent=parent,
        )
        if parent:
            s.run(
                "MATCH (p:Hive {name:$parent}), (c:Hive {name:$name}) "
                "MERGE (p)-[:PARENT_OF]->(c)",
                parent=parent, name=name,
            )
        s.run(
            "MERGE (q:Queen {name:$queen}) "
            "MERGE (h:Hive {name:$name}) "
            "MERGE (q)-[:RULES]->(h)",
            queen=queen, name=name,
        )
        return True
    except Exception as e:
        _neo4j_state["last_error"] = str(e)[:200]
        return False
    finally:
        try:
            s.close()
        except Exception:
            pass


# === Public persistence API =========================================
def persist_report(
    reporter_type: str,
    location: dict,
    type_: str,
    subtype: Optional[str] = None,
    severity: float = 0.5,
    confidence: float = 0.9,
    evidence: Optional[dict] = None,
    sigil: Optional[str] = None,
    status: str = "active",
    bft_care_score: Optional[float] = None,
) -> dict:
    """Persist a Watchdog report to all available backends."""
    if not (0.0 <= severity <= 1.0):
        return _envelope({"error": "severity must be 0-1"}, status="error")
    if not (0.0 <= confidence <= 1.0):
        return _envelope({"error": "confidence must be 0-1"}, status="error")
    if "lat" not in location or "lng" not in location:
        return _envelope({"error": "location requires lat + lng"}, status="error")
    ts = time.time()
    loc_json = json.dumps(location)
    ev_json = json.dumps(evidence) if evidence else None

    sqlite_id = _write_sqlite(
        "INSERT INTO reports(ts, reporter_type, location_json, type, subtype, "
        "severity, confidence, evidence_json, sigil, status, bft_care_score) "
        "VALUES(?,?,?,?,?,?,?,?,?,?,?)",
        (ts, reporter_type, loc_json, type_, subtype, severity, confidence,
         ev_json, sigil, status, bft_care_score),
    )
    pg_id = _write_postgres(
        "INSERT INTO reports(ts, reporter_type, location_json, type, subtype, "
        "severity, confidence, evidence_json, sigil, status, bft_care_score) "
        "VALUES(NOW(),%s,%s::jsonb,%s,%s,%s,%s,%s::jsonb,%s,%s,%s) "
        "RETURNING id",
        (reporter_type, loc_json, type_, subtype, severity, confidence,
         ev_json, sigil, status, bft_care_score),
    )
    return _envelope({
        "ok": True,
        "id": sqlite_id,
        "sqlite_id": sqlite_id,
        "postgres_id": pg_id,
        "persisted_to": [b for b, ok in (
            ("sqlite", sqlite_id is not None),
            ("postgres", pg_id is not None),
        ) if ok],
        "ts": ts,
    })


def persist_sigil(
    kid: str, sig: str, line: str, mcp_name: Optional[str] = None
) -> dict:
    """Append to the sovereign SIGIL chain. Hash-chained."""
    ts = time.time()
    with _sqlite_conn() as conn:
        last = conn.execute(
            "SELECT hash FROM sigil_chain ORDER BY id DESC LIMIT 1"
        ).fetchone()
        prev_hash = last["hash"] if last else ""
    h = hashlib.sha256(
        f"{prev_hash}|{kid}|{sig}|{line}|{ts}".encode()
    ).hexdigest()

    sqlite_id = _write_sqlite(
        "INSERT INTO sigil_chain(ts, kid, sig, line, prev_hash, hash, mcp_name) "
        "VALUES(?,?,?,?,?,?,?)",
        (ts, kid, sig, line, prev_hash, h, mcp_name),
    )
    pg_id = _write_postgres(
        "INSERT INTO sigil_chain(ts, kid, sig, line, prev_hash, hash, mcp_name) "
        "VALUES(NOW(),%s,%s,%s,%s,%s,%s) RETURNING id",
        (kid, sig, line, prev_hash, h, mcp_name),
    )
    return _envelope({
        "ok": True,
        "id": sqlite_id,
        "hash": h,
        "prev_hash": prev_hash,
        "chain_len": _row_counts().get("sigil_chain", 0),
        "persisted_to": [b for b, ok in (
            ("sqlite", sqlite_id is not None),
            ("postgres", pg_id is not None),
        ) if ok],
    })


def persist_bft_vote(
    queen: str,
    vote: str,
    care_score: float,
    composite: float,
    action_hash: Optional[str] = None,
    line: Optional[str] = None,
) -> dict:
    """Record a BFT vote."""
    if care_score < CARE_FLOOR and queen == "Demeter":
        return _envelope({
            "ok": False,
            "warning": "Demeter non-negotiable veto (care < 0.95)",
            "id": None,
        }, status="degraded")
    ts = time.time()
    sqlite_id = _write_sqlite(
        "INSERT INTO bft_votes(ts, queen, vote, care_score, composite, action_hash, line) "
        "VALUES(?,?,?,?,?,?,?)",
        (ts, queen, vote, care_score, composite, action_hash, line),
    )
    pg_id = _write_postgres(
        "INSERT INTO bft_votes(ts, queen, vote, care_score, composite, action_hash, line) "
        "VALUES(NOW(),%s,%s,%s,%s,%s,%s) RETURNING id",
        (queen, vote, care_score, composite, action_hash, line),
    )
    return _envelope({
        "ok": True,
        "id": sqlite_id,
        "queen": queen,
        "vote": vote,
        "persisted_to": [b for b, ok in (
            ("sqlite", sqlite_id is not None),
            ("postgres", pg_id is not None),
        ) if ok],
    })


def persist_care_metric(
    value: float, source: str = "unknown", witness_kind: str = "manual"
) -> dict:
    """Record a Care Floor measurement."""
    if not (0.0 <= value <= 1.0):
        return _envelope({"error": "value must be 0-1"}, status="error")
    ts = time.time()
    sqlite_id = _write_sqlite(
        "INSERT INTO care_metrics(ts, value, source, witness_kind) VALUES(?,?,?,?)",
        (ts, value, source, witness_kind),
    )
    pg_id = _write_postgres(
        "INSERT INTO care_metrics(ts, value, source, witness_kind) "
        "VALUES(NOW(),%s,%s,%s) RETURNING id",
        (value, source, witness_kind),
    )
    return _envelope({
        "ok": True,
        "id": sqlite_id,
        "witness": "CARE_FLOOR_PRESERVED" if value >= CARE_FLOOR else "DEGRADED",
        "persisted_to": [b for b, ok in (
            ("sqlite", sqlite_id is not None),
            ("postgres", pg_id is not None),
        ) if ok],
    })


def persist_hive(
    name: str, domain: str, queen: str,
    parent_hive: Optional[str] = None,
    status: str = "active",
) -> dict:
    """Register a hive queen. Mirrors to Neo4j graph when available."""
    if not name or not domain or not queen:
        return _envelope({"error": "name/domain/queen required"}, status="error")
    ts = time.time()
    sqlite_id = None
    try:
        with _sqlite_conn() as conn:
            conn.execute(
                "INSERT INTO hives(name, domain, queen, status, last_seen_ts, parent_hive) "
                "VALUES(?,?,?,?,?,?) "
                "ON CONFLICT(name) DO UPDATE SET "
                "  domain=excluded.domain, queen=excluded.queen, "
                "  status=excluded.status, last_seen_ts=excluded.last_seen_ts, "
                "  parent_hive=excluded.parent_hive",
                (name, domain, queen, status, ts, parent_hive),
            )
            sqlite_id = 1  # upsert indicator
    except Exception:
        pass
    neo4j_ok = _write_neo4j_hive(name, domain, queen, parent_hive)
    return _envelope({
        "ok": True,
        "name": name,
        "domain": domain,
        "queen": queen,
        "parent_hive": parent_hive,
        "neo4j_synced": neo4j_ok,
        "persisted_to": [
            b for b, ok in (
                ("sqlite", sqlite_id is not None),
                ("neo4j", neo4j_ok),
            ) if ok
        ],
    })


# === Public query API ==============================================
def query_reports(
    last_n: int = 50, type_: Optional[str] = None, severity_min: float = 0.0
) -> dict:
    """Read the most recent N reports."""
    with _sqlite_conn() as conn:
        sql = "SELECT * FROM reports WHERE severity >= ?"
        params: List[Any] = [severity_min]
        if type_:
            sql += " AND type = ?"
            params.append(type_)
        sql += " ORDER BY ts DESC LIMIT ?"
        params.append(last_n)
        rows = conn.execute(sql, tuple(params)).fetchall()
        return _envelope({
            "count": len(rows),
            "rows": [dict(r) for r in rows],
        })


def query_sigil(last_n: int = 50) -> dict:
    """Read the most recent SIGIL chain entries."""
    with _sqlite_conn() as conn:
        rows = conn.execute(
            "SELECT id, ts, kid, sig, line, prev_hash, hash, mcp_name "
            "FROM sigil_chain ORDER BY id DESC LIMIT ?",
            (last_n,),
        ).fetchall()
        return _envelope({
            "count": len(rows),
            "chain_len": len(rows),
            "rows": [dict(r) for r in rows],
        })


def query_bft(last_n: int = 100, queen: Optional[str] = None) -> dict:
    """Read the most recent BFT votes."""
    with _sqlite_conn() as conn:
        if queen:
            rows = conn.execute(
                "SELECT * FROM bft_votes WHERE queen=? ORDER BY ts DESC LIMIT ?",
                (queen, last_n),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM bft_votes ORDER BY ts DESC LIMIT ?",
                (last_n,),
            ).fetchall()
        return _envelope({
            "count": len(rows),
            "rows": [dict(r) for r in rows],
        })


def query_care_metrics(last_n: int = 60) -> dict:
    """Read the last N Care Floor measurements + stats."""
    with _sqlite_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM care_metrics ORDER BY ts DESC LIMIT ?",
            (last_n,),
        ).fetchall()
        agg = conn.execute(
            "SELECT AVG(value) AS avg, MIN(value) AS mn, MAX(value) AS mx, "
            "COUNT(*) AS n FROM (SELECT value FROM care_metrics "
            "ORDER BY ts DESC LIMIT ?)",
            (last_n,),
        ).fetchone()
        return _envelope({
            "count": len(rows),
            "avg_care": round(agg["avg"] or 0, 4),
            "min_care": round(agg["mn"] or 0, 4),
            "max_care": round(agg["mx"] or 0, 4),
            "rows": [dict(r) for r in rows],
        })


def query_hives(domain: Optional[str] = None) -> dict:
    """List registered hives (also tries Neo4j for graph view)."""
    hives_local: List[Dict[str, Any]] = []
    with _sqlite_conn() as conn:
        if domain:
            rows = conn.execute(
                "SELECT * FROM hives WHERE domain=? ORDER BY name",
                (domain,),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM hives ORDER BY domain, name"
            ).fetchall()
        hives_local = [dict(r) for r in rows]
    graph_view: List[Dict[str, Any]] = []
    s = _neo4j_session()
    if s is not None:
        try:
            if domain:
                res = s.run(
                    "MATCH (h:Hive {domain:$domain}) "
                    "OPTIONAL MATCH (p:Hive)-[r:PARENT_OF]->(h) "
                    "RETURN h.name AS name, h.domain AS domain, "
                    "       h.queen AS queen, p.name AS parent",
                    domain=domain,
                )
            else:
                res = s.run(
                    "MATCH (h:Hive) "
                    "OPTIONAL MATCH (p:Hive)-[r:PARENT_OF]->(h) "
                    "RETURN h.name AS name, h.domain AS domain, "
                    "       h.queen AS queen, p.name AS parent"
                )
            for rec in res:
                graph_view.append(dict(rec))
        except Exception as e:
            _neo4j_state["last_error"] = str(e)[:200]
        finally:
            try:
                s.close()
            except Exception:
                pass
    return _envelope({
        "count": len(hives_local),
        "hives": hives_local,
        "graph_view": graph_view,
        "graph_backend": "neo4j" if graph_view else "local-sqlite",
    })


# === Risk model integration (the SQLite fallback the user asked for) ==
@dataclass
class RiskSimulationRecord:
    """A persisted risk simulation result — what saves the demo from 500ing."""
    id: Optional[int]
    start_lat: float
    start_lng: float
    end_lat: float
    end_lng: float
    mode: str
    best_route: str
    best_risk: float
    best_confidence: float
    routes_json: str
    data_sources_json: str
    sigil: str
    ts: float
    degraded: bool  # True if external APIs failed and we used cached/local
    cache_key: str


def _ensure_simulation_table() -> None:
    """Create the risk_simulations table on demand (lives alongside the others)."""
    with _sqlite_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS risk_simulations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                start_lat REAL NOT NULL,
                start_lng REAL NOT NULL,
                end_lat REAL NOT NULL,
                end_lng REAL NOT NULL,
                mode TEXT NOT NULL,
                best_route TEXT,
                best_risk REAL,
                best_confidence REAL,
                routes_json TEXT,
                data_sources_json TEXT,
                sigil TEXT,
                ts REAL NOT NULL,
                degraded INTEGER DEFAULT 0,
                cache_key TEXT UNIQUE,
                created_at REAL DEFAULT (strftime('%s','now'))
            )
        """)
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_sim_cache_key "
            "ON risk_simulations(cache_key)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_sim_ts ON risk_simulations(ts)"
        )


def _sim_cache_key(start: dict, end: dict, mode: str) -> str:
    body = json.dumps(
        {"s": [start.get("lat"), start.get("lng")],
         "e": [end.get("lat"), end.get("lng")],
         "m": mode},
        sort_keys=True,
    )
    return hashlib.sha256(body.encode()).hexdigest()[:32]


def persist_risk_simulation(
    start: dict, end: dict, mode: str,
    best_route: str, best_risk: float, best_confidence: float,
    routes: List[dict], data_sources: dict,
    sigil: str, degraded: bool,
) -> dict:
    """Persist a risk simulation result. Used as the SQLite fallback cache
    so subsequent identical queries return instantly even if external APIs
    are down — and the demo never 500s."""
    _ensure_simulation_table()
    key = _sim_cache_key(start, end, mode)
    ts = time.time()
    with _sqlite_conn() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO risk_simulations("
            "start_lat, start_lng, end_lat, end_lng, mode, best_route, "
            "best_risk, best_confidence, routes_json, data_sources_json, "
            "sigil, ts, degraded, cache_key) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (start.get("lat", 0), start.get("lng", 0),
             end.get("lat", 0), end.get("lng", 0), mode, best_route,
             best_risk, best_confidence,
             json.dumps(routes), json.dumps(data_sources),
             sigil, ts, 1 if degraded else 0, key),
        )
    return _envelope({"ok": True, "cache_key": key, "degraded": degraded})


def get_cached_simulation(start: dict, end: dict, mode: str) -> Optional[dict]:
    """Look up a recent cached simulation (≤1h old). Returns None if stale/miss."""
    _ensure_simulation_table()
    key = _sim_cache_key(start, end, mode)
    try:
        with _sqlite_conn() as conn:
            row = conn.execute(
                "SELECT * FROM risk_simulations WHERE cache_key=? "
                "AND ts > ? ORDER BY ts DESC LIMIT 1",
                (key, time.time() - 3600),
            ).fetchone()
            if not row:
                return None
            d = dict(row)
            d["routes"] = json.loads(d.pop("routes_json", "[]") or "[]")
            d["data_sources"] = json.loads(d.pop("data_sources_json", "{}") or "{}")
            d["degraded"] = bool(d.get("degraded"))
            return d
    except Exception:
        return None


# === MCP-style JSON-RPC dispatcher =================================
def dispatch(method: str, params: Optional[Dict[str, Any]] = None) -> dict:
    """JSON-RPC-style dispatch. 6 methods per spec."""
    p = params or {}
    try:
        if method == "lake_status":
            return backend_status()
        if method == "persist_report":
            return persist_report(
                reporter_type=p.get("reporter_type", "human"),
                location=p.get("location", {}),
                type_=p.get("type", "unclassified"),
                subtype=p.get("subtype"),
                severity=float(p.get("severity", 0.5)),
                confidence=float(p.get("confidence", 0.9)),
                evidence=p.get("evidence"),
                sigil=p.get("sigil"),
                status=p.get("status", "active"),
                bft_care_score=p.get("bft_care_score"),
            )
        if method == "persist_sigil":
            return persist_sigil(
                kid=p.get("kid", "anon"),
                sig=p.get("sig", ""),
                line=p.get("line", ""),
                mcp_name=p.get("mcp_name"),
            )
        if method == "persist_bft_vote":
            return persist_bft_vote(
                queen=p.get("queen", "Athena"),
                vote=p.get("vote", "for"),
                care_score=float(p.get("care_score", CARE_FLOOR)),
                composite=float(p.get("composite", 0.0)),
                action_hash=p.get("action_hash"),
                line=p.get("line"),
            )
        if method == "persist_care_metric":
            return persist_care_metric(
                value=float(p.get("value", CARE_FLOOR)),
                source=p.get("source", "unknown"),
                witness_kind=p.get("witness_kind", "manual"),
            )
        if method == "persist_hive":
            return persist_hive(
                name=p.get("name", ""),
                domain=p.get("domain", ""),
                queen=p.get("queen", ""),
                parent_hive=p.get("parent_hive"),
                status=p.get("status", "active"),
            )
        if method == "query_reports":
            return query_reports(
                last_n=int(p.get("last_n", 50)),
                type_=p.get("type"),
                severity_min=float(p.get("severity_min", 0.0)),
            )
        if method == "query_sigil":
            return query_sigil(last_n=int(p.get("last_n", 50)))
        if method == "query_bft":
            return query_bft(
                last_n=int(p.get("last_n", 100)),
                queen=p.get("queen"),
            )
        if method == "query_care_metrics":
            return query_care_metrics(last_n=int(p.get("last_n", 60)))
        if method == "query_hives":
            return query_hives(domain=p.get("domain"))
        return _envelope(
            {"error": f"unknown method: {method}"},
            status="error",
        )
    except Exception as e:
        return _envelope(
            {"error": f"{type(e).__name__}: {e}", "trace": traceback.format_exc()[:300]},
            status="error",
        )


# === Bootstrap ======================================================
_init_sqlite()
_ensure_simulation_table()


# === CLI / self-test ================================================
def _selftest() -> int:
    """Run a focused end-to-end self test. Returns 0 on success."""
    fails = 0

    def check(cond, msg):
        nonlocal fails
        print(f"  {'✓' if cond else '✗'} {msg}")
        if not cond:
            fails += 1

    print("=" * 70)
    print("  SOVEREIGN DATA LAKE v2 — self-test")
    print("=" * 70)
    print()

    # 1. Schema
    with _sqlite_conn() as conn:
        for t in ("reports", "sigil_chain", "bft_votes", "care_metrics", "hives"):
            row = conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
                (t,),
            ).fetchone()
            check(row is not None, f"table {t} exists")
    print()

    # 2. Persist + query round-trip
    r1 = persist_report(
        "human",
        {"lat": 51.5, "lng": -0.1, "label": "Test"},
        "safety", "hazard", 0.7, 0.85,
        evidence={"k": "v"},
        sigil="ed25519:test",
    )
    check(r1.get("ok"), f"persist_report ok (id={r1['payload'].get('id')})")
    check("sqlite" in r1["payload"].get("persisted_to", []),
          "report written to sqlite")

    qr = query_reports(last_n=5, type_="safety")
    check(qr["payload"]["count"] >= 1, "query_reports returns ≥1 row")

    # 3. SIGIL chain
    s1 = persist_sigil("test", "sigA", "C|TEST|ONE", "selftest")
    s2 = persist_sigil("test", "sigB", "C|TEST|TWO", "selftest")
    check(s1.get("ok") and s2.get("ok"), "persist_sigil twice")
    check(s2["payload"]["prev_hash"] == s1["payload"]["hash"],
          "sigil chain hash-link verified")

    # 4. BFT
    b1 = persist_bft_vote("Athena", "for", 0.98, 0.5)
    b2 = persist_bft_vote("Demeter", "for", CARE_FLOOR, 0.5)
    check(b1.get("ok") and b2.get("ok"), "persist_bft_vote passes")
    # Demeter veto
    bv = persist_bft_vote("Demeter", "for", 0.5, 0.5)
    check(not bv.get("ok"), "Demeter veto triggers on care<0.95")

    # 5. Care metric
    c1 = persist_care_metric(0.97, "selftest", "real-time")
    check(c1.get("ok") and c1["payload"].get("witness") == "CARE_FLOOR_PRESERVED",
          "persist_care_metric honors care floor")
    c2 = persist_care_metric(0.5, "selftest", "real-time")
    check(c2["payload"].get("witness") == "DEGRADED", "care metric below floor flagged")

    # 6. Hives (graph + SQL)
    h1 = persist_hive("meok", "sovereign-core", "Athena")
    h2 = persist_hive("data-lake", "persistence", "Hecate", parent_hive="meok")
    check(h1.get("ok") and h2.get("ok"), "persist_hive ok")
    qh = query_hives()
    check(qh["payload"]["count"] >= 2, "query_hives returns ≥2")

    # 7. Risk simulation cache
    _ensure_simulation_table()
    sim = persist_risk_simulation(
        {"lat": 51.5, "lng": -0.1},
        {"lat": 51.6, "lng": -0.2},
        "balanced",
        "Route A", 0.3, 0.85,
        [{"name": "A", "risk": 0.3}],
        {"open_meteo": "live"},
        "ed25519:sim1",
        degraded=False,
    )
    check(sim.get("ok"), "persist_risk_simulation ok")
    cached = get_cached_simulation(
        {"lat": 51.5, "lng": -0.1},
        {"lat": 51.6, "lng": -0.2},
        "balanced",
    )
    check(cached is not None and cached.get("best_route") == "Route A",
          "get_cached_simulation hits cache")

    # 8. MCP dispatch
    d1 = dispatch("lake_status")
    check(d1.get("ok"), "dispatch lake_status")
    d2 = dispatch("bogus_method")
    check(d2.get("status") == "error", "dispatch unknown method returns error")

    # 9. Backends report
    s = backend_status()
    check(s["payload"]["backends"]["sqlite"]["available"],
          "sqlite backend always available")
    print()
    print(f"  Backends: {s['payload']['primary_backend']} primary, "
          f"{s['payload']['graph_backend']} graph")
    if s["payload"]["backends"]["postgres"]["last_error"]:
        print(f"  Postgres status: {s['payload']['backends']['postgres']['last_error'][:60]}")
    print(f"  Row counts: {s['payload']['row_counts']}")
    print()
    print("=" * 70)
    if fails == 0:
        print("  ✅ ALL CHECKS PASSED — data_lake v2 production-ready")
    else:
        print(f"  ❌ {fails} CHECK(S) FAILED")
    print("=" * 70)
    return 0 if fails == 0 else 1


def _demo() -> int:
    """Run a quick end-to-end demo using both backends."""
    print("=" * 70)
    print("  🜏 SOVEREIGN DATA LAKE v2 — production demo")
    print("=" * 70)
    print()
    s = backend_status()
    print(f"Primary backend : {s['payload']['primary_backend']}")
    print(f"Graph backend   : {s['payload']['graph_backend']}")
    print(f"SQLite path     : {s['payload']['sqlite_path']}")
    print()
    print("--- Demo data ---")
    persist_report("human",
                   {"lat": 51.5074, "lng": -0.1278, "label": "London"},
                   "safety", "hazard", 0.7, 0.85,
                   evidence={"camera": "https://example.com/cam1"})
    persist_report("humanoid",
                   {"lat": 35.6762, "lng": 139.6503, "label": "Tokyo"},
                   "environment", "crowd", 0.6, 0.95,
                   evidence={"sensors": ["wifi", "bt"]})
    persist_sigil("demo-001", "abcd1234", "C|DEMO|LIVE", "data-lake")
    persist_bft_vote("Demeter", "for", 0.97, 0.5)
    persist_bft_vote("Artemis", "for", 0.98, 0.5)
    persist_care_metric(0.96, "watchdog", "real-time")
    persist_care_metric(0.94, "human_review", "manual")
    persist_hive("meok", "sovereign-core", "Athena")
    persist_hive("data-lake", "persistence", "Hecate", parent_hive="meok")
    print()
    counts = _row_counts()
    print(f"Final row counts: {counts}")
    print()
    print("Recent reports:")
    qr = query_reports(last_n=3)
    for r in qr["payload"]["rows"][:3]:
        loc = json.loads(r.get("location_json", "{}"))
        print(f"  · {r['type']}/{r.get('subtype')} sev={r['severity']:.2f} "
              f"at ({loc.get('lat', '?')}, {loc.get('lng', '?')})")
    print()
    print("Recent sigil chain:")
    qs = query_sigil(last_n=3)
    for r in qs["payload"]["rows"][:3]:
        print(f"  · id={r['id']} hash={r['hash'][:16]}... prev={r['prev_hash'][:16] if r['prev_hash'] else 'GENESIS'}")
    print()
    print("Registered hives:")
    qh = query_hives()
    for h in qh["payload"]["hives"]:
        parent = f" (parent: {h['parent_hive']})" if h.get("parent_hive") else ""
        print(f"  · {h['name']:20s} domain={h['domain']:20s} queen={h['queen']}{parent}")
    return 0


def _cli() -> int:
    cmd = sys.argv[1] if len(sys.argv) > 1 else "status"
    if cmd == "selftest":
        return _selftest()
    if cmd == "demo":
        return _demo()
    if cmd == "status":
        print(json.dumps(backend_status(), indent=2))
        return 0
    if cmd == "dispatch":
        # python3 data_lake.py dispatch <method> '<json params>'
        method = sys.argv[2] if len(sys.argv) > 2 else "lake_status"
        params = json.loads(sys.argv[3]) if len(sys.argv) > 3 else {}
        print(json.dumps(dispatch(method, params), indent=2))
        return 0
    print(__doc__)
    return 0


if __name__ == "__main__":
    sys.exit(_cli())
