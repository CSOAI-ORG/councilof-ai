# Council of AI GSPC

Remote MCP: `https://councilof.ai/mcp` (streamable HTTP, no account, API key or OAuth)

This remote server lets an MCP client inspect the public GSPC measurement board, retrieve public
records, and verify Council-issued measurement cards. It exposes the same canonical HTTP contract
as the source in `mcp/gspc-server/`.

## Tools

Eight free tools require no account, key or payment:

- `board_totals` — read live board totals with their source kind and `as_of` date.
- `get_axis` — read one axis row, including sample size, interval and MEASURED/UNMEASURED state.
- `verify_card` — recompute a card ID and verify its Ed25519 signature under the pinned Council key.
- `list_cards` — compare the published card index with the card-store listing without reconciling them.
- `get_root` — read and validate the separately published public root.
- `get_card` — retrieve one card-v0 leaf by its SHA-256.
- `verify_inclusion` — check whether a SHA-256 is included in the public root.
- `x402_trust` — read the latest measured x402 catalog-trust snapshot.

Four optional x402-metered evidence tools are also discoverable:

- `commission_card`
- `art50_marking_evidence`
- `rwa_evidence`
- `receipts_batch`

Payment is explicit in the tool's `x_payment` argument. A schema-valid unpaid call returns
`PAYMENT_REQUIRED` with the route's challenge; it is not settlement, delivery or revenue.
`DELIVERED` is reserved for a successful response carrying the route's settlement evidence.
The package never invents a receipt or promotes a payment challenge into a result. The Article 50,
RWA and receipts tools also expose documented free preview modes; a commission does not.

## Connect

After Docker approves the listing, add **Council of AI GSPC** from Docker Desktop's MCP Toolkit to
an MCP profile, enable it, and run `tools/list`. Dynamic discovery must return the exact twelve
names above. Until then, any streamable-HTTP MCP client can connect directly to
`https://councilof.ai/mcp`; there is no Docker image or second runtime to install for this remote
entry.

## Evidence boundary

`verify_card` authenticates the Council-issued statement under a pinned public key. It does not
prove the measurement is correct, current or complete. UNMEASURED, UNREACHABLE and UNCHECKABLE are
first-class states rather than hidden zeros or automatic failures.

This is measurement, not certification. No conformity assessment is offered and a grade is never
sold. No tool determines legal compliance or supplies legal advice. Operator: CSOAI Ltd, UK
Companies House 16939677. Source: https://github.com/CSOAI-ORG/council-of-ai/tree/master/mcp/gspc-server
