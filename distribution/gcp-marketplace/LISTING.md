# GSPC — Google Cloud Marketplace AI agent listing kit (A2A)

RENDERED, NOT SUBMITTED. Owner steps: GCP vendor onboarding, then the Producer Portal AI-agent offer.

- Agent Card: `agent-card.json` in this folder is byte-identical to https://councilof.ai/.well-known/agent-card.json (check.mjs holds them equal).
  Upload it to the Cloud Storage bucket the Producer Portal names.
- A2A interface: https://councilof.ai/api/a2a (JSONRPC, A2A 1.0).
- Skills (11): `gspc-board`, `east-west-crosswalk`, `measured-badge`, `benchmark-quality-register`, `article50-detect`, `eu-ai-act-screen`, `x402-discovery`, `estate-index`, `measurement-capsules`, `server-evidence`, `evidence-bundle`.
- Signature: 1 AgentCardSignature(s) (JWS over the A2A §8.4 signing input); verify with scripts/verify_agent_card_jws.py.
- Pricing: free listing. Paid evidence stays on x402 per delivered work, outside the Marketplace; no price appears in the listing.
- Name: GSPC. Category: AI agents (A2A). Support: https://councilof.ai/contact/. Privacy: https://councilof.ai/privacy/.

Measurement, not certification: every answer is evidence with its state (VALID, INVALID, UNCHECKABLE, UNMEASURED, NOT_MEASURED, UNREACHABLE), never a grade, mark or status. Doctrine sha256 845fc1d200eb9e867fc8d682750409d6725084bac632726187759f8fefdfbe0a (https://councilof.ai/doctrine/).

Data: https://councilof.ai/api/gspc · Corrections ledger: https://councilof.ai/corrections/ (JSON: https://councilof.ai/api/corrections) · Verify a card, free: https://councilof.ai/gspc-verify/
