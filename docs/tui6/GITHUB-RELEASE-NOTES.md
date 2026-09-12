# GitHub Release Notes — Draft for first release

**Tag:** v0.1.0-evidence
**Target:** CSOAI-ORG/councilof-ai master
**Date:** 2026-09-12 (pending owner approval)

---

## CSOAI Evidence System v0.1.0

Independent AI-governance measurement body. Measurement, not certification.

### What's included

- **22-axis GSPC board** — live at /api/gspc, machine-readable, reports UNMEASURED honestly
- **335 signed measurement cards** — Ed25519, 335/335 valid, independently verifiable
- **167-card public Merkle root** — Rekor-witnessed (log index 2791822965), OTS submitted
- **425 stablecoin index** — 211 chains, $310.79B circulating, from DefiLlama
- **5 deep measurements** — USDC (Ethereum + Stellar), USDT, DAI, RLUSD (XRPL)
- **MCP server** — 12 tools (8 free, 4 paid x402) at /mcp
- **A2A Agent Card** — v1.1.0 at /.well-known/agent-card.json
- **x402 payment** — 9 resources on Base mainnet, USDC
- **Verification tools** — /gspc-verify, verify-card.mjs, HOW-TO-VERIFY.md

### How to verify

```bash
# Read the board
curl https://councilof.ai/api/gspc

# Verify a card
curl https://councilof.ai/gspc-verify

# Check the root
curl https://councilof.ai/root.json

# Resolve the DID
curl https://csoai.org/.well-known/did.json
```

### What this is NOT

- NOT a certification, accreditation, or conformity assessment
- NOT proof of reserves, compliance, or safety
- NOT revenue (external revenue: $0.00)
- NOT "425 measured" (425 indexed, 5 deeply measured)

### Files

- `public/signed/chain.json` — 335-card signed chain
- `public/root.json` — 167-card Merkle root
- `functions/api/gspc.ts` — GSPC board API
- `functions/api/state.ts` — Single source of truth
- `functions/api/revenue.ts` — Revenue tracking
- `scripts/readers/` — EVM, XRPL, Stellar on-chain readers
- `docs/tui6/` — Distribution, revenue and attribution

### Links

- Website: https://councilof.ai
- API: https://councilof.ai/api/gspc
- MCP: https://councilof.ai/mcp
- HuggingFace: https://huggingface.co/csoai
- Kaggle: https://www.kaggle.com/nicktempleman
