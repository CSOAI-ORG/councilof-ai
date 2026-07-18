# MEOK as a gaming overlay on the OS — feasibility + plan (2026-06-02)

_Nick's vision: a WoW-style HUD that wraps Windows/macOS — minimap (top-left), character + TUI
(right), toolbar (bottom), your AI always present, seeing your screen, tracking your agents /
robot / digital-twin on the map. Authored by Claude (Opus 4.8). Honest answers, no fiction-spec
overclaims._

---

## Q1. "Current version is web SaaS — turn to app easy?" → YES, easy.
We already have the shells:
- **`sovereign-temple/desktop-tauri`** — Tauri wraps the full web OS. Point it at meok-one → a
  signed **Win/macOS/Linux app** in ~a day (icons + codesigning are the only real work).
- **iOS/Android**: Tauri v2 mobile (or Capacitor) wraps the same web build. A bit more (store
  signing), but the web app is the single source — one codebase, every platform.
- meok-one is pure static HTML/JS, so it wraps cleanly. **Web → app is a packaging step, not a rewrite.**

## Q2. "The overlay also works?" → YES — and it's ~80% built already.
**`meok-desktop`** (Tauri v2) is ALREADY a gaming overlay foundation:
- transparent · `alwaysOnTop` · `decorations:false` · `skipTaskbar` · no shadow · 80×80 FAB ↔ panel resize
- a **game-detection thread** (polls for Fortnite/Valorant/LoL/CS2/Minecraft → fires `game-detected`)
- global shortcuts (Cmd+Shift+M/V/1-6) · system-tray character switch
What's missing for the full WoW-HUD (all feasible, scoped):
1. **The HUD layout** — minimap (top-left) + character/TUI (right) + toolbar (bottom). This is a
   *web* layer (a meok-one `/hud` skin) rendered in the transparent window. **No native code.**
2. **Click-through** (input passes to the app behind, except over HUD widgets) — Tauri v2
   `set_ignore_cursor_events(true)` + per-widget toggle. Small native bit.
3. **Screen capture** (so the AI sees the screen) — see Q3.
4. macOS **Screen-Recording entitlement** + notarization.

## Q3. "AI sees the screen / interacts in games?" → YES — step3.7 is the brain for it.
- **Capture**: webview `getDisplayMedia` (or a native Tauri screen-grab) → frames.
- **See**: feed frames to **step3.7 Flash** — open-weights (Apache-2.0) vision-language MoE, native
  **image + video** understanding, ~400 tok/s, 256K ctx (perfect for a live overlay). (Fallback: our
  K2.5 vision.) The existing game-detection thread is the trigger.
- **Act, safely**: the AI's read of the screen + any action passes the **Sovereign gate** (care +
  veto) and the **Tool Gateway** (read=auto / write=confirm / prohibited=never). So "it can help in
  your game / your work" — but it can't do anything destructive un-gated. The overlay is governed,
  same as everything else.
- **The map**: the DOME minimap shows your characters/agents + (later) your robot/digital-twin as
  live presence — the "where is everything" panel, in-HUD.

## Q4. "SIGIL for images/video, not just text — better speed/tokens?" → YES, the RIGHT way.
Honest framing (NOT the quarantined fiction-spec's "100x pixel compression" nonsense):
- SIGIL is a **compact semantic/decision protocol, not a pixel codec.** It will *not* compress raw
  video — H.264 already does that.
- **What it DOES**: be the **semantic layer over media.** A vision model looks at a screen/frame
  **once** and emits compact SIGIL; agents then reason over the SIGIL (tiny, glossable, hash-chained)
  instead of re-shipping pixels between every agent. *That* is the real token/speed win.
- **Shipped today** (`meok_one/sigil.py`): two new opcodes —
  - `F` frame: `F|scene|objects|ref` → "Frame: {scene} — objects: … [ref]." (one screen summarised)
  - `D` detect: `D|label|bbox|conf` → "Detected {label} at {bbox} (confidence …)." (one region)
  So the overlay's vision can emit `F|...` once, and the council/agents reason + audit over it for
  free — same hash-chained trail, now multimodal. **The moat extends to vision, honestly.**

## Q5. The look-back (older GitHub / Amica origins)
- **meok-amica** = a fork of **semperai/amica** (which is Pixiv's ChatVRM) — the original 3D
  character + voice app with Windows/iOS Tauri builds. That's the "Ami" you remembered. Its VRM
  avatar + voice pipeline is the **character face** of the overlay (we already pull it into meok-one).
- The desktop lineage: `meok-desktop` (v2, the overlay) + `meok-amica/src-tauri` (the 3D face) +
  `sovereign-temple/desktop-tauri` (full-OS wrap). Nothing needs rebuilding from scratch — it needs
  **assembling**: meok-one HUD skin → into meok-desktop's transparent window → with the amica face.

## The build path (sequenced — this is the next big arc)
1. **`/hud` skin in meok-one** — WoW layout (minimap + character/TUI + toolbar), transparent bg. *web only, ship first.*
2. **Wrap meok-one in `sovereign-temple/desktop-tauri`** → the desktop APP (Win/mac). *packaging.*
3. **Load `/hud` in `meok-desktop`'s transparent window** + click-through → the live OVERLAY.
4. **Screen capture → step3.7** → the AI sees the screen → emits `F`/`D` SIGIL → council reasons, gated.
5. **Minimap = live presence** (agents/robot/digital-twin on the DOME).
6. iOS/Android wrap.

Each step is shippable + verifiable on its own. Step 1 (`/hud`) needs zero native code — the fastest
visible win toward the vision.

## Honesty notes
- step3.7 integration needs the StepFun/OpenRouter model id + a key (Nick) before it's wired — until
  then the vision path is K2.5 / scaffolded, not live. I won't add a 404-ing model alias.
- The overlay's native bits (click-through, screen-recording entitlement, notarization) are real work
  + macOS permission grants — feasible, not free.
