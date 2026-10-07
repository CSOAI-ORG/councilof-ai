# TUI-4 Agent Economy & Protocol Discovery — 7 Oct 2026

Audited live from councilof.ai on 2026-10-07. Every number below was read from a
tool call or HTTP probe in this session. Measurement, not certification.

---

## 1. MCP surface

| Field | Value | Source |
|-------|-------|--------|
| Primary endpoint | `https://councilof.ai/mcp` (streamable-http) | `initialize` probe, 200 |
| Fallback endpoint | `https://csoai.org/mcp` (streamable-http, alias_of primary) | MCP census |
| Free endpoint | `https://councilof.ai/mcp/free` (14 tools, no paid) | `tools/list` probe |
| Server name | `csoai-gspc-mcp` | initialize response |
| Server version | `1.4.4` | initialize response |
| Protocol version | `2025-03-26` | initialize response |
| npm package | `csoai-gspc-mcp@0.2.2` | server.json / package.json |
| Registry name | `io.github.CSOAI-ORG/gspc` | server.json |
| Reachable distinct servers | 2 (primary + fallback) | `/api/mcp` census |
| Reachable endpoints | 4 (primary HTTP, fallback HTTP, stdio, /mcp/free) | `/api/mcp` census |
| Tools probed (total) | 38 (19 primary + 19 fallback, same definitions) | `tools/list` × 2 |
| Tools on primary | 19 (14 free + 5 paid) | `tools/list` |
| Catalogued not probed | 6 (csoai-assess, csoai-anchors, csoai-ledger, csoai-watchdog, csoai-spectrum, csoai-drift) | `/api/mcp` census |
| External catalogues | gspc-os-vendored (363 server dirs, private, pod-only) | `/api/mcp` census |

### Free tools (14)

`board_totals`, `get_axis`, `verify_card`, `list_cards`, `get_root`, `get_card`,
`verify_inclusion`, `x402_trust`, `mcp_trust`, `measurement_index`,
`verify_capsule`, `server_evidence`, `evidence_bundle_preview`, `route`

### Paid tools (5, all x402)

`commission_card`, `art50_marking_evidence`, `rwa_evidence`, `receipts_batch`,
`evidence_bundle`

### Catalogued-not-probed servers (6)

All from `functions/api/mcp.ts` hardcoded array (pre-2026-08-26).
No published endpoint. Tools count is null, never the catalogue assertion.

| Server | Asserted tools | Status |
|--------|---------------|--------|
| csoai-assess | 6 | UNVERIFIED_HISTORICAL |
| csoai-anchors | 3 | UNVERIFIED_HISTORICAL |
| csoai-ledger | 4 | UNVERIFIED_HISTORICAL |
| csoai-watchdog | 5 | UNVERIFIED_HISTORICAL |
| csoai-spectrum | 8 | UNVERIFIED_HISTORICAL |
| csoai-drift | 4 | UNVERIFIED_HISTORICAL |

---

## 2. A2A surface

| Field | Value | Source |
|-------|-------|--------|
| Endpoint | `https://councilof.ai/api/a2a` | agent-card.json |
| Protocol | JSONRPC `1.0` | agent-card.json + live probe |
| Agent Card | `.well-known/agent-card.json` 200 OK | curl probe |
| Card version | `1.4.0` | live agent-card.json |
| Agents discovery | `.well-known/agents.json` 200 OK, schema `csoai.agents-discovery/0.1` | curl probe |
| Skills | 12 | agent-card.json |
| Streaming | false | agent-card.json |
| Push notifications | false | agent-card.json |
| Extended agent card | false | agent-card.json |

### Skills (12)

`gspc-board`, `east-west-crosswalk`, `card-status-link`,
`benchmark-quality-register`, `article50-detect`, `eu-ai-act-screen`,
`x402-discovery`, `estate-index`, `measurement-capsules`,
`server-evidence`, `evidence-bundle`, `gspc-route`

### Extensions declared (3)

1. **Signed receipts** (`councilof.ai/a2a/extensions/signed-receipts/v1/`) — DRAFT,
   not yet emitted. Ed25519-signed task-outcome receipts + did:web key-trust.
2. **x402 discovery** (`councilof.ai/.well-known/x402.json`) — pay rail index.
3. **x402 Offer & Receipt** (x402-foundation spec commit `69652a6`) — conditionally
   emitted. JWS format, EdDSA, kid `did:web:csoai.org#board-attestation-1`.

### Identity

| Field | Value |
|-------|-------|
| DID | `did:web:csoai.org` |
| Attestation key | `did:web:csoai.org#board-attestation-1` |
| DID document | `https://csoai.org/.well-known/did.json` |

---

## 3. x402 surface

| Field | Value | Source |
|-------|-------|--------|
| Discovery index | `.well-known/x402.json` 200 OK | curl probe |
| Schema | `csoai.x402/0.2` | live response |
| x402Version | 2 | live response |
| Scheme | `exact` | live response |
| Network | `eip155:8453` (Base) | live response |
| Asset | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (USDC) | live response |
| payTo | `0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31` | live response |
| Mode | `live` | live response |
| Total resources | 31 | live response |
| Free resources (paid_for=null) | 4 | live response |
| Paid resources (paid_for=issuance) | 10 | live response |
| Paid resources (paid_for=assembly) | 17 | live response |
| Extensions | `offer-receipt` (conditional, JWS/EdDSA) | live response |
| Board signing key | configured | live response |
| Facilitator | configured | live response |

### Free resources (4)

1. `GET /api/free-door` — board totals + signed public root
2. `GET /api/discover/chainlink`
3. `GET /api/discover/ondo`
4. `GET /api/discover/ondo-ousg`

### Paid resources — issuance (10)

`/api/request-attestation`, `/api/rwa/evidence`, `/api/wrapper`,
`/api/wrapper/asset/usdc`, `/api/wrapper/asset/usdt`, `/api/wrapper/asset/dai`,
`/api/measurement/fresh-capsule`, `/api/ras/mcp-probe`, `/api/ras/x402-check`,
`/api/ras/supply`

### Paid resources — assembly (17)

`/api/evidence-bundle`, `/api/signed-data-feed`, `/api/proof`,
`/api/wrapper/changes`, `/api/art50/marking-evidence`, `/api/feeds/provider-diff`,
`/api/receipts/batch`, `/api/pop/stablecoins`, `/api/pop/swift`,
`/api/pop/xrpl`, `/api/pop/x402-bazaar`, `/api/pop/mcp-registry`,
`/api/pop/a2a`, `/api/pop/ots-proofs`, `/api/pop/layer0`,
`/api/pop/corrections`, `/api/pop/claim-watch`

### Offer & Receipt extension

| Field | Value |
|-------|-------|
| Supported | true |
| Emission | conditional |
| Format | JWS |
| Algorithm | EdDSA |
| Kid | `did:web:csoai.org#board-attestation-1` |
| DID document | `https://csoai.org/.well-known/did.json` |
| eip712 | NOT offered (no secp256k1 signer) |
| Hosted verify | `https://councilof.ai/api/receipts/verify` |
| Offline verify | `https://councilof.ai/verifier/verify_receipt.py` |

---

## 4. Revenue state

| Metric | Value |
|--------|-------|
| External revenue | $0.03 USDC from 2 external payers |
| Self-settlements excluded | 22 |
| Zero-value settlements excluded | 8 |
| SKU-1 issuances | 13 |
| SKU-2 proofs | 1 |
| Revenue rail | x402 on Base mainnet |

**Rule:** Never count internal purchases as revenue. x402 resources are PAID, not free.

---

## 5. .well-known inventory

| File | Status |
|------|--------|
| `agent-card.json` | 200, v1.4.0, 12 skills |
| `agents.json` | 200, schema csoai.agents-discovery/0.1 |
| `x402.json` | 200, schema csoai.x402/0.2, 31 resources |
| `did.json` | referenced at csoai.org |
| `anchor-posture.json` | exists in public/.well-known |
| `index.json` | exists (every published door) |
| `charter.json` | exists |
| `compliance.json` | exists |
| `security.txt` | exists |

---

## 6. GSPC board state

The live `GET /api/gspc` returned `lid=null`, `public_count=null`, `axes=0` at
probe time. This may indicate the board is between runs or the response format
changed. The MCP census last ran 2026-09-30 and reported 38 tools across 2
reachable servers — consistent with the 19-tool primary we confirmed live.

---

## 7. Changes since last discovery (Sep 12 branch tip)

| Surface | Sep state | Oct 7 state | Delta |
|---------|-----------|-------------|-------|
| Agent Card version | 1.1.0 (on-disk) | 1.4.0 (live) | +0.3.0 |
| x402 resources | 29 (task context) | 31 | +2 |
| x402 schema | csoai.x402/0.1 | csoai.x402/0.2 | bumped |
| MCP server version | 1.4.2 (server.json) | 1.4.4 (live) | +0.0.2 |
| A2A skills | 12 | 12 | unchanged |
| MCP tools | 19 | 19 | unchanged |

---

*Generated by TUI-4 discovery subagent. Every number above is from a live probe
or file read, not from memory or prior reports.*