# Case Study Templates — Ready to Fill Once Customers Land

5 templates, one per buyer profile. Each follows the same structure: problem → MEOK install → outcome → quote. Plug in real numbers when first customer agrees to be named.

---

## TEMPLATE 1: Fintech (DORA compliance lead)

### Headline
**How {Company} cut DORA Article 19 reporting prep from 14 days to 4 hours**

### Lede (2 sentences)
{Company} runs {AI-fraud-detection / credit-scoring / KYC} for {N} European customers. After DORA enforcement landed in January 2025, their compliance lead needed a programmatic way to classify and route every ICT incident — not just write up the major ones.

### The problem (3 bullets)
- DORA Article 19 requires initial notification within 4 hours of classifying an incident as "major"
- (EU) 2024/1772 defines six classification criteria but provides no tool to automate the check
- {Company}'s incident response runbook was solid — but the legal classification step was a person-bottleneck that broke the 4-hour SLA twice in Q1

### The solution
Installed `dora-compliance-mcp` into their incident response Slack workflow. Now when their on-call engineer flags an incident, the bot runs `classify_incident` with the customer-impact and economic-impact inputs, returns a "major / significant cyber threat / under threshold" verdict, and emits a signed cert. If the verdict is "major," the bot auto-drafts the 4h initial notification template.

### The outcome
- **14 days → 4 hours** average prep time for Article 19 initial notification
- **0 missed SLAs** since installation (3 months tracked)
- **Signed attestations** stored alongside each ticket — auditor-verifiable later
- **£XX/yr** saved on compliance contractor time (replace with real)

### Quote from {Company}
> "MEOK turned a 14-day legal exercise into a 4-hour engineering one. The signed cert at the end of every classification is what we needed for the audit trail."
>
> — {Name, Title}, {Company}

### Tech specifics
- Free tier evaluated for 1 week
- Upgraded to Pro (£79/mo) after first signed cert demo
- Integrated with their existing Pagerduty + Slack + Linear workflow via MCP

→ Read the technical doc: [DORA Article 19 automation](https://meok.ai/docs/dora-article-19)

---

## TEMPLATE 2: MedTech (FDA AI/ML SaMD)

### Headline
**{Company} accelerated FDA 510(k) submission by 6 weeks using MEOK's SaMD classification**

### The problem
{Company} ships an AI/ML diagnostic for {clinical application}. Their FDA reg team was preparing the 510(k) submission and needed to classify which model changes would fall under the Predetermined Change Control Plan (PCCP) vs trigger a new submission.

### Why this is hard
FDA's PCCP guidance (April 2023 + 2024 updates) is clear on the framework but ambiguous on the boundary cases. {Company}'s reg team had 47 candidate model changes to classify. Doing it manually with their outside reg consultant cost £X per classification.

### The solution
Installed `fda-samd-mcp`. Their reg team used `regulatory_pathway` and `pccp_template` for the 47 changes. The MCP's classification matched their consultant's verdict on 41/47. The remaining 6 went to consultant review — but with the MEOK output as the starting brief.

### The outcome
- **47 classifications → 47 hours of work (was 47 × 8h = 376h with consultant)**
- **6-week acceleration** of 510(k) submission timeline
- **£XX,XXX consultant fees saved**
- **Signed audit trail** for each classification decision

### Quote
> "We used MEOK as the first-pass classifier. The signed certs gave our internal QMS a clean audit trail. Our consultant became the reviewer instead of the executor."
>
> — {Name, Title}, {Company}

---

## TEMPLATE 3: Care home group (CQC + bias + accessibility)

### Headline
**{Group} brought 8 care homes' AI tooling under one CQC-ready governance pack**

### The problem
{Group} operates 8 UK care homes. They use AI for {fall detection / care planning / medication tracking}. CQC's new Single Assessment Framework explicitly references "use of technology" under safe, effective, responsive, and well-led quality statements. Their managers couldn't show inspectors any AI-specific governance.

### The solution
Installed `bias-detection-mcp` + `healthcare-ai-governance-mcp` + `optometry-ai-safety-mcp`. Built a single quarterly governance pack that runs bias scans across resident demographics, generates a CQC-mapped governance summary, and signs the output.

### The outcome
- **8 homes → 1 governance pack** (was 8 × manual quarterly reviews)
- **CQC mock inspection passed** on AI tooling Quality Statements
- **Resident bias scan** caught 1 actionable issue (age-related fall-detection false negative rate) within first run
- **£XXX/yr** saved on external compliance audit fees

### Quote
> "MEOK gave us the answer when CQC asked 'show me your AI governance.' We hand them a signed quarterly cert. They verify the URL. Conversation done."
>
> — {Name, Title}, {Group}

---

## TEMPLATE 4: UK haulage operator (Operator Licence + tachograph)

### Headline
**{Operator} caught 3 tachograph violations a week before a DVSA roadside check using MEOK**

### The problem
{Operator} runs {N} vehicles across {region}. Their AI dispatch system optimises routes — but their compliance team had no automated tachograph + drivers' hours audit. DVSA roadside enforcement increased 23% in 2025; one negative compliance verdict can suspend their Operator Licence.

### The solution
Installed `haulage-uk-compliance-mcp`. Now their dispatch system runs `calculate_drivers_hours` and `tachograph_audit` daily across all active drivers. Any violation triggers a Slack alert + a signed compliance cert.

### The outcome
- **3 violations caught** in the first week of operation
- **2 of 3** would have triggered DVSA verdict under their next inspection (which happened 6 days later)
- **0 violations** in the inspection itself
- **Operator Licence preserved** = continuity of {Operator}'s £XXm/yr business

### Quote
> "The signed certs are the kicker. We hand the DVSA inspector the cert chain. They verify externally. Inspection is 20 minutes instead of 2 hours."
>
> — {Name, Title}, {Operator}

---

## TEMPLATE 5: EdTech (COPPA + EU AI Act minors)

### Headline
**{Platform} clarified COPPA + EU AI Act Article 5(1)(b) overlap in one afternoon**

### The problem
{Platform} serves {N} children under 13. Their COPPA verifiable-parental-consent flow was rock-solid. But the EU AI Act Article 5(1)(b) prohibits "exploiting vulnerabilities … of a specific group of persons due to their age" — which is broader than COPPA. Their EU launch was blocked because legal couldn't determine if their personalization engine tripped Article 5.

### The solution
Installed `coppa-ferpa-mcp` and ran `eu_ai_act_minors` + `aadc_uk_check` + `check_under_13_processing` across their personalization workflows. Identified one specific feature (dynamic difficulty adjustment based on engagement) as a Article 5(1)(b) risk.

### The outcome
- **EU launch unblocked** within 1 afternoon of installation
- **1 feature redesigned** (engagement-based difficulty replaced with skill-based, removing the "vulnerability exploitation" framing)
- **Compliance documented** with signed certs at every classification step
- **£XX,XXX legal fees saved** on what would have been a 3-week external review

### Quote
> "MEOK didn't replace our legal review — it gave legal a working draft to react to. Saved us 2 weeks and gave us audit-defensible cert chain."
>
> — {Name, Title}, {Platform}

---

## How to use these

When a real customer lands and agrees to be named:
1. Replace `{placeholders}` with actual numbers + names
2. Get permission for the quote (legal review on customer side ~3-5 days)
3. Add real screenshots (anonymized as needed)
4. Publish to `meok.ai/case-studies/{customer-slug}`
5. Cross-link from the relevant MCP's README
6. Add to next newsletter issue

## Anonymized version

If a customer wants to share results but not be named, use this framing:

> "A UK fintech with 50 employees" / "A US-based MedTech series-B with FDA submissions in pipeline"

Don't fabricate. Numbers must match the real outcome. Anonymized social proof beats named-but-vague.

---

*MEOK AI Labs · hello@meok.ai · Updated 2026-05-13*
