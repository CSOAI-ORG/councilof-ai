# MEOK Estate — UK Advanced Robotics Testing Facility
## Commercial Strategy and Operational Framework

**Version 1.0 — April 2026**
**Prepared by:** MEOK LABS Ltd / MEOK AI Labs
**Classification:** Confidential — Strategic Planning

---

> This document makes the commercial case for establishing the MEOK Estate as the UK's only legally sandboxed, credentialed, outdoor robotics testing facility combining on-site AI safety certification with sovereign compute. It is written as a live business case, not a theoretical proposition.

---

## Part 1 — The Market Gap

### What UK Robotics Companies Actually Need

The UK autonomous systems sector — spanning agricultural robotics, industrial manipulation, delivery drones, military UAS, and care robotics — has a shared, acute operational problem: there is nowhere legal to test at scale.

Testing an autonomous ground vehicle on a public road requires DVLA registration, insurance, a qualified driver as safety operator, and compliance with the Highway Code and Automated Vehicles Act 2024. Testing a drone beyond visual line of sight (BVLOS) requires a CAA Operational Authorisation, a qualified Remote Pilot, and in practice means months of SORA (Specific Operations Risk Assessment) preparation before a single flight. Testing RF-emitting systems — radar, millimetre-wave sensors, LiDAR with active illumination — can trigger Ofcom interference investigations. Testing untested AI decision systems in public carries product liability exposure under the Consumer Protection Act 1987 and the AI Liability Directive pipeline.

The result: UK robotics companies test in car parks, fields borrowed from sympathetic farmers under informal arrangements, and industrial estates with no safety infrastructure. They test abroad — particularly in the Netherlands (A10 corridor), Spain (ATLAS test site), and the US (proving grounds in the Mojave). Testing abroad costs money, fragments data sovereignty, and creates IP exposure.

### What Does Not Exist in the UK

There is no UK facility that combines all of the following in a single site:

- **Outdoor uncontrolled terrain** — varied ground surfaces, gradients, natural obstacles, weather exposure — for ground vehicle and bipedal robot testing
- **A legal testing envelope** — private roads (RTA exemption), restricted airspace (CAA Article 239), EMC research exemption (Ofcom), and a formal HSE-registered controlled environment
- **Sovereign on-site compute** — GPU cluster for real-time inference, dataset processing, and model evaluation without data leaving the site
- **On-site AI safety certification** — a MEOK AI Labs-accredited safety observer and the documentation apparatus to produce a certification artefact from the same visit as the test

### Why the BRL Is Not the Answer

The Bristol Robotics Laboratory (BRL) is the largest co-located robotics research centre in the UK and a genuinely excellent academic facility. It is not a substitute for what is described here. The BRL operates on the UWE and University of Bristol campuses — urban locations with no outdoor terrain, no airspace restriction, no agricultural or uncontrolled environment. It is primarily structured around funded research partnerships with long lead times and academic publication cycles. It does not provide commercial day-rate access for third-party testing. It does not offer a legal testing sandbox for non-academic clients under time pressure. It has no on-site certification function. A startup needing to run 200km of autonomous navigation trials, or a defence prime needing BVLOS drone footage without public airspace exposure, cannot use the BRL.

The MEOK Estate fills this gap because it is exactly what the BRL is not: rural, outdoor, privately controlled, legally isolated, and commercially accessible.

---

## Part 2 — The Legal Framework

### Overview

The legal viability of MEOK Estate as an Advanced Robotics Testing Facility rests on five overlapping statutory and regulatory instruments. Taken together, they create a legal perimeter around the site within which activities that would be prohibited, regulated, or commercially uninsurable on public land or in public airspace can be conducted lawfully and with defined liability allocation. None of these instruments requires primary legislation or government approval in the conventional sense — each is an existing framework that applies by operation of law or can be activated through a defined administrative process.

---

### 2a — HSE Health and Safety at Work Act 1974, Section 4

**The instrument.** Section 4 of the HSWA 1974 imposes a duty on persons who have control of premises used as a place of work to take such measures as it is reasonable for a person in their position to take to ensure, so far as is reasonably practicable, that the premises, and the means of access and egress from them, are safe and without risks to health. Section 4 applies to non-employees who use the premises — it is the basis of the facility operator's duty to visiting testers and clients.

**How this creates the legal framework.** Registration as a Section 4 "controlled environment" — evidenced by a documented Safety Management System (SMS), site-specific risk assessments, emergency procedures, and a named responsible person — transforms MEOK Estate from a farm into a legally defined workplace controlled environment. This matters commercially because it:

- Allows MEOK LABS to set and enforce entry conditions, safety briefing requirements, and equipment standards as a condition of site access, with legal backing
- Creates a documented duty-of-care baseline that insurers will underwrite against — without it, specialist liability cover for third-party robotics testing is unavailable
- Signals to clients (particularly larger companies with their own EHS compliance requirements) that a recognised framework governs the site

**Practical steps.** Prepare a Site Safety Case document covering: site hazards (electrical, mechanical, RF emissions, aerial operations, autonomous ground vehicles), control measures, access control, emergency response, and a training matrix. Engage HSE's local inspector team for a pre-registration advisory visit — HSE offers this for novel facility types and it is free. Register under RIDDOR (Reporting of Injuries, Diseases and Dangerous Occurrences Regulations 2013) as an active research facility. Appoint a named Health and Safety Competent Person (need not be a full-time employee; a retained H&S consultant will satisfy the requirement).

**Cost.** Safety Case preparation by a specialist H&S consultant: £3,000–£6,000 one-time. RIDDOR registration: free. Annual H&S consultant retainer: £1,500–£3,000.

---

### 2b — CAA Article 239 (Air Navigation Order 2016) — Airspace Restriction Over Private Land

**The instrument.** Article 239 of the Air Navigation Order 2016 (SI 2016/765) provides the mechanism through which airspace can be restricted over a defined geographic area. Separately, the fundamental position under English property law (derived from common law: *Bernstein v Skyviews and General Ltd* [1978] QB 479, as modified by the Civil Aviation Act 1982 s.76) is that landowners do not own the airspace above their land to any useful height, and low-altitude aircraft do not trespass merely by overflying. However, a CAA-designated restriction changes this.

**How this creates the legal framework.** By applying to the CAA for a Danger Area (DA) or Restricted Area (RA) designation over the MEOK Estate's GPS boundary, MEOK LABS creates a legally published no-fly zone. Any aircraft — manned or unmanned — that enters this airspace without explicit permission from the Airspace Manager (MEOK LABS) is in violation of the Air Navigation Order. This is not merely a civil matter; violation of a designated restricted area is a criminal offence. The practical consequence: client drone operations within the designated area are unambiguously lawful; all other overflights are unambiguously unlawful. This eliminates the core liability risk of drone testing on undesignated land, where the legal status of third-party overflights and near-miss scenarios is unclear.

**How to apply.** Airspace restriction applications are submitted to the CAA's Airspace Management and Sectorisation (AMS) team. The application must include: a defined GPS polygon of the restricted area, the proposed vertical limits (surface to a specified altitude in feet AMSL), the proposed hours of activation, and a safety case justifying the restriction. Applications for temporary restrictions (TRAs) can be submitted with 3–4 weeks lead time. Permanent restricted area designation requires a formal Airspace Change Proposal (ACP) under the CAA's ACP process — longer (6–12 months) but creates a permanently published restriction in the UK AIP (Aeronautical Information Publication).

**Recommended approach.** Begin with Temporary Reserved Area (TRA) activations on testing days while the permanent ACP is processed. The TRA process is well-established and routinely used by Dstl and other defence establishments for drone trials.

---

### 2c — Road Traffic Act 1988 — Private Road Exemption

**The instrument.** The Road Traffic Act 1988 applies to "roads" as defined in s.192 — a road to which the public has access. A road that is entirely on private land, to which access by the public is excluded by a combination of legal title (freehold) and physical measures (gate, signs, locked access), is not a "road" for RTA purposes. Accordingly, autonomous vehicles, experimental platforms, and prototype ground vehicles operating on private roads within the MEOK Estate are not subject to: registration requirements (DVLA), insurance requirements (Road Traffic Act 1988 s.143), Construction and Use Regulations (SI 1986/1078), or the type approval requirements under the Automated Vehicles Act 2024.

**Practical consequence.** A client can operate a fully autonomous ground vehicle — with no number plate, no human operator in or on the vehicle, no insurance in the road traffic sense — on the MEOK Estate's internal tracks without any statutory breach. This is the same basis on which quarry vehicles, airside airport vehicles, and agricultural machinery operate without road registration. The requirement is that access is genuinely excluded — hence the perimeter fence, locked gate, and signed exclusion (see Part 3 — Physical Infrastructure).

**Documentation.** Prepare a Private Road Declaration: a simple legal document executed as a deed, signed by the freehold owner, declaring that named internal tracks and areas are private roads to which public access is excluded. Register this with the Land Registry as a restriction on title. Display appropriate signs at all access points: "PRIVATE ROAD — NO PUBLIC ACCESS — EXPERIMENTAL VEHICLES IN OPERATION."

---

### 2d — EMC Regulations 2016 and Ofcom Research Exemption

**The instrument.** The Electromagnetic Compatibility Regulations 2016 (SI 2016/1091), implementing EU Directive 2014/30/EU as retained in UK law, require apparatus that may cause electromagnetic interference to be CE (or UKCA) marked and compliant with essential requirements. However, Regulation 4(2) and Schedule 1 provide an explicit exclusion for apparatus used exclusively for research, evaluation, and development. Ofcom's Interface Requirements and licence exemptions further provide that certain research activities can operate non-standard RF frequencies without individual spectrum licence, under the Research and Development exemption (Interface Requirement 2030 and related instruments).

**Practical consequence.** Testing radar systems operating in novel frequency bands, millimetre-wave sensing, ultra-wideband ranging, or experimental RF communication protocols does not require UKCA marking or individual spectrum licensing during development and evaluation phases, provided the activity is demonstrably R&D in nature and documented as such. The Faraday cage room (see Part 3) provides additional containment for the highest-power RF tests.

**Documentation requirement.** Maintain a Research Register documenting each RF test event: frequency, power, duration, equipment ID, and research purpose. This is not submitted to Ofcom routinely but must be available on request and forms part of the R&D tax credit documentation under HMRC's definition of qualifying R&D activity.

---

### 2e — CAA Operational Authorisation for UAS Operations on Private Land

**The instrument.** Under the UK Drones Regulation (Air Navigation Order 2016 as amended, and Commission Delegated Regulation (EU) 2019/945 as retained), drone operations in the Specific Category (above Open Category limits — beyond 120m, BVLOS, or with higher-risk characteristics) require an Operational Authorisation (OA) from the CAA. An OA is site-specific or operation-type-specific and is granted following submission of a SORA.

**How MEOK LABS applies.** Rather than clients each obtaining their own OA for testing at the Estate, MEOK LABS obtains a standing Operational Authorisation for drone operations within the Estate's boundary. This OA would cover: operations within the designated airspace restriction area, BVLOS operations (within the site boundary), operations up to a defined maximum altitude, with defined UAS types. Client operations are then conducted under the standing OA, with MEOK LABS as the accountable operator and a MEOK-qualified Remote Pilot as safety observer. This removes a major barrier to entry for clients who do not have their own OA and cannot wait 3–6 months for individual CAA approval.

**Application process.** Contact CAA's UAS team. Submit a SORA covering the Estate's geography, typical operations, mitigations (airspace restriction, ground exclusion zone, trained personnel), and emergency procedures. Engage a CAA-approved SORA consultant (typical cost: £5,000–£10,000). Expected timeline: 3–6 months from submission to first OA issuance.

**Commercial value.** The standing OA is itself a commercial asset. It means a client can arrive on a Monday, complete a BVLOS drone test programme by Friday, and leave with test data — rather than waiting six months for their own regulatory clearance.

---

## Part 3 — Physical Infrastructure

### Design Principles

Infrastructure investment at MEOK Estate should follow three principles: legal necessity first, safety requirement second, commercial attractiveness third. Every pound spent on the perimeter and safety infrastructure is also a pound spent on liability protection and insurance premium reduction. Cosmetic upgrades come last.

### Perimeter — Legal Boundary and Liability Shield

An 8-foot welded mesh or palisade fence along the full site perimeter, combined with a native hedgerow on the outer face, achieves three things simultaneously: it physically excludes the public (satisfying the RTA private road requirement), it creates a legal liability boundary (anyone inside has either been admitted by MEOK LABS or is trespassing — the duty of care position is unambiguous), and it provides a visual and physical barrier that satisfies HSE's controlled environment requirements for hazardous operations.

Warning signs must be installed at all access points and at regular intervals along the perimeter. Required wording (to satisfy both HSE and the private road declaration): "PRIVATE PROPERTY — NO PUBLIC ACCESS — EXPERIMENTAL AUTONOMOUS VEHICLES AND AERIAL SYSTEMS IN OPERATION — AUTHORISED PERSONNEL ONLY." Signs must be in English, weatherproof, A3 minimum size, and visible from 10 metres.

The main gate should be a motorised vehicle gate with keypad and fob access, with a pedestrian wicket gate separately controlled. A CCTV camera covering the gate approach, logged and retained for 30 days, satisfies both insurance and GDPR legitimate interests requirements for a security system.

### Zone Layout

**Zone A — Indoor Lab (existing 1,800 sq ft).** The primary controlled environment. Climate-controlled workspace for robot assembly, software development, and component testing. Houses the GPU cluster (air-gapped network segment). Designated zones for electrical testing, mechanical assembly, and a clean-room section for sensor calibration. Install ESD flooring, emergency stop buttons (red mushroom head, hardwired to mains isolation) at all four walls, fire suppression (CO2, not water — to protect electronics), and a two-door airlock entry for containment during RF testing.

**Zone B — Covered Outdoor (new build).** A 40ft x 20ft open-sided steel-framed canopy, rated for UK wind loads and snow. Provides a sheltered space for assembly and weather-sensitive operations without full indoor constraint. Roller-shutter sides allow full enclosure. This zone is where clients will configure and prepare vehicles before field deployment. Install three-phase power supply, compressed air, equipment storage lockers, and a first aid station.

**Zone C — Open Field Testing.** The primary outdoor test area — varied terrain across multiple acres. Mark with painted ground zones (concrete pads, loose gravel, grass, slope), install a perimeter ground loop for geofencing calibration, and place numbered waypoint posts at 50m intervals for navigation benchmarking. Fixed weather station (wind speed, direction, temperature, humidity, precipitation, barometric pressure) with real-time data feed to the lab. Emergency stop beacons at four corners, visible from any point in the zone.

**Zone D — Water/Pond Testing.** The existing pond or low-lying area designated for amphibious robot testing, aquatic drone operations, and waterproofing trials. Install a safety grab-rail around the edge, a life ring post, and clear depth markings. This is a differentiating asset — very few UK test facilities have any water testing capability.

### Utilities and Connectivity

**Power.** 5kW solar array on the lab roof with battery storage (minimum 20kWh capacity) provides resilience against grid outages. The GPU cluster draws approximately 15–20kW under full load; this requires grid supply for heavy compute — solar handles lighting, low-power operations, and provides backup for safety systems. Install a 100A three-phase supply to Zone B and Zone C (via armoured underground cable) for vehicle charging and high-power equipment.

**Connectivity.** Underground fibre from the main lab to Zone B and Zone C junction boxes. Starlink as WAN with automatic failover. The GPU cluster runs on a physically air-gapped network segment — no Starlink or external internet routing to the cluster. Client data stays on-site unless explicitly migrated by the client. This is a data sovereignty selling point, particularly for defence and dual-use clients.

**RF testing room.** A Faraday cage room within Zone A (minimum 3m x 3m, 6dB shielding minimum) for contained RF testing. This enables clients to test RF systems without requiring full EMC lab certification and without interference risk.

**Airspace infrastructure.** Four telescoping masts at the corners of Zone C, minimum 6m height, each carrying: aviation warning lights (flashing amber, CAA-compliant), the GPS boundary beacons for the geofence system, and anchor points for a high-visibility safety net if required for low-altitude operations. Register the GPS polygon with the CAA's NATS flight planning system and with SkyDaemon and AirSpace Explorer to ensure the restriction appears in all major UK drone planning apps.

---

## Part 4 — Commercial Facility Rental Tiers

### Pricing Philosophy

Pricing is set to position MEOK Estate in the middle of the specialist testing market — above informal farm access arrangements, below the cost and delay of overseas proving grounds. Every tier above Day Pass includes a MEOK LABS safety officer as standard: this is not optional hospitality, it is a legal and insurance requirement, and it is the mechanism through which the MEOK AI Labs certification function integrates with the testing service.

---

### Tier 1 — Day Pass: £500/day

**Who it is for.** Small robotics companies, university spin-outs, independent developers needing a legal outdoor test environment for one day. Typical users: teams testing a prototype AGV navigation system, a drone payload, or an agricultural sensor suite.

**What is included.** Zone C access (open field), single-phase power hookup, basic safety briefing (30 minutes, documented), site map and emergency procedures, access from 08:00 to 18:00, MEOK LABS safety observer present on-site (shared, not dedicated). No cluster access. No Zone A access beyond the reception area.

**What is not included.** Drone operations (requires Tier 2 minimum for standing OA coverage), Zone D water access, certification artefact, GPU time.

**Revenue model.** 50 Day Pass bookings per year = £25,000. This is the marketing funnel — clients who test once and see the facility convert upward.

---

### Tier 2 — Research Partner: £2,000/day

**Who it is for.** University research groups, SME robotics companies with active R&D programmes, corporate innovation teams running structured test campaigns. Typical engagement: 3–5 day test block, repeated quarterly.

**What is included.** All zones (A, B, C, D), dedicated MEOK AI Labs safety observer (on-site, exclusive to the booking), cluster access (up to 4 GPU nodes, 8-hour allocation per day), drone operations under the standing CAA Operational Authorisation, data sovereignty guarantee (all data stored on-site, client-controlled deletion), test log documentation in MEOK AI Labs format (admissible as safety evidence in regulatory submissions).

**What is not included.** Certification artefact (available as add-on: see MEOK AI Labs Certified Testing package), overnight access, dedicated permanent bay.

**Revenue model.** 10 Research Partner days per year in Year 1 = £20,000. Conservative — this tier is where revenue accelerates as reputation builds.

---

### Tier 3 — Strategic Partner: £10,000/month (minimum 3-month commitment)

**Who it is for.** Mid-size robotics companies with ongoing test programmes, defence primes running evaluation phases, corporate R&D centres needing a consistent off-site test environment. Typical engagement: a company with a 12-month autonomous vehicle development programme that needs monthly access for structured trials.

**What is included.** All zones on any working day, a dedicated equipment bay within Zone A (lockable, with permanent power and data connections), 24/7 site access (key fob), full cluster access (all 9 nodes during booked windows), MEOK AI Labs safety observer on all active testing days, joint publication option (MEOK LABS co-authorship on test methodology papers), insurance coverage for the client's equipment on-site under MEOK's specialist robotics testing policy, and a named MEOK LABS technical contact for planning and integration support.

**Revenue model.** 1 Strategic Partner at £10,000/month for 12 months = £120,000 Year 1 target. One client at this tier transforms the facility's financial position.

---

### Tier 4 — Anchor Tenant: £50,000/year

**Who it is for.** A single large robotics company, defence prime, or government programme that wants a permanent physical presence at MEOK Estate. Comparable to a traditional science park tenant, but with the specific legal and compute infrastructure of MEOK.

**What is included.** A permanent dedicated space (partitioned section of Zone A and/or Zone B, agreed on case-by-case basis), unrestricted site access, full cluster priority access (defined SLA — maximum 2-hour wait for exclusive node allocation), vertical exclusivity (no other client in the same robotics sub-sector admitted during the tenancy term), a board advisory seat at MEOK LABS (non-voting, strategic), joint venture right of first negotiation on any spinout arising from work conducted at the site, and the MEOK AI Labs Certified Testing package included at cost (see below) for up to 2 certification events per year.

**Revenue model.** 1 Anchor Tenant = £50,000 Year 1. This is the institutional anchor that enables MEOK to make the capital investment case for Phase 2 infrastructure.

---

### Special Package — MEOK AI Labs Certified Testing: £25,000/event

**Who it is for.** Any robotics company needing a formal safety certification artefact — for a regulatory submission, an insurance underwriting, a procurement process, or a public sector tender that requires demonstrated third-party safety assessment.

**What it is.** A single integrated event: the client brings their system to MEOK Estate, runs a defined test protocol agreed in advance with MEOK AI Labs, and leaves with a signed MEOK AI Labs Certification Report. The report documents: the system under test, the test environment (MEOK Estate's legal and physical parameters), the test protocol, the results, and MEOK AI Labs's safety assessment conclusion. The report is signed by a MEOK AI Labs-accredited safety assessor and references MEOK Estate's HSE registration and CAA authorisation.

**Why this is uniquely valuable.** Currently, robotics companies seeking safety certification must engage a certification body, negotiate a test plan, find a test site (separately), run the tests (separately), and then submit test evidence to the certification body (separately). MEOK Estate collapses these steps: test and certification happen in the same location, on the same days, with the same people. This saves the client 2–4 months of coordination and eliminates the gap risk between what was tested and what was assessed.

**Revenue model.** 2 MEOK AI Labs Certified Testing events per year in Year 1 = £50,000. This is the highest-margin product in the portfolio — it sells certification, not just access.

---

## Part 5 — The "Geneva of Robotics" Positioning

### The Core Proposition

MEOK Estate is not a robotics company. It does not compete with its clients. It is a neutral, credentialed testing ground — the only location in the UK where a robotics company can arrive with an unproven autonomous system and leave with a legally defensible safety record, tested on real terrain, under real conditions, with sovereign compute, without regulatory exposure.

This neutrality is the positioning. The "Geneva of Robotics" framing captures it: a jurisdiction-within-a-jurisdiction, where the normal rules are deliberately and legally suspended so that innovation can happen without liability preventing it. Geneva is the city of neutral ground — diplomatic immunity, international law, the Red Cross. MEOK Estate is where UK robotics comes to test in peace.

### The Sponsor and Government Pitch

**ARIA (Advanced Research and Invention Agency).** ARIA funds high-risk, high-reward research infrastructure. MEOK Estate's combination of physical infrastructure, sovereign compute, and certification function maps directly to ARIA's "bold bets" mandate. The pitch: fund the permanent CAA restricted airspace designation, the Faraday cage room, and the standing Operational Authorisation. Return: a credentialed UK testing facility that would otherwise be funded by a defence prime with access restrictions.

**Dstl (Defence Science and Technology Laboratory).** Dstl regularly needs outdoor testing environments for autonomous systems that cannot be conducted at Porton Down or MoD-managed ranges for reasons of classification, scale, or operational tempo. MEOK Estate offers a non-MoD location with legal airspace and road exemptions, commercial flexibility, and MEOK AI Labs oversight — a combination that a Dstl programme manager can use without navigating MoD range booking bureaucracy.

**MoD Defence Equipment & Support (DE&S) Procurement.** Defence primes bidding on autonomous systems contracts under the MoD's DEF STAN frameworks increasingly need demonstrated third-party safety testing. A MEOK AI Labs certification issued at MEOK Estate, with the legal framework documented, is directly admissible as safety evidence in a DE&S procurement process. This creates a pull-through: primes need the certification to win contracts, MEOK Estate is where the certification happens.

**The neutral ground argument.** No single company owns MEOK Estate's certification infrastructure. Competitors can both test there. This is structurally important: a test facility owned by, say, Agribot Ltd would never be trusted by Agribot's competitors. MEOK LABS is independent. This independence is itself a product.

---

## Part 6 — 90-Day Setup Plan

### Weeks 1–2: Legal and Regulatory Filings

**Actions:**
- Instruct H&S consultant to begin Site Safety Case preparation (brief them with this document)
- Contact HSE local inspector for pre-registration advisory visit — book the earliest available slot
- Contact CAA UAS team: request information pack for Specific Category Operational Authorisation and enquire about the TRA (Temporary Reserved Area) process for the Estate's GPS polygon
- Execute Private Road Declaration deed (can be done by a solicitor in 1–2 weeks; cost approximately £500–£1,000)
- Submit TRA application to CAA for the first trial activation date (target: Week 6)
- Register the Estate with RIDDOR as an active research facility (online, free, 1 hour)

**Cost this period:** £2,000–£4,000 (legal/consultant fees)

---

### Weeks 2–4: Perimeter and Security Infrastructure

**Actions:**
- Obtain three quotes for 8-foot perimeter fencing (welded mesh or palisade) covering the full site boundary — specify hot-dip galvanised, minimum 10-year warranty
- Install motorised vehicle gate with keypad, fob reader, and CCTV coverage
- Install warning signs at all access points and at 50m intervals along perimeter
- Install emergency stop buttons within Zone A (4x wall-mounted, hardwired)
- Procure and install weather station (Zone C) — recommend Davis Vantage Pro 2 or equivalent; cost approximately £500–£800

**Estimated cost:** £8,000–£15,000 (perimeter fence dominates; 6.5 acres of perimeter is approximately 1,000–1,200 linear metres at £8–£12/m installed)

---

### Month 2: Energy, Connectivity, and Zone B Canopy

**Actions:**
- Commission solar array installation (5kW roof-mounted on Zone A) with 20kWh battery storage — obtain MCS-certified installer quotes; ensure DNO notification for grid connection
- Install Starlink dish and configure as WAN with automatic failover from existing broadband
- Procure and install Zone B canopy structure — steel frame, polycarbonate roof, roller shutter sides; obtain planning advice (permitted development for agricultural buildings; may not require full planning permission)
- Run armoured underground cable from Zone A to Zone B and Zone C junction boxes (three-phase, 100A)
- Install Faraday cage room within Zone A — can be achieved with off-the-shelf RF shielding panels; cost approximately £3,000–£6,000 for a basic 3m x 3m enclosure

**Estimated cost:** £15,000–£25,000 (solar + battery: £8–12k; canopy: £5–10k; cabling: £2–4k; Faraday room: £3–6k)

---

### Month 3: Marketing Launch and First Revenue

**Actions:**
- Launch facility website page and landing page (can be a subdomain of existing MEOK/MEOK AI Labs web presence; cost: minimal if done in-house)
- Publish a one-page facility overview PDF (this document is the basis — produce a designed, client-facing version)
- Contact five target clients directly: identify UK robotics SMEs currently without a test site (LinkedIn search: "robotics engineer" + "field testing" + UK; look at Innovate UK funded projects in autonomous systems)
- Submit facility details to the BRL's industry liaison team — position as complementary (indoor academic partnership with MEOK for outdoor testing)
- Attend one UK robotics event (RAS conference, DSEI if timing allows, or UKRobotics community events) and present the facility concept
- Book first Day Pass client (target: pay-what-you-can beta rate of £250 for first three clients to generate testimonials and test the booking process)

**Estimated cost:** £1,000–£3,000 (travel, materials, website)

---

### Cumulative 90-Day Capital Requirement

| Phase | Low Estimate | High Estimate |
|---|---|---|
| Legal/Regulatory (Weeks 1–2) | £2,000 | £4,000 |
| Perimeter/Security (Weeks 2–4) | £8,000 | £15,000 |
| Energy/Connectivity/Zone B (Month 2) | £15,000 | £25,000 |
| Marketing/Launch (Month 3) | £1,000 | £3,000 |
| **Total** | **£26,000** | **£47,000** |

The lower end of this range (£26,000) is achievable if the perimeter fence is phased (high-risk boundary sections first) and the solar installation is deferred to Month 3. The H&S consultant, CAA OA process, and Private Road Declaration are non-negotiable and must be funded first.

---

## Part 7 — Revenue Projections: Year 1

### Conservative Case

| Product | Volume | Unit Price | Total |
|---|---|---|---|
| Day Pass | 50 days | £500 | £25,000 |
| Research Partner | 10 days | £2,000 | £20,000 |
| Strategic Partner | 1 client x 6 months | £10,000/month | £60,000 |
| Anchor Tenant | 0 (Year 1 pipeline only) | — | £0 |
| MEOK AI Labs Certified Testing | 2 events | £25,000 | £50,000 |
| **Total Revenue** | | | **£155,000** |

### Base Case

| Product | Volume | Unit Price | Total |
|---|---|---|---|
| Day Pass | 50 days | £500 | £25,000 |
| Research Partner | 10 days | £2,000 | £20,000 |
| Strategic Partner | 1 client x 12 months | £10,000/month | £120,000 |
| Anchor Tenant | 1 client | £50,000/year | £50,000 |
| MEOK AI Labs Certified Testing | 2 events | £25,000 | £50,000 |
| **Total Revenue** | | | **£265,000** |

### Notes on the Projections

The Day Pass target of 50 bookings (approximately 1 per week) is achievable once the facility is visible in the UK robotics community — it requires only that the facility exists, is legal, and is findable. The Research Partner figure of 10 days is deliberately conservative; a single university group running a quarterly test programme accounts for 4 of those days alone.

The transformational line is the MEOK AI Labs Certified Testing package. Two events at £25,000 each generate £50,000 and require no incremental capital — only the regulatory framework (already being built) and a MEOK AI Labs-accredited assessor (already exists). This should be treated as the Year 1 priority product for active sales.

Year 2 upside: 1 Anchor Tenant + 2 Strategic Partners + 100 Day Passes = £290,000 from recurring revenue alone, before certification events. The facility's operating cost at steady state (H&S retainer, insurance, utilities, maintenance) is estimated at £30,000–£50,000 per year — strong margin territory from Year 2.

---

## Appendix — Key Contacts and Next Actions

| Action | Owner | Deadline | Status |
|---|---|---|---|
| Instruct H&S consultant | Nick | Week 1 | Not started |
| HSE pre-registration advisory visit | Nick / H&S consultant | Week 2 | Not started |
| CAA UAS team contact — OA information | Nick | Week 1 | Not started |
| TRA application submission | Nick / CAA consultant | Week 3 | Not started |
| Private Road Declaration — solicitor instruction | Nick | Week 2 | Not started |
| Perimeter fence quotes (x3) | Nick | Week 3 | Not started |
| SORA consultant engagement | Nick | Month 2 | Not started |
| Solar installer quotes | Nick | Month 2 | Not started |
| First client outreach (x5 targets) | Nick | Month 3 | Not started |
| Facility landing page live | Nick | Month 3 | Not started |

---

*Document prepared by MEOK LABS Ltd. All legal references are to UK law as in force April 2026. This document is not legal advice. Specific regulatory applications should be supported by qualified legal counsel and specialist consultants in the relevant field.*

*Version history: v1.0 — April 2026 (initial draft)*
