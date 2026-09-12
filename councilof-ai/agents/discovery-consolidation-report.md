# TUI 4 — Agent Economy and Protocol Discovery — Consolidation Report
## 11 September 2026

### Objective
Audit and consolidate MCP, A2A, x402, AP2, AG-UI and SDK/API surfaces. Resolve duplicate registry entries. Build one canonical tool and endpoint manifest. Prepare truthful directory updates.

---

### ✅ VERIFIED — Live Agent-Facing Surfaces

| Protocol | Endpoint | Status | Auth | Tools/Resources |
|----------|----------|--------|------|-----------------|
| **MCP** | `https://councilof.ai/mcp` | LIVE | None | 12 tools (8 free, 4 paid) |
| **MCP (stdio)** | `npx -y csoai-gspc-mcp@0.2.1` | LIVE | None | 12 tools |
| **MCP (fallback)** | `https://csoai.org/mcp` | LIVE | None | 12 tools |
| **A2A** | `https://councilof.ai/api/a2a` | LIVE | None | 4 skills, 11 methods |
| **x402** | `https://councilof.ai/.well-known/x402.json` | LIVE | x402 | 9 resources (1 free, 8 paid) |
| **AG-UI** | `https://councilof.ai/api/agui/gspc-state` | LIVE | None | 1 SSE stream |
| **GSPC API** | `https://councilof.ai/api/gspc` | LIVE | None | 22 axes |
| **llms.txt** | `https://councilof.ai/llms.txt` | LIVE | None | Documentation |
| **Agent Card** | `https://councilof.ai/.well-known/agent-card.json` | LIVE | None | v1.1.0 |
| **DID Document** | `https://csoai.org/.well-known/did.json` | LIVE | None | 3 Ed25519 keys |
| **Server Card** | `https://councilof.ai/.well-known/mcp/server-card.json` | LIVE | None | v1.4.0 |
| **Free Door** | `https://councilof.ai/api/free-door` | LIVE | x402 (amount=0) | Board + root |
| **Verify** | `https://councilof.ai/gspc-verify` | LIVE | None | Card verification |
| **Receipts Verify** | `https://councilof.ai/api/receipts/verify` | LIVE | None | Receipt verification |

### ✅ VERIFIED — Directory Listings (7 confirmed, 1 not listed, 2 stale)

| Directory | Status | Listing URL | Stale? | Cost |
|-----------|--------|-------------|--------|------|
| **MCP Registry** | REGISTERED | `registry.modelcontextprotocol.io` (id: `io.github.CSOAI-ORG/gspc`) | No | $0 |
| **npm** | PUBLISHED | `npmjs.com/package/csoai-gspc-mcp` (v0.2.1) | No | $0 |
| **PayAPI Market** | LISTED | `payapi.market/api/council-of-ai-gspc-eu-evidence-feed` | No | $0 |
| **x402 Bazaar** | INDEXED | `bazaar.x402.org` (9 doors) | No | $0 |
| **Glama.ai** | LISTED | `glama.ai/mcp/servers/CSOAI-ORG/councilof-ai` | ⚠️ Yes | $0 |
| **MCP.so** | LISTED | `mcp.so/server/csoai-gspc-mcp` | No | $0 |
| **awesome-mcp-servers** | LISTED | GitHub README | ⚠️ Yes | $0 |
| **PulseMCP** | NOT LISTED | — | — | $0 |

#### Stale details:
- **Glama.ai:** Says "council of 12 AIs" — actual fleet is 19 models. Auto-indexed from GitHub repo description.
- **awesome-mcp-servers:** Says "Seven read-only tools" and `csoai-gspc-mcp@0.1.1`. Actual: 12 tools (8 free, 4 paid), version 0.2.1. Also lists `CSOAI-ORG/eu-ai-act-compliance-mcp` separately (PyPI v1.8.15, different product).

### ✅ VERIFIED — Duplicate Resolution

- **MCP endpoints:** 1 primary (`councilof.ai/mcp`) + 1 fallback (`csoai.org/mcp`) + 1 stdio (`npm`). 1 dead worker documented (404). No live duplicates.
- **Registry entries:** 1 entry (`io.github.CSOAI-ORG/gspc` v1.4.0). No duplicates.
- **Secondary packages:** `eu-ai-act-compliance-mcp` (PyPI v1.8.15) is a separate product (417 EU AI Act provisions), not a duplicate of `csoai-gspc-mcp`.
- **x402 resources:** 9 unique resources. No duplicates.
- **Agent cards:** 1 card. No duplicates.

### ✅ VERIFIED — Probe Results

**MCP probe:** 12 tools (8 free, 4 paid), 1 quarantined (`witness_hash`), 1 dropped (`measure`).

**A2A probe:** Method names are case-sensitive (`SendMessage` works, `sendMessage` fails). Requires `messageId` (string) and `parts` (array).

**x402 probe:** Free door returns 402 challenge with `amount: "0"`. Offer-receipt extension supported (JWS, EdDSA). EIP-712 NOT offered.

**x402 0.01 USDC test (request_attestation for llama3.2:3b):**
- Endpoint: `GET https://councilof.ai/api/request-attestation?subject=llama3.2:3b`
- Response: HTTP 402 Payment Required
- Amount: 10,000 atomic units (0.01 USDC)
- Network: Base (eip155:8453)
- Asset: USDC `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Pay-to: `0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31`
- Offer receipt: JWS/EdDSA signed by `did:web:csoai.org#board-attestation-1`
- Facilitator: configured
- Campaign: `csoai-launch-30d-20260911`
- Offer period: 2026-09-11 to 2026-10-11
- Classification: Would be `INTERNAL_SELF_FUNDED` (self-payment proves plumbing, revenue remains zero)
- Payment NOT executed (no wallet with USDC on Base available in this session)
- Challenge receipt preserved: full 402 response captured with offer-receipt JWS

**AG-UI probe:** Returns live 22-axis board snapshot via SSE.

**DID probe:** 3 Ed25519 keys: `site-release-1`, `estate-chain-1`, `board-attestation-1`.

### ✅ VERIFIED — Parameterization Model

For 425 stablecoins: the subject identifier parameterizes existing services. No 425 duplicated servers needed.

### ✅ VERIFIED — AP2/Visa TAP Status

- AP2 donated to FIDO Alliance. Visa TAP targeting holiday 2026. Neither shipped yet. No integration possible today.

### ❌ NOT CLAIMED

- No 425 deep measurements
- No "first customer" or revenue from internal testing
- No prediction claims
- No PulseMCP listing

### 🔧 REMAINING BLOCKERS

1. **awesome-mcp-servers PR:** Update listing from "7 read-only tools" to "12 tools (8 free, 4 paid)" and version to `@0.2.1`. Owner action.
2. **Glama description:** Update GitHub repo description to reflect 19-model fleet. Owner action.
3. **PulseMCP submission:** Not listed. Prepare submission. Owner action.
4. **MCP Registry direct lookup:** API returns 404 for direct server path. Search works. May be API version issue.

### 📊 METRICS

| Metric | Count |
|--------|-------|
| Live endpoints verified | 14 |
| MCP tools | 12 (8 free, 4 paid) |
| A2A skills | 4 |
| x402 resources | 9 (1 free, 8 paid) |
| Directory listings confirmed | 7 |
| Directory listings stale | 2 |
| Directory listings not listed | 1 |
| Duplicates found | 0 |
| Corrections applied | 4 |
| Total cost | $0 |

### 📁 FILES

| File | Purpose |
|------|---------|
| `agents/canonical-manifest.json` | Single source of truth |
| `agents/directory-audit.json` | Directory status audit |
| `agents/discovery-consolidation-report.md` | This report |
| `agents/verify-discovery.py` | 14-endpoint verification (14/14 passed) |
