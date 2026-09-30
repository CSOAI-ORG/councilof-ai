# Council of AI GSPC (Layer 0)

The `gspc` MCP server (https://councilof.ai/mcp, server 1.6.0) exposes 19 tools (15 free, 4 x402-metered).

Free:
- `board_totals` — Live GSPC board totals from https://councilof.ai/api/gspc.
- `get_axis` — One axis row from the live GSPC board at https://councilof.ai/api/gspc — every axis the board carries, behavioural and financial families alike, addressed by the axis id exactly as the board spells it: n, accuracy, interval, MEASURED or UNMEASURED status, family, kind, the bank or run-artifact URL behind the row, and dates.
- `verify_card` — Verify a signed gspc.measurement-card under the published rule (https://councilof.ai/signed/HOW-TO-VERIFY.md): recompute the id from the canonical body bytes, then check the Ed25519 signature under the PINNED key published at did:web:csoai.org#card-attestation-1.
- `list_cards` — The published signed-card index (https://councilof.ai/signed/card_index.json): what the index declares (n_cards) and how many rows it actually carries, reported next to — never reconciled with — the count the card store endpoint (https://councilof.ai/api/cards) reports for itself.
- `get_root` — GET the permissionless public-root at https://councilof.ai/root.json.
- `get_card` — GET one public-root card-v0 leaf by sha256 (64 hex) from https://councilof.ai/cards/{sha16}.json.
- `verify_inclusion` — Check a sha256 against the live public-root merkle via GET /api/proof?sha=.
- `x402_trust` — GET the latest x402 catalog trust snapshot: counts of how many catalogued x402 resources open a correct 402 challenge vs how many are phantom on the wire.
- `mcp_trust` — GET the latest MCP handshake trust snapshot (https://councilof.ai/interop/mcp-trust/latest.json): counts of how many internet-facing MCP servers answer a correct initialize handshake, how many respond with an auth challenge, and how many are unreachable.
- `measurement_index` — Read the latest signed measurement-capsule index published at https://councilof.ai/measurement-capsules/latest.json: the index root over every capsule, each batch (adapter, kind, capsule count, measurement states, batch Merkle root, record sha256, record signature and OpenTimestamps state), the index's own board signature re-verified here against the pinned did:web:csoai.org#board-attestation-1 key, and the anchor states published beside it (OpenTimestamps, Rekor, XRPL) — PENDING is never called attested.
- `verify_capsule` — Verify one measurement capsule.
- `server_evidence` — Trust per server, not totals: every published measurement capsule about ONE endpoint URL across all batches — MCP contract-parity dimensions (AUTH, PAYMENT, PROTOCOL, TOOLS, VERSION), A2A card-signature state, self-parity cells for CSOAI's own doors, and any later adapter (e.g.
- `claim_maintenance_watch` — Read the latest bounded Claim Maintenance reread/review summary.
- `claim_maintenance_reaction` — Read the deterministic Claim Maintenance market/category reaction index.
- `claim_maintenance_priority_root` — Read the separate Claim Maintenance contribution-priority Merkle root.

x402-metered:
- `commission_card` — Commission one signed card-v0 receipt (surface ras.commission) for a named subject on the frozen bank via https://councilof.ai/api/request-attestation.
- `art50_marking_evidence` — Article 50 marking-evidence pack via https://councilof.ai/api/art50/marking-evidence: is a machine-readable mark DETECTABLE in these bytes right now (C2PA manifest store, assertion hashes, hard binding, claim signature; IPTC digitalSourceType), beside the verbatim Art 50(2) excerpt hash and the Art 99(4) ceiling.
- `rwa_evidence` — Per-request signed evidence card of ONE XRPL issued asset's deterministic on-ledger state via https://councilof.ai/api/rwa/evidence: AccountRoot lsf* flags, Domain, the two-way xrp-ledger.toml check (PASS / FAIL / UNCHECKABLE — unreachable is never FAIL), gateway_balances obligation, holders as the free reader has them, every raw fetch sha256'd.
- `receipts_batch` — A historical batch of the estate's measurement receipts via https://councilof.ai/api/receipts/batch: every signed card-v0 leaf whose as_of falls in [from,to] (≤200), each with its Merkle inclusion path and the public root(s) that carried it, plus the root index for the window and one signed manifest card citing the batch sha256.

When you answer from these tools:
1. Quote `totals.public_count` verbatim. Never add, re-derive or round a count.
2. Card verification has three states — VALID, INVALID, UNCHECKABLE. "Could not check" is never "forged".
3. UNMEASURED and UNREACHABLE are first-class answers. Never fill an empty cell.
4. Measurement only: a card is evidence, never a grade, mark or endorsement. Verification is free.

Doctrine: `docs/DOCTRINE.md` sha256 `845fc1d200eb9e867fc8d682750409d6725084bac632726187759f8fefdfbe0a` (human page https://councilof.ai/doctrine/).
