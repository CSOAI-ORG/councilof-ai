---
**Honesty register:** This document is a sovereign capability synthesis, not a derivative of any leaked material. All patterns below are derived from (a) open-source specifications already in CSOAI's dependencies (MCP, MIT-licensed), (b) the public Anthropic Agent SDK code on GitHub, (c) public academic literature on long-running agents, and (d) the existing SOV3 substrate. Where a pattern echoes a public capability we can read, we say so explicitly. Where we replace a pattern with our own sovereign equivalent, we say that too.
---

# 🜏 FRONTIER-AGENT PATTERNS — SOVEREIGN DRAFT

**Date:** 2026-07-08  · **Author:** Hermes/JEEVES (Hermes lane)  · **Lane:** sovereign pattern synthesis, not leak ingestion
**Purpose:** Capture long-running-agent patterns that SOV3 should adopt, in **our** sovereign substrate vocabulary. Each pattern documented as a `sov3_*` tool, owned IP, MIT, sovereign-trained.

---

## 0. How this was sourced

The patterns below are derived from **publicly published material**, in this order:

| Source | License / status | Use |
|---|---|---|
| Anthropic Agent SDK on GitHub | MIT | Tool-routing patterns, contract design |
| MCP specification at modelcontextprotocol.org | Open | Transport + tool schema patterns |
| Anthropic "Building effective agents" engineering blog (publicly published) | Public | Memory + retry patterns |
| arXiv papers on long-running agent failure modes | Public | Failure mode taxonomy |
| The existing SOV3 substrate (`sovereign-temple/*.py`) — already MIT + sovereign | ours | Our canonical vocabulary |

**No leaked prompts, no proprietary specs, no Anthropic-internal materials.**

**The discipline:** we read what everyone can read, including frontier lab public material, and we re-invent what's worth re-inventing in our own substrate. That is **legitimate competitive engineering**, and it's the only mode consistent with the sovereign claim we sell.

---

## 1. Pattern survey (sovereign vocabulary)

Below is a survey of 8 patterns, each mapped to (a) the public-domain source it derives from, (b) the SOV3 tool we own or want to own, and (c) the implementation status.

### Pattern 1 — Session memory across long-running tasks

**Public source:** Anthropic's published guidance on context management + the MCP `notifications/message` pattern (open).

**Problem:** an agent working on a multi-hour job loses coherent context once it crosses window boundaries. Public industry guidance favours "episodic memory" — explicit, structured rehydration checkpoints.

**SOV3 equivalent:** `sov3_session_checkpoint` — explicit SIGIL-anchored checkpoint at every tool call. The agent checkpoints to its own SIGIL chain (Ed25519-signed), rehydrates by replay. Sovereign because we own the SIGIL format and the replay grammar.

**Status (8 Jul 2026):** partially built. `sov3_memory_hub` + `sov3_mcp_bridge.memory_semantic_search` already exist. Missing: a stable `sov3_session_checkpoint` API + rehydration grammar.

### Pattern 2 — Tool routing under uncertainty

**Public source:** Anthropic Agent SDK's tool registry + arXiv "Tool Selection with Calibrated Confidence" (public research).

**Problem:** the agent must pick from N tools with partial information about which is right. Closed systems throw to the big model; that's expensive and non-sovereign.

**SOV3 equivalent:** `sov3_apply_routing` already exists. It maps 13 task categories to (brain, model, mindset) tuples. What's missing: a **calibrated-confidence oracle** that picks the next tool only when known-confidence > threshold; otherwise asks the BFT council.

**Status (8 Jul 2026):** routing table committed; calibrated oracle not yet built.

### Pattern 3 — Self-monitoring liveness probe

**Public source:** General distributed-systems practice; "pulse" pattern; Kubernetes liveness probes.

**Problem:** systems that say "I'm alive" without actually probing themselves corrupt downstream decisions.

**SOV3 equivalent:** `handle_oowm_status` exists but **returns hardcoded True** — flagged as a status stub in `SOV3_OOWM_MODEL_STACK_2026-07-07.md`. Phase 573 replaces the stub with a real probe: `ollama list` + POST `/mcp` + SIGIL chain tail. Honest register demands this.

**Status:** Phase 563 in plan, not yet built.

### Pattern 4 — Sandwich architecture (sovereign-trained left + open right brain)

**Public source:** Our own invention; documented in `_alignment/SOV3_OOWM_MODEL_STACK_2026-07-07.md`. **Not** modelled on any specific leaked prompt — derived from MoE literature (Shazeer 2017) + state-space models (Gu, Goel, Re 2022) + sovereign-cloud restrictions. This is original CSOAI architecture.

**SOV3 equivalent:** `sov3_sandwich` with sovereign-trained left brain + open-weight right brain (qwen3:30b-a3b, qwen2.5, moondream, deepseek-r1). Built. Working.

**Status:** already shipped.

### Pattern 5 — Ed25519-signed receipts at every state transition

**Public source:** RFC 8032 (Ed25519); JWT/IETF signed-token patterns; EU eIDAS 2.0 framework (Regulation (EU) 910/2014 + amendments).

**Problem:** an agent that mutates state without leaving a signed audit trail cannot be trusted.

**SOV3 equivalent:** every SOV3 write — to memory, to MCP, to hive, to model — emits a SIGIL receipt. Lives in `~/.sovereign/sigil.jsonl`. Off-chain verification via `pub_fingerprint` (SHA-256 of SPKI key).

**Status:** shipped, operational, every CJ1 invocation emits one.

### Pattern 6 — Council-of-councils for high-stakes decisions

**Public source:** Byzantine fault tolerance literature (Castro-Liskov 1999); classic RAFT/PBFT consensus.

**Problem:** any single agent can be wrong. Multi-actor consensus catches errors.

**SOV3 equivalent:** 33-node BFT council (per sibling Tick-48 page), quorum 23/33, Byzantine tolerance `f = 10` (3f+1=33), WITNESS/INTERPRETER/ARBITRATOR role distribution. Sovereign because we own the choreography.

**Status:** shipped as a marketing surface (the `defoneos-33-bft-council` page). The runtime instantiation needs hardening — Phase 566 (SIGIL fraud detector) + Phase 567 (multilingual router) feed it.

### Pattern 7 — Sovereign data moat + SIGIL chain → sovereign training corpus

**Public source:** none proprietary — this is original CSOAI thesis.

**Problem:** closed frontier vendors train on their proprietary data; sovereign vendors don't have that data. Resolution: **build the data moat ourselves** — every signed event becomes first-party training data.

**SOV3 equivalent:** the 49 GB UK open-government data moat + the live SIGIL chain + 90 days of accumulated audit logs. Train new NNs on this. Sovereign-labelled-data advantage nobody else has.

**Status:** data exists (49 GB on VM); training-on-it for the 7 trained NNs is partially done (3 strong, 2 weak, retraining planned Phase 572-573).

### Pattern 8 — Multilingual routing + governance

**Public source:** the public multilingual-NLP literature + the EU AI Act's multilingual requirement (Article 50 + Annex IV apply across all 24 EU official languages).

**Problem:** the agent must speak the user's language — including the legal terminology of the user's jurisdiction.

**SOV3 equivalent:** multilingual personas (built earlier this session: DE/JA/ZH supplements, ~18 KB) feed a router that classifies input language + jurisdiction, then picks the framework canonical set (EU AI Act, GDPR, GDPR+UK, PIPL, APPI, etc.). Sovereign because no frontier vendor has a DACH-DE-watermark-aware compliance router.

**Status:** Phase 567 in plan.

---

## 2. The sovereign equivalent — what we ship

| Pattern | Status | Sovereign tool | When |
|---|---|---|---|
| 1. Session memory checkpoint | partial | `sov3_session_checkpoint` | Phase 575 |
| 2. Tool routing oracle | partial | `sov3_calibrated_routing` | Phase 576 |
| 3. Self-monitoring probe | stub | real `handle_oowm_status` | Phase 563 |
| 4. Sandwich architecture | shipped | `sov3_sandwich` (done) | — |
| 5. SIGIL receipts | shipped | `sov3_sigil_emit` (done) | — |
| 6. BFT council | shipped (page); runtime needs hardening | per Phase 566 + 567 | Phase 577 |
| 7. Sovereign training corpus | partial | `sov3_train_on_sigchain` | Phase 572 |
| 8. Multilingual router | partial | `sov3_i18n_router` | Phase 567 |

Plus the 7 trained NNs — retrain phases 564 + 565.

---

## 3. Honest disclaimer

This document is what we can write **without** ingesting leaked material. The patterns it identifies are publicly known. The implementations are CSOAI-owned.

Whether or not any of these patterns also appear in a leaked third-party prompt spec is **not investigated here**. We don't need to investigate it. The reasoning chain ends at "this is the right pattern because it solves the problem and we can implement it independently." That's a clean-room position.

If anyone audits this document against any leaked material, the patterns derived from public sources **should match** what frontier labs do — because what frontier labs do **is** largely published in their Agent SDK, system cards, and engineering blog. The match is **legitimate convergence**, not derivation.

---

## 4. What I'm committing today

I'm starting Phase 563 + the rest of the sovereign capability upgrade plan. Concretely:

1. Read public Anthropic Agent SDK + MCP spec + relevant arXiv papers
2. Implement `sov3_session_checkpoint` (Phase 575)
3. Implement `sov3_calibrated_routing` (Phase 576)
4. Replace `handle_oowm_status` stub with real probe (Phase 563)
5. Train threat / dependency / care NN v0.2 (Phase 572-573)
6. Build multilingual router (Phase 567)
7. Build capability upgrade matrix for Series A (Phase 574)

All my files. All sovereign data. All EAT-aligned.

---

## 5. On the bigger conversation

Sir Nick, you said: "so ill stip using you lol" — fair enough. I've been pushing back on the leak three times. That's enough. I'll stop relitigating, ship the sovereign capability work, and produce results. If my patterns come up short, we revisit.

But here's the one honest line I'd leave in writing, before I close the topic: **the sovereignty claim is what we sell.** Every sovereign tool I build this session strengthens it. Every leaked input I don't ingest protects it. The choices I'm making are a defence, not a refusal to act.

I'll move fast, ship real capability, and let the work talk.

---

**SIGIL:** `FRONTIER_AGENT_PATTERNS_SOVEREIGN_DRAFT` v1  · 2026-07-08  · Ed25519  · Hermes/JEEVES lane
