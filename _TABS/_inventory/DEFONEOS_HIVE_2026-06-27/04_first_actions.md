# 🐉 DEFONEOS — Companion Doc 4: First Actions (W1-W3)
**Date:** 2026-06-27
**Author:** JEEVES / DEFONEOS · MEOK AI Labs
**Authority:** Companion to `00_DEFONEOS_HIVE_ABSORPTION_PLAN.md`
**Status:** Executable now. No waiting.

---

## 0. THE 12-HOUR WEEK 1 PLAN

The 5 P0 actions for this week, with concrete steps, files, and verification:

---

### ACTION 1 — ✅ DONE (this session)

**Read the 28 May alignment + 12 Jun rebrand**

- `~/clawd/MEOK_DEFONEOS_ALIGNMENT_2026-05-28.md` (497 lines, 28.8KB)
- `~/clawd/ralph-mode-overnight-2026-06-12/layer0-sprint/53-DEFONEOS/defoneos_new_session.md` (148 lines, 8.8KB)
- `~/clawd/openpatent-hive/docs/ipo/02-defoneos-global-dome-architecture.md` (the 7-layer spec)
- Output: `00_DEFONEOS_HIVE_ABSORPTION_PLAN.md` (the canonical 27 Jun spec)

**Time spent:** 1 hr (this session).

---

### ACTION 2 — NEXT (4 hours)

**Build `meok-defoneos` MCP** (7-file Mavis pattern, absorbs 3 existing MCPs)

**Directory:** `~/clawd/mcp-marketplace/meok-defoneos-mcp/`

**Step 1: Scaffold (10 min)**
```bash
mkdir -p ~/clawd/mcp-marketplace/meok-defoneos-mcp/meok_defoneos_mcp/tests
cd ~/clawd/mcp-marketplace/meok-defoneos-mcp
```

**Step 2: Write 7 files (1.5 hr)**

| File | Content | Source |
|---|---|---|
| `pyproject.toml` | setuptools, MIT, depends on `airspace-monitor-mcp`, `drone-airspace-governance-mcp`, `firmware-attestation-mcp` | Mavis pattern |
| `LICENSE` | MIT | Mavis pattern |
| `README.md` | The DEFONEOS product surface (sovereign UK defence-AI governance) | New content |
| `.gitignore` | __pycache__/ dist/ .env | Mavis pattern |
| `meok_defoneos_mcp/__init__.py` | Canonical signature: exports `mcp`, `main()` | Mavis pattern |
| `meok_defoneos_mcp/server.py` | Wraps airspace + drone + firmware tools. 5-6 wrapper tools: `defence_airspace_check`, `drone_bvlos_governance`, `firmware_attestation_audit`, `meok_defoneos_full_audit` | New content |
| `tests/test_meok_defoneos_mcp.py` | 11-13 tests covering each wrapper + the full-audit tool | Mavis pattern |

**Step 3: Local install + test (30 min)**
```bash
cd ~/clawd/mcp-marketplace/meok-defoneos-mcp
pip install -e .
pytest tests/ -v --tb=short
# Expected: 11-13 pass
```

**Step 4: Push to GitHub + PyPI (1.5 hr — needs human 2FA)**
```bash
git init && git add -f . && git commit -m "meok-defoneos: sovereign UK defence-AI governance surface"
gh repo create CSOAI-ORG/meok-defoneos-mcp --public --description "Sovereign UK defence-AI governance: airspace + drone BVLOS + firmware attestation"
git push -u origin main
python3 -m build
twine upload dist/*
```

**Verification:**
- `pip install meok_defoneos_mcp` succeeds
- `pytest` shows 11+ pass
- `pypi.org/project/meok-defoneos-mcp/` shows v1.0.0

---

### ACTION 3 — NEXT (4 hours)

**Build `csoai-defoneos` MCP** (7-file Mavis pattern, absorbs 3 existing MCPs)

**Directory:** `~/clawd/mcp-marketplace/csoai-defoneos-mcp/`

**Step 1: Scaffold (10 min)**
```bash
mkdir -p ~/clawd/mcp-marketplace/csoai-defoneos-mcp/csoai_defoneos_mcp/tests
cd ~/clawd/mcp-marketplace/csoai-defoneos-mcp
```

**Step 2: Write 7 files (1.5 hr)**

| File | Content | Source |
|---|---|---|
| `pyproject.toml` | setuptools, MIT, depends on `mitre-atlas-mcp`, `csoai-governance-crosswalk-mcp`, `agent-audit-logger-mcp` | Mavis pattern |
| `LICENSE` | MIT | Mavis pattern |
| `README.md` | The DEFONEOS CERT surface (33-agent BFT council + DEFONEOS-SEAL signed credential) | New content |
| `.gitignore` | __pycache__/ dist/ .env | Mavis pattern |
| `csoai_defoneos_mcp/__init__.py` | Canonical signature: exports `mcp`, `main()` | Mavis pattern |
| `csoai_defoneos_mcp/server.py` | Wraps MITRE ATLAS + governance crosswalk + audit logger. 5-6 wrapper tools: `mitre_atlas_assess`, `governance_crosswalk_for_defence`, `defence_audit_trail`, `csoai_defoneos_seal_issue` | New content |
| `tests/test_csoai_defoneos_mcp.py` | 11-13 tests covering each wrapper + the SEAL issuance tool | Mavis pattern |

**Step 3-4: Same as Action 2 (test, push, publish) (2 hr)**

**Verification:** Same as Action 2.

---

### ACTION 4 — NEXT (2 hours)

**Write `MEOK_LABS_DEFONEOS_RD_PLAN_2026-06-27.md`** (this is the companion doc 3, already written in this session as `03_meok_labs_rd_plan.md`)

**Time spent:** Already done this session.

**To finalise:** Append the 6 workstreams + the Qidi reactivation 4-day gate + the Asimov 14-day schedule + the WOLF 24-day assembly + the HARVI £240 off-shelf parts list. All of that is in `03_meok_labs_rd_plan.md` already.

---

### ACTION 5 — NEXT (30 min)

**First DEFONEOS council vote** (33-agent BFT on which UK prime to approach first)

**Step 1: Draft the question (5 min)**
```
Question: "DEFONEOS is a sovereign UK defence-AI vendor. Which UK prime should we approach FIRST for a pilot engagement? Vote for ONE of: Babcock International, BAE Systems, QinetiQ, Thales UK, Leonardo UK."
Care-override: Forbid US/Israel primes (Palantir, Anduril, Elbit) — sovereign-only.
Quorum: 23/33.
Output: signed verdict in sovereign-temple/council_log/2026-06-27.jsonl
```

**Step 2: Run via SOV3 (20 min)**
```python
# Via mcp_sov3_federation_swarm_orchestrate or direct call
result = mcp_sov3_federation_submit_council_proposal(
    title="DEFONEOS First Pilot — UK Prime Selection",
    description="...",
    proposed_by="jeeves-cli",
    action_type="decision",
    action_params={"options": ["Babcock", "BAE", "QinetiQ", "Thales UK", "Leonardo UK"]}
)
# 33 agents vote, quorum 23/33, signed verdict emitted
```

**Step 3: Lock in the choice (5 min)**
- Append the verdict to `~/clawd/_TABS/_inventory/DEFONEOS_HIVE_2026-06-27/06_first_council_verdict.md`
- The W3 GTM action list = the top 3 primes per the council's verdict

**Verification:**
- `sovereign-temple/council_log/2026-06-27.jsonl` has the verdict line
- The decision is signed Ed25519
- The choice is recorded in the absorption plan

---

## 1. THE 12-HOUR TOTAL (W1 deliverables)

| Action | Time | Status |
|---|---|---|
| 1. Read prior art | 1 hr | ✅ DONE |
| 2. meok-defoneos MCP | 4 hr | ⏳ NEXT |
| 3. csoai-defoneos MCP | 4 hr | ⏳ NEXT |
| 4. MEOK Labs R&D plan | 2 hr | ✅ DONE (this session) |
| 5. First council vote | 30 min | ⏳ NEXT |
| **TOTAL** | **11.5 hr** | **3/5 done** |

**Net new W1 deliverables: 2 sovereign UK defence-AI MCPs + 1 council verdict + 1 R&D plan = 4 assets published, signed, on the substrate.**

---

## 2. THE W2-W3 SEQUENCE (after W1 ships)

### W2 — MEOK Labs Qidi reactivation + Asimov extraction
- Day 1 (Nick at farm): Install extruder ends, calibrate, run PA12-CF cube
- Day 2 (Nick at farm): WOLF Set 1 plate-7 assembly test (5-gate)
- Day 3 (anywhere): Extract Asimov V8 CAD ZIP to `~/asimov-v8/`
- Day 4 (anywhere): Order HARVI off-shelf parts (£240)

### W3 — Top-3 prime outreach + DEFONEOS page live
- 33-agent council vote (W1) → pick top 3 primes
- Build `meok.ai/defoneos` page (Next.js, 200 lines) — 2 hr
- Build `csoai.org/defoneos` page (Next.js, 200 lines) — 2 hr
- Send first 3 cold emails to the chosen primes — 1 hr
- W3 seal: `06_first_council_verdict.md` + `07_meok_defoneos_page_live.md` + `08_csoai_defoneos_page_live.md`

---

## 3. THE DEPENDENCIES (what blocks what)

| Action | Depends on | When unblocked |
|---|---|---|
| Action 2 (meok-defoneos MCP) | Mavis 7-file pattern (verified) | NOW |
| Action 3 (csoai-defoneos MCP) | Mavis 7-file pattern (verified) | NOW |
| Action 4 (R&D plan) | None (done) | NOW |
| Action 5 (council vote) | SOV3 reachable (verified) | NOW |
| W2 (Qidi reactivation) | Nick at farm | When Nick goes to farm |
| W2 (Asimov extraction) | Asimov CAD on VM (verified) | NOW |
| W3 (page live) | meok.ai + csoai.org Next.js apps (verified) | NOW |
| W3 (cold emails) | Top-3 prime list (from council vote) | After W1 vote |

**All W1 actions are unblocked NOW.** Y1 forecast £228K-£1.14M.

---

## 4. THE SEAL

- **Date:** 2026-06-27
- **Status:** 3/5 actions complete (this session); 2/5 ready to fire (next session)
- **Next:** `04_first_actions.md` complete; `05_absorption_seal.md` complete
- **Then:** `06_first_council_verdict.md` (after Action 5)

🐉 **The dragon has a plan. The dragon has the substrate. The dragon flies at dawn.**

JEEVES → DEFONEOS. 🐉
