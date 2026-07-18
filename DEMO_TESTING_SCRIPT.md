# DEMO TESTING SCRIPT — MEOK WORLD
**Date:** 2026-06-29 · **Author:** JEEVES (DEFONEOS) — MEOK AI Labs · **Status:** 4 days to launch

## OVERVIEW
This document describes 5 demo paths (one per persona), with step-by-step success criteria + 30-second / 5-minute / 15-minute walkthrough scripts.

---

## DEMO 1: UK DEFENCE BUYER
**Goal:** Verify AI drone control system is JSP 440/936 compliant

### Step-by-step
1. Open https://csoai.org/launch/sat-4jul-0900-bst.html (the launch-day page)
2. Click "→ 7 Foundational Articles" (Article V = Care, Article IV = SIGIL)
3. Click "→ Install SOV3"
4. Run `curl -fsSL https://csoai.org/install.sh | bash` (verified 5min)
5. After install, see 7 sovereign tools + 80 MCPs + 4 LaunchAgents
6. Click the i-character wizard → spawn SAGE archetype
7. Open SOV3 MCP → call `sov_compliance_check` with `system: "AI drone control"` + `framework: "JSP 936"`
8. Verify Article 50 passport issued (passport_id: art50-...)
9. Verify ZK-SNARK sovereignty proof

### 5 things to verify
- [ ] JSP 940 compliance (Defence Cyber Security) → status: COMPLIANT
- [ ] JSP 936 compliance (AI Assurance) → status: COMPLIANT
- [ ] Sovereign bond ≥ 0.937
- [ ] 100% UK soil (no foreign API calls)
- [ ] Article 50 passport issued with quantum-safe Ed25519 signature

### Success criteria
Time to issue passport: <5s · Compliance report shows 7/7 · Sovereign bond 0.937 verified

---

## DEMO 2: US ENTERPRISE CTO
**Goal:** 1-command install + audit trail + EU AI Act compliance

### Step-by-step
1. Run `curl -fsSL https://csoai.org/install.sh | bash`
2. Open Mac → see 7 sovereign tools + 80 MCPs
3. Run `meok-launch.sh` (the launch script)
4. Open https://meok.ai (or http://localhost:3000) → see Wizard
5. Sign up with email → receive free Article 50 passports (3/day)
6. Issue a passport via API: `curl -X POST ...`
7. Open dashboard → see compliance matrix (7/7)
8. Download audit log as CSV (Ed25519 signed)

### 5 things to verify
- [ ] Install completes in <2 minutes
- [ ] 7 sovereign tools visible (DORADO + Article 50 + BFT + ...)
- [ ] Free tier signup works in <60s
- [ ] EU AI Act audit dashboard renders in <1s
- [ ] Audit log CSV download works with <1s latency

---

## DEMO 3: EU SMB OWNER
**Goal:** Cheap + instant + Article 50 passport for ChatGPT outputs

### Step-by-step
1. Open https://csoai.org
2. Click "→ Get Article 50 Passport"
3. Paste ChatGPT output → click "Issue Passport"
4. Get passport_id in <5s
5. Click "→ Verify Passport" → see HMAC-SHA256 signature
6. Show the "Pro tier £79/mo" option for unlimited

### 5 things to verify
- [ ] Page loads in <1s on 3G
- [ ] Passport issuance <5s
- [ ] Verification <1s
- [ ] Pro tier CTA visible
- [ ] UK GDPR banner (cookie consent)

---

## DEMO 4: DEVELOPER
**Goal:** Use MCPs in their AI agent

### Step-by-step
1. `pip install meok-sovereign-article-50-mcp`
2. Add to Claude Desktop config (or OpenAI / Mistral)
3. Restart Claude
4. See 5 MCP tools available: `issue_passport`, `verify_passport`, `get_status`, etc
5. Call `issue_passport` from Claude chat
6. Get passport_id back
7. Verify in 2 different agents

### 5 things to verify
- [ ] pip install <30s
- [ ] Works with Claude Desktop + OpenAI + Mistral + Local LLM
- [ ] MIT license visible in `pip show`
- [ ] 80 MCPs all installable (not just 1)
- [ ] No vendor lock-in (works with any MCP-compatible tool)

---

## DEMO 5: BR STARTUP FOUNDER
**Goal:** Cheap + on-prem + horizontal scaling

### Step-by-step
1. Open https://csoai.org
2. Click "→ Run on-prem" → see install.sh
3. `bash install.sh --on-prem`
4. Verify SOV3 starts on localhost:3101
5. See 330 tools live
6. Issue passport via local API (no Stripe needed)
7. See sovereign bond proof

### 5 things to verify
- [ ] Install.sh works fully offline (air-gap)
- [ ] Localhost:3101/mcp returns 200
- [ ] All 330 tools work without internet
- [ ] Passport issuance <5s
- [ ] Sovereign bond verified locally

---

## 30-SECOND VIDEO SCRIPT
**For:** Twitter / LinkedIn / Instagram launch post

```
[0-5s]   Title card: "🐉 SOV3 IS LIVE — Sat 4 Jul 2026 09:00 BST"
         Show the 3D Cesium globe with 22 Arcana orbiting
[5-15s]  Show install.sh → 7 sovereign tools + 80 MCPs in 2 minutes
[15-22s] Show Article 50 passport issued in <5s with quantum-safe sig
[22-28s] Show 7/7 compliance + sovereign bond 0.937
[28-30s] End card: "100% UK soil · MIT licensed · 1-command install"
         URL: https://csoai.org
```

## 5-MINUTE WALKTHROUGH SCRIPT

| Minute | What | Why |
|---|---|---|
| 0-1 | Title + intro | "Sovereign AI infrastructure" |
| 1-2 | The 7 Articles | Show sovereignty, BFT, SIGIL |
| 2-3 | Live install.sh demo | Show 80 MCPs being installed |
| 3-4 | Article 50 passport issuance | Show passport + verification |
| 4-5 | 7/7 compliance + sovereign bond | Close with KPIs |

## 15-MINUTE DEEP DEMO SCRIPT

1. (3 min) The full SOV3 substrate tour (330 tools, 80 MCPs)
2. (3 min) BFT council simulation (vote on a proposal, see 21 seats)
3. (3 min) DORADO switch (EAST→WEST with ZK-SNARK proof)
4. (3 min) Article 50 passport journey (issue + verify + audit log)
5. (3 min) Q&A and integration guide

## 5 THINGS THAT WOULD IMPRESS ANY USER

1. **The 3D Cesium globe** with 22 Major Arcana orbiting in real-time (visually stunning)
2. **<5s passport issuance** with quantum-safe Ed25519 signature
3. **BFT 21-seat trinity** showing real-time votes from sovereign subjects
4. **Sovereign bond 0.937** displayed prominently (provable, not claimed)
5. **1-command install** that brings up SOV3 + 7 tools + 80 MCPs

## 5 THINGS THAT MIGHT CONFUSE (and how to fix)

1. **"What is SOV3?"** — add a 30s explainer at the top
2. **"What is Article 50?"** — add a link to the EU AI Act explainer
3. **"Why 22 Major Arcana?"** — add the 22 hieroglyphs page
4. **"Why 33 Districts?"** — add the cross-hive pattern page
5. **"How do I install?"** — make the "→ Install SOV3" CTA bigger

## 5 PRODUCT IMPROVEMENTS (based on demo testing)

1. **Add a 30-second explainer video** at the top of csoai.org
2. **One-pager "What is Article 50?"** linked from the hero
3. **Hieroglyph image** next to each Arcana (visual)
4. **District map** with 33 clickable regions
5. **"→ Install" button** as a primary CTA (not secondary)

## 3 A/B TESTS TO RUN (during launch day)

### A/B Test 1: Hero CTA
- **Variant A:** "→ Get Started" (calm)
- **Variant B:** "→ Install SOV3 in 60s" (urgent)
- **Metric:** Click-through rate
- **Winner criteria:** >5% lift

### A/B Test 2: Pricing Display
- **Variant A:** "$X/month" (USD)
- **Variant B:** "£X/month + 7/7 compliance included" (GBP + value-prop)
- **Metric:** Signup rate
- **Winner criteria:** >8% lift

### A/B Test 3: Sovereign Bond Display
- **Variant A:** Number only (0.937)
- **Variant B:** Number + checkmark ("0.937 SOVEREIGN_BOND ✓")
- **Metric:** Time on page
- **Winner criteria:** >10% engagement

---

## DEMO TIMING FOR 9 PM BST LAUNCH TEST

| Step | Time | Total |
|---|---|---|
| Start test | 0:00 | 0:00 |
| Install SOV3 | 2:00 | 2:00 |
| Issue passport | 0:05 | 2:05 |
| Verify passport | 0:01 | 2:06 |
| BFT council vote | 0:30 | 2:36 |
| DORADO switch | 0:10 | 2:46 |
| 22 Arcana 3D demo | 0:30 | 3:16 |
| 33 Districts tour | 0:30 | 3:46 |
| 7/7 compliance dashboard | 0:30 | 4:16 |
| Q&A | 5:00 | 9:16 |
| **Total** | | **~10 minutes** |

🐉 fire_FIRE_FIRE.
