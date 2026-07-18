# SOV Town

A 47-agent governance simulation engine for CSOAI.

SOV Town tests AI governance before it becomes law. It spawns autonomous agents across 12 industry domains, runs them through compliance scenarios, and exports signed attestations.

## Quick start

```bash
npm install
npm run build
npm run simulate:eu-ai-act
```

## What it does

- Spawns 47 agents with did:csoai identities.
- Assigns each agent an industry and role.
- Runs scenarios for EU AI Act, DORA, and cross-border handoffs.
- Records every action, violation, and council decision.
- Exports SHA-256 hashed attestations.

## Scenarios

- `scenarios/eu-ai-act.json` — risk classification and prohibited-practice detection.
- `scenarios/dora.json` — operational resilience and incident reporting.

## Roadmap

1. Integrate a16z AI Town agent memory engine.
2. Add UE5.8 visual layer via MCP.
3. Add DeepSeek reasoning for agent decisions.
4. Add CARLA and MuJoCo for vehicles and humanoids.
5. Publish live simulation videos and white papers.

## Status

This is a scaffold. The rule engine is deterministic and the agent actions are synthetic. The goal is to prove the architecture before plugging in the full simulation stack.

## License

MIT.
