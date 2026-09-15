# Grant Applications — Index and Status Tracker

> **Source of truth:** `grants.csv` (append-only, one row per application).
> This README is a human-readable companion. Update both files when status changes.

---

## Active Applications

### 1. NLnet NGI0 — 15 September 2026

| Field | Value |
|---|---|
| **File** | `nlnet-application-2026-09-15.md` |
| **Body** | NLnet Foundation (NGI0 / Restack / CodeSupply) |
| **Amount** | EUR 75,000 |
| **Status** | DRAFT — NOT SUBMITTED |
| **Deadline** | Rolling (check nlnet.nl for current call) |
| **Next step** | Owner rewrites all fields in own voice; confirms UK eligibility for chosen fund; generates and publishes OpenPGP key |
| **Key artefacts cited** | `root.json` (sha256 `74797e30...`, 303 cards, merkle `e4cc26d1...`), Rekor logIndex 2,791,822,965, OTS STAMPED_PENDING_BITCOIN, 335 signed chain entries, 354 MCP registry servers |

### 2. Hypercerts Impact Claim — 15 September 2026

| Field | Value |
|---|---|
| **File** | `hypercerts-application-2026-09-15.md` |
| **Body** | Hypercerts protocol (ERC-1155 metadata / ATProto) |
| **Amount** | None (impact claim, not a grant application) |
| **Status** | DRAFT — NOT POSTED / NOT MINTED |
| **Next step** | Owner reviews metadata; optionally posts to ATProto PDS or mints on-chain |
| **Key artefacts cited** | Same as NLnet plus x402 pay-to address, signing pubkey, DID |

### 3. NLnet NGI0 — 5 November 2026 (earlier draft)

| Field | Value |
|---|---|
| **File** | `nlnet-2026-11.md` |
| **Body** | NLnet Foundation |
| **Amount** | EUR 32,000 |
| **Status** | NOT SUBMITTED (confirmed: no NLnet correspondence in mailbox) |
| **Note** | Earlier draft with different scope (anchoring + verifier only, 5 WPs). Superseded by `nlnet-application-2026-09-15.md` which adds WP4 recomputation harness and WP6 project management |

---

## Completed / Resolved Applications

See `grants.csv` for the full ledger. Highlights:

| Date | Body | Amount | Status | Notes |
|---|---|---|---|---|
| 2026-09-06 | Sovereign Tech Fund | EUR 84,000 | READY-owner-creates-account | Rolling; scope = verifiers + root v2 + audit |
| 2026-09-06 | Hypercerts (earlier) | None | PRODUCED-not-posted | 5 records in both schemas from `scripts/grants/hypercert_metadata_from_cards.py` |
| 2026-09-06 | GitHub Secure Open Source Fund | USD 10,000 | READY-owner-form | Rolling; Microsoft Form |
| 2026-09-06 | Transformative AI Fund (EA Funds) | USD 30-60k | READY-owner-form | Always open; paperform |
| 2026-09-06 | Base Builder Rewards | Weekly ETH | OWNER-DECIDES | Sept 2026 league unverified |
| 2026-09-05 | CCS/GCA RM6200 AI DPS | Free listing | READY-owner-password-account | Open to 2029-02-23 |
| 2026-09-05 | Circle testnet faucet | 20 testnet USDC | READY-no-account | Proves x402 facilitator on testnet |
| 2026-08-29 | DIGITAL-2026-AI-DATA-10 | EUR 2-5M | DRAFT-NOT-SUBMITTED | UK association gap |
| 2026-08-29 | NVIDIA Inception | Credits | DRAFT-OWNER-CLICKS | Owner applies |
| 2026-08-29 | Anthropic Claude for Startups | Credits | DRAFT-OWNER-CLICKS | No invented VC |
| 2026-08-29 | Google for Startups Cloud | ~$2k (Start) | DRAFT-OWNER-CLICKS | Honest tier |

---

## Rejected / Not-Fit

| Date | Body | Reason |
|---|---|---|
| 2026-09-06 | Optimism Retro Funding | No door (Atlas shut 18 Sep 2026) |
| 2026-09-06 | Deep Funding | Not reachable (0 deps.dev dependents) |
| 2026-09-05 | Gitcoin Grants | No open round (GG24 ended, GG25 unannounced) |
| 2026-09-05 | Optimism Governance Fund | No contracts on OP chain |
| 2026-08-29 | Filecoin Foundation | IPFS for certificate PDFs not confirmed |
| 2026-08-29 | OASIS CoSAI | Different letters; do not impersonate |
| 2026-08-29 | UK Games Fund | Gaming not mixed into measurement |

---

## Artifacts Common to All Applications

Every grant application in this directory cites these verifiable artefacts:

| Artefact | Current value | Source file | Live endpoint |
|---|---|---|---|
| Public Merkle root | `e4cc26d16e9b6827dacdc88c0a527676831ad106151b5acff33659636c6cc03d` | `public/root.json` | `GET /root.json` |
| Root.json SHA256 | `74797e30d6d98267e5ab4c8e275b135235fdf1afc6eee6b5c1f00537c41b751b` | Computed | `shasum -a 256 public/root.json` |
| Cards under root | 303 | `public/root.json` → `card_count` | `GET /root.json` |
| Signed chain length | 335 | `public/signed/chain.json` → `length` | `GET /signed/chain.json` |
| Board | 22 axes / 22 measured | `canon.json` | `GET /api/gspc` |
| Rekor logIndex | 2,791,822,965 | `TUI-1-CANONICAL-STATE.json` | — |
| OTS state | STAMPED_PENDING_BITCOIN | `TUI-1-CANONICAL-STATE.json` | — |
| Revenue | $0.00 external | `TUI-1-CANONICAL-STATE.json` | `GET /api/revenue` |
| MCP registry servers | 354 | `TUI-1-CANONICAL-STATE.json` | `registry.modelcontextprotocol.io` |
| Company | CSOAI Ltd, UK 16939677 | `counters.json` | Companies House |
| DID | `did:web:csoai.org#board-attestation-1` | `public/root.json` | `GET /.well-known/did.json` |

---

## Process Notes

1. **No fabricated figures.** Every number in every application must trace to a live endpoint
   or a pinned file with a commit hash.
2. **Self-settlements excluded.** Revenue figures never count internal test settlements.
3. **AI disclosure required.** NLnet and some other funders require disclosure of AI-assisted
   drafting. Always fill this honestly.
4. **Owner submits.** Grant lanes draft; the owner reviews and submits. No lane sends
   on its own authority.
5. **Update `grants.csv`** when any status changes. This README and the CSV must agree.

---

_Last updated: 2026-09-15_
