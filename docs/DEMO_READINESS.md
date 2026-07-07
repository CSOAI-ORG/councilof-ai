# CSOAI Demo-Readiness — verify before you demo

> **One shot rule.** We only get one demo with most governments, regulators and Fortune 500s. Before *any* live demo or account test, run the claims-verification harness and confirm **0 FAIL**. If anything fails, fix it before you go. Every claim on the site must be functionally true — no bluffs. Shared with Claude Science / the M4 so we all run the identical check.

## Run it
```bash
cd councilof-ai && npm install   # first time (needs playwright)
node scripts/claims-e2e.mjs      # hits the LIVE site + brain, prints a pass/FAIL matrix
# override target: SITE=https://staging... node scripts/claims-e2e.mjs
```

## What it proves (each = a claim we make on the site)
| Claim on the platform | Test | Must be true |
|---|---|---|
| "377+ governed MCP tools" | `/api/tools` total | at least 377 (catalog grows as new MCPs register — e.g. csoai-governance-mcp took it to 378 on 2026-07-07); update copy's number periodically, don't demo a stale exact figure |
| "live tools execute" | `/api/mcp tools/list` + `tools/call` | ≥5 tools run server-side, real output |
| "governed answers" | `meok_govern` | returns real frameworks, not jargon |
| **"Ed25519 · Layer 0 signing"** | `/api/sign` | returns a **real signature + publicKey** (not empty) |
| "run a live tool" | ToolRunner on `/tool-commons` | renders real governed output |
| "classify your AI" | `/classifier` | returns a risk tier |
| **"sealed to Layer 0"** | `/report` submit | receipt shows a **real signature/fingerprint** |
| "signed artifacts" | `/workbench` run+seal | produces a sealed artifact |
| "33-agent council" | `/try` | BFT council visualization renders |
| "live globe" | `/globe3d.html` | Cesium canvas renders |
| dynamic social cards | `/api/og` | returns image/png |

## Latest result
**2026-07 · 12 pass · 0 FAIL** — all headline claims verified functionally true on the live site + brain (Ed25519 signature len=128 alg=ed25519; `/api/tools` total=377; ToolRunner/classifier/report/workbench all execute; globe renders).

**2026-07-07 update (API-layer only, re-verified by Claude Science):** `/api/tools` total is now **378** (csoai-governance-mcp registered + deployed) — still a genuine pass under the "377+" rule above. Re-ran the 6 API-level checks (tools count, live MCP tools/list, meok_govern, Ed25519 sign+verify round-trip, brain health, dynamic OG) — all 6 pass. Did NOT re-run the 6 browser-level checks (ToolRunner/classifier/report/workbench/council-viz/globe) this pass — Playwright's Chromium binary could not be downloaded in this sandbox; treat those 6 as last-verified under the 2026-07 run above, not re-confirmed today.

## Pre-demo checklist (per account)
1. `node scripts/claims-e2e.mjs` → **0 FAIL** (block the demo otherwise).
2. Open the account's tailored path (`/crosswalk`, `/dora`, `/classifier`…) and dry-run the exact flow you'll show.
3. Confirm the account's frameworks are all ✅ in `FRAMEWORK_GROUND_TRUTH.md` (don't state an unverified date live).
4. Have the MCP one-liner ready (`npx csoai-governance-mcp`) for the "how easy to connect" moment.
5. If something breaks in the demo — fix it live (the Hive fix-in-demo loop) and re-run the harness after.

## Honesty guardrails (so a claim never overstates)
- The catalogue is **377 connectable** MCP packages; **5 execute server-side** live. Say both accurately — don't imply all 377 run in our cloud.
- Seals are **real Ed25519** when the brain is reachable; the offline fallback is a **real SHA-256 content hash**, labelled as such — never presented as a signature.
- Regulatory dates: only state ✅ rows from the ground-truth register; flag anything else "indicative — verify".

*If it's not green here, it's not ready to show. Green here = we can walk into any room and it works.*
