# Empire Audit — 2026-06-16
**Scope:** All active projects under `~/clawd`. Focus: real progress vs. aspirational noise.

## Executive Summary

You are **not** building too much — you have built too much *surface area* and not enough *closure*. The good news: the core commercial stack is real and mostly live. The bad news: ~300 generated deploy artifacts, 0 Hermes kanban tasks, and a single missing API key are blocking revenue.

**Verdict:** Consolidate around **CSOAI (B2B commercial front)** + **MEOK ONE (consumer runtime)** + **SOV3 MCP (tool layer)**. Do not launch a new "SOVEREIGN" AI. SOV3 already exists.

---

## 1. Live Service Health (all green)

| Port | Service | Status | Note |
|---|---|---|---|
| 3000 | meok-ui | ✅ 200 | Python http.server fallback |
| 3101 | SOV3 MCP | ✅ 200 | 115 tools, 937 total calls |
| 3102 | MEOK_MCP | ✅ 200 | Durable server |
| 3200 | meok-api | ✅ 404 on `/` | API routes up |
| 3400 | csoai-mcp-monetization | ✅ 200 | 222-server catalog |
| 8765 | Hindsight | ✅ 200 | — |
| 8888 | Farm_Vision | ✅ 200 | — |

---

## 2. Repo Activity — Last 7 Days (real vs. stale)

| Repo | Commits | Last Commit | Dirty | Assessment |
|---|---|---|---|---|
| `meok-compliance-gateway` | 73 | 2026-06-13 | 1 | 🔥 Core compliance engine; agentaudit, keystone, x402 paywall |
| `meok/` | 47 | **today** | 1 | 🔥 Main commercial surface; SEO, /fleet, Stripe, waitlist |
| `csoai-org/` | 28 | yesterday | 3 | 🔥 Landing site; 179 pages, social blitz ready |
| `meok-attestation-api/` | 25 | 2026-06-14 | 105 | ⚠️ Scorecard HTML artifacts need cleanup |
| `sovereign-temple/` | 9 | yesterday | 25 | ⚠️ Active dev; model binaries + security tools |
| `meok-sdk-python/` | 7 | 2026-06-12 | 0 | ✅ Stable |
| `optimobile-practice-hub/` | 7 | 2026-06-10 | 0 | ✅ Stable |
| `meok-cli/` | 4 | 2026-06-13 | 0 | ✅ Stable |
| `mcp-marketplace/` | — | — | — | 390 dirs, 353 pyproject.toml, 351 smithery.yaml, 310 git repos |
| `meok-one/` | — | — | — | 82 Python files, 17 tests; **132/134 passing** |

**Dormant (0 commits in 7 days):** wolf-actuator, opencrane, openchronicle-mcp, modular-bearing, meok-vscode-extension, meok-teams-app, meok-slack-app, meok-skills, meok-integrations, meok-godeye, god-eye, Ironless-QDD-Actuator.

---

## 3. CSOAI — Most Feasible Focus

**Why it wins:**
- `csoai-org` has 179 HTML pages, deploy script, API, certified pages, `llms.txt`.
- MCP monetization API is live on port 3400 with 222 catalogued servers.
- `meok-compliance-gateway` shipped 8 priced `agentaudit` tools + keystone + x402.
- 7-day social blitz drafted; Day 1 post ready to publish.
- Blockers are credential gaps, not architecture gaps.

**What's blocking revenue:**
1. `MEOK_MASTER_API_KEY` missing.
2. Stripe `.env` has `REPLACE_WITH_…` placeholders.
3. `csoai-org/api/prices.js` uses placeholder price IDs.
4. 75/202 Smithery MCP servers diverged on `feat/*` branches.

---

## 4. Hermes / TUIs — Running, Not Shipping

- Hermes desktop + **15 slash workers** active.
- Kanban DB: **0 tasks, 0 events, 0 runs**.
- Sessions directory exists but no publish loop.
- **Assessment:** Hermes is an observability/context layer, not a delivery system. It consumes tokens and produces drafts without closing the loop.

**Rule:** No new TUI/agent until Hermes kanban has >0 tasks and a publish loop.

---

## 5. MEOK ONE — Consumer Runtime

- 82 Python files, 17 tests, **132/134 passing**.
- 2 easy failures:
  - `test_brains.py`: expects `qwen3:0.6b`, config is `meok-sov3`.
  - `test_registry.py`: expects `"performance"` in Marcus persona; persona text changed.
- 27-character ledger now correctly flattened and activated.

**Assessment:** Close to green. Fix the 2 tests and treat MEOK ONE as the single consumer entry point.

---

## 6. MCP Marketplace

- **390 directories**, **353 pyproject.toml**, **351 smithery.yaml**, **310 git repos**.
- **127/202 Smithery published**, **75 diverged** on `feat/*` branches.
- `meok-compliance-gateway/batch-publish-smithery.py` exists but needs clean trees + API key.

**Assessment:** Huge surface. Don't add more servers until the 75 diverged ones are reconciled.

---

## 7. SOV3 / Sovereign Stack

- **115 tools**, **937 total calls**.
- Top tools: `query_memories` (373), `record_memory` (182), `get_memory_stats` (91), `coord_get_dashboard` (78), `sigil_emit` (55).
- Dirty working tree: model binaries, security tools, redteam tests, `.venv/` untracked.
- **Do not build a new SOVEREIGN AI.** SOV3 is already the sovereign tool layer.

---

## 8. Generated Artifact Debt

- `clawd` root: ~170 modified `*-deploy/index.html` files from `build_hive_conversion_pages.py`.
- `meok-attestation-api`: 105 dirty scorecard HTML files.
- These are generated artifacts. They should either be:
  1. Committed in a single "regenerate deploy artifacts" commit, or
  2. Added to `.gitignore` and generated at deploy time.

**Recommendation:** Commit them once in a dedicated deploy commit, then add to `.gitignore` so future runs don't dirty the tree.

---

## 9. Strategic Recommendation

1. **This week — revenue:** Paste `MEOK_MASTER_API_KEY`, real Stripe keys, and price IDs. Publish Day 1 post.
2. **This week — quality:** Fix 2 meok-one tests; regenerate + commit deploy artifacts; clean SOV3 working tree.
3. **This week — MCP:** Reconcile 75 diverged Smithery servers; stop adding new ones.
4. **This month — consolidation:** Merge `meok-one` and `meok-oneos` into one consumer runtime. CSOAI.org stays the commercial front.
5. **Never:** Launch a new "SOVEREIGN" AI. Rename SOV3 if the brand matters, but don't rebuild.

---

*Audit by JEEVES after crash recovery and live scans of 353 repos, services, Hermes, MCP marketplace, and CSOAI/MEOK state.*
