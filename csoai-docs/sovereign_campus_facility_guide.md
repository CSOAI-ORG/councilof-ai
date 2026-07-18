# MEOK LABS Sovereign Robotics Campus
## Facility Guide for Prospective Clients
**Version 1.0 | April 2026**

*For technical evaluation, commercial enquiries, and partnership discussions.*
*Contact: Nick Templeman, MEOK LABS | Enquiries via meok.ai*

---

## Welcome to the Only Place in England Where You Can Do All of This in One Visit

There are places in the UK where you can test a drone. There are places where you can run an autonomous ground vehicle. There are places with GPU clusters. There is no other place — not Millbrook, not the Zenzic Connected Places, not RACE at Culham, not any university campus — where a robotics team can arrive on a Monday, operate a BVLOS drone, run a Level 5 ground robot across mixed terrain, test AI safety under ISO-tracked conditions, and go home on Friday with data that stands up in front of the CAA, the DVSA, and a defence procurement board.

That place is MEOK LABS Sovereign Robotics Campus, a 6.5-acre private estate in England owned and operated by MEOK LABS.

This guide explains what the facility is, what you can do here, what you cannot do anywhere else in the UK, and how to book time.

---

## Section 1: The Estate — Physical Overview

### The Land

The campus occupies 6.5 acres of working farm in England. The terrain is genuinely mixed: flat grassland, moderate incline, loose surface tracks, drainage channels, dense hedgerow margins, and open sky with unobstructed horizon in the primary flight direction. This is real ground, not a sanitised test surface.

The estate is **fully privately owned**, with no public rights of way crossing the operational areas. There are no public roads within the primary testing zone. Access is controlled at a single vehicle gate.

This matters legally and operationally. Your test subjects — ground robots, aerial platforms, sensor suites — encounter real British weather, real British mud, real British vegetation, and real British RF environment. Not a concrete skid pad designed in 1975. Not an indoor arena. Not a car park at 2am.

### The Workshop — Zone A

**90 feet by 20 feet (1,800 sq ft) steel-framed agricultural workshop**

The workshop is the engineering heart of the campus. It provides:

- **Full vehicle access**: 5m wide roller doors accommodate full-size agricultural robots, quadbikes, UAV transport vehicles, and crane lifts.
- **Three-phase power**: 63A three-phase on two circuits; single-phase 32A on four additional circuits. Total available power: ~80kW continuous.
- **Height**: 6m to ridge; sufficient for indoor multi-rotor hover testing up to MTOW 10kg.
- **Concrete floor**: Epoxy-sealed, rated for 5-tonne point load.
- **Workshop equipment**: Bench grinders, drill presses, MIG/TIG welding stations, hydraulic press, bandsaw, CNC router (1200x800mm bed). Client access by arrangement.

**RF Shielded Section (Faraday Cage): 20ft x 20ft (400 sq ft)**

This is the facility's most unusual physical asset. The workshop incorporates a structurally integrated Faraday cage section providing:

- **Attenuation**: >60dB from 1MHz to 10GHz (documented via measurement)
- **Purpose**: GPS-denied navigation testing; EMC emissions testing; RF covert system development; AI sensor behaviour under denied or degraded RF conditions
- **Access**: Double-door airlock entry; no through-penetrations without RF-filtered connectors
- **Standards basis**: Designed and measured against MIL-STD-461G RE102 emission limits; suitable for pre-compliance EMC testing
- **Power**: Clean power supply inside the cage via filtered IEC connectors

What this means for clients: you can bring a drone, ground robot, or AI sensing system into this room and have it experience a world with no GPS, no 4G, no Wi-Fi — then walk outside and reintroduce those signals in controlled increments. You can test your system's behaviour at the exact moment GPS signal is denied, restored, spoofed, or degraded. There is no commercial equivalent of this accessible to private clients in England at day-hire rates.

**Cost to replicate**: Approximately £15,000 for the Faraday cage construction as integrated into the existing workshop structure. Not economically viable as a standalone facility.

### The Laboratory Building — Zone B

**1,800 sq ft dedicated laboratory and compute facility**

The laboratory building provides:

- **9-node GPU compute cluster**: Custom-built for robotics AI inference, model training, and simulation. Mixed architecture including NVIDIA high-performance inference cards; total VRAM >200GB across cluster.
- **Vast.ai node integration**: Additional on-demand burst capacity via Vast.ai connected nodes for training workloads that exceed local cluster capacity.
- **Networking**: 10GbE switching fabric throughout lab; fibre uplink to Starlink Business terminal (100-400Mbps, 20-40ms latency).
- **Air-gapped operating mode**: The GPU cluster can be physically isolated from all external networks for classified or sensitive client workloads. Chain-of-custody data handling is documented.
- **Simulation environment**: ROS2/Gazebo simulation stack running on cluster nodes; Unreal Engine 5 photorealistic simulation for perception system training.
- **Workstation area**: 8 sit-stand desks with 27" 4K displays; available for client engineering teams during extended test engagements.
- **Climate control**: Dedicated HVAC system maintaining 18-22°C ±1°C; humidity-controlled 40-60% RH.

**ISO 27001 pathway**: The laboratory is the declared scope for MEOK LABS's ISO 27001:2022 certification programme, targeting Q4 2026. Clients requiring pre-certification data security assurances can request the draft information security management documentation.

### The Airfield / Flight Operations Zone — Zone C

**Open ground: approximately 3.5 acres of declared operating volume**

Zone C is the primary flight operations area. It comprises:

- **Primary runway strip**: 180m x 25m mown grass strip, gradient <1%, suitable for fixed-wing VTOL takeoff/landing and rotary-wing operations.
- **VTOL pads**: Three reinforced concrete pads (6m x 6m each) at 50m intervals along the strip.
- **Ground Control Station (GCS)**: Weatherproof cabin, 10m² internal, housing radar display, C2 link infrastructure, and UAS tracking systems. Power: 16A single-phase.
- **Wind sock and anemometer**: Real-time met data logged to on-site weather station.
- **Lighting**: LED perimeter lighting for dawn/dusk operations (operations in darkness require separate OA amendment).
- **Geofence beacons**: Physical RF geofence beacons at estate boundary; integrated with UAS autopilot for hard-boundary enforcement.

### The Open Ground / Ground Robot Test Area — Zone D

**Mixed terrain: approximately 2 acres**

Zone D provides the terrain variety that makes this facility genuinely useful for ground robot developers:

- **Track network**: 450m of mixed surface track including packed gravel, loose stone, soft earth, and grass — navigable by all ground robot configurations.
- **Grade challenges**: Maximum gradient 12%; suitable for testing traction control, slope navigation, and terrain adaptation algorithms.
- **Obstacle course**: Reconfigurable obstacle sections including logs, furrows, drainage culverts, and dense vegetation margins.
- **Water feature**: Seasonal pond and drainage channel crossing; suitable for amphibious or IP-rated ingress testing.
- **Crop rows**: Active crop rows for agricultural robot path-planning and precision application testing (seasonal availability May-September).

---

## Section 2: What Clients Can Test at MEOK LABS That They Cannot Test Anywhere Else in the UK

### 1. BVLOS Drone + Level 5 Ground Robot in the Same Session

No other UK testbed offers BVLOS-authorised drone operations and unrestricted Level 5 ground autonomy testing on the same site, on the same day.

- **Millbrook**: World-class road vehicle test facility. No airspace. BVLOS drone operations are not part of the offering.
- **Zenzic Connected Places**: Public road testbeds. AV Act registration required for autonomous vehicle operations. No airspace. No private-land AV Act exemption.
- **RACE at Culham (UKAEA)**: Nuclear infrastructure robotics focus. No commercial testbed access. No civilian drone airspace.
- **University campus facilities**: Controlled indoor environments or small outdoor plots. No realistic terrain. No BVLOS airspace. No commercial access.

### 2. GPS-Denied Navigation Testing

The RF-shielded Faraday cage in Zone A provides the only commercially accessible GPS-denied environment in England designed specifically for robotics system testing. Clients testing navigation systems for defence, aerospace, or extreme-environment applications cannot replicate this at any commercial UK testbed.

### 3. AI Safety Testing Against Regulatory Standards

The combination of the ISO 27001-tracked laboratory, the air-gapped GPU cluster, and documented test procedures allows clients to generate test evidence that directly supports regulatory submissions. The CAA and DVSA both accept well-documented private test evidence in support of Operational Authorisation applications and type approval submissions. MEOK LABS can provide test documentation templates aligned to CAA SORA OSO requirements and AV Act safety assurance frameworks.

### 4. Multi-Modal AI Training on Real Data

The 9-node GPU cluster, Vast.ai burst capacity, and Starlink-connected lab mean a client can fly a perception data-collection mission in Zone C, return to Zone B, and begin training a model on the same day. The round trip from raw sensor data to updated model weights can complete within hours, not weeks. This is the iteration speed required for competitive AI-embedded robotics development.

### 5. Defence-Grade Testing Environment

The combination of Faraday cage, air-gapped compute, access-controlled estate, and GPS-denied testing capabilities provides an environment suitable for defence contractor pre-compliance testing. While MEOK LABS does not hold DV-cleared facilities, the physical security characteristics (perimeter, access control, CCTV, data isolation) are consistent with OFFICIAL-SENSITIVE handling under the Government Security Classifications Policy 2018.

---

## Section 3: Legal Basis for Each Zone

| Zone | Primary Legal Basis | Key Capability Enabled |
|---|---|---|
| **Zone A (Workshop)** | Private land; Building Regulations 2010; Electricity at Work Regulations 1989 | Vehicle integration, Faraday cage testing |
| **Zone B (Lab)** | Private land; UK GDPR (data processing); ISO 27001 (certification target) | AI training, air-gapped compute, data sovereignty |
| **Zone C (Airfield)** | CAA CAP 722C Operational Authorisation (in application) | BVLOS drone operations, multi-UAS testing |
| **Zone D (Ground)** | AV Act 2024 private land exemption (Schedule 1) | Level 5 autonomous ground vehicle testing |

---

## Section 4: The 90-Day Roadmap to Full Operational Status

The campus is operational for ground robot testing and compute-supported AI development now. The 90-day programme completes the regulatory and physical infrastructure required for BVLOS airspace operations and ISO-tracked laboratory status.

### Month 1: Legal and Regulatory Foundation (Days 1-30)

**Week 1**
- Retain aviation lawyer (Wikborg Rein or Bird & Bird); instruct airspace assessment
- Commission site survey: 4G coverage across estate, AIP airspace check, NATS MAGIC review
- Begin ISO 27001 gap analysis for Zone B laboratory scope

**Week 2**
- Draft Concept of Operations document for CAA OA submission
- Procure RF attenuation measurement of Faraday cage section; document results
- Draft access control procedure and sterile zone protocol for Zone C flight operations

**Week 3**
- CAA SORA Steps 1-4 completed with aviation lawyer
- GRC-2 / ARC-a assessment confirmed
- SAIL I/II determination made

**Week 4**
- Request CAA pre-application meeting via UAS Innovation Sandbox
- ISO 27001 Statement of Applicability drafted
- Zone D access track survey completed; terrain mapping for client documentation

**Month 1 Cost**: ~£8,000-12,000 (lawyer fees, gap analysis consultant, surveys)

### Month 2: Physical Infrastructure (Days 31-60)

**Week 5**
- CAA pre-application meeting conducted
- Procure ground-based surveillance radar (Echodyne EchoGuard or Robin IRIS)
- Procure ADS-B/FLARM receiver; order Starlink Business terminal

**Week 6**
- Radar installation on workshop roof; cabling to GCS cabin
- Starlink terminal installation and peering with 4G failover router
- LoRa emergency C2 link installation and range testing

**Week 7**
- DAA system integration: radar + ADS-B feeds combined on GCS display
- Ground Control Station fit-out: ergonomic layout, documentation station, communications
- VTOL pad reinforcement; wind sock and anemometer installation

**Week 8**
- Zone D obstacle course construction (reconfigurable modular elements)
- Geofence beacon installation at estate boundary
- Full DAA system test; document with timestamped logs and screenshots for OA submission

**Month 2 Cost**: ~£25,000-35,000 (radar, C2 infrastructure, GCS, Zone D works)

### Month 3: Regulatory Capture (Days 61-90)

**Week 9**
- Submit CAA OA application via UAS.CAA.co.uk; include full SORA documentation package
- Submit ISO 27001 Stage 1 audit request to UKAS-accredited certification body

**Week 10**
- Publish MEOK LABS facility guide externally (this document, revised for public version)
- Brief first three target clients: one drone developer, one ground robot developer, one defence-adjacent SME
- Apply to UKRI Extreme Environments Hub or equivalent national programme as private operator testbed

**Week 11**
- Respond to CAA clarification questions (expected round 1)
- ISO 27001 Stage 1 audit conducted
- First commercial test engagement contracted; dates locked

**Week 12**
- CAA OA conditional authorisation expected (or final authorisation if no clarification rounds needed)
- NOTAM publication process initiated
- Facility operational at full capability

**Month 3 Cost**: ~£6,000-10,000 (OA fees if applicable, ISO audit, marketing materials)

---

## Section 5: Full Budget Breakdown

### Capital Infrastructure

| Item | Estimate | Zone |
|---|---|---|
| RF shielded Faraday cage (already constructed) | £15,000 (sunk cost) | A |
| Ground-based surveillance radar | £10,000 | C |
| ADS-B/FLARM receiver + integration | £1,500 | C |
| Starlink Business terminal | £2,500 | B/C |
| 4G router and 12mo airtime | £1,200 | C |
| LoRa C2 emergency links (pair) | £500 | C |
| Ground Control Station fit-out | £3,000 | C |
| Geofence beacons (estate perimeter) | £1,500 | C |
| VTOL pad reinforcement x3 | £2,000 | C |
| Zone D obstacle course elements | £3,000 | D |
| **Zone C/D subtotal (new capital)** | **£25,200** | |

### Regulatory and Certification

| Item | Estimate |
|---|---|
| Aviation lawyer (SORA + OA submission) | £10,000 |
| ISO 27001 gap analysis and SoA | £4,000 |
| ISO 27001 Stage 1 + Stage 2 audit | £7,000 |
| UKAS accreditation application (if direct route) | £5,000 |
| **Regulatory subtotal** | **£26,000** |

### Total 90-Day Programme Budget

| Category | Estimate |
|---|---|
| Capital infrastructure (new) | £25,200 |
| Regulatory and certification | £26,000 |
| Contingency (15%) | £7,680 |
| **TOTAL** | **£58,880** |

**Note**: This budget excludes the already-constructed Faraday cage (£15,000 sunk) and the existing 9-node GPU cluster (capital value ~£80,000). The marginal cost to reach full regulatory authorisation is under £60,000. Millbrook charges £5,000-8,000 per day for track time. MEOK LABS recovers this investment at under 10 days of commercial client bookings.

---

## Section 6: Commercial Terms and Booking

### Day Rate Structure

| Service Package | Day Rate (ex VAT) | Included |
|---|---|---|
| Ground Robot Testing (Zone D only) | £1,200 | Zone D access, workshop support, telemetry logging |
| AI Development Day (Zone B only) | £800 | GPU cluster access, Vast.ai burst, lab workstations |
| Airspace Day (Zone C, post-OA) | £1,800 | BVLOS airspace access, GCS, DAA system, met data |
| Full Campus Day (Zones A-D) | £3,000 | All zones, workshop, compute, airspace, support staff |
| Embedded Residency (1 week) | £10,000 | Full campus 5 days, accommodation options nearby |
| Custom Programme (monthly) | From £25,000 | Negotiated; includes IP protection clauses |

*For comparison: Millbrook daily track rates start at £5,000. Cranfield research facility commercial engagements typically start at £15,000/week and require academic partnership structures.*

### What Is Included in All Bookings

- Health and safety induction and site management
- Public liability insurance coverage during operations (£5M minimum)
- Data non-disclosure: all client data, test results, and IP observed during the engagement is treated as confidential under a standard NDA executed prior to booking
- On-site engineering support: 1 senior engineer available for technical query and integration assistance
- Test documentation: timestamped data logs, video record of operations (client-controlled)

### Client Obligations

- All UAS operators must hold minimum GVC qualification
- All ground robot operators must provide evidence of operator-level safety review
- Clients operating under their own regulatory authorisations must provide copies prior to arrival
- Client-supplied autonomous systems must be accompanied by a system safety case document, however brief

---

## Section 7: Contact and Enquiry Process

Enquiries from serious prospective clients (robotics companies, defence primes, government programmes, academic groups with commercial mandate) are welcome. The facility is not open to media, general public tours, or speculative visits.

To initiate an enquiry:
1. Email a brief description of your test programme, target dates, and technical requirements.
2. MEOK LABS will respond within 48 hours with a facility suitability assessment.
3. If suitable: NDA, site visit, and commercial terms discussion follow.
4. Booking confirmed on receipt of signed terms and deposit.

**The facility is not a consumer product. It is national infrastructure with a commercial access model. Treat it accordingly and you will find it the most capable robotics testing environment in England for its class of operation.**

---

*MEOK LABS Sovereign Robotics Campus. Privately operated. Publicly critical.*
