# MEOK ONE / MEOK OS — The Full Vision (Nick, 2026-05-31)

Captured verbatim-in-spirit so we build EXACTLY this. Maps each piece to what's already built.

## The picture
End user runs MEOK ONE. On the RIGHT side of their screen sits the MEOK UI — **3 stacked windows**:
1. **Character window** (top) — our Amica-style 3D talking character ("Western Step 3.5 Flash" look).
2. **Chat window** (middle) — talk/type to the character.
3. **TUI window** (bottom) — our own terminal/command panel.

**Layout is fluid + voice-controlled:** "split across screen" (3 side-by-side), "go large" (one big),
"minimise" (collapse to a **small floating circle with the character** in the corner, still listening).

**Each window has its own selector bar** — swap the model live, mid-session:
- character window → which character (the 27)
- chat window → which talking model (left/right/council, OpenRouter/Kilo-style picker)
- TUI window → which coding model
All swappable **without losing the session** — change voice, character, or LLM mid-task.

## The thing that makes it work (Nick's key insight — and it's RIGHT)
All 3 windows **stay in sync through SOV3**, which reads/writes the same **GitHub + GCP topology
playbook**. So:
- Any window can change model/character/TUI and they're **all calling the same source of truth**.
- Agents **don't ruin each other's work** — SOV3 audits + reconciles (BFT council).
- This is **left-brain / right-brain with SOV3 in the centre — but surfaced AS the 3 windows.**

Behind the scenes: **MEOK BRIDGE** (routes left/right × local/api), **MEOK SYNC** (the bus),
**MEOK SIGIL** (compressed signed inner-comms). The user never sees these — they just see 3 windows.

## SOV3 = the character's endpoint (the spine)
The character IS the front of SOV3. SOV3 then calls out to tools and **shows results across the
screen** — control browsers, screen-share, view the person (camera), run code, use any MCP tool.
The character is the face; SOV3 is the brain; the tools are its hands.

## Distribution / business model
- **MEOK ONE** = free, open-source version (the character OS).
- **MEOK OS** = paid SaaS — desktop app (Linux/Windows/Mac), mobile, and web UI.
- Cross-platform via the same backend (GCP VM running SOV3 + BRIDGE).

---

## Can we SIMPLIFY for the end user? — YES (the honest answer)
The 3-window/left-right-brain machinery is the RIGHT architecture, but the **user shouldn't have to
understand it.** Simplify the surface, keep the power underneath:
- **Default view = just the character + a chat box** (like talking to a friend). One window.
- The TUI + the model-selector bars are **"pro mode"** — revealed on demand ("show me the controls",
  or a small ⚙ toggle). Most users never touch them.
- The 3-split / large / orb layouts are **power-user gestures**, not the default.
- Left/right/council = ONE friendly toggle ("private / powerful / both"), not jargon.
→ Grandma sees a caring character. A developer says "show TUI, switch coding model to DeepSeek."
  Same app, same SOV3 spine, two depths. That's the simplification: **progressive disclosure.**

---

## How the vision maps to what's BUILT (2026-05-31) — grounded
| Vision piece | Status |
|---|---|
| 3D character window (Amica-style) | ✅ built — `avatar.html`, renders, hatch, vitals |
| Chat window | ✅ built — talk + starter chips + typing |
| TUI window | 🟡 exists separately (meokclaw-tui / Western TUI) — needs embedding as 3rd window |
| Model selector per window (live swap) | 🟡 brain-pill exists (left/right/council); per-window model dropdown = TODO |
| Voice layout control (split/large/orb) | 🔵 orb/minimise spec'd (blueprint); not built |
| All-sync-through-SOV3 | 🟡 BRIDGE+SYNC+SIGIL built; full GitHub/GCP playbook sync = TODO (needs VM) |
| SOV3 = character endpoint calling tools | 🟡 BRIDGE routes to SOV3; tool-use (browser/screen/camera) = MCP bridge, partial |
| Left/right/council, OpenRouter/Kilo picker | ✅ BRIDGE + router + free-tier waterfall built |
| Free MEOK ONE vs paid MEOK OS SaaS | 🔵 model defined (tiers.py); packaging = TODO |
| Cross-platform (desktop/mobile/web) | 🔵 web works; Tauri desktop + mobile = TODO |

## The build order this implies (slots into the July-4 roadmap)
1. **GCP VM** (`meok-498012`) — the sync spine + crash fix. SOV3's own #1 priority. ← NEXT
2. Embed the **TUI as the 3rd window** + per-window model selector bars.
3. **Voice layout control** (split/large/orb) + minimise-to-character-circle.
4. **SOV3 tool-use across screen** (browser/screen-share/camera via MCP) — the "hands".
5. **Progressive-disclosure UX** (simple default ↔ pro mode).
6. Package **MEOK OS** (Tauri desktop + web) as the paid SaaS; MEOK ONE stays free/OSS.
