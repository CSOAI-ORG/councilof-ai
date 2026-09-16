# Editor Pitch 4: The Information — "AI infrastructure, pre-revenue"

**Status: DRAFT. Not sent. The owner sends.**
**Target:** The Information — AI infrastructure, business of AI
**Angle:** Pre-revenue AI measurement infrastructure with working payment rail
**Verified:** All numbers carry proof commands.

---

**Subject line:** An AI measurement body with a working x402 payment rail — and 0.02 USDC in revenue

Hi [editor],

Council of AI is an AI measurement infrastructure company that has built the technical stack but has not yet found product-market fit. It has:

- 335 signed measurement cards across 22 axes
- A working x402 payment rail (USDC on Base)
- 13 MCP tools and 12 A2A agent cards
- 53 published corrections about itself
- One external payer who settled 0.02 USDC

```
curl -s https://councilof.ai/api/press.json | jq .commercial_evidence
# → 1 outside payer, 0.02 USDC, 10 self-settlements excluded
```

The honest state: pre-revenue. The company publishes its revenue ledger publicly, excludes self-settlements, and states "£0 ARR until first settled charge." The 0.02 USDC is from one external payer — not a business.

The infrastructure is real: OpenTimestamps anchoring, Sigstore Rekor inclusion proofs, DID-based signing, x402 payment protocol, MCP and A2A protocol surfaces. The question is whether anyone will pay for AI measurement.

This is a story about the gap between building infrastructure and finding customers. The company has built everything the V3 brief specified and is honest about the revenue state.

```
curl -s https://councilof.ai/api/revenue | jq .
# → settled_usdc, one_number
```

Happy to discuss the commercial strategy or provide access to the revenue ledger.

Nicholas Templeman
CSOAI Ltd
hello@councilof.ai
