#!/usr/bin/env python3.11
"""
witness_store.py — the Sovereign Witness store (L0.8 of the 8-layer physical substrate).

The Witness is the public audit trail for the substrate. Verifiable in any browser.

Tables:
- sigil_chain (id, hash, prev_hash, actor, action, payload_json, ts, bft_vote_json)
- bft_proposals (id, title, proposer, action_json, status, votes_for, votes_against, votes_abstain, quorum, approved, created_at, decided_at)
- bft_votes (id, proposal_id, voter, choice, sigil, ts)
- audit_log (id, ts, actor, actor_type, action, sigil, status, details_json)
- oscal_components (id, sha256, name, category, sigil, description)
- crosswalk_cells (id, framework, article, covered_by, sigil)
- watchdogs (id, lat, lon, severity, type, ts, sigil)
"""
import os
import json
import hashlib
import sqlite3
import datetime
from pathlib import Path
from contextlib import contextmanager

DB_PATH = Path('/Users/nicholas/clawd/meok-backend/witness.db')
SCHEMA = """
CREATE TABLE IF NOT EXISTS sigil_chain (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hash TEXT NOT NULL,
    prev_hash TEXT NOT NULL,
    actor TEXT NOT NULL,
    action TEXT NOT NULL,
    payload_json TEXT,
    ts TEXT NOT NULL,
    bft_vote_json TEXT
);

CREATE TABLE IF NOT EXISTS bft_proposals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    proposer TEXT NOT NULL,
    action_json TEXT,
    status TEXT NOT NULL,
    votes_for INTEGER DEFAULT 0,
    votes_against INTEGER DEFAULT 0,
    votes_abstain INTEGER DEFAULT 0,
    quorum INTEGER DEFAULT 22,
    approved INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    decided_at TEXT
);

CREATE TABLE IF NOT EXISTS bft_votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    proposal_id INTEGER NOT NULL,
    voter TEXT NOT NULL,
    choice TEXT NOT NULL,
    sigil TEXT,
    ts TEXT NOT NULL,
    FOREIGN KEY(proposal_id) REFERENCES bft_proposals(id)
);

CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts TEXT NOT NULL,
    actor TEXT NOT NULL,
    actor_type TEXT NOT NULL,
    action TEXT NOT NULL,
    sigil TEXT,
    status TEXT,
    details_json TEXT
);

CREATE TABLE IF NOT EXISTS oscal_components (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sha256 TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    sigil TEXT,
    description TEXT
);

CREATE TABLE IF NOT EXISTS crosswalk_cells (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    framework TEXT NOT NULL,
    article TEXT NOT NULL,
    covered_by TEXT,
    sigil TEXT
);

CREATE TABLE IF NOT EXISTS watchdogs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lat REAL NOT NULL,
    lon REAL NOT NULL,
    severity TEXT NOT NULL,
    type TEXT NOT NULL,
    ts TEXT NOT NULL,
    sigil TEXT
);

CREATE INDEX IF NOT EXISTS idx_sigil_hash ON sigil_chain(hash);
CREATE INDEX IF NOT EXISTS idx_audit_ts ON audit_log(ts);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_log(actor);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_bft_status ON bft_proposals(status);
CREATE INDEX IF NOT EXISTS idx_crosswalk_framework ON crosswalk_cells(framework);
"""


def _now() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def _sigil(prev: str, payload: dict) -> str:
    h = hashlib.sha256()
    h.update(prev.encode())
    h.update(json.dumps(payload, sort_keys=True).encode())
    return h.hexdigest()


@contextmanager
def get_db(db_path: Path = None):
    """Context manager for DB connection."""
    path = db_path or DB_PATH
    conn = sqlite3.connect(str(path))
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db(db_path: Path = None) -> None:
    """Initialize the database schema."""
    path = db_path or DB_PATH
    path.parent.mkdir(parents=True, exist_ok=True)
    with get_db(path) as conn:
        conn.executescript(SCHEMA)


class SovereignWitness:
    """The Sovereign Witness store."""

    def __init__(self, db_path: Path = None):
        self.db_path = db_path or DB_PATH
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        init_db(self.db_path)

    def append_sigil(self, actor: str, action: str, payload: dict = None, bft_vote: dict = None) -> dict:
        """Append a SIGIL event to the chain."""
        payload = payload or {}
        with get_db(self.db_path) as conn:
            row = conn.execute('SELECT hash FROM sigil_chain ORDER BY id DESC LIMIT 1').fetchone()
            prev_hash = row['hash'] if row else '0' * 64
            event = {
                'actor': actor, 'action': action,
                'payload': payload, 'ts': _now(), 'prev_hash': prev_hash,
            }
            sigil = _sigil(prev_hash, event)
            event['hash'] = sigil
            conn.execute(
                'INSERT INTO sigil_chain (hash, prev_hash, actor, action, payload_json, ts, bft_vote_json) VALUES (?,?,?,?,?,?,?)',
                (sigil, prev_hash, actor, action, json.dumps(payload), event['ts'], json.dumps(bft_vote) if bft_vote else None),
            )
            return event

    def audit(self, actor: str, actor_type: str, action: str, status: str = 'success', details: dict = None) -> dict:
        """Add an audit log entry. Returns the entry with sigil."""
        details = details or {}
        event = {
            'ts': _now(), 'actor': actor, 'actor_type': actor_type, 'action': action,
            'status': status, 'details': details,
        }
        sigil = _sigil('audit', event)
        event['sigil'] = sigil
        with get_db(self.db_path) as conn:
            conn.execute(
                'INSERT INTO audit_log (ts, actor, actor_type, action, sigil, status, details_json) VALUES (?,?,?,?,?,?,?)',
                (event['ts'], actor, actor_type, action, sigil, status, json.dumps(details)),
            )
            return event

    def propose_bft(self, title: str, proposer: str, action: dict) -> dict:
        """Submit a BFT proposal."""
        event = {
            'title': title, 'proposer': proposer, 'action': action,
            'status': 'pending', 'created_at': _now(),
            'votes_for': 0, 'votes_against': 0, 'votes_abstain': 0,
            'quorum': 22, 'approved': False,
        }
        with get_db(self.db_path) as conn:
            cur = conn.execute(
                'INSERT INTO bft_proposals (title, proposer, action_json, status, quorum, created_at) VALUES (?,?,?,?,?,?)',
                (title, proposer, json.dumps(action), 'pending', 22, event['created_at']),
            )
            event['id'] = cur.lastrowid
            return event

    def vote_bft(self, proposal_id: int, voter: str, choice: str) -> dict:
        """Cast a BFT vote. choice: 'for', 'against', 'abstain'."""
        sigil = _sigil('vote', {'proposal_id': proposal_id, 'voter': voter, 'choice': choice})
        with get_db(self.db_path) as conn:
            conn.execute(
                'INSERT INTO bft_votes (proposal_id, voter, choice, sigil, ts) VALUES (?,?,?,?,?)',
                (proposal_id, voter, choice, sigil, _now()),
            )
            # Update tallies
            col = {'for': 'votes_for', 'against': 'votes_against', 'abstain': 'votes_abstain'}[choice]
            conn.execute(f'UPDATE bft_proposals SET {col} = {col} + 1 WHERE id = ?', (proposal_id,))
            # Check if approved
            row = conn.execute('SELECT * FROM bft_proposals WHERE id = ?', (proposal_id,)).fetchone()
            if row['votes_for'] >= row['quorum'] and row['status'] == 'pending':
                conn.execute("UPDATE bft_proposals SET status = 'approved', approved = 1, decided_at = ? WHERE id = ?",
                             (_now(), proposal_id))
            elif row['votes_for'] + row['votes_against'] >= 33 and row['status'] == 'pending':
                conn.execute("UPDATE bft_proposals SET status = 'rejected', decided_at = ? WHERE id = ?",
                             (_now(), proposal_id))
            return {'proposal_id': proposal_id, 'voter': voter, 'choice': choice, 'sigil': sigil}

    def log_watchdog(self, lat: float, lon: float, severity: str, type_: str) -> dict:
        """Log a watchdog report."""
        sigil = _sigil('watchdog', {'lat': lat, 'lon': lon, 'severity': severity, 'type': type_})
        with get_db(self.db_path) as conn:
            conn.execute(
                'INSERT INTO watchdogs (lat, lon, severity, type, ts, sigil) VALUES (?,?,?,?,?,?)',
                (lat, lon, severity, type_, _now(), sigil),
            )
            return {'lat': lat, 'lon': lon, 'severity': severity, 'type': type_, 'sigil': sigil}

    def register_oscal(self, sha256: str, name: str, category: str, description: str = '') -> dict:
        """Register an OSCAL component."""
        sigil = _sigil('oscal', {'sha256': sha256, 'name': name})
        with get_db(self.db_path) as conn:
            conn.execute(
                'INSERT INTO oscal_components (sha256, name, category, sigil, description) VALUES (?,?,?,?,?)',
                (sha256, name, category, sigil, description),
            )
            return {'sha256': sha256, 'name': name, 'sigil': sigil}

    def register_crosswalk(self, framework: str, article: str, covered_by: str) -> dict:
        """Register a crosswalk cell."""
        sigil = _sigil('crosswalk', {'framework': framework, 'article': article})
        with get_db(self.db_path) as conn:
            conn.execute(
                'INSERT INTO crosswalk_cells (framework, article, covered_by, sigil) VALUES (?,?,?,?)',
                (framework, article, covered_by, sigil),
            )
            return {'framework': framework, 'article': article, 'sigil': sigil}

    def recent_sigil(self, limit: int = 100) -> list:
        """Get the most recent SIGIL events."""
        with get_db(self.db_path) as conn:
            rows = conn.execute('SELECT * FROM sigil_chain ORDER BY id DESC LIMIT ?', (limit,)).fetchall()
            return [dict(r) for r in rows]

    def verify_sigil(self, hash_: str) -> dict:
        """Verify a SIGIL event by its hash."""
        with get_db(self.db_path) as conn:
            row = conn.execute('SELECT * FROM sigil_chain WHERE hash = ?', (hash_,)).fetchone()
            if row:
                return {'verified': True, 'event': dict(row)}
            return {'verified': False, 'hash': hash_}

    def recent_audit(self, limit: int = 1000, actor_type: str = None, action: str = None) -> list:
        """Get recent audit log entries, with optional filters."""
        query = 'SELECT * FROM audit_log WHERE 1=1'
        params = []
        if actor_type:
            query += ' AND actor_type = ?'
            params.append(actor_type)
        if action:
            query += ' AND action = ?'
            params.append(action)
        query += ' ORDER BY id DESC LIMIT ?'
        params.append(limit)
        with get_db(self.db_path) as conn:
            return [dict(r) for r in conn.execute(query, params).fetchall()]

    def bft_proposals(self, limit: int = 50) -> list:
        """Get recent BFT proposals."""
        with get_db(self.db_path) as conn:
            return [dict(r) for r in conn.execute('SELECT * FROM bft_proposals ORDER BY id DESC LIMIT ?', (limit,)).fetchall()]

    def oscal_components(self) -> list:
        """Get all OSCAL components."""
        with get_db(self.db_path) as conn:
            return [dict(r) for r in conn.execute('SELECT * FROM oscal_components').fetchall()]

    def crosswalk_cells(self, framework: str = None) -> list:
        """Get all crosswalk cells, optionally filtered by framework."""
        with get_db(self.db_path) as conn:
            if framework:
                return [dict(r) for r in conn.execute('SELECT * FROM crosswalk_cells WHERE framework = ?', (framework,)).fetchall()]
            return [dict(r) for r in conn.execute('SELECT * FROM crosswalk_cells').fetchall()]

    def watchdogs(self, limit: int = 100) -> list:
        """Get recent watchdog reports."""
        with get_db(self.db_path) as conn:
            return [dict(r) for r in conn.execute('SELECT * FROM watchdogs ORDER BY id DESC LIMIT ?', (limit,)).fetchall()]

    def stats(self) -> dict:
        """Get the Witness stats."""
        with get_db(self.db_path) as conn:
            return {
                'sigil_count': conn.execute('SELECT COUNT(*) FROM sigil_chain').fetchone()[0],
                'audit_count': conn.execute('SELECT COUNT(*) FROM audit_log').fetchone()[0],
                'bft_proposal_count': conn.execute('SELECT COUNT(*) FROM bft_proposals').fetchone()[0],
                'oscal_component_count': conn.execute('SELECT COUNT(*) FROM oscal_components').fetchone()[0],
                'crosswalk_cell_count': conn.execute('SELECT COUNT(*) FROM crosswalk_cells').fetchone()[0],
                'watchdog_count': conn.execute('SELECT COUNT(*) FROM watchdogs').fetchone()[0],
                'db_path': str(self.db_path),
            }


if __name__ == '__main__':
    # Demo
    w = SovereignWitness()
    print('Witness stats:', json.dumps(w.stats(), indent=2))
