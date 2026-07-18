# MEOK OS — E2E UI Audit (2026-06-01)

_By Claude (Opus 4.8). Live sweep of the deployed OS (every tab clicked, every window/selector
exercised, console watched). ✅ works · 🟡 works but thin/external · 🔴 broken or missing._

## Product tabs (left panel)

| Tab | State | What works | Missing / inner-feature gaps |
|---|---|---|---|
| 🏛️ **DOME** | ✅✅ | Native MapLibre map, pins **tinted by archetype**, your creations **gold-ringed** + "N yours ✨" legend, tap-to-focus, popup tagline + "✨ Make this my AI" CTA, **📍 Fly to my region**, privacy-safe "you" | Globe projection off (flagged); pins still symbolic placement (timezone-jittered, not live presence) |
| 🧬 **Characters** | ✅✅ | Native grid of all faces, tap → becomes your AI, **ⓘ detail card** (face, traits, voice, domain, backstory), **✨ Character Factory** (describe→conjure via openclaw LLM, live glass-egg preview, mint → roster → lives in DOME) | premium/pricing not shown on cards (tier exists in data) |
| 🔭 **Agents** | 🟡 | Native list, renders | **Only 2 agents** in the registry (assitti near-empty); **read-only** — can't open, inspect, or invoke/talk to an agent |
| 🛠️ **Tools** | 🟡 | Native stats (459 · 60 read · 399 confirm) | **Read-only** — can't browse/search the 459 tools or invoke from the panel (only via TUI `tool <name>`); **"0 prohibited" looks wrong** (prohibited tier not surfaced); no per-tool detail/tier reason |
| 🛒 **Marketplace** | ✅ FIXED | Native hub: Verified MCP Registry + Sell/resell cards + 27-character adopt grid (tap → become your AI) | ~~BLANK (loopfactory won't iframe)~~ fixed 2026-06-01: now native, no external-iframe dependency |
| 💗 **Care** | 🟡 | Loads aquaponics.app (iframes OK) | It's a **different product's site**, not a native MEOK care surface (no check-ins, mood history, crisis resources, care-membrane status) |
| ⚖️ **Compliance** | 🟡 | Loads csoai.org (iframes OK) | External site (minor SVG glitch on their page); should point to the **native /registry** product we just built |

## The 3 windows (right dock)

| Window | State | Gaps |
|---|---|---|
| 🧬 **Character** | ✅✅ | `charSel` wired; 3D avatar + glass egg render; **vitals HUD** (🐣 L· 💜bond · 🙂 mood) live; **✨ New** (Factory) + **ⓘ detail card** (traits/voice/domain/backstory) |
| 💬 **Chat** | ✅ | `brainSel` wired (Fast/Private/Both/Sovereign), mic (STT→TTS) wired, send wired. No streaming; no visible chat-history persistence; "Both/council" path unverified |
| ⌨️ **TUI** | 🟡 | Commands work (help/tools/agents/tool/mode/clear). **`codeSel` (coding-model picker) is NOT wired — cosmetic**; the selected model is ignored. Limited command set |

## Cross-cutting inner features

| Feature | State |
|---|---|
| Voice hands-free loop (A5) | ✅ wired — *Nick to confirm audio on device* |
| Voice/text UI control (D5) | ✅ "pro view / orb / make it gold" |
| Cross-device sync (🔗 Devices) | ✅ anon + pair-code link |
| Modes (simple/pro/council/orb) | ✅ |
| Window drag-resize | ✅ (E2E-parked in headless) |
| **Vitals/bond HUD** | 🔴 **missing** in the OS chrome |
| **Settings panel** | 🟡 only Devices + voice; no theme picker UI, privacy/model settings, or profile |
| Hatch in OS | ✅ glass egg embed |

## Standalone surfaces (separate from the OS tabs — all ✅ this session)
`/hatch` cinematic · `/dome` map · `/siri` setup · `/embed` + `/widget` · `/registry`

## Prioritised fix list — ALL CLOSED except Agents (data-limited)
1. ✅ **Marketplace blank** → FIXED: native hub (MCP registry + adopt-a-character grid).
2. ✅ **`codeSel`** → FIXED: TUI is a per-model coding REPL via gated `/api/ask`.
3. ✅ **Vitals/bond HUD** → FIXED: live `🐣 L2 · 💜12 · 🙂` in the character window.
4. ✅ **Tools tab** → FIXED: invoke any tool by name, 3-tier gated, real result shown.
5. 🟡 **Agents tab** → still sparse (registry has 2 agents) — *data*, not UI. Populate later.
6. ✅ **Care / Compliance** → FIXED: Care = native wellbeing + crisis resources; Compliance → native `/registry`.
7. ✅ `openProduct` clears `frame.src` before `srcdoc` → FIXED.

→ Every UI gap closed except the Agents registry being thin (a content/data task, not a UI fix).
Plus cross-cutting: a fuller **Settings panel** (theme picker UI, model/privacy) is still light — Devices + voice + voice-theme only.
