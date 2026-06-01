# MEOK — Platform / OS / Geo / Mobile Architecture (honest, grounded 2026-06-01)

_By Claude (Opus 4.8). Answers Nick's big questions with what's REAL in the repo + the honest
technical/legal limits. Nothing faked — where something can't work as imagined, it says so and
gives the version that does._

## 1. "Run inside Microsoft / Linux / Apple — merge with their OS"
**Real path: Tauri (you ALREADY have 4 wrappers in-repo):** `meokclaw-desktop/`, `meok-desktop/`,
`meok-amica/src-tauri/`, `sovereign-temple/desktop-tauri/`.
- Tauri compiles MEOK ONE into a native **.app (macOS) / .exe+.msi (Windows) / .deb+AppImage (Linux)** — ~10MB, Rust core, system webview. It can read files, run local tools, sit in the menu bar/tray, global hotkey, always-on orb.
- **Honest limit:** it *runs on* the OS as a first-class app (like VS Code / Discord do) — it does **not** replace or rewrite Windows/macOS/Linux. "MEOK as your OS layer" = an always-present companion app + the floating orb that can act across your apps via MCP tools. That's the truthful, achievable version of "merges with their OS".
- **Action:** consolidate the 4 wrappers → one `meok-desktop` that loads the MEOK ONE OS. (Post-P0; the web OS is the dependency.)

## 2. "Geo-map the DOME onto the real world — agents on real IPs (Google Maps)"
**Real + genuinely cool — with two honest limits:**
- **Use MapLibre GL + OpenStreetMap, NOT Google Maps.** Open-source, free, no per-load bill, ours to theme/own. (Google Maps = licensing fees + restrictive ToS + can't restyle freely.)
- Each character/agent gets a pin from **GeoIP** (IP → approximate location). The quarantined `geospatial.py` had the right *idea* (region → jurisdiction); rebuild it clean on MaxMind/ip-api GeoIP.
- **Honest limit A — precision:** IP geolocation is **city/region-level, NOT a street address**, and privacy law (GDPR) forbids pinpointing a *person*. So: agents shown by **approximate region**, never a home. This is fine — a glowing world map of where MEOK characters live is beautiful at region scale.
- **Honest limit B:** this ties into the *real* DIRF/DTCEM compliance moat — "show me which jurisdiction's AI law applies to this agent" is the enterprise-valuable version, and it's truthful.
- **Build:** `meok-one/web/map.html` — MapLibre world, region pins for the live assitti agents + the DOME settlements. A new product tab in the OS left panel.

## 3. "openClawWorld + geo = real world with AI characters"
- openClawWorld is referenced (`.openclaw` dirs exist locally) — a Phaser/Colyseus 2D multiplayer world. The MEOK-DOME-Architecture deck names it the DOME base.
- **Honest:** forking + integrating a multiplayer game engine is a multi-week job, **not July-4 critical**. The launch-ready version = the MapLibre map tab (above) showing characters on the real world. The full walkable openClawWorld DOME is the **post-launch** north star.

## 4. "Siri + Android — key for mobile"
**Real path, in order of effort:**
- **PWA first (the gap — meok-one has NO manifest yet):** add `manifest.webmanifest` + service worker → MEOK ONE installs to the iOS/Android home screen, works offline, full-screen. One build, both platforms, today. **Highest ROI mobile move.**
- **Siri:** an **App Shortcut / App Intent** ("Hey Siri, ask MEOK…") — needs a thin native shell (Tauri-mobile or Capacitor) wrapping the PWA. Real but a native build step.
- **Android:** the PWA + a Google Assistant App Action. Same shell covers it.
- **Build now:** the PWA manifest + SW (free, fast, big win). Native Siri/Assistant = post-PWA.

## 5. "We eat, but let enterprises eat too" (the two-sided model)
- **End users:** free to hatch + own their AI (consumer door).
- **Enterprises:** the SAME platform, but they get the compliance layer (DIRF/DTCEM/SIGIL audit/Sovereign GATE) + can run their OWN characters/agents on MEOK rails + rev-share. The `connect.py` neutral-rail already returns "ingredients" so any platform embeds a MEOK character → they promote MEOK by using it. That's "they eat, we eat."

## Build priority (slots into the 33-day plan, P0 first)
1. **PWA manifest + SW** (mobile, ~1hr, huge reach) ← cheap + high-value, do early
2. **map.html** (MapLibre region map as a DOME/world tab) ← the "real-world DOME" made real + honest
3. **One consolidated Tauri desktop** (the OS-integration story) ← after web OS is deployed
4. Native Siri/Assistant shell ← post-PWA
5. openClawWorld walkable DOME ← post-launch north star
