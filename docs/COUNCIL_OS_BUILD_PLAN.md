# Council OS End-to-End Build Plan (Claude-aligned)

> Compass stack research cleaned against doctrine: measurement not certification;
> **DSH = same evidence as OS (everywhere)**; attestation ≠ tokenization ≠ ownership;
> scores never sold; no CopilotKit greenfield rewrite; no invented revenue.
> CSOAI Ltd · UK **16939677**.
>
> Raw research: uploaded `council-os-build-plan` · prior compass `wf-67a7e7b4` · `wf-b01660de`.
> Product spine: `docs/COUNCIL_OS_PRODUCT.md` · EAT/DSH: `docs/EAT_DSH_ALIGNMENT.md`.

## TL;DR — A++++ verdict

| Claim | Claude ruling |
|-------|----------------|
| No unsolved *code* blockers for Memo / EAS / MCP / cards | **Accept** — xrpl.js, eas-sdk / eas-batch-attest, Nodit/Blockscout MCP exist |
| Custom work = wrap GSPC engine as MCP tool | **Accept** — already the shape of `functions/api/mcp*` |
| Split private engine / open adapters / publishers | **Accept** — DeFiLlama pattern; start as folders in *this* repo |
| Rebuild frontend on CopilotKit + LangGraph + Next.js | **Reject** — Lobby already speaks AG-UI; controlled cards only |
| Channels SDK / Slack-Teams later | **Defer** — optional Stage 3+ on *any* AG-UI agent; not a rewrite pretext |
| Five-stage flywheel (free → pilots → Option A license → corpus API → tokenize partner) | **Accept** — matches Option A first; Option B partner-only; never issuer |
| DSH is a second product | **Reject** — DSH is the signed-in *view* of the same Layer 0 |

**Grade target:** every OS card that ships is openable from DSH without a parallel scoreboard. That is “all DSH into all.”

---

## Non-negotiables (Claude)

1. **Measurement, not certification.** No conformity marks. UNMEASURED is honest.  
2. **DSH = OS evidence (OWNERSHIP #80).** `/dashboard` never invents a second board.  
3. **Attestation ≠ tokenization ≠ ownership.** Never market otherwise (`/powered-by` lock).  
4. **Scores never sold.** Meter verdicts / API / seats — never grades or placements.  
5. **No CopilotKit rewrite.** Prefer prebuilt React cards (`MeasuredToolCard`) the agent fills.  
6. **No invented AUM, ARR, or list prices as MEASURED.** Pricing pending published ruling.  
7. **Stage gates:** Stage 1 = doctrine + stubs; Stage 2 = testnet OUSG/BUIDL/JMWH; Stage 3 = mainnet top 10.  
8. **Legal review** of attestation templates before external risk-negative publish — real gate, not code.

---

## DSH into all — parity matrix (binding)

Every row must eventually be ✅ on both columns. Empty = work remaining. Same card hash / same Layer 0 URI.

| Surface / card | Council OS (Lobby / public) | DSH `/dashboard` | Loginless verify |
|----------------|----------------------------|------------------|------------------|
| GSPC board | `/gspc-scoreboard` · MCP `gspc_board` | Sidebar / hub | `/gspc-verify` |
| East-West packs / desks | `/east-west/*` · MCP `east_west_board` | Same pack IDs | Pack verify |
| EAT competitors (52) | `/competitors` | Same records | — |
| RWA EAT stubs | `/competitors` RWA section | Same stubs when MEASURED | Card offline + optional chain pointer |
| Estate / risk | `/estate` | Hub tile | — |
| Instruments / Eunomia | `/instruments` · MCP `instruments_catalog` | Sidebar | — |
| Engine Axis / Bond / Layer 0 | LobbyHome tiles | DSH sidebar (`layer0Links`) | — |
| Verify tally | Lobby card · MCP `verify_tally` | Hub | Offline recompute |
| Powered-by / Option A | `/powered-by` | Partner admin later | — |
| Signed RWA Memo/EAS card (Stage 2+) | Lobby tool card + Competitors | **Identical card** | `/gspc-verify` or pack verify |

**Definition of done for any new card:** OS openable · DSH reachable · verify path if signed · grammar pill MEASURED/UNMEASURED/provisional — never “rated.”

Shared constants stay in `client/src/lib/layer0Links.ts` (extend; do not fork).

---

## Stack research → this repo (not a greenfield monorepo)

Compass proposed a new `council-os/` tree with Next.js frontend. **Map into what already ships:**

```
councilof-ai/                          # this repo (branch → master for prod)
├── client/                            # Council OS UI (Vite + React + wouter) — KEEP
│   ├── components/lobby/              # AG-UI Lobby · MeasuredToolCard registry
│   ├── pages/                         # /os, /competitors, /powered-by, /dashboard, …
│   └── data/rwaAttestationTargets.ts  # unsigned EAT stubs (seed for adapters)
├── functions/api/                     # CF Pages Functions — MCP, gspc, east-west, geo-hint
├── mcp/                               # package drafts / registry
├── adapters/                          # NEW (OPEN) — DeFiLlama-style; one folder per target
│   ├── xrpl/<slug>/index.ts
│   ├── evm/<slug>/index.ts
│   └── SKILL.md                       # agent authoring conventions
├── publishers/                        # NEW — Stage 2+; no mainnet until custody+legal
│   ├── xrpl-memo.ts                   # v1 pointer (preferred)
│   ├── xrpl-credential.ts             # provisional until CredentialAccept
│   └── eas-attest.ts                  # eas-sdk / eas-batch-attest
├── engine/                            # PRIVATE boundary — signing core (do not open-source)
│   └── (existing card-issuance / Ed25519 paths — wrap as MCP tools; do not relocate blindly)
└── docs/
    ├── COUNCIL_OS_PRODUCT.md
    ├── EAT_DSH_ALIGNMENT.md
    └── COUNCIL_OS_BUILD_PLAN.md        # this file
```

| Compass zone | Do this |
|--------------|---------|
| `/frontend` CopilotKit+LangGraph | **Do not fork.** Keep `client/` Lobby + controlled generative UI |
| `/engine` private | Keep proprietary; expose via existing MCP tools + future `attest_measure` |
| `/adapters` open | **Add** under repo root; seed from `rwaAttestationTargets` slugs |
| `/publishers` | **Add** scripts; Stage 2 testnet first |
| `/mcp-server` | Extend `functions/api/mcp*` — do not stand up a parallel server |
| `/index-store` | Later: time-series corpus for paid API — empty/honest until data exists |
| Channels SDK | Optional Stage 3+ distribution of *current* AG-UI agent — not a rebuild |

---

## Pipeline (adapters → engine → publishers → OS+DSH)

```
adapter(slug) → public facts JSON (dated, sourced)
        │
        ▼
engine → measurement card (SHA-256 + Ed25519)   # PRIVATE
        │
        ├──────────────────► Council OS cards + DSH (same evidence)
        │
        ▼
publisher (Stage 2+) → XRPL Memo | provisional Credential | EAS off-chain
        = URI + hash pointer — NOT a token, NOT ownership
```

### Ready OSS (use, don’t rewrite)

| Need | Use | Stage |
|------|-----|-------|
| XRPL Memo / CredentialCreate | `xrpl` (xrpl.js); official Credential Issuing Service tutorial | 2+ |
| EVM attest batch | `@ethereum-attestation-service/eas-sdk` + `eas-batch-attest` | 2+ |
| Chain reads | Nodit MCP (XRPL+EVM) and/or Blockscout MCP | 2+ config |
| Cards in chat | Existing `measuredToolCards` + `MeasuredToolCard` | 1 (done) |
| White-label | `/powered-by` Option A | 1 (surface) |

### Operational blockers (not research gaps)

- **Key custody** before mainnet publish (HSM/MPC or isolated signer — not laptop `.env`)  
- **Paid/archive RPC** at hundreds-of-targets scale (`.env` overrides à la DeFiLlama)  
- **Legal** attestation language review  
- CopilotKit paid-tier boundary → **irrelevant** if we do not depend on CopilotKit  

---

## Business flywheel (one system — Option A first)

1. **Free unsolicited attestation layer** (OS chat + cards; later Memo/EAS pointers) → reference status.  
2. **Inbound pilots** — insurer underwriting input; audit continuous-assurance *input* (not a Big Four product).  
3. **Licensable SKUs (Option A)** — “Powered by Council OS” embed + countersignature engine license; meter verdicts/API/seats. Pricing pending ruling (market bands are indicative only).  
4. **Corpus / index API** — time-series signed corpus after citation; scores never sold.  
5. **Tokenization partnership (Option B)** — Tokeny / Securitize / Archax / Ownera; we attest + UX; **they** are issuer/TA. Never Option C (become issuer) near-term.

COBOL / CobolBridge = trust on-ramp via lineage artefacts — **out of Stage 1 productization**.

---

## Execution sequence (slots under existing stages)

| Step | Action | Exit |
|------|--------|------|
| **1a** | DSH↔OS parity pass on matrix above (GSPC, East-West, EAT, Layer 0) | Checklist rows green or explicitly deferred with owner |
| **1b** | Scaffold `adapters/` + `SKILL.md`; one adapter per `rwaAttestationTargets` slug (read-only facts) | `node`/`vitest` smoke per adapter |
| **1c** | Keep Lobby wire: `AGUI_WIRE_URL` or refuse-closed; tool→card registry complete | Cards from tool calls |
| **1d** | Option A `/powered-by` live on branch; no invented prices | Messaging lock intact |
| **2a** | Publishers on **testnet** (XRPL Devnet Memo + EAS Sepolia/Base off-chain) for **OUSG, BUIDL, JMWH** | Independent verify of pointers |
| **2b** | Cards appear in OS **and** DSH | Parity checklist ✅ |
| **3** | Mainnet top 10; Memo-first; EAS off-chain scale | Counsel + custody signed off |
| **Later** | Corpus API · Channels · tokenize partner | After citation + pricing ruling |

---

## Recommendations (ranked)

1. **Do not restructure onto CopilotKit/Next.** Extend this repo’s zones (`adapters/`, `publishers/`).  
2. **Finish DSH into all** — treat the parity matrix as the definition of 100/100 product quality.  
3. **Seed adapters from existing RWA stubs** — one folder per slug; open for community PRs later.  
4. **Use eas-batch-attest + thin xrpl.js Memo loop** at Stage 2 — no custom batch research.  
5. **Proxy chain reads via Nodit/Blockscout MCP** — wrap GSPC engine as *our* MCP tools only.  
6. **Resolve custody + legal before any mainnet publisher run.**  
7. **Sequence unchanged:** free reference → Option A pilots → corpus → Option B partner.

---

## What not to build (expanded)

- CopilotKit / Open AG-UI Demo greenfield as Council OS  
- Open HTML iframe “generative UI” as primary cards (sandboxed iframes = last resort)  
- Parallel scoreboard in DSH  
- Parallel MCP server outside `functions/api/mcp*`  
- Mainnet publishers without custody + counsel  
- Marketing that equates attestation with tokenization  
- Invented traction, ARR, or published prices before ruling  

---

## Caveats

- Tooling versions (xrpl npm, EAS SDK, Nodit) move fast — re-verify at Stage 2 kickoff.  
- `xrpl-py` Credential support not assumed — prefer TypeScript publishers next to CF functions.  
- Staff SEC statements are guidance, not law — counsel owns external language.  
- This plan is execution architecture under Claude doctrine — not investment advice.

## Sources

- Compass build-plan artifact (XRPL/EAS/MCP/adapters/flywheel research)  
- `docs/COUNCIL_OS_PRODUCT.md` · `docs/EAT_DSH_ALIGNMENT.md` · `docs/PRODUCTION_CHECKLIST.md` · `docs/agent-runbook.md`  
- OWNERSHIP #80 · Option A `/powered-by` · RWA stubs `client/src/data/rwaAttestationTargets.ts`
