# Scorecard Drip Sequence — 4 emails

**Trigger:** scorecard runner submits email (now wired via Buttondown subscribe in /scorecard).
**Tag in Buttondown:** `scorecard-runner`
**Schedule:** Day 0 (immediate), Day 2, Day 4, Day 7
**Sender:** Nicholas Templeman <nicholas@csoai.org>
**From name:** Nicholas at MEOK AI Labs
**Reply-to:** nicholas@csoai.org

**Buttondown automation:**
1. Create new automation in Buttondown dashboard
2. Trigger: subscriber added with tag `scorecard-runner`
3. Add 4 emails below as steps with delays

---

## Email 1 — Day 0 (immediate, sent within 1 minute of submission)

**Subject:** Your EU AI Act readiness cert + a fast follow-up
**Preheader:** Your signed compliance attestation is in your inbox separately. This is the one-page follow-up.

---

Hi {{ subscriber.metadata.entity | default: "there" }},

Thanks for running the readiness scorecard — your signed compliance attestation is on its way separately (sent automatically by our cert API). Verify cert URL is in that email.

You scored {{ subscriber.metadata.score | default: "[score]" }} / 100. Quick context on what that actually means:

- **70+** : You're operationally ready. Most gaps are documentation / signed-evidence formality, not technical.
- **50-69** : Material gaps. Annex III scoping, Article 9 RMS, or Article 50 watermarking likely missing.
- **<50** : Pre-Series-C startup territory. Your priority is the 4-hour MVP compliance posture (Article 4 literacy, Article 5 self-check, Annex III scoping note). See [meok.ai/eu-ai-act-for-ai-startups](https://meok.ai/eu-ai-act-for-ai-startups).

Three things to know:

1. **Article 50 watermarking deadline is 2 August 2026.** Hard cliff. If you ship generative outputs and you flagged that as a gap, the £99 starter kit at [meok.ai/article-50-kit](https://meok.ai/article-50-kit) is the fastest path. Includes C2PA manifest template + signing-key custody policy + signed cert.

2. **Digital Omnibus delayed Annex III high-risk to 2 December 2027.** If you scored low on Articles 9-15 / 26 / 43 / 72 obligations, you have 16 more months than you thought. Full rundown: [meok.ai/blog/digital-omnibus-delay-2026](https://meok.ai/blog/digital-omnibus-delay-2026).

3. **Article 4 literacy is already binding** since 2 February 2025. No grace period. If your team doesn't have a documented training programme yet, that's the highest-ROI next hour of work. Template: [meok.ai/eu-ai-act/article-4](https://meok.ai/eu-ai-act/article-4).

Reply to this email if any specific gap is unclear. I read every reply.

— Nicholas
Founder, MEOK AI Labs · CSOAI LTD · UK Companies House 16939677

---

## Email 2 — Day 2 (2 days after submission, 9am UK)

**Subject:** What I usually find when teams hand me their first audit pack
**Preheader:** Pattern-match from ~50 scorecard reviews. The same gaps come up.

---

Hi {{ subscriber.metadata.entity | default: "there" }},

Quick follow-up to your scorecard from a couple days ago.

When teams hand me their first compliance pack and ask "what's missing," the same gaps come up almost every time:

**1. Article 4 literacy is documented but not LOGGED.** Teams write a 2-page training memo (good) but don't keep a log of who completed it (mandatory). Auditor asks for the log; team can't produce it; non-compliance recorded. Fix: a Google Sheet with name + role + completion date + course link is enough. 30 minutes of work.

**2. Article 9 RMS is "we have a process" — but not WRITTEN.** "Continuous, iterative risk identification" is fine philosophy; auditor wants to see the document with rev history. Fix: even a single-page Notion doc with date-stamped updates beats nothing. The format matters less than the rev trail.

**3. Article 13 instructions for use are SPARSE.** Most teams ship 1-page user docs. Article 13 wants intended-use specification, performance metrics, foreseeable misuse, oversight measures, accuracy guidance, post-deployment changes process. Fix: my [meok.ai/transparency](https://meok.ai/transparency) £399/mo product generates this from your scorecard answers.

**4. Article 50 watermarking is "we'll do it later."** August 2026 is in 96 days. C2PA signing-key custody alone is 2 weeks of engineering if you do it right. Fix: [meok.ai/article-50-kit](https://meok.ai/article-50-kit) £99 ZIP gets you 80% of the way in an afternoon.

**5. Annex III scoping is implicit, not WRITTEN.** Teams "know" they're not Annex III but don't have a documented scoping note. Auditor: "show me the scoping note." Team: "uh." Fix: 1-paragraph note that maps your AI features to Annex III(1)-(8) with reasoning. 20 minutes.

If 2-3 of these resonate, reply with which ones and I'll send template language for each.

— Nicholas

---

## Email 3 — Day 4 (4 days after submission, 9am UK)

**Subject:** The £4,950 question — when the audit-prep bundle pays back
**Preheader:** Three triggers when buying compliance evidence makes sense, and three when it doesn't.

---

Hi {{ subscriber.metadata.entity | default: "there" }},

A reasonable thing to be skeptical about: when does paying £4,950 for a 14-day audit-prep bundle actually make sense vs. doing it yourself or hiring an auditor?

**Buy the bundle when:**

1. **You're being asked for signed compliance evidence in an enterprise procurement RFP.** A single £100K+ deal lost because you couldn't produce a signed evidence pack pays for the bundle 20× over.

2. **Your Notified Body submission is 4-8 weeks away.** Pre-built evidence reduces NB review cycles from 3-4 to 1-2. Faster submission = faster CE marking = faster shipping.

3. **You're scaling from 1-50 employees to 50-200 and the founder is the de-facto compliance person.** Buying back 80 hours of founder time at £4,950 is a steal. That's £62/hr; founder time is worth £200-£500/hr.

**Don't buy it when:**

1. **You're pre-Product-Market-Fit, no EU customers yet.** Free scorecard + 4-hour MVP compliance posture is enough. Spend the £4,950 on growth.

2. **You're already paying a Big4 firm £40-£100K for AI Act work.** They include the signed evidence (in theory). Don't pay twice.

3. **You're a hobbyist / open-source project.** Free MIT MCPs at [pypi.org/project/meok-eu-ai-act-mcp](https://pypi.org/project/meok-eu-ai-act-mcp/) cover everything you need.

If you're in the "buy" column, here's what the bundle includes:

- 14-day delivered (signed kickoff in 24h)
- Articles 4, 9, 10, 13, 14, 15, 26, 43, 50, 72 evidence pack
- DORA + NIS2 + EU CRA crosswalks (if applicable to your sector)
- HMAC-SHA256 signed cert per control with public verify URL
- 1-hour Notified Body / auditor walkthrough call if needed
- 30 days email support post-delivery

[Book a 30-min triage call →](mailto:nicholas@csoai.org?subject=Audit-prep%20bundle%20triage%20call)

Or buy directly: [meok.ai/audit-prep-bundle](https://meok.ai/audit-prep-bundle)

— Nicholas

---

## Email 4 — Day 7 (1 week after submission, 9am UK)

**Subject:** Last note from me + 30-min office hours offer
**Preheader:** This is the last drip email. Then you just get the weekly Brief if subscribed.

---

Hi {{ subscriber.metadata.entity | default: "there" }},

This is the last automated email in the scorecard sequence. After this you'll just get the weekly EU AI Compliance Brief on Mondays (3 min read, can unsubscribe in one click).

Two final things:

**1. Free 30-min office hours.** I do these every Friday afternoon UK time for AI founders / compliance leads who took the scorecard. No sales pitch, no slide deck — bring your specific question, get a direct answer. Book via reply (just say "office hours" + 2-3 time options).

**2. Tell a friend.** If the scorecard or these emails were useful, the single most helpful thing you can do is forward this to one peer at another AI company who might also be confused about EU compliance. The MEOK distribution model is word-of-mouth + signed evidence; we don't run ads. One forwarded email = more impact than anything else you could do for us.

Whatever path you take from here — DIY MVP compliance, pay an auditor, hire a Big4, buy our audit-prep bundle, or wait and see — get something signed and dated this quarter. The teams that survive their first EU customer audit are the ones that have *anything* documented and *signed*. Empty folders fail.

Best of luck.

— Nicholas Templeman
Founder, MEOK AI Labs
CSOAI LTD · UK Companies House 16939677
nicholas@csoai.org

P.S. The Compliance Brief drops every Monday 8am UK if you're still subscribed. Skip / unsubscribe / reply anytime.

---

## Setup checklist (Nick, ~45 min total)

- [ ] Sign up at https://buttondown.email (free tier covers 100 subs, then £9/mo to 1K, £29/mo to 10K)
- [ ] Create newsletter handle `meok-eu-ai-compliance-brief` (verify the embed-form URL on /scorecard + /newsletter matches)
- [ ] Verify domain (DNS records on Namecheap take ~10 min to propagate)
- [ ] Create automation called "Scorecard runner drip"
- [ ] Add 4 emails above, delays: 0min, 2 days, 4 days, 7 days
- [ ] Trigger: subscriber added with tag `scorecard-runner`
- [ ] Test: run scorecard yourself with a fresh email → verify all 4 emails arrive on schedule
- [ ] Set up Sunday-write / Monday-send schedule for the weekly Compliance Brief
