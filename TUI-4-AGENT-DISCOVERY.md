# TUI 4 — Agent Economy and Protocol Discovery
**Generated:** 2026-09-11T13:00:00Z
**Basis:** master (b9e752aa)
**Branch:** agents/discovery-consolidation-20260911

---

## Protocol Inventory

### MCP (Model Context Protocol)

| Item | State | Evidence |
|------|-------|----------|
| Endpoint | https://councilof.ai/mcp | .mcp.json, llms.txt |
| Official Registry | LISTED (330 servers, 1,272 version entries) | mcp-directories.json |
| Smithery | LISTED | mcp-directories.json |
| Glama | LISTED | mcp-directories.json |
| Docker MCP | LISTED | mcp-directories.json |
| PulseMCP | UNKNOWN | mcp-directories.json (probe inconclusive) |
| MCP.so | NOT_LISTED | mcp-directories.json |
| Cline | NOT_LISTED | mcp-directories.json |
| PyPI packages | 329 | mcp-directories.json totals |
| npm packages | 1 | mcp-directories.json totals |
| Asset-specific tools | 0 | readiness.json |
| Tool discovery | GENERIC_CATALOG_DISCOVERABLE | Single endpoint, parameterized |

### A2A (Agent-to-Agent Protocol)

| Item | State | Evidence |
|------|-------|----------|
| Agent Card URL | https://councilof.ai/.well-known/agent-card.json | Live (HTTP 200) |
| Card version | 1.1.0 | agent-card.json |
| Protocol | A2A v1.0, JSON-RPC 1.0 | agent-card.json |
| Endpoint | https://councilof.ai/api/a2a | agent-card.json |
| A2A Registry | LISTED | a2a-directories.json |
| a2aprotocol.net | NOT_A_DIRECTORY | a2a-directories.json |
| agentcards.org | NOT_A_DIRECTORY | a2a-directories.json |
| Engine cards published | 12 | a2a-engine-cards.json (PR #1883) |
| Extensions | signed-receipts/v1 (DRAFT), x402 | agent-card.json |
| Asset-specific skills | 0 | readiness.json |
| Skill discovery | GENERIC_CATALOG_ONLY_NO_ASSET_SKILL | Per-asset in readiness |

### x402 (Payment Protocol)

| Item | State | Evidence |
|------|-------|----------|
| Discovery URL | https://councilof.ai/.well-known/x402.json | x402-discovery-fact.json |
| Schema | csoai.x402/0.1 | x402-discovery-fact.json |
| Mode | mock (declared, not live) | x402-discovery-fact.json |
| Campaign | 0.01 USDC, existing-data only, through 2026-10-11 | readiness.json |
| Fresh compute excluded | Yes | readiness.json |
| Asset-specific doors | 0 | readiness.json |
| Asset-specific settlements | 0 | readiness.json |
| x402.org discovery | 404 (not a listing) | x402-discovery-fact.json |
| Bazaar compatibility | DECLARED but no Bazaar catalog row | x402-discovery-fact.json |
| Launch attribution | Bounded (PR #1895 merged) | git log |
| Interop files | 7 (engine SKUs, receipts, discovery) | interop/ |

### AG-UI (Agent-User Interface)

| Item | State | Evidence |
|------|-------|----------|
| Endpoint | https://councilof.ai/api/agui/gspc-state | llms.txt |
| Transport | SSE STATE_DELTA + TEXT_MESSAGE_CONTENT | llms.txt |
| Nature | Read-only presentation transport | llms.txt |
| Differentiation | AG-UI ≠ MCP ≠ A2A | llms.txt |

### SWIFT / ISO 20022

| Item | State | Evidence |
|------|-------|----------|
| SWIFT instruments | 26-institution census | swift-*.json, coverage-xrpl-swift.json |
| ISO 20022 families | Present | iso-20022.json |
| Interop files | 41 SWIFT/GSR files | interop/ |

### XRPL

| Item | State | Evidence |
|------|-------|----------|
| Instruments | 16 | xrpl-16.json |
| Interop files | 13 | interop/ |
| Attestation specimens | 9 unsigned | stablecoin-attestation-2026-09/ |
| Two-way check | Present | xrpl-two-way-check.json |

## Canonical Endpoint Manifest

All stablecoins and measured subjects share these generic endpoints:

```
GET  https://councilof.ai/api/gspc                          → Live GSPC board
GET  https://councilof.ai/llms.txt                           → Agent onboarding
GET  https://councilof.ai/.well-known/agent-card.json        → A2A discovery
POST https://councilof.ai/api/a2a                            → A2A JSON-RPC
GET  https://councilof.ai/mcp                                → MCP tools
GET  https://councilof.ai/.well-known/x402.json              → x402 challenge
GET  https://councilof.ai/api/agui/gspc-state                → AG-UI stream
GET  https://councilof.ai/api/request-attestation             → x402 door
GET  https://councilof.ai/interop/x402-trust/latest.json     → Trust snapshot
```

Asset-specific discovery uses the stablecoin identifier to parameterize the shared service. No 425 duplicated servers.

## Directory Submissions Ready

| Directory | Status | Action Needed |
|-----------|--------|---------------|
| MCP Registry | LISTED (330 servers) | None |
| Smithery | LISTED | None |
| Glama | LISTED | None |
| Docker MCP | LISTED | None |
| A2A Registry | LISTED | None |
| PulseMCP | UNKNOWN | Probe via API; submit if not listed |
| MCP.so | NOT_LISTED | Submit listing |
| Cline | NOT_LISTED | Submit listing |

## Blockers

1. **PulseMCP state UNKNOWN** — probe inconclusive; need API-based check
2. **MCP.so and Cline NOT_LISTED** — submissions prepared, awaiting owner approval
3. **x402 mode=mock** — not a live Bazaar catalog row
4. **No asset-specific integrations** — all discovery is generic/parameterized

## Truth Rules

- A generic protocol door is not an asset-specific integration or settlement.
- A2A cards are for MCP tools, not human analysts.
- AG-UI is presentation transport, not A2A extension.
- x402 mock mode ≠ live payment.
