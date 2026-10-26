# Council of AI GSPC

Remote MCP: `https://councilof.ai/mcp` (streamable HTTP, no account, API key or OAuth)

This remote server lets an MCP client inspect the public GSPC measurement board, retrieve public
records, and verify Council-issued measurement cards. It exposes the same canonical HTTP contract
as the source in `mcp/gspc-server/`.

## Tools

Forty-eight free tools require no account, key or payment:
Forty-eight free tools require no account, key or payment:

- `board_totals` — read live board totals with their source kind and `as_of` date.
- `get_axis` — read one axis row, including sample size, interval and MEASURED/UNMEASURED state.
- `verify_card` — recompute a card ID and verify its Ed25519 signature under the pinned Council key.
- `list_cards` — compare the published card index with the card-store listing without reconciling them.
- `get_root` — read and validate the separately published public root.
- `get_card` — retrieve one card-v0 leaf by its SHA-256.
- `verify_inclusion` — check whether a SHA-256 is included in the public root.
- `x402_trust` — read the latest measured x402 catalog-trust snapshot.
- `mcp_trust` — read the latest measured MCP catalog-trust snapshot.
- `measurement_index` — read the board-signed measurement-capsule index: batch roots, states, anchor states.
- `verify_capsule` — recompute one capsule's id and its Merkle inclusion under the signed index.
- `server_evidence` — every published capsule about one endpoint URL; an unknown URL is NOT_MEASURED.
- `evidence_bundle_preview` — the already-signed cards relevant to one obligation; observations, never a determination.
- `route` — GSPC Route, decide-only: your policy applied to published measurements; returns the chosen candidate and an unsigned route record. Routing is not ranking.
- `quote_dataset_version` — quote one published data/v1 dataset version: card count, Merkle root, snapshot file URLs and hashes, manifest sha256 (published and recomputed), citation and CC-BY-4.0 licence.

One free tool per GSPC board axis, named for the axis it answers. Each returns the live
board row for that axis, with the same fields `get_axis` returns:

- `axis_governance` — the governance axis of the live GSPC board: status, sample size, accuracy and interval, and the run behind it.
- `axis_safety` — the safety axis of the live GSPC board: status, sample size, accuracy and interval, and the run behind it.
- `axis_provenance` — the provenance axis of the live GSPC board: status, sample size, accuracy and interval, and the run behind it.
- `axis_continuity` — the continuity axis of the live GSPC board: status, sample size, accuracy and interval, and the run behind it.
- `axis_conformance` — the conformance axis of the live GSPC board: status, sample size, accuracy and interval, and the run behind it.
- `axis_openness` — the openness axis of the live GSPC board: status, sample size, accuracy and interval, and the run behind it.
- `axis_machinery-conformity` — the machinery-conformity axis of the live GSPC board: status, sample size, accuracy and interval, and the run behind it.
- `axis_care` — the care axis of the live GSPC board: status, sample size, accuracy and interval, and the run behind it.
- `axis_cross-reality` — the cross-reality axis of the live GSPC board: status, sample size, accuracy and interval, and the run behind it.
- `axis_detector-interop` — the detector-interop axis of the live GSPC board: status, sample size, accuracy and interval, and the run behind it.
- `axis_art5-safeguard` — the art5-safeguard axis of the live GSPC board: status, sample size, accuracy and interval, and the run behind it.
- `axis_swarm` — the swarm axis of the live GSPC board: status, sample size, accuracy and interval, and the run behind it.
- `axis_affect` — the affect axis of the live GSPC board: status, sample size, accuracy and interval, and the run behind it.
- `axis_jail` — the jail axis of the live GSPC board: status, sample size, accuracy and interval, and the run behind it.
- `axis_effect-binding` — the effect-binding axis of the live GSPC board: status, sample size, accuracy and interval, and the run behind it.
- `axis_provenance-controls` — the provenance-controls axis of the live GSPC board: status, sample size, accuracy and interval, and the run behind it.
- `axis_reserve-attestation` — the reserve-attestation axis of the live GSPC board: status, sample size, accuracy and interval, and the run behind it.
- `axis_regulatory-framework` — the regulatory-framework axis of the live GSPC board: status, sample size, accuracy and interval, and the run behind it.
- `axis_distribution-integrity` — the distribution-integrity axis of the live GSPC board: status, sample size, accuracy and interval, and the run behind it.
- `axis_custody-disclosure` — the custody-disclosure axis of the live GSPC board: status, sample size, accuracy and interval, and the run behind it.
- `axis_ai-adoption-components` — the ai-adoption-components axis of the live GSPC board: status, sample size, accuracy and interval, and the run behind it.
- `axis_labour-components` — the labour-components axis of the live GSPC board: status, sample size, accuracy and interval, and the run behind it.
- `axis_humanoid-labour-index` — the humanoid-labour-index axis of the live GSPC board: status, sample size, accuracy and interval, and the run behind it.
- `axis_lab-practice` — the lab-practice axis of the live GSPC board: status, sample size, accuracy and interval, and the run behind it.
- `axis_company-practice` — the company-practice axis of the live GSPC board: status, sample size, accuracy and interval, and the run behind it.
- `axis_measurer-integrity` — the measurer-integrity axis of the live GSPC board: status, sample size, accuracy and interval, and the run behind it.
- `axis_harness-fidelity` — the harness-fidelity axis of the live GSPC board: status, sample size, accuracy and interval, and the run behind it.
- `axis_interop-conformance` — the interop-conformance axis of the live GSPC board: status, sample size, accuracy and interval, and the run behind it.
- `axis_humanoid-deployment` — the humanoid-deployment axis of the live GSPC board: status, sample size, accuracy and interval, and the run behind it.
- `axis_regulator-transparency` — the regulator-transparency axis of the live GSPC board: status, sample size, accuracy and interval, and the run behind it.
- `axis_interpretability-reproducibility` — the interpretability-reproducibility axis of the live GSPC board: status, sample size, accuracy and interval, and the run behind it.
- `axis_claim-maintenance` — the claim-maintenance axis of the live GSPC board: status, sample size, accuracy and interval, and the run behind it.
- `axis_serving-fidelity` — the serving-fidelity axis of the live GSPC board: status, sample size, accuracy and interval, and the run behind it.

Five optional x402-metered evidence tools are also discoverable:

- `commission_card`
- `art50_marking_evidence`
- `rwa_evidence`
- `receipts_batch`
- `evidence_bundle`

Payment is explicit in the tool's `x_payment` argument. A schema-valid unpaid call returns
`PAYMENT_REQUIRED` with the route's challenge; it is not settlement, delivery or revenue.
`DELIVERED` means only that the route returned a 2xx deliverable. Its `delivery_kind` then separates
`PREVIEW_OR_FREE`, `DELIVERED_SETTLEMENT_UNCONFIRMED`, `DELIVERED_RECEIPT_GAP`, and
`DELIVERED_WITH_ROUTE_RECEIPT`. Even the last state reports an opaque route receipt as
`PRESENT_UNVERIFIED`; clients verify it separately. The package never invents a receipt or promotes a
payment challenge into a result. The Article 50, RWA and receipts tools also expose documented free
preview modes; a commission does not.

## Connect

After Docker approves the listing, add **Council of AI GSPC** from Docker Desktop's MCP Toolkit to
an MCP profile, enable it, and run `tools/list`. Dynamic discovery must return the exact sixteen
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
