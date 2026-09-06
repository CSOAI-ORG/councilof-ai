# CSOAI GSPC Measurement Board

Documentation: https://councilof.ai/llms.txt

A free, keyless MCP server over the GSPC measurement board — Governance · Safety · Provenance ·
Continuity. Seven read-only tools need no account, no key and no payment: `board_totals`,
`get_axis`, `verify_card`, `list_cards`, `get_root`, `get_card`, `verify_inclusion`. Four metered
tools (`commission_card`, `art50_marking_evidence`, `rwa_evidence`, `receipts_batch`) answer an
HTTP 402 challenge over the x402 rail; a 402 challenge is not settlement, delivery or revenue.

Every figure is derived from a signed artifact at request time rather than typed, and each
measurement links to the Ed25519 card behind it, verifiable offline. UNMEASURED is a first-class
state, never a hidden zero.

This is measurement, not certification. No conformity assessment is offered and a grade is never
sold. Operator: CSOAI Ltd, UK Companies House 16939677.
