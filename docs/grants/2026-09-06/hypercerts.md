# Hypercerts — evidence records, not money (06 Sep 2026)

## What hypercerts are today (read 06 Sep)
- https://docs.hypercerts.org/getting-started/quickstart: hypercerts are **AT-Protocol records**
  (`org.hypercerts.claim.activity`) stored on a Personal Data Server. Sign up at https://certified.app
  (live, → /welcome) or use any Bluesky/ATProto account. Guided UI: https://hypercerts-scaffold.vercel.app
  (live). **"No on-chain component … no blockchain fees."**
- Data model (https://docs.hypercerts.org/core-concepts/hypercerts-core-data-model): activity claim +
  `org.hypercerts.context.attachment` (URLs/IPFS evidence), `context.measurement`, `context.evaluation`,
  `collection`; strong references (AT-URI + CID) make later edits detectable.
- The older ERC-1155 flow still exists: https://app.hypercerts.org (307 → /explore), contracts on
  Celo, Optimism and Base (hypercerts-org/hypercerts README), metadata schema
  `sdk/src/resources/schema/metadata.json` + `claimdata.json` (cached in `hypercerts/fixtures/`). Minting
  there costs gas only — an owner wallet action; not done.

## What was produced
`scripts/grants/hypercert_metadata_from_cards.py` — deterministic, reads only repo files
(`SETTLED-DOORS-2026-09-06.md`, the census summary, the cached `/api/gspc`, `public/root.json`,
`public/interop/index.json`, the Datatracker record), validates against both cached schemas and the cached
lexicon, lints for doctrine (no certification language, no prices, no processor names, evidence URIs
only from councilof.ai / the repo / doi.org / IETF / basescan / ORCID), and writes:

| Hypercert | Maps to | Key evidence |
|---|---|---|
| `signed-cards-public-root` | 166 signed cards under one root | root.json, /api/gspc, did.json |
| `doi-methodology-and-snapshot` | DOI dataset | 10.5281/zenodo.21991104, 22344048 |
| `ietf-scitt-framing-space` | IETF interop row | datatracker draft-templeman-scitt-framing-space-00 |
| `x402-buyer-side-census` | census dataset | PR #1589 files, SETTLED-DOORS, basescan tx |
| `interop-format-index` | 372-format index | /interop/index.json |

Each exists twice: ERC-1155 metadata (`hypercerts/<slug>.json`) and an ATProto activity record
(`hypercerts/atproto/<slug>.json`). `--check` exits 1 if a regeneration would change bytes.

## What we will NOT claim
A hypercert is a self-declared claim of work; it is not an evaluation. The records say "measurement,
not a certificate", state one_number = 0, and call the settlement a self-settlement. No impact beyond
"anyone can verify" is asserted.

## Owner path
Nothing needs a wallet. If wanted: create the certified.app account (or use an existing Bluesky
handle), open the scaffold app, paste each `atproto/*.json` record and its evidence attachments, and
record the resulting AT-URIs in `hypercerts/README.md`. Funders that read hypercerts (Gitcoin rounds,
Octant evaluators) then have a stable reference. Money type: none.
