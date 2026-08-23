# eunomia-bond-router

**Status: SPEC** — first bridge repo for the Engine Axis (slot 18).

COBOL batch → A2A stream → atomic settle. Wrap, do not replace.

## Modules (planned)

| Module | Role |
|--------|------|
| `cobol-parser` | COPYBOOK → JSON |
| `a2a-agent-cards` | Financial agent identity |
| `atomic-settlement` | DvP stub → `POST /api/finance/settle` |
| `compliance-bridge` | ISO 42001 + hive crosswalk probes |

## Honest register

- Not live on councilof.ai until a frozen bank pilot publishes.
- GSPC core axes remain the only **MEASURED** finance-adjacent evidence today.
- See `docs/cobol-a2a-bridge-mcp.md` and `docs/STACK_HONESTY.md` in councilof-ai.

## First proof

One COPYBOOK → one JSON → one C2PA attestation via `proofof-ai-mcp`.

## Surfaces

- UI: https://councilof.ai/engine-axis
- API: `GET /api/finance/anatomy`
- Agent index: `GET /api/instruments`
