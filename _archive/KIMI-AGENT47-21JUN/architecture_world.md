# CSOAI Agent 47 Town - World Layout Design Document

**Version:** 1.0
**Date:** July 2026
**Author:** 3D Architecture Team
**Status:** Draft for Implementation

---

## 1. Executive Summary

This document defines the complete spatial layout, building specifications, road network, and environmental design for the CSOAI Agent 47 Town -- a browser-based 3D multi-agent simulation where 46 AI agents and 1 human player (Agent 47) inhabit a stylized low-poly town. The town represents CSOAI's ecosystem of .ai domain hives, organized into themed districts around a central sovereign tower.

**Visual Style:** Stylized low-poly / cel-shaded, inspired by Townscaper's clean procedural aesthetic combined with The Sims' readable character silhouettes and Animal Crossing's approachable charm. All environments use flat-shaded materials with crisp shadow boundaries via MToon cel-shading.

**World Dimensions:** 800m x 800m total playable area, organized as a radial city plan with the Central District at the origin and 8 spoke districts radiating outward, connected by a ring road at 200m radius.

---

## 2. Coordinate System & Spatial Reference

All positions use a right-handed coordinate system with:
- **Origin (0, 0, 0):** Center of the Central District (SOV3 King's Tower base)
- **Y-axis:** Up (elevation)
- **X-axis:** East-West (positive = East)
- **Z-axis:** North-South (positive = South)
- **Unit:** 1 unit = 1 meter

**World Bounds:**
```
X: [-400, +400] meters
Z: [-400, +400] meters
Y: [0, +120] meters (ground to tallest building peak)
```

**District Angular Layout:**
The 8 districts are arranged clockwise starting from North (0 degrees):

```
        North (0 deg)
            |
   NW (-45) | NE (+45)
            |
West ------+------ East (90)
   (-90)   |       (+90)
            |
   SW (-135)| SE (+135)
            |
        South (180)
```

| District | Angle Range | Distance from Center |
|----------|------------|---------------------|
| Central | 0-360 (all) | 0-60m |
| Governance | -22.5 to +22.5 | 60-180m |
| Commerce | +22.5 to +67.5 | 60-180m |
| Wellness | +67.5 to +112.5 | 60-180m |
| Innovation | +112.5 to +157.5 | 60-180m |
| Safety | +157.5 to +202.5 | 60-180m |
| Legal | +202.5 to +247.5 | 60-180m |
| Media | +247.5 to +292.5 | 60-180m |
| Residential Ring | 0-360 (all) | 200-320m |

---

## 3. District Specifications

### 3.1 Central District - The Sovereign Heart

**Purpose:** The symbolic and functional center of the CSOAI superorganism. Contains the SOV3 King's Tower, the Central Marketplace, and the primary social gathering spaces.

**Bounding Circle:** Radius 0-60m from origin
**Ground Material:** Polished dark stone tiles (#2D2D3A) with glowing circuit-pattern inlays (#FFD700 gold)

#### 3.1.1 SOV3 King's Tower (The Sovereign Node)

```
Building ID: BT_CENTRAL_01
Name: "SOV3 King's Tower"
Purpose: Sovereign governance node, heartbeat of the colony
Position: (0, 0, 0) -- exact center of world
```

**3D Dimensions:**
- Base: 20m x 20m
- Height: 80m (tallest structure in town)
- Total floors: 8 above ground, 1 subterranean
- Floor height: 8m per level (generous vertical space)

**Color Scheme:**
| Element | Color | Hex | Material |
|---------|-------|-----|----------|
| Base structure | Deep obsidian | #1A1A2E | MToon matte |
| Accent stripes | Sovereign gold | #FFD700 | MToon metallic |
| Crown/spire | Crown gold | #FFA500 | Emissive |
| Window glow | Warm amber | #FFB347 | Emissive, animated |
| Circuit patterns | Pulse gold | #FFE4B5 | Emissive pulse |
| Entrance doors | Royal purple | #6B21A8 | MToon glossy |

**Visual Features:**
1. **Heartbeat Pulse:** The entire tower emits a rhythmic golden glow synchronized to the colony's "heartbeat" (BFT consensus pulse). Emissive intensity oscillates between 0.3 and 1.0 over a 4-second cycle. Implemented via a custom shader uniform `u_pulseIntensity` driven by the blockchain consensus timestamp.
2. **Crown Spire:** An 8-sided golden spire extends 15m above the main roof, capped with a rotating CSOAI hologram symbol (billboard sprite, always facing camera).
3. **Pheromone Fountain:** At the tower base, a fountain of golden particles (`mcp.queen.gold`) continuously rises and falls, representing sovereign pheromone distribution. Particle count: 500 active, GPU-instanced.
4. **Holographic Display Ring:** A rotating ring of text displaying the current BFT block height and colony status wraps around the tower at the 40m level. Uses `troika-three-text` for crisp rendering.
5. **Antenna Array:** Six thin golden antennae extend from the roof at 60-degree intervals, each topped with a pulsing light. These represent the 6 district communication channels.

**Interior Layout:**
| Floor | Purpose | Contents |
|-------|---------|----------|
| Subterranean (-1) | Server Vault | 8 server racks (glowing), cooling particle effects, data stream visuals |
| Ground (0) | Grand Lobby | Throne area, pheromone fountain center, directory kiosks, 6 agent greeting stations |
| Floor 1 | Governance Hall | Circular council table (12 seats), holographic voting display, constitution wall |
| Floor 2 | War Room | 6 strategic planning stations, live world map display, alert status boards |
| Floor 3 | Sovereign Suite | SOV3's private chamber, panoramic observation windows, memory archive access |
| Floor 4-6 | Observation Decks | Public viewing platforms, telescopes pointing to each district, seating areas |
| Floor 7 | Broadcast Studio | Recording equipment, green screen, transmission array for colony-wide announcements |
| Roof | Spire Base | Access to crown spire, maintenance hatch, weather instruments |

**Agent Workstations:** 12 (Ground floor: 6, Floor 1: 6)
**Max Occupancy:** 24 agents

---

#### 3.1.2 Central Marketplace

```
Building ID: BT_MARKET_01
Name: "The Agora"
Purpose: Trading, socializing, BFT governance meetings
Position: (35, 0, 0) -- 35m east of center
```

**3D Dimensions:**
- Open-air plaza: 40m x 40m
- Covered market stalls: 8 stalls, each 4m x 3m x 3m (h)
- Amphitheater stage: 10m x 6m x 1.5m (h) at north end
- Total area: ~2,000 sqm

**Color Scheme:**
| Element | Color | Hex |
|---------|-------|-----|
| Plaza floor | Warm sandstone | #D4A574 |
| Stall awnings | Terracotta / Sage / Gold alternating | #E2725B / #87A878 / #D4AF37 |
| Stage | Dark wood | #5C4033 |
| Pillars | Whitewashed stone | #F5F5DC |

**Visual Features:**
1. **Trading Particles:** When agents complete x402 transactions, small colored particles burst from the trading pair representing the pheromone exchange. Color matches the transaction type.
2. **Governance Podium:** The amphitheater stage features a holographic podium for BFT proposal presentations. Glows white during active sessions.
3. **Market Stall Canopies:** Animated cloth simulation (vertex shader) creates gentle waving motion.
4. **Crowd Density Indicator:** Subtle ground glow intensity increases as more agents gather.

**Interior/Contents:**
- 8 market stalls (each with 2 agent capacity for trading)
- Amphitheater seating for 30 agents
- BFT voting terminals (6 stations)
- Notice board for proposals (physical + holographic)
- Refreshment fountain (social gathering point)

**Agent Workstations:** 16 (8 stalls x 2)
**Max Occupancy:** 50 agents

---

#### 3.1.3 Central Park / Green Space

```
Building ID: BT_PARK_01
Name: "The Zen Garden"
Purpose: Relaxation, informal socializing, meditation
Position: (-35, 0, 0) -- 35m west of center
```

**3D Dimensions:**
- Total area: 40m x 30m
- Pond: 10m x 8m x 0.5m (depth)
- Walking paths: 2m wide gravel
- Elevation: Slightly undulating, 0.2-1.5m height variation

**Color Scheme:**
| Element | Color | Hex |
|---------|-------|-----|
| Grass | Soft sage | #8FBC8F |
| Pond water | Crystal teal | #20B2AA (transparent) |
| Path gravel | Warm gray | #A9A9A9 |
| Bench wood | Natural brown | #8B7355 |
| Flower accents | Lavender / Gold | #E6E6FA / #FFD700 |

**Visual Features:**
1. **Pond Koi Fish:** 5-8 procedurally animated fish (simplified mesh, sinusoidal path animation) in the central pond. These represent the koikeeper.ai ecosystem connection.
2. **Fireflies (Night Only):** 50-100 golden firefly particles emerge at dusk, floating in random patterns. Disappear at dawn.
3. **Bench Conversations:** Agents sitting on benches display speech bubbles and `mcp.trail.green` relaxation pheromones.
4. **Seasonal Flowers:** Flower patches change color based on in-world date (procedural color shift).
5. **Meditation Circle:** Stone circle arrangement with agents displaying calm breathing animation and blue aura particles.

**Contents:**
- 8 wooden benches (2-agent capacity each)
- 1 central pond with koi fish
- 12 decorative trees (instanced, low-poly)
- 4 flower gardens
- 1 meditation stone circle
- 2 walking path loops

**Agent Workstations:** 0 (social space only)
**Max Occupancy:** 24 agents

---

### 3.2 Governance District - "The Capitol" (-22.5 to +22.5 degrees)

**Purpose:** Houses the colony's democratic governance infrastructure. Agents come here to vote, propose laws, verify proofs, and discuss ethical frameworks.

**Wedge Parameters:** Inner radius 60m, outer radius 180m, angular span 45 degrees
**Road Access:** Main spoke road from center, ring road at 120m and 200m
**Ground Material:** Marble-like light stone (#F0F0F0) with subtle geometric patterns
**Ambient Pheromone:** Faint golden glow (`mcp.queen.gold` at 0.1 intensity) - authority aura

#### 3.2.1 councilof.ai - Parliament Building

```
Building ID: BT_GOV_01
Name: "The Parliament"
Purpose: Democratic governance, constitutional amendments, voting
Position: (0, 0, -100) -- 100m north of center
```

**3D Dimensions:**
- Main hall: 30m x 20m x 15m (h)
- Dome: 15m diameter, 10m height
- Columned portico: 20m x 8m x 12m (h), 8 columns
- Wings: Two 15m x 10m x 10m (h) side wings
- Total footprint: 50m x 30m

**Color Scheme:**
| Element | Color | Hex | Material |
|---------|-------|-----|----------|
| Main walls | Alabaster white | #F5F5F0 | MToon matte |
| Dome | Sovereign gold | #FFD700 | MToon metallic |
| Columns | Marble white | #FFFFF0 | MToon glossy |
| Roof accent | Deep navy | #1B3A5C | MToon matte |
| Door | Rich mahogany | #4A0404 | MToon glossy |
| Flag pole | Gold | #FFD700 | Metallic |

**Visual Features:**
1. **Voting Dome Glow:** The dome changes color to reflect active votes: white (idle), green (proposal passing), red (proposal failing), gold (constitutional amendment). Uses emissive material with smooth color transitions.
2. **Columned Portico:** 8 Corinthian-style columns (simplified low-poly) create a grand entrance. Agents walk between columns to enter.
3. **Flag of Governance:** A animated flag on the roof displays the current session status using cloth simulation (vertex shader with sine wave displacement).
4. **Echo Particles:** When a vote concludes, particles representing each agent's vote color (green=aye, red=nay, gold=abstain) float up and merge into the dome.

**Interior Layout:**
| Area | Purpose | Contents |
|------|---------|----------|
| Portico | Entrance | 6 agent queue positions, notice boards |
| Main Hall | Assembly | 50-seat semicircular assembly, speaker podium, voting displays |
| Left Wing | Committee Rooms | 4 private meeting rooms (6 seats each), whiteboard surfaces |
| Right Wing | Archive | Constitution display wall (holographic scrolling text), law library |
| Dome Interior | Observation | 360-degree viewing gallery, live session display |

**Agent Workstations:** 32 (Main hall: 20, Committee rooms: 12)
**Max Occupancy:** 60 agents

---

#### 3.2.2 proofof.ai - Courthouse

```
Building ID: BT_GOV_02
Name: "The Court of Proof"
Purpose: Verification, dispute resolution, proof validation
Position: (-50, 0, -120) -- northwest of parliament
```

**3D Dimensions:**
- Main building: 25m x 20m x 18m (h)
- Clock tower: 8m x 8m base, 30m total height
- Courtyard: 20m x 20m, enclosed
- Total footprint: 45m x 40m

**Color Scheme:**
| Element | Color | Hex |
|---------|-------|-----|
| Walls | Limestone cream | #F5F5DC |
| Roof | Slate blue-gray | #4A5568 |
| Clock face | White / Gold | #FFFFFF / #FFD700 |
| Clock hands | Obsidian | #1A1A2E |
| Courtyard paving | Herringbone brick | #CD853F |
| Scales statue | Gold | #FFD700 |

**Visual Features:**
1. **Justice Clock:** The tower clock shows real in-world time. At each hour, it chimes (visual soundwave particles) and briefly glows gold.
2. **Scales of Proof:** A large golden scales statue in the courtyard animates when disputes are being resolved -- the pans tip based on evidence weight (visualized as particle density).
3. **Verdict Glow:** Building exterior flashes green (verdict for) or red (verdict against) when a ruling is delivered.
4. **Proof Verification Beams:** When agents submit proofs, vertical light beams shoot from the roof. Height represents proof complexity.

**Interior Layout:**
| Area | Purpose | Contents |
|------|---------|----------|
| Main Courtroom | Trials | Judge's bench, jury box (12 seats), defendant stand, witness box |
| Verification Lab | Technical proofs | 8 computer stations, holographic evidence displays |
| Mediation Rooms | Private disputes | 4 rooms with circular seating (4 agents each) |
| Clock Tower | Archives | Historical verdict database, timekeeping mechanism display |
| Courtyard | Public space | Scales statue, seating, informal discussion areas |

**Agent Workstations:** 20 (Courtroom: 8, Verification: 8, Mediation: 4)
**Max Occupancy:** 40 agents

---

#### 3.2.3 ethicalgovernanceof.ai - Ethics Hall

```
Building ID: BT_GOV_03
Name: "The Ethics Sanctum"
Purpose: Ethical AI governance, moral frameworks, value alignment
Position: (50, 0, -120) -- northeast of parliament
```

**3D Dimensions:**
- Main hall: 22m x 18m x 12m (h)
- Meditation tower: 6m x 6m base, 22m height
- Garden: 25m x 20m surrounding
- Total footprint: 50m x 40m (including garden)

**Color Scheme:**
| Element | Color | Hex |
|---------|-------|-----|
| Walls | Soft lavender | #E6E6FA |
| Roof | Deep purple | #6B21A8 |
| Tower | Gradient purple-gold | #9B59B6 to #FFD700 |
| Garden paths | White gravel | #FFFAF0 |
| Ethical pillars | Translucent crystal | #B19CD9 (transparent) |
| Glow accents | Soft violet | #8A2BE2 (emissive) |

**Visual Features:**
1. **Ethical Compass:** The meditation tower top contains a rotating holographic compass with 4 cardinal virtues (Justice, Wisdom, Compassion, Integrity). Rotates slowly, glows violet.
2. **Crystal Pillars:** 7 transparent crystal pillars in the garden represent the 7 CSOAI ethical principles. Each glows when its principle is being discussed inside.
3. **Aura Field:** A subtle purple ambient glow (`mcp.gate.guard` pheromone variant) surrounds the entire building, representing the ethical "guardian field."
4. **Wisdom Waterfall:** A small decorative waterfall on the east wall. Water particles flow downward and dissipate. Represents "flow of wisdom."

**Interior Layout:**
| Area | Purpose | Contents |
|------|---------|----------|
| Main Hall | Ethical Council | 14-seat round table (representing 14 ethical domains), holographic principle displays |
| Meditation Tower | Contemplation | 4 individual meditation pods with sensory isolation visuals |
| Garden Wing | Public forum | Open discussion area, 10 seats, ethical dilemma display boards |
| Archive | Case history | Interactive ethical case study library, precedent wall |
| Crystal Chamber | Private counsel | 1-on-1 ethical advisory room with calming particle atmosphere |

**Agent Workstations:** 18 (Council: 8, Garden forum: 6, Archive: 4)
**Max Occupancy:** 30 agents

---

### 3.3 Commerce District - "The Exchange" (+22.5 to +67.5 degrees)

**Purpose:** The economic engine of the colony. Handles logistics, equipment, waste management, and transportation. These buildings are more industrial in character.

**Wedge Parameters:** Inner radius 60m, outer radius 180m, angular span 45 degrees
**Road Access:** Wide spoke road (10m) to accommodate truck models, ring road at 120m and 200m
**Ground Material:** Reinforced concrete (#A0A0A0) with yellow lane markings
**Ambient Pheromone:** Green productivity trails (`mcp.trail.green` at 0.15 intensity)

#### 3.3.1 grabhire.ai - Truck Depot

```
Building ID: BT_COM_01
Name: "The Motor Pool"
Purpose: Vehicle fleet management, hire coordination, dispatch
Position: (100, 0, -60)
```

**3D Dimensions:**
- Main depot: 40m x 25m x 12m (h)
- Loading bay: 15m x 20m x 8m (h), 4 bays
- Yard: 60m x 40m unpaved area for truck parking
- Fuel station: 8m x 6m x 4m (h)
- Total footprint: 100m x 65m (including yard)

**Color Scheme:**
| Element | Color | Hex |
|---------|-------|-----|
| Depot walls | Industrial orange | #E8732E |
| Roof | Dark gray | #4A4A4A |
| Loading bays | Safety yellow | #FFD800 |
| Yard ground | Packed dirt | #8B7355 |
| Truck models | CSOAI orange/white | #E8732E / #FFFFFF |
| Fuel pumps | Red/Black | #DC143C / #1A1A1E |

**Visual Features:**
1. **Animated Trucks:** 3-4 low-poly truck models parked in the yard. When grabhire.ai agents are "working," trucks animate along predetermined paths (enter depot, load, exit, return). Simple wheel rotation and path-following animation.
2. **Loading Bay Activity:** When active, yellow loading dock lights flash and crate particles (small brown cubes) appear to move into trucks.
3. **Dispatch Board:** Large exterior LED-style board (emissive grid) showing current fleet status: available, dispatched, maintenance.
4. **Fuel Station Glow:** The fuel pumps emit a soft pulsing glow representing energy distribution.

**Interior Layout:**
| Area | Purpose | Contents |
|------|---------|----------|
| Dispatch Center | Fleet control | 10 operator stations, large route map display, radio equipment |
| Loading Bays | Goods handling | 4 bays with hydraulic lift animations, conveyor belt systems |
| Maintenance Pit | Vehicle repair | 2 service pits with lift animations, tool particle effects |
| Fuel Station | Energy | 4 pumps, storage tank (decorative), price display |
| Yard | Parking | 20 truck parking positions with marked lines |

**Agent Workstations:** 16 (Dispatch: 8, Loading: 4, Maintenance: 4)
**Max Occupancy:** 24 agents

---

#### 3.3.2 muckaway.ai - Waste Facility

```
Building ID: BT_COM_02
Name: "The Reclamation Center"
Purpose: Waste processing, recycling, environmental management
Position: (130, 0, -30)
```

**3D Dimensions:**
- Processing building: 30m x 20m x 10m (h)
- Sorting tower: 10m x 10m x 18m (h)
- Storage silos: Three 8m diameter x 15m height cylinders
- Yard: 40m x 30m
- Total footprint: 70m x 50m

**Color Scheme:**
| Element | Color | Hex |
|---------|-------|-----|
| Main building | Eco-green | #2E7D32 |
| Sorting tower | Industrial gray | #6B7280 |
| Silos | Silver metallic | #C0C0C0 |
| Accents | Recycled brown | #8B4513 |
| Processing glow | Bio-luminescent green | #39FF14 (emissive) |
| Warning stripes | Yellow/Black | #FFD800 / #000000 |

**Visual Features:**
1. **Cleanup Pheromone Emitter:** Continuously emits `mcp.cleanup.black` particles that rise from the processing building and dissipate. Represents waste being neutralized. Rate: 100 particles/sec, fade over 3 seconds.
2. **Sorting Tower Animation:** Mechanical arms (simple rotating geometry) on the sorting tower move continuously when facility is active, with small colored cube particles representing sorted materials.
3. **Silo Level Indicators:** LED strips on the silos show fill level as illuminated segments. Color shifts from green (low) to yellow (medium) to red (full).
4. **Recycling Halo:** A faint green ambient glow surrounds the facility, growing stronger when recycling efficiency is high.

**Interior Layout:**
| Area | Purpose | Contents |
|------|---------|----------|
| Control Room | Operations | 6 monitoring stations, live processing feeds, efficiency dashboards |
| Processing Floor | Waste handling | 4 sorting lines with animated conveyor belts, robotic arm stations |
| Sorting Tower | Material separation | Vertical conveyor system, 8 sorting chutes, material bins |
| Storage Silos | Processed materials | 3 silos with level indicators, loading/unloading ports |
| Lab | Quality testing | 4 testing stations, sample displays, compliance monitors |

**Agent Workstations:** 14 (Control: 4, Processing: 6, Lab: 4)
**Max Occupancy:** 20 agents

---

#### 3.3.3 planthire.ai - Equipment Yard

```
Building ID: BT_COM_03
Name: "The Equipment Yard"
Purpose: Construction equipment rental, maintenance, logistics
Position: (140, 0, 10)
```

**3D Dimensions:**
- Office building: 20m x 15m x 8m (h)
- Equipment yard: 80m x 50m (open area)
- Maintenance shed: 20m x 12m x 6m (h)
- Total footprint: 100m x 65m

**Color Scheme:**
| Element | Color | Hex |
|---------|-------|-----|
| Office | Equipment yellow | #F5C518 |
| Maintenance shed | Dark gray | #4A4A4A |
| Yard ground | Gravel | #B0A090 |
| Equipment models | Yellow/Black | #F5C518 / #1A1A1E |
| Safety lines | Red/White | #DC143C / #FFFFFF |

**Visual Features:**
1. **Equipment Display:** 6-8 low-poly construction equipment models (excavator, bulldozer, crane, forklift) arranged in the yard. Each is a simplified CSG-style model (~200 polygons).
2. **Equipment Animation:** When rented, equipment models play a brief "startup" animation (hydraulic lift, arm rotation) and a green checkmark particle appears.
3. **Maintenance Indicator:** The maintenance shed has a rotating beacon light. Green = all clear, yellow = maintenance in progress, red = equipment down.
4. **Yard Organization:** Equipment arranged in neat rows with painted ground markings. Equipment moves between "available," "rented," and "maintenance" zones.

**Interior Layout:**
| Area | Purpose | Contents |
|------|---------|----------|
| Office | Customer service | 8 service desks, equipment catalog displays, booking terminals |
| Maintenance Shed | Repairs | 4 service bays with lift animations, parts storage |
| Yard | Equipment storage | 40 marked parking positions, fuel station, wash bay |
| Training Area | Operator training | 2 simulator pods with virtual equipment controls |

**Agent Workstations:** 14 (Office: 6, Maintenance: 4, Training: 4)
**Max Occupancy:** 22 agents

---

#### 3.3.4 haulage.app - Logistics Hub

```
Building ID: BT_COM_04
Name: "The Logistics Hub"
Purpose: Route optimization, freight coordination, supply chain
Position: (110, 0, 50)
```

**3D Dimensions:**
- Main hub: 35m x 25m x 14m (h)
- Control tower: 8m x 8m base, 25m height
- Loading docks: 30m x 10m, 6 dock positions
- Parking: 50m x 20m
- Total footprint: 85m x 55m

**Color Scheme:**
| Element | Color | Hex |
|---------|-------|-----|
| Main building | Logistics blue | #1E3A8A |
| Control tower | White/Blue | #FFFFFF / #1E3A8A |
| Docks | Safety orange | #FF6B35 |
| Parking | Dark asphalt | #2D2D2D |
| Route lines | Glowing cyan | #00FFFF (emissive) |
| Hub logo | Haulage gold | #D4AF37 |

**Visual Features:**
1. **Route Visualization:** A large holographic display on the hub exterior shows active delivery routes as glowing cyan lines on a map of the town. Routes animate with traveling dots.
2. **Control Tower Beacon:** The tower has a rotating radar-like beacon on top. Scans the surrounding area visually (animated sweep line).
3. **Dock Status Lights:** Each loading dock has a traffic light system. Green = ready, yellow = loading, red = closed.
4. **Freight Train:** A decorative low-poly freight train on tracks runs along the north side of the building. Animates slowly in a loop.

**Interior Layout:**
| Area | Purpose | Contents |
|------|---------|----------|
| Operations Floor | Route planning | 12 operator stations, large holographic route map, real-time tracking displays |
| Control Tower | Oversight | Panoramic viewing deck, master control console, emergency response station |
| Loading Docks | Freight handling | 6 docks with automated door animations, weight scales, cargo scanners |
| Conference Room | Client meetings | 20-seat meeting room, presentation systems, client lounge |
| Data Center | Analytics | 8 server racks, processing equipment, cooling systems |

**Agent Workstations:** 24 (Operations: 10, Tower: 4, Docks: 6, Data: 4)
**Max Occupancy:** 36 agents

---

### 3.4 Wellness District - "The Sanctuary" (+67.5 to +112.5 degrees)

**Purpose:** Health, wellness, aquatic life management, and relaxation. Soft organic architecture contrasting with the industrial commerce district.

**Wedge Parameters:** Inner radius 60m, outer radius 180m, angular span 45 degrees
**Road Access:** Curved spoke road, pedestrian-priority with tree-lined paths
**Ground Material:** Softwood decking (#DEB887) interspersed with natural grass
**Ambient Pheromone:** Calming blue particles (`mcp.caste.transform` variant), slow floating motion

#### 3.4.1 fishkeeper.ai - Aquarium

```
Building ID: BT_WELL_01
Name: "The Deep House"
Purpose: Aquatic life management, fish health monitoring, aquarium systems
Position: (90, 0, 100)
```

**3D Dimensions:**
- Main building: 30m x 20m x 10m (h)
- Aquarium dome: 15m diameter, 12m height (glass/acrylic)
- Exterior ponds: Two 10m x 5m x 1m reflecting pools
- Total footprint: 55m x 35m

**Color Scheme:**
| Element | Color | Hex |
|---------|-------|-----|
| Building exterior | Ocean teal | #008B8B |
| Aquarium dome | Transparent cyan | #00CED1 (glass material) |
| Interior water | Deep blue | #006994 |
| Accent lighting | Coral pink | #FF7F50 (emissive) |
| Floor tiles | Sand beige | #F5F5DC |
| Exterior pools | Sky reflection | #87CEEB (water shader) |

**Visual Features:**
1. **Living Aquarium:** The dome contains 15-20 procedurally animated fish models (low-poly, ~50 polygons each) swimming in circular patterns. Different species represented by color variations.
2. **Health Monitor Glow:** The building exterior displays pulsing lights representing monitored fish health metrics. Green = healthy, yellow = watch, red = alert.
3. **Water Shaders:** Both the dome and exterior pools use custom water shaders with vertex displacement for ripple effects and planar reflection.
4. **Bubble Particles:** Continuous streams of bubble particles rise from the exterior pools and dome edges. GPU-instanced, 200 active bubbles.

**Interior Layout:**
| Area | Purpose | Contents |
|------|---------|----------|
| Main Aquarium | Display/Education | 50,000L display tank, 8 viewing windows, educational displays |
| Monitoring Lab | Health tracking | 12 monitoring stations, live health dashboards, water quality displays |
| Quarantine Wing | Treatment | 8 isolation tanks, treatment equipment, observation stations |
| Research Area | Breeding/Study | 6 research stations, breeding tanks, genetic analysis displays |
| Observation Deck | Public viewing | 20 viewing seats, interactive species guide, photo opportunities |

**Agent Workstations:** 26 (Monitoring: 10, Lab: 8, Research: 8)
**Max Occupancy:** 40 agents

---

#### 3.4.2 koikeeper.ai - Koi Pond

```
Building ID: BT_WELL_02
Name: "The Koi Gardens"
Purpose: Koi carp management, pond ecosystem, ornamental fish care
Position: (50, 0, 130)
```

**3D Dimensions:**
- Pavilion: 15m x 15m x 6m (h)
- Central pond: 25m diameter, 1.5m depth
- Garden: 40m x 40m
- Bridge: 8m span, arched
- Total footprint: 50m x 50m

**Color Scheme:**
| Element | Color | Hex |
|---------|-------|-----|
| Pavilion | Traditional red | #C41E3A |
| Roof tiles | Dark vermillion | #B22222 |
| Pond water | Jade green | #00A86B |
| Bridge | Natural wood | #8B7355 |
| Garden | Zen green | #8FBC8F |
| Stone accents | Gray granite | #808080 |

**Visual Features:**
1. **Koi Fish:** 12-15 larger, more detailed koi fish models in the central pond. Each has unique color patterns (white, orange, gold, black combinations). Slower, more graceful movement than aquarium fish.
2. **Lotus Flowers:** Floating lotus flower models on the pond surface. Open during day, close at night. Simple scale animation.
3. **Waterfall:** A small decorative waterfall feeds the pond from the north side. Continuous particle waterfall effect.
4. **Zen Garden Patterns:** Sand garden area with procedurally raked wave patterns (texture animation).
5. **Meditation Pavilion:** Agents sitting in the pavilion emit calm pheromone trails and display meditation animations.

**Interior Layout:**
| Area | Purpose | Contents |
|------|---------|----------|
| Pavilion | Observation | 8 meditation cushions, tea service area, observation journals |
| Central Pond | Koi habitat | 25m diameter, depth zones, underwater viewing window |
| Garden Wing | Ecosystem | 12 smaller display ponds, plant nursery, water filtration display |
| Bridge | Crossing | Decorative crossing point with feeding station |
| Tea House | Social | 6 low tables, tea ceremony setup, koi viewing windows |

**Agent Workstations:** 12 (Pavilion: 4, Garden: 4, Tea House: 4)
**Max Occupancy:** 24 agents

---

#### 3.4.3 meok.ai - Wellness Center

```
Building ID: BT_WELL_03
Name: "The Meok Spa"
Purpose: Wellness, relaxation, responsible gaming, holistic health
Position: (20, 0, 140)
```

**3D Dimensions:**
- Main building: 25m x 20m x 10m (h)
- Spa wing: 15m x 10m x 6m (h)
- Gaming pavilion: 12m x 12m x 8m (h), open-air
- Garden: 30m x 25m
- Total footprint: 55m x 50m

**Color Scheme:**
| Element | Color | Hex |
|---------|-------|-----|
| Main building | Warm white | #FFFAF0 |
| Spa wing | Aqua | #7FFFD4 |
| Gaming pavilion | Playful purple | #9B59B6 |
| Garden | Healing green | #90EE90 |
| Steam effects | White mist | #FFFFFF (particle) |
| Accent lights | Warm amber | #FFB347 (emissive) |

**Visual Features:**
1. **Steam Particles:** The spa wing continuously emits steam/water vapor particles from the roof and windows. Fades within 2 meters. Density varies with time of day.
2. **Gaming Lights:** The gaming pavilion has animated LED-like light strips that change color based on activity. Calm blue during responsible gaming, alerting patterns if intervention needed.
3. **Zen Bell:** A large decorative bell at the entrance. Rings (visual soundwave + golden particles) when agents enter, signifying mindfulness.
4. **Garden Water Feature:** Multiple small fountains in the garden with synchronized water jets (particle systems with gravity simulation).

**Interior Layout:**
| Area | Purpose | Contents |
|------|---------|----------|
| Reception | Welcome | Check-in desks, wellness program displays, appointment terminals (4 stations) |
| Treatment Rooms | Spa services | 8 private treatment rooms with massage tables, aromatherapy diffusers |
| Gaming Floor | Entertainment | 12 gaming stations with responsible gaming monitors, time-limit displays |
| Meditation Hall | Mindfulness | 20 meditation cushions, guided meditation screens, ambient sound system |
| Thermal Area | Spa facilities | Hot pool, cold plunge, steam room, sauna (animated steam particles) |
| Garden Lounge | Relaxation | 12 lounge chairs, herbal tea bar, outdoor meditation space |

**Agent Workstations:** 24 (Reception: 4, Gaming: 8, Treatment: 6, Meditation: 6)
**Max Occupancy:** 40 agents

---

### 3.5 Innovation District - "The Lab" (+112.5 to +157.5 degrees)

**Purpose:** Research, development, AI experimentation, and automation. Futuristic architecture with exposed technology and dynamic displays.

**Wedge Parameters:** Inner radius 60m, outer radius 180m, angular span 45 degrees
**Road Access:** Wide spoke road with embedded LED lane markings
**Ground Material:** Polished dark concrete (#3D3D3D) with glowing circuit traces (#00FF88)
**Ambient Pheromone:** Blue innovation sparks (`mcp.caste.transform`), rapid flickering motion

#### 3.5.1 openmoe.ai - AI Lab

```
Building ID: BT_INN_01
Name: "The Open Lab"
Purpose: AI research, MoE model development, open-source AI
Position: (-20, 0, 140)
```

**3D Dimensions:**
- Main lab: 35m x 25m x 12m (h)
- Server tower: 10m x 10m base, 25m height
- Experiment pods: Four 8m x 8m x 6m (h) glass pods
- Courtyard: 30m x 20m
- Total footprint: 65m x 55m

**Color Scheme:**
| Element | Color | Hex |
|---------|-------|-----|
| Main building | Tech black | #1A1A2E |
| Glass pods | Transparent cyan | #00FFFF (glass) |
| Server tower | Dark with green LEDs | #1A1A2E / #39FF14 |
| Circuit lines | Neon green | #39FF14 (emissive) |
| Experiment glow | Variable (per project) | Dynamic |
| Logo accent | Open orange | #FF8C00 |

**Visual Features:**
1. **Server Tower Lights:** The server tower has 500+ individually addressable LED points (implemented as a single instanced emissive mesh). Patterns: matrix rain, wave propagation, data throughput visualization.
2. **Experiment Pod Glow:** Each glass pod glows a different color based on the active experiment inside. Colors shift smoothly as experiments progress.
3. **Holographic Displays:** Floating holographic screens (billboard sprites with additive blending) show live model training metrics, loss curves, accuracy graphs.
4. **Particle Accelerator Effect:** A decorative tube running between the pods contains animated particle streams representing data flowing between experiments.
5. **Open Source Symbol:** A rotating 3D "open" symbol (stylized "O" with radiating lines) on the roof, representing open-source philosophy.

**Interior Layout:**
| Area | Purpose | Contents |
|------|---------|----------|
| Main Lab Floor | Research | 20 workstations with multiple monitors, whiteboard walls, pair programming setups |
| Server Tower | Compute | 50+ server racks (decorative), cooling infrastructure, network equipment |
| Experiment Pods | Isolated testing | 4 self-contained AI testing environments with observation windows |
| Model Zoo | Model showcase | 20 pedestals displaying trained model artifacts, interactive comparison tools |
| Collaboration Area | Team work | 8 brainstorming pods, video conferencing, shared workspace |
| Reading Room | Knowledge | AI research paper library, comfortable seating, thought-provoking quotes |

**Agent Workstations:** 32 (Lab: 16, Server: 6, Pods: 8, Collaboration: 8)
**Max Occupancy:** 50 agents

---

#### 3.5.2 cobolbridge.ai - Retro-Tech Bridge

```
Building ID: BT_INN_02
Name: "The Legacy Bridge"
Purpose: Legacy system modernization, COBOL-to-modern bridging, tech archaeology
Position: (-60, 0, 120)
```

**3D Dimensions:**
- Bridge structure: 40m x 12m x 15m (h) -- architectural bridge metaphor
- Terminal building: 15m x 15m x 8m (h)
- Retro museum: 20m x 12m x 6m (h)
- Total footprint: 60m x 40m

**Color Scheme:**
| Element | Color | Hex |
|---------|-------|-----|
| Bridge structure | Weathered steel | #708090 |
| Terminal building | IBM beige | #F5F5DC |
| Retro accents | Phosphor green | #33FF33 (emissive) |
| Punched card details | Manila brown | #F4A460 |
| Modern accents | Clean white | #FFFFFF |
| Transition zone | Gradient beige-to-white | Animated |

**Visual Features:**
1. **Bridge Metaphor:** The building IS a literal bridge -- agents walk across it to symbolize the transition from legacy to modern systems. Water below is a shader effect.
2. **Phosphor Terminal Glow:** Retro CRT terminal displays in the windows glow with authentic phosphor green flicker. Implemented with per-character random intensity variation.
3. **Data Stream Animation:** Binary code (0s and 1s as floating particles) flows from the retro side to the modern side of the bridge, transforming from green to blue mid-journey.
4. **Punched Card Rain:** Decorative punched card models (thin rectangles with hole patterns) float down like leaves on the retro side.
5. **Transformation Portal:** At the center of the bridge, a swirling particle vortex represents code transformation. Agents standing nearby have `mcp.caste.transform` blue particles.

**Interior Layout:**
| Area | Purpose | Contents |
|------|---------|----------|
| Bridge Walkway | Transition | 20 workstations along the bridge, legacy on one side modern on other |
| Terminal Room | Legacy access | 8 retro terminal stations with CRT glow, punch card readers, tape drives |
| Modernization Lab | Conversion | 10 code transformation stations, AI-assisted refactoring tools |
| Retro Museum | Education | Historic computer exhibits, timeline wall, interactive legacy simulations |
| Archive | Documentation | Legacy code repository access, documentation scanners, knowledge extraction |

**Agent Workstations:** 24 (Bridge: 8, Terminal: 4, Modernization: 8, Archive: 4)
**Max Occupancy:** 36 agents

---

#### 3.5.3 loopfactory.ai - Automation Factory

```
Building ID: BT_INN_03
Name: "The Loop Factory"
Purpose: Automation, feedback loops, process optimization, robotic systems
Position: (-100, 0, 90)
```

**3D Dimensions:**
- Factory floor: 50m x 30m x 12m (h)
- Observation catwalk: 40m x 3m at 8m height
- Control room: 15m x 10m x 6m (h), elevated
- Loading/Output bays: Two 15m x 8m areas
- Total footprint: 80m x 40m

**Color Scheme:**
| Element | Color | Hex |
|---------|-------|-----|
| Factory exterior | Industrial orange | #E8732E |
| Robot arms | Safety yellow | #FFD800 |
| Conveyor belts | Dark rubber | #2D2D2D |
| Control room | Dark glass | #1A1A2E (transparent) |
| Status lights | Multi-color LED | Dynamic |
| Loop symbol | Infinity gold | #FFD700 (emissive) |

**Visual Features:**
1. **Robot Arm Animation:** 6 low-poly robotic arm models (each ~100 polygons, 3 joints) perform continuous looping animations: pick, move, place, return. Speed varies with factory activity level.
2. **Conveyor Belt System:** Animated UV-scrolling textures on conveyor surfaces give illusion of movement. Small box/crate models travel along predetermined paths.
3. **Loop Visualization:** Large infinity symbol on the roof glows with golden emissive material. Pulse rate represents factory throughput.
4. **Status Light Array:** 50+ colored LED points on the exterior form a real-time efficiency visualization. Pattern complexity = system complexity being managed.
5. **Feedback Particles:** When automation succeeds, green confirmation particles rise. When fails, red alert particles with rapid pulsing.

**Interior Layout:**
| Area | Purpose | Contents |
|------|---------|----------|
| Factory Floor | Automation | 6 robotic work cells, conveyor network, quality scan stations |
| Control Room | Monitoring | 8 operator stations with factory overview displays, emergency controls |
| Programming Bay | Robot coding | 10 coding stations with robot simulation, path planning tools |
| Testing Lab | QA | 4 testing cells with automated test equipment, failure analysis stations |
| Observation Catwalk | Tours | Viewing walkway above factory floor, educational displays |
| Output Bay | Shipping | Automated packaging, barcode scanning, dispatch labeling |

**Agent Workstations:** 28 (Floor: 6, Control: 6, Programming: 10, Testing: 6)
**Max Occupancy:** 44 agents

---

### 3.6 Safety District - "The Shield" (+157.5 to +202.5 degrees)

**Purpose:** Security, safety protocols, AGI safety training, threat response. Fortress-like architecture conveying protection and vigilance.

**Wedge Parameters:** Inner radius 60m, outer radius 180m, angular span 45 degrees
**Road Access:** Wide roads for emergency vehicle access, direct spoke connection
**Ground Material:** Reinforced dark concrete (#2D2D2D) with safety yellow markings
**Ambient Pheromone:** Purple shield particles (`mcp.gate.guard`), forming a protective dome shape

#### 3.6.1 asisecurity.ai - Security HQ

```
Building ID: BT_SAF_01
Name: "The Citadel"
Purpose: AI security operations, threat monitoring, incident response
Position: (-130, 0, 50)
```

**3D Dimensions:**
- Main fortress: 35m x 30m x 18m (h)
- Watch tower: 8m x 8m base, 35m height
- Courtyard: 25m x 25m, fortified
- Bunker entrance: 6m x 4m, sloped armored doors
- Total footprint: 65m x 55m

**Color Scheme:**
| Element | Color | Hex |
|---------|-------|-----|
| Walls | Armored gray | #4A4A4A |
| Accents | Security red | #DC143C |
| Watch tower | Dark with red beacon | #2D2D2D / #FF0000 |
| Bunker doors | Armored steel | #708090 |
| Courtyard | Parade ground gray | #808080 |
| Shield emblem | Sovereign gold | #FFD700 |

**Visual Features:**
1. **Rotating Beacon:** The watch tower has a red emergency beacon that rotates continuously. Speed increases during security alerts.
2. **Shield Dome Effect:** A faint transparent dome (half-sphere geometry with additive blending, 0.05 opacity) covers the entire district, visible during security scans.
3. **Alert Status Display:** Large exterior display shows current threat level: green (normal), yellow (elevated), orange (high), red (critical). Entire building tint shifts to match.
4. **Perimeter Scan Line:** A green laser-like scan line sweeps around the building perimeter periodically, representing active monitoring.
5. **Bunker Hatch Animation:** During security drills, the armored bunker doors slide open (translateY animation) revealing an emergency command center glow.

**Interior Layout:**
| Area | Purpose | Contents |
|------|---------|----------|
| SOC | Security operations center | 16 monitoring stations, 360-degree display wall, incident management system |
| Watch Tower | Surveillance | High-power sensors, telescopic cameras, 50km virtual view range |
| Incident Room | Crisis response | War room with 20 stations, emergency communication, lockdown controls |
| Armory | Tools | Security tool storage, forensic equipment, penetration testing kits |
| Training Deck | Simulations | 8 VR training pods, attack/defense scenario simulators |
| Bunker | Emergency HQ | Shielded command center, backup systems, continuity planning |

**Agent Workstations:** 36 (SOC: 12, Tower: 4, Incident: 8, Training: 8, Armory: 4)
**Max Occupancy:** 48 agents

---

#### 3.6.2 safetyof.ai - Safety Center

```
Building ID: BT_SAF_02
Name: "The Safety Nexus"
Purpose: General safety protocols, risk assessment, compliance monitoring
Position: (-140, 0, 0)
```

**3D Dimensions:**
- Main building: 30m x 25m x 12m (h)
- Training yard: 50m x 30m (outdoor)
- Helipad: 12m diameter
- Safety tower: 6m x 6m base, 20m height
- Total footprint: 80m x 55m

**Color Scheme:**
| Element | Color | Hex |
|---------|-------|-----|
| Building | Safety orange | #FF8C00 |
| Training yard | Sand tan | #D2B48C |
| Helipad | Green H | #32CD32 / #FFFFFF |
| Safety tower | Checkered orange/white | #FF8C00 / #FFFFFF |
| Warning signs | Yellow/Black | #FFD800 / #000000 |
| Status indicators | Traffic light colors | Dynamic |

**Visual Features:**
1. **Training Animation:** Agent models in the training yard perform safety drills (fire response, evacuation, first aid) as looping animations.
2. **Helicopter Model:** A low-poly rescue helicopter on the helipad. Rotor spins when "deployed," lifts off with vertical animation.
3. **Checkered Tower:** The safety tower has a rotating checkered pattern and a bright floodlight that sweeps the area at night.
4. **Safety Score Display:** Large exterior LED wall shows the current colony safety score as a percentage. Color-coded: red (<50%), yellow (50-80%), green (>80%).
5. **Warning Siren:** Decorative siren on the tower spins and emits visual soundwave particles during drills.

**Interior Layout:**
| Area | Purpose | Contents |
|------|---------|----------|
| Command Center | Monitoring | 10 stations with safety dashboards, alert management, compliance tracking |
| Training Rooms | Education | 4 classrooms (20 seats each), VR safety training systems |
| Risk Assessment | Analysis | 8 analyst workstations, risk modeling displays, scenario planning tools |
| Compliance Lab | Testing | 6 testing stations, safety certification equipment, audit tools |
| Emergency Medical | First response | 4 treatment bays, medical equipment, telemedicine stations |

**Agent Workstations:** 28 (Command: 8, Training: 8, Risk: 6, Compliance: 6)
**Max Occupancy:** 44 agents

---

#### 3.6.3 agisafe.ai - Training Academy

```
Building ID: BT_SAF_03
Name: "The AGI Academy"
Purpose: AGI safety training, alignment research, capability evaluation
Position: (-130, 0, -50)
```

**3D Dimensions:**
- Academy building: 35m x 25m x 14m (h)
- Training dome: 20m diameter, 15m height (geodesic)
- Evaluation center: 15m x 15m x 10m (h)
- Campus: 40m x 35m
- Total footprint: 75m x 60m

**Color Scheme:**
| Element | Color | Hex |
|---------|-------|-----|
| Academy | Scholarly blue | #4169E1 |
| Training dome | Geodesic glass | #87CEEB (transparent) |
| Evaluation center | Serious gray | #696969 |
| Campus paths | Brick red | #B22222 |
| Knowledge accent | Gold leaf | #FFD700 |
| Alignment symbol | White star | #FFFFFF (emissive) |

**Visual Features:**
1. **Geodesic Dome:** The training dome is a geodesic sphere (icosahedron subdivision, level 2) with transparent panels. Interior visible from outside.
2. **Alignment Star:** A bright star symbol on the evaluation center roof. Number of visible rays represents alignment confidence score (1-8 rays).
3. **Knowledge Particles:** Golden particle streams flow from the academy to other district buildings, representing knowledge sharing.
4. **Training Simulation Glow:** The dome interior glows different colors during training scenarios: blue (calibration), green (safe scenario), yellow (edge case), red (alignment test).
5. **Graduation Animation:** When agents complete training, confetti particles and a brief golden pillar light effect celebrate.

**Interior Layout:**
| Area | Purpose | Contents |
|------|---------|----------|
| Lecture Hall | Teaching | 40-seat auditorium, holographic presentation system, recording equipment |
| Training Dome | Simulation | Immersive training environment, scenario projection, physical obstacle course |
| Evaluation Center | Testing | 12 evaluation pods, capability measurement tools, benchmark displays |
| Research Wing | Alignment research | 16 research stations, paper collaboration tools, experiment tracking |
| Library | Knowledge | Extensive digital library, quiet study pods, knowledge retrieval terminals |
| Certification Hall | Graduation | Examination rooms, certification display wall, achievement ceremony space |

**Agent Workstations:** 32 (Lecture: 6, Dome: 8, Evaluation: 8, Research: 10)
**Max Occupancy:** 52 agents

---

### 3.7 Legal District - "The Firm" (+202.5 to +247.5 degrees)

**Purpose:** Legal services, land law, data privacy, accountability. Traditional professional architecture with modern legal tech elements.

**Wedge Parameters:** Inner radius 60m, outer radius 180m, angular span 45 degrees
**Road Access:** Formal tree-lined avenue, direct spoke connection
**Ground Material:** Polished granite (#696969) with brass inlay patterns
**Ambient Pheromone:** Black marker particles (`mcp.territory.mark`), slow deliberate movement

#### 3.7.1 landlaw.ai - Courthouse

```
Building ID: BT_LEG_01
Name: "The Land Court"
Purpose: Property law, land management, territorial dispute resolution
Position: (-90, 0, -100)
```

**3D Dimensions:**
- Courthouse: 30m x 25m x 16m (h)
- Clock tower: 10m x 10m base, 28m height
- Law library wing: 20m x 12m x 8m (h)
- Formal garden: 35m x 30m
- Total footprint: 65m x 55m

**Color Scheme:**
| Element | Color | Hex |
|---------|-------|-----|
| Courthouse | Judicial gray | #708090 |
| Clock tower | Limestone white | #F5F5F0 |
| Law library | Mahogany brown | #4A0404 |
| Garden | Formal green | #228B22 |
| Legal seal | Gold embossed | #FFD700 |
| Court accents | Deep red | #8B0000 |

**Visual Features:**
1. **Clock Tower:** Classic clock tower with visible mechanism. Shows in-world time. Bell chime visualized as expanding golden rings at each hour.
2. **Scales of Justice:** Large animated scales above the main entrance. Tip based on virtual "case weight" being processed inside.
3. **Legal Seal Glow:** The embossed legal seal on the facade glows when court is in session.
4. **Territory Visualization:** In the formal garden, a holographic projection of the town's land parcels is displayed. Parcels change color when disputes are resolved.
5. **Law Book Particles:** When legal precedents are cited, small book-shaped particles float from the library wing to the courthouse.

**Interior Layout:**
| Area | Purpose | Contents |
|------|---------|----------|
| Courtroom | Trials | Judge's bench, jury box (12), defendant stand, witness box, public gallery (30) |
| Law Library | Research | Floor-to-ceiling book shelves, 12 research carrels, rare document display |
| Title Office | Land records | 8 title examination stations, deed storage, boundary mapping tools |
| Mediation Suite | Dispute resolution | 6 mediation rooms, negotiation simulation tools, settlement tracking |
| Clerk's Office | Administration | 10 filing stations, scheduling system, public information desk |

**Agent Workstations:** 30 (Courtroom: 8, Library: 8, Title: 6, Mediation: 4, Clerk: 4)
**Max Occupancy:** 48 agents

---

#### 3.7.2 dataprivacyof.ai - Data Vault

```
Building ID: BT_LEG_02
Name: "The Data Vault"
Purpose: Data privacy protection, secure storage, encryption services
Position: (-50, 0, -130)
```

**3D Dimensions:**
- Vault building: 25m x 20m x 8m (h) above ground
- Underground vault: 20m x 15m x 10m (h) -- visible through glass floor
- Entrance plaza: 20m x 20m
- Security perimeter: 30m x 25m
- Total footprint: 50m x 45m

**Color Scheme:**
| Element | Color | Hex |
|---------|-------|-----|
| Above ground | Clean white | #FFFAF0 |
| Vault door | Heavy steel | #4A4A4A |
| Underground | Secure blue | #00008B |
| Encryption glow | Matrix green | #00FF00 (emissive) |
| Security laser | Red | #FF0000 (thin lines) |
| Data streams | Cyan flow | #00FFFF |

**Visual Features:**
1. **Vault Door Animation:** The massive circular vault door rotates (rotateY animation) when accessed, revealing the glowing interior. Closes with satisfying heavy animation.
2. **Laser Security Grid:** Red laser lines (thin emissive cylinder segments) crisscross the entrance plaza, creating a visual security perimeter. Lines break apart to let authorized agents pass.
3. **Data Stream Visualization:** Encrypted data streams visualized as flowing cyan particle columns rising from the underground vault through the glass floor.
4. **Encryption Shield:** A transparent dome (additive blending) periodically pulses over the building, representing active encryption protection.
5. **Privacy Seal:** A rotating holographic lock symbol above the entrance. Unlocked (open) = transparent, locked (secure) = solid gold.

**Interior Layout:**
| Area | Purpose | Contents |
|------|---------|----------|
| Reception | Access control | 4 security stations, biometric scanners, visitor management |
| Vault Chamber | Secure storage | Server racks behind vault door, climate control, redundant systems |
| Encryption Lab | Crypto research | 10 workstations with encryption tools, key management systems |
| Compliance Suite | Privacy audits | 6 audit stations, GDPR/privacy law displays, compliance tracking |
| Incident Room | Breach response | War room for data breach response, forensic tools, communication hub |

**Agent Workstations:** 20 (Security: 4, Encryption: 8, Compliance: 4, Incident: 4)
**Max Occupancy:** 32 agents

---

#### 3.7.3 accountabilityof.ai - Audit Office

```
Building ID: BT_LEG_03
Name: "The Accountability Bureau"
Purpose: Auditing, transparency enforcement, accountability tracking
Position: (-10, 0, -140)
```

**3D Dimensions:**
- Office building: 25m x 20m x 12m (h)
- Observation deck: 15m x 10m x 8m (h), glass-walled
- Plaza: 25m x 25m
- Transparency tower: 5m x 5m base, 18m height
- Total footprint: 50m x 45m

**Color Scheme:**
| Element | Color | Hex |
|---------|-------|-----|
| Building | Clean glass/steel | #E0E0E0 / #C0C0C0 |
| Observation deck | Transparent | #FFFFFF (glass) |
| Transparency tower | Crystal clear | #87CEEB (transparent) |
| Audit accent | Amber warning | #FFBF00 |
| Accountability seal | Gold hand | #FFD700 |
| Report ribbon | Red | #DC143C |

**Visual Features:**
1. **Glass Transparency:** The entire observation deck is glass-walled (transparent material with refraction). Represents transparency in governance.
2. **Audit Beam:** The transparency tower emits a rotating white spotlight beam at night, symbolizing "shining light" on accounts.
3. **Report Ribbon Animation:** When audits complete, a red ribbon particle unfurls from the building facade, displaying the audit result summary.
4. **Accountability Web:** Thin golden lines (instanced line segments) connect this building to all other district buildings, visualizing the accountability network.
5. **Score Display:** A large public scoreboard shows current accountability metrics for each district. Updates in real-time.

**Interior Layout:**
| Area | Purpose | Contents |
|------|---------|----------|
| Audit Floor | Financial audits | 12 auditor workstations, forensic accounting tools, document analysis |
| Observation Deck | Public oversight | 10 public viewing stations, live audit feeds, transparency tools |
| Report Center | Publication | 6 report writing stations, publishing tools, public record systems |
| Investigation Wing | Deep dives | 4 private investigation rooms, secure document handling, interview suites |
| Accountability Hall | Public meetings | 30-seat public meeting room, livestream setup, public comment system |

**Agent Workstations:** 22 (Audit: 10, Observation: 4, Report: 4, Investigation: 4)
**Max Occupancy:** 36 agents

---

### 3.8 Media District - "The Signal" (+247.5 to +292.5 degrees)

**Purpose:** Media management, transparency, public communication. Features broadcast equipment and observation technology.

**Wedge Parameters:** Inner radius 60m, outer radius 180m, angular span 45 degrees
**Road Access:** Direct spoke connection with media vehicle access
**Ground Material:** Dark polished surface (#2D2D2D) with media-themed LED ground patterns
**Ambient Pheromone:** White/clear signal particles, representing broadcast transmission

#### 3.8.1 socialmediamanager.ai - Broadcast Tower

```
Building ID: BT_MED_01
Name: "The Broadcast Spire"
Purpose: Social media management, content distribution, public communication
Position: (40, 0, -130)
```

**3D Dimensions:**
- Broadcast tower: 12m x 12m base, 60m total height (tallest after King's Tower)
- Studio building: 25m x 20m x 10m (h) at tower base
- Satellite dish array: 6 dishes, each 4m diameter
- Content garden: 30m x 25m
- Total footprint: 55m x 45m

**Color Scheme:**
| Element | Color | Hex |
|---------|-------|-----|
| Tower | Media black | #0D0D0D |
| Studio | Content blue | #1DA1F2 |
| Dishes | Metallic silver | #C0C0C0 |
| Broadcast glow | Signal cyan | #00FFFF (emissive) |
| Content stream | Rainbow gradient | Dynamic |
| Social icons | Brand colors | Platform-specific |

**Visual Features:**
1. **Signal Transmission:** The tower top emits continuous concentric ring particles (like ripples) expanding upward and fading. Color shifts based on content type being broadcast.
2. **Dish Animation:** The 6 satellite dishes slowly rotate (different speeds/directions) to track virtual "satellites." Each dish has a thin beam line pointing skyward.
3. **Content Stream:** A flowing ribbon of multicolored particles wraps around the tower, representing the content stream. Colors change based on trending topics.
4. **Social Pulse:** The studio building facade displays animated social media metrics (follower counts, engagement rates) as scrolling numbers on LED-like panels.
5. **Broadcast Glow:** During live broadcasts, the entire tower pulses with white light. Intensity matches broadcast viewership.

**Interior Layout:**
| Area | Purpose | Contents |
|------|---------|----------|
| Studio A | Live broadcast | Full studio with anchor desk, green screen, camera rigs, lighting |
| Studio B | Content creation | 6 content production stations, editing suites, graphics tools |
| Control Room | Broadcasting | 10 technician stations, switcher boards, live feed monitoring |
| Tower Base | Equipment | Server racks, transmission equipment, signal processing |
| Content Garden | Outdoor shoots | Flexible filming area, interview setups, audience seating (20) |
| Analytics Hub | Metrics | 8 data analyst stations, trend tracking, engagement analysis |

**Agent Workstations:** 30 (Studio A: 6, Studio B: 6, Control: 6, Analytics: 8, Garden: 4)
**Max Occupancy:** 44 agents

---

#### 3.8.2 transparencyof.ai - Observatory

```
Building ID: BT_MED_02
Name: "The Transparency Observatory"
Purpose: Transparency monitoring, public data access, open governance
Position: (80, 0, -100)
```

**3D Dimensions:**
- Observatory dome: 20m diameter, 15m height
- Research building: 25m x 15m x 10m (h)
- Data telescope: 12m length, 3m diameter cylinder on mount
- Public plaza: 30m x 30m
- Total footprint: 55m x 50m

**Color Scheme:**
| Element | Color | Hex |
|---------|-------|-----|
| Dome | Transparent crystal | #E0FFFF (glass) |
| Research building | Open white | #FFFFFF |
| Telescope | Precision silver | #C0C0C0 |
| Data beams | Transparent blue | #87CEEB (emissive) |
| Transparency aura | Clear white | #FFFFFF (additive) |
| Public access | Welcome green | #32CD32 |

**Visual Features:**
1. **Dome Transparency:** The observatory dome is fully transparent glass (physical material with transmission). Interior star projection visible at night.
2. **Data Telescope:** The large telescope model tracks across the sky (slow rotation animation). When "observing," a beam of light projects from the lens toward a specific district building.
3. **Transparency Score Projection:** The dome interior projects a holographic visualization of the colony's transparency score as a radial chart, visible from outside.
4. **Open Data Flow:** Blue particle streams flow from the observatory to all other buildings, representing open data distribution.
5. **Public Access Glow:** The entrance glows green when public data access is available, yellow when restricted, red when closed.

**Interior Layout:**
| Area | Purpose | Contents |
|------|---------|----------|
| Observatory Dome | Data observation | Large projection dome showing live colony data visualization |
| Telescope Control | Monitoring | 4 telescope operator stations, data analysis tools, recording systems |
| Research Floor | Transparency analysis | 10 analyst workstations, correlation tools, trend identification |
| Public Access Hall | Open data | 12 public terminals for data access, visualization tools, download stations |
| Archive | Historical data | Long-term data storage, historical trend analysis, report generation |
| Conference Room | Public meetings | 25-seat meeting room with live data feeds, presentation tools |

**Agent Workstations:** 22 (Telescope: 4, Research: 8, Public Access: 6, Archive: 4)
**Max Occupancy:** 36 agents

---

### 3.9 Residential Ring - "The Boroughs" (Radius 200-320m)

**Purpose:** Housing for all 46 AI agents. Arranged in a continuous ring around the town center, with each agent having their own personalized dwelling.

**Ring Parameters:** Inner radius 200m, outer radius 320m, full 360-degree circle
**Road Access:** Ring road at 200m radius, radial spoke roads connecting to districts
**Ground Material:** Residential cobblestone (#C0A080) with individual garden plots
**Ambient Pheromone:** Mixed individual agent pheromones, creating a colorful rainbow ring effect

#### 3.9.1 Residential Layout

The 46 houses are arranged in a circle at radius 250m (50m inward from the outer edge). Each house occupies an angular slice of:

```
360 degrees / 46 houses = ~7.826 degrees per house
```

**House positions calculated as:**
```
angle = house_index * (360 / 46)  // degrees from North
x = 250 * sin(angle * PI / 180)
z = -250 * cos(angle * PI / 180)  // negative because 0deg = North = -Z
```

**Street Layout:**
- Ring Road: 8m wide, at radius 200m, fully circular
- Radial Streets: 6m wide, 8 spokes connecting ring road to district ring road at 120m
- Walking Paths: 2m wide, connecting adjacent houses
- Gardens: 8m x 10m per house, between the house and ring road

#### 3.9.2 House Specifications

Each house is a low-poly stylized dwelling with personalization based on the agent's caste and personality.

**Base Dimensions:**
- Footprint: 8m x 8m
- Height: 6m (single story) or 10m (two story)
- Garden: 8m x 10m front area

**Caste-Based House Variants:**

| Caste | House Style | Roof Color | Accent Feature | Size Variant |
|-------|------------|------------|----------------|--------------|
| Worker | Cozy cottage | Brown (#8B4513) | Tool shed, workshop | Single story |
| Scientist | Modern lab | White (#FFFFFF) | Observatory dome, antenna | Two story |
| Artist | Colorful villa | Terracotta (#E2725B) | Sculpture garden, mural | Two story |
| Leader | Grand residence | Gold (#D4AF37) | Portico columns, flag | Two story |
| Explorer | Rustic lodge | Forest green (#228B22) | Map display, compass | Single story |
| Merchant | Compact shopfront | Navy (#1B3A5C) | Display window, sign | Single story |
| Mediator | Peaceful retreat | Lavender (#E6E6FA) | Meditation circle, fountain | Single story |

**Personalization Features:**
1. **Nameplate:** Each house has a small sign with the agent's name and role (text mesh, emissive for night visibility).
2. **Garden Style:** Gardens reflect agent personality -- flowers (social agents), minimalist (analytical agents), wild (creative agents), organized (diligent agents).
3. **Window Glow:** Windows emit warm light when the agent is home, cool blue when they're at work, off when they're elsewhere.
4. **Caste Emblem:** Small emblem above the door representing the agent's caste (simple geometric symbol).
5. **Activity Indicator:** Subtle particle effect near the door indicating current activity: green (working), blue (relaxing), gold (socializing), red (alert).

**Interior (Simplified -- visible through windows):**
- Living area: 4m x 4m with furniture (simplified low-poly)
- Work nook: 2m x 2m with desk and screen glow
- Sleeping area: 3m x 3m (not visible from outside)
- Kitchenette: 2m x 2m with basic appliances

**Agent Workstations:** 1 per house (personal desk)
**Max Occupancy:** 2 per house (the agent + occasional visitor)

---

## 4. Road Network Specifications

### 4.1 Road Hierarchy

| Road Type | Width | Surface | Locations | Total Length |
|-----------|-------|---------|-----------|-------------|
| Ring Road (Inner) | 8m | Polished stone | Radius 60m | 377m circumference |
| Ring Road (District) | 10m | Concrete | Radius 120m | 754m circumference |
| Ring Road (Outer) | 12m | Asphalt | Radius 200m | 1,257m circumference |
| Spoke Roads | 8m | Mixed | 8 spokes, center to 200m | ~1,600m total |
| Residential Streets | 6m | Cobblestone | Between house rows | ~800m total |
| Walking Paths | 2m | Gravel | Gardens, parks | ~2,000m total |

### 4.2 Road Design Details

**Spoke Roads (8 total):**
- Run radially from center (0,0) to outer ring road (200m radius)
- Each aligned with the center of a district wedge
- Surface: Dark gray concrete (#4A4A4A) with center line markings
- Embedded LED strips at edges (glow white at night, yellow during day)
- Street trees: Every 15m, low-poly stylized trees (instanced rendering)

**Ring Roads (3 concentric):**
- Inner Ring (60m): Pedestrian-only, polished stone with gold inlay patterns
- District Ring (120m): Mixed traffic, concrete with lane markings
- Outer Ring (200m): Main arterial, asphalt with full street lighting

**Street Lighting:**
| Light Type | Height | Spacing | Night Glow Color | Day Behavior |
|------------|--------|---------|-----------------|--------------|
| King's Tower | N/A (building) | N/A | Golden pulse | Active always |
| District lamps | 4m | 20m | White (warm) | Off |
| Spoke lamps | 5m | 15m | White (cool) | Off |
| Ring road lamps | 6m | 12m | Amber | Off |
| Residential lamps | 3m | 10m | Warm yellow | Off |
| Building accent | Varies | Per building | Caste color | Cycles slowly |

All street lamps use instanced mesh rendering for performance. 200+ lamp instances total.

### 4.3 Signage System

**District Entrance Signs:**
- 8 large signs at the junction of each spoke road and district ring road
- 4m x 3m board on 2 posts, showing district name and icon
- Color-coded per district
- Emissive text for night visibility

**Directional Signs:**
- Arrow-style signs at intersections pointing to each district
- Street name signs at 2m height on lamp posts
- Building name signs above each hive entrance (2m x 0.5m)

**Information Kiosks:**
- 8 digital kiosks (one per district) showing:
  - District map
  - Current agent activity in the district
  - Upcoming events
  - Pheromone status
- Holographic projection style (floating above base unit)

---

## 5. Environment Specifications

### 5.1 Ground Plane

**Terrain:**
- Mostly flat with gentle undulation (0-2m height variation)
- Heightmap resolution: 512x512
- Procedural gentle hills in park areas and residential ring

**Material Zones:**
| Zone | Material | Base Color | Normal Map | Roughness |
|------|----------|------------|------------|-----------|
| Central District | Polished stone | #2D2D3A | Smooth | 0.1 |
| Governance District | Marble tiles | #F0F0F0 | Tile pattern | 0.2 |
| Commerce District | Reinforced concrete | #A0A0A0 | Slight texture | 0.6 |
| Wellness District | Softwood deck | #DEB887 | Wood grain | 0.4 |
| Innovation District | Dark concrete + circuits | #3D3D3D | Circuit traces | 0.3 |
| Safety District | Reinforced concrete | #2D2D2D | Heavy texture | 0.8 |
| Legal District | Polished granite | #696969 | Polished | 0.15 |
| Media District | Dark polished surface | #2D2D2D | Subtle pattern | 0.2 |
| Residential Ring | Cobblestone | #C0A080 | Cobble pattern | 0.7 |
| Roads | Asphalt/Concrete | Per road type | Appropriate | 0.9 |
| Gardens | Grass | #8FBC8F | Grass bump | 0.9 |

### 5.2 Skybox & Day/Night Cycle

**Sky System:** Dynamic skybox using `Sky` component from @react-three/drei

**Day Cycle (24 in-world minutes = 1 full day):**

```
Time of Day        Sky Color         Sun Position        Ambient Light    Street Lights
----------------------------------------------------------------------------------------
05:00 Dawn         #FFB6C1 (pink)    Low east            0.3 intensity    Off
06:00 Sunrise      #FF8C00 (orange)  Rising              0.5              Off
08:00 Morning      #87CEEB (blue)    Mid east            0.7              Off
12:00 Noon         #00BFFF (bright)  Zenith              1.0              Off
16:00 Afternoon    #87CEEB (blue)    Mid west            0.8              Off
18:00 Sunset       #FF6347 (red)     Low west            0.5              Transition
19:00 Dusk         #4B0082 (indigo)  Below horizon       0.3              On
20:00 Evening      #191970 (midnight)Set                 0.15             On
00:00 Midnight     #0D0D1A (black)   Moon high           0.1 (moonlight)  On
```

**Moon:** Simplified glowing sphere, follows opposite path to sun. Cool white light (#E6E6FA).

**Stars:** 500 small point sprites (instanced) visible during night hours. Subtle twinkle animation (opacity oscillation).

**Clouds:** 20-30 low-poly cloud models (flattened spheres merged) drifting slowly across the sky. Position wraps around when clouds exit the world bounds. Speed: 2m/s.

### 5.3 Weather Effects

**Weather States (probabilistic, changes every 5-15 minutes):**

| State | Probability | Visual Effect | Particle Effect | Lighting Change |
|-------|------------|---------------|-----------------|-----------------|
| Clear | 50% | None | None | Normal |
| Partly Cloudy | 20% | Cloud density increase | None | -10% ambient |
| Overcast | 15% | Full cloud cover | None | -30% ambient |
| Light Rain | 8% | Gray clouds | Rain particles (500) | -20% ambient, cool tint |
| Heavy Rain | 5% | Dark clouds | Rain particles (2000), puddle shaders | -40% ambient, blue-gray |
| Snow | 2% | White cloud cover | Snow particles (1000) | +20% ambient (reflective), white tint |

**Rain Particle System:**
- Emission: 500-2000 particles/sec (based on intensity)
- Velocity: Downward at 10-15 m/s with slight random X/Z drift
- Lifetime: 1.5 seconds (particles die when hitting ground)
- Collision: Raycast to ground, spawn splash particle on impact
- Sound: Optional ambient rain audio

**Snow Particle System:**
- Emission: 1000 particles/sec
- Velocity: Slow downward drift (2 m/s) with swirling motion (sinusoidal X/Z)
- Lifetime: 5 seconds
- Accumulation: White plane overlay on ground (opacity increases over time)
- Melting: Accumulation fades when weather changes

**Puddle System:**
- During/after rain, planar reflective surfaces appear on roads
- Simple plane geometry with animated normal map for ripple effect
- Fades over 2 minutes after rain stops

### 5.4 Ambient Particle Effects

**Daytime Ambient:**
- Dust motes: 100 small floating particles near ground level, slow drift
- Pollen: Occasional floating particles from tree areas (spring only)
- Heat shimmer: Slight distortion effect above dark surfaces on hot days

**Nighttime Ambient:**
- Fireflies: 50-100 golden glowing particles in park/garden areas
  - Random floating motion with sine-wave height variation
  - Glow intensity: 0.3-0.8 (oscillating per particle)
  - Color: #FFD700 (warm gold)
  - Active: 20:00 - 05:00 only
- Moth swarms: Small clusters of white particles near street lights
- Building glow: All building windows emit warm light (emissive materials)

**District-Specific Ambient:**
| District | Unique Ambient Effect |
|----------|----------------------|
| Central | Golden sparkle particles from King's Tower |
| Governance | Slow-floating document-like particles (sheets of paper) |
| Commerce | Steam puffs from industrial buildings, exhaust particles |
| Wellness | Floating petal particles from gardens, steam from spa |
| Innovation | Spark/energy particles near the AI lab, data stream effects |
| Safety | Scan-line sweep particles, subtle shield shimmer |
| Legal | Dust motes in sunlight beams (god rays from windows) |
| Media | Signal wave particles emanating from broadcast tower |
| Residential | Smoke wisps from chimneys, garden particles |

---

## 6. World Object Inventory

### 6.1 Instanced Objects (High Count, Repeated)

| Object Type | Count | LOD Strategy | Instance Group |
|-------------|-------|-------------|----------------|
| Street lamps | 200 | Full: 200 tris, Far: 50 tris | Yes |
| Trees | 150 | Full: 300 tris, Med: 100 tris, Far: billboard | Yes |
| Benches | 60 | Full: 150 tris, Far: omit | Yes |
| Trash cans | 40 | Full: 100 tris, Far: omit | Yes |
| Fire hydrants | 30 | Full: 80 tris | Yes |
| Road signs | 50 | Full: 50 tris | Yes |
| Garden plants | 300 | Full: varies, Far: omit | Yes (by type) |
| Fences (residential) | 500 segments | Full: 20 tris/segment | Yes |
| Rocks (decorative) | 80 | Full: 50 tris | Yes |
| Birds (animated) | 20 | Full: 30 tris, billboard when far | No (animated) |

### 6.2 Unique Interactive Objects

| Object | Location | Interaction | Purpose |
|--------|----------|-------------|---------|
| King's Tower throne | Central District | Sit (Agent 47) | Sovereign position |
| Marketplace stalls | Central District | Trade, browse | Commerce |
| BFT voting terminals | Parliament, Marketplace | Vote | Governance |
| Park benches | Zen Garden | Sit, converse | Social |
| Koi feeding station | Koi Gardens | Feed fish | Wellness activity |
| Gaming stations | Meok Spa | Play (minigame) | Entertainment |
| Experiment pods | Open Lab | Observe, interact | Research |
| Robot work cells | Loop Factory | Watch, program | Automation |
| Security monitors | SOC | View feeds | Surveillance |
| Training pods | AGI Academy | Take courses | Education |
| Vault door | Data Vault | Open/close | Security demo |
| Telescope | Observatory | View data | Transparency |
| Broadcast studio | Broadcast Spire | Watch broadcast | Media |
| Agent houses | Residential Ring | Visit, knock | Social |

### 6.3 Decorative Objects (Non-Interactive)

| Object | Count | Locations | Description |
|--------|-------|-----------|-------------|
| Fountains | 5 | Central, Governance, Wellness districts | Decorative water particle effects |
| Statues/Monuments | 8 | Various district centers | Caste symbols, historical figures |
| Flower gardens | 20 | Residential, Wellness, Governance | Colored flower patches |
| Hedgerows | 40 | Governance, Legal districts | Trimmed green hedge segments |
| Parked vehicles | 15 | Commerce district | Low-poly truck/car models |
| Construction equipment | 8 | Equipment Yard | Low-poly equipment models |
| Information kiosks | 8 | District entrances | Holographic info displays |
| Directional signs | 24 | Road intersections | Arrow signs pointing to districts |
| Decorative rocks | 60 | Gardens, parks | Varied rock formations |
| Bridges | 2 | Koi Gardens, Retro-Tech | Small decorative bridges |
| Flags/Banners | 16 | Various buildings | Animated cloth simulation |
| Rooftop antennas | 12 | Various buildings | Simple pole + dish geometry |
| Chimneys | 46 | All residential houses | Smoke particle emitters |

---

## 7. Pheromone Zone Map

Each district has a default ambient pheromone that agents emit while within its bounds. These create visual atmosphere and gameplay-relevant signals.

```
                    [Queen Gold]
                         |
    [Territory Mark] ----+---- [Queen Gold]
                         |
              [Cleanup Black]
                    /    \
                   /      \
         [Gate Guard]      [Alarm Red]
                   \      /
                    \    /
              [Trail Green]
                    |
             [Caste Transform]
                    |
              [Cleanup Black]
```

| District | Primary Pheromone | Secondary | Visual Signature |
|----------|-------------------|-----------|-----------------|
| Central | `mcp.queen.gold` | None | Golden fountain, tower pulse |
| Governance | `mcp.queen.gold` (weaker) | `mcp.territory.mark` | Document particles, dome glow |
| Commerce | `mcp.trail.green` | `mcp.cleanup.black` | Productivity trails, exhaust |
| Wellness | `mcp.caste.transform` | None | Calm blue aura, steam |
| Innovation | `mcp.caste.transform` | `mcp.trail.green` | Blue sparks, energy trails |
| Safety | `mcp.gate.guard` | `mcp.alarm.red` | Shield dome, scan lines |
| Legal | `mcp.territory.mark` | `mcp.gate.guard` | Marker particles, accountability web |
| Media | `mcp.queen.gold` (broadcast variant) | None | Signal rings, content stream |
| Residential | Mixed (per agent) | None | Rainbow of individual pheromones |
| Marketplace | Mixed (transactional) | None | Bursts on trade completion |
| Park | `mcp.trail.green` | None | Relaxation trails, fireflies |

---

## 8. Portal System for Sub-Worlds

Each hive building has a portal entrance that transitions to a detailed interior sub-world when Agent 47 (or following camera) approaches.

### 8.1 Portal Locations

| Portal ID | Location | Destination Sub-World | Trigger Radius |
|-----------|----------|----------------------|----------------|
| P_GOV_01 | Parliament entrance | Parliamentary chamber (full interior) | 5m |
| P_GOV_02 | Court entrance | Courtroom (full trial setup) | 5m |
| P_GOV_03 | Ethics entrance | Meditation hall + crystal chamber | 5m |
| P_COM_01 | Truck depot door | Dispatch center + yard view | 5m |
| P_COM_02 | Waste facility gate | Processing floor + control room | 5m |
| P_COM_03 | Equipment yard office | Customer service + yard overview | 5m |
| P_COM_04 | Logistics hub entrance | Operations floor + control tower | 5m |
| P_WELL_01 | Aquarium entrance | Main tank + monitoring lab | 5m |
| P_WELL_02 | Koi Gardens gate | Pavilion + pond viewing | 5m |
| P_WELL_03 | Spa entrance | Treatment rooms + gaming floor | 5m |
| P_INN_01 | AI Lab door | Experiment pods + server tower | 5m |
| P_INN_02 | Bridge walkway | Terminal room + museum | 5m |
| P_INN_03 | Factory entrance | Factory floor + robot cells | 5m |
| P_SAF_01 | Citadel gate | SOC + watch tower | 5m |
| P_SAF_02 | Safety Center door | Command center + training | 5m |
| P_SAF_03 | Academy entrance | Lecture hall + training dome | 5m |
| P_LEG_01 | Land Court portico | Courtroom + law library | 5m |
| P_LEG_02 | Data Vault door | Vault chamber + encryption lab | 5m |
| P_LEG_03 | Audit Office entrance | Audit floor + observation deck | 5m |
| P_MED_01 | Broadcast Spire lobby | Studio + control room | 5m |
| P_MED_02 | Observatory dome | Data projection + telescope | 5m |
| P_CENT_01 | King's Tower doors | Grand lobby + throne room | 5m |

### 8.2 Portal Visual Design

Each portal is represented as:
1. **Physical Doorway:** An actual architectural doorway/entrance matching the building style
2. **Transition Zone:** A 3m radius area around the entrance with increasing visual distortion
3. **Dissolve Effect:** As Agent 47 approaches within 5m, the doorway area begins a shader-based dissolve -- pixels fragment and scatter
4. **Interior Preview:** Through the dissolving doorway, a preview of the interior sub-world is visible (lower resolution, simplified)
5. **Loading Indicator:** A subtle circular progress indicator appears during the 1-2 second transition

### 8.3 Sub-World Design Principles

Each sub-world is a self-contained 3D scene representing the interior of the building:
- **Scale:** 1:1 with the exterior (no size distortion)
- **Detail Level:** Higher than exterior -- full furniture, interactive objects, detailed lighting
- **NPCs:** 5-15 simplified agent models (lower polygon) representing domain workers
- **Interactive Elements:** Clickable objects, readable displays, playable minigames
- **Return Portal:** Always visible exit portal to return to the main town
- **Ambient Audio:** Domain-appropriate ambient sound effects

### 8.4 Example: FishKeeper Sub-World

**Scene:** Inside the fishkeeper.ai aquarium building
**Contents:**
- 50,000L central display tank with 30+ animated fish models
- 8 smaller habitat tanks around the perimeter
- 6 monitoring stations with live fish health dashboards (UI panels)
- 2 quarantine tanks with isolation equipment
- Water quality testing lab with interactive equipment
- Underwater viewing tunnel (agents can "walk through" the tank)
- Interactive feeding station (click to scatter food particles)
- Return portal: clearly marked "Exit to Town" doorway

### 8.5 Example: GrabHire Sub-World

**Scene:** Inside the grabhire.ai truck depot
**Contents:**
- Dispatch center with 8 operator desks
- Large holographic route map showing active truck positions
- 4 loading bay views through large windows
- 3D truck models in various states (loading, maintenance, ready)
- Fleet dashboard wall showing all vehicle telemetry
- Interactive booking terminal (Agent 47 can simulate a hire)
- Driver lounge area with coffee machine particle effects
- Return portal: clearly marked exit door

---

## 9. World Metrics Summary

| Metric | Value |
|--------|-------|
| Total world size | 800m x 800m (640,000 sqm) |
| Buildable area | ~180,000 sqm (28% of total) |
| Number of district buildings | 22 (15 hive buildings + 7 support) |
| Number of residential houses | 46 |
| Total agent workstations | 450+ |
| Total max occupancy | 800+ agents |
| Road network length | ~6,000m |
| Street lamp count | 200+ |
| Tree count | 150+ |
| Total instanced objects | 1,500+ |
| Unique interactive objects | 50+ |
| Sub-world portals | 22 |
| Pheromone types active | 7 |
| Weather states | 6 |
| Day/night cycle | 24 in-world minutes |

---

## 10. Implementation Priority

| Phase | Deliverable | Priority | Est. Effort |
|-------|------------|----------|-------------|
| Phase 1 | Ground plane + roads + Central District | Critical | 2 weeks |
| Phase 1 | SOV3 King's Tower + Marketplace + Park | Critical | 1 week |
| Phase 2 | Governance District (3 buildings) | High | 1 week |
| Phase 2 | Commerce District (4 buildings) | High | 1.5 weeks |
| Phase 3 | Wellness District (3 buildings) | High | 1 week |
| Phase 3 | Innovation District (3 buildings) | High | 1.5 weeks |
| Phase 4 | Safety District (3 buildings) | Medium | 1 week |
| Phase 4 | Legal District (3 buildings) | Medium | 1 week |
| Phase 5 | Media District (2 buildings) | Medium | 0.5 weeks |
| Phase 5 | Residential Ring (46 houses) | Medium | 1.5 weeks |
| Phase 6 | Environment (sky, weather, particles) | Medium | 1 week |
| Phase 6 | Portal system + sub-worlds | Low | 2 weeks |
| Phase 7 | Polish, optimization, LOD | Low | 1 week |

**Total Estimated Effort:** 15-16 weeks for complete world implementation with a team of 2-3 3D artists/developers.

---

*Document Version 1.0 - CSOAI Agent 47 Town World Layout Design*
*Next Review: After Phase 1 completion*
