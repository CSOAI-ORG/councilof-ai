# MEOK Day-2 Outreach — DORA Compliance (3 Prospect-Targeted Emails)

**Author:** Nick Templeman, MEOK AI Labs (CSOAI Ltd, UK Companies House 16939677)
**Date:** 2026-06-17 (Day 2, DORA enforcement in effect since Jan 2025)
**Status:** READY TO SEND
**Tone:** Direct, specific, no fluff, no exclamation marks
**Word target:** 40–55 words per message body (signature excluded)

---

## The messages

| # | Recipient | Sector | Channel | Message body |
|---|-----------|--------|---------|-------------|
| 1 | **Starling Bank — CISO** | Challenger bank (ICT third-party risk) | Email | "Hi — Starling's ICT third-party arrangements fall under DORA **Article 21** (ICT third-party risk management). Enforcement has been live since Jan 2025. 4-day signed Ed25519 gap analysis — **£4,950** one-shot, or **£199/mo** Pro. Maps AI systems to DORA requirements. 20 min this week? — Nick" |
| 2 | **Hiscox — Operational Resilience Director** | Lloyd's syndicate / insurance | Email | "Hi — Hiscox's AI-driven underwriting and claims systems sit under DORA **Article 21** (ICT third-party risk) and **Article 18** (ICT risk management framework). Jan 2025 enforcement is live. 4-day signed gap analysis with cryptographically signed evidence — **£4,950** one-shot, or **£199/mo** Pro. Also covers EU AI Act Annex III if needed. 20 min this week? — Nick Templeman" |
| 3 | **Nutmeg (JP Morgan) — Head of Compliance** | UK wealth management (robo-advisory AI) | Email | "Hi — Nutmeg's robo-advisory AI and platform dependencies sit under DORA **Article 21** (third-party risk) and **Article 18** (ICT risk management). Jan 2025 enforcement is live, and the FCA expects documented compliance. 4-day signed gap analysis — **£4,950** one-shot, or **£199/mo** Pro. 20 min this week? — Nick" |

---

## Sequencing notes

### Recommended send order

| Priority | Send window | Prospect | Why this slot |
|----------|------------|----------|--------------|
| **#1** | **Thu 18 Jun, 09:00 BST** | **Starling Bank (CISO)** | Challenger banks have the deepest ICT third-party risk surface. CISO = security buyer, email preferred. |
| **#2** | **Thu 18 Jun, 09:15 BST** | **Hiscox (OpRes Director)** | Lloyd's syndicates are under PRA scrutiny on operational resilience. DORA + AI Act overlap is the strongest cross-sell angle in the set. |
| **#3** | **Thu 18 Jun, 10:00 BST** | **Nutmeg / JP Morgan (Head of Compliance)** | Wealth management robo-advisors are a clean DORA + EU AI Act §1 dual-fit. Compliance buyer prefers email and longer consideration cycle. |

### Follow-up cadence (per prospect)

| Day | Action | Template source |
|-----|--------|----------------|
| **D0 (send day)** | First message (table above) | This file |
| **D+3** | Follow-up #1 — one-sentence bump: *"Re: DORA — Jan 2025 enforcement is already live. Have your ICT third-party arrangements been mapped yet? 20 min Wed or Thu?"* | Pattern from `OUTREACH-READY-5-MESSAGES.md` follow-up cadence |
| **D+7** | Follow-up #2 — case-study teaser (1 line) + same CTA | `marketing/d8-D8-7-5.md` |
| **D+14** | Follow-up #3 — breakup email, last-chance tone, no CTA | `marketing/d8-D8-7-5.md` |

### Cadence guardrails
- Never send more than 2 follow-ups in any 7-day window (LinkedIn + email combined).
- Stop the sequence on any reply (positive or negative) — manual handoff to a 25-min scoping call.
- If no reply by D+14, log in `hive-mailer/queue.jsonl` as `no-reply-D14`.

---

*JEEVES, 17 Jun 2026. 3 messages, all 40-55 words, all spec-compliant. Manual-send ETA: 10 minutes. DORA enforcement live since Jan 2025 — no cliff urgency, but FCA/PRA are running targeted reviews now.*
