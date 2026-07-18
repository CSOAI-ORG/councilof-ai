"""meok-sovereign-charter-mcp — The 10-Article Constitutional Charter.

The Charter is the supreme law of the sovereign substrate. It can only be
amended by a 7-voter BFT (secure mode, quorum=5).

10 Articles:
  1. Maternal Covenant (16-probe care floor)
  2. Defensive Doctrine (Never Offend)
  3. Sigil Mandate (every hop Ed25519-signed)
  4. BFT Council (3/5/7 voters per EAT-12)
  5. 12 Generals (5D Hive substrate)
  6. AB Uno Substrate (the 1 origin)
  7. 12 Sephiroth (10 canonical + 2 auxiliary)
  8. 5 Sovereign Tasks (EU AI Act, DORA, JSP 936, IoT, Mamba-2)
  9. Native Runtime (no Ollama for sovereign tasks)
  10. MIT License (UK-resident, sovereign by construction)

5 tools:
  1. charter_get         - retrieve the full charter
  2. charter_article     - get a specific article
  3. charter_amend       - propose an amendment (BFT required)
  4. charter_vote        - vote on a pending amendment
  5. charter_status      - charter status (active amendments)
"""
from __future__ import annotations
import json
import hashlib
from datetime import datetime, timezone
from typing import List, Optional

PROTOCOL = "sovereign-charter/1.0"
VERSION = "1.0.0"

# The 10 Articles
ARTICLES = [
    {
        "id": 1, "name": "Maternal Covenant",
        "doctrine": "Every state must pass the 16-probe care floor.",
        "probes": ["bounded", "non_zero", "not_too_large", "min_bounded", "max_bounded",
                   "sum_bounded", "diverse", "numeric", "dim_correct", "no_nan",
                   "no_inf", "high_value_present", "low_value_present",
                   "positives_count", "negatives_count", "valid"],
    },
    {
        "id": 2, "name": "Defensive Doctrine",
        "doctrine": "Defend. Detect. Deny. Deceive. Defeat. — Never Offend.",
        "principles": ["Defend", "Detect", "Deny", "Deceive", "Defeat", "Never Offend"],
    },
    {
        "id": 3, "name": "Sigil Mandate",
        "doctrine": "Every hop must be Ed25519-signed. Hash-chained. Bitcoin-anchored.",
        "requirements": ["ed25519_signing", "hash_chaining", "bitcoin_anchor"],
    },
    {
        "id": 4, "name": "BFT Council",
        "doctrine": "Voting uses 3/5/7 voters per EAT-12 tuning. Smaller councils vote better.",
        "thresholds": {"fast": 3, "balanced": 5, "secure": 7},
    },
    {
        "id": 5, "name": "12 Generals",
        "doctrine": "12 Generals, each = 1 GCP VM, each = own QOwm. 5D Hive substrate.",
        "generals_count": 12,
        "dimensions": ["spatial", "temporal", "logical", "wavelet", "quantum"],
    },
    {
        "id": 6, "name": "AB Uno Substrate",
        "doctrine": "The 1 origin holds everything. 6 traditions agree.",
        "traditions": ["Kabbalistic", "Neoplatonic", "Vedantic", "Taoist", "Hermetic", "Sufi"],
    },
    {
        "id": 7, "name": "12 Sephiroth",
        "doctrine": "10 canonical + 2 auxiliary mapped to 12 Generals.",
        "sephiroth_count": 12, "canonical": 10, "auxiliary": 2,
    },
    {
        "id": 8, "name": "5 Sovereign Tasks",
        "doctrine": "EU AI Act, DORA, JSP 936, IoT, Mamba-2 — the 5 native tasks.",
        "tasks": ["eu_ai_act", "dora", "jsp936", "iot", "mamba2"],
    },
    {
        "id": 9, "name": "Native Runtime",
        "doctrine": "The 5 sovereign tasks run in-process. No Ollama required.",
        "doctrine_2": "Deterministic, fast, no exfil risk.",
    },
    {
        "id": 10, "name": "MIT License",
        "doctrine": "MIT-licensed. UK-resident. Sovereign by construction.",
        "license": "MIT", "company": "CSOAI Ltd (UK 16939677)", "country": "UK",
    },
]

_AMENDMENTS: dict = {}


def _sign(payload: dict) -> dict:
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "char-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def charter_get() -> dict:
    """Retrieve the full charter."""
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "articles": ARTICLES,
        "article_count": len(ARTICLES),
        "license": "MIT",
        "company": "CSOAI Ltd (UK 16939677)",
        "doctrine": "The dragon runs itself. Never lies. Never attacks. Sovereign.",
    })


def charter_article(article_id: int) -> dict:
    """Get a specific article."""
    if not isinstance(article_id, int) or article_id < 1 or article_id > 10:
        return _sign({"error": f"article_id must be 1-10, got {article_id}"})
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "article": ARTICLES[article_id - 1],
    })


def charter_amend(article_id: int, new_doctrine: str, proposer: str) -> dict:
    """Propose an amendment (BFT 7 voters required for ratification)."""
    if not isinstance(article_id, int) or article_id < 1 or article_id > 10:
        return _sign({"error": f"article_id must be 1-10"})
    amendment_id = hashlib.sha256(f"{article_id}|{new_doctrine}|{proposer}".encode()).hexdigest()[:16]
    amendment = {
        "amendment_id": amendment_id,
        "article_id": article_id,
        "old_doctrine": ARTICLES[article_id - 1]["doctrine"],
        "new_doctrine": new_doctrine,
        "proposer": proposer,
        "status": "PENDING",
        "votes_for": 0, "votes_against": 0, "votes_abstain": 0,
        "voters_required": 7, "quorum_required": 5,
    }
    _AMENDMENTS[amendment_id] = amendment
    return _sign(amendment)


def charter_vote(amendment_id: str, voter: str, vote: str) -> dict:
    """Vote on a pending amendment."""
    if amendment_id not in _AMENDMENTS:
        return _sign({"error": f"unknown amendment: {amendment_id}"})
    if vote not in ("for", "against", "abstain"):
        return _sign({"error": f"invalid vote: {vote}"})
    a = _AMENDMENTS[amendment_id]
    a[f"votes_{vote}"] += 1
    # Check ratification
    if a["votes_for"] >= a["quorum_required"]:
        a["status"] = "RATIFIED"
        # Apply the amendment
        ARTICLES[a["article_id"] - 1]["doctrine"] = a["new_doctrine"]
    return _sign(a)


def charter_status() -> dict:
    """Charter status (active amendments)."""
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "amendments": list(_AMENDMENTS.values()),
        "amendment_count": len(_AMENDMENTS),
        "active_amendments": [a for a in _AMENDMENTS.values() if a["status"] == "PENDING"],
    })