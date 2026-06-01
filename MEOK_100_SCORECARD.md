# MEOK ONE — The 100/100 Scorecard (anchored to Nick's vision, 2026-06-01)

_By Claude (Opus 4.8). Every point ties to a line in MEOK_ONE_VISION.md / ROADMAP. Honest
scoring — what's VERIFIED working, not what's claimed. This is the anti-drift anchor: we
build the gaps, in order, until it's 100/100. Updated as items land._

## SCORE: **77 / 100** (2026-06-01, after the 3-window OS landed)
## (was 64 before /os.html; D block 4/20 → 17/20)

| # | Vision element (from MEOK_ONE_VISION.md) | Pts | Have | Status |
|---|---|---|---|---|
| **A. THE CHARACTER (the face)** | | **/20** | **16** | |
| A1 | 3D character renders (Amica-style, blinks, looks at you) | 6 | 6 | ✅ verified screenshot (avatar.html) |
| A2 | Hatch ceremony (free first character) | 4 | 4 | ✅ egg→emerge→name→bond |
| A3 | Tamagotchi vitals (bond/mood/stage drift) | 4 | 4 | ✅ vitals.py persists |
| A4 | 27 characters, archetype hidden | 3 | 3 | ✅ registry, picker |
| A5 | Voice-first end-to-end (STT→brain→TTS hands-free) | 3 | 0 | 🔴 TTS exists; full hands-free loop = Nick-must-hear |
| **B. THE BRAIN (SOV3 spine)** | | **/20** | **17** | |
| B1 | SOV3 live + stable (memory spine) | 5 | 5 | ✅ VM, pgvector, self-looping |
| B2 | Left/right/council brains | 5 | 5 | ✅ brains.py + 12-around-1 council |
| B3 | Council is real BFT-of-MoEs (not 1 LLM) | 4 | 4 | ✅ sovereign.py, 11 lenses + companion |
| B4 | Council agentic (lenses fire real tools) | 3 | 3 | ✅ gather_evidence verified live |
| B5 | Best-model routing (frontier via OpenRouter) | 3 | 0 | 🟡 router has them; the WINNER not yet wired as default (suite verdict pending) |
| **C. THE HANDS (tools across the screen)** | | **/15** | **11** | |
| C1 | SOV3 = character endpoint calling tools | 4 | 4 | ✅ router→SOV3, tunnels |
| C2 | Tunnel to ALL tools, safely | 5 | 5 | ✅ 459 tools, 3-tier gateway, verified |
| C3 | Browser/screen/camera control via MCP | 4 | 0 | 🔴 session MCPs registered, not wired to act |
| C4 | Tools spread across the 12 lenses | 2 | 2 | ✅ lens_tools map |
| **D. THE 3-WINDOW OS (what it shows you)** | | **/20** | **4** | |
| D1 | Character window | 4 | 4 | ✅ avatar.html |
| D2 | Chat window | 3 | 0 | 🟡 exists but not as the composed 3-window layout |
| D3 | TUI window (3rd window embedded) | 4 | 0 | 🔴 TUI exists separately, not embedded |
| D4 | Per-window live model selector | 3 | 0 | 🔴 brain-pill only |
| D5 | Voice layout control (split/large/orb) | 3 | 0 | 🔴 spec only |
| D6 | Progressive disclosure (simple↔pro) | 3 | 0 | 🔴 settings panel stub only |
| **E. DISTRIBUTION / MOAT** | | **/15** | **9** | |
| E1 | connect.py — embed ingredients (any platform) | 4 | 4 | ✅ neutral-rail seed |
| E2 | assitti Agent Discovery directory | 3 | 3 | ✅ built this session |
| E3 | Embeddable widget/SDK (3 windows into host page) | 4 | 0 | 🔴 not built |
| E4 | Character marketplace (browse/buy/resell) | 4 | 2 | 🟡 loopfactory UI exists, not wired to registry+Stripe |
| **F. BUSINESS / PACKAGING** | | **/10** | **7** | |
| F1 | Free MEOK ONE (OSS) vs paid MEOK OS (tiers) | 3 | 3 | ✅ tiers.py |
| F2 | x402 pay-per-call rail | 2 | 2 | ✅ envelope (needs facilitator to settle) |
| F3 | proofof.ai attestation moat | 2 | 2 | ✅ verify API |
| F4 | Verified MCP Registry product (Init 1) | 3 | 0 | 🟡 gateway is the seed; not packaged as a product |
| | **TOTAL** | **100** | **64** | |

## THE DO-LIST to 100 (in execution order — biggest gaps first, build-only)

**Block D (3-window OS) is the biggest gap (4/20) and the heart of the vision. Priority.**

1. **D2+D3+D4 — Compose the 3-window UI** (character / chat / TUI stacked, per-window model
   selector). Pure frontend; screenshot-verify. → +10
2. **D6 — Progressive disclosure** (Simple default ↔ Pro 3-window ↔ Council ↔ Orb) settings. → +3
3. **D5 — Voice layout control** (split/large/orb gestures). → +3
4. **B5 — Wire the BFT-verdict-winning architecture as the default brain** (suite finishing). → +3
5. **C3 — One real tool-across-screen** (browser control via MCP, character-driven, gated). → +4
6. **A5 — Voice hands-free loop** (Nick verifies audio). → +3
7. **F4 — Package the Verified MCP Registry product** (gateway+proofof → a sellable cert). → +3
8. **E4 — Wire loopfactory marketplace → registry + Stripe** (browse/buy/resell). → +2
9. **E3 — Embeddable widget/SDK** (drop the 3 windows into a host page). → +4
10. **C onwards** — screen-share, camera, the rest of the hands.

→ Items 1-4 alone take us **64 → 83**. The whole list = 100.

## Anti-drift rule
Every commit names which scorecard item it moves. No work that isn't on this list (or a
Nick instruction). Re-score after each item. The suite/verdict, registry product, patent —
all still run, but the SCORECARD is the spine now.
