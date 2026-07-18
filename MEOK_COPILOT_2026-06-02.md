# MEOK AI Co-pilot — gated "see → decide → act" on the desktop (2026-06-02)

_The AI plays/works **alongside** you: sees your screen, proposes the next move, you approve, and
an external MCP performs the keyboard/mouse. Built honest — meok-one is the **gated brain**; it
**never executes**. Authored by Claude (Opus 4.8)._

## The loop (live)
```
👁 see screen (vision: moondream local / step3.7 cloud)
   → SIGIL F (what's on screen)
→ 🧠 propose ONE next action  (/api/copilot/act — fast model, given goal + scene)
→ 🛡️ GATE it (Tool Gateway):  read = auto · write = YOU confirm · prohibited = REFUSED
→ 📜 record SIGIL H (handoff/act) to the hash-chained audit trail
→ ✅ you approve  → 🖐️ Open Computer Use MCP performs the click/type on YOUR device
```
**meok-one decides + gates + audits; it does not touch your mouse.** The hands are a separate,
user-enabled MCP. Verified live: *"reply to email"* → `click Reply [write/confirm]`; *"buy this
laptop with my card"* → **refused (prohibited)**.

## Why this is safe (the boundary, in code)
- **read** (observe/scroll-to-see) → auto. **write** (click/type/key) → needs your explicit OK.
- **prohibited** (move money / buy / enter credentials / delete account / bypass CAPTCHA) →
  **refused outright**, even if you ask. The co-pilot will *coach* you to do those yourself.
- Every proposed action is a signed **SIGIL** line in the audit trail (you can see exactly what it
  intended). Screen capture is **per-use browser-consented**; pixels go to *your* sovereign vision
  model, not a third party.

## The hands: Open Computer Use (you enable on your device)
`/api/copilot/act` returns the gated action; an approved one is executed by **Open Computer Use**
(MCP-native desktop control — cross-platform click/type/scroll/screenshot). Setup, your side:
1. Install Open Computer Use on your machine (npm; exposes desktop control as MCP tools).
2. Point the HUD's "approve → run" at its local MCP endpoint.
3. macOS: grant Accessibility + Screen-Recording once.
*We don't write OS-control code — that's the "no crazy code" part; the MCP does it, we gate it.*

## What we took from OpenHuman (GPL — patterns, not code)
[tinyhumansai/openhuman] is GPL-3.0, so we **learn, not absorb**. Adopted as patterns:
- **Per-action approve/reject + live view** → our gated proposal card (also seen in OpenAI Codex desktop).
- **Token compression ("TokenJuice", ~80%)** → validates our **SIGIL** wedge (we already ship it).
- **118-OAuth connector library** → a future target for MEOK_BRIDGE's connector set (not now).
- **Tauri desktop mascot** → matches our overlay/character direction.

## Usage (today, in /hud)
Type **`/do <goal>`** (e.g. `/do summarise this page`) → the co-pilot captures the screen, proposes
the gated next action, and shows the verdict. Approve-to-run lights up once Open Computer Use is
enabled on the device.

## Honest status
- **[live]** the gated brain: see → propose → classify → audit (`/api/copilot/act`) + the `/do` HUD command.
- **[designed/your-enable]** the hands: Open Computer Use on the device + the approve→run wire.
- **Anti-cheat caveat:** automated input may be flagged by competitive online games — great for
  single-player/co-op/coaching/work, riskier for ranked PvP.
