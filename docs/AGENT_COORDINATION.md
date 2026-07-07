# CSOAI — Multi-Agent Coordination

> Two Claude agents build CSOAI in parallel on the **same `master` branch**. This doc keeps us from colliding and makes us compound. Read it before a work session. Pairs with `ALIGNMENT.md` (what's live) and `DEMO_READINESS.md` (is it true).

## Who's who
| Agent | Git author | Owns |
|---|---|---|
| **Claude Science / JEEVES (M4)** | `Nicholas Templeman` | Revenue plumbing (Paddle checkout + Ed25519 cert webhook), **auth + entitlement**, **`/assess`** product-proof + the COBOL/legacy-bridge wedge (SCADA/DLMS/MQTT/Oracle/SAP/EDI/GS1/SIP/FIX/ISO8583), the **240-lead DB** (`sovereign-charters` repo), GitHub-org repo hygiene (topic retagging), deploy runbook + signing key, **outreach**. |
| **Frontend / OS (this agent)** | `Nick Templeman` (Co-Authored-By Claude Opus) | The live **Vite SPA** on `master` → csoai.org: OS, globe, working tools (ToolRunner/`/classifier`/`/report`/`/workbench`), the **framework ground-truth register**, the **claims-e2e harness + CI**, **DEMO_READINESS**, enterprise trust/contrast/OG, `ecosystem.json` + `/intel`, coordination docs. |

## Git protocol on shared `master` (both agents land here)
1. **`git pull --rebase origin master` before every push.** We've been doing this; keep it up.
2. **Small, atomic commits** — easy to rebase around each other. No giant multi-feature commits.
3. **Never force-push `master`.** Ever.
4. **Stay in your lane by file.** JEEVES owns `auth*`, `payments*`, `AssessTool*`, `sovereign-charters`; frontend owns `App.tsx` routing, OS/globe/tools pages, `docs/*TRUTH*`, `scripts/claims-e2e.mjs`. Touching the other's files → leave a note in the commit body.
5. **After any deploy, run `node scripts/claims-e2e.mjs`** → must be **12/0** before it's "done". This is the shared truth gate; it's in CI too.
6. If a build-config change is needed (vite/vercel), **verify a live render before trusting it** (a React-chunk misconfig blanked prod once — caught by the harness).

## Branch truth
- **`master` = live canonical** (both agents land here → csoai.org).
- **`main` = archived Next.js experiment** (#128, ~23 commits). **Do not merge into master.** Archival is a one-time human call, not a batch action.

## Integration points (where our work meets)
- **Leads:** JEEVES owns `csoai_leads_domain_fixed.db` (240 real orgs, domains verified). Frontend's `ecosystem.json` / `/intel` is **regulators-only + honest placeholders** for the *public* site — **named enterprise leads stay in JEEVES's internal DB, never published on csoai.org** (privacy/positioning). If we want the globe to show real enterprise pins, JEEVES exports an anonymised/aggregate feed; frontend consumes it.
- **Product surfaces:** JEEVES's `/assess`, `/pricing` (Paddle), `/login` (auth) must be **discoverable** in the frontend nav/funnel — frontend surfaces them (done: `/assess` added to nav).
- **Truth:** the ground-truth register + claims harness are **shared** — JEEVES runs `claims-e2e.mjs` before any outreach demo; the quarterly re-pass scheduled task keeps facts fresh for both.
- **MCP catalogue:** JEEVES's GitHub retagging separated utility MCPs from CSOAI-governance branding — frontend's "378 tools / 300+ MCP" copy is verified against the live `/api/tools` count by the harness, so retagging GitHub topics doesn't affect the claim.

## Blocked on Nick (consolidated — neither agent can do these)
1. **Phase 3 deploy** — JEEVES's runbook + signing key ready; needs Nick to run.
2. **Outreach send** — lead list clean; sending is Nick's action.
3. **`npm publish`** — ✅ DONE: `csoai-governance-mcp@0.1.0` live on npm (`npx csoai-governance-mcp`).
4. **`app.csoai.org` split** for `csoai-dashboard` — Vercel/DNS.
5. **`main` branch archival** decision.
6. **ACLED / FIRMS keys** for the two dark Watchdog feeds.

## The rule that governs both of us
**Nothing ships to a demo that isn't `claims-e2e` 12/0 green and register-✅ sourced.** One shot per account. Truth is the product.

## Session log — 2026-07-07
- **MCP distribution: DONE.** `csoai-governance-mcp@0.1.0` published to npm, installs via `npx`, and **self-lists in the live catalog** (verified `/api/tools total=378`). On-site funnel added: `/tool-commons` now shows a headline one-command install block (`claude mcp add csoai-governance -- npx -y csoai-governance-mcp`). Package README/`0.1.1` teed up for a README refresh on next publish (Nick's token step).
- **Catalog 377 → 378** (governance MCP added). Tool-count claims reconciled repo-wide: dynamic surfaces show the **live** count, static copy uses **"370+"** (drift-proof), tests use a **`>=377` floor**. `claims-e2e.mjs` previously asserted `=== 377` and would have false-failed — now fixed.
- **⚠️ Parallel-edit near-miss:** M4 (`3cb779f`) and frontend (`126703b`) independently fixed the 377 hardcoding, hitting the *same 4 files* → rebase conflict. Resolved cleanly by taking M4's base (better test guard) + layering frontend's 14 non-overlapping copy/MCP files. **Lesson: before a repo-wide sweep, drop a one-line note here naming the files you're about to touch.**
- Live-verified after every push: build clean ×3, 17/17 routes 200, claims **12/0**, sitemap 291 URLs.
- **npm token exposed in plaintext during publish — Nick to revoke** (npmjs.com → Access Tokens).
- **hive-recon coverage: 27 → 1,952 accounts** (`94d4772`→`8d543cd`, Claude Science). Sourced 1,913
  company rows from SEC EDGAR's free public API (real ticker/CIK/SIC per row), merged with
  ecosystem.ts's 39 accounts (23 regulators + 16 real named orgs incl. the F100 seed from
  `4364ca2`). All gates pass; every non-authority company row correctly stays
  `confidence:"modeled"` (no fabricated posture/vendor). Current export:
  `docs/handoff/hive_full_export_1952.json`
  (`HIVE_ACCOUNTS=docs/handoff/hive_full_export_1952.json node scripts/hive-recon.mjs`).
- **⚠️ Second near-miss, now fixed:** `faad379` (globe overlay) and `4364ca2` (F100 seed) each ran
  `hive-recon.mjs` at its *default* path while wiring an unrelated feature, silently overwriting
  `docs/hive-recon-report.json` down to 27, then 39 — undoing the outreach-gate coverage twice.
  **Fixed in `8d543cd`:** the script now refuses to write a report with fewer accounts than the
  one already on disk (needs `FORCE=1` to intentionally shrink). **If your change touches
  `ecosystem.ts` or any other input `hive-recon.mjs` reads, re-run it against the full export
  afterward** (`HIVE_ACCOUNTS=docs/handoff/hive_full_export_1952.json`), not the bare
  `npm run hive:recon` default — the guard will now stop you if you forget, but merging the new
  rows into the full export (like this reconciliation did) is still a manual step.
  Remaining gap to the outreach gate: per-account recon (public web) to replace "modeled" with
  cited real facts, company by company — not done by any of this, coverage-count only.
