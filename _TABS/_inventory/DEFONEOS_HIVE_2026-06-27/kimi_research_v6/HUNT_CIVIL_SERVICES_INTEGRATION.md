# HUNT: CIVIL SERVICES INTEGRATION GUIDE — POLICE, FIRE, HEALTH, GOVERNMENT

**Operation HUNT: DEFONEOS UK Public Sector Integration Strategy**

**Version:** 1.0
**Date:** August 2026
**Classification:** Strategic Research / Product Architecture

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [UK Police IT Systems](#2-uk-police-it-systems)
3. [UK Fire & Rescue IT Systems](#3-uk-fire--rescue-it-systems)
4. [UK Ambulance / NHS IT Systems](#4-uk-ambulance--nhs-it-systems)
5. [UK Local Government IT](#5-uk-local-government-it)
6. [UK Central Government IT](#6-uk-central-government-it)
7. [Technical Integration Architecture](#7-technical-integration-architecture)
8. [The "999 Integration" Product](#8-the-999-integration-product)
9. [Procurement Routes](#9-procurement-routes)
10. [Appendices](#10-appendices)

---

## 1. EXECUTIVE SUMMARY

### 1.1 The Opportunity

DEFONEOS expansion into UK public services represents a **multi-billion-pound market opportunity** spanning police, fire, ambulance, local government, and central government. The UK public sector spends over GBP 20 billion annually on IT, with significant pressure to modernise legacy systems, improve interoperability between services, and adopt AI-powered capabilities.

### 1.2 Key Findings

| Service | Core Systems | Key Vendors | AI Opportunity |
|---------|-------------|-------------|----------------|
| **Police** | LEDS (replacing PNC/PND), STORM CAD, Pronto, Niche RMS | Motorola, NEC, CGI, PA Consulting, Axon | Predictive policing, automated reporting, facial search, real-time intelligence |
| **Fire & Rescue** | Vision/Fortek (NEC), CAD systems, Airwave/ESN | NEC, Capita, Hexagon | Dynamic cover, predictive risk, automated mobilising, wildfire detection |
| **Ambulance/NHS** | CAD (Cleric, Hexagon I/CAD), NHS 111, FDP | Palantir (FDP), Hexagon, NEC, Advanced | Triage AI, hospital capacity, patient flow, predictive demand |
| **Local Government** | Idox Uniform, Civica, Agile, Arcus, NEC | Idox (69% of councils), Civica, NEC | Planning automation, fraud detection, smart city integration |
| **Central Government** | GDS platforms, GOV.UK Notify/Pay, LEDS | GDS, NCSC, Various cloud | Cross-service orchestration, cyber defence, data analytics |

### 1.3 The "999 Integration" Product

DEFONEOS should build **"999 Integration"** — a unified AI coordination layer that connects all three emergency services (police, fire, ambulance) plus local/central government, providing:

- **Shared situational awareness** across all services
- **Cross-service resource allocation** optimisation
- **AI-powered incident classification** and routing
- **Predictive demand modelling** across services
- **Unified command and control** interface

### 1.4 Market Size

| Segment | Est. Annual IT Spend | DEFONEOS Addressable |
|---------|---------------------|----------------------|
| Police IT | GBP 1.2B | GBP 200-400M |
| Fire & Rescue IT | GBP 300M | GBP 50-100M |
| Ambulance/NHS IT | GBP 5B+ | GBP 500M-1B |
| Local Government IT | GBP 3B | GBP 300-500M |
| Central Government IT | GBP 5B | GBP 200-400M |
| **Total** | **GBP 14.5B+** | **GBP 1.25-2.4B** |

---

## 2. UK POLICE IT SYSTEMS

### 2.1 Computer-Aided Dispatch (CAD) Systems

#### 2.1.1 Storm (Motorola Solutions / Steria)
- **Description:** One of the most widely deployed CAD systems in UK policing. Originally developed by Steria, now part of Motorola Solutions portfolio.
- **Deployment:** Multiple UK police forces
- **Integration:** Supports integration with Pronto mobile policing, PNC/LEDS, Airwave/ESN
- **API Status:** Legacy SOAP APIs; RESTful API wrappers available through integration layers
- **AI Integration Points:**
  - Incident classification and prioritisation
  - Predictive resource deployment
  - Automated incident-to-unit matching
  - Real-time risk assessment

#### 2.1.2 Athena CAD (ICS / Niche Technology)
- **Description:** Streamlined CAD with "ClosestTo" proprietary algorithm for nearest unit dispatch
- **Deployment:** Used by multiple UK police agencies
- **Key Features:** Officer safety alerts (guns, dogs, hazards), building floor plans, CCTV integration
- **API Status:** Vendor-specific APIs; integration via professional services
- **AI Integration Points:**
  - ClosestTo algorithm enhancement with ML
  - Automated hazard detection
  - Real-time situational awareness
  - Predictive deployment

#### 2.1.3 Hexagon I/CAD (formerly Intergraph)
- **Description:** Leading incident management solution used across all three emergency services
- **Deployment:** 30+ UK public safety agencies; unique in serving all three emergency services
- **Integration:** CAD-to-CAD communication for multi-agency coordination; Frequentis partnership for control room comms
- **API Status:** Supports both pre-built and custom interface development; CAD-to-CAD protocols
- **AI Integration Points:**
  - Cross-service incident correlation
  - Real-time resource visualisation
  - Multi-agency coordination
  - Automated escalation

#### 2.1.4 Pronto (Motorola Solutions)
- **Description:** Most widely deployed mobile policing solution in the UK — 66,000+ users
- **Deployment:** Police Scotland, Wiltshire Police, Surrey and Sussex Police, and many more
- **Key Features:** Mobile data capture, PNC/LEDS searching, body-worn camera integration (CommandCentral Vault), driver licence image access
- **API Status:** RESTful and SOAP APIs; integrates with STORM, NSPIS, I/CAD, Niche, Northgate Connect, UNIFI
- **Cloud:** Hosted on Motorola private cloud
- **AI Integration Points:**
  - Mobile AI assistant for officers
  - Automated form completion
  - Real-time intelligence at point of need
  - Digital evidence auto-tagging

#### 2.1.5 Niche RMS (Niche Technology / Motorola)
- **Description:** Records Management System used by many UK forces
- **Integration:** Pronto integration for mobile access; LEDS integration
- **API Status:** Available via professional services integration

### 2.2 National Police Data Systems

#### 2.2.1 LEDS — Law Enforcement Data Service
- **Status:** Replacing PNC; target PNC decommission March 2026
- **Architecture:** Cloud-based, microservices, API-driven
- **Products:**
  - **Property Product:** Live — first step in decoupling from PNC
  - **Person Product (Release 1):** Live — search across most PNC person data
  - **Two-Way Replication:** Create/amend/delete in LEDS synced with PNC
- **Access:** Via NIAM (National Identity Access Management) — all 43 forces connected, 45 organisations consuming
- **API Strategy:** RESTful APIs; "transition before transformation" approach
- **Key Contractor:** PA Consulting (GBP 37.5M direct award for Person phase)
- **Security:** OFFICIAL classification; BS10008 certification for evidential weight
- **Cost:** Programme commonly cited as GBP 900M, 12-year programme

#### 2.2.2 PNC — Police National Computer
- **Status:** Legacy system since 1974; being replaced by LEDS
- **Current Support:** Fujitsu Services (GBP 48M, Apr 2022–Mar 2026)
- **Usage:** 133 million searches/updates in 2019-20
- **Users:** All 45 UK police forces + 127 other organisations

#### 2.2.3 PND — Police National Database
- **Status:** 4 billion+ pieces of police intelligence; separate modernisation programme ("PND 1.5")
- **Contractor:** CGI IT UK Ltd (fixed-price milestones to Mar 2026)
- **Modernisation:** Cloud migration to Law Enforcement Cloud Platform

#### 2.2.4 NIAM — National Identity Access Management
- **Purpose:** Unified authentication for all national policing applications
- **Technology:** Federation via SailPoint and force identity providers
- **Access Control:** Role-based entitlements based on job function
- **Assurance:** SyAP (Security Assessment for Policing), TPAP (Third Party Assurance for Policing)

### 2.3 NPCC Data Standards

#### 2.3.1 National Policing Standards Library
- **Scope:** 200+ nationally assured standards
- **Key Areas:** Data standards, cyber standards, technology standards, procurement guidance
- **Access:** Open and accessible to policing and supplier community

#### 2.3.2 Key Data Standards
- **POLE:** Person, Object, Location, Event data model
- **ANPR Standards (NASPLE):** National ANPR Standards for Policing and Law Enforcement
- **Data Ethics Framework:** Incorporates NPCC AI Covenant
- **AI Playbook for Policing:** Published 2025 by College of Policing

#### 2.3.3 AI in Policing — Approved Use Cases
- Automated document redaction
- Synthesis of complex data (structured summaries)
- Enhanced search
- Support for responding to requests (voice call analysis)
- Digital enquiries (natural language routing)

### 2.4 Police APIs and Integration Points

#### 2.4.1 data.police.uk API
- **Type:** Public RESTful JSON API
- **Data Available:**
  - Street-level crime and outcome data
  - Neighbourhood team members and events
  - Stop and search data by area
  - Force information and senior officers
- **Authentication:** Not required for basic access
- **Rate Limits:** Yes (documented)
- **DEFONEOS Use:** Demand modelling, crime prediction, resource planning

#### 2.4.2 LEDS APIs
- **Type:** RESTful, microservices architecture
- **Access:** Via NIAM authentication; role-based entitlements
- **Future:** Platform for innovation; API-driven federation with other data services

#### 2.4.3 techUK Interoperability Initiative
- **Goal:** Standardise APIs for policing technology suppliers
- **Approach:** Open, well-documented APIs (following Xero/Salesforce model)
- **Status:** Growing community of suppliers; procurement pressure building

### 2.5 Key Vendors and Procurement

| Vendor | Products | Role |
|--------|----------|------|
| **Motorola Solutions** | Pronto, STORM, Airwave, CommandCentral | Mobile policing, CAD, radio, evidence |
| **NEC Software Solutions** | Vision/Fortek (Fire), Sova (Ambulance), various CAD | Control systems across emergency services |
| **Axon** | Body cameras, TASER, digital evidence | Frontline technology |
| **CGI** | PND support and modernisation | National policing systems |
| **PA Consulting** | LEDS Person product delivery | LEDS programme delivery |
| **Hexagon** | I/CAD, incident management | Cross-service CAD |
| **Frequentis** | Control room communications | Control room integration partner |
| **Civica** | Various police IT solutions | Force-level systems |

### 2.6 NPAS — National Police Air Service

- **Function:** Provides centralised air support to all 43 police forces in England and Wales
- **Fleet:** Mix of helicopters and fixed-wing aircraft
- **IT Integration:** Airbus Helionix avionics on H135 helicopters
- **Recent Order:** 7x Airbus H135s (March 2025)
- **DEFONEOS Integration:** Air asset tracking, drone coordination, aerial ISR integration

### 2.7 NCA — National Crime Agency

- **Role:** National law enforcement against serious/organised crime
- **LEDS Access:** Connected as of July 2024
- **IT Systems:** Classified; integration via national systems
- **DEFONEOS Integration:** Intelligence sharing (via LEDS), cyber crime coordination

---

## 3. UK FIRE & RESCUE IT SYSTEMS

### 3.1 Mobilising Systems

#### 3.1.1 NEC Software Solutions (formerly Capita Fortek Vision)
- **Description:** Dominant mobilising platform in UK fire and rescue
- **Products:**
  - **Vision 4:** Command and control mobilising platform — shared across multiple authorities
  - **Vision 5:** Next-generation system being deployed (London Fire Brigade)
- **Key Deployment:** London Fire Brigade — GBP 20M contract signed February 2025
  - WhatsApp and social media integration for public contact
  - Real-time translation function for non-English speakers
  - Real-time data analytics for linked incident detection
  - Dynamic cover visualisation and resource movement suggestions
  - Go-live: October 2026
- **Other Users:** Surrey, Isle of Wight, Northamptonshire, Warwickshire, Thames Valley partners
- **API Status:** Limited published APIs; integration via NEC professional services
- **AI Integration Points:**
  - Predictive dynamic cover optimisation
  - Automated resource reallocation
  - Incident clustering and duplicate detection
  - Multi-language call handling AI
  - Smoke/fire detection from CCTV/drone feeds

#### 3.1.2 Hexagon I/CAD (Fire Deployment)
- **Description:** Cross-service CAD used by some fire services
- **Integration:** CAD-to-CAD with police and ambulance systems
- **Partnership:** Frequentis for control room communications
- **AI Integration Points:** Cross-service incident coordination

### 3.2 Fire Control Room Modernisation

#### 3.2.1 Shared Control Room Initiatives
Multiple fire authorities have implemented shared control rooms:

| Partnership | Configuration | System |
|-------------|--------------|--------|
| Northamptonshire + Warwickshire | Shared Vision 4 platform, two locations | Vision 4 |
| Surrey + Isle of Wight | Joint Emergency Communications Centre, Reigate | Fortek Vision |
| Thames Valley (Oxfordshire, Berkshire, Bucks, MK) + Northamptonshire + Warwickshire | 5-authority SAN H partnership | Shared SAN H |

#### 3.2.2 Government Policy: Future Control Room Improvement
- **Driver:** Efficiency, resilience, and interoperability
- **Technology:** Shared integrated communications control systems, AVLS (Automatic Vehicle Location), mobile data terminals, Airwave/ESN integration
- **Trend:** Consolidation toward fewer, larger, shared control rooms

### 3.3 NFCC Data Standards

#### 3.3.1 NFCC Technology Strategy
- **Focus areas:** Interoperability, data sharing, common standards
- **Key Challenge:** Like police, fire services have historically procured independently, creating incompatible systems
- **Standards:** Working toward common data formats for incident reporting, resource status, and cross-border mobilisation

#### 3.3.2 Integration Standards
- **Airwave/ESN:** All fire services use Airwave (transitioning to ESN by ~2028-2029)
- **JESIP:** Joint Emergency Services Interoperability Programme — standard for multi-agency response
- **M/ETHANE:** Common messaging framework for incident reporting

### 3.4 Drone and Technology Deployment

#### 3.4.1 Current State
- Many FRSs deploying drones for incident reconnaissance
- Integration with control room systems often manual
- No unified drone management platform across services

#### 3.4.2 DEFONEOS Opportunity
- **Drone Operations Hub:** Centralised drone tasking across fire services
- **Wildfire Detection:** AI-powered thermal/smoke detection from drone/distributed sensor feeds
- **3D Incident Modelling:** Real-time point cloud generation for incident command

### 3.5 Wildfire and Environmental Risk

#### 3.5.1 Emerging Requirements
- Climate change increasing wildfire risk in UK
- Need for predictive risk modelling
- Integration with Met Office data, satellite imagery, ground sensors
- Cross-border coordination capability

#### 3.5.2 DEFONEOS Opportunity
- **Wildfire AI:** Predictive risk mapping using weather, terrain, vegetation data
- **Sensor Integration:** IoT sensor network for early detection
- **Cross-Service Coordination:** Automatic escalation between fire, police, ambulance

### 3.6 Fire Service APIs and Integration Points

| System | API Type | Integration Approach |
|--------|----------|---------------------|
| NEC Vision | Vendor-specific | Professional services / custom integration |
| Hexagon I/CAD | CAD-to-CAD, custom interfaces | Pre-built and custom API development |
| AVLS systems | Proprietary / GPS standards | Location data feeds |
| Mobile Data Terminals | Proprietary | Custom device integration |
| Airwave/ESN | Mission-critical comms API | ESN APIs (future) |

---

## 4. UK AMBULANCE / NHS IT SYSTEMS

### 4.1 Ambulance CAD Systems

#### 4.1.1 Cleric Computer Services
- **Description:** Long-established UK ambulance CAD provider (30+ years)
- **Deployment:** South East Coast Ambulance (SECAmb) and at least 3 other UK trusts
- **Features:** 999 and urgent care dispatch, patient data recording, crew communication
- **Recent:** SECAmb rollout (2017) replacing 10+ year old system

#### 4.1.2 Hexagon I/CAD
- **Description:** Cross-service CAD (same platform used by police and fire)
- **Deployment:** Multiple UK emergency services
- **Advantage:** True multi-agency CAD-to-CAD capability

#### 4.1.3 Sova (NEC Software Solutions)
- **Description:** Ambulance-specific CAD and rostering solution
- **Deployment:** Various UK ambulance trusts
- **Integration:** NHS 111 transfers, clinical applications, PDS, OS mapping

#### 4.1.4 Optima (Advanced)
- **Description:** NHS scheduling and optimisation platform
- **Use:** Ambulance resource planning and rostering

#### 4.1.5 South Central Ambulance Service CAD Procurement (2025)
- **Value:** 12-year contract (6+3x2 years)
- **Requirements:**
  - COTS CAD system for 999 operations
  - Integration with NHS 111 (transfers of callers and records)
  - Clinical applications for frontline crews
  - Ordnance Survey, Terrafix, PDS integration
  - Full audit trail

### 4.2 NHS 111 and Integrated Urgent Care

#### 4.2.1 NHS 111
- **Function:** First line of defence for Urgent and Emergency Care (UEC)
- **Capabilities:**
  - Direct bookings into GP practices
  - Community pharmacy referrals
  - Urgent Treatment Centre (UTC) appointments
  - Mental health crisis access (universal by 2023/24)
- **Integration:** Single Clinical Assessment Service (CAS) connecting GPs, ambulance, community teams, social care

#### 4.2.2 Clinical Assessment Service (CAS)
- **Function:** Single point of access for health professionals to request urgent response
- **Technology:** Integrated with ambulance CAD, NHS systems

### 4.3 NHS Digital APIs and Integration

#### 4.3.1 NHS API Platform
- **Type:** RESTful APIs with varying complexity
- **Standards:** FHIR R4 (UK Core), OAuth 2.0, JWT, NHS Smartcards
- **Security:** NHS Digital DSPT compliance, IG Toolkit, Cyber Essentials

#### 4.3.2 Key NHS APIs

| API | Purpose | Access Level |
|-----|---------|-------------|
| **PDS (Personal Demographics Service)** | Patient identity, NHS number verification | Authenticated (Smartcard/CIS2) |
| **GP Connect** | Access GP practice data | NHS organisational approval |
| **EPS (Electronic Prescription Service)** | Prescription management | Authenticated |
| **ODS (Organisation Data Service)** | NHS organisation lookup | Public |
| **FHIR APIs** | Clinical data exchange (FHIR R4 UK Core) | Varies by endpoint |

#### 4.3.3 NHS Interoperability Standards
- **FHIR UK Core:** NHS strategic standard for API-based data exchange
- **ITK (Interoperability Toolkit):** National standards, frameworks, implementation guides
- **Mandatory Standards:**
  - DCB0129: Clinical risk management for health IT manufacturers
  - DCB0160: Clinical risk management for deployment and use

### 4.4 NHS Federated Data Platform (FDP)

#### 4.4.1 Overview
- **Contractor:** Palantir Technologies (Foundry platform)
- **Purpose:** NHS-wide data integration and analytics platform
- **Policy:** "FDP first" — all systems should connect digital and data infrastructure to FDP
- **Architecture:** Federated model — 4 adoption patterns from decentralised to nationally provisioned

#### 4.4.2 FDP Technical Architecture
- **Canonical Data Model:** Common structural layer for all NHS data
- **Integration Patterns:** CSV via API, FHIR, direct EPR integration
- **Platform:** Palantir Foundry (ontology-driven operating model)
- **Security:** Five Data Safes framework, pseudonymisation, access controls

#### 4.4.3 FDP Integration for DEFONEOS
- **Opportunity:** DEFONEOS can feed operational data (ambulance status, hospital capacity, incident data) into FDP
- **Approach:** Map DEFONEOS data to FDP Canonical Data Model
- **Products:** Elective recovery, patient flow, discharge, outpatient transformation

#### 4.4.4 Faster Data Flows (FDF)
- **Purpose:** Automated daily data collection replacing manual SitReps
- **Data:** Current inpatients, admissions, discharges, outpatients
- **Format:** CSV files submitted via secure API
- **Access:** NHS National Data Platform with trust-level dashboards

### 4.5 Air Ambulance / HEMS

#### 4.5.1 Association of Air Ambulances (AOAA)
- **Dispatch:** Tasking primarily by ambulance services
- **Challenge:** 20-40% mission cancellation rate due to poor tasking
- **Need:** AI-powered tasking criteria, predictive deployment

#### 4.5.2 DEFONEOS Opportunity
- **HEMS Tasking AI:** Predict which incidents need air ambulance
- **Cross-service Coordination:** Automatic police/fire notification for HEMS landing sites
- **Outcome Tracking:** Link HEMS dispatch to patient outcomes

### 4.6 Hospital Capacity APIs

#### 4.6.1 Current State
- **FDF (Faster Data Flows):** Daily automated capacity data to NHS England
- **ED APIs:** Some trusts expose real-time A&E waiting data
- **e-Referral Service:** NHS API for referral management

#### 4.6.2 DEFONEOS Opportunity
- **Real-time Capacity Feed:** Integrate ambulance CAD with hospital capacity
- **Smart Routing:** AI-powered hospital selection based on capacity, specialty, travel time
- **Predictive Bed Management:** Forecast demand from ambulance dispatch data

---

## 5. UK LOCAL GOVERNMENT IT

### 5.1 Council Systems Landscape

#### 5.1.1 Planning Systems
- **Idox:** Market leader — 69% of UK councils, 100% of Scottish councils. Products: Uniform (legacy), Idox Cloud (new SaaS platform)
- **Agile Applications:** Agile case management for planning
- **Arcus Global:** Cloud-based planning solutions
- **Civica:** Back-office and planning solutions
- **NEC:** Document management, various council services
- **DEF (Digital Enablement Framework):** Planning digital services

#### 5.1.2 Other Council Systems
- **Revenue and Benefits:** Civica, Capita, NEC
- **Social Care:** Liquidlogic, Servelec, System C
- **Waste Management:** Various commercial solutions
- **Parking/Enforcement:** Various; often outsourced
- **Housing:** Various; increasingly cloud-based

### 5.2 LGSS — Local Government Security Standards

#### 5.2.1 Cyber Security
- **Cyber Essentials:** Minimum requirement for most councils
- **Cyber Essentials Plus:** Higher standard for sensitive services
- **NCSC Guidance:** Active Cyber Defence tools available
- **DSPT (Data Security and Protection Toolkit):** For health-adjacent services

#### 5.2.2 Data Standards
- **Local Government Association (LGA):** Promoting data standards across councils
- **Open Data:** Increasing pressure for open data publishing
- **API Standards:** Following GDS RESTful JSON standards

### 5.3 Smart City Initiatives

#### 5.3.1 LOTI — London Office of Technology and Innovation
- **Membership:** 27 London boroughs, GLA, London Councils
- **Focus:** Data innovation, AI, smart city projects
- **Key Standard:** BSI PAS 185:2017 (Smart Cities security)
- **API Requirements:** Open data APIs, monitored for performance

#### 5.3.2 Smart City Platform Architecture
- **API Layer:** RESTful APIs with common data formatting
- **Security:** Access gates, pseudonymisation, encryption
- **Standards:** ITU standards for smart city platforms
- **Data:** IoT sensor data, transport, environment, utilities

### 5.4 AI in Local Government

#### 5.4.1 Current Adoption
- **Chatbots:** Call centre demand reduction
- **Predictive Maintenance:** Pothole prediction, building maintenance
- **Fraud Detection:** Council tax fraud, planning enforcement
- **Document Processing:** Planning application automation
- **Social Care:** Risk prediction, demand forecasting

#### 5.4.2 Barriers
- Limited capacity, capabilities, and funding
- Skills gaps
- Legacy systems and API barriers
- Data quality issues
- Ethics and GDPR compliance

### 5.5 DEFONEOS Integration Points

| Council Data | DEFONEOS Application |
|-------------|---------------------|
| Planning data | Predictive enforcement, fraud detection |
| Housing data | Vulnerability identification for emergency planning |
| Environmental data | Flood/wildfire risk modelling |
| Transport data | Traffic management for emergency response |
| Population data | Demand modelling |
| Council tax data | Fraud detection |

### 5.6 Local Government APIs

#### 5.6.1 Current State
- **Fragmented:** Each council has different systems
- **Growing:** Movement toward standardised APIs (following GDS)
- **Key Standards:** RESTful JSON, OpenAPI documentation
- **Authentication:** API keys, OAuth 2.0

#### 5.6.2 DEFONEOS Approach
- Build **canonical adapters** for major council systems (Idox, Civica, Agile)
- Create **unified local government API layer**
- Support **Open Data standards** for public information

---

## 6. UK CENTRAL GOVERNMENT IT

### 6.1 GDS — Government Digital Service

#### 6.1.1 GDS Standards
- **API Standards:** RESTful JSON, HTTPS (TLS 1.2+), UTF-8 encoding
- **Design Principles:** Start with user needs, do less, design with data
- **Technology Guidelines:** Open source, open standards, cloud-first

#### 6.1.2 GOV.UK Platform Services

| Service | Purpose | API |
|---------|---------|-----|
| **GOV.UK Notify** | SMS, email, letter notifications | RESTful API (JSON) |
| **GOV.UK Pay** | Payment processing | RESTful API (JSON) |
| **GOV.UK One Login** | Authentication (limited for local govt) | OpenID Connect |
| **GOV.UK PaaS** | Platform as a Service (being retired) | Cloud Foundry |

#### 6.1.3 GOV.UK Notify
- **Eligibility:** Central government, local authority, NHS
- **Security:** OFFICIAL classification, SC-cleared staff, DPA compliant
- **Integration:** .NET client, RESTful API, multiple language SDKs
- **Features:** Email, SMS, letters; real-time delivery tracking
- **Pricing:** Pay per message; competitive rates

### 6.2 Cyber Security Architecture

#### 6.2.1 NCSC — National Cyber Security Centre
- **Mission:** Make UK the safest place to live and work online
- **Active Cyber Defence (ACD):** Free tools for eligible organisations
  - Early Warning (vulnerability alerts)
  - Check Your Cyber Security (self-assessment)
  - Suspicious Email Reporting Service (SERS)
  - Mail Check (email security)
  - Exercise in a Box (incident response training)
- **ACD 2.0:** Next-generation expanded programme

#### 6.2.2 Government Cyber Coordination Centre (GC3)
- **Purpose:** Coordinated government-wide cyber defence
- **Function:** Cross-government threat intelligence, incident coordination
- **Status:** Operational since ~2020

#### 6.2.3 National Cyber Force (NCF)
- **Established:** 2020
- **Partnership:** GCHQ + MOD + MI6 + Dstl
- **Role:** Offensive and defensive cyber operations
- **Command:** Air Vice-Marshal Tim Neal-Hopes (2023)
- **Budget:** ~GBP 76M first year; part of GBP 1.9B cyber investment
- **Accountability:** Joint FCDO and Defence Secretaries
- **Legal Framework:** Intelligence Services Act, Investigatory Powers Act

#### 6.2.4 DEFONEOS Cyber Integration
- **Opportunity:** DEFONEOS can integrate NCSC ACD tools
- **Threat Intel:** Feed into DEFONEOS security operations
- **Compliance:** Align with NCSC Cyber Assessment Framework

### 6.3 Data Standards and Architecture

#### 6.3.1 Government Security Classifications
- **OFFICIAL:** Most government data (includes LEDS, most NHS data)
- **OFFICIAL-SENSITIVE:** Some LEDS data
- **SECRET/ TOP SECRET:** Limited; not in scope for DEFONEOS civil integration

#### 6.3.2 GOV.UK API Standards
- RESTful design (proper HTTP verbs)
- JSON format
- HTTPS with TLS 1.2+
- UTF-8 encoding
- Semantic versioning in URIs
- OpenAPI documentation
- OAuth 2.0 for authentication

### 6.4 Central Government Integration Points for DEFONEOS

| System | DEFONEOS Integration |
|--------|---------------------|
| **LEDS** | Real-time intelligence for police operations |
| **FDP** | NHS operational data sharing |
| **GOV.UK Notify** | Emergency alert messaging |
| **NCSC ACD** | Cyber threat intelligence |
| **Resilience Direct** | Multi-agency incident coordination |
| **Met Office APIs** | Weather data for predictive models |
| **Ordnance Survey** | Mapping and geolocation |

---

## 7. TECHNICAL INTEGRATION ARCHITECTURE

### 7.1 DEFONEOS Platform Architecture

```
                    +----------------------------------------+
                    |           DEFONEOS CORE PLATFORM        |
                    |  (AI Engine, Data Lake, Analytics)      |
                    +----------------------------------------+
                                      |
           +--------------------------+--------------------------+
           |                          |                          |
    +------v------+          +--------v--------+        +-------v-------+
    |  MCP GATEWAY |          |   MCP GATEWAY   |        |   MCP GATEWAY  |
    |   POLICE     |          |     FIRE        |        |    AMBULANCE   |
    +------+------+          +--------+--------+        +-------+-------+
           |                          |                          |
    +------v------+          +--------v--------+        +-------v-------+
    | LEDS API    |          | NEC Vision API  |        | NHS FDP API   |
    | PNC/Pronto  |          | Hexagon I/CAD   |        | CAD APIs      |
    | STORM CAD   |          | AVLS Feeds      |        | PDS/FHIR      |
    | Niche RMS   |          | Airwave/ESN     |        | NHS 111       |
    | ANPR/NAS    |          | M/ETHANE        |        | Hospital Cap  |
    +-------------+          +-----------------+        +---------------+
           |                          |                          |
           +--------------------------+--------------------------+
                                      |
                    +-----------------v------------------+
                    |      UNIFIED DATA LAYER            |
                    |  (Canonical Model, Ontology)       |
                    +------------------------------------+
                                      |
           +--------------------------+--------------------------+
           |                          |                          |
    +------v------+          +--------v--------+        +-------v-------+
    |  LOCAL GOV  |          |   CENTRAL GOV   |        |     OTHER     |
    |   MCP GW    |          |     MCP GW      |        |    MCP GW     |
    +------+------+          +--------+--------+        +-------+-------+
           |                          |                          |
    +------v------+          +--------v--------+        +-------v-------+
    | Idox/Agile  |          | GOV.UK APIs     |        | Met Office    |
    | Civica/Arcus|          | NCSC ACD        |        | OS Maps       |
    | Council Data|          | Resilience Dir  |        | Environment   |
    | Smart City  |          | LEDS (central)  |        | Agency        |
    +-------------+          +-----------------+        +---------------+
```

### 7.2 MCP Server Design — Per Service

#### 7.2.1 POLICE MCP SERVER
```yaml
name: defoneos-police-mcp
version: 1.0.0
endpoints:
  - name: led_search
    description: Search LEDS person/vehicle/property records
    auth: NIAM_JWT
    rate_limit: 1000/min
  - name: incident_create
    description: Create incident in force CAD
    auth: FORCE_API_KEY
    rate_limit: 500/min
  - name: unit_status
    description: Get/update unit status and location
    auth: FORCE_API_KEY
    rate_limit: 2000/min
  - name: intelligence_query
    description: Query local/national intelligence
    auth: NIAM_JWT
    rate_limit: 500/min
  - name: anpr_query
    description: Query ANPR hits and VOI
    auth: NASPLE_CERT
    rate_limit: 2000/min
  - name: crime_prediction
    description: AI-powered crime hotspot prediction
    auth: DEFONEOS_API_KEY
    rate_limit: 100/min
  - name: demand_forecast
    description: Predict demand by area and time
    auth: DEFONEOS_API_KEY
    rate_limit: 100/min
integrations:
  - LEDS (RESTful)
  - Pronto (RESTful/SOAP)
  - STORM CAD (proprietary adapter)
  - Niche RMS (API adapter)
  - ANPR/NAS (NASPLE-compliant)
  - Airwave/ESN (ESN API)
```

#### 7.2.2 FIRE MCP SERVER
```yaml
name: defoneos-fire-mcp
version: 1.0.0
endpoints:
  - name: mobilise_resource
    description: Mobilise fire appliance/resource
    auth: FIRE_API_KEY
    rate_limit: 500/min
  - name: incident_status
    description: Get incident status and resource allocation
    auth: FIRE_API_KEY
    rate_limit: 1000/min
  - name: dynamic_cover
    description: Get/set dynamic cover positions
    auth: FIRE_API_KEY
    rate_limit: 200/min
  - name: avls_feed
    description: Real-time vehicle location feed
    auth: FIRE_API_KEY
    rate_limit: 5000/min
  - name: risk_assessment
    description: AI-powered risk assessment for premises/area
    auth: DEFONEOS_API_KEY
    rate_limit: 100/min
  - name: wildfire_prediction
    description: Wildfire risk prediction
    auth: DEFONEOS_API_KEY
    rate_limit: 50/min
  - name: drone_deploy
    description: Request drone deployment
    auth: FIRE_API_KEY
    rate_limit: 50/min
integrations:
  - NEC Vision (API adapter)
  - Hexagon I/CAD (CAD-to-CAD)
  - AVLS systems (GPS feed)
  - Mobile Data Terminals (custom)
  - Airwave/ESN (ESN API)
  - Drone platforms (MAVLink/RTSP)
```

#### 7.2.3 AMBULANCE MCP SERVER
```yaml
name: defoneos-ambulance-mcp
version: 1.0.0
endpoints:
  - name: incident_create
    description: Create ambulance incident
    auth: AMBULANCE_API_KEY
    rate_limit: 1000/min
  - name: dispatch_resource
    description: Dispatch ambulance resource
    auth: AMBULANCE_API_KEY
    rate_limit: 500/min
  - name: epr_query
    description: Query Electronic Patient Record
    auth: NHS_SMARTCARD + FHIR
    rate_limit: 500/min
  - name: hospital_capacity
    description: Get real-time hospital capacity
    auth: FDP_TOKEN
    rate_limit: 200/min
  - name: triage_assist
    description: AI-powered triage decision support
    auth: DEFONEOS_API_KEY
    rate_limit: 500/min
  - name: demand_prediction
    description: Predict ambulance demand
    auth: DEFONEOS_API_KEY
    rate_limit: 100/min
  - name: hems_tasking
    description: Air ambulance tasking recommendation
    auth: DEFONEOS_API_KEY
    rate_limit: 50/min
integrations:
  - Ambulance CAD (Cleric/Hexagon/Sova adapter)
  - NHS FDP (Palantir Foundry API)
  - PDS (NHS FHIR API)
  - GP Connect (FHIR)
  - Faster Data Flows (CSV API)
  - NHS 111 (CAS integration)
  - Airwave/ESN (ESN API)
```

#### 7.2.4 LOCAL GOVERNMENT MCP SERVER
```yaml
name: defoneos-localgov-mcp
version: 1.0.0
endpoints:
  - name: planning_query
    description: Query planning applications
    auth: COUNCIL_API_KEY
    rate_limit: 500/min
  - name: environmental_data
    description: Get environmental sensor data
    auth: COUNCIL_API_KEY
    rate_limit: 200/min
  - name: housing_data
    description: Query housing/vulnerability data
    auth: COUNCIL_API_KEY + IG
    rate_limit: 100/min
  - name: fraud_detect
    description: AI-powered fraud detection
    auth: DEFONEOS_API_KEY
    rate_limit: 100/min
  - name: demand_forecast
    description: Predict service demand
    auth: DEFONEOS_API_KEY
    rate_limit: 50/min
integrations:
  - Idox Uniform/Cloud (API adapter)
  - Agile Applications (API adapter)
  - Arcus Global (API adapter)
  - Civica (API adapter)
  - NEC systems (API adapter)
  - Smart city platforms (IoT APIs)
```

#### 7.2.5 CENTRAL GOVERNMENT MCP SERVER
```yaml
name: defoneos-centralgov-mcp
version: 1.0.0
endpoints:
  - name: gov_notify
    description: Send alerts via GOV.UK Notify
    auth: NOTIFY_API_KEY
    rate_limit: 10000/min
  - name: cyber_threat_intel
    description: Get NCSC threat intelligence
    auth: ACD_API_KEY
    rate_limit: 100/min
  - name: weather_data
    description: Get Met Office weather data
    auth: METOFFICE_API_KEY
    rate_limit: 500/min
  - name: mapping
    description: Ordnance Survey mapping
    auth: OS_API_KEY
    rate_limit: 1000/min
  - name: resilience_coord
    description: Resilience Direct integration
    auth: RD_API_KEY
    rate_limit: 200/min
integrations:
  - GOV.UK Notify (RESTful JSON)
  - NCSC ACD (ACD APIs)
  - Resilience Direct (API)
  - Met Office DataPoint (RESTful)
  - Ordnance Survey (RESTful)
  - LEDS Central (LEDS API)
```

### 7.3 Middleware Requirements

#### 7.3.1 API Gateway
- **Technology:** Kong, AWS API Gateway, or Azure API Management
- **Functions:** Authentication, rate limiting, request transformation, logging
- **Security:** TLS 1.2+, OAuth 2.0, API key management

#### 7.3.2 Data Transformation Layer
- **Purpose:** Convert between service-specific formats and DEFONEOS canonical model
- **Components:**
  - **FHIR Transformer:** NHS data <-> canonical model
  - **POLE Transformer:** Police data <-> canonical model
  - **NFCC Transformer:** Fire data <-> canonical model
  - **LocalGov Transformer:** Council data <-> canonical model

#### 7.3.3 Event Bus
- **Technology:** Apache Kafka or AWS EventBridge
- **Purpose:** Real-time event streaming between services
- **Topics:**
  - `incidents.all` — All incidents across services
  - `resources.all` — Resource status across services
  - `alerts.critical` — Critical alerts
  - `intelligence.new` — New intelligence

#### 7.3.4 Data Lake
- **Purpose:** Store historical data for AI training and analytics
- **Architecture:** Cloud-native (AWS S3/Azure Blob + Delta Lake)
- **Governance:** Data classification per Government Security Classifications
- **Retention:** Per service data retention policies

### 7.4 Security Architecture

#### 7.4.1 Authentication & Authorisation
- **Police:** NIAM (SailPoint federation)
- **NHS:** NHS Smartcard / CIS2 / OAuth 2.0
- **Fire:** Service-specific (migrating toward NIAM pattern)
- **Ambulance:** NHS authentication + service-specific
- **Local Gov:** OAuth 2.0 / OpenID Connect
- **Central Gov:** GOV.UK One Login (where available)

#### 7.4.2 Network Security
- **Connectivity:** Health and Social Care Network (HSCN) for NHS; Police National Network (PNN) for policing; PSN for wider public sector
- **Encryption:** TLS 1.2+ in transit; AES-256 at rest
- **API Security:** OAuth 2.0, JWT, rate limiting, DDoS protection

#### 7.4.3 Compliance Requirements
- **Police:** NPCC data standards, NASPLE, BS10008, MoPI
- **NHS:** GDPR, DPA 2018, DSPT, DCB0129/0160, FHIR UK Core
- **Fire:** NFCC standards, Fire and Rescue Authority policies
- **Local Gov:** GDPR, LGSS, Cyber Essentials Plus
- **Central Gov:** OFFICIAL classification, Government Security Classifications Policy

### 7.5 Deployment Architecture

```
+------------------------------------------------------------------+
|                    DEFONEOS CIVIL PLATFORM                        |
|                                                                   |
|  +--------------+  +--------------+  +-------------------------+ |
|  |   API GATEWAY |  |  TRANSFORM   |  |      AI ENGINE          | |
|  |   (Kong/AWS)  |  |   LAYER      |  |  (ML/LLM/Computer Vision)| |
|  +------+-------+  +------+-------+  +------------+------------+ |
|         |                 |                      |               |
|  +------v-------+  +------v-------+  +----------v-----------+   |
|  |  EVENT BUS   |  |  DATA LAKE   |  |  ANALYTICS/REPORTING  |   |
|  |   (Kafka)    |  | (S3/Delta)   |  |    (PowerBI/Grafana)  |   |
|  +--------------+  +--------------+  +-----------------------+   |
|                                                                   |
|  +-----------------------------------------------------------+   |
|  |              MCP SERVER ORCHESTRATION                       |   |
|  |         (Police | Fire | Ambulance | Local | Central)      |   |
|  +-----------------------------------------------------------+   |
+------------------------------------------------------------------+
```

---

## 8. THE "999 INTEGRATION" PRODUCT

### 8.1 Product Vision

**999 Integration** is DEFONEOS's flagship multi-agency coordination platform — a single AI-powered system that connects police, fire, and ambulance services with local and central government, providing shared situational awareness and intelligent cross-service resource coordination.

**Tagline:** *"One view. One response. One platform."*

### 8.2 Core Capabilities

#### 8.2.1 Shared Situational Awareness
- **Unified Incident Map:** Real-time overlay of all incidents, units, and hazards across police, fire, and ambulance
- **Cross-service Incident Linking:** Automatically detect related incidents (e.g., RTC requiring police + ambulance + fire)
- **Common Operating Picture:** Single dashboard for multi-agency commanders
- **M/ETHANE Integration:** Structured incident reporting following JESIP standards
- **Media Fusion:** Integrate CCTV, body-worn video, drone footage, social media into unified view

#### 8.2.2 AI-Powered Incident Coordination
- **Smart Classification:** AI analyses incoming 999 calls and automatically classifies incident type, severity, and required services
- **Predictive Escalation:** Predict when single-service incidents will require multi-agency response
- **Cross-service Alerting:** Automatically notify relevant services when linked incidents detected
- **Dynamic Risk Assessment:** Continuously update risk scores as situation evolves

#### 8.2.3 Shared Resource Allocation
- **Unified Resource View:** See all available units across all services on one map
- **Cross-service Dispatch:** Request mutual aid across service boundaries with single click
- **Optimal Resource Matching:** AI recommends nearest appropriate resource regardless of service
- **Predictive Pre-positioning:** AI models predict where resources should be positioned
- **Availability Forecasting:** Predict resource availability based on demand patterns

#### 8.2.4 Cross-service AI Coordination
- **JESIP Assistant:** AI-powered guidance on applying JESIP principles in real-time
- **Joint Decision Model Support:** Structured decision support for multi-agency commanders
- **Automatic METHANE Generation:** Generate structured incident reports from real-time data
- **Communication Translation:** Real-time translation for multi-language incidents (building on NEC Vision 5 capability)
- **Debrief Automation:** Automatically compile cross-service incident timelines for learning

#### 8.2.5 Intelligence and Analytics
- **Cross-service Demand Prediction:** Predict demand across all services simultaneously
- **Pattern Detection:** Identify emerging trends requiring multi-agency response
- **Performance Analytics:** Cross-service response time analysis and optimisation
- **Predictive Risk:** Identify locations/times with elevated multi-agency risk
- **What-if Simulation:** Model the impact of resource reallocation across services

### 8.3 Product Architecture

```
+---------------------------------------------------------------+
|                     999 INTEGRATION PLATFORM                    |
|                                                                 |
|  +----------------+  +------------------+  +------------------+ |
|  |  INCIDENT HUB  |  |  RESOURCE COORD  |  |  AI ORCHESTRATOR | |
|  |                |  |                  |  |                  | |
|  | - Ingestion    |  | - Unified view   |  | - Classification | |
|  | - Deduplication|  | - Cross-dispatch |  | - Prediction     | |
|  | - Linking      |  | - Optimisation   |  | - Recommendation | |
|  | - Common map   |  | - Forecasting    |  | - Risk scoring   | |
|  +-------+--------+  +--------+---------+  +--------+---------+ |
|          |                    |                     |            |
|  +-------v--------------------v---------------------v--------+  |
|  |              UNIFIED DATA FABRIC (CANONICAL MODEL)         |  |
|  |  Person | Location | Event | Resource | Risk | Capacity    |  |
|  +---------------------------+--------------------------------+  |
|                              |                                  |
|  +---------------------------v--------------------------------+  |
|  |              DEFONEOS MCP GATEWAY LAYER                     |  |
|  |  Police MCP | Fire MCP | Ambulance MCP | LocalGov | Central|  |
|  +-----------------------------------------------------------+  |
+-----------------------------------------------------------------+
```

### 8.4 Data Model

#### 8.4.1 Canonical Incident Record
```json
{
  "incident_id": "uuid",
  "timestamp": "2026-08-01T12:34:56Z",
  "source": "999_call|cad|iot|ai_detect",
  "services_required": ["police", "ambulance"],
  "services_responding": ["police", "ambulance"],
  "status": "active|resolved|standby",
  "priority": 1,
  "location": {
    "lat": 51.5074,
    "lon": -0.1278,
    "what3words": "///word.word.word",
    "address": "...",
    "grid_reference": "..."
  },
  "classification": {
    "category": "rtc|fire|medical|crime|collapse|flood",
    "subcategory": "...",
    "confidence": 0.95,
    "ai_reasoning": "Vehicle collision with injuries detected"
  },
  "risk_assessment": {
    "level": "high",
    "factors": ["casualties", "hazmat", "traffic"],
    "evolving": true,
    " predicted_escalation": "fire_hazmat"
  },
  "resources": [
    {"service": "police", "unit_id": "...", "status": "enroute", "eta": 120},
    {"service": "ambulance", "unit_id": "...", "status": "scene", "eta": 0}
  ],
  "linked_incidents": ["uuid"],
  "methane": { },
  "timeline": [ ]
}
```

#### 8.4.2 Canonical Resource Record
```json
{
  "resource_id": "uuid",
  "service": "police|fire|ambulance",
  "type": "officer|appliance|ambulance|drone|hems",
  "status": "available|enroute|scene|busy|returning",
  "location": {"lat": 51.5, "lon": -0.1},
  "capabilities": ["advanced_life_support", "hazmat", "water_rescue"],
  "crew": [ ],
  "availability_forecast": { }
}
```

### 8.5 Integration Requirements

#### 8.5.1 Police Integration
- **LEDS API:** Person/vehicle/property queries
- **STORM CAD:** Incident creation and updates
- **Pronto:** Mobile unit status and messaging
- **ANPR/NAS:** Vehicle of interest alerts
- **NIAM:** Authentication and authorisation

#### 8.5.2 Fire Integration
- **NEC Vision:** Mobilising and incident management
- **I/CAD:** Cross-service CAD-to-CAD
- **AVLS:** Vehicle location feeds
- **Airwave/ESN:** Radio status integration

#### 8.5.3 Ambulance Integration
- **CAD Systems:** Incident and dispatch (Cleric/Hexagon/Sova adapters)
- **NHS FDP:** Hospital capacity, patient flow data
- **PDS:** Patient demographics
- **NHS 111:** Integrated urgent care referrals
- **Faster Data Flows:** Hospital capacity data

#### 8.5.4 Cross-cutting Integration
- **GOV.UK Notify:** Public alerts and notifications
- **Resilience Direct:** Multi-agency coordination platform
- **Met Office:** Weather data for incident correlation
- **OS Maps:** Geolocation and routing
- **NCSC ACD:** Cyber threat awareness

### 8.6 Pricing Model

#### 8.6.1 Recommended Pricing: Tiered SaaS

| Tier | Target | Features | Est. Annual Price |
|------|--------|----------|-------------------|
| **Foundation** | Individual ambulance trust / fire service / police force | Single-service AI, demand prediction, resource optimisation | GBP 250K-500K |
| **Interconnect** | Pairs of services (e.g., police + ambulance) | Cross-service visibility, linked incidents, mutual aid | GBP 750K-1.25M |
| **999 Integration** | Full tri-service (police + fire + ambulance) | Full shared situational awareness, cross-service AI, unified command | GBP 2-4M |
| **Civic Shield** | Tri-service + local government + central government | Complete multi-agency platform, smart city integration, resilience coordination | GBP 4-8M |

#### 8.6.2 Pricing Components
- **Platform License:** Annual subscription based on service size
- **AI Module License:** Per-module pricing (prediction, optimisation, NLP, etc.)
- **Integration Setup:** One-time cost per connected system
- **Professional Services:** Implementation, training, custom development
- **Data Volume:** Tiered pricing based on incident/event volume

#### 8.6.3 Value Justification
- **Efficiency Savings:** 15-25% reduction in response times = GBP 5-10M/year per service
- **Resource Optimisation:** 10-15% better resource utilisation = GBP 2-5M/year
- **Reduced Duplicate Dispatch:** Eliminating duplicate attendance = GBP 500K-1M/year
- **Improved Outcomes:** Faster multi-agency response = lives saved

### 8.7 Buyers and Decision Process

#### 8.7.1 Primary Buyers

| Buyer | Role | Budget | Decision Cycle |
|-------|------|--------|---------------|
| **Police and Crime Commissioners (PCCs)** | Fund police IT | GBP 5-50M IT budget | Annual budget cycle |
| **Chief Fire Officers / Fire Authorities** | Fund fire IT | GBP 2-10M IT budget | Annual budget cycle |
| **Ambulance Trust CEOs / NHS England** | Fund ambulance IT | GBP 10-100M IT budget | NHS planning cycle |
| **Home Office** | National policing systems | Major programme budget | Multi-year programme |
| **NHS England** | National NHS systems | FDP and national budgets | Multi-year programme |
| **Department of Health** | Health policy/funding | National budgets | Government spending review |
| **Local Resilience Forums (LRFs)** | Multi-agency resilience | Limited direct budget | Annual planning |

#### 8.7.2 Recommended Sales Strategy
1. **Land Strategy:** Target progressive individual services (e.g., one ambulance trust, one fire service)
2. **Expand Strategy:** Build tri-service deployment in one geographic area
3. **Scale Strategy:** Use JESIP/LRF channels to promote wider adoption
4. **National Strategy:** Engage Home Office and NHS England for national framework inclusion

#### 8.7.3 Key Decision Criteria for Buyers
- **JESIP Compliance:** Does it support Joint Emergency Services Interoperability Principles?
- **Integration Ease:** How quickly can it connect to existing CAD/mobilising systems?
- **AI Value:** Can it demonstrate measurable improvements in response times/outcomes?
- **Security:** Does it meet police/NHS/NCSC security standards?
- **Value for Money:** Is there a positive business case with <3 year payback?
- **Proven Track Record:** Are there reference deployments?

### 8.8 Competitive Positioning

#### 8.8.1 Competitive Landscape
- **Motorola Solutions:** Pronto + CommandCentral — strong in police, limited cross-service
- **NEC Software Solutions:** Vision for fire, Sova for ambulance — no unified platform
- **Hexagon:** I/CAD cross-service capability — but limited AI
- **Palantir (FDP):** Strong NHS analytics — limited operational/emergency focus
- **IBM:** Various government contracts — limited emergency services integration

#### 8.8.2 DEFONEOS Differentiation
- **Only platform purpose-built for cross-service AI coordination**
- **MCP architecture enables rapid integration with any existing system**
- **Defence-grade AI inherited from military heritage**
- **Not tied to any single CAD vendor — works across all**
- **Open architecture prevents vendor lock-in**

---

## 9. PROCUREMENT ROUTES

### 9.1 How UK Public Services Buy Software

#### 9.1.1 Procurement Frameworks (Preferred Route)
UK public sector organisations are strongly encouraged to buy through approved frameworks rather than running their own tenders. Key frameworks:

#### 9.1.2 G-Cloud 14
- **Managed by:** Government Commercial Agency (GCA, formerly Crown Commercial Service)
- **Open Since:** 29 October 2024
- **End Date:** 28 October 2026 (extended)
- **Lots:**
  - Lot 1: Cloud Hosting (PaaS, IaaS)
  - Lot 2: Cloud Software (SaaS)
  - Lot 3: Cloud Support
- **Supplier Count:** 4,000+ suppliers, 40,000+ services
- **SME Share:** 90% of suppliers are SMEs; ~42% of spend
- **Total Sales:** GBP 14.72B over past 5 years; GBP 2.91B in 2024/25
- **Process:** Search Digital Marketplace -> Assess -> Direct award (no tender needed)
- **Contract Length:** Up to 36 months
- **DEFONEOS Strategy:** List DEFONEOS SaaS under Lot 2; offer cloud support under Lot 3
- **Benefits:** No lengthy tender; buyers can purchase directly; massive buyer exposure

#### 9.1.3 BlueLight Commercial Frameworks
- **Established:** 1 April 2024 (transferred from Police Digital Service)
- **Scope:** National policing IT procurement
- **Frameworks Available:**
  - Automated Text Redaction Framework
  - Access for All Agreement (IBM i2)
  - Strategic Framework (Cyber Security Penetration Testing)
  - National Police ETLA II (Adobe)
  - National Police ELA (VMWare)
  - Software and Hardware Managed Service Framework
  - Microsoft MoU (CCS DTA21)
  - Identity and Access Management MoU (Softcat)
  - Strategic Framework (Social Media Management)
  - Dynamic Purchasing System (Consultancy Technical Support)
- **Contact:** enquiries@bluelight.police.uk
- **DEFONEOS Strategy:** Apply to be listed on BlueLight frameworks; target national policing contracts

#### 9.1.4 Police ICT Digital Transformation Framework
- **Purpose:** Cost-effective, rapid, compliant access to ICT suppliers
- **Administered by:** Police Digital Service (PDS)
- **Scope:** Digital transformation and managed services
- **Benefits:** No extended procurement; strategically selected supplier base
- **DEFONEOS Strategy:** Apply for Digital Transformation Framework listing

#### 9.1.5 GCA (formerly CCS) Frameworks
- **RM6259:** Technology Products and Services (formerly Technology Products 2)
- **RM6103:** Crown Hosting
- **RM3821:** Cloud hosting, software, support
- **RM6075:** Technology Services (for large implementations)

#### 9.1.6 NHS Procurement Routes
- **NHS England Frameworks:** Various clinical and IT frameworks
- **NHS Shared Business Services:** Framework for NHS trusts
- **FDP First Policy:** Any system connecting to NHS should integrate with FDP
- **DEFONEOS Strategy:** Register as FDP-compatible supplier; engage NHS England digital teams

### 9.2 Direct Procurement (OJEU/FTS)

#### 9.2.1 When Used
- Requirements not covered by existing frameworks
- Very large contracts (typically >GBP 5M)
- Strategic/national systems
- Long contract periods (5-10+ years)

#### 9.2.2 Process
1. Prior Information Notice (PIN) — optional early notification
2. Contract Notice published on Find a Tender (FTS)
3. Selection Questionnaire (SQ)
4. Invitation to Tender (ITT)
5. Evaluation and award
6. Contract Award Notice

#### 9.2.3 Typical Timelines
- Framework listing: 3-6 months
- Direct award under framework: 2-8 weeks
- Full OJEU tender: 6-18 months

### 9.3 Typical Contract Values

| Service Type | Typical Contract Value | Duration | Examples |
|-------------|----------------------|----------|----------|
| **Police CAD replacement** | GBP 5-20M | 5-10 years | Various force CAD procurements |
| **Fire mobilising system** | GBP 5-20M | 5-10 years | LFB NEC contract: GBP 20M |
| **Ambulance CAD** | GBP 5-15M | 6-12 years | South Central: 12-year term |
| **Mobile policing (Pronto)** | GBP 1-5M per force | 3-5 years | Wiltshire, Police Scotland |
| **National policing systems** | GBP 100M-1B | 10-15 years | LEDS: ~GBP 900M |
| **NHS FDP** | GBP 100M+ | 5+ years | Palantir FDP contract |
| **Council planning system** | GBP 100K-500K | 3-5 years | Idox cloud migrations |
| **G-Cloud SaaS** | GBP 10K-1M | 1-3 years | Various cloud services |

### 9.4 Decision-Making Process

#### 9.4.1 Police Forces
- **Budget Holder:** Police and Crime Commissioner (PCC) or Chief Constable
- **Technical Input:** Force IT Director, Police Digital Service
- **Approval:** PCC approval for major spend; sometimes HMICFRS oversight
- **National Systems:** Home Office + NPCC governance

#### 9.4.2 Fire and Rescue Services
- **Budget Holder:** Fire Authority (local elected members)
- **Technical Input:** Chief Fire Officer, NFCC
- **Approval:** Fire Authority vote
- **National Coordination:** Home Office, NFCC

#### 9.4.3 Ambulance Trusts
- **Budget Holder:** Trust Board / CEO
- **Technical Input:** Director of IT/Operations
- **National Oversight:** NHS England, Association of Ambulance Chief Executives (AACE)
- **Funding:** NHS commissioning through Integrated Care Boards (ICBs)

#### 9.4.4 Local Government
- **Budget Holder:** Council Cabinet / Section 151 Officer
- **Technical Input:** Head of Digital/IT
- **Approval:** Cabinet for major spend; sometimes full council
- **Procurement:** Via CCS/G-Cloud frameworks for efficiency

### 9.5 DEFONEOS Procurement Strategy

#### 9.5.1 Phase 1: Foundation (Months 1-6)
1. **Register on G-Cloud 15** (when next iteration opens)
2. **Apply for BlueLight Commercial** supplier status
3. **Apply for Police ICT Digital Transformation Framework**
4. **Register as NHS FDP-compatible supplier**
5. **Obtain Cyber Essentials Plus** certification
6. **Achieve DSPT compliance** for NHS data handling

#### 9.5.2 Phase 2: First Sales (Months 6-18)
1. **Land first police force:** Target progressive force with innovation agenda
2. **Land first fire service:** Target service undergoing control room modernisation
3. **Land first ambulance trust:** Target trust with CAD replacement programme
4. **Build reference cases** with measurable outcomes

#### 9.5.3 Phase 3: Multi-agency (Months 18-36)
1. **Deploy tri-service** in one geographic area
2. **Engage Local Resilience Forum** for regional rollout
3. **Build case study** with quantified cross-service benefits
4. **Target Home Office** for national framework consideration

#### 9.5.4 Phase 4: Scale (Months 36+)
1. **National framework listing** (if achieved)
2. **NHS England engagement** for ambulance/FDP integration
3. **Local government channel** via G-Cloud + direct sales
4. **Continuous expansion** of AI capabilities

---

## 10. APPENDICES

### Appendix A: Acronyms and Definitions

| Acronym | Definition |
|---------|-----------|
| AACE | Association of Ambulance Chief Executives |
| ANPR | Automatic Number Plate Recognition |
| ACD | Active Cyber Defence (NCSC) |
| CAD | Computer-Aided Dispatch |
| CAS | Clinical Assessment Service (NHS 111) |
| CCS | Crown Commercial Service (now GCA) |
| DCB | Data Coordination Board (NHS) |
| DSPT | Data Security and Protection Toolkit |
| DVLA | Driver and Vehicle Licensing Agency |
| EE | Everything Everywhere (BT/EE for ESN) |
| EOC | Emergency Operations Centre |
| EPR | Electronic Patient Record |
| ESMCP | Emergency Services Mobile Communications Programme |
| ESN | Emergency Services Network (replacing Airwave) |
| FBC | Full Business Case |
| FDP | Federated Data Platform (NHS) |
| FHIR | Fast Healthcare Interoperability Resources |
| FDF | Faster Data Flows |
| FT | Find a Tender |
| GCA | Government Commercial Agency |
| GCHQ | Government Communications Headquarters |
| GC3 | Government Cyber Coordination Centre |
| GDS | Government Digital Service |
| HEMS | Helicopter Emergency Medical Services |
| HSCN | Health and Social Care Network |
| ICB | Integrated Care Board |
| I/CAD | Intergraph Computer-Aided Dispatch |
| IG | Information Governance |
| JESIP | Joint Emergency Services Interoperability Programme |
| JDM | Joint Decision Model |
| LEDS | Law Enforcement Data Service |
| LGA | Local Government Association |
| LFB | London Fire Brigade |
| LRF | Local Resilience Forum |
| MCP | Model Context Protocol |
| METHANE | Major Incident reporting framework |
| NAO | National Audit Office |
| NCA | National Crime Agency |
| NCSC | National Cyber Security Centre |
| NCF | National Cyber Force |
| NEC | NEC Software Solutions |
| NFCC | National Fire Chiefs Council |
| NHS | National Health Service |
| NIAM | National Identity Access Management |
| NLEDP | National Law Enforcement Data Programme |
| NPCC | National Police Chiefs' Council |
| NPAS | National Police Air Service |
| NPPV | Non-Police Personnel Vetting |
| NSDTD | National Shutdown Target Date (Airwave) |
| PCC | Police and Crime Commissioner |
| PDS | Personal Demographics Service (NHS) |
| PIN | Prior Information Notice |
| PNC | Police National Computer |
| PND | Police National Database |
| POLE | Person, Object, Location, Event (data model) |
| PSN | Public Services Network |
| RMS | Records Management System |
| SaaS | Software as a Service |
| SAN | Service Access Node |
| SC | Security Check (vetting) |
| SECAmb | South East Coast Ambulance |
| SERS | Suspicious Email Reporting Service |
| SME | Small and Medium Enterprise |
| SPR | Single Patient Record |
| STU3 | FHIR Standard for Trial Use 3 |
| SyAP | Security Assessment for Policing |
| TETRA | Terrestrial Trunked Radio (Airwave) |
| TPAP | Third Party Assurance for Policing |
| UEC | Urgent and Emergency Care |
| UTC | Urgent Treatment Centre |
| VEAT | Voluntary Ex-Ante Transparency Notice |
| VOi | Vehicle of Interest |

### Appendix B: Key Contacts and Organisations

| Organisation | Role | Website |
|-------------|------|---------|
| **Police Digital Service (PDS)** | National policing IT delivery | pds.police.uk |
| **BlueLight Commercial** | Police/fire/ambulance procurement | bluelight.police.uk |
| **NPCC** | National police standards and strategy | npcc.police.uk |
| **NFCC** | National fire service coordination | ukfrs.com |
| **NHS England** | National NHS IT strategy | england.nhs.uk |
| **GDS** | Government digital standards | gov.uk/government/organisations/gds |
| **NCSC** | Cyber security guidance | ncsc.gov.uk |
| **LGA** | Local government support | local.gov.uk |
| **College of Policing** | Police training and standards | college.police.uk |
| **JESIP** | Multi-agency interoperability | jesip.org.uk |

### Appendix C: Current Major Procurements to Target

| Procurement | Value | Status | Target Close |
|-------------|-------|--------|-------------|
| South Central Ambulance CAD | GBP 5-15M | Open (Jun 2025) | 2025 |
| Yorkshire Ambulance CAD | TBC | PIN stage | 2025-2026 |
| LEDS Person Product (PA Consulting) | GBP 37.5M | Awarded | N/A |
| ESN User Services (IBM) | TBC | Awarded (late 2024) | N/A |
| ESN Mobile Services (EE/BT) | TBC | Direct award | N/A |
| London Fire Brigade Vision 5 | GBP 20M | Awarded (Feb 2025) | N/A |
| Various force CAD replacements | GBP 2-10M each | Ongoing | Rolling |
| NHS FDP expansion | GBP 100M+ | Ongoing | Multi-year |
| G-Cloud 15 | N/A | Expected 2026 | 2026 |

### Appendix D: Security Requirements Checklist

#### For Police Integration
- [ ] Security vetting (SC minimum; DV for some roles)
- [ ] Non-Police Personnel Vetting (NPPV) Level 2 minimum
- [ ] NIAM integration capability
- [ ] BS10008 compliance for evidential weight
- [ ] NASPLE compliance for ANPR data
- [ ] NPCC data standards compliance
- [ ] MoPI compliance for records management
- [ ] Secure by Design assurance from PDS
- [ ] Police Information Risk Assurance

#### For NHS Integration
- [ ] Data Security and Protection Toolkit (DSPT) compliance
- [ ] FHIR UK Core standard compliance
- [ ] DCB0129 (clinical risk for manufacturers)
- [ ] DCB0160 (clinical risk for deployment)
- [ ] NHS Smartcard / CIS2 integration
- [ ] HSCN connectivity
- [ ] IG Toolkit compliance
- [ ] FDP integration capability
- [ ] GDPR/DPA 2018 compliance

#### For Fire Integration
- [ ] NFCC interoperability standards
- [ ] Airwave/ESN security requirements
- [ ] JESIP compliance
- [ ] Service-specific security policies
- [ ] Cyber Essentials Plus minimum

#### For Local Government
- [ ] Cyber Essentials Plus
- [ ] GDPR compliance
- [ ] LGSS alignment
- [ ] Open API standards (RESTful JSON)
- [ ] ISO 27001 certification

#### For Central Government
- [ ] OFFICIAL classification handling
- [ ] Government Security Classifications Policy compliance
- [ ] GDS API standards compliance
- [ ] NCSC guidance adherence
- [ ] Cloud First policy alignment

### Appendix E: MCP Server Implementation Templates

#### E.1 Python MCP Server Skeleton (Police)
```python
# defoneos_police_mcp.py
from mcp.server import Server
from mcp.types import Resource, Tool
import httpx
import jwt

app = Server("defoneos-police-mcp")

LEDS_BASE_URL = "https://api.leds.police.uk/v1"
STORM_ADAPTER_URL = "https://adapter.defoneos.io/storm"
ANPR_ADAPTER_URL = "https://adapter.defoneos.io/anpr"

async def get_niam_token(service_credentials):
    """Authenticate via National Identity Access Management"""
    # NIAM JWT authentication flow
    pass

@app.tool()
async def led_search(query: str, search_type: str = "person"):
    """Search LEDS for person, vehicle, or property records"""
    token = await get_niam_token("leds")
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{LEDS_BASE_URL}/{search_type}/search",
            params={"q": query},
            headers={"Authorization": f"Bearer {token}"}
        )
        return response.json()

@app.tool()
async def incident_create(location: dict, classification: str, priority: int):
    """Create incident in connected CAD system"""
    # Transform to STORM/I/CAD format and dispatch
    pass

@app.tool()
async def demand_forecast(area: str, time_window: int = 24):
    """AI-powered demand prediction for specified area"""
    # DEFONEOS AI model inference
    pass

@app.tool()
async def crime_hotspot_prediction(area: str, time_window: int = 24):
    """Predict crime hotspots using DEFONEOS AI"""
    # DEFONEOS ML model for crime prediction
    pass

if __name__ == "__main__":
    app.run(transport="stdio")
```

#### E.2 NHS FHIR Integration Pattern
```python
# NHS FDP integration pattern for DEFONEOS
from fhir.resources.patient import Patient
from fhir.resources.encounter import Encounter
import httpx

NHS_FHIR_BASE = "https://api.service.nhs.uk/personal-demographics/FHIR/R4"
FDP_BASE = "https://foundry.england.nhs.uk/api"

async def get_patient(nhs_number: str, auth_token: str):
    """Retrieve patient via PDS FHIR API"""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{NHS_FHIR_BASE}/Patient/{nhs_number}",
            headers={
                "Authorization": f"Bearer {auth_token}",
                "Accept": "application/fhir+json"
            }
        )
        return Patient.parse_raw(response.text)

async def get_hospital_capacity(trust_code: str, fdp_token: str):
    """Get real-time hospital capacity via FDP"""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{FDP_BASE}/v1/capacity/{trust_code}",
            headers={"Authorization": f"Bearer {fdp_token}"}
        )
        return response.json()  # FDP canonical model
```

### Appendix F: Technical Standards Summary

| Domain | Standard | Purpose |
|--------|----------|---------|
| **API Design** | RESTful JSON, GDS standards | All APIs |
| **Healthcare Data** | FHIR R4 UK Core | NHS integration |
| **Police Data** | POLE model, NASPLE, MoPI | Policing data |
| **Security** | OAuth 2.0, JWT, TLS 1.2+ | Authentication |
| **Interoperability** | JESIP, M/ETHANE | Multi-agency response |
| **Classification** | Government Security Classifications | Data handling |
| **Cloud** | Cloud First policy, G-Cloud | Procurement/deployment |
| **Cyber** | Cyber Essentials Plus, NCSC guidance | Security baseline |
| **Risk** | DCB0129/0160, BS10008 | Clinical/evidential |

### Appendix G: Key Integration Priorities by Quarter

| Quarter | Priority | Milestone |
|---------|----------|-----------|
| **Q1 2026** | G-Cloud 15 registration, Cyber Essentials Plus | Listed on G-Cloud |
| **Q2 2026** | BlueLight Commercial application, first police force POC | Police MCP live |
| **Q3 2026** | First fire service integration, DSPT compliance | Fire MCP live |
| **Q4 2026** | First ambulance trust, FDP integration | Ambulance MCP live |
| **Q1 2027** | Tri-service deployment in one region | 999 Integration v1 |
| **Q2 2027** | Local government pilots, GOV.UK Notify integration | Civic Shield v1 |
| **Q3 2027** | Scale to 3-5 regions, NCSC integration | Multi-region |
| **Q4 2027** | National framework consideration | National presence |

---

## END OF DOCUMENT

**Document Classification:** Strategic Planning
**Next Review:** Quarterly
**Owner:** DEFONEOS Strategy Team
**Distribution:** Product, Engineering, Sales, Security

---

*This document was compiled as part of Operation HUNT — Civil Services Integration Research. All data sourced from public government publications, vendor documentation, and open procurement records as of August 2026.*
