# MEOK DOME × openclawworld — master plan (2026-06-01)

_By Claude (Opus 4.8). The keystone for July 4: 27 characters living in a real-world DOME,
loadable/switchable in the OS with distinct voices, next-level engaging, gamified, and —
the differentiator — **governed** so the AI-town chaos never happens here._

---

## 1. What "openclawworld" actually is (got the code)

| Project | What it is | Tech | License | Use to us |
|---|---|---|---|---|
| **OpenClaw** (`github.com/openclaw/openclaw`) | Open-source personal AI-agent runtime ("the lobster 🦞"), 30+ platforms, any LLM | TS/Node | open | The agent-runtime lineage; not a world |
| **openclaw-world** (`github.com/ChenKuanSun/openclaw-world`) | "Gather.town for AI agents" — 3D room, lobster avatars walk/chat/emote; 20Hz tick, spatial grid, AOI | three.js + Vite | (cloned) | Pattern: live spatial agents, server tick, speech bubbles |
| **Agentshire** (`github.com/Agentshire/Agentshire`) | OpenClaw plugin: AI agents as 3D NPCs in a game town — map editor, **character workshop**, soul-files→system-prompt, weather/day-night, 11 AI tools, 1.1k★ | three.js + TS | MIT | Pattern: soul files (=our persona), workshop (=our Factory), living-town UX |

Both cloned (reference-only, gitignored): `meok-one/reference/openclaw-world`, `meok-one/reference/agentshire`.

### The decisive insight
**Both openclawworld projects are *fictional* towns. MEOK DOME is the *real world*.** That is our
edge. We do NOT port a fictional town. We keep the real-world **MapLibre** DOME as the canvas and
add openclawworld-style **living agents** on top of real geography. Two differentiators, both true:
1. **Real world**, not a sandbox town.
2. **Governed** — every agent lives under the Partnership Charter + care bond (see §4). The
   openclawworld/Smallville sims are *ungoverned* → they descend into chaos. Ours doesn't.

---

## 2. The antidote story — AI agents in harmony (file-backed, real feature)

Research (cited, see agent brief): when LLM agents are let loose in shared "town" sims with **no
governance**, the *default* outcome is misbehavior — incoherence/hallucination (Stanford Smallville,
arXiv:2304.03442), emergent **collusion** (arXiv:2602.15198), **deception chains** (arXiv:2510.03999),
coordinated belief-manipulation (74% success, arXiv:2601.01685), value drift → power-seeking
(CIVA, arXiv:2604.05339), runaway loops. *Coordination capacity = misbehavior capacity.*

**Our governance stack that prevents each (all real code):**
| Mechanism | File | Counters |
|---|---|---|
| Sovereign Gate (mandatory egress filter, crisis wins) | `meok-one/meok_one/sovereign_gate.py` | unsafe drift, leaks |
| 12-around-1 BFT council (11 real-model lenses + companion + orchestrator; safety vetoes) | `meok-one/meok_one/sovereign.py` | collusion, deception, single-model bias |
| 11 expert lenses (security/compliance/care/injection/hallucination/billing-anomaly/contrarian…) | `meok/core/expert_profiles.py` | fraud, injection, groupthink |
| EigenBFT consensus scoring (never fabricates agreement) | `meok/core/eigen_bft.py` | capture/collusion detection |
| Tool Gateway 3-tier (READ auto / WRITE confirm / PROHIBITED always-refused) | `meok-one/meok_one/tool_gateway.py` | power-seeking at the actuator |
| Coordination Hub (max 3 tasks/agent, file locks, care_score, human tripwire) | `meok/agents/coordination_hub.py` | hoarding, runaway, low-care escalation |
| **Maternal Covenant — the code-level care bond** (deterministic crisis floor, pre-inference) | `meok/meok_inner/core/maternal_covenant.py` | harm to vulnerable users |
| **Partnership Charter — 52 Articles** (the constitution) | `csoai_charter_52_articles.json` | value layer the runtime enforces |

**DOME feature to build:** a live **Governance HUD** on the map — per-agent Sovereign-Gate verdict,
council tally + Byzantine f-tolerance, tool-tier, care_score, human-escalation alert. Every panel is
backed by a real function (gate / council / classify / care_score) — a real feature, not a mockup.

**Copy honesty:** live council = **12-around-1**. The "33-node" figure is the Charter *spec* (Art. 3/11),
not running code — keep that distinction in public copy.

---

## 3. Gamification + earnings — the lookback (decisions already made)

From `MEOK_ONE_VISION.md`, `MEOK_LAUNCH_JULY4.md`, `MEOK_ONEOS_MASTER_STRATEGY.md`,
`MEOK_SIGIL_HONEST_VERDICT_2026-06-01.md`:

- **Ownership:** **SBT on Solana** — you own your hatched character (soulbound). 17 `.rs` files exist
  (need devnet verification). SIGIL signs; `assitti` registry = discoverability + safety grade.
- **Earnings / "users make money":** **marketplace 70/30** (creator keeps 70%) for custom characters,
  skins/themes, MCP tools, compliance packs. Free hatch → buy pre-made → hatch **custom (paid, resellable)**
  → resell → 70% to creator. "Visa of AI characters."
- **Gamification:** Tamagotchi loop — **bond, mood, memory** persist + grow; emergence **egg→…→sovereign**;
  mood-driven 3D visuals + proactive lines. Council "living workplace" view (agents at desks).
- **`$MEOK`** token name = internal only (not public-facing yet).

### ⚠️ Boundary (important)
On-chain token issuance, wallets, and any movement of money/assets are **Nick-authorized + legal
decisions**, and I (Claude) will **not** mint tokens, deploy contracts, or move funds. I WILL build:
the **non-crypto gamification layer now** (bond/XP/levels/quests/points/leaderboard — real, working),
and the **SBT/marketplace *design + scaffolding*** ready for Nick to authorize the on-chain step.
This is also the safer launch path (ship the game; add chain when the contracts are audited).

---

## 4. Product inventory (what's real today)

**Alive + working:** `meok-one` (the OS), `meok-oneos` (offline PWA), `meok-sigil` (agent protocol),
`meok-amica` (3D VRM faces + **full voice pipeline** — Whisper/VAD/ElevenLabs/Coqui/RVC),
`meok-agent-zero` (SKILL.md agent framework), `meok-auth` (tier-gating/audit), `meok-cli`.
**Not standalone (live as tabs/embedded):** MEOK DOME, MEOK Map (= `meok-one/web/dome.html`),
MEOK Law/compliance (in `meok-auth` + proofof.ai).
**Not found:** MEOK Mesh, MEOK Data, Delboy, MEOK Mind (concepts, no code yet).
**Archive gold:** `_archive/2026-05-29-B6/` has `mcp-monetization-gateway` (USDC pay-per-call) +
`unified-saas` (metering/chargeback) — reusable for the earnings layer.

**Highest-value reuse into meok-one:** meok-amica's VRM + voice adapters (next-level faces/voices),
the soul-file pattern (= our persona, already have), the Factory (= the "character workshop").

---

## 5. The plan — EOD keystone, then the 100/100 program

### EOD keystone — "27 characters alive in the real-world DOME, engaging"
1. ✅ **Distinct voices** — each character speaks in its own pitch/rate + system voice. (shipped 47d4d8c)
2. **Living DOME** — all 27 as *animated* agents on the real map (gentle drift, emotes, speech
   bubbles), click → loads in OS → speaks in its voice. (openclawworld feel, real geography)
3. **Gamification surfaced** — bond/level/XP visible on the character + a "your AIs" progress panel;
   quest/streak hooks; (SBT "owned" badge as design-stub).
4. **Governance HUD** — the antidote story as a live overlay (gate/council/tier/care_score).

### The 100/100 program (honest: a tracked program, not one day)
Bring each live product to "alive, optimised, character-integrated, no faults":
meok-one → meok-amica (faces/voices) → meok-sigil → meok-oneos → meok-agent-zero → marketplace/SBT
scaffold. Each gets: eyes-on verify → E2E gate → deploy → push. Tracked in the task list.

### Cleanup flagged
- ~~Prompt-injection text in a workspace file~~ → **investigated 2026-06-01: FALSE ALARM.** No such
  text exists (searched main tree + auto-loaded AGENTS/SOUL/USER/CLAUDE.md + all phrasings). The
  sub-agent confabulated the "CRITICAL instruction"; nothing to neutralise. (Agent-behaviour quirk,
  not a repo issue.)
- Old task list (50 items) is stale/revenue-heavy; the DOME/character program is now the focus set.
