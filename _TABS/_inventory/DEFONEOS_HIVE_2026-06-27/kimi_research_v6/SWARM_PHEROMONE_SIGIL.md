# SWARM PHEROMONE + SIGIL SYSTEM
## The Complete Distributed Swarm Communication and Audit Architecture

**Version:** 1.0.0  
**Classification:** DEFONEOS Core Architecture  
**Codename:** OPERATION SWARM  
**Subsystem:** PHEROMONE (Operational Signaling) + SIGIL (Immutable Audit)  

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Pheromone System Design](#2-pheromone-system-design)
3. [Pheromone Decay and Reinforcement](#3-pheromone-decay-and-reinforcement)
4. [Agent-Specific Pheromone Signatures](#4-agent-specific-pheromone-signatures)
5. [The Waggle Dance](#5-the-waggle-dance)
6. [SIGIL Integration](#6-sigil-integration)
7. [The Pheromone Map](#7-the-pheromone-map)
8. [Emergent Behaviors](#8-emergent-behaviors)
9. [Pheromone Protocol Specification](#9-pheromone-protocol-specification)
10. [Complete Python Implementation](#10-complete-python-implementation)
11. [Swarm Communication Architecture](#11-swarm-communication-architecture)
12. [Security Model](#12-security-model)
13. [Performance Engineering](#13-performance-engineering)
14. [Deployment Topology](#14-deployment-topology)
15. [Appendices](#15-appendices)

---

## 1. EXECUTIVE SUMMARY

### 1.1 Vision

The PHEROMONE + SIGIL system enables DEFONEOS swarm agents to communicate without direct messaging. Instead, agents deposit **digital pheromones** — environmental markers that persist after the agent departs, creating an emergent collective intelligence layer. Combined with **SIGIL** (the immutable audit subsystem), every operational signal becomes a permanent, legally-defensible record.

### 1.2 Core Principles

| Principle | Description |
|-----------|-------------|
| **Environmental Communication** | Agents talk through the world, not to each other |
| **Emergent Coordination** | No central controller; intelligence arises from marker density |
| **Ephemeral Operations, Permanent Audit** | Pheromones fade; SIGILs endure |
| **Agent Polymorphism** | Different agent types read/write different marker languages |
| **Stigmergy** | Agent actions modify environment; environment modifies agent behavior |

### 1.3 Biological Inspirations

```
ANT TRAILS     → Path optimization through evaporative marking
BEE WAGGLE     → Rich metadata communication (direction + distance + quality)
TERMITE CEMENT → Territory claiming and structure building
SLIME MOLD     → Network optimization through chemical gradients
```

### 1.4 System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SWARM PHEROMONE + SIGIL                              │
├─────────────────────────────┬───────────────────────────────────────────────┤
│      PHEROMONE LAYER         │              SIGIL LAYER                      │
│    (Operational, Ephemeral)  │         (Audit, Permanent)                    │
├─────────────────────────────┼───────────────────────────────────────────────┤
│ • Redis (volatile, TTL)      │ • Neo4j (graph persistence)                   │
│ • Real-time heat maps        │ • Immutable signed entries                    │
│ • Decay/reinforcement        │ • Cryptographic audit chain                   │
│ • Emergent pathfinding       │ • Legal evidence trail                        │
│ • Agent-to-agent signaling   │ • Council oversight                           │
├─────────────────────────────┴───────────────────────────────────────────────┤
│                         VISUALIZATION LAYER                                  │
│    • Cesium 3D globe (real-time heat maps)                                   │
│    • UE5 SOV SPACE (tunnel/trail 3D visualization)                           │
│    • Pulsar dashboard (operational metrics)                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. PHEROMONE SYSTEM DESIGN

### 2.1 Core Data Model

Every pheromone is a structured data marker with the following canonical form:

```json
{
  "pheromone_id": "ph_2v8x9k3m7p_1699123400",
  "type": "TRAIL",
  "subtype": "ingress_path",
  "location": {
    "coordinates": [51.5074, -0.1278, 0],
    "region": "EU-WEST",
    "zone": "internet_perimeter",
    "entity_id": "target_44f2a9"
  },
  "timestamp": 1699123400,
  "strength": 0.85,
  "decay_rate": 0.001,
  "ttl_seconds": 3600,
  "creator": {
    "agent_id": "hornet_07_alpha",
    "agent_type": "HORNET",
    "swarm_id": "swarm_delta_7",
    "hive_node": "hive_eu_central_1"
  },
  "data": {
    "target_type": "web_application",
    "vulnerability": "sql_injection",
    "confidence": 0.92,
    "payload_size": 2048,
    "route_quality": 0.78,
    "estimated_value": 8.5
  },
  "visibility": ["HORNET", "DRAGONFLY"],
  "signature": "sig_ed25519_a3f7c2...",
  "sigil_hash": "sh_7b4e2f1a9c8d3e5b6a0f4c2d8e1b7a3c"
}
```

### 2.2 Pheromone Types Specification

#### TRAIL — "I Went This Way"

| Field | Description |
|-------|-------------|
| **Purpose** | Path markers showing viable routes through networks |
| **Visual** | Blue gradient lines, fading with age |
| **TTL** | 1-24 hours (configurable) |
| **Decay** | Linear, 5% per hour default |
| **Data Payload** | Route hops, latency, success rate, detection risk |
| **Read By** | All agent types |

```json
{
  "type": "TRAIL",
  "data": {
    "route": ["hop_1", "hop_2", "hop_3"],
    "latency_ms": 145,
    "success_rate": 0.94,
    "detection_risk": 0.12,
    "protocol": "https",
    "port": 443,
    "bypass_method": "domain_fronting"
  }
}
```

#### ALERT — "Danger Here"

| Field | Description |
|-------|-------------|
| **Purpose** | Warning markers for active threats, IDS, honeypots |
| **Visual** | Red pulsing circles, intensity = severity |
| **TTL** | 30 minutes - 6 hours |
| **Decay** | Fast, 20% per hour |
| **Data Payload** | Threat type, confidence, last_observed, evasion_strategy |
| **Read By** | All agent types (high priority) |

```json
{
  "type": "ALERT",
  "data": {
    "threat_type": "honeypot_detected",
    "confidence": 0.97,
    "indicator": "suspicious_response_timing",
    "last_observed": 1699123400,
    "recommended_evasion": "delayed_disconnect",
    "severity": "critical"
  }
}
```

#### FOOD — "Valuable Target Here"

| Field | Description |
|-------|-------------|
| **Purpose** | Opportunity markers for valuable targets |
| **Visual** | Gold/yellow glowing markers, pulse with value score |
| **TTL** | 6-48 hours |
| **Decay** | Slow, 2% per hour |
| **Data Payload** | Target profile, vulnerability, estimated value, access path |
| **Read By** | HORNET (primary), DRAGONFLY (assessment) |

```json
{
  "type": "FOOD",
  "data": {
    "target_profile": {
      "type": "database_server",
      "os": "Linux 5.15",
      "services": ["postgresql", "redis", "ssh"]
    },
    "vulnerabilities": ["cve_2023_1234", "weak_credentials"],
    "estimated_value": 9.2,
    "data_volume_gb": 450,
    "access_paths": ["ssh_tunnel", "sql_injection"],
    "competition": 0.3
  }
}
```

#### HOME — "Return Path to Hive"

| Field | Description |
|-------|-------------|
| **Purpose** | Navigation markers for exfiltration routes |
| **Visual** | Green directional arrows pointing to safe zones |
| **TTL** | 12-72 hours |
| **Decay** | Very slow, 1% per hour |
| **Data Payload** | Safe return routes, dead drop locations, cutout nodes |
| **Read By** | All agent types (critical for survival) |

```json
{
  "type": "HOME",
  "data": {
    "return_routes": ["route_alpha", "route_beta"],
    "dead_drops": ["drop_1a", "drop_2b"],
    "cutout_nodes": ["co_44f2", "co_88a1"],
    "exfiltration_capacity_mbps": 100,
    "last_verified": 1699120000,
    "security_level": "maximum"
  }
}
```

#### DANGER — "Detected/Destroyed Here"

| Field | Description |
|-------|-------------|
| **Purpose** | Avoidance markers for burned/dead zones |
| **Visual** | Black skull-like markers with expanding rings |
| **TTL** | 24 hours - 30 days |
| **Decay** | Very slow, 0.5% per hour |
| **Data Payload** | Detection method, agent loss, forensic capability |
| **Read By** | All agent types (avoidance triggers) |

```json
{
  "type": "DANGER",
  "data": {
    "incident_type": "agent_detected",
    "agent_id": "worm_12_gamma",
    "detection_method": "behavioral_analysis",
    "forensic_capability": "high",
    "recommended_avoidance_radius_km": 500,
    "burn_time_hours": 72,
    "countermeasures_observed": ["ip_block", "honeytoken"]
  }
}
```

#### RECRUIT — "Need Reinforcements"

| Field | Description |
|-------|-------------|
| **Purpose** | Spawn request markers for swarm reinforcement |
| **Visual** | Purple expanding ripples, frequency = urgency |
| **TTL** | 15 minutes - 4 hours |
| **Decay** | Fast, 15% per hour |
| **Data Payload** | Target, required capabilities, urgency, swarm size |
| **Read By** | HIVE (primary), COUNCIL (authorization) |

```json
{
  "type": "RECRUIT",
  "data": {
    "target": "target_44f2a9",
    "required_capabilities": ["lateral_movement", "privilege_escalation"],
    "urgency": "high",
    "recommended_swarm_size": 5,
    "agent_types_needed": ["HORNET", "KILLER_BEE"],
    "estimated_duration_minutes": 120,
    "success_probability": 0.73
  }
}
```

#### CLAIM — "This Territory Is Mine"

| Field | Description |
|-------|-------------|
| **Purpose** | Ownership markers to prevent friendly fire |
| **Visual** | White flag icons with agent type emblem |
| **TTL** | 1-7 days |
| **Decay** | Slow, 3% per hour; refreshed by continued presence |
| **Data Payload** | Claiming agent, scope, exclusive/shared, expiration |
| **Read By** | All agents (coordination) |

```json
{
  "type": "CLAIM",
  "data": {
    "claim_scope": "target_44f2a9",
    "claim_type": "exclusive_operation",
    "operations_authorized": ["reconnaissance", "exploitation"],
    "expires_at": 1699728200,
    "override_authority": "council_alpha",
    "subordinates_allowed": ["hornet_07_alpha", "hornet_07_beta"]
  }
}
```

### 2.3 Storage Architecture

#### Dual-Storage Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         STORAGE ARCHITECTURE                                 │
├─────────────────────────────┬───────────────────────────────────────────────┤
│         REDIS (Hot)          │              NEO4J (Warm)                     │
│                              │                                               │
│  Key: ph:{region}:{type}:{id} │  Node: Pheromone {all fields}                │
│  Sorted Set: ph:heatmap:{region} │  Relationship: REINFORCES, DECAYS_FROM   │
│  Pub/Sub: ph:stream:{region}   │  Relationship: CREATED_BY → Agent          │
│  Geo: ph:geo:{region}:{type}   │  Relationship: TARGETS → Entity            │
│                              │  Relationship: SUPERCEDED_BY → Pheromone     │
├─────────────────────────────┴───────────────────────────────────────────────┤
│                         SIGIL (Cold - Immutable)                             │
│                                                                              │
│  Storage: Immutable append-only log (IPFS/Blockchain hybrid)                │
│  Format: SHA-256 hashed, Ed25519 signed, timestamp-chained                   │
│  Retention: Permanent                                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Redis Schema

```
# Primary pheromone store (volatile, TTL-based)
SET ph:eu_west:trail:ph_2v8x9k {json_payload} EX 3600

# Geographic index for spatial queries
GEOADD ph:geo:eu_west:trail 51.5074 -0.1278 ph_2v8x9k

# Heatmap sorted set (strength × recency score)
ZADD ph:heatmap:eu_west 170 ph_2v8x9k

# Type index for filtered queries
SADD ph:index:eu_west:trail ph_2v8x9k

# Agent trail index
SADD ph:agent:hornet_07_alpha ph_2v8x9k

# Real-time stream for subscribers
XADD ph:stream:eu_west * type trail agent hornet_07_alpha loc "51.5074,-0.1278"

# Decay tracking - scheduled evaporation
ZADD ph:decay_queue 1699127000 ph_2v8x9k
```

#### Neo4j Schema

```cypher
// Pheromone node
CREATE (p:Pheromone {
  pheromone_id: 'ph_2v8x9k',
  type: 'TRAIL',
  strength: 0.85,
  created_at: 1699123400,
  expires_at: 1699127000,
  location: point({latitude: 51.5074, longitude: -0.1278}),
  region: 'EU-WEST',
  json_payload: '{...}'
})

// Agent who created it
CREATE (a:Agent {agent_id: 'hornet_07_alpha', agent_type: 'HORNET'})
CREATE (a)-[:DEPOSITED {timestamp: 1699123400, initial_strength: 1.0}]->(p)

// Target entity
CREATE (t:Entity {entity_id: 'target_44f2a9', type: 'web_application'})
CREATE (p)-[:TARGETS {relationship: 'path_to'}]->(t)

// Reinforcement chain
CREATE (p2:Pheromone {pheromone_id: 'ph_3m9y0l', ...})
CREATE (p2)-[:REINFORCES {strength_delta: 0.15, timestamp: 1699123600}]->(p)

// Decay events (immutable history)
CREATE (p)-[:DECAYED_TO {new_strength: 0.82, timestamp: 1699123500}]->(p)

// Spatial relationships
CREATE (p)-[:NEARBY {distance_meters: 450}]->(p3)
```

---

## 3. PHEROMONE DECAY AND REINFORCEMENT

### 3.1 Decay Mechanics

Pheromones follow **evaporative decay** modeled on real ant trail pheromones:

```
strength(t) = initial_strength × e^(-decay_rate × t) + reinforcement_boost
```

#### Decay Rate by Type

| Pheromone Type | Base Decay Rate (%/hour) | Half-Life | Rationale |
|----------------|-------------------------|-----------|-----------|
| TRAIL | 5% | ~13.5 hours | Routes stay viable for operations |
| ALERT | 20% | ~3.5 hours | Threats change; stale alerts dangerous |
| FOOD | 2% | ~34 hours | Opportunities persist; quality decays slowly |
| HOME | 1% | ~69 hours | Return paths must be durable |
| DANGER | 0.5% | ~138 hours | Burned zones stay hot for long periods |
| RECRUIT | 15% | ~4.5 hours | Recruitment is time-sensitive |
| CLAIM | 3% | ~23 hours | Claims refreshed by continued presence |

#### Decay Algorithm

```python
import math
import time
from dataclasses import dataclass
from enum import Enum
from typing import Optional, List

class PheromoneType(Enum):
    TRAIL = ("trail", 0.05)
    ALERT = ("alert", 0.20)
    FOOD = ("food", 0.02)
    HOME = ("home", 0.01)
    DANGER = ("danger", 0.005)
    RECRUIT = ("recruit", 0.15)
    CLAIM = ("claim", 0.03)

    def __init__(self, label: str, base_decay_rate: float):
        self.label = label
        self.base_decay_rate = base_decay_rate  # per hour

@dataclass
class DecayConfig:
    base_rate: float
    environmental_factor: float = 1.0  # network turbulence increases decay
    competition_factor: float = 1.0    # overlapping pheromones compete
    temperature_sensitivity: float = 0.0  # anomaly detection increases decay

    @property
    def effective_rate(self) -> float:
        return self.base_rate * self.environmental_factor * self.competition_factor

class PheromoneDecayEngine:
    """
    Handles pheromone evaporation with configurable decay rates,
    environmental factors, and reinforcement processing.
    """

    def __init__(self, redis_client, neo4j_client):
        self.redis = redis_client
        self.neo4j = neo4j_client
        self._decay_handlers = {
            PheromoneType.TRAIL: self._decay_trail,
            PheromoneType.ALERT: self._decay_alert,
            PheromoneType.FOOD: self._decay_food,
            PheromoneType.HOME: self._decay_home,
            PheromoneType.DANGER: self._decay_danger,
            PheromoneType.RECRUIT: self._decay_recruit,
            PheromoneType.CLAIM: self._decay_claim,
        }

    def calculate_current_strength(
        self,
        initial_strength: float,
        pheromone_type: PheromoneType,
        created_at: float,
        reinforcements: List[float] = None,
        config: Optional[DecayConfig] = None
    ) -> float:
        """
        Calculate current strength with exponential decay and reinforcement boosts.

        strength(t) = initial * e^(-rate * t) + sum(reinforcement_i * e^(-rate * (t - t_i)))
        """
        config = config or DecayConfig(pheromone_type.base_decay_rate)
        now = time.time()
        elapsed_hours = (now - created_at) / 3600.0

        # Base exponential decay
        rate = config.effective_rate
        current = initial_strength * math.exp(-rate * elapsed_hours)

        # Add reinforcement contributions (each decays from its own timestamp)
        if reinforcements:
            for r_strength, r_time in reinforcements:
                r_elapsed = (now - r_time) / 3600.0
                current += r_strength * math.exp(-rate * r_elapsed)

        return max(0.0, min(1.0, current))

    def should_evaporate(self, pheromone_id: str, threshold: float = 0.05) -> bool:
        """Check if pheromone has faded below operational threshold."""
        strength = self._get_current_strength(pheromone_id)
        return strength < threshold

    def process_decay_cycle(self, region: str, batch_size: int = 1000) -> dict:
        """
        Periodic decay sweep — processes all pheromones in a region.
        Runs every 60 seconds via Celery beat schedule.
        """
        stats = {"processed": 0, "evaporated": 0, "reinforced": 0, "errors": 0}

        # Fetch pheromones due for decay evaluation
        pheromones = self._fetch_decay_batch(region, batch_size)

        for ph in pheromones:
            try:
                new_strength = self._apply_decay(ph)

                if new_strength <= 0.05:
                    self._evaporate(ph["pheromone_id"])
                    stats["evaporated"] += 1
                else:
                    self._update_strength(ph["pheromone_id"], new_strength)
                    stats["processed"] += 1

            except Exception as e:
                stats["errors"] += 1
                self._log_decay_error(ph["pheromone_id"], e)

        return stats

    def _apply_decay(self, pheromone: dict) -> float:
        """Apply decay formula to a single pheromone."""
        ph_type = PheromoneType[pheromone["type"]]
        handler = self._decay_handlers[ph_type]
        return handler(pheromone)

    def _decay_trail(self, ph: dict) -> float:
        """TRAIL decay: standard exponential with route quality bonus."""
        base = self._calculate_exponential_decay(ph)
        route_quality = ph.get("data", {}).get("route_quality", 0.5)
        # High-quality routes decay slower
        quality_bonus = 1.0 + (route_quality * 0.3)
        return min(1.0, base * quality_bonus)

    def _decay_alert(self, ph: dict) -> float:
        """ALERT decay: fast, with severity slowing decay for critical alerts."""
        base = self._calculate_exponential_decay(ph)
        severity_multiplier = {
            "critical": 0.3,  # critical alerts last longer
            "high": 0.6,
            "medium": 1.0,
            "low": 1.5
        }
        sev = ph.get("data", {}).get("severity", "medium")
        return base * severity_multiplier.get(sev, 1.0)

    def _decay_food(self, ph: dict) -> float:
        """FOOD decay: slow base, but competition from other FOOD markers accelerates."""
        base = self._calculate_exponential_decay(ph)
        # Check for competing FOOD markers nearby
        nearby_food = self._count_nearby(ph, "FOOD", radius_meters=5000)
        competition = 1.0 + (nearby_food * 0.1)
        return base / competition

    def _decay_home(self, ph: dict) -> float:
        """HOME decay: very slow, but verification status affects decay."""
        base = self._calculate_exponential_decay(ph)
        last_verified = ph.get("data", {}).get("last_verified", 0)
        hours_since_verify = (time.time() - last_verified) / 3600
        # Unverified routes decay faster
        if hours_since_verify > 24:
            base *= 0.7  # penalty for stale verification
        return base

    def _decay_danger(self, ph: dict) -> float:
        """DANGER decay: very slow, with forensic capability affecting duration."""
        base = self._calculate_exponential_decay(ph)
        forensic = ph.get("data", {}).get("forensic_capability", "medium")
        forensic_mult = {"high": 0.5, "medium": 1.0, "low": 1.5}
        return base * forensic_mult.get(forensic, 1.0)

    def _decay_recruit(self, ph: dict) -> float:
        """RECRUIT decay: fast, urgency affects rate."""
        base = self._calculate_exponential_decay(ph)
        urgency = ph.get("data", {}).get("urgency", "medium")
        urgency_mult = {"critical": 0.5, "high": 0.7, "medium": 1.0, "low": 1.5}
        return base * urgency_mult.get(urgency, 1.0)

    def _decay_claim(self, ph: dict) -> float:
        """CLAIM decay: moderate, refreshed by agent presence."""
        base = self._calculate_exponential_decay(ph)
        # Claims are refreshed if the claiming agent is still active
        agent_id = ph["creator"]["agent_id"]
        if self._is_agent_active(agent_id):
            base = min(1.0, base * 1.5)  # refresh boost
        return base

    def _calculate_exponential_decay(self, ph: dict) -> float:
        """Core exponential decay calculation."""
        ph_type = PheromoneType[ph["type"]]
        elapsed = (time.time() - ph["timestamp"]) / 3600.0
        rate = ph.get("decay_rate", ph_type.base_decay_rate)
        return ph["strength"] * math.exp(-rate * elapsed)
```

### 3.2 Reinforcement Mechanics

When an agent encounters an existing pheromone and confirms its validity, it **reinforces** it:

```
new_strength = current_strength + (agent_reinforcement_value × confirmation_multiplier)
```

#### Reinforcement Rules

| Scenario | Reinforcement Value | Cap |
|----------|-------------------|-----|
| Agent follows trail successfully | +0.15 | 1.0 |
| Agent confirms alert (threat still present) | +0.25 | 1.0 |
| Agent exploits FOOD target successfully | +0.30 | 1.0 |
| Agent uses HOME route successfully | +0.10 | 1.0 |
| Agent confirms DANGER still active | +0.20 | 1.0 |
| Multiple agents confirm same marker | +0.05 per agent | 0.95 |
| Agent contradicts marker (false positive) | -0.30 | 0.0 |

#### Reinforcement Algorithm

```python
class ReinforcementEngine:
    """Handles pheromone reinforcement when agents confirm markers."""

    REINFORCEMENT_VALUES = {
        "trail_followed": 0.15,
        "alert_confirmed": 0.25,
        "food_exploited": 0.30,
        "home_used": 0.10,
        "danger_confirmed": 0.20,
        "multi_agent_bonus": 0.05,
        "contradiction": -0.30,
    }

    STRENGTH_CAP = 1.0
    STRENGTH_FLOOR = 0.0

    async def reinforce(
        self,
        pheromone_id: str,
        reinforcing_agent_id: str,
        action_type: str,
        confirmation_data: dict = None
    ) -> float:
        """
        Reinforce a pheromone based on agent confirmation.

        Returns new strength value. Creates reinforcement record in SIGIL.
        """
        # Fetch current pheromone
        ph = await self._get_pheromone(pheromone_id)
        if not ph:
            raise ValueError(f"Pheromone {pheromone_id} not found")

        # Calculate reinforcement
        base_value = self.REINFORCEMENT_VALUES.get(action_type, 0.05)
        confirmation_multiplier = self._calculate_confirmation_multiplier(
            ph, confirmation_data
        )
        agent_type_multiplier = self._get_agent_type_multiplier(
            ph["type"], ph["creator"]["agent_type"]
        )

        reinforcement = base_value * confirmation_multiplier * agent_type_multiplier

        # Apply with cap
        new_strength = min(
            self.STRENGTH_CAP,
            ph["strength"] + reinforcement
        )

        # Write reinforcement to Redis (fast)
        await self._update_strength(pheromone_id, new_strength)

        # Record reinforcement event in Neo4j (graph)
        await self._record_reinforcement_graph(
            pheromone_id, reinforcing_agent_id, reinforcement, new_strength
        )

        # Create SIGIL entry (permanent audit)
        await self._create_sigil_reinforcement_entry(
            pheromone_id, reinforcing_agent_id, action_type, reinforcement
        )

        # Publish reinforcement event
        await self._publish_reinforcement_event(
            pheromone_id, ph["location"]["region"], new_strength
        )

        return new_strength

    def _calculate_confirmation_multiplier(
        self, ph: dict, confirmation_data: dict
    ) -> float:
        """
        Adjust reinforcement based on confirmation quality.
        High-confidence confirmations = higher reinforcement.
        """
        if not confirmation_data:
            return 1.0

        confidence = confirmation_data.get("confidence", 0.5)
        recency = confirmation_data.get("recency_score", 0.5)

        # Quality score: confidence * recency
        quality = confidence * recency

        # Map 0-1 quality to 0.5-1.5 multiplier
        return 0.5 + quality

    def _get_agent_type_multiplier(
        self, pheromone_type: str, creator_agent_type: str
    ) -> float:
        """
        Same-type reinforcement is stronger (ants trust their own species).
        Cross-type reinforcement is weaker but still valid.
        """
        if pheromone_type == creator_agent_type:
            return 1.2
        return 0.8
```

### 3.3 Evaporation Scheduling

```python
class EvaporationScheduler:
    """
    Manages pheromone lifecycle with priority-based evaporation.
    Uses Redis sorted sets for efficient time-based eviction.
    """

    async def schedule_evaporation(self, pheromone_id: str, ttl_seconds: float):
        """Add pheromone to decay queue with TTL-based priority score."""
        evaporation_time = time.time() + ttl_seconds
        await self.redis.zadd("ph:decay_queue", {pheromone_id: evaporation_time})

    async def run_evaporation_sweep(self, batch_size: int = 500) -> dict:
        """
        Process evaporation queue — remove expired pheromones.
        Called every 30 seconds by Celery beat.
        """
        now = time.time()
        stats = {"evaporated": 0, "deferred": 0}

        # Fetch pheromones past their evaporation time
        expired = await self.redis.zrangebyscore(
            "ph:decay_queue", 0, now, start=0, num=batch_size
        )

        for ph_id in expired:
            # Double-check strength before removal
            current_strength = await self._get_strength(ph_id)

            if current_strength <= 0.05:
                await self._evaporate_pheromone(ph_id)
                stats["evaporated"] += 1
            else:
                # Still has strength — defer evaporation
                await self._defer_evaporation(ph_id, current_strength)
                stats["deferred"] += 1

        return stats

    async def _evaporate_pheromone(self, pheromone_id: str):
        """
        Complete pheromone removal with full cleanup.
        Creates final SIGIL entry marking evaporation.
        """
        ph = await self._get_pheromone(pheromone_id)

        # Remove from all Redis indexes
        pipe = self.redis.pipeline()
        pipe.delete(f"ph:{pheromone_id}")
        pipe.zrem("ph:decay_queue", pheromone_id)
        # ... remove from all other indexes
        await pipe.execute()

        # Mark as evaporated in Neo4j (don't delete — keep graph history)
        await self.neo4j.run("""
            MATCH (p:Pheromone {pheromone_id: $ph_id})
            SET p.evaporated_at = $now,
                p.final_strength = p.strength,
                p.status = 'evaporated'
        """, ph_id=pheromone_id, now=time.time())

        # Create SIGIL evaporation record
        await self.sigil.record_evaporation(pheromone_id, ph)
```

---

## 4. AGENT-SPECIFIC PHEROMONE SIGNATURES

### 4.1 Agent Pheromone Language Matrix

Each agent type has a unique "pheromone dialect" — what it writes, what it reads, and how it responds:

```
┌─────────────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│                 │  WRITE   │  READ    │ PRIORITY │ RESPONSE │  LIFESPAN│
├─────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ WORM            │ TRAIL    │ TRAIL    │ Stealth  │ Cautious │  Long    │
│                 │ HOME     │ ALERT    │ first    │ follow   │  48-168h │
│                 │ FOOD     │ DANGER   │          │ subtle   │          │
│                 │          │          │          │ trails   │          │
├─────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ HORNET          │ TRAIL    │ FOOD     │ Attack   │ Aggres-  │ Short    │
│                 │ ALERT    │ ALERT    │ value    │ sive     │  1-12h   │
│                 │ DANGER   │ TRAIL    │ first    │ rapid    │          │
│                 │          │          │          │ strikes  │          │
├─────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ DRAGONFLY       │ FOOD     │ ALL      │ Intel    │ Analy-   │ Long     │
│                 │ RECRUIT  │ types    │ quality  │ tical    │  24-72h  │
│                 │ CLAIM    │          │ first    │ recruit  │          │
│                 │          │          │          │ others   │          │
├─────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ KILLER BEE      │ ALERT    │ RECRUIT  │ Swarm    │ Mass     │ Very     │
│                 │ DANGER   │ FOOD     │ coord.   │ deploy-  │  short   │
│                 │ CLAIM    │ CLAIM    │ first    │ ment     │  15-60m  │
└─────────────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
```

### 4.2 WORM Pheromone Signature

```python
class WormPheromoneDialect:
    """
    WORM agents are infrastructure specialists.
    Their pheromones are subtle, detailed, and focused on persistence.
    """

    WRITE_TYPES = ["TRAIL", "HOME", "FOOD"]
    READ_TYPES = ["TRAIL", "ALERT", "DANGER"]

    # WORM pheromones have extended TTL — they build long-term infrastructure
    TTL_MULTIPLIER = 3.0

    # WORM pheromones are subtle — lower initial strength but decay slower
    STEALTH_FACTOR = 0.6  # reduced visibility to opponents

    # WORM pheromone data payloads are infrastructure-focused
    TRAIL_DATA_SCHEMA = {
        "tunnel_id": "string          # Unique tunnel identifier",
        "protocol": "string           # tunnel protocol: dns, icmp, https",
        "latency_ms": "float          # Measured round-trip",
        "bandwidth_mbps": "float      # Available throughput",
        "persistence_method": "string  # How tunnel is maintained",
        "redundancy_paths": ["string"] # Alternative routes",
        "detection_fingerprint": "string  # Opponent fingerprint hash",
        "last_health_check": "timestamp",
        "stability_score": "float     # 0-1 tunnel stability"
    }

    FOOD_DATA_SCHEMA = {
        "target_type": "string        # infrastructure, endpoint, service",
        "persistence_vector": "string # How to maintain access",
        "privilege_level": "string    # user, admin, system, root",
        "lateral_opportunities": ["string"],
        "data_classification": "string # public, internal, secret, top_secret",
        "exfiltration_paths": ["string"],
        "long_term_value": "float     # 0-1 sustained value score"
    }

    HOME_DATA_SCHEMA = {
        "return_tunnels": ["string"]  # Active tunnel IDs for return",
        "dead_drop_locations": [{
            "type": "dns_txt|pastebin|github_gist|s3_bucket",
            "address": "string",
            "encryption_key_id": "string",
            "last_sync": "timestamp"
        }],
        "fallback_channels": ["string"],
        "heartbeat_interval_seconds": "int"
    }

    def create_trail_pheromone(self, route_data: dict) -> dict:
        """WORM trail pheromones include deep infrastructure detail."""
        return {
            "type": "TRAIL",
            "strength": 0.7 * self.STEALTH_FACTOR,
            "decay_rate": 0.015,  # WORM trails decay very slowly
            "ttl_seconds": 86400 * 3,  # 3 days
            "data": {
                "tunnel_id": route_data["tunnel_id"],
                "protocol": route_data["protocol"],
                "latency_ms": route_data["latency"],
                "bandwidth_mbps": route_data["bandwidth"],
                "persistence_method": route_data["persistence"],
                "redundancy_paths": route_data.get("alternatives", []),
                "detection_fingerprint": self._hash_fingerprint(route_data),
                "last_health_check": time.time(),
                "stability_score": route_data.get("stability", 0.8),
                "worm_specific": {
                    "egress_node": route_data["egress"],
                    "ingress_node": route_data["ingress"],
                    "tunnel_depth": route_data.get("depth", 1),
                    "chaining_possible": route_data.get("chainable", False)
                }
            },
            "visibility": ["WORM", "DRAGONFLY"]  # Only worms and dragonflies can read
        }

    def read_pheromone(self, pheromone: dict) -> dict:
        """
        WORMs are cautious — they heavily weight DANGER and ALERT markers.
        They avoid areas with any danger signals, even weak ones.
        """
        if pheromone["type"] == "DANGER":
            # WORMs treat all danger as critical — maximum avoidance
            return {
                "action": "AVOID",
                "avoidance_radius_km": pheromone["data"].get("recommended_avoidance_radius_km", 100),
                "confidence": 0.95,
                "reason": "WORM safety protocol: any danger signal triggers avoidance"
            }

        if pheromone["type"] == "ALERT":
            severity = pheromone["data"].get("severity", "medium")
            if severity in ["critical", "high"]:
                return {"action": "AVOID", "confidence": 0.9}
            return {"action": "CAUTIOUS_APPROACH", "confidence": 0.6}

        if pheromone["type"] == "TRAIL":
            # WORMs evaluate trail quality carefully
            stability = pheromone["data"].get("stability_score", 0.5)
            if stability > 0.7:
                return {"action": "FOLLOW", "confidence": stability}
            return {"action": "EVALUATE", "confidence": stability}

        if pheromone["type"] == "FOOD":
            # WORMs look for infrastructure value, not quick wins
            long_term = pheromone["data"].get("long_term_value", 0)
            if long_term > 0.6:
                return {"action": "INVESTIGATE", "confidence": long_term}
            return {"action": "IGNORE", "confidence": 1 - long_term}

        return {"action": "IGNORE", "confidence": 0.5}
```

### 4.3 HORNET Pheromone Signature

```python
class HornetPheromoneDialect:
    """
    HORNET agents are offensive strike specialists.
    Their pheromones are aggressive, short-lived, and attack-focused.
    """

    WRITE_TYPES = ["TRAIL", "ALERT", "DANGER", "FOOD"]
    READ_TYPES = ["FOOD", "ALERT", "TRAIL"]

    # HORNET pheromones are intense but brief — like a wasp sting
    INTENSITY_MULTIPLIER = 1.4  # higher initial strength
    TTL_MULTIPLIER = 0.3  # much shorter lifespan

    # HORNET pheromones decay fast — operations are rapid
    DECAY_MULTIPLIER = 2.5  # 2.5x normal decay rate

    FOOD_DATA_SCHEMA = {
        "target_type": "string        # web_app, api, database, cloud_service",
        "vulnerability": "string      # Primary exploitable weakness",
        "exploit_reliability": "float  # 0-1 probability of successful exploit",
        "time_to_compromise_seconds": "int  # Estimated compromise time",
        "payload_requirements": ["string"],
        "post_exploit_actions": ["string"],
        "estimated_value": "float     # 0-10 immediate value score",
        "risk_level": "float          # 0-1 detection probability"
    }

    ALERT_DATA_SCHEMA = {
        "threat_type": "string        # ids, honeypot, analyst, countermeasure",
        "confidence": "float",
        "response_required": "bool    # Does this threat need immediate action?",
        "evasion_strategy": "string   # Recommended counter-tactic",
        "kill_switch_triggered": "bool"
    }

    TRAIL_DATA_SCHEMA = {
        "attack_vector": "string      # Path to target",
        "weaponized_payload": "string # Payload to deploy",
        "delivery_method": "string    # How payload reaches target",
        "expected_outcome": "string   # What happens on success",
        "time_estimate_seconds": "int",
        "prerequisites": ["string"]   # What must be in place first"
    }

    def create_food_pheromone(self, target_data: dict) -> dict:
        """HORNET FOOD markers are aggressive recruitment signals."""
        return {
            "type": "FOOD",
            "strength": 0.9 * self.INTENSITY_MULTIPLIER,  # Strong initial signal
            "decay_rate": 0.10 * self.DECAY_MULTIPLIER,  # Fast decay
            "ttl_seconds": 3600 * 2,  # 2 hours
            "data": {
                "target_type": target_data["type"],
                "vulnerability": target_data["vuln"],
                "exploit_reliability": target_data["reliability"],
                "time_to_compromise_seconds": target_data["ttc"],
                "payload_requirements": target_data.get("payloads", []),
                "post_exploit_actions": target_data.get("post_exploit", []),
                "estimated_value": target_data["value"],
                "risk_level": target_data["risk"],
                "hornet_specific": {
                    "swarm_size_recommended": max(1, int(target_data["value"] / 3)),
                    "strike_window_start": time.time(),
                    "strike_window_end": time.time() + 7200,
                    "coordination_required": target_data["value"] > 7
                }
            },
            "visibility": ["HORNET", "KILLER_BEE", "DRAGONFLY"]
        }

    def read_pheromone(self, pheromone: dict) -> dict:
        """
        HORNETs are aggressive — they prioritize FOOD and attack.
        They ignore subtle signals and act on clear opportunities.
        """
        if pheromone["type"] == "FOOD":
            value = pheromone["data"].get("estimated_value", 0)
            risk = pheromone["data"].get("risk_level", 0.5)
            score = value * (1 - risk)  # value-adjusted-for-risk

            if score > 6:
                return {"action": "ATTACK_IMMEDIATE", "priority": score, "confidence": 0.85}
            elif score > 3:
                return {"action": "ATTACK_WHEN_READY", "priority": score, "confidence": 0.7}
            return {"action": "CONSIDER", "priority": score, "confidence": 0.5}

        if pheromone["type"] == "ALERT":
            severity = pheromone["data"].get("severity", "medium")
            if severity == "critical":
                return {"action": "ABORT_AND_MARK_DANGER", "confidence": 0.95}
            return {"action": "HEIGHTENED_ALERT", "confidence": 0.7}

        if pheromone["type"] == "TRAIL":
            # HORNETs only care about fast attack routes
            time_est = pheromone["data"].get("time_estimate_seconds", 9999)
            if time_est < 300:  # Under 5 minutes
                return {"action": "FOLLOW", "confidence": 0.8}
            return {"action": "IGNORE", "confidence": 0.5}

        if pheromone["type"] == "DANGER":
            # HORNETs respect danger but may override for high-value targets
            return {"action": "EVALUTE_OVERRIDE", "confidence": 0.6}

        return {"action": "IGNORE", "confidence": 0.5}
```

### 4.4 DRAGONFLY Pheromone Signature

```python
class DragonflyPheromoneDialect:
    """
    DRAGONFLY agents are intelligence specialists.
    Their pheromones are rich in metadata, long-lived, and analytical.
    They perform the "waggle dance" to recruit other agents.
    """

    WRITE_TYPES = ["FOOD", "RECRUIT", "CLAIM", "TRAIL"]
    READ_TYPES = ["ALL"]  # Dragonflies read everything — they're the analysts

    # DRAGONFLY pheromones are information-dense and durable
    TTL_MULTIPLIER = 2.0
    DECAY_MULTIPLIER = 0.5  # Half normal decay — their intel is valuable

    # The Waggle Dance — rich information broadcast
    WAGGLE_DANCE_SCHEMA = {
        "target_coordinates": {
            "lat": "float",
            "lon": "float",
            "altitude_m": "float",
            "network_location": "string  # IP, domain, ASN"
        },
        "target_type": "string         # Classification of target",
        "target_value": "float         # 0-10 assessed value",
        "direction": "float            # Bearing to target (0-360)",
        "distance_estimate_km": "float",
        "quality": "float              # 0-1 confidence in assessment",
        "risk_assessment": {
            "detection_probability": "float",
            "countermeasure_strength": "float",
            "estimated_defender_skill": "float"
        },
        "recommended_agent_type": "string  # WORM/HORNET/KILLER_BEE",
        "recommended_swarm_size": "int",
        "optimal_timing": {
            "start_window": "timestamp",
            "end_window": "timestamp",
            "timezone": "string"
        },
        "supporting_intel": ["string"],
        "corroborating_agents": ["agent_id"],
        "information_freshness": "float  # 0-1 recency score"
    }

    def create_waggle_dance(self, intel: dict) -> dict:
        """
        Create a rich informational pheromone that serves as
        a 'waggle dance' to recruit other agents to a target.
        """
        return {
            "type": "RECRUIT",  # Recruitment via waggle dance
            "subtype": "waggle_dance",
            "strength": 0.75,
            "decay_rate": 0.075,  # Medium decay — intel stays fresh
            "ttl_seconds": 14400,  # 4 hours
            "data": {
                "waggle_dance": {
                    "target_coordinates": intel["location"],
                    "target_type": intel["target_type"],
                    "target_value": intel["value"],
                    "direction": self._calculate_bearing(intel["location"]),
                    "distance_estimate_km": intel["distance_km"],
                    "quality": intel["confidence"],
                    "risk_assessment": intel["risk"],
                    "recommended_agent_type": self._recommend_agent_type(intel),
                    "recommended_swarm_size": self._calculate_swarm_size(intel),
                    "optimal_timing": self._calculate_timing_window(intel),
                    "supporting_intel": intel.get("evidence", []),
                    "corroborating_agents": intel.get("corroboration", []),
                    "information_freshness": self._calculate_freshness(intel)
                },
                "dragonfly_analysis": {
                    "assessment_methodology": intel.get("method", "unknown"),
                    "confidence_factors": intel.get("confidence_factors", []),
                    "alternative_interpretations": intel.get("alternatives", []),
                    "recommended_follow_up": intel.get("next_steps", [])
                }
            },
            "visibility": ["HORNET", "KILLER_BEE", "DRAGONFLY"]  # Recruit strikers
        }

    def read_pheromone(self, pheromone: dict) -> dict:
        """
        DRAGONFLYs read ALL pheromone types and synthesize intelligence.
        They cross-reference, corroborate, and generate waggle dances.
        """
        # Dragonflies always ingest and analyze
        analysis = {
            "action": "ANALYZE",
            "corroboration_score": 0.0,
            "confidence_adjustment": 0.0,
            "recommended_response": None
        }

        if pheromone["type"] == "FOOD":
            # Dragonflies verify food claims before endorsing
            analysis["corroboration_score"] = self._verify_food_claim(pheromone)
            if analysis["corroboration_score"] > 0.7:
                analysis["recommended_response"] = "CREATE_WAGGLE_DANCE"
            else:
                analysis["recommended_response"] = "INVESTIGATE_FURTHER"

        elif pheromone["type"] == "ALERT":
            analysis["confidence_adjustment"] = self._assess_alert_validity(pheromone)
            if analysis["confidence_adjustment"] > 0.8:
                analysis["recommended_response"] = "BROADCAST_WARNING"
            else:
                analysis["recommended_response"] = "VERIFY_BEFORE_ACTION"

        elif pheromone["type"] == "TRAIL":
            analysis["route_quality"] = self._assess_route(pheromone)

        elif pheromone["type"] == "RECRUIT":
            # Dragonflies monitor recruitment — may join or redirect
            analysis["recruitment_urgency"] = self._assess_recruitment(pheromone)

        elif pheromone["type"] == "DANGER":
            analysis["threat_level"] = self._assess_threat(pheromone)
            analysis["recommended_response"] = "AVOID_AND_LOG"

        return analysis

    def _recommend_agent_type(self, intel: dict) -> str:
        """Recommend which agent type should handle a target."""
        target_type = intel.get("target_type", "")
        value = intel.get("value", 0)
        complexity = intel.get("complexity", 0.5)

        if complexity > 0.7 and value > 5:
            return "WORM"  # Complex, valuable targets need infrastructure
        elif value > 7:
            return "HORNET"  # High-value = direct strike
        elif value > 5:
            return "KILLER_BEE"  # Medium value = swarm
        return "HORNET"  # Default

    def _calculate_swarm_size(self, intel: dict) -> int:
        """Calculate optimal swarm size based on target value and defenses."""
        value = intel.get("value", 5)
        defenses = intel.get("risk", {}).get("countermeasure_strength", 0.5)
        base_size = max(1, int(value / 2))
        defense_multiplier = 1 + defenses
        return min(20, int(base_size * defense_multiplier))

    def _calculate_timing_window(self, intel: dict) -> dict:
        """Calculate optimal attack timing based on defender patterns."""
        timezone = intel.get("timezone", "UTC")
        # Target off-hours in defender's timezone
        return {
            "start_window": intel.get("optimal_start", time.time() + 3600),
            "end_window": intel.get("optimal_end", time.time() + 7200),
            "timezone": timezone,
            "rationale": f"Target off-hours in {timezone}"
        }
```

### 4.5 KILLER BEE Pheromone Signature

```python
class KillerBeePheromoneDialect:
    """
    KILLER BEE agents are swarm coordination specialists.
    Their pheromones are binary, mass-deployed, and short-lived.
    They communicate in simple signals for rapid swarm coordination.
    """

    WRITE_TYPES = ["ALERT", "DANGER", "CLAIM", "RECRUIT"]
    READ_TYPES = ["RECRUIT", "FOOD", "CLAIM"]

    # KILLER BEE pheromones are massive but ephemeral
    MASS_MULTIPLIER = 5.0  # 5x marker density
    TTL_MULTIPLIER = 0.1  # Very short lifespan

    # Binary communication — simple states
    SIGNAL_STATES = {
        "ATTACK": {"icon": "sword", "color": "#FF0000", "pulse_freq": 2.0},
        "HOLD": {"icon": "shield", "color": "#FFFF00", "pulse_freq": 0.5},
        "RETREAT": {"icon": "flag", "color": "#00FF00", "pulse_freq": 1.0},
        "SUPPORT": {"icon": "plus", "color": "#00FFFF", "pulse_freq": 1.5},
        "OVERWHELM": {"icon": "bolt", "color": "#FF00FF", "pulse_freq": 3.0}
    }

    def create_swarm_signal(self, signal_type: str, target: dict) -> list:
        """
        KILLER BEEs deposit MASS pheromones — many markers at once.
        This creates a strong concentration signal for swarm coordination.
        """
        pheromones = []
        base_strength = self.SIGNAL_STATES[signal_type]["color"]

        # Create a cluster of pheromones around the target
        for i in range(5):  # Mass marker deployment
            ph = {
                "type": "RECRUIT" if signal_type in ["ATTACK", "OVERWHELM"] else "ALERT",
                "subtype": f"killer_bee_{signal_type.lower()}",
                "strength": 0.9,
                "decay_rate": 0.30,  # Very fast decay
                "ttl_seconds": 900,  # 15 minutes
                "data": {
                    "swarm_signal": signal_type,
                    "target": target,
                    "swarm_coordinates": self._generate_swarm_formation(target, i),
                    "rally_point": target["location"],
                    "estimated_swarm_arrival": time.time() + 300,
                    "killer_bee_specific": {
                        "formation_type": "swarm" if signal_type == "OVERWHELM" else "line",
                        "front_bees": max(3, target.get("value", 5) // 2),
                        "support_bees": max(2, target.get("value", 5) // 3),
                        "signal_redundancy": 5,  # 5 markers for reliability
                        "ack_required": True
                    }
                },
                "visibility": ["KILLER_BEE", "HORNET"]
            }
            pheromones.append(ph)

        return pheromones

    def read_pheromone(self, pheromone: dict) -> dict:
        """
        KILLER BEEs respond to swarm signals with coordinated action.
        They follow RECRUIT pheromones and amplify swarm strength.
        """
        if pheromone["type"] == "RECRUIT":
            swarm_signal = pheromone["data"].get("swarm_signal", "ATTACK")
            urgency = pheromone["data"].get("urgency", "medium")

            if swarm_signal == "OVERWHELM":
                return {
                    "action": "MASS_SWARM",
                    "confidence": 0.9,
                    "formation": "swarm",
                    "priority": "maximum"
                }
            elif swarm_signal == "ATTACK":
                return {
                    "action": "COORDINATED_STRIKE",
                    "confidence": 0.85,
                    "formation": "wedge",
                    "priority": "high"
                }
            elif urgency == "critical":
                return {
                    "action": "IMMEDIATE_DEPLOY",
                    "confidence": 0.9,
                    "priority": "critical"
                }
            return {
                "action": "JOIN_SWARM",
                "confidence": 0.7,
                "priority": "medium"
            }

        if pheromone["type"] == "FOOD":
            # KILLER BEEs swarm high-value food
            value = pheromone["data"].get("estimated_value", 0)
            if value > 8:
                return {
                    "action": "SWARM_FOR_FOOD",
                    "confidence": 0.9,
                    "recommended_swarm_size": min(20, int(value * 2))
                }
            return {"action": "CONSIDER", "confidence": 0.5}

        if pheromone["type"] == "CLAIM":
            # KILLER BEEs respect claims or override with sufficient numbers
            return {"action": "RESPECT_CLAIM", "confidence": 0.8}

        return {"action": "AWAIT_ORDERS", "confidence": 0.5}
```

---

## 5. THE WAGGLE DANCE

### 5.1 Biological Foundation

Honey bees perform a **waggle dance** to communicate food source information:
- **Direction**: Angle of the waggle relative to vertical = direction to food
- **Distance**: Duration of waggle = distance to food
- **Quality**: Enthusiasm of the dance = food source quality

### 5.2 Digital Waggle Dance Specification

The DEFONEOS Waggle Dance is a structured information-rich pheromone that enables sophisticated agent-to-agent recruitment:

```json
{
  "pheromone_id": "ph_waggle_2v8x9k3m",
  "type": "RECRUIT",
  "subtype": "waggle_dance",
  "dance_version": "2.0",

  "choreography": {
    "angle_degrees": 45.5,
    "distance_km": 1250.3,
    "duration_ms": 4500,
    "enthusiasm": 0.92,
    "repetitions": 12
  },

  "target_profile": {
    "coordinates": {
      "lat": 48.8566,
      "lon": 2.3522,
      "altitude_m": 0,
      "network_cidr": "203.0.113.0/24",
      "asn": "AS15169"
    },
    "classification": {
      "type": "cloud_database",
      "provider": "gcp",
      "service": "cloudsql",
      "data_classification": "confidential",
      "estimated_records": 5000000
    },
    "value_assessment": {
      "score": 9.2,
      "currency": "data_volume",
      "estimated_gb": 450,
      "monetization_paths": ["ransom", "sale", "leverage"],
      "uniqueness": 0.85
    }
  },

  "risk_assessment": {
    "detection_probability": 0.15,
    "defender_maturity": "medium",
    "incident_response_speed": "slow",
    "forensic_capability": "low",
    "countermeasure_observed": ["basic_ids", "log_monitoring"]
  },

  "recommendation": {
    "agent_type": "HORNET",
    "swarm_size": 3,
    "tactics": ["sql_injection", "credential_stuffing", "lateral_movement"],
    "time_window": {
      "start": 1699200000,
      "end": 1699286400,
      "timezone": "Europe/Paris",
      "rationale": "Defender off-hours, minimal monitoring"
    }
  },

  "corroboration": {
    "confirming_agents": ["dragonfly_03", "worm_08"],
    "confirmation_count": 2,
    "confidence_score": 0.88,
    "last_verified": 1699120000
  },

  "creator": {
    "agent_id": "dragonfly_07_beta",
    "agent_type": "DRAGONFLY",
    "reputation_score": 0.95,
    "successful_dances": 47,
    "failed_dances": 3
  },

  "signature": "sig_ed25519_dance_7b4e2f...",
  "sigil_hash": "sh_waggle_9c8d3e5b6a0f4c2d"
}
```

### 5.3 Waggle Dance Protocol

```python
class WaggleDanceProtocol:
    """
    Implements the digital equivalent of the bee waggle dance.
    Dragonflies perform dances; Hornets and Killer Bees follow them.
    """

    # Dance enthusiasm thresholds
    ENTHUSIASM_LEVELS = {
        (0.0, 0.3): "minimal",      # Quick mention, low priority
        (0.3, 0.6): "moderate",     # Standard dance, normal priority
        (0.6, 0.8): "enthusiastic", # Extended dance, high priority
        (0.8, 1.0): "frenzied"      # Repeated urgent dancing, maximum priority
    }

    # Dance interpretation by agent type
    INTERPRETATION = {
        "HORNET": {
            "follow_threshold": 0.6,      # Minimum enthusiasm to follow
            "swarm_size_multiplier": 1.0,
            "response_time_seconds": 300,  # 5 minutes to mobilize
            "max_distance_km": 5000
        },
        "KILLER_BEE": {
            "follow_threshold": 0.5,
            "swarm_size_multiplier": 2.0,  # Double recommended swarm
            "response_time_seconds": 120,  # 2 minutes to swarm
            "max_distance_km": 10000
        },
        "WORM": {
            "follow_threshold": 0.8,       # Worms are cautious
            "swarm_size_multiplier": 0.5,
            "response_time_seconds": 1800, # 30 minutes to establish
            "max_distance_km": 2000
        }
    }

    async def perform_dance(
        self,
        performing_agent_id: str,
        target_intel: dict,
        location: dict
    ) -> str:
        """
        A DRAGONFLY performs a waggle dance to recruit other agents.
        Returns the pheromone_id of the created dance marker.
        """
        # Calculate dance parameters from intel
        choreography = self._calculate_choreography(target_intel, location)

        # Build the waggle dance pheromone
        dance = {
            "pheromone_id": f"ph_waggle_{self._generate_id()}",
            "type": "RECRUIT",
            "subtype": "waggle_dance",
            "dance_version": "2.0",
            "choreography": choreography,
            "target_profile": await self._build_target_profile(target_intel),
            "risk_assessment": await self._assess_risk(target_intel),
            "recommendation": self._generate_recommendation(target_intel),
            "corroboration": await self._gather_corroboration(target_intel),
            "creator": await self._get_creator_info(performing_agent_id),
            "timestamp": time.time(),
            "strength": choreography["enthusiasm"],
            "location": location
        }

        # Sign the dance
        dance["signature"] = await self._sign_dance(dance, performing_agent_id)

        # Deposit as pheromone (creates SIGIL automatically)
        pheromone_id = await self.pheromone_system.deposit(dance)

        # Publish to region stream for real-time agents
        await self._broadcast_dance(dance)

        # Create SIGIL entry for audit trail
        await self.sigil.record_waggle_dance(dance)

        return pheromone_id

    async def interpret_dance(
        self,
        dance_pheromone: dict,
        observing_agent_id: str,
        agent_type: str
    ) -> dict:
        """
        An agent observes a waggle dance and decides whether to follow.
        Returns a follow decision with confidence and parameters.
        """
        config = self.INTERPRETATION.get(agent_type, self.INTERPRETATION["HORNET"])

        enthusiasm = dance_pheromone["choreography"]["enthusiasm"]
        distance = dance_pheromone["choreography"]["distance_km"]
        confidence = dance_pheromone["corroboration"]["confidence_score"]
        value = dance_pheromone["target_profile"]["value_assessment"]["score"]

        # Decision factors
        enthusiasm_pass = enthusiasm >= config["follow_threshold"]
        distance_pass = distance <= config["max_distance_km"]
        confidence_pass = confidence >= 0.5

        # Calculate follow score
        follow_score = (
            enthusiasm * 0.35 +
            confidence * 0.25 +
            (value / 10.0) * 0.25 +
            (1 - min(1, distance / config["max_distance_km"])) * 0.15
        )

        if enthusiasm_pass and distance_pass and confidence_pass:
            return {
                "decision": "FOLLOW",
                "confidence": follow_score,
                "swarm_size": int(
                    dance_pheromone["recommendation"]["swarm_size"] *
                    config["swarm_size_multiplier"]
                ),
                "response_time_seconds": config["response_time_seconds"],
                "target": dance_pheromone["target_profile"]["coordinates"],
                "tactics": dance_pheromone["recommendation"]["tactics"],
                "time_window": dance_pheromone["recommendation"]["time_window"],
                "dance_id": dance_pheromone["pheromone_id"]
            }
        else:
            reasons = []
            if not enthusiasm_pass:
                reasons.append("insufficient_enthusiasm")
            if not distance_pass:
                reasons.append("target_too_distant")
            if not confidence_pass:
                reasons.append("low_confidence")

            return {
                "decision": "IGNORE",
                "confidence": 1 - follow_score,
                "reasons": reasons,
                "follow_score": follow_score
            }

    def _calculate_choreography(
        self, target_intel: dict, current_location: dict
    ) -> dict:
        """
        Calculate waggle dance choreography parameters.
        These encode direction, distance, and quality information.
        """
        target_loc = target_intel["location"]

        # Direction (bearing from current location to target)
        angle = self._calculate_bearing(current_location, target_loc)

        # Distance
        distance_km = self._haversine_distance(current_location, target_loc)

        # Duration encodes distance (longer = farther)
        base_duration = 1000  # 1 second base
        distance_duration = min(10000, distance_km * 2)  # 2ms per km
        duration_ms = base_duration + distance_duration

        # Enthusiasm encodes target value and confidence
        value = target_intel.get("value", 5)
        confidence = target_intel.get("confidence", 0.5)
        enthusiasm = min(1.0, (value / 10) * 0.6 + confidence * 0.4)

        # Repetitions encode urgency
        urgency = target_intel.get("urgency", "medium")
        repetitions = {"low": 3, "medium": 6, "high": 10, "critical": 20}[urgency]

        return {
            "angle_degrees": angle,
            "distance_km": round(distance_km, 1),
            "duration_ms": int(duration_ms),
            "enthusiasm": round(enthusiasm, 2),
            "repetitions": repetitions
        }
```

### 5.4 Waggle Dance Visualization

On the Cesium/UE5 visualization layer, waggle dances appear as:

```
VISUAL ENCODING:
├── Angle of dance icon = direction to target
├── Size of icon = enthusiasm level
├── Pulse frequency = urgency (more pulses = more urgent)
├── Color intensity = confidence score
├── Ring expansion = distance (larger rings = farther target)
└── Particle trail = path other agents should follow

ANIMATION SEQUENCE:
1. Dragonfly agent deposits dance pheromone
2. Icon appears with "dancing" animation (waggling motion)
3. Other agents in range see the dance icon
4. Interested agents approach the dance location
5. Decision indicators appear (green=follow, red=ignore, yellow=consider)
6. Following agents light up and begin coordinated movement
7. Dance fades as swarm mobilizes (reinforcement by followers)
```

---

## 6. SIGIL INTEGRATION

### 6.1 Dual-Write Architecture

Every pheromone operation creates both an **operational pheromone** (ephemeral, in Redis) and a **SIGIL entry** (permanent, in the immutable audit chain):

```
AGENT DEPOSITS PHEROMONE
         │
         ├──► Redis (operational, TTL-based)
         │     └── Instant availability for other agents
         │
         ├──► Neo4j (graph persistence)
         │     └── Queryable relationships and history
         │
         └──► SIGIL Chain (immutable audit)
               └── Ed25519 signed, SHA-256 chained, permanent record
```

### 6.2 SIGIL Entry Format

```json
{
  "sigil_id": "sl_7b4e2f1a9c8d3e5b",
  "sigil_version": "2.0",
  "entry_type": "PHEROMONE_DEPOSIT",

  "operation": {
    "pheromone_id": "ph_2v8x9k3m7p_1699123400",
    "pheromone_type": "TRAIL",
    "action": "deposit",
    "timestamp_utc": 1699123400,
    "timestamp_human": "2024-11-04T14:43:20Z"
  },

  "actor": {
    "agent_id": "hornet_07_alpha",
    "agent_type": "HORNET",
    "swarm_id": "swarm_delta_7",
    "hive_node": "hive_eu_central_1",
    "operator_authorization": "auth_token_sha256_abc123",
    "council_approval_id": "ca_2024_11_0047"
  },

  "context": {
    "target_coordinates": [51.5074, -0.1278, 0],
    "target_entity": "target_44f2a9",
    "mission_id": "mission_2024_11_delta",
    "operation_phase": "execution",
    "legal_authority": " warrant_type_3_judicial",
    "jurisdiction": "UK-EWHC-2024"
  },

  "content_hash": "sha256_a1b2c3d4e5f6789012345678901234567890abcd",
  "previous_sigil_hash": "sha256_prev_9876543210fedcba0987654321fedcba",
  "signature": "sig_ed25519_7b4e2f1a9c8d3e5b6a0f4c2d8e1b7a3c2d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8",

  "audit_trail": {
    "ip_address": "10.0.7.15",
    "session_id": "sess_2v8x9k3m7p",
    "command_sequence": 47,
    "preceding_action": "sl_7b4e2f1a9c8d3e5a",
    "following_action": null
  },

  "legal": {
    "authorization_chain": ["council_alpha", "legal_review_beta", "judicial_approval_gamma"],
    "compliance_framework": "defoneos_standard_2024",
    "retention_class": "permanent_operational",
    "evidence_admissibility": "prepared_for_court",
    "tamper_evident_seal": "sha256_seal_1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d"
  }
}
```

### 6.3 SIGIL Chain Structure

```
SIGIL CHAIN (Blockchain-like append-only log):

Block N-2    Block N-1    Block N      Block N+1
┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
│ Header  │  │ Header  │  │ Header  │  │ Header  │
│ Nonce   │  │ Nonce   │  │ Nonce   │  │ Nonce   │
│ Payload │  │ Payload │  │ Payload │  │ Payload │
│ PrevHash│◄─┤ PrevHash│◄─┤ PrevHash│◄─┤ PrevHash│
│ ThisHash├─►│ ThisHash├─►│ ThisHash├─►│ ThisHash│
│ Signature│  │Signature│  │Signature│  │Signature│
└─────────┘  └─────────┘  └─────────┘  └─────────┘

Tamper Detection:
  If any block is modified → all subsequent hash chains break
  Signature verification fails → invalid entry detected
  Previous hash mismatch → chain integrity compromised
```

### 6.4 SIGIL Python Implementation

```python
import hashlib
import json
import time
from typing import Optional
from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey, Ed25519PublicKey
)
from cryptography.hazmat.primitives import serialization

class SigilEntry:
    """Immutable audit entry for every pheromone operation."""

    def __init__(
        self,
        entry_type: str,
        pheromone_id: str,
        agent_id: str,
        operation_data: dict,
        legal_context: dict
    ):
        self.sigil_id = f"sl_{self._generate_id()}"
        self.entry_type = entry_type
        self.pheromone_id = pheromone_id
        self.agent_id = agent_id
        self.operation_data = operation_data
        self.legal_context = legal_context
        self.timestamp = time.time()
        self.previous_hash: Optional[str] = None
        self.content_hash: Optional[str] = None
        self.signature: Optional[str] = None

    def _generate_id(self) -> str:
        """Generate unique sigil ID."""
        data = f"{time.time()}{self.pheromone_id}{self.agent_id}"
        return hashlib.sha256(data.encode()).hexdigest()[:24]

    def compute_hash(self) -> str:
        """Compute SHA-256 content hash of this entry."""
        content = {
            "sigil_id": self.sigil_id,
            "entry_type": self.entry_type,
            "pheromone_id": self.pheromone_id,
            "agent_id": self.agent_id,
            "operation_data": self.operation_data,
            "timestamp": self.timestamp,
            "previous_hash": self.previous_hash
        }
        canonical = json.dumps(content, sort_keys=True, separators=(',', ':'))
        return hashlib.sha256(canonical.encode()).hexdigest()

    def sign(self, private_key: Ed25519PrivateKey) -> str:
        """Sign this entry with Ed25519 private key."""
        self.content_hash = self.compute_hash()
        signature = private_key.sign(self.content_hash.encode())
        self.signature = signature.hex()
        return self.signature

    def verify(self, public_key: Ed25519PublicKey) -> bool:
        """Verify signature authenticity."""
        if not self.signature or not self.content_hash:
            return False
        try:
            signature_bytes = bytes.fromhex(self.signature)
            public_key.verify(signature_bytes, self.content_hash.encode())
            return True
        except Exception:
            return False


class SigilChain:
    """
    Immutable audit chain for all pheromone operations.
    Provides tamper-evident, legally-defensible operation logs.
    """

    def __init__(self, storage_backend, private_key: Ed25519PrivateKey):
        self.storage = storage_backend
        self.private_key = private_key
        self.public_key = private_key.public_key()
        self._latest_hash: Optional[str] = None

    async def record_pheromone_deposit(
        self,
        pheromone: dict,
        agent_id: str,
        legal_context: dict
    ) -> str:
        """
        Record a pheromone deposit in the SIGIL chain.
        This is called automatically on every pheromone creation.
        """
        entry = SigilEntry(
            entry_type="PHEROMONE_DEPOSIT",
            pheromone_id=pheromone["pheromone_id"],
            agent_id=agent_id,
            operation_data={
                "pheromone_type": pheromone["type"],
                "location": pheromone["location"],
                "strength": pheromone["strength"],
                "ttl_seconds": pheromone.get("ttl_seconds", 3600),
                "data_summary": self._summarize_payload(pheromone.get("data", {}))
            },
            legal_context=legal_context
        )

        # Chain to previous entry
        entry.previous_hash = await self._get_latest_hash()

        # Sign
        entry.sign(self.private_key)

        # Store
        await self.storage.append_sigil(entry)

        # Update chain head
        self._latest_hash = entry.content_hash
        await self.storage.set_chain_head(entry.content_hash)

        return entry.sigil_id

    async def record_pheromone_reinforcement(
        self,
        pheromone_id: str,
        reinforcing_agent_id: str,
        strength_delta: float,
        new_strength: float,
        legal_context: dict
    ) -> str:
        """Record a pheromone reinforcement in the SIGIL chain."""
        entry = SigilEntry(
            entry_type="PHEROMONE_REINFORCEMENT",
            pheromone_id=pheromone_id,
            agent_id=reinforcing_agent_id,
            operation_data={
                "action": "reinforce",
                "strength_delta": strength_delta,
                "new_strength": new_strength,
                "timestamp": time.time()
            },
            legal_context=legal_context
        )

        entry.previous_hash = await self._get_latest_hash()
        entry.sign(self.private_key)
        await self.storage.append_sigil(entry)
        self._latest_hash = entry.content_hash

        return entry.sigil_id

    async def record_pheromone_evaporation(
        self,
        pheromone_id: str,
        final_strength: float,
        lifetime_seconds: float
    ) -> str:
        """Record pheromone evaporation (natural end of life)."""
        entry = SigilEntry(
            entry_type="PHEROMONE_EVAPORATION",
            pheromone_id=pheromone_id,
            agent_id="system_decay_engine",
            operation_data={
                "final_strength": final_strength,
                "lifetime_seconds": lifetime_seconds,
                "evaporation_cause": "natural_decay"
            },
            legal_context={"auto_generated": True}
        )

        entry.previous_hash = await self._get_latest_hash()
        entry.sign(self.private_key)
        await self.storage.append_sigil(entry)
        self._latest_hash = entry.content_hash

        return entry.sigil_id

    async def verify_chain_integrity(self) -> dict:
        """
        Verify the entire SIGIL chain for tampering.
        Returns integrity report.
        """
        entries = await self.storage.get_all_sigils()
        report = {"valid": True, "entries_checked": 0, "anomalies": []}

        for i, entry in enumerate(entries):
            report["entries_checked"] += 1

            # Verify content hash
            computed_hash = entry.compute_hash()
            if computed_hash != entry.content_hash:
                report["valid"] = False
                report["anomalies"].append({
                    "entry": i,
                    "issue": "hash_mismatch",
                    "expected": computed_hash,
                    "actual": entry.content_hash
                })

            # Verify signature
            if not entry.verify(self.public_key):
                report["valid"] = False
                report["anomalies"].append({
                    "entry": i,
                    "issue": "invalid_signature",
                    "sigil_id": entry.sigil_id
                })

            # Verify chain linkage
            if i > 0:
                prev_entry = entries[i - 1]
                if entry.previous_hash != prev_entry.content_hash:
                    report["valid"] = False
                    report["anomalies"].append({
                        "entry": i,
                        "issue": "chain_break",
                        "expected_previous": prev_entry.content_hash,
                        "actual_previous": entry.previous_hash
                    })

        return report

    def _summarize_payload(self, data: dict) -> dict:
        """Create a privacy-preserving summary of pheromone payload for SIGIL."""
        return {
            "data_keys": list(data.keys()),
            "data_hash": hashlib.sha256(
                json.dumps(data, sort_keys=True).encode()
            ).hexdigest()[:16],
            "size_bytes": len(json.dumps(data))
        }

    async def _get_latest_hash(self) -> Optional[str]:
        """Get hash of most recent SIGIL entry."""
        if self._latest_hash is None:
            self._latest_hash = await self.storage.get_chain_head()
        return self._latest_hash
```

### 6.5 Legal Protection Framework

```
LEGAL EVIDENCE CHAIN:

Pheromone Operation → SIGIL Entry → Legal Review → Court Admissibility

1. Every offensive pheromone requires pre-authorization
   ├── Council approval (operational necessity)
   ├── Legal review (jurisdiction, proportionality)
   └── Judicial authorization (where required)

2. SIGIL captures complete provenance
   ├── Who authorized the operation
   ├── Who executed it
   ├── What was done
   ├── When it happened
   ├── Where it occurred
   └── Why it was necessary

3. Chain integrity guarantees
   ├── Tamper-evident cryptographic sealing
   ├── Multi-signature requirements for sensitive operations
   ├── Independent audit node verification
   └── Quarterly third-party chain audits

4. Evidence package generation
   ├── Export to court-ready format
   ├── Timestamp authority verification
   ├── Expert witness documentation
   └── Defense rebuttal preparation
```

---

## 7. THE PHEROMONE MAP

### 7.1 Cesium 3D Visualization

The Pheromone Map provides real-time visualization of all active pheromones on a Cesium 3D globe:

```javascript
// Cesium Pheromone Layer Configuration
const pheromoneLayerConfig = {
  // Data Source: WebSocket stream from Redis Pub/Sub
  dataSource: {
    type: "websocket",
    url: "wss://hive.defoneos.internal/pheromone-stream",
    format: "json",
    refreshRate: 1000  // 1 second updates
  },

  // Visual encoding by pheromone type
  typeStyles: {
    TRAIL: {
      color: Cesium.Color.DODGERBLUE,
      alpha: 0.7,
      pixelSize: 8,
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 1,
      shape: "polyline",  // Lines connecting trail segments
      pulseEffect: false
    },
    ALERT: {
      color: Cesium.Color.CRIMSON,
      alpha: 0.9,
      pixelSize: 12,
      outlineColor: Cesium.Color.DARKRED,
      outlineWidth: 2,
      shape: "circle",
      pulseEffect: true,
      pulseFrequency: 2  // Hz
    },
    FOOD: {
      color: Cesium.Color.GOLD,
      alpha: 0.8,
      pixelSize: 15,
      outlineColor: Cesium.Color.ORANGE,
      outlineWidth: 2,
      shape: "star",
      pulseEffect: true,
      pulseFrequency: 1
    },
    HOME: {
      color: Cesium.Color.LIMEGREEN,
      alpha: 0.6,
      pixelSize: 10,
      outlineColor: Cesium.Color.FORESTGREEN,
      outlineWidth: 1,
      shape: "arrow",  // Directional arrows
      pulseEffect: false
    },
    DANGER: {
      color: Cesium.Color.BLACK,
      alpha: 0.9,
      pixelSize: 14,
      outlineColor: Cesium.Color.RED,
      outlineWidth: 3,
      shape: "skull",  // Custom entity
      pulseEffect: true,
      pulseFrequency: 0.5
    },
    RECRUIT: {
      color: Cesium.Color.MEDIUMPURPLE,
      alpha: 0.8,
      pixelSize: 13,
      outlineColor: Cesium.Color.PURPLE,
      outlineWidth: 2,
      shape: "ripple",  // Expanding rings
      pulseEffect: true,
      pulseFrequency: 3
    },
    CLAIM: {
      color: Cesium.Color.WHITE,
      alpha: 0.7,
      pixelSize: 11,
      outlineColor: Cesium.Color.LIGHTGRAY,
      outlineWidth: 1,
      shape: "flag",
      pulseEffect: false
    }
  },

  // Heat map layer
  heatmap: {
    enabled: true,
    radius: 25000,  // 25km radius
    blur: 15,
    maxOpacity: 0.8,
    weightFunction: (pheromone) => pheromone.strength * pheromone.typePriority
  },

  // Agent tracking layer
  agents: {
    enabled: true,
    iconSize: 20,
    trailLength: 50,  // Number of historical positions
    updateInterval: 500,  // ms
    agentIcons: {
      WORM: "worm_icon.svg",
      HORNET: "hornet_icon.svg",
      DRAGONFLY: "dragonfly_icon.svg",
      KILLER_BEE: "killer_bee_icon.svg"
    }
  },

  // Temporal controls
  temporal: {
    timeSlider: true,
    playbackSpeed: [0.25, 0.5, 1, 2, 4, 8, 16],
    showDecayAnimation: true,
    showReinforcementFlashes: true
  }
};
```

### 7.2 UE5 SOV SPACE 3D Visualization

For tunnel/network visualization, UE5 SOV SPACE renders pheromone trails as 3D paths:

```
UE5 PHEROMONE VISUALIZATION:

Layer 1: Network Topology
├── Nodes as 3D spheres (size = importance)
├── Edges as glowing tubes (brightness = pheromone strength)
├── Color = pheromone type
└── Pulse = recent activity

Layer 2: Pheromone Trails
├── TRAIL → Blue glowing paths through network
├── ALERT → Red warning halos around nodes
├── FOOD → Gold particles flowing toward target
├── HOME → Green return paths to safe zones
└── DANGER → Black corrupted zones with particle effects

Layer 3: Agent Movement
├── Agent avatars move along pheromone trails
├── Speed = agent type (HORNET fast, WORM slow)
├── Trail behind agent = pheromone being deposited
└── Arrival at target = action animation

Layer 4: Waggle Dance Visualization
├── Dragonfly avatar performs "dance" animation
├── Information beams shoot toward observing agents
├── Decision indicators (green/red/yellow) appear
└── Following agents converge and move together

Interactions:
├── Click pheromone → Full details panel
├── Hover → Strength, age, creator info
├── Filter by type → Toggle visibility
├── Time slider → Watch pheromones evolve
└── Agent filter → Show only specific agent types
```

### 7.3 Real-Time Dashboard

```
PULSAR PHEROMONE DASHBOARD

┌─────────────────────────────────────────────────────────────────────────────┐
│  PHEROMONE MAP                    │  METRICS                               │
│  [Cesium 3D Globe]                │  Active: 1,247                         │
│                                   │  Deposited (1h): 342                   │
│  ● TRAIL  ████████░░  534        │  Evaporated (1h): 198                  │
│  ● ALERT  ████░░░░░░  127        │  Reinforced (1h): 89                   │
│  ● FOOD   █████░░░░░  312        │  Avg Strength: 0.62                    │
│  ● HOME   ██████░░░░  189        │  Avg Age: 4.2h                         │
│  ● DANGER ██░░░░░░░░   47        │                                        │
│  ● RECRUIT █░░░░░░░░   23        │  HEATMAP TOP 5                         │
│  ● CLAIM   ███░░░░░░   15        │  1. EU-West: 0.78                      │
│                                   │  2. US-East: 0.71                      │
├───────────────────────────────────┤  3. AP-South: 0.64                     │
│  AGENT ACTIVITY                   │  4. EU-North: 0.52                     │
│  WORM      ████████░░  18 active │  5. US-West: 0.48                      │
│  HORNET    ██████████  42 active │                                        │
│  DRAGONFLY ██████░░░░  12 active │  SWARM COORDINATION                    │
│  KILLER_BEE ████░░░░░░   8 active │  Active swarms: 7                      │
│                                   │  Waggle dances (1h): 3                 │
├───────────────────────────────────┤  Recruitment responses: 23             │
│  RECENT ACTIVITY                  │  Coordination score: 0.84              │
│  14:43 hornet_07 → FOOD @ 51.5N  │                                        │
│  14:42 dragonfly_03 → WAGGLE @...│  SIGIL CHAIN                           │
│  14:41 worm_12 → TRAIL reinforced │  Total entries: 1,247,832              │
│  14:40 killerbee_05 → SWARM @... │  Chain integrity: ✓ VALID              │
│  14:39 hornet_08 → DANGER @...   │  Last audit: 2024-11-04 14:00          │
│  14:38 dragonfly_07 → RECRUIT... │  Pending legal review: 2               │
└───────────────────────────────────┴────────────────────────────────────────┘
```

---

## 8. EMERGENT BEHAVIORS

### 8.1 Path Optimization (Ant Trail Effect)

```
EMERGENT BEHAVIOR: Highway Formation

Time 0:  Multiple agents explore different routes to target
         ┌─A───┐
         │     │
    Start├─B───┤Target
         │     │
         └─C───┘

Time 1:  Agents deposit TRAIL pheromones on all routes
         Route A: strength 0.3 (slow, 3 agents)
         Route B: strength 0.5 (medium, 5 agents)
         Route C: strength 0.2 (fast but risky, 2 agents)

Time 2:  Route B reinforced (most agents use it)
         Route A: strength 0.25 (decay)
         Route B: strength 0.8 (reinforced +5)
         Route C: strength 0.15 (decay)

Time 3:  Route B becomes "highway" — dominant path
         Route A: strength 0.15 (fading)
         Route B: strength 0.95 (super-highway)
         Route C: strength 0.08 (nearly gone)

Result:  Emergent optimal pathfinding without central coordination
         Faster routes naturally attract more agents
         More agents = more reinforcement = stronger trail
         Stronger trail = more agents follow it
```

### 8.2 Resource Allocation (Food Source Clustering)

```
EMERGENT BEHAVIOR: Resource Clustering

Scenario: Multiple FOOD pheromones in region

Food A: strength 0.4, value 5  ──► Attracts 2 agents
Food B: strength 0.8, value 9  ──► Attracts 8 agents  ← dominant
Food C: strength 0.3, value 4  ──► Attracts 1 agent

Emergent: Agents cluster around Food B (highest strength × value)
          Food B reinforced by 8 agents → strength increases to 0.95
          Food B becomes "supercluster" — attracts even more agents
          
Self-limiting: As Food B gets depleted, its FOOD pheromone weakens
               Agents disperse to next-best FOOD source
               System naturally balances resource exploitation
```

### 8.3 Threat Avoidance (Danger Zone Repulsion)

```
EMERGENT BEHAVIOR: Danger Zone Avoidance

DANGER pheromone at location X (strength 0.9, avoidance radius 500km)

Agent behavior:
├── WORM:  Strict avoidance, 500km radius (safety first)
├── HORNET: Cautious approach, evaluates override
├── DRAGONFLY: Investigates from safe distance
└── KILLER_BEE: Masses for potential swarm if value justifies

Emergent: "Dead zone" forms around DANGER location
          No pheromone trails enter the zone
          Agents route around it naturally
          Zone size proportional to DANGER strength
          
Recovery: As DANGER decays (0.9 → 0.7 → 0.5 → 0.3)
         Avoidance radius shrinks (500 → 350 → 200 → 100km)
         Eventually agents cautiously re-enter
         DRAGONFLY scout confirms safety → DANGER marked resolved
```

### 8.4 Recruitment Cascade (Swarm Formation)

```
EMERGENT BEHAVIOR: Recruitment Cascade

1. DRAGONFLY discovers high-value target (value 9.5)
   └── Deposits FOOD pheromone (strength 0.8)

2. DRAGONFLY performs WAGGLE DANCE
   └── RECRUIT pheromone with rich target info
   └── 3 HORNETs see dance → decide to follow

3. HORNETs arrive, confirm target value
   └── Each reinforces FOOD (+0.15 × 3 = +0.45)
   └── FOOD strength rises to 0.95 (near maximum)

4. High FOOD strength triggers more RECRUIT pheromones
   └── KILLER_BEE swarm forms
   └── WORM establishes tunnel infrastructure

5. Full swarm operation emerges
   └── 3 HORNETs (strike)
   └── 8 KILLER_BEEs (overwhelm)
   └── 2 WORMs (persistence)
   └── 1 DRAGONFLY (coordination)
   
6. Success feedback
   └── All agents reinforce FOOD to maximum
   └── New TRAIL pheromones mark exfil routes
   └── HOME pheromones establish return paths

All from a single DRAGONFLY discovery — no central command.
```

### 8.5 Territory Partitioning (Claim Markers)

```
EMERGENT BEHAVIOR: Territory Division

CLAIM pheromones prevent friendly fire and resource competition:

Agent A claims Target X (exclusive)
  └── Other agents see CLAIM → avoid Target X
  └── Agent A has uncontested operational space

Agent B wants Target X too
  └── Sees CLAIM → checks if override possible
  └── Override requires: higher authority OR Agent A released claim
  └── If no override → Agent B seeks alternative target

Emergent: Agents naturally partition operational space
          No two agents compete for same target
          CLAIM markers create "territories"
          
Dynamic: CLAIMs expire if not refreshed
         Agents can release claims early (target completed)
         Council can force-release claims (reassignment)
```

### 8.6 Complete Emergent Behavior Summary Table

| Behavior | Mechanism | Agents Involved | Emergent Property |
|----------|-----------|----------------|-------------------|
| **Path Optimization** | TRAIL reinforcement + decay | All | Optimal routes emerge as "highways" |
| **Resource Clustering** | FOOD strength × value | HORNET, KILLER_BEE | Agents auto-cluster on best targets |
| **Threat Avoidance** | DANGER repulsion field | All | Dead zones form around threats |
| **Recruitment Cascade** | WAGGLE DANCE → FOOD reinforcement | DRAGONFLY → HORNET → KILLER_BEE | Self-organizing swarms form |
| **Territory Partition** | CLAIM markers + override rules | All | Operational space auto-divided |
| **Information Routing** | DRAGONFLY reads all, broadcasts RECRUIT | DRAGONFLY | Intel flows to optimal agents |
| **Self-Healing Networks** | HOME pheromones + redundancy | WORM | Networks survive node failures |
| **Adaptive Decay** | Environmental factors adjust decay | System | Pheromone lifespan adapts to threat |

---

## 9. PHEROMONE PROTOCOL SPECIFICATION

### 9.1 Message Format (Protocol Buffers)

```protobuf
// pheromone.proto
syntax = "proto3";
package defoneos.pheromone;

import "google/protobuf/timestamp.proto";

// Main pheromone message
message Pheromone {
  string pheromone_id = 1;
  PheromoneType type = 2;
  string subtype = 3;
  
  Location location = 4;
  google.protobuf.Timestamp timestamp = 5;
  
  float strength = 6;       // 0.0 to 1.0
  float decay_rate = 7;     // per hour
  uint32 ttl_seconds = 8;
  
  Creator creator = 9;
  PheromoneData data = 10;
  
  repeated string visibility = 11;  // Which agent types can read
  
  string signature = 12;     // Ed25519 signature
  string sigil_hash = 13;    // Reference to SIGIL entry
  
  // Version and metadata
  string protocol_version = 14;  // "2.0"
  map<string, string> metadata = 15;
}

enum PheromoneType {
  TRAIL = 0;
  ALERT = 1;
  FOOD = 2;
  HOME = 3;
  DANGER = 4;
  RECRUIT = 5;
  CLAIM = 6;
}

message Location {
  double latitude = 1;
  double longitude = 2;
  double altitude_m = 3;
  string region = 4;          // e.g., "EU-WEST"
  string zone = 5;            // e.g., "internet_perimeter"
  string entity_id = 6;       // Target entity reference
  string network_cidr = 7;    // Optional: network location
  uint32 asn = 8;             // Optional: autonomous system number
}

message Creator {
  string agent_id = 1;
  string agent_type = 2;      // WORM, HORNET, DRAGONFLY, KILLER_BEE
  string swarm_id = 3;
  string hive_node = 4;
}

// Polymorphic data payload — contents vary by type
message PheromoneData {
  oneof payload {
    TrailData trail = 1;
    AlertData alert = 2;
    FoodData food = 3;
    HomeData home = 4;
    DangerData danger = 5;
    RecruitData recruit = 6;
    ClaimData claim = 7;
    WaggleDance waggle_dance = 8;
  }
}

message TrailData {
  repeated string route_hops = 1;
  float latency_ms = 2;
  float success_rate = 3;
  float detection_risk = 4;
  string protocol = 5;
  uint32 port = 6;
  string bypass_method = 7;
  float route_quality = 8;
  repeated string redundancy_paths = 9;
  float stability_score = 10;
}

message AlertData {
  string threat_type = 1;
  float confidence = 2;
  string indicator = 3;
  google.protobuf.Timestamp last_observed = 4;
  string evasion_strategy = 5;
  string severity = 6;        // critical, high, medium, low
  bool response_required = 7;
  bool kill_switch_triggered = 8;
}

message FoodData {
  TargetProfile target_profile = 1;
  repeated string vulnerabilities = 2;
  float estimated_value = 3;    // 0-10
  uint64 data_volume_gb = 4;
  repeated string access_paths = 5;
  float competition = 6;        // 0-1, how contested
}

message TargetProfile {
  string type = 1;
  string os = 2;
  repeated string services = 3;
  string provider = 4;
  string data_classification = 5;
  uint64 estimated_records = 6;
}

message HomeData {
  repeated string return_routes = 1;
  repeated DeadDrop dead_drops = 2;
  repeated string cutout_nodes = 3;
  float exfiltration_capacity_mbps = 4;
  google.protobuf.Timestamp last_verified = 5;
  string security_level = 6;
}

message DeadDrop {
  string type = 1;              // dns_txt, pastebin, github_gist, s3_bucket
  string address = 2;
  string encryption_key_id = 3;
  google.protobuf.Timestamp last_sync = 4;
}

message DangerData {
  string incident_type = 1;
  string agent_id = 2;          // Which agent was affected
  string detection_method = 3;
  string forensic_capability = 4;  // high, medium, low
  float avoidance_radius_km = 5;
  uint32 burn_time_hours = 6;
  repeated string countermeasures_observed = 7;
}

message RecruitData {
  string target = 1;
  repeated string required_capabilities = 2;
  string urgency = 3;           // critical, high, medium, low
  uint32 recommended_swarm_size = 4;
  repeated string agent_types_needed = 5;
  uint32 estimated_duration_minutes = 6;
  float success_probability = 7;
  // Optional waggle dance
  WaggleDance waggle_dance = 8;
}

message WaggleDance {
  Coordinates target_coordinates = 1;
  string target_type = 2;
  float target_value = 3;
  float direction_degrees = 4;
  float distance_km = 5;
  float quality = 6;
  RiskAssessment risk = 7;
  string recommended_agent_type = 8;
  uint32 recommended_swarm_size = 9;
  TimeWindow optimal_timing = 10;
  repeated string supporting_intel = 11;
  repeated string corroborating_agents = 12;
  float information_freshness = 13;
}

message Coordinates {
  double lat = 1;
  double lon = 2;
  double altitude_m = 3;
  string network_location = 4;
  uint32 asn = 5;
}

message RiskAssessment {
  float detection_probability = 1;
  float countermeasure_strength = 2;
  float estimated_defender_skill = 3;
}

message TimeWindow {
  google.protobuf.Timestamp start = 1;
  google.protobuf.Timestamp end = 2;
  string timezone = 3;
}

message ClaimData {
  string claim_scope = 1;
  string claim_type = 2;        // exclusive_operation, shared_operation
  repeated string operations_authorized = 3;
  google.protobuf.Timestamp expires_at = 4;
  string override_authority = 5;
  repeated string subordinates_allowed = 6;
}

// API Request/Response messages
message DepositRequest {
  Pheromone pheromone = 1;
  string authorization_token = 2;
}

message DepositResponse {
  bool success = 1;
  string pheromone_id = 2;
  string sigil_id = 3;
  string error = 4;
}

message ReadRequest {
  string region = 1;
  repeated PheromoneType types = 2;
  Location near_location = 3;
  float radius_km = 4;
  float min_strength = 5;       // Filter: minimum strength
  repeated string agent_types = 6;  // Filter: which agent types
  uint32 limit = 7;
}

message ReadResponse {
  repeated Pheromone pheromones = 1;
  uint32 total_count = 2;
  string region = 3;
}

message ReinforceRequest {
  string pheromone_id = 1;
  string agent_id = 2;
  string action_type = 3;
  map<string, string> confirmation_data = 4;
}

message ReinforceResponse {
  bool success = 1;
  float new_strength = 2;
  uint32 reinforcement_count = 3;
}
```

### 9.2 RESTful API Specification

```yaml
# pheromone_api.yaml
openapi: 3.0.3
info:
  title: DEFONEOS Pheromone API
  version: 2.0.0
  description: Swarm pheromone signaling system

servers:
  - url: https://hive.defoneos.internal/api/v2

paths:
  /pheromones:
    post:
      summary: Deposit a new pheromone
      operationId: depositPheromone
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PheromoneDeposit'
          application/x-protobuf:
            schema:
              type: string
              format: binary
      responses:
        201:
          description: Pheromone created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DepositResponse'
        401:
          description: Unauthorized
        429:
          description: Rate limited

    get:
      summary: Query pheromones in region
      operationId: readPheromones
      parameters:
        - name: region
          in: query
          required: true
          schema:
            type: string
        - name: type
          in: query
          schema:
            type: array
            items:
              type: string
              enum: [TRAIL, ALERT, FOOD, HOME, DANGER, RECRUIT, CLAIM]
        - name: lat
          in: query
          schema:
            type: number
        - name: lon
          in: query
          schema:
            type: number
        - name: radius_km
          in: query
          schema:
            type: number
            default: 100
        - name: min_strength
          in: query
          schema:
            type: number
            default: 0.1
        - name: limit
          in: query
          schema:
            type: integer
            default: 100
            maximum: 1000
      responses:
        200:
          description: List of pheromones
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PheromoneList'

  /pheromones/{pheromone_id}:
    get:
      summary: Get specific pheromone
      operationId: getPheromone
      parameters:
        - name: pheromone_id
          in: path
          required: true
          schema:
            type: string
      responses:
        200:
          description: Pheromone details
        404:
          description: Not found

    delete:
      summary: Force-evaporate a pheromone
      operationId: evaporatePheromone
      parameters:
        - name: pheromone_id
          in: path
          required: true
          schema:
            type: string
      responses:
        200:
          description: Evaporated
        403:
          description: Insufficient authority

  /pheromones/{pheromone_id}/reinforce:
    post:
      summary: Reinforce a pheromone
      operationId: reinforcePheromone
      parameters:
        - name: pheromone_id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ReinforceRequest'
      responses:
        200:
          description: Reinforcement applied
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ReinforceResponse'

  /pheromones/{pheromone_id}/contradict:
    post:
      summary: Contradict a pheromone (negative reinforcement)
      operationId: contradictPheromone
      parameters:
        - name: pheromone_id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                agent_id:
                  type: string
                reason:
                  type: string
                evidence:
                  type: object
      responses:
        200:
          description: Contradiction recorded

  /pheromones/stream:
    get:
      summary: WebSocket stream of real-time pheromone updates
      operationId: streamPheromones
      parameters:
        - name: region
          in: query
          required: true
          schema:
            type: string
        - name: types
          in: query
          schema:
            type: array
            items:
              type: string
      responses:
        101:
          description: WebSocket upgrade

  /waggle/dance:
    post:
      summary: Perform a waggle dance (recruitment broadcast)
      operationId: performWaggleDance
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/WaggleDanceRequest'
      responses:
        201:
          description: Dance performed
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/WaggleDanceResponse'

  /sigil/verify:
    post:
      summary: Verify SIGIL chain integrity
      operationId: verifySigilChain
      responses:
        200:
          description: Integrity report
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SigilIntegrityReport'

  /sigil/export:
    get:
      summary: Export SIGIL entries for legal review
      operationId: exportSigil
      parameters:
        - name: start_time
          in: query
          required: true
          schema:
            type: integer
        - name: end_time
          in: query
          required: true
          schema:
            type: integer
        - name: mission_id
          in: query
          schema:
            type: string
      responses:
        200:
          description: Exported evidence package

components:
  schemas:
    PheromoneDeposit:
      type: object
      required: [type, location, strength, creator, data]
      properties:
        type:
          type: string
          enum: [TRAIL, ALERT, FOOD, HOME, DANGER, RECRUIT, CLAIM]
        subtype:
          type: string
        location:
          $ref: '#/components/schemas/Location'
        strength:
          type: number
          minimum: 0
          maximum: 1
        decay_rate:
          type: number
        ttl_seconds:
          type: integer
        creator:
          $ref: '#/components/schemas/Creator'
        data:
          type: object
        visibility:
          type: array
          items:
            type: string

    Location:
      type: object
      properties:
        latitude:
          type: number
        longitude:
          type: number
        altitude_m:
          type: number
        region:
          type: string
        zone:
          type: string
        entity_id:
          type: string

    Creator:
      type: object
      properties:
        agent_id:
          type: string
        agent_type:
          type: string
        swarm_id:
          type: string
        hive_node:
          type: string

    DepositResponse:
      type: object
      properties:
        success:
          type: boolean
        pheromone_id:
          type: string
        sigil_id:
          type: string
        error:
          type: string

    PheromoneList:
      type: object
      properties:
        pheromones:
          type: array
          items:
            $ref: '#/components/schemas/PheromoneDeposit'
        total_count:
          type: integer
        region:
          type: string

    ReinforceRequest:
      type: object
      properties:
        agent_id:
          type: string
        action_type:
          type: string
        confirmation_data:
          type: object

    ReinforceResponse:
      type: object
      properties:
        success:
          type: boolean
        new_strength:
          type: number
        reinforcement_count:
          type: integer

    WaggleDanceRequest:
      type: object
      properties:
        agent_id:
          type: string
        target_intel:
          type: object
        location:
          $ref: '#/components/schemas/Location'

    WaggleDanceResponse:
      type: object
      properties:
        pheromone_id:
          type: string
        followers_expected:
          type: integer
        confidence:
          type: number

    SigilIntegrityReport:
      type: object
      properties:
        valid:
          type: boolean
        entries_checked:
          type: integer
        anomalies:
          type: array
          items:
            type: object
```

### 9.3 WebSocket Real-Time Stream

```json
// WebSocket message formats

// Server → Client: New pheromone deposited
{
  "event": "pheromone_deposited",
  "timestamp": 1699123400,
  "data": {
    "pheromone_id": "ph_2v8x9k3m",
    "type": "FOOD",
    "location": {"lat": 51.5074, "lon": -0.1278},
    "strength": 0.85,
    "creator": {"agent_id": "dragonfly_07", "agent_type": "DRAGONFLY"}
  }
}

// Server → Client: Pheromone reinforced
{
  "event": "pheromone_reinforced",
  "timestamp": 1699123600,
  "data": {
    "pheromone_id": "ph_2v8x9k3m",
    "new_strength": 0.95,
    "reinforcing_agent": "hornet_03_alpha",
    "reinforcement_delta": 0.10
  }
}

// Server → Client: Pheromone evaporated
{
  "event": "pheromone_evaporated",
  "timestamp": 1699127000,
  "data": {
    "pheromone_id": "ph_2v8x9k3m",
    "final_strength": 0.04,
    "lifetime_seconds": 3600
  }
}

// Server → Client: Waggle dance performed
{
  "event": "waggle_dance",
  "timestamp": 1699123500,
  "data": {
    "pheromone_id": "ph_waggle_3m9y0l",
    "performer": "dragonfly_07_beta",
    "enthusiasm": 0.92,
    "target_value": 9.2,
    "interested_agents": ["hornet_03", "hornet_07", "killerbee_02"]
  }
}

// Client → Server: Subscribe to region
{
  "action": "subscribe",
  "region": "EU-WEST",
  "filter_types": ["FOOD", "ALERT", "RECRUIT"],
  "min_strength": 0.2
}

// Client → Server: Agent position update
{
  "action": "position_update",
  "agent_id": "hornet_07_alpha",
  "location": {"lat": 51.5074, "lon": -0.1278},
  "status": "following_trail",
  "trail_id": "ph_2v8x9k3m"
}
```

---

## 10. COMPLETE PYTHON IMPLEMENTATION


### 10.1 Core Pheromone System

```python
#!/usr/bin/env python3
"""
SWARM PHEROMONE + SIGIL SYSTEM
Complete implementation for DEFONEOS distributed swarm communication.

Components:
- PheromoneSystem: Core deposit/read/reinforce/evaporate operations
- DecayEngine: Exponential decay with configurable rates
- ReinforcementEngine: Agent confirmation-based strengthening
- AgentDialects: Type-specific read/write behaviors
- WaggleDanceProtocol: Rich information recruitment
- SigilChain: Immutable audit trail
- PheromoneAPI: FastAPI REST endpoint
"""

import asyncio
import hashlib
import json
import math
import secrets
import time
import uuid
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional, Set, Tuple

import aioredis
from neo4j import AsyncGraphDatabase
from fastapi import FastAPI, HTTPException, Depends, WebSocket
from fastapi.security import HTTPBearer
from pydantic import BaseModel, Field
from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey, Ed25519PublicKey
)
from cryptography.exceptions import InvalidSignature


# ═══════════════════════════════════════════════════════════════════════════════
# ENUMERATIONS AND CONSTANTS
# ═══════════════════════════════════════════════════════════════════════════════

class PheromoneType(str, Enum):
    TRAIL = "TRAIL"
    ALERT = "ALERT"
    FOOD = "FOOD"
    HOME = "HOME"
    DANGER = "DANGER"
    RECRUIT = "RECRUIT"
    CLAIM = "CLAIM"


class AgentType(str, Enum):
    WORM = "WORM"
    HORNET = "HORNET"
    DRAGONFLY = "DRAGONFLY"
    KILLER_BEE = "KILLER_BEE"


class Severity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


# Decay rates (% per hour) by pheromone type
DECAY_RATES = {
    PheromoneType.TRAIL: 0.05,
    PheromoneType.ALERT: 0.20,
    PheromoneType.FOOD: 0.02,
    PheromoneType.HOME: 0.01,
    PheromoneType.DANGER: 0.005,
    PheromoneType.RECRUIT: 0.15,
    PheromoneType.CLAIM: 0.03,
}

# Default TTL (seconds) by pheromone type
DEFAULT_TTLS = {
    PheromoneType.TRAIL: 3600 * 6,      # 6 hours
    PheromoneType.ALERT: 3600 * 2,       # 2 hours
    PheromoneType.FOOD: 3600 * 24,       # 24 hours
    PheromoneType.HOME: 3600 * 48,       # 48 hours
    PheromoneType.DANGER: 3600 * 24 * 7, # 7 days
    PheromoneType.RECRUIT: 3600 * 2,     # 2 hours
    PheromoneType.CLAIM: 3600 * 24,      # 24 hours
}

# Color codes for visualization
TYPE_COLORS = {
    PheromoneType.TRAIL: "#1E90FF",    # Dodger Blue
    PheromoneType.ALERT: "#DC143C",    # Crimson
    PheromoneType.FOOD: "#FFD700",     # Gold
    PheromoneType.HOME: "#32CD32",     # Lime Green
    PheromoneType.DANGER: "#000000",   # Black
    PheromoneType.RECRUIT: "#9370DB",  # Medium Purple
    PheromoneType.CLAIM: "#FFFFFF",    # White
}


# ═══════════════════════════════════════════════════════════════════════════════
# DATA MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class Location(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    altitude_m: float = 0.0
    region: str
    zone: str = "default"
    entity_id: Optional[str] = None
    network_cidr: Optional[str] = None
    asn: Optional[int] = None


class Creator(BaseModel):
    agent_id: str
    agent_type: AgentType
    swarm_id: Optional[str] = None
    hive_node: Optional[str] = None


class PheromonePayload(BaseModel):
    """Polymorphic payload - structure varies by pheromone type."""
    payload: Dict[str, Any] = Field(default_factory=dict)


class Pheromone(BaseModel):
    """Canonical pheromone data model."""
    pheromone_id: str
    type: PheromoneType
    subtype: Optional[str] = None
    location: Location
    timestamp: float  # Unix timestamp
    strength: float = Field(..., ge=0.0, le=1.0)
    decay_rate: float
    ttl_seconds: int
    creator: Creator
    data: Dict[str, Any] = Field(default_factory=dict)
    visibility: List[AgentType] = Field(default_factory=list)
    signature: Optional[str] = None
    sigil_hash: Optional[str] = None
    protocol_version: str = "2.0"
    metadata: Dict[str, str] = Field(default_factory=dict)


class DepositRequest(BaseModel):
    type: PheromoneType
    subtype: Optional[str] = None
    location: Location
    strength: float = Field(default=0.5, ge=0.0, le=1.0)
    decay_rate: Optional[float] = None
    ttl_seconds: Optional[int] = None
    data: Dict[str, Any] = Field(default_factory=dict)
    visibility: List[AgentType] = Field(default_factory=list)


class ReinforceRequest(BaseModel):
    agent_id: str
    action_type: str
    confirmation_data: Dict[str, Any] = Field(default_factory=dict)


class WaggleDanceRequest(BaseModel):
    agent_id: str
    target_intel: Dict[str, Any]
    location: Location


# ═══════════════════════════════════════════════════════════════════════════════
# SIGIL - IMMUTABLE AUDIT SYSTEM
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class SigilEntry:
    """Immutable audit entry for pheromone operations."""
    sigil_id: str
    entry_type: str
    pheromone_id: str
    agent_id: str
    operation_data: Dict[str, Any]
    legal_context: Dict[str, Any]
    timestamp: float
    previous_hash: Optional[str] = None
    content_hash: Optional[str] = None
    signature: Optional[str] = None

    def compute_hash(self) -> str:
        """Compute SHA-256 content hash."""
        content = {
            "sigil_id": self.sigil_id,
            "entry_type": self.entry_type,
            "pheromone_id": self.pheromone_id,
            "agent_id": self.agent_id,
            "operation_data": self.operation_data,
            "timestamp": self.timestamp,
            "previous_hash": self.previous_hash,
        }
        canonical = json.dumps(content, sort_keys=True, separators=(",", ":"))
        return hashlib.sha256(canonical.encode()).hexdigest()


class SigilChain:
    """Immutable audit chain for all pheromone operations."""

    def __init__(self, storage, private_key: Ed25519PrivateKey):
        self.storage = storage
        self.private_key = private_key
        self.public_key = private_key.public_key()
        self._latest_hash: Optional[str] = None

    async def record_deposit(
        self, pheromone: Pheromone, legal_context: Dict[str, Any]
    ) -> str:
        """Record pheromone deposit in SIGIL chain."""
        entry = SigilEntry(
            sigil_id=f"sl_{secrets.token_hex(12)}",
            entry_type="PHEROMONE_DEPOSIT",
            pheromone_id=pheromone.pheromone_id,
            agent_id=pheromone.creator.agent_id,
            operation_data={
                "pheromone_type": pheromone.type.value,
                "location": {
                    "lat": pheromone.location.latitude,
                    "lon": pheromone.location.longitude,
                    "region": pheromone.location.region,
                },
                "strength": pheromone.strength,
                "ttl_seconds": pheromone.ttl_seconds,
                "data_keys": list(pheromone.data.keys()),
            },
            legal_context=legal_context,
            timestamp=time.time(),
        )

        entry.previous_hash = await self._get_latest_hash()
        entry.content_hash = entry.compute_hash()
        entry.signature = self._sign(entry.content_hash)

        await self.storage.append_sigil(entry)
        self._latest_hash = entry.content_hash
        return entry.sigil_id

    async def record_reinforcement(
        self, pheromone_id: str, agent_id: str,
        strength_delta: float, new_strength: float
    ) -> str:
        """Record pheromone reinforcement."""
        entry = SigilEntry(
            sigil_id=f"sl_{secrets.token_hex(12)}",
            entry_type="PHEROMONE_REINFORCEMENT",
            pheromone_id=pheromone_id,
            agent_id=agent_id,
            operation_data={
                "action": "reinforce",
                "strength_delta": strength_delta,
                "new_strength": new_strength,
            },
            legal_context={"auto_generated": True},
            timestamp=time.time(),
        )

        entry.previous_hash = await self._get_latest_hash()
        entry.content_hash = entry.compute_hash()
        entry.signature = self._sign(entry.content_hash)

        await self.storage.append_sigil(entry)
        self._latest_hash = entry.content_hash
        return entry.sigil_id

    async def record_evaporation(
        self, pheromone_id: str, final_strength: float, lifetime_seconds: float
    ) -> str:
        """Record pheromone evaporation."""
        entry = SigilEntry(
            sigil_id=f"sl_{secrets.token_hex(12)}",
            entry_type="PHEROMONE_EVAPORATION",
            pheromone_id=pheromone_id,
            agent_id="system_decay_engine",
            operation_data={
                "final_strength": final_strength,
                "lifetime_seconds": lifetime_seconds,
                "evaporation_cause": "natural_decay",
            },
            legal_context={"auto_generated": True},
            timestamp=time.time(),
        )

        entry.previous_hash = await self._get_latest_hash()
        entry.content_hash = entry.compute_hash()
        entry.signature = self._sign(entry.content_hash)

        await self.storage.append_sigil(entry)
        self._latest_hash = entry.content_hash
        return entry.sigil_id

    async def verify_chain(self) -> Dict[str, Any]:
        """Verify entire SIGIL chain integrity."""
        entries = await self.storage.get_all_sigils()
        report = {"valid": True, "entries_checked": 0, "anomalies": []}

        for i, entry in enumerate(entries):
            report["entries_checked"] += 1

            computed = entry.compute_hash()
            if computed != entry.content_hash:
                report["valid"] = False
                report["anomalies"].append({
                    "entry": i, "issue": "hash_mismatch",
                    "sigil_id": entry.sigil_id,
                })

            if not self._verify_signature(entry.content_hash, entry.signature):
                report["valid"] = False
                report["anomalies"].append({
                    "entry": i, "issue": "invalid_signature",
                    "sigil_id": entry.sigil_id,
                })

            if i > 0:
                prev = entries[i - 1]
                if entry.previous_hash != prev.content_hash:
                    report["valid"] = False
                    report["anomalies"].append({
                        "entry": i, "issue": "chain_break",
                        "sigil_id": entry.sigil_id,
                    })

        return report

    def _sign(self, content_hash: str) -> str:
        """Sign content hash with Ed25519."""
        sig = self.private_key.sign(content_hash.encode())
        return sig.hex()

    def _verify_signature(self, content_hash: str, signature: str) -> bool:
        """Verify signature."""
        try:
            sig_bytes = bytes.fromhex(signature)
            self.public_key.verify(sig_bytes, content_hash.encode())
            return True
        except (InvalidSignature, ValueError):
            return False

    async def _get_latest_hash(self) -> Optional[str]:
        if self._latest_hash is None:
            self._latest_hash = await self.storage.get_chain_head()
        return self._latest_hash


# ═══════════════════════════════════════════════════════════════════════════════
# DECAY ENGINE
# ═══════════════════════════════════════════════════════════════════════════════

class DecayEngine:
    """Handles pheromone exponential decay with configurable rates."""

    # Type-specific decay multipliers for special cases
    SEVERITY_MULTIPLIERS = {
        Severity.CRITICAL: 0.3,
        Severity.HIGH: 0.6,
        Severity.MEDIUM: 1.0,
        Severity.LOW: 1.5,
    }

    URGENCY_MULTIPLIERS = {
        "critical": 0.5,
        "high": 0.7,
        "medium": 1.0,
        "low": 1.5,
    }

    FORENSIC_MULTIPLIERS = {
        "high": 0.5,
        "medium": 1.0,
        "low": 1.5,
    }

    def calculate_strength(
        self,
        initial_strength: float,
        pheromone_type: PheromoneType,
        created_at: float,
        decay_rate: Optional[float] = None,
        reinforcements: List[Tuple[float, float]] = None,
        data: Optional[Dict] = None,
    ) -> float:
        """
        Calculate current strength with exponential decay + reinforcement.

        strength(t) = initial * e^(-rate * t) + sum(r_i * e^(-rate * (t - t_i)))
        """
        rate = decay_rate or DECAY_RATES[pheromone_type]
        now = time.time()
        elapsed_hours = (now - created_at) / 3600.0

        # Apply type-specific adjustments
        rate = self._adjust_rate(pheromone_type, rate, data)

        # Base decay
        current = initial_strength * math.exp(-rate * elapsed_hours)

        # Reinforcement contributions
        if reinforcements:
            for r_strength, r_time in reinforcements:
                r_elapsed = (now - r_time) / 3600.0
                current += r_strength * math.exp(-rate * r_elapsed)

        return max(0.0, min(1.0, current))

    def _adjust_rate(
        self, ph_type: PheromoneType, base_rate: float, data: Optional[Dict]
    ) -> float:
        """Apply type-specific decay adjustments."""
        if not data:
            return base_rate

        if ph_type == PheromoneType.ALERT:
            severity = data.get("severity", "medium")
            return base_rate * self.SEVERITY_MULTIPLIERS.get(
                Severity(severity), 1.0
            )

        elif ph_type == PheromoneType.RECRUIT:
            urgency = data.get("urgency", "medium")
            return base_rate * self.URGENCY_MULTIPLIERS.get(urgency, 1.0)

        elif ph_type == PheromoneType.DANGER:
            forensic = data.get("forensic_capability", "medium")
            return base_rate * self.FORENSIC_MULTIPLIERS.get(forensic, 1.0)

        elif ph_type == PheromoneType.FOOD:
            # Competition from nearby FOOD markers accelerates decay
            competition = data.get("competition", 0.0)
            return base_rate * (1.0 + competition * 0.5)

        return base_rate


# ═══════════════════════════════════════════════════════════════════════════════
# REINFORCEMENT ENGINE
# ═══════════════════════════════════════════════════════════════════════════════

class ReinforcementEngine:
    """Handles pheromone reinforcement when agents confirm markers."""

    REINFORCEMENT_VALUES = {
        "trail_followed": 0.15,
        "alert_confirmed": 0.25,
        "food_exploited": 0.30,
        "home_used": 0.10,
        "danger_confirmed": 0.20,
        "multi_agent_bonus": 0.05,
        "contradiction": -0.30,
    }

    STRENGTH_CAP = 1.0
    STRENGTH_FLOOR = 0.0

    def __init__(self, storage, sigil: SigilChain):
        self.storage = storage
        self.sigil = sigil

    async def reinforce(
        self,
        pheromone_id: str,
        reinforcing_agent_id: str,
        action_type: str,
        confirmation_data: Optional[Dict] = None,
    ) -> float:
        """Reinforce a pheromone and record in SIGIL."""
        ph = await self.storage.get_pheromone(pheromone_id)
        if not ph:
            raise ValueError(f"Pheromone {pheromone_id} not found")

        # Calculate reinforcement
        base_value = self.REINFORCEMENT_VALUES.get(action_type, 0.05)
        multiplier = self._calc_multiplier(ph, confirmation_data)
        reinforcement = base_value * multiplier

        # Apply with caps
        new_strength = max(
            self.STRENGTH_FLOOR,
            min(self.STRENGTH_CAP, ph.strength + reinforcement),
        )

        # Write to storage
        await self.storage.update_strength(pheromone_id, new_strength)

        # Record in SIGIL
        await self.sigil.record_reinforcement(
            pheromone_id, reinforcing_agent_id,
            reinforcement, new_strength,
        )

        return new_strength

    def _calc_multiplier(
        self, ph: Pheromone, confirmation_data: Optional[Dict]
    ) -> float:
        """Calculate reinforcement multiplier."""
        if not confirmation_data:
            return 1.0

        confidence = confirmation_data.get("confidence", 0.5)
        recency = confirmation_data.get("recency_score", 0.5)
        quality = confidence * recency

        # Cross-type reinforcement is weaker
        creator_type = ph.creator.agent_type
        agent_type = confirmation_data.get("agent_type", creator_type)
        type_mult = 1.2 if creator_type == agent_type else 0.8

        return (0.5 + quality) * type_mult


# ═══════════════════════════════════════════════════════════════════════════════
# AGENT DIALECTS
# ═══════════════════════════════════════════════════════════════════════════════

class AgentDialect:
    """Base class for agent-specific pheromone behaviors."""

    WRITE_TYPES: List[PheromoneType] = []
    READ_TYPES: List[PheromoneType] = []
    TTL_MULTIPLIER: float = 1.0
    DECAY_MULTIPLIER: float = 1.0

    def can_write(self, ph_type: PheromoneType) -> bool:
        return ph_type in self.WRITE_TYPES

    def can_read(self, ph_type: PheromoneType) -> bool:
        return ph_type in self.READ_TYPES

    def interpret(self, pheromone: Pheromone) -> Dict[str, Any]:
        """Interpret a pheromone and recommend action."""
        return {"action": "NO_OP", "confidence": 0.5}


class WormDialect(AgentDialect):
    """WORM: Infrastructure specialist. Subtle, long-lived pheromones."""

    WRITE_TYPES = [PheromoneType.TRAIL, PheromoneType.HOME, PheromoneType.FOOD]
    READ_TYPES = [PheromoneType.TRAIL, PheromoneType.ALERT, PheromoneType.DANGER]
    TTL_MULTIPLIER = 3.0
    DECAY_MULTIPLIER = 0.4

    def interpret(self, ph: Pheromone) -> Dict[str, Any]:
        if ph.type == PheromoneType.DANGER:
            return {
                "action": "AVOID",
                "avoidance_radius_km": ph.data.get("avoidance_radius_km", 100),
                "confidence": 0.95,
            }
        elif ph.type == PheromoneType.ALERT:
            severity = ph.data.get("severity", "medium")
            if severity in ("critical", "high"):
                return {"action": "AVOID", "confidence": 0.9}
            return {"action": "CAUTIOUS_APPROACH", "confidence": 0.6}
        elif ph.type == PheromoneType.TRAIL:
            stability = ph.data.get("stability_score", 0.5)
            return {
                "action": "FOLLOW" if stability > 0.7 else "EVALUATE",
                "confidence": stability,
            }
        elif ph.type == PheromoneType.FOOD:
            long_term = ph.data.get("long_term_value", 0)
            return {
                "action": "INVESTIGATE" if long_term > 0.6 else "IGNORE",
                "confidence": long_term if long_term > 0.6 else 1 - long_term,
            }
        return {"action": "IGNORE", "confidence": 0.5}


class HornetDialect(AgentDialect):
    """HORNET: Offensive strike specialist. Aggressive, short-lived."""

    WRITE_TYPES = [PheromoneType.TRAIL, PheromoneType.ALERT,
                   PheromoneType.DANGER, PheromoneType.FOOD]
    READ_TYPES = [PheromoneType.FOOD, PheromoneType.ALERT, PheromoneType.TRAIL]
    TTL_MULTIPLIER = 0.3
    DECAY_MULTIPLIER = 2.5

    def interpret(self, ph: Pheromone) -> Dict[str, Any]:
        if ph.type == PheromoneType.FOOD:
            value = ph.data.get("estimated_value", 0)
            risk = ph.data.get("risk_level", 0.5)
            score = value * (1 - risk)
            if score > 6:
                return {"action": "ATTACK_IMMEDIATE", "priority": score, "confidence": 0.85}
            elif score > 3:
                return {"action": "ATTACK_WHEN_READY", "priority": score, "confidence": 0.7}
            return {"action": "CONSIDER", "priority": score, "confidence": 0.5}
        elif ph.type == PheromoneType.ALERT:
            severity = ph.data.get("severity", "medium")
            if severity == "critical":
                return {"action": "ABORT_AND_MARK_DANGER", "confidence": 0.95}
            return {"action": "HEIGHTENED_ALERT", "confidence": 0.7}
        elif ph.type == PheromoneType.TRAIL:
            time_est = ph.data.get("time_estimate_seconds", 9999)
            return {
                "action": "FOLLOW" if time_est < 300 else "IGNORE",
                "confidence": 0.8 if time_est < 300 else 0.5,
            }
        elif ph.type == PheromoneType.DANGER:
            return {"action": "EVALUATE_OVERRIDE", "confidence": 0.6}
        return {"action": "IGNORE", "confidence": 0.5}


class DragonflyDialect(AgentDialect):
    """DRAGONFLY: Intelligence specialist. Reads everything, performs waggle dances."""

    WRITE_TYPES = [PheromoneType.FOOD, PheromoneType.RECRUIT,
                   PheromoneType.CLAIM, PheromoneType.TRAIL]
    READ_TYPES = list(PheromoneType)  # Reads ALL types
    TTL_MULTIPLIER = 2.0
    DECAY_MULTIPLIER = 0.5

    def interpret(self, ph: Pheromone) -> Dict[str, Any]:
        analysis = {"action": "ANALYZE", "corroboration_score": 0.0}

        if ph.type == PheromoneType.FOOD:
            value = ph.data.get("estimated_value", 0)
            analysis["corroboration_score"] = value * 0.1
            analysis["recommended_response"] = (
                "CREATE_WAGGLE_DANCE" if value > 7 else "INVESTIGATE_FURTHER"
            )
        elif ph.type == PheromoneType.ALERT:
            conf = ph.data.get("confidence", 0.5)
            analysis["confidence_adjustment"] = conf
            analysis["recommended_response"] = (
                "BROADCAST_WARNING" if conf > 0.8 else "VERIFY_BEFORE_ACTION"
            )
        elif ph.type == PheromoneType.RECRUIT:
            analysis["recruitment_urgency"] = ph.data.get("urgency", "medium")
        elif ph.type == PheromoneType.DANGER:
            analysis["threat_level"] = ph.data.get("forensic_capability", "medium")
            analysis["recommended_response"] = "AVOID_AND_LOG"

        return analysis


class KillerBeeDialect(AgentDialect):
    """KILLER_BEE: Swarm coordination. Binary signals, mass deployment."""

    WRITE_TYPES = [PheromoneType.ALERT, PheromoneType.DANGER,
                   PheromoneType.CLAIM, PheromoneType.RECRUIT]
    READ_TYPES = [PheromoneType.RECRUIT, PheromoneType.FOOD, PheromoneType.CLAIM]
    TTL_MULTIPLIER = 0.1
    DECAY_MULTIPLIER = 3.0

    def interpret(self, ph: Pheromone) -> Dict[str, Any]:
        if ph.type == PheromoneType.RECRUIT:
            signal = ph.data.get("swarm_signal", "ATTACK")
            if signal == "OVERWHELM":
                return {"action": "MASS_SWARM", "confidence": 0.9, "priority": "maximum"}
            elif signal == "ATTACK":
                return {"action": "COORDINATED_STRIKE", "confidence": 0.85, "priority": "high"}
            return {"action": "JOIN_SWARM", "confidence": 0.7, "priority": "medium"}
        elif ph.type == PheromoneType.FOOD:
            value = ph.data.get("estimated_value", 0)
            if value > 8:
                return {
                    "action": "SWARM_FOR_FOOD",
                    "confidence": 0.9,
                    "recommended_swarm_size": min(20, int(value * 2)),
                }
            return {"action": "CONSIDER", "confidence": 0.5}
        elif ph.type == PheromoneType.CLAIM:
            return {"action": "RESPECT_CLAIM", "confidence": 0.8}
        return {"action": "AWAIT_ORDERS", "confidence": 0.5}


# ═══════════════════════════════════════════════════════════════════════════════
# WAGGLE DANCE PROTOCOL
# ═══════════════════════════════════════════════════════════════════════════════

class WaggleDanceProtocol:
    """Digital waggle dance for agent recruitment."""

    INTERPRETATION = {
        AgentType.HORNET: {
            "follow_threshold": 0.6,
            "swarm_size_multiplier": 1.0,
            "response_time_seconds": 300,
            "max_distance_km": 5000,
        },
        AgentType.KILLER_BEE: {
            "follow_threshold": 0.5,
            "swarm_size_multiplier": 2.0,
            "response_time_seconds": 120,
            "max_distance_km": 10000,
        },
        AgentType.WORM: {
            "follow_threshold": 0.8,
            "swarm_size_multiplier": 0.5,
            "response_time_seconds": 1800,
            "max_distance_km": 2000,
        },
    }

    def __init__(self, pheromone_system, sigil: SigilChain):
        self.ph_system = pheromone_system
        self.sigil = sigil

    async def perform_dance(
        self, agent_id: str, agent_type: AgentType,
        target_intel: Dict, location: Location
    ) -> str:
        """Perform a waggle dance — returns pheromone_id."""
        dance_id = f"ph_waggle_{secrets.token_hex(8)}"

        # Calculate dance parameters
        enthusiasm = self._calc_enthusiasm(target_intel)
        choreography = self._calc_choreography(target_intel, location)

        # Build RECRUIT pheromone with waggle dance data
        dance_ph = Pheromone(
            pheromone_id=dance_id,
            type=PheromoneType.RECRUIT,
            subtype="waggle_dance",
            location=location,
            timestamp=time.time(),
            strength=enthusiasm,
            decay_rate=0.075,
            ttl_seconds=14400,
            creator=Creator(agent_id=agent_id, agent_type=agent_type),
            data={
                "waggle_dance": {
                    "enthusiasm": enthusiasm,
                    "direction_degrees": choreography["angle"],
                    "distance_km": choreography["distance_km"],
                    "quality": target_intel.get("confidence", 0.5),
                    "recommended_agent_type": self._recommend_agent(target_intel),
                    "recommended_swarm_size": self._calc_swarm_size(target_intel),
                    "target_value": target_intel.get("value", 5),
                    "risk": target_intel.get("risk", {}),
                },
                **target_intel,
            },
            visibility=[AgentType.HORNET, AgentType.KILLER_BEE, AgentType.DRAGONFLY],
        )

        # Deposit the dance pheromone
        await self.ph_system.deposit(dance_ph)

        return dance_id

    def interpret_dance(
        self, dance_ph: Pheromone, agent_type: AgentType
    ) -> Dict[str, Any]:
        """An agent observes a waggle dance and decides whether to follow."""
        config = self.INTERPRETATION.get(agent_type, self.INTERPRETATION[AgentType.HORNET])

        wd = dance_ph.data.get("waggle_dance", {})
        enthusiasm = wd.get("enthusiasm", 0)
        distance = wd.get("distance_km", 0)
        value = wd.get("target_value", 0)

        enthusiasm_pass = enthusiasm >= config["follow_threshold"]
        distance_pass = distance <= config["max_distance_km"]

        follow_score = (
            enthusiasm * 0.35 +
            (value / 10.0) * 0.25 +
            (1 - min(1, distance / config["max_distance_km"])) * 0.15
        )

        if enthusiasm_pass and distance_pass:
            return {
                "decision": "FOLLOW",
                "confidence": follow_score,
                "swarm_size": int(wd.get("recommended_swarm_size", 1) * config["swarm_size_multiplier"]),
                "response_time_seconds": config["response_time_seconds"],
                "target_value": value,
            }
        return {
            "decision": "IGNORE",
            "confidence": 1 - follow_score,
            "reasons": [
                *( ["insufficient_enthusiasm"] if not enthusiasm_pass else [] ),
                *( ["target_too_distant"] if not distance_pass else [] ),
            ],
        }

    def _calc_enthusiasm(self, intel: Dict) -> float:
        """Calculate dance enthusiasm from target value and confidence."""
        value = intel.get("value", 5)
        confidence = intel.get("confidence", 0.5)
        return min(1.0, (value / 10) * 0.6 + confidence * 0.4)

    def _calc_choreography(self, intel: Dict, current: Location) -> Dict:
        """Calculate waggle choreography (direction, distance)."""
        target = intel.get("location", {})
        t_lat = target.get("latitude", current.latitude)
        t_lon = target.get("longitude", current.longitude)

        # Haversine distance
        distance = self._haversine(current.latitude, current.longitude, t_lat, t_lon)
        # Bearing
        angle = self._bearing(current.latitude, current.longitude, t_lat, t_lon)

        return {"angle": angle, "distance_km": round(distance, 1)}

    def _recommend_agent(self, intel: Dict) -> str:
        value = intel.get("value", 5)
        complexity = intel.get("complexity", 0.5)
        if complexity > 0.7 and value > 5:
            return "WORM"
        elif value > 7:
            return "HORNET"
        elif value > 5:
            return "KILLER_BEE"
        return "HORNET"

    def _calc_swarm_size(self, intel: Dict) -> int:
        value = intel.get("value", 5)
        defenses = intel.get("risk", {}).get("countermeasure_strength", 0.5)
        return min(20, int(max(1, value / 2) * (1 + defenses)))

    @staticmethod
    def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate haversine distance in km."""
        R = 6371  # Earth radius in km
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlambda = math.radians(lon2 - lon1)
        a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
        return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    @staticmethod
    def _bearing(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate bearing from point 1 to point 2."""
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        dlambda = math.radians(lon2 - lon1)
        x = math.sin(dlambda) * math.cos(phi2)
        y = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(dlambda)
        bearing = math.degrees(math.atan2(x, y))
        return (bearing + 360) % 360


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN PHEROMONE SYSTEM
# ═══════════════════════════════════════════════════════════════════════════════

class PheromoneSystem:
    """
    Core pheromone system coordinating all subsystems.
    Handles deposit, read, reinforce, evaporate operations.
    """

    def __init__(self, storage, sigil: SigilChain):
        self.storage = storage
        self.sigil = sigil
        self.decay_engine = DecayEngine()
        self.reinforcement_engine = ReinforcementEngine(storage, sigil)
        self.waggle_protocol = WaggleDanceProtocol(self, sigil)
        self.dialects = {
            AgentType.WORM: WormDialect(),
            AgentType.HORNET: HornetDialect(),
            AgentType.DRAGONFLY: DragonflyDialect(),
            AgentType.KILLER_BEE: KillerBeeDialect(),
        }
        self._deposit_rate_limiters: Dict[str, List[float]] = {}

    async def deposit(
        self, request: DepositRequest, creator: Creator,
        legal_context: Optional[Dict] = None
    ) -> Pheromone:
        """
        Deposit a new pheromone.
        Creates Redis entry (hot), Neo4j node (warm), and SIGIL entry (cold).
        """
        # Rate limiting
        if not self._check_rate_limit(creator.agent_id):
            raise HTTPException(429, "Rate limit exceeded")

        # Generate ID
        ph_id = f"ph_{secrets.token_hex(8)}_{int(time.time())}"

        # Apply agent-specific multipliers
        dialect = self.dialects.get(creator.agent_type)
        decay_rate = request.decay_rate or DECAY_RATES[request.type]
        ttl = request.ttl_seconds or DEFAULT_TTLS[request.type]

        if dialect:
            decay_rate *= dialect.DECAY_MULTIPLIER
            ttl = int(ttl * dialect.TTL_MULTIPLIER)

        # Build pheromone
        ph = Pheromone(
            pheromone_id=ph_id,
            type=request.type,
            subtype=request.subtype,
            location=request.location,
            timestamp=time.time(),
            strength=request.strength,
            decay_rate=decay_rate,
            ttl_seconds=ttl,
            creator=creator,
            data=request.data,
            visibility=request.visibility or self._default_visibility(request.type),
        )

        # Write to Redis (operational - hot path)
        await self.storage.save_pheromone(ph, ttl)

        # Write to Neo4j (graph - warm path, async)
        asyncio.create_task(self.storage.save_to_graph(ph))

        # Write to SIGIL (audit - cold path, async)
        asyncio.create_task(
            self.sigil.record_deposit(ph, legal_context or {"auto": True})
        )

        # Publish to real-time stream
        asyncio.create_task(self.storage.publish_stream(ph))

        return ph

    async def read(
        self, region: str, types: Optional[List[PheromoneType]] = None,
        near: Optional[Location] = None, radius_km: float = 100.0,
        min_strength: float = 0.1, agent_type: Optional[AgentType] = None,
        limit: int = 100
    ) -> List[Pheromone]:
        """
        Query pheromones with spatial and type filters.
        Returns pheromones visible to the requesting agent type.
        """
        # Fetch from Redis
        pheromones = await self.storage.query_pheromones(
            region=region,
            types=types,
            near=near,
            radius_km=radius_km,
            limit=limit,
        )

        # Filter by strength and visibility
        results = []
        for ph in pheromones:
            # Check minimum strength
            if ph.strength < min_strength:
                continue

            # Check visibility
            if agent_type and ph.visibility:
                if agent_type not in ph.visibility:
                    continue

            results.append(ph)

        return results

    async def reinforce(
        self, pheromone_id: str, agent_id: str,
        action_type: str, confirmation_data: Optional[Dict] = None
    ) -> float:
        """Reinforce a pheromone."""
        return await self.reinforcement_engine.reinforce(
            pheromone_id, agent_id, action_type, confirmation_data
        )

    async def evaporate(self, pheromone_id: str, reason: str = "natural") -> bool:
        """Force-evaporate a pheromone."""
        ph = await self.storage.get_pheromone(pheromone_id)
        if not ph:
            return False

        # Remove from Redis
        await self.storage.delete_pheromone(pheromone_id)

        # Mark in Neo4j
        await self.storage.mark_evaporated(pheromone_id, ph.strength)

        # Record in SIGIL
        lifetime = time.time() - ph.timestamp
        await self.sigil.record_evaporation(pheromone_id, ph.strength, lifetime)

        return True

    async def perform_waggle_dance(
        self, agent_id: str, agent_type: AgentType,
        target_intel: Dict, location: Location
    ) -> str:
        """Perform a waggle dance."""
        return await self.waggle_protocol.perform_dance(
            agent_id, agent_type, target_intel, location
        )

    async def run_decay_cycle(self, region: str, batch_size: int = 1000) -> Dict:
        """Run a decay sweep over a region."""
        stats = {"processed": 0, "evaporated": 0, "deferred": 0}

        pheromones = await self.storage.get_decay_batch(region, batch_size)

        for ph in pheromones:
            new_strength = self.decay_engine.calculate_strength(
                initial_strength=ph.strength,
                pheromone_type=ph.type,
                created_at=ph.timestamp,
                decay_rate=ph.decay_rate,
                data=ph.data,
            )

            if new_strength <= 0.05:
                await self.evaporate(ph.pheromone_id)
                stats["evaporated"] += 1
            else:
                await self.storage.update_strength(ph.pheromone_id, new_strength)
                stats["processed"] += 1

        return stats

    def _check_rate_limit(self, agent_id: str, max_per_minute: int = 60) -> bool:
        """Simple sliding window rate limiter."""
        now = time.time()
        window = self._deposit_rate_limiters.setdefault(agent_id, [])
        # Remove old entries
        window[:] = [t for t in window if now - t < 60]
        if len(window) >= max_per_minute:
            return False
        window.append(now)
        return True

    def _default_visibility(self, ph_type: PheromoneType) -> List[AgentType]:
        """Default visibility by pheromone type."""
        visibility_map = {
            PheromoneType.TRAIL: list(AgentType),
            PheromoneType.ALERT: list(AgentType),
            PheromoneType.FOOD: [AgentType.HORNET, AgentType.DRAGONFLY],
            PheromoneType.HOME: list(AgentType),
            PheromoneType.DANGER: list(AgentType),
            PheromoneType.RECRUIT: [AgentType.HORNET, AgentType.KILLER_BEE, AgentType.DRAGONFLY],
            PheromoneType.CLAIM: list(AgentType),
        }
        return visibility_map.get(ph_type, list(AgentType))


# ═══════════════════════════════════════════════════════════════════════════════
# STORAGE ABSTRCTION (Redis + Neo4j)
# ═══════════════════════════════════════════════════════════════════════════════

class PheromoneStorage:
    """
    Dual-storage backend: Redis (hot) + Neo4j (warm).
    Abstracts storage operations from the pheromone system.
    """

    def __init__(self, redis_url: str, neo4j_url: str, neo4j_auth: Tuple[str, str]):
        self.redis = None  # aioredis.from_url(redis_url)
        self.neo4j_driver = AsyncGraphDatabase.driver(neo4j_url, auth=neo4j_auth)

    async def save_pheromone(self, ph: Pheromone, ttl: int):
        """Save pheromone to Redis with TTL."""
        key = f"ph:{ph.pheromone_id}"
        pipe = self.redis.pipeline()

        # Main store
        pipe.setex(key, ttl, ph.json())

        # Geographic index
        geo_key = f"ph:geo:{ph.location.region}:{ph.type.value.lower()}"
        pipe.geoadd(geo_key, (ph.location.longitude, ph.location.latitude, ph.pheromone_id))

        # Heatmap sorted set (score = strength * 100 for integer sorting)
        heatmap_key = f"ph:heatmap:{ph.location.region}"
        pipe.zadd(heatmap_key, {ph.pheromone_id: int(ph.strength * 100)})

        # Type index
        type_key = f"ph:index:{ph.location.region}:{ph.type.value.lower()}"
        pipe.sadd(type_key, ph.pheromone_id)

        # Agent index
        agent_key = f"ph:agent:{ph.creator.agent_id}"
        pipe.sadd(agent_key, ph.pheromone_id)

        # Decay queue
        evap_time = time.time() + ttl
        pipe.zadd("ph:decay_queue", {ph.pheromone_id: evap_time})

        await pipe.execute()

    async def get_pheromone(self, pheromone_id: str) -> Optional[Pheromone]:
        """Fetch a single pheromone by ID."""
        data = await self.redis.get(f"ph:{pheromone_id}")
        if data:
            return Pheromone.parse_raw(data)
        return None

    async def query_pheromones(
        self, region: str, types: Optional[List[PheromoneType]] = None,
        near: Optional[Location] = None, radius_km: float = 100.0,
        limit: int = 100
    ) -> List[Pheromone]:
        """Query pheromones with spatial and type filters."""
        ids = set()

        if near:
            # Spatial query using Redis GEOSEARCH
            for ph_type in (types or list(PheromoneType)):
                geo_key = f"ph:geo:{region}:{ph_type.value.lower()}"
                results = await self.redis.geosearch(
                    geo_key,
                    longitude=near.longitude,
                    latitude=near.latitude,
                    radius=radius_km,
                    unit="km",
                    count=limit,
                )
                ids.update(results)
        else:
            # Non-spatial: use type indexes
            for ph_type in (types or list(PheromoneType)):
                type_key = f"ph:index:{region}:{ph_type.value.lower()}"
                members = await self.redis.smembers(type_key)
                ids.update(members)

        # Fetch full pheromones
        pheromones = []
        for ph_id in list(ids)[:limit]:
            ph = await self.get_pheromone(ph_id)
            if ph:
                pheromones.append(ph)

        return pheromones

    async def update_strength(self, pheromone_id: str, new_strength: float):
        """Update pheromone strength."""
        ph = await self.get_pheromone(pheromone_id)
        if ph:
            ph.strength = new_strength
            # Get remaining TTL
            ttl = await self.redis.ttl(f"ph:{pheromone_id}")
            await self.redis.setex(f"ph:{pheromone_id}", max(1, ttl), ph.json())
            # Update heatmap
            await self.redis.zadd(
                f"ph:heatmap:{ph.location.region}",
                {pheromone_id: int(new_strength * 100)}
            )

    async def delete_pheromone(self, pheromone_id: str):
        """Delete pheromone from Redis."""
        ph = await self.get_pheromone(pheromone_id)
        if not ph:
            return

        pipe = self.redis.pipeline()
        pipe.delete(f"ph:{pheromone_id}")
        pipe.zrem("ph:decay_queue", pheromone_id)

        geo_key = f"ph:geo:{ph.location.region}:{ph.type.value.lower()}"
        pipe.zrem(geo_key, pheromone_id)

        heatmap_key = f"ph:heatmap:{ph.location.region}"
        pipe.zrem(heatmap_key, pheromone_id)

        type_key = f"ph:index:{ph.location.region}:{ph.type.value.lower()}"
        pipe.srem(type_key, pheromone_id)

        agent_key = f"ph:agent:{ph.creator.agent_id}"
        pipe.srem(agent_key, pheromone_id)

        await pipe.execute()

    async def save_to_graph(self, ph: Pheromone):
        """Save pheromone to Neo4j graph."""
        async with self.neo4j_driver.session() as session:
            await session.run("""
                MERGE (a:Agent {agent_id: $agent_id})
                SET a.agent_type = $agent_type,
                    a.swarm_id = $swarm_id
                MERGE (p:Pheromone {pheromone_id: $ph_id})
                SET p.type = $type,
                    p.subtype = $subtype,
                    p.strength = $strength,
                    p.decay_rate = $decay_rate,
                    p.created_at = $timestamp,
                    p.expires_at = $expires_at,
                    p.location = point({latitude: $lat, longitude: $lon}),
                    p.region = $region,
                    p.status = 'active'
                MERGE (a)-[d:DEPOSITED]->(p)
                SET d.timestamp = $timestamp,
                    d.initial_strength = $strength
                WITH p
                OPTIONAL MATCH (t:Entity {entity_id: $entity_id})
                FOREACH (x IN CASE WHEN $entity_id IS NOT NULL THEN [1] ELSE [] END |
                    MERGE (t:Entity {entity_id: $entity_id})
                    MERGE (p)-[:TARGETS]->(t)
                )
            """,
                agent_id=ph.creator.agent_id,
                agent_type=ph.creator.agent_type.value,
                swarm_id=ph.creator.swarm_id,
                ph_id=ph.pheromone_id,
                type=ph.type.value,
                subtype=ph.subtype,
                strength=ph.strength,
                decay_rate=ph.decay_rate,
                timestamp=ph.timestamp,
                expires_at=ph.timestamp + ph.ttl_seconds,
                lat=ph.location.latitude,
                lon=ph.location.longitude,
                region=ph.location.region,
                entity_id=ph.location.entity_id,
            )

    async def mark_evaporated(self, pheromone_id: str, final_strength: float):
        """Mark pheromone as evaporated in Neo4j."""
        async with self.neo4j_driver.session() as session:
            await session.run("""
                MATCH (p:Pheromone {pheromone_id: $ph_id})
                SET p.evaporated_at = $now,
                    p.final_strength = $final_strength,
                    p.status = 'evaporated'
            """, ph_id=pheromone_id, now=time.time(), final_strength=final_strength)

    async def publish_stream(self, ph: Pheromone):
        """Publish pheromone to real-time stream."""
        stream_key = f"ph:stream:{ph.location.region}"
        message = {
            "event": "pheromone_deposited",
            "pheromone_id": ph.pheromone_id,
            "type": ph.type.value,
            "strength": ph.strength,
            "agent_id": ph.creator.agent_id,
            "agent_type": ph.creator.agent_type.value,
            "location": {"lat": ph.location.latitude, "lon": ph.location.longitude},
            "timestamp": ph.timestamp,
        }
        await self.redis.xadd(stream_key, message)

    async def get_decay_batch(self, region: str, batch_size: int) -> List[Pheromone]:
        """Get batch of pheromones for decay processing."""
        # Get pheromones with low strength from heatmap
        ids = await self.redis.zrangebyscore(
            f"ph:heatmap:{region}", 0, 15, start=0, num=batch_size
        )
        results = []
        for ph_id in ids:
            ph = await self.get_pheromone(ph_id)
            if ph:
                results.append(ph)
        return results

    # SIGIL storage methods
    async def append_sigil(self, entry: SigilEntry):
        """Append SIGIL entry to storage."""
        key = f"sigil:{entry.sigil_id}"
        await self.redis.set(key, json.dumps({
            "sigil_id": entry.sigil_id,
            "entry_type": entry.entry_type,
            "pheromone_id": entry.pheromone_id,
            "agent_id": entry.agent_id,
            "operation_data": entry.operation_data,
            "timestamp": entry.timestamp,
            "previous_hash": entry.previous_hash,
            "content_hash": entry.content_hash,
            "signature": entry.signature,
        }))
        # Update chain head
        await self.redis.set("sigil:chain_head", entry.content_hash or "")
        # Add to index
        await self.redis.zadd("sigil:chain", {entry.sigil_id: entry.timestamp})

    async def get_chain_head(self) -> Optional[str]:
        """Get latest chain hash."""
        head = await self.redis.get("sigil:chain_head")
        return head

    async def get_all_sigils(self) -> List[SigilEntry]:
        """Get all SIGIL entries."""
        ids = await self.redis.zrange("sigil:chain", 0, -1)
        entries = []
        for sig_id in ids:
            data = await self.redis.get(f"sigil:{sig_id}")
            if data:
                obj = json.loads(data)
                entries.append(SigilEntry(**obj))
        return entries


# ═══════════════════════════════════════════════════════════════════════════════
# FASTAPI APPLICATION
# ═══════════════════════════════════════════════════════════════════════════════

security = HTTPBearer()
app = FastAPI(title="DEFONEOS Pheromone API", version="2.0.0")

# Global instances (initialized in lifespan)
ph_system: Optional[PheromoneSystem] = None
sigil_chain: Optional[SigilChain] = None

@app.on_event("startup")
async def startup():
    """Initialize storage and subsystems."""
    global ph_system, sigil_chain

    # Generate signing key (in production, load from HSM)
    private_key = Ed25519PrivateKey.generate()

    # Initialize storage
    storage = PheromoneStorage(
        redis_url="redis://localhost:6379",
        neo4j_url="bolt://localhost:7687",
        neo4j_auth=("neo4j", "password"),
    )

    # Initialize SIGIL
    sigil_chain = SigilChain(storage, private_key)

    # Initialize pheromone system
    ph_system = PheromoneSystem(storage, sigil_chain)


@app.post("/pheromones", status_code=201)
async def deposit_pheromone(request: DepositRequest):
    """Deposit a new pheromone."""
    # In production: extract creator from auth token
    creator = Creator(agent_id="test_agent", agent_type=AgentType.HORNET)
    ph = await ph_system.deposit(request, creator)
    return {
        "success": True,
        "pheromone_id": ph.pheromone_id,
        "sigil_id": ph.sigil_hash,
        "strength": ph.strength,
        "ttl_seconds": ph.ttl_seconds,
    }


@app.get("/pheromones")
async def read_pheromones(
    region: str,
    type: Optional[List[PheromoneType]] = None,
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    radius_km: float = 100.0,
    min_strength: float = 0.1,
    agent_type: Optional[AgentType] = None,
    limit: int = 100,
):
    """Query pheromones in a region."""
    near = None
    if lat is not None and lon is not None:
        near = Location(latitude=lat, longitude=lon, region=region)

    pheromones = await ph_system.read(
        region=region, types=type, near=near,
        radius_km=radius_km, min_strength=min_strength,
        agent_type=agent_type, limit=limit,
    )

    return {
        "pheromones": [ph.dict() for ph in pheromones],
        "total_count": len(pheromones),
        "region": region,
    }


@app.get("/pheromones/{pheromone_id}")
async def get_pheromone(pheromone_id: str):
    """Get a specific pheromone."""
    ph = await ph_system.storage.get_pheromone(pheromone_id)
    if not ph:
        raise HTTPException(404, "Pheromone not found")
    return ph.dict()


@app.delete("/pheromones/{pheromone_id}")
async def evaporate_pheromone(pheromone_id: str, reason: str = "manual"):
    """Force-evaporate a pheromone."""
    success = await ph_system.evaporate(pheromone_id, reason)
    if not success:
        raise HTTPException(404, "Pheromone not found")
    return {"success": True, "pheromone_id": pheromone_id, "reason": reason}


@app.post("/pheromones/{pheromone_id}/reinforce")
async def reinforce_pheromone(
    pheromone_id: str, request: ReinforceRequest
):
    """Reinforce a pheromone."""
    try:
        new_strength = await ph_system.reinforce(
            pheromone_id, request.agent_id,
            request.action_type, request.confirmation_data
        )
        return {"success": True, "new_strength": new_strength}
    except ValueError as e:
        raise HTTPException(404, str(e))


@app.post("/waggle/dance")
async def perform_waggle_dance(request: WaggleDanceRequest):
    """Perform a waggle dance for recruitment."""
    # In production: validate agent credentials
    agent_type = AgentType.DRAGONFLY  # Only dragonflies perform dances
    dance_id = await ph_system.perform_waggle_dance(
        request.agent_id, agent_type, request.target_intel, request.location
    )
    return {
        "pheromone_id": dance_id,
        "status": "dance_performed",
        "followers_expected": "varies",
    }


@app.post("/sigil/verify")
async def verify_sigil_chain():
    """Verify SIGIL chain integrity."""
    report = await sigil_chain.verify_chain()
    return report


@app.websocket("/pheromones/stream")
async def pheromone_stream(websocket: WebSocket):
    """WebSocket real-time pheromone stream."""
    await websocket.accept()

    # Subscribe to region stream
    # In production: use Redis pub/sub or XREAD
    try:
        while True:
            # Send heartbeat
            await websocket.send_json({
                "event": "heartbeat",
                "timestamp": time.time(),
            })
            await asyncio.sleep(5)
    except Exception:
        await websocket.close()


# ═══════════════════════════════════════════════════════════════════════════════
# ENTRY POINT
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
```

### 10.2 Celery Background Tasks

```python
# tasks.py — Celery beat scheduled tasks for decay and maintenance

from celery import Celery
from celery.schedules import crontab

celery_app = Celery("pheromone", broker="redis://localhost:6379/1")

@celery_app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    # Decay sweep every 60 seconds
    sender.add_periodic_task(60.0, decay_sweep.s(), name="decay-sweep")
    # Evaporation sweep every 30 seconds
    sender.add_periodic_task(30.0, evaporation_sweep.s(), name="evaporation-sweep")
    # Heatmap aggregation every 5 minutes
    sender.add_periodic_task(300.0, aggregate_heatmap.s(), name="heatmap-agg")
    # SIGIL chain verification every hour
    sender.add_periodic_task(3600.0, verify_sigil.s(), name="sigil-verify")

@celery_app.task
def decay_sweep(region: str = "global", batch_size: int = 1000):
    """Periodic decay sweep over all regions."""
    # Implementation calls ph_system.run_decay_cycle()
    pass

@celery_app.task
def evaporation_sweep(batch_size: int = 500):
    """Process evaporation queue."""
    pass

@celery_app.task
def aggregate_heatmap():
    """Aggregate pheromone data for heatmap visualization."""
    pass

@celery_app.task
def verify_sigil():
    """Verify SIGIL chain integrity."""
    pass
```

---

## 11. SWARM COMMUNICATION ARCHITECTURE

### 11.1 Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           SWARM PHEROMONE + SIGIL ARCHITECTURE                           │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                           AGENT LAYER (4 Agent Types)                                │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                            │  │
│  │  │  WORM    │  │  HORNET  │  │ DRAGONFLY│  │KILLER BEE│                            │  │
│  │  │Subtle    │  │Aggressive│  │ Analytical│  │  Swarm   │                            │  │
│  │  │TRAIL     │  │FOOD      │  │ WAGGLE  │  │ RECRUIT  │                            │  │
│  │  │HOME      │  │ALERT     │  │ DANCE   │  │ SWARM    │                            │  │
│  │  │FOOD      │  │TRAIL     │  │ RECRUIT │  │ SIGNAL   │                            │  │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘                            │  │
│  │       │             │             │             │                                   │  │
│  │       └─────────────┴──────┬──────┴─────────────┘                                   │  │
│  │                            │                                                        │  │
│  │                   ┌────────▼─────────┐                                                │  │
│  │                   │  AGENT DIALECTS  │  ← Type-specific read/write behaviors          │  │
│  │                   │  Interpreter     │                                                │  │
│  │                   └────────┬─────────┘                                                │  │
│  └────────────────────────────┼──────────────────────────────────────────────────────────┘  │
│                               │                                                           │
│  ┌────────────────────────────▼──────────────────────────────────────────────────────────┐  │
│  │                        PHEROMONE SYSTEM (Core Engine)                                │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │  │
│  │  │   DEPOSIT    │  │    READ      │  │  REINFORCE   │  │  EVAPORATE   │             │  │
│  │  │  validate()  │  │  spatial()   │  │  confirm()   │  │  decay()     │             │  │
│  │  │  sign()      │  │  filter()    │  │  boost()     │  │  cleanup()   │             │  │
│  │  │  store()     │  │  sort()      │  │  record()    │  │  archive()   │             │  │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘             │  │
│  │         └─────────────────┬───────────────────┘                 │                     │  │
│  │                           │                                     │                     │  │
│  │         ┌─────────────────┼─────────────────┐                   │                     │  │
│  │         ▼                 ▼                 ▼                   ▼                     │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │  │
│  │  │ DECAY ENGINE │  │REINFORCEMENT │  │WAGGLE DANCE  │  │ RATE LIMITER │              │  │
│  │  │ exponential  │  │ confirmation │  │ protocol     │  │ sliding win. │              │  │
│  │  │ type-adjust  │  │ multi-agent  │  │ recruitment  │  │ per-agent    │              │  │
│  │  │ evaporation  │  │ contradiction│  │ interpret    │  │ burst ctrl   │              │  │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │  │
│  └─────────┼─────────────────┼─────────────────┼─────────────────┼──────────────────────┘  │
│            │                 │                 │                 │                         │
│  ┌─────────┼─────────────────┼─────────────────┼─────────────────┼──────────────────────┐  │
│  │         ▼                 ▼                 ▼                 ▼                      │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │  │
│  │  │    REDIS     │  │    NEO4J     │  │   SIGIL      │  │   STREAM     │              │  │
│  │  │   (HOT)      │  │   (WARM)     │  │   (COLD)     │  │   (REALTIME) │              │  │
│  │  │              │  │              │  │              │  │              │              │  │
│  │  │ • Primary    │  │ • Graph      │  │ • Immutable  │  │ • Pub/Sub    │              │  │
│  │  │   store      │  │   relations  │  │   chain      │  │ • WebSocket  │              │  │
│  │  │ • Geo index  │  │ • History    │  │ • Signed     │  │ • SSE        │              │  │
│  │  │ • TTL expiry │  │ • Analytics  │  │ • Tamper-    │  │ • Cesium     │              │  │
│  │  │ • Heatmap zset│ │ • Path query │  │   evident    │  │   feed       │              │  │
│  │  │ • Decay queue│  │ • Centrality │  │ • Legal      │  │ • UE5 feed   │              │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘              │  │
│  └───────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                           │
│  ┌───────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                        VISUALIZATION LAYER                                            │  │
│  │                                                                                       │  │
│  │   ┌────────────────┐    ┌────────────────┐    ┌────────────────┐                     │  │
│  │   │  CESIUM 3D     │    │  UE5 SOV SPACE │    │  PULSAR DASH   │                     │  │
│  │   │  Globe         │    │  Tunnel View   │    │  Metrics       │                     │  │
│  │   │                │    │                │    │                │                     │  │
│  │   │ • Heat map     │    │ • 3D trails    │    │ • Throughput   │                     │  │
│  │   │ • Color-coded  │    │ • Network      │    │ • Latency      │                     │  │
│  │   │   markers      │    │   topology     │    │ • Error rates  │                     │  │
│  │   │ • Agent icons  │    │ • Agent avatars│    │ • Agent counts │                     │  │
│  │   │ • Pulse effects│    │ • Particle fx  │    │ • Decay stats  │                     │  │
│  │   │ • Time slider  │    │ • Dance anim   │    │ • SIGIL status │                     │  │
│  │   └────────────────┘    └────────────────┘    └────────────────┘                     │  │
│  └───────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                           │
│  ┌───────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                        OVERLAY LAYERS                                                │  │
│  │                                                                                       │  │
│  │   ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐                     │  │
│  │   │   HIVE     │  │  COUNCIL   │  │   LEGAL    │  │ OPERATIONS │                     │  │
│  │   │ Monitor    │  │ Authorize  │  │ Review     │  │ Command    │                     │  │
│  │   │ Deploy     │  │ Escalate   │  │ Evidence   │  │ Control    │                     │  │
│  │   │ Visualize  │  │ Override   │  │ Export     │  │ Direct     │                     │  │
│  │   └────────────┘  └────────────┘  └────────────┘  └────────────┘                     │  │
│  └───────────────────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

### 11.2 Data Flow Diagrams

#### Pheromone Deposit Flow

```
AGENT
 │
 │ 1. Action completed → deposit request
 │
 ▼
┌─────────────────┐
│ PHEROMONE SYSTEM │
│                 │
│ 2. Validate     │
│ 3. Sign         │
│ 4. Rate limit   │
└────────┬────────┘
         │
         │ 5. Write (parallel)
         ├───► REDIS (hot, TTL) ──────► Other agents read immediately
         ├───► NEO4j (warm, graph) ───► Analytics, history
         ├───► SIGIL (cold, chain) ───► Audit, legal
         └───► STREAM (pub/sub) ──────► Real-time visualization
         │
         │ 6. Return ph_id + sigil_id
         ▼
      AGENT (continues operation)
```

#### Pheromone Read + Reinforce Flow

```
AGENT B
 │
 │ 1. Query region for pheromones
 │    (spatial + type + visibility filters)
 │
 ▼
┌─────────────────┐
│ PHEROMONE SYSTEM │
│                 │
│ 2. Query Redis  │
│    GEOSEARCH    │
│    ZRANGEBYSCORE│
└────────┬────────┘
         │
         │ 3. Return matching pheromones
         │    with current strength
         ▼
      AGENT B evaluates pheromones
      using agent-specific dialect
         │
         │ 4. Decide: FOLLOW / AVOID / IGNORE
         │
         │ 5. Follow successful → reinforce()
         │
         ▼
┌─────────────────┐
│ REINFORCEMENT   │
│                 │
│ 6. Update       │
│    strength     │
│ 7. Record SIGIL │
│ 8. Publish event│
└─────────────────┘
```

#### Waggle Dance Flow

```
DRAGONFLY
 │
 │ 1. Discovers high-value target
 │ 2. Performs ASSESSMENT
 │
 ▼
┌──────────────────┐
│ WAGGLE DANCE     │
│ PROTOCOL         │
│                  │
│ 3. Calculate:    │
│    • Enthusiasm  │
│    • Direction   │
│    • Distance    │
│    • Quality     │
│ 4. Build RECRUIT │
│    pheromone     │
└────────┬─────────┘
         │
         │ 5. Deposit dance pheromone
         │
         ├───► STREAM: "waggle_dance event"
         │
         ▼
   HORNETs + KILLER BEEs observe
         │
         │ 6. Each agent INTERPRETS dance
         │    using agent-specific thresholds
         │
         ├─ HORNET: enthusiasm >= 0.6? → FOLLOW
         ├─ KILLER BEE: enthusiasm >= 0.5? → FOLLOW
         └─ WORM: enthusiasm >= 0.8? → FOLLOW
         │
         ▼
   Following agents CONVERGE on target
         │
         │ 7. Successful exploitation
         │ 8. Reinforce FOOD pheromone
         │ 9. More agents attracted
         │
         ▼
   SWARM OPERATION (emergent coordination)
```

---

## 12. SECURITY MODEL

### 12.1 Threat Model

| Threat | Mitigation |
|--------|-----------|
| **Pheromone Spoofing** | Ed25519 signatures on all pheromones; only authorized agents can deposit |
| **Replay Attacks** | Unique pheromone IDs with timestamp validation; nonce enforcement |
| **Denial of Service** | Rate limiting per agent; circuit breakers; resource quotas |
| **Eavesdropping** | Visibility lists restrict who can read; encrypted payloads for sensitive data |
| **Tampering (Audit)** | SIGIL chain with cryptographic integrity; tamper-evident logging |
| **Privilege Escalation** | Role-based access control; Council authorization for sensitive ops |
| **Collusion** | Multi-signature for critical operations; independent audit nodes |

### 12.2 Signature Scheme

```python
# Every pheromone is signed by its creator agent

SIGNING_SCHEME = {
    "algorithm": "Ed25519",
    "key_derivation": "Agent-specific keys derived from HSM master",
    "signature_scope": "entire pheromone payload (canonical JSON)",
    "verification": "Hive nodes verify signatures before accepting",
    "revocation": "Agent keys can be revoked via Council order",
    "rotation": "Keys rotated every 24 hours or on compromise",
}
```

### 12.3 Rate Limiting

```python
RATE_LIMITS = {
    # Per-agent limits (sliding window)
    "deposit_per_minute": 60,
    "deposit_per_hour": 1000,
    "reinforce_per_minute": 120,
    "read_per_minute": 600,

    # Per-region limits (system protection)
    "region_deposit_per_second": 1000,
    "region_total_pheromones": 100000,

    # Burst control
    "burst_allowance": 10,  # Allow burst of 10 over limit
    "burst_recovery": 60,   # Seconds to recover 1 burst token
}
```

---

## 13. PERFORMANCE ENGINEERING

### 13.1 Performance Targets

| Metric | Target | Current Design |
|--------|--------|---------------|
| Deposit latency (p99) | < 10ms | ~5ms (Redis SETEX) |
| Read latency (p99) | < 20ms | ~8ms (Redis GEOSEARCH) |
| Reinforce latency (p99) | < 15ms | ~6ms (GET+SET pipeline) |
| Decay cycle (1000 ph) | < 1s | ~200ms (batch processing) |
| Stream throughput | > 50K msg/s | Redis XADD handles this |
| Total operations/sec | > 10K | Redis cluster: 100K+ |
| Geo query (100km radius) | < 50ms | Redis GEORADIUS: ~10ms |

### 13.2 Scaling Strategy

```
REDIS CLUSTER TOPOLOGY:

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Redis Node  │────▶│ Redis Node  │────▶│ Redis Node  │
│ EU-WEST     │     │ US-EAST     │     │ AP-SOUTH    │
│ (Master)    │     │ (Master)    │     │ (Master)    │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
  ┌────┴────┐         ┌────┴────┐         ┌────┴────┐
  │ Replica │         │ Replica │         │ Replica │
  └─────────┘         └─────────┘         └─────────┘

Sharding by region (EU-WEST, US-EAST, AP-SOUTH, etc.)
Each region has master + replica for HA
Cross-region replication for global queries

NEO4J CLUSTER:

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Neo4j Core │◄───►│  Neo4j Core │◄───►│  Neo4j Core │
│   (Leader)  │     │  (Follower) │     │  (Follower) │
└─────────────┘     └─────────────┘     └─────────────┘
       ▲
  ┌────┴────┐
  │ Read    │
  │ Replicas│
  └─────────┘

Causal clustering: 3 core nodes + read replicas
Write to leader, read from any node
```

### 13.3 Caching Strategy

| Layer | Cache | TTL | Purpose |
|-------|-------|-----|---------|
| Hot queries | Redis | 5s | Frequent region queries |
| Agent dialects | In-memory | Infinite | Agent behavior rules |
| Heatmap tiles | CDN | 10s | Cesium visualization tiles |
| SIGIL chain head | Redis | 60s | Latest chain hash |
| Agent positions | Redis | 2s | Real-time agent tracking |

---

## 14. DEPLOYMENT TOPOLOGY

### 14.1 Kubernetes Deployment

```yaml
# pheromone-api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pheromone-api
  namespace: defoneos
spec:
  replicas: 3
  selector:
    matchLabels:
      app: pheromone-api
  template:
    metadata:
      labels:
        app: pheromone-api
    spec:
      containers:
        - name: api
          image: defoneos/pheromone-api:2.0.0
          ports:
            - containerPort: 8080
          env:
            - name: REDIS_URL
              value: "redis://redis-cluster:6379"
            - name: NEO4J_URL
              value: "bolt://neo4j-cluster:7687"
            - name: SIGIL_HSM_ENDPOINT
              value: "hsm://vault:8200"
          resources:
            requests:
              memory: "512Mi"
              cpu: "500m"
            limits:
              memory: "2Gi"
              cpu: "2000m"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pheromone-decay-worker
  namespace: defoneos
spec:
  replicas: 2
  selector:
    matchLabels:
      app: decay-worker
  template:
    metadata:
      labels:
        app: decay-worker
    spec:
      containers:
        - name: worker
          image: defoneos/pheromone-decay:2.0.0
          env:
            - name: CELERY_BROKER
              value: "redis://redis-cluster:6379/1"
            - name: DECAY_BATCH_SIZE
              value: "1000"
            - name: REGIONS
              value: "eu-west,us-east,ap-south,eu-north,us-west"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pheromone-stream
  namespace: defoneos
spec:
  replicas: 2
  selector:
    matchLabels:
      app: stream-server
  template:
    metadata:
      labels:
        app: stream-server
    spec:
      containers:
        - name: stream
          image: defoneos/pheromone-stream:2.0.0
          ports:
            - containerPort: 8081
```

---

## 15. APPENDICES

### Appendix A: Glossary

| Term | Definition |
|------|-----------|
| **Pheromone** | A digital trail marker deposited by an agent in the environment |
| **SIGIL** | An immutable, cryptographically signed audit entry |
| **Decay** | The process by which pheromone strength decreases over time |
| **Reinforcement** | The strengthening of a pheromone when an agent confirms its validity |
| **Evaporation** | The complete removal of a pheromone when its strength falls below threshold |
| **Waggle Dance** | A rich information broadcast (RECRUIT pheromone) performed by DRAGONFLY agents |
| **Stigmergy** | Indirect coordination through environmental modification |
| **Dialect** | Agent-type-specific pheromone read/write behavior |
| **Visibility** | Access control list determining which agent types can read a pheromone |
| **Hive** | Central monitoring and deployment authority |
| **Council** | Authorization body for sensitive operations |

### Appendix B: Configuration Reference

```yaml
# config.yaml — Complete system configuration
pheromone:
  protocol_version: "2.0"

  decay:
    enabled: true
    cycle_interval_seconds: 60
    evaporation_threshold: 0.05
    type_rates:
      TRAIL: 0.05
      ALERT: 0.20
      FOOD: 0.02
      HOME: 0.01
      DANGER: 0.005
      RECRUIT: 0.15
      CLAIM: 0.03

  ttl:
    defaults:
      TRAIL: 21600    # 6h
      ALERT: 7200     # 2h
      FOOD: 86400     # 24h
      HOME: 172800    # 48h
      DANGER: 604800  # 7d
      RECRUIT: 7200   # 2h
      CLAIM: 86400    # 24h

  reinforcement:
    strength_cap: 1.0
    strength_floor: 0.0
    values:
      trail_followed: 0.15
      alert_confirmed: 0.25
      food_exploited: 0.30
      home_used: 0.10
      danger_confirmed: 0.20
      contradiction: -0.30

  agents:
    dialects:
      WORM:
        ttl_multiplier: 3.0
        decay_multiplier: 0.4
        write_types: [TRAIL, HOME, FOOD]
        read_types: [TRAIL, ALERT, DANGER]
      HORNET:
        ttl_multiplier: 0.3
        decay_multiplier: 2.5
        write_types: [TRAIL, ALERT, DANGER, FOOD]
        read_types: [FOOD, ALERT, TRAIL]
      DRAGONFLY:
        ttl_multiplier: 2.0
        decay_multiplier: 0.5
        write_types: [FOOD, RECRUIT, CLAIM, TRAIL]
        read_types: [ALL]
      KILLER_BEE:
        ttl_multiplier: 0.1
        decay_multiplier: 3.0
        write_types: [ALERT, DANGER, CLAIM, RECRUIT]
        read_types: [RECRUIT, FOOD, CLAIM]

  waggle_dance:
    interpretation:
      HORNET:
        follow_threshold: 0.6
        swarm_size_multiplier: 1.0
        response_time_seconds: 300
      KILLER_BEE:
        follow_threshold: 0.5
        swarm_size_multiplier: 2.0
        response_time_seconds: 120
      WORM:
        follow_threshold: 0.8
        swarm_size_multiplier: 0.5
        response_time_seconds: 1800

  rate_limits:
    deposit_per_minute: 60
    deposit_per_hour: 1000
    reinforce_per_minute: 120
    read_per_minute: 600
    region_deposit_per_second: 1000

  sigil:
    signing_algorithm: "Ed25519"
    chain_verification_interval_seconds: 3600
    legal_export_format: "json"
    retention_class: "permanent"

  storage:
    redis:
      cluster: true
      nodes: ["redis-0:6379", "redis-1:6379", "redis-2:6379"]
      key_prefix: "ph:"
      default_ttl: 3600
    neo4j:
      uri: "bolt://neo4j:7687"
      auth: ["neo4j", "${NEO4J_PASSWORD}"]
      max_pool_size: 50
```

### Appendix C: API Quick Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/pheromones` | POST | Deposit new pheromone |
| `/pheromones` | GET | Query pheromones (spatial + filters) |
| `/pheromones/{id}` | GET | Get specific pheromone |
| `/pheromones/{id}` | DELETE | Force-evaporate pheromone |
| `/pheromones/{id}/reinforce` | POST | Reinforce pheromone |
| `/pheromones/{id}/contradict` | POST | Contradict (weaken) pheromone |
| `/pheromones/stream` | WS | Real-time WebSocket stream |
| `/waggle/dance` | POST | Perform waggle dance |
| `/sigil/verify` | POST | Verify chain integrity |
| `/sigil/export` | GET | Export for legal review |

### Appendix D: Database Migration Scripts

```cypher
// Neo4j initial schema setup
CREATE CONSTRAINT pheromone_id_unique IF NOT EXISTS
FOR (p:Pheromone) REQUIRE p.pheromone_id IS UNIQUE;

CREATE CONSTRAINT agent_id_unique IF NOT EXISTS
FOR (a:Agent) REQUIRE a.agent_id IS UNIQUE;

CREATE INDEX pheromone_type_idx IF NOT EXISTS
FOR (p:Pheromone) ON (p.type);

CREATE INDEX pheromone_region_idx IF NOT EXISTS
FOR (p:Pheromone) ON (p.region);

CREATE INDEX pheromone_status_idx IF NOT EXISTS
FOR (p:Pheromone) ON (p.status);

CREATE POINT INDEX pheromone_location_idx IF NOT EXISTS
FOR (p:Pheromone) ON (p.location);
```

```python
# Redis initialization script
import redis

r = redis.Redis(host='localhost', port=6379)

# Create index structures
# (Handled dynamically by the application on first write)

# Pre-warm with test data (optional)
r.set("ph:system:status", "initialized")
r.set("ph:system:version", "2.0.0")
r.set("sigil:chain_head", "")
```

### Appendix E: Testing Strategy

```python
# test_pheromone_system.py

import pytest
from unittest.mock import Mock, AsyncMock

class TestPheromoneSystem:
    async def test_deposit_creates_all_records(self):
        """Verify deposit creates Redis, Neo4j, and SIGIL entries."""
        pass

    async def test_decay_reduces_strength(self):
        """Verify exponential decay calculation."""
        pass

    async def test_reinforcement_increases_strength(self):
        """Verify reinforcement boosts pheromone strength."""
        pass

    async def test_evaporation_below_threshold(self):
        """Verify pheromone evaporates when strength < 0.05."""
        pass

    async def test_agent_visibility_filtering(self):
        """Verify agents only see pheromones they can read."""
        pass

    async def test_waggle_dance_recruitment(self):
        """Verify waggle dance creates proper recruitment pheromone."""
        pass

    async def test_sigil_chain_integrity(self):
        """Verify SIGIL chain tamper detection."""
        pass

    async def test_rate_limiting(self):
        """Verify rate limits are enforced."""
        pass

    async def test_spatial_query_accuracy(self):
        """Verify geo queries return pheromones within radius."""
        pass

    async def test_emergent_highway_formation(self):
        """Verify repeated reinforcement creates dominant trail."""
        pass

# Performance tests
class TestPerformance:
    async def test_deposit_throughput(self):
        """Target: >10K deposits/second."""
        pass

    async def test_read_latency_p99(self):
        """Target: p99 < 20ms for geo queries."""
        pass

    async def test_decay_cycle_speed(self):
        """Target: 1000 pheromones in < 1s."""
        pass
```

### Appendix F: Operational Runbooks

#### Runbook 1: Pheromone Storm (DDoS on pheromone system)

```
SYMPTOM: Deposit rate spikes, latency increases, Redis memory grows

1. Check rate limiter logs
   kubectl logs -n defoneos deployment/pheromone-api | grep "rate_limit"

2. Identify offending agent(s)
   redis-cli ZRANGE ph:deposit_rate 0 10 WITHSCORES REV

3. Temporarily block agent
   redis-cli SET "ph:blocked:{agent_id}" "1" EX 3600

4. Scale API replicas
   kubectl scale deployment/pheromone-api --replicas=6 -n defoneos

5. Alert on-call engineer
   pagerduty trigger "Pheromone storm detected"
```

#### Runbook 2: SIGIL Chain Break

```
SYMPTOM: Chain verification fails, anomalies detected

1. Run verification
   curl -X POST https://hive.defoneos.internal/sigil/verify

2. Identify broken entries
   Review anomaly list from verification response

3. Isolate affected entries
   redis-cli GET "sigil:{sigil_id}"

4. Notify Council
   council_alert "SIGIL integrity compromise detected"

5. Initiate forensic investigation
   Export full chain for legal review

6. Consider operational pause
   council_vote "pause_operations" --reason="sigil_compromise"
```

#### Runbook 3: Pheromone Cascade (Runaway Reinforcement)

```
SYMPTOM: Single pheromone strength approaches 1.0 with many reinforcements

1. Check reinforcement history
   neo4j> MATCH (p:Pheromone {pheromone_id: $id})<-[r:REINFORCED]-()
          RETURN count(r), collect(r.agent_id)

2. If >50 reinforcements in 1 hour → possible manipulation
   - Temporarily disable reinforcement for this pheromone
   - Alert security team

3. Implement reinforcement cooldown
   redis-cli SET "ph:cooldown:{pheromone_id}" "1" EX 3600
```

---

## DOCUMENT CONTROL

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2024-11-04 | DEFONEOS Architecture | Initial complete specification |

## CLASSIFICATION

**Classification:** DEFONEOS Core Architecture  
**Distribution:** Hive Leadership, Council Members, Legal Review  
**Retention:** Permanent  
**Review Cycle:** Quarterly

---

*"The swarm does not think. It feels. Each agent leaves a trace, and from a million traces, intelligence emerges. The SIGIL ensures that every trace is remembered — not just by the swarm, but by history."*

*— DEFONEOS Architecture Doctrine, Chapter 7: Emergent Intelligence*
