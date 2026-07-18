# OPERATION E.A.T. -- Construction AI Competitor Reverse + Free Data Catalog
## Everything Architecture & Technology -- Complete Intelligence Brief

---

# PART 1: COMPETITOR REVERSE ENGINEERING

---

## 1. PROCORE -- Platform Architecture, APIs, Data Model, Marketplace

### Overview
Procore is the largest construction management platform globally, serving as a cloud-based project management hub for construction projects of all sizes. Founded in 2002, headquartered in Carpinteria, CA. Public company (NYSE: PCOR).

### Platform Architecture
- **Model:** Cloud-native SaaS, multi-tenant architecture
- **Verify then Trust model** for partner applications -- only trusted partners can promote apps to production and list on the Marketplace
- Uses **REST API** architecture with OAuth 2.0 authentication
- **Three-legged OAuth** for user-authorized apps; **Vapid API Key** for company account apps
- Sandbox environment available for development/testing

### API Data Model & Endpoints
- **Core API** organized around construction business objects:
  - `Projects` -- Project metadata, configurations
  - `Companies` -- Company-level data and settings
  - `Users` -- User management and permissions
  - `RFIs` -- Request for Information workflow
  - `Submittals` -- Material/product approval workflows
  - `Daily Log` -- Field reporting, manpower, equipment, notes
  - `Drawings` -- Drawing management and distribution
  - `Photos` -- Photo documentation
  - `Documents` -- Document management
  - `Schedule` -- Schedule integration (import from P6, MS Project)
  - `Budget` -- Budget line items, change orders, commitments
  - `Prime Contract` -- Contract management
  - `Commitments` -- Purchase orders, subcontracts
  - `Change Orders` -- PCOs, CCOs, RFQs
  - `Inspections` -- Quality/safety inspection workflows
  - `Incidents` -- Safety incident reporting
  - `Time & Materials` -- T&M ticket management
  - `Timesheets` -- Labor time tracking
  - `Equipment` -- Equipment tracking and management
  - `Directory` -- Project/contact directory
  - **400+ REST endpoints**

### Marketplace & Integrations
- **300+ app integrations** on Procore Marketplace
- Categories: Accounting, BIM/VDC, CRM, ERP, Estimating, Scheduling, Safety, Analytics
- Integration types: Embedded apps, Workflow apps, Data Connect apps
- **Data Connect** -- Fivetran-powered ETL for data warehouse sync
- Notable integrations: Sage, Viewpoint, QuickBooks, Microsoft 365, DocuSign, Plangrid

### Technology Stack (Inferred)
- Backend: Ruby on Rails (legacy), transitioning to microservices
- Database: PostgreSQL, Redis for caching
- Frontend: React, TypeScript
- Mobile: React Native (iOS/Android)
- Infrastructure: AWS
- Search: Elasticsearch
- File Storage: S3
- API: REST + GraphQL for newer features

### Pricing Model
- Per-user, per-year subscription
- Tiers: Core ($$$), Advanced ($$$$), Ultimate ($$$$$)
- Typical range: $400-$1,500/user/year depending on modules
- Enterprise pricing available for large GCs

### Competitive Moat
- **Network effects**: Largest installed base = most integrations = hardest to switch
- **Data lock-in**: Years of project data, documents, photos, RFIs embedded
- **Workflow standardization**: Becomes operational standard for subs/GCs
- **Marketplace ecosystem**: 300+ apps create switching costs

---

## 2. AUTODESK CONSTRUCTION CLOUD (ACC) -- Tech Stack, BIM Integration, APIs

### Overview
Autodesk Construction Cloud is a unified platform combining BIM 360, PlanGrid, BuildingConnected, and Assemble. Part of Autodesk Forma industry cloud strategy. Deepest BIM integration in the market.

### Platform Architecture
- **Cloud:** Built on Autodesk Platform Services (APS) -- formerly Forge
- **BIM-first architecture**: Native Revit/Civil 3D/Navisworks integration
- **Common Data Environment (CDE)**: Unified document/model repository
- **Platform services model**: ACC serves as the data backbone for AEC workflows
- Connected to **Autodesk Forma** cloud ecosystem

### Tech Stack
- **Backend**: .NET, Java microservices on AWS + Azure
- **Frontend**: React, Angular
- **BIM Engine**: Autodesk proprietary geometry engine (from Revit/Navisworks)
- **Database**: PostgreSQL, MongoDB, S3 for file storage
- **Authentication**: OAuth 2.0 + Autodesk ID
- **3D Viewer**: Autodesk Viewer (WebGL-based, from Forge)
- **API Gateway**: Autodesk Platform Services

### API Ecosystem (Autodesk Platform Services)
- **Construction API** (BIM 360/ACC): Project management, issues, RFIs, assets, checklists
- **Model Coordination API**: Clash detection, model aggregation
- **BIM 360 Docs API**: Document management, version control
- **Data Connector** (via Fivetran): ETL to data warehouses

#### Key Data Entities (via Fivetran connector):
| Table | Type | Sync Mode |
|-------|------|-----------|
| `ASSET` | Incremental | Supports delete capture |
| `CATEGORY` | Incremental | Supports delete capture |
| `CUSTOM_ATTRIBUTE` | Incremental | Supports delete capture |
| `FORM` | Incremental | New records only |
| `FORM_TEMPLATE` | Incremental | New records only |
| `ISSUE` | Incremental | Full re-import for updates/deletes |
| `ISSUE_ATTRIBUTE` | Incremental | New records only |
| `ISSUE_COMMENT` | Incremental | Supports delete capture |
| `ISSUE_PROFILE` | Incremental | Supports delete capture |
| `ISSUE_ROOT_CAUSE_CATEGORY` | Incremental | New records only |
| `ISSUE_TYPE` | Incremental | New records only |
| `PROJECT` | Incremental | Supports delete capture |
| `RFI` | Incremental | New records only |
| `SHEET` | Incremental | Supports delete capture |
| `STATUS_STEP` | Incremental | New records only |

### BIM Integration Depth
- **Native Revit sync**: Direct bidirectional model sync
- **Navisworks clash detection**: Automated clash reports within ACC
- **IFC support**: Import/export IFC 2x3 and IFC4
- **Model coordination**: Multi-trade model aggregation + clash detection
- **Quantification**: Automated takeoff from 3D models
- **Autodesk Build**: Field management module (formerly BIM 360 Field)
- **Autodesk Takeoff**: 2D/3D quantity takeoff
- **400+ pre-built integrations** for ERPs, CRMs, document management

### Pricing
- Tiered by module: Build, Takeoff, BIM Collaborate, Docs, Estimating
- Per-user, per-year model
- Range: $300-$2,000/user/year per module
- Enterprise bundles available

### Competitive Moat
- **BIM lock-in**: Deep Revit integration makes it indispensable for BIM-centric firms
- **Design-to-construction continuity**: Only platform spanning design through operations
- **Autodesk ecosystem**: Bundled with design tools = distribution advantage

---

## 3. BUILDOTS -- Computer Vision for Construction

### Overview
Buildots is an AI-powered construction intelligence platform founded in 2018, headquartered in Tel Aviv with offices in London. Uses hardhat-mounted 360 cameras + computer vision to track construction progress automatically.

### Technology Architecture

#### Hardware Layer
- **360-degree cameras**: GoPro cameras mounted on hardhats worn by site managers
- **Capture method**: Site managers walk the site 1-2x/week, capturing ~30,000 sq ft in 45 minutes
- **Camera count**: Typically 1-2 cameras per project, shared among managers
- **Data volume**: ~70,000 images captured over a project's lifecycle

#### AI/Computer Vision Pipeline
- **Image recognition**: Processes 360 images to identify ~150,000 individual construction objects per project
- **BIM overlay**: Compares captured images against BIM model to determine progress
- **Classification**: Each object classified into 3-4 states (not started / in progress / complete)
- **Digital twin**: Creates continuously updated digital twin of physical construction
- **Anonymization**: Built-in AI blurs faces, name tags, phone screens for privacy
- **No audio recording**: Cameras capture images only

#### Data Model
- **Project**: Central entity containing BIM, schedule, and all captured data
- **BIM Model**: 3D geometry reference with element-level breakdown
- **Schedule**: Linked to construction schedule (P6/MS Project)
- **Elements**: Individual construction objects tracked (walls, electrical sockets, fittings, etc.)
- **Captures**: 360 image collections with timestamps and locations
- **Progress Metrics**: Quantified completion percentages by trade, location, and element
- **Delay Predictions**: AI-forecasted completion dates vs. planned dates

#### Platform Features
- **Progress tracking**: Element-level automated progress measurement
- **Delay prediction**: AI forecasts delays weeks ahead; claims 50% fewer delays
- **Trade management**: Objective performance data for each subcontractor
- **Documentation**: Complete as-built record with timestamps
- **Portfolio view**: Standardized reporting across multiple projects

#### AI Assistant: "Dot"
- Powered by **OpenAI GPT-4o** models
- Natural language queries about project status
- Cross-references progress data, schedule, BIM model
- Example queries: "Give me a list of apartments where drywall is complete but tiling hasn't started"
- 79.3% of typical site inquiries resolved in real-time (industry benchmark)

### Tech Stack (Inferred)
- **Computer Vision**: Custom-trained CNNs/RNNs on construction imagery
- **3D Processing**: Point cloud processing, SLAM for localization
- **Backend**: Python (likely PyTorch/TensorFlow), cloud-native
- **Cloud**: Likely AWS (image storage + GPU inference)
- **Database**: PostgreSQL for project data; likely S3 for image storage
- **Frontend**: React-based web dashboard
- **API**: REST API for integrations (schedule, BIM imports)

### Key Customers
- Turner Construction, JE Dunn, Ledcor, Sir Robert McAlpine, Wates
- Fortune 500 contractors primarily

### Pricing Model
- Enterprise SaaS, project-based pricing
- Includes: hardware, onboarding, ongoing support
- Pricing not public -- likely $50K-$200K+/year per project depending on size

### Competitive Moat
- **Computer vision training data**: Years of construction-specific imagery = better accuracy
- **Workflow integration**: Minimal disruption (walk with camera, AI does rest)
- **Predictive analytics**: Moves from reporting to forecasting

---

## 4. OPENSPACE -- 360 Photo AI Processing, Tech Stack

### Overview
OpenSpace is the global leader in 360 reality capture and AI-powered analytics for builders. Founded by Jeevan Kalanithi, spun out of MIT Media Lab. 150,000+ users across 93 countries, 20 billion sq ft captured.

### Technology Architecture

#### OpenSpace Spatial AI -- Core Components

**1. Computer Vision**
- Automatically aligns 360 images into integrated scenes
- Recognizes and labels key features in construction environments
- Maps captures to floor plans automatically -- NO manual pinning or location marking

**2. 3D Reconstruction**
- Creates 3D point clouds from 360 video captures
- Compares features across images to compute camera position estimates
- Repeated thousands of times per capture session

**3. SLAM (Simultaneous Localization and Mapping)**
- Image-based SLAM estimates walker path on floor plan
- Algorithms constantly align sequential data to estimate position and path
- Core algorithm borrowed from autonomous vehicle navigation

**4. Machine Learning**
- Each capture and walk track serves as training data
- System learns the 3D environment over time
- Aligns and maps faster and more accurately with each walk
- Upload process gets faster over time due to ML

#### Capture Technology
- **360 cameras**: Compatible with Insta360, Ricoh Theta, GoPro Max, FLIR thermal
- **Capture method**: Walk site with camera mounted on hardhat
- **Background uploads**: Uploads start automatically when connection found
- **Coverage heatmap**: Shows previously captured areas for planning walks
- **Image enhancements**: Auto brightness, shadow, sharpness adjustments
- **QuickConnect**: One-tap camera connection without WiFi password
- **Field Notes**: Attach images, videos, attachments, edit notes in mobile app

#### Integration Ecosystem
- **Autodesk Construction Cloud**: Native integration -- access OpenSpace within ACC Build, export RFIs/issues
- **Procore**: Bi-directional integration
- **BIM 360**: Model viewing alongside captures
- **Field Notes** export to ACC RFIs and Issues
- **Drone captures**: Building elevation capture support
- **Thermal capture**: FLIR One Pro thermal imaging support

### Tech Stack (Inferred)
- **Computer Vision**: Custom CV pipeline (likely C++ core with Python bindings)
- **SLAM**: Modified ORB-SLAM or similar visual SLAM implementation
- **3D Reconstruction**: Multi-view stereo + structure from motion
- **Point Cloud**: Potree or similar WebGL point cloud renderer
- **Backend**: Likely Node.js/Python hybrid
- **Cloud**: AWS (image storage, GPU inference)
- **Database**: PostgreSQL + S3 for images
- **Frontend**: React/TypeScript web viewer; React Native mobile
- **API**: REST + WebSocket for real-time features

### Pricing Model
- Per-project or per-user subscription
- Tiers: Basic (capture only), Pro (AI analytics), Enterprise
- Range: ~$500-$2,000/project/month depending on size

### Competitive Moat
- **Scale**: 20B+ sq ft captured = massive CV training dataset
- **Ease of use**: Walk and capture -- no technical expertise needed
- **Speed**: Same-day image availability; maps automatically

---

## 5. TRACK3D -- BIM-to-Field Comparison, Architecture

### Overview
Track3D is a reality capture platform focused on comparing design models (BIM) against reality captures (360 photos, point clouds, drone data) to identify discrepancies and track construction progress.

### Platform Architecture

#### Core Modules
- **BIM Compare**: Compares design models with reality captures side-by-side
- **Timeline Compare**: Compares captures across different dates to track progress
- **Drone Data**: Processes drone imagery for aerial comparison
- **Markups & Notes**: Annotation system for issue tracking
- **Autodesk BIM 360 Integration**: Direct sync with ACC/BIM 360

#### BIM Compare Feature
- Side-by-side model vs. reality comparison
- Navigation locked on reality side (model follows reality position)
- Lock toggle allows independent navigation of model and reality
- Multiple BIM model switching via dropdown
- Model displayed as 3D geometry; reality as 360 imagery or point cloud

#### Data Model
- **Projects**: Container for all data
- **BIM Models**: Multiple design models per project (can switch between them)
- **Reality Captures**: 360 photos, point clouds, drone imagery
- **Compare Views**: Synchronized model-reality comparisons
- **Markups**: Annotations on discrepancies
- **Timeline**: Chronological capture history

### Technology (Inferred)
- **Backend**: Cloud-native, likely AWS
- **3D Viewer**: Custom WebGL viewer (likely Three.js-based)
- **BIM Parsing**: IFC/Revit file parsing for model geometry
- **Point Cloud Processing**: LAS/LAZ processing for scan data
- **API**: REST API for Autodesk BIM 360 integration
- **Frontend**: React-based web application

### Pricing
- Project-based or enterprise subscription
- Pricing not publicly disclosed

---

## 6. ANOLLA -- AI Inquiry System

### Overview
Anolla is a construction services booking and scheduling platform with deeply integrated AI for managing construction calendars, equipment rental, and subcontractor coordination. European-focused (25 languages supported).

### Technology Architecture

#### AI Planner Core
- **Context-aware AI**: Continuously manages construction calendars and work stage booking
- **Not an add-on**: AI is the core scheduling engine, deeply integrated
- **Multi-entity coordination**: Links crews, subcontractors, machinery, and material logistics
- **Real-time resolution**: 79.3% of typical site inquiries resolved autonomously
- **Level-1 support**: 52.4% of level-1 technical support questions resolved by AI

#### Context-Aware Data Processing
- Processes: site conditions, location, time, work stage, crew availability, equipment utilization, delivery schedules
- Active module awareness: calendar, equipment rental, subcontracting
- Factors considered:
  - Project schedule and contractual constraints
  - User permissions and history
  - Platform rules and account status
  - Related data from prior works

#### Dynamic Pricing Engine
- Peak-time, weekend, and short-notice multipliers
- Fleet utilization optimization
- Crew load balancing
- Claims 25% improvement in fleet utilization and crew load balancing

#### Platform Modules
- **Site Calendar**: Hourly task scheduling, day-based work packages, variable-length phases
- **Equipment Rental**: Crane, excavator, machinery booking with operators
- **Subcontracting**: Work package assignment and coordination
- **AI Dispatcher**: Real-time schedule changes and inquiry handling
- **Mobile UI**: Mobile-first design for outdoor/field conditions

#### Billing Model
- Usage-based: pay only for scheduled labor, reserved machine hours, approved site visits
- Free starter plan available
- Transparent pricing

### Tech Stack (Inferred)
- **Backend**: Likely Python/Node.js for AI services; microservices architecture
- **AI/ML**: Custom NLP models for construction domain + scheduling optimization
- **Database**: PostgreSQL for transactional data; Redis for real-time scheduling
- **Frontend**: Mobile-first React/Vue.js
- **API**: REST API for integrations (BIM/ERP marketplace in growth phase)
- **Mobile**: Native or React Native app

### Competitive Position
- **Strengths**: AI-native scheduling, 25 languages, dynamic pricing, mobile-first
- **Weaknesses**: BIM/ERP integration marketplace still growing; complex template setup
- **Differentiator**: Autonomous scheduling vs. manual calendar management

---

## 7. LEANCON -- Preconstruction AI

### Overview
LeanCon is an AI-powered preconstruction planning platform. Founded by Ziv Levi and Sapir Tubul, both former construction engineers. $6M seed funding (oversubscribed, led by Ibex Investors). Based in New Haven, CT (Yale SOM connection).

### Technology Architecture

#### AI-Powered Preconstruction Engine
- **Input**: RFP documents + BIM models (3D) or 2D drawings
- **Processing**: AI reads and interprets project structure, constraints, key parameters
- **Analysis**: Simulates construction logic, optimizes sequencing, crews, resources
- **Output**: Side-by-side plans with full cost, schedule, and resource data
- **Timeline**: ~7 minutes from upload to complete plan (vs. months manually)

#### Claimed Capabilities
- **Automated Simulation**: Optimal build methods, crane layouts, manpower, schedules
- **Schedule Optimization**: Shorten project durations by up to 20%
- **Cost Prediction**: Budget and cash flow forecasting
- **Sustainability Insights**: Carbon impact quantification
- **90%+ planning accuracy** claimed
- **100x** more projects planned per year

#### How It Works (3 Steps)
1. **Upload**: Submit RFP + BIM/2D drawings; no setup, no manual input
2. **Analyze**: AI runs millions of "what-if" simulations evaluating means/methods, manpower, equipment, site constraints
3. **Select**: Review side-by-side plans with cost/schedule/resource data; export chosen plan

#### AI Approach
- Proprietary construction logic engine
- Evaluates multiple build scenarios
- Compares results across cost, duration, resource utilization
- Adapts to regional standards, codes, and construction practices
- Incorporates: labor productivity, materials availability, environmental conditions

### Tech Stack (Inferred)
- **Backend**: Python for AI/ML; microservices architecture
- **BIM Parsing**: IFC import, Revit file parsing, 2D drawing OCR
- **Simulation**: Custom discrete event simulation or agent-based modeling
- **Optimization**: Mathematical optimization (linear programming, genetic algorithms)
- **Database**: PostgreSQL + likely graph DB for project relationships
- **Frontend**: React-based web application
- **Cloud**: Likely AWS or Azure

### Customers & Traction
- $650M in active development projects (NYC)
- Working with one of the largest privately held construction/development firms in the US
- Focus: vertical construction (hospitality, civic, mission critical, residential, life science, education, corporate)

### Pricing Model
- Likely project-based or enterprise SaaS
- Preconstruction cost: "near zero" vs. ~$2M per project traditional

### Competitive Moat
- **Preconstruction focus**: Last untouched frontier in construction tech
- **Speed**: Months to minutes compression
- **Founder expertise**: Actual construction engineering backgrounds

---

## 8. UNITED RENTALS -- Digital Platform, API

### Overview
United Rentals is the world's largest equipment rental company, headquartered in Stamford, CT. Fortune 500 company (NYSE: URI). Revenue ~$14B+ annually.

### Digital Platform: Total Control

#### Total Control Platform Features
- **Online rental management**: Digital catalog, ordering, delivery tracking
- **Fleet management**: Equipment tracking, utilization, maintenance scheduling
- **Telematics**: GPS tracking, engine diagnostics, usage monitoring
- **Financial management**: Invoicing, payment, reporting
- **Safety compliance**: Inspection tracking, certification management

#### API Ecosystem
- **Total Control Integration API**: `https://api.unitedrentals.com/v1`
- **Supported formats**: EDI, cXML, JSON, spreadsheet, flat-file
- **OpenAPI Specification** available
- **Postman Collection** published
- **JSON Schema** for data validation

#### API Capabilities
- Punch-out catalog ordering
- Automated invoicing
- Purchase order management
- Fleet management data
- Bill pay integration
- ERP integration (pre-built connectors)
- Processes hundreds of secure customer integrations

#### Integration Patterns
- Procurement system integration (punch-out catalogs)
- ERP system integration (SAP, Oracle, etc.)
- Financial system integration (invoicing/payment)
- Telematics data feeds

### Tech Stack (Inferred)
- **Backend**: Java/.NET enterprise stack
- **API**: REST with OpenAPI spec
- **Infrastructure**: Hybrid cloud (on-prem + AWS/Azure)
- **Mobile**: Native iOS/Android apps
- **IoT**: Proprietary telematics devices + third-party (OEM telematics)

### Pricing
- API access: Available to Total Control customers
- Equipment rental: Standard rental rates
- Platform: Included with rental contracts

---

## 9. EQUIPMENTSHARE -- IoT + Rental Platform

### Overview
EquipmentShare is a technology-enabled construction equipment rental company. Filed for Nasdaq IPO in 2026 (EQPT), $747M offering. One of the fastest-growing US rental providers.

### Proprietary OS: T3
T3 is billed as "the industry's first end-to-end construction operating system" -- developed entirely in-house.

#### T3 Platform Modules
- **Fleet**: OEM-agnostic telematics (GPS, engine diagnostics, utilization)
- **Time Tracking**: Schedule management, labor time cards, work orders
- **E-Logs**: Electronic Logging Device compliance
- **Analytics**: Customizable reports on utilization, job cost
- **Work Orders**: Equipment maintenance management
- **CRM**: Vendor and customer tracking
- **Cost Capture**: Mobile expense recording
- **Inventory**: Parts ordering, consumption planning
- **Rent Ops**: Asset management for external/internal rentals

#### IoT Hardware Stack
- **Proprietary telematics trackers**: Built in-house (not third-party)
- **Access-control keypads**: Control equipment access
- **Data captured**: GPS location, fuel levels, engine diagnostics, operator behavior
- **Real-time visibility**: All assets tracked in real-time
- **Predictive maintenance**: AI-driven maintenance scheduling (2024 upgrade)

#### Technology Strategy
- **Vertical integration**: Owns hardware, software, and rental operations
- **AI-driven maintenance**: Predictive analytics cut fleet downtime 22% vs. industry average
- **Electrification**: Electric/hybrid machines + mobile charging managed through T3
- **ESG reporting**: Verifiable carbon and idle-time data
- **OWN Program**: Capital-light model -- third parties buy equipment, EquipmentShare leases/operates

### Tech Stack (Inferred)
- **Backend**: Microservices (likely Java/Node.js)
- **IoT**: Custom hardware firmware + cloud gateway
- **Cloud**: AWS (primary)
- **Database**: PostgreSQL/MongoDB + time-series DB for telematics
- **Frontend**: React web + React Native mobile
- **AI/ML**: Python-based predictive maintenance models
- **API**: REST API for integrations

### Revenue Model
1. Equipment rental and related services
2. Sales of new/used equipment
3. Parts, supplies, maintenance services
4. Platform revenue (telematics subscriptions + building materials)

---

## 10. VERIZON CONNECT -- Fleet Management AI

### Overview
Verizon Connect is a fleet management and telematics platform. Provides GPS tracking, vehicle diagnostics, driver behavior monitoring, and compliance management. Now integrating AI-powered video telematics.

### Platform Architecture

#### Core Capabilities
- **GPS fleet tracking**: Real-time vehicle location
- **Vehicle diagnostics**: Engine health, fault codes, maintenance alerts
- **Driver behavior**: Speeding, idling, harsh driving monitoring
- **Fuel management**: Fuel consumption tracking and optimization
- **Compliance**: ELD, HOS, DVIR, DOT compliance
- **Route optimization**: AI-powered route planning
- **Video telematics**: AI dashcams with real-time safety alerts
- **EV support**: Electric vehicle charging status, battery monitoring

#### Reveal Platform
- Central fleet management dashboard
- Customizable reports and alerts
- Near real-time vehicle and driver tracking
- Maintenance automation
- Mobile app for field access

#### AI & Machine Learning
- **AI Dashcams**: 46% adoption rate; 74% report improved driver safety
- **Video AI**: Behavior detection, real-time coaching
- **Auto-generated insights**: AI data assistants for trend identification
- **Predictive analytics**: Maintenance prediction, risk scoring
- **Agentic AI**: Emerging autonomous decision-making capabilities

#### API & Developer Platform
- **REST API**: Swagger/OpenAPI specification
- **Developer Portal**: Full documentation, SDKs
- **Common API patterns**:
  - `GET /cmd/v1/vehicles` -- Vehicle list
  - Work order integration
  - Route optimization integration
  - Fuel transaction matching

#### Integration Marketplace
- Pre-built connectors for:
  - Fuel management systems
  - GIS/mapping platforms
  - Route optimization tools (NextBillion.ai)
  - Field service platforms
  - Freight visibility networks
  - Safety intelligence providers
  - Insurance technology providers
- **Snowflake Reader Account**: Direct fleet data querying for BI
- **AEMP 2.0**: Industry standard for equipment data sharing

### Tech Stack (Inferred)
- **Backend**: .NET/Java enterprise stack
- **IoT**: Proprietary GPS/telematics devices
- **Cloud**: Verizon infrastructure + AWS
- **Database**: Enterprise SQL + time-series DB for telematics
- **AI/ML**: Computer vision for video analysis; predictive models for maintenance
- **Frontend**: Web dashboard (React/Angular) + native mobile
- **API**: REST with OpenAPI/Swagger docs

### Pricing
- Per-vehicle, per-month subscription
- Tiers: Reveal Core ($$$), Reveal Field ($$$$), Enterprise ($$$$$)
- Range: $30-$100/vehicle/month
- Video telematics add-on: Additional $20-$50/vehicle/month

### Key Metrics (from 2026 Fleet Trends Report)
- 80% of fleet professionals use GPS tracking (+11% YoY)
- 46% use video telematics (+10% since 2023)
- 11-19% average decreases in fuel, accident, labor, maintenance costs
- 87% reduction in accidents (reported by users)

---

# PART 2: FREE CONSTRUCTION DATA CATALOG

---

## 2.1 BIM / 3D Models (Free)

### buildingSMART Sample Files
- **URL**: https://github.com/buildingSMART/Sample-Test-Files
- **Format**: IFC2x3, IFC4, IFC4x3
- **Content**: Official sample files for various IFC object classes and concepts
- **License**: Free, open
- **Size**: Various test files from simple to complex

### KIT (Karlsruhe Institute) IFC Examples
- **URL**: Available via buildingSMART technical page
- **Format**: IFC4
- **Content**: Building, Bridge, Road models
- **Size**: 386KB (Simple Road) to 10MB (Institute Variants)

### Schependomlaan BIM Dataset
- **Format**: ArchiCAD, IFC, point clouds, schedules, BCF, drone videos
- **Content**: Complete building project dataset
- **License**: Creative Commons
- **Use**: Full BIM workflow testing

### NYC 3D Building Models
- **URL**: https://data.cityofnewyork.us/Housing-Development/3-D-Building-Model/tnru-abg2
- **Format**: .3dm (Rhinoceros), compatible with SketchUp, AutoCAD
- **Content**: Every building in NYC as of 2014 (~1M+ buildings)
- **Source**: DOITT aerial survey, enhanced by DCP
- **License**: NYC Open Data (free)

### NYC CityGML 3D Model (TUM)
- **URL**: https://github.com/tum-gis/3d-model-new-york-city
- **Format**: CityGML LOD1/LOD2
- **Content**: 1M+ buildings, 150K streets, 860K land parcels, terrain, water
- **Size**: ~1.6TB XML (80GB compressed)
- **License**: Open Data, free

### BIMobject (Free Models)
- **URL**: https://www.bimobject.com
- **Content**: Free BIM objects from manufacturers
- **Formats**: Revit, ArchiCAD, IFC, and others
- **License**: Varies by manufacturer; many free

### Trimble 3D Warehouse
- **URL**: https://3dwarehouse.sketchup.com
- **Format**: SKP (SketchUp), exportable to others
- **Content**: Millions of 3D models for buildings, furniture, equipment
- **License**: Free for non-commercial; check individual model licenses

### National Institute of Building Sciences BIM Projects
- **URL**: Available via buildingSMART
- **Content**: 4 Building Information Model Projects and Tools
- **License**: Free

### FreeCAD + BIM Workbench
- **URL**: https://www.freecadweb.org
- **Content**: Open-source parametric 3D CAD with BIM workbench
- **IFC**: Import via IfcOpenShell; export support in development
- **License**: LGPL

---

## 2.2 Construction Schedules / Cost Data (Free)

### RSMeans Data (Free Samples)
- **URL**: https://www.rsmeansonline.com (free trial)
- **Content**: Unit costs, assemblies, building models
- **Free access**: 30-day trial with full database access
- **Student edition**: Free academic access with book purchase
- **Coverage**: US + Canada, adjustable to any location

### ONS Construction Output Price Indices (UK)
- **URL**: https://www.ons.gov.uk
- **Content**: Blended output prices (new work + R&M), UK aggregate
- **Update**: Quarterly (~6 weeks lag)
- **License**: Open Government License
- **Use**: Inflation adjustment, JCT fluctuation Option C

### MHCLG Monthly Building Materials (UK)
- **URL**: https://www.gov.uk/government/statistics
- **Content**: ~15 individual material indices (bricks, timber, steel, concrete)
- **Update**: Monthly (~3-4 week lag)
- **License**: Open Government License
- **Granularity**: ~60 material categories with price indices and volume data

### Costmodelling.com (UK)
- **Content**: Indicative tender/building cost indices, regional factors
- **Update**: Periodic
- **Cost**: Free
- **Strength**: Free regional factors in usable form

### Turner & Townsend / Gleeds Market Reports
- **Content**: Quarterly narrative commentary, forecast direction, benchmarks
- **Format**: Free PDFs
- **Use**: Market intelligence and forecast direction

### US Census Building Permits (Cost Data)
- **URL**: https://www.census.gov/permits
- **Content**: Permit valuations, unit counts, building types
- **Update**: Monthly
- **License**: Public domain

### Construction Inflation Indices (Free Sources)
| Source | Region | Type | Update |
|--------|--------|------|--------|
| ONS COPI | UK | Blended output | Quarterly |
| MHCLG | UK | Materials | Monthly |
| US Census | US | Permit valuations | Monthly |
| Turner & Townsend | Global | Commentary | Quarterly |
| Dodge Data | US | Market trends | Monthly |

---

## 2.3 Permits / Planning Data (Free APIs)

### NYC Department of Buildings (DOB)
- **URL**: https://data.cityofnewyork.us/Housing-Development/DOB-NOW-Build-Approved-Permits/rbx6-tga4
- **API**: Socrata Open Data API (SoQL)
- **Content**: All approved construction permits (DOB NOW system)
- **Fields**: 46 columns including job number, work type, permittee, cost, address, BIN, block/lot, community board
- **Update**: Daily
- **Format**: JSON, CSV, RDF, XML
- **License**: NYC Open Data
- **Volume**: 4.87M+ historical permits

### NYC DOB Additional Datasets
| Dataset | Content | API |
|---------|---------|-----|
| DOB NOW Job Applications | Job applications | JSON via SODA |
| DOB Permit Issuance | All permits historical | JSON via SODA |
| DOB Complaints | Violations | JSON via SODA |
| Stalled Construction Sites | Sites with halted activity | JSON via SODA |

### US Census Bureau Building Permits Survey
- **URL**: https://www.census.gov/permits
- **Content**: National, state, metro, county, place-level residential permits
- **Frequency**: Monthly (8,500 jurisdictions) + Annual (19,000 jurisdictions)
- **Historic**: 1960-present
- **Format**: TXT, XLS, CSV
- **License**: Public domain
- **API**: Not REST, but downloadable files

### LA Department of Building and Safety
- **URL**: https://data.lacity.org
- **Content**: Building permits, inspections, code enforcement
- **Format**: CSV, JSON via Socrata
- **License**: LA Open Data

### UK Planning Portal
- **URL**: https://www.planning.data.gov.uk
- **Content**: UK-wide planning data (being consolidated)
- **Format**: CSV, GeoJSON
- **License**: Open Government License

### Additional Permit Data Sources
| Source | Region | Content | Format |
|--------|--------|---------|--------|
| Chicago Data Portal | Chicago | Building permits | CSV/JSON |
| SF Open Data | San Francisco | Building permits | CSV/JSON |
| data.gov | US Federal | Various building datasets | Mixed |
| data.gov.uk | UK | Planning applications | CSV/GeoJSON |
| EU Open Data | Europe | Construction statistics | CSV |

---

## 2.4 Point Clouds / Scan Data (Free)

### USGS 3DEP (3D Elevation Program)
- **URL**: https://apps.nationalmap.gov/lidar-explorer
- **Content**: Nationwide LiDAR point clouds + DEMs
- **Format**: LAZ (compressed LAS), GeoTIFF DEM
- **Quality**: QL0 (<=0.35m) to QL3 (~1.4m)
- **License**: Public domain, free, no account required
- **Size**: 12 trillion+ point cloud records
- **AWS**: Available as Amazon Public Dataset (s3://usgs-lidar)
- **Alternative access**: Cloud Optimized Point Cloud (COPC) via Microsoft Planetary Computer

### OpenTopography
- **URL**: https://opentopography.org
- **Content**: High-resolution topographic data from research/government sources
- **Note**: Open access datasets free; subscription (OT+) for NOAA/3DEP academic-only data
- **Format**: LAZ/LAS point clouds, GeoTIFF DEM
- **Processing**: On-demand DEM generation, hillshade, slope, aspect
- **Coverage**: US strongest + Europe, NZ, other regions

### NOAA Coastal LiDAR
- **URL**: https://noaa.maps.arcgis.com (via OpenTopography)
- **Content**: Coastal US LiDAR data
- **Format**: Entwine Point Tile (EPT) on AWS
- **License**: Free for academic users (.edu); OT+ subscription for others

### UK Environment Agency LiDAR
- **URL**: https://environment.data.gov.uk
- **Content**: UK-wide LiDAR (DSM, DTM, point cloud)
- **Resolution**: 1m, 2m DTM/DSM; point cloud in some areas
- **License**: Open Government License
- **Format**: ASC, GeoTIFF, LAZ

### National Ecological Observatory Network (NEON)
- **URL**: https://data.neonscience.org
- **Content**: Airborne LiDAR across US ecological sites
- **Format**: LAS/LAZ
- **License**: Free (NSF-funded)

### LINZ Data Service (New Zealand)
- **URL**: https://data.linz.govt.nz
- **Content**: Nationwide LiDAR data
- **Format**: LAZ, GeoTIFF
- **License**: CC BY 4.0

### AHN (Netherlands)
- **URL**: https://www.pdok.nl (via PDOK)
- **Content**: Nationwide high-resolution LiDAR
- **Resolution**: Very high density
- **License**: Free (Dutch government open data)

### Free LiDAR Access Summary
| Source | Region | Resolution | Cost | Format |
|--------|--------|-----------|------|--------|
| USGS 3DEP | US | 0.35-1.4m | Free | LAZ |
| UK EA | UK | 1-2m | Free | LAZ/ASC |
| NEON | US | Variable | Free | LAS/LAZ |
| LINZ | NZ | Variable | Free | LAZ |
| AHN | Netherlands | High | Free | LAZ |
| OpenTopography | Global | Variable | Free/partial | LAZ/LAS |

---

## 2.5 Equipment / Fleet Data (Free)

### AEM (Association of Equipment Manufacturers) Statistics
- **Content**: North American construction equipment sales data
- **Format**: Monthly index reports
- **Access**: Some free summaries; full data subscription
- **Metrics**: Unit sales by equipment type, region

### ONS Construction Output Data (UK)
- **URL**: https://www.ons.gov.uk
- **Content**: Monthly construction output, new orders, price indices
- **Format**: CSV, XLS
- **License**: Open Government License
- **Granularity**: Sector-level (public housing, private housing, infrastructure, etc.)

### US Census Construction Spending
- **URL**: https://www.census.gov/constructionspending
- **Content**: Monthly construction spending by type
- **License**: Public domain

### Equipment World Data
- **URL**: https://www.equipmentworld.com
- **Content**: Industry news, market trends, some free data
- **Format**: Articles + occasional free reports

---

## 2.6 Safety / Incident Data (Free)

### OSHA Injury Tracking Application (ITA) Data
- **URL**: https://www.osha.gov/data
- **Content**: Annual 300A summaries (injury/illness data)
- **Format**: CSV, Excel
- **License**: Public domain
- **Coverage**: ~400K+ establishments
- **Fields**: Employer name, NAICS, injury/illness counts, total hours

### BLS Survey of Occupational Injuries and Illnesses (SOII)
- **URL**: https://www.bls.gov/iif/
- **Content**: National injury/illness estimates by industry
- **Format**: Tables, databases
- **License**: Public domain

### UK HSE RIDDOR Data
- **URL**: https://www.hse.gov.uk/statistics/
- **Content**: Fatal + non-fatal injuries by industry
- **Format**: Excel, CSV
- **License**: Open Government License
- **Key stats**: 35 construction deaths in 2024/25 (4.8x all-industry rate)
- **Discovering Safety**: HSE data dashboard with 3,050 sample RIDDOR records (2011-2017)

### HSE Construction Risk Profiles
- **URL**: https://www.discoveringsafety.com
- **Content**: Visual dashboard of construction RIDDOR data
- **Sample**: 3,050 records, 2011-2017
- **Contact**: discoveringsafety@hse.gov.uk

### Safety Data Sources Summary
| Source | Region | Content | Format |
|--------|--------|---------|--------|
| OSHA ITA | US | Injury/illness summaries | CSV/Excel |
| BLS SOII | US | Industry-level estimates | Tables |
| HSE Stats | UK | RIDDOR data by sector | Excel/CSV |
| Eurostat | EU | Pan-European safety stats | CSV |

---

# PART 3: OPEN-SOURCE CONSTRUCTION TOOLS

---

## 3.1 BIM Servers & Open-Source BIM Tools

### BIMserver
- **URL**: https://bimserver.org | GitHub: https://github.com/opensourceBIM/BIMserver
- **Language**: Java
- **Description**: Open-source BIM database server, fully based on IFC
- **Features**:
  - Store all model revisions
  - Open BIM standards (IFC native)
  - Cloud capabilities
  - Plugin framework for extensions
  - Multiple interfaces (REST, SOAP, protocols)
  - First dedicated open-source BIM server
- **License**: GNU Affero GPL v3
- **Status**: Thousands of users, enterprise-stable
- **Use case**: Build niche BIM applications; store and query IFC models

### IFC.js
- **URL**: https://ifcjs.github.io/info | GitHub: https://github.com/ifcjs
- **Language**: JavaScript/TypeScript, WebGL (Three.js)
- **Description**: Open-source JavaScript library for working with IFC in web apps
- **Features**:
  - Read, edit, create IFC files in browser
  - 3D visualization of IFC models
  - Fast geometry parsing
  - Native IFC paradigm: generate/edit models directly in IFC
- **License**: MIT
- **Community**: Active Discord community
- **Use case**: Web-based BIM viewers, open-source alternatives to proprietary BIM tools

### BlenderBIM / Bonsai
- **URL**: https://blenderbim.org
- **Base**: Blender + IfcOpenShell
- **Description**: Open-source BIM authoring tool built on Blender
- **Features**:
  - Native IFC editing (not just import/export)
  - BIM modeling, scheduling, costing, clash detection
  - Full IFC4 support
  - Drawing generation
  - Quantity takeoff
- **License**: GPL
- **Status**: Active development, increasingly mature

### FreeCAD + BIM Workbench
- **URL**: https://www.freecadweb.org
- **Language**: Python/C++
- **Description**: Open-source parametric 3D CAD with BIM module
- **Features**:
  - IFC import via IfcOpenShell
  - IFC export (in development)
  - Parametric modeling
  - Architectural/BIM workbench
  - Engineering tools (structural, MEP)
- **License**: LGPL
- **Status**: Mature, active development

### IfcOpenShell
- **URL**: https://ifcopenshell.org
- **Language**: C++ with Python bindings
- **Description**: Open-source IFC geometry engine based on Open CASCADE
- **Features**:
  - IFC file parsing and geometry conversion
  - Blender importer (basis for BlenderBIM)
  - Command-line conversion to .OBJ
  - Supports IFC2x3 and IFC4
- **License**: LGPL

### xBIM Toolkit
- **URL**: https://docs.xbim.net | GitHub: https://github.com/xBimTeam
- **Language**: .NET/C#
- **Description**: eXtensible Building Information Modeling toolkit
- **Features**:
  - Full IFC2x3 and IFC4 support
  - Read, create, view BIM models
  - Geometry + topology operations
  - Visualization (desktop and web)
  - IFC-COBie bidirectional translation
- **License**: CDDL (open source)
- **Use case**: .NET BIM application development

### xeokit SDK
- **URL**: https://xeokit.io | GitHub: https://github.com/xeokit
- **Language**: JavaScript/WebGL
- **Description**: Open-source 3D graphics SDK for BIM and AEC
- **Features**:
  - Fast loading of huge models
  - Hardware-accelerated rendering
  - Double-precision geometry for GIS
  - Multiple formats: IFC (2x3, 4.3), glTF, OBJ, STL, 3DXML, LAZ/LAS, CityJSON
  - BCF (BIM Collaboration Format) support
  - Dynamic scenes, section planes, annotations
- **License**: AGPL (SDK) + commercial options

### BIMsurfer / BIMserver Plugins
- **URL**: https://bimsurfer.org
- **Description**: Open-source WebGL viewer for IFC in browser
- **Features**:
  - Web-based IFC visualization
  - Connects to BIMserver
  - No plugin required (WebGL)
- **License**: Open source

---

## 3.2 Construction Management (Free/Open Source)

### ERPNext (with Construction Module)
- **URL**: https://erpnext.com | GitHub: https://github.com/frappe/erpnext
- **Language**: Python (Frappe framework)
- **Description**: Full open-source ERP with dedicated construction vertical
- **Construction features**:
  - Project management + Gantt charts
  - BOQ-based estimating
  - Subcontract management
  - Material requests and purchase orders
  - Job costing + accounting integration
  - Time tracking
  - HR + payroll
- **Pricing**: Self-hosted = FREE; Frappe Cloud from $10/user/month
- **License**: GNU GPL
- **Best for**: Full construction ERP with accounting, inventory, HR
- **Learning curve**: Steep (4-8 weeks setup)

### OpenProject
- **URL**: https://www.openproject.org | GitHub: https://github.com/opf/openproject
- **Language**: Ruby on Rails
- **Description**: Full-featured open-source PM suite
- **Construction-relevant features**:
  - Gantt charts with critical path
  - Project hierarchies (program > project > subproject)
  - Work packages with custom statuses
  - Document attachments, time tracking
  - Multiple plugins available
- **Pricing**: Community = FREE (self-host); Cloud from $9/user/month
- **License**: GPL
- **Note**: Not construction-specific; RFIs/change orders need custom work packages

### Odoo Community Edition
- **URL**: https://www.odoo.com | GitHub: https://github.com/odoo/odoo
- **Language**: Python
- **Description**: Modular ERP with community-built construction apps
- **Construction modules**: Project + Field Service + Inventory + Manufacturing
- **Pricing**: Community = FREE (self-host); Online from $24/user/month
- **License**: LGPL
- **Note**: Most useful construction modules sold by Odoo partners ($200-$2K/module)

### Redmine
- **URL**: https://www.redmine.org | GitHub: https://github.com/redmine/redmine
- **Language**: Ruby on Rails
- **Description**: Issue tracker adapted for construction RFIs, change orders, punch lists
- **Features**:
  - Custom workflows for RFIs/change orders
  - Time tracking, Gantt, document management
  - Plugin ecosystem
  - LDAP authentication
- **Pricing**: FREE (self-host only)
- **License**: GPL
- **Note**: Works well if you can map construction issues to ticket workflows

### LibrePlan
- **URL**: https://www.libreplan.dev | GitHub: https://github.com/LibrePlan/libreplan
- **Language**: Java
- **Description**: Collaborative web-based project planning, monitoring, control
- **Features**:
  - Work Breakdown Structure (WBS)
  - Resource management (workers + machines)
  - Skills-based and specific resource allocation
  - Project templates for repetitive work
  - Monte Carlo simulation for date probability
  - Earned Value Management
  - Subcontractor progress tracking
  - Timesheets, cost analysis, quality forms
  - JIRA/Tim synchronization
  - Web services for data import/export
- **Pricing**: FREE (open source)
- **License**: AGPL
- **Status**: Actively maintained (v1.6.0 released 2026)

### ProjectLibre
- **URL**: https://www.projectlibre.com
- **Description**: Free desktop alternative to Microsoft Project
- **Features**:
  - Gantt charts, dependencies, resource leveling
  - Critical path analysis
  - Reads .mpp files (MS Project)
  - Cross-platform (Windows, macOS, Linux)
- **Pricing**: Desktop = FREE; Cloud from $5/user/month
- **License**: CPAL (open source)
- **Note**: Single-user desktop app; collaboration by file sharing

### GanttProject
- **URL**: https://www.ganttproject.biz
- **Description**: Standalone Gantt chart tool
- **Pricing**: FREE
- **License**: GPL
- **Note**: Very low learning curve; suitable for small teams

---

## 3.3 Computer Vision for Construction (Free/Open Source)

### OpenCV
- **URL**: https://opencv.org
- **Language**: C++/Python
- **Description**: Industry-standard computer vision library
- **Construction applications**:
  - Site monitoring (motion detection, object counting)
  - Safety compliance (PPE detection)
  - Progress tracking (image comparison)
  - Material identification
- **License**: Apache 2.0
- **Status**: Mature, extensive documentation

### YOLO (You Only Look Once)
- **URL**: https://github.com/ultralytics/ultralytics
- **Description**: Real-time object detection framework
- **Construction applications**:
  - **PPE detection**: Hard hats, safety vests, safety glasses
  - **Equipment detection**: Excavators, cranes, trucks
  - **Worker counting**: Site occupancy monitoring
  - **Material detection**: Stockpile volumes, material types
- **Models**: YOLOv8, YOLOv11, YOLOX (all open source)
- **Pre-trained construction datasets**:
  - CHVG dataset: 1,699 images, 8 classes (hardhats, vests, glasses, person)
  - Roboflow Universe: 100+ construction-related datasets
- **License**: AGPL/Commercial options
- **Training**: Fine-tune on custom construction imagery

### OpenMVG (Open Multiple View Geometry)
- **URL**: https://github.com/openMVG/openMVG
- **Language**: C++
- **Description**: Photogrammetry library for 3D reconstruction from images
- **Construction applications**:
  - As-built documentation from site photos
  - Progress comparison through 3D reconstruction
  - Measurement from photographs
- **License**: MPL 2.0

### COLMAP
- **URL**: https://colmap.github.io | GitHub: https://github.com/colmap/colmap
- **Language**: C++/CUDA
- **Description**: General-purpose Structure-from-Motion (SfM) and Multi-View Stereo (MVS)
- **Construction applications**:
  - Dense 3D reconstruction from site photos
  - Point cloud generation for progress comparison
  - Camera pose estimation for documentation
- **License**: BSD (new)
- **GPU**: CUDA support for faster processing

### OpenMVS
- **URL**: https://github.com/cdcseacave/openMVS
- **Description**: Multi-view stereopsis for dense point cloud reconstruction
- **Works with**: OpenMVG output
- **Construction use**: Generate dense point clouds from site photos

### PDAL (Point Data Abstraction Library)
- **URL**: https://pdal.io
- **Description**: Point cloud processing pipeline
- **Construction applications**:
  - LiDAR point cloud filtering, classification
  - Format conversion (LAS/LAZ/PLY/XYZ)
  - DEM generation
  - Clipping, merging, reprojection
- **License**: BSD

### CloudCompare
- **URL**: https://www.cloudcompare.org
- **Description**: 3D point cloud and mesh processing software
- **Construction applications**:
  - Visualize and compare point clouds
  - BIM-to-point-cloud comparison
  - Change detection between scans
  - Measurement tools
- **License**: GPL
- **Platform**: Windows, macOS, Linux

### QGIS + Point Cloud
- **URL**: https://qgis.org
- **Description**: Open-source GIS with native point cloud support
- **Construction applications**:
  - Site survey visualization
  - Point cloud overlay on maps
  - Terrain analysis
  - Data integration (LiDAR, drone data)
- **License**: GPL

### Summary: Open-Source CV Pipeline for Construction
```
Data Collection          Processing              Analysis              Output
-------------            -----------             ---------             ------
Site Photos     ----->   COLMAP/OpenMVG   ---->  CloudCompare   ---->  Progress Report
Drone Imagery            (SfM + MVS)             (Point Cloud
                                                        Comparison)

CCTV/GoPro      ----->   YOLO (fine-tuned)  -->  OpenCV        ---->  Safety Alerts
360 Cameras              (PPE/equipment          (Visualization
                         detection)                          + Logging)

LiDAR Scans     ----->   PDAL                  ->  QGIS/         ---->  BIM Compare
                                                CloudCompare
```

---

# PART 4: BOOTSTRAP ALTERNATIVES TO EXPENSIVE CONSTRUCTION SAAS

---

## Building a Construction Tech Stack for Under $500/Month

### Project Management: OpenProject (Community) + LibrePlan
- **Cost**: $50-100/month (VPS hosting)
- **Replaces**: Procore ($400-1,500/user/year), ACC ($300-2,000/user)
- **Stack**: DigitalOcean droplet + Docker + PostgreSQL

### BIM/3D: BlenderBIM + IFC.js + BIMserver
- **Cost**: $20/month (VPS for BIMserver)
- **Replaces**: Revit ($2,500/year/user), Navisworks ($8,000+), ACC BIM ($$$)

### Cost Estimating: RSMeans Trial + Custom Spreadsheet + ONS/MHCLG Data
- **Cost**: FREE (use trial period + free government data)
- **Replaces**: RSMeans subscription ($$$), BCIS (600-2,000 GBP/year)

### Safety Monitoring: YOLO + OpenCV + Raspberry Pi
- **Cost**: $50-100/month (hardware + cloud processing)
- **Replaces**: Smartvid.io ($$$), Buildots progress ($50-200K/project)

### Reality Capture: COLMAP + CloudCompare + 360 Camera
- **Cost**: $300 (camera) + $50/month (processing)
- **Replaces**: OpenSpace ($500-2,000/project/month), Matterport ($$$)

### Fleet Tracking: GPS trackers + OpenStreetMap + custom dashboard
- **Cost**: $100-200/month (devices + data)
- **Replaces**: Verizon Connect ($30-100/vehicle/month), Samsara ($$$)

### Full Stack Monthly Cost: ~$300-500/month
### vs. Commercial Equivalent: $5,000-50,000+/month

---

## Key Open-Source Communities & Resources

| Community | URL | Focus |
|-----------|-----|-------|
| OSArch | https://osarch.org | Free software for architecture |
| IFC.js Discord | https://discord.gg/ifcjs | Web-based BIM development |
| BlenderBIM Forum | https://community.osarch.org | Open-source BIM authoring |
| buildingSMART | https://www.buildingsmart.org | IFC standards + samples |
| opensource.construction | https://opensource.construction | Swiss/European OSS in construction |
| Procore Developers | https://developers.procore.com | Procore API docs |
| Autodesk Platform Services | https://aps.autodesk.com | ACC/BIM 360 APIs |

---

*Document compiled from public sources as of June 2025. All competitor information is reverse-engineered from publicly available documentation, press releases, API references, and developer portals. No proprietary or confidential information was accessed.*
