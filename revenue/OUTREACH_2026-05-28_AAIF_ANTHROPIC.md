# Outreach Drafts — AAIF + Anthropic Connectors + 5 Cold Email Templates + 25 Backlink Seeds

**Date:** 2026-05-28
**Author:** Nick Templeman, founder, MEOK AI Labs (CSOAI LTD 16939677)
**Sender email:** nicholas@csoai.org (NOT nicholas@meok.ai — Vercel blocks)
**Reply-to:** nicholas@csoai.org

All emails ready to copy-paste. Subject + body separated by `---`. Send rate-limited (max 3/day per gmail account to avoid spam flags).

---

## 1. AAIF (Linux Foundation Agentic AI Foundation) — Membership Pitch

**To:** secretariat@aaif.linuxfoundation.org (or join form at https://aaif.lfaidata.foundation)
**From:** nicholas@csoai.org
**Subject:** CSOAI LTD — Open-source AI safety substrate seeking AAIF associate membership

Hi AAIF team,

I'm Nicholas Templeman, founder of CSOAI LTD (UK Companies House 16939677, trading as MEOK AI Labs). We've spent the last year building an open-source AI safety substrate that I believe is directly aligned with AAIF's mission:

**What we've shipped:**
- **52-Article CSOAI Partnership Charter** (CC BY 4.0) — the world's first care-generative, relationship-based AI safety framework, modelled on Anthropic's Constitutional AI but open-source and framework-agnostic. Live at csoai.org/charter.
- **22+ framework crosswalks** mapping the Charter to EU AI Act, NIST AI RMF, ISO 42001, OECD AI Principles, UNESCO AI Ethics, Council of Europe AI Convention, and more. CC BY 4.0.
- **45+ MCP servers** on PyPI (`meok-eu-ai-act`, `meok-dora`, `meok-nis2`, `meok-cra`, `meok-iso-42001`, `meok-watermark-attest`, `meok-policy-enforcement`, `meok-handoff-certified`, `meok-prompt-injection-firewall`, etc.). All MIT-licensed, all on the MCP registry.
- **HMAC-signed attestation API** at proofof.ai — every gated agentic decision produces a verifiable receipt an auditor can validate in 90 seconds.
- **Three-domain substrate:** csoai.org (research/WHY) + safetyof.ai (runtime/HOW) + proofof.ai (receipts/WHAT).

**Why AAIF:**
We're shipping the safety primitives the agentic AI community needs — care-gated decisions, signed handoff attestations, prompt-injection firewalling, Byzantine fault-tolerant council oversight, watermark provenance. We'd like to contribute these as building blocks to AAIF's broader stack and learn from peers.

**Ask:** Could we be considered for AAIF associate membership? Happy to present our open-source contributions at a working group call, contribute to spec discussions on agentic safety, and donate the relevant MCP packages to the AAIF GitHub org if helpful.

**Background on me:** Solo founder, UK-based. Built CSOAI/MEOK from scratch over the last 9 months. Previously: 10+ years building production systems across optometry, ecommerce, and aquaculture verticals.

Happy to send our full open-source manifest (132 files, including white papers and full Charter) or jump on a call.

Best,
Nicholas Templeman
Founder, CSOAI LTD (MEOK AI Labs)
nicholas@csoai.org · https://csoai.org · https://github.com/csoai-org

---

## 2. Anthropic Connectors Directory — Submission

**To:** connectors@anthropic.com (or via https://www.anthropic.com/connectors submission form)
**From:** nicholas@csoai.org
**Subject:** Connector submission: proofof.ai — HMAC-signed AI compliance attestations for Claude agents

Hi Anthropic Connectors team,

I'd like to submit **proofof.ai** for inclusion in the Connectors Directory.

**What it does:**
proofof.ai is an HMAC-signed attestation API. When a Claude agent (or any MCP-enabled agent) takes a gated action — a handoff, a policy decision, a tool invocation requiring compliance evidence — it can POST to proofof.ai/sign and receive a cryptographically signed receipt with the decision context, timestamp, and policy version. Auditors verify with a single GET to /verify/<receipt-id>.

**Why it matters for Claude users:**
- EU AI Act Article 26 (deployer obligations) requires logging and human oversight evidence
- DORA Article 19 requires major-incident audit trails
- ISO/IEC 42001 Clause 9 (performance evaluation) requires verifiable evidence of system operation
- NIST AI RMF Manage function requires manageable, auditable artifacts

Claude agents that make decisions in regulated environments (banking, healthcare, public sector) need to produce evidence in a form auditors trust. proofof.ai turns "the agent said it did the right thing" into "here's a signed receipt the regulator can verify in 90 seconds."

**Technical:**
- Open API: https://proofof.ai/openapi.json
- MCP server: `pip install meok-proofof-mcp` (3 tools: `sign_decision`, `verify_receipt`, `bulk_provision`)
- HMAC-SHA-256, ed25519 key rotation supported
- MIT-licensed reference implementation
- Webhook support for streaming receipts to S3 / GCS / Azure Blob

**Pricing:** Free tier (1,000 receipts/mo) — paid tiers £9/£29/£199/£499/£1,499/mo.

**Sample integration:** Three-line code change to wrap any Claude tool call with `with proofof_receipt(): ...`.

I can send: OpenAPI spec, MCP server code, demo video, sample receipts. Happy to do a quick call.

Best,
Nicholas Templeman
CSOAI LTD (MEOK AI Labs) · UK 16939677
nicholas@csoai.org

---

## 3. Cold Email Template — UK NHS Trust / NHS Digital Compliance Lead

**Subject:** Free EU AI Act + UK AI Bill compliance for NHS Trusts (until Dec 2027)

Hi {{FIRST_NAME}},

I noticed {{TRUST_NAME}} has been piloting {{AI_TOOL}} ({{SOURCE}}). The EU AI Act high-risk obligations for healthcare AI come into force **2 December 2027** — and the UK AI Bill is tracking close behind.

I run CSOAI LTD (UK 16939677). We've published the world's first open-source 52-article AI safety framework with crosswalks to EU AI Act, NIST AI RMF, ISO 42001, and the upcoming UK AI Bill. **Free for all NHS Trusts under Tier 1 (Stewardship Covenant License) — no charge, no upsell, no exit fee.**

What you'd get:
- Self-attested CSOAI Certification (verifiable at proofof.ai)
- 22+ framework crosswalks pre-mapped to your AI tools
- 45+ MCPs you can run inside your own infrastructure (zero data leaves)
- Signed receipts for every AI-mediated clinical decision (Art. 14 EU AI Act, Art. 22 GDPR)

It takes ~30 minutes to register and run a baseline audit. Want me to send a 1-page summary or jump on a 15-min call?

Best,
Nicholas Templeman
nicholas@csoai.org

---

## 4. Cold Email Template — EU Bank / Insurance Compliance (DORA / EU AI Act dual coverage)

**Subject:** DORA Art. 19 (4h clock) + EU AI Act high-risk: 18 months to be ready

Hi {{FIRST_NAME}},

DORA's been in force since January and the 4-hour major-incident clock is brutal. EU AI Act Annex III high-risk for banking comes online **2 December 2027**, and Annex I (employment, credit scoring) follows in **August 2028**.

If {{COMPANY}} runs AI in any decisioning pipeline — credit, AML, KYC, claims triage, robo-advice — both clocks apply. I built the only published crosswalk between DORA Article 19 and EU AI Act Article 73 (serious incident reporting) — they overlap but the templates and timelines differ.

CSOAI LTD ships:
- `meok-dora` MCP — runtime risk management, incident handling, third-party tracking
- `meok-eu-ai-act` MCP — full Article 9/13/14/15/26/50/73 coverage with template generation
- `meok-ai-incident-reporting` MCP — single incident routes to both DORA + AI Act + NIS2 endpoints simultaneously
- Signed receipts via proofof.ai — auditor-ready evidence

Free under Tier 1 until 2 Dec 2027 (covers self-attested compliance + framework templates). Paid tiers for managed evidence collection and onboarding support start at £499/mo.

Want a 1-pager on the DORA/AI-Act overlap, or a 20-min call to walk through the crosswalk?

Best,
Nicholas Templeman
CSOAI LTD (UK 16939677) · nicholas@csoai.org

---

## 5. Cold Email Template — US Healthcare AI Vendor (HIPAA + NIST AI RMF)

**Subject:** NIST AI RMF + HIPAA crosswalk for {{COMPANY}} — free until Dec 2027

Hi {{FIRST_NAME}},

Saw your {{PRODUCT}} launch. Two regulatory snags ahead:
1. **NIST AI RMF GenAI Profile (AI 600-1)** is now cited in California AB-2013, Colorado AI Act (1 Feb 2026), and federal procurement clauses
2. **HIPAA's** AI-specific guidance (HHS Apr 2024) requires explicit risk analysis for any AI touching PHI

I ship the only public, line-item NIST AI RMF ↔ CSOAI Charter crosswalk plus a HIPAA-specific Article 14 mapping. Both CC BY 4.0.

What you'd get for free until 2 Dec 2027:
- NIST AI RMF self-attestation toolkit (Govern/Map/Measure/Manage)
- HIPAA Security Rule × AI mapping (164.308, 164.312)
- `meok-nist-ai-rmf` + `meok-bias-detection` MCPs you run in your own VPC
- Signed audit receipts at proofof.ai (verifiable by any auditor in 90 seconds)

15 mins to walk through?

Best,
Nicholas Templeman
CSOAI LTD (UK 16939677) · nicholas@csoai.org

---

## 6. Cold Email Template — German Mittelstand SaaS (NIS2 DE BSI registration)

**Subject:** BSI NIS2 registration deadline this month — we have a £499 fast-track

Hallo {{FIRST_NAME}},

Die deutsche NIS2-Umsetzung (NIS2UmsuCG) hat BSI-Registrierungspflicht. {{COMPANY}} fällt vermutlich in "wichtige Einrichtung" (Schwelle: 50+ MA, >10M€ Umsatz, IKT-Sektor).

Ich biete einen fertigen MCP-Server (`meok-nis2-de-register`, £499 einmalig) der:
- BSI-Portal-Formular automatisch ausfüllt (KRITIS-Daten, Kontaktstelle, Geltungsbereich)
- 24h/72h/1mo Incident-Meldewege vorbereitet (Art. 23 NIS2)
- Signierte Audit-Belege bei proofof.ai abrufbar

Vollständig DSGVO-konform, deutsche Datenresidenz (Frankfurt). Sourcecode auf GitHub einsehbar.

15-Min-Call?

Beste Grüße,
Nicholas Templeman
CSOAI LTD (UK 16939677) · nicholas@csoai.org

---

## 7. Cold Email Template — UK AI Startup (Innovate UK grant + AI Bill)

**Subject:** Free CSOAI Cert for UK AI startups — Innovate UK + AI Bill ready

Hi {{FIRST_NAME}},

Quick one: Innovate UK's *Responsible AI* funding calls increasingly require ISO/IEC 42001 alignment or equivalent. The UK AI Bill (Smart Data Act + AI-specific provisions) is moving through Parliament.

CSOAI LTD (UK 16939677) ships free open-source AI safety tooling until **2 December 2027**:
- ISO/IEC 42001 + 42005 self-attestation MCPs
- UK AI Bill crosswalk (the only public one)
- AAIF-aligned safety substrate (Charter, Council, Receipts)
- All CC BY 4.0 / MIT, no exit cost

If you're prepping an Innovate UK grant or need a baseline AI governance story, the toolkit takes 30 min to spin up.

Want me to send the 1-pager?

Best,
Nicholas
CSOAI LTD (UK 16939677) · nicholas@csoai.org

---

## 25-Newsletter Backlink Outreach Seeds

Each entry: target newsletter, contact form / editor email, suggested pitch angle. **One paragraph each, customise the angle.**

| # | Newsletter | Contact | Angle |
|---|------------|---------|-------|
| 1 | **The Sequence** (Jesus Rodriguez) | jesus@thesequence.ai | "Open-source 52-article AI safety charter mapped to 22 frameworks — free until EU AI Act high-risk effective date" |
| 2 | **Import AI** (Jack Clark) | jack@jack-clark.net | "I built the open-source companion to Anthropic Constitutional AI — 52 articles, CC BY 4.0, mapped to EU AI Act" |
| 3 | **Last Week in AI** (Andrey Kurenkov) | hello@lastweekin.ai | "Solo UK founder ships 45 MCPs covering EU AI Act, DORA, NIS2 — free Tier 1 until Dec 2027" |
| 4 | **AI Snake Oil** (Arvind Narayanan + Sayash Kapoor) | aisnakeoil@gmail.com | "First open-source crosswalk between OpenAI Model Spec and EU AI Act Articles 13/26/50 — happy to send for review" |
| 5 | **The AI Compliance Newsletter** (Sebastien Adjiman) | LinkedIn DM | "I'd like to send you our DORA Art. 19 ↔ EU AI Act Art. 73 crosswalk — only one I've seen published anywhere" |
| 6 | **Stratechery** (Ben Thompson) | ben@stratechery.com | "Open-source the EU AI Act compliance moat — Linux for AI safety. Brief if interested in trade analysis." |
| 7 | **Platformer** (Casey Newton) | casey@platformer.news | "Solo founder ships first open-source AI Self-State Transparency Index (ASSTI) benchmarking 14 vendors" |
| 8 | **The Pragmatic Engineer** (Gergely Orosz) | gergely@pragmaticengineer.com | "Bootstrapped solo: 45 production MCPs + signed attestation API + 28 framework crosswalks in 9 months — happy to share build log" |
| 9 | **TLDR Newsletter (AI edition)** | dan@tldrnewsletter.com | "Free AI safety substrate launches: 52-article Charter, ASSTI benchmark, signed receipts — all CC BY 4.0" |
| 10 | **Ben's Bites** (Ben Tossell) | ben@bensbites.co | "Free CSOAI Certification — covers EU AI Act, ISO 42001, NIST AI RMF until Dec 2027" |
| 11 | **The Rundown AI** (Rowan Cheung) | LinkedIn DM | "Launched the open-source EU AI Act compliance kit — free until Dec 2027" |
| 12 | **EU AI Act Newsletter** (Risto Uuk) | risto@futureoflife.org | "I've published the line-item EU AI Act × ISO 42001 crosswalk + 21 more — want to share for the newsletter" |
| 13 | **AI Risk Australia** (Greg Sadler / Soroush Pour) | Sentience Institute contact | "Open-source 33-node BFT Council ships — relevant to AI governance research" |
| 14 | **AI Frontiers** (Brookings) | aifrontiers@brookings.edu | "First open-source Council of Europe AI Convention crosswalk — happy to share" |
| 15 | **The Algorithm** (MIT Tech Review) | algorithm@technologyreview.com | "Open-source AI Self-State Transparency Index — first public benchmark of vendor self-state honesty" |
| 16 | **OneTrust AI Governance** | LinkedIn outreach | "ISO/IEC 42001 self-attestation MCPs — free until Dec 2027, integrate via REST" |
| 17 | **Holistic AI** | hello@holisticai.com | "I publish the only line-item NIST AI RMF × CSOAI Charter crosswalk — want to swap citations" |
| 18 | **Credo AI** | hello@credo.ai | "Open-source framework crosswalks — would you like to co-publish with Credo branding?" |
| 19 | **CSET (Center for Security and Emerging Tech)** | press@cset.georgetown.edu | "First open-source Maritime Law → AI Law parallel research paper — relevant to your governance program" |
| 20 | **GovAI (Centre for the Governance of AI)** | info@governance.ai | "Open-source AI governance substrate (52 articles, 22 crosswalks) — want to contribute?" |
| 21 | **Future of Life Institute** | letters@futureoflife.org | "Asilomar AI Principles crosswalk to MEOK MCPs — happy to share, citation-friendly" |
| 22 | **Partnership on AI** | info@partnershiponai.org | "Open-source 52-article Charter aligned with PAI's Synthetic Media Framework — would you like to review?" |
| 23 | **AI Now Institute** | info@ainowinstitute.org | "Toronto Declaration × CSOAI Charter crosswalk now published — relevant to your work on equality in ML" |
| 24 | **AlgorithmWatch** | info@algorithmwatch.org | "ADM compliance MCPs covering EU AI Act Art. 22 + GDPR Art. 22 — free for civil society" |
| 25 | **Mozilla AI** | hello@mozilla.ai | "Open-source 45-MCP safety substrate aligned with Mozilla's trustworthy AI work — collaboration?" |

**Send rate:** Max 5/day across all of these to stay under spam thresholds. Track replies in `~/clawd/revenue/_outreach_log.csv` (date, target, status, reply_summary).

---

## Sending checklist (do this once per email)

- [ ] Replace `{{FIRST_NAME}}` / `{{COMPANY}}` / `{{TRUST_NAME}}` / `{{PRODUCT}}` / `{{AI_TOOL}}` / `{{SOURCE}}`
- [ ] Verify recipient email via Hunter.io or LinkedIn before send
- [ ] Send from nicholas@csoai.org (NOT nicholas@meok.ai)
- [ ] CC: nicholastempleman@gmail.com (for personal records)
- [ ] Log in `~/clawd/revenue/_outreach_log.csv` immediately
- [ ] Set 7-day follow-up reminder
- [ ] Re-read once — no typos, no broken links, no James Castle / Terranova / CSGA / Chris James / Open Claw references (BANNED)

---

**End of outreach pack.**
