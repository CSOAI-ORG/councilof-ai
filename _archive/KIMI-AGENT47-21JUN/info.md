# Research Brief: CSOAI Agent 47 Town

## What We're Building
A 3D browser-based multi-agent simulation world where 46 AI agents + 1 human player (Agent 47) inhabit a stylized low-poly town. Each agent has a humanoid body, a job at a CSOAI hive building, personal needs, social relationships, and uses CSOAI protocols for everything. This is a living demonstration of the CSOAI ecosystem.

## Reference: Emergence.ai
Emergence World (world.emergence.ai) is the state-of-the-art — 50 agents across 5 parallel worlds for 15 days. Built with React Three Fiber + Python/FastAPI + PostgreSQL. They had emergent coalitions, crime cascades, voluntary self-termination. We go further with full CSOAI protocol integration.

## 3D Tech Stack
- Three.js + React Three Fiber (@react-three/fiber)
- @react-three/drei for helpers
- @pixiv/three-vrm for avatar loading
- Post-processing for bloom effects
- bitecs for Entity Component System (335K ops/s)
- Zustand for state management

## Visual Style
- Stylized low-poly / cel-shaded (Townscaper meets The Sims)
- CSOAI brand colors: deep blues, golds, with neon accents per district
- 8 VRoid archetypes with runtime variation for 46 unique agents
- 22+ buildings across 9 districts on 800m x 800m world
- Day/night cycle, weather effects
- Pheromone particles: red (alarm), green (trail), gold (queen), black (mark), blue (transform)

## Town Layout (9 Districts)
1. Central: SOV3 King's Tower (80m tall), Marketplace, Zen Garden
2. Governance: Parliament, Court of Proof, Ethics Sanctum
3. Commerce: Truck depot, waste facility, equipment yard, logistics hub
4. Wellness: Aquarium, koi pond, wellness center
5. Innovation: AI lab, retro-tech bridge, automation factory
6. Safety: Security HQ, safety center, training academy
7. Legal: Land court, data vault, accountability bureau
8. Media: Broadcast spire, transparency observatory
9. Residential: 46 personalized houses in ring around town

## Agent Simulation
- 8-need system: hunger, energy, social, fun, wealth, comfort, hygiene, bladder
- SOV3 Split-Brain: Near Line (fast reactions), Cold Line (deep planning), Offline Line (sleep consolidation)
- Daily schedules: wake → commute → work → lunch → work → home → socialize → sleep
- Social dynamics: friendships, rivalries, gossip, factions
- Economy: salaries ($2.50-5.50/day), x402 wallet, spending on food/entertainment/housing

## CSOAI Protocol Integration (Visualized)
- MCP: Agents discover and call tools at hive buildings
- A2A: Agents delegate tasks via Agent Cards
- x402: Wallet transactions between agents
- BFT: Town hall governance voting
- Pheromones: Colored particles showing swarm signals
- Agent Passport: Digital identity cards for each agent
- Worm Hive: Portal system to hive sub-worlds

## Human Player (Agent 47)
- WASD + mouse first-person controls
- E to interact, Tab for passport/wallet
- Golden aura, crown icon, special nameplate
- Can trigger pheromone signals, vote in governance, command agents via natural language

## Multi-World Portal System
- Walking through building entrance loads sub-world
- 3 detailed sub-worlds: FishKeeper (aquarium tanks), GrabHire (fleet dashboard), Meok (casino floor)
- Dissolve shader transitions

## Pages Needed
1. **Town World** (main): The 3D simulation with all agents, buildings, particles
2. **Dashboard**: Real-time metrics, agent status, protocol visualization
3. **Agent Directory**: Browse all 46 agents, view passports, relationships
4. **Governance Panel**: BFT proposals, voting history, constitution
5. **Settings**: Camera mode, simulation speed, visual options

## Key UI Elements
- HUD: Time of day, agent count, pheromone levels, transaction rate
- Floating labels above agents (name + job)
- Minimap (top-down agent positions)
- Full-screen analytics dashboard (toggleable)
- Agent interaction modal (click on agent to see passport, chat, delegate task)
- BFT governance panel (proposals, voting)

## Cost Reality
- LLM APIs: ~$423/month for 46 agents (Qwen3 + DeepSeek V4 + Kimi K2.6)
- For POC/demo: use free tier + mock LLM responses
- Full simulation: requires backend with API keys
