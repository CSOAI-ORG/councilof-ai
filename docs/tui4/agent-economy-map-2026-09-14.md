# Agent Economy Map — MCP → A2A → x402 → Receipt → Verify

**Date:** 2026-09-14
**TUI:** 4 (Agent-Economy Interoperability)
**Status:** One human-readable map joining five live endpoints

The agent economy is a graph of five surfaces, each pointing at a real URL,
each backed by the same canonical evidence. An outside agent can walk
discovery → challenge → free preview → A2A delegation → paid settlement
→ signed receipt → verification, every step provable.

---

## The Graph

```
   [Agent / Buyer]
        |
        | (1) discovery
        v
   /.well-known/x402.json  ──── GET ────> MCP Registry / Bazaar
        |                                       |
        | (2) challenge 402                       | (3) tools
        v                                       v
   /api/x402  ──── GET ────> /mcp  ──── initialize/tools/list/call
        |                       |               |
        |                       | (4) delegation v
        |                       |        /api/a2a (7 skills)
        |                       |               |
        |                       |               | (5) settlement
        |                       |               v
        |                       |        [PayAI facilitator]
        |                       |               |
        |                       |               | (6) receipt
        |                       |               v
        |                       |        X-PAYMENT-RESPONSE
        |                       |               |
        |                       |               | (7) verify
        |                       |               v
        |                       |        /api/receipts/verify
        |                       |               |
        +-----------------------+---------------+
                                |
                                v
                          [Verifiable proof]
```

---

## Step-by-Step Proofs

### Step 1 — Discovery: GET `/.well-known/x402.json`

- **URL:** https://councilof.ai/.well-known/x402.json
- **Method:** GET
- **Result:** HTTP 200, 15,053 bytes
- **Scheme:** exact
- **Network:** eip155:8453 (Base mainnet)
- **Asset:** USDC (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`)
- **PayTo:** `0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31` (merchant — not payer)
- **PROOF:** `curl -s 'https://councilof.ai/.well-known/x402.json' | jq '.scheme, .network, .asset'`

### Step 2 — Challenge: POST → 402

- **URL:** Any x402 resource (e.g., /api/x402, /api/free-door, /api/request-attestation)
- **Method:** GET
- **Result:** HTTP 402 with `accepts[]` array, JWS-signed offer
- **Resource catalog:** /api/x402 returns 11 resources (1 free + 10 paid)
- **PROOF:** `curl -s 'https://councilof.ai/api/x402' | jq '.resources | length'`

### Step 3 — MCP tools: POST initialize + tools/list

- **URL:** https://councilof.ai/mcp
- **Method:** POST (JSON-RPC 2.0)
- **Required headers:** `Content-Type: application/json`, `Accept: application/json, text/event-stream`
- **Server info:** name `csoai-gspc-mcp`, version `1.4.2`
- **Tools:** 12 (8 free readers + 4 x402-metered evidence tools)
- **PROOF:** `curl -s -X POST 'https://councilof.ai/mcp' -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'`

### Step 4 — A2A delegation: POST /api/a2a

- **URL:** https://councilof.ai/api/a2a
- **Method:** POST (JSON-RPC 2.0)
- **Protocol version:** A2A v1.0
- **Skills:** 7 (`gspc-board`, `east-west-crosswalk`, `measured-badge`, `benchmark-quality-register`, `article50-detect`, `eu-ai-act-screen`, `x402-discovery`)
- **PROOF:** `curl -s -X POST 'https://councilof.ai/api/a2a' -H 'Content-Type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"SendMessage","params":{"message":{"messageId":"m-1","role":"ROLE_USER","parts":[{"data":{"skill":"gspc-board","input":{}},"mediaType":"application/json"}]}}}'`

### Step 5 — Settlement: x402 + PayAI facilitator

- **URL:** Paid endpoint + `X-PAYMENT` header with EIP-3009 transferWithAuthorization
- **Examples of priced resources:**
  - `request_attestation`: 10,000 atomic ($0.01 promo) / 20,000 ($0.02 standard)
  - `evidence_bundle`: 10,000 atomic ($0.01)
  - `rwa_evidence`: 10,000 atomic ($0.01)
  - `art50_marking_evidence`: 10,000 atomic ($0.01)
  - `receipts_batch`: 100,000 atomic ($0.10)
- **Asset:** USDC on Base
- **PayTo:** `0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31` (merchant — not payer)
- **proof method:** Self-test wallet 0x6ea00613c (SELF_TEST classification; not revenue)

### Step 6 — Receipt: X-PAYMENT-RESPONSE

- **Header:** `X-PAYMENT-RESPONSE`
- **Format:** JWS compact serialization
- **Alg:** EdDSA (Ed25519)
- **Kid:** `did:web:csoai.org#board-attestation-1`
- **Payload:** `{issuedAt, network, payer, resourceUrl, transaction, version}`
- **Example:** TX `0x60172f43ca14e5874eba92b990ce623e6503cee6d060fd89fd828993fababe7f` (INTERNAL_SELF_FUNDED, 0.01 USDC, block 51,172,054)

### Step 7 — Verify: POST /api/receipts/verify

- **URL:** https://councilof.ai/api/receipts/verify
- **Method:** POST with `{"receipt": "<jws>"}`
- **Verdict:** VALID / INVALID / UNCHECKABLE
- **Verification:** Ed25519 signature under #board-attestation-1 pubkey from `did:web:csoai.org/.well-known/did.json`
- **Offline:** `scripts/verify_receipt.py` reads did.json + verifies without our servers

---

## Trust Census (live)

| Surface | Count | As of |
|---------|-------|-------|
| x402 catalog hosts | 100 | 2026-09-14T05:15Z |
| - challenge_402 | 82 | (402 returned, not delivered) |
| - serves_200 | 1 | (delivered) |
| - alive_needs_input | 8 | (reachable, needs user input) |
| - template_no_reply | 7 | (reachable, template returned but no response) |
| - dead_404_or_unreachable | 2 | (no answer) |
| MCP servers (probed) | 2 | 2026-09-14T09:45Z |
| MCP tools (probed) | 8 | (from servers that answered initialize) |
| MCP registry entries (CSOAI-ORG) | 354 | 2026-09-14T01:51Z |
| A2A skills | 7 | (verified via /api/a2a) |
| ERC-8004 identity registrations | 803,294 | (indexer count) |

---

## Directory Status + Attribution

| Directory | Status | Notes |
|-----------|--------|-------|
| Official MCP Registry | LISTED v1.4.2 | isLatest=True |
| Smithery | LISTED + STALE | csoai/gspc has 4 phantom tools — owner fix |
| Glama | LISTED + UNSTABLE | 40/40 Unhealthy connectors — owner fix |
| x402 Bazaar (PayAI) | LISTED | 6 listings, 1 current, 5 stale |
| x402 Bazaar (Coinbase CDP) | ABSENT | 0 of 14,567 resources |
| mcp.so | NOT_LISTED | 404 on direct URL — owner submit needed |
| PulseMCP | UNKNOWN | platform-wide ingestion pause |

UTM attribution: every external link carries `?utm_source=<directory>`.

---

## x402 Receipt Verification Test (INTERNAL_SELF_FUNDED)

**Self-test settlement executed 2026-09-11T13:30:55Z:**
- **TX:** `0x60172f43ca14e5874eba92b990ce623e6503cee6d060fd89fd828993fababe7f`
- **Block:** 51,172,054
- **Amount:** 0.01 USDC (promo)
- **Method:** TransferWithAuthorization via Multicall3
- **Classification:** INTERNAL_SELF_FUNDED — not revenue
- **Verifier outcome (2026-09-14):** Signature mismatch — current key drift
  - Receipt JWS exists and is structurally valid
  - Ed25519 signature does not verify under current `#board-attestation-1` key
  - Root cause: key rotation in Cloudflare env var (`BOARD_SIGN_KEY_PKCS8_B64`)
  - Fix: re-issue receipt with current key, or investigate key rotation history

### CORRECTION (2026-10-07T04:10Z, TUI-4 re-verification — does not reproduce)

The signature-mismatch finding above was re-tested from scratch on 2026-10-07 and did
not reproduce:

- **Offline Ed25519 check**, same JWS (`x402-self-settlement-2026-09-11.json`) against
  **every** key in the current `did:web:csoai.org` document (7 keys): **VALID** under
  `#board-attestation-1` — the exact `kid` in the JWS header — and invalid under all six
  others (negative controls, as they must be).
- **Server verdict**: `POST /api/receipts/verify` with the same receipt →
  `verdict: VALID`, `"receipt verifies under the resolved key"` (as_of
  `2026-10-07T04:10:09.915Z`).

The 2026-09-14 mismatch observation stands as a recorded observation of that day; it does
not reproduce today, and the cause of the earlier disagreement (key rotation vs. a faulty
check) was not established either way. Nothing here claims Bitcoin, anchoring, or
certification — this is a signature check against published bytes and DID material only.

---

## Honest Findings (TUI 4)

| Finding | Severity | Resolution |
|---------|----------|-----------|
| MCP server requires `Accept: text/event-stream` | Low (documented) | SDK clients must include both Accept types |
| Coinbase CDP x402 registry has 0/14,567 entries | Medium | A real paid settlement may help; not measured here |
| Smithery csoai/gspc lists 4 phantom tools | High (live) | Owner to retire duplicate |
| Receipt signature mismatch (key rotation) | Medium (closed 2026-10-07) | Does not reproduce — offline + server both VALID 2026-10-07, see CORRECTION above |
| mcp.so NOT_LISTED | Medium (closed 2026-10-07) | Wrong slug at the time — today `mcp.so/servers/csoai-gspc-measurement` serves 200 "CSOAI GSPC measurement" |

---

## Files Created This Run

- docs/tui4/agent-economy-map-2026-09-14.md — this file
- TUI 4 work: MCP trust census live, agent economy map proven

## PRs / Branches

- Branch: tui4/protocol-trust-board-20260914
- MCP trust census run: 34833869222 (success)
- Status: MAP COMPLETE — every step provable to a real URL
