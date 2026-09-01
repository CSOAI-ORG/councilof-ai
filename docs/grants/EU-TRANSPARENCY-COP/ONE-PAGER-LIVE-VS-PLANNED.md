# Live vs planned — Transparency CoP (one page)

CSOAI Ltd (UK 16939677). Independent **measurement** body. Not a certifier. Not a GPAI model lab. Not a deepfake news publisher.

Product to describe: **measurement provenance + verify**. Free in the EU. Surface: https://councilof.ai/gspc-verify

## We are / we are not

| We are | We are not |
|---|---|
| A **tool** for provenance + verify (Ed25519 cards) | A GPAI model provider |
| Eligible (FAQ) as **technology provider of marking and detection solutions**, tools on the EU market **free of charge** | A signatory of the **GPAI** Code |
| Bound only to what we actually ship | A Section 2 deployer (deepfakes / public-interest news text) |

FAQ (29 July 2026): Section 1 *may* also be signed by technology providers of marking, provenance, watermarking and/or detection tools placed on the EU market, payment or free.

## Live (shipped, stranger-checkable)

- Signed GSPC measurement cards (Ed25519, `#card-attestation-1`)
- Browser verify: https://councilof.ai/gspc-verify — three states **VALID / INVALID / UNCHECKABLE**
- Live board: `GET https://councilof.ai/api/gspc` — **22 slots · 15 measured · 7 UNMEASURED** (empty cells stay empty)
- MCP four tools at https://councilof.ai/mcp (`board_totals`, `get_axis`, `verify_card`, `list_cards`)
- Doctrine: https://councilof.ai/doctrine (after #911 deploy)
- Claims register CR-012: C2PA **planned**, not shipped

## Planned (do not tick as shipped)

- **C2PA manifests / CAI conformance** — CR-012: “Contributor, conformance in progress. Artefacts today carry Ed25519 provenance, not C2PA conformance.” `/methodology` says the same.
- HMAC text “attestations” **≠ C2PA**. Do not describe HMAC as machine-readable Art 50(2) marks.
- Split-key 2-of-3 (`#board-attestation-2`) — **UNCHECKABLE** until TUI 1 ceremony. Do not print SIGNED for that path.
- Full Art 50(2) machine-readable marking of **synthetic audio/image/video/text we generate** — we are not that provider.

## Tick / don’t tick

- **Do** describe a free EU-market **detection / provenance / verify** tool.
- **Do not** tick boxes that promise C2PA or other machine-readable **media marks on generative outputs** until TUI 3 lands C2PA and this page is updated to **live**.
- **Do not** sign Section 2 (deployer / deepfake labelling).
- **Do not** sign the GPAI Code of Practice.
- FAQ: each **section** of the Transparency Code is signed **as a whole**. If Section 1 as a whole requires marking generative media we do not emit, **do not sign Section 1** until the form’s tool-provider commitments match what we ship, or until C2PA is live.

Owner does not send the form until this page is true. HMAC is not C2PA. UNMEASURED stays UNMEASURED.
