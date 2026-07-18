# 🐉 EAT-176 — World-Real World 3D Map CHECKLIST
## Country + Region Mapping → SovSpace UE5

**Date:** 2026-06-30 10:00 BST
**Status:** 🟢 IN PROGRESS
**Days to launch:** ~3d 23h

---

## 🎯 OBJECTIVE

Build a **REAL WORLD 3D ATLAS** on SovSpace UE5 where:
- The globe shows real 3D earth (Cesium OSM)
- Real countries + capitals + regions are mapped to the **sovereign ontology** (12 Generals + 16-probe Care Floor + sovereign composite)
- Each region has its own **3D rendered town** with sovereign tools that actually work
- Click any country → fly to capital → see the sovereign overlay + tools

---

## ✅ CHECKLIST

### Phase 1 — Real Country Data (DONE)
- [x] 33 sovereign hives already mapped to country capitals (London, Paris, Tokyo, etc.)
- [ ] Add 33 more country profiles (60+ total) — population, GDP, ISO codes, sovereign score
- [ ] Add regional sub-hives (provinces, cities)
- [ ] Add ocean/sea markers (North Sea, Pacific, Mediterranean)
- [ ] Add disputed territory overlay

### Phase 2 — Sovereign Ontology Overlay (IN PROGRESS)
- [x] 12 Generals already mapped (Argus, Scribe, Shield, Builder, Abacus, Lex, Scale, Crow, Gear, Voice, Owl, Dragon)
- [ ] Add GGeneral per region (Argus in Stockholm, Builder in Tokyo, etc.)
- [ ] Add sovereign composite per country (7.305 for UK, 5.0 for US, etc.)
- [ ] Add Care Floor per region (16-probe coverage)
- [ ] Add BFT 12-around-1 by region

### Phase 3 — 3D Towns on Real Coordinates (IN PROGRESS)
- [x] SovSpace UE5 master hub (sovspace.html) with Cesium globe
- [ ] Per-city 3D rendered town (procedurally generated from real OpenStreetMap data)
- [ ] Sky-touchable buildings (height from real OSM building heights)
- [ ] Roads from real OSM network
- [ ] Water bodies from real OSM
- [ ] BFT Temple per hive (already done for 12 Generals)

### Phase 4 — Interactive Tools (TODO)
- [ ] Country inspector (population, GDP, sovereign composite)
- [ ] Region audit tool (Care Floor probes for that region)
- [ ] Sovereign calculator (compute the region sovereign composite)
- [ ] Industry mapper (which industries / hives are in which country)
- [ ] Compliance passport tool (issue W3C VC per country)
- [ ] Live alerts panel (which regions are below Care Floor 0.95)
- [ ] DORADO 1-click sovereignty switcher (per region)

### Phase 5 — Real-World Data Integration (TODO)
- [ ] UN member states (193 countries)
- [ ] EU member states (27)
- [ ] G7/G20/G77
- [ ] NATO/Pact members
- [ ] World's sovereign wealth funds
- [ ] Major financial centres (London, NYC, Singapore, HK, Tokyo, Frankfurt)
- [ ] Major tech hubs (Silicon Valley, Shenzhen, Bangalore, Tel Aviv)

### Phase 6 — Mapping Real-World Tools (TODO)
- [ ] Healthcare: NHS trusts, care home chains, hospitals in capital
- [ ] Banking: 50 major banks mapped to specific hives
- [ ] Defence: NATO members with JSP 936 compliance
- [ ] Defence: 5-eyes / AUKUS / NATO / etc.
- [ ] Pharma: top 20 pharmaceutical companies
- [ ] iOK Farm: Yorkshire farm simulation
- [ ] 33 industries + their real companies

### Phase 7 — Sovereign Score Per Country (TODO)
- [ ] UK: 7.305 (sovereign composite baseline — CSOAI home)
- [ ] EU members: 6.5 (high)
- [ ] G7: 5.5
- [ ] G20: 5.0
- [ ] NATO: 6.0
- [ ] Developing: 3.5
- [ ] Failed states: 1.5

### Phase 8 — Real-Time Feeds (TODO)
- [ ] World Bank GDP data per country
- [ ] UN Human Development Index per country
- [ ] ITU ICT Development Index per country
- [ ] Press Freedom Index per country
- [ ] Corruption Perceptions Index per country
- [ ] OpenStreetMap boundaries per region

---

## 🐉 **3D WORLD PAGE PLAN**

### `/world.html` — THE REAL-WORLD 3D MAP
- Cesium globe (real earth)
- 60+ country capitals as markers
- Sovereign ontology overlay (12 Generals + Care Floor 0.95 per country)
- Click country → 3D flown to capital → sovereign panel opens
- Tools: Country Inspector / Region Audit / Sovereign Calculator / Compliance Passport / Alerts
- Real data sources: World Bank, UN, OSM, ITU

### `/atlas/country/[code].html` — per-country landing pages
- Country profile (population, GDP, ISO, language, sovereign score)
- Specific General assigned (Builder in Japan, Crow in US, etc.)
- BFT temple in capital city
- Tools: regional audit, sovereign passport, industry mapper
- Local language + sovereign i18n

### `/atlas/region/[province].html` — per-region pages
- Province/state profile (administrative region, capital, population)
- Per-region sovereign composite + Care Floor
- Industries mapped to hives
- Real-time alerts
- Tools: DORADO switcher, sovereignty calculator

### `/tools/country-inspector.html` — single inspector
- Single-page app, choose country, see all sovereign data
- BFT council deliberation for chosen country
- Sigil every action

### `/tools/sovereign-calculator.html` — calculator
- Input: GDP, population, sovereign maturity, care floor coverage
- Output: composite score 0-10
- Per General weight
- Per Care Floor probe

---

## 🐉 **THE 12 GENERALS → COUNTRIES ASSIGNMENT (PROPOSED)**

| General | Country Anchor | Reason |
|---|---|---|
| **Argus** (watchdog) | UK (London) | CSOAI home, all jurisdiction |
| **Scribe** (compliance) | US (NYC) | SEC, FINRA, NYSE |
| **Shield** (safety) | Germany (Berlin) | Defence industry stronghold |
| **Builder** (architect) | Japan (Tokyo) | Robotics + engineering |
| **Abacus** (quant) | Singapore | Financial hub |
| **Lex** (legal) | UK + Brussels (EU) | Legal capital |
| **Scale** (ethics) | Sweden (Stockholm) | Social democracy |
| **Crow** (risk) | India (Mumbai) | Risk ops centre |
| **Gear** (operations) | UAE (Dubai) | Logistics capital |
| **Voice** (comms) | USA (NYC) | Media capital |
| **Owl** (research) | France (Paris) | Research + AI |
| **Dragon** (sovereign) | CSOAI (UK 16939677) | Crown lineage |

---

## 🐉 **TODO IMMEDIATELY**

1. Build `/world.html` with Cesium globe + 60+ country markers + sovereign ontology overlay
2. Build `/tools/country-inspector.html` 
3. Build `/tools/sovereign-calculator.html`
4. Build per-country pages for top-20 countries
5. Add real-time feeds (UN, World Bank)
6. Build the per-region 3D towns

This is the BLACK SWAN of 3D worlds: countries mapped to sovereign ontology.
