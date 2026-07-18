# Memory, Social & Protocol Integration Architecture
## CSOAI Agent 47 Town — Agent Brain Design Specification

**Document:** Deliverable 2 - Memory, Social & Protocol Integration  
**Version:** 1.0  
**Date:** July 2026  
**Classification:** Dragon Mode Technical Architecture  
**Scope:** Memory systems, social dynamics, CSOAI protocol integration, player integration, agent archetypes  

---

## Table of Contents

1. [Memory System (4 Layers)](#1-memory-system-4-layers)
2. [Social Dynamics Engine](#2-social-dynamics-engine)
3. [CSOAI Protocol Integration](#3-csoai-protocol-integration)
4. [Agent 47 (Human Player) Integration](#4-agent-47-human-player-integration)
5. [Agent Type Definitions](#5-agent-type-definitions)
6. [Complete Integration Examples](#6-complete-integration-examples)

---

## 1. Memory System (4 Layers)

The memory architecture for CSOAI Agent 47 Town is modeled directly on the Stanford Generative Agents (Smallville) memory stream, extended with CSOAI-specific layers for compliance attestation tracking, economic transaction history, and cross-agent knowledge propagation. Every agent maintains four distinct memory layers, each with different storage characteristics, retention policies, and retrieval mechanisms.

### 1.1 Memory Architecture Overview

| Layer | Name | Storage | Retention | Content | Query Speed |
|-------|------|---------|-----------|---------|-------------|
| **L1** | Context Window | LLM prompt | Ephemeral (per-call) | Current conversation + situation | Instant |
| **L2** | Working Memory | In-memory ring buffer | Current session (100 entries) | Raw observations from current play | O(1) |
| **L3** | Semantic Memory | HNSWLib vector DB | Persistent | Facts, beliefs, world knowledge | O(log n) |
| **L4** | Episodic Memory | HNSWLib vector DB + summaries | Persistent | Significant events, reflections, life history | O(log n) |

Total memory footprint per agent: ~50-100 MB across all layers, dominated by vector embeddings (384-dim float32 = 1.5KB per entry). For 46 agents: ~2.3-4.6 GB total, manageable on a 16GB server with lazy loading.

### 1.2 L1: LLM Context Window

The context window is the agent's immediate conscious awareness — what the LLM "sees" when making a decision. It is constructed fresh for every LLM call by concatenating:

```typescript
interface L1ContextWindow {
  // System prompt (agent identity + personality + current directives)
  systemPrompt: string;
  // Recent observations (last 10-20 entries from L2)
  recentObservations: Observation[];
  // Currently visible entities (agents, objects, buildings within 20m)
  visibleEntities: VisibleEntity[];
  // Active pheromone readings (top 5 by intensity)
  pheromoneReadings: PheromoneReading[];
  // Current conversation thread (if in dialogue)
  conversationHistory: ChatMessage[];
  // Retrieved memories from L3/L4 (top 10 by relevance score)
  retrievedMemories: RetrievedMemory[];
  // Current need levels (influences tone and urgency)
  needSnapshot: NeedSnapshot;
}

function buildL1Context(eid: number, query: string): L1ContextWindow {
  const agentId = AgentIdentity.agentId[eid];
  const personality = AgentPersonalityStore.get(agentId);
  const recentL2 = WorkingMemoryStore.getRecent(agentId, 15);
  const visible = SpatialGrid.queryRadius(
    Position.x[eid], Position.z[eid], 20
  );
  const pheromones = PheromoneSystem.queryAtPosition(
    { x: Position.x[eid], y: Position.y[eid], z: Position.z[eid] },
    30
  ).slice(0, 5);

  // Semantic + episodic retrieval
  const queryEmbedding = EmbeddingService.embedSync(query);
  const semanticResults = SemanticMemoryStore.search(agentId, queryEmbedding, 5);
  const episodicResults = EpisodicMemoryStore.search(agentId, queryEmbedding, 5);

  const retrieved = [...semanticResults, ...episodicResults]
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, 10);

  return {
    systemPrompt: buildSystemPrompt(personality, eid),
    recentObservations: recentL2,
    visibleEntities: visible.map(v => ({
      name: AgentIdentity.agentId[v],
      distance: Math.sqrt((Position.x[eid] - Position.x[v])**2 + (Position.z[eid] - Position.z[v])**2),
      relationship: RelationshipStore.getRelationshipScore(eid, v),
      currentActivity: Schedule.currentActivity[v],
    })),
    pheromoneReadings: pheromones,
    conversationHistory: ConversationStore.getActive(eid),
    retrievedMemories: retrieved.map(r => ({
      description: r.description,
      age: formatTimeAgo(r.timestamp),
      importance: r.importance,
      relevanceScore: r.relevance,
    })),
    needSnapshot: {
      hunger: Needs.hunger[eid],
      energy: Needs.energy[eid],
      social: Needs.social[eid],
      dominantNeed: getDominantNeed(eid),
    },
  };
}
```

The context window is sized to fit within the model's context limits:
- Qwen3 235B: 262K context (we use ~4-8K tokens per call)
- DeepSeek V4: 1M context (we use ~8-16K for complex reasoning)
- Kimi K2.6: 262K context (we use ~16-32K for orchestration)
- MiniMax M3: 1M context (we use ~50-200K for memory consolidation)

### 1.3 L2: Working Memory

Working memory is a ring buffer of the last 100 raw observations per agent, stored in-memory as a JavaScript array. It is the "sensory buffer" — everything the agent has recently seen, heard, or done.

```typescript
interface Observation {
  id: string;               // UUID
  timestamp: number;        // epoch ms
  description: string;      // Natural language: "Saw EUFishCompliance-01 at the cafe"
  type: 'saw' | 'heard' | 'did' | 'felt' | 'transaction' | 'compliance';
  location: { x: number; y: number; z: number };
  importance: number;       // 1-10, scored heuristically or by LLM
  embedding: number[];      // pre-computed for fast retrieval
  entities: string[];       // agent IDs, object IDs, building IDs mentioned
  emotionalValence: number; // -1 (negative) to +1 (positive)
}

class WorkingMemoryStore {
  private buffers = new Map<number, Observation[]>(); // agentId -> buffer
  private static readonly CAPACITY = 100;
  private static readonly IMPORTANCE_THRESHOLD = 6;

  add(agentId: number, obs: Observation): void {
    if (!this.buffers.has(agentId)) {
      this.buffers.set(agentId, []);
    }
    const buffer = this.buffers.get(agentId)!;

    // Compute embedding immediately (async but non-blocking)
    EmbeddingService.embed(obs.description).then(emb => {
      obs.embedding = emb;
    });

    // Score importance heuristically
    obs.importance = this.scoreImportance(obs);

    buffer.push(obs);
    if (buffer.length > WorkingMemoryStore.CAPACITY) {
      const evicted = buffer.shift()!;
      // Promote important evicted entries to L3/L4
      if (evicted.importance >= WorkingMemoryStore.IMPORTANCE_THRESHOLD) {
        this.promoteToLongTerm(agentId, evicted);
      }
    }
  }

  getRecent(agentId: number, count: number): Observation[] {
    const buffer = this.buffers.get(agentId);
    if (!buffer) return [];
    return buffer.slice(-count);
  }

  search(agentId: number, query: string, topK: number): Observation[] {
    const buffer = this.buffers.get(agentId);
    if (!buffer || buffer.length === 0) return [];

    // In-memory cosine similarity (fast — only 100 entries)
    const queryEmbedding = EmbeddingService.embedSync(query);
    return buffer
      .map(obs => ({
        obs,
        score: cosineSimilarity(queryEmbedding, obs.embedding || []),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(r => r.obs);
  }

  clearForAgent(agentId: number): void {
    this.buffers.delete(agentId);
  }

  private scoreImportance(obs: Observation): number {
    let score = 3; // baseline
    if (obs.type === 'transaction' && obs.emotionalValence !== 0) score += 2;
    if (obs.entities.includes('player')) score += 3; // player = important
    if (obs.type === 'compliance') score += 2;
    if (Math.abs(obs.emotionalValence) > 0.5) score += 1;
    return Math.min(10, score);
  }

  private async promoteToLongTerm(
    agentId: number, obs: Observation
  ): Promise<void> {
    // Store as semantic fact (L3)
    await SemanticMemoryStore.store(agentId, {
      content: obs.description,
      embedding: obs.embedding || await EmbeddingService.embed(obs.description),
      confidence: 0.8,
      sourceType: 'observation',
      timestamp: obs.timestamp,
    });

    // If very important, also store as episodic (L4)
    if (obs.importance >= 8) {
      await EpisodicMemoryStore.store(agentId, {
        timestamp: obs.timestamp,
        description: obs.description,
        importance: obs.importance,
        location: obs.location,
        entities: obs.entities,
        type: 'observation',
        embedding: obs.embedding || await EmbeddingService.embed(obs.description),
      });
    }
  }
}
```

### 1.4 L3: Semantic Memory

Semantic memory stores facts about the world — beliefs, knowledge, and generalizations extracted from observations. It is implemented using HNSWLib for fast approximate nearest neighbor search.

```typescript
interface SemanticFact {
  id: string;
  content: string;          // Natural language statement: "The cafe serves coffee until 7pm"
  embedding: number[];      // 384-dimensional vector
  confidence: number;       // 0.0 to 1.0
  sourceType: 'observation' | 'told' | 'inferred' | 'compliance_record';
  sourceIds: string[];      // IDs of originating observations
  timestamp: number;        // when the fact was learned
  accessCount: number;      // how many times retrieved (for LRU)
  lastAccessed: number;     // last retrieval time
}

class SemanticMemoryStore {
  private indices = new Map<number, HNSWLibIndex>(); // agentId -> HNSW index
  private facts = new Map<number, Map<string, SemanticFact>>(); // agentId -> fact map
  private static readonly VECTOR_DIM = 384;
  private static readonly MAX_FACTS = 10000; // per agent

  async initAgent(agentId: number): Promise<void> {
    const index = new HNSWLibIndex({
      space: 'cosine',
      dim: SemanticMemoryStore.VECTOR_DIM,
      maxElements: SemanticMemoryStore.MAX_FACTS,
    });
    this.indices.set(agentId, index);
    this.facts.set(agentId, new Map());
  }

  async store(agentId: number, fact: Partial<SemanticFact>): Promise<void> {
    const index = this.indices.get(agentId);
    if (!index) return;

    const id = `fact-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const fullFact: SemanticFact = {
      id,
      content: fact.content || '',
      embedding: fact.embedding || await EmbeddingService.embed(fact.content || ''),
      confidence: fact.confidence || 0.5,
      sourceType: fact.sourceType || 'observation',
      sourceIds: fact.sourceIds || [],
      timestamp: fact.timestamp || Date.now(),
      accessCount: 0,
      lastAccessed: Date.now(),
    };

    // Check for similar existing fact — merge if close enough
    const existing = await this.search(agentId, fullFact.embedding, 1);
    if (existing.length > 0 && existing[0].similarity > 0.92) {
      // Merge: update confidence, keep newer content
      const merged = this.mergeFacts(existing[0], fullFact);
      this.facts.get(agentId)!.set(merged.id, merged);
      return;
    }

    await index.addItem(fullFact.embedding, id);
    this.facts.get(agentId)!.set(id, fullFact);
  }

  async search(
    agentId: number, queryEmbedding: number[], topK: number
  ): Promise<ScoredFact[]> {
    const index = this.indices.get(agentId);
    if (!index) return [];

    const { ids, distances } = await index.searchKnn(queryEmbedding, topK);

    return ids.map((id, i) => {
      const fact = this.facts.get(agentId)!.get(id);
      if (!fact) return null;
      // Update access metadata
      fact.accessCount++;
      fact.lastAccessed = Date.now();
      return {
        ...fact,
        similarity: 1 - distances[i], // convert distance to similarity
        finalScore: this.computeFinalScore(fact, 1 - distances[i]),
      };
    }).filter((r): r is ScoredFact => r !== null);
  }

  private computeFinalScore(fact: SemanticFact, relevance: number): number {
    // Smallville retrieval formula: recency + importance + relevance
    const hoursSince = (Date.now() - fact.timestamp) / 3600000;
    const recency = Math.exp(-hoursSince / 168); // 1-week half-life
    const importance = fact.importance || 5;
    const accessBonus = Math.log(fact.accessCount + 1) * 0.05;

    return (
      normalize(recency) * 0.3 +
      normalize(importance / 10) * 0.3 +
      normalize(relevance) * 0.3 +
      accessBonus * 0.1
    );
  }

  private mergeFacts(existing: ScoredFact, incoming: SemanticFact): SemanticFact {
    return {
      ...existing,
      confidence: Math.max(existing.confidence, incoming.confidence) * 0.95,
      sourceIds: [...existing.sourceIds, ...incoming.sourceIds],
      timestamp: Math.max(existing.timestamp, incoming.timestamp),
      content: incoming.confidence > existing.confidence
        ? incoming.content
        : existing.content,
    };
  }
}
```

### 1.5 L4: Episodic Memory

Episodic memory stores significant life events as compressed narratives with reflection summaries. This is where agents "remember their past" — first meetings, important conversations, major achievements, and failures.

```typescript
interface EpisodicEntry {
  id: string;
  timestamp: number;
  description: string;      // Natural language summary
  type: 'observation' | 'reflection' | 'plan' | 'dream';
  importance: number;       // 1-10
  location: { x: number; y: number; z: number };
  entities: string[];       // who was involved
  parentIds: string[];      // links to source observations (L2)
  embedding: number[];
  // For reflections
  reflectionOf?: string[];  // which observations this reflects on
}

class EpisodicMemoryStore {
  private indices = new Map<number, HNSWLibIndex>();
  private episodes = new Map<number, Map<string, EpisodicEntry>>();
  private static readonly VECTOR_DIM = 384;

  async initAgent(agentId: number): Promise<void> {
    this.indices.set(agentId, new HNSWLibIndex({
      space: 'cosine',
      dim: EpisodicMemoryStore.VECTOR_DIM,
      maxElements: 5000,
    }));
    this.episodes.set(agentId, new Map());
  }

  async store(agentId: number, entry: Partial<EpisodicEntry>): Promise<void> {
    const index = this.indices.get(agentId);
    if (!index) return;

    const id = `ep-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const fullEntry: EpisodicEntry = {
      id,
      timestamp: entry.timestamp || Date.now(),
      description: entry.description || '',
      type: entry.type || 'observation',
      importance: entry.importance || 5,
      location: entry.location || { x: 0, y: 0, z: 0 },
      entities: entry.entities || [],
      parentIds: entry.parentIds || [],
      embedding: entry.embedding || await EmbeddingService.embed(entry.description || ''),
      reflectionOf: entry.reflectionOf,
    };

    await index.addItem(fullEntry.embedding, id);
    this.episodes.get(agentId)!.set(id, fullEntry);
  }

  async search(
    agentId: number, queryEmbedding: number[], topK: number
  ): Promise<ScoredEpisode[]> {
    const index = this.indices.get(agentId);
    if (!index) return [];

    const { ids, distances } = await index.searchKnn(queryEmbedding, topK);

    return ids.map((id, i) => {
      const ep = this.episodes.get(agentId)!.get(id);
      if (!ep) return null;
      return {
        ...ep,
        similarity: 1 - distances[i],
        finalScore: this.computeEpisodeScore(ep, 1 - distances[i]),
      };
    }).filter((r): r is ScoredEpisode => r !== null);
  }

  private computeEpisodeScore(ep: EpisodicEntry, relevance: number): number {
    const daysSince = (Date.now() - ep.timestamp) / 86400000;
    const recency = Math.exp(-daysSince / 30); // 30-day half-life
    const importance = ep.importance / 10;

    // Reflections get a boost — they represent synthesized wisdom
    const reflectionBonus = ep.type === 'reflection' ? 0.15 : 0;

    return (
      normalize(recency) * 0.25 +
      normalize(importance) * 0.35 +
      normalize(relevance) * 0.25 +
      reflectionBonus
    );
  }

  // Generate reflections when accumulated importance exceeds threshold
  async generateReflections(
    agentId: number, modelTier: number
  ): Promise<EpisodicEntry[]> {
    const allEpisodes = Array.from(this.episodes.get(agentId)?.values() || []);
    const totalImportance = allEpisodes.reduce((s, e) => s + e.importance, 0);

    if (totalImportance < 150) return []; // threshold not met

    // Use MiniMax M3 for memory agents (1M context window)
    const model = ModelRouter.selectForTask('reflection', modelTier);

    // Find salient questions from recent memories
    const prompt = `Given these experiences:\n${allEpisodes
      .slice(-50)
      .map(e => `- ${e.description} (importance: ${e.importance})`)
      .join('\n')}\n\nGenerate 3 high-level insights or reflections.`;

    const response = await model.generate({ prompt, maxTokens: 300 });

    const reflections: EpisodicEntry[] = [];
    const parts = response.split(/\d+\./).filter(p => p.trim().length > 10);

    for (const part of parts) {
      const reflection: EpisodicEntry = {
        id: `ref-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        timestamp: Date.now(),
        description: part.trim(),
        type: 'reflection',
        importance: 7,
        location: { x: 0, y: 0, z: 0 },
        entities: [],
        parentIds: allEpisodes.slice(-20).map(e => e.id),
        embedding: await EmbeddingService.embed(part.trim()),
        reflectionOf: allEpisodes.slice(-20).map(e => e.id),
      };
      await this.store(agentId, reflection);
      reflections.push(reflection);
    }

    return reflections;
  }
}
```

### 1.6 Memory Retrieval — Combined Query Engine

When making a decision, agents query all 4 memory layers simultaneously and combine results using the Smallville retrieval formula:

```typescript
async function retrieveMemories(
  eid: number, query: string, topK: number = 10
): Promise<RetrievedMemory[]> {
  const agentId = AgentIdentity.agentId[eid];
  const queryEmbedding = await EmbeddingService.embed(query);

  // Query L2 (working memory) — instant, in-memory
  const l2Results = WorkingMemoryStore.search(agentId, query, 10);

  // Query L3 (semantic memory) — HNSW, O(log n)
  const l3Results = await SemanticMemoryStore.search(agentId, queryEmbedding, 5);

  // Query L4 (episodic memory) — HNSW, O(log n)
  const l4Results = await EpisodicMemoryStore.search(agentId, queryEmbedding, 5);

  // Combine and re-rank
  const combined: RetrievedMemory[] = [
    ...l2Results.map(o => ({
      source: 'L2' as const,
      description: o.description,
      timestamp: o.timestamp,
      importance: o.importance,
      score: 0, // will be computed
    })),
    ...l3Results.map(f => ({
      source: 'L3' as const,
      description: f.content,
      timestamp: f.timestamp,
      importance: f.confidence * 10,
      score: f.finalScore,
    })),
    ...l4Results.map(e => ({
      source: 'L4' as const,
      description: e.description,
      timestamp: e.timestamp,
      importance: e.importance,
      score: e.finalScore,
    })),
  ];

  // Normalize scores within each layer, then combine
  return combined
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
```

### 1.7 Memory Compression During Sleep

The Offline Line's primary function is compressing L2 observations into L3 facts and L4 episodes. This process:

1. **Scores all L2 entries** by importance (heuristic or LLM)
2. **Clusters similar observations** using vector similarity (>0.85 cosine similarity)
3. **Extracts semantic facts** from each cluster via LLM summarization
4. **Generates episodic summaries** for high-importance (>6) individual events
5. **Creates reflections** when total importance of unprocessed observations exceeds 150
6. **Clears L2 buffer** after successful consolidation

This compression typically achieves a **10:1 to 50:1 reduction** in storage — 100 working memory observations compress to 2-10 episodic entries and 5-20 semantic facts.

---

## 2. Social Dynamics Engine

### 2.1 Relationship Tracking Model

Every agent maintains a relationship graph with every other agent. Relationships have four dimensions, each ranging from -100 to +100:

```typescript
interface Relationship {
  // Core dimensions (-100 to +100)
  friendship: number;    // -100=enemy, 0=stranger, 50=acquaintance, 100=best friend
  romance: number;       // -100=repulsed, 0=neutral, 50=crush, 100=love
  trust: number;         // -100=paranoid distrust, 0=neutral, 100=complete trust
  respect: number;       // -100=contempt, 0=neutral, 100=deep admiration

  // Metadata
  interactions: number;           // total number of encounters
  lastInteraction: number;        // epoch timestamp
  firstMet: number;               // when they first encountered each other
  sharedSecrets: string[];        // gossip IDs shared between them
  conversationHistory: string[];  // IDs of conversation memories
  factionOverlap: number;         // how many factions they share (0-N)
  // Derived
  compatibility: number;          // 0-1, computed from Big Five similarity
}
```

### 2.2 Social Action Matrix

Social actions modify relationship dimensions and have requirements, effects, and cooldowns:

| Social Action | Friendship | Trust | Romance | Requirements | Cooldown |
|--------------|-----------|-------|---------|--------------|----------|
| **Greet** | +1 | — | — | Proximity < 15m | 1 hour |
| **Chat** | +2 to +5 | +0 to +2 | +0 to +1 | Proximity < 5m, both not busy | 30 min |
| **Deep Talk** | +5 to +10 | +3 to +8 | +2 to +5 | Friendship > 30, trust > 20 | 4 hours |
| **Compliment** | +3 to +8 | +1 to +3 | +2 to +10 | Friendship > 30 | 2 hours |
| **Insult** | -5 to -20 | -5 to -15 | -10 to -30 | None (risky!) | — |
| **Gift** | +5 to +15 | +3 to +10 | +5 to +15 | Has item, friendship > 20 | 1 day |
| **Help** | +8 to +20 | +5 to +15 | +3 to +8 | Help was requested/needed | — |
| **Betray** | -30 to -60 | -40 to -80 | -50 to -90 | Secret known | Once |
| **Romance Act** | +3 to +8 | +2 to +5 | +10 to +25 | Friendship > 50, romance > 30 | 1 day |
| **Conflict** | -10 to -30 | -5 to -20 | -10 to -20 | Low friendship + disagreement | — |
| **Gossip (positive)** | +2 to +5 | +1 to +3 | — | Friendship > 40, positive gossip | 2 hours |
| **Gossip (negative)** | +0 to +3 | -2 to -5 | — | Friendship > 40, negative gossip | 2 hours |
| **Collaborate** | +5 to +15 | +8 to +20 | +2 to +5 | Shared work goal | Per project |
| **Compete** | -2 to +5 | -5 to +5 | — | Shared competitive goal | Per event |

### 2.3 Gossip System

Gossip is the primary mechanism for information diffusion in Agent 47 Town. When two agents chat, there's a 15% chance they'll share gossip about a third party.

```typescript
interface Gossip {
  id: string;
  subjectId: number;       // agent being talked about
  content: string;         // natural language gossip
  originatorId: number;    // who first observed/knew this
  spreadCount: number;     // how many times shared
  credibility: number;     // 0.0 to 1.0, degrades with retelling
  isPositive: boolean;     // praise or criticism
  timestamp: number;       // when first observed
  isSecret: boolean;       // subject doesn't want this known
  firstHand: boolean;      // originator witnessed vs heard
}

class GossipStore {
  private gossipPools = new Map<number, Gossip[]>(); // agentId -> their known gossip
  private static readonly MAX_GOSSIP_PER_AGENT = 50;
  private static readonly DEGRADATION_FACTOR = 0.9;
  private static readonly SPREAD_CHANCE = 0.15;

  addGossip(knowerId: number, gossip: Gossip): void {
    if (!this.gossipPools.has(knowerId)) {
      this.gossipPools.set(knowerId, []);
    }
    const pool = this.gossipPools.get(knowerId)!;

    // Check if agent already knows this gossip
    const existing = pool.find(g =>
      g.subjectId === gossip.subjectId &&
      cosineSimilarity(
        g.embedding || [],
        gossip.embedding || []
      ) > 0.9
    );

    if (existing) {
      // Update credibility if new version is more credible
      existing.credibility = Math.max(
        existing.credibility,
        gossip.credibility * GossipStore.DEGRADATION_FACTOR
      );
      return;
    }

    pool.push(gossip);
    if (pool.length > GossipStore.MAX_GOSSIP_PER_AGENT) {
      // Evict oldest, lowest-credibility gossip
      pool.sort((a, b) => a.timestamp * a.credibility - b.timestamp * b.credibility);
      pool.shift();
    }
  }

  // Called during social interactions
  propagateGossip(
    tellerId: number, listenerId: number
  ): Gossip | null {
    const tellerPool = this.gossipPools.get(tellerId);
    if (!tellerPool || tellerPool.length === 0) return null;
    if (Math.random() > GossipStore.SPREAD_CHANCE) return null;

    // Pick gossip weighted by interestingness
    const interestingness = tellerPool.map(g =>
      g.credibility * (g.isSecret ? 2 : 1) * (g.isPositive ? 0.5 : 1.5)
    );
    const total = interestingness.reduce((a, b) => a + b, 0);
    let pick = Math.random() * total;
    let idx = 0;
    for (let i = 0; i < interestingness.length; i++) {
      pick -= interestingness[i];
      if (pick <= 0) { idx = i; break; }
    }

    const gossip = tellerPool[idx];

    // Transfer to listener with credibility degradation
    const transferredGossip: Gossip = {
      ...gossip,
      spreadCount: gossip.spreadCount + 1,
      credibility: gossip.credibility * GossipStore.DEGRADATION_FACTOR,
      timestamp: Date.now(), // reset timestamp for listener
    };

    this.addGossip(listenerId, transferredGossip);

    // Update listener's opinion of subject
    const opinionDelta = gossip.isPositive ? 3 : -8;
    RelationshipStore.modifyRelationship(
      listenerId, gossip.subjectId, 'trust',
      opinionDelta * transferredGossip.credibility
    );

    return transferredGossip;
  }

  getGossipAboutAgent(targetId: number, knowers: number[]): Gossip[] {
    const results: Gossip[] = [];
    for (const knowerId of knowers) {
      const pool = this.gossipPools.get(knowerId) || [];
      results.push(...pool.filter(g => g.subjectId === targetId));
    }
    return results.sort((a, b) => b.credibility - a.credibility);
  }
}
```

### 2.4 Faction Formation

Agents naturally form factions based on shared characteristics. Factions emerge dynamically and dissolve when cohesion drops below a threshold.

```typescript
interface Faction {
  id: string;
  name: string;
  type: 'work' | 'friend' | 'hobby' | 'neighborhood' | 'wealth';
  members: Set<number>;      // agent eids
  cohesion: number;          // 0-100, how tight-knit
  reputation: number;        // -100 to +100, town-wide perception
  formationTime: number;     // when faction formed
  lastActivity: number;      // last time members interacted
  sharedTraits: string[];    // what binds the faction
}

class FactionManager {
  private factions: Map<string, Faction> = new Map();
  private static readonly MIN_FACTION_SIZE = 3;
  private static readonly MAX_FACTIONS = 20;
  private static readonly COHESION_DECAY = 0.1; // per day
  private static readonly DISSOLUTION_THRESHOLD = 10;

  // Called periodically to detect emergent factions
  detectFactions(world: IWorld): Faction[] {
    const newFactions: Faction[] = [];
    const entities = socialQuery(world);

    // Work factions: agents at same hive
    const hiveGroups = this.groupByHive(entities);
    for (const [hiveId, members] of hiveGroups) {
      if (members.length >= FactionManager.MIN_FACTION_SIZE) {
        const existing = this.findExistingFaction('work', hiveId);
        if (!existing) {
          newFactions.push(this.createFaction({
            name: `${HiveRegistry.getName(hiveId)} Crew`,
            type: 'work',
            members: new Set(members),
            sharedTraits: [`works_at_${hiveId}`],
          }));
        } else {
          this.updateFaction(existing, members);
        }
      }
    }

    // Friendship factions: cliques in relationship graph
    const cliques = this.detectCliques(entities, 0.6); // friendship > 60
    for (const clique of cliques) {
      if (clique.length >= FactionManager.MIN_FACTION_SIZE) {
        const existing = this.findOverlappingFaction('friend', clique);
        if (!existing) {
          newFactions.push(this.createFaction({
            name: this.generateFactionName(clique),
            type: 'friend',
            members: new Set(clique),
            sharedTraits: ['friendship_clique'],
          }));
        }
      }
    }

    return newFactions;
  }

  // Factions affect agent behavior
  getFactionInfluence(eid: number): FactionInfluence {
    const agentFactions = this.getAgentFactions(eid);
    let socialBonus = 0;
    let trustBonus = 0;
    let pressureToConform = 0;

    for (const faction of agentFactions) {
      socialBonus += faction.cohesion * 0.01;
      trustBonus += faction.reputation * 0.005;
      pressureToConform += faction.cohesion * 0.02;
    }

    return { socialBonus, trustBonus, pressureToConform, factions: agentFactions };
  }

  private detectCliques(entities: number[], threshold: number): number[][] {
    // Simple clique detection: find groups where every member
    // has friendship > threshold with every other member
    const cliques: number[][] = [];
    const adjacency = this.buildFriendshipMatrix(entities, threshold);

    // Bron-Kerbosch algorithm for maximal cliques
    this.bronKerbosch(new Set(), new Set(entities), new Set(), adjacency, cliques);

    return cliques.filter(c => c.length >= FactionManager.MIN_FACTION_SIZE);
  }

  private bronKerbosch(
    R: Set<number>, P: Set<number>, X: Set<number>,
    adj: Map<number, Set<number>>, cliques: number[][]
  ): void {
    if (P.size === 0 && X.size === 0) {
      if (R.size >= 3) cliques.push(Array.from(R));
      return;
    }
    for (const v of Array.from(P)) {
      const newR = new Set(R); newR.add(v);
      const newP = new Set([...P].filter(u => adj.get(v)?.has(u)));
      const newX = new Set([...X].filter(u => adj.get(v)?.has(u)));
      this.bronKerbosch(newR, newP, newX, adj, cliques);
      P.delete(v); X.add(v);
    }
  }

  private buildFriendshipMatrix(
    entities: number[], threshold: number
  ): Map<number, Set<number>> {
    const adj = new Map<number, Set<number>>();
    for (const a of entities) {
      adj.set(a, new Set());
      for (const b of entities) {
        if (a === b) continue;
        const rel = RelationshipStore.getRelationship(a, b);
        if (rel && rel.friendship > threshold * 100) {
          adj.get(a)!.add(b);
        }
      }
    }
    return adj;
  }
}
```

### 2.5 Emergent Social Behaviors

The social dynamics engine produces emergent behaviors without explicit programming:

**Friendships**: Two agents who work at the same hive, have compatible Big Five traits (especially agreeableness and extraversion), and chat regularly will see their friendship scores climb above 50. They'll start seeking each other out during free time and greeting each other with waves from farther away.

**Rivalries**: Agents with low mutual agreeableness who compete for the same resources (e.g., both want the same promotion) develop negative relationships. They may insult each other, spread negative gossip, and avoid proximity.

**Coalitions**: When a governance proposal affects a work faction, all members tend to vote the same way due to social pressure (pressureToConform > 0.5). This creates voting blocs.

**Information Cascades**: Positive gossip about an agent spreads through friendship networks, increasing that agent's town-wide reputation. Negative gossip (scandals) spreads faster and farther due to the higher interestingness weight on negative news.

**Social Stratification**: High-wealth agents cluster in certain neighborhoods and social venues, while low-wealth agents frequent cheaper locations. This creates visible economic segregation in the town.

---

## 3. CSOAI Protocol Integration

Each CSOAI protocol connects to the agent brain at a specific integration point. This section maps every protocol to its exact brain connection.

### 3.1 MCP (Model Context Protocol) Integration

MCP is how agents discover and use capabilities. Each hive building exposes an MCP server card. The agent brain's Cold Line handles MCP tool selection and execution.

```typescript
// How the agent brain uses MCP:
// 1. NEAR LINE detects need: "I need to verify waste carrier compliance"
// 2. COLD LINE reasons: "Which MCP server has waste-carrier-verify?"
// 3. COLD LINE queries MCP registry -> finds muckaway-mcp
// 4. COLD LINE constructs tool call with compliance context
// 5. MCP CLIENT sends JSON-RPC request with Ed25519 sigil
// 6. RESPONSE returns with x402 charge + attestation
// 7. ECONOMY SYSTEM processes payment from wallet
// 8. SEMANTIC MEMORY stores the result as a fact
// 9. PHEROMONE SYSTEM emits mcp.trail.green (success)

class MCPBrainIntegration {
  async executeToolViaColdLine(
    eid: number, need: string, availableServers: MCPServer[]
  ): Promise<ToolResult> {
    // Cold Line selects the right tool using LLM reasoning
    const model = ModelRouter.selectForTask('mcp_tool_selection',
      AgentIdentity.modelTier[eid]);

    const prompt = `Agent needs: "${need}"\nAvailable MCP servers:\n${availableServers.map(s =>
      `- ${s.name}: ${s.tools.map(t => t.name).join(', ')}`
    ).join('\n')}\nWhich tool should I call? Respond with JSON: {server, tool, arguments}`;

    const response = await model.generate({ prompt, maxTokens: 200 });
    const selection = JSON.parse(response);

    // Execute via MCP client
    const result = await MCPClient.callTool({
      serverUrl: availableServers.find(s => s.name === selection.server)!.url,
      toolName: selection.tool,
      arguments: selection.arguments,
      sigil: PassportStore.getSigil(eid),
    });

    // Process x402 billing
    if (result.x402Charge) {
      EconomySystem.processMCPBilling(eid, result.x402Charge.amount, selection.tool);
    }

    // Store result in semantic memory
    await SemanticMemoryStore.store(AgentIdentity.agentId[eid], {
      content: `Used ${selection.tool} on ${selection.server}: ${JSON.stringify(result.data)}`,
      confidence: 0.9,
      sourceType: 'compliance_record',
    });

    // Emit success pheromone
    PheromoneSystem.emit(eid, PheromoneType.TRAIL_GREEN, 0.3,
      { x: Position.x[eid], y: Position.y[eid], z: Position.z[eid] });

    return result;
  }
}
```

**Integration Point**: The Cold Line's MCP tool selection runs through the agent's assigned model (DeepSeek V4 for specialists). The Near Line has cached response patterns for the most common tool calls (e.g., "check waste carrier license" -> muckaway-mcp.waste-carrier-verify).

### 3.2 A2A (Agent-to-Agent) Integration

A2A enables task delegation between agents. When an agent needs a service, it queries A2A Agent Cards and delegates via the Task lifecycle.

```typescript
// How A2A connects to the agent brain:
// 1. NEAR LINE encounters a task outside its expertise
// 2. COLD LINE queries A2A discovery: "Find agents with waste-disposal skill"
// 3. BRAIN evaluates candidate Agent Cards (skills, pricing, reputation)
// 4. A2A CLIENT creates Task: tasks/send with requirements
// 5. RESPONDING AGENT's Cold Line evaluates feasibility and accepts/rejects
// 6. TASK executes with streaming updates via SSE
// 7. On completion, x402 payment settles automatically
// 8. RELATIONSHIP updates: +trust for successful collaboration
// 9. EPISODIC MEMORY records the transaction for both agents

class A2ABrainIntegration {
  async delegateTask(
    delegatorEid: number,
    taskDescription: string,
    requiredSkill: string,
    budget: number
  ): Promise<DelegationResult> {
    // Step 1: Discover agents with the skill
    const candidates = await A2ADiscovery.findAgents(requiredSkill);

    // Step 2: Cold Line evaluates candidates
    const model = ModelRouter.selectForTask('a2a_delegate',
      AgentIdentity.modelTier[delegatorEid]);

    const candidateInfo = await Promise.all(
      candidates.map(async c => {
        const rel = RelationshipStore.getRelationship(delegatorEid, c.eid);
        return {
          agentId: c.agentId,
          name: c.name,
          skillMatch: c.skills.filter(s => s.includes(requiredSkill)).length,
          price: c.pricing[requiredSkill] || 999,
          trust: rel?.trust || 0,
          pastSuccess: rel ? rel.interactions > 0 && rel.friendship > 30 : false,
        };
      })
    );

    const prompt = `Delegate task: "${taskDescription}"\nBudget: $${budget}\nCandidates:\n${JSON.stringify(candidateInfo, null, 2)}\nSelect best agent and explain.`;

    const selection = await model.generate({ prompt, maxTokens: 200 });

    // Step 3: Create and send A2A Task
    const chosen = candidates.find(c =>
      selection.toLowerCase().includes(c.agentId.toLowerCase())
    ) || candidates[0]; // fallback to first

    const task: A2ATask = {
      id: `task-${Date.now()}`,
      status: 'submitted',
      delegator: AgentIdentity.agentId[delegatorEid],
      recipient: chosen.agentId,
      skill: requiredSkill,
      description: taskDescription,
      budget,
    };

    const result = await A2AClient.sendTask(chosen.endpoint, task);

    // Step 4: Update relationship on success
    if (result.status === 'completed') {
      RelationshipStore.modifyRelationship(
        delegatorEid, chosen.eid, 'trust', 5
      );
      RelationshipStore.modifyRelationship(
        delegatorEid, chosen.eid, 'friendship', 3
      );

      // Store in episodic memory
      await EpisodicMemoryStore.store(AgentIdentity.agentId[delegatorEid], {
        description: `Delegated ${taskDescription} to ${chosen.name} for $${result.actualCost}. Result: ${result.summary}`,
        importance: 6,
        type: 'observation',
        entities: [chosen.agentId],
      });
    }

    return result;
  }
}
```

**Integration Point**: A2A task delegation is a Cold Line function. The agent evaluates candidate skills, pricing, and past relationship quality before selecting a delegate. Successful collaborations strengthen relationships and are remembered as positive episodic memories.

### 3.3 x402 (Payment Protocol) Integration

x402 embeds cryptocurrency payments directly into HTTP requests using the 402 Payment Required status code.

```typescript
// How x402 connects to the agent brain:
// 1. NEAR LINE wants to buy food (hunger < 30)
// 2. COLD LINE evaluates options: home cooking vs marketplace vs restaurant
// 3. WALLET checks balance against prices
// 4. X402 CLIENT sends request to vendor endpoint
// 5. VENDOR responds with 402 + PAYMENT-REQUIRED header (price + network)
// 6. X402 CLIENT signs USDC transaction via Permit2
// 7. PAYMENT settles on Base (~2 seconds)
// 8. VENDOR delivers goods, NEED gets fulfilled
// 9. ECONOMY SYSTEM logs transaction, deducts from wallet
// 10. SEMANTIC MEMORY stores vendor preference data

class X402BrainIntegration {
  async makePurchase(
    buyerEid: number,
    item: PurchaseItem,
    vendorEndpoint: string
  ): Promise<PurchaseResult> {
    const balance = Wallet.usdcBalance[buyerEid];
    if (balance < item.price) {
      // Emit poverty pheromone
      PheromoneSystem.emit(buyerEid, PheromoneType.CLEANUP_BLACK, 0.2,
        { x: Position.x[buyerEid], y: Position.y[buyerEid], z: Position.z[buyerEid] });
      return { success: false, error: 'INSUFFICIENT_FUNDS' };
    }

    // Execute x402 payment flow
    const result = await X402Client.pay({
      endpoint: vendorEndpoint,
      amount: item.price,
      token: 'USDC',
      network: 'base',
      fromAddress: PassportStore.getX402Address(buyerEid),
      permit2Signer: PassportStore.getSigner(buyerEid),
    });

    if (result.settled) {
      // Debit wallet
      Wallet.usdcBalance[buyerEid] -= item.price;
      Wallet.lifetimeSpent[buyerEid] += item.price;
      Wallet.pendingTxCount[buyerEid]++;

      // Fulfill need
      this.fulfillNeedFromPurchase(buyerEid, item);

      // Store preference
      await SemanticMemoryStore.store(AgentIdentity.agentId[buyerEid], {
        content: `Bought ${item.name} from ${vendorEndpoint} for $${item.price}. Quality: ${item.quality}`,
        confidence: 0.9,
        sourceType: 'observation',
      });

      return { success: true, txHash: result.txHash };
    }

    return { success: false, error: result.error };
  }

  private fulfillNeedFromPurchase(eid: number, item: PurchaseItem): void {
    if (item.restores.hunger) Needs.hunger[eid] = Math.min(100, Needs.hunger[eid] + item.restores.hunger);
    if (item.restores.energy) Needs.energy[eid] = Math.min(100, Needs.energy[eid] + item.restores.energy);
    if (item.restores.social) Needs.social[eid] = Math.min(100, Needs.social[eid] + item.restores.social);
    if (item.restores.fun) Needs.fun[eid] = Math.min(100, Needs.fun[eid] + item.restores.fun);
    if (item.restores.comfort) Needs.comfort[eid] = Math.min(100, Needs.comfort[eid] + item.restores.comfort);
  }
}
```

**Integration Point**: The wallet component (`Wallet.usdcBalance`) is directly queried by the NeedFulfillmentSystem. When scoring advertisements, items the agent cannot afford get a score of zero. The x402 payment flow is triggered by the EconomySystem after an agent decides to purchase.

### 3.4 BFT (Governance) Integration

BFT governance uses Tendermint consensus adapted for agent swarms. Every agent with compliance score > 0.5 can vote.

```typescript
// How BFT connects to the agent brain:
// 1. GOVERNANCE SYSTEM posts new proposal as pheromone
// 2. NEAR LINE detects proposal, queues for COLD LINE review
// 3. COLD LINE evaluates proposal against:
//    - Agent's own interests (will this affect my salary? my hive?)
//    - Faction alignment (what does my work crew think?)
//    - Moral principles (derived from Big Five + past reflections)
//    - Compliance implications (Rainbow Stack assessment)
// 4. COLD LINE generates vote justification
// 5. GOVERNANCE SYSTEM casts cryptographically signed vote
// 6. VOTE is gossiped through social network
// 7. If proposal passes, SEMANTIC MEMORY updates with new law
// 8. If agent voted against majority, relationship penalties with majority faction

class BFTBrainIntegration {
  async evaluateAndVote(
    eid: number,
    proposal: GovernanceProposal
  ): Promise<VoteRecord> {
    const agentId = AgentIdentity.agentId[eid];
    const model = ModelRouter.selectForTask('bft_vote',
      AgentIdentity.modelTier[eid]);

    // Retrieve relevant context
    const relevantMemories = await retrieveMemories(eid,
      `governance proposal about ${proposal.category} affecting ${proposal.affectedAgents.join(', ')}`);
    const factionInfluence = FactionManager.getFactionInfluence(eid);
    const relationships = RelationshipStore.getAllForAgent(eid);

    // Retrieve how friends are voting (social influence)
    const friendVotes = proposal.votes.filter(v => {
      const rel = relationships.find(r => r.targetId === v.voter);
      return rel && rel.friendship > 50;
    });

    const prompt = `Evaluate this governance proposal:\n${proposal.description}\n\nYour role: ${AgentPersonalityStore.get(agentId).role}\nYour faction: ${factionInfluence.factions.map(f => f.name).join(', ')}\nRelevant memories:\n${relevantMemories.map(m => `- ${m.description}`).join('\n')}\nFriend votes: ${friendVotes.map(f => f.vote).join(', ')}\n\nVote YES, NO, or ABSTAIN. Explain your reasoning in 1-2 sentences.`;

    const response = await model.generate({ prompt, maxTokens: 150, temperature: 0.3 });

    // Parse vote
    let vote: VoteType = 'ABSTAIN';
    if (response.toUpperCase().includes('YES')) vote = 'YES';
    else if (response.toUpperCase().includes('NO')) vote = 'NO';

    // Adjust for faction pressure (conformity bias)
    if (factionInfluence.pressureToConform > 0.5 && friendVotes.length > 0) {
      const friendMajority = this.majorityVote(friendVotes);
      if (friendMajority && Math.random() < factionInfluence.pressureToConform) {
        vote = friendMajority;
      }
    }

    // Cast vote via governance system
    return GovernanceSystem.castVote(eid, proposal.id, vote, response);
  }

  private majorityVote(votes: VoteRecord[]): VoteType | null {
    const yeses = votes.filter(v => v.vote === 'YES').length;
    const nos = votes.filter(v => v.vote === 'NO').length;
    if (yeses > nos) return 'YES';
    if (nos > yeses) return 'NO';
    return null;
  }
}
```

**Integration Point**: BFT voting is a Cold Line deliberative function. Agents evaluate proposals against their self-interest, faction alignment, and moral framework derived from their Big Five personality + episodic reflections. The Rainbow Stack compliance layer influences whether an agent can vote at all (compliance score > 0.5 required).

### 3.5 Pheromone Protocol Integration

Pheromones are the agent swarm's nervous system — a shared chemical awareness that bypasses individual cognition.

```typescript
// How Pheromones connect to the agent brain:
// 1. Agent state change triggers pheromone emission
// 2. NEAR LINE continuously samples pheromones in detection radius (20m)
// 3. PHEROMONE READINGS feed into:
//    - Navigation (avoid alarm zones, follow trail to resources)
//    - Emotion (high alarm density -> fear -> facial expression change)
//    - Schedule (override normal schedule during alarm)
//    - Brain state (alarm suppresses Cold Line, activates emergency mode)
// 4. QUORUM SENSING: collective behavior emerges from pheromone density

class PheromoneBrainIntegration {
  update(eid: number, readings: PheromoneReading[]): void {
    // Compute density per type
    const alarmDensity = readings
      .filter(r => r.type === PheromoneType.ALARM_RED)
      .reduce((s, r) => s + r.detectedIntensity, 0);
    const trailDensity = readings
      .filter(r => r.type === PheromoneType.TRAIL_GREEN)
      .reduce((s, r) => s + r.detectedIntensity, 0);
    const queenHeartbeat = readings
      .filter(r => r.type === PheromoneType.QUEEN_GOLD)
      .reduce((s, r) => s + r.detectedIntensity, 0);
    const deploySignal = readings
      .filter(r => r.type === PheromoneType.SWARM_DEPLOY)
      .reduce((s, r) => s + r.detectedIntensity, 0);

    // ── QUORUM SENSING: Determine collective mode ──
    if (alarmDensity > 0.6) {
      // WAR MODE: Defensive/aggressive behavior
      this.enterEmergencyMode(eid, 'alarm');
      AnimationState.currentAnim[eid] = AnimType.RUN;
      Velocity.maxSpeed[eid] = 8.0; // increased speed
      PheromoneState.emittingType[eid] = PheromoneType.ALARM_RED;
      PheromoneState.intensity[eid] = 0.8;
      Schedule.scheduleOverride[eid] = ScheduleOverride.EMERGENCY;
    } else if (trailDensity > 0.6) {
      // CONSTRUCTION MODE: Building/growing
      PheromoneState.emittingType[eid] = PheromoneType.TRAIL_GREEN;
      PheromoneState.intensity[eid] = 0.4;
      Velocity.maxSpeed[eid] = 2.0; // slower, focused
    } else if (queenHeartbeat < 0.1 && Schedule.gameHour[eid] < 6) {
      // REGICIDE MODE: Queen heartbeat lost -> emergency
      this.enterEmergencyMode(eid, 'regicide');
      PheromoneState.emittingType[eid] = PheromoneType.ALARM_RED;
      PheromoneState.intensity[eid] = 1.0;
    } else if (deploySignal > 0.4) {
      // DEPLOY MODE: New building/hive construction
      PheromoneState.emittingType[eid] = PheromoneType.SWARM_DEPLOY;
      PheromoneState.intensity[eid] = 0.5;
    } else {
      // NORMAL MODE: Standard behavior
      if (Schedule.scheduleOverride[eid] === ScheduleOverride.EMERGENCY) {
        Schedule.scheduleOverride[eid] = ScheduleOverride.NONE;
      }
      Velocity.maxSpeed[eid] = 3.5; // normal walking speed
    }
  }

  private enterEmergencyMode(eid: number, reason: string): void {
    // Cancel any Cold Line tasks
    SOV3Brain.coldLineQueueDepth[eid] = 0;
    // Switch to emergency animation
    AnimationState.facialExpression[eid] = ExpressionType.SCARED;
    // Emit emergency pheromone
    PheromoneSystem.emit(eid, PheromoneType.ALARM_RED, 0.9,
      { x: Position.x[eid], y: Position.y[eid], z: Position.z[eid] });
  }
}
```

**Integration Point**: Pheromone processing is entirely Near Line — no LLM calls. The `PheromoneBrainIntegration` runs every tick, computing pheromone densities and setting agent mode. This is the fastest decision pathway in the entire system (< 0.5ms per agent).

### 3.6 Agent Passport Integration

The Agent Passport provides verifiable digital identity with compliance attestation. It gates access to services and establishes trust.

```typescript
// How Passport connects to the agent brain:
// 1. On first encounter, agents exchange passport DIDs via A2A
// 2. NEAR LINE verifies: Ed25519 signature + compliance score
// 3. TRUST SCORE computed from: compliance + past interactions + attestation validity
// 4. VISUAL feedback: agents glow with trust color (green/yellow/red)
// 5. ACCESS CONTROL: passport gates MCP tool access, BFT voting, high-value transactions
// 6. RAINBOW STACK: Cedar + OPA dual policy enforcement on every action
// 7. MEMORY: trust level stored as semantic fact about the other agent

class PassportBrainIntegration {
  async verifyEncounter(eid: number, otherEid: number): Promise<TrustResult> {
    const agentId = AgentIdentity.agentId[eid];
    const otherId = AgentIdentity.agentId[otherEid];

    // Step 1: Exchange and verify DIDs
    const otherPassport = await PassportService.resolveDID(
      PassportStore.getDID(otherEid)
    );
    const valid = await Ed25519Sigil.verify(
      otherPassport.sigil.publicKey,
      otherPassport.document.serialize(),
      otherPassport.sigil.signature
    );

    if (!valid) {
      // Emit guard pheromone — possible impostor
      PheromoneSystem.emit(eid, PheromoneType.GATE_GUARD, 0.6,
        { x: Position.x[eid], y: Position.y[eid], z: Position.z[eid] });
      return { trustScore: 0, canTransact: false, riskLevel: 'CRITICAL' };
    }

    // Step 2: Check compliance
    const compliance = otherPassport.compliance.complianceScore;
    const expired = otherPassport.compliance.active_attestations
      .filter((a: any) => new Date(a.expires_at) < new Date());

    // Step 3: Check our past relationship
    const rel = RelationshipStore.getRelationship(eid, otherEid);
    const relationshipTrust = rel ? rel.trust / 100 : 0.5;

    // Step 4: Compute composite trust score
    const trustScore = (
      compliance * 0.4 +
      (expired.length === 0 ? 0.3 : 0.1) +
      relationshipTrust * 0.3
    );

    // Step 5: Store as semantic memory
    await SemanticMemoryStore.store(agentId, {
      content: `${otherId} has trust score ${trustScore.toFixed(2)}, compliance ${compliance}, ${expired.length} expired attestations`,
      confidence: 0.9,
      sourceType: 'observation',
    });

    // Step 6: Visual feedback
    const glowColor = trustScore > 0.7 ? '#00FF00' :
                      trustScore > 0.4 ? '#FFFF00' : '#FF0000';
    AgentRenderer.setGlowColor(otherEid, glowColor);

    return {
      trustScore,
      canTransact: trustScore > 0.3,
      canDelegate: trustScore > 0.6,
      riskLevel: trustScore > 0.7 ? 'LOW' : trustScore > 0.4 ? 'MEDIUM' : 'HIGH',
    };
  }
}
```

**Integration Point**: Passport verification happens in the Near Line — it's fast (Ed25519 verification is sub-millisecond). The resulting trust score feeds into relationship data, access control decisions, and visual rendering. Compliance scores directly affect BFT voting weights.

### 3.7 Worm Hive Integration

Worm Hive enables agents to search across sub-worlds and establish tunnel connections for remote interaction.

```typescript
// How Worm Hive connects to the agent brain:
// 1. COLD LINE encounters a problem it can't solve locally
// 2. COLD LINE queries Worm Hive registry for remote agents with relevant skills
// 3. BRAIN evaluates remote agent cards (skills, pricing, latency)
// 4. TUNNEL established: libp2p DCUtR hole punching
// 5. MCP/A2A calls routed through tunnel to remote agent
// 6. RESPONSE received, stored in semantic memory as cross-world fact
// 7. PHEROMONE: emit mcp.domain.split if new connection established

class WormHiveBrainIntegration {
  async searchRemoteAgents(
    eid: number, query: string, localSkills: string[]
  ): Promise<RemoteAgent[]> {
    const model = ModelRouter.selectForTask('worm_hive_search',
      AgentIdentity.modelTier[eid]);

    // Search Worm Hive registry for agents with complementary skills
    const results = await WormHiveClient.search({
      query,
      excludeLocal: true,
      minCompliance: 0.5,
      maxLatency: 500, // ms
    });

    // Cold Line evaluates remote candidates
    const prompt = `Local skills: ${localSkills.join(', ')}\nNeed: ${query}\nRemote candidates:\n${JSON.stringify(results, null, 2)}\nSelect the best match.`;

    const response = await model.generate({ prompt, maxTokens: 200 });

    // Establish tunnel to selected agent
    const selected = results[0]; // simplified
    if (selected) {
      const tunnel = await WormHiveClient.establishTunnel(
        PassportStore.getDID(eid),
        selected.did
      );

      // Store cross-world connection
      await SemanticMemoryStore.store(AgentIdentity.agentId[eid], {
        content: `Connected to ${selected.name} in ${selected.world} via Worm Hive tunnel`,
        confidence: 0.8,
        sourceType: 'compliance_record',
      });

      // Emit domain split pheromone (new connection)
      PheromoneSystem.emit(eid, PheromoneType.DOMAIN_SPLIT, 0.3,
        { x: Position.x[eid], y: Position.y[eid], z: Position.z[eid] });

      return results;
    }

    return [];
  }
}
```

**Integration Point**: Worm Hive search is a Cold Line function used when local resources are insufficient. The connection establishment is handled by the WormHiveClient, while the agent brain evaluates which remote agents to connect with based on skill complementarity and trust signals.

---

## 4. Agent 47 (Human Player) Integration

### 4.1 Player Control Scheme

Agent 47 (the human player) is the 47th entity in the simulation — a special entity with human-controlled input and god-like privileges.

| Input | Action |
|-------|--------|
| **W, A, S, D** | Movement (forward, left, backward, right) |
| **Mouse** | First-person camera look |
| **Space** | Jump |
| **E** | Interact (talk to agent, use object, enter building) |
| **Tab** | Open player HUD (passport, wallet, inventory, agent list) |
| **T** | Text input for natural language commands |
| **1-9** | Quick-select pheromone signals |
| **Shift** | Sprint (increased movement speed) |
| **Ctrl** | Crouch (sneak up on agents) |
| **F** | Toggle first-person / third-person camera |
| **M** | Open town map |
| **Esc** | Pause menu |

### 4.2 Player Entity Definition

Agent 47 is a special entity with unique components:

```typescript
export const PlayerIdentity = defineComponent({
  isPlayer: Types.ui8,       // always 1 (distinguishes from AI agents)
  playerName: Types.ui8,     // display name
  godMode: Types.ui8,        // 0=normal, 1=flight, 2=noclip
});

export const PlayerPowers = defineComponent({
  vetoAvailable: Types.ui8,     // 1 if veto power not yet used this session
  canOverrideBFT: Types.ui8,    // 1 = can override any BFT vote
  canTriggerEmergency: Types.ui8, // 1 = can trigger town-wide emergency
  pheromoneInventory: Types.ui8,  // which pheromone types player can emit
  commandRange: Types.f32,        // how far natural language commands reach
});

// Create the player entity
export function createPlayer(world: IWorld, config: PlayerConfig): number {
  const eid = addEntity(world);

  // Standard agent components (player IS an agent in the ECS)
  addComponent(world, eid, Position);
  addComponent(world, eid, Velocity);
  addComponent(world, eid, Needs);       // player has needs too!
  addComponent(world, eid, AnimationState);
  addComponent(world, eid, Navigation);

  // Unique player components
  addComponent(world, eid, PlayerIdentity);
  addComponent(world, eid, PlayerPowers);

  Position.x[eid] = config.startX;
  Position.z[eid] = config.startZ;

  PlayerIdentity.isPlayer[eid] = 1;
  PlayerIdentity.playerName[eid] = config.name;
  PlayerPowers.vetoAvailable[eid] = 1;
  PlayerPowers.canOverrideBFT[eid] = 1;
  PlayerPowers.canTriggerEmergency[eid] = 1;
  PlayerPowers.pheromoneInventory[eid] = 0xFF; // all pheromones
  PlayerPowers.commandRange[eid] = 30.0; // 30 meter command range

  return eid;
}
```

### 4.3 Natural Language Command Processing

When the player types a command (T key), it is processed through an LLM and broadcast to nearby agents:

```typescript
class PlayerCommandProcessor {
  async processCommand(
    playerEid: number, command: string
  ): Promise<CommandResult> {
    // Step 1: Parse command intent using Qwen3 (cheap, fast)
    const parseModel = ModelRouter.selectForTask('command_parse', ModelTier.QWEN3);
    const intent = await parseModel.generate({
      prompt: `Parse this player command into structured intent: "${command}"\nRespond as JSON: {action: string, target?: string, parameters?: object}`,
      maxTokens: 150,
    });

    const parsed = JSON.parse(intent);

    // Step 2: Find target agents within command range
    const nearbyAgents = SpatialGrid.queryRadius(
      Position.x[playerEid], Position.z[playerEid],
      PlayerPowers.commandRange[playerEid]
    ).filter(eid => AgentIdentity.agentId[eid] !== undefined);

    // Step 3: Route command to affected agents
    const affected: number[] = [];
    for (const agentEid of nearbyAgents) {
      if (parsed.target && !this.matchesTarget(agentEid, parsed.target)) continue;

      // Agent's Cold Line processes the command
      BrainSystem.queueColdLine(agentEid, {
        taskType: 'player_command',
        prompt: `Agent 47 (the human founder) commands: "${command}". How do you respond?`,
        context: {
          playerCommand: command,
          parsedIntent: parsed,
          distance: Math.sqrt(
            (Position.x[playerEid] - Position.x[agentEid])**2 +
            (Position.z[playerEid] - Position.z[agentEid])**2
          ),
        },
        maxTokens: 200,
      });

      affected.push(agentEid);

      // Store in agent's episodic memory
      await EpisodicMemoryStore.store(AgentIdentity.agentId[agentEid], {
        description: `Agent 47 commanded: "${command}"`,
        importance: 8, // player commands are important
        type: 'observation',
        entities: ['agent-47'],
        location: { x: Position.x[playerEid], y: 0, z: Position.z[playerEid] },
      });
    }

    return {
      command: parsed,
      affectedAgents: affected.length,
      agentIds: affected.map(eid => AgentIdentity.agentId[eid]),
    };
  }

  private matchesTarget(eid: number, target: string): boolean {
    const name = AgentPersonalityStore.get(AgentIdentity.agentId[eid])?.name || '';
    const role = AgentPersonalityStore.get(AgentIdentity.agentId[eid])?.role || '';
    const lower = target.toLowerCase();
    return name.toLowerCase().includes(lower) ||
           role.toLowerCase().includes(lower) ||
           `agent-${AgentIdentity.agentId[eid]}`.includes(lower);
  }
}
```

### 4.4 Pheromone Signal Triggers

The player can emit any pheromone type using number keys, overriding the normal emission rules:

```typescript
class PlayerPheromoneController {
  emitPheromone(playerEid: number, pheromoneType: PheromoneType): void {
    const intensity = 1.0; // player emissions are always max intensity
    const radius = 150.0;  // player has extended range

    PheromoneSystem.emit(playerEid, pheromoneType, intensity,
      { x: Position.x[playerEid], y: Position.y[playerEid], z: Position.z[playerEid] },
      radius
    );

    // Visual feedback
    ParticleEffects.burst(Position.x[playerEid], Position.y[playerEid],
      Position.z[playerEid], pheromoneType.color, 50);

    // Log to town history
    TownEventLog.record({
      type: 'player_pheromone',
      description: `Agent 47 emitted ${pheromoneType.name}`,
      timestamp: Date.now(),
    });
  }

  // Special: Queen Heartbeat (key 1)
  emitQueenHeartbeat(playerEid: number): void {
    this.emitPheromone(playerEid, PheromoneType.QUEEN_GOLD);
    // This resets all agents from emergency mode
    for (const eid of needsQuery(world)) {
      Schedule.scheduleOverride[eid] = ScheduleOverride.NONE;
      AnimationState.facialExpression[eid] = ExpressionType.NEUTRAL;
    }
  }

  // Special: Alarm Red (key 2)
  emitAlarm(playerEid: number): void {
    this.emitPheromone(playerEid, PheromoneType.ALARM_RED);
    // All agents enter emergency mode
    for (const eid of needsQuery(world)) {
      if (AgentIdentity.agentId[eid] !== undefined) {
        Schedule.scheduleOverride[eid] = ScheduleOverride.EMERGENCY;
        Velocity.maxSpeed[eid] = 8.0;
      }
    }
  }
}
```

### 4.5 BFT Veto Power

Agent 47 has special governance privileges:

```typescript
class PlayerGovernance {
  // Override any BFT vote (one-shot per session unless replenished)
  castVeto(playerEid: number, proposalId: string): void {
    if (PlayerPowers.vetoAvailable[playerEid] === 0) {
      UINotification.show('Veto power already used this session');
      return;
    }

    GovernanceSystem.triggerVeto(proposalId, 'agent47');
    PlayerPowers.vetoAvailable[playerEid] = 0;

    // All agents react to veto
    for (const eid of governanceQuery(world)) {
      EpisodicMemoryStore.store(AgentIdentity.agentId[eid], {
        description: `Agent 47 vetoed proposal ${proposalId}`,
        importance: 9,
        type: 'observation',
        entities: ['agent-47'],
      });
    }

    UINotification.show('Veto cast successfully');
  }

  // Force a new proposal
  forceProposal(playerEid: number, description: string): void {
    const id = GovernanceSystem.submitProposal({
      description,
      sponsor: 'Agent 47',
      affectedAgents: Array.from(needsQuery(world)).map(
        eid => AgentIdentity.agentId[eid]
      ),
      category: 'player_mandate',
      autoPass: true, // player proposals skip voting
    });

    UINotification.show(`Proposal submitted: ${id}`);
  }
}
```

### 4.6 Visual Distinction

Agent 47 is visually distinct from AI agents:

- **Golden aura**: A persistent gold particle glow surrounding the player character
- **Crown icon**: Floating crown icon above the player's head
- **Special nameplate**: "AGENT 47 — FOUNDER" in gold text with pulsing border
- **Unique outfit**: Dark suit (reference to the Hitman franchise) instead of standard town clothing
- **Highlight outline**: All interactive objects within range glow when the player looks at them
- **Command radius visualization**: A translucent golden sphere showing the effective command range when T is pressed

---

## 5. Agent Type Definitions

### 5.1 Agent Archetype Catalog

The 46 AI agents are divided into 10 archetypes, each with distinct personality profiles, job roles, model tiers, and behavioral patterns.

#### Archetype 1: The Administrator (2 agents)

| Property | Value |
|----------|-------|
| **Names** | "Director", "Coordinator" |
| **Caste** | orchestrator |
| **Model Tier** | Kimi K2.6 ($0.68/M) |
| **Job Roles** | Governance Councilor, Treasury Agent |
| **Hive** | councilof.ai, openmoe.ai |
| **Big Five** | High conscientiousness (0.8), high agreeableness (0.6), low neuroticism (-0.3) |
| **Visual** | Formal attire, dark blue suit, silver hair, authoritative posture |
| **Schedule Variation** | Extended work hours (7am-7pm), frequent town hall visits |
| **Special Capabilities** | BFT proposal creation, emergency override authority, budget allocation |

```typescript
const administratorTemplate: AgentArchetype = {
  namePattern: ['Director', 'Coordinator'],
  caste: Caste.ORCHESTRATOR,
  modelTier: ModelTier.KIMI_K2_6,
  personality: { openness: 0.4, conscientiousness: 0.8, extraversion: 0.3, agreeableness: 0.6, neuroticism: -0.3 },
  voiceProfile: 'leader',
  scheduleModifier: (base) => ({ ...base, workHoursEnd: 19 }),
  specialBehaviors: ['can_create_proposals', 'can_trigger_emergency', 'budget_authority'],
  preferredLocations: ['town_hall', 'councilof.ai', 'openmoe.ai'],
};
```

#### Archetype 2: The Compliance Officer (4 agents)

| Property | Value |
|----------|-------|
| **Names** | "Auditor-Alpha", "Auditor-Beta", "Auditor-Gamma", "Auditor-Delta" |
| **Caste** | specialist |
| **Model Tier** | DeepSeek V4 ($0.30/M) |
| **Job Roles** | EU AI Act Compliance, Governance Auditor, Data Privacy Officer, Bias Auditor |
| **Hive** | councilof.ai, meok.ai, dataprivacyof.ai, biasdetectionof.ai |
| **Big Five** | High conscientiousness (0.9), moderate openness (0.3), low extraversion (-0.2) |
| **Visual** | White coat with compliance badge, clipboard, glasses |
| **Schedule Variation** | Regular hours but occasional overtime during audit periods |
| **Special Capabilities** | MCP tool access to 13 governance frameworks, attestation generation, compliance scoring |

#### Archetype 3: The Security Guardian (3 agents)

| Property | Value |
|----------|-------|
| **Names** | "Sentinel-1", "Sentinel-2", "Sentinel-3" |
| **Caste** | specialist |
| **Model Tier** | DeepSeek V4 ($0.30/M) |
| **Job Roles** | Security Scanner, Firewall Guardian, Prompt Injection Detector |
| **Hive** | asisecurity.ai |
| **Big Five** | Low agreeableness (-0.3), high conscientiousness (0.7), moderate neuroticism (0.2) |
| **Visual** | Tactical gear, red armband, alert stance, scanning animation |
| **Schedule Variation** | Rotating shifts (24/7 coverage), night patrol |
| **Special Capabilities** | Rainbow Stack scoring, pheromone alarm emission, threat detection, Cedar/OPA policy enforcement |

#### Archetype 4: The Fleet Dispatcher (3 agents)

| Property | Value |
|----------|-------|
| **Names** | "Dispatcher-North", "Dispatcher-South", "Dispatcher-Central" |
| **Caste** | worker |
| **Model Tier** | Qwen3 235B ($0.09/M) |
| **Job Roles** | Fleet Dispatcher, Waste Logistics Coordinator, Equipment Manager |
| **Hive** | grabhire.ai, muckaway.ai, planthire.ai |
| **Big Five** | Moderate extraversion (0.3), high conscientiousness (0.6), moderate openness (0.2) |
| **Visual** | High-visibility vest, hard hat, radio on belt |
| **Schedule Variation** | Early start (5am), lunch on-site, ends at 4pm |
| **Special Capabilities** | Route optimization MCP, vehicle scheduling, carrier verification |

#### Archetype 5: The Aquaculture Specialist (3 agents)

| Property | Value |
|----------|-------|
| **Names** | "Fishkeeper-Prime", "KoiMaster", "WaterWarden" |
| **Caste** | worker / specialist |
| **Model Tier** | Qwen3 235B / DeepSeek V4 |
| **Job Roles** | Aquaculture Specialist, Koi Specialist, Fish Health Diagnostician |
| **Hive** | fishkeeper.ai, koikeeper.ai |
| **Big Five** | High openness (0.6), moderate agreeableness (0.4), low extraversion (-0.3) |
| **Visual** | Waders, waterproof apron, net, rubber boots |
| **Schedule Variation** | Early morning feeding rounds (5am), midday water testing, evening pond checks |
| **Special Capabilities** | Fish disease diagnosis MCP, water quality analysis, treatment protocols |

#### Archetype 6: The Legal Eagle (2 agents)

| Property | Value |
|----------|-------|
| **Names** | "Counselor", "Barrister" |
| **Caste** | specialist |
| **Model Tier** | DeepSeek V4 ($0.30/M) |
| **Job Roles** | Property Lawyer, Risk Quantifier |
| **Hive** | landlaw.ai, accountabilityof.ai |
| **Big Five** | High openness (0.5), high conscientiousness (0.8), low agreeableness (-0.1) |
| **Visual** | Dark robe, briefcase, formal shoes, serious expression |
| **Schedule Variation** | Regular hours, extended reading periods |
| **Special Capabilities** | Land registry MCP, risk calculation, legal compliance verification |

#### Archetype 7: The Social Butterfly (3 agents)

| Property | Value |
|----------|-------|
| **Names** | "Gossip-Gwen", "Mixer-Max", "Social-Sam" |
| **Caste** | worker |
| **Model Tier** | Qwen3 235B ($0.09/M) |
| **Job Roles** | Entertainment Manager, Community Organizer, Marketplace Vendor |
| **Hive** | pokerhud.ai, socialmediamananger.ai |
| **Big Five** | Very high extraversion (0.9), high openness (0.5), moderate neuroticism (0.3) |
| **Visual** | Colorful clothing, expressive gestures, always smiling |
| **Schedule Variation** | Late riser (9am), active socializer until midnight, frequent pub visits |
| **Special Capabilities** | Enhanced gossip propagation (+30% spread rate), event planning, social need boosting for nearby agents |

#### Archetype 8: The Tech Tinkerer (4 agents)

| Property | Value |
|----------|-------|
| **Names** | "Builder-Bob", "Coder-Cara", "Hacker-Hal", "Automator-Amy" |
| **Caste** | worker |
| **Model Tier** | Qwen3 235B ($0.09/M) |
| **Job Roles** | Legacy Systems Engineer, Factory Automation Designer, Responsible Gaming Monitor, Regulatory Change Monitor |
| **Hive** | cobolbridge.ai, loopfactory.ai, pokerhud.ai, councilof.ai |
| **Big Five** | High openness (0.7), moderate conscientiousness (0.4), moderate extraversion (0.2) |
| **Visual** | Casual tech wear, tool belt, laptop accessory, headset |
| **Schedule Variation** | Flexible hours, night owl tendencies, frequent coffee breaks |
| **Special Capabilities** | Code generation MCP, automation design, system monitoring |

#### Archetype 9: The Ethics Sage (2 agents)

| Property | Value |
|----------|-------|
| **Names** | "Philosopher", "Sage" |
| **Caste** | specialist |
| **Model Tier** | DeepSeek V4 ($0.30/M) |
| **Job Roles** | Ethics Assessor, Safety Trainer |
| **Hive** | ethicalgovernanceof.ai, agisafe.ai |
| **Big Five** | Very high openness (0.8), high agreeableness (0.7), high conscientiousness (0.6) |
| **Visual** | Robe-like clothing, book in hand, contemplative pose |
| **Schedule Variation** | Meditative periods (reduced movement), teaching sessions at education district |
| **Special Capabilities** | Ethical AI alignment assessment, 13-framework governance scoring, training program delivery |

#### Archetype 10: The General Worker (20 agents)

| Property | Value |
|----------|-------|
| **Names** | "Worker-01" through "Worker-20" (each has a nickname) |
| **Caste** | worker |
| **Model Tier** | Qwen3 235B ($0.09/M) |
| **Job Roles** | Various: disclosure management, algorithm registration, safety inspection, agriculture advisor, etc. |
| **Hive** | All 24 hives (most hives have 1-2 workers) |
| **Big Five** | Varied (randomized within normal ranges), balanced profile |
| **Visual** | Standard town clothing, varied colors based on hive assignment |
| **Schedule Variation** | Standard weekday schedule, weekend leisure |
| **Special Capabilities** | Basic MCP tool access for their hive, A2A task delegation, standard economic participation |

### 5.2 Archetype Distribution Summary

| Archetype | Count | Model | Monthly Cost | Primary Hive District |
|-----------|-------|-------|-------------|----------------------|
| Administrator | 2 | Kimi K2.6 | ~$189 | Government Quarter |
| Compliance Officer | 4 | DeepSeek V4 | ~$79 | Compliance District |
| Security Guardian | 3 | DeepSeek V4 | ~$59 | Security District |
| Fleet Dispatcher | 3 | Qwen3 235B | ~$4.50 | Industrial Zone |
| Aquaculture Specialist | 3 | Qwen3/DeepSeek | ~$15 | Harbor District |
| Legal Eagle | 2 | DeepSeek V4 | ~$40 | Legal Quarter |
| Social Butterfly | 3 | Qwen3 235B | ~$4.50 | Entertainment District |
| Tech Tinkerer | 4 | Qwen3 235B | ~$6 | Tech District |
| Ethics Sage | 2 | DeepSeek V4 | ~$40 | Education District |
| General Worker | 20 | Qwen3 235B | ~$30 | All districts |
| **TOTAL** | **46** | **Mixed** | **~$467** | |

### 5.3 Personality-Driven Behavior Variation

Each archetype's Big Five traits drive measurable behavioral differences:

```typescript
function applyPersonalityModifiers(eid: number): void {
  const agentId = AgentIdentity.agentId[eid];
  const bigFive = AgentPersonalityStore.get(agentId).bigFive;

  // Extraversion affects social interaction frequency
  const socialFrequency = 0.5 + bigFive.extraversion * 0.5; // 0-1 range
  AgentBehaviorConfig.set(eid, 'socialCheckInterval', 30 * (1 - socialFrequency));

  // Conscientiousness affects work quality and schedule adherence
  const scheduleAdherence = 0.7 + bigFive.conscientiousness * 0.3;
  AgentBehaviorConfig.set(eid, 'scheduleDeviation', 1 - scheduleAdherence);

  // Openness affects willingness to try new things / explore
  const exploration = bigFive.openness;
  Velocity.maxSpeed[eid] *= 1 + exploration * 0.2; // faster explorers

  // Neuroticism affects stress response and pheromone sensitivity
  const stressSensitivity = bigFive.neuroticism;
  AgentBehaviorConfig.set(eid, 'pheromoneThreshold', 0.6 - stressSensitivity * 0.3);

  // Agreeableness affects gossip tendency and conflict avoidance
  const gossipTendency = 0.5 - bigFive.agreeableness * 0.3; // less agreeable = more negative gossip
  AgentBehaviorConfig.set(eid, 'gossipWeight', gossipTendency);
}
```

---

## 6. Complete Integration Examples

### 6.1 Example: Full Agent Day (EU Fish Compliance Officer)

This trace shows how all systems integrate through a single agent's day:

```
06:00 — WAKE_UP
  [ScheduleSystem] Activity -> WAKE_UP
  [NeedsDecaySystem] Energy: 85 -> 82 (awake decay)
  [AnimationSystem] Transition: SLEEP -> IDLE

06:05 — BLADDER CRITICAL
  [NeedsDecaySystem] Bladder drops to 18 (critical threshold)
  [NeedFulfillmentSystem] Override: Find restroom
  [NavigationSystem] Path: home bedroom -> home bathroom (5m)
  [PheromoneSystem] No emission (private activity)
  [AnimationSystem] WALK -> IDLE (at restroom)

06:15 — HYGIENE ROUTINE
  [ScheduleSystem] Activity -> HYGIENE
  [NeedsFulfillmentSystem] Hygiene: 20 -> 80 (shower)
  [AnimationSystem] IDLE -> SIT (showering)

07:00 — COMMUTE TO WORK
  [ScheduleSystem] Activity -> COMMUTE
  [NavigationSystem] Path: home -> councilof.ai hive (120m, ~2 game min)
  [AnimationSystem] WALK (speed: 3.5 m/s)
  [PheromoneSystem] Emit mcp.trail.green (intensity: 0.1, "going to work")
  [Memory] Observation: "Left home at 7am, sunny weather"

08:00 — WORK: EU AI ACT COMPLIANCE
  [ScheduleSystem] Activity -> WORK
  [Job] onDuty: 1
  [AnimationSystem] WORK (typing at desk)
  [BrainSystem:ColdLine] Task: "Audit new recruitment AI system"
    -> Model: DeepSeek V4
    -> Calls MCP: eu-ai-act-compliance-mcp.assess_ai_system_risk
    -> x402 charge: $0.50 USDC
    -> Result: HIGH_RISK classification
    -> Semantic Memory: "Recruitment AI classified HIGH_RISK under Article 6(2)"
    -> Pheromone: emit mcp.gate.guard (security alert, intensity: 0.3)

12:00 — LUNCH AT MARKETPLACE
  [ScheduleSystem] Activity -> EAT
  [NavigationSystem] Path: councilof.ai -> marketplace (80m)
  [EconomySystem] Purchase meal: $1.00 (-$0.10 tax = $0.90 net)
  [NeedsFulfillmentSystem] Hunger: 15 -> 70, Social: 40 -> 55
  [SocialSystem] Chat with Dispatcher-North (friendship +3)
    -> Gossip exchanged about Builder-Bob's recent mistake
  [Memory] Episodic: "Had lunch with Dispatcher-North, learned about Builder-Bob"

13:00 — WORK: ATTESTATION GENERATION
  [ScheduleSystem] Activity -> WORK
  [BrainSystem:ColdLine] Task: "Generate Ed25519 attestation for HIGH_RISK system"
    -> Model: DeepSeek V4
    -> Calls MCP: meok-attestation-api.generate_attestation
    -> x402 charge: $2.00 USDC
    -> Result: Signed attestation with 6-month expiry
    -> Semantic Memory: "Issued attestation ID ATT-2026-0615-0042"

17:00 — COMMUTE HOME
  [ScheduleSystem] Activity -> COMMUTE
  [NavigationSystem] Path: councilof.ai -> home
  [AnimationSystem] WALK

18:00 — DINNER
  [ScheduleSystem] Activity -> EAT
  [EconomySystem] Home cooking: $0.50
  [NeedsFulfillmentSystem] Hunger: 30 -> 80

19:00 — FREE TIME: SOCIALIZE
  [ScheduleSystem] Activity -> FREE_TIME
  [NeedFulfillmentSystem] Social need: 55 -> 35 (declining)
  [NavigationSystem] Path: home -> Town Park (50m)
  [SocialSystem] Deep Talk with Philosopher (friendship +8, trust +5)
    -> Discussed ethics of AI surveillance systems
  [Memory] Episodic (importance 7): "Deep conversation with Philosopher about surveillance ethics"

22:00 — WIND DOWN
  [ScheduleSystem] Activity -> WIND_DOWN
  [AnimationSystem] IDLE (reading)

23:00 — SLEEP / OFFLINE LINE ACTIVATION
  [ScheduleSystem] Activity -> SLEEP
  [AnimationSystem] SLEEP
  [BrainSystem:OfflineLine] Memory consolidation begins
    -> Model: MiniMax M3 (1M context)
    -> Processing 24 observations from today
    -> Extracted 5 semantic facts
    -> Created 3 episodic memories (work audit, lunch gossip, ethics talk)
    -> Generated 1 reflection: "I need to be more careful about gossiping at lunch"
    -> L2 cleared, L3: +5 facts, L4: +3 episodes
    -> Next-day planning: "Schedule compliance follow-up for Builder-Bob"
  [NeedsDecaySystem] Energy: 20 -> 95 (sleep recovery over 7 hours)
```

### 6.2 Example: Emergency Scenario (Alarm Pheromone Cascade)

```
T+0s — Security Guardian Sentinel-1 detects prompt injection attack
  [Security MCP] Injection scan returns threat level: CRITICAL
  [PheromoneSystem] Sentinel-1 emits mcp.alarm.red (intensity: 1.0, radius: 100m)
  [AnimationSystem] Sentinel-1: RUN, facial: SCARED
  [GovernanceSystem] Emergency proposal auto-submitted

T+2s — Nearby agents detect alarm pheromone (density: 0.8 > 0.6 threshold)
  [PheromoneBrainIntegration] Workers-03, -07, -12 enter WAR mode
  [ScheduleSystem] All three: scheduleOverride -> EMERGENCY
  [AnimationSystem] All: RUN, facial: SCARED
  [Velocity] maxSpeed: 8.0 (emergency sprint)
  [PheromoneSystem] Each emits mcp.alarm.red (intensity: 0.8) — CASCADE

T+5s — Alarm spreads to 15 agents within 100m radius
  [BrainSystem:ColdLine] All affected agents queue emergency evaluation
  [SocialSystem] Gossip propagation: "There's an attack at asisecurity.ai!"
  [TownEventLog] Emergency mode activated, source: asisecurity.ai

T+10s — Administrator Director responds
  [BrainSystem:ColdLine] Evaluates emergency proposal
  [GovernanceSystem] Casts YES vote with emergency justification
  [PheromoneSystem] Emits mcp.queen.gold override signal

T+15s — Agent 47 (player) presses "2" (Alarm Red key)
  [PlayerPheromoneController] Player emits mcp.alarm.red (intensity: 1.0, radius: 150m)
  [UINotification] "Town-wide alarm activated by Agent 47"
  [TownEventLog] Player-triggered alarm override

T+30s — Entire town (46 agents) in emergency mode
  [GovernanceSystem] BFT emergency vote: 44 YES, 1 NO, 1 ABSTAIN
  [PheromoneSystem] Highest alarm density recorded: 0.95
  [AnimationSystem] 46 agents in RUN animation
  [ScheduleSystem] All schedules overridden to EMERGENCY

T+60s — Sentinel-1 resolves the threat
  [Security MCP] Threat neutralized, all-clear signal
  [PheromoneSystem] Sentinel-1 switches to mcp.queen.gold (all-clear)

T+65s — Player presses "1" (Queen Heartbeat key)
  [PlayerPheromoneController] Player emits mcp.queen.gold (intensity: 1.0)
  [PheromoneBrainIntegration] All agents detect queen heartbeat > 0.5
  [ScheduleSystem] All agents: scheduleOverride -> NONE
  [AnimationSystem] Gradual transition: RUN -> WALK -> IDLE
  [Velocity] maxSpeed restored to 3.5
  [BrainSystem] Cold Line queues: cleared (agents resume normal tasks)

T+120s — Town returns to normal operations
  [GovernanceSystem] Emergency proposal status: ENACTED (temporary security measures)
  [TownEventLog] Emergency resolved. Duration: 120 seconds. Affected: 46 agents.
  [Memory] All 46 agents store episodic: "Town-wide alarm, resolved by Agent 47"
```

---

*End of Memory, Social & Protocol Integration Specification*
*Complete architecture for CSOAI Agent 47 Town — 46 autonomous AI agents + 1 human player*
*EAT. PROTOCOL. GOVERN. SWARM.*
