# ANCHORS TRUTH TABLE — what is anchored, what one anchor adds, what is never claimed
CSOAI Ltd · 2026-09-01 · every row below was verified in bytes on this date (bytes adjudicate)

## 1. Anchored TODAY (verified 2026-09-01)

| anchor | state | bytes checked |
|---|---|---|
| Per-card Ed25519 signatures | **LIVE.** 335/335 cards in `https://councilof.ai/signed/card_index.json` (`n_cards == n_cells == 335`), each signed under `did:web:csoai.org#card-attestation-1`, hash-chain head `66856aca…`. | index fetched; sample card bodies fetched; every card carries `alg=Ed25519`, `sig`, `pubkey`, `card_url`. |
| `did:web:csoai.org` document | **RESOLVES.** `https://csoai.org/.well-known/did.json` publishes 4 verification methods: `#site-release-1`, `#estate-chain-1`, `#board-attestation-1`, `#card-attestation-1`. The `#card-attestation-1` JWK decodes to pubkey `d4cb0eaa…` — byte-identical to the card index `pubkey`. | JWK x decoded and compared to index pubkey: match. |
| Signed public root (councilof.ai) | **SIGNED.** `https://councilof.ai/root.json` is a `csoai.public-root/v0` envelope, `as_of 2026-09-01T04:03:48Z`, `merkle_root d438fb12…` over `card_count=43` card shas, signed under `did:web:csoai.org#board-attestation-1`. The Ed25519 signature **verifies VALID** against the DID-published key over the canonical (sorted-key, compact) JSON of `{kind, schema, as_of, merkle_root, card_count, did_intended}`. Scope note: this root binds the 43 public-root leaves (public XRPL instruments + public notices — coverage harvest, per its own `language` field), not the whole 335-card index. | envelope fetched; signature cryptographically verified locally against the DID key. |
| csoai.org root twin | **STALE (issue #1010).** `https://csoai.org/root.json` serves `as_of 2026-09-01T01:48:00Z`, different merkle (`4a9a5036…`), and **no signature field**. Until re-published, councilof.ai/root.json is the signed root; the twin is a finding, not an anchor. | both roots fetched and diffed. |
| XRPL reader | **READER ONLY.** `GET /api/xrpl` serves 16 live instruments (`xrpl_fi_assetCount=16` echoed in the root envelope). `writes_board=false` — the reader never writes the board. | root envelope fields; live lid doctrine. |
| Board counts | **LIVE FROM API.** `GET /api/gspc` → `public_count` "22 axis · 15 measured", composed of 14 `model-comparison` + 1 measured financial fact + 7 empty/UNMEASURED financial slots (derived from the payload's `axes[].status`, never typed). Quote both numbers. Empty cells stay empty. Never a bare 22/22. | payload fetched; kinds counted. |

## 2. What the signed root ANCHORS NEXT (planned, in order — none claimed until the bytes exist)

1. **OpenTimestamps → Bitcoin** of the signed `root.json` (the SCITT time-anchor pattern). Per the standing correction, `timestamp_authority` was "none" and OTS/RFC-3161 anchoring was publicly corrected as not-yet-real — it stays PLANNED until an actual `.ots` proof for the signed root exists and is published. One OTS stamp of one signed root time-anchors every leaf under its merkle root at once.
2. **XRPL DID binding** — bind `did:web:csoai.org` on-ledger. PoC-legal per the standing position; real security posture needs sandbox/counsel.
3. **One future ERC-8004 Validation Registry write of the ROOT sha** — a single Validation write of a card/root sha, **never of a population**. Only after this exists may ERC-8004 explorers be pinged (C4 rule), and even then the claim is "one root sha validated", nothing more.

Each of these anchors the *root*; the root anchors its leaves via the merkle root; the leaves are the signed cards. Nothing about a census is anchored by any of it.

## 3. NEVER claimed

- **Per-population signing.** The OSS model census (68,869 rows frozen 2026-09-01, all DISCOVERED, n_measured=0), the hub listings (~3.03M, n_measured=0), and ERC-8004 identity registrations (787,431 reported by a third-party indexer at snapshot, mainnet 473,941 / testnet 314,906, with a 1,416 self-discrepancy in the indexer's own filters) are censuses. **Registered is not callable and not measured.** No script will ever sign, anchor, or write chain transactions for a population.
- **Certification.** Measurement, not certification. There is no certified badge and no gold badge. We are not a notified body.
- **The stale twin as an anchor**, an unsigned envelope as "sealed", or an intended DID method as a published one — intended ≠ published is a finding (B5.1), and today's finding is the csoai.org twin.

## Errata cited

- Refutation ledger: https://councilof.ai/refutation-ledger (public corrections, append-only).
- C-2026-0826-05 — MEASURED-INDEX-v0.1 withdrawn; the board stays honest via `GET /api/gspc`, never a restored sticker.
- OTS/RFC-3161 anchoring correction — imagery and copy claiming OpenTimestamps anchoring were rejected while `timestamp_authority: none`; the real anchor was Ed25519 + the SHA-256 hash chain. That correction is why §2.1 stays PLANNED until the `.ots` bytes exist.
- Withdrawn BFT consensus claim (n_eff≈1.21/3) — "designed 33-agent council", never "Byzantine fault-tolerant".
