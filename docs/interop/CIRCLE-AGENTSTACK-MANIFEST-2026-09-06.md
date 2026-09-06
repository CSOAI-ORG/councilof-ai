# Circle Agent Stack — CSOAI councilof.ai service manifest (draft)

**Purpose:** the descriptor a provider gives Circle Agent Stack so `agents.circle.com/services`
can list the estate's 9 x402 doors and agent clients can `circle services inspect` them.
Verified today: the CLI already inspects our door (`payable · 0.1 USDC · Base · seller
0x212686…ae31`) — this manifest documents that the doors ARE discovering; the only missing
piece is the Gateway registry listing (owner signup at app.circle.com).

## 1. Service identity
- **Name:** Council of AI Evidence (councilof.ai)
- **Category (Circle-style):** `FINANCIAL_ANALYSIS` / `AI_RESEARCH` (measurement + audit data)
- **URL:** https://councilof.ai
- **Protocol:** x402 (USDC on Base) at the 402 — no prices in any static surface; amounts
  live only inside the 402 challenge (the Circle CLI reads them as `Price: $0.1 USDC`).
- **Seller:** 0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31 (collector, x402 public contract).

## 2. Doors (all x402-verified)
| Door | Endpoint | What an agent gets |
|---|---|---|
| Evidence bundle | `/api/evidence-bundle?obligation=…` | signed per-obligation evidence (EU AI Act / DORA / CRA / Art 50) |
| Attestation | `/api/request-attestation` | award-signed measurement card |
| Signed feed | `/api/eunomia-data?feed=1` | derived measurement feed |
| XRPL evidence | `/api/rwa/evidence?asset=…` | signed asset evidence (preview free, proof paid) |
| Provider diff | `/api/feeds/provider-diff?history=1` | re-measurement delta (MCP #12) |
| Receipts batch | `/api/receipts/batch?from=&to=` | signed measurement history |
| Art 50 marking | `/api/art50/marking-evidence` | EU AI Act Art.50 marking evidence |
| SWIFT/bank pack | (M-OS09 door-or-drop) | bank-grade compliance – decision open |
| Proof | `/api/proof` | inclusion/verification proofs |

## 3. Discovery metadata (already live)
- `/.well-known/x402.json` — the 402 discovery (the CLI reads it)
- `/api/openapi.json` (producer #1625) — the machine-readable surface
- `/interop/x402.json` — estate-level x402 index
- Verified: `CIRCLE_ACCEPT_TERMS=1 circle services inspect …/api/receipts/batch?from=…&to=…`
  → `Status: payable · $0.1 USDC · Base · seller 0x212686…ae31`

## 4. The one owner step (Gateway registry listing)
1. Sign in at `https://app.circle.com` (owner account; no org-policy approval)
2. Register the service URL `https://councilof.ai` (Agent Stack → "Add a service")
3. Add the doors from §2 (each is the x402 URL)
Nothing else is missing on our side: the 402 shape, discovery metadata and the seller contract
are byte-verified.

— JEEVES, 06 Sep 2026. Row T06-CIRCLE-EXACT updated; manifest = the agent-side artifact.
