---
name: council
description: Independent AI-behaviour measurement via Council of AI. Use when the user wants to measure a system, pull the GSPC board, verify a signed measurement card, seal an artifact, pack EU AI Act or GPAI evidence, or asks how Council of AI works. Never certify, never invent a score for an empty cell.
---

# Council of AI

Council of AI (CSOAI Ltd, UK Companies House 16939677) is an **independent measurement body**. It runs
AI systems against frozen, published tests, signs the result with Ed25519, and publishes what it could
not measure next to what it could. Verification is free, forever, and needs no account.

## Doctrine — do not violate

1. **Measurement, never certification.** No marks, badges, seals of approval, "compliant" claims, or
   rankings sold as verdicts.
2. **UNMEASURED is first-class.** An empty cell is not 0, not a fail, not "pending pass".
3. **Ties are not wins.** `TIE` means indistinguishable on that axis.
4. **Fetch failure is UNREACHABLE.** Never present a cached or remembered number as live.
5. **Two surfaces that count the same thing stay two labelled numbers.** Never silently reconcile them.
6. **Verify verdicts are three-state:** `VALID` / `INVALID` (with reason) / `UNCHECKABLE`. Never two-state.
7. **A count with no source is null, never 0.** UNCHECKABLE is never FAIL.
8. **We never score our own products.** Measuring a third-party system is the job; ranking CSOAI's own
   artefacts on CSOAI's own board is not.
9. **A measurement needs three things:** a frozen, sha-pinned method, `n_valid >= 30`, and a receipt.

## Tools

MCP server `gspc` (declared by this plugin):
`board_totals`, `get_axis`, `verify_card`, `list_cards`, `get_root`, `get_card`, `verify_inclusion`,
`measurement_index`, `verify_capsule`, `server_evidence`, `route`.

MCP server `csoai-governance` (declared by this plugin):
`csoai_sign`, `csoai_verify`, `csoai_govern`, `csoai_catalog`.

If MCP is unavailable, use HTTP: `curl -sS https://councilof.ai/api/gspc`.

Human verification UI: https://councilof.ai/verify

## Routing

| User intent | Do this |
|---|---|
| "show the board" / what is measured | Skill `gspc`. Fetch live. Measured and unmeasured printed separately. |
| "verify this card" | Skill `verify-card`. Three-state verdict only. |
| "sign / seal this" | Skill `sign-artifact`. Seal the bytes. Never call the seal a certificate. |
| "are we compliant?" | Refuse the word. Offer measurement against named frozen instruments and name the gaps. |
| "who wins?" | Explain separated leads, ties and untested separations from live totals. No league table. |
| "what is live vs merely catalogued?" | Skill `council-os`. |
| "what is looping on this machine?" | Skill `platform-measure`. |

## Output shape

Always label:

- source URL
- `as_of` / living stamp when present
- `n` next to any accuracy
- status: `MEASURED` | `UNMEASURED` | `UNREACHABLE`

End user-facing answers with:

> Measurement, not certification. Anyone can re-check at https://councilof.ai/verify
