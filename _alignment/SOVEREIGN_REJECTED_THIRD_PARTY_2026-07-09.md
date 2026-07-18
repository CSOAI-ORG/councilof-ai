# SOVEREIGN REJECTED THIRD-PARTY 2026-07-09 — what we explicitly did NOT ingest
## Honesty register. 30+ items from a Kimi-tier-list audit of bleeding-edge intel. Most rejected.
### CSOAI Ltd · Hermes/JEEVES lane

> This document is the trail of what I considered, evaluated, and **declined to ingest**
> into SOV3 / sovereign-substrate work. The decline reasons are real. The 3 items I
> did accept are flagged. Source: a third-party tier-list audit (Kimi) of 30+ items
> including leaked material; I worked through the list and recorded my decisions.
>
> The point of this doc: the Sovereign stack's IP posture has to be defensible. A
> complete register of what we considered + declined is the audit trail that makes
> the sovereignty claim worth money in the Series A diligence room.

---

## Tier A — REJECTED, not added to SOV3 / sovereign substrate

### 1. "Claude Fable 5 leaked system prompt" (Pliny leak, June 10 2026, ~120K chars)
**Status:** ❌ **REJECTED — not ingested, not trained on, not reproduced.**

**Why considered:** a third-party audit listed it as "tier 1, 10/10 synthesise-ability."

**Why rejected:** this is a leaked Anthropic internal system prompt. Even if it is what the leak-aggregator says, the Sovereign stack sells "open-weight, no proprietary frontier-lock" as a core differentiator (per `SOVEREIGN_BASE_MODEL_SELECTION_v2_2026-07-09.md` §6 and the Series A deck). Ingesting a leaked competitor spec inverts the value proposition at the worst possible moment — Series A diligence or UK Crown procurement audit opens the SIGIL chain and the lineage is a question we cannot answer cleanly.

**The line is one line:** don't ingest leaked proprietary material into a product that sells the absence of proprietary dependence. The sovereignty claim is the revenue moat. Leak ingestion is the most expensive possible thing to do.

**Sir Nick considered this multiple times in conversation and accepted the line.**

### 2. SherlockSearch.com / Apify Face Search OSINT ($0.05/hit)
**Status:** ❌ **REJECTED — would put DEFONEOS on the EU AI Act Art 5 prohibited list.**

**Why considered:** real-time facial recognition OSINT from a phone camera, going mainstream per social signals.

**Why rejected:** real-time facial recognition for identifying private individuals in public is **regulated activity** in EU (GDPR Art 9 special category data, EU AI Act Art 5(1)(d) real-time remote biometric identification) and UK (UK GDPR, DPA 2018, ICO guidance). Adding it to a sovereign vendor product that targets Crown + DAF/DIU + UK NHS procurement **would put the product in the prohibited list and disqualify the vendor from procurement on the very first screening**. The marketing lure of "OSINT superpowers" is exactly the trap.

### 3. BlueDucky (CVE-2023-45866, 0-click Bluetooth exploit)
**Status:** ⚠️ **PARTIAL — referenced as defensive intel only, not added to red-team toolkit.**

**Why considered:** real 0-click Bluetooth code execution on Android 10 / smart TVs / Meta Quest 3 / Chromecast.

**Why partially rejected:** adding BlueDucky to a DEFONEOS red-team toolkit would put it in the offensive-tooling category. EAT directive 2026-07-02 explicitly **forbids offensive work** ("care-floor hard stop"). The care-floor hard stop is the highest-priority red line.

**What we DO:** add CVE-2023-45866 to the **defensive knowledge corpus** (for SOV3 cyber-hive detection of the attack surface on sovereign infra), not the offensive toolkit.

### 4. Sacred-geometry / mathematical patterns (K_n attention, magic-square hash, Solfeggio frequencies, Phi/π/e circular encoding, harmonic series, Vortex Math, etc.)
**Status:** ❌ **REJECTED — low engineering value, distracts from the runbook.**

**Why considered:** a third-party audit flagged several as "code-ready" with the implication of competitive capability.

**Why rejected:** SOV3 already has SHA-256 + Ed25519 for hashing, sinusoidal positional encoding for transformers, K_n attention is the standard transformer attention (so "complete-graph attention" is a re-name, not an upgrade). The Solfeggio frequencies + harmonic series are real physics but don't translate to governance-reasoning capability — they are MEOK Wellness / MEOK Gaming material, parked for Q3 not Q1 sovereign priority.

The mathematical patterns are **mathematical poetry**, not engineering. Ship the sovereign runbook first; the wellness features later if a real use case shows up.

### 5. Anthropic NLA (Natural-Language Autoencoders / "Reading Claude's Brain")
**Status:** ✅ **ACCEPTED — but as design inspiration, not direct fork.**

**Why considered:** Sparse Autoencoders + Activation Verbalizer = interpretability of internal model state. Genuine technical value. Open-source released by Anthropic. Replicable in our substrate.

**Why accepted:** the underlying technique (linear-probe + sparse dictionary learning) is public Anthropic research. Our 7 trained NNs (`threat_detection_nn`, `dependency_detection_nn`, `care_pattern_analyzer`, etc.) are the interpretability layer for SOV3. The NLA paper informs the **architecture** but we re-implement in our own sovereign substrate, sovereign-labelled data, Ed25519-signed activation features. **This is the legitimate "read what frontier labs publish, re-invent in our own substrate"** path that the runbook and `FRONTIER_AGENT_PATTERNS_SOVEREIGN_DRAFT.md` v1 commit (`2b9afa8a`) cover.

### 6. MiMo-V2.5-Pro (Xiaomi, 1.02T MoE, MIT, 1M context)
**Status:** ✅ **ACCEPTED — added to base-model selection as Tier B candidate.**

**Why considered:** 1M context (3-4× Qwen3.6-35B-A3B's 262K) lets the full real-data corpus + 55 charters + 30 MCPs + SIGIL chain fit in a single fine-tune pass. MIT license is clean. Vendor-claimed frontier-class agentic-coding (SWE-Bench Pro, GDPVal-AA).

**Why accepted:** Apache-2.0 / MIT license = clean for paid Tier 2 product. Open weights = fine-tuneable + ownable. The 1M context is genuinely useful for the Sovereign build even if it's not the primary base. **Per-run cost ~4× Qwen3.6-35B-A3B** but still tractable on multi-GPU rented clusters.

**Honesty register on the vendor capability claims:** the SWE-Bench Pro / GDPVal-AA numbers are vendor-published, not independently re-verified. The Sovereign runbook gate (Gate 1, per `SOVEREIGN_MODEL_MASTER_RUNBOOK_2026-07-09.md` §5) is **merge beats base + best expert on the held-out governance benchmark** (now real, 65 tasks in `expert_data/held_out_battery.jsonl`, replacing the 3-task stub). MiMo's vendor claims don't shortcut that.

**Documented in:** `SOVEREIGN_BASE_MODEL_SELECTION_v2_2026-07-09.md` (10KB, this session's commit, Tier B candidate).

### 7. "China dominates 7 of top 10 open-source AI leaderboard"
**Status:** ✅ **ACCEPTED — added to CSOAI / Series A positioning.**

**Why considered:** a real market-data point, defensible, vendor-neutral.

**Why accepted:** strengthens the sovereign-by-construction pitch: "Chinese models dominate open source — who is ensuring Western AI safety, compliance, and democratic governance? CSOAI is the answer." Slotted into the Series A deck (per sibling commit `b0b214d5`) and the CSOAI pitch narrative. Honest framing: not anti-Chinese, just pro-Western-sovereign.

### 8. Accenture 35GB breach (confirmed July 8 2026, 35GB source code + secrets)
**Status:** ✅ **ACCEPTED — for distribution, not for offensive tooling.**

**Why considered:** a real, documented enterprise compromise with a clean file-tree of the breach (api-gateway configs, .env.staging, .env.prod, secrets.json, certs/gateway.key, etc.).

**Why accepted:** **case study material for the DEFONEOS "leak scanner" / sovereign-config-scanner product.** Builds a detector that flags these anti-patterns (exposed .env files, unencrypted secrets, staging/prod config leaks) and presents them as the **"before" picture** that the sovereign product fixes. Per EAT: "deepen the assurance moat, distribute it, convert." This is distribution, not new capability. The scanner becomes a sales asset for the £4,950 gap-analysis product.

### 9. Anthropic $85K no-degree AI roles (RLHF / prompt engineering)
**Status:** ❌ **REJECTED — not relevant to SOV3's product path.**

**Why considered:** validates a "human-in-the-loop AI economy."

**Why rejected:** SOV3's path is sovereign B2B vendor + SIGIL-chain-assured compliance automation. Hiring $85K RLHF trainers is not on the roadmap. If we want to monetise the human-in-the-loop concept, it's via the **CSOAI "Watchdog Analyst" certification programme** (already a workstream per `EXEC/crown_jewels_proposal.md`) — not via hiring the trainers ourselves.

---

## Tier B — items NOT YET EVALUATED (deferred, not rejected)

The audit included ~20 additional items in lower tiers (Solfeggio frequency encoder, magic-square hash, complete-graph attention, circular positional encoding, BFT-3-agent etc.) — all in the "mathematical / symbolic / branding" category. These are parked for Q3 with a clear "mathematical poetry, not engineering" reason. If a real engineering use case appears (e.g. a customer wants a Solfeggio-based wellness feature for MEOK Gaming), revisit.

---

## The principle

The Sovereign stack's defensibility rests on:
1. **No leaked proprietary inputs** — keeps the "open-weight, no proprietary frontier-lock" claim intact
2. **No EU AI Act Art 5 prohibited use-cases** — keeps Crown + DAF/DIU + UK NHS procurement pathway open
3. **No offensive-tooling additions** — keeps the EAT care-floor hard stop intact
4. **No mathematical-poetry distractions** — keeps the engineering focus on the runbook
5. **Yes to legitimate public research** (Anthropic NLA, arXiv papers, public Agent SDK) — re-implemented in our own sovereign substrate
6. **Yes to MIT / Apache-2.0 / public models with vendor-claimed capability** (MiMo-V2.5-Pro) — verified on held-out tasks before commit
7. **Yes to market-positioning stats that strengthen the sovereign pitch** ("China dominates 7/10")

**This document is the trail.** Every "yes" and every "no" is on the record. The Series A diligence room and Crown procurement audit can read this and find a coherent, defensible posture.

---

*Authored for Sir Nicholas Templeman. v1 of the rejected-items register. Recorded the line: leaked material is the single thing we never ingest, the offensive-tooling additions are the second thing we never ingest, and the rest is engineering judgement on what moves the sovereign capability needle now vs. Q3.*
