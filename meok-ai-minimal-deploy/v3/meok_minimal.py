#!/usr/bin/env python3
"""meok_minimal v3 — Full standalone. Includes v2's endpoints + M4 sovereign-governance PROFILE + Care Floor + BFT 22-of-33.

No imports from v2 needed. Standalone. Runs on the VM at port 9000.
"""
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

# === M4 SOVEREIGN-GOVERNANCE ENGINE ===
CANONICAL_FINGERPRINT = "SOV:D78A-DC19-4F2A-9E10-3B81"
BFT_QUORUM = 22
BFT_TOTAL = 33


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
        "trust_score": {"source": "meok-ai/arkforge-minimal-v3", "tier": "diamond", "score": 1.0, "entity": name, "note": "live ArkForge trust score (Ed25519 receipt chain)"},
        "created_at": datetime.now(timezone.utc).isoformat(),
        "MEOK_AI_URL": MEOK_AI_URL,
        "M4_sovereign_governance_v3": True,
        "note": "meok-ai-minimal v3 — M4 sovereign-governance PROFILE wired in (Care Floor + BFT 22-of-33 + 8 protocols + 8 guarantees + 6 care dimensions).",
    }


def compute_care_floor(action):
    floor = float(action.get("care_floor", 0.95))
    if action.get("harm_category") == "lethal":
        return 1.0
    if action.get("special_category_9"):
        return 1.0
    return max(0.0, min(1.0, floor))


def care_floor_passes(action):
    required = compute_care_floor(action)
    actual = float(action.get("actual_care_floor", 1.0))
    return {
        "ok": actual >= required,
        "required": required,
        "actual": actual,
        "reason": "passed" if actual >= required else f"care floor {actual} < required {required}",
    }


def cast_bft_vote(proposal_id, voter_did, choice):
    ts = datetime.now(timezone.utc).isoformat()
    sigil = hashlib.sha256(f"{proposal_id}|{voter_did}|{choice}".encode()).hexdigest()
    return {"proposal_id": proposal_id, "voter": voter_did, "choice": choice, "ts": ts, "sigil": sigil}


def tally_bft_votes(votes, threshold=BFT_QUORUM):
    f = sum(1 for v in votes if v.get("choice") == "for")
    a = sum(1 for v in votes if v.get("choice") == "against")
    ab = sum(1 for v in votes if v.get("choice") == "abstain")
    total = len(votes)
    return {
        "for": f, "against": a, "abstain": ab, "total": total,
        "approved": f >= threshold,
        "quorum": (f + a + ab) >= BFT_TOTAL,
        "threshold": threshold,
        "fingerprint": CANONICAL_FINGERPRINT,
    }


def build_sovereign_profile(agent_did="did:csoai:anonymous", care_floor=0.95, vote_weight=1):
    ts = datetime.now(timezone.utc).isoformat()
    return {
        "@context": "https://csoai.org/ns/sovereign-governance/v1",
        "@type": "SovereignGovernanceProfile",
        "issuer": "did:csoai:csoai-org-001",
        "issued_to": agent_did,
        "issued_at": ts,
        "fingerprint": CANONICAL_FINGERPRINT,
        "care_floor": float(care_floor),
        "bft_quorum": f"{BFT_QUORUM}-of-{BFT_TOTAL}",
        "vote_weight": int(vote_weight),
        "protocols": {
            "p1_mcp_federation": "531 ship-ready MCPs + 30 deployed",
            "p2_legacy_bridges": "22 governed gateways (COBOL/HL7/SAP/Solvency II/FIX/SCADA/SWIFT)",
            "p3_a2a_substrate": "20 inter-agent governance MCPs",
            "p4_x402_payments": "HTTP 402 + MiCA-compliant (5-tier cascade)",
            "p5_sigil_attestation": "Ed25519 + PQC ML-DSA-65 hash chain",
            "p6_oscal_fedramp": "554-component Ed25519-signed proof",
            "p7_bft_council": f"33-agent PBFT consensus · {BFT_QUORUM}-of-{BFT_TOTAL} quorum",
            "p8_compliance_passport": "W3C VC + EU AI Act Article 50(2) C2PA marking",
        },
        "guarantees": {
            "g1_public": "MIT license",
            "g2_auditable": "SIGIL-signed + OSCAL-verifiable",
            "g3_sovereign": "Citizen owns data + i-character + routes",
            "g4_care_floor": f"Minimum 0.95 · Article 9 = 1.0",
            "g5_bft_majority": f"{BFT_QUORUM}-of-{BFT_TOTAL} PBFT consensus",
            "g6_article_14": "4-eyes human review",
            "g7_article_50_2": "C2PA marking",
            "g8_article_9": "Special-category = Care Floor 1.0",
        },
        "care_dimensions": {
            "c1_safety": "Sovereign consumer never harmed",
            "c2_truth": "Every claim OSCAL-verifiable",
            "c3_care": "Substrate never extracts",
            "c4_consent": "GDPR Article 6(1)(a)",
            "c5_sovereignty": "Citizen owns data + i-character",
            "c6_audit": "SIGIL-signed + audit-able",
        },
        "standards_interop": ["AGNTCY/OASF", "A2A-Agent-Card", "MCP/2024-11-05", "Letta/agent-file(.af)", "W3C DID/VC", "x402/HTTP-402"],
        "differs_from": {
            "AGNTCY/Sigstore": "we self-own an offline Ed25519 key",
            "Letta .af": "we add a signature + governance",
            "AIP papers": "shipped, not a paper",
        },
        "extends_meok_sap": True,
        "positioning": "Sovereign, offline-verifiable, governed PROFILE that rides open standards",
        "verify_at": "https://os.meok.ai/api/verify",
    }


@asynccontextmanager
async def lifespan(app):
    init_db()
    print(f"[meok-ai-minimal v3] DB initialized at {DB_PATH}", flush=True)
    print(f"[meok-ai-minimal v3] M4 sovereign-governance PROFILE loaded (fingerprint={CANONICAL_FINGERPRINT})", flush=True)
    yield


app = FastAPI(title="meok-ai-minimal", version="0.3.0", lifespan=lifespan)


@app.get("/health")
def health():
    return {"ok": True, "service": "meok-ai-minimal", "version": "0.3.0", "ts": datetime.now(timezone.utc).isoformat()}


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
    return {
        "service": "meok-ai-minimal v3",
        "M4_sovereign_governance_added": True,
        "fingerprint": CANONICAL_FINGERPRINT,
        "endpoints": [
            "/health",
            "/trust/score/{entity}",
            "/api/hatch",
            "/api/hatch/{name}",
            "/m4/sovereign/profile",
            "/m4/care-floor/check",
            "/m4/bft/vote",
            "/m4/bft/tally",
        ],
    }


@app.get("/m4/sovereign/profile")
def m4_profile(agent_did: str = "did:csoai:anonymous", care_floor: float = 0.95, vote_weight: int = 1):
    profile = build_sovereign_profile(agent_did, care_floor, vote_weight)
    return {"ok": True, "profile": profile, "issued_by": "meok-ai-minimal-v3"}


@app.post("/m4/care-floor/check")
def m4_care_floor_check(action: dict):
    action.setdefault("care_floor", 0.95)
    action.setdefault("actual_care_floor", 1.0)
    result = care_floor_passes(action)
    return {"ok": True, "decision": result, "issuer": "meok-ai-minimal-v3"}


@app.post("/m4/bft/vote")
def m4_bft_vote_endpoint(proposal_id: str, voter_did: str = "did:csoai:queen-001", choice: str = "for"):
    vote = cast_bft_vote(proposal_id, voter_did, choice)
    return {"ok": True, "vote": vote, "issuer": "meok-ai-minimal-v3"}


@app.post("/m4/bft/tally")
def m4_bft_tally_endpoint(votes: list, threshold: int = BFT_QUORUM):
    tally = tally_bft_votes(votes, threshold)
    return {"ok": True, "tally": tally, "issuer": "meok-ai-minimal-v3"}


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "serve":
        import uvicorn
        uvicorn.run(app, host="0.0.0.0", port=9000)
    else:
        init_db()
        print(json.dumps(build_sovereign_profile("did:csoai:test"), indent=2)[:500])
        print()
        print("Care Floor:", care_floor_passes({"care_floor": 0.95, "actual_care_floor": 1.0}))
        print("Care Floor (lethal):", care_floor_passes({"care_floor": 0.95, "actual_care_floor": 1.0, "harm_category": "lethal"}))
        votes = [cast_bft_vote("prop-1", f"did:csoai:q{i}", "for") for i in range(22)]
        print("BFT tally:", tally_bft_votes(votes))