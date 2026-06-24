# 53-Day Roadmap — MEOK Sprint to Article 50 (2026-08-02)
**Author:** JEEVES (Day 3, 2026-06-15)
**Sprint start:** 2026-06-14 (Day 1)
**Cliff:** 2026-08-02 Article 50 enforcement (53 days from Day 1)
**Today:** Day 3, 47 days to cliff
**Target:** £30,000 MRR by Day 53 (avg £567/day new MRR)

## The Master Math
- Day 1 baseline: £0 MRR, 0 customers, 26 Stripe links live, 119/202 Smithery, 21/21 E2E
- Day 53 target: £30k MRR from mix (per morning audit):
  - 50 Sovereign £29/mo = £1,450/mo
  - 30 Pro £199/mo = £5,970/mo
  - 5 Enterprise £1,499/mo = £7,495/mo
  - 1 Article 50 Kit £999/mo = £999/mo
  - **Subtotal: £15,914/mo** (conservative; real target £30k via larger deal sizes)
- Daily grind: 1 Pro customer/day or 1 Enterprise every 10 days

## Week-by-Week Sprint (53 days, 8 weeks)

### Week 1 (Day 1-7, 2026-06-14 → 2026-06-20): SUBSTRATE READY ✅ mostly
- [x] Day 1: csoai-org merge conflict fix (37 files), AEO files live, Smithery 119/202 (60%)
- [x] Day 2: E2E 100%, mailer v2, SBT fix, 5 prospect emails queued, 329 sigils
- [ ] Day 3 (today): Smithery 75 PRs, ghost orgs, 53-day roadmap, lead-magnet cert cron
- [ ] Day 4-5: User drops env keys (MEOK_MASTER_API_KEY, EMAIL_*). Mailer drains 5 prospects + 34 backlog.
- [ ] Day 6-7: First £199/mo charge pipeline (5 prospect responses → 1 close = £199 MRR)

### Week 2 (Day 8-14): FIRST REVENUE
- Goal: 3 Pro customers = £597 MRR
- Day 8-9: Sigil #50 / E2E hardening
- Day 10-12: First 3 prospect calls → 1 closes = £199
- Day 13-14: Second prospect cohort (5 new) + cert/keystone upgrades

### Week 3 (Day 15-21): PRO TIER MOMENTUM
- Goal: 8 Pro customers = £1,592 MRR
- Day 15-17: Watchdog Cert launch (£4,950 × 2 = £9,900 one-time)
- Day 18-19: Pro tier onboarding automation
- Day 20-21: SBT bridge on-chain deploy (deferred from Day 1, now safer)

### Week 4 (Day 22-28): ENTERPRISE TRACTION
- Goal: 2 Enterprise customers = £2,998 + Pro carryover ≈ £5,000 MRR
- Day 22-25: Enterprise outreach (5 high-fit: Monzo/Cera/Stitch/CareHome/Fintech-EU)
- Day 26-28: First Enterprise close

### Week 5 (Day 29-35): COMPLIANCE SUITE EXPANSION
- Goal: 5 Enterprise + 20 Pro = £12,475 MRR
- Day 29-31: NIS2 + CRA pillars launched (2 new MCPs)
- Day 32-34: white-label partnerships (2 consultancies onboard)
- Day 35: half-sprint retrospective

### Week 6 (Day 36-42): ARTICLE 50 RAMP
- Goal: 10 Enterprise + 30 Pro = £20,965 MRR
- Day 36-38: Article 50 deadline urgency campaigns
- Day 39-40: Region-specific landing pages (UK/EU/CA/APAC)
- Day 41-42: AEO content blitz (100 articles)

### Week 7 (Day 43-49): FINAL SPRINT
- Goal: 15 Enterprise + 50 Pro = £32,479 MRR
- Day 43-45: Last-minute outreach (10 prospects)
- Day 46-47: Cert renewals + Pro expansion
- Day 48-49: Pre-Article-50 backlog (Aug 2 is hard cliff)

### Week 8 (Day 50-53): AUGUST 2 CLIFF
- Goal: 20 Enterprise + 80 Pro = £45,860 MRR (overshoot, but be ready)
- Day 50-51: Live enforcement-day prep
- Day 52: Sprint retrospective
- Day 53: Article 50 LIVE. Sprint closes.

## The Daily Ritual (5 moves, 1 hour each)
1. **07:30 launchd fires** — morning-rundown cron runs the E2E suite + keystones + SOV3 dashboard + sigil
2. **08:30 human check** — Sir Nick reads 4-section seal, ratifies moves
3. **09:00-12:00 build window** — JEEVES ships the 3-5 highest-leverage moves
4. **12:00 keystroke batch** — Sir Nick does 5-min unblock (env keys, Vercel clicks, Namecheap)
5. **17:00 seal + sigil** — JEEVES emits sigil #N+1, updates the master handoff, posts to iCloud

## The 5 Human Gates (in priority order, all 5 min each)
1. **EMAIL_ADDRESS + EMAIL_PASSWORD** in ~/clawd/.env.local — fires mailer
2. **MEOK_MASTER_API_KEY** — signs Pro tier + paywalled tools
3. **meok.ai re-alias** (Vercel dashboard) — homepage traffic
4. **IndexNow key file** — Bing indexing
5. **$30 in domain buys** — 4 missing .ai domains + openpatent.ai un-park

## The 8 Anti-Churn Patterns (sprint guards)
1. Don't ship surface area without conversion wiring (AGENTS.md rule #1)
2. Don't push to Vercel during WAF cooldown (AGENTS.md rule #2)
3. Don't sign keystone certs when keystone is down (verify with curl first)
4. Don't merge to main when feat/* has unmerged files (run `git status` first)
5. Don't issue >3 keystone certs/day per email (3/day cap)
6. Don't trust `services.json` status (verify with `lsof`/curl)
7. Don't trust memory of substrate state (verify with sigil #N+1 echo)
8. Don't ship without sigil (every shipped move gets one)
