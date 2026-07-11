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

**2026-07-08 update (API-layer only, re-verified by Claude Science):** `/api/tools total=378`
still holds; Ed25519 sign returns a genuine 128-char signature (`alg=ed25519`); brain health OK
(`sovereign-backend`); dynamic OG image 200. Playwright's local Chromium binary is still not
runnable in this sandbox (`ms-playwright` cache directory itself is permission-blocked here, a step
past the earlier "download blocked" finding — this looks like a sandbox-specific restriction, not
something fixable by retrying the install). As a **weaker substitute**, HTTP-checked the 6
browser-level demo pages for basic reachability only: `/tool-commons`, `/classifier`, `/report`,
`/workbench`, `/try`, `/globe3d.html` all return 200. **This does NOT confirm the interactive
content on those pages actually renders or functions** (ToolRunner execution, classifier output,
council visualization, globe canvas) — a 200 only proves the route resolves, not that the claim on
that page is true. Treat the 6 browser-level claims as still last-verified under the 2026-07 run
above; for a real re-check, run `scripts/e2e-visual-live.mjs` from a machine where Playwright's
browser can actually install (i.e. not this sandbox).

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


## 2026-07-11 — Monday whole-site demo readiness (Claude Science)

Nick asked for full whole-site readiness ahead of Monday. Ran BOTH shared CI harnesses fresh
(triggered `workflow_dispatch` manually, not relying on a stale scheduled run), on GitHub's hosted
runners (this sandbox's local Chromium install remains blocked — see note above, unrelated to the
site):

- **`claims-e2e.yml`** (run 29111890641, 2026-07-10 17:41 UTC): **`RESULT: 12 pass · 0 FAIL`**.
  All 12 headline claims genuinely verified, including the browser-rendered ones (ToolRunner output,
  classifier tier, workbench seal, 33-agent council viz, live Cesium globe) -- not just HTTP 200s.
- **`sov-stack-e2e.yml`** (run 29137955971, 2026-07-11 03:29 UTC): **`Sov stack E2E: 37/37 passed`**.
  Covers the newer agentic-globe suite: 2D/3D globe rendering, /intel|/simulate|/brief drive chains,
  sector pages (/defence-ai-act, /energy-ai-act, /pharma-ai-act), competitor pages (/vs/vanta), and
  postMessage-spy-verified behavior (click -> flyTo, threat -> flyTo+neutralize, convene ->
  flyTo+bftSpiral).

Also independently re-ran the API-layer claims by hand (tools catalog=378, live MCP tools/list=5,
`meok_govern` real framework lookup, Ed25519 sign+verify full round trip incl. tamper-rejection,
dynamic OG image) -- all matched the harness's results exactly, cross-confirming the harness itself
isn't just green by coincidence.

Spot-checked all key demo routes live: `/`, `/pricing`, `/assess`, `/globe`, `/intel`, `/poc`,
`/tool-commons`, `/classifier`, `/report`, `/workbench`, `/try` -- all 200.

`FRAMEWORK_GROUND_TRUTH.md` last full pass: 2026-07 (this month) -- all listed frameworks ✅,
EU AI Act dates correctly reflect the May-2026 Digital Omnibus delay (Art. 50 @ 2 Aug 2026, not the
original date). MCP one-liner (`npx csoai-governance-mcp`) confirmed still live at `0.1.0`.

**Verdict: green. Both CI truth gates pass fresh, right now, on the actual deployed commit
(`19bda30`) -- not a cached/stale result.** Nothing outstanding blocks a Monday demo from a
technical-correctness standpoint. Remaining items are business decisions already logged under
"Blocked on Nick" (Phase 3 deploy trigger, outreach send, app.csoai.org DNS split, main-branch
archival, ACLED/FIRMS keys) -- none of them block showing the live product.
