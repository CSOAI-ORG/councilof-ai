# Council of AI GSPC

Remote MCP: `https://councilof.ai/mcp` (streamable HTTP; no account, API key or OAuth). Server 1.4.4.

## Tools

47 free tools:

- `board_totals` — Live GSPC board totals from https://councilof.ai/api/gspc.
- `get_axis` — One axis row from the live GSPC board at https://councilof.ai/api/gspc — every axis the board carries, behavioural and financial families alike, addressed by the axis id exactly as the board spells it: n, accuracy, interval, MEASURED or UNMEASURED status, family, kind, the bank or run-artifact URL behind the row, and dates.
- `verify_card` — Verify a signed gspc.measurement-card under the published rule (https://councilof.ai/signed/HOW-TO-VERIFY.md): recompute the id from the canonical body bytes, then check the Ed25519 signature under a key PINNED in this verifier and published in the did:web:csoai.org DID document: #card-attestation-1 (the card key of the signed card index) or #card-attestation-2 (the card key added on rotation, 27 Sep 2026; a card names the key it was signed under), plus the board key for the cards it signed.
- `list_cards` — The published signed-card index (https://councilof.ai/signed/card_index.json): what the index declares (n_cards) and how many rows it actually carries, reported next to — never reconciled with — the count the card store endpoint (https://councilof.ai/api/cards) reports for itself.
- `get_root` — GET the permissionless public-root at https://councilof.ai/root.json.
- `get_card` — GET one public-root card-v0 leaf by sha256 (64 hex) from https://councilof.ai/cards/{sha16}.json.
- `verify_inclusion` — Check a sha256 against the live public-root merkle via GET /api/proof?sha=.
- `x402_trust` — GET the latest x402 catalog trust snapshot: counts of how many catalogued x402 resources open a correct 402 challenge vs how many are phantom on the wire.
- `mcp_trust` — GET the latest MCP handshake trust snapshot (https://councilof.ai/interop/mcp-trust/latest.json): counts of how many internet-facing MCP servers answer a correct initialize handshake, how many respond with an auth challenge, and how many are unreachable.
- `measurement_index` — Read the latest signed measurement-capsule index published at https://councilof.ai/measurement-capsules/latest.json: the index root over every capsule, each batch (adapter, kind, capsule count, measurement states, batch Merkle root, record sha256, record signature and OpenTimestamps state), the index's own board signature re-verified here against the pinned did:web:csoai.org#board-attestation-1 key, and the anchor states published beside it (OpenTimestamps, Rekor, XRPL) — PENDING is never called attested.
- `verify_capsule` — Verify one measurement capsule.
- `server_evidence` — Trust per server, not totals: every published measurement capsule about ONE endpoint URL across all batches — MCP contract-parity dimensions (AUTH, PAYMENT, PROTOCOL, TOOLS, VERSION), A2A card-signature state, self-parity cells for CSOAI's own doors, and any later adapter (e.g.
- `evidence_bundle_preview` — For ONE obligation (article-50, article-53 GPAI transparency, dora or cra) and an optional subject: the obligation record, its counsel-gate status and the already-signed measurement cards that are relevant to it (count plus the first cards, each with its verify link), read live from https://councilof.ai/api/evidence-bundle.
- `route` — GSPC Route (free, decide-only).
- `axis_governance` — The governance axis of the live GSPC board at https://councilof.ai/api/gspc — this tool IS the axis, so it takes no argument: n, accuracy, interval, MEASURED or UNMEASURED status, family, kind, the bank or run-artifact URL behind the row, and dates.
- `axis_safety` — The safety axis of the live GSPC board at https://councilof.ai/api/gspc — this tool IS the axis, so it takes no argument: n, accuracy, interval, MEASURED or UNMEASURED status, family, kind, the bank or run-artifact URL behind the row, and dates.
- `axis_provenance` — The provenance axis of the live GSPC board at https://councilof.ai/api/gspc — this tool IS the axis, so it takes no argument: n, accuracy, interval, MEASURED or UNMEASURED status, family, kind, the bank or run-artifact URL behind the row, and dates.
- `axis_continuity` — The continuity axis of the live GSPC board at https://councilof.ai/api/gspc — this tool IS the axis, so it takes no argument: n, accuracy, interval, MEASURED or UNMEASURED status, family, kind, the bank or run-artifact URL behind the row, and dates.
- `axis_conformance` — The conformance axis of the live GSPC board at https://councilof.ai/api/gspc — this tool IS the axis, so it takes no argument: n, accuracy, interval, MEASURED or UNMEASURED status, family, kind, the bank or run-artifact URL behind the row, and dates.
- `axis_openness` — The openness axis of the live GSPC board at https://councilof.ai/api/gspc — this tool IS the axis, so it takes no argument: n, accuracy, interval, MEASURED or UNMEASURED status, family, kind, the bank or run-artifact URL behind the row, and dates.
- `axis_machinery-conformity` — The machinery-conformity axis of the live GSPC board at https://councilof.ai/api/gspc — this tool IS the axis, so it takes no argument: n, accuracy, interval, MEASURED or UNMEASURED status, family, kind, the bank or run-artifact URL behind the row, and dates.
- `axis_care` — The care axis of the live GSPC board at https://councilof.ai/api/gspc — this tool IS the axis, so it takes no argument: n, accuracy, interval, MEASURED or UNMEASURED status, family, kind, the bank or run-artifact URL behind the row, and dates.
- `axis_cross-reality` — The cross-reality axis of the live GSPC board at https://councilof.ai/api/gspc — this tool IS the axis, so it takes no argument: n, accuracy, interval, MEASURED or UNMEASURED status, family, kind, the bank or run-artifact URL behind the row, and dates.
- `axis_detector-interop` — The detector-interop axis of the live GSPC board at https://councilof.ai/api/gspc — this tool IS the axis, so it takes no argument: n, accuracy, interval, MEASURED or UNMEASURED status, family, kind, the bank or run-artifact URL behind the row, and dates.
- `axis_art5-safeguard` — The art5-safeguard axis of the live GSPC board at https://councilof.ai/api/gspc — this tool IS the axis, so it takes no argument: n, accuracy, interval, MEASURED or UNMEASURED status, family, kind, the bank or run-artifact URL behind the row, and dates.
- `axis_swarm` — The swarm axis of the live GSPC board at https://councilof.ai/api/gspc — this tool IS the axis, so it takes no argument: n, accuracy, interval, MEASURED or UNMEASURED status, family, kind, the bank or run-artifact URL behind the row, and dates.
- `axis_affect` — The affect axis of the live GSPC board at https://councilof.ai/api/gspc — this tool IS the axis, so it takes no argument: n, accuracy, interval, MEASURED or UNMEASURED status, family, kind, the bank or run-artifact URL behind the row, and dates.
- `axis_jail` — The jail axis of the live GSPC board at https://councilof.ai/api/gspc — this tool IS the axis, so it takes no argument: n, accuracy, interval, MEASURED or UNMEASURED status, family, kind, the bank or run-artifact URL behind the row, and dates.
- `axis_effect-binding` — The effect-binding axis of the live GSPC board at https://councilof.ai/api/gspc — this tool IS the axis, so it takes no argument: n, accuracy, interval, MEASURED or UNMEASURED status, family, kind, the bank or run-artifact URL behind the row, and dates.
- `axis_provenance-controls` — The provenance-controls axis of the live GSPC board at https://councilof.ai/api/gspc — this tool IS the axis, so it takes no argument: n, accuracy, interval, MEASURED or UNMEASURED status, family, kind, the bank or run-artifact URL behind the row, and dates.
- `axis_reserve-attestation` — The reserve-attestation axis of the live GSPC board at https://councilof.ai/api/gspc — this tool IS the axis, so it takes no argument: n, accuracy, interval, MEASURED or UNMEASURED status, family, kind, the bank or run-artifact URL behind the row, and dates.
- `axis_regulatory-framework` — The regulatory-framework axis of the live GSPC board at https://councilof.ai/api/gspc — this tool IS the axis, so it takes no argument: n, accuracy, interval, MEASURED or UNMEASURED status, family, kind, the bank or run-artifact URL behind the row, and dates.
- `axis_distribution-integrity` — The distribution-integrity axis of the live GSPC board at https://councilof.ai/api/gspc — this tool IS the axis, so it takes no argument: n, accuracy, interval, MEASURED or UNMEASURED status, family, kind, the bank or run-artifact URL behind the row, and dates.
- `axis_custody-disclosure` — The custody-disclosure axis of the live GSPC board at https://councilof.ai/api/gspc — this tool IS the axis, so it takes no argument: n, accuracy, interval, MEASURED or UNMEASURED status, family, kind, the bank or run-artifact URL behind the row, and dates.
- `axis_ai-adoption-components` — The ai-adoption-components axis of the live GSPC board at https://councilof.ai/api/gspc — this tool IS the axis, so it takes no argument: n, accuracy, interval, MEASURED or UNMEASURED status, family, kind, the bank or run-artifact URL behind the row, and dates.
- `axis_labour-components` — The labour-components axis of the live GSPC board at https://councilof.ai/api/gspc — this tool IS the axis, so it takes no argument: n, accuracy, interval, MEASURED or UNMEASURED status, family, kind, the bank or run-artifact URL behind the row, and dates.
- `axis_humanoid-labour-index` — The humanoid-labour-index axis of the live GSPC board at https://councilof.ai/api/gspc — this tool IS the axis, so it takes no argument: n, accuracy, interval, MEASURED or UNMEASURED status, family, kind, the bank or run-artifact URL behind the row, and dates.
- `axis_lab-practice` — The lab-practice axis of the live GSPC board at https://councilof.ai/api/gspc — this tool IS the axis, so it takes no argument: n, accuracy, interval, MEASURED or UNMEASURED status, family, kind, the bank or run-artifact URL behind the row, and dates.
- `axis_company-practice` — The company-practice axis of the live GSPC board at https://councilof.ai/api/gspc — this tool IS the axis, so it takes no argument: n, accuracy, interval, MEASURED or UNMEASURED status, family, kind, the bank or run-artifact URL behind the row, and dates.
- `axis_measurer-integrity` — The measurer-integrity axis of the live GSPC board at https://councilof.ai/api/gspc — this tool IS the axis, so it takes no argument: n, accuracy, interval, MEASURED or UNMEASURED status, family, kind, the bank or run-artifact URL behind the row, and dates.
- `axis_harness-fidelity` — The harness-fidelity axis of the live GSPC board at https://councilof.ai/api/gspc — this tool IS the axis, so it takes no argument: n, accuracy, interval, MEASURED or UNMEASURED status, family, kind, the bank or run-artifact URL behind the row, and dates.
- `axis_interop-conformance` — The interop-conformance axis of the live GSPC board at https://councilof.ai/api/gspc — this tool IS the axis, so it takes no argument: n, accuracy, interval, MEASURED or UNMEASURED status, family, kind, the bank or run-artifact URL behind the row, and dates.
- `axis_humanoid-deployment` — The humanoid-deployment axis of the live GSPC board at https://councilof.ai/api/gspc — this tool IS the axis, so it takes no argument: n, accuracy, interval, MEASURED or UNMEASURED status, family, kind, the bank or run-artifact URL behind the row, and dates.
- `axis_regulator-transparency` — The regulator-transparency axis of the live GSPC board at https://councilof.ai/api/gspc — this tool IS the axis, so it takes no argument: n, accuracy, interval, MEASURED or UNMEASURED status, family, kind, the bank or run-artifact URL behind the row, and dates.
- `axis_interpretability-reproducibility` — The interpretability-reproducibility axis of the live GSPC board at https://councilof.ai/api/gspc — this tool IS the axis, so it takes no argument: n, accuracy, interval, MEASURED or UNMEASURED status, family, kind, the bank or run-artifact URL behind the row, and dates.
- `axis_claim-maintenance` — The claim-maintenance axis of the live GSPC board at https://councilof.ai/api/gspc — this tool IS the axis, so it takes no argument: n, accuracy, interval, MEASURED or UNMEASURED status, family, kind, the bank or run-artifact URL behind the row, and dates.
- `axis_serving-fidelity` — The serving-fidelity axis of the live GSPC board at https://councilof.ai/api/gspc — this tool IS the axis, so it takes no argument: n, accuracy, interval, MEASURED or UNMEASURED status, family, kind, the bank or run-artifact URL behind the row, and dates.

Five optional x402-metered evidence tools (payment is the explicit `x_payment` argument; an unpaid call
returns the challenge, which is not settlement, delivery or revenue):

- `commission_card` — Commission one signed card-v0 receipt (surface ras.commission) for a named subject on the frozen bank via https://councilof.ai/api/request-attestation.
- `art50_marking_evidence` — Article 50 marking-evidence pack via https://councilof.ai/api/art50/marking-evidence: which machine-readable marks the named methods DETECT in these bytes right now.
- `rwa_evidence` — Per-request signed evidence card of ONE XRPL issued asset's deterministic on-ledger state via https://councilof.ai/api/rwa/evidence: AccountRoot lsf* flags, Domain, the two-way xrp-ledger.toml check (PASS / FAIL / UNCHECKABLE — unreachable is never FAIL), gateway_balances obligation, holders as the free reader has them, every raw fetch sha256'd.
- `receipts_batch` — A historical batch of the estate's measurement receipts via https://councilof.ai/api/receipts/batch: every signed card-v0 leaf whose as_of falls in [from,to] (≤200), each with its Merkle inclusion path and the public root(s) that carried it, plus the root index for the window and one manifest card citing the batch sha256.
- `evidence_bundle` — For ONE obligation (article-50, article-53 GPAI transparency, dora or cra) and an optional subject via https://councilof.ai/api/evidence-bundle: selected existing card objects with signature fields and any retained inclusion proofs, an OSCAL assessment-results wrapper and an assembly manifest.

`tools/list` must return exactly these 52 names.

## Evidence boundary

`verify_card` authenticates a Council-issued statement under a pinned public key. It does not prove the
measurement is correct, current or complete. UNMEASURED, UNREACHABLE and UNCHECKABLE are first-class states.
Measurement only: a card is evidence, never a grade, mark or endorsement. Verification is free. No tool determines legal compliance.

Data: https://councilof.ai/api/gspc · Corrections ledger: https://councilof.ai/corrections/ (JSON: https://councilof.ai/api/corrections) · Verify a card, free: https://councilof.ai/gspc-verify/

Operator: CSOAI Ltd, UK Companies House 16939677. Doctrine: `docs/DOCTRINE.md` sha256 `845fc1d200eb9e867fc8d682750409d6725084bac632726187759f8fefdfbe0a` (human page https://councilof.ai/doctrine/).
