# DEEP ONTOLOGY: THE DEFONEOS KNOWLEDGE GRAPH ARCHITECTURE
## Reverse-Engineering Palantir's $308B Moat — Building Something BETTER for $0

**Classification:** DEFONEOS Internal Architecture Document
**Version:** 1.0.0-DEEP
**Codename:** OPERATION DEEP — ONTOLOGY AS WEAPON
**Date:** 2025-07-05
**Author:** DEFONEOS Architecture Team

---

> *"The Ontology is not a semantic data model or a metadata catalog. It is a governed, typed, live, bidirectional knowledge graph that acts as the authoritative digital twin of the enterprise."* — Palantir Foundry Documentation
>
> *"We're going to build the same thing. Open. Sovereign. Better."* — DEFONEOS

---

# TABLE OF CONTENTS

1. [Palantir's Ontology — Full Reverse Engineering](#section-1)
2. [Knowledge Graph Architecture for DEFONEOS](#section-2)
3. [The DEFONEOS Ontology — Complete Design](#section-3)
4. [Entity Resolution (The Hard Problem)](#section-4)
5. [Temporal Knowledge Graphs](#section-5)
6. [AI-Native Knowledge Graph & GraphRAG](#section-6)
7. [The $0 Build Plan](#section-7)
8. [Integration with SOV3 and 33 Hives](#section-8)
9. [Complete Code Architecture](#section-9)
10. [Appendices](#section-10)

---

# SECTION 1: PALANTIR'S ONTOLOGY — FULL REVERSE ENGINEERING

## 1.1 What IS the Ontology at a Technical Level?

Palantir's Ontology is a **multi-modal microservices system** consisting of dozens of underlying components, conceptually grouped into three layers: a **Language**, an **Engine**, and a **Toolchain**.

### The Three Layers

| Layer | Purpose | Components |
|-------|---------|------------|
| **Language** | Models semantic objects, links, properties; kinetic actions and automations; logic that defines how actions operate | Object types, Link types, Action types, Functions, Interfaces |
| **Engine** | Substantiates every component of the Language; provides modular read/write architecture | OMS, Object Databases, OSS, Funnel, Actions service |
| **Toolchain** | Enables developers to use the Ontology as a backend | OSDK, Workshop, AIP Logic, MCP servers |

### Formal Definition

An Ontology object is defined as:

```
O_i = (t_i, P_i, L_i)

Where:
  t_i = object type from governed type set T (e.g., Aircraft, Supplier, Soldier)
  P_i = set of typed key-value property pairs
  L_i = set of directed, typed edges connecting to other objects
```

### The Five Building Blocks

1. **Object Types** — Schema definitions for real-world entities or events (employees, shipments, flights, incidents). An instance is a specific entity.
2. **Link Types** — Schema-level relationships between two object types. Supports 1:1, 1:N, N:M cardinality.
3. **Action Types** — Governed transactions that edit objects, properties, and links in one shot, including side effects.
4. **Functions** — Server-side code that operates against Ontology objects. Can read properties, traverse links, make edits.
5. **Interfaces** — Describe the shape of an object type, giving polymorphism across types that share common structure.

## 1.2 The Backend Architecture (The Secret Sauce)

Five microservices do most of the work:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PALANTIR ONTOLOGY BACKEND                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │     OMS      │    │    Funnel    │    │   Actions    │              │
│  │  (Metadata   │◄───┤   (Ingestion │◄───┤   (Writes,   │              │
│  │   Service)   │    │    & Index)  │    │   Edits)     │              │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘              │
│         │                    │                    │                      │
│         ▼                    ▼                    ▼                      │
│  ┌─────────────────────────────────────────────────────┐                │
│  │              Object Databases (Indexed)              │                │
│  │         Object Storage V2 (OSv2)                     │                │
│  └────────────────────┬────────────────────────────────┘                │
│                       │                                                │
│                       ▼                                                │
│              ┌──────────────┐                                          │
│              │     OSS      │                                          │
│              │  (Read API:  │                                          │
│              │   Search,    │                                          │
│              │   Filter,    │                                          │
│              │   Aggregate) │                                          │
│              └──────────────┘                                          │
│                                                                         │
│  Query Interfaces: OSQL, OSDK, REST, GraphQL, MCP                     │
└─────────────────────────────────────────────────────────────────────────┘
```

### Service Breakdown

| Service | Function | Key Characteristics |
|---------|----------|-------------------|
| **OMS** (Ontology Metadata Service) | Source of truth for schema — defines all object types, link types, action types | Enforces global schema integrity and versioning |
| **Object Databases** | Store indexed object data optimized for fast retrieval | Heavily materialized and indexed layer; NOT a federated query layer |
| **OSS** (Object Set Service) | High-throughput read layer | Serves all queries with extreme low latency; LLMs interface through OSS |
| **Actions** | Orchestrates all write operations | Validates against governance policies, MAC/DAC security, schema constraints |
| **Funnel** (Object Data Funnel) | Orchestrates ingestion | Reads from datasources and user edits, indexes into object databases; supports batch and streaming |

### Key Technical Insight

> The Ontology is a **heavily materialized and indexed layer**, NOT a purely federated query layer. Source data is indexed into object databases so reads stay fast and consistent, with live pipelines and Change Data Capture keeping the indexed copy in sync.

### Evolution: Object Storage V1 (Phonograph) → V2

| Feature | OSv1 (Phonograph) | OSv2 (Current) |
|---------|-------------------|----------------|
| Indexing | Full rebuilds | Incremental object indexing |
| Scale | Millions per type | Tens of billions per type |
| Permissions | Row-level (Restricted Views) | Property-level (MDOs) |
| User edits | Limited | Up to 10,000 objects per action |
| Streaming | Limited | Low-latency streaming datasources |
| Max properties | ~500 | 2,000 per object type |
| Search Around | 10,000 objects | 100,000+ objects |

## 1.3 Semantic + Kinetic + Dynamic = The Full Model

Palantir divides the ontology into three conceptual layers:

### Semantic Layer (The World of Nouns)
Maps raw data to ontological entities:
- **Object type** → typed entity from the real world
- **Property** → attributes of an object
- **Link type** → relationships between object types (1:1, 1:N, N:M)

### Kinetic Layer (The World of Verbs)
Operationalizes the ontology:
- **Actions** → transactions that modify properties/links of objects
- **Functions** → rapidly executable logic for dashboards and apps
- **Dynamic security** → controls operations dynamically

### Dynamic Layer (Governance & Behavior)
- Business rules (e.g., "A Person can only be assigned a case if active")
- Access control (row-level AND property-level)
- Lifecycle management (e.g., Suspect → Investigated → Cleared)
- Complete audit trail via Action Log

## 1.4 Query Interface — Ontology SQL (OSQL)

```sql
-- Query objects directly with Spark SQL dialect
SELECT 
    p.name,
    p.rank,
    p.unit_code,
    COUNT(l.mission_id) AS mission_count
FROM Person p
LEFT JOIN participated_in l ON p.__object_id = l.source
WHERE p.clearance_level >= 'SECRET'
  AND p.status = 'ACTIVE'
GROUP BY p.name, p.rank, p.unit_code
```

**Key characteristics:**
- Shares same SQL parsing layer and ANSI-compliant Spark SQL dialect as Furnace
- Introduces specialized providers for object types and N:M link tables
- Executes directly against object storage layer — no intermediate data movement
- OSS determines which compute engine executes the query (Spark for complex queries)
- Minimum compute overhead: 2 seconds (base) to 18 seconds (actions)

## 1.5 Performance Characteristics

| Query Type | Min Compute-Seconds | Description |
|------------|---------------------|-------------|
| Base query | 2 | Returns object set with basic filtering |
| Search Around | 5 | Secondary filter on linked objects |
| Aggregation | 5 | sum, avg, count on properties |
| Ontology SQL | 5 | Direct SQL against object storage |
| Advanced | 10 | Semantic search over embeddings |
| Derived Property | 10 | Runtime-calculated properties |
| Actions | 18 | Writeback operations |

## 1.6 Security & Governance Architecture

| Feature | Implementation |
|---------|---------------|
| Row-level security | Restricted Views (RVs) |
| Property-level security | Multi-Dataset Objects (MDOs) |
| Access control | Roles + object security policies |
| Audit trail | Action Log — every action submission is an object type itself |
| Traceability | Who, when, what data was rewritten — permanently recorded |

## 1.7 The Palantir Lock-In Strategy (Why We Must Build Our Own)

| Lock-In Mechanism | Description |
|-------------------|-------------|
| Platform dependency | Ontology lives ONLY inside Foundry |
| Data integration required | Data must flow INTO Foundry, not referenced in-place |
| No cross-ontology links | Links between entities across different ontologies not supported |
| Pipeline coupling | Changes upstream cascade into Ontology behavior |
| Learning curve | Extensive vocabulary: OMS, OSS, Funnel, OSDK, Workshop, AIP Logic, MCP |
| Cost | ~$4.1M per customer deployment |

**DEFONEOS Counter-Strategy:** Build the same capabilities using open-source tools, open standards (RDF, OWL, SPARQL), and sovereign infrastructure.

---

# SECTION 2: KNOWLEDGE GRAPH ARCHITECTURE FOR DEFONEOS

## 2.1 The Contenders: Deep Comparison

| Database | Model | Query Language | Max Scale | Best For | License |
|----------|-------|---------------|-----------|----------|---------|
| **Neo4j** | Property Graph | Cypher | 200B nodes, 1T+ rels | General-purpose, rich ecosystem, APOC | SSPL/Commercial |
| **Dgraph** | Native Distributed Graph | GraphQL+- | 48B+ triples | Distributed, horizontal scale | Apache 2.0 |
| **TypeDB** | Strongly Typed Hypergraph | TypeQL | Proven at 400M entities | Type safety, inference, rules | Business Source |
| **TigerGraph** | Native Parallel Graph | GSQL | 70B nodes, 500B edges | Analytics, GSQL expressiveness | Commercial |
| **Apache Jena** | RDF Triple Store | SPARQL | 1B+ triples | Standards compliance, inference | Apache 2.0 |
| **JanusGraph** | Property Graph (backend-agnostic) | Gremlin | 100B+ edges | Backend flexibility (Cassandra, HBase, BigTable) | Apache 2.0 |

## 2.2 LDBC Benchmark Results

From published academic benchmarks:

| Database | SF=1 Query Time | SF=10 Query Time | Load Time (SF=10) | Scalability |
|----------|-----------------|-------------------|--------------------|-------------|
| **Neo4j** | 24.3 min total | Fastest overall | 119.29 hrs | Excellent |
| **TigerGraph** | ~2x Neo4j | ~2x Neo4j | 135.11 hrs | Good |
| **JanusGraph** | ~3x Neo4j | ~3x Neo4j | 152.14 hrs | Moderate |
| **NebulaGraph** | ~4x Neo4j | ~4x Neo4j | 169.19 hrs | Moderate |

## 2.3 DEFONEOS Decision: HYBRID ARCHITECTURE

After exhaustive analysis, DEFONEOS adopts a **hybrid multi-layer graph architecture**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DEFONEOS KNOWLEDGE GRAPH                             │
│                    "Better than Palantir. Open. Sovereign."                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────────────────┐  ┌─────────────────────────────────────────┐   │
│  │   LAYER 1: Real-Time   │  │   LAYER 2: Analytical / Standards       │   │
│  │   Operational Graph    │  │   Graph (RDF/OWL/SPARQL)                │   │
│  │                        │  │                                         │   │
│  │   Neo4j Community      │  │   Apache Jena + Fuseki                  │   │
│  │   + APOC + GDS         │  │   + OWL Inference                       │   │
│  │                        │  │                                         │   │
│  │   - Sub-second queries │  │   - Cross-domain reasoning              │   │
│  │   - 10M-100M entities  │  │   - Standards compliance                │   │
│  │   - ACID transactions  │  │   - Federation                          │   │
│  │   - Cypher native      │  │   - SPARQL querying                     │   │
│  │   - Graph algorithms   │  │   - OWL class inference                 │   │
│  └───────────┬────────────┘  └──────────────────┬──────────────────────┘   │
│              │                                  │                           │
│              └────────────────┬─────────────────┘                           │
│                               │                                             │
│                               ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              LAYER 3: Temporal Context Graph (Graphiti)             │   │
│  │                                                                     │   │
│  │   - Time-aware entity evolution                                     │   │
│  │   - Episode ingestion & provenance                                  │   │
│  │   - Hybrid retrieval (semantic + BM25 + graph)                      │   │
│  │   - AI-native memory layer                                          │   │
│  │   - P95 latency: 300ms                                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              LAYER 4: Entity Resolution Pipeline                    │   │
│  │                                                                     │   │
│  │   Zingg (open-source ML entity resolution)                          │   │
│  │   + Graph-based clustering (connected components)                   │   │
│  │   + Probabilistic matching (Fellegi-Sunter)                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              LAYER 5: GraphRAG (LLM + Knowledge Graph)              │   │
│  │                                                                     │   │
│  │   Microsoft GraphRAG (open-source)                                  │   │
│  │   + Local/Global/DRIFT search                                       │   │
│  │   + Community detection (Leiden algorithm)                          │   │
│  │   + LLM entity/relation extraction                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Why This Architecture?

| Requirement | Solution | Rationale |
|-------------|----------|-----------|
| **Real-time operations** | Neo4j | Sub-second queries, ACID, battle-tested |
| **Billions of entities** | Dgraph (when needed) | Native horizontal distribution |
| **Standards compliance** | Apache Jena | RDF/OWL/SPARQL for interoperability |
| **Temporal reasoning** | Graphiti | Bi-temporal model, provenance tracking |
| **AI-native queries** | GraphRAG | LLM-augmented graph retrieval |
| **Entity resolution** | Zingg + custom | ML-based + graph clustering |
| **Type safety** | Custom ontology layer | Defense-grade schema validation |
| **Zero cost** | All open-source | Community editions + self-hosted |

## 2.4 Technology Stack Summary

| Component | Technology | Version | Cost |
|-----------|-----------|---------|------|
| Primary Graph DB | Neo4j Community | 5.x | $0 |
| Graph Algorithms | Neo4j GDS | 2.x | $0 (community features) |
| Stored Procedures | APOC | 5.x | $0 |
| Standards Graph | Apache Jena | 5.x | $0 |
| SPARQL Server | Apache Fuseki | 5.x | $0 |
| Temporal Graph | Graphiti | Latest | $0 (open-source) |
| Entity Resolution | Zingg | 0.4.x | $0 (open-source) |
| GraphRAG | Microsoft GraphRAG | 1.x | $0 (MIT license) |
| LLM (local) | Mistral 7B / Llama 3 | Various | $0 (self-hosted) |
| Python API | py2neo + rdflib | Latest | $0 |
| Graph Analytics | NetworkX + iGraph | Latest | $0 |
| Visualization | Cytoscape.js / D3.js | Latest | $0 |
| Vector Search | Neo4j Vector Index | 5.11+ | $0 |

---

# SECTION 3: THE DEFONEOS ONTOLOGY — COMPLETE DESIGN

## 3.1 Core Philosophy

The DEFONEOS Ontology models the **entire operational defense environment** as typed objects with properties, links, and actions. Every entity has:

- **Identity** — unique, persistent identifier (URN-based)
- **Type** — strict schema from the ontology
- **Properties** — typed attributes with validation
- **Temporal metadata** — valid_from, valid_to, observed_at
- **Provenance** — source system, confidence score, extraction method
- **Security marking** — classification level, compartments, releasability
- **Links** — typed relationships to other entities
- **Actions** — what can be done with this entity

## 3.2 Entity Type Hierarchy

```
DEFONEOS_ENTITY
├── PERSON
│   ├── Soldier
│   ├── Civilian
│   ├── Analyst
│   ├── ThreatActor
│   ├── Prisoner
│   ├── Informant
│   └── Leader
├── VEHICLE
│   ├── Aircraft
│   │   ├── FixedWing
│   │   ├── RotaryWing
│   │   └── UAS
│   ├── GroundVehicle
│   │   ├── Tank
│   │   ├── APC
│   │   ├── MRAP
│   │   └── Logistics
│   ├── Maritime
│   │   ├── SurfaceCombatant
│   │   ├── Submarine
│   │   ├── Amphibious
│   │   └── PatrolCraft
│   └── SpaceAsset
├── EVENT
│   ├── Engagement
│   ├── Detection
│   ├── Alert
│   ├── Mission
│   ├── Patrol
│   ├── Interception
│   ├── SIGINT_Collection
│   ├── CyberEvent
│   └── ChangeOfStatus
├── LOCATION
│   ├── Base
│   ├── Checkpoint
│   ├── AO (Area of Operations)
│   ├── GridReference
│   ├── Route
│   ├── Building
│   └── GeoRegion
├── ORGANIZATION
│   ├── MilitaryUnit
│   │   ├── Squad
│   │   ├── Platoon
│   │   ├── Company
│   │   ├── Battalion
│   │   ├── Brigade
│   │   └── Division
│   ├── Nation
│   ├── NonStateActor
│   ├── NGO
│   ├── Cell (clandestine)
│   └── CorporateEntity
├── EQUIPMENT
│   ├── Sensor
│   ├── WeaponSystem
│   ├── Communications
│   ├── IT_System
│   └── CounterMeasure
├── SIGNAL
│   ├── RF_Signal
│   ├── CyberIndicator
│   ├── AcousticSignal
│   ├── SeismicSignal
│   └── EO_IR_Signature
├── DOCUMENT
│   ├── IntelligenceReport
│   ├── Order
│   ├── Image
│   ├── Video
│   └── Transcript
├── FACILITY
│   ├── PowerPlant
│   ├── CommunicationsTower
│   ├── DataCenter
│   ├── FuelDepot
│   └── Manufacturing
└── ENVIRONMENTAL
    ├── WeatherCondition
    ├── TerrainFeature
    └── NaturalResource
```

## 3.3 Complete Entity Type Definitions

### 3.3.1 PERSON Family

#### Base: Person
```yaml
entity_type: Person
identifier_urn: "urn:defoneos:person:{uuid}"
properties:
  # Identity
  full_name: string (required, index)
  alias: list[string] (index)
  biometric_id: string (hash, unique)
  
  # Classification
  person_type: enum [SOLDIER, CIVILIAN, ANALYST, THREAT_ACTOR, PRISONER, INFORMANT, LEADER, UNKNOWN]
  
  # Demographics
  date_of_birth: date
  nationality: string (ISO 3166-1 alpha-3)
  gender: enum [MALE, FEMALE, UNKNOWN]
  
  # Military
  rank: enum [PVT, PFC, CPL, SGT, SSG, SFC, MSG, 1SG, SGM, 2LT, 1LT, CPT, MAJ, LTC, COL, BG, MG, LTG, GEN, CIV]
  unit_assignment: reference(Organization)
  mos: string (Military Occupational Specialty code)
  
  # Security
  clearance_level: enum [UNCLASSIFIED, CONFIDENTIAL, SECRET, TOP_SECRET, SCI]
  compartments: list[string]
  
  # Status
  status: enum [ACTIVE, INACTIVE, WIA, KIA, MIA, DETAINED, DECEASED, UNKNOWN]
  
  # Temporal
  valid_from: datetime (required)
  valid_to: datetime (null = current)
  
  # Provenance
  source_systems: list[string]
  confidence_score: float [0.0-1.0]
  first_observed: datetime
  last_observed: datetime
  
  # Security marking
  classification: enum [UNCLASSIFIED, CONFIDENTIAL, SECRET, TOP_SECRET]
  releasability: list[string] (e.g., ["NATO", "FIVE_EYES"])
  
  # Geospatial
  last_known_location: geo_point (lat, lon)
  
indexes:
  - full_name (fulltext)
  - alias (fulltext)
  - biometric_id (unique)
  - nationality
  - rank
  - unit_assignment
  - clearance_level
  - status
  - last_known_location (geospatial)
  - classification
```

#### Soldier (extends Person)
```yaml
extends: Person
additional_properties:
  service_branch: enum [ARMY, NAVY, AIR_FORCE, MARINES, SPACE_FORCE, COAST_GUARD]
  service_number: string (unique)
  deployment_history: list[reference(Mission)]
  skills: list[string]
  qualifications: list[string]
  next_of_kin: reference(Person)
```

#### ThreatActor (extends Person)
```yaml
extends: Person
additional_properties:
  actor_type: enum [STATE_SPONSORED, CRIMINAL, TERRORIST, HACKTIVIST, INSIDER, UNKNOWN]
  sophistication_level: enum [LOW, MEDIUM, HIGH, ADVANCED]
  motivation: list[enum [FINANCIAL, POLITICAL, IDEOLOGICAL, PERSONAL, STATE_ORDERS]]
  known_associates: list[reference(Person)]
  threat_level: enum [LOW, MEDIUM, HIGH, CRITICAL]
  watchlist_status: boolean
  sanctions_list: list[string]
```

### 3.3.2 VEHICLE Family

#### Base: Vehicle
```yaml
entity_type: Vehicle
identifier_urn: "urn:defoneos:vehicle:{uuid}"
properties:
  # Identity
  designation: string (required, index)
  call_sign: string (index)
  tail_number: string (unique, for aircraft)
  hull_number: string (unique, for maritime)
  license_plate: string (unique, for ground)
  
  # Classification
  vehicle_type: enum [FIXED_WING, ROTARY_WING, UAS, TANK, APC, MRAP, LOGISTICS, SURFACE_COMBATANT, SUBMARINE, AMPHIBIOUS, PATROL_CRAFT, SPACE_ASSET]
  
  # Operational
  operator: reference(Organization)
  crew: list[reference(Person)]
  current_status: enum [OPERATIONAL, MAINTENANCE, DAMAGED, DESTROYED, DECOMMISSIONED, UNKNOWN]
  current_location: geo_point
  current_heading: float [0-360]
  current_speed: float (knots/kmh)
  current_altitude: float (meters, for air/space)
  
  # Technical
  manufacturer: string
  model: string
  year_manufactured: integer
  max_speed: float
  range: float
  payload_capacity: float
  armament: list[string]
  sensors: list[reference(Equipment)]
  
  # Temporal
  valid_from: datetime (required)
  valid_to: datetime
  
  # Provenance
  source_systems: list[string]
  confidence_score: float [0.0-1.0]
  first_observed: datetime
  last_observed: datetime
  
  # Security marking
  classification: enum [UNCLASSIFIED, CONFIDENTIAL, SECRET, TOP_SECRET]
  releasability: list[string]
  
indexes:
  - designation (fulltext)
  - call_sign (fulltext)
  - tail_number (unique)
  - vehicle_type
  - current_location (geospatial)
  - current_status
  - classification
```

### 3.3.3 EVENT Family

#### Base: Event
```yaml
entity_type: Event
identifier_urn: "urn:defoneos:event:{uuid}"
properties:
  # Identity
  event_id: string (required, unique)
  event_type: enum [ENGAGEMENT, DETECTION, ALERT, MISSION, PATROL, INTERCEPTION, SIGINT_COLLECTION, CYBER_EVENT, CHANGE_OF_STATUS, IED, INDIRECT_FIRE, DIRECT_FIRE, SURRENDER]
  
  # Classification
  event_category: enum [KINETIC, CYBER, SIGINT, HUMINT, GEOSPATIAL, OSINT, COMBINED]
  severity: enum [INFO, LOW, MEDIUM, HIGH, CRITICAL]
  
  # Participants
  initiator: reference(Entity)  # polymorphic: Person, Vehicle, Organization
  target: reference(Entity)
  witnesses: list[reference(Person)]
  
  # Location & Time
  location: geo_point (required)
  location_description: string
  start_time: datetime (required)
  end_time: datetime
  timezone: string
  
  # Outcome
  outcome: enum [SUCCESS, PARTIAL_SUCCESS, FAILURE, INCONCLUSIVE, ONGOING]
  casualties_friendly: integer
  casualties_hostile: integer
  casualties_civilian: integer
  damage_assessment: string
  
  # Narrative
  summary: string (required)
  detailed_description: text
  
  # Related
  related_events: list[reference(Event)]
  parent_mission: reference(Event/Mission)
  
  # Temporal
  valid_from: datetime
  valid_to: datetime
  
  # Provenance
  source_systems: list[string]
  confidence_score: float [0.0-1.0]
  reporting_unit: reference(Organization)
  
  # Security marking
  classification: enum [UNCLASSIFIED, CONFIDENTIAL, SECRET, TOP_SECRET]
  releasability: list[string]
  
indexes:
  - event_id (unique)
  - event_type
  - severity
  - location (geospatial)
  - start_time (range)
  - classification
```

### 3.3.4 LOCATION Family

#### Base: Location
```yaml
entity_type: Location
identifier_urn: "urn:defoneos:location:{uuid}"
properties:
  name: string (required, index)
  location_type: enum [BASE, CHECKPOINT, AO, GRID_REFERENCE, ROUTE, BUILDING, GEO_REGION]
  coordinates: geo_point (required, geospatial index)
  boundary: geo_polygon (for AO, regions)
  altitude: float (meters)
  description: string
  controlling_force: reference(Organization)
  status: enum [FRIENDLY, HOSTILE, CONTESTED, NEUTRAL, UNKNOWN]
  
  # Temporal
  valid_from: datetime
  valid_to: datetime
  
  # Security marking
  classification: enum [UNCLASSIFIED, CONFIDENTIAL, SECRET, TOP_SECRET]
  releasability: list[string]
  
indexes:
  - name (fulltext)
  - location_type
  - coordinates (geospatial)
  - boundary (geospatial)
  - status
```

#### AO (Area of Operations)
```yaml
extends: Location
additional_properties:
  ao_designator: string (required, e.g., "AO NORTH")
  parent_ao: reference(Location/AO)
  sub_aos: list[reference(Location/AO)]
  assigned_unit: reference(Organization/MilitaryUnit)
  priority: enum [LOW, MEDIUM, HIGH, CRITICAL]
  threat_level: enum [LOW, MEDIUM, HIGH, CRITICAL]
  population_estimate: integer
  key_terrain: list[string]
  lines_of_communication: list[reference(Location/Route)]
```

### 3.3.5 ORGANIZATION Family

#### Base: Organization
```yaml
entity_type: Organization
identifier_urn: "urn:defoneos:organization:{uuid}"
properties:
  name: string (required, index)
  aliases: list[string]
  org_type: enum [SQUAD, PLATOON, COMPANY, BATTALION, BRIGADE, DIVISION, CORPS, NATION, NON_STATE_ACTOR, NGO, CELL, CORPORATE]
  parent_organization: reference(Organization)
  subordinate_units: list[reference(Organization)]
  commander: reference(Person)
  headquarters: reference(Location)
  area_of_responsibility: reference(Location/AO)
  personnel_count: integer
  status: enum [ACTIVE, INACTIVE, DEPLOYING, REDEPLOYING, DISSOLVED, UNKNOWN]
  
  # For threat actors
  ideology: list[string]
  funding_sources: list[string]
  operational_areas: list[reference(Location)]
  
  # Temporal
  valid_from: datetime
  valid_to: datetime
  
  # Provenance
  source_systems: list[string]
  confidence_score: float [0.0-1.0]
  
  # Security marking
  classification: enum [UNCLASSIFIED, CONFIDENTIAL, SECRET, TOP_SECRET]
  releasability: list[string]
  
indexes:
  - name (fulltext)
  - aliases (fulltext)
  - org_type
  - parent_organization
  - commander
  - classification
```

### 3.3.6 EQUIPMENT Family

#### Base: Equipment
```yaml
entity_type: Equipment
identifier_urn: "urn:defoneos:equipment:{uuid}"
properties:
  name: string (required)
  serial_number: string (unique)
  equipment_type: enum [SENSOR, WEAPON_SYSTEM, COMMUNICATIONS, IT_SYSTEM, COUNTERMEASURE]
  subtype: string
  manufacturer: string
  model: string
  owner: reference(Organization)
  deployed_location: reference(Location)
  operational_status: enum [OPERATIONAL, DEGRADED, NON_OPERATIONAL, IN_MAINTENANCE, DEPLOYING]
  capabilities: list[string]
  specifications: map[string, any]
  
  # Temporal
  valid_from: datetime
  valid_to: datetime
  
  # Security marking
  classification: enum [UNCLASSIFIED, CONFIDENTIAL, SECRET, TOP_SECRET]
  
indexes:
  - serial_number (unique)
  - equipment_type
  - owner
  - deployed_location
  - operational_status
```

### 3.3.7 SIGNAL Family

#### Base: Signal
```yaml
entity_type: Signal
identifier_urn: "urn:defoneos:signal:{uuid}"
properties:
  signal_type: enum [RF_SIGNAL, CYBER_INDICATOR, ACOUSTIC, SEISMIC, EO_IR]
  
  # For RF
  frequency_mhz: float
  bandwidth_mhz: float
  modulation: string
  signal_strength_dbm: float
  
  # For Cyber
  indicator_type: enum [IP, DOMAIN, HASH, URL, EMAIL, USERNAME, FILE_PATH, REGISTRY_KEY]
  indicator_value: string (required)
  threat_type: string
  
  # Common
  emitter_location: geo_point
  collector: reference(Organization)
  collection_time: datetime (required)
  confidence: enum [LOW, MEDIUM, HIGH]
  
  # Temporal
  valid_from: datetime
  valid_to: datetime
  
  # Provenance
  source_system: string
  confidence_score: float [0.0-1.0]
  
  # Security marking
  classification: enum [UNCLASSIFIED, CONFIDENTIAL, SECRET, TOP_SECRET]
  
indexes:
  - signal_type
  - indicator_value (for cyber)
  - frequency_mhz (for RF)
  - emitter_location (geospatial)
  - collection_time (range)
  - classification
```

### 3.3.8 DOCUMENT Family

#### Base: Document
```yaml
entity_type: Document
identifier_urn: "urn:defoneos:document:{uuid}"
properties:
  title: string (required, fulltext index)
  document_type: enum [INTELLIGENCE_REPORT, ORDER, IMAGE, VIDEO, TRANSCRIPT, BRIEF, ASSESSMENT]
  authors: list[reference(Person)]
  originating_organization: reference(Organization)
  date_created: datetime (required)
  date_published: datetime
  summary: text
  content: text (stored separately, fulltext indexed)
  keywords: list[string]
  
  # For intelligence reports
  intel_type: enum [HUMINT, SIGINT, IMINT, OSINT, GEOINT, MASINT, ALL_SOURCE]
  grading: string (e.g., "1A - Reliability/Source")
  handling_instructions: string
  
  # Media-specific
  file_format: string
  file_size_bytes: integer
  duration_seconds: float (for video/audio)
  resolution: string (for images/video)
  
  # Temporal
  valid_from: datetime
  valid_to: datetime
  
  # Provenance
  source_system: string
  confidence_score: float [0.0-1.0]
  
  # Security marking
  classification: enum [UNCLASSIFIED, CONFIDENTIAL, SECRET, TOP_SECRET]
  releasability: list[string]
  
indexes:
  - title (fulltext)
  - content (fulltext)
  - document_type
  - authors
  - date_created (range)
  - keywords (fulltext)
  - classification
```

## 3.4 Relationship Type Definitions (50+ Relationships)

### 3.4.1 Person Relationships

| Relationship | Source | Target | Cardinality | Description |
|-------------|--------|--------|-------------|-------------|
| `COMMANDED_BY` | Person | Person | N:1 | Chain of command |
| `SUBORDINATE_TO` | Person | Person | N:1 | Direct reporting |
| `MEMBER_OF` | Person | Organization | N:1 | Unit/Org membership |
| `OPERATES` | Person | Vehicle | N:N | Vehicle operator |
| `CREW_OF` | Person | Vehicle | N:N | Vehicle crew member |
| `PARTICIPATED_IN` | Person | Event | N:N | Event participation |
| `REPORTED` | Person | Document | N:N | Authored a report |
| `WITNESSED` | Person | Event | N:N | Witness to event |
| `COMMUNICATED_WITH` | Person | Person | N:N | Communication record |
| `MET_WITH` | Person | Person | N:N | Physical meeting |
| `RELATED_TO` | Person | Person | N:N | Family/kinship |
| `ASSOCIATED_WITH` | Person | Organization | N:N | Non-member association |
| `LOCATED_AT` | Person | Location | N:1 | Current position |
| `KNOWS` | Person | Person | N:N | Personal acquaintance |
| `TRAINED` | Person | Person | 1:N | Training relationship |
| `SUCCEEDED` | Person | Person | 1:1 | Succession |
| `NEXT_OF_KIN` | Person | Person | 1:N | Emergency contact |
| `HAS_ALIAS` | Person | Person | 1:N | Same person, different identity |
| `THREATENS` | Person (threat) | Person | N:N | Threat relationship |
| `FUNDS` | Person | Organization | N:N | Financial support |

### 3.4.2 Vehicle Relationships

| Relationship | Source | Target | Cardinality | Description |
|-------------|--------|--------|-------------|-------------|
| `ASSIGNED_TO` | Vehicle | Organization | N:1 | Organizational assignment |
| `OPERATED_BY` | Vehicle | Person | N:N | Primary operator |
| `BASED_AT` | Vehicle | Location | N:1 | Home base/station |
| `CURRENTLY_AT` | Vehicle | Location | N:1 | Real-time position |
| `PARTICIPATED_IN` | Vehicle | Event | N:N | Event involvement |
| `ESCORTS` | Vehicle | Vehicle | N:N | Escort/protection |
| `FOLLOWS` | Vehicle | Vehicle | N:1 | Movement following |
| `CARRIES` | Vehicle | Equipment | N:N | Equipment transport |
| `TRANSPORTS` | Vehicle | Person | N:N | Personnel transport |
| `TRACKED_BY` | Vehicle | Signal | 1:N | Signal tracking |
| `MAINTAINED_BY` | Vehicle | Organization | N:1 | Maintenance unit |
| `REPLACED` | Vehicle | Vehicle | 1:1 | Vehicle replacement |

### 3.4.3 Event Relationships

| Relationship | Source | Target | Cardinality | Description |
|-------------|--------|--------|-------------|-------------|
| `INITIATED_BY` | Event | Person | N:N | Event initiator |
| `TARGETS` | Event | Entity | N:N | Event target |
| `OCCURRED_AT` | Event | Location | N:1 | Event location |
| `PART_OF` | Event | Event | N:1 | Sub-event |
| `TRIGGERED` | Event | Event | 1:N | Causal chain |
| `DOCUMENTED_IN` | Event | Document | N:N | Event documentation |
| `RESPONSE_TO` | Event | Event | 1:1 | Response relationship |
| `INVOLVED_VEHICLE` | Event | Vehicle | N:N | Vehicle involvement |
| `INVOLVED_EQUIPMENT` | Event | Equipment | N:N | Equipment used |
| `RESULTED_IN` | Event | Event | 1:N | Outcome events |

### 3.4.4 Location Relationships

| Relationship | Source | Target | Cardinality | Description |
|-------------|--------|--------|-------------|-------------|
| `CONTAINS` | Location | Location | 1:N | Spatial containment |
| `ADJACENT_TO` | Location | Location | N:N | Adjacency |
| `CONNECTED_TO` | Location | Location | N:N | Route/link |
| `CONTROLLED_BY` | Location | Organization | N:1 | Controlling force |
| `HOSTS` | Location | Organization | 1:N | Hosted units |
| `LOCATED_IN` | Entity | Location | N:1 | Entity position |
| `OVERWATCHES` | Location | Location | N:N | Overwatch position |
| `SUPPLY_ROUTE_TO` | Location | Location | N:N | Logistic route |

### 3.4.5 Organization Relationships

| Relationship | Source | Target | Cardinality | Description |
|-------------|--------|--------|-------------|-------------|
| `PARENT_OF` | Organization | Organization | 1:N | Hierarchy |
| `ALLIED_WITH` | Organization | Organization | N:N | Alliance |
| `OPPOSES` | Organization | Organization | N:N | Opposition |
| `SUPPORTS` | Organization | Organization | N:N | Support |
| `OPERATES_IN` | Organization | Location | N:N | Area of ops |
| `COMMANDED_BY` | Organization | Person | N:1 | Commander |
| `HAS_EQUIPMENT` | Organization | Equipment | 1:N | Equipment inventory |
| `HAS_VEHICLE` | Organization | Vehicle | 1:N | Vehicle inventory |
| `FUNDED_BY` | Organization | Organization | N:N | Funding |
| `COMMUNICATES_WITH` | Organization | Organization | N:N | Communication |

### 3.4.6 Signal/Equipment/Document Relationships

| Relationship | Source | Target | Cardinality | Description |
|-------------|--------|--------|-------------|-------------|
| `EMITTED_FROM` | Signal | Location | N:1 | Signal origin |
| `DETECTED_BY` | Signal | Equipment | N:N | Detection sensor |
| `INDICATES` | Signal | Event | N:N | Signal indication |
| `MOUNTED_ON` | Equipment | Vehicle | N:1 | Vehicle-mounted |
| `OPERATED_BY` | Equipment | Person | N:N | Equipment operator |
| `REFERENCES` | Document | Entity | N:N | Entity reference |
| `CONTAINS_INTEL` | Document | Signal | N:N | Intelligence content |
| `RESPONDS_TO` | Document | Event | N:N | Event response doc |
| `CLASSIFIES` | Document | Entity | N:N | Classification doc |

### 3.4.7 Cross-Domain Relationships

| Relationship | Source | Target | Cardinality | Description |
|-------------|--------|--------|-------------|-------------|
| `THREAT_TO` | Entity | Entity | N:N | General threat |
| `PROTECTS` | Entity | Entity | N:N | Protection |
| `ENABLES` | Entity | Entity | N:N | Capability enablement |
| `DEPENDS_ON` | Entity | Entity | N:N | Dependency |
| `OBSERVED_BY` | Entity | Signal | 1:N | Observation |
| `CORRELATED_WITH` | Signal | Signal | N:N | Signal correlation |

## 3.5 Temporal Modeling Framework

Every entity and relationship in the DEFONEOS Ontology carries temporal metadata:

```
TEMPORAL_MODEL:
  bi_temporal: true
  
  # Valid time: when the fact was true in the real world
  valid_from: datetime (required)
  valid_to: datetime (null = currently valid)
  
  # Transaction time: when the system knew about the fact
  observed_at: datetime (required, auto-set)
  ingested_at: datetime (required, auto-set)
  
  # Temporal operations supported:
  operations:
    - POINT_IN_TIME: "What was true at time T?"
    - TIME_RANGE: "What was true between T1 and T2?"
    - TEMPORAL_JOIN: "What co-occurred?"
    - TEMPORAL_DIFF: "What changed between T1 and T2?"
    - VALID_NOW: "What is currently valid?"
    
  # Temporal edge properties (every relationship):
  edge_temporal:
    valid_from: datetime
    valid_to: datetime
    confidence_at_start: float
    confidence_at_end: float
    source_at_time: string
```

## 3.6 Multi-Source Fusion Framework

```
┌─────────────────────────────────────────────────────────────────┐
│              MULTI-SOURCE FUSION PIPELINE                        │
│                    (198 Sources → Unified Graph)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ SIGINT   │  │ HUMINT   │  │ IMINT    │  │ OSINT    │       │
│  │ Feed     │  │ Reports  │  │ Imagery  │  │ Social   │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       │              │              │              │              │
│  ┌────▼──────────────▼──────────────▼──────────────▼─────┐       │
│  │           EXTRACTION LAYER (LLM + Rules)              │       │
│  │  - Named Entity Recognition                            │       │
│  │  - Relation Extraction                                 │       │
│  │  - Event Detection                                     │       │
│  │  - Coreference Resolution                              │       │
│  └────┬───────────────────────────────────────────────────┘       │
│       │                                                          │
│  ┌────▼───────────────────────────────────────────────────┐       │
│  │           ENTITY RESOLUTION LAYER                       │       │
│  │  - Probabilistic matching (Fellegi-Sunter)              │       │
│  │  - Graph-based clustering                               │       │
│  │  - Cross-source deduplication                           │       │
│  └────┬───────────────────────────────────────────────────┘       │
│       │                                                          │
│  ┌────▼───────────────────────────────────────────────────┐       │
│  │           CONFIDENCE AGGREGATION LAYER                  │       │
│  │  - Source reliability weighting                         │       │
│  │  - Temporal decay functions                             │       │
│  │  - Corroboration boosting                               │       │
│  │  - Contradiction detection                              │       │
│  └────┬───────────────────────────────────────────────────┘       │
│       │                                                          │
│  ┌────▼───────────────────────────────────────────────────┐       │
│  │           KNOWLEDGE GRAPH WRITE LAYER                   │       │
│  │  - Neo4j (real-time operational)                        │       │
│  │  - Apache Jena (standards/RDF)                          │       │
│  │  - Graphiti (temporal context)                          │       │
│  └────────────────────────────────────────────────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Confidence Scoring Model

```python
# Confidence score calculation
def calculate_confidence(fact, sources):
    """
    Each fact's confidence is computed from:
    1. Source reliability (0.0 - 1.0) — calibrated per source
    2. Extraction confidence (0.0 - 1.0) — LLM/rule confidence
    3. Corroboration factor — how many sources agree
    4. Temporal recency — decay function for older facts
    5. Contradiction penalty — if sources disagree
    """
    
    base_score = 0.0
    total_weight = 0.0
    
    for source in sources:
        source_weight = source.reliability_score  # e.g., 0.9 for trusted sensor
        extraction_conf = source.extraction_confidence
        
        weighted_contribution = source_weight * extraction_conf
        base_score += weighted_contribution
        total_weight += source_weight
    
    # Normalize
    confidence = base_score / total_weight if total_weight > 0 else 0.0
    
    # Corroboration bonus
    if len(sources) > 1:
        agreement_ratio = calculate_agreement(sources)
        confidence = min(1.0, confidence * (1 + 0.1 * agreement_ratio * (len(sources) - 1)))
    
    # Temporal decay
    age_hours = (now - fact.most_recent_observation).total_seconds() / 3600
    decay_factor = math.exp(-age_hours / HALF_LIFE_HOURS)
    confidence *= decay_factor
    
    # Contradiction penalty
    contradictions = detect_contradictions(fact, sources)
    confidence *= (1 - 0.3 * contradictions)
    
    return round(confidence, 3)
```

### Source Reliability Calibration

| Source Type | Default Reliability | Notes |
|-------------|-------------------|-------|
| Direct sensor ( validated) | 0.95 | Ground-truth calibrated |
| ISR platform (confirmed) | 0.90 | Multi-sensor fusion |
| HUMINT (trusted source) | 0.85 | Source reliability grading |
| SIGINT (correlated) | 0.88 | Cross-correlated signals |
| OSINT (verified) | 0.70 | Third-party verification |
| HUMINT (new source) | 0.50 | Initial assessment |
| OSINT (unverified) | 0.30 | Requires corroboration |
| Single source, no corroboration | 0.20 | Low confidence |

## 3.7 Provenance Tracking

Every fact in the graph traces back to its origin:

```yaml
provenance:
  fact_id: uuid  # unique identifier for this fact
  source_records:  # list of source records that contributed
    - source_system: "SIGINT_COLLECTOR_01"
      source_record_id: "record_12345"
      extraction_method: "LLM_ENTITY_EXTRACTION"
      extraction_model: "mistral-7b-instruct"
      extracted_at: "2025-07-05T14:30:00Z"
      raw_text: "..."
      confidence: 0.92
    - source_system: "HUMINT_REPORT_DB"
      source_record_id: "report_67890"
      extraction_method: "RULE_BASED"
      extracted_at: "2025-07-05T15:00:00Z"
      raw_text: "..."
      confidence: 0.85
  
  merged_from:  # if entity resolution merged entities
    - entity_id: "urn:defoneos:person:abc123"
      merge_confidence: 0.95
      merge_method: "GRAPH_CLUSTERING"
  
  lineage:  # data transformation lineage
    - step: "EXTRACTION"
      timestamp: "2025-07-05T14:30:00Z"
      tool: "llm_extractor_v2"
    - step: "ENTITY_RESOLUTION"
      timestamp: "2025-07-05T14:31:00Z"
      tool: "zentity_pipeline"
    - step: "CONFIDENCE_SCORING"
      timestamp: "2025-07-05T14:31:30Z"
      tool: "confidence_calculator"
    - step: "GRAPH_INSERT"
      timestamp: "2025-07-05T14:32:00Z"
      tool: "neo4j_writer"
```

## 3.8 Access Control Model (Classification-Based)

```yaml
access_control:
  model: "ATTRIBUTE-BASED + CLASSIFICATION-LEVEL"
  
  classification_levels:
    - UNCLASSIFIED     # 1
    - CONFIDENTIAL     # 2
    - SECRET           # 3
    - TOP_SECRET       # 4
    # Custom compartments:
    - TS/SCI           # 5
    - TS/SI/TK         # 6 (Special Intelligence / Talent Keyhole)
    - TS/SI/G/TK/HCS   # 7 (full compartments)
  
  # User clearance level must be >= object classification
  read_rule: "user.clearance_level >= entity.classification_level"
  
  # Releasability check
  releasability_rule: |
    entity.releasability.is_empty OR 
    user.cleared_countries.intersects(entity.releasability)
  
  # Need-to-know (role-based)
  need_to_know: |
    user.roles.has_any(entity.required_roles) OR
    user.is_commander_of(entity.owning_unit)
  
  # Property-level masking
  property_controls:
    - property: "biometric_id"
      minimum_clearance: SECRET
      roles: [INTEL_ANALYST, BIOMETRIC_SPECIALIST]
    - property: "exact_coordinates"
      minimum_clearance: SECRET
      accuracy_reduction_for: [CONFIDENTIAL]  # round to 100m
    - property: "informant_identity"
      minimum_clearance: TOP_SECRET
      roles: [HUMINT_HANDLER, CI_SPECIALIST]
```

---

# SECTION 4: ENTITY RESOLUTION (THE HARD PROBLEM)

## 4.1 The Problem

> "Is this person in the HUMINT report the same as that person in the SIGINT intercept?"

Entity resolution (ER) is the process of determining whether records from different sources refer to the same real-world entity. In defense intelligence, this is THE critical problem:

- A single threat actor may appear under 15+ aliases across sources
- Vehicle registrations may differ across nations
- Location names have multiple transliterations
- Signal fingerprints change but equipment stays the same

## 4.2 The Entity Resolution Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│              ENTITY RESOLUTION PIPELINE                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Step 1: BLOCKING (reduce candidate pairs)                          │
│  ├── Same nationality + similar name                                 │
│  ├── Same location + same time window                                │
│  ├── Shared attributes (phone, email, biometric)                     │
│  └── LSH (Locality Sensitive Hashing) for fuzzy matching             │
│                                                                      │
│  Step 2: PAIRWISE COMPARISON (compute similarity)                   │
│  ├── String similarity: Jaro-Winkler, Levenshtein                    │
│  ├── Phonetic: Soundex, Metaphone, NYSIIS                            │
│  ├── Semantic: Embedding similarity (name vectors)                   │
│  ├── Temporal: Time overlap analysis                                 │
│  ├── Geospatial: Haversine distance                                  │
│  └── Graph: Shared neighbors, path similarity                        │
│                                                                      │
│  Step 3: CLASSIFICATION (match / no-match / possible)               │
│  ├── Rule-based: exact matches on strong identifiers                 │
│  ├── ML-based: Random Forest / XGBoost classifier                    │
│  ├── Probabilistic: Fellegi-Sunter model                             │
│  └── Threshold-based: configurable confidence cutoff                 │
│                                                                      │
│  Step 4: CLUSTERING (group matches into entities)                   │
│  ├── Connected components (transitive closure)                       │
│  ├── Markov clustering                                               │
│  └── Record: cluster → canonical entity                              │
│                                                                      │
│  Step 5: CANONICALIZATION (create master record)                    │
│  ├── Select best attributes from all records                         │
│  ├── Merge properties with confidence weighting                      │
│  └── Generate canonical URN                                          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## 4.3 The Fellegi-Sunter Probabilistic Model

The gold standard for entity resolution, mathematically equivalent to Naive Bayes:

```python
class FellegiSunterResolver:
    """
    Probabilistic record linkage using the Fellegi-Sunter framework.
    
    For each field f:
      m_f = P(field agrees | same entity)    # match weight
      u_f = P(field agrees | different entity) # non-match weight
      
    Weight for agreement:    w_f = log2(m_f / u_f)
    Weight for disagreement: w_f = log2((1 - m_f) / (1 - u_f))
    
    Total weight = sum of field weights
    Decision: Match if weight > upper_threshold
              Non-match if weight < lower_threshold
              Possible match otherwise
    """
    
    def __init__(self, field_configs):
        """
        field_configs: dict of field_name -> {m_prob, u_prob, weight}
        """
        self.field_configs = field_configs
        
    def compare_records(self, record_a, record_b):
        """Compare two records and return match weight."""
        total_weight = 0.0
        field_scores = {}
        
        for field, config in self.field_configs.items():
            val_a = record_a.get(field)
            val_b = record_b.get(field)
            
            if val_a is None or val_b is None:
                # Missing data: use neutral weight
                continue
                
            # Compute field similarity
            similarity = self._field_similarity(val_a, val_b, field)
            
            m_prob = config['m_prob']
            u_prob = config['u_prob']
            
            # Weighted by similarity
            if similarity >= config.get('match_threshold', 0.85):
                # Agree (or nearly agree)
                weight = math.log2(m_prob / u_prob) * similarity
            else:
                # Disagree
                weight = math.log2((1 - m_prob) / (1 - u_prob)) * (1 - similarity)
            
            total_weight += weight
            field_scores[field] = {
                'similarity': similarity,
                'weight': weight
            }
        
        return {
            'total_weight': total_weight,
            'field_scores': field_scores,
            'is_match': total_weight > config.get('upper_threshold', 10.0),
            'is_possible': total_weight > config.get('lower_threshold', 0.0)
        }
    
    def _field_similarity(self, val_a, val_b, field_type):
        """Compute similarity based on field type."""
        if field_type in ['name', 'alias']:
            return jaro_winkler_similarity(str(val_a), str(val_b))
        elif field_type == 'location':
            return 1.0 - (haversine_distance(val_a, val_b) / 1000)  # per km
        elif field_type == 'date':
            return temporal_similarity(val_a, val_b)
        elif field_type in ['phone', 'email', 'biometric']:
            return 1.0 if val_a == val_b else 0.0  # exact match for strong IDs
        else:
            return 1.0 if val_a == val_b else 0.0
```

## 4.4 Graph-Based Entity Resolution

After pairwise matching, use graph structure to improve resolution:

```cypher
// Neo4j: Find connected components (transitive closure)
// Records that match each other form clusters

// Step 1: Create MATCH edges from pairwise comparisons
MATCH (r1:RawRecord), (r2:RawRecord)
WHERE r1.id < r2.id
  AND r1.resolution_blocking_key = r2.resolution_blocking_key
WITH r1, r2,
     apoc.text.jaroWinklerSimilarity(r1.name, r2.name) AS name_sim,
     apoc.text.jaroWinklerSimilarity(r1.alias, r2.alias) AS alias_sim,
     point.distance(r1.location, r2.location) / 1000.0 AS dist_km
WHERE name_sim > 0.85 OR alias_sim > 0.85 OR dist_km < 1.0
MERGE (r1)-[m:MATCH_CANDIDATE]->(r2)
SET m.name_similarity = name_sim,
    m.alias_similarity = alias_sim,
    m.distance_km = dist_km,
    m.combined_score = (name_sim + alias_sim) / 2 - (dist_km * 0.01);

// Step 2: Use community detection for clustering
CALL gds.graph.exists('resolution_graph') YIELD exists
WITH exists
CALL apoc.do.when(exists,
  'CALL gds.graph.drop("resolution_graph") YIELD graphName RETURN graphName',
  'RETURN "no graph"',
  {}
) YIELD value RETURN value;

// Step 3: Create graph projection
CALL gds.graph.project(
  'resolution_graph',
  'RawRecord',
  {
    MATCH_CANDIDATE: {
      properties: 'combined_score'
    }
  }
) YIELD graphName, nodeCount, relationshipCount;

// Step 4: Run community detection (Louvain)
CALL gds.louvain.stream('resolution_graph', {
  relationshipWeightProperty: 'combined_score',
  concurrency: 4
})
YIELD nodeId, communityId
WITH gds.util.asNode(nodeId) AS record, communityId
SET record.entity_cluster_id = communityId;

// Step 5: Create canonical entities from clusters
MATCH (r:RawRecord)
WITH r.entity_cluster_id AS cluster_id, 
     collect(r) AS records,
     max(r.confidence) AS max_conf
WITH cluster_id, records, max_conf
CREATE (e:CanonicalEntity {
  urn: 'urn:defoneos:entity:' + cluster_id,
  canonical_name: [r IN records WHERE r.confidence = max_conf | r.name][0],
  all_names: apoc.coll.toSet([r IN records | r.name]),
  all_aliases: apoc.coll.toSet(REDUCE(s = [], r IN records | s + r.aliases)),
  record_count: size(records),
  resolution_confidence: max_conf,
  resolution_method: 'FELLEGI_SUNTER_GRAPH_CLUSTERING'
})
WITH e, records
UNWIND records AS r
CREATE (r)-[:RESOLVES_TO {confidence: r.confidence}]->(e);

// Step 6: Clean up
CALL gds.graph.drop('resolution_graph') YIELD graphName;
```

## 4.5 Open-Source Entity Resolution Tools

| Tool | License | Best For | Defense Suitability |
|------|---------|----------|-------------------|
| **Zingg** | Apache 2.0 | ML-based ER at scale | HIGH — learns from training data, Spark-based |
| **Senzing** | Commercial (free tier) | Real-time ER | MEDIUM — limited free tier, proprietary |
| **zentity** | Apache 2.0 | Elasticsearch-based | MEDIUM — good for text-heavy data |
| **Duke** | Apache 2.0 | Java-based ER | MEDIUM — rule-based + ML |
| **OpenER** | Various | Research-focused | LOW — not production-ready |
| **splink** | MIT | Probabilistic record linkage | HIGH — excellent Fellegi-Sunter implementation |
| **recordlinkage** | BSD | Python record linkage | HIGH — flexible, pandas-based |

### DEFONEOS Recommendation: Zingg + splink + Custom Graph Clustering

```
┌─────────────────────────────────────────────────────────────────┐
│           DEFONEOS ENTITY RESOLUTION STACK                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │    splink    │  │    Zingg     │  │  Neo4j GDS           │  │
│  │  (Python)    │  │  (Spark)     │  │  (Graph Clustering)  │  │
│  │              │  │              │  │                      │  │
│  │  - Fellegi-  │  │  - ML-based  │  │  - Connected         │  │
│  │    Sunter    │  │    matching  │  │    components        │  │
│  │  - EM algo   │  │  - Blocking  │  │  - Louvain           │  │
│  │  - Training  │  │  - Scalable  │  │    communities       │  │
│  │    data gen  │  │  - Active    │  │  - Label             │  │
│  │              │  │    learning  │  │    propagation       │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                   │                      │               │
│         └───────────────────┼──────────────────────┘               │
│                             ▼                                      │
│              ┌──────────────────────────────┐                     │
│              │   Entity Resolution Pipeline  │                     │
│              │                               │                     │
│              │  1. Block (Zingg)             │                     │
│              │  2. Compare (splink)          │                     │
│              │  3. Classify (splink EM)      │                     │
│              │  4. Cluster (Neo4j GDS)       │                     │
│              │  5. Canonicalize (custom)     │                     │
│              └──────────────────────────────┘                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

# SECTION 5: TEMPORAL KNOWLEDGE GRAPHS

## 5.1 The Problem

Defense intelligence requires answering questions like:
- "Where was this ship 3 days ago?"
- "Who met with whom last week?"
- "When did this threat actor first appear in the AO?"
- "What was the unit disposition on D-Day minus 2?"

Static knowledge graphs cannot answer these. We need **temporal knowledge graphs**.

## 5.2 Bi-Temporal Model

Every fact has TWO time dimensions:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    BI-TEMPORAL MODEL                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   VALID TIME (when the fact was true in reality)                    │
│   │                                                                  │
│   │   [valid_from] ──────────────────────────► [valid_to]           │
│   │        ▲                                              ▲          │
│   │        │                                              │          │
│   │   "Sarah works at Acme Inc."                    "Sarah works    │
│   │   (2024-01-01)                                  at Globex"      │
│   │                                                 (2025-03-01)    │
│   │                                                                  │
│   TRANSACTION TIME (when the system knew about the fact)            │
│   │                                                                  │
│   │   [observed_at] ─────────────────────────► [superseded_at]      │
│   │        ▲                                              ▲          │
│   │        │                                              │          │
│   │   System learned about                             System learned │
│   │   Sarah at Acme                                      Sarah moved │
│   │   (2024-01-15)                                       (2025-03-05)│
│   │                                                                  │
│   These CAN DIFFER — critical for intelligence!                     │
│   (e.g., retroactive discovery of past events)                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## 5.3 Temporal Property Graph Model (Neo4j)

```cypher
// Every relationship carries temporal metadata
CREATE (sarah:Person {
  urn: 'urn:defoneos:person:sarah_chen',
  name: 'Sarah Chen',
  current_employer: 'Globex Corp'  // materialized current state
})

// Historical employment facts as temporal edges
CREATE (acme:Organization {name: 'Acme Inc.'})
CREATE (globex:Organization {name: 'Globex Corp'})

CREATE (sarah)-[:EMPLOYED_AT {
  valid_from: datetime('2024-01-01T00:00:00Z'),
  valid_to: datetime('2025-03-01T00:00:00Z'),
  observed_at: datetime('2024-01-15T10:30:00Z'),
  superseded_at: datetime('2025-03-05T08:00:00Z'),
  role: 'Senior Analyst',
  confidence: 0.95,
  source: 'HUMINT_REPORT_4421'
}]->(acme)

CREATE (sarah)-[:EMPLOYED_AT {
  valid_from: datetime('2025-03-01T00:00:00Z'),
  valid_to: null,  // currently valid
  observed_at: datetime('2025-03-05T08:00:00Z'),
  superseded_at: null,
  role: 'Director of Intelligence',
  confidence: 0.98,
  source: 'OSINT_LINKEDIN'
}]->(globex)

// Point-in-time query: Where did Sarah work on Feb 15, 2025?
MATCH (p:Person {name: 'Sarah Chen'})-[r:EMPLOYED_AT]->(o:Organization)
WHERE r.valid_from <= datetime('2025-02-15T00:00:00Z')
  AND (r.valid_to IS NULL OR r.valid_to > datetime('2025-02-15T00:00:00Z'))
RETURN o.name AS employer, r.role AS role, r.confidence AS confidence;
// Result: employer = 'Acme Inc.', role = 'Senior Analyst'

// What did we know on Jan 20, 2024? (transaction-time query)
MATCH (p:Person {name: 'Sarah Chen'})-[r:EMPLOYED_AT]->(o:Organization)
WHERE r.observed_at <= datetime('2024-01-20T00:00:00Z')
  AND (r.superseded_at IS NULL OR r.superseded_at > datetime('2024-01-20T00:00:00Z'))
RETURN o.name AS known_employer, r.confidence AS confidence_at_time;
```

## 5.4 Temporal Query Patterns

```cypher
// PATTERN 1: What was the state of the graph at time T?
// (Point-in-time snapshot)
MATCH (n)-[r]->(m)
WHERE r.valid_from <= $query_time
  AND (r.valid_to IS NULL OR r.valid_to > $query_time)
RETURN n, r, m;

// PATTERN 2: What changed between T1 and T2?
// (Temporal diff)
MATCH (n)-[r]->(m)
WHERE (r.valid_from >= $t1 AND r.valid_from < $t2)  // started in window
   OR (r.valid_to >= $t1 AND r.valid_to < $t2)       // ended in window
RETURN n.name AS subject, type(r) AS relation, m.name AS object,
       r.valid_from AS started, r.valid_to AS ended,
       CASE 
         WHEN r.valid_from >= $t1 THEN 'NEW'
         WHEN r.valid_to >= $t1 THEN 'ENDED'
       END AS change_type;

// PATTERN 3: Where was this vehicle over time?
// (Trajectory query)
MATCH (v:Vehicle {designation: 'UAV-ALPHA'})-[r:LOCATED_AT]->(l:Location)
WHERE r.valid_from >= $start_time AND r.valid_from <= $end_time
RETURN r.valid_from AS timestamp, l.coordinates AS position,
       l.name AS location_name
ORDER BY r.valid_from;

// PATTERN 4: Who met with whom in the last 7 days?
// (Temporal relationship query)
MATCH (a:Person)-[r:MET_WITH]->(b:Person)
WHERE r.valid_from >= datetime() - duration('P7D')
RETURN a.name AS person_a, b.name AS person_b,
       r.valid_from AS meeting_time,
       r.location AS meeting_location,
       r.confidence AS confidence
ORDER BY r.valid_from DESC;

// PATTERN 5: Vehicle proximity analysis
// (Spatio-temporal query)
MATCH (v1:Vehicle)-[r1:LOCATED_AT]->(l1:Location)
WHERE v1.vehicle_type = 'UAS'
  AND r1.valid_from >= datetime() - duration('P1D')
WITH v1, r1, l1
MATCH (v2:Vehicle)-[r2:LOCATED_AT]->(l2:Location)
WHERE v2 <> v1
  AND abs(duration.inSeconds(r1.valid_from, r2.valid_from).seconds) < 3600
  AND point.distance(l1.coordinates, l2.coordinates) < 5000  // 5km
RETURN v1.designation AS drone, v2.designation AS contact,
       r1.valid_from AS timestamp,
       point.distance(l1.coordinates, l2.coordinates) AS distance_meters
ORDER BY r1.valid_from;

// PATTERN 6: Entity evolution timeline
// (Complete history of an entity)
MATCH (p:Person {urn: $entity_urn})
OPTIONAL MATCH (p)-[r]->(n)
WHERE r.valid_from IS NOT NULL
RETURN p.name AS entity,
       collect(DISTINCT {
         time: r.valid_from,
         event: 'STARTED_' + type(r),
         target: n.name,
         details: properties(r)
       }) + collect(DISTINCT {
         time: r.valid_to,
         event: 'ENDED_' + type(r),
         target: n.name,
         details: properties(r)
       }) AS timeline
ORDER BY timeline.time;
```

## 5.5 Graphiti Integration for AI-Native Temporal Memory

Graphiti (by Zep) provides the temporal context graph engine:

```python
from graphiti_core import Graphiti
from graphiti_core.nodes import EpisodeType

# Initialize Graphiti with Neo4j backend
graphiti = Graphiti("bolt://localhost:7687", "neo4j", "password")

async def ingest_intelligence_report(report_text, report_metadata):
    """Ingest an intelligence report as an episode."""
    await graphiti.add_episode(
        name=f"intel_report_{report_metadata['id']}",
        episode_body=report_text,
        source=EpisodeType.text,
        source_description=f"{report_metadata['source']} - {report_metadata['classification']}",
        reference_time=report_metadata['event_time'],
        group_id=report_metadata['ao_designator']
    )

async def query_temporal(query, point_in_time=None):
    """Query the temporal knowledge graph."""
    results = await graphiti.search(
        query=query,
        num_results=10,
        center_node_uuid=None,
        search_filter={
            'valid_at': point_in_time  # point-in-time query
        }
    )
    return results

# Example usage
await ingest_intelligence_report(
    "Commander Ali Rahmani was observed at the safe house in Sector 7 
     at 1400 hours yesterday. He was accompanied by two unidentified males. 
     Rahmani has been the acting leader of the Eastern Cell since March 2025.",
    {
        'id': 'HUMINT-2025-04421',
        'source': 'HUMINT_ASSET_TIGER_EYE',
        'classification': 'SECRET',
        'event_time': '2025-07-04T14:00:00Z',
        'ao_designator': 'AO_NORTH'
    }
)

# Query with temporal context
results = await query_temporal(
    "Who is the leader of the Eastern Cell?",
    point_in_time="2025-06-01T00:00:00Z"  # Query as of June 1
)
```

## 5.6 Performance: Graphiti Benchmarks

| Metric | Graphiti Performance |
|--------|---------------------|
| Retrieval latency (P95) | 300ms |
| LOCOMO accuracy | 94.7% |
| LongMemEval accuracy | 90.2% |
| Context size (LOCOMO) | 5,760 tokens |
| Context size (LongMemEval) | 4,408 tokens |

---

# SECTION 6: AI-NATIVE KNOWLEDGE GRAPH & GraphRAG

## 6.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AI-NATIVE KNOWLEDGE GRAPH ARCHITECTURE                    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              LAYER 1: INGESTION & EXTRACTION                         │   │
│  │                                                                      │   │
│  │   Raw Sources (text, PDF, images, signals, HUMINT, SIGINT, OSINT)   │   │
│  │                    │                                                  │   │
│  │                    ▼                                                  │   │
│  │   ┌────────────────────────────────┐                                 │   │
│  │   │    LLM Entity Extraction       │                                 │   │
│  │   │    (Mistral 7B local)          │                                 │   │
│  │   │                                │                                 │   │
│  │   │  • Named Entity Recognition    │                                 │   │
│  │   │  • Relation Extraction         │                                 │   │
│  │   │  • Event Detection             │                                 │   │
│  │   │  • Coreference Resolution      │                                 │   │
│  │   │  • Temporal Expression Parsing │                                 │   │
│  │   └────────────────────────────────┘                                 │   │
│  │                    │                                                  │   │
│  │                    ▼                                                  │   │
│  │   ┌────────────────────────────────┐                                 │   │
│  │   │    Structured Extracts         │                                 │   │
│  │   │    (JSON: entities + rels)     │                                 │   │
│  │   └────────────────────────────────┘                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              LAYER 2: GraphRAG INDEXING                              │   │
│  │                                                                      │   │
│  │   Microsoft GraphRAG Pipeline:                                       │   │
│  │                                                                      │   │
│  │   Text → TextUnits → Entity Extraction →                             │   │
│  │   Relationship Extraction → Hierarchical Clustering (Leiden) →       │   │
│  │   Community Summaries (bottom-up) →                                  │   │
│  │   Vector Embeddings + Graph Index                                    │   │
│  │                                                                      │   │
│  │   Output:                                                            │   │
│  │   • Entity nodes with descriptions + embeddings                      │   │
│  │   • Relationship edges with descriptions                             │   │
│  │   • Community hierarchy (Level 0 = themes, Level 1+ = topics)       │   │
│  │   • Community summaries (pre-computed)                               │   │
│  │   • Text unit chunks with embeddings                                 │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              LAYER 3: QUERY & REASONING                              │   │
│  │                                                                      │   │
│  │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │   │
│  │   │ Local Search │  │ Global Search│  │ DRIFT Search │             │   │
│  │   │              │  │              │  │              │             │   │
│  │   │ For specific │  │ For holistic │  │ Enhanced     │             │   │
│  │   │ entity       │  │ questions    │  │ local with   │             │   │
│  │   │ questions    │  │ about entire │  │ community    │             │   │
│  │   │              │  │ dataset      │  │ context      │             │   │
│  │   │ Entity →     │  │ Community    │  │ Local +      │             │   │
│  │   │ Neighbors →  │  │ summaries →  │  │ community    │             │   │
│  │   │ Context      │  │ Map-Reduce   │  │ insights     │             │   │
│  │   └──────────────┘  └──────────────┘  └──────────────┘             │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              LAYER 4: LLM RESPONSE GENERATION                        │   │
│  │                                                                      │   │
│  │   Retrieved graph context + Original query → LLM → Natural language  │   │
│  │   answer with citations to source entities/documents                 │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 6.2 GraphRAG Query Modes Comparison

| Mode | Best For | How It Works | Latency |
|------|----------|--------------|---------|
| **Local Search** | Specific entity questions ("What missions did UAV-7 fly?") | Embed query → find nearest entities → graph traversal to neighbors → build context | Low |
| **Global Search** | Holistic questions ("What are the main threat patterns?") | Query all community summaries → map step (parallel) → reduce step (synthesize) | High |
| **DRIFT Search** | Complex questions needing both specificity and context | Local search + community context expansion → refined query → combined retrieval | Medium |
| **Basic Search** | Simple factual lookup | Standard vector similarity on text chunks | Lowest |

## 6.3 Defense-Specific GraphRAG: Adapting for Intelligence

```python
# DEFONEOS GraphRAG for Defense Intelligence

class DefenseGraphRAG:
    """
    GraphRAG system tailored for defense intelligence.
    Extends Microsoft GraphRAG with defense-specific entity types,
    classification-aware retrieval, and temporal reasoning.
    """
    
    def __init__(self, neo4j_driver, llm_client, embedding_model):
        self.neo4j = neo4j_driver
        self.llm = llm_client
        self.embeddings = embedding_model
        
        # Defense-specific entity extraction prompt
        self.entity_prompt = """You are a military intelligence analyst extracting 
        entities from intelligence reports. Extract the following entity types:
        
        PERSON: Name, rank, role, nationality, aliases
        ORGANIZATION: Unit name, type, hierarchy, aliases
        VEHICLE: Designation, type, status, location
        LOCATION: Name, coordinates, type (base, AO, checkpoint)
        EVENT: Type, time, participants, outcome
        EQUIPMENT: Type, serial number, capabilities
        SIGNAL: Type, frequency, indicator value
        
        Also extract temporal expressions and normalize to ISO 8601.
        Also extract classification level from the text context.
        
        Format as JSON:
        {
          "entities": [...],
          "relationships": [...],
          "events": [...],
          "classification": "SECRET",
          "temporal_references": [...]
        }
        """
    
    async def ingest_document(self, doc_text, doc_metadata):
        """Ingest a defense document into the GraphRAG index."""
        
        # Step 1: Extract entities using LLM
        extraction = await self.llm.extract_entities(
            doc_text, 
            system_prompt=self.entity_prompt
        )
        
        # Step 2: Enrich with geospatial data
        for loc in extraction.get('locations', []):
            loc['coordinates'] = await self._geocode_location(loc['name'])
        
        # Step 3: Apply classification from document
        classification = doc_metadata.get('classification', 'UNCLASSIFIED')
        
        # Step 4: Insert into graph
        await self._insert_to_graph(extraction, doc_metadata, classification)
        
        # Step 5: Update vector index
        await self._update_embeddings(extraction, doc_text)
        
        # Step 6: Recompute community summaries if needed
        await self._update_communities()
    
    async def query(self, query_text, user_clearance, mode='auto'):
        """
        Query the defense knowledge graph.
        
        Security: filters all results by user clearance level.
        """
        # Determine query mode
        if mode == 'auto':
            mode = self._select_query_mode(query_text)
        
        # Build query embedding
        query_embedding = await self.embeddings.embed_query(query_text)
        
        # Retrieve context (with security filtering)
        if mode == 'local':
            context = await self._local_search(query_embedding, user_clearance)
        elif mode == 'global':
            context = await self._global_search(query_text, user_clearance)
        elif mode == 'drift':
            context = await self._drift_search(query_embedding, query_text, user_clearance)
        
        # Generate answer with citations
        answer = await self.llm.generate(
            query=query_text,
            context=context,
            system_prompt=self._answer_prompt(user_clearance)
        )
        
        return {
            'answer': answer.text,
            'citations': answer.citations,
            'sources': context.sources,
            'confidence': context.overall_confidence,
            'mode_used': mode
        }
    
    async def temporal_query(self, query_text, point_in_time, user_clearance):
        """Query the graph as it existed at a specific point in time."""
        
        # Retrieve temporal snapshot
        snapshot = await self._get_temporal_snapshot(point_in_time, user_clearance)
        
        # Run GraphRAG on the snapshot
        context = await self._local_search_on_snapshot(
            query_text, snapshot, user_clearance
        )
        
        answer = await self.llm.generate(
            query=query_text,
            context=context,
            system_prompt="Answer based on the state of knowledge at the specified time."
        )
        
        return {
            'answer': answer.text,
            'point_in_time': point_in_time,
            'knowledge_scope': snapshot.description
        }
    
    def _select_query_mode(self, query_text):
        """Automatically select the best query mode."""
        # Check for entity-specific keywords
        entity_indicators = ['who', 'what', 'where', 'when', 'which']
        holistic_indicators = ['patterns', 'trends', 'summary', 'overview', 'main themes']
        
        if any(w in query_text.lower() for w in holistic_indicators):
            return 'global'
        elif any(w in query_text.lower() for w in entity_indicators):
            return 'local'
        else:
            return 'drift'
```

## 6.4 LLM Prompts for Defense Entity Extraction

```python
# Entity extraction prompt optimized for defense intelligence
DEFENSE_ENTITY_EXTRACTION_PROMPT = """You are an expert military intelligence 
analyst performing entity extraction from intelligence reports. Your task is to 
identify and extract all relevant entities, relationships, and events.

ENTITY TYPES TO EXTRACT:
1. PERSON: Names of individuals (soldiers, civilians, leaders, threat actors)
   - Include rank if mentioned
   - Include nationality if mentioned
   - Include role/position if mentioned
   - Record all aliases

2. ORGANIZATION: Military units, government agencies, non-state actors, companies
   - Include unit designator (e.g., "3rd Battalion, 7th Infantry")
   - Include hierarchy if mentioned
   - Include aliases

3. VEHICLE: Aircraft, ground vehicles, maritime vessels, UAS
   - Include designation/call sign/tail number
   - Include type/model
   - Include current status

4. LOCATION: Bases, checkpoints, AOs, grid references, buildings
   - Include coordinates if provided
   - Include MGRS grid if provided
   - Include type classification

5. EVENT: Engagements, detections, missions, patrols, interceptions
   - Include event type
   - Include timestamp (normalize to ISO 8601 UTC)
   - Include participants
   - Include outcome

6. EQUIPMENT: Sensors, weapons, communications gear, IT systems
   - Include type and model
   - Include serial number if provided

7. SIGNAL: RF signals, cyber indicators, acoustic signatures
   - Include frequency/indicator value
   - Include signal type
   - Include collection time

RELATIONSHIPS TO EXTRACT:
- COMMANDED_BY / SUBORDINATE_TO (person-person, org-org)
- MEMBER_OF (person-org)
- OPERATES (person-vehicle)
- PARTICIPATED_IN (person-event, vehicle-event)
- LOCATED_AT (entity-location)
- INITIATED / TARGETED (event-entity)
- PART_OF (event-event)
- COMMUNICATED_WITH (person-person)
- MET_WITH (person-person)
- ESCORTS / FOLLOWS (vehicle-vehicle)

TEMPORAL EXPRESSIONS:
- Normalize all temporal references to ISO 8601 format
- Distinguish between event time and report time
- Record reference time base if relative (e.g., "yesterday at 1400")

OUTPUT FORMAT:
Respond ONLY with valid JSON in this exact structure:
{
  "entities": [
    {
      "id": "e1",
      "type": "PERSON",
      "name": "...",
      "properties": {...},
      "classification": "UNCLASSIFIED"
    }
  ],
  "relationships": [
    {
      "source": "e1",
      "target": "e2",
      "type": "COMMANDED_BY",
      "properties": {...},
      "temporal": {"valid_from": "...", "valid_to": "..."}
    }
  ],
  "events": [
    {
      "id": "ev1",
      "type": "ENGAGEMENT",
      "participants": ["e1", "e2"],
      "timestamp": "2025-07-05T14:00:00Z",
      "location": {...},
      "outcome": "..."
    }
  ],
  "classification": "SECRET",
  "extraction_confidence": 0.92
}"""
```

---

# SECTION 7: THE $0 BUILD PLAN

## 7.1 Complete Technology Stack (All $0)

| Component | Technology | License | Role |
|-----------|-----------|---------|------|
| Graph Database (Primary) | Neo4j Community 5.x | GPL | Operational graph storage |
| Graph Algorithms | Neo4j GDS Community | GPL | Path finding, centrality, community detection |
| Graph Procedures | APOC | Apache 2.0 | Utility functions, data import/export |
| Standards Graph | Apache Jena 5.x | Apache 2.0 | RDF/OWL/SPARQL compliance |
| SPARQL Endpoint | Apache Fuseki | Apache 2.0 | SPARQL query server |
| Temporal Graph | Graphiti (Zep) | Apache 2.0 | Temporal context graphs |
| Entity Resolution | Zingg + splink | Apache 2.0 / MIT | ML entity resolution |
| GraphRAG | Microsoft GraphRAG | MIT | LLM-augmented graph retrieval |
| LLM (Local) | Ollama + Mistral 7B | Apache 2.0 | Local LLM inference |
| LLM (Local Alt) | Ollama + Llama 3.1 8B | Llama 3.1 | Alternative local model |
| Python Neo4j | py2neo | Apache 2.0 | Python Neo4j driver |
| Python RDF | rdflib | BSD | Python RDF library |
| Vector Search | Neo4j Vector Index | Built-in | Semantic similarity search |
| API Framework | FastAPI | MIT | REST API layer |
| Message Queue | Apache Kafka | Apache 2.0 | Streaming ingestion |
| Containerization | Docker + Docker Compose | Apache 2.0 | Deployment |
| Monitoring | Prometheus + Grafana | Apache 2.0 | Metrics and dashboards |

## 7.2 Hardware Requirements

| Phase | Hardware | Cost | Handles |
|-------|----------|------|---------|
| **Development** | Single machine: 16 CPU, 64GB RAM, 1TB SSD | $0 (existing) | 1M entities |
| **Testing** | Single machine: 32 CPU, 128GB RAM, 2TB NVMe | $0 (existing) | 10M entities |
| **Production** | 3-node cluster: 64 CPU, 256GB RAM, 4TB NVMe each | $0 (sovereign infrastructure) | 100M+ entities |

## 7.3 Week-by-Week Build Timeline

### WEEK 1: Foundation ("Ontology Boot")

| Day | Task | Deliverable |
|-----|------|-------------|
| **Mon** | Install Neo4j Community + APOC + GDS | Running Neo4j instance |
| **Mon** | Install Apache Jena + Fuseki | Running Fuseki SPARQL endpoint |
| **Tue** | Define core ontology schema | YAML schema files for all entity types |
| **Tue** | Create Cypher schema definitions | Neo4j constraints + indexes |
| **Wed** | Implement entity CRUD API | FastAPI endpoints for all entity types |
| **Wed** | Implement relationship API | Link creation + traversal endpoints |
| **Thu** | Build ingestion pipeline | Kafka → Neo4j streaming pipeline |
| **Thu** | Add classification/access control | Security middleware |
| **Fri** | Build basic query API | Cypher query builder + REST endpoints |
| **Fri** | Write tests + documentation | Test suite, API docs |
| **Weekend** | Deploy to Docker Compose | Fully containerized stack |

### WEEK 2: Intelligence ("AI Integration")

| Day | Task | Deliverable |
|-----|------|-------------|
| **Mon** | Set up Ollama + Mistral 7B | Local LLM inference server |
| **Mon** | Build entity extraction pipeline | LLM → structured entities |
| **Tue** | Integrate Graphiti for temporal graphs | Temporal context storage |
| **Tue** | Build temporal query engine | Point-in-time queries |
| **Wed** | Set up Microsoft GraphRAG | GraphRAG indexing pipeline |
| **Wed** | Build GraphRAG query interface | Local/Global/DRIFT search |
| **Thu** | Integrate Zingg for entity resolution | Resolution pipeline |
| **Thu** | Build confidence scoring | Multi-source confidence |
| **Fri** | Build provenance tracking | Full data lineage |
| **Fri** | Performance optimization | Query tuning, indexing |

### WEEK 3: Scale ("Enterprise Hardening")

| Task | Deliverable |
|------|-------------|
| Neo4j clustering ( causal cluster) | Multi-node graph deployment |
| Kafka streaming at scale | 10K events/sec ingestion |
| Advanced security (property-level ACLs) | Fine-grained access control |
| Backup and disaster recovery | Automated backup procedures |
| Monitoring and alerting | Prometheus + Grafana dashboards |
| Load testing | Performance benchmarks |

### WEEK 4: Integration ("Hive Connect")

| Task | Deliverable |
|------|-------------|
| SOV3 integration API | MCP server for ontology queries |
| 33 Hive data connectors | Ingestion from all Hive sources |
| Cesium geospatial integration | 3D map visualization |
| UE5 visualization API | 3D graph visualization |
| Mobile field client | React Native field data entry |
| Final testing + documentation | Production-ready system |

## 7.4 Cost Comparison

| Item | Palantir Foundry | DEFONEOS |
|------|-----------------|-----------|
| **Platform License** | ~$4.1M/year/customer | $0 (open-source) |
| **Ontology Engine** | Included (proprietary) | $0 (Neo4j + custom) |
| **Graph Database** | Included (OSv2) | $0 (Neo4j Community) |
| **Entity Resolution** | Included (proprietary) | $0 (Zingg + splink) |
| **AI/LLM Integration** | AIP (included) | $0 (Mistral 7B local) |
| **Temporal Graph** | Not available | $0 (Graphiti) |
| **GraphRAG** | Not available | $0 (Microsoft GraphRAG) |
| **SPARQL/Standards** | Not available | $0 (Apache Jena) |
| **Infrastructure** | Cloud-hosted (additional) | $0 (sovereign hardware) |
| **Total Year 1** | **$4,100,000+** | **$0** |
| **Total Year 3** | **$12,300,000+** | **$0** |
| **Vendor Lock-in** | Complete | None (fully open-source) |
| **Data Sovereignty** | US-controlled | Full sovereign control |
| **Customizability** | Limited to Palantir's roadmap | Unlimited |

---

# SECTION 8: INTEGRATION WITH SOV3 AND 33 HIVES

## 8.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DEFONEOS ECOSYSTEM                                    │
│                    Ontology as the Central Nervous System                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     DEFONEOS ONTOLOGY                               │   │
│  │              (Neo4j + Jena + Graphiti + GraphRAG)                   │   │
│  │                                                                      │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │   │
│  │  │ Entities │  │ Relations│  │ Temporal │  │  AI/LLM  │           │   │
│  │  │ (50+     │  │ (50+     │  │ Context  │  │  GraphRAG│           │   │
│  │  │  types)  │  │  types)  │  │ Graph    │  │  Engine  │           │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         ▲            ▲            ▲            ▲            ▲              │
│         │            │            │            │            │              │
│  ┌──────┴────┐  ┌───┴────┐  ┌────┴────┐  ┌───┴────┐  ┌────┴────┐        │
│  │  HIVE 01  │  │ HIVE 02│  │ HIVE 03│  │  ...   │  │ HIVE 33│        │
│  │ (SIGINT)  │  │ (HUMINT)│  │ (IMINT)│  │        │  │(CYBER) │        │
│  │           │  │        │  │        │  │        │  │        │        │
│  │ Contributes│  │Contributes│  │Contributes│  │        │  │Contributes│   │
  │  │ RF Signals│  │Persons, │  │Images, │  │        │  │Indicators│       │
│  │  Locations │  │Events  │  │Videos  │  │        │  │Malware │        │
│  └───────────┘  └────────┘  └────────┘  └────────┘  └────────┘        │
│                                                                              │
│         │                                                                  │
│         ▼                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     SOV3 REASONING ENGINE                            │   │
│  │                                                                      │   │
│  │  • Queries the ontology for situational awareness                    │   │
│  │  • Reasons over entity relationships                                 │   │
│  │  • Generates threat assessments                                      │   │
│  │  • Recommends courses of action                                      │   │
│  │  • Predicts entity behavior                                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│         │                                                                  │
│         ▼                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                   MCP SERVERS (33 Interfaces)                        │   │
│  │                                                                      │   │
│  │  Each Hive exposes an MCP server that:                               │   │
│  │  • Queries the ontology for relevant context                         │   │
│  │  • Contributes new entities and relationships                        │   │
│  │  • Subscribes to relevant ontology changes                           │   │
│  │  • Executes actions (when authorized)                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│         │                                                                  │
│         ▼                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                   VISUALIZATION LAYER                                │   │
│  │                                                                      │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │   │
│  │  │  Cesium  │  │   UE5    │  │ Grafana  │  │  Web UI  │           │   │
│  │  │ 3D Maps  │  │ 3D Graph │  │Dashboards│  │  React   │           │   │
│  │  │          │  │  Render  │  │          │  │          │           │   │
│  │  │ Geospatial│  │ Immersive│  │ Metrics  │  │ Analyst  │           │   │
│  │  │ entities  │  │ graph    │  │ & alerts │  │ console  │           │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 8.2 Hive-to-Ontology Data Flow

Each of the 33 Hives contributes specific entity types to the shared ontology:

| Hive # | Name | Primary Contribution | Entity Types | Update Frequency |
|--------|------|---------------------|-------------|-----------------|
| 01 | SIGINT_CORE | RF signal intercepts | Signal, Location | Real-time |
| 02 | HUMINT_NET | Human intelligence | Person, Organization, Event | Hourly |
| 03 | IMINT_VISION | Imagery intelligence | Location, Vehicle, Event | Near real-time |
| 04 | OSINT_SCOUT | Open-source intel | Person, Organization, Document | 15 min |
| 05 | CYBER_SHIELD | Cyber defense | Signal (cyber), Event (cyber) | Real-time |
| 06 | GEOINT_MAP | Geospatial intel | Location, Terrain, Route | Daily |
| 07 | MASINT_SENS | Measurement & signature | Signal, Equipment | Real-time |
| 08 | ALLSOURCE_FUSE | Fusion analysis | Event, Document | Hourly |
| 09 | PREDICT_AI | Predictive analytics | Event (forecast) | Daily |
| 10 | COUNTER_INTEL | Counter-intelligence | Person (threat), Event | Hourly |
| 11-20 | [Reserved] | Additional INT disciplines | Various | Various |
| 21-30 | [Reserved] | Specialized capabilities | Various | Various |
| 31 | DRONE_FLEET | UAS operations | Vehicle (UAS), Event | Real-time |
| 32 | SATELLITE_EYE | Space-based ISR | Vehicle (space), Location | Hourly |
| 33 | COMM_RELAY | Communications | Signal, Equipment | Real-time |

## 8.3 MCP Server Interface for Ontology Access

Each Hive communicates with the Ontology via an MCP (Model Context Protocol) server:

```python
# DEFONEOS Ontology MCP Server
# Provides standardized access to the knowledge graph for all Hives

from mcp.server import Server
from mcp.types import Tool, TextContent

ontology_mcp = Server("defoneos-ontology")

@ontology_mcp.tool()
async def query_entities(
    entity_type: str,
    filters: dict = None,
    limit: int = 100,
    user_clearance: str = "UNCLASSIFIED"
) -> list:
    """
    Query entities from the ontology with security filtering.
    
    Available entity types:
    - Person, Vehicle, Event, Location, Organization
    - Equipment, Signal, Document, Facility, Environmental
    """
    # Security check
    if not check_clearance(user_clearance, entity_type):
        return {"error": "Insufficient clearance", "required": get_required_clearance(entity_type)}
    
    # Build Cypher query
    query = build_entity_query(entity_type, filters, user_clearance)
    
    # Execute with read replica
    results = await neo4j_session.run(query, limit=limit)
    
    return [serialize_entity(record) for record in results]

@ontology_mcp.tool()
async def traverse_graph(
    start_entity_urn: str,
    relationship_types: list = None,
    depth: int = 2,
    user_clearance: str = "UNCLASSIFIED"
) -> dict:
    """
    Traverse the graph from a starting entity.
    
    Returns the subgraph reachable from the start entity within the given depth,
    filtered by relationship types and security clearance.
    """
    query = f"""
    MATCH path = (start {{urn: $urn}})-[r{format_rel_types(relationship_types)}*1..{depth}]-(connected)
    WHERE ALL(n IN nodes(path) WHERE n.classification <= $clearance)
    RETURN path
    LIMIT 1000
    """
    
    results = await neo4j_session.run(query, 
        urn=start_entity_urn, 
        clearance=user_clearance
    )
    
    return serialize_subgraph(results)

@ontology_mcp.tool()
async def temporal_query(
    query_text: str,
    point_in_time: str,
    user_clearance: str = "UNCLASSIFIED"
) -> dict:
    """
    Query the ontology as it existed at a specific point in time.
    """
    return await graphiti_rag.query(
        query_text=query_text,
        point_in_time=point_in_time,
        user_clearance=user_clearance
    )

@ontology_mcp.tool()
async def ingest_entities(
    hive_id: str,
    entities: list,
    provenance: dict,
    user_clearance: str = "UNCLASSIFIED"
) -> dict:
    """
    Ingest new entities into the ontology from a Hive.
    
    All ingested entities are tagged with:
    - Source Hive ID
    - Ingestion timestamp
    - Confidence scores
    - Provenance chain
    """
    # Validate and sanitize
    validated = validate_entities(entities, user_clearance)
    
    # Apply entity resolution
    resolved = await entity_resolver.resolve(validated)
    
    # Insert with provenance
    results = await ontology_writer.insert(resolved, provenance)
    
    return {
        "inserted": results.inserted_count,
        "merged": results.merged_count,
        "new_entities": results.new_entity_urns
    }

@ontology_mcp.tool()
async def subscribe_to_changes(
    hive_id: str,
    entity_types: list,
    area_of_interest: dict = None,
    callback_url: str = None
) -> str:
    """
    Subscribe to ontology changes relevant to a Hive.
    
    Returns a subscription ID. Changes are pushed to the callback URL
    or can be polled via get_changes().
    """
    subscription = await change_publisher.subscribe(
        subscriber=hive_id,
        entity_types=entity_types,
        geo_filter=area_of_interest,
        callback=callback_url
    )
    return subscription.id
```

## 8.4 Cesium Geospatial Integration

```javascript
// Cesium.js integration for geospatial entity visualization
class OntologyCesiumLayer {
    constructor(viewer, ontologyApi) {
        this.viewer = viewer;
        this.api = ontologyApi;
        this.entityCollection = new Cesium.EntityCollection();
        this.primitiveLayers = {};
    }

    async loadEntitiesInView(viewport, classification) {
        // Query ontology for entities in current viewport
        const entities = await this.api.query_entities({
            entity_types: ['Person', 'Vehicle', 'Location', 'Event', 'Equipment'],
            geo_bbox: viewport.getBoundingBox(),
            classification: classification,
            temporal: 'current'
        });

        for (const entity of entities) {
            this.renderEntity(entity);
        }
    }

    renderEntity(entity) {
        const coords = entity.coordinates;
        const color = this.getClassificationColor(entity.classification);
        
        switch (entity.type) {
            case 'Vehicle':
                this.viewer.entities.add({
                    position: Cesium.Cartesian3.fromDegrees(coords.lon, coords.lat, coords.alt || 0),
                    model: {
                        uri: `/models/${entity.vehicle_type.toLowerCase()}.gltf`,
                        scale: 10.0
                    },
                    label: {
                        text: entity.designation,
                        font: '14px sans-serif',
                        fillColor: color,
                        pixelOffset: new Cesium.Cartesian2(0, -40)
                    },
                    properties: entity  // Store full entity data
                });
                break;
                
            case 'Person':
                this.viewer.entities.add({
                    position: Cesium.Cartesian3.fromDegrees(coords.lon, coords.lat, 2),
                    billboard: {
                        image: this.getPersonIcon(entity.person_type),
                        scale: 0.5
                    },
                    label: {
                        text: `${entity.rank || ''} ${entity.name}`,
                        font: '12px sans-serif',
                        fillColor: color
                    }
                });
                break;
                
            case 'Event':
                this.viewer.entities.add({
                    position: Cesium.Cartesian3.fromDegrees(coords.lon, coords.lat, 5),
                    ellipse: {
                        semiMinorAxis: 100,
                        semiMajorAxis: 100,
                        material: Cesium.Color.RED.withAlpha(0.3),
                        outline: true,
                        outlineColor: Cesium.Color.RED
                    },
                    label: {
                        text: `${entity.event_type}: ${entity.summary.substring(0, 30)}`,
                        font: '12px sans-serif'
                    }
                });
                break;
        }
    }

    async animateVehicleTrajectory(vehicleUrn, startTime, endTime) {
        // Query temporal positions
        const positions = await this.api.temporal_query({
            query: `LOCATED_AT history for ${vehicleUrn}`,
            start_time: startTime,
            end_time: endTime
        });

        const property = new Cesium.SampledPositionProperty();
        
        for (const pos of positions) {
            property.addSample(
                Cesium.JulianDate.fromIso8601(pos.timestamp),
                Cesium.Cartesian3.fromDegrees(pos.lon, pos.lat, pos.alt || 0)
            );
        }

        this.viewer.entities.add({
            position: property,
            path: { show: true },
            point: { pixelSize: 10, color: Cesium.Color.BLUE }
        });
    }
}
```

## 8.5 UE5 3D Graph Visualization

```cpp
// Unreal Engine 5 C++ integration for 3D knowledge graph visualization
// This runs as a UE5 plugin that connects to the Ontology API

UCLASS()
class DEFONEOSVIS_API AOntologyGraphActor : public AActor
{
    GENERATED_BODY()

public:
    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString OntologyApiEndpoint = TEXT("http://localhost:8000/api/v1");

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString UserClearance = TEXT("SECRET");

    UFUNCTION(BlueprintCallable)
    void LoadSubgraph(const FString& CenterEntityUrn, int32 Depth = 2)
    {
        // Query the ontology for the subgraph
        FHttpRequestRef Request = FHttpModule::Get().CreateRequest();
        Request->SetURL(FString::Printf(
            TEXT("%s/traverse?urn=%s&depth=%d&clearance=%s"),
            *OntologyApiEndpoint, *CenterEntityUrn, Depth, *UserClearance
        ));
        Request->SetVerb("GET");
        Request->OnProcessRequestComplete().BindUObject(this, &AOntologyGraphActor::OnSubgraphLoaded);
        Request->ProcessRequest();
    }

    UFUNCTION(BlueprintCallable)
    void VisualizeEntity(const FEntityData& Entity, const FVector& Position)
    {
        // Spawn appropriate 3D mesh based on entity type
        UStaticMesh* Mesh = GetMeshForEntityType(Entity.Type);
        
        AStaticMeshActor* MeshActor = GetWorld()->SpawnActor<AStaticMeshActor>(
            AStaticMeshActor::StaticClass(),
            Position,
            FRotator::ZeroRotator
        );
        
        MeshActor->GetStaticMeshComponent()->SetStaticMesh(Mesh);
        MeshActor->GetStaticMeshComponent()->SetMaterial(0, GetMaterialForClassification(Entity.Classification));
        
        // Add floating label
        UWidgetComponent* Label = NewObject<UWidgetComponent>(MeshActor);
        Label->SetWidgetClass(LabelWidgetClass);
        Label->SetDrawSize(FVector2D(200, 50));
        Label->SetRelativeLocation(FVector(0, 0, 100));
        
        // Set label text
        if (UUserWidget* Widget = Label->GetUserWidgetObject())
        {
            if (UTextBlock* TextBlock = Cast<UTextBlock>(Widget->GetWidgetFromName("EntityLabel")))
            {
                TextBlock->SetText(FText::FromString(Entity.DisplayName));
            }
        }
    }

    UFUNCTION(BlueprintCallable)
    void VisualizeRelationship(const FRelationshipData& Rel, const FVector& FromPos, const FVector& ToPos)
    {
        // Draw a spline between two entities
        USplineComponent* Spline = NewObject<USplineComponent>(this);
        Spline->SetWorldLocationAtSplinePoint(0, FromPos);
        Spline->SetWorldLocationAtSplinePoint(1, ToPos);
        
        // Style based on relationship type
        FLinearColor Color = GetColorForRelationshipType(Rel.Type);
        
        // Add animated particles along the relationship
        UNiagaraSystem* ParticleSystem = GetParticleSystemForRelationship(Rel.Type);
        UNiagaraComponent* Particles = UNiagaraFunctionLibrary::SpawnSystemAtLocation(
            GetWorld(), ParticleSystem, (FromPos + ToPos) / 2
        );
        
        // Store reference for interaction
        RelationshipVisualizations.Add(Rel.Urn, {Spline, Particles});
    }

    UFUNCTION(BlueprintCallable)
    void FocusOnEntity(const FString& EntityUrn)
    {
        // Fly camera to entity
        if (FEntityPosition* Pos = EntityPositions.Find(EntityUrn))
        {
            APlayerController* PC = UGameplayStatics::GetPlayerController(GetWorld(), 0);
            
            // Smooth camera transition
            FLatentActionInfo LatentInfo;
            UKismetSystemLibrary::MoveComponentTo(
                PC->GetPawn()->GetRootComponent(),
                Pos->Location + FVector(-500, -500, 500),  // Camera offset
                (Pos->Location - (Pos->Location + FVector(-500, -500, 500))).Rotation(),
                false, false, 1.0f, false,
                EMoveComponentAction::Move, LatentInfo
            );
        }
        
        // Highlight the entity
        HighlightEntity(EntityUrn);
        
        // Show detail panel
        OnEntitySelected.Broadcast(EntityUrn);
    }
};
```

---

# SECTION 9: COMPLETE CODE ARCHITECTURE

## 9.1 Neo4j Schema Definition (Complete)

```cypher
// ═══════════════════════════════════════════════════════════════
// DEFONEOS ONTOLOGY — NEO4J SCHEMA DEFINITION
// ═══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────
// 1. CONSTRAINTS (Uniqueness + Existence)
// ─────────────────────────────────────────────────────────────

// Entity URN uniqueness (all entities)
CREATE CONSTRAINT entity_urn_unique IF NOT EXISTS
FOR (e:Entity) REQUIRE e.urn IS UNIQUE;

// Person constraints
CREATE CONSTRAINT person_urn_unique IF NOT EXISTS
FOR (p:Person) REQUIRE p.urn IS UNIQUE;

CREATE CONSTRAINT person_name_exists IF NOT EXISTS
FOR (p:Person) REQUIRE p.name IS NOT NULL;

// Vehicle constraints
CREATE CONSTRAINT vehicle_urn_unique IF NOT EXISTS
FOR (v:Vehicle) REQUIRE v.urn IS UNIQUE;

// Event constraints
CREATE CONSTRAINT event_urn_unique IF NOT EXISTS
FOR (ev:Event) REQUIRE ev.urn IS UNIQUE;

// Location constraints
CREATE CONSTRAINT location_urn_unique IF NOT EXISTS
FOR (l:Location) REQUIRE l.urn IS UNIQUE;

// Organization constraints
CREATE CONSTRAINT org_urn_unique IF NOT EXISTS
FOR (o:Organization) REQUIRE o.urn IS UNIQUE;

// Equipment constraints
CREATE CONSTRAINT equip_urn_unique IF NOT EXISTS
FOR (eq:Equipment) REQUIRE eq.urn IS UNIQUE;

// Signal constraints
CREATE CONSTRAINT signal_urn_unique IF NOT EXISTS
FOR (s:Signal) REQUIRE s.urn IS UNIQUE;

// Document constraints
CREATE CONSTRAINT doc_urn_unique IF NOT EXISTS
FOR (d:Document) REQUIRE d.urn IS UNIQUE;

// ─────────────────────────────────────────────────────────────
// 2. INDEXES (Performance)
// ─────────────────────────────────────────────────────────────

// Full-text indexes
CREATE FULLTEXT INDEX person_name_ft IF NOT EXISTS
FOR (p:Person) ON EACH [p.name, p.alias];

CREATE FULLTEXT INDEX vehicle_designation_ft IF NOT EXISTS
FOR (v:Vehicle) ON EACH [v.designation, v.call_sign];

CREATE FULLTEXT INDEX org_name_ft IF NOT EXISTS
FOR (o:Organization) ON EACH [o.name, o.aliases];

CREATE FULLTEXT INDEX doc_content_ft IF NOT EXISTS
FOR (d:Document) ON EACH [d.title, d.summary, d.content, d.keywords];

CREATE FULLTEXT INDEX event_summary_ft IF NOT EXISTS
FOR (ev:Event) ON EACH [ev.summary, ev.detailed_description];

// Range indexes (for temporal + numeric queries)
CREATE INDEX person_clearance_idx IF NOT EXISTS
FOR (p:Person) ON (p.clearance_level);

CREATE INDEX person_status_idx IF NOT EXISTS
FOR (p:Person) ON (p.status);

CREATE INDEX person_rank_idx IF NOT EXISTS
FOR (p:Person) ON (p.rank);

CREATE INDEX event_type_idx IF NOT EXISTS
FOR (ev:Event) ON (ev.event_type);

CREATE INDEX event_severity_idx IF NOT EXISTS
FOR (ev:Event) ON (ev.severity);

CREATE INDEX event_time_idx IF NOT EXISTS
FOR (ev:Event) ON (ev.start_time);

CREATE INDEX vehicle_type_idx IF NOT EXISTS
FOR (v:Vehicle) ON (v.vehicle_type);

CREATE INDEX vehicle_status_idx IF NOT EXISTS
FOR (v:Vehicle) ON (v.current_status);

CREATE INDEX org_type_idx IF NOT EXISTS
FOR (o:Organization) ON (o.org_type);

CREATE INDEX classification_idx IF NOT EXISTS
FOR (e:Entity) ON (e.classification);

// Geospatial indexes
CREATE POINT INDEX person_location_idx IF NOT EXISTS
FOR (p:Person) ON (p.last_known_location);

CREATE POINT INDEX vehicle_location_idx IF NOT EXISTS
FOR (v:Vehicle) ON (v.current_location);

CREATE POINT INDEX event_location_idx IF NOT EXISTS
FOR (ev:Event) ON (ev.location);

CREATE POINT INDEX location_coords_idx IF NOT EXISTS
FOR (l:Location) ON (l.coordinates);

// Composite indexes
CREATE INDEX entity_type_classification_idx IF NOT EXISTS
FOR (e:Entity) ON (e.entity_type, e.classification);

CREATE INDEX temporal_valid_idx IF NOT EXISTS
FOR ()-[r:LOCATED_AT|EMPLOYED_AT|PARTICIPATED_IN|MET_WITH|COMMUNICATED_WITH]-() 
ON (r.valid_from, r.valid_to);

// Vector index for semantic search
CREATE VECTOR INDEX doc_embedding_idx IF NOT EXISTS
FOR (d:Document) ON (d.embedding)
OPTIONS {indexConfig: {
  `vector.dimensions`: 768,
  `vector.similarity_function`: 'cosine'
}};

// ─────────────────────────────────────────────────────────────
// 3. SECURITY POLICIES (Property-level access control)
// ─────────────────────────────────────────────────────────────

// Note: Neo4j Community doesn't support native property-level security.
// This is implemented at the application layer using the middleware below.

// ─────────────────────────────────────────────────────────────
// 4. TRIGGERS (Automated actions)
// ─────────────────────────────────────────────────────────────

// Auto-set temporal metadata on relationship creation
CALL apoc.trigger.install('set_temporal_metadata',
  'MATCH (n)-[r]->(m)
   WHERE r.created_at IS NULL
   SET r.created_at = datetime(),
       r.ingested_at = datetime()',
  {phase: 'before'}
);

// Auto-update entity last_observed on relationship
CALL apoc.trigger.install('update_last_observed',
  'MATCH (n)-[r]->(m)
   WHERE r.observed_at IS NOT NULL
     AND (n.last_observed IS NULL OR r.observed_at > n.last_observed)
   SET n.last_observed = r.observed_at',
  {phase: 'before'}
);
```

## 9.2 Python API Layer (FastAPI)

```python
#!/usr/bin/env python3
"""
DEFONEOS Ontology API Server
FastAPI-based REST API for the defense knowledge graph.
"""

from fastapi import FastAPI, HTTPException, Depends, Security, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
import asyncio

from neo4j import AsyncGraphDatabase, GraphDatabase
from py2neo import Graph, Node, Relationship
import httpx

app = FastAPI(
    title="DEFONEOS Ontology API",
    description="Sovereign Defense Knowledge Graph API",
    version="1.0.0"
)

# ─────────────────────────────────────────────────────────────
# SECURITY
# ─────────────────────────────────────────────────────────────

security = HTTPBearer()

CLEARANCE_LEVELS = {
    "UNCLASSIFIED": 1,
    "CONFIDENTIAL": 2,
    "SECRET": 3,
    "TOP_SECRET": 4
}

REQUIRED_CLEARANCE = {
    "Person": {"biometric_id": "SECRET", "informant_identity": "TOP_SECRET"},
    "Vehicle": {"current_location": "CONFIDENTIAL"},
    "Signal": {"indicator_value": "SECRET"},
    "Document": {"content": "SECRET"}
}

def check_clearance(user_clearance: str, required: str) -> bool:
    return CLEARANCE_LEVELS.get(user_clearance, 0) >= CLEARANCE_LEVELS.get(required, 99)

def filter_properties(entity: dict, entity_type: str, user_clearance: str) -> dict:
    """Remove properties user doesn't have clearance for."""
    filtered = entity.copy()
    prop_controls = REQUIRED_CLEARANCE.get(entity_type, {})
    
    for prop, required in prop_controls.items():
        if not check_clearance(user_clearance, required):
            del filtered[prop]
    
    return filtered

# ─────────────────────────────────────────────────────────────
# DATABASE CONNECTION
# ─────────────────────────────────────────────────────────────

class Database:
    def __init__(self):
        self.neo4j_uri = "bolt://localhost:7687"
        self.neo4j_user = "neo4j"
        self.neo4j_password = "defoneos_secure"
        self.driver = None
    
    async def connect(self):
        self.driver = AsyncGraphDatabase.driver(
            self.neo4j_uri,
            auth=(self.neo4j_user, self.neo4j_password)
        )
    
    async def close(self):
        if self.driver:
            await self.driver.close()
    
    async def run(self, query, **params):
        async with self.driver.session() as session:
            result = await session.run(query, **params)
            return await result.data()

db = Database()

@app.on_event("startup")
async def startup():
    await db.connect()

@app.on_event("shutdown")
async def shutdown():
    await db.close()

# ─────────────────────────────────────────────────────────────
# ENUMS
# ─────────────────────────────────────────────────────────────

class Classification(str, Enum):
    UNCLASSIFIED = "UNCLASSIFIED"
    CONFIDENTIAL = "CONFIDENTIAL"
    SECRET = "SECRET"
    TOP_SECRET = "TOP_SECRET"

class PersonType(str, Enum):
    SOLDIER = "SOLDIER"
    CIVILIAN = "CIVILIAN"
    ANALYST = "ANALYST"
    THREAT_ACTOR = "THREAT_ACTOR"
    PRISONER = "PRISONER"
    INFORMANT = "INFORMANT"
    LEADER = "LEADER"

class EventType(str, Enum):
    ENGAGEMENT = "ENGAGEMENT"
    DETECTION = "DETECTION"
    ALERT = "ALERT"
    MISSION = "MISSION"
    PATROL = "PATROL"
    INTERCEPTION = "INTERCEPTION"
    SIGINT_COLLECTION = "SIGINT_COLLECTION"
    CYBER_EVENT = "CYBER_EVENT"
    CHANGE_OF_STATUS = "CHANGE_OF_STATUS"

class VehicleType(str, Enum):
    FIXED_WING = "FIXED_WING"
    ROTARY_WING = "ROTARY_WING"
    UAS = "UAS"
    TANK = "TANK"
    APC = "APC"
    MRAP = "MRAP"
    LOGISTICS = "LOGISTICS"
    SURFACE_COMBATANT = "SURFACE_COMBATANT"
    SUBMARINE = "SUBMARINE"

class Severity(str, Enum):
    INFO = "INFO"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

# ─────────────────────────────────────────────────────────────
# DATA MODELS
# ─────────────────────────────────────────────────────────────

class GeoPoint(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    alt: Optional[float] = None

class TemporalMetadata(BaseModel):
    valid_from: Optional[datetime] = None
    valid_to: Optional[datetime] = None
    observed_at: Optional[datetime] = None

class Provenance(BaseModel):
    source_system: str
    source_record_id: Optional[str] = None
    extraction_method: str = "MANUAL_ENTRY"
    confidence: float = Field(1.0, ge=0.0, le=1.0)

class PersonCreate(BaseModel):
    name: str
    person_type: PersonType
    alias: List[str] = []
    rank: Optional[str] = None
    nationality: Optional[str] = None
    clearance_level: Optional[str] = None
    status: str = "ACTIVE"
    last_known_location: Optional[GeoPoint] = None
    classification: Classification = Classification.UNCLASSIFIED
    releasability: List[str] = []
    temporal: Optional[TemporalMetadata] = None
    provenance: Optional[Provenance] = None

class EventCreate(BaseModel):
    event_type: EventType
    event_id: str
    severity: Severity = Severity.INFO
    summary: str
    detailed_description: Optional[str] = None
    location: GeoPoint
    start_time: datetime
    end_time: Optional[datetime] = None
    classification: Classification = Classification.UNCLASSIFIED
    temporal: Optional[TemporalMetadata] = None
    provenance: Optional[Provenance] = None

class VehicleCreate(BaseModel):
    designation: str
    vehicle_type: VehicleType
    call_sign: Optional[str] = None
    current_status: str = "OPERATIONAL"
    current_location: Optional[GeoPoint] = None
    current_heading: Optional[float] = None
    current_speed: Optional[float] = None
    classification: Classification = Classification.UNCLASSIFIED

# ─────────────────────────────────────────────────────────────
# API ENDPOINTS — ENTITIES
# ─────────────────────────────────────────────────────────────

@app.post("/api/v1/person", response_model=Dict[str, Any])
async def create_person(
    person: PersonCreate,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Create a new Person entity in the ontology."""
    user_clearance = "SECRET"  # TODO: Extract from JWT token
    
    # Check if user can create at this classification
    if not check_clearance(user_clearance, person.classification.value):
        raise HTTPException(403, "Insufficient clearance to create at this classification")
    
    urn = f"urn:defoneos:person:{datetime.utcnow().timestamp()}"
    
    query = """
    CREATE (p:Person:Entity {
        urn: $urn,
        name: $name,
        person_type: $person_type,
        alias: $alias,
        rank: $rank,
        nationality: $nationality,
        clearance_level: $clearance_level,
        status: $status,
        last_known_location: point($location),
        classification: $classification,
        releasability: $releasability,
        valid_from: $valid_from,
        observed_at: $observed_at,
        created_at: datetime(),
        entity_type: 'Person'
    })
    RETURN p
    """
    
    location_dict = None
    if person.last_known_location:
        location_dict = {
            "latitude": person.last_known_location.lat,
            "longitude": person.last_known_location.lon
        }
    
    result = await db.run(query,
        urn=urn,
        name=person.name,
        person_type=person.person_type.value,
        alias=person.alias,
        rank=person.rank,
        nationality=person.nationality,
        clearance_level=person.clearance_level,
        status=person.status,
        location=location_dict,
        classification=person.classification.value,
        releasability=person.releasability,
        valid_from=person.temporal.valid_from.isoformat() if person.temporal else datetime.utcnow().isoformat(),
        observed_at=person.provenance.observed_at.isoformat() if person.provenance else datetime.utcnow().isoformat()
    )
    
    return {"urn": urn, "status": "created", "entity": result[0]["p"] if result else None}

@app.get("/api/v1/person/search")
async def search_persons(
    q: Optional[str] = Query(None, description="Search query"),
    person_type: Optional[PersonType] = None,
    nationality: Optional[str] = None,
    rank: Optional[str] = None,
    status: Optional[str] = None,
    classification: Optional[Classification] = None,
    limit: int = Query(100, le=1000),
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Search for Person entities with filters."""
    user_clearance = "SECRET"  # TODO: Extract from JWT
    
    # Build query dynamically
    conditions = ["p.classification <= $user_clearance"]
    params = {"user_clearance": user_clearance, "limit": limit}
    
    if q:
        conditions.append("(p.name CONTAINS $q OR ANY(a IN p.alias WHERE a CONTAINS $q))")
        params["q"] = q
    if person_type:
        conditions.append("p.person_type = $person_type")
        params["person_type"] = person_type.value
    if nationality:
        conditions.append("p.nationality = $nationality")
        params["nationality"] = nationality
    if rank:
        conditions.append("p.rank = $rank")
        params["rank"] = rank
    if status:
        conditions.append("p.status = $status")
        params["status"] = status
    if classification:
        conditions.append("p.classification = $classification")
        params["classification"] = classification.value
    
    query = f"""
    MATCH (p:Person)
    WHERE {' AND '.join(conditions)}
    RETURN p
    ORDER BY p.last_observed DESC
    LIMIT $limit
    """
    
    results = await db.run(query, **params)
    
    # Filter properties based on clearance
    persons = []
    for record in results:
        person_data = dict(record["p"])
        persons.append(filter_properties(person_data, "Person", user_clearance))
    
    return {"count": len(persons), "results": persons}

@app.post("/api/v1/event")
async def create_event(
    event: EventCreate,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Create a new Event entity."""
    urn = f"urn:defoneos:event:{event.event_id}"
    
    query = """
    MERGE (e:Event:Entity {event_id: $event_id})
    ON CREATE SET 
        e.urn = $urn,
        e.event_type = $event_type,
        e.severity = $severity,
        e.summary = $summary,
        e.detailed_description = $description,
        e.location = point($location),
        e.start_time = datetime($start_time),
        e.end_time = datetime($end_time),
        e.classification = $classification,
        e.created_at = datetime(),
        e.entity_type = 'Event'
    RETURN e
    """
    
    location_dict = {
        "latitude": event.location.lat,
        "longitude": event.location.lon
    }
    
    result = await db.run(query,
        urn=urn,
        event_id=event.event_id,
        event_type=event.event_type.value,
        severity=event.severity.value,
        summary=event.summary,
        description=event.detailed_description,
        location=location_dict,
        start_time=event.start_time.isoformat(),
        end_time=event.end_time.isoformat() if event.end_time else None,
        classification=event.classification.value
    )
    
    return {"urn": urn, "status": "created", "entity": result[0]["e"] if result else None}

# ─────────────────────────────────────────────────────────────
# API ENDPOINTS — RELATIONSHIPS
# ─────────────────────────────────────────────────────────────

class RelationshipCreate(BaseModel):
    source_urn: str
    target_urn: str
    relationship_type: str
    properties: Dict[str, Any] = {}
    valid_from: Optional[datetime] = None
    valid_to: Optional[datetime] = None
    confidence: float = Field(1.0, ge=0.0, le=1.0)

@app.post("/api/v1/relationship")
async def create_relationship(
    rel: RelationshipCreate,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Create a typed relationship between two entities."""
    
    query = """
    MATCH (source {urn: $source_urn})
    MATCH (target {urn: $target_urn})
    CREATE (source)-[r:$rel_type {
        valid_from: datetime($valid_from),
        valid_to: datetime($valid_to),
        confidence: $confidence,
        created_at: datetime()
    }]->(target)
    SET r += $properties
    RETURN source, r, target
    """
    
    # Sanitize relationship type to prevent injection
    allowed_types = [
        "COMMANDED_BY", "SUBORDINATE_TO", "MEMBER_OF", "OPERATES", "CREW_OF",
        "PARTICIPATED_IN", "REPORTED", "WITNESSED", "COMMUNICATED_WITH", "MET_WITH",
        "RELATED_TO", "ASSOCIATED_WITH", "LOCATED_AT", "KNOWS", "TRAINED",
        "SUCCEEDED", "NEXT_OF_KIN", "HAS_ALIAS", "THREATENS", "FUNDS",
        "ASSIGNED_TO", "BASED_AT", "CURRENTLY_AT", "ESCORTS", "FOLLOWS",
        "CARRIES", "TRANSPORTS", "TRACKED_BY", "MAINTAINED_BY", "REPLACED",
        "INITIATED_BY", "TARGETS", "OCCURRED_AT", "PART_OF", "TRIGGERED",
        "DOCUMENTED_IN", "RESPONSE_TO", "INVOLVED_VEHICLE", "INVOLVED_EQUIPMENT",
        "RESULTED_IN", "CONTAINS", "ADJACENT_TO", "CONNECTED_TO", "CONTROLLED_BY",
        "HOSTS", "OVERWATCHES", "SUPPLY_ROUTE_TO", "PARENT_OF", "ALLIED_WITH",
        "OPPOSES", "SUPPORTS", "OPERATES_IN", "HAS_EQUIPMENT", "HAS_VEHICLE",
        "FUNDED_BY", "COMMUNICATES_WITH", "EMITTED_FROM", "DETECTED_BY",
        "INDICATES", "MOUNTED_ON", "REFERENCES", "CONTAINS_INTEL", "RESPONDS_TO",
        "CLASSIFIES", "THREAT_TO", "PROTECTS", "ENABLES", "DEPENDS_ON",
        "OBSERVED_BY", "CORRELATED_WITH", "EMPLOYED_AT", "HAS_SKILL"
    ]
    
    if rel.relationship_type not in allowed_types:
        raise HTTPException(400, f"Invalid relationship type. Allowed: {allowed_types}")
    
    # Use APOC for dynamic relationship type
    query = f"""
    MATCH (source {{urn: $source_urn}})
    MATCH (target {{urn: $target_urn}})
    CALL apoc.create.relationship(source, $rel_type, {{
        valid_from: datetime($valid_from),
        valid_to: $valid_to,
        confidence: $confidence,
        properties: $properties,
        created_at: datetime()
    }}, target) YIELD rel
    RETURN rel
    """
    
    result = await db.run(query,
        source_urn=rel.source_urn,
        target_urn=rel.target_urn,
        rel_type=rel.relationship_type,
        valid_from=rel.valid_from.isoformat() if rel.valid_from else datetime.utcnow().isoformat(),
        valid_to=rel.valid_to.isoformat() if rel.valid_to else None,
        confidence=rel.confidence,
        properties=rel.properties
    )
    
    return {"status": "created", "relationship": result[0]["rel"] if result else None}

# ─────────────────────────────────────────────────────────────
# API ENDPOINTS — GRAPH QUERIES
# ─────────────────────────────────────────────────────────────

@app.get("/api/v1/traverse")
async def traverse_graph(
    urn: str,
    depth: int = Query(2, ge=1, le=5),
    relationship_types: Optional[List[str]] = None,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Traverse the graph from a starting entity."""
    user_clearance = "SECRET"
    
    rel_filter = ""
    if relationship_types:
        rel_filter = "|".join(relationship_types)
        rel_filter = f":{rel_filter}"
    
    query = f"""
    MATCH path = (start {{urn: $urn}})-[r{rel_filter}*1..{depth}]-(connected)
    WHERE ALL(n IN nodes(path) WHERE n.classification IS NULL OR n.classification <= $clearance)
    WITH start, path, connected
    LIMIT 1000
    RETURN start, 
           [n IN nodes(path) | {{urn: n.urn, name: n.name, type: labels(n)[0]}}] AS path_nodes,
           [r IN relationships(path) | {{type: type(r), properties: properties(r)}}] AS path_rels,
           connected
    """
    
    results = await db.run(query, urn=urn, clearance=user_clearance)
    
    return {
        "center": urn,
        "depth": depth,
        "paths": results
    }

@app.get("/api/v1/temporal/snapshot")
async def temporal_snapshot(
    point_in_time: datetime,
    entity_type: Optional[str] = None,
    bbox: Optional[str] = None,  # "lat_min,lon_min,lat_max,lon_max"
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Get the state of the graph at a specific point in time."""
    user_clearance = "SECRET"
    
    conditions = ["e.classification <= $clearance"]
    params = {
        "clearance": user_clearance,
        "point_in_time": point_in_time.isoformat()
    }
    
    if entity_type:
        conditions.append(f"e:{entity_type}")
    
    if bbox:
        lat_min, lon_min, lat_max, lon_max = map(float, bbox.split(","))
        conditions.append(
            "point.withinBBox(e.location, point({latitude: $lat_min, longitude: $lon_min}), "
            "point({latitude: $lat_max, longitude: $lon_max}))"
        )
        params.update({"lat_min": lat_min, "lon_min": lon_min, "lat_max": lat_max, "lon_max": lon_max})
    
    query = f"""
    MATCH (e)-[r]->(target)
    WHERE {' AND '.join(conditions)}
      AND (r.valid_from IS NULL OR r.valid_from <= datetime($point_in_time))
      AND (r.valid_to IS NULL OR r.valid_to > datetime($point_in_time))
    RETURN e, collect(DISTINCT {{
        relationship: type(r),
        target: target.name,
        target_urn: target.urn,
        valid_from: r.valid_from,
        properties: properties(r)
    }}) AS relationships
    LIMIT 1000
    """
    
    results = await db.run(query, **params)
    return {"point_in_time": point_in_time, "entities": results}

@app.get("/api/v1/search/nearby")
async def nearby_search(
    lat: float,
    lon: float,
    radius_km: float = Query(10.0, gt=0, le=500),
    entity_types: Optional[List[str]] = Query(None),
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Find entities near a geographic point."""
    user_clearance = "SECRET"
    
    type_filter = ""
    if entity_types:
        type_labels = ":".join(entity_types)
        type_filter = f"e:{type_labels}"
    
    query = f"""
    MATCH (e{ type_filter})
    WHERE e.classification <= $clearance
      AND e.location IS NOT NULL
      AND point.distance(e.location, point({{latitude: $lat, longitude: $lon}})) < ($radius_km * 1000)
    RETURN e.urn AS urn, e.name AS name, labels(e)[0] AS type,
           point.distance(e.location, point({{latitude: $lat, longitude: $lon}})) AS distance_meters,
           e.location AS coordinates
    ORDER BY distance_meters
    LIMIT 500
    """
    
    results = await db.run(query,
        clearance=user_clearance,
        lat=lat, lon=lon,
        radius_km=radius_km
    )
    
    return {"center": {"lat": lat, "lon": lon}, "radius_km": radius_km, "results": results}

@app.get("/api/v1/graph/stats")
async def graph_stats(
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Get overall graph statistics."""
    
    queries = {
        "total_entities": "MATCH (e:Entity) RETURN count(e) AS count",
        "entity_types": "MATCH (e) WHERE e.entity_type IS NOT NULL RETURN e.entity_type AS type, count(e) AS count ORDER BY count DESC",
        "total_relationships": "MATCH ()-[r]->() RETURN count(r) AS count",
        "relationship_types": "MATCH ()-[r]->() RETURN type(r) AS type, count(r) AS count ORDER BY count DESC",
        "classification_distribution": "MATCH (e:Entity) RETURN e.classification AS classification, count(e) AS count",
        "temporal_coverage": "MATCH (e:Entity) WHERE e.valid_from IS NOT NULL RETURN min(e.valid_from) AS earliest, max(e.valid_from) AS latest"
    }
    
    stats = {}
    for key, query in queries.items():
        result = await db.run(query)
        stats[key] = result
    
    return stats

# ─────────────────────────────────────────────────────────────
# API ENDPOINTS — GraphRAG
# ─────────────────────────────────────────────────────────────

@app.post("/api/v1/graphrag/query")
async def graphrag_query(
    query: str,
    mode: str = "auto",  # auto, local, global, drift
    point_in_time: Optional[datetime] = None,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Query the knowledge graph using GraphRAG."""
    user_clearance = "SECRET"
    
    # TODO: Integrate with GraphRAG pipeline
    # This calls the Microsoft GraphRAG implementation
    
    return {
        "query": query,
        "mode": mode,
        "answer": "[GraphRAG integration pending — see Section 6 for architecture]",
        "sources": [],
        "confidence": 0.0
    }

# ─────────────────────────────────────────────────────────────
# HEALTH CHECK
# ─────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    """Health check endpoint."""
    try:
        result = await db.run("RETURN 1 AS connected")
        return {"status": "healthy", "neo4j": "connected"}
    except Exception as e:
        return {"status": "degraded", "neo4j": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

## 9.3 Docker Compose Stack

```yaml
# docker-compose.yml — DEFONEOS Ontology Stack
version: '3.8'

services:
  # Neo4j Graph Database
  neo4j:
    image: neo4j:5.20.0-community
    container_name: defoneos-neo4j
    ports:
      - "7474:7474"  # HTTP
      - "7687:7687"  # Bolt
    environment:
      - NEO4J_AUTH=neo4j/defoneos_secure
      - NEO4J_PLUGINS=["apoc", "gds"]
      - NEO4J_dbms_memory_heap_initial__size=4G
      - NEO4J_dbms_memory_heap_max__size=8G
      - NEO4J_dbms_memory_pagecache_size=4G
      - NEO4J_apoc_export_file_enabled=true
      - NEO4J_apoc_import_file_enabled=true
    volumes:
      - neo4j_data:/data
      - neo4j_logs:/logs
      - neo4j_import:/import
    restart: unless-stopped
    networks:
      - defoneos-net

  # Apache Jena + Fuseki
  fuseki:
    image: stain/jena-fuseki:latest
    container_name: defoneos-fuseki
    ports:
      - "3030:3030"
    environment:
      - ADMIN_PASSWORD=defoneos_admin
      - JVM_ARGS=-Xmx4g
    volumes:
      - fuseki_data:/fuseki
    restart: unless-stopped
    networks:
      - defoneos-net

  # DEFONEOS Ontology API
  ontology-api:
    build:
      context: ./api
      dockerfile: Dockerfile
    container_name: defoneos-api
    ports:
      - "8000:8000"
    environment:
      - NEO4J_URI=bolt://neo4j:7687
      - NEO4J_USER=neo4j
      - NEO4J_PASSWORD=defoneos_secure
      - FUSEKI_URL=http://fuseki:3030/defoneos
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - neo4j
      - fuseki
    restart: unless-stopped
    networks:
      - defoneos-net

  # Ollama (Local LLM)
  ollama:
    image: ollama/ollama:latest
    container_name: defoneos-ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_models:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    restart: unless-stopped
    networks:
      - defoneos-net

  # Apache Kafka (Event Streaming)
  kafka:
    image: confluentinc/cp-kafka:latest
    container_name: defoneos-kafka
    ports:
      - "9092:9092"
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka:29093
      KAFKA_LISTENERS: PLAINTEXT://kafka:9092,CONTROLLER://kafka:29093
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_CLUSTER_ID: defoneos-kafka-cluster
    volumes:
      - kafka_data:/var/lib/kafka/data
    restart: unless-stopped
    networks:
      - defoneos-net

  # Prometheus (Metrics)
  prometheus:
    image: prom/prometheus:latest
    container_name: defoneos-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    restart: unless-stopped
    networks:
      - defoneos-net

  # Grafana (Dashboards)
  grafana:
    image: grafana/grafana:latest
    container_name: defoneos-grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=defoneos_admin
    volumes:
      - grafana_data:/var/lib/grafana
    restart: unless-stopped
    networks:
      - defoneos-net

  # Graphiti (Temporal Context Graph)
  graphiti:
    image: zepai/graphiti:latest
    container_name: defoneos-graphiti
    ports:
      - "8001:8000"
    environment:
      - NEO4J_URI=bolt://neo4j:7687
      - NEO4J_USER=neo4j
      - NEO4J_PASSWORD=defoneos_secure
      - OPENAI_API_KEY=${OPENAI_API_KEY}  # Or use local LLM
    depends_on:
      - neo4j
    restart: unless-stopped
    networks:
      - defoneos-net

volumes:
  neo4j_data:
  neo4j_logs:
  neo4j_import:
  fuseki_data:
  ollama_models:
  kafka_data:
  prometheus_data:
  grafana_data:

networks:
  defoneos-net:
    driver: bridge
```

## 9.4 Sample Cypher Queries for Common Operations

```cypher
// ═══════════════════════════════════════════════════════════════
// DEFONEOS: COMMON OPERATIONS — CYPHER QUERY LIBRARY
// ═══════════════════════════════════════════════════════════════

// ── 1. PERSON SEARCH ──────────────────────────────────────────

// Find all threat actors in a specific AO
MATCH (p:Person:ThreatActor)-[:LOCATED_AT]->(l:Location)
WHERE l.name CONTAINS 'Sector 7'
  AND p.threat_level IN ['HIGH', 'CRITICAL']
RETURN p.name AS threat_actor, 
       p.threat_level AS threat_level,
       p.known_aliases AS aliases,
       l.name AS location
ORDER BY p.threat_level DESC;

// Find chain of command for a person
MATCH path = (person:Person {name: 'Sgt. John Miller'})-[:SUBORDINATE_TO*0..5]->(commander)
RETURN [n IN nodes(path) | n.rank + ' ' + n.name] AS chain_of_command;

// ── 2. VEHICLE TRACKING ───────────────────────────────────────

// Current position of all UAS assets
MATCH (v:Vehicle)
WHERE v.vehicle_type = 'UAS'
  AND v.current_status = 'OPERATIONAL'
RETURN v.designation AS drone,
       v.call_sign AS call_sign,
       v.current_location AS position,
       v.current_heading AS heading,
       v.current_speed AS speed;

// Vehicle trajectory over time (using temporal edges)
MATCH (v:Vehicle {designation: 'MQ-9A-007'})-[r:LOCATED_AT]->(l:Location)
WHERE r.valid_from >= datetime() - duration('P7D')
RETURN r.valid_from AS timestamp,
       l.coordinates AS position,
       l.name AS location_name,
       r.confidence AS confidence
ORDER BY r.valid_from;

// ── 3. EVENT ANALYSIS ─────────────────────────────────────────

// All events in an AO in the last 24 hours
MATCH (ev:Event)-[:OCCURRED_AT]->(l:Location)
WHERE l.name CONTAINS 'AO NORTH'
  AND ev.start_time >= datetime() - duration('P1D')
RETURN ev.event_type AS type,
       ev.severity AS severity,
       ev.summary AS summary,
       ev.start_time AS time,
       l.name AS location
ORDER BY ev.start_time DESC;

// Event correlation: find events that occurred near each other
MATCH (ev1:Event)-[:OCCURRED_AT]->(l1:Location)
MATCH (ev2:Event)-[:OCCURRED_AT]->(l2:Location)
WHERE ev1 <> ev2
  AND abs(duration.inSeconds(ev1.start_time, ev2.start_time).seconds) < 3600
  AND point.distance(l1.location, l2.location) < 5000
RETURN ev1.summary AS event_1, 
       ev2.summary AS event_2,
       duration.inSeconds(ev1.start_time, ev2.start_time).seconds AS time_diff_seconds,
       point.distance(l1.location, l2.location) AS distance_meters;

// ── 4. GEOSPATIAL QUERIES ─────────────────────────────────────

// Find all entities within 10km of a point
WITH point({latitude: 34.0522, longitude: -118.2437}) AS center
MATCH (e)
WHERE e.location IS NOT NULL
  AND point.distance(e.location, center) < 10000
RETURN labels(e)[0] AS entity_type,
       e.name AS name,
       point.distance(e.location, center) AS distance_meters
ORDER BY distance_meters;

// Find overlapping AOs
MATCH (ao1:Location {location_type: 'AO'})
MATCH (ao2:Location {location_type: 'AO'})
WHERE ao1 <> ao2
  AND point.distance(ao1.coordinates, ao2.coordinates) < 20000
RETURN ao1.name AS ao_1, ao2.name AS ao_2,
       point.distance(ao1.coordinates, ao2.coordinates) AS distance_meters;

// ── 5. NETWORK ANALYSIS ───────────────────────────────────────

// Find shortest communication path between two threat actors
MATCH path = shortestPath(
  (a:Person {name: 'Hassan Al-Rashid'})-[:COMMUNICATED_WITH|MET_WITH|KNOWS*]-
  (b:Person {name: 'Omar Khalidi'})
)
RETURN [n IN nodes(path) | n.name] AS path_nodes,
       length(path) AS path_length;

// Find influential entities (PageRank)
CALL gds.graph.exists('influence_graph') YIELD exists
CALL apoc.do.when(exists,
  'CALL gds.graph.drop("influence_graph") YIELD graphName RETURN graphName',
  'RETURN "no graph"', {}
) YIELD value RETURN value;

CALL gds.graph.project('influence_graph', 'Entity', 'ALL_RELATIONS')
YIELD graphName;

CALL gds.pageRank.stream('influence_graph')
YIELD nodeId, score
RETURN gds.util.asNode(nodeId).name AS entity, score
ORDER BY score DESC
LIMIT 20;

CALL gds.graph.drop('influence_graph') YIELD graphName;

// Find communities of threat actors
CALL gds.graph.exists('threat_communities') YIELD exists
CALL apoc.do.when(exists,
  'CALL gds.graph.drop("threat_communities") YIELD graphName RETURN graphName',
  'RETURN "no graph"', {}
) YIELD value RETURN value;

CALL gds.graph.project(
  'threat_communities',
  'Person',
  {COMMUNICATED_WITH: {}, MET_WITH: {}, KNOWS: {}}
)
YIELD graphName;

CALL gds.louvain.stream('threat_communities')
YIELD nodeId, communityId
WITH gds.util.asNode(nodeId) AS person, communityId
WHERE person.person_type = 'THREAT_ACTOR'
RETURN communityId,
       collect(person.name) AS community_members,
       count(*) AS community_size
ORDER BY community_size DESC;

CALL gds.graph.drop('threat_communities') YIELD graphName;

// ── 6. TEMPORAL QUERIES ───────────────────────────────────────

// What was the disposition on D-Day minus 2?
MATCH (p:Person)-[r:ASSIGNED_TO|MEMBER_OF]->(o:Organization)
WHERE r.valid_from <= datetime('2024-06-04T00:00:00Z')
  AND (r.valid_to IS NULL OR r.valid_to > datetime('2024-06-04T00:00:00Z'))
RETURN o.name AS unit, 
       collect(p.rank + ' ' + p.name) AS personnel,
       count(p) AS headcount
ORDER BY headcount DESC;

// Find all vehicles that changed status in the last week
MATCH (v:Vehicle)
WHERE v.last_status_change >= datetime() - duration('P7D')
RETURN v.designation AS vehicle,
       v.vehicle_type AS type,
       v.current_status AS new_status,
       v.previous_status AS old_status,
       v.last_status_change AS changed_at;

// ── 7. INTELLIGENCE FUSION ────────────────────────────────────

// Multi-source fusion: combine HUMINT + SIGINT + IMINT on same target
MATCH (target:Person)
WHERE target.name = 'Abdul Rahman'
OPTIONAL MATCH (target)-[:OBSERVED_IN]->(h:Document {intel_type: 'HUMINT'})
OPTIONAL MATCH (target)-[:EMITS]->(s:Signal)
OPTIONAL MATCH (target)-[:APPEARS_IN]->(i:Document {intel_type: 'IMINT'})
RETURN target.name AS target,
       target.confidence_score AS confidence,
       collect(DISTINCT h.title) AS humint_reports,
       collect(DISTINCT s.frequency_mhz) AS sigindicators,
       collect(DISTINCT i.title) AS imint_reports,
       size(collect(DISTINCT h)) + size(collect(DISTINCT s)) + size(collect(DISTINCT i)) AS source_count;

// ── 8. SECURITY AUDIT ─────────────────────────────────────────

// Find all entities classified above user's clearance (audit)
MATCH (e:Entity)
WHERE e.classification > 'CONFIDENTIAL'
RETURN e.urn AS urn,
       labels(e)[0] AS type,
       e.name AS name,
       e.classification AS classification,
       e.releasability AS releasability
ORDER BY e.classification DESC;

// Access log: who queried what
MATCH (u:User)-[q:QUERIED]->(e:Entity)
WHERE q.timestamp >= datetime() - duration('P1D')
RETURN u.username AS user,
       e.name AS entity,
       q.timestamp AS query_time,
       q.query_type AS query_type
ORDER BY q.timestamp DESC;
```

---

# SECTION 10: APPENDICES

## Appendix A: Complete URN Naming Convention

```
urn:defoneos:{entity_type}:{source_system}:{identifier}

Examples:
  urn:defoneos:person:HUMINT_NET:ahmed_khalil_1978
  urn:defoneos:vehicle:DRONE_FLEET:mq9a_alpha_007
  urn:defoneos:event:ALLSOURCE_FUSE:engagement_2025_1847
  urn:defoneos:location:GEOINT_MAP:checkpoint_alpha_north
  urn:defoneos:organization:HUMINT_NET:eastern_cell_sector7
  urn:defoneos:signal:SIGINT_CORE:rf_2400mhz_20250705_143022
  urn:defoneos:document:OSINT_SCOUT:report_4421_20250705
```

## Appendix B: Confidence Scoring Reference

| Confidence Range | Interpretation | Color Code | Action Required |
|-----------------|----------------|-----------|-----------------|
| 0.90 - 1.00 | High confidence — validated by multiple sources | Green | Use for decision-making |
| 0.70 - 0.89 | Medium-high — some corroboration | Light Green | Use with minor caveats |
| 0.50 - 0.69 | Medium — single reliable source | Yellow | Flag for corroboration |
| 0.30 - 0.49 | Low-medium — weak source or indirect | Orange | Requires corroboration before use |
| 0.10 - 0.29 | Low — unverified or unreliable source | Red | Do not use for decisions |
| 0.00 - 0.09 | Very low — possibly fabricated | Dark Red | Discard or re-evaluate |

## Appendix C: Classification Levels

| Level | Numeric | Description | Typical Access |
|-------|---------|-------------|---------------|
| UNCLASSIFIED | 1 | No restrictions | All personnel |
| CONFIDENTIAL | 2 | Unauthorized disclosure could cause damage | Cleared personnel |
| SECRET | 3 | Unauthorized disclosure could cause serious damage | Secret-cleared personnel |
| TOP SECRET | 4 | Unauthorized disclosure could cause exceptionally grave damage | TS-cleared personnel |
| TS/SCI | 5 | TS + Sensitive Compartmented Information | SCI-cleared personnel |

## Appendix D: Releasability Codes

| Code | Meaning |
|------|---------|
| NATO | Releasable to NATO allies |
| FIVE_EYES | Releasable to US, UK, CA, AU, NZ |
| NOFORN | No foreign nationals |
| ORCON | Originator controls dissemination |
| REL TO | Releasable to specified countries |
| EYES ONLY | Limited to named recipients |

## Appendix E: Graph Database Selection Decision Matrix

| Criterion | Neo4j | Dgraph | TypeDB | TigerGraph | Jena |
|-----------|-------|--------|--------|-----------|------|
| Ease of Use | ★★★★★ | ★★★ | ★★★★ | ★★★ | ★★★ |
| Query Expressiveness | ★★★★★ | ★★★★ | ★★★★★ | ★★★★★ | ★★★★ |
| Horizontal Scale | ★★★ | ★★★★★ | ★★★★ | ★★★★ | ★★★ |
| Billion Entities | ★★★★ | ★★★★★ | ★★★★ | ★★★★★ | ★★★ |
| Real-time Updates | ★★★★★ | ★★★★★ | ★★★★ | ★★★★ | ★★★ |
| Graph Analytics | ★★★★★ | ★★★ | ★★★ | ★★★★★ | ★★ |
| Type Safety | ★★★ | ★★★ | ★★★★★ | ★★★ | ★★★★ |
| Standards (RDF/SPARQL) | ★★ | ★★ | ★ | ★ | ★★★★★ |
| Community/Ecosystem | ★★★★★ | ★★★ | ★★★ | ★★★★ | ★★★★ |
| Open Source License | ★★★ | ★★★★★ | ★★★ | ★★ | ★★★★★ |
| **DEFONEOS Weighted Score** | **4.3** | **3.8** | **3.5** | **3.9** | **3.2** |

**Winner: Neo4j for primary operational graph, Apache Jena for standards compliance.**

## Appendix F: Palantir vs DEFONEOS Feature Comparison

| Capability | Palantir Foundry | DEFONEOS |
|-----------|-----------------|-----------|
| Typed objects | Yes (Object Types) | Yes (Entity Types) |
| Typed links | Yes (Link Types) | Yes (Relationship Types) |
| Governed actions | Yes (Action Types) | Yes (API + Middleware) |
| Temporal modeling | Partial (versioning) | Yes (bi-temporal, Graphiti) |
| Entity resolution | Yes (proprietary) | Yes (Zingg + splink + GDS) |
| AI/LLM integration | Yes (AIP) | Yes (GraphRAG + local LLM) |
| GraphRAG | No | Yes (Microsoft GraphRAG) |
| SPARQL support | No | Yes (Apache Jena) |
| RDF/OWL compliance | No | Yes |
| Property-level security | Yes (MDOs) | Yes (application layer) |
| Classification marking | Partial | Full (defense-grade) |
| Releasability control | No | Yes |
| Open source | No | Yes (100%) |
| Sovereign deployment | No | Yes |
| Cost per deployment | ~$4.1M/year | $0 |
| Vendor lock-in | Complete | None |
| Customizability | Limited to Palantir roadmap | Unlimited |

---

# CONCLUSION: THE $308B MOAT IS A MIRAGE

Palantir's Ontology is brilliant engineering wrapped in proprietary lock-in. But when you reverse-engineer it, you discover:

1. **It's a microservices architecture**, not magic. Five services: OMS, OSS, Funnel, Actions, Object Databases.

2. **It's a heavily materialized layer**, not a federated query engine. They index everything into their own stores.

3. **The core innovation is bundling**: objects + links + actions + governance in one system. Nothing individually is unique.

4. **Every capability has an open-source equivalent**: Neo4j for the graph, Zingg for entity resolution, Graphiti for temporal graphs, Microsoft GraphRAG for AI retrieval.

5. **The real moat is data integration + customer lock-in**, not technology. They make it hard to leave.

**DEFONEOS builds the same thing. Better. Open. Sovereign. For $0.**

```
PALANTIR: $4,100,000/year → Proprietary → US-controlled → Vendor lock-in
DEFONEOS: $0/year           → Open-source → Sovereign   → Full control
```

The future of defense intelligence is **open, sovereign, and AI-native**. The DEFONEOS Ontology is the foundation.

---

**END OF DOCUMENT**

*OPERATION DEEP — ONTOLOGY AS WEAPON*
*Classification: DEFONEOS Internal*
*Version: 1.0.0-DEEP*
