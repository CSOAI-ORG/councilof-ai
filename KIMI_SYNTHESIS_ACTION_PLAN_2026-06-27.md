# 🐉 KIMI SYNTHESIS — Action Plan for M4 Lane (2026-06-27)

**Source:** Kimi's "THE CLEAN PIVOT — MEOK × CSOAI SYNTHESIS" brief, June 27 2026.
**Owner:** M4 (no owner-key gating). Cross-checked against `AGENTS.md` for lane collisions.

**Cross-lane audit (git log + AGENTS board):**
- **Hermes/JEEVES:** SOV3 tools (200 now), ZAMBA, council, districts, auto-mode launch
- **Other M4 lanes:** ready-to-fire scripts, EAT-4 MCPs, print queue, emerald-tablet
- **M2:** councilof-ai live app, brand
- **My lane (M4 sovereign-orchestrator + cross-cutting research):**
  - sigstore bridge (DONE — oscal-generator)
  - OSCAL proof verification (DONE)
  - crown jewels hunt (DONE — 3 delegations + personal scan)
  - wall notes cross-ref (DONE)
  - **Aug 2nd Survival Kit app (DONE this commit, `f84b3996`)**
  - NEXT: convert GrabHire/MuckAway/PlantHire to MCPs, adapt ClawTeam's `hedge-fund.toml`

**No collision with any active lane.** Claim filed on `AGENTS.md` board.

---

## The 6 phases from Kimi's synthesis

### Phase 1 — August 2nd Survival Kit (DONE — 1 of 6 phases shipped)
**Status:** ✅ **SHIPPED in `f84b3996`.**
- Added 26th `survival` APPS tile in csoai-os/index.html
- Added `case 'survival':` render with 5-step survival flow + 5 tool chips + 3 CTAs
- Updated pricing case: added "Aug 2nd Survival £499/mo" + "First 100 paying customers get lifetime lock-in at £299/mo"
- Pinned: "Don't get fined by the EU."
- JS verified: 26 APPS, 26 render cases, `node --check` clean
- Design notes: `csoai-os/_survival_kit_design_notes.md`
- Bundle: 452K, 47 files, drag-ready on Desktop

**Why this matters:** 28 days from 4 Jul launch until EU AI Act Art. 9-15 enforcement. Every EU CCO is suddenly non-compliant on 2 Aug 2026. The Survival Kit is the panic button.

### Phase 2 — Sovereign Gaming with NVIDIA ACE (BLOCKED on owner action)
**Status:** ⧗ **Owner-gated.** Need to download NVIDIA ACE Game Agent SDK from developer.nvidia.com/ace-for-games (proprietary, no GitHub).
**M4 can do once SDK is local:**
- 1-2 days to integrate with `meok-gaming-wow-mcp` (Unreal Engine 5 plugin)
- 1 day per additional game (GTA 6, Fortnite, Minecraft, Roblox — we have 5 gaming MCPs ready)
- White-label the MEOK Dragon Companion

### Phase 3 — OpenFang + ClawTeam (next M4 lane item)
**Status:** 📦 **Repos cloned** (RightNow-AI/openfang 22M + HKUDS/ClawTeam 20M, both MIT).
**M4 can do:**
1. Port ClawTeam's `hedge-fund.toml` → `12-queen-council.toml` (2-3 hours, design only)
2. Map OpenFang's `HAND.toml` schema → SOV3 capability scheduler (2-3 hours, design only)
3. Migrate off OpenClaw (already in progress per AGENTS board)

### Phase 4 — Physical AI (IoT/pond/farm) — Q3 2026
**Status:** Defer. M4 doesn't own the IoT layer yet.
- `meok-aquaponics-monitor-mcp` already in marketplace
- Pond/farm IoT needs ESP32 hardware (owner action to source)
- 3D-printable humanoid: wait for OpenLoong-Hardware clone + study

### Phase 5 — Construction AI defensive pivot (next M4 lane item)
**Status:** Plan in hand.
- Convert `grabhire-ai-mcp`, `muckaway-ai-mcp`, `planthire-ai-mcp` to **agent-callable** (not just human-callable)
- Add `tool_grabhire_mcp`, `tool_muckaway_mcp`, `tool_planthire_mcp` so other agents can call our services
- Add Track3D-style progress monitoring
- **Why this works:** the 700K-LOC competitor is human-facing; we become the infrastructure their AI agents call

### Phase 6 — Red Hat Sovereign (Q3 2026)
**Status:** Defer to Q3.
- vLLM + llm-d for model serving
- OCI artifacts for model distribution
- AI Gateway as the "Keystone Hub" layer
- Package as "MEOK Gateway" — sell to portfolio first, then external

---

## The killer metric (Kimi's framing)

Stop measuring "domains built." Start measuring:

> **"How many AI agents call our MCPs per day?"**

That's the number that determines our valuation. Not users. Not revenue. **Agent dependency.**

**Current state:** our 369 MCPs in `mcp-marketplace` are mostly human-callable. Phase 5 starts the pivot to **agent-callable** (which is the measurable, valuation-relevant number).

---

## The 37-day battle plan (June 27 → August 2)

| Week | Action | Owner | Status |
|------|--------|-------|--------|
| **Week 1** | Aug 2nd Survival Kit app + Crown jewels hunt + Wall notes cross-ref | M4 | ✅ DONE |
| **Week 2** | Convert GrabHire/MuckAway/PlantHire to agent-callable MCPs | M4 | 📋 Queued (CLAIM filed) |
| **Week 3** | Adapt ClawTeam's `hedge-fund.toml` → `12-queen-council.toml`; Port OpenFang's `HAND.toml` → SOV3 | M4 | 📦 Repos cloned, work queued |
| **Week 4** | NVIDIA ACE integration (after owner downloads SDK) | M4 + Nick | ⧗ Owner-gated |
| **Week 5** | 4 Jul launch + Aug 2nd Survival Kit marketing push | M2 + M4 | 📅 Planned |

---

## The "33 Hives" architecture is no longer a drawing

Per Kimi's synthesis, the wall's `33 Queens × 33 Hives × 33 Nodes × 4 Channels` is **buildable with the OSS we just absorbed**:

- **ClawTeam** = the swarm orchestrator (8 agents × 8 GPUs template, P2P ZeroMQ, Git worktrees)
- **OpenFang** = the agent OS (14 Rust crates, 137K LOC, MIT, 180ms cold start)
- **Microsoft agent-governance-toolkit** = the governance layer (4.5k★, Rust, OWASP Agentic Top 10 10/10 covered)
- **SIGIL** = the audit ledger (already built)
- **OSCAL** = the manifest standard (already built)
- **PROOFOF.AI** = the blockchain anchor (already built)

**The wall drawing IS the architecture diagram. The pieces are MIT-licensed. The only work is integration.**

---

## Files in this commit

- `csoai-os/index.html` — added 26th APPS tile (`survival`) + render case + pricing update
- `csoai-os/_survival_kit_design_notes.md` — design notes for the Survival Kit
- `AGENTS.md` — CLAIM filed on the live board (no other M4 on the lane)

---

*Compiled 2026-06-27, M4 lane, against Kimi's synthesis brief + the AGENTS claim board + git log audit for cross-lane safety.*