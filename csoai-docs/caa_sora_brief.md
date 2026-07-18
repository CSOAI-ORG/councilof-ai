# CAA SORA Submission Brief — MEOK LABS Sovereign Robotics Campus
**Document Type**: Operational Planning Brief | Version 1.0 | April 2026
**Applicant**: MEOK LABS / Nick Templeman
**Site**: 6.5-acre private estate, England
**Target Outcome**: CAA Operational Authorisation for BVLOS UAS operations within declared volume

---

## 1. Purpose and Scope

This brief prepares MEOK LABS for submission of a UK SORA (Specific Operations Risk Assessment) to the Civil Aviation Authority under CAP 722 and CAP 3040. The outcome sought is a formal **Operational Authorisation (OA)** permitting Beyond Visual Line of Sight (BVLOS) unmanned aircraft operations within a geographically bounded operating volume above the 6.5-acre estate.

The OA, once issued, constitutes the regulatory mechanism by which MEOK LABS can:

1. Operate test drones without a Remote Pilot in Visual Line of Sight.
2. Host client BVLOS development flights under the authority of the OA.
3. Describe the airspace as a "CAA-authorised segregated testing corridor" — functionally equivalent to privately controlled airspace for unmanned operations.

The SORA methodology is defined in EASA AMC to Decision 2019/021/R, adopted by the UK CAA under CAP 722C. The UK diverged slightly from EASA harmonisation post-Brexit; this brief follows the UK CAA's specific implementation as documented in CAP 722C (March 2023 edition).

---

## 2. Legal and Regulatory Framework

**Primary instruments:**
- Air Navigation Order 2016 (SI 2016/765), as amended by SI 2020/917
- CAP 722 — UK Unmanned Aircraft System Operations in UK Airspace
- CAP 722C — SORA Application Guidance
- CAP 3040 — UAS Flight Testing in Atypical Air Environments
- CAP 1789 — CAA UAS Strategic Vision
- UK Retained Law: AMC to EASA Decision 2019/021/R (SORA methodology)

**Regulatory contact point:**
CAA UAS Permissions team, aviation.permissions@caa.co.uk. Pre-application engagement is strongly recommended before formal submission; the CAA accepts pre-submission meetings under their UAS Innovation Sandbox programme.

---

## 3. The SORA Process — Applied to the MEOK LABS Estate

SORA comprises seven sequential steps. Below, each step is applied specifically to the farm's geography, operations, and infrastructure.

### Step 1 — Define the UAS Operation (Concept of Operations)

The Concept of Operations (ConOps) document describes the intended operation in sufficient detail for risk quantification. For MEOK LABS, the ConOps should specify:

**Operating volume**: A cylinder or polygon encompassing the 6.5-acre estate footprint. At approximately 26,000 sq m (260m x 100m notional), the declared operating volume will extend from surface level (SFC) to a height of 120m AGL. A 50m lateral buffer from the estate boundary should be declared as a ground risk buffer zone.

**UAS categories**: Multi-rotor VTOL (class M2-M3), fixed-wing VTOL (class M2-M3), and experimental frames from registered test operators. Maximum MTOW: 25kg (higher MTOW requires separate OA extension). Maximum cruise speed: 20 m/s.

**Operations tempo**: Up to 8 concurrent UAS sorties per day, up to 5 days per week, across a 12-month authorisation period.

**Pilot qualification**: Minimum GVC (General Visual Line of Sight Certificate) qualification for all remote pilots. For BVLOS segments, minimum A2 CofC plus BVLOS theoretical knowledge examination.

**Boundaries**: No operations over or within 50m of any public road, public right of way, or neighbouring property. Estate boundary is enforced by physical fencing and electronic geofence.

### Step 2 — Determine the Intrinsic Ground Risk Class (GRC)

The GRC is based on the population density and controlled nature of the area overflown.

**MEOK LABS assessment:**
- Area classification: Controlled ground area (private land, access-controlled)
- Expected population density overflown: Zero uninvolved persons during authorised flight windows
- Maximum characteristic dimension of UAS: <3m (typical test frames)

**GRC calculation per AMC table:**
- Base GRC for operations over controlled ground area: GRC-1 (lowest risk)
- Adjustment for larger UAS frames (>3m characteristic dimension): +1 to GRC-2

**Declared GRC for MEOK LABS submission: GRC-2**

This is the lowest realistic GRC for any commercial testing operation and reflects the fact that the estate is private, fenced, access-controlled, and can be entirely cleared of uninvolved persons during flight operations.

**Mitigations to maintain GRC-2:**
- Written access control procedure for estate during flight operations.
- Flight operations manual specifying "sterile zone" protocol.
- Personnel briefing register signed by all persons present during operations.

### Step 3 — Determine the Final Ground Risk Class

Apply strategic mitigations to reduce the GRC below its intrinsic value. For MEOK LABS:

- **M1 (Operations over controlled ground area)**: The estate is already a controlled ground area. This mitigation is inherent and reduces GRC by 1. Final GRC after M1: **GRC-1**.

The final GRC is 1 — the minimum achievable. This means all residual risk in the SORA will be dominated by air risk, not ground risk.

### Step 4 — Determine the Air Risk Class (ARC)

The ARC is assessed against the airspace structure above the operating volume.

**MEOK LABS airspace profile:**
- Altitude band: SFC to 120m AGL
- Location: Rural England (site-specific airspace check required against UK AIP and NATS MAGIC portal)
- Proximity to controlled airspace: To be confirmed via AIP search; most rural English sites are in Class G uncontrolled airspace below 1,000ft AGL
- Proximity to ATZs, MATZ, and CTRs: Requires site-specific check

**Expected ARC outcome**: ARC-a (lowest air risk class), applicable to rural Class G airspace at low altitude with no instrument approach or departure procedures within 5nm.

**Note**: The submission must include a site-specific airspace assessment confirming ARC-a classification. This is one of the tasks for the retained aviation lawyer (see Section 8).

### Step 5 — Apply Strategic Air Mitigations to Determine Residual ARC

Strategic mitigations reduce the residual ARC by demonstrating that the operational design actively reduces likelihood of air traffic conflicts.

**Available mitigations for MEOK LABS:**

- **M2 (Detect-and-Avoid infrastructure)**: Ground-based radar and/or ADS-B receiver providing surveillance of the operating volume and adjacent airspace. This is the primary strategic air mitigation (see Section 6 for hardware specification).
- **M3 (Common traffic advisory radio)**: Broadcast of NOTAM and radio calls on the appropriate frequency during operations.
- **M4 (Flight information service)**: Optional coordination with the relevant FISO or ATCO for enhanced awareness.

With M2 in place: Residual ARC reduced from ARC-a to **ARC-a (mitigated)**, which is the lowest achievable residual air risk.

### Step 6 — Determine SAIL

The SAIL is determined by a matrix of Final GRC and Residual ARC:

| | ARC-a | ARC-b | ARC-c | ARC-d |
|---|---|---|---|---|
| GRC-1 | **SAIL I** | SAIL II | SAIL III | SAIL IV |
| GRC-2 | SAIL II | SAIL III | SAIL IV | SAIL V |
| GRC-3 | SAIL III | SAIL IV | SAIL V | SAIL VI |

**MEOK LABS outcome: SAIL I or SAIL II** depending on final GRC/ARC determination.

**SAIL I requirements:**
- ConOps document
- Operational Procedures manual
- Pilot qualification records
- Emergency response procedures

**SAIL II additional requirements (if applicable):**
- Operations manual reviewed by CAA
- Maintenance programme for UAS
- Detect-and-avoid capability documented

Both SAIL levels are achievable by a private operator without independent third-party audit.

### Step 7 — Determine OSOs and Robustness Level

Operational Safety Objectives (OSOs) are the specific safety requirements that must be met at the SAIL level. At SAIL I/II, the OSOs include:

- UAS is designed and maintained to appropriate standards (OSO-01 to OSO-07)
- Remote pilot is adequately trained (OSO-08 to OSO-12)
- Emergency response procedures are in place (OSO-13 to OSO-17)
- Detect-and-avoid capability appropriate to the operation (OSO-18 to OSO-24)

For SAIL I, most OSOs require only "Low" robustness. For SAIL II, the key OSOs (DAA, pilot qualification, maintenance) require "Medium" robustness, meaning documented procedures and records rather than third-party certification.

---

## 4. Operating Volume Declaration

**Recommended operating volume for OA submission:**

```
Primary Operating Volume (POV):
  Shape: Polygon matching estate boundary + 10m inset
  Surface: SFC
  Ceiling: 120m AGL
  Lateral dimensions: ~260m x 100m (approximately 2.6 hectares of declared airspace)

Contingency Volume:
  Shape: POV + 50m lateral buffer
  Surface: SFC
  Ceiling: 120m AGL

Ground Risk Buffer:
  50m from estate boundary — no UAS operations permitted
```

---

## 5. Detect-and-Avoid Infrastructure Specification

BVLOS operations require a DAA capability that provides the remote pilot with situational awareness equivalent to, or greater than, that achievable through visual observation. The following hardware configuration is recommended for MEOK LABS.

### Primary DAA: Ground-Based Surveillance Radar

**Recommended unit**: Echodyne EchoGuard or Robin Radar IRIS radar system
**Coverage**: 360-degree azimuth, 0-90 degrees elevation
**Detection range**: >2km for standard GA aircraft (MTOW >150kg); >500m for light UAS
**Update rate**: 1-second scan cycle
**Integration**: Direct feed to ground control station display
**Installation**: Roof-mounted on the workshop building (provides unobstructed sightlines across estate)
**Cost**: £7,000-12,000 for a commercial UAS-grade radar unit

### Secondary DAA: ADS-B/FLARM Receiver

**Function**: Receives cooperative transponder signals from manned aircraft, paramotors, gliders with FLARM, and ADS-B-equipped UAS.
**Coverage**: ADS-B reception range 20-30nm at low altitude (most commercial GA at FL100+); FLARM range 5-10km.
**Hardware**: Stratux or uAvionix Ping200X receiver integrated with ground station.
**Cost**: £500-2,000 depending on integration complexity.
**Note**: ADS-B alone is insufficient for BVLOS DAA because not all manned aircraft carry ADS-B. Must be combined with radar.

### Tertiary DAA: Visual Observer Network

At SAIL I/II, the CAA may accept a combination of ground radar + visual observer stations at the estate perimeter as the DAA means. This is lower cost but constrains operational tempo. Recommended as interim solution only during the pre-authorisation period.

### DAA Integration Requirement

All DAA sensors must feed into a unified display at the Ground Control Station. The display must provide the Remote Pilot with:
- Real-time track of all detected objects within the contingency volume
- Bearing and range to nearest traffic
- Alert for any traffic entering the primary operating volume
- Recommended avoidance action or hold instruction

Recommended software: Iris Automation Casia or SkyGrid UTM integration. For internal development, a custom display using OpenStreetMap + radar JSON output is acceptable at SAIL I/II.

---

## 6. Command and Control Link Infrastructure

BVLOS operations require a reliable C2 link between the Remote Pilot's Ground Control Station and the UAS. Single-link dependency is not acceptable for SAIL I/II — link redundancy is required.

### Primary C2 Link: Starlink (Low Earth Orbit Satellite)

**Hardware**: Starlink Business terminal (rectangular, high-performance)
**Latency**: 20-40ms (LEO satellite, significantly lower than GEO alternatives)
**Bandwidth**: 100-400 Mbps download, 20-40 Mbps upload
**Availability**: 99.9%+ uptime in rural UK; weather-resilient with radome
**Range**: Unlimited (satellite link; no range constraint within coverage area)
**Integration**: MAVLINK over IP tunnel to UAS autopilot
**Cost**: £2,500 hardware + £140/month Business plan
**CAA consideration**: Satellite C2 links are explicitly addressed in CAP 722C; Starlink Business is an acceptable primary C2 medium for BVLOS provided link monitoring and loss-of-link procedures are documented.

### Secondary C2 Link: 4G LTE

**Hardware**: Industrial 4G router with dual SIM (EE + Vodafone for UK rural coverage diversity)
**Latency**: 30-70ms
**Bandwidth**: 20-50 Mbps
**Range**: Coverage-dependent; confirmed signal required across the estate (site survey required)
**Integration**: Secondary MAVLINK path, automatic failover from Starlink
**Cost**: £400 hardware + £50/month SIM plans
**Note**: 4G is the standard secondary C2 link in UK BVLOS operations; its inclusion satisfies the redundancy requirement.

### Tertiary C2 Link: LoRa Long-Range Radio

**Hardware**: RFD900x or Holybro SiK 900MHz long-range telemetry modules
**Latency**: <100ms
**Range**: >20km in rural conditions (exceeds estate operating volume by large margin)
**Bandwidth**: Low (sufficient for MAVLINK telemetry; not suitable for video)
**Function**: Emergency C2 only — activates if both Starlink and 4G fail. Triggers RTL (Return to Launch) or pre-planned contingency flight path.
**Cost**: £300-600 for a pair of RFD900x units
**Regulatory basis**: LoRa C2 on 868MHz is license-exempt in the UK under IR 2030; 900MHz bands require Ofcom light licensing.

### C2 Link Monitoring Requirement

The ground station software must monitor link quality on all three channels in real time and display:
- Current active link
- Signal quality / RSSI per link
- Automatic failover status
- Time since last valid telemetry packet

Loss-of-link procedure must be defined and included in the Operations Manual.

---

## 7. Timeline to Operational Authorisation

The following timeline assumes engagement of an aviation lawyer at Month 1 and no significant CAA objection to the ConOps.

### Month 1: Pre-Submission Preparation
- Week 1: Retain aviation lawyer; instruct airspace assessment (AIP search, NATS MAGIC review)
- Week 1-2: Commission site survey for 4G signal coverage; identify radar mounting location
- Week 2: Draft Concept of Operations document
- Week 3: Complete SORA Steps 1-4 with lawyer; determine SAIL level
- Week 4: Request CAA pre-application meeting via UAS Innovation Sandbox

### Month 2: Document Package Preparation
- Week 5: CAA pre-application meeting (typically conducted by video call, ~1 hour)
- Week 5-6: Draft Operations Manual (incorporating ConOps, DAA procedures, loss-of-link procedures, emergency response)
- Week 6-7: Procure and install ground radar and ADS-B receiver; document installation
- Week 7: Test DAA integration; generate screenshots/video for submission
- Week 8: Draft OSO compliance matrix; complete Steps 5-7 of SORA

### Month 3: Submission and CAA Review
- Week 9: Submit OA application via CAA online portal (UAS.CAA.co.uk)
- Week 9: Pay OA application fee (currently £0 for initial OA; CAA does not currently charge for SORA-based OA applications, though this is subject to change)
- Week 10-12: CAA review period (typical: 4-8 weeks for SAIL I/II with competent submission)

### Month 4: Authorisation and Activation
- Week 13-14: CAA clarification questions (expect 1-2 rounds)
- Week 15: OA issued (conditional or unconditional)
- Week 16: NOTAM published; estate operating volume activated; BVLOS operations commence

**Total timeline: 3.5-4 months from lawyer engagement to first authorised BVLOS flight.**

---

## 8. Budget Breakdown

| Item | Low Estimate | High Estimate | Notes |
|---|---|---|---|
| Aviation lawyer (ConOps + SORA + OA submission) | £6,000 | £10,000 | Includes airspace assessment and CAA pre-app meeting |
| Ground-based surveillance radar | £7,000 | £12,000 | Echodyne/Robin; includes installation |
| ADS-B/FLARM receiver | £500 | £2,000 | Hardware + integration |
| Starlink Business terminal | £2,500 | £2,500 | One-off hardware |
| 4G router and SIMs (12 months) | £1,000 | £1,500 | Hardware + first year airtime |
| LoRa emergency C2 links | £400 | £600 | RFD900x pair |
| Operations Manual drafting (if lawyer-assisted) | £1,500 | £3,000 | Can be owner-drafted at lower cost |
| Geofencing implementation (estate perimeter) | £500 | £1,500 | Hardware geofence beacons |
| **TOTAL** | **£19,400** | **£33,100** | |

**Recommended budget: £25,000** covering mid-range estimates with contingency.

The most common budget overrun is the Operations Manual — building a document that satisfies CAA scrutiny at SAIL II typically takes 30-50 hours of skilled work. Owner-drafted manuals are accepted but frequently require revision.

---

## 9. Recommended Aviation Lawyer

The following firms have demonstrated track records with CAA SORA submissions and BVLOS OA applications as of 2025-2026:

1. **Wikborg Rein (London office)** — Commercial aviation practice with UAS sub-team; handled multiple BVLOS OA submissions including agricultural and industrial clients.

2. **Bird & Bird (London)** — Aviation and technology practice; strong CAA regulatory relationship; recommended for SAIL III+ if airspace assessment reveals a more complex ARC.

3. **DAC Beachcroft** — Insurance-specialist practice that also handles aviation regulatory; useful if liability structure for client testing operations needs to be built alongside the OA.

4. **Specialist UAS consultancy alternative**: Altitude Angel (Reading) offers SORA-as-a-service including ConOps preparation and OA submission management, at comparable cost to a law firm for lower SAIL levels. Not qualified legal advice but technically competent for SAIL I/II.

**Recommendation**: For MEOK LABS's combination of SAIL I/II airspace and commercial client hosting ambitions, Wikborg Rein or Bird & Bird provides both the OA submission capability and the contractual framework for client liability. Budget accordingly.

---

## 10. Post-Authorisation: Operating as a Commercial Testbed

Once the OA is issued, MEOK LABS can offer BVLOS testing slots to third-party clients under the authority of its own OA, subject to:

- Third-party UAS operators being added as "additional operators" in the OA (requires CAA notification, not a new application).
- Third-party pilots meeting the minimum qualification requirements specified in the OA.
- Third-party operations being conducted within the declared operating volume and under MEOK LABS's Operations Manual.

This is the commercial enabler: one OA, covering the estate, that any qualifying client can fly under without obtaining their own BVLOS permission. This is the same model used by Cranfield Airport and the West Wales Airport testbed, and it is explicitly supported by CAP 722C.

---

*This brief was prepared for MEOK LABS internal planning. It reflects CAA guidance as of April 2026. Regulatory requirements are subject to change; verify currency with aviation legal counsel before submission.*
