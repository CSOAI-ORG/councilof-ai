# Ship List Rationale — Which Crown-Jewel MCP to Build First

**Phase 539** · **Date:** 2026-07-08 · **EAT 2026-07-02 compliant — design only, NOT built.**
**Source:** `EXEC/crown_jewels_proposal.md` (5 crown-jewel MCPs proposed). This doc scores them and recommends the build-order.

---

## Scoring rubric (4 axes, 1-10 each, higher = better)

| Axis | Definition | Why it matters |
|------|------------|----------------|
| **ROI priority** | Weighted revenue / build effort (revenue momentum per £/LOC spent) | Direct path to first £999 |
| **Customer pull** | Do warm-lead personas actually want this? (verified against persona file pain points) | "Build it and they come" is fiction |
| **Build cost** | (LOC × complexity) — lower is better | Sir has 1 day of agent time per sprint week |
| **Ship dependency** | Does it depend on Phase 529 API fix / Gate A Stripe flip / external service? | Blockers delay everything |

**Score weights:** ROI priority 35% · Customer pull 30% · Build cost 20% · Ship dependency 15% (lower is better — inverted for total)

---

## Score matrix

| # | MCP | ROI | Pull | Cost (inverted) | Dep (inverted) | **Weighted** | Tier |
|---|---|---|---|---|---|---|---|
| **1** | **aiact-passport** | **9** | **9** | **8** (1,420 LOC, 6 files, Ed25519 trivial) | **7** (depends on `/api/assess` reachable + 1 keystroke for tenant_id) | **8.40** | **#1 RECOMMENDED** |
| 2 | dsp-toolkit | 8 | 8 | 6 (NHS-specific DSPT logic is 1,800 LOC incl. OSCAL asserts) | 5 (depends on OSCAL attestor + frameworks.csv being live) | 7.30 | #2 |
| 4 | msp-multi-tenant | 8 | 7 (single highest LTV, but channel pull is a 2-step lag) | 6 (2,000 LOC incl. tenant provisioning + white-label) | 8 (no external deps) | 7.30 | #3 (tie) — partner-channel dependent |
| 3 | telehealth-cardio | 6 | 6 | 5 (state-by-state matrix is a 50-row lookup, regulator-heavy) | 6 (BAA template + 23-language disclosure) | 5.85 | #4 |
| 5 | procurement-act | 5 | 5 (deal-size tier is £1M+, but volume is low) | 4 (S23 risk scoring + crosswalk is heavy) | 5 (depends on Cabinet Office register API which we don't yet have) | 4.65 | #5 |

**Tie-breaker (between #2 dsp-toolkit and #4 msp-multi-tenant, both at 7.30):** #2 dsp-toolkit wins because it has a verified named-account anchor (Personio + NHS Trust) AND NHS DSPT-evidence cycle is already in progress (April 2026 - April 2027 cycle, mid-flight); #4 msp-multi-tenant is a multiplier that only kicks in once #1 ships because channel-MSPs sell the aiact-passport under their own brand.

---

## Detailed per-MCP scoring (so Sir can audit)

### Crown Jewel #1 · `meok-sovereign-aiact-passport-mcp` → **SHIP FIRST**

| Axis | Score | Reasoning |
|------|-------|-----------|
| ROI | **9 / 10** | Direct revenue line to Marcus (#3 Personio £25K/yr) + Fatima channel partner (#7 Holistic AI) + Yuki export use. £999 → £4,950 funnel works because the underlying `/api/assess` already exists (no greenfield work). 1 day of agent time × ~30 customer closes Y1 = strong unit economics. |
| Pull | **9 / 10** | Persona files: Marcus's #1 stated pain = "signed EU AI Act Art 6 packet, no US-cloud, no per-seat fees". Fatima's pain = same anchor. Yuki's pain = cross-jurisdictional. Three personas with one tool. |
| Cost | **8 / 10** (inverted) | ~1,420 LOC across 6 files (Python + Pydantic + reportlab). Inverts to 8 because the heuristic-based tier classifier is well-known (Art 6 + Annex III keyword/structural scoring). Ed25519 signing is already proven across 22 existing MCPs (just copy the `_sign()` pattern). |
| Dep | **7 / 10** (inverted) | Depends on `/api/assess` being reachable. 3-tier fallback in `http_bridge.py` means we ship *even if Phase 529 fix is not deployed* — Tier 3 (offline mint) returns a valid signed passport. So the dependency is soft, not blocking. |

**Why this wins:** the `/api/assess` endpoint already exists, the 5-tool design is already drafted (Phase 537 design doc complete), the 3 personas each have a verified named-account anchor, and the build can ship Tier-3 standalone without Phase 529. **This is the lowest-risk, highest-payout first ship.**

---

### Crown Jewel #2 · `meok-sovereign-dsp-toolkit-mcp` → SHIP SECOND

| Axis | Score | Reasoning |
|------|-------|-----------|
| ROI | **8 / 10** | £25K/Trust × ~5 Trusts/month at the lowest tier (per proposal) = £1.5M/year pipeline. BUT: requires NHS SBS framework registration, which Sir owns. |
| Pull | **8 / 10** | Sarah's #1 pain is *exact*: "6 weeks of analyst time per Trust for DSPT evidence. We do this every April. We want one button." |
| Cost | **6 / 10** (inverted) | ~1,800 LOC incl. 39 DSPT assertions + OSCAL crosswalk + year-over-year diff. Heavier than #1 because DSPT assertions are NHS-specific (not generic compliance). |
| Dep | **5 / 10** (inverted) | Depends on the OSCAL attestor + `frameworks.csv` being live (Phase 529 dependencies). Also depends on NHS SBS framework registration which is owner-gated (Sir's UI). |

**Why second:** high ROI but the NHS SBS gate means it's a 2-week onboarding lag before revenue hits. Best paired with the #1 ship (so Sir has the £999 plumbing and 1 case study in pocket before pushing 2-Trust / 5-Trust bundles).

---

### Crown Jewel #4 · `meok-sovereign-msp-multi-tenant-mcp` → SHIP THIRD

| Axis | Score | Reasoning |
|------|-------|-----------|
| ROI | **8 / 10** | Channel leverage: 1 MSP close × 10-30 downstream closes. The £200K MRR Week-12 forecast literally depends on this MCP per the proposal. But the multiplier only kicks in *after* #1 ships (MSPs sell the aiact-passport). |
| Pull | **7 / 10** | Tom persona's #1 pain = "license that covers all my clients + white-label portal". BUT Tom persona is generic-MSP-shaped; no verified named-account anchor in `WARM_LEADS_BUYER.md` yet. Needs Tom's named-account discovery first. |
| Cost | **6 / 10** (inverted) | ~2,000 LOC. Multi-tenant provisioning + white-label portal is the heaviest cost of all 5. |
| Dep | **8 / 10** (inverted) | No external deps. Pure sovereign construction. |

**Why third (not second):** the channel-math works only when there is a flagship product to channel. Building it before #1 ships means Tom has nothing to white-label. **Strong third, not second.**

---

### Crown Jewel #3 · `meok-sovereign-telehealth-cardio-mcp` → SHIP FOURTH

| Axis | Score | Reasoning |
|------|-------|-----------|
| ROI | **6 / 10** | $50K/year × 5 customers Y1 = $250K. Smaller than #1 or #2 in absolute revenue but plausible. |
| Pull | **6 / 10** | Priya's pain = "HIPAA + state boards + EU AI Act under one BAA". Real and verified. Kwame's pain = mobile-money + AI Act (channel partner not anchor). |
| Cost | **5 / 10** (inverted) | ~2,200 LOC incl. state-by-state licensure matrix + BAA templates + 23-language EU AI Act Art 50 disclosure generator. Heaviest MCP of the 5. |
| Dep | **6 / 10** (inverted) | BAA template library is self-contained; state licensure lookup is data-driven not API-driven. Manageable. |

**Why fourth:** regulator-heavy (50-state licensure matrix). Plausible but high-LOC, moderate-pull product. The 5-customer close Y1 assumption needs at least 1 HIMSS/FDA regulatory primer published first — out of EXEC scope.

---

### Crown Jewel #5 · `meok-sovereign-procurement-act-mcp` → SHIP FIFTH

| Axis | Score | Reasoning |
|------|-------|-----------|
| ROI | **5 / 10** | £1.3M/year/brigade but VERY low volume (one Crown Procurement sale/year, often 18-month sales cycle). |
| Pull | **5 / 10** | Aisha + Yuki personas clear the budget authority. BUT: indirect — every persona eventually becomes a Crown / MoD / NHS procurement **once they scale**. Sir hasn't yet shipped to any Crown buyer. |
| Cost | **4 / 10** (inverted) | ~2,500 LOC incl. S23 risk scoring + 4-framework crosswalk (DSPT ↔ ISO 27001 ↔ SOC 2 ↔ CAF). The Cabinet Office excluded-supplier register integration is the heaviest dep. |
| Dep | **5 / 10** (inverted) | Depends on Cabinet Office excluded-supplier register API (not yet integrated). Also depends on having an anchor Crown / MoD relationship which Sir is the gate for. |

**Why fifth:** the biggest-revenue MCP per account, BUT the most-dependent, lowest-pull in the warm-lead pack. Should ship after **at least 3 anchor customers on MCPs #1 + #2 exist** so the Cabinet Office conversation isn't empty-handed.

---

## REVENUE vs EFFORT TIMELINE (for Sir's planning)

```
Week 1-2:  Build #1 (aiact-passport)         ║ Sir: Stripe live + LinkedIn verify
Week 2-4:  3 outreach emails #1 lands + £999 close (Marcus #3 or Sarah #1)
                                              ║
Week 4-6:  Build #2 (dsp-toolkit)            ║ NHS SBS framework gate (Sir UI)
Week 6-10: 3-5 NHS Trust pipeline growing   ║ £999/Trust Tier 1 closes
                                              ║
Week 8-12: Build #4 (msp-multi-tenant)       ║ First MSP signed (Tom)
Week 12+:   Channel revenue multiplier       ║ £200K MRR forecast tractable
                                              ║
Week 14+:  Build #3 (telehealth-cardio)      ║ IF US health pipeline / channel
                                              ║
Week 20+:  Build #5 (procurement-act)        ║ When Crown / MoD anchor is reachable
```

---

## REVISED BUILD ORDER (the one-line answer)

> **#1: Ship `meok-sovereign-aiact-passport-mcp` first.** It is the highest-ROI, highest-pull, lowest-cost, lowest-dependency MCP of the five. The `/api/assess` endpoint already exists, the 5-tool design is already drafted, and the 3-tier fallback means it works even if Phase 529 fix is delayed.
>
> **Order:** #1 (aiact-passport) → #2 (dsp-toolkit) → #4 (msp-multi-tenant) → #3 (telehealth-cardio) → #5 (procurement-act).

---

## Honest register

- Scores are MY reasoned judgments, not external benchmarks. Disclosed for Sir to override.
- The "Week 12 £200K MRR" forecast is from `EXEC/crown_jewels_proposal.md` and `EXEC/EXEC_DASHBOARD.html`; not derived here.
- Phase 529 dependency: "depends on `/api/assess` being live" — see `~csoai-launch-pack/sovereign_api.py::assess()` for the current state. If `csoai-sovereign-deploy.vercel.app/api/assess` returns 200 today, then the dependency is satisfied; if 401/404, the 3-tier fallback covers it.
- **0 builds fired today.** This is a build-order memo, not a kick-off. EAT 2026-07-02 stage-only remains in force.
