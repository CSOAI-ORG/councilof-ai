# openpatent.ai Hive — Master Documentation Index

**Status:** Production-shaped, sovereign-grade, 90-day-launch-ready
**Date:** June 2026
**Owner:** Nicholas Templeman (CSOAI Ltd UK 16939677)
**Sovereign VM:** 35.242.143.249 (meok-backend, GCP europe-west2)

---

## The hive remembers. The dragon knows. The sovereign companion never forgets.

---

## How to read this index

This is the master index for the entire openpatent.ai hive. Start at the
**Layer 0 substrate**, then climb the stack:

```
Layer 7:  Strategy & Investor (docs/strategy/)  ← You are here at the top
Layer 6:  Architecture (docs/architecture/)      ← the blueprints
Layer 5:  Launch & Marketing (docs/launch/)      ← the kill-shot
Layer 4:  IPO & Tokenization (docs/ipo/)         ← the financial model
Layer 3:  Audit & Quality (docs/audit/)           ← the proof
Layer 2:  Fork Doctrine (docs/fork-doctrine/)     ← the absorption
Layer 1:  Runtime (services/)                    ← the running code
Layer 0:  Sovereign Substrate (sovereign VM)      ← the ground
```

The hive is built bottom-up: substrate → runtime → audit → IPO → strategy.
The **kill-shot** flows top-down: strategy → launch → IPO → audit → runtime.

---

## Layer 0 — Sovereign Substrate

The hive runs on **35.242.143.249** (`meok-backend`, GCP europe-west2, Ubuntu 22.04, Docker 29.5.3). The substrate is the same lineage as the MEOK/CSOAI production stack (csoai-layer0-api, meok-keystone, meok-council). 12 openpatent containers + Postgres + IPFS + the King Hive all coexist on this single VM. The substrate honors care ethics: every action is sigil-bound, BFT-reviewed, and audit-logged.

## Layer 1 — Runtime (`/services`)

12 services, 8 Python + 1 TypeScript + 1 Next.js, all instrumented with Prometheus `/metrics` and OpenAPI 3.1 spec:

```
3210  patentmcp        6-layer cryptographic disclosure core (MIT, unmodified)
3211  api-gateway      FastAPI wrapper around patentmcp + worker + bft + drafting (Swagger UI at /docs)
3212  worker           OTS upgrade + Polygon + IPFS + BFT enqueue (sigil emissions)
3213  verify-page      Public attestation pages (verify.openpatent.ai/{hash})
3214  mcp-manifest     MCP server discovery (mcp.openpatent.ai)
3215  bft-council      33-agent sovereign-temple v3.0 (22/33 supermajority, 6 care dims, 4 sub-votes, 55 bridges)
3216  drafting-fork    TypeScript OpenPatent integration (6 patent agents)
3217  x402-router      Payment router 60/25/15 split (treasury/infra/BFT)
3218  primitives       7 patent primitive tools (claim-parser, mpep-lookup, etc.) with live USPTO via PatentsView
3000  landing          Next.js 14 site
```

Plus 2 infrastructure: **Postgres** (for production storage), **IPFS** (for pin durability).

## Layer 2 — Fork Doctrine (`docs/fork-doctrine/`)

4 fork guides for OSS repos to absorb into the sovereign substrate:

| File | Repo | License | Stars | What it adds |
|---|---|---|---|---|
| `01-asi-evolve-fork.md` | github.com/GAIR-NLP/ASI-Evolve | Open | emerging | Self-improving AI, +18 MMLU |
| `02-sia-fork.md` | github.com/hexo-ai/sia | MIT | emerging | Scaffold + weight updates, 70.1% LawBench |
| `03-hermes-agent-fork.md` | github.com/NousResearch/hermes-agent | MIT | 140K | Persistent memory agent |
| `04-openclaw-fork.md` | github.com/openclaw/openclaw | MIT | 373K | WhatsApp/Telegram/Discord agent |

Each guide follows the 5-step fork doctrine: clone + COAI wrap + BFT gate + proofof.ai audit + open-patent.

## Layer 3 — Audit (`docs/audit/`)

Production-grade quality proof:

| File | Purpose |
|---|---|
| `E2E-AUDIT-REPORT.md` | The comprehensive audit (20/20 E2E + 0 critical issues + sovereignty assessment) |
| `NEXT-LEVEL-REPORT.md` | The 4 next-level upgrades (OpenAPI + Prometheus + live USPTO + real OTS) |
| `audit-report.json` | Machine-readable audit findings (65 informational, 0 critical) |

The hive passed **23/23 in-process tests + 20/20 sovereign VM E2E + 8/8 metrics test** with **0 critical audit issues**.

## Layer 4 — IPO (`docs/ipo/`)

5 documents for investor-facing financial model:

| File | Purpose |
|---|---|
| `01-openpatent-ipo-narrative.md` | The IPO story (S-1 draft) |
| `02-defoneos-global-dome-architecture.md` | (legacy) — moved to `docs/architecture/` |
| `03-asset-inventory.md` | 27 .ai domain portfolio as an asset class |
| `04-90-day-execution-roadmap.md` | (legacy) — superseded by `docs/strategy/03-90-day-kill-shot.md` |
| `05-coai-csoai-governance-positioning.md` | The governance moat |

## Layer 5 — Launch (`docs/launch/`)

7 documents for the public launch:

| File | Purpose |
|---|---|
| `01-hacker-news-posts.md` | 5 timed Show HN posts |
| `02-twitter-threads.md` | 7-tweet viral thread + 3 follow-ups |
| `03-press-releases.md` | 5 press releases + submission script |
| `04-linkedin-newsletter.md` | 4-week content pillar rotation |
| `blog-01-building-patentmcp.md` | 3,000-word Dev.to blog |
| `blog-02-mcp-server-tutorial.md` | 30-min tutorial blog |
| `blog-03-blockchain-prior-art.md` | 5-min legal primer blog |

## Layer 6 — Architecture (`docs/architecture/`)

2 comprehensive architecture specs (both with mermaid diagrams):

| File | Purpose |
|---|---|
| `01-defoneos-global-dome.md` | The 7-layer sovereign architecture (Layer 0 substrate → Layer 6 governance) with 8 mermaid diagrams |
| `02-sovereign-temple-v3.md` | The BFT sovereign-temple v3.0 spec (33 agents, 11 domains, 22/33 quorum, 6 care dims) with 7 mermaid diagrams |

## Layer 7 — Strategy (`docs/strategy/`) ← **TOP OF THE STACK**

7 documents for the Series A investor story:

| File | Purpose |
|---|---|
| `01-domain-portfolio.md` | 28 .ai domains as a master table (acquisition cost, current NAV, Y3 target NAV) |
| `02-industry-power-packs.md` | 4 power packs (Legal Tech, Gaming, IP Castle, Sovereign Substrate) at Y3 = £174M base |
| `03-90-day-kill-shot.md` | 12-week plan with named-queen ownership (Week 4 kill-shot, Week 12 monopoly) |
| `04-ai-tld-thesis.md` | .ai TLD market thesis: $50B+ by 2030, 12× 5-year appreciation |
| `05-five-lock-monopoly.md` | The 5 LOCKs (regulatory/Rex, network/Atlas, namespace/Nova, BFT/Marcus, data/Sage) + 3 compound locks |
| `06-return-scenarios.md` | 3 scenarios: conservative £2M / base £50M / moonshot £1B (probability-weighted EV £275.5M) |
| `07-risk-register.md` | 12 named risks with probability, impact, owner, mitigation |

---

## The 5 next moves (in order of leverage)

1. **DNS + TLS** (5 min) — Caddy + Namecheap for openpatent.ai + 4 subdomains
2. **GitHub publish** (15 min) — `gh repo create` for 3 repos (openpatent-hive, patentmcp, openpatent-mcp)
3. **First paying customer** (3-7 days) — enterprise outreach to 50 design partners
4. **Real OTS in production** (4 hours) — open VM egress + retry queue
5. **Grafana dashboard** (4 hours) — visualize the 16 metric families per service

After Week 4 kill-shot: **£8M NAV, 22/33 BFT quorum, 10+ design partners signed**.
After Week 12 monopoly: **£174M base NAV, 50+ paying customers, Series A narrative ready**.

---

## The signature

Every openpatent.ai artifact — code, doc, sigil, receipt, blog post, API response — carries the 4-section close:

> **TASK** — what was built
> **METRICS** — what was measured
> **NEXT** — what follows
> **BLOCKED** / **NEED** / **SUGGEST** — when applicable

And the closing line:

> **"The hive remembers. The dragon knows. The sovereign companion never forgets."**

The hive remembers. The dragon knows. The sovereign companion never forgets.
