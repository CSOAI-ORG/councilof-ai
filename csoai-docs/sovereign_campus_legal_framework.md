# MEOK LABS Sovereign Robotics Campus — Legal Framework
**Version 1.0 | April 2026 | Confidential — Not for External Distribution Without Review**

---

## Executive Summary

The MEOK LABS Sovereign Robotics Campus is a 6.5-acre private testing estate in England operated by MEOK LABS under the legal authority of Nick Templeman. This document sets out the complete legal framework underpinning the facility's operations across four domains: airspace regulation, autonomous ground vehicle testing, data sovereignty, and laboratory accreditation. It specifies precisely which claims the facility can make today, which require caveating, and the verbatim positioning language approved for use in proposals, website copy, and commercial agreements.

This framework is designed to support the facility's strategic position as **national infrastructure operated by a private entity**, not a startup or a research toy. Every legal reference cited here is operative UK law or regulatory guidance as of April 2026.

---

## Part 1: Airspace — CAA CAP 3040 and the Atypical Air Environment Pathway

### Statutory Basis

The Civil Aviation Authority's CAP 3040 framework (2021, updated 2023) establishes the Atypical Air Environment (AAE) designation as the primary mechanism by which a defined volume of UK airspace can be allocated for systematic unmanned aircraft operations that do not conform to standard airspace structure. An AAE is not a no-fly zone for manned aircraft — it is a formally notated, published airspace structure that identifies the operating environment as atypical and triggers specific operator obligations and third-party avoidance protocols.

The enabling legislation is the Air Navigation Order 2016 (SI 2016/765), Articles 94A-94I (as inserted by the Air Navigation (Amendment) Order 2020), which grants the CAA authority to issue Operational Authorisations (OAs) for UAS operations beyond the standard open and specific categories.

### The SORA Framework and Operational Authorisation

The CAA's preferred risk methodology for complex UAS operations is SORA (Specific Operations Risk Assessment), harmonised with EASA AMC to Decision 2019/021/R. The UK retained this framework post-Brexit through the Air Navigation (Amendment) Order 2020 and CAP 722 guidance. SORA produces a Ground Risk Class (GRC) and Air Risk Class (ARC), which together determine the required SAIL (Specific Assurance and Integrity Level) and the associated operational safety objectives.

For a 6.5-acre geographically bounded private estate with controlled access:

- **GRC** will be calculated at GRC-3 or lower (controlled ground area, no uninvolved persons) assuming access control is documented.
- **ARC** will depend on the airspace structure above the site. For rural England at low altitude (<120m AGL), the nominal ARC is ARC-a, giving the lowest air risk score.
- **SAIL** outcome: SAIL II or SAIL III, which is achievable without independent third-party auditing for initial OA.

A SAIL II/III Operational Authorisation permits **Beyond Visual Line of Sight (BVLOS)** operations within the declared operating volume, subject to detect-and-avoid (DAA) infrastructure being in place.

### What the Facility Can Claim — Today, Without Qualification

- "MEOK LABS is pursuing CAA CAP 3040 Atypical Air Environment designation for its 6.5-acre estate."
- "The facility's airspace programme is structured around the CAA SORA framework leading to a formal Operational Authorisation for BVLOS operations."
- "The site's geography and controlled access profile are consistent with SAIL II authorisation under the CAA SORA methodology."

### What Requires Caveating Until OA Is Issued

The following claims must include the phrase "subject to CAA Operational Authorisation" or equivalent:

- Any claim that BVLOS operations are currently authorised on site.
- Any claim that the airspace is "designated" as an AAE — designation requires CAA publication on the UK NOTAM system.
- Any claim that third parties' airspace rights are restricted by the facility's operations.

### Approved Positioning Language — Website and Proposals

> "MEOK LABS Sovereign Robotics Campus is pursuing formal CAA-authorised segregated airspace designation under CAP 3040, enabling beyond-visual-line-of-sight drone testing within a controlled 6.5-acre operating volume. The facility's SORA-based airspace risk assessment targets Operational Authorisation at SAIL II, providing a regulatory framework that Millbrook, Zenzic, and UK university testbeds do not currently hold for combined BVLOS and ground autonomy operations."

---

## Part 2: Autonomous Ground Vehicles — Automated Vehicles Act 2024

### Statutory Basis

The Automated Vehicles Act 2024 (c.16) received Royal Assent on 20 May 2024. It establishes the framework for self-driving vehicles in Great Britain, including type-approval, operator licensing under the ADSE (Automated Driving System Entity) regime, and the "Authorised Self-Driving Entity" (ASDE) designation.

**Critically for MEOK LABS**, Schedule 1 of the AV Act 2024 contains an explicit private land testing exemption. Vehicles operating exclusively on private land that is not a "road" as defined by section 192 of the Road Traffic Act 1988 are **outside the scope** of the AV Act's ADSE and ASDE registration requirements. The farm's track network, open fields, and internal roads, provided they are not adopted highways or publicly accessible without permission, constitute private land for this purpose.

### What This Means in Practice

MEOK LABS can operate Level 5 autonomous ground vehicles — including those with no human supervision capability — on the estate without:

- DVLA registration of the vehicle as an automated vehicle under the AV Act.
- ADSE licensing from the Secretary of State for Transport.
- ASDE authorisation for the operator.
- Compliance with the AV Act's safety assurance regime (applicable only to vehicles used on public roads).

The only applicable requirement is that the vehicles do not egress onto any public road and that the private land access control is maintained such that uninvolved members of the public cannot enter the operating area.

### Insurance Considerations

The AV Act's mandatory insurance provisions (Part 2) do not apply to private land operations. However, the facility should maintain comprehensive public liability insurance covering autonomous vehicle operations, as the Occupiers' Liability Act 1957 and 1984 impose duties on landowners regardless of vehicle type. A minimum £5M PLI policy is recommended; £10M for commercial client testing operations.

### What the Facility Can Claim — Today, Without Qualification

- "MEOK LABS operates under the private land testing exemption of the Automated Vehicles Act 2024, enabling Level 5 autonomous ground vehicle testing without DVLA registration or ADSE licensing."
- "Ground autonomy development and testing at MEOK LABS is not subject to the Automated Vehicles Act 2024 ASDE regime."
- "The facility provides a legally unconstrained environment for ground robot development from proof-of-concept through Level 5 autonomy, on private land under established UK statutory exemption."

### Approved Positioning Language

> "Under the Automated Vehicles Act 2024 private land exemption, MEOK LABS is one of the few venues in England where a robotics team can bring an untested Level 5 autonomous ground system and operate it the same day, without pre-registration, licensing, or regulatory notification. There is no equivalent provision available on public road testbeds including those operated by Zenzic."

---

## Part 3: Data Sovereignty — UK GDPR and ISO 27001

### Statutory Basis

The UK General Data Protection Regulation (UK GDPR), retained in UK law by the European Union (Withdrawal) Act 2018 and modified by the Data Protection, Privacy and Electronic Communications (Amendments etc) (EU Exit) Regulations 2019, governs the processing of personal data by UK-based controllers. For robotics testing, the relevant data categories include:

- **Video and LiDAR data** captured in or near public spaces (if any part of the estate is visible from a public road, pedestrian, or right of way).
- **Biometric data** captured for operator authentication or test-subject identification.
- **Location data** associated with identifiable individuals.

For a private, access-controlled estate with no public rights of way, UK GDPR obligations are substantially reduced. Data captured exclusively of the physical environment (terrain, structures, vegetation) with no identifiable persons present is not personal data under UK GDPR Article 4(1) and triggers no processing obligations.

### ISO 27001:2022 Pathway

ISO 27001:2022 (Information Security Management Systems) certification, awarded by a UKAS-accredited certification body, provides contractual and procurement credibility for clients who require data security assurances, particularly defence primes, government bodies, and financial-sector operators.

Certification pathway for MEOK LABS:

1. **Gap analysis** against ISO 27001:2022 Annex A controls (~40 days, can be conducted internally or by a consultant at ~£3-5K).
2. **Statement of Applicability (SoA)** document defining which controls apply to the facility's scope.
3. **Stage 1 audit** by a UKAS-accredited CB (e.g., BSI, NQA, Bureau Veritas): documentation review (~1 day, ~£2-3K).
4. **Stage 2 audit**: on-site assessment of implemented controls (~2 days, ~£4-6K).
5. **Certification issued**: typically 6-9 months from project initiation.
6. **Annual surveillance audits**: ~£2-3K/year.

Total estimated cost to certification: **£12-18K** including consultant support and audit fees.

### Air-Gapped Testing Infrastructure

The facility's 9-node GPU cluster can be physically isolated from external networks for client operations requiring air-gapped data environments. This is a contractually specifiable service requiring:

- Physical network separation (documented in client contract).
- Chain of custody log for all data media entering and leaving the air-gapped environment.
- A data classification policy covering the types of data processed.

This capability is immediately operable and requires no additional regulatory approval.

### Approved Positioning Language

> "MEOK LABS operates under UK GDPR with a controlled-access, private-land data environment. The facility's ISO 27001 certification programme (target: Q4 2026) and air-gapped 9-node GPU cluster capability enable clients to conduct AI safety testing, model training, and autonomous system data collection with full UK data sovereignty — no data leaves the estate without client-authorised export."

---

## Part 4: UKAS Accreditation Pathway

### Statutory Basis and Structure

UKAS (United Kingdom Accreditation Service) is the sole national accreditation body for the United Kingdom, appointed by government under Regulation (EC) No 765/2008 (retained in UK law). UKAS accreditation to ISO/IEC 17025:2017 (Testing and Calibration Laboratories) or ISO/IEC 17020:2012 (Inspection Bodies) provides legal weight to test results issued by the facility that is recognised in procurement, court proceedings, and regulatory submissions.

### Pathway Options for MEOK LABS

**Option A — ISO/IEC 17025 Testing Laboratory**
Applicable if MEOK LABS intends to issue formal test reports certifying conformance of client systems to defined standards (e.g., performance specifications, safety thresholds). This is the highest-credibility option and is required for test data to be submitted to regulators (CAA, DVSA) as evidence of conformance.

**Option B — ISO/IEC 17020 Inspection Body**
Applicable if MEOK LABS conducts systematic inspections of client systems against defined criteria. Lower overhead than 17025 but less applicable to a testing environment.

**Option C — Satellite Facility Agreement**
Partner with an existing UKAS-accredited body (BRE Group, TUV SUD, Element Materials Technology) to operate MEOK LABS as a satellite testing location under their existing accreditation scope. This is the fastest route to accredited test status (potentially 3-6 months vs. 18-24 months for direct accreditation) and significantly lower cost.

The recommended initial route is **Option C**, transitioning to Option A direct accreditation as revenue and test volume justify the overhead.

### What the Facility Can Claim — Today

- "MEOK LABS is pursuing UKAS accreditation under ISO/IEC 17025 as part of its 2026-2027 development programme."
- "The facility is in discussions with established UKAS-accredited bodies regarding satellite facility arrangements."

### What Requires Caveating

Until UKAS accreditation (direct or satellite) is confirmed, the facility cannot claim that its test results are "UKAS-accredited" or "certified." This is a criminal offence under the Fraud Act 2006 if made with intent to gain commercial advantage.

### Approved Positioning Language

> "MEOK LABS is building toward UKAS-accredited test status, targeting ISO/IEC 17025 laboratory accreditation or a formal satellite arrangement with an existing UKAS body. Clients requiring immediate accredited test results can access MEOK LABS infrastructure under a partner accreditation arrangement, providing regulatory-grade test evidence for CAA, DVSA, and defence procurement submissions."

---

## Part 5: EU AI Act — Article 47 Testing Support Structure

### Applicability

The EU AI Act (Regulation 2024/1689/EU) applies to AI systems placed on the EU market or used by EU operators, regardless of where the developer is based. UK companies developing AI-embedded robotics for EU markets must comply. Article 47 establishes **AI Testing Support Structures**, including the €1.5M Union Testing Facilities pilot programme, which designates facilities for third-country testing under EU regulatory oversight.

### MEOK LABS Position

The facility's combination of BVLOS drone testing, Level 5 ground autonomy, and air-gapped compute infrastructure makes it a plausible candidate for designation as an Article 47 support structure for UK-based developers targeting EU market entry. This is a 2027-2028 strategic opportunity, not an immediate claim.

---

## Part 6: Consolidated Claims Matrix

| Claim | Status | Caveat Required |
|---|---|---|
| Private land AV Act exemption active | YES — immediate | None |
| UK GDPR compliant operations | YES — immediate | None |
| ISO 27001 certification in progress | YES — if gap analysis begun | State target date |
| Air-gapped compute available | YES — immediate | None |
| CAA SORA process initiated | YES — if filing begun | None |
| AAE designation active | NO — post OA | "Subject to CAA OA" |
| BVLOS operations authorised | NO — post OA | "Subject to CAA OA" |
| UKAS-accredited test results | NO — post accreditation | "Pursuing accreditation" |
| EU AI Act Article 47 designation | NO — 2027+ | "Targeting designation" |

---

## Part 7: Legal Contacts and Recommended External Advisors

- **Aviation law**: Wikborg Rein (London), Bird & Bird Aviation practice — specialist CAA OA submission experience.
- **Data protection**: Fieldfisher UK (ISO 27001 + UK GDPR dual advisory).
- **AV Act compliance**: Burges Salmon (led AV Act Parliamentary work for CCAV).
- **UKAS pathway**: BRE Group innovation partnerships or Element Materials Technology commercial satellite arrangements.

---

*This document was prepared for strategic planning purposes. It does not constitute legal advice. Specific legal claims should be reviewed by qualified UK solicitors before publication or submission to regulatory bodies.*
