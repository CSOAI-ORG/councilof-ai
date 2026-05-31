# Expansion Gap #5: Space RegGeoInt
## Satellite Spectrum, Launch Licenses, and Orbital Debris

### Market Context
- **Global space economy:** $500B by 2030
- **Satellite launches:** 2,000+ per year by 2026
- **Mega-constellations:** Starlink (7,000+), OneWeb (600+), Amazon Kuiper (3,200 planned)
- **Space regulatory compliance:** Emerging market, no dominant player
- **Spectrum allocation:** $100B+ value, ITU-coordinated

### The Problem
A satellite company wants to launch 100 satellites into Low Earth Orbit. The regulatory maze:
- **Launch license:** Required from national space agency (FAA in US, ESA in EU, CNSA in China)
- **Spectrum allocation:** Must coordinate with ITU (International Telecommunication Union) — 7-year process
- **Orbital debris:** NASA 25-year rule, ESA guidelines, national debris mitigation standards
- **Frequency interference:** Must not interfere with existing satellites
- **Data localization:** Some nations require ground stations in-country
- **Military coordination:** satellites crossing military zones need clearance
- **Export control:** Satellite technology = ITAR (US) / dual-use (EU)

A single mega-constellation may need **50+ licenses across 20 jurisdictions**. No unified map exists.

### Current "Competitors"
- **SpaceX / Starlink:** Vertical integration. No third-party tool.
- **AGI / Ansys:** Orbital mechanics only. No regulatory layer.
- **ITU:** Spectrum database only. No compliance workflow.
- **National space agencies:** Each has own portal. No cross-border integration.
- **Law firms (Hogan Lovells, Milbank):** Bill $1,000/hour for license applications.

**Zero geospatial regulatory intelligence for space. Zero.**

### MEOK Space RegGeoInt: What We Build

#### Space-Specific MCP Tools
```python
SPACE_TOOLS = [
    "launch_license_requirements",
    "itu_spectrum_coordination_status",
    "orbital_debris_compliance_check",
    "satellite_frequency_interference_check",
    "ground_station_jurisdiction_requirements",
    "space_export_control_classification",
    "military_coordination_clearance",
    "space_insurance_requirements",
]
```

#### Launch Advisory
```
GET /v1/space-compliance/launch/{vehicle}/from/{launch_site}/orbit/{target_orbit}

Response:
{
  "launch_vehicle": "Falcon 9",
  "launch_site": "CCSFS (US)",
  "target_orbit": "LEO 550km",
  "licenses_required": {
    "US": {
      "faa_launch_license": "Required (Part 450)",
      "fcc_satellite_license": "Required (Part 25)",
      "ntia_frequency_coordination": "Required",
      "timeline_months": 12-18,
      "cost_estimate": "$500K-1M"
    },
    "ITU": {
      "advance_publication": "Required (18 months advance)",
      "coordination_arc": "Required",
      "notification": "Required",
      "timeline_months": 24-84,
      "cost_estimate": "$200K-500K"
    }
  },
  "orbital_debris_requirements": [
    "25-year post-mission disposal",
    "Collision avoidance capability",
    "Passivation at end of life"
  ],
  "insurance_minimum": "$50M third-party liability",
  "compliance_cost_estimate": "$1.5M-3M total"
}
```

#### Spectrum Map by Jurisdiction
| Band | Use | US (FCC) | EU (CEPT) | China (MIIT) | Japan (MIC) |
|------|-----|----------|-----------|--------------|-------------|
| Ku (12-18 GHz) | Broadband | Licensed | Licensed | Licensed | Licensed |
| Ka (26.5-40 GHz) | HTS | Licensed | Licensed | Experimental | Licensed |
| V (40-75 GHz) | Future | Experimental | Experimental | Restricted | Experimental |
| Q/V (33-75 GHz) | Inter-satellite | Part 25 | Harmonized | Restricted | Licensed |

### Revenue Model
| Segment | Price | Volume |
|---------|-------|--------|
| Satellite operators (Starlink, OneWeb) | $1M/year | 20 companies |
| Launch providers (SpaceX, Rocket Lab) | $500K/year | 10 companies |
| New space startups | $100K/year | 100 companies |
| Ground station networks | $50K/year | 50 companies |
| **Total addressable** | | **$27.5M/year** |

### Go-To-Market
1. **Target:** New space startups first — highest regulatory pain, lowest budget tolerance for lawyers
2. **Channel:** Space Symposium, Satellite, Paris Space Week
3. **Message:** "Launch in 12 months, not 7 years"
4. **Partnership:** ITU (data source), national space agencies (validation)
5. **Content:** "The Spectrum Map" — free ITU coordination timeline estimator

### Why MEOK Wins
- **Technical reuse:** Same geospatial engine, orbital altitude dimension added
- **Time value:** ITU coordination takes 7 years. Any acceleration = massive value.
- **Data moat:** ITU filings, frequency assignments, and orbital slots are public but unstructured
- **Defense crossover:** Military satellites = highest classification, same compliance needs

### Strategic Value
Space is the ultimate cross-border domain. Every satellite crosses every jurisdiction below it. The regulatory framework is 60 years old (Outer Space Treaty 1967) and completely inadequate for 2026. **The first company to map space regulations geospatially owns the category.**

---

*Gap analysis: 2026-05-30*
*Market size: $500B space economy, compliance layer = 0.5-1% = $2.5-5B*
*Competitor count in geospatial space compliance: 0*
