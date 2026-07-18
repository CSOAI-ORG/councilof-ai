# King Runestone Portal

The single public API of the sovereign substrate.

## Quick Start
- POST /portal/signup - Create sovereign identity
- POST /portal/login - Get session token
- POST /portal/submit - 1-brain query (auth)
- POST /portal/submit/4brain - 4-brain parallel (auth)
- POST /portal/submit/4x4x3 - 4x4x3 MAGNIFICENT (auth)
- GET /portal/dashboard - Live HTML dashboard
- GET /portal/ledger - Full JSON ledger
- GET /portal/history - Per-user history (auth)
- GET /portal/audit/<sigil> - Audit runestone

## Sovereignty
- Compliance: EU AI Act 2024/1689
- Authentication: Sovereign identity with Ed25519 sigil
- BFT: 33-council with 23/33 quorum
- Audit: Every runestone signed and chain-anchored
- Rate limit: 30 req/min

## Architecture
nginx (SSL) -> gunicorn (gevent) -> Flask (king-runestone-v6) -> SOV3 -> L6 verifier -> sigil chain -> user.
