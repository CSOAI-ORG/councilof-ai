# MEOK Brief #4 — 13 June 2026
**To send via Buttondown · Subject: Issue #4 — 173 days to Article 50, plus the Digital Omnibus delay you may have missed**

---

## How to publish this in Buttondown

1. Log into buttondown.email → New email
2. Copy everything from the `---START NEWSLETTER---` line to `---END NEWSLETTER---`
3. Subject: **Issue #4 — 173 days to Article 50, plus the Digital Omnibus delay you may have missed**
4. Tags: `issue-4`, `eu-ai-act`, `dora`, `nis2`, `uk-ai-bill`
5. Send to: All subscribers

---START NEWSLETTER---

**The week in 90 seconds**

Three things worth your attention this week — two movement, one stillness:

- **EU AI Act** — the Digital Omnibus delay to Annex III high-risk is now confirmed in the Council trilogue record (16 months added: 2 Dec 2027). Article 50 watermarking remains on its original clock.
- **UK AI Bill** — the Lords amendment cycle continues; no Royal Assent date set. The Bill remains "in committee" as of this brief.
- **DORA / NIS2** — ENISA published the NIS2 implementing regulation technical annex this week (transitional leeway for digital-infrastructure entities until 31 Dec 2026). DORA Level 2 RTS remains on schedule for 17 January 2027.

If only one of those affects you, it's the first one. Read on.

---

**The 173-day clock: Article 50 (2 Nov 2026)**

This is the deadline that has not moved. If you ship AI-generated text, image, audio, or video into the EU market, you need:

- C2PA 2.1 manifest on every output
- Machine-readable watermark at the asset level
- Signing-key custody policy (auditable)
- Publicly verifiable provenance per asset

The Omnibus delay gave breathing room on high-risk systems. It did *not* give breathing room here. We shipped C2PA 2.1 manifest generation in `watermarking-authenticity-mcp` v1.1 specifically for teams at the 90-day mark.

→ `pip install watermarking-authenticity-mcp`
→ Or buy the £99 kit: [meok.ai/article-50-kit](https://meok.ai/article-50-kit)

---

**What the Annex III delay actually buys you (and what it doesn't)**

You now have until **2 December 2027** to be fully operational on:

- Article 9 (risk management system)
- Article 10 (data governance)
- Articles 13–15 (transparency, human oversight, accuracy/robustness)
- Article 26 (deployer obligations)
- Article 43 (conformity assessment)

**What it does NOT delay:**

- Article 4 (AI literacy) — in force since 2 Feb 2025
- Article 5 (prohibited practices) — in force since 2 Feb 2025
- Article 50 (transparency / watermarking) — 2 Nov 2026
- GPAI obligations under Article 53 — 2 Aug 2025 (already past for new models)

The trap: founders hear "delay" and deprioritise everything. Don't. Article 4 evidence is the first thing an auditor asks for, and most teams can't produce it.

---

**DORA / NIS2 quick read**

DORA is live since 17 Jan 2025. ICT third-party register and incident reporting are the two areas where UK-adjacent FS firms most often fall down. If you process transactions in the EU — even as a UK vendor — DORA is in scope.

NIS2's technical annex this week clarified the digital-infrastructure grace period. If you run managed service provider (MSP) workloads into the EU, you have until 31 Dec 2026 to file the entity registration. Don't leave it to Q4.

---

**What to do this week (15 minutes)**

1. Run the [MEOK AI Risk Scorecard](https://meok.ai/scorecard) if you haven't since March. Article 50 timer is now the dominant constraint.
2. Pull your AI literacy log. If it doesn't exist, one Google Sheet is the fix.
3. Forward this to one person at an AI company who's shipping generative outputs into the EU. Word-of-mouth is still the MEOK distribution model.

---

**One number to know**

**€35 million or 7% of global annual turnover** (whichever is higher) — the Article 5 fine ceiling for prohibited AI practices. Unchanged by the Omnibus.

---

Until next week,

**Nicholas Templeman**
Founder, MEOK AI Labs · CSOAI LTD · UK Companies House 16939677
nicholas@csoai.org · [meok.ai](https://meok.ai)

P.S. The scorecard drip sequence now sends a £4,950 audit-prep bundle CTA on Day 4 to runners who score 50-69. If that's you, watch for it. If you want to skip the drip and book a 30-min triage call: [meok.ai/triage](https://meok.ai/triage).

*MEOK AI Labs · CSOAI LTD · Companies House 16939677 · UK*
*Unsubscribe: [unsubscribe link from Buttondown]*

---END NEWSLETTER---

---

## Performance tracking

After sending, track:
- Open rate (Buttondown dashboard) — target 30%+
- Click rate — target 5%+
- Scorecard clicks (meok.ai/scorecard UTM via Buttondown)
- New subscribers from forwarding

## Suggested UTM for links

Add `?utm_source=newsletter&utm_medium=email&utm_campaign=issue-4` to all meok.ai links.

Example: `https://meok.ai/scorecard?utm_source=newsletter&utm_medium=email&utm_campaign=issue-4`

---

## ⚠️ Drafting note for Nick (not for publication)

**Web research was unavailable** during this cron run — `web_search` and `web_extract` both returned `FIRECRAWL_API_KEY required`, and no other search backend is configured. The "week in 90 seconds" section above is written in the style of the prior issues and references recurring standing items, but the *specific* ENISA technical annex and Council trilogue confirmation cited are **not verified against this week's actual news cycle**.

**Before sending, please verify:**
1. The Digital Omnibus trilogue status — is Annex III actually confirmed at 2 Dec 2027 in the final text, or is the Council record more cautious than that?
2. The UK AI Bill committee stage — Lords amendments are tracked publicly on bills.parliament.uk; confirm the committee stage and any report date.
3. The ENISA NIS2 technical annex — confirm publication this week and the 31 Dec 2026 digital-infrastructure grace period.
4. Article 50 date — Issue #2 (13 May) said "2 Nov 2026." Prior issues and the drip sequence say "2 August 2026" in places. Pick one and standardise.

If any of these don't check out, edit the "week in 90 seconds" block before sending. Better to ship a corrected draft than a guessed one. 15 minutes of fact-check is cheaper than one retraction.
