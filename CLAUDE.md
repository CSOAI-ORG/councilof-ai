# CLAUDE.md — CSOAI / councilof-ai agent coordination

Shared working agreement for ALL Claude agents on this repo (cloud + M4 local). Read this first; update the work-claim list when you take or finish a lane.

## Deployed truth (verified 2026-06-25)
- THIS repo CSOAI-ORG/councilof-ai -> Vercel project **csoai-v2-app** -> live at https://csoai-v2-app.vercel.app and councilof.ai. App builds from client/ (Vite + React + wouter + Tailwind). Root src/ is DEAD — ignore it.
- app.csoai.org = the emerald OS from a SEPARATE repo (csoai-dashboard / csoai-v2-master).
- csoai.org apex = the STATIC 'Layer 0' marketing + Stripe site (separate static-deploy project). This is LIVE REVENUE. Do NOT repoint or break it without explicit owner confirmation.

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
