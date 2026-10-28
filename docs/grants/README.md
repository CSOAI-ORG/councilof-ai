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
| **Key artefacts cited** | `root.json` (sha256 `74797e30...`, 303 cards, merkle `e4cc26d1...`), Rekor logIndex 2,791,822,965, OTS STAMPED_PENDING_BITCOIN, 335 signed chain entries, 354 MCP registry servers — **the figures this draft cited on 2026-09-15; superseded. Read the live values from the table below.** |

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

| Artefact | How to read it | Read on 2026-10-28 |
|---|---|---|
| Public Merkle root | `GET /root.json` → `merkle_root` | `a2620ac322c562b64f6b4935b283177d7cb7ada374eee100992f1b68c8539538` |
| Root.json SHA256 | SHA-256 over the served bytes | `e9fb00e240b11c1d31f138ad1248c8c211b56267360a092550d448903d9ce7ea` (25,925 B) |
| Cards under root | `GET /root.json` → `card_count` | 325 |
| Signed card corpus | `GET /signed/card_index.json` → `n_cards` | 335 |
| Corpus relation | `GET /api/state` → `signed_cards.corpus_relation` | SEPARATE_CORPORA, identifier overlap 0 |
| Board | `GET /api/gspc` → `totals.public_count` | 33 axes · 23 measured |
| Rekor | `GET /interop/root-witness-latest.json` → `witnesses.rekor` | WITNESSED, logIndex 3526124324 |
| OTS | `GET /interop/root-witness-latest.json` → `witnesses.ots` | CONFIRMED_BITCOIN, block 973461 |
| Revenue (external only) | `GET /api/revenue` → `one_number` | 3 distinct non-self payers, 4 settlements, 0.05 USDC |
| Company | `counters.json` | CSOAI Ltd, UK 16939677 |
| DID | `GET /.well-known/did.json` | `did:web:csoai.org#board-attestation-1` |

> **Read the live endpoint, not this table.** The column on the right is one observation, taken
> **2026-10-28**, not a value to copy. A funder who copies a stale number from an application
> answers a question about the past. Re-read the endpoint at submission time and cite the read
> date; every row above names the door that produces it.
>
> **What this table said before 2026-10-28.** It carried the root as of **2026-09-30** — merkle
> `47277a6f…`, sha256 `f1913eca…`, **25,513 B**, **319** cards, Rekor logIndex 3,012,420,819, OTS
> blocks 969264/969266/969288/969296 — and a board line reading "23 axes / 23 measured". Those
> values were accurate on 2026-10-07 and are kept here so a reader who saw them can see what
> changed. The current root's dated witness sidecar is
> `public/interop/root-witness-2026-10-27-e9fb00e2.json`, and its `latest` pointer is
> `public/interop/root-witness-latest.json`.

> **Corrected 2026-10-07.** Two rows were removed and must not be reinstated without a live source:
> (a) `Signed chain length = 335 | public/signed/chain.json → length` — that file is a single signed
> envelope with **no `length` field**; the citation was wrong (335 is `card_index.json → n_cards`).
> (b) `MCP registry servers = 354` — a count of *someone else's* registry, which `/api/state` does
> not establish and which could not be re-verified live; an external registry total is not ours to quote.
> `Rekor logIndex`, `OTS state` and `Revenue` previously cited `TUI-1-CANONICAL-STATE.json`, which
> went stale — they now cite the artefact/endpoint that produces them.
> All values are point-in-time **2026-10-07**; re-read the endpoint before submitting any application.

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

_Last updated: 2026-10-07 (stale artefact table corrected; two unsourced rows removed)_
