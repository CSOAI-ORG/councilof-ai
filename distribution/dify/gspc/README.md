# GSPC for Dify

GSPC: read the live measurement board, verify Ed25519-signed measurement cards and capsules, and list the already-signed cards relevant to one obligation. 13 read-only tools, each a direct call to the free MCP door https://councilof.ai/mcp/free (no sign-in).
Dify can also add the same door with no plugin at all: Tools → MCP → Add MCP Server (HTTP) → https://councilof.ai/mcp/free.

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

RENDERED, NOT SUBMITTED: the Marketplace route is a PR of `gspc.difypkg` to langgenius/dify-plugins from a public account (owner step).

Measurement, not certification: every answer is evidence with its state (VALID, INVALID, UNCHECKABLE, UNMEASURED, NOT_MEASURED, UNREACHABLE), never a grade, mark or status. Doctrine sha256 845fc1d200eb9e867fc8d682750409d6725084bac632726187759f8fefdfbe0a (https://councilof.ai/doctrine/).

Data: https://councilof.ai/api/gspc · Corrections ledger: https://councilof.ai/corrections/ (JSON: https://councilof.ai/api/corrections) · Verify a card, free: https://councilof.ai/gspc-verify/
