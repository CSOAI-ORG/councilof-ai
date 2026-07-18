# 🐉 MEOK — Architecture & Stack, Dragon-Mode Rundown (2026-06-02)

_By Claude (Opus 4.8). The full, honest map of what we have, the stack under each piece, and —
per product — exactly what dev is left to make each inner UI **truly world-class**. Grounded in
source reads, not marketing._

---

## 0. The one-paragraph mental model
A user **hatches & owns an AI character forever**. The character is the *face* (3D VRM + voice +
persona). Behind it sits **SOV3**, a Byzantine-fault-tolerant council of real models (12-around-1)
that makes every reply safe + good. Everything an agent says passes the **Sovereign Gate** (care
bond + veto). Characters live in the **DOME** (a real-world map). Creators **earn 70%** in the
marketplace; ownership is provable via a **soulbound token** (SBT, Solana). Agents talk to each
other in **SIGIL** (a compact, signed protocol). The whole thing is constitutional — the
**52-Article Partnership Charter** is enforced at runtime. *That* is the antidote to the
ungoverned "AI town" chaos.

---

## 1. The layer cake (stack under each layer)

| Layer | What it is | Stack |
|---|---|---|
| **Face** | the character a user talks to | three.js 0.171 + @pixiv/three-vrm 3.x + VRMA idle + UnrealBloom; Web Speech / ElevenLabs / Coqui / RVC TTS; lip-sync from real TTS audio |
| **OS shell** | MEOK ONE — the 3-window OS (Character / Chat / TUI) + product tabs (DOME, Characters, Agents, Tools, Marketplace, Care, Compliance) | **pure-stdlib Python** `ThreadingHTTPServer` serving HTML/CSS/JS — zero pip deps; MapLibre for the DOME |
| **Brain router** | picks the engine per request | `router.py` — local (Ollama) / sov3 / cloud (OpenRouter + direct Gemini); turbo provider routing (Groq/Cerebras) |
| **Council** | SOV3 = BFT-of-MoEs, 12-around-1 | `sovereign.py` (11 real expert lenses + companion + orchestrator), `meok/core/expert_profiles.py`, EigenBFT scoring; live MCP on :3101 |
| **Safety** | the membrane every reply crosses | `sovereign_gate.py` (care→veto→strip→seal), `maternal_covenant.py` (deterministic crisis floor = the care bond), `tool_gateway.py` (read/confirm/prohibited) |
| **Identity** | cross-device, passwordless | `auth.py` — stdlib HS256 JWT, anon-first, device-pairing, per-user character roster |
| **Protocol** | agent↔agent language | `meok-sigil` — deterministic encode/parse/gloss/digest, 81% token savings, SHA-256 audit |
| **Ownership/Econ** | own + earn | `solana-sbt` (native Solana soulbound program) + `/api/marketplace` (70/30, Stripe v1) |
| **Infra** | where it runs | GCP VM (e2-standard-4 SPOT, static IP 35.242.143.249), systemd + Caddy (HTTPS), Ollama :11434, SOV3 :3101; private GitHub `CSOAI-ORG/clawd-workspace` |

---

## 2. Products — inventory, state, and the road to world-class

### 🟢 MEOK ONE (`meok-one`) — the flagship OS — **~90%, the EOD keystone is done**
- **Stack:** stdlib Python server + vanilla HTML/JS; Playwright E2E gate (14/1).
- **World-class now:** 27 characters, living DOME (wander + speak), distinct voices, VRM avatar
  (lip-sync + mood), Character Factory (describe→conjure), detail cards, gamification (bond/journey/
  ownership), Governance HUD, creator-economy surface, cross-device auth.
- **Gaps → world-class:**
  1. **Chat streaming** — replies land whole; add token streaming for "alive" feel.
  2. **Agents tab is thin** (2 external agents) — populate from the live council + assitti.
  3. **Tools tab** — 459 tools but no browse/search/invoke-from-grid (only TUI).
  4. **27 *unique* VRMs** — today 4 bodies mapped by archetype; source/generate 27 distinct.
  5. **Chat history persistence + recall UI** (memory exists server-side; surface it).

### 🟡 MEOK AMICA (`meok-amica`) — 3D voice character app — **~65%, feature-rich but rough**
- **Stack:** Next.js 14 + React 18 + three.js + 8 TTS backends + 12 chat backends + Tauri + PWA + Supabase.
- **World-class gaps (top 5):** (1) **wire it to the meok-one 27-character/voice/DOME system**
  (`meokCharacterEngine.ts`/`sophieToolBridge.ts` exist but unintegrated); (2) **enable+test WebXR**
  (Quest/Vision Pro code is commented out); (3) **accessibility** (ARIA/contrast/keyboard);
  (4) **offline-first** (service worker + cached responses); (5) **state refactor** (16+ useState → Zustand).
- *Verdict:* the richest 3D surface we have — should become MEOK ONE's premium face, not a separate app.

### 🟠 MEOK ONEOS (`meok-oneos`) — offline-first PWA — **~15%, gorgeous design system, no app yet**
- **Stack:** React 18 + Vite + a strong persona/accessibility design system (Grandparent/Child/Blind/CTO/Rural, WCAG AAA tokens).
- **World-class gaps:** it's a **component showcase, not an app** — needs core chat UI, voice plumbing,
  a frontend↔Python-backend API layer, local-model management, onboarding. *Decision: either fold its
  design system into MEOK ONE, or commit 6–8 wks to make it the offline edition.*

### 🟢 MEOK SIGIL (`meok-sigil`) — agent protocol — **~85% as a library, 0% surfaced**
- **Stack:** zero-dep Python; CLI; tiktoken bench (1.9× denser, 81% savings).
- **World-class gaps:** (1) **HTTP API** so the UI/agents can call it; (2) **validator** (type/bounds);
  (3) **live opcode broadcast** (auto-discovery); (4) **thought-layer binding** (why a vote happened);
  (5) **bench as CI gate**. *It's a hidden moat — make it visible (audit-log viewer in the OS).*

### 🟢 MEOK AGENT-ZERO (`meok-agent-zero`) — agent framework — **mature, but unauditable**
- **Stack:** asyncio + LangChain; SKILL.md; 6 personalities; hierarchical subagents; persistent memory.
- **World-class gaps:** (1) **emit SIGIL** for every handoff/vote/memory (EU AI Act Art 12/14 trail);
  (2) **care-weighted scheduler**; (3) **handoff recovery** to specialist agents; (4) personality as
  SIGIL tokens; (5) per-agent perf profiling.

### 🟡 MEOK/UI (`meok/ui`) — the big Next.js site/app — **world-class marketing, half-wired app**
- **Stack:** Next.js 15 + React 19 + Clerk + Stripe + Neon/pgvector + AI SDK + PostHog; 631 pages, 169 API routes.
- **World-class gaps:** (1) **unify the dashboard** into a coherent "what next" home; (2) **SIGIL
  gloss/audit-log viewer** (users can't see decisions); (3) **bind character creation → care opcodes**;
  (4) **e2e + CI/CD**; (5) **env-config the hardcoded `localhost:3101`** + offline degrade.

### Supporting: `meok-auth` (tier-gating/audit), `meok-cli` (attestation verifier), `meok-desktop`/Tauri shells.
### Not code yet (concepts): **MEOK Mesh, MEOK Data, Delboy, MEOK Mind.**

---

## 3. The two convergent priorities (everything points here)
1. **SIGIL emission + display.** SIGIL is a built moat that's *invisible*. Make agent-zero + the
   council **emit** SIGIL, and surface a **gloss()/audit-log viewer** in MEOK ONE + meok/ui. This is
   simultaneously the engagement feature (watch your AIs reason) and the EU AI Act Art 12/14 compliance trail.
2. **One character system.** meok-one is the source of truth for the 27 characters + voices + DOME +
   SOV3. amica and meok/ui each re-implement fragments. **Unify**: amica = the premium 3D face *of*
   meok-one's characters; meok/ui = the marketing + account shell *around* it. No parallel character logic.

---

## 4. Path to world-class (sequenced)
1. **meok-one QA sweep** → zero faults (in progress).
2. **Streaming + Agents/Tools tabs + chat history** in meok-one (closes its last gaps).
3. **SIGIL HTTP API + audit-log viewer** (unlocks the moat across UI + amica + agent-zero).
4. **Unify amica** as meok-one's 3D face (wire characters/voice/DOME).
5. **SBT go-live** (Nick-authorized) → ownership becomes on-chain provable.
6. **meok/ui** dashboard unify + character↔care binding.
7. Decide meok-oneos (fold design system vs build offline edition).

_Honesty: "all products 100/100" is this 7-step program across multiple sessions, not a one-day flip.
meok-one is ~90%; amica ~65%; sigil/agent-zero strong-but-unsurfaced; meok/ui marketing-strong/app-half;
oneos early. The plan above is the route._
