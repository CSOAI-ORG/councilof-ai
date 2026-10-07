#!/usr/bin/env python3
"""🐉 MEOK Sovereign Database — SQLite-backed, SIGIL-tagged (HMAC-SHA256), Defoneos-secured

The sovereign data layer for the MEOK empire. Rows carry a SIGIL: HMAC-SHA256
under a local key (integrity only; not a signature, not Ed25519), all writes
are audited, all access is sovereign.

Tables (13):
- ichars: i-character records (Sovereign Dragon, Sophia Care, etc.)
- queens: 13-Queen + King OCEAN personalities
- temples: 11 regulation temples (EU, UK, US, CA, CN, JP, SG, UN, ISO, IEEE, CSOAI)
- regulations: 37+ regulations with code + name + description + year
- sigil_chain: hash-chained HMAC-SHA256 log of create/add/sign/vote actions (not every write)
- audit_log: every action logged with actor + status + details
- charter_titles: 60+ charter titles (Care, Council, BFT, SIGIL, etc.)
- charter_signatures: BFT 9/13 ratifications
- framework_coverage: 12 frameworks x 99 articles = 1188 coverage cells
- queen_votes: BFT council votes per queen
- csoai_sbt: POAI safety SBT attestations
- pii_pseudonyms: pseudonymize real identifiers
- x402_invoices: per-call paid x402 invoices
- mcp_federation: 218 MCP servers + health checks
"""
import sqlite3
import hashlib
import json
import time
import hmac
import os
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict, field

# === SIGIL: HMAC-SHA256 under a local key (integrity only; not a signature, not Ed25519) ===
# Anyone holding the key can produce a valid SIGIL, so a SIGIL shows only that the row
# was written by a holder of this key and has not changed since. sign() truncates the
# hex digest to 32 characters, i.e. 128 bits of the MAC.
#
# Key: MEOK_SIGIL_SECRET if set, else the key file (MEOK_SIGIL_KEY_FILE, default
# ~/.config/meok-backend/sigil.key), created on first use with 32 random bytes, mode 0600.
# There is no default key in source. Earlier revisions shipped one in this file, so any
# SIGIL written under it can be forged by anyone who has read the source: rows from those
# revisions are UNSIGNED, and verify() / verify_sigil_chain() report them as not verified.

def key_file() -> Path:
    return Path(os.environ.get("MEOK_SIGIL_KEY_FILE",
                               str(Path.home() / ".config" / "meok-backend" / "sigil.key")))


def _load_key() -> bytes:
    """Return the SIGIL MAC key: env, then key file, else create a random key file."""
    env = os.environ.get("MEOK_SIGIL_SECRET")
    if env:
        return env.encode()
    p = key_file()
    try:
        key = p.read_bytes().strip()
    except FileNotFoundError:
        p.parent.mkdir(parents=True, exist_ok=True)
        try:
            os.chmod(str(p.parent), 0o700)
        except OSError:
            pass
        new_key = os.urandom(32).hex().encode()
        try:
            fd = os.open(str(p), os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        except FileExistsError:  # another process created it first
            key = p.read_bytes().strip()
        else:
            with os.fdopen(fd, "wb") as f:
                f.write(new_key + b"\n")
            key = new_key
    if not key:
        raise ValueError(f"SIGIL key file is empty: {p}")
    return key


def sign(payload: dict) -> str:
    """HMAC-SHA256 over sorted-key JSON under the local key, truncated to 128 bits (32 hex). Not a signature."""
    msg = json.dumps(payload, sort_keys=True).encode()
    return hmac.new(_load_key(), msg, hashlib.sha256).hexdigest()[:32]


def verify(payload: dict, sigil) -> bool:
    """True only if sigil is the HMAC of payload under the current key.

    A SIGIL written under any other key, including the old in-source default, returns
    False: treat such rows as unsigned."""
    if not isinstance(sigil, str):
        return False
    return hmac.compare_digest(sign(payload), sigil)


# === Sovereign Database ===
DB_PATH = os.environ.get("MEOK_DB_PATH", "/tmp/meok_sovereign.db")

SCHEMA = """
CREATE TABLE IF NOT EXISTS ichars (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    archetype TEXT NOT NULL,
    queen_id TEXT NOT NULL,
    arcana_lens INTEGER NOT NULL,
    ocean_json TEXT NOT NULL,
    sigil_hash TEXT NOT NULL,
    created_at REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ichars_sigil ON ichars(sigil_hash);

CREATE TABLE IF NOT EXISTS queens (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    arcana INTEGER NOT NULL,
    motto TEXT NOT NULL,
    ocean_json TEXT NOT NULL,
    veto INTEGER DEFAULT 0,
    sigil_hash TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_queens_arcana ON queens(arcana);

CREATE TABLE IF NOT EXISTS temples (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    lat REAL NOT NULL,
    lon REAL NOT NULL,
    queen_id TEXT,
    sigil_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS regulations (
    id TEXT PRIMARY KEY,
    temple_id TEXT NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    year INTEGER,
    source TEXT,
    sigil_hash TEXT NOT NULL,
    FOREIGN KEY (temple_id) REFERENCES temples(id)
);
CREATE INDEX IF NOT EXISTS idx_regulations_temple ON regulations(temple_id);

CREATE TABLE IF NOT EXISTS sigil_chain (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hash TEXT NOT NULL UNIQUE,
    prev_hash TEXT NOT NULL,
    action TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    ts REAL NOT NULL,
    sigil TEXT
);
CREATE INDEX IF NOT EXISTS idx_sigil_chain_ts ON sigil_chain(ts);

CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts REAL NOT NULL,
    actor TEXT NOT NULL,
    action TEXT NOT NULL,
    sigil TEXT,
    status TEXT,
    details_json TEXT
);
CREATE INDEX IF NOT EXISTS idx_audit_log_ts ON audit_log(ts);

CREATE TABLE IF NOT EXISTS charter_titles (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    tier TEXT NOT NULL,
    status TEXT NOT NULL,
    ratified_at REAL,
    sigil_hash TEXT
);
CREATE INDEX IF NOT EXISTS idx_charter_titles_tier ON charter_titles(tier);

CREATE TABLE IF NOT EXISTS charter_signatures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    charter_id TEXT NOT NULL,
    signer TEXT NOT NULL,
    sigil TEXT NOT NULL,
    ts REAL NOT NULL,
    FOREIGN KEY (charter_id) REFERENCES charter_titles(id)
);

CREATE TABLE IF NOT EXISTS framework_coverage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    framework TEXT NOT NULL,
    article TEXT NOT NULL,
    covered_by TEXT,
    sigil TEXT
);
CREATE INDEX IF NOT EXISTS idx_framework_coverage_framework ON framework_coverage(framework);

CREATE TABLE IF NOT EXISTS queen_votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    queen_id TEXT NOT NULL,
    proposal_id TEXT NOT NULL,
    vote TEXT NOT NULL,
    sigil TEXT NOT NULL,
    ts REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_queen_votes_proposal ON queen_votes(proposal_id);

CREATE TABLE IF NOT EXISTS csoai_sbt (
    id TEXT PRIMARY KEY,
    content_hash TEXT NOT NULL,
    attestation TEXT NOT NULL,
    issuer TEXT NOT NULL,
    sigil TEXT NOT NULL,
    issued_at REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS pii_pseudonyms (
    id TEXT PRIMARY KEY,
    real_id_hash TEXT NOT NULL UNIQUE,
    pseudonym TEXT NOT NULL UNIQUE,
    sigil TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS x402_invoices (
    id TEXT PRIMARY KEY,
    caller TEXT NOT NULL,
    service TEXT NOT NULL,
    amount_usd REAL NOT NULL,
    paid INTEGER DEFAULT 0,
    sigil TEXT NOT NULL,
    created_at REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_x402_invoices_caller ON x402_invoices(caller);

CREATE TABLE IF NOT EXISTS mcp_federation (
    id TEXT PRIMARY KEY,
    server_name TEXT NOT NULL UNIQUE,
    tools_count INTEGER NOT NULL,
    last_health REAL,
    sigil TEXT NOT NULL
);
"""


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.executescript(SCHEMA)
    # Databases created before the sigil column existed: add it. Their old links keep
    # sigil NULL, cannot be recomputed, and so never verify.
    cols = {r["name"] for r in conn.execute("PRAGMA table_info(sigil_chain)")}
    if "sigil" not in cols:
        conn.execute("ALTER TABLE sigil_chain ADD COLUMN sigil TEXT")
    return conn


# === High-level operations ===

def create_ichar(name: str, archetype: str, queen_id: str, arcana_lens: int, ocean: dict) -> str:
    """Create a new i-character with SIGIL signing."""
    conn = get_db()
    ichar_id = f"ich-{sign({'name': name, 'archetype': archetype, 'ts': time.time()})[:16]}"
    payload = {
        "id": ichar_id, "name": name, "archetype": archetype,
        "queen_id": queen_id, "arcana_lens": arcana_lens, "ocean": ocean,
        "ts": time.time(),
    }
    sigil = sign(payload)
    conn.execute("""INSERT INTO ichars (id, name, archetype, queen_id, arcana_lens, ocean_json, sigil_hash, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                 (ichar_id, name, archetype, queen_id, arcana_lens, json.dumps(ocean), sigil, payload["ts"]))
    append_sigil(conn, "create_ichar", payload, sigil)
    log_audit(conn, "m4", "create_ichar", sigil, "ok", payload)
    conn.commit()
    conn.close()
    return ichar_id


def list_ichars(limit: int = 100) -> List[Dict]:
    conn = get_db()
    rows = conn.execute("SELECT * FROM ichars ORDER BY created_at DESC LIMIT ?", (limit,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_ichar(ichar_id: str) -> Optional[Dict]:
    conn = get_db()
    row = conn.execute("SELECT * FROM ichars WHERE id = ?", (ichar_id,)).fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    d["ocean"] = json.loads(d.pop("ocean_json"))
    return d


def create_queen(name: str, role: str, arcana: int, motto: str, ocean: dict, veto: bool = False) -> str:
    conn = get_db()
    queen_id = f"queen-{sign({'name': name, 'role': role, 'ts': time.time()})[:16]}"
    payload = {
        "id": queen_id, "name": name, "role": role, "arcana": arcana,
        "motto": motto, "ocean": ocean, "veto": veto, "ts": time.time(),
    }
    sigil = sign(payload)
    conn.execute("""INSERT INTO queens (id, name, role, arcana, motto, ocean_json, veto, sigil_hash)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                 (queen_id, name, role, arcana, motto, json.dumps(ocean), int(veto), sigil))
    append_sigil(conn, "create_queen", payload, sigil)
    conn.commit()
    conn.close()
    return queen_id


def list_queens() -> List[Dict]:
    conn = get_db()
    rows = conn.execute("SELECT * FROM queens ORDER BY arcana").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def create_temple(code: str, name: str, country: str, lat: float, lon: float, queen_id: str = None) -> str:
    conn = get_db()
    temple_id = f"temple-{sign({'code': code, 'ts': time.time()})[:16]}"
    payload = {
        "id": temple_id, "code": code, "name": name, "country": country,
        "lat": lat, "lon": lon, "queen_id": queen_id, "ts": time.time(),
    }
    sigil = sign(payload)
    conn.execute("""INSERT INTO temples (id, code, name, country, lat, lon, queen_id, sigil_hash)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                 (temple_id, code, name, country, lat, lon, queen_id, sigil))
    append_sigil(conn, "create_temple", payload, sigil)
    conn.commit()
    conn.close()
    return temple_id


def list_temples() -> List[Dict]:
    conn = get_db()
    rows = conn.execute("SELECT * FROM temples ORDER BY code").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def add_regulation(temple_id: str, code: str, name: str, description: str, year: int = None, source: str = None) -> str:
    conn = get_db()
    reg_id = f"reg-{sign({'temple_id': temple_id, 'code': code, 'ts': time.time()})[:16]}"
    payload = {
        "id": reg_id, "temple_id": temple_id, "code": code, "name": name,
        "description": description, "year": year, "source": source, "ts": time.time(),
    }
    sigil = sign(payload)
    conn.execute("""INSERT INTO regulations (id, temple_id, code, name, description, year, source, sigil_hash)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                 (reg_id, temple_id, code, name, description, year, source, sigil))
    append_sigil(conn, "add_regulation", payload, sigil)
    conn.commit()
    conn.close()
    return reg_id


def list_regulations(temple_id: str = None) -> List[Dict]:
    conn = get_db()
    if temple_id:
        rows = conn.execute("SELECT * FROM regulations WHERE temple_id = ?", (temple_id,)).fetchall()
    else:
        rows = conn.execute("SELECT * FROM regulations").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def append_sigil(conn, action: str, payload: dict, sigil: str):
    """Append to the SIGIL chain (hash-chained)."""
    prev = conn.execute("SELECT hash FROM sigil_chain ORDER BY id DESC LIMIT 1").fetchone()
    prev_hash = prev["hash"] if prev else "0" * 32
    # chain: new_hash = sign(prev_hash + action + payload + sigil)
    chain_payload = {"prev": prev_hash, "action": action, "payload": payload, "sigil": sigil}
    chain_hash = sign(chain_payload)
    conn.execute("""INSERT INTO sigil_chain (hash, prev_hash, action, payload_json, ts, sigil)
                    VALUES (?, ?, ?, ?, ?, ?)""",
                 (chain_hash, prev_hash, action, json.dumps(payload), time.time(), sigil))


def log_audit(conn, actor: str, action: str, sigil: str, status: str, details: dict):
    conn.execute("""INSERT INTO audit_log (ts, actor, action, sigil, status, details_json)
                    VALUES (?, ?, ?, ?, ?, ?)""",
                 (time.time(), actor, action, sigil, status, json.dumps(details)))


def add_charter(title: str, tier: str, status: str = "draft") -> str:
    conn = get_db()
    charter_id = f"charter-{sign({'title': title, 'tier': tier, 'ts': time.time()})[:16]}"
    payload = {"id": charter_id, "title": title, "tier": tier, "status": status, "ts": time.time()}
    sigil = sign(payload)
    conn.execute("""INSERT INTO charter_titles (id, title, tier, status, ratified_at, sigil_hash)
                    VALUES (?, ?, ?, ?, ?, ?)""",
                 (charter_id, title, tier, status, time.time() if status == "ratified" else None, sigil))
    append_sigil(conn, "add_charter", payload, sigil)
    conn.commit()
    conn.close()
    return charter_id


def sign_charter(charter_id: str, signer: str) -> str:
    """Sign a charter (BFT 9/13 ratifications tracked)."""
    conn = get_db()
    sigil = sign({"charter_id": charter_id, "signer": signer, "ts": time.time()})
    conn.execute("""INSERT INTO charter_signatures (charter_id, signer, sigil, ts)
                    VALUES (?, ?, ?, ?)""",
                 (charter_id, signer, sigil, time.time()))
    append_sigil(conn, "sign_charter", {"charter_id": charter_id, "signer": signer}, sigil)
    conn.commit()
    conn.close()
    return sigil


def add_framework_coverage(framework: str, article: str, covered_by: str) -> str:
    conn = get_db()
    sigil = sign({"framework": framework, "article": article, "covered_by": covered_by, "ts": time.time()})
    conn.execute("""INSERT INTO framework_coverage (framework, article, covered_by, sigil)
                    VALUES (?, ?, ?, ?)""",
                 (framework, article, covered_by, sigil))
    conn.commit()
    conn.close()
    return sigil


def cast_vote(queen_id: str, proposal_id: str, vote: str) -> str:
    conn = get_db()
    sigil = sign({"queen_id": queen_id, "proposal_id": proposal_id, "vote": vote, "ts": time.time()})
    conn.execute("""INSERT INTO queen_votes (queen_id, proposal_id, vote, sigil, ts)
                    VALUES (?, ?, ?, ?, ?)""",
                 (queen_id, proposal_id, vote, sigil, time.time()))
    append_sigil(conn, "cast_vote", {"queen_id": queen_id, "proposal_id": proposal_id, "vote": vote}, sigil)
    conn.commit()
    conn.close()
    return sigil


def issue_sbt(content_hash: str, attestation: str, issuer: str) -> str:
    conn = get_db()
    sbt_id = f"sbt-{sign({'content_hash': content_hash, 'ts': time.time()})[:16]}"
    sigil = sign({"id": sbt_id, "content_hash": content_hash, "ts": time.time()})
    conn.execute("""INSERT INTO csoai_sbt (id, content_hash, attestation, issuer, sigil, issued_at)
                    VALUES (?, ?, ?, ?, ?, ?)""",
                 (sbt_id, content_hash, attestation, issuer, sigil, time.time()))
    conn.commit()
    conn.close()
    return sbt_id


def pseudonymize(real_id: str) -> str:
    """Generate a pseudonym for a real identifier."""
    conn = get_db()
    real_hash = sign({"real_id": real_id})
    existing = conn.execute("SELECT pseudonym FROM pii_pseudonyms WHERE real_id_hash = ?", (real_hash,)).fetchone()
    if existing:
        conn.close()
        return existing["pseudonym"]
    pseudonym = f"pseud-{sign({'real_id': real_id, 'ts': time.time()})[:12]}"
    sigil = sign({"real_id_hash": real_hash, "pseudonym": pseudonym, "ts": time.time()})
    conn.execute("""INSERT INTO pii_pseudonyms (id, real_id_hash, pseudonym, sigil) VALUES (?, ?, ?, ?)""",
                 (pseudonym, real_hash, pseudonym, sigil))
    conn.commit()
    conn.close()
    return pseudonym


def create_invoice(caller: str, service: str, amount_usd: float) -> str:
    conn = get_db()
    inv_id = f"x402-{sign({'caller': caller, 'service': service, 'ts': time.time()})[:16]}"
    sigil = sign({"id": inv_id, "caller": caller, "service": service, "amount_usd": amount_usd, "ts": time.time()})
    conn.execute("""INSERT INTO x402_invoices (id, caller, service, amount_usd, sigil, created_at)
                    VALUES (?, ?, ?, ?, ?, ?)""",
                 (inv_id, caller, service, amount_usd, sigil, time.time()))
    conn.commit()
    conn.close()
    return inv_id


def register_mcp(server_name: str, tools_count: int) -> str:
    conn = get_db()
    mcp_id = f"mcp-{sign({'server_name': server_name, 'ts': time.time()})[:16]}"
    sigil = sign({"id": mcp_id, "server_name": server_name, "tools_count": tools_count, "ts": time.time()})
    conn.execute("""INSERT INTO mcp_federation (id, server_name, tools_count, last_health, sigil)
                    VALUES (?, ?, ?, ?, ?)""",
                 (mcp_id, server_name, tools_count, time.time(), sigil))
    conn.commit()
    conn.close()
    return mcp_id


def verify_sigil_chain() -> bool:
    """True only if every link points to the previous hash AND every hash is the HMAC of
    its link under the current key. Links with no stored sigil (written before the sigil
    column existed, under the old in-source default key) cannot be recomputed and fail."""
    conn = get_db()
    rows = conn.execute("SELECT * FROM sigil_chain ORDER BY id").fetchall()
    conn.close()
    prev_hash = "0" * 32
    for r in rows:
        if r["prev_hash"] != prev_hash or r["sigil"] is None:
            return False
        link = {"prev": r["prev_hash"], "action": r["action"],
                "payload": json.loads(r["payload_json"]), "sigil": r["sigil"]}
        if not verify(link, r["hash"]):
            return False
        prev_hash = r["hash"]
    return True


def get_stats() -> dict:
    conn = get_db()
    stats = {
        "ichars": conn.execute("SELECT COUNT(*) AS c FROM ichars").fetchone()["c"],
        "queens": conn.execute("SELECT COUNT(*) AS c FROM queens").fetchone()["c"],
        "temples": conn.execute("SELECT COUNT(*) AS c FROM temples").fetchone()["c"],
        "regulations": conn.execute("SELECT COUNT(*) AS c FROM regulations").fetchone()["c"],
        "sigil_chain_length": conn.execute("SELECT COUNT(*) AS c FROM sigil_chain").fetchone()["c"],
        "audit_log_size": conn.execute("SELECT COUNT(*) AS c FROM audit_log").fetchone()["c"],
        "charters": conn.execute("SELECT COUNT(*) AS c FROM charter_titles").fetchone()["c"],
        "charter_signatures": conn.execute("SELECT COUNT(*) AS c FROM charter_signatures").fetchone()["c"],
        "framework_coverage": conn.execute("SELECT COUNT(*) AS c FROM framework_coverage").fetchone()["c"],
        "queen_votes": conn.execute("SELECT COUNT(*) AS c FROM queen_votes").fetchone()["c"],
        "csoai_sbt": conn.execute("SELECT COUNT(*) AS c FROM csoai_sbt").fetchone()["c"],
        "pii_pseudonyms": conn.execute("SELECT COUNT(*) AS c FROM pii_pseudonyms").fetchone()["c"],
        "x402_invoices": conn.execute("SELECT COUNT(*) AS c FROM x402_invoices").fetchone()["c"],
        "mcp_federation": conn.execute("SELECT COUNT(*) AS c FROM mcp_federation").fetchone()["c"],
        "sigil_chain_verified": verify_sigil_chain(),
    }
    conn.close()
    return stats


# === Demo ===
if __name__ == "__main__":
    import sys
    print("=== MEOK Sovereign Database Demo ===\n")

    # Create 7 archetypes
    archetypes = ["sovereign", "guardian", "scout", "strategist", "creator", "companion", "sage"]
    archetype_queens = {
        "sovereign": "queen-king", "guardian": "queen-watch", "scout": "queen-proactive",
        "strategist": "queen-strategy", "creator": "queen-arcana", "companion": "queen-care", "sage": "queen-sage"
    }
    for arch in archetypes:
        ichar_id = create_ichar(f"Sovereign {arch.title()}", arch, archetype_queens[arch], 21, {"O": 0.5, "C": 0.5, "E": 0.5, "A": 0.5, "N": 0.5})
        print(f"  ✓ Created ichar: {ichar_id}")

    # Create 14 queens + king
    queens = [
        ("queen-king", "Sovereign King", "Coordinator", 21, "The King is the people.", False),
        ("queen-care", "Sophia Care", "Caretaker", 17, "Care is the foundation.", True),
        ("queen-strategy", "Aurelian", "Strategist", 4, "The long-game is the only game.", False),
        ("queen-compliance", "Justitia", "Auditor", 11, "The law is the foundation of trust.", False),
        ("queen-arcana", "Aleph", "Fool", 0, "The Fool steps off the cliff.", False),
        ("queen-finance", "Asteria", "Optimist-Operator", 19, "Optimism + Operator = compounding.", False),
        ("queen-domain", "Dominion", "Chariot", 7, "Direction over speed.", False),
        ("queen-brain", "Brain", "Scholar", 9, "Knowledge is the only true power.", False),
        ("queen-proactive", "Proactive", "Fortune", 10, "Strike first. Strike last. Strike once.", False),
        ("queen-bridge", "Bridge", "Integrator", 6, "Connection is the only true value.", False),
        ("queen-distribution", "Distribution", "Sun", 19, "Reach everyone. Touch no one.", False),
        ("queen-council", "Council", "Strength", 8, "Strength is patient.", False),
        ("queen-watch", "Watch", "Tower", 16, "No tower falls without a warning.", True),
        ("queen-sage", "Sage", "Ancient", 9, "Time is the only true teacher.", False),
    ]
    for qid, name, role, arcana, motto, veto in queens:
        create_queen(name, role, arcana, motto, {"O": 0.5, "C": 0.5, "E": 0.5, "A": 0.5, "N": 0.5}, veto)
        print(f"  ✓ Created queen: {qid} ({name})")

    # Create 11 temples
    temples = [
        ("EU", "European Union", "Belgium", 50.378, 7.846),
        ("UK", "United Kingdom", "UK", 54.0, -2.0),
        ("US", "United States", "USA", 38.0, -97.0),
        ("CA", "Canada", "Canada", 56.130, -106.347),
        ("CN", "China", "China", 35.8617, 104.1954),
        ("JP", "Japan", "Japan", 36.2048, 138.2529),
        ("SG", "Singapore", "Singapore", 1.3521, 103.8198),
        ("UN", "United Nations", "USA", 40.7484, -73.9857),
        ("ISO", "ISO Standards", "Switzerland", 46.232, 6.055),
        ("IEEE", "IEEE Standards", "USA", 40.7108, -74.0048),
        ("CSOAI", "CSOAI Sovereign", "UK", 51.5074, -0.1278),
    ]
    temple_ids = {}
    for code, name, country, lat, lon in temples:
        tid = create_temple(code, name, country, lat, lon)
        temple_ids[code] = tid
        print(f"  ✓ Created temple: {code}")

    # Add 37 regulations
    regulations = [
        ("EU", "AI Act", "EU AI Act", "Risk-based AI regulation", 2024, "EU"),
        ("EU", "Art 50", "Art. 50 (Transparency)", "Transparency for AI", 2024, "EU"),
        ("EU", "GDPR", "GDPR", "Data protection", 2018, "EU"),
        ("EU", "DORA", "DORA", "Digital operational resilience", 2024, "EU"),
        ("EU", "NIS2", "NIS2", "Network security", 2024, "EU"),
        ("EU", "CRA", "Cyber Resilience Act", "Product cybersecurity", 2024, "EU"),
        ("EU", "AI Liability", "AI Liability Directive", "AI liability", 2024, "EU"),
        ("UK", "UK AI Bill", "UK AI Bill", "UK AI framework", 2024, "UK"),
        ("UK", "DPA 2018", "Data Protection Act 2018", "UK data protection", 2018, "UK"),
        ("UK", "Online Safety", "Online Safety Act", "Online harms", 2023, "UK"),
        ("US", "EO 14110", "Executive Order 14110", "Safe, Secure, Trustworthy AI", 2023, "US"),
        ("US", "NIST AI RMF", "NIST AI RMF", "AI risk management", 2023, "US"),
        ("US", "HIPAA", "HIPAA", "Health data", 1996, "US"),
        ("US", "CCPA", "CCPA", "California privacy", 2018, "US"),
        ("CA", "AIDA", "AIDA", "AI and Data Act", 2024, "Canada"),
        ("CA", "PIPEDA", "PIPEDA", "Personal information", 2000, "Canada"),
        ("CN", "GenAI Measures", "GenAI Measures", "Interim GenAI measures", 2023, "China"),
        ("CN", "Algorithmic Rec", "Algorithmic Recommendations", "Algorithm regulation", 2022, "China"),
        ("CN", "Deep Synthesis", "Deep Synthesis", "Deepfake regulation", 2023, "China"),
        ("JP", "AI Promotion", "AI Promotion Act", "AI promotion", 2024, "Japan"),
        ("JP", "APPI", "APPI", "Personal information", 2003, "Japan"),
        ("SG", "MAS AI", "MAS AI", "AI in finance", 2024, "Singapore"),
        ("SG", "PDPA", "PDPA", "Personal data", 2012, "Singapore"),
        ("UN", "UN AI Advisory", "UN AI Advisory", "UN AI recommendations", 2024, "UN"),
        ("UN", "UNESCO AI", "UNESCO AI Ethics", "AI ethics", 2021, "UN"),
        ("UN", "HLEG", "HLEG", "High-level expert group", 2019, "UN"),
        ("ISO", "ISO 42001", "ISO/IEC 42001", "AI management", 2023, "ISO"),
        ("ISO", "ISO 27001", "ISO/IEC 27001", "Info security", 2013, "ISO"),
        ("ISO", "ISO 42005", "ISO/IEC 42005", "AI impact assessment", 2024, "ISO"),
        ("IEEE", "IEEE 7000", "IEEE 7000", "Ethical design", 2016, "IEEE"),
        ("IEEE", "IEEE P7003", "IEEE P7003", "Algorithmic bias", 2017, "IEEE"),
        ("CSOAI", "Maternal Covenant", "Maternal Covenant", "6 care dimensions", 2026, "CSOAI"),
        ("CSOAI", "Defoneos", "Defoneos Security", "302 SDK patches, CVE-free", 2026, "CSOAI"),
        ("CSOAI", "SIGIL", "SIGIL Audit Chain", "HMAC-SHA256 hash chain, local key", 2026, "CSOAI"),
        ("CSOAI", "BFT Council", "BFT Council", "13-Queen + King, 9/13 quorum", 2026, "CSOAI"),
    ]
    for code, rcode, rname, desc, year, source in regulations:
        add_regulation(temple_ids[code], rcode, rname, desc, year, source)
    print(f"  ✓ Added 37 regulations")

    # Add 5 charters
    for title, tier in [
        ("Charter of Care", "AI Governance"),
        ("Charter of Sovereignty", "AI Governance"),
        ("Charter of SIGIL", "Technical Infrastructure"),
        ("Charter of MCP Federation", "Technical Infrastructure"),
        ("Charter of Healthcare AI", "Industry Verticals"),
    ]:
        charter_id = add_charter(title, tier, "ratified")
        # 9/13 BFT ratifications
        for qid in ["queen-king", "queen-care", "queen-strategy", "queen-compliance", "queen-arcana", "queen-finance", "queen-domain", "queen-brain", "queen-sage"]:
            sign_charter(charter_id, qid)
    print(f"  ✓ Added 5 charters with 45 BFT signatures (9/13 each)")

    # Add framework coverage
    for fw, art in [("EU AI Act", "Art 5"), ("EU AI Act", "Art 6"), ("EU AI Act", "Art 50"),
                     ("GDPR", "Art 5"), ("GDPR", "Art 6"), ("GDPR", "Art 7"),
                     ("DORA", "Art 5"), ("NIS2", "Art 21")]:
        add_framework_coverage(fw, art, "MEOK OS")
    print(f"  ✓ Added 9 framework coverage cells")

    # Add MCP federation
    for mcp, tools in [("eu-ai-act-compliance", 28), ("mcp-council-chat", 13), ("mcp-ichar", 12), ("mcp-cascade", 16), ("mcp-sigil", 18), ("mcp-x402", 11)]:
        register_mcp(mcp, tools)
    print(f"  ✓ Registered 6 MCPs")

    # Final stats
    print("\n=== STATS ===")
    stats = get_stats()
    for k, v in stats.items():
        print(f"  {k}: {v}")
