# Stack Honesty Register

Binding rule for all councilof.ai finance and router surfaces: **measurement, not certification**. Four data states — never blended.

| Register | Meaning | Example on site |
|----------|---------|-----------------|
| **MEASURED** | Our signed deterministic runs | `GET /api/gspc` · GSPC axes 1–13 |
| **UNMEASURED** | Honestly empty — reason stated | Empty GSPC cells · insufficient n · `/indices` (all three labour/economy) |
| **REPORTED** | Third-party context, cited + dated | $130T bond market anatomy |
| **DESIGN** | Architecture thesis or scenario | Revenue tables · flywheel loops |

Labour / AI-economy indices (`/indices`, `GET /api/indices`) are a **contextual firewall** — never GSPC cell inputs — and stay **UNMEASURED** until INDEX-METHOD freezes a bank.

Wire status (for MCP / finance):

| Status | Meaning |
|--------|---------|
| **SHIPPED** | Repo + site surface reachable |
| **PARTIAL** | Repo exists; not end-to-end on councilof.ai |
| **SPEC** | Spec / doc only |
| **PLANNED** | On roadmap, no frozen bank |
| **GAP** | Design only |

## Canonical counts (from checked-in artefacts)

| Claim | Honest source | Value |
|-------|---------------|-------|
| MCP servers | `client/src/data/mcpRegistry.json` | **291** (captured 2026-06-02) |
| Framework tags on MCP records | `mcpRegistry.frameworkCounts` | **8** |
| Hive crosswalk frameworks | `client/src/data/hive-frameworks.ts` | **15** |
| GSPC core axes | `client/src/lib/gspcAxes.ts` | **13** (all MEASURED on frozen bank) |
| Financial extension axes | `client/src/data/engine-axis.ts` | **8** slots (18–25) |
| ~~568 repos~~ | **Do not cite** — inflated Kimi figure | Use 291 MCP servers |
| ~~30-framework crosswalk~~ | **Do not cite** | Use 15 hive frameworks |

## Engine axis map

### Core (MEASURED)

GSPC axes 1–13: governance, safety, provenance, continuity, conformance, openness, machinery-conformity, care, cross-reality, detector-interop, art5-safeguard, swarm, affect.

### Financial extension (slots 18–25)

| Slot | Axis | Status | First bridge repo |
|------|------|--------|-------------------|
| 18 | Bond Router | **MEASURED** (synthetic pilot) | `GET /api/finance/bond-crossing` |
| 19 | Insurance Engine | PLANNED | `eunomia-insurance-engine` |
| 20 | Stock Market Axis | PLANNED | `eunomia-bond-router` |
| 21 | East-West Bridge | PLANNED | `eunomia-east-west-bridge` |
| 22 | SME Fractional | SPEC | `eunomia-bond-router` |
| 23 | Agent Economy | PARTIAL | `eunomia-agent-economy` |
| 24 | Data DAO | GAP | `eunomia-data-dao` |
| 25 | EUNOMIA Token | GAP | `eunomia-data-dao` |

### Four bridge layers

1. **COBOL ↔ A2A** — digestive (SPEC: `cobol-a2a-bridge-mcp`)
2. **Banks ↔ Insurance** — circulatory (DESIGN; `/insurers` is MEASURED evidence)
3. **East ↔ West** — corpus callosum (PARTIAL: hive crosswalk catalogued)
4. **Stocks ↔ Bonds** — respiratory (DESIGN)

## SovOS: two heads, one body

| Head | Role | Surfaces |
|------|------|----------|
| **CSOAI** (body) | Measurement, governance, insurer evidence, government, academy | councilof.ai, `/insurers`, `/gspc-scoreboard`, `/engine-axis` |
| **MEOK** (public head) | Gaming, NPC agents, arenas, consumer AI | meok.ai, arenas, NPC wallets |
| **SovOS** (engine) | One sign for all crossings — when wired | Eunomia router + GSPC + extension axes |

## What is live vs stub

| Surface | Status |
|---------|--------|
| `GET /api/gspc` | MEASURED — live signed board |
| `GET /api/instruments` | SHIPPED — kernel + compute index |
| `GET /api/finance/anatomy` | SHIPPED — honest map |
| `POST /api/finance/settle` | GAP — returns `status: "stub"` |
| `/engine-axis` | SHIPPED — architecture page with honesty register |
| `/venturi` | SHIPPED — bond venturi thesis |
| `/instruments` | SHIPPED — full MCP catalog browse |
| x402 / USDC on Base | PARTIAL — `/payg` copy + MCP repos; not end-to-end |
| COBOL → A2A bridge | SPEC — `docs/cobol-a2a-bridge-mcp.md` |

## First repo to build

`CSOAI-ORG/cobol-a2a-bridge-mcp` — one COPYBOOK → one JSON → one C2PA attestation. Proof of weave before $130T keynote.

## Pages using honesty register

- `/insurers` — original register (MEASURED / UNMEASURED / REPORTED)
- `/engine-axis` — `StackHonestyBanner` + financial axes table
- `/instruments` — `StackHonestyBanner` + catalogued MCP counts
- `/venturi` — `StackHonestyBanner` + REPORTED market label

Code: `client/src/lib/stackHonesty.ts` · `client/src/components/StackHonestyBanner.tsx`
