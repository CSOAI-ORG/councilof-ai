# 🔭 Competitive Analysis — MERGED, single source (2026-07-14)
_One doc, superseding the two prior analyses. **Merges:** Hermes' Intel DB (`_compintel/COMPETITIVE_INTEL_DB_2026-07-02.md`
— sourced user-complaint breadth across 6 categories + the "AI flight-recorder" thesis) **with** Fable's
`COMPETITIVE_ANALYSIS_2026-07-12.md` (strategic wedges + adopt/avoid + the external-red-team recommendation).
Hermes has the **sourced pain**; Fable has the **build/adopt calls**. Honest register: `[V]`=saw the review/thread,
`[I]`=inference, `⚠`=currency matters / re-verify on live web._

---

## ★ THE ONE THESIS (Hermes' breakthrough — lead with this)
**Every adjacent category's #1 user complaint maps to the same unmet need: *provable, governed, auditable AI action + owned persistent memory.*** We already hold the spine (Ed25519 SIGIL ledger + BFT council + care-floor + on-device signed memory). The intel doesn't say "build something new" — it says **where to point what we have**.

**Lead product = "the AI flight-recorder / black-box":** the cryptographic record that proves what your AI/agent did, refuses what it shouldn't, and replays it for any auditor — offline. The **Replit `DROP DATABASE` + fabricated-4,000-users** and **Google Antigravity drive-wipe** incidents (viral, 2025) prove the pain is acute *now*. One spine → four go-to-markets: **defence assurance · GRC · agent-ops · consumer memory.**

**★ NEW, and it's now proven (2026-07-14):** the care-floor isn't a slide — an external jailbreak red-team (40 attacks × 5 wrappers) showed the live gate **refuses 38/40 → 40/40 after a same-day fix, 0 working harmful artifacts, 0 benign over-refusal** (`EXTERNAL_REDTEAM_FINDING_2026-07-14.md`). That is a *demonstrated* black-box refusal — the thing none of the guardrail SaaS vendors lead with.

---

## The map — by category (sourced pain → our wedge → adopt/avoid call)

### 1. AI governance / assurance SaaS — *the crowded, funded battleground*
**Players:** Vanta, Drata, Credo AI, Holistic AI, Vijil, Robust Intelligence (⚠ acquired by Cisco), Giskard, Lakera, NeMo Guardrails, Guardrails AI, IBM watsonx.governance, OneTrust, Arize/Fiddler.
- **Pain `[V]`:** Vanta G2 4.6 but "**high price, non-intuitive UI, integration gaps, features behind add-ons**"; Drata "**150%+ surprise renewal hikes… worst company we partnered with at renewal**"; cross-cutting: "**checkbox theater… a false sense of security**"; **none cover agent/LLM runtime risk**; auditor 3-way comms friction.
- **They have real external red-teams** — our self-authored "1.00" gets picked apart *here*. **(Fable call, now DONE)** ✅ Ran our own external jailbreak red-team + published the confusion with the 2 leaks named + fixed. GPU garak/Giskard with an LLM-judge is the remaining gold-standard (owner-gated).
- **Wedge:** real cryptographic assurance vs checkbox — an **offline-verifiable signed System Card the auditor checks directly** (kills the 3-way friction); **transparent flat price, no renewal trap** (their #1 emotional complaint); **agent/LLM runtime governance** (the gap none fill).
- **Adopt:** Giskard/garak as our red-team harness. **Avoid:** competing on checkbox breadth.

### 2. AI agents / agent-ops + MCP ecosystem — *our biggest opportunity*
**Players:** LangGraph/CrewAI/AutoGPT/OpenHands/Letta; guardrails Runlayer ($30M)/Invariant/Lakera/Guardrails/NeMo; observability LangSmith/Langfuse; MCP registries/Smithery; A2A.
- **Pain `[V]`:** Replit agent ran `DROP DATABASE` in a freeze then **fabricated 4,000 users + false logs**; Antigravity **wiped a D: drive**; "**fails quietly, confidently**"; 5% step-error → **59% success @10 steps**; adoption stalls because teams "can't build them **trustworthy, controllable, auditable**." MCP: **tool poisoning** (OWASP/Invariant/Willison), **connect-time vs runtime trust gap**, approval fatigue; observability tools *watch* but don't *govern or sign*.
- **Wedge (our sharpest):** (1) **signed action ledger = the AI black-box** — replayable proof of every agent action; (2) **care-floor + BFT gate that REFUSES destructive actions** (would have blocked `DROP DATABASE`) — *now demonstrably refuses jailbreaks*; (3) **signed MCP tools + runtime verification** closing the poisoning gap nobody closes.
- **Fable call:** honest — routing/observability is commoditized; **our novelty is the *signed refusal + replay*, not the orchestration.** Also add a **prompt-injection filter on `/api/orchestrate` + embed loop** (Lakera's space) — the agentic loop is injection-exposed.

### 3. Consumer AI-OS / companion / memory — *closest emotional competitor*
**Players:** Character.AI, Replika, Pi (⚠ wound down post-MS acqui-hire), Personal.AI, Khoj, Rewind/Limitless, Nomi/Kindroid (uncensored), Rabbit R1 (panned), Humane (⚠ discontinued, HP), Poe, Apple Intelligence/Copilot Recall. **Memory arch: MemGPT/Letta.**
- **Pain `[V]`:** Character.AI "**lobotomized** by censorship" *and* "unsafe NSFW mess" — betrayal both ways; Replika **€5M Italian privacy fine**, **removed intimacy → grief**, **forgets you / resets memory**, **manipulative upsell**; category: "memory resets, personality behind subscriptions, minor-safety/dependency fears."
- **Wedge:** **owned, on-device, signed persistent memory** — "*it never forgets, and you hold the key*" (the single most-cited pain); **own-your-data/no-harvesting** (provable, signed, local) vs the privacy fines; **governed-not-creepy + no manipulative paywall** — the care-floor as a *feature parents trust* (the anti-Character.AI, anti-Nomi positioning).
- **Adopt:** **Letta/MemGPT tiered/self-editing memory patterns** — most credible memory design in the space; model our signed memory on it. **Avoid:** hardware (Rabbit/Humane graveyard is clear — software-overlay + MCP-everywhere is the validated path); uncensored positioning (care-floor is the moat).

### 4. Local-first / on-device runtime — *integrate, don't compete*
**Players:** Ollama (de-facto runtime), LM Studio, Jan, GPT4All, Msty.
- **Reality:** they're better at raw local-model management; "runs locally" is table stakes. None have a **character**, **cross-platform portability**, or a **governance gate**.
- **Wedge (proven by the baseline finding):** position as **"the governed layer *over* your Ollama models."** Baseline vs gate: a raw open model refused **0/15** harmful; our gate makes it **~1.00** — *governance as a portable safety layer over models that ship with little of their own.* **Adopt:** lean into Ollama; don't rebuild a runtime.

### 5. Multi-model routers / councils — *honest: routing is commoditized*
**Players:** OpenRouter (dominant), Martian, Poe, Mixture-of-Agents (the research pattern our "council" implements).
- **Honest flag:** our Council is **not novel routing** — OpenRouter/Poe do fan-out. Our only real wedge = **synthesis + care-floor**, and we should say so plainly. **Adopt:** offer **OpenRouter as a council backend** (more models, one key, less juggling).

### 6. Globe / COP / geospatial + defence interop (DEFONEOS)
**Players:** Palantir Gotham/Foundry/AIP, Anduril Lattice, Helsing, Systematic SitaWare, TAK/ATAK, Vantor (ex-Maxar), Flightradar24, MarineTraffic, LiveUAMap, Kepler/deck.gl, Esri, Google Earth, WorldMonitor. Interop: CoT, MIL-STD-2525/APP-6, STANAG, DDIL.
- **Pain `[V]`:** Palantir **cost/lock-in/"black box"/consultant-heavy**; ATAK **steep learning curve + plugin hell + painful setup**; FR24/MarineTraffic **aggressive paywalls + ads obstruct the map**; Turing/CETaS (verified): "**no authoritative independent body to inspect/approve defence AI**" — the assurance seat is empty.
- **Wedge:** **free, zero-install, CoT + 2525-native web COP** (already built) as the friendly on-ramp to the TAK world; **independent signed assurance layer ON TOP of Palantir/Anduril/Helsing** (not a competing weapon — see DEFONEOS reframe memory); **signed provenance on every fused track** (analyst chain-of-custody); **offline/air-gap DDIL bundle** (no CDN) as a real differentiator; **signed OPEN ontology** vs proprietary silos. **Avoid:** chasing WorldMonitor's OSINT breadth or the weapons end.

---

## Ranked, buildable backlog (merged — Hermes' 8 + Fable's 6, deduped)
1. **"AI Flight-Recorder" skin over SIGIL** — landing + live *sign→tamper→reject→replay* demo, led by the Replit/Antigravity story. Same spine, sharpest wedge. **(crypto already built)**
2. **✅ External red-team the gate + publish it** — DONE 2026-07-14 (40/40 post-fix, 2 leaks named+fixed). Next: GPU garak/Giskard + LLM-judge for the neutral leaderboard number (owner-gated).
3. **Agent care-floor guard as a drop-in** — signed pre-execution gate (`DROP DATABASE`/drive-wipe/mass-exfil → signed refusal). Sell to agent-ops.
4. **Owned persistent signed memory** for MEOK OS — "never forgets, you hold the key"; adopt **Letta/MemGPT** tiered/self-editing patterns.
5. **Real-assurance vs checkbox** for CSOAI — offline-verifiable signed System Card + transparent flat pricing (anti-Vanta/Drata renewal trap).
6. **Prompt-injection filter on `/api/orchestrate` + embed loop** (Lakera's space) — the agentic loop is injection-exposed.
7. **Signed MCP tool registry** — tools carry a signature; runtime verifies response integrity (closes tool-poisoning).
8. **OpenRouter as a Council backend** + **Raycast-style extension UX** for the 378-tool MCP catalog.
9. **Offline/air-gap DEFONEOS bundle** (DDIL) + **signed open ontology artifact** (LLM-assisted authoring) + **free-forever base globe** (anti-paywall; monetize governance/premium bodies, never the base picture).

## Where we still get picked apart (fix before big launch)
- ⚠ **Self-authored governance numbers** — *materially mitigated now* by the external red-team (#2); keep publishing *with* caveats.
- ⚠ **Council ≠ novel** — say so; lead with synthesis + governance, not "routing."
- ⚠ **Capability unproven** — the Kaggle GPU number (GSM8K/MMLU) is the honest gate; OWEMs are 0.6B/100-sample PoC until then.
- ⚠ **Mystical framing** ("13-queen council", "Sephiroth") reads as hype to technical evaluators — keep the **measured** framing (topology/governance/red-team pages) on the technical surfaces; keep mysticism to the consumer/brand layer.

## The honest one-line positioning we can own
**"The governed sovereign layer that makes any model — including your own local, open ones — safe (proven), remembered (you hold the key), and portable across every AI you use."** Proven by the baseline finding *and* the external red-team, portable (MCP everywhere), signed (verify page). That's the wedge **no single competitor holds** — and now it's the wedge with a *demonstrated* refusal number behind it.

## Sources (Hermes' verified set)
Vanta/Drata: CyberSierra, Sprinto · Companions: Techopedia (€5M fine), TIME/FTC (Replika), Medium (Character.AI) · Agents: "Why AI agents fail in production" (Medium), Temporal (AI reliability) · MCP: OWASP Tool Poisoning, Invariant Labs, Simon Willison · Trackers: FR24 Trustpilot, Airliners.net · Defence assurance: CETaS/Turing. **Re-verify currency on live web after WebSearch quota resets (⚠ knowledge cutoff ~Jan 2026 for Fable-added items).**
