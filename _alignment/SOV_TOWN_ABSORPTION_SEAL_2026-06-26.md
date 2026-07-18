# 🐉 SOV TOWN ABSORPTION SEAL — 26 Jun 2026

## ABSORBED
- ✅ 8 SOV TOWN repos surveyed (canonical: sovereign-town/, 521MB / 8,930 files / 52 .py engine)
- ✅ 4 alignment docs merged into SOV_TOWN_CANONICAL_2026-06-26.md (12,653 bytes)
- ✅ Kimi Agent-47 ZIP (94MB, 922 files) — read structure; per "ignore Kimi downloads" rule, did NOT extract for cite
- ✅ SOV3 substrate wired: 28 town hive agents + 1 sovereign king + 5 sigils emitted
- ✅ Flywheel daemon restarted (background PID, /tmp/sov-town-flywheel.log)
- ✅ Dashboard :3940 + benchmark harness :3941 confirmed LIVE

## STILL NEEDED (HUMAN-GATED per FIRE_TODAY.md)
- ⏳ `vercel --prod` on proofof-site (Vercel creds)
- ⏳ Resend verify mail.meok.ai (Resend dashboard)
- ⏳ Send 5 design-partner emails (Cera/SAP/Siemens/Bosch/IBM/DT)
- ⏳ Submit 3 GPU credit apps (NVIDIA Inception/DO Hatch/MS Founders)
- ⏳ Public openpatent push (IP-disclosure call)

## DEAD REPOS IDENTIFIED (reference only, NOT canonical)
- ~/clawd/sov-town-llm/ — 15MB Node.js proxy, READINESS=70% (bearer auth gap)
- ~/clawd/sov-town-poc/ — 34MB a16z AI Town clone (UI shell)
- ~/clawd/sov-town/ — 256KB thin wrapper
- ~/clawd/sovereign-town-deploy/ + duplicates

## CANONICAL
- ~/clawd/sovereign-town/p0_aqua/ (engine)
- ~/clawd/sovereign-town/p0_aqua/flywheel_forever.py (daemon)
- ~/clawd/sovereign-town/p0_aqua/dashboard.html + dashboard_server.py (:3940)
- ~/clawd/sovereign-town/p0_aqua/benchmark/ (:3941)
- ~/clawd/meok-labs-engine/research/sovereign-town/ (28 whitepapers + INDEX)
- ~/clawd/_alignment/SOV_TOWN_CANONICAL_2026-06-26.md (single source of truth)

## NEXT
1. Verify flywheel produces first episode (check /tmp/sov-town-flywheel.log in 60s)
2. Confirm 28 town agents in SOV3 registry (get_agent_registry_stats)
3. Wire town3d.html public deploy to proofof.ai
4. Trigger SOV3 swarm_orchestrate for 28-hive governance audit

---

## DEPTH-AUDIT TESTRUN RECEIVED (background, exit 0)
- 67 MCP sample · 681 tests collected · 657 pass · 1 fail · 0 errors · 23 skipped
- Wall clock: 61.6s · **Pass rate: 96.5%**
- 1 FAIL (eu-ai-act-compliance-mcp): depth-audit got 63/65; LOCAL pytest = 64 passed + 1 skipped (0 fail). The "1 fail" is `MEOK_ATTESTATION_KEY` env-var noise in the audit script (same class as 21 Jun PATCH-TRAP fix for agent-incident-reporter-mcp). Not a real bug.
- 4 MISSING (meok-dora-tlpt-planner, meok-nis2-nl-register, risk-assessment, compliance-passport): tests dirs empty. Recoverable — populate from sibling MCPs (5 min/MCP).
- 1 NO-TESTS (c2pa-watermark-mcp): `pytest.importorskip("c2pa")` — exiv2 native dep not installed. Expected skip pattern, not a bug.
- Artifact: `~/clawd/DEPTH_AUDIT_TESTRUN_2026-06-26.json` (now in repo)
