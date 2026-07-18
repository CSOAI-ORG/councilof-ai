# 🛠️ MEOK OS — make every app a REAL working product (e2e plan)

*Audit: most apps are descriptive panels (`case 'x': return text`), not flows. Real backend functions DO exist (SOV3 `guardian_*`/`family_*` MCP), but SOV3 is local — the public OS (Vercel serverless) can't reach it. So each app is classified by what can genuinely work on the public web vs. what needs a local agent or owner keys. We build the real ones fully; for the rest we build everything web-possible + are honest about the gated bit.*

## Feasibility key
- 🟢 **Fully real on web** — build it 100% (client state / serverless / browser APIs)
- 🟡 **Real + one gate** — works, but a piece needs OAuth keys or the local SOV3 agent
- 🔴 **Needs local agent** — the core action can't run from a browser sandbox

## The apps (Nick's priority list first)

### 1. Set up — "Create your Sovereign" 🟢 BUILD FULLY
- **Does:** choose your left brain (reasoning model) + right brain (creative model), voice on/off, signature/colour; persists; the dock + chat **honor it**.
- **Real path:** `/api/chat` gains a `model` param → maps to Groq fleet (gpt-oss-120b, llama-3.3-70b, qwen3-32b, llama-4-scout). Set up writes `localStorage.meok_brain` → dock passes it. Voice/signature already wired.
- **Assets:** existing `setup` case + the create-your-Sovereign flow + brain-picker memory.

### 2. Aware — presence & gesture 🟢 BUILD FULLY (engine already built)
- **Does:** opt-in camera → "I see you", reacts to wave/thumbs-up (MediaPipe), all on-device; a real control surface (start/stop, what it detects, privacy).
- **Real path:** the `awareStart()`/MediaPipe engine I built → wire the `aware` app to a proper UI (toggle, status, consent, privacy statement). 100% browser, no backend.
- **Assets:** MEOK_PRESENCE_AWARENESS.md, the live awareStart engine.

### 3. Family — family OS 🟢 BUILD FULLY
- **Does:** members, chores (assign/complete/points), events/calendar, shared dashboard.
- **Real path:** full CRUD in `localStorage` (mirrors SOV3 `family_*` schema) — a genuinely working family organiser, offline-first. Optional later: sync to SOV3.
- **Assets:** SOV3 `family_*` tool schema (add_member/add_chore/complete_chore/add_event/get_dashboard).

### 4. Characters ✅ DONE
- Hatch one Sovereign, name it, it remembers, governed; friendly creature + bring-your-own-avatar.

### 5. Social Hub 🟡 REAL + OAuth gate
- **Does:** connect networks, compose once → post region-aware; draft + schedule.
- **Real path:** build the connect UI (Sign in with each platform) + a real compose/draft surface that saves drafts locally and (when OAuth keys added) posts. Region-aware content is real now.
- **Gate:** actual posting needs per-platform OAuth apps (owner). Drafting/scheduling/compose is real today.

### 6. WiFi / Guardian 🔴/🟡 split
- **Does:** child profiles, screen-time/game limits, chat moderation, network/WiFi security scan.
- **Real path:** child profiles + game limits + schedules + chat-moderation = 🟢 real as local data + the moderation can call `/api/chat` to flag content. **WiFi/network *scan* = 🔴** — a browser can't scan the LAN; that needs the local SOV3 Guardian agent. Build everything else real; clearly label live-scan as "needs the MEOK home agent."
- **Assets:** SOV3 `guardian_*` (scan_network, check_wifi_security, add_child_profile, set_game_limit, moderate_chat).

### Other tiles (already content-rich, lower priority to "functionalise")
King/Council/Fleet/Bridges/SOV Space/Badges/Pricing/Earth/Map = mostly real surfaces already (SOV Space + Badges + Pricing + Verify are live products from this session). Revenue/Investor/Distro = dashboards. Make functional after the 6 above.

## Build order (one by one, each verified e2e in the live browser)
1. ✅ Persistent bottom chat bar (Sovereign from anywhere)
2. **Set up** (model picker → dock honors) ← next
3. **Aware** (wire the presence engine to a real app surface)
4. **Family** (full CRUD organiser)
5. **Social Hub** (connect + compose + draft; OAuth-gated post)
6. **Guardian** (profiles/limits/moderation real; WiFi-scan = local-agent gate)

## The honesty line
We can make Set up / Aware / Family **genuinely 100% working products** on the public web today. Social Hub and Guardian are **real except** the gated piece (OAuth posting / LAN scan) — those need owner keys or the local home agent, and we'll label them honestly rather than fake them. Every "working" claim gets verified live in the browser before it's called done.
