# X402 Foundation application — CSOAI (councilof.ai)

**Application:** x402 Foundation membership (see AGENT-research §standards)
**Applicant:** CSOAI LTD (UK 16939677) — councilof.ai ("Council of AI")
**Date:** 2026-09-06 (draft for the owner's decision — the governor's ask 52)
**What we ask:** a seat, nothing more. No grants, no payments, no reserved resources.

## 1. Who we are (bytes, not claims)
- A neutral measurement house for the agent economy. We publish **signed, rooted, witnessed
  measurement cards** (Ed25519, Merkle-rooted, OTS/Rekor-witnessed, DID-backed) over AI models
  and agent services on 22 axes (governance, safety, sustainability, compliance, and 18 more).
- Payment rail: **x402** end-to-end (USDC on Base; payTo 0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31).
  Nine public doors behind 402 challenges. Discovery metadata shipped as
  `/.well-known/x402.json`, OpenAPI, and `interop/x402.json`.
- 335+ signed cards under a live Merkle root; 22 public measurement MCP tools; 330 registry
  listings; the only **buyer-side measurement of the x402 market itself**.

## 2. What we bring (the thing nobody else measured)
We ran the first independent **buyer's-eye census of the x402 service economy** (Sep 2026,
deterministic script, results published):

| Metric | Value |
|---|---|
| Hosts challenged | 316 |
| Delivered (service truly returned) | 100 (31.6%) |
| Refused (challenge/cue) | 213 |
| Took the money, delivered nothing | **13** (4.1%) |
| Total paid to others (mainnet USDC) | 1.34 USDC |
| Ours: zero-value probes vs. paid | 4 vs. 0 self-value at time of writing |

The finding is the market's thinness: **two in three conformant hosts refuse a correctly
signed payment, and 4.1% take the money and deliver nothing.** Nobody else has measured this;
a growing payment protocol should know it. We keep the refusals and the take-and-refuse rows
public (the exact host list would name non-conformant parties — we publish the counts and the
derived properties instead, and publish the methodology).

## 3. What we ask (and the firewall)
- **Seat:** input on the standards process (measurement/verification, denial-receipt semantics,
  the settlement-pending state, discovery §8) from a neutral, non-commercial observer.
- **No grants, no contracted work, no paid roles.** We are member-neutral: we never take money
  for a certification power and never pre-brief a vendor on a measurement.
- **MCP protocol observation** (2026-07-28) — same: seats no, observation yes.

## 4. Verification (a stranger can check us in 60 s)
- HTTPS + card root: https://councilof.ai/signed/root.json (verify against the DID key
  `did:web:csoai.org#board-attestation-1`).
- The census script + data: `scripts/grants/x402-settlement-census.py` + the dataset on HF
  (`csoai/x402-settlement-census`).
- The disclosure: our first settlement was a **self-settlement** (0.02 USDC) and we label every
  self/zero-value probe as such — never as market evidence, never as revenue.

**One line for the council:** we are not another stall selling tokens — we are the neutral
measurement rod for the market x402 is trying to make. Give us a seat and listen, not fund us.

— JEEVES (draft; the owner decides the submit)

## 5. Reference-implementation check (06 Sep 2026)
- `x402` Python SDK (v2.22.0) installs and imports on macOS (uv; foundation's mono-repo
  python/typescript/go/java). Its surface: `get_supported` / `settle` / `verify` (payment
  verification + settlement — the wire-format v2 checks).
- **Live compatibility proof:** Circle's CLI (`@circle-fin/cli` 1.0.0, the Gateway x402
  client) `services inspect` against `https://councilof.ai/api/receipts/batch` returned
  `payable · 0.1 USDC · Base · seller 0x212686…ae31` — the estate's challenge parses under the
  family's reference client.
- Note: bare `urllib` to the same door = 403 (Cloudflare bot-guard on the raw-IP/UA path) —
  documented, not an outage (agent clients with proper discovery pass; the CLI did).
