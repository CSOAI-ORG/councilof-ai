# Koi lineage certificate — RAS hook spec (TUI-6)

**Status:** spec only. Not built. Not a product page. Not a certificate of quality.

koikeeper.co.uk is a live store. This document is the RAS wedge: a **signed measurement card per fish**, same dialect as GSPC card-v0, so a sale event can carry a re-checkable receipt instead of a PDF claim.

## What the card attests

| Field | Meaning | Never |
|---|---|---|
| `kind` | `csoai.koi-lineage/0.1` | breed quality, health, investment |
| `subject` | fish id on koikeeper (stable, not the sale listing URL) | |
| `breeder` | named string + optional did:web | pedigree as biological truth |
| `bloodline` | declared line, THIN unless a parent card is linked | |
| `photo_sha256[]` | hashes of the photos shown at listing time | that the fish "looks like" the photos later |
| `events[]` | append-only `{as_of, kind: listed\|sold\|withdrawn, tx?}` | title transfer under law |

## How it is issued

1. Unsigned artifact in the publisher queue (this TUI never signs).
2. GHA publisher signs Ed25519 like every other card.
3. Leaf in the next public root. Free inclusion: `GET /api/proof?sha=`.
4. Store page links the card + `/receipt` with that sha.

## Out of scope (cage)

- No token, no NFT mint, no royalty split on-chain until EP9 is explicit.
- No "certified koi". Measurement of declared lineage bytes, not a kennel club.
- No seat pricing. Data free; a paid bundle is history assembly (`receipts/batch`), never a grade.

## Nick's post-EP1 act

Wire koikeeper listing template: photo → hash → unsigned JSON → queue. One fish, one card, one root leaf.
