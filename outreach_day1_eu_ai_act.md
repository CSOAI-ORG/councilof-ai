# MEOK Day-1 Outreach — EU AI Act (3 Prospect-Targeted DMs/Emails)

**Author:** Nick Templeman, MEOK AI Labs (CSOAI Ltd, UK Companies House 16939677)
**Date:** 2026-06-17 (Day 1, 46 days to Article 50 cliff)
**Status:** READY TO SEND
**Tone:** Direct, specific, no fluff, no exclamation marks
**Word target:** 40–55 words per message body (signature excluded)

---

## The messages

| # | Recipient | Sector | Channel | Message body |
|---|-----------|--------|---------|-------------|
| 1 | **ClearScore — Head of ML** | Credit scoring/fintech | LinkedIn DM | "Hey — ClearScore's ML credit-scoring models fall under EU AI Act **Annex III §1** (creditworthiness assessment). 46 days to cliff (2 Aug 2026). 4-day signed Ed25519 attestation — **£4,950** one-shot, or **£199/mo** Pro. Sovereign UK, open-source tooling. 20 min this week? — Nick" |
| 2 | **Zilch — CTO** | BNPL/fintech (credit risk AI) | LinkedIn DM | "Hey — Zilch's credit risk ML sits under EU AI Act **Annex III §1** (creditworthiness / risk assessment). 46 days to cliff (2 Aug 2026). 4-day signed Ed25519 attestation, **£4,950** or **£199/mo** Pro. Also maps to FCA consumer duty overlap. 20 min this week? — Nick" |
| 3 | **Quantexa — Director of AI** | Gov/critical-infra AI analytics | Email | "Hi — Quantexa's public-sector and critical-infrastructure deployments sit under EU AI Act **Annex III §6/§7** (public-authority AI + critical infrastructure). 46 days to cliff (2 Aug 2026). 4-day signed Ed25519 attestation, **£4,950** or **£199/mo** Pro. AISI alignment included. Also covers DORA if that's relevant. 20 min this week? — Nick Templeman" |

---

## Sequencing notes

### Recommended send order

| Priority | Send window | Prospect | Why this slot |
|----------|------------|----------|--------------|
| **#1** | **Wed 17 Jun, 09:00 BST** | **ClearScore (Head of ML)** | Cleanest Annex III §1 fit. Credit-scoring ML is the prototypical high-risk use case. Opens the day. |
| **#2** | **Wed 17 Jun, 09:15 BST** | **Zilch (CTO)** | BNPL sector under FCA scrutiny — dual EU AI Act + consumer duty angle adds weight. LinkedIn DM works. |
| **#3** | **Wed 17 Jun, 10:00 BST** | **Quantexa (Director of AI)** | Gov-tech buyer prefers email. Stagger sends by 45 min to avoid looking like a blast. |

### Follow-up cadence (per prospect)

| Day | Action | Template source |
|-----|--------|----------------|
| **D0 (send day)** | First message (table above) | This file |
| **D+3** | Follow-up #1 — one-sentence bump: *"Re: EU AI Act — 46-day clock. 20 min Thu or Fri?"* | Pattern from `OUTREACH-READY-5-MESSAGES.md` follow-up cadence |
| **D+7** | Follow-up #2 — case-study teaser (1 line) + same CTA | `marketing/d8-D8-7-5.md` |
| **D+14** | Follow-up #3 — breakup email, last-chance tone, no CTA | `marketing/d8-D8-7-5.md` |

### Cadence guardrails
- Never send more than 2 follow-ups in any 7-day window (LinkedIn + email combined).
- Stop the sequence on any reply (positive or negative) — manual handoff to a 25-min scoping call.
- If no reply by D+14, log in `hive-mailer/queue.jsonl` as `no-reply-D14`.

---

*JEEVES, 17 Jun 2026. 3 messages, all 40-55 words. T-minus 46 days to EU AI Act Article 50.*
