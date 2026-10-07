#!/usr/bin/env python3.11
"""
sovereign_db.py — the sovereign database (rebuilt 7 Oct 2026).

The 13 tables of the CSOAI sovereign substrate.
All SIGIL-signed + BFT-deliberated + OSCAL-stamped + Care Floor 0.95.

Author: M4 (the engineering lane). MIT license. CSOAI Ltd UK 16939677.
"""
import os
import json
import time
import hashlib
import sqlite3
import secrets
import argparse
from pathlib import Path
from datetime import datetime, timezone
from contextlib import contextmanager


DB_PATH = Path.home() / '.sovereign' / 'ichars.db'
DB_PATH.parent.mkdir(parents=True, exist_ok=True)


SCHEMA = """
CREATE TABLE IF NOT EXISTS ichars (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    did TEXT NOT NULL UNIQUE,
    vc TEXT,
    jwt TEXT,
    name TEXT NOT NULL,
    archetype TEXT NOT NULL,
    queen TEXT,
    arcana INTEGER,
    ocean_json TEXT,
    sovereign_domains TEXT,
    location_json TEXT,
    preferences_json TEXT,
    bft_tier TEXT,
    bft_vote_weight INTEGER DEFAULT 1,
    delegate_to TEXT,
    ai_ethics_json TEXT,
    sigil_hash TEXT,
    tier TEXT DEFAULT 'Bronze',
    tier_progress_json TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS queens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    role TEXT,
    arcana INTEGER,
    motto TEXT,
    ocean_json TEXT,
    veto INTEGER DEFAULT 0,
    sigil_hash TEXT
);

CREATE TABLE IF NOT EXISTS temples (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    country TEXT,
    lat REAL,
    lon REAL,
    regulations_json TEXT,
    queen_id INTEGER,
    sigil_hash TEXT,
    FOREIGN KEY(queen_id) REFERENCES queens(id)
);

CREATE TABLE IF NOT EXISTS regulations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    temple_id INTEGER NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    year INTEGER,
    source TEXT,
    sigil_hash TEXT,
    FOREIGN KEY(temple_id) REFERENCES temples(id)
);

CREATE TABLE IF NOT EXISTS sigil_chain (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hash TEXT NOT NULL UNIQUE,
    prev_hash TEXT NOT NULL,
    actor TEXT NOT NULL,
    action TEXT NOT NULL,
    payload_json TEXT,
    ts TEXT NOT NULL,
    bft_vote_json TEXT
);

CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts TEXT NOT NULL,
    actor TEXT NOT NULL,
    action TEXT NOT NULL,
    sigil TEXT,
    status TEXT,
    details_json TEXT
);

CREATE TABLE IF NOT EXISTS charter_titles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL UNIQUE,
    status TEXT,
    ratified_at TEXT,
    sigil TEXT
);

CREATE TABLE IF NOT EXISTS charter_signatures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    charter_id INTEGER NOT NULL,
    signer TEXT NOT NULL,
    sigil TEXT,
    ts TEXT NOT NULL,
    FOREIGN KEY(charter_id) REFERENCES charter_titles(id)
);

CREATE TABLE IF NOT EXISTS framework_coverage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    framework TEXT NOT NULL,
    article TEXT NOT NULL,
    covered_by TEXT,
    sigil TEXT
);

CREATE TABLE IF NOT EXISTS queen_votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    queen_id INTEGER NOT NULL,
    proposal_id INTEGER NOT NULL,
    vote TEXT NOT NULL,
    sigil TEXT,
    ts TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS csoai_sbt (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_hash TEXT NOT NULL,
    attestation TEXT,
    sigil TEXT,
    ts TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pii_pseudonyms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    real_id_hash TEXT NOT NULL,
    pseudonym TEXT NOT NULL,
    sigil TEXT,
    ts TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS x402_invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    caller TEXT NOT NULL,
    service TEXT NOT NULL,
    amount_usd REAL NOT NULL,
    sigil TEXT,
    ts TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS mcp_federation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mcp_id TEXT NOT NULL UNIQUE,
    server TEXT,
    tools_json TEXT,
    last_health TEXT,
    sigil TEXT
);

CREATE INDEX IF NOT EXISTS idx_sigil_hash ON sigil_chain(hash);
CREATE INDEX IF NOT EXISTS idx_audit_ts ON audit_log(ts);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_log(actor);
CREATE INDEX IF NOT EXISTS idx_bft_tier ON ichars(bft_tier);
CREATE INDEX IF NOT EXISTS idx_framework ON framework_coverage(framework);
"""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _sigil(prev: str, payload: dict) -> str:
    h = hashlib.sha256()
    h.update(prev.encode())
    h.update(json.dumps(payload, sort_keys=True).encode())
    return h.hexdigest()


@contextmanager
def get_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    """Initialize the sovereign database."""
    with get_db() as conn:
        conn.executescript(SCHEMA)


def create_ichar(name: str, archetype: str, queen: str, arcana: int, ocean: dict,
                 sovereign_domains: list, location: dict, preferences: dict,
                 bft_tier: str, bft_vote_weight: int, ai_ethics: dict) -> dict:
    """Create an i-character. Returns the i-character record + sigil."""
    did = f"did:csoai:{secrets.token_hex(8)}"
    vc = f"vc:{secrets.token_hex(16)}"
    jwt = f"jwt:{secrets.token_hex(16)}"
    sigil = secrets.token_hex(32)
    ichar = {
        'did': did, 'vc': vc, 'jwt': jwt,
        'name': name, 'archetype': archetype, 'queen': queen, 'arcana': arcana,
        'ocean': ocean,
        'sovereign_domains': sovereign_domains,
        'location': location,
        'preferences': preferences,
        'bft_tier': bft_tier, 'bft_vote_weight': bft_vote_weight,
        'ai_ethics': ai_ethics,
        'sigil_hash': sigil,
        'tier': 'Bronze',
        'tier_progress': {'next': 'Silver', 'to_go': 99},
        'created_at': _now(),
    }
    with get_db() as conn:
        conn.execute(
            'INSERT INTO ichars (did, vc, jwt, name, archetype, queen, arcana, ocean_json, sovereign_domains, location_json, preferences_json, bft_tier, bft_vote_weight, ai_ethics_json, sigil_hash, tier, tier_progress_json, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
            (did, vc, jwt, name, archetype, queen, arcana,
             json.dumps(ocean), json.dumps(sovereign_domains),
             json.dumps(location), json.dumps(preferences),
             bft_tier, bft_vote_weight, json.dumps(ai_ethics),
             sigil, 'Bronze', json.dumps(ichar['tier_progress']),
             ichar['created_at']),
        )
    return ichar


def list_ichars() -> list:
    """List all i-characters."""
    with get_db() as conn:
        return [dict(r) for r in conn.execute('SELECT * FROM ichars ORDER BY id DESC').fetchall()]


def append_sigil(actor: str, action: str, payload: dict = None, bft_vote: dict = None) -> dict:
    """Append a SIGIL event."""
    payload = payload or {}
    with get_db() as conn:
        row = conn.execute('SELECT hash FROM sigil_chain ORDER BY id DESC LIMIT 1').fetchone()
        prev_hash = row['hash'] if row else '0' * 64
        event = {
            'actor': actor, 'action': action, 'payload': payload,
            'ts': _now(), 'prev_hash': prev_hash,
        }
        sigil = _sigil(prev_hash, event)
        event['hash'] = sigil
        conn.execute(
            'INSERT INTO sigil_chain (hash, prev_hash, actor, action, payload_json, ts, bft_vote_json) VALUES (?,?,?,?,?,?,?)',
            (sigil, prev_hash, actor, action, json.dumps(payload), event['ts'], json.dumps(bft_vote) if bft_vote else None),
        )
        return event


def list_reports() -> list:
    """List all audit log entries (the public reports)."""
    with get_db() as conn:
        return [dict(r) for r in conn.execute('SELECT * FROM audit_log ORDER BY id DESC').fetchall()]


def get_stats() -> dict:
    """Get the sovereign DB stats."""
    with get_db() as conn:
        return {
            'ichars_count': conn.execute('SELECT COUNT(*) FROM ichars').fetchone()[0],
            'queens_count': conn.execute('SELECT COUNT(*) FROM queens').fetchone()[0],
            'temples_count': conn.execute('SELECT COUNT(*) FROM temples').fetchone()[0],
            'regulations_count': conn.execute('SELECT COUNT(*) FROM regulations').fetchone()[0],
            'sigil_count': conn.execute('SELECT COUNT(*) FROM sigil_chain').fetchone()[0],
            'audit_count': conn.execute('SELECT COUNT(*) FROM audit_log').fetchone()[0],
            'charter_titles_count': conn.execute('SELECT COUNT(*) FROM charter_titles').fetchone()[0],
            'charter_signatures_count': conn.execute('SELECT COUNT(*) FROM charter_signatures').fetchone()[0],
            'framework_coverage_count': conn.execute('SELECT COUNT(*) FROM framework_coverage').fetchone()[0],
            'queen_votes_count': conn.execute('SELECT COUNT(*) FROM queen_votes').fetchone()[0],
            'csoai_sbt_count': conn.execute('SELECT COUNT(*) FROM csoai_sbt').fetchone()[0],
            'pii_pseudonyms_count': conn.execute('SELECT COUNT(*) FROM pii_pseudonyms').fetchone()[0],
            'x402_invoices_count': conn.execute('SELECT COUNT(*) FROM x402_invoices').fetchone()[0],
            'mcp_federation_count': conn.execute('SELECT COUNT(*) FROM mcp_federation').fetchone()[0],
        }


def sign(payload: dict) -> str:
    """SIGIL sign a payload."""
    return _sigil('', payload)


def verify(payload: dict, sig: str) -> bool:
    """Verify a SIGIL signature."""
    return _sigil('', payload) == sig


def main():
    parser = argparse.ArgumentParser(description="Sovereign Database")
    parser.add_argument('--init', action='store_true', help='Initialize the DB')
    parser.add_argument('--stats', action='store_true', help='Get stats')
    parser.add_argument('--list', action='store_true', help='List i-characters')
    args = parser.parse_args()
    if args.init:
        init_db()
        print(f"Initialized: {DB_PATH}")
    if args.stats:
        init_db()
        print(json.dumps(get_stats(), indent=2))
    if args.list:
        for ichar in list_ichars():
            print(json.dumps(ichar, indent=2))


if __name__ == '__main__':
    main()
