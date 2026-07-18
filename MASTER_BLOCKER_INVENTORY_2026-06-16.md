# MASTER BLOCKER INVENTORY — CSOAI/SOV3 Living Ecosystem
**Date:** 2026-06-16 | **Goal:** Stop manual blockers; make the hives hum autonomously

---

## Tier 1: Kingpin Blockers (Everything Else Waits)

| # | Blocker | Why It Stops Everything | Owner | Automated Fix Possible? |
|---|---|---|---|---|
| 1 | **MEOK_MASTER_API_KEY missing** | Gates Stripe checkout, Pro keystone, 4 paywalled MCPs, attestation Pro tier | Nicholas | ❌ Requires human secret |
| 2 | **STRIPE_PUBLISHABLE_KEY missing** | Frontend checkout cannot initialize | Nicholas | ❌ Requires human secret |
| 3 | **Stripe price IDs missing** | `csoai-org/api/prices.js` uses placeholders; no products to charge for | Nicholas | ❌ Requires Stripe dashboard |
| 4 | **WebBridge extension not connected** | Cannot auto-publish to LinkedIn/Twitter | Nicholas | ❌ Requires browser action |
| 5 | **mcp-publisher GitHub auth expired** | 30+ MCP publishes blocked | Nicholas | ❌ Requires browser/device flow |

---

## Tier 2: Operational Drag (High-Value, Can Be Automated)

| # | Blocker | Pain | Auto-Fix Path |
|---|---|---|---|
| 6 | **Hermes kanban = 0 tasks, no publish loop** | Agents produce drafts but nothing ships | Build task queue + publish-loop agent |
| 7 | **75/202 Smithery MCPs diverged on feat/* branches** | Marketplace presence fragmented | Batch git ops bot |
| 8 | **SBT_MOCK_MODE=true** | Trust layer is a dictionary, not a chain | Automated SBT wiring against devnet |
| 9 | **Dirty deploy artifacts across 170+ files** | Working tree noise, deploy drift | CI-generated artifacts + .gitignore |
| 10 | **meok-ui on Python http.server fallback** | Not the real Next.js build | Automated Vercel promote/redeploy |
| 11 | **weaviate:8080 + neo4j:7474 stopped** | Data layer offline | Health-check restart daemon |
| 12 | **27-character activation ledger logic drift** | Characters marked dormant incorrectly | Source-of-truth registry sync |
| 13 | **Duplicate consumer products: meok-one vs meok-oneos** | Split attention, double maintenance | Migration + sunset plan |

---

## Tier 3: Strategic Debt (Ecosystem-Level)

| # | Blocker | Why It Matters | Long-Term Fix |
|---|---|---|---|
| 14 | **No unified task queue across agents** | Kimi, Claude, Hermes operate in parallel silos | SOV3-Nemesis council as cross-agent router |
| 15 | **No closed-loop quality gate** | Tests, commits, deploys not enforced | CI/CD policy as code |
| 16 | **Credential hygiene scattered** | Secrets in env, .env, prompts | Central secret manager + injection |
| 17 | **No unified metrics dashboard** | Can't see empire health in one place | SOV3 `coord_get_dashboard` + telemetry |
| 18 | **Domain/DNS human gates** | 7 sites below A grade waiting on Namecheap/Vercel clicks | Domain automation API (Namecheap, Vercel) |
| 19 | **Open-source science not synthesized** | Nemesis research exists but not integrated | Living R&D ingestion pipeline |

---

## The Living Ecosystem Vision

Instead of chasing each blocker manually, build **SOV3-Nemesis as the metabolic layer**:

```
┌─────────────────────────────────────────────────────────────┐
│                    SOV3-NEMESIS ORCHESTRATOR                 │
│  (BFT Council routes tasks → agents → tools → verification)  │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
   ┌─────────┐          ┌──────────┐         ┌──────────┐
   │  Task   │          │  Agent   │         │ Publish  │
   │  Queue  │◄────────►│  Swarm   │◄───────►│  Loop    │
   │(Kanban) │          │(Kimi/Claude│        │(Social/ │
   └─────────┘          │ /Hermes)  │        │ Git/MCP) │
        ▲                └──────────┘         └──────────┘
        │                     ▲
   ┌─────────┐                │
   │ Blocker │───────────────┘
   │  Ingest │
   └─────────┘
```

**What changes:** Blockers become tasks. Tasks get routed. Agents execute. Outputs get verified. Closed loops publish.

---

## Quick-Win Automations (Build This Week)

1. **Blocker-to-Task Bridge** — Read `BLOCKER_INVENTORY_*.md` and `QUALITY_MANAGEMENT_PLAN_*.md`, create tasks in Hermes kanban or a simple queue.
2. **Service Healer** — Cron every 5 min: ping ports 3000/3101/3102/3200/3400; restart if down.
3. **Smithery Reconciler** — Batch script: for each MCP on `feat/*`, open PR or fast-forward to main.
4. **Social Publish Bot** — Once WebBridge connects, queue posts and auto-publish from `READY_TO_POST.txt`.
5. **Price-Label Guardian** — Re-run `fix_stripe_price_mismatches.py` on every deploy to prevent drift.

---

## Hard Gates (Human Required)

- Any financial transaction (Stripe live flip, domain purchase)
- Any secret paste (MEOK_MASTER_API_KEY, publishable keys)
- Any production deployment with customer data risk
- Any git mutation not already policy-approved

The ecosystem should **queue these and ask**, not skip them.
