# CLAUDE.md — CSOAI / councilof-ai agent coordination

Shared working agreement for ALL agents on this repo. Read this first.

## Deployed truth (verified 2026-08-26 — supersedes 2026-07-22)
- THIS repo CSOAI-ORG/councilof-ai -> **Cloudflare Pages project `councilof-ai`** -> live at
  **https://councilof.ai**. Vercel is DEAD (402 on every csoai host) — ignore any Vercel reference below.
- Build from `client/` (Vite + React + wouter + Tailwind). Root `src/` is DEAD — ignore it.
- **Deploy pipeline (all four steps, in order):**
  `npm run build:client` → `bash scripts/prerender-run.sh --dist dist/client --wait 900 --min 350`
  → `node scripts/brand-gate.mjs dist/client` + `node scripts/signed-json-guard.mjs dist/client`
  → push to master (GHA `deploy.yml` ships it; it also runs on a 3h cron).
- **Never** `npx vite build` bare — it picks up the dead root `src/` and fails.
- **Prerender is lane-safe — never kill browsers or ports machine-wide.** `bash scripts/prerender-run.sh
  --dist dist/client --wait 900 --min 350` takes a free OS-assigned port and closes its own browser and
  server on every exit path. `pkill -f chrome-headless-shell` and a hardcoded `lsof -tiTCP:4400 | xargs kill -9`
  kill OTHER lanes' runs (2026-08-26: a concurrent lane died at 143 of 582 routes, 439 "Target page,
  context or browser has been closed"). Pass `--port N` only when you need a fixed port; it then fails
  loudly if N is taken rather than drifting onto someone else's.

## Standing doctrine (binding — the gates enforce it)
- We **measure**; we never "certify". No conformity marks. The Academy issues completion records.
- **UNMEASURED is first-class** — never claim MEASURED before it is measured, and never invent a number.
- No public $ prices. Verification is free forever; a grade is never sold.
- Banned public strings are enforced by `scripts/brand-gate.mjs` (incl. internal codenames).
- Board card index is **frozen at the verifiable floor of 150** — see `BOARD-RULING.md`.

## How we work (see council-os/PLAYBOOK.md for the evidence)
- **One lane = one writer = one branch/worktree.** Never a shared checkout. Claim in council-os/LANES.md.
- **A push rejection means pull-and-reconcile — never counter-revert.** Counter-push wars cost this repo
  19+ waves and 898 commits in a day and shipped no product.
- Land work in **one gated merge**, not a stream of `fix:` commits.
- **Bytes adjudicate.** Verify the underlying bytes, not the structure or the commit message.

## The OS ('OpenGridWorks OS')
- Home: client/src/pages/OsLauncher.tsx -> route /os. 18 app tiles + hero 'Get certified' CTA + live Sovereign Town heartbeat + Layer 0 readiness ring.
- Header: client/src/components/Header.tsx has the front-door link 'Open OS' -> /os (desktop + mobile).
- Tile routes (all exist): /sovereign-town /command-center /mcp-fleet /layer0 /global-regulations /readiness-assessment /crosswalks /oscal /evidence /models /framework-catalog /policy-generator /risk-heatmap /webhooks /certification /pricing + /globe.html /globe3d.html

## Recent PRs (all merged to master + LIVE)
- #18 OS front-door 'Open OS' CTA in Header
- #19 Four governance flagship tiles (Layer 0 Protocol, Regulation Atlas, Readiness Check, Framework Crosswalks)
- #20 Hero 'Get certified' CTA + Get Certified / Pricing tiles

## RELIABLE editing of the GitHub web editor (CodeMirror 6) — IMPORTANT
Clipboard + cmd+v paste is UNRELIABLE in the browser-automation env. Do NOT rely on it. Instead drive CM6 directly:
1. Find the EditorView: scan DOM (.cm-editor/.cm-content/.cm-line) for a property node[k].view where v.state.doc and v.dispatch exist. On GitHub it is the .cm-line node's cmTile.view.
2. Replace whole doc: view.dispatch({changes:{from:0, to:view.state.doc.length, insert:NEWCONTENT}})
3. Trip GitHub's dirty-detector so 'Commit changes' enables: document.querySelector('.cm-content').dispatchEvent(new InputEvent('input',{bubbles:true}))
4. VERIFY view.state.doc.toString() === NEWCONTENT before committing. Then Commit -> new branch -> PR -> wait Vercel checks green -> Merge.
Note: screenshot scale vs CSS coords drifts (1139 vs 1027 wide) — compute click coords from window.innerWidth, or read element rects live.

## Guardrails
- GitHub MCP token is DEAD ('Bad credentials'). Edit via the authenticated browser only (or a fresh PAT if the owner provides one — that makes edits instant via the API).
- Never break/redirect the static csoai.org revenue apex without explicit owner OK.
- client/ changes: branch -> PR -> build-verify (Vercel csoai-v2-app green) -> merge. api-server/ and packages/ are inert (no deploy wired) — safe to commit direct.
- VITE_API_BASE switches the front-end tools from demo to live backend. api-server/ must be deployed to the GCP VM (OWNER action) to light up /api/mcp (216 servers), real evidence, webhooks and the A2A gateway.

## Division of work — CLAIM a lane before editing (avoid collisions)
- [ ] Static csoai.org -> OS bridge (link the revenue site into /os and vice-versa)
- [ ] app.csoai.org front-door parity (same Open-OS entry on the emerald OS)
- [ ] Deploy api-server/ to the GCP VM (owner) to go fully live
- [ ] Reconcile Layer 0 canon across csoai-dashboard vs councilof-ai

_Last updated by: cloud Claude (cowork) 2026-06-25 — after shipping PRs #18/#19/#20._
