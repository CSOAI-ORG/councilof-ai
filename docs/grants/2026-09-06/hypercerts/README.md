# Hypercert metadata for the estate's public artefacts — produced, not posted

Producer: `scripts/grants/hypercert_metadata_from_cards.py` (deterministic; `--check` in CI).
Nothing here has been posted to a PDS or minted on any chain. AT-URIs, if the owner posts them, go in the
table below.

| Slug | ERC-1155 metadata | ATProto record | Posted AT-URI |
|---|---|---|---|
| signed-cards-public-root | `signed-cards-public-root.json` | `atproto/signed-cards-public-root.json` | — |
| doi-methodology-and-snapshot | `doi-methodology-and-snapshot.json` | `atproto/doi-methodology-and-snapshot.json` | — |
| ietf-scitt-framing-space | `ietf-scitt-framing-space.json` | `atproto/ietf-scitt-framing-space.json` | — |
| x402-buyer-side-census | `x402-buyer-side-census.json` | `atproto/x402-buyer-side-census.json` | — |
| interop-format-index | `interop-format-index.json` | `atproto/interop-format-index.json` | — |

`fixtures/`: `api-gspc.json` (cached `/api/gspc`, 06 Sep 08:19Z), `ietf-draft.json` (Datatracker API
record), `hypercert-metadata.schema.json` + `hypercert-claimdata.schema.json` (hypercerts-org/hypercerts
`sdk/src/resources/schema`, fetched 06 Sep). Lexicon: `scripts/grants/hypercerts-lexicon/` from
hypercerts-org/hypercerts-lexicon `lexicons/org/hypercerts/…`, fetched 06 Sep 08:20Z.

Other inputs are live repo files: `public/root.json`, `public/interop/index.json`,
`docs/product/SETTLED-DOORS-2026-09-06.md`, `docs/product/x402-settlement-census-2026-09-06.summary.json`.
When any of them moves, re-run the producer and commit the diff.
