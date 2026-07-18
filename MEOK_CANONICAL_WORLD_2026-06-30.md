# 🐉 MEOK — ONE CANONICAL WORLD (2026-06-30)

Honest reconciliation after finding **two parallel "MEOK worlds"** both flagged "100% master."
This is the single source of truth for which is canonical and what was absorbed.

## The decision
**CANONICAL = the live, public, deployed stack.** What a user actually hits in a browser wins.
Everything else is *source/dev that feeds it*, not a second product.

| Surface | URL | Role | Status |
|---|---|---|---|
| Brand landing | **meok.ai** | front door (real deck renders) | LIVE 200 |
| Master OS | **os.meok.ai** | the cowork MEOK OS v3.0 (tiles) | LIVE 200 |
| 3D character | **build.meok.ai/character.html** | VRM cast (Amica/VRoid) + in-character chat | LIVE 200 |
| 3D globe | **world.meok.ai** | Cesium globe | LIVE 200 |
| Brain | **os.meok.ai/api/chat** | council-aware Claude→Groq | LIVE |
| Avatar | **os.meok.ai/api/avatar** | egg-portrait SVG | LIVE |

## What was the "second world"
`csoai-os/meok-home/` — 128 local HTML pages + its own Cesium `meok-world-3d.html` +
`meok-character-emergence.html` + the FastAPI backend on :8000 (council/avatar endpoints,
37 real behaviour-tests pass). **Rich, real backend — but never deployed; no public user could reach it.**

## What I absorbed INTO the canonical stack (this session)
The backend is coupled to the local SOV3 substrate (:3101) so it can't go serverless wholesale.
So I ported its **portable, valuable pure-logic** into the live public functions:
- **Council brain** — extracted `QUEEN_PERSONALITIES` (13 queens, OCEAN, veto, motto) + `ARCANA_LENSES` (22)
  into `meok-os-deploy/api/_data/council.json`; `api/chat.js` now accepts `{queen_id, arcana_lens}` and
  replies fully in-character (verified: Sophia Care → compassion; Sovereign King → "I've heard the council").
- **Avatar** — ported `_avatar_svg` (translucent egg + golden core + glyph) to `api/avatar.js`.

## Honest status notes
- **Anthropic key erroring** → chat currently serves via the **Groq/llama fallback** (still in-character).
  The key Nick rotated/pasted needs re-checking in Vercel env (`ANTHROPIC_API_KEY`).
- The `meok-home/` 128 pages + local backend remain as **dev source**, NOT a deployed rival. Do not
  deploy them as a separate public world — fold any new feature into the canonical stack above.
- "261 tests" is ~48% string-existence / 8% real-HTTP; the **37 backend tests are real and pass**. UE5 has never compiled.

## The rule going forward (anti-fragmentation)
**One front door (meok.ai), one OS (os.meok.ai), one globe (world.meok.ai), one character system
(build.meok.ai/character), one brain (/api/chat).** New work wires into these. No third "MEOK world."
