# Cold Email Templates v2
## Industry-personalized for fintech, medtech, edtech, retail, energy

Use these for Smartlead / Apollo / Lemlist outreach. Each has a subject line + 3-sentence body + soft CTA. Keep email-only — no attachments. Plain text wins over HTML for B2B compliance.

---

## TEMPLATE 1: FINTECH (DORA/NIS2/MiFID II buyer)

### Subject A (curiosity)
`{Company}: DORA reporting clocks — quick question`

### Subject B (specific)
`{First name}, are your AI-screening models DORA Art 17-19 ready?`

### Subject C (deadline-driven)
`DORA enforcement is live. {Company}'s AI models?`

### Body

```
Hi {First name},

Quick one — {Company} runs AI for {credit scoring/fraud detection/transaction monitoring}, right?

DORA enforcement landed in January 2025 with 4h initial / 72h intermediate / 1 month final reporting clocks. Most fintechs I've talked to have the policies on paper but no programmatic way to classify whether an ICT incident *is* "major" under (EU) 2024/1772 thresholds.

MEOK ships an MCP that does this in seconds — and emits a signed attestation your competent authority can verify independently. Free tier is 10 calls/day. Worth 4 minutes to test?

→ pip install dora-compliance-mcp

If yes, I'll send a 30-second screencast showing the {Company}-relevant flow. If no, no follow-ups.

— Nick
Founder, MEOK AI Labs
hello@meok.ai
```

---

## TEMPLATE 2: MEDTECH (FDA SaMD + MDR buyer)

### Subject A
`{Company}: FDA AI/ML PCCP review — 3-min thing`

### Subject B
`{First name}, IVDR Annex VIII Class C threshold question`

### Body

```
Hi {First name},

Saw {Company} ships {AI-based diagnostic tool/decision support/imaging}. Curious — how are you handling FDA's Predetermined Change Control Plan (PCCP) for the AI/ML SaMD portion?

I'm hearing the same thing from 4 MedTech CTOs this month: the PCCP template guidance from FDA is clear, but the actual classification (which changes need a new 510(k) vs which fall under the PCCP) is fuzzy on the boundary.

MEOK ships an FDA AI/ML SaMD MCP that runs the classification + drafts the PCCP template + signs it for your QMS audit trail. Free tier: 10 classifications/day.

→ pip install fda-samd-mcp

Want me to do one classification for {Company}'s top product as a free reference? Reply with the device name and I'll send back the analysis.

— Nick
MEOK AI Labs
```

---

## TEMPLATE 3: EDTECH (COPPA + FERPA + EU AI Act minors)

### Subject A
`{Company}: COPPA + EU AI Act minors — combined question`

### Subject B
`{First name}, your COPPA flow vs the new EU AI Act minor protections`

### Body

```
Hi {First name},

{Company} processes data for users under 13, right? Quick read — how's your COPPA verifiable-parental-consent flow currently handled, and have you mapped it against EU AI Act Article 5(1)(b)?

Article 5(1)(b) prohibits "exploiting vulnerabilities … of a specific group of persons due to their age" — which is broader than COPPA's "knowing collection from under-13s." Several EdTech founders I've talked to are surprised to discover their COPPA-compliant flow may still trip the EU AI Act prohibition.

MEOK ships an MCP that checks both regimes + UK ICO Age Appropriate Design Code in one pass. £79/mo for unlimited + signed attestations.

→ pip install coppa-ferpa-mcp

Want a free 15-min consult on the {Company}-specific risk areas? Reply yes or no.

— Nick
MEOK AI Labs
```

---

## TEMPLATE 4: CARE HOME (CQC + accessibility + bias)

### Subject A
`{Company}: AI in resident care — CQC ready?`

### Subject B
`{First name}, quick CQC question about your AI tooling`

### Body

```
Hi {First name},

Saw {Company} operates {N} care homes across {region}. Quick one — if you're using AI for {care planning/medication tracking/fall detection}, is it CQC-mapped under the Single Assessment Framework?

The new Quality Statements explicitly reference "use of technology" under safe, effective, responsive, and well-led. Most providers I've talked to have the AI tools deployed but no documented governance — which becomes the first thing inspectors ask for.

MEOK ships an AI bias detection MCP + healthcare AI governance MCP. Together they output a CQC-ready governance pack for £79/mo Pro.

→ pip install bias-detection-mcp healthcare-ai-governance-mcp

I'm a UK optical/care-home operator myself (templeman-opticians.com). If you want a 30-min call comparing your governance state vs the SAF quality statements, let me know.

— Nick
Founder, MEOK AI Labs
hello@meok.ai
```

---

## TEMPLATE 5: UK HAULAGE / CONSTRUCTION (Operator Licence + CHAS + NRSWA)

### Subject A
`{Company}: AI dispatch — Operator Licence compliance check?`

### Subject B
`{First name}, AI in your fleet planning — DVSA-ready?`

### Body

```
Hi {First name},

If {Company} uses AI for {fleet dispatch/load planning/driver scoring}, here's a question that's coming up in DVSA roadside checks: can the AI's decisions be audited for tachograph + drivers' hours compliance?

The answer most operators have right now is "the system does it but we don't have logs we can show DVSA." That's a problem under the Operator Licence undertakings.

MEOK ships UK-specific MCPs:
- `haulage-uk-compliance-mcp` — Operator Licence + tachograph + drivers' hours
- `chas-elite-prep-mcp` — CHAS Elite + SafeContractor + Constructionline pre-qual
- `nrswa-ai-mcp` — street works Section 50/58/74

→ npx meok-setup --pack trade

£79/mo Pro tier — unlimited calls + signed compliance attestations DVSA accepts as evidence. Want a 15-min call?

— Nick
MEOK AI Labs (UK)
```

---

## SENDING RULES

1. **No more than 50/day per inbox.** Smartlead / Apollo handles warmup; respect it.
2. **3-touch sequence max.** Day 0 = first email, day 4 = bump ("any thoughts?"), day 10 = breakup ("closing the loop"). Then stop.
3. **Personalize line 1.** Use Apollo's company data — recent funding round, hire announcement, product launch. Generic "I saw your company" loses 90% of replies.
4. **Don't pitch features. Pitch outcomes.** Every body opens with their pain. The product is the bridge, not the headline.
5. **One link, one CTA.** No "click here / and here / and check out our blog." One ask per email.
6. **Reply path matters.** "Reply yes or no" beats "book a meeting" 3:1 in cold outreach.

## TRACKING

Use Smartlead's auto-tag: `INTERESTED` / `NOT_NOW` / `WRONG_PERSON` / `UNSUBSCRIBE`. Move INTERESTED to a Calendly link, NOT_NOW to a 90-day follow-up queue, the rest to suppression.

Expected reply rate (industry benchmark for cold compliance/B2B):
- 1-3% positive reply
- 5-8% any reply (incl. forwards + not-me)
- 50 emails sent → 0.5-1.5 qualified leads
- 200 emails sent → 2-6 qualified leads
- 1000 emails sent → 10-30 qualified leads

At MEOK's Pro tier (£79/mo, ~£948 ARR per customer), 1-2 closes from a 1000-email campaign = positive ROI. Hit 5+ closes and the model compounds.
