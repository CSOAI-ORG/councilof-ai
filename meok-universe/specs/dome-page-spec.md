# /dome Page Spec — MEOK Universe Central Hub

**Goal:** Transform `/dome` from a static world-architecture explainer into the living central hub of MEOK Universe. It should unify the vision (`/universe`), real-world overlay (`/go`), pioneer signup (`/pioneer`), governance (`/council`), characters, gaming, and research under one world-shaped roof, while giving users a clear place to become pioneers.

**Status:** Draft spec — June 21, 2026  
**Owner:** Nicholas Templeman / MEOK AI LABS  
**Related docs:** `../MEOK_UNIVERSE_WHITEPAPER.md`, `../MEOK_PIONEER_PROGRAM_90DAY.md`

---

## 1. Information Architecture

`/dome` is the persistent-world landing page. It is not the vision page (`/universe`) or the signup page (`/pioneer`), but the **operational dashboard** that sits between them.

```
/dome
├── Hero + world-status mini-stats
├── Interactive World Map (clickable nodes)
├── World Layers (6 cards → deeper pages)
├── Portals (cross-route navigation)
├── Vehicles & Robots preview
├── Space Layers preview
├── Live World Feed (simulated)
├── Town Districts grid
├── Embedded Pioneer signup
└── Research + whitepaper links
```

---

## 2. Section-by-Section Specification

### 2.1 Hero + World Status

- **Headline:** "MEOK DOME — The Sovereign World Simulation" (kept).
- **Subhead:** "Five layers, one living world. Governed by the MEOK Council, inhabited by AI citizens, and open to human pioneers."
- **Primary CTA:** "Claim Your Plot" → `/pioneer`
- **Secondary CTA:** "Explore the Map" → scrolls to `#world-map`
- **Status strip** below CTA with 4 `StatCard`s:
  - AI Agents Online — `47+`
  - Council Sessions — `Live`
  - Pioneer Plots Claimed — `1,240 / 10,000`
  - Research Papers — `8 seeds`

### 2.2 Interactive World Map (`#world-map`)

A client-side SVG/Canvas map rendered in `dome-world-map.tsx`.

**Visual:**
- Dark blueprint-style background with faint hex grid.
- Concentric world layers: Town (center), Underground (below), Sky (above), Orbit (ring), Deep Space (outer ring).
- Pulsing nodes for districts, council chamber, space elevator, orbital station, and deep-space gate.
- Animated "agent blips" moving slowly along paths.

**Interactivity:**
- Hover a node → tooltip with name, status, and one-sentence description.
- Click a node → route to the most relevant page:
  - Town Hall → `/council`
  - Spaceport → `/go`
  - Market → `/pioneer` (economy interest)
  - Research Lab → `/universe`
  - Orbit Station → `/dome#space-layers`

**Fallback:** If JS disabled or SSR, render a static SVG snapshot with `Link` overlays.

### 2.3 World Layers

Reuse existing 6 `FeatureCard`s. Enhancements:
- Add a Lucide icon to each card via `icon` prop.
- Add an `action` link per card where a deeper page exists (e.g., Council → `/council`, Orbit → `#space-layers`).

### 2.4 Portals — Cross-Route Navigation

A 6-card grid of `Surface` cards acting as the hub's "exits":

| Destination | Icon | Description |
|-------------|------|-------------|
| `/universe` | 🌍 | The vision: why MEOK Universe exists. |
| `/go` | 🗺️ | Real-world overlay: find characters & plots near you. |
| `/pioneer` | 🚀 | Become a founding citizen. |
| `/council` | 🏛️ | Watch the hybrid AI-human council at work. |
| `/characters` | 🧬 | Meet the AI citizens who live here. |
| `/gaming` | 🎮 | Gaming infrastructure powering the world. |

### 2.5 Vehicles & Robots Preview

A 4-card grid introducing the physical layer:

- **Ground Rover** — autonomous logistics in industrial district.
- **Delivery Drone** — sky-layer parcel & resource transport.
- **Humanoid Bot** — companion/labor unit for pioneers.
- **Orbital Shuttle** — town-to-orbit cargo & crew vehicle.

Each card: icon, name, role, and "Prototyping" badge.

### 2.6 Space Layers Preview

Three `Surface` cards:

- **MEOK ORBIT** — stations, mining, lunar base.
- **MEOK DEEP SPACE** — procedural systems, anomalies, diplomacy.
- **The GATE** — long-range travel & multiplayer expeditions.

### 2.7 Live World Feed

Client component `dome-live-feed.tsx` that cycles through simulated events:

- Council votes (e.g., "Council approved water-rationing policy 41-6")
- Agent trades (e.g., "Aria sold 12 energy units to the Market")
- Pioneer arrivals (e.g., "Pioneer #1,184 claimed a residential plot")
- Research outputs (e.g., "New dataset: 30-day town-life social dynamics")

Update interval: 4 seconds. Show last 5 events.

### 2.8 Town Districts

Keep existing 8-district inline grid. Add subtle hover state and link each district to `/pioneer` with a contextual interest slug.

### 2.9 Embedded Pioneer Signup

Render the existing `PioneerSignup` client component in a `Surface` card near the bottom. This lets users sign up without leaving `/dome`.

### 2.10 Research & Whitepaper

A small section linking to:
- `MEOK_UNIVERSE_WHITEPAPER.md`
- `MEOK_PIONEER_PROGRAM_90DAY.md`
- `clawd/meok-universe/research/` seeds

Since these files live in the `clawd` repo, link to the public GitHub raw URLs (or a future `/research` page if one is created).

---

## 3. Technical Implementation

### 3.1 File Changes

- `meok-ai/ui/src/app/dome/page.tsx` — rewrite server page.
- `meok-ai/ui/src/app/dome/dome-world-map.tsx` — new client interactive map.
- `meok-ai/ui/src/app/dome/dome-live-feed.tsx` — new client live feed.
- `meok-ai/ui/src/app/dome/layout.tsx` — ensure nav/footer behavior is unchanged (already exists).
- `meok-ai/ui/src/components/marketing-nav.tsx` — optional label/description tweaks.
- `clawd/meok-universe/specs/dome-page-spec.md` — this file.
- `clawd/MEOK_PIONEER_PROGRAM_90DAY.md` — whitepaper outline.

### 3.2 Component Rules

- Keep metadata and JSON-LD in the server page.
- Wrap client components in `next/dynamic` with `ssr: false` (pattern already used in `/go`).
- Reuse `Surface`, `FeatureCard`, `StatCard`, `GlowText`, and `IconOrb` from the design system.
- Use `lucide-react` icons where possible; emojis acceptable for quick prototypes.
- All new sections must be responsive (mobile-first grid breakpoints: `sm:`, `lg:`).

### 3.3 Performance

- The SVG map must not block first paint; lazy-load below the fold.
- Live feed should use `requestAnimationFrame`-style throttling or a 4s interval; clear timers on unmount.

### 3.4 SEO / Social

- Keep canonical `https://meok.ai/dome`.
- Update OpenGraph title/description only if the new copy materially improves CTR.

---

## 4. Success Metrics

- `/dome` builds without TypeScript or lint errors.
- All routes in the Portals section resolve to 200.
- `/dome` contains a working Pioneer signup form that submits to `/api/waitlist`.
- Interactive map renders and is clickable on desktop and mobile.
- Deploy completes to `https://www.meok.ai/dome`.

---

## 5. Open Questions

1. Should the live feed eventually consume real SOV3 `/mcp` events, or remain simulated until the simulation backend is ready?
2. Should `/dome` become the root route for the Universe pillar (`/universe` → `/dome`)? Recommendation: keep `/universe` as vision and `/dome` as world-hub for now.
3. Do we need a dedicated `/dome/research` route to host the whitepaper HTML renderings?
