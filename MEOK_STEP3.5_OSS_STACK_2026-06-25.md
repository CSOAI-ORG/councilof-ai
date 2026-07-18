# 🔭 Step 3.5 — Open-source stack scan (overlay · HUD · desktop-agent · AR · home-mapping)
2026-06-25. Nick: "scrape & absorb the top platforms for desktop agents, HUD, OS overlays, AR like Pokémon Go, and how each end-user maps their home for humanoids." This is the honest scan — **all OSS / free-tier unless noted PAID. Verify license + currency before adopting; I'm naming the category leaders, not certifying versions.**

> Decks absorbed (4 PPTX): visual brand assets — core line **"MEOK.AI Sovereign OS — no more giving your data away."** World-sim zip absorbed: its engine comparison ranks **CesiumJS + Three.js web-native #2 (8.3/10)** — exactly meok-town-view's stack. **Our engine choice is validated** (UE5 #1 but heavy + paid; Godot 4/10 for geospatial). Stay web-native.

## A · The off-site OS overlay (loads even when not on the site)
| Tool | Use | Honest note |
|---|---|---|
| **Tauri v2** (Rust+web) | downloadable desktop companion, tiny binary, always-on-top window | best fit — wraps our web OS; real |
| **Flutter** (+`flutter_rust_bridge`) | mobile (iOS/Android) sharing the Rust core | per ONE_OS pkg — the mobile path |
| **Electron** | same, heavier | fallback if Tauri gaps |
| **Browser extension** (MV3) | the overlay *on any website* | the "rides on top of SaaS" layer |
| Rainmeter (Win) / Übersicht (mac) | desktop HUD widgets | inspiration, not our path |
| ⚠️ **Mobile (iOS)** | — | **no true system overlay allowed**; Android has limited `SYSTEM_ALERT_WINDOW`. On mobile it's a companion app, not an overlay. Be honest. |

## B · Desktop agents that actually *do things* (the "do shit" layer behind the chat bar)
| Tool | Use |
|---|---|
| **OpenHands** (you have it installed) | the action backend — runs tasks, edits, browses |
| **Open Interpreter** | local "talk → it runs code/controls the machine" |
| **self-operating-computer** / **Claude computer-use** | screen-driving agents (vision → click/type) |
→ Wire the sovereign chat bar → OpenHands so "sovereign, do X" executes real work (next depth).

## C · AR — the Pokémon-Go layer (your files in the real world)
| Tool | Use | Note |
|---|---|---|
| **WebXR** (three.js / A-Frame) | AR in the browser, no app install | best first step — fits our web stack |
| **Niantic Lightship ARDK** | the literal Pokémon-Go engine (VPS, world-anchored AR) | free tier; **the Pokémon-Go reference** |
| **8th Wall** | web-AR, markerless, world tracking | PAID but powerful |
| **AR Foundation** (Unity) / ARKit / ARCore | native AR, occlusion, anchors | native apps |
| **Immersal / Google Geospatial API** | place content at real GPS+visual anchors | "your hives/files pinned to real places" |
→ MEOK move: pin sovereign characters + your files/inventory to real-world anchors (WebXR first, Lightship for the game-grade version).

## D · Home-mapping for humanoids (the killer thread)
The end-user scans their home → a 3D map the AI + humanoid use to navigate, build inventory, fetch/sell, connect devices.
| Tool | Use | Note |
|---|---|---|
| **Apple RoomPlan** (LiDAR) | one-tap room → structured 3D floorplan (walls, furniture) | iPhone/iPad Pro; the easiest consumer scan |
| **Polycam / Scaniverse** | photo/LiDAR → mesh, free tier | consumer-grade capture |
| **nerfstudio / Luma / gaussian-splatting** | photoreal home reconstruction | cinematic quality |
| **RTAB-Map / Open3D / Isaac (occupancy grids)** | the *robot's* navigation map (SLAM) | what a humanoid actually drives on |
| **Matterport SDK** | pro home digital-twin | PAID |
→ MEOK move: RoomPlan/Polycam for the consumer scan → store as the home's sovereign twin → the AI plans (inventory, fetch, sell, connect) → exported as an occupancy grid when a humanoid registers. **This is the home half of the humanoid bridge.**

## E · Customizable sov-towns (end-user builds/edits)
**Hyperfy / Hytopia** (open 3D-world engines, in-browser editing) · **PlayCanvas** (open) · **Needle Engine** · low-code via **Blockly**. → adopt Hyperfy-style editing so users shape their town; "sovereign, add a building" = chat → world action (via the OpenHands layer).

## F · Cinematic character emergence (match the deck's translucent egg)
**Rive** (open runtime, interactive vector) — best for the egg→shell→creature; **Spline** (3D web, free tier); **VRoid Studio** (free) → the real MEOK character VRMs from your concept art; **Mixamo** (free) animations.

## Honest sequencing (what to build, in order)
1. ✅ **DONE this session:** sovereign chat dock · hives→industries+regulations · real-world map drop · 9-archetype chooser · epic emergence · DAILY EAT.
2. **Wire chat → OpenHands** (the "do shit" layer) — turns navigation into real action.
3. **VRoid the real character VRMs** (replace sample bodies) — "choose them all" becomes真.
4. **Egg emergence in Rive** to match the deck exactly.
5. **WebXR AR pin** (files/characters in the real world) — the Pokémon-Go seed.
6. **RoomPlan home scan** → sovereign home-twin (the humanoid bridge's home half).
7. **Hyperfy sov-town editing** (customizable worlds).
8. **Tauri shell** (the downloadable off-site overlay).

**Reality check:** items 2–8 are each real projects (days–weeks), not afternoons — and 5/6 need device capabilities (camera/LiDAR). The architecture is sound and the OSS exists for every piece; this is now an execution sequence, not an unknown. No fabricated capabilities — where it's PAID or platform-restricted, it's flagged above.
