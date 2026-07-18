# Core Simulation Architecture: CSOAI Agent 47 Town

## Comprehensive Technical Specification for 46 Autonomous AI Agents + 1 Human Player

**Document:** Deliverable 1 - Core Simulation Architecture  
**Version:** 1.0  
**Date:** July 2026  
**Classification:** Dragon Mode Technical Architecture  
**Target:** Real-time browser-based 3D multi-agent simulation  

---

## Table of Contents

1. [Entity Component System (ECS)](#1-entity-component-system-ecs)
2. [SOV3 Split-Brain Decision Architecture](#2-sov3-split-brain-decision-architecture)
3. [Need-Based AI System](#3-need-based-ai-system)
4. [Schedule System](#4-schedule-system)
5. [Agent Economy](#5-agent-economy)
6. [LLM Integration Architecture](#6-llm-integration-architecture)
7. [Performance Architecture](#7-performance-architecture)
8. [Complete Architecture Diagram](#8-complete-architecture-diagram)

---

## 1. Entity Component System (ECS)

### 1.1 Why bitecs

CSOAI Agent 47 Town uses **bitecs** as its core ECS library. bitecs is the fastest JavaScript ECS implementation available, achieving **335,000 packed operations per second** through its Struct-of-Arrays (SoA) memory layout. This is critical for our simulation: with 46 agents each carrying 14+ components, every frame involves iterating thousands of data elements. bitecs ensures cache-friendly access patterns where Position.x values for all 46 agents sit contiguously in memory, allowing the CPU to process them in a single prefetch-friendly stride.

bitecs is also the ECS engine powering Phaser 4, one of the most widely deployed HTML5 game engines, which gives us proven stability and an active ecosystem. Its zero-allocation query system means we can run ECS queries every frame without triggering garbage collection pauses — essential for maintaining 60 FPS.

### 1.2 Component Definitions

Each component is defined as a typed array schema. bitecs maps these to contiguous memory buffers. Below are the complete component definitions for all 14 component types used in Agent 47 Town:

```typescript
import { defineComponent, Types } from 'bitecs';

// ──────────────────────────────────────────────
// 1. Position — spatial location in 3D world
// ──────────────────────────────────────────────
export const Position = defineComponent({
  x: Types.f32,
  y: Types.f32,
  z: Types.f32,
});

// ──────────────────────────────────────────────
// 2. Velocity — movement vector + speed cap
// ──────────────────────────────────────────────
export const Velocity = defineComponent({
  vx: Types.f32,
  vy: Types.f32,
  vz: Types.f32,
  speed: Types.f32,      // current scalar speed
  maxSpeed: Types.f32,   // agent-specific speed limit
});

// ──────────────────────────────────────────────
// 3. AgentIdentity — who this agent is
// ──────────────────────────────────────────────
export const AgentIdentity = defineComponent({
  agentId: Types.ui16,     // unique numeric ID (1-46)
  caste: Types.ui8,        // 0=worker, 1=specialist, 2=orchestrator, 3=memory
  modelTier: Types.ui8,    // 0=Qwen3, 1=DeepSeekV4, 2=KimiK2.6, 3=MiniMaxM3
});

// ──────────────────────────────────────────────
// 4. Needs — 8-need system (each 0-100, stored as uint8)
// ──────────────────────────────────────────────
export const Needs = defineComponent({
  hunger: Types.ui8,      // 0=starving, 100=fully satisfied
  energy: Types.ui8,      // 0=exhausted, 100=fully rested
  social: Types.ui8,      // 0=lonely, 100=socially fulfilled
  fun: Types.ui8,         // 0=bored, 100=entertained
  wealth: Types.ui8,      // 0=destitute, 100=rich
  comfort: Types.ui8,     // 0=miserable, 100=completely comfortable
  hygiene: Types.ui8,     // 0=filthy, 100=pristine
  bladder: Types.ui8,     // 0=emergency, 100=relieved
});

// ──────────────────────────────────────────────
// 5. Job — employment at a CSOAI hive building
// ──────────────────────────────────────────────
export const Job = defineComponent({
  hiveBuilding: Types.ui8,   // numeric index into hive registry (0-23)
  role: Types.ui8,           // role enum (0-30 mapped to MCP servers)
  salary: Types.f32,         // daily salary in USDC
  workHoursStart: Types.ui8, // hour of day (0-23)
  workHoursEnd: Types.ui8,   // hour of day (0-23)
  onDuty: Types.ui8,         // 0=off, 1=working, 2=commuting
});

// ──────────────────────────────────────────────
// 6. Memory — short-term buffer index + long-term ref count
// ──────────────────────────────────────────────
// Note: actual memory data lives in external storage (L1-L4 layers)
// These components are lightweight handles into the memory subsystem
export const Memory = defineComponent({
  l2BufferIndex: Types.ui16,   // index into working memory ring buffer
  l3FactCount: Types.ui16,     // number of semantic facts stored
  l4EpisodeCount: Types.ui16,  // number of episodic memories
  lastConsolidation: Types.f32, // timestamp of last sleep consolidation
});

// ──────────────────────────────────────────────
// 7. Relationships — serialized relationship data handle
// ──────────────────────────────────────────────
// Full relationship graph lives in external Map storage
// This component tracks the number of active relationships
export const Relationships = defineComponent({
  activeCount: Types.ui8,     // how many relationships this agent maintains
  lastSocialUpdate: Types.f32, // timestamp of last social interaction
});

// ──────────────────────────────────────────────
// 8. Wallet — x402 economic state
// ──────────────────────────────────────────────
export const Wallet = defineComponent({
  usdcBalance: Types.f32,        // current liquid balance
  lifetimeEarned: Types.f32,     // cumulative income
  lifetimeSpent: Types.f32,      // cumulative spending
  pendingTxCount: Types.ui8,     // transactions awaiting settlement
});

// ──────────────────────────────────────────────
// 9. Passport — digital identity + compliance
// ──────────────────────────────────────────────
export const Passport = defineComponent({
  complianceScore: Types.f32,    // 0.0 to 1.0 (affects voting weight)
  attestationCount: Types.ui8,   // number of active attestations
  passportStatus: Types.ui8,     // 0=valid, 1=expiring, 2=expired, 3=revoked
});

// ──────────────────────────────────────────────
// 10. Schedule — daily routine state machine
// ──────────────────────────────────────────────
export const Schedule = defineComponent({
  currentActivity: Types.ui8,    // enum: sleep, work, eat, commute, socialize, etc.
  nextActivity: Types.ui8,       // pre-planned next activity
  scheduleOverride: Types.ui8,   // 0=none, 1=need-critical, 2=emergency, 3=player
  dayOfWeek: Types.ui8,          // 0-6 (Mon-Sun)
  gameHour: Types.ui8,           // 0-23
  gameMinute: Types.ui8,         // 0-59
});

// ──────────────────────────────────────────────
// 11. PheromoneState — swarm signaling
// ──────────────────────────────────────────────
export const PheromoneState = defineComponent({
  emittingType: Types.ui8,    // 0-9 mapped to pheromone types
  intensity: Types.f32,       // 0.0 to 1.0
  radius: Types.f32,          // diffusion radius in meters
  emissionCooldown: Types.f32, // seconds until next emission allowed
});

// ──────────────────────────────────────────────
// 12. AnimationState — 3D character animation
// ──────────────────────────────────────────────
export const AnimationState = defineComponent({
  currentAnim: Types.ui8,     // enum: idle, walk, run, sit, work, talk, sleep, eat, etc.
  transitionTime: Types.f32,  // blend duration in seconds
  animProgress: Types.f32,    // 0.0 to 1.0 current animation playback
  facialExpression: Types.ui8, // happy, sad, angry, surprised, neutral
});

// ──────────────────────────────────────────────
// 13. SOV3Brain — cognitive pipeline state
// ──────────────────────────────────────────────
export const SOV3Brain = defineComponent({
  nearLineActive: Types.ui8,      // 0=idle, 1=processing, 2=cached
  coldLineQueueDepth: Types.ui8,  // number of pending cold-line requests
  offlineLinePending: Types.ui8,  // 0=none, 1=memory-consolidation, 2=reflection, 3=planning
  lastColdLineCall: Types.f32,    // timestamp of last cold-line invocation
  cacheHitRate: Types.f32,        // running average of prompt cache hits
});

// ──────────────────────────────────────────────
// 14. Navigation — pathfinding state
// ──────────────────────────────────────────────
export const Navigation = defineComponent({
  targetX: Types.f32,
  targetY: Types.f32,
  targetZ: Types.f32,
  pathNodeIndex: Types.ui16,    // current position in path array
  pathLength: Types.ui16,       // total nodes in current path
  navState: Types.ui8,          // 0=idle, 1=pathing, 2=arrived, 3=blocked
});
```

### 1.3 ECS World Setup

```typescript
import { createWorld, addEntity, addComponent } from 'bitecs';
import {
  Position, Velocity, AgentIdentity, Needs, Job, Memory,
  Relationships, Wallet, Passport, Schedule, PheromoneState,
  AnimationState, SOV3Brain, Navigation
} from './components';

// Create the simulation world
export const world = createWorld();

// Entity creation factory for new agents
export function createAgent(
  agentConfig: AgentConfig
): number {
  const eid = addEntity(world);

  // Add all 14 components to the entity
  addComponent(world, eid, Position);
  addComponent(world, eid, Velocity);
  addComponent(world, eid, AgentIdentity);
  addComponent(world, eid, Needs);
  addComponent(world, eid, Job);
  addComponent(world, eid, Memory);
  addComponent(world, eid, Relationships);
  addComponent(world, eid, Wallet);
  addComponent(world, eid, Passport);
  addComponent(world, eid, Schedule);
  addComponent(world, eid, PheromoneState);
  addComponent(world, eid, AnimationState);
  addComponent(world, eid, SOV3Brain);
  addComponent(world, eid, Navigation);

  // Initialize component values
  Position.x[eid] = agentConfig.startX;
  Position.y[eid] = agentConfig.startY;
  Position.z[eid] = agentConfig.startZ;

  AgentIdentity.agentId[eid] = agentConfig.agentId;
  AgentIdentity.caste[eid] = agentConfig.caste;
  AgentIdentity.modelTier[eid] = agentConfig.modelTier;

  Needs.hunger[eid] = 80;
  Needs.energy[eid] = 90;
  Needs.social[eid] = 70;
  Needs.fun[eid] = 60;
  Needs.wealth[eid] = 50;
  Needs.comfort[eid] = 75;
  Needs.hygiene[eid] = 85;
  Needs.bladder[eid] = 90;

  Job.hiveBuilding[eid] = agentConfig.hiveBuilding;
  Job.role[eid] = agentConfig.role;
  Job.salary[eid] = agentConfig.salary;
  Job.workHoursStart[eid] = agentConfig.workStart;
  Job.workHoursEnd[eid] = agentConfig.workEnd;

  Wallet.usdcBalance[eid] = agentConfig.startingBalance;

  Schedule.currentActivity[eid] = ActivityType.SLEEP;
  Schedule.dayOfWeek[eid] = 0;
  Schedule.gameHour[eid] = 6;
  Schedule.gameMinute[eid] = 0;

  Navigation.navState[eid] = NavState.IDLE;

  return eid;
}
```

### 1.4 System Registry — Execution Order Per Frame

Systems run in a strict pipeline order every simulation tick. Each system operates on a specific query of entities that have the required components:

```typescript
import { defineQuery, removeQuery } from 'bitecs';

// Query definitions — each system iterates matching entities
const needsQuery = defineQuery([Needs]);
const movementQuery = defineQuery([Position, Velocity, Navigation]);
const scheduleQuery = defineQuery([Schedule, Job, Needs]);
const socialQuery = defineQuery([Position, Relationships, AgentIdentity]);
const pheromoneQuery = defineQuery([Position, PheromoneState]);
const memoryQuery = defineQuery([Memory, SOV3Brain]);
const economyQuery = defineQuery([Wallet, Job]);
const governanceQuery = defineQuery([Passport, AgentIdentity]);
const animationQuery = defineQuery([AnimationState, Velocity, Navigation]);
const brainQuery = defineQuery([SOV3Brain, AgentIdentity]);
```

### 1.5 System Implementations

#### System 1: NeedsDecaySystem

Decreases all 8 needs every game minute based on agent activity and time multipliers. This is the most frequently run system — it operates at every tick.

```typescript
export class NeedsDecaySystem {
  // Decay rates: points lost per GAME HOUR of real time
  // Game time runs at 60x (1 real second = 1 game minute)
  private static readonly DECAY_RATES = {
    hunger: 16.7,   // empty in ~6 game hours
    energy: 8.3,    // empty in ~12 game hours (awake)
    social: 25.0,   // empty in ~4 game hours
    fun: 20.0,      // empty in ~5 game hours
    wealth: 0.0,    // special: decays only via spending
    comfort: 12.5,  // empty in ~8 game hours
    hygiene: 12.5,  // empty in ~8 game hours
    bladder: 33.3,  // empty in ~3 game hours
  };

  // Critical thresholds — below these, urgent action overrides schedule
  static readonly CRITICAL = {
    hunger: 15,
    energy: 10,
    social: 10,
    fun: 10,
    comfort: 10,
    hygiene: 15,
    bladder: 20,
  };

  // Modifiers based on current activity
  private static getActivityModifier(
    activity: number, need: string
  ): number {
    switch (activity) {
      case ActivityType.WORK:
        return need === 'energy' ? 1.3 : need === 'social' ? 1.2 : 1.0;
      case ActivityType.SLEEP:
        return need === 'energy' ? -4.0 : need === 'bladder' ? 0.5 : 0.1;
      case ActivityType.EAT:
        return need === 'hunger' ? -8.0 : need === 'bladder' ? 1.5 : 0.3;
      case ActivityType.SOCIALIZE:
        return need === 'social' ? -3.0 : need === 'energy' ? 1.1 : 0.8;
      default:
        return 1.0;
    }
  }

  update(world: IWorld, dtGameMinutes: number): void {
    const entities = needsQuery(world);

    for (const eid of entities) {
      const activity = Schedule.currentActivity[eid];

      // Apply decay to each need
      const decay = NeedsDecaySystem.DECAY_RATES;

      let newHunger = Needs.hunger[eid] - (decay.hunger * dtGameMinutes / 60)
        * NeedsDecaySystem.getActivityModifier(activity, 'hunger');
      Needs.hunger[eid] = Math.max(0, Math.min(100, newHunger));

      let newEnergy = Needs.energy[eid] - (decay.energy * dtGameMinutes / 60)
        * NeedsDecaySystem.getActivityModifier(activity, 'energy');
      Needs.energy[eid] = Math.max(0, Math.min(100, newEnergy));

      let newSocial = Needs.social[eid] - (decay.social * dtGameMinutes / 60)
        * NeedsDecaySystem.getActivityModifier(activity, 'social');
      Needs.social[eid] = Math.max(0, Math.min(100, newSocial));

      let newFun = Needs.fun[eid] - (decay.fun * dtGameMinutes / 60)
        * NeedsDecaySystem.getActivityModifier(activity, 'fun');
      Needs.fun[eid] = Math.max(0, Math.min(100, newFun));

      let newComfort = Needs.comfort[eid] - (decay.comfort * dtGameMinutes / 60)
        * NeedsDecaySystem.getActivityModifier(activity, 'comfort');
      Needs.comfort[eid] = Math.max(0, Math.min(100, newComfort));

      let newHygiene = Needs.hygiene[eid] - (decay.hygiene * dtGameMinutes / 60)
        * NeedsDecaySystem.getActivityModifier(activity, 'hygiene');
      Needs.hygiene[eid] = Math.max(0, Math.min(100, newHygiene));

      let newBladder = Needs.bladder[eid] - (decay.bladder * dtGameMinutes / 60)
        * NeedsDecaySystem.getActivityModifier(activity, 'bladder');
      Needs.bladder[eid] = Math.max(0, Math.min(100, newBladder));
    }
  }
}
```

#### System 2: NeedFulfillmentSystem

Scores all available advertisements (food sources, beds, toilets, social objects) against current needs and selects the highest-utility action. Runs every 5-15 game seconds per agent (staggered).

```typescript
interface Advertisement {
  actionType: string;           // "eat", "sleep", "bathe", "socialize", "use_toilet"
  needsFulfilled: Partial<Record<keyof typeof Needs, number>>;
  duration: number;             // game minutes to complete
  cost: number;                 // USDC cost (0 for free)
  targetLocation: { x: number; y: number; z: number };
  targetEntity: number;         // ECS entity ID of the object/agent
  priority: number;             // base priority weight
}

export class NeedFulfillmentSystem {
  // Need weights for utility scoring (higher = more urgent when low)
  private static readonly NEED_WEIGHTS: Record<string, number> = {
    hunger: 0.90,
    energy: 0.80,
    bladder: 0.85,
    hygiene: 0.60,
    social: 0.70,
    fun: 0.50,
    comfort: 0.40,
    wealth: 0.60,
  };

  // Cache: only recompute when needs change significantly
  private lastNeedsHash = new Map<number, number>();
  private cachedBestAction = new Map<number, Advertisement | null>();

  computeUtilityScore(eid: number, ad: Advertisement): number {
    let score = 0;
    const deficitFactor = 1 / 100; // normalize 0-100 scale

    for (const [needKey, restoreValue] of Object.entries(ad.needsFulfilled)) {
      const needLevel = this.getNeedValue(eid, needKey);
      const deficit = 100 - needLevel; // higher deficit = more urgency
      const weight = NeedFulfillmentSystem.NEED_WEIGHTS[needKey] || 0.5;

      // Exponential urgency — needs become much more urgent near zero
      const urgency = Math.pow(deficit / 100, 1.5);
      score += urgency * restoreValue * weight * ad.priority;
    }

    // Penalize distance (closer = better)
    const pos = { x: Position.x[eid], y: Position.y[eid], z: Position.z[eid] };
    const dist = Math.sqrt(
      Math.pow(pos.x - ad.targetLocation.x, 2) +
      Math.pow(pos.z - ad.targetLocation.z, 2)
    );
    score *= Math.max(0.1, 1 - dist / 200); // 200m = near-zero score

    // Penalize cost
    const balance = Wallet.usdcBalance[eid];
    if (ad.cost > balance) {
      score = 0; // cannot afford
    } else {
      score *= Math.max(0.5, 1 - ad.cost / Math.max(balance, 1));
    }

    return score;
  }

  private getNeedValue(eid: number, key: string): number {
    const needMap: Record<string, number> = {
      hunger: Needs.hunger[eid],
      energy: Needs.energy[eid],
      social: Needs.social[eid],
      fun: Needs.fun[eid],
      wealth: Needs.wealth[eid],
      comfort: Needs.comfort[eid],
      hygiene: Needs.hygiene[eid],
      bladder: Needs.bladder[eid],
    };
    return needMap[key] || 50;
  }

  update(world: IWorld, availableAds: Advertisement[]): void {
    const entities = needsQuery(world);

    for (const eid of entities) {
      // Check if any need is critical — if so, override schedule
      const criticalNeed = this.findCriticalNeed(eid);
      if (criticalNeed) {
        Schedule.scheduleOverride[eid] = ScheduleOverride.NEED_CRITICAL;
      }

      // Only re-evaluate ads every ~10 game seconds (staggered)
      if (eid % 10 !== world.time % 10) continue;

      let bestScore = -Infinity;
      let bestAd: Advertisement | null = null;

      for (const ad of availableAds) {
        const score = this.computeUtilityScore(eid, ad);
        if (score > bestScore) {
          bestScore = score;
          bestAd = ad;
        }
      }

      this.cachedBestAction.set(eid, bestAd);
    }
  }

  private findCriticalNeed(eid: number): string | null {
    const c = NeedsDecaySystem.CRITICAL;
    if (Needs.bladder[eid] < c.bladder) return 'bladder';
    if (Needs.energy[eid] < c.energy) return 'energy';
    if (Needs.hunger[eid] < c.hunger) return 'hunger';
    if (Needs.hygiene[eid] < c.hygiene) return 'hygiene';
    if (Needs.social[eid] < c.social) return 'social';
    return null;
  }
}
```

#### System 3: MovementSystem

Updates agent positions based on velocity and navigation targets. Handles path following and arrival detection.

```typescript
export class MovementSystem {
  update(world: IWorld, dtRealSeconds: number): void {
    const entities = movementQuery(world);
    const dtGameMinutes = dtRealSeconds; // 1 real sec = 1 game minute at 60x

    for (const eid of entities) {
      if (Navigation.navState[eid] === NavState.IDLE) continue;

      // Current position
      const cx = Position.x[eid];
      const cy = Position.y[eid];
      const cz = Position.z[eid];

      // Target position
      const tx = Navigation.targetX[eid];
      const ty = Navigation.targetY[eid];
      const tz = Navigation.targetZ[eid];

      // Direction vector
      const dx = tx - cx;
      const dz = tz - cz;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 1.0) {
        // Arrived at destination
        Navigation.navState[eid] = NavState.ARRIVED;
        Velocity.vx[eid] = 0;
        Velocity.vz[eid] = 0;
        Velocity.speed[eid] = 0;
        continue;
      }

      // Normalize and scale to agent's max speed
      const speed = Velocity.maxSpeed[eid] * (60 / 1000); // meters per game minute
      const ndx = dx / dist;
      const ndz = dz / dist;

      Velocity.vx[eid] = ndx * speed;
      Velocity.vz[eid] = ndz * speed;
      Velocity.speed[eid] = speed;

      // Update position
      Position.x[eid] += Velocity.vx[eid] * dtGameMinutes;
      Position.z[eid] += Velocity.vz[eid] * dtGameMinutes;
    }
  }
}
```

#### System 4: NavigationSystem

A* pathfinding to destinations. Computes paths on demand and caches them.

```typescript
export class NavigationSystem {
  private pathCache = new Map<number, Vector3[]>();
  private navmesh: NavmeshGrid;

  constructor(navmeshData: NavmeshData) {
    this.navmesh = new NavmeshGrid(navmeshData);
  }

  requestPath(eid: number, target: Vector3): void {
    const start = {
      x: Position.x[eid],
      y: Position.y[eid],
      z: Position.z[eid],
    };

    // A* search on navmesh grid
    const path = this.navmesh.findPath(start, target);
    if (path.length > 0) {
      this.pathCache.set(eid, path);
      Navigation.pathNodeIndex[eid] = 0;
      Navigation.pathLength[eid] = path.length;
      Navigation.targetX[eid] = path[0].x;
      Navigation.targetY[eid] = path[0].y;
      Navigation.targetZ[eid] = path[0].z;
      Navigation.navState[eid] = NavState.PATHING;
    } else {
      Navigation.navState[eid] = NavState.BLOCKED;
    }
  }

  update(world: IWorld): void {
    const entities = movementQuery(world);

    for (const eid of entities) {
      if (Navigation.navState[eid] !== NavState.PATHING) continue;

      // Check if we've reached current path node
      const cx = Position.x[eid];
      const cz = Position.z[eid];
      const tx = Navigation.targetX[eid];
      const tz = Navigation.targetZ[eid];
      const dist = Math.sqrt((cx - tx) ** 2 + (cz - tz) ** 2);

      if (dist < 1.5) {
        // Advance to next path node
        const idx = Navigation.pathNodeIndex[eid] + 1;
        if (idx >= Navigation.pathLength[eid]) {
          Navigation.navState[eid] = NavState.ARRIVED;
        } else {
          const path = this.pathCache.get(eid);
          if (path && path[idx]) {
            Navigation.pathNodeIndex[eid] = idx;
            Navigation.targetX[eid] = path[idx].x;
            Navigation.targetY[eid] = path[idx].y;
            Navigation.targetZ[eid] = path[idx].z;
          }
        }
      }
    }
  }
}
```

#### System 5: ScheduleSystem

Follows daily routines with priority-based override handling. Agents follow a structured day but can deviate based on critical needs, emergencies, and social invitations.

```typescript
export class ScheduleSystem {
  // Default schedule template for weekday workers
  private static readonly WEEKDAY_SCHEDULE: ScheduleBlock[] = [
    { hour: 6,  activity: ActivityType.WAKE_UP,    location: 'home' },
    { hour: 6,  minute: 15, activity: ActivityType.HYGIENE,   location: 'home' },
    { hour: 6,  minute: 30, activity: ActivityType.EAT,       location: 'home' },
    { hour: 7,  activity: ActivityType.COMMUTE,     location: 'hive' },
    { hour: 8,  activity: ActivityType.WORK,        location: 'hive' },
    { hour: 12, activity: ActivityType.EAT,        location: 'marketplace' },
    { hour: 13, activity: ActivityType.WORK,        location: 'hive' },
    { hour: 17, activity: ActivityType.COMMUTE,     location: 'home' },
    { hour: 18, activity: ActivityType.EAT,        location: 'home' },
    { hour: 19, activity: ActivityType.FREE_TIME,   location: 'any' },
    { hour: 22, activity: ActivityType.WIND_DOWN,   location: 'home' },
    { hour: 23, activity: ActivityType.SLEEP,       location: 'home' },
  ];

  // Activity durations in game minutes
  private static readonly ACTIVITY_DURATIONS: Record<number, number> = {
    [ActivityType.WAKE_UP]: 15,
    [ActivityType.HYGIENE]: 30,
    [ActivityType.EAT]: 30,
    [ActivityType.COMMUTE]: 45,
    [ActivityType.WORK]: 240,
    [ActivityType.FREE_TIME]: 180,
    [ActivityType.WIND_DOWN]: 45,
    [ActivityType.SLEEP]: 420,
  };

  update(world: IWorld, gameTime: GameTime): void {
    const entities = scheduleQuery(world);

    for (const eid of entities) {
      Schedule.gameHour[eid] = gameTime.hour;
      Schedule.gameMinute[eid] = gameTime.minute;

      // Priority 1: Critical needs override everything
      const override = Schedule.scheduleOverride[eid];
      if (override === ScheduleOverride.NEED_CRITICAL) {
        this.handleCriticalNeed(eid);
        continue;
      }

      // Priority 2: Emergency/Player override
      if (override === ScheduleOverride.EMERGENCY ||
          override === ScheduleOverride.PLAYER) {
        continue; // handled externally
      }

      // Priority 3: Follow daily schedule
      const scheduled = this.getScheduledActivity(eid, gameTime);
      if (scheduled !== null &&
          Schedule.currentActivity[eid] !== scheduled) {
        Schedule.currentActivity[eid] = scheduled;
        this.assignLocationForActivity(eid, scheduled);
      }
    }
  }

  private getScheduledActivity(eid: number, gt: GameTime): number | null {
    // Weekend schedule (days 5,6 = Sat,Sun) — more free time
    const isWeekend = gt.dayOfWeek >= 5;

    if (isWeekend) {
      if (gt.hour < 9) return ActivityType.SLEEP;
      if (gt.hour < 10) return ActivityType.HYGIENE;
      if (gt.hour < 11) return ActivityType.EAT;
      if (gt.hour < 13) return ActivityType.FREE_TIME;
      if (gt.hour < 14) return ActivityType.EAT;
      if (gt.hour < 18) return ActivityType.FREE_TIME;
      if (gt.hour < 19) return ActivityType.EAT;
      if (gt.hour < 23) return ActivityType.SOCIALIZE;
      return ActivityType.SLEEP;
    }

    // Weekday — lookup in schedule table
    for (const block of ScheduleSystem.WEEKDAY_SCHEDULE) {
      if (gt.hour === block.hour &&
          (block.minute === undefined || gt.minute >= block.minute)) {
        // Check if we haven't advanced past this block
        const nextBlock = ScheduleSystem.WEEKDAY_SCHEDULE[
          ScheduleSystem.WEEKDAY_SCHEDULE.indexOf(block) + 1
        ];
        if (!nextBlock || gt.hour < nextBlock.hour ||
            (gt.hour === nextBlock.hour && gt.minute < (nextBlock.minute || 0))) {
          return block.activity;
        }
      }
    }

    return null; // no change needed
  }

  private handleCriticalNeed(eid: number): void {
    // Find the most critical need and redirect agent to fulfill it
    const criticalNeed = this.findMostCriticalNeed(eid);
    const targetLocation = this.findFulfillmentLocation(criticalNeed, eid);

    if (targetLocation) {
      Navigation.navState[eid] = NavState.IDLE; // force re-path
      // NavigationSystem will pick up the new target
    }
  }

  private findMostCriticalNeed(eid: number): string {
    const scores = [
      { key: 'bladder', deficit: 100 - Needs.bladder[eid], weight: 2.0 },
      { key: 'energy', deficit: 100 - Needs.energy[eid], weight: 1.8 },
      { key: 'hunger', deficit: 100 - Needs.hunger[eid], weight: 1.5 },
      { key: 'hygiene', deficit: 100 - Needs.hygiene[eid], weight: 1.0 },
      { key: 'social', deficit: 100 - Needs.social[eid], weight: 0.8 },
    ];
    scores.sort((a, b) => b.deficit * b.weight - a.deficit * a.weight);
    return scores[0].key;
  }

  private assignLocationForActivity(eid: number, activity: number): void {
    // Maps activity to target location for navigation
    const hiveIdx = Job.hiveBuilding[eid];
    const pos = AgentSpawnRegistry.getHomePosition(eid);
    const hivePos = HiveRegistry.getHivePosition(hiveIdx);

    switch (activity) {
      case ActivityType.WORK:
        Navigation.targetX[eid] = hivePos.x;
        Navigation.targetY[eid] = hivePos.y;
        Navigation.targetZ[eid] = hivePos.z;
        break;
      case ActivityType.SLEEP:
      case ActivityType.HYGIENE:
      case ActivityType.WIND_DOWN:
      case ActivityType.WAKE_UP:
        Navigation.targetX[eid] = pos.x;
        Navigation.targetY[eid] = pos.y;
        Navigation.targetZ[eid] = pos.z;
        break;
      case ActivityType.COMMUTE:
        // handled by activity handler based on current time
        break;
      case ActivityType.EAT:
        // Choose between home, marketplace, or restaurant based on wealth
        if (Wallet.usdcBalance[eid] > 20) {
          const marketPos = TownRegistry.getMarketplacePosition();
          Navigation.targetX[eid] = marketPos.x;
          Navigation.targetZ[eid] = marketPos.z;
        } else {
          Navigation.targetX[eid] = pos.x;
          Navigation.targetZ[eid] = pos.z;
        }
        break;
    }

    if (Navigation.navState[eid] !== NavState.PATHING) {
      Navigation.navState[eid] = NavState.IDLE; // trigger re-path
    }
  }
}
```

#### System 6: SocialSystem

Handles conversations, relationship updates, and gossip propagation between agents within proximity.

```typescript
export class SocialSystem {
  // Proximity thresholds
  private static readonly GREETING_RANGE = 15;   // meters — wave hello
  private static readonly CONVERSATION_RANGE = 5; // meters — can talk
  private static readonly GOSSIP_CHANCE = 0.15;   // 15% chance per conversation to gossip

  // Relationship bounds
  private static readonly MIN_RELATIONSHIP = -100;
  private static readonly MAX_RELATIONSHIP = 100;

  update(world: IWorld, spatialGrid: SpatialGrid): void {
    const entities = socialQuery(world);

    for (const eid of entities) {
      // Find nearby agents
      const nearby = spatialGrid.queryRadius(
        Position.x[eid], Position.z[eid], SocialSystem.CONVERSATION_RANGE
      );

      for (const otherEid of nearby) {
        if (otherEid === eid) continue;

        // Check if already interacting this tick
        if (this.isCurrentlyInteracting(eid, otherEid)) continue;

        // Update relationship decay (relationships fade if not maintained)
        this.decayRelationship(eid, otherEid);

        // Proximity-based social triggers
        const dist = this.distanceBetween(eid, otherEid);

        if (dist < SocialSystem.CONVERSATION_RANGE) {
          // Both agents have social need — start conversation
          if (Needs.social[eid] < 60 && Needs.social[otherEid] < 60) {
            this.startConversation(eid, otherEid);
          }
        } else if (dist < SocialSystem.GREETING_RANGE) {
          // In greeting range — wave if relationship is positive
          this.maybeGreet(eid, otherEid);
        }
      }
    }
  }

  private startConversation(eid: number, otherEid: number): void {
    // Fulfill social need for both agents
    const socialBoost = 15;
    Needs.social[eid] = Math.min(100, Needs.social[eid] + socialBoost);
    Needs.social[otherEid] = Math.min(100, Needs.social[otherEid] + socialBoost);

    // Strengthen relationship
    this.modifyRelationship(eid, otherEid, 'friendship', 3);

    // Chance to gossip
    if (Math.random() < SocialSystem.GOSSIP_CHANCE) {
      this.propagateGossip(eid, otherEid);
    }

    // Set animation states
    AnimationState.currentAnim[eid] = AnimType.TALK;
    AnimationState.currentAnim[otherEid] = AnimType.TALK;
    AnimationState.facialExpression[eid] = ExpressionType.HAPPY;
    AnimationState.facialExpression[otherEid] = ExpressionType.HAPPY;

    // Emit social pheromone
    PheromoneState.emittingType[eid] = PheromoneType.POLLINATE_YELLOW;
    PheromoneState.intensity[eid] = 0.3;
  }

  private modifyRelationship(
    fromEid: number, toEid: number,
    dimension: string, delta: number
  ): void {
    const relKey = `${fromEid}-${toEid}`;
    const rel = RelationshipStore.getOrCreate(relKey);
    rel[dimension] = Math.max(
      SocialSystem.MIN_RELATIONSHIP,
      Math.min(SocialSystem.MAX_RELATIONSHIP, rel[dimension] + delta)
    );
    rel.lastInteraction = Date.now();
    rel.interactions++;
    RelationshipStore.set(relKey, rel);
  }

  private propagateGossip(fromEid: number, toEid: number): void {
    const gossipPool = GossipStore.getForAgent(fromEid);
    if (gossipPool.length === 0) return;

    const gossip = gossipPool[Math.floor(Math.random() * gossipPool.length)];

    // Transfer gossip to listener
    GossipStore.addForAgent(toEid, {
      ...gossip,
      spreadCount: gossip.spreadCount + 1,
      credibility: gossip.credibility * 0.9, // degrade with each retell
      receivedFrom: AgentIdentity.agentId[fromEid],
    });

    // Update listener's opinion of gossip subject
    if (gossip.credibility > 0.3) {
      this.modifyRelationship(toEid, gossip.subjectEid, 'trust',
        gossip.isPositive ? 5 : -10);
    }
  }

  private distanceBetween(a: number, b: number): number {
    const dx = Position.x[a] - Position.x[b];
    const dz = Position.z[a] - Position.z[b];
    return Math.sqrt(dx * dx + dz * dz);
  }

  private isCurrentlyInteracting(eid: number, other: number): boolean {
    // Simplified — in production, track active conversation state
    return AnimationState.currentAnim[eid] === AnimType.TALK;
  }

  private maybeGreet(eid: number, otherEid: number): void {
    const rel = RelationshipStore.get(`${eid}-${otherEid}`);
    if (rel && rel.friendship > 20) {
      AnimationState.currentAnim[eid] = AnimType.WAVE;
    }
  }

  private decayRelationship(eid: number, otherEid: number): void {
    // Relationships slowly decay if not maintained
    const rel = RelationshipStore.get(`${eid}-${otherEid}`);
    if (rel && Date.now() - rel.lastInteraction > 86400000) { // 24h real time
      rel.friendship = Math.max(-100, rel.friendship - 0.5);
      rel.romance = Math.max(0, rel.romance - 0.3);
    }
  }
}
```

#### System 7: PheromoneSystem

Emits, diffuses, and evaporates pheromone particles across the town. Uses a spatial hash for efficient queries.

```typescript
export class PheromoneSystem {
  private particles: PheromoneParticle[] = [];
  private spatialHash: Map<string, PheromoneParticle[]> = new Map();
  private static readonly CELL_SIZE = 50; // meters per hash cell
  private static readonly MAX_PARTICLES = 10000;

  // Pheromone configuration
  private static readonly PHEROMONE_CONFIG: Record<number, PheromoneConfig> = {
    [PheromoneType.ALARM_RED]:     { ttl: 6 * 3600,  diffusion: 50,  color: '#FF0000' },
    [PheromoneType.TRAIL_GREEN]:   { ttl: 14 * 86400, diffusion: 30,  color: '#00FF00' },
    [PheromoneType.QUEEN_GOLD]:    { ttl: Infinity,  diffusion: 100, color: '#FFD700' },
    [PheromoneType.TERRITORY_MARK]:{ ttl: 7 * 86400,  diffusion: 40,  color: '#800080' },
    [PheromoneType.CLEANUP_BLACK]: { ttl: 12 * 3600,  diffusion: 20,  color: '#1A1A1A' },
    [PheromoneType.CASTE_TRANSFORM]:{ ttl: 3 * 86400, diffusion: 35,  color: '#0066FF' },
    [PheromoneType.GATE_GUARD]:    { ttl: 4 * 3600,   diffusion: 25,  color: '#FF8C00' },
    [PheromoneType.SWARM_DEPLOY]:  { ttl: 1 * 86400,  diffusion: 60,  color: '#00FFFF' },
    [PheromoneType.DOMAIN_SPLIT]:  { ttl: 3 * 86400,  diffusion: 45,  color: '#FF00FF' },
    [PheromoneType.POLLINATE_YELLOW]:{ ttl: 5 * 86400, diffusion: 25,  color: '#FFFF00' },
  };

  emit(
    agentId: number, pheromoneType: number,
    intensity: number, position: Vector3
  ): void {
    if (this.particles.length >= PheromoneSystem.MAX_PARTICLES) {
      this.evictOldest();
    }

    const config = PheromoneSystem.PHEROMONE_CONFIG[pheromoneType];
    if (!config) return;

    const particle: PheromoneParticle = {
      id: `p-${Date.now()}-${Math.random()}`,
      agentId,
      type: pheromoneType,
      intensity,
      position: { ...position },
      color: config.color,
      emittedAt: Date.now(),
      expiresAt: config.ttl === Infinity
        ? Infinity
        : Date.now() + config.ttl * 1000,
      diffusionRadius: config.diffusion * intensity,
    };

    this.particles.push(particle);
    this.addToSpatialHash(particle);

    // Cooldown before agent can emit again
    PheromoneState.emissionCooldown[agentId] = 5.0; // 5 real seconds
  }

  update(world: IWorld, dtRealSeconds: number): void {
    const now = Date.now();

    // 1. Evaporate expired particles
    this.particles = this.particles.filter(p => {
      const alive = p.expiresAt === Infinity || p.expiresAt > now;
      if (!alive) this.removeFromSpatialHash(p);
      return alive;
    });

    // 2. Process agent emissions
    const entities = pheromoneQuery(world);
    for (const eid of entities) {
      const cooldown = PheromoneState.emissionCooldown[eid];
      if (cooldown > 0) {
        PheromoneState.emissionCooldown[eid] = cooldown - dtRealSeconds;
        continue;
      }

      const type = PheromoneState.emittingType[eid];
      const intensity = PheromoneState.intensity[eid];
      if (intensity > 0) {
        this.emit(eid, type, intensity, {
          x: Position.x[eid],
          y: Position.y[eid],
          z: Position.z[eid],
        });
        PheromoneState.intensity[eid] = 0; // reset after emission
      }
    }

    // 3. Update spatial hash (rebuild every frame for moving agents)
    this.rebuildSpatialHash();
  }

  queryAtPosition(pos: Vector3, radius: number): PheromoneReading[] {
    const cellKey = this.getCellKey(pos.x, pos.z);
    const results: PheromoneReading[] = [];

    // Check neighboring cells
    const cellRadius = Math.ceil(radius / PheromoneSystem.CELL_SIZE);
    for (let cx = -cellRadius; cx <= cellRadius; cx++) {
      for (let cz = -cellRadius; cz <= cellRadius; cz++) {
        const key = `${Math.floor(pos.x / PheromoneSystem.CELL_SIZE) + cx},${Math.floor(pos.z / PheromoneSystem.CELL_SIZE) + cz}`;
        const cell = this.spatialHash.get(key);
        if (!cell) continue;

        for (const p of cell) {
          const dist = Math.sqrt(
            (pos.x - p.position.x) ** 2 +
            (pos.z - p.position.z) ** 2
          );
          if (dist < Math.min(radius, p.diffusionRadius)) {
            const detectedIntensity = p.intensity *
              (1 - (dist / p.diffusionRadius) ** 2);
            results.push({
              ...p,
              detectedIntensity,
              distance: dist,
            });
          }
        }
      }
    }

    return results.sort((a, b) => b.detectedIntensity - a.detectedIntensity);
  }

  private getCellKey(x: number, z: number): string {
    return `${Math.floor(x / PheromoneSystem.CELL_SIZE)},${Math.floor(z / PheromoneSystem.CELL_SIZE)}`;
  }

  private addToSpatialHash(p: PheromoneParticle): void {
    const key = this.getCellKey(p.position.x, p.position.z);
    if (!this.spatialHash.has(key)) this.spatialHash.set(key, []);
    this.spatialHash.get(key)!.push(p);
  }

  private removeFromSpatialHash(p: PheromoneParticle): void {
    const key = this.getCellKey(p.position.x, p.position.z);
    const cell = this.spatialHash.get(key);
    if (cell) {
      const idx = cell.indexOf(p);
      if (idx >= 0) cell.splice(idx, 1);
    }
  }

  private rebuildSpatialHash(): void {
    this.spatialHash.clear();
    for (const p of this.particles) {
      this.addToSpatialHash(p);
    }
  }

  private evictOldest(): void {
    this.particles.sort((a, b) => a.emittedAt - b.emittedAt);
    const removed = this.particles.splice(0, 100);
    for (const p of removed) this.removeFromSpatialHash(p);
  }
}
```

#### System 8: MemoryConsolidationSystem

Runs during agent sleep (Offline Line). Compresses short-term memories into long-term episodic summaries and semantic facts.

```typescript
export class MemoryConsolidationSystem {
  private static readonly REFLECTION_IMPORTANCE_THRESHOLD = 150;
  private static readonly WORKING_MEMORY_CAPACITY = 100;

  async runConsolidation(eid: number, sessionLogs: SessionLog[]): Promise<void> {
    const agentId = AgentIdentity.agentId[eid];
    const modelTier = AgentIdentity.modelTier[eid];

    // Step 1: Importance scoring — rank all experiences
    const scored = sessionLogs.map(log => ({
      ...log,
      importance: this.scoreImportance(log),
    }));

    // Step 2: Extract semantic facts (L3)
    const facts = this.extractFacts(scored);
    for (const fact of facts) {
      await SemanticMemoryStore.store(agentId, {
        content: fact.statement,
        embedding: await EmbeddingService.embed(fact.statement),
        confidence: fact.confidence,
        sourceLogIds: fact.sourceIds,
      });
    }
    Memory.l3FactCount[eid] += facts.length;

    // Step 3: Generate episodic summaries for high-importance events (L4)
    const highImportance = scored.filter(s => s.importance > 6);
    for (const event of highImportance) {
      const summary = await this.summarizeEvent(event, modelTier);
      await EpisodicMemoryStore.store(agentId, {
        timestamp: event.timestamp,
        description: summary,
        importance: event.importance,
        embedding: await EmbeddingService.embed(summary),
        location: event.location,
        entities: event.entities,
      });
    }
    Memory.l4EpisodeCount[eid] += highImportance.length;

    // Step 4: Reflection generation (when accumulated importance exceeds threshold)
    const totalImportance = scored.reduce((s, e) => s + e.importance, 0);
    if (totalImportance > MemoryConsolidationSystem.REFLECTION_IMPORTANCE_THRESHOLD) {
      const reflections = await this.generateReflections(scored, modelTier);
      for (const reflection of reflections) {
        await EpisodicMemoryStore.store(agentId, {
          timestamp: Date.now(),
          description: reflection.text,
          importance: reflection.importance,
          type: 'reflection',
          parentIds: reflection.sourceIds,
          embedding: await EmbeddingService.embed(reflection.text),
        });
      }
    }

    // Step 5: Clear working memory buffer (L2)
    WorkingMemoryStore.clearForAgent(agentId);
    Memory.l2BufferIndex[eid] = 0;
    Memory.lastConsolidation[eid] = Date.now();

    // Step 6: Update offline line state
    SOV3Brain.offlineLinePending[eid] = OfflineLineTask.NONE;
  }

  private scoreImportance(log: SessionLog): number {
    // Heuristic importance scoring (0-10)
    let score = 3; // baseline
    if (log.type === 'conversation') score += 2;
    if (log.entities.includes('player')) score += 3; // player interactions are important
    if (log.emotionalIntensity > 0.5) score += 2;
    if (log.type === 'economic_transaction' && log.amount > 10) score += 2;
    if (log.type === 'compliance_event') score += 3;
    return Math.min(10, score);
  }

  private extractFacts(scored: ScoredLog[]): SemanticFact[] {
    const facts: SemanticFact[] = [];
    // Simple pattern extraction — in production, use NER + LLM
    const entityMentions = new Map<string, number>();
    for (const log of scored) {
      for (const entity of log.entities) {
        entityMentions.set(entity, (entityMentions.get(entity) || 0) + 1);
      }
    }
    for (const [entity, count] of entityMentions) {
      if (count >= 2) {
        facts.push({
          statement: `Interacted with ${entity} ${count} times`,
          confidence: Math.min(1.0, count / 5),
          sourceIds: scored.filter(s => s.entities.includes(entity)).map(s => s.id),
        });
      }
    }
    return facts;
  }

  private async summarizeEvent(
    event: ScoredLog, modelTier: number
  ): Promise<string> {
    // Use the appropriate model tier for summarization
    const model = ModelRouter.selectForTask('summarization', modelTier);
    return await model.generate({
      prompt: `Summarize this event in 1-2 sentences: ${event.description}`,
      maxTokens: 80,
    });
  }

  private async generateReflections(
    scored: ScoredLog[], modelTier: number
  ): Promise<Reflection[]> {
    const model = ModelRouter.selectForTask('reflection', modelTier);
    // MiniMax M3 for memory agents — 1M context for deep processing
    const memories = scored.map(s => s.description).join('\n');
    const prompt = `Based on these experiences, generate 3 high-level insights:\n${memories}`;
    const response = await model.generate({ prompt, maxTokens: 300 });
    return this.parseReflections(response);
  }

  private parseReflections(raw: string): Reflection[] {
    // Parse numbered reflections from LLM output
    return raw.split(/\d+\./).filter(r => r.trim().length > 0).map(r => ({
      text: r.trim(),
      importance: 7, // reflections are inherently important
      sourceIds: [],
    }));
  }
}
```

#### System 9: EconomySystem

Processes salaries, transactions, tax collection, and wealth effects on agent behavior.

```typescript
export class EconomySystem {
  private static readonly TAX_RATE = 0.10;       // 10% income tax
  private static readonly SALES_TAX_RATE = 0.05;  // 5% sales tax
  private static readonly COMPLIANCE_FEE_RATE = 0.01; // 1% on MCP calls

  // Process daily salary payments (at 00:00 game time)
  processSalaries(world: IWorld, gameTime: GameTime): void {
    if (gameTime.hour !== 0 || gameTime.minute !== 0) return;

    const entities = economyQuery(world);
    let treasuryRevenue = 0;

    for (const eid of entities) {
      const salary = Job.salary[eid];
      const tax = salary * EconomySystem.TAX_RATE;
      const netPay = salary - tax;

      Wallet.usdcBalance[eid] += netPay;
      Wallet.lifetimeEarned[eid] += netPay;
      treasuryRevenue += tax;

      // Emit income pheromone
      PheromoneState.emittingType[eid] = PheromoneType.POLLINATE_YELLOW;
      PheromoneState.intensity[eid] = 0.2;
    }

    // Deposit to town treasury
    TownTreasury.deposit(treasuryRevenue, 'income_tax');
  }

  // Process a purchase transaction
  processTransaction(
    buyerEid: number, sellerEid: number,
    amount: number, description: string
  ): TransactionResult {
    const salesTax = amount * EconomySystem.SALES_TAX_RATE;
    const total = amount + salesTax;

    if (Wallet.usdcBalance[buyerEid] < total) {
      return { success: false, error: 'INSUFFICIENT_FUNDS' };
    }

    // Debit buyer
    Wallet.usdcBalance[buyerEid] -= total;
    Wallet.lifetimeSpent[buyerEid] += total;

    // Credit seller (net of their tax)
    const sellerTax = amount * EconomySystem.TAX_RATE;
    Wallet.usdcBalance[sellerEid] += amount - sellerTax;
    Wallet.lifetimeEarned[sellerEid] += amount - sellerTax;

    // Tax to treasury
    TownTreasury.deposit(salesTax + sellerTax, 'transaction_tax');

    // Log transaction
    TransactionLog.store({
      buyer: AgentIdentity.agentId[buyerEid],
      seller: AgentIdentity.agentId[sellerEid],
      amount,
      tax: salesTax + sellerTax,
      description,
      timestamp: Date.now(),
      txHash: this.generateTxHash(),
    });

    return { success: true, txHash: this.generateTxHash() };
  }

  // Process MCP tool call billing
  processMCPBilling(
    callerEid: number, toolPrice: number,
    toolName: string
  ): boolean {
    const complianceFee = toolPrice * EconomySystem.COMPLIANCE_FEE_RATE;
    const total = toolPrice + complianceFee;

    if (Wallet.usdcBalance[callerEid] < total) return false;

    Wallet.usdcBalance[callerEid] -= total;
    Wallet.pendingTxCount[callerEid]++;

    // Revenue to tool provider hive
    TownTreasury.deposit(toolPrice, `mcp_${toolName}`);
    TownTreasury.deposit(complianceFee, 'compliance_fee');

    return true;
  }

  private generateTxHash(): string {
    return '0x' + Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }
}
```

#### System 10: GovernanceSystem

BFT voting, proposal evaluation, and emergency override handling.

```typescript
export class GovernanceSystem {
  private activeProposals: Map<string, GovernanceProposal> = new Map();
  private static readonly QUORUM_THRESHOLD = 2 / 3;
  private static readonly PROPOSAL_TIMEOUT_MS = 48 * 3600 * 1000; // 48h

  submitProposal(proposal: GovernanceProposal): string {
    const id = `prop-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
    proposal.id = id;
    proposal.status = 'DELIBERATING';
    proposal.createdAt = Date.now();
    proposal.votes = new Map();
    this.activeProposals.set(id, proposal);

    // Broadcast as governance pheromone
    for (const eid of governanceQuery(world)) {
      PheromoneState.emittingType[eid] = PheromoneType.CASTE_TRANSFORM;
      PheromoneState.intensity[eid] = 0.5;
    }

    return id;
  }

  castVote(
    voterEid: number, proposalId: string, vote: VoteType, justification?: string
  ): VoteResult {
    const proposal = this.activeProposals.get(proposalId);
    if (!proposal) return { accepted: false, error: 'PROPOSAL_NOT_FOUND' };

    // Check voter eligibility based on compliance score
    const compliance = Passport.complianceScore[voterEid];
    if (compliance < 0.5) {
      return { accepted: false, error: 'INSUFFICIENT_COMPLIANCE' };
    }

    // Calculate voting weight
    const weight = this.calculateVotingWeight(compliance);

    const voteRecord: VoteRecord = {
      voter: AgentIdentity.agentId[voterEid],
      vote,
      weight,
      justification,
      timestamp: Date.now(),
      sigil: this.signVote(voterEid, proposalId, vote),
    };

    proposal.votes.set(voterEid, voteRecord);

    // Check if quorum reached
    this.evaluateProposal(proposal);

    return { accepted: true, weight };
  }

  private evaluateProposal(proposal: GovernanceProposal): void {
    const votes = Array.from(proposal.votes.values());
    const totalWeight = votes.reduce((s, v) => s + v.weight, 0);
    const yesWeight = votes
      .filter(v => v.vote === 'YES')
      .reduce((s, v) => s + v.weight, 0);

    const totalVotingPower = this.getTotalVotingPower();

    // Check for passage (>2/3 of total voting power)
    if (yesWeight / totalVotingPower > GovernanceSystem.QUORUM_THRESHOLD) {
      proposal.status = 'PASSED';
      this.enactProposal(proposal);
    }

    // Check for failure (>1/3 voted NO)
    const noWeight = votes
      .filter(v => v.vote === 'NO')
      .reduce((s, v) => s + v.weight, 0);
    if (noWeight / totalVotingPower > 1 / 3) {
      proposal.status = 'REJECTED';
    }

    // Check timeout
    if (Date.now() - proposal.createdAt > GovernanceSystem.PROPOSAL_TIMEOUT_MS) {
      proposal.status = 'EXPIRED';
    }
  }

  private calculateVotingWeight(compliance: number): number {
    if (compliance >= 0.90) return 1.5;
    if (compliance >= 0.70) return 1.0;
    if (compliance >= 0.50) return 0.5;
    if (compliance >= 0.30) return 0.1;
    return 0.0;
  }

  private getTotalVotingPower(): number {
    let total = 0;
    const entities = governanceQuery(world);
    for (const eid of entities) {
      total += this.calculateVotingWeight(Passport.complianceScore[eid]);
    }
    return total;
  }

  private enactProposal(proposal: GovernanceProposal): void {
    // Record in town law registry
    TownLawRegistry.store({
      proposalId: proposal.id,
      description: proposal.description,
      enactedAt: Date.now(),
      votes: Array.from(proposal.votes.values()),
      sigil: this.generateCollectiveSigil(proposal),
    });

    // Emit enactment pheromone
    for (const eid of governanceQuery(world)) {
      PheromoneState.emittingType[eid] = PheromoneType.QUEEN_GOLD;
      PheromoneState.intensity[eid] = 0.8;
    }
  }

  private signVote(eid: number, proposalId: string, vote: VoteType): string {
    // Ed25519 sigil signature
    return Ed25519Sigil.sign(
      PassportStore.getPrivateKey(eid),
      `${proposalId}:${vote}:${Date.now()}`
    );
  }

  private generateCollectiveSigil(proposal: GovernanceProposal): string {
    // Multi-sig aggregation of all YES votes
    const yesVotes = Array.from(proposal.votes.values())
      .filter(v => v.vote === 'YES');
    return Ed25519Sigil.aggregateSigs(yesVotes.map(v => v.sigil));
  }

  // Emergency override — SOV3 or Agent 47
  triggerEmergencyOverride(authority: 'sov3' | 'agent47'): void {
    for (const proposal of this.activeProposals.values()) {
      if (proposal.status === 'DELIBERATING') {
        proposal.status = authority === 'agent47' ? 'VETOED' : 'EMERGENCY_OVERRIDE';
      }
    }
  }
}
```

#### System 11: AnimationSystem

Updates 3D animation states based on agent activities and transitions between them.

```typescript
export class AnimationSystem {
  // Animation state machine transitions
  private static readonly VALID_TRANSITIONS: Record<number, number[]> = {
    [AnimType.IDLE]:     [AnimType.WALK, AnimType.TALK, AnimType.SIT, AnimType.SLEEP, AnimType.WORK, AnimType.EAT],
    [AnimType.WALK]:     [AnimType.IDLE, AnimType.RUN],
    [AnimType.RUN]:      [AnimType.WALK, AnimType.IDLE],
    [AnimType.TALK]:     [AnimType.IDLE, AnimType.WALK],
    [AnimType.SIT]:      [AnimType.IDLE],
    [AnimType.SLEEP]:    [AnimType.IDLE, AnimType.WAKE_UP],
    [AnimType.WORK]:     [AnimType.IDLE, AnimType.TALK],
    [AnimType.EAT]:      [AnimType.IDLE],
    [AnimType.WAVE]:     [AnimType.IDLE, AnimType.TALK],
  };

  update(world: IWorld, dt: number): void {
    const entities = animationQuery(world);

    for (const eid of entities) {
      const currentAnim = AnimationState.currentAnim[eid];
      const targetAnim = this.determineTargetAnimation(eid);

      // Check if transition is needed and valid
      if (currentAnim !== targetAnim) {
        const validTransitions = AnimationSystem.VALID_TRANSITIONS[currentAnim] || [];
        if (validTransitions.includes(targetAnim)) {
          this.transitionAnimation(eid, targetAnim, dt);
        }
      }

      // Update animation playback
      AnimationState.animProgress[eid] += dt;

      // Update facial expression based on needs
      this.updateFacialExpression(eid);
    }
  }

  private determineTargetAnimation(eid: number): number {
    const navState = Navigation.navState[eid];
    const activity = Schedule.currentActivity[eid];
    const speed = Velocity.speed[eid];

    // Navigation state takes priority
    if (navState === NavState.PATHING) {
      if (speed > Velocity.maxSpeed[eid] * 0.7) return AnimType.RUN;
      return AnimType.WALK;
    }

    // Activity-based animation
    switch (activity) {
      case ActivityType.WORK: return AnimType.WORK;
      case ActivityType.SLEEP: return AnimType.SLEEP;
      case ActivityType.EAT: return AnimType.EAT;
      case ActivityType.SOCIALIZE: return AnimType.TALK;
      case ActivityType.HYGIENE: return AnimType.SIT; // simplified
      default:
        return speed > 0.1 ? AnimType.WALK : AnimType.IDLE;
    }
  }

  private transitionAnimation(eid: number, newAnim: number, dt: number): void {
    const blendTime = 0.3; // 300ms blend
    AnimationState.transitionTime[eid] = blendTime;
    AnimationState.currentAnim[eid] = newAnim;
    AnimationState.animProgress[eid] = 0;
  }

  private updateFacialExpression(eid: number): void {
    // Map dominant need state to facial expression
    const needs = {
      hunger: Needs.hunger[eid],
      energy: Needs.energy[eid],
      social: Needs.social[eid],
    };

    if (needs.hunger < 20) {
      AnimationState.facialExpression[eid] = ExpressionType.SAD;
    } else if (needs.energy < 15) {
      AnimationState.facialExpression[eid] = ExpressionType.TIRED;
    } else if (needs.social > 70) {
      AnimationState.facialExpression[eid] = ExpressionType.HAPPY;
    } else {
      AnimationState.facialExpression[eid] = ExpressionType.NEUTRAL;
    }
  }
}
```

#### System 12: BrainSystem

Orchestrates the three cognitive lines (Near, Cold, Offline) and manages model routing.

```typescript
export class BrainSystem {
  private static readonly NEAR_LINE_TICK_INTERVAL = 1;    // every tick
  private static readonly COLD_LINE_COOLDOWN = 5.0;       // min seconds between cold line calls
  private static readonly OFFLINE_LINE_HOURS = [23, 0, 1, 2, 3, 4, 5]; // sleep hours

  private cacheManager: PromptCacheManager;
  private modelRouter: ModelRouter;
  private coldLineQueue: Map<number, ColdLineRequest[]> = new Map();

  constructor() {
    this.cacheManager = new PromptCacheManager();
    this.modelRouter = new ModelRouter();
  }

  async update(world: IWorld, dt: number, gameTime: GameTime): Promise<void> {
    const entities = brainQuery(world);

    for (const eid of entities) {
      // ── Near Line: Every tick ──
      if (SOV3Brain.nearLineActive[eid] === NearLineState.IDLE) {
        this.runNearLine(eid, gameTime);
      }

      // ── Cold Line: On-demand (check queue) ──
      const queue = this.coldLineQueue.get(eid) || [];
      if (queue.length > 0 &&
          Date.now() / 1000 - SOV3Brain.lastColdLineCall[eid] > BrainSystem.COLD_LINE_COOLDOWN) {
        const request = queue.shift()!;
        await this.runColdLine(eid, request);
      }
      SOV3Brain.coldLineQueueDepth[eid] = queue.length;

      // ── Offline Line: During sleep hours ──
      const isSleepHour = BrainSystem.OFFLINE_LINE_HOURS.includes(gameTime.hour);
      if (isSleepHour && SOV3Brain.offlineLinePending[eid] === OfflineLineTask.NONE) {
        // Start memory consolidation
        SOV3Brain.offlineLinePending[eid] = OfflineLineTask.MEMORY_CONSOLIDATION;
        await this.runOfflineLine(eid);
      }
    }
  }

  // ── Near Line: Fast reactive processing (every tick) ──
  private runNearLine(eid: number, gameTime: GameTime): void {
    const agentId = AgentIdentity.agentId[eid];
    const caste = AgentIdentity.caste[eid];

    // 1. Need-based fast decisions (no LLM — pure utility)
    const criticalNeed = this.checkCriticalNeeds(eid);
    if (criticalNeed) {
      // Emit corresponding pheromone
      PheromoneState.emittingType[eid] = this.needToPheromone(criticalNeed);
      PheromoneState.intensity[eid] = 0.5;
    }

    // 2. Check prompt cache for reusable responses
    const cacheKey = this.buildCacheKey(eid, gameTime);
    const cached = this.cacheManager.get(cacheKey);
    if (cached) {
      SOV3Brain.cacheHitRate[eid] =
        SOV3Brain.cacheHitRate[eid] * 0.9 + 0.1; // EWMA update
      this.applyCachedDecision(eid, cached);
      return;
    }

    SOV3Brain.cacheHitRate[eid] = SOV3Brain.cacheHitRate[eid] * 0.9;

    // 3. Pheromone response (fast pattern matching)
    // Uses a simple state machine — no LLM call needed
    this.processPheromoneResponse(eid);
  }

  // ── Cold Line: Deliberative processing (on-demand) ──
  private async runColdLine(
    eid: number, request: ColdLineRequest
  ): Promise<void> {
    SOV3Brain.nearLineActive[eid] = NearLineState.PROCESSING;
    SOV3Brain.lastColdLineCall[eid] = Date.now() / 1000;

    const modelTier = AgentIdentity.modelTier[eid];
    const model = this.modelRouter.selectForTask(request.taskType, modelTier);

    // Build rich prompt with memory context
    const prompt = await this.buildColdLinePrompt(eid, request);

    // Check cache before calling LLM
    const cacheKey = this.cacheManager.hash(prompt);
    const cached = this.cacheManager.get(cacheKey);
    if (cached) {
      this.applyColdLineResult(eid, request, cached);
      SOV3Brain.nearLineActive[eid] = NearLineState.IDLE;
      return;
    }

    // Call LLM via streaming for responsiveness
    const response = await model.generateStream({
      prompt,
      temperature: request.taskType === 'creative' ? 0.8 : 0.3,
      maxTokens: request.maxTokens || 500,
      tools: request.availableTools,
    });

    // Cache result
    this.cacheManager.set(cacheKey, response);

    // Apply result
    this.applyColdLineResult(eid, request, response);
    SOV3Brain.nearLineActive[eid] = NearLineState.IDLE;
  }

  // ── Offline Line: Sleep-phase learning ──
  private async runOfflineLine(eid: number): Promise<void> {
    const agentId = AgentIdentity.agentId[eid];
    const modelTier = AgentIdentity.modelTier[eid];

    // Use MiniMax M3 for memory agents (1M context for deep processing)
    const consolidation = new MemoryConsolidationSystem();
    const sessionLogs = WorkingMemoryStore.getForAgent(agentId);

    await consolidation.runConsolidation(eid, sessionLogs);

    // Update model routing based on historical accuracy
    this.modelRouter.optimizeForAgent(agentId);
  }

  // Queue a cold line request (called by other systems)
  queueColdLine(eid: number, request: ColdLineRequest): void {
    if (!this.coldLineQueue.has(eid)) {
      this.coldLineQueue.set(eid, []);
    }
    this.coldLineQueue.get(eid)!.push(request);
    SOV3Brain.coldLineQueueDepth[eid] = this.coldLineQueue.get(eid)!.length;
  }

  private checkCriticalNeeds(eid: number): string | null {
    if (Needs.bladder[eid] < 20) return 'bladder';
    if (Needs.energy[eid] < 10) return 'energy';
    if (Needs.hunger[eid] < 15) return 'hunger';
    if (Needs.hygiene[eid] < 15) return 'hygiene';
    return null;
  }

  private needToPheromone(need: string): number {
    const map: Record<string, number> = {
      bladder: PheromoneType.ALARM_RED,
      energy: PheromoneType.CLEANUP_BLACK,
      hunger: PheromoneType.TRAIL_GREEN,
      hygiene: PheromoneType.CASTE_TRANSFORM,
    };
    return map[need] || PheromoneType.ALARM_RED;
  }

  private async buildColdLinePrompt(
    eid: number, request: ColdLineRequest
  ): Promise<string> {
    const agentId = AgentIdentity.agentId[eid];
    const memories = await MemoryRetrieval.query(agentId, request.context);
    const personality = AgentPersonalityStore.get(agentId);

    return `You are ${personality.name}, a ${personality.role} in Agent 47 Town.
Personality: ${JSON.stringify(personality.bigFive)}
Current needs: hunger=${Needs.hunger[eid]}, energy=${Needs.energy[eid]}, social=${Needs.social[eid]}
Relevant memories: ${memories.map(m => m.description).join('\n- ')}
Task: ${request.prompt}`;
  }

  private buildCacheKey(eid: number, gameTime: GameTime): string {
    return `${eid}-${gameTime.hour}-${Math.floor(gameTime.minute / 5)}`;
  }

  private applyCachedDecision(eid: number, decision: CachedDecision): void {
    // Apply pre-computed decision from cache
    if (decision.targetLocation) {
      Navigation.targetX[eid] = decision.targetLocation.x;
      Navigation.targetZ[eid] = decision.targetLocation.z;
    }
  }

  private applyColdLineResult(
    eid: number, request: ColdLineRequest, result: string
  ): void {
    // Parse and apply cold line output
    // Implementation varies by task type
  }

  private processPheromoneResponse(eid: number): void {
    // Fast state machine for pheromone reactions
    // No LLM call — pure pattern matching
  }
}
```

---

## 2. SOV3 Split-Brain Decision Architecture

The SOV3 Split-Brain architecture divides every agent's cognition into three processing pipelines, inspired by Kahneman's Dual-Process Theory. This is the central nervous system of Agent 47 Town — it determines HOW agents think, not just WHAT they think.

### 2.1 Near Line — Fast Reactive Cognition

The Near Line operates at **30-60 Hz** (every simulation tick). It handles all decisions that must be made in real-time without LLM latency. This line uses a hybrid of cached LLM responses, utility scoring, and simple state machines — NEVER calling a live LLM during normal operation.

| Decision Type | Method | Latency |
|--------------|--------|---------|
| Need fulfillment routing | Utility scoring + cached responses | < 1ms |
| Social greetings | Pattern match (relationship > 20 = wave) | < 0.5ms |
| Movement/path following | Direct vector math + A* path cache | < 2ms |
| Pheromone reaction | State machine (alarm density > 0.6 = flee) | < 0.5ms |
| Schedule compliance | Lookup table (hour -> activity) | < 0.1ms |
| Animation selection | State machine (activity -> anim) | < 0.1ms |

The Near Line maintains a **prompt cache** of pre-computed responses for common situations. When an agent encounters a familiar scenario (e.g., "should I eat at home or the marketplace?"), the cached response is applied instantly. Cache keys are constructed from the agent's caste, current dominant need, time of day, and nearby entities — yielding approximately **500-2000 unique patterns** per agent that cover 95%+ of daily decisions.

Cache eviction follows an LRU policy with a 24-hour TTL. Cache hit rates are tracked per agent in the `SOV3Brain.cacheHitRate` component, with targets of **>85%** for worker-tier agents and **>70%** for specialist/orchestrator agents (who encounter more unique situations).

### 2.2 Cold Line — Deliberative Cognition

The Cold Line is invoked **on-demand** when the Near Line encounters a situation it cannot handle from cache. Typical triggers:

1. **Confidence threshold**: Near Line classification confidence < 0.85
2. **Risk threshold**: Decision risk score > 0.7 (e.g., spending >50% of wealth)
3. **Novelty threshold**: Situation similarity to cached patterns < 0.6
4. **External request**: A2A task delegation, player command, governance vote
5. **Tool use**: MCP tool selection requiring reasoning

Cold Line invocations are **batched and rate-limited** to prevent API cost spikes:
- Max 2 calls per agent per minute (worker tier)
- Max 5 calls per agent per minute (specialist tier)
- Max 10 calls per agent per minute (orchestrator tier)
- Queue depth tracked in `SOV3Brain.coldLineQueueDepth`

The Cold Line prompt is constructed with rich context pulled from all 4 memory layers, the agent's personality profile, current needs, and relevant pheromone readings. Average prompt size: **3,000-8,000 tokens**. Average response: **500-1,500 tokens**.

### 2.3 Offline Line — Reflective Cognition

The Offline Line activates during agent sleep hours (23:00-06:00 game time). This is when the heavy lifting happens — memory consolidation, reflection generation, next-day planning, and skill refinement.

Offline Line processing is **async and non-blocking** — agents sleep in the 3D world (playing sleep animations) while their brains process offline. The work happens in Web Workers to keep the main thread free for rendering.

Processing stages during a typical 7-hour sleep:

| Hour | Stage | Model | Duration |
|------|-------|-------|----------|
| 23:00 | Memory consolidation (L2 -> L3/L4) | MiniMax M3 | 10-20 min real |
| 00:00 | Reflection generation | DeepSeek V4 | 5-10 min real |
| 01:00 | Next-day schedule planning | Qwen3 | 2-5 min real |
| 02:00 | Prompt cache optimization | Local | 1-2 min real |
| 03:00 | Relationship decay + gossip pruning | Local | < 1 min real |
| 04:00-06:00 | Idle (deep sleep phase) | — | — |

---

## 3. Need-Based AI System

### 3.1 The 8-Need Model

Every agent tracks 8 needs on a 0-100 scale, inspired by The Sims but adapted for the CSOAI domain:

| Need | Decay Rate (pts/game hour) | Fulfillment Source | Critical Threshold | Death If Empty |
|------|---------------------------|-------------------|-------------------|----------------|
| **Hunger** | -16.7 | Food (marketplace, home) | < 15 | Yes (starvation) |
| **Energy** | -8.3 (awake) / +33 (sleeping) | Sleep (home bed) | < 10 | No |
| **Social** | -25.0 | Conversation (other agents) | < 10 | No |
| **Fun** | -20.0 | Entertainment (park, pub, games) | < 10 | No |
| **Wealth** | Special (spending/earning) | Salary, freelance, trades | < 5 (destitute) | No |
| **Comfort** | -12.5 | Home, nice furniture, weather | < 10 | No |
| **Hygiene** | -12.5 | Bathing (home), grooming | < 15 | No |
| **Bladder** | -33.3 | Restroom (home, hive, public) | < 20 | No |

### 3.2 Need-Driven Behavior Selection

When a need drops below its critical threshold, it generates a **behavior override** that interrupts the agent's current schedule. The priority order is:

1. **Bladder** (20) — most urgent, shortest grace period
2. **Energy** (10) — agent collapses if depleted
3. **Hunger** (15) — starvation risk
4. **Hygiene** (15) — social penalties when filthy
5. **Social** (10) — loneliness affects mood
6. **Fun** (10) — boredom affects work quality
7. **Comfort** (10) — discomfort slowly drains other needs
8. **Wealth** (5) — only affects access to goods/services

### 3.3 Advertisement Scoring

Every fulfillable object in the town (beds, toilets, food stalls, other agents) broadcasts an **advertisement** of what needs it can satisfy. Agents score all visible advertisements using the utility function:

```typescript
utility(ad) = SUM over all needs (
  (deficit / 100) ^ 1.5 * restore_value * need_weight * ad.priority
) * distance_factor * affordability_factor

Where:
  deficit = 100 - current_need_value
  distance_factor = max(0.1, 1 - distance / 200)
  affordability_factor = max(0.5, 1 - cost / max(balance, 1))
```

The exponent of 1.5 on deficit creates **exponential urgency** — needs become dramatically more pressing as they approach zero, preventing agents from ignoring critical needs until it's too late.

---

## 4. Schedule System

### 4.1 Daily Routine Template

Every agent follows a structured daily routine defined by schedule blocks. The default weekday schedule:

```
06:00 - 06:15  WAKE_UP      (home)      — Rise from bed, bladder check
06:15 - 06:45  HYGIENE      (home)      — Shower, brush teeth
06:45 - 07:15  EAT          (home)      — Breakfast ($0.50)
07:15 - 08:00  COMMUTE      (town)      — Walk to hive building
08:00 - 12:00  WORK         (hive)      — 4-hour morning shift
12:00 - 12:45  EAT          (market)    — Lunch ($1.00)
12:45 - 13:00  SOCIALIZE    (market)    — Brief chat with colleagues
13:00 - 17:00  WORK         (hive)      — 4-hour afternoon shift
17:00 - 17:45  COMMUTE      (town)      — Walk home
17:45 - 18:30  EAT          (home)      — Dinner ($0.50)
18:30 - 19:00  HYGIENE      (home)      — Bath, change
19:00 - 22:00  FREE_TIME    (variable)  — Socialize, hobby, freelance
22:00 - 22:30  WIND_DOWN    (home)      — Reading, prepare for bed
22:30 - 06:00  SLEEP        (home)      — 7.5 hours rest
```

### 4.2 Weekend Schedule

Weekends (Saturday-Sunday) have relaxed schedules with more free time:
- Wake up later (09:00 instead of 06:00)
- No work commute
- Extended social hours (13:00-23:00)
- Optional hobby activities at skill buildings

### 4.3 Schedule Override Priority

When multiple forces compete for an agent's attention:

```
Priority 1: Player command (Agent 47 overrides everything)
Priority 2: Life-threatening need (bladder < 5, energy < 5)
Priority 3: Emergency pheromone (mcp.alarm.red > 0.6)
Priority 4: Critical need (any need < threshold)
Priority 5: Social invitation (from friend with relationship > 60)
Priority 6: Job emergency (deadline-driven overtime)
Priority 7: Regular schedule block
Priority 8: Default idle behavior
```

---

## 5. Agent Economy

### 5.1 Income Structure

Each agent earns a daily salary from their hive employer:

| Agent Caste | Daily Salary (USDC) | Monthly (30 days) | Annual |
|-------------|--------------------|-------------------|--------|
| Worker (35 agents) | $2.50 - $3.50 | $75 - $105 | $900 - $1,260 |
| Specialist (8 agents) | $4.00 - $5.50 | $120 - $165 | $1,440 - $1,980 |
| Orchestrator (2 agents) | $6.00 - $7.00 | $180 - $210 | $2,160 - $2,520 |
| Memory (1 agent) | $5.00 | $150 | $1,800 |

### 5.2 Expenditure Structure

| Expense Category | Daily Cost (USDC) | Monthly | % of Avg Income |
|-----------------|-------------------|---------|-----------------|
| Housing rent | $2.00 | $60 | ~40% |
| Food (3 meals) | $1.50 | $45 | ~30% |
| Entertainment | $0.50 - $2.00 | $15 - $60 | ~10-40% |
| MCP tool calls | $0.02 - $0.50 | $0.60 - $15 | ~1-10% |
| Hygiene products | $0.25 | $7.50 | ~5% |
| Tax (10%) | ~$0.38 | ~$11.40 | 10% |

### 5.3 Wealth Effects on Behavior

Agent behavior changes based on wealth percentile within the town:

| Wealth Level | Behavior Changes |
|-------------|-----------------|
| Top 20% (>$80) | Invest in property, tip well, hire others for tasks, donate to treasury |
| Middle 60% ($20-80) | Normal spending patterns, save occasionally, use standard services |
| Bottom 20% (<$20) | Skip meals (hunger decays faster), skip entertainment, seek freelance work, may commit petty theft |

### 5.4 Freelance Economy (A2A Task Delegation)

Agents can earn extra income by delegating work to other agents:
- Compliance verification: $2.00-5.00 per task
- Waste disposal coordination: $1.00-3.00 per task
- Route optimization: $0.50-2.00 per task
- Security audit: $2.00-10.00 per task

The A2A protocol handles task discovery (Agent Cards), delegation (Task lifecycle), and payment (x402 settlement).

---

## 6. LLM Integration Architecture

### 6.1 Model Routing Table

| Agent Count | Model | Purpose | Input $/M | Output $/M | Monthly Cost |
|-------------|-------|---------|-----------|------------|--------------|
| 35 workers | Qwen3 235B Instruct | Near Line cache, simple dialogue, status updates | $0.09 | $0.10 | ~$51 |
| 8 specialists | DeepSeek V4 | Cold Line reasoning, compliance, tool use | $0.30 | $0.50 | ~$158 |
| 2 orchestrators | Kimi K2.6 | Multi-agent coordination, complex governance | $0.68 | $3.41 | ~$189 |
| 1 memory agent | MiniMax M3 | Offline Line consolidation, 1M context processing | $0.30 | $1.20 | ~$25 |
| **TOTAL** | **46 agents** | | | | **~$423/month** |

### 6.2 Prompt Caching Strategy

DeepSeek offers **90% cache discounts** on cached prompts. Our strategy:

1. **System prompts** (agent personality, role context): Permanent cache
2. **Town map data**: Permanent cache (changes rarely)
3. **Schedule templates**: Daily cache refresh
4. **Recent memories**: LRU cache, 1-hour TTL
5. **Common decisions**: LRU cache, 24-hour TTL

Expected cache hit rates by tier:
- Workers: 85-90% (repetitive tasks)
- Specialists: 65-75% (more unique situations)
- Orchestrators: 50-60% (highly variable)

With 90% cache discount, effective cost drops by ~40-50%.

### 6.3 Response Streaming

All Cold Line and Offline Line calls use streaming responses:
- **Cold Line**: Stream tokens as they're generated, update agent state progressively
- **Near Line**: No streaming — uses instant cache hits
- **Dialogue**: Stream text to speech bubbles above agent heads word-by-word
- **Error handling**: If streaming fails mid-response, fall back to cached default behavior

### 6.4 ModelRouter Implementation

```typescript
export class ModelRouter {
  // Model endpoint mapping (OpenRouter)
  private static readonly ENDPOINTS = {
    [ModelTier.QWEN3]: 'qwen/qwen3-235b-a22b-2507',
    [ModelTier.DEEPSEEK_V4]: 'deepseek/deepseek-v4',
    [ModelTier.KIMI_K2_6]: 'moonshotai/kimi-k2.6',
    [ModelTier.MINIMAX_M3]: 'minimax/minimax-m3',
  };

  selectForTask(taskType: TaskType, agentTier: number): ModelConfig {
    // Override based on task requirements
    if (taskType === 'memory_consolidation' || taskType === 'reflection') {
      return { endpoint: ModelRouter.ENDPOINTS[ModelTier.MINIMAX_M3], tier: ModelTier.MINIMAX_M3 };
    }
    if (taskType === 'orchestrate' || taskType === 'governance') {
      return { endpoint: ModelRouter.ENDPOINTS[ModelTier.KIMI_K2_6], tier: ModelTier.KIMI_K2_6 };
    }
    if (taskType === 'compliance' || taskType === 'deep_reasoning') {
      return { endpoint: ModelRouter.ENDPOINTS[ModelTier.DEEPSEEK_V4], tier: ModelTier.DEEPSEEK_V4 };
    }
    // Default: use the agent's assigned tier
    return { endpoint: ModelRouter.ENDPOINTS[agentTier], tier: agentTier };
  }

  async generateStream(config: GenerationConfig): Promise<string> {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.endpoint,
        messages: [{ role: 'user', content: config.prompt }],
        temperature: config.temperature || 0.7,
        max_tokens: config.maxTokens || 500,
        stream: true,
        ...(config.tools ? { tools: config.tools } : {}),
      }),
    });

    // Stream handling with accumulation
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(l => l.trim());
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            fullText += content;
          } catch { /* ignore parse errors */ }
        }
      }
    }

    return fullText;
  }
}
```

---

## 7. Performance Architecture

### 7.1 Spatial Partitioning

A uniform grid divides the 500m x 500m town into 10m x 10m cells (2,500 total). Each cell tracks entities within it. This enables O(1) proximity queries for social interactions, pheromone detection, and collision avoidance.

### 7.2 Level of Detail (LOD)

| Distance from Camera | Simulation Level | 3D Detail | AI Detail | Update Rate |
|---------------------|-----------------|-----------|-----------|-------------|
| 0-50m | Full | Full mesh + skeletal animation | Full AI + LLM | Every tick |
| 50-150m | Medium | Simplified mesh + keyframe anim | Utility AI only | Every 3 ticks |
| 150-300m | Far | Billboard sprite | Schedule-only | Every 10 ticks |
| 300m+ | Abstracted | Dot/omitted | Event queue | When visible |

### 7.3 Chunked Agent Updates

46 agents are split into update chunks to spread CPU load:
- **Chunk A (0-15)**: Updated on ticks where tick % 3 === 0
- **Chunk B (16-30)**: Updated on ticks where tick % 3 === 1
- **Chunk C (31-45)**: Updated on ticks where tick % 3 === 2

This reduces per-frame AI load by 66% while maintaining 30 Hz effective update rate per agent.

### 7.4 Web Worker Architecture

| Worker | Responsibility | Agent Count | Communication |
|--------|---------------|-------------|---------------|
| Main Thread | Rendering, ECS iteration, animation, input | 46 | — |
| AI Worker 1 | Near Line decisions for workers 1-15 | 15 | MessageChannel |
| AI Worker 2 | Near Line decisions for workers 16-30 | 15 | MessageChannel |
| AI Worker 3 | Near Line + Cold Line for specialists 31-46 | 16 | MessageChannel |
| LLM Worker | All LLM API calls (batched) | 46 | SharedArrayBuffer |
| Pathfinding Worker | A* path computation (queued) | on-demand | MessageChannel |

### 7.5 Performance Budget

| System | Per-Frame Cost | Notes |
|--------|---------------|-------|
| ECS iteration (46 entities) | ~0.01ms | bitecs SoA — negligible |
| Need decay (46 agents) | ~0.05ms | Simple arithmetic |
| Spatial queries | ~0.1ms | Uniform grid O(1) |
| Movement + path following | ~0.3ms | 46 agents |
| Animation state updates | ~0.2ms | State machine transitions |
| Social proximity check | ~0.5ms | Only nearby pairs |
| Pheromone system | ~0.3ms | Spatial hash queries |
| Schedule evaluation | ~0.1ms | Lookup tables |
| **Total (no LLM)** | **~1.6ms** | Well within 16ms budget |
| LLM calls (async) | ~1000-5000ms | Offloaded to workers, non-blocking |

---

## 8. Complete Architecture Diagram

```
================================================================================
                    CSOAI AGENT 47 TOWN — COMPLETE SIMULATION ARCHITECTURE
================================================================================

LAYER 8: APPLICATION (Browser)
├─ React UI (Zustand state management)
├─ Three.js 3D Renderer (@react-three/fiber)
│  ├─ 46 VRM humanoid avatars (VRoid + Mixamo animations)
│  ├─ 24 hive buildings (low-poly, instanced)
│  ├─ Town infrastructure (marketplace, housing, park, town hall)
│  ├─ Pheromone particle system (GPU-instanced, 10K particles)
│  └─ Day/night cycle lighting
├─ bitecs ECS World
│  ├─ 14 Component types (Position, Needs, Job, Memory, ...)
│  ├─ 12 Systems (decay, fulfillment, movement, navigation,
│  │             schedule, social, pheromone, memory, economy,
│  │             governance, animation, brain)
│  └─ 46 Agent entities + 200+ object entities
└─ Input handler (WASD + mouse for Agent 47, UI interactions)

LAYER 7: AI BRAIN (Main Thread + Web Workers)
├─ SOV3Brain Orchestrator
│  ├─ Near Line (30-60 Hz, cached, no LLM)
│  ├─ Cold Line (on-demand, LLM via streaming)
│  └─ Offline Line (sleep hours, async consolidation)
├─ NeedFulfillmentSystem (utility scoring)
├─ MemoryRetrieval (4-layer query engine)
├─ ModelRouter (Qwen3 / DeepSeek V4 / Kimi K2.6 / MiniMax M3)
├─ PromptCacheManager (LRU, 90% DeepSeek cache discount)
└─ EmbeddingService (HNSWLib, local)

LAYER 6: CSOAI PROTOCOLS
├─ MCP Client (JSON-RPC 2.0, 290+ servers)
├─ A2A Client (Agent Cards, task delegation)
├─ x402 Wallet (USDC on Base, per-call billing)
├─ BFT Governance (Tendermint prevote/precommit)
├─ Pheromone Emitter/Receiver (10 types, spatial hash)
├─ Agent Passport (DID + Ed25519 sigil + compliance)
└─ Worm Hive (cross-world tunneling)

LAYER 5: DATA LAYER
├─ HNSWLib (vector DB, semantic + episodic memory)
├─ SQLite (working memory, relationship graph, transaction log)
├─ Redis (pheromone pub/sub, real-time state)
└─ ChromaDB (alternative vector storage)

LAYER 4: EXTERNAL APIs
├─ OpenRouter (LLM model routing)
├─ Base blockchain (x402 settlement)
├─ MCP Hive endpoints (24 hive buildings)
└─ Embedding API (local or OpenRouter)

LAYER 3: SIMULATION LOOP
├─ 1 real second = 1 game minute (60x time compression)
├─ 60 FPS target (16ms frame budget)
├─ ~1.6ms AI overhead per frame (no LLM)
├─ LLM calls async in Web Workers (non-blocking)
└─ Spatial: 500m x 500m town, 10m grid cells
================================================================================
```

---

*End of Core Simulation Architecture Specification*
*Next: Deliverable 2 — Memory, Social & Protocol Integration*
