# MEOK ONE — Open-Source UX/Visual Stack (scraped + verified 2026-06-01)

_By Claude (Opus 4.8). Best permissive-licensed OSS tools to make MEOK ONE stand out, vetted
for the no-build stdlib server. Licenses verified; caveats honest._

## TOP 7 to integrate for July 4 (ranked by wow-per-effort — all CDN, no build)
1. **View Transitions API** (web standard, free, 0 deps) — buttery split↔large↔orb morphs, real-OS feel. *Highest wow-per-effort.*
2. **GSAP** (free Webflow license — NOT MIT, free for commercial incl. plugins) — directs every entrance/exit; ScrollTrigger + Flip.
3. **three.js post-processing + iridescence** (MIT, ALREADY loaded in avatar.html) — `UnrealBloomPass` glow + iridescent VRM material = "breathtaking" almost free.
4. **Tailwind Play CDN + glass design tokens** (MIT) — premium dark glassmorphic panels in brand palette, no build.
5. **canvas-confetti (ISC) + Howler.js (MIT)** — magical "hatched!" celebration + UI sound design.
6. **tsParticles (MIT) or COBE (MIT)** — living particle field / tiny 3D globe behind the orb.
7. **Tauri window-vibrancy (MIT/Apache)** — native acrylic/vibrancy matching in-app glass (QA: Win resize-lag, Linux compositor).

## By category (top picks)
- **Motion:** GSAP (free) · Motion One (MIT, ~5KB) · Lottie (MIT). [Theatre.js = build burden, skip]
- **3D/shaders:** three.js (MIT, in) · tsParticles (MIT) · OGL (MIT, ~30KB raw WebGL). [r3f = React build, defer]
- **UI tokens:** Tailwind Play CDN + hand-rolled glass tokens now. [shadcn/Park UI = React build, defer to Tauri/SaaS]
- **Maps:** **MapLibre GL (BSD-3) + OSM/Protomaps tiles** = the free Google-Maps replacement · deck.gl (MIT) overlays · COBE/globe.gl (MIT) globe.
- **Desktop:** Tauri 2.x (MIT/Apache, <10MB, Nick has it) + window-vibrancy. [Electron = 100MB+ heavy]
- **Mobile:** Workbox (MIT) for PWA + **Capacitor (MIT) > Tauri-mobile** for the Siri/Android shell.
- **Voice:** whisper.cpp (MIT STT) · Kokoro (Apache TTS) · **Pipecat (BSD-2, pure-Python — fits our server)** · Piper (MIT, light fallback).
- **Wow:** View Transitions (free) · canvas-confetti (ISC) · Howler/Tone (MIT sound).

## License caveats (honest)
- **GSAP** = free Webflow std license, NOT OSI-MIT — fine for commercial use, but verify before redistributing inside an OSS repo.
- **Voice models ship weights** — confirm each bundled voice's individual license.
- Everything else: MIT/BSD/ISC/Apache — OSS-safe.

## Deferred to the eventual React/Vite build (NOT the stdlib server)
shadcn/ui, Park UI, react-three-fiber, vite-plugin-pwa.

## Immediate integration plan (CDN, this week)
A. View Transitions on the OS mode-switch (Simple/Pro/Council/Orb) — instant OS feel.
B. three.js UnrealBloom + iridescence on the avatar — the "breathtaking" upgrade, no new dep.
C. canvas-confetti + a soft Howler chime on hatch-complete — the magical moment.
D. Tailwind-CDN glass tokens pass over os.html panels — premium polish.
E. (separate) PWA manifest + Workbox SW — mobile reach.
