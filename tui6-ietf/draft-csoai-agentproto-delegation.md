# IETF: Agent Protocol Delegation and Evidence (DRAFT — not submitted)

**Status:** DRAFT prepared for review. Not submitted without owner approval.
**Date:** 2026-09-12

## Abstract

AI agents increasingly delegate tasks to other agents via protocols like MCP (Model Context Protocol) and A2A (Agent-to-Agent). This draft examines how evidence of delegated actions can be preserved and verified.

## Protocols Covered

1. **MCP** (Model Context Protocol): Tool discovery and invocation
2. **A2A** (Agent-to-Agent): Skill-based task delegation
3. **x402**: Payment-gated resource access
4. **AP2**: Agent payment protocol (emerging)

## Evidence Chain for Delegated Actions

```
Agent A discovers tool via MCP → invokes tool → receives result
  → result includes signed receipt (Ed25519)
  → receipt is included in Merkle root
  → root is witnessed by Rekor
  → Agent B can independently verify the receipt
```

## CSOAI Implementation

- 12 MCP tools (8 free, 4 paid via x402)
- A2A Agent Card v1.1.0 with 7 skills
- x402 catalog on Base mainnet (USDC)
- Signed receipts with DID-bound Ed25519 keys
- Public Merkle root with inclusion proofs

## Open Questions

- How should MCP servers handle receipt persistence?
- What is the minimum viable evidence for a delegated action?
- How do we prevent receipt forgery across protocol boundaries?
