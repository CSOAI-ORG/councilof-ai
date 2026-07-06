# CSOAI — Master Alignment & Rundown

> Single source of truth for every CSOAI surface and agent — the **M4 / Claude Science**, Claude Code, and any other machine or agent working on CSOAI. Read this first. Last aligned: 2026-07-06 (HEAD `master`).

---

## ⚠️ BRANCH TRUTH — READ BEFORE YOU PULL OR PUBLISH

**The live site deploys from `master`, NOT `main`.** These two branches have diverged hard:

| Branch | What it is | Live? |
|---|---|---|
| **`master`** | **The production lane** — the full Vite SPA that IS `csoai.org` / `os.csoai.org`. Has ALIGNMENT.md, the CSOAI Governance MCP, SovereignSpot, the full globe, `/workbench`. **465 commits ahead** of the merge base. | ✅ **YES — this is what's live** |
| **`main`** | GitHub's *default* branch, a separate lane (Hermes + a new Next.js `src/app/` App Router experiment, #128). Missing ALIGNMENT.md, the MCP, SovereignSpot. **23 commits** main-only. | ❌ not the live app |

**So on the M4 / any machine, do NOT `git checkout main`.** Use:
```bash
git clone https://github.com/CSOAI-ORG/councilof-ai.git
cd councilof-ai && git checkout master && git pull origin master   # the live lane
```

**npm publish 404 fix:** `npm publish` at the repo root tries to push `csoai-platform` (the whole app, not a real package → 404). The MCP is a *sub-package* — publish from its folder:
```bash
cd mcp/csoai-governance && npm publish        # publishes csoai-governance-mcp
```

**Consolidation (task #60 — DONE `faf04cb`):** audited `main` and surgically ported its additive, framework-safe content into `master`: **`public/legacy/**` = the entire original csoai.org (311 pages), now live at `csoai.org/legacy/*`**, plus `public/.well-known/{security.txt,agent-card.json}` and the seals/handoff docs. **Intentionally NOT merged:** `main`'s Next.js `src/app/**` lane + `csoai-*` experimental client files (architecture clash with the live Vite app / superseded by the live lane).

**Still open (Nick):** GitHub's *default* branch is still `main`; production is `master`. Flip the GitHub default to `master` when ready so agents pull the live lane by default. Until then, **`master` is canonical.**

---

## 0. TL;DR — current live reality

| Thing | State |
|---|---|
| **Primary site** | `https://csoai.org` → 308 → `https://www.csoai.org` → **the full app** |
| **The OS** | `https://os.csoai.org` |
| **Repo** | `github.com/CSOAI-ORG/councilof-ai` (branch `master`) — **push = auto-deploy** |
| **Vercel project** | `csoai-v2-app` (framework: vite, build `npm run build:client` → `dist/client`) |
| **Live brain (Sovereign)** | `https://os.meok.ai/api` — **377 governed tools**, no key for the public surface |
| **Health** | 280/280 routes live, **0 console errors**, brain-connected on every page |
| **SEO** | canonical/OG on csoai.org, per-route self-canonical, sitemap (280 URLs), robots (+AI bots), og-image, Organization/WebSite JSON-LD |

Everything below is **live and verified** unless marked ⚠️ (needs a human) or 🧪 (modelled, not live data).

---

## 1. Domains & DNS (Namecheap → Vercel)

- DNS host: **Namecheap** (`dns1/dns2.registrar-servers.com`).
- `csoai.org` apex → `A @ 76.76.21.21` (Vercel) → **308 redirect → www**.
- `www.csoai.org` → `CNAME → cname.vercel-dns.com` → serves the app.
- `os.csoai.org` → `CNAME os → cname.vercel-dns.com` → serves the app.
- `app.csoai.org` → `CNAME → cname.vercel-dns.com` (pre-existing).
- All three domains are assigned to the **`csoai-v2-app`** Vercel project. The old static `csoai-org` project no longer owns the apex (safe to delete later).
- Vercel's "DNS Change Recommended" (new IP `216.150.1.1`) is **optional** — the current records work (Vercel confirmed).
- ⚠️ **Never change DNS or move a domain without confirming with Nick.** A domain move needs a fresh production deploy afterward to re-alias all domains uniformly (otherwise deep routes 404).

---

## 2. Architecture

```
 Namecheap DNS ── cname.vercel-dns.com ──> Vercel (csoai-v2-app)
        │                                        │  git push master → build → deploy → alias all domains
 csoai.org / www / os                      dist/client (Vite SPA + /public statics: globe3d.html, og-image, sitemap…)
        │
 Browser SPA (wouter, 305 routes) ──fetch──> os.meok.ai/api  (the live Sovereign brain)
        │                                        ├─ /chat    (guarded via lib/sovAsk → askSovereign)
        │                                        ├─ /tools   (377 governed MCP catalog)
        │                                        ├─ /health  (CORS-open)   ⚠️ /status is NOT CORS-open cross-origin
        │                                        └─ /sign,/verify (Ed25519 Layer-0)
```

- **SPA fallback**: `vercel.json` rewrites every non-file path → `/index.html`. Deep routes serve 200 on the deployment.
- **publicDir is `../public`** (repo-root `./public`), NOT `client/public`. Static files (globe3d.html, sitemap.xml, robots.txt, og-image.png, manifest.json, csoai-icon.svg) **must live in `./public`** or they won't deploy. (This bit us once — the old sitemap/robots sat unused in `client/public`.)

---

## 3. The Sovereign persona guard — CRITICAL, do not regress

The live brain (`/chat`) will sometimes answer as a poetic **"companion/traveller"** persona or refuse. Every chat surface **must** go through `client/src/lib/sovAsk.ts` → `askSovereign()`, which (a) frames the CSOAI governance/cyber role and (b) rejects companion-bleed/refusals → clean fallback.

- Guarded surfaces: `DemoOS`, `FrameworkHive`, `GlobalSearch`, `WorldGlobe`, `SovereignDock`, `SovereignSpot`, and (inline-guarded) `SovSpace`, `PocShowcase`, `CyberScan`, `OsLauncher`, `WatchdogMap`, `RegulatorAtlas`, `TryCouncil`, `GovGraph`.
- **Any new `/chat` caller MUST use `askSovereign` (or the inline reject regex).** Never call `/chat` raw.
- BAD-pattern regex lives in `sovAsk.ts`; widen it there if new bleed appears.

---

## 4. What's live (built this session)

**Globe (`public/globe3d.html`, CesiumJS)** — real NASA/Esri satellite Earth (fixed the "black globe"); basemap picker (NASA satellite / Blue Marble / Night lights / Lite); layers: frameworks, regulators, governments, Fortune 100/500, cyber/CNI, AI compute, AI labs & safety, autonomous systems, humanoids, MCP fleet (live /api/tools), Sovereign network, **space & satellites (+ live ISS)**, **AI-critical energy**, **internet backbone**, **live aircraft (OpenSky)**, **industries→AI**, ontology, cross-region mesh; rail chips + legend + "light it up"; **Sovereign Hive loop badge** (Scrape→Learn→Train→Simulate→Evolve); driven by `postMessage` (flyTo, layer, spin, basemap, bftSpiral, rainbowStack, lightup, clearViz).

**OS / app** — `/os` app-store (categorised, searchable, collapsible), white hamburger drawer (⌘K) + bottom nav + resizable dockable tool windows, movable/collapsible chat dock; **`/workbench` (+`/sov3`)** = the AI OS as a governance workbench on SOV3 (skill palette → signed, reproducible, council-reviewed artifacts).

**SovereignSpot** (`client/src/components/SovereignSpot.tsx`) — reusable "embedded live globe + topic-scoped guarded Ask" band, on ~31 routes (why, competitors, all jurisdiction/state/sector/competitor-alt templates, EU/NIST/ISO/TC260 guides, ai-governance, high-risk, act-summary, penalties, gpai, faq, conformity, nist-vs, iso-vs).

**Trust wall** (`TrustMarquee` + `data/trustWall.ts`) — scrolling "aligned to frameworks / built on open source / verifiable" strip; honest relationship labels, links to official sources, Simple-Icons SVGs w/ emoji fallback; live credibility chips from the brain.

**SEO/AEO** — canonical/OG → csoai.org, per-route self-canonical script, `og-image.png` (branded 1200×630), Organization + WebSite JSON-LD, `sitemap.xml` (280 URLs), `robots.txt` (+GPTBot/PerplexityBot/ClaudeBot/Google-Extended).

---

## 5. The CSOAI Governance MCP — how M4 / any agent plugs into CSOAI

Path: **`mcp/csoai-governance/`** (in this repo). A stdio MCP server exposing the Sovereign governance layer to **any** MCP client (Claude Science, Claude Code, Cursor…). Tools:

| Tool | Does |
|---|---|
| `csoai_sign` | Ed25519-seal any artifact to CSOAI Layer 0 → `SOV:` fingerprint + signature + publicKey |
| `csoai_verify` | verify a seal offline |
| `csoai_govern` | role-locked AI-governance/cyber Q&A (EU AI Act, NIST, ISO 42001, NIS2, DORA) |
| `csoai_catalog` | search the live 377 governed tools |

**Install (M4 / any machine):**
```bash
git clone https://github.com/CSOAI-ORG/councilof-ai.git
cd councilof-ai/mcp/csoai-governance && npm install
claude mcp add csoai-governance -- node "$(pwd)/index.mjs"
```
No API key needed; override backend with `CSOAI_GATEWAY` (default `https://os.meok.ai/api`). Smoke-tested end-to-end (real Ed25519 seal + live 377 catalog).

**The strategic frame:** CSOAI does NOT compete with Claude Science — it is the **governance floor under** it. A science/code agent calls `csoai_sign` on its outputs → they become auditable, reproducible, council-governed. That's the wedge.

---

## 6. Build / verify workflow (for any coding agent on this repo)

- **Validate a file fast:** `./node_modules/.bin/esbuild <file> --jsx=automatic --loader:.tsx=tsx --bundle=false --outfile=/dev/null` (Vite's transformer; `vite build` does NOT tsc-gate).
- **Static globe HTML:** `node vm.Script` syntax-check each inline `<script>` in `globe3d.html`.
- **Full build:** `npm run build:client` (~6–15s; can be minutes under machine load — Vercel's clean build is authoritative).
- **Always confirm deploy `state: READY`** via Vercel before claiming live; the one real build break in history correctly showed `ERROR`.
- **E2E:** headless Playwright (installed) against the live domain or a local `vite preview`. Latest: **280/280 routes ALL CLEAN, 0 console errors.**
- **Gotcha:** macOS FS is case-insensitive — match the git-tracked filename case exactly (a `WhyCsoai` vs `WhyCSOAI` import once broke the Linux build).

---

## 7. Honesty register (do not fabricate — say what's real)

- 🧪 Globe data layers (space/energy/cables/industries/labs/etc.) are **curated real-world reference datasets** (accurate locations, governance-framed), **not** live-streamed — EXCEPT the **live** ones: ISS (wheretheiss.at), aircraft (OpenSky), MCP fleet + credibility chips (os.meok.ai).
- The **Hive-loop badge** is a status animation of the governance loop, not a live data ticker.
- **377** = the live governed-tool catalog count (`/api/tools`). The 33-agent BFT council is the spec; care-floor 0.95.
- Ed25519 seals are **real** (live brain); when unreachable the workbench/MCP return an **honest** SHA-256 content hash or explicit error — never a fake seal.
- Regulator/government logos are **wordmarks/emblems, labelled by real relationship** (align/body/built/standard/maps) — **never "partners"**, no endorsement/API-partnership implied (false-affiliation/trademark safe).
- Keep internal ops OUT of the public bundle (VM IPs, ports, tunnels, agent-card private keys). No secrets in the repo.

---

## 8. Open items (⚠️ need a human — mostly Nick's accounts)

1. **Publish the MCP to npm** — `cd mcp/csoai-governance && npm login && npm publish` (publishConfig already public → global `npx csoai-governance-mcp`). *Owner-only (npm token).*
2. **Marketplace listing** — add `csoai-governance-mcp` to the backend registry/sync repo that generates the live 377 catalog (that registry is on the brain side, not this repo — point an agent at it).
3. **ACLED + FIRMS keys** — set `VITE_ACLED_KEY` + `VITE_ACLED_EMAIL` + `VITE_FIRMS_MAP_KEY` to light the two dark Watchdog feeds (`lib/liveFeeds.ts` scaffold is ready).
4. **Older SaaS tools → `/os`** — provide the repo/URL list to import into the launcher grid.
5. Optional: `/api/status` isn't CORS-open cross-origin (trust chips already use `/health` instead); enable ACAO for `csoai.org`/`os.csoai.org` on the brain if you want that stat live.
6. Optional cleanup: delete the orphaned `csoai-org` static Vercel project.

---

## 9. Key files

| Path | What |
|---|---|
| `client/src/lib/sovAsk.ts` | the Sovereign guard — every chat goes through here |
| `client/src/components/SovereignSpot.tsx` | reusable globe+Ask band |
| `client/src/components/TrustMarquee.tsx` + `data/trustWall.ts` | trust wall + live chips |
| `client/src/pages/Workbench.tsx` | `/workbench` governance workbench on SOV3 |
| `client/src/pages/DemoOS.tsx` | the immersive OS/tour |
| `public/globe3d.html` | the CesiumJS governance globe (all layers) |
| `public/sitemap.xml` · `public/robots.txt` · `public/og-image.png` | SEO |
| `client/index.html` | head: canonical/OG/JSON-LD/self-canonical |
| `mcp/csoai-governance/` | the distribution MCP |
| `vercel.json` | build + SPA rewrites |

---

*Every commit this session is esbuild/syntax-clean, full-build-green, and headless-verified. The whole thing is live on `csoai.org`, in sync on GitHub, and brain-connected. Align to this doc.*
