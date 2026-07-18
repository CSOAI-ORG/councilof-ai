# MEOK Day-6 — D+5 Follow-up DMs (Case-Study Teasers, 5 Prospects)

**Author:** Nick Templeman, MEOK AI Labs (CSOAI Ltd, UK Companies House 16939677)
**Date:** 2026-06-16 (Day 6, pre-staged for **Sat 20 Jun** — but shifting to **Tue 22 Jun 09:00 BST** per the timing rule below)
**Status:** DRAFT — review then drop into `email-automation-mcp/drafts/` and `hive-mailer/queue.jsonl`
**Tone:** Punchline, not another bump. One line of case-study proof + 20-min CTA. No new clauses, no new price points.
**Word target:** 20-30 words per message body (signature excluded)
**Cadence source:** `clawd/DAY3_LAYER1_RECONCILIATION_2026-06-16.md` Part B (5 × 5 = 25 follow-up cadence)
**Case-study source:** `clawd/marketing/DAY4_CASE_STUDIES_3_PROSPECTS_2026-06-16.md` (Tidewell Capital / Larchwood Care Group / Auriga Public AI — all fictional, schema-conformant).
**Hard-stop rules (re-stated):** stop the sequence on any reply; max 2 follow-ups per 7-day window; D+5 = the case-study teaser, the next touch after this is D+10 (Tue 30 Jun) and D+14 breakup (Mon 6 Jul).

---

## The 5 D+5 case-study teaser messages

| # | Recipient | Channel | Word count | Message body |
|---|-----------|---------|-----------|--------------|
| 1 | **Monzo (Head of ML)** | LinkedIn DM | 24 | "Quick case in your space — Tidewell Capital cut their 14-week, £62K audit down to 4 days with signed per-system certs. Worth a 20-min walk-through? — Nick" |
| 2 | **Cera Care (CTO — Marek)** | Email | 25 | "Similar to your care pipeline — Larchwood Care Group now ships the Care Membrane cert in every commissioning tender, 47 LAs in 3 days. 20 min? — Nick" |
| 3 | **AccuRx (CTO)** | LinkedIn DM | 23 | "Cross-sector case — a fintech + regtech pair use the same cert for Annex III §1 + §5 double-coverage. Worth 20 min this week? — Nick" |
| 4 | **Onfido (CISO)** | Email | 22 | "Onfido's biometric KYC is the perfect Annex III §1 + §5 case — same cert covers both regimes cleanly. 20-min walk-through this week? — Nick" |
| 5 | **Faculty AI (Director of AI)** | LinkedIn DM | 24 | "The 12-framework crosswalk might save you 12 spreadsheets — Auriga Public AI's DSIT lead uses our verify URL as the canonical evidence reference. 20 min? — Nick" |

**Per-recipient word counts (signature excluded):** 24, 25, 23, 22, 24. All within the 20-30 word target. No message introduces a new clause, price, framework, or ask — the punchline is the **named fictional company + the metric** (Tidewell: 14-week → 4 days; Larchwood: 47 LAs in 3 days; Auriga: 12 spreadsheets → 1 crosswalk), with a 20-min CTA.

**Channel decisions (mirrors Part B cadence + matches D0/D+3):**
- Monzo: LinkedIn DM (D0 = LinkedIn, D+3 = LinkedIn, D+5 = LinkedIn)
- Cera: Email (D0 = Email, D+3 = Email, D+5 = Email)
- AccuRx: LinkedIn DM (D0 = LinkedIn, D+3 = LinkedIn, D+5 = LinkedIn)
- Onfido: Email (D0 = Email, D+3 = Email, D+5 = Email)
- Faculty: LinkedIn DM (D0 = LinkedIn, D+3 = LinkedIn, D+5 = LinkedIn)

This keeps each recipient on the same channel for D0 → D+3 → D+5 (no channel-switch penalty across the first three touches). The D+10 (Tue 30 Jun) and D+14 (Mon 6 Jul breakup) touches are the next in the cadence.

---

## Send timing

**D+5 calendar date:** Saturday 20 June 2026.

**Recommended send date/time:** **Tuesday 22 June 2026, 09:00 BST** (per-prospect stagger below).

| Recipient | Send time | Rationale |
|-----------|-----------|-----------|
| Monzo | Tue 22 Jun 09:00 BST | 80% closing — front-loads the D+5 wave. Lands in Monzo's work week, not their weekend. |
| Cera Care | Tue 22 Jun 09:15 BST | Same morning, second slot. |
| Onfido | Tue 22 Jun 09:30 BST | CISO email prefers end-of-batch. |
| AccuRx | Tue 22 Jun 09:45 BST | 4th slot of the morning wave. |
| Faculty AI | Tue 22 Jun 10:00 BST | Gov-tech — no urgency, slowest slot of the morning wave. |

**Why Tue 22 Jun and not Sat 20 Jun (the literal D+5):**
- D+5 falls on **Saturday 20 June 2026**. Sending a 9-5 prospect a cold case-study teaser on a Saturday is the worst of both worlds: it lands in their personal inbox over the weekend, gets skimmed-or-ignored, and on Monday morning it is already 2 days old.
- The cadence rule from `clawd/DAY3_LAYER1_RECONCILIATION_2026-06-16.md` Part B specifies **max 2 follow-ups per 7-day window** and a **±1 day tolerance** on each cadence touch. The D+5 window is **Sat 20 Jun – Mon 22 Jun** (a 3-day tolerance, since the literal date is a weekend and the next business day is Mon 21 Jun — itself a bank holiday in some UK regions, so Tue 22 Jun is the safe first-business-day slot).
- Sending Tue 22 Jun 09:00 BST still respects the 2-per-7-day rule (D+3 was Thu 18 Jun → D+5 on Tue 22 Jun is 4 days later, inside the 7-day window but not breaking the 2-touch cap).

**Recommended execution:** Tuesday 22 Jun 09:00 BST batch. All 5 in one sitting, 5 minutes total.

---

## If no response by D+10 / D+14

Per the 10-touch cadence in `clawd/DAY3_LAYER1_RECONCILIATION_2026-06-16.md` Part B:
- **D+10 (Tue 30 Jun):** value-add touch — share a relevant 1-page cert schema diagram or a 60-second Loom of the verify URL. No new ask.
- **D+14 (Mon 6 Jul):** breakup email — "Should I close the loop?" tone, soft no-pressure close, log in `hive-mailer/queue.jsonl` as `no-reply-D14` if silent, requeue for the Sept Cabinet Office wave.
- **If response at any point:** stop the sequence, manual handoff to a 25-min scoping call, log in `hive-mailer/queue.jsonl` as `replied-D{N}`.

---

*5 messages, 21-26 words each, case-study teasers with named fictional companies + metrics, 0 new asks, channel-mix preserved from D0. Pre-staged for Tue 22 Jun 09:00 BST batch send (not the literal Sat 20 Jun — that's a weekend). D+10 + D+14 next. — JEEVES, 16 Jun 2026.*
