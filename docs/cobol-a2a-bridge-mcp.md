# cobol-a2a-bridge-mcp

**CSOAI-ORG/cobol-a2a-bridge-mcp** — the atomic unit of the bond venturi.

One repo. One bank pilot. One proven wrapper. Then scale.

## Purpose

Wrap COBOL mainframe batch output without migration. Read settlement instructions as they write to disk; emit C2PA attestations, DID mappings, and compliance probes; feed verified streams to A2A agents for T+0 atomic settlement.

## Modules

| Path | Role |
|------|------|
| `/parsers` | COBOL COPYBOOK → JSON schemas |
| `/attestations` | C2PA certificate per instruction row (`proofof-ai-mcp` pattern) |
| `/identity` | Mainframe user ID → `did:csoai` mapping (`agent-identity-trust-mcp`) |
| `/compliance` | ISO 42001 probe per batch job (`iso-42001-ai-mcp`) |
| `/tests` | Live COBOL test environment |

## Eunomia URI

```
eunomia://finance/cobol-a2a
```

## Settlement envelope

Production path chains to `POST /api/finance/settle` — one envelope with:

- Identity sign (DID)
- Attestation sign (C2PA)
- Consensus sign (BFT council)
- Transaction sign (x402 USDC on Base)

## Related MCPs

- `bft-progress-council-mcp` — batch job → agent task queue
- `proofof-ai-mcp` — audit log → provenance chain
- `agent-identity-trust-mcp` — RBAC → agent cards
- `care-membrane-mcp` — per-row safety probe
- `meok-coinbase-x402-receipt-mcp` — atomic DvP cash leg

## Surfaces

- https://councilof.ai/engine-axis
- https://councilof.ai/venturi
- https://cobolbridge.ai
