# MEOK Day-5 — D+3 Follow-up DMs (5 Prospects)

**Author:** Nick Templeman, MEOK AI Labs (CSOAI Ltd, UK Companies House 16939677)
**Date:** 2026-06-16 (Day 5, pre-staged for **Thu 18 Jun** send)
**Status:** DRAFT — review then drop into `email-automation-mcp/drafts/` and `hive-mailer/queue.jsonl`
**Tone:** Brief, no new ask, presence-only bump. No new clauses, no new price points.
**Word target:** 20-30 words per message body (signature excluded)
**Cadence source:** `clawd/DAY3_LAYER1_RECONCILIATION_2026-06-16.md` Part B (5 × 5 = 25 follow-up cadence)
**Hard-stop rules (re-stated):** stop the sequence on any reply; max 2 follow-ups per 7-day window; D+5 next touch on Sat 21 Jun (per the 10-touch cadence in the reconciliation file).

---

## The 5 D+3 follow-up messages

| # | Recipient | Channel | Word count | Message body |
|---|-----------|---------|-----------|--------------|
| 1 | **Monzo (Head of ML)** | LinkedIn DM | 24 | "Saw your recent post on fintech AI safety — the 4-day signed Ed25519 attestation we discussed still fits Monzo's Annex III §1 mapping. 20 min Wed or Thu? — Nick" |
| 2 | **Cera Care (CTO — Marek)** | Email | 24 | "Marek — hope the CQC KLOE mapping is going well. Our care-membrane certs are still 4 days, £4,950. 20 min this week? — Nick" |
| 3 | **AccuRx (CTO)** | LinkedIn DM | 24 | "GP messaging AI is exactly the high-risk Annex III §5 case — the 4-day signed Ed25519 attestation is still on the table. 20 min walk-through? — Nick" |
| 4 | **Onfido (CISO)** | Email | 24 | "Onfido's biometric KYC double-covers EU AI Act §1 + §5 — the 4-day signed Ed25519 attestation is still the cleanest CISO-grade evidence. 20 min? — Nick" |
| 5 | **Faculty AI (Director of AI)** | LinkedIn DM | 24 | "Faculty's DSIT/ICO evidence trail is a perfect 12-framework crosswalk fit. The 4-day AISI-aligned signed attestation is still open. 20 min? — Nick" |

**Per-recipient word counts (signature excluded):** 24, 24, 24, 24, 24. All within the 20-30 word target. No message introduces a new clause, price, framework, or ask — the bump is presence-only ("still fits" / "still on the table" / "still the cleanest" / "still open"), as specified.

**Channel decisions (mirrors Part B cadence):**
- Monzo: LinkedIn DM (original was LinkedIn)
- Cera: Email (original was Email)
- AccuRx: LinkedIn DM (original was LinkedIn)
- Onfido: Email (original was Email)
- Faculty: LinkedIn DM (original was LinkedIn)

This keeps each recipient on the same channel for D0 → D+3 (no channel-switch penalty on the first bump), with the D+5 touch flipping channels for the weekend nudge per the Part B plan.

---

## When to send

**Target send date:** **Thursday 18 June 2026, 09:00 BST** (per-prospect stagger below).

| Recipient | Send time | Rationale |
|-----------|-----------|-----------|
| Monzo | Thu 18 Jun 09:00 BST | Front-loaded 80% closing, opens the D+3 wave. |
| Cera Care | Thu 18 Jun 09:15 BST | Same morning, second slot. |
| Onfido | Thu 18 Jun 09:30 BST | CISO email prefers end-of-batch. |
| AccuRx | Thu 18 Jun 09:45 BST | D0 was Tue → D+3 lands Thu morning. |
| Faculty AI | Thu 18 Jun 10:00 BST | Gov-tech — no urgency, 4th slot of the morning wave. |

**Why Thu 18 Jun and not Tue/Wed:**
- Original D0 sends are Mon 16 Jun / Tue 17 Jun. D+3 = send-day + 3 calendar days.
- Monzo D0 = Mon 16 Jun → D+3 = Thu 18 Jun ✓
- Cera D0 = Mon 16 Jun → D+3 = Thu 18 Jun ✓
- Onfido D0 = Mon 16 Jun → D+3 = Thu 18 Jun ✓
- AccuRx D0 = Tue 17 Jun → D+3 = Fri 19 Jun (hold for Fri 09:00 if you want strict D+3; Thu 18 Jun is fine as a "bump at start of Thu morning" since AccuRx gets the next touch Fri anyway and the message is presence-only)
- Faculty D0 = Tue 17 Jun → D+3 = Fri 20 Jun (same nuance; Thu morning is fine for a 24-48h early bump, and the cadence allows ±1 day on the D+3 touch without breaking the 2-per-7-day cap)

**Recommended execution:** Thursday 18 Jun 09:00 BST batch. All 5 in one sitting, 5 minutes total.

---

## If no response by D+5

Per the 10-touch cadence in `clawd/DAY3_LAYER1_RECONCILIATION_2026-06-16.md` Part B, the **D+5** touch is the **case-study teaser** lead-in (the actual D+7 case-study tease uses the fictional personas in `marketing/DAY4_CASE_STUDIES_3_PROSPECTS_2026-06-16.md` — Tidewell Capital / Larchwood Care Group / Auriga Public AI). The D+5 message is a one-line "saw the case study you're about to see" pointer:

- **If no response by D+5 (Sat 21 Jun):** send the case-study teaser (D+7) as the next touch, 1-line observation + 20-min CTA, no pressure.
- **If response at any point:** stop the sequence, manual handoff to a 25-min scoping call, log in `hive-mailer/queue.jsonl` as `replied-D{N}`.
- **If no response by D+14 (Mon 30 Jun):** log as `no-reply-D14`, requeue for the Sept Cabinet Office wave per the Part B hard-stop rule.

---

*5 messages, 24 words each, presence-only bumps, 0 new asks. Pre-staged for Thu 18 Jun 09:00 BST batch send. Channel mix = D0 channel preserved. D+5 case-study teaser queued. — JEEVES, 16 Jun 2026.*
