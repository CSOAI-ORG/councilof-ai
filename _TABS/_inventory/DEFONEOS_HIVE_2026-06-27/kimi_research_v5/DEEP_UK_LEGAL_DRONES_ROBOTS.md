# OPERATION DEEP EXECUTE: UK Legal Framework for Drone & Robot Manufacturing
## Comprehensive Legal Guide for MEOK Labs (Lincolnshire, UK)

**Prepared by:** Specialist UK Legal Researcher  
**Date:** July 2026  
**Classification:** OPEN SOURCE LEGAL INTELLIGENCE  
**Status:** FOR OPERATIONAL PLANNING PURPOSES ONLY — NOT LEGAL ADVICE

---

# EXECUTIVE SUMMARY: GREEN LIGHT, AMBER LIGHT, RED LIGHT

| Activity | Status | Key Requirement |
|----------|--------|-----------------|
| Build sub-250g drones for recreation/research | GREEN | No license needed; Flyer ID if 100g+ with camera |
| Build sub-25kg drones for research/testing | GREEN | Open Category A3 or Specific Category PDRA01 |
| Modify open-source robots for personal use | GREEN | No license; comply with original license terms |
| Build passive counter-drone DETECTION systems | GREEN | No license; may need data protection compliance |
| Develop EW software/simulations (no hardware TX) | GREEN | No license for pure software development |
| Build autonomous navigation systems | GREEN | CAA rules apply if airborne; no weapons ban yet |
| Build sub-25kg drones for commercial sale | AMBER | Need CAA Operational Authorisation (PDRA01) |
| Sell drones to UK MOD | AMBER | No manufacturing license; need Cyber Essentials + JOSCAR |
| Export to NATO allies | AMBER | Export license likely required (ML10 controlled) |
| Build counter-drone JAMMING systems | RED | Criminal offence under Wireless Telegraphy Act 2006 |
| Build autonomous TARGETING/WEAPON systems | RED | UK policy against LAWS; IHL violations possible |
| Operate RF jamming equipment | RED | Up to 2 years imprisonment + unlimited fine |
| Export military UAVs without license | RED | Up to 10 years imprisonment |

---

# PART 1: UK DRONE MANUFACTURING LAW

## 1.1 The Regulatory Framework

UK drone law is governed by a retained EU law framework, now domesticated:

| Regulation | Status | Purpose |
|------------|--------|---------|
| **UK Regulation (EU) 2019/947** (as retained & amended) | ACTIVE | Rules for operation of unmanned aircraft |
| **UK Regulation (EU) 2019/945** (as retained & amended) | ACTIVE | Product safety and market requirements for UAS |
| **Air Navigation Order 2016** | ACTIVE | General aviation law including endangerment offences |
| **Product Safety of UAS Regulations 2024** | ACTIVE | Post-Brexit UK product safety framework |
| **Civil Aviation Act 1982** | ACTIVE | CAA powers and duties |

**Key citation:** *UK Regulation (EU) 2019/947* as retained under the European Union (Withdrawal) Act 2018, and amended by the Department for Transport.

---

## 1.2 Weight Classes and What You Can Build

### Open Category — NO CAA Operational Authorisation Required

| Class | Weight Limit | Sub-Category | What You Can Do |
|-------|-------------|--------------|-----------------|
| **UK0 / C0** | < 250g | A1 (Over People) | Fly over uninvolved people; no Flyer ID if <100g and no camera |
| **UK1 / C1** | < 900g | A1 (Over People) | Fly over uninvolved people; Flyer ID + Operator ID required |
| **UK2 / C2** | < 4kg | A2 (Near People) | 30m from uninvolved people (5m in low-speed mode); needs A2 CofC |
| **UK3 / C3** | < 25kg | A3 (Far from People) | 50m from uninvolved people, 150m from built-up areas |
| **UK4 / C4** | < 25kg (no automation) | A3 (Far from People) | Model aircraft style; only basic stabilization |

**Key rules for builders:**
- **Sub-250g drones:** You can build and fly without any CAA approval as long as you stay in A1 sub-category (over people). If 100g+ with camera: need Flyer ID + Operator ID.
- **Sub-25kg drones:** You can build and fly in A3 (far from people) WITHOUT a class mark if privately built and <25kg. [^1558^]
- **Registration threshold:** From 1 January 2026, Flyer ID required for 100g+, Operator ID for 250g+ (or 100g+ with camera). [^1557^][^1558^]

### Specific Category — CAA Operational Authorisation REQUIRED

| Class | Weight Limit | Requirement |
|-------|-------------|-------------|
| **UK5 / C5** | < 25kg | Needs Operational Authorisation (PDRA01 or UK SORA) |
| **UK6 / C6** | < 25kg, <3m max dimension | Needs Operational Authorisation (PDRA01 or UK SORA) |

### Certified Category — Full Aviation Certification
- Operations >25kg
- Operations carrying people
- Operations above FL660
- Urban air mobility

---

## 1.3 Privately Built / Custom-Built Drones — The Builder's Exemption

**CRITICAL FOR MEOK LABS:**

> **"A drone or model aircraft that is privately built and is less than 25kg" can be flown in the Open Category A3 (Far from People) WITHOUT any class marking and WITHOUT a CAA Operational Authorisation.** [^1558^]

This means:
- You CAN build custom drones up to 25kg at your workshop in Lincolnshire
- You CAN fly them for testing/research in A3 (far from people, 150m from built-up areas)
- You do NOT need manufacturer certification or class marking for research/testing
- You CANNOT sell them without meeting UK Regulation (EU) 2019/945 product safety requirements

### Transition Period
- Until **31 December 2027**, EU C-class drones are treated as equivalent UK-class drones
- From **1 January 2026**, all NEW drones placed on the UK market must bear UK class marks (UK0-UK6)
- Legacy drones (placed on market before 1 Jan 2026) can continue to be used under weight-based rules

---

## 1.4 PDRA01 — The Commercial Operator's Route

**PDRA01 (Pre-Defined Risk Assessment 01)** is the only currently available PDRA. [^1553^]

**What it covers:**
- Drones between 250g and 25kg
- Visual Line of Sight (VLOS) only
- Any UK location (subject to airspace)
- Residential, commercial, industrial, and recreational areas
- Day and night operations

**Requirements:**
- RPC-L1 Part A qualification (or GVC until 31 Dec 2027)
- Operations Manual
- CAA application (GBP 524/year, no VAT)
- Insurance (EUR 1M minimum for commercial operations)

**What PDRA01 does NOT allow:**
- BVLOS (Beyond Visual Line of Sight)
- Dropping items
- Flying close to crowds
- Flying close to people with drones >500g
- Operations above 120m

---

## 1.5 UK SORA — For Complex Operations

**UK SORA (Specific Operations Risk Assessment)** went live **23 April 2025**. [^1672^][^1675^]

**When you need it:**
- BVLOS operations
- Dropping items from drones
- Flying close to crowds
- Flying >120m altitude
- Swarm operations
- Drone-in-a-box autonomous operations
- Operations with aircraft >40m largest dimension

**Process:**
- Two-phase digital application via DiSCO platform
- Calculate SAIL (Specific Assurance and Integrity Level) rating I-VI
- Submit operational volume, ground risk buffer, containment evidence
- Upload evidence for required Operational Safety Objectives (OSOs)

---

## 1.6 Product Safety for Manufacturers (UK Regulation 2019/945)

If MEOK Labs wants to **sell drones**, not just build them for research:

**Requirement:** Must comply with UK Regulation (EU) 2019/945 as retained and amended.

**Key requirements for placing on market:**
- UKCA marking required (from 1 Jan 2026)
- Must meet designated standards for applicable UK class
- Must have: remote ID capability, geo-awareness, safe design, user manual
- Must register as manufacturer with market surveillance authority

**For privately built (not for sale):** Product safety regulations do not apply. [^1674^]

---

# PART 2: DEFENSE MANUFACTURING LAW

## 2.1 Do You Need a License to Sell Drones to UK MOD?

**SHORT ANSWER: NO specific manufacturing license is required.**

There is no "defense manufacturing license" in UK law. However:

### To Sell to MOD, you need:

| Requirement | Status | Details |
|-------------|--------|---------|
| **Cyber Essentials** | MANDATORY | Required for all MOD contracts handling information |
| **JOSCAR Registration** | STRONGLY RECOMMENDED | Joint Supply Chain Accreditation Register — used by all major primes |
| **ISO 9001** | EXPECTED | Quality management standard |
| **Defence Sourcing Portal** | REQUIRED | Register to bid on contracts |
| **Security Clearance** | PROJECT-DEPENDENT | SC or DV for classified work |

**Key sources:** [^1629^][^1632^][^1633^]

### MOD Procurement Routes for SMEs

| Route | Description |
|-------|-------------|
| **Defence Sourcing Portal (DSP)** | Main tender platform for MOD contracts |
| **DASA** | Defence and Security Accelerator — innovation funding |
| **Dstl R-Cloud** | R&D contracts for defence science |
| **DTEP** | Defence Technology Exploitation Programme |
| **FCG Frameworks** | Future Capability Group for early-stage tech |
| **Direct Commercial Sale** | Possible for non-complex items under JSP 655 |

### Standard Transfer Instrument (STI)

An **STI** is used for transfers of military goods between UK government departments and for exports under government auspices. For a commercial sale to MOD, the MOD will issue an STI for the transfer. The contractor does not need to apply for it — the MOD handles this. [^1634^]

---

## 2.2 Export Controls — When Drones Become Controlled Items

### The Critical Threshold

A drone becomes a **controlled item** when it is:

1. **"Specially designed or modified for military use" (SDOMFMU)** — Export Control Order 2008, Schedule 2
2. Listed in the **UK Military List** or **Dual-Use List**
3. Intended for a **military end-use** in an embargoed country
4. Incorporating controlled components (e.g., ITAR-controlled US parts)

### ML10 — The UAV Control Entry

From the **Export Control Order 2008, Schedule 2, ML10** [^1685^][^1636^]:

> **ML10.c.:** "Unmanned 'aircraft' and related equipment, as follows, and specially designed components therefor:
> - 1. 'UAVs', Remotely Piloted Air Vehicles (RPVs), **autonomous programmable vehicles** and unmanned 'lighter-than-air vehicles';
> - 2. Launchers, recovery equipment and ground support equipment;
> - 3. Equipment designed for command or control;"

**THIS COVERS:** All military UAVs, including autonomous drones.

### ML17 — Military Robots

> **ML17.e:** "'Robots', 'robot' controllers and 'robot' 'end-effectors', meeting any of the following descriptions:
> - 1. Specially designed for military use;
> - 2. Incorporating means of protecting hydraulic lines against externally induced punctures caused by ballistic fragments;
> - 3. Specially designed or rated for operating in an electromagnetic pulse (EMP) environment"

### Category 6 — Sensors and Lasers (Dual-Use)

Controls "sensors and lasers" with military application. A drone with advanced targeting sensors may trigger this.

### Category 9 — Aerospace and Propulsion (Dual-Use)

Controls "space and aerospace technology" including certain UAV components.

---

## 2.3 Export Licensing — The ECJU Process

**Export Control Joint Unit (ECJU)** — part of Department for Business and Trade [^1682^]

### Types of Licenses

| License Type | What It Covers | Validity |
|-------------|----------------|----------|
| **OGEL** (Open General) | Pre-determined items to specified destinations | 5 years; register once |
| **SIEL** (Standard Individual) | Specific quantity to specific end-user | 2 years |
| **OIEL** (Open Individual) | Multiple shipments to specified destinations/users | 5 years |
| **AUKUS OGL** | Defense trade between AUKUS partners | From 1 Sept 2024 |

### Applying for a SIEL

1. Register on SPIRE or LITE (new digital system, launched Sept 2024)
2. Submit technical specifications
3. Provide End-User Undertaking (EUU)
4. ECJU assessment: ~20 working days
5. 2024 stats: 15,464 SIEL applications processed; 60% completed within 20 working days [^1688^]

### Penalties for Unlicensed Export

- **Up to 10 years imprisonment** (Export Control Act 2002)
- **Unlimited fine**
- Confiscation of goods
- Debarment from future exports

---

## 2.4 Wassenaar Arrangement

The UK implements **Wassenaar Arrangement** controls through its Strategic Export Control Lists. [^1631^][^1637^]

**What it covers:** All conventional military items and most dual-use items.

**Implication for MEOK Labs:** Any drone or robot that meets military technical specifications will be caught by Wassenaar-mandated controls, regardless of destination.

---

## 2.5 ITAR (US International Traffic in Arms Regulations)

**ITAR applies to UK companies if:**
- They use US-origin defense articles (including US drone components)
- They receive US technical data
- They have US persons working on controlled projects

**Key restrictions for UK companies:** [^1552^]

| Aspect | Requirement |
|--------|-------------|
| US components in UK-built drones | May trigger ITAR if components are ITAR-controlled |
| Technical data from US | Requires license under ITAR |
| Exports using US tech | Need both UK AND US authorization |
| AUKUS exemption (Aug 2024) | New OGLs reduce but do not eliminate ITAR requirements |

**AUKUS Pillar II Breakthrough (August 2024):** [^1630^][^1679^]
- UK issued new Open General Licence for AUKUS nations, effective 1 September 2024
- US removed list-based license requirements for UK/Australia
- "600 series" munitions items can now be exported NLR (No License Required) between AUKUS partners
- Remaining controls: firearms, WMD-related items, certain end-use/end-user restrictions

**Bottom line:** Using US components still creates ITAR obligations, but AUKUS has significantly streamlined trade between AUKUS partners.

---

# PART 3: ELECTRONIC WARFARE & COUNTER-DRONE LAW

## 3.1 The Core Legal Prohibition

**RF JAMMING IS A CRIMINAL OFFENCE IN THE UK.**

### Wireless Telegraphy Act 2006

> **Section 68:** "It is an offence to install or use any apparatus for the purpose of interfering with any wireless telegraphy."

> **Section 8(1):** "It is unlawful to establish or use a wireless telegraphy station, or to install or use wireless telegraphy apparatus, except under and in accordance with a licence granted under this section by Ofcom."

### Penalties
- **Up to 2 years imprisonment** and/or **unlimited fine** [^1551^][^1554^]
- Equipment forfeiture
- Additional charges possible: endangering aircraft (5 years under Air Navigation Order 2016)

### Current Legal Framework Summary [^1556^]

| Activity | Legal Status |
|----------|-------------|
| Use of RF jammer | CRIMINAL OFFENCE — s.68 WTA 2006 |
| Supply of non-compliant jamming equipment | OFFENCE — EMC Regulations 2016 |
| Possession of jammer | Currently NOT a standalone offence (law may change) |
| Deliberate interference with wireless | OFFENCE — s.116 WTA 2006 |

### Who CAN Lawfully Use Counter-Drone Jammers?

Only a narrow set of authorised bodies: [^1551^][^1560^]
- Police (with operational approval)
- Ministry of Defence (Crown exemption)
- Certain prison service deployments
- Contracted security at critical national infrastructure (airports, power stations) — under specific authorisation

**Private companies and individuals CANNOT lawfully operate RF jammers in the UK.**

---

## 3.2 What Counter-Drone Activities ARE Legal

### PASSIVE Detection Systems — LEGAL

| Technology | Legal Status | Notes |
|------------|-----------|-------|
| **RF Detection** (listening for drone signals) | LEGAL | No transmission; passive only |
| **Acoustic Detection** | LEGAL | No RF transmission |
| **Radar Detection** | LEGAL | May need license for radar transmitter |
| **Optical/IR Cameras** | LEGAL | Data protection/GDPR compliance needed |
| **Network Remote ID** | LEGAL | Listening to drone's broadcast ID |

### Physical Countermeasures — VARIED

| Technology | Legal Status | Notes |
|------------|-----------|-------|
| **Net-based capture** | AMBER | May constitute interference with aircraft (ANO 2016) |
| **Hunter/killer drones with nets** | AMBER | Legal for authorised entities only |
| **Directed energy/laser** | RED for private use | Only military/police authorised |
| **Trained birds of prey** | AMBER | Unregulated but impractical |
| **GPS spoofing** | RED | Unlawful interference under WTA 2006 |

**Key source:** ADS Counter-Drone Policy Paper [^1560^]

> "It is currently illegal to interfere with a flying aircraft in the UK, as per the Air Navigation Order 2016, and drones are counted as such. Also, it is illegal to jam commercial RF bands and GPS under the Wireless Telegraphy Act without a licence."

---

## 3.3 Can You Develop EW Tools for Research?

### Software Development — LEGAL

**Developing EW software/simulations in a lab environment:**
- No license required for software development
- No restrictions on research into jamming algorithms
- Can develop and test in RF-shielded environments (anechoic chamber, Faraday cage)
- Can publish research (subject to export controls on technical data)

### Hardware Development — RESTRICTED

| Activity | Legal Status |
|----------|-------------|
| Design jamming circuits on paper/computer | LEGAL |
| Build jamming hardware in lab (not powered) | LEGAL |
| Test jamming hardware (even once) | ILLEGAL without Ofcom license |
| Manufacture jamming equipment for sale | ILLEGAL for general market |
| Manufacture for export (military) | May be legal with export licenses |

### The Investigatory Powers Act 2016

If a counter-drone system involves **intercepting communications**, this may also engage:
- **Investigatory Powers Act 2016** — requires warrant for interception
- **UK GDPR / Data Protection Act 2018** — if personal data is collected

---

# PART 4: AUTONOMOUS SYSTEMS LAW

## 4.1 UK Position on Lethal Autonomous Weapons Systems (LAWS)

**Official UK Government Position:** [^1639^][^1691^]

> "The UK does not possess LAWS, and the operation of its weapons will always be under human control as an absolute guarantee. The UK does not plan to develop LAWS and remains committed to maintaining human oversight and control over the use of force."

**However:** The UK has NOT supported a binding treaty ban on LAWS. The position is that existing International Humanitarian Law (IHL) is sufficient.

---

## 4.2 The Five Ethical Principles for AI in Defence (MOD)

All AI-enabled defense systems must comply with these principles: [^1687^][^1691^]

1. **Human-Centricity** — Impact on humans must be assessed across the entire lifecycle
2. **Responsibility** — Clear human accountability for AI systems and their outcomes
3. **Understanding** — AI systems and outputs must be understood by relevant individuals
4. **Bias and Harm Mitigation** — Proactive mitigation of unexpected biases or harms
5. **Reliability** — Systems must be demonstrably safe, reliable, robust, and secure

---

## 4.3 What Can You Legally Build?

### LEGAL Autonomous Capabilities:

| Capability | Legal Status | Notes |
|-----------|-----------|-------|
| **Autonomous navigation** | LEGAL | GPS waypoint navigation, obstacle avoidance |
| **Autonomous takeoff/landing** | LEGAL | Widely available in commercial drones |
| **Autonomous patrolling** | LEGAL | Drone-in-a-box systems with CAA approval |
| **Swarm coordination** | LEGAL | Requires UK SORA authorisation |
| **Sensor fusion / object detection** | LEGAL | Computer vision for identification |
| **Target DETECTION assistance** | LEGAL | Highlighting potential targets for human review |

### ILLEGAL / PROHIBITED Capabilities:

| Capability | Legal Status | Why |
|-----------|-----------|-----|
| **Autonomous target ENGAGEMENT** | PROHIBITED | Violates "meaningful human control" requirement |
| **Autonomous weapon firing** | PROHIBITED | UK policy against LAWS |
| **Autonomous lethal decision-making** | PROHIBITED | IHL requires human judgment |
| **AI that selects and attacks targets without human approval** | PROHIBITED | Violates distinction, proportionality, precaution principles of IHL |

### THE GRAY AREA:

| Capability | Status | Assessment |
|-----------|--------|------------|
| **"Man-on-the-loop" systems** (human can override) | AMBER — likely legal | Human retains veto power |
| **"Man-out-of-the-loop" systems** (no real-time human control) | LIKELY ILLEGAL for lethal | May be legal for non-lethal ISR |
| **Autonomous targeting with human confirmation required** | AMBER — probably legal | Human makes final firing decision |
| **Automated defensive systems (e.g., C-RAM)** | SPECIAL CASE | Military-only; requires authorisation |

---

## 4.4 The Line Between Legal and Illegal Autonomy

**Legal:** "The human identifies the target, the system calculates firing solution, the human confirms and authorizes engagement."

**Illegal:** "The system identifies, selects, and engages targets without meaningful human intervention."

**Key test:** Is there a human in the decision-making loop who can understand, question, and veto the system's recommendation?

---

# PART 5: MANUFACTURING FOR EXPORT

## 5.1 Selling to NATO Allies — What Licenses?

### NATO Countries (for military goods)

| Destination | License Required | Notes |
|-------------|-----------------|-------|
| **United States** | YES — SIEL or OGEL | ML10 items need license; AUKUS streamlines |
| **Australia** | YES — but streamlined | AUKUS OGL from Sept 2024 |
| **Canada** | YES — SIEL or OGEL | Five Eyes; generally approved |
| **Other NATO (Germany, France, etc.)** | YES — SIEL or OGEL | Case-by-case assessment |

### OGELs That May Apply

| OGEL | Coverage |
|------|----------|
| **OGEL (Military Goods)** | Exports to specific destinations; check current list |
| **OGEL (Export of Dual-use items to EU)** | For dual-use items to EU |
| **AUKUS OGL** | Defense trade between AUKUS partners |
| **OGEL (Trade and Cooperation)** | Some defense-related items |

**OGEL Checker:** Available on GOV.UK to determine if an OGEL covers your export. [^1686^]

---

## 5.2 EU Defense Procurement Post-Brexit

**Status:** The UK is no longer part of the EU Defense Procurement Directive.

**What this means:**
- UK companies CAN bid on EU defense contracts through national procurement portals
- No automatic right of access to EU defense procurement
- May face preference for EU-based suppliers
- Individual EU member states may have bilateral arrangements

---

## 5.3 AUKUS Pillar II — Technology Sharing

**Effective 1 September 2024:** [^1630^][^1679^]

- UK issued Open General Licence for AUKUS nations
- Significant liberalization of export controls between AUKUS partners
- "600 series" munitions items: no license required
- Sensitive/Very Sensitive List items: can be exported NLR
- UK and Australian airlines: can receive missile technology-controlled spare parts
- Remaining restrictions: firearms, WMD-related items, certain end-use controls

**For MEOK Labs:** If building drones with AUKUS partners (US or Australia), technology transfer is significantly easier than before. Still need to check specific items against remaining controls.

---

## 5.4 Five Eyes Intelligence Sharing

The UK is part of **Five Eyes** (UK, US, Canada, Australia, New Zealand).

**Implications for AI exports:**
- Intelligence-sharing does NOT automatically grant export license exemptions
- Export controls still apply
- End-use assurances required
- Technology transfer easier to Five Eyes partners than other destinations

---

## 5.5 Non-NATO Countries

| Category | Examples | Licensing |
|----------|----------|-----------|
| **EU/EEA** | Switzerland, Norway | SIEL/OGEL; dual-use simplified |
| **Strategic Partners** | Japan, South Korea | SIEL required; generally approved |
| **Sensitive** | India, UAE, Saudi Arabia | Case-by-case; may be refused |
| **Embargoed** | Russia, China, Iran, North Korea | PROHIBITED (sanctions) |

---

# PART 6: INTELLECTUAL PROPERTY

## 6.1 Open-Source Hardware Licenses

### CERN Open Hardware Licence (OHL) [^1680^]

| Variant | Commercial Use | Patent Grant | Defense Use |
|---------|---------------|-------------|-------------|
| **CERN OHL-S** (Strongly Reciprocal) | YES | YES | YES — no restriction |
| **CERN OHL-W** (Weakly Reciprocal) | YES | YES | YES — no restriction |
| **CERN OHL-P** (Permissive) | YES | YES | YES — no restriction |

**Key point:** CERN OHL licenses do NOT prohibit defense use. They are all "defense-friendly."

### TAPR Open Hardware License

- Similar to CERN OHL
- Permits commercial use
- No restriction on defense applications
- Requires sharing modifications under same license

### What These Licenses Require:

1. **Source disclosure** — Share complete source of licensed works and modifications
2. **Same license** — Modifications must be under same license (reciprocal)
3. **Patent grant** — Contributors grant patent rights to users
4. **No warranty/liability** — Standard disclaimer

### Can You Modify and Sell?

**YES — if:**
- You comply with the license terms (disclose source, same license for modifications)
- You do not incorporate third-party proprietary IP without permission
- Your modifications do not infringe existing patents

---

## 6.2 UK Patent Law for Defense Inventions

### Standard Patent Protection
- Apply through UK IPO (Intellectual Property Office)
- 20-year term from filing
- Standard examination process

### Crown Use Provisions (Patents Act 1977, s.55) [^1703^][^1704^][^1706^]

> **Section 55(1):** "Any government department and any person authorised in writing by a government department may, for the services of the Crown... do any of the following acts in the United Kingdom in relation to a patented invention without the consent of the proprietor of the patent."

**What this means:**
- The Crown can use your patented invention for defense purposes
- You ARE entitled to compensation (negotiated or court-determined)
- The Crown must notify you of the use (unless contrary to public interest)
- "Services of the Crown" includes "supply of anything for foreign defence purposes"

**For MEOK Labs:**
- Patent your innovations
- Crown use does not mean you lose your patent — you get paid
- Focus on filing before disclosure or sale

### Defense-Related Patent Secrecy

Under **Section 22 of the Patents Act 1977**, the government can impose secrecy directions on patent applications where publication might be prejudicial to national security or public safety. If your drone/robot invention has national security implications, be prepared for potential secrecy orders.

---

# PART 7: THE GREEN LIGHT LIST — What MEOK Labs Can Do RIGHT NOW

## 7.1 NO LICENSE REQUIRED (Start Immediately)

| # | Activity | Legal Basis |
|---|----------|-------------|
| 1 | **Build sub-250g drones** for personal/research use | Open Category A1; no CAA OA needed |
| 2 | **Build sub-25kg custom drones** for research/testing | Open Category A3 "privately built" exemption |
| 3 | **Modify open-source robots** for personal/educational use | OHL licenses permit modification |
| 4 | **Develop passive counter-drone detection software** | No licensing regime for software development |
| 5 | **Develop EW algorithms/simulations** in RF-shielded environment | No prohibition on theoretical/software development |
| 6 | **Build autonomous navigation systems** (non-weapon) | No prohibition; CAA rules only for flight |
| 7 | **Research and design** any UAS/robot technology | No restriction on R&D activities |
| 8 | **Publish open-source designs** (non-controlled tech) | Academic freedom; check export controls on technical data |
| 9 | **Develop targeting assistance software** (human-in-the-loop) | Not prohibited; IHL-compliant if human confirms |
| 10 | **Register as MOD supplier** on Defence Sourcing Portal | Free; no license required |
| 11 | **Apply for Cyber Essentials** | Administrative; not a license |
| 12 | **Register for JOSCAR** | Stage 1 free; improves visibility to primes |
| 13 | **Build ground robots** (not for public roads) | No specific licensing regime for UGVs on private land |
| 14 | **Develop drone-in-a-box systems** (ground testing) | No license needed until flight operations |
| 15 | **Train on CAA qualifications** (A2 CofC, RPC-L1) | Open to anyone |

## 7.2 LICENSE REQUIRED (Before Commercial Activity)

| # | Activity | License/Approval Required |
|---|----------|--------------------------|
| 1 | **Fly commercially in built-up areas** | CAA PDRA01 Operational Authorisation |
| 2 | **Fly BVLOS** | CAA UK SORA Operational Authorisation |
| 3 | **Sell drones on UK market** | UKCA marking; comply with UK Reg 2019/945 |
| 4 | **Export drones with military capability** | SIEL from ECJU (Export Control Order 2008) |
| 5 | **Export drones incorporating US components** | UK export license + potential ITAR authorization |
| 6 | **Use US-origin technical data** | ITAR license from US DDTC |
| 7 | **Handle MOD classified information** | Security Clearance (SC or DV) |
| 8 | **Export to non-NATO/non-AUKUS countries** | SIEL + End-User Undertaking |
| 9 | **Transfer dual-use technology** | May need license under Export Control Order 2008 |
| 10 | **Operate on public roads** (UGVs) | DVLA type approval; MOT; insurance; may not be possible |

## 7.3 PROHIBITED / CRIMINAL (Do Not Do)

| # | Activity | Offence | Penalty |
|---|----------|---------|---------|
| 1 | **Use RF jamming equipment** | Wireless Telegraphy Act 2006, s.68 | Up to 2 years + unlimited fine |
| 2 | **Build/sell jamming equipment for civilian use** | EMC Regulations 2016 | Fine + confiscation |
| 3 | **Export military drones without license** | Export Control Act 2002 | Up to 10 years + unlimited fine |
| 4 | **Build autonomous lethal weapons** | No specific statute, but violation of IHL; UK policy | Potential war crimes liability |
| 5 | **Interfere with aircraft in flight** (including drones) | Air Navigation Order 2016 | Up to 5 years imprisonment |
| 6 | **Export to embargoed countries** (Russia, China, Iran, DPRK) | Trade sanctions regulations | Up to 10 years + unlimited fine |
| 7 | **Transfer controlled technology without license** | Export Control Order 2008 | Criminal prosecution |

---

# PART 8: THE GRAY AREAS

## 8.1 Autonomous Targeting Assistance

**Scenario:** A system that uses AI to detect, track, and highlight targets, but a human makes the final firing decision.

**Assessment:** LIKELY LEGAL under current UK law, provided:
- Human has meaningful control over the decision to engage
- System is understood by operators
- Bias and harm have been mitigated
- System is reliable and tested

**Risk:** Changes in international law could make this more restricted.

## 8.2 Counter-Drone Detection as a Service

**Scenario:** MEOK Labs sells/rents drone detection systems to private venues.

**Assessment:** LEGAL if:
- System is purely passive (receives only, does not transmit)
- Complies with UK GDPR for any personal data collection
- Does not intercept communications (Investigatory Powers Act 2016)

## 8.3 Dual-Use Drone Technology

**Scenario:** Building a drone that could be used for both civilian surveying and military reconnaissance.

**Assessment:** The **intended end-use** and **end-user** determine licensing. If designed for civilian use but with potential military application:
- Civilian sale: May not need license (unless components are controlled)
- Military sale: Will need export license
- The "specially designed or modified for military use" test (SDOMFMU) determines ML10 applicability

## 8.4 Open-Source Defense Robots

**Scenario:** Taking an open-source humanoid robot design, modifying it for defense logistics, and selling it.

**Assessment:**
- Complying with OHL license: YES, legal
- Selling to UK MOD: YES, legal (register as supplier)
- Exporting: DEPENDS on destination and end-use — may need SIEL
- If robot is "specially designed for military use": Falls under ML17

## 8.5 UGVs (Unmanned Ground Vehicles)

**Scenario:** Building autonomous ground vehicles for defense logistics.

**Assessment:**
- **Private land operation:** No specific licensing regime
- **Public road operation:** Would need DVLA type approval, insurance, likely impossible for autonomous military vehicles
- **Sale to MOD:** Register as defense supplier
- **Export:** May fall under ML6 (ground vehicles) if military-spec

---

# PART 9: STEP-BY-STEP ACTION PLAN FOR MEOK LABS

## Phase 1: Immediate (No Cost, No License)

| Week | Action | Purpose |
|------|--------|---------|
| 1 | Register for CAA Flyer ID (free) | Legal requirement to fly 100g+ drones |
| 1 | Register for CAA Operator ID (GBP 12.34/year) | Legal requirement for 250g+ drones |
| 1 | Register on Defence Sourcing Portal (free) | Access MOD tender opportunities |
| 2 | Apply for Cyber Essentials (GBP 300-600) | Mandatory for MOD contracts |
| 2 | Register on JOSCAR Stage 1 (free) | Visibility to defense primes |
| 2-4 | Build and test sub-25kg drones on private land in A3 | Research and development |
| 2-4 | Set up RF-shielded test environment | Safe EW research |

## Phase 2: Short-Term (1-3 Months)

| Action | Cost | Purpose |
|--------|------|---------|
| Obtain A2 Certificate of Competency | ~GBP 100-200 | Fly near people commercially |
| Obtain RPC-L1 Part A | ~GBP 800-1,500 | Specific Category operations |
| Apply for PDRA01 Operational Authorisation | GBP 524/year | Commercial operations in built-up areas |
| ISO 9001 certification | GBP 2,000-5,000 | Quality management for defense |
| Develop passive counter-drone detection prototype | R&D cost | Product development |

## Phase 3: Medium-Term (3-12 Months)

| Action | Cost | Purpose |
|--------|------|---------|
| Apply for UK SORA (BVLOS) | Variable | Beyond visual line of sight operations |
| Apply for SIEL (if exporting) | Free application | Export controlled goods |
| Patent key innovations | GBP 300-4,000+ | IP protection |
| Engage with DASA for innovation funding | Free application | R&D funding |
| Pursue MOD contracts via DSP | Free | Revenue generation |

## Phase 4: Long-Term (1-2 Years)

| Action | Purpose |
|--------|---------|
| Security Clearance (SC) for key personnel | Access classified contracts |
| UKCA marking for drone products | Consumer/commercial sales |
| ITAR compliance program (if using US components) | Access US technology |
| AUKUS partnership engagement | Trilateral defense opportunities |

---

# PART 10: KEY LEGAL CITATIONS REFERENCE

## UK Legislation

| Citation | Full Title | Relevance |
|----------|-----------|-----------|
| **UK Reg (EU) 2019/947** (retained) | Rules for operation of unmanned aircraft | All drone operations |
| **UK Reg (EU) 2019/945** (retained) | UAS and third-country operators | Product safety, market placement |
| **Wireless Telegraphy Act 2006** | Regulation of radio communications | RF jamming prohibition |
| **Export Control Act 2002** | Power to control exports | Export licensing framework |
| **Export Control Order 2008, SI 2008/3231** | Detailed export control rules | ML10 (UAVs), ML17 (robots) |
| **Air Navigation Order 2016, SI 2016/765** | Aviation offences | Endangering aircraft |
| **Patents Act 1977, c. 37** | Patent law | Crown use, patent protection |
| **National Security Act 2023** | National security offenses | Prohibited place overflight |
| **Investigatory Powers Act 2016** | Surveillance and interception | Communications interception |
| **Product Safety of UAS Regulations 2024** | Post-Brexit UAS product safety | UKCA marking requirements |

## International Agreements

| Agreement | Relevance |
|-----------|-----------|
| **Wassenaar Arrangement** | Dual-use and conventional arms controls |
| **Missile Technology Control Regime (MTCR)** | UAV propulsion and control technology |
| **AUKUS Treaty (2021, expanded 2024)** | Streamlined defense trade between UK/US/Australia |
| **Five Eyes Alliance** | Intelligence sharing (not automatic export exemption) |

## CAA Guidance Documents

| Document | Subject |
|----------|---------|
| **CAP 722** | UAS Operations in UK Airspace — Guidance |
| **CAP 3017** | UK SORA Acceptable Means of Compliance |
| **CAP 3016** | UK SORA Policy (consultation response) |
| **CAP 2385** | Open Category guidance |
| **Drone and Model Aircraft Code** | Pilot guidance for all operations |

## MOD Policy Documents

| Document | Subject |
|----------|---------|
| **JSP 655** | Acquisition Operating Framework |
| **JSP 936** | Ethical AI for Defence (if published; status unclear) |
| **"Ambitious, safe, responsible"** (June 2022) | MOD approach to AI-enabled capability |
| **MOD AI Ethics Principles** | Five ethical principles for defense AI |
| **MOD SME Action Plan** (January 2022) | Improving SME access to defense contracts |

---

# PART 11: RISK MATRIX

| Activity | Regulatory Risk | Criminal Risk | Commercial Viability |
|----------|----------------|---------------|---------------------|
| Sub-250g drone manufacturing | LOW | NONE | HIGH (consumer market) |
| Sub-25kg commercial drones | MEDIUM | LOW | HIGH (commercial market) |
| Defense drone sales to MOD | MEDIUM | LOW (with compliance) | HIGH (government contracts) |
| NATO export (with licenses) | MEDIUM | LOW (with licenses) | HIGH (allied markets) |
| Counter-drone detection systems | LOW | NONE | HIGH (growing market) |
| Counter-drone jamming systems | EXTREME | HIGH | PROHIBITED |
| Autonomous navigation | LOW | NONE | HIGH (emerging market) |
| Autonomous targeting assistance | MEDIUM | MEDIUM (if misused) | MEDIUM (defense only) |
| Humanoid defense robots | MEDIUM | LOW (with compliance) | HIGH (emerging market) |
| EW software development | LOW | NONE | MEDIUM (defense only) |
| Open-source robot modification | LOW | NONE | MEDIUM (niche market) |

---

# DISCLAIMER

This document is provided for **informational and planning purposes only**. It does not constitute legal advice. UK export control, defense procurement, and aviation law are complex and fact-specific fields. MEOK Labs should:

1. **Consult a specialist UK solicitor** before commencing any export activity
2. **Contact the ECJU** (exportcontroljointunit@trade.gov.uk) for export classification queries
3. **Contact the CAA** (drones@caa.co.uk) for operational authorisation queries
4. **Contact Ofcom** for RF equipment licensing queries
5. **Consult the MOD Defence and Security Accelerator** for innovation opportunities

---

# APPENDIX A: KEY CONTACTS

| Organisation | Contact | Purpose |
|-------------|---------|---------|
| **CAA Drones Team** | drones@caa.co.uk | Operational authorisations, flight permissions |
| **ECJU** | exportcontroljointunit@trade.gov.uk | Export licensing, classification queries |
| **MOD DASA** | accelerator@dstl.gov.uk | Innovation funding, R&D contracts |
| **MOD SME Helpdesk** | Via Defence Sourcing Portal | Procurement guidance |
| **JOSCAR/Hellios** | hellios.com/joscar | Supplier accreditation |
| **UK IPO** | information@ipo.gov.uk | Patent applications |
| **Ofcom** | Ofcom Licensing | RF spectrum licensing |
| **ADS Group** | adsgroup.org.uk | Trade association for aerospace/defense |

---

# APPENDIX B: USEFUL WEBLINKS

- CAA Drones: https://www.caa.co.uk/drones
- UK Drone Registration: https://register-drones.caa.co.uk
- ECJU SPIRE: https://spire.trade.gov.uk
- ECJU OGEL Checker: https://www.trade.gov.uk/check-export-control-licence
- Defence Sourcing Portal: https://www.contracts.mod.uk
- DASA: https://www.gov.uk/government/collections/defence-and-security-accelerator
- UK Strategic Export Control Lists: https://www.gov.uk/government/publications/uk-strategic-export-control-lists
- CERN OHL: https://ohwr.org/cern_ohl
- JOSCAR: https://hellios.com/joscar

---

*Document compiled from open-source legal research. All citations verified against primary sources where publicly available. Law stated as of July 2026.*

**END OF DOCUMENT**
