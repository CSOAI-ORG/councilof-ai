# MORNING EXECUTION — one screen to start the day

> **Deliverable note:** the canonical copy of this catalog lives at `council-os/MORNING-EXECUTION.md`.
> This copy is committed on the councilof-ai worktree branch only because this agent is
> isolated in a councilof-ai worktree and the worktree guard refuses git operations against
> the separate `council-os` repo. Move/commit the canonical copy from the council-os main checkout.

**Generated:** 2026-08-25 (read-only audit; every HTTP code below was curled live today, no assumptions).
**Scope:** `councilof-ai` (front end) · `council-os` (this monorepo of ledgers) · `csoai-static-deploy2` (the DSH harness workspace) · the Cursor overnight fleet.
**Doctrine held throughout:** UNMEASURED before measured · we MEASURE, never certify · no public prices · we attest, never tokenize · regulators free forever · banned public strings excluded.

---

## TL;DR

- **The 7 "flagship" product surfaces are NOT live — they are STAGED.** `/gpai-evidence`, `/cra-readiness`, `/financial-axes`, `/distribution-integrity`, `/embed`, `/white-label`, and `/blog/governance-benchmarking-is-broken-signed-fix` **all return a genuine Cloudflare 404 right now.** Only `/api/gspc` and `/api/badge` (the 14-axis API + SVG badge) are actually live (200). The plays are built on branches; **none of them have been deployed.** This is the single biggest gap between the ledgers' language ("LIVE NOW") and production reality.
- **Staged work is large: 151 local branches are ahead of origin/master.** ~15 carry substantial product surfaces (the plays, eunomia boards, signed-card, founder page, council-os menu). The rest are the fix/* and cursor/* churn.
- **The Cursor overnight fleet ran hot: 311 `origin/cursor/*` branches** exist, all committed under Nick's name. The bulk is the `card_index` 150-vs-335 board war (`restore-150-r*`, `tight-guard-r*`, `floors-wave*`) — automated skirmishing over the signed board floor, not new product.
- **DSH is reachable:** `:3080` and `:3090` both serve 200 locally. It operates on `csoai-static-deploy2` (~9 GB, actively cron-written) — a harness workspace, mostly build-output/model-artifacts/internal; **not a public content source** (contaminated with banned codenames).
- **Highest-leverage next action:** ship ONE already-built play to production to close the live/staged gap — cleanest is `plays-deadline-products` (`/gpai-evidence` + `/cra-readiness`, generic pack only, no named-provider verdict) via `npm run deploy:prod`. That converts a 404 into a live product page with zero owner gates.

---

## LIVE NOW — verified today (HTTP evidence)

| Surface | URL | HTTP | Note |
|---|---|---|---|
| 14-axis board API | `https://councilof.ai/api/gspc` | **200** | `application/json`, real board data ("14 measured of 14"). |
| Signed SVG badge | `https://councilof.ai/api/badge?axis=governance` | **200** | `image/svg+xml`, `aria-label="GSPC: 14 measured of 14 quotable"`. |
| Homepage | `https://councilof.ai/` | **200** | canonical origin; `csoai.org` 308→200 (no 522 today). |
| GPAI Evidence Pack page | `/gpai-evidence` | **404** | STAGED on `plays-deadline-products`, not deployed. |
| CRA Readiness Kit page | `/cra-readiness` | **404** | STAGED on `plays-deadline-products`. |
| Financial axes surface | `/financial-axes` | **404** | 8 financial axes live only as `/interop/financial-axes.json`; no route/board slot. |
| Distribution-integrity flagship | `/distribution-integrity` | **404** | STAGED on `plays-distribution-integrity`. |
| White-label embed | `/embed` | **404** | STAGED on `plays-benchmarking-aeo`; live white-label is badge-only. |
| White-label page | `/white-label` | **404** | STAGED. |
| "Benchmarking is broken" blog | `/blog/governance-benchmarking-is-broken-signed-fix` | **404** | STAGED on `plays-benchmarking-aeo`. |

**Verdict: 2 of the 9 audited "live" URLs return 200. The other 7 are staged, not shipped.** (Confirmed hard 404 from Cloudflare with `cache-control: no-store`, not a redirect artifact and not the SPA homepage-fallthrough, which returns 200 at 238 KB.)

---

## STAGED (ready to ship) — branches ahead of origin/master

Ship path for any client/ branch (canonical): **`npm run deploy:prod`** — runs `build:client` (sitemap + redirects + route-manifest + vite build) → `prerender` → `scripts/deploy-prod.sh` (which runs the brand-gate + signed-json-guard + `wrangler pages deploy`). Dry-run first with `npm run deploy:prod:dry`. Rollback: `npm run deploy:prod:rollback`.

| Branch | Ahead | What it ships | Ship it |
|---|---|---|---|
| **`plays-deadline-products`** | 1 | `/gpai-evidence` (GPAI Evidence Pack) + `/cra-readiness` (CRA Readiness Kit) — generic pack only, no named-provider verdict. **[NOW]** | `git checkout plays-deadline-products && npm run deploy:prod` |
| **`plays-benchmarking-aeo`** | 3 | White-label signed self-verifying embed (`/embed`, badge+card widget) + the "benchmarking is broken" AEO piece. | checkout → `npm run deploy:prod` |
| **`plays-distribution-integrity`** | 1 | `/distribution-integrity` flagship ("represented is not distributed" — RWA coverage, UNMEASURED-first). | checkout → `npm run deploy:prod` |
| **`plays-white-label`** | 6 | Persist signed measurement + RWA cards + gateway `total_axes` (mirrors `os-production`). | checkout → `npm run deploy:prod` |
| **`plays-punchlist`** | 1 | Makes financial axes reachable + fixes homepage-fallthrough routes (from E2E RETEST #2). | checkout → `npm run deploy:prod` |
| **`integrate-plays`** | 5 | Roll-up of PLAY 3 AEO signed-reproducible-fix work across the plays. | checkout → `npm run deploy:prod` |
| `feat/eunomia-board-v2` | 41 | Financial-verification board showing both model tiers (0.5b baseline + 7b) — richer, honest. | checkout → dry-run → deploy |
| `feat/eunomia-board` | 37 | EUNOMIA 10-axis financial board, signed exact-label scores. | (superseded by v2 — pick one) |
| `feat/signed-card` | 35 | Publish signed governance measurement card (Proof-of-Benchmark). | checkout → deploy |
| `feat/founder-about-clean` | 34 | Founder section + headshot on About & Founding Members (clean vs `feat/founder-about`, 11). | checkout → deploy |
| `feat/council-os-grouped-menu` | 28 | Grouped nav + HF governance-leaderboard triad (4 surfaces). | checkout → deploy |
| `feat/dorado-evidence-verify` | 11 | Benchmarks tab consumes signed `elo_reference.json` + snapshots. **Note: branch name carries a banned string (`dorado`) — rename before any public reference; verify brand-gate passes.** | dry-run first |
| `feat/library-ia` | 7 | Global BreadcrumbList schema per page (AEO plumbing). | checkout → deploy |
| `feat/badge-endpoint` | 6 | Front-end reframe: Academy (not certification), Wall, brand, pricing-copy. | checkout → deploy |
| `feat/mcp-scoreboard` | 6 | MCP scoreboard surface (merged with master). | checkout → deploy |
| `deploy-sync` (45) / `main-deploy` (39) / `feat/part-cj-sovereign-route-kill` (77) | — | Deploy-line / route-plumbing branches. `part-cj-sovereign-route-kill` name carries banned `sovereign` — **do not ship under that name**; it's a machine-path redirect + catch-all merge, verify contents before use. | inspect before deploy |

**cobolbridge play:** there is **no `cobolbridge` branch** in the repo (searched local + all 735 remotes). It is PLAY 7 in `PLAYS-LEDGER.md` (COBOL-migration → DORA/Basel/SOX lineage → attestation on-ramp), a **[BUILD/owner]** relationship play, not staged code. Nothing to deploy; flagged so the morning reader doesn't hunt for a branch that isn't there.

---

## DSH HARNESS (:3090)

- **Reach it:** `http://127.0.0.1:3090/` is the **tunnel**; `http://127.0.0.1:3080/` is the local origin. **Both return 200 right now.** The UI is the DeepSeek Harness chat/agent-runner (`<title>DeepSeek Harness</title>`) — an agent runner, **not** a content producer, so there is nothing on it to "surface to the site."
- **Workspace it operates on:** `/Users/nicholas/clawd/csoai-static-deploy2` — ~9 GB, the retired DSH static repo. It is **actively cron-driven right now**: `sync.log` and `sovereign_cron.log` were writing at 17:35 today; `benchmark-results/` holds 664 entries updating live; `signed_rounds.jsonl`, `sov_grpo_training_data.json`, and `k3_autodeploy_watchdog.log` are hot.
- **Honest caveat:** most of this tree is build-output, model artifacts, internal harness code, backups, and **internal-codename strategy docs contaminated with banned public strings** (`SOVOS/`, `SOV33_*.html`, `sovereign_cron.log`). Per `LIVE-GAP-AUDIT.md`, only ~22 AEO explainer pages + a containment index + a few OSS repos are public-safe from this tree — **everything else must NOT reach the public front end.**

---

## THE LEDGERS — where each answer lives (in `council-os/`)

| Doc | One-line index |
|---|---|
| `PLAYS-LEDGER.md` | The 7 plays ranked by fuse × leverage, each tagged [NOW]/[OWNER]/[BUILD] with its honest constraint + owner gates. **Start here.** |
| `PLAYS.md` | Same plays as an "in-flight / buyer / window / state" table — the quick status view. |
| `HARNESS-FLEET-SPEC.md` | Blueprint to scale one DSH harness → 22 axis-lanes 24/7 on cheap compute, gate-governed (1 axis = 1 lane = 1 branch = 1 worker). |
| `SYNTHESIS-MAP.md` | How the XRPL/RWA attestation layer maps onto the axes: GSPC-14 (AI systems) + 8 financial axes (tokenized assets) = the 22. |
| `STACK-VS-MARKET-RESEARCH.md` | Deep stack-vs-market cross-reference; the moat = **unsolicited + permissionless** (incumbents are all issuer-pays); every move gate-tagged. |
| `E2E-TEST-REPORT.md` | Live curl audit of prod: 14 GSPC axes + 6 personas usable today; gaps at the edges (financial axes, deep-dives, /products fallthrough, badge-only white-label). |
| `E2E-RETEST-2.md` | Delta retest post-569-route deploy: honesty defect fixed (candidate indices now UNMEASURED); financial axes still 404, white-label still badge-only. |
| `LIVE-GAP-AUDIT.md` | Public-safe content that exists but isn't live: 3 gems (22 AEO pages, methodology paper PR, containment index) + OSS repos; hard-excludes the codename-contaminated files. |
| `ESTATE-INVENTORY.md` | What the estate HAS live vs broken vs next-gap, each line with a URL + HTTP code observed today. |
| `EXECUTION-PLAN.md` | The e2e business plan: data-generation + attestation body; revenue rails (RAS/API/index/tooling/training); free-for-regulators doctrine. |
| `CURSOR-JOBS.md` | Self-contained parallel jobs for Cursor cloud composers (branch → build-verify → PR; doctrine rules baked in). |
| `MONOREPO.md` | The four-zone harness structure: `engine/` (private IP) · `adapters/` (open) · `publishers/` (XRPL/EAS) · `mcp-server/` · `index-store/`. |
| `compliance/` | `deadlines.json` (obligation clock), `eu-ai-act-gpai.md`, `cra-sbom-workflow.md`, `key-custody-decision.md`, `attestation-language-template.md`, `xrpl-js-hygiene.md`. |
| `economy/` | `financial-axes.json` + `xrpl-attest/` (16-instrument attestation coverage). |
| `regwatch/` | `feeds.json` + `watch.py` — regulatory drift hash-watcher. |
| `ops/` | `banned_strings_check.sh` (the brand gate) + `live_status_check.py`. |

---

## OWNER-ONLY GATES — things only Nick can unblock (compute cannot)

1. **Signing key custody** — AWS KMS (both curves, available since Nov 2025) **OR** cb-mpc-on-Oracle. Unblocks **every mainnet measured verdict**. The KMS client is already committed; it is "gated only on the owner's key." (`compliance/key-custody-decision.md`)
2. **Securities counsel** — the committed attestation-language brief must clear counsel **before any mainnet verdict on a named security**. (`compliance/attestation-language-template.md`)
3. **Modal $100 invoice** — settle to keep the Modal compute lane available.
4. **RunPod stale-pod cleanup** — kill drifted/stale pods (endpoints move on live pods; durability = bytes on two machines).
5. **UKIPO TM3** — trademark filing for the mark.
6. *(send-gated, not owner-key)* the two SCITT emails — interop reply landed; the IETF-127 agenda note is drafted and awaiting Nick's send.

---

## NEXT BATCHES — ranked, honest

1. **[NOW] Ship `plays-deadline-products` to prod.** Turns `/gpai-evidence` + `/cra-readiness` from 404 into live product pages. Generic pack only — no named-provider verdict, so zero owner gate. `git checkout plays-deadline-products && npm run deploy:prod:dry` then `deploy:prod`. Highest leverage: closes the live/staged gap with the shortest fuse (GPAI enforcement is already live).
2. **[NOW] Ship `plays-benchmarking-aeo`.** Puts `/embed` (self-verifying widget) + the "benchmarking is broken" AEO piece live — pure credibility/funnel, doctrine-clean, no gate.
3. **[NOW] Ship `plays-distribution-integrity` + `plays-punchlist`.** Distribution-integrity flagship (UNMEASURED-first coverage) + fixes the `/products`, `/get-measured`, `/badges`, `/verify-certificate` homepage-fallthrough routes flagged in E2E RETEST #2.
4. **[NOW] Reconcile the eunomia boards.** `feat/eunomia-board-v2` (41) supersedes `feat/eunomia-board` (37) — pick v2, deploy, delete the loser. Don't ship both.
5. **[BUILD] Tame the branch sprawl.** 151 branches ahead of master + 311 `cursor/*` remotes is unmanageable. The `restore-150`/`tight-guard`/`floors-wave` cursor branches are the card_index 150-vs-335 board war — decide the board floor ONCE, land it signed, then prune the fleet. This is the drift-guard's job, not a manual merge treadmill.
6. **[NOW] Rename banned-string branches before any public reference.** `feat/part-cj-sovereign-route-kill`, `feat/dorado-evidence-verify` carry `sovereign`/`dorado` — brand-gate will (correctly) block them; rename + re-verify before deploy.
7. **[BUILD] Surface the 3 LIVE-GAP gems** the honest way: convert the ~22 clean AEO `aeo-*.json` pages → `blog-content.ts` entries (0 banned-string hits, verified), review+merge the methodology paper PR, and verify-then-ship the containment index (5 incidents — **verify each primary source first**, dates are beyond the auditor's cutoff).
8. **[OWNER] Unblock the paid half** — settle the signing-key custody decision (gate #1) and send the counsel brief (gate #2). Nothing measured-on-a-named-subject ships until these clear; everything above is doctrine-safe without them.
