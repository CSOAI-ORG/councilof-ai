# OPERATION SYNTHETIC — CROSS-DOMAIN SIMULATION DATA PLAN
## Healthcare + Police + Fire + Ambulance Training Data from SOV TOWN (UE5)

**Classification:** DEFONEOS Internal Research
**Prepared for:** Cross-Domain Synthetic Data Generation Initiative
**Platform Base:** SOV TOWN (Unreal Engine 5 Simulated Urban Environment)

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Healthcare Simulation in UE5](#2-healthcare-simulation-in-ue5)
3. [Police Simulation in UE5](#3-police-simulation-in-ue5)
4. [Fire & Rescue Simulation in UE5](#4-fire--rescue-simulation-in-ue5)
5. [Ambulance / Emergency Services Simulation](#5-ambulance--emergency-services-simulation)
6. [Cross-Domain Integration Architecture](#6-cross-domain-integration-architecture)
7. [Existing Platforms & Cost Comparison](#7-existing-platforms--cost-comparison)
8. [Data Export & Labeling Pipeline](#8-data-export--labeling-pipeline)
9. [Implementation Roadmap](#9-implementation-roadmap)
10. [Cost Analysis & ROI](#10-cost-analysis--roi)

---

## 1. EXECUTIVE SUMMARY

This document outlines a comprehensive plan to transform SOV TOWN — a UE5-based simulated urban environment — into a multi-domain synthetic data generation platform serving healthcare, police, fire/rescue, and ambulance/emergency services AI training. By leveraging UE5's photorealistic rendering, Niagara physics, MassAI crowd systems, and multi-modal sensor simulation, a single simulation event can simultaneously generate training data for all four domains.

### Key Value Proposition

| Metric | Traditional Training | SOV TOWN Synthetic |
|--------|---------------------|-------------------|
| Cost per trainee (Year 1) | $229-$328 | $9-$115 |
| Cost per trainee (Year 3) | $229 | $9 |
| Scenario variety | Limited by budget | Unlimited |
| Rare event coverage | Difficult/impossible | On-demand |
| Multi-domain overlap | Requires separate exercises | Single simulation |
| Risk to personnel | Present | Zero |
| Data annotation | Manual ($$$) | Automatic (free) |

### Cross-Domain Data Multiplier

A single car crash simulation in SOV TOWN generates:
- **Police data:** Pursuit behavior, crowd control, evidence documentation, bodycam footage
- **Ambulance data:** Triage priority, route optimization, casualty assessment
- **Fire data:** Extrication procedures, hazmat detection, fire suppression
- **Hospital data:** Patient flow, ED capacity prediction, resource allocation

---

## 2. HEALTHCARE SIMULATION IN UE5

### 2.1 Hospital Environment Assets

**UE5 Medical Asset Ecosystem:**

| Asset Pack | Contents | Cost |
|------------|----------|------|
| Medical Equipment 3D Models Pack | 440+ professional medical 3D assets | $38.70 |
| Modular 3D Hospital Environment | 25 modular hospital assets (free) | $0 |
| Abandoned Hospital Pack | Modular walls, ceilings, floors, props | Marketplace |
| Custom SOV TOWN Hospital Module | ED, triage, OR, ICU, ward (built) | Dev cost |

**Recommended SOV TOWN Hospital Module Configuration:**

```
HOSPITAL_ZONE (UE5 Level Subsystem)
|-- Emergency Department
|   |-- Triage bay (4 stations)
|   |-- Waiting room (40 capacity)
|   |-- Trauma bays (6 beds)
|   |-- Minor procedure rooms (4)
|   |-- Resuscitation area (2 bays)
|   |-- Nurse station
|   |-- CT/MRI corridor
|-- Inpatient Wing
|   |-- ICU (12 beds)
|   |-- General wards (60 beds)
|   |-- Isolation rooms (6)
|-- Surgical Suite
|   |-- Operating rooms (8)
|   |-- Pre-op holding (12)
|   |-- PACU (8 beds)
|-- Support Areas
|   |-- Pharmacy
    |-- Lab
    |-- Central supply
    |-- Loading dock
```

### 2.2 Patient Flow Optimization Training Data

**Based on AnyLogic/Simio Research Models:**

UE5 can simulate and generate training data for:

| Simulation Parameter | Distribution | Average |
|---------------------|-------------|---------|
| Triage duration | Uniform(5,15) min | 10 min |
| Vital signs check | Uniform(5,10) min | 7.5 min |
| Bed assignment | Uniform(5,15) min | 10 min |
| ED bed time | Uniform(60,120) min | 90 min |
| Waiting room | Gamma distribution | 35 min |
| Service + wait | Gamma distribution | 150 min |
| Discharge/Admission | Uniform(10,20) min | 15 min |
| **Total Average LOS** | — | **5.5 hours** |

**Synthetic Data Features for Patient Flow AI:**
- Patient ID, patient type (1-4 classification)
- Arrival time, exit time
- Waiting time per zone
- Resource utilization %
- Queue counts before/after processing
- Length of stay (LOS) per zone
- Patient satisfaction proxy metrics
- Staff movement patterns
- Infection exposure tracking (COVID-style HAI modeling)

### 2.3 Emergency Department Scenario Generation

**Scenarios to Generate:**

1. **Normal Operations:** Baseline patient flow with varied arrival rates
2. **Surge Events:** Mass casualty incidents, pandemic waves
3. **Resource Constraints:** Reduced bed count, staff shortages
4. **Severity Escalation:** Higher-acuity patient influx
5. **Infection Spread:** HAI tracking via contact network analysis
6. **Equipment Failure:** Diagnostic downtime scenarios

**ML Training Targets:**

| AI Model | Input Features | Output | Performance Target |
|----------|---------------|--------|-------------------|
| Hospital Capacity Prediction | Arrival rate, LOS, bed occupancy, staffing | 4-hour capacity forecast | MAPE < 10% |
| Patient Triage AI | Vitals, chief complaint, demographics | Triage level (1-5) | AUROC > 0.85 |
| Resource Allocation AI | Queue lengths, staff locations, equipment status | Optimal staffing plan | Wait reduction 33% |
| ED Response Time | Patient load, acuity mix, resource availability | Time-to-care prediction | R^2 > 0.80 |
| Infection Risk | Patient flow graph, contact duration, zone visits | HAI probability | Sensitivity > 80% |

### 2.4 Medical Equipment Detection/Tracking

**Training Data for Equipment Tracking AI:**
- Bounding boxes for 50+ equipment types (ventilators, IV pumps, defibrillators)
- Instance segmentation for equipment-state detection (on/idle/alarm)
- Temporal tracking for utilization analysis
- Occlusion handling (equipment behind curtains, in use)

**Equipment Categories:**
- Life support: Ventilators, ECMO, dialysis machines
- Monitoring: Patient monitors, pulse oximeters, telemetry
- Diagnostic: Ultrasound, portable X-ray, ECG
- Treatment: Infusion pumps, defibrillators, suction
- Mobility: Wheelchairs, stretchers, hospital beds

### 2.5 Staff Movement Pattern Analysis

**Synthetic Data Points:**
- Nurse/doctor trajectories through hospital zones
- Response time to call button activations
- Hand hygiene compliance via proximity detection
- Team clustering during codes/trauma
- Bottleneck identification from density heatmaps

### 2.6 Infection Spread Simulation (HAI)

Based on research using AnyLogic for HAI modeling in EDs:

- Patient contact network generation
- Zone-based exposure tracking
- Duration-weighted infection probability
- Staff as transmission vectors
- Containment intervention testing

---

## 3. POLICE SIMULATION IN UE5

### 3.1 Urban Environment Scenarios (SOV TOWN Ready)

SOV TOWN's existing urban environment provides:
- Street grid with realistic traffic patterns
- Commercial/residential/industrial zones
- Public spaces (parks, plazas, transit stations)
- Indoor environments (malls, offices, schools)
- Dynamic lighting (day/night/cycle)
- Weather conditions (rain, fog, snow)

### 3.2 Crowd Behavior Simulation

**UE5 MassAI Crowd System Specifications:**

| Feature | Capability |
|---------|-----------|
| NPC Count | 10,000+ at 60fps |
| Simulation Method | Mass Entity Framework + Zone Graphs |
| LOD Tiers | 4-tier (skeletal → VAT → instanced → impostor) |
| Behaviors | Walking, social, panic, evacuation, fighting |
| Avoidance | Velocity-based RVO/ORCA |

**Photorealistic Synthetic Crowds Simulation (PSCS-I) Dataset — PROVEN APPROACH:**

The PSCS-I project demonstrates UE5's capability for police-relevant crowd simulation:
- **26 unique indoor environments**
- **53.8 hours of annotated videos** at frame level
- **Normal behaviors:** Walking, social gathering
- **Abnormal behaviors:** Running, evacuation, fighting
- **Trigger events:** Earthquake, gunshot, fire alarm
- **Body Worn Camera (BWC) perspective included**
- **CrimeNet architecture** for behavior classification

**Crowd Behavior Categories for Training Data:**

```
CROWD_BEHAVIOR_TAXONOMY
|-- Normal
|   |-- Casual walking
|   |-- Social gathering
|   |-- Queue/line formation
|   |-- Seated/dining
|-- Abnormal
|   |-- Panic/evacuation
|   |-- Stampede/crush
|   |-- Violent altercation
|   |-- Active threat response
|   |-- Protest/demonstration
|   |-- Looting/vandalism
```

### 3.3 Pursuit Scenario Generation

**Vehicle Pursuit Data Generation:**
- Multiple pursuit routes through urban grid
- Varying traffic densities (MassTraffic integration)
- Time-of-day lighting variations
- Weather condition effects
- Pedestrian hazard scenarios
- Termination outcome variations

**Training Data Outputs:**
- Vehicle trajectory prediction
- Pursuit termination decision support
- Risk assessment scoring
- Interceptor positioning optimization

### 3.4 Crime Scene Simulation

**Simulated Crime Scenarios:**
- Burglary (residential/commercial)
- Assault (street/domestic/bar)
- Robbery (bank/store/ATM)
- Vehicle theft
- Vandalism
- Evidence placement and documentation

**Data for Evidence Analysis AI:**
- Evidence positioning (ground truth 3D coordinates)
- Scene reconstruction viewpoints
- Timeline reconstruction
- Witness perspective lines of sight

### 3.5 Patrol Route Optimization Training Data

**Synthetic Patrol Data:**
- Officer foot/vehicle patrol paths
- Response time to call locations
- Crime hotspot coverage metrics
- Backup arrival time modeling
- Community interaction logging

### 3.6 Body Cam Footage Simulation

**BWC Simulation Pipeline:**

| Parameter | Configuration Range |
|-----------|-------------------|
| Camera position | Chest-mounted ( officer POV) |
| Field of view | 120°-170° wide angle |
| Resolution | 1080p/4K |
| Frame rate | 30/60 fps |
| Lighting | Day/night/low-light/IR |
| Motion | Natural head/body movement |
| Audio | Situational soundscape |

**UE5 BWC Perspective Setup:**
- First-person camera at chest height
- Slight bob/walk cycle animation
- Low-angle perspective of suspects
- Close-quarters indoor framing
- Rapid panning during pursuits
- Ground-level fall perspective

**Training Data for Body Cam AI:**
- Object detection: Weapons, evidence, vehicles, persons
- Action recognition: Draw weapon, handcuff, de-escalation
- Audio transcription: Keyword detection, stress analysis
- Scene classification: Traffic stop, domestic, active threat
- Evidence detection: Casings, drugs, weapons, documents

### 3.7 Training Data Targets

| AI Model | Training Data from UE5 |
|----------|----------------------|
| Crowd Anomaly Detection | PSCS-I style crowd videos with behavior labels |
| Vehicle Pursuit Prediction | Pursuit trajectory + traffic state data |
| Patrol Optimization | Patrol path + incident response time data |
| Suspect Behavior Classification | BWC footage with annotated behavior labels |
| Body Cam Evidence Analysis | Simulated scenes with ground-truth evidence positions |
| De-escalation Analysis | Scenario branching with outcome labels |

---

## 4. FIRE & RESCUE SIMULATION IN UE5

### 4.1 Fire Propagation Simulation (Niagara Particles/Fluids)

**UE5 Fire Simulation Capabilities:**

**Niagara Fluids (GPU-accelerated 3D gas simulation):**
- Voxel-grid-based fluid simulation
- Temperature-driven buoyancy
- Density-controlled smoke thickness
- Skeletal mesh collision support
- Sim cache for baked playback

**Performance Characteristics:**
- Real-time 3D gas sim: High GPU cost (~6ms on RTX 4080 at 200 resolution)
- Cached simulation: Playable at 50-110 fps
- Recommended: Bake complex fires, use real-time for simple effects

**FIRE-EVSim Framework Integration:**
- BIM + UE5 integration for realistic building geometry
- Physics engine controls fire spread behavior
- Niagara VFX for particle motion and visual occlusion
- Temperature, CO concentration, and visibility tracking

### 4.2 Smoke Behavior in Buildings

**Simulation Parameters:**
- Smoke generation rate by fire intensity
- Temperature gradient effects on smoke rise
- HVAC system influence on smoke spread
- Ventilation/positive pressure effects
- Visibility degradation over time
- CO concentration modeling

**Critical Metrics for Training Data:**
- Available Safe Egress Time (ASET)
- Required Safe Egress Time (RSET)
- Visibility distance at each location
- Temperature profile over time
- Toxic gas concentration levels

### 4.3 Evacuation Scenario Generation

**Evacuation Scenarios:**

1. **Simple building fire** — Single exit blocked
2. **High-rise evacuation** — Stairwell smoke filling
3. **Hospital evacuation** — Non-ambulatory patients
4. **Stadium/concert** — Mass crowd evacuation
5. **School lockdown + fire** — Dual hazard scenario
6. **Underground parking** — Limited ventilation
7. **Wildland-urban interface** — Defensible space testing

**Evacuation Behavior Modeling:**
- Normal walking speed: 1.2-1.5 m/s
- Panic speed: 2.0-3.0 m/s
- Alert response time distribution
- Route choice behavior
- Helping vs. self-preservation behavior
- Group/family cohesion effects

### 4.4 Firefighter Movement Optimization

**Training Data for Firefighter AI:**
- Optimal hose line deployment paths
- Search pattern efficiency (L/R hand search)
- SCBA air consumption rate modeling
- Mayday/LODD scenario reconstruction
-RIT (Rapid Intervention Team) deployment
- Water application technique optimization

### 4.5 Wildfire Spread Simulation

**Dual-Model Deep Learning Approach (Research-Validated):**

Model A: U-Net for burnt area prediction (3-hour forecast)
Model B: ConvLSTM for real-time refinement

**Training Data Specifications:**
- Resolution: 5m per pixel
- Time step: 5 minutes
- Input parameters: 12-band (temperature, moisture, fuel types, wind, topography)
- Performance: >90% agreement with numerical simulation
- Speed: 10^2-10^4x faster than direct simulation

**Wildfire Simulation Parameters:**
- Fuel type and moisture content
- Wind speed and direction
- Temperature and humidity
- Slope and aspect (topography)
- Ignition point location
- Crown fire spotting probability

### 4.6 Fire Detection Training Data

**Fire Detection Dataset Generation:**

| Modality | Content | Format |
|----------|---------|--------|
| RGB camera | Visible spectrum fire/smoke | 1920x1080 JPEG |
| Thermal (LWIR) | Heat signature detection | 640x512 TIFF |
| Smoke density | Volumetric smoke concentration | 3D grid |
| Temperature | Surface/ambient temperature | Per-pixel °C |
| CO concentration | Toxic gas levels | PPM per zone |
| Visibility | Sight distance | Meters per zone |

**FLIR Thermal Dataset Reference:**
- 26,442 fully annotated frames
- 520,000 bounding box annotations
- 15 object categories (person, bike, car, motorcycle, bus, etc.)
- Both thermal (14-bit TIFF) and RGB (8-bit JPEG)
- MSCOCO formatted annotations

### 4.7 Training Data Targets

| AI Model | Training Data from UE5 |
|----------|----------------------|
| Fire Detection (smoke/heat) | RGB + thermal video with fire segmentation masks |
| Fire Spread Prediction | 12-band input + burnt area output (5m res, 5min timestep) |
| Evacuation Route Optimization | Occupant trajectory + smoke/heat exposure data |
| Resource Deployment | Fire unit dispatch + suppression effectiveness |
| Thermal Imaging Analysis | FLIR-style thermal video with annotated hot spots |
| Wildfire Prediction | Topographic + meteorological + fuel type inputs |

---

## 5. AMBULANCE / EMERGENCY SERVICES SIMULATION

### 5.1 Traffic Scenario Generation

**UE5 MassTraffic System:**

| Feature | Capability |
|---------|-----------|
| Vehicle count | 1,000-5,000+ simultaneously |
| Lane following | Built-in lane-keeping |
| Intersection logic | Signal-based traffic lights |
| Emergency vehicle protocols | Traffic pulls over for sirens |
| Dynamic re-routing | Avoid blocked roads |
| Per-vehicle cost | ~0.005ms |

**Traffic Simulation Extensions for EMS:**
- Emergency vehicle siren response (traffic pulling over)
- Rush hour vs. off-peak traffic density
- Accident scene rubbernecking delays
- Road closure/detour scenarios
- Weather-affected traffic speed
- Construction zone navigation

### 5.2 Accident Scene Simulation

**Multi-Vehicle Collision Scenarios:**

```
ACCIDENT_SCENE_TAXONOMY
|-- Severity
|   |-- Minor (fender bender)
|   |-- Moderate (airbag deployment, injuries)
|   |-- Severe (entrapment, fatalities)
|   |-- Mass casualty (bus/plane/pile-up)
|-- Type
|   |-- Rear-end collision
|   |-- Side-impact (T-bone)
|   |-- Head-on collision
|   |-- Rollover
|   |-- Multi-vehicle pile-up
|   |-- Pedestrian struck
|   |-- Motorcycle collision
|-- Environment
|   |-- Intersection
|   |-- Highway
|   |-- Residential street
|   |-- Parking lot
|   |-- Construction zone
```

**Scene Elements:**
- Vehicle damage states (deformation, fire, fluid leaks)
- Casualty positioning and injury severity
- Hazmat spill indicators
- Traffic disruption geometry
- Bystander crowd formation
- Weather/lighting conditions

### 5.3 Route Optimization Training Data

**Emergency Vehicle Routing Data:**

Based on validated routing research:

| Approach | Performance vs Shortest Path |
|----------|----------------------------|
| Shortest path | Baseline (100%) |
| Hybrid (shortest + lane reservation) | ~70% of baseline time |
| Emergency path (fastest + lane reservation) | ~65% of baseline time |
| Proposed UE5 dynamic routing | <30% of baseline at 70% congestion |

**Data Features for Route AI:**
- Origin (station/hospital), destination (scene/hospital)
- Real-time traffic density per road segment
- Congestion rate (0-100%)
- Average speed per segment
- Historical travel times
- Incident reports on route
- Road closures/construction
- Time of day, day of week patterns

### 5.4 Multi-Casualty Incident Scenarios

**MCI Scenario Types:**
1. **Transportation:** Bus crash, train derailment, plane incident
2. **Structural:** Building collapse, bridge failure
3. **Industrial:** Chemical plant, refinery incident
4. **Natural:** Earthquake, flood, tornado
5. **Intentional:** Active shooter, bombing, CBRN

**MCI Training Data:**
- Triage tag color distribution (Red/Yellow/Green/Black)
- Patient distribution across scene
- Resource requirement forecasting
- Hospital surge capacity matching
- Transport unit assignment optimization

### 5.5 Training Data Targets

| AI Model | Training Data from UE5 |
|----------|----------------------|
| Traffic Incident Detection | Aerial/street-level camera feeds with incident labels |
| Fastest Route Calculation | Road network state + EV travel time labels |
| Triage Priority Optimization | Patient vital signs + correct triage level labels |
| Hospital Selection | Patient condition + hospital capacity + travel time |
| MCI Resource Planning | Casualty count/severity + resource deployment data |

---

## 6. CROSS-DOMAIN INTEGRATION ARCHITECTURE

### 6.1 One Simulation, Multiple Domains

**SOV TOWN Multi-Domain Event Pipeline:**

```
SINGLE_SIMULATION_EVENT
    |
    v
[CAR_CRASH_SCENARIO]
    |
    +---> POLICE_DOMAIN
    |       +-- Pursuit footage (dash cam, BWC)
    |       +-- Crash scene documentation
    |       +-- Witness interviews
    |       +-- Traffic control
    |       +-- Evidence collection
    |
    +---> AMBULANCE_DOMAIN
    |       +-- Dispatch call timing
    |       +-- Route + traffic response
    |       +-- Scene triage decisions
    |       +-- Patient packaging
    |       +-- Transport logistics
    |
    +---> FIRE_DOMAIN
    |       +-- Vehicle fire suppression
    |       +-- Extrication procedures
    |       +-- Hazmat assessment
    |       +-- Scene safety
    |       +-- Thermal imaging
    |
    +---> HOSPITAL_DOMAIN
            +-- ED arrival surge
            +-- Trauma team activation
            +-- Resource allocation
            +-- Patient flow management
            +-- OR scheduling
```

### 6.2 Shared Urban Environment

**SOV TOWN Domain Overlay Architecture:**

```
SOV_TOWN_BASE (UE5 Persistent Level)
|-- Urban environment (roads, buildings, terrain)
|-- Traffic system (MassTraffic)
|-- Crowd system (MassAI)
|-- Weather/day-night cycle
|
|-- POLICE_OVERLAY
|   |-- Police precinct building
|   |-- Patrol route waypoints
|   |-- CCTV camera network
|   |-- Booking/processing areas
|
|-- FIRE_OVERLAY
|   |-- Fire station buildings
|   |-- Hydrant locations
|   |-- Standpipe connections
|   |-- Pre-plan building layouts
|
|-- HOSPITAL_OVERLAY
|   |-- Hospital building (full interior)
|   |-- Ambulance bay
|   |-- Helipad
|   |-- ED interior
|
|-- AMBULANCE_OVERLAY
    |-- EMS station
    |-- Hospital destinations
    |-- Route priority graph
    |-- Equipment inventory
```

### 6.3 Multi-Agency Response Scenarios

**Integrated Scenario: Active Shooter + Mass Casualty**

Timeline data generation:

| Time | Police | Fire | Ambulance | Hospital |
|------|--------|------|-----------|----------|
| T+0 | Dispatch, containment | Staging, RIT | Staging | Standby |
| T+5 | Entry team deployment | — | — | Trauma alert |
| T+10 | Suspect neutralized | — | Triage team entry | OR prep |
| T+15 | Scene secure | Fire standby | Patient packaging | Staff recall |
| T+20 | Investigation start | — | Transport wave 1 | ED intake |
| T+30 | Witness interviews | — | Transport wave 2 | Surge active |

### 6.4 Simultaneous Data Output

**Per-Event Data Products:**

| Domain | Images | Video | 3D Data | Tabular | Annotations |
|--------|--------|-------|---------|---------|-------------|
| Police | 5K-10K | 2-4 hrs | Scene scan | Incident log | BBox, seg, labels |
| Fire | 3K-5K | 1-2 hrs | Thermal scan | Sensor log | Heat maps, masks |
| Ambulance | 2K-4K | 1-3 hrs | Route GPS | Dispatch log | Triage labels |
| Hospital | 8K-15K | 4-8 hrs | Patient flow | EHR synthetic | Flow labels |

---

## 7. EXISTING PLATFORMS & COST COMPARISON

### 7.1 Healthcare Simulation Platforms

| Platform | Type | Cost | UE5 Alternative? |
|----------|------|------|-----------------|
| VirtaMed ArthroS | VR Surgical | $114,000 | Yes (custom) |
| Simbionix Arthro Mentor | VR Surgical | $73,000 | Yes (custom) |
| PrecisionOS Orthopedic | VR Annual | $3,500/yr + $299/headset | Yes |
| OSSimTech TSym | VR Surgical | Contact for pricing | Yes |
| AnyLogic (simulation) | DES Patient Flow | ~$15K-50K license | Partial (UE5 + Python) |
| Simio | DES Patient Flow | Enterprise pricing | Partial |

### 7.2 Police Training Platforms

| Platform | Type | Cost | UE5 Alternative? |
|----------|------|------|-----------------|
| VirTra 300 | 300° Screen Simulator | $300,000 | Yes (significantly cheaper) |
| VirTra V-100 | 180° Screen | ~$150,000 | Yes |
| ChimeraXR Mythos | VR Headset | Lower than VirTra | Yes |
| Apex Officer | VR Training | Subscription | Yes |
| XVR Simulation | VR Police/Fire/Rescue | £800/license/year | Yes |

### 7.3 Fire/Rescue Training Platforms

| Platform | Type | Cost | UE5 Alternative? |
|----------|------|------|-----------------|
| XVR Simulation | VR Fire/Rescue | £800/license/year | Yes |
| PyroSim | Fire Simulation (CFD) | ~$5K-15K | Partial (Niagara for viz) |
| Fire Dynamics Simulator | NIST CFD | Free (open source) | Yes (integrate with UE5) |
| FLIR Training Thermal | Thermal Camera Sim | Hardware cost | Yes (shader-based) |

### 7.4 Cost Comparison Summary

**5-Year Total Cost of Ownership (50 trainees/year):**

| Platform Type | Year 1 | Year 2 | Year 3 | Year 4 | Year 5 | 5-Year Total |
|--------------|--------|--------|--------|--------|--------|-------------|
| Live exercises only | $76,750 | $76,750 | $76,750 | $76,750 | $76,750 | **$383,750** |
| Commercial VR (VirTra 300) | $300,000 | $30,000 | $30,000 | $30,000 | $30,000 | **$420,000** |
| Commercial VR (XVR) | $40,000 | $40,000 | $40,000 | $40,000 | $40,000 | **$200,000** |
| UE5 SOV TOWN (custom) | $150,000 | $20,000 | $20,000 | $20,000 | $20,000 | **$230,000** |

**Key Insight:** UE5 SOV TOWN has higher upfront cost than basic VR but:
- Serves ALL domains from one platform
- Unlimited scenario generation
- Automatic data annotation (eliminates $50-200K/yr manual labeling)
- Scales to unlimited trainees at near-zero marginal cost

**Per-Trainee Cost Breakdown:**

| Platform | Year 1 | Year 2 | Year 3 | Marginal (Yr 2+) |
|----------|--------|--------|--------|-----------------|
| Live exercise | $229.79 | $229.79 | $229.79 | $229.79 |
| Commercial VR | $328.59 | $168.92 | $115.70 | $9.25 |
| **UE5 SOV TOWN** | $250.00 | $90.00 | $65.00 | **~$5.00** |

---

## 8. DATA EXPORT & LABELING PIPELINE

### 8.1 Automatic Annotation from UE5

**UE5 Synthetic Data Generation Pipeline:**

```
UE5_SIMULATION
    |
    v
[Scene Capture Components]
    |-- RGB Camera (various positions)
    |-- Depth Camera (normalized 0-1)
    |-- Semantic Segmentation Camera
    |-- Instance Segmentation Camera
    |-- Normal Map Camera
    |-- Optical Flow Camera
    |-- Thermal/IR Camera (custom shader)
    |-- LiDAR (raycast-based)
    |
    v
[Annotation Exporter - Per Frame]
    |-- COCO JSON (bbox + segmentation)
    |-- YOLO TXT (bbox + class)
    |-- Pascal VOC XML
    |-- KITTI format (3D bbox)
    |-- Point Cloud (PLY/PCD)
    |-- Instance masks (PNG)
    |-- CSV logs (tabular data)
    |
    v
[QA Filter]
    |-- Remove empty frames
    |-- Remove degenerate annotations
    |-- Check for occlusion validity
    |
    v
[Dataset Output]
```

### 8.2 Supported Export Formats

**COCO Format (Primary for Object Detection):**

```json
{
    "info": {"year": "2025", "version": "1.0", "description": "SOV_TOWN_SYNTHETIC"},
    "categories": [
        {"id": 1, "name": "patient", "supercategory": "person"},
        {"id": 2, "name": "police_officer", "supercategory": "person"},
        {"id": 3, "name": "firefighter", "supercategory": "person"},
        {"id": 4, "name": "paramedic", "supercategory": "person"},
        {"id": 5, "name": "ambulance", "supercategory": "vehicle"},
        {"id": 6, "name": "fire_truck", "supercategory": "vehicle"},
        {"id": 7, "name": "police_car", "supercategory": "vehicle"},
        {"id": 8, "name": "hospital_bed", "supercategory": "equipment"},
        {"id": 9, "name": "ventilator", "supercategory": "equipment"},
        {"id": 10, "name": "fire", "supercategory": "hazard"},
        {"id": 11, "name": "smoke", "supercategory": "hazard"},
        {"id": 12, "name": "weapon", "supercategory": "threat"}
    ],
    "images": [...],
    "annotations": [
        {
            "id": 0, "image_id": 0, "category_id": 5,
            "bbox": [260.0, 177.0, 231.0, 199.0],
            "segmentation": [...],
            "area": 45969, "iscrowd": 0
        }
    ]
}
```

**YOLO Format (Bounding Boxes):**
```
<class_id> <x_center> <y_center> <width> <height>
0 0.456 0.582 0.123 0.234
```

**Pascal VOC Format:**
```xml
<annotation>
    <filename>frame_0001.jpg</filename>
    <size><width>1920</width><height>1080</height><depth>3</depth></size>
    <object>
        <name>ambulance</name>
        <bndbox><xmin>260</xmin><ymin>177</ymin><xmax>491</xmax><ymax>376</ymax></bndbox>
    </object>
</annotation>
```

**KITTI Format (3D Object Detection):**
```
# type truncated occluded alpha bbox(4) dimensions(3) location(3) rotation_y score
Ambulance 0.00 0 -1.56 500.0 200.0 600.0 350.0 2.5 2.0 5.0 -3.2 1.8 10.5 1.56 0.95
```

### 8.3 Multi-Modal Fusion Labels

**Synchronized Multi-Sensor Output:**

| Sensor | Resolution | Rate | Format | Labels |
|--------|-----------|------|--------|--------|
| RGB Camera | 1920x1080 | 30fps | JPEG/PNG | BBox, SegMask |
| Depth | 1920x1080 | 30fps | 16-bit PNG | Per-pixel depth (m) |
| Semantic Seg | 1920x1080 | 30fps | PNG | Per-pixel class ID |
| Instance Seg | 1920x1080 | 30fps | PNG | Per-pixel instance ID |
| Normal Map | 1920x1080 | 30fps | PNG | Per-pixel surface normal |
| Optical Flow | 1920x1080 | 30fps | 2-channel PNG | Per-pixel motion vector |
| Thermal | 640x512 | 30fps | 16-bit TIFF | Per-pixel temperature (°C) |
| LiDAR | 64/128 beam | 20Hz | PCD/PLY | 3D point cloud with labels |

**Temporal Annotations for Video:**
- Object tracking IDs across frames
- Action labels with start/end timestamps
- Event detection labels
- Trajectory waypoints
- Velocity/acceleration vectors

### 8.4 Domain-Specific Custom Formats

**Healthcare — Patient Flow JSON:**
```json
{
    "patient_id": "P_001234",
    "patient_type": 1,
    "arrival_time": "2025-01-15T08:23:00Z",
    "events": [
        {"zone": "triage", "enter": "08:23:00", "exit": "08:33:00", "staff": "N_042"},
        {"zone": "waiting", "enter": "08:33:00", "exit": "09:08:00"},
        {"zone": "trauma_bay", "enter": "09:08:00", "exit": "10:38:00", "staff": "D_017"}
    ],
    "vitals": {"hr": 95, "bp": "145/92", "spo2": 97, "rr": 18, "temp": 37.1},
    "triage_level": 2,
    "disposition": "admitted",
    "total_los_minutes": 135
}
```

**Police — Incident Report JSON:**
```json
{
    "incident_id": "I_000567",
    "type": "traffic_stop",
    "location": {"x": 4523.1, "y": 2187.4, "zone": "downtown_north"},
    "officer_pov_video": "officer_042_cam_001.mp4",
    "dash_cam_video": "unit_17_dash_001.mp4",
    "annotations": [
        {"time": 12.5, "bbox": [540, 320, 120, 240], "class": "suspect", "action": "exiting_vehicle"},
        {"time": 15.2, "bbox": [600, 350, 80, 60], "class": "weapon", "type": "handgun"}
    ],
    "outcome": "arrest",
    "force_level": 2
}
```

**Fire — Event Timeline JSON:**
```json
{
    "incident_id": "F_000089",
    "building_id": "B_downtown_office_12",
    "ignition": {"room": "102", "time": 0, "cause": "electrical"},
    "timeline": [
        {"time": 0, "zone": "102", "temp_c": 25, "visibility_m": 50, "co_ppm": 0},
        {"time": 60, "zone": "102", "temp_c": 350, "visibility_m": 5, "co_ppm": 800},
        {"time": 120, "zone": "hallway_east", "temp_c": 80, "visibility_m": 3, "co_ppm": 400}
    ],
    "evacuation_time_seconds": 145,
    "casualties": 0,
    "property_damage_usd": 250000
}
```

### 8.5 Annotation Automation Tools

**Recommended Pipeline:**
1. **UE5 Scene Capture** → Raw frames + ground truth
2. **Custom Annotation Exporter** → Automated COCO/YOLO/KITTI export
3. **FiftyOne** (Voxel51) → Dataset management, QA, visualization
4. **Roboflow** → Format conversion, augmentation, versioning
5. **CVAT/Labelbox** → Human review of edge cases (5% sample)

**BEHAVE-UAV Pipeline Reference:**
- Per-frame annotation packet: RGB + instance masks + 2D BBox + metadata
- Automatic YOLO format export
- QA filter removes empty/degenerate frames
- Domain randomization for generalization

---

## 9. IMPLEMENTATION ROADMAP

### Phase 1: Infrastructure (Months 1-3)

| Task | Deliverable | Cost |
|------|------------|------|
| SOV TOWN hospital module build | Hospital level with ED, OR, ICU, wards | $30K dev |
| Medical asset procurement | 440+ equipment models integrated | $1K assets |
| Police overlay integration | Precinct, patrol routes, CCTV network | $15K dev |
| Fire station overlay | Station, hydrants, equipment | $10K dev |
| EMS overlay | Station, ambulance bay, routes | $10K dev |
| Niagara fire/smoke templates | Reusable fire VFX library | $8K dev |

### Phase 2: Simulation Systems (Months 3-6)

| Task | Deliverable |
|------|------------|
| Patient flow simulation | Discrete event simulation in UE5 Blueprint/C++ |
| Crowd behavior system | MassAI integration with panic/violence states |
| Fire propagation system | Niagara Fluids + temperature/concentration tracking |
| Traffic simulation | MassTraffic + emergency vehicle protocols |
| BWC camera system | Multi-perspective capture with natural motion |

### Phase 3: Data Pipeline (Months 4-7)

| Task | Deliverable |
|------|------------|
| Multi-modal capture system | RGB/Depth/Seg/Thermal/LiDAR synchronized capture |
| COCO exporter | Automatic bbox + segmentation export |
| KITTI exporter | 3D bounding box + point cloud export |
| Domain-specific exporters | Patient flow, incident report, fire timeline JSON |
| QA filtering | Empty frame removal, validation checks |

### Phase 4: Scenario Library (Months 6-9)

| Domain | Scenarios |
|--------|-----------|
| Healthcare | 50 ED scenarios, 20 ICU scenarios, 30 patient flow variants |
| Police | 100 BWC scenarios, 50 crowd events, 30 pursuit routes |
| Fire | 40 structure fire scenarios, 20 wildfire scenarios, 30 evacuation drills |
| Ambulance | 60 MCI scenarios, 40 route optimization cases |
| Cross-domain | 20 multi-agency coordinated response scenarios |

### Phase 5: Validation & Deployment (Months 8-12)

| Task | Deliverable |
|------|------------|
| Sim-to-real validation | Compare synthetic-trained vs real-trained model performance |
| Domain expert review | Clinicians, officers, firefighters validate scenario fidelity |
| Dataset release v1.0 | 1M+ annotated frames per domain |
| Continuous generation | Automated overnight batch generation |

---

## 10. COST ANALYSIS & ROI

### 10.1 Development Costs

| Phase | Cost | Timeline |
|-------|------|----------|
| Infrastructure (Phase 1) | $74,000 | Months 1-3 |
| Simulation Systems (Phase 2) | $65,000 | Months 3-6 |
| Data Pipeline (Phase 3) | $45,000 | Months 4-7 |
| Scenario Library (Phase 4) | $50,000 | Months 6-9 |
| Validation (Phase 5) | $25,000 | Months 8-12 |
| **Total Development** | **$259,000** | **12 months** |

### 10.2 Ongoing Operational Costs

| Item | Annual Cost |
|------|------------|
| UE5 licenses (free for internal) | $0 |
| Compute (rendering farm) | $24,000 |
| Storage (dataset versioning) | $12,000 |
| Maintenance/updates | $30,000 |
| **Total Annual** | **$66,000** |

### 10.3 ROI vs. Alternatives

**5-Year ROI Comparison (Training 200 personnel/year across all domains):**

| Solution | 5-Year Cost | Cost/Person/Year | Data Annotation Cost | Scenarios |
|----------|------------|-----------------|---------------------|-----------|
| Live training only | $1,534,000 | $767 | Manual: $500K | Limited |
| Commercial VR (multiple) | $1,500,000 | $750 | Manual: $300K | Fixed library |
| **UE5 SOV TOWN** | **$589,000** | **$295** | **Automatic: $0** | **Unlimited** |

**Net Savings over 5 years: $945,000 - $1,134,000**

### 10.4 Additional Value Factors

| Factor | Value |
|--------|-------|
| Risk reduction (no live exercises) | Immeasurable |
| Rare event coverage | High-value scenarios impossible to replicate live |
| Multi-domain overlap | Single event → 4x data multiplier |
| Annotation automation | $200-500K saved annually vs manual labeling |
| Rapid iteration | New scenarios deployable in days vs months |
| Scalability | Unlimited trainees at zero marginal cost |

---

## APPENDIX A: KEY DATASETS & REFERENCES

### Healthcare Simulation Datasets
- **Synthetic Dataset of Emergency Healthcare Services** (Figshare, 2024) — Simio-generated patient flow data with CSV files for blood pressure, patient types, medical records, triage, and outpatient satisfaction
- **MIMIC-IV-ED** — 280,000 real ED records for triage model validation
- **Patient Flow Simulation Using Historically Informed Synthetic Data** — Methodology paper

### Police/Crowd Simulation Datasets
- **PSCS-I** (IEEE Access, 2025) — UE5-generated synthetic crowd dataset: 26 indoor environments, 53.8 hours of annotated video, panic/violence/normal behaviors, BWC perspective
- **CrimeNet architecture** — Pretrained models for crowd behavior classification

### Fire Simulation Datasets
- **WIT-UAS** — 6,951 labeled thermal LWIR images from prescribed fires (FLIR Boson 640 + Seek S304SP)
- **FLIR ADAS Dataset** — 26,442 fully annotated thermal/RGB frames, 520,000 bounding boxes across 15 categories
- **FIRE-EVSim** — BIM + UE5 fire evacuation simulation framework

### Thermal Imaging References
- **FLIR SC660** — 640x480, 30Hz, 14-bit, 45° HFOV, measurement range -40°C to +1500°C
- **FLIR Vue Pro** — 336x256, 8.3Hz, 16-bit, 35° HFOV, UAV-compatible (92g)

### Vehicle/Traffic Simulation
- **CARLA Simulator** — Open-source autonomous driving simulator built on UE5
- **MassTraffic/MassAI** — UE5 built-in systems for 1,000-5,000 vehicles + 10,000 NPCs

### Cost References
- **VirTra 300** — $300,000 system (Palm Beach Police purchase, 2020)
- **VirTra APEX** — Now included at no additional cost with all new simulators
- **XVR Simulation** — £800/license/year
- **VirtaMed ArthroS** — $114,000
- **VR vs Live exercise cost analysis** — VR marginal cost drops to $9.25/trainee by year 2 vs $229.79 for live

---

## APPENDIX B: TECHNICAL SPECIFICATIONS

### Minimum Hardware Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| GPU | RTX 3080 (10GB) | RTX 4090 (24GB) |
| CPU | Intel i9-12900K | AMD Threadripper PRO |
| RAM | 64GB DDR5 | 128GB DDR5 |
| Storage | 2TB NVMe SSD | 4TB NVMe SSD |
| Network | 1Gbps | 10Gbps (render farm) |

### UE5 Plugin Requirements
- Niagara Fluids (built-in)
- MassAI/MassTraffic (built-in)
- Movie Render Queue (built-in)
- Custom annotation exporter (develop)
- Scene Capture Component 2D (built-in)
- LiDAR raycast plugin (custom or LidarSim)

### Software Stack
- Unreal Engine 5.3+
- Python 3.10+ (data processing)
- Open3D (point cloud processing)
- FiftyOne (dataset management)
- Roboflow (format conversion)
- TensorFlow/PyTorch (model training)
- Weights & Biases (experiment tracking)

---

## APPENDIX C: DETAILED CROSS-DOMAIN SCENARIO EXAMPLE

### Scenario: Multi-Vehicle Highway Collision

**Setup:**
- Location: SOV TOWN Highway 101, mile marker 23
- Time: 18:30 (dusk, reduced visibility)
- Weather: Light rain, wet roads
- Event: 3-vehicle collision (sedan + SUV + semi-truck), sedan driver trapped, minor fuel leak

**Data Generated by Domain:**

| Domain | Data Type | Details | Volume |
|--------|-----------|---------|--------|
| Police | BWC footage | 2 officers, 30 min each, chest-mounted | 3,600 frames x 2 |
| Police | Dash cam | Patrol car approach, 10 min | 18,000 frames |
| Police | Scene photos | Evidence markers, vehicle positions | 200 images |
| Police | Traffic control | Road closure, detour setup | 5,400 frames |
| Fire | Thermal scan | Hot spots, fuel leak visualization | 3,600 frames |
| Fire | Extrication video | Jaws of life, patient removal | 5,400 frames |
| Fire | Hazmat assessment | Fuel type, vapor detection | Tabular data |
| Ambulance | Dispatch audio | Call receipt to unit dispatch | Audio file |
| Ambulance | Triage data | 4 patients, vital signs, triage tags | JSON records |
| Ambulance | Transport video | Patient packaging, ambulance interior | 3,600 frames |
| Hospital | ED arrival | Patient handoff, trauma bay activation | JSON + video |
| Hospital | Resource log | Staff recall, OR prep, blood bank | Tabular data |

**Total: ~45,000 annotated frames + audio + tabular data from ONE scenario**

---

*Document compiled from research across UE5 simulation platforms, academic publications, industry reports, and synthetic data generation frameworks. All costs are estimates based on publicly available pricing as of 2025.*

**Document Version:** 1.0
**Last Updated:** 2025
**Classification:** DEFONEOS Internal Research
