# Response Handler — Decision Tree

**Created:** 2026-09-13
**Purpose:** Route every outreach response to the correct action within 1 hour of receipt.

---

## Decision Tree

```
Response received
│
├─ Is it a bounce / delivery failure?
│  ├─ YES → Mark BOUNCED in OUTREACH-TRACKER.md
│  │        → Retry once with corrected address (Template 3)
│  │        → If no valid address found → Mark CLOSED
│  └─ NO ↓
│
├─ Is it an auto-reply / out-of-office?
│  ├─ YES → Log in OUTREACH-LOG, note return date
│  │        → Reset FU clock to their return date + 3 biz days
│  │        → Do NOT count as a response for cadence purposes
│  └─ NO ↓
│
├─ Does it express INTEREST (wants to learn more, pilot, buy, schedule a call)?
│  ├─ YES → Mark INTERESTED in OUTREACH-TRACKER.md
│  │        ├─ Wants more info / data? → Send Template 4 (API endpoints + verification URLs)
│  │        ├─ Wants to pilot / buy / discuss pricing? → Send Template 5, route to Nick IMMEDIATELY
│  │        ├─ Wants a meeting / call? → Route to Nick IMMEDIATELY (do not book autonomously)
│  │        └─ Log full reply text in OUTREACH-LOG
│  └─ NO ↓
│
├─ Does it express NOT INTERESTED (decline, no fit, unsubscribe)?
│  ├─ YES → Mark NOT_INTERESTED in OUTREACH-TRACKER.md
│  │        → Send Template 6 (polite close)
│  │        → Log in OUTREACH-LOG
│  └─ NO ↓
│
├─ Is it a neutral acknowledgement (e.g. "thanks, we'll take a look")?
│  ├─ YES → Mark REPLIED in OUTREACH-TRACKER.md
│  │        → Do NOT send follow-up (they acknowledged)
│  │        → Log in OUTREACH-LOG
│  │        → Re-check in 7 days; if no further action → mark CLOSED
│  └─ NO ↓
│
└─ Is it a question / request for specific data?
   ├─ YES → Mark REPLIED in OUTREACH-TRACKER.md
   │        → If the answer is in public endpoints → Send Template 4 (add specific URLs)
   │        → If it requires Nick's input → Route to Nick with context
   │        → Log full reply text in OUTREACH-LOG
   └─ Unclear? → Route to Nick with the full message text
```

---

## Routing Rules

### To Nick (IMMEDIATELY — within 1 hour)

All of these require owner action. Forward the **full original message** plus your context:

1. **Purchase intent:** "How much?", "Can we trial this?", "What's the pricing?"
2. **Meeting request:** "Can we schedule a call?", "Let's set up a meeting"
3. **Partnership inquiry:** "Would you be interested in partnering?", "Integration discussion"
4. **Technical deep-dive request:** "Can you walk us through the methodology?", "How does signing work?"
5. **Media/press inquiry:** "We're writing about...", "Can we feature..."
6. **Regulatory/government interest:** FCA, NIST, BSI, or any government body responding positively

**Forward format to Nick:**
```
Subject: [OUTREACH] [Org] — [REPLY TYPE: interested/meeting/purchase/partnership]

[Full original message quoted]

Contact: CON-xxx | Channel: email/GitHub | Sent: 2026-09-xx
Original evidence hook: [what we sent them]
My assessment: [your read of intent]
Suggested next step: [your recommendation]
```

### Autonomous Actions (no Nick needed)

1. **Bounce handling:** Retry once with corrected email, then close.
2. **Not-interested acknowledgement:** Send Template 6, mark CLOSED.
3. **Neutral acknowledgement:** Mark REPLIED, pause cadence, check back in 7 days.
4. **Information request (public data):** Send Template 4 with specific endpoints.

---

## Response Logging

Every response gets logged in `OUTREACH-LOG-2026-09-12.md` with:

```markdown
### [CON-xxx] [Org] — Response [date]

**Type:** BOUNCE | REPLIED | INTERESTED | NOT_INTERESTED | AUTO_REPLY
**Channel:** email | GitHub | HF
**Full text:** [exact quote, not paraphrased]
**Action taken:** [what was done]
**Routed to Nick:** YES | NO
```

---

## Time Targets

| Response type | Action deadline |
|---------------|----------------|
| Purchase / meeting request | Forward to Nick within **1 hour** |
| Information request | Reply within **4 hours** (business hours) |
| Bounce | Retry within **24 hours** |
| Not interested | Acknowledge within **24 hours** |
| Neutral / unclear | Log within **1 hour**, decide within **24 hours** |

---

## GitHub-Specific Handling (DefiLlama #913)

- **Reply on issue:** Respond as a comment. Keep to 2-3 sentences. Link to specific evidence.
- **Issue closed (merged/fixed):** Mark REPLIED, log, celebrate internally.
- **Issue closed (wontfix):** Mark NOT_INTERESTED, log, close gracefully.
- **Maintainer asks for more detail:** Provide specific API endpoints + verification links.
- **Never @ mention more than once per follow-up cadence.**

---

## What We Never Do

1. **Never reply to a decline** more than once (Template 6, then done).
2. **Never negotiate pricing** — always route to Nick.
3. **Never share internal details** (SOV3, OLM brain, compute topology, etc.).
4. **Never promise capabilities** we don't have today.
5. **Never send follow-up to INTERESTED** — they responded; we wait for them or Nick acts.
6. **Never cc multiple contacts** at the same org.
