# Council of AI

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PyPI](https://img.shields.io/badge/PyPI-Install-3775a9)](https://pypi.org/project/councilof_ai/)

> Independent AI-governance measurement. We measure, we sign, we re-attest — everyone can check.

Council of AI (CSOAI LTD, UK Companies House 16939677) is an independent measurement body for AI behaviour. We run AI systems on published, frozen instruments; issue the results as signed, offline-verifiable measurement credentials (Ed25519); and re-measure on a cadence so the evidence stays current. **Measurement, not certification** — we do not certify, sell ratings, or remediate, and we take no money from anything we rank. Verification is free and loginless.

---

## 🚀 Quick Start

```bash
# Install via pip
pip install councilof_ai

# Or install via Smithery
npx -y @smithery/cli@latest install councilof-ai --client claude
```

## 🧭 What we measure

- **13 GSPC measurement axes** — governance, safety, provenance, continuity, conformance, openness, machinery-conformity, care, cross-reality, detector-interop, art5-safeguard, swarm, affect
- **Deterministic grading** on frozen instruments — no LLM-as-judge, no invented scores
- **UNMEASURED is a first-class outcome** — gaps are reported with their n and limits, never hidden, never scored as a fail
- **Labour / AI-economy indices** — `/indices` declares AI-economy · human-labour · humanoid-labour as **UNMEASURED** first (contextual firewall; never fused into GSPC grades)
- **Signed credentials** — Ed25519 over SHA-256, chain-linked, time-anchored, offline-verifiable
- **Live axis data**: `GET https://councilof.ai/api/gspc` (schema `csoai.gspc-axes/0.5`)

## 🔍 Verify

Every published measurement carries a public key and a verify path. Check any credential at:

- **https://councilof.ai/verify** — free, no login


## East-West (cross-jurisdiction measurement)

One signed measurement, mapped across EU / UK / Illinois / China. Mapping is not a compliance determination — determination stays with authorities.

- Flagship: `/east-west`
- Verify (client-side): `/east-west/verify` and `/gspc-verify`
- Challenge door: `/challenge`
- Evidence packs: `/east-west/packs` (multinational / insurer / law-firm samples)
- Regulator desks: `/east-west/desks` — signed streams **free forever**
- Buyer screen + license template + one-pagers: `/east-west/buyers`, `/east-west/license`, `/east-west/briefs`
- Pay rail demo: `/east-west/pay` and `GET /api/east-west/pay/demo` (HTTP 402, **amount is null** — no invented price)
- Board API: `GET /api/east-west`
- Offline pack check: `node public/east-west/verify-pack.mjs path/to/pack.json`
- Schema: `https://councilof.ai/.well-known/schemas/cross-border-card.schema.json`

Public grammar: **13 measured of 14**. Product: verified measurement credential — never a certification. Scores are never sold. Regulator streams are free forever.

**Owner-blocked until a published ruling (honest placeholders, not fake commerce):** pricing, x402/MPP activation, first pack sale, DID root, `cibola.dev` / `getcibola.com`, UKIPO. Value Ledger published count is **0**. Empty is launch honesty.

## Deploy path (branch vs production)

| Surface | Branch / path | Notes |
|---------|---------------|-------|
| **This working branch** | `cursor/instruments-catalog-7fb8` | Council OS / East-West / MCP slice land here first |
| **Production** | `master` only | Cloudflare Pages deploys **master**. Branch work is not live on councilof.ai until merge |
| **Local preview** | `npm run build:client` then `npx vite preview --config client/vite.config.ts --host 127.0.0.1 --port 43217` | E2E: `BASE_URL=http://127.0.0.1:43217 npx playwright test --config e2e/playwright.config.ts` |
| **Local dev (branch)** | `node scripts/dev-honesty-api.mjs` + `vite --config client/vite.config.ts --port 43125` | `/api/indices` + `/api/rwa-attestation` via :3001 stub (UNMEASURED fixtures) |
| **MCP JSON-RPC** | `POST /api/mcp` and `POST /api/mcp/http` | `tools/list`, `tools/call` over measured APIs (on branch; live after master merge) |
| **A2A agent card** | `public/.well-known/agent-card.json` | A2A v1.0 + `supportedInterfaces` on branch |
| **Surface hits** | `POST /api/surface-hits` | Anonymous path counters only — not a MEASURED number |
| **Pay demo** | `GET /api/east-west/pay/demo` | HTTP **402**, `amount: null` — OWNER-BLOCKED, no invented price |

### Production gap (probed 2026-08-25)

Live on councilof.ai today: `GET /api/gspc` (200), `GET /api/mcp` catalogue (200), `/.well-known/agent-card.json` (v1.0).

Still **404 on production** until this branch merges to `master`: `GET /api/east-west`, `GET /api/ecosystem`, `POST /api/surface-hits`, `GET /api/east-west/pay/demo`, streamable MCP transport at `/api/mcp/http`. Those handlers exist on `cursor/instruments-catalog-7fb8`.

```bash
# Unit (East-West crypto)
npx vitest run client/src/lib/eastWestCrypto.test.ts

# Offline pack verify
node public/east-west/verify-pack.mjs public/east-west/sample-pack.json
```

Generated `public/ecosystem.json`, `public/sitemap.xml`, and `client/src/data/route-manifest.ts` are produced by `build:client` scripts and committed when the catalogue changes.

## 📖 Documentation

- [EAT playbook](docs/EAT_PLAYBOOK.md) — clean plays, stages, custody/counsel gates, DSH/RunPod/HF
- [Next 300 moves](docs/NEXT_300_MOVES.md) — ownership register moves 101–400
- [INDEX-METHOD-0.1](docs/SOVOS/INDEX-METHOD-0.1.md) — labour/economy indices stay UNMEASURED until bank freeze
- [RunPod policy](docs/RUNPOD_POLICY.md) — GPU for model axes; not RWA churn or invented labour scores
- [HF dataset plan](docs/HF_DATASET_PLAN.md) — honesty dumps; UNMEASURED stub first
- [HF upload runbook](docs/HF_UPLOAD_RUNBOOK.md) — staged packs #139/#186 when `hf auth login` works
- [Regulator indices one-pager](docs/REGULATOR_INDICES_ONE_PAGER.md) — UNMEASURED brief · print [`/regulator-indices-one-pager.html`](public/regulator-indices-one-pager.html) · PDF [`/regulator-indices-one-pager.pdf`](public/regulator-indices-one-pager.pdf) (`npm run pdf:regulator-indices`)
- [Oracle fleet](docs/ORACLE_FLEET.md) — infra status only; not a grade/price oracle
- [Dataset freshness crons](docs/DATASET_FRESHNESS_CRONS.md) — ops designs; no invented MEASURED
- [REPORTED labour/economy citations](docs/REPORTED_CITATIONS_LABOUR_ECONOMY.md) — dated links, no scores
- [Estate crosswalk](docs/ESTATE_CROSSWALK.md) — RWA × GSPC × SOV Signal × regulation × labour/economy
- [Council OS harmony register](docs/COUNCIL_OS_HARMONY.md) — sims, games, overlay, MCP E2E status

### Cursor Cloud / agent env

**Fleet paste (connect + working agreement):** [`docs/MASTER_CONNECT.md`](docs/MASTER_CONNECT.md) · lane claims: [`council-os/LANES.md`](council-os/LANES.md)

Canonical paths for overnight agents (read these before inventing scores):

- `docs/EAT_PLAYBOOK.md` · `docs/NEXT_300_MOVES.md` · `docs/SOVOS/INDEX-METHOD-0.1.md`
- `docs/RUNPOD_POLICY.md` · `docs/HF_DATASET_PLAN.md` · `docs/ORACLE_FLEET.md`
- `docs/agent-runbook.md` · `docs/DEMO_READINESS.md` · `docs/DSH_PARITY_NEW_SURFACES.md`
- `scripts/index-fixtures/labour-economy-unmeasured.json`
- `.claude/skills/refuse-measured-labour/SKILL.md`
- Branch tip writer: GitHub MCP `push_files` with real bytes — never `LOAD_FROM_FILE` / `PLACEHOLDER` stubs
- Prod deploys **`master` only** — this branch is not live until owner merge

- [Council OS cleaned product plan](docs/COUNCIL_OS_PRODUCT.md) — AG-UI / MCP / A2A research mapped to what ships
- [Council OS build plan](docs/COUNCIL_OS_BUILD_PLAN.md) — adapters/publishers/flywheel; **DSH into all**; no CopilotKit rewrite
- [EAT · DSH · RWA attestation alignment](docs/EAT_DSH_ALIGNMENT.md) — permissionless Memo/EAS targets under measurement doctrine
- Surfaces on this branch: `/indices` (UNMEASURED) · `/products` · `/powered-by` · `/competitors` RWA
- [Measurement body overview](https://councilof.ai/about/)
- [Methodology — how we measure](https://councilof.ai/methodology/)
- [GSPC scoreboard](https://councilof.ai/gspc-scoreboard)
- [All published measurements](https://councilof.ai/benchmarks)
- [EU AI Act Article 50 guide](https://councilof.ai/article-50)

## ⚖️ What we never do

- ❌ Certify AI systems or issue compliance badges
- ❌ Sell ratings, rankings position, or early sight of grades
- ❌ Remediate or recommend fixes in exchange for fees
- ❌ Take money in either direction from anything we rank

## 🤝 Part of the Council of AI ecosystem

| Surface | Purpose |
|---------|---------|
| [councilof.ai](https://councilof.ai) | Measurement body — signed credentials, verify, scoreboard |
| [csoai.org](https://csoai.org) | Public site |
| [meok.ai](https://meok.ai) | Sovereign AI platform |

## 📜 License

MIT © [CSOAI-ORG](https://github.com/CSOAI-ORG)

---

<p align="center">
  <sub>Council of AI · CSOAI LTD · UK Companies House 16939677 · We measure. We sign. We re-attest.</sub>
</p>
