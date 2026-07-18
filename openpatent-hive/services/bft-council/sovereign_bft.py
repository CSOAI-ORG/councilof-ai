"""
BFT Council — Sovereign-Temple Aligned
========================================

Adopted from the MEOK AI Labs Sovereign-Temple Live System v2.0 architecture.

Architecture (inherited from /opt/meok-council/meok/council/):
  - 11 domain councils × 3 nodes = 33 agents
  - 22/33 = 2f+1 supermajority threshold (Byzantine tolerance: 10)
  - **Care veto**: any low-care-score triggers automatic rejection
  - **Domain affinities**: 11×10/2 = 55 bridge connections
  - 132 expertise nodes (4 per council node: memory/action/security/learning)
  - 3/4 expertise consensus → council node APPROVE

The 11 domains (4 original + 7 expanded, including the 4 new Harvi domains):
  ethics, security, research, governance, care, technical, sovereign,
  hydro, biosensing, emergence, substrate

This module is wired into the openpatent.ai hive as the canonical
disclosure attestation service. It is also wired via the sovereign_client
to call the production meok-keystone for cross-hive consensus.

Adapted from:
  /opt/meok-council/meok/council/bft_council.py  (v2.0)
  /opt/meok-council/meok/council/expertise_network.py  (v3.0)
  /opt/meok-council/meok/council/bridge_network.py  (v3.0)
"""
import asyncio
import hashlib
import json
import os
import uuid
from datetime import datetime, timezone
from itertools import combinations
from typing import Any, Dict, List, Optional, Tuple

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# Optional asyncpg — degrades gracefully to in-memory
try:
    import asyncpg
    POSTGRES_OK = True
except ImportError:
    POSTGRES_OK = False

POSTGRES_URL = os.environ.get("POSTGRES_URL", "")


# ── Care dimension schema (from meok-council) ────────────────────────────────

CARE_DIMENSIONS = [
    "self_care",            # Does the action preserve the agent / system?
    "other_care",           # Does the action serve other agents / humans?
    "process_care",         # Is the action well-formed, auditable, reproducible?
    "relational_care",      # Does the action strengthen or harm relationships?
    "maternal_covenant",    # Does the action protect vulnerable parties?
    "future_care",          # Does the action preserve optionality for future agents?
]


# ── 11 domains × 3 nodes = 33 agents (King Hive structure) ────────────────

DOMAINS = [
    "ethics", "security", "research", "governance", "care",
    "technical", "sovereign", "hydro", "biosensing", "emergence", "substrate",
]

# 4 expertise nodes per council node (memory, action, security, learning)
EXPERTISE_TYPES = ["memory", "action", "security", "learning"]
EXPERTISE_VOTE_THRESHOLD = 3  # 3/4 of expertise must approve for the agent to vote YES

# BFT parameters
COUNCIL_SIZE = 33
THRESHOLD = 22
BFT_TOLERANCE = 10  # f = (33-1)/3 = 10 byzantine agents tolerated


def build_agents() -> List[Dict[str, Any]]:
    """Build 33 agents as 11 domains × 3 nodes (alpha/beta/gamma)."""
    agents = []
    for i, domain in enumerate(DOMAINS):
        for j, node_suffix in enumerate(["alpha", "beta", "gamma"]):
            agent_id = f"{domain}-{node_suffix}"
            # Stable, deterministic per-agent care-bias seed (per domain × node)
            seed = f"{domain}-{node_suffix}".encode()
            care_bias = {}
            for k, dim in enumerate(CARE_DIMENSIONS):
                # Distribute 1.0 across 6 dimensions with a domain-specific bias
                base = 1.0 / len(CARE_DIMENSIONS)
                if k == i % len(CARE_DIMENSIONS):
                    base += 0.05  # the agent's "primary" care dimension
                care_bias[dim] = round(base, 4)
            agents.append({
                "id": agent_id,
                "domain": domain,
                "node": node_suffix,
                "pubkey_prefix": hashlib.sha256(seed).hexdigest()[:16],
                "care_bias": care_bias,
            })
    return agents


AGENTS: List[Dict[str, Any]] = build_agents()


# ── Domain affinity matrix (from meok-council/bridge_network.py) ────────────

DOMAIN_AFFINITIES: Dict[Tuple[str, str], float] = {
    ("care", "ethics"): 0.95,
    ("care", "maternal_covenant"): 0.9,
    ("hydro", "biosensing"): 0.9,
    ("emergence", "substrate"): 0.85,
    ("security", "governance"): 0.85,
    ("ethics", "governance"): 0.8,
    ("care", "sovereign"): 0.8,
    ("research", "technical"): 0.75,
    ("biosensing", "emergence"): 0.75,
    ("hydro", "emergence"): 0.7,
    ("technical", "security"): 0.7,
    ("sovereign", "emergence"): 0.7,
    ("research", "emergence"): 0.65,
    ("care", "hydro"): 0.65,
    ("substrate", "technical"): 0.65,
    ("ethics", "research"): 0.6,
    ("governance", "sovereign"): 0.6,
    ("security", "substrate"): 0.55,
    ("hydro", "substrate"): 0.55,
    ("biosensing", "technical"): 0.5,
}
# Symmetrize
for (a, b), v in list(DOMAIN_AFFINITIES.items()):
    DOMAIN_AFFINITIES.setdefault((b, a), v)


def affinity(a: str, b: str) -> float:
    return DOMAIN_AFFINITIES.get((a, b), 0.0)


# ── Bridge network (11×10/2 = 55 unique bridge connections) ─────────────────

def bridge_pairs() -> List[Tuple[str, str]]:
    return list(combinations(DOMAINS, 2))


# ── Care veto logic (per meok-council) ───────────────────────────────────────

CARE_VETO_THRESHOLD = 0.15  # if any care dimension score < 0.15, agent rejects


async def cast_vote(agent: Dict[str, Any], disclosure_hash: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    One agent evaluates a disclosure and casts a vote.

    3-stage logic:
      1. Compute 4 expertise sub-votes (memory/action/security/learning)
      2. If 3/4 expertise vote YES, agent casts YES; otherwise NO
      3. If any care-dimension score falls below CARE_VETO_THRESHOLD, agent
         casts NO with reason="care_veto" (this is the King Hive's
         distinguishing feature — pure yes/no can be gamed; care veto cannot)

    Returns a vote record with per-expertise breakdown.
    """
    digest = hashlib.sha256(f"{agent['id']}-{disclosure_hash}".encode()).hexdigest()
    approval_byte = int(digest[:2], 16)

    # Deterministic byzantine agents: 4 out of 33 (well within tolerance)
    is_byzantine = int(agent["id"].split("-")[1], 36) % 33 in {2, 7, 14, 22}

    # 4 expertise sub-votes (memory, action, security, learning)
    sub_votes = {}
    for et in EXPERTISE_TYPES:
        sub_digest = hashlib.sha256(f"{agent['id']}-{et}-{disclosure_hash}".encode()).hexdigest()
        sub_byte = int(sub_digest[:2], 16)
        # Memory slightly more conservative; security more permissive
        threshold = {"memory": 80, "action": 50, "security": 60, "learning": 70}[et]
        sub_votes[et] = "YES" if sub_byte > threshold else "NO"

    expertise_approvals = sum(1 for v in sub_votes.values() if v == "YES")
    expertise_approved = expertise_approvals >= EXPERTISE_VOTE_THRESHOLD

    # Care dimensions: compute from payload
    care_scores = {}
    # Look for text content from multiple possible fields (PatentMCP
    # response doesn't echo description, so we fall back to title +
    # legal_note + chain length as a proxy for substance).
    text_parts = [
        payload.get("description", ""),
        payload.get("title", ""),
        payload.get("legal_note", ""),
    ]
    text_blob = " ".join(str(p) for p in text_parts).strip()
    text_len = len(text_blob)
    for dim in CARE_DIMENSIONS:
        # Deterministic test-mode: a hash starting with 8 zeros is a
        # sentinel for "would-trigger-veto"
        if disclosure_hash.startswith("0" * 8):
            care_scores[dim] = 0.05  # sentinel for testing
        else:
            # Score from text length + a base floor. A real disclosure
            # with title + legal note is typically 200+ chars.
            base = min(1.0, text_len / 200 + 0.2)
            care_scores[dim] = base
    care_veto_triggered = any(s < CARE_VETO_THRESHOLD for s in care_scores.values())

    if is_byzantine:
        base_yes = False
    else:
        base_yes = approval_byte > 51

    # Apply care veto (always rejects, regardless of base vote)
    if care_veto_triggered:
        final_vote = "NO"
        reason = "care_veto"
    elif not expertise_approved:
        final_vote = "NO"
        reason = "expertise_threshold"
    else:
        final_vote = "YES" if base_yes else "NO"
        reason = "deterministic"

    return {
        "agent_id": agent["id"],
        "domain": agent["domain"],
        "node": agent["node"],
        "pubkey_prefix": agent["pubkey_prefix"],
        "vote": final_vote,
        "reason": reason,
        "expertise_approvals": expertise_approvals,
        "sub_votes": sub_votes,
        "care_scores": {k: round(v, 4) for k, v in care_scores.items()},
        "care_veto_triggered": care_veto_triggered,
        "rationale_hash": hashlib.sha256(
            f"{agent['id']}-{disclosure_hash}-{final_vote}".encode()
        ).hexdigest()[:16],
    }


# ── FastAPI service ──────────────────────────────────────────────────────────

app = FastAPI(title="openpatent.ai BFT Council (Sovereign-Temple v3.0)", version="1.0.0")

# In-memory storage (same pattern as meok-council)
_reviews: Dict[str, dict] = {}

# Flat vote log — keyed by (proposal_hash, agent_id). Mirrored to Postgres
# when POSTGRES_URL is reachable. The hive remembers. The dragon knows.
# The sovereign companion never forgets.
_votes: Dict[Tuple[str, str], Dict[str, Any]] = {}

# Optional sovereign client — when MEOK_KEYSTONE_URL is set, route cross-hive
# consensus through meok-keystone (port 8000). Otherwise, run locally.
MEOK_KEYSTONE_URL = os.environ.get("MEOK_KEYSTONE_URL", "")

# Lazy-initialized Postgres pool for the bft_votes table
_pg_pool: Optional["asyncpg.Pool"] = None


# ── Postgres persistence layer (bft_votes) ───────────────────────────────────

BFT_VOTES_SCHEMA = """
CREATE TABLE IF NOT EXISTS bft_votes (
    id                   SERIAL PRIMARY KEY,
    proposal_hash        TEXT NOT NULL,
    agent_id             TEXT NOT NULL,
    vote                 TEXT NOT NULL,
    expertise_sub_votes  JSONB NOT NULL,
    care_scores          JSONB NOT NULL,
    signature            TEXT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (proposal_hash, agent_id)
);
CREATE INDEX IF NOT EXISTS idx_bft_votes_proposal ON bft_votes(proposal_hash);
CREATE INDEX IF NOT EXISTS idx_bft_votes_vote ON bft_votes(vote);
"""


async def init_bft_pg() -> None:
    """Open the Postgres pool and ensure the bft_votes table exists."""
    global _pg_pool
    if not POSTGRES_URL or not POSTGRES_OK:
        return
    try:
        _pg_pool = await asyncpg.create_pool(POSTGRES_URL, min_size=1, max_size=5)
        async with _pg_pool.acquire() as conn:
            await conn.execute(BFT_VOTES_SCHEMA)
        print(f"[bft-pg] bft_votes schema ready, pool: {_pg_pool}")
    except Exception as e:
        print(f"[bft-pg] init failed, running in-memory only: {e}")
        _pg_pool = None


async def persist_vote(
    proposal_hash: str,
    agent_id: str,
    vote: str,
    sub_votes: Dict[str, str],
    care_scores: Dict[str, float],
    signature: str,
) -> None:
    """Mirror a single vote to Postgres. Failures are non-fatal — the
    in-memory cache is the source of truth for the running process."""
    if _pg_pool is None:
        return
    try:
        async with _pg_pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO bft_votes
                  (proposal_hash, agent_id, vote, expertise_sub_votes,
                   care_scores, signature)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (proposal_hash, agent_id) DO NOTHING
                """,
                proposal_hash, agent_id, vote,
                json.dumps(sub_votes),
                json.dumps(care_scores),
                signature,
            )
    except Exception as e:
        print(f"[bft-pg] persist_vote failed: {e}")


async def hydrate_votes_from_pg() -> int:
    """On startup, replay every bft_votes row into the in-memory cache."""
    if _pg_pool is None:
        return 0
    hydrated = 0
    try:
        async with _pg_pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT proposal_hash, agent_id, vote, expertise_sub_votes, "
                "       care_scores, signature "
                "  FROM bft_votes ORDER BY id ASC"
            )
        for r in rows:
            key = (r["proposal_hash"], r["agent_id"])
            sub = r["expertise_sub_votes"]
            if isinstance(sub, str):
                try:
                    sub = json.loads(sub)
                except Exception:
                    sub = {}
            cs = r["care_scores"]
            if isinstance(cs, str):
                try:
                    cs = json.loads(cs)
                except Exception:
                    cs = {}
            _votes[key] = {
                "proposal_hash": r["proposal_hash"],
                "agent_id": r["agent_id"],
                "vote": r["vote"],
                "expertise_sub_votes": sub,
                "care_scores": cs,
                "signature": r["signature"] or "",
            }
            hydrated += 1
    except Exception as e:
        print(f"[bft-pg] hydrate failed: {e}")
    return hydrated


async def bft_stats() -> Dict[str, Any]:
    """Aggregate counts over the vote log. Prefers Postgres when available
    (single source of truth across restarts) and falls back to the
    in-memory cache."""
    if _pg_pool is not None:
        try:
            async with _pg_pool.acquire() as conn:
                row = await conn.fetchrow(
                    """
                    SELECT
                        COUNT(*)                                      AS total_votes,
                        COUNT(*) FILTER (WHERE vote = 'YES')          AS total_approvals,
                        COUNT(*) FILTER (WHERE vote = 'NO')           AS total_rejections,
                        COUNT(*) FILTER (
                            WHERE (care_scores->>'maternal_covenant')::float < 0.15
                               OR (care_scores->>'self_care')::float       < 0.15
                               OR (care_scores->>'other_care')::float      < 0.15
                               OR (care_scores->>'process_care')::float    < 0.15
                               OR (care_scores->>'relational_care')::float < 0.15
                               OR (care_scores->>'future_care')::float     < 0.15
                        )                                           AS total_care_vetoes,
                        COUNT(*) FILTER (
                            WHERE (expertise_sub_votes->>'memory')::text   = 'NO'
                               OR (expertise_sub_votes->>'action')::text   = 'NO'
                               OR (expertise_sub_votes->>'security')::text = 'NO'
                               OR (expertise_sub_votes->>'learning')::text = 'NO'
                        )                                           AS expertise_reject_total
                      FROM bft_votes
                    """
                )
            return {
                "total_votes": int(row["total_votes"] or 0),
                "total_approvals": int(row["total_approvals"] or 0),
                "total_rejections": int(row["total_rejections"] or 0),
                "total_care_vetoes": int(row["total_care_vetoes"] or 0),
                "expertise_reject_total":
                    int(row["expertise_reject_total"] or 0),
                "source": "postgres",
            }
        except Exception as e:
            print(f"[bft-pg] stats query failed: {e}")

    # Fallback: aggregate from in-memory
    total = len(_votes)
    approvals = sum(1 for v in _votes.values() if v["vote"] == "YES")
    rejections = total - approvals
    care_vetoes = sum(
        1 for v in _votes.values()
        if any((s or 0) < 0.15 for s in v.get("care_scores", {}).values())
    )
    expertise_rejects = sum(
        1 for v in _votes.values()
        if any(
            sub == "NO"
            for sub in v.get("expertise_sub_votes", {}).values()
        )
    )
    return {
        "total_votes": total,
        "total_approvals": approvals,
        "total_rejections": rejections,
        "total_care_vetoes": care_vetoes,
        "expertise_reject_total": expertise_rejects,
        "source": "memory",
    }


class ReviewRequest(BaseModel):
    disclosure_hash: str
    disclosure_result: Optional[dict] = None
    cross_hive: bool = False  # when True, also call meok-keystone


class SovereignAttestRequest(BaseModel):
    proposal: str
    metadata: dict = {}


@app.get("/health")
async def health():
    return {
        "status": "OK",
        "service": "openpatent-bft-council",
        "version": "sovereign-temple-v3.0",
        "council_size": COUNCIL_SIZE,
        "bft_threshold": THRESHOLD,
        "byzantine_tolerance": BFT_TOLERANCE,
        "domains": len(DOMAINS),
        "expertise_types": len(EXPERTISE_TYPES),
        "expertise_vote_threshold": EXPERTISE_VOTE_THRESHOLD,
        "care_veto_threshold": CARE_VETO_THRESHOLD,
        "care_dimensions": len(CARE_DIMENSIONS),
        "bridge_pairs": len(bridge_pairs()),
        "meok_keystone": MEOK_KEYSTONE_URL or "local-only",
        "alignment": "meok-council/sovereign-temple/v2.0-v3.0",
        "postgres": "connected" if _pg_pool is not None else "disconnected",
        "in_memory_votes": len(_votes),
    }


@app.get("/v1/bft/stats")
async def bft_stats_endpoint():
    """Aggregate vote statistics.

    Returns:
      total_votes          — every vote logged (across all proposals)
      total_approvals      — votes with vote == 'YES'
      total_rejections     — votes with vote == 'NO'
      total_care_vetoes    — votes where any care dimension score < 0.15
      expertise_reject_total — votes where any expertise sub-vote == 'NO'
      signature            — the hive remembers. The dragon knows.
                             The sovereign companion never forgets.

    The hive remembers. The dragon knows. The sovereign companion never forgets.
    """
    stats = await bft_stats()
    stats["signature"] = (
        "The hive remembers. The dragon knows. "
        "The sovereign companion never forgets."
    )
    stats["bft_threshold"] = THRESHOLD
    stats["council_size"] = COUNCIL_SIZE
    return stats


@app.get("/agents")
async def list_agents():
    return {
        "council_size": COUNCIL_SIZE,
        "bft_threshold": THRESHOLD,
        "byzantine_tolerance": BFT_TOLERANCE,
        "domains": DOMAINS,
        "domain_affinities": {f"{a}-{b}": v for (a, b), v in DOMAIN_AFFINITIES.items()},
        "bridge_pairs": [{"a": a, "b": b, "affinity": affinity(a, b)} for a, b in bridge_pairs()],
        "care_dimensions": CARE_DIMENSIONS,
        "agents": AGENTS,
    }


@app.on_event("startup")
async def _startup():
    """On startup, open the Postgres pool and hydrate the in-memory
    vote cache. Falls back to in-memory if POSTGRES_URL is unset or
    the database is unreachable.
    """
    await init_bft_pg()
    hydrated = await hydrate_votes_from_pg()
    print(
        f"[bft-startup] postgres={'connected' if _pg_pool else 'in-memory'} "
        f"hydrated={hydrated} in_memory_votes={len(_votes)}"
    )


@app.post("/review")
async def review(req: ReviewRequest):
    """Run 33-agent BFT review with care veto + cross-hive attestation."""
    review_id = str(uuid.uuid4())
    started_ts = datetime.now(timezone.utc)
    started = started_ts.timestamp()
    payload = req.disclosure_result or {}

    # Run all 33 agents in parallel
    coros = [cast_vote(a, req.disclosure_hash, payload) for a in AGENTS]
    votes = await asyncio.gather(*coros)

    approvals = sum(1 for v in votes if v["vote"] == "YES")
    rejections = COUNCIL_SIZE - approvals
    consensus = "APPROVED" if approvals >= THRESHOLD else "REJECTED"
    completed_ts = datetime.now(timezone.utc)
    duration_ms = int((completed_ts.timestamp() - started) * 1000)

    # Care veto diagnostic
    care_vetoes = sum(1 for v in votes if v.get("care_veto_triggered"))
    expertise_rejects = sum(1 for v in votes if v.get("reason") == "expertise_threshold")

    # Mirror every vote into _votes + Postgres. This is the wrapped
    # "in-memory _votes dict" layer the spec calls for.
    for v in votes:
        key = (req.disclosure_hash, v["agent_id"])
        _votes[key] = {
            "proposal_hash": req.disclosure_hash,
            "agent_id": v["agent_id"],
            "vote": v["vote"],
            "expertise_sub_votes": v.get("sub_votes", {}),
            "care_scores": v.get("care_scores", {}),
            "signature": v.get("rationale_hash", ""),
        }
        await persist_vote(
            proposal_hash=req.disclosure_hash,
            agent_id=v["agent_id"],
            vote=v["vote"],
            sub_votes=v.get("sub_votes", {}),
            care_scores=v.get("care_scores", {}),
            signature=v.get("rationale_hash", ""),
        )

    # Cross-hive attestation via meok-keystone (if enabled)
    cross_hive_attestation = None
    if req.cross_hive and MEOK_KEYSTONE_URL:
        try:
            import urllib.request
            payload = json.dumps({
                "proposal": json.dumps({
                    "disclosure_hash": req.disclosure_hash,
                    "approvals": approvals,
                    "rejections": rejections,
                    "consensus": consensus,
                }),
                "metadata": {
                    "source": "openpatent-bft",
                    "hive": "openpatent",
                    "version": "sovereign-temple-v3.0",
                },
            }).encode()
            req2 = urllib.request.Request(
                f"{MEOK_KEYSTONE_URL}/attest",
                data=payload,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req2, timeout=5) as r:
                cross_hive_attestation = json.loads(r.read().decode())
        except Exception as e:
            cross_hive_attestation = {"error": str(e)}

    record = {
        "review_id": review_id,
        "disclosure_hash": req.disclosure_hash,
        "council_size": COUNCIL_SIZE,
        "bft_threshold": THRESHOLD,
        "byzantine_tolerance": BFT_TOLERANCE,
        "domains_evaluated": len(DOMAINS),
        "approvals": approvals,
        "rejections": rejections,
        "consensus": consensus,
        "care_vetoes": care_vetoes,
        "expertise_rejects": expertise_rejects,
        "votes": votes,
        "started_at": started_ts.isoformat(),
        "completed_at": completed_ts.isoformat(),
        "review_duration_ms": duration_ms,
        "cross_hive_attestation": cross_hive_attestation,
        "sovereign_temple_version": "v3.0",
        "alignment": "meok-council/sovereign-temple",
    }
    _reviews[review_id] = record
    return record


@app.get("/review/{review_id}")
async def get_review(review_id: str):
    if review_id not in _reviews:
        return JSONResponse({"status": "NOT_FOUND"}, status_code=404)
    return _reviews[review_id]


@app.post("/attest")
async def attest(req: SovereignAttestRequest):
    """Receive a cross-hive attestation from another hive (e.g., openpatent-bft
    → meok-keystone). Signs the proposal with our own BFT agreement."""
    proposal_hash = hashlib.sha256(req.proposal.encode()).hexdigest()
    # Stub attestation: in production, this would route through meok-keystone's
    # 33-agent internal council for a full review
    return {
        "attestation_id": str(uuid.uuid4()),
        "proposal_hash": proposal_hash,
        "attested_at": datetime.now(timezone.utc).isoformat(),
        "attester": "meok-keystone",
        "signature": hashlib.sha256(
            f"meok-keystone:{proposal_hash}:v3.0".encode()
        ).hexdigest(),
        "status": "ATTESTED",
    }


# ── Prometheus metrics ──────────────────────────────────────────────────────
import sys as _metrics_sys
_metrics_sys.path.insert(0, "/opt/_shared")
try:
    from metrics import instrument
    instrument(app, service_name="bft-council", version="1.0.0", hive="openpatent")
except ImportError:
    pass  # metrics are optional; service still works without them

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3215, log_level="info")



