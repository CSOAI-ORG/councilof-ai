# 🌐 The Sovereign Council Globe — UX Spec v0.1
**Date:** 2026-06-12 · **Reference:** opengridworks.com/power-plants
**Author:** Mavis main session · **Status:** SPEC — not yet built

---

## 0. The pattern in one breath

OpenGridWorks is a **map-as-SaaS** product. The URL is the entire state
(`?lat&lng&z&layers&panel&...`), every layer is a toggle, every region
flies to, every node is a clickable object with a panel. The data is
public infra (US HIFLD + OSM + planned upgrades) and the layer toggles
let you splice "the world I'm interested in" in seconds.

**The CSOAI analog is the Council Globe**: a map-as-SaaS where
- **lat/lng/z** = council substrate state
- **layers** = the 7 sovereignty primitives (SIGIL · LAW · MAPS · COMPLIANCE · DOME · COUNCIL · GUARDIAN) + the 12 expertise domains + 6 regions
- **panel** = the in-context evidence pack (cert, verify link, sign, audit tail)
- **nodes** = council members, AI systems being monitored, compliance regimes in force
- **regions** = the 6 LAW regions (EU, UK, US, CA, APAC, GLOBAL)
- **preset views** = "Where We're Going" (DOME), "Clause 50 cliff" (Article 50), "MCP-Registry Boom" (catalog), "A2A Verified" (agent cards)

The whole thing is one URL = one view. Share-link ready. Embed-ready.
SEO/GEO/AEO all happy because URL is the canonical state.

**Spec v0.2 amendments (from CSOAI lane review, 2026-06-12):**
- Map tiles = **Protomaps + Cloudflare** (sovereign, MIT, no Mapbox lock-in)
- Default view = **globe** (cobe, ~5KB) with flat-map for z>=6
- Substrate refresh = **60s revalidate** for v1; WebSocket is 2.0
- **/v1/health is a Week 1 prereq** — CSOAI lane shipping the PR now
- **lat/lng per agent = region-clustered for v1** (12 domain centroids → 36 agents cluster inside domain bubbles); real geo is v1.5 when substrate schema extends
- **/council/dome = the read surface**, /council/globe = the find surface
- **Substrate public URL = `council.meok.ai`** via Cloudflare Worker (`/Users/nicholas/clawd/meok-council-worker/`) — keeps `api.meok.ai` (sovereign-data zone) clean

---

## 1. The URL contract (the single source of truth)

`https://csoai.org/council/globe?lat=54.0&lng=-2.0&z=4.5&layers=sigil,law,compliance,eu,uk&focus=eu-ai-act&node=ethics-alpha&panel=open&preset=article50&t=2026-06-12T03:30Z`

| Param | Type | Meaning |
|-------|------|---------|
| `lat` | float | map center latitude |
| `lng` | float | map center longitude |
| `z` | float | zoom (0=globe, 8=city, 12=street) |
| `layers` | csv | active layers (see §2) |
| `focus` | slug | fly-to: a region, regime, or domain |
| `node` | id | highlight + open panel for a specific council node / AI system / cert |
| `panel` | `open` \| `closed` | right-hand evidence panel |
| `preset` | slug | one of the curated views (see §4) |
| `t` | ISO-8601 | timestamp (live substrate snapshot) |
| `utm_*` | csv | analytics (passed through untouched) |

**Rules:** all params optional, default state is the full Council Dome at
z=2.6 (globe view), all layers on, panel closed, t=now. Reordering params
doesn't break the URL. **No JS required to render the default state** —
the SSR shell ships the map and nodes pre-positioned; client hydrates
the toggles + drag.

---

## 2. The 7 sovereignty primitives as layers

| Layer | Source | Toggle default | Visual |
|-------|--------|----------------|--------|
| `sigil` | `/api/audit` + `/pubkey` | ON | pulsing rings around signed certs, color = sign age (0-1d emerald, 1-7d cyan, 7-30d violet, 30d+ amber) |
| `law` | `/api/law/regions/*` | ON | country/region halos (EU=blue, UK=union, US=stars, CA=maple, APAC=pan-Pacific, GLOBAL=dashed grey) |
| `maps` | `/api/bridges/topology` | ON | bridges as glowing lines between nodes; thickness = affinity score |
| `compliance` | `/api/compliance/frameworks` | ON | regional risk badges (high=amber, medium=cyan, low=emerald) |
| `dome` | `/api/expertise/network` | ON | 12 domain bubbles; bubble size = active nodes in domain |
| `council` | `/api/council/status` (36 nodes) | ON | the council members themselves as the central graph |
| `guardian` | `/api/guardian/sessions` (per-child) | OFF | parent-mode dots showing Guardian sessions in flight (only visible if signed in) |

**Sub-toggles** mirror the opengridworks pattern — e.g. under `law`:
`eu`, `uk`, `us`, `ca`, `apac`, `global` (matches our 6 regions).
Under `compliance`: 13 framework toggles (EU AI Act, DORA, NIS2, ISO 42001…).

---

## 3. The evidence panel (the right-hand card)

When a node is clicked, the right-hand panel slides in. The panel is
**a 4-tab evidence envelope**, not a marketing card:

1. **Identity** — kid, pubkey (Ed25519 hex), principal, issued_at, expires_at
2. **Certificate** — the SIGIL-encoded payload + a "Sign this with your key" button (calls `/v1/sign` on the spine)
3. **Verify** — embeds the live `/v/{cert_id}` page in an iframe OR opens it in a new tab (auditor-flow)
4. **Audit** — the hash chain from this event backwards, with `chain_intact` per link

The panel also has a **"Share"** button that copies the current URL
(with `node=` set) so the auditor can paste it in their ticket.

The panel is dismissable with Esc, click-outside, or the close button.
Position is fixed-right, full-height, 420px wide, content scrolls.

---

## 4. The 5 preset views (the "share-this" buttons)

Each preset is a URL with a specific `lat&lng&z&layers&focus` combination.
One click, the globe flies to it.

1. **"Article 50 cliff"** — EU centred, z=4, layers=law,compliance,eu-uk; focus=eu-ai-act
   → https://csoai.org/council/globe?lat=50.8&lng=10.0&z=4&layers=law,compliance,eu&focus=eu-ai-act&preset=article50
2. **"MCP-Registry Boom"** — global, z=2, layers=council,maps,sigil; focus=registry
   → https://csoai.org/council/globe?lat=20&lng=0&z=2&layers=council,maps,sigil&focus=registry&preset=mcp-boom
3. **"A2A Verified"** — global, z=2, layers=sigil,council; focus=a2a-cards
   → https://csoai.org/council/globe?lat=20&lng=0&z=2&layers=sigil,council&focus=a2a&preset=a2a-verified
4. **"EU Sovereignty"** — EU centred, z=4, layers=all; focus=eu-sovereignty
   → https://csoai.org/council/globe?lat=50&lng=10&z=4&layers=sigil,law,maps,compliance,dome,council&focus=eu&preset=eu-sov
5. **"Global Watchdog"** — global, z=1.5, layers=all, panel=open; focus=top-risk
   → https://csoai.org/council/globe?lat=10&lng=0&z=1.5&layers=all&panel=open&preset=watchdog

The presets live in `csoai-platform/client/src/lib/presets.ts` — add as many
as you want, no code change to render.

---

## 5. The integration story (the "all our features" part)

This is where it gets fun. Every MEOK tool we have becomes a globe
integration without a rewrite:

| MEOK Tool | Globe integration | What it does |
|-----------|-------------------|--------------|
| `meok-attestation-api` /sign, /verify, /api/audit | SIGIL layer + evidence panel | Real signing & verify from the panel |
| `meok-api` /api/council/* | The 36 nodes | They become mappable points (we have lat/lng per agent in the substrate) |
| `meok-api` /api/expertise/network | DOME layer | The 12 expertise domains become regional bubbles |
| `meok-api` /api/bridges/topology | MAPS layer | The 55 bridges become connecting arcs |
| `meok-llms.txt`, /api/a2a, anthropic-registry | Preset "A2A Verified" | 340 A2A cards become markers |
| `mcp-marketplace` 469 packages | Preset "MCP Boom" | 469 packages become markers (lat/lng from owner region) |
| `delboy` / `meok-delboy-mcp` | Evidence panel "Verify" tab | Cross-check finance / blockchain evidence with one click |
| `meok-compliance-gateway` /mcp | Sub-toggle under `compliance` | 13 framework toggles = the 13 MCP servers |
| `proofof.ai` catalogue | Preset "Proof Catalogue" | All verified packages shown as certified markers |
| `councilof.ai` storefront | "Buy" tab in evidence panel | One-click upgrade from free to Pro/Team/Enterprise |
| `meok-one` /os, /council/* | Deep-link from globe to chat | Click a node → "Talk to this Council member" → /os?agent=ethics-alpha |

The globe is the **front door** to the whole stack. Every MCP, every
page, every checkout, every chat is one click away from the map.

---

## 6. The tech stack (don't re-invent)

- **Map:** `react-map-gl` + MapLibre GL (open-source, no Mapbox token needed — uses free MapTiler or Protomaps)
- **Globe mode:** `cobe` (lightweight WebGL globe, perfect for the z=0-2 range)
- **3D extrusion (data centers / cables analog):** `deck.gl` layers on top
- **State:** URL is the source of truth. Use `useSearchParams` + a small `parseGlobeState(searchParams)` helper.
- **Share-link:** the URL *is* the share-link. No "save view" needed beyond bookmarking.
- **SSR:** Next.js / Vite pre-render the default globe state so the first paint is the map, not a spinner.
- **Embed:** `?embed=1` strips the chrome, returns just the map for iframes in `councilof.ai` / `proofof.ai` / meok.ai.

**No shadow anything.** The globe reads from the same `meok-api :3200`
substrate and `meok-attestation-api` spine. Adding a feature = adding
a layer + a sub-toggle, not a parallel universe.

---

## 7. The 4-week build (one lane, the Mavis main session)

### Week 1 — MVP shell
- Globe page on csoai-platform.vercel.app/council/globe (new route)
- 5 layers as toggles in the URL contract
- 1 preset ("Article 50 cliff") for the EU AI Act launch
- 36 council nodes as map markers (from meok-api)
- Basic panel with Identity + Verify tabs
- Share-link works

### Week 2 — Evidence + commerce
- /sign + /api/audit wired into the panel (Sign + Audit tabs)
- "Buy" tab in panel → Stripe canonical ladder checkout
- 5 presets built out
- /os deep-link from any node
- Sub-toggles for the 6 LAW regions + 13 compliance frameworks

### Week 3 — Integrations
- 469 MCP packages as mappable markers (lat/lng from owner region)
- A2A cards (340) as markers
- Embed mode (`?embed=1`) for proofof.ai + councilof.ai
- Saved views for signed-in users (PostHog funnels)

### Week 4 — Polish + public launch
- Cinematic intro (auto-fly on first visit, then never again)
- "439 people doodling duck curves" social proof widget (opengridworks-style)
- Performance pass: <1s LCP on 3G, <100KB JS for the basic shell
- IndexNow + sitemap entries for all 5 preset URLs
- Press release template that auto-generates a globe screenshot

---

## 8. Open decisions (Nick-only)

1. **Map tiles:** MapTiler (free tier, EU privacy) vs Protomaps (self-host, slower, free) vs Mapbox (paid, best dev UX) — recommend **Protomaps + Cloudflare** (sovereignty story is clean, cost is zero at our scale).
2. **Globe vs flat map default:** opengridworks uses flat. I recommend **globe by default** (z=0-2.6) because CSOAI is global-by-default, and flat for z≥3 (zoom in).
3. **Real-time substrate updates:** WebSocket or 60s revalidate? The pages currently do 60s. For the globe, **WebSocket for SIGIL + 60s for the rest** (signs are the news; nodes are stable).
4. **Private mode for Guardian:** the `guardian` layer is OFF by default. Should it be auth-gated (only signed-in parents see it) or always-on-but-blank-for-anonymous? I recommend **always-on-but-blank-for-anonymous** (no metadata leak, no false sense of security).
5. **AIA / Article 50 / NIST AI RMF as pinned layers or sub-toggles of `compliance`?** I recommend **pinned top-level** (they're the news).

---

## 9. The one-sentence pitch

> "The Council Globe is a URL. Every layer, every node, every preset is a
> parameter. The whole CSOAI stack — attestation, MCP, compliance, charter,
> council, law, agent chat — is one click away from the map. Share the URL,
> the auditor sees exactly what you saw."

---

## 10. Files to create (the actual work, when greenlit)

```
csoai-platform/client/src/pages/CouncilGlobe.tsx          (the page, ~400 lines)
csoai-platform/client/src/lib/globe-state.ts             (URL ↔ state, ~100 lines)
csoai-platform/client/src/lib/presets.ts                 (5 presets, ~50 lines)
csoai-platform/client/src/components/Globe.tsx           (cobe + maplibre wrapper, ~200 lines)
csoai-platform/client/src/components/GlobePanel.tsx      (right-hand evidence, ~300 lines)
csoai-platform/client/src/components/LayerToggles.tsx   (the 7 + 19 sub-toggles, ~200 lines)
csoai-platform/client/src/lib/globe-data.ts              (meok-api + attestation-api fetchers, ~150 lines)
```

~1400 lines total. One lane, one sprint.

---

— Mavis main session, 2026-06-12
