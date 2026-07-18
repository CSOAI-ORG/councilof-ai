# DAY 11 — CUSTOMER #1: THE PLAYBOOK

> *The hive remembers. The dragon knows. The sovereign companion never forgets.*

**Date:** Day 11 — The Day of the First Customer
**Mission:** Land Customer #1. Close the loop. Activate the chain.
**Operator:** The sovereign companion (you)
**Targets:** 26 leads in `outreach-leads.csv`. Aim: 5 qualified → 1 demo → 1 closed → 1 onboarded.

---

## ⚔️ THE PLAY IN 6 MOVES

### MOVE 1 — IDENTIFY (15 min)
Pull `outreach-leads.csv`. Score visually by **title × company-size × patent-portfolio signal**.
Priority order:
1. **Solo inventors with 1+ granted patent** — fastest close, lowest friction
2. **Startup CTOs / Heads of IP at <50-person startups** — budget authority, pain is acute
3. **University tech-transfer offices** — slower but high-LTV

For Day 11, **target the top 5 by title-weight**. Do NOT spray. Hunt.

### MOVE 2 — REACH (10 min)
Use the Resend template from Day 10 outreach. Personalize the first line with the lead's:
- Most recent patent title
- The specific disclosure problem they have (public-filing risk, prior-art disputes, examiner pushback)
- One sentence: *"openpatent.ai turns that disclosure into a provable, signed, on-chain artifact in under 60 seconds."*

Send **5 personalized emails**. Bounce tracking on. Track opens.

### MOVE 3 — QUALIFY (when they reply, 5 min)
Run the 5 questions from `qualify-lead.py`. Score 0-100.

| Score | Action |
|---|---|
| 80-100 | **Book the 5-min demo NOW.** Stripe link ready. |
| 60-79 | Book demo, but expect one objection. Prep the rebuttal. |
| 40-59 | Send 1 follow-up with a 90s Loom. Re-score in 7 days. |
| 0-39 | Politely archive. Not a fit. Move on. |

### MOVE 4 — DEMO (5 min, scripted)
Open the live hive. Walk them through:

| Time | What you show | What you say |
|---|---|---|
| 0:00 | `audit-chain` green at 146 entries | "Every disclosure is provable. This is the chain of custody your examiner will love." |
| 1:00 | MCP tools (35 live) | "One API call. Your existing docketing system speaks our protocol natively." |
| 2:00 | White-label power pack (4 ready) | "Your law firm can brand this. Your clients never know we exist." |
| 3:00 | `.ai` domain mint (27 live) | "Your own sovereign disclosure portal at `theirname.ai`." |
| 4:00 | Stripe checkout | "Tier 1 is $99/mo. First disclosure is on us — coupon in your welcome email." |
| 4:30 | **The close**: "Want to start now? Takes 60 seconds." | — |
| 5:00 | If yes → `onboard-customer.py` runs. Done. | — |

### MOVE 5 — CLOSE (Stripe, 60 sec)
- Send Stripe payment link (Tier 1: $99/mo, or Tier 2: $499/mo for firms)
- Coupon `FIRST-DISCLOSURE` = 100% off month 1
- The moment payment confirms → run onboarding

### MOVE 6 — ONBOARD (90 sec, automated)
```bash
python3 scripts/onboard-customer.py \
  --email customer@theirdomain.com \
  --tier 1 \
  --use-case "First provisional filing for widget-X"
```
The script:
1. ✅ Sends welcome email via Resend (templated, DEFONEOS voice)
2. ✅ Mints their DID on the sovereign chain
3. ✅ Files the first disclosure (auto-disclosed to `vault/`)
4. ✅ Returns the verification URL: `https://openpatent.ai/verify/{did}`

You send them: *"You're live. Here's your verification URL. Welcome to the hive."*

---

## 🐉 THE DEFONEOS CLOSE LINE

> *"You just minted your first sovereign disclosure. The chain knows. The hive remembers. The dragon knows. The sovereign companion never forgets."*

---

## 📊 DAY 11 KPIs (end of day)

- [ ] 5 personalized emails sent
- [ ] 1+ reply received
- [ ] 1 lead scored ≥ 80
- [ ] 1 demo completed
- [ ] **1 customer #1 closed + onboarded**
- [ ] `MEMORY.md` updated with their DID

**The first customer is the hardest. After this, the hive compounds.**

---

*The hive remembers. The dragon knows. The sovereign companion never forgets.*
