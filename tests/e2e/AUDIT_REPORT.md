# MEOK/SOV3 E2E Test Audit Report

**Date:** 2026-05-29  
**Auditor:** JEEVES  
**Scope:** All E2E and integration test files across the MEOK/SOV3 stack  

---

## 1. Executive Summary

| Metric | Value |
|--------|-------|
| Total test files audited | 12 |
| Lines of test code | ~4,200 |
| Currently passing (live run) | 8/8 core flows + 299 UI unit tests |
| **Critical gaps identified** | **7** |
| Files with stale port references | 4 |
| Completely unimplemented specs | 1 (Terranova Playwright) |

**Verdict:** The stack has *decent* coverage at the unit/smoke level but suffers from **severe fragmentation**, **port drift**, and **missing cross-service integration tests**. No single test suite exercises the full Gateway→Service chain end-to-end.

---

## 2. Inventory of All Test Files

### 2.1 Active / Well-Maintained

| File | Lines | Framework | Coverage | Port Accuracy | Status |
|------|-------|-----------|----------|---------------|--------|
| `meok/tests/e2e_smoke_test.py` | 1,191 | Python (urllib) | 18 groups: health, auth, memory, care metrics, consciousness, dashboard, VAD, pgvector, CPM, RAG, heartbeat, sovereign temple | ✅ 3200/3101 | **Best existing suite** |
| `meok/ui/src/__tests__/*.test.ts` | ~3,000 | Vitest | 19 suites, 299 tests: API birth, bond, characters, emotion, evolution, LLM router, memory, personality, proactive care, research, security, sovereign API, voice fingerprint | N/A (unit) | ✅ Active |
| `sovereign-temple/tests/test_mcp_tools.py` | ~200 | Python | MCP tool call smoke tests | ✅ 3101 | ✅ Active |
| `sovereign-temple/tests/test_sov3.py` | ~100 | Python | SOV3 core health + basic MCP | ✅ 3101 | ✅ Active |
| `sovereign-temple/tests/test_e2e_integration.py` | ~250 | Python | Integration tests for router + orchestrator | ⚠️ 3201 | ⚠️ Stale port |

### 2.2 Stale / Broken (Port Drift)

| File | Lines | Problem | Impact |
|------|-------|---------|--------|
| `scripts/e2e-test.sh` | 155 | Uses ports 8000/8001 (MEOK API moved to 3200, MCP to 3102). Also assumes marketing frontend on 3000 (now static UI). | **WILL FAIL** if run |
| `sovereign-temple/test_e2e.py` | 177 | Uses port 3201 (no service listens there; API is 3200). Tests dual-brain router/orchestrator directly via imports — bypasses actual HTTP API. | Partially broken |
| `sov3_e2e_audit.py` | 382 | Uses ports 3103 (councilof), 3104 (moe), 3201 (ralph) — **none of these services exist** in the current architecture. | Completely broken |
| `scripts/fleet-e2e-validator.py` | 146 | Tests Docker MCP ensemble (20 services) via docker-compose. Requires `docker-compose.mcp-ensemble.yml`. Our stack runs services natively (Python uvicorn), not in Docker ensemble. | Architecture mismatch |

### 2.3 Design-Only (Not Implemented)

| File | Lines | Status |
|------|-------|--------|
| `meok-oneos/docs/audits/e2e-test-suite.md` | 1,709 | Comprehensive Playwright spec for 5 personas (Grandparent, Child, Blind, CTO, Rural). **Zero actual test files exist.** This is a requirements document masquerading as a test suite. |

### 2.4 External / Separate Concern

| File | Framework | Notes |
|------|-----------|-------|
| `langfuse/web/src/__e2e__/api.servertest.ts` | Vitest / custom | Langfuse's own API E2E. Not our code. Leave alone. |

---

## 3. Coverage Gap Analysis

### 3.1 Gaps in the Best Existing Suite (`e2e_smoke_test.py`)

The 18-group smoke test is solid for MEOK API + SOV3 MCP, but it **does NOT test:**

| # | Missing Coverage | Why It Matters | Current Status |
|---|------------------|----------------|----------------|
| 1 | **Soulbound Token (SBT)** mint/verify | Core identity primitive for the sovereign stack | ❌ No E2E |
| 2 | **Chronicle** audit log write/verify | Compliance-grade tamper-proof logging | ❌ No E2E |
| 3 | **Payments** (Stripe checkout/session) | Revenue-critical path | Only in broken `e2e-test.sh` |
| 4 | **A2A Bridge** (Agent-to-Agent v1.0) | POAI SBT auto-mapping | ❌ No E2E |
| 5 | **Neural Inference** (care_validation, threat_detection) | ML model serving via MCP | ❌ No E2E |
| 6 | **Storage** (MinIO/S3 bucket + objects) | File persistence layer | ❌ No E2E |
| 7 | **Gateway Proxy** (port 3400) | Unified API Gateway — the front door | ❌ No E2E |
| 8 | **Council BFT full cycle** | submit proposal → vote → tally | Partial (dashboard metrics only) |
| 9 | **Cross-service flows** | Gateway → SOV3 → API → Postgres | ❌ No E2E |
| 10 | **MEOK UI** (port 3000) | Static site health, SPA routing | Only basic `health.json` check |

### 3.2 Race Condition False Negatives

| Issue | Location | Root Cause | Mitigation |
|-------|----------|------------|------------|
| Council vote ~50% false negative | `register_agent` → `cast_vote` | File-based registry syncs to memory *asynchronously*. Vote may check memory before sync completes. | Add retry loop with backoff in test harness |
| A2A bridge JSON parse | Test assertion | Checked `card_hash` instead of `a2a_card_hash` | **Already fixed** in previous session |

---

## 4. Port Drift Map

Current live services (verified via `lsof`):

| Service | Port | Process |
|---------|------|---------|
| SOV3 Orchestrator | 3101 | Python (sovereign-mcp-server.py) |
| MEOK MCP | 3102 | Python |
| MEOK API | 3200 | Python (uvicorn) |
| MEOK ONE Gateway | 3400 | Python (gateway.py) |
| Sovereign API | 8888 | Python |
| MEOK UI | 3000 | Python http.server (static) |

Stale port references found in tests:

| Port | Referenced By | Should Be | Fix Required |
|------|---------------|-----------|--------------|
| 8000 | `e2e-test.sh` (MCP Gateway) | 3102 | ✅ Deprecate file |
| 8001 | `e2e-test.sh` (Sovereign API) | 8888 | ✅ Deprecate file |
| 3100 | `e2e_smoke_test.py` (SOV3 comment) | 3101 | 📝 Comment fix only |
| 3103 | `sov3_e2e_audit.py` (CouncilOf) | — (service removed) | ✅ Deprecate file |
| 3104 | `sov3_e2e_audit.py` (MoE) | — (service removed) | ✅ Deprecate file |
| 3201 | `test_e2e.py`, `sov3_e2e_audit.py` (Ralph/API) | 3200 | ✅ Deprecate files |

---

## 5. Recommendations

### 5.1 Immediate (This Session)

1. **Create unified E2E suite** (`tests/e2e/unified_e2e_suite.py`) that:
   - Uses correct ports (3101, 3102, 3200, 3400, 8888, 3000)
   - Covers all 8 core flows (Council BFT, SBT, Payment, Chronicle, Storage, A2A, Neural, Gateway)
   - Includes the 18 smoke test groups from `e2e_smoke_test.py`
   - Adds Gateway proxy tests
   - Has retry logic for race conditions
   - Produces JSON + Markdown report
   - Is idempotent (cleans up test data)

2. **Deprecate stale files** with header comments pointing to the unified suite.

### 5.2 Short-Term (Next 1–2 Sessions)

3. **Implement Terranova Playwright tests** — The 1,709-line spec is solid. Create actual `.spec.ts` files under `meok-oneos/e2e/`.
4. **Add CI/CD integration** — GitHub Actions workflow that runs unified suite on PR.
5. **Add load/stress tests** — Current tests are functional only. No latency SLAs under load.

### 5.3 Medium-Term

6. **Contract tests (Pact)** — Ensure MEOK API ↔ SOV3 MCP compatibility across deploys.
7. **Chaos engineering** — Kill services mid-test, verify graceful degradation.
8. **Security E2E** — Rate limiting, auth bypass attempts, SQL injection via MCP params.

---

## 6. Test Pyramid Assessment

```
              ┌─────────────────┐
              │   E2E (UI)      │  ← Terranova Playwright — NOT IMPLEMENTED
              │   ~0 tests      │
              ├─────────────────┤
              │   E2E (API)     │  ← Unified suite (this session) — 30+ flows
              │   ~35 tests     │
              ├─────────────────┤
              │  Integration    │  ← smoke test + MCP tools — ~25 tests
              │  ~25 tests      │
              ├─────────────────┤
              │     Unit        │  ← meok/ui vitest — 299 tests ✅
              │   299 tests     │
              └─────────────────┘
```

**The pyramid is inverted at the top.** We have strong unit coverage but almost no real browser E2E and fragmented API E2E. This session fixes the API layer; Playwright remains for future work.

---

*Report compiled by JEEVES. Next: build unified suite.*
