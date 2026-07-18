# Expansion Gap #2: Autonomous Systems RegGeoInt
## AVs, Drones, Maritime, and Robotics

### Market Context
- **Autonomous vehicles:** $300B by 2030
- **Drone delivery:** $50B by 2030
- **Autonomous shipping:** $150B by 2030
- **Warehouse robotics:** $50B by 2030
- **Total autonomous systems compliance:** Underserved market, no dominant player

### The Problem
A self-driving car trained in California cannot legally operate in Germany without meeting completely different standards:
- **US (Federal):** NHTSA voluntary guidance. No federal AV law.
- **US-CA:** DMV permits required. Disengagement reporting mandatory.
- **Germany:** StVG amendment requires ADS permit. TÜV certification. Driver must be able to take control.
- **France:** No specific AV law yet. Testing permits from Ministry of Transport.
- **UK:** Automated Vehicles Act 2028. Secretary of State authorization required.
- **Japan:** Level 4 permitted in designated areas. MLIT approval.
- **China:** National standards GB/T. Local testing permits. Data localization.
- **Singapore:** LTA permits. Sandboxes in one-north, Sentosa.

**A drone delivery company wants to operate in 10 cities. Each city has different altitude limits, no-fly zones, insurance requirements, noise ordinances, and liability rules. No unified map exists.**

### Current "Competitors"
- **AirMap / Kittyhawk:** Airspace only. No regulatory intelligence.
- **HERE Technologies:** Maps only. No compliance layer.
- **TomTom:** Navigation only. No autonomous-specific rules.
- **Regulus:** GPS spoofing detection only. Niche.
- **AUVSI:** Industry association. No real-time compliance tool.

**Zero geospatial regulatory intelligence for autonomous systems. Zero.**

### MEOK Autonomous RegGeoInt: What We Build

#### Vehicle Types Covered
1. **Autonomous Cars (L2-L5)**
2. **Delivery Drones (sUAS / UAM)**
3. **Autonomous Ships (MASS)**
4. **Warehouse Robots (AMR / AGV)**
5. **Construction Robotics**
6. **Agricultural Autonomous Equipment**

#### Jurisdiction Profiles (Seed Data)
| Jurisdiction | Vehicle Type | Framework | Key Requirement |
|-------------|-------------|-----------|-----------------|
| US (Federal) | AV | NHTSA | Voluntary, no federal law |
| US-CA | AV | CA DMV | Testing permit, disengagement reports |
| Germany | AV | StVG | ADS permit, TÜV, liability insurance |
| UK | AV | AV Act 2028 | Secretary of State authorization |
| Japan | AV | MLIT | Level 4 designated areas only |
| China | AV | MIIT GB/T | Testing permit, data localization |
| Singapore | AV | LTA | Sandbox permits, geofencing |
| US (Federal) | Drone | FAA Part 107 | Remote pilot certificate |
| US | Drone | FAA BVLOS | Beyond visual line of sight waiver |
| EU | Drone | EASA | Open / Specific / Certified categories |
| Germany | Drone | BfLU | Local noise ordinances |
| France | Drone | DGAC | Registration, insurance mandatory |
| UK | Drone | CAA | Operator ID, flyer ID |
| Singapore | Drone | CAAS | Permit for >7kg, no-fly zones |
| IMO | Maritime | MASS Code | Draft international guidelines |
| Norway | Maritime | NMA | First autonomous ship testing |
| Japan | Maritime | MLIT | Remote navigation permits |

#### Autonomous-Specific MCP Tools
```python
AUTONOMOUS_TOOLS = [
    "av_jurisdiction_check",
    "drone_flight_permit_requirements",
    "drone_no_fly_zone_overlay",
    "autonomous_ship_route_compliance",
    "robotics_workplace_safety_check",
    "cross_border_av_deployment",
    "insurance_requirements_by_vehicle",
    "liability_framework_by_jurisdiction",
]
```

#### Cross-Border AV Advisory
```
GET /v1/autonomous-compliance/deploy/{vehicle}/to/{jurisdiction}

Response:
{
  "vehicle": "Waymo Jaguar I-PACE (L4)",
  "target": "DE",
  "permit_required": True,
  "permit_type": "ADS-Betriebserlaubnis (StVG §1e)",
  "competent_authority": "KBA + TÜV",
  "testing_allowed": True,
  "commercial_operation": "Requires StVG §1e(3) extension",
  "insurance_minimum": "€50M liability",
  "data_localization": "Teleoperation data must remain in EU",
  "compliance_cost_estimate": "€2M-€5M",
  "timeline_months": 12-18
}
```

#### Drone-Specific: 3D Regulatory Map
- Altitude layers: 0-120m (EASA Open), 120-400m (Specific), 400m+ (Certified)
- Dynamic no-fly zones: Airports, prisons, stadiums, government buildings
- Noise ordinances: dB limits by time of day and location
- Insurance requirements: Liability minimums by jurisdiction
- BVLOS rules: Beyond visual line of sight permits by country

### Revenue Model
| Segment | Price | Volume |
|---------|-------|--------|
| AV manufacturers (Waymo, Cruise, Tesla) | $500K/year | 20 companies |
| Drone operators (Wing, Zipline, Manna) | $100K/year | 50 companies |
| Shipping companies (Maersk, MSC) | $200K/year | 30 companies |
| Robotics vendors (Locus, 6 River) | $50K/year | 100 companies |
| Insurance underwriters | $25K/year | 20 carriers |
| **Total addressable** | | **$19M/year** |

### Go-To-Market
1. **Target:** Drone operators first — fastest regulatory change, highest pain
2. **Channel:** AUVSI XPONENTIAL, InterDrone, commercial UAV expos
3. **Message:** "Fly in 10 cities without 10 legal teams"
4. **Partnership:** AirMap (they have airspace, we have regulations)
5. **Content:** "The BVLOS Map" — free global beyond-visual-line-of-sight guide

### Why MEOK Wins
- **Technical reuse:** Same geospatial engine, different altitude dimension
- **First mover:** No one maps drone regulations by city block
- **Sticky:** Regulatory permits are recurring; customers don't churn
- **Defense crossover:** Military drones = same tech, higher classification

### Strategic Value
Autonomous systems are the most physically regulated technology in history. Every meter of altitude, every city block, every shipping lane has different rules. **The compliance map is the product.**

---

*Gap analysis: 2026-05-30*
*Market size: $550B autonomous systems market, compliance layer = 1-3% = $5-15B*
*Competitor count in geospatial autonomous compliance: 0*
