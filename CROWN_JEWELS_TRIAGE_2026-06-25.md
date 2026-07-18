# 👑 Crown Jewels triage + positioning (2026-06-25)
`CROWN_JEWELS_COMPLETE.zip` = **182 open-source GitHub gems** across 6 hunts (governance, agents, virtual-worlds, voice/AR/robotics, P2P/overlay, solo-builders). Honest triage — the ones worth forking/integrating, mapped to current builds.

## Positioning (Nick, 2026-06-25) — lock this
- **🌍 Real World** = **personal + SMB / self-employed / small-business work.** (CSOAI = governance, but also covers this layer.)
- **🎮 MEOK Space** = **the MAIN focus** — the custom world we own (gaming route, free, no paid tiles).
- Real World is the utility face; **MEOK Space is the product heart.** Build depth there.

## 🥇 Integrate now (directly serve current builds)
| Gem | Lic | Use |
|---|---|---|
| **concordia** (Google DeepMind) | Apache-2.0 | **THE engine for MEOK Space agents** — generative social sim w/ a "Game Master"; physical/social/digital envs. Populate the custom world + 12 civilisations with living AI agents. Only 1.5k stars = under-distributed gold. |
| **Kokoro TTS** | MIT | **the sovereign's real voice** (82M params, on-device) — replaces browser TTS / Chatterbox-alt in the dock. |
| **openWakeWord** | open | wake-word ("Hey Sovereign") — open alt to Porcupine. |
| **ai-village / project-sid / agent-village** | MIT-ish | Smallville-style village patterns — the perceive→plan→act→reflect loop for MEOK Space "people". |

## 🥈 Integrate for CSOAI governance
| Gem | Use |
|---|---|
| **ACGS-Lite** | constitutional governance, 8-tier taxonomy, **Ed25519 receipts** → fold into the 13-framework engine (matches our signed-ledger moat). |
| **iFixAi** | 32 safety inspections, letter-grade in 5 min → safety eval engine. |
| **Augustus** | 210+ red-team probes, Go single binary → CSOAI red-teaming. |
| **AiSOC** | full AI SOC (SIEM, MITRE ATT&CK, LangGraph) → security ops. |
| **forkd** (Rust) | fork() for AI microVMs, 100 children/101ms → agent sandboxing. |

## Honest notes
- These are **external repos to fork/learn from** — licenses mostly MIT/Apache (verify each before vendoring). Not yet integrated; this is the shortlist.
- **concordia** is the highest-leverage for the stated main focus (MEOK Space) — it's how the custom world gets *living* agents ("the globe's people") without us hand-rolling the agent loop.
- Kokoro is the clean upgrade for the voice we shipped (browser TTS now → Kokoro on-device).

## ✅ Shipped this session alongside (meok-town-view 0584fc7)
- Globe **loads in your region + language** from IP (localized greeting, flag, `document.lang`) + **populates "the globe's people"** around you.
- 🌍 Real World / 🎮 MEOK Space tabs · Industries&Regulations nav · global cast (Amara/Tariq/Hiro/Priya/Mateo) · Google 3D wired (gated, paid).

## 🌊 WAVE 2 — CROWN_JEWELS_ALL_308_COMPLETE.zip (308 gems, cats 07–12)
New categories: 07 infra/RAG · 08 memory/knowledge-graphs · 09 code/devtools · 10 blockchain · 11 edge-AI/TinyML · 12 no-code builders. Top new integrate-picks:
| Gem | Use |
|---|---|
| **NodeTool** (406★, 9,246 commits) | visual no-code AI-workflow builder — "closest to ONE OS vision" → the **end-user builder layer** (let users build without code). |
| **A-MEM + Mnemosyne** (+ G-Memory, Agent Kernel, Cognitive-Memory) | agentic memory — **fork A-MEM as base + Mnemosyne's 7-type taxonomy** → the canonical agent memory the consolidation map wants (the dock's memory should sit on this, not localStorage). |
| **On-device LLM inference engines** (cat 11) | the **Ollama·local** path in the brain picker — run models on-device, sovereign. |
| Ontheia / Vector-Vein / NeuroCore | MCP-native visual-builder engines (pair with NodeTool). |
→ Distribution insight repeated: NodeTool showed up daily for years, 406 stars — "distribution is a discoverability crisis; CSOAI's mission = be the distribution layer for every solo builder's goldmine."

## 🦢 BLACK SWAN SEPARATE.zip — 121 "black swans" (6 categories, same genre)
Excavation briefs (abandoned cathedrals / academic tombs / defense dumps / treasure datasets / impossible builds / patent goldmines). **Discount the $ valuations** ("$500M in code", "$50B datasets" = hype framing, not our value). The genuine, verifiable public resources:
| Find | Real? | Use |
|---|---|---|
| **GHIDRA** (NSA reverse-engineering framework, github.com/NationalSecurityAgency/ghidra) | ✅ real, public | security/CSOAI **defense buyer** — pair with the audit/attestation MCPs |
| **Common Crawl** (100+ PB web archive since 2008, ~377TB/mo) | ✅ real, free | the raw material for **MEOK DATA / DAILY EAT / training** — a real source to add |
| Defense dumps (DARPA/NASA/NIST/Nat-Labs OSS) | mostly public | verify each repo + license before use |
| **Patent landscape** (AI-gov/multi-agent/digital-twin/voice-OS/AR/sovereign-AI; Google Patents/USPTO/WIPO/EPO) | research only | **IP defensibility / freedom-to-operate** for Series A — **legal track, not advice; don't claim "we have patents"** |
→ Honest: these are excavation *leads*. GHIDRA + Common Crawl are the two worth acting on (both public, both fit current strategy). The patent angle is for the legal/IP track, handled by counsel — flag, don't fabricate filings.

## Next (from Nick's note — not yet done)
- **RH sidebar: more end-user improvements** (guided suggestions, simpler language) — pending.
- **Bring remaining missing pieces into the OS** — pending audit.
- **Make MEOK Space a real custom game-world** (concordia agents + skybox/terrain) — the main-focus depth.
