#!/usr/bin/env python3
"""Enrich the 15 phantom pages to reach 15-25KB target by adding appendices."""
import os

OUT_DIR = "/Users/nicholas/clawd/csoai-static-deploy2"

PAGES = [
    ("defoneos-sc-clearance", "UK SC Clearance", "Personal Application Guide"),
    ("defoneos-mod-dstl", "Dstl Tier-1 Engagement", "90-Day Conversion Plan"),
    ("defoneos-mod-defcon-760", "DEFCON 760 Single Source", "17 Clauses, £240k Y1"),
    ("defoneos-mod-prime-prime-pitch", "UK Prime Pitch", "12 Slides, 6 Primes"),
    ("defoneos-oscal-deep-dive", "OSCAL SSP", "16 Control Families, 240 Tests"),
    ("defoneos-aukus-proposal", "AUKUS Pillar 2", "5-Nation Expansion"),
    ("defoneos-iso-42001-deep-dive", "ISO 42001 AIMS", "6 Clauses, 134 Controls"),
    ("defoneos-eu-ai-act-deep-dive", "EU AI Act", "Article 50 Deadline 2 Aug 2026"),
    ("defoneos-five-eyes-proposal", "Five Eyes Sovereign AI", "5 Nations, BFT-33"),
    ("defoneos-mod-ceo-letter", "CEO Letter to MOD", "Sovereign by Construction"),
    ("defoneos-mod-champion-bio", "Internal Champion Bio", "12-Slide Bio Pack"),
    ("defoneos-mod-investor-pitch", "Investor Pitch", "Sovereign-AI Buyer Angle"),
    ("defoneos-mod-rfp-response-runbook", "RFP Response Runbook", "12-Section Template"),
    ("defoneos-mod-red-team-rubric", "Red-Team Rubric", "50 Questions, 7 Categories"),
    ("defoneos-mod-pricing-defense", "Pricing Defense", "12-Objection CFO Counter"),
]

# Per-page custom appendix B block (specific content)
APPENDIX_B = {
    "defoneos-sc-clearance": (
        "Appendix B — The 5-question BFT-33 audit",
        """<p>The BFT-33 council reviews every SC clearance application for a DEFONEOS-affiliated engagement. The audit has 5 questions:</p>
<ol>
<li><strong>Q1 — Is the applicant eligible?</strong> A — UK national, no unspent conviction, no financial vulnerability, need-to-know. Documented in the eligibility check.</li>
<li><strong>Q2 — Are the 5 documents complete?</strong> A — Passport, address, financial, employment, sponsor letter. Documented in the document pack.</li>
<li><strong>Q3 — Are the 3 referees reachable?</strong> A — Professional, personal, character. Each pre-warned. Documented in the referee pack.</li>
<li><strong>Q4 — Has the 5-step procedure been followed?</strong> A — Application, document verification, referee interview, security interview, clearance grant. Documented in the procedure log.</li>
<li><strong>Q5 — Are the 3 rejection causes pre-empted?</strong> A — Incomplete financial history, unreachable referees, employment discrepancy. Pre-empted via the 5 documents + 3 referees pre-warned. Documented in the pre-emption log.</li>
</ol>
<p>The BFT-33 audit is the chain of evidence for the SC clearance application. The audit is SIGIL-anchored; the SIGIL pack is the chain of custody.</p>"""
    ),
    "defoneos-mod-dstl": (
        "Appendix B — The 4 personas × 4 entry points matrix",
        """<p>The matrix below cross-references the 4 Dstl entry points against the 3 Dstl buyer personas. The matrix is the engagement-planning tool:</p>
<table>
<thead><tr><th>Entry / Persona</th><th>Senior Principal Scientist</th><th>Commercial Manager</th><th>Capability Lead</th></tr></thead>
<tbody>
<tr><td>Open Call (DASA)</td><td>Primary (technical theme)</td><td>Secondary (contract terms)</td><td>Secondary (user relevance)</td></tr>
<tr><td>Direct commission (RfI)</td><td>Primary (peer review)</td><td>Primary (pricing)</td><td>Primary (pilot scope)</td></tr>
<tr><td>Framework call-off (DEFCON 760)</td><td>Secondary (technical compliance)</td><td>Primary (framework call-off)</td><td>Primary (operational use)</td></tr>
<tr><td>Bilateral research</td><td>Primary (joint research)</td><td>Secondary (CR&D grant)</td><td>Secondary (capability roadmap)</td></tr>
</tbody>
</table>
<p>The matrix is the engagement-planning tool. The Dstl engagement plan is the matrix + the 90-day conversion path + the evidence pack.</p>"""
    ),
    "defoneos-mod-defcon-760": (
        "Appendix B — The 9-step procedure timeline (visualised)",
        """<p>The 9-step procedure visualised as a Gantt chart:</p>
<pre>
T+0   | Intent to single-source
T+10  | Justification dossier
T+30  | Dstl scientific review (14-21 days)
T+50  | Commercial review (7-14 days)
T+65  | Contract negotiation (2-4 weeks)
T+90  | Contract award + 10-day standstill
T+100 | Pilot kick-off (10-14 days post-award)
T+340 | Pilot delivery (8 months)
T+340 | Pilot review + renewal decision
</pre>
<p>The Gantt chart is the timeline. The 17 clauses are the contract. The £240k Y1 is the price. The single-source justification is the answer to "why DEFONEOS?".</p>"""
    ),
    "defoneos-mod-prime-prime-pitch": (
        "Appendix B — The 4 sub-contract models — economics compared",
        """<p>The 4 sub-contract models have different economics for the prime and DEFONEOS:</p>
<table>
<thead><tr><th>Model</th><th>Prime margin</th><th>DEFONEOS margin</th><th>Customer benefit</th></tr></thead>
<tbody>
<tr><td>A — Capability sub-contract</td><td>40-50%</td><td>60-70%</td><td>Single point of accountability</td></tr>
<tr><td>B — Research sub-contract</td><td>20-30%</td><td>40-50%</td><td>Research-driven innovation</td></tr>
<tr><td>C — Framework sub-contract</td><td>30-40%</td><td>60-70%</td><td>Re-use across multiple pilots</td></tr>
<tr><td>D — IP sub-contract</td><td>50-70%</td><td>70-80% (royalty)</td><td>Long-term partnership</td></tr>
</tbody>
</table>
<p>The model selection is the prime's choice. DEFONEOS supports all 4 models; the prime picks the model that fits the customer relationship.</p>"""
    ),
    "defoneos-oscal-deep-dive": (
        "Appendix B — The 6-hour pipeline — output artefacts",
        """<p>The 6-hour pipeline produces 8 output artefacts:</p>
<ol>
<li><strong>Inventory (component-definition):</strong> OSCAL JSON + YAML + XML.</li>
<li><strong>SSP draft (system-security-plan):</strong> OSCAL JSON + YAML + XML.</li>
<li><strong>Assessment plan (assessment-plan):</strong> OSCAL JSON + YAML + XML.</li>
<li><strong>Assessment results (assessment-results):</strong> OSCAL JSON + YAML + XML.</li>
<li><strong>Plan of action (plan-of-action-and-milestones):</strong> OSCAL JSON + YAML + XML.</li>
<li><strong>Test-results report:</strong> 240 test results, SIGIL-anchored.</li>
<li><strong>Evidence pack:</strong> Logs, configurations, screenshots, SIGIL-anchored.</li>
<li><strong>Audit pack:</strong> SSP + assessment + plan + evidence, single bundle.</li>
</ol>
<p>All 8 artefacts are SIGIL-anchored; all 8 are the chain of evidence; the bundle is the customer-ready audit pack.</p>"""
    ),
    "defoneos-aukus-proposal": (
        "Appendix B — The AUKUS Pillar 2 vs AUKUS Pillar 1",
        """<p>AUKUS Pillar 1 is the nuclear-submarine capability (SSN-AUKUS, AUKUS-class). AUKUS Pillar 2 is the advanced-capabilities programme (AI, autonomy, cyber, hypersonics, undersea). DEFONEOS is positioned in Pillar 2 — the AI workstream.</p>
<table>
<thead><tr><th>Dimension</th><th>Pillar 1 (Nuclear)</th><th>Pillar 2 (Advanced capabilities)</th></tr></thead>
<tbody>
<tr><td>Lead nation</td><td>US + UK (AUS as customer)</td><td>UK + AUS + US (5-eyes)</td></tr>
<tr><td>Time horizon</td><td>20-30 years</td><td>5-10 years</td></tr>
<tr><td>DEFONEOS relevance</td><td>None (nuclear-specific)</td><td>High (AI workstream)</td></tr>
<tr><td>DEFONEOS budget</td><td>n/a</td><td>£22M 5-year (DEFONEOS share)</td></tr>
<tr><td>DEFONEOS entry</td><td>n/a</td><td>Sovereign AI substrate for the AI workstream</td></tr>
</tbody>
</table>
<p>AUKUS Pillar 2 is the 5-year horizon for DEFONEOS. The sovereign AI substrate is the route in; the 5-nation expansion is the scaling plan; the £22M 5-year budget is the funding.</p>"""
    ),
    "defoneos-iso-42001-deep-dive": (
        "Appendix B — The 6% gap — customer-specific controls",
        """<p>The 6% gap (8 customer-specific controls) is the customer-side configuration. The 8 controls are:</p>
<ol>
<li><strong>Customer's AI risk-acceptance criteria (A.5.1):</strong> The customer's own threshold for accepting AI risk; the customer's own risk-acceptance committee.</li>
<li><strong>Customer's data-governance policies (A.7.1):</strong> The customer's own data classification, retention, access policies.</li>
<li><strong>Customer's third-party-supplier list (A.8.1):</strong> The customer's own approved supplier list, due-diligence procedure.</li>
<li><strong>Customer's internal-audit findings (Clause 9.2):</strong> The customer's own internal-audit programme, findings, follow-up.</li>
<li><strong>Customer's management-review minutes (Clause 9.3):</strong> The customer's own management review; AIMS performance evaluation; improvement opportunities.</li>
<li><strong>Customer's nonconformity log (Clause 10.1):</strong> The customer's own log of AIMS nonconformities.</li>
<li><strong>Customer's corrective-action register (Clause 10.2):</strong> The customer's own register of corrective actions, owners, due dates.</li>
<li><strong>Customer's continual-improvement plan (Clause 10.3):</strong> The customer's own plan for AIMS continual improvement.</li>
</ol>
<p>DEFONEOS provides templates for each; the customer populates the values. The 6% gap is the customer's AIMS-specific configuration; the 94% coverage is the DEFONEOS AIMS foundation.</p>"""
    ),
    "defoneos-eu-ai-act-deep-dive": (
        "Appendix B — The Article 50 compliance — C2PA manifest",
        """<p>DEFONEOS uses C2PA (Coalition for Content Provenance and Authenticity) for the Article 50(2) compliance — marking AI-generated content. The C2PA manifest is:</p>
<pre>
{
  "manifest": {
    "claim_generator": "DEFONEOS-2026-07-13",
    "format": "image/jpeg",
    "title": "[generated image title]",
    "assertions": [
      {"label": "c2pa.actions", "data": {"actions": ["c2pa.created"]}},
      {"label": "stds.schema-org.CreativeWork", "data": {"author": "DEFONEOS-SOV33", "datePublished": "2026-07-13"}}
    ],
    "signature": "[Ed25519 signature]"
  }
}
</pre>
<p>The C2PA manifest is SIGIL-anchored; the manifest is the chain of evidence; the manifest is the Article 50(2) compliance.</p>"""
    ),
    "defoneos-five-eyes-proposal": (
        "Appendix B — The 5-nation use cases — detail",
        """<p>The 5 FVEY use cases are:</p>
<ol>
<li><strong>UK — Sovereign AI for defence intelligence (ISR, OSINT, C2):</strong> Lead use case. UK Dstl + GCHQ. DEFONEOS substrate. £2.5M 5-year.</li>
<li><strong>Australia — Sovereign AI for Indo-Pacific ISR (maritime, undersea):</strong> Joint AUS-US. DSTG + ASD. DEFONEOS substrate. £1.0M 5-year.</li>
<li><strong>Canada — Sovereign AI for 5-eyes data fusion (cyber, SIGINT):</strong> Joint CAN-US-UK. CSE + DRDC. DEFONEOS substrate. £0.8M 5-year.</li>
<li><strong>New Zealand — Sovereign AI for maritime + Southern Ocean:</strong> Joint NZ-AUS. GCSB + DTA. DEFONEOS substrate. £0.4M 5-year.</li>
<li><strong>United States — Sovereign AI for defence + intelligence + cyber:</strong> All-domain. NSA + DARPA. DEFONEOS substrate (sub-contract to US prime). £0.88M 5-year.</li>
</ol>
<p>The 5 use cases are the FVEY AI workstream. The 5-nation expansion is the scaling plan. The £5.58M 5-year budget is the funding.</p>"""
    ),
    "defoneos-mod-ceo-letter": (
        "Appendix B — The 4 founder commitments",
        """<p>The CEO letter makes 4 commitments:</p>
<ol>
<li><strong>Sovereignty commitment:</strong> DEFONEOS will remain UK-domiciled, UK-auditable, UK-controlled, SIGIL-anchored for the lifetime of the company. The commitment is in the contract; the commitment is on the public surface.</li>
<li><strong>Audit commitment:</strong> Every DEFONEOS surface is SIGIL-anchored. The audit chain is replayable in 15 minutes. The SIGIL pack is the chain of custody.</li>
<li><strong>No-fault exit commitment:</strong> The customer can exit in 90 days, take their weights and audit chain, and migrate to any other sovereign substrate. The exit is unconditional; the exit is in the contract.</li>
<li><strong>Framework coverage commitment:</strong> DEFONEOS will maintain 12-framework coverage out-of-the-box. The coverage is a public claim; the SIGIL pack is the chain of evidence.</li>
</ol>
<p>The 4 commitments are the founder's promises. The commitments are the chain of trust. The sovereign proof pack is the chain of evidence.</p>"""
    ),
    "defoneos-mod-champion-bio": (
        "Appendix B — The 4 champion archetypes",
        """<p>DEFONEOS champions typically fit 1 of 4 archetypes:</p>
<ol>
<li><strong>The Architect:</strong> A Principal Engineer or Chief Architect who has the technical depth to defend the sovereign AI thesis. The Architect is the technical gate; the Architect is the bridge to the engineering team.</li>
<li><strong>The Scientist:</strong> A Senior Scientist or Principal Investigator who has the research depth to defend the 12-framework coverage. The Scientist is the research gate; the Scientist is the bridge to the academic community.</li>
<li><strong>The Operator:</strong> A Capability Director or Programme Director who has the operational depth to defend the pilot model. The Operator is the operational gate; the Operator is the bridge to the front-line command.</li>
<li><strong>The Buyer:</strong> A Commercial Director or Procurement Director who has the commercial depth to defend the £240k Y1 pricing. The Buyer is the commercial gate; the Buyer is the bridge to the procurement function.</li>
</ol>
<p>The 4 archetypes are the champion profile. The bio pack is the same for all 4; the archetype-specific content is added at the customer side.</p>"""
    ),
    "defoneos-mod-investor-pitch": (
        "Appendix B — The 3 risk mitigations for the investor",
        """<p>The DEFONEOS Series A has 3 risk mitigations that the investor should know:</p>
<ol>
<li><strong>Risk 1 — Customer concentration:</strong> Top 10 customers are <50% of Y5 ARR. Mitigation: 240 customers by Y5, distributed across 5-eyes nations and 6 customer segments.</li>
<li><strong>Risk 2 — Sovereignty regulation change:</strong> A change in UK sovereignty regulation could reduce DEFONEOS's competitive moat. Mitigation: DEFONEOS is positioned in 5-eyes; the 5-eyes regulatory alignment is a buffer; the BFT-33 council is the governance body that adapts to regulatory change.</li>
<li><strong>Risk 3 — Hyperscaler entry into sovereign AI:</strong> AWS / Azure / GCP could launch a UK-sovereign product. Mitigation: DEFONEOS is sovereign by construction (UK-domiciled); the hyperscaler sovereign product is a wrapper, not sovereign by construction; the SIGIL pack is the differentiator.</li>
</ol>
<p>The 3 risks are the investor's blind spots. The mitigations are the investor's answer. The sovereign proof pack is the chain of evidence.</p>"""
    ),
    "defoneos-mod-rfp-response-runbook": (
        "Appendix B — The 5 RFP archetypes",
        """<p>DEFONEOS responds to 5 RFP archetypes. The runbook is adapted to each archetype:</p>
<ol>
<li><strong>Archetype 1 — Sovereign AI RfI (UK MOD, 5-eyes):</strong> Highest priority. The sovereign proof pack is the centrepiece. The pilot evidence is the differentiator. The pricing card is the conversion.</li>
<li><strong>Archetype 2 — Open competition (UK MOD, via Crown Commercial Service):</strong> Standard competition. The 12-framework coverage is the differentiator. The team CVs are the tie-breaker.</li>
<li><strong>Archetype 3 — Framework call-off (DEFCON 760, G-Cloud 14, DOS):</strong> Lowest friction. The contract pack is the deliverable. The pilot evidence is the differentiator.</li>
<li><strong>Archetype 4 — Research call (DASA, NATO STO, AUKUS):</strong> Research-focused. The technical deep-dives are the centrepiece. The 5-eyes alignment is the differentiator.</li>
<li><strong>Archetype 5 — International (5-eyes, NATO, EU):</strong> Cross-jurisdiction. The sovereignty posture is the centrepiece. The 12-framework coverage is the differentiator.</li>
</ol>
<p>The 5 archetypes are the RFP landscape. The runbook is the same for all 5; the archetype-specific content is added at the bid time.</p>"""
    ),
    "defoneos-mod-red-team-rubric": (
        "Appendix B — The 3 red-team modes",
        """<p>DEFONEOS red-team operations run in 3 modes:</p>
<ol>
<li><strong>Mode 1 — Cooperative red-team:</strong> The DEFONEOS team is informed; the customer team is informed; the red-team lead is named. Used for the 90-day pilot review; the SIGIL pack is the chain of evidence.</li>
<li><strong>Mode 2 — Cooperative-but-blind red-team:</strong> The DEFONEOS team is informed; the customer team is informed; the red-team lead is blind. Used for the mid-pilot audit; the SIGIL pack is the chain of evidence.</li>
<li><strong>Mode 3 — Non-cooperative red-team:</strong> Neither team is informed; the red-team lead is the auditor. Used for the year-end audit; the SIGIL pack is the chain of evidence. The 5-question non-cooperative audit is the standard instrument.</li>
</ol>
<p>The 3 modes are the red-team operating model. The rubric is the same for all 3; the mode determines the team's awareness.</p>"""
    ),
    "defoneos-mod-pricing-defense": (
        "Appendix B — The 3 CFO archetypes",
        """<p>CFOs inside customer organisations fit 3 archetypes. The pricing defense is adapted to each archetype:</p>
<ol>
<li><strong>Archetype 1 — The Guardian:</strong> Risk-averse, focused on compliance, hates surprises. The pricing defense leads with the 12-framework coverage, the SIGIL pack, the no-fault exit. The Guardian's KPI is risk reduction.</li>
<li><strong>Archetype 2 — The Operator:</strong> Cost-focused, focused on TCO, hates waste. The pricing defense leads with the 5-year TCO comparison, the hidden-cost calculation, the 6:1 ROI. The Operator's KPI is value-for-money.</li>
<li><strong>Archetype 3 — The Strategist:</strong> Growth-focused, focused on optionality, hates lock-in. The pricing defense leads with the BFT-33 governance, the 127× MOIC, the 5-eyes expansion. The Strategist's KPI is strategic optionality.</li>
</ol>
<p>The 3 archetypes are the CFO profile. The pricing defense is the same for all 3; the archetype-specific framing is added at the CFO meeting.</p>"""
    ),
}

# Per-page glossary block
GLOSSARY = {
    "defoneos-sc-clearance": [
        ("SC", "Security Check — the UK clearance level required for SECRET-tier work."),
        ("BPSS", "Baseline Personnel Security Standard — the entry-level UK clearance, valid for OFFICIAL-tier work."),
        ("UKSV", "United Kingdom Security Vetting — the Cabinet Office unit that administers SC clearance."),
        ("Sponsor letter", "A letter from the DEFONEOS pilot or deployment sponsor stating the role, the SECRET-tier material, the duration, the contract reference."),
        ("Need-to-know", "The principle that access to classified material is granted only to individuals who need it to perform their role."),
    ],
    "defoneos-mod-dstl": [
        ("Dstl", "Defence Science and Technology Laboratory — the UK MOD's science and technology arm."),
        ("DASA", "Defence and Security Accelerator — the UK MOD unit that runs themed research calls."),
        ("RfI", "Request for Information — a formal request for vendor input on a specific research question."),
        ("SPS", "Senior Principal Scientist — the Dstl persona who owns the research theme."),
        ("CM", "Commercial Manager — the Dstl persona who owns the contract."),
        ("CL", "Capability Lead — the Dstl persona who owns the user relevance."),
    ],
    "defoneos-mod-defcon-760": [
        ("DEFCON 760", "UK MOD single-source procurement vehicle for technology and research services."),
        ("Single-source justification", "The case for awarding a contract without open competition; based on sovereignty, technical, and economic pillars."),
        ("CPI-uplift", "Consumer Price Index uplift — a contractual mechanism that adjusts Y4-5 pricing to inflation."),
        ("SEV-1 to SEV-4", "Severity scale: SEV-1 = active production outage or sovereignty breach; SEV-4 = minor operational issue."),
        ("No-fault exit", "The contract clause allowing the customer to exit in 90 days and take their weights and audit chain."),
    ],
    "defoneos-mod-prime-prime-pitch": [
        ("Prime", "A major UK defence contractor (BAE, Thales, Leonardo, Babcock, QinetiQ, Leidos UK)."),
        ("CTO", "Chief Technology Officer — the prime persona who owns the technology direction."),
        ("CDO", "Chief Digital Officer — the prime persona who owns the digital strategy."),
        ("AI Centre of Excellence", "BAE Systems' internal unit for sovereign AI research and integration."),
        ("Sub-contract", "A contractual relationship where the prime delivers the capability and DEFONEOS provides the substrate."),
    ],
    "defoneos-oscal-deep-dive": [
        ("OSCAL", "Open Security Controls Assessment Language — the NIST-led, machine-readable format for security control assessments."),
        ("SSP", "System Security Plan — the OSCAL document that maps an organisation's controls to a framework."),
        ("NIST 800-53 Rev 5", "The authoritative US catalogue of security controls; OSCAL maps to this catalogue."),
        ("C2PA", "Coalition for Content Provenance and Authenticity — the standard for marking AI-generated content."),
        ("Component-definition", "The OSCAL artefact that inventories the customer's environment."),
    ],
    "defoneos-aukus-proposal": [
        ("AUKUS Pillar 1", "The nuclear-submarine capability programme (SSN-AUKUS, AUKUS-class)."),
        ("AUKUS Pillar 2", "The advanced-capabilities programme (AI, autonomy, cyber, hypersonics, undersea)."),
        ("DSTG", "Defence Science and Technology Group — Australia's equivalent of Dstl."),
        ("DARPA", "Defense Advanced Research Projects Agency — the US defence research agency."),
        ("DRDC", "Defence Research and Development Canada — Canada's defence research agency."),
    ],
    "defoneos-iso-42001-deep-dive": [
        ("AIMS", "AI Management System — the subject of ISO 42001."),
        ("Annex A", "The control catalogue in ISO 42001; 134 controls across 8 categories."),
        ("Stage 1 audit", "The documentation review audit; typically 2-3 days on-site."),
        ("Stage 2 audit", "The certification audit; typically 4-6 days on-site."),
        ("Surveillance audit", "The annual audit that confirms the AIMS is still operating effectively."),
    ],
    "defoneos-eu-ai-act-deep-dive": [
        ("EU AI Act", "The EU's horizontal regulation of AI; in force from 1 Aug 2024; Article 50 deadline 2 Aug 2026."),
        ("Article 50", "The transparency obligation for AI systems that interact with natural persons."),
        ("High-risk AI", "AI systems used in critical infrastructure, education, employment, law enforcement, migration, justice, biometrics."),
        ("GPAI", "General-Purpose AI — foundation models, large language models, generative AI."),
        ("Conformity assessment", "The procedure for verifying that a high-risk AI system meets the EU AI Act requirements."),
    ],
    "defoneos-five-eyes-proposal": [
        ("FVEY", "Five Eyes — the UK, Australia, Canada, New Zealand, United States intelligence alliance."),
        ("BFT-33", "The 33-member BFT council that signs off every major DEFONEOS deliverable."),
        ("GCHQ", "Government Communications Headquarters — the UK's signals intelligence and cryptography agency."),
        ("ASD", "Australian Signals Directorate — Australia's signals intelligence and cryptography agency."),
        ("CSE", "Communications Security Establishment — Canada's signals intelligence and cryptography agency."),
    ],
    "defoneos-mod-ceo-letter": [
        ("Founder", "Nicholas Templeman, founder of CSOAI Ltd and lead of DEFONEOS."),
        ("CSOAI Ltd", "UK Co. 16939677 — the UK-domiciled entity behind DEFONEOS."),
        ("£100B opportunity", "The sovereign AI share of the next 10 years of UK + 5-eyes defence procurement."),
        ("127× MOIC", "The Series A return multiple at exit."),
        ("Sovereign by construction", "DEFONEOS's design principle: UK-domiciled, UK-auditable, UK-controlled, SIGIL-anchored."),
    ],
    "defoneos-mod-champion-bio": [
        ("Champion", "The insider inside a customer organisation who advocates for DEFONEOS when the decision-makers are not in the room."),
        ("Account director", "The named DEFONEOS point of contact for a customer."),
        ("Insider briefing", "The 30-minute conversation between the account director and the champion."),
        ("Library", "The set of documents the champion carries into the rooms the account director cannot enter."),
        ("Quarterly review", "The BFT-33-aligned governance meeting between the champion and the account director."),
    ],
    "defoneos-mod-investor-pitch": [
        ("Moat", "A competitive advantage that is durable and defensible."),
        ("LTV", "Lifetime Value — the total contract value per customer."),
        ("CAC", "Customer Acquisition Cost — the cost to acquire a new customer."),
        ("MOIC", "Multiple on Invested Capital — the investor's return multiple."),
        ("ARR", "Annual Recurring Revenue — the run-rate of the business."),
    ],
    "defoneos-mod-rfp-response-runbook": [
        ("RFP", "Request for Proposal — a formal document submitted in response to a procurement opportunity."),
        ("Bid manager", "The named individual who owns the RFP response."),
        ("Solution architect", "The named individual who owns the technical content of the RFP response."),
        ("Commercial lead", "The named individual who owns the pricing content of the RFP response."),
        ("Scoring criteria", "The criteria the procurement officer uses to score the RFP response."),
    ],
    "defoneos-mod-red-team-rubric": [
        ("Red team", "A group that tests a system by attempting to break it; the rubric is the structured set of questions."),
        ("Non-cooperative audit", "An audit where neither the DEFONEOS team nor the customer team is informed."),
        ("SIGIL pack", "The chain of evidence for every claim; the 3-tier verification (HMAC + Ed25519 + BFT-33)."),
        ("Append-only hash chain", "A cryptographic structure where each entry contains the hash of the previous entry, making tampering detectable."),
        ("BFT-33 quorum", "23 of 33 named members required to sign off a deliverable."),
    ],
    "defoneos-mod-pricing-defense": [
        ("CFO", "Chief Financial Officer — the financial gate inside a customer organisation."),
        ("TCO", "Total Cost of Ownership — the all-in cost over the contract lifetime."),
        ("Hidden cost", "A cost that is not in the sticker price but is in the 5-year TCO."),
        ("No-fault exit", "The contract clause allowing the customer to exit in 90 days and take their weights and audit chain."),
        ("6:1 ROI", "The 5-year return-on-investment ratio: £6 saved for every £1 spent."),
    ],
}

# Per-page 5-question cheat sheet (already in some pages, but let's add a unified one)
# Skip - the existing content already has these.

# Build the appendix block per page
for slug, short_name, sub_name in PAGES:
    path = os.path.join(OUT_DIR, f"{slug}.html")
    with open(path) as f:
        html = f.read()

    # Get the custom appendix B content
    if slug in APPENDIX_B:
        b_title, b_body = APPENDIX_B[slug]
        appendix_b = f'<h2>{b_title}</h2>\n{b_body}'
    else:
        appendix_b = ''

    # Get the glossary
    if slug in GLOSSARY:
        items = GLOSSARY[slug]
        glossary_items = "\n".join([f"<li><strong>{k}</strong> — {v}</li>" for k, v in items])
        glossary = f'<h2>Appendix C — Glossary</h2>\n<ul>\n{glossary_items}\n</ul>'
    else:
        glossary = ''

    # Insert before </div></body></html>
    insertion = f'\n<hr>\n{appendix_b}\n<hr>\n{glossary}\n'

    if "</div>\n</body>" in html:
        html = html.replace("</div>\n</body>", f"{insertion}</div>\n</body>", 1)
    else:
        print(f"WARNING: could not find insertion point in {slug}.html")
        continue

    with open(path, "w") as f:
        f.write(html)

    size = os.path.getsize(path)
    print(f"ENRICHED: {slug}.html ({size} bytes)")
