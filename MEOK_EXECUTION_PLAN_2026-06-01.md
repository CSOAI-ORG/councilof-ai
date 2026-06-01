# MEOK — Sequenced Execution Plan (one by one) · 2026-06-01

_By Claude (Opus 4.8). Nick: "do all of them, one by one, set a plan and execute." Ordered by
dependency so each step unblocks the next. ✅=done · 🔨=now · ⏭=queued · 🅿️=needs Nick._

## The order (and why)
Deploy is the dependency under Siri (needs a public endpoint) + sharing + July-4. So:

### STEP 1 — Visual wow polish (no deps, no gatekeeping) 🔨 FIRST
Do this first because it needs nothing external and makes the launch surface breathtaking now.
- 1a. three.js `UnrealBloom` + iridescent material on the avatar (MIT, already loaded)
- 1b. View-Transitions API on the OS mode-switch (free, 0 deps) — real-OS morphs
- 1c. canvas-confetti + soft Howler chime on hatch-complete (ISC/MIT) — the magical moment
- 1d. Tailwind-CDN glass tokens pass on os.html panels
- verify each eyes-on, E2E stays green, commit.

### STEP 2 — PWA manifest + service worker ⏭ (mobile reach, ~1hr, no deps)
- `manifest.webmanifest` + Workbox SW → MEOK ONE installs to iOS/Android home screen, offline.
- The gap that unlocks mobile + is the base the Siri shell rides on.

### STEP 3 — Deploy MEOK ONE to a live URL 🅿️ (needs Nick's Vercel auth)
- I prep everything: Vercel config, the GCP VM as the API backend, env. 
- Nick pushes the deploy button (auth/domain is a you-action, like the filings).
- This makes the Siri endpoint public + gives July-4 a real home.

### STEP 4 — Siri → MEOK bridge ⏭ (after STEP 3 endpoint exists)
- An importable iOS **Shortcut** (`.shortcut`) + documented flow: "Hey Siri, ask MEOK" →
  `Get Contents of URL` → the deployed `/api/sovereign` → GATE-safe council reply spoken back.
- Works on iOS 16+ today, no Apple gatekeeping. The "Siri powered by your owned governed AI."

### STEP 5 — MapLibre real-world map tab ⏭ (the geo-DOME, honest region-level)
- `map.html` — MapLibre + OSM, agents/settlements pinned by region (GeoIP), new OS tab.

### STEP 6 — Robotics-governance MCP (positioning) ⏭ post-launch
- A ROS2/LeRobot bridge MCP wrapping a robot action API behind the Sovereign GATE — the
  "MEOK is the conscience for embodied AI" demo.

## Rule
Every step: build → verify (eyes-on or test) → commit → next. Honest about what needs Nick
(Step 3 deploy). No hype claims; ship on what's verified.
