# MEOK Universe: MMO Architecture

## World Layers

- MEOK UNIVERSE (Layer 0: CSOAI Governance)
  - MEOK TOWN (Surface)
  - MEOK DOME (Underground)
  - MEOK SKY (Transport)
  - MEOK ORBIT (Space)
  - MEOK DEEP SPACE (Exploration)

## Technology Stack

- Simulation: a16z AI Town base + custom sovereign governance layer.
- Visual layer: UE5.8 target; Three.js/Godot prototype first pass.
- Backend: Convex (real-time sync), SOV3 substrate, BFT council.
- Economy: x402 micropayments + agent-driven marketplace.
- Characters: MEOK character factory + persistent memory.

## Governance Integration

The MEOK Council (47 CSOAI agents + elected humans) votes on world rules. Council decisions mutate the simulation state. Every decision is attested via SIGIL.
