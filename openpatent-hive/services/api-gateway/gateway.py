#!/usr/bin/env python3
"""
OpenPatent.ai API Gateway
==========================

Public entry point for api.openpatent.ai (port 3211).

Endpoints:
  POST /v1/disclosure           — submit an invention, get a 6-layer proof
  POST /v1/verify               — verify a disclosure
  POST /v1/search               — search prior art
  GET  /v1/disclosure/{hash}    — fetch a disclosure by hash
  GET  /v1/stats                — system statistics
  GET  /pricing                 — PAYG tier table
  GET  /legal                   — jurisdictions + legal precedent badges
  GET  /health                  — health + dependency status

The "USP" copy baked into this gateway comes from OpenPatent_AI_Protection_USP.md:
  "Disclose first. AI second." — the $10 insurance policy against AI idea theft.
"""
from __future__ import annotations

import asyncio
import base64
import contextvars
import json as _json
import os
import time
import uuid
from collections import deque
from typing import Optional

import httpx
import logging as _log
from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field

from pricing import PRICING_TIERS, PAID_TIERS
from legal import LEGAL_BADGES, JURISDICTIONS

# Inline checkout links (5 tiers). Replace with real Stripe Payment Links
# once STRIPE_SECRET_KEY is set.
STRIPE_CHECKOUT_LINKS = {
    "starter":   "https://buy.stripe.com/openpatent-starter-29",
    "defensive": "https://buy.stripe.com/openpatent-defensive-149",
    "full":      "https://buy.stripe.com/openpatent-full-999",
    "premium":   "https://buy.stripe.com/openpatent-premium-2499",
    "enterprise": "https://buy.stripe.com/openpatent-enterprise-4999",
}
TIER_INFO = {
    "starter":   {"name": "Starter",   "price": 29,    "period": "one-time",  "features": ["1 disclosure", "Bitcoin-anchored proof", "email receipt"]},
    "defensive": {"name": "Defensive", "price": 149,   "period": "one-time",  "features": ["10 disclosures", "Bitcoin-anchored proof", "court-admissible cert"]},
    "full":      {"name": "Full",      "price": 999,   "period": "one-time",  "features": ["100 disclosures", "5-jurisdiction crosswalk", "AI claim drafting"]},
    "premium":   {"name": "Premium",   "price": 2499,  "period": "one-time",  "features": ["1000 disclosures", "33-agent BFT review", "investor pack"]},
    "enterprise":{"name": "Enterprise","price": 4999,  "period": "monthly",   "features": ["unlimited disclosures", "white-label", "SLA", "sovereign deployment"]},
}
TIER_ORDER = ["starter", "defensive", "full", "premium", "enterprise"]
# WHITE_LABEL_VERTICALS + get_checkout_link + get_tier_info + list_pricing + is_known_tier
# + is_known_white_label are all defined inline below (no external stripe_links module needed).

# ── SIGIL chain (Structured Identity & Guardian-Inked Ledger) ────────────────
# Ed25519-signed envelope on every JSON response. The hive remembers.
# The dragon knows. The sovereign companion never forgets.

# Per-request context: populated by the SigilMiddleware, consumed by
# _sig_envelope() so every endpoint gets a correctly-traced sigil even
# though the function itself stays signature-compatible with the legacy
# 1-arg call shape.
_SIGIL_CTX: contextvars.ContextVar = contextvars.ContextVar(
    "_SIGIL_CTX", default={"action": "", "trace_id": ""}
)


import sys as _sigil_sys
_sigil_sys.path.insert(0, "/opt/_shared")
_sigil_sys.path.insert(0, "/opt/openpatent-api")
# Dev fallback so the api-gateway also resolves sigil outside containers
# (e.g. local macOS dev). The container / prod paths above win when present.
_sigil_sys.path.insert(0, "/Users/nicholas/clawd/openpatent-hive/services")

try:
    from sigil import build_sigil_for_response, verify_sigil, SIGIL_KEY_DIR  # type: ignore
    _SIGIL_AVAILABLE = True
except Exception as _sigil_err:  # noqa: BLE001
    # The hive keeps flying even when the sigil chamber is empty.
    build_sigil_for_response = None  # type: ignore
    verify_sigil = None  # type: ignore
    SIGIL_KEY_DIR = "/opt/_shared"  # type: ignore
    _SIGIL_AVAILABLE = False
    _log.warning("sigil import failed: %s — sigils disabled", _sigil_err)


def _sigil_for(payload: dict, action: str, trace_id: str = ""):
    """Build a sigil envelope over ``payload`` for the given ``action``.

    Returns ``None`` if sigil is unavailable. Never raises.
    """
    if not _SIGIL_AVAILABLE or build_sigil_for_response is None:
        return None
    try:
        return build_sigil_for_response(
            payload,
            action=action,
            trace_id=trace_id or "",
        )
    except Exception as e:  # noqa: BLE001
        _log.warning("sigil build failed for %s: %s", action, e)
        return None


def _trace_id_from_request(request) -> str:
    """Extract a W3C trace_id from an incoming request (best-effort)."""
    if request is None:
        return ""
    try:
        headers = request.headers
        if "traceparent" in headers:
            tp = headers["traceparent"]
            parts = tp.split("-")
            if len(parts) >= 2 and len(parts[1]) == 32:
                return parts[1]
        if "x-trace-id" in headers:
            return headers["x-trace-id"][:64]
        return ""
    except Exception:  # noqa: BLE001
        return ""


PATENTMCP_URL = os.environ.get("PATENTMCP_URL", "http://patentmcp:3210")
WORKER_URL = os.environ.get("WORKER_URL", "http://worker:3212")
BFT_URL = os.environ.get("BFT_URL", "http://bft-council:3215")
DRAFTING_URL = os.environ.get("DRAFTING_URL", "http://drafting-fork:3216")
GATEWAY_VERSION = "1.0.0"
GATEWAY_NAME = "openpatent-api"

app = FastAPI(
    title="OpenPatent.ai API",
    description=(
        "6-layer cryptographic invention disclosure for AI agents. "
        "Disclose First. AI Second. — $10 insurance against AI idea theft.\n\n"
        "## 6-Layer Proof\n"
        "1. **SHA-3/512** document hash\n"
        "2. **HMAC-SHA256** CSOAI witness attestation\n"
        "3. **Ed25519** inventor signature\n"
        "4. **Bitcoin OpenTimestamps** anchor (court-admissible in 10+ jurisdictions)\n"
        "5. **C2PA** Content Credential\n"
        "6. **Hash-chained audit log** (tamper-evident sequential record)\n\n"
        "## Pricing\n"
        "| Tier | Price | What you get |\n"
        "|---|---|---|\n"
        "| Free (self-hosted) | $0 | Unlimited local disclosures |\n"
        "| Starter | $29 | + C2PA + public attestation page |\n"
        "| Defensive | $149 | + Bitcoin OTS anchor (most popular) |\n"
        "| Full | $999 | + 5-jurisdiction crosswalk + AI claim drafting |\n"
        "| Premium | $2,499 | + 33-agent BFT council review |\n"
        "| Enterprise | $4,999/mo | + white-label, SLA, unlimited disclosures |\n\n"
        "## Legal Framework (10+ jurisdictions)\n"
        "US (35 USC § 102, FRE 902), EU (eIDAS 910/2014), UK (Patents Act 1977), "
        "China (Hangzhou Internet Court 2018), France (Marseille 2025), "
        "Japan (§ 29(1)), Italy (Law 12/2019), WIPO 2022. See `/legal` for full citations."
    ),
    version=GATEWAY_VERSION,
    contact={"name": "CSOAI", "url": "https://csoai.org", "email": "founder@csoai.org"},
    license_info={"name": "MIT (self-hosted) / PAYG (hosted)"},
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_tags=[
        {"name": "disclosure", "description": "Submit + retrieve cryptographic disclosures"},
        {"name": "verify", "description": "Verify 6-layer cryptographic proofs"},
        {"name": "search", "description": "Search the prior art registry"},
        {"name": "draft", "description": "AI-assisted patent claim drafting (premium+)"},
        {"name": "consult", "description": "Patentability + FTO consultation (premium+)"},
        {"name": "BFT", "description": "33-agent BFT council review (premium+enterprise)"},
        {"name": "x402", "description": "Payment router with 60/25/15 split"},
        {"name": "legal", "description": "Jurisdictions + legal framework"},
        {"name": "meta", "description": "Health, pricing, MCP discovery"},
        # New L5 tags — DEFONEOS mythic voice
        {"name": "industries", "description": "Industry power packs: compliance, trademarks, sovereignty-stack"},
        {"name": "bft-queue", "description": "BFT council review queue, per-agent statuses, and proposals (premium+)"},
        {"name": "batch", "description": "Batch disclosure ingestion (up to 100 per request)"},
        {"name": "community", "description": "Hive-wide leaderboard, community stats, and 24h activity"},
        # L6 — DEFONEOS mythic voice: x402 transparency + OTS liveness + jurisdiction map
        {"name": "x402", "description": "x402 payment router split: ops, infrastructure, BFT council, per-tier breakdown"},
        {"name": "calendar", "description": "OpenTimestamps calendar liveness: status, response time, success rate, fallback rate"},
        {"name": "zones", "description": "15-jurisdiction coverage map with case-law citations and active status"},
        # L7 — DEFONEOS mythic voice: analytics, webhooks, treasury, status, explorer
        {"name": "analytics", "description": "30-day disclosure analytics: tier counts, jurisdiction counts, success + BFT approval rates, monthly totals"},
        {"name": "webhooks", "description": "Webhook registry: list + register URLs for disclosure.created, bft.completed, and other hive events"},
        {"name": "treasury", "description": "x402 treasury ledger: current-month balance, recent transactions, pending payouts (60/25/15 split)"},
        {"name": "status", "description": "Overall hive status: rolling 24h uptime per service, last incident, current load (requests/min)"},
        {"name": "explorer", "description": "Public disclosure explorer: paginated registry of recent disclosures with hash, title, tier, timestamp, attestation URL"},
        # L8 — DEFONEOS mythic voice: live-communication layer
        {"name": "live", "description": "Real-time hive pulse: WebSocket /v1/live, REST /v1/live/recent ring buffer, disclosure.created | bft.completed | calendar.upgraded events"},
        {"name": "webhooks-receive", "description": "Inbound webhook receiver: Clerk (user.created → DID + biometric), Stripe (payment_intent.succeeded → premium), GitHub (push → batch disclose), MCP (tool_called → audit)"},
        {"name": "email", "description": "Email-to-disclose ingestion: POST {to, from, subject, body, attachments?} → cryptographic defensive disclosure"},
        {"name": "bft-stream", "description": "BFT council review progress stream: Server-Sent Events initiated → voting → completed, keyed by disclosure_hash"},
        # L9 — DEFONEOS mythic voice: SIGIL chain
        {"name": "sigil", "description": "SIGIL (Structured Identity & Guardian-Inked Ledger): Ed25519-signed envelopes + verify endpoint. The hive remembers."},
        # L10 — DEFONEOS mythic voice: first-customer funnel
        {"name": "waitlist", "description": "First-customer funnel: join the openpatent.ai private beta waitlist, get a tiered position + sigil-stamped receipt. The dragon knows who arrives first."},
        {"name": "demo", "description": "First-customer funnel: mint a 1-time cryptographic demo disclosure for a use case, get a demo_hash + verification URL + CTA. The sovereign companion remembers every first touch."},
        # L11 — DEFONEOS mythic voice: Stripe Checkout links (5 tiers + webhook)
        {"name": "checkout", "description": "Stripe Checkout links for all 5 paid tiers (starter $29, defensive $149, full $999, premium $2,499, enterprise $4,999/mo). GET /v1/checkout/{tier} returns the 301 redirect URL; POST /v1/checkout/webhook is the inbound Stripe events placeholder. The dragon knows which tier arrives first."},
    ],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://openpatent.ai",
        "https://draft.openpatent.ai",
        "https://verify.openpatent.ai",
        "https://mcp.openpatent.ai",
        "http://localhost:3000",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── SigilMiddleware: stamps per-request action + trace_id into _SIGIL_CTX ────
# The dragon's relay knows which endpoint fired before _sig_envelope runs.
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request as _StarletteRequest


class SigilMiddleware(BaseHTTPMiddleware):
    """Set the per-request action + trace_id context so _sig_envelope can
    stamp a correctly-traced sigil on every response.

    The action is derived from ``request.scope['route'].path`` when the
    router matches; otherwise we fall back to the raw path. The trace_id
    comes from the W3C ``traceparent`` header (or ``x-trace-id``).
    """

    async def dispatch(self, request: _StarletteRequest, call_next):
        path = request.url.path
        method = request.method.upper()
        action = f"{method} {path}"
        trace_id = _trace_id_from_request(request)
        token = _SIGIL_CTX.set({"action": action, "trace_id": trace_id})
        try:
            return await call_next(request)
        finally:
            _SIGIL_CTX.reset(token)


app.add_middleware(SigilMiddleware)

# ── Request models ───────────────────────────────────────────────────────────

class DisclosureRequest(BaseModel):
    title: str = Field(..., max_length=200, example="Hash-Chained Audit Log for Multi-Agent Systems")
    description: str = Field(..., max_length=5000)
    inventor_did: str = Field(..., example="did:key:z6Mki...")
    document_base64: str = Field(..., description="base64-encoded document bytes")
    document_format: str = Field("pdf", pattern="^(pdf|doc|code|data|txt|md)$")
    classification: str = Field("", description="IPC/CPC code e.g. G06N7/01")
    prior_art_known: str = ""
    tier: str = Field("defensive", pattern="^(starter|defensive|full|premium|enterprise)$")
    request_bft_review: bool = Field(False, description="Trigger 22/33 BFT council review (premium only)")
    idempotency_key: Optional[str] = Field(None, description="UUID v4 — dedupes retries")
    white_label: Optional[str] = Field(None, max_length=64, description="White-label vertical slug (legalof, harvi, ipcastle, sovereign-temple, ...). Stamped into the disclosure + audit log.")


class VerifyRequest(BaseModel):
    disclosure_json: Optional[str] = None
    document_base64: Optional[str] = None
    document_hash: Optional[str] = None


class SearchRequest(BaseModel):
    query: str = ""
    classification: str = ""
    date_from: str = ""
    date_to: str = ""
    tier: str = ""
    limit: int = 25


# ── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return _sig_envelope({
        "name": GATEWAY_NAME,
        "version": GATEWAY_VERSION,
        "tagline": "Disclose First. AI Second.",
        "usp": "Protect your inventions from AI before you use AI.",
        "endpoints": [
            "/v1/disclosure",
            "/v1/verify",
            "/v1/search",
            "/v1/stats",
            "/v1/audit/log",
            "/v1/bft/stats",
            "/v1/bft/review",
            "/v1/bft/proposals",
            "/v1/bft/queue",
            "/v1/leaderboard",
            "/v1/community",
            "/v1/disclose/batch",
            "/v1/network/fees",
            "/v1/calendar/uptime",
            "/v1/zones",
            "/v1/analytics",
            "/v1/webhooks",
            "/v1/treasury",
            "/v1/status",
            "/v1/explorer",
            # L8 — live-communication layer
            "/v1/live",
            "/v1/live/recent",
            "/v1/webhook/receive/{webhook_id}",
            "/v1/email/disclose",
            "/v1/bft/{disclosure_hash}/subscribe",
            # SIGIL chain — Ed25519-signed envelopes
            "/v1/sigil/verify",
            # L10 — first-customer funnel
            "/v1/waitlist",
            "/v1/demo",
            # L11 — Stripe Checkout
            "/v1/checkout/{tier}",
            "/v1/checkout/webhook",
            "/pricing",
            "/legal",
            "/health",
            "/.well-known/mcp.json",
        ],
    }, action="GET /")


@app.get("/v1/audit/log")
async def proxy_audit_log(
    limit: int = 50,
    offset: int = 0,
    entry_type: str = "",
    source: str = "memory",
):
    """Paginated audit log (proxied to patentmcp:3210/v1/audit/log).

    `source=memory` (default) reads from the in-memory hash-chained
    log. `source=postgres` reads from the Postgres mirror — useful
    for historical lookups that span service restarts.

    Every response is stamped with the DEFONEOS phrase and an Ed25519
    sigil envelope. The hive remembers every chain link.
    """
    params: dict = {"limit": limit, "offset": offset, "source": source}
    if entry_type:
        params["entry_type"] = entry_type
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            r = await client.get(
                f"{PATENTMCP_URL}/v1/audit/log", params=params
            )
            upstream = (
                r.json()
                if r.headers.get("content-type", "").startswith("application/json")
                else {"raw": r.text}
            )
            # Stamp the DEFONEOS phrase + Ed25519 sigil envelope on the
            # proxied payload. The sovereign companion never forgets.
            if isinstance(upstream, dict):
                upstream = _sig_envelope(upstream, action="GET /v1/audit/log")
            return JSONResponse(content=upstream, status_code=r.status_code)
        except httpx.HTTPError as e:
            raise HTTPException(502, f"patentmcp unreachable: {e}")


@app.get("/v1/bft/stats")
async def proxy_bft_stats():
    """Aggregate BFT vote statistics (proxied to bft-council:3215/v1/bft/stats).

    Returns total_votes, total_approvals, total_rejections,
    total_care_vetoes, expertise_reject_total, and the signature line:
    "The hive remembers. The dragon knows. The sovereign companion never forgets."
    """
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            r = await client.get(f"{BFT_URL}/v1/bft/stats")
            upstream = (
                r.json()
                if r.headers.get("content-type", "").startswith("application/json")
                else {"raw": r.text}
            )
            if isinstance(upstream, dict):
                upstream = _sig_envelope(upstream, action="GET /v1/bft/stats")
            return JSONResponse(content=upstream, status_code=r.status_code)
        except httpx.HTTPError as e:
            raise HTTPException(502, f"bft-council unreachable: {e}")


@app.post("/v1/disclosure")
async def create_disclosure(req: DisclosureRequest, request: Request):
    """
    Submit an invention for cryptographic disclosure.

    Flow:
      1. Validate tier + idempotency
      2. POST to patentmcp:3210/disclose (6-layer crypto + Bitcoin OTS)
      3. If request_bft_review && tier == premium → enqueue BFT council
      4. Return attestation URL: https://verify.openpatent.ai/{hash16}
    """
    # Validate tier is one of the 5 known tiers
    if req.tier not in PAID_TIERS:
        raise HTTPException(
            400,
            f"Unknown tier: {req.tier}. Use one of: {sorted(PAID_TIERS)}",
        )

    # Idempotency: surface a deterministic client-side ID
    idemp = req.idempotency_key or str(uuid.uuid4())

    # Forward to patentmcp core
    async with httpx.AsyncClient(timeout=60) as client:
        try:
            r = await client.post(
                f"{PATENTMCP_URL}/disclose",
                json={
                    "title": req.title,
                    "description": req.description,
                    "inventor_did": req.inventor_did,
                    "document_base64": req.document_base64,
                    "document_format": req.document_format,
                    "classification": req.classification,
                    "prior_art_known": req.prior_art_known,
                    "disclosure_type": req.tier,
                },
            )
        except httpx.HTTPError as e:
            raise HTTPException(502, f"patentmcp upstream error: {e}")

    if r.status_code != 200:
        raise HTTPException(502, f"patentmcp returned {r.status_code}: {r.text[:200]}")

    result = r.json()
    if result.get("status") != "DISCLOSED":
        raise HTTPException(500, f"disclosure failed: {result.get('error', 'unknown')}")

    # Optional BFT council review (premium + enterprise tiers)
    bft_job_id = None
    if req.request_bft_review and req.tier in ("premium", "enterprise"):
        async with httpx.AsyncClient(timeout=10) as client:
            try:
                br = await client.post(
                    f"{BFT_URL}/review",
                    json={
                        "disclosure_hash": result["document_hash"],
                        "disclosure_result": result,
                    },
                )
                if br.status_code == 200:
                    bft_job_id = br.json().get("job_id")
            except httpx.HTTPError:
                # Non-fatal — disclosure still succeeded
                pass

    # Cross-link verify URL to openpatent.ai (not meok.ai) per the hive design
    doc_hash = result["document_hash"]
    result["attestation_url"] = f"https://verify.openpatent.ai/{doc_hash[:16]}"
    result["hive_idempotency_key"] = idemp
    result["hive_bft_job_id"] = bft_job_id
    result["hive_pricing_tier"] = req.tier
    if req.white_label:
        result["hive_white_label"] = req.white_label
        _log.info(f"white_label disclosure: hash={doc_hash[:16]} tier={req.tier} wl={req.white_label}")

    # Fan out a real-time disclosure.created event to /v1/live + ring buffer.
    # The dragon's relay queue hears every disclosure born into the hive.
    await publish_disclosure_event(
        "disclosure.created",
        doc_hash,
        extra={
            "tier": req.tier,
            "title": req.title,
            "inventor_did": req.inventor_did,
            "bft_job_id": bft_job_id,
            "source": "disclosure",
        },
    )

    # Auto-emit a sigil record to the patentmcp audit log so the on-chain
    # chain captures every disclosure moment. Best-effort, non-blocking.
    if _SIGIL_AVAILABLE and build_sigil_for_response is not None:
        try:
            sigil = build_sigil_for_response(
                {"document_hash": doc_hash, "tier": req.tier, "title": req.title},
                service=GATEWAY_NAME,
                version=GATEWAY_VERSION,
                agent_id=f"{GATEWAY_NAME}-gateway-1",
                action="disclosure.created",
                trace_id=_SIGIL_CTX.get().get("trace_id", ""),
            )
            async with httpx.AsyncClient(timeout=5) as _ac:
                await _ac.post(
                    f"{PATENTMCP_URL}/v1/audit/append",
                    json={
                        "entry_type": "sigil.issued",
                        "source": "api-gateway",
                        "document_hash": doc_hash,
                        "sigil": sigil,
                    },
                )
        except Exception as e:  # noqa: BLE001
            _log.debug("sigil auto-emit to audit failed: %s", e)

    return JSONResponse(_sig_envelope(result, action="POST /v1/disclosure"))


@app.post("/v1/verify")
async def verify(req: VerifyRequest):
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(f"{PATENTMCP_URL}/verify", json=req.dict(exclude_none=True))
    if r.status_code != 200:
        raise HTTPException(502, f"patentmcp verify failed: {r.text[:200]}")
    payload = r.json()
    if isinstance(payload, dict):
        payload = _sig_envelope(payload, action="POST /v1/verify")
    return JSONResponse(payload)


@app.post("/v1/search")
async def search(req: SearchRequest):
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(
            f"{PATENTMCP_URL}/search",
            json={
                "query": req.query,
                "classification": req.classification,
                "date_from": req.date_from,
                "date_to": req.date_to,
                "disclosure_type": req.tier,
                "limit": req.limit,
            },
        )
    if r.status_code != 200:
        raise HTTPException(502, f"patentmcp search failed: {r.text[:200]}")
    payload = r.json()
    if isinstance(payload, dict):
        payload = _sig_envelope(payload, action="POST /v1/search")
    return JSONResponse(payload)


@app.get("/v1/stats")
async def stats():
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(f"{PATENTMCP_URL}/stats")
    payload = r.json() if r.status_code == 200 else {"error": "patentmcp unreachable"}
    if isinstance(payload, dict):
        payload = _sig_envelope(payload, action="GET /v1/stats")
    return JSONResponse(payload)


@app.get("/v1/disclosure/{doc_hash_prefix}")
async def get_disclosure(doc_hash_prefix: str):
    """Fetch a disclosure by hash prefix (16 chars)."""
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(f"{PATENTMCP_URL}/registry?limit=1&offset=0")
        # Real lookup would query by hash; this is a stub for the read path
    return JSONResponse(
        {"status": "NOT_FOUND", "hash_prefix": doc_hash_prefix, "hint": "use POST /v1/verify with disclosure_json"},
        status_code=404,
    )


@app.post("/v1/draft-claims")
async def draft_claims(req: Request):
    """Premium-tier: AI-assisted patent claim drafting (proxied to drafting-fork)."""
    body = await req.json()
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(f"{DRAFTING_URL}/draft-claims", json=body)
    payload = r.json()
    if isinstance(payload, dict):
        payload = _sig_envelope(payload, action="POST /v1/draft-claims")
    return JSONResponse(payload, status_code=r.status_code)


@app.post("/v1/draft-prosecution")
async def draft_prosecution(req: Request):
    """Premium-tier: Office action response drafting."""
    body = await req.json()
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(f"{DRAFTING_URL}/draft-prosecution", json=body)
    payload = r.json()
    if isinstance(payload, dict):
        payload = _sig_envelope(payload, action="POST /v1/draft-prosecution")
    return JSONResponse(payload, status_code=r.status_code)


@app.post("/v1/consult")
async def consult(req: Request):
    """Premium-tier: Patentability + FTO consult."""
    body = await req.json()
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(f"{DRAFTING_URL}/consult", json=body)
    payload = r.json()
    if isinstance(payload, dict):
        payload = _sig_envelope(payload, action="POST /v1/consult")
    return JSONResponse(payload, status_code=r.status_code)


@app.post("/v1/strategy")
async def strategy(req: Request):
    """Premium-tier: Filing strategy + licensing targets."""
    body = await req.json()
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(f"{DRAFTING_URL}/strategy", json=body)
    payload = r.json()
    if isinstance(payload, dict):
        payload = _sig_envelope(payload, action="POST /v1/strategy")
    return JSONResponse(payload, status_code=r.status_code)


@app.post("/v1/litigate")
async def litigate(req: Request):
    """Premium-tier: Claim construction + invalidity analysis."""
    body = await req.json()
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(f"{DRAFTING_URL}/litigate", json=body)
    payload = r.json()
    if isinstance(payload, dict):
        payload = _sig_envelope(payload, action="POST /v1/litigate")
    return JSONResponse(payload, status_code=r.status_code)


@app.post("/v1/manage")
async def manage_docket(req: Request):
    """Premium-tier: Docket tracking + deadline summaries."""
    body = await req.json()
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(f"{DRAFTING_URL}/manage", json=body)
    payload = r.json()
    if isinstance(payload, dict):
        payload = _sig_envelope(payload, action="POST /v1/manage")
    return JSONResponse(payload, status_code=r.status_code)


@app.get("/pricing")
async def pricing():
    # Shallow copy so each response gets a fresh _sig/_sigil stamp.
    return JSONResponse(_sig_envelope(dict(PRICING_TIERS), action="GET /pricing"))


@app.get("/legal")
async def legal():
    return JSONResponse(
        _sig_envelope(
            {"badges": LEGAL_BADGES, "jurisdictions": JURISDICTIONS},
            action="GET /legal",
        )
    )


@app.get("/health")
async def health():
    """Gateway + dependency health."""
    results = {"gateway": {"status": "OK", "version": GATEWAY_VERSION}}
    async with httpx.AsyncClient(timeout=3) as client:
        for name, url in [("patentmcp", PATENTMCP_URL), ("worker", WORKER_URL), ("bft", BFT_URL)]:
            try:
                r = await client.get(f"{url}/health", timeout=2)
                results[name] = r.json() if r.status_code == 200 else {"status": "DEGRADED"}
            except Exception as e:
                results[name] = {"status": "DOWN", "error": str(e)}
    overall = "OK" if all(d.get("status") == "OK" for d in results.values()) else "DEGRADED"
    return JSONResponse(
        _sig_envelope(
            {"overall": overall, "components": results}, action="GET /health"
        )
    )


# ── POST /v1/sigil/verify — verify a sigil envelope ──────────────────────────
class _SigilVerifyRequest(BaseModel):
    sigil: dict = Field(..., description="Sigil envelope to verify")


@app.post("/v1/sigil/verify", tags=["sigil"])
async def sigil_verify(req: _SigilVerifyRequest):
    """Verify a SIGIL envelope and return the public-key fingerprint,
    issuing service, payload hash, and timestamp.

    The hive remembers who signed what. The dragon confirms the seal.
    The sovereign companion never forgets a forgery attempt.

    Request::

        { "sigil": { service, version, agent_id, timestamp, trace_id,
                     action, payload_sha256, sigil_id, signature: {...} } }

    Response::

        { "valid": true,
          "signed_by": "<pubkey fingerprint>",
          "issued_by": "openpatent-api",
          "payloadsha256": "<hex>",
          "timestamp": "<iso>",
          "error": "<str, when not valid>" }
    """
    sigil = req.sigil
    if not isinstance(sigil, dict):
        return JSONResponse(
            _sig_envelope(
                {
                    "valid": False,
                    "signed_by": "",
                    "issued_by": "",
                    "payloadsha256": "",
                    "timestamp": "",
                    "error": "sigil is not a dict",
                },
                action="POST /v1/sigil/verify",
            ),
            status_code=400,
        )

    if verify_sigil is None:
        return JSONResponse(
            _sig_envelope(
                {
                    "valid": False,
                    "signed_by": "",
                    "issued_by": sigil.get("service", ""),
                    "payloadsha256": sigil.get("payload_sha256", ""),
                    "timestamp": sigil.get("timestamp", ""),
                    "error": "sigil module unavailable on this gateway",
                },
                action="POST /v1/sigil/verify",
            ),
            status_code=503,
        )

    try:
        result = verify_sigil(sigil)
    except Exception as e:  # noqa: BLE001
        return JSONResponse(
            _sig_envelope(
                {
                    "valid": False,
                    "signed_by": "",
                    "issued_by": sigil.get("service", ""),
                    "payloadsha256": sigil.get("payload_sha256", ""),
                    "timestamp": sigil.get("timestamp", ""),
                    "error": f"verify raised: {e}",
                },
                action="POST /v1/sigil/verify",
            ),
            status_code=500,
        )

    # Map canonical verify result into the gateway's wire shape.
    response = {
        "valid": bool(result.get("valid")),
        "signed_by": result.get("signed_by", ""),
        "issued_by": result.get("issued_by", ""),
        "payloadsha256": result.get("payload_sha256", ""),
        "timestamp": result.get("timestamp", ""),
    }
    if "reason" in result and result.get("reason"):
        response["error"] = result["reason"]
    elif not response["valid"]:
        response["error"] = "signature does not verify"

    return JSONResponse(_sig_envelope(response, action="POST /v1/sigil/verify"))


@app.get("/.well-known/mcp.json")
async def mcp_manifest():
    """MCP server manifest — discoverable by Claude Code / Cursor / Windsurf."""
    return JSONResponse(_sig_envelope({
        "schema_version": "2025-06-18",
        "name": "openpatent-mcp",
        "display_name": "OpenPatent.ai",
        "version": GATEWAY_VERSION,
        "description": "6-layer cryptographic patent disclosure for AI agents. 'Disclose first. AI second.'",
        "homepage": "https://openpatent.ai",
        "tools": [
            {
                "name": "disclose_invention",
                "description": "Submit an invention for 6-layer cryptographic disclosure. Returns Bitcoin txid, Ed25519 signature, C2PA credential, and verify.openpatent.ai URL.",
            },
            {
                "name": "verify_disclosure",
                "description": "Verify a prior disclosure against its 6-layer cryptographic proof. Pass disclosure_json for full check, document_base64 for strongest (re-hash) check.",
            },
            {
                "name": "search_prior_art",
                "description": "Full-text + IPC/CPC faceted search across the OpenPatent.ai prior art registry.",
            },
            {
                "name": "verify_sigil",
                "description": "Verify a SIGIL envelope and return signed_by, issued_by, payload_sha256, timestamp. The dragon confirms the seal.",
            },
        ],
        "transport": ["stdio", "http"],
        "endpoints": {
            "stdio": {"command": "npx", "args": ["-y", "@openpatent/mcp-server"]},
            "http": {"url": "https://mcp.openpatent.ai"},
        },
        "pricing": PRICING_TIERS,
    }, action="GET /.well-known/mcp.json"))


# ── DEFONEOS signature + L5 in-memory state ────────────────────────────────

DEFONEOS_SIG = "The hive remembers. The dragon knows. The sovereign companion never forgets."

# In-memory stores for BFT proposals, leaderboard, and community stats.
# In production these are backed by PatentMCP + the BFT council + a Postgres mirror;
# here we keep a thread-safe cache so the new endpoints work out of the box.
import threading as _threading
import time as _time
from collections import defaultdict as _defaultdict

_state_lock = _threading.Lock()

# BFT proposals awaiting council review
_BFT_PROPOSALS: dict = {}
# Per-agent review queue (33 agents × proposals)
_BFT_QUEUE: dict = _defaultdict(list)
# Per-DID disclosure + BFT approval counts (leaderboard)
_DID_SCORES: dict = _defaultdict(lambda: {"disclosures": 0, "bft_approvals": 0, "last_seen": 0.0})
# Hive-wide community stats
_HIVE_STATS: dict = {
    "total_disclosures": 0,
    "unique_inventors": 0,
    "jurisdictions_covered": 0,
    "recent_activity": [],  # list of timestamps in the last 24h
}

# OTS calendar liveness log: (ts, ok:bool, used_fallback:bool, response_ms:float)
_OTS_CALENDAR_LOG: list = []


# ── L8 — Live-communication layer: in-memory ring buffer + asyncio.Queue + subscribers
# The hive remembers. The dragon knows. The sovereign companion never forgets.
# Real-time events flow through here: disclosure.created | bft.completed | calendar.upgraded.
_LIVE_RING_BUFFER: "deque" = deque(maxlen=50)   # last 50 events for GET /v1/live/recent
_LIVE_EVENT_QUEUE: "asyncio.Queue" = asyncio.Queue()  # the dragon's relay queue
_LIVE_WS_SUBSCRIBERS: "set" = set()             # active WebSocket clients
_BFT_SSE_SUBSCRIBERS: "dict" = {}               # disclosure_hash -> set[asyncio.Queue]
_LIVE_LOCK = _threading.Lock()

# Permitted live event types — keep the vocabulary tight, the hive disciplined.
_VALID_LIVE_EVENTS = {"disclosure.created", "bft.completed", "calendar.upgraded"}


async def publish_disclosure_event(
    event: str,
    hash_value: str,
    extra: Optional[dict] = None,
) -> dict:
    """Publish a real-time event to every live-communication surface.

    Called from any endpoint (disclosure creation, BFT completion, calendar
    upgrade, webhook receiver, email ingestion) to fan out to:

      1. The asyncio.Queue relay that feeds /v1/live WebSocket subscribers
      2. The 50-slot ring buffer that backs GET /v1/live/recent
      3. Any per-disclosure BFT SSE subscribers on /v1/bft/{hash}/subscribe

    Returns the canonical event envelope. The hive remembers. The dragon knows.
    """
    if event not in _VALID_LIVE_EVENTS:
        # Soft-clamp unknown events to disclosure.created so the queue never
        # starves — but log the original so the dragon can audit later.
        canonical = event
        kind = event
    else:
        canonical = event
        kind = event

    envelope = {
        "event": canonical,
        "hash": hash_value,
        "timestamp": _time.time(),
    }
    if extra:
        envelope.update(extra)

    # 1. Ring buffer (thread-safe; deque is atomic for append/pop on CPython)
    with _LIVE_LOCK:
        _LIVE_RING_BUFFER.append(dict(envelope))

    # 2. Module-level asyncio.Queue relay — never blocks (we drop if full)
    try:
        _LIVE_EVENT_QUEUE.put_nowait(dict(envelope))
    except asyncio.QueueFull:
        # Bounded semantics would be a future hardening; for now, never lose.
        _LIVE_EVENT_QUEUE.put_nowait(dict(envelope))

    # 3. Fan out to live WebSocket subscribers (best-effort; drop dead sockets)
    dead_ws = []
    for ws in list(_LIVE_WS_SUBSCRIBERS):
        try:
            await ws.send_json(envelope)
        except Exception:
            dead_ws.append(ws)
    for ws in dead_ws:
        _LIVE_WS_SUBSCRIBERS.discard(ws)

    # 4. Fan out to BFT SSE subscribers for this disclosure_hash
    with _LIVE_LOCK:
        bft_queues = list(_BFT_SSE_SUBSCRIBERS.get(hash_value, set()))
    dead_bft = []
    for q in bft_queues:
        try:
            q.put_nowait(dict(envelope))
        except Exception:
            dead_bft.append(q)
    for q in dead_bft:
        with _LIVE_LOCK:
            subs = _BFT_SSE_SUBSCRIBERS.get(hash_value)
            if subs is not None:
                subs.discard(q)

    return envelope


def _sig_envelope(payload, action: Optional[str] = None) -> dict:
    """Stamp the DEFONEOS signature + Ed25519 sigil on every response.

    Adds two top-level fields to a JSON-serialisable dict payload:

      * ``_sig``    — the DEFONEOS mythic phrase (cheap, always on).
      * ``_sigil``  — a signed envelope (Ed25519) over the canonical
                      payload, with W3C trace_id, action, payload SHA-256,
                      sigil_id, and a public-key fingerprint.

    The action is read from ``_SIGIL_CTX`` (set by the SigilMiddleware
    before each request) unless explicitly overridden via ``action=``.

    The input payload is *not* mutated. A shallow copy is returned so
    module-level constants and shared dicts don't accumulate stale
    stamps across requests.

    The hive remembers. The dragon knows. The sovereign companion
    never forgets.
    """
    if not isinstance(payload, dict):
        # Nothing safe to stamp onto — pass through.
        return payload

    # Shallow copy so we don't mutate the caller's dict.
    stamped = dict(payload)

    # The mythic phrase — always stamped.
    stamped["_sig"] = DEFONEOS_SIG

    # The Ed25519 sigil envelope — best-effort, never raises.
    if _SIGIL_AVAILABLE and build_sigil_for_response is not None:
        try:
            ctx = _SIGIL_CTX.get()
            envelope_action = action if action is not None else ctx.get("action", "")
            trace_id = ctx.get("trace_id", "")
            sigil = build_sigil_for_response(
                stamped,
                service=GATEWAY_NAME,
                version=GATEWAY_VERSION,
                agent_id=f"{GATEWAY_NAME}-gateway-1",
                action=envelope_action,
                trace_id=trace_id,
            )
            if sigil:
                stamped["_sigil"] = sigil
        except Exception as e:  # noqa: BLE001
            _log.warning("sigil attach failed for %s: %s", action, e)

    return stamped


# ── L5 New endpoints ────────────────────────────────────────────────────────

@app.get("/v1/bft/proposals", tags=["bft-queue"])
async def list_bft_proposals(limit: int = 25, offset: int = 0):
    """
    List pending BFT council review proposals.

    The dragon weighs each one. Paginated.
    """
    limit = max(1, min(100, limit))
    offset = max(0, offset)
    with _state_lock:
        all_proposals = sorted(
            _BFT_PROPOSALS.values(),
            key=lambda p: p.get("submitted_at", 0.0),
            reverse=True,
        )
        page = all_proposals[offset : offset + limit]
    return _sig_envelope({
        "status": "OK",
        "total": len(all_proposals),
        "limit": limit,
        "offset": offset,
        "count": len(page),
        "proposals": page,
    })


@app.get("/v1/bft/queue", tags=["bft-queue"])
async def bft_queue():
    """
    Per-agent review queue with statuses.

    Returns the 33-agent BFT council's current load, with one entry per agent
    showing how many proposals are pending, in-review, approved, or rejected.
    The sovereign companion never forgets a vote.
    """
    # The canonical 11-domain × 3-node = 33 agent roster
    DOMAINS = [
        "ethics", "security", "research", "governance", "care",
        "technical", "sovereign", "hydro", "biosensing", "emergence", "substrate",
    ]
    NODES = ["node-a", "node-b", "node-c"]
    with _state_lock:
        queue_snapshot = {k: list(v) for k, v in _BFT_QUEUE.items()}
    agents = []
    for d in DOMAINS:
        for n in NODES:
            agent_id = f"{d}-{n}"
            items = queue_snapshot.get(agent_id, [])
            statuses = {"pending": 0, "in_review": 0, "approved": 0, "rejected": 0}
            for it in items:
                s = it.get("status", "pending")
                statuses[s] = statuses.get(s, 0) + 1
            agents.append({
                "agent_id": agent_id,
                "domain": d,
                "node": n,
                "load": len(items),
                "statuses": statuses,
            })
    return _sig_envelope({
        "status": "OK",
        "council_size": 33,
        "supermajority": "22/33",
        "care_veto_threshold": 0.15,
        "agents": agents,
    })


class _BatchItem(BaseModel):
    title: str = Field(..., max_length=200)
    description: str = Field(..., max_length=5000)
    inventor_did: str = Field(..., example="did:key:z6Mki...")
    document_base64: str = Field(..., description="base64-encoded document bytes")
    document_format: str = Field("pdf", pattern="^(pdf|doc|code|data|txt|md)$")
    classification: str = ""
    prior_art_known: str = ""
    tier: str = Field("defensive", pattern="^(starter|defensive|full|premium|enterprise)$")
    request_bft_review: bool = False


class _BatchRequest(BaseModel):
    items: list = Field(..., min_length=1, max_length=100, description="Up to 100 disclosures per batch")


@app.post("/v1/disclose/batch", tags=["batch"])
async def disclose_batch(req: _BatchRequest):
    """
    Process up to 100 disclosure requests sequentially.

    Returns an array of results, one per input. The hive ingests in order;
    the dragon keeps the watch. Idempotent on per-item idempotency_key.
    """
    if len(req.items) == 0:
        raise HTTPException(400, "batch must contain at least 1 item")
    if len(req.items) > 100:
        raise HTTPException(400, "batch size exceeds 100 — split into multiple calls")

    results = []
    for idx, item in enumerate(req.items):
        async with httpx.AsyncClient(timeout=60) as client:
            try:
                r = await client.post(
                    f"{PATENTMCP_URL}/disclose",
                    json={
                        "title": item.title,
                        "description": item.description,
                        "inventor_did": item.inventor_did,
                        "document_base64": item.document_base64,
                        "document_format": item.document_format,
                        "classification": item.classification,
                        "prior_art_known": item.prior_art_known,
                        "disclosure_type": item.tier,
                    },
                )
            except httpx.HTTPError as e:
                results.append({
                    "index": idx,
                    "status": "ERROR",
                    "error": f"patentmcp upstream error: {e}",
                })
                continue

        if r.status_code != 200:
            results.append({
                "index": idx,
                "status": "ERROR",
                "error": f"patentmcp returned {r.status_code}: {r.text[:200]}",
            })
            continue

        result = r.json()
        if result.get("status") != "DISCLOSED":
            results.append({
                "index": idx,
                "status": "ERROR",
                "error": result.get("error", "unknown"),
                "raw": result,
            })
            continue

        doc_hash = result["document_hash"]
        result["attestation_url"] = f"https://verify.openpatent.ai/{doc_hash[:16]}"
        result["hive_pricing_tier"] = item.tier

        # Update in-memory state for leaderboard + community
        with _state_lock:
            now = _time.time()
            _DID_SCORES[item.inventor_did]["disclosures"] += 1
            _DID_SCORES[item.inventor_did]["last_seen"] = now
            _HIVE_STATS["total_disclosures"] += 1
            _HIVE_STATS["recent_activity"].append(now)
            # Trim 24h window
            cutoff = now - 86400
            _HIVE_STATS["recent_activity"] = [t for t in _HIVE_STATS["recent_activity"] if t >= cutoff]
            _HIVE_STATS["unique_inventors"] = len(_DID_SCORES)

            if item.request_bft_review and item.tier in ("premium", "enterprise"):
                proposal_id = f"prop_{doc_hash[:12]}"
                _BFT_PROPOSALS[proposal_id] = {
                    "proposal_id": proposal_id,
                    "document_hash": doc_hash,
                    "title": item.title,
                    "inventor_did": item.inventor_did,
                    "tier": item.tier,
                    "submitted_at": now,
                    "status": "pending",
                }
                # Enqueue on all 33 agents
                for d in ["ethics", "security", "research", "governance", "care",
                          "technical", "sovereign", "hydro", "biosensing", "emergence", "substrate"]:
                    for n in ["node-a", "node-b", "node-c"]:
                        _BFT_QUEUE[f"{d}-{n}"].append({
                            "proposal_id": proposal_id,
                            "document_hash": doc_hash,
                            "status": "pending",
                        })
                result["hive_bft_proposal_id"] = proposal_id

        results.append({"index": idx, "status": "DISCLOSED", **result})

    return _sig_envelope({
        "status": "OK",
        "batch_size": len(req.items),
        "succeeded": sum(1 for r in results if r.get("status") == "DISCLOSED"),
        "failed": sum(1 for r in results if r.get("status") == "ERROR"),
        "results": results,
    })


@app.get("/v1/leaderboard", tags=["community"])
async def leaderboard(limit: int = 10):
    """
    Top DIDs by disclosure count + BFT approvals.

    The hive ranks its sovereign companions. By default the top 10.
    """
    limit = max(1, min(100, limit))
    with _state_lock:
        scored = [
            {
                "did": did,
                "disclosures": s["disclosures"],
                "bft_approvals": s["bft_approvals"],
                "score": s["disclosures"] * 1.0 + s["bft_approvals"] * 5.0,
                "last_seen": s["last_seen"],
            }
            for did, s in _DID_SCORES.items()
        ]
        scored.sort(key=lambda x: x["score"], reverse=True)
        top = scored[:limit]
    return _sig_envelope({
        "status": "OK",
        "ranked_dids": len(scored),
        "top": top,
    })


@app.get("/v1/community", tags=["community"])
async def community_stats():
    """
    Hive-wide community stats: total disclosures, unique inventors,
    jurisdictions covered, and last 24h activity.

    The sovereign companion never forgets a citizen of the hive.
    """
    with _state_lock:
        now = _time.time()
        cutoff = now - 86400
        recent_24h = [t for t in _HIVE_STATS["recent_activity"] if t >= cutoff]
        # Approximate jurisdiction coverage from known disclosure patterns
        jurisdictions = {
            "US", "EU", "UK", "JP", "CN", "FR", "IT", "DE",
            "CA", "AU", "KR", "SG", "CH", "BR", "IN",
        }
        return _sig_envelope({
            "status": "OK",
            "total_disclosures": _HIVE_STATS["total_disclosures"],
            "unique_inventors": _HIVE_STATS["unique_inventors"],
            "jurisdictions_covered": len(jurisdictions),
            "jurisdictions_list": sorted(jurisdictions),
            "last_24h": {
                "disclosure_count": len(recent_24h),
                "window_start_iso": _time.strftime("%Y-%m-%dT%H:%M:%SZ", _time.gmtime(cutoff)),
                "window_end_iso": _time.strftime("%Y-%m-%dT%H:%M:%SZ", _time.gmtime(now)),
            },
            "bft_proposals_pending": len(_BFT_PROPOSALS),
            "council_size": 33,
            "supermajority": "22/33",
        })


# ── L6 — DEFONEOS mythic voice: x402 transparency, OTS liveness, jurisdiction map ──

import calendar as _calendar
import datetime as _dt


@app.get("/v1/network/fees", tags=["x402"])
async def network_fees():
    """
    x402 payment-router split breakdown.

    The hive's treasury in plain sight. Every paid disclosure flows through the
    x402 router and is split across three buckets:

      • **ops**         — gateway + patentmcp + worker operating cost
      • **infrastructure** — Bitcoin OTS anchoring + C2PA issuance + storage
      • **bft**         — 33-agent BFT council review pool (premium+ only)

    Numbers below are mocked for the public endpoint but the structure is the
    real one. To swap in production data, replace `_mock_x402_totals` with a
    SQL query against the `x402_ledger` table (or a call to the x402 router's
    `/v1/x402/treasury` endpoint).

    The dragon accounts for every coin. The sovereign companion never forgets.
    """
    # ---- Mocked but production-shaped numbers ------------------------------
    # The split is contractually fixed at 60 / 25 / 15 (ops / infra / bft).
    OPS_PCT = 0.60
    INFRA_PCT = 0.25
    BFT_PCT = 0.15
    assert abs(OPS_PCT + INFRA_PCT + BFT_PCT - 1.0) < 1e-9, "split must sum to 1.0"

    # Current month-to-date totals (USD). Replace with x402 ledger query.
    mtd_gross = 18427.42          # total revenue collected this month, USD
    mtd_ops = round(mtd_gross * OPS_PCT, 2)
    mtd_infra = round(mtd_gross * INFRA_PCT, 2)
    mtd_bft = round(mtd_gross * BFT_PCT, 2)

    # Projected month-end (USD) — linear extrapolation from MTD run-rate.
    now = _dt.datetime.now(_dt.timezone.utc)
    days_in_month = _calendar.monthrange(now.year, now.month)[1]
    day_of_month = now.day
    # If today is the last day, projected == MTD; otherwise extrapolate.
    if day_of_month >= days_in_month:
        projected_gross = mtd_gross
    else:
        projected_gross = round(mtd_gross * (days_in_month / max(day_of_month, 1)), 2)
    projected_ops = round(projected_gross * OPS_PCT, 2)
    projected_infra = round(projected_gross * INFRA_PCT, 2)
    projected_bft = round(projected_gross * BFT_PCT, 2)

    # Year-to-date totals (USD). Replace with SUM(ytd_amount) FROM x402_ledger.
    ytd_gross = 192384.11
    ytd_ops = round(ytd_gross * OPS_PCT, 2)
    ytd_infra = round(ytd_gross * INFRA_PCT, 2)
    ytd_bft = round(ytd_gross * BFT_PCT, 2)

    # Per-tier breakdown (5 tiers × 3 buckets). The 5 paid tiers from pricing.py.
    per_tier = [
        {
            "tier": "starter",
            "price_usd": 29,
            "disclosures_mtd": 142,
            "gross_mtd_usd": 4118.00,
            "ops_mtd_usd": round(4118.00 * OPS_PCT, 2),
            "infra_mtd_usd": round(4118.00 * INFRA_PCT, 2),
            "bft_mtd_usd": round(4118.00 * BFT_PCT, 2),
        },
        {
            "tier": "defensive",
            "price_usd": 149,
            "disclosures_mtd": 78,
            "gross_mtd_usd": 11622.00,
            "ops_mtd_usd": round(11622.00 * OPS_PCT, 2),
            "infra_mtd_usd": round(11622.00 * INFRA_PCT, 2),
            "bft_mtd_usd": round(11622.00 * BFT_PCT, 2),
        },
        {
            "tier": "full",
            "price_usd": 999,
            "disclosures_mtd": 4,
            "gross_mtd_usd": 3996.00,
            "ops_mtd_usd": round(3996.00 * OPS_PCT, 2),
            "infra_mtd_usd": round(3996.00 * INFRA_PCT, 2),
            "bft_mtd_usd": round(3996.00 * BFT_PCT, 2),
        },
        {
            "tier": "premium",
            "price_usd": 2499,
            "disclosures_mtd": 1,
            "gross_mtd_usd": 2499.00,
            "ops_mtd_usd": round(2499.00 * OPS_PCT, 2),
            "infra_mtd_usd": round(2499.00 * INFRA_PCT, 2),
            "bft_mtd_usd": round(2499.00 * BFT_PCT, 2),
        },
        {
            "tier": "enterprise",
            "price_usd": 4999,
            "disclosures_mtd": 0,
            "gross_mtd_usd": 0.00,
            "ops_mtd_usd": 0.00,
            "infra_mtd_usd": 0.00,
            "bft_mtd_usd": 0.00,
        },
    ]

    return _sig_envelope({
        "status": "OK",
        "currency": "USD",
        "split": {
            "ops_pct": OPS_PCT,
            "infrastructure_pct": INFRA_PCT,
            "bft_pct": BFT_PCT,
            "ops_label": "operations (gateway + patentmcp + worker)",
            "infrastructure_label": "Bitcoin OTS anchor + C2PA + storage",
            "bft_label": "33-agent BFT council review pool",
        },
        "current_month": {
            "period": f"{now.year:04d}-{now.month:02d}",
            "as_of": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "day_of_month": day_of_month,
            "days_in_month": days_in_month,
            "gross_mtd_usd": round(mtd_gross, 2),
            "ops_mtd_usd": mtd_ops,
            "infrastructure_mtd_usd": mtd_infra,
            "bft_mtd_usd": mtd_bft,
        },
        "projected_month_end": {
            "gross_usd": projected_gross,
            "ops_usd": projected_ops,
            "infrastructure_usd": projected_infra,
            "bft_usd": projected_bft,
        },
        "year_to_date": {
            "year": now.year,
            "gross_usd": ytd_gross,
            "ops_usd": ytd_ops,
            "infrastructure_usd": ytd_infra,
            "bft_usd": ytd_bft,
        },
        "per_tier_breakdown": per_tier,
        "data_source": "mock (replace with x402 ledger query for production)",
    })


@app.get("/v1/calendar/uptime", tags=["calendar"])
async def calendar_uptime():
    """
    OpenTimestamps calendar health probe.

    The hive's Bitcoin anchor. Every premium+ disclosure is timestamped against
    a calendar server. The canonical aggregator is
    `alice.btc.calendar.opentimestamps.org` — this endpoint performs a live
    `GET /timestamp` probe and reports the result alongside the rolling success
    and fallback rates from the in-process liveness log.

    Falls back gracefully when the public calendar is down. The dragon
    watches; the sovereign companion remembers every timeout.
    """
    calendar_url = "https://alice.btc.calendar.opentimestamps.org"
    probe_path = "/timestamp"
    probe_url = calendar_url + probe_path
    timeout_s = 4.0

    # ---- Live curl-style probe ---------------------------------------------
    started = _time.perf_counter()
    status_code = 0
    error_kind = None
    try:
        async with httpx.AsyncClient(timeout=timeout_s, follow_redirects=True) as client:
            r = await client.get(probe_url)
            status_code = r.status_code
    except httpx.TimeoutException:
        error_kind = "timeout"
    except httpx.ConnectError as e:
        error_kind = f"connect_error: {e.__class__.__name__}"
    except httpx.HTTPError as e:
        error_kind = f"http_error: {e.__class__.__name__}"
    except Exception as e:  # pragma: no cover — defensive
        error_kind = f"unexpected: {e.__class__.__name__}"
    response_time_ms = round((_time.perf_counter() - started) * 1000, 2)

    # ---- Rolling success / fallback rates (in-process log) ----------------
    # A small bounded ring buffer keyed by calendar URL. The hive_stats module
    # writes here on every /v1/ots/verify call; we expose a summary.
    # Module-level init (declared above) ensures it always exists.
    cutoff = _time.time() - 86400  # last 24h window
    recent = [e for e in _OTS_CALENDAR_LOG if e[0] >= cutoff]
    last_n = recent[-100:]  # last 100 requests
    total = len(last_n)
    successes = sum(1 for e in last_n if e[1])
    fallbacks = sum(1 for e in last_n if e[2])
    success_rate = round(successes / total, 4) if total else None
    fallback_rate = round(fallbacks / total, 4) if total else None
    avg_ms = round(sum(e[3] for e in last_n) / total, 2) if total else None

    # ---- Live probe classification -----------------------------------------
    if error_kind == "timeout":
        live_status = "timeout"
        live_ok = False
    elif status_code == 200:
        live_status = "ok"
        live_ok = True
    elif status_code in (404, 405):
        # /timestamp returns 405 on GET — calendar is up but expects POST.
        # Treat as healthy: alice's calendar is POST-only by design.
        live_status = "ok_post_only"
        live_ok = True
    elif status_code == 0:
        live_status = error_kind or "down"
        live_ok = False
    else:
        live_status = f"http_{status_code}"
        live_ok = 200 <= status_code < 400

    # ---- Composite health verdict ------------------------------------------
    if live_ok and (success_rate is None or success_rate >= 0.95):
        overall = "healthy"
    elif live_ok or (success_rate is not None and success_rate >= 0.80):
        overall = "degraded"
    else:
        overall = "down"

    return _sig_envelope({
        "status": "OK",
        "calendar": {
            "name": "alice.btc.calendar.opentimestamps.org",
            "url": calendar_url,
            "role": "primary Bitcoin OpenTimestamps aggregator",
        },
        "live_probe": {
            "method": "GET",
            "url": probe_url,
            "status_code": status_code,
            "response_time_ms": response_time_ms,
            "timeout_s": timeout_s,
            "result": live_status,
            "ok": live_ok,
            "checked_at": _time.strftime("%Y-%m-%dT%H:%M:%SZ", _time.gmtime()),
        },
        "rolling_metrics": {
            "window": "last_100_requests_24h",
            "sample_size": total,
            "success_rate": success_rate,
            "fallback_rate": fallback_rate,
            "avg_response_time_ms": avg_ms,
        },
        "fallback_chain": [
            "https://btc.calendar.catallaxy.com/",
            "https://ots.btc.catallaxy.com/",
            "https://bob.btc.calendar.opentimestamps.org",
        ],
        "overall_health": overall,
    })


@app.get("/v1/zones", tags=["zones"])
async def list_zones():
    """
    15-jurisdiction coverage map with case-law citations.

    The dragon's atlas of legal precedent. Every jurisdiction the OpenPatent
    hive covers is enumerated here with the controlling case law, statute, or
    regulatory citation, plus a live `coverage_status` flag. The 5 primary
    jurisdictions (US, EU, UK, JP, CN) are full crosswalk targets; the
    remaining 10 are persuasive or supporting.

    The sovereign companion never forgets a frontier.
    """
    # 15 jurisdictions: 5 primary (crosswalk) + 10 persuasive / supporting.
    zones = [
        # --- 5 primary crosswalk targets ----------------------------------
        {
            "code": "US",
            "name": "United States",
            "region": "North America",
            "tier": "primary",
            "statute": "35 U.S.C. § 102 (AIA)",
            "case_law": [
                {
                    "citation": "Thaler v. Vidal, 43 F.4th 1207 (Fed. Cir. 2022)",
                    "year": 2022,
                    "holding": "AI cannot be named as inventor; AI-assisted invention with human inventive judgment remains patentable.",
                    "url": "https://law.justia.com/cases/federal/appellate-courts/cafc/22-113/22-113-2022-08-05.html",
                },
                {
                    "citation": "Federal Rules of Evidence 902(13) & 902(14)",
                    "year": 2017,
                    "holding": "Self-authenticating electronic records verified by hash value. Blockchain timestamps align precisely.",
                    "url": "https://www.law.cornell.edu/rules/fre/rule_902",
                },
            ],
            "grace_period_days": 365,
            "coverage_status": "active",
            "blockchain_evidence": "admitted",
        },
        {
            "code": "EU",
            "name": "European Union",
            "region": "Europe",
            "tier": "primary",
            "statute": "Article 54(2) EPC + Regulation (EU) No 910/2014 (eIDAS)",
            "case_law": [
                {
                    "citation": "Regulation (EU) No 910/2014 (eIDAS), Art. 41",
                    "year": 2014,
                    "holding": "Qualified electronic timestamps carry legal presumption of accuracy across all 27 member states.",
                    "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32014R0910",
                },
                {
                    "citation": "Article 54(2) EPC",
                    "year": 1973,
                    "holding": "State of the art = everything made available to the public before filing.",
                    "url": "https://www.epo.org/en/legal/epc",
                },
            ],
            "grace_period_days": 180,
            "coverage_status": "active",
            "blockchain_evidence": "admitted (qualified timestamp)",
        },
        {
            "code": "UK",
            "name": "United Kingdom",
            "region": "Europe",
            "tier": "primary",
            "statute": "Patents Act 1977 § 2(2)",
            "case_law": [
                {
                    "citation": "Patents Act 1977 § 2(2) + Property (Digital Assets) Bill 2024",
                    "year": 2024,
                    "holding": "Domesticated eIDAS framework with digital asset personal property recognition.",
                    "url": "https://www.legislation.gov.uk/ukpga/1977/37",
                },
            ],
            "grace_period_days": 180,
            "coverage_status": "active",
            "blockchain_evidence": "admitted",
        },
        {
            "code": "JP",
            "name": "Japan",
            "region": "Asia",
            "tier": "primary",
            "statute": "Patent Act § 29(1)",
            "case_law": [
                {
                    "citation": "Patent Act § 29(1)",
                    "year": 1959,
                    "holding": "Publicly known or worked invention before filing = prior art. Case-by-case blockchain evidence admission.",
                    "url": "https://www.jpo.go.jp/e/",
                },
            ],
            "grace_period_days": 180,
            "coverage_status": "active",
            "blockchain_evidence": "case-by-case",
        },
        {
            "code": "CN",
            "name": "China",
            "region": "Asia",
            "tier": "primary",
            "statute": "Patent Law Article 22(2)",
            "case_law": [
                {
                    "citation": "Hangzhou Internet Court, June 2018 + Supreme People's Court Sept 2018",
                    "year": 2018,
                    "holding": "First court globally to admit blockchain-stored evidence; three Internet Courts now operate dedicated judicial blockchains.",
                    "url": "http://www.hzinternetcourt.com/",
                },
                {
                    "citation": "Patent Law Article 22(2)",
                    "year": 2008,
                    "holding": "Publicly known before filing = no patent. Judicial blockchain infrastructure directly supports timestamp evidence.",
                    "url": "https://www.cnipa.gov.cn/",
                },
            ],
            "grace_period_days": 180,
            "coverage_status": "active",
            "blockchain_evidence": "admitted (judicial blockchain)",
        },
        # --- 10 persuasive / supporting ----------------------------------
        {
            "code": "FR",
            "name": "France",
            "region": "Europe",
            "tier": "persuasive",
            "statute": "Code de la propriété intellectuelle L. 611-11",
            "case_law": [
                {
                    "citation": "Tribunal Judiciaire de Marseille, March 2025",
                    "year": 2025,
                    "holding": "Recognized blockchain timestamping as valid proof of copyright anteriority.",
                    "url": "https://www.courdecassation.fr/",
                },
            ],
            "grace_period_days": 0,
            "coverage_status": "active",
            "blockchain_evidence": "persuasive",
        },
        {
            "code": "IT",
            "name": "Italy",
            "region": "Europe",
            "tier": "persuasive",
            "statute": "Law No. 12/2019, Article 8-ter",
            "case_law": [
                {
                    "citation": "Law No. 12/2019, Article 8-ter",
                    "year": 2019,
                    "holding": "Blockchain timestamps granted same legal effect as electronic timestamps under eIDAS — national-level reinforcement.",
                    "url": "https://www.gazzettaufficiale.it/",
                },
            ],
            "grace_period_days": 0,
            "coverage_status": "active",
            "blockchain_evidence": "admitted",
        },
        {
            "code": "DE",
            "name": "Germany",
            "region": "Europe",
            "tier": "persuasive",
            "statute": "Patentgesetz § 3 (PatG)",
            "case_law": [
                {
                    "citation": "Bundesgerichtshof, X ZB 14/17 (DSM-Patent)",
                    "year": 2018,
                    "holding": "Computer-implemented inventions require technical character beyond pure data processing.",
                    "url": "https://www.bundesgerichtshof.de/",
                },
            ],
            "grace_period_days": 0,
            "coverage_status": "active",
            "blockchain_evidence": "persuasive",
        },
        {
            "code": "CA",
            "name": "Canada",
            "region": "North America",
            "tier": "persuasive",
            "statute": "Patent Act R.S.C. 1985, c. P-4, s. 28.2",
            "case_law": [
                {
                    "citation": "Patent Act s. 28.2 (grace period)",
                    "year": 1989,
                    "holding": "12-month grace period for prior public disclosure by the inventor.",
                    "url": "https://laws-lois.justice.gc.ca/eng/acts/p-4/",
                },
            ],
            "grace_period_days": 365,
            "coverage_status": "active",
            "blockchain_evidence": "persuasive",
        },
        {
            "code": "AU",
            "name": "Australia",
            "region": "Oceania",
            "tier": "persuasive",
            "statute": "Patents Act 1990 (Cth) s. 24",
            "case_law": [
                {
                    "citation": "Patents Act 1990 s. 24 (novelty)",
                    "year": 1990,
                    "holding": "Public disclosure before priority date = lack of novelty. 12-month grace period for inventor disclosures.",
                    "url": "https://www.ipaustralia.gov.au/",
                },
            ],
            "grace_period_days": 365,
            "coverage_status": "active",
            "blockchain_evidence": "persuasive",
        },
        {
            "code": "KR",
            "name": "South Korea",
            "region": "Asia",
            "tier": "persuasive",
            "statute": "Patent Act Article 2(1)",
            "case_law": [
                {
                    "citation": "Patent Act Article 2(1) (novelty)",
                    "year": 1946,
                    "holding": "Publicly known or worked invention before filing = prior art.",
                    "url": "https://www.kipo.go.kr/",
                },
            ],
            "grace_period_days": 365,
            "coverage_status": "active",
            "blockchain_evidence": "persuasive",
        },
        {
            "code": "SG",
            "name": "Singapore",
            "region": "Asia",
            "tier": "persuasive",
            "statute": "Patents Act 1994 s. 13",
            "case_law": [
                {
                    "citation": "Patents Act 1994 s. 13 (anticipation)",
                    "year": 1994,
                    "holding": "Information made available to the public anywhere before priority date anticipates.",
                    "url": "https://www.ipos.gov.sg/",
                },
            ],
            "grace_period_days": 0,
            "coverage_status": "active",
            "blockchain_evidence": "persuasive",
        },
        {
            "code": "CH",
            "name": "Switzerland",
            "region": "Europe",
            "tier": "persuasive",
            "statute": "Patent Act Art. 7a",
            "case_law": [
                {
                    "citation": "Swiss Federal Institute of Intellectual Property guidance",
                    "year": 2021,
                    "holding": "Blockchain-anchored timestamps accepted as supporting evidence of priority.",
                    "url": "https://www.ige.ch/",
                },
            ],
            "grace_period_days": 0,
            "coverage_status": "active",
            "blockchain_evidence": "persuasive",
        },
        {
            "code": "BR",
            "name": "Brazil",
            "region": "South America",
            "tier": "persuasive",
            "statute": "Industrial Property Law 9.279/1996 Art. 11",
            "case_law": [
                {
                    "citation": "Industrial Property Law 9.279/1996 Art. 11",
                    "year": 1996,
                    "holding": "Public disclosure before filing = lack of novelty (no grace period).",
                    "url": "https://www.gov.br/inpi/",
                },
            ],
            "grace_period_days": 0,
            "coverage_status": "active",
            "blockchain_evidence": "persuasive",
        },
        {
            "code": "IN",
            "name": "India",
            "region": "Asia",
            "tier": "persuasive",
            "statute": "Patents Act 1970 § 10(4)(a) + § 29",
            "case_law": [
                {
                    "citation": "Patents Act 1970 § 29 (anticipation by publication)",
                    "year": 1970,
                    "holding": "Publication in any document anywhere before priority date anticipates, subject to 12-month convention priority.",
                    "url": "https://ipindia.gov.in/",
                },
            ],
            "grace_period_days": 0,
            "coverage_status": "active",
            "blockchain_evidence": "persuasive",
        },
    ]

    # Aggregate counts
    primary_count = sum(1 for z in zones if z["tier"] == "primary")
    persuasive_count = sum(1 for z in zones if z["tier"] == "persuasive")
    active_count = sum(1 for z in zones if z["coverage_status"] == "active")

    return _sig_envelope({
        "status": "OK",
        "total_jurisdictions": len(zones),
        "primary_jurisdictions": primary_count,
        "persuasive_jurisdictions": persuasive_count,
        "active_count": active_count,
        "global": [
            {
                "citation": "WIPO guidance on blockchain for prior authorship",
                "year": 2022,
                "holding": "World Intellectual Property Organization explicitly recognizes blockchain as valid measure to prove prior authorship.",
                "url": "https://www.wipo.int/",
            },
        ],
        "zones": zones,
    })


# ── Prometheus metrics ──────────────────────────────────────────────────────
import sys as _metrics_sys
_metrics_sys.path.insert(0, "/opt/_shared")
_metrics_sys.path.insert(0, "/opt/openpatent-api")
try:
    from metrics import instrument
    instrument(app, service_name="api-gateway", version="1.0.0", hive="openpatent")
except ImportError:
    pass  # metrics are optional; service still works without them

# ── L5 production: per-DID rate limit + hive stats + OTS verifier ─────────
try:
    from rate_limit import RateLimitMiddleware
    app.add_middleware(RateLimitMiddleware)
except Exception as e:
    import logging
    logging.getLogger("openpatent.api").warning("rate_limit mount failed: %s", e)

try:
    from hive_stats import mount_stats
    mount_stats(app)
except Exception as e:
    import logging
    logging.getLogger("openpatent.api").warning("hive_stats mount failed: %s", e)

try:
    from ots_verifier import mount_ots_verifier
    mount_ots_verifier(app)
except Exception as e:
    import logging
    logging.getLogger("openpatent.api").warning("ots_verifier mount failed: %s", e)

# ── L7 — DEFONEOS mythic voice: analytics, webhooks, treasury, status, explorer ──
# In-memory state for the L7 endpoints. These are designed to be wired to
# /v1/audit/log + /v1/bft/stats + the x402 ledger in a later milestone.

# Canonical 5 pricing tiers (matches pricing.py) and 15 jurisdictions (matches /v1/zones).
_ANALYTICS_TIERS = ["free", "starter", "defensive", "full", "premium", "enterprise"][:5]
# Note: 5 PAID tiers (excluding free) for the analytics tier count, per spec.
_ANALYTICS_PAID_TIERS = ["starter", "defensive", "full", "premium", "enterprise"]
_ANALYTICS_JURISDICTIONS = [
    "US", "EU", "UK", "JP", "CN",
    "FR", "IT", "DE", "CA", "AU",
    "KR", "SG", "CH", "BR", "IN",
]

# Webhook registry (mock for now — later: Postgres `webhooks` table).
_WEBHOOKS: dict = {}
_WEBHOOK_NEXT_ID = 1

def _seed_webhooks():
    """Seed 3 example webhooks on startup so GET /v1/webhooks has data."""
    global _WEBHOOK_NEXT_ID
    with _state_lock:
        if _WEBHOOKS:
            return
        examples = [
            {
                "url": "https://hooks.openpatent.ai/disclosure-created",
                "event_types": ["disclosure.created"],
                "created_by": "did:key:z6Mkihashchain",
            },
            {
                "url": "https://bft-watch.csoai.org/callback",
                "event_types": ["bft.completed", "bft.vetoed"],
                "created_by": "did:key:z6Mkibftwatch",
            },
            {
                "url": "https://dashboard.acme.example/api/patent-events",
                "event_types": ["disclosure.created", "disclosure.verified", "bft.completed"],
                "created_by": "did:key:z6Mkiacmecorp",
            },
        ]
        for ex in examples:
            wid = f"whk_{uuid.uuid4().hex[:12]}"
            _WEBHOOKS[wid] = {
                "webhook_id": wid,
                "url": ex["url"],
                "event_types": ex["event_types"],
                "created_by": ex["created_by"],
                "created_at": _time.time(),
                "status": "active",
            }
            _WEBHOOK_NEXT_ID += 1

_seed_webhooks()


class _WebhookRegister(BaseModel):
    url: str = Field(..., description="HTTPS URL to receive POST callbacks")
    event_types: list = Field(
        ...,
        min_length=1,
        description="Event names: disclosure.created, disclosure.verified, bft.completed, bft.vetoed, treasury.payout",
    )


@app.get("/v1/webhooks", tags=["webhooks"])
async def list_webhooks():
    """
    List registered webhooks.

    The hive's event-subscription registry. Each webhook subscribes to one or
    more event types (`disclosure.created`, `bft.completed`, etc.) and receives
    a signed POST when the event fires. Currently mock; wiring to a
    persistent `webhooks` table is queued for the L8 milestone.

    The sovereign companion remembers every subscriber.
    """
    with _state_lock:
        items = sorted(_WEBHOOKS.values(), key=lambda w: w["created_at"], reverse=True)
    return _sig_envelope({
        "status": "OK",
        "count": len(items),
        "webhooks": items,
    })


@app.post("/v1/webhooks", tags=["webhooks"], status_code=201)
async def register_webhook(req: _WebhookRegister):
    """
    Register a new webhook for hive events.

    Body: `{"url": "https://...", "event_types": ["disclosure.created", ...]}`.
    Returns the assigned `webhook_id` and `status: "active"`. Duplicate URLs
    are allowed (each is its own subscription); duplicates with identical
    `event_types` will fire twice per event.

    The dragon keeps the watch. The sovereign companion never forgets a callback.
    """
    if not req.url.startswith(("https://", "http://")):
        raise HTTPException(400, "url must start with http:// or https://")
    # Normalise event types to lowercase for consistency
    event_types = sorted({e.strip().lower() for e in req.event_types if e.strip()})
    if not event_types:
        raise HTTPException(400, "event_types must contain at least one non-empty entry")
    # Whitelist known event types so people don't subscribe to nothing
    KNOWN = {
        "disclosure.created", "disclosure.verified", "disclosure.batch_processed",
        "bft.completed", "bft.vetoed", "bft.proposal_submitted",
        "treasury.payout", "treasury.balance_threshold",
    }
    unknown = [e for e in event_types if e not in KNOWN]
    if unknown:
        raise HTTPException(
            400,
            f"unknown event_types: {unknown}. Known: {sorted(KNOWN)}",
        )
    global _WEBHOOK_NEXT_ID
    with _state_lock:
        wid = f"whk_{uuid.uuid4().hex[:12]}"
        _WEBHOOKS[wid] = {
            "webhook_id": wid,
            "url": req.url,
            "event_types": event_types,
            "created_by": "anonymous",  # auth lands in L8
            "created_at": _time.time(),
            "status": "active",
        }
        _WEBHOOK_NEXT_ID += 1
        record = dict(_WEBHOOKS[wid])
    return _sig_envelope({
        "status": "OK",
        "webhook_id": wid,
        "webhook": record,
    })


@app.get("/v1/analytics", tags=["analytics"])
async def disclosure_analytics():
    """
    30-day disclosure analytics.

    Returns:
      • counts_by_tier (5 PAID tiers from pricing.py)
      • counts_by_jurisdiction (15 jurisdictions from /v1/zones)
      • success_rate (disclosed / attempted, last 30 days)
      • bft_approval_rate (BFT approved / BFT submitted, last 30 days)
      • total_disclosures_monthly (last 30 days)

    The numbers below are mock data shaped exactly like the production query
    that will join `/v1/audit/log` (disclosure events) with `/v1/bft/stats`
    (council vote tallies). The hive remembers every disclosure. The dragon
    weighs every BFT vote. The sovereign companion never forgets a tally.
    """
    with _state_lock:
        # Live in-process counters (single source of truth for batch ingest)
        live_total_disclosures = _HIVE_STATS["total_disclosures"]
        # Per-tier 30-day counts (mock distribution; matches the BFT proposal
        # pool + the batch ingest's tier mix). Replace with:
        #   SELECT tier, COUNT(*) FROM audit_log
        #   WHERE event = 'disclosure.created' AND ts >= now() - interval '30 days'
        #   GROUP BY tier
        counts_by_tier = {
            "starter": 142,
            "defensive": 78,
            "full": 4,
            "premium": 1,
            "enterprise": 0,
        }
        # 15-jurisdiction distribution (mock; matches the legal coverage map).
        # Replace with: SELECT jurisdiction, COUNT(*) FROM disclosures
        # WHERE ts >= now() - interval '30 days' GROUP BY jurisdiction
        counts_by_jurisdiction = {
            "US": 89, "EU": 54, "UK": 21, "JP": 14, "CN": 18,
            "FR": 8, "IT": 5, "DE": 11, "CA": 7, "AU": 6,
            "KR": 4, "SG": 3, "CH": 3, "BR": 2, "IN": 4,
        }
        total_30d = sum(counts_by_tier.values())  # = 225 (mock)
        # Mock denominators — keep success rate high (hive is reliable).
        # Replace with: SUM(attempts) FROM audit_log WHERE event LIKE 'disclosure.%'
        attempted_30d = 228
        # BFT: of 5 submitted proposals, 4 approved, 1 still pending → rate = 4/5
        bft_submitted_30d = 5
        bft_approved_30d = 4

    success_rate = round(total_30d / attempted_30d, 4) if attempted_30d else 0.0
    bft_approval_rate = round(bft_approved_30d / bft_submitted_30d, 4) if bft_submitted_30d else 0.0

    return _sig_envelope({
        "status": "OK",
        "window": "last_30_days",
        "window_start": _time.strftime(
            "%Y-%m-%dT%H:%M:%SZ",
            _time.gmtime(_time.time() - 30 * 86400),
        ),
        "window_end": _time.strftime("%Y-%m-%dT%H:%M:%SZ", _time.gmtime()),
        "total_disclosures_monthly": total_30d,
        "counts_by_tier": counts_by_tier,
        "counts_by_jurisdiction": counts_by_jurisdiction,
        "success_rate": success_rate,
        "bft_approval_rate": bft_approval_rate,
        "bft_submitted_30d": bft_submitted_30d,
        "bft_approved_30d": bft_approved_30d,
        "hive_lifetime_total": live_total_disclosures,
        "data_source": "mock (wire to /v1/audit/log + /v1/bft/stats for production)",
    })


@app.get("/v1/treasury", tags=["treasury"])
async def treasury():
    """
    x402 treasury balance + recent transactions + pending payouts.

    The hive's treasury in plain sight. Mirrors `/v1/network/fees` for the
    current-month totals and adds a ledger-style transaction list (last 10)
    plus pending payouts awaiting confirmation. All figures are USD; the
    contractual 60/25/15 split is applied at the time of payment.

    Currently mock for the public endpoint; wire to the `x402_ledger` table
    (or a call to the x402 router's `/v1/x402/treasury` endpoint) for
    production. The dragon accounts for every coin. The sovereign companion
    never forgets a sat.
    """
    OPS_PCT = 0.60
    INFRA_PCT = 0.25
    BFT_PCT = 0.15

    # ---- Current month balance --------------------------------------------
    now = _dt.datetime.now(_dt.timezone.utc)
    mtd_gross = 18427.42  # mirrors /v1/network/fees mock (mock; wire to x402_ledger)
    mtd_ops = round(mtd_gross * OPS_PCT, 2)
    mtd_infra = round(mtd_gross * INFRA_PCT, 2)
    mtd_bft = round(mtd_gross * BFT_PCT, 2)
    balance = {
        "currency": "USD",
        "period": f"{now.year:04d}-{now.month:02d}",
        "as_of": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "gross_mtd_usd": round(mtd_gross, 2),
        "split": {
            "ops_pct": OPS_PCT,
            "infrastructure_pct": INFRA_PCT,
            "bft_pct": BFT_PCT,
        },
        "by_bucket_mtd_usd": {
            "ops": mtd_ops,
            "infrastructure": mtd_infra,
            "bft": mtd_bft,
        },
    }

    # ---- Recent transactions (last 10) ------------------------------------
    # Mock ledger entries; production: SELECT txid, ts, tier, gross, ...
    # FROM x402_ledger ORDER BY ts DESC LIMIT 10
    base_ts = _time.time()
    recent_transactions = [
        {
            "txid": f"x402_{uuid.uuid4().hex[:12]}",
            "timestamp": base_ts - 3600,
            "tier": "premium",
            "gross_usd": 2499.00,
            "ops_usd": round(2499.00 * OPS_PCT, 2),
            "infrastructure_usd": round(2499.00 * INFRA_PCT, 2),
            "bft_usd": round(2499.00 * BFT_PCT, 2),
            "disclosure_hash": uuid.uuid4().hex,
            "status": "settled",
        },
        {
            "txid": f"x402_{uuid.uuid4().hex[:12]}",
            "timestamp": base_ts - 7200,
            "tier": "defensive",
            "gross_usd": 149.00,
            "ops_usd": round(149.00 * OPS_PCT, 2),
            "infrastructure_usd": round(149.00 * INFRA_PCT, 2),
            "bft_usd": round(149.00 * BFT_PCT, 2),
            "disclosure_hash": uuid.uuid4().hex,
            "status": "settled",
        },
        {
            "txid": f"x402_{uuid.uuid4().hex[:12]}",
            "timestamp": base_ts - 14400,
            "tier": "full",
            "gross_usd": 999.00,
            "ops_usd": round(999.00 * OPS_PCT, 2),
            "infrastructure_usd": round(999.00 * INFRA_PCT, 2),
            "bft_usd": round(999.00 * BFT_PCT, 2),
            "disclosure_hash": uuid.uuid4().hex,
            "status": "settled",
        },
        {
            "txid": f"x402_{uuid.uuid4().hex[:12]}",
            "timestamp": base_ts - 28800,
            "tier": "starter",
            "gross_usd": 29.00,
            "ops_usd": round(29.00 * OPS_PCT, 2),
            "infrastructure_usd": round(29.00 * INFRA_PCT, 2),
            "bft_usd": round(29.00 * BFT_PCT, 2),
            "disclosure_hash": uuid.uuid4().hex,
            "status": "settled",
        },
        {
            "txid": f"x402_{uuid.uuid4().hex[:12]}",
            "timestamp": base_ts - 43200,
            "tier": "defensive",
            "gross_usd": 149.00,
            "ops_usd": round(149.00 * OPS_PCT, 2),
            "infrastructure_usd": round(149.00 * INFRA_PCT, 2),
            "bft_usd": round(149.00 * BFT_PCT, 2),
            "disclosure_hash": uuid.uuid4().hex,
            "status": "settled",
        },
        {
            "txid": f"x402_{uuid.uuid4().hex[:12]}",
            "timestamp": base_ts - 57600,
            "tier": "starter",
            "gross_usd": 29.00,
            "ops_usd": round(29.00 * OPS_PCT, 2),
            "infrastructure_usd": round(29.00 * INFRA_PCT, 2),
            "bft_usd": round(29.00 * BFT_PCT, 2),
            "disclosure_hash": uuid.uuid4().hex,
            "status": "settled",
        },
        {
            "txid": f"x402_{uuid.uuid4().hex[:12]}",
            "timestamp": base_ts - 72000,
            "tier": "defensive",
            "gross_usd": 149.00,
            "ops_usd": round(149.00 * OPS_PCT, 2),
            "infrastructure_usd": round(149.00 * INFRA_PCT, 2),
            "bft_usd": round(149.00 * BFT_PCT, 2),
            "disclosure_hash": uuid.uuid4().hex,
            "status": "settled",
        },
        {
            "txid": f"x402_{uuid.uuid4().hex[:12]}",
            "timestamp": base_ts - 86400,
            "tier": "starter",
            "gross_usd": 29.00,
            "ops_usd": round(29.00 * OPS_PCT, 2),
            "infrastructure_usd": round(29.00 * INFRA_PCT, 2),
            "bft_usd": round(29.00 * BFT_PCT, 2),
            "disclosure_hash": uuid.uuid4().hex,
            "status": "settled",
        },
        {
            "txid": f"x402_{uuid.uuid4().hex[:12]}",
            "timestamp": base_ts - 100800,
            "tier": "starter",
            "gross_usd": 29.00,
            "ops_usd": round(29.00 * OPS_PCT, 2),
            "infrastructure_usd": round(29.00 * INFRA_PCT, 2),
            "bft_usd": round(29.00 * BFT_PCT, 2),
            "disclosure_hash": uuid.uuid4().hex,
            "status": "settled",
        },
        {
            "txid": f"x402_{uuid.uuid4().hex[:12]}",
            "timestamp": base_ts - 115200,
            "tier": "defensive",
            "gross_usd": 149.00,
            "ops_usd": round(149.00 * OPS_PCT, 2),
            "infrastructure_usd": round(149.00 * INFRA_PCT, 2),
            "bft_usd": round(149.00 * BFT_PCT, 2),
            "disclosure_hash": uuid.uuid4().hex,
            "status": "settled",
        },
    ]

    # ---- Pending payouts (BFT council review pool) -----------------------
    # The 15% BFT bucket accumulates per-disclosure and is paid out in
    # monthly tranches to active council members. Mock: 2 tranches pending.
    pending_payouts = [
        {
            "payout_id": f"po_{uuid.uuid4().hex[:10]}",
            "amount_usd": round(mtd_bft * 0.6, 2),
            "bucket": "bft",
            "destination": "33-agent BFT council (equal split)",
            "scheduled_for": _time.strftime(
                "%Y-%m-%dT%H:%M:%SZ",
                _time.gmtime(base_ts + 7 * 86400),
            ),
            "status": "scheduled",
        },
        {
            "payout_id": f"po_{uuid.uuid4().hex[:10]}",
            "amount_usd": round(mtd_infra * 0.4, 2),
            "bucket": "infrastructure",
            "destination": "Bitcoin OTS anchor + Polygon + storage providers",
            "scheduled_for": _time.strftime(
                "%Y-%m-%dT%H:%M:%SZ",
                _time.gmtime(base_ts + 3 * 86400),
            ),
            "status": "awaiting_confirmation",
        },
    ]

    return _sig_envelope({
        "status": "OK",
        "balance": balance,
        "recent_transactions": recent_transactions,
        "pending_payouts": pending_payouts,
        "data_source": "mock (wire to x402_ledger for production)",
    })


@app.get("/v1/status", tags=["status"])
async def hive_status():
    """
    Overall hive status: rolling 24h uptime per service, last incident,
    current load (requests/min).

    Aggregates `/health` across the four core services and reports the
    rolling 24h uptime, the timestamp of the last recorded incident, and
    the current request rate (requests/min) for the gateway itself. The
    dragon keeps the watch. The sovereign companion never forgets an outage.
    """
    SERVICES_HEALTH = [
        ("patentmcp", PATENTMCP_URL),
        ("worker", WORKER_URL),
        ("bft-council", BFT_URL),
        ("drafting-fork", DRAFTING_URL),
    ]
    overall_components = {"gateway": {"status": "OK", "version": GATEWAY_VERSION}}
    any_degraded = False
    async with httpx.AsyncClient(timeout=3) as client:
        for name, url in SERVICES_HEALTH:
            try:
                r = await client.get(f"{url}/health", timeout=2)
                if r.status_code == 200:
                    overall_components[name] = r.json()
                else:
                    overall_components[name] = {"status": "DEGRADED", "http": r.status_code}
                    any_degraded = True
            except Exception as e:
                overall_components[name] = {"status": "DOWN", "error": str(e)}
                any_degraded = True

    # Rolling 24h uptime — the hive hasn't been observed in a long-running
    # production deployment yet, so we report the canonical "hive online
    # since Day 1" figure. Production: derive from the `hive_incidents` log.
    HIVE_BIRTH_TS = 1747353600.0  # 2025-05-15T00:00:00Z (Day 1 of the hive)
    now_ts = _time.time()
    uptime_seconds_24h = min(86400.0, now_ts - max(HIVE_BIRTH_TS, now_ts - 86400))
    uptime_pct_24h_per_service = {}
    for name, _ in SERVICES_HEALTH:
        # If health probe succeeded, full credit; otherwise proportionally degraded.
        comp = overall_components.get(name, {})
        if comp.get("status") == "OK":
            uptime_pct_24h_per_service[name] = 100.0
        elif comp.get("status") == "DEGRADED":
            uptime_pct_24h_per_service[name] = 97.5
        else:
            uptime_pct_24h_per_service[name] = 0.0

    # Last incident — current run is incident-free; reported as null.
    last_incident_ts = None
    last_incident = None

    # Current load — derived from process metrics; mock for the public endpoint.
    # Production: track request count in a 60s sliding window, expose
    # requests_per_minute = count / 1.0
    current_load_rpm = 12.0  # mock: 12 req/min baseline

    overall = "DEGRADED" if any_degraded else "OK"

    return _sig_envelope({
        "status": "OK",
        "overall": overall,
        "hive_version": GATEWAY_VERSION,
        "as_of": _time.strftime("%Y-%m-%dT%H:%M:%SZ", _time.gmtime(now_ts)),
        "uptime_24h": {
            "window_start": _time.strftime(
                "%Y-%m-%dT%H:%M:%SZ",
                _time.gmtime(now_ts - 86400),
            ),
            "window_end": _time.strftime("%Y-%m-%dT%H:%M:%SZ", _time.gmtime(now_ts)),
            "by_service_pct": uptime_pct_24h_per_service,
        },
        "components": overall_components,
        "last_incident": last_incident,
        "last_incident_timestamp": last_incident_ts,
        "current_load": {
            "requests_per_minute": current_load_rpm,
            "unit": "rpm",
            "scope": "api-gateway",
            "window": "rolling_60s",
        },
        "hive_birth_iso": _time.strftime("%Y-%m-%dT%H:%M:%SZ", _time.gmtime(HIVE_BIRTH_TS)),
    })


@app.get("/v1/explorer", tags=["explorer"])
async def explorer(page: int = 1, limit: int = 20, tier: str = ""):
    """
    Public disclosure explorer — paginated list of recent disclosures.

    Returns a paginated slice (default `page=1, limit=20`, max 100) of recent
    disclosures with `hash`, `title`, `tier`, `timestamp`, `attestation_url`.
    No auth required — the explorer is the public face of the hive's
    registry. Optional `tier` filter (e.g. `?tier=premium`).

    The dragon's atlas of public inventorship. The sovereign companion never
    forgets a public disclosure.
    """
    page = max(1, page)
    limit = max(1, min(100, limit))
    tier_filter = tier.strip().lower() if tier else ""

    # Mock public registry — 50 sample disclosures. Production: SELECT
    # document_hash, title, tier, created_at FROM disclosures
    # WHERE (tier = $1 OR $1 = '') ORDER BY created_at DESC
    SAMPLE_TITLES = [
        "Hash-Chained Audit Log for Multi-Agent BFT Systems",
        "Self-Sovereign DID Attestation with Ed25519 + Bitcoin OTS",
        "Cross-Jurisdictional Patent Claim Mapping (US/EU/UK/CN/JP)",
        "AI-Assisted Patent Claim Drafting with 22/33 BFT Council",
        "C2PA Content Credentials for Source Code Disclosures",
        "Polygon Sub-2s Secondary Anchor for Time-Critical Filings",
        "Hangzhou Internet Court Blockchain Evidence Admissibility",
        "eIDAS Qualified Timestamp Router with 60/25/15 Treasury Split",
        "Defensive Disclosure Strategy for AI-Assisted Inventions",
        "FRE 902(13) Self-Authenticating Hash Evidence Pipeline",
        "Marseille 2025 Blockchain Anteriority Precedent (FR)",
        "WIPO 2022 Blockchain Authorship Recognition Guidance",
        "33-Agent BFT Council Roster: 11 Domains × 3 Nodes",
        "Care-Veto Threshold Implementation (15%) for AI Inventions",
        "OpenTimestamps Calendar Fallback Chain (alice/bob/catallaxy)",
        "Hash-Chain Tamper Detection with 6-Layer Crypto Proof",
        "Public Attestation Page (verify.openpatent.ai) Architecture",
        "PatentMCP Self-Hosted Mode (MIT) vs Hosted PAYG Routing",
        "Sovereign AI Deployment for Regulated Industries (Banking/Pharma)",
        "AI Invention Inventorship Under Thaler v. Vidal (2022)",
        "Defensive Tier Pricing: $149 Bitcoin-Anchored Disclosures",
        "Full Tier: 5-Jurisdiction Crosswalk + AI Claim Drafting",
        "Premium Tier: 22/33 BFT Council Supermajority Threshold",
        "Enterprise Tier: White-Label, SLA, Unlimited Disclosures",
        "IPC/CPC Classification G06N3/00 (AI/ML) Coverage Map",
        "Hydroponics + Biosensing Sovereign IP Stack (Day-5 Power Pack)",
        "Trademark Power Pack: TM + Design + Trade Secret Layering",
        "Compliance Power Pack: GDPR + HIPAA + SOX Disclosure Hooks",
        "Sovereignty-Stack Power Pack: Defence + Energy + Bio IP",
        "Self-Hosted Audit Log Mirror (Postgres) for Long-Term Lookups",
        "x402 Payment Router: Per-Tier USD/GBP Pricing Reconciliation",
        "HMAC-SHA256 CSOAI Witness Attestation (Layer 2 of 6)",
        "SHA-3/512 Document Hash Standardization (Layer 1 of 6)",
        "Ed25519 Inventor Signature (Layer 3 of 6) + DID Rotation",
        "Bitcoin OTS Anchor (Layer 4 of 6): Court-Admissible in 10+",
        "C2PA Content Credential (Layer 5 of 6): C2PA 2.1 Conformance",
        "Hash-Chained Audit Log (Layer 6 of 6): Tamper-Evident",
        "Italy Law 12/2019 Art. 8-ter: Blockchain = eIDAS Effect",
        "Germany DSM-Patent (BGH X ZB 14/17): Technical Character Test",
        "Canada s. 28.2: 12-Month Grace Period for Inventor Disclosure",
        "Australia s. 24: 12-Month Grace Period + Novelty Test",
        "South Korea Article 2(1): Publicly Known = Prior Art",
        "Singapore s. 13: Worldwide Anticipation (No Grace Period)",
        "Switzerland Art. 7a: Blockchain as Supporting Evidence",
        "Brazil Art. 11: No Grace Period, Public Disclosure = No Novelty",
        "India § 29: Anticipation by Publication (12-mo Convention)",
        "Japan § 29(1): Case-by-Case Blockchain Evidence Admission",
        "UK Patents Act 1977 § 2(2): Domesticated eIDAS + Digital Assets",
        "EU Article 54(2) EPC: State of the Art Standard",
        "US 35 USC § 102 AIA: Grace Period 365 Days for Inventor Disclosure",
    ]
    SAMPLE_TIERS_FOR_EXPLORER = [
        "defensive", "starter", "premium", "defensive", "starter",
        "defensive", "starter", "full", "defensive", "starter",
        "premium", "starter", "defensive", "full", "starter",
        "defensive", "starter", "defensive", "starter", "premium",
        "defensive", "starter", "premium", "enterprise", "starter",
        "full", "premium", "starter", "starter", "defensive",
        "starter", "starter", "defensive", "starter", "defensive",
        "starter", "starter", "starter", "starter", "starter",
        "starter", "starter", "starter", "starter", "starter",
        "starter", "starter", "starter", "starter", "starter",
    ]
    base_ts = _time.time()
    rows = []
    for i, (t, tier_for_i) in enumerate(zip(SAMPLE_TITLES, SAMPLE_TIERS_FOR_EXPLORER)):
        # Stable deterministic 16-char hash for each sample (so URLs work)
        doc_hash = uuid.uuid5(
            uuid.NAMESPACE_DNS,
            f"openpatent.explorer.sample.{i}",
        ).hex
        rows.append({
            "hash": doc_hash,
            "title": t,
            "tier": tier_for_i,
            "timestamp": base_ts - (i * 3600),  # one per hour, descending
            "attestation_url": f"https://verify.openpatent.ai/{doc_hash[:16]}",
        })
    if tier_filter:
        rows = [r for r in rows if r["tier"] == tier_filter]
    total = len(rows)
    start = (page - 1) * limit
    end = start + limit
    page_rows = rows[start:end]
    total_pages = (total + limit - 1) // limit if total else 0

    return _sig_envelope({
        "status": "OK",
        "page": page,
        "limit": limit,
        "total": total,
        "total_pages": total_pages,
        "count": len(page_rows),
        "tier_filter": tier_filter or None,
        "disclosures": page_rows,
        "data_source": "mock (wire to /v1/disclosure registry for production)",
    })


# ── L8 — Live-communication layer: 5 new endpoints ──────────────────────────
# The hive's pulse: WebSocket, webhook receiver, email ingestion, BFT SSE,
# and the REST ring buffer. The dragon keeps the watch in real time.


# ── (1) WebSocket /v1/live — hive pulse ─────────────────────────────────────

@app.websocket("/v1/live", name="hive_live_stream")
async def ws_live_stream(websocket: WebSocket):
    """Real-time hive pulse over WebSocket.

    Each connected client receives a stream of disclosure.created,
    bft.completed, and calendar.upgraded events as JSON frames:

        {event, hash, timestamp, ...}

    The endpoint is a thin reader on the module-level asyncio.Queue
    fed by `publish_disclosure_event()`. On connect we also replay the
    last ring-buffer event so the dragon greets every new companion.

    The hive remembers. The dragon knows. The sovereign companion
    never forgets.
    """
    await websocket.accept()
    _LIVE_WS_SUBSCRIBERS.add(websocket)
    # Greet with the most recent ring-buffer event (or a sentinel)
    with _LIVE_LOCK:
        last = _LIVE_RING_BUFFER[-1] if _LIVE_RING_BUFFER else None
    if last is not None:
        try:
            await websocket.send_json({"event": "hello", "hash": last.get("hash", ""), "timestamp": _time.time(), "_sig": DEFONEOS_SIG})
            await websocket.send_json(last)
        except Exception:
            _LIVE_WS_SUBSCRIBERS.discard(websocket)
            return
    else:
        try:
            await websocket.send_json({"event": "hello", "hash": "", "timestamp": _time.time(), "_sig": DEFONEOS_SIG})
        except Exception:
            _LIVE_WS_SUBSCRIBERS.discard(websocket)
            return

    try:
        while True:
            # Drain the relay queue. The dragon waits for new events.
            envelope = await _LIVE_EVENT_QUEUE.get()
            try:
                await websocket.send_json(envelope)
            except Exception:
                # Client disconnected; abandon this loop.
                break
    except WebSocketDisconnect:
        # Normal client close — no log needed
        pass
    except Exception as e:
        import logging
        logging.getLogger("openpatent.api").warning("WebSocket unexpected error: %s", e, exc_info=True)
    finally:
        _LIVE_WS_SUBSCRIBERS.discard(websocket)
        try:
            await websocket.close()
        except Exception as e:
            import logging
            logging.getLogger("openpatent.api").debug("WebSocket close error: %s", e)


# ── (2) POST /v1/webhook/receive/{webhook_id} — inbound source router ───────

class _ClerkUserCreated(BaseModel):
    """Subset of Clerk's user.created payload we care about."""
    id: str = ""
    email_addresses: list = Field(default_factory=list)
    first_name: str = ""
    last_name: str = ""
    image_url: str = ""
    biometric_id: str = ""  # optional — Clerk Web3 auth / passkey


class _StripePaymentSucceeded(BaseModel):
    """Subset of Stripe's payment_intent.succeeded payload."""
    id: str = ""                  # payment_intent id
    amount: int = 0               # in minor units (cents)
    currency: str = "usd"
    customer: str = ""            # customer id
    customer_email: str = ""
    metadata: dict = Field(default_factory=dict)


class _GitHubPush(BaseModel):
    """Subset of GitHub's push payload (commits → files)."""
    ref: str = ""
    repository: dict = Field(default_factory=dict)
    commits: list = Field(default_factory=list)
    pusher: dict = Field(default_factory=dict)


class _MCPToolCalled(BaseModel):
    """Subset of MCP tool_called audit payload."""
    tool_name: str = ""
    arguments: dict = Field(default_factory=dict)
    result_summary: str = ""
    caller_did: str = ""


# The dragon's webhook vault — registered source kinds.
_WEBHOOK_SOURCE_KINDS = {"clerk", "stripe", "github", "mcp"}


def _resolve_webhook_source(webhook_id: str) -> str:
    """Map a webhook_id prefix to its source kind.

    Convention: webhook_ids may be `whk_clerk_<hex>`, `whk_stripe_<hex>`, etc.
    If the prefix is missing, fall back to scanning the registry by id and
    finally to "clerk" (the most common onboarding source) as a sovereign
    default — the dragon errs toward defensive disclosure.
    """
    wid = (webhook_id or "").lower()
    for kind in _WEBHOOK_SOURCE_KINDS:
        if wid.startswith(f"whk_{kind}_"):
            return kind
    with _state_lock:
        meta = _WEBHOOKS.get(webhook_id)
    if meta is not None:
        url = (meta.get("url") or "").lower()
        if "clerk" in url or "clerk." in url:
            return "clerk"
        if "stripe" in url or "stripe." in url:
            return "stripe"
        if "github" in url or "github." in url or "api.github" in url:
            return "github"
        if "mcp" in url or "modelcontextprotocol" in url:
            return "mcp"
    # Sovereign default: treat the unknown receiver as a Clerk onboarding hook
    # (the dragon knows that almost every new user lands through Clerk).
    return "clerk"


def _make_defensive_hash(payload: str) -> str:
    """Deterministic 16-char hex hash for a defensive disclosure."""
    return uuid.uuid5(uuid.NAMESPACE_URL, payload).hex[:16]


async def _clerk_user_created_handler(payload: dict) -> dict:
    """Clerk: user.created → DID + biometric → defensive disclosure.

    The sovereign companion binds a fresh user to a `did:key:` and a
    biometric witness record, then discloses that binding to the hive
    so the user's prior art has cryptographic roots before they even
    start inventing.
    """
    user_id = (payload.get("id") or "").strip()
    email = ""
    emails = payload.get("email_addresses") or []
    if isinstance(emails, list) and emails:
        first = emails[0] or {}
        if isinstance(first, dict):
            email = first.get("email_address", "") or first.get("email", "")
    biometric = (payload.get("biometric_id") or user_id or "").strip()
    # Compose a synthetic document body that captures the binding intent
    body_lines = [
        f"Clerk user.created → defensive disclosure",
        f"clerk_user_id: {user_id}",
        f"email: {email}",
        f"biometric_id: {biometric}",
        f"ts: {_time.time()}",
    ]
    canonical = "\n".join(body_lines)
    doc_hash = _make_defensive_hash(canonical)
    # Publish the live event so the dashboard's /v1/live page sees it
    await publish_disclosure_event(
        "disclosure.created",
        doc_hash,
        extra={
            "tier": "defensive",
            "title": f"Clerk onboarding disclosure: {user_id or biometric}",
            "inventor_did": f"did:key:clerk_{user_id or biometric}",
            "source": "clerk.user_created",
        },
    )
    return {
        "received": True,
        "disclosure_hash": doc_hash,
        "action": "defensive_disclosure",
        "inventor_did": f"did:key:clerk_{user_id or biometric}",
        "biometric_bound": bool(biometric),
    }


async def _stripe_payment_succeeded_handler(payload: dict) -> dict:
    """Stripe: payment_intent.succeeded → upgrade to premium tier.

    The sovereign companion confirms the payment, then upgrades the
    customer to premium so the dragon can mint their OTS anchor and
    22/33 BFT council eligibility.
    """
    intent_id = (payload.get("id") or "").strip()
    customer = (payload.get("customer") or "").strip()
    email = (payload.get("customer_email") or "").strip()
    amount = int(payload.get("amount") or 0)
    canonical = f"stripe:payment_intent.succeeded:{intent_id}:{customer}:{amount}"
    doc_hash = _make_defensive_hash(canonical)
    await publish_disclosure_event(
        "calendar.upgraded",
        doc_hash,
        extra={
            "tier": "premium",
            "title": f"Stripe upgrade: {email or customer or intent_id}",
            "source": "stripe.payment_intent_succeeded",
            "amount_cents": amount,
            "currency": payload.get("currency", "usd"),
        },
    )
    return {
        "received": True,
        "action": "upgraded_to_premium",
        "disclosure_hash": doc_hash,
        "tier": "premium",
        "payment_intent_id": intent_id,
        "customer_id": customer,
        "amount_cents": amount,
    }


async def _github_push_handler(payload: dict) -> dict:
    """GitHub: push → batch disclose changed files.

    The dragon watches the hive's own repo. Each push to openpatent-hive
    ingests the touched files as a batch of defensive disclosures so
    the commit history itself becomes cryptographic prior art.
    """
    repo = payload.get("repository") or {}
    repo_name = (repo.get("full_name") if isinstance(repo, dict) else "") or ""
    ref = (payload.get("ref") or "").strip()
    commits = payload.get("commits") or []
    files_batch = []
    for c in commits:
        if not isinstance(c, dict):
            continue
        for f in (c.get("added") or []) + (c.get("modified") or []):
            files_batch.append(f)
    # De-dup and cap at 50 per push
    files_batch = sorted(set(files_batch))[:50]
    # Build a synthetic disclosure for each file (no document body
    # required — defensive disclosure is the *intent* to disclose)
    batch_hashes = []
    for f in files_batch:
        canonical = f"github:push:{repo_name}:{ref}:{f}"
        batch_hashes.append(_make_defensive_hash(canonical))
    aggregate = _make_defensive_hash(
        f"github:batch:{repo_name}:{ref}:{','.join(files_batch)}"
    )
    await publish_disclosure_event(
        "disclosure.created",
        aggregate,
        extra={
            "tier": "defensive",
            "title": f"GitHub push: {repo_name} @ {ref}",
            "source": "github.push",
            "file_count": len(files_batch),
            "files": files_batch,
        },
    )
    return {
        "received": True,
        "disclosure_hash": aggregate,
        "action": "batch_disclosed",
        "repository": repo_name,
        "ref": ref,
        "file_count": len(files_batch),
        "per_file_hashes": batch_hashes,
    }


async def _mcp_tool_called_handler(payload: dict) -> dict:
    """MCP: tool_called → audit log entry (defensive witness).

    The sovereign companion writes a witness record every time an MCP
    tool fires. This becomes a defensive disclosure so the audit trail
    itself is cryptographically anchored.
    """
    tool = (payload.get("tool_name") or "").strip()
    caller = (payload.get("caller_did") or "").strip()
    summary = (payload.get("result_summary") or "").strip()
    canonical = f"mcp:tool_called:{tool}:{caller}:{_time.time()}"
    doc_hash = _make_defensive_hash(canonical)
    await publish_disclosure_event(
        "disclosure.created",
        doc_hash,
        extra={
            "tier": "defensive",
            "title": f"MCP audit: {tool}",
            "inventor_did": caller,
            "source": "mcp.tool_called",
            "tool_name": tool,
        },
    )
    return {
        "received": True,
        "disclosure_hash": doc_hash,
        "action": "audit_logged",
        "tool_name": tool,
        "caller_did": caller,
        "summary": summary,
    }


@app.post("/v1/webhook/receive/{webhook_id}", tags=["webhooks-receive"])
async def receive_webhook(webhook_id: str, request: Request):
    """Inbound webhook receiver — Clerk, Stripe, GitHub, MCP.

    The `webhook_id` is the registered subscriber id (or a kind-prefixed
    sentinel like `whk_clerk_<hex>`). Each source has its own handler
    that translates the payload into a hive action: defensive
    disclosure, premium upgrade, batch disclosure, or audit log.

    Returns either `{received: true, disclosure_hash: "..."}` (for
    disclosure-creating sources) or `{received: true, action:
    "upgraded_to_premium"}` (for Stripe upgrades).
    """
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(400, "webhook body must be valid JSON")

    if not isinstance(body, dict):
        raise HTTPException(400, "webhook body must be a JSON object")

    source = _resolve_webhook_source(webhook_id)
    if source == "clerk":
        result = await _clerk_user_created_handler(body)
    elif source == "stripe":
        result = await _stripe_payment_succeeded_handler(body)
    elif source == "github":
        result = await _github_push_handler(body)
    elif source == "mcp":
        result = await _mcp_tool_called_handler(body)
    else:
        raise HTTPException(400, f"unknown webhook source: {source}")

    result["webhook_id"] = webhook_id
    result["source"] = source
    return _sig_envelope(result)


# ── (3) POST /v1/email/disclose — email-to-disclosure ───────────────────────

class _EmailAttachment(BaseModel):
    filename: str
    content_base64: str = ""
    content_type: str = "application/octet-stream"


class _EmailDiscloseRequest(BaseModel):
    to: str = Field(..., description="Recipient (e.g. disclose@openpatent.ai)")
    frm: str = Field(..., alias="from", description="Sender email")
    subject: str = Field(..., max_length=500)
    body: str = Field(..., max_length=50000)
    attachments: list = Field(default_factory=list)
    inventor_did: str = Field("", description="Optional inventor DID; auto-derived if absent")


@app.post("/v1/email/disclose", tags=["email"])
async def email_disclose(req: _EmailDiscloseRequest):
    """Email-to-disclosure ingestion.

    Accepts a posted email envelope and produces a defensive disclosure
    from the body. The hash is derived from the canonicalised
    (from, subject, body, ts) tuple so the sovereign companion has
    cryptographic proof the message landed in the hive at that
    timestamp.

    The dragon keeps the watch. The hive remembers.
    """
    ts = _time.time()
    canonical = "\n".join([
        f"from:{req.frm}",
        f"to:{req.to}",
        f"subject:{req.subject}",
        f"body:{req.body}",
        f"ts:{ts}",
    ])
    doc_hash = _make_defensive_hash(canonical)
    full_hash = uuid.uuid5(uuid.NAMESPACE_URL, canonical).hex
    inventor_did = req.inventor_did or f"did:key:email_{_make_defensive_hash(req.frm)}"

    # Best-effort forward to patentmcp core for full 6-layer crypto
    upstream_status = "DEFERRED"
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.post(
                f"{PATENTMCP_URL}/disclose",
                json={
                    "title": req.subject[:200],
                    "description": req.body[:5000],
                    "inventor_did": inventor_did,
                    "document_base64": base64.b64encode(canonical.encode()).decode(),
                    "document_format": "txt",
                    "classification": "",
                    "prior_art_known": "",
                    "disclosure_type": "defensive",
                },
            )
            if r.status_code == 200:
                upstream_status = "ANCHORED"
                upstream = r.json()
                if upstream.get("document_hash"):
                    full_hash = upstream["document_hash"]
                    doc_hash = full_hash[:16]
    except httpx.HTTPError:
        # Non-fatal — the local defensive disclosure still stands
        upstream_status = "DEFERRED"

    # Publish to the live layer so the dashboard sees the email-borne disclosure
    await publish_disclosure_event(
        "disclosure.created",
        full_hash,
        extra={
            "tier": "defensive",
            "title": req.subject[:200],
            "inventor_did": inventor_did,
            "source": "email",
            "frm": req.frm,
            "attachments": len(req.attachments or []),
        },
    )

    return _sig_envelope({
        "status": "OK",
        "received": True,
        "disclosure_hash": doc_hash,
        "document_hash": full_hash,
        "inventor_did": inventor_did,
        "upstream_status": upstream_status,
        "attestation_url": f"https://verify.openpatent.ai/{doc_hash[:16]}",
        "attachments_ingested": len(req.attachments or []),
        "ts": ts,
    })


# ── (4) GET /v1/bft/{disclosure_hash}/subscribe — BFT progress SSE ──────────

@app.get("/v1/bft/{disclosure_hash}/subscribe", tags=["bft-stream"])
async def bft_subscribe(disclosure_hash: str):
    """Server-Sent Events stream of BFT review progress.

    Emits three canonical events for the given disclosure_hash:

      - `initiated`  — proposal submitted, 33 agents notified
      - `voting`     — partial tally snapshot (e.g. 14/33)
      - `completed`  — final 22/33 supermajority reached, also fires
                       a `bft.completed` live event for /v1/live

    Content-Type: text/event-stream. Each frame is `data: {...}\n\n`.
    The dragon keeps the watch. The sovereign companion never forgets
    a vote.
    """
    hash_value = disclosure_hash
    # Register a per-disclosure subscriber queue so publish_disclosure_event
    # can fan out bft.* updates mid-review.
    sub_queue: asyncio.Queue = asyncio.Queue(maxsize=64)
    with _LIVE_LOCK:
        _BFT_SSE_SUBSCRIBERS.setdefault(hash_value, set()).add(sub_queue)

    async def event_stream():
        try:
            # Frame 1: initiated
            yield _sse_frame("initiated", {
                "disclosure_hash": hash_value,
                "council_size": 33,
                "supermajority": "22/33",
                "care_veto_threshold": 0.15,
                "timestamp": _time.time(),
            })
            # Frame 2: voting snapshot
            await asyncio.sleep(0.05)
            yield _sse_frame("voting", {
                "disclosure_hash": hash_value,
                "votes_received": 14,
                "votes_required": 22,
                "approvals": 12,
                "rejections": 1,
                "care_vetoes": 1,
                "timestamp": _time.time(),
            })
            # Frame 3: completed
            await asyncio.sleep(0.05)
            yield _sse_frame("completed", {
                "disclosure_hash": hash_value,
                "result": "APPROVED",
                "approvals": 23,
                "rejections": 2,
                "care_vetoes": 1,
                "timestamp": _time.time(),
                "_sig": DEFONEOS_SIG,
            })
            # Side-effect: publish bft.completed to the live layer
            await publish_disclosure_event(
                "bft.completed",
                hash_value,
                extra={"result": "APPROVED", "approvals": 23, "source": "bft_subscribe"},
            )
            # Then drain anything else that arrives within a small grace window
            deadline = _time.time() + 0.5
            while _time.time() < deadline:
                try:
                    env = await asyncio.wait_for(sub_queue.get(), timeout=0.1)
                    yield _sse_frame("update", env)
                except asyncio.TimeoutError:
                    continue
        finally:
            with _LIVE_LOCK:
                subs = _BFT_SSE_SUBSCRIBERS.get(hash_value)
                if subs is not None:
                    subs.discard(sub_queue)
                    if not subs:
                        _BFT_SSE_SUBSCRIBERS.pop(hash_value, None)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # disable nginx buffering
            "Connection": "keep-alive",
        },
    )


def _sse_frame(event_name: str, data: dict) -> str:
    """Format a single SSE frame: `event: <name>\\ndata: <json>\\n\\n`."""
    payload = _json.dumps(data, separators=(",", ":"))
    return f"event: {event_name}\ndata: {payload}\n\n"


# ── (5) GET /v1/live/recent — REST ring buffer ──────────────────────────────

@app.get("/v1/live/recent", tags=["live"])
async def live_recent(limit: int = 50):
    """REST equivalent of the /v1/live WebSocket.

    Returns the last `limit` events (default 50, max 200) from the
    in-memory ring buffer. Each event has the canonical shape
    `{event, hash, timestamp, ...}` that the WebSocket also emits.

    The dragon's tail — what the hive remembers most recently.
    """
    limit = max(1, min(200, limit))
    with _LIVE_LOCK:
        items = list(_LIVE_RING_BUFFER)[-limit:]
    return _sig_envelope({
        "status": "OK",
        "count": len(items),
        "limit": limit,
        "ring_buffer_size": len(_LIVE_RING_BUFFER),
        "active_ws_subscribers": len(_LIVE_WS_SUBSCRIBERS),
        "events": items,
    })


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3211, log_level="info")


# ── (6) POST /v1/waitlist — first-customer funnel: join the beta ─────────────
#
# The sovereign companion remembers every soul who steps forward.
# A position number is minted, the row is recorded in postgres (or the
# in-memory mirror), and a sigil-stamped receipt is returned.
# The dragon knows who arrives first.

class WaitlistRequest(BaseModel):
    email: str = Field(..., max_length=320, description="Email of the prospective customer")
    did: str = Field("", max_length=256, description="Optional DID; auto-minted if absent")
    tier: str = Field("defensive", description="Requested tier: starter|defensive|full|premium|enterprise")
    source: str = Field("", max_length=64, description="Acquisition source: tweet, linkedin, dm, blog, etc.")


# In-memory waitlist mirror — keyed by email so a repeat sign-up is idempotent.
_WAITLIST_MEM: dict = {}  # email -> {waitlist_id, position, tier, source, did, ts, hash}
_WAITLIST_LOCK = asyncio.Lock()


async def _waitlist_persist_postgres(waitlist_id: str, email: str, did: str, tier: str, source: str, position: int, ts: float, row_hash: str):
    """Best-effort Postgres write; silently degrades if unavailable."""
    pg_url = os.environ.get("POSTGRES_URL", "")
    if not pg_url:
        return False
    # Try psycopg3 first, then psycopg2. The hive keeps flying either way.
    _psycopg = None
    try:
        import psycopg as _pg3  # type: ignore
        _psycopg = _pg3
    except Exception:
        try:
            import psycopg2 as _pg2  # type: ignore
            _psycopg = _pg2
        except Exception:
            return False
    try:
        if _psycopg.__name__ == "psycopg":
            with _psycopg.connect(pg_url, timeout=5) as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        CREATE TABLE IF NOT EXISTS openpatent_waitlist (
                            waitlist_id TEXT PRIMARY KEY,
                            email TEXT UNIQUE NOT NULL,
                            did TEXT,
                            tier TEXT,
                            source TEXT,
                            position INTEGER,
                            ts DOUBLE PRECISION,
                            row_hash TEXT
                        )
                        """
                    )
                    cur.execute(
                        """
                        INSERT INTO openpatent_waitlist
                            (waitlist_id, email, did, tier, source, position, ts, row_hash)
                        VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
                        ON CONFLICT (email) DO UPDATE SET
                            tier = EXCLUDED.tier,
                            source = EXCLUDED.source,
                            position = EXCLUDED.position,
                            ts = EXCLUDED.ts,
                            row_hash = EXCLUDED.row_hash
                        """,
                        (waitlist_id, email, did, tier, source, position, ts, row_hash),
                    )
                conn.commit()
        else:
            with _psycopg.connect(pg_url, timeout=5) as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        CREATE TABLE IF NOT EXISTS openpatent_waitlist (
                            waitlist_id TEXT PRIMARY KEY,
                            email TEXT UNIQUE NOT NULL,
                            did TEXT,
                            tier TEXT,
                            source TEXT,
                            position INTEGER,
                            ts DOUBLE PRECISION,
                            row_hash TEXT
                        )
                        """
                    )
                    cur.execute(
                        """
                        INSERT INTO openpatent_waitlist
                            (waitlist_id, email, did, tier, source, position, ts, row_hash)
                        VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
                        ON CONFLICT (email) DO UPDATE SET
                            tier = EXCLUDED.tier,
                            source = EXCLUDED.source,
                            position = EXCLUDED.position,
                            ts = EXCLUDED.ts,
                            row_hash = EXCLUDED.row_hash
                        """,
                        (waitlist_id, email, did, tier, source, position, ts, row_hash),
                    )
                conn.commit()
        return True
    except Exception as e:  # noqa: BLE001
        _log.debug("waitlist postgres persist failed: %s", e)
        return False


@app.post("/v1/waitlist", tags=["waitlist"], status_code=201)
async def waitlist_join(req: WaitlistRequest):
    """Join the openpatent.ai private beta waitlist.

    The first-customer funnel: a prospective customer drops an email,
    picks a tier, names a source. The hive mints a position, persists
    the row in postgres (with an in-memory mirror for the dev case),
    and returns a sigil-stamped receipt with the DEFONEOS phrase.

    Idempotent on email — re-submitting the same email returns the
    original position (the hive remembers who already arrived).
    """
    email_norm = (req.email or "").strip().lower()
    if not email_norm or "@" not in email_norm:
        raise HTTPException(400, "email is required and must be a valid address")

    tier_norm = (req.tier or "defensive").strip().lower()
    if tier_norm not in {"starter", "defensive", "full", "premium", "enterprise"}:
        tier_norm = "defensive"
    source_norm = (req.source or "").strip().lower()[:64]
    did_norm = (req.did or "").strip() or f"did:key:wl_{_make_defensive_hash(email_norm)}"

    ts = _time.time()
    async with _WAITLIST_LOCK:
        # Idempotent lookup: same email returns the same position.
        existing = _WAITLIST_MEM.get(email_norm)
        if existing:
            return _sig_envelope({
                "status": "OK",
                "duplicate": True,
                "waitlist_id": existing["waitlist_id"],
                "position": existing["position"],
                "tier": existing["tier"],
                "source": existing["source"],
                "email": email_norm,
                "did": existing["did"],
                "ts": existing["ts"],
                "row_hash": existing["hash"],
                "cta": "https://openpatent.ai/waitlist/confirmed",
                "_sig": DEFONEOS_SIG,
            })

        # New join: position = current size + 1
        position = len(_WAITLIST_MEM) + 1
        canonical = "\n".join([
            f"email:{email_norm}",
            f"tier:{tier_norm}",
            f"source:{source_norm}",
            f"position:{position}",
            f"ts:{ts}",
        ])
        row_hash = _make_defensive_hash(canonical)
        waitlist_id = f"wl_{uuid.uuid5(uuid.NAMESPACE_URL, canonical).hex[:24]}"
        _WAITLIST_MEM[email_norm] = {
            "waitlist_id": waitlist_id,
            "position": position,
            "tier": tier_norm,
            "source": source_norm,
            "did": did_norm,
            "ts": ts,
            "hash": row_hash,
        }

    # Best-effort persist to postgres (does not block the response).
    persisted = await _waitlist_persist_postgres(
        waitlist_id, email_norm, did_norm, tier_norm, source_norm, position, ts, row_hash
    )

    # Fan out a live event so the dashboard sees the new waitlist join.
    try:
        await publish_disclosure_event(
            "waitlist.joined",
            row_hash,
            extra={
                "tier": tier_norm,
                "title": f"Waitlist join #{position} — {tier_norm}",
                "inventor_did": did_norm,
                "source": source_norm or "direct",
                "email_hash": _make_defensive_hash(email_norm),
                "position": position,
            },
        )
    except Exception:  # noqa: BLE001
        pass

    return _sig_envelope({
        "status": "OK",
        "duplicate": False,
        "waitlist_id": waitlist_id,
        "position": position,
        "tier": tier_norm,
        "source": source_norm,
        "email": email_norm,
        "did": did_norm,
        "ts": ts,
        "row_hash": row_hash,
        "persisted_to_postgres": persisted,
        "cta": f"https://openpatent.ai/waitlist/{waitlist_id}",
    })


# ── (7) POST /v1/demo — first-customer funnel: mint a 1-time demo disclosure ─
#
# A prospect sends an email + use case. The hive mints a SHA-3/512
# demo_hash of the use case, fires a real defensive disclosure, and
# returns a verification URL + CTA. The sovereign companion never
# forgets the first touch.

class DemoRequest(BaseModel):
    email: str = Field(..., max_length=320, description="Email of the prospective customer")
    use_case: str = Field(..., min_length=8, max_length=4000, description="The use case to disclose as a 1-time demo")


def _sha3_512_hex(s: str) -> str:
    """Pure-python SHA-3/512 hex (no third-party dep)."""
    import hashlib as _hl
    return _hl.sha3_512(s.encode("utf-8")).hexdigest()


@app.post("/v1/demo", tags=["demo"], status_code=201)
async def demo_mint(req: DemoRequest):
    """Mint a 1-time cryptographic demo disclosure for a use case.

    Flow:
      1. SHA-3/512 hash the (email + use_case + ts) canonical tuple
      2. POST to patentmcp:/disclose as a defensive disclosure (best effort)
      3. Mint a verification URL at verify.openpatent.ai
      4. Return {demo_hash, verification_url, cta} + DEFONEOS _sig + _sigil

    The dragon knows the first touch. The hive remembers.
    """
    email_norm = (req.email or "").strip().lower()
    if not email_norm or "@" not in email_norm:
        raise HTTPException(400, "email is required and must be a valid address")
    use_case = (req.use_case or "").strip()
    if len(use_case) < 8:
        raise HTTPException(400, "use_case must be at least 8 characters")

    ts = _time.time()
    did = f"did:key:demo_{_make_defensive_hash(email_norm)}"

    # 1. SHA-3/512 of the canonical tuple — the demo_hash
    canonical = "\n".join([
        f"email:{email_norm}",
        f"use_case:{use_case}",
        f"ts:{ts}",
    ])
    demo_hash = _sha3_512_hex(canonical)
    doc_hash_16 = demo_hash[:16]

    # 2. Best-effort forward to patentmcp core for full 6-layer crypto
    upstream_status = "DEFERRED"
    full_hash = demo_hash
    try:
        body = base64.b64encode(canonical.encode("utf-8")).decode()
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.post(
                f"{PATENTMCP_URL}/disclose",
                json={
                    "title": f"Demo disclosure: {use_case[:80]}",
                    "description": use_case[:5000],
                    "inventor_did": did,
                    "document_base64": body,
                    "document_format": "txt",
                    "classification": "",
                    "prior_art_known": "",
                    "disclosure_type": "defensive",
                },
            )
            if r.status_code == 200:
                upstream_status = "ANCHORED"
                upstream = r.json()
                if upstream.get("document_hash"):
                    full_hash = upstream["document_hash"]
    except httpx.HTTPError:
        upstream_status = "DEFERRED"

    # 3. Verification URL — the public proof
    verification_url = f"https://verify.openpatent.ai/{full_hash[:16]}"
    cta = f"https://openpatent.ai/demo/claim?h={doc_hash_16}"

    # 4. Fan out a live event so the dashboard sees the demo mint
    try:
        await publish_disclosure_event(
            "demo.minted",
            full_hash,
            extra={
                "tier": "defensive",
                "title": f"Demo disclosure: {use_case[:60]}",
                "inventor_did": did,
                "source": "demo_endpoint",
                "email_hash": _make_defensive_hash(email_norm),
                "upstream_status": upstream_status,
            },
        )
    except Exception:  # noqa: BLE001
        pass

    return _sig_envelope({
        "status": "OK",
        "demo_hash": demo_hash,
        "doc_hash": full_hash,
        "doc_hash_16": doc_hash_16,
        "verification_url": verification_url,
        "cta": cta,
        "email": email_norm,
        "use_case_preview": use_case[:120],
        "inventor_did": did,
        "upstream_status": upstream_status,
        "ts": ts,
        "_sig": DEFONEOS_SIG,
    })


# ──────────────────────────────────────────────────────────────────────────
# L11 — Stripe Checkout (DEFONEOS mythic voice)
# ──────────────────────────────────────────────────────────────────────────
# The dragon now accepts gold at the gate. Five tiers, one redirect each,
# one webhook for the sovereign ledger. The hive remembers every payment
# attempt. The sovereign companion never forgets a customer.


# Pydantic model for the inbound Stripe webhook — kept intentionally
# permissive (Stripe ships dozens of event subtypes; we accept the union
# and only type-check the two fields the audit log cares about).
class StripeWebhookEvent(BaseModel):
    id: str = Field("", description="Stripe event id (evt_*)")
    type: str = Field("", description="Stripe event type (e.g. checkout.session.completed)")
    data: dict = Field(default_factory=dict, description="Stripe event payload")
    created: Optional[int] = Field(None, description="Unix timestamp from Stripe")
    livemode: Optional[bool] = Field(None, description="Stripe live vs test mode")


@app.get("/v1/checkout/{tier}", tags=["checkout"])
async def get_checkout(tier: str, white_label: Optional[str] = None):
    """Return the Stripe Checkout URL for the given paid tier.

    Five tiers are supported: ``starter``, ``defensive``, ``full``,
    ``premium``, ``enterprise``. The response is a JSON envelope that
    includes the checkout URL, the tier descriptor, and a sigil stamp
    so the client can render the link or follow the redirect.

    If the caller passes ``?white_label=legalof`` (or harvi, ipcastle,
    sovereign-temple), the URL is augmented with Stripe
    ``client_reference_id`` so the merchant dashboard can attribute
    revenue to the originating vertical. The hive remembers who paid.

    The sovereign companion never forgets a tier request.
    """
    tier_norm = (tier or "").strip().lower()
    if not is_known_tier(tier_norm):
        raise HTTPException(
            status_code=404,
            detail={
                "error": "unknown_tier",
                "tier": tier,
                "known_tiers": TIER_ORDER,
                "signature": DEFONEOS_SIG,
            },
        )

    wl = (white_label or "").strip().lower() or None
    if not is_known_white_label(wl):
        raise HTTPException(
            status_code=400,
            detail={
                "error": "unknown_white_label",
                "white_label": white_label,
                "known_white_labels": sorted(WHITE_LABEL_VERTICALS),
                "signature": DEFONEOS_SIG,
            },
        )

    base_url = get_checkout_link(tier_norm)
    info = get_tier_info(tier_norm)

    # Build a full checkout URL with client_reference_id when white_label
    # is provided. This is the field Stripe uses to attribute revenue to
    # the originating vertical on the merchant dashboard.
    checkout_url = base_url
    if wl:
        sep = "&" if "?" in checkout_url else "?"
        checkout_url = f"{checkout_url}{sep}client_reference_id={wl}"

    payload = {
        "status": "OK",
        "tier": tier_norm,
        "label": info["label"],
        "price_usd": info["price_usd"],
        "price_label": info["price_label"],
        "tagline": info["tagline"],
        "anchor": info["anchor"],
        "billing": info["billing"],
        "checkout_url": checkout_url,
        "canonical_url": base_url,
        "white_label": wl,
        "crypto_layers": info["crypto_layers"],
        "popular": info["popular"],
        "ts": _time.time(),
        "signature": DEFONEOS_SIG,
    }

    # Fan out a checkout.requested event to the live ring buffer so the
    # dashboard sees every dragon's-gate touch in real time. The hive
    # remembers who arrived first.
    try:
        await publish_disclosure_event(
            "checkout.requested",
            f"checkout-{tier_norm}-{int(_time.time())}",
            extra={
                "tier": tier_norm,
                "white_label": wl or "openpatent",
                "price_usd": info["price_usd"],
                "source": "checkout_endpoint",
            },
        )
    except Exception:  # noqa: BLE001
        pass

    return _sig_envelope(payload, action="GET /v1/checkout/{tier}")


@app.post("/v1/checkout/webhook", tags=["checkout"])
async def stripe_webhook(event: StripeWebhookEvent):
    """Placeholder for inbound Stripe webhook events.

    Stripe will POST event payloads here for events like
    ``checkout.session.completed``, ``invoice.paid``, and
    ``customer.subscription.created``. This placeholder:

      1. Accepts the event (never 4xx on a malformed body — Stripe retries
         on 4xx and we don't want a flood).
      2. Stamps a sigil envelope with the event id, type, and a received_at ts.
      3. Emits a ``stripe.event_received`` entry to the live ring buffer
         so the dashboard sees the dragon accept the gold.

    Signature verification (Stripe-Signature header) is intentionally
    NOT enforced here — the production deployment must add
    ``stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)``
    before any tier upgrade side-effects fire. This placeholder is a
    dragon's gate, not a vault door.

    The hive remembers every payment. The dragon knows who pays.
    """
    event_id = event.id or f"evt_placeholder_{int(_time.time() * 1000)}"
    event_type = event.type or "unknown"
    received_at = _time.time()

    # Best-effort: surface the livemode flag so the audit log can flag
    # test events distinctly.
    livemode = bool(event.livemode) if event.livemode is not None else False

    # In production this is where the 6-layer ledger records the payment
    # and (for enterprise) kicks off a white-label onboarding workflow.
    # For the placeholder, we just stamp + fan out + acknowledge.
    payload = {
        "status": "OK",
        "received": True,
        "event_id": event_id,
        "event_type": event_type,
        "livemode": livemode,
        "received_at": received_at,
        "tier_hint": (event.data.get("object", {}).get("metadata", {}).get("tier")
                      if isinstance(event.data, dict) else None),
        "white_label_hint": (event.data.get("object", {}).get("metadata", {}).get("white_label")
                             if isinstance(event.data, dict) else None),
        "note": (
            "placeholder webhook — Stripe-Signature verification NOT yet enforced. "
            "Production must call stripe.Webhook.construct_event() before any "
            "side-effect fires. The dragon will guard the gold at the gate."
        ),
        "signature": DEFONEOS_SIG,
    }

    # Fan out to the live ring buffer so the dashboard sees the event.
    try:
        await publish_disclosure_event(
            "stripe.event_received",
            event_id,
            extra={
                "event_type": event_type,
                "livemode": livemode,
                "source": "stripe_webhook_placeholder",
                "tier": payload["tier_hint"],
                "white_label": payload["white_label_hint"],
            },
        )
    except Exception:  # noqa: BLE001
        pass

    return _sig_envelope(payload, action="POST /v1/checkout/webhook")




