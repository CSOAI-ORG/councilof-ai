# CSOAI — Synergise & Absorb Everything into One Monetized Brand
**2026-06-16.** Goal: every MCP, protocol, A2A layer, library and listing → ONE clean csoai.org brand, software loading perfectly, all payments working, full distribution, revenue flowing.

## The spine: ONE brand, ONE funnel
csoai.org (the `csoai-dashboard` master, live at csoai-v2-master.vercel.app) is the single front door. Everything else is a *product surfaced in its catalog* and *wired to one SaaS funnel*:
**Discover → land on csoai.org/<product> → free call (rate-limited) → hit limit → signup (Stripe) → API key auto-provisioned (attestation API) → metered paid calls → upsell to packs/enterprise.**

## Layer map — what absorbs into what
| Layer | Assets (today) | Absorbs into | Monetization |
|---|---|---|---|
| **MCP catalog** | 271+ MCPs (PyPI), MCPRegistry.tsx + MCPDetail.tsx already in master | `csoai.org/mcp/<name>` canonical pages | Free tier (rate-limited) → Pro key → per-call (x402) |
| **MCP listing sites** | Smithery, mcp.so, PyPI, GitHub | inbound → each listing backlinks csoai.org as the home/registry | discovery → funnel |
| **A2A layer** | rate-limiter, audit-logger, policy-enforcement, handoff-certified, prompt-injection-firewall MCPs | "Agent Infrastructure" tier; signed handoffs via keystone | B2B/enterprise trust layer |
| **Agent transport (libp2p/A2A)** | P2P + MCP interop fabric | `/protocols` — the interop spec the agents speak | reference + paid SLA |
| **Compliance protocols** | 52-Article Charter, 49 crosswalks (EU AI Act/NIST/ISO42001/TC260), Charter.tsx + Crosswalks.tsx in master | `/charter`, `/crosswalks`, `/frameworks` | lead magnet → cert upsell |
| **Certification** | CEASAI cert + Watchdog certs, signed via keystone | `/certification`, `/watchdog` | £499 course + cert fees |
| **The moat** | RLMAI truth-gate (verified-correct citations) | premium tier headline; an MCP itself | premium / per-verification |

## The money plumbing (must all work)
1. **Stripe** — subscription ladder (Free / Pro £9 / Team £99 / Enterprise) + course/cert one-offs. **GATE: live keys + `/api` 403 lift (Nick).**
2. **Attestation API** (`/provision`) — mints API keys on payment; MEOK_MASTER_API_KEY ✅ LIVE. Keystone Ed25519-signs certs/attestations.
3. **x402 micropayments** — per-MCP-call billing (£0.10–1.00) for pay-as-you-go agents.
4. **One billing brain** — Stripe session → `/provision` → key → metered calls. Already wired in `server/`; needs DB + live keys.

## Software-loading (install → key → call, perfectly)
`pip install <mcp>` / `npx` / Smithery → key from csoai.org → authenticated MCP call. The meok SDK + the 271 PyPI packages are the install surface; csoai.org is the key+billing surface. Verify the end-to-end install→key→call flow as the acceptance test.

## Distribution
- **AEO/GEO** — csoai.org structured so AI agents cite it (the catalog is machine-readable: llms.txt, agent.json, MCP manifest).
- **Listing sites** — all 271 MCPs point home to csoai.org.
- **The hive** — 28 vertical domains funnel to csoai.org as the trust/cert backbone.
- **Outbound** — branded email (nicholas@csoai.org), the press/LinkedIn engine.

## Execution phases
- **P0 (done/now):** master live + brand-clean; MEOK key live; apex csoai.org → v2 via bridge.
- **P1 (SaaS wiring):** provision cloud Postgres (DATABASE_URL) so `/api` stops 500ing; set Stripe live keys + lift `/api` 403; verify signup→key→call.
- **P2 (catalog wiring):** every MCP gets a csoai.org/mcp/<name> page wired to free→paid; x402 on 10 flagship tools; listing-site backlinks.
- **P3 (distribution):** AEO/GEO machine-readable catalog; hive funnels; outbound.
- **P4 (revenue):** first paid call → first MRR. The moat (RLMAI verified compliance) = the premium headline for the July-4 launch.

## Acceptance = "all tasks complete, revenue"
- csoai.org live, brand-clean, fullstack API green (DB wired).
- Any of the 271 MCPs: discover → free call → signup → key → paid call → Stripe charge → revenue. End-to-end, real money.
- Blocking creds (Nick): Stripe live keys, `/api` 403 lift, a cloud Postgres URL.
