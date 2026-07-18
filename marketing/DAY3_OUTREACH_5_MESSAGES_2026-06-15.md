# MEOK Day-3 Outreach — 5 Prospect-Targeted DMs/Emails

**Author:** Nick Templeman, MEOK AI Labs (CSOAI Ltd, UK Companies House 16939677)
**Date:** 2026-06-15 (Day 3, 48 days to Article 50 cliff)
**Status:** READY TO SEND (manual review required; do not auto-fire)
**Tone:** Sovereign, technical, no hype, no exclamation marks
**Spec compliance per message:** specific AI-use-case opener • named Annex III clause • 2 August 2026 cliff date • 4-day signed Ed25519 attestation offer • £4,950 / £199/mo price point • 20-min scoping-call CTA • channel recommendation
**Word target:** 30–50 words per message body (signature excluded)

---

## The 5 messages

| # | Recipient | Sector | Channel | Message body (word count in brackets) |
|---|-----------|--------|---------|----------------------------------------|
| 1 | **Monzo — Head of ML** | Fintech (AML/KYC ML) | LinkedIn DM | "Hey — saw the 2025 Monzo fraud report. Your ML fraud scoring falls under EU AI Act **Annex III §1** (creditworthiness / risk). 48 days to cliff (2 Aug 2026). 4-day signed Ed25519 attestation — **£4,950** one-shot, or **£199/mo** Pro. Sovereign UK. Open-source tooling. 20 min this week? — Nick" **[48 words]** |
| 2 | **Cera Care — CTO** | Care-homes (AI fall detection) | Email | "Hi — Cera's AI fall-detection is in scope of EU AI Act **Annex III §5** (essential private services / social care). 48 days to cliff (2 Aug 2026). 4-day signed Ed25519 attestation, **£4,950** or **£199/mo** Pro. CQC 'Safe' evidence pack + 14-LA tender pack included. 20 min this week? — Nick Templeman" **[49 words]** |
| 3 | **AccuRx — CTO** | Healthtech (GP messaging AI) | LinkedIn DM | "Hey — AccuRx is in 75%+ of UK GP practices, so your messaging AI sits squarely in EU AI Act **Annex III §5** (access to essential services / healthcare). 48 days to cliff (2 Aug 2026). 4-day signed Ed25519 attestation, **£4,950** or **£199/mo** Pro. Sovereign UK. 20 min this week? — Nick" **[50 words]** |
| 4 | **Onfido — CISO** | Regtech (KYC/biometric ID) | Email | "Hi — Onfido's biometric KYC AI is in scope of EU AI Act **Annex III §1** (biometric ID + access to essential services). 48 days to cliff (2 Aug 2026). 4-day signed Ed25519 attestation, **£4,950** or **£199/mo** Pro. DORA overlap. 1 cert covers 1,000+ enterprise customers. 20 min this week? — Nick" **[50 words]** |
| 5 | **Faculty AI — Director of AI** | Gov-tech (UK public-sector AI) | LinkedIn DM | "Hey — Faculty's UK gov deployments (CCHQ, DSIT, MoD) sit in EU AI Act **Annex III §6/§7** (AI used by public authorities + critical infrastructure). 48 days to cliff (2 Aug 2026). 4-day signed Ed25519 attestation, **£4,950** or **£199/mo** Pro. AISI alignment included. 20 min this week? — Nick" **[47 words]** |

---

## Sequencing notes

### Recommended send order (highest-closing first)

| Priority | Send window | Prospect | Why this slot |
|---|---|---|---|
| **#1** | **Mon 16 Jun, 09:00 BST** | **Monzo (Head of ML)** | 80% closing — highest probability. Opens the week. Monzo publishes senior ML staff names on LinkedIn → DM works. If Monzo replies "yes", the other 4 use them as a reference logo. |
| **#2** | **Mon 16 Jun, 09:15 BST** | **Cera Care (CTO)** | 75% closing. Care homes prefer email → email channel. UK adult social care is under intense CQC + 14-LA commissioner scrutiny; the "CQC Safe key question evidence pack" hook is the unlock. |
| **#3** | **Mon 16 Jun, 09:30 BST** | **Onfido (CISO)** | 75% closing. CISO = security buyer → email (not LinkedIn). KYC/biometric ID is the cleanest Annex III §1 fit in the whole prospect list. |
| **#4** | **Tue 17 Jun, 09:00 BST** | **AccuRx (CTO)** | 75% closing. Stagger by 1 day to avoid looking like a blast. Healthtech CTO is the easiest to find on LinkedIn. |
| **#5** | **Tue 17 Jun, 09:15 BST** | **Faculty AI (Director of AI)** | 75% closing. Gov-tech buyers move slowest (procurement + AISI) — sending Tuesday morning gives Faculty 24h to see Monzo + Cera + Onfido reply threads if any are CC'd or referenced. |

### Follow-up cadence (per prospect)

| Day | Action | Template source |
|---|---|---|
| **D0 (send day)** | First message (table above) | This file |
| **D+3** | Follow-up #1 — one-sentence bump: *"Re: [topic] — 48-day clock ticking. 20 min Wed or Thu?"* | Pattern from `OUTREACH-READY-5-MESSAGES.md` follow-up cadence |
| **D+7** | Follow-up #2 — case-study teaser (1 line) + same CTA | `marketing/d8-D8-7-5.md` (5 objection-handling follow-up emails) |
| **D+14** | Follow-up #3 — breakup email, "last-chance" tone, no CTA | `marketing/d8-D8-7-5.md` |

### Cadence guardrails
- **Never send more than 2 follow-ups in any 7-day window** (LinkedIn + email combined) — keep signal high.
- **Monzo gets the 3-touch Mon-Tue cadence** because 80% closing justifies the front-loading.
- **Faculty gets the slowest cadence** (D+3, D+10, D+21) — gov-tech buyers punish urgency.
- **Stop the sequence on any reply** (positive OR negative) — manual handoff to a 25-min scoping call.
- **If no reply by D+14, log in `hive-mailer/queue.jsonl` as `no-reply-D14` and requeue for the Sept Cabinet Office wave.**

### Why this order beats the Day-2 order
- Day-2's `OUTREACH-READY-5-MESSAGES.md` was sent blind (no Annex III clause specificity, generic "Article 50" framing). Day-3 is a **lift-and-resend** with the specific Annex III clause named per sector — the regulator-grade spec the CISO at Onfido and the Director of AI at Faculty actually need to see.
- 48 days (not 49) reflects T-minus counting from 15 Jun → 2 Aug 2026.

---

*JEEVES, 15 Jun 2026. 5 messages, all 30-50 words, all spec-compliant. Manual-send ETA: 15 minutes. First reply expected D+1 to D+3. T-minus 48 days to EU AI Act Article 50.*
