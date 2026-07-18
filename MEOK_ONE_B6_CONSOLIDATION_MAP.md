# MEOK ONE — B6 Consolidation Map (the "macro everything into one" plan)

**Decision (Nick, 2026-05-29):** `meok-oneos/` is **canonical**. Confirmed by recon — 2,599 files, touched today, full OS structure (agents · core · gateway · memory · mcp · dashboard · coordination · sovereign · connectors · interface · e2e · tests).

**Status: PLAN ONLY. Nothing has been moved or archived.** Folder moves are irreversible-ish and high-blast-radius; this map is for your approval before any `git mv` / archive. Each row says exactly what happens and why.

---

## Classification key
- **CANONICAL** — the one true home.
- **FOLD-IN** — has unique value; migrate that value into `meok-oneos/`, then archive the shell.
- **ARCHIVE** — superseded / scaffolding / near-empty; move to `_archive/` (reversible — it's just a move, still in git).
- **LEAVE** — live-deployed or its own product; do NOT fold (would break a deployment).

---

## The map

| Dir | files | touched | verdict | action |
|---|---|---|---|---|
| **meok-oneos/** | 2599 | 05-29 | **CANONICAL** | the shell everything else maps into |
| `bridge/` (unified_bridge.py :3114) | 1 | 05-18 | **FOLD-IN** | this is the *real* multi-provider router (Opus/Kimi/Flash routing — validated by today's benchmarks). Move `unified_bridge.py` → `meok-oneos/gateway/` or `/connectors/`. High value, 1 file — clean fold. |
| `meok-bridge/` | 1 | 05-18 | **ARCHIVE** | near-empty duplicate of `bridge/`. |
| `mcp-bridge/` | 2 | 04-05 | **ARCHIVE** | stale (April), superseded by meok-oneos/mcp + connectors. |
| `unified-saas/` | 28 | 04-16 | **ARCHIVE** | old, no .vercel, superseded. |
| `unified-portfolio-catalog/` | 9 | 05-21 | **FOLD-IN** | if it holds the domain/product catalog, that's reference data → move into `meok-oneos/docs/`; else archive. (verify contents first) |
| `mcp-monetization-gateway/` | 2 | 05-28 | **ARCHIVE** | 2 files; monetization logic already in meok-labs-engine. |
| `csoai-mcp-monetization/` | 2255 | 04-30 | **FOLD-IN (selective)** | big but stale (April). Likely the MCP catalog + Stripe wiring. Extract the live monetization pieces into meok-oneos, archive the rest. NOT a blind move — needs a content pass. |
| `sov3-deploy/` | 357 | 05-28 | **LEAVE (then reconcile)** | deployment artifacts for SOV3. Keep as deploy target; reconcile its UNIFIED-SAAS-ARCHITECTURE.md doc against meok-oneos so they don't drift. |
| **`meok-api-gateway/`** | 9 | 05-27 | **LEAVE** ⚠️ | **OWN git repo + HAS .vercel = live deployment.** Do NOT fold/archive — would break a live service. Link to it from meok-oneos as an external service instead. |
| **`meok-platform/`** | 37127 | 04-16 | **LEAVE** ⚠️ | **OWN git repo, 37k files.** Separate product/repo. Do NOT absorb. Reference only. |
| **`meok/`** | 43558 | 05-29 | **LEAVE** ⚠️ | **OWN git repo, 43k files, active today.** This is the MEOK AI OS product itself (the 22-API / 15-page app per memory). Separate. Do NOT touch. |
| `meok-sovereign-api/` | 4436 | 05-29 | **LEAVE (then reconcile)** | active today, 4.4k files — looks like a live API surface. Verify it's not a 3rd copy of the bridge; reconcile, don't blind-archive. |
| `meok-labs-engine/` | 146 | 05-28 | **LEAVE** | the live compliance MCP engine (stripe_webhook, auth_middleware — the security-task files). Active product code. Reference from meok-oneos. |

---

## What actually gets touched (the safe subset)

**ARCHIVE (5 dirs, near-empty/stale, pure `git mv` to `_archive/`, fully reversible):**
`meok-bridge/`, `mcp-bridge/`, `unified-saas/`, `mcp-monetization-gateway/` — and `bridge/` *after* its one valuable file is folded in.

**FOLD-IN (move specific value, then archive the husk):**
- `bridge/unified_bridge.py` → `meok-oneos/gateway/unified_bridge.py` (the multi-model router).
- `unified-portfolio-catalog/` → `meok-oneos/docs/` (if it's catalog/reference data).
- `csoai-mcp-monetization/` → selective extract (needs a content pass — do NOT bulk-move 2,255 files).

**LEAVE UNTOUCHED (6 — live deploys / own repos / separate products):**
`meok/`, `meok-platform/`, `meok-api-gateway/`, `meok-labs-engine/`, `meok-sovereign-api/`, `sov3-deploy/`.

---

## Why this is conservative on purpose
Three dirs (`meok/`, `meok-platform/`, `meok-api-gateway/`) are **their own git repos** and one is **live on Vercel** — folding those would sever a deployment or rewrite product history. "Macro into one" means **one canonical *shell* with clear references to the live products**, NOT cramming 124k files into a single folder. The OS is the orchestration layer (`meok-oneos/`); the products stay where they ship from.

## Proposed execution order (on your go)
1. Verify contents of `unified-portfolio-catalog/` + `csoai-mcp-monetization/` (read-only).
2. `git mv` the 4 stale/empty dirs → `_archive/2026-05-29/` (reversible).
3. Fold `bridge/unified_bridge.py` into `meok-oneos/gateway/`, test it imports, archive the husk.
4. Write `meok-oneos/README.md` "MEOK ONE map": canonical shell + links to the 6 live products it orchestrates.
5. Commit. One clean OS, nothing broken.

**Awaiting your approval to execute steps 1–5 (all reversible; serial; no deploys).**
