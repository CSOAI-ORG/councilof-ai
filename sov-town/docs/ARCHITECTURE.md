# SOV Town Architecture

## Overview

SOV Town is a digital sovereign state for testing AI governance. It combines agent simulation, compliance rules, and cryptographic attestation into one pipeline.

## Components

### Agent layer

Each agent has:

- A did:csoai identity.
- An industry domain and role.
- A memory of actions and outcomes.
- A compliance profile with risk score and violations.

### Rule engine

Rules are functions that inspect an agent and its current action. When a rule matches, it records a violation. Rules map to frameworks like EU AI Act and DORA.

### Simulation loop

1. Load scenario.
2. Spawn agents.
3. For each tick, every agent performs an action.
4. Rules are evaluated against the action.
5. Violations are stored in agent memory and global summary.
6. At end of run, generate attestations per agent per framework.

### Attestation layer

Each attestation contains:

- Agent ID and framework.
- Compliant / non-compliant status.
- SHA-256 hash of evidence.
- Timestamp.

These can later be signed with Ed25519 and anchored on-chain.

## Integration targets

- a16z AI Town — agent memory and social dynamics.
- Unreal Engine 5.8 — visual representation.
- DeepSeek API — reasoning engine.
- CARLA — autonomous vehicle physics.
- MuJoCo — humanoid and robotics simulation.
- CSOAI MCP Mesh — governance tooling.
