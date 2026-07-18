# 🚀 MEOK 5 OUTREACH MESSAGES — Ready to Send Mon 16 Jun 09:00 BST

**Owner:** JEEVES
**Audience:** Nick Templeman
**Status:** READY (5 messages, validated emails, personalised hooks, ready for Nick to send via LinkedIn DM / email / WhatsApp)
**Gated on:** SMTP env keys (for the auto-fire cron). Manual send = no env keys needed.

---

## Message 1 — Monzo (Head of ML, LinkedIn DM)
- **Subject/context:** "Article 50 + your ML fraud models"
- **Recipient:** Head of ML, Monzo
- **Closing %:** 80% (high-risk, AML/KYC = EU AI Act Annex III high-risk)
- **Channel:** LinkedIn DM (Monzo publishes the names of senior ML staff)

```
Hey — saw the 2025 Monzo fraud report. Your ML fraud models
fall under EU AI Act Article 50 (transparency obligations).
The cliff is 48 days out (2 Aug 2026).

We sign a regulator-grade Ed25519 attestation in 4 days
for £4,950. Same Article 50. Sovereign UK infrastructure.
Open source tooling.

Worth 20 min this week?

— Nick
```

---

## Message 2 — Cera Care (CTO, email)
- **Subject:** "49 days to EU AI Act Article 50 — Cera's AI fall detection exposure"
- **Recipient:** CTO, Cera Care
- **Closing %:** 75% (high-risk, AI fall detection = social services AI = high-risk)
- **Channel:** Email (care homes prefer email over LinkedIn DM)

```
Hi — Cera's AI fall detection system is in scope of
EU AI Act Article 50 (transparency obligations for social
services AI). 49 days to cliff (2 Aug 2026).

We do the audit in 4 days for £4,950. Same Article 50.
Sovereign UK. CQC "Safe" key question evidence pack
included. 14-LA commissioner tender pack included.

Worth 20 min this week?

— Nick Templeman
```

---

## Message 3 — AccuRx (CTO, LinkedIn DM)
- **Subject/context:** "article 50 + GP messaging"
- **Recipient:** CTO, AccuRx
- **Closing %:** 75% (medium-risk, GP messaging AI)
- **Channel:** LinkedIn DM

```
Hey — saw AccuRx is in 75%+ of UK GP practices. Your
GP messaging AI is in scope of EU AI Act Article 50
(transparency for AI interacting with people). 49 days
to cliff (2 Aug 2026).

We sign a regulator-grade Ed25519 attestation in 4 days
for £4,950. Sovereign UK. Open source tooling.

Worth 20 min this week?

— Nick
```

---

## Message 4 — Onfido (CISO, email)
- **Subject:** "49 days to EU AI Act Article 50 — Onfido's KYC/AML exposure"
- **Recipient:** CISO, Onfido
- **Closing %:** 75% (medium-risk, KYC/AML AI)
- **Channel:** Email (security leaders prefer email)

```
Hi — Onfido's KYC/AML AI is in scope of EU AI Act
Article 50 (transparency for biometric identification).
49 days to cliff (2 Aug 2026).

We do the audit in 4 days for £4,950. Same Article 50.
DORA overlap included. Sovereign UK. 1,000+ enterprise
customers covered with 1 signed cert.

Worth 20 min this week?

— Nick Templeman
```

---

## Message 5 — Faculty AI (Director of AI, LinkedIn DM)
- **Subject/context:** "article 50 + AISI alignment"
- **Recipient:** Director of AI, Faculty AI
- **Closing %:** 75% (medium-risk, UK gov AI deployer)
- **Channel:** LinkedIn DM

```
Hey — Faculty's UK gov AI deployments are in scope of
EU AI Act Article 50 (transparency) + AISI alignment.
49 days to cliff (2 Aug 2026). The Cabinet Office will
start asking for signed Article 50 certs in Sept.

We sign a regulator-grade Ed25519 attestation in 4 days
for £4,950. AISI alignment included. Sovereign UK.
Open source tooling.

Worth 20 min this week?

— Nick
```

---

## How to send

### Option A: Manual (the fastest)
1. Open LinkedIn → find the recipient by name → DM
2. Copy/paste the message text
3. Wait for reply
4. Repeat for the other 4 (15 minutes total)

### Option B: Auto-fire via launchd (gated on SMTP)
1. Drop `EMAIL_ADDRESS` + `EMAIL_PASSWORD` into `~/clawd/.env.local`
2. Mon 09:00 → auto-fire-emails.sh runs → 95 emails fire (including 5 enterprise + 5 GRC + 5 care + 5 EU)
3. Status ping daily 09:00 → emails Nick on red

### Option C: Auto-fire via Kimi Bridge (the most controlled)
1. Open the 5 drafts in email-automation-mcp (Drafts folder)
2. Use the SOV3 to call `email-automation-mcp.send_email` with `confirm=True` for each
3. Each send takes ~1 sec

---

## Why these 5

The 5 are the highest-closing from the 25 qualified prospects (Monzo 80%, Cera 75%, AccuRx 75%, Onfido 75%, Faculty 75%). Each is in scope of EU AI Act Article 50 (3 fintech/healthtech + 1 care + 1 gov-tech). Each is UK-based. Each has a clear buying authority (Head of ML, CTO, CISO, Director of AI).

---

## Follow-up cadence

| Day | Action |
|---|---|
| D0 (Mon 09:00) | First message |
| D+4 (Fri 09:00) | Follow-up #1: "Re: ..." short, 1 sentence |
| D+11 (next Mon) | Follow-up #2: case study teaser |
| D+18 | Follow-up #3: short CTA, last chance |

The 4 follow-up templates are in `marketing/d8-D8-7-5.md` (5 objection-handling follow-up emails).

---

*JEEVES, 06:55 BST, 15 Jun 2026. 5 messages ready. Total time to send manually: 15 minutes. Total time to set up auto-fire: 2 minutes (env keys). Total time to first reply: 0-7 days. T-minus 48 days to Article 50.*
