# PBFT-MoE Implementation Roadmap

> Mixture-of-Experts Governance Council — 5-Phase Plan
> Version: 2026-05-28 | Status: Phase 1 Complete, Phases 2-5 Pending

---

## PHASE 1: Expert Replica System ✅ COMPLETE

**Deliverables:**
- [x] `expert_profiles.py` — 11 expert profiles with domain familiarity weights
- [x] `pbft_expert_replica.py` — ExpertReplica extends base Replica with validation + confidence vectors
- [x] `moe_committee.py` — CommitteeFactory forms domain-aware councils dynamically
- [x] `pbft_moe_council.py` — PBFTMoECouncil orchestrates two-tier consensus
- [x] `external_call_auditor.py` — Gate A (routing) + Gate B (output) audit system
- [x] `expert_calibration.py` — EMA accuracy tracking per expert per domain
- [x] `mcp/tools/expert_training.py` — 6 MCP tools for expert management
- [x] Tests: 35/35 passing

**Bugs Fixed:**
- Transport recursion: `engine._update_primary()` after ExpertReplica injection
- Execution on non-primary replicas: fallback to `seq_state.request`
- Expert votes with empty payload: pass `payload` directly to `_collect_expert_votes`
- Consciousness claim detection: broader keyword matching

---

## PHASE 2: Model Router Integration 🔄 PENDING

**Goal:** Wire PBFT-MoE into ModelRouter so ALL LLM/VLM calls pass through Gate A + Gate B.

**Tasks:**
- [ ] Identify all LLM call sites in `meok/` codebase
- [ ] Create `ModelRouter` wrapper that calls `ExternalCallAuditor.audit_routing_decision()` before execution
- [ ] Create post-call wrapper that calls `ExternalCallAuditor.audit_llm_output()` before returning to user
- [ ] Add `reasoning_tier` parameter to all LLM call paths (CRITICAL/STANDARD/LOW)
- [ ] Implement async bypass for LOW tier (log only, no council blocking)
- [ ] Cache approved routes to avoid redundant council deliberation
- [ ] Add timeout handling: if council deliberation exceeds threshold, fail-safe (block or use cached)
- [ ] Tests: mock LLM provider, verify Gate A blocks bad routes, Gate B blocks bad outputs

**Files to Modify:**
- `meok/core/model_router.py` (create or modify)
- `meok/api/neural_inference.py`
- `meok/mcp/tools/neural.py`
- `meok/core/pbft_moe_council.py` (add caching)

**Estimated Effort:** 3-4 days

---

## PHASE 3: SOV3 Coordination Wiring 🔄 PENDING

**Goal:** Connect SOV3 task lifecycle to PBFT-MoE council deliberation.

**Tasks:**
- [ ] Read `~/clawd/scripts/coordination-status.sh` and `enable_coordination.py`
- [ ] Create `CoordinationHub.submit_task()` → `MultiCouncil.route()` pipeline
- [ ] Implement task classification: infer domain + tier from task description
- [ ] Wire `TaskOrchestrator.dispatch()` to respect council decisions
- [ ] Add council decision to task audit trail in SOV3 dashboard
- [ ] Implement retry logic: if council blocks, escalate or return with reason
- [ ] Tests: end-to-end task submission → council → execution → completion

**Files to Modify:**
- `~/clawd/clawd/scripts/enable_coordination.py`
- `meok/core/coordination_hub.py` (create)
- `meok/core/task_orchestrator.py` (create or modify)
- `meok/core/multi_council.py` (create)

**Estimated Effort:** 4-5 days

---

## PHASE 4: Live Calibration Loop 🔄 PENDING

**Goal:** Real-world outcomes feed back into expert weights automatically.

**Tasks:**
- [ ] Store every `CouncilDecision` with full context in persistent DB
- [ ] Track outcomes: Was the approved route actually good? Did the output cause issues?
- [ ] Implement outcome scoring: human feedback + automated metrics
- [ ] Update `ExpertCalibrationTracker` with live outcomes (not just synthetic)
- [ ] Auto-downweight miscalibrated experts (already in code, needs data)
- [ ] Alert when expert confidence drops below threshold
- [ ] Implement "expert retirement" — remove consistently poor experts
- [ ] Implement "expert promotion" — clone high-performing experts with variants
- [ ] Tests: simulate outcomes, verify weight updates

**Files to Modify:**
- `meok/core/expert_calibration.py`
- `meok/core/pbft_moe_council.py` (outcome tracking)
- `meok/db/` (schema for decisions + outcomes)

**Estimated Effort:** 5-6 days

---

## PHASE 5: Cross-Council Federation 🔄 PENDING

**Goal:** Multiple specialized councils for different domains, federated consensus.

**Tasks:**
- [ ] Create `FederatedCouncil` — coordinates multiple domain-specific councils
- [ ] Define council types: SecurityCouncil, ComplianceCouncil, RevenueCouncil, etc.
- [ ] Implement cross-council message passing (cascading deliberation)
- [ ] Handle disagreements between councils (meta-council escalation)
- [ ] Implement council sharding — different councils run on different nodes
- [ ] Inter-council checkpointing for consistency
- [ ] Tests: multi-council scenarios, cascading decisions, disagreement resolution

**Files to Create:**
- `meok/core/federated_council.py`
- `meok/core/council_registry.py`
- `meok/core/inter_council_messages.py`

**Estimated Effort:** 7-10 days

---

## COMPLETION CRITERIA

All phases complete when:
- Every LLM call in the system passes through Gate A + Gate B
- SOV3 tasks are automatically classified and routed to appropriate councils
- Expert weights auto-calibrate from real outcomes
- Multiple councils can federate for complex cross-domain decisions
- Total test coverage >200 tests, all passing
- No `""` or broken API keys in production config

---

*Roadmap maintained by JEEVES Strategic Command. Updated after each phase completion.*
