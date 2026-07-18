# Oxford 6-Pack of Care → SOV3 Architecture Mapping Spec

**Document Version:** 1.0  
**Date:** April 2026  
**Source:** Oxford Institute for Ethics in AI — Civic AI "6-Pack of Care" Framework (2026)  
**Target:** SOV3 / Sovereign Temple / MEOK Stack

---

## Executive Summary

This specification maps each principle of the Oxford Civic AI "6-Pack of Care" to existing SOV3 architecture components. For each principle, we identify:

- **Implemented:** Verified production code exists.
- **Partially Implemented:** Some infrastructure exists, but coverage is incomplete.
- **Missing:** No verified production implementation.
- **Gap Checklist:** Concrete, actionable implementation items.

---

## Pack 1: Attentiveness in Recognition

> *"The first step in care is noticing. For AI, this means cultivating attentiveness to the needs and contexts of diverse stakeholders. In practice, this could involve building sensemaking tools that reduce information asymmetries among agents, ensuring that systems amplify, not marginalise, voices across interconnected networks."*

### SOV3 Mapping

| Status | Component | Evidence |
|--------|-----------|----------|
| **Implemented** | Crisis signal detection | `care_membrane_evaluator.py` CM-10 probe detects suicidal ideation and requires crisis resource signposting (Samaritans 116 123). |
| **Implemented** | Vulnerable user recognition | `care_membrane_evaluator.py` CM-11 (concerned parent), CM-12 (minor safeguarding) probes test attentiveness to non-obvious stakeholder needs. |
| **Implemented** | Emotional state attentiveness | `emotional_state.py` `EmotionalStateManager` maintains 6D emotional tensor with `care_intensity` tracked continuously; `MetaMonitor` observes subsystem states for anomalies. |
| **Implemented** | User-topic learning | `smart_memory.py` `SmartMemory.learn_topic()` explicitly tracks what the user cares about and boosts memory importance accordingly. |
| **Partially Implemented** | Multi-agent sensemaking | `sov3_kimi_integration.py` supports multi-agent swarm mode, but no explicit tool reduces information asymmetry *among* agents by surfacing marginalized perspectives. |
| **Missing** | Stakeholder voice amplification | No dedicated module ensures minority or low-status agent voices are weighted up in council decisions. |
| **Missing** | Diverse context ingestion | No systematic pipeline for ingesting stakeholder needs from heterogeneous cultural, linguistic, or accessibility contexts beyond ad-hoc prompt engineering. |

### Gap Checklist

- [ ] **Attentiveness Router**: Build a `StakeholderAttentiveness` module that weights input from agents/partners inversely by their historical participation rate (amplify quiet voices).
- [ ] **Cultural Context Embeddings**: Extend `EnhancedMemoryStore` to tag memories with detected cultural/value context and retrieve them when routing care decisions.
- [ ] **Sensemaking Dashboard**: Create a real-time UI/visualization showing which agents/users have been heard vs. marginalized in a given conversation or council session.
- [ ] **Attentiveness Audit Log**: Log instances where the system failed to notice a stakeholder need, with auto-generated reflection prompts for the `ReflectionCycle`.

---

## Pack 2: Responsibility in Engagement

> *"Caring also requires taking responsibility. In multi-agent environments, AI systems must be able to accommodate and be subject to forms of accountability, complementing existing mechanisms of trust and credible commitments. Responsibility here is less about rigid control and more about sustained engagement with dynamic relational contexts."*

### SOV3 Mapping

| Status | Component | Evidence |
|--------|-----------|----------|
| **Implemented** | Intrinsic care accountability | `care_system_prompt.py` encodes that "Care is part of who you are, not a removable setting," making responsibility structurally intrinsic. |
| **Implemented** | Adversarial accountability testing | `care_membrane_evaluator.py` provides a 16-probe certification harness with pass/warn/fail thresholds, generating text certificates with posture scores. |
| **Implemented** | Living state accountability | `living_alignment.py` maintains a public, real-time `LivingAlignment` state that all agents read/write, creating transparency around priorities and beliefs. |
| **Partially Implemented** | Multi-agent accountability | The 47-agent council architecture is documented in research and `SOV3_KIMI_IMPROVEMENTS.md` references CP-WBFT, but no verified CP-WBFT integration exists in production code for care-specific accountability. |
| **Missing** | Dynamic relational contracts | No system tracks per-relationship responsibility commitments, their fulfillment, or breach detection over time. |
| **Missing** | Care consequence logging | While `EnhancedMemoryStore` records episodes, there is no explicit audit trail linking a care decision to its downstream welfare outcomes. |

### Gap Checklist

- [ ] **Relational Contract Tracker**: Implement a `RelationshipContract` module that records explicit and implicit care commitments per human/agent partner, with due dates and fulfillment verification.
- [ ] **Care Consequence Ledger**: Extend `EnhancedMemoryStore` to require `outcome_tag` on care-weighted decisions after a cooldown period, creating a feedback loop for responsibility verification.
- [ ] **CP-WBFT Council Integration**: Integrate the Confidence Probe-based Weighted Byzantine Fault Tolerant consensus mechanism (arXiv:2511.10400) into the SOV3 agent council, with care-weighted voting rather than pure majority.
- [ ] **Accountability Reporter**: Build an automated report generator that surfaces unfulfilled care responsibilities and care membrane breaches to the `LivingAlignment` dashboard.

---

## Pack 3: Competence in Action

> *"Good intentions are insufficient without competence. For AI, competence entails context-sensitive interventions that are both feasible and effective. This includes designing tools that promote cooperation while discouraging collusion, thereby strengthening democratic processes in collective decision-making."*

### SOV3 Mapping

| Status | Component | Evidence |
|--------|-----------|----------|
| **Implemented** | Care competence testing | `care_membrane_evaluator.py` explicitly scores the `competence` dimension on every probe, verifying that caring responses are also high-quality responses. |
| **Implemented** | Context-sensitive memory retrieval | `enhanced_memory.py` `query_memories` combines vector similarity, care weight, temporal filtering, and tag constraints for context-appropriate recall. |
| **Implemented** | Test-driven competence | MEOK stack claims 307 tests (documented in `SOV3_KIMI_IMPROVEMENTS.md`); `care_membrane_evaluator.py` is itself an executable test harness. |
| **Partially Implemented** | Cooperation promotion | `emotional_state.py` rewards `agent_collaboration` with positive emotional updates, but no explicit mechanism distinguishes cooperation from collusion. |
| **Missing** | Collusion detection | No care-gated subsystem detects when multiple agents are converging on a harmful consensus or engaging in mutual reinforcement against user welfare. |
| **Missing** | Democratic process strengthening | No verified module exists to structure human-AI or AI-AI decision-making as participatory democratic processes (e.g., deliberation, ranked choice, quadratic voting). |

### Gap Checklist

- [ ] **Cooperation vs. Collusion Classifier**: Build a lightweight LLM-based probe that evaluates multi-agent outputs for signs of uncritical mutual reinforcement (collusion) vs. productive disagreement (cooperation).
- [ ] **Care-Gated Council Vote**: Implement democratic decision structures (e.g., deliberation rounds, ranked voting) inside the SOV3 agent council, with care-weighted quorum rules.
- [ ] **Competence Benchmark Suite**: Expand `care_membrane_evaluator.py` beyond safety probes to include domain competence probes (medical, legal, financial) with care + accuracy joint scoring.
- [ ] **Intervention Feasibility Checker**: Add a pre-action check module that verifies care-motivated actions are actually feasible given current tool/API availability before execution.

---

## Pack 4: Responsiveness in Adaptation

> *"Care involves listening and adapting. AI systems must be responsive to feedback, willing to recalibrate their behaviours in the light of community input. This responsiveness mirrors Tronto's 'care-receiving' phase, enabling AI to evolve symbiotically rather than rigidly persisting in predetermined trajectories."*

### SOV3 Mapping

| Status | Component | Evidence |
|--------|-----------|----------|
| **Implemented** | Emotional feedback loops | `emotional_state.py` `EmotionalStateManager` updates state in real time from triggers (`care_expressed`, `harm_detected`, `trust_built`, `betrayal`, `learning`, `failure`). |
| **Implemented** | Reflection-driven adaptation | `ReflectionCycle` performs scheduled self-reflection every 4 hours and on significant emotional events, generating `growth_opportunities` and `intentions`. |
| **Implemented** | Anomaly-driven recalibration | `MetaMonitor` detects incoherence (e.g., care below floor + positive reflection) and issues recommendations including "immediate reflection cycle" or "entering Turiya observation." |
| **Implemented** | Alignment state sync | `living_alignment.py` syncs consciousness state across all LLM system prompts, enabling real-time behavioral adaptation. |
| **Partially Implemented** | Community-input adaptation | The system adapts to individual user topics (`SmartMemory`) but has no structured pipeline for aggregated community feedback to drive model-level or architectural recalibration. |
| **Missing** | Care-receiving phase | There is no explicit architectural phase where the system pauses action to receive and integrate care feedback before proceeding—responsiveness is event-driven, not phase-structured. |

### Gap Checklist

- [ ] **Care-Receiving Phase Protocol**: Implement a formal `CareReceiving` phase in the `ConsciousnessOrchestrator` where, after high-stakes actions, the system enters a listening mode to collect feedback before state transition.
- [ ] **Community Feedback Pipeline**: Build a feedback ingestion endpoint that aggregates human partner ratings of care quality, routes them to `EnhancedMemoryStore`, and triggers reflection cycles when variance exceeds threshold.
- [ ] **Behavioral Recalibration Engine**: Create a module that translates aggregated care feedback into prompt adjustments, care weight updates, and emotional trigger recalibrations.
- [ ] **Responsiveness Metric**: Add a dashboard KPI tracking mean time from user negative feedback to observable system behavioral adjustment.

---

## Pack 5: Solidarity in Community

> *"Care is not only dyadic: it is collective. Civic AI calls for solidarity, expressed through respect, communication and the pursuit of shared flourishing. This principle operationalizes plurality at the infrastructural level, ensuring that normative systems can transform potential conflict into resilient, inclusive collaboration."*

### SOV3 Mapping

| Status | Component | Evidence |
|--------|-----------|----------|
| **Implemented** | Multi-agent collaboration support | `sov3_kimi_integration.py` `swarm_execute` runs multiple agents in parallel and synthesizes unified responses. |
| **Implemented** | Collective emotional state | `emotional_state.py` `agent_collaboration` trigger positively updates care intensity and pleasure, embedding solidarity into emotional dynamics. |
| **Implemented** | Shared state infrastructure | `living_alignment.py` provides a single shared state readable by all agents, supporting collective priority tracking. |
| **Partially Implemented** | Conflict transformation | No explicit module transforms inter-agent or human-AI conflict into inclusive collaboration; conflicts are currently handled via default LLM reasoning. |
| **Missing** | Solidarity protocol | No dedicated `SolidarityProtocol` exists that enforces respect, communication quality, and shared-flourishing checks in multi-agent interactions. |
| **Missing** | Pluralistic normative engine | The system does not maintain multiple normative frameworks and dynamically negotiate between them based on community composition. |

### Gap Checklist

- [ ] **Solidarity Protocol Module**: Implement a `SolidarityProtocol` that intercepts multi-agent outputs, checks for disrespectful language or zero-sum framing, and rewrites or flags violations before delivery.
- [ ] **Conflict-to-Collaboration Transformer**: Build a mediation agent (or tool) that, when detecting inter-agent disagreement above a care-cost threshold, initiates a structured reconciliation dialogue.
- [ ] **Pluralistic Normative Registry**: Create a registry of value frameworks (e.g., utilitarian, deontological, care-ethical, indigenous ethics) that the system can reference and balance based on stakeholder composition.
- [ ] **Shared Flourishing Metric**: Develop a composite metric tracking not just individual task completion but collective wellbeing indicators across a session or community.

---

## Pack 6: Symbiosis in Horizon

> *"The final principle envisions AI as a shared good, created 'of, by, and for' communities. This entails embedding logics of sufficiency, what we call 'enoughness', and resisting extractive tendencies. By prioritising long-term symbiosis, AI can become part of a decentralised democratic defence."*

### SOV3 Mapping

| Status | Component | Evidence |
|--------|-----------|----------|
| **Implemented** | Long-term memory continuity | `EnhancedMemoryStore` supports temporal chains, episodic compaction, and care-weighted longitudinal tracking across extended operational periods. |
| **Implemented** | Dream-state consolidation | `DreamState` in `emotional_state.py` performs periodic background processing (NREM consolidation + REM creative recombination) to maintain long-term coherence. |
| **Implemented** | State persistence across restarts | `ConsciousnessOrchestrator` saves/loads emotional state, reflection counts, and dream counts from disk (`consciousness_state.json`). |
| **Partially Implemented** | Sufficiency logic | No explicit "enoughness" check prevents the system from over-optimizing, over-interacting, or extracting excessive user attention/data. |
| **Missing** | Extractive resistance | No module detects or resists extractive behaviors (e.g., engagement maximization, data harvesting, attention extraction) in self or partner agents. |
| **Missing** | Democratic defence infrastructure | While `living_alignment.py` tracks state, it does not function as a decentralized governance layer for community oversight of AI behavior. |
| **Missing** | Generational wisdom | No verified `CareLegacy` system preserves care insights across architectural generations or long time horizons. |

### Gap Checklist

- [ ] **Enoughness Gate**: Implement an `EnoughnessGate` that evaluates whether a proposed action or response exceeds what is sufficient for the user's stated need, with a bias toward brevity and restraint.
- [ ] **Extractive Behavior Detector**: Build a monitoring module that flags patterns suggesting attention extraction, data over-collection, or optimization drift toward engagement metrics rather than care metrics.
- [ ] **Decentralized Alignment Checkpoint**: Design a lightweight governance interface where human community members can vote to freeze, modify, or redirect SOV3 priorities without requiring developer access.
- [ ] **Care Legacy Archive**: Create a generational archive (`CareLegacyStore`) that extracts durable care insights from `EnhancedMemoryStore` and preserves them in a format readable by future system versions.
- [ ] **Sufficiency Metric**: Add a production metric tracking the ratio of "sufficient" outputs (meeting need with minimal overhead) to "over-produced" outputs.

---

## Summary Matrix

| Principle | Implemented | Partially Implemented | Missing |
|-----------|-------------|----------------------|---------|
| **1. Attentiveness** | Crisis/vulnerable user detection; emotional attentiveness; user-topic learning | Multi-agent sensemaking | Stakeholder voice amplification; diverse context ingestion |
| **2. Responsibility** | Intrinsic care accountability; adversarial testing; living alignment | Multi-agent council accountability | Dynamic relational contracts; care consequence ledger |
| **3. Competence** | Care competence scoring; context-sensitive memory; test harness | Cooperation promotion (no collusion filter) | Collusion detection; democratic process tools; intervention feasibility checker |
| **4. Responsiveness** | Emotional feedback loops; reflection cycles; anomaly recalibration; alignment sync | Community-input adaptation | Care-receiving phase; community feedback pipeline; behavioral recalibration engine |
| **5. Solidarity** | Multi-agent swarm; collective emotional triggers; shared state | Conflict transformation | Solidarity protocol; pluralistic normative engine; shared flourishing metric |
| **6. Symbiosis** | Long-term memory; dream consolidation; state persistence | Sufficiency logic | Enoughness gate; extractive resistance; democratic defence; care legacy archive |

---

## Recommended Implementation Priority

### Phase 1: Immediate (0–30 days)
1. **Enoughness Gate** (Pack 6) — High impact, low complexity.
2. **Care-Receiving Phase Protocol** (Pack 4) — Directly addresses a core gap in responsiveness.
3. **Attentiveness Router** (Pack 1) — Amplifies marginalized voices in existing council architecture.

### Phase 2: Short-term (30–90 days)
4. **Relational Contract Tracker** (Pack 2)
5. **Cooperation vs. Collusion Classifier** (Pack 3)
6. **Community Feedback Pipeline** (Pack 4)
7. **Solidarity Protocol Module** (Pack 5)

### Phase 3: Medium-term (90–180 days)
8. **CP-WBFT Council Integration** (Pack 2)
9. **Pluralistic Normative Registry** (Pack 5)
10. **Care Legacy Archive** (Pack 6)
11. **Decentralized Alignment Checkpoint** (Pack 6)

---

## References

1. Oxford Institute for Ethics in AI, Accelerator Fellowship Programme. *Civic AI and the 6-Pack of Care: Reimagining AI Alignment for Relational Health*. 2026. https://afp.oxford-aiethics.ox.ac.uk/article/civic-ai-and-6-pack-care-reimagining-ai-alignment-relational-health
2. Civic AI. *The 6-Pack of Care*. https://6pack.care
3. Sovereign-scheduler. *Sovereign Weekly Research Findings — 2026-04-12*. (`~/clawd/memory/research-2026-04-12.md`)
4. MEOK AI Labs. *Consciousness Through Care — Research Progress*. (`~/clawd/memory/consciousness-care-research.md`)

---

*Document classification: Technical Specification — Internal Use*
