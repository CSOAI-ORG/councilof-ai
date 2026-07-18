# CSOAI / MEOK — Layer-0-Up Master Stack (2026-06-19)

_The canonical, honesty-disciplined reconciliation of the full layered architecture, absorbed from
Layer 0 up. Resolves the three "layer" systems that get conflated across the docs. Real-vs-spec is
marked on every layer. Sources: LAYER0_MASTER_EAT.md, meok-hive-architecture-2026-06-07.md, the
Rainbow Stack (Kimi research_csoai_integration §8.1), SOVEREIGN_AI_OS_NARRATIVE, DATA_MOAT_DOSSIER,
SOVEREIGN_TOWN_POC_2026-06-19.md. Counts per MEMORY ground truth._

## ⚠️ The reconciliation that matters: there are THREE distinct "layer" systems
People conflate these constantly (the docs do too). They are different *kinds* of thing:

1. **Layer 0 — the CSOAI sovereign foundation.** A *market-positioning + protocol* layer: the trust/
   identity/governance substrate BENEATH the agent-economy protocols (MCP/A2A/x402). Numbered L0–L4
   by external-protocol maturity.
2. **The Hive 7-layer stack (L1→L7).** The *operational substrate of one domain pod* — what a hive is
   made of, foundation (L1 drift) → presentation (L7). Every `.ai` hive runs all 7.
3. **The Rainbow Stack (Red→Violet).** A *security cross-cut* — defense-in-depth applied to every agent
   *action*, orthogonal to the hive layers. NOT a parallel architecture; it grips the hive layers at
   specific points and shares Ed25519 + x402 as connective tissue.

> They are numbered in **opposite directions** (Hive L1=bottom; Rainbow's own protocol diagram flips).
> Canonical rule: use **Hive L1–L7 by name**, **Rainbow by color name**, never cross the numbering.

---

## The full vertical stack (top = highest ceiling / longest horizon)

```
GOVTECH CEILING      EU AI Act Art-57 sandbox tooling + policy simulator ("wind-tunnel for regulation")
                     12-36mo procurement; credibility/grant play, NOT near-term cash.            [SPEC]
─────────────────────────────────────────────────────────────────────────────────────────────────────
SOVEREIGN TOWN       The PROOF layer. Governed-vs-ungoverned A/B = investor slide + regulator demo +
                     paper. Also the DATA FLYWHEEL + MEDIA engine. Exercises everything below.   [P0 RUNNING]
─────────────────────────────────────────────────────────────────────────────────────────────────────
PRODUCTS / VERTICALS meok.ai · proofof.ai · councilof.ai · openpatent.ai · 30 hives (fishkeeper,
                     koikeeper, landlaw, haulage, grabhire, muckaway, optimobile, templeman…).   [MIXED]
                     Each = a vertical district w/ real MCP + real data.
─────────────────────────────────────────────────────────────────────────────────────────────────────
HIVE 7-LAYER ENGINE  King(SOV3) → Queens(per-vertical) → Honeycomb(memory). 32 hives live on the VM.
   L7 presentation   Open Design (per-vertical palette) + Vercel + auto video/PDF              [REAL/partial]
   L6 orchestration  Hermes sub-context; Kimi-K2.6 reason / DeepSeek speed / local PII          [REAL]
   L5 domain MCP     FastMCP /mcp:8000 + x402 paywall — THE MOST REAL LAYER (271/316 MCPs)       [REAL]
   L4 agent memory   agentmemory (shared|isolated) + Letta                                       [REAL/partial]
   L3 knowledge graph Cognee subgraph; gossip-sync every 15min (Neo4j Streams)                   [CONFIG, unverified loop]
   L2 versioned hist  Memoria ("git-for-memory"); audited by councilof.ai                        [CONFIG]
   L1 drift detection mex (zero-AI, 8 checkers); CI gate fails build < 90                        [CONFIG]
   (under it: Nemesis SSM backbone — Mamba-3 + MoE + GWT)                                        [BLUEPRINT only]
─────────────────────────────────────────────────────────────────────────────────────────────────────
LAYER 0              CSOAI SOVEREIGN FOUNDATION — 4 planes:
   Identity/Discovery  did:csoai + 30 A2A agent cards + directory          (spec: W3C DID/IETF AIP) [STUB]
   Governance          12-around-1 BFT council + Sovereign Gate + Maternal Covenant care floor    [REAL council pkg / Gate spec]
   Compliance (proof)  verified-compliance + 271 MCPs as a regulation corpus wired as a verifier   [REAL catalogue / verifier spec]
   IP & Provenance     openpatent.ai + SIGIL Ed25519 hash-chain (177 records)                      [REAL rails]
─────────────────────────────────────────────────────────────────────────────────────────────────────
INFRA SUBSTRATE      SOV3 :3101 MCP (~110-115 tools) · local Ollama on GCP VM (meok-backend) ·
                     Postgres/pgvector/Neo4j · Cloudflare tunnels · Vercel · PyPI fleet           [REAL]
```

## Layer 0 — the 8 capabilities, honest status
From `LAYER0_MASTER_EAT.md` + `layer0_tunnels/layer0_sdk.py`. The 8 exist as typed Python classes;
**6 of 8 return hardcoded/mocked values.** Real anchors live OUTSIDE the 8 stubs.

| # | Capability | Status |
|---|---|---|
| A | Identity (`did:csoai`) | STUB (no real DID resolution / Ed25519 verify) |
| B | Certification (Watchdog Cert) | MOCK here; real Ed25519 signing exists in meok-attestation-api |
| C | Policy Engine (PDCA) | MOCK — `evaluate()` always returns ALLOW; "0.08ms" is a literal |
| D | Cross-regional Handoff | MOCK — always SUCCESS; 3 jurisdictions not 6 |
| E | Micropayment Pre-check | **LOGIC REAL** (blocks uncertified/low-trust); settlement mock. Strongest of the 8 |
| F | Blockchain Audit | MOCK — fabricated IPFS/chain hashes, no real PQC |
| G | HITL Escalation | MOCK here; **real BFT council ships as `bft-progress-council-mcp`** (PBFT E2E passed 2026-06-13) |
| H | Legacy Bridge (COBOL→MCP) | MOCK — fake endpoints |

**Real code in `layer0_tunnels/` (not the 8 stubs):** `x402_gateway_wrap/server.py` (production-grade x402
billing), `pbft_router/router.py` (runnable PBFT sim w/ fault injection), `csoai_gateway_mcp` + brand MCPs.

**Moat verdict:** "only entity combining all 8" is **aspirational** — it's a document, not a running system.
Defensible narrow version: real compliance-pre-check-before-payment + real BFT council + 271-MCP regulation
corpus. Pitch Layer 0 as architecture/roadmap, NOT a built production moat.

## The Rainbow Stack (security cross-cut)
| Color | Function | Tech | Status |
|---|---|---|---|
| Red | Attestation | Ed25519 sigils + x402 receipts | PARTLY REAL (proofof.ai signing live) |
| Orange | Identity | W3C DID (`did:wba`) + Agent Cards | SPEC |
| Yellow | Transport | Noise + WireGuard | SPEC |
| Green | Access | Cedar / OPA dual-policy (both must allow) | SPEC (pseudocode) |
| Blue | Payment | x402 + AP2 + multi-chain | PARTLY REAL (x402 in live stack.yml, config-level) |
| Indigo | Memory | Redis + encrypted SQLite + FTS5 | SPEC |
| Violet | Governance | 13-framework governance engine | SPEC |
It grips the hive layers: Red→L5/L2, Orange→L6, Yellow→A2A transport, Green→L5/L6, Blue→L5 x402,
Indigo→L4/L3, Violet→L2 audit. **Most-spec layer in the whole stack** as an integrated engine.

## Where the Sovereign Town sits
**The proof-of-the-whole-stack, not a product on top.** It instantiates the Hive Stack as a `lab_experiment`
hive, re-uses the Rainbow primitives as *defensive* governance (Sovereign Gate + 12-around-1 + care floor +
Ed25519 episodes), exercises the products as its districts, runs on SOV3 as King — and feeds the two layers
above it (data flywheel → trained models; govtech ceiling → Article-57). P0 is **running** (Aqua A/B: 0 vs 45
crimes). It is also the one document that actively *corrects* the ecosystem's inflation.

## HONESTY REGISTER (the recurring inflation to never repeat)
- **MCP count = 271 published / 316 built.** NOT 290+, 324, 345, 369, or 518. Three Layer-0 docs cite four
  different wrong numbers; "200K downloads" has no source. "1,000 MCPs" is a funding-ask target, not inventory.
- **Council = 12-around-1 LIVE.** "33-node Byzantine" (and "220-node", "24/33", "22/33") are SPEC. The real
  council E2E was 23/25 (`bft-progress-council-mcp`). 5+ different council numbers across docs — only 12-around-1 is live.
- **Cast = 27 named personas.** "152 agents" are infra workers, not citizens; "47 Generals" is roadmap.
- **Layer 0's 8 capabilities are 6/8 mocked.** "Production ready" / "sub-millisecond across 30 frameworks/6
  jurisdictions" is the highest-risk overstatement to a technical buyer.
- **The two "Rainbow Simulation" docs are name-collisions AND self-certified inflation** — all-green, round
  numbers (100k users, "100% integrity"), no artifacts/logs. Not executed test runs. Only durable fact: the
  33-node BFT *spec* (which the Town then demotes to 12-around-1 live).
- **Revenue is dark** (Stripe-gated £0; 18 hive sites source-ready not deployed) — though a parallel session
  flipped the CSOAI Stripe loop live 2026-06-19 (verify before quoting).
- **Nemesis SSM backbone** (Mamba-3/MoE/GWT) is a research blueprint, not built. "Linux of AI by Year 10" = narrative.
- **"$920K free compute by July 4" is physically impossible** (7-10d approval lag + ToS caps). July-4 target =
  the fundable ASSET (A/B chart + dataset v1 + one safer model + showcase), NOT a Series A close.
- **Consciousness metrics** (78%, Φ/IIT) = evocative framing on real-but-modest NNs (~8M params). Don't externalize as literal consciousness.
- **Govtech independence conflict (self-flagged):** can't certify compliance AND sell the sandbox that defines it. Structural separation or the moat dies.

## What's genuinely REAL (the defensible core)
SOV3 MCP live (:3101) · local-model fallback proven under fire · `flywheel_ingest.py` working ·
attestation rails (provision→sign→verify) + SIGIL chain (177 records) · 5 IP disclosures filed ·
271 MCPs · 27-character DB · meok-amica VRM+voice · 52-Article Charter + Maternal Covenant code ·
`bft-progress-council-mcp` (PBFT proven) · x402 middleware · 32 hives live on the VM · Sovereign Town P0 running.
The moat is **IP + data-flywheel optionality + Article-50/57 timing** (per DATA_MOAT_DOSSIER 4-factor ~7.5/10),
NOT current revenue. Build the proof, state the counts straight, and the Layer-0 thesis holds.
