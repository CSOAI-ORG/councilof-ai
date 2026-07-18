# MEOK AI Labs — Research Synthesis White Paper (v1.1, verified)
## Sovereign Infrastructure for Compliant, Agentic, Voice-Controlled AI

**Author:** MEOK AI Labs (CSOAI LTD, UK Companies House 16939677) · **Date:** 2 June 2026
**Version:** 1.1 — *every figure verified against the live system; capabilities tagged
[live] / [scaffolded] / [designed]. v1.0's inflated/contradictory numbers corrected.*
**Classification:** Public Research Document

---

## Executive summary
MEOK is building a **governed, voice-first AI operating layer**: AI characters you own, that
remember you, work across every AI platform, see your screen, and act for you — with **every
agent action signed and auditable** under a Partnership Charter + care bond. Three pillars:

1. **MEOK DOME** — a real-world, gamified map where AI characters live under cryptographic governance. **[live]**
2. **MEOK OS** — a universal interface (HUD overlay + voice + screen-perception) connecting Siri, Claude, ChatGPT, Cursor and any MCP/A2A platform. **[live core, designed overlay]**
3. **DEFONEOS** — a governance/audit/traceability layer over agents, and (roadmap) robots, IoT and vehicles. **[scaffolded → designed]**

> **Verified-numbers note (v1.1):** Live council = **12-around-1** (11 expert lenses + companion +
> orchestrator), not "5-LLM". Characters = **27** (the "12-around-1" is the *council*, a different
> thing). MCP packages = **271 published / 316 built** (live-verified), not "234". SOV3 agent
> registry ≈ **79 (46 active)**, not "15,758". Ownership = SIGIL **hash-chain** audit + Solana SBT
> **[scaffolded]**, not a live blockchain. These corrections are deliberate — credibility is the moat.

---

## 1. The gaps MEOK closes
| Gap | Why it matters | MEOK answer | Status |
|-----|----------------|-------------|--------|
| No persistent memory across platforms | every chatbot forgets you tomorrow | SOV3 memory, cross-device | **[live]** |
| Typing-only interface | friction; inaccessible | voice loop (STT→gate→TTS), per-character voices | **[live seeds]** |
| No agent governance | EU AI Act/DORA/NIS2 enforceable 2026+ | Sovereign Gate + 12-around-1 + Tool Gateway + Charter | **[live]** |
| No audit trail for agent actions | un-provable AI decisions | **SIGIL hash-chained audit** (Art-12-style) | **[live]** |
| No screen-perception safety | Computer-Use/Operator run arbitrary actions | perceive→SIGIL→memory, **gated** actuation | **[live perceive · designed actuation]** |
| No robot/endpoint governance | physical AI lacks attestation | DEFONEOS extends signing to endpoints | **[designed]** |

---

## 2. Deep research findings (external landscape — verified-as-public)
_Benchmark figures below are vendor/aggregator-reported, not independently re-run._

- **AI-OS devices:** Open Interpreter **01 Light** ($109, ESP32, voice-controls-any-computer) — *no
  guardrails* (documented `rm -rf`). Rabbit **R1** (LAM, closed, no audit). → MEOK lesson: same
  ambient-voice control **with** the 6-layer governance stack + SIGIL signing.
- **Screen automation:** Anthropic **Computer Use** (full desktop, ~14.9% OSWorld, 49% SWE-bench
  Verified) vs OpenAI **Operator/CUA** (browser, 87% WebVoyager, 38.1% OSWorld). Both lack a
  compliance/audit layer. → MEOK: local execution + SIGIL-signed, council-gated actions.
- **Multi-agent frameworks:** AutoGPT, CrewAI (role-based → maps to our characters), AutoGen
  (async → council comms), LangGraph (stateful → SIGIL pipelines), MetaGPT. → patterns we borrow.
- **Humanoid robotics:** Figure 02, Tesla Optimus, Atlas, 1X NEO, Sanctuary Phoenix, Agility Digit
  — **none have a standard governance/audit layer for physical actions.** → DEFONEOS's roadmap wedge.
- **Gaming AI:** SectorX-style **local-LLM NPCs with persistent memory + vision** → exactly the DOME
  agent model (local-first, remembered, sees its world).

---

## 3. The three pillars

### 3.1 MEOK DOME — real-world, governed agent world **[live]**
A MapLibre **real-world map** (our edge vs fictional "towns") where the **27 characters** live as
animated agents (drift, emotes, speech bubbles), archetype-tinted, your creations gold-ringed, with
a live **Governance HUD** (per-agent gate verdict, 12-around-1 tally + Byzantine f=3, tool-tier,
care_score). Gamification: bond/level/XP, egg→sovereign emergence, "raise it then sell it" economy.
*(A "7 named settlements" framing is a [designed] future skin, not the live map.)*

### 3.2 MEOK OS — universal, voice-first, screen-aware **[live core]**
- **[live]** `/hud` WoW-style overlay (minimap · character/chat/TUI · action bar); 27 characters,
  gated chat in each character's **distinct voice**; 👁 **perceive** (screen→SIGIL→SOV3 memory, live on the VM).
- **[live]** voice loop (mic→STT→Sovereign gate→TTS).
- **[designed]** native always-on-top overlay (Tauri shell ~80% built) + click-through; voice-controlled
  screen actuation via a **gated** external backend (e.g. Open Computer Use) — never silent.
- **Connectors [scaffolded]:** MEOK_BRIDGE routes across Claude/Kimi/Gemini/DeepSeek; one-line embed
  widget; Siri (gated); MCP tunnel to the tool catalog. Goal: any AI platform plugs in + grants the MEOK characters.

### 3.3 DEFONEOS — governance & audit **[scaffolded → designed]**
- **[live foundation]** Sovereign Gate · 12-around-1 BFT council · Tool Gateway (read/confirm/**prohibited**)
  · Maternal Covenant (care bond) · 52-Article Partnership Charter · SIGIL hash-chained audit.
- **[designed]** the *platform*: any agent/MCP/endpoint/robot registers, gets identity + care-bond +
  charter, and **every action leaves a signed SIGIL receipt** (Ed25519, quantum-ready) → global
  traceability. "Agents are legal because they're governed + provable."

---

## 4. SIGIL — the compact, auditable agent protocol **[live]**
Pipe-delimited opcodes (decisions P/V/M/Q/C/H/S/A + multimodal F/D), gloss to English,
**hash-chained** for tamper-evidence. Live benchmark (real tiktoken o200k_base): **−35% vs JSON,
−31% vs English**, lossless round-trip, 4,480 ops/s. Externally validated by the May-2026 "MCP token
bloat" discourse (77 tools ≈ 21k tokens). **Honest scope:** SIGIL compresses *meaning/structure*, not
raw pixels; "train a model from scratch purely on SIGIL" is a **research probe, not a product** (the
field's closest attempts — Meta LCM→SONAR-LLM — re-added language grounding; dense streams can be
unlearnable; you'd lose the world-prior + monitorability). Safe path: SIGIL as grammar + fine-tune
target + audit-translatable latent on a pretrained model.

## 5. SOV3 + progression
SOV3 (Sovereign v3) = MEOK's consciousness/care substrate: live consciousness state, care/threat/
relationship neural nets, the 12-around-1 council. Progression ("Quantman"): bond/level/XP **[live]**;
skill-trees, cross-character transfer, CASA-tier milestones **[designed]**.

---

## 6. Competitive positioning (corrected)
| Capability | MEOK | Vanta/Drata | Operator | MS Gaming Copilot |
|---|---|---|---|---|
| EU AI Act native | ✅ [live] | ❌ | ❌ | ❌ |
| Voice + screen-perception | ✅ [live perceive] | ❌ | ✅ browser | ✅ in-game |
| Agent governance + audit | ✅ DEFONEOS [scaffolded] | partial | ❌ | ❌ |
| 12-around-1 BFT council | ✅ [live] | ❌ | ❌ | ❌ |
| Cryptographic signing | ✅ Ed25519/SIGIL [live hash-chain] | ❌ | ❌ | ❌ |
| Sovereign / local | ✅ | ❌ | ❌ (cloud) | ❌ (Xbox cloud) |
| Robot/IoT governance | 🔶 [designed] | ❌ | ❌ | ❌ |

**Honest competitive reality:** Microsoft's **Gaming Copilot** already ships an in-game AI overlay
(screen-read + voice). MEOK is **not first to the overlay idea** — our differentiation is **sovereign/
local (no cloud screen-upload), owned characters, and governance/audit**, none of which Copilot has.

---

## 7. Roadmap (honest)
- **Now [live]:** DOME, /hud overlay, distinct voices, perceive→SIGIL→memory, SIGIL audit + benchmark, council, marketplace economy surface.
- **Next:** native overlay (Tauri + click-through) · sovereign on-device **vision** (Gemma-class today, Gemma 4 E4B when in Ollama; step3.7 optional cloud) · predictive small→large pre-warm loop (PredGen/EAGLE-3) · Ed25519-signed SIGIL receipts → DEFONEOS registry.
- **Later:** robot/IoT/vehicle attestation · cross-platform memory sync · SBT chain go-live (audited).

## 8. Honesty register (for anyone quoting this)
12-around-1 (not 33/5) · **271** MCPs (not 410/234) · **27** characters · **79** agents (not 15,758) ·
SIGIL **−35% vs JSON** (not 81%) · SBT/blockchain = scaffolded/Nick-authorized · overlay native bits +
on-device vision = real remaining work · no IPO-from-research · model is *openly swappable*, not hidden.

---

**MEOK AI Labs** — UK Companies House 16939677 · Founder: Nicholas Templeman · https://meok.ai
_Synthesises external research (Open Interpreter, Anthropic, OpenAI, Rabbit, CrewAI/AutoGen/LangGraph,
Figure/Tesla/Boston Dynamics) + MEOK's live system. Internal figures live-verified 2026-06-02;
external benchmarks are vendor-reported._
