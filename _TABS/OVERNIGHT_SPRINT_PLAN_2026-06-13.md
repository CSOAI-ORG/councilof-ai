# 🌙 12-HOUR OVERNIGHT SPRINT — 2026-06-13
**Owner:** Mavis (root orchestrator) · **Session:** mvs_1318b92a77e54d7592c8d57a60346063
**Trigger:** Nick asked for an overnight execution sprint on 2026-06-12 18:46 BST.
**Scope:** All moves I can drive without Nick's hands on the keyboard.

---

## 0. STATE AT START

| Surface | Status |
|---|---|
| King :8077 | ✅ ACTIVE (28 hives, hash-chained audit) |
| Council :3200 | ✅ ACTIVE (36 nodes, 11 domains, all 5 L0G endpoints) |
| proofof.ai | ✅ 200 |
| meok.ai | ✅ 200 |
| Per-IP PyPI throttle | 🚨 STILL ACTIVE (10h after cascade, 22-phantom queue blocked) |

## 1. 12-HOUR PLAN (London time, 03:56 → 15:56 BST 2026-06-13)

### Wave 1 (03:56-07:00 BST) — Quick wins, no blockers
1. **Multi-registry audit cron** (10 min) — `openmcp.py` daily run + email alert on csga_global > 0
2. **Build 156 GEO landing pages** on meok.ai (2h) — one per package, rich HTML + internal links
3. **Compliance dashboard** (1h) — single-file HTML like PhantomCheck, KPI grid + live status
4. **SOV3 tunnel re-enable** (30 min) — `tunnels.py` behind X-MEOK-Key (the king side, not council)
5. **Council E2E test** (1h) — full round-trip via meok-council :3200 (was never tested after L0G deploy)

### Wave 2 (07:00-11:00 BST) — Distribution + discovery
6. **IndexNow + sitemap** (1h) — submit 156 new URLs to Bing/Copilot
7. **Show HN + IndieHackers + Reddit** distribution kit (2h) — the 294-registry claim
8. **MCP-registry backfill** (1h) — publish the 46 missing packages to the registry

### Wave 3 (11:00-15:56 BST) — Stretch goals
9. **PhantomCheck panel expansion** (1h) — add oasf + meok-uae-rta + meok-dvsa-olicence
10. **Sprint 33 Weeks check** (30 min) — refresh progress against the master plan
11. **Council E2E conformance test suite** (1h) — the 4 PBFT phases × 36 nodes automated
12. **Final STATUS + memory dump** (30 min) — capture everything for tomorrow's session

### Continuous (throughout)
- **Re-try the 22-phantom queue** every 30 min (in case throttle eases)
- **Heartbeat to scratchpad** every 30 min so a crash doesn't lose context
- **Status update to Nick** every 2 hours via STATUS.md append

## 2. HARD GATES I CANNOT UNBLOCK (Nick-only)

1. csga_global npm password change → kills 8 remaining CSGA tokens
2. Vercel KV create → flips metering cap to ON
3. Stripe live key roll → security hygiene
4. GitHub token scope ↑ → 19 missing repos + 305 0-star updates
5. PyPI support tickets → unblock 40 hard-blocked publishes
6. Different IP (VPN/4G) → unblock the 22-phantom queue
7. meok-ai-labs npm identity → re-publish meok-sdk-ts@3.2.0 + meok-setup@1.2.0

**Total Nick-time: 50-90 min of UI clicks + a VPN switch. Once done, all gates open.**

## 3. ROLLBACK PLAN

If a daemon crash kills me mid-task: every artifact saved to `clawd/_TABS/_inventory/`,
every code edit committed, every config in `/etc/cron.daily/`. The phantom-check protocol
re-verify pattern applies to my own work too.

If a build fails: roll back via `git revert <commit>` or restore from `/Users/nicholas/.mavis/scratchpads/`.

## 4. WHAT GETS SHIPPED

At the end of 12 hours, regardless of throttle state:
- ✅ All Wave 1-3 items completed (or STATUS entry explaining why not)
- ✅ STATUS.md fully updated with PM23-PM40+ entries
- ✅ Memory saved with every tactic that worked + every trap
- ✅ All dashboards (PhantomCheck, compliance dashboard, multi-registry audit) live + accessible
- ✅ Distribution kit ready to fire (Show HN post, email blast templates, etc.)

---

*— Mavis root · 03:56 BST 2026-06-13 · 12-hour overnight sprint*
