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
- **MCP catalogue:** JEEVES's GitHub retagging separated utility MCPs from CSOAI-governance branding — frontend's "377 tools / 300+ MCP" copy is verified against the live `/api/tools` count by the harness, so retagging GitHub topics doesn't affect the claim.

## Blocked on Nick (consolidated — neither agent can do these)
1. **Phase 3 deploy** — JEEVES's runbook + signing key ready; needs Nick to run.
2. **Outreach send** — lead list clean; sending is Nick's action.
3. **`npm publish`** — ✅ DONE: `csoai-governance-mcp@0.1.0` live on npm (`npx csoai-governance-mcp`).
4. **`app.csoai.org` split** for `csoai-dashboard` — Vercel/DNS.
5. **`main` branch archival** decision.
6. **ACLED / FIRMS keys** for the two dark Watchdog feeds.

## The rule that governs both of us
**Nothing ships to a demo that isn't `claims-e2e` 12/0 green and register-✅ sourced.** One shot per account. Truth is the product.
