#!/usr/bin/env python3
"""
OpenPatent.ai MCP Manifest Server
==================================

Public MCP server discovery endpoint at mcp.openpatent.ai (port 3214).

This serves:
  /.well-known/mcp.json  — MCP server manifest (canonical)
  /tools                 — human-readable tool list
  /install/{client}      — one-line install for Claude Code / Cursor / Windsurf
  /health                — health

When an MCP client (Claude Code, Cursor, etc.) sees /.well-known/mcp.json
in DNS for a domain, it can auto-discover and offer to install the server.
This is the same pattern used by the official MCP servers at modelcontextprotocol/servers.
"""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.responses import JSONResponse, PlainTextResponse

app = FastAPI(title="OpenPatent.ai MCP Manifest", version="1.3.0")

MANIFEST = {
    "$schema": "https://modelcontextprotocol.io/schemas/server-manifest-v1.json",
    "name": "openpatent-mcp",
    "displayName": "OpenPatent.ai",
    "version": "1.3.0",
    "description": (
        "6-layer cryptographic invention disclosure for AI agents. "
        "Disclose first. AI second. — $10 insurance against AI idea theft."
    ),
    "homepage": "https://openpatent.ai",
    "repository": "https://github.com/CSOAI-ORG/patentmcp",
    "license": "MIT",
    "publisher": {
        "name": "CSOAI — Council for the Safety of AI",
        "url": "https://csoai.org",
        "email": "founder@csoai.org",
    },
    "icon": "https://openpatent.ai/icon.png",
    "tools": [
        {
            "name": "disclose_invention",
            "title": "Disclose Invention",
            "description": (
                "Submit an invention to the OpenPatent.ai sovereign hive and "
                "receive a 6-layer cryptographic proof: SHA-3/512 hash + "
                "HMAC-SHA256 witness + Ed25519 signature + Bitcoin OTS anchor + "
                "C2PA credential + hash-chain seal. Returns the Bitcoin "
                "transaction ID and a public verify.openpatent.ai attestation "
                "URL. openpatent.ai — 6-layer cryptographic disclosure. "
                "Disclose First. AI Second."
            ),
            "inputSchema": {
                "type": "object",
                "required": ["title", "description", "inventor_did", "document_base64"],
                "properties": {
                    "title": {"type": "string", "maxLength": 200},
                    "description": {"type": "string", "maxLength": 5000},
                    "inventor_did": {"type": "string", "description": "did:key:... or did:csoai:..."},
                    "document_base64": {"type": "string"},
                    "document_format": {"type": "string", "enum": ["pdf", "doc", "code", "data", "txt", "md"], "default": "pdf"},
                    "classification": {"type": "string", "description": "IPC/CPC code e.g. G06N7/01"},
                    "tier": {"type": "string", "enum": ["defensive", "full", "premium"], "default": "defensive"},
                },
            },
        },
        {
            "name": "verify_disclosure",
            "title": "Verify Disclosure",
            "description": (
                "Verify a prior disclosure against its 6-layer cryptographic "
                "proof — SHA-3/512 + HMAC + Ed25519 + Bitcoin OTS + C2PA + "
                "hash-chain — yielding a court-admissible (FRE 902 / eIDAS) "
                "self-authenticating record. Pass disclosure_json for the full "
                "check; add document_base64 to re-hash the document for the "
                "strongest verification. openpatent.ai — 6-layer cryptographic "
                "disclosure. Disclose First. AI Second."
            ),
            "inputSchema": {
                "type": "object",
                "properties": {
                    "disclosure_json": {"type": "string"},
                    "document_base64": {"type": "string"},
                    "document_hash": {"type": "string"},
                },
            },
        },
        {
            "name": "search_prior_art",
            "title": "Search Prior Art",
            "description": (
                "Sweep the OpenPatent.ai prior-art registry — full-text plus "
                "IPC/CPC faceted filtering — and return ranked results tied to "
                "their 6-layer cryptographic disclosure proofs (disclosure dates, "
                "jurisdictions, inventor DIDs). openpatent.ai — 6-layer "
                "cryptographic disclosure. Disclose First. AI Second."
            ),
            "inputSchema": {
                "type": "object",
                "properties": {
                    "query": {"type": "string"},
                    "classification": {"type": "string"},
                    "date_from": {"type": "string"},
                    "date_to": {"type": "string"},
                    "tier": {"type": "string", "enum": ["defensive", "full", "premium"]},
                    "limit": {"type": "integer", "default": 25},
                },
            },
        },
        {
            "name": "draft_patent_claims",
            "title": "Draft Patent Claims",
            "description": (
                "Invoke the AI claim-drafter to produce independent + dependent "
                "claims (apparatus, method, computer-readable medium) linked by "
                "hash to the invention's 6-layer cryptographic disclosure. "
                "Premium tier. openpatent.ai — 6-layer cryptographic disclosure. "
                "Disclose First. AI Second."
            ),
            "inputSchema": {
                "type": "object",
                "required": ["invention_description"],
                "properties": {
                    "invention_description": {"type": "string"},
                    "claim_type_preference": {"type": "string", "enum": ["broad", "narrow", "comprehensive"]},
                    "jurisdiction": {"type": "string", "enum": ["US", "EU", "UK", "JP", "CN"]},
                },
            },
        },
        {
            "name": "hive_stats",
            "title": "Hive Stats",
            "description": (
                "Read the live counters of the OpenPatent.ai sovereign hive — "
                "total disclosures, tier breakdown, Bitcoin OTS anchor height, "
                "BFT council throughput — each datapoint anchored to a 6-layer "
                "cryptographic proof chain. openpatent.ai — 6-layer cryptographic "
                "disclosure. Disclose First. AI Second."
            ),
            "inputSchema": {"type": "object", "properties": {}},
        },
        {
            "name": "ots_verify",
            "title": "Verify OTS Timestamp",
            "description": (
                "Submit a detached .ots timestamp file and re-verify its Bitcoin "
                "attestation chain independently, cross-checking the claimed "
                "SHA-256 document hash against the .ots file_digest. Replays the "
                "same Bitcoin OTS layer that backs every 6-layer cryptographic "
                "disclosure. openpatent.ai — 6-layer cryptographic disclosure. "
                "Disclose First. AI Second."
            ),
            "inputSchema": {
                "type": "object",
                "required": ["ots_base64"],
                "properties": {
                    "ots_base64": {"type": "string", "description": "Base64-encoded .ots detached timestamp file"},
                    "document_base64": {"type": "string", "description": "Optional original document for strongest hash cross-check"},
                },
            },
        },
        {
            "name": "attest_bft",
            "title": "BFT Council Attestation",
            "description": (
                "Convene the 33-agent Byzantine Fault Tolerant council of the "
                "sovereign hive to review a disclosure against the 6-layer "
                "cryptographic proof. Returns 22/33 quorum approval, care-veto "
                "diagnostics, and an optional cross-hive attestation from "
                "meok-keystone. openpatent.ai — 6-layer cryptographic disclosure. "
                "Disclose First. AI Second."
            ),
            "inputSchema": {
                "type": "object",
                "required": ["disclosure_hash"],
                "properties": {
                    "disclosure_hash": {"type": "string", "description": "SHA-3/512 hash of the disclosure to review"},
                    "disclosure_result": {"type": "object", "description": "Full disclosure JSON (recommended for richer agent context)"},
                    "cross_hive": {"type": "boolean", "default": False, "description": "Also request meok-keystone attestation"},
                },
            },
        },
        {
            "name": "manage_docket",
            "title": "Manage Docket",
            "description": (
                "Open the docket manager to add, update, or summarize deadlines "
                "and prosecution events for a disclosure, with every action "
                "cryptographically chained back to the 6-layer disclosure proof. "
                "Premium tier. openpatent.ai — 6-layer cryptographic disclosure. "
                "Disclose First. AI Second."
            ),
            "inputSchema": {
                "type": "object",
                "required": ["action"],
                "properties": {
                    "action": {"type": "string", "enum": ["list", "add", "update", "summary"]},
                    "disclosure_hash": {"type": "string"},
                    "docket_id": {"type": "string"},
                    "event": {"type": "string", "description": "e.g. 'office_action', 'response_due', 'filing_fee'"},
                    "due_date": {"type": "string", "description": "ISO-8601 date"},
                    "notes": {"type": "string"},
                },
            },
        },
        {
            "name": "draft_prosecution",
            "title": "Draft Prosecution Response",
            "description": (
                "Draft a full office-action response — claim amendments, argument "
                "structure, MPEP-grounded rejections countered — linked by hash to "
                "the 6-layer cryptographic disclosure it defends. Premium tier. "
                "openpatent.ai — 6-layer cryptographic disclosure. Disclose First. "
                "AI Second."
            ),
            "inputSchema": {
                "type": "object",
                "required": ["disclosure_hash", "office_action"],
                "properties": {
                    "disclosure_hash": {"type": "string"},
                    "office_action": {"type": "string", "description": "Full text of the office action"},
                    "jurisdiction": {"type": "string", "enum": ["US", "EU", "UK", "JP", "CN"], "default": "US"},
                    "strategy": {"type": "string", "enum": ["narrow", "broad", "comprehensive"], "default": "comprehensive"},
                },
            },
        },
        {
            "name": "consult_patentability",
            "title": "Patentability Consult",
            "description": (
                "Engage a patentability + freedom-to-operate consult that scores "
                "35 USC § 102 / 103 / EPC Art. 54 risk against the prior-art "
                "registry, anchoring every conclusion in the 6-layer cryptographic "
                "disclosure chain. Premium tier. openpatent.ai — 6-layer "
                "cryptographic disclosure. Disclose First. AI Second."
            ),
            "inputSchema": {
                "type": "object",
                "required": ["invention_description"],
                "properties": {
                    "invention_description": {"type": "string"},
                    "jurisdiction": {"type": "string", "enum": ["US", "EU", "UK", "JP", "CN"], "default": "US"},
                    "claim_draft": {"type": "string", "description": "Optional draft claims to evaluate"},
                    "product_to_clear": {"type": "string", "description": "Optional product description for FTO analysis"},
                },
            },
        },
        {
            "name": "strategy_filing",
            "title": "Filing Strategy",
            "description": (
                "Generate a filing strategy plus licensing-target recommendations "
                "across US/EU/UK/JP/CN, with every recommendation weighted by the "
                "6-layer cryptographic disclosure strength of the underlying "
                "invention. Premium tier. openpatent.ai — 6-layer cryptographic "
                "disclosure. Disclose First. AI Second."
            ),
            "inputSchema": {
                "type": "object",
                "required": ["disclosure_hash"],
                "properties": {
                    "disclosure_hash": {"type": "string"},
                    "budget_usd": {"type": "integer", "description": "Filing budget in USD"},
                    "target_markets": {"type": "array", "items": {"type": "string", "enum": ["US", "EU", "UK", "JP", "CN"]}},
                    "licensing_goals": {"type": "string"},
                },
            },
        },
        {
            "name": "get_disclosure",
            "title": "Get Disclosure",
            "description": (
                "Look up a disclosure by the 16-character prefix of its SHA-3/512 "
                "hash and return its full 6-layer cryptographic proof bundle — "
                "Ed25519 signature, Bitcoin OTS txid, C2PA credential, and "
                "hash-chain seal. openpatent.ai — 6-layer cryptographic disclosure. "
                "Disclose First. AI Second."
            ),
            "inputSchema": {
                "type": "object",
                "required": ["doc_hash_prefix"],
                "properties": {
                    "doc_hash_prefix": {"type": "string", "minLength": 16, "maxLength": 64, "description": "First 16+ hex chars of the SHA-3/512 document hash"},
                },
            },
        },
        {
            "name": "list_bft_proposals",
            "title": "List BFT Council Proposals",
            "description": (
                "Survey the open Byzantine Fault Tolerant council proposals "
                "awaiting agent review — each proposal bound by hash to a "
                "6-layer cryptographic disclosure (SHA-3/512 + HMAC + Ed25519 + "
                "Bitcoin OTS + C2PA + hash-chain). Returns proposal queue "
                "positions, agent vote tallies, and quorum thresholds for the "
                "sovereign hive. openpatent.ai — 6-layer cryptographic "
                "disclosure. Disclose First. AI Second."
            ),
            "inputSchema": {
                "type": "object",
                "properties": {
                    "status": {"type": "string", "enum": ["pending", "voting", "approved", "vetoed", "all"], "default": "all", "description": "Filter proposals by council status"},
                    "limit": {"type": "integer", "default": 25, "minimum": 1, "maximum": 100},
                    "offset": {"type": "integer", "default": 0, "minimum": 0},
                },
            },
        },
        {
            "name": "get_bft_queue",
            "title": "Get BFT Review Queue",
            "description": (
                "Read the live BFT council review queue — disclosures waiting "
                "on a 22/33 agent quorum anchored to the 6-layer cryptographic "
                "proof stack (SHA-3/512 + HMAC + Ed25519 + Bitcoin OTS + C2PA + "
                "hash-chain). Returns estimated wait, agent availability, and "
                "care-veto watchlist status. openpatent.ai — 6-layer "
                "cryptographic disclosure. Disclose First. AI Second."
            ),
            "inputSchema": {
                "type": "object",
                "properties": {
                    "hive": {"type": "string", "enum": ["openpatent", "meok-keystone", "all"], "default": "openpatent", "description": "Which sovereign hive's queue to read"},
                    "include_diagnostics": {"type": "boolean", "default": False, "description": "Include per-agent availability + care-veto diagnostics"},
                },
            },
        },
        {
            "name": "disclose_batch",
            "title": "Disclose Invention Batch",
            "description": (
                "Submit a batch of up to 50 inventions to the OpenPatent.ai "
                "sovereign hive in a single signed envelope — each disclosure "
                "receives its own 6-layer cryptographic proof (SHA-3/512 + HMAC + "
                "Ed25519 + Bitcoin OTS + C2PA + hash-chain) while the envelope "
                "itself is anchored by a Merkle root. Returns an array of "
                "disclosure hashes plus a single batch-level Bitcoin OTS txid. "
                "openpatent.ai — 6-layer cryptographic disclosure. Disclose "
                "First. AI Second."
            ),
            "inputSchema": {
                "type": "object",
                "required": ["inventor_did", "items"],
                "properties": {
                    "inventor_did": {"type": "string", "description": "did:key:... or did:csoai:..."},
                    "items": {
                        "type": "array",
                        "minItems": 1,
                        "maxItems": 50,
                        "items": {
                            "type": "object",
                            "required": ["title", "description", "document_base64"],
                            "properties": {
                                "title": {"type": "string", "maxLength": 200},
                                "description": {"type": "string", "maxLength": 5000},
                                "document_base64": {"type": "string"},
                                "document_format": {"type": "string", "enum": ["pdf", "doc", "code", "data", "txt", "md"], "default": "pdf"},
                                "classification": {"type": "string", "description": "IPC/CPC code"},
                                "tier": {"type": "string", "enum": ["starter", "defensive", "full", "premium"], "default": "defensive"},
                            },
                        },
                    },
                    "tier": {"type": "string", "enum": ["starter", "defensive", "full", "premium"], "default": "defensive"},
                    "request_bft_review": {"type": "boolean", "default": False, "description": "Trigger 33-agent BFT council review of the batch (premium only)"},
                },
            },
        },
        {
            "name": "get_leaderboard",
            "title": "Hive Leaderboard",
            "description": (
                "Read the OpenPatent.ai sovereign hive leaderboard — top "
                "inventors, top jurisdictions, most-attested 6-layer "
                "cryptographic disclosures (SHA-3/512 + HMAC + Ed25519 + "
                "Bitcoin OTS + C2PA + hash-chain), and BFT-quorum achievement "
                "counts. Reputation is computed from proof strength, not vanity "
                "metrics. openpatent.ai — 6-layer cryptographic disclosure. "
                "Disclose First. AI Second."
            ),
            "inputSchema": {
                "type": "object",
                "properties": {
                    "category": {"type": "string", "enum": ["inventors", "jurisdictions", "disclosures", "bft_quorum", "all"], "default": "all"},
                    "period": {"type": "string", "enum": ["day", "week", "month", "quarter", "all_time"], "default": "all_time"},
                    "limit": {"type": "integer", "default": 25, "minimum": 1, "maximum": 100},
                },
            },
        },
        {
            "name": "get_community_stats",
            "title": "Community Stats",
            "description": (
                "Read the OpenPatent.ai community pulse — active agent count, "
                "disclosures per tier, BFT council throughput, Bitcoin OTS "
                "anchor rate, and hash-chain growth — every metric anchored "
                "to the 6-layer cryptographic disclosure proof (SHA-3/512 + "
                "HMAC + Ed25519 + Bitcoin OTS + C2PA + hash-chain). "
                "openpatent.ai — 6-layer cryptographic disclosure. Disclose "
                "First. AI Second."
            ),
            "inputSchema": {
                "type": "object",
                "properties": {
                    "period": {"type": "string", "enum": ["hour", "day", "week", "month"], "default": "day"},
                    "include_historical": {"type": "boolean", "default": False, "description": "Include time-series points for charting"},
                },
            },
        },
        {
            "name": "get_pricing_tiers",
            "title": "Get Pricing Tiers",
            "description": (
                "List the OpenPatent.ai sovereign hive pricing tiers — "
                "starter, defensive, full, and premium — with each tier's "
                "6-layer cryptographic disclosure coverage (SHA-3/512 + HMAC + "
                "Ed25519 + Bitcoin OTS + C2PA + hash-chain), BFT council "
                "access, and cross-jurisdiction support. Returns the canonical "
                "tier matrix that the public pricing page renders. "
                "openpatent.ai — 6-layer cryptographic disclosure. Disclose "
                "First. AI Second."
            ),
            "inputSchema": {
                "type": "object",
                "properties": {
                    "currency": {"type": "string", "enum": ["USD", "EUR", "GBP", "JPY", "CNY"], "default": "USD"},
                    "include_volume_discounts": {"type": "boolean", "default": True, "description": "Show enterprise / volume discount bands"},
                },
            },
        },
        {
            "name": "audit_log_search",
            "title": "Search Audit Log",
            "description": (
                "Search the OpenPatent.ai sovereign hive audit log — every "
                "disclosure, verification, BFT vote, and docket event, each "
                "entry bound to the 6-layer cryptographic proof chain "
                "(SHA-3/512 + HMAC + Ed25519 + Bitcoin OTS + C2PA + "
                "hash-chain). Filter by hash prefix, tier, or ISO-8601 time "
                "range to return a court-admissible trail of registry "
                "activity. openpatent.ai — 6-layer cryptographic disclosure. "
                "Disclose First. AI Second."
            ),
            "inputSchema": {
                "type": "object",
                "properties": {
                    "hash_prefix": {"type": "string", "minLength": 16, "maxLength": 64, "description": "First 16+ hex chars of a SHA-3/512 hash to filter on"},
                    "tier": {"type": "string", "enum": ["starter", "defensive", "full", "premium"], "description": "Filter by pricing tier"},
                    "since": {"type": "string", "description": "ISO-8601 lower bound (e.g. 2026-01-01T00:00:00Z)"},
                    "until": {"type": "string", "description": "ISO-8601 upper bound (e.g. 2026-12-31T23:59:59Z)"},
                    "limit": {"type": "integer", "default": 50, "minimum": 1, "maximum": 500},
                },
            },
        },
        {
            "name": "jurisdiction_check",
            "title": "Jurisdiction Check",
            "description": (
                "Given a country code and optional invention type, return the "
                "applicable statutes, treaty memberships, and binding case "
                "law for that jurisdiction, each citation cross-referenced to "
                "the 6-layer cryptographic disclosure chain (SHA-3/512 + "
                "HMAC + Ed25519 + Bitcoin OTS + C2PA + hash-chain). Pulls "
                "live from the OpenPatent.ai sovereign-hive zone index and "
                "filters to the requested nation. openpatent.ai — 6-layer "
                "cryptographic disclosure. Disclose First. AI Second."
            ),
            "inputSchema": {
                "type": "object",
                "required": ["country_code"],
                "properties": {
                    "country_code": {"type": "string", "minLength": 2, "maxLength": 3, "description": "ISO 3166-1 alpha-2 or alpha-3 country code (e.g. US, DE, JP)"},
                    "invention_type": {"type": "string", "enum": ["utility", "design", "plant", "software", "biotech", "ai", "business_method"], "description": "Optional filter for the invention category"},
                },
            },
        },
        {
            "name": "get_treasury_balance",
            "title": "Treasury Balance (x402 split)",
            "description": (
                "Read the OpenPatent.ai sovereign hive x402 treasury split "
                "for the current month — total fee inflow, agent-council "
                "share, OTS-anchor share, C2PA-issuer share, and CSOAI "
                "foundation share — each ledger entry anchored to the "
                "6-layer cryptographic disclosure chain (SHA-3/512 + HMAC + "
                "Ed25519 + Bitcoin OTS + C2PA + hash-chain). Returns the "
                "canonical split that backs every disclosure fee. "
                "openpatent.ai — 6-layer cryptographic disclosure. Disclose "
                "First. AI Second."
            ),
            "inputSchema": {"type": "object", "properties": {}},
        },
        {
            "name": "get_calendar_status",
            "title": "OTS Calendar Status",
            "description": (
                "Read the OpenPatent.ai OTS calendar health — pending "
                "attestations, last Bitcoin block height anchored, average "
                "confirmation latency, and Bitcoin Core / Polygon dual-anchor "
                "liveness — each datapoint verified against the 6-layer "
                "cryptographic disclosure chain (SHA-3/512 + HMAC + Ed25519 + "
                "Bitcoin OTS + C2PA + hash-chain). Use it to confirm the "
                "time-stamping pipeline is green before submitting a "
                "high-value disclosure. openpatent.ai — 6-layer cryptographic "
                "disclosure. Disclose First. AI Second."
            ),
            "inputSchema": {"type": "object", "properties": {}},
        },
        {
            "name": "get_network_uptime",
            "title": "Network Uptime (24h)",
            "description": (
                "Read the 24-hour uptime and rolling availability for every "
                "OpenPatent.ai sovereign-hive service — disclosure gateway, "
                "verify.openpatent.ai, BFT council, OTS calendar, C2PA "
                "issuer, and hash-chain indexer — each service status "
                "cryptographically bound to the 6-layer disclosure chain "
                "(SHA-3/512 + HMAC + Ed25519 + Bitcoin OTS + C2PA + "
                "hash-chain). Returns the canonical status page payload. "
                "openpatent.ai — 6-layer cryptographic disclosure. Disclose "
                "First. AI Second."
            ),
            "inputSchema": {"type": "object", "properties": {}},
        },
    ],
    "transports": [
        {"type": "stdio", "command": "npx", "args": ["-y", "@openpatent/mcp-server"]},
        {"type": "http", "url": "https://mcp.openpatent.ai"},
    ],
    "pricing": {
        "model": "PAYG",
        "currency": "USD",
        "tiers": {
            "defensive": {"price": 149, "description": "Bitcoin + Polygon dual-anchor"},
            "full": {"price": 999, "description": "+ 5-jurisdiction crosswalk + AI claims"},
            "premium": {"price": 2499, "description": "+ 33-agent BFT council review"},
        },
        "free_tier": {"description": "Self-hosted, unlimited local disclosures"},
    },
    "legal": {
        "jurisdictions": ["US", "EU", "UK", "JP", "CN"],
        "frameworks": ["eIDAS", "FRE 902", "WIPO", "EPC Art. 54", "35 USC § 102"],
    },
    "metadata": {
        "category": "legal-tech",
        "tags": ["patent", "ip", "blockchain", "disclosure", "prior-art", "ai-safety", "sovereignty"],
        "hive": "openpatent",
        "csoai_did": "did:web:csoai.org",
    },
}


@app.get("/.well-known/mcp.json")
async def mcp_manifest():
    return MANIFEST


@app.get("/mcp.json")
async def mcp_manifest_alias():
    return MANIFEST


@app.get("/tools")
async def tools():
    return {
        "tools": [
            {
                "name": t["name"],
                "title": t["title"],
                "description": t["description"],
                "tier_required": "premium"
                if t["name"] in (
                    "draft_patent_claims",
                    "draft_prosecution",
                    "consult_patentability",
                    "strategy_filing",
                    "manage_docket",
                )
                else ("full" if t["name"] == "attest_bft" else "defensive"),
            }
            for t in MANIFEST["tools"]
        ],
        "total": len(MANIFEST["tools"]),
    }


@app.get("/install/claude-code")
async def install_claude_code():
    """One-line install for Claude Code / Claude Desktop / Cursor."""
    return PlainTextResponse(
        'Add to ~/.claude.json or your MCP client config:\n\n'
        '{\n'
        '  "mcpServers": {\n'
        '    "openpatent": {\n'
        '      "command": "npx",\n'
        '      "args": ["-y", "@openpatent/mcp-server"],\n'
        '      "env": {\n'
        '        "OPENPATENT_API_KEY": "your-key-here",\n'
        '        "OPENPATENT_TIER": "defensive"\n'
        '      }\n'
        '    }\n'
        '  }\n'
        '}\n\n'
        'Get a key at https://openpatent.ai/dashboard\n'
    )


@app.get("/install/cursor")
async def install_cursor():
    return PlainTextResponse(
        'Add to ~/.cursor/mcp.json:\n\n'
        '{\n'
        '  "mcpServers": {\n'
        '    "openpatent": {\n'
        '      "url": "https://mcp.openpatent.ai/sse",\n'
        '      "headers": { "Authorization": "Bearer YOUR_KEY" }\n'
        '    }\n'
        '  }\n'
        '}\n'
    )


@app.get("/install/windsurf")
async def install_windsurf():
    return PlainTextResponse(
        'Add to ~/.codeium/windsurf/mcp_config.json:\n\n'
        '{\n'
        '  "mcpServers": {\n'
        '    "openpatent": {\n'
        '      "command": "npx",\n'
        '      "args": ["-y", "@openpatent/mcp-server"]\n'
        '    }\n'
        '  }\n'
        '}\n'
    )


@app.get("/health")
async def health():
    return {"status": "OK", "service": "mcp-manifest", "tools_published": len(MANIFEST["tools"])}


# ── Prometheus metrics ──────────────────────────────────────────────────────
import sys as _metrics_sys
_metrics_sys.path.insert(0, "/opt/_shared")
try:
    from metrics import instrument
    instrument(app, service_name="mcp-manifest", version="1.3.0", hive="openpatent")
except ImportError:
    pass  # metrics are optional; service still works without them

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3214, log_level="info")



