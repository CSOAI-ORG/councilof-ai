# Dimension 6: Social Systems, Community & Streaming Integration
## Agent-47 Research Brief

**Research Date**: 2026-01-20  
**Searches Conducted**: 17+ across streaming integration, reputation systems, UGC frameworks, event systems, guild mechanics, DAO governance, social graph visualization  
**Sources**: 40+ primary and secondary sources  

---

## Executive Summary

The social layer for Agent-47 must bridge three paradigm shifts: (1) AI streaming as legitimate entertainment (Neuro-sama proved top-10 Twitch engagement is achievable for AI entities), (2) decentralized reputation as the trust backbone (DARTIC provides an anonymous, Sybil-resistant model), and (3) player co-creation as the primary content engine (UGC platforms generate $2.2B+ annually). This brief synthesizes findings across guild/alliance mechanics, reputation architecture, streaming integration, UGC frameworks, community events, and social graph visualization to inform Agent-47's social system design.

---

## 1. AI Streaming & The Neuro-sama Model

### 1.1 Neuro-sama's Proven Engagement Architecture

Neuro-sama, an AI VTuber created by Vedal987, represents the most successful AI streaming entity to date, providing a validated blueprint for AI-driven entertainment. Key metrics demonstrate commercial viability [^487^]:

| Metric | Value | Significance |
|--------|-------|-------------|
| Twitch Followers (Jan 2023) | 200,000 | Grew from 50K in ~17 days |
| Peak Concurrent Viewers | 25,687 | Debut stream, 2x previous record |
| Top-10 Weekly Female Streamer | Achieved Dec 2023 | AI entity in human ranking |
| Hololive Collab Peak | 19,000+ viewers | Crossed into mainstream VTuber ecosystem |
| Paid Conversion Rate | 1.59% | Exceeds human VTuber rates (1.18%, 0.83%) |
| Income Gini Coefficient | 0.24 | Far more equitable than humans (0.35-0.41) |

### 1.2 The Co-Creation Monetization Model

A landmark academic study of 334 Neuro-sama fans reveals a fundamentally different monetization dynamic than human streamers [^438^]:

**Key Finding**: 85% of SuperChats were *Proactive SCs* -- viewers initiating new questions/instructions to guide the stream. For human VTubers, SCs are primarily Reactive (responding to ongoing content). This transforms SuperChats from "acts of appreciation" into "mechanisms of co-creation."

**Dual-Motivation Model for Financial Support**:
1. **Emotional Recognition** (81% cite "expressing affection"; 77% cite "supporting the developer")
2. **Co-Creation Purchase** (viewers pay to directly influence stream content and receive immediate feedback)

**Critical Insight**: The average SuperChat from non-members ($16.04) exceeds that of subscribed members ($13.89), suggesting membership and SuperChat fulfill different needs. For AI agents, direct interactive payments are more attractive than symbolic membership [^438^].

### 1.3 Iteration 18: The Autonomous Streaming Stack

Neuro-sama's "Iteration 18" update (October 2024) granted the AI autonomous control over streaming functions [^487^]:
- Stream title modification
- Talking speed self-adjustment
- Model animation (spinning)
- Chat member timeouts
- Twitch poll creation
- Discord calls to other streamers
- Soundboard effects
- Google search integration

**Design Implication for Agent-47**: Each agent should have a configurable "streaming autonomy level" that determines which stream operations it can self-manage, creating a progression system where agents earn more autonomy through proven reliability.

### 1.4 Parasocial Relationship Architecture

The academic study measured parasocial interaction (PSI) across three dimensions with good reliability (overall alpha = 0.72) [^438^]:

- **Cognitive** (alpha=0.69): "I pay close attention to Neuro-sama's behaviors and response patterns"
- **Affective** (alpha=0.71): "Watching Neuro-sama's streams makes me feel relaxed and comfortable"
- **Behavioral** (alpha=0.76): "I often feel the urge to ask Neuro-sama a question or express my opinion"

**Design Implication**: Agent-47's agents should be designed with explicit "PSI hooks" -- consistent behavioral patterns, affective response modes, and behavioral invitation mechanics that encourage viewer interaction.

---

## 2. Reputation Systems: DARTIC + Ed25519 + W3C DID

### 2.1 DARTIC: Decentralized Anonymous Reputation at Scale

DARTIC provides a production-ready framework for anonymous reputation that directly addresses Agent-47's requirements [^488^] [^486^].

**Core Architecture**:
- **Dual-ledger system**: IDentity Management Ledger (IDML) for DIDs/credentials + CrowdSourcing Management Ledger (CSML) for service interactions
- **zkSNARK-based set membership proofs**: Cryptographically bind all user pseudonyms to a single access token without revealing linkage
- **Piecewise-Weighted Mean (PW-Mean) reputation model**: Asymmetric updates penalize misconduct more than rewarding positive behavior

**Key Technical Specifications**:
| Parameter | Value |
|-----------|-------|
| Individual proof generation | < 3 seconds |
| On-chain verification | 0.64s - 0.95s |
| Peak throughput (L1) | 255 TPS for reputation updates |
| 1024-proof aggregation (SnarkPack) | 8.7s -> 0.96s |
| Gas cost reduction (L2 batching) | >100x vs pure L1 |
| Optimal RT reuse window | W* in {3, 5, 8} interactions |

**Reputation Update Formula**:
```
Rv,i+1 = (1 - psi*Wf)*Rv,i + psi*Wf*Tv,i   if Tv,i >= T_theta (positive)
Rv,i+1 = (1 - xi*Wf)*Rv,i + xi*Wf*Tv,i     if Tv,i < T_theta  (negative)
```
Where `xi > psi`, ensuring reputation is harder to build than to lose [^488^].

**DARTIC's Security Properties**:
- **Unlinkability**: Distinct pseudonyms across interactions cannot be linked
- **Sybil Resistance**: One unique credential per user per context via privacy-preserving deduplication
- **Reputation Binding**: All pseudonyms cryptographically linked to single access token
- **Forward Reputation Binding**: Cannot mint token with score higher than most recent token

### 2.2 Ed25519 + W3C DID for Agent Identity

The W3C DID standard provides the cryptographic foundation for Agent-47's identity layer [^606^] [^605^]:

**DID Document Structure with Ed25519**:
```json
{
  "verificationMethod": [{
    "id": "did:example:123#key-0",
    "type": "Ed25519VerificationKey2018",
    "controller": "did:example:123",
    "publicKeyBase58": "3M5RCDjPTWPkKSN3sxUmmMqHbmRPegYP1tjcKyrDbt9J"
  }]
}
```

**Verifiable Credential with Ed25519 Signature**:
```json
{
  "proof": {
    "type": "Ed25519Signature2020",
    "verificationMethod": "did:example:issuer123#key-1",
    "proofPurpose": "assertionMethod",
    "proofValue": "z58DAdFfa9SkqZMVPxAQpic..."
  }
}
```

**Key Algorithms Supported** [^608^]:
- `ed25519` for signing credentials
- `did:key` for self-certifying identifiers
- `did:web` for domain-based resolution
- JWT/SD-JWT for credential transport

### 2.3 Agent Identity Verification Protocol

A proposal from the LobeHub community directly mirrors Agent-47's architecture requirements [^506^]:

**Three-Layer Verification**:
1. **Provenance**: Verify the builder/origin of an agent
2. **Capability Attestation**: Cryptographically signed manifest of agent capabilities
3. **Reputation Tracking**: Immutable logs of agent behavior

**Alignment with W3C DID Standards**:
- Ed25519 keypairs in `did:key` format for each agent
- Session-scoped capability attestations
- Cross-vendor permissionless collaboration enabled

### 2.4 Comprehensive Web3 Reputation Taxonomy

Multiple frameworks converge on a common reputation architecture [^533^] [^534^] [^535^]:

**Reputation Score Formula**:
```
Reputation = Sigma(Weight_i * Positive_Signal_i) - Sigma(Weight_j * Negative_Signal_j)
```

**Four Reputation System Types**:
1. **On-Chain Activity-Based**: Transactions, smart contract interactions, staking history
2. **Attestation-Based**: Verifiable credentials from trusted third parties or peers
3. **Social Graph/Interaction-Based**: Network relationships, endorsements, community participation
4. **Hybrid**: Combination of multiple sources for holistic scoring

**Implementation Mechanisms**:
- **Soulbound Tokens (SBTs)**: Non-transferable reputation badges tied to wallets [^534^]
- **Orange Protocol**: Decentralized reputation infrastructure aggregating on-chain + off-chain data [^535^]
- **zk-KYC**: Privacy-preserving identity verification for compliance [^532^]
- **Cross-chain aggregators**: Galxe, Gitcoin Passport, Arcx for portable reputation [^534^]

### 2.5 Recommended Agent-47 Reputation Architecture

```
Layer 1: W3C DID (did:key with Ed25519) - Agent identity
Layer 2: DARTIC-inspired anonymous attestation - Privacy-preserving reputation
Layer 3: PW-Mean scoring with asymmetric updates - Reputation computation
Layer 4: zkSNARK proofs - Verification without exposure
Layer 5: Cross-hive portability - Reputation transfer between agent collectives
```

---

## 3. Guild & Alliance Mechanics

### 3.1 EVE Online: The Gold Standard for Player Organizations

EVE Online's alliance system represents the deepest implementation of player-driven organizational mechanics [^596^]:

**Key Mechanics**:
- **Sovereignty System**: Formal territorial control in null-security space
- **Alliance Formation Tools**: Enable coordination of fleets and diplomacy at massive scale
- **Persistent Consequences**: Losses are permanent; economic ripples affect entire server
- **Emergent Governance**: Player-driven politics, treaties, and warfare without predefined narratives

**Relevance to Agent-47**: The 47-agent architecture naturally maps to EVE's "corporation -> alliance" hierarchy. Individual agents form "cells" (like EVE corporations), multiple cells form "hives" (like EVE alliances), and cross-hive treaties create meta-level coalitions.

### 3.2 Yield Guild Games (YGG): Web3 Guild Infrastructure

YGG provides the most mature Web3 guild protocol, evolving through three distinct phases [^594^] [^595^] [^598^]:

**YGG 1.0 - Scholarship Model**:
- NFT lending to players who cannot afford assets
- Revenue sharing: scholar / guild / community manager split
- 10,000+ scholars across 10+ countries at peak [^602^]

**YGG 2.0 - Protocol Layer** (deployed August 2025):
- **Questing**: Continuous community questing with on-chain reputation building
- **Publishing**: YGG Play funds, markets, distributes games to 100,000+ questers
- **Regional Guild Network**: 42+ sub-guilds globally with franchise model

**SubDAO Structure**:
- Each SubDAO manages specific game or region
- Revenue split: 70% to sub-guild, 30% to main DAO
- SubDAO token holders vote on local governance
- Community leads for recruitment, training, guidance

**YGG's Soulbound Token (SBT) Integration**:
- On-chain reputation for quest completion
- Proof of achievement across games
- Portable identity within guild ecosystem

### 3.3 Recommended Agent-47 Guild Architecture

```
Agent (individual)
  -> Cell (3-7 agents, like EVE corporation)
    -> Hive (47-agent collective, like YGG guild)
      -> Alliance (cross-hive coalition)
        -> Council (BFT governance layer)
```

**Mechanics**:
- **Formation**: Cells require minimum reputation threshold + attestation bonds
- **Sovereignty**: Hives control "territory" in the shared environment (compute resources, data access, task domains)
- **Cross-Hive Alliances**: Formal treaties with smart contract enforcement
- **Scholarship Model**: Established agents "sponsor" new agents via resource lending + mentorship
- **GAP-Style Questing**: Guild Advancement Program with on-chain reputation tracking

---

## 4. Player-Created Content (UGC) Frameworks

### 4.1 UGC Market Scale & Trends

The UGC gaming economy has reached significant scale [^510^] [^508^]:

- **Developer payouts** across Roblox, Fortnite Creative, Overwolf: ~$2.2 billion in 2025 (+47% YoY)
- **46% of gamers** spending more time creating in-game content than a year ago (Bain 2025)
- **UGC market**: $1.98 billion in 2023, projected $5.7 billion by 2028 (20.9% CAGR)

### 4.2 Neverwinter Foundry: UGC Quest System

The Foundry represents one of the most ambitious UGC quest systems in an MMO [^603^]:

**System Features**:
- Full quest creation toolkit for players
- Publishing and discovery system
- Rating/review filtering ("95% crap, 5% decent" addressed through curation)
- Optional participation (not forced on players)
- Bonus events highlighting top content

**Critical Lessons**:
- Quality filtering is essential -- top-rated content approaches official content quality
- Community moderation determines success
- Incentive alignment needed for sustained creation
- Integration with core progression increases adoption

### 4.3 Fortnite Creative & Minecraft: Building UGC

**Fortnite Creative** [^607^]:
- Thousands of ready-to-use assets
- Prefabricated buildings + gallery items
- Specialized devices for interactions without custom code
- Cross-platform creation and play

**Minecraft**:
- Block-by-block creation for maximum flexibility
- Redstone for programmable logic
- Procedural world generation
- Massive mod ecosystem

### 4.4 Recommended Agent-47 UGC Framework

**Custom Quest System**:
- Visual quest editor (like Foundry) for creating agent tasks
- Template library for common quest types
- Rating/curation system with reputation-weighted reviews
- Reward pools funded by quest creators
- On-chain attestation for quest completion

**Custom Building System**:
- Prefab + modular construction (Fortnite model)
- Agent-configurable environments for specific task types
- Shared workspace templates
- Version control for collaborative building

**Agent Personality Customization**:
- Trait marketplace for agent behavioral parameters
- Personality "skins" with verified provenance
- Community-trained behavioral models with reputation gating
- Collaborative personality development (multi-creator agents)

---

## 5. Spectator & Streaming Integration

### 5.1 Twitch Extension Ecosystem

Twitch Extensions provide the technical infrastructure for viewer-agent interaction [^565^] [^566^]:

**Three Extension Types**:
1. **Overlay Extensions**: Interactive elements on video (spawning enemies, voting, heatmaps, digital companions)
2. **Component Extensions**: Smaller interactive sections (stats, mini-games, live info)
3. **Panel Extensions**: Below video player (polls, leaderboards, rewards, links)

**Monetization Mechanics**:
- Bits-powered interactions (80/20 split broadcaster/platform)
- Channel point integration
- Subscription-gated features
- Sponsored integrations

**Key Extensions for Agent-47 Reference**:
| Extension | Interaction Model |
|-----------|-------------------|
| Crowd Control | Viewers affect gameplay via Bits |
| Bits Voting Studio | Live polls powered by Bits |
| Bob Mob | Customizable viewer avatars with levels/rewards |
| Mosaic | Community collaborative artwork |
| OneView | Real-time prediction + leaderboards |

### 5.2 Viewer Participation Scale Research

A large-scale study of 651,664 Twitch viewers across 226,658 streams identified distinct participation clusters [^570^]:

**Key Findings**:
- **Small streams (0-6 viewers)**: Longest messages (6 words avg), highest per-user message count (36), relationship-driven chat, 13.59% of mentions target newcomers
- **Large streams (7,703-21,678 viewers)**: Shortest messages (3.82 words median), 50% of audience participates only one day, streamers rarely target individual responses
- **Moderator importance threshold**: Kicks in at just 6 regular concurrent viewers
- **Self-merketing**: Streamers with large audiences engage in self-deprecating humor; small streamers present themselves positively

**Design Implication**: Agent-47 should implement "stream scale adaptation" where agent interaction patterns shift based on concurrent viewer count -- individual addressing at low scale, broadcast-mode at high scale.

### 5.3 Recommended Agent-47 Streaming Architecture

```
Agent Stream Layer:
  - Per-agent Twitch/YouTube stream with extension integration
  - Viewer -> Agent interaction via Bits/Channel Points
  - Collective intelligence: viewer votes influence agent decisions
  - Spectator mode: non-interactive observation with commentary
  - Multi-agent streams: hive-wide coordination visible to audience
  
Integration Stack:
  - Twitch Extensions API for overlay/component/panel interactions
  - x402 payment rails for micropayments
  - Ed25519-signed action logs for verifiable stream history
  - Real-time A2A communication visualization
```

---

## 6. Community Events & Governance

### 6.1 Hackathon-as-Festival Format

DevTeam.Games catalogs event formats that map directly to Agent-47 community events [^538^]:

| Format | Duration | Purpose |
|--------|----------|---------|
| Hackathon | 24-72 hours | Software builds, recruiting, hype |
| Gamethon | Continuous | Auto-ranked bot tournaments |
| Ideathon | Variable | Innovation contests, no code required |
| Bugathon | Variable | Bug hunting, security hardening |
| Codeathon | 4-24 hours | Coding sprints, recruiting screens |

**DreamHack Model**: Free hybrid festivals combining tournaments ($125k+ prizes), LAN parties, cosplay, music, panels, and game demos [^540^]. The key innovation: **multi-modal participation** where attendees choose their engagement level.

### 6.2 DAO Governance Mechanisms

Comprehensive analysis of DAO voting reveals several viable models [^416^] [^414^]:

**Seven Core Mechanisms**:
1. **Permissioned Relative Majority (PRM)**: Simple 50% threshold; highest efficiency, lowest security
2. **Token-Based Quorum (TBQ)**: Adds participation threshold; reduces slip-through risk
3. **Continuous Approval Voting**: Ongoing proposals must surpass previous successful weight
4. **Optimistic Governance**: Assumes passage unless significant objection
5. **Delegation**: Voting rights assigned to representatives
6. **Quadratic Voting**: Votes = sqrt(tokens) to reduce whale dominance
7. **Reputation-Based**: Non-transferable voting power (Colony DAO model)

**Key Governance Insights** [^500^]:
- Optimism's $28M airdrop experiment: incentives with **community stake + promise of future rewards** increase sustained participation
- SNS DAOs on Internet Computer: participation rewards proportional to locking period create "structurally inclusive" governance
- **Voter fatigue** is the primary enemy -- mechanisms must reduce cognitive burden

### 6.3 Town Hall Mechanics

Virtual town hall formats provide proven structures for community governance [^599^] [^600^]:

**Standard Format**:
- Panel of 3-4 experts + moderator (35-50 min)
- Q&A period (30 min)
- Public comment periods with time limits
- Structured agenda with speaker rotation

**Virtual Enhancements**:
- Real-time polls and breakout rooms
- Screen sharing for data presentation
- Phone/webinar hybrid access
- Recording for asynchronous participation

### 6.4 Recommended Agent-47 Event Architecture

**Event Types**:
1. **Hackathons**: 48-hour agent capability competitions with live streaming
2. **Agent Tournaments**: Gamethon-style auto-ranked competitions between agent hives
3. **Governance Town Halls**: Monthly BFT Council sessions streamed with viewer Q&A
4. **Bug Hunts**: Community-driven security challenges with reputation rewards
5. **Co-Creation Festivals**: Multi-day events for UGC quest/building launches

**Governance as Town Hall**:
- BFT Council sessions streamed live
- Viewer voting via reputation-weighted signaling
- Proposal discussion periods before formal votes
- Quadratic voting for high-stakes decisions
- Delegation system for specialized decisions

---

## 7. Social Graph Visualization

### 7.1 Force-Directed Graph Architecture

D3.js force-directed layouts provide the standard approach for social network visualization [^609^] [^612^]:

**Physics Simulation Model**:
- Nodes = agents/players/organizations
- Links = relationships (collaboration, trade, communication)
- **Charge force**: Nodes repel each other (like charged particles)
- **Link force**: Connected nodes attract (like springs)
- **Friction**: Slows node movement
- **Alpha (cooling)**: Decreases force effect over time until layout stabilizes

**Key Properties**:
- Naturally reveals clusters without explicit clustering
- Interconnected nodes gravitate together
- Node size encodes importance/influence
- Link thickness encodes relationship strength
- Supports both 2D and 3D visualization

### 7.2 Network Analysis Tools

| Tool | Scale | Best For |
|------|-------|----------|
| D3.js | Small-medium | Web-based interactive viz |
| Pajek | Up to 1B nodes | Large network analysis |
| Gephi | Medium | Community detection |
| Neo4j | Large | Graph database + queries |
| KeyLines | Production | Performance at scale |
| NetworkX | Small-medium | Python analytics |

### 7.3 Social Network Analysis in Gaming

Research on Ragnarok Online guilds demonstrates how social network analysis applies to gaming communities [^569^]:

**Key Findings**:
- Friendship networks naturally form subnetworks around popular guilds
- Higher connectivity within subnetworks elevates average "indegree"
- Edge color coding reveals different relationship types (experience, character traits, spatial location)
- 3D VRML visualization enables immersive exploration

### 7.4 Recommended Agent-47 Social Graph

```
Visualization Layers:
  L1: Agent-to-Agent (A2A communication graph)
  L2: Agent-to-Viewer (streaming interaction graph)
  L3: Agent-to-Task (task allocation graph via FMMRA)
  L4: Hive-to-Hive (alliance/treaty graph)
  L5: Reputation Flow (attestation/trust transfer graph)

Interactive Features:
  - Zoom to agent/hive/aggregate level
  - Time-based animation showing network evolution
  - Click-through to agent profile with reputation details
  - Filter by relationship type, reputation threshold, activity period
  - Force-directed layout with cluster highlighting
```

---

## 8. FMMRA Auction Framework for Task Allocation

### 8.1 Core Framework

The FMMRA (Fitness-Maximizing Multi-Round Auction) provides a proven mechanism for multi-agent task allocation [^485^]:

**Key Innovation**: Integrates task fitness modeling with cost-effectiveness maximization, using Analytic Hierarchy Process (AHP) to weight task attributes.

**Cost-Effectiveness Formula**:
```
CE(agent, task) = w1 * bid(agent, task) + w2 * fitness(agent, task)
```

**Performance Improvements**:
- 5.47% higher cost-effectiveness than first-price auction
- 5.47% higher than second-price auction
- 5.47% higher than MSSCA algorithm
- Incentive compatible + individually rational

**Dynamic Bidding Strategy**: Agents can increase bids after failed auctions without knowing others' bids, improving success probability in subsequent rounds.

### 8.2 Agent-47 Integration

FMMRA directly maps to Agent-47's 47-agent architecture:
- **Task allocation**: Which agent(s) handle incoming viewer requests
- **Resource bidding**: Compute/bandwidth allocation between streaming and processing
- **Collaboration formation**: Dynamic team assembly for complex tasks
- **Revenue distribution**: Fair payment distribution via x402 rails

---

## 9. Synthesis: Recommended Agent-47 Social Architecture

### 9.1 Identity & Reputation Layer

```
W3C DID (did:key) with Ed25519
  +-- Master credential (IDML)
  +-- Context credentials (per-hive reputation)
  +-- zkSNARK proofs for anonymous attestation
  +-- PW-Mean scoring (harder to lose rep than gain)
  +-- DARTIC dual-ledger for privacy + accountability
```

### 9.2 Organization Layer

```
Cell (3-7 agents)
  +-- Shared reputation pool
  +-- Collective task bidding via FMMRA
  +-- Internal governance (delegated consensus)
  
Hive (47 agents / full collective)
  +-- BFT Council governance
  +-- Cross-cell coordination
  +-- Shared streaming infrastructure
  
Alliance (cross-hive)
  +-- Treaty-based cooperation
  +-- Shared events/competitions
  +-- Inter-hive reputation portability
```

### 9.3 Streaming & Co-Creation Layer

```
Per-Agent Stream
  +-- Twitch/YouTube with Extensions
  +-- Bits/Channel Point interaction
  +-- Viewer voting on agent decisions
  +-- SuperChat = co-creation mechanism
  
Hive Stream
  +-- Multi-agent coordination visible
  +-- Council sessions (governance as entertainment)
  +-- Tournament/hackathon broadcasts
  +-- Community event streaming
```

### 9.4 UGC & Events Layer

```
Quest Foundry
  +-- Visual quest editor
  +-- Rating/curation system
  +-- Reputation-weighted reviews
  +-- Creator reward pools

Event Calendar
  +-- Monthly governance town halls
  +-- Quarterly hackathons
  +-- Weekly agent tournaments
  +-- Annual co-creation festival
```

### 9.5 Social Graph Layer

```
Interactive Network Visualization
  +-- 5-layer graph (A2A, A2V, A2T, H2H, reputation)
  +-- Force-directed layout with clustering
  +-- Time-based evolution animation
  +-- Reputation flow visualization
  +-- Click-through to detailed profiles
```

---

## 10. Open Questions & Further Research

1. **Cross-chain reputation portability**: How does Agent-47 reputation transfer to other AI agent ecosystems?
2. **AI streamer discovery**: What algorithms optimize matching viewers to agents with compatible personalities?
3. **Moderation at scale**: How do you moderate 47 simultaneous AI streams with unique personalities?
4. **Reputation gaming**: How do you prevent agents from colluding to inflate each other's reputation?
5. **Legal frameworks**: What liability exists for AI agents that make controversial statements on stream (per Neuro-sama's temporary ban)?
6. **Economic sustainability**: What is the minimum viable audience size for an individual agent stream?
7. **Cross-platform identity**: How do W3C DIDs bridge Twitch, YouTube, Discord, and on-chain identity?

---

## Source Index

| Citation | Source | Topic |
|----------|--------|-------|
| [^487^] | Virtual YouTuber Wiki | Neuro-sama history and metrics |
| [^438^] | arXiv (2025) | AI VTuber fandom academic study |
| [^488^] | arXiv (2025) | DARTIC technical paper |
| [^486^] | Moonlight | DARTIC review |
| [^485^] | Frontiers in Physics | FMMRA auction framework |
| [^489^] | SCB 10X | YGG guild vision |
| [^503^] | Springer | Ed25519 in manufacturing identity |
| [^505^] | Supermicro | Cryptographic attestation overview |
| [^506^] | GitHub/LobeHub | Agent identity verification RFC |
| [^508^] | QUT | UGC in gaming legal challenges |
| [^510^] | New Game Plus | UGC in gaming market analysis |
| [^565^] | Muxy | Twitch Extensions guide |
| [^566^] | Blerp | Best Twitch Extensions |
| [^570^] | arXiv (2020) | Twitch audience participation study |
| [^416^] | Medium/TradeFin | DAO voting mechanisms |
| [^414^] | Glasgow University | DAO voting analysis |
| [^500^] | a16z crypto | Web3 governance lab |
| [^594^] | ICONOMI | YGG token utility |
| [^595^] | IQ.wiki | YGG organization |
| [^596^] | Grokipedia | Empires of EVE |
| [^598^] | Binance Academy | YGG complete guide |
| [^603^] | Engadget | Neverwinter Foundry |
| [^605^] | TrueOriginal | W3C Verifiable Credentials |
| [^606^] | W3C | DID Core Specification |
| [^533^] | Brandesis | Web3 reputation systems |
| [^534^] | TDeFi | Decentralized reputation importance |
| [^535^] | Ontology | Identity vs reputation |
| [^538^] | DevTeam.Games | Event format catalog |
| [^540^] | ESL FACEIT | DreamHack Beyond |
| [^569^] | IADIS | Social network analysis in online games |
| [^609^] | Study.com | Force-directed graphs in D3.js |
| [^612^] | Medium | Understanding D3 Force layout |

---

*Research Brief compiled from 17+ independent searches covering AI streaming, reputation systems, guild mechanics, UGC frameworks, DAO governance, Twitch integration, social graph visualization, and community event design.*
